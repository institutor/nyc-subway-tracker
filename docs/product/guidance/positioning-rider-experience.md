# Front, Middle, and Back positioning rider experience

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§23.1, 23.5, and 31.6; applying approved specification §§23.1, 23.3, 23.5, 29.4, and §31.6 scenarios 33–35; accessibility and platform-guidance plan `Product artifact map` and Task 8 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#synthetic-positioning-fixtures) |

## Purpose and authority

This artifact owns the rider objectives, Front/Middle/Back precision, benefit wording, visible and assistive presentation, accessible-priority behavior, and Task 8 recalculation or omission consequences for platform positioning. It consumes upstream truth and evidence decisions without changing them.

The [platform guidance evidence standard](platform-evidence-standard.md) remains the sole owner of the atomic station, constituent, route, direction, service-pattern, platform, orientation, zone, objective, geometry, source, field-check, verification-date, and reviewer record. The [platform state and positioning certainty matrix](platform-state-and-certainty-matrix.md) remains the sole owner of **Platform confirmed**, **Expected platform**, **Check station signs**, **Verified**, **Expected**, **Unavailable**, hard actual-versus-scheduled-track conflict suppression, recovery, arrival readmission, platform requalification, and guidance reevaluation. This artifact does not duplicate, weaken, or repair either Task 7 decision.

Arrival admission remains with the [arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md), reroutes and track conflicts remain with the [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md), and suppression and recovery remain with the [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md). The [complete accessible-path contract](../accessibility/complete-path-contract.md), [station-direction accessibility coverage register](../accessibility/station-direction-coverage-register.md), and [Accessible Route Only state matrix](../accessibility/accessible-route-only-state-matrix.md) retain accessibility authority. The [station board and controls contract](../nearby-offline/station-board-and-controls-contract.md) owns surface placement without strengthening supplied truth.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It establishes expected policy definitions only. It demonstrates no real geometry, route-direction coverage, station, constituent, platform, field check, verification, actual-track observation, train-specific consist fact, rendered visible or assistive result, reviewer decision, approval, release evidence, or positioning coverage. Every synthetic fixture, actual result, reviewer decision, evidence attachment, correction, rerun, and disposition below remains **Pending** or **Not run — Pending**.

The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

The separate Release 1 accessibility decision remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** in the [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md). The [Nearby/offline Release 1 readiness record](../nearby-offline/release-1-readiness.md) retains its separate no-go. This Draft does not pass, merge, override, or waive any of those decisions, and it makes no Release 2 decision.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites approved specification §§23.1, 23.5, and 31.6 and lists Product, Accessibility, Data Quality, and Content review for this artifact. Task 8 additionally applies guidance certainty §23.3, positioning target §29.4, the exact scenario range §31.6 scenarios 33–35, the plan's full Task 8 provenance, the controlling Task 7 boundaries, and Operations review required by the Task 8 brief. Product Governance Lead reconciliation of the narrower index provenance and reviewer set with this broader applying provenance and five-role review is **Pending**. This task does not edit the index or treat the mismatch as approved.

## Controlling input and decision order

For one admitted arrival and one rider objective:

1. Consume the upstream arrival disposition. A suppressed arrival never reaches positioning presentation.
2. Consume Task 7's hard-conflict result before assigning or rendering a platform state, positioning certainty, transfer instruction, or accessibility instruction.
3. Consume Task 7's exact platform state and independent positioning certainty without reclassification.
4. Require the same atomic record scope for station, constituent, route, service-pattern variation, normalized direction and destination, exact platform, orientation, stopping relationship, zone, and objective.
5. Apply the complete accessible-path and Accessible Route Only decisions independently.
6. Select only one permitted rider objective and apply the accessibility-priority rule.
7. Render only the precision, benefit, certainty, accessibility priority, and omission supported by the preceding decisions.
8. Preserve visible and assistive meaning, prohibited-result checks, actual result, reviewer decisions, evidence, correction, and rerun separately.

A later step cannot rehabilitate a failed earlier step. Benefit copy cannot create geometry, an objective relationship, platform confirmation, a complete accessible path, current equipment availability, or an arrival row.

## Permitted rider objectives

Task 8 permits exactly three positioning objectives:

1. **Fastest destination exit**
2. **Fastest transfer**
3. **Verified accessible boarding and exit path**

Accessible Route Only is a persistent hard constraint, not a fourth objective and not a preference weighted against the other objectives. When it is On, the verified accessible objective controls the primary recommendation and overrides a shorter stair-based exit, a faster transfer, crowding convenience, or another optimization.

In ordinary mode, the rider's selected fastest-exit or fastest-transfer objective may remain primary when it passes every applicable gate. A valid differing accessible recommendation may appear only as clearly secondary information. In Accessible Route Only, that same valid accessible recommendation becomes primary and no competing stair-based recommendation may override it. If the accessible objective is unsupported, the product omits the positioning claim and preserves Accessible Route Only; it never selects an ordinary zone by silently relaxing the constraint.

## Default precision and train-specific car gate

**Front**, **Middle**, and **Back** mean thirds of the exact supported platform and are the default and maximum precision unless the separate train-specific gate below passes.

- Do not convert an unverified or Expected zone into a car number.
- Do not infer a car number from Task 7's generic platform record, a route's typical train, a platform sign, a consist family, a station diagram, a rider anecdote, or a prior train.
- A car number may appear only for one particular train when train length, car order, stopping position, front/rear orientation, and the zone-to-car relationship are all current and verified for that same train.
- The train-specific package must remain coherent with the admitted train instance, exact direction, exact platform, service pattern, stopping relationship, and current supported zone.
- If any train-specific requirement fails, fall back only to a supported Front/Middle/Back zone at Task 7's permitted certainty.
- If the zone itself is unsupported or **Unavailable**, show and announce no positioning claim.

Passing Task 7's atomic platform evidence standard does not pre-approve a car number. No synthetic fixture below claims that the train-specific gate has passed.

## Benefit and certainty presentation

Every visible positioning recommendation explains the supported rider benefit. The same zone, objective, certainty, accessibility priority, and omission must be conveyed to assistive technology.

| Task 7 positioning certainty | Required Task 8 treatment | Permitted pattern | Prohibited treatment |
|---|---|---|---|
| **Verified** | Use the exact supported Front/Middle/Back zone and direct benefit wording for the same atomic objective record. | **Front—shortest walk to the Lexington Ave exit**; **Front best for transfer to the L** | “Usually,” numeric confidence, car number without the separate train-specific gate, another objective, another platform, or stronger accessibility meaning |
| **Expected** | Use the exact supported zone with an explicit qualification in both visible and assistive output. | **Middle usually best for 14 St exit** | Verified-sounding “best” without qualification, **Platform confirmed** implication, numeric confidence, or a car number |
| **Unavailable** | Show and announce no Front/Middle/Back recommendation or vague substitute. Preserve only independently valid arrival and platform context. | No positioning claim | Guessed zone, “try the front,” icon-only hint, inherited prior guidance, car number, or spoken recommendation |

An accessible pattern such as **Middle—nearest elevator** is permitted only when the exact current complete street-to-street accessible path, exact boarding or exit area, current route and equipment decisions, and atomic zone relationship all support it. The phrase does not itself establish that the path is accessible now.

No numeric confidence score appears visibly, assistively, in an icon label, or as a substitute for **Verified**, **Expected**, or **Unavailable**. Color, icon, layout, map position, or motion cannot imply a stronger certainty or priority than the text and assistive output.

## Accessibility priority and ordinary-mode relationship

| Rider state and evidence | Primary positioning result | Secondary information | Prohibited result |
|---|---|---|---|
| Accessible Route Only On; exact verified complete accessible boarding/exit path and zone relationship pass | Present the supported accessible zone and benefit as primary. | Only non-competing information that does not weaken or obscure the accessible instruction. | A shorter stair-based zone, faster transfer, crowding preference, travel-time convenience, or ordinary objective overrides the accessible zone. |
| Accessible Route Only On; accessible path passes structurally or operationally but its zone relationship is unsupported | No positioning claim. Preserve the route constraint and independently valid accessibility state. | None that implies a zone. | Infer Front/Middle/Back from structural accessibility, choose a convenience zone, or turn the setting Off. |
| Accessible Route Only On; positioning is **Unavailable** | No positioning claim; continue the hard-constraint route decision. | Independently valid arrival, platform, path, or no-route context only. | Treat positioning omission as permission to relax accessibility. |
| Ordinary mode; selected fastest-exit or fastest-transfer objective passes; a differing accessible zone also independently passes | The selected ordinary objective may be primary. | The accessible zone may be clearly secondary, with its supported benefit and certainty. | Merge two zones, hide which objective each serves, or imply the secondary instruction is current accessibility evidence by itself. |
| Any mode; an unverified replacement platform or rerouted orientation lacks its own evidence | No inherited zone or accessible-positioning claim. | Task 7's independently permitted non-conflicting platform context only. | Borrow ordinary-platform zone, elevator, boarding-area, exit, transfer, or complete-path evidence. |

Crowding is not one of the three permitted positioning objectives. Whether absent at launch or considered in later governed work, it cannot override an accessible boarding area or safe platform advice.

## Direction reversal and exact recalculation

Front and Back are relative to verified train travel, not permanent physical platform-end names.

1. Recalculate from the exact supported opposite-direction orientation, platform, service pattern, stopping relationship, zone geometry, and objective record.
2. Front and Back exchange meaning only when that complete current opposite-direction record passes.
3. Middle remains Middle only when the opposite-direction evidence still supports its geometry, stopping relationship, and objective.
4. Never reuse the prior-direction recommendation merely by swapping the words “Front” and “Back.”
5. If the opposite-direction or replacement record is missing, stale-under-owner-rule, uncertain, conflicting, wrong-scope, inherited, or unreviewed, positioning is **Unavailable** and no claim appears.

Reversing the board direction without independently revalidating positioning is prohibited. Visible and assistive output must change or omit together.

## Reroute, conflict, recovery, stale, and offline behavior

| Condition | Arrival and platform consequence consumed from Task 7 | Task 8 positioning consequence |
|---|---|---|
| Reroute changes platform orientation, service-pattern variation, stopping relationship, exit relationship, transfer path, or accessible path and replacement evidence is incomplete | Preserve only the arrival/platform result independently allowed by Task 7. | Remove every affected zone and benefit claim; do not inherit the ordinary-platform recommendation. |
| Resolved reroute; arrival admitted; replacement platform unconfirmed; no active conflicting actual-track record | Task 7 may use its non-conflicting **Check station signs** state. | Positioning is **Unavailable**; show and announce no zone. |
| Invalidating unresolved nonterminal actual-versus-scheduled-track conflict | The affected arrival row is hard-suppressed and has no platform state. | Suppress every dependent positioning, accessibility, and transfer instruction. Preserve unrelated service that independently passes. |
| Conflict recovery update 1 | The affected row and every dependent claim remain absent. | Restore nothing. |
| Recovery update 2 proves all five upstream conditions and every ordinary arrival gate passes | The arrival may be readmitted; platform state is independently reevaluated. | Never restore the old recommendation. Re-earn platform evidence and reevaluate the current atomic guidance record independently. |
| Platform or operational evidence becomes stale or Offline | It cannot support **Platform confirmed**. A complete trusted static record may support only Task 7's permitted **Expected** state where every owner rule allows it. | Use only clearly Expected positioning when the exact record remains eligible; otherwise omit. Release 1 offline cards remain complete when positioning is omitted. |

During the hard conflict, keep the exact station context outside a fabricated train row:

**Track change—check station signs**

Keep the exact upstream suppression explanation with the affected board's suppression state:

**Service change—this train's downstream stops are not verified.**

The station-context words “check station signs” do not create a **Check station signs** row for the suppressed train. Arrival recovery, platform confirmation, positioning, accessible guidance, and transfer guidance are independently re-earned.

## Visible and assistive equivalence

For every supported recommendation or omission:

- visible and assistive output identify the same zone;
- both identify the same fastest-exit, fastest-transfer, or verified-accessible objective;
- both convey **Verified** direct wording or **Expected** qualification without inventing a numeric score;
- both convey whether accessibility is primary under Accessible Route Only or secondary in ordinary mode;
- both omit the positioning claim when certainty is **Unavailable**;
- both preserve the scope of conflict, reroute, stale, Offline, and unrelated-service consequences; and
- neither relies on color, icon, layout, map position, animation, or focus order to supply missing meaning.

A visually absent claim with a stale spoken recommendation, or a visually present recommendation absent from assistive output, fails Task 8.

## Synthetic positioning fixtures

`POS-T8-POLICY-v1` is an expected-policy definition identifier only. The commit containing this artifact binds its text after commit; it is not a product/build version, approval, actual-track observation, geometry package, rendered result, or release decision. Every `POS-xx-SRC-v1` package below is fixed synthetic input with relative timestamps and no real station, route, train, field visit, source capture, or coverage claim.

All actual results, reviewer decisions, evidence and attachments, corrections, reruns, and statuses remain **Pending** or **Not run — Pending**.

### POS-33: direction reversal

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `POS-33-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; `POS-T8-POLICY-v1` bound by the commit containing this artifact; fixed product/build **Pending** |
| Synthetic immutable inputs and authoritative relative times | Branch A: at `T0`, admitted synthetic direction `D-A` uses exact platform `P-A`; a current field-checked atomic record maps physical zone `Z-1` to Front for fastest synthetic exit `X`; at `T1−30s` and `T1`, two qualifying updates plus a complete current opposite-direction record admit direction `D-B`, map the same physical zone `Z-1` to Back, and independently support Middle; evaluate at `T1+5s`. Branch B: repeat the reversal at `T2`, but opposite-direction or replacement-platform Front-to-Back orientation, stopping relationship, or objective evidence is missing or uncertain; evaluate at `T2+5s`. |
| Expected visible result or omission | Branch A shows the supported reversed zone and benefit: **Back—shortest walk to Exit X**; Front and Back have exchanged meaning and Middle remains only because the reversed record supports it. Branch B may show independently valid arrival/platform context but shows no Front/Middle/Back claim. |
| Expected assistive result or omission | Branch A announces Back, fastest-exit objective, Verified certainty, and the same benefit. Branch B announces no positioning recommendation and does not retain the prior-direction zone. |
| Prohibited behavior | Mechanical word swap without the complete opposite-direction record; reuse of former Front/Back; unsupported Middle; Expected as a guess; car number; numeric confidence; visible/assistive disagreement |
| Actual result | **Pending — not observed** |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence and attachments | **Pending — none recorded** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Status | **Not run — Pending** |

### POS-34: invalidating track conflict

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `POS-34-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; `POS-T8-POLICY-v1` bound by the commit containing this artifact; fixed product/build **Pending** |
| Synthetic immutable inputs and authoritative relative times | At `T0−30s`, affected synthetic train `TR-A` and unrelated train `TR-U` are independently coherent. At `T0`, `TR-A` develops an explicit invalidating unresolved nonterminal actual-versus-scheduled-track conflict for the downstream target; `TR-U` remains coherent and unaffected. Evaluate at `T0+1s`. |
| Expected visible result or omission | Remove `TR-A`'s row and every dependent platform, positioning, accessibility, and transfer instruction. Show station context exactly **Track change—check station signs** and the affected board suppression explanation exactly **Service change—this train's downstream stops are not verified.** Preserve `TR-U` and only its independently supported guidance. Create no **Check station signs** row for `TR-A`. |
| Expected assistive result or omission | Announce the same station-scoped context and suppression explanation without a tappable or spoken affected-train row or dependent guidance. Preserve unrelated service without applying the conflict to it. |
| Prohibited behavior | Lower-confidence affected row; **Check station signs** row; Scheduled substitute; stale platform, zone, accessible, or transfer claim; suppression of unrelated service; treating normal terminal variation as the conflict |
| Actual result | **Pending — not observed** |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence and attachments | **Pending — none recorded** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Status | **Not run — Pending** |

### POS-35: accessible zone outranks quickest stairs

| Fixture field | Fixed definition |
|---|---|
| Fixed source and policy versions | Synthetic `POS-35-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; `POS-T8-POLICY-v1` bound by the commit containing this artifact; fixed product/build **Pending** |
| Synthetic immutable inputs and authoritative relative times | At `T0−30s` and `T0`, one admitted synthetic train has qualifying exact platform observations and complete current atomic records for two objectives. The quickest-stairs objective maps to Front. A separately verified complete street-to-street accessible chain, current route-critical equipment decisions, exact boarding/exit area, and zone relationship map the verified accessible objective to Middle. Accessible Route Only is On at evaluation `T0+5s`; a synthetic convenience/crowding preference favors Front. |
| Expected visible result or omission | Show **Middle—nearest elevator** as the primary recommendation and explain that it serves the verified accessible boarding and exit path. Do not show Front as a competing primary or overriding recommendation. |
| Expected assistive result or omission | Announce Middle, the verified accessible objective, Verified certainty, Accessible Route Only priority, and the same nearest-elevator benefit. Do not announce the quickest-stairs or crowding/convenience zone as preferred. |
| Prohibited behavior | Front or another convenience zone overrides Middle; structural accessibility alone creates a zone; crowding changes the result; Accessible Route Only turns Off; two unlabeled competing zones; car number; numeric confidence |
| Actual result | **Pending — not observed** |
| Reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Durable evidence and attachments | **Pending — none recorded** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Status | **Not run — Pending** |

## Correction, review, and Release 2 boundary

Every future execution must bind one immutable product/build, this artifact, the accepted Task 7 artifacts, every applicable arrival and accessibility dependency, the synthetic source package, authoritative relative or captured timestamps, exact visible and assistive outputs or omissions, prohibited-result checks, five same-version reviewer decisions, durable attachments, correction, and rerun. A later passing rerun preserves the original result.

These three definitions are not executed evidence. They do not establish real positioning coverage, pass Gate 0, alter or pass the Release 1 accessibility or Nearby/offline checkpoints, approve this artifact, or authorize Release 2. Only Task 12's later separate Release 2 decision may evaluate fixed Task 8 evidence.

## Draft review checklist

- [ ] Exactly the three permitted rider objectives are available.
- [ ] Accessible Route Only makes the verified accessible objective primary and never silently relaxes.
- [ ] Front, Middle, and Back remain the default precision.
- [ ] Every train-specific car-number requirement passes for the same train before any car number appears.
- [ ] Verified and Expected benefit wording remains visibly and assistively distinct; Unavailable produces no positioning claim.
- [ ] Every visible recommendation explains the exact supported rider benefit.
- [ ] Visible and assistive output convey the same zone, objective, certainty, accessibility priority, and omission.
- [ ] Front and Back reverse only after complete current opposite-direction evidence; Middle remains only when supported.
- [ ] Reroutes inherit no ordinary-platform geometry or accessible-zone evidence.
- [ ] The hard Task 7 conflict suppresses the affected row and every dependent claim while preserving both exact messages and unrelated service.
- [ ] Arrival recovery never restores the old recommendation; platform and guidance are independently re-earned.
- [ ] Stale and Offline evidence never supports **Platform confirmed**; Release 1 offline cards remain complete when positioning is omitted.
- [ ] All three synthetic fixtures remain **Not run — Pending**, with every actual result, reviewer decision, evidence item, correction, and rerun Pending.
- [ ] All real geometry, route-direction coverage, stations, observations, results, approvals, and release evidence remain unclaimed.

Every unchecked required item blocks review completion and Release 2 consideration. This documentation commit is not working-product evidence.
