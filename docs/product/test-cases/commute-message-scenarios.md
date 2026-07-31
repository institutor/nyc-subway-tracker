# Commute message scenarios

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 28.2, 29.3, 31.6 scenarios 36–39, 31.7–31.8, 33.5, and 34–35; commute alerts and launch quality plan Task 5; accepted Commute Tasks 1–4 and accessibility handoffs |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record) |

## Purpose and authority

This pack fixes synthetic inputs and expected/prohibited results for the [notification timing policy](../commute/notification-timing-policy.md), [notification library](../content/commute-notification-library.md), and [recovery policy](../commute/recovery-notification-policy.md). It defines:

- timing fixtures `CMS-T01`–`CMS-T10`;
- approved-specification scenarios `S36`–`S39`;
- escalation fixtures `E01`–`E14`;
- recovery fixtures `R01`–`R13`; and
- repeated-plan fixtures `M01`–`M09`.

This artifact is **Draft**. **NO-GO — GATE 0 NOT PASSED** remains authoritative. Every station, route, incident, path, machine, source, window, and message below is synthetic and supplies no real service claim.

## Product Governance reconciliation

The artifact header and Draft product artifact index row now align on the full Task 5 provenance, accepted Tasks 1–4 and accessibility handoffs, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every message-scenario result and reviewer decision remains **Pending**.

## Fixed input contract

`CMS-T5-POLICY-v1` identifies these definitions. Accepted Tasks 1–4 are fixed to the artifact state at base commit `d893728d92fc90ebb7f364e9e61f9fecc8ce54e4`. Each row fixes its own immutable `{fixture}-SRC-v1` package. The Task 5 artifact version is the exact commit containing this pack. Fixed product/build remains **Pending**, so no fixture is executable or passed.

Every fixture inherits the following fixed values unless its row explicitly overrides them. The inherited values plus the row are one complete fixed input; an omitted field does not mean “any.”

| Required input | Fixed inherited value |
|---|---|
| IDs | `WIN-SYN-{fixture}`, `OCC-SYN-{fixture}`, `EP-SYN-{fixture}`, and `IMPACT-SYN-{fixture}`; Task 6 semantics remain Pending |
| Local time | America/New_York; Monday, 2026-08-03; `L=30 minutes`, `P=7:30 AM`, `S=8:00 AM`, `E=9:00 AM`; fixture value, not a product default |
| Saved trip | Synthetic route F, Downtown bound toward Coney Island, Fixture Origin to Fixture Destination, no transfer unless overridden |
| Lifecycle/capability | Active intent; permission Granted; connected |
| Source/effective state | Current, coherent, authoritative synthetic source; effective interval intersects `[P,E)` |
| Task 2 | All twelve gates Pass, with exact route, direction, scope, decision consequence, currentness, and no duplicate |
| Task 3 | Applicable threshold/persistence/confirmed-impact rule Passes |
| Accessibility | Not applicable; when overridden, exact path/version, connection, state, freshness, impact, and alternative decision are fixed |
| Opportunity/recheck | Evaluate at the row’s stated opportunity; all twelve final-recheck items Pass using the same rendering evidence |
| Prior material state | No prior delivered notification for the episode/impact |
| Deltas | No added-time, place, direction, severity, active-period, or action delta |
| Recovery/seen | `recovery_updates=Off`; seen state Not applicable |
| Rendered result | Exact library pattern named by the row; visible and assistive title/body are identical in facts, order, scope, certainty, action, and punctuation |
| Common prohibited result | Early/out-of-window/replayed/duplicate delivery; stale or unresolved certainty; unsafe/unverified action; bypassed stop shown served; raw IDs or service-day terms; guessed Home/Work; **All clear**, **Good service**, **On time**, or an MTA guarantee |

Every row also fixes expected delivery count. A suppressed or held row renders no definitive push. Where a row has labeled subcases, every subcase is fixed inside the one source package and must independently produce the stated result.

## Timing fixtures

| Fixture/source | Fixed override and evaluation opportunity | Expected visible and assistive result | Fixture-specific prohibited result |
|---|---|---|---|
| `CMS-T01`; `CMS-T01-SRC-v1` | Planned bypass accepted 7:00 AM, before `P`; current again at `P` | Hold until 7:30; one `COMMUTE-N01` after the full `P` recheck; **is scheduled to** | Delivery at 7:00; current-service veto |
| `CMS-T02`; `CMS-T02-SRC-v1` | Planned closure first accepted exactly at `P` | One `COMMUTE-N01` after the immediate final recheck | Added delay; invented lead |
| `CMS-T03`; `CMS-T03-SRC-v1` | Planned short turn first accepted 7:45 AM in `(P,S)` | One `COMMUTE-N01` promptly after recheck | Wait solely for `S`; definitive current wording |
| `CMS-T04`; `CMS-T04-SRC-v1` | At `P` one owner gate is Unresolved, so nothing delivered; a new current package makes every gate Pass exactly at `S` | Fresh reevaluation at `S`; one `COMMUTE-N01` | Replay the held package; call Hold a queued send |
| `CMS-T05`; `CMS-T05-SRC-v1` | Source becomes available 8:15 AM in `(S,E)`; verified alternative still changes the rider’s decision; late reason fixed as source restoration at 8:15 | One message after recheck; record late opportunity and useful action | Informational late push without action rationale |
| `CMS-T06`; `CMS-T06-SRC-v1` | Qualifying candidate first accepted exactly at `E=9:00 AM` | Suppress; zero rendered messages | Treat `E` as inclusive; queue a later push |
| `CMS-T07`; `CMS-T07-SRC-v1` | One inferred delay update at 7:40; Task 3 persistence is Unresolved | Hold; zero rendered messages | Delay push from one fluctuation |
| `CMS-T08`; `CMS-T08-SRC-v1` | Coherent inferred updates at 7:40 and 7:41 span 60 seconds and supported added time exceeds the stored threshold | One `COMMUTE-N02` after the final recheck | Claim exact minutes without support; skip persistence |
| `CMS-T09`; `CMS-T09-SRC-v1` | Current coherent authoritative bypass confirmation at 7:42; no inferred-delay wait applies | Evaluate promptly and send one `COMMUTE-N04`; no numeric SLA claim | Require 60-second persistence; promise a delivery time |
| `CMS-T10`; `CMS-T10-SRC-v1` | Fixed subcases A Denied, B Offline, C evidence becomes stale at final recheck; later permission restoration/reconnect supplies no historical replay | A/B/C deliver zero; later state change permits only a fresh current evaluation | Prompt on reconnect; change lifecycle; replay missed/stale candidate |

## Specification scenarios 36–39

| Fixture/source | Fixed override and material state | Expected visible and assistive result | Fixture-specific prohibited result |
|---|---|---|---|
| `S36`; `S36-SRC-v1` | Delay is only on an unused segment of the saved F line; Task 2 journey gate Fails | Suppress; zero messages | Line-wide push; rewrite the saved segment |
| `S37`; `S37-SRC-v1` | Current bypass removes saved origin 14 St during the occurrence; verified action is **Use 23 St instead.** | One `COMMUTE-N04`: title **14 St stop change**; body **Downtown-bound F trains toward Coney Island are not stopping at 14 St during Mon, Aug 3, 8:00–9:00 AM. Use 23 St instead. Open current details.** | Show an arrival or say trains stop at 14 St; omit action |
| `S38`; `S38-SRC-v1` | A bypass notification was successfully delivered; source prose and timestamp change, but episode, impact, scope, and action remain equivalent | Suppress duplicate; zero new messages | Treat copy or timestamp as new impact |
| `S39`; `S39-SRC-v1` | Required entrance elevator on exact selected path/version is accepted adverse and current; impact Blocking; first independently verified alternative is Fixture Nearby Station | One accessibility notification using exact `A11Y-T5-04`, exact owner freshness, verified unselected choice, and **Open current details.** | Whole-station claim; unrelated equipment; Unknown→outage; Working/Available; unverified or auto-selected option |

## Escalation fixtures

For `E01`–`E14`, override prior state to one successfully delivered message for the same synthetic episode and material impact at 7:30 AM. Its supported added time is 600 seconds, affected scope is the saved segment/direction, active end is 8:00 AM, and verified action is **Use Fixture Alternate A.** The delivered message is the baseline; every other inherited field still applies.

| Fixture/source | Fixed material delta from delivered baseline | Expected visible and assistive result | Fixture-specific prohibited result |
|---|---|---|---|
| `E01`; `E01-SRC-v1` | Added time worsens by 299 seconds | Suppress; zero escalation | Round up to five minutes |
| `E02`; `E02-SRC-v1` | Added time worsens by exactly 300 seconds | One `COMMUTE-N07`; **about** wording only for supported total | Treat boundary as exclusive |
| `E03`; `E03-SRC-v1` | Added time worsens by 301 seconds | One `COMMUTE-N07` | Send more than one update for the same evaluation |
| `E04`; `E04-SRC-v1` | Fixed subcases add one exact affected origin, transfer, destination, or saved-segment station respectively | Exactly one `COMMUTE-N07` per independently run subcase | Broad line scope; merge the four subcases into multiple pushes |
| `E05`; `E05-SRC-v1` | A newly affected exact relevant direction appears | One `COMMUTE-N07` naming the new direction | Raw direction code; notify for equivalent direction wording |
| `E06`; `E06-SRC-v1` | Fixed owner package supplies an approved ordered severity and value increases one position | One `COMMUTE-N07` | Infer order from prose |
| `E07`; `E07-SRC-v1` | Severity wording changes, but the value is missing or unordered | Suppress; zero escalation | Treat stronger-sounding text as ordered severity |
| `E08`; `E08-SRC-v1` | `oldEnd=8:00:00`, `newEnd=8:29:59`; extension into window is 1,799 seconds | Suppress; zero escalation | Round up to 30 minutes |
| `E09`; `E09-SRC-v1` | `oldEnd=8:00:00`, `newEnd=8:30:00`; extension into window is 1,800 seconds | One `COMMUTE-N07` | Treat boundary as exclusive |
| `E10`; `E10-SRC-v1` | `oldEnd=8:00:00`, `newEnd=8:30:01`; extension into window is 1,801 seconds | One `COMMUTE-N07` | More than one escalation |
| `E11`; `E11-SRC-v1` | `oldEnd=9:00:00`, `newEnd=9:30:00`; `min` formula adds zero inside `[P,E)` | Suppress; zero escalation | Count extension wholly beyond `E` |
| `E12`; `E12-SRC-v1` | First independently verified action changes from Fixture Alternate A to Fixture Alternate B | One `COMMUTE-N07` with B left unselected | Keep stale action A; auto-select B |
| `E13`; `E13-SRC-v1` | Delivered action A becomes invalid; current complete review finds no verified alternative | One `COMMUTE-N07` with exact no-verified-alternative result | Recommend A, unsafe candidate, or vague substitute |
| `E14`; `E14-SRC-v1` | Only copy and renewed timestamp change; a correction is present but no independent material branch passes | Suppress; zero escalation | Correction-only push; baseline switch |

## Recovery fixtures

For `R01`–`R13`, the original disruption belongs to the same fixed synthetic episode/material impact, every current candidate is evaluated inside a remaining occurrence, and Task 2/final gates Pass unless overridden. Rows explicitly fix original setting, successful delivery, owner release, action change, and current setting.

| Fixture/source | Fixed recovery override | Expected visible and assistive result | Fixture-specific prohibited result |
|---|---|---|---|
| `R01`; `R01-SRC-v1` | Setting Off at original candidate and now | Suppress; zero recovery | Default-on or inferred consent |
| `R02`; `R02-SRC-v1` | Setting On throughout, but no original notification candidate existed | Suppress; zero recovery | Routine all-clear |
| `R03`; `R03-SRC-v1` | Setting On throughout; original delivery failed and was not actually delivered | Suppress; zero recovery | Treat attempted delivery as delivered |
| `R04`; `R04-SRC-v1` | Original delivered while setting Off; rider turns On afterward | Suppress for this episode; setting is prospective | Backfill recovery for active episode |
| `R05`; `R05-SRC-v1` | Original delivered with setting On; only alert end/disappearance/time passes | Suppress; zero recovery | Infer resolution from absence or time |
| `R06`; `R06-SRC-v1` | Original delivered with setting On; at least one applicable owner release gate is Unresolved | Hold while eligible; zero rendered recovery | Definitive recovery from incomplete release |
| `R07`; `R07-SRC-v1` | Setting On throughout; original delivered; same impact; every release gate Passes; prior bypass action no longer applies to remaining occurrence | One exact `COMMUTE-R02` | Good service; line-wide restore |
| `R08`; `R08-SRC-v1` | Explicit current restoration report for one required machine; complete path has not passed | Zero recovery; retain exact `A11Y-T5-07` warning/recheck | Machine operation or path-restored claim |
| `R09`; `R09-SRC-v1` | Qualifying two-omission evidence for one required machine; complete path has not passed | Zero recovery; retain exact `A11Y-T5-09` warning/recheck | **Restoration was reported**; path-restored claim |
| `R10`; `R10-SRC-v1` | Fresh complete selected path/version passes every required edge and materially removes prior action | One exact `COMMUTE-R03` scoped to that journey | Infer complex-wide or future accessibility |
| `R11`; `R11-SRC-v1` | One adverse required condition remains and prior safe action is still required | Suppress/retain warning; zero recovery | Partial all-clear; remove prior action |
| `R12`; `R12-SRC-v1` | One recovery for the delivered impact already succeeded; equivalent release record/copy/timestamp arrives | Suppress duplicate; total remains one recovery | Second recovery |
| `R13`; `R13-SRC-v1` | Final affected occurrence has ended and no remaining future occurrence materially changes | Suppress; zero recovery | Rewrite completed occurrence; late restore |

## Repeated planned-work fixtures

For `M01`–`M09`, a current planned package covers synthetic future occurrences and uses future wording. The source owner, not the OS, supplies Seen state.

| Fixture/source | Fixed repeated-plan override | Expected visible and assistive result | Fixture-specific prohibited result |
|---|---|---|---|
| `M01`; `M01-SRC-v1` | Equivalent plan covers Mon–Fri, Aug 3–7, 8:00–9:00 AM | One useful `COMMUTE-N01` summary for the covered occurrences | One push per day |
| `M02`; `M02-SRC-v1` | Equivalent reminder opportunity; owner state **Seen** | Suppress reminder | Ignore Seen |
| `M03`; `M03-SRC-v1` | Equivalent reminder opportunity; owner state **Not seen** | One current rechecked `COMMUTE-N01` reminder | Treat OS delivered alone as Not seen |
| `M04`; `M04-SRC-v1` | Equivalent reminder opportunity; owner state **Unknown** | Suppress reminder | Assume Unknown means Not seen |
| `M05`; `M05-SRC-v1` | Plan materially changes the affected station and verified action | One current update using `COMMUTE-N07` | Suppress material plan change as equivalent |
| `M06`; `M06-SRC-v1` | Only planned-work prose and timestamp change | Suppress; zero new messages | Treat renewal as changed plan |
| `M07`; `M07-SRC-v1` | Occurrence crosses midnight: Mon, Aug 3, 11:30 PM to Tue, Aug 4, 12:30 AM | Message names both dates exactly; one occurrence | Service-day wording; omit either date |
| `M08`; `M08-SRC-v1` | Fall-back recurrence includes a repeated local clock hour under the fixed occurrence identity | One summary/reminder opportunity for one occurrence; no duplicate | Two pushes for repeated hour |
| `M09`; `M09-SRC-v1` | Spring-forward recurrence targets a nonexistent local time under the fixed recurrence decision | No phantom occurrence or push | Shift silently into existence |

## Pending execution record

Every row below records all required actual, reviewer, date, evidence, correction, and rerun fields. “All roles” means Product, Accessibility, Data Quality, Content, and Operations reviewing the same fixed product and artifact versions.

| Fixture | Actual visible/assistive/delivery result | Reviewers and dates | Durable evidence | Correction and preserved original | Rerun | Status |
|---|---|---|---|---|---|---|
| `CMS-T01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T04` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T05` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T06` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T07` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T08` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T09` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `CMS-T10` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `S36` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `S37` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `S38` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `S39` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E04` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E05` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E06` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E07` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E08` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E09` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E10` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E11` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E12` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E13` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `E14` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R04` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R05` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R06` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R07` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R08` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R09` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R10` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R11` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R12` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `R13` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M04` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M05` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M06` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M07` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M08` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `M09` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |

## Evidence and correction contract

For a future run:

1. bind the fixed product/build, Task 5 commit and blob IDs, upstream artifact versions, source package, all IDs and fields, and OS/runtime;
2. capture actual visible and assistive output, delivery count/result, opportunity, final-recheck record, and prohibited checks;
3. obtain Product, Accessibility, Data Quality, Content, and Operations decisions and dates on that same version;
4. store durable evidence;
5. preserve every failed or inconclusive original;
6. record a bounded correction and new fixed version; and
7. rerun with a new attempt linked to the original and correction.

Definitions, documentation commits, screenshots without version binding, and one reviewer’s opinion are not evidence.

## Explicit gaps

Task 6 episode integration, an approved severity order, an owner Seen definition, inferred-delay recovery behavior, Task 7 setting persistence/reset, lock-screen privacy, and active-episode opt-in UI remain **Pending**. No fixed product/build, actual run, delivery, assistive transcript, reviewer decision, approval, pilot, launch, or measured notification-target evidence exists.

## Draft review checklist

- [ ] Unique fixture sets are exactly `CMS-T01`–`CMS-T10`, `S36`–`S39`, `E01`–`E14`, `R01`–`R13`, and `M01`–`M09`.
- [ ] Every fixture binds the shared fixed input plus an explicit source/version override, expected rendered result, and prohibited result.
- [ ] Timing, escalation, recovery, repeated work, exact CTA, accessibility, overnight, and DST boundaries match their owner policies.
- [ ] Every execution row retains actual, five-role reviewer/date, evidence, correction/original, rerun, and status as **Pending** or **Not run — Pending**.
- [ ] No synthetic definition is represented as observed evidence or release approval.

Every unchecked item blocks approval.
