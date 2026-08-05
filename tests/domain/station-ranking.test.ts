import { describe, expect, test } from 'vitest';

import { parseCoordinate, parseLocationFix, parseWalkRange } from '../../src/shared/domain/geo';
import { rankNearbyStations, type NearbyRankingInput } from '../../src/shared/domain/station-ranking';

describe('geographic boundary values', () => {
  test.each([
    [{ latitude: -90, longitude: -180 }, { latitude: -90, longitude: -180 }],
    [{ latitude: 90, longitude: 180 }, { latitude: 90, longitude: 180 }],
    [{ latitude: 40.7128, longitude: -74.006 }, { latitude: 40.7128, longitude: -74.006 }],
  ])('accepts finite WGS84 endpoint coordinates without deriving distance', (input, expected) => {
    expect(parseCoordinate(input)).toEqual(expected);
  });

  test.each([
    { latitude: -90.000_001, longitude: 0 },
    { latitude: 90.000_001, longitude: 0 },
    { latitude: 0, longitude: -180.000_001 },
    { latitude: 0, longitude: 180.000_001 },
    { latitude: Number.NaN, longitude: 0 },
    { latitude: 0, longitude: Number.POSITIVE_INFINITY },
    { latitude: '40', longitude: -74 },
    { latitude: 40, longitude: -74, distance: 12 },
  ])('rejects invalid or expanded coordinate input %#', (input) => {
    expect(() => parseCoordinate(input)).toThrow(/coordinate/i);
  });

  test('requires a strictly positive finite location accuracy', () => {
    expect(parseLocationFix({ coordinate: { latitude: 40.7, longitude: -74 }, accuracyMeters: 25 })).toEqual({
      coordinate: { latitude: 40.7, longitude: -74 },
      accuracyMeters: 25,
    });
    for (const accuracyMeters of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => parseLocationFix({ coordinate: { latitude: 40.7, longitude: -74 }, accuracyMeters })).toThrow(
        /accuracy/i,
      );
    }
  });

  test.each([
    [{ minimumSeconds: 0, maximumSeconds: 0 }, { minimumSeconds: 0, maximumSeconds: 0 }],
    [{ minimumSeconds: 0, maximumSeconds: 86_400 }, { minimumSeconds: 0, maximumSeconds: 86_400 }],
    [{ minimumSeconds: 359, maximumSeconds: 481 }, { minimumSeconds: 359, maximumSeconds: 481 }],
  ])('accepts complete bounded practical-walk ranges', (input, expected) => {
    expect(parseWalkRange(input)).toEqual(expected);
  });

  test.each([
    { minimumSeconds: -1, maximumSeconds: 0 },
    { minimumSeconds: 0, maximumSeconds: 86_401 },
    { minimumSeconds: 2, maximumSeconds: 1 },
    { minimumSeconds: 1.5, maximumSeconds: 2 },
    { minimumSeconds: 1, maximumSeconds: Number.NaN },
    { minimumSeconds: 1, maximumSeconds: 2, straightLineMeters: 3 },
  ])('rejects unsafe, reversed, fractional, or expanded walk ranges %#', (input) => {
    expect(() => parseWalkRange(input)).toThrow(/walk range/i);
  });
});

describe('nearest useful subway station ranking', () => {
  test('hard-filters exact joins, entry permission, confirmed closure, current exact service, and accessible paths', () => {
    const input = rankingFixture();
    input.complexes.push({ id: 'closed', name: 'Closed' }, { id: 'no-service', name: 'No Service' });
    input.constituents.push(
      { id: 'closed-c', complexId: 'closed', publicName: 'Closed Station' },
      { id: 'no-service-c', complexId: 'no-service', publicName: 'No Service Station' },
    );
    input.entrances.push(
      entrance('closed-e', 'closed', 'closed-c', ['closed-n'], { usability: 'closed' }),
      entrance('no-service-e', 'no-service', 'no-service-c', ['missing-n']),
      entrance('exit-only', 'alpha', 'alpha-c', ['alpha-n'], { entryPermission: 'exit-only' }),
      entrance('unmatched', 'alpha', 'alpha-c', ['alpha-n'], { joinStatus: 'unmatched' }),
      entrance('not-accessible', 'alpha', 'alpha-c', ['alpha-n'], { accessibility: 'unknown' }),
    );
    input.services.push(service('closed-s', 'closed', 'closed-c', 'closed-n', 'northbound', 'Current terminal'));
    input.walk = walkEvidence([
      ['alpha-north', 100, 110], ['alpha-south', 120, 130], ['closed-e', 1, 2],
      ['exit-only', 3, 4], ['unmatched', 5, 6], ['not-accessible', 7, 8],
    ]);
    (input as { accessibleRouteOnly: boolean }).accessibleRouteOnly = true;

    const result = rankNearbyStations(input);
    expect(result.kind).toBe('ranked');
    if (result.kind !== 'ranked') return;
    expect(result.cards.map(({ complexId }) => complexId)).toEqual(['alpha']);
    expect(result.cards[0].directions).toEqual([
      expect.objectContaining({
        direction: 'northbound',
        actualDestination: 'Uptown terminal',
        selectedEntrance: expect.objectContaining({ id: 'alpha-north' }),
      }),
      expect.objectContaining({
        direction: 'southbound',
        actualDestination: 'Downtown terminal',
        selectedEntrance: expect.objectContaining({ id: 'alpha-south' }),
      }),
    ]);
  });

  test('keeps route, arrival, and entrance evidence owned by each exact directional stop', () => {
    const input = rankingFixture();
    input.entrances = [
      entrance('alpha-stop-a-entry', 'alpha', 'alpha-c', ['alpha-stop-a']),
      entrance('alpha-stop-b-entry', 'alpha', 'alpha-c', ['alpha-stop-b']),
    ];
    input.services = [
      {
        ...service('alpha-stop-a-service', 'alpha', 'alpha-c', 'alpha-stop-a', 'northbound', 'Shared terminal'),
        routeId: 'A',
        arrivalState: 'available',
      },
      {
        ...service('alpha-stop-b-service', 'alpha', 'alpha-c', 'alpha-stop-b', 'northbound', 'Shared terminal'),
        routeId: 'C',
        arrivalState: 'unavailable',
      },
    ];
    input.walk = walkEvidence([
      ['alpha-stop-a-entry', 100, 110],
      ['alpha-stop-b-entry', 200, 210],
    ]);

    for (const candidate of [input, reverseRankingInput(input)]) {
      const result = rankNearbyStations(candidate);
      expect(result.kind).toBe('ranked');
      if (result.kind !== 'ranked') continue;
      expect(result.cards[0].directions).toEqual([
        expect.objectContaining({
          directionalStopId: 'alpha-stop-a',
          routeIds: ['A'],
          arrivalState: 'available',
          selectedEntrance: expect.objectContaining({ id: 'alpha-stop-a-entry' }),
        }),
        expect.objectContaining({
          directionalStopId: 'alpha-stop-b',
          routeIds: ['C'],
          arrivalState: 'unavailable',
          selectedEntrance: expect.objectContaining({ id: 'alpha-stop-b-entry' }),
        }),
      ]);
    }
  });

  test('retains an all-unconfirmed complex only as an honest detail and picker option', () => {
    const input = rankingFixture();
    input.entrances = [
      entrance('alpha-north', 'alpha', 'alpha-c', ['alpha-n'], { usability: 'stale' }),
      entrance('alpha-south', 'alpha', 'alpha-c', ['alpha-s'], { usability: 'missing' }),
    ];
    input.walk = { kind: 'unavailable', reason: 'unsupported' };

    const result = rankNearbyStations(input);
    expect(result).toMatchObject({
      kind: 'picker',
      reason: 'no-confirmed-entrance',
      cards: [],
      picker: { required: true, bottomAnchored: true },
    });
    const serialized = JSON.stringify(result);
    expect(result.picker.options[0]).toEqual({
      complexId: 'alpha',
      complexName: 'Alpha Complex',
      entranceAvailability: 'unconfirmed',
      message: 'Entrance availability not confirmed',
      arrivalState: 'unavailable',
      stationDetailAvailable: true,
    });
    for (const forbidden of ['selectedEntrance', 'useful', 'open', 'nearest']) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  test.each([
    { kind: 'unavailable', reason: 'timeout' },
    {
      kind: 'available', source: 'practical-walk', sourceId: 'walk', coverage: { kind: 'complete-universe' },
      results: [{ destinationId: 'alpha-north', range: { minimumSeconds: 100, maximumSeconds: 110 } }],
    },
  ] as const)('requires complete comparable practical-walk evidence for automatic ranking %#', (walk) => {
    const input = rankingFixture();
    input.walk = walk;
    const result = rankNearbyStations(input);
    expect(result).toMatchObject({ kind: 'picker', cards: [], picker: { required: true, bottomAnchored: true } });
  });

  test('uses maximal inclusive-overlap components instead of a nontransitive pair comparator', () => {
    const input = manyComplexes(['zulu', 'alpha', 'middle', 'outside']);
    input.walk = walkEvidence([
      ['zulu-e', 0, 10],
      ['alpha-e', 10, 20],
      ['middle-e', 20, 30],
      ['outside-e', 31, 40],
    ]);
    const expected = ['alpha', 'middle', 'zulu'];
    for (const shuffled of [input, reverseRankingInput(input)]) {
      const result = rankNearbyStations(shuffled);
      expect(result.kind).toBe('ranked');
      if (result.kind !== 'ranked') continue;
      expect(result.cards.map(({ complexId }) => complexId)).toEqual(expected);
      expect(result.cards).toHaveLength(3);
      expect(result.cards.every(({ walkComparison }) => walkComparison === 'About the same walk.')).toBe(true);
    }
  });

  test('breaks tied entrances by normalized public description then canonical identity and names the tie honestly', () => {
    const input = rankingFixture();
    input.entrances.push(
      entrance('alpha-north-b', 'alpha', 'alpha-c', ['alpha-n'], { publicDescription: '  BETA   corner ' }),
      entrance('alpha-north-a2', 'alpha', 'alpha-c', ['alpha-n'], { publicDescription: 'alpha corner' }),
      entrance('alpha-north-a1', 'alpha', 'alpha-c', ['alpha-n'], { publicDescription: 'Alpha  Corner' }),
    );
    input.walk = walkEvidence([
      ['alpha-north', 100, 120], ['alpha-north-b', 110, 130],
      ['alpha-north-a2', 115, 140], ['alpha-north-a1', 119, 141], ['alpha-south', 300, 310],
    ]);

    const result = rankNearbyStations(reverseRankingInput(input));
    expect(result.kind).toBe('ranked');
    if (result.kind !== 'ranked') return;
    const north = result.cards[0].directions.find(({ direction }) => direction === 'northbound');
    expect(north?.selectedEntrance).toMatchObject({
      id: 'alpha-north-a1',
      publicDescription: 'Alpha  Corner',
      nearestLabel: 'One of the closest confirmed entrances.',
      walkComparison: 'About the same walk.',
    });
  });

  test('preserves precise/approximate parity only when the same practical-walk evidence supports it', () => {
    const precise = rankingFixture();
    (precise as { locationAccuracyMeters: number }).locationAccuracyMeters = 5;
    const approximate = rankingFixture();
    (approximate as { locationAccuracyMeters: number }).locationAccuracyMeters = 1_000;
    expect(rankNearbyStations(approximate)).toEqual(rankNearbyStations(precise));

    approximate.walk = { kind: 'unavailable', reason: 'timeout' };
    expect(rankNearbyStations(approximate).kind).toBe('picker');
  });

  test('never ranks by injected straight-line or centroid values and returns detached coordinate-free frozen output', () => {
    const input = manyComplexes(['a', 'b']);
    input.walk = walkEvidence([['a-e', 200, 210], ['b-e', 100, 110]]);
    (input.complexes[0] as unknown as Record<string, unknown>).straightLineMeters = 1;
    (input.complexes[1] as unknown as Record<string, unknown>).centroidDistanceMeters = 1_000_000;
    expect(() => rankNearbyStations(input)).toThrow(/complex fields/i);

    delete (input.complexes[0] as unknown as Record<string, unknown>).straightLineMeters;
    delete (input.complexes[1] as unknown as Record<string, unknown>).centroidDistanceMeters;
    const result = rankNearbyStations(input);
    input.complexes[1].name = 'mutated';
    expect(result.kind).toBe('ranked');
    if (result.kind !== 'ranked') return;
    expect(result.cards[0].complexId).toBe('b');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.cards)).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/latitude|longitude|coordinate/i);
  });
});

function rankingFixture(): NearbyRankingInput & {
  complexes: Array<{ id: string; name: string }>;
  constituents: Array<{ id: string; complexId: string; publicName: string }>;
  entrances: ReturnType<typeof entrance>[];
  services: ReturnType<typeof service>[];
  walk: NearbyRankingInput['walk'];
} {
  return {
    complexes: [{ id: 'alpha', name: 'Alpha Complex' }],
    constituents: [{ id: 'alpha-c', complexId: 'alpha', publicName: 'Alpha Station' }],
    entrances: [
      entrance('alpha-north', 'alpha', 'alpha-c', ['alpha-n']),
      entrance('alpha-south', 'alpha', 'alpha-c', ['alpha-s']),
    ],
    services: [
      service('alpha-n-service', 'alpha', 'alpha-c', 'alpha-n', 'northbound', 'Uptown terminal'),
      service('alpha-s-service', 'alpha', 'alpha-c', 'alpha-s', 'southbound', 'Downtown terminal'),
    ],
    walk: walkEvidence([['alpha-north', 100, 110], ['alpha-south', 120, 130]]),
    accessibleRouteOnly: false,
    locationAccuracyMeters: 10,
  };
}

function entrance(
  id: string,
  complexId: string,
  constituentId: string,
  directionalStopIds: string[],
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    complexId,
    constituentId,
    publicDescription: `${id} corner`,
    entryPermission: 'entry' as const,
    joinStatus: 'matched' as const,
    directionalStopIds,
    usability: 'open' as const,
    accessibility: 'eligible' as const,
    ...overrides,
  };
}

function service(
  id: string,
  complexId: string,
  constituentId: string,
  directionalStopId: string,
  direction: 'northbound' | 'southbound',
  actualDestination: string,
): NearbyRankingInput['services'][number] {
  return {
    id,
    complexId,
    constituentId,
    directionalStopId,
    routeId: 'A',
    direction,
    actualDestination,
    state: 'current' as const,
    arrivalState: 'available' as const,
  };
}

function walkEvidence(rows: ReadonlyArray<readonly [string, number, number]>): NearbyRankingInput['walk'] {
  return {
    kind: 'available',
    source: 'practical-walk',
    sourceId: 'walk-fixture',
    coverage: { kind: 'complete-universe' },
    results: rows.map(([destinationId, minimumSeconds, maximumSeconds]) => ({
      destinationId,
      range: { minimumSeconds, maximumSeconds },
    })),
  };
}

function manyComplexes(ids: string[]): ReturnType<typeof rankingFixture> {
  const input = rankingFixture();
  input.complexes = [];
  input.constituents = [];
  input.entrances = [];
  input.services = [];
  for (const id of ids) {
    input.complexes.push({ id, name: `${id[0].toUpperCase()}${id.slice(1)} Complex` });
    input.constituents.push({ id: `${id}-c`, complexId: id, publicName: `${id} station` });
    input.entrances.push(entrance(`${id}-e`, id, `${id}-c`, [`${id}-n`]));
    input.services.push(service(`${id}-s`, id, `${id}-c`, `${id}-n`, 'northbound', `${id} terminal`));
  }
  return input;
}

function reverseRankingInput(input: ReturnType<typeof rankingFixture>): ReturnType<typeof rankingFixture> {
  return {
    ...structuredClone(input),
    complexes: structuredClone(input.complexes).reverse(),
    constituents: structuredClone(input.constituents).reverse(),
    entrances: structuredClone(input.entrances).reverse(),
    services: structuredClone(input.services).reverse(),
    walk: input.walk.kind === 'available'
      ? { ...structuredClone(input.walk), results: [...structuredClone(input.walk.results)].reverse() }
      : structuredClone(input.walk),
  };
}
