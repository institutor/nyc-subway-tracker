# Commute alert launch checklist

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 32.3, 33.5, and 34; commute alerts and launch quality plan Task 10; accepted immutable Commute Tasks 1–9; Arrival Truth Gate, Nearby/offline, and accessibility release records |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-alert-scenario-results.md#pending-execution-record) |

## Purpose and authority

This checklist owns frozen prerequisites, ordered launch stages, stop rules, and rollback evidence for subway commute alerts. The [scenario results](commute-alert-scenario-results.md) own append-only attempts. The [go/no-go record](commute-alert-go-no-go-record.md) alone owns the reviewed disposition. It cannot change Tasks 1–9, Arrival Truth, Nearby/offline, accessibility, or Task 8 thresholds.

This is a Draft evidence definition, not product evidence and not an MTA guarantee. Documentation, zero incidents, empty denominators, empty logs, message volume, engagement, permission acceptance, or reviewer attendance never proves safety or release readiness. Public boards, commute pushes, pilot advance, and launch remain blocked by their controlling upstream decisions.

## Product Governance reconciliation

The artifact header and Draft artifact index row now align on the later Release 2 boundary in §32.3, full Task 10 provenance, accepted immutable Tasks 1–9 and upstream gate handoffs, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. The six-role same-package decisions and fixed gate evidence remain **Pending**. Metadata alignment does not alter any upstream gate or authorize launch.

## Immutable release package

One release attempt binds an immutable:

- product build and configuration;
- Tasks 1–10 artifact versions and governed approvals;
- source/feed editions, mappings, replay inputs, current shadow inputs, and later outcomes;
- synthetic, shadow, silent, pilot, correction, and rollback data packages;
- copy, visible output, assistive output, permission, privacy, and operations versions;
- sample sizes, observation period, maturity, denominators, floors, retention, strata, and reviewer procedure;
- named reviewers, decisions, dates, signatures, attachments, and lineage; and
- scenario, metric, incident, correction, rerun, and rollback attempt set.

No field may be replaced after observation under the same attempt. A correction creates a bounded new version and new attempt while preserving the original result, attachments, reviewers, and failure.

## Required prerequisite evidence

Every row uses the complete checklist schema: stable ID and authority, fixed versions, owner/reviewers, evidence, result rule, current result and release effect, deviation, correction, and rerun.

| Stable ID / authority | Immutable prerequisite | Required fixed versions | Owner / mandatory reviewers | Durable evidence links | Result rule | Current result / release effect | Deviation | Correction | Rerun |
|---|---|---|---|---|---|---|---|---|---|
| `CL-P01`; Tasks 1–9 | Accepted Tasks 1–9 plus governed approval and scenario evidence | Exact commits, blobs, approval packages, attempts | Each task owner; Product, Accessibility, Data Quality, Content, Privacy, Operations as applicable | Task artifacts, scenario records, approval signatures | Every applicable artifact and scenario **Run — Pass** on the candidate package | **Not run — Pending**; blocks Stage 1 | Approvals and execution evidence absent | Pending | Pending |
| `CL-P02`; Arrival Truth Gate | Passed source/feed revalidation, replay, current shadow, later-stop outcomes, every boundary family, metrics, and Product/Data Quality/Operations signoff | Fixed build, source editions, mappings, cohorts, shadow interval, later outcomes | Product Truth, Data Quality, Operations | [Gate 0 exit record](../quality/gate-0-exit-record.md), [validation results](../quality/gate-0-validation-results.md), source/replay/shadow/later-outcome evidence | Gate 0 passed; every blocking row and required metric Pass | **Not run — Pending**; **NO-GO — GATE 0 NOT PASSED** remains controlling | Source revalidation, replay, shadow, later outcomes, metrics, and signatures absent; no complete fixed-version attempt exists | Pending | Pending |
| `CL-P03`; Nearby/saved/offline/permission | Accepted saved fallback after location denial; no prompt from Nearby, Map, Saved, offline, reconnect, or save-without-alerts; explicit enable/deny/restrict/revoke/restore/Offline and no replay | One fixed Nearby/offline/permission package and all attempts | Experience Product, Accessibility, Data Quality, Content, Privacy, Operations | [Release 1 readiness](../nearby-offline/release-1-readiness.md), [acceptance evidence](../nearby-offline/acceptance-evidence.md), permission and offline captures | Every required attempt Pass; all six approve same package | **Not run — Pending**; Nearby/offline readiness remains NO-GO and all local attempts Pending | Fixed product, 91 attempts, companion evidence, rights, metrics, and reviews absent; no complete fixed-version attempt exists | Pending | Pending |
| `CL-P04`; Accessibility | Accepted complete path/ARO/equipment evidence for every pilot station-direction-path, `IMP-01`–`IMP-14`, exact coverage rows and alternatives, scenario 39, visible/assistive parity | Fixed build, source, equipment inventory, 26-field coverage rows, path/copy package | Accessibility, Product, Data Quality, Content, Privacy, Operations | [Accessibility release gates](../quality/accessibility-and-guidance-release-gates.md), [acceptance pack](../accessibility/accessibility-acceptance-pack.md), [coverage register](../accessibility/station-direction-coverage-register.md) | Every required suite and real eligible coverage row Pass; zero unresolved safety issue | **Not run — Pending**; accessibility evidence is Pending and real eligible pilot coverage is zero | No fixed execution, accepted path/equipment result, real coverage, or signatures; no complete fixed-version attempt exists | Pending | Pending |
| `CL-P05`; Task 8 | Sample sizes, observation period, feedback maturity, aggregation floor/retention, active-commuter definition, and independent reviewer procedure frozen before observation | Exact [scorecard](../measurement/commute-alert-scorecard.md), [event dictionary](../measurement/commute-alert-event-dictionary.md), and [sampling plan](../measurement/commute-alert-sampling-plan.md) versions plus choices | Measurement; all six reviewers | Approved measurement choices and freeze record | Every choice approved before any observation; no post-observation tuning | **Not run — Pending**; blocks silent evaluation | Measurement choices remain unapproved | Pending | Pending |
| `CL-P06`; Task 9 | Approved roster, page/access separation, scoped holds, final switch check, queue cancellation, correction, incident log, drills, recovery, board isolation | Exact playbook/correction/log/pilot package, roster, switch/config, fixed drills | Operations; Product, Accessibility, Data Quality, Content, Privacy, Release Quality | [Operations playbook](../operations/commute-alert-operations-playbook.md), [correction policy](../operations/commute-alert-correction-policy.md), [incident template](../operations/commute-alert-incident-log-template.md), [pilot template](../operations/commute-alert-pilot-review-template.md) | Roster/access and all required drills Pass on same candidate; no open blocker | **Not run — Pending**; blocks pilot | Roster, switches, queue evidence, correction path, drills, and reviews absent | Pending | Pending |
| `CL-P07`; fixed candidate | One fixed build/config/data/source/copy/privacy/operations package for every scenario, run, metric, and reviewer | Candidate hash and complete dependency manifest | Release Quality; all six reviewers | Immutable manifest and attachment inventory | Every result and signature references the identical package | **Not run — Pending**; blocks every execution claim | No fixed candidate package exists | Pending | Pending |
| `CL-P08`; durable evidence | Durable visible, assistive, lineage, authoritative timing, decision, delivery, privacy, switch, correction, rerun, and rollback evidence | Exact attachment and evidence versions | Release Quality plus evidence owner; all six reviewers | Tamper-evident evidence index and attempt links | Every expected/prohibited check and reviewer decision supported | **Not run — Pending**; blocks Pass and signoff | No working-product attachments, delivery, correction, rerun, or rollback evidence | Pending | Pending |

## Ordered six-stage gate

Stages cannot be skipped, run out of order, or credited by later evidence.

| Stage | Entry condition | Required work | Passing condition | Stop condition |
|---|---|---|---|---|
| 1. Prerequisites accepted | None | Close `CL-P01`–`CL-P08` on one package | Every prerequisite **Run — Pass** | Any Pending, Fail, Inconclusive, Not measured, Not observed, missing dependency/reviewer/lineage |
| 2. Mandatory synthetic/replay/shadow scenarios | Stage 1 Pass | Run every mandatory scenario, boundary, truth replay/shadow/later outcome, accessibility suite, and Task 9 drill | Every required attempt **Run — Pass** with complete attachments and reviews | Any expected miss, prohibited output, missing later outcome, or incomplete attempt |
| 3. Silent evaluation | Stages 1–2 Pass and Task 8 choices frozen | Run approved observation period without rider delivery; score Planned and Unplanned separately | Every target, zero-tolerance guardrail, stratum, and reviewer requirement Pass | Target breach, empty/immature denominator, required Not observed, privacy/lineage breach |
| 4. Limited rider pilot may begin | Stages 1–3 Pass and explicit pilot authorization | Exercise limited delivery, route/global stop, queue cancellation, correction, incident, and privacy-safe aggregate review | Pilot begins only inside fixed population/containment; this is not release GO | Any trust, accessibility, privacy, operations, or lineage breach |
| 5. Pilot review | Stage 4 authorized and fixed pilot period complete | Review metrics, opt-outs, false positives, incidents, holds, corrections, rollback, all strata, and six decisions | Every blocker closed and every required result Pass on candidate | Any open blocker, failed/incomplete required result, missing approval, or unproven rollback |
| 6. Final disposition | Stages 1–5 Pass | Apply GO / CONDITIONAL GO / NO-GO rules to one signed package | Controlling decision recorded with six same-package decisions | Missing package, signature, evidence, or unresolved blocker |

Pilot authorization is not release GO.

## Result vocabulary

Use exactly:

- **Not run — Pending** — no complete fixed-version attempt.
- **Run — Pass** — all expected, prohibited, evidence, measure, and reviewer checks pass.
- **Run — Fail** — expected miss, prohibited output, target failure, or **Changes required**.
- **Run — Inconclusive** — a run exists but input, lineage, denominator, attachment, dependency, later outcome, measure, or review cannot support Pass or Fail.
- **Not measured** — no valid denominator or approved measure.
- **Not observed** — the phenomenon did not occur in the observation window.

## Conservative aggregation

| Evidence state | Gate consequence |
|---|---|
| Any blocking prerequisite, scenario, stratum, metric, drill, review, or rollback **Run — Fail** | NO-GO |
| Any required Not run — Pending, Run — Inconclusive, Not measured, Not observed, missing reviewer, missing attachment, or missing lineage | NO-GO for incomplete evidence |
| Corrected attempt Pass | Original failure remains; only the new attempt is evaluated for the corrected candidate |
| Planned Pass and Unplanned Fail/incomplete | NO-GO; never average |
| Zero incidents, zero exposure, zero denominator, or empty log | No safety credit |
| All blocking evidence Pass | Eligible for the next ordered stage only |

Every blocking item must Pass. Conservative Suppress or Hold is not a failure when correct, but it must still have complete fixed evidence.

## Mandatory scenario and stratum coverage

| Coverage family | Required cases |
|---|---|
| Approved specification | 36 unused segment; 37 saved-origin bypass; 38 wording-only equivalent; 39 required elevator failure; 48 delay/persistence; 42 wherever freshness affects the decision |
| Operating periods | Ordinary weekday, overnight with service-date ownership, planned weekend work, and at least one observed Unplanned synthetic/shadow stratum |
| Accessibility | Blocking path impact, complete current path, ARO hard constraint, equipment boundaries, verified alternative, `IMP-01`–`IMP-14`, real pilot coverage |
| Truth and recovery | Feed degradation, alert current/stale, disappearance versus verified recovery, replay, current shadow, later stop outcomes, negative-evidence precedence |
| Permission and Offline | Explicit enable, deny, restrict, revoke, restore, Offline, location denial with saved fallback, save without alerts, and no replay |
| Operations | Episode/route/global holds, nested OR precedence, queue cancellation, board/unaffected-route isolation, correction, recovery, rollback |
| Privacy | Delete, reset, token, post-revoke, no personal analytics/join, aggregate-only pilot evidence |
| Measurement | Planned/Unplanned, every message/impact/source-coherence class, double review, disagreement, missing lineage, correction/rerun |

Missing Unplanned observation is **Not observed**, never coverage and never Pass.

## Unchanged quantitative and zero-tolerance gates

| Gate | Exact rule | Failure effect |
|---|---|---|
| Actionability | Unrounded `≥85%`; exactly 85% passes; zero denominator is Not measured | Target failure or Not measured required cell blocks |
| Non-actionable frequency | `<1.0` per approved active-commuter-month; exactly 1.0 fails | Target failure or absent approved denominator blocks |
| Equivalent duplicates | `=0`; three equivalent deliveries mean two duplicates | One accepted duplicate stops |
| Eligible blocking accessibility | `100%` when evidence/gates ready before start and `delivery_time < window_start`; exactly start is late; evidence first accepted at/after start excluded and separately reported | Any eligible late case stops; required empty denominator blocks |
| Relevance | Zero wrong route/direction/segment/constituent/entrance/exit/transfer/path/consequence | One accepted violation stops |
| Currentness | Zero stale, no-longer-effective, or resolved delivery | One accepted violation stops |
| False negatives | Zero deterministic should-Send miss; no invented percentage | One deterministic miss stops |
| Privacy and lineage | Zero breach and complete denominator/evidence lineage | One breach or missing lineage stops |
| Reviewer agreement | Two independent reviewers agree; all mandatory reviewers decide same package | Disagreement is Inconclusive and blocks |

Required Planned and Unplanned results remain separate; either Not measured or Inconclusive blocks.

## Unchanged Task 3, Task 5, and Task 6 boundaries

| Boundary | Exact result |
|---|---|
| Added-journey tolerance | `T ∈ {300,600,900}` and qualify only `ΔJ > T`: 299/300 Suppress and 301 qualifies; 599/600 Suppress and 601 qualifies; 899/900 Suppress and 901 qualifies |
| Persistence | Two distinct coherent updates spanning `≥60` authoritative seconds; one update or 59 seconds Hold; exactly 60 may Pass only after final recheck |
| No-arrival | `W > max(720,2H)`; equality Suppresses |
| Gap | `G ≥ max(2H,H+360)`; equality qualifies |
| Opportunity | `[start−lead,end)`; exact end is outside |
| Escalation | Added time `≥300` seconds; 299 Suppresses, exactly 300 and 301 pass |
| Extension into window | `≥1800` seconds; 1799 Suppresses, exactly 1800 and 1801 pass |
| Planned content | Accepted before prep start waits until prep start and current recheck |
| Quiet behavior | Task 6’s 900-second quiet-period proposal is unapproved and is not a gate input |

## Unchanged Truth and accessibility boundaries

- Alert context is Current through exactly 600 seconds and stale at 601.
- Real-time feed is Current through exactly 90 seconds, Degraded from 91 through exactly 180, and Unavailable at 181 or any stricter invalidating condition.
- Arrival Truth requires at least 99.9% live-label freshness, 100% Scheduled labeling, 100% detected-hold freeze, and no known systematic bypass false-positive source.
- Source/feed revalidation, replay cohorts, current shadow, later-stop comparison, boundary families, and Product/Data Quality/Operations approval must all Pass.
- Accessibility consumes every owner suite unchanged, including complete path/ARO/equipment boundaries, `IMP-01`–`IMP-14`, scenario 39, exact coverage rows, verified alternatives, and visible/assistive parity.
- No real accessibility row or observed denominator may be inferred from documentation, an empty register, or `0/0`.

## Scenario-attempt schema

Every attempt in the [scenario results](commute-alert-scenario-results.md) contains:

- stable scenario and sequential attempt IDs;
- fixed build, artifact, configuration, source, data, copy, privacy, and operations versions;
- mode, Planned/Unplanned, operating-period stratum, message class, and impact class;
- authoritative source/evaluation times, New York service date, window/lead, effective period, currentness, anomaly, and quarantine;
- complete Tasks 2–9 expected and actual decisions;
- expected and prohibited visible, assistive, queue, switch, board-isolation, and delivery results;
- actual result and durable attachments;
- two independent adjudicators and all mandatory reviewer decisions/dates/signatures;
- deviation, bounded correction, preserved original, new version, and rerun; and
- final vocabulary result.

## Pilot privacy boundary

Real-pilot records contain only privacy-approved aggregates. They contain no rider/account/device/advertising/token/stable pseudonym; no commute/window/occurrence/ledger ID; no exact origin–destination–window, location, permission history, accessibility preference, message body, or free text; and no stable or reversible join capable of reconstructing a journey. Unsafe cells are Inconclusive; no floor is invented.

## Rollback evidence

Before any limited pilot or release consideration, prove on the fixed candidate:

- route and global holds engage under one Commander and use OR precedence with episode holds;
- unsent matching queues cancel and the final send path rereads switches;
- rollback does not replay held, failed, stale, ended, Offline, outside-window, or Unknown work;
- saved commutes, explicit intent, permissions, ledger, ARO, maps, boards, and unaffected routes remain unchanged by the commute switch;
- privacy deletion and token containment complete;
- correction history and original failures remain append-only; and
- automatic rollback triggers include every accepted duplicate, wrong scope/currentness, deterministic miss, accessibility, privacy, target, lineage, and operations breach.

## Draft review checklist

- [ ] `CL-P01`–`CL-P08` bind one immutable candidate and complete evidence.
- [ ] Six stages run in order and pilot authorization is not GO.
- [ ] Result vocabulary and conservative aggregation are exact.
- [ ] Every mandatory scenario, stratum, threshold, Truth boundary, and accessibility suite is unchanged.
- [ ] The Task 6 quiet-period proposal is not a gate input.
- [ ] Every quantitative and zero-tolerance gate has a valid nonzero lineage where required.
- [ ] Attempt, privacy, correction, signature, and rollback schemas are complete.
- [ ] Task 10 changes no upstream decision.

Every unchecked item blocks advance. This documentation commit is not evidence.
