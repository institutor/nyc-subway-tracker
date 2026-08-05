import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

import { canonicalCsvRowIdentity, parseCsv } from '../../src/server/gtfs/csv-reader';
import { loadEntranceCatalog } from '../../src/server/gtfs/entrance-loader';
import { loadStaticGtfsArchive } from '../../src/server/gtfs/static-loader';
import { isServiceActive, serviceTimeToInstant } from '../../src/server/gtfs/static-normalizer';
import { validateAndReadGtfsZip } from '../../src/server/gtfs/zip-validator';

const fixture = (name: string) => resolve('tests', 'fixtures', 'gtfs', name);

describe('bounded GTFS ZIP validation', () => {
  test('loads required root tables without extracting paths', async () => {
    const archive = await readFile(fixture('regular.zip'));
    const tables = await validateAndReadGtfsZip(archive);

    expect([...tables.keys()]).toEqual([
      'agency.txt',
      'calendar.txt',
      'calendar_dates.txt',
      'feed_info.txt',
      'routes.txt',
      'shapes.txt',
      'stop_times.txt',
      'stops.txt',
      'transfers.txt',
      'trips.txt',
    ]);
    expect(new TextDecoder().decode(tables.get('agency.txt'))).toContain('Fixture Transit');
  });

  test.each([
    ['parent traversal', '../stops.txt'],
    ['absolute path', '/stops.txt'],
    ['Windows drive path', 'C:/stops.txt'],
    ['backslash traversal', '..\\stops.txt'],
  ])('rejects %s entry names', async (_label, name) => {
    const archive = buildStoredZip(requiredGtfsEntries({ [name]: 'unsafe' }));
    await expect(validateAndReadGtfsZip(archive)).rejects.toThrow(/unsafe zip entry path/i);
  });

  test('rejects duplicate canonical entry names before reading table content', async () => {
    const entries = requiredGtfsEntries();
    entries.push(['STOPS.TXT', entries.find(([name]) => name === 'stops.txt')![1]]);

    await expect(validateAndReadGtfsZip(buildStoredZip(entries))).rejects.toThrow(
      /duplicate canonical zip entry/i,
    );
  });

  test('rejects malformed and truncated archives', async () => {
    await expect(validateAndReadGtfsZip(Uint8Array.of(1, 2, 3))).rejects.toThrow(/invalid|zip/i);
    const valid = buildStoredZip(requiredGtfsEntries());
    await expect(validateAndReadGtfsZip(valid.subarray(0, valid.length - 8))).rejects.toThrow(/invalid|zip|end/i);
  });

  test('rejects payload corruption whose CRC no longer matches the central directory', async () => {
    const corrupted = buildStoredZip(requiredGtfsEntries());
    const marker = findBytes(corrupted, new TextEncoder().encode('Fixture Transit'));
    expect(marker).toBeGreaterThanOrEqual(0);
    corrupted[marker] ^= 0xff;

    await expect(validateAndReadGtfsZip(corrupted)).rejects.toThrow(/crc/i);
  });

  test('rejects absence of each conditionally required schedule calendar form', async () => {
    const entries = requiredGtfsEntries().filter(
      ([name]) => name !== 'calendar.txt' && name !== 'calendar_dates.txt',
    );
    await expect(validateAndReadGtfsZip(buildStoredZip(entries))).rejects.toThrow(
      /calendar\.txt or calendar_dates\.txt/i,
    );
  });

  test('enforces per-entry, total expansion, and entry-count ceilings', async () => {
    const entries = requiredGtfsEntries({ 'extra-a.txt': '12345', 'extra-b.txt': '67890' });

    await expect(
      validateAndReadGtfsZip(buildStoredZip(entries), { maxEntryUncompressedBytes: 4 }),
    ).rejects.toThrow(/per-entry expansion limit/i);
    await expect(
      validateAndReadGtfsZip(buildStoredZip(entries), { maxTotalUncompressedBytes: 20 }),
    ).rejects.toThrow(/total expansion limit/i);
    await expect(validateAndReadGtfsZip(buildStoredZip(entries), { maxEntries: 5 })).rejects.toThrow(
      /entry count limit/i,
    );
  });
});

describe('GTFS CSV parsing', () => {
  test('preserves quoted fields, blanks, embedded newlines, line endings, and after-midnight times', () => {
    const parsed = parseCsv(
      '\uFEFFtrip_id,arrival_time,departure_time,stop_name,optional\r\n' +
        'night,25:10:00,25:10:30,"Canal St, Broadway",\r\n' +
        'quoted,26:00:00,26:00:00,"Line one\nLine two",""\n',
    );

    expect(parsed.headers).toEqual([
      'trip_id',
      'arrival_time',
      'departure_time',
      'stop_name',
      'optional',
    ]);
    expect(parsed.rows).toEqual([
      {
        trip_id: 'night',
        arrival_time: '25:10:00',
        departure_time: '25:10:30',
        stop_name: 'Canal St, Broadway',
        optional: '',
      },
      {
        trip_id: 'quoted',
        arrival_time: '26:00:00',
        departure_time: '26:00:00',
        stop_name: 'Line one\nLine two',
        optional: '',
      },
    ]);
  });

  test('rejects malformed quoting, duplicate headers, and mismatched columns', () => {
    expect(() => parseCsv('a,b\n"unterminated,x')).toThrow(/unterminated quoted field/i);
    expect(() => parseCsv('a,A\n1,2')).toThrow(/duplicate csv header/i);
    expect(() => parseCsv('a,b\n1')).toThrow(/column count/i);
  });

  test('derives row identity independently of header order and object insertion order', () => {
    const first = canonicalCsvRowIdentity({ trip_id: 'night', stop_id: 'C1N', note: '' });
    const second = canonicalCsvRowIdentity({ note: '', stop_id: 'C1N', trip_id: 'night' });
    expect(first).toBe(second);
    expect(first).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe('static GTFS normalization', () => {
  test('loads tiny regular and supplemented fixtures into compact immutable records', async () => {
    const regular = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
      wrapper: { filename: 'regular.zip' },
    });
    const supplemented = await loadStaticGtfsArchive(await readFile(fixture('supplemented.zip')), {
      source: 'supplemented-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      publishedAt: new Date('2026-08-04T03:00:00.000Z'),
      sourceOrder: 1,
      coverage: [coverage('supplement-a', ['A'])],
      wrapper: { filename: 'supplemented.zip' },
    });

    expect(regular.data.stopTimes.find((row) => row.tripId === 'after-midnight' && row.stopSequence === 1)).toMatchObject({
      arrivalTime: '25:10:00',
      departureTime: '25:10:30',
      arrivalSeconds: 90_600,
      departureSeconds: 90_630,
    });
    expect(regular.data.servicePatterns.find((pattern) => pattern.tripId === 'after-midnight')?.stopIds).toEqual([
      'C1N',
      'C2N',
    ]);
    expect(regular.data.structuralTransfers[0]).toMatchObject({
      fromStopId: 'C1',
      toStopId: 'C2',
      evidenceKind: 'structural-only',
      practicalWalkEvidence: false,
      accessiblePathEvidence: false,
    });
    expect(regular.data.shapes).toHaveLength(2);
    expect(supplemented.data.trips.map((trip) => trip.tripId)).not.toContain('regular-omitted');
    expect(Object.isFrozen(regular)).toBe(true);
    expect(Object.isFrozen(regular.data.stopTimes)).toBe(true);
  });

  test('rejects blank required keys and broken table joins fail closed', async () => {
    const entries = requiredGtfsEntries({
      'trips.txt': 'route_id,service_id,trip_id,trip_headsign,direction_id,shape_id\nA,WEEK,,Uptown,0,shape-a\n',
    });
    await expect(
      loadStaticGtfsArchive(buildStoredZip(entries), {
        source: 'regular-gtfs',
        retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
        coverage: [coverage('regular-a', ['A'])],
      }),
    ).rejects.toThrow(/trip_id.*required/i);

    await expect(
      loadStaticGtfsArchive(
        buildStoredZip(requiredGtfsEntries({
          'transfers.txt': 'from_stop_id,to_stop_id,transfer_type,min_transfer_time\nMISSING,C2,2,300\n',
        })),
        {
          source: 'regular-gtfs',
          retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
          coverage: [coverage('regular-a', ['A'])],
        },
      ),
    ).rejects.toThrow(/transfers\.txt from_stop_id.*not present/i);
  });

  test('uses calendar exceptions and retains the operating service date after midnight', async () => {
    const regular = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });

    expect(isServiceActive(regular.data, 'WEEK', '20260803')).toBe(false);
    expect(isServiceActive(regular.data, 'WEEK', '20260804')).toBe(true);
    expect(isServiceActive(regular.data, 'SPECIAL', '20260803')).toBe(true);
    expect(serviceTimeToInstant('20260803', '25:10:00').toISOString()).toBe('2026-08-04T05:10:00.000Z');
  });

  test('service activation never chooses the first row from duplicate calendar evidence', async () => {
    const regular = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });
    const exception = regular.data.calendarDates.find(
      (row) => row.serviceId === 'WEEK' && row.date === '20260803',
    );
    const calendar = regular.data.calendars.find((row) => row.serviceId === 'WEEK');
    expect(exception).toBeDefined();
    expect(calendar).toBeDefined();

    expect(() => isServiceActive({
      calendars: regular.data.calendars,
      calendarDates: [
        ...regular.data.calendarDates,
        { ...exception!, exceptionType: 1, rowIdentity: `${exception!.rowIdentity}-conflict` },
      ],
    }, 'WEEK', '20260803')).toThrow(/duplicate GTFS calendar_dates service_id,date/i);

    expect(() => isServiceActive({
      calendars: [
        ...regular.data.calendars,
        { ...calendar!, weekdays: calendar!.weekdays.map((active) => !active), rowIdentity: `${calendar!.rowIdentity}-conflict` },
      ],
      calendarDates: regular.data.calendarDates,
    }, 'WEEK', '20260804')).toThrow(/duplicate GTFS calendar service_id/i);
  });

  test.each([
    [
      'duplicate calendar service identity',
      {
        'calendar.txt':
          'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n' +
          'WEEK,1,1,1,1,1,0,0,20260801,20260831\n' +
          'WEEK,0,0,0,0,0,1,1,20260801,20260831\n',
      },
      /duplicate GTFS calendar service_id/i,
    ],
    [
      'duplicate and contradictory calendar exceptions',
      {
        'calendar_dates.txt':
          'service_id,date,exception_type\nWEEK,20260803,1\nWEEK,20260803,2\n',
      },
      /duplicate GTFS calendar_dates service_id,date/i,
    ],
    [
      'invalid weekday flag',
      {
        'calendar.txt':
          'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n' +
          'WEEK,2,1,1,1,1,0,0,20260801,20260831\n',
      },
      /calendar\.txt monday must be 0 or 1/i,
    ],
    [
      'invalid exception type',
      { 'calendar_dates.txt': 'service_id,date,exception_type\nWEEK,20260803,3\n' },
      /exception_type must be 1 or 2/i,
    ],
    [
      'invalid Gregorian exception date',
      { 'calendar_dates.txt': 'service_id,date,exception_type\nWEEK,20260230,1\n' },
      /invalid GTFS service date/i,
    ],
    [
      'reversed calendar date range',
      {
        'calendar.txt':
          'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n' +
          'WEEK,1,1,1,1,1,0,0,20260831,20260801\n',
      },
      /calendar\.txt start_date must not be after end_date/i,
    ],
  ] as const)('rejects %s before service activation', async (_label, overrides, expected) => {
    await expect(
      loadStaticGtfsArchive(buildStoredZip(requiredGtfsEntries(overrides)), {
        source: 'regular-gtfs',
        retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
        coverage: [coverage('regular-a', ['A'])],
      }),
    ).rejects.toThrow(expected);
  });

  test('canonical semantic identity ignores wrapper, CSV row/header order, and line endings', async () => {
    const baseline = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
      wrapper: { filename: 'one.zip', label: 'first' },
    });
    const shuffled = buildStoredZip(
      [...baseline.semanticTables.entries()]
        .reverse()
        .map(([name, text]) => [name, shuffleCsv(text).replace(/\n/g, '\r\n')] as const)
        .concat([['feed_info.txt', 'feed_publisher_name,feed_publisher_url,feed_lang,feed_version\nWrapper,https://example.test,en,changed\n']]),
    );
    const repeated = await loadStaticGtfsArchive(shuffled, {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T05:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
      wrapper: { filename: 'two.zip', label: 'second' },
    });

    expect(repeated.canonicalContentId).toBe(baseline.canonicalContentId);
  });
});

describe('exact entrance joins', () => {
  test('preserves public street copy while canonical entrance identity excludes mutable copy and retrieval wrapper', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });
    const first = loadEntranceCatalog(
      [entranceRecord({ entrance_description: 'NE corner of Main St & 2 Av', updated_at: 'one' })],
      staticFeed.data,
      { sourceId: 'first-wrapper', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
    ).entrances[0];
    const second = loadEntranceCatalog(
      [entranceRecord({ entrance_description: 'Main Street at Second Avenue', updated_at: 'two' })],
      staticFeed.data,
      { sourceId: 'second-wrapper', retrievedAt: new Date('2026-08-05T04:05:00.000Z') },
    ).entrances[0];

    expect(first.publicDescription).toBe('NE corner of Main St & 2 Av');
    expect(second.publicDescription).toBe('Main Street at Second Avenue');
    expect(first.id).toBe(second.id);
    expect(first.sourceRowIdentity).not.toBe(second.sourceRowIdentity);
  });

  test('rejects duplicate canonical structural entrance identities instead of choosing a source row', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });

    expect(() => loadEntranceCatalog(
      [
        entranceRecord({ entrance_description: 'First copy', updated_at: 'one' }),
        entranceRecord({ entrance_description: 'Second copy', updated_at: 'two' }),
      ],
      staticFeed.data,
      { sourceId: 'fixture', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
    )).toThrow(/duplicate entrance identity/i);
  });

  test('retains complex, constituent, exact directional stops, and entry permission', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });
    const records = JSON.parse(await readFile(fixture('entrances.json'), 'utf8')) as Record<string, unknown>[];
    const catalog = loadEntranceCatalog(records, staticFeed.data, {
      sourceId: 'subway-entrances-i9wp-a4ja',
      retrievedAt: new Date('2026-08-04T04:05:00.000Z'),
    });

    expect(catalog.entrances.map((entrance) => entrance.id)).toEqual([...catalog.entrances.map((e) => e.id)].sort());
    expect(catalog.entrances[0]).toMatchObject({
      complexId: '100',
      constituentStationId: '10',
      gtfsStopIds: ['C1'],
      directionalStopIds: ['C1N', 'C1S'],
      entryPermission: 'entry',
      practicalWalkEvidence: false,
      accessiblePathEvidence: false,
      joinStatus: 'matched',
    });
    expect(catalog.entrances[1]).toMatchObject({ entryPermission: 'exit-only' });
    expect(catalog.complexes[0].constituents[0]).toMatchObject({
      stationId: '10',
      gtfsStopIds: ['C1'],
      directionalStopIds: ['C1N', 'C1S'],
    });
  });

  test('preserves null permission as Unknown and unmatched joins without inference', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });
    const catalog = loadEntranceCatalog(
      [
        {
          complex_id: '999',
          stop_name: 'Unknown Complex',
          constituent_station_name: 'Unknown Station',
          station_id: '999',
          gtfs_stop_id: 'MISSING',
          entrance_type: 'Stair',
          entry_allowed: null,
          exit_allowed: 'YES',
          entrance_latitude: '40.7',
          entrance_longitude: '-74.0',
        },
      ],
      staticFeed.data,
      { sourceId: 'fixture', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
    );

    expect(catalog.entrances[0]).toMatchObject({
      entryPermission: 'unknown',
      joinStatus: 'unmatched',
      directionalStopIds: [],
      practicalWalkEvidence: false,
      accessiblePathEvidence: false,
    });
  });

  test('a mixed valid and missing GTFS stop reference is wholly unmatched without partial directional inheritance', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });
    const catalog = loadEntranceCatalog(
      [entranceRecord({ gtfs_stop_id: 'C1 MISSING' })],
      staticFeed.data,
      { sourceId: 'fixture', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
    );

    expect(catalog.entrances[0]).toMatchObject({
      joinStatus: 'unmatched',
      gtfsStopIds: [],
      directionalStopIds: [],
    });
  });

  test('a directional stop reference cannot masquerade as an exact entrance-to-base join', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });
    const catalog = loadEntranceCatalog(
      [entranceRecord({ gtfs_stop_id: 'C1N' })],
      staticFeed.data,
      { sourceId: 'fixture', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
    );

    expect(catalog.entrances[0]).toMatchObject({
      joinStatus: 'unmatched',
      gtfsStopIds: [],
      directionalStopIds: [],
    });
  });

  test('rejects conflicting GTFS associations for one constituent across entrance records', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });

    expect(() =>
      loadEntranceCatalog(
        [
          entranceRecord({ gtfs_stop_id: 'C1', entrance_latitude: '40.700100' }),
          entranceRecord({ gtfs_stop_id: 'C2', entrance_latitude: '40.700200' }),
        ],
        staticFeed.data,
        { sourceId: 'fixture', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
      ),
    ).toThrow(/conflicting GTFS stop associations/i);
  });

  test('rejects one constituent assigned to multiple complexes', async () => {
    const staticFeed = await loadStaticGtfsArchive(await readFile(fixture('regular.zip')), {
      source: 'regular-gtfs',
      retrievedAt: new Date('2026-08-04T04:00:00.000Z'),
      coverage: [coverage('regular-all', ['A', 'B'])],
    });

    expect(() =>
      loadEntranceCatalog(
        [
          entranceRecord({ complex_id: '100', entrance_latitude: '40.700100' }),
          entranceRecord({ complex_id: '200', entrance_latitude: '40.700200' }),
        ],
        staticFeed.data,
        { sourceId: 'fixture', retrievedAt: new Date('2026-08-04T04:05:00.000Z') },
      ),
    ).toThrow(/constituent.*multiple complexes/i);
  });
});

function coverage(id: string, routeIds: string[]) {
  return {
    id,
    routeIds,
    serviceDates: ['20260803', '20260804'],
    effectiveFrom: '2026-08-03T04:00:00.000Z',
    effectiveUntil: '2026-08-05T04:00:00.000Z',
    directions: ['northbound', 'southbound'] as const,
  };
}

function entranceRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    complex_id: '100',
    stop_name: 'Fixture Complex',
    constituent_station_name: 'Fixture Station',
    station_id: '10',
    gtfs_stop_id: 'C1',
    daytime_routes: 'A B',
    entrance_type: 'Stair',
    entry_allowed: 'YES',
    exit_allowed: 'YES',
    entrance_latitude: '40.700100',
    entrance_longitude: '-74.000100',
    ...overrides,
  };
}

function requiredGtfsEntries(overrides: Record<string, string> = {}): Array<readonly [string, string]> {
  const defaults: Record<string, string> = {
    'agency.txt': 'agency_id,agency_name,agency_url,agency_timezone\nMTA,Fixture Transit,https://example.test,America/New_York\n',
    'stops.txt':
      'stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station\nC1,Fixture Complex,40.7,-74,1,\nC1N,Fixture Uptown,40.7,-74,0,C1\nC1S,Fixture Downtown,40.7,-74,0,C1\nC2,Second Complex,40.71,-73.99,1,\nC2N,Second Uptown,40.71,-73.99,0,C2\n',
    'routes.txt': 'route_id,agency_id,route_short_name,route_long_name,route_type\nA,MTA,A,Fixture Line,1\n',
    'trips.txt': 'route_id,service_id,trip_id,trip_headsign,direction_id,shape_id\nA,WEEK,trip-a,Uptown,0,shape-a\n',
    'stop_times.txt': 'trip_id,arrival_time,departure_time,stop_id,stop_sequence\ntrip-a,10:00:00,10:00:00,C1N,1\ntrip-a,10:10:00,10:10:00,C2N,2\n',
    'calendar.txt': 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nWEEK,1,1,1,1,1,0,0,20260801,20260831\n',
  };
  return Object.entries({ ...defaults, ...overrides });
}

function shuffleCsv(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').trimEnd().split('\n');
  if (lines.length < 2 || lines.some((line) => line.includes('"'))) return text;
  const headers = lines[0].split(',').reverse();
  const rows = lines.slice(1).reverse().map((line) => line.split(',').reverse().join(','));
  return [headers.join(','), ...rows, ''].join('\n');
}

function buildStoredZip(entries: ReadonlyArray<readonly [string, string]>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, value] of entries) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(value);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    offset += local.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  return concat([...localParts, ...centralParts, end]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findBytes(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[index + offset] !== needle[offset]) continue outer;
    }
    return index;
  }
  return -1;
}
