# Commute window state matrix

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§25.1 and 28.2–28.3; additional applying approved specification §§13.1–13.3, 14.2, 14.5–14.6, 25.2, 28.1, 31.4 scenarios 22–23, 31.6–31.8 scenarios 36–42, 48, and 51; commute alerts and launch quality plan Task 4; accepted Nearby and Commute Tasks 1–3 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-window-setup-flow.md#pending-execution-record-for-every-cux-fixture) |

## Purpose and authority

This matrix owns rider-visible setup, lifecycle, permission, connectivity, relationship, edit, reset-handoff, and error combinations for one commute. It prevents a delivery capability, network state, or temporary operational state from silently becoming lifecycle or preference truth.

The [setup flow](commute-window-setup-flow.md), [permission moments](notification-permission-moments.md), and [copy catalog](../content/commute-window-copy-catalog.md) own their respective presentation. Task 1 owns lifecycle semantics; Task 3 owns prospective tolerance reset. This task changes neither.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) remains in force. No state observation, OS capture, reviewer decision, approval, or release evidence exists.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§13.1–13.3, 14.2, 14.5–14.6, 25.1–25.2, 28.1–28.3, scenarios 22–23, 36–42, 48, and 51, full Task 4 and Task 7 provenance, accepted upstream handoffs, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. That metadata alignment is not approval; every state observation and reviewer decision remains **Pending**.

## Independent axes

| Axis | Allowed values | Independence rule |
|---|---|---|
| Lifecycle | **Active**, **Paused**, **Expired**, terminal **Deleted** | Only explicit rider pause/resume changes Active/Paused; structural invalidity can Expire; deletion is terminal |
| Validity | **Incomplete**, **Complete — unconfirmed**, **Confirmed** | Permission and connectivity never make fields complete or confirm them |
| Notification permission | **Not determined**, **Granted**, **Denied**, **OS restricted** | Capability affects delivery only; it never pauses, expires, confirms, or deletes |
| Connectivity | Connected, Offline | Offline blocks current evaluation/delivery but never changes lifecycle |
| Structural relationship | Valid, Missing, Ambiguous, Retired | A permanent unresolved required relationship can Expire; temporary operational truth cannot |
| Operational truth | Current owner-supplied state, unavailable, stale, disrupted, or recovering | Never stored as preference and never rewrites lifecycle |

Show simultaneous causes independently. For example, **Active + Denied + Offline** remains Active intent, notification access blocked, and current evaluation unavailable. Do not replace the two causes with a generic Off.

## State precedence

1. Deleted is terminal and displays no retained lifecycle state.
2. Missing, ambiguous, retired, or materially remapped required structure produces Expired after the exact owner decision.
3. Rider-selected Paused remains Paused through inspection, editing, Offline, permission changes, and daily boundaries.
4. Confirmed Active intent remains Active through permission denial/restriction/revocation, Offline, daily end, and temporary disruption.
5. Validity blocks save/enable separately from lifecycle and permission.
6. Current operational truth stays separate and cannot repair invalid structure or alter saved intent.

## Complete state matrix

| Situation | Axes before | Exact action or event | Axes after | Visible and assistive consequence | Prohibited result |
|---|---|---|---|---|---|
| Incomplete setup | Incomplete; no lifecycle; any permission/connectivity | Continue or Turn on alerts | Incomplete | Show first missing field and exact completion error | Permission prompt; Active/Paused |
| Complete unconfirmed | Complete — unconfirmed; no lifecycle | Review only | Unchanged | Full coherent review; no watch or prompt | Implicit confirmation |
| Save without alerts | Complete — unconfirmed; permission unchanged | **Save without alerts** | Confirmed + **Paused** | Exact paused confirmation; zero prompts | Active; permission mutation |
| Turn on, Granted, connected | Complete — unconfirmed; Not determined | Explicit enable, OS grants | Confirmed + **Active** + Granted + connected | Exact active success; current evaluation only under later owners | Promise every delay |
| Active, Granted, connected | Confirmed + Active + Granted | Open/inspect | Unchanged | Alerts on status; no new prompt or replay | Auto-send or state rewrite |
| Active, Granted, Offline | Confirmed + Active + Granted + Offline | Network loss | Active + Granted + Offline | Active intent plus Offline/current-evaluation unavailable | Pause, Expire, stale delivery |
| Active, Denied | Confirmed + Active + Denied | Denial or existing denial | Unchanged lifecycle; delivery blocked | **Needs notification access** and settings action | Pause/expire; repeated OS prompt |
| Active, OS restricted | Confirmed + Active + OS restricted | Restriction detected | Unchanged lifecycle; delivery unavailable | Exact device-unavailable copy | Treat as rider pause |
| Active, permission revoked | Confirmed + Active + Granted | OS permission revoked | Active + Denied or OS owner state | Status changes immediately; no missed replay | Delete, Expire, notification burst |
| Active, permission restored | Active + blocked permission | Rider restores in settings | Active + Granted | Current-only reevaluation; no stale/missed replay | Backfill notifications |
| Paused inspection | Confirmed + Paused | Open details | Paused | Fields editable; no automatic watch | Resume on open |
| Paused edit/cancel | Confirmed + Paused | Edit then Cancel | Exact prior Paused record | Prior fields/state preserved | Partial save or resume |
| Paused edit/save | Confirmed + Paused | Edit then Save changes | Confirmed + Paused | Reviewed fields update; remains Paused | Resume because valid |
| Paused resume, Granted | Confirmed + Paused + Granted | **Resume alerts** | Active + Granted | No OS prompt; current-only reevaluation | Prompt replay; historical delivery |
| Paused resume, Not determined | Confirmed + Paused + Not determined | **Resume alerts** | Permission flow pending | Exact pre-prompt then OS outcome | Active before explicit result |
| Paused resume, Denied/restricted | Confirmed + Paused + blocked permission | **Resume alerts** | Active intent + blocked delivery | Settings/capability result shown separately | OS prompt replay; stay Paused silently |
| Relationship missing | Confirmed + Active or Paused + structurally Missing | Accepted structural owner result | **Expired** | Exact missing reason; full review to resume | Silent substitute |
| Structural route mismatch | Confirmed + Active or Paused + Ambiguous/Retired | Accepted route/direction/destination mismatch | **Expired** | Exact route/relationship review copy | Permission or Offline used as reason |
| Temporary disruption | Active or Paused; structure Valid | Delay, bypass, outage, stale data, or recovery | Same lifecycle and fields | Operational result stays separately owner-scoped | Rewrite preference; Expire/Pause |
| Daily interval end | Active; any permission | Exclusive end passes | Active, not currently watching | No notification solely from end | Expired or Paused |
| Saved-card deletion | Self-contained commute references saved card | Delete saved card only | Commute unchanged | Exact removed-card notice | Delete/expire commute |
| Delete commute | Any retained lifecycle | Confirm **Delete commute** | **Deleted** terminal | Exact deleted confirmation; no retained tombstone | Change saved card, maps, ARO, OS permission |
| Broad reset requested | Any retained state; Task 7 companion Pending | Confirm reset template | No completion claim | Covered/retained categories remain placeholders; Pending shown | Partial success called complete |
| Offline explicit enable | Complete; Offline; Not determined | Explicit Turn on/Resume | Permission flow may run only in Commute | Result plus Offline shown independently | Reconnect prompt; delivery replay |
| Reconnect | Active or Paused; any permission; Offline | Connectivity returns | Same lifecycle/permission | Current-only owner reevaluation | Prompt, stale/missed replay |
| Tolerance change | Confirmed; any lifecycle | Explicit 5/10/15 choice saved | Same lifecycle; new stored T | Prospective Task 3 baseline reset stated | Retroactive decision |

## Edit and structural review matrix

| Edit | Review requirement | Lifecycle effect |
|---|---|---|
| Optional entrance/exit/alternate/transfer added or cleared | Show full field and consequence in Review | Preserve current lifecycle only after explicit Save changes; never infer a replacement |
| Origin, destination, route, direction, or structural accessibility relationship changes | Full four-step review and route-direction-destination validation | Preserve Paused if Paused; Active requires explicit reviewed save and still respects permission |
| Days, start, end, or lead changes | Full time interpretation, including overnight/start-weekday ownership | Prospective recurrence only |
| Delay sensitivity changes | Exact label and added-time caveat | Same lifecycle; reset Task 3 pending inference prospectively |
| Cancel | No mutation | Preserve exact previous fields, axes, focus return, and state |

## Reset handoff

Use only the template owned by the copy catalog:

> **Reset all personalization?**
>
> This clears: {covered_categories}. This keeps: {retained_categories}. Notification permission and Accessible Route Only do not change.

Task 7 supplies the category inventory, companion results, and token lifecycle. Task 4 must not invent either category list. Reset cannot report completion while any covered companion is Pending or failed. One commute’s **Delete commute** remains separate from broad reset.

## Data and control boundary

No account or continuous background location is required. Saved commutes are device-held and private by default, but Task 4 does not promise that every future delivery value is exclusively on-device before Task 7’s inventory and retention review.

No passive location, movement, home/work inference, habit model, or default synchronization activates, edits, pauses, resumes, expires, or deletes a commute.

## Explicit gaps

No real combined-state capture, edit trace, prompt count, permission observation, Offline/reconnect trace, focus transcript, reset companion result, fixed product/build, reviewer decision, correction, rerun, or launch evidence exists. Task 7 reset and data decisions remain Pending.

## Draft review checklist

- [ ] Every matrix row preserves lifecycle, validity, permission, connectivity, relationship, and operational truth as independent axes.
- [ ] Permission, OS state, Offline, daily end, and temporary disruption never pause or expire.
- [ ] Structural mismatches expire with exact reasons and no silent substitute.
- [ ] Cancel preserves; editing Paused never resumes; tolerance changes reset prospectively.
- [ ] Saved-card deletion, commute deletion, and broad reset remain distinct.
- [ ] Combined Offline and permission causes are both visible and assistive.
- [ ] All linked CUX actuals and reviewer evidence remain Not run — Pending.

Every unchecked item blocks approval. This documentation commit is not evidence.

## Task 7 privacy, retention, and reset addendum

This appended addendum applies the [commute data inventory](../privacy/commute-data-inventory.md) and [retention and reset policy](../privacy/commute-retention-and-reset-policy.md) without revising the accepted Task 4 matrix above. It adds no account, backup, synchronization, continuous location, movement history, passive visits, inferred Home or Work, personal analytics, or operational-truth authority.

### Task 7 governance boundary

| Governance field | Task 7 addendum value |
|---|---|
| Additional source sections | Approved specification §§13.3, 25.1–25.7, 26.3, 28.1–28.3, 30, and 34; commute alerts and launch quality plan Task 7; accepted immutable Commute Tasks 1–6 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-privacy-scenarios.md#pending-execution-record) |

The Draft artifact index row now carries the full Task 7 provenance and mandatory Data Quality review for these added rows alongside the Task 4 provenance and six-role review path. That metadata alignment is not approval; all reset, retention, error-state, and reviewer evidence remains **Pending**.

### Combined privacy and lifecycle states

Lifecycle, alert intent, current operating-system capability, connectivity, location permission, queue state, delivery memory, and deletion result remain independent. Apply every cause that is simultaneously true; never replace one axis with a more convenient label.

| Starting state | Event or combined condition | Saved preference and lifecycle | Delivery capability, queue, and memory | Visible and assistive result | Forbidden transition |
|---|---|---|---|---|---|
| Active; alerts enabled; permission Granted; connected | No privacy or delivery exception | Retain exact confirmed preference and Active lifecycle | Minimum current association; only a currently eligible queue item; minimal ledger | Active card and current service state | Collect account, location, visit history, or personal analytics |
| Active; alerts enabled | Permission now requires rider action | Retain Active and explicit alert intent; store no permission history | Remove or suspend commute association; cancel queued delivery; retain only needed replay memory | **Needs notification access**; expose **Open notification settings** | Pause, expire, delete, or replay |
| Active; alerts enabled | Notifications unavailable on this device | Retain Active and explicit alert intent | Remove or suspend association and cancel queue | **Notifications aren't available on this device.** | Claim delivery is available or repeatedly prompt |
| Active; unmet permission | Current permission later reads Granted | Retain Active | Associate the current capability; evaluate and queue current evidence only | Current enabled state | Restore or replay an old candidate |
| Active or Paused | Location permission revoked, denied, restricted, or unavailable | Retain exact saved commute and lifecycle | No delivery change caused by location; disable only a separately approved location convenience | **Alerts use your saved trip. Location access is not required for this commute.** where explanation is needed | Require location, infer visits, or alter endpoints |
| Active; alerts enabled; permission unmet; Offline | Both causes are true | Retain Active and explicit intent | No delivery; no queue; retain minimal replay memory | Show both notification-access and Offline causes visibly and assistively | Collapse the combined state to only one cause |
| Active; alerts enabled; permission Granted; Offline | Connectivity is lost | Retain Active | Do not claim current remote delivery; invalidate work when its opportunity ends | Truthful Offline state plus current saved commute | Pause, expire, or backfill on reconnect |
| Active; Offline | Connectivity returns | Retain Active | Evaluate current accepted evidence only | Current connected state | Replay a message missed while Offline |
| Active | Rider chooses **Pause alerts** | Retain all confirmed preference fields; set Paused | Stop delivery; cancel queue; retain minimum ledger and explicit intent | Paused; expose **Resume alerts** | Delete, expire, or clear replay memory |
| Paused | Rider chooses **Resume alerts** | Retain preference; set Active | Evaluate current evidence with retained ledger | Active current state | Replay missed or represented messages |
| Active or Paused | Rider chooses **Edit commute** and reconfirms | Replace the confirmed preference version and affected derived state; preserve lifecycle | Invalidate ineligible queue work; retain only memory needed to avoid duplicate delivery | Reconfirmed current values | Resume a Paused commute or manufacture a resend |
| Active or Paused | Rider cancels editing | Preserve every field, lifecycle, axis, and focus return | No capability, queue, or memory mutation | Return focus to **Edit commute** | Partial save or hidden mutation |
| Active | Accepted Task 1 expiry condition occurs | Retain saved preference as Expired | Stop evaluation-for-delivery; remove current queue; retain only still-necessary state | Expired with available controls | Treat expiry as deletion or continue sending |
| Any saved commute | Rider opens **Delete commute** | No mutation until confirmation | No mutation until confirmation | Open **Delete this commute?** with exact disclosed body, **Delete commute**, and **Keep commute** | Swipe-only, long-press-only, pre-confirmation removal |
| Delete confirmation open | Rider chooses **Keep commute** | Preserve commute and lifecycle | Preserve current capability, queue eligibility, and ledger | Close dialog and return focus to **Delete commute** | Delete or change alert state |
| Any saved commute | Rider confirms **Delete commute** | Remove selected preference, provenance, tolerance, recovery and per-commute accessibility values; store no tombstone | Remove linked derived state, ledger, association, queue, and product-controlled payload | **Commute deleted** | Change another commute, saved stations, maps, global Accessible Route Only, or operating-system permission |
| Last alert-enabled commute | Rider confirms deletion | Remove the commute | Remove Commute delivery registration unless another explicit product use owns it | **Commute deleted** | Retain an ownerless Commute registration |
| One of multiple commutes | Rider confirms deletion | Remove only the selected commute | Remove only its associations and queue; preserve independently owned capability | **Commute deleted** | Delete or reset another commute |
| Any personalization exists | Rider opens broad reset | No mutation until confirmation | No mutation until confirmation | **Reset all personalization?** with populated covered and retained category lists | Vague, empty, hidden, or silently expanded lists |
| Reset confirmed | All covered categories delete or verify absent | Remove every commute and per-commute preference; preserve disclosed maps, official structural data, current global Accessible Route Only, and operating-system permission | Remove all linked derived state, ledgers, associations, queues, payloads, and ownerless Commute registration | Completion only when every category is **Deleted** or **Not present** | Preserve a tombstone, replay memory, or per-commute Accessible Route Only |
| Personal-data deletion in progress | One or more categories unresolved | Local removed data remains absent | Continue safe verification or retry for unresolved product-controlled copies | Show each **Pending** or **Failed** category | Announce completion |
| Personal-data deletion checked | Every category resolves | No personal commute data remains | No personal product-controlled delivery copy remains | Complete only with all results **Deleted** or **Not present** | Treat unknown as Not present |
| Any local commute exists | Operating system clears app data | No local commute, preference, recovery, derived state, or ledger remains | No local association or queue remains; legacy remote delivery is prohibited | Empty commute state; offline maps may also be absent because of the operating system | Restore, replay, or claim remote cleanup without evidence |
| App was removed or app data cleared | Rider reinstalls | Start empty; no backup or restore | No legacy registration or queue may deliver; current permission alone creates no intent | New setup is required | Restore Home, Work, route, window, preference, or alert intent |
| Reinstalled; current permission Granted | Rider has not confirmed and enabled a new commute | No commute exists | No delivery association or queue | Empty setup state | Treat permission as alert intent |
| Recovery updates Off or On | Rider toggles recovery updates | Retain new current setting prospectively | Preserve original-delivery value and change marker only where an approved recovery decision requires them | Show current setting | Retroactively create or erase a recovery message |
| Pause, delete, reset, or permission loss races with an unsent queue item | Stop or destructive action wins | Apply the rider or system state above | Veto and remove the ineligible queue item | Show current stopped or deleted state | Deliver the stale queued message |

### Exact destructive copy

For one commute:

> **Delete this commute?**
>
> This removes {origin} to {destination} and its alert settings from this device. Saved stations, offline maps, and notification permission do not change.

Actions are **Delete commute** and **Keep commute**. Successful local deletion announces **Commute deleted**.

For broad reset:

> **Reset all personalization?**
>
> This clears: {covered_categories}. This keeps: {retained_categories}. Notification permission and Accessible Route Only do not change.

The category placeholders require owner-approved current values. Reset and personal-data deletion use exactly **Deleted**, **Not present**, **Pending**, or **Failed** for each disclosed category. Completion is false while any category is Pending or Failed.

### Task 7 control requirements

**Edit commute**, **Pause alerts**, **Resume alerts**, **Delete commute**, **Keep commute**, and **Open notification settings** must be in the bottom third of the relevant screen, at least 48 × 48 CSS pixels, keyboard and switch operable, focus ordered, persistently labeled, and exposed with matching accessible names. Destructive confirmation receives heading focus; cancellation returns focus to the initiating control. Visible and assistive status must agree. No destructive or core action may be swipe-only, long-press-only, gesture-only, or hidden.

### Task 7 open gaps

The 900-second quiet-period proposal; seen and quiet-period semantics; successful delivery versus unknown acknowledgement; severity ordering; correction and retraction; remote delivery topology and invalidation after app-data clearing or reinstall; lock-screen disclosure; and numeric diagnostic retention and floors remain **Pending**. No row may invent a duration or mechanism to close them.

No observed deletion, permission, privacy, remote cleanup, reviewer, pilot, or launch evidence exists. Every linked [CPR fixture](../test-cases/commute-privacy-scenarios.md#fixture-definitions) remains **Not run — Pending**. Gate 0 and the separate accessibility no-go remain in force.

### Task 7 review checklist

- [ ] Every combined state preserves lifecycle, permission, location, connectivity, queue, ledger, and deletion results as independent axes.
- [ ] Pause, resume, edit, permission restoration, reconnect, and reinstall never replay.
- [ ] Delete one preserves every disclosed unrelated category and creates no tombstone.
- [ ] Reset and personal-data deletion cannot complete with Pending or Failed work.
- [ ] Location remains unnecessary and no permission history is stored.
- [ ] Control placement, target size, focus, names, announcements, and non-gesture operation are evidenced.
- [ ] Product, Accessibility, Data Quality, Content, Privacy, and Operations record dated review.
- [ ] All 19 CPR fixtures pass with fixed inputs, actual evidence, corrections, and reruns.
- [x] Draft index provenance and reviewer metadata align; same-version reviewer decisions and evidence remain Pending.

Every unchecked item blocks approval. This documentation commit is not evidence.
