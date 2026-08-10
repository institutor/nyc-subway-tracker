import { randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { createSourceRegistry, type RemoteSource } from '../src/server/data/source-registry';
import { fetchSource, type SourceProvenance } from '../src/server/data/fetch-source';
import { evaluateExposure } from '../src/server/release/exposure-gates';
import { createSourceCoordinator, type SourceCoordinator } from '../src/server/services/source-coordinator';
import {
  compareShadowProgress,
  parseShadowProgressRecord,
  type ShadowProgressRecord,
} from '../src/server/services/shadow-progress';
import { projectShadowClaims, type AcceptedShadowRealtimeSource, type ShadowClaim } from '../src/server/services/shadow-validation';
import { writeShadowRecordAtomic } from '../src/server/services/shadow-record';

const SHADOW_SCHEMA = 'shadow-v2' as const;

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const live = process.argv.includes('--live');
  if (dryRun === live) {
    process.stderr.write('Choose exactly one of --dry-run or --live.\n');
    process.exitCode = 2;
    return;
  }
  const compareArgument = strictCompareArgument();
  const sources = shadowSources();
  const gates = gateRecords();
  const invocationTime = new Date();
  const invocationRecordedAt = invocationTime.toISOString();
  const invocationRecordId = `shadow-${invocationRecordedAt.replaceAll(':', '-')}-${randomUUID()}`;
  if (dryRun) {
    const record = parseShadowProgressRecord({
      schemaVersion: SHADOW_SCHEMA,
      recordId: invocationRecordId,
      mode: 'shadow',
      recordedAt: invocationRecordedAt,
      decisionTime: invocationTime.toISOString(),
      riderExposure: false,
      boardsExposed: false,
      outcome: 'DRY_RUN_NO_NETWORK',
      sources: sources.map(({ id: sourceId, role }) => ({ sourceId, role, outcome: 'not-run', reasonCode: 'DRY_RUN_NO_NETWORK' })),
      gates,
      claims: [],
      progressComparisons: [],
    });
    process.stdout.write(`${JSON.stringify(record)}\n`);
    return;
  }

  const outputDirectory = resolve(process.env.SHADOW_OUTPUT_DIRECTORY ?? join('.data', 'shadow'));
  await mkdir(join(outputDirectory, 'cache'), { recursive: true });
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

  const decisionTime = new Date();
  const recordedAt = decisionTime.toISOString();
  const recordId = `shadow-${recordedAt.replaceAll(':', '-')}-${randomUUID()}`;
  const sourceRecords = liveSourceRecords(sources, coordinator, provenance);
  const claims: ShadowClaim[] = [];
  const alertSnapshot = coordinator.getAlertSnapshot();
  for (const source of sources.filter((candidate) => candidate.role === 'subway-realtime')) {
    const snapshot = coordinator.getRealtimeSnapshot(source.id);
    const sourceRecord = sourceRecords.find((record): record is AcceptedShadowRealtimeSource => record.sourceId === source.id
      && record.role === 'subway-realtime' && record.outcome === 'accepted');
    if (!snapshot || !sourceRecord) continue;
    claims.push(...projectShadowClaims({ snapshot, sourceRecord, alertSnapshot, decisionTime }).slice(0, 500 - claims.length));
    if (claims.length >= 500) break;
  }
  const outcome = sourceRecords.some((source) => source.outcome === 'failed')
    ? 'COMPLETED_WITH_SOURCE_FAILURES' as const : 'COMPLETED' as const;
  const baseRecord = parseShadowProgressRecord({
    schemaVersion: SHADOW_SCHEMA,
    recordId,
    mode: 'shadow',
    recordedAt,
    decisionTime: decisionTime.toISOString(),
    riderExposure: false,
    boardsExposed: false,
    outcome,
    sources: sourceRecords,
    gates,
    claims,
    progressComparisons: [],
  });
  const comparisons = compareArgument ? await compareProgress(compareArgument, baseRecord) : [];
  const record = parseShadowProgressRecord({ ...baseRecord, progressComparisons: comparisons });
  const outputPath = join(outputDirectory, `${record.recordId}.json`);
  await writeShadowRecordAtomic(outputPath, `${JSON.stringify(record)}\n`);
  process.stdout.write(`${JSON.stringify({ outcome: record.outcome, outputPath, sourceCount: sources.length })}\n`);
}

function liveSourceRecords(
  sources: readonly RemoteSource[],
  coordinator: SourceCoordinator,
  provenance: ReadonlyMap<string, SourceProvenance>,
): Record<string, unknown>[] {
  return sources.map((source) => {
    const accepted = provenance.get(source.id);
    const snapshot = source.role === 'subway-realtime'
      ? coordinator.getRealtimeSnapshot(source.id)
      : coordinator.getAlertSnapshot();
    if (!accepted || !snapshot || coordinator.getLastError(source.id)) {
      return { sourceId: source.id, role: source.role, outcome: 'failed', reasonCode: 'SOURCE_RETRIEVAL_OR_VALIDATION_FAILED' };
    }
    return {
      sourceId: source.id,
      role: source.role,
      outcome: 'accepted',
      reasonCode: 'SOURCE_ACCEPTED',
      ...(source.role === 'subway-realtime' ? { feedGroupId: source.id } : {}),
      observedAt: snapshot.feedTimestamp.toISOString(),
      retrievedAt: accepted.retrievedAt,
      sha256: accepted.sha256,
    };
  });
}

function shadowSources(): RemoteSource[] {
  return createSourceRegistry({}).filter((source): source is RemoteSource => source.kind === 'remote'
    && source.required
    && (source.role === 'subway-realtime' || source.role === 'subway-alerts'));
}

function gateRecords() {
  return Object.entries(evaluateExposure({ mode: 'shadow' }).public).map(([stage, gate]) => ({ stage, ...gate }));
}

async function compareProgress(path: string, current: ShadowProgressRecord) {
  const previous = JSON.parse(await readFile(resolve(path), 'utf8')) as unknown;
  return compareShadowProgress(parseShadowProgressRecord(previous), current);
}

function strictCompareArgument(): string | undefined {
  const index = process.argv.indexOf('--compare');
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    process.stderr.write('--compare requires a record path.\n');
    process.exitCode = 2;
    throw new CompareArgumentError();
  }
  return value;
}

class CompareArgumentError extends Error {}

void main().catch((error) => {
  if (error instanceof CompareArgumentError) return;
  process.stderr.write('Live shadow could not complete; no rider surface or release gate was changed.\n');
  process.exitCode = 1;
});
