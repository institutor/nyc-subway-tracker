# Task 12 fix round 1 report: underground journey continuity

## Outcome

Task 12 review repairs are complete. The validation candidate now keeps immutable subway structure separate from operational truth, preserves historical labeling across transport and UI boundaries, routes from a device-held graph without a journey request, captures only response-owned trip evidence, and recovers current claims through the exact owner-gated five-stage sequence.

The first browser visit also becomes offline-ready without an artificial second online reload. After the new service worker claims the open page, the app repeats only the four immutable reference reads. The installed shell, station catalog, Day map, Night map, and journey graph are then available for an offline reload. Hashed shell assets remain usable when a preview or CDN emits `Vary: Origin` because the worker ignores that variance only after admitting an exact same-origin allowlisted immutable URL.

## Repairs delivered

### Historical and transport truth

- Board and map-overlay DTOs retain exact `network` or `historical` cache state.
- Public historical responses require the exact server opt-in while retaining `Cache-Control: no-store` at the HTTP boundary.
- A historical board never returns to Live styling or a moving countdown merely because the browser reports online.
- Service-alert presentation distinguishes online evidence from historical last-checked context.

### Reconnection ownership

- Recovery evidence is bound to its epoch, request identity, generation, active trip, context key, and eligible scope.
- Recovery runs in the required order: equipment/accessibility; service changes and vetoes; two fresh arrival snapshots with feed-health admission; positioning/transfers; maps and unrelated Saved content.
- Retained content remains historical until the complete owner sequence succeeds; ordinary accepted requests cannot promote it.

### Offline graph and routing

- Bootstrap owns one immutable journey-graph version and the client strictly validates and stores its readiness metadata.
- Offline planning calls the shared pure routing engine and performs no journey POST.
- A cold, corrupt, or incomplete device-held graph fails honestly.
- Origin, exact destination selection, service meaning, connectivity, service date, and accessibility preference form the request-ownership tuple; late responses cannot overwrite a changed tuple.
- Offline output is intentionally an untimed structural route unless the accepted device-held evidence owns a supported departure time.

### Captured journeys and rider-owned controls

- Active-trip schema v3 persists an exact response-owned capture package rather than reconstructing service date, schedule, departures, disclosure, warnings, or optional modules in the browser.
- Legacy v1/v2 data migrates to untimed structural context, strips known synthetic placeholders, and quarantines incoherent bytes.
- Current, Future, and Reference labels follow the request mode that owns them.
- Actual-now keeps a stable structural map base with a separate current overlay; Day/Night response races cannot replace a later choice.
- Schematic and geographic controls produce genuinely distinct coordinate treatment.
- Saved editing uses a detached draft for every rider-owned field, and Cancel preserves the original stored bytes.
- Accessibility and equipment arrays may be explicitly empty; absent evidence is omitted rather than fabricated.

### First-visit offline acceptance

- The service worker claims the first open page in place.
- The app observes that claim and re-reads only exact immutable catalog, graph, Day-map, and Night-map references through the worker.
- The browser acceptance test verifies hashed shell assets and all four structural references before connectivity drops.
- The same test reloads offline, opens the Typical weekday reference map, searches a stored catalog, plans a local untimed route, and observes zero `/api/v1/journeys` POST requests.

## RED/GREEN evidence

The repairs were driven by regressions before production changes. The main review findings failed for discarded historical headers, current-looking retained boards, missing recovery ownership, absent graph persistence, stale journey tuples, synthesized capture fields, stale map responses, partial Saved drafts, and ambiguous alert currency. Each focused suite passed after its corresponding change.

The final production-preview browser pass added two concrete end-to-end RED observations:

1. Removing the second online reload left the new page controlled but its immutable references uncached. The app now observes `controllerchange` and performs a bounded immutable-only warm-up; the catalog, journey graph, Day map, and Night map all appeared in the reviewed structural cache on the first visit.
2. The offline navigation returned cached HTML with status 200, the exact hashed CSS/JS keys were present, and no client exception occurred, but both assets failed with `net::ERR_FAILED`. The preview's `Vary: Origin` separated install-time requests from page `crossorigin` requests. Exact allowlisted cache-first matching now uses `ignoreVary`, and the offline shell rendered completely.

The first corrected browser rerun then passed the full install, cache, offline reload, reference-map, local-routing, and zero-POST story.

## Verification

- Full Vitest: **49 files, 726 tests passed**.
- Focused offline/map/worker suite: **4 files, 43 tests passed**.
- TypeScript: `tsc --noEmit` passed with zero diagnostics.
- Production build: **66 modules transformed**, build completed successfully.
- Browser acceptance: **1 Playwright test passed** in installed system Chrome against deterministic validation mode.
- Browser assertions covered manifest/scope, first-visit control without reload, exact shell assets, catalog/graph/Day/Night references, offline navigation, persistent Offline copy, truthful Typical weekday labeling, app-owned map attribution, device-held station search, untimed structural routing, no active-trip capture from offline evidence, and zero journey POSTs.
- Diff hygiene: `git diff --check` passed; repository line-ending notices were non-failing.
- Scope scan: no crowding feature or official MTA map/logo asset was added. Accessibility outage and crowding work remain outside Task 12.

## Browser environment note

The repository's bundled Playwright Chromium executable is not installed on this machine (`chromium_headless_shell-1234` was absent). This is a local test-tool limitation, not an application failure. The Playwright configuration now accepts the explicit `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override, and the complete acceptance test passed with installed Google Chrome. The default remains Playwright's managed Chromium when it is available.

The browser server ran in deterministic `TRANSIT_RUNTIME_MODE=validation`, as required for governed fixture surfaces. Live/public mode correctly keeps map-rights and other unapproved operational surfaces locked; this acceptance result does not claim a public launch approval.

## Commits

| Commit | Lowercase subject | Review area |
|---|---|---|
| `97b2190` | `preserve historical subway truth` | transport metadata, historical UI, reviewed cache opt-in |
| `5c07a9d` | `gate subway recovery evidence` | owner-bound five-stage reconnection |
| `d9ae052` | `route saved journeys underground` | immutable graph and zero-network local routing |
| `b5f9efa` | `finish rider owned map and saved controls` | stable maps, complete Saved editing, alert truth |
| `a2d3ba2` | `preserve exact journey capture evidence` | response-owned capture package and v3 migration |
| `8f1dc8f` | `make first visit ready underground` | first-visit warm-up, shell variance fix, complete browser acceptance |

## Release posture

This is a complete deterministic validation candidate for Task 12, not evidence that Gate 0 or public exposure gates have passed. It stores no current arrival, accessibility, equipment, or inferred rider-movement claim as immutable structural truth. No official MTA map/logo asset and no unsupported car-crowding presentation was introduced.
