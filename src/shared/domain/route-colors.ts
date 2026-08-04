import type { RouteIdentity } from './types';

export interface RouteColorMetadata {
  background: string;
  foreground: string;
  routeLabel: string;
}

const routeColors: Readonly<Record<string, Omit<RouteColorMetadata, 'routeLabel'>>> = {
  '1': { background: '#EE352E', foreground: '#000000' },
  '2': { background: '#EE352E', foreground: '#000000' },
  '3': { background: '#EE352E', foreground: '#000000' },
  '4': { background: '#00933C', foreground: '#000000' },
  '5': { background: '#00933C', foreground: '#000000' },
  '6': { background: '#00933C', foreground: '#000000' },
  '7': { background: '#B933AD', foreground: '#FFFFFF' },
  A: { background: '#0039A6', foreground: '#FFFFFF' },
  C: { background: '#0039A6', foreground: '#FFFFFF' },
  E: { background: '#0039A6', foreground: '#FFFFFF' },
  B: { background: '#FF6319', foreground: '#000000' },
  D: { background: '#FF6319', foreground: '#000000' },
  F: { background: '#FF6319', foreground: '#000000' },
  M: { background: '#FF6319', foreground: '#000000' },
  G: { background: '#6CBE45', foreground: '#08120B' },
  J: { background: '#996633', foreground: '#FFFFFF' },
  Z: { background: '#996633', foreground: '#FFFFFF' },
  L: { background: '#A7A9AC', foreground: '#111111' },
  N: { background: '#FCCC0A', foreground: '#111111' },
  Q: { background: '#FCCC0A', foreground: '#111111' },
  R: { background: '#FCCC0A', foreground: '#111111' },
  W: { background: '#FCCC0A', foreground: '#111111' },
  S: { background: '#808183', foreground: '#000000' },
};

const fallbackColor = { background: '#667085', foreground: '#FFFFFF' };

/** Color is redundant metadata; consumers must render `routeLabel` as text. */
export function routeColorFor(route: RouteIdentity): RouteColorMetadata {
  return {
    ...(routeColors[route.id] ?? fallbackColor),
    routeLabel: route.label,
  };
}
