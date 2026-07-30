# Gate 0 validation results

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§31, 32.1; arrival-truth and service-changes plan Task 13 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Not run — no fixed reviewed working-product version |

## Result summary

**Gate result: NO-GO — GATE 0 NOT PASSED.**

This record contains no observed working-product behavior. A documentation commit exists, but it is not a fixed working-product version and is intentionally not entered as one. Source semantics and the route-to-feed-group inventory have not been revalidated for a candidate run. No replay, current shadow, public result, later-stop-progress comparison, sample, metric, reviewer decision, or incident-absence claim has been produced.

Expected outcomes remain in the [arrival-truth acceptance catalog](arrival-truth-acceptance-catalog.md). They are not copied here as actual results and do not change the authority of their owner artifacts.

| Validation control | Current recorded value |
|---|---|
| Fixed working-product version | **Not available** |
| Behavior-policy version tied to product | **Not available** |
| Source revalidation | **Not run** |
| Route-to-feed-group inventory revalidation | **Not run** |
| Replay results | **Not run** |
| Current MTA shadow | **Not run** |
| Rider exposure | No public board authorized; this is containment, not validation evidence |
| Later stop outcomes | **Not observed — no candidates were run** |
| Scenario review | **Pending** |
| Product decision | **Pending** |
| Data Quality decision | **Pending** |
| Operations decision | **Pending** |

## Cohort results

| Cohort | Fixed source window | Source revalidated | Decision census | Manual review | Later outcomes | Result |
|---|---|---|---|---|---|---|
| G0-R1 — normal weekday peak/off-peak | Not registered | Not run | Not run | Not run | Not observed | **Not run — blocks exit** |
| G0-R2 — weekend planned work | Not registered | Not run | Not run | Not run | Not observed | **Not run — blocks exit** |
| G0-R3 — late night/midnight | Not registered | Not run | Not run | Not run | Not observed | **Not run — blocks exit** |
| G0-R4 — major disruption pre/active/recovery | Not registered | Not run | Not run | Not run | Not observed | **Not run — blocks exit** |
| G0-S1 — contemporaneous current-MTA shadow, zero rider exposure | Not registered | Not run | Not run | Not run | Not observed | **Not run — blocks exit** |

## Truth-owned catalog results

Each stable ID below requires its own observed result for the same fixed version. “Not run” is recorded separately for all 27 truth-owned scenarios.

| Stable ID | Actual public/withheld result | Provenance | Prohibited checks | Later outcome | Reviewer result | Status |
|---|---|---|---|---|---|---|
| AT-S01 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S02 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S03 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S04 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S05 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S06 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S07 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S08 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S09 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S10 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S11 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S12 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S13 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S14 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S15 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S16 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S17 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S18 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S19 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S20 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S40 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S41 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S42 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S43 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S44 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S49 | Not run | Not available | Not run | Not observed | Pending | **Not run** |
| AT-S50 | Not run | Not available | Not run | Not observed | Pending | **Not run** |

## Numeric boundary-family results

These rows reference, but do not replace, the catalog's stable boundary inventory. Every branch remains unexecuted.

| Boundary family / catalog cases | Exact-boundary run | Immediate just-over or paired run | Result |
|---|---|---|---|
| Feed age 90 seconds — F1/F2 | Not run | Not run | **Not run** |
| Feed age 180 seconds — F3/F4 | Not run | Not run | **Not run** |
| Movement age 90 seconds — M1/M2 | Not run | Not run | **Not run** |
| Movement age 180 seconds — M3/M4/M5 | Not run | Not run | **Not run** |
| Due duration 60 seconds — D1/D2 | Not run | Not run | **Not run** |
| Due/no exact event 120 seconds — D3/D4 | Not run | Not run | **Not run** |
| Disappearance duration 60 seconds — S3/S4 | Not run | Not run | **Not run** |
| Bulk-drop proportion 40% — Scenario 17/A2, including fixed 39/40/41 of 100 | Not run | Not run | **Not run** |
| Alert currency 10 minutes — F7 run one/run two | Not run | Not run | **Not run** |
| Schedule age zero — S10D/S10B run A | Not run | Not run | **Not run** |
| Schedule age 2 hours — S11/S12 | Not run | Not run | **Not run** |
| Schedule age 24 hours — S14/Scenario 44B | Not run | Not run | **Not run** |

## Count-gate results

| Count gate / catalog cases | Lower-count control | Required-count result | Status |
|---|---|---|---|
| Expected stability — Scenario 2 control/second stable update | Not run | Not run | **Not run** |
| Disappearance — Scenario 15/Scenario 16 | Not run | Not run | **Not run** |
| Stop-order regression — S8/S9 | Not run | Not run | **Not run** |
| Train recovery — R1/R2 | Not run | Not run | **Not run** |
| Feed recovery — Scenario 17/18 recovery one/two | Not run | Not run | **Not run** |

## Task 11 quarantine and correction result set

This is a required result set separate from the 27 **AT-S** scenario rows.

| Task 11 case | Actual isolation/correction result | Public-board influence check | Recovery/rejection evidence | Reviewer result | Status |
|---|---|---|---|---|---|
| Q1 — malformed timestamp | Not run | Not run | Not run | Pending | **Not run** |
| Q2 — implausible, future, regressed, or contradictory timestamp | Not run | Not run | Not run | Pending | **Not run** |
| Q3 — stop-order regression | Not run | Not run | Not run | Pending | **Not run** |
| Q4 — duplicate identities | Not run | Not run | Not run | Pending | **Not run** |
| Q5 — impossible direction change | Not run | Not run | Not run | Pending | **Not run** |
| Q6 — non-terminal track conflict | Not run | Not run | Not run | Pending | **Not run** |
| Q7 — suspiciously empty snapshot | Not run | Not run | Not run | Pending | **Not run** |
| Q8 — contradictory alert scope | Not run | Not run | Not run | Pending | **Not run** |
| P1 — suppress known bad arrival | Not run | Not run | Not run | Pending | **Not run** |
| P2 — clarify supported affected segment | Not run | Not run | Not run | Pending | **Not run** |
| P3 — mark platform guidance unavailable | Not run | Not run | Not run | Pending | **Not run** |
| P4 — correct geometry or accessibility relationship | Not run | Not run | Not run | Pending | **Not run** |
| F1 — attempted fabricated movement | Not run | Not run | Not run | Pending | **Not run** |
| F2 — attempted unsupported arrival | Not run | Not run | Not run | Pending | **Not run** |
| F3 — attempted equipment-operational claim | Not run | Not run | Not run | Pending | **Not run** |

## Route/feed-group coverage

The route-to-feed-group inventory has not been revalidated, so no actual group list is asserted here.

| Required population | Current/90/91/180/181 | Regression | Empty snapshot | 39/40/41-of-100 bulk drop | Unrelated isolation | Recovery one/two | Result |
|---|---|---|---|---|---|---|---|
| Every source-revalidated route/feed group | Not run | Not run | Not run | Not run | Not run | Not run | **Coverage absent — blocks exit** |

No route or feed group may inherit a pass from a different group.

## Later-outcome and decision-class coverage

| Original decision class | Census | Determinate later outcomes | Not observed outcomes | Manual sample | Comparison result |
|---|---|---|---|---|---|
| Admitted Live | Not run | Not available | Not available | Not run | **Not measured** |
| Admitted Expected | Not run | Not available | Not available | Not run | **Not measured** |
| Suppressed | Not run | Not available | Not available | Not run | **Not measured** |
| Arrival claim unavailable | Not run | Not available | Not available | Not run | **Not measured** |
| Quarantined | Not run | Not available | Not available | Not run | **Not measured** |
| Holding/Uncertain | Not run | Not available | Not available | Not run | **Not measured** |
| Scheduled fallback/no estimate | Not run | Not available | Not available | Not run | **Not measured** |

## Trust metrics

| Specification §29.1 metric | Numerator | Denominator | Result | Target disposition |
|---|---:|---:|---|---|
| Known released false-bypass arrivals | Not available | Not available | **Not measured** | No product census exists, so even the contained `0/0` exposure state is not asserted as a tested result; later-outcome evidence is absent. |
| Live-label freshness compliance | Not available | Not available | **Not measured** | ≥99.9% not demonstrated. |
| Fallback labeling | Not available | Not available | **Not measured** | 100% **Scheduled** labeling not demonstrated. |
| Detected-hold countdown freeze | Not available | Not available | **Not measured** | 100% freeze not demonstrated. |

Validation-only false-bypass comparison: numerator **Not available**; determinate replay/shadow admitted-claim denominator **Not available**; **Not measured**. This non-rider validation denominator must be nonzero before the first exit condition can be demonstrated.

The known-outage accessible-routing and unknown equipment-state targets are not reported here. They remain owned by the Accessibility and Platform Guidance workstream; this no-go neither passes nor waives them.

## Blocking deviation register

Severity follows the [Gate 0 protocol](gate-0-truth-validation-protocol.md#deviations-incidents-and-blockers). IDs and closure evidence are preserved across future reruns.

| ID | Severity | Affected route/scenario | Blocking evidence gap | Conservative containment | Owner | Evidence required to close | State |
|---|---|---|---|---|---|---|---|
| G0-D001 | Critical | All routes; all AT-S and Task 11 cases | No fixed reviewed working-product version exists; a docs commit is not behavior. | No public arrival board. Shadow only after a fixed product exists. | Product | Reproducible fixed product version tied to reviewed behavior-policy versions and every result. | Open — blocks exit |
| G0-D002 | Major | All source-dependent routes/scenarios | Official source semantics, editions, publication behavior, and route/feed mapping are not revalidated. | No public arrival board; make no current source-validity claim. | Data Quality | Dated source and route/feed inventory revalidation with changes and affected artifacts recorded. | Open — blocks exit |
| G0-D003 | Major | All replay-owned scenarios | Normal weekday, weekend planned-work, late-night/midnight, and major-disruption cohorts are absent. | No public arrival board. | Release Quality | Preregistered fixed windows, full census, samples, results, provenance, and reviews for all four cohorts. | Open — blocks exit |
| G0-D004 | Critical | All routes; current behavior | Contemporaneous current-MTA shadow evidence is absent. | No rider exposure; future evaluation remains shadow-only. | Operations | Source-revalidated zero-exposure shadow census, manual review, later outcomes, metrics, and incident disposition on the fixed version. | Open — blocks exit |
| G0-D005 | Critical | Every admitted, suppressed, unavailable, quarantined, Holding/Uncertain, and fallback claim | No candidate has been compared with later stop progress. | No public arrival board; do not infer service or safety from absent outcomes. | Data Quality | Determinate later-outcome comparisons or explicitly resolved preregistered holdout evidence for required strata. | Open — blocks exit |
| G0-D006 | Critical | Every route/feed group; AT-S17–AT-S19 and feed controls | Route/feed inventory and Current, regression, emptiness, bulk-drop, isolation, and recovery coverage are absent. | No public arrival board; no group may inherit another group's state. | Data Quality | Per-group Current/90/91/180/181, regression, emptiness, 39/40/41-of-100, unrelated isolation, and two-snapshot results. | Open — blocks exit |
| G0-D007 | Major | All Gate 0 and dependent artifacts | Product, Data Quality, and Operations decisions are Pending; additional Accessibility/Content reviews required by underlying artifacts are also absent. | Artifacts remain Draft/Pending; no docs-only or bulk approval. | Release Quality | Role-specific decisions against one fixed evidence package, plus every additional reviewer required by each affected artifact. | Open — blocks exit |
| G0-D008 | Major | AT-S02, AT-S42, ghost/dwell and feed-failure controls | Working behavior needed to validate intentionally uncalibrated small skew, materially overdue, repeated failure, dwell margin/percentile, and sustained-outage interpretation does not exist. | No public arrival board; no numeric value or permissive default is inferred. | Product and Data Quality | Fixed candidate behavior, observed calibration evidence, approved values if proposed, affected artifacts returned to Draft, and direct/boundary/integrated reruns. | Open — blocks exit |

There is no valid basis to close, downgrade, or waive any row. No “no incident” conclusion is recorded because the candidate and tests do not exist.
