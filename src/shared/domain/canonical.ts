const encoder = new TextEncoder();

export const MAX_CANONICAL_IDENTITY_CODE_POINTS = 256;

/** The identity representation used only as a neutral final tie-breaker. */
export function normalizeCanonicalIdentity(value: string): string {
  assertUnicodeScalars(value);
  return value.normalize('NFC');
}

/**
 * Normalizes an externally supplied identifier while keeping it safe for use
 * in claim keys, maps, and audit records. Operational identifiers are tokens,
 * so Unicode separators and non-printing code points are never meaningful.
 */
export function normalizeBoundedIdentity(
  value: string,
  label = 'canonical',
  maxCodePoints = MAX_CANONICAL_IDENTITY_CODE_POINTS,
): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label} identity`);
  const normalized = normalizeCanonicalIdentity(value);
  if (!normalized || [...normalized].length > maxCodePoints || /[\p{C}\p{Z}]/u.test(normalized)) {
    throw new Error(`Invalid ${label} identity`);
  }
  return normalized;
}

/** A self-delimiting encoding whose fields cannot alias across tuple boundaries. */
export function encodeCanonicalStringTuple(values: readonly (string | null)[]): string {
  return values.map((value) => {
    if (value === null) return 'n;';
    const normalized = normalizeCanonicalIdentity(value);
    return `s${encoder.encode(normalized).length}:${normalized};`;
  }).join('');
}

/** A bounded identity-tuple variant for externally supplied operational keys. */
export function encodeCanonicalIdentityTuple(
  values: readonly (string | null)[],
  label = 'claim',
): string {
  return encodeCanonicalStringTuple(values.map((value) => value === null
    ? null
    : normalizeBoundedIdentity(value, label)));
}

/** Compares NFC identities by unsigned UTF-8 bytes, including explicit prefix handling. */
export function compareCanonicalIdentity(left: string, right: string): number {
  const leftBytes = encoder.encode(normalizeCanonicalIdentity(left));
  const rightBytes = encoder.encode(normalizeCanonicalIdentity(right));
  const sharedLength = Math.min(leftBytes.length, rightBytes.length);

  for (let index = 0; index < sharedLength; index += 1) {
    const difference = leftBytes[index] - rightBytes[index];
    if (difference !== 0) return difference;
  }

  return leftBytes.length - rightBytes.length;
}

export function sortByCanonicalIdentity<T>(values: readonly T[], identity: (value: T) => string): T[] {
  const normalizedIdentities = new Set<string>();
  for (const value of values) {
    const normalizedIdentity = normalizeCanonicalIdentity(identity(value));
    if (normalizedIdentities.has(normalizedIdentity)) {
      throw new Error('Incomplete canonical selection: duplicate canonical identity');
    }
    normalizedIdentities.add(normalizedIdentity);
  }
  return [...values].sort((left, right) => compareCanonicalIdentity(identity(left), identity(right)));
}

function assertUnicodeScalars(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('Invalid Unicode scalar value');
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new Error('Invalid Unicode scalar value');
    }
  }
}
