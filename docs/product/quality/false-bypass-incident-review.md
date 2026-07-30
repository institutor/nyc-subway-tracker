# False-bypass incident review

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3.1–3.3, 31.2, 34; arrival-truth and service-changes plan Task 13 `Artifacts` and `Ordered steps` |
| Owner | Data Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Not run — Gate 0 validation results](gate-0-validation-results.md) |

## Purpose and current incident state

This record defines the required review for any arrival shown at an exact directional stop that current accepted evidence identified—or later determinate stop-progress evidence confirms—the train bypassed or did not serve. It applies to rider exposure, replay, and zero-exposure shadow findings. It preserves the original decision and evaluates it without using hindsight as retroactive arrival authority.

Validation has not run. Therefore the current incident inventory is **Not assessed — no fixed working-product evidence exists**. “No incidents recorded” while tests are unrun is not safety evidence and cannot support Gate 0.

One confirmed false bypass blocks public arrival boards. Severity cannot be reduced because the finding occurred only in shadow or replay; zero exposure changes harm, not the truth defect.

## Intake and immediate containment

Open an incident as soon as a reviewer has a reconstructable admitted exact-stop claim and current or later accepted evidence that the train bypassed or did not serve the target. If identity or later progress remains uncertain, open a blocking potential incident with state **Inconclusive** rather than declaring either safe service or a confirmed bypass.

Immediate controls are mandatory:

1. block the affected public arrival claim and dependent guidance;
2. determine whether the defect can affect adjacent stops, directions, routes, service patterns, source editions, or route/feed groups;
3. widen containment only to that evidenced or materially unresolved common-cause scope;
4. if the safe boundary cannot be established, keep all public arrival boards blocked;
5. preserve the fixed candidate, source observations, decision provenance, public result, and later progress before correction; and
6. allow further evaluation only in zero-rider-exposure shadow after a fixed corrected product version exists.

No alert, schedule, support note, manual confidence, or correction may fabricate movement, a stop call, clearance, or recovery.

## Incident record

Every incident uses a stable ID and retains the following fields. No field may be deleted after closure; corrections append a linked revision.

| Record section | Required fields |
|---|---|
| Identity and fixed version | Incident ID; state; severity; discovery time; discoverer role; fixed working-product version; behavior-policy version; source-revalidation version; cohort/run/candidate IDs; affected catalog and Task 11 stable IDs; original result link; and superseding corrected-version link. |
| Exact operational scope | Route; route/feed group; station complex; constituent station; exact directional stop; normalized direction; train instance; trip identifier when supplied; service date; destination; segment; actual/scheduled track; service-change ID/effective period; and every known adjacent claim sharing the suspected cause. |
| Exposure and harm | Replay, shadow, or rider release; exact exposure start/end; exposed decision count; rider sessions only when measured without personal linkage; dependent guidance/notification exposure; likely rider consequence; accessibility consequence if applicable; zero-exposure confirmation; and harm-severity rationale. |
| Source timeline | Every source observation and retrieval time; authoritative comparison; age/freshness; supplemented/static edition and coverage where relevant; alert structured scope and official text; accepted/rejected/quarantined state; source revalidation; and last independently coherent evidence. |
| Decision timeline | Candidate creation; every admission/veto/confidence/suppression/fallback/ordering decision; public presentation; correction; recovery attempt; exact working-product version and policy at each step; and reviewers who changed a disposition. |
| Conflict and later progress | Positive claim; negative or materially unresolved evidence; conflict time; target-stop progress before/at/after the decision; determinate served/bypassed/not-served outcome or **Not observed**; identity confidence; comparison result; and why later evidence evaluates but does not rewrite the original decision. |
| Common-cause search | All adjacent stops, directions, routes, service patterns, source records/editions, route/feed groups, time windows, decision classes, and product versions searched; selection basis; findings; bounded unaffected scope; and unresolved scope. |
| Containment | Public claim removed; dependent guidance removed; broader board block if needed; exact scope; effective time; owner; verification evidence; rider communication if any; shadow-only rule; release prerequisite; and evidence that containment itself did not create a positive claim. |
| Correction and threshold implication | Root cause; non-fabricating correction; affected artifacts returned to Draft; before/after behavior; whether an approved threshold, uncalibrated phrase, source assumption, identity rule, scope rule, or route/feed mapping contributed; proposed policy change and reviewer path; and proof the correction did not use later outcome as earlier authority. |
| Prevention and durable evidence | Source revalidation change; provenance/review control; new or strengthened boundary case; anomaly/monitoring signal; owner; due date; retained risk-register evidence; and future source-version-change trigger. |
| Review and closure | Product, Data Quality, Operations, and every affected domain reviewer; decision/date/version; closure checklist; original/adjacent/integrated/holdout/current-shadow rerun links; remaining deviations; both Gate 0 condition assessments; closure decision; and immutable closure record. |

## Investigation sequence

1. **Reconstruct.** Reproduce the original decision only from evidence available at its decision time using the [arrival-truth decision review template](arrival-truth-decision-review-template.md). Missing provenance is itself a blocking defect.
2. **Bound harm.** Separate rider exposure from replay/shadow. Count exposed claims and dependent experiences; do not infer zero harm from absent personal data.
3. **Establish the conflict.** Identify the exact positive arrival claim, the current veto or later determinate stop outcome, and when each became knowable.
4. **Search common cause.** Census the fixed window and every materially related scope before declaring the incident isolated.
5. **Contain conservatively.** Remove unsupported claims. Do not add replacement arrivals, movement, normal-service claims, schedule times, or equipment states.
6. **Correct without fabrication.** Change only the decision logic or evidence treatment supported by accepted sources. Return every materially affected governed artifact to **Draft** before review.
7. **Rerun broadly.** Preserve the original failing run, then execute the required rerun set below against one fixed corrected version.
8. **Review independently.** All mandatory and affected-domain reviewers decide on the same evidence package.

## Required rerun set

| Rerun class | Required evidence |
|---|---|
| Original | Exact incident candidate, evidence timeline, public result, prohibited check, and later outcome now behave conservatively. |
| Adjacent boundaries | Immediate route/station/direction/segment/time/identity/scope boundaries on both sides, including the applicable lower-count/exact/just-over/recovery-one/recovery-two cases. |
| Integrated catalog | Every affected **AT-S** stable scenario, all integrated assertions, and every Task 11 quarantine/correction case touched by the cause. |
| Independent holdout | A preregistered source window not used to choose or shape the correction, with equivalent risk conditions and determinate later progress. |
| Current shadow | A new contemporaneous, source-revalidated, zero-exposure current-MTA window on the fixed corrected version, including affected and unrelated route/feed groups. |

A passing original rerun alone never closes the incident. Missing or **Not observed** holdout/current-shadow evidence is **Inconclusive** and remains blocking.

## Closure standard

An incident may close only when all of the following are demonstrated:

- the original decision is fully reconstructable from preserved evidence and fixed versions;
- rider or shadow exposure and harm are bounded, with unresolved scope treated conservatively;
- containment is verified, remains rider-safe, and has not manufactured a positive claim;
- root cause and common-cause scope are established;
- the correction is source-supported, non-fabricating, and every affected artifact has returned to Draft and completed its full review path;
- Product, Data Quality, Operations, plus Accessibility, Content, Privacy, or other domain reviewers required by each affected artifact have all approved the same corrected evidence set;
- the original, adjacent-boundary, integrated, independent-holdout, and current-shadow reruns pass for one fixed corrected version;
- durable prevention and risk evidence is recorded in the [arrival-truth risk register](arrival-truth-risk-register.md);
- no related blocking deviation, unresolved signal, **Not observed**, or **Inconclusive** result remains; and
- both Gate 0 exit conditions are demonstrated: **No known systematic source of bypassed-stop false positives** and **all degraded states visibly honest**.

Closure does not erase the incident, earlier failure, containment, artifact Draft transition, or reruns. A closed incident may support reconsideration of Gate 0; it never authorizes release by itself.

## Incident register

| Incident ID | Fixed version | Scope | Rider exposure | Result | Containment | State | Closure evidence |
|---|---|---|---|---|---|---|---|
| Not assigned | Not available | Not assessed | Not assessed | **Not assessed — validation not run** | Public arrival boards blocked by [Gate 0 exit record](gate-0-exit-record.md) | Not assessed | Not available |

This row must not be described as “zero incidents.” The denominator, candidate behavior, current shadow, and later outcomes are absent.
