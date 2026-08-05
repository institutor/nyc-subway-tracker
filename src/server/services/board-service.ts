import type {
  Alert, Arrival, BoardDecision, BoardDirection, BoardExplanation, Provenance, SecondaryArrival, Station,
} from '../../shared/domain/types';
import { compareCanonicalIdentity } from '../../shared/domain/canonical';
import { sanitizeOfficialText } from '../../shared/domain/alert-scope';
import { DEMONSTRATION_LABEL } from '../api/contracts';
import { projectPublicProvenance, toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
import type { SnapshotProvenance, SnapshotSourceHealth } from '../api/decision-snapshot';

export interface BoardFilters {
  readonly routeIds: readonly string[];
  readonly direction?: string;
}

export function buildBoardDto(
  board: BoardDecision,
  validThrough: string,
  filters: BoardFilters,
  sourceHealth: readonly SnapshotSourceHealth[],
  provenance: readonly SnapshotProvenance[],
) {
  const validUntil = isoString(validThrough);
  const directions = board.directions
    .filter((value) => filters.direction === undefined || value.direction === filters.direction)
    .map((value) => mapDirection(value, validUntil, filters.routeIds));
  const alerts = projectAlerts(relevantAlerts(board.alerts, board.station, filters.direction));
  return deepFreeze({
    station: {
      id: board.station.id,
      name: board.station.name,
      complexId: board.station.complexId,
      routeIds: [...board.station.routeIds],
    },
    mode: board.mode,
    directions,
    alerts,
    explanations: board.explanations.map(mapExplanation),
    sourceHealth: toSourceHealthDtos(sourceHealth),
    provenance: toProvenanceDtos(provenance),
    capabilities: { ...board.capabilities },
  });
}

export function buildStatusDto(
  boards: readonly BoardDecision[],
  stationId: string | undefined,
  routeIds: readonly string[],
  direction: string | undefined,
  sourceHealth: readonly SnapshotSourceHealth[],
  provenance: readonly SnapshotProvenance[],
) {
  const selected = stationId === undefined ? boards : boards.filter((board) => board.station.id === stationId);
  const scoped = stationId === undefined && routeIds.length > 0
    ? [
        ...selected
          .filter((board) => board.station.routeIds.some((routeId) => routeIds.includes(routeId)))
          .flatMap((board) => relevantAlerts(board.alerts, board.station, direction)
            .filter((alert) => alert.routeIds.length === 0
              || alert.routeIds.some((routeId) => routeIds.includes(routeId)))),
        ...selected.flatMap((board) => relevantAlerts(board.alerts, board.station, direction)
          .filter((alert) => alert.routeIds.length === 0 && alert.stationIds.length === 0)),
      ]
    : selected.flatMap((board) => relevantAlerts(board.alerts, board.station, direction));
  return deepFreeze({
    alerts: projectAlerts(scoped),
    sourceHealth: toSourceHealthDtos(sourceHealth),
    provenance: toProvenanceDtos(provenance),
    explanations: selected.flatMap((board) => board.explanations.map(mapExplanation)),
  });
}

function mapDirection(direction: BoardDirection, validThrough: string, routeIds: readonly string[]) {
  const accepts = (row: Arrival) => routeIds.length === 0 || routeIds.includes(row.route.id);
  return {
    direction: direction.direction,
    primary: direction.primary.filter(accepts).map((row) => mapArrival(row, validThrough)),
    secondary: direction.secondary.filter(accepts).map((row) => mapArrival(row, validThrough)),
    explanations: direction.explanations.map(mapExplanation),
  };
}

function mapArrival(row: Arrival | SecondaryArrival, validThrough: string) {
  const base = {
    id: row.id,
    kind: row.kind,
    route: { id: row.route.id, label: row.route.label },
    direction: row.direction,
    destination: row.destination,
    validThrough,
    demonstrationLabel: DEMONSTRATION_LABEL,
    provenance: mapDomainProvenance(row.provenance),
  };
  if (row.kind === 'live') return { ...base, displayAuthority: 'countdown' as const, at: dateIso(row.at) };
  if (row.kind === 'expected') return {
    ...base,
    displayAuthority: 'range' as const,
    estimateAt: dateIso(row.estimateAt),
    range: { startsAt: dateIso(row.range.startsAt), endsAt: dateIso(row.range.endsAt) },
  };
  if (row.kind === 'scheduled') return {
    ...base, displayAuthority: 'clock-time' as const, at: dateIso(row.at), serviceDate: row.serviceDate,
  };
  if (row.kind === 'holding') return {
    ...base, displayAuthority: 'status-only' as const, lastSupportedAt: dateIso(row.lastSupportedAt),
  };
  return {
    ...base,
    displayAuthority: 'status-only' as const,
    reason: publicPlainText(row.reason, 'Arrival confidence is unavailable.'),
  };
}

function mapAlert(alert: Alert) {
  return {
    id: alert.id,
    text: publicPlainText(alert.text, 'Service information is unavailable.'),
    activeFrom: dateIso(alert.activeFrom),
    ...(alert.activeUntil === undefined ? {} : { activeUntil: dateIso(alert.activeUntil) }),
    routeIds: [...alert.routeIds],
    stationIds: [...alert.stationIds],
    directions: [...alert.directions],
    demonstrationLabel: DEMONSTRATION_LABEL,
    provenance: mapDomainProvenance(alert.provenance),
  };
}

function relevantAlerts(alerts: readonly Alert[], station: Station, direction?: string): Alert[] {
  return alerts.filter((alert) =>
    (alert.stationIds.length > 0
      ? alert.stationIds.includes(station.id)
      : alert.routeIds.length === 0 || alert.routeIds.some((routeId) => station.routeIds.includes(routeId)))
    && (direction === undefined || alert.directions.length === 0 || alert.directions.includes(direction as Alert['directions'][number])));
}

function projectAlerts(alerts: readonly Alert[]) {
  const byId = new Map<string, { dto: ReturnType<typeof mapAlert>; fingerprint: string; conflicted: boolean }>();
  for (const alert of alerts) {
    const dto = mapAlert(alert);
    const fingerprint = JSON.stringify(dto);
    const existing = byId.get(alert.id);
    if (!existing) byId.set(alert.id, { dto, fingerprint, conflicted: false });
    else if (existing.fingerprint !== fingerprint) existing.conflicted = true;
  }
  return [...byId.entries()]
    .filter(([, value]) => !value.conflicted)
    .sort(([left], [right]) => compareCanonicalIdentity(left, right))
    .map(([, value]) => value.dto);
}

function mapExplanation(explanation: BoardExplanation) {
  return {
    code: explanation.code,
    message: publicPlainText(explanation.message, 'Additional service context is unavailable.'),
    ...(explanation.provenance === undefined ? {} : { provenance: mapDomainProvenance(explanation.provenance) }),
  };
}

function mapDomainProvenance(value: Provenance) {
  return projectPublicProvenance(value);
}

function dateIso(value: Date): string {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('Invalid operational time');
  return value.toISOString();
}

function isoString(value: string): string {
  if (typeof value !== 'string') throw new Error('Invalid response validity');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new Error('Invalid response validity');
  return value;
}

function publicPlainText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const sanitized = sanitizeOfficialText(value);
  if (sanitized.length === 0) return fallback;
  return [...sanitized].slice(0, 2_048).join('');
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
