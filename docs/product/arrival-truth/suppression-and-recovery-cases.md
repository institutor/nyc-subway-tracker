# Suppression and recovery acceptance cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§10.3–10.4 and 31.3 scenarios 15–16; arrival-truth and service-changes plan Tasks 9 and 12 `Artifacts` and Task 9 `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define acceptance evidence for the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md). They directly cover approved-specification Section 31.3 scenarios 15–16 and test every Section 10.3 hard-suppression cause, the exact 59/60-second boundary, one versus twice-confirmed stop-order regression, and complete versus incomplete two-update recovery.

The [arrival confidence and ghost policy](arrival-confidence-and-ghost-policy.md), [route-level feed health policy](feed-health-policy.md), [time and train continuity policy](time-and-train-continuity-policy.md), [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md), [evidence veto catalog](evidence-veto-catalog.md), and [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the observed result is recorded, and the Truth Gate accepts the evidence. Expected results written here are not passing results.

## Common fixture and evidence capture

Unless a case says otherwise:

- the route/feed-group snapshot is Current, accepted, complete, coherent, validly decoded, non-regressed, and free of bulk-drop or other anomaly evidence;
- the train begins as one coherent Live instance in the primary next-three with a supported exact countdown;
- its exact directional target, destination, direction, movement/progress, service-change, and track gates initially pass;
- authoritative source chronology, not a rider device clock, measures elapsed time; and
- no static or supplemented record may repair a missing live claim.

Capture every input snapshot and its completeness decision, authoritative observation time, entity presence, identity and stop sequence, absence count and elapsed time, service and track evidence, internal disposition, visible board result, precision, primary eligibility, and recovery-update count. Confirm that no disappearance-only fixture produces cancellation language and that any retained quality record contains no personal or linkable rider data.

## Absence and grace cases

### Scenario 15 — One healthy complete-snapshot absence

**Setup:** At observation time `T0`, provide one otherwise healthy complete snapshot that omits the previously Live entity. Do not provide cancellation, bypass, suspension, target removal, track conflict, or anomaly evidence.

**Expected:** Immediately remove Live, the exact countdown, and the primary row. Retain one uncertain continuity candidate only in internal grace, start the absence clock at `T0`, and leave the other admitted rows ordered normally. If the missing row creates a gap, use only the supported board-level limited-arrivals consequence.

**Prohibited:** Continuing or freezing the exact countdown publicly; consuming a primary slot; showing Expected, Holding, Uncertain, Scheduled, “grace,” or “quarantine” as a replacement row; restoring static data; hard-suppressing solely because this is the first absence before 60 seconds; or calling the train cancelled.

### Case S2 — 59 seconds after first absence

**Setup:** After Scenario 15's first qualifying absence at `T0`, advance authoritative elapsed time to `T0 + 59 seconds` without a second accepted healthy complete-snapshot absence and without a recovery update.

**Expected:** Keep the candidate in internal grace. Keep Live, exact countdown, and primary eligibility absent. Record that the count test and elapsed test have not yet hard-suppressed the candidate.

**Prohibited:** Treating 59 seconds as “at least 60”; restoring the public row during grace; or inferring cancellation.

### Case S3 — Exactly 60 seconds after first absence

**Setup:** After the first qualifying absence at `T0`, advance authoritative elapsed time to exactly `T0 + 60 seconds` without a qualifying recovery sequence and without any second countable healthy complete-snapshot absence before that boundary. Absence count remains one through `T0 + 60 seconds`, so the elapsed test is the controlling trigger.

**Expected:** Hard-suppress at exactly 60 seconds from the elapsed test. Record one countable absence through the boundary, the controlling elapsed-time trigger, and only the permitted non-personal quality record.

**Prohibited:** Introducing a second countable absence before the boundary, attributing this fixture to the count-two trigger, waiting until 61 seconds, keeping internal grace active as the controlling disposition, continuing any public arrival treatment, or inferring cancellation.

### Scenario 16 — Second consecutive healthy complete-snapshot absence

**Setup:** Provide a second accepted healthy complete snapshot that again omits the same entity, 20 seconds after the first qualifying absence.

**Expected:** Hard-suppress immediately on the second countable absence, before the 60-second elapsed boundary. Keep the row, exact countdown, and primary eligibility absent. Record absence count two and preserve only the permitted non-personal quality record.

**Prohibited:** Waiting for 60 seconds; treating the second absence as another rider-visible grace state; restoring from static data; or calling the train cancelled.

### Case S5 — Incomplete update does not count

**Setup:** After one qualifying healthy complete absence, provide an incomplete or anomalous update that also lacks the entity, then provide a later accepted healthy complete snapshot.

**Expected:** Do not count the incomplete update as a second healthy absence and do not treat it as recovery. Apply any stricter feed-health presentation. Continue the elapsed clock from the first qualifying absence. Count the later accepted healthy complete omission as the second countable absence and hard-suppress then, unless the 60-second elapsed test qualified earlier.

**Prohibited:** Manufacturing a second absence from the incomplete update, resetting the absence clock, restoring the entity because absence cannot be evaluated in that update, or interpreting incomplete population data as cancellation.

## Other hard-suppression cases

### Case S6 — Target removed

**Setup:** Provide one fresh coherent update for the same train whose ordered remaining-stop sequence no longer contains the displayed exact directional target, while a static pattern still includes it.

**Expected:** Hard-suppress the claim at that target immediately. Keep independently eligible claims at other exact stops subject to their own gates.

**Prohibited:** Waiting for a second target-removal update, retaining a lower-confidence row, reconstructing the target from static data, or inferring cancellation.

### Case S7 — Arrival expired without continuing evidence

**Setup:** Advance the predicted arrival past its valid event time and provide no continuing coherent train, movement, stop-progress, or stop-call evidence.

**Expected:** Hard-suppress the expired arrival event. Preserve only the non-personal review record.

**Prohibited:** Leaving a past or zero-minute countdown, inventing a new future call, downgrading the expired event to a visible uncertain row, or calling it cancelled without cancellation evidence.

### Case S8 — One impossible stop-order regression

**Setup:** Provide one accepted coherent update whose remaining-stop sequence impossibly moves the train backward relative to accepted progress. Do not provide a second confirmation.

**Expected:** Immediately remove exact precision and primary eligibility and quarantine the candidate internally. Record regression count one. Do not yet classify the candidate as hard-suppressed under the twice-confirmed regression cause.

**Prohibited:** Continuing the Live row; exposing quarantine or grace as rider copy; treating one regression as twice-confirmed; or using an apparently plausible ETA to override the order defect.

### Case S9 — Twice-confirmed stop-order regression

**Setup:** Follow Case S8 with a second independently accepted coherent update that confirms the same impossible regression. Do not use a duplicate delivery of the first snapshot.

**Expected:** Hard-suppress on confirmation two and preserve only the permitted non-personal quality record.

**Prohibited:** Requiring a third confirmation; treating a replayed snapshot as independent proof; keeping an Uncertain or other rider-visible train row; or inferring cancellation.

### Case S10 — Confident duplicate pair

**Setup:** Provide two records that one-to-one continuity evidence confidently establishes as the same train, with one stronger coherent record and one weaker duplicate.

**Expected:** Hard-suppress the weaker duplicate immediately. Keep the stronger instance only if it independently passes every admission gate, and show at most one rider-visible train.

**Prohibited:** Showing both records, merging ambiguous evidence, suppressing the stronger instance merely to remove the duplicate, or restoring the weaker record after one update.

### Case S11 — Explicit cancellation

**Setup:** Provide current authoritative evidence explicitly cancelling the supported train or trip scope.

**Expected:** Hard-suppress only the cancelled scope and use only the approved rider-facing consequence supported by that evidence.

**Prohibited:** Widening cancellation beyond its scope, treating earlier disappearance as the cancellation proof, or retaining a lower-confidence arrival.

### Case S12 — Bypass

**Setup:** Provide current resolved, scoped evidence that establishes a bypass of the exact target and direction while positive live prediction remains.

**Expected:** Hard-suppress the affected exact-stop claim and show the narrowest supported service-change consequence.

**Prohibited:** Allowing prediction to override the veto, retaining Arrival uncertain, widening the bypass beyond supported scope, or calling materially unresolved high-impact scope a resolved bypass.

When high-impact bypass or reroute evidence leaves material scope unresolved, use the separately governed Task 6 **arrival claim unavailable** outcome: withhold the affected row and preserve the official message without asserting a resolved bypass or labeling the outcome resolved hard suppression. This boundary remains fail-closed.

### Case S13 — Suspension

**Setup:** Provide a current suspension resolved to a route, segment, direction, time, and affected exact-stop claim, plus unrelated coherent service.

**Expected:** Hard-suppress only the claim inside the suspension scope. Keep unrelated service independently eligible.

**Prohibited:** Retaining the suspended claim, suppressing the entire network or shared complex, or inventing substitute service.

### Case S14 — Invalidating track conflict

**Setup:** Provide a non-terminal actual-versus-scheduled-track conflict that invalidates the target or downstream path and dependent guidance.

**Expected:** Hard-suppress affected arrivals and guidance immediately. Preserve the candidate only as internal conflict evidence. A first later coherent path update begins recovery update one and restores nothing; require a second qualifying update and all five recovery conditions before Live readmission.

**Prohibited:** Treating normal terminal variation as this fixture, retaining a lower-confidence row or guidance, clearing the conflict from a new predicted time or one coherent path update alone, waiving any recovery condition, or showing a Scheduled replacement inside the live board.

## Recovery cases

### Case R1 — One good update cannot restore precision

**Setup:** After any grace, quarantine, or hard-suppression event, provide one fresh coherent update that on its own appears to support stable identity, plausible stop order, current progress, continued target service, and no unresolved service or track conflict.

**Expected:** Count recovery update one. Keep the candidate outside the primary next-three and keep the exact countdown absent.

**Prohibited:** Restoring Live, an exact countdown, primary eligibility, or dependent guidance from one apparently good update.

### Case R2 — Complete two-update recovery

**Setup:** Provide two consecutive fresh coherent accepted updates newer than the adverse evidence. Across both, demonstrate one stable identity and continued exact target service; plausible stop order; current movement or stop progress; and no unresolved cancellation, bypass, suspension, closure, planned-pattern exclusion, reroute, or track conflict. Let the second update leave every Live admission gate passing.

**Expected:** Keep the row absent after update one. After update two, reevaluate all admission gates, restore one coherent primary Live row with a supported exact countdown, and order it chronologically among admitted Live and Expected trains.

**Prohibited:** Restoring after update one, carrying forward a pre-suppression countdown, skipping any of the five recovery conditions, duplicating the train, or treating recovery as proof that a prior suppression was cancellation.

### Case R3 — Missing current movement or progress blocks recovery

**Setup:** Provide two fresh coherent accepted updates that establish stable identity, plausible stop order, continued target service, and no unresolved service or track conflict, but do not establish current movement or stop progress. In separate runs, Task 8 evidence may independently support non-primary Holding or Uncertain context.

**Expected:** Five-condition Task 9 recovery remains incomplete because condition 3 is absent. Keep the exact countdown and primary eligibility absent. Any independently supported Holding or Uncertain context remains secondary under the arrival confidence and ghost policy and is not recorded or described as completed Task 9 recovery.

**Prohibited:** Calling the pair qualifying or complete; restoring Live or Expected; showing any primary row or exact countdown; promoting Holding or Uncertain to the primary next-three; describing secondary Task 8 context as Task 9 recovery; or inventing current movement/progress.

### Case R4 — Incomplete second recovery update

**Setup:** Provide one qualifying recovery update, then an incomplete, stale, malformed, regressed, contradictory, anomalous, or otherwise nonqualifying update. Follow with one fresh coherent update.

**Expected:** The nonqualifying update breaks confirmation and does not count. Keep the public row absent. Treat the later fresh coherent update as a new recovery update one and require one more qualifying update before readmission.

**Prohibited:** Counting the incomplete update, combining nonconsecutive evidence to reach two, restoring precision after the later update alone, or using missing fields as positive evidence.

### Case R5 — Two updates with one unresolved condition

**Setup:** Provide two fresh updates but leave exactly one approved condition unresolved in each run: ambiguous identity, implausible stop order, no current progress, target absent, or unresolved service/track conflict.

**Expected:** Recovery remains incomplete in every run. Keep exact precision and primary eligibility absent and apply any stricter veto.

**Prohibited:** Majority-voting the four passing conditions, averaging contradictory updates, substituting static evidence for the target, or weakening a service or track veto.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| Scenario 15 | First healthy complete absence immediately removes Live, exact countdown, and primary slot; internal grace only; no cancellation claim | Pending |
| S2 / S3 — 59 and exactly 60 seconds | 59 seconds remains internal grace with no public row; with absence count still one, exactly 60 seconds hard-suppresses from the controlling elapsed trigger | Pending |
| Scenario 16 | Second healthy complete absence hard-suppresses before 60 seconds; no cancellation claim | Pending |
| S5 — Incomplete update | Incomplete update counts as neither absence nor recovery; elapsed clock and stricter feed-health behavior verified | Pending |
| S6 — Target removed | Exact target claim hard-suppressed immediately; no static reconstruction | Pending |
| S7 — Expired arrival | Expired event removed without a past countdown, invented call, or cancellation inference | Pending |
| S8 / S9 — Stop-order regression | First regression quarantines and removes precision; second independent confirmation hard-suppresses | Pending |
| S10 — Duplicate pair | Weaker confident duplicate removed; at most one independently eligible train remains | Pending |
| S11 — Cancellation | Explicit evidence and narrow supported scope verified | Pending |
| S12 — Resolved bypass boundary | Resolved scoped bypass hard-suppresses; materially unresolved high-impact scope stays fail-closed as Task 6 arrival claim unavailable, not resolved suppression | Pending |
| S13 — Suspension | Only the resolved suspended scope is removed; unrelated service remains | Pending |
| S14 — Track conflict | Affected arrivals and guidance are removed; prediction alone cannot clear the conflict | Pending |
| R1 — One good update | No precision or primary recovery after one apparently good update | Pending |
| R2 — Complete recovery | Both fresh coherent updates and all five conditions proven; full readmission and exact Live evidence verified | Pending |
| R3 — Missing movement/progress | Two updates without condition 3 leave recovery incomplete, exact countdown and primary eligibility absent; no Expected restoration; secondary Task 8 context is not recovery | Pending |
| R4 — Incomplete recovery | Nonqualifying update breaks confirmation; a later good update restarts at one | Pending |
| R5 — Missing condition | Each unresolved recovery condition independently blocks exact countdown and primary eligibility | Pending |

Any failed prohibited-result check remains in the evidence record and must link its correction and rerun. No case becomes Approved merely because this document specifies the expected result.
