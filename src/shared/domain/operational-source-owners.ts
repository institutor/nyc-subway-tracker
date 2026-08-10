import {
  compareCanonicalIdentity,
  encodeCanonicalStringTuple,
  normalizeBoundedIdentity,
} from './canonical';

export const OPERATIONAL_SOURCE_MAX_AGE_MS = 90_000;

const MAP_SERVICE_SOURCES = new Set(['supplemented-gtfs', 'gtfs-rt', 'alerts']);

export interface OperationalSourceHandle {
  readonly source: string;
  readonly sourceId: string;
}

export interface OperationalSourceProvenance extends OperationalSourceHandle {
  readonly observedAt: string;
  readonly retrievedAt: string;
}

export interface OperationalSourceHealth extends OperationalSourceHandle {
  readonly state: string;
  readonly reasonCode?: string;
  readonly assessedAt: string;
  readonly lastAcceptedAt?: string;
}

export interface OperationalSourceOwnerReceipt extends OperationalSourceHandle {
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly lastAcceptedAt: string;
  readonly assessedAt: string;
}

export interface OperationalSourceOwnerEvidence {
  readonly evidenceId: string;
  readonly evidenceAt: string;
}

export function admitOperationalSourceOwners(input: {
  readonly ownerRefs: readonly OperationalSourceHandle[];
  readonly provenance: readonly OperationalSourceProvenance[];
  readonly sourceHealth: readonly OperationalSourceHealth[];
  readonly decidedAt: string;
  readonly serverTime: string;
  readonly claimedReceipts?: readonly OperationalSourceOwnerReceipt[];
  readonly notBefore?: string;
}): readonly OperationalSourceOwnerReceipt[] | undefined {
  const decidedAt = exactInstant(input.decidedAt);
  const serverTime = exactInstant(input.serverTime);
  const notBefore = input.notBefore === undefined ? undefined : exactInstant(input.notBefore);
  if (decidedAt === undefined || serverTime === undefined || decidedAt !== serverTime
    || (input.notBefore !== undefined && notBefore === undefined)
    || input.ownerRefs.length === 0 || input.ownerRefs.length > 16) return undefined;

  const refs = captureUniqueHandles(input.ownerRefs);
  if (!refs) return undefined;
  const receipts: OperationalSourceOwnerReceipt[] = [];
  for (const ref of refs) {
    const provenance = input.provenance.filter((row) => sameHandle(row, ref));
    const health = input.sourceHealth.filter((row) => sameHandle(row, ref));
    if (provenance.length !== 1 || health.length !== 1 || health[0]!.state !== 'current'
      || (health[0]!.reasonCode !== undefined && health[0]!.reasonCode !== 'SOURCE_CURRENT')
      || health[0]!.lastAcceptedAt === undefined) return undefined;
    const observedAt = exactInstant(provenance[0]!.observedAt);
    const retrievedAt = exactInstant(provenance[0]!.retrievedAt);
    const lastAcceptedAt = exactInstant(health[0]!.lastAcceptedAt);
    const assessedAt = exactInstant(health[0]!.assessedAt);
    if (observedAt === undefined || retrievedAt === undefined || lastAcceptedAt === undefined || assessedAt === undefined
      || observedAt > retrievedAt || retrievedAt !== lastAcceptedAt || lastAcceptedAt > assessedAt
      || assessedAt > decidedAt || decidedAt - observedAt > OPERATIONAL_SOURCE_MAX_AGE_MS
      || decidedAt - lastAcceptedAt > OPERATIONAL_SOURCE_MAX_AGE_MS
      || (notBefore !== undefined && (observedAt < notBefore || retrievedAt < notBefore
        || lastAcceptedAt < notBefore || assessedAt < notBefore))) return undefined;
    receipts.push({
      ...ref,
      observedAt: provenance[0]!.observedAt,
      retrievedAt: provenance[0]!.retrievedAt,
      lastAcceptedAt: health[0]!.lastAcceptedAt,
      assessedAt: health[0]!.assessedAt,
    });
  }

  if (input.claimedReceipts && !sameReceipts(receipts, input.claimedReceipts)) return undefined;
  return Object.freeze(receipts.map((receipt) => Object.freeze(receipt)));
}

export function isCanonicalOperationalServiceEpoch(value: unknown): value is string {
  try {
    return typeof value === 'string' && normalizeBoundedIdentity(value, 'map service epoch', 128) === value;
  } catch {
    return false;
  }
}

export function operationalSourceOwnerEvidence(
  owners: readonly OperationalSourceOwnerReceipt[],
): OperationalSourceOwnerEvidence | undefined {
  if (owners.length === 0) return undefined;
  const captured = captureUniqueHandles(owners);
  if (!captured) return undefined;
  const sortedOwners = captured.map((ref) => owners.find((owner) => sameHandle(owner, ref))!);
  const evidenceAt = sortedOwners.map(({ lastAcceptedAt }) => lastAcceptedAt).sort().at(-1)!;
  if (sortedOwners.length === 1) {
    const owner = sortedOwners[0]!;
    return {
      evidenceId: `map-owner:${owner.source}:${owner.sourceId}:${owner.observedAt}:${owner.retrievedAt}:${owner.lastAcceptedAt}`,
      evidenceAt,
    };
  }
  const identity = encodeCanonicalStringTuple(sortedOwners.flatMap((owner) => [
    owner.source, owner.sourceId, owner.observedAt, owner.retrievedAt, owner.lastAcceptedAt,
  ]));
  return { evidenceId: `map-owner-set:${identity}`, evidenceAt };
}

function captureUniqueHandles(values: readonly OperationalSourceHandle[]): OperationalSourceHandle[] | undefined {
  try {
    const captured = values.map((value) => ({
      source: normalizeBoundedIdentity(value.source, 'source owner', 32),
      sourceId: normalizeBoundedIdentity(value.sourceId, 'source owner', 128),
    }));
    if (captured.some(({ source }) => !MAP_SERVICE_SOURCES.has(source))) return undefined;
    const keys = captured.map(({ source, sourceId }) => `${source}\u0000${sourceId}`);
    if (new Set(keys).size !== keys.length) return undefined;
    return captured.sort((left, right) => compareCanonicalIdentity(left.source, right.source)
      || compareCanonicalIdentity(left.sourceId, right.sourceId));
  } catch {
    return undefined;
  }
}

function sameReceipts(
  expected: readonly OperationalSourceOwnerReceipt[],
  actual: readonly OperationalSourceOwnerReceipt[],
): boolean {
  return expected.length === actual.length && expected.every((left, index) => {
    const right = actual[index];
    return right !== undefined && sameHandle(left, right)
      && left.observedAt === right.observedAt && left.retrievedAt === right.retrievedAt
      && left.lastAcceptedAt === right.lastAcceptedAt && left.assessedAt === right.assessedAt;
  });
}

function sameHandle(left: OperationalSourceHandle, right: OperationalSourceHandle): boolean {
  return left.source === right.source && left.sourceId === right.sourceId;
}

function exactInstant(value: string): number | undefined {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : undefined;
}
