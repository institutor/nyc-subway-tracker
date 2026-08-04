import { decodeAlertSnapshot, decodeAlertSnapshotJson, type AlertSnapshot } from '../gtfs/alert-loader';
import { decodeRealtimeSnapshot, decodeRealtimeSnapshotJson, type RealtimeSnapshot } from '../gtfs/realtime-loader';
import type { RemoteSource } from '../data/source-registry';

type RetrievedPayload = Uint8Array | string | Readonly<Record<string, unknown>>;
type TimerHandle = ReturnType<typeof setTimeout>;

export interface SourceCoordinatorOptions {
  readonly realtimeGroups: readonly RemoteSource[];
  readonly alertSource?: RemoteSource;
  readonly retrieve: (source: RemoteSource, signal: AbortSignal) => Promise<RetrievedPayload>;
  readonly now?: () => Date;
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

export function createSourceCoordinator(options: SourceCoordinatorOptions): SourceCoordinator {
  validateSources(options);
  const intervalMs = options.intervalMs ?? 30_000;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error('Source refresh interval must be positive');
  const timers = new Map<string, TimerHandle>();
  const inFlight = new Map<string, Promise<void>>();
  const realtimeSnapshots = new Map<string, RealtimeSnapshot>();
  const lastErrors = new Map<string, Error>();
  let alertSnapshot: AlertSnapshot | null = null;
  let controller: AbortController | null = null;

  const allSources = options.alertSource
    ? [...options.realtimeGroups, options.alertSource]
    : [...options.realtimeGroups];

  async function refresh(source: RemoteSource): Promise<void> {
    const existing = inFlight.get(source.id);
    if (existing) return existing;
    const signal = controller?.signal ?? new AbortController().signal;
    const operation = (async () => {
      try {
        const payload = await options.retrieve(source, signal);
        const retrievedAt = (options.now ?? (() => new Date()))();
        if (source.role === 'subway-alerts') {
          alertSnapshot = parseAlertPayload(payload, source, retrievedAt, alertSnapshot ?? undefined);
        } else {
          const previous = realtimeSnapshots.get(source.id);
          const snapshot = parseRealtimePayload(payload, source, retrievedAt, previous);
          realtimeSnapshots.set(source.id, snapshot);
        }
        lastErrors.delete(source.id);
      } catch (error) {
        lastErrors.set(source.id, normalizeError(error));
      } finally {
        inFlight.delete(source.id);
      }
    })();
    inFlight.set(source.id, operation);
    return operation;
  }

  function schedule(source: RemoteSource): void {
    const setTimer = options.setTimer ?? setTimeout;
    const timer = setTimer(() => {
      timers.delete(source.id);
      void refresh(source).finally(() => {
        if (controller && !controller.signal.aborted) schedule(source);
      });
    }, intervalMs);
    timers.set(source.id, timer);
  }

  function start(): void {
    if (controller && !controller.signal.aborted) return;
    controller = new AbortController();
    for (const source of allSources) {
      void refresh(source).finally(() => {
        if (controller && !controller.signal.aborted) schedule(source);
      });
    }
  }

  function stop(): void {
    controller?.abort();
    controller = null;
    const clearTimer = options.clearTimer ?? clearTimeout;
    for (const timer of timers.values()) clearTimer(timer);
    timers.clear();
  }

  return Object.freeze({
    start,
    stop,
    async refreshAll(): Promise<void> {
      await Promise.all(allSources.map(refresh));
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
  payload: RetrievedPayload,
  source: RemoteSource,
  retrievedAt: Date,
  previous?: RealtimeSnapshot,
): RealtimeSnapshot {
  const context = {
    sourceId: source.id,
    feedGroupId: source.id,
    sourceUrl: source.url,
    retrievedAt,
  };
  if (typeof payload === 'string') return decodeRealtimeSnapshotJson(JSON.parse(payload), context, previous);
  if (isBinaryPayload(payload)) return decodeRealtimeSnapshot(toUint8Array(payload), context, previous);
  return decodeRealtimeSnapshotJson(payload, context, previous);
}

function parseAlertPayload(
  payload: RetrievedPayload,
  source: RemoteSource,
  retrievedAt: Date,
  previous?: AlertSnapshot,
): AlertSnapshot {
  const context = { sourceId: source.id, sourceUrl: source.url, retrievedAt };
  if (typeof payload === 'string') return decodeAlertSnapshotJson(JSON.parse(payload), context, previous);
  if (isBinaryPayload(payload)) return decodeAlertSnapshot(toUint8Array(payload), context, previous);
  return decodeAlertSnapshotJson(payload, context, previous);
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

function isBinaryPayload(payload: RetrievedPayload): payload is Uint8Array {
  return ArrayBuffer.isView(payload);
}

function toUint8Array(payload: Uint8Array): Uint8Array {
  return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
}
