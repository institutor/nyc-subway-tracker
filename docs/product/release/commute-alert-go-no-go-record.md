# Commute alert go/no-go record

| Governance field | Value |
|---|---|
| Source authority | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 32.3, 33.5, and 34; commute alerts and launch quality plan Task 10 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Decision date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario evidence | [Not run — Pending](commute-alert-scenario-results.md#pending-execution-record) |

## Record authority

This record alone owns the reviewed commute-alert launch disposition. The [launch checklist](commute-alert-launch-checklist.md) owns prerequisites, ordered stages, stop rules, and rollback requirements. The [scenario register](commute-alert-scenario-results.md) owns append-only fixture definitions and attempts. This record does not change Tasks 1–9, the Arrival Truth Gate, Nearby/offline readiness, accessibility release gates, or their controlling decisions.

The artifact index cites Release 1 §32.2 for this launch activity, while commute alerts are a later Release 2 capability under §32.3. Product Governance reconciliation and full Task 10 provenance in the index remain **Pending**. This task does not edit the index.

## Controlling initial disposition

| Decision field | Controlling value |
|---|---|
| Release disposition | **NO-GO — prerequisites and fixed-version evidence incomplete** |
| Fixed release candidate | Pending |
| Highest completed stage | None; Stage 1 prerequisites are not accepted |
| Commute-alert silent evaluation | Not authorized |
| Limited rider pilot | Not authorized |
| Commute-alert release | Not authorized |
| Pilot authorization equivalence | Pilot authorization, if later granted, is not release GO |
| Next eligible review | Only after every blocker below is closed on one immutable package and all ordered prior stages Pass |

This outcome is based on absent or failed required evidence, not on a claim that the working product was tested and found safe. Documentation, zero incidents, zero exposure, an empty log, an empty denominator, a pending reviewer assignment, or an unobserved condition cannot support launch.

## Initial blockers

Every row is release-blocking. Items remain separate; closing one does not close another.

| Blocker ID | Required evidence | Current evidence state | Release effect | Closure rule |
|---|---|---|---|---|
| `CG-BLK-01` | Accepted Tasks 1–9 plus governed approval, scenario, and correction/rerun evidence | Task 1–9 approval and executable evidence are Pending | Blocks Stage 1 | Every applicable fixed artifact, attempt, approval, and dependency passes on the candidate |
| `CG-BLK-02` | Passed Arrival Truth Gate with source/feed revalidation, replay cohorts, current shadow, later-stop outcomes, every required boundary family and metric, plus Product/Data Quality/Operations signatures | Gate 0 remains no-go; source/feed revalidation, replay, shadow, later outcomes, metrics, and signatures are absent | Blocks every public or alert surface that consumes live truth | Gate 0 controlling record changes only through its own governed process after all required evidence Passes |
| `CG-BLK-03` | Accepted Nearby, saved-station, Offline, reconnection, location, and alert-permission behavior, including saved fallback after location denial; no prompt from Nearby, Map, Saved, Offline, reconnect, or save-without-alerts; explicit enable/deny/restrict/revoke/restore; no replay | Nearby/offline readiness is no-go and all required local attempts and reviews are Pending | Blocks commute-alert permission and Offline/reconnect claims | Every fixed Nearby/offline/permission attempt and all six same-package reviews Pass |
| `CG-BLK-04` | Accepted complete path, ARO, equipment, alternative, visible/assistive, `IMP-01`–`IMP-14`, scenario 39, and exact real pilot station-direction-path coverage | Accessibility artifacts and attempts are Pending; real eligible pilot coverage is zero | Blocks accessible pilot and release | Every owner suite and every required real coverage row Passes with independently verified alternatives |
| `CG-BLK-05` | Frozen Task 8 sample sizes, observation period, feedback maturity, aggregation floor and retention, active-commuter definition, Planned/Unplanned cells, and independent reviewer procedure before observation | Measurement choices remain unapproved | Blocks silent evaluation and any target claim | All choices are approved and frozen before observation; required cells later have mature, valid lineage |
| `CG-BLK-06` | Proven delivery acknowledgment, seen-state interpretation, severity handling, correction delivery, token handling, lock-screen privacy, and quiet-behavior boundaries | Delivery acknowledgment/seen/severity/correction/token/lock-screen/quiet gaps remain unresolved; Task 6’s proposed 900-second quiet period is unapproved and is not a gate input | Blocks complete delivery, privacy, correction, and nuisance evidence | Governed behavior and evidence are fixed and all mandatory scenarios Pass without adopting the unapproved proposal |
| `CG-BLK-07` | Approved Task 9 roster and access; episode/route/global holds; final switch reread; queue cancellation; board isolation; correction and incident path; recovery, rollback, and drills | Roster, switches, queue evidence, correction path, log, drills, and reviews are absent | Blocks limited pilot and release | Roster/access and every required drill Pass on the same candidate with no open blocker |
| `CG-BLK-08` | One fixed build/configuration/source/data/copy/privacy/operations package and durable synthetic, replay, shadow, silent-cohort, pilot, delivery, feedback, incident, reviewer, correction, rerun, and rollback evidence | No fixed build, cohort, pilot, delivery, feedback, incident, reviewer, or rollback evidence exists; all 27 initial attempts are Pending | Blocks every execution claim and all six signatures | One immutable manifest binds every result and reviewer; complete evidence Passes through all six ordered stages |

The active upstream Arrival Truth, Nearby/offline, and accessibility no-go states remain independently controlling. This record cannot close or override them.

## Ordered review rule

The decision review may advance only in this order:

1. prerequisites accepted;
2. mandatory synthetic, replay, and current-shadow scenarios Pass;
3. silent evaluation passes every frozen target and stratum;
4. an explicitly bounded limited pilot may begin;
5. the fixed pilot review passes; and
6. the six reviewers decide GO, CONDITIONAL GO, or NO-GO on the same package.

A later-stage result cannot cure an earlier missing result. Any stage stop returns the package to no-go until a bounded correction and complete new attempt pass.

## Release disposition rules

| Disposition | Required rule |
|---|---|
| **GO** | Every prerequisite, mandatory attempt, blocker, Planned and Unplanned cell, target, zero-tolerance guardrail, incident closure, correction/rerun, and rollback proof is **Run — Pass** on one immutable candidate; all six required reviewers explicitly Approve that same package |
| **CONDITIONAL GO** | Every GO blocker and target still Passes and all six explicitly Approve the same package; only an explicit non-blocking limitation may remain, with a named owner, deadline, affected population, containment, verification, and automatic rollback |
| **NO-GO** | Any **Run — Fail**; **Not run — Pending**; **Run — Inconclusive**; required **Not measured** or **Not observed**; open blocker; missing dependency, attachment, lineage, later outcome, review, signature, or rollback proof; target breach; privacy/lineage breach; or reviewer decision of **Changes required** |

Conservative aggregation is mandatory:

- every blocker must Pass;
- Planned and Unplanned remain separate, and either incomplete or failing cell blocks;
- a corrected Pass never overwrites the original attempt;
- correct Hold, Suppress, or cap behavior must be evidenced and is not a missed delivery;
- an empty denominator is Not measured, not Pass;
- an unobserved required phenomenon is Not observed, not Pass;
- reviewer disagreement is Inconclusive and blocks; and
- zero incidents, zero delivery, zero exposure, and empty logs provide no safety credit.

## Conditional-GO boundary

CONDITIONAL GO cannot waive truth, relevance, source freshness, deduplication, accessibility, privacy, deletion/reset/token behavior, explicit permission, Offline/no-replay behavior, operations holds and cancellation, evidence lineage, rollback, or any required scenario, stratum, metric, signature, or stage.

Every proposed condition must be recorded before decision:

| Condition field | Required content |
|---|---|
| Stable condition ID and candidate | Exact non-blocking item and immutable package |
| Evidence it is non-blocking | Links proving every blocker and target already Passes |
| Owner and deadline | One accountable owner and an exact close date |
| Affected population | Explicit bounded routes, stations, users, periods, or surfaces |
| Containment | Enforced limit that prevents expansion |
| Verification | Objective check, reviewer, evidence, and date |
| Automatic rollback | Predeclared trigger, scope, Commander, queue action, and proof |
| Six approvals | Explicit same-package approval of the condition and release |

An unbounded, unsigned, unverifiable, or blocker-touching condition makes the package NO-GO.

## Same-package release approvals

Silence, attendance, assignment, a calendar invitation, a bulk approval, another reviewer’s decision, or approval of a different package is not signoff. Each reviewer must see the complete fixed evidence and enter one explicit decision: **Approve** or **Changes required**. The latter is a failure.

| Required reviewer | Named reviewer | Candidate/package | Decision | Date and signature | Evidence reviewed |
|---|---|---|---|---|---|
| Product | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| Accessibility | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| Data Quality | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| Content | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| Privacy | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| Operations | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |

Release Quality records the aggregation but cannot substitute for any required reviewer.

## Fixed decision package

| Decision-package field | Current value |
|---|---|
| Product build and configuration | **Not run — Pending** |
| Artifact commit and blob manifest | **Not run — Pending** |
| Source/feed/mapping/rights editions | **Not run — Pending** |
| Tasks 1–9 approvals and evidence | **Not run — Pending** |
| Checklist prerequisite results | [Not run — Pending](commute-alert-launch-checklist.md#required-prerequisite-evidence) |
| Scenario attempts | [27 Not run — Pending](commute-alert-scenario-results.md#pending-execution-record) |
| Silent/pilot measurement package | **Not run — Pending** |
| Incident/correction/rerun package | **Not run — Pending** |
| Rollback proof | **Not run — Pending** |
| Six same-package approvals | **Not run — Pending** |

No reviewer may sign a floating “latest” package. Any build, configuration, source, data, copy, privacy, operations, measurement, evidence, or reviewer-package change creates a new decision package and requires the affected executions and all six decisions to be repeated.

## Stop and rollback proof required before advance

The fixed candidate must demonstrate:

- episode, route, and global holds under OR precedence with one Commander;
- final-send switch reread and cancellation of unsent matching commute-alert queues;
- no post-hold leak and no replay of held, stale, failed, ended, outside-window, Offline, or Unknown work;
- public boards and unaffected routes remain isolated and current;
- saved commutes, explicit notification intent, permissions, ARO, maps, ledger, and non-commute state remain unchanged;
- privacy deletion, reset, token containment, and post-revoke behavior complete;
- correction preserves the original attempt and failure; and
- automatic rollback triggers on any accepted duplicate, wrong route/direction/segment/path/consequence, stale or resolved delivery, deterministic should-Send miss, accessibility breach, privacy breach, target breach, missing lineage, queue leak, or switch failure.

Missing proof is incomplete evidence and blocks.

## Append-only decision history

The controlling initial decision is recorded once above. Future reviews append a row; they never edit the initial decision or remove a blocker, dissent, failure, condition, or prior package.

| Decision attempt | Review date | Fixed package | Prior decision reference | Prerequisite/stage summary | Six-decision package | Conditions | Rollback evidence | New disposition | Superseding authority |
|---|---|---|---|---|---|---|---|---|---|
| `CLG-DEC-002` and later | Pending | Pending | Link to the controlling initial decision | Pending | Pending | Pending | Pending | Pending | Pending |

Any future row must link complete checklist and scenario evidence, name every correction and preserved original, and state whether it supersedes the prior decision. Until then, the controlling initial disposition remains in force.
