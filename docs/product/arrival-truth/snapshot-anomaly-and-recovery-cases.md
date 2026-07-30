# Snapshot anomaly and recovery acceptance cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§6, 9–10, 27, and 31.3 scenarios 17–18; arrival-truth and service-changes plan Task 4 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define acceptance evidence for the [route-level feed health policy](feed-health-policy.md). They test exact freshness boundaries, route isolation, alert and movement-age separation, anomaly handling, and recovery. They do not create new thresholds or fallback authority. The [source role and precedence matrix](source-role-and-precedence-matrix.md), [evidence veto catalog](evidence-veto-catalog.md), and [time and train continuity policy](time-and-train-continuity-policy.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the observed result is recorded, and the Truth Gate accepts the evidence. An expected result written here is not a passing result.

For every non-feed-age case that uses “first representable instant,” the fixed evidence record must declare authoritative time precision `p` for both sides of the pair; the just-over fixture is exactly `boundary + p`. Feed snapshot age uses the whole-second input governed by the feed-health policy. Entity-drop cases use fixed integer entity counts, not an abstract percentage precision.

## Freshness boundary cases

### Case F1 — Exactly 90 seconds

**Setup**

For one route/feed group, provide a complete, valid, coherent, non-regressed snapshot whose authoritative age is exactly 90 seconds. No invalidating condition or unresolved negative evidence applies.

**Expected state**

Classify the route/feed group as **Current**. Its trains may proceed to all remaining admission and veto checks; health alone does not authorize an exact countdown.

**Prohibited outcome**

Do not classify the group as Degraded or Unavailable, use the phone clock as freshness authority, or treat Current health as proof of normal service.

### Case F2 — Exactly 91 seconds

**Setup**

For one route/feed group, provide a complete, valid, coherent, non-regressed snapshot whose authoritative age is exactly 91 seconds.

**Expected state**

Classify the group as **Degraded**. Preserve its last coherent information, freeze all preserved countdowns at their last values, and show **Live data updating**. Require two fresh coherent snapshots before any exact countdown can return.

**Prohibited outcome**

Do not classify the snapshot as Current, keep countdowns decrementing, or restore missing trains from static schedules.

### Case F3 — Exactly 180 seconds

**Setup**

For one route/feed group, provide a complete, valid, coherent, non-regressed snapshot whose authoritative age is exactly 180 seconds.

**Expected state**

Classify the group as **Degraded**. Preserve the last coherent state with frozen countdowns and **Live data updating**. Require two fresh coherent snapshots before exact countdown recovery.

**Prohibited outcome**

Do not classify exactly 180 seconds as Unavailable, advance preserved countdowns, or announce cancellations from absence.

### Case F4 — Just over 180 seconds

**Setup**

For one route/feed group, provide a latest complete coherent snapshot whose authoritative whole-second age is exactly 181 seconds, the immediate representable age above 180 seconds under the feed-health policy.

**Expected state**

Classify the group as **Unavailable**. Reject the old snapshot as a basis for exact countdowns, keep preserved countdowns frozen if last coherent context remains visible, and require two fresh coherent snapshots before exact countdown recovery. Any separately governed fallback remains clearly scheduled and subject to current vetoes.

**Prohibited outcome**

Do not classify the group as Current or Degraded, continue exact countdowns, infer normal service, or allow the failed group to force unrelated healthy groups into fallback.

### Case F5 — Repeated update failures

**Setup**

For one route/feed group, exercise the governed repeated-update-failure condition while the last successfully decoded snapshot would otherwise fall inside an age boundary. The reviewed evidence identifies the condition without assigning a new numeric count, interval, or percentage.

**Expected state**

Classify the affected group as **Unavailable** because the named invalidating condition controls over apparent age. Freeze preserved countdowns, show the conservative updating presentation while recovery is assessed, and require two fresh coherent snapshots before exact countdown recovery.

**Prohibited outcome**

Do not invent or silently assume a numeric definition of “repeated,” keep exact countdowns live, or affect unrelated healthy groups.

### Case F6 — Invalid decoding

**Setup**

For one route/feed group, provide an update with an apparently recent timestamp whose content cannot be decoded validly.

**Expected state**

Classify the affected group as **Unavailable**. Quarantine the invalid update, preserve only the prior coherent state with frozen countdowns and **Live data updating**, and require two fresh coherent snapshots before exact countdown recovery.

**Prohibited outcome**

Do not let apparent timestamp recency make the update Current, interpret missing entities as cancellations, or count the invalid update as either recovery snapshot.

## Related evidence-age cases

### Case F7 — Alert context at and just beyond ten minutes

**Setup**

Test the same affected route and station twice. First, provide a coherent alert snapshot exactly ten minutes old. Second, provide alert context at the first representable positive instant beyond ten minutes while an earlier active service change remains unresolved. Keep the train feed Current in both runs.

**Expected state**

Treat exactly ten minutes as current alert context. Treat the first positive instant beyond ten minutes as stale; the stale snapshot does not prove normal service or clear the unresolved risk. In the second run, fail closed for the affected positive arrival claim even though the train feed is Current.

**Prohibited outcome**

Do not treat exactly ten minutes as stale, treat the first positive instant beyond ten minutes as current, use stale alert absence as proof of normal service, or let fresh positive train evidence override unresolved negative risk.

### Case F8 — Fresh feed with old train movement

**Setup**

Provide a Current, complete, coherent route/feed-group snapshot containing one train whose train-specific movement timestamp is old enough to invoke its governed movement rule. Other trains have current coherent movement evidence.

**Expected state**

Keep the route/feed group **Current**. Change only the affected train to **Holding** or **Arrival uncertain** as governed, and freeze or withhold its exact countdown. Evaluate the other trains normally.

**Prohibited outcome**

Do not declare the feed group or network Degraded or Unavailable because one train has old movement evidence. Do not use fresh feed age to erase the train's movement age.

### Case F9 — Route/feed-group isolation

**Setup**

Provide one route/feed group in Degraded or Unavailable health and a separate group with fresh, complete, coherent, non-regressed evidence. Include a station board or view capable of showing routes from both groups.

**Expected state**

Apply frozen **Live data updating** or unavailable treatment only to the affected group. Keep the healthy group Current and allow its trains to proceed to their own admission and veto checks.

**Prohibited outcome**

Do not force the healthy group into schedule fallback, freeze its countdowns, hide it because another group failed, or claim network-wide failure.

## Snapshot anomaly and recovery cases

### Scenario 17 — Exact 40% entity drop

**Setup**

Begin with a fresh coherent full snapshot containing exactly 100 baseline entities for one route/feed group. In the next apparently fresh full snapshot, exactly 40 entities disappear at once without reliable cancellation, completion, service-change, or other train-specific evidence. The fixed denominator makes the observed loss exactly 40%.

**Expected state**

Treat the snapshot as a bulk-drop anomaly and enter degraded recovery presentation for that group. Preserve the last coherent information, freeze every preserved countdown, show **Live data updating**, quarantine the suspect population change, and do not announce mass cancellations. Keep unrelated healthy groups live.

Then provide one fresh coherent full snapshot with a credible internally consistent population. Keep exact countdowns frozen because it is only recovery snapshot one. Provide a second consecutive fresh coherent snapshot. Only after it arrives may individually eligible trains resume exact countdowns.

**Prohibited outcome**

Do not accept exact 40% as below the trigger, turn vanished entities into cancellation claims, restore them from static data, decrement preserved countdowns, resume after only one fresh coherent snapshot, or recover a train that fails another veto.

### Case A2 — Just over 40% and contextual bulk loss

**Setup**

Use the same fixed baseline of exactly 100 entities. In run A, remove exactly 41 entities, the first integer count above the exact 40% fixture. In run B, remove exactly 39 entities and add other coherence evidence such as abnormal route population or simultaneous loss. No reliable operational explanation supports either loss.

**Expected state**

Treat the 41-of-100 loss as anomaly evidence. Also allow the contextual evidence to trigger conservative anomaly treatment for the 39-of-100 run; “roughly” is not a safe-harbor rule. In each run, preserve and freeze the last coherent information, show **Live data updating**, and require two fresh coherent snapshots before exact countdowns can return.

**Prohibited outcome**

Do not treat the percentage as cancellation proof, declare every loss below 40% healthy automatically, or invent a more precise replacement threshold.

### Scenario 18 — Feed timestamp regression

**Setup**

After a fresh coherent snapshot for one route/feed group, provide an apparently complete snapshot whose feed timestamp is earlier than the accepted predecessor. Include valid-looking train predictions so the regression is the controlling defect.

**Expected state**

Classify the affected group as **Unavailable** immediately and quarantine the regressed snapshot. Present the last coherent information only as frozen context with **Live data updating**; exact countdowns stop. Keep unrelated healthy groups live.

Then provide one fresh coherent non-regressed snapshot. Treat it as recovery snapshot one and keep exact countdowns frozen. Provide a second consecutive fresh coherent non-regressed snapshot. Only then may individually eligible exact countdowns return.

**Prohibited outcome**

Do not relabel the regressed feed as Current or accept its plausible predictions, reverse chronology, keep countdowns decrementing, call missing trains cancelled, resume after one recovery snapshot, or recover a train that fails another veto.

### Case A4 — Suspiciously empty full snapshot

**Setup**

After a normal fresh coherent full snapshot, provide a structurally decodable and apparently fresh full snapshot with an empty or implausibly empty train population and no reliable operational evidence explaining the change.

**Expected state**

Treat the snapshot as anomalous rather than as proof that all trains are cancelled or service is normal. Preserve the last coherent information with frozen countdowns and **Live data updating**. Require two subsequent fresh coherent, credibly populated snapshots before exact countdown recovery.

**Prohibited outcome**

Do not clear the board as mass cancellation, use the empty result as normal-service evidence, count it as a recovery snapshot, decrement preserved countdowns, or restore static trips as if they were live.

### Case A5 — Malformed full snapshot

**Setup**

After a normal fresh coherent full snapshot, provide an apparently fresh full snapshot whose malformed content causes invalid decoding or prevents a complete coherent population assessment.

**Expected state**

Classify the affected group as **Unavailable**, quarantine the malformed snapshot, preserve only the prior coherent information with frozen countdowns and **Live data updating**, and require two fresh coherent snapshots before exact countdown recovery.

**Prohibited outcome**

Do not accept the timestamp alone, infer cancellation from unreadable or missing records, count the malformed snapshot toward recovery, or resume after only one qualifying snapshot.

### Case A6 — Simultaneous multi-feed disappearance

**Setup**

Start with fresh coherent snapshots for at least three independent route/feed groups. In the next update, two groups disappear together while the third continues to provide fresh coherent evidence.

**Expected state**

Treat the simultaneous loss as anomaly evidence for each disappeared group. Preserve and freeze each affected group's last coherent information and show **Live data updating**. Keep the third group Current and live.

Recover each affected group independently. One fresh coherent snapshot for a group is insufficient. Exact countdowns may return for that group only after its own second consecutive fresh coherent snapshot and only for individually eligible trains; another group's recovery snapshots do not count.

**Prohibited outcome**

Do not call the simultaneous losses mass cancellations, declare a network-wide outage, degrade the healthy third group, pool snapshots across groups to satisfy recovery, or restart exact countdowns after one qualifying snapshot.

### Case A7 — Broken recovery sequence

**Setup**

For each anomaly type—bulk drop, simultaneous multi-feed disappearance, timestamp regression, invalid decoding or malformed snapshot, and suspicious emptiness—provide one fresh coherent recovery snapshot followed by a stale, incomplete, regressed, malformed, contradictory, suspiciously empty, or newly anomalous snapshot. Then provide two consecutive fresh coherent snapshots.

**Expected state**

The intervening bad snapshot breaks recovery confirmation and does not count. Keep preserved countdowns frozen and **Live data updating** throughout. Treat the next fresh coherent snapshot as a new first recovery snapshot; allow exact countdowns to return only after the following consecutive fresh coherent snapshot and full train-level admission review.

**Prohibited outcome**

Do not accumulate nonconsecutive good snapshots, count any bad snapshot, resume exact countdowns during the broken sequence, or restore prior rows without reevaluating their current evidence and vetoes.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| F1 — 90 seconds | Current classification at the inclusive boundary; remaining admission checks recorded | Pending |
| F2 — 91 seconds | Degraded classification; frozen countdown and **Live data updating** verified | Pending |
| F3 — 180 seconds | Degraded classification at the inclusive upper boundary; no countdown decrement | Pending |
| F4 — Just over 180 seconds | Exactly 181 whole seconds is Unavailable; no exact countdown; unrelated group unaffected | Pending |
| F5 — Repeated failures | Unavailable classification with no invented numeric definition; two-snapshot recovery verified | Pending |
| F6 — Invalid decoding | Unavailable classification; invalid update quarantined; two-snapshot recovery verified | Pending |
| F7 — Alert ten-minute boundary | Exactly ten minutes current; first positive instant beyond ten minutes stale; unresolved risk fails closed | Pending |
| F8 — Movement age separation | Feed remains Current; only old-movement train changes state | Pending |
| F9 — Route isolation | Affected group degraded or unavailable; healthy unrelated group remains live | Pending |
| Scenario 17 / A2 — Bulk drop | Fixed 100-entity baseline proves 40-of-100 and 41-of-100 anomaly branches; contextual 39-of-100 loss has no safe harbor; no mass-cancellation claim; two-snapshot recovery verified | Pending |
| Scenario 18 — Timestamp regression | Unavailable classification; exact countdowns stopped through two-snapshot recovery | Pending |
| A4 — Suspicious emptiness | Empty snapshot rejected as cancellation or normal-service proof; two-snapshot recovery verified | Pending |
| A5 — Malformed snapshot | Unavailable classification; malformed snapshot excluded; two-snapshot recovery verified | Pending |
| A6 — Multi-feed disappearance | Affected groups isolated; healthy group live; independent two-snapshot recovery verified | Pending |
| A7 — Broken recovery sequence | Bad snapshot resets confirmation; only two consecutive fresh coherent snapshots recover | Pending |

The result record remains Pending until it links durable observed evidence for a fixed reviewed version. Failures remain recorded and must link their correction and rerun.
