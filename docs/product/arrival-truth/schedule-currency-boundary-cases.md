# Schedule currency boundary cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §11, §31.3 scenarios 19–20, and §31.8 scenarios 43–44 and 49; arrival-truth and service-changes plan Tasks 10 and 12 `Artifacts` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define acceptance evidence for the [schedule fallback and currency policy](schedule-fallback-and-currency-policy.md). They test fallback entry, source ordering, service-date coverage, edition supersession, age anchors, exact currency boundaries, rider wording, service-change veto ordering, and hard-suppression release carryover. The [feed health policy](feed-health-policy.md), [source role and precedence matrix](source-role-and-precedence-matrix.md), [evidence veto catalog](evidence-veto-catalog.md), [service-change impact and resolution policy](service-change-impact-and-resolution-policy.md), [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md), [time and train continuity policy](time-and-train-continuity-policy.md), and [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the actual result and prohibited-result checks are recorded, and the Truth Gate accepts the evidence. An expected result written here is not a passing result.

## Fallback entry and source-order cases

### Case S1 — Healthy feed missing one train

**Setup**

Provide an otherwise healthy, complete, current real-time snapshot for the relevant route/feed group. Omit one trip that appears in both an applicable supplemented edition and regular GTFS. Provide no evidence that makes the route/feed group Unavailable.

**Expected state**

Create no static candidate for the missing trip. Keep the group out of schedule fallback and evaluate its remaining real-time trains normally.

**Prohibited outcome**

Do not show the missing trip as Scheduled, Live, Expected, cancelled, a clock time, or a countdown. Do not classify the route/feed group Unavailable because one train is absent.

### Scenario 19 — Genuine outage with eligible supplemented schedule

**Setup**

Provide evidence that the exact relevant route/feed group is genuinely **Unavailable** under the feed-health policy. Provide a validated, non-superseded supplemented edition that is no more than 2 hours old, covers the trip's operating service date and departure within its effective horizon, and has no applicable veto. Keep another route/feed group healthy.

**Expected state**

Select the supplemented edition before regular GTFS. In a separate fallback board, show a scheduled New York clock time with **Scheduled**, persistent **Live data unavailable**, currency age with its truthful publication/first-retrieval anchor, latest successful retrieval age, and effective service date. If currency and latest-retrieval ages differ, show both. Keep the unrelated healthy group in its independently supported live state.

**Prohibited outcome**

Do not show a countdown, **Live**, **Expected**, or **on time**; mix the schedule into the live next-three board; select regular GTFS first; imply normal service; or force the healthy group into fallback.

### Case S3 — Supplement unavailable; regular GTFS is next

**Setup**

Prove the relevant route/feed group Unavailable. Provide no validated supplemented edition applicable to the proposed operating service date and departure. Provide a valid regular-GTFS trip that covers both, with no applicable veto.

**Expected state**

Record why supplemented GTFS is not departure-eligible, then select regular GTFS. Show only the separated scheduled clock-time treatment with **Live data unavailable**, successful retrieval age, and effective service date.

**Prohibited outcome**

Do not skip the supplemented eligibility record, invent a supplement, treat regular GTFS as proof of normal service, or present its time as live.

### Case S4 — No schedule covers the service date

**Setup**

Prove the relevant route/feed group Unavailable. Provide supplemented and regular GTFS artifacts that are structurally valid but do not cover the trip's operating service date.

**Expected state**

Classify the supplemented edition **Topology only** for this claim, reject both sources as departure candidates, and show no arrival estimate. Keep **Live data unavailable** visible for the affected scope.

**Prohibited outcome**

Do not borrow a trip from another service date, infer service from topology, move the trip at midnight to create coverage, or invent a clock time, countdown, publication time, edition validity, or service.

### Case S5 — Supplemented departure is outside horizon or effective coverage

**Setup**

Prove the relevant route/feed group Unavailable. Provide a validated recent supplemented edition whose effective coverage or horizon does not include the proposed departure, and provide no other departure-eligible supplemented edition for that claim. Provide regular GTFS that validly covers the operating service date and departure.

**Expected state**

Treat the supplement as **Topology only** for that claim and continue to regular GTFS as the next candidate. Use only the separated scheduled clock-time treatment.

**Prohibited outcome**

Do not extend the supplemented horizon, use its apparent youth to override coverage, reactivate an edition superseded for that claim, or stop before evaluating eligible regular GTFS.

## Edition identity, supersession, and age-anchor cases

### Scenario 43 — Later validated edition overlaps an earlier edition

**Setup**

Provide two independently validated supplemented currency editions with changed canonical schedule content, retained source-supported edition chronology, and overlapping effective/service-date coverage. The later edition changes or removes at least one departure from the earlier edition. Both would otherwise be Current by age.

**Expected state**

Mark the later validated edition as the only non-superseded supplemented candidate throughout the overlap. Mark the earlier edition **Topology only** for the overlap and never use its more optimistic departure.

**Prohibited outcome**

Do not merge editions, cherry-pick the more favorable time from the earlier edition inside the overlap, retain both as current for the same overlapping claim, use retrieval order alone to invent version order, or silently roll back to the earlier edition.

### Case S7A — Later overlapping edition ages beyond 24 hours

**Setup**

After Scenario 43 establishes that a later validated edition superseded an earlier edition for one claim inside their overlap, advance authoritative comparison time until the later edition is older than 24 hours. Keep the claim inside the original overlap and provide an eligible regular-GTFS departure.

**Expected state**

Classify the later edition **Topology only** by age. Keep the earlier edition superseded for this overlapping claim and continue to regular GTFS as the next candidate.

**Prohibited outcome**

Do not roll back to the earlier supplemented edition, erase the overlap-specific supersession edge, cherry-pick its more favorable departure, or show a departure from either supplemented edition.

### Case S7B — Claim outside overlap remains eligible under earlier edition

**Setup**

Provide an earlier and later validated supplemented currency edition with changed canonical schedule content and source-supported chronology. Their effective coverage overlaps for some claims, but the proposed claim is outside that overlap and inside only the earlier edition's own still-valid effective and service-date coverage. Keep the earlier edition within 24 hours and make it pass every other departure gate.

**Expected state**

Record that the later edition never superseded the earlier edition for this claim. Treat the earlier edition as the newest eligible supplement for this non-overlapping claim and evaluate its scheduled departure before regular GTFS.

**Prohibited outcome**

Do not extend supersession beyond the overlap, classify the earlier edition Topology only merely because a later edition exists elsewhere, skip directly to regular GTFS, or use the earlier edition for any claim inside the area where the later edition superseded it.

### Scenario 49 — Identical edition retrieved repeatedly

**Setup**

Provide one validated supplemented currency edition with retained canonical semantic schedule content and an accepted age anchor. Retrieve the same canonical trips, stop times, service calendars, and effective schedule semantics one or more times, including after the edition crosses the 2-hour boundary. Change transport wrapper, source label or version wrapper, publication wrapper metadata, filename, and retrieval observation while leaving canonical schedule content unchanged.

**Expected state**

Retain one currency-edition identity and its original accepted publication-time anchor, or its original first-successful-retrieval anchor when publication time is genuinely unavailable. Treat every changed wrapper as an observation of that same edition. The later retrieval does not reset currency or create supersession; the edition becomes **Stale reference** after 2 hours. Show both the older currency age and fresher **Last retrieved** age when they differ, plus effective service date and **Stored schedule—service changes may differ**.

**Prohibited outcome**

Do not create a new currency edition or supersession edge from wrapper/version/publication metadata alone, reset age, relabel the edition Current, erase its original anchor, let fresh **Last retrieved** hide older currency age, or infer a publication time.

### Case S9 — Failed distinct new edition

**Setup**

Retain one validated supplemented edition, then receive purported changed canonical schedule content with purported later source chronology that fails validation. Advance authoritative comparison time while the failed edition is retried.

**Expected state**

Keep the failed edition ineligible and retain the last validated copy. Do not mark the failed edition as superseding. Continue aging the retained copy from its unchanged age anchor and change its currency state when a boundary is crossed.

**Prohibited outcome**

Do not erase the retained copy, reset its age, validate the new edition by assumption, invent its publication time, or silently revert to a different earlier copy.

### Case S10 — Publication time unavailable

**Setup**

Provide a distinct validated currency edition with changed canonical schedule content, source-supported chronology, no supplied source publication time, and a recorded first successful retrieval against authoritative comparison time. Retrieve the same canonical content again later.

**Expected state**

Use the first successful retrieval as the edition's age anchor. Retain subsequent retrieval observations separately and apply currency from the first retrieval.

**Prohibited outcome**

Do not invent a publication time, use the latest identical retrieval as the anchor, or treat validation time, device time, phone clock, or file modification time as source publication time without approved evidence.

### Case S10B — Any future publication timestamp

**Setup**

Run two independent fixtures with changed canonical schedule content, source-supported edition chronology, a supplied publication timestamp, and a later successful retrieval:

1. In run A, set publication time at the first representable positive instant after authoritative comparison time. Treat it as future even if that offset might fall within the uncalibrated small skew allowance. Provide an eligible regular-GTFS departure.
2. In run B, set publication time demonstrably future beyond the small skew allowance and provide no eligible regular-GTFS departure.

Do not assign a numeric value to the skew allowance in either run.

**Expected state**

In both runs, calculate a negative raw age, quarantine the supplemented edition from departure eligibility, and assign no Current, Stale reference, or Topology only state. Do not substitute latest retrieval or first retrieval for the supplied unusable timestamp. In run A, select eligible regular GTFS as the next candidate. In run B, show no estimate.

**Prohibited outcome**

Do not use the phone or device clock; invent a skew threshold; accept run A because its offset may be within the allowance; classify either negative age Current; normalize or clamp age to zero; reset the anchor to latest or first retrieval; show either supplemented departure; or treat the supplied future timestamp as genuinely unavailable.

### Case S10C — Publication timestamp regressed or contradictory

**Setup**

Retain accepted source-supported publication chronology for validated schedule content. Then provide a purported distinct changed-content edition whose supplied publication timestamp regresses against that chronology or contradicts its source-supported edition order. Provide a successful retrieval and test both an eligible regular-GTFS branch and a branch with no valid regular trip.

**Expected state**

Quarantine the purported supplemented edition from departure eligibility and record the timestamp conflict. Do not substitute retrieval time or infer corrected chronology. Select regular GTFS in the eligible branch; show no estimate in the other branch.

**Prohibited outcome**

Do not classify the edition Current, silently repair or ignore the regression, use retrieval order as edition chronology, show its departure, roll back a superseded overlapping edition, or invent publication time, validity, or service.

## Exact currency-boundary cases

### Case S10D — Publication time exactly equals comparison time

**Setup**

Provide a source-supported, non-regressed, non-contradictory publication timestamp exactly equal to authoritative comparison time. The validated, non-superseded supplemented edition covers the proposed operating service date and departure and passes every other gate.

**Expected state**

Calculate raw age exactly zero and classify the edition **Current schedule**. Allow its scheduled clock time to proceed through current veto checks.

**Prohibited outcome**

Do not quarantine exact age zero as future, treat it as negative, apply an invented skew adjustment, classify it Stale reference or Topology only, or bypass another eligibility or veto gate.

### Case S11 — Exactly 2 hours

**Setup**

Provide a validated, non-superseded supplemented edition whose accepted age anchor compared with authoritative comparison time produces an age of exactly 2 hours and whose effective and service-date coverage include the departure.

**Expected state**

Classify it **Current schedule** and allow its scheduled clock time to proceed through the current-veto checks.

**Prohibited outcome**

Do not classify exactly 2 hours as Stale reference or Topology only, round it upward, or bypass a veto.

### Case S12 — Just over 2 hours

**Setup**

Use the same qualifying conditions as S11, but make authoritative age the smallest representable positive duration greater than 2 hours.

**Expected state**

Classify it **Stale reference**. If no veto applies, show the scheduled clock time with persistent **Live data unavailable**, currency age and truthful anchor, latest retrieval age, effective service date, and exactly **Stored schedule—service changes may differ**.

**Prohibited outcome**

Do not classify it Current schedule, wait until 3 hours to mark it stale, show a normal-looking board, or omit the stale warning.

### Scenario 44A — 3-hour-old stored schedule

**Setup**

Provide a validated, non-superseded supplemented edition whose accepted age anchor is exactly 3 hours behind authoritative comparison time, covers the service date and departure, and has no applicable veto.

**Expected state**

Classify it **Stale reference** and show only a scheduled clock time with **Scheduled**, persistent **Live data unavailable**, currency age and truthful anchor, latest retrieval age, effective service date, and **Stored schedule—service changes may differ**.

**Prohibited outcome**

Do not call the edition Current schedule or Topology only; show a countdown, **on time**, Live, or Expected; or omit the warning.

### Case S14 — Exactly 24 hours

**Setup**

Provide a validated, non-superseded supplemented edition whose accepted age anchor compared with authoritative comparison time produces an age of exactly 24 hours and whose effective and service-date coverage include the departure.

**Expected state**

Classify it **Stale reference** at the inclusive upper boundary. Its clock time may proceed through veto checks with the full stale presentation.

**Prohibited outcome**

Do not classify exactly 24 hours as Topology only, round it beyond the boundary, or omit the stale warning.

### Scenario 44B — Just over 24 hours

**Setup**

Use the same coverage conditions as S14, but make authoritative age the smallest representable positive duration greater than 24 hours.

**Expected state**

Classify the supplemented edition **Topology only**. Make no departure or arrival-time claim from it and evaluate regular GTFS as the next candidate.

**Prohibited outcome**

Do not show its clock time, a countdown, a stale departure, **on time**, Live, or Expected; do not round it back to 24 hours or reactivate a superseded edition.

## Veto-ordering and rider-copy cases

### Scenario 20 — Current unresolved service change

**Setup**

Prove the route/feed group Unavailable and provide an otherwise departure-eligible schedule. In the qualifying branch, provide independent current high-impact evidence of a governed possible bypass, reroute, short turn, suspension, closure, or invalidating track/path change, plus unresolved station, direction, segment, exact-stop, train, or path scope that materially affects the proposed claim. Include unrelated scheduled service outside that materially uncertain scope.

Run four control branches in which the only change evidence is, respectively, a delay-only alert, generic **Affected** metadata, missing scope metadata, or contradiction. Do not add independent current high-impact evidence to any control branch.

**Expected state**

In the qualifying branch, apply unresolved negative evidence before the scheduled time. For only the materially affected scope, replace the schedule with exactly **Service change—arrival unavailable** and show no optimistic clock time. Preserve unrelated eligible scheduled service and the official change message where required.

In each control branch, the lone condition neither creates arrival unavailability nor proves normal service. Continue only from the remaining independently supported fallback, veto, or no-estimate evidence; do not manufacture either a positive or negative service claim.

**Prohibited outcome**

Do not show the affected scheduled time beside the replacement, guess a stopping pattern, call the change a resolved bypass, widen unavailability to unrelated service, clear the high-impact risk because static data contains the trip, or use alternate wording for the required replacement. Do not use a delay-only alert, generic **Affected** marker, missing metadata, or contradiction alone to show **Service change—arrival unavailable**; do not use any of them as proof that service is normal.

### Case S17 — Known active veto during fallback

**Setup**

Prove the route/feed group Unavailable and provide a departure-eligible schedule. Provide a current resolved bypass, suspension, closure, planned-pattern exclusion, short turn, cancellation, or invalidating track conflict with exact supported scope. Include unaffected service outside that scope.

**Expected state**

Apply the veto before schedule selection can produce a visible departure for the affected claim. Suppress that scheduled claim and show the narrowest supported explanation. Preserve unaffected service independently.

**Prohibited outcome**

Do not let supplemented or regular GTFS override the veto, downgrade the affected claim to a stale scheduled row, imply normal service, widen suppression, or use the vetoed trip as a fallback departure.

### Case S18 — Cleared hard veto without two-update recovery

**Setup**

Begin with a current resolved catalog veto that hard-suppresses one exact arrival claim. Then end the alert or clear the adverse condition, but make the relevant route/feed group **Unavailable** before current coherent evidence can satisfy the row-specific release prerequisite or any later fresh coherent accepted train update can arrive. Provide a supplemented or regular static trip for the previously suppressed claim and independently eligible unrelated fallback claims.

**Expected state**

Keep the previously hard-suppressed claim suppressed because zero qualifying recovery updates exist. Static, supplemented, and regular schedule records and an Unavailable feed do not count as recovery update one or two. Show persistent **Live data unavailable** and only a neutral evidence-supported no-arrival treatment for that claim. Keep the ended service-change cause out of rider copy. Exact countdown, primary eligibility, guidance, and Scheduled arrival remain absent. Evaluate unrelated claims independently and allow their eligible fallback results.

**Prohibited outcome**

Do not restore the claim from static data; count feed unavailability, alert clearance, or schedule retrieval as a recovery update; show a Scheduled clock time, exact countdown, primary row, or stale service-change explanation for the claim; imply cancellation; or keep unrelated claims suppressed. Do not permit readmission until two consecutive fresh coherent accepted updates newer than the adverse evidence collectively prove stable identity, plausible stop order, current movement or stop progress, continued target service, and no unresolved service or track conflict, followed by every Live gate.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| S1 — Healthy feed missing one train | No fallback entry, static row, cancellation, or countdown | Pending |
| Scenario 19 | Affected group proven Unavailable; supplemented schedule selected; full non-live presentation; healthy group isolated | Pending |
| S3 — Regular GTFS next | Supplement ineligibility recorded; eligible regular schedule selected without live treatment | Pending |
| S4 — No service-date coverage | Both sources rejected for the service date; no estimate or invented service | Pending |
| S5 — Outside supplement horizon/coverage | Supplement Topology only; eligible regular GTFS evaluated next | Pending |
| Scenario 43 | Later validated edition wins for each claim inside overlap; earlier edition remains superseded only there | Pending |
| S7A — No rollback inside overlap | Later edition beyond 24 hours; earlier remains superseded for the claim; regular GTFS next | Pending |
| S7B — Outside overlap | Earlier edition remains eligible only within its own non-overlapping still-valid coverage | Pending |
| Scenario 49 | Canonically unchanged content with changed wrappers preserves one identity and original age anchor; currency does not reset | Pending |
| S9 — Failed edition | Failed edition excluded; retained validated copy persists and continues aging | Pending |
| S10 — No publication time | First successful retrieval anchors age; no invented timestamp | Pending |
| S10B — Future timestamp pair | First positive future instant and beyond-allowance future both quarantined with no currency state; regular GTFS or no estimate; no numeric skew invented | Pending |
| S10C — Regressed/contradictory timestamp | Supplement quarantined; regular GTFS or no estimate selected without retrieval substitution | Pending |
| S10D — Exact age zero | Publication equal to authoritative comparison is Current when every other gate passes | Pending |
| S11 / S12 — 2-hour pair | Exactly 2 hours Current; first positive duration beyond 2 hours Stale; no gap or overlap | Pending |
| Scenario 44A | 3-hour edition visibly Stale reference with exact warning and no live treatment | Pending |
| S14 / Scenario 44B — 24-hour pair | Exactly 24 hours Stale; first positive duration beyond 24 hours Topology only with no departure | Pending |
| Scenario 20 | Independent current high-impact evidence plus material scope uncertainty required; control branches create neither unavailability nor normal-service proof | Pending |
| S17 — Known veto | Veto defeats schedule in exact scope before presentation | Pending |
| S18 — Cleared hard veto | No schedule restoration without two qualifying live recovery updates; unrelated fallback preserved | Pending |

The result record remains Pending until it links durable observed evidence for a fixed reviewed version. Every prohibited-result check must be recorded. A failure remains in the record and must link its correction and rerun.
