# Underway accessibility-warning state matrix

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

This matrix defines when an exact-path accessibility warning appears, how the last accessible decision point is derived, what context the warning preserves, and the only transitions that can replace or resolve it. It consumes impact and alternative decisions from the [accessible path-impact and reroute playbook](path-impact-and-reroute-playbook.md), path validity from the [complete accessible-path contract](complete-path-contract.md) and [Accessible Route Only state matrix](accessible-route-only-state-matrix.md), machine truth from the [equipment status policy](equipment-status-policy.md), and exact rider wording from the [accessibility copy catalog](accessibility-copy-catalog.md).

The accepted [Nearby/offline reconnection and active-trip invalidation contract](../nearby-offline/offline-degraded-and-reconnection-states.md) controls preserved screen context, manual progress, warning persistence, and the five-stage reconnect order. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider certainty follows the [approved rider language rules](../contracts/rider-language-rules.md), and review follows the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains no real journey, station, entrance, route, direction, platform, boarding area, exit, street endpoint, decision point, rider position, manual progress, path, equipment, outage, Unknown state, restoration, alternative, rendered or spoken warning, push, reviewer decision, approval, or release evidence. The seven warning fixtures detailed here and the seven impact fixtures in the companion playbook are all **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 5 does not pass Gate 0, approve an underway warning or notification, prove a decision point, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) cites specification §§20.5 and 31.5 for this matrix. Task 5 also applies path relevance, impact classification, and rerouting §§20.2–20.4; planned-work alternatives §20.6; accessibility case 6 in §21; scenario 39 in §31.6; and the plan's full Task 5 provenance, as recorded above. Product Governance Lead reconciliation of the narrower index citation and this metadata is **Pending** before this artifact may advance from **Draft**. This task does not edit the index or treat the mismatch as approved.

## Fixed journey and warning inputs

Do not calculate or present a warning until the following inputs are fixed or deliberately fail closed:

| Input | Required record | Safety boundary |
|---|---|---|
| Active journey | Immutable selected path identity and origin-to-destination intent | A viewed route, saved station, or previous journey is not active-trip evidence. |
| Selected exact path | Every origin, transfer, destination, entrance, direction, platform, boarding area, exit, street endpoint, edge, and route-critical machine | A summary, complex badge, or partial chain cannot define the affected path. |
| Accepted change | Exact owner decision, official equipment identity, state, freshness, connection, and time scope | Copy, estimate, planned end, raw alert, or equipment presence cannot create the change. |
| Impact | One accepted **Unrelated**, **Reroutable within station**, or **Blocking** decision | This matrix does not reclassify the impact. |
| Alternative | The first complete, current, verified alternative from the exact four-tier order, or an accepted no-alternative result | An official or nearby suggestion is not verified merely because it exists. |
| Journey cursor | Rider-confirmed manual current stop or decision context, with its own unchanged time and scope | It is rider input, not physical location, train progress, platform presence, or transfer completion. |
| Decision-point inventory | Ordered verified choices and their required path relationships from the fixed journey | Device location, elapsed time, or a schedule cannot fill a missing point. |
| Presentation context | Selected journey, Accessible Route Only state, manual cursor, warning, reading position, focus, and accepted last-checked times | A warning cannot reset, advance, or silently replace this context. |

Missing or ambiguous position evidence never becomes an inferred rider position. The product can know that a warning is urgent without claiming where the rider is.

## Last accessible decision point

The last accessible decision point is:

> The latest still-reachable verified point before the affected choice where at least one safe verified action remains.

Derive it in this order:

1. Freeze the selected journey and its complete ordered path.
2. Read the rider-confirmed manual cursor without treating it as physical-location or train-progress evidence.
3. Identify the first affected future connection or choice on that fixed path.
4. Enumerate, in journey order, only owner-verified decision points at or after the confirmed cursor and before the affected choice.
5. For each point, require at least one safe action whose full path and current decisions pass and whose use does not require inaccessible, Unknown, wrong-direction, wrong-platform, or unverified alighting.
6. Select the latest point that remains demonstrably reachable from the confirmed context.
7. Record the point identity, evidence, first verified action, and warning deadline before the rider can pass the point.

If any required relationship is missing, the cursor cannot establish reachability, or the point may already have passed, classify the decision point as **Unknown** and warn immediately in the preserved journey context. Do not invent rider position, platform, train, reachable station, decision point, or safe action.

## Warning admission and priority

| Accepted result | Warning outcome | Required priority |
|---|---|---|
| **Unrelated** equipment or connection | No selected-path warning | Preserve the path; station detail may retain the scoped equipment state. |
| **Reroutable within station** before departure | Present the exact failed or Unknown connection, selected-path consequence, and first verified same-complex action | Warning and action precede unrelated equipment and route detail. |
| **Reroutable within station** while underway | Present before the known last accessible decision point; require explicit selection | Warning is first visually and in assistive reading order. |
| **Blocking** before departure | Invalidate the selected path and present the first verified alternative or exact no-route result | Do not let arrivals, convenience, or a faster invalid path overtake it. |
| **Blocking** while underway with known point | Warn before the point when current accepted evidence permits | Never instruct inaccessible or unverified alighting. |
| **Blocking** or route-critical **Unknown** with decision point Unknown or possibly passed | Warn immediately in preserved context | Do not delay for location, lower-priority refresh, or a guessed point. |
| Task 4 accepts explicit-report or qualifying two-omission evidence for one machine | Keep the current warning while full-path reevaluation runs; use the matching A11Y-T5-07 or A11Y-T5-09 pattern | Neither branch may visually or assistively imply machine operation or path resolution. |
| Fresh full-path reevaluation passes | Resolve through a recorded owner transition or offer the passing replacement for explicit rider selection | Never silently remove the warning. |

The accessibility warning, safe action, and their assistive equivalent appear before lower-priority refreshed content. Color, icon, tone, animation, placement, or haptics cannot carry the impact, urgency, or action alone.

## Warning content contract

Every warning contains:

1. the exact accepted fact or change and its owning evidence state;
2. the exact connection and affected origin, transfer, destination, entrance, passage, direction, platform, boarding area, exit, street endpoint, or other journey scope;
3. the concrete consequence for the selected path;
4. the last accessible decision point when it is known, or the exact immediate-warning treatment when it is Unknown;
5. relative freshness under the owning Task 4 policy;
6. the first verified alternative or safe action from the governed order; or
7. the exact no-verified-route result when no safe verified alternative exists.

Visible and assistive output use the same accepted state, scope, certainty, order, and action. A warning cannot:

- call Unknown an outage;
- call one restored machine a restored path;
- widen one connection to whole-station or whole-complex inaccessibility;
- direct an inaccessible, wrong-direction, wrong-platform, or unverified exit or alighting;
- expose a later-tier action ahead of an earlier eligible tier;
- auto-select an alternative or contingency;
- change destination intent or Accessible Route Only;
- advance the manual cursor or claim physical location; or
- replace an unavailable verified action with an unverified official suggestion.

The approved named-station sentence in the copy catalog is an example pattern only. It is not evidence that its named connection is out or that its named alternative is verified.

## Warning state and transitions

| State | Entry condition | Required presentation | Permitted exit |
|---|---|---|---|
| **No selected-path warning** | No accepted invalidation applies | Preserve the active journey. | Accepted Reroutable, Blocking, or route-critical Unknown consequence |
| **Predeparture action required** | Selected path is invalid before departure | Exact impact, connection, path consequence, first verified action or exact no-route result | Explicit governed replacement, or accepted full-path resolution |
| **Underway — warn before known point** | Selected path is invalid; point and deadline are verified and still reachable | Exact warning before the point, with first verified safe action | Explicit governed replacement, or accepted full-path resolution |
| **Underway — immediate warning** | Point is Unknown or may already have passed | Immediate exact warning in preserved context; no position inference | Explicit governed replacement, or accepted full-path resolution |
| **Offline preserved warning** | Connectivity becomes Offline while a warning is active | Preserve the last coherent warning, original exact scope, and original last-checked time as stale context | Reconnect begins stage-1 revalidation; Offline itself cannot resolve |
| **Revalidating exact path** | Reconnect or either accepted Task 4 restoration-evidence branch starts full-path review | Keep the prior warning and use source-matched restoration-recheck copy; accessibility and equipment result appears before lower-priority change | Explicit governed replacement, or accepted full-path resolution |
| **Resolved or replaced** | Exact original path fully passes, or rider explicitly selects a complete verified replacement | Record the governing transition and replace or close the warning without erasing history | A later accepted invalidation starts a new scoped warning decision |

Acknowledgement and dismissal are presentation actions, not exit conditions.

## Persistence contract

A **Blocking** or route-critical **Unknown** warning remains active until either:

- the rider explicitly selects a governed verified action that resolves or replaces the affected decision; or
- accepted owner evidence resolves the exact invalidation and a fresh full-path reevaluation passes every required edge and scope.

A **Reroutable within station** warning follows the same persistence while the broken original path remains selected. The existence or display of a verified alternate chain does not resolve the warning; only explicit selection of a still-passing replacement or accepted full-path resolution does.

The following never clear it:

- acknowledgement or dismissal;
- elapsed time;
- navigation, backgrounding, or foregrounding;
- Offline entry or reconnect;
- manual-progress change;
- lower-priority recovery;
- unrelated refresh or another saved item's update;
- a planned end time or estimated return;
- one missing outage record;
- **No official outage reported** for another machine;
- restoration of one machine without a complete passing path; or
- copy, focus, reading-position, or screen changes.

The warning preserves the selected journey, destination intent, Accessible Route Only state, manual cursor, focus relationship, reading position, accepted evidence scope, and each claim's original last-checked time. Manual progress may change only through the rider's explicit cursor control and cannot clear or create operational truth.

## Offline and reconnect order

Offline entry preserves the last coherent warning as stale context. It does not:

- keep a former current machine or path claim current;
- newly trigger or reactivate a connected warning cause;
- produce a fresh alternative;
- infer restoration from missing data;
- reset the warning or manual cursor; or
- claim that the rider has reached or passed a point.

On reconnect:

1. Stage 1 revalidates route-critical equipment and the complete accessible path.
2. Any resulting **Blocking** or route-critical **Unknown** warning is rendered before stage 2 service changes, stage 3 arrivals, stage 4 guidance, stage 5 background content, or unrelated updates.
3. A request completing is not acceptance; the owning rule must supply an accepted result or fail-closed state.
4. Either Task 4 restoration-evidence branch starts fresh full-path review, uses its source-matched copy, and clears nothing by itself.
5. Focus and assistive reading order remain on the accessibility warning and safe action before lower-priority recovered content.

No reconnect timeout, retry count, or lower-priority freshness result is authority to relax this order.

## Explicit action and resolution

An offered alternative remains separate from the selected journey until the rider explicitly chooses it. On choice:

1. bind the independently reviewed path identity and exact journey scope;
2. preserve Accessible Route Only and destination intent;
3. record the explicit action;
4. recheck every required current decision at selection time; and
5. replace the warning only when the new selected path passes.

If the action no longer passes, keep the warning and re-evaluate the alternative order. Do not fall through silently to another alternative or bus.

When accepted owner evidence resolves the original invalidation, re-evaluate the whole original path. A qualifying machine restoration, non-empty target absence, confirmed global-empty sequence, or another machine's state is never a complete-path pass by itself.

## Scenario-39 Commute handoff

Task 5 owns only the in-app exact-path consequence, underway warning state, and accessibility-impact handoff.

The handoff may contain:

- fixed selected commute path identity and exact affected path role;
- exact accepted equipment identity, state, freshness, and connection;
- **Blocking**, **Reroutable within station**, or **Unrelated** impact;
- exact origin, transfer, destination, direction, platform, entrance, exit, and time scope;
- first verified alternative identity and evidence decision, or accepted no-alternative result; and
- the Task 5 warning-state and decision-point result.

The Commute workstream separately owns push eligibility, commute-window relevance, notification permission, timing, persistence thresholds, deduplication, escalation, recovery notification, delivery, and pilot authorization. This handoff does not mean a push was eligible, created, sent, delivered, announced, reviewed, or approved.

## Warning fixture summary

IMP-01 through IMP-07 are detailed in the [path-impact and reroute playbook](path-impact-and-reroute-playbook.md).

| ID | Case | Expected result | Current state |
|---|---|---|---|
| IMP-08 | Blocking outage appears before departure | Preserve intent; warn with exact impact and first verified action | **Not run — Pending** |
| IMP-09 | Blocking outage appears underway before known last decision point | Warn before the point; no inaccessible alighting | **Not run — Pending** |
| IMP-10 | Decision point cannot be established or may be passed | Warn immediately in preserved context; invent no location or point | **Not run — Pending** |
| IMP-11 | No safe verified alternative exists | Exact no-verified-route copy; no inaccessible or unverified direction | **Not run — Pending** |
| IMP-12 | Required equipment becomes Unknown | Same fail-closed path consequence; never call it an outage | **Not run — Pending** |
| IMP-13 | Task 4 accepts explicit-report or qualifying two-omission evidence for one machine | Use source-matched copy; re-evaluate the full path; the warning persists until all exact requirements pass | **Not run — Pending** |
| IMP-14 | Warning crosses lifecycle states and scenario-39 handoff | Warning persists; accessibility revalidation renders first; Commute owns push behavior | **Not run — Pending** |

## Detailed warning fixtures

### IMP-08 — blocking before departure

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-08-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-08-A` requires accepted adverse `EQ-SYN-IMP-08-A`; first verified action uses `PATH-SYN-IMP-08-B` and `EQ-SYN-IMP-08-B` |
| Path and current-owner decisions | Original path is **Blocking**; replacement independently passes in the first eligible alternative tier |
| Journey cursor and decision point | Before departure; synthetic cursor `CURSOR-SYN-IMP-08-ORIGIN`; no boarding or physical location inferred |
| Expected visible result | Present **Blocking**, exact connection and selected-path consequence, freshness, and only the first verified action before departure. |
| Expected assistive result | Announce the same impact, exact scope, freshness, consequence, and action before unrelated content. |
| Prohibited visible and assistive result | Silent replan, automatic selection, inaccessible direction, multiple first actions, hidden warning, or station-wide claim |
| Warning and persistence result | Preserve destination, Accessible Route Only, cursor, and warning until explicit replacement or accepted full-path resolution. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-09 — underway before known point

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-09-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-09-A` requires adverse `EQ-SYN-IMP-09-A`; verified safe action uses `PATH-SYN-IMP-09-B` |
| Path and current-owner decisions | Original path is **Blocking**; safe action and every required current decision pass |
| Journey cursor and decision point | Rider-confirmed `CURSOR-SYN-IMP-09-CURRENT`; verified last accessible decision point `POINT-SYN-IMP-09-LAST` is still reachable before the affected connection |
| Expected visible result | Present the warning before `POINT-SYN-IMP-09-LAST`, name the point and exact affected connection, and show only the first verified action. |
| Expected assistive result | Announce the warning and action before focus can move to lower-priority content. |
| Prohibited visible and assistive result | Warning after the point, direction to alight at an inaccessible or unverified station, inferred rider location, automatic progress, or silent replan |
| Warning and persistence result | Warning persists through acknowledgement and navigation until explicit verified replacement or full-path resolution. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-10 — decision point Unknown or possibly passed

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-10-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-10-A` requires adverse `EQ-SYN-IMP-10-A`; first verified safe action, when present, is `PATH-SYN-IMP-10-B` |
| Path and current-owner decisions | Selected path is invalid; accepted evidence cannot establish reachability of any last decision point |
| Journey cursor and decision point | Manual cursor `CURSOR-SYN-IMP-10-STALE`; decision point **Unknown** and may already have passed |
| Expected visible result | Warn immediately with the exact cataloged Unknown-decision-point pattern, connection, consequence, freshness, and verified action when one exists. |
| Expected assistive result | Announce the same immediate warning before unrelated changes; do not announce a guessed point or position. |
| Prohibited visible and assistive result | Delay for location, invented platform or train, fabricated reachable station, impossible alighting, or statement that the point was definitely passed |
| Warning and persistence result | Preserve journey and cursor; warning persists under the full lifecycle. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-11 — no verified safe alternative

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-11-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-11-A` requires adverse `EQ-SYN-IMP-11-A`; candidates `PATH-SYN-IMP-11-T1` through `PATH-SYN-IMP-11-T4` each fail or are Unknown |
| Path and current-owner decisions | Original path is **Blocking**; no eligible candidate remains in any tier and no bus choice exists |
| Journey cursor and decision point | Preserved `CURSOR-SYN-IMP-11-CURRENT`; point known or Unknown branch does not change no-alternative truth |
| Expected visible result | Show exact connection and path consequence, then exact **No verified step-free subway route is available right now.** Preserve destination intent. |
| Expected assistive result | Announce the same warning and exact no-route message; announce no inaccessible or unverified action. |
| Prohibited visible and assistive result | Guess, official unverified option, stair-based route, inaccessible exit, automatic bus, error, or Accessible Route Only Off |
| Warning and persistence result | Warning and no-route truth persist until explicit verified replacement or accepted full-path resolution. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-12 — required equipment becomes Unknown

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-12-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-12-A` requires route-critical `EQ-SYN-IMP-12-A`; first verified alternative, when present, is `PATH-SYN-IMP-12-B` |
| Path and current-owner decisions | Task 4 exact machine state becomes **Unknown**; original path cannot pass; same-complex alternate test fixes **Reroutable within station** or **Blocking** consequence |
| Journey cursor and decision point | Fixed predeparture or underway synthetic cursor; point derived independently from machine state |
| Expected visible result | Use the exact Unknown-warning pattern: current status is **Unknown**, the selected path cannot be verified, and only a verified action may appear. |
| Expected assistive result | Announce identical state, connection, consequence, freshness, and action. |
| Prohibited visible and assistive result | Out, failed, broken, restored, Working, Available, confirmed outage, or optimistic retention of the selected path |
| Warning and persistence result | Warning persists through recovery attempts; a later positive-looking response must pass Task 4 and fresh full-path review. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-13 — accepted one-machine evidence has two source branches

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-13-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-13-A` requires exact `EQ-SYN-IMP-13-A` plus required `EQ-SYN-IMP-13-B` and all other exact path edges |
| Path and current-owner decisions | Evidence branch E: Task 4 accepts a coherent **Current** official record that explicitly reports restoration for `EQ-SYN-IMP-13-A`. Evidence branch O: Task 4 accepts two consecutive coherent **Current** snapshots that omit its prior outage, are at least one authoritative minute apart, have coherent surrounding population, and join to current reviewed inventory. For each evidence branch, path-control branch 1 leaves another required result adverse or Unknown; path-control branch 2 makes every complete-path result pass. |
| Journey cursor and decision point | Preserved `CURSOR-SYN-IMP-13-CURRENT`; neither accepted evidence branch advances it |
| Expected visible result | Evidence branch E uses exact A11Y-T5-07. Evidence branch O uses exact evidence-neutral A11Y-T5-09. Both retain the warning and current verified safe action during review. Path-control branch 1 keeps the warning; path-control branch 2 resolves only through a recorded fresh full-path transition. |
| Expected assistive result | Use the same source-matched pattern, exact equipment scope, continuing complete-path recheck, and current verified safe action as the visible result; never announce machine operation or path restoration. |
| Prohibited visible and assistive result | A11Y-T5-07 or **Restoration was reported** for evidence branch O; machine operational, Working, Available, all elevators restored, path restored, Accessible now before a full pass, silent clear, planned-end inference, one-omission acceptance, or another machine's state |
| Warning and persistence result | The exact warning persists under either evidence branch until path-control branch 2 full-path acceptance or explicit verified replacement. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### IMP-14 — lifecycle persistence, reconnect, and Commute handoff

| Record field | Pending fixture record |
|---|---|
| Fixture and product version | `IMP-14-v1`; **Pending — no fixed reviewed product version bound** |
| Tasks 1–5 artifact versions | **Pending — no immutable contract, register, matrix, policy, playbook, warning matrix, or catalog versions bound** |
| Synthetic path and machine identities | Selected `PATH-SYN-IMP-14-A` requires adverse or Unknown `EQ-SYN-IMP-14-A`; verified action when present is `PATH-SYN-IMP-14-B` |
| Path and current-owner decisions | Fixed **Blocking** or route-critical Unknown warning; no resolving full-path decision arrives during acknowledgement, navigation, Offline, reconnect, manual progress, or unrelated refresh |
| Journey cursor and decision point | `CURSOR-SYN-IMP-14-CURRENT` changes only through an explicit manual action; `POINT-SYN-IMP-14-LAST` remains independently owned |
| Expected visible result | Warning survives acknowledgement, dismissal, navigation, foregrounding, Offline, reconnect, cursor change, and unrelated refresh; stage-1 accessibility result renders before lower-priority changes. |
| Expected assistive result | Warning and safe action retain first reading priority across the same transitions. |
| Prohibited visible and assistive result | Silent clear, refreshed timestamp from navigation, reset progress, new warning caused only by Offline, lower-priority overtake, inferred push, or claimed notification delivery |
| Warning and persistence result | Preserve until explicit verified replacement or accepted full-path resolution. Produce only the scoped scenario-39 accessibility-impact handoff. |
| Actual visible and assistive result | **Not observed / Not observed** |
| Reviewers and review date | **Product, Accessibility, Data Quality, Content, Operations / Not recorded** |
| Durable evidence | **None** |
| Correction and rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

## Ownership and downstream boundary

| Decision | Authoritative owner | Warning-matrix boundary |
|---|---|---|
| Selected complete path and Accessible Route Only | Tasks 1–3 accessibility artifacts | Consume exact path and persistent preference; do not relax or recalculate. |
| Machine state, freshness, recheck, and restoration | Task 4 equipment artifacts | Consume accepted exact-machine state; do not call Unknown an outage or one restoration a path pass. |
| Impact class and alternative order | Path-impact and reroute playbook | Consume one fixed class and first verified action. |
| Preserved context, manual cursor, Offline, and reconnect order | Nearby/offline contracts | Apply exactly; do not create a second lifecycle. |
| Decision point, warning priority, persistence, and governed resolution | This matrix | Own deterministic underway behavior. |
| Exact warning wording | Accessibility copy catalog | Use identical visible and assistive patterns with accepted fields. |
| Commute push behavior | Commute workstream | Handoff impact only; push behavior remains Pending. |
| Release approval | Release governance | This Draft supplies no approval or observed evidence. |

## Review completion checklist

- [ ] Every warning binds one immutable active journey, selected path, accepted change, impact, alternative result, cursor, and decision-point inventory.
- [ ] The last accessible decision point is the latest still-reachable verified point before the affected choice with a safe verified action.
- [ ] Unknown or possibly passed decision points warn immediately without position inference.
- [ ] No warning instructs inaccessible, Unknown, wrong-direction, wrong-platform, or unverified alighting.
- [ ] Every warning answers what changed, which exact journey part is affected, and what the rider can safely do.
- [ ] Accessibility action is first visually and in assistive reading order without color-only meaning.
- [ ] Destination intent, Accessible Route Only, active journey, manual cursor, focus, and reading position remain preserved.
- [ ] Acknowledgement, dismissal, time, navigation, foregrounding, Offline, reconnect, cursor change, lower-priority recovery, unrelated refresh, estimate, or one-machine restoration cannot clear a warning.
- [ ] Offline preserves stale context and creates no current state, alternative, or resolution.
- [ ] Reconnect stage 1 and any resulting warning precede every lower-priority update.
- [ ] Alternative selection is explicit and rechecked at selection time.
- [ ] Explicit-report evidence uses A11Y-T5-07; qualifying two-omission evidence uses A11Y-T5-09 and never says restoration was reported.
- [ ] Full-path reevaluation, not machine restoration alone, controls owner resolution.
- [ ] Scenario-39 handoff contains accessibility impact only and claims no push decision or delivery.
- [ ] IMP-08 through IMP-14 retain fixed-version, synthetic-identity, decision, cursor, expected, prohibited, warning, actual, review, evidence, correction, rerun, and status fields.
- [ ] All 14 Task 5 fixtures remain **Not run — Pending**.
- [ ] No real-world rider, decision point, path, equipment, warning, notification, approval, Gate 0 passage, or release evidence is claimed.

Every unchecked required item blocks review completion. A completed matrix still does not authorize public warnings or notifications until every mandatory reviewer approves the same fixed version and all blocking scenarios pass.
