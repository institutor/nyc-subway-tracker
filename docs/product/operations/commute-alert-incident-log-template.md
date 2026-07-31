# Commute alert incident log template

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 32.3, 33.5, and 34; commute alerts and launch quality plan Task 9; accepted immutable Commute Tasks 2–8 |
| Owner | Operations Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Drill results | [Not run — Pending](commute-alert-pilot-review-template.md#pending-drill-record) |

## Purpose and use

Copy this template for one fixed non-personal commute-alert incident. It records evidence and append-only decisions; it does not create policy, operational truth, a hold, a correction class, or release authority. Apply the [operations playbook](commute-alert-operations-playbook.md) and [correction policy](commute-alert-correction-policy.md).

Every blank remains **Pending** until evidence exists. A completed template is not an MTA guarantee or launch approval. Gate 0 remains **NO-GO — GATE 0 NOT PASSED**.

## Non-personal boundary

This log must not contain:

- rider, account, installation, device, advertising, or token identifiers;
- a stable pseudonym, hash, reversible key, or cross-record personal join;
- commute/window/occurrence/delivery-ledger IDs or an exact origin–destination–window combination;
- rider location, movement, permission history, accessibility-preference history, Home or Work;
- notification body, personal station text, feedback free text, or lock-screen capture;
- rider-level delivery time or another precise time that becomes joinable to a person; or
- copied personal evidence from deletion, reset, token, cross-rider, or accessibility cases.

Necessary operational incident, source, effective-period, switch-command, and aggregate queue times may be recorded only when they identify the non-personal operational incident rather than a rider. Exact personal evidence remains only in its Task 7 ledger or approved source boundary. Reference it here only with a non-personal categorical result and controlled evidence location.

## Record identity and fixed context

| Field | Required value |
|---|---|
| Incident ID | _Stable non-personal operations ID_ |
| Incident state | _Detected / Contained / Investigating / Correction blocked / Recovery proving / Released / Closed_ |
| Discovery cue | _Mass stale / bulk disappearance / mapping / duplicate / acknowledgment / wrong scope / miss / false positive / accessibility / privacy / other approved category_ |
| Discovery role | _Role, not person_ |
| First operational discovery time | _Authoritative incident time; no personal or journey time_ |
| Operating mode | _Silent / Limited pilot / No pilot_ |
| Fixed product/build | _Exact version_ |
| Fixed Tasks 2–9 versions | _Exact versions_ |
| Arrival Truth versions | _Feed health, mapping/quarantine, and recovery versions used_ |
| Pilot/sample version | _Exact frame/stratum/fixture where applicable_ |
| Current Commander role assignment | _Roster reference; no personal identifier in exported copy_ |

## Affected and unaffected scope

| Scope field | Exact operational value |
|---|---|
| Effective hold level | _None / Episode / Route-feed group / Global_ |
| Exact affected route/feed group | _Operational scope or Not applicable_ |
| Exact affected direction/segment/constituent/path/period | _Narrowest supported operational scope; no saved journey_ |
| Exact affected episode class | _Task 6 controlled operational class; no personal episode ID_ |
| Delivery-system boundary | _Affected delivery boundary or Not applicable_ |
| Explicitly unaffected routes/feed groups | _Required list_ |
| Explicitly unaffected episodes | _Required category or list_ |
| Station-board isolation | _Unaffected / independently degraded by Arrival Truth; evidence_ |
| Saved-state isolation | _Commutes, alert intent, permission, ledger, and ARO unchanged; evidence_ |
| Privacy/Accessibility isolation | _Unaffected boundary or escalated domain_ |

Never leave unaffected scope implicit.

## Source, effective-period, and currentness timeline

Append one row for every material evidence transition. Never edit or delete an earlier row.

| Sequence | Operational time | Source type/version | Effective period | Authoritative age/state | Scope | Evidence disposition | Reason | Supersedes or conflicts with |
|---|---|---|---|---|---|---|---|---|
| 001 | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Accepted / Rejected / Quarantined / Unresolved_ | _Pending_ | _None / sequence_ |

Record real-time ages against exact 90/91/180/181-second boundaries, alert ages against 600/601 seconds, fixed bulk-loss denominator and proportion, mapping conflicts, and recovery-pair state when applicable. Phone time cannot replace authoritative chronology.

## Decision package

| Decision area | Expected under fixed policy | Actual | Evidence and controlled reason |
|---|---|---|---|
| Task 2 eligibility gates | _Pending_ | _Pending_ | _Pending_ |
| Task 3 threshold/baseline/persistence/reset | _Pending_ | _Pending_ | _Pending_ |
| Task 5 timing/final recheck/class/template | _Pending_ | _Pending_ | _Pending_ |
| Task 6 identity/equivalence/prior delivery | _Pending_ | _Pending_ | _Pending_ |
| Task 7 intent/capability/privacy/queue state | _Pending_ | _Pending_ | _Pending_ |
| Task 8 measure/sentinel classification | _Pending_ | _Pending_ | _Pending_ |
| Final operational outcome | _Continue / Hold / Suppress / Correct / Release hold_ | _Pending_ | _Pending_ |
| Delivery disposition | _No attempt / Success / Failed / Unknown acknowledgment_ | _Pending_ | _Non-personal categorical evidence pointer_ |
| Visible and assistive consequence | _Pending_ | _Pending_ | _No message body or personal capture_ |
| Materiality | _Material / Not material / Unresolved_ | _Pending_ | _Exact operational before/after meaning and rider-choice consequence, without a saved journey_ |

Unknown acknowledgment is preserved as Unknown; it is never converted to Success or Failed and never retried.

## Common-cause census

| Category | Frozen population | Suspected | Confirmed | Cleared with evidence | Unresolved | Scope-expansion decision |
|---|---:|---:|---:|---:|---:|---|
| Equivalent deliveries | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Wrong direction/segment | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Stale/resolved claims | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Deterministic misses | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Accessibility defects | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Privacy defects | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |

The census may widen containment only from evidence. It never changes a frozen Task 8 sample denominator.

## Hold, switch, queue, and surface record

| Transition | Scope | Before | Command/action | Commander role | Executor role | Independent verifier role | Unsent queue result | Final switch check | Boards/unaffected routes | Operational time |
|---|---|---|---|---|---|---|---|---|---|---|
| 001 | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Canceled / None / Failed / Pending_ | _Pending_ | _Pending_ | _Pending_ |

For every transition, apply:

> **effective hold = global OR matching route/feed-group OR matching episode**

Record all nested holds. Releasing one row cannot silently release another. There is no automatic expiry. Queue records use aggregate counts and categorical outcomes only; no token, payload, commute, or rider key.

## Correction record

| Field | Required value |
|---|---|
| Correction-policy step | _1 / 2 / 3 / 4 / 5_ |
| Original supported meaning | _Non-personal operational scope and consequence_ |
| Corrected supported meaning | _Non-personal operational scope and consequence_ |
| Evidence before | _Accepted/rejected/quarantined/unresolved evidence references_ |
| Evidence after | _Newer accepted evidence references_ |
| Reason | _Controlled correction reason_ |
| Rider-choice consequence | _Material / Not material / Unresolved and why_ |
| Delivery proof | _Categorical result; exact personal evidence remains in Task 7 boundary_ |
| Required state | _None / Rider correction required_ |
| Class/channel/template | _Approved fixed reference / Pending — no improvised message_ |
| Internal communication | _Incident ID, scope, evidence state, hold, next evidence, owner_ |
| Product approval | _Decision/date/evidence_ |
| Content approval | _Decision/date/evidence_ |
| Operations approval | _Decision/date/evidence_ |
| Data Quality approval | _Decision/date/evidence_ |
| Accessibility approval | _Decision/date/evidence or Not applicable_ |
| Privacy approval | _Decision/date/evidence or Not applicable_ |

Preserve original and corrected values. A correction cannot serve as positive transit evidence.

## Accessibility and privacy classification

| Domain | Classification | Containment | Evidence retained here | Evidence retained only in owner boundary | Required release approval |
|---|---|---|---|---|---|
| Accessibility | _None / suspected / accepted_ | _Pending_ | _Non-personal path/equipment consequence_ | _Any personal accessibility preference/history_ | _Accessibility + Data Quality + Commander_ |
| Privacy | _None / suspected / accepted_ | _Pending_ | _Non-personal defect category and deletion/containment result_ | _Token, personal data, rider/device evidence, exact delivery_ | _Privacy + Data Quality + Commander_ |

## Recovery and release evidence

| Requirement | Fixed expected evidence | Actual | Reviewer/date | Evidence | Result |
|---|---|---|---|---|---|
| Cause-specific prerequisite | _Two-snapshot / coherent mapping / corrected delivery version / accessibility / privacy / global package_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Corrected fixed product/rule version | _Exact version_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Original-boundary rerun | _Exact fixtures_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Integrated rerun | _Exact fixtures_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Holdout rerun | _Exact fixtures_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Shadow rerun | _Exact fixtures_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Current Tasks 2–7 reevaluation | _Every gate and final check_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Remaining nested holds | _Every matching scope_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Queue and no-replay check | _No old held/failed/stale/ended/Offline/outside-window/Unknown work_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |
| Independent release approvals | _Per failed-domain matrix_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |

**Release hold** is an operational switch transition, not a Task 5 recovery message. Record current-only evaluation and an empty legacy queue.

## Append-only incident transitions

| Sequence | State before | New evidence or command | State after | Outcome | Owner role | Reviewers | Operational time | Evidence | Correction/rerun link |
|---|---|---|---|---|---|---|---|---|---|
| 001 | _None_ | _Pending_ | _Detected_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |

Never overwrite, renumber, delete, or backdate a transition. A correction appends a new row and preserves the original failure.

## Internal update template

> **Incident:** {incident_id}
>
> **Affected:** {affected_scope}
>
> **Unaffected:** {unaffected_scope}
>
> **Evidence:** {accepted_rejected_quarantined_unresolved_state}
>
> **Hold:** {effective_hold_and_nested_holds}
>
> **Queue:** {aggregate_cancellation_or_delivery_state}
>
> **Boards:** {isolation_result}
>
> **Next release evidence:** {required_evidence}
>
> **Owner:** {role}

Issue an update on material state change. No numeric communications SLA is approved.

## Closure checklist

- [ ] Original and corrected evidence and decisions remain append-only.
- [ ] Affected and unaffected operational scope are exact.
- [ ] Queue, switch, final check, saved-state, ARO, board, and unrelated-route isolation are evidenced.
- [ ] No prohibited personal identifier, text, history, join, or precise personal time appears.
- [ ] Correction materiality, class/channel status, communication, and approvals are complete.
- [ ] Recovery includes corrected version, four rerun layers, current reevaluation, remaining holds, and no replay.
- [ ] Commander and independent domain approvals are recorded.
- [ ] Task 10 receives the record without a Task 9 release claim.

Every unchecked item blocks closure. This documentation commit is not evidence.
