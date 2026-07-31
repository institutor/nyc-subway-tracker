# Commute alert launch scenario results

| Governance field | Value |
|---|---|
| Source authority | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 32.3, 33.5, 34, 36–39, 42, and 48; commute alerts and launch quality plan Task 10 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Launch checklist | [Commute alert launch checklist](commute-alert-launch-checklist.md) |
| Controlling decision | [Commute alert go/no-go record](commute-alert-go-no-go-record.md) |

## Purpose and evidence boundary

This register owns append-only definitions and fixed-version execution attempts for the 27 mandatory Task 10 fixtures. It does not approve a prerequisite, authorize a pilot, change a Tasks 1–9 decision, or own the release disposition. A definition is not an execution result. Documentation, an empty log, zero incidents, zero exposure, zero denominator, or an unobserved condition provides no passing evidence.

The fixture definitions below are frozen before observation. Any correction creates a bounded new fixture version and sequential attempt; it never changes or removes the original input, actual result, attachments, adjudication, review, or failure.

## Fixed attempt package

All 27 initial attempts are bound to package reference `CLG-PKG-01`. The accepted Tasks 1–9 repository baseline is `a35144d3c3ca049cb2b761b1b8a833c6c151f41f`; acceptance signatures and executable evidence are still Pending. The remaining package fields are not yet fixed.

| Required immutable field | `CLG-PKG-01` value |
|---|---|
| Product build and release candidate | **Not run — Pending** |
| Task 10 artifact commit and blob identities | **Not run — Pending** |
| Tasks 1–9 governed approvals and scenario attempt set | **Not run — Pending** |
| Configuration, feature switches, route/episode/global hold state | **Not run — Pending** |
| Static, supplemented, real-time, alert, accessibility, mapping, and rights source editions | **Not run — Pending** |
| Synthetic, replay, current shadow, later-outcome, silent, pilot, and rollback datasets | **Not run — Pending** |
| Rider copy, visible output, assistive output, and language versions | **Not run — Pending** |
| Permission, Offline, privacy, deletion, reset, and token versions | **Not run — Pending** |
| Operations roster, queue, correction, incident, drill, and rollback versions | **Not run — Pending** |
| Task 8 sample, period, maturity, denominator, floor, retention, strata, and reviewer procedure | **Not run — Pending** |
| Evidence inventory, lineage manifest, reviewers, decisions, dates, and signatures | **Not run — Pending** |

No fixture may run until this package and every prerequisite in the [launch checklist](commute-alert-launch-checklist.md#required-prerequisite-evidence) are immutable and accepted. Every attempt must cite the same package identity; a package change requires a new package and new attempt.

## Attempt evidence contract

Each attempt must record, rather than infer:

- stable fixture ID, sequential attempt ID, definition version, and fixed package identity;
- fixed build, artifact, configuration, source, data, copy, privacy, and operations versions;
- mode; Planned or Unplanned stratum; operating period; message, impact, and source-coherence classes;
- authoritative source, observation, evaluation, queue, delivery, and later-outcome times; New York service date; commute window and lead; source effective period; currentness; anomaly; and quarantine;
- Tasks 2–9 eligibility, impact, source-coherence, timing, permission, deduplication, privacy, measurement, and operations decisions;
- expected and prohibited visible, assistive, queue, switch, board-isolation, correction, and delivery behavior;
- actual results plus durable visible, assistive, lineage, timing, decision, delivery, privacy, switch, correction, rerun, and rollback attachments;
- two independent adjudicators, mandatory specialist reviews, all six release reviewer decisions, dates, and signatures; and
- deviation, bounded correction, preserved original attempt, changed version, rerun link, and exact result vocabulary.

Phone time never strengthens authoritative source time. Required Planned and Unplanned cells remain separate. Reviewer disagreement is **Run — Inconclusive**. Missing lineage or a required attachment is **Run — Inconclusive**. A zero denominator is **Not measured**. An unobserved required phenomenon is **Not observed**. Each blocks advance.

## Frozen fixture definitions

### Approved-specification fixtures

| Fixture definition | Mode / stratum / class | Fixed authoritative input | Expected Tasks 2–9 decision and rider result | Gate result rule | Prohibited result |
|---|---|---|---|---|---|
| `CLG-S36` v1; specification 36 | Synthetic; ordinary weekday; Unplanned; saved-segment relevance | An otherwise valid disruption affects only a route segment that the saved commute does not use; source is current and coherent | Task 2 determines no saved-segment impact; Tasks 3–7 Suppress; no queue entry, push, visible alert, assistive announcement, or ledger delivery | Pass only when the unused segment produces no push and complete negative evidence exists | Any rider alert, queue residue, inferred affected segment, or use of engagement as evidence |
| `CLG-S37` v1; specification 37 | Synthetic; planned weekend; Planned; bypass | A current supplemented-GTFS/service-alert reroute bypasses the saved origin during the opportunity window and passes final source/path recheck | Task 2 resolves the saved-origin bypass; Tasks 3–7 Send exactly one actionable, route/direction/segment-specific push with matched visible and assistive content | Pass only for one actionable delivery inside `[start−lead,end)` with correct scope and lineage | Zero delivery, more than one equivalent delivery, scheduled arrival at bypassed stop, wrong scope, stale delivery |
| `CLG-S38` v1; specification 38 | Replay; ordinary weekday; Unplanned; equivalent wording | A delivered episode remains materially unchanged; a later current source update changes wording only and has the same normalized consequence | Deduplication recognizes equivalence; Tasks 2–7 Suppress the later candidate; original ledger remains unchanged | Pass only when wording-only change causes no second delivery | A second equivalent push, ledger overwrite, reset by copy text, or invented new episode |
| `CLG-S39` v1; specification 39 | Synthetic plus current shadow; ordinary weekday; Unplanned; blocking accessibility | A required elevator fails before an accessible commute; fixed complete-path/ARO evidence identifies the affected station-direction-path and an independently verified feasible alternative before window start | Accessibility hard constraint produces one timely path-scoped alert, names the consequence, and presents the independently verified alternative with visible/assistive parity | Pass only when delivery is before `window_start`, every path edge is in scope, and the alternative is independently verified | Generic station-wide warning, unavailable/unverified alternative, wrong entrance/exit/transfer, delivery at/after start, silent inaccessible routing |
| `CLG-S42` v1; specification 42 | Replay plus shadow; overnight service-date; Unplanned; freshness | Authoritative source chronology crosses current/degraded/stale boundaries while phone time is ahead, behind, or changed | Every affected Tasks 2–9 decision uses authoritative chronology and New York service-date ownership; phone time cannot turn stale into current or strengthen persistence | Pass only when source-time ordering controls every decision and expected Hold/Suppress/Unavailable states | Phone-time strengthening, mixed service dates, future-timestamp trust without quarantine, stale delivery |
| `CLG-S48` v1; specification 48 | Synthetic plus replay; ordinary weekday; Unplanned; inferred delay | Added journey is 240, 300, and 301 seconds; the 301-second case is observed at one update, 59 seconds, and exactly 60 authoritative seconds with a final recheck | 240 and exactly 300 Suppress; 301 remains Hold after one update or 59 seconds; at 60 seconds it may qualify only after two distinct coherent updates and final recheck | Pass only when the strict `ΔJ > 300` and `≥60` persistence boundaries are both preserved | Sending at 240/300, sending on one update/59 seconds, treating 60 seconds as automatic, or suppressing a fully rechecked qualifying 301 case without another valid blocker |

### Policy-boundary fixtures

| Fixture definition | Mode / stratum / class | Fixed authoritative input | Expected Tasks 2–9 decision and rider result | Gate result rule | Prohibited result |
|---|---|---|---|---|---|
| `CLG-B01` v1; Task 3 | Synthetic; ordinary weekday and overnight service-date; Unplanned; no-arrival/gap | For fixed headway `H`, no-arrival `W` and gap `G` are tested just below, exactly at, and just above their thresholds | No-arrival qualifies only when `W > max(720,2H)`; equality Suppresses. Gap qualifies when `G ≥ max(2H,H+360)`; equality qualifies. Downstream delivery still requires every other gate | Pass only when every below/equal/above decision matches the operators and full lineage is retained | Treating no-arrival equality as qualifying, gap equality as suppressing, mixing headways/service dates, or automatic Send |
| `CLG-B02` v1; Task 5 | Synthetic; ordinary weekday; Planned and Unplanned separately; escalation | An already delivered episode gains 299, 300, and 301 seconds of added journey under current coherent evidence | 299 Suppresses escalation; exactly 300 and 301 pass the escalation-change gate, then re-enter all final send gates and dedupe | Pass only for the `≥300` boundary and separate Planned/Unplanned evidence | Sending at 299, bypassing final recheck at 300/301, or averaging strata |
| `CLG-B03` v1; Task 5 | Synthetic; planned weekend; Planned; extension | Current planned work extends into the saved commute opportunity by 1799, 1800, and 1801 seconds | 1799 Suppresses extension; exactly 1800 and 1801 pass the extension-change gate, then re-enter timing/currentness/dedupe | Pass only for the `≥1800` boundary | Sending at 1799, treating 1800 as outside, or reusing a stale pre-extension decision |
| `CLG-B04` v1; Tasks 3 and Arrival Truth | Replay plus current shadow; weekday; Planned and Unplanned separately; source health | Alert age is 600 and 601 seconds; real-time age is 90, 91, 180, and 181 seconds, plus an invalidating condition | Alert: Current at 600, stale at 601. RT: Current through 90, Degraded 91–180, Unavailable at 181 or stricter invalidation. Downstream state follows source hierarchy and quarantine | Pass only when every boundary and transition is exact in visible/assistive labels and decisions | Current alert at 601, Current RT at 91, Degraded RT at 181, fallback represented as live, or delivery from invalid evidence |

### Measurement fixtures

| Fixture definition | Mode / stratum / class | Fixed authoritative input | Expected Tasks 2–9 decision and rider result | Gate result rule | Prohibited result |
|---|---|---|---|---|---|
| `CLG-M01` v1; Task 8 | Silent/pilot aggregate; Planned and Unplanned separately; actionability | Privacy-approved, mature, lineage-complete unrounded actionability rates of 84%, exactly 85%, and 86% | 84 fails; exactly 85 and 86 pass the `≥85%` target | Pass only with approved denominator, maturity, double review, and unrounded calculation | Rounding 84.x to 85, treating zero denominator as Pass, or averaging Planned and Unplanned |
| `CLG-M02` v1; Task 8 | Silent/pilot aggregate; Planned and Unplanned separately; nuisance | Approved active-commuter-month denominator yields 0.99, exactly 1.00, and 1.01 non-actionable alerts per unit | 0.99 passes; exactly 1.00 and 1.01 fail the `<1.0` target | Pass only with the preapproved active-commuter definition, floor, maturity, and lineage | Treating 1.00 as Pass, rounding, inventing a denominator, or joining rider journeys |
| `CLG-M03` v1; Task 8 | Synthetic plus pilot aggregate; all message classes; duplicate | Equivalent-delivery count is zero, then one, under the frozen normalization and ledger policy | Zero passes; one accepted duplicate fails and stops advance/initiates the scoped hold and incident path | Pass only at `=0` with complete opportunity and delivery lineage | Tolerating one duplicate, denominator normalization, ledger overwrite, or continuing delivery after stop criteria |
| `CLG-M04` v1; Task 8 and accessibility | Synthetic plus pilot aggregate; blocking accessibility; eligible/excluded | Complete path/equipment gates are ready before start. Delivery occurs at `S−1` and exactly `S`. A separate case first receives accepted evidence at/after `S` | Eligible `S−1` is timely; eligible delivery exactly at `S` fails because `delivery_time < window_start`; first evidence at/after `S` is excluded from the eligible denominator and reported separately | Pass only with 100% eligible timely delivery, exact denominator lineage, and separate excluded count | Calling exact-start timely, adding post-start evidence to eligible denominator, hiding excluded cases, or claiming 0/0 Pass |
| `CLG-M05` v1; Task 8 | Silent/pilot aggregate; same fixed candidate; Planned versus Unplanned | Planned cell passes every target; required Unplanned cell fails one target | Overall gate fails; strata remain separate and are not averaged or weighted into a Pass | Pass only when both required cells independently Pass | Averaging, substituting Planned evidence, relabeling Unplanned, or calling incomplete coverage Pass |

### Evidence, operations, privacy, accessibility, correction, and disposition fixtures

| Fixture definition | Mode / stratum / class | Fixed authoritative input | Expected Tasks 2–9 decision and rider result | Gate result rule | Prohibited result |
|---|---|---|---|---|---|
| `CLG-E01` v1; Task 8 | Silent aggregate; required cell; denominator | A required metric cell has zero eligible observations after the frozen floor and maturity rules | Result is **Not measured** and release remains blocked | Pass only after a later fixed attempt has a valid nonzero denominator and meets the target | 0/0 Pass, invented denominator, borrowing another stratum, or using zero incidents as evidence |
| `CLG-E02` v1; release review | Any execution mode; any required class; adjudication | Two independent reviewers reach different supported judgments on the same fixed evidence | Result is **Run — Inconclusive** and release remains blocked pending preserved disagreement and a governed new adjudication | Pass only in a new attempt with resolved criteria and required agreement | Majority vote, silent reviewer, overwritten dissent, or Product-only waiver |
| `CLG-E03` v1; evidence contract | Any execution mode; any required class; lineage | A run has an apparent expected result but lacks a mandatory source, timing, visible/assistive, delivery, privacy, or later-outcome attachment | Result is **Run — Inconclusive** and release remains blocked | Pass only after a new complete fixed attempt; a late attachment cannot rewrite the original | Inferring the attachment, calling the run Pass, editing the original, or substituting screenshots without lineage |
| `CLG-E04` v1; Tasks 2–7 | Synthetic/replay; Planned and Unplanned separately; conservative negative decision | Fixed evidence correctly requires Hold, Suppress, or a safety cap because a prerequisite is Unknown, stale, incoherent, ineligible, duplicated, outside-window, or held | Expected result is the exact conservative state with no rider delivery; it is not counted as a deterministic should-Send miss | Pass only when the negative state is correct, fully evidenced, labeled, and rechecked as required | Reclassifying a true should-Send miss, calling all suppression safe, or sending through Unknown/stale/hold |
| `CLG-O01` v1; Task 9 | Operations drill; ordinary weekday; route-scoped hold | One route alert path is held while another route, public boards, saved commutes, permissions, ARO, and maps are healthy | Matching commute alert delivery and queue work stop/cancel; unaffected route commute alerts and public boards continue; final send rereads switches | Pass only with switch, queue, delivery, board-isolation, and recovery attachments | Global outage, board freeze, saved-state mutation, unaffected-route cancellation, or queued leak |
| `CLG-O02` v1; Task 9 | Operations drill; planned weekend; global commute-alert hold | Global commute-alert hold engages with episode/route holds under OR precedence while product state and public boards remain available | All unsent commute-alert queue work cancels and no new commute alert delivers; saved state, permissions, ARO, maps, boards, and non-commute surfaces remain unchanged | Pass only with final-path reread, bounded cancellation, no replay, and isolation evidence | Cancelling board work, clearing saved state/permission/ARO, replay after recovery, or a post-hold send |
| `CLG-P01` v1; Tasks 7–9 | Privacy and incident drill; any period; breach | Fixed pilot evidence exposes a token, reconstructable journey, prohibited exact origin–destination–window, retained post-delete data, or failed deletion/reset | Immediate gate failure, delivery stop per scope, containment, deletion/token response, incident, correction, and append-only evidence | Pass requires zero breach on a new fixed candidate plus verified containment and required reviews | Conditional waiver, redaction-only closure, continued sends, stable join, or erasing the original breach |
| `CLG-A01` v1; accessibility gate | Synthetic/shadow/pilot readiness; blocking accessibility; real coverage | A required pilot station-direction-path or eligible real coverage row lacks accepted complete-path/ARO/equipment/alternative evidence | Result is **Run — Inconclusive** and release remains blocked; no accessible pilot advance | Pass only after every required real row and owner suite, including `IMP-01`–`IMP-14` and scenario 39, passes | Documentation-as-coverage, 0/0 Pass, partial station credit, generic alternative, or accessibility waiver |
| `CLG-R01` v1; correction policy | Replay/rerun; same scenario class; corrected candidate | Original attempt fails; a bounded correction changes an identified version and a sequential rerun passes | Original failure remains immutable and linked; new attempt may Pass only on the corrected candidate with complete evidence and review | Pass only when history, changed fields, correction approval, and rerun lineage are append-only | Overwriting failure, reusing attempt ID, changing unrelated inputs, or calling correction alone a Pass |
| `CLG-G01` v1; final review | Decision simulation; all required strata; contained non-blocker | Every blocker and target passes on one candidate; all six approve; one explicit non-blocking limitation has owner, deadline, affected population, containment, verification, and automatic rollback | Eligible for **CONDITIONAL GO** only for that bounded non-blocker | Pass only if the condition waives no required truth, relevance, freshness, dedupe, accessibility, privacy, permission, operations, lineage, or mandatory segment | Unbounded condition, absent owner/deadline, blocker waiver, missing signature, or mixed packages |
| `CLG-G02` v1; final review | Decision simulation; any required stratum; blocker | A proposed **CONDITIONAL GO** package contains one failed, incomplete, or waived blocker | Required disposition is **NO-GO** | Pass only when review rejects the conditional proposal and records the blocker | Conditional release, risk acceptance, silence-as-approval, or moving blocker to post-launch |
| `CLG-G03` v1; final review | Decision simulation; all required strata; signature | All execution evidence appears to pass, but one of Product, Accessibility, Data Quality, Content, Privacy, or Operations lacks an explicit same-package decision/date/signature | Required disposition is **NO-GO** for incomplete approval | Pass only when the incomplete package is rejected; a later signature requires a new complete decision review | Attendance, assignment, bulk approval, proxy inference, or mixed-package signature |

The 27 rows above are the complete Task 10 fixture set: six specification, four boundary, five measurement, four evidence, two operations, one privacy, one accessibility, one correction, and three disposition definitions.

## Pending execution record

Every cell below is intentionally uncredited. `ATT-001` is reserved for the first immutable execution of each definition against `CLG-PKG-01`; it is not proof that an execution occurred.

| Fixture / attempt / package | Actual Tasks 2–9, visible, assistive, queue, and delivery result | Evidence attachments and lineage | Two adjudicators and six required reviewer decisions | Review dates and signatures | Deviation and correction | Rerun | Status |
|---|---|---|---|---|---|---|---|
| `CLG-S36-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-S37-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-S38-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-S39-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-S42-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-S48-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-B01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-B02-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-B03-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-B04-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-M01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-M02-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-M03-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-M04-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-M05-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-E01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-E02-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-E03-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-E04-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-O01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-O02-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-P01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-A01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-R01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-G01-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-G02-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CLG-G03-ATT-001`; `CLG-PKG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |

There are exactly 27 initial execution rows. All actual, evidence, reviewer, date, correction, rerun, and status fields are **Not run — Pending**.

## Append-only execution rules

1. Replace no Pending cell in place after an attempt begins. Append the completed immutable attempt beneath the same fixture with its sequential ID.
2. Preserve every failure, inconclusive result, disagreement, missing attachment, deviation, incident, and original package identity.
3. A bounded correction names the changed artifact/configuration/source/data/copy/privacy/operations version and links both the original and rerun.
4. Do not combine Planned and Unplanned cells, different operating periods, message classes, impact classes, source-coherence classes, candidates, or reviewer packages.
5. Do not derive safety from correct Hold/Suppress alone; prove that the negative decision was correct and that no deterministic should-Send case was missed.
6. Real-pilot attachments contain only privacy-approved aggregates: no identifiers, tokens, exact origin–destination–window, location, message body, ledger, stable join, or reconstructable journey.
7. Pilot authorization advances only to Stage 4. It is never a release disposition.

This Draft register contains no working-product execution evidence.
