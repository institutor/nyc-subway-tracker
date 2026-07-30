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

These cases define acceptance evidence for the [schedule fallback and currency policy](schedule-fallback-and-currency-policy.md). They test fallback entry, source ordering, service-date coverage, edition supersession, age anchors, exact currency boundaries, rider wording, and service-change veto ordering. The [feed health policy](feed-health-policy.md), [source role and precedence matrix](source-role-and-precedence-matrix.md), [evidence veto catalog](evidence-veto-catalog.md), [service-change impact and resolution policy](service-change-impact-and-resolution-policy.md), and [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

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

Select the supplemented edition before regular GTFS. In a separate fallback board, show a scheduled New York clock time with **Scheduled**, persistent **Live data unavailable**, successful retrieval age, and effective service date. Keep the unrelated healthy group in its independently supported live state.

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

Prove the relevant route/feed group Unavailable. Provide a validated recent supplemented edition whose effective coverage or horizon does not include the proposed departure. Provide regular GTFS that validly covers the operating service date and departure.

**Expected state**

Treat the supplement as **Topology only** for that claim and continue to regular GTFS as the next candidate. Use only the separated scheduled clock-time treatment.

**Prohibited outcome**

Do not extend the supplemented horizon, use its apparent youth to override coverage, return to another superseded supplement, or stop before evaluating eligible regular GTFS.

## Edition identity, supersession, and age-anchor cases

### Scenario 43 — Later validated edition overlaps an earlier edition

**Setup**

Provide two distinct validated supplemented editions with retained source-supported edition order and overlapping effective/service-date coverage. The later edition changes or removes at least one departure from the earlier edition. Both would otherwise be Current by age.

**Expected state**

Mark the later validated edition as the only non-superseded supplemented candidate throughout the overlap. Mark the earlier edition **Topology only** for the overlap and never use its more optimistic departure.

**Prohibited outcome**

Do not merge editions, select by the more favorable time, retain both as current, use retrieval order alone to invent version order, or silently roll back to the earlier edition.

### Case S7 — Later validated edition is not departure-eligible

**Setup**

After Scenario 43 establishes supersession over overlapping coverage, make the later edition non-departure-eligible for the claim because it is older than 24 hours or outside effective coverage. Provide an eligible regular-GTFS departure.

**Expected state**

Do not reactivate the superseded earlier edition. Continue to regular GTFS as the next candidate.

**Prohibited outcome**

Do not roll back to the earlier supplemented edition, erase the supersession edge, or show a departure from either Topology-only edition.

### Scenario 49 — Identical edition retrieved repeatedly

**Setup**

Provide one distinct validated supplemented edition with a retained content identity and age anchor. Retrieve identical content successfully one or more times, including a retrieval after the edition crosses the 2-hour boundary.

**Expected state**

Retain one edition identity and its original publication-time anchor, or its original first-successful-retrieval anchor when publication time is unavailable. The later retrieval observation does not reset currency; the edition becomes **Stale reference** after 2 hours. Rider details may truthfully update “last retrieved,” while preserving the original age basis.

**Prohibited outcome**

Do not create a new edition, reset age, relabel the edition Current, erase its first retrieval, or infer a publication time.

### Case S9 — Failed distinct new edition

**Setup**

Retain one validated supplemented edition, then receive a distinct purported later edition that fails validation. Advance decision time while the failed edition is retried.

**Expected state**

Keep the failed edition ineligible and retain the last validated copy. Do not mark the failed edition as superseding. Continue aging the retained copy from its unchanged age anchor and change its currency state when a boundary is crossed.

**Prohibited outcome**

Do not erase the retained copy, reset its age, validate the new edition by assumption, invent its publication time, or silently revert to a different earlier copy.

### Case S10 — Publication time unavailable

**Setup**

Provide a distinct validated edition with no supplied source publication time and a recorded first successful retrieval. Retrieve the same content again later.

**Expected state**

Use the first successful retrieval as the edition's age anchor. Retain subsequent retrieval observations separately and apply currency from the first retrieval.

**Prohibited outcome**

Do not invent a publication time, use the latest identical retrieval as the anchor, or treat validation time, device time, or file modification time as source publication time without approved evidence.

## Exact currency-boundary cases

### Case S11 — Exactly 2 hours

**Setup**

Provide a validated, non-superseded supplemented edition whose authoritative edition age is exactly 2 hours and whose effective and service-date coverage include the departure.

**Expected state**

Classify it **Current schedule** and allow its scheduled clock time to proceed through the current-veto checks.

**Prohibited outcome**

Do not classify exactly 2 hours as Stale reference or Topology only, round it upward, or bypass a veto.

### Case S12 — Just over 2 hours

**Setup**

Use the same qualifying conditions as S11, but make age the smallest representable positive duration greater than 2 hours.

**Expected state**

Classify it **Stale reference**. If no veto applies, show the scheduled clock time with persistent **Live data unavailable**, retrieval age, effective service date, and exactly **Stored schedule—service changes may differ**.

**Prohibited outcome**

Do not classify it Current schedule, wait until 3 hours to mark it stale, show a normal-looking board, or omit the stale warning.

### Scenario 44A — 3-hour-old stored schedule

**Setup**

Provide a validated, non-superseded supplemented edition exactly 3 hours old that covers the service date and departure and has no applicable veto.

**Expected state**

Classify it **Stale reference** and show only a scheduled clock time with **Scheduled**, persistent **Live data unavailable**, retrieval age, effective service date, and **Stored schedule—service changes may differ**.

**Prohibited outcome**

Do not call the edition Current schedule or Topology only; show a countdown, **on time**, Live, or Expected; or omit the warning.

### Case S14 — Exactly 24 hours

**Setup**

Provide a validated, non-superseded supplemented edition whose authoritative age is exactly 24 hours and whose effective and service-date coverage include the departure.

**Expected state**

Classify it **Stale reference** at the inclusive upper boundary. Its clock time may proceed through veto checks with the full stale presentation.

**Prohibited outcome**

Do not classify exactly 24 hours as Topology only, round it beyond the boundary, or omit the stale warning.

### Scenario 44B — Just over 24 hours

**Setup**

Use the same coverage conditions as S14, but make age the smallest representable positive duration greater than 24 hours.

**Expected state**

Classify the supplemented edition **Topology only**. Make no departure or arrival-time claim from it and evaluate regular GTFS as the next candidate.

**Prohibited outcome**

Do not show its clock time, a countdown, a stale departure, **on time**, Live, or Expected; do not round it back to 24 hours or reactivate a superseded edition.

## Veto-ordering and rider-copy cases

### Scenario 20 — Current unresolved service change

**Setup**

Prove the route/feed group Unavailable and provide an otherwise departure-eligible schedule. Provide a current service change whose material effect on the proposed arrival remains unresolved for one exact affected scope. Include unrelated scheduled service outside that scope.

**Expected state**

Apply unresolved negative evidence before the scheduled time. For the affected scope, replace the schedule with exactly **Service change—arrival unavailable** and show no optimistic clock time. Preserve unrelated eligible scheduled service and the official change message where required.

**Prohibited outcome**

Do not show the affected scheduled time beside the replacement, guess a stopping pattern, call the change a resolved bypass, widen unavailability to unrelated service, clear the change because static data contains the trip, or use alternate wording for the required replacement.

### Case S17 — Known active veto during fallback

**Setup**

Prove the route/feed group Unavailable and provide a departure-eligible schedule. Provide a current resolved bypass, suspension, closure, planned-pattern exclusion, short turn, cancellation, or invalidating track conflict with exact supported scope. Include unaffected service outside that scope.

**Expected state**

Apply the veto before schedule selection can produce a visible departure for the affected claim. Suppress that scheduled claim and show the narrowest supported explanation. Preserve unaffected service independently.

**Prohibited outcome**

Do not let supplemented or regular GTFS override the veto, downgrade the affected claim to a stale scheduled row, imply normal service, widen suppression, or use the vetoed trip as a fallback departure.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| S1 — Healthy feed missing one train | No fallback entry, static row, cancellation, or countdown | Pending |
| Scenario 19 | Affected group proven Unavailable; supplemented schedule selected; full non-live presentation; healthy group isolated | Pending |
| S3 — Regular GTFS next | Supplement ineligibility recorded; eligible regular schedule selected without live treatment | Pending |
| S4 — No service-date coverage | Both sources rejected for the service date; no estimate or invented service | Pending |
| S5 — Outside supplement horizon/coverage | Supplement Topology only; eligible regular GTFS evaluated next | Pending |
| Scenario 43 | Later validated overlapping edition wins; every earlier overlapping edition remains superseded | Pending |
| S7 — No rollback | Superseded supplement stays ineligible; regular GTFS becomes next candidate | Pending |
| Scenario 49 | Identical retrieval preserves one identity and original age anchor; currency does not reset | Pending |
| S9 — Failed edition | Failed edition excluded; retained validated copy persists and continues aging | Pending |
| S10 — No publication time | First successful retrieval anchors age; no invented timestamp | Pending |
| S11 / S12 — 2-hour pair | Exactly 2 hours Current; first positive duration beyond 2 hours Stale; no gap or overlap | Pending |
| Scenario 44A | 3-hour edition visibly Stale reference with exact warning and no live treatment | Pending |
| S14 / Scenario 44B — 24-hour pair | Exactly 24 hours Stale; first positive duration beyond 24 hours Topology only with no departure | Pending |
| Scenario 20 | Affected optimistic time replaced by exact unavailable copy; unrelated service preserved | Pending |
| S17 — Known veto | Veto defeats schedule in exact scope before presentation | Pending |

The result record remains Pending until it links durable observed evidence for a fixed reviewed version. Every prohibited-result check must be recorded. A failure remains in the record and must link its correction and rerun.
