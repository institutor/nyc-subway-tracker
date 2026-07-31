# Commute window setup flow

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§13.1–13.3, 14.2, 14.5–14.6, 25.1–25.2, 28.1–28.3, 31.4 scenarios 22–23, and 31.6–31.8 scenarios 36–42, 48, and 51; commute alerts and launch quality plan Task 4; accepted Nearby and Commute Tasks 1–3 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Content, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-cux-fixture) |

## Purpose and authority

This flow owns the rider-visible entry points, four-step setup sequence, review boundary, explicit alert-enablement actions, and reachable edit, pause, resume, and delete controls for a subway commute window. The [state matrix](commute-window-state-matrix.md) owns independent state axes and transitions, [notification permission moments](notification-permission-moments.md) owns permission timing, and the [copy catalog](../content/commute-window-copy-catalog.md) owns exact visible and assistive language.

The accepted [commute window contract](../commute/commute-window-contract.md), [field dictionary](../commute/commute-window-field-dictionary.md), [eligibility contract](../commute/notification-eligibility-contract.md), and [delay threshold policy](../commute/delay-threshold-policy.md) retain their decisions. This task does not redefine current transit truth, eligibility, delivery, episode identity, retention, measurement, operations, or launch.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) continues to block public arrival boards and commute-alert release. No real setup, layout, OS interaction, product capture, reviewer decision, approval, or release evidence exists.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§13.1–13.3, 14.2, 14.5–14.6, 25.1–25.2, 28.1–28.3, scenarios 22–23, 36–42, 48, and 51, full Task 4 provenance, accepted Nearby and Tasks 1–3 handoffs, and Product, Accessibility, Content, and Privacy review. That metadata alignment is not approval; every setup-flow observation and reviewer decision remains **Pending**.

## Independent setup axes

The UI never collapses these into one enabled/disabled value:

- lifecycle: **Active**, **Paused**, **Expired**, or terminal **Deleted**;
- validity: **Incomplete**, **Complete — unconfirmed**, or **Confirmed**;
- notification permission: **Not determined**, **Granted**, **Denied**, or **OS restricted**;
- connectivity: connected or Offline;
- structural relationship: valid, missing, ambiguous, or retired; and
- current operational truth, which never rewrites saved preference state.

Only the rider pauses a commute. Permission denial, OS restriction, Offline, daily end, or temporary disruption never pauses or expires it. A permanent unresolved structural mismatch expires it. Deleted is terminal and leaves no lifecycle tombstone.

## Entry points and proposal boundary

Use the existing **Commute** destination and these actions:

- **Set up a commute**
- **Add commute**
- **Set up from this saved station**
- **Set up from this station**
- **Set up from this trip**

An entry point may import only explicit values already selected in its owner:

| Entry | Permitted proposal | Required treatment |
|---|---|---|
| Commute destination | No values, or an explicitly chosen prior local draft | Start at Trip with no hidden defaults |
| Saved station | Exact saved station/constituent and explicitly saved preference values | Label every imported value as proposed; saved intent is not current truth |
| Station board | Exact station/constituent and only a route/direction relationship that is unambiguous in current accepted context | If multiple routes or directions are plausible, require visible selection |
| Offline trip | Explicit stored origin, destination, route, direction, days/time/preferences that remain eligible as stored structure | Label Offline/reference meaning; incomplete fields remain visible and required |

Never import arrivals, countdowns, alerts, equipment status, platform or track, schedule time as a commute window, trip progress, current recommendation, device location, passive habits, home/work inference, or background movement. Route selection is visible and uses rider-recognizable text/shape/spoken identity; no typed route identifier is required.

## Exact four-step setup

Required fields are never hidden in advanced disclosure.

### 1. Trip

Show and require:

- exact origin and destination;
- one primary subway route;
- normalized station-specific direction paired with actual destination or terminal;
- **Accessible Route Only** independently On/Off; and
- **Avoid Stairs** independently On/Off.

**Trip details** contains optional preferred entrance, preferred exit, alternate routes, and transfer preference. Absence is shown honestly and creates no access, guidance, or transfer promise.

### 2. Days

Require at least one explicit New York weekday. Do not infer weekdays from passive use, service date, device locale, or a schedule.

### 3. Time

Require local start, local end, and preparation lead time. Invent no default, maximum, menu, or increment for those three Task 1 fields. Show overnight interpretation with both local dates and state that the selected weekday belongs to the date on which the window starts.

Advanced **Delay sensitivity** offers exactly:

- **More than 5 minutes added — default**
- **More than 10 minutes added**
- **More than 15 minutes added**

This maps to stored `T=300`, `600`, or `900` seconds under Task 3. A change is prospective and restarts pending inferred evidence; it never reclassifies a prior observation.

### 4. Review and alerts

Show one coherent **Review your commute** group containing every required and optional field, proposal source, exact route, normalized direction plus destination, origin, destination, days, half-open time interpretation, lead, delay sensitivity, accessibility preferences, lifecycle effect, and alert choice.

When no entrance is selected, show exactly **No preferred entrance selected**. Never substitute **Any entrance**.

Block completion when route, direction, and destination do not agree. The two actions are:

- **Turn on alerts**
- **Save without alerts**

**Save without alerts** creates one Confirmed **Paused** commute and invokes no pre-prompt or OS prompt. **Turn on alerts** invokes the permission flow only after every field validates and the rider explicitly selects it.

## Primary controls and consequences

Place these visible controls in the lower third, each at least 48×48 CSS pixels:

- **Edit commute**
- **Pause alerts** or **Resume alerts**
- **Delete commute**

Do not hide a core action behind swipe, long press, unlabeled icon, or account settings.

**Edit commute** opens explicit fields. **Save changes** applies only the reviewed fields; **Cancel** preserves the previous record and state. Editing a Paused commute never resumes it. A material structural edit requires complete review. A tolerance edit is prospective.

Delete confirmation uses **Delete commute** and **Keep commute**. Deleting one commute removes only that self-contained commute and its alert settings. It changes no other window, saved station, open station board, offline map/trip, official data, Accessible Route Only state, or OS notification permission.

Removing a saved-station card does not delete a self-contained commute that references the station. Broad personalization reset remains Task 7-owned and cannot report completion while any companion result is Pending or failed.

## One-hand and accessible interaction

- Default to dark, high-contrast presentation.
- Identify routes by text, official shape, and spoken label; color is supplemental.
- Pair every direction with its actual destination or terminal.
- Validation is text, not color-only.
- Support large vertical reflow without horizontal scrolling or clipped controls.
- Lower sheets retain the visible commute summary and predictable focus return.
- Announce an error summary once, then move focus to the first invalid field.
- Announce permission capability and result without replaying the whole page.
- Put object and consequence first in labels and errors.
- Every state exposes role, label, state, and consequence visibly and assistively.
- Verify both hands, supported viewports, largest text, external keyboard/focus order, and screen-reader reading order.

## Fixed CUX acceptance fixtures

`CUX-T4-POLICY-v1` identifies these definitions only. The commit containing this artifact binds their text after commit. Every `CUX-xx-SRC-v1` package is synthetic; fixed product/build is **Pending**.

Every future run records fixed versions, synthetic commute and proposal provenance, every field and independent state axis, exact action, expected and actual visible and assistive output, focus and reading order, target size/placement, retained/removed data, prompt count and permission result, prohibited checks, reviewer decisions/dates, evidence, correction, preserved original, rerun, and status. No record contains personal identity, passive location, movement history, home/work inference, or unrelated travel history.

| Fixture/source | Fixed setup and action | Expected visible, assistive, focus, state, and retention result | Prohibited result |
|---|---|---|---|
| `CUX-01`; `CUX-01-SRC-v1` | Open **Set up a commute** directly | Empty honest Trip step; no inferred values, prompt, or Active watch | Hidden defaults; immediate permission prompt |
| `CUX-02`; `CUX-02-SRC-v1` | **Set up from this saved station** | Exact saved values appear as labeled proposals for complete review | Current truth imported; automatic confirmation |
| `CUX-03`; `CUX-03-SRC-v1` | Station board has one unambiguous route/direction | Proposed station, route, direction, destination shown; rider can continue without typing ID | Raw code; current arrival stored |
| `CUX-04`; `CUX-04-SRC-v1` | Station board has multiple plausible routes/directions | Visible route and direction selection required; no guessed proposal | Choose first route; binary direction collapse |
| `CUX-05`; `CUX-05-SRC-v1` | Eligible offline trip has every explicit field | Reference-labeled proposals populate review; no current truth or prompt | Live/accessibility claim; automatic alert |
| `CUX-06`; `CUX-06-SRC-v1` | Offline trip lacks required route/direction field | Missing field remains visible and blocks confirmation | Advance with hidden default; infer from schedule |
| `CUX-07`; `CUX-07-SRC-v1` | First-time rider completes setup through selections | Valid window without typed route identifier | Required text ID entry |
| `CUX-08`; `CUX-08-SRC-v1` | Open/close **Trip details** and **Delay sensitivity** | Required fields remain outside; optional/advanced values preserve focus and summary | Hide required field; lose edits/focus |
| `CUX-09`; `CUX-09-SRC-v1` | Toggle ARO and Avoid Stairs independently | Two visible independent On/Off states; no coupling or current-path promise | Silent ARO Off; escalator substitution |
| `CUX-10`; `CUX-10-SRC-v1` | Route/direction does not serve selected destination | Completion blocked with exact mismatch copy; focus first mismatched control | Reverse-direction alert; raw direction code |
| `CUX-11`; `CUX-11-SRC-v1` | Complete unconfirmed review then explicit action | All fields shown; only action creates Confirmed state | Omitted field; implicit confirmation |
| `CUX-12`; `CUX-12-SRC-v1` | Overnight and DST definitions consume fixed CTE fixtures | Both dates, start-weekday ownership, and no duplicate/phantom occurrence | Recalculate or weaken CTE results |
| `CUX-13`; `CUX-13-SRC-v1` | Select 5/10/15 sensitivity and change after evidence | Exact labels map to CTB values; change prospective/reset stated | Hidden seconds; retroactive result |
| `CUX-14`; `CUX-14-SRC-v1` | First valid **Turn on alerts**, permission Not determined, OS grants | One pre-prompt, one OS prompt, Active+Granted, exact success copy | Prompt before action; promise every delay |
| `CUX-15`; `CUX-15-SRC-v1` | Same first action, OS denies | Active intent remains; Denied/non-delivery shown; core surfaces unaffected | Pause/expire; repeated prompt |
| `CUX-16`; `CUX-16-SRC-v1` | Choose **Save without alerts** | Confirmed Paused; zero pre-prompts/OS prompts; exact paused copy | Active state; permission request |
| `CUX-17`; `CUX-17-SRC-v1` | Permission already Granted; choose Turn on | No OS prompt; Active+Granted | Duplicate prompt |
| `CUX-18`; `CUX-18-SRC-v1` | Permission previously Denied; choose Resume alerts | No OS prompt replay; show settings action and Active intent blocked | Automatic OS prompt; delete commute |
| `CUX-19`; `CUX-19-SRC-v1` | OS restricted and unavailable branches | Active intent preserved; exact unavailable result and zero replay | Treat as Denied prompt loop; promise delivery |
| `CUX-20`; `CUX-20-SRC-v1` | Permission revoked after Active+Granted | Active lifecycle unchanged; status updates immediately | Pause/expire; missed-alert replay |
| `CUX-21`; `CUX-21-SRC-v1` | Explicit enable while Offline, then reconnect | Prompt only inside Commute after action; reconnect never prompts or replays | Foreground/reconnect prompt; stale delivery |
| `CUX-22`; `CUX-22-SRC-v1` | Permission restored in settings | Active intent remains; current-only reevaluation; no missed/stale replay | Historical notification burst |
| `CUX-23`; `CUX-23-SRC-v1` | Exercise every forbidden prompt origin | Zero prompts from Nearby, launch, location, board, Map, Saved, offline trip, save station, foreground, reconnect, or disruption | Any unsolicited prompt |
| `CUX-24`; `CUX-24-SRC-v1` | Edit, cancel, reopen, edit, save | Cancel preserves exact prior record/state; Save changes only reviewed fields | Silent save; Paused resume |
| `CUX-25`; `CUX-25-SRC-v1` | Pause, inspect, then explicit resume under each permission state | Paused remains on inspect; only rider resume changes lifecycle; permission cause remains separate | Auto-resume; permission becomes lifecycle |
| `CUX-26`; `CUX-26-SRC-v1` | Delete referenced saved-station card | Self-contained commute remains with exact removed-card notice | Delete/expire commute; remap station |
| `CUX-27`; `CUX-27-SRC-v1` | Permanent route/station/direction relationship becomes unresolved | Expired with exact reason and full-review action | Silent substitute; permission change |
| `CUX-28`; `CUX-28-SRC-v1` | Temporary delay, outage, Offline, or stale evidence | Preference/lifecycle unchanged; operational cause remains separate | Rewrite fields; expire/pause |
| `CUX-29`; `CUX-29-SRC-v1` | Delete one of two commutes | Selected commute terminally removed; other and all named surfaces/settings unchanged | Tombstone; delete other data |
| `CUX-30`; `CUX-30-SRC-v1` | Invoke broad reset while Task 7 companion categories/results Pending | Exact reset template; completion blocked; no partial-success claim | Invent categories; change ARO/permission; claim complete |
| `CUX-31`; `CUX-31-SRC-v1` | Complete flow with no account/location, both hands, largest text, keyboard, screen reader, focus/error branches | Functional parity; ≥48×48 lower-third controls; coherent reading/focus and no background location | Account/location gate; clipping; color-only; hidden action |

## Pending execution record for every CUX fixture

| Fixture | Actual result | Reviewers/dates | Evidence/layout/OS capture | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `CUX-01` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-02` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-03` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-04` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-05` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-06` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-07` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-08` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-09` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-10` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-11` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-12` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-13` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-14` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-15` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-16` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-17` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-18` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-19` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-20` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-21` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-22` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-23` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-24` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-25` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-26` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-27` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-28` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-29` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-30` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CUX-31` | **Not run — Pending** | All required roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |

## Explicit gaps

No real layout, viewport, largest-text result, assistive transcript, focus capture, target-size measurement, OS prompt capture, permission result, reviewer decision, fixed product/build, correction, rerun, pilot, or launch evidence exists.

Task 5 owns delivered notification and recovery copy. Task 6 owns episode algorithms. Task 7 owns data inventory, retention, deletion assurance, and broad reset completion. Later tasks own measurement, operations, and launch.

## Draft review checklist

- [ ] All entry points label imported values as proposals and import no operational truth.
- [ ] Four steps expose every required field and exact review before confirmation.
- [ ] Save without alerts creates Confirmed Paused with zero permission prompts.
- [ ] Independent state axes never collapse into lifecycle.
- [ ] Core controls are visible, lower-third, at least 48×48, and not gesture-hidden.
- [ ] Route, direction, accessibility, error, focus, and largest-text treatment is equivalent visibly and assistively.
- [ ] `CUX-01`–`CUX-31` definitions and Pending execution rows are complete.

Every unchecked item blocks approval. Definitions are not evidence.
