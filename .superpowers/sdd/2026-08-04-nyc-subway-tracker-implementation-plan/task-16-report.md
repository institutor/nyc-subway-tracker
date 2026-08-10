# Task 16 implementation report

## Outcome

Task 16 is complete on `product-delivery-execution`. Six rider-story browser files plus the offline-PWA regression file prove the validation experience through the real application, API, storage, service-worker, and domain boundaries; a separate ordinary-app production-validation file proves the documented server startup without fixture routes. The normal production import graph contains no fixture entry, scenario switch, test route, arbitrary DOM payload, local-storage control flag, or window-global backdoor.

Explicit `validation` mode uses a bounded server-owned demonstration dataset in the ordinary app and visibly labels it `Demonstration data — not live`. The same dataset cannot appear in live or shadow. Positive accessibility, equipment, and platform-guidance presentation additionally requires a process-local response owner that persistence, tampering, reload, offline transition, or reconnection cannot recreate.

The final verified implementation and test baseline is `9811f59` (`pin reproducible pnpm version`). The required Task 16 milestone remains inspectable at `97b80b1` (`verify complete subway rider experience`), followed by the review-driven safety repairs recorded below.

Gate 0 remains **NO-GO**. All nine public exposure locks remain closed. The final live shadow truthfully accepted 0/8 official sources, created zero claims/comparisons, and exposed zero gates; Task 16 does not convert that external-source failure into a pass.

## Delivered rider stories

- Zero-tap Nearby uses real browser geolocation permission allow/deny flows, last-used and explicit saved precedence, practical-walk cards, walk-unavailable picker fallback, an empty closed-keyboard picker, and protection against a delayed location result replacing an explicit station. Coordinates exist only for the active Nearby request; refresh reacquires a fix and stale callbacks cannot update the rider surface.
- Arrival boards exercise real admission, confidence, fallback, and ordering functions for Live, Scheduled, Expected, and Holding rows. A continuous real-App/API timeline proves first healthy absence removes exact precision without a substitute, bypass veto removes F while preserving E, one clean underlying GTFS-RT snapshot withholds F, and a second chronological source-owned snapshot restores the exact selected train.
- Saved supports save, edit, pause, reset, delete, use, and bulk refresh. Map routing can become a complete device-held active trip; manual cursor movement works forward and backward before and after offline reload, with complete timestamps and historical honesty.
- Reconnection runs the exact five owner stages through the real coordinator. The App-integrated branches cover stage-1 equipment/path, stage-2 exact post-epoch alert/supplement service and transfer owners, stage-3 one-snapshot withholding and exact two-snapshot train restoration, stage-4 required-guidance invalidation, optional-guidance non-invalidation, warning-before-trip/map order, and preservation of cursor, filters, map tuple, focus, reading anchor, and surface.
- Accessible Route Only remains fail-closed in live/shadow. The ordinary validation app provides the canonical direct A15 (125 St) to A34 (Canal St) journey, with exact destination equipment and guidance; an A-to-C transfer alternative does not inherit the direct-trip evidence. Branded current claims are response-bound, while device-held reload/offline context is explicitly historical and unverified.
- Actual-now maps require exact current source-owner receipts at the server, client, and reconnection boundaries. Static GTFS, walking, equipment, stale observations, and wrapper-only timestamps cannot paint a live overlay.
- Commute remains locked in production with zero permission, subscription, evaluation, sender, or delivery calls. Deterministic fixture receipts are derived from real materiality decisions and a seeded eligible subscription, so zero delivery proves the lock rather than an empty store.
- Responsive coverage includes keyboard-only route filtering, direction reversal, refresh, bottom navigation, visible focus, physical bottom-third reach, reduced motion over actual loading states, 200% text, 320-pixel reflow, strict per-element overflow checks, desktop layout, and phone layout.

## Production and fixture boundaries

`src/client/bootstrap.tsx` owns reusable production composition. The ordinary `src/client/main.tsx` imports only that production bootstrap. The dedicated fixture entry and its bounded scenario receipts live under `tests/e2e/fixture-client`; the separate fixture Vite configuration and server expose only fixed enums and server-validated transition/receipt shapes.

The board fixture server derives results through `TrainRecoveryGovernor`, service-change evaluation, arrival confidence, arrival admission, ordering, and schedule fallback. Reconnection transition rows come from real coordinator callbacks and include monotonic sequence, request identity, owner disposition, and acceptance evidence. Accessibility and commute receipts come from the corresponding domain owners, not handwritten outcome DTOs.

Live and shadow defaults remain closed. Explicit validation composition supplies only the fixed canonical demonstration dataset and exact response-owned evidence; ordinary Accessible Route Only trips without that owner derive honest fail-closed scopes from the retained trip even with an empty equipment registry. Stored train recovery binds to the selected departure service date and clock, rejects an unrelated same-route/destination train, withholds one source snapshot, and requires two chronologically advancing exact GTFS-RT observations. Stage 2 similarly requires admitted post-epoch alert and supplement owners before stage 3 can begin.

## Files

- Required E2E stories: `tests/e2e/zero-tap.spec.ts`, `service-change.spec.ts`, `offline.spec.ts`, `accessibility.spec.ts`, `commute.spec.ts`, and `responsive.spec.ts`; supporting deployed-client/PWA regression: `offline-pwa.spec.ts`.
- Ordinary validation E2E: `playwright.production-validation.config.ts` and `tests/e2e/production-validation.spec.ts`.
- Fixture-only composition: `tests/e2e/fixture-client/index.html`, `main.tsx`, `scenario-receipts.ts`, `validation.css`, `fixture-server.ts`, `fixture-vite.config.ts`, `fixture-commute-receipt.ts`, and `helpers.ts`.
- Ordinary validation composition and exact evidence: `src/server/validation/demonstration-dataset.ts`, `src/shared/validation/rider-evidence.ts`, and their focused server/client tests.
- Narrow production seams and rider integration: `src/client/App.tsx`, `bootstrap.tsx`, `main.tsx`, `recovery/app-reconnection-loader.ts`, `components/JourneyPlanner.tsx`, `components/VectorNetworkMap.tsx`, and `styles/global.css`.
- Domain/static truth support: `src/shared/domain/schedule-fallback.ts`, `static-schedule-runtime.ts`, and `src/server/gtfs/static-normalizer.ts`.
- Governing unit fixtures/tests: `tests/client/app-reconnection-loader.test.ts`, `layout-contract.test.ts`, `reconnection-flow.test.tsx`, and `tests/fixtures/accessibility-decisions.ts`.
- Deterministic replay/drill lane: `scripts/truth-validation.ts`, `tests/server/truth-validation.test.ts`, `package.json`, and `docs/testing.md`.
- Public policy integrity: `tests/server/public-gate-matrix.test.ts`, covering all 14 registered route/method operations in live and shadow.

## Normalized RED evidence

Every production behavior change followed a governing failure. Representative exact normalized runs were:

1. Reconnection-owner focus: 14 tests collected, 4 failed and 10 passed before authentic owner callbacks and state preservation were implemented.
2. Production-default accessible ownership: 6 tests, 1 failed and 5 passed because an Accessible Route Only trip with no injected adapter could skip stage 1.
3. Stored-train exact binding: 9 tests, 1 failed and 8 passed because a same-route/destination train at an unrelated departure time could restore the selection.
4. App-integrated adverse reconnection branch: 1/1 failed before the real App used the injected bounded owner adapter.
5. Public board timeline: 1/1 failed before fixture-server state drove the real App/API refresh sequence.
6. Saved-denial precedence: 2 tests, 1 failed and 1 passed before the real denial surface exposed explicit saved selection.
7. Production reflow focus: 2 tests, 1 failed and 1 passed before the SVG label and 200%/320-pixel layout corrections.
8. Final crowding-auditor adversary: 1/1 failed because exact `occupancy`/`capacity`, separator variants, and neutral train-car shells were not rejected; the focused GREEN was 1/1.
9. Final embedded-asset adversary: one suite failed collection with zero tests because the required auditor did not exist; after implementation the focused GREEN was 1/1.
10. Full responsive/privacy run after both auditors: 11 tests, 1 failed and 10 passed because the map still used a computed CSS gradient image. The production map background was reduced to a solid app-owned color; the final run passed 11/11.

Test harness or fixture corrections were not treated as product success. Assertions were changed only when they contradicted governed truth—for example, unavailable production authority remains `Source unavailable` rather than synthetic registry authority.

## Final verification

- Reproducible toolchain: `packageManager` pins `pnpm@10.34.5`; Corepack resolved exactly 10.34.5, and `corepack pnpm install --lockfile-only --frozen-lockfile --offline` accepted the unchanged final lockfile. An earlier dependency-equivalent baseline completed a true isolated 301-package offline install; no dependency or lockfile entry changed afterward.
- `corepack pnpm test --run`: PASS, 78/78 files and 1,260/1,260 tests.
- `corepack pnpm run typecheck`: PASS, zero diagnostics.
- `corepack pnpm run build`: PASS, Vite 7.3.6, 82 modules, CSS 30.18 kB and JavaScript 528.97 kB before gzip.
- Installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, six rider-story files plus `offline-pwa.spec.ts`: PASS, 40/40 in 32.4 seconds.
- Ordinary production-validation E2E: PASS, 2/2 in 5.6 seconds.
- `corepack pnpm run truth:all`: PASS, 7/7 deterministic zero-exposure scenarios; bundle digest `sha256:8a904eaf6cc6f844047e944140f2fd69c8778997058b418aa82a80daaa9d1a5b`.
- `corepack pnpm run shadow:dry-run`: PASS, `DRY_RUN_NO_NETWORK`, 8/8 sources intentionally not run and 9/9 locks closed.
- `corepack pnpm run shadow:live`: exited successfully with truthful `COMPLETED_WITH_SOURCE_FAILURES`; 0/8 accepted, 8/8 failed, zero claims/comparisons, 9/9 locks closed, and a 3,026-byte bounded artifact.
- Diff hygiene: staged and unstaged checks passed; generated `dist`, `.data`, screenshots, shadow receipts, and Playwright results remain ignored.

## Production smoke and visual inspection

The production API and built preview started as separate local processes after the checkout-local `.env` was created from `.env.example`, exactly following the README. Both bootstrap and preview returned HTTP 200. Bootstrap schema was `2026-08-04`, runtime was `validation/demonstration/available`, and all 9 gates reported closed with 0 exposed. The response carried the canonical validation catalog and journey-graph versions. The built HTML contained the root and no fixture route, validation deck, scenario receipt, or notification-materiality receipt. The temporary ignored `.env` was removed and the exact smoke listeners were stopped afterward.

For configuration exactness, a separate no-`.env` diagnostic also started successfully and reported the intended default `live/public` runtime with 9/9 gates still closed and 0 exposed. It is not counted as validation-mode evidence; local demonstration startup requires the documented `.env.example` copy.

The final automated Chrome evidence covers desktop and phone reflow, high-contrast content, reachable bottom controls, reduced motion, 200% text, offline messaging, historical status, populated trip/cursor/map navigation, and the absence of horizontal overflow or console failures. Earlier manual screen inspections supported those assertions but are not presented as a separate final-baseline result.

## Deterministic truth receipts

- Normal weekday: 6/6 fixture-bound checks.
- Weekend planned work: 5/5.
- Late-night midnight: 4/4.
- Major disruption: 5/5.
- Later-stop comparison: 4/4.
- Route-group bulk drop: 10/10 across all seven subway realtime groups.
- False-bypass incident drill: 6/6.

Every receipt has `validationMode: deterministic-zero-exposure`, `artifactStatus: VALIDATION_ONLY`, `gate0Decision: NO-GO`, `riderExposure: false`, `boardsExposed: false`, and nine closed public exposure rows. The replay facts are derived from and cross-bound to the normalized committed fixtures; they are not prewritten scenario claims.

## Privacy, crowding, and protected assets

The populated browser audit covers Nearby, board, Saved v2 with commute scope, complete active-trip v3/cursor, Map, Commute, Settings, Data Status, DOM, attributes, accessibility snapshots, APIs, local/session storage, all three cache names and bodies, service workers, notification receipts and permission, cookies, IndexedDB, and performance resources.

Exact coordinates are permitted only transiently in the Nearby POST body. Exact, rounded, and truncated 4–7 decimal variants are absent from retained state and URLs. Crowding checks reject UI vocabulary, exact/camel/snake/kebab schema keys, placeholders, legends, service/headway proxies, neutral train-car/carriage shells, DOM attributes, classes, IDs, and ARIA labels.

The built client has an exact six-file allowlist: index, manifest, service worker, byte-identical app-owned SVG icon, one CSS asset, and one JavaScript asset. Service-worker core and injected precache lists match that inventory exactly. CSS has no `url(...)`; bundled code has no `data:image`, blob image, external image URL, inline SVG markup, or protected MTA-brand coupling. Runtime contains zero `img`, SVG `image`, `use`, `symbol`, or `foreignObject` elements, exactly one vector SVG with the known app-owned title, and no computed background, mask, list-style, or border image on any visible element.

## Review and release decision

Independent reviews found and drove fixes for production-default stage-1 ownership, missing App-integrated owner branches, false train restoration, narrator-only board/saved proofs, replay/fixture fact binding, populated privacy breadth, exact asset closure, underlying source-snapshot ownership, request-scoped coordinates, stale Nearby callbacks, Actual-map source ownership, empty ordinary validation startup, canonical A15→A34 evidence, live/shadow journey locks, reconnection service owners, persisted-branding self-authentication, and incomplete endpoint coverage. The closure tranche is inspectable at `3a56c47`, `b65bd42`, `9d0f981`, `462b4ed`, `ddac31c`, `6dbe8f9`, `6c6af2a`, `f841e03`, `bb7e8a2`, `5334760`, `4410da7`, and `9811f59`. Every Critical or Important finding received a governing failing regression before correction.

The final independent acceptance re-review is **READY for validation-build completion**, with no Critical or Important findings. Its only Minor was generic Node guidance; the README now states the dependency-compatible Node 22.12 minimum. A separate non-blocking Minor remains: the ordinary production-validation Playwright configuration uses Vite development mode, mitigated by the independent production build, deployed-client browser suite, and built-preview smoke.

This completes the validation build only. Gate 0, capability-specific fixed-version public evidence, rights clearance or a reviewed no-dependency result, release-specific approvals, current-source cohort duration, and binary release records remain absent or Pending. Public boards, live accessibility claims, positioning/guidance, map-rights exposure, commute evaluation, silent monitoring, pilot delivery, and public delivery therefore remain **NO-GO**, with all nine exposure gates false.
