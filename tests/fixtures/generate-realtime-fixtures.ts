import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { transit_realtime as TransitRealtime } from 'gtfs-realtime-bindings';

import {
  encodeNyctFeed,
  nyctFeedHeaderUnknown,
  nyctStopUnknown,
  nyctTripUnknown,
} from './nyct-realtime-fixture';

const directory = resolve('tests', 'fixtures', 'realtime');
await mkdir(directory, { recursive: true });

await write('current.pb', {
  header: {
    gtfsRealtimeVersion: '1.0',
    incrementality: 0,
    timestamp: 1_785_823_200,
    $unknowns: nyctFeedHeaderUnknown(),
  },
  entity: [
    {
      id: 'trip-update-north',
      tripUpdate: {
        trip: {
          tripId: 'shared-trip',
          routeId: 'A',
          startDate: '20260803',
          $unknowns: nyctTripUnknown({ trainId: '0A 0200 FAR/207', isAssigned: true, direction: 1 }),
        },
        stopTimeUpdate: [
          {
            stopId: 'A23N',
            arrival: { time: 1_785_823_320 },
            departure: { time: 1_785_823_350 },
            $unknowns: nyctStopUnknown({ scheduledTrack: '4', actualTrack: '3' }),
          },
          {
            stopId: 'A24N',
            arrival: { time: 1_785_823_500 },
            $unknowns: nyctStopUnknown({ scheduledTrack: '4' }),
          },
        ],
        timestamp: 1_785_823_190,
      },
    },
    {
      id: 'vehicle-north',
      vehicle: {
        trip: {
          tripId: 'shared-trip',
          routeId: 'A',
          startDate: '20260803',
          $unknowns: nyctTripUnknown({ trainId: '0A 0200 FAR/207', isAssigned: true, direction: 1 }),
        },
        stopId: 'A23N',
        currentStatus: 2,
        timestamp: 1_785_823_185,
      },
    },
    {
      id: 'trip-update-south',
      tripUpdate: {
        trip: {
          tripId: 'shared-trip',
          routeId: 'A',
          startDate: '20260804',
          $unknowns: nyctTripUnknown({ trainId: '0A 0210 207/FAR', isAssigned: true, direction: 3 }),
        },
        stopTimeUpdate: [
          {
            stopId: 'A24S',
            arrival: { time: 1_785_823_440 },
            $unknowns: nyctStopUnknown({ scheduledTrack: '1', actualTrack: '1' }),
          },
        ],
        timestamp: 1_785_823_195,
      },
    },
    {
      id: 'vehicle-south',
      vehicle: {
        trip: {
          tripId: 'shared-trip',
          routeId: 'A',
          startDate: '20260804',
          $unknowns: nyctTripUnknown({ trainId: '0A 0210 207/FAR', isAssigned: true, direction: 3 }),
        },
        stopId: 'A24S',
        currentStatus: 1,
        timestamp: 1_785_823_180,
      },
    },
    {
      id: 'delayed-north',
      alert: {
        informedEntity: [{
          trip: {
            tripId: 'shared-trip',
            routeId: 'A',
            startDate: '20260803',
            $unknowns: nyctTripUnknown({ trainId: '0A 0200 FAR/207', isAssigned: true, direction: 1 }),
          },
        }],
        headerText: { translation: [{ text: 'Train delayed' }] },
      },
    },
  ],
});

await write('holding.pb', {
  header: {
    gtfsRealtimeVersion: '1.0',
    incrementality: 0,
    timestamp: 1_785_823_230,
    $unknowns: nyctFeedHeaderUnknown(),
  },
  entity: [
    {
      id: 'trip-update-unknown',
      tripUpdate: {
        trip: {
          tripId: 'trip-unknown',
          $unknowns: nyctTripUnknown({ isAssigned: false, direction: 3 }),
        },
        stopTimeUpdate: [
          {
            stopId: 'A24S',
            arrival: { time: 1_785_823_500 },
            $unknowns: nyctStopUnknown({}),
          },
        ],
        timestamp: 1_785_823_220,
      },
    },
    {
      id: 'vehicle-unknown',
      vehicle: {
        trip: {
          tripId: 'trip-unknown',
          $unknowns: nyctTripUnknown({ isAssigned: false, direction: 3 }),
        },
        timestamp: 1_785_823_210,
      },
    },
  ],
});

async function write(name: string, input: TransitRealtime.IFeedMessage): Promise<void> {
  await writeFile(resolve(directory, name), encodeNyctFeed(input));
}
