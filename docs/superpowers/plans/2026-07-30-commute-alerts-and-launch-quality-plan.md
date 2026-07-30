# Smart Commute Alerts and Launch Quality Delivery Plan

> **For agentic workers:** Execute this plan through independently reviewable product artifacts. Preserve every decision in the approved specification. Do not introduce source code, framework choices, architectural stacks, or vendor-specific assumptions.

## Goal

Deliver recurring, disruption-only subway commute alerts that tell a rider about a meaningful problem before they enter the system, while protecting trust through strict eligibility, relevance, freshness, deduplication, privacy, and launch-quality controls.

## Source of truth

- Product specification: `docs/superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md`
- Controlling sections: 24–35, with particular emphasis on sections 25, 27–33, and acceptance scenarios 42–51.
- Upstream truth behavior is delivered through `docs/superpowers/plans/2026-07-30-arrival-truth-and-service-changes-plan.md`.
- Rider preferences and saved-station behavior are delivered through `docs/superpowers/plans/2026-07-30-nearby-station-and-offline-experience-plan.md`.

## Scope and boundaries

This plan covers subway commute-window setup, notification eligibility, delay and service-change relevance, delivery timing, message content, deduplication, rider controls, privacy, measurement, operational readiness, and launch gates.

This plan does not expand the product to commuter rail, promise routine “all clear” messages, infer disruption from stale or unresolved evidence, or specify implementation technology. Car-crowding behavior remains governed by the separate accessibility and guidance plan.

## Definition of done

The workstream is complete when:

1. Every notification can be traced to a current, route-relevant, direction-relevant, and commute-relevant disruption.
2. No notification is sent merely because a commute window opened.
3. Delay thresholds and boundary conditions are unambiguous and testable.
4. Repeated alert updates do not create notification fatigue.
5. Riders can understand, edit, pause, and remove a commute window without an account.
6. Location and notification permissions are requested only when their value is clear.
7. Scenario evidence covers ordinary delays, planned reroutes, skipped stops, unresolved alerts, stale data, overnight windows, daylight-saving transitions, and recovery.
8. Launch gates prevent release if relevance, freshness, or duplicate-notification targets are missed.

## Delivery order

Tasks 1–3 establish the product contract. Tasks 4–7 turn that contract into a complete rider experience. Tasks 8–10 establish measurement, operations, and release evidence. Do not approve notification copy or pilot launch before the eligibility contract and boundary matrix are signed off.

---

## Task 1: Freeze the commute-window product contract

**Artifacts**

- Create: `docs/product/commute/commute-window-contract.md`
- Create: `docs/product/commute/commute-window-field-dictionary.md`
- Update: `docs/product/decisions/subway-product-decisions.md`

**Dependencies**

- Approved product specification.
- Agreed terminology from the Nearby and saved-stations workstream.

**Steps**

1. Define a commute window as a rider-selected set of active weekdays, local start time, local end time, origin station and preferred entrance, destination station and preferred exit, intended direction, primary route, acceptable alternate routes, optional transfer preference, preparation lead time, and Accessible Route Only or Avoid Stairs preference.
2. State that a commute window creates a disruption watch, not a scheduled departure alarm.
3. Record the default of one alert per materially distinct disruption episode.
4. Define the rider-controlled states: active, paused, expired because required context is missing, and deleted.
5. Define behavior for overlapping windows, midnight-spanning windows, changed service days, and daylight-saving clock changes using New York local time.
6. Define which fields are required, which may be inferred from a saved trip, and which must be reconfirmed when route or station relationships change.
7. Record the subway-only launch boundary and the explicit exclusion of routine crowding notifications.
8. Add a decision entry stating that no “all clear” push is sent unless a prior disruption alert needs a meaningful recovery update.
9. State that the product may suggest setting up a commute after repeated use but never activates notifications without explicit rider confirmation.

**Acceptance evidence**

- A reviewer can determine whether any example preference is valid without making an unstated assumption.
- The contract distinguishes a direction from a terminal label and handles stations with more than two passenger-serving directions.
- An overnight window has a single, documented service-day interpretation.
- No field requires an account to save locally.
- A suggested commute remains inactive until the rider explicitly confirms it.
- All terms match the approved specification.

**Commit checkpoint**

`define commute window product contract`

---

## Task 2: Specify notification eligibility and suppression

**Artifacts**

- Create: `docs/product/commute/notification-eligibility-contract.md`
- Create: `docs/product/commute/notification-suppression-matrix.md`
- Create: `docs/product/commute/disruption-relevance-examples.md`

**Dependencies**

- Task 1.
- Arrival-truth conflict outcomes and alert-impact taxonomy.

**Steps**

1. Define the complete eligibility intersection: the commute window is active, the evaluation falls within the notification lead period, the evidence is current enough for the claim, the disruption affects the selected route or usable alternative, the impact intersects the rider’s origin-to-destination path, and the impact is meaningful.
2. Treat skipped origin, skipped destination, bypassed transfer, reroute, suspension, severe delay, and accessibility-path loss as separately classifiable impacts.
3. Define planned-work eligibility so a rider can be warned before entering even when no live train has yet demonstrated the change.
4. Define unplanned-disruption eligibility so alerts may warn only when entity mapping or station-impact evidence is sufficiently resolved.
5. Suppress notifications for route-wide alerts that do not intersect the rider’s travel segment or direction.
6. Suppress notifications when the only evidence is stale, unresolved, internally conflicting, or below the documented delay threshold.
7. Suppress routine schedule variance and minor spacing changes.
8. Suppress a generic data outage unless the rider has explicitly opted into data-health notices.
9. Define conservative behavior when the preferred route is disrupted but a materially equivalent subway option remains available.
10. Include examples for an F train rerouted via the E line, an origin bypass, a downstream-only delay, a direction-specific suspension, and an alert with ambiguous stop impact.

**Acceptance evidence**

- Every row in the suppression matrix produces exactly one outcome: send, suppress, or hold for stronger evidence.
- A bypassed station cannot be described as served.
- A broad route alert cannot notify a rider whose segment is unaffected.
- Stale or unresolved evidence never produces a definitive disruption claim.
- Planned changes can qualify before the commute begins when their effective interval overlaps the trip.

**Commit checkpoint**

`define commute alert eligibility`

---

## Task 3: Lock delay thresholds and boundary behavior

**Artifacts**

- Create: `docs/product/commute/delay-threshold-policy.md`
- Create: `docs/product/test-cases/commute-threshold-boundaries.md`
- Create: `docs/product/test-cases/commute-time-edge-cases.md`

**Dependencies**

- Tasks 1–2.
- Route-level freshness and service-day definitions from the arrival-truth plan.

**Steps**

1. Set the default rider tolerance to more than five added journey minutes and permit rider-selected ten- or fifteen-minute tolerances.
2. Treat a current official active delay alert affecting the saved segment as actionable according to its resolved impact.
3. Treat the absence of a verified arrival within the greater of twelve minutes or twice the current planned headway as a qualifying delay signal.
4. Treat an observed gap as qualifying only when it reaches at least twice the planned headway and is at least six minutes longer than planned.
5. Treat an expected journey-time increase as qualifying only when it exceeds the rider’s configured five-, ten-, or fifteen-minute tolerance.
6. Treat a normally viable transfer becoming Tight or Uncertain as a qualifying decision change.
7. Require inferred delay or gap evidence to persist for at least two coherent updates spanning sixty seconds; allow a current confirmed suspension, closure, bypass, short turn, or blocking accessible-path outage to qualify after one coherent snapshot.
8. Define the comparison baseline and forbid silently switching among schedule deviation, planned headway, expected journey time, transfer viability, and published incident severity.
9. Document the behavior exactly below, exactly at, and exactly above every threshold, including the distinction between “at least” and “exceeds.”
10. Define whether multiple moderate impacts combine into a meaningful commute disruption and, if so, the approved rule.
11. Specify New York local-time handling for overnight windows, the fall-back repeated hour, the spring-forward missing hour, and service-day rollovers.
12. Define the behavior when a disruption begins before a window, during a window, or immediately after its end.
13. Define the behavior when evidence becomes stale immediately before delivery.
14. Require a test case for a delayed train whose origin stop is subsequently removed by a service change.

**Acceptance evidence**

- Boundary cases have deterministic expected outcomes.
- No rider receives two evaluations for the repeated daylight-saving hour.
- A missing spring-forward clock interval does not create a phantom alert opportunity.
- Final eligibility is rechecked against current evidence before delivery.
- Arrival presence never overrides a stop-impact veto.
- A one-update inferred fluctuation never sends a push.
- The five-minute default requires an increase beyond five minutes, while the observed-gap rule permits equality at its “at least” boundaries.

**Commit checkpoint**

`lock commute alert thresholds`

---

## Task 4: Design commute-window setup and controls

**Artifacts**

- Create: `docs/product/ux/commute-window-setup-flow.md`
- Create: `docs/product/ux/commute-window-state-matrix.md`
- Create: `docs/product/ux/notification-permission-moments.md`
- Create: `docs/product/content/commute-window-copy-catalog.md`

**Dependencies**

- Tasks 1–3.
- Saved-station and direction-language decisions from the Nearby workstream.

**Steps**

1. Define entry points from a saved station, a station board, and an offline trip card.
2. Keep the setup sequence focused on trip, days, time range, and alert permission; reveal advanced controls only when needed.
3. Show the exact route, direction, origin, destination, active days, and window before saving.
4. Ask for notification permission at the moment the rider turns on the first commute window, with a plain-language explanation of disruption-only behavior.
5. Define recoverable states for denied permission, operating-system restrictions, incomplete route context, deleted saved station, and a route that no longer serves the selected stop.
6. Make pause, edit, and delete controls reachable without an account or hidden settings path.
7. State what remains stored on the device and what is removed when the rider resets personalization.
8. Validate that one-handed use remains possible for every primary control.

**Acceptance evidence**

- A first-time rider can create a valid window without typing a route identifier.
- The confirmation view prevents an accidental reverse-direction alert.
- Denied notification permission does not block station boards, maps, or saved stations.
- Pausing and deleting are distinct, understandable actions.
- Content never promises that every delay will be detected.

**Commit checkpoint**

`design commute window setup`

---

## Task 5: Define message timing, content, and recovery

**Artifacts**

- Create: `docs/product/commute/notification-timing-policy.md`
- Create: `docs/product/content/commute-notification-library.md`
- Create: `docs/product/commute/recovery-notification-policy.md`
- Create: `docs/product/test-cases/commute-message-scenarios.md`

**Dependencies**

- Tasks 1–4.
- Approved service-change and accessibility impact labels.

**Steps**

1. Define the rider-selected preparation lead period in which a qualifying notification may be delivered.
2. For planned work, notify once before the preparation lead time or at the start of the commute window, whichever preserves useful action time.
3. For unplanned disruption, notify promptly after the required persistence or authoritative confirmation.
4. Require a final relevance and freshness check immediately before the delivery decision.
5. Define message fields: affected trip, plain-language impact, relevant station or segment, timing, credible alternative when available, and an explicit invitation to open current details.
6. Separate planned-change, active-delay, suspension, skipped-stop, accessibility-path, and recovery message patterns.
7. Use certainty language that matches the underlying evidence; do not convert “may be affected” into a definitive bypass.
8. Keep the most decision-relevant text visible without opening the app.
9. Permit an escalation only when added journey time worsens by at least five more minutes, a newly affected origin, transfer, or destination appears, severity increases, the active period extends at least thirty minutes farther into the commute window, or the recommended alternative changes.
10. Keep restoration silent by default and make recovery updates an explicit per-commute choice; suppress recovery when the rider was never notified about the incident.
11. For repeated multi-day planned work, send one useful summary and a reminder only when the rider has not seen it or the plan changes.
12. For overnight changes, make the applicable calendar date and commute window understandable without exposing service-day jargon.

**Acceptance evidence**

- Every message answers “what changed, how it affects my trip, and what should I do?”
- Copy does not claim a train will stop where the reconciled stop set says it will bypass.
- Accessibility messages identify the affected path role rather than naming unrelated equipment.
- A stale alert cannot produce a freshly worded definitive message.
- Recovery messages can be paired with the disruption episode that caused them.
- Copy edits, renewed timestamps, and unchanged repeated planned work never create another message.

**Commit checkpoint**

`define commute notification content`

---

## Task 6: Specify incident identity and deduplication

**Artifacts**

- Create: `docs/product/commute/disruption-episode-contract.md`
- Create: `docs/product/commute/deduplication-decision-table.md`
- Create: `docs/product/test-cases/commute-deduplication-scenarios.md`

**Dependencies**

- Tasks 2–5.
- Alert identity and correction behavior from data-quality operations.

**Steps**

1. Define a disruption episode using the smallest stable combination of affected service, direction, segment, impact type, and effective time.
2. Define which alert edits belong to the same episode and which constitute a materially new rider impact.
3. Prevent duplicate messages caused by repeated source snapshots, wording-only alert updates, feed recovery, or a changing estimated end time.
4. Permit a second disruption message only for higher severity, a newly affected station or direction, a changed recommended alternative, at least five additional expected journey minutes, or an active-period extension of at least thirty minutes farther into the commute window; treat an opted-in recovery as a separate recovery state.
5. Define precedence when one incident appears through both a service alert and live-trip degradation.
6. Define behavior for overlapping incidents and multiple saved commute windows that share the same rider journey.
7. Record a bounded quiet-period policy without suppressing a genuinely new severe impact.

**Acceptance evidence**

- Replaying an identical source record never produces another notification.
- Wording changes alone do not produce another notification.
- A new bypass of the rider’s origin can produce a new notification even within an existing delay episode.
- Two commute windows representing the same imminent trip do not create duplicate messages.
- Test cases distinguish update, escalation, recovery, and unrelated new episode.

**Commit checkpoint**

`define disruption episode deduplication`

---

## Task 7: Complete preference, privacy, and reset behavior

**Artifacts**

- Create: `docs/product/privacy/commute-data-inventory.md`
- Create: `docs/product/privacy/commute-retention-and-reset-policy.md`
- Update: `docs/product/ux/commute-window-state-matrix.md`
- Create: `docs/product/test-cases/commute-privacy-scenarios.md`

**Dependencies**

- Tasks 1 and 4.
- Product privacy principles in the approved specification.

**Steps**

1. Inventory every preference and derived value needed for commute alerts.
2. Mark whether each item is necessary for the feature, optional for convenience, or prohibited.
3. Define local persistence, reset behavior, and rider-visible controls without requiring an account.
4. Avoid continuous background-location dependence; a commute window should use the rider’s saved trip definition unless the rider explicitly chooses a location-dependent convenience.
5. Separate analytics measurements from identifiable trip preferences.
6. Define behavior after notification permission is revoked, location permission is revoked, app data is cleared, or the product is reinstalled.
7. Ensure a rider can remove all commute preferences and understand the result.

**Acceptance evidence**

- Every stored item has a documented product purpose.
- Core commute alerts can operate without continuous location tracking.
- Permission revocation cannot silently leave a window appearing active when delivery is impossible.
- Reset behavior removes saved commute preferences and does not remove required offline maps without explicit rider intent.
- Analytics do not require reconstructing an individual rider’s commute.

**Commit checkpoint**

`document commute privacy controls`

---

## Task 8: Define notification quality measurement

**Artifacts**

- Create: `docs/product/measurement/commute-alert-scorecard.md`
- Create: `docs/product/measurement/commute-alert-event-dictionary.md`
- Create: `docs/product/measurement/commute-alert-sampling-plan.md`
- Update: `docs/product/measurement/product-scorecard.md`

**Dependencies**

- Tasks 2, 3, 5, 6, and 7.

**Steps**

1. Copy the notification relevance, duplicate, timeliness, and opt-out guardrails from the approved specification.
2. Define the numerator, denominator, inclusion rule, exclusion rule, and review cadence for each measure.
3. Include false-positive review for unaffected segments, stale evidence, wrong direction, and resolved incidents.
4. Include false-negative sampling for disruptions that should have notified but did not.
5. Define a human-review sample that compares each message to the evidence available at decision time.
6. Measure permission denial and feature disablement without treating permission acceptance as a success metric.
7. Define how planned and unplanned disruptions are reported separately.
8. Establish a launch stop condition for any trust guardrail breach.

**Acceptance evidence**

- Two reviewers calculate the same result from the same sample.
- A duplicate caused by cross-source incident identity is counted as a duplicate.
- Messages correctly suppressed due to unresolved evidence are not mislabeled as delivery failures.
- Relevance is measured from the rider’s actual segment and direction.
- Metrics cannot reward higher notification volume at the expense of trust.

**Commit checkpoint**

`define commute alert quality metrics`

---

## Task 9: Build the operational decision and correction playbook

**Artifacts**

- Create: `docs/product/operations/commute-alert-operations-playbook.md`
- Create: `docs/product/operations/commute-alert-correction-policy.md`
- Create: `docs/product/operations/commute-alert-incident-log-template.md`
- Create: `docs/product/operations/commute-alert-pilot-review-template.md`

**Dependencies**

- Tasks 2–8.
- Feed-health and correction policies from the arrival-truth workstream.

**Steps**

1. Define who may pause all commute alerts, a route’s alerts, or a specific disruption episode when evidence quality degrades.
2. Define operational cues for mass stale data, bulk-trip disappearance, unresolved alert mappings, notification duplication, and incorrect direction impact.
3. Establish a correction rule: withdraw or correct only when the rider would otherwise make a materially wrong decision.
4. Preserve the original decision evidence, the corrected evidence, and the reason for the correction.
5. Define pilot review cadence during ordinary weekday service, overnight service, planned weekend work, and at least one unplanned incident.
6. Define a reversible route-level hold that does not disable station boards.
7. State escalation criteria for privacy, accessibility, and rider-safety issues.

**Acceptance evidence**

- An operator can decide whether to continue, hold, correct, or recover without inventing a policy.
- A route-level alert hold leaves other routes and non-notification product surfaces intact.
- Corrections are rare, attributable, and tied to rider impact.
- The playbook contains a clear path for suspected widespread false positives.
- Pilot records preserve enough evidence for later threshold calibration.

**Commit checkpoint**

`add commute alert operations playbook`

---

## Task 10: Run the staged launch gate

**Artifacts**

- Create: `docs/product/release/commute-alert-launch-checklist.md`
- Create: `docs/product/release/commute-alert-scenario-results.md`
- Create: `docs/product/release/commute-alert-go-no-go-record.md`
- Update: `docs/product/release/subway-release-readiness.md`

**Dependencies**

- Tasks 1–9.
- Truth Gate approval from the arrival-truth workstream.
- Nearby, saved-station, and permission-flow acceptance.
- Accessibility-path impact classification where Accessible Route Only is in pilot scope.

**Steps**

1. Run the commute-owned acceptance scenarios 36–39 and 48, plus scenario 42 wherever authoritative-time freshness affects the final notification decision.
2. Add representative cases for ordinary weekday service, planned weekend reroutes, overnight service, an elevator outage affecting the selected path, a feed-health degradation, and alert recovery.
3. Record the evidence, expected decision, actual decision, message outcome, and reviewer for every case.
4. Conduct a silent evaluation period in which notification decisions are scored but no riders are contacted.
5. Advance to a limited pilot only after truth, relevance, freshness, and duplicate targets pass.
6. During the pilot, review opt-outs and false-positive reports daily without loosening conservative suppression.
7. Require explicit product, accessibility, data-quality, privacy, and operations sign-off.
8. Record a go, conditional go, or no-go decision with named unresolved risks and rollback criteria.

**Acceptance evidence**

- All mandatory scenarios pass with traceable evidence.
- Silent evaluation meets every launch guardrail for the approved observation period.
- The pilot can be stopped by route or globally without compromising arrival boards.
- A conditional go names a deadline, owner, affected population, and containment.
- No launch decision relies on notification volume as proof of usefulness.

**Commit checkpoint**

`complete commute alert launch gate`

## Final handoff checklist

- The commute contract and UI use the same route, station, direction, and service-day terms as the rest of the product.
- Notification decisions inherit reconciled service truth; they do not recreate or weaken it.
- Every threshold has exact boundary tests.
- Every suppression outcome is inspectable.
- Every sent message is attributable to a disruption episode and current evidence.
- Privacy and permission failure states are complete.
- The release record contains reviewer evidence for all required scenarios.
- All commits use lowercase messages.
