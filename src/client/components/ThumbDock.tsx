import type { AppState } from '../state/app-state';

const destinations: readonly { readonly id: AppState['surface']; readonly label: string; readonly glyph: string }[] = [
  { id: 'nearby', label: 'Nearby', glyph: '◉' },
  { id: 'map', label: 'Map', glyph: '◇' },
  { id: 'commute', label: 'Commute', glyph: '◷' },
  { id: 'saved', label: 'Saved', glyph: '★' },
];

export function ThumbDock({
  active,
  onChange,
}: {
  readonly active: AppState['surface'];
  readonly onChange: (surface: AppState['surface']) => void;
}) {
  return (
    <nav className="thumb-dock" aria-label="Primary">
      {destinations.map((destination) => (
        <button
          key={destination.id}
          type="button"
          className="thumb-dock__button"
          aria-current={active === destination.id ? 'page' : undefined}
          onClick={() => onChange(destination.id)}
        >
          <span aria-hidden="true">{destination.glyph}</span>
          <span>{destination.label}</span>
        </button>
      ))}
    </nav>
  );
}
