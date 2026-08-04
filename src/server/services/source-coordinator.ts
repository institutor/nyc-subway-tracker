import { decodeAlertSnapshot, decodeAlertSnapshotJson, type AlertSnapshot } from '../gtfs/alert-loader';
import { decodeRealtimeSnapshot, type RealtimeSnapshot } from '../gtfs/realtime-loader';
import type { SourceProvenance } from '../data/fetch-source';
import type { RemoteSource } from '../data/source-registry';

type TimerHandle = ReturnType<typeof setTimeout>;

export interface RetrievedSource {
  readonly bytes: Uint8Array;
  readonly provenance: SourceProvenance;
}

export interface SourceCoordinatorOptions {
  readonly realtimeGroups: readonly RemoteSource[];
  readonly alertSource?: RemoteSource;
  readonly retrieve: (source: RemoteSource, signal: AbortSignal) => Promise<RetrievedSource>;
  readonly intervalMs?: number;
  readonly setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  readonly clearTimer?: (timer: TimerHandle) => void;
}

export interface SourceCoordinator {
  start(): void;
  stop(): void;
  refreshAll(): Promise<void>;
  getRealtimeSnapshot(sourceId: string): RealtimeSnapshot | null;
  getAlertSnapshot(): AlertSnapshot | null;
  getLastError(sourceId: string): Error | null;
}

interface InFlightRefresh {
  readonly generation: number;
  readonly operation: Promise<void>;
}

export function createSourceCoordinator(options: SourceCoordinatorOptions): SourceCoordinator {
  validateSources(options);
  const intervalMs = options.intervalMs ?? 30_000;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error('Source refresh interval must be positive');
  const timers = new Map<string, TimerHandle>();
  const inFlight = new Map<string, InFlightRefresh>();
  const realtimeSnapshots = new Map<string, RealtimeSnapshot>();
  const lastErrors = new Map<string, Error>();
  let alertSnapshot: AlertSnapshot | null = null;
  let generation = 0;
  let running = false;
  let controller = new AbortController();

  const allSources = options.alertSource
    ? [...options.realtimeGroups, options.alertSource]
    : [...options.realtimeGroups];

  function isCurrent(expectedGeneration: number, signal: AbortSignal): boolean {
    return expectedGeneration === generation && !signal.aborted;
  }

  async function refresh(
    source: RemoteSource,
    expectedGeneration = generation,
    signal = controller.signal,
  ): Promise<void> {
    const existing = inFlight.get(source.id);
    if (existing?.generation === expectedGeneration) return existing.operation;

    let operation!: Promise<void>;
    operation = (async () => {
      try {
        const retrieved = await options.retrieve(source, signal);
        if (!isCurrent(expectedGeneration, signal)) return;
        const bytes = exactBytes(retrieved);
        const snapshot = source.role === 'subway-alerts'
          ? parseAlertPayload(bytes, retrieved.provenance, alertSnapshot ?? undefined)
          : parseRealtimePayload(bytes, source, retrieved.provenance, realtimeSnapshots.get(source.id));
        if (!isCurrent(expectedGeneration, signal)) return;
        if (source.role === 'subway-alerts') alertSnapshot = snapshot as AlertSnapshot;
        else realtimeSnapshots.set(source.id, snapshot as RealtimeSnapshot);
        lastErrors.delete(source.id);
      } catch (error) {
        if (isCurrent(expectedGeneration, signal)) lastErrors.set(source.id, normalizeError(error));
      } finally {
        const current = inFlight.get(source.id);
        if (current?.generation === expectedGeneration && current.operation === operation) {
          inFlight.delete(source.id);
        }
      }
    })();
    inFlight.set(source.id, { generation: expectedGeneration, operation });
    return operation;
  }

  function schedule(source: RemoteSource, expectedGeneration: number, signal: AbortSignal): void {
    if (!running || !isCurrent(expectedGeneration, signal)) return;
    const setTimer = options.setTimer ?? setTimeout;
    const timer = setTimer(() => {
      timers.delete(source.id);
      if (!running || !isCurrent(expectedGeneration, signal)) return;
      void refresh(source, expectedGeneration, signal).finally(() => {
        schedule(source, expectedGeneration, signal);
      });
    }, intervalMs);
    timers.set(source.id, timer);
  }

  function start(): void {
    if (running) return;
    generation += 1;
    controller.abort();
    controller = new AbortController();
    running = true;
    const expectedGeneration = generation;
    const signal = controller.signal;
    for (const source of allSources) {
      void refresh(source, expectedGeneration, signal).finally(() => {
        schedule(source, expectedGeneration, signal);
      });
    }
  }

  function stop(): void {
    generation += 1;
    running = false;
    controller.abort();
    controller = new AbortController();
    const clearTimer = options.clearTimer ?? clearTimeout;
    for (const timer of timers.values()) clearTimer(timer);
    timers.clear();
  }

  return Object.freeze({
    start,
    stop,
    async refreshAll(): Promise<void> {
      const expectedGeneration = generation;
      const signal = controller.signal;
      await Promise.all(allSources.map((source) => refresh(source, expectedGeneration, signal)));
    },
    getRealtimeSnapshot(sourceId: string): RealtimeSnapshot | null {
      return realtimeSnapshots.get(sourceId) ?? null;
    },
    getAlertSnapshot(): AlertSnapshot | null {
      return alertSnapshot;
    },
    getLastError(sourceId: string): Error | null {
      return lastErrors.get(sourceId) ?? null;
    },
  });
}

function parseRealtimePayload(
  bytes: Uint8Array,
  source: RemoteSource,
  provenance: SourceProvenance,
  previous?: RealtimeSnapshot,
): RealtimeSnapshot {
  return decodeRealtimeSnapshot(bytes, { feedGroupId: source.id, provenance }, previous);
}

function parseAlertPayload(
  bytes: Uint8Array,
  provenance: SourceProvenance,
  previous?: AlertSnapshot,
): AlertSnapshot {
  const observedContentType = provenance.observedContentType.toLowerCase();
  return observedContentType.includes('json')
    ? decodeAlertSnapshotJson(bytes, { provenance }, previous)
    : decodeAlertSnapshot(bytes, { provenance }, previous);
}

function exactBytes(retrieved: RetrievedSource): Uint8Array {
  if (!retrieved || typeof retrieved !== 'object') throw new Error('Retrieved source result is required');
  if (!ArrayBuffer.isView(retrieved.bytes)) throw new Error('Retrieved source bytes must be a Uint8Array');
  return new Uint8Array(retrieved.bytes.buffer, retrieved.bytes.byteOffset, retrieved.bytes.byteLength);
}

function validateSources(options: SourceCoordinatorOptions): void {
  const ids = new Set<string>();
  for (const source of options.realtimeGroups) {
    if (source.role !== 'subway-realtime') throw new Error(`Source ${source.id} is not a subway realtime group`);
    if (ids.has(source.id)) throw new Error(`Duplicate coordinated source ${source.id}`);
    ids.add(source.id);
  }
  if (options.alertSource) {
    if (options.alertSource.role !== 'subway-alerts') throw new Error(`Source ${options.alertSource.id} is not a subway alert source`);
    if (ids.has(options.alertSource.id)) throw new Error(`Duplicate coordinated source ${options.alertSource.id}`);
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
