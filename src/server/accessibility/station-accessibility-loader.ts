import { validateCoverageRow, type StationDirectionCoverageRow } from '../../shared/domain/accessible-path';
/** App-owned structural rows remain separate from GTFS station notes. */
export function loadStationAccessibility(raw: readonly unknown[]): readonly StationDirectionCoverageRow[] { if (!Array.isArray(raw)) throw new Error('Station accessibility requires a 26-field row array'); return Object.freeze(raw.map(validateCoverageRow)); }
export function loadOptionalOfficialEquipment(input: unknown): Readonly<{ status: 'unavailable' | 'accepted'; inventory: readonly Readonly<{ equipmentId: string }>[]; outages: readonly Readonly<{ equipmentId: string; state: 'out-of-service' | 'planned-outage' | 'restored' }>[]; sourceTimestamp?: string; reason?: string }> {
  if (input === undefined || input === null) return Object.freeze({ status: 'unavailable', inventory: Object.freeze([]), outages: Object.freeze([]), reason: 'Optional official equipment evidence is not configured.' });
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('Official equipment input must be an object');
  const root = input as Record<string, unknown>;
  if (!Array.isArray(root.inventory) || !Array.isArray(root.outages) || typeof root.sourceTimestamp !== 'string' || !Number.isFinite(Date.parse(root.sourceTimestamp))) throw new Error('Official equipment input is incomplete');
  const inventory = root.inventory.map((value) => exactEquipmentIdentity(value));
  const ids = new Set(inventory.map(({ equipmentId }) => equipmentId));
  if (ids.size !== inventory.length) throw new Error('Duplicate official equipmentId');
  const outages = root.outages.map((value) => {
    const record = exactEquipmentIdentity(value) as { equipmentId: string; state?: unknown };
    if (!['out-of-service','planned-outage','restored'].includes(String(record.state))) throw new Error('Official outage state is invalid');
    if (!ids.has(record.equipmentId)) throw new Error('Official outage equipmentId does not join to inventory');
    return Object.freeze({ equipmentId: record.equipmentId, state: record.state as 'out-of-service'|'planned-outage'|'restored' });
  });
  return Object.freeze({ status: 'accepted', inventory: Object.freeze(inventory), outages: Object.freeze(outages), sourceTimestamp: root.sourceTimestamp });
}

function exactEquipmentIdentity(value: unknown): Readonly<{ equipmentId: string }> & Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof (value as Record<string,unknown>).equipmentId !== 'string' || !(value as Record<string,unknown>).equipmentId) throw new Error('Official equipment record missing equipmentId');
  return value as Readonly<{ equipmentId: string }> & Record<string, unknown>;
}
