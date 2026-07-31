# Commute time edge cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§5.1–5.2, 8, 22–23.6, 25.1, 25.3–25.4, 27, 29.3, 30.2–30.3, 31.6–31.8 scenarios 36–39, 42, and 48, 33.1, 33.3, 33.5, and 34–35; commute alerts and launch quality plan Task 3 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-time-fixture) |

## Purpose and authority

These fixed synthetic cases prove the New York half-open watch interval, overnight and service-date handling, daylight-saving behavior, authoritative-time priority, final stale and veto treatment, and prospective baseline resets required by the [delay threshold policy](../commute/delay-threshold-policy.md) and Task 1 [commute window contract](../commute/commute-window-contract.md).

They consume the [notification eligibility contract](../commute/notification-eligibility-contract.md). They do not define permission, content, delivery, episode algorithms, retention, operations, or launch.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) remains in force. No fixture has run.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§5.1–5.2, 8, 22–23.6, 25.1, 25.3–25.4, 27, 29.3, 30.2–30.3, 31.6–31.8 scenarios 36–39, 42, and 48, 33.1, 33.3, 33.5, and 34–35, full Task 3 provenance, and Product, Data Quality, Content, and Operations review. That metadata alignment is not approval; every time-edge observation and same-version reviewer decision remains **Pending**.

## Fixed time record

`CTE-T3-POLICY-v1` identifies these definitions only. The commit containing this artifact binds their text after commit. Every `CTE-*-SRC-v1` package is synthetic; fixed product/build remains **Pending**.

Unless stated otherwise, one complete Active confirmed Task 1 window uses New York local start `08:00:00`, end `09:00:00`, and preparation lead `900s`, producing `[07:45:00, 09:00:00)`. A qualifying threshold and persistence result, exact relevance, no veto, no duplicate, and current source are fixed solely to isolate time behavior. Precision is one authoritative second.

Every future execution records fixed versions/window, New York occurrence and service date, authoritative instants and displayed wall times, source/effective/original structured scope, feed and alert state, baseline family/value/version, unrounded threshold values, transfer handoff, coherence/span/reset, all Task 2 gates/vetoes/threshold/final outcome/unaffected service, expected and prohibited visible and assistive result, actual observation, reviewer/date/evidence/failure/correction/preserved original/rerun/status, and no personal identity, location, or history.

## Fixed synthetic time fixtures

| Fixture and source | Fixed authoritative and New York time inputs | Expected time, threshold, and notification result | Expected visible and assistive meaning | Prohibited result |
|---|---|---|---|---|
| `CTE-WATCH-BEFORE`; `CTE-WATCH-BEFORE-SRC-v1` | Evaluate `07:44:59`, one second before opening | Time gate Fails → **Suppress** | No notification | Round into interval; queue for opening |
| `CTE-WATCH-START`; `CTE-WATCH-START-SRC-v1` | Evaluate exactly `07:45:00`, inclusive opening | Time Pass; all final gates Pass → **Send** | One candidate only | Treat opening as exclusive; automatic alarm without disruption |
| `CTE-WATCH-DURING`; `CTE-WATCH-DURING-SRC-v1` | Evaluate `08:30:00` | Time Pass → **Send** | One candidate | Daily-window-only alarm |
| `CTE-WATCH-END-MINUS-1`; `CTE-WATCH-END-MINUS-1-SRC-v1` | Evaluate `08:59:59` | Time Pass → **Send** | One candidate after final recheck | Round to end |
| `CTE-WATCH-END`; `CTE-WATCH-END-SRC-v1` | Evaluate exactly `09:00:00`, exclusive end | Time Fails → **Suppress** | No notification | Treat end as inclusive |
| `CTE-WATCH-END-PLUS-1`; `CTE-WATCH-END-PLUS-1-SRC-v1` | Evaluate `09:00:01` | Time Fails → **Suppress** | No notification | Grace period or late send |
| `CTE-PERSIST-CROSSES-END`; `CTE-PERSIST-CROSSES-END-SRC-v1` | First qualifying inferred update `08:59:00`; second distinct update exactly `09:00:00` | Persistence span reaches 60s, but final time gate Fails → **Suppress** | No notification and no delayed queue | Send because persistence completed |
| `CTE-OVERNIGHT`; `CTE-OVERNIGHT-SRC-v1` | Monday `23:30:00` start, Tuesday `01:00:00` end; confirmed lead fixed | One Monday occurrence spanning midnight | Preserve one occurrence and authoritative order | Tuesday reassignment, split, duplicate |
| `CTE-LEAD-PREV`; `CTE-LEAD-PREV-SRC-v1` | Monday start `00:15:00`, end `01:00:00`, lead `1800s`; watch opens Sunday `23:45:00` | One Monday occurrence; Sunday lead instant is inside | Preserve Monday weekday and one interval | Sunday recurrence, two occurrences |
| `CTE-SERVICE-DATE-25H`; `CTE-SERVICE-DATE-25H-SRC-v1` | Source trip operating service date Monday, source time `25:10:00`; rider display Tuesday `01:10:00` | Preserve Monday source service date and next-day display | One coherent trip chronology | Calendar-date reassignment, duplicate, negative time |
| `CTE-DST-FALL`; `CTE-DST-FALL-SRC-v1` | One recurrence intersects repeated New York hour; authoritative instants distinguish first and second folds | One occurrence and one episode/delivery state | Wall-time meaning remains stable; no duplicate | Two recurrences, phone-order chronology, reactivation |
| `CTE-DST-SPRING-MISSING`; `CTE-DST-SPRING-MISSING-SRC-v1` | Window lies wholly inside nonexistent spring-forward wall interval | No occurrence that day; lifecycle remains Active | No shifted or phantom opportunity | Shift to 03:00, expire, notify |
| `CTE-DST-SPRING-SPAN`; `CTE-DST-SPRING-SPAN-SRC-v1` | Window starts before and ends after missing interval | One spanning occurrence | Preserve one authoritative chronology | Split, add invented hour, duplicate |
| `CTE-PHONE-SAYS-CURRENT`; `CTE-PHONE-SAYS-CURRENT-SRC-v1` | Authoritative alert age `601s`; phone-derived view would report `599s` | Authoritative stale result controls → **Suppress** | No current claim | Phone makes stale evidence current; invent skew |
| `CTE-PHONE-SAYS-STALE`; `CTE-PHONE-SAYS-STALE-SRC-v1` | Authoritative alert age `600s`; phone-derived view would report `601s` | Authoritative Current result controls; all gates Pass → **Send** | One candidate without exposing phone disagreement | Phone vetoes current evidence; invent skew tolerance |
| `CTE-FINAL-STALE`; `CTE-FINAL-STALE-SRC-v1` | Candidate initially passes; accepted evidence becomes stale before final decision | Final currentness Fails → **Suppress** | No late notification; later fresh data starts new evaluation | Deliver cached candidate; all-clear |
| `CTE-FINAL-VETO`; `CTE-FINAL-VETO-SRC-v1` | Delay qualifies; before final decision a newer accepted pattern removes saved origin | Discard delay; exact bypass gates Pass → one **Send** bypass candidate | Separate arrival owner retains stop veto; notification meaning is bypass | Keep arrival, two candidates, prediction clears veto |
| `CTE-BASELINE-ROLLOVER`; `CTE-BASELINE-ROLLOVER-SRC-v1` | First qualifying update uses one service date/pattern/baseline; second uses a new edition or service date | Baseline change resets persistence → **Hold for stronger evidence** | Send nothing until two updates on new baseline | Carry prior credit; join dates/patterns |
| `CTE-TOLERANCE-CHANGE`; `CTE-TOLERANCE-CHANGE-SRC-v1` | First `T=300`, `ΔJ=601` qualifying update at `t=0`; rider explicitly changes to `T=600` before the next observation; `T=600`, `ΔJ=601` at `t=60` is the first qualifying update on the new baseline | Change is prospective; old persistence resets; new baseline has one qualifying update → **Hold for stronger evidence** and no Send | Preserve the new stored `T=600` value and send nothing until a second coherent qualifying update on that baseline | Retroactive reclassification, mixed-tolerance episode, reuse of old credit, Send at `t=60` |

## Pending execution record for every time fixture

| Fixture | Actual visible and assistive result | Reviewer decisions/dates | Evidence/failure | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `CTE-WATCH-BEFORE` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-WATCH-START` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-WATCH-DURING` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-WATCH-END-MINUS-1` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-WATCH-END` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-WATCH-END-PLUS-1` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-PERSIST-CROSSES-END` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-OVERNIGHT` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-LEAD-PREV` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-SERVICE-DATE-25H` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-DST-FALL` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-DST-SPRING-MISSING` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-DST-SPRING-SPAN` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-PHONE-SAYS-CURRENT` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-PHONE-SAYS-STALE` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-FINAL-STALE` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-FINAL-VETO` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-BASELINE-ROLLOVER` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTE-TOLERANCE-CHANGE` | **Pending — not observed** | Product, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |

## Draft review checklist

- [ ] Half-open boundaries cover before, opening, during, end minus one second, end, and end plus one second.
- [ ] Persistence completing at the exclusive end cannot Send.
- [ ] Overnight, prior-date lead, beyond-24:00 service date, fall-back, spring-missing, and spring-spanning cases are deterministic.
- [ ] Both phone/authoritative disagreement directions use authoritative time and invent no skew.
- [ ] Final stale and final origin-veto cases suppress or reclassify conservatively.
- [ ] Baseline and tolerance changes reset prospectively.
- [ ] All observations, reviewers, evidence, failures, corrections, reruns, and statuses remain Pending.

Every unchecked item blocks approval. Definitions are not evidence.
