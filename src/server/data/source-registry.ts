export type SourceClaim =
  | 'regular-schedule'
  | 'supplemented-schedule'
  | 'arrival-evidence'
  | 'service-changes'
  | 'nearby-entrances'
  | 'nearby-practical-walk'
  | 'accessibility-structure'
  | 'accessibility-equipment-inventory'
  | 'accessibility-equipment-status'
  | 'offline-reference'
  | 'guidance'
  | 'commute-evaluation'
  | 'commute-delivery';

export type SourceRole =
  | 'regular-gtfs'
  | 'supplemented-gtfs'
  | 'subway-realtime'
  | 'subway-alerts'
  | 'entrances'
  | 'station-accessibility'
  | 'equipment-inventory'
  | 'equipment-outages'
  | 'practical-walk'
  | 'complete-path-packages'
  | 'guidance-packages';

export type ExpectedFormat = 'zip' | 'protobuf' | 'json' | 'json-or-xml';

interface SourceBase {
  id: string;
  authority: string;
  role: SourceRole;
  required: boolean;
  supports: readonly SourceClaim[];
}

export interface RemoteSource extends SourceBase {
  kind: 'remote';
  url: string;
  enabled?: boolean;
  credentialEnv?: string;
  auditRequired?: boolean;
  allowedOrigins: readonly string[];
  expectedFormat: ExpectedFormat;
  acceptedContentTypes: string[];
  retrieval: {
    timeoutMs: number;
    maxRedirects: number;
    maxBytes: number;
    maxUrlLength: number;
  };
}

export interface ImmutablePackageSource extends SourceBase {
  kind: 'immutable-package';
  records: readonly Readonly<Record<string, unknown>>[];
}

export type TransitSource = RemoteSource | ImmutablePackageSource;

export interface SourceRegistryConfig {
  equipmentUrl?: string;
  outageUrl?: string;
  practicalWalkUrl?: string;
}

const REALTIME_BASE = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/';
const PROTOBUF_TYPES = ['application/x-protobuf', 'application/protobuf', 'application/octet-stream'];

const realtimeGroups = [
  ['subway-rt-1234567s', 'nyct%2Fgtfs'],
  ['subway-rt-ace', 'nyct%2Fgtfs-ace'],
  ['subway-rt-bdfm', 'nyct%2Fgtfs-bdfm'],
  ['subway-rt-g', 'nyct%2Fgtfs-g'],
  ['subway-rt-jz', 'nyct%2Fgtfs-jz'],
  ['subway-rt-l', 'nyct%2Fgtfs-l'],
  ['subway-rt-nqrw', 'nyct%2Fgtfs-nqrw'],
] as const;

export function createSourceRegistry(config: SourceRegistryConfig): TransitSource[] {
  const remoteDefaults = { timeoutMs: 10_000, maxRedirects: 3, maxUrlLength: 2_048 } as const;
  const sources: TransitSource[] = [
    {
      id: 'regular-subway-gtfs',
      authority: 'MTA',
      kind: 'remote',
      role: 'regular-gtfs',
      required: true,
      supports: ['regular-schedule', 'offline-reference'],
      url: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip',
      allowedOrigins: ['https://rrgtfsfeeds.s3.amazonaws.com'],
      expectedFormat: 'zip',
      acceptedContentTypes: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
      retrieval: { ...remoteDefaults, maxBytes: 256 * 1024 * 1024 },
    },
    {
      id: 'supplemented-subway-gtfs',
      authority: 'MTA',
      kind: 'remote',
      role: 'supplemented-gtfs',
      required: true,
      supports: ['supplemented-schedule', 'offline-reference', 'commute-evaluation'],
      url: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip',
      allowedOrigins: ['https://rrgtfsfeeds.s3.amazonaws.com'],
      expectedFormat: 'zip',
      acceptedContentTypes: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
      retrieval: { ...remoteDefaults, maxBytes: 256 * 1024 * 1024 },
    },
    ...realtimeGroups.map<RemoteSource>(([id, feed]) => ({
      id,
      authority: 'MTA',
      kind: 'remote',
      role: 'subway-realtime',
      required: true,
      supports: ['arrival-evidence', 'commute-evaluation'],
      url: `${REALTIME_BASE}${feed}`,
      allowedOrigins: ['https://api-endpoint.mta.info'],
      expectedFormat: 'protobuf',
      acceptedContentTypes: PROTOBUF_TYPES,
      retrieval: {
        timeoutMs: 8_000,
        maxRedirects: 2,
        maxBytes: 16 * 1024 * 1024,
        maxUrlLength: 2_048,
      },
    })),
    {
      id: 'subway-alerts',
      authority: 'MTA',
      kind: 'remote',
      role: 'subway-alerts',
      required: true,
      supports: ['service-changes', 'commute-evaluation'],
      url: `${REALTIME_BASE}camsys/subway-alerts`,
      allowedOrigins: ['https://api-endpoint.mta.info'],
      expectedFormat: 'protobuf',
      acceptedContentTypes: PROTOBUF_TYPES,
      retrieval: {
        timeoutMs: 8_000,
        maxRedirects: 2,
        maxBytes: 32 * 1024 * 1024,
        maxUrlLength: 2_048,
      },
    },
    {
      id: 'subway-entrances-i9wp-a4ja',
      authority: 'MTA via NY Open Data',
      kind: 'remote',
      role: 'entrances',
      required: true,
      supports: ['nearby-entrances', 'offline-reference'],
      url: 'https://data.ny.gov/resource/i9wp-a4ja.json?$limit=50000',
      allowedOrigins: ['https://data.ny.gov'],
      expectedFormat: 'json',
      acceptedContentTypes: ['application/json', 'application/json; charset=utf-8'],
      retrieval: { ...remoteDefaults, maxBytes: 32 * 1024 * 1024 },
    },
    {
      id: 'station-accessibility-39hk-dx4f',
      authority: 'MTA via NY Open Data',
      kind: 'remote',
      role: 'station-accessibility',
      required: true,
      supports: ['accessibility-structure', 'offline-reference'],
      url: 'https://data.ny.gov/resource/39hk-dx4f.json?$limit=50000',
      allowedOrigins: ['https://data.ny.gov'],
      expectedFormat: 'json',
      acceptedContentTypes: ['application/json', 'application/json; charset=utf-8'],
      retrieval: { ...remoteDefaults, maxBytes: 32 * 1024 * 1024 },
    },
    optionalRemoteSource(
      'equipment-inventory',
      'equipment-inventory',
      config.equipmentUrl,
      'MTA_API_KEY',
      ['accessibility-equipment-inventory'],
    ),
    optionalRemoteSource(
      'equipment-outages',
      'equipment-outages',
      config.outageUrl,
      'MTA_API_KEY',
      ['accessibility-equipment-status', 'commute-evaluation'],
    ),
    {
      id: 'practical-walk',
      authority: 'Configured audited routing provider',
      kind: 'remote',
      role: 'practical-walk',
      required: false,
      supports: ['nearby-practical-walk'],
      enabled: Boolean(config.practicalWalkUrl),
      auditRequired: true,
      url: config.practicalWalkUrl ?? 'https://disabled.invalid/practical-walk',
      allowedOrigins: [configuredOrigin(config.practicalWalkUrl, 'https://disabled.invalid')],
      expectedFormat: 'json',
      acceptedContentTypes: ['application/json'],
      retrieval: {
        timeoutMs: 4_000,
        maxRedirects: 1,
        maxBytes: 1024 * 1024,
        maxUrlLength: 2_048,
      },
    },
    {
      id: 'complete-path-packages',
      authority: 'App-owned reviewed evidence',
      kind: 'immutable-package',
      role: 'complete-path-packages',
      required: false,
      supports: ['accessibility-structure', 'offline-reference', 'commute-evaluation'],
      records: [],
    },
    {
      id: 'guidance-packages',
      authority: 'App-owned reviewed evidence',
      kind: 'immutable-package',
      role: 'guidance-packages',
      required: false,
      supports: ['guidance'],
      records: [],
    },
  ];

  return sources;
}

function optionalRemoteSource(
  id: string,
  role: 'equipment-inventory' | 'equipment-outages',
  url: string | undefined,
  credentialEnv: string,
  supports: readonly SourceClaim[],
): RemoteSource {
  return {
    id,
    authority: 'MTA credentialed API',
    kind: 'remote',
    role,
    required: false,
    supports,
    enabled: Boolean(url),
    credentialEnv,
    url: url ?? `https://disabled.invalid/${id}`,
    allowedOrigins: [configuredOrigin(url, 'https://disabled.invalid')],
    expectedFormat: 'json-or-xml',
    acceptedContentTypes: ['application/json', 'application/xml', 'text/xml'],
    retrieval: {
      timeoutMs: 8_000,
      maxRedirects: 2,
      maxBytes: 16 * 1024 * 1024,
      maxUrlLength: 2_048,
    },
  };
}

function configuredOrigin(url: string | undefined, fallback: string): string {
  return url ? new URL(url).origin : fallback;
}
