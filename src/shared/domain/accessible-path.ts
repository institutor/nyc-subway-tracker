import { compareCanonicalIdentity, normalizeCanonicalIdentity } from './canonical';
import { isResolvedEquipmentStatusDecision, type EquipmentStatusDecision } from './equipment-status';
import type { Direction } from './types';
import { exposureAllowsEvaluation, type ResolvedAccessibilityExposure } from './exposure-decision';

interface ReviewDecision { readonly decision: 'approve' | 'changes-required'; readonly reviewer: string; readonly date: string; readonly recordVersion: string }
export interface StationDirectionCoverageRow {
  readonly coverageRecordId: string; readonly coverageRecordVersion: string;
  readonly stationComplex: { readonly id: string; readonly name: string }; readonly constituentStation: { readonly id: string; readonly name: string };
  readonly routeOrLine: string; readonly normalizedDirection: Direction;
  readonly accessibleStreetEntrance: { readonly id: string; readonly description: string }; readonly streetCorner: string;
  readonly directionalPlatform: string; readonly boardingArea: string; readonly completePathId: string; readonly orderedEdgeIds: readonly string[];
  readonly equipmentIds: readonly string[]; readonly accessiblePathMembershipByEdge: Readonly<Record<string, boolean>>;
  readonly operatingRestrictions: readonly string[]; readonly evidenceSources: readonly string[]; readonly evidenceReferences: readonly string[];
  readonly verificationDate: string; readonly verifier: { readonly name: string; readonly role: string };
  readonly productDecision: ReviewDecision; readonly accessibilityDecision: ReviewDecision; readonly dataQualityDecision: ReviewDecision;
  readonly contentDecision: ReviewDecision; readonly operationsDecision: ReviewDecision;
  readonly structuralDisposition: { readonly status: 'accepted' | 'rejected' | 'pending'; readonly reason: string };
  readonly unsupportedScope: { readonly lines: readonly string[]; readonly directions: readonly string[]; readonly entrances: readonly string[]; readonly platforms: readonly string[]; readonly servicePatterns: readonly string[]; readonly paths: readonly string[] };
}
export interface AccessiblePathEdge {
  readonly id: string; readonly order: number; readonly movementType: 'elevator' | 'compliant-ramp' | 'level-path' | 'stairs' | 'escalator';
  readonly start: { readonly id: string; readonly level: string }; readonly end: { readonly id: string; readonly level: string };
  readonly routeId: string; readonly direction: Direction; readonly platformId: string; readonly equipmentId: string | null;
  readonly officialAccessiblePath: boolean; readonly restrictions: readonly string[]; readonly verificationDate: string;
  readonly evidenceReference: string; readonly reviewDisposition: 'approved' | 'rejected' | 'pending'; readonly canonicalPathIdentity: string;
}
export interface AccessibilityPackage { readonly packageId: string; readonly version: string; readonly canonicalPathIdentity: string; readonly coverage: StationDirectionCoverageRow; readonly edges: readonly AccessiblePathEdge[]; readonly approvedVersion: string }
const accessiblePathDecisionBrand: unique symbol = Symbol('resolved-accessible-path-decision');
export interface ResolvedAccessiblePathDecision {
  readonly [accessiblePathDecisionBrand]: true;
  readonly evaluationId: string;
  readonly pathId: string;
  readonly packageVersion: string;
  readonly status: 'eligible' | 'ineligible' | 'unknown';
  readonly reason: string;
  readonly accessibleRouteOnly: true;
  readonly offlineCopy?: 'Structurally step-free; live elevator status unavailable';
}
const resolvedAccessiblePathDecisions = new WeakSet<object>();

const COVERAGE_FIELDS = ['coverageRecordId','coverageRecordVersion','stationComplex','constituentStation','routeOrLine','normalizedDirection','accessibleStreetEntrance','streetCorner','directionalPlatform','boardingArea','completePathId','orderedEdgeIds','equipmentIds','accessiblePathMembershipByEdge','operatingRestrictions','evidenceSources','evidenceReferences','verificationDate','verifier','productDecision','accessibilityDecision','dataQualityDecision','contentDecision','operationsDecision','structuralDisposition','unsupportedScope'] as const;
const EDGE_EVIDENCE_FIELDS = ['movementType','start','routeId','equipmentId','officialAccessiblePath','restrictions','verificationDate'] as const;

export function validateCoverageRow(raw: unknown): StationDirectionCoverageRow {
  const row = asRecord(raw, '26-field station-direction coverage row');
  for (const field of COVERAGE_FIELDS) if (!(field in row)) throw new Error(`26-field coverage row missing ${field}`);
  if (Object.keys(row).length !== 26) throw new Error('26-field coverage row must contain exactly 26 atomic fields');
  const value = row as unknown as StationDirectionCoverageRow;
  if (value.structuralDisposition.status !== 'accepted' || !value.orderedEdgeIds.length) throw new Error('Coverage row is not structurally accepted');
  if (![value.coverageRecordId,value.coverageRecordVersion,value.stationComplex?.id,value.stationComplex?.name,value.constituentStation?.id,value.constituentStation?.name,value.routeOrLine,value.accessibleStreetEntrance?.id,value.accessibleStreetEntrance?.description,value.streetCorner,value.directionalPlatform,value.boardingArea,value.completePathId,value.verificationDate,value.verifier?.name,value.verifier?.role].every(nonEmpty)) throw new Error('Coverage row contains incomplete nested identity, scope, or verification evidence');
  if (!value.operatingRestrictions.length || !value.evidenceSources.length || !value.evidenceReferences.length || !Number.isFinite(Date.parse(`${value.verificationDate}T00:00:00Z`))) throw new Error('Coverage row restrictions, evidence, or verification are incomplete');
  const unsupportedKeys = ['lines','directions','entrances','platforms','servicePatterns','paths'] as const;
  if (!value.unsupportedScope || unsupportedKeys.some((key) => !Array.isArray(value.unsupportedScope[key]))) throw new Error('Coverage row explicitly unsupported scope is incomplete');
  if (value.orderedEdgeIds.some((id) => value.accessiblePathMembershipByEdge[id] !== true)) throw new Error('Coverage row official accessible-path membership is incomplete');
  for (const decision of [value.productDecision, value.accessibilityDecision, value.dataQualityDecision, value.contentDecision, value.operationsDecision]) {
    if (decision.decision !== 'approve' || decision.recordVersion !== value.coverageRecordVersion || !decision.reviewer || !decision.date) throw new Error('Coverage reviews must approve the same immutable version');
  }
  return deepFreeze(value);
}

export function validateAccessibilityPackage(raw: unknown): AccessibilityPackage {
  const root = asRecord(raw, 'accessibility package');
  const coverage = validateCoverageRow(root.coverage);
  if (!Array.isArray(root.edges)) throw new Error('Accessibility package edges are required');
  const edges = root.edges.map(validateEdge).sort((a, b) => a.order - b.order);
  const value = { ...root, coverage, edges } as unknown as AccessibilityPackage;
  if (!value.packageId || !value.version || !value.approvedVersion || !value.canonicalPathIdentity) throw new Error('Immutable path package identity and version are required');
  normalizeCanonicalIdentity(value.canonicalPathIdentity);
  if (value.version !== coverage.coverageRecordVersion || value.approvedVersion !== value.version) throw new Error('Path package and approvals must use the same version');
  if (coverage.completePathId !== value.canonicalPathIdentity) throw new Error('Coverage path identity does not match package identity');
  if (edges.length !== coverage.orderedEdgeIds.length || edges.some((edge, index) => edge.id !== coverage.orderedEdgeIds[index] || edge.order !== index + 1)) throw new Error('Ordered edge IDs do not match complete chain');
  for (let index = 1; index < edges.length; index += 1) if (edges[index - 1].end.id !== edges[index].start.id || edges[index - 1].end.level !== edges[index].start.level) throw new Error('Ordered path edge endpoints are discontinuous');
  for (const edge of edges) {
    if (edge.routeId !== coverage.routeOrLine || edge.direction !== coverage.normalizedDirection || edge.platformId !== coverage.directionalPlatform) throw new Error('Path edge route, direction, or platform scope does not match coverage');
    if (edge.canonicalPathIdentity !== value.canonicalPathIdentity || coverage.accessiblePathMembershipByEdge[edge.id] !== true) throw new Error('Path edge identity or official membership does not match coverage');
  }
  const edgeEquipmentIds = edges.flatMap((edge) => edge.equipmentId ? [edge.equipmentId] : []).sort();
  const coverageEquipmentIds = [...coverage.equipmentIds].sort();
  if (edgeEquipmentIds.length !== coverageEquipmentIds.length || edgeEquipmentIds.some((id,index) => id !== coverageEquipmentIds[index])) throw new Error('Official equipment identities do not join exactly between coverage and edges');
  return deepFreeze(value);
}

export function validateAccessibilityRegistry(raw: readonly unknown[]): readonly AccessibilityPackage[] {
  const values = raw.map(validateAccessibilityPackage); const identities = new Set<string>();
  for (const value of values) { const identity = normalizeCanonicalIdentity(value.canonicalPathIdentity); if (identities.has(identity)) throw new Error(`Duplicate canonical path identity: ${identity}`); identities.add(identity); }
  return deepFreeze(values);
}
export function orderAccessiblePaths(paths: readonly AccessibilityPackage[]): readonly AccessibilityPackage[] { return Object.freeze([...paths].sort((a,b) => compareCanonicalIdentity(a.canonicalPathIdentity,b.canonicalPathIdentity))); }

export function assessAccessiblePath(rawPackage: AccessibilityPackage, request: { readonly stationId: string; readonly routeId: string; readonly direction: Direction; readonly platformId: string; readonly equipmentSourceScopeId: string; readonly equipmentSourceVersion: string; readonly equipment: Readonly<Record<string, EquipmentStatusDecision>>; readonly exposure?: ResolvedAccessibilityExposure }): ResolvedAccessiblePathDecision {
  const item = validateAccessibilityPackage(rawPackage);
  if (!exposureAllowsEvaluation(request.exposure, item.version, 'accessibility')) return resolvedPathDecision(item, 'unknown', 'Accessibility exposure evidence is pending or does not match this immutable package.');
  if (item.coverage.constituentStation.id !== request.stationId || item.coverage.routeOrLine !== request.routeId || item.coverage.normalizedDirection !== request.direction || item.coverage.directionalPlatform !== request.platformId) return resolvedPathDecision(item, 'ineligible', 'No reviewed path package matches the exact station, route, direction, and platform.');
  const missing = item.coverage.equipmentIds.filter((id) => !request.equipment[id]);
  if (missing.length) return resolvedPathDecision(item, 'unknown', 'Live route-critical equipment evidence is missing.', 'Structurally step-free; live elevator status unavailable');
  for (const id of item.coverage.equipmentIds) {
    const equipment = request.equipment[id];
    if (!isResolvedEquipmentStatusDecision(equipment) || equipment.targetEquipmentId !== id
      || equipment.evidenceOwner !== 'official-equipment-status'
      || equipment.sourceScopeId !== request.equipmentSourceScopeId
      || equipment.sourceVersion !== request.equipmentSourceVersion) {
      return resolvedPathDecision(item, 'unknown', `Current status evidence for required equipment ${id} has the wrong identity, owner, scope, or version.`);
    }
    if (equipment.state === 'out-of-service' || equipment.state === 'out-of-service-rechecking') return resolvedPathDecision(item, 'ineligible', `Required equipment ${id} has accepted adverse evidence.`);
    if (equipment.health !== 'current' || equipment.state !== 'no-official-outage-reported') return resolvedPathDecision(item, 'unknown', `Current status for required equipment ${id} is not verified.`);
  }
  return resolvedPathDecision(item, 'eligible', 'Every structural edge and route-critical equipment decision passes for the exact path.');
}

export function isResolvedAccessiblePathDecision(value: unknown): value is ResolvedAccessiblePathDecision {
  return Boolean(value && typeof value === 'object' && resolvedAccessiblePathDecisions.has(value));
}

function resolvedPathDecision(
  item: AccessibilityPackage,
  status: ResolvedAccessiblePathDecision['status'],
  reason: string,
  offlineCopy?: ResolvedAccessiblePathDecision['offlineCopy'],
): ResolvedAccessiblePathDecision {
  const decision = Object.freeze({
    [accessiblePathDecisionBrand]: true as const,
    evaluationId: `${item.packageId}:${item.version}:${status}`,
    pathId: item.canonicalPathIdentity,
    packageVersion: item.version,
    status,
    reason,
    accessibleRouteOnly: true as const,
    ...(offlineCopy ? { offlineCopy } : {}),
  });
  resolvedAccessiblePathDecisions.add(decision);
  return decision;
}

function validateEdge(raw: unknown): AccessiblePathEdge {
  const edge = asRecord(raw, 'path edge');
  for (const field of EDGE_EVIDENCE_FIELDS) if (!(field in edge)) throw new Error(`Path edge missing ${field}`);
  for (const field of ['id','order','end','platformId','evidenceReference','reviewDisposition','canonicalPathIdentity'] as const) if (!(field in edge)) throw new Error(`Path edge missing ${field}`);
  const value = edge as unknown as AccessiblePathEdge;
  if (!Number.isInteger(value.order) || value.order < 1) throw new Error('Path edge order is invalid');
  if (![value.id,value.start?.id,value.start?.level,value.end?.id,value.end?.level,value.routeId,value.platformId,value.verificationDate,value.evidenceReference,value.canonicalPathIdentity].every(nonEmpty)) throw new Error('Path edge endpoints, levels, scope, evidence, or verification are incomplete');
  if (value.movementType === 'stairs' || value.movementType === 'escalator') throw new Error('Path edge is not wheelchair-accessible');
  if (value.movementType === 'elevator' && !value.equipmentId) throw new Error('Path edge equipmentId is required');
  if (!value.officialAccessiblePath || value.reviewDisposition !== 'approved' || !value.verificationDate || !value.restrictions.length || value.restrictions.includes('staff-only')) throw new Error('Path edge evidence is not approved for rider use');
  return deepFreeze(value);
}
function asRecord(value: unknown, name: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`); return value as Record<string, unknown>; }
function nonEmpty(value: unknown): boolean { return typeof value === 'string' && value.trim().length > 0; }
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); } return value; }
