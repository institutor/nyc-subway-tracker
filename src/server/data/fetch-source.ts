import { createHash } from 'node:crypto';

import { writeAtomicCache } from './atomic-cache';
import type { ExpectedFormat, RemoteSource } from './source-registry';

export interface FetchSourceOptions {
  destinationPath: string;
  fetchImpl?: typeof fetch;
  headers?: Readonly<Record<string, string>>;
  now?: () => Date;
}

export interface SourceProvenance {
  sourceId: string;
  sourceUrl: string;
  retrievedAt: string;
  finalUrl: string;
  redirectCount: number;
  declaredContentType: string;
  observedContentType: string;
  declaredBytes: number | null;
  receivedBytes: number;
  sha256: string;
}

export async function fetchSource(
  source: RemoteSource,
  options: FetchSourceOptions,
): Promise<SourceProvenance> {
  if (source.enabled === false) {
    throw new Error(`Source ${source.id} is disabled`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), source.retrieval.timeoutMs);

  try {
    const fetched = await fetchFollowingRedirects(
      source,
      options.fetchImpl ?? fetch,
      options.headers,
      controller.signal,
    );
    const declaredContentType = normalizeContentType(fetched.response.headers.get('content-type'));
    const acceptedTypes = source.acceptedContentTypes.map(normalizeContentTypeValue);
    if (!declaredContentType || !acceptedTypes.includes(declaredContentType)) {
      throw new Error(
        `Source ${source.id} declared content type ${declaredContentType || '(missing)'} outside its policy`,
      );
    }

    const declaredBytes = parseContentLength(fetched.response.headers.get('content-length'));
    if (declaredBytes !== null && declaredBytes > source.retrieval.maxBytes) {
      throw new Error(`Source ${source.id} exceeds its ${source.retrieval.maxBytes} byte limit`);
    }
    if (!fetched.response.body) {
      throw new Error(`Source ${source.id} returned no response body`);
    }

    const hash = createHash('sha256');
    let receivedBytes = 0;
    let observedContentType: string | undefined;

    async function* boundedBody(): AsyncGenerator<Uint8Array> {
      const reader = fetched.response.body!.getReader();
      const pendingChunks: Uint8Array[] = [];
      let inspectionBytes: Uint8Array<ArrayBufferLike> = new Uint8Array();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value || value.byteLength === 0) continue;

          receivedBytes += value.byteLength;
          if (receivedBytes > source.retrieval.maxBytes) {
            throw new Error(`Source ${source.id} exceeds its ${source.retrieval.maxBytes} byte limit`);
          }

          if (!observedContentType) {
            pendingChunks.push(value);
            inspectionBytes = appendInspectionBytes(inspectionBytes, value);
            const enoughToInspect =
              source.expectedFormat === 'zip'
                ? inspectionBytes.byteLength >= 4
                : inspectionBytes.byteLength >= 64;
            if (!enoughToInspect) {
              continue;
            }

            observedContentType = observeContentType(inspectionBytes, source.expectedFormat);
            if (!observedContentType) throw observedTypeError(source);
            for (const pendingChunk of pendingChunks.splice(0)) {
              hash.update(pendingChunk);
              yield pendingChunk;
            }
            continue;
          }
          hash.update(value);
          yield value;
        }
      } finally {
        reader.releaseLock();
      }

      if (!observedContentType) {
        if (inspectionBytes.byteLength === 0) {
          throw new Error(`Source ${source.id} returned an empty body`);
        }
        observedContentType = observeContentType(inspectionBytes, source.expectedFormat);
        if (!observedContentType) throw observedTypeError(source);
        for (const pendingChunk of pendingChunks) {
          hash.update(pendingChunk);
          yield pendingChunk;
        }
      }
      if (declaredBytes !== null && receivedBytes !== declaredBytes) {
        if (receivedBytes < declaredBytes) {
          throw new Error(
            `Source ${source.id} returned a truncated body: declared ${declaredBytes} bytes, received ${receivedBytes}`,
          );
        }
        throw new Error(
          `Source ${source.id} returned ${receivedBytes} bytes but declared ${declaredBytes}`,
        );
      }
    }

    await writeAtomicCache(options.destinationPath, boundedBody());

    return {
      sourceId: source.id,
      sourceUrl: source.url,
      retrievedAt: (options.now ?? (() => new Date()))().toISOString(),
      finalUrl: fetched.finalUrl,
      redirectCount: fetched.redirectCount,
      declaredContentType,
      observedContentType: observedContentType!,
      declaredBytes,
      receivedBytes,
      sha256: hash.digest('hex'),
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Source ${source.id} timed out after ${source.retrieval.timeoutMs}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function appendInspectionBytes(
  existing: Uint8Array<ArrayBufferLike>,
  next: Uint8Array<ArrayBufferLike>,
): Uint8Array<ArrayBufferLike> {
  const remaining = 64 - existing.byteLength;
  if (remaining <= 0) return existing;
  const appended = next.subarray(0, remaining);
  const combined = new Uint8Array(existing.byteLength + appended.byteLength);
  combined.set(existing);
  combined.set(appended, existing.byteLength);
  return combined;
}

function observedTypeError(source: RemoteSource): Error {
  return new Error(`Source ${source.id} observed content does not match ${source.expectedFormat}`);
}

async function fetchFollowingRedirects(
  source: RemoteSource,
  fetchImpl: typeof fetch,
  headers: Readonly<Record<string, string>> | undefined,
  signal: AbortSignal,
): Promise<{ response: Response; finalUrl: string; redirectCount: number }> {
  let finalUrl = source.url;
  let redirectCount = 0;

  while (true) {
    const response = await fetchImpl(finalUrl, { headers, redirect: 'manual', signal });
    if (response.status >= 300 && response.status < 400) {
      if (redirectCount >= source.retrieval.maxRedirects) {
        throw new Error(`Source ${source.id} exceeded redirect limit of ${source.retrieval.maxRedirects}`);
      }
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`Source ${source.id} returned a redirect without a location`);
      }
      const redirectedUrl = new URL(location, finalUrl);
      if (redirectedUrl.protocol !== 'https:') {
        throw new Error(`Source ${source.id} refused redirect to ${redirectedUrl.protocol}`);
      }
      finalUrl = redirectedUrl.toString();
      redirectCount += 1;
      continue;
    }

    if (response.status !== 200) {
      throw new Error(`Source ${source.id} returned HTTP ${response.status}`);
    }
    return { response, finalUrl, redirectCount };
  }
}

function normalizeContentType(value: string | null): string {
  return value ? normalizeContentTypeValue(value) : '';
}

function normalizeContentTypeValue(value: string): string {
  return value.split(';', 1)[0]!.trim().toLowerCase();
}

function parseContentLength(value: string | null): number | null {
  if (value === null) return null;
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid content-length: ${value}`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Invalid content-length: ${value}`);
  }
  return parsed;
}

function observeContentType(bytes: Uint8Array, format: ExpectedFormat): string | undefined {
  if (format === 'zip') {
    const validSignature =
      (bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[2] === 0x05 && bytes[3] === 0x06) ||
      (bytes[2] === 0x07 && bytes[3] === 0x08);
    return bytes.byteLength >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && validSignature
      ? 'application/zip'
      : undefined;
  }

  const prefix = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.byteLength, 64))).trimStart();
  if (format === 'json' || format === 'json-or-xml') {
    if (prefix.startsWith('{') || prefix.startsWith('[')) return 'application/json';
    const lowered = prefix.toLowerCase();
    const looksLikeXml =
      !lowered.startsWith('<html') &&
      !lowered.startsWith('<!doctype html') &&
      (prefix.startsWith('<?xml') || /^<[A-Za-z_][\w:.-]*(?:\s|\/|>)/.test(prefix));
    return format === 'json-or-xml' && looksLikeXml ? 'application/xml' : undefined;
  }

  const lowered = prefix.toLowerCase();
  if (
    lowered.startsWith('<!doctype html') ||
    lowered.startsWith('<html') ||
    lowered.startsWith('{') ||
    lowered.startsWith('[') ||
    lowered.startsWith('pk')
  ) {
    return undefined;
  }
  return 'application/x-protobuf';
}
