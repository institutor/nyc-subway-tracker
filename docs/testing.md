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
