import {
  accessiblePathDecisionAllowsUse,
  isResolvedAccessiblePathDecision,
  type ResolvedAccessiblePathDecision,
} from './accessible-path';
import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';

export type AccessibilityAlternativeTier = 'same-complex' | 'nearby-station' | 'subway-detour' | 'bus-inclusive';

export interface AccessibilityAlternativeOfferInput {
  readonly offerId: string;
  readonly evidenceOwner: 'app-owned-accessibility-alternatives';
  readonly label: string;
  readonly canonicalIdentity: string;
  readonly pathEvaluationId: string;
  readonly pathPackageVersion: string;
  readonly tier: AccessibilityAlternativeTier;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly singlePointElevatorDependencies: number;
  readonly transfers: number;
  readonly accessibleWalkingMeters: number;
  readonly disruptionRisk: number;
  readonly travelSeconds: number;
  readonly includesBus: boolean;
}

export interface AccessibilityAlternativeRegistryInput {
  readonly registryId: string;
  readonly evidenceOwner: 'app-owned-accessibility-alternatives';
  readonly selectedPathEvaluationId: string;
  readonly createdAt: string;
  readonly validThrough: string;
  readonly offers: readonly AccessibilityAlternativeOfferInput[];
}

const nearbyStationEvidenceBrand: unique symbol = Symbol('accepted-nearby-station-evidence');
export interface AcceptedNearbyStationEvidence {
  readonly [nearbyStationEvidenceBrand]: true;
  readonly evidenceId: string;
  readonly evidenceOwner: 'app-owned-nearby-stations';
  readonly selectedStationComplexId: string;
  readonly candidateStationComplexId: string;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly verifiedAt: string;
  readonly validThrough: string;
}
const acceptedNearbyStationEvidence = new WeakSet<object>();
const nearbyStationEvidencePaths = new WeakMap<object, { readonly selectedPath: ResolvedAccessiblePathDecision; readonly candidatePath: ResolvedAccessiblePathDecision }>();

export function acceptNearbyStationEvidence(
  raw: Omit<AcceptedNearbyStationEvidence, typeof nearbyStationEvidenceBrand>,
  selectedPath: ResolvedAccessiblePathDecision,
  candidatePath: ResolvedAccessiblePathDecision,
): AcceptedNearbyStationEvidence {
  const root = strictRecord(raw, ['evidenceId','evidenceOwner','selectedStationComplexId','candidateStationComplexId','originIntent','destinationIntent','verifiedAt','validThrough'], 'nearby-station evidence');
  if (root.evidenceOwner !== 'app-owned-nearby-stations') throw new Error('Nearby-station evidence owner is invalid');
  const verifiedAt = instant(root.verifiedAt, 'nearby-station verification');
  const validThrough = instant(root.validThrough, 'nearby-station validity end');
  if (!isResolvedAccessiblePathDecision(selectedPath) || !isResolvedAccessiblePathDecision(candidatePath)
    || !accessiblePathDecisionAllowsUse(selectedPath, new Date(verifiedAt))
    || !accessiblePathDecisionAllowsUse(candidatePath, new Date(verifiedAt))
    || candidatePath.pathId === selectedPath.pathId || candidatePath.evaluationId === selectedPath.evaluationId
    || root.selectedStationComplexId !== selectedPath.stationComplexId
    || root.candidateStationComplexId !== candidatePath.stationComplexId
    || candidatePath.stationComplexId === selectedPath.stationComplexId
    || root.originIntent !== selectedPath.originIntent || root.originIntent !== candidatePath.originIntent
    || root.destinationIntent !== selectedPath.destinationIntent || root.destinationIntent !== candidatePath.destinationIntent
    || Date.parse(validThrough) < Date.parse(verifiedAt)
    || Date.parse(validThrough) > Math.min(Date.parse(selectedPath.validThrough), Date.parse(candidatePath.validThrough))) {
    throw new Error('Nearby-station evidence does not join the exact current selected and candidate paths');
  }
  const accepted = deepFreeze({
    [nearbyStationEvidenceBrand]: true as const,
    evidenceId: identity(root.evidenceId, 'nearby-station evidence identity'),
    evidenceOwner: 'app-owned-nearby-stations' as const,
    selectedStationComplexId: selectedPath.stationComplexId,
    candidateStationComplexId: candidatePath.stationComplexId,
    originIntent: selectedPath.originIntent,
    destinationIntent: selectedPath.destinationIntent,
    verifiedAt,
    validThrough,
  });
  acceptedNearbyStationEvidence.add(accepted);
  nearbyStationEvidencePaths.set(accepted, { selectedPath, candidatePath });
  return accepted;
}

const registryBrand: unique symbol = Symbol('accepted-accessibility-alternative-registry');
export interface AcceptedAccessibilityAlternativeRegistry {
  readonly [registryBrand]: true;
  readonly registryId: string;
  readonly evidenceOwner: 'app-owned-accessibility-alternatives';
  readonly selectedPathEvaluationId: string;
  readonly createdAt: string;
  readonly validThrough: string;
}

const busConsentBrand: unique symbol = Symbol('accepted-bus-alternative-consent');
export interface AcceptedBusAlternativeConsent {
  readonly [busConsentBrand]: true;
  readonly consentId: string;
  readonly registryId: string;
  readonly selectedPathEvaluationId: string;
  readonly destinationIntent: string;
  readonly grantedAt: string;
  readonly validThrough: string;
}

export interface ResolvedAccessibilityAlternativeOffer {
  readonly offerId: string;
  readonly id: string;
  readonly label: string;
  readonly canonicalIdentity: string;
  readonly pathId: string;
  readonly pathEvaluationId: string;
  readonly pathPackageVersion: string;
  readonly stationComplexId: string;
  readonly constituentStationId: string;
  readonly routeId: string;
  readonly direction: ResolvedAccessiblePathDecision['direction'];
  readonly platformId: string;
  readonly equipmentSourceScopeId: string;
  readonly equipmentSourceVersion: string;
  readonly surface: ResolvedAccessiblePathDecision['surface'];
  readonly exposureDecisionId: string | null;
  readonly tier: AccessibilityAlternativeTier;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly singlePointElevatorDependencies: number;
  readonly transfers: number;
  readonly accessibleWalkingMeters: number;
  readonly disruptionRisk: number;
  readonly travelSeconds: number;
  readonly includesBus: boolean;
}

const selectionBrand: unique symbol = Symbol('resolved-accessibility-alternative-selection');
export interface ResolvedAccessibilityAlternativeSelection {
  readonly [selectionBrand]: true;
  readonly decisionId: string;
  readonly registryId: string;
  readonly selectedPathEvaluationId: string;
  readonly stationComplexId: string;
  readonly constituentStationId: string;
  readonly originIntent: string;
  readonly destinationIntent: string;
  readonly surface: ResolvedAccessiblePathDecision['surface'];
  readonly exposureDecisionId: string | null;
  readonly createdAt: string;
  readonly validThrough: string;
  readonly busConsentId: string | null;
  readonly first: ResolvedAccessibilityAlternativeOffer | null;
  readonly visible: readonly ResolvedAccessibilityAlternativeOffer[];
  readonly selectedId: null;
  readonly accessibleRouteOnly: true;
  readonly reason?: string;
}

interface AcceptedOffer extends AccessibilityAlternativeOfferInput {
  readonly pathDecision: ResolvedAccessiblePathDecision;
}

interface AcceptedRegistryState {
  readonly selectedPath: ResolvedAccessiblePathDecision;
  readonly offers: readonly AcceptedOffer[];
}

interface ResolvedSelectionState {
  readonly registry: AcceptedAccessibilityAlternativeRegistry;
  readonly selectedPath: ResolvedAccessiblePathDecision;
  readonly candidatePaths: readonly ResolvedAccessiblePathDecision[];
}

const acceptedRegistries = new WeakSet<object>();
const acceptedRegistryState = new WeakMap<object, AcceptedRegistryState>();
const resolvedSelections = new WeakSet<object>();
const resolvedSelectionState = new WeakMap<object, ResolvedSelectionState>();
const acceptedBusConsents = new WeakSet<object>();
const TIERS: readonly AccessibilityAlternativeTier[] = ['same-complex', 'nearby-station', 'subway-detour', 'bus-inclusive'];

export function acceptAccessibilityAlternativeRegistry(
  raw: AccessibilityAlternativeRegistryInput,
  selectedPath: ResolvedAccessiblePathDecision,
  candidatePaths: readonly ResolvedAccessiblePathDecision[],
  nearbyEvidence: readonly AcceptedNearbyStationEvidence[] = [],
): AcceptedAccessibilityAlternativeRegistry {
  const root = strictRecord(raw, ['registryId', 'evidenceOwner', 'selectedPathEvaluationId', 'createdAt', 'validThrough', 'offers'], 'accessibility alternative registry');
  if (root.evidenceOwner !== 'app-owned-accessibility-alternatives') throw new Error('Accessibility alternative registry owner is invalid');
  const registryId = identity(root.registryId, 'alternative registry identity');
  const selectedPathEvaluationId = identity(root.selectedPathEvaluationId, 'selected path evaluation identity');
  const createdAt = instant(root.createdAt, 'alternative registry creation');
  const validThrough = instant(root.validThrough, 'alternative registry validity end');
  if (!isResolvedAccessiblePathDecision(selectedPath) || selectedPath.evaluationId !== selectedPathEvaluationId
    || !accessiblePathDecisionAllowsUse(selectedPath, new Date(createdAt)) || selectedPath.status !== 'eligible') {
    throw new Error('Alternative registry selected path is not an exact current accepted evaluation');
  }
  if (Date.parse(validThrough) < Date.parse(createdAt) || Date.parse(validThrough) > Date.parse(selectedPath.validThrough)) {
    throw new Error('Alternative registry validity is outside the selected path validity');
  }
  if (!Array.isArray(root.offers)) throw new Error('Accessibility alternative registry offers must be an array');
  const pathsByEvaluation = new Map(candidatePaths.filter(isResolvedAccessiblePathDecision).map((path) => [path.evaluationId, path]));
  if (pathsByEvaluation.size !== candidatePaths.length) throw new Error('Alternative registry candidate path is not a resolved evaluation');
  const offerIds = new Set<string>();
  const canonicalIds = new Set<string>();
  const offers = root.offers.map((value) => {
    const offer = strictRecord(value, [
      'offerId', 'evidenceOwner', 'label', 'canonicalIdentity', 'pathEvaluationId', 'pathPackageVersion', 'tier',
      'originIntent', 'destinationIntent', 'singlePointElevatorDependencies', 'transfers', 'accessibleWalkingMeters',
      'disruptionRisk', 'travelSeconds', 'includesBus',
    ], 'accessibility alternative offer');
    if (offer.evidenceOwner !== 'app-owned-accessibility-alternatives') throw new Error('Accessibility alternative offer owner is invalid');
    const offerId = identity(offer.offerId, 'alternative offer identity');
    if (offerIds.has(offerId)) throw new Error('Duplicate alternative offer identity');
    offerIds.add(offerId);
    const canonicalIdentity = normalizeCanonicalIdentity(identity(offer.canonicalIdentity, 'alternative canonical identity'));
    if (canonicalIds.has(canonicalIdentity)) throw new Error('Duplicate canonical alternative identity');
    canonicalIds.add(canonicalIdentity);
    const pathEvaluationId = identity(offer.pathEvaluationId, 'alternative path evaluation identity');
    const pathDecision = pathsByEvaluation.get(pathEvaluationId);
    const tier = enumeration(offer.tier, TIERS, 'alternative tier');
    const includesBus = boolean(offer.includesBus, 'alternative bus inclusion');
    if (includesBus !== (tier === 'bus-inclusive')) throw new Error('Bus-inclusive tier and explicit bus inclusion must agree');
    if (!pathDecision || pathDecision.pathId !== canonicalIdentity || pathDecision.packageVersion !== offer.pathPackageVersion
      || pathDecision.originIntent !== offer.originIntent || pathDecision.destinationIntent !== offer.destinationIntent
      || pathDecision.originIntent !== selectedPath.originIntent || pathDecision.destinationIntent !== selectedPath.destinationIntent
      || pathDecision.surface !== selectedPath.surface || pathDecision.exposureDecisionId !== selectedPath.exposureDecisionId
      || pathDecision.status !== 'eligible' || !accessiblePathDecisionAllowsUse(pathDecision, new Date(createdAt))) {
      throw new Error('Alternative offer does not join its exact current accepted path evaluation and selected intent');
    }
    if (pathDecision.evaluationId === selectedPath.evaluationId || pathDecision.pathId === selectedPath.pathId) {
      throw new Error('The selected path cannot be reused as its own alternative');
    }
    if (Date.parse(validThrough) > Date.parse(pathDecision.validThrough)) throw new Error('Alternative registry outlives a candidate path evaluation');
    if (tier === 'same-complex' && (pathDecision.stationComplexId !== selectedPath.stationComplexId
      || pathDecision.constituentStationId !== selectedPath.constituentStationId)) {
      throw new Error('Same-complex alternative does not match the selected station scope');
    }
    if (tier === 'nearby-station' && pathDecision.stationComplexId === selectedPath.stationComplexId) {
      throw new Error('Nearby-station alternative must be independently scoped to another station complex');
    }
    if (tier === 'nearby-station' && !nearbyEvidence.some((evidence) => nearbyEvidenceMatches(evidence, selectedPath, pathDecision, createdAt, validThrough))) {
      throw new Error('Nearby-station alternative requires exact current app-owned nearby evidence');
    }
    return deepFreeze({
      offerId,
      evidenceOwner: 'app-owned-accessibility-alternatives' as const,
      label: identity(offer.label, 'alternative label'),
      canonicalIdentity,
      pathEvaluationId,
      pathPackageVersion: identity(offer.pathPackageVersion, 'alternative package version'),
      tier,
      originIntent: identity(offer.originIntent, 'alternative origin intent'),
      destinationIntent: identity(offer.destinationIntent, 'alternative destination intent'),
      singlePointElevatorDependencies: metric(offer.singlePointElevatorDependencies, 'single-point elevator dependencies', true),
      transfers: metric(offer.transfers, 'alternative transfers', true),
      accessibleWalkingMeters: metric(offer.accessibleWalkingMeters, 'accessible walking distance'),
      disruptionRisk: metric(offer.disruptionRisk, 'alternative disruption risk'),
      travelSeconds: metric(offer.travelSeconds, 'alternative travel time'),
      includesBus,
      pathDecision,
    });
  });
  const accepted = deepFreeze({
    [registryBrand]: true as const,
    registryId,
    evidenceOwner: 'app-owned-accessibility-alternatives' as const,
    selectedPathEvaluationId,
    createdAt,
    validThrough,
  });
  acceptedRegistries.add(accepted);
  acceptedRegistryState.set(accepted, deepFreeze({ selectedPath, offers }));
  return accepted;
}

export function chooseAccessibilityAlternative(
  registry: AcceptedAccessibilityAlternativeRegistry,
  options: { readonly busConsent?: AcceptedBusAlternativeConsent; readonly decisionTime: Date },
): ResolvedAccessibilityAlternativeSelection {
  const state = acceptedRegistryState.get(registry);
  const decisionTime = options.decisionTime instanceof Date ? options.decisionTime.getTime() : Number.NaN;
  if (!acceptedRegistries.has(registry) || !state || !Number.isFinite(decisionTime)
    || decisionTime < Date.parse(registry.createdAt) || decisionTime > Date.parse(registry.validThrough)
    || !accessiblePathDecisionAllowsUse(state.selectedPath, options.decisionTime)) {
    throw new Error('A current accepted accessibility alternative registry is required');
  }
  const busConsented = busConsentAllowsUse(options.busConsent, registry, state.selectedPath, options.decisionTime);
  const eligible = state.offers.filter((offer) => accessiblePathDecisionAllowsUse(offer.pathDecision, options.decisionTime)
    && (!offer.includesBus || busConsented));
  const tier = TIERS.find((item) => eligible.some((candidate) => candidate.tier === item));
  const acceptedConsent = busConsented ? options.busConsent : undefined;
  if (!tier) return resolveSelection(registry, state.selectedPath, acceptedConsent, null, [], [], options.decisionTime);
  const within = eligible.filter((candidate) => candidate.tier === tier).sort((a, b) =>
    a.singlePointElevatorDependencies - b.singlePointElevatorDependencies
    || a.transfers - b.transfers
    || a.accessibleWalkingMeters - b.accessibleWalkingMeters
    || a.disruptionRisk - b.disruptionRisk
    || a.travelSeconds - b.travelSeconds
    || compareCanonicalIdentity(a.canonicalIdentity, b.canonicalIdentity));
  const first = publicOffer(within[0]);
  return resolveSelection(registry, state.selectedPath, acceptedConsent, first, [first], [within[0].pathDecision], options.decisionTime);
}

export function grantBusAlternativeConsent(
  registry: AcceptedAccessibilityAlternativeRegistry,
  decisionTime: Date,
): AcceptedBusAlternativeConsent {
  const state = acceptedRegistryState.get(registry);
  const grantedAt = decisionTime instanceof Date && Number.isFinite(decisionTime.getTime()) ? decisionTime.toISOString() : '';
  if (!acceptedRegistries.has(registry) || !state || !grantedAt
    || Date.parse(grantedAt) < Date.parse(registry.createdAt) || Date.parse(grantedAt) > Date.parse(registry.validThrough)
    || !accessiblePathDecisionAllowsUse(state.selectedPath, decisionTime)) {
    throw new Error('Bus alternative consent requires a current accepted alternative registry');
  }
  const consent = deepFreeze({
    [busConsentBrand]: true as const,
    consentId: `bus-consent|${registry.registryId}|${state.selectedPath.evaluationId}|${state.selectedPath.destinationIntent}|${grantedAt}`,
    registryId: registry.registryId,
    selectedPathEvaluationId: state.selectedPath.evaluationId,
    destinationIntent: state.selectedPath.destinationIntent,
    grantedAt,
    validThrough: registry.validThrough,
  });
  acceptedBusConsents.add(consent);
  return consent;
}

export function isResolvedAccessibilityAlternativeSelection(value: unknown): value is ResolvedAccessibilityAlternativeSelection {
  return Boolean(value && typeof value === 'object' && resolvedSelections.has(value));
}

export function alternativeSelectionAllowsUse(value: unknown, decisionTime: Date): value is ResolvedAccessibilityAlternativeSelection {
  const time = decisionTime instanceof Date ? decisionTime.getTime() : Number.NaN;
  const state = value && typeof value === 'object' ? resolvedSelectionState.get(value) : undefined;
  return isResolvedAccessibilityAlternativeSelection(value) && Number.isFinite(time)
    && time >= Date.parse(value.createdAt) && time <= Date.parse(value.validThrough)
    && Boolean(state) && state!.registry.registryId === value.registryId
    && state!.selectedPath.evaluationId === value.selectedPathEvaluationId
    && state!.candidatePaths.length === value.visible.length
    && state!.candidatePaths.every((path, index) => path.status === 'eligible'
      && accessiblePathDecisionAllowsUse(path, decisionTime)
      && offerMatchesPath(value.visible[index], path));
}

function publicOffer(offer: AcceptedOffer): ResolvedAccessibilityAlternativeOffer {
  return deepFreeze({
    offerId: offer.offerId,
    id: offer.offerId,
    label: offer.label,
    canonicalIdentity: offer.canonicalIdentity,
    pathId: offer.pathDecision.pathId,
    pathEvaluationId: offer.pathEvaluationId,
    pathPackageVersion: offer.pathDecision.packageVersion,
    stationComplexId: offer.pathDecision.stationComplexId,
    constituentStationId: offer.pathDecision.constituentStationId,
    routeId: offer.pathDecision.routeId,
    direction: offer.pathDecision.direction,
    platformId: offer.pathDecision.platformId,
    equipmentSourceScopeId: offer.pathDecision.equipmentSourceScopeId,
    equipmentSourceVersion: offer.pathDecision.equipmentSourceVersion,
    surface: offer.pathDecision.surface,
    exposureDecisionId: offer.pathDecision.exposureDecisionId,
    tier: offer.tier,
    originIntent: offer.originIntent,
    destinationIntent: offer.destinationIntent,
    singlePointElevatorDependencies: offer.singlePointElevatorDependencies,
    transfers: offer.transfers,
    accessibleWalkingMeters: offer.accessibleWalkingMeters,
    disruptionRisk: offer.disruptionRisk,
    travelSeconds: offer.travelSeconds,
    includesBus: offer.includesBus,
  });
}

function resolveSelection(
  registry: AcceptedAccessibilityAlternativeRegistry,
  selectedPath: ResolvedAccessiblePathDecision,
  busConsent: AcceptedBusAlternativeConsent | undefined,
  first: ResolvedAccessibilityAlternativeOffer | null,
  visible: readonly ResolvedAccessibilityAlternativeOffer[],
  candidatePaths: readonly ResolvedAccessiblePathDecision[],
  decisionTime: Date,
  reason?: string,
): ResolvedAccessibilityAlternativeSelection {
  const createdAt = decisionTime.toISOString();
  const decision = deepFreeze({
    [selectionBrand]: true as const,
    decisionId: `${registry.registryId}|${selectedPath.evaluationId}|${first?.offerId ?? 'none'}|${busConsent?.consentId ?? 'subway-only'}|${createdAt}`,
    registryId: registry.registryId,
    selectedPathEvaluationId: selectedPath.evaluationId,
    stationComplexId: selectedPath.stationComplexId,
    constituentStationId: selectedPath.constituentStationId,
    originIntent: selectedPath.originIntent,
    destinationIntent: selectedPath.destinationIntent,
    surface: selectedPath.surface,
    exposureDecisionId: selectedPath.exposureDecisionId,
    createdAt,
    validThrough: registry.validThrough,
    busConsentId: busConsent?.consentId ?? null,
    first,
    visible,
    selectedId: null,
    accessibleRouteOnly: true as const,
    ...(reason ? { reason } : {}),
  });
  resolvedSelections.add(decision);
  resolvedSelectionState.set(decision, deepFreeze({ registry, selectedPath, candidatePaths: [...candidatePaths] }));
  return decision;
}

function offerMatchesPath(
  offer: ResolvedAccessibilityAlternativeOffer,
  path: ResolvedAccessiblePathDecision,
): boolean {
  return offer.pathId === path.pathId && offer.pathEvaluationId === path.evaluationId
    && offer.pathPackageVersion === path.packageVersion
    && offer.stationComplexId === path.stationComplexId && offer.constituentStationId === path.constituentStationId
    && offer.originIntent === path.originIntent && offer.destinationIntent === path.destinationIntent
    && offer.routeId === path.routeId && offer.direction === path.direction && offer.platformId === path.platformId
    && offer.equipmentSourceScopeId === path.equipmentSourceScopeId
    && offer.equipmentSourceVersion === path.equipmentSourceVersion
    && offer.surface === path.surface && offer.exposureDecisionId === path.exposureDecisionId;
}

function busConsentAllowsUse(
  value: AcceptedBusAlternativeConsent | undefined,
  registry: AcceptedAccessibilityAlternativeRegistry,
  selectedPath: ResolvedAccessiblePathDecision,
  decisionTime: Date,
): boolean {
  if (!value || !acceptedBusConsents.has(value)) return false;
  const time = decisionTime instanceof Date ? decisionTime.getTime() : Number.NaN;
  return Number.isFinite(time) && value.registryId === registry.registryId
    && value.selectedPathEvaluationId === selectedPath.evaluationId
    && value.destinationIntent === selectedPath.destinationIntent
    && time >= Date.parse(value.grantedAt) && time <= Date.parse(value.validThrough);
}

function strictRecord(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const root = value as Record<string, unknown>;
  const ownKeys = Reflect.ownKeys(root);
  if (ownKeys.length !== fields.length || fields.some((field) => !Object.prototype.hasOwnProperty.call(root, field))
    || ownKeys.some((field) => typeof field !== 'string' || !fields.includes(field))) throw new Error(`${label} must contain its exact schema`);
  return root;
}
function nearbyEvidenceMatches(
  evidence: AcceptedNearbyStationEvidence,
  selectedPath: ResolvedAccessiblePathDecision,
  candidatePath: ResolvedAccessiblePathDecision,
  createdAt: string,
  validThrough: string,
): boolean {
  const paths = nearbyStationEvidencePaths.get(evidence);
  return acceptedNearbyStationEvidence.has(evidence) && paths?.selectedPath === selectedPath && paths.candidatePath === candidatePath
    && evidence.selectedStationComplexId === selectedPath.stationComplexId
    && evidence.candidateStationComplexId === candidatePath.stationComplexId
    && evidence.originIntent === selectedPath.originIntent && evidence.destinationIntent === selectedPath.destinationIntent
    && Date.parse(createdAt) >= Date.parse(evidence.verifiedAt) && Date.parse(validThrough) <= Date.parse(evidence.validThrough);
}
function identity(value: unknown, label: string): string { if (typeof value !== 'string' || value.trim() !== value || !value || value.length > 240) throw new Error(`${label} is invalid`); return value; }
function instant(value: unknown, label: string): string { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error(`${label} must be a canonical ISO instant`); return value; }
function enumeration<T extends string>(value: unknown, options: readonly T[], label: string): T { if (typeof value !== 'string' || !options.includes(value as T)) throw new Error(`${label} is invalid`); return value as T; }
function boolean(value: unknown, label: string): boolean { if (typeof value !== 'boolean') throw new Error(`${label} is invalid`); return value; }
function metric(value: unknown, label: string, integer = false): number { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) throw new Error(`${label} is invalid`); return value; }
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); } return value; }
