# Arrival Truth and Service Changes Product Delivery Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to deliver this plan task by task. Keep this work at the product-logic and validation-artifact level. Do not introduce source code, frameworks, architectural stacks, vendors, or an invented technical design.

## Goal

Turn the approved subway arrival-truth design into a complete, reviewable set of product contracts, decision tables, acceptance cases, and Gate 0 validation evidence. The resulting materials must make one promise enforceable:

> Show a live arrival only when current evidence supports that the train is boardable at the exact station and direction; hide or honestly degrade the claim whenever a bypass or other material conflict is known or unresolved.

## Source of truth

The controlling source is:

- `docs/superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md`

Use sections 3–12, 22, 27, 31.1–31.3, 31.7–31.8, 32.1, and 33 as the direct requirements for this plan. Section 12 and the specification's source notes remain the evidence register; this plan must not silently add a new source claim or change a threshold.

If a delivery artifact conflicts with the approved specification, the specification wins and the artifact must be corrected before review.

## Scope and boundaries

### In scope

- Claim-level truth hierarchy across fresh subway GTFS-RT, supplemented GTFS, regular static GTFS, service alerts, and feed-validity evidence.
- Exact-stop arrival admission, next-three ordering, and honest degraded states.
- Planned and unplanned service-change reconciliation, including reroutes, skipped stops, short turns, closures, and actual-versus-scheduled-track conflicts.
- Route-level feed health, freshness thresholds, bulk-drop protection, and coherent recovery.
- Train continuity, service-day handling, daylight-saving boundaries, and clock-skew behavior.
- Live, Expected, Holding, Uncertain, and Scheduled states; ghost filtering; hard suppression; and recovery.
- Schedule fallback order, supplemented-edition supersession, currency states, and rider-facing fallback labels.
- Provenance, quarantine, permitted corrections, and review evidence.
- Truth-focused acceptance scenarios and Gate 0 exit evidence.

### Out of scope

- Screen layout, navigation, typography, location ranking, and offline journey experience.
- Accessibility-path and equipment-status rules.
- Platform-positioning, transfer-guidance, crowding, and commute-notification behavior.
- Source-code tasks, implementation structure, technology choices, frameworks, vendors, and operational hosting details.

Section 31.8 scenarios 45–48 and 51 belong to the accessibility, transfer, commute-alert, or offline workstreams. This plan records those ownership boundaries in traceability rather than redefining their rules.

## Delivery rules

- Complete tasks in order unless a dependency explicitly permits parallel review.
- Treat every stated threshold as initial approved product policy, not a suggestion to be adjusted during documentation.
- Preserve rider-facing state names and labels exactly as approved.
- Prefer a missing arrival over a false claim that a bypassing train will stop.
- Keep arrival admission separate from ordering.
- Keep feed-wide freshness separate from train-specific movement age.
- Limit every unresolved alert or anomaly to the narrowest route, direction, station, or segment that the evidence supports.
- Every review finding must name the source section, affected artifact, decision, and resolution.
- Every suggested commit message below is intentionally lowercase.

## Task 1: Fix the core arrival contract and shared vocabulary

**Artifacts**

- Create: `docs/product/arrival-truth/core-arrival-contract.md`
- Update: `docs/product/contracts/transit-product-glossary.md`

**Dependencies**

- Master delivery Phase 0 Task 0.2 has created and approved `docs/product/contracts/transit-product-glossary.md`.

**Ordered steps**

1. Copy the seven arrival-board admission conditions from section 3.1 into a single normative checklist without weakening or combining them.
2. State the conservative-error policy and the defensible guarantee, including the rule that an unknown required condition cannot receive an exact countdown.
3. Confirm in the common transit-product glossary that station complex, directional stop and platform, train instance, stop call, service pattern, and alert impact remain separate concepts; add only arrival-specific clarifications that do not fork their shared definitions.
4. Define the difference between a positive live-arrival claim, a negative veto, a degraded status, quarantine, and suppression.
5. Add an ownership note that raw directional codes must be normalized before they can be compared or translated into rider-facing language.
6. Review every glossary definition against sections 3 and 4 and record any wording clarification without creating a new behavior.

**Evidence and acceptance checks**

- The core contract contains all seven admission conditions.
- It explicitly says that current MTA evidence identifying or materially leaving unresolved a bypass prevents display.
- It says that static schedules cannot reconstruct future stop calls for a live train.
- It distinguishes a station complex from the exact directional boarding stop.
- It uses **Arrival unavailable**, **Holding**, and the fewer-than-three policy consistently with the specification.
- A reviewer can decide whether an exact countdown is permitted without consulting an unstated assumption.

**Suggested commit**

`fix the arrival truth contract`

## Task 2: Publish the source-role, precedence, and conflict rules

**Artifacts**

- Create: `docs/product/arrival-truth/source-role-and-precedence-matrix.md`
- Create: `docs/product/arrival-truth/evidence-veto-catalog.md`
- Create: `docs/product/arrival-truth/source-evidence-register.md`

**Dependencies**

- Task 1.

**Ordered steps**

1. Document the five evidence priorities in order: validity and freshness, hard negative evidence, fresh subway GTFS-RT, supplemented GTFS, and regular static GTFS.
2. Describe the claim types each source may support and the claims it may never support, including the supplemented schedule's hourly publication pattern and its “most, not all” planned changes for the next seven calendar days.
3. Record that fresh subway GTFS-RT is the only positive basis for a live countdown.
4. Record replacement-period behavior: a static trip missing from a healthy full real-time snapshot is not restored and is not confidently labeled cancelled without a reliable match.
5. Catalog every hard veto: bypass, suspension, missing live stop, planned-pattern exclusion, station closure, and invalidating track conflict.
6. Document alert limitations: station and direction metadata are optional, missing metadata does not prove an unaffected station, and generic “affected” metadata is not enough to assert a bypass unless structured scope and official text agree.
7. Link every source role to the official evidence already named in specification section 12; record revision or effective-date information already present there.
8. Add the six conflict outcomes from section 8.6 as a review table.

**Evidence and acceptance checks**

- No source other than fresh subway GTFS-RT can produce a live exact countdown.
- Supplemented GTFS is the preferred planned-service baseline and first schedule fallback, but is never described as complete proof that service is normal.
- Regular static GTFS is never allowed to fill a missing live stop.
- Every conflict row applies negative evidence before positive prediction.
- Alert text can explain service but cannot revive a stale or suppressed train.
- All six section 8.6 outcomes appear with the same rider result.
- Every external source in the evidence register already exists in the approved specification.

**Suggested commit**

`map the sources and vetoes`

## Task 3: Define service-day, clock, and train-continuity behavior

**Artifacts**

- Create: `docs/product/arrival-truth/time-and-train-continuity-policy.md`
- Create: `docs/product/arrival-truth/time-and-identity-acceptance-cases.md`

**Dependencies**

- Task 1.

**Ordered steps**

1. Define operating service date separately from calendar date, including trips with times beyond 24:00 and trips beginning before the nominal service date.
2. State that all rider-facing times use New York local time while freshness decisions use authoritative source timestamps with only a small skew allowance.
3. Write the expected outcomes for repeated and missing local times during daylight-saving transitions: no duplicate trains, reversed chronology, or negative waits.
4. List every condition required for a one-to-one train-identity join: internal marker when available, route, direction, service date, ordered next-stop sequence, compatible track and destination, similar predicted time, and immediate replacement timing.
5. State that ambiguous identities are not merged and that the weaker candidate stays quarantined from the primary board.
6. Create cases for after-midnight service, both daylight-saving transitions, a phone clock disagreement, a coherent identifier change, and an ambiguous identity pair.

**Evidence and acceptance checks**

- Acceptance scenarios 4, 5, and 40–42 each have an explicit setup, expected state, and prohibited outcome.
- A trip crossing midnight remains attached to the correct operating service date.
- A phone clock disagreement cannot make a stale feed appear current.
- A changed trip identifier cannot by itself create a duplicate or justify a merge.
- Every identity join is one-to-one and evidence-based; ambiguity results in quarantine.

**Suggested commit**

`settle time and train continuity`

## Task 4: Establish route-level feed health and snapshot anomaly policy

**Artifacts**

- Create: `docs/product/arrival-truth/feed-health-policy.md`
- Create: `docs/product/arrival-truth/snapshot-anomaly-and-recovery-cases.md`

**Dependencies**

- Task 2.
- Task 3.

**Ordered steps**

1. Define health independently for each relevant route or feed group so one group cannot force unrelated lines into schedule fallback.
2. Record the initial feed thresholds exactly: Current at no more than 90 seconds, Degraded at 91–180 seconds, and Unavailable beyond 180 seconds, after repeated update failures, after invalid decoding, or after timestamp regression.
3. Record alert-context currency at no more than ten minutes and state that a stale alert snapshot does not prove normal service; unresolved current change risk continues to fail closed.
4. Separate train-specific movement age from feed-wide snapshot age; a fresh feed carrying old movement evidence changes the train state rather than declaring a network-wide outage.
5. Define bulk-drop evidence, including roughly 40% or more entities disappearing, several route feeds disappearing together, timestamp regression, and malformed or suspiciously empty full snapshots.
6. Define degraded behavior: preserve the last coherent state, stop its countdowns, and show **Live data updating**.
7. Define recovery: exact countdowns return only after two fresh coherent snapshots.
8. Create boundary cases for 90, 91, 180, and more than 180 seconds, a timestamp regression, a suspicious empty snapshot, a 40% entity drop, and simultaneous multi-feed disappearance.

**Evidence and acceptance checks**

- The threshold boundary cases have one unambiguous expected health state each.
- A route-group failure leaves unrelated route groups live when their evidence is healthy.
- A mass entity drop does not become a mass-cancellation claim.
- Preserved arrivals do not continue counting down during degraded snapshot recovery.
- The artifact distinguishes an old train movement timestamp from an old feed snapshot.
- Exact countdown recovery requires two fresh coherent snapshots in every anomaly path.
- Acceptance scenarios 17 and 18 are covered directly.

**Suggested commit**

`draw honest feed health boundaries`

## Task 5: Specify exact-stop admission and next-three ordering

**Artifacts**

- Create: `docs/product/arrival-truth/arrival-admission-and-ordering-contract.md`
- Create: `docs/product/arrival-truth/arrival-board-decision-table.md`

**Dependencies**

- Tasks 1–4.

**Ordered steps**

1. Define candidate generation for a station and direction from current relevant real-time train instances.
2. Require the exact directional stop in the ordered remaining-stop sequence before any train can enter the board.
3. Require destination and rider-facing direction to agree with the actual remaining pattern.
4. Apply service-change, track, freshness, identity, and movement gates before ranking.
5. Define the primary set as admitted Live and Expected trains only; keep Holding trains as separate warning rows and confirmed-pattern Uncertain trains in a secondary area.
6. Define chronological sorting by the best current estimate, using the center of an Expected range and preferring Live only when ranges overlap.
7. State that an earlier Expected train may precede later Live trains and that Scheduled claims appear only in a clearly separated fallback state.
8. Define honest fewer-than-three outcomes using the three approved explanatory messages.
9. Add decision rows for normal service, a terminal Expected train, a missing static trip inside a healthy replacement period, overlapping arrival ranges, and fewer than three admitted trains.

**Evidence and acceptance checks**

- Every displayed live arrival contains the exact station-direction in its remaining stop sequence.
- Admission is completed before ordering.
- Quarantined, Holding, and Uncertain trains do not consume next-three slots.
- A Live train does not automatically outrank an earlier Expected train unless their ranges overlap.
- Missing arrivals are not backfilled by weak schedule guesses.
- Acceptance scenarios 1–3 and 50 are covered directly.

**Suggested commit**

`shape the trustworthy next three`

## Task 6: Resolve service-change impacts to the narrowest rider consequence

**Artifacts**

- Create: `docs/product/arrival-truth/service-change-impact-and-resolution-policy.md`
- Create: `docs/product/arrival-truth/service-change-scope-cases.md`

**Dependencies**

- Tasks 2 and 5.

**Ordered steps**

1. Reproduce the section 22 impact taxonomy as arrival-board behavior, including delay, holding, express/local changes, reroute, short turn, suspension, closure, equipment impact, and platform or track change.
2. For each impact, separate “train remains visible,” “train is suppressed,” and “arrival claim is unavailable” outcomes.
3. Define alert scope from active period, early-display guidance, route, station or segment, and direction as jointly constrained evidence.
4. State that a station-specific record does not make every station on the route affected and that unresolved impact hides only the materially affected route, direction, or segment.
5. Preserve the original official alert text in details while permitting a shorter, plain-language rider summary.
6. State that delay-only alerts keep coherent trains visible and affect explanation or confidence, not stop admission.
7. State that high-impact alerts with unsafe mapping enter an exception state and that an authorized correction may suppress or annotate but may never invent a train.
8. Create cases for direction-specific planned work, unresolved reroute scope, delay-only service, and a closure affecting one constituent station without suppressing unrelated services in the complex.

**Evidence and acceptance checks**

- Every alert effect is localized to evidence-supported scope.
- Missing station metadata never becomes evidence that all stations are unaffected.
- Generic alert categories are not treated as permanent machine meanings.
- Delay-only alerts do not suppress a coherent train.
- An unresolved high-impact alert hides the affected arrival claim rather than guessing.
- Unrelated routes at a shared station complex remain available.
- Acceptance scenarios 9–12 are covered directly.

**Suggested commit**

`localize service change consequences`

## Task 7: Complete planned, unplanned, reroute, short-turn, and track-conflict decisions

**Artifacts**

- Create: `docs/product/arrival-truth/reroute-and-track-conflict-playbook.md`
- Create: `docs/product/arrival-truth/reroute-short-turn-and-bypass-cases.md`
- Update: `docs/product/arrival-truth/arrival-board-decision-table.md`

**Dependencies**

- Tasks 5 and 6.

**Ordered steps**

1. Define planned-change reconciliation in order: establish the effective supplemented pattern, resolve active alert scope, compare live remaining stops, suppress excluded targets, and admit a novel rerouted stop only with a coherent live sequence plus supporting change evidence.
2. Define unplanned-change reconciliation: fresh live stop sequence is positive evidence; explicit skip, suspension, closure, or reroute evidence is a veto; unresolved high-impact scope fails closed.
3. Add the F-via-E walkthrough: retain the F identity, show **Via E line**, suppress original F stops absent from the live sequence, and show an E stop only when its exact station-direction is present and uncontradicted.
4. Define local-running-express, express-running-local, short-turn, partial-suspension, full-suspension, and station-closure outcomes.
5. Define an actual-versus-scheduled-track conflict outside normal terminal behavior as invalidating downstream stop claims until a coherent later update demonstrates a trustworthy path.
6. Add every conflict outcome to the shared decision table with the rider-facing explanation beside the affected arrival or suppression state.
7. Create cases for F via E, skipped local stops, a short turn, a verified novel reroute stop, a contradicted novel stop, and a non-terminal track conflict.

**Evidence and acceptance checks**

- F trains bypassing original F stops never appear there.
- A rerouted F appears at an E station only with the exact directional stop and no contradictory evidence.
- The route remains F and the rider sees **Via E line**.
- A short-turn train uses its actual terminal and is absent downstream.
- A local-running-express train is suppressed at every omitted local stop.
- A non-terminal track conflict removes the arrival claim rather than merely reducing confidence.
- Acceptance scenarios 6–8 are covered directly.

**Suggested commit**

`close the reroute and bypass gaps`

## Task 8: Define the rider-visible arrival-confidence and ghost lifecycle

**Artifacts**

- Create: `docs/product/arrival-truth/arrival-confidence-and-ghost-policy.md`
- Create: `docs/product/arrival-truth/ghost-lifecycle-boundary-cases.md`

**Dependencies**

- Tasks 4, 5, and 7.

**Ordered steps**

1. Define **Live**, **Expected**, **Holding**, **Uncertain**, and **Scheduled** using the exact default evidence and rider treatment from section 10.
2. State that **Uncertain** is allowed only while the train's stopping pattern still confirms the displayed station; stopping-pattern or track uncertainty suppresses the row.
3. Define **Due** for no more than 60 seconds while movement remains fresh.
4. Define the no-progress transition after 60 seconds to frozen **Holding**, and after 120 seconds remove the exact event from the primary next-three list while retaining secondary held-train context.
5. Define unusual dwell as the greater of two minutes plus a small operating margin or the observed high-percentile dwell for the station, route, direction, and operating period.
6. State that unusual dwell alone never deletes a train.
7. Create timeline cases at movement ages of 90, just over 90, 180, and just over 180 seconds, plus Due at 60 and 120 seconds and a long valid terminal hold.

**Evidence and acceptance checks**

- Every confidence state has evidence, primary-board eligibility, countdown treatment, and rider copy.
- A fresh feed with 100 seconds of no movement freezes as Holding.
- A valid held train remains visible as secondary status rather than disappearing silently.
- Exact minutes are removed when evidence no longer supports precision.
- Unusual dwell flags but does not by itself suppress.
- Stopping-pattern uncertainty never displays as merely **Uncertain**.
- Acceptance scenarios 13 and 14 are covered directly.

**Suggested commit**

`make ghost states visible and honest`

## Task 9: Lock hard suppression, grace, and coherent recovery

**Artifacts**

- Create: `docs/product/arrival-truth/suppression-grace-and-recovery-policy.md`
- Create: `docs/product/arrival-truth/suppression-and-recovery-cases.md`
- Update: `docs/product/arrival-truth/arrival-board-decision-table.md`

**Dependencies**

- Task 8.

**Ordered steps**

1. State that one missing entity in an otherwise healthy full snapshot immediately loses Live status and leaves the primary next-three list.
2. Limit the one-snapshot grace to internal continuity review; do not continue the exact countdown publicly.
3. List every hard-removal cause: target removed from remaining stops, two healthy-snapshot absences or at least 60 seconds, expired arrival without continuing evidence, twice-confirmed stop-order regression, weaker duplicate, cancellation, bypass, suspension, and invalidating track conflict.
4. Preserve suppressed records for non-personal quality review.
5. Define exact-countdown recovery as two fresh coherent updates confirming stable identity, plausible stop order, current movement or progress, continued target service, and no unresolved service or track conflict.
6. Add cases for one missing snapshot, two missing snapshots, the 60-second boundary, stop-order regression once and twice, a duplicate pair, target-stop removal, and complete recovery.

**Evidence and acceptance checks**

- One missing snapshot removes the exact public countdown without prematurely declaring cancellation.
- Two consecutive healthy-snapshot absences or at least 60 seconds cause suppression.
- Every hard-removal cause in section 10.3 appears.
- A single apparently good update cannot restore an exact countdown.
- Recovery requires all five approved conditions across two fresh coherent updates.
- Acceptance scenarios 15 and 16 are covered directly.

**Suggested commit**

`set firm ghost suppression and recovery`

## Task 10: Complete schedule fallback, edition supersession, and currency

**Artifacts**

- Create: `docs/product/arrival-truth/schedule-fallback-and-currency-policy.md`
- Create: `docs/product/arrival-truth/schedule-currency-boundary-cases.md`

**Dependencies**

- Tasks 2, 4, and 7.

**Ordered steps**

1. Define fallback entry only when the relevant real-time route or feed group is genuinely unavailable, never because one expected train is missing from healthy data.
2. Record the fallback order: newest validated non-superseded supplemented GTFS, regular GTFS, then no estimate.
3. Require service-date coverage and make a later validated overlapping supplemented edition supersede every earlier edition.
4. Define the three currency states without overlap: Current at no more than two hours, Stale reference older than two hours through twenty-four hours, and Topology only beyond twenty-four hours, when superseded, or outside effective coverage.
5. Define edition age from the source publication time when available, otherwise the first successful retrieval of each distinct validated edition.
6. State that retrieving identical content does not reset age, a later edition cannot silently revert to an earlier one, and a failed new edition does not erase the last validated copy.
7. Define rider presentation: scheduled clock time, persistent **Live data unavailable**, retrieval age, effective service date, stale warning, continued known vetoes, and never **on time**.
8. State that an unresolved current service change replaces the optimistic schedule with **Service change—arrival unavailable**.
9. Create cases for a healthy feed missing one train, a genuine outage, overlapping editions, an unchanged edition retrieved repeatedly, a failed new edition, ages on both sides of two and twenty-four hours, no valid schedule for the service date, and unresolved planned work.

**Evidence and acceptance checks**

- Static fallback cannot activate for an individual missing live train.
- A later validated overlapping supplemented edition always wins.
- Repeated retrieval of unchanged content does not reset currency.
- A three-hour-old edition is visibly **Stale reference**.
- A copy older than twenty-four hours makes no departure claim.
- Scheduled claims use clock times and never look like live countdowns.
- Known and unresolved service-change vetoes remain active during fallback.
- Acceptance scenarios 19, 20, 43, 44, and 49 are covered directly.

**Suggested commit**

`label every schedule fallback honestly`

## Task 11: Make every truth decision reviewable and reversible

**Artifacts**

- Create: `docs/product/arrival-truth/provenance-quarantine-and-correction-policy.md`
- Create: `docs/product/quality/arrival-truth-decision-review-template.md`
- Create: `docs/product/quality/quarantine-recovery-review-cases.md`
- Create: `docs/product/quality/arrival-truth-risk-register.md`

**Dependencies**

- Tasks 2–10.

**Ordered steps**

1. Define the provenance retained for every rider-facing claim: source type, source timestamp, effective period, scope, displayed transformation, and suppression reason where applicable.
2. Define the rider-visible portion as plain-language state and freshness, leaving detailed provenance for support and quality review.
3. List every quarantine trigger from section 27.2: malformed or implausible timestamps, stop-order regression, duplicate identities, impossible direction changes, track conflicts, suspicious empty snapshots, and contradictory alert scope.
4. State that quarantine is reversible only after coherent evidence returns.
5. Define permitted corrections: suppress bad arrival, clarify affected alert segment, mark guidance unavailable, or correct geometry and accessibility relationships.
6. Define forbidden corrections: fabricate movement, add an unsupported arrival, or declare equipment operational without authoritative evidence.
7. Create a decision-review template that answers why a train was shown or hidden, which evidence caused the decision, later stop progress, Holding duration, alert over- or under-suppression, and the recovery evidence used.
8. Add review cases for each quarantine class and for one permitted and one forbidden correction.
9. Record the five arrival-truth risks from section 33.1—supplemented-schedule incompleteness, optional station-level alert scope, evolving alert labels and text, inconsistent trip identifiers, and reroutes between snapshots—and link each to its approved conservative control and review evidence.

**Evidence and acceptance checks**

- Every public claim and suppression can be traced to source, time, scope, transformation, and reason.
- Suspect records cannot influence the primary board.
- Quarantine recovery requires coherent evidence rather than manual optimism.
- Corrections can reduce unsupported claims but cannot create live evidence.
- The review template supports threshold calibration by route, station, direction, terminal, and operating period without using personal rider history.
- Every section 33.1 data limitation has an owner artifact, conservative response, observable failure signal, and review evidence.

**Suggested commit**

`leave an evidence trail for every train`

## Task 12: Assemble the integrated truth acceptance catalog and traceability

**Artifacts**

- Create: `docs/product/quality/arrival-truth-acceptance-catalog.md`
- Create: `docs/product/quality/arrival-truth-requirement-traceability.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/time-and-identity-acceptance-cases.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/snapshot-anomaly-and-recovery-cases.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/arrival-board-decision-table.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/service-change-scope-cases.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/reroute-short-turn-and-bypass-cases.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/ghost-lifecycle-boundary-cases.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/suppression-and-recovery-cases.md`
- Update as required by a reviewed gap: `docs/product/arrival-truth/schedule-currency-boundary-cases.md`

**Dependencies**

- Tasks 1–11.

**Ordered steps**

1. Consolidate specification scenarios 1–20, 40–44, 49, and 50 into one catalog without changing their expected outcomes.
2. Give every scenario a stable identifier, setup, current evidence, expected board state, required rider explanation, prohibited outcome, and evidence needed for recovery.
3. Add boundary-pair cases immediately on both sides of every numeric truth threshold: feed age, movement age, Due duration, disappearance duration, bulk-drop proportion, alert currency, and schedule currency.
4. Map each included scenario to the controlling specification section, one product contract, one decision table or policy, and one evidence record.
5. Record section 31.8 scenarios 45–48 and 51 as cross-plan dependencies with their owning workstream; do not duplicate or silently omit them.
6. Conduct a contradiction pass across live-admission, service-change, ghost, and fallback cases, paying special attention to positive live evidence versus a negative veto.
7. Resolve every contradiction in the narrowest source artifact, then rerun traceability review.

**Evidence and acceptance checks**

- Every scenario in 31.1–31.3 and 31.7 is mapped.
- Truth-owned scenarios 43, 44, 49, and 50 from 31.8 are mapped.
- Scenarios 45–48 and 51 have named cross-plan ownership.
- Every numeric threshold has an exact-boundary and just-over-boundary case.
- No case restores static data inside a healthy real-time replacement period.
- No case displays an arrival when stop service is contradicted or materially unresolved.
- Every expected public state has its required rider-facing explanation.
- The traceability artifact has no requirement without an owner, artifact, case, and evidence field.

**Suggested commit**

`tie every truth rule to a rider case`

## Task 13: Run and sign Gate 0 truth validation

**Artifacts**

- Create: `docs/product/quality/gate-0-truth-validation-protocol.md`
- Create: `docs/product/quality/false-bypass-incident-review.md`
- Create: `docs/product/quality/gate-0-validation-results.md`
- Create: `docs/product/quality/gate-0-exit-record.md`

**Dependencies**

- Task 12.

**Ordered steps**

1. Define replay cohorts for normal, weekend, late-night, and major-disruption periods.
2. Define the comparison evidence for each candidate: whether it was admitted or suppressed and whether later stop progress confirmed service at the target.
3. Define shadow review against current MTA data without exposing unvalidated arrival claims to riders.
4. Require route-specific review of feed-health thresholds, snapshot regression, suspicious emptiness, bulk drops, and two-snapshot recovery.
5. Run every acceptance-catalog case and record actual versus expected product decisions.
6. Sample suppression decisions for over-suppression and admitted arrivals for bypass false positives; retain the decision provenance from Task 11.
7. Establish the false-bypass incident process with event scope, rider harm, evidence timeline, source conflict, containment, correction, threshold implication, and prevention follow-up.
8. Record every open deviation with severity, affected route or scenario, conservative containment, owner, and evidence required to close it.
9. Sign the exit record only when there is no known systematic source of bypassed-stop false positives and every degraded state is visibly honest.

**Evidence and acceptance checks**

- Validation includes normal, weekend, late-night, and major-disruption evidence.
- Admitted and suppressed arrivals are checked against later stop progress.
- Route-specific feed health and bulk-drop behavior are covered.
- Every catalog scenario has a recorded result.
- Any unresolved defect has a conservative rider-safe containment and blocks exit when it could create a false stop claim.
- A false-bypass incident has a complete review path and cannot be closed without evidence.
- The exit record quotes both Gate 0 conditions and gives pass/fail evidence for each.
- Gate 0 cannot pass on document completion alone; it requires recorded behavior evidence.

**Suggested commit**

`prove the board before riders trust it`

## Execution order and review checkpoints

| Checkpoint | Tasks | Review question | Exit evidence |
|---|---:|---|---|
| Contract locked | 1–3 | Do all reviewers use the same stop, train, time, and evidence meanings? | Approved core contract, glossary, source matrix, and time/identity cases |
| Live truth locked | 4–5 | Can any unhealthy, mismatched, or unboardable train enter the next-three list? | Feed-health boundaries and arrival-decision table pass review |
| Service changes locked | 6–7 | Does every bypass, reroute, short turn, closure, and track conflict produce the narrowest safe rider outcome? | Service-change and reroute case evidence |
| Ghost and fallback locked | 8–10 | Do stale trains lose precision, suppress at the approved threshold, recover coherently, and fall back without masquerading as live? | Ghost lifecycle, recovery, and schedule-currency evidence |
| Auditability locked | 11–12 | Can every show, hide, quarantine, and fallback decision be explained and traced to a scenario? | Provenance review and complete traceability |
| Public truth gate | 13 | Is there any known systematic bypass false positive or dishonest degraded state? | Signed Gate 0 exit record |

## Final completion standard

This plan is complete only when:

- Every named artifact exists and has passed its task-level acceptance checks.
- Every specification scenario assigned to this workstream has recorded expected behavior and traceability.
- Cross-plan scenarios are explicitly owned rather than silently omitted.
- All service-change conflicts follow the negative-evidence veto.
- All exact countdowns depend on fresh, coherent live evidence.
- Schedule fallback is visibly scheduled, age-aware, and still subject to active service-change vetoes.
- Quarantined and suppressed records cannot influence the primary board.
- Gate 0 contains behavior evidence, a false-bypass incident process, and a signed pass/fail record.
- The exit record confirms both required conditions: no known systematic source of bypassed-stop false positives, and visibly honest degraded states.
