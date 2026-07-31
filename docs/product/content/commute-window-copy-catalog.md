# Commute window copy catalog

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§25.1–25.2 and 28.2; additional applying approved specification §§13.1–13.3, 14.2, 14.5–14.6, 28.1, 28.3, 31.4 scenarios 22–23, 31.6–31.8 scenarios 36–42, 48, and 51; commute alerts and launch quality plan Task 4; accepted Nearby and Commute Tasks 1–3 artifacts |
| Owner | Content Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../ux/commute-window-setup-flow.md#pending-execution-record-for-every-cux-fixture) |

## Purpose and authority

This catalog owns exact rider-facing setup, review, permission, lifecycle, structural-error, control, delete, and reset-handoff language for Task 4. Visible and assistive output use the same meaning and consequence.

The [setup flow](../ux/commute-window-setup-flow.md), [state matrix](../ux/commute-window-state-matrix.md), and [permission moments](../ux/notification-permission-moments.md) own when each string appears. The [rider language rules](../contracts/rider-language-rules.md) and [transit product glossary](../contracts/transit-product-glossary.md) retain shared terminology.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) remains in force. No rendered copy, assistive transcript, comprehension result, reviewer decision, approval, or release evidence exists.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites §§25.1–25.2 and 28.2 and lists Product, Accessibility, Content, and Privacy. This catalog additionally applies §§13.1–13.3, 14.2, 14.5–14.6, 28.1, 28.3, scenarios 22–23, 36–42, 48, and 51, full Task 4 provenance, accepted upstream handoffs, and mandatory Data Quality and Operations review because it expresses threshold, capability, and delivery boundaries. Product Governance reconciliation remains **Pending**. This task does not edit the index.

## Entry, step, and disclosure labels

| Use | Exact visible text | Equivalent assistive requirement |
|---|---|---|
| Primary creation | **Set up a commute** | Announce as a button and that it begins a new subway commute setup |
| Additional window | **Add commute** | Announce as a button; do not imply duplication of another window |
| Saved station entry | **Set up from this saved station** | Name the selected station with the action |
| Station entry | **Set up from this station** | Name the station with the action |
| Offline/stored trip entry | **Set up from this trip** | Announce that imported values are proposals, not current service |
| Step 1 | **Trip** | Heading level and step position |
| Step 2 | **Days** | Heading level and step position |
| Step 3 | **Time** | Heading level and step position |
| Step 4 | **Review and alerts** | Heading level and step position |
| Optional trip fields | **Trip details** | Expand/collapse state and contained optional fields |
| Accessibility group | **Accessibility preferences** | Group Accessible Route Only and Avoid Stairs as independent controls |
| Advanced threshold group | **Delay sensitivity** | Expand/collapse state and current selection |
| Review heading | **Review your commute** | One coherent group containing every saved field |
| Review instruction | **Check the route and direction before turning on alerts.** | Announce before the route/direction/destination review group |
| Missing optional entrance | **No preferred entrance selected** | Do not say Any entrance or imply access coverage |

## Delay sensitivity copy

Use exactly:

- **More than 5 minutes added — default**
- **More than 10 minutes added**
- **More than 15 minutes added**

Show this explanatory copy with the control:

> This setting applies to added-time estimates. Relevant service changes and accessible-path problems may still alert you.

Do not expose internal seconds, comparator symbols, raw thresholds, or infer that an immediate confirmed incident is below the rider’s tolerance.

## Review actions and confirmations

| Situation | Exact text | Assistive consequence |
|---|---|---|
| Explicit enable | **Turn on alerts** | Button; explains that permission handling may follow |
| Save without delivery | **Save without alerts** | Button; result is Confirmed Paused and no prompt |
| Granted result | **Commute saved. Disruption alerts are on.** | Announce capability and Active intent once |
| Paused save result | **Commute saved. Alerts are paused.** | Announce saved state and no automatic watch |
| Incomplete validation | **Finish your trip details before turning on alerts.** | Error summary once, then focus first invalid field |
| Route/direction/destination mismatch | **This direction does not match the selected destination. Choose a route and direction that serve this trip.** | Name mismatched group without raw direction code |

No confirmation copy promises delivery, detection of every delay, current service, current accessibility, or a specific notification time.

## Permission copy

For the first Not determined explicit enable action, use exactly:

> **Turn on commute alerts?**
>
> We'll stay silent unless a delay, service change, station issue, or required accessibility outage materially affects this saved trip. We won't notify you just because the window starts, and we may not detect every delay.
>
> This commute is saved on this device. No account or continuous location is needed.

Use **Continue** and **Save without alerts** as actions. Do not reproduce or predict OS prompt copy.

| Capability state | Exact text |
|---|---|
| Denied | **Notifications are off for this app. Turn them on in device settings to receive commute disruption alerts.** |
| Denied status label | **Needs notification access** |
| Settings action | **Open notification settings** |
| OS restricted/unavailable | **Notifications aren't available on this device. Your commute is saved, but alerts cannot be delivered.** |

Permission copy never says that the commute is Paused or Expired unless lifecycle independently has that state.

## Control labels

| Control | Exact text | Required meaning |
|---|---|---|
| Edit | **Edit commute** | Opens explicit fields without mutation |
| Commit edit | **Save changes** | Saves only reviewed changes |
| Cancel edit | **Cancel** | Preserves exact prior fields and state |
| Pause | **Pause alerts** | Rider changes lifecycle to Paused; does not delete |
| Resume | **Resume alerts** | Rider requests Active intent; permission remains independent |
| Delete entry | **Delete commute** | Opens named destructive confirmation |
| Delete alternative | **Keep commute** | Cancels deletion and preserves exact state |
| Deleted confirmation | **Commute deleted.** | Announces removal of the one selected commute |

No core action is represented only by an icon, swipe, long press, color, or hidden settings path.

## Structural-change templates

Use exact placeholders only with owner-supplied rider-recognizable values.

### Saved card removed

> Your saved station was removed. This commute still uses {station}.

This does not say that the commute was deleted, expired, or remapped.

### Route relationship invalid

> {route} no longer matches {station} for {direction}. Review your trip to turn alerts back on.

`{direction}` includes the normalized rider-facing direction and actual destination or terminal context. Do not expose a raw suffix or code.

### Delete confirmation

Heading:

> **Delete this commute?**

Body:

> This removes {origin} to {destination} and its alert settings from this device. Saved stations, offline maps, and notification permission do not change.

Actions are **Delete commute** and **Keep commute**.

## Reset handoff template

Until Task 7 supplies exact categories and companion results, use only:

> **Reset all personalization?**
>
> This clears: {covered_categories}. This keeps: {retained_categories}. Notification permission and Accessible Route Only do not change.

Never display unresolved placeholders to a rider. Do not claim reset completed while any covered companion result is Pending or failed.

## Visible and assistive parity

Every string:

- preserves the same object, route, direction, destination, state, capability, and consequence in visual and spoken output;
- exposes button, heading, group, error, expanded/collapsed, selected, On/Off, and disabled semantics;
- names routes with text and spoken identity, not color alone;
- puts the affected object and consequence before remediation;
- avoids rereading the entire page after a field error or permission result; and
- remains understandable in large vertical reflow.

## Prohibited language

Do not use:

- **Good service**, **On time**, or a routine all-clear;
- “every delay,” “always,” “guaranteed,” or an equivalent detection/delivery promise;
- a scheduled-departure or window-opening alarm promise;
- raw trip, route-direction, stop, source, permission, or internal state codes;
- internal threshold symbols or seconds in setup copy;
- **Any entrance** when none is selected;
- color-only route, state, validation, or permission meaning;
- crowding, commuter-rail, or proxy-capacity notification language;
- current accessible-path or equipment claims from stored preferences; or
- delivered disruption/recovery copy, which Task 5 owns.

Restoration controls and recovery-message language remain absent until Tasks 5 and 7 define their behavior.

## Exact fixture handoff

All catalog strings are consumed by `CUX-01`–`CUX-31` in the setup flow. Every rendered result, assistive transcript, reviewer decision, date, evidence item, correction, and rerun remains **Pending** or **Not run — Pending**.

## Explicit gaps

No real copy capture, localization, truncation, largest-text layout, assistive transcript, comprehension test, OS wording observation, fixed product/build, reviewer decision, approval, or launch evidence exists. Task 5 delivered copy and Task 7 reset/retention terms remain Pending.

## Draft review checklist

- [ ] Every required exact label, message, template, and placeholder appears once with its intended state.
- [ ] Permission language includes disruption-only, no window-opening push, incomplete detection, device save, no account, and no continuous location.
- [ ] Denied and restricted copy preserves Active intent and states delivery consequence.
- [ ] Pause, delete, saved-card removal, structural expiry, and broad reset remain distinct.
- [ ] Delay sensitivity copy matches Task 3 without exposing internal arithmetic.
- [ ] Visible and assistive output preserve equivalent meaning.
- [ ] Forbidden certainty, all-clear, crowding, rail, raw-code, and Task 5 delivery language is absent.
- [ ] All evidence and reviewer decisions remain Pending.

Every unchecked item blocks approval. This documentation commit is not evidence.
