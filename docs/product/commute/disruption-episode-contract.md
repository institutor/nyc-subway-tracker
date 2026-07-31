# Disruption episode contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 27, 28.2–28.3, 31.6 scenarios 36–39, 31.7–31.8, and 33.5; commute alerts and launch quality plan Task 6; accepted immutable Commute Tasks 2–5 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-deduplication-scenarios.md#pending-execution-record) |

## Purpose and authority

This contract separates source evidence, operational cause, normalized disruption, and commute-delivery identity so repeated or cross-source records cannot create duplicate subway notifications. It consumes the [notification eligibility contract](notification-eligibility-contract.md), [corrected relevance examples](disruption-relevance-examples.md), [delay threshold policy](delay-threshold-policy.md), [commute state matrix](../ux/commute-window-state-matrix.md), [notification timing policy](notification-timing-policy.md), and [recovery policy](recovery-notification-policy.md) without changing them.

These rules are **Draft product policy**, not an MTA guarantee. No real rider, live evidence, delivery, observation, reviewer approval, pilot, or launch evidence exists.

Two independent blockers remain in force:

- **NO-GO — GATE 0 NOT PASSED**
- **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED**

Task 6 waives, merges, and passes neither blocker. Public arrival boards and commute-alert release remain blocked.

## Product Governance reconciliation

The product artifact index has not been reconciled to the full Task 6 provenance or the required Privacy reviewer in addition to Product, Accessibility, Data Quality, Content, and Operations. Product Governance reconciliation remains **Pending**. This task does not edit the index or treat the mismatch as approval.

## Four separate identity layers

No layer may be substituted for another. Mutable rider impact and delivery state are not identity.

### 1. Source evidence identity

One immutable source observation records:

- source identifier, version, and source type;
- accepted authoritative timestamp and retrieval/wrapper timestamp separately;
- effective start and end;
- original structured scope;
- original text, including language and ordering; and
- currentness, coherence, anomaly, correction, and quarantine decisions.

Source evidence is input and audit history, **never** the operational-root, episode, or delivery-group key. A source-ID change, wrapper renewal, timestamp renewal, reordered fields, translation, or copy edit cannot create a new incident or message. Quarantined evidence remains preserved but cannot establish identity, impact, continuity, release, or recovery.

### 2. Operational incident root

An operational incident root represents one coherent cause or planned campaign. Cross-source records share a root only when either:

1. an accepted owner supplies an explicit incident/campaign linkage; or
2. an unambiguous match exists simultaneously on exact subway service, normalized direction, narrow supported segment, controlled impact, and overlapping or explicitly source-linked effective period.

Similar wording, the same route, severity language, a nearby timestamp, or temporal proximity alone is insufficient. Ambiguous correlation keeps records in separate provisional roots and makes the disputed merge **Hold for stronger evidence**. Independent causes keep independent roots even when they overlap the same route, station, or time.

### 3. Disruption episode

A disruption episode is the smallest stable normalized combination of:

- exact subway route or service, not a line-color family;
- normalized direction paired with its actual destination or terminal;
- narrowest supported ordered segment, constituent/access point, or accessibility-critical point;
- one controlled impact type;
- accepted effective-time lineage; and
- operational incident root.

Controlled impact types are exactly:

1. delay or gap;
2. bypass;
3. reroute;
4. short turn;
5. suspension;
6. constituent or station closure;
7. entrance or exit closure; and
8. blocking accessible-path loss.

Split a multi-route input into one episode per exact route/service. Split a both-direction input into one episode per normalized direction for delivery evaluation, while retaining the source’s supported both-direction scope in evidence history. Never use line color, route family, generic **Affected**, or source ID as episode identity.

Estimated end, current severity, added time, recommended action, wording, retrieval time, and freshness age are mutable state, not identity. Source-defined recurring planned work may retain one episode with distinct occurrence records. Otherwise, non-overlapping effective periods are not silently joined because no approved continuity tolerance exists. A newly confirmed bypass during a delay is a sibling episode under the same root, not a mutation of the delay episode.

### 4. Commute-impact delivery group

A delivery group is the stable rider-consequence ledger key:

- operational incident root;
- exact New York journey occurrence;
- normalized origin;
- every required transfer;
- normalized destination;
- normalized direction; and
- governed path requirement, including exact accessible-path version when material.

The stable group key excludes window ID, source ID, wording, current severity, estimated end, added-time value, and recommended action. Equivalent overlapping windows for the same journey occurrence share one group and one delivery ledger; all represented windows receive the successful-delivery marker. Editing, deleting, recreating, or renaming one window cannot erase that marker or authorize resend.

A distinct route, normalized direction, journey scope, occurrence, or accessibility requirement remains a distinct group and is independently eligible.

## Mutable impact fingerprint

Each group stores a versioned mutable fingerprint separately from identity:

| Fingerprint field | Exact content |
|---|---|
| Affected scope | Exact relevant origin, transfers, destination, other journey stations, constituents, access points, segment, and directions |
| Severity | Exact owner value and approved ordered scale identifier; missing or unordered values cannot prove increase |
| Action | First currently verified action or explicit no-verified-alternative result; never an unverified suggestion |
| Journey estimate | Current unrounded added-time estimate, units, basis, baseline version, and authoritative timestamp |
| Active period | Current accepted effective start/end and effective-period version |
| Evidence | Every represented accepted source evidence version and owner decision |
| Accessibility | Exact path/version, critical point, equipment/connection state, freshness, impact, and alternative decision |

The last successfully delivered fingerprint is the escalation baseline. Current fingerprints and unsuccessful candidate fingerprints never overwrite it.

## Cross-source linkage, splitting, merging, and quarantine

Apply this order:

1. preserve every source observation under its own evidence identity;
2. reject or quarantine owner-failed, anomalous, structurally contradictory, or text/structured-scope-conflicting evidence;
3. split accepted multi-route, multi-direction, multi-segment, and multi-impact inputs to the narrowest supported normalized candidates;
4. establish roots only through explicit linkage or the complete unambiguous match;
5. normalize one episode per root/service/direction/segment/type/time lineage;
6. join equivalent accepted evidence to that episode without duplicating the rider candidate; and
7. map episodes to delivery groups for exact journey occurrences and requirements.

Never merge first and repair later. A disputed merge is Hold, not a broad Send. A later accepted linkage is appended as a transformation; it does not erase the provisional roots, earlier decision, or evidence. A split likewise preserves the parent source and records every child episode. Correction is a transformation record, not an identity key or authority.

## Lifecycle and release continuity

The episode lifecycle is:

`Observed → Active/undelivered → Delivered → Escalated → Inactive-unverified or Released → Recovery delivered or silent close → Closed`

| State or transition | Required rule |
|---|---|
| Observed | Accepted evidence exists; eligibility, identity, or relevance may still be unresolved |
| Active/undelivered | Current normalized impact exists but no successful delivery baseline exists |
| Delivered | One initial message was successfully delivered for the group; write the delivery marker and fingerprint baseline only now |
| Escalated | One material change was successfully delivered; replace the baseline only with that successful escalation |
| Inactive-unverified | Evidence disappeared, ended, expired, recovered at feed level, or otherwise stopped appearing without complete owner release |
| Released | Every applicable owner supplies accepted release evidence for the exact episode/material impact |
| Recovery delivered | The Task 5 recovery gates Pass and one opted-in recovery is successfully delivered |
| Silent close | Release is verified but recovery is Off or ineligible |
| Closed | Append-only terminal history for that effective lineage; no new message may reuse it |

Alert disappearance, timestamp renewal, feed recovery, estimated-end expiry, correction, static GTFS, one equipment omission, or generic absence never proves release. Without verified release, disappearance and reappearance remain the same episode and cannot create a new initial push.

Verified release closes the episode. A later independently accepted effective interval becomes a new episode under the appropriate root; it never reopens the closed lineage. Preserve source observations, splits, merges, quarantines, corrections, fingerprints, candidate decisions, delivery attempts/results, baseline changes, release evidence, recovery, and reruns append-only.

## Equivalent updates

The following remain equivalent and cannot create another initial or escalation message:

- exact replay;
- retrieval, wrapper, or timestamp renewal;
- wording, punctuation, translation, order, or copy-only change;
- source-ID churn with unchanged normalized impact;
- the same operational fact arriving from alert and coherent live degradation;
- feed recovery without a new rider consequence;
- baseline-family switch without a supported material change;
- estimated-end movement below the exact in-window threshold;
- added journey time less than 300 seconds worse than the delivered baseline;
- the same verified action reworded;
- an unverified alternative change;
- an irrelevant station or direction edit;
- materially equivalent recurring planned work; and
- an equivalent overlapping window for the same journey occurrence.

Equivalent suppression remains permanent for the represented delivered state; the quiet period does not weaken it.

## Five escalation branches

Compare directly with the last successfully delivered fingerprint for the same delivery group. Never sum noisy deltas. Exactly one escalation candidate may Send when at least one branch Passes:

1. **Severity:** current severity is strictly higher on an approved ordered scale.
2. **Scope:** a newly affected relevant station or normalized direction appears.
3. **Action:** the current verified action changes, becomes invalid, or current review finds no verified alternative.
4. **Added time:** current unrounded journey estimate is at least 300 seconds worse.
5. **In-window extension:**
   `min(current active end, window end) − min(last-delivered active end, window end) ≥ 1800 seconds`.

At 299 seconds, added time does not qualify; exactly 300 and 301 qualify. At 1,799 seconds, extension does not qualify; exactly 1,800 and 1,801 qualify. Time wholly beyond the actual window contributes zero.

Several passing branches yield one escalation. A successfully delivered escalation replaces the baseline. Queued, held, failed, unseen, correction-only, wording-only, and suppressed candidates do not. Improvement or release follows recovery rules, never escalation.

## Cross-source truth precedence

| Evidence relationship | Required treatment |
|---|---|
| Current accepted negative evidence versus positive prediction | Negative evidence controls the affected stop/pattern claim |
| Service alert | May establish scoped adverse or explanatory impact; does not prove movement or a live served-stop call |
| Live trip evidence | May establish current behavior; cannot clear an accepted alert veto |
| Supplemented GTFS | May establish an accepted planned pattern; does not prove live movement |
| Static GTFS | Cannot create a current disruption, current movement, release, or recovery claim |
| Coherent alert plus live degradation | Normalize one candidate for one operational fact, not one per source |
| Contradictory structured scope and text | Quarantine; disputed identity/scope remains Hold unless other accepted evidence independently resolves it |
| Correction | Preserve as transformation only; it is neither positive truth nor recovery evidence |

A bypass veto can replace a pending, undelivered delay candidate with one accurate current message. After a delay has successfully delivered, a new bypass under the same root is a sibling episode and may support one group escalation only through a named material branch.

## Independent incidents, windows, and message representation

- Independent incidents retain distinct roots, episodes, evidence, lifecycle, and release state.
- One incident’s release or recovery never closes another.
- A single delivered message may mark several represented episodes only when an already-approved Task 5 pattern accurately expresses every impact without weakening scope, certainty, accessibility, or action.
- No approved multi-incident bundled copy exists; never invent it.
- Equivalent overlapping windows share one candidate and all receive its marker, matching corrected `REL-20`.
- Distinct route, direction, journey, occurrence, or accessible-path requirement remains independently eligible.

## Draft quiet-period proposal

Task 6 proposes `Q = 900` **authoritative seconds** per journey occurrence after each successfully delivered disruption or escalation. The interval is:

`[delivery time, delivery time + 900 seconds)`

- At elapsed 899 seconds, the interval is active.
- At exactly 900 seconds, it is expired and a fresh evaluation is eligible.
- At 901 seconds, a fresh evaluation is eligible.

This gate applies only to an unrelated, non-severe **initial** disruption. It never changes equivalent duplicate suppression, a same-group escalation, or opted-in recovery.

An independent impact may bypass quiet only when the aggregate journey passes one of the five named material branches or the impact is a current confirmed suspension, closure, bypass, short turn, or blocking accessible-path outage for the exact commute. Severe bypass is narrow: route, direction, journey, effective time, and consequence must all pass Tasks 2–5.

Quiet never queues old content. At expiry, rerun Tasks 2–5 using current evidence. Stale, ended, Offline, irrelevant, outside-window, or otherwise failed candidates Suppress; Unresolved candidates Hold.

The 900-second duration is a new, unapproved **Draft** choice requiring Product, Content, and Operations approval. It is not an MTA guarantee or measured service level.

## Recovery and correction constraints

Recovery links to the same incident, impact, occurrence, and prior successful delivery. It requires prospective `recovery_updates=On`, an actually delivered disruption, same episode/material impact, complete current owner release evidence, a meaningful remaining/upcoming decision change, permission/connectivity/currentness/relevance/final checks, and no unresolved adverse condition. Default is Off; permit at most one recovery per delivered impact.

Disappearance, effective end, correction, static data, one equipment omission, or generic **No official outage reported** never authorizes recovery.

A correction may narrow an unsupported claim or clarify supported scope. It cannot:

- create source truth, identity, material trigger, clearance, or recovery;
- erase history, a delivery marker, or a baseline;
- silently merge or split incidents;
- create a standalone correction or retraction push; or
- authorize positive wording.

When independent new evidence passes a named material branch, that evidence—not the correction—supports one escalation.

## Required append-only record

Every decision records:

1. fixed product/build and exact versions of Tasks 2–6 and every truth owner;
2. authoritative evaluation instant and all source evidence identities, original fields/text, effective periods, currentness, quarantine, corrections, and transformations;
3. operational-root linkage basis or explicit ambiguity;
4. episode key fields, controlled type, split/merge lineage, lifecycle, and release state;
5. occurrence and delivery-group key, represented windows, and path requirement;
6. current and last successfully delivered fingerprints;
7. all Task 2 gates, Task 3 decision, Task 4 lifecycle/permission/connectivity, Task 5 opportunity/final checks, cross-source precedence, quiet calculation, and recovery gates;
8. exactly one decision outcome, separate class/reason, delivery attempt/result, and baseline write/no-write;
9. expected and prohibited visible and assistive results; and
10. actual result, all six reviewer decisions/dates, durable evidence, correction, preserved original, rerun, and status.

## Privacy separation

Operational evidence audit records remain non-personal and separate from saved commutes, accounts, notification tokens, device identifiers, precise location, passive movement, guessed Home/Work, and rider history. Link to a delivery group with a bounded non-rider-facing reference; never copy operational source or episode IDs into rider-visible text.

Task 7 owns retention, reset, deletion assurance, notification-token lifecycle, and preference persistence. Task 6 invents no retention period, account sync, or deletion guarantee.

## Unresolved governance

- The 900-second quiet period is proposed and unapproved.
- No approved cross-source severity ordering exists.
- No canonical MTA incident or campaign correlation identifier exists.
- No non-overlap continuity tolerance is approved.
- No standalone correction or retraction message policy/template exists.
- No approved Seen definition exists; OS delivery is not proof of Seen.
- No multi-incident bundled copy is approved.
- Task 7 owns personal-data retention, reset, deletion, and preference persistence.

## Draft review checklist

- [ ] All four identity layers and their exclusions remain separate.
- [ ] Cross-source linkage is explicit or fully unambiguous; disputed merges Hold and quarantined evidence cannot participate.
- [ ] Multi-route/direction/impact inputs split to the narrowest episodes.
- [ ] Lifecycle, verified release, reappearance, and append-only history preserve continuity.
- [ ] Equivalent updates suppress; the five escalation branches use the last successful baseline and exact boundaries.
- [ ] Cross-source truth precedence never clears a negative veto with prediction or static data.
- [ ] Independent incidents/windows and message representation preserve exact scope.
- [ ] Quiet uses authoritative `[delivery,delivery+900)` behavior and only the narrow severe bypass.
- [ ] Recovery and corrections cannot manufacture positive evidence or messages.
- [ ] Operational and personal records stay separate.
- [ ] All fixtures, reviewers, evidence, approvals, and launch state remain **Not run — Pending** or **Pending**.

Every unchecked item blocks approval. Definitions are not evidence.
