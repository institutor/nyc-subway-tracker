import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { createSourceRegistry, type RemoteSource } from '../src/server/data/source-registry';
import { fetchSource, type SourceProvenance } from '../src/server/data/fetch-source';
import { createSourceCoordinator } from '../src/server/services/source-coordinator';
import { evaluateExposure } from '../src/server/release/exposure-gates';
import {
  compareShadowProgress,
  parseShadowProgressCandidate,
  type ShadowProgressCandidate,
} from '../src/server/services/shadow-progress';

const SHADOW_SCHEMA = 'shadow-v1' as const;
const MAX_PROGRESS_CANDIDATES = 500;
const MAX_REMAINING_STOPS = 64;

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const live = process.argv.includes('--live');
  if (dryRun === live) {
    process.stderr.write('Choose exactly one of --dry-run or --live.\n');
    process.exitCode = 2;
    return;
  }
  const sources = shadowSources();
  const gates = gateRecords();
  if (dryRun) {
    process.stdout.write(`${JSON.stringify({
      schemaVersion: SHADOW_SCHEMA,
      mode: 'shadow',
      riderExposure: false,
      boardsExposed: false,
      outcome: 'DRY_RUN_NO_NETWORK',
      sources: sources.map(({ id, role }) => ({ sourceId: id, role })),
      gates,
      progressComparisons: [],
    })}\n`);
    return;
  }

  const outputDirectory = resolve(process.env.SHADOW_OUTPUT_DIRECTORY ?? join('.data', 'shadow'));
  const provenance = new Map<string, SourceProvenance>();
  const coordinator = createSourceCoordinator({
    realtimeGroups: sources.filter((source) => source.role === 'subway-realtime'),
    alertSource: sources.find((source) => source.role === 'subway-alerts'),
    retrieve: async (source, signal) => {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const destinationPath = join(outputDirectory, 'cache', `${source.id}.bin`);
      const accepted = await fetchSource(source, { destinationPath });
      provenance.set(source.id, accepted);
      return { bytes: new Uint8Array(await readFile(destinationPath)), provenance: accepted };
    },
  });
  await coordinator.refreshAll();

  const progressCandidates: ShadowProgressCandidate[] = [];
  for (const source of sources.filter((candidate) => candidate.role === 'subway-realtime')) {
    const snapshot = coordinator.getRealtimeSnapshot(source.id);
    if (!snapshot) continue;
    for (const update of snapshot.tripUpdates) {
      if (progressCandidates.length >= MAX_PROGRESS_CANDIDATES) break;
      const stops = update.remainingStopCalls.slice(0, MAX_REMAINING_STOPS);
      if (stops.length === 0) continue;
      progressCandidates.push({
        sourceId: source.id,
        observedAt: snapshot.feedTimestamp.toISOString(),
        operationalTrainId: update.trainInstanceId,
        routeId: update.trip.routeId,
        nextStopId: stops[0].stopId,
        targetStopId: stops[stops.length - 1].stopId,
        remainingStopCount: update.remainingStopCalls.length,
        remainingStopIds: stops.map((stop) => stop.stopId),
      });
    }
  }
  const comparePath = argumentValue('--compare');
  const comparisons = comparePath ? await compareProgress(comparePath, progressCandidates) : [];
  const record = {
    schemaVersion: SHADOW_SCHEMA,
    mode: 'shadow',
    riderExposure: false,
    boardsExposed: false,
    outcome: sources.some((source) => coordinator.getLastError(source.id)) ? 'COMPLETED_WITH_SOURCE_FAILURES' : 'COMPLETED',
    recordedAt: new Date().toISOString(),
    sources: sources.map((source) => {
      const accepted = provenance.get(source.id);
      return {
        sourceId: source.id,
        role: source.role,
        outcome: coordinator.getLastError(source.id) ? 'failed' : accepted ? 'accepted' : 'unavailable',
        reasonCode: coordinator.getLastError(source.id) ? 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED'
          : accepted ? 'SOURCE_ACCEPTED' : 'SOURCE_UNAVAILABLE',
        ...(accepted ? { retrievedAt: accepted.retrievedAt } : {}),
      };
    }),
    gates,
    progressCandidates,
    progressComparisons: comparisons,
  };
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = join(outputDirectory, `shadow-${record.recordedAt.replaceAll(':', '-')}.json`);
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  process.stdout.write(`${JSON.stringify({ outcome: record.outcome, outputPath, sourceCount: sources.length })}\n`);
}

function shadowSources(): RemoteSource[] {
  return createSourceRegistry({}).filter((source): source is RemoteSource => source.kind === 'remote'
    && source.required
    && (source.role === 'subway-realtime' || source.role === 'subway-alerts'));
}

function gateRecords() {
  return Object.entries(evaluateExposure({ mode: 'shadow' }).public).map(([stage, gate]) => ({ stage, ...gate }));
}

async function compareProgress(path: string, current: readonly ShadowProgressCandidate[]) {
  let previous: unknown;
  try {
    previous = JSON.parse(await readFile(resolve(path), 'utf8'));
  } catch {
    return [{ result: 'inconclusive', reasonCode: 'PREVIOUS_SHADOW_RECORD_UNAVAILABLE' }];
  }
  const candidates = previous && typeof previous === 'object' && !Array.isArray(previous)
    ? (previous as { progressCandidates?: unknown }).progressCandidates : undefined;
  if (!Array.isArray(candidates) || candidates.length > MAX_PROGRESS_CANDIDATES) {
    return [{ result: 'inconclusive', reasonCode: 'PREVIOUS_SHADOW_RECORD_INVALID' }];
  }
  const earlier = candidates.flatMap((candidate) => {
    const parsed = parseShadowProgressCandidate(candidate, MAX_REMAINING_STOPS);
    return parsed ? [parsed] : [];
  });
  return compareShadowProgress(earlier, current);
}

function argumentValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

void main().catch(() => {
  process.stderr.write('Live shadow could not complete; no rider surface or release gate was changed.\n');
  process.exitCode = 1;
});
