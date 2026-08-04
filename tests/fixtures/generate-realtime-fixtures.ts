import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const { transit_realtime } = GtfsRealtimeBindings;

const directory = resolve('tests', 'fixtures', 'realtime');
await mkdir(directory, { recursive: true });

await write('current.pb', {
  header: {
    gtfsRealtimeVersion: '2.0',
    incrementality: 'FULL_DATASET',
    timestamp: 1_785_823_200,
  },
  entity: [
    {
      id: 'trip-update-a',
      tripUpdate: {
        trip: {
          tripId: 'trip-a',
          routeId: 'A',
          directionId: 0,
          startDate: '20260804',
          startTime: '02:00:00',
        },
        stopTimeUpdate: [
          {
            stopSequence: 1,
            stopId: 'A23N',
            arrival: { time: 1_785_823_140 },
            departure: { time: 1_785_823_170 },
          },
          {
            stopSequence: 2,
            stopId: 'A24N',
            arrival: { time: 1_785_823_320 },
            departure: { time: 1_785_823_350 },
          },
          {
            stopSequence: 3,
            stopId: 'A25N',
            arrival: { time: 1_785_823_500 },
          },
        ],
        timestamp: 1_785_823_190,
      },
    },
    {
      id: 'vehicle-a',
      vehicle: {
        trip: {
          tripId: 'trip-a',
          routeId: 'A',
          directionId: 0,
          startDate: '20260804',
          startTime: '02:00:00',
        },
        vehicle: { id: 'train-a' },
        currentStopSequence: 1,
        stopId: 'A23N',
        currentStatus: 'IN_TRANSIT_TO',
        timestamp: 1_785_823_185,
      },
    },
    {
      id: 'trip-update-secondary',
      tripUpdate: {
        trip: {
          tripId: 'trip-secondary',
          routeId: 'A',
          directionId: 0,
          startDate: '20260804',
          startTime: '02:05:00',
        },
        stopTimeUpdate: [
          { stopSequence: 1, stopId: 'A24N', arrival: { time: 1_785_823_800 } },
        ],
      },
    },
  ],
});

await write('holding.pb', {
  header: {
    gtfsRealtimeVersion: '2.0',
    incrementality: 'FULL_DATASET',
    timestamp: 1_785_823_230,
  },
  entity: [
    {
      id: 'trip-update-unknown',
      tripUpdate: {
        trip: { tripId: 'trip-unknown' },
        stopTimeUpdate: [
          { stopSequence: 1, stopId: 'A24N', arrival: { time: 1_785_823_500 } },
        ],
      },
    },
    {
      id: 'vehicle-unknown',
      vehicle: { trip: { tripId: 'trip-unknown' } },
    },
  ],
});

async function write(name: string, input: Record<string, unknown>): Promise<void> {
  const message = transit_realtime.FeedMessage.fromObject(input);
  const failure = transit_realtime.FeedMessage.verify(message);
  if (failure) throw new Error(`${name}: ${failure}`);
  await writeFile(resolve(directory, name), transit_realtime.FeedMessage.encode(message).finish());
}
