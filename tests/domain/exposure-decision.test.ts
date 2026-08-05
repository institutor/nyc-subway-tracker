import { describe, expect, test } from 'vitest';

import {
  PRODUCTION_EXPOSURE_REGISTRY,
  VALIDATION_EXPOSURE_REGISTRY,
  resolveAccessibilityExposure,
  resolveGuidanceExposure,
  validateExposureDecisionRegistry,
  type ExposureDecisionRecord,
  type ExposureDecisionRegistry,
} from '../../src/shared/domain/exposure-decision';

const now = new Date('2026-08-01T00:00:00.000Z');

describe('app-owned exposure decision registries', () => {
  test('keeps production empty and refuses a structurally identical caller registry', () => {
    expect(PRODUCTION_EXPOSURE_REGISTRY.records).toEqual([]);
    expect(resolveAccessibilityExposure(
      PRODUCTION_EXPOSURE_REGISTRY,
      'public-accessibility-coverage-v1',
      'coverage-v1',
      now,
    )).toBeUndefined();

    const forged = {
      surface: VALIDATION_EXPOSURE_REGISTRY.surface,
      records: VALIDATION_EXPOSURE_REGISTRY.records,
    } as unknown as ExposureDecisionRegistry;
    expect(resolveAccessibilityExposure(
      forged,
      'validation-accessibility-coverage-v1',
      'coverage-v1',
      now,
    )).toBeUndefined();
  });

  test('deeply freezes the accepted app-owned registry and its review and release evidence', () => {
    const record = VALIDATION_EXPOSURE_REGISTRY.records[0]!;
    expect(Object.isFrozen(VALIDATION_EXPOSURE_REGISTRY)).toBe(true);
    expect(Object.isFrozen(VALIDATION_EXPOSURE_REGISTRY.records)).toBe(true);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.reviews)).toBe(true);
    expect(record.reviews.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(record.release)).toBe(true);
    expect(() => { (record.release as { status: string }).status = 'approved'; }).toThrow();
  });

  test('rejects wrong-owner, wrong-version, and stale registry identities', () => {
    expect(resolveGuidanceExposure(
      VALIDATION_EXPOSURE_REGISTRY,
      'validation-accessibility-coverage-v1',
      'coverage-v1',
      now,
    )).toBeUndefined();
    expect(resolveAccessibilityExposure(
      VALIDATION_EXPOSURE_REGISTRY,
      'validation-accessibility-coverage-v1',
      'wrong-v2',
      now,
    )).toBeUndefined();
    expect(resolveAccessibilityExposure(
      VALIDATION_EXPOSURE_REGISTRY,
      'validation-accessibility-stale-v1',
      'stale-v1',
      now,
    )).toBeUndefined();
  });

  test('rejects duplicate decision and release identities', () => {
    const record = cloneRecord(VALIDATION_EXPOSURE_REGISTRY.records[0]!);
    expect(() => validateExposureDecisionRegistry([record, cloneRecord(record)])).toThrow(/duplicate decision/i);
    expect(() => validateExposureDecisionRegistry([
      record,
      { ...cloneRecord(VALIDATION_EXPOSURE_REGISTRY.records[1]!), release: { ...record.release, owner: 'guidance', packageVersion: 'package-v1' } },
    ])).toThrow(/duplicate release/i);
  });

  test.each([
    ['missing role', (record: ExposureDecisionRecord) => ({ ...record, reviews: record.reviews.slice(0, 4) })],
    ['duplicate role', (record: ExposureDecisionRecord) => ({ ...record, reviews: record.reviews.map((review, index) => index === 4 ? { ...review, role: 'product' as const } : review) })],
    ['wrong review version', (record: ExposureDecisionRecord) => ({ ...record, reviews: record.reviews.map((review, index) => index === 0 ? { ...review, packageVersion: 'wrong-v2' } : review) })],
    ['wrong release owner', (record: ExposureDecisionRecord) => ({ ...record, release: { ...record.release, owner: 'guidance' as const } })],
    ['wrong release version', (record: ExposureDecisionRecord) => ({ ...record, release: { ...record.release, packageVersion: 'wrong-v2' } })],
    ['release before review', (record: ExposureDecisionRecord) => ({ ...record, release: { ...record.release, decidedAt: '2026-07-30T13:00:00.000Z' } })],
    ['acceptance before release', (record: ExposureDecisionRecord) => ({ ...record, acceptedAt: '2026-07-30T14:30:00.000Z' })],
    ['inverted validity', (record: ExposureDecisionRecord) => ({ ...record, validThrough: '2026-07-29T00:00:00.000Z' })],
    ['extra root field', (record: ExposureDecisionRecord) => ({ ...record, callerApproved: true })],
  ])('rejects malformed %s evidence', (_name, mutate) => {
    expect(() => validateExposureDecisionRegistry([
      mutate(cloneRecord(VALIDATION_EXPOSURE_REGISTRY.records[0]!)),
    ])).toThrow();
  });
});

function cloneRecord(record: ExposureDecisionRecord): ExposureDecisionRecord {
  return {
    ...record,
    reviews: record.reviews.map((review) => ({ ...review })),
    release: { ...record.release },
  };
}
