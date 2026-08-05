import { validateAccessibilityRegistry, type AccessibilityPackage } from '../../shared/domain/accessible-path';
export const PRODUCTION_PATH_REGISTRY: readonly AccessibilityPackage[] = Object.freeze([]);
/** Complete path packages are loaded independently from mutable GTFS notes. */
export function loadPathEvidence(raw: readonly unknown[]): readonly AccessibilityPackage[] { if (!Array.isArray(raw)) throw new Error('Path evidence registry must be an array'); return validateAccessibilityRegistry(raw); }
