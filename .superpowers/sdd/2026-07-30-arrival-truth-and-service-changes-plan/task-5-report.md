# Task 5 report — exact-stop admission and next-three ordering

## Status

Implemented. The two product artifacts remain **Draft** and every scenario result remains **Pending — Truth Gate**, as required.

## Artifacts

- `docs/product/arrival-truth/arrival-admission-and-ordering-contract.md`
- `docs/product/arrival-truth/arrival-board-decision-table.md`

The existing governance index rows already name both artifacts with the correct owner, reviewers, Draft state, and Pending evidence, so no index change was required.

## Decisions recorded

- Candidate generation begins only from current relevant real-time train instances.
- Admission finishes before ranking and requires the exact directional stop in the ordered remaining sequence.
- Destination and rider-facing direction must agree with the actual remaining pattern.
- Service-change, track, freshness, identity, and movement gates are applied before state assignment and ordering.
- Only admitted Live and Expected trains form the primary next-three set.
- Holding trains remain separate warning rows; confirmed-pattern Uncertain trains remain in a secondary area; quarantined and suppressed trains remain absent; Scheduled claims remain a clearly separated fallback.
- Chronological ordering uses the best current estimate and the center of an Expected range.
- Live wins only inside an evidence-supported overlap. A non-overlapping earlier Expected train remains before later Live trains.
- Boards show fewer than three when necessary and use one of the three exact approved explanations without static, Holding, Uncertain, or Scheduled backfill.
- The decision table covers every named Task 5 row and approved scenarios 1–3 and 50 with setup, inputs, ordered decision, visible result, and prohibited result.

## Verification

The final handoff verification checks whitespace, governance metadata, exact approved messages, admission-before-ordering language, all five named decision rows, direct scenarios 1–3 and 50 coverage, separate non-primary states, no weak static backfill, the staged diff, and the required commit subject.

## Concerns

- Expected-range construction and any numeric overlap tolerance remain outside this task. No downstream artifact should invent precision without observed evidence and Product and Data Quality approval.
- Schedule-fallback eligibility and currency remain governed by the approved specification and later arrival-truth work; Task 5 only preserves its strict separation from the live next-three set.
- All outcomes are specifications of expected behavior, not passing results. They remain Pending until exercised against a fixed reviewed product version and accepted at the Truth Gate.

## Commit

Required subject: `shape the trustworthy next three`
