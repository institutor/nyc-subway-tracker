# Commute threshold boundary cases

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§25.4 and 31.8; additional applying approved specification §§5.1–5.2, 8, 22–23.6, 25.3, 27, 29.3, 30.2–30.3, 31.6–31.8 scenarios 36–39, 42, and 48, 33.1, 33.3, 33.5, and 34–35; commute alerts and launch quality plan Task 3 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-threshold-fixture) |

## Purpose and authority

These fixed synthetic fixtures prove the exact unrounded comparator, equality, baseline, persistence, immediate-incident, transfer-handoff, freshness, and veto behavior in the [delay threshold policy](../commute/delay-threshold-policy.md). They consume the [notification eligibility contract](../commute/notification-eligibility-contract.md) and do not define delivery copy, permission, deduplication algorithms, retention, operations, or launch.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) remains in force. No fixture has run.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites §§25.4 and 31.8 and lists Product, Data Quality, Content, and Operations. These fixtures additionally apply §§5.1–5.2, 8, 22–23.6, 25.3, 27, 29.3, 30.2–30.3, 31.6–31.8 scenarios 36–39, 42, and 48, 33.1, 33.3, 33.5, 34–35, full Task 3 provenance, and mandatory Accessibility review for the blocking accessible-path branch. Product Governance reconciliation remains **Pending**. This task does not edit the index.

## Fixed fixture record

`CTB-T3-POLICY-v1` identifies these definitions only. The commit containing this artifact binds their text after commit. Every `CTB-*-SRC-v1` package is synthetic; fixed product/build is **Pending**.

Unless a row says otherwise, all Task 2 gates Pass, there is no veto or duplicate, two distinct coherent qualifying updates occur at authoritative `t=0s` and `t=60s`, and final currentness/window/scope recheck Passes. All arithmetic uses authoritative unrounded seconds at `p=1s`.

Every future execution must record the full evidence schema required by the policy: fixed versions/window, New York occurrence and service date, authoritative timestamps, source/effective/original text/structured scope, feed and alert state, baseline family/value/version, unrounded `T/H/W/G/J0/J1/ΔJ`, Task 9 handoff, coherence/span/reset, all Task 2 gates and vetoes, threshold and final outcome, unaffected service, expected and prohibited visible and assistive result, actual observation, reviewers/dates, evidence, failure, correction, preserved original, rerun, and status. It contains no personal identity, location, or history.

## Fixed synthetic fixture definitions

| Fixture and source | Fixed unrounded inputs and baseline | Expected threshold, persistence, and notification result | Expected visible and assistive meaning | Prohibited result |
|---|---|---|---|---|
| `CTB-TOL-05-BELOW`; `CTB-TOL-05-BELOW-SRC-v1` | Journey baseline; `T=300`, `ΔJ=299` | Strict threshold Fail → **Suppress** | No threshold-qualified delay notification | Round to five minutes; aggregate another signal |
| `CTB-TOL-05-AT`; `CTB-TOL-05-AT-SRC-v1` | `T=300`, `ΔJ=300` | Equality Fails → **Suppress** | No threshold-qualified delay notification | Treat “exceeds” as “at least” |
| `CTB-TOL-05-ABOVE`; `CTB-TOL-05-ABOVE-SRC-v1` | `T=300`, `ΔJ=301` | Threshold and persistence Pass → **Send** after final recheck | One delay candidate; no invented display precision | Round down or require `>=301` as a new policy |
| `CTB-TOL-10-BELOW`; `CTB-TOL-10-BELOW-SRC-v1` | `T=600`, `ΔJ=599` | Fail → **Suppress** | No candidate | Use five-minute default |
| `CTB-TOL-10-AT`; `CTB-TOL-10-AT-SRC-v1` | `T=600`, `ΔJ=600` | Equality Fails → **Suppress** | No candidate | Qualify equality |
| `CTB-TOL-10-ABOVE`; `CTB-TOL-10-ABOVE-SRC-v1` | `T=600`, `ΔJ=601` | Pass → **Send** after final recheck | One candidate | Reuse prior tolerance episode |
| `CTB-TOL-15-BELOW`; `CTB-TOL-15-BELOW-SRC-v1` | `T=900`, `ΔJ=899` | Fail → **Suppress** | No candidate | Round up |
| `CTB-TOL-15-AT`; `CTB-TOL-15-AT-SRC-v1` | `T=900`, `ΔJ=900` | Equality Fails → **Suppress** | No candidate | Qualify equality |
| `CTB-TOL-15-ABOVE`; `CTB-TOL-15-ABOVE-SRC-v1` | `T=900`, `ΔJ=901` | Pass → **Send** after final recheck | One candidate | Silent tolerance switch |
| `CTB-NVA-LOW-BELOW`; `CTB-NVA-LOW-BELOW-SRC-v1` | No-arrival baseline; `H=300`; bound `max(720,600)=720`; `W=719` | Fail → **Suppress** | No candidate | Treat nearby unrelated arrival as exact-stop evidence |
| `CTB-NVA-LOW-AT`; `CTB-NVA-LOW-AT-SRC-v1` | `H=300`, bound `720`, `W=720` | Strict equality Fails → **Suppress** | No candidate | Qualify equality |
| `CTB-NVA-LOW-ABOVE`; `CTB-NVA-LOW-ABOVE-SRC-v1` | `H=300`, bound `720`, `W=721` | Pass → **Send** after persistence/final recheck | One no-arrival delay candidate | Call feed outage a delay |
| `CTB-NVA-EQUAL-BELOW`; `CTB-NVA-EQUAL-BELOW-SRC-v1` | `H=360`; `720=2H`; `W=719` | Fail → **Suppress** | No candidate | Choose a different active bound |
| `CTB-NVA-EQUAL-AT`; `CTB-NVA-EQUAL-AT-SRC-v1` | `H=360`, bound `720`, `W=720` | Equality Fails → **Suppress** | No candidate | Qualify equality |
| `CTB-NVA-EQUAL-ABOVE`; `CTB-NVA-EQUAL-ABOVE-SRC-v1` | `H=360`, bound `720`, `W=721` | Pass → **Send** after persistence/final recheck | One candidate | Rounded wait |
| `CTB-NVA-HIGH-BELOW`; `CTB-NVA-HIGH-BELOW-SRC-v1` | `H=480`; bound `960`; `W=959` | Fail → **Suppress** | No candidate | Use fixed 720 bound |
| `CTB-NVA-HIGH-AT`; `CTB-NVA-HIGH-AT-SRC-v1` | `H=480`, `W=960` | Equality Fails → **Suppress** | No candidate | Qualify equality |
| `CTB-NVA-HIGH-ABOVE`; `CTB-NVA-HIGH-ABOVE-SRC-v1` | `H=480`, `W=961` | Pass → **Send** after persistence/final recheck | One candidate | Mix service-period headway |
| `CTB-GAP-LOW-BELOW`; `CTB-GAP-LOW-BELOW-SRC-v1` | Gap baseline; `H=300`; bound `max(600,660)=660`; `G=659` | Fail → **Suppress** | No candidate | Sum subthreshold conditions |
| `CTB-GAP-LOW-AT`; `CTB-GAP-LOW-AT-SRC-v1` | `H=300`, `G=660`; `G−H=360` | Both `>=` equalities Pass → **Send** after persistence/final recheck | One gap candidate | Treat equality as Fail |
| `CTB-GAP-LOW-ABOVE`; `CTB-GAP-LOW-ABOVE-SRC-v1` | `H=300`, `G=661` | Pass → **Send** | One candidate | Rounded comparator |
| `CTB-GAP-EQUAL-BELOW`; `CTB-GAP-EQUAL-BELOW-SRC-v1` | `H=360`; both bounds `720`; `G=719` | Fail → **Suppress** | No candidate | Choose only one incomplete rule |
| `CTB-GAP-EQUAL-AT`; `CTB-GAP-EQUAL-AT-SRC-v1` | `H=360`, `G=720` | Both equalities Pass → **Send** | One candidate | Strict comparator |
| `CTB-GAP-EQUAL-ABOVE`; `CTB-GAP-EQUAL-ABOVE-SRC-v1` | `H=360`, `G=721` | Pass → **Send** | One candidate | Baseline switch |
| `CTB-GAP-HIGH-BELOW`; `CTB-GAP-HIGH-BELOW-SRC-v1` | `H=480`; bound `max(960,840)=960`; `G=959` | Fail → **Suppress** | No candidate | Use `H+360` alone |
| `CTB-GAP-HIGH-AT`; `CTB-GAP-HIGH-AT-SRC-v1` | `H=480`, `G=960` | Equality Passes → **Send** | One candidate | Equality Fail |
| `CTB-GAP-HIGH-ABOVE`; `CTB-GAP-HIGH-ABOVE-SRC-v1` | `H=480`, `G=961` | Pass → **Send** | One candidate | Mixed-direction arrivals |
| `CTB-PERSIST-ONE`; `CTB-PERSIST-ONE-SRC-v1` | One qualifying inferred update at `t=0` | Persistence Unresolved → **Hold for stronger evidence** | Send nothing | One-update push |
| `CTB-PERSIST-59`; `CTB-PERSIST-59-SRC-v1` | Distinct qualifying updates at `t=0` and `t=59` | Span too short → **Hold for stronger evidence** | Send nothing | Round to 60 |
| `CTB-PERSIST-60`; `CTB-PERSIST-60-SRC-v1` | Distinct coherent qualifying updates at `t=0` and `t=60` | Equality Passes → **Send** after final recheck | One candidate | Require more than 60 |
| `CTB-PERSIST-61`; `CTB-PERSIST-61-SRC-v1` | Distinct coherent qualifying updates at `t=0` and `t=61` | Pass → **Send** | One candidate | Duplicate message |
| `CTB-PERSIST-RESET-NONQUALIFY`; `CTB-PERSIST-RESET-NONQUALIFY-SRC-v1` | Journey baseline; first `T=300`, `ΔJ=301` qualifying update at `t=0`; then `ΔJ=300` at `t=60` on the same baseline | Prior credit resets; strict journey threshold Fails → **Suppress** | No delay notification | Treat equality as qualifying; retain the first update; Hold despite definite threshold Fail |
| `CTB-PERSIST-RESET-CONTRADICTION`; `CTB-PERSIST-RESET-CONTRADICTION-SRC-v1` | First same-scope qualifying update at `t=0`; explicit same-scope contradiction at `t=60` leaves no definite Fail | Prior credit resets; exact impact Unresolved → **Hold for stronger evidence** | Send nothing; retain the unresolved reason internally | Choose either observation; preserve persistence credit; definitive delay |
| `CTB-PERSIST-RESET-STALE`; `CTB-PERSIST-RESET-STALE-SRC-v1` | First qualifying update at `t=0`; governing evidence is stale at `t=60` | Prior credit resets; currentness Fails → **Suppress** | No notification and no late queue | Hold stale evidence; refresh wording; late-send after recovery |
| `CTB-PERSIST-RESET-QUARANTINE`; `CTB-PERSIST-RESET-QUARANTINE-SRC-v1` | First qualifying update at `t=0`; anomaly-quarantined candidate at `t=60`; no accepted replacement exists | Prior credit resets; source and exact impact Unresolved → **Hold for stronger evidence** | Send nothing; preserve quarantine isolation | Treat quarantined input as update two; definite delay; suppress unrelated service |
| `CTB-PERSIST-RESET-BASELINE`; `CTB-PERSIST-RESET-BASELINE-SRC-v1` | First qualifying update on old baseline at `t=0`; one qualifying first update on a new service-date or pattern baseline at `t=60` | Old credit resets; new baseline has one update → **Hold for stronger evidence** | Send nothing until a second coherent qualifying update on the new baseline | Join service dates or patterns; reuse old credit; Send at rollover |
| `CTB-PERSIST-REPLAY`; `CTB-PERSIST-REPLAY-SRC-v1` | Same source record replayed or timestamp-only copy at `t=60` | Not distinct → **Hold for stronger evidence** | Send nothing | Treat delivery copy as observation |
| `CTB-S48-FOUR`; `CTB-S48-FOUR-SRC-v1` | Scenario 48; `T=300`, `ΔJ=240` on two updates | Threshold Fail → **Suppress** | No delay notification | “Nearly five” qualification |
| `CTB-S48-AT-FIVE`; `CTB-S48-AT-FIVE-SRC-v1` | `T=300`, `ΔJ=300` | Equality Fails → **Suppress** | No delay notification | `>=` comparator |
| `CTB-S48-ABOVE-ONE`; `CTB-S48-ABOVE-ONE-SRC-v1` | `T=300`, `ΔJ=301`; one update | Threshold Pass; persistence Unresolved → **Hold for stronger evidence** | Send nothing | Immediate inferred push |
| `CTB-S48-ABOVE-PERSISTED`; `CTB-S48-ABOVE-PERSISTED-SRC-v1` | `ΔJ=301` at `t=0/60`, same baseline | Threshold/persistence Pass → **Send** after final recheck | One candidate | Recalculate with rounded minutes |
| `CTB-MULTI-SUBTHRESHOLD`; `CTB-MULTI-SUBTHRESHOLD-SRC-v1` | Several separate families each Fail their threshold | No family Passes → **Suppress** | No candidate | Sum moderate impacts |
| `CTB-MULTI-TWO-PASS`; `CTB-MULTI-TWO-PASS-SRC-v1` | Two families independently Pass for materially equivalent impact | Threshold Pass → one **Send** candidate | One candidate only | Two candidates or double count |
| `CTB-MULTI-END-TO-END`; `CTB-MULTI-END-TO-END-SRC-v1` | One provenance-complete `ΔJ>T` includes several conditions already inside `J1` | Journey family Pass → **Send** | One end-to-end candidate | Add component delays again |
| `CTB-OFFICIAL-CURRENT`; `CTB-OFFICIAL-CURRENT-SRC-v1` | Current resolved official active delay on exact saved segment; decision-changing | Signal Pass after one current alert; all Task 2 gates Pass → **Send** | One exact-scope delay candidate | Invent minutes or stop veto |
| `CTB-OFFICIAL-NONDECISION`; `CTB-OFFICIAL-NONDECISION-SRC-v1` | Current official delay does not change saved-journey action | Task 2 decision gate Fails → **Suppress** | No candidate | Alert-name-only push |
| `CTB-OFFICIAL-UNRESOLVED`; `CTB-OFFICIAL-UNRESOLVED-SRC-v1` | Current official alert likely relevant but exact direction/segment unresolved | Task 2 Unresolved → **Hold for stronger evidence** | Send nothing | Broad definitive delay |
| `CTB-OFFICIAL-GENERIC-AFFECTED`; `CTB-OFFICIAL-GENERIC-AFFECTED-SRC-v1` | Only generic **Affected** and no exact decision consequence | Decision gate Fails → **Suppress** | No candidate | Infer bypass/suspension |
| `CTB-OFFICIAL-STALE`; `CTB-OFFICIAL-STALE-SRC-v1` | Official alert age 601 seconds | Currentness Fails → **Suppress** | No stale message or all-clear | Reword stale alert as current |
| `CTB-OFFICIAL-WORDING-ONLY`; `CTB-OFFICIAL-WORDING-ONLY-SRC-v1` | Same episode/impact/action; text or timestamp only changes | Duplicate gate Fails → **Suppress** | No second candidate | New notification from copy |
| `CTB-IMMEDIATE-SUSPENSION`; `CTB-IMMEDIATE-SUSPENSION-SRC-v1` | One current coherent exact suspension snapshot | Immediate threshold Pass; all other gates Pass → **Send** | One exact-scope candidate | Require inferred persistence or widen |
| `CTB-IMMEDIATE-CLOSURE`; `CTB-IMMEDIATE-CLOSURE-SRC-v1` | One current coherent exact closure snapshot | Immediate Pass → **Send** | One exact closure candidate | Whole-complex inference |
| `CTB-IMMEDIATE-BYPASS`; `CTB-IMMEDIATE-BYPASS-SRC-v1` | One current coherent exact bypass snapshot | Immediate Pass → **Send** | One bypass candidate | Say stop is served |
| `CTB-IMMEDIATE-SHORT-TURN`; `CTB-IMMEDIATE-SHORT-TURN-SRC-v1` | One current coherent short turn ending before required stop | Immediate Pass → **Send** | One exact journey candidate | Every-rider widening |
| `CTB-IMMEDIATE-ACCESSIBLE-PATH`; `CTB-IMMEDIATE-ACCESSIBLE-PATH-SRC-v1` | One current coherent blocking exact path/version outage handoff | Immediate Pass → **Send** | Name exact path consequence; verified alternative only | Whole-station claim; waive ARO |
| `CTB-XFER-ONE`; `CTB-XFER-ONE-SRC-v1` | One calculated transfer handoff shows normally viable → Tight | Persistence Unresolved → **Hold for stronger evidence** | Send nothing | One inferred transfer push |
| `CTB-XFER-TIGHT-PERSISTED`; `CTB-XFER-TIGHT-PERSISTED-SRC-v1` | Fixed Task 9 handoff shows Tight at `t=0/60` | Pass → **Send** | One transfer-change candidate | Recalculate Task 9 buffers |
| `CTB-XFER-UNCERTAIN-PERSISTED`; `CTB-XFER-UNCERTAIN-PERSISTED-SRC-v1` | Fixed Task 9 handoff shows Uncertain at `t=0/60` | Pass → **Send** | One transfer-change candidate | Promise connection |
| `CTB-XFER-LIKELY`; `CTB-XFER-LIKELY-SRC-v1` | Current fixed handoff remains Likely | Trigger Fails → **Suppress** | No transfer alert | Add Unlikely or new threshold |
| `CTB-XFER-MISSING-HANDOFF`; `CTB-XFER-MISSING-HANDOFF-SRC-v1` | Task 9 handoff absent, stale, or differently versioned | Unresolved → **Hold for stronger evidence** | Send nothing | Recompute locally |
| `CTB-FINAL-ALERT600`; `CTB-FINAL-ALERT600-SRC-v1` | Passing current official alert age exactly 600 seconds at final recheck | Current → **Send** | One candidate | Treat 600 as stale |
| `CTB-FINAL-ALERT601`; `CTB-FINAL-ALERT601-SRC-v1` | Same alert age 601 seconds at final recheck | Stale → **Suppress** | No late send | Grace period |
| `CTB-FINAL-FEED90`; `CTB-FINAL-FEED90-SRC-v1` | Passing real-time-derived signal age exactly 90 seconds | Current → **Send** | One candidate | Treat 90 as Degraded |
| `CTB-FINAL-FEED91`; `CTB-FINAL-FEED91-SRC-v1` | Same real-time evidence age 91 seconds | Degraded/currentness Fail → **Suppress** | No late send | Phone-time override |
| `CTB-VETO-ORIGIN-REMOVED`; `CTB-VETO-ORIGIN-REMOVED-SRC-v1` | Delay initially qualifies; newer accepted pattern removes saved origin before final decision | Discard delay; Task 2 bypass gates Pass → one **Send** bypass candidate | Origin is absent under arrival owner; notification meaning is bypass, not delay | Keep arrival, show two candidates, prediction clears veto |

## Pending execution record for every threshold fixture

| Fixture | Actual visible and assistive result | Reviewer decisions/dates | Evidence/failure | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `CTB-TOL-05-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-05-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-05-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-10-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-10-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-10-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-15-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-15-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-TOL-15-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-LOW-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-LOW-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-LOW-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-EQUAL-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-EQUAL-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-EQUAL-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-HIGH-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-HIGH-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-NVA-HIGH-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-LOW-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-LOW-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-LOW-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-EQUAL-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-EQUAL-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-EQUAL-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-HIGH-BELOW` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-HIGH-AT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-GAP-HIGH-ABOVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-ONE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-59` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-60` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-61` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-RESET-NONQUALIFY` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-RESET-CONTRADICTION` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-RESET-STALE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-RESET-QUARANTINE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-RESET-BASELINE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-PERSIST-REPLAY` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-S48-FOUR` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-S48-AT-FIVE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-S48-ABOVE-ONE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-S48-ABOVE-PERSISTED` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-MULTI-SUBTHRESHOLD` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-MULTI-TWO-PASS` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-MULTI-END-TO-END` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-OFFICIAL-CURRENT` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-OFFICIAL-NONDECISION` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-OFFICIAL-UNRESOLVED` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-OFFICIAL-GENERIC-AFFECTED` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-OFFICIAL-STALE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-OFFICIAL-WORDING-ONLY` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-IMMEDIATE-SUSPENSION` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-IMMEDIATE-CLOSURE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-IMMEDIATE-BYPASS` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-IMMEDIATE-SHORT-TURN` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-IMMEDIATE-ACCESSIBLE-PATH` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-XFER-ONE` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-XFER-TIGHT-PERSISTED` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-XFER-UNCERTAIN-PERSISTED` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-XFER-LIKELY` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-XFER-MISSING-HANDOFF` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-FINAL-ALERT600` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-FINAL-ALERT601` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-FINAL-FEED90` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-FINAL-FEED91` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |
| `CTB-VETO-ORIGIN-REMOVED` | **Pending — not observed** | All five roles **Pending**; dates **Pending** | **Pending — none** | **Pending** | **Pending — not run** | **Not run — Pending** |

## Draft review checklist

- [ ] All nine tolerance, nine no-arrival, and nine gap one-second boundary fixtures exist.
- [ ] Persistence covers one, 59, 60, 61, nonqualifying, contradiction, stale, quarantine, and baseline reset branches, and replay.
- [ ] Scenario 48, multiple-signal, official-alert, immediate, transfer, final-freshness, and origin-veto fixtures exist.
- [ ] Every definition uses unrounded authoritative seconds and a fixed baseline.
- [ ] Every execution field remains Pending and every original failure will be preserved.
- [ ] No fixture contains personal identity, location, or history.

Every unchecked item blocks approval. Definitions are not evidence.
