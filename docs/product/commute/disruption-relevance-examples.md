# Commute disruption relevance examples

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§25.3 and 31.6; additional applying approved specification §§8, 20, 22, 25.2, and 27; commute alerts and launch quality plan Task 2 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-example) |

## Purpose and authority

These fixed synthetic examples define evidence needed to test the [notification eligibility contract](notification-eligibility-contract.md) and [suppression matrix](notification-suppression-matrix.md). They do not define thresholds, delivery timing, message copy, permission behavior, episode algorithms, retention, operations, or launch.

Task 1’s [commute window contract](commute-window-contract.md) and [field dictionary](commute-window-field-dictionary.md) remain unchanged. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. Every source package below is synthetic. No real alert, feed record, outage, commute, source capture, product/build, visible or assistive observation, notification, delivery, reviewer decision, approval, or release evidence exists.

The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) and the separate accessibility no-go in the [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md) remain in force.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§8, 20, 22, 25.2–25.3, 27, and 31.6, full Task 2 provenance, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every relevance fixture and same-version reviewer decision remains **Pending**.

## Fixed record contract

`REL-T2-POLICY-v1` identifies these policy definitions only. The commit containing this artifact binds their text after commit. It is not a product version, evidence, approval, or authorization. Every source package named `REL-xx-SRC-v1` is synthetic; the fixed product/build remains **Pending**.

Every future evaluated record must capture:

- exact fixed product/build and versions of Task 1, the eligibility contract, matrix, this example, and every upstream truth owner;
- every window field, lifecycle, confirmation provenance, authoritative evaluation instant, New York occurrence, and lead/window boundaries;
- source/version, accepted timestamp, owner freshness result, original text, structured fields, planned or unplanned state, and effective interval;
- effective pattern and exact route, station, constituent, segment, direction, destination, train/entity, entrance, exit, transfer, and complete-path scopes;
- entity match, structured/text agreement, conflict, current negative veto, anomaly, and source-health result;
- exact accessibility path/version, equipment or connection, state, freshness, impact class, journey consequence, and verified alternative or no-alternative result when applicable;
- every proposed alternate and its independent stop, direction, transfer, truth, and accessibility decisions;
- all twelve gate states, evidence references, exactly one notification outcome, episode/dedup handoff, and unaffected services and scopes;
- expected and prohibited visible and assistive output, actual observation, all five same-version reviewer decisions and dates, durable evidence, correction, preserved original result, rerun, and status; and
- no personal identity, passive location, movement history, guessed home/work, account attribute, or unrelated travel history.

## Fixed synthetic examples

Unless stated otherwise, the exact synthetic Task 1 window is Active and confirmed, authoritative evaluation is inside the half-open watch interval, the source is accepted and current under its owner, and gates not named as failing or unresolved Pass. Expected copy below describes required meaning, not Task 5 final wording.

| Example and source | Fixed synthetic evidence and scope | Gate result and notification outcome | Expected visible and assistive meaning | Prohibited result |
|---|---|---|---|---|
| `REL-01A`; `REL-01A-SRC-v1` | Saved F trip’s exact origin is omitted while the F operates via the E; accepted supplemented pattern and alert agree on route, direction, time, and omitted stop | All gates Pass → **Send** | Explain that the F bypasses the saved origin and the rider must change entry plan | Say the origin is served; rename the train E; widen to unrelated stops |
| `REL-01B`; `REL-01B-SRC-v1` | Same F-via-E change occurs wholly beyond the saved destination and breaks no required transfer or alternate | Journey/decision gate Fails → **Suppress** | No notification and no all-clear implication | Route-name-only push; whole-line consequence |
| `REL-01C`; `REL-01C-SRC-v1` | Current F-via-E high-impact evidence exists, but station/entity mapping for the saved segment conflicts | Impact resolution Unresolved, no Fail → **Hold for stronger evidence** | Send nothing while exact impact is unresolved | Definitive bypass copy; generic broad push; late-send held record |
| `REL-02`; `REL-02-SRC-v1` | Current accepted pattern explicitly removes the saved origin directional stop | All gates Pass → **Send** | State that the saved origin is bypassed and entry must change | Describe origin as served; clear the separate arrival veto |
| `REL-03`; `REL-03-SRC-v1` | Current delay affects only a segment after the saved destination | Journey/decision gate Fails → **Suppress** | No notification | Line-wide delay push; changed destination scope |
| `REL-04`; `REL-04-SRC-v1` | Current suspension covers the exact used route segment and normalized saved direction | All gates Pass → **Send** | Name exact direction and affected saved segment | Both-directions or whole-line widening |
| `REL-05`; `REL-05-SRC-v1` | Same suspension applies only to the opposite direction | Direction gate Fails → **Suppress** | No notification for this window | Opposite-direction push; direction omitted |
| `REL-06`; `REL-06-SRC-v1` | Current severe alert likely intersects the saved journey, but exact stop/direction consequence remains ambiguous | Required scope Unresolved, no Fail → **Hold for stronger evidence** | Send nothing; preserve only internal unresolved reason | Severity used as scope; definitive bypass/suspension wording |
| `REL-07`; `REL-07-SRC-v1` | Generic **Affected** is the only supported classification and no exact decision change exists | Decision-change gate Fails → **Suppress** | No notification and no normal-service claim | Translate Affected into bypass, closure, or delay |
| `REL-08`; `REL-08-SRC-v1` | Accepted planned reroute overlaps the future window; effective time, route, stops, direction, and consequence resolve | All gates Pass → **Send** | Future-effective explanation of the change and saved-journey action | Claim change is already operating; alter current arrivals early |
| `REL-09`; `REL-09-SRC-v1` | Same planned reroute begins after the exclusive commute-window end | Time/intersection gate Fails → **Suppress** | No notification for this occurrence | Notify because route matches; queue for late delivery |
| `REL-10`; `REL-10-SRC-v1` | Positive prediction still lists the origin, but a current accepted bypass veto removes it from effective service | Notification gates Pass → **Send** | State the resolved bypass; preserve independent truth ownership | Say the origin is served; use prediction to clear veto |
| `REL-11`; `REL-11-SRC-v1` | Fixed Task 3 handoff later proves added journey effect below the configured threshold | Threshold gate Fails → **Suppress** | No notification | Round up; use severity name as threshold proof |
| `REL-12`; `REL-12-SRC-v1` | One coherent inferred delay/gap update exists; required persistence is incomplete | Threshold/persistence gate Unresolved → **Hold for stronger evidence** | Send nothing from one transient update | Immediate delay push; mark persistence Pass |
| `REL-13`; `REL-13-SRC-v1` | Scenario 39 handoff identifies current blocking failure of exact selected path/version, required elevator, time, full journey consequence, and verified or no alternative | All gates Pass → **Send** | Name the broken required path and exact saved-journey consequence; include only a verified alternative | Whole-station claim; unrelated equipment; unverified accessible option |
| `REL-14`; `REL-14-SRC-v1` | Current equipment outage is not on the selected complete path and changes no saved-journey action | Journey/decision gate Fails → **Suppress** | No notification | Whole-station inaccessibility; train-arrival change |
| `REL-15`; `REL-15-SRC-v1` | Exact path is reroutable within station; independently verified same-complex accessible path requires a rider choice | All gates Pass → **Send** | State exact path change and verified same-complex choice | Silent reroute; auto-activation; escalator substitution |
| `REL-16`; `REL-16-SRC-v1` | Underlying current blocking disruption passes; proposed alternative contains one Unknown accessible edge and can be omitted | Underlying gates Pass; omit unresolved alternative → **Send** | State disruption and no verified alternative; do not recommend the candidate as accessible | Suppress underlying truth; call alternative accessible; turn ARO Off |
| `REL-17`; `REL-17-SRC-v1` | Generic data outage exists and there is no approved explicit data-health opt-in contract | Domain/decision gate Fails → **Suppress** | No commute disruption push | Invent opt-in; treat outage as route disruption |
| `REL-18`; `REL-18-SRC-v1` | Branch A: alert or equipment evidence is stale and no current exact adverse result survives under its owner. Branch B: the exact path consequence is currently Unknown, materially relevant, and owner-approved cannot-verify treatment is required. | A: Currentness Fails → **Suppress**. B: Exact impact remains Unresolved with no Fail → **Hold for stronger evidence**. | A: no definitive disruption, outage, recovery, or all-clear claim. B: send nothing definitive and preserve cannot-verify meaning internally. | Refresh wording from stale evidence; No official outage reported; claim outage, accessible path, or restoration |
| `REL-19`; `REL-19-SRC-v1` | Alert wording changes while episode, impact, scope, and action remain materially equivalent | Duplicate gate Fails → **Suppress** | No second notification | Treat copy edit or renewed prose as new impact |
| `REL-20`; `REL-20-SRC-v1` | Two independent overlapping windows receive the same episode and materially equivalent impact/action | Original/surviving candidate: all twelve gates Pass → **Send**. Extra equivalent overlapping-window candidate: Gate 12 Fails → **Suppress**. Task 6 final episode/group selection is **Pending**. | At most one notification candidate; preserve both windows | Two equivalent pushes; merge or rewrite windows; claim final Task 6 episode/group selection |
| `REL-21`; `REL-21-SRC-v1` | Exact constituent used by the saved origin, transfer, or exit is closed; other constituents remain open and unaffected | All gates Pass → **Send** | Name only the used constituent and exact journey action; preserve unaffected constituents | Whole-complex closure; suppress unrelated service |
| `REL-22`; `REL-22-SRC-v1` | Primary route is disrupted and an independently verified subway line change is needed | All gates Pass → **Send** | Explain primary impact and verified line change without rewriting saved route | Auto-activate alternate; hide disruption; unverified transfer |
| `REL-23`; `REL-23-SRC-v1` | An explicitly listed alternate is disrupted but is not currently needed and its loss changes no action | Route/decision gate Fails → **Suppress** | No notification | Notify for route inventory alone; rewrite primary |
| `REL-24`; `REL-24-SRC-v1` | Branch A has no active alert or disruption. Branch B has only crowding, proxy crowding, historical load, or station density. | Each branch has a domain or decision Fail → **Suppress** | Silence without Good service or all-clear; no crowding notification | Routine status push; crowding alert; station-density proxy |

## Pending execution record for every example

Every row below is one independent run record. A later passing rerun preserves the original result and links its correction.

| Example | Actual visible and assistive observation | Five reviewer decisions and dates | Durable evidence and exact record | Unaffected-scope observation | Correction | Rerun | Status |
|---|---|---|---|---|---|---|---|
| `REL-01A` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-01B` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-01C` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-02` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-03` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-04` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-05` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-06` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-07` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-08` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-09` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-10` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-11` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-12` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-13` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-14` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-15` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-16` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-17` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-18` | **Pending — not observed for either branch** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-19` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-20` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-21` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-22` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-23` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `REL-24` | **Pending — not observed** | Product, Accessibility, Data Quality, Content, Operations **Pending**; dates **Pending** | **Pending — none recorded** | **Pending — not observed** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |

## Explicit gaps

- Task 3 threshold and persistence artifacts are Draft; their scenario evidence and reviewer decisions remain Pending.
- Task 4 permission behavior is defined in Draft artifacts; its scenario evidence and reviewer decisions remain Pending.
- Task 5 delivery, message, alternative-copy, and recovery artifacts are Draft; their evidence and reviewer decisions remain Pending.
- Task 6 episode-identity and deduplication artifacts are Draft; their scenario evidence and reviewer decisions remain Pending.
- No data-health opt-in contract exists.
- Scenario 39 handoff completeness does not demonstrate a notification.
- No real source, run, fixed product/build, reviewer decision, correction, rerun, pilot, or release evidence exists.

Every example remains **Not run — Pending**. Definitions do not pass themselves.

## Draft review checklist

- [ ] `REL-01A`–`REL-01C` and `REL-02`–`REL-24` are present.
- [ ] Every definition binds one fixed synthetic source package and exactly one outcome per evaluated branch.
- [ ] Bypassed stops are never described as served.
- [ ] Distant, opposite-direction, generic, stale, duplicate, unused-alternate, no-alert, crowding, and rail inputs do not notify.
- [ ] Planned future wording never changes current arrival truth early.
- [ ] Exact blocking or reroutable accessibility consequences stay path-scoped.
- [ ] Unverified alternatives are omitted without hiding an independently eligible disruption.
- [ ] All actual observations, reviewers, evidence, corrections, reruns, and statuses remain Pending.
- [ ] No record contains personal identity, passive location, movement, account, home/work, or unrelated journey history.

Every unchecked item blocks approval. This documentation commit is not working-product evidence.
