import type {
  Alert, Arrival, BoardDecision, BoardDirection, BoardExplanation, FeedHealth, Provenance, SecondaryArrival,
} from '../../shared/domain/types';
import { DEMONSTRATION_LABEL } from '../api/contracts';
import { toProvenanceDtos, toSourceHealthDtos } from '../api/provenance-dto';
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
  const alerts = relevantAlerts(board.alerts, board.station.id, filters.direction).map(mapAlert);
  return deepFreeze({
    station: {
      id: board.station.id,
      name: board.station.name,
      complexId: board.station.complexId,
      routeIds: [...board.station.routeIds],
    },
    mode: 'demonstration' as const,
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
  direction: string | undefined,
  sourceHealth: readonly SnapshotSourceHealth[],
  provenance: readonly SnapshotProvenance[],
) {
  const selected = stationId === undefined ? boards : boards.filter((board) => board.station.id === stationId);
  const alerts = selected.flatMap((board) => relevantAlerts(board.alerts, board.station.id, direction));
  const unique = [...new Map(alerts.map((alert) => [alert.id, alert])).values()].map(mapAlert);
  return deepFreeze({
    alerts: unique,
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
  return { ...base, displayAuthority: 'status-only' as const, reason: row.reason };
}

function mapAlert(alert: Alert) {
  return {
    id: alert.id,
    text: alert.text,
    activeFrom: dateIso(alert.activeFrom),
    ...(alert.activeUntil === undefined ? {} : { activeUntil: dateIso(alert.activeUntil) }),
    routeIds: [...alert.routeIds],
    stationIds: [...alert.stationIds],
    directions: [...alert.directions],
    demonstrationLabel: DEMONSTRATION_LABEL,
    provenance: mapDomainProvenance(alert.provenance),
  };
}

function relevantAlerts(alerts: readonly Alert[], stationId: string, direction?: string): Alert[] {
  return alerts.filter((alert) =>
    (alert.stationIds.length === 0 || alert.stationIds.includes(stationId))
    && (direction === undefined || alert.directions.length === 0 || alert.directions.includes(direction as Alert['directions'][number])));
}

function mapExplanation(explanation: BoardExplanation) {
  return {
    code: explanation.code,
    message: explanation.message,
    ...(explanation.provenance === undefined ? {} : { provenance: mapDomainProvenance(explanation.provenance) }),
  };
}

function mapDomainProvenance(value: Provenance) {
  return {
    source: value.source,
    sourceId: value.sourceId,
    observedAt: dateIso(value.observedAt),
    retrievedAt: dateIso(value.retrievedAt),
    ...(value.version === undefined ? {} : { version: value.version }),
  };
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

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
