# Accessible path-impact and reroute playbook

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§20.2–20.6, 21 case 6, 31.5, and 31.6 scenario 39; accessibility and platform-guidance plan `Product artifact map` and Task 5 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This playbook classifies one equipment or connection decision against one exact selected accessible journey and orders safe alternatives when that journey breaks. It consumes the [complete accessible-path contract](complete-path-contract.md), [path-edge review checklist](path-edge-review-checklist.md), [station-direction coverage register](station-direction-coverage-register.md), [Accessible Route Only state matrix](accessible-route-only-state-matrix.md), and [equipment status policy](equipment-status-policy.md). The companion [underway-warning state matrix](underway-warning-state-matrix.md) owns decision-point timing and warning persistence, and the [accessibility copy catalog](accessibility-copy-catalog.md) owns exact visible and assistive wording.

The accepted [Nearby/offline reconnection and invalidation-warning contract](../nearby-offline/offline-degraded-and-reconnection-states.md) controls preserved context and refresh order. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider certainty follows the [approved rider language rules](../contracts/rider-language-rules.md), and review follows the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains no real station, route, direction, entrance, platform, boarding area, street endpoint, path, equipment, outage, estimate, restoration, journey, rider position, alternative, rendered or spoken result, notification, reviewer decision, approval, or release evidence. The seven impact fixtures detailed here and the seven warning fixtures detailed in the companion matrix are all **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 5 does not pass Gate 0, approve any path or alternative, authorize a warning or notification, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) cites specification §§20.2–20.5 for this playbook. Task 5 additionally applies planned-work alternatives §20.6, accessibility case 6 in §21, accessibility scenarios §31.5, scenario 39 in §31.6, and the plan's full Task 5 provenance, as recorded above. Product Governance Lead reconciliation of the narrower index citation and this metadata is **Pending** before this artifact may advance from **Draft**. This task does not edit the index or treat the mismatch as approved.

## Exact selected-path input

Classify impact only after fixing one selected journey and the accepted Tasks 1–4 decisions that support it.

| Required input | Exact scope | Fail-closed condition |
|---|---|---|
| Selected path identity | One immutable candidate path version | Missing, mutable, merged, or reused identity |
| Origin | Exact street endpoint, entrance and corner, constituent, path edges, route, direction, platform, and boarding area | Complex badge, nearby entrance, partial chain, wrong direction, or Unknown required fact |
| Every transfer | Exact arrival platform, passage, level, required equipment, outgoing platform, boarding area, route, and direction in travel order | Omitted passage, inherited edge, wrong platform, non-step-free movement, or Unknown required fact |
| Destination | Exact alighting platform, egress chain, exit and corner, and intended street endpoint | Validation stops at the platform, another exit is substituted, or any required edge is adverse or Unknown |
| Structural decisions | Accepted atomic coverage row and complete ordered edge chain for every scope | Missing, stale-under-owner-rule, wrong-scope, unreviewed, partial, or contradictory evidence |
| Current equipment decisions | Exact official equipment identifier, Task 4 machine state, freshness, source precision, and applicable restoration or recheck sequence | Name, description, proximity, presence, empty response, or another machine supplies the decision |
| Current service decisions | Exact current route, direction, platform, boarding area, transfer, and exit relationships | Bypass, closure, reroute, wrong platform, unresolved service, or inherited ordinary-platform evidence |
| Rider preference | Accessible Route Only and applicable Avoid stairs state | A path break or alternative silently changes the preference |

Missing or Unknown required input never defaults to an unaffected or available state. Task 5 consumes accepted upstream decisions; it does not reconstruct station geometry, equipment state, route scope, or current availability from display copy.

## Station-detail equipment order and content

Station detail may show all known equipment for the exact complex. It prioritizes equipment required by the selected path without hiding unrelated known equipment.

| Presentation order | Required content for each machine | Evidence boundary |
|---:|---|---|
| 1. Selected-path machines in path order | Exact connection role and endpoints; official equipment identity; served constituent, routes and directions; exact ADA-path membership; accepted Task 4 current state; relative freshness; authoritative outage reason when supplied; authoritative estimated return when supplied | A displayed priority never proves availability or complete-path eligibility. |
| 2. First verified same-complex alternative-path machines in path order | Same fields, clearly scoped to the independently reviewed alternative | The original chain's evidence cannot fill the alternative. |
| 3. Other known equipment | Same machine-scoped fields available from accepted evidence; impact class **Unrelated** only after exact selected-path comparison | Equipment presence, proximity, shared station name, description, ordering, or complex badge cannot create path relevance. |
| 4. Official suggested alternative | Exact official text and scope when disclosed, followed by its independent accessibility decision | Official authorship cannot authorize accessibility. |

State, freshness, outage reason, and estimated return remain separate facts. An estimate is never a reopening countdown. **No official outage reported** remains a statement about accepted official outage evidence, not observed operation, Working, Available, or path accessibility.

## Mutually exclusive impact precedence

Apply the following order to the exact selected chain. Stop at the first class whose conditions pass.

### 1. Unrelated

Class **Unrelated** only when the exact official machine or connection is not required by the selected origin, any selected transfer, or the selected destination chain.

Required consequence:

- preserve the selected path and its current eligibility;
- retain the machine in station detail when otherwise eligible to display;
- keep its state scoped to its own official identity and connection; and
- do not widen the result to station, complex, line, direction, platform, or journey inaccessibility.

An adverse unrelated state never becomes route impact merely because the equipment shares a station, complex, name, level, route, direction, or equipment type with a selected-path machine.

### 2. Reroutable within station

Class **Reroutable within station** only when:

- the exact selected path requires the adverse or Unknown connection;
- the original selected chain is invalidated;
- another same-complex chain has a distinct immutable path identity;
- every origin, transfer, or destination scope required by that alternative independently passes;
- every alternative edge, official membership, direction, platform, boarding area, entrance, exit, and street endpoint passes;
- every route-critical machine decision is accepted and current under Task 4; and
- current service still uses the alternative's exact route, direction, and platform relationships.

The alternative is offered, not selected. The rider must explicitly choose it. Evidence from the failed chain cannot fill a missing or Unknown alternative fact.

### 3. Blocking

Class **Blocking** when the exact selected chain requires an adverse or Unknown connection and no complete, current, verified same-complex chain serves the same exact journey scope.

Required consequence:

- invalidate the complete selected route;
- preserve destination intent, Accessible Route Only, active-trip context, and manual progress;
- evaluate alternatives in the exact governed order below;
- warn under the companion state matrix; and
- never keep the broken path because its unaffected edges pass.

An eligible alternative in a later tier does not change the original impact from Blocking. It supplies a possible rider action after the original path has been invalidated.

## Unknown is fail-closed, not an outage claim

When a selected-path machine is **Unknown**, the path consequence uses the same alternate-chain test:

- a complete, current, verified same-complex chain yields **Reroutable within station**; otherwise
- the selected path is **Blocking**.

The machine evidence remains **Unknown**. Do not say it is out, failed, broken, unavailable as an observed machine fact, restored, Working, or Available. A warning may state that the selected step-free path cannot be verified right now. It cannot convert Unknown into a confirmed outage.

When a prior accepted adverse outage is being rechecked, preserve exact **Out of service—status being rechecked**. That is an adverse last-known state, not generic Unknown and not restoration.

## Elevator, escalator, and preference boundary

| Equipment relationship | Wheelchair-accessible routing consequence | Avoid stairs consequence |
|---|---|---|
| Selected wheelchair chain requires an elevator or another accepted wheelchair-accessible connection | Apply the exact impact precedence to that connection. | Apply only if the same connection is also part of the selected Avoid stairs path. |
| Escalator appears in the complex but is not required by the selected wheelchair chain | **Unrelated** to wheelchair routing. Never use it as an elevator substitute. | Apply impact only if the exact selected Avoid stairs path requires it. |
| Selected Avoid stairs path requires the escalator but a wheelchair chain does not | Preserve the wheelchair path; independently re-evaluate the Avoid stairs path. | Use the impact precedence for the Avoid stairs path only. |
| A purported wheelchair path depends on an escalator as its only step-free movement | Reject the purported wheelchair path under the complete-path contract. | Equipment presence cannot repair the invalid wheelchair chain. |

An equipment outage never makes the entire station or complex inaccessible unless the exact impact review establishes that no eligible path remains for the exact rider scope. Even then, state only the scoped journey consequence.

## Exact alternative order

After the selected path is invalidated, evaluate tiers in this exact order:

| Tier | Alternative | Admission requirement | Prohibited shortcut |
|---:|---|---|---|
| 1 | Another path within the same complex | Independently complete, current, and verified for the exact journey scope | Reuse the failed path's edges, accept partial redundancy, or auto-select it |
| 2 | Nearby verified accessible subway station | Supplied by the governed Nearby decision and independently complete, current, and verified | Invent a distance threshold, choose by station centroid, or infer accessibility from proximity |
| 3 | Verified subway detour | Independently complete, current, and verified; ride-past-and-return also requires every added ride, alighting platform, transfer, reversal, direction, boarding area, equipment edge, destination exit, and street endpoint | Borrow direct-path evidence, omit a reversal, or accept one Unknown added fact |
| 4 | Bus-inclusive alternative | Separate explicit rider choice and its own applicable complete-path and current-state review | Insert a bus leg, infer consent, or turn Accessible Route Only Off |

Only eligible candidates enter a tier. Show only the first verified alternative initially. If several candidates pass within the first eligible tier, apply the Task 3 lexicographic order only within that tier:

1. fewer single-point elevator dependencies;
2. fewer transfers;
3. shorter accessible walking distance;
4. lower disruption risk; and
5. travel time.

Do not compare a later tier against an earlier eligible tier by travel time, weighted score, convenience, proximity, or hidden override. A rider may inspect another offered option, but the product cannot present it as the governed first alternative.

## Official alternatives and rider selection

An official suggested alternative is a candidate input, not an accessibility decision.

| Official-alternative result | Treatment |
|---|---|
| Every complete-path and accepted current decision passes | Place it in its applicable tier and apply the same tier and ranking rules. |
| Any required result fails or is Unknown | Exclude it from Accessible Route Only results and show exact **Accessibility not confirmed** wherever it is disclosed. |
| Its route or platform scope conflicts with current service | Reject it; official text cannot override the current conflict. |
| It contains a bus leg without explicit rider choice | Keep it outside the subway result and preserve the explicit bus boundary. |

Selecting any alternative is an explicit rider action. The offer cannot silently replan, switch direction, change destination intent, select another entrance or exit, activate a contingency, advance manual progress, or enable bus.

If no verified alternative exists, keep Accessible Route Only On, preserve destination intent, and show exactly:

**No verified step-free subway route is available right now.**

## Restoration and reclassification

Task 4 acceptance that a prior outage no longer governs one exact official equipment identity begins review; it does not prove that the machine operates or restore the selected path.

1. Consume the accepted Task 4 result through its matching evidence branch:
   - **Explicit-report branch.** An accepted, coherent, **Current** official record explicitly reports restoration for the exact equipment identity. Only this branch may use A11Y-T5-07, **Restoration was reported for {exact equipment}.**
   - **Two-omission branch.** Two consecutive accepted, coherent, **Current** snapshots omit the prior outage, their authoritative timestamps are at least one authoritative minute apart, the surrounding population is coherent, and both join to the current reviewed inventory. Only this branch may use the evidence-neutral A11Y-T5-09, **The prior outage is no longer reported for {exact equipment}.** It must never use **Restoration was reported**.
2. Re-evaluate the exact machine's current decision without inferring observed operation, **Working**, or **Available**.
3. Re-evaluate every required structural edge, machine, route, direction, platform, boarding area, transfer, exit, and street endpoint for the selected or rider-selected replacement path.
4. Reclassify impact only from the complete fresh package.
5. Keep the existing warning and verified safe action through either evidence branch until the exact path passes or the rider explicitly selects a governed replacement that passes.

A planned end, estimate, elapsed time, one omission, non-empty target absence while a prior target outage awaits restoration, another machine's restoration, or generic **No official outage reported** never clears the path consequence.

## Impact decision record

Every impact decision retains:

- fixed product and Tasks 1–5 artifact versions;
- exact selected path identity and version;
- exact origin, transfer, destination, direction, platform, boarding-area, entrance, exit, and street-endpoint scope;
- every required path edge and exact official equipment identity;
- accepted structural, service, platform, and Task 4 machine decisions with freshness;
- the evaluated equipment or connection and exact path-membership result;
- alternate same-complex path identities and every independent pass, Fail, or Unknown decision;
- all four alternative-tier candidate decisions and the Task 3 within-tier ranking inputs;
- impact class, expected visible and assistive output, prohibited output, and explicit-selection result;
- actual visible and assistive result;
- reviewer, review date, durable evidence, correction, and rerun link; and
- warning-state handoff and Commute handoff when applicable.

Missing required fields make the decision unreviewable. Expected prose, a documentation commit, official alternative text, or a fixture setup is not actual evidence.

## Fixture summary

The detailed records for IMP-01 through IMP-07 appear below. IMP-08 through IMP-14 are detailed in the [underway-warning state matrix](underway-warning-state-matrix.md).

| ID | Case | Expected result | Current state |
|---|---|---|---|
| IMP-01 | Outage or Unknown equipment is unrelated to the selected exact path | Class **Unrelated**; selected path remains valid | **Not run — Pending** |
| IMP-02 | Required connection fails; independent complete Current same-complex chain exists | **Reroutable within station**; explicit rider selection required | **Not run — Pending** |
| IMP-03 | Required chained connection fails; no verified same-complex path exists | **Blocking**; entire selected route invalid | **Not run — Pending** |
| IMP-04 | Relevant escalator fails under Avoid stairs versus wheelchair mode | Affect only the governed preference and exact path; never substitute for elevator | **Not run — Pending** |
| IMP-05 | Eligible alternatives exist in all four tiers | Use exact tier order; Task 3 ranks only within a tier | **Not run — Pending** |
| IMP-06 | Official suggested alternative lacks complete review | Exclude it; show **Accessibility not confirmed** | **Not run — Pending** |
| IMP-07 | Ride-past-and-return fully verified versus one added edge Unknown | Eligible only in the fully verified branch | **Not run — Pending** |
| IMP-08 | Blocking outage appears before departure | Preserve intent; warn with exact impact and first verified action | **Not run — Pending** |
| IMP-09 | Blocking outage appears underway before known last decision point | Warn before the point; no inaccessible alighting | **Not run — Pending** |
| IMP-10 | Decision point cannot be established or may be passed | Warn immediately in preserved context; invent no location or point | **Not run — Pending** |
| IMP-11 | No safe verified alternative exists | Exact no-verified-route copy; no inaccessible or unverified direction | **Not run — Pending** |
| IMP-12 | Required equipment becomes Unknown | Same fail-closed path consequence; never call it an outage | **Not run — Pending** |
| IMP-13 | Task 4 accepts explicit-report or qualifying two-omission evidence for one machine | Use source-matched copy; re-evaluate the full path; the warning persists until all exact requirements pass | **Not run — Pending** |
| IMP-14 | Warning crosses lifecycle states and scenario-39 handoff | Warning persists; accessibility revalidation renders first; Commute owns push behavior | **Not run — Pending** |

## Detailed impact fixtures

### IMP-01 — unrelated equipment

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-01-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-01-A` requires `EQ-SYN-IMP-01-R`; evaluated `EQ-SYN-IMP-01-U` has no edge membership in that path |
| Path and current-owner decisions | Selected origin, transfers, destination, direction, platforms, boarding areas, exits, street endpoints, and `EQ-SYN-IMP-01-R` pass; `EQ-SYN-IMP-01-U` is accepted adverse or Unknown in a separate connection |
| Journey cursor and decision point | Not applicable to the classification; no position or progress is inferred |
| Expected visible result | Show class **Unrelated** for the evaluated equipment where station detail displays it; preserve the selected path and its exact scope. |
| Expected assistive result | Announce **Unrelated** with the evaluated connection's exact scope; do not announce selected-path or station-wide inaccessibility. |
| Prohibited visible and assistive result | Blocking, Reroutable within station, station inaccessible, route invalidation, warning, replan, or scope inherited by name or proximity |
| Warning and persistence result | No accessibility-path warning is created from this unrelated decision. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-02 — independently complete same-complex path

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-02-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-02-A` requires adverse `EQ-SYN-IMP-02-A`; alternate `PATH-SYN-IMP-02-B` requires independently decided `EQ-SYN-IMP-02-B` |
| Path and current-owner decisions | Original chain fails; every structural and current decision for the distinct same-complex alternate passes for the exact journey scope |
| Journey cursor and decision point | Fixed pre-choice context; no physical location inferred |
| Expected visible result | Show **Reroutable within station** and the exact cataloged same-complex alternative pattern for only `PATH-SYN-IMP-02-B`; require explicit selection. |
| Expected assistive result | Announce the same class, failed connection scope, selected-path consequence, and first verified same-complex action before unrelated detail. |
| Prohibited visible and assistive result | Keep the original chain valid, auto-select the alternate, reuse failed-chain evidence, show several alternatives initially, or imply Working |
| Warning and persistence result | Original-path consequence remains until the rider selects the verified alternate or accepted evidence makes the original full path pass. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-03 — required chain fails without same-complex path

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-03-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-03-A` requires adverse `EQ-SYN-IMP-03-A`; same-complex candidate `PATH-SYN-IMP-03-B` has one Unknown required edge `EQ-SYN-IMP-03-B` |
| Path and current-owner decisions | Original chain fails; no same-complex candidate has every structural and current Pass result |
| Journey cursor and decision point | Predeparture intent is fixed; no journey progress inferred |
| Expected visible result | Show **Blocking**, invalidate the complete selected route, then evaluate later tiers without presenting `PATH-SYN-IMP-03-B` as verified. |
| Expected assistive result | Announce the same blocking scope and selected-path consequence before any eligible later-tier action. |
| Prohibited visible and assistive result | Partial alternate, accessible station-wide claim, surviving original route, auto-replan, or unverified action |
| Warning and persistence result | Blocking state hands off to the warning matrix and persists under its lifecycle. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-04 — escalator preference boundary

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-04-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Wheelchair chain `PATH-SYN-IMP-04-W` requires elevator `EQ-SYN-IMP-04-E`; Avoid stairs chain `PATH-SYN-IMP-04-S` requires escalator `EQ-SYN-IMP-04-S` |
| Path and current-owner decisions | `EQ-SYN-IMP-04-S` is adverse; wheelchair chain otherwise passes and has no membership edge for that escalator; Avoid stairs chain requires it |
| Journey cursor and decision point | Fixed pre-choice context; no location inferred |
| Expected visible result | Preserve `PATH-SYN-IMP-04-W`; class the escalator **Unrelated** to that wheelchair chain and separately apply the impact precedence to `PATH-SYN-IMP-04-S`. |
| Expected assistive result | Convey the same preference-specific scope; do not announce wheelchair-path invalidation from the escalator alone. |
| Prohibited visible and assistive result | Escalator as elevator substitute, whole-complex inaccessibility, merged preferences, or wheelchair route invalidation without a required wheelchair connection |
| Warning and persistence result | Any warning is scoped only to the path and preference actually affected. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-05 — all four alternative tiers

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-05-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Broken `PATH-SYN-IMP-05-A` and machine `EQ-SYN-IMP-05-A`; eligible tier paths `PATH-SYN-IMP-05-T1A`, `PATH-SYN-IMP-05-T1B`, `PATH-SYN-IMP-05-T2`, `PATH-SYN-IMP-05-T3`, and bus-inclusive `PATH-SYN-IMP-05-T4` |
| Path and current-owner decisions | Every named tier candidate independently passes; Task 3 fixed ranking inputs place `PATH-SYN-IMP-05-T1B` first within tier 1 |
| Journey cursor and decision point | Fixed pre-choice context; no progress inference |
| Expected visible result | Initially show only `PATH-SYN-IMP-05-T1B`; the tier-1 category controls and Task 3 ranking operates only between tier-1 candidates. |
| Expected assistive result | Announce the same first verified tier-1 action and require explicit selection. |
| Prohibited visible and assistive result | Faster tier 2 or 3 first, bus insertion, weighted cross-tier comparison, multiple initial alternatives, or auto-selection |
| Warning and persistence result | The original path remains invalid until an explicit verified replacement is selected or the original full path passes. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-06 — unverified official alternative

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-06-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Broken `PATH-SYN-IMP-06-A` requires `EQ-SYN-IMP-06-A`; official alternative `PATH-SYN-IMP-06-OFFICIAL` has Unknown equipment edge `EQ-SYN-IMP-06-OFFICIAL` |
| Path and current-owner decisions | Official text exists; alternative complete-path review does not pass |
| Journey cursor and decision point | Fixed context; no location or reachability inferred |
| Expected visible result | Exclude the official alternative from Accessible Route Only and show exact **Accessibility not confirmed** where it is disclosed. |
| Expected assistive result | Announce exact **Accessibility not confirmed** with the same official-alternative scope. |
| Prohibited visible and assistive result | Promote, rank, direct the rider to use it, say Probably accessible, or borrow official authority as path evidence |
| Warning and persistence result | The official suggestion cannot resolve or clear the original warning. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-07 — ride-past-and-return branches

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-07-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Broken `PATH-SYN-IMP-07-A`; complete workaround `PATH-SYN-IMP-07-R1` with `EQ-SYN-IMP-07-R1`; control workaround `PATH-SYN-IMP-07-R2` with added Unknown edge `EQ-SYN-IMP-07-R2-U` |
| Path and current-owner decisions | Every added segment, platform, transfer, reversal, direction, boarding area, equipment edge, exit, and street endpoint passes for R1; exactly one added edge is Unknown for R2 |
| Journey cursor and decision point | Fixed pre-choice context; no rider position inferred |
| Expected visible result | Admit R1 to tier 3 and its within-tier ranking; reject R2 entirely. |
| Expected assistive result | Convey every added R1 movement and no verified status for R2; require explicit selection. |
| Prohibited visible and assistive result | Borrow direct-path evidence, omit the reversal, keep R2 because most edges pass, or auto-select R1 |
| Warning and persistence result | Neither candidate clears the original warning until the rider explicitly selects a fully passing replacement. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

## Ownership and downstream boundary

| Decision | Authoritative owner | Task 5 application |
|---|---|---|
| Structural path, atomic station-direction scope, and current path eligibility | Tasks 1–3 accessibility artifacts | Consume exact decisions; do not create coverage or relax Accessible Route Only. |
| Machine state, freshness, outage reason, estimate, recheck, and restoration | Task 4 equipment artifacts | Consume exact official-ID decisions; do not reinterpret copy or infer operation. |
| Impact class and exact four-tier alternative order | This playbook | Own deterministic classification and candidate order. |
| Decision point, warning priority, persistence, and reconnect behavior | Underway-warning state matrix consuming Nearby/offline | Handoff exact impact and alternatives; do not clear warnings here. |
| Exact accessibility warning copy | Accessibility copy catalog | Use cataloged text and evidence-backed fields only. |
| Nearby station candidate and proximity decision | Governed Nearby owner | Consume the supplied candidate; invent no distance threshold. |
| Push eligibility, commute-window relevance, permission, timing, threshold, deduplication, escalation, recovery notification, and pilot | Commute workstream | Supply only the scenario-39 accessibility-impact handoff; no push decision. |
| Release approval | Release governance | This Draft supplies no approval or observed evidence. |

## Review completion checklist

- [ ] One immutable exact selected path and all origin, transfer, destination, direction, platform, boarding-area, entrance, exit, and street scopes are fixed.
- [ ] Every status-to-path join uses the exact official equipment identifier.
- [ ] Station detail shows all known eligible equipment while prioritizing selected-path machines and preserving exact state, freshness, reason, estimate, and scope.
- [ ] **Unrelated**, **Reroutable within station**, and **Blocking** are mutually exclusive and applied in that exact precedence.
- [ ] Unknown has a fail-closed path consequence without becoming a confirmed outage.
- [ ] An unrelated elevator or escalator never creates complex-wide inaccessibility.
- [ ] Avoid stairs and wheelchair path effects remain separate.
- [ ] The four alternative tiers remain exact and only eligible candidates enter them.
- [ ] Task 3 ranking operates only within the first eligible tier.
- [ ] Only the first verified alternative is initially offered and every selection is explicit.
- [ ] Official alternatives receive the full independent accessibility review.
- [ ] Ride-past-and-return requires every added element to pass.
- [ ] Explicit-report restoration uses A11Y-T5-07; qualifying two-omission evidence uses A11Y-T5-09 and never says restoration was reported.
- [ ] Either one-machine evidence branch starts, but never replaces, fresh full-path reevaluation and never proves machine operation.
- [ ] IMP-01 through IMP-07 retain fixed-version, synthetic-identity, decision, cursor, expected, prohibited, warning, actual, review, evidence, correction, rerun, and status fields.
- [ ] All 14 Task 5 fixtures remain **Not run — Pending**.
- [ ] No real-world path, equipment, rider, warning, notification, approval, Gate 0 passage, or release evidence is claimed.

Every unchecked required item blocks review completion. A completed playbook still does not authorize public behavior until every mandatory reviewer approves the same fixed version and all blocking scenarios pass.
