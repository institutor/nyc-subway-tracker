# Gate 0 truth-validation protocol

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§29.1, 32.1, 34; arrival-truth and service-changes plan Task 13 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Not run — Gate 0 validation results](gate-0-validation-results.md) |

## Purpose, authority, and present state

This protocol defines the behavior evidence required before any public arrival board. It does not approve an arrival rule, create a new scenario outcome, or treat a document review as proof of working-product behavior. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md), [arrival-truth acceptance catalog](arrival-truth-acceptance-catalog.md), and [arrival-truth requirement traceability](arrival-truth-requirement-traceability.md) retain decision authority.

Gate 0 is presently **not executable to a pass decision** because no fixed reviewed working-product version, source-revalidated cohort set, replay, current-data shadow run, later-stop-progress comparison, route/feed-group anomaly run, or mandatory review evidence exists. The current [exit record](gate-0-exit-record.md) is therefore a blocking no-go. A documentation commit is not a working-product version and cannot satisfy any observed-behavior field below.

Expected cases in Draft artifacts are hypotheses to test. **Not run**, **Not measured**, **Not observed**, and **Inconclusive** never mean Pass.

## Entry controls and evidence freeze

Before the first result is collected, the Release Quality Lead must freeze one candidate validation package. All fields are required and immutable for that package:

| Entry control | Required frozen evidence | Failure disposition |
|---|---|---|
| Working-product candidate | Unique product version/build identity; creation time; behavior configuration; data/correction policy version; reviewed arrival-truth artifact versions; release channel; and evidence that the exact version can be replayed and shadowed. | No run may be credited. A docs-only commit or policy revision is insufficient. |
| Source revalidation | Dated revalidation of every official source, field meaning, route-to-feed-group assignment, publication behavior, revision/effective date, and material semantic change against the [source evidence register](../arrival-truth/source-evidence-register.md). | Affected source, cohort, route, and scenario are **Inconclusive** and block exit. |
| Route/feed inventory | Complete, dated inventory of every in-scope subway route, its feed group, shared-group relationships, exact directional-stop coverage, and an independent unrelated-group control. | Missing groups cannot be assumed equivalent; Gate 0 blocks. |
| Cohort preregistration | Exact source window start/end, service date, operating period, route/feed groups, event basis, expected strata, exclusion rules, later-outcome horizon, and selection rationale for every cohort below. | Post-outcome selection is prohibited; replace with a new preregistered package. |
| Review package | Fixed protocol, catalog, traceability, risk register, incident process, privacy exclusions, reviewers, and deviation-severity rules. | Results remain Draft and cannot authorize public boards. |

Any candidate change that could alter ingestion, timing, identity, stop matching, service-change scope, feed health, confidence, suppression, recovery, fallback, rider presentation, or provenance creates a new working-product version. Preserve the earlier results; do not relabel them as results for the new version.

## Preregistered evidence cohorts

Replay windows and the current shadow window are separate evidence. One cannot substitute for another.

| Cohort ID | Required preregistered slices | Required decision coverage |
|---|---|---|
| **G0-R1 — Normal weekday** | At least one source-revalidated weekday peak window and one source-revalidated weekday off-peak window, each with exact start/end and service date fixed before outcome inspection. | Normal Live and Expected admission, ordering, identity continuity, ordinary holds, healthy-horizon absence, route/feed isolation, and all dispositions that occur in the census. |
| **G0-R2 — Weekend planned work** | A source-revalidated weekend window with an officially evidenced planned change, including before-active and active intervals where available. | Supplement selection, active-period boundary, direction/station/segment localization, bypass/reroute/short-turn/closure consequences, static vetoes, unaffected-service preservation, and recovery observations available in the fixed window. |
| **G0-R3 — Late night and midnight** | A source-revalidated late-night window spanning an operating-service-date boundary, including beyond-`24:00` service where present. | Service-date continuity, midnight ordering, identity continuity, feed health, fallback eligibility, and honest late-night presentation. |
| **G0-R4 — Major disruption** | One source-revalidated disruption with separately fixed pre-event, active-event, and recovery windows. | Positive-versus-negative evidence, materially unresolved scope, admitted/suppressed/unavailable claims, alert evolution, feed anomalies, recovery sequences, and unaffected controls. |
| **G0-S1 — Current MTA shadow** | A separate contemporaneous window fixed before inspection, using source semantics revalidated for that run and the exact candidate used for replays. Zero rider exposure is mandatory. | Census of all candidate decisions, current route/feed behavior, later-stop-progress review, provenance completeness, trust metrics, and incident detection. |

If a required phenomenon does not occur naturally in a fixed cohort, record **Not observed**. Exercise it with the pre-registered catalog or anomaly fixture, but do not claim that the fixture supplies current-MTA shadow evidence. Major-disruption pre, active, and recovery periods remain separate result slices even when drawn from one operational event.

## Required record for every run and candidate

Every source window receives a run record. Every evaluated exact directional-stop claim receives a candidate/decision record, including candidates that never become rider rows.

| Record family | Exact required fields |
|---|---|
| Run identity | Gate package ID; run ID; replay or shadow; cohort ID and slice; fixed working-product version; behavior-policy version; source-revalidation record; route/feed inventory version; source window start/end; authoritative comparison basis; service date; New York operating period; run start/end; zero-rider-exposure confirmation for shadow; and superseding rerun link. |
| Candidate identity | Stable candidate ID; linked run; route; route/feed group; station complex; constituent station; exact directional stop; normalized direction; destination; train instance; published trip identifier retained internally when supplied; service date; segment; actual/scheduled track context; prior decision link; and source-supported claim type. |
| Provenance | Every source type and immutable observation reference; source and retrieval timestamps; authoritative age; effective period; edition identity and coverage when applicable; structured and text scope; completeness/decoding/chronology result; accepted, rejected, or quarantined status; last independently coherent evidence; every transformation and gate; every veto; correction link; and final reason. |
| Public result | Decision time; admitted, suppressed, arrival claim unavailable, quarantined, Holding, Uncertain, Scheduled fallback, no estimate, or board-level limitation; primary/secondary/no placement; exact time treatment; state/freshness label; route/direction/destination; service-change copy; assistive-reading equivalent; next-three position; and explicit rider exposure **No** for replay/shadow. |
| Later outcome | Observation window; source observation references; target-stop progress before/at/after the decision; served, bypassed/not served, still pending, or **Not observed**; time of determination; identity confidence; contradictory evidence; and any operational caveat. |
| Comparison | Original decision class; later-outcome class; compatible, over-suppressed, false bypass, other false positive, false negative, or **Inconclusive**; comparison reason; whether a trust-metric numerator/denominator is affected; incident ID when required; and related/adjacent scenario IDs. |
| Review | Expected catalog stable ID or Task 11 case ID; expected result; actual visible result; every prohibited-outcome check; reviewer role and named reviewer; decision date; Approve or Changes required; deviation ID; correction; rerun; and preserved earlier result. |
| Privacy | Operational-data purpose; allowed route/station/direction/service-period slice; explicit confirmation that no rider account, saved commute, device identifier, notification token, search history, precise rider location, or personal travel history was collected or linked; retention owner; access roles; and deletion date or approved retention end. |

Later stop progress is evaluation evidence only. It must never be inserted into the earlier provenance envelope, used to rewrite the earlier decision, or treated as proof that the product could have known the outcome at decision time.

## Census, manual review, and outcome comparison

1. **Decision census first.** Capture every candidate and every final disposition in every fixed replay and shadow window: admitted Live/Expected, suppressed, arrival claim unavailable, quarantined, Holding/Uncertain, Scheduled fallback, and no estimate. Reconcile source candidates, decision records, and public results so missing records cannot disappear from the denominator.
2. **Stratify before later-outcome inspection.** At minimum stratify by cohort/slice, route/feed group, route, station/direction, terminal versus non-terminal context, decision disposition, service-change consequence, feed-health state, recovery phase, and schedule source/currency.
3. **Census rare or high-impact strata.** Manually review every bypass/reroute/short turn/closure/suspension/track conflict, materially unresolved high-impact claim, identity quarantine, bulk drop, timestamp regression, suspicious emptiness, hard suppression/readmission, Scheduled fallback under an active change, forbidden correction attempt, and candidate later shown by evidence to have skipped the target.
4. **Sample common strata deterministically.** Before outcomes are opened, register a target count for every remaining stratum, a stable ordering field, and a fixed start/selection interval. Review the selected records in that order. If the census contains fewer records than the target, review the entire stratum and report its actual denominator.
5. **Preserve non-observation.** A missing later outcome is **Not observed**, not served, not bypassed, and not Pass. Required rare/high-impact coverage with no observation is **Inconclusive** and blocks Gate 0 until a preregistered replay, holdout, or later current shadow supplies determinate evidence.
6. **Compare without hindsight authority.** A later served target may show a suppression was conservative; it does not prove the original positive evidence passed. A later bypass after an admitted claim opens a false-bypass review; it does not erase the exact evidence and decision available earlier.

An **Inconclusive** result states the missing field, affected route/feed group and stable case, conservative containment, owner, and evidence needed to resolve it. It remains in the deviation register and cannot be averaged away.

## Required scenario and control execution

The fixed candidate must produce a separate actual result for every stable truth-owned catalog ID **AT-S01–AT-S20, AT-S40–AT-S44, AT-S49, and AT-S50**. Expected prose is referenced from the catalog; it is not copied into a new authority. Each run records actual rider result, prohibited-result checks, provenance, later outcome when applicable, reviewer decision, failure/correction/rerun, and version.

The same fixed candidate must also execute:

- every numeric boundary family and count gate in the catalog's [numeric boundary-pair and count-boundary inventories](arrival-truth-acceptance-catalog.md#numeric-boundary-pair-inventory);
- a separate result for Task 11 cases **Q1–Q8, P1–P4, and F1–F3** from [quarantine and recovery review cases](quarantine-recovery-review-cases.md); and
- all integrated release assertions in [arrival-truth requirement traceability](arrival-truth-requirement-traceability.md#integrated-release-assertions).

No shared result may hide a failed branch. Exact-boundary, just-over, lower-count, required-count, control, recovery-one, and recovery-two runs are separately identifiable.

## Route/feed-group anomaly matrix

Every source-revalidated route/feed group must have its own row of results. Shared infrastructure or a passing neighboring group is not equivalence evidence.

| Required per-group run | Passing evidence |
|---|---|
| Current and age boundaries | Current at 90 whole seconds; Degraded at 91 and 180; Unavailable at 181; correct precision and frozen/unavailable presentation. |
| Timestamp regression | Regressed snapshot excluded; prior coherent context frozen only as governed; exact countdown stops; unrelated group remains independent. |
| Suspicious emptiness | Empty/implausibly empty complete-looking snapshot is quarantined; no mass cancellation or normal-service inference. |
| Fixed bulk-drop fixtures | Using one fixed 100-entity baseline: contextual **39/100** proves there is no safe harbor below 40; **40/100** triggers the approved anomaly boundary; **41/100** proves the first integer count above. Every branch records operational context and the same denominator. |
| Unrelated-group isolation | At least one explicitly mapped unrelated healthy group stays independently live while the affected group is frozen or unavailable. |
| Two-snapshot recovery | Recovery snapshot one restores nothing; a second consecutive fresh, complete, valid, non-regressed, credibly populated coherent snapshot permits only individual reevaluation. A nonqualifying intervening snapshot breaks the pair. |

Missing inventory or any missing group/run is **Not run — blocks exit**. A no-observation result does not establish route/feed coverage.

## Trust metrics and release math

Each metric is reported for the same fixed working-product version, with replay and current shadow separated and a combined view only after both are complete.

| Metric | Numerator | Denominator | Target and zero-denominator rule |
|---|---|---|---|
| Known released false-bypass arrivals | Confirmed admitted exact-stop claims exposed to riders that current evidence identified, or later determinate evidence confirmed, as bypassed/not served. | All rider-exposed admitted exact-stop claims; separately report how many have determinate and **Not observed** later outcomes. | **0 known cases released to riders.** Zero exposure is reported as `0/0 — Not measured`, not used as validation proof, and never described as a tested pass. Any numerator above zero blocks release. |
| Live-label freshness compliance | Live labels whose authoritative feed and movement ages met every current freshness rule at presentation. | All Live labels in the complete decision census. | **≥99.9%.** Zero denominator is **Not measured**. Report numerator, denominator, percentage, and every noncompliant decision ID. |
| Fallback labeling | Static or supplemented departure times visibly labeled **Scheduled** with the governed unavailable/freshness treatment. | All static or supplemented departure times shown. | **100%.** Zero denominator is **Not measured**. |
| Detected-hold countdown freeze | Detected held-train presentations whose time stopped decrementing and whose precision/placement matched policy. | All detected held-train presentations. | **100%.** Zero denominator is **Not measured**. |

Gate 0 additionally reports a validation-only false-bypass comparison: confirmed false bypasses among replay/shadow admitted exact-stop claims divided by all replay/shadow admitted exact-stop claims with determinate later outcomes, with **Not observed** outcomes reported separately. The required numerator is zero and the denominator must be nonzero across the preregistered required strata. This comparison can demonstrate validation behavior without inventing rider exposure; it does not convert the `0/0` released-to-riders metric into a measured result.

Known-outage accessible routing and unknown equipment-state safety targets in specification §29.1 are owned by the Accessibility and Platform Guidance workstream and its release-gate artifact. Gate 0 records neither a pass nor a substitute result for them.

## Deviations, incidents, and blockers

Every deviation receives a stable ID, discovery time, severity, fixed version, affected route/feed group and stable scenario/control ID, evidence, rider exposure, conservative containment, owner, correction, closure evidence, reruns, reviewers, and state.

- **Critical:** could admit, retain, restore, or imply service at a bypassed or materially unresolved stop; could make a degraded state look current/live; or destroys reconstructability. It blocks Gate 0.
- **Major:** required cohort, route/feed group, case, later outcome, metric, source revalidation, or mandatory review is missing or inconclusive. It blocks Gate 0.
- **Minor:** evidence is complete and rider-safe but a non-gate administrative defect remains. It must still close or be explicitly accepted by every mandatory gate reviewer.

One confirmed false bypass invokes the [false-bypass incident review](false-bypass-incident-review.md) and blocks public boards. An unresolved systematic source, a dishonest degraded state, a required **Not run**, a required validation metric that is **Not measured**, a required **Not observed**, an **Inconclusive**, missing provenance, or missing mandatory review also blocks exit. The pre-release `0/0` rider-exposure metric cannot establish safety, but it does not replace the required nonzero replay/shadow validation denominator.

## Review and exit sequence

1. Release Quality reconciles every run, candidate, result, metric, incident, and deviation to the fixed version.
2. Data Quality verifies source revalidation, route/feed inventory, provenance, later outcomes, anomaly coverage, metrics, and common-cause searches.
3. Product verifies rider claims, prohibited outcomes, conservative containment, and that no expected result was substituted for observation.
4. Operations verifies the service-event interpretation, operational periods, route/feed behavior, rider harm, and containment practicality.
5. Each required reviewer records **Approve** or **Changes required** against the same result package. Silence is Pending.
6. The [Gate 0 exit record](gate-0-exit-record.md) may receive pass authorization only if both quoted exit conditions are demonstrated, every blocking deviation and incident is closed with preserved evidence, and all required artifact-specific reviews are complete.

Product, Data Quality, and Operations review of these Gate 0 artifacts cannot bulk-approve underlying artifacts whose mandatory sets also include Accessibility or Content. Those reviewers must decide those artifacts against their own fixed evidence package under the [review and approval policy](../review-and-approval-policy.md).
