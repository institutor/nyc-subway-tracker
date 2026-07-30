# Task 4 report — route-level feed health and snapshot anomaly policy

## Status

Implemented. The product documentation remains **Draft** and its scenario evidence remains **Pending — Truth Gate**, as required.

## Artifacts

- `docs/product/arrival-truth/feed-health-policy.md`
- `docs/product/arrival-truth/snapshot-anomaly-and-recovery-cases.md`

## Decisions recorded

- Health is scoped independently to each relevant route/feed group.
- Current is no more than 90 seconds; Degraded is 91–180 seconds inclusive; Unavailable is more than 180 seconds or follows repeated update failures, invalid decoding, or timestamp regression.
- “Repeated update failures” remains deliberately nonnumeric pending observed evidence and Product and Data Quality approval.
- Alert context is current through exactly ten minutes; stale alerts never prove normal service, and unresolved active-change risk fails closed.
- Feed-wide snapshot age and train-specific movement age remain separate.
- Bulk-drop evidence covers roughly 40% or more, the exact 40% boundary, simultaneous feed loss, timestamp regression, invalid or malformed content, and suspiciously empty full snapshots.
- Degraded recovery preserves the last coherent information, freezes countdowns, and shows **Live data updating**.
- Every freshness and anomaly recovery path requires two consecutive fresh coherent snapshots before exact countdowns can return; each returning train is then reevaluated against admission and veto rules.
- Acceptance cases include explicit setup, expected state, and prohibited outcome for every required boundary and for approved scenarios 17 and 18.

## Verification

The handoff verification checks whitespace, required policy clauses, exact scenario headings, complete setup/expected/prohibited structures, Draft/Pending governance metadata, and the staged diff. The final command result is reported in the task handoff.

## Concerns

- The specification calls these freshness thresholds starting product policy; later tuning must use observed route and terminal evidence and return through the governed Product and Data Quality review path.
- The number of failures constituting “repeated update failures” intentionally remains undefined. No downstream artifact should invent one without approved evidence.
- Schedule fallback timing is outside Task 4. This policy permits only separately governed, unmistakably scheduled fallback that continues to obey current negative evidence and unresolved-change vetoes.

## Commit

Required subject: `draw honest feed health boundaries`
