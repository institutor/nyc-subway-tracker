import { useMemo } from 'react';

import { routeColorFor } from '../../shared/domain/route-colors';
import type { MapFeatureDto, MapOverlayEnvelopeDto, MapReferenceDto } from '../api/client';

export interface MapViewport {
  readonly centerX: number;
  readonly centerY: number;
  readonly zoom: number;
}

export function VectorNetworkMap({
  reference,
  overlay,
  viewport,
  spatialView,
  serviceLabel,
}: {
  readonly reference?: MapReferenceDto;
  readonly overlay?: NonNullable<MapOverlayEnvelopeDto['data']>;
  readonly viewport: MapViewport;
  readonly spatialView: 'schematic' | 'geographic';
  readonly serviceLabel: string;
}) {
  const projection = useMemo(() => createProjection(reference?.features ?? [], spatialView), [reference, spatialView]);
  const overlayById = useMemo(() => new Map(overlay?.segments.map((segment) => [segment.id, segment]) ?? []), [overlay]);
  return (
    <figure className="network-map" data-testid="vector-network-map" data-spatial-view={spatialView} data-viewport={`${viewport.centerX},${viewport.centerY},${viewport.zoom}`}>
      <svg viewBox="0 0 1000 1000" role="img" aria-labelledby="network-map-title network-map-description">
        <title id="network-map-title">Original app-owned subway network reference</title>
        <desc id="network-map-description">{serviceLabel}. Route identity is shown through labels and line treatment as well as color.</desc>
        <g transform={`translate(500 500) scale(${viewport.zoom}) translate(-500 -500)`}>
          {reference?.features.map((feature) => renderFeature(feature, projection, overlayById.get(feature.id)))}
        </g>
      </svg>
      <figcaption>
        <span>{serviceLabel}</span>
        {reference ? <span>{reference.attribution}</span> : <span>No unsupported current geometry is drawn.</span>}
      </figcaption>
    </figure>
  );
}

function renderFeature(
  feature: MapFeatureDto,
  project: (point: readonly [number, number]) => readonly [number, number],
  overlay: NonNullable<MapOverlayEnvelopeDto['data']>['segments'][number] | undefined,
) {
  const routeId = feature.routeIds[0] ?? '?';
  const color = routeColorFor({ id: routeId, label: routeId });
  const state = overlay?.state ?? 'reference';
  if (feature.geometry.type === 'Point') {
    const [x, y] = project(feature.geometry.coordinates);
    const labelOnLeft = x > 760;
    return (
      <g key={feature.id} data-map-feature={feature.id} data-state={state}>
        <circle cx={x} cy={y} r="13" className={`network-map__station network-map__feature--${state}`} />
        <text x={labelOnLeft ? x - 19 : x + 19} y={y + 6} textAnchor={labelOnLeft ? 'end' : 'start'}>{feature.id}</text>
      </g>
    );
  }
  const projected = feature.geometry.coordinates.map(project);
  const points = projected.map(([x, y]) => `${x},${y}`).join(' ');
  const labelPoint = projected[Math.floor(projected.length / 2)] ?? [500, 500];
  const labelOnLeft = labelPoint[0] > 760;
  return (
    <g key={feature.id} data-map-feature={feature.id} data-state={state}>
      <polyline
        points={points}
        fill="none"
        stroke={color.background}
        strokeWidth="16"
        className={`network-map__line network-map__feature--${state}`}
        aria-label={`${feature.routeIds.join(', ')} route segment, ${state}`}
      />
      <text
        x={labelOnLeft ? labelPoint[0] - 18 : labelPoint[0] + 18}
        y={labelPoint[1] - 18}
        textAnchor={labelOnLeft ? 'end' : 'start'}
        className="network-map__route-label"
      >{feature.routeIds.join(' ')}</text>
    </g>
  );
}

function createProjection(features: readonly MapFeatureDto[], spatialView: 'schematic' | 'geographic') {
  const points = features.flatMap((feature): readonly (readonly [number, number])[] =>
    feature.geometry.type === 'Point' ? [feature.geometry.coordinates] : feature.geometry.coordinates);
  if (points.length === 0) return (_point: readonly [number, number]) => [500, 500] as const;
  const projectSource = spatialView === 'geographic' ? webMercator : identityProjection;
  const projected = points.map(projectSource);
  const horizontal = projected.map(([x]) => x);
  const vertical = projected.map(([, y]) => y);
  const minimumX = Math.min(...horizontal);
  const maximumX = Math.max(...horizontal);
  const minimumY = Math.min(...vertical);
  const maximumY = Math.max(...vertical);
  const xSpan = Math.max(0.000_001, maximumX - minimumX);
  const ySpan = Math.max(0.000_001, maximumY - minimumY);
  return (point: readonly [number, number]) => {
    const [x, y] = projectSource(point);
    return [
      60 + ((x - minimumX) / xSpan) * 880,
      940 - ((y - minimumY) / ySpan) * 880,
    ] as const;
  };
}

function identityProjection([longitude, latitude]: readonly [number, number]): readonly [number, number] {
  return [longitude, latitude];
}

function webMercator([longitude, latitude]: readonly [number, number]): readonly [number, number] {
  const clampedLatitude = Math.max(-85.051_129, Math.min(85.051_129, latitude));
  const radians = clampedLatitude * Math.PI / 180;
  return [
    (longitude + 180) / 360,
    (1 - Math.log(Math.tan(radians) + (1 / Math.cos(radians))) / Math.PI) / 2,
  ];
}
