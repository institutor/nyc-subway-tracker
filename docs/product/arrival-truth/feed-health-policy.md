# Route-level feed health policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§6, 9–10, 27, and 31.3 scenarios 17–18; arrival-truth and service-changes plan Task 4 `Artifacts` and `Ordered steps` |
| Owner | Data Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](snapshot-anomaly-and-recovery-cases.md) |

## Purpose and authority

This policy owns route-level real-time feed health, snapshot freshness, anomaly disposition, and recovery eligibility for arrival truth. It applies the claim-by-claim precedence and negative-evidence rules in the [source role and precedence matrix](source-role-and-precedence-matrix.md) and [evidence veto catalog](evidence-veto-catalog.md), and the authoritative-time rules in the [time and train continuity policy](time-and-train-continuity-policy.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This policy is **Draft**. It and its linked cases remain **Pending** and cannot be treated as current guidance until the Truth Gate approves them.

## Independent route/feed-group health

Evaluate health independently for each relevant real-time route or published feed group. Assign a snapshot to the narrowest supported route/feed-group scope before its evidence can affect a board.

- A failure, stale snapshot, or anomaly in one group changes only that group and the routes supported by it.
- A healthy unrelated group remains live and continues to be evaluated from its own current evidence.
- A failed group cannot force unrelated subway lines into schedule fallback, **Live data updating**, or an unavailable state.
- When one published group covers several routes, an anomaly that cannot be narrowed safely applies to every route in that group, but not beyond it.
- Simultaneous disappearance across several groups is anomaly evidence for each affected group. It does not widen the effect to a group whose own snapshots remain fresh and coherent.

Health is an evidence-admission decision. It does not prove cancellation, normal service, or that a train will continue its published pattern.

## Snapshot health states

Snapshot age is measured from the latest complete snapshot's authoritative source timestamp under the [authoritative time policy](time-and-train-continuity-policy.md). The rider's phone clock cannot change a health state.

| Route/feed-group state | Exact boundary | Consequence |
|---|---|---|
| **Current** | The latest complete, valid, coherent snapshot is no more than 90 seconds old. | Its records may proceed to the remaining arrival-admission and veto checks. Current health alone does not authorize an exact countdown. |
| **Degraded** | The latest complete coherent snapshot is 91–180 seconds old, inclusive. | Preserve the last coherent information, freeze every preserved countdown, and show **Live data updating** for the affected scope. |
| **Unavailable** | The latest complete coherent snapshot is more than 180 seconds old; or repeated update failures have occurred; or decoding is invalid; or the feed timestamp has regressed. | Reject the affected update as a basis for exact countdowns. Do not advance preserved countdowns or infer cancellation or normal service. Any separately governed schedule fallback must remain unmistakably scheduled and must still obey current negative evidence and unresolved-change vetoes. |

Exactly 90 seconds is **Current**. Exactly 91 seconds and exactly 180 seconds are **Degraded**. Any age greater than 180 seconds is **Unavailable**.

The approved feed-age state input is whole elapsed seconds from authoritative source chronology. Therefore 91 seconds is the immediate representable age above 90, and 181 seconds is the immediate representable age above 180. Do not round a differently represented source age into a stronger state; any change in source-time precision returns this Draft policy and its boundary cases to Product and Data Quality review.

“Repeated update failures” is a named invalidating condition, not a numeric threshold in this policy. No reviewer may invent a count, interval, or percentage for it. Calibration requires observed evidence and Product and Data Quality approval.

An invalidating condition controls even when the apparent snapshot age would otherwise be Current or Degraded. A timestamp regression therefore makes the affected route/feed-group health **Unavailable** immediately. The preservation and recovery presentation below may still show the last coherent state as frozen context; it does not relabel the regressed snapshot as Degraded or accept it.

## Alert-context currency and fail-closed risk

Alert context is **Current** only when its authoritative snapshot age is no more than ten minutes. Exactly ten minutes is current; more than ten minutes is stale.

A stale, failed, missing, contradictory, or anomalous alert snapshot never proves normal service and never clears an earlier service-change risk. When a current or unresolved active change may affect the station, direction, segment, or train and its impact cannot be resolved safely, the board fails closed: withhold the affected positive arrival claim rather than assuming the train will stop.

Current feed health and stale alert context are separate decisions. A fresh train snapshot cannot override unresolved negative evidence, and a current alert snapshot with no relevant negative evidence does not by itself create an arrival.

## Feed snapshot age is not train movement age

Evaluate two separate clocks:

| Clock | Question answered | Required disposition |
|---|---|---|
| Feed-wide snapshot age | Is the route/feed group's latest complete snapshot fresh and admissible? | Assign **Current**, **Degraded**, or **Unavailable** to that route/feed group. |
| Train-specific movement age | How recently does the accepted train record prove movement? | Change that train to the governed **Holding** or **Arrival uncertain** state when its movement evidence is old; freeze or withhold its exact countdown as required. |

A fresh coherent feed can carry an old movement timestamp for one train. That condition changes the train's state; it does not declare a route/feed-group or network-wide outage. Conversely, recent movement evidence inside an old, invalid, or regressed feed cannot make that feed Current.

## Snapshot anomaly evidence

Treat a sudden population or chronology change as a possible feed problem, not as operational proof. Anomaly evidence includes:

- roughly 40% or more of the normal train entities disappearing at once, including an exact 40% drop;
- several route feeds or feed groups disappearing together;
- a feed timestamp moving backward;
- invalid decoding or a malformed full snapshot;
- a structurally valid but suspiciously empty full snapshot.

“Roughly 40% or more” is a conservative trigger, not permission to accept a suspicious 39.x% loss automatically. Context such as normal route population, simultaneous losses, malformed content, and other coherence failures may trigger anomaly treatment below 40%. The exact 40% boundary always triggers it.

Do not translate a bulk drop into mass cancellations, restore missing entities from static data, or let vanished records continue as live countdowns. Quarantine the suspect update from positive arrival decisions. Existing current negative evidence still vetoes affected arrivals.

## Preservation during degraded recovery

When a freshness degradation or snapshot anomaly interrupts a previously coherent state for an affected route/feed group:

1. Preserve the last coherent information only as visibly non-advancing context.
2. Freeze its displayed countdown values immediately; elapsed wall time must not decrement them.
3. Show **Live data updating** for the affected scope.
4. Do not call missing trains cancelled, restore them from static schedules, or use the suspect snapshot to prove normal service.
5. Keep unaffected route/feed groups live when their own evidence remains healthy.

This preservation behavior is the degraded rider presentation. It can accompany an **Unavailable** health classification caused by an invalidating condition, such as timestamp regression, while recovery evidence is assessed. The preserved information is not live evidence and cannot authorize an exact countdown.

If separately governed sustained-outage rules replace preserved context with schedule fallback, the scheduled label and every current veto remain mandatory. This policy does not create or time that fallback.

## Recovery rule

Every freshness or anomaly path requires **two fresh coherent snapshots** for the affected route/feed group before exact countdowns may return. This includes recovery from Degraded age, age greater than 180 seconds, repeated update failures, invalid decoding, timestamp regression, bulk entity loss, simultaneous multi-feed disappearance, malformed content, and suspicious emptiness.

- A recovery snapshot is **fresh** only when it satisfies the Current boundary and authoritative-time rules.
- It is **coherent** only when complete, validly decoded, non-regressed, internally consistent, and free of the anomaly that caused recovery mode.
- The first fresh coherent snapshot starts confirmation. It does not restart exact countdowns; preserved countdowns remain frozen and **Live data updating** remains.
- A second consecutive fresh coherent snapshot confirms recovery for that route/feed group. Only then may its trains be reevaluated from the new evidence.
- Exact countdowns return only for trains that independently pass every arrival-admission condition and negative-evidence veto. Recovery does not revive prior rows automatically.
- A stale, incomplete, invalid, regressed, contradictory, malformed, suspiciously empty, or newly anomalous snapshot breaks the sequence. The next fresh coherent snapshot becomes a new first snapshot.
- Recovery is scoped independently. Two qualifying snapshots for one group do not recover another group.

## Review record

For each decision, preserve the route/feed-group scope, authoritative snapshot timestamp and age, decoding and completeness result, anomaly evidence and population comparison, alert-context age and unresolved-risk disposition, movement age where relevant, last coherent state, frozen rider presentation, each recovery snapshot, applicable vetoes, and the final health and countdown decision.

Unknown or contradictory evidence cannot be converted into a Current state, proof of normal service, a cancellation claim, or an exact countdown.
