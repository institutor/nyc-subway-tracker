# Testing

Install dependencies first with `pnpm install --frozen-lockfile`.

The API command loads `.env` from its current checkout. A production-like client preview does not start the API: after building, run `pnpm run server` and `pnpm run preview` in two separate terminals.

## Required checks

```sh
pnpm test --run
pnpm run typecheck
pnpm run build
pnpm run test:e2e
```

The browser suite uses Playwright. To use an installed Chrome/Chromium binary instead of a downloaded browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its absolute path before running `pnpm run test:e2e`.

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

This record covers package `nyc-subway-tracker@0.1.0` at verified implementation baseline `6ef9288`. Later evidence-only commits do not change the tested product files.

### Reproducible dependency installation

The lockfile was exercised without mutating the working checkout. A temporary project contained only `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `.npmrc`. Its own isolated pnpm store was hydrated with the frozen lockfile (301 packages), then a true `pnpm install --frozen-lockfile --offline` completed successfully against that store. The temporary project and store were removed after their resolved paths were checked.

The first offline attempt against the machine's pre-existing store failed honestly because the `express-5.2.1.tgz` archive was absent; it was not reported as a pass. Hydrating the separate temporary store closed that environmental precondition. The checkout's existing `node_modules/.modules.yaml` remained byte-identical before and after the proof, with SHA-256 `3AACC2FDDE464FC12FE57196F91016368C4157A9E1A2C807350973528EA05D24`.

### Clean verification results

| Check | Exact result |
|---|---|
| `pnpm test --run` | PASS — 75 files, 1,168 tests |
| `pnpm run typecheck` | PASS — zero TypeScript errors |
| `pnpm run build` | PASS — Vite 7.3.6, 71 modules; client JavaScript 427.11 kB and CSS 30.18 kB |
| Installed-Chrome six-file E2E run | PASS — 35/35 tests in 25.6 seconds, using `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| `pnpm run truth:all` | PASS — 7/7 zero-exposure replay/drill receipts; bundle digest `sha256:8a904eaf6cc6f844047e944140f2fd69c8778997058b418aa82a80daaa9d1a5b` |
| `pnpm run shadow:dry-run` | PASS — `DRY_RUN_NO_NETWORK`; 8/8 sources not run by design, 9/9 public locks closed |
| `pnpm run shadow:live` | Recorded external-source failure — `COMPLETED_WITH_SOURCE_FAILURES`; 0/8 sources accepted, 8/8 `SOURCE_RETRIEVAL_OR_VALIDATION_FAILED`, 0 claims, 0 comparisons, 9/9 public locks closed |

The installed-Chrome run used exactly the six required files: `zero-tap.spec.ts`, `service-change.spec.ts`, `offline.spec.ts`, `accessibility.spec.ts`, `commute.spec.ts`, and `responsive.spec.ts`. It covered real browser location allow/deny and saved precedence; practical-walk and picker fallbacks; continuously governed Live/Scheduled/Expected/Holding and service-change timelines; saved/map/active-trip/offline controls; every reconnection owner stage; accessible-route warnings and explicit replacement; commute locks and materiality; keyboard-only operation; reduced motion; 200% text; 320-pixel reflow; and populated privacy, crowding, coordinate, service-worker, and asset boundaries. The final privacy review added adversarial proofs for exact and snake/kebab crowding keys, neutral train-car shells, embedded image or inline-SVG payloads, protected-brand coupling, all runtime image-bearing elements, and every visible computed image property.

### Production and visual smoke

The built API and client preview were started as separate hidden processes from a clean app start, after creating the checkout-local `.env` from `.env.example` exactly as the README requires. `GET /api/v1/bootstrap` and the preview root both returned HTTP 200. The bootstrap reported schema `2026-08-04`, runtime mode `validation`, runtime surface `demonstration`, nine gates, and zero exposed gates. The built HTML contained the app root and no validation-deck, test-route, or notification-receipt payload. Installed Chrome rendered the standard production picker without console errors or horizontal overflow; synthetic receipt surfaces remained absent. The temporary ignored `.env` was removed after the smoke.

A separate no-`.env` diagnostic started successfully in the default `live/public` runtime while still reporting nine gates and zero exposed gates. That is the intentional configuration default, not validation-mode evidence; the documented `.env.example` step is required for the local demonstration view and remains the startup used for the result above.

Representative screens were inspected at 1280×900 desktop and 390×844 phone sizes. Both retained high-contrast content, readable station-choice messaging, reachable refresh/station controls, and an unobscured bottom navigation dock. After the phone context completed service-worker registration and was switched offline, reload rendered the device-held subway tools, the explicit statement that live arrivals, alerts, and elevator status were unavailable, and no invented current station data. The full offline E2E additionally preserved and advanced a populated active trip in both directions, including its claim timestamps and historical status.

### Deterministic replay and drill receipts

| Scenario | Fixture-bound passing checks |
|---|---:|
| Normal weekday | 6/6 |
| Weekend planned work | 5/5 |
| Late-night midnight | 4/4 |
| Major disruption | 5/5 |
| Later-stop comparison | 4/4 |
| Route-group bulk drop | 10/10 |
| False-bypass incident drill | 6/6 |

Every receipt remained `VALIDATION_ONLY`, with `riderExposure: false`, `boardsExposed: false`, and all nine public exposure stages closed. Independent review findings were normalized into failing regressions before their fixes, including production-default accessible-route ownership, exact stored-departure recovery, real-App board and saved-location timelines, populated coordinate/crowding scans, and a closed app-owned asset inventory.

### Release decision

Gate 0 remains **NO-GO**. The live shadow's 0/8 accepted-source result is an external-source failure record, not a successful current-source cohort. Task 15's 9/9 lock truth is unchanged, no public board or delivery gate opened, and this Task 16 validation completion does not grant public release approval.
