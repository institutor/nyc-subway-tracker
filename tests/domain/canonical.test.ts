import { describe, expect, test } from 'vitest';

import {
  compareCanonicalIdentity,
  normalizeCanonicalIdentity,
  sortByCanonicalIdentity,
} from '../../src/shared/domain/canonical';

describe('canonical identity', () => {
  test('normalizes Unicode identity to NFC before comparison', () => {
    expect(normalizeCanonicalIdentity('Cafe\u0301')).toBe('Caf\u00e9');
    expect(compareCanonicalIdentity('Cafe\u0301', 'Caf\u00e9')).toBe(0);
  });

  test('uses unsigned UTF-8 byte order rather than UTF-16 code-unit order', () => {
    expect(compareCanonicalIdentity('\u0080', '\u007f')).toBeGreaterThan(0);
  });

  test('orders a prefix before the longer identity', () => {
    expect(compareCanonicalIdentity('A', 'A!')).toBeLessThan(0);
  });

  test('produces the same canonical order from shuffled input', () => {
    const expected = ['A', 'A!', 'Cafe\u0301', '\u007f', '\u0080'];

    expect(sortByCanonicalIdentity(['\u0080', 'A!', '\u007f', 'Cafe\u0301', 'A'], (value) => value)).toEqual(
      expected,
    );
    expect(sortByCanonicalIdentity(['A', 'Cafe\u0301', '\u007f', 'A!', '\u0080'], (value) => value)).toEqual(
      expected,
    );
  });

  test('fails closed when distinct records normalize to the same identity', () => {
    const sourceOrder = [
      { id: 'Caf\u00e9', record: 'first' },
      { id: 'Cafe\u0301', record: 'second' },
    ];
    const reversedOrder = [...sourceOrder].reverse();

    expect(() => sortByCanonicalIdentity(sourceOrder, (value) => value.id)).toThrow(
      'Incomplete canonical selection: duplicate canonical identity',
    );
    expect(() => sortByCanonicalIdentity(reversedOrder, (value) => value.id)).toThrow(
      'Incomplete canonical selection: duplicate canonical identity',
    );
  });

  test('rejects invalid Unicode scalar input instead of replacement-encoding it', () => {
    expect(() => normalizeCanonicalIdentity('\ud800')).toThrow('Invalid Unicode scalar value');
  });
});
