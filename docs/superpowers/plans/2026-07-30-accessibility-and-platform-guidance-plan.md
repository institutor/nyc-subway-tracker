# Accessibility and Platform Guidance Product Delivery Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task by task. Track every ordered step with its checkbox, stop at each evidence gate, and do not advance a rider-facing claim that has not passed its stated review.

**Goal:** Deliver a subway-first accessibility and journey-guidance product contract that validates the rider's complete step-free path, reacts conservatively to equipment uncertainty, and shows front/middle/back and transfer guidance only when the underlying station evidence supports it.

**Source of truth:** The approved product specification at `docs/superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md`, specifically sections 19-21, 23-24, 29.1, 29.3-29.4, 31.5-31.6, 32.2-32.3, and related risks in 33.1-33.3. Where this plan summarizes a rule, the approved specification controls.

**Scope and boundaries:**

- This is a product, data-policy, rider-copy, editorial-operations, acceptance, and rollout plan.
- It intentionally contains no code, framework choice, architectural stack, API architecture, or implementation-specific data structure.
- Release 1 includes direction-aware station accessibility, live equipment status, and Accessible Route Only for complete verified paths.
- Release 2 adds destination-aware exits and transfers, verified platform positioning at priority complexes, and broader accessible-path resilience.
- System-wide positioning expansion and any car-level crowding surface remain later work subject to their evidence gates.
- Subway car-level crowding is omitted at launch. No historical proxy, headway gap, station crowd estimate, or rider anecdote may be labeled as live car capacity.
- A station accessibility badge is informational only. It can never replace validation of the complete origin, transfer, direction, boarding, destination, and exit path.
- Unknown is a safety state, not a synonym for available. Missing, stale, anomalous, empty, or unjoinable equipment information never supports an operational claim.
- Accessible Route Only is a persistent hard constraint. The product never silently relaxes it to produce a faster or more convenient subway route.
- Public entrance coordinates alone are insufficient evidence for platform positioning, exit optimization, transfer guidance, or elevator-chain claims.

## Product artifact map

The execution work is divided into focused, reviewable product artifacts:

- `docs/product/accessibility/complete-path-contract.md` defines what constitutes a valid step-free journey.
- `docs/product/accessibility/path-edge-review-checklist.md` gives reviewers the required evidence for every path connection.
- `docs/product/accessibility/station-direction-coverage-register.md` records constituent-station, line, direction, entrance, and elevator-chain coverage.
- `docs/product/accessibility/station-direction-review-guide.md` prevents partial-complex and wrong-entrance inferences.
- `docs/product/accessibility/accessible-route-only-state-matrix.md` specifies hard-constraint behavior, offline behavior, alternatives, and route ranking.
- `docs/product/accessibility/accessibility-copy-catalog.md` contains approved rider-facing accessibility states and warnings.
- `docs/product/accessibility/equipment-status-policy.md` specifies freshness, anomaly, matching, outage, and restoration rules.
- `docs/product/accessibility/equipment-status-acceptance-table.md` fixes boundary and recovery examples for independent review.
- `docs/product/accessibility/path-impact-and-reroute-playbook.md` classifies equipment impacts and orders safe alternatives.
- `docs/product/accessibility/underway-warning-state-matrix.md` defines warnings before the last accessible decision point.
- `docs/product/accessibility/accessibility-acceptance-pack.md` consolidates Release 1 accessibility acceptance evidence.
- `docs/product/guidance/platform-evidence-standard.md` defines the editorial evidence required for positioning.
- `docs/product/guidance/platform-state-and-certainty-matrix.md` distinguishes platform evidence, positioning certainty, and suppression behavior.
- `docs/product/guidance/positioning-rider-experience.md` defines front/middle/back presentation and accessible-priority behavior.
- `docs/product/guidance/transfer-connection-assessment.md` defines Likely, Tight, Uncertain, and Unlikely transfer outcomes.
- `docs/product/guidance/platform-coverage-register.md` governs station-by-station rollout and reverification.
- `docs/product/crowding/subway-crowding-enablement-gate.md` records the launch omission and future authoritative-data gate.
- `docs/product/quality/accessibility-and-guidance-release-gates.md` combines target metrics, scenario evidence, and release decisions.

---

### Task 1: Define the complete accessible-path contract

**Product artifacts:**

- Create: `docs/product/accessibility/complete-path-contract.md`
- Create: `docs/product/accessibility/path-edge-review-checklist.md`

**Dependencies:**

- Approved specification sections 19.1, 20.2, 21, and 33.3.
- No prior task in this plan.

**Produces for later tasks:**

- One controlling definition of a valid complete step-free path.
- One review checklist used by Tasks 2, 3, 5, 6, 8, and 12.

**Ordered steps:**

- [ ] **Step 1: Record the complete rider path in order.** In `complete-path-contract.md`, state the full chain: street entrance; fare control or mezzanine; any transfer passage; correct directional platform; boarding area; destination platform; exit path; street. State that every required connection must be verified, step-free, and currently available before the journey can be described as accessible now.
- [ ] **Step 2: Record the evidence carried by every connection.** Require movement type, physical endpoints and station levels, relevant route and direction, official equipment identity when applicable, membership in an official accessible path, operating restrictions, and verification date.
- [ ] **Step 3: Separate physical presence from path validity.** State that an elevator can exist without completing an accessible path, an escalator can serve Avoid Stairs but cannot replace an elevator for wheelchair-accessible routing, and a station-complex badge is informational only.
- [ ] **Step 4: Define chain and redundancy behavior.** State that one failed required connection invalidates a chained path, while a second route remains valid only when every connection in that alternate chain is independently verified and available.
- [ ] **Step 5: Turn the contract into a reviewer checklist.** In `path-edge-review-checklist.md`, include a pass/fail check for every required evidence item and a final rule that any missing or Unknown required connection blocks an accessible-now claim.
- [ ] **Step 6: Review the checklist against representative traps.** Evaluate a mezzanine-only elevator, a non-step-free transfer passage, a failed leg in a chained elevator path, and a redundant complete chain. Record the expected result for each in the checklist.

**Evidence and acceptance checks:**

- The contract contains every segment from street at origin to street at destination; it does not begin or end at a station badge.
- Every path connection has all seven evidence items from section 19.1.
- A mezzanine-only elevator fails the complete-path check.
- A failed required chained elevator invalidates the route.
- A redundant route passes only when its entire alternate chain passes.
- The words available, accessible, or working are never inferred merely from the presence of equipment.

**Suggested lowercase git commit:** `define complete accessible path contract`

---

### Task 2: Establish directional and partial-accessibility coverage

**Product artifacts:**

- Create: `docs/product/accessibility/station-direction-coverage-register.md`
- Create: `docs/product/accessibility/station-direction-review-guide.md`
- Update: `docs/product/accessibility/path-edge-review-checklist.md`

**Dependencies:**

- Task 1 complete-path contract and review checklist.
- Approved specification sections 19.2, 21, 31.5, and 33.3.

**Produces for later tasks:**

- A reviewable register of exact entrances, constituent stations, lines, directions, platforms, and required elevator chains.
- Direction and partial-complex rules consumed by Tasks 3, 5, 6, 8, and 12.

**Ordered steps:**

- [ ] **Step 1: Define the coverage unit.** In `station-direction-coverage-register.md`, make each reviewed entry specific to the constituent station, route or line, travel direction, exact accessible street entrance, platform reached, required connection chain, operating restrictions, and verification date.
- [ ] **Step 2: Record partial-complex distinctions.** Require separate entries when one line in a complex is accessible and another is not, or when only one travel direction has a complete verified path.
- [ ] **Step 3: Record entrance distinctions.** Require the exact accessible street corner or entrance and prevent a same-name station or nearest staircase from inheriting another entrance's accessibility.
- [ ] **Step 4: Record passage and equipment distinctions.** Require explicit confirmation that a passage is part of an official accessible path; do not treat merely step-free or equipment-present as ADA-path evidence.
- [ ] **Step 5: Write the reviewer guide.** In `station-direction-review-guide.md`, provide pass/fail review examples for a one-direction station, a partial complex, a mezzanine-only elevator, same-name stations with different corners, a wrong entrance, and a reroute to an unverified platform.
- [ ] **Step 6: Extend the path checklist.** Add explicit checks for constituent station, direction, entrance, official-path membership, and whether a rerouted platform has complete verified coverage.

**Evidence and acceptance checks:**

- A reviewer can identify the exact entrance, served lines, served directions, and elevator chain for every accepted entry.
- The inaccessible direction at a one-direction accessible station is rejected.
- One accessible line does not make every line in a complex accessible.
- A wrong or merely nearby entrance is never substituted.
- A rerouted train using an unverified platform is rejected in accessible routing.
- No entry can be approved without a verification date.

**Suggested lowercase git commit:** `document directional accessibility coverage`

---

### Task 3: Specify Accessible Route Only behavior and resilient ranking

**Product artifacts:**

- Create: `docs/product/accessibility/accessible-route-only-state-matrix.md`
- Create: `docs/product/accessibility/accessibility-copy-catalog.md`

**Dependencies:**

- Task 1 complete-path validity rule.
- Task 2 directional and partial-accessibility coverage.
- Approved specification sections 19.3-19.4, 21.10, 31.5, and 33.3.

**Produces for later tasks:**

- The controlling behavior for Accessible Route Only.
- Approved accessibility copy reused by Tasks 5, 6, and 12.

**Ordered steps:**

- [ ] **Step 1: Define preference persistence.** In `accessible-route-only-state-matrix.md`, state that Accessible Route Only remains enabled until the rider changes it and applies at origin, every transfer, destination, travel direction, boarding area, and exit.
- [ ] **Step 2: Define non-relaxation.** State that a faster route, ordinary station badge, unverified replacement platform, or official alternative with unconfirmed accessibility cannot override the hard constraint.
- [ ] **Step 3: Define destination and workaround rules.** Reject a destination whose required exit path is broken. Permit ride-past-and-return only when every added segment, reversal, direction, transfer, and exit path is verified accessible and available.
- [ ] **Step 4: Define no-route and bus-choice behavior.** Use the exact primary message **No verified step-free subway route is available right now.** Offer buses only as a separate explicit rider choice; never insert an unrequested bus leg into a subway result.
- [ ] **Step 5: Define offline behavior.** Use **Structurally step-free; live elevator status unavailable** and never describe an offline route as accessible now.
- [ ] **Step 6: Define ranking among valid paths.** Apply this order: fewer single-point elevator dependencies, fewer transfers, shorter accessible walking distance, lower disruption risk, then travel time. State that a small time saving does not outrank a more resilient verified path.
- [ ] **Step 7: Build the copy catalog.** In `accessibility-copy-catalog.md`, include the exact no-route and offline phrases, **Accessibility not confirmed** for an unverified official alternative, and the equipment-state and warning copy delivered by Tasks 4 and 5.
- [ ] **Step 8: Review the complete state matrix.** Check origin, transfer, direction, destination exit, reroute, ride-past-and-return, no-route, bus opt-in, and offline cases individually.

**Evidence and acceptance checks:**

- The preference persists and is never silently relaxed.
- Broken destination egress invalidates the result even when boarding is step-free.
- Every extra connection in a ride-past-and-return workaround is reviewed.
- No subway result silently contains a bus leg.
- Offline copy never claims current equipment availability.
- Route ranking places resilience before travel time in the exact approved order.
- Unverified official alternatives are labeled **Accessibility not confirmed** and excluded from Accessible Route Only results.

**Suggested lowercase git commit:** `specify accessible route only behavior`

---

### Task 4: Establish conservative equipment-status truth

**Product artifacts:**

- Create: `docs/product/accessibility/equipment-status-policy.md`
- Create: `docs/product/accessibility/equipment-status-acceptance-table.md`
- Update: `docs/product/accessibility/accessibility-copy-catalog.md`

**Dependencies:**

- Task 1 definition of route-critical equipment.
- Approved specification sections 20.1, 20.5, 21.9, 29.1, and 31.8.

**Produces for later tasks:**

- One accepted equipment-state and freshness policy.
- Boundary, anomaly, empty-snapshot, and restoration evidence consumed by Tasks 5, 6, and 12.

**Ordered steps:**

- [ ] **Step 1: Define snapshot-health states.** In `equipment-status-policy.md`, set Current to a successful, structurally valid, internally consistent, non-anomalous retrieval no more than five minutes old; Degraded to more than five and no more than fifteen minutes old or suspicious, with route-critical equipment becoming Unknown; and Unavailable to more than fifteen minutes old, failed, malformed, structurally incomplete, or impossible to match to the current inventory.
- [ ] **Step 2: Define the provisional-empty rule.** Require two accepted, structurally valid zero-outage snapshots at least one minute apart before supporting **No official outage reported**. Treat route-critical state as Unknown after the first empty snapshot.
- [ ] **Step 3: Define anomaly checks.** Treat a snapshot as anomalous when more than half of previously active outages disappear without explicit restoration evidence, or when more than 10% of records are malformed, duplicated, or unmatched. Require the next accepted snapshot to confirm the change.
- [ ] **Step 4: Define inventory currency and matching.** Require official equipment-identifier matching, review the official inventory at least daily, and make required equipment topology Unknown when the inventory cannot be refreshed for seven days. Similar station names or descriptions never support a join.
- [ ] **Step 5: Define rider-visible machine states.** Use **No official outage reported**, **Out of service**, **Planned outage**, and **Unknown**. Preserve a stale last-known outage as **Out of service—status being rechecked**; make a formerly available route-critical machine Unknown when freshness expires.
- [ ] **Step 6: Define freshness and estimate copy.** Show relative freshness such as **Checked 2 min ago** for route-critical equipment. Never shorten **No official outage reported** to **Working**, and show estimated return information as an estimate rather than a reopening countdown.
- [ ] **Step 7: Define restoration evidence.** Accept restoration from an explicit current official state or from two accepted current snapshots at least one minute apart that omit the outage while the surrounding population remains coherent. A failed, provisional-empty, anomalously truncated, or partial response is not restoration evidence.
- [ ] **Step 8: Build the acceptance table.** In `equipment-status-acceptance-table.md`, record inputs and expected state at five minutes, just over five minutes, fifteen minutes, just over fifteen minutes, first empty snapshot, confirmed empty snapshot, bulk disappearance, more than 10% bad records, six-day-old inventory, more-than-seven-day inventory failure, one missing outage snapshot, and confirmed restoration.
- [ ] **Step 9: Synchronize the copy catalog.** Add all exact machine states, status-recheck copy, freshness wording, and estimate treatment to `accessibility-copy-catalog.md`.

**Evidence and acceptance checks:**

- The five- and fifteen-minute boundaries have one unambiguous expected result.
- A first valid empty response is Provisional empty, not evidence that every machine is available.
- Raw empty, stale, anomalous, failed, or unmatched data never becomes **No official outage reported**.
- Only the official equipment identifier supports matching.
- A previous outage remains visible until explicit restoration or the two-snapshot rule passes.
- A stale formerly available route-critical machine becomes Unknown.
- The daily inventory review and seven-day safety cutoff are present.
- All thresholds are identified as conservative product defaults subject to measured recalibration; they may not be lengthened silently for accessibility-dependent riders.

**Suggested lowercase git commit:** `define conservative equipment status policy`

---

### Task 5: Define path impact, rerouting, and proactive warnings

**Product artifacts:**

- Create: `docs/product/accessibility/path-impact-and-reroute-playbook.md`
- Create: `docs/product/accessibility/underway-warning-state-matrix.md`
- Update: `docs/product/accessibility/accessibility-copy-catalog.md`

**Dependencies:**

- Task 1 complete path and equipment relevance.
- Task 2 direction-specific coverage.
- Task 3 Accessible Route Only constraint and ranking.
- Task 4 equipment truth and restoration policy.
- Approved specification sections 20.2-20.6, 21.6, 31.5, and 31.6 scenario 39.

**Produces for later tasks:**

- A deterministic rider-impact classification and safe alternative order.
- Proactive warning behavior consumed by Tasks 6 and 12.

**Ordered steps:**

- [ ] **Step 1: Define path relevance.** In `path-impact-and-reroute-playbook.md`, require station details to show all known equipment while prioritizing machines on the selected path, their endpoints, served routes and directions, ADA-path membership, outage reason, estimated return, and official alternative.
- [ ] **Step 2: Define impact classes.** Classify an outage as Blocking when it breaks the selected origin, transfer, or destination path; Reroutable within station when another complete verified in-station path remains; and Unrelated when it does not affect the selected path.
- [ ] **Step 3: Prevent complex-wide overstatement.** State that an unrelated outage does not make the entire station inaccessible and that an escalator outage affects Avoid Stairs only when relevant; it does not invalidate wheelchair routing unless the verified path independently requires a valid wheelchair-accessible connection.
- [ ] **Step 4: Apply the approved alternative order.** First use another verified path in the same complex; then a nearby verified accessible subway station; then a verified subway detour, including ride-past-and-return where valid; then an explicit bus-inclusive alternative.
- [ ] **Step 5: Validate official alternatives.** Do not promote an official suggested alternative in Accessible Route Only unless its complete path passes the same contract. Otherwise show **Accessibility not confirmed**.
- [ ] **Step 6: Define underway safety.** In `underway-warning-state-matrix.md`, identify the last accessible decision point for each active journey and require a warning before it when current data permits. Never instruct a rider to exit at an inaccessible station.
- [ ] **Step 7: Define change states.** Cover an outage appearing before departure, an outage appearing while underway before the final safe transfer, a redundant chain remaining available, a required chain breaking, status becoming Unknown, and restoration being confirmed.
- [ ] **Step 8: Define actionable warning content.** Require the warning to identify the exact failed connection, its journey impact, and the first verified alternative. Use the approved example pattern: **The street-to-mezzanine elevator at your 74 St entrance is out. Your usual step-free route is unavailable; use 61 St–Woodside instead.**
- [ ] **Step 9: Synchronize the copy catalog.** Add Blocking, Reroutable within station, Unrelated, **Accessibility not confirmed**, last-decision-point warning, and status-recheck treatments.

**Evidence and acceptance checks:**

- An outage affecting only unrelated equipment leaves the selected path valid.
- A redundant complete chain is used when verified and current.
- A failed required connection invalidates the full route.
- Alternative ordering exactly matches section 20.4.
- A rider already underway is warned before the last accessible decision when current evidence permits.
- No warning tells a rider to alight at an inaccessible station.
- An unverified official alternative is not promoted.
- Every warning identifies a decision-changing action, not merely a line-wide outage.

**Suggested lowercase git commit:** `define accessible outage rerouting and warnings`

---

### Task 6: Assemble the Release 1 accessibility acceptance pack

**Product artifacts:**

- Create: `docs/product/accessibility/accessibility-acceptance-pack.md`
- Update: `docs/product/accessibility/station-direction-coverage-register.md`
- Update: `docs/product/accessibility/equipment-status-acceptance-table.md`

**Dependencies:**

- Tasks 1-5 complete.
- Approved specification sections 20.1, 20.5, 21, 31.5, and 32.2.

**Produces for later tasks:**

- The evidence packet required to release direction-aware accessibility, live equipment status, and Accessible Route Only.
- Accessibility gate inputs used by Task 12.

**Ordered steps:**

- [ ] **Step 1: Create a traceability table.** In `accessibility-acceptance-pack.md`, map each accessibility rule to its product artifact, scenario, expected rider-visible result, and evidence owner.
- [ ] **Step 2: Include all ten section 21 cases.** Cover elevator-does-not-equal-accessibility, partial complex, one-direction platform, inaccessible transfer passage, chained elevators, redundant path, wrong entrance, rerouted train on an unknown platform, stale equipment status, and offline planning.
- [ ] **Step 3: Include all seven section 31.5 cases.** Cover one-direction rejection, non-ADA elevator non-inference, redundant-chain use, required-chain invalidation, empty or stale equipment becoming Unknown, unverified rerouted-platform rejection, and underway warning before the last accessible decision.
- [ ] **Step 4: Include empty and restoration boundaries.** Reference the first-empty and second-accepted-empty outcomes, plus one-time outage disappearance and confirmed restoration.
- [ ] **Step 5: Define pass evidence for each case.** Require the exact rider-facing state or suppression outcome, the path edges considered, equipment snapshot state where relevant, and the reason a route was accepted, rejected, or labeled structurally step-free.
- [ ] **Step 6: Record Release 1 coverage evidence.** Update `station-direction-coverage-register.md` so each launch entry has its required entrance, line, direction, complete chain, restrictions, and verification date; unsupported combinations remain ineligible for an accessible-now claim.
- [ ] **Step 7: Conduct a cross-artifact consistency review.** Confirm that the state names and copy in the acceptance pack exactly match the Accessible Route Only, equipment status, and warning artifacts.

**Evidence and acceptance checks:**

- Every section 21 and 31.5 scenario appears once with a clear expected outcome.
- Release 1 cannot pass with a missing direction, entrance, required path edge, or verification date.
- Known broken route-critical elevator: zero accepted route recommendations through it.
- Empty, stale, anomalous, or failed equipment information never produces **No official outage reported**.
- Offline accessible planning uses **Structurally step-free; live elevator status unavailable**.
- The packet is reviewable without relying on station-level accessibility badges.

**Suggested lowercase git commit:** `assemble release one accessibility acceptance`

---

### Task 7: Define platform evidence, state, and certainty

**Product artifacts:**

- Create: `docs/product/guidance/platform-evidence-standard.md`
- Create: `docs/product/guidance/platform-state-and-certainty-matrix.md`

**Dependencies:**

- Approved specification sections 23.2-23.4, 29.4, 31.6 scenarios 33-34, and 33.1-33.2.
- The product's accepted arrival and service-change truth rules must expose current direction, reroute, and actual-versus-scheduled-track conflict evidence before live platform certainty can be claimed.

**Produces for later tasks:**

- One editorial evidence standard for platform-relative guidance.
- Platform and positioning certainty rules consumed by Tasks 8-10 and 12.

**Ordered steps:**

- [ ] **Step 1: Define required positioning evidence.** In `platform-evidence-standard.md`, require verified platform orientation, train direction and destination, front/rear order for that direction, platform zones, exit and transfer-passage locations, relevant street corners, accessible elevator or boarding-area locations, service-pattern variations, and verification date.
- [ ] **Step 2: State insufficient evidence explicitly.** Record that entrance coordinates alone do not show where a stair, passage, or elevator meets a platform and therefore cannot support front/middle/back guidance.
- [ ] **Step 3: Define editorial verification.** Require platform guidance to be treated as versioned, reverified editorial data. Omit claims wherever evidence is incomplete.
- [ ] **Step 4: Define positioning certainty.** In `platform-state-and-certainty-matrix.md`, use Verified when the direction, platform, and zone relationship are current and field-checked; Expected when the static platform is known but the live platform is not confirmed; and Unavailable when platform, direction, reroute, consist orientation, or geometry is uncertain. Do not expose a numeric confidence score.
- [ ] **Step 5: Define platform state separately.** Use Platform confirmed only when fresh actual-track evidence resolves to a known platform and remains stable across two updates; Expected platform when only normal or scheduled platform is known; and Check station signs when there is no conflicting actual-track record but live confirmation is unavailable because of stale data, a resolved reroute, or station-specific ambiguity.
- [ ] **Step 6: Define downstream restraint.** State that near-term actual-track evidence does not permit a downstream platform to be called confirmed prematurely.
- [ ] **Step 7: Define conflict suppression.** An explicit non-terminal actual-versus-scheduled-track conflict suppresses the train's arrival row and all positioning guidance. The station context shows **Track change—check station signs**; the conflict is not merely downgraded to Check station signs.
- [ ] **Step 8: Define direction-reversal behavior.** Require front and back to reverse correctly when direction reverses, and require the evidence review to be repeated when reroutes or service-pattern changes can alter orientation.

**Evidence and acceptance checks:**

- Every displayed recommendation has current route-direction orientation and a verification date.
- Entrance coordinates alone can never pass the evidence standard.
- Verified, Expected, and Unavailable positioning certainty are not conflated with Platform confirmed, Expected platform, and Check station signs.
- Platform confirmed requires two stable fresh updates.
- An explicit non-terminal track conflict removes both the row and guidance and shows the station-level track-change message.
- Front and back reverse under direction reversal.
- No numeric confidence score is rider-facing.

**Suggested lowercase git commit:** `define platform evidence and certainty`

---

### Task 8: Specify the front, middle, and back rider experience

**Product artifacts:**

- Create: `docs/product/guidance/positioning-rider-experience.md`
- Update: `docs/product/accessibility/accessible-route-only-state-matrix.md`
- Update: `docs/product/accessibility/accessibility-acceptance-pack.md`

**Dependencies:**

- Task 1 complete accessible-path contract.
- Task 3 Accessible Route Only priority.
- Task 7 platform evidence and certainty.
- Approved specification sections 23.1, 23.3, 23.5, 29.4, and 31.6 scenarios 33-35.

**Produces for later tasks:**

- The approved rider-facing positioning behavior.
- Positioning inputs used by Tasks 9, 10, and 12.

**Ordered steps:**

- [ ] **Step 1: Define the rider objectives.** In `positioning-rider-experience.md`, let the rider optimize for fastest destination exit, fastest transfer, or verified accessible boarding and exit path.
- [ ] **Step 2: Define the default precision.** Use Front, Middle, and Back as thirds of the platform. Use car numbers only when train length, car order, stopping position, and orientation are all verified for that train; never convert an unverified zone into a car number.
- [ ] **Step 3: Define benefit copy.** Explain why the zone helps, using patterns such as **Front—shortest walk to the Lexington Ave exit**, **Front best for transfer to the L**, and **Middle usually best for 14 St exit**, with wording matched to certainty.
- [ ] **Step 4: Apply accessibility priority.** Accessible Route Only always overrides a shorter stair-based exit. When useful and valid, show the differing accessible recommendation as a secondary instruction such as **Middle—nearest elevator**.
- [ ] **Step 5: Define suppression and recalculation.** Remove guidance when a reroute changes platform orientation or transfer path, when any required evidence is Unavailable, or when the Task 7 track-conflict rule applies. Recalculate after direction reversal.
- [ ] **Step 6: Extend the accessibility state matrix.** Record that a verified accessible boarding or exit zone outranks a faster stair-based objective and that crowding or convenience never overrides it.
- [ ] **Step 7: Extend acceptance evidence.** Add cases for direction reversal, track-conflict suppression, and accessible-exit priority to `accessibility-acceptance-pack.md`.

**Evidence and acceptance checks:**

- Every recommendation is Front, Middle, or Back unless all train-specific evidence for a car number is verified.
- Every visible recommendation explains its rider benefit.
- Accessible positioning wins over the quickest stairs in Accessible Route Only.
- Guidance disappears during unresolved platform or reroute conflict.
- Direction reversal produces the correct reversed orientation.
- Verified and Expected wording is visibly different; Unavailable shows no positioning claim.
- Positioning never appears solely because the station has entrance coordinates.

**Suggested lowercase git commit:** `specify accessible platform positioning experience`

---

### Task 9: Define transfer connection likelihood and fallback choices

**Product artifacts:**

- Create: `docs/product/guidance/transfer-connection-assessment.md`
- Update: `docs/product/guidance/positioning-rider-experience.md`

**Dependencies:**

- Task 1 accessibility validity.
- Task 7 arrival-platform confidence and positioning certainty.
- Task 8 front/middle/back presentation.
- Approved specification sections 23.6 and 31.6.

**Produces for later tasks:**

- One transfer-assessment contract consumed by Tasks 10 and 12.

**Ordered steps:**

- [ ] **Step 1: Define required transfer content.** In `transfer-connection-assessment.md`, require arrival platform and confidence, front/middle/back position when available, a plain-language walking path, stairs/escalators/elevators/ramps/long passages, conservative walking-time range, accessibility validity, and connection assessment.
- [ ] **Step 2: Define the comparison basis.** For a specific connecting train, compare the conservative transfer window with the verified high end of the walking-time range.
- [ ] **Step 3: Define Likely.** Use Likely when even the conservative transfer window exceeds the high-end walk by at least three minutes, or at least five minutes for an accessible path.
- [ ] **Step 4: Define Tight.** Use Tight when the conservative window covers the high-end walk but leaves less than the applicable buffer.
- [ ] **Step 5: Define Uncertain.** Use Uncertain when plausible arrival and departure ranges straddle the required walk or when either platform is merely Expected.
- [ ] **Step 6: Define Unlikely.** Use Unlikely when even the optimistic transfer window is shorter than the high-end walk.
- [ ] **Step 7: Define rider buffer choices.** Set the general default to three minutes and the Accessible Route Only default to five minutes. Permit more conservative five-, eight-, or ten-minute choices, but never let an accessible default fall below five minutes.
- [ ] **Step 8: Define non-promise behavior.** Never promise a connection from an uncertain arrival. When the connection is Unlikely, show the next workable option instead of continuing a stale instruction.
- [ ] **Step 9: Add boundary examples.** Record examples immediately below, exactly at, and immediately above both the three- and five-minute buffers, plus Expected-platform and impossible-walk examples, with the expected Likely, Tight, Uncertain, or Unlikely state.
- [ ] **Step 10: Synchronize positioning presentation.** Update `positioning-rider-experience.md` so transfer guidance carries the connection state and accessibility validity without overstating certainty.

**Evidence and acceptance checks:**

- All four states have mutually understandable conditions and rider consequences.
- Examples on both sides of the three- and five-minute buffers produce the intended state.
- An Expected platform forces Uncertain where specified.
- Accessible Route Only cannot use a buffer below five minutes.
- An uncertain arrival never becomes a promised connection.
- An Unlikely connection is replaced with the next workable option.

**Suggested lowercase git commit:** `define transfer connection likelihood`

---

### Task 10: Govern station-by-station positioning rollout

**Product artifacts:**

- Create: `docs/product/guidance/platform-coverage-register.md`
- Update: `docs/product/guidance/platform-evidence-standard.md`
- Update: `docs/product/guidance/platform-state-and-certainty-matrix.md`

**Dependencies:**

- Tasks 7-9 complete.
- Approved specification sections 23.7, 29.4, 32.3, and 33.2.

**Produces for later tasks:**

- A governed Release 2 positioning rollout and a safe path to later coverage expansion.
- Coverage and correction evidence consumed by Task 12.

**Ordered steps:**

- [ ] **Step 1: Define one station coverage record.** In `platform-coverage-register.md`, require station or complex, routes and directions covered, supported service-pattern variations, platform zones, covered exits/transfers/accessible boarding areas, evidence version, verification date, reverification status, and whether guidance is eligible to appear.
- [ ] **Step 2: Apply the rollout priority.** Order review by highest-transfer-volume complexes; terminals and airport connections; long-passage or asymmetric-exit complexes; accessible stations where elevator placement changes the best zone; then remaining stations.
- [ ] **Step 3: Define omission as the safe default.** Stations, directions, service patterns, or objectives without trusted geometry omit positioning. Coverage quantity never lowers the evidence standard.
- [ ] **Step 4: Define reverification triggers.** Require review after known station-geometry, passage, exit, elevator-chain, platform, route-direction, or service-pattern change. Until renewed evidence passes, the affected claim is Unavailable.
- [ ] **Step 5: Define correction feedback.** Capture rider feedback separately as wrong zone, unclear instruction, or changed station geometry, as required by the positioning target.
- [ ] **Step 6: Define Release 2 evidence.** Record which priority complexes have passed the standard for destination exits, transfers, and verified accessible positioning; every visible recommendation must carry current route-direction orientation and verification date.
- [ ] **Step 7: Define later expansion.** Expand station by station under the same evidence gate; never bulk-enable uncovered portions of a complex.

**Evidence and acceptance checks:**

- Every eligible coverage record names routes, directions, objectives, evidence version, and verification date.
- Unsupported stations omit guidance cleanly.
- No recommendation remains visible after its evidence becomes unresolved.
- Release 2 starts with the approved priority order.
- Rider correction feedback distinguishes all three target categories.
- System-wide expansion uses the same gate as the initial priority-complex rollout.

**Suggested lowercase git commit:** `govern platform guidance coverage rollout`

---

### Task 11: Enforce the subway crowding no-data rule and future gate

**Product artifacts:**

- Create: `docs/product/crowding/subway-crowding-enablement-gate.md`
- Update: `docs/product/guidance/positioning-rider-experience.md`

**Dependencies:**

- Task 8 accessible-positioning priority.
- Approved specification section 24.

**Produces for later tasks:**

- A documented launch omission and a non-negotiable future enablement decision.
- Crowding gate evidence consumed by Task 12.

**Ordered steps:**

- [ ] **Step 1: Record the launch decision.** In `subway-crowding-enablement-gate.md`, state that subway car-level crowding is not shown at launch because the July 30, 2026 review found no supported real-time subway car-level occupancy source in the cited MTA developer materials.
- [ ] **Step 2: Ban misleading proxies.** State that historical averages, headway gaps, station crowd estimates, and rider anecdotes cannot be presented as live train-car capacity.
- [ ] **Step 3: Require a pre-launch re-audit.** Recheck the official feeds and documentation immediately before launch and record the date and result. Treat the 2026 source review as time-bound, not a permanent claim.
- [ ] **Step 4: Define the future evidence gate.** Require an authoritative source, reliable match to the displayed train instance, per-car or per-carriage occupancy, correct front-to-back orientation, known train length and car order, data no older than 90 seconds initially, and enough fleet and route coverage to avoid misleading gaps.
- [ ] **Step 5: Define gate failure behavior.** If any requirement fails for a train, omit the entire crowding module for that train; do not fill a car diagram with Unknown states.
- [ ] **Step 6: Define future rider wording.** If the full gate eventually passes, use text, icon, and color together: **Seats likely** in green, **Room to stand** in amber, and **Very crowded** in red. Show last update time, avoid unsupported exact passenger counts, and explain that conditions may change at each stop.
- [ ] **Step 7: Preserve safety priority.** Update `positioning-rider-experience.md` so crowding never overrides an accessible boarding area or safe platform advice.

**Evidence and acceptance checks:**

- No subway crowding module appears in the launch scope.
- No proxy is described as live train-car occupancy.
- The official-source re-audit is dated and occurs immediately before launch.
- Every future gate condition must pass for the displayed train.
- A failed condition causes full omission, not a row of Unknown cars.
- Future presentation uses words and icons in addition to color.
- Accessible boarding guidance always outranks crowding convenience.

**Suggested lowercase git commit:** `document subway crowding enablement gate`

---

### Task 12: Set accessibility and guidance release gates

**Product artifacts:**

- Create: `docs/product/quality/accessibility-and-guidance-release-gates.md`
- Update: `docs/product/accessibility/accessibility-acceptance-pack.md`
- Update: `docs/product/guidance/platform-coverage-register.md`
- Update: `docs/product/crowding/subway-crowding-enablement-gate.md`

**Dependencies:**

- Tasks 1-11 complete.
- Approved specification sections 29.1, 29.3-29.4, 31.5-31.6, 32.2-32.3, and 33.1-33.3.

**Produces for later work:**

- A single go/no-go record for Release 1 accessibility, Release 2 guidance, later coverage expansion, and any future crowding enablement.

**Ordered steps:**

- [ ] **Step 1: Define the Release 1 accessibility gate.** Require direction-aware station accessibility, complete-path validation, current equipment-state treatment, Accessible Route Only hard constraints, and all Task 6 cases to pass before launch.
- [ ] **Step 2: Apply the safety targets.** Require zero routes recommended through an officially known broken required elevator and require raw empty, stale, anomalous, or failed equipment responses never to become **No official outage reported**.
- [ ] **Step 3: Apply proactive-warning evidence.** Require a blocking accessible-path outage to warn before the commute window or last accessible decision point when authoritative timing permits, and record whether a verified alternative was offered.
- [ ] **Step 4: Define the Release 2 positioning gate.** Require every displayed recommendation to have current route-direction orientation and a verification date; require no recommendation during an unresolved platform or reroute conflict; require direction-reversal, track-conflict, and accessible-priority cases to pass.
- [ ] **Step 5: Apply transfer boundary evidence.** Require Likely, Tight, Uncertain, and Unlikely examples on both sides of the three- and five-minute buffers to match Task 9.
- [ ] **Step 6: Apply rider-feedback observability.** Require platform-guidance coverage and correction review to distinguish wrong zone, unclear instruction, and changed station geometry.
- [ ] **Step 7: Apply the coverage-expansion gate.** Permit positioning only for station-direction-objective combinations that pass the Task 7 evidence standard and appear eligible in the Task 10 register. Missing coverage results in omission, not a lower-certainty guess.
- [ ] **Step 8: Apply the crowding gate.** Keep crowding disabled for launch. A later go decision requires every Task 11 condition and a fresh official-source audit; otherwise record no-go and retain full omission.
- [ ] **Step 9: Review cross-risk controls.** Confirm that station-geometry gaps cause omission, accessibility gaps keep Unknown distinct from operational, reroutes onto unverified platforms are rejected, and platform claims fail closed when direction or track evidence conflicts.
- [ ] **Step 10: Record the release decision.** For each release gate, record the reviewed artifacts, unresolved safety findings, scenario results, coverage included, exclusions, reviewer names, decision date, and go/no-go outcome. Any unresolved safety finding yields no-go for the affected feature.
- [ ] **Step 11: Run a final terminology check.** Confirm that all product artifacts use the same complete-path definition; Current, Degraded, Unavailable, and Provisional empty snapshot states; four rider-visible equipment states; Verified, Expected, and Unavailable positioning certainty; three platform states; and four transfer likelihood states.

**Evidence and acceptance checks:**

- Release 1 has complete evidence for direction-aware accessibility, equipment truth, and Accessible Route Only.
- Known-outage accessible routing target is zero invalid accepted recommendations.
- Unknown-state safety target has no exceptions.
- Every visible positioning recommendation has orientation and a verification date.
- No positioning recommendation survives an unresolved platform or reroute conflict.
- Feedback can distinguish wrong zone, unclear instruction, and changed geometry.
- The Release 2 gate includes destination exits, transfers, priority-complex positioning, and broader accessible alternatives without lowering evidence standards.
- Crowding remains absent unless every future gate condition passes.
- Every go/no-go decision is supported by named artifacts and scenario outcomes.

**Suggested lowercase git commit:** `set accessibility and guidance release gates`

---

## Delivery sequence and release boundaries

1. Complete Tasks 1-6 before the Release 1 accessibility go/no-go review.
2. Complete Tasks 7-10 before enabling any Release 2 front/middle/back or specific-transfer guidance.
3. Complete Task 11 before launch review so the no-data rule is explicit even though no crowding surface ships.
4. Complete Task 12 after all preceding artifacts have passed their independent evidence checks.
5. Expand positioning after Release 2 only through new verified entries in the same coverage register.
6. Reconsider crowding only after a newly authoritative source passes the full future enablement gate.

## Final self-review checklist

- [ ] Every complete accessible path is validated from street entrance through destination street exit.
- [ ] Directional, partial-complex, wrong-entrance, passage, and elevator-chain differences are preserved.
- [ ] Accessible Route Only is persistent, hard, and never silently relaxed.
- [ ] Equipment freshness, anomaly, provisional-empty, inventory, matching, stale-outage, and restoration rules use the approved values.
- [ ] Blocking, reroutable, and unrelated outage impacts lead to the approved alternative order.
- [ ] Underway riders are never directed to inaccessible exits and are warned before the last accessible decision point when evidence permits.
- [ ] Offline routes use **Structurally step-free; live elevator status unavailable**.
- [ ] Positioning requires verified platform-relative geometry, route-direction orientation, and a verification date.
- [ ] Front and back reverse with direction; conflicts suppress both arrival row and positioning.
- [ ] Accessible positioning overrides a faster stair-based exit.
- [ ] Transfer likelihood uses the three-minute general and five-minute accessible defaults and never promises an uncertain connection.
- [ ] Positioning rolls out station by station without lowering the evidence bar.
- [ ] Subway car-level crowding is absent at launch and proxies are prohibited.
- [ ] Release gates enforce the relevant zero-tolerance safety and positioning targets.
- [ ] All suggested git commit messages are lowercase.
