# NYC Subway Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a tested, installable subway-first validation candidate whose live pipeline, rider experience, offline journeys, accessibility evaluation, and commute decisions work end to end while public surfaces remain locked until their governed evidence and approvals pass.

**Architecture:** A responsive progressive web client consumes one coherent JSON service. The service retrieves and validates official transit sources, while a shared deterministic domain layer owns all truth, time, ranking, routing, and notification decisions. Static and last-good operational caches are atomic and local; rider preferences stay browser-local except for optional notification subscriptions.

**Tech Stack:** TypeScript, React, Vite, Express, GTFS-Realtime bindings, ZIP/CSV parsing, Zod, Vitest, Testing Library, Playwright, and Web Push.

## Global constraints

- Work only in `C:\Users\JiewenHuang\Downloads\Train time\.worktrees\product-delivery-execution`.
- Use test-driven development: write a focused failing test, run it and observe the expected failure, implement the smallest coherent behavior, then rerun.
- Preserve all approved product-contract thresholds, inclusivity rules, copy, and fail-closed boundaries.
- Treat the July 30 approved specification as controlling. Detailed Draft/Pending artifacts supply implementation constraints and acceptance definitions but are not mislabeled as approved current guidance.
- Use official sources by default. Synthetic fixtures are test inputs or an unmistakably labeled demonstration mode, never silent production truth.
- Do not store or log rider coordinates.
- Do not ship an MTA logo or copied MTA map. Omit subway crowding completely: no field, type, module, shell, badge, legend, unavailable placeholder, diagram, or proxy. Omit positioning without an exact eligible record. Never fabricate elevator availability or “good service.”
- Enforce independent stage locks for public arrivals, Nearby/offline, accessibility/equipment, guidance, map rights, and commute evaluation/delivery. Tests or autonomous build authorization never open a lock.
- Keep all commit subjects lowercase and commit after each coherent task.
- Do not weaken tests to make an implementation pass.

---

## Task 1: Establish the runnable application and quality harness

**Files:**

- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/shared/index.ts`
- Create: `src/server/app.ts`
- Create: `src/server/index.ts`
- Create: `src/client/index.html`
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Test: `tests/smoke/app.test.tsx`

1. Add a failing component smoke test that expects the product name, **Unofficial**, and a main landmark.
2. Run `pnpm vitest run tests/smoke/app.test.tsx` and confirm failure because the shell does not exist.
3. Add the package scripts, dependency manifest, strict TypeScript configuration, client entry, Express entry, Vite proxy, and minimal semantic shell.
4. Install dependencies with `pnpm install` and retain the generated lockfile.
5. Run `pnpm vitest run tests/smoke/app.test.tsx`, `pnpm typecheck`, and `pnpm build`.
6. Commit with `establish runnable subway app`.

## Task 2: Define shared decision types, clock, and canonical ordering

**Files:**

- Create: `src/shared/domain/types.ts`
- Create: `src/shared/domain/clock.ts`
- Create: `src/shared/domain/canonical.ts`
- Create: `src/shared/domain/route-colors.ts`
- Test: `tests/domain/clock.test.ts`
- Test: `tests/domain/canonical.test.ts`

1. Write failing tests for New York service-date chronology, times beyond 24:00, DST-safe instant comparison, Unicode NFC plus unsigned UTF-8 canonical comparison, prefix behavior, and shuffled-input stability.
2. Run both tests and confirm the missing-module failures.
3. Implement explicit source, feed-health, board, arrival, direction, station, entrance, alert, accessibility, guidance, journey, active-trip, saved-record, commute-window, exposure-stage, and provenance types. Define no subway-crowding type or response field.
4. Implement an injectable clock, New York time helpers, canonical identity normalization, and route-color/contrast metadata with text route identity.
5. Run `pnpm vitest run tests/domain/clock.test.ts tests/domain/canonical.test.ts` and `pnpm typecheck`.
6. Commit with `define deterministic transit domain`.

## Task 3: Add safe atomic cache and source registry

**Files:**

- Create: `src/server/config.ts`
- Create: `src/server/data/source-registry.ts`
- Create: `src/server/data/atomic-cache.ts`
- Create: `src/server/data/fetch-source.ts`
- Create: `src/server/release/exposure-gates.ts`
- Test: `tests/server/atomic-cache.test.ts`
- Test: `tests/server/fetch-source.test.ts`
- Test: `tests/server/exposure-gates.test.ts`

1. Write failing tests for atomic promotion, last-good preservation, response timeout, content-type and size limits, redirect limits, truncated content, and source provenance.
2. Implement a configurable source registry for regular GTFS, supplemented GTFS, all subway real-time groups, subway alerts, the official entrances dataset `i9wp-a4ja`, structural station accessibility, optional equipment/outage feeds, an audited practical-walk adapter, immutable app-owned complete-path packages, and immutable guidance packages.
3. Implement bounded retrieval and atomic cache writes through a same-directory temporary file and rename.
4. Ensure `.data` and secrets are ignored; keep fixtures versioned under `tests/fixtures`.
5. Implement fail-closed stage locks whose default release state matches the current NO-GO records; fixtures and non-public shadow diagnostics require explicit validation mode and never alter public state.
6. Run the focused tests and `pnpm typecheck`.
7. Commit with `protect transit source caches`.

## Task 4: Ingest regular and supplemented GTFS

**Files:**

- Create: `src/server/gtfs/zip-validator.ts`
- Create: `src/server/gtfs/csv-reader.ts`
- Create: `src/server/gtfs/static-loader.ts`
- Create: `src/server/gtfs/static-normalizer.ts`
- Create: `src/server/gtfs/entrance-loader.ts`
- Create: `src/shared/domain/schedule-owner.ts`
- Create: `tests/fixtures/gtfs/regular.zip`
- Create: `tests/fixtures/gtfs/supplemented.zip`
- Test: `tests/server/static-loader.test.ts`
- Test: `tests/domain/schedule-owner.test.ts`

1. Build tiny deterministic GTFS ZIP and entrance fixtures that cover parent complexes, exact entrances, entry permission, directional stops, transfers, shapes, service exceptions, after-midnight trips, supplement overlap, and an omitted regular trip/stop.
2. Write failing tests for ZIP traversal and expansion rejection, required-table validation, exact entrance-to-complex/constituent/GTFS-stop joins, service-day activation, canonical edition identity, accepted/absent/future/regressed publication chronology, exact 0/2/24-hour boundaries and first instants beyond them, unchanged-content retrieval, wrapper-only change, failed new edition, overlapping and non-overlapping supersession, no rollback, supplemented ownership independent of occurrence presence, and regular exclusion inside a usable mask.
3. Implement streaming or bounded parsing, normalized immutable editions, monotonic overlap supersession, and truthful publication/first-retrieval plus last-retrieval ages.
4. Produce compact station/entrance catalog, service pattern, structural transfer graph, and shape records suitable for API and offline caching. Do not treat GTFS transfers as practical street-walk or accessible-path evidence.
5. Run the focused tests and the domain suite.
6. Commit with `ingest subway schedule editions`.

## Task 5: Ingest subway real-time feeds and alerts

**Files:**

- Create: `src/server/gtfs/realtime-loader.ts`
- Create: `src/server/gtfs/realtime-normalizer.ts`
- Create: `src/server/gtfs/alert-loader.ts`
- Create: `src/server/services/source-coordinator.ts`
- Create: `tests/fixtures/realtime/current.pb`
- Create: `tests/fixtures/realtime/holding.pb`
- Create: `tests/fixtures/alerts/subway-alerts.json`
- Test: `tests/server/realtime-loader.test.ts`
- Test: `tests/server/alert-loader.test.ts`

1. Write failing tests for complete snapshot decoding, future ordered stop calls, vehicle movement timestamp joins, feed-header chronology, group isolation, malformed payload rejection, plain-text alert extraction, active intervals, and exact route/stop/direction scope.
2. Implement the official subway feed-group registry and independent 30-second refresh loops with abortable retrieval.
3. Normalize trip updates, vehicle progress, train-specific delay alerts, and system alerts while preserving raw provenance and official text.
4. Store one last coherent snapshot per group and one accepted alert snapshot.
5. Run focused tests and `pnpm typecheck`.
6. Commit with `ingest live subway evidence`.

## Task 6: Implement feed health, anomaly handling, and recovery

**Files:**

- Create: `src/shared/domain/feed-health.ts`
- Create: `src/shared/domain/snapshot-anomaly.ts`
- Create: `src/shared/domain/recovery.ts`
- Test: `tests/domain/feed-health.test.ts`
- Test: `tests/domain/recovery.test.ts`

1. Write failing boundary tests for exactly 90, 91, 180, and 181 seconds; exact 40% population loss; suspicious 39.x% contextual loss; suspicious emptiness; simultaneous group loss; timestamp regression; malformed and destructive snapshots; independent route groups; frozen degraded context; anomaly preservation versus age-based fallback; no-prior-context fallback; first healthy entity absence; second countable absence; exactly 59/60 seconds; anomalous intervening update; target removal; one/two stop-order regressions; and two consecutive coherent recovery snapshots.
2. Implement Current, Degraded, and Unavailable decisions with feed age separate from train movement age.
3. Implement anomaly quarantine and last-good preservation without converting absence into cancellation or good service. One absent train never triggers fallback or static replacement.
4. Remove public precision on first healthy absence; hard-suppress on the earlier of second countable absence or exactly 60 seconds. Require two newer consecutive coherent updates proving all five conditions before Live readmission; update one restores nothing, a broken pair resets, and recovery never restores Expected.
5. Run focused tests and the complete domain suite.
6. Commit with `govern subway feed health`.

## Task 7: Implement arrival admission, ghost states, and deterministic boards

**Files:**

- Create: `src/shared/domain/train-identity.ts`
- Create: `src/shared/domain/arrival-admission.ts`
- Create: `src/shared/domain/arrival-confidence.ts`
- Create: `src/shared/domain/arrival-order.ts`
- Create: `src/shared/domain/schedule-fallback.ts`
- Test: `tests/domain/arrival-admission.test.ts`
- Test: `tests/domain/arrival-confidence.test.ts`
- Test: `tests/domain/schedule-fallback.test.ts`

1. Write failing tests for exact future directional-stop admission, wrong direction/destination, missing stop, ambiguous identity, distinct same-time trains, source-order shuffles, Expected range centers and bounds, direct Live/Expected overlap, non-overlap, maximal contiguous overlap, chain-only overlap, earlier-Live barrier, cap only after the one-pass promotion, separate Holding/Uncertain rows, Due through exactly 60 seconds, movement through exactly 90/180 seconds, and unusual dwell without deletion.
2. Write failing fallback tests for exact-group Unavailable entry, Scheduled clock-time treatment, current veto preservation, supplemented-mask omission, regular eligibility only outside a usable mask, partial and empty boards, and per-direction three-row caps.
3. Implement the fixed gate order, canonical train/stop-call identity, confidence transitions, initial total order (estimate, lower bound, upper bound, public route order, destination, stable train identity), the exact narrow Live-overlap pass, and only then the cutoff.
4. Ensure only Live and Expected consume primary slots; Holding and Uncertain stay secondary and never advance an exact countdown.
5. Run focused tests and all domain tests.
6. Commit with `admit trustworthy subway arrivals`.

## Task 8: Resolve service changes before display

**Files:**

- Create: `src/shared/domain/alert-scope.ts`
- Create: `src/shared/domain/service-impact.ts`
- Create: `src/shared/domain/reroute.ts`
- Test: `tests/domain/service-impact.test.ts`
- Test: `tests/domain/reroute.test.ts`

1. Write failing tests for skipped stops, local-to-express bypass, station closure, partial suspension, route-on-route reroute, generic Affected without inferred bypass, early/future alerts, stale alert context, and exact unaffected scope preservation.
2. Implement structured scope resolution with preserved official plain text.
3. Apply hard negative evidence before positive live admission. Treat an unresolved material reroute as a narrow veto and a delay-only alert as context, not stop suppression.
4. Prove a rerouted train appears at a station only when its current ordered remaining-stop sequence explicitly contains that directional stop and no stronger veto remains.
5. Run focused tests and the full domain suite.
6. Commit with `veto bypassed subway stops`.

## Task 9: Build station ranking, routing, saved state, and offline graph

**Files:**

- Create: `src/shared/domain/geo.ts`
- Create: `src/server/walk/practical-walk-adapter.ts`
- Create: `src/shared/domain/station-ranking.ts`
- Create: `src/shared/domain/journey-router.ts`
- Create: `src/shared/domain/saved-ranking.ts`
- Create: `src/client/storage/browser-store.ts`
- Create: `src/client/storage/migrations.ts`
- Test: `tests/domain/station-ranking.test.ts`
- Test: `tests/server/practical-walk-adapter.test.ts`
- Test: `tests/domain/journey-router.test.ts`
- Test: `tests/domain/saved-ranking.test.ts`
- Test: `tests/client/browser-store.test.ts`

1. Write failing tests for coordinate validation, exact entrance joins, entry/closure/current-service exclusion, supported practical-walk comparisons and overlapping precision ties, stable neutral entrance/complex identity order, at-most-three membership, approximate-location parity only when evidence supports it, no coordinate retention, and mandatory station-picker output when walk evidence is missing or incomparable. Prove straight-line and centroid values never rank candidates.
2. Write failing routing tests for direct rides, transfers, exact direction/destination, online current-pattern constraints, future schedule currency, offline **Reference itinerary**, no path, Accessible Route Only failure when a complete verified chain is absent, the exact validity/accessibility/risk/transfers/practical-walk/arrival ranking sequence, and neutral canonical identity only after a full rider-relevant tie.
3. Write SAVE-O01 tests with shuffled saved-record retrieval that always yield B, C, A and never promote D.
4. Implement the bounded audited practical-walk adapter, network graph, deterministic journey search and ranking order (validity, accessibility, risk, transfers, practical walking, arrival), nearest-useful ranking, picker fallback, saved promotion cohort, versioned browser storage, and migrations.
5. Run focused tests and the domain/client suites.
6. Commit with `rank nearby and offline journeys`.

## Task 10: Expose coherent versioned APIs

**Files:**

- Create: `src/server/services/catalog-service.ts`
- Create: `src/server/services/board-service.ts`
- Create: `src/server/services/map-service.ts`
- Create: `src/server/routes/bootstrap.ts`
- Create: `src/server/routes/stations.ts`
- Create: `src/server/routes/boards.ts`
- Create: `src/server/routes/maps.ts`
- Create: `src/server/routes/journeys.ts`
- Create: `src/server/routes/status.ts`
- Modify: `src/server/app.ts`
- Test: `tests/server/api.test.ts`

1. Write failing endpoint tests for bootstrap, station search, practical-walk-backed Nearby, mandatory picker response without walk evidence, complete board response, scoped filters, service status, vector map data, online/offline-reference journey data, input limits, no personal-data logging, absent crowding fields, and each locked exposure stage. Prove active-trip state and cursor mutations have no server endpoint.
2. Implement one immutable decision snapshot per response, stable response identity, source provenance, explicit board mode, primary and secondary train areas, alerts, journey data, governed capability states, exposure decision, and server time.
3. Serve deterministic demonstration responses only in explicitly selected validation mode, with the label on every operational response. Network failure never activates demo. Live shadow results remain non-public while locked.
4. Add HTTP cache validators only for immutable/static content; keep current boards no-store.
5. Run focused API tests, type analysis, and production server smoke.
6. Commit with `serve coherent subway boards`.

## Task 11: Build the dark-first zero-tap rider interface

**Files:**

- Create: `src/client/styles/tokens.css`
- Create: `src/client/styles/global.css`
- Create: `src/client/api/client.ts`
- Create: `src/client/state/app-state.tsx`
- Create: `src/client/hooks/use-location.ts`
- Create: `src/client/hooks/use-board-clock.ts`
- Create: `src/client/components/AppHeader.tsx`
- Create: `src/client/components/StatusBanner.tsx`
- Create: `src/client/components/RouteToken.tsx`
- Create: `src/client/components/ArrivalRow.tsx`
- Create: `src/client/components/DirectionTrack.tsx`
- Create: `src/client/components/StationCard.tsx`
- Create: `src/client/components/ThumbDock.tsx`
- Create: `src/client/views/NearbyView.tsx`
- Create: `src/client/views/StationView.tsx`
- Modify: `src/client/App.tsx`
- Test: `tests/client/nearby-view.test.tsx`
- Test: `tests/client/station-view.test.tsx`

1. Write failing component tests for cached-shell first render; the exact pre-prompt purpose sentence; location allow with supported practical walks; precise/approximate parity; denial precedence of last-used, then visible saved choices requiring selection, then closed-keyboard picker; temporary fix failure with exact **Location unavailable. Showing your last station.**, **Try location again**, and **Choose a station**; no later silent replacement of explicit selection; three cards only from eligible ranking; both directions; governed Live/Expected order; separate Holding context; source labels; route text identity; refresh preservation; and bottom navigation.
2. Implement the platform-spine visual system, high-contrast typography, published route-color accents with redundant labels, responsive layout, skeletons that preserve structure, and the bottom-third thumb dock.
3. Keep countdowns derived from response freshness and stop them at governed boundaries.
4. Ensure keyboard order, visible focus, semantic headings and landmarks, reduced motion, and 200% zoom behavior.
5. Run component tests, `pnpm typecheck`, and `pnpm build`.
6. Commit with `build zero tap subway boards`.

## Task 12: Add saved stations, search, journey map, and offline continuity

**Files:**

- Create: `src/client/views/SavedView.tsx`
- Create: `src/client/views/MapView.tsx`
- Create: `src/client/components/StationSearch.tsx`
- Create: `src/client/components/JourneyPlanner.tsx`
- Create: `src/client/components/ActiveTripCard.tsx`
- Create: `src/client/components/VectorNetworkMap.tsx`
- Create: `src/client/components/OfflineBanner.tsx`
- Create: `src/client/hooks/use-connectivity.ts`
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/icons/app-icon.svg`
- Test: `tests/client/saved-view.test.tsx`
- Test: `tests/client/map-view.test.tsx`
- Test: `tests/client/offline-state.test.tsx`

1. Write failing tests for the exact saved-intent schema and prohibited operational fields; immediate open without mutation; refresh of every route/direction; filtered-route disruption visibility; explicit edit/save only; pause/reset/delete scope; deterministic preference rendering; station search; direct and transfer journeys; Day/Night reference labels; loss of Actual-now preserving context without automatic reference switch; explicit Typical weekday/Late night selection; offline **Reference itinerary** routing; explicit capture of exactly one active trip before descent; every required core card field; claim-scoped timestamps; conditional-module omission; **I'm at this stop** forward/back correction; no evidence mutation; historical board treatment; preserved context; and ordered reconnection.
2. Implement Saved and Map surfaces, station/destination search, network SVG rendering, explicit map-mode selection, ranked journey details, explicit active-trip capture, complete offline card, and manual rider-confirmed progress without location inference.
3. Implement service-worker precache/runtime policies and explicit cache-version migration.
4. Make the app installable and ensure offline entry never claims current operations or accessibility.
5. Run client tests, production build, and a browser offline smoke.
6. Commit with `keep subway journeys useful offline`.

## Task 13: Add fail-closed accessibility, equipment status, and guidance

**Files:**

- Create: `src/server/accessibility/station-accessibility-loader.ts`
- Create: `src/server/accessibility/path-evidence-loader.ts`
- Create: `src/shared/domain/accessible-path.ts`
- Create: `src/shared/domain/equipment-status.ts`
- Create: `src/shared/domain/platform-guidance.ts`
- Create: `src/shared/data/platform-guidance.json`
- Create: `src/client/components/AccessibilityPanel.tsx`
- Create: `src/client/components/PlatformGuidance.tsx`
- Test: `tests/domain/accessible-path.test.ts`
- Test: `tests/domain/platform-guidance.test.ts`
- Test: `tests/client/accessibility-panel.test.tsx`

1. Write failing tests for station-level versus directional accessibility; the complete 26-field atomic coverage row; every ordered path edge and seven evidence fields; exact endpoints, levels, route/direction/platform, equipment identities, official-path membership, restrictions, verification and review; empty production registry; equipment health at exactly 5 minutes, first instant above 5, exactly 15, and first instant above 15; invalid chronology/join; provisional empty and second zero snapshot at less than/exactly one minute; healthy non-empty target absence; strict greater-than-50% disappearance and greater-than-10% bad-record anomalies plus contextual boundary cases; daily inventory review and exact seven-day cutoff; explicit restoration; one/two omissions at the one-minute boundary; broken restoration sequence; freshness copy; stale/missing outage feed; duplicate canonical path identity; canonical tie ordering; rerouted platform; and independent alternate paths.
2. Write failing guidance tests for exact immutable coverage row, scope/orientation/objective match, outdated/wrong-platform/rerouted records, and complete visible/assistive omission when unavailable. Keep production guidance empty unless a reviewed record with provenance is supplied.
3. Implement app-owned immutable path-package ingestion separate from GTFS station notes; optional official equipment/outage ingestion; exact equipment health, population, provisional-empty, inventory, restoration, and freshness decisions; structural reference state; fail-closed Accessible Route Only; exact rider warnings; and separate accessibility/guidance exposure locks.
4. Add negative schema, API, component, and end-to-end assertions proving no crowding field or surface exists anywhere.
5. Run focused tests and the full client/domain suites.
6. Commit with `add honest subway accessibility tools`.

## Task 14: Add commute windows and material notifications

**Files:**

- Create: `src/shared/domain/commute-window.ts`
- Create: `src/shared/domain/notification-decision.ts`
- Create: `src/server/notifications/vapid-store.ts`
- Create: `src/server/notifications/subscription-store.ts`
- Create: `src/server/notifications/commute-monitor.ts`
- Create: `src/server/routes/notifications.ts`
- Create: `src/client/views/CommuteView.tsx`
- Create: `src/client/hooks/use-notifications.ts`
- Modify: `public/sw.js`
- Test: `tests/domain/notification-decision.test.ts`
- Test: `tests/server/commute-monitor.test.ts`
- Test: `tests/client/commute-view.test.tsx`

1. Write failing tests for half-open windows, weekday and overnight dates, DST, exact route/direction/segment relevance, new episode dedupe, correction-only suppression, canonical action stability under shuffled inputs, material escalation, permission denial, reconnect no-replay, and unsupported background delivery copy.
2. Implement local VAPID key persistence, bounded subscription storage, Web Push mechanics, service-worker handling, and a scheduler that evaluates only saved explicit transit scope, all behind separate disabled/test/silent/pilot/delivery stages.
3. Keep every non-test commute stage disabled by default. A locked stage cannot silently evaluate, subscribe, deliver, or advance. When an authorized stage is configured, provide truthful foreground/background capability messaging without guaranteeing browser execution.
4. Do not send routine all-clear messages or infer home/work from station labels.
5. Run focused tests and all suites.
6. Commit with `notify only for commute disruptions`.

## Task 15: Complete diagnostics, exposure records, and live shadowing

**Files:**

- Create: `src/client/views/SettingsView.tsx`
- Create: `src/client/views/DataStatusView.tsx`
- Create: `scripts/live-shadow.ts`
- Create: `README.md`
- Create: `docs/testing.md`
- Create: `docs/data-sources.md`
- Modify: `.env.example`
- Test: `tests/server/status.test.ts`

1. Write failing tests for source-age visibility, truthful gate status, locked-surface omission, data reset, notification reset, and absence of coordinates or secrets from diagnostics.
2. Implement Data Status and Settings surfaces, source freshness/reason codes, immutable gate/evidence status, local-data deletion, and clear demonstration/shadow/public distinctions.
3. Add an opt-in live-shadow command that validates official sources, records complete decision provenance, and supports later-stop-progress comparison without making normal tests network-dependent or exposing public boards.
4. Document install, development, production start, test, optional elevator credentials, notification behavior, offline behavior, and known source limitations.
5. Run focused tests, live shadow where network is available, type analysis, and production build.
6. Commit with `document and diagnose subway data`.

## Task 16: Verify the complete rider story

**Files:**

- Create: `tests/e2e/zero-tap.spec.ts`
- Create: `tests/e2e/service-change.spec.ts`
- Create: `tests/e2e/offline.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/commute.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`

1. Write end-to-end tests for exact location allow/deny precedence, practical-walk cards and picker fallback, validation-mode Live and Scheduled boards, bypass suppression, Expected/Live overlap order, first-absence precision loss, Holding behavior, saved controls, map routing, complete active trip and manual progress, offline reload, synthetic-accessibility and empty-live-registry states, locked commute stages, and notification materiality decisions. Prove crowding is absent.
2. Add mobile viewports, keyboard-only operation, reduced motion, 200% text zoom, 320-pixel reflow, and no-horizontal-scroll checks.
3. Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm playwright test` from a clean app start.
4. Start the production app, verify that locked public surfaces remain omitted, inspect representative validation-mode phone and desktop screens, exercise offline mode, and record exact results in `docs/testing.md`.
5. Run representative normal/weekend/late-night/disruption replays, live shadowing, later-stop-progress comparison, route-group bulk-drop validation, and a false-bypass incident drill. Record evidence without declaring Gate 0 passed unless its exact fixed-package exit record is complete.
6. Run an independent code review against the implementation design, approved July 30 specification, and governed Draft/Pending constraints; fix every blocking or high-severity finding with a new failing regression test.
7. Rerun every verification command after final fixes.
8. Commit with `verify complete subway rider experience`.

## Completion gate

Do not call the product complete until all of the following are true:

- dependency installation is reproducible from the lockfile;
- unit, integration, component, and browser tests pass;
- strict type analysis and production build pass;
- the production server starts and serves the app;
- live shadow either passes or records an external-source failure without weakening normal deterministic tests or opening public boards;
- location denial, practical-walk picker fallback, feed degradation, offline reload, service-change veto, and accessibility Unknown paths are visibly honest;
- the complete DOM, accessibility tree, API schema, notifications, maps, trip cards, and saved data contain no crowding shell, field, placeholder, proxy, or legend;
- no protected map/logo asset or personal coordinate is shipped or retained;
- README testing instructions work from a fresh checkout;
- all implementation commits use lowercase subjects.

These conditions complete the validation build only. Public release additionally requires Gate 0, every capability-specific fixed-version evidence package, applicable rights clearance or reviewed no-dependency result, mandatory same-version reviewer approvals, and the binary release records. Any Pending or absent condition remains NO-GO and keeps its exposure lock closed.
