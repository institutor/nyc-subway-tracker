import { normalizeBoundedIdentity } from '../../shared/domain/canonical';
import type { CommuteStage } from '../../shared/domain/types';

export interface CommuteEvaluationAuthorization {
  readonly kind: 'commute-evaluation-authorization-v1';
  readonly stage: Exclude<CommuteStage, 'disabled'>;
  readonly exposureKey: 'commute-evaluation' | 'commute-silent';
  readonly authorizationId: string;
}

export interface CommuteDeliveryAuthorization {
  readonly kind: 'commute-delivery-authorization-v1';
  readonly stage: 'pilot' | 'delivery';
  readonly exposureKey: 'commute-limited-pilot' | 'commute-delivery';
  readonly authorizationId: string;
}

const evaluationAuthorizations = new WeakSet<object>();
const deliveryAuthorizations = new WeakSet<object>();

export function createCommuteEvaluationAuthorization(input: {
  readonly stage: Exclude<CommuteStage, 'disabled'>;
  readonly exposureKey: CommuteEvaluationAuthorization['exposureKey'];
  readonly authorizationId: string;
}): CommuteEvaluationAuthorization {
  const expected = input.stage === 'silent-evaluation' ? 'commute-silent' : 'commute-evaluation';
  if (input.exposureKey !== expected) throw new Error('Invalid commute evaluation authorization');
  const authorization = Object.freeze({
    kind: 'commute-evaluation-authorization-v1' as const,
    stage: input.stage,
    exposureKey: input.exposureKey,
    authorizationId: normalizeBoundedIdentity(input.authorizationId, 'commute evaluation authorization'),
  });
  evaluationAuthorizations.add(authorization);
  return authorization;
}

export function createCommuteDeliveryAuthorization(input: {
  readonly stage: 'pilot' | 'delivery';
  readonly exposureKey: CommuteDeliveryAuthorization['exposureKey'];
  readonly authorizationId: string;
}): CommuteDeliveryAuthorization {
  const expected = input.stage === 'pilot' ? 'commute-limited-pilot' : 'commute-delivery';
  if (input.exposureKey !== expected) throw new Error('Invalid commute delivery authorization');
  const authorization = Object.freeze({
    kind: 'commute-delivery-authorization-v1' as const,
    stage: input.stage,
    exposureKey: input.exposureKey,
    authorizationId: normalizeBoundedIdentity(input.authorizationId, 'commute delivery authorization'),
  });
  deliveryAuthorizations.add(authorization);
  return authorization;
}

export function authorizesEvaluation(
  authorization: CommuteEvaluationAuthorization | undefined,
  stage: CommuteStage,
): boolean {
  return Boolean(authorization && evaluationAuthorizations.has(authorization) && authorization.stage === stage);
}

export function authorizesDelivery(
  authorization: CommuteDeliveryAuthorization | undefined,
  stage: CommuteStage,
): boolean {
  return Boolean(authorization && deliveryAuthorizations.has(authorization) && authorization.stage === stage);
}
