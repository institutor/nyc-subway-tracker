# Task 15 implementation report

## Outcome

Task 15 is implemented on `product-delivery-execution` from base `f6651c12be4aeb91955b361750c2000737373598`. The validation build now has bounded status diagnostics, strict client parsing, reachable Data Status and Settings surfaces, exact device-data reset outcomes, an isolated official-source shadow runner, and fresh-checkout/operator documentation. All nine exposure stages remain immutable and closed. No Task 16 work or controller progress file was changed.

Implementation commit: `284fb8a` (`document and diagnose subway data`). This report is committed separately after the implementation hash exists; its hash is included in the controller handoff because a commit cannot contain its own hash.

## Files

- Status/API: `src/server/routes/status.ts`, `src/server/services/board-service.ts`, `src/client/api/client.ts`, `tests/server/status.test.ts`, `tests/client/status-client.test.ts`, `tests/helpers/client-fixtures.ts`.
- Rider surfaces and reset lifecycle: `src/client/App.tsx`, `src/client/components/AppHeader.tsx`, `src/client/views/DataStatusView.tsx`, `src/client/views/SettingsView.tsx`, `src/client/state/app-state.tsx`, `src/client/storage/active-trip-store.ts`, `src/client/hooks/use-notifications.ts`, `src/client/styles/global.css`, `tests/client/data-status-view.test.tsx`, `tests/client/settings-view.test.tsx`.
- Shadow validation: `scripts/live-shadow.ts`, `src/server/services/shadow-progress.ts`, `tests/server/live-shadow.test.ts`, `tests/server/shadow-progress.test.ts`, `package.json`.
- Operator documentation/configuration: `README.md`, `docs/testing.md`, `docs/data-sources.md`, `.env.example`.

## RED evidence

All implementation began at a normalized governing failure:

1. `npm test -- --run tests/server/status.test.ts` — 1 of 4 tests failed because `data.diagnostics` was absent; the other locked-mode/privacy assertions already normalized.
2. `npm test -- --run tests/client/status-client.test.ts` — 4 of 4 failed because the real `TransitApiClient` did not have a `status()` boundary.
3. `npm test -- --run tests/client/settings-view.test.tsx` — 2 of 2 failed because Settings was not reachable and neither reset action existed.
4. `npm test -- --run tests/client/data-status-view.test.tsx` — 1 of 1 failed because Data Status and its source-age cadence were absent.
5. `npm test -- --run tests/server/live-shadow.test.ts` — 1 of 1 failed because `scripts/live-shadow.ts` did not exist.
6. First post-implementation `npm test -- --run` — 1 of 1,047 tests failed (`tests/client/nearby-view.test.tsx`); adding two destinations to the primary thumb dock violated its exact four-destination layout contract. Data Status and Settings were moved to header utility navigation, restoring the approved bottom dock.
7. `npm test -- --run tests/server/shadow-progress.test.ts` — 1 suite failed before collection (0 tests run) because the governing `shadow-progress` module did not yet exist.
8. `npm test -- --run tests/server/shadow-progress.test.ts tests/server/live-shadow.test.ts; npm run typecheck` — 1 of 4 tests failed because the unchanged-stop fixture reused the same observation time; typecheck passed. The fixture was corrected to represent a genuinely later observation. This was a test-data correction, not a weakening of the comparator.

## GREEN progression

- Status server reached 4/4: exact non-negative source age, sanitized public source/reason ownership, all nine locked gate records, validation-only diagnostics, and no rider/coordinate/permission/secret leakage.
- Strict status client reached 4/4: exact schema, runtime/surface agreement, source-health ownership agreement, paired age/timestamp fields, ordered nine-gate parity, and fail-closed rejection of expansion, fractional age, or an opened gate.
- Settings reached 2/2: event-driven confirmation, broad reset, separate notification reset, retained structural assets, and exact `Deleted` / `Not present` / `Failed` category results.
- Data Status reached 1/1 with rider-readable age cadence, source state language, locked release areas, and no personal diagnostics.
- Shadow dry composition reached 1/1 with eight registry-owned operational sources, nine locked stages, no rider board exposure, and no network dependency.
- Later-stop comparison reached 3/3 and now reports `progressed` only when the later next stop occurs after the earlier next stop in the earlier bounded stop sequence. Changed but unproven stops are `inconclusive`.
- Combined focused Task 15 suite: 5 files, 12/12.
- Focused reset/privacy/status/storage regression selection: 10 files, 103/103.
- Broader relevant privacy/status/storage/API matrix: 15 files, 172/172.

## Full verification

- Starting baseline before changes: 63 files, 1,035/1,035 tests passed.
- Final `npm test -- --run`: 69 files, 1,050/1,050 tests passed.
- Corrected documented focused command, `pnpm test --run tests/server/status.test.ts tests/client/status-client.test.ts tests/client/data-status-view.test.tsx tests/client/settings-view.test.tsx tests/server/live-shadow.test.ts`: 5 files, 12/12 passed.
- An initial documentation smoke used `pnpm test -- --run ...`; pnpm forwarded a literal extra separator, so it ran the full suite (69 files, 1,050/1,050) rather than the intended focus. `docs/testing.md` was corrected to `pnpm test --run ...`, and the corrected command produced the focused 5-file/12-test result above.
- `npm run typecheck`: passed with no diagnostics.
- `npm run build`: passed; 70 modules transformed, client CSS 29.09 kB and JS 416.92 kB before gzip.
- Installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, `npm run test:e2e`: 5/5 passed.
- `pnpm run shadow:dry-run`: passed with `DRY_RUN_NO_NETWORK`, 8 official sources, 9/9 gates closed, no boards exposed.
- `git diff --cached --check`: passed before the implementation commit. The final report-only diff also passes `git diff --check`.
- `.data/shadow` output is confirmed ignored by `.gitignore`; no runtime record is staged.

## Live shadow result

`npm run shadow:live` completed without changing any exposure decision and wrote ignored record `.data/shadow/shadow-2026-08-10T07-24-20.556Z.json`.

- Outcome: `COMPLETED_WITH_SOURCE_FAILURES`.
- Sources: 8 attempted; 8 recorded `failed` with bounded reason `SOURCE_RETRIEVAL_OR_VALIDATION_FAILED`.
- `subway-rt-l` recorded a retrieval timestamp before its later decode/validation failure; the other seven had no accepted retrieval provenance.
- Gates: 9/9 closed; `riderExposure=false`; `boardsExposed=false`.
- Progress: 0 candidates and 0 comparisons because no realtime snapshot was accepted. This is recorded as an external-source/validation limitation, not converted into success and not used to weaken tests.

The runner uses the official source registry, coordinator, source-fetch/atomic-cache path, ignored local storage, bounded safe reason codes, and an optional earlier-record comparison. It never calls board projection and never mutates exposure configuration.

## Visual and React self-review

- Preserved the dark platform-spine tokens and the exact four-action fixed thumb dock. The two secondary surfaces use wrapping header utility navigation so primary rider actions retain bottom-third reach.
- Data Status has one subject-specific visual signature: a compact source-signal strip with age cadence. It does not resemble a generic admin dashboard.
- Source rows collapse to two columns below 25rem, identifiers wrap, utility/actions wrap, and no fixed content width prevents 200% zoom use.
- Existing global keyboard focus remains visible; controls are native buttons; results use polite status regions; confirmation has a labeled group.
- No new animation was added, so reduced-motion behavior is unchanged. The source marker received explicit system colors for forced-colors mode after self-review.
- Components remain module-level. Status loading has one abortable effect with primitive `api`/`connected` dependencies. Reset confirmation/actions are event-driven. No global listener or heavy dependency was added.
- The notification environment and versioned browser stores are memoized. Successful broad deletion advances a store generation so stale in-memory personal records cannot be written back after deletion.

## Privacy and product-contract self-review

- Diagnostics contain only public source ownership/state/reason/age, public provenance already approved by the existing DTO boundary, explanations, alerts, and immutable gate records.
- Tests forge coordinates, saved labels, active-trip/cursor data, notification data, private-looking source details, and secrets behind the server snapshot; serialized status is verified not to expose them.
- Shadow records contain bounded official source IDs, operational train/source evidence, safe outcome codes, and locked gates; they contain no rider coordinates, labels, saved records, permission state, subscription endpoint/token/key, cursor, active-trip details, or secret.
- Broad reset deletes the versioned saved/commute-intent store, last-station/covered settings, current and legacy active-trip/cursor stores, and notification subscription. It deliberately retains official/structural offline assets.
- Separate notification deletion is available. Copy truthfully states that OS location/notification permissions and Accessible Route Only are not changed.
- Live/shadow status remains `data: null`; validation diagnostics cannot open or fabricate boards, maps, accessibility, guidance, or commute operation. No new release gate, protected logo/map asset, or prohibited rider-data surface was introduced.

## Concerns

The external live-source attempt accepted no complete operational snapshot, so real later-stop comparison could not be exercised in this environment. The isolated comparator and dry composition are governed by deterministic tests, but a future operator should rerun `pnpm run shadow:live` when official endpoints return valid content and use `--compare` against an earlier accepted record. All rider exposure remains locked in the meantime.
