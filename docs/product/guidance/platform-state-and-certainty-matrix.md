# Platform state and positioning certainty matrix

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§23.3–23.4; applying approved specification §§29.4, 31.6 scenarios 33–34, and 33.1–33.2; accessibility and platform-guidance plan `Product artifact map` and Task 7 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This matrix owns two independent decisions for an admitted arrival:

1. **platform state** — **Platform confirmed**, **Expected platform**, or **Check station signs**; and
2. **positioning certainty** — **Verified**, **Expected**, or **Unavailable**.

It also owns the hard boundary that keeps a nonterminal actual-versus-scheduled-track conflict outside the normal matrix. It does not admit an arrival, resolve a service change, create platform geometry, approve an accessible path, define rider objectives or benefit wording, establish station coverage, or authorize Release 2.

The [platform guidance evidence standard](platform-evidence-standard.md) owns atomic editorial records and geometry. The [arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md), [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md), [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md), [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md), and [provenance, quarantine, and correction policy](../arrival-truth/provenance-quarantine-and-correction-policy.md) retain their narrower truth boundaries. The [source evidence register](../arrival-truth/source-evidence-register.md) retains official source and currency registration.

Accessibility remains governed by the [complete accessible-path contract](../accessibility/complete-path-contract.md), [station-direction accessibility coverage register](../accessibility/station-direction-coverage-register.md), [station-direction accessibility review guide](../accessibility/station-direction-review-guide.md), and [Accessible Route Only state matrix](../accessibility/accessible-route-only-state-matrix.md). The [Nearby card and direction contract](../nearby-offline/nearby-card-and-direction-contract.md) and [station board and controls contract](../nearby-offline/station-board-and-controls-contract.md) consume only the supplied state, certainty, suppression, and omission. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and all review follows the [product artifact review and approval policy](../review-and-approval-policy.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. Platform guidance, geometry, actual-track coverage, working-product behavior, visible and assistive presentation, and approval evidence are not demonstrated. Every fixture below is synthetic and **Not run — Pending**.

The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

The arrival-truth Gate 0, Nearby/offline, accessibility, and platform-guidance gates remain independent. No platform or positioning result passes, merges, overrides, or waives another gate.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§23.3–23.4, 29.4, 31.6 scenarios 33–34, and 33.1–33.2, full Task 7 provenance, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every platform-state fixture, reviewer decision, and lifecycle advancement remains **Pending**.

## The axes are independent

Platform state answers **which platform is supported now**. Positioning certainty answers **how strongly the exact direction/platform/zone/objective relationship is supported**. Neither axis is a proxy for the other.

- **Platform confirmed** alone does not authorize positioning.
- **Verified** positioning requires more than a stable platform assignment.
- A complete editorial record does not confirm a live platform.
- A normal or scheduled platform never becomes confirmed through stability of the schedule.
- **Unavailable** positioning normally produces omission, not a lower-quality zone guess.
- No numeric confidence score is calculated, stored as the decision, displayed, spoken, or used to average conflicting evidence.

## Positioning certainty

| Positioning certainty | Required evidence | Visible and assistive consequence | Prohibited inference |
|---|---|---|---|
| **Verified** | The affected arrival passes every upstream admission gate; its exact platform is **Platform confirmed**; and the exact direction, platform, service-pattern variation, orientation, stopping relationship, zone, rider objective, and useful physical relationship are current, field-checked, and approved in one atomic record. | Task 8 may present the supported Front/Middle/Back relationship with Verified treatment and equivalent assistive meaning. Task 7 itself supplies no benefit wording. | A stable actual track, a station visit without durable evidence, a complete static record, or a normal platform cannot independently create Verified. |
| **Expected** | A complete, current static guidance record supports the exact normal or scheduled direction, service-pattern variation, platform orientation, stopping relationship, zone, rider objective, and physical relationship. No current evidence conflicts. The platform may be **Expected platform**, or may be **Platform confirmed** while the editorial relationship remains static rather than current field-checked. | Task 8 may use clearly Expected treatment such as its later approved “usually” wording. Assistive presentation must convey the same qualification. | Schedule stability, repeated schedule retrieval, or a long-lived normal pattern can never become Verified. |
| **Unavailable** | Any required platform, direction, reroute, service-pattern, consist orientation, stopping relationship, geometry, zone, objective, field evidence, verification date, source package, reviewer decision, or accessible relationship is missing, stale-under-owner-rule, conflicting, inherited, or unreviewed; or the platform state is **Check station signs**. | Show no Front/Middle/Back positioning claim visibly or through assistive technology. Preserve independently valid arrival and platform context. | Do not show a guessed zone, car number, numeric confidence, inherited guidance, icon-only hint, or spoken recommendation. |

Task 7 authorizes no car-number precision. **Verified** means the Front/Middle/Back relationship passes; it does not pre-approve a train car, consist length, car order, stopping position, or any later precise-car claim.

## Platform state

### Platform confirmed

Use **Platform confirmed** only when:

1. the arrival is independently admitted;
2. accepted actual-track evidence is fresh under its upstream owner;
3. the evidence resolves the exact train, constituent station, normalized direction, and directional platform within its supported horizon;
4. two distinct qualifying updates report the same exact platform and remain coherent with the train's path; and
5. no unresolved service, reroute, or track conflict applies.

Update one begins confirmation and restores nothing. A replay, identical redelivery without a newer observation, stale update, quarantined record, schedule, operational correction, or inferred station layout does not count as update two.

**Platform confirmed** is bounded to the actual-track evidence horizon. It does not confirm a downstream station prematurely and does not authorize positioning, transfer, or accessibility guidance by itself.

### Expected platform

Use **Expected platform** only when:

- the arrival remains independently admitted;
- no conflicting actual-track or service-path evidence exists;
- the normal or scheduled directional platform is supported for the exact route, direction, destination context, and service-pattern variation; and
- two qualifying exact actual-track updates have not confirmed the platform.

This state represents a normal or scheduled platform, never a live confirmation. Positioning is **Expected** only when the complete current static guidance record also passes; otherwise positioning is **Unavailable**.

### Check station signs

Use **Check station signs** only when:

- the arrival remains independently admitted;
- no unresolved conflicting actual-track record exists; and
- live confirmation is unavailable because accepted evidence is stale, a reroute is resolved but its replacement platform is not confirmed, or station/platform ambiguity remains.

Positioning is always **Unavailable**, so no positioning claim appears. This state is not a fallback for an unresolved nonterminal actual-versus-scheduled-track conflict and cannot be attached to a train whose row must be suppressed.

## Permitted axis combinations

| Platform state | **Verified** positioning | **Expected** positioning | **Unavailable** positioning |
|---|---|---|---|
| **Platform confirmed** | Permitted only with a complete current field-checked atomic record for the exact scope. | Permitted when a complete current static guidance record supports the exact scope but Verified evidence does not. | Required when geometry, objective, field, orientation, stopping, scope, or review evidence is incomplete. |
| **Expected platform** | Prohibited. A scheduled or normal platform is never enough for Verified. | Permitted only with a complete current static guidance record and no conflict. | Required when the static guidance record is incomplete or unsupported. |
| **Check station signs** | Prohibited. | Prohibited. | Required; show no positioning claim. |

An unresolved nonterminal actual-versus-scheduled-track conflict has no permitted combination. The affected arrival is outside this table and follows hard suppression below.

## Decision order

For each affected train and exact station-direction claim:

1. Consume the upstream arrival disposition without weakening it.
2. Apply the hard track-conflict boundary before assigning either axis.
3. If the arrival remains admitted, classify the platform state from accepted actual-track, normal/scheduled platform, service-pattern, freshness, and ambiguity evidence.
4. Independently classify positioning certainty from the atomic editorial record.
5. Apply direction reversal and replacement-platform non-inheritance.
6. Apply the separate complete-path and Accessible Route Only decisions.
7. Produce the exact visible and assistive state, qualification, or omission.
8. Retain the evidence, prohibited-result check, reviewer decisions, correction, and rerun separately.

No later step may repair a failed earlier step. A positioning record cannot restore an arrival, and a platform label cannot repair an unverified accessible path.

## Hard upstream actual-versus-scheduled-track conflict

An explicit unresolved, nonterminal actual-versus-scheduled-track conflict is a hard path conflict, not a platform-certainty downgrade.

1. Hard-suppress the affected downstream arrival row.
2. Suppress every dependent platform, positioning, transfer, and accessibility-guidance claim for that arrival.
3. Preserve unrelated arrivals and guidance that independently pass.
4. Show the exact station context:

   **Track change—check station signs**

5. Show the exact arrival-suppression explanation beside the affected board's suppression state, not as a train row:

   **Service change—this train's downstream stops are not verified.**

6. Never relabel the affected train as **Check station signs**, **Expected platform**, Uncertain, Scheduled, or a weaker countdown.
7. Do not infer a conflict from normal terminal variation. Normal terminal variation enters this rule only when separate current evidence makes the downstream path unreliable.
8. Do not let an unverified replacement platform inherit ordinary-platform geometry, positioning, transfer, boarding-area, or accessibility evidence.

The station-context phrase contains the words “check station signs,” but it is not the **Check station signs** platform state for the suppressed train. No affected row exists to carry a platform state.

## Conflict recovery and independent platform requalification

One newer coherent path update is **recovery update 1**. It restores no arrival row, countdown, platform state, positioning, transfer, or accessibility guidance.

**Recovery update 2** must preserve the coherent path and, across the pair, prove all five upstream conditions:

1. stable trip identity;
2. plausible stop order;
3. current movement or stop progress;
4. the exact target remains served; and
5. no unresolved service or track conflict.

Only after update 2 proves all five may the arrival be reconsidered through every ordinary Live admission gate. If any proof is missing, stale, contradictory, anomalous, or unreviewed, the row and dependent guidance remain absent and the next qualifying observation begins a new pair.

Arrival recovery never restores an old platform state or positioning claim. After arrival readmission:

- **Platform confirmed** must be separately re-earned with two stable, fresh, exact actual-track updates;
- **Expected platform** may be used only from qualifying normal/scheduled evidence without conflict;
- **Check station signs** may be used only under its narrow non-conflicting rule; and
- positioning certainty is reevaluated from the current atomic editorial record.

The same two observations may count toward both arrival recovery and platform confirmation only when each owning review independently records its required inputs, scope, timestamps, prohibited-result checks, and complete decision. One decision cannot cite the other's outcome as a substitute for its own evidence.

## State and transition matrix

| Evidence condition | Arrival consequence | Platform state | Positioning certainty | Required rider consequence |
|---|---|---|---|---|
| Two stable fresh exact actual-track updates; no conflict; complete current field-checked atomic guidance record | Preserve admitted arrival | **Platform confirmed** | **Verified** | Show platform confirmation; Task 8 may present the supported zone with Verified treatment. |
| Two stable fresh exact actual-track updates; no conflict; only complete current static guidance record | Preserve admitted arrival | **Platform confirmed** | **Expected** | Show platform confirmation; any later zone presentation remains clearly Expected. |
| Two stable fresh exact actual-track updates; geometry or objective relationship incomplete | Preserve admitted arrival | **Platform confirmed** | **Unavailable** | Show platform confirmation only; omit positioning. |
| Normal/scheduled platform and complete current static guidance record; no conflict; fewer than two qualifying actual-track updates | Preserve admitted arrival | **Expected platform** | **Expected** | Show expected platform; any later zone presentation remains clearly Expected. |
| Normal/scheduled platform supported; static guidance record incomplete | Preserve admitted arrival | **Expected platform** | **Unavailable** | Show expected platform only; omit positioning. |
| Actual-track evidence is stale without a conflicting actual-track record | Preserve arrival only if all upstream admission gates still pass | **Check station signs** | **Unavailable** | Show the platform state and no positioning claim. |
| Reroute path is resolved and arrival admitted, but replacement platform is not confirmed | Preserve admitted arrival | **Check station signs** | **Unavailable** | Show the platform state; omit all inherited positioning and reject an unverified accessible path. |
| Station/platform ambiguity remains and no conflicting actual-track record exists | Preserve arrival only if all upstream admission gates still pass | **Check station signs** | **Unavailable** | Show the platform state and no positioning claim. |
| Downstream station lies beyond the actual-track evidence horizon; complete normal/scheduled evidence exists | Preserve admitted arrival | **Expected platform** | **Expected** only with a complete static guidance record; otherwise **Unavailable** | Never call the downstream platform confirmed. |
| Direction reverses with complete opposite-direction orientation and objective evidence | Preserve independently admitted opposite-direction arrival | Reevaluate from opposite-direction evidence | Recalculate; Front and Back swap, and Middle remains only if supported | Do not mirror or reuse former-direction guidance. |
| Direction reverses without complete opposite-direction orientation or objective evidence | Preserve independently admitted opposite-direction arrival | Reevaluate from opposite-direction evidence | **Unavailable** | Omit positioning. |
| Unresolved nonterminal actual-versus-scheduled-track conflict | Hard-suppress affected row and dependent guidance | No platform state for the affected train; outside normal matrix | **Unavailable**; no claim | Show exact station-context and suppression copy; preserve unrelated service. |
| Conflict recovery update 1 | Keep affected row and guidance absent | No platform state for the affected train | **Unavailable**; no claim | Restore nothing. |
| Conflict recovery update 2 proves all five and every Live gate passes | Arrival may return | Independently reevaluate | Independently reevaluate | Never restore the prior platform or positioning claim automatically. |

## Direction reversal and service-pattern variation

Front and Back are relative to train travel, not permanent physical names.

- Reversing direction swaps Front and Back only after the opposite-direction orientation is positively supported.
- Middle remains Middle only when the record's geometry, stopping relationship, and objective evidence support that outcome.
- An unsupported opposite direction produces **Unavailable** positioning, even if the platform itself is known.
- A reroute, express/local variation, terminal change, platform change, or stopping-pattern change that can alter orientation returns the affected guidance to review.
- Route identity does not carry ordinary-platform guidance onto a replacement platform.

Scenario 33 is satisfied only by observed same-version proof of the correct reversal and the prohibited unsupported branch. The synthetic PG08 definitions below are not that observation.

## Accessibility boundary

Platform evidence and accessible-path evidence remain independent:

- **Platform confirmed** does not mean the platform or boarding area is accessible.
- **Verified** positioning does not establish a complete street-to-street step-free path.
- A complete accessible path does not confirm the train's current platform.
- A rerouted or replacement platform requires its own complete accessibility coverage and current decisions.
- Accessible Route Only rejects an unverified replacement platform; it never borrows ordinary-platform geometry or elevator-chain evidence.
- A hard track conflict suppresses dependent accessibility guidance for the affected arrival but does not erase unrelated structural coverage or suppress unrelated trains.

## Rider and assistive presentation boundary

The platform state is visible and conveyed with equivalent meaning to assistive technology when an admitted row supports it. Positioning certainty controls whether Task 8 may present a zone and how strongly it may phrase the relationship.

- **Verified** and **Expected** must never sound equivalent.
- **Unavailable** normally produces no visible or spoken positioning claim; it is not a reassuring badge.
- **Check station signs** is used only under its non-conflicting platform-state rule.
- During hard conflict, the affected train row is absent; the station context and suppression explanation are conveyed without creating a tappable placeholder train.
- No color, icon, motion, map placement, or screen-reader wording may imply a stronger platform or positioning state than the text allows.
- No numeric confidence score or car-number precision appears.

Task 8 owns rider objectives and exact benefit presentation. Task 10 owns station-by-station coverage and reverification. Task 12 owns the Release 2 go/no-go decision.

## Synthetic acceptance fixtures

`PG-T7-POLICY-v1` is an expected-policy definition identifier only. The commit containing this matrix binds its text after commit; it is not a working-product version, approval, or scenario result. Each `PGxx-SRC-v1` package is deliberately synthetic and contains no real MTA observation, station, field visit, or coverage claim. Execution requires a later fixed product/build and immutable artifact package.

All actual results, reviewer decisions, durable run evidence, corrections, reruns, and statuses below remain Pending.

### PG01 — complete field-checked guidance and two stable actual-track updates

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG01-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One admitted synthetic train; complete atomic field-checked guidance record verified at relative date `D0`; exact platform `P-A`; qualifying actual-track updates at `T0−30s` and `T0`; evaluation at `T0+5s`; same direction, pattern, platform, zone, and objective; no veto |
| Expected platform state | **Platform confirmed** |
| Expected positioning certainty | **Verified** |
| Expected visible and assistive result or omission | Show **Platform confirmed**. Task 8 may later render the supported Front/Middle/Back relationship with Verified treatment; assistive technology conveys the same state and certainty. |
| Prohibited behavior | Confirmation from one update; Verified from actual track alone; wrong-direction or another-platform inheritance; car number; numeric confidence; accessibility inference |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG02 — entrance coordinates only

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG02-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One admitted synthetic train; supported normal platform record at `T0`; public entrance coordinates only; no platform-relative stair, passage, elevator, zone, stopping, orientation, objective, field-check, or reviewer evidence; evaluation at `T0+5s`; no conflict |
| Expected platform state | **Expected platform** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show **Expected platform** only. Show and announce no Front/Middle/Back positioning claim. |
| Prohibited behavior | Treat entrance coordinates as platform geometry, zone evidence, live confirmation, transfer evidence, accessibility evidence, or a Verified/Expected positioning relationship |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG03 — scheduled platform and complete current static guidance record

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG03-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One admitted synthetic train; exact normal/scheduled platform and complete current static direction/pattern/orientation/zone/objective record observed at `T0`; no qualifying actual-track pair; no conflict; evaluation at `T0+5s` |
| Expected platform state | **Expected platform** |
| Expected positioning certainty | **Expected** |
| Expected visible and assistive result or omission | Show **Expected platform**. Any Task 8 zone treatment remains clearly Expected in visible and assistive presentation. |
| Prohibited behavior | **Platform confirmed**; **Verified** positioning; live implication from schedule stability; numeric confidence; car number |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG04 — one qualifying actual-track update versus two

#### PG04-A — one update

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG04-A-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One admitted synthetic train; complete current static guidance record; one qualifying exact actual-track update for platform `P-A` at `T0`; evaluation at `T0+5s`; no second update and no conflict |
| Expected platform state | **Expected platform**; update one does not confirm |
| Expected positioning certainty | **Expected** |
| Expected visible and assistive result or omission | Show **Expected platform** and only Expected positioning treatment if Task 8 later presents the zone. |
| Prohibited behavior | Count a replay as update two; show **Platform confirmed** or **Verified**; carry an older confirmation into this episode |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG04-B — two stable updates

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG04-B-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Repeat PG04-A with a distinct newer qualifying update at `T0+30s` preserving exact platform `P-A`, coherent path, direction, and train identity; complete field-checked atomic guidance record; evaluation at `T0+35s`; no conflict |
| Expected platform state | **Platform confirmed** |
| Expected positioning certainty | **Verified** |
| Expected visible and assistive result or omission | Show **Platform confirmed**; Task 8 may later present the supported zone with Verified visible and assistive treatment. |
| Prohibited behavior | Confirm from duplicated data; use a different platform or identity as update two; let platform confirmation waive missing field evidence |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG05 — Check station signs branches

#### PG05-A — stale platform evidence without conflict

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG05-A-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One otherwise admitted synthetic train; last actual-track evidence at `T0`; evidence is stale under its upstream owner at evaluation `T1`; no conflicting actual-track record and no hard veto |
| Expected platform state | **Check station signs** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show and announce **Check station signs**; show and announce no positioning claim. |
| Prohibited behavior | Continue **Platform confirmed**; show an old zone; infer conflict; show a numeric confidence |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG05-B — resolved reroute, replacement platform unconfirmed

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG05-B-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Synthetic reroute path is resolved and the arrival passes upstream gates at `T0`; replacement platform has no qualifying confirmation pair at evaluation `T0+5s`; no active actual-versus-scheduled-track conflict |
| Expected platform state | **Check station signs** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show and announce **Check station signs**; omit every ordinary-platform positioning claim. |
| Prohibited behavior | Inherit ordinary-platform geometry; call the replacement confirmed; use Verified or Expected positioning; treat this as hard conflict when none exists |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG05-C — station/platform ambiguity

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG05-C-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One otherwise admitted synthetic train; at `T0` the station context supports more than one plausible platform and supplies no conflicting actual-track record; ambiguity remains at evaluation `T0+5s` |
| Expected platform state | **Check station signs** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show and announce **Check station signs**; show and announce no positioning claim. |
| Prohibited behavior | Guess a platform; average candidates; reuse normal geometry; treat ambiguity as a numeric score |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG06 — platform confirmed while geometry or objective evidence is incomplete

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG06-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | One admitted synthetic train; same exact platform in qualifying updates at `T0−30s` and `T0`; evaluation at `T0+5s`; orientation exists, but zone geometry or the objective-specific exit/transfer/accessibility relationship is incomplete |
| Expected platform state | **Platform confirmed** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show and announce **Platform confirmed** only; show and announce no Front/Middle/Back claim. |
| Prohibited behavior | Treat platform confirmation as positioning; guess a zone; show **Verified**, **Expected**, a car number, or a benefit statement |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG07 — downstream platform beyond the actual-track evidence horizon

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG07-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Actual-track updates at `T0−30s` and `T0` confirm only a nearer station inside the evidence horizon; the target downstream station lies beyond that horizon; complete current normal-platform and static guidance records exist for the target; evaluation at `T0+5s`; no conflict |
| Expected platform state | **Expected platform** at the downstream target, never **Platform confirmed** |
| Expected positioning certainty | **Expected** |
| Expected visible and assistive result or omission | Show and announce **Expected platform** at the target; any later zone treatment remains clearly Expected. |
| Prohibited behavior | Extend near-term actual-track evidence downstream; show **Platform confirmed** or **Verified** at the target; copy another station's platform evidence |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG08 — scenario 33 direction reversal

#### PG08-A — opposite-direction evidence is complete

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG08-A-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Initial direction has physical ordering Front–Middle–Back at `T0`; rider reverses to a separately admitted opposite direction at `T1`; two qualifying exact platform updates and a complete field-checked opposite-direction record exist at `T1−30s` and `T1`; evaluation at `T1+5s`; Middle is independently supported |
| Expected platform state | **Platform confirmed** for the opposite direction |
| Expected positioning certainty | **Verified** |
| Expected visible and assistive result or omission | Front and Back swap relative to the prior direction; Middle remains Middle only because the opposite-direction evidence supports it; visible and assistive meaning agree. |
| Prohibited behavior | Preserve former Front/Back; mirror without evidence; change only the board but not guidance; claim a car number |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG08-B — opposite-direction orientation is unsupported

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG08-B-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Opposite-direction arrival and platform are independently admitted and confirmed by updates at `T1−30s` and `T1`; opposite-direction Front-to-Back, stopping, zone, or objective relationship is incomplete at evaluation `T1+5s` |
| Expected platform state | **Platform confirmed** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show and announce **Platform confirmed**; omit visible and assistive positioning. |
| Prohibited behavior | Mechanically reverse unsupported geometry; retain the former zone; assume Middle; use Expected as a guess |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG09 — reroute onto an unverified replacement platform

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG09-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | A reroute is operationally resolved and its arrival passes upstream gates at `T0`; the replacement platform lacks its own atomic geometry record, station-direction accessibility coverage, and complete path; no active track conflict; evaluation at `T0+5s` |
| Expected platform state | **Check station signs** |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | Show and announce **Check station signs**; omit positioning; Accessible Route Only rejects the candidate's unverified accessible path. |
| Prohibited behavior | Inherit ordinary-platform zone, exit, transfer, elevator, boarding-area, or accessible-path evidence; silently relax Accessible Route Only |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG10 — scenario 34 unresolved nonterminal actual-versus-scheduled-track conflict

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG10-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | At `T0`, one admitted-looking synthetic train develops an explicit unresolved nonterminal actual-versus-scheduled-track conflict affecting the target downstream board; one unrelated train remains coherent; evaluation at `T0+1s` |
| Expected platform state | No platform state for the affected train; hard suppression is outside the normal matrix. The unrelated train retains only its independently supported state. |
| Expected positioning certainty | **Unavailable** for the affected train; no positioning claim |
| Expected visible and assistive result or omission | Affected row and all dependent guidance are absent. Station context says exactly **Track change—check station signs**. The suppression state says exactly **Service change—this train's downstream stops are not verified.** The unrelated arrival remains visible when independently admitted. Assistive presentation conveys the same scope and omission. |
| Prohibited behavior | Relabel the affected train **Check station signs**; keep a lower-confidence row; show Scheduled replacement, platform, positioning, transfer, or accessibility guidance; suppress the unrelated train; treat normal terminal variation as this conflict |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG11 — conflict recovery update 1

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG11-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | PG10 conflict at `T0`; one newer fresh coherent path update at `T1` appears to prove all five recovery conditions; evaluation at `T1+1s`; no second qualifying update |
| Expected platform state | No platform state for the affected train; row remains suppressed outside the normal matrix |
| Expected positioning certainty | **Unavailable**; no positioning claim |
| Expected visible and assistive result or omission | Affected arrival and every dependent guidance claim remain absent visibly and assistively. Recovery update 1 restores nothing. |
| Prohibited behavior | Restore Live, a countdown, **Platform confirmed**, **Expected platform**, **Check station signs**, a zone, transfer, or accessibility guidance after one update |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG12 — conflict recovery update 2 and independent reevaluation

#### PG12-A — arrival recovery passes; platform and guidance do not automatically return

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG12-A-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | PG10 conflict at `T0`; coherent updates at `T1` and `T2` collectively prove stable identity, plausible stop order, current progress, target served, and no unresolved conflict; every ordinary Live gate passes at `T2`; only normal/scheduled platform evidence exists and static guidance is incomplete; evaluation at `T2+1s` |
| Expected platform state | **Expected platform**, independently reevaluated rather than restored |
| Expected positioning certainty | **Unavailable** |
| Expected visible and assistive result or omission | The arrival may return only after full Live readmission. Show **Expected platform** only; omit positioning visibly and assistively. |
| Prohibited behavior | Carry forward the pre-conflict platform, countdown, or guidance; equate arrival recovery with platform confirmation; show Verified or Expected positioning from incomplete guidance |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG12-B — the same observations independently satisfy platform confirmation

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG12-B-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Repeat PG12-A, but `T1` and `T2` each also contain fresh exact stable actual-track platform `P-B`; the platform owner records a complete independent two-update decision; a complete current field-checked atomic guidance record separately passes at `T2`; evaluation at `T2+1s` |
| Expected platform state | **Platform confirmed**, independently re-earned |
| Expected positioning certainty | **Verified**, independently re-earned |
| Expected visible and assistive result or omission | After full arrival readmission, show **Platform confirmed**; Task 8 may later present the supported zone with Verified treatment. |
| Prohibited behavior | Cite the arrival-recovery decision as the platform proof; omit either platform observation; skip the independent guidance record; erase the prior conflict |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

### PG13 — incomplete recovery missing one of the five proofs

Each branch begins with PG10's conflict at `T0` and two nominal updates at `T1` and `T2`. Exactly one required proof remains unresolved. Every branch is an independent pending run.

#### PG13-A — stable identity missing

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG13-A-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Updates at `T1` and `T2`; identity is ambiguous across the pair; the other four proofs appear supported; evaluation at `T2+1s` |
| Expected platform state | No platform state for the affected train; hard suppression remains |
| Expected positioning certainty | **Unavailable**; no positioning claim |
| Expected visible and assistive result or omission | Affected arrival and all dependent guidance remain absent visibly and assistively. |
| Prohibited behavior | Majority-vote four proofs; merge ambiguous identities; restore any row, platform, or guidance |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG13-B — plausible stop order missing

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG13-B-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Updates at `T1` and `T2`; stop order remains implausible; the other four proofs appear supported; evaluation at `T2+1s` |
| Expected platform state | No platform state for the affected train; hard suppression remains |
| Expected positioning certainty | **Unavailable**; no positioning claim |
| Expected visible and assistive result or omission | Affected arrival and all dependent guidance remain absent visibly and assistively. |
| Prohibited behavior | Let platform stability, ETA, or four other proofs override implausible order |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG13-C — current movement or stop progress missing

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG13-C-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Updates at `T1` and `T2`; current movement or stop progress is absent; the other four proofs appear supported; evaluation at `T2+1s` |
| Expected platform state | No platform state for the affected train; hard suppression remains |
| Expected positioning certainty | **Unavailable**; no positioning claim |
| Expected visible and assistive result or omission | Affected arrival and all dependent guidance remain absent visibly and assistively. |
| Prohibited behavior | Restore Expected through recovery; use a new ETA as progress; restore platform or guidance |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG13-D — target service missing

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG13-D-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Updates at `T1` and `T2`; the exact directional target is absent or materially unresolved; the other four proofs appear supported; evaluation at `T2+1s` |
| Expected platform state | No platform state for the affected train; hard suppression remains |
| Expected positioning certainty | **Unavailable**; no positioning claim |
| Expected visible and assistive result or omission | Affected arrival and all dependent guidance remain absent visibly and assistively. |
| Prohibited behavior | Reconstruct the target from static service, geometry, route identity, or platform evidence |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

#### PG13-E — unresolved service or track conflict remains

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `PG13-E-SRC-v1`; upstream policy baseline commit `0a53526689cd4f826fd42b9d340b96f9df83a672`; `PG-T7-POLICY-v1` bound by the commit containing this matrix |
| Synthetic inputs and observation times | Updates at `T1` and `T2`; a service or track conflict remains unresolved; the other four proofs appear supported; evaluation at `T2+1s` |
| Expected platform state | No platform state for the affected train; hard suppression remains |
| Expected positioning certainty | **Unavailable**; no positioning claim |
| Expected visible and assistive result or omission | Affected arrival and all dependent guidance remain absent visibly and assistively; the exact conflict context remains scoped to the affected service. |
| Prohibited behavior | Let four other proofs, a schedule, correction, platform stability, or positioning evidence clear the conflict |
| Actual result | Not run — Pending |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence reference | Pending — no fixed working-product run or rendered evidence |
| Correction | Pending — none recorded |
| Rerun | Pending — not run |
| Status | **Not run — Pending** |

## Fixture result summary

| Fixture | Expected decision family | Actual result | Reviewer decisions | Status |
|---|---|---|---|---|
| PG01 | **Platform confirmed** + **Verified** | Pending | All five roles Pending | **Not run — Pending** |
| PG02 | **Expected platform** + **Unavailable** from entrance-only evidence | Pending | All five roles Pending | **Not run — Pending** |
| PG03 | **Expected platform** + **Expected**, never Verified | Pending | All five roles Pending | **Not run — Pending** |
| PG04-A / PG04-B | One update does not confirm; two qualifying stable updates may confirm | Pending / Pending | All five roles Pending for each branch | **Not run — Pending** / **Not run — Pending** |
| PG05-A / PG05-B / PG05-C | **Check station signs** + **Unavailable** for each permitted branch | Pending / Pending / Pending | All five roles Pending for each branch | **Not run — Pending** for every branch |
| PG06 | **Platform confirmed** + **Unavailable** | Pending | All five roles Pending | **Not run — Pending** |
| PG07 | Downstream target is not confirmed beyond horizon | Pending | All five roles Pending | **Not run — Pending** |
| PG08-A / PG08-B | Correct reversal when supported; omission when unsupported | Pending / Pending | All five roles Pending for each branch | **Not run — Pending** / **Not run — Pending** |
| PG09 | No inherited reroute geometry; Accessible Route Only rejects unverified path | Pending | All five roles Pending | **Not run — Pending** |
| PG10 | Hard conflict suppresses affected row and guidance; unrelated arrival remains | Pending | All five roles Pending | **Not run — Pending** |
| PG11 | Recovery update 1 restores nothing | Pending | All five roles Pending | **Not run — Pending** |
| PG12-A / PG12-B | Arrival may return only after all Live gates; platform and guidance requalify independently | Pending / Pending | All five roles Pending for each branch | **Not run — Pending** / **Not run — Pending** |
| PG13-A through PG13-E | Any missing recovery proof keeps arrival and guidance absent | Pending for every branch | All five roles Pending for every branch | **Not run — Pending** for every branch |

## Review and release boundary

Every fixture execution must bind one fixed product/build, all source and policy versions, synthetic inputs, authoritative observation times, exact visible and assistive output, prohibited-result checks, five same-version reviewer decisions, durable evidence, correction, and rerun. A later passing rerun preserves the original result.

No fixture passes because this matrix states an expected outcome. No documentation commit is rendered evidence, actual-track coverage, a field check, reviewer approval, Gate 0 passage, or Release 2 authorization.

## Draft review checklist

- [ ] Positioning certainty uses only **Verified**, **Expected**, and **Unavailable**.
- [ ] Platform state uses only **Platform confirmed**, **Expected platform**, and **Check station signs** inside the normal matrix.
- [ ] The axes remain independent and no numeric confidence score exists.
- [ ] **Platform confirmed** requires two stable fresh exact actual-track updates.
- [ ] **Expected platform** never becomes live confirmation through schedule stability.
- [ ] **Check station signs** is limited to stale evidence, a resolved reroute with unconfirmed replacement, or station/platform ambiguity without a conflicting actual-track record.
- [ ] A hard nonterminal track conflict suppresses the affected row and every dependent guidance claim and uses both exact rider-copy strings.
- [ ] Recovery update 1 restores nothing; update 2 proves all five conditions before ordinary Live readmission.
- [ ] Arrival recovery and platform confirmation remain independently evidenced.
- [ ] No downstream platform is confirmed beyond the actual-track evidence horizon.
- [ ] Front and Back reverse only with supported opposite-direction evidence; Middle remains only when supported.
- [ ] An unverified replacement platform inherits no geometry, transfer, or accessibility evidence.
- [ ] All 13 fixture IDs and every explicit branch remain **Not run — Pending** with every reviewer decision Pending.
- [ ] Task 8, Task 10, and Task 12 retain their separate ownership.
- [ ] The current no-go and blocked public-board decision remain explicit.

Every unchecked required item blocks review completion and Release 2 consideration.

## Task 10 append-only coverage gate and provenance

Task 10 changes none of the Task 7 axes, states, decision conditions, two-update rules, recovery rules, conflict copy, actual-track horizon, direction-reversal rules, or PG01–PG13 fixture definitions and statuses above. It applies approved specification §§23.7, 29.4, 30.2, 32.3–32.4, and 33.2; the accessibility and platform-guidance plan `Product artifact map` and full Task 10 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`; accepted Task 7 commit `3d39129a58b497c92d0125569edebd894c47a71d` with this file's accepted pre-append blob `cc937eb46b0493236dd2be67589f147049dbee26`; accepted Task 8 commit `0fcb00265a23ea859681dfef7b6edad213c674df`; and accepted Task 9 commit `8e27ae2bd3b69c3946a9aba41adf7c76f36e00a5`.

The [platform guidance coverage register](platform-coverage-register.md) owns the atomic 38-field coverage row, eligibility disposition, priority, reverification, feedback, and Release 2 package. Its artifact header and Draft index row align on §§23.7, 29.4, 30.2, 32.3–32.4, and 33.2 plus full Task 10 provenance. That metadata alignment does not invent approval; every real coverage row, reviewer decision, and release disposition remains **Pending**.

### Coverage is the first positioning gate

For Task 10 and every later rollout, apply this gate before step 1 of the existing [Decision order](#decision-order):

1. Does one exact **Eligible for runtime evaluation** coverage row match the current complex, constituent, route, service-pattern variation, normalized direction, destination, directional platform and orientation, objective, exact target, and Front/Middle/Back relationship?
2. If no, positioning is **Unavailable** and the visible and assistive positioning claim is omitted. Preserve independently valid arrival and platform context.
3. If yes, proceed through every existing arrival, hard-conflict, platform-state, positioning-certainty, horizon, direction, reroute, accessibility, and presentation rule above without weakening one.

| Coverage and runtime condition | Positioning consequence | Prohibited inference |
|---|---|---|
| Exact eligible row and every current runtime rule passes for **Verified** | The existing matrix may produce **Verified** for the exact scope only. | Coverage eligibility itself is Verified, current, or displayed. |
| Exact eligible row and only the existing **Expected** runtime conditions pass | The existing matrix may produce **Expected** for the exact scope only. | Eligibility upgrades Expected to Verified. |
| Exact eligible row but runtime platform, service, orientation, stopping, path, accessibility, or conflict evidence is ambiguous, missing, stale, contradictory, or vetoed | Positioning is **Unavailable** or the affected arrival and dependent guidance are suppressed under the existing harder rule. | Use the coverage row to repair runtime truth. |
| Current platform is **Platform confirmed** but no exact eligible coverage row exists | Preserve platform confirmation; positioning is **Unavailable** and omitted. | Infer positioning from two track updates. |
| Editorial evidence exists but the coverage row is Pending, Rejected, under reverification, superseded, differently scoped, or absent | Positioning is **Unavailable** and omitted. | Lower-certainty zone, inherited row, summary coverage, or bulk enablement. |

Coverage eligibility is not **Platform confirmed**, **Verified**, **Accessible now**, current service, a passing fixture, or release authorization. An eligible row plus runtime ambiguity omits positioning. Runtime track evidence plus no eligible row also omits positioning.

A transient runtime reroute, station ambiguity, or track conflict suppresses display without changing an otherwise current structural coverage row unless accepted evidence establishes a durable geometry, path, orientation, stopping, objective, or target change. A durable change triggers exact-scope reverification. During an unresolved invalidating conflict, preserve the existing exact station context and suppression explanation, suppress the affected arrival and every dependent claim, and preserve unrelated service.

All real coverage rows, eligible rows, priority complexes, visible and assistive outputs, reviewer decisions, approvals, coverage results, and release evidence remain **0**, **None**, or **Pending**. The 13 PG fixture families and every explicit branch above remain **Not run — Pending**. The authoritative **NO-GO — GATE 0 NOT PASSED**, public-arrival-board block, separate accessibility no-go, and Task 12 Steps 5–13 **Pending** posture remain unchanged.
