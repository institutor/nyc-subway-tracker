export type ExposureCapability =
  | 'arrival-boards'
  | 'nearby-offline'
  | 'accessibility'
  | 'guidance';

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
  requiredForExposure: ExposureCapability[];
}

export interface RemoteSource extends SourceBase {
  kind: 'remote';
  url: string;
  enabled?: boolean;
  credentialEnv?: string;
  auditRequired?: boolean;
  expectedFormat: ExpectedFormat;
  acceptedContentTypes: string[];
  retrieval: {
    timeoutMs: number;
    maxRedirects: number;
    maxBytes: number;
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
  const remoteDefaults = { timeoutMs: 10_000, maxRedirects: 3 } as const;
  const sources: TransitSource[] = [
    {
      id: 'regular-subway-gtfs',
      authority: 'MTA',
      kind: 'remote',
      role: 'regular-gtfs',
      required: true,
      requiredForExposure: ['arrival-boards', 'nearby-offline'],
      url: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip',
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
      requiredForExposure: ['arrival-boards'],
      url: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip',
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
      requiredForExposure: ['arrival-boards'],
      url: `${REALTIME_BASE}${feed}`,
      expectedFormat: 'protobuf',
      acceptedContentTypes: PROTOBUF_TYPES,
      retrieval: { timeoutMs: 8_000, maxRedirects: 2, maxBytes: 16 * 1024 * 1024 },
    })),
    {
      id: 'subway-alerts',
      authority: 'MTA',
      kind: 'remote',
      role: 'subway-alerts',
      required: true,
      requiredForExposure: ['arrival-boards'],
      url: `${REALTIME_BASE}camsys/subway-alerts`,
      expectedFormat: 'protobuf',
      acceptedContentTypes: PROTOBUF_TYPES,
      retrieval: { timeoutMs: 8_000, maxRedirects: 2, maxBytes: 32 * 1024 * 1024 },
    },
    {
      id: 'subway-entrances-i9wp-a4ja',
      authority: 'MTA via NY Open Data',
      kind: 'remote',
      role: 'entrances',
      required: true,
      requiredForExposure: ['nearby-offline'],
      url: 'https://data.ny.gov/resource/i9wp-a4ja.json?$limit=50000',
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
      requiredForExposure: ['accessibility'],
      url: 'https://data.ny.gov/resource/39hk-dx4f.json?$limit=50000',
      expectedFormat: 'json',
      acceptedContentTypes: ['application/json', 'application/json; charset=utf-8'],
      retrieval: { ...remoteDefaults, maxBytes: 32 * 1024 * 1024 },
    },
    optionalRemoteSource(
      'equipment-inventory',
      'equipment-inventory',
      config.equipmentUrl,
      'MTA_API_KEY',
      ['accessibility'],
    ),
    optionalRemoteSource(
      'equipment-outages',
      'equipment-outages',
      config.outageUrl,
      'MTA_API_KEY',
      ['accessibility'],
    ),
    {
      id: 'practical-walk',
      authority: 'Configured audited routing provider',
      kind: 'remote',
      role: 'practical-walk',
      required: false,
      requiredForExposure: ['nearby-offline'],
      enabled: Boolean(config.practicalWalkUrl),
      auditRequired: true,
      url: config.practicalWalkUrl ?? 'https://disabled.invalid/practical-walk',
      expectedFormat: 'json',
      acceptedContentTypes: ['application/json'],
      retrieval: { timeoutMs: 4_000, maxRedirects: 1, maxBytes: 1024 * 1024 },
    },
    {
      id: 'complete-path-packages',
      authority: 'App-owned reviewed evidence',
      kind: 'immutable-package',
      role: 'complete-path-packages',
      required: false,
      requiredForExposure: ['accessibility'],
      records: [],
    },
    {
      id: 'guidance-packages',
      authority: 'App-owned reviewed evidence',
      kind: 'immutable-package',
      role: 'guidance-packages',
      required: false,
      requiredForExposure: ['guidance'],
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
  requiredForExposure: ExposureCapability[],
): RemoteSource {
  return {
    id,
    authority: 'MTA credentialed API',
    kind: 'remote',
    role,
    required: false,
    requiredForExposure,
    enabled: Boolean(url),
    credentialEnv,
    url: url ?? `https://disabled.invalid/${id}`,
    expectedFormat: 'json-or-xml',
    acceptedContentTypes: ['application/json', 'application/xml', 'text/xml'],
    retrieval: { timeoutMs: 8_000, maxRedirects: 2, maxBytes: 16 * 1024 * 1024 },
  };
}
