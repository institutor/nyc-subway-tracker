import type { CSSProperties } from 'react';

import { routeColorFor } from '../../shared/domain/route-colors';
import type { RouteDto } from '../api/client';

export function RouteToken({ route, compact = false }: { readonly route: RouteDto; readonly compact?: boolean }) {
  const color = routeColorFor(route);
  const style = {
    '--route-background': color.background,
    '--route-foreground': color.foreground,
  } as CSSProperties;
  return (
    <span
      className={`route-token${compact ? ' route-token--compact' : ''}`}
      style={style}
      aria-label={`${route.label} train`}
    >
      {color.routeLabel}
    </span>
  );
}
