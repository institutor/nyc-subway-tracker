# Subway crowding enablement gate

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§24 and 34; applying approved specification §§24, 27.1, 32.4, 34, and 35; accessibility and platform-guidance plan `Product artifact map` and Task 11 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-fixture) |

## Controlling launch decision

Subway car-level crowding is absent from launch. This artifact is **Draft** and unapproved. It contains no current source capture, real train match, fleet or route coverage, schema validation, consist or orientation evidence, working-product result, reviewer decision, approval, or release authorization. Only Task 12 may make a later crowding go/no-go decision.

As recorded by the approved specification, the July 30, 2026 review found no supported real-time subway car-level occupancy source in MTA Developer Resources or the subway GTFS-Realtime reference then linked from it. This is a dated review result, not a permanent claim; this artifact does not assert that no qualifying source exists now or can exist later.

Repository-held context is limited to:

- MTA Developer Resources checked on 2026-07-30, with no fixed page revision or durable source capture recorded;
- the linked subway GTFS-Realtime reference identifying itself as version 1.1 dated 2012-09-07 and remaining linked when checked on 2026-07-30; and
- the Draft [arrival source evidence register](../arrival-truth/source-evidence-register.md), which neither registers a subway crowding source nor independently proves the dated finding.

The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

The separate Release 1 accessibility decision remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** in the [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md). Task 12 Steps 5–13 remain **Pending**. No crowding result may waive arrival truth, accessibility, platform guidance, or another release gate.

## Purpose, authority, and reconciliation

This artifact owns the launch-wide omission of subway crowding, the proxy ban, required re-audit record, seven-condition future gate, failure behavior, conditional presentation boundary, and evidence Task 12 must inspect. It does not register a source, approve data use, identify a train, establish coverage, define an accessible path, create positioning geometry, demonstrate presentation, or authorize release.

The [positioning rider experience](../guidance/positioning-rider-experience.md) owns the narrow safety and accessibility precedence when crowding might someday be available. Arrival, service, accessibility, platform, and transfer owners retain their independent decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict, shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

The [product artifact index](../artifact-index.md) cites approved specification §§24 and 34 for this artifact. Task 11 also applies provenance §27.1, Release 3 boundary §32.4, source notes §35, and the full Task 11 plan provenance. Product Governance Lead reconciliation of the narrower index citation remains **Pending**. This task does not edit the index or treat the mismatch as approved.

`CRD-T11-POLICY-v1` identifies the expected-policy definition in this artifact and is bound by the commit containing it. It is not a product/build version, an approved artifact version, a source audit, an observed result, or a release decision.

## Launch-wide omission and exact proxy ban

At launch, no subway station board, train detail, map, positioning surface, saved trip, alert, notification, or other subway surface may show:

- a crowding module or module shell;
- car or carriage occupancy;
- a crowding badge or legend;
- an unavailable or coming-soon placeholder;
- a stale or typical car diagram; or
- a row of grey, blank, partial, or **Unknown** cars.

None of the following may be labeled, implied, colored, ordered, spoken, or ranked as live train-car capacity:

- historical occupancy averages;
- headway gaps or bunching;
- station or platform density;
- rider anecdotes or reports;
- engagement or interaction signals;
- static or supplemented schedules;
- general route, line, or service conditions; or
- any blend or inference derived from those inputs.

A proxy may retain its separately approved original meaning on its owning surface, but it never becomes subway car-level crowding.

## Fresh source re-audit

Perform a fresh official-source audit immediately before launch and again on every source, documentation, schema, field-semantics, or version change. “Immediately before launch” has no approved numeric window. The current pre-launch audit result is **Not run — Pending**; this artifact invents no future audit date, source result, reviewer, or evidence.

Each immutable audit record requires:

1. audit ID and fixed candidate version;
2. exact source name and URL;
3. observed source revision, schema, effective date, and New York check time;
4. exact fields and semantics examined;
5. qualifying-source result and reason;
6. named reviewer identities and roles;
7. consequence for every global and train-specific gate;
8. immutable evidence links or captures;
9. correction and rerun links; and
10. link to every superseding or later audit.

Discovery of a candidate source starts review. It never enables a module, label, row, train, route, fleet, or release by itself. A missing, old, undated, mutable, differently scoped, or unreviewed audit keeps the gate closed.

## Seven-condition all-pass future gate

Crowding can be considered for one displayed subway train only when all seven conditions pass together:

| Gate condition | Required pass | Failure |
|---:|---|---|
| 1. Official source | One official, authoritative, current, documented source is approved for this use with immutable provenance and permitted semantics. | Unofficial, inferred, unsupported, stale, mutable-only, or unapproved source closes the gate. |
| 2. Train match | A coherent one-to-one match resolves the exact displayed train instance across the required identity evidence. Trip ID alone is insufficient. | Ambiguous, duplicate, reused, split, merged, or trip-ID-only match closes the gate. |
| 3. Every-car occupancy | The accepted source supplies occupancy for every actual car or carriage in the matched train. | Train-only, aggregated, partial, missing, blank, or **Unknown** car data closes the gate. |
| 4. Actual length and order | Current accepted evidence fixes the actual number of cars and their exact order for that train. | Typical, historical, scheduled, inferred, missing, or conflicting consist evidence closes the gate. |
| 5. Directional orientation | Current accepted evidence maps the exact car order to Front-to-Back for the train's current direction, platform, and service pattern. | Missing, reversed, rerouted, inherited, ambiguous, or stale orientation closes the gate. |
| 6. Freshness | Accepted source age is no more than 90 seconds using authoritative source and decision timestamps at declared precision. | Missing, invalid, future, regressed, stale, precision-ambiguous, or older-than-90-second time closes the gate. |
| 7. Coverage | A predeclared reviewed fleet-and-route coverage rule passes and prevents misleading gaps for the released scope. | Unknown, partial, opportunistic, selectively displayed, or below the later approved coverage rule closes the gate globally and for every train. |

All seven must pass. No condition can compensate for another, and no confidence score, average, manual judgment, or partial module can replace a failure.

### Exact freshness boundary

Record source time, gate-decision time, time precision, and calculated age on one authoritative chronology.

- age `89.000 seconds` passes condition 6 when every other condition passes;
- age exactly `90.000 seconds` passes condition 6 when every other condition passes; and
- at one-millisecond precision, age `90.001 seconds`, the first representable value above 90 seconds, fails.

At another declared precision, its first representable value above 90 seconds fails. Never round an older value down, use phone time, substitute retrieval time for missing source time, repair future or regressed time, or treat a boundary-ambiguous value as passing.

### Mandatory reevaluation

Direction reversal, reroute, consist-length or order change, train-match change, source-version or schema change, or unresolved orientation forces a new complete evaluation. Historical, typical, scheduled, or fleet-default consist information cannot fill length, order, or orientation.

Coverage must name the exact released routes and fleets, immutable numerator and denominator, observation window, source currency, exclusions, and gap rule. No approved numeric coverage threshold exists. That missing threshold is unresolved and blocks every train, including one otherwise perfect train.

## Any failure means full omission

If any global or train-specific condition fails:

1. omit the entire crowding module for that train;
2. show no partial, grey, blank, or **Unknown** cars;
3. show no stale diagram, unavailable shell, proxy fallback, or crowding placeholder;
4. retain the failed condition, exact reason, scope, source times, and evidence internally for review; and
5. restore consideration only after a new complete seven-condition evaluation passes and later Task 12 authorization exists.

One perfectly matched, fresh, complete train remains ineligible while the broader coverage condition fails. Failure is not a rider-facing “Unknown crowding” state; the whole module is absent.

## Conditional future presentation

Only after all seven conditions pass and Task 12 later authorizes the exact scope may the module use:

- **Seats likely** — green;
- **Room to stand** — amber; and
- **Very crowded** — red.

Every car uses text, a meaningful icon, and color together, in verified Front-to-Back order, with equivalent assistive order and meaning. The module includes the source-owned last-update time and a clear conditions-may-change-at-each-stop caveat. Removing color, losing an icon, or using assistive output cannot remove the label, order, freshness, or caveat.

This artifact defines no occupancy thresholds, icon design, hexadecimal colors, contrast values, exact last-update format, aggregation policy, or passenger-count policy. Exact passenger counts remain absent unless source precision and a separate same-version presentation decision are approved. A hypothetical sample, fixture, mock, or complete documentation row is not enablement.

## Accessibility and safety precedence

Crowding never overrides a verified accessible boarding or exit zone, Accessible Route Only, or safe platform advice.

If a less-crowded position conflicts with an accessible or safe instruction:

1. retain the accessible or safe instruction as the visible and assistive primary guidance;
2. do not recommend, rank, or activate the conflicting crowding position;
3. never relax or turn off Accessible Route Only; and
4. keep safety and accessibility first in visual order, focus order, reading order, and assistive wording.

Crowding convenience cannot repair an unverified accessible path, uncertain platform, service conflict, unsafe movement, or unavailable positioning claim.

## Fixed synthetic crowding fixtures

Every fixture below is a synthetic expected-policy definition, not observed evidence. All use:

- `CRD-T11-POLICY-v1`;
- one unique immutable synthetic input package `<fixture-id>-SRC-v1`;
- fixed synthetic `2026-07-30 America/New_York` source, decision, and evaluation times stated below or in the unique package;
- fixed product/build **Pending**; and
- no real source, schema, train, car, consist, route, fleet, orientation, coverage, audit, output, reviewer, approval, or release claim.

| Fixture and fixed source package | Fixed synthetic inputs | Expected visible, assistive, and gate result | Prohibited result |
|---|---|---|---|
| `CRD-01`; `CRD-01-SRC-v1` | Launch scope; no qualifying source and no current pre-launch audit result. | No crowding content on any subway surface, visibly or assistively; gate closed. | Module, shell, placeholder, badge, legend, or row of Unknown cars. |
| `CRD-02`; `CRD-02-SRC-v1` | Historical averages, headway gaps, station density, rider reports, engagement signals, schedules, and line conditions are available; no car-level source exists. | Preserve only separately approved original meanings; no live crowding claim and no module. | Proxy label, inferred capacity, blended crowding state, or colored car diagram. |
| `CRD-03`; `CRD-03-SRC-v1` | Branch A has no fresh launch audit. Branch B treats the dated 2026 review as a permanent current finding. | Gate closed in both branches; record pre-launch audit **Not run — Pending** and require a fresh immutable audit. | Launch from missing audit or permanent no-source claim. |
| `CRD-04`; `CRD-04-SRC-v1` | Official current source matches the train but supplies only one train-wide occupancy value. | Entire module absent visibly and assistively. | Copy train value into every car or show train-only crowding as car-level capacity. |
| `CRD-05`; `CRD-05-SRC-v1` | Candidate source shares a trip ID with two plausible displayed train instances and supplies no resolving identity evidence. | Train match fails; entire module absent. | Choose one train, average, show Uncertain cars, or treat trip ID alone as coherent. |
| `CRD-06`; `CRD-06-SRC-v1` | Actual eight-car train has seven accepted car values and one missing or Unknown carriage. | Entire eight-car module absent visibly and assistively. | Seven colored cars plus one grey/Unknown car, partial module, or train average. |
| `CRD-07`; `CRD-07-SRC-v1` | Per-car values exist, but actual train length, order, or current Front-to-Back orientation is unresolved. | Entire module absent for each failed branch. | Typical consist, historical order, guessed orientation, or unordered car values. |
| `CRD-08`; `CRD-08-SRC-v1` | All other gates pass at one-millisecond precision. Branch A source `10:00:00.000`, decision `10:01:29.000`, age 89.000s. Branch B decision `10:01:30.000`, age 90.000s. Branch C decision `10:01:30.001`, age 90.001s. | A and B pass freshness only; C fails and has no module. None displays without later Task 12 authorization. | Strict-less-than failure at 90.000s, rounding C down, or treating freshness alone as enablement. |
| `CRD-09`; `CRD-09-SRC-v1` | All gates and later authorization hypothetically pass at age 89.999s; without a newer source value, age advances to 90.001s at one-millisecond precision. | Whole visible and assistive module disappears at 90.001s; retain internal failed reason only. | Stale diagram, frozen labels, Unknown fallback, shell, or continued decrementing freshness. |
| `CRD-10`; `CRD-10-SRC-v1` | One train passes source, match, every-car, consist, orientation, and freshness conditions; global fleet/route coverage lacks fixed denominator, window, and gap rule. | Coverage condition fails; module omitted for that train and release scope. | Opportunistic display for the perfect train or an invented threshold. |
| `CRD-11`; `CRD-11-SRC-v1` | All seven gates pass for one exact hypothetically authorized Task 12 scope; categorical source semantics and presentation decisions are fixed. | Show only **Seats likely** green, **Room to stand** amber, or **Very crowded** red per car, with text, meaningful icon, color, Front-to-Back order, equivalent assistive meaning, last update, and conditions-may-change-at-each-stop caveat. | Unapproved label, color-only state, missing order/freshness/caveat, or implication of permanence. |
| `CRD-12`; `CRD-12-SRC-v1` | Branch A removes color. Branch B consumes the same authorized state through assistive output. | Exact text meaning, meaningful non-color icon, Front-to-Back order, last update, and caveat remain equivalent in both branches. | Meaning lost without color, reordered cars, hidden freshness, or absent caveat. |
| `CRD-13`; `CRD-13-SRC-v1` | Fully gated categorical source supports the three approved labels but provides no approved exact passenger-count precision. | Conditional module may use categorical labels after Task 12 authorization; exact counts are absent visibly and assistively. | Invented passenger count, range, percentage, or threshold. |
| `CRD-14`; `CRD-14-SRC-v1` | A hypothetically eligible less-crowded Back conflicts with verified accessible Middle and safe-platform Middle; Accessible Route Only is On. | Middle accessible/safe instruction remains primary visibly and assistively; do not recommend Back; ARO stays On. | Crowding overrides, competing primary, ARO relaxation, or safety ordered second. |
| `CRD-15`; `CRD-15-SRC-v1` | Direction reverses while prior per-car values remain fresh, but Front-to-Back orientation has not been independently reverified. | Entire module absent until a complete new evaluation passes. | Mechanical reversal, reuse of prior order, or stale orientation with fresh occupancy. |
| `CRD-16`; `CRD-16-SRC-v1` | Source or schema revision changes a field, semantic, identity rule, or version used by the prior passing evaluation. | Gate closes; module absent pending a new dated audit, source approval, seven-condition evaluation, evidence, and later decision. | Grandfather prior audit, retain module, or treat discovery as enablement. |

## Pending execution record for every fixture

| Fixture | Actual visible and assistive observations | Reviewer decisions | Durable evidence and attachments | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `CRD-01` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-02` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-03` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-04` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-05` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-06` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-07` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-08` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-09` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-10` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-11` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-12` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-13` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-14` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-15` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `CRD-16` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |

## Explicit blockers and unresolved definitions

- No durable July 30, 2026 source capture exists.
- The source evidence register is Draft and scoped to arrival truth; it does not register or prove crowding.
- “Immediately before launch” has no approved numeric window.
- “Official,” “authoritative,” “reliable,” and “sufficient” lack complete measurable definitions for this gate.
- No approved coverage denominator, numerator, observation window, gap rule, or threshold exists.
- No real schema, train match, consist inventory, car order, directional orientation evidence, or representative sample exists.
- No label thresholds, icon design, contrast decision, last-update format, aggregation rule, or exact-count policy exists.
- The approved specification contains no canonical §31 crowding acceptance scenario.
- Adding a crowding source to the source evidence register requires an approved specification and governance change; this artifact cannot do it.
- Gate 0 and accessibility no-go decisions remain in force and cannot be waived by crowding evidence.

## Correction, review, and release boundary

Every future execution must bind one immutable product/build, this artifact, the exact audit and candidate source, authoritative timestamps and precision, train identity, every car value, actual consist and order, directional orientation, released coverage population, all seven decisions, exact visible and assistive output or omission, prohibited-result checks, all five same-version reviewer decisions, durable evidence, correction, preserved original result, rerun, and later Task 12 disposition.

All current audit results, fixture observations, reviewer decisions, evidence attachments, corrections, reruns, approvals, and release decisions remain **Pending** or **Not run — Pending**. These definitions demonstrate no source, train, coverage, product behavior, review passage, or authorization.

## Draft review checklist

- [ ] Subway crowding is fully absent from every launch surface.
- [ ] No historical, operational, rider, engagement, schedule, station, or route proxy becomes live car capacity.
- [ ] A fresh immutable audit occurs immediately before launch and after every source-version change.
- [ ] All seven conditions pass together, including every car, actual consist, current orientation, inclusive 90-second freshness, and approved coverage.
- [ ] Any failed condition removes the whole module without placeholder or stale fallback.
- [ ] Conditional presentation uses exact labels, meaningful icons, color, equivalent assistive meaning, Front-to-Back order, last update, and caveat.
- [ ] No unsupported threshold, icon, color value, count, audit date, coverage target, or evidence is invented.
- [ ] Accessibility, Accessible Route Only, and safety always outrank crowding convenience.
- [ ] All 16 fixtures and every observation, reviewer, evidence, correction, rerun, and status remain Pending.
- [ ] Task 12 alone owns any later crowding go/no-go.
- [ ] The current no-go and blocked public-board decisions remain explicit.

Every unchecked required item blocks crowding enablement and release consideration. This documentation commit is not working-product evidence.

## Task 12 final crowding checkpoint

This is a separately signable, append-only readout. It preserves the first 239 lines at accepted blob `6dbfa4d4512c8aae849d9a39690d44dd0816ca37`, including the dated-source finding, proxy ban, seven-condition gate, full-omission behavior, accessibility precedence, `CRD-01`–`CRD-16` definitions, and every Pending result.

| Checkpoint field | Current value |
|---|---|
| Checkpoint ID | `CRD-T12-FINAL-v1`; decision-record identifier only |
| Evaluated base | Commit `841b4df8d0b6346cbbde428fbd83d77b2f68b417` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Evaluation date | 2026-07-30 |
| Artifact approval | **Pending** |
| Actual decision identity | **Pending** |
| Current decision | **NO-GO — SUBWAY CAR-LEVEL CROWDING REMAINS DISABLED** |
| Release authorization | **Unsigned** |
| Central checkpoint | [Task 12 Steps 5–13 final checkpoint](../quality/accessibility-and-guidance-release-gates.md#task-12-steps-513-final-checkpoint) |

This decision is independent from Arrival Truth, Nearby/offline, Release 1 accessibility, positioning/transfer, platform coverage, and pre-commute accessibility notifications. Crowding evidence cannot waive another feature's blocker, and another feature cannot enable crowding. Only GO or NO-GO is available; there is no Conditional GO.

### Current omission and evidence census

Subway crowding remains completely absent on every launch surface. Show no module, shell, car row, badge, legend, placeholder, coming-soon treatment, stale or typical diagram, proxy estimate, partial train, grey/blank car, or rider-facing **Unknown** car. Historical occupancy, headways, bunching, station density, rider reports, engagement, schedules, and line conditions retain only separately approved original meanings and never become live car-level capacity.

| Required evidence | Current value | Decision effect |
|---|---|---|
| Fresh immutable pre-launch official-source audit | **Not run — Pending** | Blocks every train and the global feature |
| Approved qualifying source and immutable capture | **None** | Blocks |
| Approved source schema and semantics | **None** | Blocks |
| Coherent one-to-one real train matches | **0** | Blocks |
| Real every-car occupancy records | **0** | Blocks |
| Real consist length/order records | **0** | Blocks |
| Real current directional-orientation records | **0** | Blocks |
| Approved route/fleet coverage rule and denominator | **None** | Blocks globally |
| Observed visible or assistive product outputs | **0** | Blocks |
| Named same-package reviewer decisions/signatures | **0** | Blocks |
| `CRD-01`–`CRD-16` definitions | **16** | Definitions only |
| `CRD-01`–`CRD-16` execution results | **16 Not run — Pending** | No fixture supplies evidence |
| Corrections and reruns | **None** | No later evidence exists |

The July 30, 2026 documentation review remains a dated finding, not a current or permanent no-source claim. The required fresh audit has not occurred, and no source, audit capture, coverage population, schema, train, car, consist, orientation, output, reviewer, approval, or authorization is inferred.

### Seven simultaneous future conditions

A fresh immutable pre-launch audit is necessary but never sufficient. Each exact displayed train and the global release scope must pass all seven conditions together on one immutable package:

| Condition | Current evidence |
|---|---|
| 1. Approved official, authoritative, current source with permitted car-level semantics and immutable provenance | **Pending / none** |
| 2. Coherent one-to-one match to the exact displayed train; trip ID alone is insufficient | **Pending / none** |
| 3. Accepted occupancy for every actual car; no aggregate, partial, blank, or Unknown car | **Pending / none** |
| 4. Current actual consist length and exact car order | **Pending / none** |
| 5. Current directional Front-to-Back orientation for the exact direction, platform, and service pattern | **Pending / none** |
| 6. Authoritative source age no more than 90 seconds at declared precision | **Pending / none** |
| 7. Predeclared, reviewed route-and-fleet coverage rule with immutable population, numerator, denominator, window, currency, exclusions, and gap treatment | **Pending / none** |

One failure or missing field omits the whole module. A passing train cannot compensate for missing global coverage. A source discovery cannot compensate for absent train identity, every-car data, consist, orientation, freshness, or coverage. No average, confidence score, typical consist, historical order, manual judgment, or partial display can compensate for another condition.

Freshness remains inclusive at exactly 90.000 seconds and fails at the first representable value above 90 seconds at the declared precision; at one-millisecond precision, 90.001 seconds fails. Phone time, retrieval time, rounding, future/regressed repair, or a precision-ambiguous boundary cannot strengthen the result.

Direction reversal, reroute, consist/order change, train-match change, source/schema change, or unresolved orientation forces a fresh complete audit/evaluation. Until every condition and later authorization passes again, omit the entire visible and assistive module.

### Conditional presentation remains unavailable

The future labels **Seats likely**, **Room to stand**, and **Very crowded** remain conditional definitions only. No occupancy thresholds, icon design, color values, contrast decision, last-update format, aggregation policy, exact-count policy, or approved source semantics exists. None may appear now.

If a future package passes, text, meaningful icon, color, verified Front-to-Back order, equivalent assistive order/meaning, source-owned last update, and the conditions-may-change caveat must remain together. Exact passenger counts remain absent without separately approved source precision and presentation policy.

Accessibility and safety always outrank crowding convenience. A future less-crowded zone can never override a verified accessible boarding/exit zone, Accessible Route Only, safe-platform guidance, a hard conflict, an unavailable positioning claim, or an unverified path.

### Artifact review and append-only reevaluation

| Required reviewer | Actual identity | Artifact decision | Decision date | Durable signature/evidence | Findings/correction/rerun |
|---|---|---|---|---|---|
| Product | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Accessibility | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Data Quality | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Content | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Operations | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |

Artifact approval and release authorization remain separate. Assignment, authorship, task review, attendance, silence, an audit, a source discovery, or a synthetic fixture is not approval or authorization.

GO requires a fresh immutable audit, all seven simultaneous conditions, every `CRD` and real-scope check, complete visible/assistive evidence, no open safety or accessibility conflict, and five explicit same-package approvals. Any Pending, missing evidence, **Run — Fail**, **Run — Inconclusive**, **Changes required**, version mismatch, missing signature, or safety finding requires NO-GO.

No correction or rerun is recorded. A future correction appends the exact original/corrected source, audit, schema, train, consist, orientation, coverage, output, reviewer package, affected scope, owner, reason, and new attempts. Preserve this decision and every original Pending or adverse result; a later GO never erases them.
