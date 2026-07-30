# Commute notification suppression matrix

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§25.3 and 31.6; additional applying approved specification §§8, 20, 22, 25.2, 27, 31.2, 31.5, 33.1, 33.3, and 33.5; commute alerts and launch quality plan Task 2 |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](disruption-relevance-examples.md#pending-execution-record-for-every-example) |

## Purpose and authority

This matrix applies the [notification eligibility contract](notification-eligibility-contract.md) to fixed decision branches. Every row produces exactly one notification outcome: **Send**, **Suppress**, or **Hold for stronger evidence**. It does not decide arrival admission, threshold values, delivery timing, message copy, permission, episode identity, retention, operations, or launch.

Task 1’s [commute window contract](commute-window-contract.md) and [field dictionary](commute-window-field-dictionary.md) remain unchanged. The [fixed relevance examples](disruption-relevance-examples.md) define later execution records. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft** and all scenario evidence is **Not run — Pending**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) continues to block public arrival boards and commute-alert release.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites §§25.3 and 31.6. This matrix additionally applies §§8, 20, 22, 25.2, 27, 31.2, 31.5, 33.1, 33.3, 33.5, and full Task 2 provenance. Product Governance Lead reconciliation of that additional provenance remains **Pending**. This task does not edit the index.

## Precedence

Evaluate every one of the contract’s twelve gates for the exact same candidate:

- any **Fail** → **Suppress**;
- no Fail plus any **Unresolved** → **Hold for stronger evidence**;
- all Pass → **Send**.

Hold sends nothing. Only newer accepted evidence can change it to Send. An ended opportunity, stale evidence, or later Fail changes it to Suppress; held evidence is never late-sent.

## Deterministic matrix

The outcome column is notification-only. A separate arrival, equipment, accessibility, or service owner keeps its own result.

| ID | Exact decisive facts and gate treatment | Notification outcome | Required consequence and boundary |
|---|---|---|---|
| `NSM-01` | Active confirmed window; authoritative time in interval; current resolved exact subway impact; route, direction, journey, decision, threshold, alternative, and duplicate gates all Pass | **Send** | Create one notification candidate only; delivery remains Task 5-owned |
| `NSM-02` | Window Paused, Expired, Deleted, invalid, unconfirmed, or only proposed; Gate 1 Fail | **Suppress** | No watch or notification candidate |
| `NSM-03` | Evaluation before inclusive opening, at/after exclusive end, or no occurrence; Gate 2 Fail | **Suppress** | Do not queue for later delivery |
| `NSM-04` | Only alarm, all-clear, crowding, proxy, or commuter-rail input; Gate 3 Fail | **Suppress** | No disruption candidate and no modal conversion |
| `NSM-05` | Claim is stale, expired, failed, superseded, or owner-rejected; Gate 4 Fail | **Suppress** | No definitive claim and no all-clear inference |
| `NSM-06` | Current high-impact evidence likely concerns the saved journey, but required exact scope or mapping remains Unresolved; no Fail | **Hold for stronger evidence** | Send nothing; wait only for newer accepted evidence |
| `NSM-07` | A held opportunity ends, its evidence stales, or a definite Fail appears | **Suppress** | Never late-send the held evidence |
| `NSM-08` | Generic **Affected** is the only consequence and establishes no exact decision change; Gate 9 Fail for this candidate | **Suppress** | Do not turn a broad label into bypass, suspension, or closure |
| `NSM-09` | Exact saved origin bypass is current, resolved, decision-changing, and every other gate Passes | **Send** | State the bypass consequence; never say the origin is served |
| `NSM-10` | Positive prediction conflicts with a resolved current bypass veto; notification gates all Pass | **Send** | The disruption candidate survives; this does not alter the separate arrival veto |
| `NSM-11` | Impact is wholly before origin or after destination and breaks no required transfer or alternate; Gate 8 or 9 Fail | **Suppress** | Preserve the exact distant scope |
| `NSM-12` | Impact applies only to the opposite saved direction; Gate 7 Fail | **Suppress** | Do not widen to both directions |
| `NSM-13` | Current relevant impact omits or conflicts on direction; Gate 7 Unresolved and no Fail | **Hold for stronger evidence** | Send nothing until exact direction or supported both-directions scope resolves |
| `NSM-14` | Accepted planned work overlaps the future preparation/window interval; route, stop, direction, consequence, and all other gates Pass | **Send** | Candidate wording remains future-effective; current arrival admission is unchanged |
| `NSM-15` | Planned work does not overlap the saved interval; Gate 2 or 8 Fail | **Suppress** | Do not notify merely because the route is named |
| `NSM-16` | Planned sources conflict or effective scope/time is unresolved; no Fail | **Hold for stronger evidence** | Do not choose one plan or claim current operation |
| `NSM-17` | Current exact suspension overlaps the used route segment and direction; all gates Pass | **Send** | Preserve exact route, segment, direction, and time |
| `NSM-18` | Exact used constituent, entrance, exit, or transfer closure is current and decision-changing; all gates Pass | **Send** | Name only the proven exact scope |
| `NSM-19` | Task 3 later proves the delay or journey effect is below threshold; Gate 10 Fail | **Suppress** | No rounding up or severity substitution |
| `NSM-20` | One inferred delay/gap update exists but required persistence is not complete; Gate 10 Unresolved | **Hold for stronger evidence** | Send nothing from transient evidence |
| `NSM-21` | Routine schedule variance or minor spacing change fails Task 3 materiality; Gate 9 or 10 Fail | **Suppress** | Do not reward notification volume |
| `NSM-22` | Generic data outage and no approved explicit data-health opt-in; Gate 3 or 9 Fail | **Suppress** | No commute disruption push |
| `NSM-23` | Rider hypothetically opted into a separately approved data-health product | **Suppress** | Hand off to that future owner; it is not a commute disruption Send |
| `NSM-24` | Equivalent prior message exists for the same episode and materially equivalent impact; Gate 12 Fail | **Suppress** | One episode/update copy does not create another push |
| `NSM-25` | Alert copy changes but resolved impact and useful action do not; Gate 12 Fail | **Suppress** | Wording-only update is not a new message |
| `NSM-26` | Timestamp renews but impact and action do not; Gate 12 Fail | **Suppress** | Fresh packaging is not fresh consequence |
| `NSM-27` | Equipment issue is unrelated to the selected complete path; Gate 8 Fail | **Suppress** | Do not infer whole-station inaccessibility |
| `NSM-28` | Exact current reroutable-within-station path loss requires a verified path choice; all gates Pass | **Send** | Name exact path consequence and independently verified choice |
| `NSM-29` | Exact current blocking saved-path loss is decision-changing; all gates Pass | **Send** | A verified alternative is optional; avoiding the trip can be the action |
| `NSM-30` | Equipment evidence is stale or unavailable and currentness definitely Fails | **Suppress** | No outage or restoration claim |
| `NSM-31` | Independently verified alternative changes the rider’s route, station, entrance, transfer, or path; all gates Pass | **Send** | Alternative never rewrites or auto-activates the primary |
| `NSM-32` | Underlying disruption independently passes; proposed alternative has an Unresolved accessible edge but can be omitted without changing disruption truth | **Send** | Omit the alternative and never call it accessible |
| `NSM-33` | Accepted usable alternate means no material action changes for the saved journey; Gate 9 Fail | **Suppress** | Alternative availability does not create a message |
| `NSM-34` | Only an unused listed alternate is disrupted and no contingency need exists; Gate 6 or 9 Fail | **Suppress** | Do not notify for inventory-only route relevance |
| `NSM-35` | No current disruption evidence exists | **Suppress** | Silence is not Good service or all-clear |
| `NSM-36` | Only crowding, proxy crowding, historical load, or station density changes | **Suppress** | No crowding commute notification |
| `NSM-37` | Proposed primary or alternate consequence is LIRR or Metro-North | **Suppress** | Subway-only launch boundary remains intact |
| `NSM-38` | Exact destination directional stop is bypassed and all gates Pass | **Send** | State that the saved destination cannot be reached as planned |
| `NSM-39` | Exact required transfer stop is bypassed and all gates Pass | **Send** | Do not widen failure to every transfer at the complex |
| `NSM-40` | Current short turn ends before the saved destination or required transfer and all gates Pass | **Send** | Name the exact terminal and saved-journey consequence |
| `NSM-41` | Exact selected entrance or exit is closed but another independently verified option requires a choice; all gates Pass | **Send** | Name the access point and verified option; no whole-station claim |
| `NSM-42` | Stale-only or unavailable accessibility evidence yields Unknown with no current adverse fact | **Suppress** | Make no outage claim; a future owner decision may create a new candidate |
| `NSM-43` | Current exact accessibility consequence is Unknown and material, owner permits cannot-verify treatment, and no gate Fails | **Hold for stronger evidence** | No definitive outage or accessible-alternative claim |
| `NSM-44` | A known exact adverse accessibility state is being rechecked and remains current under owner treatment; all other gates Pass | **Send** | Preserve only the exact adverse consequence; never imply restoration |

## Isolation rules

- One Send never authorizes a notification for an unaffected route, direction, segment, constituent, entrance, exit, transfer, path, or window.
- One Suppress never proves normal service, clears a stop veto, or weakens a known adverse accessibility state.
- One Hold never permits generic wording, an unsupported alternative, or a late send.
- A delay notification does not suppress an arrival.
- Equipment impact does not suppress a train arrival.
- A resolved bypass notification does not describe the bypassed stop as served.

## Draft review checklist

- [ ] Every row has exactly one of the three notification outcomes.
- [ ] Every Fail suppresses and every no-Fail Unresolved branch holds.
- [ ] Complete-pass Send rows still defer delivery, content, permission, and episode algorithms.
- [ ] Planned overlap and unplanned evidence remain distinct.
- [ ] Generic Affected, stale evidence, minor variance, data outage, duplicates, crowding, and rail never become disruption Sends.
- [ ] Exact bypass, suspension, closure, short turn, and path-loss branches preserve exact scope.
- [ ] Accessibility alternatives are independently verified or omitted.
- [ ] No row changes arrival-board, equipment, accessibility, or service-owner truth.
- [ ] All scenario observations and reviewer decisions remain Not run — Pending.

Every unchecked item blocks approval. This documentation commit is not working-product evidence.
