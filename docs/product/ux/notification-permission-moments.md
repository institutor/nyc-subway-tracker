# Notification permission moments

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§25.1 and 28.2; additional applying approved specification §§13.1–13.3, 14.2, 14.5–14.6, 25.2, 28.1, 28.3, 31.4 scenarios 22–23, 31.6–31.8 scenarios 36–42, 48, and 51; commute alerts and launch quality plan Task 4; accepted Nearby and Commute Tasks 1–3 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Content, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-window-setup-flow.md#pending-execution-record-for-every-cux-fixture) |

## Purpose and authority

This artifact owns the two explicit rider actions that may begin notification-permission handling, the product pre-prompt, OS-prompt invocation boundary, capability outcomes, forbidden prompt origins, replay prevention, and Offline/reconnect behavior.

The [setup flow](commute-window-setup-flow.md) owns field validation and setup placement, the [state matrix](commute-window-state-matrix.md) owns combined states, and the [copy catalog](../content/commute-window-copy-catalog.md) owns exact language. This artifact does not own eligibility, delivery, notification copy, episode identity, retention, measurement, operations, or launch.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) remains in force. No real OS prompt, permission result, transcript, capture, reviewer decision, approval, or release evidence exists.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites §§25.1 and 28.2. This artifact additionally applies §§13.1–13.3, 14.2, 14.5–14.6, 25.2, 28.1, 28.3, scenarios 22–23, 36–42, 48, and 51, full Task 4 provenance, and accepted upstream handoffs. Product Governance reconciliation remains **Pending**. This task does not edit the index.

## Only permitted prompt origins

Permission handling may begin only after a complete valid review and one of these explicit actions inside Commute:

1. **Turn on alerts**
2. **Resume alerts**

Saving, suggesting, opening, importing, editing, or validating a commute is not alert enablement.

## First Not determined flow

For the first explicit enable action while permission is **Not determined**, show exactly:

> **Turn on commute alerts?**
>
> We'll stay silent unless a delay, service change, station issue, or required accessibility outage materially affects this saved trip. We won't notify you just because the window starts, and we may not detect every delay.
>
> This commute is saved on this device. No account or continuous location is needed.

The product actions are **Continue** and **Save without alerts**.

- **Continue** invokes the OS notification prompt immediately.
- **Save without alerts** invokes no OS prompt and produces Confirmed Paused.
- Never quote, predict, imitate, or paraphrase the OS-owned prompt text.
- Do not show the product pre-prompt until every required commute field validates.

## Permission outcome matrix

| Starting capability and action | Product prompt count | OS prompt count | Lifecycle/result | Exact rider consequence |
|---|---:|---:|---|---|
| Not determined + first explicit Turn on/Resume + Continue; OS grants | 1 | 1 | Confirmed **Active** + Granted | **Commute saved. Disruption alerts are on.** |
| Not determined + first explicit Turn on/Resume + Continue; OS denies | 1 | 1 | Confirmed **Active** intent + Denied; delivery blocked | Show **Needs notification access** and explain settings action |
| Not determined + Save without alerts | 0 | 0 | Confirmed **Paused** | **Commute saved. Alerts are paused.** |
| Already Granted + explicit Turn on/Resume | 0 | 0 | **Active** + Granted | No OS prompt; current-only reevaluation |
| Previously Denied + explicit Turn on/Resume | 0 | 0 | **Active** intent + Denied; delivery blocked | Show exact off-for-app copy and **Open notification settings** |
| OS restricted/unavailable + explicit Turn on/Resume | 0 | 0 | **Active** intent + OS restricted; delivery unavailable | **Notifications aren't available on this device. Your commute is saved, but alerts cannot be delivered.** |
| Granted then revoked outside app | 0 | 0 | **Active** unchanged; capability becomes blocked | Status updates immediately; no automatic OS prompt |
| Blocked then restored in settings | 0 | 0 | **Active** + Granted | Evaluate only current accepted evidence; no missed/stale replay |

Denied permission blocks no station board, Nearby, Map, Saved, offline map/trip, commute inspection/edit/delete, or other core subway utility.

## Previously denied and settings recovery

After denial:

- never replay the OS prompt automatically;
- never imply that tapping Resume can force the OS prompt;
- show **Open notification settings** only after an explicit commute alert action or inside that commute’s alert status;
- keep Active intent distinct from blocked delivery; and
- update status immediately when the app observes the OS capability change.

Returning from settings is not permission to notify from stale, expired, out-of-window, held, duplicate, or previously missed evidence. Only a new current Task 2 evaluation may proceed.

## Offline and reconnect

An explicit Turn on/Resume action while Offline may show the product pre-prompt and invoke the OS prompt only inside the Commute flow. Offline remains a separate current-evaluation cause.

Reconnect:

- never opens a product or OS prompt;
- never resumes a Paused commute;
- never replays missed, stale, held, or expired candidates;
- never changes permission; and
- initiates only owner-governed current reevaluation in the preserved lifecycle state.

## Forbidden prompt origins

The product pre-prompt and OS prompt must never originate from:

- app launch or Nearby launch;
- a location request, approximate/denied location fallback, or location change;
- a station board;
- Map;
- Saved;
- opening an offline trip;
- **Save station** or saved-card creation;
- **Save without alerts**;
- app foregrounding;
- reconnect;
- receipt or display of a disruption; or
- a suggested commute before explicit Turn on/Resume.

No prompt may be justified by passive station use, movement, a guessed home/work location, account activity, or background location.

## Prompt replay and counting

For one explicit first enable attempt, count at most one product pre-prompt and one OS prompt. A dismiss, denial, app restart, foreground, reconnect, route change, fresh disruption, or copy change never creates an automatic second attempt.

The OS owns whether a platform prompt can appear. Task 4 records the requested product action and observed capability result but never claims control over OS presentation.

## Accessible permission interaction

- Put purpose before the action and state the disruption-only limitation.
- Keep **Continue** and **Save without alerts** visible in a lower sheet with at least 48×48 targets.
- Announce the pre-prompt heading once, then body and actions in logical order.
- On return from the OS, announce the capability and delivery consequence without rereading the whole setup.
- Preserve focus on the alert-status/action group.
- Do not rely on color, icon, animation, or sound alone.
- Support largest text, vertical reflow, both hands, external keyboard, and screen readers.

## Exact fixture handoff

Permission evidence is owned by setup fixtures `CUX-14`–`CUX-23` and accessibility coverage in `CUX-31`. Every actual result, prompt count, OS capture, transcript, focus result, reviewer decision, date, evidence item, correction, and rerun remains **Pending** or **Not run — Pending**.

## Explicit gaps

No real OS behavior, platform variation, prompt count, settings return, capability transition, focus transcript, largest-text capture, fixed product/build, reviewer decision, approval, or launch evidence exists. Task 7 still owns notification-related data inventory and retention; later tasks own delivery and operations.

## Draft review checklist

- [ ] Only explicit Turn on alerts or Resume alerts can begin permission handling.
- [ ] The exact pre-prompt appears only for first Not determined and validated setup.
- [ ] Save without alerts produces zero prompts and Confirmed Paused.
- [ ] Granted, Denied, OS restricted, revoked, restored, Offline, and reconnect remain independent from lifecycle.
- [ ] Previously denied never loops the OS prompt.
- [ ] Forbidden origins produce zero product and OS prompts.
- [ ] Restoration and reconnect never replay missed or stale notifications.
- [ ] All actual prompt, accessibility, review, and evidence results remain Pending.

Every unchecked item blocks approval. This documentation commit is not evidence.
