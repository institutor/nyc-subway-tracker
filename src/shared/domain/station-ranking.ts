import { compareCanonicalIdentity, normalizeBoundedIdentity, normalizeCanonicalIdentity } from './canonical';
import { parseWalkRange, type WalkRange } from './geo';
import type { Direction } from './types';

export interface NearbyComplexInput {
  readonly id: string;
  readonly name: string;
}

export interface NearbyConstituentInput {
  readonly id: string;
  readonly complexId: string;
  readonly publicName: string;
}

export type EntranceUsability = 'open' | 'closed' | 'unknown' | 'stale' | 'missing';

export interface NearbyEntranceInput {
  readonly id: string;
  readonly complexId: string;
  readonly constituentId: string;
  readonly publicDescription: string;
  readonly entryPermission: 'entry' | 'exit-only' | 'restricted' | 'unknown';
  readonly joinStatus: 'matched' | 'unmatched';
  readonly directionalStopIds: readonly string[];
  readonly usability: EntranceUsability;
  readonly accessibility: 'eligible' | 'ineligible' | 'unknown';
}

export interface NearbyServiceInput {
  readonly id: string;
  readonly complexId: string;
  readonly constituentId: string;
  readonly directionalStopId: string;
  readonly routeId: string;
  readonly direction: Direction;
  readonly actualDestination: string;
  readonly state: 'current' | 'not-current' | 'unknown';
  readonly arrivalState: 'available' | 'limited' | 'unavailable';
}

export interface NearbyWalkAvailable {
  readonly kind: 'available';
  readonly source: 'practical-walk';
  readonly sourceId: string;
  readonly coverage:
    | { readonly kind: 'complete-universe' }
    | {
        readonly kind: 'certified-third-card-cutoff';
        readonly consideredDestinationIds: readonly string[];
        readonly excludedDestinationIds: readonly string[];
        readonly thirdCardMaximumSeconds: number;
        readonly excludedMinimumSeconds: number;
      };
  readonly results: readonly { readonly destinationId: string; readonly range: WalkRange }[];
}

export interface NearbyWalkUnavailable {
  readonly kind: 'unavailable';
  readonly reason: string;
}

export interface NearbyRankingInput {
  readonly complexes: readonly NearbyComplexInput[];
  readonly constituents: readonly NearbyConstituentInput[];
  readonly entrances: readonly NearbyEntranceInput[];
  readonly services: readonly NearbyServiceInput[];
  readonly walk: NearbyWalkAvailable | NearbyWalkUnavailable;
  readonly accessibleRouteOnly: boolean;
  readonly locationAccuracyMeters: number;
}

export interface SelectedNearbyEntrance {
  readonly id: string;
  readonly publicDescription: string;
  readonly walkRange: WalkRange;
  readonly nearestLabel?: 'One of the closest confirmed entrances.';
  readonly walkComparison?: 'About the same walk.';
}

export interface NearbyDirectionCard {
  readonly constituentId: string;
  readonly constituentPublicName: string;
  readonly directionalStopId: string;
  readonly direction: Direction;
  readonly actualDestination: string;
  readonly routeIds: readonly string[];
  readonly arrivalState: 'available' | 'limited' | 'unavailable';
  readonly selectedEntrance: SelectedNearbyEntrance;
}

export interface NearbyStationCard {
  readonly complexId: string;
  readonly complexName: string;
  readonly rankingRange: WalkRange;
  readonly directions: readonly NearbyDirectionCard[];
  readonly walkComparison?: 'About the same walk.';
  readonly stationDetailAvailable: true;
}

export type NearbyPickerOption =
  | {
      readonly complexId: string;
      readonly complexName: string;
      readonly entranceAvailability: 'confirmed';
      readonly stationDetailAvailable: true;
    }
  | {
      readonly complexId: string;
      readonly complexName: string;
      readonly entranceAvailability: 'unconfirmed';
      readonly message: 'Entrance availability not confirmed';
      readonly arrivalState: 'unavailable';
      readonly stationDetailAvailable: true;
    };

export type NearbyRankingDecision =
  | {
      readonly kind: 'ranked';
      readonly cards: readonly NearbyStationCard[];
      readonly picker: {
        readonly required: boolean;
        readonly bottomAnchored: true;
        readonly options: readonly NearbyPickerOption[];
      };
    }
  | {
      readonly kind: 'picker';
      readonly reason: 'walk-unavailable' | 'walk-incomparable' | 'no-confirmed-entrance' | 'no-current-service';
      readonly cards: readonly [];
      readonly picker: {
        readonly required: true;
        readonly bottomAnchored: true;
        readonly options: readonly NearbyPickerOption[];
      };
    };

interface CapturedInput {
  complexes: NearbyComplexInput[];
  constituents: NearbyConstituentInput[];
  entrances: NearbyEntranceInput[];
  services: NearbyServiceInput[];
  walk: NearbyWalkAvailable | NearbyWalkUnavailable;
  accessibleRouteOnly: boolean;
}

interface DirectionSelection extends NearbyDirectionCard {
  range: WalkRange;
}

interface ConfirmedComplex {
  complex: NearbyComplexInput;
  directions: DirectionSelection[];
  rankingSelection: DirectionSelection;
}

interface UnconfirmedComplex {
  complex: NearbyComplexInput;
}

export function rankNearbyStations(rawInput: NearbyRankingInput): NearbyRankingDecision {
  const input = captureInput(rawInput);
  const complexById = new Map(input.complexes.map((complex) => [complex.id, complex]));
  const constituentById = new Map(input.constituents.map((constituent) => [constituent.id, constituent]));
  validateRelationships(input, complexById, constituentById);

  const currentServices = input.services.filter(({ state }) => state === 'current');
  const walkByEntrance = input.walk.kind === 'available'
    ? new Map(input.walk.results.map((result) => [result.destinationId, result.range]))
    : new Map<string, WalkRange>();
  const confirmed: ConfirmedComplex[] = [];
  const unconfirmed: UnconfirmedComplex[] = [];
  const confirmedForPicker = new Map<string, NearbyComplexInput>();
  let automaticEvidenceIncomplete = false;

  for (const complex of input.complexes) {
    const services = currentServices.filter(({ complexId }) => complexId === complex.id);
    if (services.length === 0) continue;
    const groupedServices = groupServices(services);
    const directionSelections: DirectionSelection[] = [];
    let hasAllUnconfirmedGroup = false;

    for (const serviceGroup of groupedServices) {
      const constituent = constituentById.get(serviceGroup[0].constituentId)!;
      const baseEntrances = input.entrances.filter((entrance) =>
        entrance.complexId === complex.id
        && entrance.constituentId === constituent.id
        && entrance.joinStatus === 'matched'
        && entrance.entryPermission === 'entry'
        && (!input.accessibleRouteOnly || entrance.accessibility === 'eligible')
        && serviceGroup.some((service) => entrance.directionalStopIds.includes(service.directionalStopId)),
      );
      const openEntrances = baseEntrances.filter(({ usability }) => usability === 'open');
      if (openEntrances.length === 0) {
        if (baseEntrances.length > 0 && baseEntrances.every(({ usability }) =>
          usability === 'missing' || usability === 'stale' || usability === 'unknown')) {
          hasAllUnconfirmedGroup = true;
        }
        continue;
      }
      confirmedForPicker.set(complex.id, complex);
      if (input.walk.kind !== 'available') {
        automaticEvidenceIncomplete = true;
        continue;
      }
      const excluded = input.walk.coverage.kind === 'certified-third-card-cutoff'
        ? new Set(input.walk.coverage.excludedDestinationIds)
        : new Set<string>();
      const rankableEntrances = openEntrances.filter(({ id }) => walkByEntrance.has(id));
      if (openEntrances.some(({ id }) => !walkByEntrance.has(id) && !excluded.has(id))) {
        automaticEvidenceIncomplete = true;
        continue;
      }
      if (rankableEntrances.length === 0) continue;
      const selectedEntrance = selectEntrance(rankableEntrances, walkByEntrance);
      const firstService = serviceGroup[0];
      directionSelections.push({
        constituentId: constituent.id,
        constituentPublicName: constituent.publicName,
        directionalStopId: firstService.directionalStopId,
        direction: firstService.direction,
        actualDestination: firstService.actualDestination,
        routeIds: Object.freeze(uniqueSorted(serviceGroup.map(({ routeId }) => routeId))),
        arrivalState: worstArrivalState(serviceGroup.map(({ arrivalState }) => arrivalState)),
        selectedEntrance: selectedEntrance.output,
        range: selectedEntrance.range,
      });
    }

    if (directionSelections.length > 0) {
      directionSelections.sort(compareDirectionSelections);
      const rankingSelection = [...directionSelections].sort(compareRepresentativeSelection)[0];
      confirmed.push({ complex, directions: directionSelections, rankingSelection });
    } else if (hasAllUnconfirmedGroup) {
      unconfirmed.push({ complex });
    }
  }

  const options = pickerOptions([...confirmedForPicker.values()], unconfirmed);
  if (confirmedForPicker.size > 0 && input.walk.kind !== 'available') return picker('walk-unavailable', options);
  if (automaticEvidenceIncomplete) return picker('walk-incomparable', options);
  if (confirmed.length === 0) {
    return deepFreeze({
      kind: 'picker',
      reason: unconfirmed.length > 0 ? 'no-confirmed-entrance' : 'no-current-service',
      cards: [],
      picker: { required: true, bottomAnchored: true, options },
    });
  }
  if (input.walk.kind !== 'available') return picker('walk-unavailable', options);
  if (!walkEvidenceCanRank(input.walk, confirmed)) return picker('walk-incomparable', options);

  const tiers = overlapTiers(confirmed.map((candidate) => ({ key: candidate.complex.id, range: candidate.rankingSelection.range })));
  confirmed.sort((left, right) => compareConfirmedComplexes(left, right, tiers));
  const tierSizes = countTiers(tiers);
  const cards = confirmed.slice(0, 3).map((candidate) => {
    const tier = tiers.get(candidate.complex.id)!;
    const card: NearbyStationCard = {
      complexId: candidate.complex.id,
      complexName: candidate.complex.name,
      rankingRange: cloneRange(candidate.rankingSelection.range),
      directions: Object.freeze(candidate.directions.map(({ range: _range, ...direction }) => deepFreeze({ ...direction }))),
      ...(tierSizes.get(tier)! > 1 ? { walkComparison: 'About the same walk.' as const } : {}),
      stationDetailAvailable: true,
    };
    return deepFreeze(card);
  });
  return deepFreeze({
    kind: 'ranked',
    cards,
    picker: { required: unconfirmed.length > 0, bottomAnchored: true, options },
  });
}

function captureInput(input: NearbyRankingInput): CapturedInput {
  const root = strictRecord(input, ['complexes', 'constituents', 'entrances', 'services', 'walk', 'accessibleRouteOnly', 'locationAccuracyMeters'], 'ranking input');
  if (!Array.isArray(root.complexes) || !Array.isArray(root.constituents) || !Array.isArray(root.entrances) || !Array.isArray(root.services)) {
    throw new Error('Invalid ranking collections');
  }
  for (const values of [root.complexes, root.constituents, root.entrances, root.services]) {
    if (values.length > 10_000) throw new Error('Ranking collection limit exceeded');
  }
  if (typeof root.accessibleRouteOnly !== 'boolean') throw new Error('Invalid Accessible Route Only value');
  if (typeof root.locationAccuracyMeters !== 'number' || !Number.isFinite(root.locationAccuracyMeters) || root.locationAccuracyMeters <= 0) {
    throw new Error('Invalid location accuracy');
  }

  const complexes = root.complexes.map((value) => {
    const record = strictRecord(value, ['id', 'name'], 'complex fields');
    return { id: identity(record.id, 'complex'), name: display(record.name, 'complex name') };
  });
  const constituents = root.constituents.map((value) => {
    const record = strictRecord(value, ['id', 'complexId', 'publicName'], 'constituent fields');
    return {
      id: identity(record.id, 'constituent'),
      complexId: identity(record.complexId, 'constituent complex'),
      publicName: display(record.publicName, 'constituent name'),
    };
  });
  const entrances = root.entrances.map((value) => {
    const record = strictRecord(value, [
      'id', 'complexId', 'constituentId', 'publicDescription', 'entryPermission', 'joinStatus',
      'directionalStopIds', 'usability', 'accessibility',
    ], 'entrance fields');
    if (!Array.isArray(record.directionalStopIds) || record.directionalStopIds.length > 256) throw new Error('Invalid directional stop IDs');
    const directionalStopIds = record.directionalStopIds.map((id) => identity(id, 'directional stop'));
    assertUnique(directionalStopIds, 'directional stop');
    const entryPermission = enumeration(record.entryPermission, ['entry', 'exit-only', 'restricted', 'unknown'] as const, 'entry permission');
    const joinStatus = enumeration(record.joinStatus, ['matched', 'unmatched'] as const, 'join status');
    const usability = enumeration(record.usability, ['open', 'closed', 'unknown', 'stale', 'missing'] as const, 'entrance usability');
    const accessibility = enumeration(record.accessibility, ['eligible', 'ineligible', 'unknown'] as const, 'entrance accessibility');
    return {
      id: identity(record.id, 'entrance'),
      complexId: identity(record.complexId, 'entrance complex'),
      constituentId: identity(record.constituentId, 'entrance constituent'),
      publicDescription: display(record.publicDescription, 'entrance description'),
      entryPermission,
      joinStatus,
      directionalStopIds: Object.freeze(uniqueSorted(directionalStopIds)),
      usability,
      accessibility,
    };
  });
  const services = root.services.map((value) => {
    const record = strictRecord(value, [
      'id', 'complexId', 'constituentId', 'directionalStopId', 'routeId', 'direction',
      'actualDestination', 'state', 'arrivalState',
    ], 'service fields');
    return {
      id: identity(record.id, 'service'),
      complexId: identity(record.complexId, 'service complex'),
      constituentId: identity(record.constituentId, 'service constituent'),
      directionalStopId: identity(record.directionalStopId, 'service stop'),
      routeId: identity(record.routeId, 'service route'),
      direction: enumeration(record.direction, ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound', 'unknown'] as const, 'service direction'),
      actualDestination: display(record.actualDestination, 'actual destination'),
      state: enumeration(record.state, ['current', 'not-current', 'unknown'] as const, 'service state'),
      arrivalState: enumeration(record.arrivalState, ['available', 'limited', 'unavailable'] as const, 'arrival state'),
    };
  });
  assertUnique(complexes.map(({ id }) => id), 'complex');
  assertUnique(constituents.map(({ id }) => id), 'constituent');
  assertUnique(entrances.map(({ id }) => id), 'entrance');
  assertUnique(services.map(({ id }) => id), 'service');
  return {
    complexes,
    constituents,
    entrances,
    services,
    walk: captureWalk(root.walk),
    accessibleRouteOnly: root.accessibleRouteOnly,
  };
}

function captureWalk(value: unknown): NearbyWalkAvailable | NearbyWalkUnavailable {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid walk evidence');
  if ((value as Record<string, unknown>).kind === 'unavailable') {
    const record = strictRecord(value, ['kind', 'reason'], 'walk unavailable fields');
    return { kind: 'unavailable', reason: display(record.reason, 'walk unavailable reason') };
  }
  const record = strictRecord(value, ['kind', 'source', 'sourceId', 'coverage', 'results'], 'walk evidence fields');
  if (record.kind !== 'available' || record.source !== 'practical-walk' || !Array.isArray(record.results)) throw new Error('Invalid walk evidence');
  const results = record.results.map((result) => {
    const row = strictRecord(result, ['destinationId', 'range'], 'walk result fields');
    return { destinationId: identity(row.destinationId, 'walk destination'), range: parseWalkRange(row.range) };
  });
  assertUnique(results.map(({ destinationId }) => destinationId), 'walk destination');
  const coverageRaw = record.coverage;
  if (!coverageRaw || typeof coverageRaw !== 'object' || Array.isArray(coverageRaw)) throw new Error('Invalid walk coverage');
  let coverage: NearbyWalkAvailable['coverage'];
  if ((coverageRaw as Record<string, unknown>).kind === 'complete-universe') {
    strictRecord(coverageRaw, ['kind'], 'walk coverage fields');
    coverage = { kind: 'complete-universe' };
  } else {
    const row = strictRecord(coverageRaw, [
      'kind', 'consideredDestinationIds', 'excludedDestinationIds', 'thirdCardMaximumSeconds', 'excludedMinimumSeconds',
    ], 'walk coverage fields');
    if (row.kind !== 'certified-third-card-cutoff' || !Array.isArray(row.consideredDestinationIds) || !Array.isArray(row.excludedDestinationIds)) {
      throw new Error('Invalid walk coverage');
    }
    coverage = {
      kind: 'certified-third-card-cutoff',
      consideredDestinationIds: Object.freeze(row.consideredDestinationIds.map((id) => identity(id, 'walk considered destination'))),
      excludedDestinationIds: Object.freeze(row.excludedDestinationIds.map((id) => identity(id, 'walk excluded destination'))),
      thirdCardMaximumSeconds: parseWalkRange({ minimumSeconds: 0, maximumSeconds: row.thirdCardMaximumSeconds }).maximumSeconds,
      excludedMinimumSeconds: parseWalkRange({ minimumSeconds: row.excludedMinimumSeconds, maximumSeconds: 86_400 }).minimumSeconds,
    };
  }
  return {
    kind: 'available',
    source: 'practical-walk',
    sourceId: identity(record.sourceId, 'walk source'),
    coverage,
    results,
  };
}

function validateRelationships(
  input: CapturedInput,
  complexById: ReadonlyMap<string, NearbyComplexInput>,
  constituentById: ReadonlyMap<string, NearbyConstituentInput>,
): void {
  for (const constituent of input.constituents) {
    if (!complexById.has(constituent.complexId)) throw new Error('Unknown constituent complex');
  }
  for (const entrance of input.entrances) {
    const constituent = constituentById.get(entrance.constituentId);
    if (!complexById.has(entrance.complexId) || !constituent || constituent.complexId !== entrance.complexId) {
      throw new Error('Invalid exact entrance join');
    }
  }
  for (const service of input.services) {
    const constituent = constituentById.get(service.constituentId);
    if (!complexById.has(service.complexId) || !constituent || constituent.complexId !== service.complexId) {
      throw new Error('Invalid exact service join');
    }
  }
}

function groupServices(services: readonly NearbyServiceInput[]): NearbyServiceInput[][] {
  const groups = new Map<string, NearbyServiceInput[]>();
  for (const service of services) {
    const key = [service.constituentId, service.directionalStopId, service.direction, service.actualDestination].join('\0');
    groups.set(key, [...(groups.get(key) ?? []), service]);
  }
  return [...groups.values()].map((group) => group.sort((left, right) => compareCanonicalIdentity(left.id, right.id)));
}

function selectEntrance(
  entrances: readonly NearbyEntranceInput[],
  ranges: ReadonlyMap<string, WalkRange>,
): { output: SelectedNearbyEntrance; range: WalkRange } {
  const tiers = overlapTiers(entrances.map((entrance) => ({ key: entrance.id, range: ranges.get(entrance.id)! })));
  const sizes = countTiers(tiers);
  const sorted = [...entrances].sort((left, right) => {
    const tierDifference = tiers.get(left.id)! - tiers.get(right.id)!;
    if (tierDifference !== 0) return tierDifference;
    return compareDisplay(left.publicDescription, right.publicDescription)
      || compareCanonicalIdentity(left.id, right.id);
  });
  const selected = sorted[0];
  const tied = sizes.get(tiers.get(selected.id)!)! > 1;
  const range = ranges.get(selected.id)!;
  return {
    range,
    output: deepFreeze({
      id: selected.id,
      publicDescription: selected.publicDescription,
      walkRange: cloneRange(range),
      ...(tied ? {
        nearestLabel: 'One of the closest confirmed entrances.' as const,
        walkComparison: 'About the same walk.' as const,
      } : {}),
    }),
  };
}

function overlapTiers(values: readonly { key: string; range: WalkRange }[]): Map<string, number> {
  const sorted = [...values].sort((left, right) =>
    left.range.minimumSeconds - right.range.minimumSeconds
    || left.range.maximumSeconds - right.range.maximumSeconds
    || compareCanonicalIdentity(left.key, right.key));
  const tiers = new Map<string, number>();
  let tier = -1;
  let componentMaximum = -1;
  for (const value of sorted) {
    if (tier < 0 || value.range.minimumSeconds > componentMaximum) {
      tier += 1;
      componentMaximum = value.range.maximumSeconds;
    } else {
      componentMaximum = Math.max(componentMaximum, value.range.maximumSeconds);
    }
    tiers.set(value.key, tier);
  }
  return tiers;
}

function compareConfirmedComplexes(
  left: ConfirmedComplex,
  right: ConfirmedComplex,
  tiers: ReadonlyMap<string, number>,
): number {
  return tiers.get(left.complex.id)! - tiers.get(right.complex.id)!
    || compareDisplay(left.complex.name, right.complex.name)
    || compareDisplay(left.rankingSelection.constituentPublicName, right.rankingSelection.constituentPublicName)
    || compareDisplay(left.rankingSelection.selectedEntrance.publicDescription, right.rankingSelection.selectedEntrance.publicDescription)
    || compareCanonicalIdentity(left.complex.id, right.complex.id)
    || compareCanonicalIdentity(left.rankingSelection.constituentId, right.rankingSelection.constituentId)
    || compareCanonicalIdentity(left.rankingSelection.selectedEntrance.id, right.rankingSelection.selectedEntrance.id);
}

function compareDirectionSelections(left: DirectionSelection, right: DirectionSelection): number {
  return compareCanonicalIdentity(left.direction, right.direction)
    || compareDisplay(left.actualDestination, right.actualDestination)
    || compareCanonicalIdentity(left.constituentId, right.constituentId)
    || compareCanonicalIdentity(left.directionalStopId, right.directionalStopId);
}

function compareRepresentativeSelection(left: DirectionSelection, right: DirectionSelection): number {
  return left.range.minimumSeconds - right.range.minimumSeconds
    || left.range.maximumSeconds - right.range.maximumSeconds
    || compareDisplay(left.constituentPublicName, right.constituentPublicName)
    || compareDisplay(left.selectedEntrance.publicDescription, right.selectedEntrance.publicDescription)
    || compareCanonicalIdentity(left.constituentId, right.constituentId)
    || compareCanonicalIdentity(left.directionalStopId, right.directionalStopId)
    || compareCanonicalIdentity(left.selectedEntrance.id, right.selectedEntrance.id);
}

function walkEvidenceCanRank(walk: NearbyWalkAvailable, confirmed: readonly ConfirmedComplex[]): boolean {
  const required = uniqueSorted(confirmed.flatMap(({ directions }) => directions.map(({ selectedEntrance }) => selectedEntrance.id)));
  const returned = new Set(walk.results.map(({ destinationId }) => destinationId));
  if (walk.coverage.kind === 'complete-universe') return required.every((id) => returned.has(id));
  const certified = walk.coverage;
  const considered = new Set(certified.consideredDestinationIds);
  const excluded = new Set(certified.excludedDestinationIds);
  const duplicates = [...considered].some((id) => excluded.has(id));
  return !duplicates
    && certified.excludedMinimumSeconds > certified.thirdCardMaximumSeconds
    && required.every((id) => considered.has(id) || excluded.has(id))
    && walk.results.every(({ destinationId, range }) =>
      considered.has(destinationId) && range.maximumSeconds <= certified.thirdCardMaximumSeconds)
    && confirmed.filter(({ rankingSelection }) => considered.has(rankingSelection.selectedEntrance.id)).length >= Math.min(3, confirmed.length);
}

function pickerOptions(confirmed: readonly NearbyComplexInput[], unconfirmed: readonly UnconfirmedComplex[]): NearbyPickerOption[] {
  const options: NearbyPickerOption[] = [
    ...confirmed.map((complex) => ({
      complexId: complex.id,
      complexName: complex.name,
      entranceAvailability: 'confirmed' as const,
      stationDetailAvailable: true as const,
    })),
    ...unconfirmed.map(({ complex }) => ({
      complexId: complex.id,
      complexName: complex.name,
      entranceAvailability: 'unconfirmed' as const,
      message: 'Entrance availability not confirmed' as const,
      arrivalState: 'unavailable' as const,
      stationDetailAvailable: true as const,
    })),
  ];
  return options.sort((left, right) => compareDisplay(left.complexName, right.complexName) || compareCanonicalIdentity(left.complexId, right.complexId));
}

function picker(reason: 'walk-unavailable' | 'walk-incomparable', options: readonly NearbyPickerOption[]): NearbyRankingDecision {
  return deepFreeze({ kind: 'picker', reason, cards: [], picker: { required: true, bottomAnchored: true, options } });
}

function worstArrivalState(values: readonly NearbyServiceInput['arrivalState'][]): NearbyServiceInput['arrivalState'] {
  if (values.includes('unavailable')) return 'unavailable';
  if (values.includes('limited')) return 'limited';
  return 'available';
}

function countTiers(tiers: ReadonlyMap<string, number>): Map<number, number> {
  const counts = new Map<number, number>();
  for (const tier of tiers.values()) counts.set(tier, (counts.get(tier) ?? 0) + 1);
  return counts;
}

function strictRecord(value: unknown, allowedKeys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`Invalid ${label}`);
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== allowedKeys.length || keys.some((key) => !allowedKeys.includes(key))) throw new Error(`Invalid ${label}`);
  return record;
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  return normalizeBoundedIdentity(value, label);
}

function display(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}`);
  const normalized = normalizeCanonicalIdentity(value).trim();
  if (!normalized || [...normalized].length > 256 || /[\u0000-\u001f\u007f]/u.test(normalized)) throw new Error(`Invalid ${label}`);
  return normalized;
}

function enumeration<const T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid ${label}`);
  return value as T[number];
}

function compareDisplay(left: string, right: string): number {
  const normalize = (value: string) => value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US');
  return compareCanonicalIdentity(normalize(left), normalize(right));
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareCanonicalIdentity);
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values.map((value) => value.normalize('NFC'))).size !== values.length) throw new Error(`Duplicate ${label} identity`);
}

function cloneRange(range: WalkRange): WalkRange {
  return Object.freeze({ minimumSeconds: range.minimumSeconds, maximumSeconds: range.maximumSeconds });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
