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

The earlier file must be an exact bounded `shadow-v2` record. The command hashes the exact file bytes, binds the earlier and later record/claim identities, verifies every compact admitted-claim proof, recomputes the full deterministic comparison partition and final-size loop, and rejects a malformed, fabricated, stale (more than 15 minutes), unbound, shuffled, or falsely truncated comparison. A missing `--compare` value fails without writing a final artifact. Comparison includes admitted and suppressed claims, records the disposition transition, and can report progressed, not observed, or inconclusive. Deterministic truncation keeps the artifact within 1,000,000 bytes and records exact considered, included, and omitted counts. It never opens a rider surface or release gate.
