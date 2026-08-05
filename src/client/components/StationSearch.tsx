import { useEffect, useId, useRef, useState } from 'react';

import type { CatalogComplexDto, TransitApiClient } from '../api/client';
import type { StationChoice } from '../state/app-state';

interface SearchOption extends StationChoice {
  readonly optionId: string;
  readonly constituentName: string;
  readonly routeIds: readonly string[];
}

export function StationSearch({
  api,
  label,
  onSelect,
  onSelectionClear,
  initialValue = '',
  catalog = [],
  offline = false,
}: {
  readonly api: Pick<TransitApiClient, 'searchStations'>;
  readonly label: string;
  readonly onSelect: (station: StationChoice) => void;
  readonly onSelectionClear?: () => void;
  readonly initialValue?: string;
  readonly catalog?: readonly CatalogComplexDto[];
  readonly offline?: boolean;
}) {
  const listId = useId();
  const generation = useRef(0);
  const controller = useRef<AbortController | undefined>(undefined);
  const [query, setQuery] = useState(initialValue);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [options, setOptions] = useState<readonly SearchOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<StationChoice>();

  useEffect(() => () => controller.current?.abort(), []);

  const search = (next: string) => {
    setQuery(next);
    if (selected) {
      setSelected(undefined);
      onSelectionClear?.();
    }
    controller.current?.abort();
    generation.current += 1;
    const requestId = generation.current;
    const normalized = next.normalize('NFC').trim();
    if (!normalized) {
      setPhase('idle');
      setOptions([]);
      setActiveIndex(-1);
      return;
    }
    if (offline) {
      const folded = normalized.toLocaleLowerCase('en-US');
      const local = catalog.filter((complex) => [
        complex.name,
        ...complex.routeIds,
        ...complex.constituents.flatMap((constituent) => [constituent.name, constituent.id]),
      ].some((value) => value.toLocaleLowerCase('en-US').includes(folded))).slice(0, 10);
      setOptions(flattenResults(local));
      setActiveIndex(-1);
      setPhase('ready');
      return;
    }
    const nextController = new AbortController();
    controller.current = nextController;
    setPhase('loading');
    void api.searchStations(normalized, 10, nextController.signal).then((response) => {
      if (nextController.signal.aborted || requestId !== generation.current) return;
      const nextOptions = flattenResults(response.results);
      setOptions(nextOptions);
      setActiveIndex(-1);
      setPhase('ready');
    }).catch((error: unknown) => {
      if (isAbort(error) || nextController.signal.aborted || requestId !== generation.current) return;
      setOptions([]);
      setActiveIndex(-1);
      setPhase('error');
    });
  };

  const choose = (option: SearchOption) => {
    controller.current?.abort();
    generation.current += 1;
    setQuery(option.name);
    setOptions([]);
    setActiveIndex(-1);
    setPhase('idle');
    const choice = { complexId: option.complexId, constituentId: option.constituentId, name: option.name };
    setSelected(choice);
    onSelect(choice);
  };

  return (
    <div className="station-search">
      <label htmlFor={`${listId}-input`}>{label}</label>
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        autoComplete="off"
        value={query}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={options.length > 0}
        aria-activedescendant={activeIndex >= 0 ? options[activeIndex]?.optionId : undefined}
        aria-describedby={`${listId}-status`}
        onChange={(event) => search(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && options.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => Math.min(options.length - 1, current + 1));
          } else if (event.key === 'ArrowUp' && options.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => Math.max(0, current - 1));
          } else if (event.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
            event.preventDefault();
            choose(options[activeIndex]);
          } else if (event.key === 'Escape') {
            setOptions([]);
            setActiveIndex(-1);
          }
        }}
      />
      <p id={`${listId}-status`} className="station-search__status" aria-live="polite">
        {phase === 'loading' ? 'Searching stations…' : phase === 'error' ? 'Station search is unavailable.' : phase === 'ready' && options.length === 0 ? 'No matching stations.' : ''}
      </p>
      {options.length > 0 ? (
        <ul id={listId} role="listbox" aria-label={`${label} results`} className="station-search__results">
          {options.map((option, index) => (
            <li
              key={`${option.complexId}:${option.constituentId}`}
              id={option.optionId}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <strong>{option.name}</strong>
              <span>{option.constituentName === option.name ? option.routeIds.join(' · ') : option.constituentName}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function flattenResults(results: readonly CatalogComplexDto[]): readonly SearchOption[] {
  return results.flatMap((complex) => complex.constituents.map((constituent) => ({
    complexId: complex.id,
    constituentId: constituent.id,
    name: complex.name,
    constituentName: constituent.name,
    routeIds: complex.routeIds,
    optionId: `station-option-${encodeURIComponent(complex.id)}-${encodeURIComponent(constituent.id)}`,
  })));
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
