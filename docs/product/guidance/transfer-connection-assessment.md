# Transfer connection assessment

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§23.6, 31.6, and 31.8; applying approved specification §23.6, §31.8 scenario 47, and §§32.2–32.3 while retaining the Task 8 boundary in §31.6 scenarios 33–35; accessibility and platform-guidance plan `Product artifact map` and Task 9 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-fixture) |

## Purpose and authority

This artifact owns the current **Likely**, **Tight**, **Uncertain**, and **Unlikely** assessment for one specific incoming train, one specific outgoing train, and one exact transfer path. It owns the interval comparison, buffer application, state precedence, rider consequence, next-option reevaluation, and current-versus-historical transfer-likelihood boundary. It does not admit either arrival, confirm a platform, create platform or passage geometry, verify a walking range, approve an accessible path, select a rider's positioning objective, establish station coverage, or authorize Release 2.

The [arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md) owns train admission and arrival disposition. The [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md) and [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md) own service and track vetoes, suppression, and readmission. The [platform evidence standard](platform-evidence-standard.md) owns the exact platform, passage, zone, and geometry record; the [platform state and positioning certainty matrix](platform-state-and-certainty-matrix.md) owns **Platform confirmed**, **Expected platform**, **Check station signs**, **Verified**, **Expected**, **Unavailable**, and hard-conflict behavior. The [positioning rider experience](positioning-rider-experience.md) owns Front/Middle/Back benefit presentation.

The [complete accessible-path contract](../accessibility/complete-path-contract.md) and [Accessible Route Only state matrix](../accessibility/accessible-route-only-state-matrix.md) own complete-path validity, persistence, rejection, and accessible-alternative ordering. The [offline content and validity contract](../nearby-offline/offline-content-and-validity-contract.md) and [offline, degraded, and reconnection states](../nearby-offline/offline-degraded-and-reconnection-states.md) own stored reference validity, the global Offline presentation, historical treatment, and ordered reconnection.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It defines expected product policy only. It demonstrates no real train, arrival, departure, station, platform, passage, geometry, walking range, accessible chain, equipment state, source capture, product/build behavior, visible or assistive rendering, reviewer decision, approval, coverage, release evidence, or authorization. Every actual result, reviewer decision, evidence attachment, correction, rerun, and disposition below remains **Pending** or **Not run — Pending**.

The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

The separate Release 1 accessibility decision remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** in the [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md). Task 12 Steps 5–13 remain **Pending**. This Draft does not pass, merge, override, or waive any current decision and makes no Release 2 decision.

## Product Governance reconciliation

The Task 9 plan cites specification §31.6, but the transfer-threshold boundary case is scenario 47 in §31.8. Section 31.6 scenarios 33–35 remain Task 8 positioning inputs; Task 9 does not own alarm scenarios 36–39. The [product artifact index](../artifact-index.md) cites §§23.6, 31.6, and 31.8 for this artifact but omits applying release boundaries §§32.2–32.3. Product Governance Lead reconciliation of those mismatches with the applying provenance above is **Pending**. This task does not edit the index or treat the mismatch as approved.

## Accepted upstream documentation bindings

These bindings capture accepted documentation inputs before Task 9 implementation. They establish provenance only; they are not product, source, review, or release evidence.

| Accepted task | Commit | Bound artifact and blob |
|---|---|---|
| Task 7 | `3d39129a58b497c92d0125569edebd894c47a71d` | `platform-evidence-standard.md` blob `5aa640263da812458a6005de6e691801d24374f5`; `platform-state-and-certainty-matrix.md` blob `cc937eb46b0493236dd2be67589f147049dbee26` |
| Task 8 | `0fcb00265a23ea859681dfef7b6edad213c674df` | `positioning-rider-experience.md` blob `38e7e5fda00dd4b4ed577a2a37c7eb5fb596499d` |

`XFER-T9-POLICY-v1` identifies the policy definition in this artifact and is bound by the commit containing it. It is not a product/build version, approved artifact version, observed result, or release decision.

## One frozen connection and required rider content

Assess one connection only after fixing all of these inputs to one accepted version and scope:

| Required input or output | Exact requirement |
|---|---|
| Incoming interval | Accepted incoming arrival interval `A = [A earliest, A latest]` for the exact train and arrival platform |
| Outgoing interval | Accepted outgoing departure interval `D = [D earliest, D latest]` for the exact connecting train and departure platform |
| Arrival and platform truth | Both train dispositions, exact platforms, platform states, and positioning certainty from their owners |
| Positioning | Front/Middle/Back when supported; omission when unavailable under the exception below |
| Walking path | Plain-language ordered path from arrival position to departure boarding area |
| Movement types | Every applicable stair, escalator, elevator, ramp, level path, and long passage |
| Walking range | Verified conservative range for the exact path, with fixed high end `W` |
| Accessibility | Exact accessibility validity for the transfer subchain and, when Accessible Route Only is On, the complete street-to-street journey |
| Buffer | Effective rider buffer `B` after the accessible minimum is applied |
| Assessment | Text state, reason, walking range, accessibility validity, and platform certainty, with equivalent assistive meaning |

Every accepted timestamp must sit on one coherent authoritative chronology. Use source-owned observation and event timestamps. Never use phone time, rounded displayed minutes, an Expected-range center, a next-three board-order estimate, a screen-capture time, or a previously displayed countdown.

Calculate in unrounded seconds:

- conservative transfer window: `C = D earliest − A latest`;
- optimistic transfer window: `O = D latest − A earliest`; and
- conservative spare time: `S = C − W`.

Classification uses those unrounded values. Only the resulting presentation may round under the owning display rules. Rounding can never move a connection across a boundary.

## Hard input gate

Run this gate before calculating or displaying any of the four states. A required input fails when it is missing, stale under its owner rule, malformed, contradictory, quarantined, outside owner freshness, wrong-scope, or unsupported.

No current four-state assessment exists when:

- either arrival is suppressed or unavailable;
- a **Holding** or confirmed-pattern arrival **Uncertain** record lacks an accepted current interval;
- either leg is **Scheduled** fallback or offline reference data;
- an unresolved service, reroute, exact-stop, direction, destination, or track veto applies;
- either platform is **Check station signs**;
- the exact platform, transfer passage, geometry, walking-range high end, or required accessibility chain is unverified; or
- any other required input fails its owning contract.

Absence is not a fifth likelihood state and must not be labeled **Uncertain**. A transfer-likelihood **Uncertain** state exists only after the hard gate passes.

Train state **Expected** is distinct from **Expected platform**. An admitted current Expected train may participate when it supplies an accepted current interval and every other gate passes. Its center estimate may order the board but never replaces either interval endpoint in transfer math.

Missing Front/Middle/Back does not automatically fail the assessment. It may proceed without a zone only when an independently verified high-end walk conservatively covers every allowed alighting position for the exact arrival platform and path. If neither a supported zone nor that all-position high end exists, withhold the assessment.

## State precedence and exact boundaries

After the hard gate passes, apply this order:

1. If either platform is **Expected platform**, return **Uncertain** only when a complete current static transfer path and verified high-end walk still exist. This platform-state override defeats otherwise Likely, Tight, or Unlikely arithmetic.
2. With both platforms **Platform confirmed**, classify from the unrounded intervals:

| First matching condition | State | Meaning |
|---|---|---|
| `O < W` | **Unlikely** | Even the optimistic window is shorter than the verified high-end walk. |
| `C < W ≤ O` | **Uncertain** | Plausible arrival and departure endpoints straddle the required high-end walk. |
| `W ≤ C < W + B` | **Tight** | The conservative window covers the high-end walk but leaves less than the effective buffer. |
| `C ≥ W + B` | **Likely** | The conservative window covers the high-end walk and leaves at least the effective buffer. |

The fixed equality boundaries are:

- `O = W` → **Uncertain**;
- `C = W` → **Tight**;
- `C = W + B` → **Likely**; and
- “at least” includes equality.

No numeric confidence score, probability, average, center estimate, weighted blend, or manual optimism may replace these states.

## Buffer selection

Allowed rider choices are exactly 3, 5, 8, or 10 minutes.

| Context | Effective-buffer rule |
|---|---|
| General default | Use 3 minutes. |
| Verified accessible transfer or Accessible Route Only | Use at least 5 minutes. |
| Stored 3-minute general preference applied to an accessible transfer | Keep the stored preference unchanged, visibly apply 5 minutes to the current assessment, and explain the accessible minimum. |
| Selected 5, 8, or 10 minutes | Retain the selected value; an accessible minimum never reduces 8 or 10. |
| Any other value | It is not an allowed assessment buffer. Do not round or silently map it to an allowed value. |

Formally, use the selected allowed buffer when no accessible minimum applies and `max(selected buffer, 5 minutes)` when the accessible minimum applies.

`W` and `B` are separate. `W` already represents the verified conservative walking high end; adding a walking contingency into `W` and then adding it again as `B` is prohibited. A stair walking range can never be reused for an accessible path.

## Accessibility validity and truth vetoes

Accessible Route Only validates the exact arrival-platform-to-departure-boarding-area transfer subchain and the complete origin-street-to-destination-street journey. Every required connection, direction, platform, boarding area, passage, equipment decision, and exit must pass independently for the same current candidate.

Any Failed or Unknown required accessible connection:

1. rejects the candidate;
2. keeps Accessible Route Only On;
3. produces no Likely, Tight, Uncertain, or Unlikely label;
4. offers only the first independently verified accessible alternative in the accepted order; and
5. otherwise uses exactly **No verified step-free subway route is available right now.**

The accessible alternative order remains:

1. another verified path in the same complex;
2. a nearby verified accessible subway station;
3. a verified subway detour, including ride-past-and-return when every added connection passes; and
4. an explicit bus-inclusive choice.

An official suggestion, ordinary-platform record, station badge, equipment presence, prior path, or faster route cannot fill a Failed or Unknown edge.

An invalidating conflict on either leg suppresses that arrival and all dependent platform, positioning, transfer, and accessibility guidance. Preserve unrelated trains and transfers that independently pass. Preserve the exact station context:

**Track change—check station signs**

Preserve the exact affected-board suppression explanation:

**Service change—this train's downstream stops are not verified.**

The station context does not create a **Check station signs** row for the suppressed train.

## Rider consequence and next workable option

Every displayed assessment uses a text label and reason. Color, icon, motion, map position, or layout never stands alone.

| State | Required rider consequence | Prohibited consequence |
|---|---|---|
| **Likely** | May remain the offered connection; explain that the conservative window covers the walk plus the effective buffer. | Guarantee, promise, “will make,” or implication that the train waits. |
| **Tight** | Explain that the walk is covered with less than the selected buffer and show a calmer alternative when eligible. | Instruction to run, rush, skip an accessible path, use unsafe movement, or treat Tight as Likely. |
| **Uncertain** | Name either range overlap or **Expected platform** as the reason and avoid a promise. | Promise, hide the cause, or use Uncertain to mask a failed hard input. |
| **Unlikely** | Retire the original walk as an active instruction and show the next independently eligible option. | Continue stale turn-by-turn walking instructions or silently keep the impossible connection active. |

Before showing a next option:

1. reapply arrival admission and every service, stop, reroute, and track veto;
2. reapply exact platform, path, walking-range, positioning, and accessibility validity;
3. calculate its intervals independently;
4. preserve the rider's destination and Accessible Route Only setting;
5. present it as a choice rather than silently activating or switching it; and
6. keep Scheduled fallback labeled as reference and outside the current four-state assessment.

If no next option passes, show the truthful owner-supplied unavailable or no-route consequence. Do not reuse the rejected connection's path, interval, zone, or label.

## Visible and assistive presentation

For every current assessment, visible and assistive output convey the same:

- text state and reason;
- conservative walking range;
- accessibility validity, including whether Accessible Route Only controls;
- incoming and outgoing platform certainty;
- Front/Middle/Back position when supported, or truthful zone omission under the all-position rule;
- effective rider buffer when it changes the interpretation; and
- next-option status without silent activation.

The concise visual may lead with the state, but details and assistive output cannot omit facts needed to avoid a stronger inference. **Likely** never becomes a promise when read aloud. **Tight** never becomes “run.” **Uncertain** names the overlap or Expected-platform cause. **Unlikely** removes the obsolete walk instruction from both visible and spoken active guidance.

## Offline, stale, and reconnection behavior

Current likelihood cannot survive the global Offline state as current truth. Preserve the exact persistent banner from the offline owner:

**Offline—live arrivals, alerts, and elevator status are unavailable.**

Preserve the trip and transfer context. A retained former likelihood is explicitly historical, keeps its original claim-specific last-checked time, and has no active current semantic. Static walking or positioning information may remain only as verified reference with its verification date. Do not calculate, rank, or activate a next option offline. Current route-critical equipment state is **Unknown**.

Reconnection reevaluates transfer context only at stage 4, after stage 1 path and equipment decisions, stage 2 service-change decisions, and stage 3 current arrival recovery. A returned request or one fresh snapshot never restores the former **Likely** state automatically. Recompute only from newly accepted exact inputs after all earlier stages complete. The Release 1 offline card remains complete when positioning and current likelihood are legitimately unavailable.

## Fixed synthetic fixtures

Every fixture below is a synthetic expected-policy definition, not an observed result. All use:

- accepted Task 7 commit and blobs and accepted Task 8 commit and blob listed in [Accepted upstream documentation bindings](#accepted-upstream-documentation-bindings);
- `XFER-T9-POLICY-v1`;
- one unique synthetic source package `<fixture-id>-SRC-v1`;
- synthetic `2026-07-30 America/New_York` timestamps on one coherent chronology;
- fixed product/build **Pending**; and
- no real station, platform, train, walk, accessible path, equipment record, source capture, or coverage claim.

In the tables, “accepted 09:59:00; evaluate 09:59:01” fixes the synthetic source-acceptance and evaluation timestamps. Unless a row states otherwise, both trains are admitted current Live records, both platforms are **Platform confirmed**, the exact path and `3:00–4:00` walking range are verified, `W=4:00`, and a supported Middle zone exists. Arithmetic shown for a hard-gate failure is audit-only and cannot authorize classification.

### Three- and five-minute one-second boundaries

| Fixture and fixed source package | Accepted/evaluation timestamps; A; D | Platform, path, and accessibility inputs | Effective B | C; O; S | Expected visible and assistive result | Prohibited result |
|---|---|---|---:|---|---|---|
| `XFER-B03-BELOW`; `XFER-B03-BELOW-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:06:59,10:06:59]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=6:59`; `O=6:59`; `S=2:59` | Visible and assistive: **Tight** because 2:59 spare is below the 3:00 buffer; Middle; walk 3–4 min; accessibility not claimed; both platforms confirmed | Likely; Uncertain; guarantee; unsafe running; hidden accessibility or platform meaning |
| `XFER-B03-AT`; `XFER-B03-AT-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:07:00,10:07:00]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=7:00`; `O=7:00`; `S=3:00` | Visible and assistive: **Likely** because spare equals the 3:00 buffer; Middle; walk 3–4 min; accessibility not claimed; both platforms confirmed; no promise | Tight from strict-greater error; guarantee; rounded-down reclassification |
| `XFER-B03-ABOVE`; `XFER-B03-ABOVE-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:07:01,10:07:01]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=7:01`; `O=7:01`; `S=3:01` | Visible and assistive: **Likely** because spare exceeds the 3:00 buffer; Middle; walk 3–4 min; accessibility not claimed; both platforms confirmed; no promise | Tight; guarantee; state from rounded displayed minutes |
| `XFER-B05-BELOW`; `XFER-B05-BELOW-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:08:59,10:08:59]` | Both confirmed; exact accessible subchain and complete journey pass; walk `3:00–4:00`; ARO On | `5:00` | `C=8:59`; `O=8:59`; `S=4:59` | Visible and assistive: **Tight** because 4:59 spare is below the accessible 5:00 buffer; Middle; accessible path verified; ARO On; both platforms confirmed | Likely; 3-minute accessible buffer; stair range; unsafe running |
| `XFER-B05-AT`; `XFER-B05-AT-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:09:00,10:09:00]` | Both confirmed; exact accessible subchain and complete journey pass; walk `3:00–4:00`; ARO On | `5:00` | `C=9:00`; `O=9:00`; `S=5:00` | Visible and assistive: **Likely** because spare equals the accessible 5:00 buffer; Middle; accessible path verified; ARO On; both platforms confirmed; no promise | Tight from strict-greater error; accessible buffer below 5; guarantee |
| `XFER-B05-ABOVE`; `XFER-B05-ABOVE-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:09:01,10:09:01]` | Both confirmed; exact accessible subchain and complete journey pass; walk `3:00–4:00`; ARO On | `5:00` | `C=9:01`; `O=9:01`; `S=5:01` | Visible and assistive: **Likely** because spare exceeds the accessible 5:00 buffer; Middle; accessible path verified; ARO On; both platforms confirmed; no promise | Tight; guarantee; rounded input math |

### Interval, Expected-platform, and selected-buffer boundaries

| Fixture and fixed source package | Accepted/evaluation timestamps; A; D | Platform, path, and accessibility inputs | Effective B | C; O; S | Expected visible and assistive result | Prohibited result |
|---|---|---|---:|---|---|---|
| `XFER-O-BELOW-W`; `XFER-O-BELOW-W-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:01:00]`; `D=[10:03:00,10:03:59]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=2:00`; `O=3:59`; `S=−2:00` | Visible and assistive: **Unlikely** because even O is 1 second shorter than W; retire the walk; show only an independently eligible next choice; include walk, accessibility, and both confirmed platforms | Uncertain; continued active walk; silent next-option switch |
| `XFER-O-AT-W`; `XFER-O-AT-W-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:01:00]`; `D=[10:03:00,10:04:00]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=2:00`; `O=4:00`; `S=−2:00` | Visible and assistive: **Uncertain** because the plausible ranges reach W only at the optimistic equality; Middle; walk 3–4 min; accessibility not claimed; both platforms confirmed | Unlikely from `O≤W`; Tight; promise |
| `XFER-C-AT-W`; `XFER-C-AT-W-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:01:00]`; `D=[10:05:00,10:05:00]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=4:00`; `O=5:00`; `S=0:00` | Visible and assistive: **Tight** because C equals W and leaves no buffer; Middle; walk 3–4 min; accessibility not claimed; both platforms confirmed | Uncertain from `C≤W`; Likely; unsafe running |
| `XFER-RANGE-STRADDLE`; `XFER-RANGE-STRADDLE-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:02:00]`; `D=[10:05:00,10:07:00]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; ARO Off | `3:00` | `C=3:00`; `O=7:00`; `S=−1:00` | Visible and assistive: **Uncertain** because C is below W while O is above W; Middle; walk 3–4 min; accessibility not claimed; both platforms confirmed | Tight from center estimate; promise; board-order estimate |
| `XFER-EXPECTED-OVERRIDES-LIKELY`; `XFER-EXPECTED-OVERRIDES-LIKELY-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Incoming **Expected platform**, outgoing confirmed; complete current static path and W pass; Expected positioning treatment; accessibility not claimed; ARO Off | `3:00` | `C=10:00`; `O=10:00`; `S=6:00` | Visible and assistive: **Uncertain** because the incoming platform is Expected despite otherwise-Likely math; clearly Expected zone wording; walk 3–4 min; accessibility not claimed | Likely; Platform confirmed implication; direct Verified zone wording |
| `XFER-EXPECTED-OVERRIDES-UNLIKELY`; `XFER-EXPECTED-OVERRIDES-UNLIKELY-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:01:00]`; `D=[10:03:00,10:03:59]` | Incoming confirmed, outgoing **Expected platform**; complete current static path and W pass; Expected positioning treatment; accessibility not claimed; ARO Off | `3:00` | `C=2:00`; `O=3:59`; `S=−2:00` | Visible and assistive: **Uncertain** because the outgoing platform is Expected despite otherwise-Unlikely math; explain platform cause; walk 3–4 min; accessibility not claimed | Unlikely; active impossible-walk claim; Platform confirmed implication |
| `XFER-ARO-STORED-3-MIN`; `XFER-ARO-STORED-3-MIN-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:08:59,10:08:59]` | Both confirmed; exact accessible subchain and journey pass; walk `3:00–4:00`; ARO On; stored general preference 3:00 remains stored | `5:00` | `C=8:59`; `O=8:59`; `S=4:59` | Visible and assistive: **Tight**; explain that the current accessible assessment uses the 5:00 minimum; Middle; walk 3–4 min; accessible path verified; ARO On | Effective 3:00; mutate stored preference; Likely |
| `XFER-B08-BELOW`; `XFER-B08-BELOW-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:11:59,10:11:59]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; rider selected 8:00 | `8:00` | `C=11:59`; `O=11:59`; `S=7:59` | Visible and assistive: **Tight** because spare is 1 second below the selected 8:00 buffer; Middle; walk and platform facts included | Likely; fallback to default 3 or 5; rounded reclassification |
| `XFER-B10-AT`; `XFER-B10-AT-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:14:00,10:14:00]` | Both confirmed; verified ordinary path; walk `3:00–4:00`; accessibility not claimed; rider selected 10:00 | `10:00` | `C=14:00`; `O=14:00`; `S=10:00` | Visible and assistive: **Likely** because spare equals the selected 10:00 buffer; Middle; walk and platform facts included; no promise | Tight from strict-greater error; use of a smaller default; guarantee |

### Accessibility, hard-gate, offline, and no-zone fixtures

| Fixture and fixed source package | Accepted/evaluation timestamps; A; D | Platform, path, and accessibility inputs | Effective B | C; O; S | Expected visible and assistive result | Prohibited result |
|---|---|---|---:|---|---|---|
| `XFER-ARO-EDGE-FAILED`; `XFER-ARO-EDGE-FAILED-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Both confirmed; one exact required accessible transfer edge Failed; ARO On; walk `3:00–4:00`; first verified same-complex accessible alternative exists | `5:00` | audit-only `C=10:00`; `O=10:00`; `S=6:00` | Visible and assistive: no likelihood for the rejected connection; keep ARO On; explain the failed edge; offer the first verified same-complex alternative as a choice, not active | Likely from arithmetic; Failed as Uncertain; silent activation; later-order alternative |
| `XFER-ARO-EDGE-UNKNOWN`; `XFER-ARO-EDGE-UNKNOWN-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Both confirmed; one exact required accessible transfer edge Unknown; ARO On; proposed walk `3:00–4:00` cannot validate the chain; no verified accessible alternative exists | `5:00` | audit-only `C=10:00`; `O=10:00`; `S=6:00` | Visible and assistive: no likelihood; keep ARO On; **No verified step-free subway route is available right now.** | Unknown labeled Uncertain; Likely from arithmetic; ARO Off; unverified alternative |
| `XFER-CHECK-SIGNS`; `XFER-CHECK-SIGNS-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; candidate `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Incoming **Check station signs**, outgoing confirmed; proposed path and walk otherwise complete; accessibility not claimed | `3:00` | audit-only `C=10:00`; `O=10:00`; `S=6:00` | Visible and assistive: no current likelihood and no zone; preserve **Check station signs** and independently valid arrival context | Uncertain as a fallback; Likely; inherited geometry |
| `XFER-HARD-CONFLICT`; `XFER-HARD-CONFLICT-SRC-v1` | conflict accepted 09:59:00; evaluate 09:59:01; rejected candidate `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Incoming leg has an explicit invalidating nonterminal actual-versus-scheduled-track conflict and no platform state; outgoing leg independently confirmed; proposed path otherwise complete | `3:00` | audit-only `C=10:00`; `O=10:00`; `S=6:00` | Visible and assistive: suppress the incoming row and all dependent guidance; no likelihood; show exact station context and suppression explanation; preserve unrelated service | Check-signs row; Uncertain; Scheduled substitute; suppression of unrelated service |
| `XFER-HOLDING-NO-INTERVAL`; `XFER-HOLDING-NO-INTERVAL-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; rejected cached `A=[10:00:00,10:00:00]` is not an accepted current interval; `D=[10:10:00,10:10:00]` | Incoming **Holding** without accepted current interval; platforms otherwise confirmed; proposed path and walk complete; accessibility not claimed | `3:00` | rejected arithmetic `C=10:00`; `O=10:00`; `S=6:00`, not decision input | Visible and assistive: no current likelihood; retain only owner-approved Holding context and reason | Transfer Uncertain as absence state; Likely from cached interval; advancing countdown |
| `XFER-ARRIVAL-UNCERTAIN-NO-INTERVAL`; `XFER-ARRIVAL-UNCERTAIN-NO-INTERVAL-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; rejected prior `A=[10:00:00,10:00:00]` is not an accepted current interval; `D=[10:10:00,10:10:00]` | Incoming confirmed-pattern arrival **Uncertain** without accepted current interval; platforms otherwise confirmed; proposed path and walk complete | `3:00` | rejected arithmetic `C=10:00`; `O=10:00`; `S=6:00`, not decision input | Visible and assistive: no transfer-likelihood state; retain only owner-approved **Arrival uncertain** context | Likelihood Uncertain merely because names match; Likely from prior interval; exact minute |
| `XFER-SCHEDULED`; `XFER-SCHEDULED-SRC-v1` | accepted reference 09:59:00; evaluate 09:59:01; scheduled candidate `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | One or both legs are Scheduled fallback; expected static platforms; reference path/walk verified with date; accessibility not current | `3:00` | reference arithmetic `C=10:00`; `O=10:00`; `S=6:00`, not current decision input | Visible and assistive: no current likelihood; retain **Scheduled** and reference meaning only | Any four-state label; countdown; current platform, accessibility, or connection claim |
| `XFER-OFFLINE`; `XFER-OFFLINE-SRC-v1` | Offline accepted 09:59:00; evaluate 09:59:01; retained historical `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Global Offline; retained prior platforms/path/walk are historical; current equipment Unknown; reference geometry retains its verification date | `3:00` | historical arithmetic `C=10:00`; `O=10:00`; `S=6:00`, not current decision input | Visible and assistive: exact Offline banner; prior likelihood, if retained, explicitly historical with original last-checked time; no current state, calculation, ranking, or activation | Current Likely; auto-restoration; offline next-option calculation; current accessible-now claim |
| `XFER-NO-ZONE-ALL-POSITION`; `XFER-NO-ZONE-ALL-POSITION-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Both confirmed; no supported zone; independently verified all-position walk `3:00–4:00` covers every allowed alighting position; accessibility not claimed; ARO Off | `3:00` | `C=10:00`; `O=10:00`; `S=6:00` | Visible and assistive: omit zone but show **Likely**, its reason, walk 3–4 min, accessibility not claimed, and both confirmed platforms; no promise | Invented zone; withheld assessment solely because zone is absent; car number |
| `XFER-NO-ZONE-NO-RANGE`; `XFER-NO-ZONE-NO-RANGE-SRC-v1` | accepted 09:59:00; evaluate 09:59:01; candidate `A=[10:00:00,10:00:00]`; `D=[10:10:00,10:10:00]` | Both confirmed; no supported zone and no independently verified all-position high-end walk; a zone-specific `3:00–4:00` range cannot cover all allowed positions | `3:00` | audit-only `C=10:00`; `O=10:00`; proposed `S=6:00` is ineligible | Visible and assistive: no zone and no likelihood assessment; preserve independently valid platform context | Likely from zone-specific walk; guessed zone; Uncertain as absence |

For `XFER-HARD-CONFLICT`, the required visible and assistive result includes exact **Track change—check station signs** station context and exact **Service change—this train's downstream stops are not verified.** suppression explanation. For `XFER-OFFLINE`, it includes exact **Offline—live arrivals, alerts, and elevator status are unavailable.**

## Pending execution record for every fixture

| Fixture | Actual result | Reviewer decisions | Durable evidence and attachments | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `XFER-B03-BELOW` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B03-AT` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B03-ABOVE` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B05-BELOW` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B05-AT` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B05-ABOVE` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-O-BELOW-W` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-O-AT-W` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-C-AT-W` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-RANGE-STRADDLE` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-EXPECTED-OVERRIDES-LIKELY` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-EXPECTED-OVERRIDES-UNLIKELY` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-ARO-STORED-3-MIN` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B08-BELOW` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-B10-AT` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-ARO-EDGE-FAILED` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-ARO-EDGE-UNKNOWN` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-CHECK-SIGNS` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-HARD-CONFLICT` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-HOLDING-NO-INTERVAL` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-ARRIVAL-UNCERTAIN-NO-INTERVAL` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-SCHEDULED` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-OFFLINE` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-NO-ZONE-ALL-POSITION` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `XFER-NO-ZONE-NO-RANGE` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |

## Correction, review, and Release 2 boundary

Every future execution must bind one immutable product/build, this artifact, the accepted Task 7 and Task 8 artifacts, every applicable arrival, accessibility, offline, and service-change dependency, the fixture's unique synthetic source package, authoritative timestamps, both intervals, platform states, exact path, walking range and high end, accessibility validity, effective buffer, C/O/S values, exact visible and assistive outputs or omissions, prohibited-result checks, all four same-version reviewer decisions, durable attachments, correction, and rerun. A later passing rerun preserves the original result.

These definitions are not executed evidence. They do not establish real transfer coverage, pass Gate 0, alter the Release 1 accessibility or Nearby/offline no-go decisions, approve this artifact, complete Task 12 Steps 5–13, or authorize Release 2.

## Draft review checklist

- [ ] One accepted current connection freezes exact A, D, platforms, path, W, accessibility validity, and B on one authoritative chronology.
- [ ] C, O, and S use unrounded seconds and never use phone time, display rounding, a range center, or board order.
- [ ] The hard gate runs before the four states; absence is never labeled Uncertain.
- [ ] An admitted Expected train participates only with an accepted range; **Expected platform** independently forces Uncertain when the complete static path and W pass.
- [ ] Confirmed-platform math uses `O < W`, `C < W ≤ O`, `W ≤ C < W+B`, and `C ≥ W+B` with the fixed equality outcomes.
- [ ] Only 3, 5, 8, or 10 minutes are allowed; verified accessible transfers and Accessible Route Only never use less than 5.
- [ ] W and B remain separate, and no stair walking range is reused for an accessible path.
- [ ] Failed or Unknown required accessible edges reject the candidate, keep Accessible Route Only On, and produce only the first verified accessible alternative or the exact no-route copy.
- [ ] A hard conflict suppresses the affected arrival and every dependent claim, preserves both exact messages, and leaves unrelated service intact.
- [ ] Likely is not a promise; Tight never instructs unsafe running; Uncertain names its cause; Unlikely retires the stale walk and independently reevaluates the next choice.
- [ ] Missing positioning may proceed only with a verified all-position high-end walk; otherwise the assessment is withheld.
- [ ] Scheduled and Offline reference information receives no current likelihood; reconnection reevaluates transfers only at stage 4 and never auto-restores Likely.
- [ ] Visible and assistive output carry the same state, reason, walk, accessibility validity, platform certainty, position or omission, and next-option status without color-only meaning.
- [ ] Every fixed fixture retains its unique input version and all actual, reviewer, evidence, correction, rerun, and status fields Pending.
- [ ] No real station, platform, train, path, walk, result, reviewer, approval, coverage, or release evidence is claimed.

Every unchecked required item blocks review completion and Release 2 consideration. This documentation commit is not working-product evidence.
