# Task 12 fix round 2 report: exact recovery and map truth

## Outcome

All assigned round-2 findings for Task 12 are repaired. Recovery now respects service-change dependencies, binds every owner result to an exact scope and local receipt time, restores an active trip only from current response-owned evidence, and never presents an unavailable or historical overlay as Actual now. Browser acceptance now uses the real product UI against a deterministic same-origin validation server; it does not manufacture local storage or cache entries.

The completed implementation head before this report is `ec08b31` (`exercise real offline recovery`). No Task 13 accessibility or crowding scope was added.

## Finding 2: recovery dependencies, stored train ownership, and Day/Night meaning

- Stage 3 current arrivals are withheld unless stage 2 has first resolved service changes, applied vetoes, and—when an active trip exists—verified the exact stored service pattern.
- A rejected or unavailable owner result is replaced with a governed fail-closed result, and the ordered recovery sequence continues without promoting current claims.
- The preserved recovery context derives the exact stored departure choice from the rider's current leg and point instead of treating every active trip as if it owned a train choice.
- Actual now always owns the Day map reference. Late night alone owns Night; Typical weekday remains Day.
- Active-trip service recovery replans the exact origin, destination, accessibility choice, first direction, and actual destination. Route, direction, destination, and ordered stop sequence must match every stored leg.
- Current trip-pattern admission requires response-owned current capture evidence with no blocking veto or unresolved service claim. Unrelated GTFS-RT health cannot stand in for the active service-change owner; matching current Alerts or Supplemented GTFS evidence is required.

## Finding 3: exact gates, scopes, evidence, and time

- Recovery ownership now contains an exact scope set for every owner domain: equipment, accessible path, service change, feed health, train admission, arrivals, positioning, transfer guidance, maps, and Saved.
- Owner acceptance must match its domain's scope array exactly; a broad eligible-scope subset is no longer sufficient.
- Every gate binds the exact epoch, request identity, generation, active trip, context key, evidence identity, evidence time, acceptance time, and owner scope.
- The loader captures acceptance with its injected local clock after each response. The runner captures a separate local receipt bound, rewrites nested gate acceptance to that local bound, and validates `evidenceAt <= acceptedAt <= acceptedThrough` within the recovery epoch.
- Server-provided evidence timestamps are never copied into the local acceptance field.
- Fail-closed gates use the same exact owner scope, and active-trip warnings derive their affected scope from the gate that actually owns the decision.

## Finding 9: truthful Actual-now map availability

- The overlay has explicit loading, ready-current, and unavailable states. Unavailable reasons distinguish offline, historical, owner-locked, missing data, wrong theme, missing epoch, and request failure.
- The Actual-now intent remains selected when current evidence is unavailable, but its control is disabled and the map itself is labeled `Subway reference — current overlay unavailable` or `Subway reference — checking current overlay`.
- A locked, null, malformed-theme, missing-epoch, failed, or historical overlay cannot paint current segment state and cannot put `Actual now` on the map.
- The structural Day reference remains visible with reference styling while the current overlay is checked or unavailable; the rider's viewport, station, and route context are preserved.
- `Center on me` was replaced by the truthful `Reset to NYC overview` control, which resets the map to the documented NYC overview and zoom level rather than implying device location.

## Finding 12: real browser state and recovery acceptance

- Playwright now starts one deterministic Express fixture on `127.0.0.1:4173`. It builds and serves the production client and mounts the production API with controlled catalog, board, graph, map-reference, and overlay inputs.
- Serving the app and API from one origin lets the fixture drop an exact board connection. The real service worker catches that network failure and returns its previously accepted public historical response; no proxy converts the fault into an HTTP 500.
- Control routes can reset fixture state, toggle board transport or overlay availability, and read API request order. They never mutate browser storage, Cache Storage, application state, or UI state.
- The first browser story uses the visible station picker and map controls to populate device-held state. Cache inspection is read-only and proves the shell contains `index.html` plus hashed assets and the structural cache contains catalog, Day map, Night map, and journey graph references.
- The same browser reloads with connectivity disabled, opens Typical weekday, searches Canal St, and plans an untimed structural route with zero journey POSTs.
- A second story keeps `navigator.onLine === true`, drops only the board transport, refreshes through the visible board control, and proves the result is Historical with no Live label.
- A third story starts with Actual selected but unavailable over a structural reference, exercises the reset control, reconnects after the overlay owner becomes ready, and proves the exact owner request sequence: service-change board, two arrival boards, then Day overlay. Only after that sequence does the map become Actual and paint the affected segment.

## RED/GREEN evidence

The round began with focused failing regressions for each ownership boundary:

1. Stage 3 could accept arrival snapshots after an unresolved service-change stage. The dependency regression failed before stage-acceptance validation and passed after stage 2 became a hard prerequisite.
2. Recovery treated active trips as generic train choices and let map meaning drift to Night based on clock time. Exact departure ownership and explicit service meaning tests failed before the context repair and passed afterward.
3. Subset scopes and response-derived acceptance timestamps were accepted. Forged scope, future evidence, post-receipt acceptance, and active-trip response-ownership regressions failed before exact owner scopes and local receipt bounds were introduced and passed afterward.
4. Locked, null, failed, historical, wrong-theme, and missing-epoch overlays could leave the presentation ambiguous. Each unavailable-owner case failed before explicit overlay classification and passed with a visible structural reference and no Actual map label.
5. The browser scenarios were first committed while `/__test/reset` did not exist and failed with `ECONNREFUSED`. They passed only after the deterministic same-origin server and real UI flows were added.

## Verification

- Full Vitest: **50 files, 741 tests passed**.
- TypeScript: `tsc --noEmit` passed with zero diagnostics.
- Production build: **66 modules transformed**; build completed successfully.
- Browser acceptance: **3 Playwright tests passed** in installed Google Chrome against the deterministic validation server.
- Browser coverage: first-visit service-worker control, shell precache, all immutable structural references, UI-owned station persistence, offline reload, local zero-POST planning, online-navigator historical fallback, truthful unavailable Actual intent, reset-to-overview behavior, ordered reconnection owners, and current overlay restoration.
- Diff hygiene: `git diff --check` passed.
- Negative scan: **0** manual `localStorage.setItem`, `Cache.put`, or equivalent storage/cache writes in `tests/e2e`.
- Negative scan: **0** `Center on me` labels in production source. The only retained string is a negative regression assertion proving the control is absent.
- Map-truth regressions explicitly assert unavailable/historical overlays disable Actual, leave features in `reference` state, omit `Actual now` from the map, and show the structural-unavailable label.

## Lowercase commits

| Commit | Subject | Repair area |
|---|---|---|
| `c31ab34` | `withhold arrivals behind service recovery` | stage dependency and fail-closed continuation |
| `a627a2d` | `own current trip recovery context` | exact stored train choice and Day/Night ownership |
| `d134f59` | `bind recovery to exact owner evidence` | exact domain scopes, local time bounds, response-owned active-trip verification |
| `be98fef` | `keep actual map truth explicit` | overlay availability, structural fallback, truthful reset control |
| `b93008b` | `specify real browser recovery` | committed browser RED scenarios |
| `ec08b31` | `exercise real offline recovery` | deterministic same-origin fixture and passing UI-driven E2E |

## Release posture

This remains a governed validation candidate. Demonstration data is visibly disclosed, public exposure gates remain authoritative, historical data never becomes current merely because the navigator is online, and no official MTA map/logo asset or unsupported crowding claim was introduced.
