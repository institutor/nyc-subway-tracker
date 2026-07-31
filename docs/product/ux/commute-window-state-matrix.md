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

The [product artifact index](../artifact-index.md) cites §§25.1 and 28.2–28.3 and lists Product, Accessibility, Content, Privacy, and Operations. This matrix additionally applies §§13.1–13.3, 14.2, 14.5–14.6, 25.2, 28.1, scenarios 22–23, 36–42, 48, and 51, full Task 4 provenance, accepted upstream handoffs, and mandatory Data Quality review because tolerance changes reset Task 3 inference. Product Governance reconciliation remains **Pending**. This task does not edit the index.

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
