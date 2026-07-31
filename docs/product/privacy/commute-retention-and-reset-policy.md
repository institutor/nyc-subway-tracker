# Commute retention and reset policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§13.3, 25.1–25.7, 26.3, 28.1–28.3, 30, and 34; commute alerts and launch quality plan Task 7; accepted immutable Commute Tasks 1–6 artifacts |
| Owner | Privacy Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-privacy-scenarios.md#pending-execution-record) |

## Purpose and authority

This policy defines when subway commute-alert data is retained, stopped, removed, or reported as unresolved. It applies the [commute data inventory](commute-data-inventory.md) to the accepted [commute lifecycle](../commute/commute-window-contract.md), [state matrix](../ux/commute-window-state-matrix.md), [permission moments](../ux/notification-permission-moments.md), [timing policy](../commute/notification-timing-policy.md), [recovery policy](../commute/recovery-notification-policy.md), and [deduplication rules](../commute/deduplication-decision-table.md).

This Draft policy defines proposed product lifecycle boundaries; it approves neither those boundaries nor any numeric retention duration. Where a duration, remote invalidation rule, or diagnostic aggregation end has no approved owner decision, the result is a blocking gap. No implementation may substitute **indefinite**, a convenient default, or a hidden identifier.

This artifact is **Draft** and demonstrates no actual retention, deletion, reset, permission, privacy, reviewer, pilot, or launch evidence. The posture remains **NO-GO — GATE 0 NOT PASSED** and **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED**.

## Product Governance status

The artifact header and Draft product artifact index row register the full Task 7 provenance, Privacy ownership, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. That metadata alignment is not approval; every same-version reviewer decision and scenario result remains **Pending**.

## Retention principles

1. Keep only a field enumerated in the inventory and only while its approved purpose remains current.
2. A saved commute is private preference, never operational truth, an account, a backup object, or a behavioral profile.
3. Canonical preference is device-local. Delivery-service state exists only to deliver an explicitly enabled current alert.
4. Pause is not delete. Expiry is not delete. Permission loss is not pause or expiry.
5. Delete has no commute tombstone. Reset does not preserve replay memory.
6. Current operating-system permission may be read when needed; permission-transition history is never retained.
7. Resume, permission restoration, connectivity restoration, editing, and reinstall never replay a missed, queued, or already represented message.
8. No personal row-level event may be retained for later aggregation.
9. A deletion result is complete only when every disclosed category is **Deleted** or **Not present**.

## Retention by inventory class

| Inventory class | Retain while | Stop or replace when | Required removal |
|---|---|---|---|
| Necessary canonical preference | The commute exists as Active, Paused, or Expired | Reconfirmation replaces the current preference version; alert intent changes prospectively | Delete commute, reset all personalization, delete personal data, operating-system app-data clear, or reinstall without restore |
| Optional rider-supplied context | The commute exists and the rider keeps that field | Rider clears or replaces the field | Clear field, delete commute, reset, delete personal data, app-data clear, or reinstall |
| Necessary derived evaluation state | It can still affect a valid occurrence under its owning Tasks 2–6 rule | New accepted evidence supersedes it, the opportunity ends, or owner reset makes it irrelevant | Delete commute, reset, delete personal data, app-data clear, or reinstall |
| Minimal personal delivery ledger | It is necessary to prevent duplicate delivery or apply an approved recovery rule for a current saved commute | The comparison can no longer affect an occurrence, or an owner-approved reset applies | Delete commute, reset, delete personal data, app-data clear, or reinstall |
| Delivery capability and queued copies | Capability and association: an explicitly enabled product use owns them and current permission permits them. Each queue or payload copy: that exact delivery remains current and permitted | Capability and association: suspend or remove when permission no longer permits them; remove when explicit ownership ends. Each queue or payload copy: stop and remove independently when delivered, canceled, superseded, stale, or no longer permitted | Remove the selected commute association and its queue on delete; remove the Commute registration when its last owning use ends; remove each product-controlled queue and payload copy independently; remove all product-controlled copies on personal-data deletion |
| Reviewed coarse non-personal diagnostics | An approved diagnostic purpose remains current and its owner-approved deletion or aggregation end has not occurred | Purpose ends or approved end is reached | Follow the approved non-personal diagnostic disposition; no duration is approved by this policy |

No class authorizes default backup, sync, movement history, inferred Home or Work, passive visits, or reidentifiable analytics.

## Deterministic lifecycle and capability behavior

| Starting condition | Rider or system event | Canonical commute | Evaluation and delivery | Capability, queue, and ledger | Required rider-facing result | Prohibited result |
|---|---|---|---|---|---|---|
| Active, alerts enabled, current permission Granted | Rider chooses **Pause alerts** | Retain preference and set lifecycle to Paused | Stop evaluation-for-delivery and all delivery | Retain minimum delivery memory; cancel or invalidate pending commute deliveries; keep capability only if an explicit product use still owns it | Show Paused and **Resume alerts** | Delete preference, expire it, clear deduplication memory, or send while paused |
| Paused | Rider chooses **Resume alerts** | Retain preference and set lifecycle to Active | Evaluate only current evidence for the current opportunity | Use retained delivery memory; create only a current eligible queue entry | Show Active current state | Replay anything missed while paused or resend an already represented impact |
| Active or Paused | Rider edits and reconfirms | Replace current confirmed preference version and affected derived state | Re-evaluate current evidence under the new version | Retain only delivery memory needed to prevent a duplicate; invalidate ineligible queue entries | Show the reconfirmed commute | Manufacture a resend solely because fields or copy changed |
| Active reaches the accepted Task 1 expiry rule | Commute expires | Retain the saved preference as Expired | Stop evaluation-for-delivery and delivery | Remove current queue entries; retain only data still necessary for the saved Expired record and approved replay prevention | Show Expired and available rider controls | Treat expiry as deletion or continue delivery |
| Active, alerts enabled | Current permission becomes denied, revoked, or otherwise needs rider action | Keep Active and keep explicit alert intent | Stop remote delivery; current in-app commute remains usable | Remove or suspend the commute-to-capability association and cancel its queue; retain no permission history | Show **Needs notification access** and **Open notification settings** where settings can resolve it | Pause, expire, delete, or replay |
| Active, alerts enabled | Notifications are unavailable on the device | Keep Active and keep explicit alert intent | Stop remote delivery; current in-app commute remains usable | Remove or suspend the association and cancel its queue | Show **Notifications aren't available on this device.** | Claim alerts work, change lifecycle, or repeatedly prompt |
| Active with unmet permission | Current permission later reads Granted | Keep Active | Evaluate current evidence only | Establish the minimum current association; queue only a newly current eligible message | Show current enabled state | Restore old queued work or replay a missed alert |
| Any saved commute | Current location permission is denied, revoked, restricted, or unavailable | Keep saved commute unchanged | Continue evaluation from the saved trip; disable only a separately approved location convenience | Store no location-permission history | Show **Alerts use your saved trip. Location access is not required for this commute.** where explanation is needed | Disable the commute, demand location, infer visits, or alter origin and destination |
| Any saved commute | Connectivity is lost and later returns | Keep saved commute unchanged | During loss, do not claim current remote delivery; on return evaluate current evidence | Expire or cancel no-longer-current queue work; no replay | Show truthful current/offline state owned by the relevant UX | Backfill missed notifications |
| Recovery updates Off or On | Rider changes the setting | Retain the new setting | Apply it prospectively to later qualifying decisions | Preserve original-delivery setting, current setting, and prospective-change marker only where an approved recovery decision requires them | Show current setting | Retroactively create or erase a recovery message |

## Delete one commute

The visible destructive control is **Delete commute**. It must open a confirmation with:

- title: **Delete this commute?**
- body: **This removes {origin} to {destination} and its alert settings from this device. Saved stations, offline maps, and notification permission do not change.**
- destructive action: **Delete commute**
- safe action: **Keep commute**

After successful local deletion, show **Commute deleted**.

Delete exactly these categories for the selected commute:

- opaque commute ID and lifecycle;
- all canonical preference fields, optional context, confirmation provenance, thresholds, accessibility settings, alert intent, and recovery setting;
- all linked baseline, candidate, evaluation, delivery-ledger, and recovery state;
- all commute-to-capability associations;
- all pending queue entries and product-controlled payload copies; and
- every other personal association whose only purpose was that commute.

Create no Deleted record, tombstone, journey event, deletion analytics, or replay marker.

Preserve:

- every other saved commute and its own current state;
- saved stations;
- offline maps;
- independently governed official and current transit evidence;
- the separate global Accessible Route Only setting;
- current operating-system notification and location permission; and
- a delivery capability owned by another explicit product use.

If this was the last alert-enabled commute, remove the Commute delivery registration unless another explicit product use independently owns it. Permission itself is controlled by the operating system and does not change.

## Reset all personalization

The broad destructive control must open:

- title: **Reset all personalization?**
- body: **This clears: {covered_categories}. This keeps: {retained_categories}. Notification permission and Accessible Route Only do not change.**

Before approval, Product, Privacy, Accessibility, Content, and Operations must populate both placeholders with the exact disclosed categories shown in the current product. An empty, vague, or silently expanded list is prohibited.

The covered categories must include every saved commute, per-commute optional context, confirmation provenance, thresholds, per-commute accessibility setting, alert intent, recovery setting, derived state, delivery ledger, commute association, queue entry, and product-controlled payload copy. Remove the Commute delivery registration when no other explicit product use owns it.

The retained categories must include current offline maps, saved official structural data required for offline navigation, current independently governed official transit evidence, the operating-system permission itself, and the separate current global Accessible Route Only setting. Any separately saved station category may be retained only if the populated disclosure expressly says so and the owning personalization policy permits it.

Reset creates no commute tombstone and permits no replay after a new commute is later created.

## Delete personal data

The personal-data deletion flow must enumerate and attempt every disclosed product-controlled location:

| Deletion category | Required scope |
|---|---|
| Device-local canonical preferences and optional context | All saved commutes and every inventory-class 1 or 2 field |
| Device-local derived and delivery state | All linked class 3 and class 4 state |
| Companion product-controlled copies, if any are later approved | Every disclosed personal copy; none is approved by this policy |
| Delivery-service registrations and associations | Commute associations and the registration when no other explicit product use owns it |
| Pending queues and product-controlled payload copies | Every current or stale personal delivery copy under product control |
| Future sync or backup copy, if a later policy ever approves one | Every disclosed copy; sync and backup remain prohibited now |

Each category records exactly one result:

- **Deleted** — the product removed an existing category and has evidence of completion.
- **Not present** — the product verified the category did not exist.
- **Pending** — deletion is still in progress or verification is incomplete.
- **Failed** — deletion or verification failed.

The flow may announce completion only when every disclosed category is **Deleted** or **Not present**. Any **Pending** or **Failed** category blocks completion, remains visible, and requires a corrective action and rerun. Never collapse an unknown result into **Not present**.

Independently governed non-personal transit evidence and approved non-personal diagnostics are not personal deletion targets, but they must have no remaining commute, rider, device, token, exact origin–destination–window, or reversible join.

## Operating-system app-data clearing

After operating-system app-data clearing:

- no device-local commute, optional context, threshold, recovery setting, derived state, or delivery ledger may remain;
- no device-local delivery association or queued copy may remain;
- the product must behave as if no commute was ever saved;
- the operating system may also remove cached offline maps, which the product must not misreport as a privacy-policy decision; and
- no later notification may be sent from a legacy registration.

The delivery service cannot assume it observed local app-data clearing. The remote cleanup, token lease, or invalidation mechanism needed to guarantee removal is not approved. No duration or mechanism may be invented; this is a launch-blocking gap.

## Reinstall

A reinstall starts empty:

- no commute, preference, personalization, delivery memory, recovery state, or prior confirmation is restored;
- default backup and product restore remain prohibited;
- no legacy delivery association or queued message may produce a notification;
- current operating-system permission may be read, but it does not prove alert intent; and
- delivery remains off until the rider creates and explicitly confirms a new commute and explicitly enables alerts.

Reinstall must not infer Home, Work, a prior station, a prior window, or a prior alert choice.

## Control placement and accessibility

The primary controls for **Edit commute**, **Pause alerts**, **Resume alerts**, **Delete commute**, **Keep commute**, and **Open notification settings** must:

- appear in the bottom third of the relevant screen for one-handed reach;
- provide a target of at least 48 × 48 CSS pixels;
- be reachable and operable by keyboard, switch, and assistive technology;
- expose persistent visible labels and matching accessible names;
- preserve a predictable focus order and return focus to the initiating control after cancellation;
- move focus to the confirmation heading when a destructive dialog opens;
- announce deletion, failure, Pending work, and current permission state without relying on color; and
- have no swipe-only, long-press-only, gesture-only, or hidden destructive path.

The confirmation default focus must not make the destructive action easier to trigger accidentally than **Keep commute**.

## Failure, interruption, and retry

| Condition | Required behavior | Prohibited behavior |
|---|---|---|
| Local delete succeeds but a remote category is Pending | Selected commute is unavailable locally; show the exact category as Pending and continue safe retry or escalation | Announce full completion |
| A deletion category fails | Preserve failure evidence without retaining prohibited journey content; show Failed and a retry path | Convert to Deleted or Not present |
| Product closes during deletion | Resume category verification and show current results | Recreate the commute or forget unresolved categories |
| Permission changes during deletion | Complete deletion independently; read current permission only when the UX needs it | Keep commute data because permission is Granted |
| Queue races with pause, delete, or reset | The destructive or stop action vetoes unsent work | Deliver a stale queued copy |
| Evidence changes after resume or restoration | Evaluate only current accepted evidence | Replay the former candidate |

## Blocking decisions and evidence

The 900-second quiet-period proposal remains quarantined, non-executable design input: it is not collected, applied, or used as gate evidence. An authoritative delivery acknowledgment of **Unknown** creates the conservative unresolved-attempt lock in the [deduplication decision table](../commute/deduplication-decision-table.md); it creates no successful baseline and closes only through authoritative resolution or occurrence expiry.

The following remain **Pending** and block dependent collection or a launch claim:

- provider-specific authoritative resolver mappings for an Unknown delivery acknowledgment;
- Seen semantics, which cannot substitute for delivery acknowledgment or baseline identity;
- severity ordering and version ownership;
- correction and retraction delivery behavior;
- remote delivery topology and app-data-clear or reinstall invalidation;
- lock-screen disclosure behavior; and
- numeric diagnostic retention, aggregation ends, and privacy floors.

No observed deletion, reset, permission, remote cleanup, privacy, pilot, or launch result exists. The [privacy scenario suite](../test-cases/commute-privacy-scenarios.md) remains **Not run — Pending**.

## Review checklist

- [ ] Product verifies lifecycle, pause, resume, edit, expiry, and current-only restoration behavior.
- [ ] Privacy verifies every deletion category against the complete inventory.
- [ ] Accessibility verifies copy, focus, announcements, target size, and one-handed placement.
- [ ] Data Quality verifies removal never mutates or misstates independently governed transit truth.
- [ ] Content approves destructive, permission, failure, and completion language.
- [ ] Operations proves queue cancellation, registration ownership, and every remote deletion result.
- [ ] An approved remote cleanup rule closes the app-data-clear and reinstall gap.
- [ ] Every scenario has actual results, all six dated reviews, evidence, correction, and rerun fields.
- [x] Draft index provenance and six-role reviewer metadata align; same-version reviewer decisions and evidence remain Pending.

Every unchecked item blocks approval. This documentation commit is not evidence.
