# Nearby and offline Release 1 readiness

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§29.1–29.2, 30, 32.1–32.2, 33–34; nearby-station and offline-experience plan `Product artifact map` and Task 15 `Ordered steps`, `Acceptance evidence`, and `Completion check` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | **Not run — Pending**; all 91 Task 14 `A01` attempts are Pending and no fixed working-product evidence, companion acceptance package, rights resolution, or reviewer decision exists |

## Decision and authority

> **NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

This is the binary Release 1 review record for the nearby and offline workstream. It applies, but does not reinterpret or waive, the [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md), the [Gate 0 exit record](../quality/gate-0-exit-record.md), the [Nearby Task 14 acceptance-evidence ledger](acceptance-evidence.md), the companion accessibility and guidance gates indexed in the [product artifact index](../artifact-index.md), and the [product artifact review and approval policy](../review-and-approval-policy.md).

A document commit, expected scenario, empty incident log, absent denominator, or unsigned review is not working-product evidence. The current recommendation cannot change until every condition in this record is supported by one fixed, reviewed release package.

## Binary release rule

**GO** is permitted only when all of the following are true for the same fixed working-product and artifact package:

1. all Task 1–14 evidence is accepted, and every required Task 1–14 artifact is accepted under its own mandatory review set;
2. [Gate 0](../quality/gate-0-exit-record.md) is passed for that exact product and truth-policy package;
3. companion arrival-truth, accessibility, equipment, complete-path, and guidance evidence and approvals are accepted;
4. Product (**P**), Accessibility (**A**), Data Quality (**D**), Content (**C**), Privacy (**R**), and Operations (**O**) each record **Approve** against that same package;
5. every public map, symbol, logo, line-color use, and brand dependency has applicable documented rights, or the release candidate has a reviewed no-dependency treatment;
6. no stop blocker below is present; and
7. zero critical acceptance-evidence fields are missing, inconclusive, not observed where observation is required, not measured where measurement is required, or not run.

Any false statement, absent condition, unresolved dependency, or Pending decision above produces **NO-GO**. A waiver cannot turn missing critical evidence into evidence or weaken an upstream truth, accessibility, privacy, offline-honesty, or rights contract.

## Current dependency disposition

| Required release dependency | Evidence authority | Current result | Release effect |
|---|---|---|---|
| Tasks 1–13 contracts and policies accepted | [Experience contract](experience-contract.md) and linked owner artifacts | Draft; approval evidence Pending | Blocks |
| Task 14 fixed-version acceptance evidence accepted | [Acceptance evidence](acceptance-evidence.md) | No fixed working-product version; all 91 registered `A01` attempts are **Not run — Pending**; no rendered, assistive, measurement, attachment, correction, rerun, or reviewer evidence | Blocks |
| Gate 0 passed | [Gate 0 exit record](../quality/gate-0-exit-record.md) | **NO-GO — GATE 0 NOT PASSED** | Blocks; public arrival boards remain blocked |
| Companion accessibility and equipment evidence accepted | Draft `docs/product/accessibility/accessibility-acceptance-pack.md` and `docs/product/quality/accessibility-and-guidance-release-gates.md` in the [artifact index](../artifact-index.md) | Artifacts present; observed evidence and same-version approval Pending | Blocks direction-aware accessibility, live equipment status, and Accessible Route Only |
| Companion guidance evidence accepted | Draft guidance artifacts and release gates in the [artifact index](../artifact-index.md) | Artifacts present; observed positioning evidence and same-version approval Pending | Blocks public guidance claims |
| Map and brand rights resolved | [RIGHTS-01](acceptance-evidence.md#rights-family) and [risk NOF-08](risk-register.md#risk-register) | Durable permission or reviewed no-dependency record absent | Blocks protected public assets |
| All six release reviewers approve | [Reviewer decision record](#mandatory-reviewer-decisions) | P/A/D/C/R/O Pending | Blocks |

## In-scope capability readiness

The owner artifact fixes the product rule; Task 14 is the common observed-evidence owner. A Draft rule is not an accepted capability, and a Task 14 expected outcome is not an observed result.

| Release 1 capability | Product owner and applying artifacts | Required acceptance evidence | Current result | Release effect |
|---|---|---|---|---|
| Four persistent destinations, preserved rider context, no-account utility | Experience Product Lead — [experience contract](experience-contract.md) | Task 14 context, navigation, return, and no-account attempts | All applicable `A01` attempts **Not run — Pending** | Blocks |
| Zero-tap startup, warm-shell restoration, and honest location fallback | Experience Product Lead — [zero-tap startup and permission flow](zero-tap-startup-and-permission-flow.md) | Task 14 startup and permission attempts, including scenario 22 | **Not run — Pending**; no fixed product or timing observation | Blocks |
| Practical-walk station and entrance ranking | Experience Product Lead — [station-ranking and entrance rules](station-ranking-and-entrance-rules.md) | Task 14 ranking and scenario 21 attempts | **Not run — Pending**; no station-geometry observation | Blocks |
| Nearby station boards, every passenger-serving direction, and qualified next three | Experience Product Lead — [nearby-card and direction contract](nearby-card-and-direction-contract.md) | Task 14 card, route/direction, ordering, truth-consumption, and assistive attempts | **Not run — Pending**; upstream Gate 0 not passed | Blocks |
| Station details, localized alerts, filters, refresh, and honest degraded states | Experience Product Lead — [station-board and controls contract](station-board-and-controls-contract.md) | Task 14 board, service-change, refresh, empty, degraded, control, and assistive attempts | **Not run — Pending**; upstream truth results Pending | Blocks |
| Truth hierarchy, service-change reconciliation, ghost handling, and suppression | Product Truth Lead and Data Quality Lead — linked [Arrival Truth traceability](../quality/arrival-truth-requirement-traceability.md) | Accepted truth-owner cases plus Task 14 rider-visible application | Gate 0 no-go; truth approvals and local attempts Pending | Blocks |
| Dark-first, decision-first, one-handed, readable, and redundant route recognition | Experience Product Lead — [underground visual and reachability standard](underground-visual-and-reachability-standard.md) | Task 14 rendered, measured, large-text, assistive, touch, motion, and route-recognition attempts | **Not run — Pending**; no rendered or measured evidence | Blocks |
| Typical weekday and late-night stored maps, Actual-now honesty, and structural offline routing | Experience Product Lead — [map modes and journey behavior](map-modes-and-journey-behavior.md) and [offline content and validity contract](offline-content-and-validity-contract.md) | Task 14 map, scenario 25, validity, route, time, and rights attempts | **Not run — Pending**; rights unresolved | Blocks |
| Saved stations and rider-controlled personalization | Experience Product Lead — [saved-station and personalization contract](saved-station-and-personalization-contract.md) | Task 14 save, open, edit, pause, reset, delete, privacy, and offline attempts | **Not run — Pending** | Blocks |
| Complete offline trip cards and manual underground progress | Experience Product Lead — [offline trip-card and progress contract](offline-trip-card-and-progress-contract.md) | Task 14 scenarios 24 and 51, progress, contingency, complete-chain, and offline attempts | **Not run — Pending**; accessibility/guidance dependencies absent | Blocks |
| Explicit Offline state, cached-value limits, and prioritized reconnection | Experience Product Lead — [offline degraded and reconnection states](offline-degraded-and-reconnection-states.md) | Task 14 scenario 23, offline-honesty, invalidation, and reconnection attempts | **Not run — Pending** | Blocks |
| Schedule fallback with visible Scheduled, state, service date, and age treatment | Product Truth Lead — [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md), applied by nearby/offline artifacts | Accepted truth-owner currency cases plus Task 14 fallback/offline attempts | Gate 0 and local attempts Pending; no fallback-label observation | Blocks |
| Direction-aware accessibility, current equipment state, and Accessible Route Only on verified complete paths | Accessibility Product Lead — companion complete-path, equipment, state, copy, and acceptance artifacts indexed in the [artifact index](../artifact-index.md) | Accepted companion accessibility/equipment package plus Task 14 integration and assistive attempts | Draft companion artifacts present; approval and observed evidence Pending; local attempts **Not run — Pending** | Blocks |
| Location minimization, personal-data controls, diagnostic separation, and reset | Privacy Lead — [location and personal-data rules](location-and-personal-data-rules.md) | Task 14 permission, privacy, reset, diagnostic-separation, and measurement-export attempts | **Not run — Pending**; Privacy decision Pending | Blocks |
| Trusted-departure, usefulness, and guardrail readout | Measurement Lead — [measurement plan](measurement-plan.md) | Fixed lineage, eligible denominators, accepted companion inputs, metric cases, and all six reviews | All metric attempts **Not run — Pending**; no metric is measured | Blocks |

## Stop blockers

These are release stops, not severity-weighted tradeoffs. A triggered blocker cannot be averaged against usefulness, engagement, speed, or another passing result.

| Stop blocker | Current evidence | Current disposition |
|---|---|---|
| A false bypass arrival is admitted, retained, restored, or implied | Absence has not been demonstrated because Gate 0 has no fixed product, replay, shadow, or later-stop-progress evidence | Not evaluated; Gate 0 and critical-evidence blockers already stop release |
| A Scheduled, cached, stale, or reference fallback is not visibly labeled | No fixed rendered or assistive fallback result exists | Not evaluated; missing critical evidence blocks |
| A passenger-serving direction is hidden, collapsed, or inferred away | No fixed direction-coverage result exists | Not evaluated; missing critical evidence blocks |
| A known-outage path is recommended as accessible, or an unknown/incomplete chain is presented as operational | Companion complete-path and equipment evidence is absent; Task 14 accessibility attempts are Pending | Not evaluated; missing companion evidence blocks |
| Offline, cached, or reference content implies Live, Expected, current equipment, current accessibility, current guidance, or current service | No fixed Offline/reconnection observation exists | Not evaluated; missing critical evidence blocks |
| Critical acceptance evidence is missing | Fixed working product, Task 14 observed results, companion evidence, metrics, attachments, and reviewer decisions are absent | **Present — blocks** |
| A public map or brand-rights dependency is unresolved | Permission/no-dependency evidence is absent | **Present — blocks** |

## Gate 0 blocking deviations

All eight deviations are open in the [Gate 0 validation results](../quality/gate-0-validation-results.md#blocking-deviation-register). None is closed or waived here.

| Deviation | Severity | Recorded gap | Current Release 1 effect |
|---|---|---|---|
| G0-D001 | Critical | No fixed reviewed working-product version | Blocks all working-product claims |
| G0-D002 | Major | Source semantics, editions, publication behavior, and route/feed mapping not revalidated | Blocks current source-validity claims |
| G0-D003 | Major | Normal weekday, weekend planned-work, late-night/midnight, and major-disruption replay cohorts absent | Blocks truth-gate coverage |
| G0-D004 | Critical | Current-MTA shadow evidence absent | Blocks public exposure |
| G0-D005 | Critical | Later stop progress comparison absent | Blocks false-bypass and suppression conclusions |
| G0-D006 | Critical | Per-route/feed age, regression, emptiness, bulk-drop, isolation, and recovery evidence absent | Blocks every route/feed group |
| G0-D007 | Major | Product, Data Quality, and Operations Gate 0 decisions Pending; underlying Accessibility and Content reviews absent | Blocks approval |
| G0-D008 | Major | Intentionally uncalibrated skew, overdue, repeated-failure, dwell, and sustained-outage behavior not validated | Blocks inferred defaults or thresholds |

## Release readout

| Ordered review question | Current evidence | Binary result |
|---|---|---|
| Is the release evidence complete, fixed, reproducible, privacy-reviewed, and accepted? | No fixed product; all 91 Task 14 attempts Pending; companion, rights, metric, attachment, and reviewer evidence absent | **NO-GO** |
| Are the truth, accessibility, offline-honesty, privacy, and rights guardrails satisfied? | Gate 0 no-go; companion approvals absent; no working-product observation; rights unresolved | **NO-GO** |
| Is the trusted-departure north star measured without false-certainty gaming? | Not measured; no eligible fixed cohort or later outcomes | **NO-GO** |
| Are usefulness targets supported without overriding guardrails? | Not measured; no fixed warm-launch, nearby-result, immediate-control, Offline-open, or useful-card evidence | **NO-GO** |
| Are supporting measures and rider feedback supported by privacy-safe evidence? | Not measured; no approved aggregate package | **NO-GO** |
| Are open risks controlled with accepted evidence? | [Risk register](risk-register.md) remains Draft/Pending; truth, geometry, accessibility, rights, privacy, staleness, and companion dependencies remain open | **NO-GO** |
| Have all six reviewers approved the same package? | P/A/D/C/R/O Pending | **NO-GO** |

## Mandatory reviewer decisions

Silence is Pending. Reviewers decide the same fixed release package and do not bulk-approve narrower artifacts.

| Reviewer | Decision | Fixed package | Decision date | Evidence |
|---|---|---|---|---|
| Product (P) | Pending | Not available | Not recorded | Not recorded |
| Accessibility (A) | Pending | Not available | Not recorded | Not recorded |
| Data Quality (D) | Pending | Not available | Not recorded | Not recorded |
| Content (C) | Pending | Not available | Not recorded | Not recorded |
| Privacy (R) | Pending | Not available | Not recorded | Not recorded |
| Operations (O) | Pending | Not available | Not recorded | Not recorded |

## Reconsideration requirements

The Release Quality Lead may schedule a new binary review only after one fixed candidate package links:

1. accepted Task 1–13 artifacts and a fully executed, append-only Task 14 ledger;
2. a passed Gate 0 record for the same candidate and truth-policy versions, with all eight current deviations resolved by preserved evidence;
3. accepted companion complete-path, equipment-status, accessibility, guidance, and applicable commute-boundary evidence;
4. documented map and brand rights or a reviewed candidate with no protected dependency;
5. complete privacy-safe measurement lineage and results;
6. closure evidence for every stop blocker and open release-effect risk; and
7. dated P/A/D/C/R/O decisions against that exact package.

Until then, the decision remains **NO-GO — GATE 0 NOT PASSED**, and public arrival boards remain blocked.
