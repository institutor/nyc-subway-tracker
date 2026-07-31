# Commute data inventory

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

This inventory defines the minimum data permitted for saved subway commute alerts, why each item exists, where it may be present, how long its product lifecycle lasts, and what a rider action must remove. It consumes the [commute window contract](../commute/commute-window-contract.md), [field dictionary](../commute/commute-window-field-dictionary.md), [eligibility contract](../commute/notification-eligibility-contract.md), [threshold policy](../commute/delay-threshold-policy.md), [timing policy](../commute/notification-timing-policy.md), [recovery policy](../commute/recovery-notification-policy.md), [episode contract](../commute/disruption-episode-contract.md), and [deduplication table](../commute/deduplication-decision-table.md) without changing their product decisions.

The inventory is a data-minimization ceiling, not a collection backlog. An item absent from this inventory is prohibited until Privacy, Product, and the relevant data owner approve its purpose, lifecycle, rider control, deletion behavior, and test evidence. No numeric retention duration, account identifier, inferred destination, capacity claim, or additional identifier is created here.

This artifact is **Draft**. It demonstrates no collection, deletion, permission, privacy, reviewer, pilot, or launch evidence. The authoritative posture remains **NO-GO — GATE 0 NOT PASSED**. The separate accessibility posture remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED**. Task 7 waives neither blocker.

## Product Governance alignment

The product artifact index and this header align on the full Task 7 provenance, Privacy ownership, and the six-role reviewer set including Data Quality. The index and this artifact remain **Draft**, approval evidence remains **Pending**, and header alignment is not approval or launch evidence.

## Privacy boundary

- No account is required or created for commute alerts.
- Canonical saved-commute data is device-local. Remote delivery copies are neither backup nor synchronization.
- Default device backup, product backup, cross-device sync, and restore are prohibited.
- Continuous background location, movement history, passive station visits, repeated-use history, and inferred **Home** or **Work** are prohibited.
- Saved commutes are private rider preferences. They never establish operational service, arrival, accessibility, or incident truth.
- Notification permission is requested and a delivery capability is associated only after an explicit **Enable alerts** action. Saving a commute without alerts creates neither a permission prompt nor a delivery capability.
- The product reads current operating-system capability when needed. It does not retain permission-transition history.
- Location is unnecessary for a saved commute. Any future location convenience requires a separately approved, explicit opt-in, current-use-only purpose, and a complete saved-trip fallback.
- Personal events may not be collected for later aggregation. Analytics are limited to reviewed, coarse, non-personal diagnostics that cannot reconstruct a rider journey.

Unless a row explicitly says **Non-personal**, the row is personal while linked to a commute or delivery capability.

## 1. Necessary canonical preference

| Data item | Exact purpose | Source | Permitted storage | Lifecycle | Rider control | Deletion result | Fallback when absent |
|---|---|---|---|---|---|---|---|
| Opaque device-local commute ID | Join one saved preference to its own evaluation and delivery state without naming the rider | Created only when the rider confirms a commute | Canonical device-local preference only; never an account, analytics, advertising, or cross-device key | Exists while the commute is Active, Paused, or Expired; Deleted has no record or tombstone | Create through confirmation; delete that commute; reset all personalization; delete personal data | Remove the ID and every commute-linked association; do not preserve a tombstone | Treat as no saved commute |
| Commute lifecycle: **Active**, **Paused**, or **Expired** | Determine whether current occurrences may be evaluated and delivered | Rider action plus accepted Task 1 lifecycle rules | Canonical device-local preference | Retained with the commute; **Deleted** means absence, not a stored lifecycle value | Pause, resume, delete, or reset | Remove with the commute | No evaluation or delivery |
| Confirmed weekdays, New York start and end times, and lead time | Generate exact local occurrences and their evaluation interval | Explicit rider confirmation | Canonical device-local preference | Retained while the commute exists, including Paused and Expired | Edit and reconfirm; delete or reset | Remove with the commute | No occurrence; alert cannot be enabled |
| Exact origin and origin constituent; exact destination and destination constituent | Resolve the saved subway journey at constituent precision | Explicit rider selection and confirmation | Canonical device-local preference | Retained while the commute exists | Edit and reconfirm; delete or reset | Remove with the commute | Setup remains incomplete; no evaluation |
| Normalized direction paired with actual destination or terminal | Prevent broad or opposite-direction matching | Deterministic result of the rider-confirmed journey under the Task 1 field dictionary | Canonical device-local preference | Retained while the commute exists; recomputed only after a rider edit and reconfirmation | Edit endpoints or direction and reconfirm; delete or reset | Remove with the commute | Hold for stronger evidence; no notification |
| Primary route | Define the rider-confirmed main subway service | Explicit rider confirmation | Canonical device-local preference | Retained while the commute exists | Edit and reconfirm; delete or reset | Remove with the commute | Setup remains incomplete; no evaluation |
| Explicit alternate routes, possibly empty | Permit only rider-confirmed alternates to be considered | Explicit rider choice; never inferred from repeated use | Canonical device-local preference | Retained while the commute exists | Add, remove, or edit and reconfirm; delete or reset | Remove with the commute | Empty alternates are valid; evaluate the primary route only |
| Per-commute **Accessible Route Only** and **Avoid Stairs** values, stored separately | Apply the rider-confirmed accessibility constraints to this exact commute | Explicit rider choice | Canonical device-local preference; not analytics or operational truth | Retained while the commute exists | Change and reconfirm; delete or reset | Remove with the commute; do not change the separate global Accessible Route Only value | Use the confirmed default defined by setup policy; never infer a need |
| Added-time tolerance: exactly 300, 600, or 900 seconds; default 300 | Apply the rider-confirmed Task 3 threshold | Explicit rider choice or the approved default | Canonical device-local preference | Retained while the commute exists | Select an allowed value and reconfirm; delete or reset | Remove with the commute | Use 300 seconds only for a newly confirmed commute |
| Confirmation provenance: accepted field-set version, confirmation action time, action type, and proposal-source labels | Prove which explicit confirmation established the current preference version | Confirmation action and the controlled Task 1 source labels | Canonical device-local preference | Retained with the current confirmed preference version; replaced, not appended as behavioral history, after reconfirmation | Edit and reconfirm; delete or reset | Remove with the commute | Preference is unconfirmed and cannot be evaluated |
| Alert intent lifecycle, separate from current operating-system capability | Preserve the rider’s explicit enable or disable choice without converting permission state into intent | Explicit rider action | Canonical device-local preference | Retained while the commute exists; pause does not silently change it | Enable or disable alerts; delete or reset | Remove with the commute | Alerts are off |
| `recovery_updates`: **Off** or **On**, default **Off** and prospective only | Control whether qualifying recovery messages may be delivered after the choice | Explicit rider action or approved default | Canonical device-local preference | Retained while the commute exists; changing it affects future decisions only | Toggle; delete or reset | Remove with the commute | Off; no recovery delivery |

## 2. Optional rider-supplied context

| Data item | Exact purpose | Source | Permitted storage | Lifecycle | Rider control | Deletion result | Fallback when absent |
|---|---|---|---|---|---|---|---|
| Preferred origin entrance | Evaluate an explicitly chosen entrance and support truthful guidance | Explicit rider selection only | Canonical device-local preference | Retained while the commute exists or until removed by the rider | Add, edit, clear, delete, or reset | Remove with the field or commute | Absence is valid; use no entrance preference and do not infer one |
| Preferred destination exit | Evaluate an explicitly chosen exit and support truthful guidance | Explicit rider selection only | Canonical device-local preference | Retained while the commute exists or until removed by the rider | Add, edit, clear, delete, or reset | Remove with the field or commute | Absence is valid; use no exit preference and do not infer one |
| Preferred transfer point or transfer instruction | Evaluate an explicitly chosen transfer | Explicit rider selection only | Canonical device-local preference | Retained while the commute exists or until removed by the rider | Add, edit, clear, delete, or reset | Remove with the field or commute | Absence is valid; use the confirmed journey without a rider preference |
| Explicit alternate-route detail beyond the primary-route requirement | Evaluate an alternate the rider deliberately supplied | Explicit rider selection only | Canonical device-local preference | Retained while the commute exists or until removed by the rider | Add, edit, clear, delete, or reset | Remove with the field or commute | Empty is valid; never infer from visits or repeated use |
| Explicit recovery choice for a presented disruption | Apply the rider’s selected recovery behavior only to its approved scope | Explicit rider action | Device-local commute-linked decision state | Retained only while it can affect the current approved occurrence or episode | Choose, replace where policy permits, delete, or reset | Remove when irrelevant or with the commute | No recovery choice; do not infer one |

Absence of optional context is always valid. Passive observation, repeated-use history, automatic suggestion history, and inferred preferences are outside this inventory and prohibited.

## 3. Necessary derived evaluation state

| Data item | Exact purpose | Source | Permitted storage | Lifecycle | Rider control | Deletion result | Fallback when absent |
|---|---|---|---|---|---|---|---|
| Task 3 baseline family, metric, unrounded value, source, version, exact scope, period, service date, tolerance, and coherence timestamps | Compare current accepted evidence to the correct rider-confirmed threshold without inventing a proxy | Accepted Task 3 baseline derivation from authoritative operational evidence and the confirmed commute | Device-local commute-linked evaluation state; personal while linked | Retain only while it can affect a valid occurrence; replace under Task 3 version rules; remove on owner reset or when irrelevant | Change the commute or tolerance and reconfirm; delete or reset | Remove the linked baseline and all derived associations | Hold for stronger evidence; send nothing |
| Candidate decision state: occurrence, current gate states, threshold/persistence state, and candidate disposition | Complete one deterministic Task 2–6 evaluation without treating an intermediate result as delivery | Current accepted operational inputs plus the confirmed preference and approved rules | Device-local commute-linked evaluation state | Retain only while it can affect the occurrence; supersede or remove when the opportunity ends, becomes irrelevant, or an owner resets it | Pause, edit and reconfirm, disable alerts, delete, or reset | Remove linked candidate state and pending effect | Re-evaluate from current evidence if still eligible; otherwise send nothing |

Derived state does not extend the approved measurement period, tolerance, freshness boundary, incident continuity, or retention period. It cannot become operational truth, a behavioral profile, or journey analytics.

## 4. Minimal personal delivery ledger

| Data item | Exact purpose | Source | Permitted storage | Lifecycle | Rider control | Deletion result | Fallback when absent |
|---|---|---|---|---|---|---|---|
| Exact occurrence key and confirmed preference version | Bind delivery memory to one Task 1 occurrence and preference version | Approved occurrence generation and current confirmed preference | Device-local commute-linked delivery ledger | Retain only while needed to suppress replay or apply an approved recovery rule for that saved commute | Pause, edit and reconfirm, delete, or reset | Remove with the commute or owner-approved ledger reset | Do not claim prior delivery; if equivalence cannot be proven, Hold for stronger evidence rather than risk a duplicate |
| Operational-root ID, disruption-episode IDs, commute-impact delivery-group ID, and represented episode IDs | Apply Task 6 identity and cross-source deduplication | Accepted Task 6 normalization | Device-local ledger as immutable references; never a rider identity or analytics key | Retain only while the identity can affect deduplication or recovery for the occurrence | Delete commute or reset; no rider-facing mutation of evidence identity | Remove all commute-linked references | Hold for stronger evidence; no duplicate-prone send |
| Last successful delivery ID, accepted delivery time, and message class | Prove whether a materially equivalent initial, update, or recovery message was successfully delivered | Authoritative successful-delivery result under Task 5 and Task 6 | Device-local commute-linked ledger | Retain only while needed for deduplication or approved recovery of the occurrence | Pause, delete, or reset; resume and edit never clear memory to force a resend | Remove with the commute or reset | An Unknown acknowledgment is never written here. If an unresolved-attempt record exists, its exact lock controls; otherwise Hold for stronger evidence when equivalence cannot be proven |
| Single unresolved delivery-attempt record: immutable attempt ID; occurrence key; confirmed preference version; delivery group; represented episode/impact IDs; frozen normalized impact fingerprint; frozen class and payload version; authoritative attempt time; exact state **Delivery unresolved — acknowledgment Unknown**; resolution evidence empty until authoritative resolution | Prevent a potentially delivered message from being duplicated without converting Unknown into Success or Failed | A delivery attempt for which authoritative evidence proves neither Success nor Failed | Device-local commute-linked delivery ledger; one append-only record per unresolved attempt and no analytics copy | Keep the active lock only until authoritative Success/Failed resolution or occurrence expiry; on expiry append **Expired unresolved** without reclassification; retain only under the still-Pending owner lifecycle | Pause retains the lock; delete or reset removes the personal record and all linked work; resume or edit cannot clear it to force a resend | Remove with the commute or reset and deliver nothing; deletion is not delivery resolution | Write no successful baseline, represented-window marker, recovery entitlement, Seen state, correction entitlement, retry, or replay. Hold every same-occurrence, same-group candidate equivalent to or dependent on the unresolved impact, including after an edit that leaves normalized scope unchanged; independently proven different occurrences/groups remain eligible for their own evaluation |
| Delivered baseline; affected points and normalized direction | Compare a later candidate with what the rider actually received | Exact accepted delivery snapshot | Device-local commute-linked ledger | Retain only while needed for material-change or recovery comparison | Delete commute or reset | Remove with the commute or reset | No comparison is allowed; Hold for stronger evidence where comparison is required |
| Ordered severity and scale with approved version, when an ordering is approved | Determine whether a later impact is materially different | Accepted Task 6 ordered value and version | Device-local commute-linked ledger | Retain only while the approved comparison can affect the occurrence | Delete commute or reset | Remove with the commute or reset | Do not invent an ordering. Without an approved ordering, the severity branch cannot pass; if no other material branch passes, preserve Task 6 **Suppress — Below material change** |
| Unrounded delivered added time and its approved basis | Compare material added-time change without rounding drift | Accepted Task 3 and Task 5 delivery snapshot | Device-local commute-linked ledger | Retain only while the comparison can affect the occurrence | Delete commute or reset | Remove with the commute or reset | Do not infer or reconstruct it; Hold when required |
| Delivered active and window-end times | Apply currentness, opportunity, and recovery boundaries | Accepted Task 1, Task 5, and Task 6 decision snapshot | Device-local commute-linked ledger | Retain only while the boundaries can affect the occurrence | Delete commute or reset | Remove with the commute or reset | Opportunity cannot be extended; send nothing |
| Delivered verified action or alternative and evidence version | Prevent wording-only or unverified-alternative updates | Accepted Task 5 action and its evidence version | Device-local commute-linked ledger | Retain only while comparison can affect the occurrence | Delete commute or reset | Remove with the commute or reset | Omit an unverified alternative; Hold if it is material |
| Recovery setting at original delivery, current recovery setting, and prospective-change marker | Enforce prospective-only recovery behavior | Explicit rider setting plus the accepted original delivery snapshot | Device-local commute-linked ledger | Retain only while an approved recovery can still be evaluated | Toggle recovery updates; delete or reset | Remove with the commute or reset | Recovery is Off |
| Proposed quiet-period start, expiry, and reason | Preserve a Pending design question without creating product behavior | No permitted source while the proposal is unapproved | **Prohibited: do not collect or store** | No lifecycle exists while unapproved | Not applicable; there is no rider or operator state | No record may exist | Do not collect, derive, apply, or use the proposal as a gate, Send, Suppress, Hold, retry, or replay input |
| Immutable pointers to non-personal source evidence and transformation versions | Make a delivery decision reviewable without copying source history into the personal ledger | Accepted operational evidence catalog | Device-local commute-linked references only | Retain only while linked delivery memory is necessary | Delete commute or reset | Remove pointers; retain only independently governed non-personal evidence | Review uses current independently governed evidence; no personal source-history copy |

Pause retains the preference, minimal delivery memory, and any active unresolved-attempt lock but stops delivery. Resume evaluates current evidence and never replays missed, failed, Unknown, or already represented messages. Editing and reconfirming never manufacture a resend or clear an unresolved-attempt lock. Delete and reset clear the personal ledger and permit no late delivery.

## 5. Delivery capability and queued copies

| Data item | Exact purpose | Source | Permitted storage | Lifecycle | Rider control | Deletion result | Fallback when absent |
|---|---|---|---|---|---|---|---|
| Operating-system delivery token or equivalent capability | Address a notification to the current installation after explicit alert enablement | Current operating-system delivery service after explicit alert enablement and current **Granted** capability | Minimum device-local association and minimum delivery-service registration; never analytics, identity, operational truth, backup, or profile | Associate only while at least one explicitly enabled product use requires it and current capability permits; suspend or remove on revocation; remove when the last owning use is deleted | Enable or disable alerts; change operating-system permission; delete commute; reset; delete personal data | Remove the commute association and queued work; remove the shared Commute registration when no other explicit product use owns it | Show the exact unavailable state; no remote delivery |
| Commute-to-capability association | Permit only an explicitly enabled saved commute to use the current installation’s delivery capability | Explicit enable action plus current **Granted** read | Minimum device-local and delivery-service association; account-free and not a sync key | Exists only while that commute is alert-enabled, present, and currently permitted | Disable, pause, delete, reset, or change operating-system permission | Remove or suspend as required; pause retains intent but permits no delivery | Saved commute remains usable without alerts |
| Pending delivery queue entry | Carry one already eligible current message to delivery | Accepted Tasks 2–6 decision | Minimum delivery-service operational copy, linked only for delivery | Exists only while delivery remains current and permitted; cancellation, supersession, deletion, reset, or capability loss makes it ineligible | Pause, disable, delete, reset, or revoke permission | Cancel and remove every linked entry | No delivery; later restoration is current-only with no replay |
| Minimum rendered notification payload | Present the approved current message | Accepted Task 5 content decision | Transient device and delivery-service copies required to render delivery; never backup, sync, analytics, or profile | Exists only as required for current delivery and its operating-system presentation behavior; no additional retention is approved here | Operating-system notification controls; delete commute, reset, or delete personal data for product-controlled copies | Remove all product-controlled queued and retained copies; operating-system surfaces follow disclosed platform behavior | In-app current state remains available when the rider opens the product |

The canonical preference remains device-local. Every delivery-service copy must have a disclosed purpose, minimum necessary fields, named operational access roles, account-free handling, a deletion path, and no reuse for analytics, advertising, profiling, sync, or backup. A token contains no trip details. A payload contains only the approved message fields needed for delivery.

The remote cleanup mechanism after operating-system app-data clearing or reinstall is not yet approved. No token lease, invalidation rule, or duration may be invented. This is a blocking privacy gap, not permission to retain indefinitely.

## Ephemeral operational inputs, not preferences

The following may be read for a current decision but may not be converted into saved commute preference, personal history, or operational truth owned by this feature:

- current arrivals, incidents, planned-service evidence, equipment status, and accessibility-path evidence;
- current source health, coherence, freshness, anomaly, and quarantine results;
- current operating-system permission or delivery capability, read only when needed with no transition history, plus current connectivity and current authoritative time;
- rendered recommendations and candidate payload construction; and
- current delivery response needed for the accepted Task 6 ledger update, including an authoritative resolution linked to the exact immutable attempt.

Operational evidence remains under its source owner. Only the minimal immutable pointers and decision snapshots enumerated above may enter a personal ledger.

## Reviewed non-personal diagnostics ceiling

Diagnostics are allowed only when a Privacy review proves the record is coarse, purpose-limited, non-personal, non-linkable, and incapable of reconstructing a rider journey. A permitted record may contain only:

- source type and authoritative or retrieval time needed to evaluate the source;
- necessary operational route, station, direction, segment, train, or equipment scope;
- transformation version and controlled result;
- product decision and controlled reason;
- diagnostic purpose, owner, and approved access roles; and
- creation plus approved deletion or aggregation end.

The diagnostic owner must define and approve the deletion or aggregation end before collection. This artifact does not invent a duration.

Diagnostics must not contain:

- rider, device, account, advertising, or stable pseudonymous identifiers;
- delivery tokens, commute IDs, occurrence IDs, window IDs, or delivery-group IDs;
- an exact origin–destination–window combination;
- location, movement, station-visit, or journey history;
- current or historical permission state;
- Accessible Route Only, Avoid Stairs, or another accessibility preference;
- notification message bodies or rider-supplied context;
- reversible hashes, join keys, or a set of fields that becomes a stable pseudonym; or
- row-level events retained for later aggregation.

No personal event becomes permissible merely because it may be aggregated later.

## Access and purpose separation

| Data boundary | Permitted purpose | Minimum access | Prohibited reuse |
|---|---|---|---|
| Canonical device-local preference | Rider-controlled setup and current commute evaluation | Product behavior on the current installation | Account creation, backup, sync, profiling, analytics, operational truth |
| Device-local evaluation and delivery ledger | Current eligibility, deduplication, and approved recovery | Current installation’s commute decision behavior | Journey history, personalization beyond the confirmed commute, analytics |
| Delivery-service capability and queue | Current push delivery only | Named delivery operations roles required to operate and delete it | Content analysis, advertising, profiling, backup, sync |
| Independently governed non-personal operational evidence | Transit truth, source quality, and review | Roles approved by its source owner | Joining to a commute or rider |
| Reviewed coarse non-personal diagnostics | Approved reliability or quality question | Named diagnostic owner and approved roles | Personal monitoring, journey reconstruction, later enrichment |

## Blocking decisions and evidence

The following remain **Pending** and block any dependent collection or launch claim:

- whether a replacement quiet-period policy and newly versioned fixtures receive all required owner approvals; until then the quarantined 900-second proposal is not collected, applied, or used as gate input;
- the exact Seen definition and any future approved replacement quiet-period semantics;
- provider-specific evidence mappings that can authoritatively resolve Unknown to Success or Failed, plus the owner-approved lifecycle for expired unresolved records; the conservative Unknown state and lock already apply without inventing those mappings;
- controlled severity ordering and version ownership;
- correction and retraction delivery behavior;
- remote delivery topology and cleanup after app-data clearing or reinstall;
- lock-screen disclosure behavior; and
- numeric diagnostic retention, aggregation ends, and privacy floors.

No observed deletion, permission, privacy, pilot, accessibility, or launch result exists. Scenario rows remain **Not run — Pending** until the [privacy scenarios](../test-cases/commute-privacy-scenarios.md) carry fixed inputs, actual results, all six reviewer decisions, dated evidence, corrections, and reruns.

## Review checklist

- [ ] Privacy confirms every collected field appears in one class with a necessary purpose.
- [ ] Product confirms saved preferences never become operational truth.
- [ ] Accessibility confirms per-commute and global accessibility settings remain separate through delete and reset.
- [ ] Data Quality confirms operational inputs and personal decision state remain separate.
- [ ] Content confirms delivered payload and lock-screen disclosure are approved.
- [ ] Operations confirms delivery-service copies, access roles, deletion paths, and last-owner cleanup.
- [ ] Product, Operations, Data Quality, and Privacy confirm Unknown writes only the single unresolved-attempt record, no successful baseline, and blocks its exact duplicate-prone scope until authoritative resolution or occurrence expiry.
- [ ] Privacy approves a remote cleanup rule without inventing a duration.
- [ ] Each prohibited identifier and reconstruction path is verified absent.
- [ ] All privacy scenarios pass with complete evidence and reruns after corrections.
- [ ] Product Governance approval evidence is recorded against the aligned provenance and reviewer set.

Every unchecked item blocks approval. This documentation commit is not evidence.
