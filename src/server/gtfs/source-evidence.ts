import { createHash } from 'node:crypto';

import type { SourceProvenance } from '../data/fetch-source';

export interface SourceLoaderContext {
  readonly provenance: SourceProvenance;
}

export interface RawSourceEvidence {
  readonly evidenceId: string;
  readonly mediaType: string;
  readonly receivedBytes: number;
  readonly payloadBase64: string;
}

export interface AcceptedSourceEvidence {
  readonly provenance: Readonly<SourceProvenance>;
  readonly retrievedAt: Date;
  readonly rawEvidence: RawSourceEvidence;
}

export function acceptSourceEvidence(
  payload: Uint8Array,
  context: SourceLoaderContext,
): AcceptedSourceEvidence {
  const provenance = context.provenance;
  for (const [label, value] of [
    ['source id', provenance.sourceId],
    ['source authority', provenance.sourceAuthority],
    ['source role', provenance.sourceRole],
    ['source URL', provenance.sourceUrl],
    ['final URL', provenance.finalUrl],
    ['declared content type', provenance.declaredContentType],
    ['observed content type', provenance.observedContentType],
  ] as const) {
    if (!value?.trim()) throw new Error(`Accepted source ${label} is required`);
  }
  const retrievedAt = new Date(provenance.retrievedAt);
  if (!Number.isFinite(retrievedAt.getTime())) throw new Error('Accepted source retrieval time is invalid');
  if (!Number.isSafeInteger(provenance.redirectCount) || provenance.redirectCount < 0) {
    throw new Error('Accepted source redirect count is invalid');
  }
  if (provenance.receivedBytes !== payload.byteLength) {
    throw new Error('Accepted source received byte count does not match payload');
  }
  if (provenance.declaredBytes !== null && (!Number.isSafeInteger(provenance.declaredBytes) || provenance.declaredBytes < 0)) {
    throw new Error('Accepted source declared byte count is invalid');
  }
  const digest = createHash('sha256').update(payload).digest('hex');
  if (provenance.sha256.toLowerCase() !== digest) {
    throw new Error('Accepted source received digest does not match payload');
  }
  const immutableProvenance = Object.freeze({ ...provenance });
  return Object.freeze({
    provenance: immutableProvenance,
    retrievedAt,
    rawEvidence: Object.freeze({
      evidenceId: `sha256:${digest}`,
      mediaType: provenance.observedContentType,
      receivedBytes: payload.byteLength,
      payloadBase64: Buffer.from(payload).toString('base64'),
    }),
  });
}
