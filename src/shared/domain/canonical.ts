const encoder = new TextEncoder();

/** The identity representation used only as a neutral final tie-breaker. */
export function normalizeCanonicalIdentity(value: string): string {
  assertUnicodeScalars(value);
  return value.normalize('NFC');
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
