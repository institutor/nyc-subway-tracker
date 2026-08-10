# Testing

Install dependencies first with `pnpm install --frozen-lockfile`.

The API command loads `.env` from its current checkout. A production-like client preview does not start the API: after building, run `pnpm run server` and `pnpm run preview` in two separate terminals.

## Required checks

```sh
pnpm test --run
pnpm run typecheck
pnpm run build
pnpm run test:e2e
pnpm run test:e2e:production-validation
```

The browser suites use Playwright. To use an installed Chrome/Chromium binary instead of a downloaded browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its absolute path before either Playwright command. The regular suite builds and serves the deployed client through its closed fixture boundary. The production-validation suite exercises the ordinary app and API in validation mode through Vite's development server; the production build and built-preview smoke remain separate checks.

## Focused diagnostics checks

```sh
pnpm test --run tests/server/status.test.ts tests/client/status-client.test.ts tests/client/data-status-view.test.tsx tests/client/settings-view.test.tsx tests/client/notification-environment.test.ts tests/server/live-shadow.test.ts tests/server/shadow-validation.test.ts tests/server/shadow-progress.test.ts tests/server/shadow-record.test.ts
pnpm run shadow:dry-run
```

Normal tests and the dry-run never require network access. The live shadow is separate:

```sh
pnpm run shadow:live
```

An external-source, DNS, network, content-type, decoding, or validation failure is a valid recorded shadow outcome. It must not be converted into a passing source result or a weaker test. Shadow artifacts are written below `.data/shadow` and remain ignored by git.

To compare a later live run with one earlier shadow record:

```sh
pnpm exec tsx scripts/live-shadow.ts --live --compare .data/shadow/shadow-PRIOR.json
```

The earlier file must be an exact bounded `shadow-v2` record. The command hashes the exact file bytes, binds the earlier and later record/claim identities, verifies every compact admitted-claim proof (including exact vehicle stop-call ownership, issued service-context commitment, canonical service instance, and strictly later observation), recomputes the full deterministic comparison partition and final-size loop, and rejects a malformed, fabricated, zero/over-15-minute, unbound, shuffled, or falsely truncated comparison. A missing `--compare` value fails without writing a final artifact. Comparison includes admitted and suppressed claims, records the disposition transition, and can report progressed, not observed, or inconclusive. Deterministic truncation keeps the artifact within 1,000,000 bytes and records exact considered, included, and omitted counts. It never opens a rider surface or release gate.

## Deterministic truth replays and drills

The committed validation fixtures support seven bounded, network-free truth checks. Run all of them with:

```sh
pnpm run truth:all
```

Run one risk cohort or drill at a time with:

```sh
pnpm run truth:replay:weekday
pnpm run truth:replay:weekend
pnpm run truth:replay:late-night
pnpm run truth:replay:disruption
pnpm run truth:compare:later-stop
pnpm run truth:validate:bulk-drop
pnpm run truth:drill:false-bypass
```

Each command exercises the same loaders, source coordinator, feed governor, service-change evaluator, arrival admission gate, reroute resolver, or bound shadow-progress comparator used by the validation product. It does not print a prewritten result. A missing fixture, invalid command, failed evidence join, failed check, or oversized receipt exits nonzero. Execution failures emit only a small generic failure receipt; they do not leak a local path or preserve a partial passing artifact.

Every successful command writes one JSON receipt to standard output. The receipt is deterministic for the fixed fixtures, at most 32,768 bytes, contains evidence digests rather than source text or coordinates, and includes all of these immutable safety fields:

- `validationMode: "deterministic-zero-exposure"`
- `artifactStatus: "VALIDATION_ONLY"`
- `gate0Decision: "NO-GO"`
- `riderExposure: false`
- `boardsExposed: false`
- all nine public exposure stages with `exposed: false`

The scenario-specific passing evidence is:

| Command | What the receipt proves for the fixture only |
|---|---|
| `truth:replay:weekday` | The real static, realtime, and alert fixture sources normalize through the coordinator; the route, trip, train, direction, stop, destination, service date, event time, and provenance in the admitted claim are derived from that normalized evidence. |
| `truth:replay:weekend` | Exact Saturday regular and supplemented F patterns normalize through the static loader, the supplement owns the matching scope, and the normalized planned-work alert suppresses the regular-only stop so its governed board is empty. |
| `truth:replay:late-night` | `25:10:30` remains bound to its operating service date across midnight, while realtime train identity retains the source service date. |
| `truth:replay:disruption` | A realtime claim and normalized full-suspension alert are joined on their derived route, stop, and direction identities; the alert suppresses the arrival and all dependent Live, Expected, Holding, Scheduled fallback, countdown, and guidance products. |
| `truth:compare:later-stop` | An exact earlier record and strictly later record bind within two minutes; the real comparator records `NEXT_STOP_ADVANCED` and the disposition transition. |
| `truth:validate:bulk-drop` | Every one of the seven required subway realtime groups independently quarantines an exact 40% entity loss while unrelated groups remain Current. |
| `truth:drill:false-bypass` | The same normalized realtime claim is reconstructed across the original and incident snapshots; a newly normalized exact-scope veto contains that fixture-bound claim and every dependent product while the incident path remains zero-exposure and open for governed review. |

`PASS` means only that the deterministic command behaved as specified against its committed fixture. These receipts are useful Task 16 implementation evidence, but they are not the preregistered, fixed-version cohort census, current-MTA shadow duration, reviewer decisions, source revalidation, or binary exit record required by Gate 0. They do not close a false-bypass incident and must not be described as zero incidents.

## Live-shadow failure semantics

`pnpm run shadow:live` is intentionally separate from deterministic replay. If one or more official sources cannot be retrieved or accepted, the bounded artifact records `COMPLETED_WITH_SOURCE_FAILURES` and source rows use `SOURCE_RETRIEVAL_OR_VALIDATION_FAILED`; that is an honest external-source outcome, not a source pass. If the invocation itself cannot produce a valid bounded artifact, the command exits nonzero and reports that no rider surface or release gate changed. Neither outcome weakens deterministic tests, substitutes static schedule claims for missing live evidence, or opens public boards.

A successful current fetch also remains shadow-only. Gate 0 stays **NO-GO** until its exact fixed-package evidence, required independent reviews, and binary exit record are complete.

## Task 16 final validation record — 2026-08-10

This record covers package `nyc-subway-tracker@0.1.0` at verified implementation and test baseline `9811f59`. The baseline includes the final product repairs, the exhaustive public-route policy matrix, and the exact package-manager pin.

### Reproducible dependency installation

`package.json` pins `pnpm@10.34.5`; `corepack pnpm --version` resolved exactly `10.34.5`. At the final baseline, `corepack pnpm install --lockfile-only --frozen-lockfile --offline` accepted the unchanged lockfile without touching installed dependencies.

An earlier dependency-equivalent baseline also completed a true isolated offline install: a temporary project and isolated store used only the checkout manifests, hydrated 301 frozen packages, then ran `pnpm install --frozen-lockfile --offline`. The first attempt against the machine's incomplete pre-existing store failed honestly because `express-5.2.1.tgz` was absent; it was not reported as a pass. No dependency declaration or lockfile entry changed between that proof and `9811f59`.

### Clean verification results

| Check | Exact result |
|---|---|
| `corepack pnpm test --run` | PASS — 78 files, 1,260 tests |
| `corepack pnpm run typecheck` | PASS — zero TypeScript errors |
| `corepack pnpm run build` | PASS — Vite 7.3.6, 82 modules; client JavaScript 528.97 kB and CSS 30.18 kB before gzip |
| Installed-Chrome regular E2E run | PASS — 40/40 tests in 32.4 seconds, using `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Installed-Chrome production-validation E2E | PASS — 2/2 tests in 5.6 seconds |
| `corepack pnpm run truth:all` | PASS — 7/7 zero-exposure replay/drill receipts; bundle digest `sha256:8a904eaf6cc6f844047e944140f2fd69c8778997058b418aa82a80daaa9d1a5b` |
| `corepack pnpm run shadow:dry-run` | PASS — `DRY_RUN_NO_NETWORK`; 8/8 sources not run by design, 9/9 public locks closed |
| `corepack pnpm run shadow:live` | Honest external-source record — `COMPLETED_WITH_SOURCE_FAILURES`; 0/8 sources accepted, 8/8 failed, 0 claims, 0 comparisons, 9/9 public locks closed; artifact 3,026 bytes |

The 40-test regular browser run spanned seven files: the six rider-story files `zero-tap.spec.ts`, `service-change.spec.ts`, `offline.spec.ts`, `accessibility.spec.ts`, `commute.spec.ts`, and `responsive.spec.ts`, plus the five-test `offline-pwa.spec.ts` regression file. It covered real browser location allow/deny and saved precedence; request-scoped coordinates and stale-result invalidation; practical-walk and picker fallbacks; continuously governed Live/Scheduled/Expected/Holding and service-change timelines; source-owned Actual maps; saved/map/active-trip/offline controls; all five reconnection stages; exact source-snapshot train recovery; accessible-route warnings and explicit replacement; commute locks and materiality; keyboard-only operation; reduced motion; 200% text; 320-pixel reflow; and populated privacy, crowding, service-worker, and asset boundaries.

The separate two-test production-validation run used the ordinary application and real API rather than the fixture route. It proved a useful labeled validation startup, the canonical A15/A34 accessibility-constrained journey, reload behavior, and offline degradation. Focused client tests additionally prove tamper rejection and offline-to-online/reconnection behavior. Together they keep accessibility, elevator, and platform-guidance branding bound to the current response owner; without recapture, the device-held trip remains historical/unverified.

### Exhaustive public-route policy matrix

The test inventory independently derives and matches all 14 registered operations in both live and shadow: bootstrap; station catalog; station search; station board; nearby; status; map reference; map overlay; journey reference; journey plan; VAPID public key; subscription creation; subscription deletion; and subscription status.

- Bootstrap returns bounded structural metadata with `200`, `no-store`, and all nine gates false.
- Catalog and search remain canonical, empty, and non-demonstration; catalog is immutable structural content and search is `no-store`.
- Operational board, nearby, status, map, and journey responses are no-store locked envelopes with `data: null` and no operational marker leakage.
- VAPID key, subscription creation, and subscription status return `423`, `no-store`, expose no key, and cannot mutate the subscription store.
- Subscription deletion deliberately remains available under locks for cleanup. It returns `200`, `no-store`, can remove an existing record, and cannot create or leak one.
- A representative unsupported `PUT` on every registered path receives `405`, the exact `Allow` header, and `no-store`.

### Production smoke

The built API and client preview were started as separate local processes after creating `.env` from `.env.example`. Both `GET /api/v1/bootstrap` and the built preview returned HTTP 200. Bootstrap reported schema `2026-08-04`, runtime `validation/demonstration`, availability `available`, nine gates, and zero exposed gates. It returned the canonical validation catalog and journey-graph versions. The built HTML contained the application root and no validation-deck, scenario-receipt, or notification-receipt payload. The temporary ignored `.env` was removed, and the exact smoke listeners were stopped afterward.

The no-`.env` default remains `live/public`, empty, and 9/9 locked. That is a configuration diagnostic, not validation evidence; the documented `.env.example` step is required for the local demonstration.

### Review closure and release decision

Post-Task-16 repairs bound recovery to underlying GTFS-RT snapshots (`3a56c47`), added the ordinary deterministic validation flow (`b65bd42`), kept location fixes request-scoped and invalidated stale requests (`9d0f981`, `6dbe8f9`), bound Actual maps to current source owners (`ddac31c`), corrected validation API expectations (`462b4ed`), bound canonical A15→A34 rider evidence (`6c6af2a`), locked live/shadow journey references (`f841e03`), required exact reconnection service owners (`bb7e8a2`), kept validation branding response-bound (`5334760`), covered all public operations (`4410da7`), and pinned the toolchain (`9811f59`).

Independent final acceptance review is **READY for validation-build completion**, with no Critical or Important findings. The Node guidance was tightened to the dependency-compatible minimum. The production-validation browser configuration's use of Vite development mode is a non-blocking Minor; the built bundle is independently covered by the production build, regular deployed-client browser suite, and built-preview smoke above.

Gate 0 remains **NO-GO**. Validation readiness is not public-release approval: the fixed-package public cohorts, current-source duration, release-specific accessibility/guidance/map/commute approvals, rights evidence, and binary release record remain incomplete. The live shadow's 0/8 accepted-source result is an external-source failure record, not a successful current-source cohort. No public board or delivery gate opened; all nine public exposure gates remain closed.
