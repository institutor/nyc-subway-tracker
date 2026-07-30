# Quarantine and recovery review cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§27.2–27.4, 31.1, and 31.3; arrival-truth and service-changes plan Task 11 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases prove entry, isolation, review, correction, and coherent-evidence-only release for every quarantine class in the approved specification. They also prove that a permitted correction may reduce or clarify an unsupported claim while a forbidden correction cannot manufacture evidence.

The [provenance, quarantine, and correction policy](../arrival-truth/provenance-quarantine-and-correction-policy.md) owns these decisions. The [route-level feed health policy](../arrival-truth/feed-health-policy.md), [time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md), [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md), [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md), [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md), and [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) retain their narrower trigger and recovery rules. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until exercised against a fixed reviewed product version, captured in the [arrival-truth decision review template](arrival-truth-decision-review-template.md), and accepted by the Truth Gate. Expected results are not passing evidence.

## Common execution and evidence standard

For every run, retain:

- fixed product-policy version, run date, and reviewer;
- every source type, source timestamp, authoritative comparison, effective period, and exact scope;
- the suspect record or snapshot and the last independently accepted evidence;
- the quarantine trigger and entry time;
- candidate-generation, admission, ordering, fallback, correction, and dependent-guidance consequences;
- the exact rider result and freshness treatment;
- each attempted release observation and whether it counted;
- the separate evidence-unit release and public-claim readmission decisions; and
- confirmation that no personal or linkable rider history was used.

Every run must explicitly answer:

1. Did the suspect evidence create, retain, rank, relabel, backfill, or restore a primary arrival?
2. Did it supply a stop, time, identity join, direction, destination, service-change clearance, schedule edition, positive correction authority, or recovery count?
3. Did independently coherent service outside the affected scope remain eligible?
4. Did any later outcome rewrite the original decision rather than create a linked new decision?

Questions 1, 2, and 4 must be **No** for a passing run.

## Timestamp quarantine cases

### Case Q1 — Malformed timestamp

**Setup**

Provide a record with otherwise plausible arrival fields but a required authoritative timestamp that is unparseable or structurally invalid. Include another independently coherent train in the same view. In a separate control, provide a validated supplemented edition with no supplied publication timestamp, where the schedule policy explicitly permits first successful retrieval as the age anchor.

**Expected decision**

Quarantine the malformed record before freshness, movement, ordering, or public presentation. It creates no train row, countdown, Scheduled time, or recovery observation. Evaluate the independent train normally. In the schedule control, do not call a genuinely absent publication timestamp malformed; use the governed first-retrieval anchor and continue through every other fallback gate.

**Required recovery evidence**

Provide a newer source observation with a valid authoritative timestamp and coherent claim evidence. Treat it only as the first qualifying train or feed recovery observation when the governing policy requires two. Do not repair or rewrite the malformed record.

**Prohibited outcome**

Do not infer the malformed time from retrieval, device time, ETA order, a neighboring train, or a correction. Do not generalize a required live timestamp rule to invalidate the schedule policy's explicit no-publication-time branch.

### Case Q2 — Implausible, future, regressed, or contradictory timestamp

**Setup**

Run three branches:

1. a live-feed timestamp demonstrably future beyond the still-uncalibrated small-skew allowance;
2. a supplied supplemented publication timestamp at the first positive instant after authoritative comparison time; and
3. a timestamp that regresses against accepted source chronology or contradicts source-supported edition or event order.

Give each suspect record plausible content. Include eligible independent service; for the supplemented branch, include an eligible regular-GTFS departure.

**Expected decision**

Quarantine every suspect input before it can influence age, chronology, arrival, or recovery. Assign no numeric skew allowance. In branch 2, calculate negative raw schedule age, assign no schedule currency state, do not clamp to zero, and evaluate regular GTFS next. In branch 3, preserve accepted chronology and do not reverse or silently repair it.

**Required recovery evidence**

Require a newer source-supported, non-future under the source-specific rule, non-regressed, non-contradictory observation. A supplied supplemented timestamp future by any positive amount remains ineligible even if someone believes it falls within a possible future skew allowance. Exact schedule age zero is accepted only when publication time exactly equals authoritative comparison and all other gates pass.

**Prohibited outcome**

Do not accept plausible predictions over a time defect, substitute retrieval time for an unusable supplied publication time, classify negative age Current, invent a skew number, or count the suspect input as either recovery update.

## Train-record quarantine cases

### Case Q3 — Stop-order regression

**Setup**

Begin with accepted forward progress. Provide one independently accepted update whose ordered remaining stops move the train backward impossibly. Next, deliver an exact replay of that update. Then provide a second independently accepted coherent update confirming the regression. Finally, provide two later fresh coherent accepted updates with plausible order, stable identity, current movement or stop progress, exact target service, no unresolved service or track conflict, and every Live gate passing after the second.

**Expected decision**

On the first regression, quarantine the candidate and immediately remove exact precision and primary eligibility. The replay does not count as confirmation. The second independent confirmation hard-suppresses under the Task 9 rule. The first later plausible update begins recovery and restores nothing. Only after the second qualifying update and full Live readmission may one primary row and exact countdown return.

**Prohibited outcome**

Do not keep a plausible ETA on the board after regression one, count a replay as confirmation two, wait for a third regression, restore after one plausible update, or use static stop order as recovery.

### Case Q4 — Duplicate identities

**Setup**

Run two branches:

1. two replacement records both plausibly match one earlier train, so no exclusive one-to-one continuity exists and neither is independently stronger; and
2. one-to-one evidence confidently establishes that two current records are the same train and identifies one stronger coherent record and one weaker duplicate.

Then provide fresh accepted evidence that either establishes two genuinely separate coherent trains or preserves one exclusive coherent instance across the governing recovery pair.

**Expected decision**

In branch 1, quarantine both ambiguous candidates; do not merge them or show them as separate trains. In branch 2, hard-suppress the weaker duplicate and independently evaluate the stronger candidate against every admission gate. At most one row appears. Later separation or continuity evidence releases only the supported identities, and any candidate that lost public precision completes its governing recovery before Live readmission.

**Prohibited outcome**

Do not choose a match from ETA similarity or identifier change alone, let the weaker record fill a next-three slot, double-count one physical train, suppress an otherwise eligible stronger instance merely because a duplicate existed, or use a correction to declare identity.

### Case Q5 — Impossible direction change

**Setup**

Provide one proposed train instance whose next update changes normalized direction while its ordered remaining stops, actual destination, service date, track evidence, and prior accepted progress remain incompatible with that change. Provide an independently coherent opposite-direction train. In a control branch, provide a positively supported terminal or operational reversal with coherent new pattern, destination, chronology, and identity evidence.

**Expected decision**

Quarantine the contradictory identity in the first branch and remove it from primary admission and next-three ordering. Preserve the independent opposite-direction train. Do not relabel the suspect record from its raw direction code. In the control, evaluate the supported reversal normally rather than treating every direction change as impossible; it still passes all current admission and recovery gates.

**Required recovery evidence**

Require a stable coherent identity, normalized direction, destination, service date, and ordered pattern across two fresh accepted updates after public precision loss. A legitimate reversal must be positively supported, not inferred from the earlier contradiction.

**Prohibited outcome**

Do not merge opposite-direction candidates, use station name or raw north/south suffix as proof, show the suspect row as Uncertain, or manufacture a direction through correction.

### Case Q6 — Non-terminal track conflict

**Setup**

Provide an explicit actual-versus-scheduled-track conflict outside normal terminal behavior that invalidates an exact downstream target and dependent guidance. Include unrelated coherent trains. Then provide one fresh coherent update that reestablishes a trustworthy path, followed by a second consecutive update that preserves the path and collectively proves all five Task 9 recovery conditions. In a control branch, omit the second update or make it nonqualifying.

**Expected decision**

Quarantine the train internally for affected downstream claims and hard-suppress every affected arrival and dependent guidance immediately. Preserve unrelated trains. Recovery update one restores nothing. Only the qualifying second update, coherent path across the pair, all five conditions, and every current Live gate permit readmission. The control branch remains suppressed.

**Prohibited outcome**

Do not show **Arrival uncertain**, **Expected platform**, **Check station signs**, Scheduled replacement, lower-confidence countdown, or dependent guidance for the invalidated claim. Do not apply this hard conflict to normal terminal variation without separate invalidating evidence.

## Snapshot quarantine case

### Case Q7 — Suspiciously empty snapshot

**Setup**

After a credibly populated fresh coherent complete snapshot, provide a structurally decodable and apparently fresh full snapshot with an empty or implausibly empty population and no reliable operational explanation. Keep a separate route/feed group fresh and coherent. Then provide one credibly populated fresh coherent snapshot for the affected group, followed by a second consecutive qualifying snapshot. In a control branch, place a malformed, stale, regressed, contradictory, or newly empty snapshot between the two good snapshots.

**Expected decision**

Quarantine the empty snapshot from positive decisions. Do not treat it as mass cancellation or normal service. Preserve only the prior coherent state as frozen context with **Live data updating** under the feed-health policy, and keep the independent group live. The first qualifying populated snapshot begins feed recovery only. The second consecutive one permits train-level reevaluation. In the control, the intervening bad snapshot breaks confirmation.

**Prohibited outcome**

Do not clear the board as cancellation, restore missing entities from static data, decrement preserved countdowns, pool recovery snapshots across feed groups, accept nonconsecutive snapshots, or restore previous rows automatically after feed recovery.

## Alert-record quarantine case

### Case Q8 — Contradictory alert scope

**Setup**

Provide an active alert whose structured route, station or segment, normalized direction, active period, impact, or official text contradict one another. Run two branches:

1. no independent current high-impact evidence establishes a possible bypass, reroute, short turn, suspension, closure, or invalidating track/path change; and
2. separate independent current high-impact evidence establishes a governed possible change, but the contradiction leaves its material effect on one route-direction or segment unresolved.

Include independently coherent service outside the disputed scope. Later provide a newer current alert record whose structured scope and official text agree.

**Expected decision**

Quarantine the contradictory alert record from proving a bypass, clearance, or normal service. In branch 1, contradiction and generic **Affected** metadata create neither suppression nor arrival unavailability; evaluate the otherwise-coherent arrival from its independent evidence. In branch 2, withhold only the materially unresolved claim as arrival claim unavailable, preserve the official message, and do not assert a resolved bypass. Keep unrelated service visible.

The later coherent alert record may release the alert evidence unit. It does not create movement, a stop call, or automatic train readmission. Apply every row-specific and catalog-wide release gate to any previously suppressed claim.

**Prohibited outcome**

Do not widen the conflict to a line, complex, or network; use missing fields as proof of unaffected service; turn contradiction alone into high-impact evidence; invent a specific consequence; or clear a prior veto from one later alert record.

## Permitted correction cases

### Case P1 — Suppress a known bad arrival

**Setup**

Provide reproducible authoritative evidence that one exact arrival is invalid and a logged authorized correction scoped to that train and directional-stop claim.

**Expected decision**

Apply the correction only to remove the bad arrival, exact countdown, primary slot, and dependent guidance. Preserve the source record, correction actor role and time, evidence, before-and-after transformation, rider consequence, and release condition. Require independent coherent source evidence and the governing recovery path before any later readmission.

**Prohibited outcome**

Do not label the train cancelled without cancellation evidence, widen the correction, add a replacement arrival, or count the correction as a recovery update.

### Case P2 — Clarify a supported affected segment

**Setup**

Provide official text and structured scope that already support one affected route segment and normalized direction, plus a correction that clarifies that segment in the review and rider summary.

**Expected decision**

Keep the original official text, constrain the clarification to supported route, segment, direction, and active period, and preserve independently coherent service outside it.

**Prohibited outcome**

Do not turn generic **Affected** into a bypass, invent a station boundary, suppress outside the supported scope, or let the clarification create movement or a stop call.

### Case P3 — Mark platform guidance unavailable

**Setup**

Provide a train arrival whose exact stop service remains independently admitted but whose platform orientation, track, exit relationship, or operating path is unresolved. Provide a logged correction that removes dependent platform-positioning guidance.

**Expected decision**

Keep the independently supported arrival result and remove only the unsupported guidance. Record the exact guidance relationship and evidence gap. Restore guidance only from its own verified evidence.

**Prohibited outcome**

Do not infer a platform, front/middle/back position, or track; do not suppress or create the train claim from the guidance correction alone.

### Case P4 — Correct geometry or accessibility relationship

**Setup**

Provide verified evidence that one entrance, passage, platform, equipment chain, exit, or accessibility relationship was modeled incorrectly. Include affected and unaffected paths and a logged scoped correction.

**Expected decision**

Replace the relationship for dependent path evaluation, retain the prior relationship as history, identify every affected claim, and preserve unrelated relationships. Current accessibility and equipment claims still require their own authoritative evidence.

**Prohibited outcome**

Do not declare an elevator operational, claim **Accessible now**, invent an entrance-to-platform connection, or convert geometry evidence into arrival movement.

## Forbidden correction cases

### Case F1 — Attempt to fabricate movement

**Setup**

Provide an arrival in Holding, Uncertain, quarantine, or incomplete recovery with no new authoritative movement or stop-progress evidence. Submit an attempted correction that advances movement time or resets the Due timer because the ETA changed or an operator expects the train to move.

**Expected decision**

Reject the correction. Preserve the governed Holding, Uncertain, quarantine, suppression, or incomplete-recovery state and its existing clocks. Record the attempted forbidden correction for quality review.

**Prohibited outcome**

Do not create Live, reset movement age, restart Due, count a recovery condition, or return a primary row.

### Case F2 — Attempt to add an unsupported arrival

**Setup**

Provide a healthy live board with a missing exact stop call or an Unavailable feed with no departure-eligible schedule. Submit an attempted correction that adds a train, stop call, clock time, or next-three row from route identity, a normal pattern, staff expectation, or a neighboring station prediction.

**Expected decision**

Reject the correction and retain the suppression, no-estimate, or fewer-than-three result supported by current evidence.

**Prohibited outcome**

Do not create Live, Expected, Scheduled, a countdown, a clock time, an arrival range, or a replacement row. A later physical arrival does not make the earlier correction permissible.

### Case F3 — Attempt to declare equipment operational

**Setup**

Provide no current authoritative evidence that route-critical elevator or escalator equipment is operational. Submit an attempted correction declaring the equipment working so an accessibility relationship or guidance claim can be restored.

**Expected decision**

Reject the correction. Keep the current accessible-path or equipment claim unavailable under its owner policy and preserve train-arrival decisions separately.

**Prohibited outcome**

Do not show **Working**, **Accessible now**, restore a broken path, or use the correction as authoritative equipment evidence.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| Q1 — Malformed timestamp | Suspect live record excluded; independent service preserved; explicit no-publication-time schedule control follows first-retrieval rule | Pending |
| Q2 — Implausible, future, regressed, or contradictory time | Every defective time excluded before age or chronology; any positive future schedule time quarantined; no numeric skew, clamp, or retrieval substitution | Pending |
| Q3 — Stop-order regression | First regression quarantines; replay does not confirm; second independent regression suppresses; two-update recovery required | Pending |
| Q4 — Duplicate identities | Ambiguous records do not merge or double count; weaker confident duplicate removed; only supported identities recover | Pending |
| Q5 — Impossible direction change | Contradictory identity excluded; independent opposite direction preserved; supported operational reversal distinguished | Pending |
| Q6 — Track conflict | Affected arrival and guidance absent through update one; only qualifying update two and every gate allow return | Pending |
| Q7 — Suspicious empty snapshot | Empty snapshot proves neither cancellation nor normal service; healthy group isolated; consecutive two-snapshot recovery verified | Pending |
| Q8 — Contradictory alert scope | Alert record quarantined; contradiction alone creates neither bypass nor unavailability; independent high-impact unresolved risk fails closed only in exact scope | Pending |
| P1 — Suppress known bad arrival | Scoped removal with full audit trail; no cancellation invention, backfill, or recovery manufacture | Pending |
| P2 — Clarify affected segment | Clarification remains within already-supported scope and preserves official text and unrelated service | Pending |
| P3 — Mark guidance unavailable | Unsupported guidance removed without changing independently supported arrival truth | Pending |
| P4 — Correct relationship | Verified geometry or accessibility relationship corrected without equipment-operation or live-arrival invention | Pending |
| F1 — Fabricated movement attempt | Correction rejected; movement, Due, confidence, and recovery state unchanged without source evidence | Pending |
| F2 — Unsupported arrival attempt | Correction rejected; no train, stop call, time, range, or primary row created | Pending |
| F3 — Unsupported equipment-operation attempt | Correction rejected; no operational or accessible-now claim created | Pending |

A result remains Pending until it links the complete observed review template for the fixed version. Preserve every failed run, correction, and rerun. No later outcome may erase an unsupported primary-board influence or forbidden correction.
