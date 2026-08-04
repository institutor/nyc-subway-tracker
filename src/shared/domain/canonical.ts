const encoder = new TextEncoder();

/** The identity representation used only as a neutral final tie-breaker. */
export function normalizeCanonicalIdentity(value: string): string {
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
  return [...values].sort((left, right) => compareCanonicalIdentity(identity(left), identity(right)));
}
