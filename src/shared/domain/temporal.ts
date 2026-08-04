const INTRINSIC_DATE_GET_TIME = Date.prototype.getTime;
const INTRINSIC_APPLY = Reflect.apply;

export interface DateCaptureOptions {
  /** Preserve an invalid Date as NaN when the owning domain models it as indeterminate. */
  readonly allowInvalid?: boolean;
}

/** Captures a real Date internal slot once without invoking caller-overridable methods. */
export function captureDateEpochMilliseconds(
  value: unknown,
  label: string,
  options: DateCaptureOptions = {},
): number {
  let epochMs: unknown;
  try {
    epochMs = INTRINSIC_APPLY(INTRINSIC_DATE_GET_TIME, value, []);
  } catch {
    throw new Error(`Invalid ${label}`);
  }
  if (options.allowInvalid === true && typeof epochMs === 'number' && Number.isNaN(epochMs)) return epochMs;
  if (!Number.isSafeInteger(epochMs)) throw new Error(`Invalid ${label}`);
  return epochMs as number;
}

/** Validates already-captured internal lifecycle state. */
export function validateEpochMilliseconds(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`Invalid ${label}`);
  return value as number;
}
