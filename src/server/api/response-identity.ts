import { createHash } from 'node:crypto';

import { encodeCanonicalStringTuple } from '../../shared/domain/canonical';

export function createResponseIdentity(parts: readonly string[]): string {
  const digest = createHash('sha256')
    .update(encodeCanonicalStringTuple(['subway-api-response-v1', ...parts]))
    .digest('hex');
  return `response:${digest}`;
}
