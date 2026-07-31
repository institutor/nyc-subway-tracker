# Commute window product contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§5.1–5.2, 25.1–25.2, 25.5, 25.7, 26, 28.2–28.3, 31.6–31.7, 32.3, 33.5, and 34–35; commute alerts and launch quality plan Task 1 |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-fixture) |

## Purpose and authority

This contract defines one rider-confirmed recurring subway disruption watch. It owns the commute-window promise, lifecycle, independent-window and overlap behavior, New York recurrence and overnight rules, confirmation and reconfirmation boundary, subway-only scope, and silence, recovery, and crowding exclusions.

The [commute window field dictionary](commute-window-field-dictionary.md) owns field presence, validation, proposal sources, and field-specific reconfirmation. The [subway product decisions](../decisions/subway-product-decisions.md) retain cross-domain decisions, including the disruption-only boundary and the new Draft recovery decision. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), public wording follows the [approved rider language rules](../contracts/rider-language-rules.md), saved intent remains distinct from current truth under the [saved-station and personalization contract](../nearby-offline/saved-station-and-personalization-contract.md), and privacy assurance remains with the [location and personal-data rules](../nearby-offline/location-and-personal-data-rules.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. It defines expected behavior only. It demonstrates no real rider window, working-product behavior, notification decision, delivery, retention or deletion result, reviewer decision, approval, or release authorization.

The authoritative current posture remains **NO-GO — GATE 0 NOT PASSED** under the [Gate 0 exit record](../quality/gate-0-exit-record.md). Public arrival boards and commute-alert release remain blocked. This contract neither changes nor waives that decision.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§5.1–5.2, 25.1–25.2, 25.5, 25.7, 26, 28.2–28.3, 31.6–31.7, 32.3, 33.5, and 34–35, full Task 1 provenance, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. That metadata alignment is not approval; every same-version reviewer decision and commute-window scenario remains **Pending**.

## Product promise

A commute window is a rider-confirmed recurring disruption watch for one saved subway journey. It is not:

- a scheduled-departure alarm;
- a push merely because the lead period or commute interval opened;
- a routine good-service or all-clear message;
- a crowding notification;
- a commuter-rail product; or
- proof that a route, entrance, exit, transfer, platform, equipment chain, or complete accessible path is usable now.

Default behavior is:

> Stay silent unless current evidence shows a decision-changing disruption to the saved journey.

No notification never proves **Good service**, current usability, or the absence of an operational problem.

The default is at most one alert for one materially distinct disruption episode and materially equivalent commute impact, not one alert per source record, update, or overlapping window. Later Tasks 2, 3, 5, and 6 own eligibility, materiality, timing, and episode identity. This contract does not pre-authorize any send.

## Ownership boundary

| This Task 1 contract owns | A later task owns |
|---|---|
| The window promise, required rider confirmation, lifecycle, recurrence, overlap boundary, subway-only scope, and explicit exclusions | Notification eligibility and suppression — Task 2 |
| The fact that preparation lead time participates in the watch interval, without inventing a default or maximum | Delay thresholds and exact threshold behavior — Task 3 |
| The requirement that saving, suggesting, and notification authorization remain separate | Setup presentation and permission moments — Task 4 |
| The necessary recovery boundary and default silence | Delivery timing, message content, and permitted restoration behavior — Task 5 |
| At-most-one treatment for an equivalent episode and impact across overlapping windows | Episode identity, deduplication, escalation, and recovery identity — Task 6 |
| Private-by-default and no-account product constraints | Data inventory, retention, deletion assurance, and privacy acceptance — Task 7 |
| No measurement claim | Notification scorecard, event dictionary, and sampling — Task 8 |
| No operating claim | Holds, correction, escalation, and pilot operations — Task 9 |
| No launch authorization | Staged launch evidence and go/no-go — Task 10 |

## Lifecycle

Nothing automatically activates a commute window.

| State | Meaning and behavior | Permitted transitions |
|---|---|---|
| **Active** | The rider explicitly confirmed one complete valid field set. During its preparation lead period and commute interval it may be evaluated by later notification rules. Outside that interval it remains Active but is not watching and sends nothing. | Explicit pause → **Paused**. A required saved relationship becoming unsafe to resolve → **Expired**. Explicit delete → **Deleted**. |
| **Paused** | The field set remains inspectable and editable, but supplies no automatic watch or push. Opening or inspecting it never resumes it. | Explicit resume after the complete field set validates → **Active**. A required relationship becoming unsafe to resolve → **Expired**. Explicit delete → **Deleted**. |
| **Expired** | Required saved context or a selected structural relationship is missing, ambiguous, retired, split, merged, or materially remapped. Show the exact reason. It supplies no watch or push. Expired does not mean that today’s interval ended. | Explicit complete review, confirmation, and rider state choice → **Active** or **Paused**. Explicit delete → **Deleted**. |
| **Deleted** | Terminal removal of that commute preference and its watch. It is not a retained personalization state or a lifecycle tombstone. Re-creation requires a new complete field set and explicit confirmation. | None. |

Do not expire a window because:

- its daily interval ended;
- a temporary delay, reroute, outage, or suspension exists;
- operational truth is stale, degraded, or unavailable;
- notification permission is denied or revoked;
- a spring-forward occurrence is wholly absent; or
- a normal route or required elevator is temporarily out of service.

Those conditions affect later watch evaluation or delivery, not saved preference meaning.

## New York recurrence and half-open watch interval

All recurrence uses New York local wall time. For one valid occurrence, the watch interval is:

`[local start − preparation lead time, local end)`

The opening boundary is inclusive and the end boundary is exclusive. This interval defines when later tasks may evaluate; it never creates a notification on its own.

Rules:

1. The selected weekday belongs to the New York local date on which the commute window starts.
2. When end is later than start, the occurrence ends on the same local date.
3. When end is earlier than start, the occurrence ends on the next local date.
4. Equal start and end are invalid; they do not create a 24-hour window.
5. Monday 11:30 PM–Tuesday 1:00 AM is one Monday occurrence.
6. Preparation lead time may move the watch opening onto the prior local date without changing the selected occurrence weekday.
7. Midnight never splits, duplicates, deletes, or reassigns the window.
8. A source trip’s operating service date remains authoritative, including times beyond 24:00. The window’s weekday does not rewrite it.
9. Device time zone or phone clock never establishes source freshness, event chronology, or notification evidence.

### Daylight-saving behavior

- A nonexistent spring-forward wall-time instant creates no shifted or phantom evaluation opportunity.
- A window wholly inside the missing spring-forward interval has no occurrence that day and remains Active for future recurrences.
- A window spanning the missing interval remains one occurrence; it is not split or lengthened by an invented hour.
- A repeated fall-back hour remains one recurrence with one disruption-episode and delivery state.
- The repeated hour never produces a duplicate push, duplicate window, or second automatic activation.
- Daylight-saving changes do not rewrite the rider’s saved wall times, reverse authoritative chronology, or reactivate an already delivered episode.

## Independent windows and overlap

Every commute window retains its own complete fields, lifecycle, settings, confirmation provenance, and evaluation. One window never borrows a route, direction, accessibility setting, preparation lead time, restoration choice, or other value from another.

When Active windows overlap:

- evaluate each saved journey independently;
- preserve both records without silent merge, deletion, or rewrite;
- when the same disruption episode creates a materially equivalent impact and rider action, allow at most one alert across the overlap; and
- when the journey impact or useful action is materially distinct, preserve separate candidates for Task 6’s episode and deduplication decision.

Overlap does not itself prove eligibility, create a send, or authorize one window to alter another.

## Proposal, confirmation, and reconfirmation

A proposal may come only from an explicitly saved station, trip, or time window, or from a later-approved transparent repeated-use source. Show all proposed values, the exact source of each proposed value, and the complete field set together for review.

A proposal is not:

- an Active or Paused lifecycle state;
- a saved watch;
- a notification authorization;
- a notification-permission prompt; or
- evidence that the journey is currently usable.

Never infer a commute from passive station visits, background or foreground location, movement history, searches, app opens, account attributes, a guessed home or work location, or a current recommendation.

No repeated-use threshold, qualifying source, retention period, deletion rule, or review method is approved. Until one is approved, retain no passive-use history and generate no passive repeated-use suggestion.

Before **Active**, the rider must review and explicitly confirm the complete valid field set and its proposal provenance. A material edit or changed structural relationship requires a new complete review; no field auto-confirms another.

Expire, name the exact reason, and require review when a selected complex or constituent, entrance or exit, direction and destination mapping, primary or alternate route relationship, transfer relationship, or structural accessibility relationship is missing, ambiguous, retired, split, merged, or materially remapped. Never silently substitute a nearby station, entrance, exit, direction, route, or transfer.

A stable-identity rename alone does not force reconfirmation when meaning and scope are unchanged. Temporary service, equipment, freshness, or evidence problems remain watch inputs and never rewrite confirmed intent.

## Accessibility and preference independence

**Accessible Route Only** and **Avoid Stairs** are separate required On/Off choices.

- Accessible Route Only is a hard complete-path constraint at origin, transfer, destination, and direction.
- It never silently turns Off to preserve a route or make a recommendation.
- Avoid Stairs does not prove wheelchair accessibility.
- An escalator never substitutes for a required elevator in a wheelchair-accessible path.
- Storing either preference does not prove a current accessible path.
- A temporary accessibility outage leaves the window Active; the later disruption owner evaluates the exact saved-path impact.

No field requires an account. A saved local commute remains private by default. This contract does not authorize continuous background location, default synchronization, passive travel history, or retention beyond the later-approved privacy contract.

## Opening, recovery, permission, and modal exclusions

Opening a preparation lead period or commute interval never sends a push. With no qualifying disruption, silence is the complete result.

There is no routine all-clear or **Good service** push. A recovery push is eligible for later consideration only when:

1. a prior push concerned the same relevant disruption episode and commute impact;
2. a meaningful recovery would correct or materially update the rider’s decision; and
3. the rider’s per-commute restoration setting and Task 5 policy permit it.

Restoration is Off by default. No prior relevant disruption push means no recovery push. Copy edits, renewed timestamps, equivalent records, and an ordinary return to service do not independently create a new alert.

Routine crowding, proxy crowding, historical load, station density, engagement signals, and schedule-derived capacity never activate a commute notification. Subway is the only valid launch mode; LIRR and Metro-North are invalid as a primary or alternate route until separately validated product surfaces exist.

Saving or suggesting a commute without explicit alert enablement does not authorize a notification-permission prompt. Denied notification permission does not invalidate the saved fields, expire the window, or affect station boards, maps, Saved, or offline utility.

## Fixed synthetic acceptance fixtures

`CW-T1-POLICY-v1` identifies these Task 1 policy definitions only. The commit containing this artifact binds their text after commit. It is not a product version, approval, scenario observation, or release decision.

Every `CW-xx-SRC-v1` package below is synthetic. The fixed product/build remains **Pending**. Every future run must bind the exact contract and dictionary versions, complete fields and proposal provenance, before and after state, expected and actual visible and assistive output, retention or deletion result, prohibited-result checks, all six same-version reviewer decisions and dates, durable evidence, correction, preserved original result, and rerun.

| Fixture and source | Fixed synthetic fields and provenance | Before → after | Expected visible and assistive result | Retention or deletion | Prohibited result |
|---|---|---|---|---|---|
| `CW-01`; `CW-01-SRC-v1` | Complete ordinary subway field set; every value and source shown; explicit confirmation absent, then supplied | Proposal → **Active** only after confirmation | Before confirmation, clearly inactive proposal; after confirmation, one Active recurring disruption watch | Retain the confirmed field set and provenance | Automatic activation, opening push, current-service promise |
| `CW-02`; `CW-02-SRC-v1` | Branch A misses a required start or end; Branch B has equal start and end | Invalid proposal → invalid proposal | Name the missing or equal-time problem visibly and assistively; no lifecycle activation | Retain nothing as an Active watch | 24-hour interpretation, default time, partial activation |
| `CW-03`; `CW-03-SRC-v1` | Complete valid field set with preferred entrance, preferred exit, and transfer preference absent | Confirmed proposal → **Active** | Valid window; explain no specific entrance, exit, or transfer is promised | Retain optional fields as absent | Inferred entrance, exit, transfer, accessibility, or guidance |
| `CW-04`; `CW-04-SRC-v1` | One complex has three passenger-serving directions; exact selected direction and actual destination are confirmed | Proposal → **Active** | Preserve the exact third direction visibly and assistively | Retain normalized direction plus actual destination context | Binary collapse, raw compass/code, route color as direction |
| `CW-05`; `CW-05-SRC-v1` | Explicitly saved trip proposes fields and shows each proposal source; no confirmation | No window → proposal | Show complete review and source; proposal remains inactive | No Active watch until confirmation | Silent save, notification permission prompt, operational claim |
| `CW-06`; `CW-06-SRC-v1` | Passive repeated use exists but no approved repeated-use source, threshold, or retention policy exists | No window → no proposal | No passive history, suggestion, watch, or prompt | Retain no passive-use history | Guessed commute, home/work inference, hidden habit model |
| `CW-07`; `CW-07-SRC-v1` | One valid Active window is explicitly paused, then deliberately opened for inspection | **Active** → **Paused** → **Paused** | Show Paused and editable; opening does not resume or watch | Retain fields and confirmation provenance | Automatic resume, push, field deletion |
| `CW-08`; `CW-08-SRC-v1` | A required selected structural relationship is retired or materially remapped | **Active** → **Expired** | Show the exact unresolved relationship and review action; no watch or push | Retain intent for explicit review | Silent remap, nearby substitute, continued Active evaluation |
| `CW-09`; `CW-09-SRC-v1` | Rider opens an Expired window, reviews every field, resolves the relationship, and explicitly chooses Active or Paused | **Expired** → chosen **Active** or **Paused** | Show the complete reviewed field set and explicit resulting state | Retain the newly confirmed field set and confirmation provenance only; retention of the prior expiry reason is Task 7-owned and **Pending** | Automatic reactivation, inherited confirmation, hidden changed field |
| `CW-10`; `CW-10-SRC-v1` | Two independent windows exist; rider explicitly deletes one | One selected window → **Deleted**; other unchanged | Name the deleted commute and preserve the other visibly and assistively | Remove the selected preference and watch; no retained lifecycle tombstone | Delete both, change other fields, remove operational truth |
| `CW-11`; `CW-11-SRC-v1` | Two independent Active windows overlap; same episode creates materially equivalent impact and action | Both remain **Active** | Evaluate independently; at most one alert candidate survives later deduplication | Retain both unchanged | Two equivalent pushes, merged windows, borrowed fields |
| `CW-12`; `CW-12-SRC-v1` | Two overlapping Active windows receive materially distinct impacts or useful actions | Both remain **Active** | Preserve distinct candidates for Task 6; do not pre-decide delivery | Retain both unchanged | Forced merge, one window rewritten, distinct impact discarded |
| `CW-13`; `CW-13-SRC-v1` | Monday 11:30 PM start, Tuesday 1:00 AM end, zero or confirmed finite lead | **Active** Monday occurrence → same occurrence ends Tuesday | One Monday occurrence and one half-open interval | Retain Monday weekday and wall times | Tuesday reassignment, midnight split, duplicate |
| `CW-14`; `CW-14-SRC-v1` | Monday 12:15 AM–1:00 AM with confirmed 30-minute lead | **Active** Monday occurrence; watch opens Sunday 11:45 PM | Show one Monday occurrence; prior-date lead does not change weekday | Retain Monday weekday and confirmed lead | Sunday recurrence, two occurrences, shifted saved time |
| `CW-15`; `CW-15-SRC-v1` | An after-midnight source trip uses its authoritative operating service date | **Active** occurrence, source evaluated later | Preserve source service date and chronology independently from window weekday | Do not store source service date as preference | Calendar-date rewrite, duplicate trip, negative chronology |
| `CW-16`; `CW-16-SRC-v1` | Fall-back repeated hour intersects one Active occurrence and one delivered episode state | **Active** → same **Active** occurrence | One recurrence and one episode/delivery state | Retain one saved wall-time definition | Duplicate occurrence, duplicate push, reactivation |
| `CW-17`; `CW-17-SRC-v1` | Entire saved interval lies in the spring-forward missing wall-time range | **Active** → no occurrence that day → remains **Active** | No shifted or phantom evaluation; future recurrence remains | Retain unchanged wall times and lifecycle | Shift to another hour, expire, push |
| `CW-18`; `CW-18-SRC-v1` | One Active interval starts before and ends after the spring-forward gap | **Active** → one spanning occurrence | One half-open occurrence without invented hour | Retain unchanged wall times | Split, duplicate, lengthen, reverse chronology |
| `CW-19`; `CW-19-SRC-v1` | Valid Active window opens with no qualifying decision-changing disruption evidence | **Active** → **Active** | Silence; no good-service or all-clear implication | Retain unchanged preference | Opening alarm, Good service, synthetic status push |
| `CW-20`; `CW-20-SRC-v1` | Conditions recover but no prior relevant disruption push exists | **Active** → **Active** | No recovery push | Retain unchanged preference and no delivered-episode state | All-clear, unrelated prior alert used as authority |
| `CW-21`; `CW-21-SRC-v1` | Same relevant pushed disruption meaningfully recovers; restoration setting is Off | **Active** → **Active** | Silent recovery; current in-app truth may update under its owner | Retain restoration Off | Recovery push, setting silently changed |
| `CW-22`; `CW-22-SRC-v1` | Only crowding, proxy crowding, historical load, or station-density input changes | **Active** → **Active** | No commute push and no eligibility inference | Retain unchanged preference | Crowding alert, proxy capacity, density activation |
| `CW-23`; `CW-23-SRC-v1` | Proposed primary or alternate is LIRR or Metro-North | Invalid proposal → invalid proposal | Explain subway-only launch boundary | Retain no Active commuter-rail watch | Silent conversion, commuter-rail notification, subway equivalence |
| `CW-24`; `CW-24-SRC-v1` | Accessible Route Only On and Avoid Stairs independently On or Off | Confirmed proposal → **Active** | Show both independent settings; Accessible Route Only never relaxes | Retain both exact On/Off values | Coupled toggles, escalator as elevator substitute, silent Off |
| `CW-25`; `CW-25-SRC-v1` | A blocking outage affects the saved route or path after confirmation | **Active** → **Active** | Window remains Active; later accessibility-impact and eligibility owners evaluate current evidence | Do not rewrite route, path preference, or accessibility setting | Expire from outage, silently reroute, Task 1 send decision |
| `CW-26`; `CW-26-SRC-v1` | A commute is suggested or saved but alert enablement was not explicitly confirmed | No alert authorization → unchanged | No notification-permission prompt and no watch activation | Retain only the explicitly authorized saved state under its owner | Permission prompt, notifications enabled, inferred consent |

## Pending execution record for every fixture

| Fixture | Actual visible and assistive observations | Reviewer decisions and dates | Durable evidence and attachments | Retention or deletion observation | Correction | Rerun | Status |
|---|---|---|---|---|---|---|---|
| `CW-01` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-02` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-03` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-04` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-05` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-06` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-07` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-08` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-09` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-10` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-11` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-12` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-13` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-14` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-15` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-16` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-17` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-18` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-19` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-20` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-21` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-22` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-23` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-24` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-25` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CW-26` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Privacy, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |

Definitions do not pass themselves. A later passing rerun must preserve and link the original failed, inconclusive, or missing result. No documentation commit, synthetic fixture, or reviewer invitation is evidence of working-product behavior.

## Explicit unresolved definitions

The following remain **Pending** and cannot be invented by this task:

- a preparation-lead default, maximum, or menu;
- a repeated-use qualifying source, threshold, retention period, deletion rule, or review method;
- a maximum number of windows or overlap limit;
- wall-time input precision;
- real entrance, exit, route, direction, transfer, or accessibility coverage;
- fixed product/build and observed visible or assistive behavior;
- reviewer identities, decisions, dates, evidence, correction, or rerun; and
- approval, notification eligibility, delivery, measurement, operating, or launch evidence.

These gaps make every fixture and this artifact **Not run — Pending**. They are not permission to choose a convenient default.

## Draft review checklist

- [ ] The product is a rider-confirmed disruption watch, never a scheduled alarm.
- [ ] Opening an interval without a qualifying disruption remains silent.
- [ ] No notification is treated as Good service or current-usability evidence.
- [ ] Active, Paused, Expired, and Deleted have the exact non-automatic transitions above.
- [ ] Windows remain independent while equivalent overlapping impact allows at most one alert.
- [ ] New York half-open, overnight, service-date, midnight, and daylight-saving rules are deterministic.
- [ ] Proposal, save, watch activation, notification authorization, and permission prompt remain separate.
- [ ] Passive behavior creates no history or repeated-use suggestion without an approved policy.
- [ ] Structural relationship changes expire with an exact reason and never silently substitute.
- [ ] Accessible Route Only and Avoid Stairs remain independent and no account is required.
- [ ] Routine recovery, all-clear, crowding, and commuter-rail notifications remain excluded.
- [ ] All `CW-01`–`CW-26` actuals, reviewers, evidence, corrections, reruns, and statuses remain Pending.

Every unchecked item blocks approval. This documentation commit is not working-product evidence or release authorization.
