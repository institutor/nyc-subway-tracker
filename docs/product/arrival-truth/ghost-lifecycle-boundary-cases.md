# Ghost lifecycle boundary cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§9–10 and 31.3 scenarios 13–14; arrival-truth and service-changes plan Tasks 8 and 12 `Artifacts` and Task 8 `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define acceptance evidence for the [arrival confidence and ghost policy](arrival-confidence-and-ghost-policy.md). They test state evidence, primary eligibility, precision, Due transitions, movement-age boundaries, exact-stop suppression, unusual dwell, and valid long holds. They do not create a new threshold, operating margin, percentile, identity join, schedule-fallback rule, or stop-service claim.

The [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md), [route-level feed health policy](feed-health-policy.md), [time and train continuity policy](time-and-train-continuity-policy.md), and [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the observed result is recorded, and the Truth Gate accepts the evidence. An expected result written here is not a passing result.

## Common fixture and evidence capture

Unless a case says otherwise:

- the route/feed-group snapshot is Current, complete, coherent, validly decoded, and non-regressed;
- the train is an already-running coherent assigned train instance;
- the displayed exact directional stop remains in its ordered remaining-stop sequence;
- actual destination and normalized rider-facing direction agree;
- no bypass, suspension, closure, planned-pattern exclusion, unresolved reroute, or track conflict applies;
- the arrival estimate is plausible except for the age or no-progress condition under test; and
- feed age and train movement age are recorded as separate values.

Each run must record the actual inputs, authoritative timestamps, admission gates, state, board area, primary eligibility, displayed precision and copy, prohibited outcomes, product version, run date, and reviewer. A case remains Pending without observed evidence.

## Confidence-state treatment matrix

| State case | Required evidence | Primary next-three? | Required precision and rider result | Prohibited result |
|---|---|---:|---|---|
| Live | Healthy feed; assigned coherent train; movement or stop progress within 90 seconds; all admission gates and the Due/no-progress rule pass. A Due episode beyond 60 seconds cannot remain Live. | Yes | Rounded countdown, such as **3 min · Live**. | Exact precision unsupported by evidence, Scheduled clock time, Live after more than 60 seconds Due without progress, or a row admitted despite a stop or track veto. |
| Expected | Assigned physical train at origin; no movement yet; departure not materially overdue; stable across two updates; all other gates pass. | Yes | Evidence-supported range, such as **Expected in 6–8 min**. | Live or Due without movement, an exact live countdown, or exclusion merely because the train is Expected. |
| Holding | Current feed but movement or stop progress is older than 90 seconds through exactly 180 seconds, or Due has lasted more than 60 seconds without progress while movement age remains no more than 180 seconds. Due elapsed time is a degradation floor, so movement age beyond 180 seconds still escalates a stop-confirmed train to Uncertain. | No | Frozen time plus held evidence, such as **Holding near 14 St · last moved 2 min ago**, in a separate warning or secondary area. | Advancing countdown, a next-three slot, Due beyond its limit, Holding when movement age is beyond 180 seconds, or silent deletion. |
| Confirmed-pattern Uncertain | No movement beyond 180 seconds, identity churn, implausible ETA jump, or degraded feed, while exact displayed stop service and track remain confirmed. | No | No exact minute; de-ranked secondary copy **Arrival uncertain**. | Primary placement, advancing/frozen exact minute on the Uncertain row, or Uncertain used to conceal stop-pattern or track uncertainty. |
| Scheduled | Relevant live feed is genuinely unavailable; eligible schedule exists; no current veto applies. | No | Clearly separated fallback clock time, such as **Scheduled 10:42 · live data unavailable**. | Countdown, Live or Expected label, mixing with live next-three, or fallback that overrides a current veto. |

## Movement-age boundary cases

### Case M1 — Exactly 90 seconds

**Setup**

Use the common already-running train fixture. Set train movement or stop-progress age to exactly 90 seconds. Keep feed snapshot age Current and record it independently.

**Expected result**

The train remains **Live** and is eligible for the primary next-three because progress is within 90 seconds. Show only its supported rounded countdown and **Live** state.

**Prohibited result**

Do not change it to Holding merely because it reached 90 seconds, confuse movement age with feed age, or skip any other admission gate.

### Case M2 — Just over 90 seconds

**Setup**

Repeat M1 with movement or stop-progress age at the first representable instant strictly greater than 90 seconds. Keep the feed Current.

**Expected result**

Change the train to **Holding**. Freeze the last supported time, remove it from the primary next-three, and retain a separate warning or secondary held-train row with location or last-moved age.

**Prohibited result**

Do not continue Live, advance the countdown, call the feed Degraded, show Arrival uncertain solely from this boundary, or delete the train.

### Case M3 — Exactly 180 seconds

**Setup**

Use the common fixture with movement or stop-progress age exactly 180 seconds and a Current feed.

**Expected result**

Keep the train **Holding** in the separate warning or secondary area. Keep the last supported time frozen and retain the confirmed train context.

**Prohibited result**

Do not change it to Uncertain at exactly 180 seconds, return it to the next-three, advance a countdown, or remove a still-valid train.

### Case M4 — Just over 180 seconds with confirmed stop service

**Setup**

Repeat M3 at the first representable instant strictly greater than 180 seconds. Keep one coherent train context, the displayed exact directional stop in the coherent remaining pattern, trustworthy track/path evidence, and every service-change gate resolved.

**Expected result**

Change the train to **Uncertain**, remove the exact minute, and de-rank it to the expandable secondary area with **Arrival uncertain**. The route/feed group remains Current because feed age is separate.

**Prohibited result**

Do not keep a frozen exact minute on the Uncertain row, place it in the primary next-three, declare a feed-wide outage, or silently delete it.

### Case M5 — Just over 180 seconds with stopping-pattern or track uncertainty

**Setup**

Repeat M4, but make either the displayed exact directional stop materially unresolved in the stopping pattern or the track/path evidence untrustworthy, including a qualifying non-terminal actual-versus-scheduled-track conflict.

**Expected result**

Suppress the entire affected train row. Show only the narrowest supported service-change or track consequence beside the suppression state.

**Prohibited result**

Do not show **Arrival uncertain**, a lower-confidence or frozen countdown, a Scheduled replacement, or dependent platform guidance. Stopping-pattern or track uncertainty is never merely Uncertain.

## Due and no-progress boundary cases

### Case D1 — Exactly 60 seconds Due

**Setup**

Begin a Due episode when an otherwise-Live arrival becomes due. Provide no new movement or stop progress for exactly 60 seconds, while the last movement evidence remains fresh and every Live gate continues to pass.

**Expected result**

**Due** remains permitted at exactly 60 seconds because the label has lasted no more than 60 seconds. It remains primary only while all Live evidence is still supported.

**Prohibited result**

Do not extend Due beyond 60 seconds, reset the timer from a new prediction alone, or keep Due if movement is no longer fresh.

### Case D2 — Just over 60 seconds without progress

**Setup**

Repeat D1 at the first representable instant strictly greater than 60 seconds with no movement or stop progress.

**Expected result**

The Due/no-progress floor prevents Due or Live. Because this continuation of D1 still has movement age no more than 180 seconds, freeze immediately as **Holding**, remove the train from the primary next-three, and retain it as a separate warning or secondary held-train status. Show no advancing or exact Due claim.

**Prohibited result**

Do not continue Due, decrement the prior time, keep a next-three slot, relabel the feed, or delete the train.

### Case D3 — Exactly 120 seconds without progress

**Setup**

Continue a valid train and uninterrupted Due/no-progress episode to exactly 120 seconds. Keep movement age no more than 180 seconds, the feed Current, the identity coherent, and exact stop service and track/path confirmed.

**Expected result**

The train remains secondary **Holding** context with no exact advancing minute. It is not in the primary next-three.

**Prohibited result**

Do not restore Due or Live, return the train to primary, refresh the frozen value from a prediction-only change, or silently delete the valid train. This Holding result must not be generalized to movement age beyond 180 seconds.

### Case D4 — Just over 120 seconds without progress

**Setup**

Repeat D3 at the first representable instant strictly greater than 120 seconds.

**Expected result**

Remove any remaining exact arrival-event treatment from the primary next-three. Retain train-level context only while the entity, identity, exact stopping pattern, and track/path remain valid. Use the stricter supported movement state: Holding through exactly 180 seconds and Uncertain without an exact minute beyond 180 seconds.

**Prohibited result**

Do not preserve or reintroduce the exact event in primary, keep Holding when movement age is beyond 180 seconds, delete the train solely because 120 seconds elapsed, or confuse the Due/no-progress timer with feed age. Suppress rather than show Uncertain if exact stop service or track/path becomes uncertain.

### Case D5 — Prediction changes without progress

**Setup**

During D1 through D4, update only the predicted arrival value. Provide no new authoritative movement or stop progress.

**Expected result**

Keep the original Due/no-progress timer. Apply the same 60- and 120-second boundaries from the original Due start, recompute movement age independently, and use the stricter supported state after the stop-pattern and track/path gates.

**Prohibited result**

Do not reset the timer, manufacture fresh movement, or extend Due because the predicted time changed.

### Case D6 — Overlapping clocks: 91 seconds Due and 181 seconds movement age

**Setup**

Run the same Current-feed fixture twice with uninterrupted Due/no-progress elapsed time of exactly 91 seconds and train movement age of exactly 181 seconds. In run A, keep one coherent train context, the displayed exact directional stop in its coherent remaining pattern, and trustworthy track/path evidence. In run B, make either the exact displayed stop pattern or track/path materially uncertain.

**Expected result**

In run A, the Due floor already prohibits Due or Live, and movement age beyond 180 seconds is stricter than Holding. Show secondary **Uncertain** with **Arrival uncertain** and no exact minute. In run B, suppress the entire affected row and show only the narrowest supported service-change or track consequence.

**Prohibited result**

In neither run may the train remain Due, Live, Holding, or primary. Do not let Due elapsed time of no more than 120 seconds override movement age of more than 180 seconds. Do not use Uncertain to conceal an unresolved exact stop pattern or track/path.

## Acceptance Scenario 13 — Fresh feed, 100 seconds without movement

**Setup**

Provide a Current coherent feed snapshot containing an already-running train whose movement or stop-progress age is exactly 100 seconds. Keep its identity, exact displayed stopping pattern, destination, direction, service-change status, and track/path evidence coherent.

**Expected result**

Keep the route/feed group **Current** and change only this train to **Holding**. Freeze the last supported time, remove the train from the primary next-three, and retain the separate held-train warning or secondary context.

**Prohibited result**

Do not keep the countdown moving, classify the route/feed group as Degraded or Unavailable, show Arrival uncertain at 100 seconds solely from movement age, or silently delete the train.

## Acceptance Scenario 14 — Valid train held for several minutes

**Setup**

Provide a Current coherent feed in which an already-running train remains held for several minutes and continues to have a valid entity, coherent identity, confirmed exact displayed stop in its remaining pattern, agreeing destination and direction, and trustworthy service-change and track evidence. Its movement age is strictly greater than 180 seconds.

**Expected result**

Retain the train as secondary **Uncertain** context with **Arrival uncertain** and no exact minute. The valid train does not disappear merely because the hold is long. If later movement arrives, reevaluate every gate before restoring a stronger state.

**Prohibited result**

Do not silently delete the train, keep it Holding with an exact time beyond the movement boundary, return it to the primary next-three, or infer cancellation. If its stopping pattern or track becomes uncertain, suppress rather than retain it as Uncertain.

## Long valid origin-terminal hold

### Case T1 — Assigned train awaiting departure

**Setup**

Provide a Current coherent feed with a physical train assigned at its origin terminal. It has not moved, remains stable across at least two updates, is not materially overdue, and has a coherent identity, exact displayed directional stop in its remaining pattern, agreeing destination and direction, and no service-change or track veto. Its pre-departure terminal hold is long enough to exceed 180 seconds.

**Expected result**

Keep the train **Expected** and eligible for chronological primary ordering by the center of its evidence-supported range. Show **Expected in _range_**, not Live or Due. Treat the train as one continuing instance.

**Prohibited result**

Do not apply the already-running movement-age boundary mechanically to turn this qualifying origin train into Holding or Uncertain, invent movement, show an exact countdown, duplicate it, or delete it because the terminal hold is long. Once it is materially overdue or another Expected condition fails, reevaluate instead of preserving Expected.

## Unusual-dwell cases

### Case U1 — At the comparison threshold

**Setup**

For a station, route, direction, and operating period, calculate the greater of two minutes plus a small operating margin or the observed high-percentile dwell. Set the observed dwell equal to that greater value. Record the approved calibrated inputs without adding a number in this artifact.

**Expected result**

Do not flag unusual dwell because the rule requires the dwell to exceed the greater value. Continue to assign confidence, board area, and precision from the train's independent evidence.

**Prohibited result**

Do not invent the operating margin or percentile, flag equality as exceeding, or use dwell alone to suppress or delete the train.

### Case U2 — Above the comparison threshold

**Setup**

Repeat U1 with observed dwell strictly greater than the calculated greater value. Keep the train entity and exact stop service valid.

**Expected result**

Flag unusual dwell for review. Keep or change the rider-visible state only as supported by the independent movement, Due, identity, service-change, and track rules. Unusual dwell alone never deletes the train.

**Prohibited result**

Do not infer cancellation, remove a confirmed stop, suppress the row, invent a numeric threshold, or assume an intermediate-station expectation applies unchanged to a terminal.

## Feed-age separation case

### Case F1 — Old train movement in a fresh feed

**Setup**

Provide a feed snapshot whose authoritative age is no more than 90 seconds and one train movement timestamp just over 90 seconds old. Include another train with current movement evidence.

**Expected result**

Keep the route/feed group Current. Change only the old-movement train to Holding and evaluate the other train normally.

**Prohibited result**

Do not use movement age as feed age, freeze unrelated trains, or use fresh feed age to keep the old-movement train Live.

## Required scenario evidence

| Scenario or boundary | Required actual-result evidence | Status |
|---|---|---|
| Live, Expected, Holding, Uncertain, Scheduled | Evidence inputs, primary eligibility, board area, precision, exact rider treatment, and prohibited treatments for every state | Pending |
| Exactly 90 / just over 90 seconds | Live at exactly 90; frozen non-primary Holding immediately above 90 | Pending |
| Exactly 180 / just over 180 seconds | Holding at exactly 180; confirmed-pattern Uncertain without an exact minute immediately above 180 | Pending |
| Stop-pattern or track uncertainty | Entire affected row suppressed; no Arrival uncertain treatment survives | Pending |
| Due exactly 60 / just over 60 seconds | Due allowed through exactly 60 only with movement age no more than 90 seconds; immediately above 60, the tested movement age no more than 180 seconds produces Holding and an age beyond 180 would require Uncertain | Pending |
| No progress exactly 120 / just over 120 seconds | At exactly 120, movement age no more than 180 seconds produces secondary Holding and an age beyond 180 produces secondary Uncertain; above 120 no exact primary event survives; no valid train is silently deleted | Pending |
| Overlapping Due and movement clocks | At 91 seconds Due elapsed and 181 seconds movement age, confirmed stop/track evidence produces secondary Uncertain without an exact minute; invalid stop/track evidence suppresses the row | Pending |
| Scenario 13 | Current feed and 100-second movement age produce Holding for that train only | Pending |
| Scenario 14 | Several-minute valid held train remains secondary without an exact minute and is not silently deleted | Pending |
| Long valid origin-terminal hold | Qualifying assigned origin train remains Expected without invented movement or deletion | Pending |
| Unusual dwell | Greater-value comparison uses no invented calibration; equality does not flag; exceedance flags but never deletes by itself | Pending |
| Feed/movement separation | Current feed remains Current while only the old-movement train changes state | Pending |

Any failed prohibited-result check remains in the evidence record and must link its correction and rerun. No case becomes Approved merely because this file specifies the expected result.
