import { resolve } from 'node:path';

export type RuntimeMode = 'live' | 'validation' | 'shadow';

export interface ServerConfig {
  dataDirectory: string;
  mode: RuntimeMode;
  sources: {
    equipmentUrl?: string;
    outageUrl?: string;
    practicalWalkUrl?: string;
  };
}

export function loadServerConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ServerConfig {
  const configuredMode = environment.TRANSIT_RUNTIME_MODE ?? 'live';
  if (!['live', 'validation', 'shadow'].includes(configuredMode)) {
    throw new Error(`Invalid TRANSIT_RUNTIME_MODE: ${configuredMode}`);
  }

  return {
    dataDirectory: resolve(environment.TRANSIT_DATA_DIRECTORY ?? '.data'),
    mode: configuredMode as RuntimeMode,
    sources: {
      equipmentUrl: nonEmpty(environment.MTA_EQUIPMENT_URL),
      outageUrl: nonEmpty(environment.MTA_OUTAGE_URL),
      practicalWalkUrl: nonEmpty(environment.PRACTICAL_WALK_URL),
    },
  };
}

function nonEmpty(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
