import { createHash } from 'node:crypto';

import { reserveAtomicCacheGeneration, writeAtomicCache } from './atomic-cache';
import type { ExpectedFormat, RemoteSource } from './source-registry';

export interface FetchSourceOptions {
  destinationPath: string;
  fetchImpl?: typeof fetch;
  headers?: Readonly<Record<string, string>>;
  now?: () => Date;
}

export interface SourceProvenance {
  sourceId: string;
  sourceAuthority: string;
  sourceRole: string;
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

  const sourceId = requireProvenanceText(source.id, 'source id');
  const sourceAuthority = requireProvenanceText(source.authority, 'source authority');
  const sourceRole = requireProvenanceText(source.role, 'source role');
  const retrievalDate = (options.now ?? (() => new Date()))();
  if (!(retrievalDate instanceof Date) || !Number.isFinite(retrievalDate.getTime())) {
    throw new Error(`Source ${sourceId} received an invalid retrieval Date`);
  }
  const retrievedAt = retrievalDate.toISOString();
  const cacheGeneration = reserveAtomicCacheGeneration(options.destinationPath);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), source.retrieval.timeoutMs);
  let finalResponse: Response | undefined;
  let readerAcquired = false;

  try {
    const fetched = await fetchFollowingRedirects(
      source,
      options.fetchImpl ?? fetch,
      options.headers,
      controller.signal,
    );
    finalResponse = fetched.response;
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
      readerAcquired = true;
      const pendingChunks: Uint8Array[] = [];
      let inspectionBytes: Uint8Array<ArrayBufferLike> = new Uint8Array();
      let completed = false;
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
        completed = true;
      } finally {
        if (!completed) {
          await reader.cancel().catch(() => undefined);
        }
        reader.releaseLock();
      }
    }

    let provenance!: SourceProvenance;
    await writeAtomicCache(options.destinationPath, boundedBody(), {
      generation: cacheGeneration,
      validate: async () => {
        provenance = Object.freeze({
          sourceId,
          sourceAuthority,
          sourceRole,
          sourceUrl: source.url,
          retrievedAt,
          finalUrl: fetched.finalUrl,
          redirectCount: fetched.redirectCount,
          declaredContentType,
          observedContentType: observedContentType!,
          declaredBytes,
          receivedBytes,
          sha256: hash.digest('hex'),
        });
      },
    });
    return provenance;
  } catch (error) {
    if (finalResponse && !readerAcquired) {
      await cancelResponseBody(finalResponse);
    }
    if (controller.signal.aborted) {
      throw new Error(`Source ${source.id} timed out after ${source.retrieval.timeoutMs}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function requireProvenanceText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Source requires a non-empty ${field}`);
  return normalized;
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
  let currentUrl = validateSourceUrl(source.url, source);
  let redirectCount = 0;

  while (true) {
    const response = await fetchImpl(currentUrl.href, { headers, redirect: 'manual', signal });
    if (response.status >= 300 && response.status < 400) {
      try {
        if (redirectCount >= source.retrieval.maxRedirects) {
          throw new Error(`Source ${source.id} exceeded redirect limit of ${source.retrieval.maxRedirects}`);
        }
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`Source ${source.id} returned a redirect without a location`);
        }
        const redirectedUrl = validateSourceUrl(location, source, currentUrl);
        if (redirectedUrl.origin !== currentUrl.origin && hasCredentialHeaders(headers)) {
          throw new Error(`Source ${source.id} refused credential-bearing redirect across origins`);
        }
        currentUrl = redirectedUrl;
        redirectCount += 1;
      } catch (error) {
        await cancelResponseBody(response);
        throw error;
      }
      await cancelResponseBody(response);
      continue;
    }

    if (response.status !== 200) {
      await cancelResponseBody(response);
      throw new Error(`Source ${source.id} returned HTTP ${response.status}`);
    }
    return { response, finalUrl: currentUrl.href, redirectCount };
  }
}

async function cancelResponseBody(response: Response): Promise<void> {
  if (!response.body) return;
  await response.body.cancel().catch(() => undefined);
}

function validateSourceUrl(rawUrl: string, source: RemoteSource, base?: URL): URL {
  let parsed: URL;
  try {
    parsed = base ? new URL(rawUrl, base) : new URL(rawUrl);
  } catch (error) {
    throw new Error(`Source ${source.id} has an invalid URL`, { cause: error });
  }
  if (parsed.href.length > source.retrieval.maxUrlLength) {
    throw new Error(
      `Source ${source.id} exceeds its ${source.retrieval.maxUrlLength} character URL limit`,
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`Source ${source.id} must use HTTPS`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`Source ${source.id} URL must not contain userinfo`);
  }
  if (!source.allowedOrigins.includes(parsed.origin)) {
    throw new Error(`Source ${source.id} origin ${parsed.origin} is not allowed`);
  }
  return parsed;
}

function hasCredentialHeaders(headers: Readonly<Record<string, string>> | undefined): boolean {
  if (!headers) return false;
  const credentialNames = new Set([
    'authorization',
    'cookie',
    'proxy-authorization',
    'x-api-key',
    'api-key',
  ]);
  return [...new Headers(headers).keys()].some((name) => credentialNames.has(name.toLowerCase()));
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
