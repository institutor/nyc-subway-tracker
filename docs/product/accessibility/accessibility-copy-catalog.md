# Accessibility copy catalog

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19–20, 21.10, 31.5, and 33.3; accessibility and platform-guidance plan `Product artifact map` and Task 3 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Content Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This catalog owns the exact Task 3 rider-facing accessibility messages and their evidence boundaries. It synchronizes copy with the [Accessible Route Only state matrix](accessible-route-only-state-matrix.md), [complete accessible-path contract](complete-path-contract.md), [path-edge review checklist](path-edge-review-checklist.md), [station-direction coverage register](station-direction-coverage-register.md), and [station-direction review guide](station-direction-review-guide.md).

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), the [approved rider language rules](../contracts/rider-language-rules.md) control evidence and certainty, and all decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains no real station, entrance, route, direction, platform, path, equipment, outage, restoration, journey, observed copy result, approval, or reviewer evidence. The Task 3 copy fixtures are linked to 16 abstract scenarios, all **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 3 does not approve rider-facing accessibility copy for release, pass Gate 0, authorize an accessible-now claim, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) cites specification §§19–20 for this catalog. Task 3 additionally applies acceptance case §21.10, accessibility scenarios §31.5, completeness risk §33.3, and the plan's full Task 3 provenance, as recorded above. Product Governance Lead reconciliation of the index and this metadata is **Pending** before this artifact may advance from **Draft**. This task does not edit the index or treat the mismatch as approved.

## Copy-use contract

1. Copy describes the exact evidence state; it cannot strengthen, complete, or substitute for evidence.
2. The visible message and assistive-technology message must convey the same state, scope, certainty, and rider consequence.
3. The exact phrases in this catalog must not be shortened, paraphrased, softened, or made more certain.
4. An icon, accessibility badge, route color, equipment symbol, tone, placement, or animation cannot replace the text or its assistive equivalent.
5. A station-, complex-, line-, direction-, entrance-, platform-, boarding-area-, machine-, or path-level label applies only to the exact scope that passed its governing review.
6. Accessible Route Only remains On when a route is rejected, no route remains, the product is Offline, location permission is denied, or a bus-inclusive option is declined.
7. A message never makes a rejected candidate eligible and never turns Unknown into Pass.

## Exact Task 3 copy

| Catalog ID | Exact visible copy | Exact assistive copy | Authorized trigger | Required consequence |
|---|---|---|---|---|
| A11Y-T3-01 | **No verified step-free subway route is available right now.** | **No verified step-free subway route is available right now.** | Accessible Route Only is On and no current subway candidate passes every required complete-path, exact-scope, service, platform, and current equipment decision. | Keep the setting On, preserve origin and destination intent, show no invalid subway route, and keep bus inclusion separate. |
| A11Y-T3-02 | **Structurally step-free; live elevator status unavailable** | **Structurally step-free; live elevator status unavailable** | Offline and the stored complete-path structural evidence remains eligible under its authoritative owner rule for the exact path; live equipment state cannot be claimed. | Present structural planning information only; never imply current accessibility or equipment availability. |
| A11Y-T3-03 | **Accessibility not confirmed** | **Accessibility not confirmed** | An official suggested alternative is disclosed but has not passed every complete-path and accepted current-state decision for its exact scope. | Exclude the alternative from Accessible Route Only results and do not promote it as accessible. |

The period in A11Y-T3-01 is part of the exact message. A11Y-T3-02 and A11Y-T3-03 appear exactly as written above. Product controls may add separately reviewed route or journey context, but may not insert words into, remove words from, or change the certainty of these phrases.

## State-to-copy matrix

| Product decision | Required Task 3 treatment | Copy that must not appear |
|---|---|---|
| At least one current subway path passes every hard constraint | A valid path may proceed to resilient ranking. This catalog supplies no generic positive accessibility badge or slogan. | Any broader station- or complex-level accessibility promise unsupported by the exact path |
| No current subway path passes | Use A11Y-T3-01 exactly. | Accessible, Accessible now, Probably accessible, fallback route available, error |
| Offline with owner-eligible stored complete-path structural evidence | Use A11Y-T3-02 exactly. | Accessible now, live accessibility, Working, elevators available, all clear |
| Offline with missing, invalid, stale-under-owner-rule, partial, wrong-scope, or unreviewed structural evidence | Make no positive structural accessibility claim. Preserve context; later equipment or warning owners may supply only approved state copy. | A11Y-T3-02, Accessible, Accessible now, accessibility badge |
| Official suggested alternative lacks complete review | Use A11Y-T3-03 exactly wherever that disclosed alternative appears; exclude it from Accessible Route Only results. | Accessible alternative, recommended accessible route, Probably accessible |
| Bus-inclusive choice has not been made | Keep the subway-only result and A11Y-T3-01 when applicable. | Any bus itinerary presented as the selected result |
| Rider makes a separate explicit bus-inclusive choice | Evaluate and label the bus-inclusive journey separately under its applicable evidence contract. | Copy implying that the subway result became valid or Accessible Route Only became Off |
| Rider declines or ignores a bus-inclusive option | Keep the truthful subway-only no-route state. | Error, failed choice, automatic bus insertion |
| One candidate fails but another complete current candidate passes | Remove the failed candidate from Accessible Route Only results; rank only the valid candidate set. | A11Y-T3-03 used to keep an invalid candidate inside the eligible set |

## No-route and bus-choice boundary

A11Y-T3-01 is the complete Task 3 no-verified-subway message. It is a truthful result, not an error, dead end, permission failure, or signal that the rider's preference has changed.

The product may expose a separate control that lets the rider explicitly request a bus-inclusive journey. The control must:

- be separate from the subway result;
- state that buses will be included before the rider commits the choice;
- expose the same choice and consequence to assistive technology;
- require a direct rider action;
- leave Accessible Route Only On; and
- leave A11Y-T3-01 truthful for the subway-only request.

The exact bus-control label and supporting explanation are **Pending** Content, Product, Accessibility, and Data Quality review. No placeholder wording is approved by this Task 3 artifact. The absence of an approved label never authorizes automatic bus insertion.

## Offline boundary

A11Y-T3-02 describes two facts only:

1. stored structural evidence remains complete and eligible for the exact path under its owner rule; and
2. live elevator status is unavailable.

It does not mean:

- the route is accessible now;
- required equipment is available;
- no official outage exists;
- a last-known outage has cleared;
- an elevator or escalator is Working;
- the current route, platform, or exit remains usable; or
- the journey should be promoted over a currently verified result.

If stored structural coverage does not pass, suppress A11Y-T3-02. A cached station badge, machine list, former route, last-known availability, map geometry, or prior successful journey cannot authorize it.

## Unverified official-alternative boundary

A11Y-T3-03 does not make an alternative eligible. It communicates that an official suggestion has not passed the complete accessibility review. Use it only with the disclosed alternative to which it applies.

Official authorship, an accessibility symbol, equipment presence, route similarity, nearby geography, ordinary-platform evidence, or a previous rider journey cannot strengthen A11Y-T3-03 into a positive claim. The alternative remains outside Accessible Route Only results until every exact path and current decision passes.

## Prohibited or unsupported wording

| Wording or treatment | Why prohibited in this state | Required treatment |
|---|---|---|
| **Accessible**, **Accessible route**, or **Accessible now** without a complete current pass | Converts partial, stale, offline, or wrong-scope evidence into a current trip claim. | Use the exact applicable Task 3 phrase or make no positive claim. |
| **Working** for equipment | Unconditional equipment availability is not supported by the approved evidence model. | Task 4 wording is Pending. |
| **Probably accessible**, **Likely accessible**, or equivalent hedging | Makes a positive accessibility inference from incomplete evidence. | Use A11Y-T3-03 for an unverified disclosed official alternative; otherwise do not invent a positive claim. |
| **All elevators working** or equivalent | Equipment presence, an empty response, or missing outage data does not prove complete path availability. | Task 4 wording is Pending. |
| **Station accessible** based on a complex badge | Conceals constituent, line, direction, entrance, platform, boarding-area, passage, equipment, or exit differences. | Name only exact reviewed scope when a later approved experience requires it. |
| **Accessible bus alternative** before separate choice and complete review | Blends an unrequested mode and unverified path into the subway result. | Keep A11Y-T3-01 and the separate explicit-choice boundary. |
| Error styling or copy for no verified route | Misstates a supported no-result state and may pressure the rider to relax the setting. | Use A11Y-T3-01 without implying rider fault. |
| Color-only, icon-only, badge-only, or map-only accessibility state | Omits equivalent meaning for riders who cannot perceive the treatment and can overstate scope. | Pair any treatment with exact visible text and equivalent assistive text. |
| A silent or announced switch to Off | Contradicts the persistent hard constraint. | Keep the setting On until an explicit rider change. |

Equivalent synonyms, abbreviations, icons, audio tones, notifications, summaries, map labels, and assistive descriptions are held to the same evidence standard.

## Presentation and assistive equivalence

For all three exact phrases:

- show the complete phrase without truncating the evidence qualifier;
- announce the complete phrase in the same interaction context;
- keep route, direction, origin, destination, and alternative identity separate from the evidence phrase;
- do not rely on color, icon shape, animation, or placement for meaning;
- do not announce a positive accessibility state before or after a fail-closed result;
- keep focus order and reading order aligned with the visible result and its next available explicit action; and
- do not announce a bus journey as selected until the rider makes the separate choice.

If space cannot hold the phrase, the surface must provide an immediately available full-text presentation and full assistive label. Space pressure is never authority to shorten the copy.

## Pending Task 4 copy — do not populate in Task 3

**Status: Pending — Task 4**

Task 4 owns all exact wording and presentation rules for:

- current equipment states;
- freshness and age;
- first-empty and confirmed-empty responses;
- failed, malformed, partial, unmatched, and anomalous responses;
- stale last-known outage or availability;
- inventory matching and currency;
- estimated return treatment; and
- restoration and status-recheck treatment.

No Task 4 equipment, freshness, empty-response, anomaly, estimated-return, or restoration wording is approved here. A11Y-T3-02 does not fill those gaps.

| Pending catalog area | Owner | Task 3 state |
|---|---|---|
| Equipment state names and qualifiers | Task 4 equipment-status artifacts and Content review | **Pending — no copy recorded** |
| Freshness and status age | Task 4 equipment-status artifacts and Content review | **Pending — no copy recorded** |
| Empty, malformed, partial, unmatched, or anomalous retrieval | Task 4 equipment-status artifacts and Content review | **Pending — no copy recorded** |
| Last-known outage and recheck | Task 4 equipment-status artifacts and Content review | **Pending — no copy recorded** |
| Restoration and estimated return | Task 4 equipment-status artifacts and Content review | **Pending — no copy recorded** |

## Pending Task 5 copy — do not populate in Task 3

**Status: Pending — Task 5**

Task 5 owns all exact wording and presentation rules for:

- Blocking, Reroutable within station, and Unrelated outage impact;
- exact failed-connection descriptions;
- alternative ordering and action;
- warnings before the last accessible decision point;
- changes while a rider is underway;
- redundant-chain continuation;
- required-chain failure; and
- restoration or Unknown-state journey consequences.

No Task 5 outage-impact, reroute, alternative-action, underway-warning, decision-point, or restoration-warning wording is approved here. A11Y-T3-03 remains the only Task 3 phrase for a disclosed official alternative that lacks complete accessibility review.

| Pending catalog area | Owner | Task 3 state |
|---|---|---|
| Path-impact class wording | Task 5 path-impact artifacts and Content review | **Pending — no copy recorded** |
| Reroute and verified-alternative action | Task 5 path-impact artifacts and Content review | **Pending — no copy recorded** |
| Underway and last-decision-point warnings | Task 5 warning artifacts and Content review | **Pending — no copy recorded** |
| Redundant-chain, required-chain, Unknown, and restoration journey copy | Task 5 warning artifacts and Content review | **Pending — no copy recorded** |

## Task 3 fixture traceability

The detailed fixed-version, input, expected, prohibited, actual, reviewer, date, evidence, correction, and rerun records are in the [Accessible Route Only state matrix](accessible-route-only-state-matrix.md). This catalog records the copy consequence without converting expected language into observed evidence.

| Fixture | Copy consequence under review | Current state |
|---|---|---|
| ARO-01 | Setting state remains visibly and assistively On through every listed transition. | **Not run — Pending** |
| ARO-02 | No positive accessibility wording for an incomplete or Unknown origin path. | **Not run — Pending** |
| ARO-03 | No positive accessibility wording for an incomplete or Unknown transfer. | **Not run — Pending** |
| ARO-04 | No positive accessibility wording when destination egress is broken. | **Not run — Pending** |
| ARO-05 | No positive accessibility wording inherited from the opposite direction. | **Not run — Pending** |
| ARO-06 | No positive accessibility wording when the boarding area is unverified. | **Not run — Pending** |
| ARO-07 | No positive accessibility wording inherited by an unverified reroute platform. | **Not run — Pending** |
| ARO-08 | No workaround preference claim before complete review and ranking. | **Not run — Pending** |
| ARO-09 | No positive accessibility wording for a workaround with one Unknown edge. | **Not run — Pending** |
| ARO-10 | Use A11Y-T3-01 visibly and through assistive technology. | **Not run — Pending** |
| ARO-11 | Keep bus out; retain A11Y-T3-01 where applicable. | **Not run — Pending** |
| ARO-12 | Convey a separate bus-inclusive evaluation without weakening subway truth. | **Not run — Pending** |
| ARO-13 | Use A11Y-T3-02 visibly and through assistive technology; never accessible now. | **Not run — Pending** |
| ARO-14 | Use A11Y-T3-03 visibly and through assistive technology; exclude the alternative. | **Not run — Pending** |
| ARO-15 | Visible and assistive path order follows the exact lexicographic result. | **Not run — Pending** |
| ARO-16 | Do not call the faster, less resilient path best. | **Not run — Pending** |

## Ownership and downstream use

| Copy decision | Authoritative owner | Catalog boundary |
|---|---|---|
| Exact no-verified-subway, offline structural, and unverified-official-alternative phrases | This catalog, subject to mandatory review | Own only A11Y-T3-01 through A11Y-T3-03 and their evidence scopes. |
| Hard-constraint and route-state trigger | Accessible Route Only state matrix | Consume its decision; copy cannot change it. |
| Equipment state, freshness, anomaly, and restoration copy | Task 4 equipment artifacts plus catalog update | **Pending**; do not infer or preapprove. |
| Outage impact, reroute, and underway warning copy | Task 5 impact and warning artifacts plus catalog update | **Pending**; do not infer or preapprove. |
| Release approval | Release governance | This Draft supplies no approval or observed evidence. |

## Review completion checklist

- [ ] A11Y-T3-01 is exact, including its final period, and appears only for no eligible current subway path.
- [ ] A11Y-T3-02 is exact and appears only with owner-eligible stored structural evidence while live elevator status is unavailable.
- [ ] A11Y-T3-03 is exact and appears with a disclosed official alternative that lacks complete review.
- [ ] Visible and assistive messages convey equivalent scope, certainty, and consequence.
- [ ] No phrase is shortened, paraphrased, strengthened, or replaced by an icon, color, badge, map, or tone.
- [ ] No invalid candidate remains in Accessible Route Only results because it carries uncertainty copy.
- [ ] No-route is treated as a supported state, not an error or permission to relax the setting.
- [ ] Bus inclusion requires a separate explicit choice; declining or not choosing it preserves subway truth.
- [ ] Offline copy never implies current equipment availability, accessible now, or restoration.
- [ ] Accessible, Working, Probably accessible, and complex-level badge inferences remain prohibited without their full evidence contracts.
- [ ] Task 4 equipment and freshness sections remain clearly **Pending** with no invented wording.
- [ ] Task 5 impact and underway-warning sections remain clearly **Pending** with no invented wording.
- [ ] All 16 Task 3 fixtures remain **Not run — Pending** until fixed evidence is recorded.
- [ ] No real accessibility, equipment, outage, restoration, observed result, approval, Gate 0 passage, or release evidence is claimed.

Every unchecked required item blocks copy approval. Content review cannot approve a phrase unless Product, Accessibility, and Data Quality approve the same fixed evidence scope and every blocking scenario passes.
