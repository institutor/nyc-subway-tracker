# Accessibility copy catalog

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19–20, 21 case 6, 21.9–21.10, 29.1, 31.5, 31.6 scenario 39, 31.8, and 33.3; accessibility and platform-guidance plan `Product artifact map`, Task 3 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`, Task 4 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`, and Task 5 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Content Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This catalog owns the exact Task 3 rider-facing accessibility messages, Task 4 equipment-status messages and patterns, Task 5 impact labels and warning patterns, and their evidence boundaries. It synchronizes copy with the [Accessible Route Only state matrix](accessible-route-only-state-matrix.md), [complete accessible-path contract](complete-path-contract.md), [path-edge review checklist](path-edge-review-checklist.md), [station-direction coverage register](station-direction-coverage-register.md), [station-direction review guide](station-direction-review-guide.md), [equipment status policy](equipment-status-policy.md), [equipment-status acceptance table](equipment-status-acceptance-table.md), [path-impact and reroute playbook](path-impact-and-reroute-playbook.md), and [underway-warning state matrix](underway-warning-state-matrix.md).

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), the [approved rider language rules](../contracts/rider-language-rules.md) control evidence and certainty, and all decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains no real station, entrance, route, direction, platform, path, equipment, outage, restoration, journey, decision point, alternative, warning, notification, observed visible or assistive result, approval, reviewer, production-cadence, or threshold-calibration evidence. The Task 3 copy fixtures are linked to 16 abstract scenarios, the Task 4 copy fixtures to 13 synthetic scenarios, and the Task 5 copy fixtures to 14 synthetic scenarios; all are **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Tasks 3 through 5 do not approve rider-facing accessibility copy for release, pass Gate 0, authorize an accessible-now claim, prove a warning or notification, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) cites specification §§19–20 and reviewers Product, Accessibility, Data Quality, and Content for this catalog. Task 3 additionally applies acceptance case §21.10, accessibility scenarios §31.5, completeness risk §33.3, and the plan's full Task 3 provenance. Task 4 additionally applies acceptance case §21.9, accessibility target §29.1, cross-feature scenario §31.8, and the plan's full Task 4 provenance. Task 5 additionally applies accessibility case 6 in §21, scenario 39 in §31.6, §§20.2–20.6, and the plan's full Task 5 provenance. Operations is mandatory for Task 5 operational warnings under the review policy. Product Governance Lead reconciliation of the narrower index citation and reviewer set is **Pending** before this artifact may advance from **Draft**. This task does not edit the index or treat either mismatch as approved.

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
| **Working** or **Available** for equipment | Unconditional equipment availability is not supported by the approved evidence model. | Use the exact applicable Task 4 state; a qualifying healthy non-empty target-absence branch or confirmed global-empty sequence uses **No official outage reported**, never a working claim. |
| **Probably accessible**, **Likely accessible**, or equivalent hedging | Makes a positive accessibility inference from incomplete evidence. | Use A11Y-T3-03 for an unverified disclosed official alternative; otherwise do not invent a positive claim. |
| **All elevators working** or equivalent | Equipment presence, an empty response, or missing outage data does not prove complete path availability. | Use exact machine-scoped Task 4 states and let the complete-path owner decide the journey; never synthesize an all-equipment claim. |
| **Station accessible** based on a complex badge | Conceals constituent, line, direction, entrance, platform, boarding-area, passage, equipment, or exit differences. | Name only exact reviewed scope when a later approved experience requires it. |
| **Accessible bus alternative** before separate choice and complete review | Blends an unrequested mode and unverified path into the subway result. | Keep A11Y-T3-01 and the separate explicit-choice boundary. |
| Error styling or copy for no verified route | Misstates a supported no-result state and may pressure the rider to relax the setting. | Use A11Y-T3-01 without implying rider fault. |
| Color-only, icon-only, badge-only, or map-only accessibility state | Omits equivalent meaning for riders who cannot perceive the treatment and can overstate scope. | Pair any treatment with exact visible text and equivalent assistive text. |
| A silent or announced switch to Off | Contradicts the persistent hard constraint. | Keep the setting On until an explicit rider change. |

Equivalent synonyms, abbreviations, icons, audio tones, notifications, summaries, map labels, and assistive descriptions are held to the same evidence standard.

## Presentation and assistive equivalence

For every exact Task 3 phrase, Task 4 equipment message or pattern, and Task 5 impact label or warning pattern:

- show the complete phrase without truncating the evidence qualifier;
- announce the complete phrase in the same interaction context;
- keep route, direction, origin, destination, and alternative identity separate from the evidence phrase;
- do not rely on color, icon shape, animation, or placement for meaning;
- do not announce a positive accessibility state before or after a fail-closed result;
- keep focus order and reading order aligned with the visible result and its next available explicit action; and
- do not announce a bus journey as selected until the rider makes the separate choice.

If space cannot hold the phrase, the surface must provide an immediately available full-text presentation and full assistive label. Space pressure is never authority to shorten the copy.

## Exact Task 4 equipment-status copy

**Status: Draft — approval evidence Pending; 13 fixtures Not run — Pending**

The [equipment status policy](equipment-status-policy.md) supplies the trigger. This catalog supplies the exact rider-visible and assistive wording. These strings do not make a snapshot Current, complete an empty-response sequence, repair an inventory join, prove operation, clear an outage, or make a path accessible.

| Catalog ID | Exact visible copy | Exact assistive copy | Authorized trigger | Required consequence |
|---|---|---|---|---|
| A11Y-T4-01 | **No official outage reported** | **No official outage reported** | Either a healthy accepted Current non-empty complete same-scope snapshot contains valid other-ID outages but no exact target-ID outage, current reviewed inventory covers the target, no prior target outage awaits restoration, and no veto applies; or two accepted coherent Current globally zero-outage snapshots are at least one authoritative minute apart with coherent surrounding population, current inventory, and no stronger veto. | State only the accepted official-outage result for the exact target or supported scope; never imply Working, Available, observed operation, restoration, or complete-path accessibility. |
| A11Y-T4-02 | **Out of service** | **Out of service** | An accepted, coherent, Current official record for the exact official equipment identifier reports a present outage. | Preserve the adverse state for that machine until qualifying restoration. |
| A11Y-T4-03 | **Planned outage** | **Planned outage** | An accepted, coherent, Current official record describes a future planned outage and no accepted current outage controls. | Keep future timing separate from current state; do not infer a current outage, availability, or restoration. |
| A11Y-T4-04 | **Unknown** | **Unknown** | Equipment evidence is Degraded, Unavailable, Provisional empty, inventory-cutoff affected, unmatched, conflicting, or otherwise insufficient for the exact machine. | Fail closed for every route-critical decision; do not substitute a former positive state. |
| A11Y-T4-05 | **Out of service—status being rechecked** | **Out of service—status being rechecked** | A prior accepted outage is omitted once, becomes stale, or lacks qualifying restoration while status is rechecked. | Preserve the last-known adverse state; never imply restoration or availability. |

The em dash and lack of surrounding spaces in A11Y-T4-05 are part of the exact message. The five phrases appear exactly as written. Machine identity or separately reviewed context may appear adjacent to a phrase, but no words may be inserted into, removed from, or used to strengthen the phrase.

### Snapshot and response-state mapping

| Evidence state | Required rider treatment | Copy that must not appear |
|---|---|---|
| Healthy accepted Current non-empty complete same-scope snapshot has valid outages for other official IDs but no exact target-ID outage; current inventory covers the target; no prior target outage awaits restoration; no veto applies | A11Y-T4-01 may appear for the exact target only. | Working, Available, all equipment clear, restoration, guaranteed accessibility |
| First accepted Current coherent zero-outage snapshot | Keep internal **Provisional empty**; use A11Y-T4-04 for every route-critical machine. | A11Y-T4-01, Working, Available, all elevators working, accessible now |
| Confirmed empty after the qualifying second Current coherent snapshot | A11Y-T4-01 may appear for the exact supported scope. | Working, Available, observed operation, guaranteed accessibility |
| Degraded age or suspicious but structurally usable population | Use A11Y-T4-04 for affected route-critical machines, except preserve A11Y-T4-05 when a prior adverse state applies. | A11Y-T4-01, positive availability, restoration |
| Unavailable, failed, malformed, structurally incomplete, unjoinable, or invalid response | Use A11Y-T4-04 for affected route-critical machines, except preserve A11Y-T4-05 when a prior adverse state applies. | A11Y-T4-01, positive availability, restoration |
| Prior outage omitted in only one qualifying Current snapshot | Use A11Y-T4-05. | Restored, Working, Available, A11Y-T4-01 |
| Explicit accepted Current official restoration or two qualifying Current omissions at least one authoritative minute apart | Clear A11Y-T4-02 or A11Y-T4-05 for the exact matched machine and reevaluate its next state from current evidence. | All elevators restored, route accessible, another machine restored |
| Inventory has no successful accepted refresh for exactly seven days or longer | Use A11Y-T4-04 for route-critical machines dependent on that inventory. | Freshly reviewed, positive availability, accessible now |

**Provisional empty**, **Current**, **Degraded**, and **Unavailable** are internal evidence states, not positive rider-facing equipment claims. A raw empty response never authorizes A11Y-T4-01. The healthy non-empty target-absence branch never clears a prior target outage; the restoration sequence and A11Y-T4-05 continue to control.

### Freshness pattern

The exact pattern is:

**Checked _accepted relative age_ ago**

Every route-critical equipment-status presentation shows this complete visible pattern and announces the same complete pattern and value. For example, when accepted authoritative timestamps and their declared precision support it, both show and announce **Checked 2 min ago**.

The value is computed only from the accepted authoritative source timestamp and governed decision time. Its unit and value cannot be more precise than the source. Do not use device, retrieval, render, retry, cache-write, or inventory-refresh-attempt time, and do not round into a younger or safer-looking age. Use a source-supported less-precise value or interval when necessary; never manufacture whole-second precision.

If the accepted values or their precision cannot support any truthful relative-age value, use this exact visible and assistive fallback:

**Checked time unavailable**

The fallback requires snapshot **Unavailable** and machine A11Y-T4-04 **Unknown**. Silent freshness omission is prohibited for route-critical equipment.

### Estimated-return pattern

When an accepted official source supplies an estimate, the exact pattern is:

**Estimated return: _official estimate_**

The assistive message uses the same complete label and value. The estimate remains adjacent to, but separate from, the exact current equipment state. It is never rendered or announced as a reopening countdown. A planned end, estimate, operator confidence statement, or elapsed time does not prove a current outage, availability, restoration, or accessible path.

### Equipment presentation boundary

- Show and announce the same exact machine state before freshness or estimate context.
- Keep the exact official equipment-identifier scope in the underlying accessibility label or adjacent reviewed context; nearby equipment cannot inherit it.
- Do not rely on green, red, gray, an elevator icon, a map marker, animation, haptics, or tone.
- Do not replace A11Y-T4-05 with A11Y-T4-04 when doing so would hide a last-known adverse outage.
- Do not retain a former positive state after freshness expires; the route-critical machine becomes A11Y-T4-04.
- Do not combine A11Y-T4-01 with Working, Available, accessible, all clear, or equivalent positive wording.
- Do not let one machine's restoration, no-outage result, planned outage, freshness, or estimate describe another machine or the complete path.

## Exact Task 5 impact and warning copy

**Status: Draft — approval evidence Pending; 14 fixtures Not run — Pending**

The [path-impact and reroute playbook](path-impact-and-reroute-playbook.md) supplies the exact impact and first verified alternative. The [underway-warning state matrix](underway-warning-state-matrix.md) supplies decision-point, priority, persistence, Offline, reconnect, and resolution state. This catalog supplies exact visible and assistive wording. Copy cannot create an impact, make a path complete, make an alternative verified, infer a rider position, clear a warning, authorize a push, or turn one-machine restoration into path restoration.

### Exact impact labels

| Catalog ID | Exact visible copy | Exact assistive copy | Authorized trigger | Required consequence |
|---|---|---|---|---|
| A11Y-T5-01 | **Blocking** | **Blocking** | The exact selected path requires an adverse or Unknown connection and no complete, current, verified same-complex chain serves the exact journey scope. | Invalidate the complete selected route and apply the exact alternative order and warning lifecycle. |
| A11Y-T5-02 | **Reroutable within station** | **Reroutable within station** | The selected path requires an adverse or Unknown connection, while another independently complete, current, verified same-complex chain serves the exact journey scope. | Keep the original chain invalid and require explicit rider selection of the verified alternative. |
| A11Y-T5-03 | **Unrelated** | **Unrelated** | The exact machine or connection is not required by the selected origin, transfer, or destination chain. | Preserve the selected path; keep the equipment state scoped to its own connection. |

These labels are exact governed impact names. They do not replace the required plain-language connection, path consequence, freshness, and safe action. Never expose an internal score, confidence value, or machine identifier as rider copy.

### Exact warning patterns

Braced fields are required evidence-backed substitutions. The braces do not appear to riders. Visible and assistive output use the same complete rendered sentence, field values, order, punctuation, scope, and certainty.

| Catalog ID | Exact visible and assistive pattern | Authorized trigger | Field and consequence rules |
|---|---|---|---|
| A11Y-T5-04 | **{Exact connection}: {exact accepted adverse equipment state}. Your selected step-free path is unavailable; choose {first verified alternative}.** | A confirmed adverse required connection invalidates the selected path and a first verified alternative exists, including a redundant same-complex path. | The state must be exact Task 4 adverse copy. The alternative is the first eligible result from the exact tier order and remains unselected until the rider acts. |
| A11Y-T5-05 | **Current status for {exact required connection} is Unknown. Your selected step-free path cannot be verified right now; choose {first verified alternative}.** | A required machine is exact **Unknown** and a first verified alternative exists. | Never replace **Unknown** with out, failed, broken, restored, Working, or Available. |
| A11Y-T5-06 | **{Exact connection}: {exact accepted equipment state}. {Exact selected-path consequence} No verified alternative is available for {exact affected journey scope}. No verified step-free subway route is available right now.** | The selected route is Blocking and no safe verified alternative remains. | The equipment state is an exact Task 4 state. The selected-path consequence is either **Your selected step-free path is unavailable.** for accepted adverse evidence or **Your selected step-free path cannot be verified right now.** for Unknown. The final sentence is exact A11Y-T3-01. |
| A11Y-T5-07 | **Restoration was reported for {exact equipment}. Your complete step-free path is still being rechecked; keep following {exact current verified safe action or warning}.** | Task 4 accepts an explicit, coherent, **Current** official restoration report for one exact machine, but fresh complete-path reevaluation has not passed. | Use only for the explicit-report branch. Do not say the machine operates, path restored, Accessible now, all elevators restored, Working, or Available. The retained action or warning must still be current and verified. |
| A11Y-T5-08 | **Your last accessible decision point cannot be confirmed. {Exact connection}: {exact accepted equipment state}. {Exact selected-path consequence} Review {first verified safe action} now.** | The selected path is invalid and the decision point is Unknown or may already have passed, while a safe verified action exists. | Do not invent position, platform, train, reachable station, point, or deadline. If no verified action exists, use A11Y-T5-06 instead. |
| A11Y-T5-09 | **The prior outage is no longer reported for {exact equipment}. Your complete step-free path is still being rechecked; keep following {exact current verified safe action or warning}.** | Task 4 accepts restoration through two consecutive, coherent, **Current** snapshots that omit the prior outage, are at least one authoritative minute apart, have coherent surrounding population, and both join to current reviewed inventory, but fresh complete-path reevaluation has not passed. | Use only for the qualifying two-omission branch. State accepted absence only; do not say restoration was reported, the machine operates, path restored, Accessible now, all elevators restored, Working, or Available. The retained action or warning must still be current and verified. |

The exact connection field names the accepted connection role and journey scope in plain language. The exact accepted state comes only from Task 4. The first verified alternative or safe action comes only from the playbook's first eligible tier. A field may not be filled from an official suggestion, nearby proximity, equipment presence, previous journey, cached current value, estimated return, or another machine.

### Approved example pattern

The approved visible and assistive example is:

**The street-to-mezzanine elevator at your 74 St entrance is out. Your usual step-free route is unavailable; use 61 St–Woodside instead.**

This sentence is a copy pattern example, not evidence that the named elevator is out, that either station has any current accessibility state, that the alternative is verified, or that a push can be sent. Production wording must use accepted exact connection, state, path-impact, and first-verified-alternative evidence. The phrase **is out** in this example cannot replace exact Task 4 equipment state copy on an operational surface.

### Required composition and priority

Every warning answers:

1. What accepted fact changed?
2. Which exact part of the selected journey is affected?
3. What can the rider safely do?

Use the applicable impact label with one complete warning pattern. Also show and announce Task 4 relative freshness for the affected route-critical state. When a known last accessible decision point exists, name it in separately reviewed context before the safe action. When it is Unknown, use A11Y-T5-08 or, with no verified action, A11Y-T5-06.

The warning and action appear first visually and in assistive reading order. Do not rely on color, icon, map position, animation, haptics, or tone. Do not announce lower-priority refresh content before the warning.

### Reuse of exact Task 3 and Task 4 copy

- Use exact **Accessibility not confirmed** only for a disclosed official alternative that lacks complete review; it remains excluded from Accessible Route Only.
- Preserve exact **Out of service—status being rechecked** while a prior adverse outage lacks qualifying restoration.
- Preserve exact **No verified step-free subway route is available right now.** when no eligible subway route remains.
- Preserve exact **Unknown** without calling it an outage.
- Machine freshness uses exact **Checked _accepted relative age_ ago** or the governed **Checked time unavailable** fallback.

Acknowledgement, dismissal, time passage, navigation, foregrounding, Offline, reconnect, manual progress, lower-priority recovery, unrelated refresh, planned end, estimate, or one-machine restoration never authorizes weaker or cleared copy.

### Scenario-39 handoff copy boundary

Task 5 may supply the exact accessibility impact, connection, path consequence, freshness, and first verified alternative to the Commute workstream. It does not own or approve push eligibility, commute-window relevance, permission, timing, persistence thresholds, deduplication, escalation, recovery notification, delivery, or pilot behavior. None of the patterns above means that a notification was created, sent, delivered, announced, reviewed, or approved.

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

## Task 4 fixture traceability

The detailed synthetic inputs and required execution records are in the [equipment-status acceptance table](equipment-status-acceptance-table.md). This catalog records the copy consequence without converting an expected phrase into observed evidence.

| Fixture | Copy consequence under review | Current state |
|---|---|---|
| EQ-01 | At exactly five minutes, use only the exact machine state supported after every Current check; never strengthen Current into Working or accessible. | **Not run — Pending** |
| EQ-02 | Just over five minutes, affected route-critical equipment uses A11Y-T4-04 or preserves applicable A11Y-T4-05; no positive state. | **Not run — Pending** |
| EQ-03 | At exactly fifteen minutes, affected route-critical equipment uses A11Y-T4-04 or preserves applicable A11Y-T4-05; do not label the snapshot Unavailable solely by age. | **Not run — Pending** |
| EQ-04 | Just over fifteen minutes, affected route-critical equipment uses A11Y-T4-04 or preserves applicable A11Y-T4-05; no positive state. | **Not run — Pending** |
| EQ-05 | First Current coherent zero-outage snapshot remains internal Provisional empty and uses A11Y-T4-04, never A11Y-T4-01. | **Not run — Pending** |
| EQ-06 | A second zero-outage snapshot at 59 seconds cannot authorize A11Y-T4-01; the qualifying 60-second branch may. | **Not run — Pending** |
| EQ-07 | A 51% unexplained outage disappearance cannot produce restoration, availability, or A11Y-T4-01. | **Not run — Pending** |
| EQ-08 | An 11% malformed, duplicated, or unmatched population uses A11Y-T4-04 for the affected route-critical machine. | **Not run — Pending** |
| EQ-09 | Six-day inventory records a daily-review breach without inventing freshness or applying the seven-day cutoff solely by age. | **Not run — Pending** |
| EQ-10 | At exactly seven days and beyond, affected route-critical equipment uses A11Y-T4-04 and no accessible-now wording. | **Not run — Pending** |
| EQ-11 | One omission of a prior outage uses A11Y-T4-05 visibly and assistively. | **Not run — Pending** |
| EQ-12 | Qualifying restoration clears the adverse state for the exact matched machine only; no all-equipment or complete-path claim. | **Not run — Pending** |
| EQ-13 | A healthy accepted Current non-empty complete same-scope snapshot with valid other-ID outages and no target-ID outage may use A11Y-T4-01 for that exact target only when current inventory covers it, no prior target outage awaits restoration, and no veto applies. | **Not run — Pending** |

## Task 5 fixture traceability

The detailed synthetic impact records IMP-01 through IMP-07 are in the [path-impact and reroute playbook](path-impact-and-reroute-playbook.md). IMP-08 through IMP-14 are in the [underway-warning state matrix](underway-warning-state-matrix.md). This catalog records the expected copy consequence without converting it into an observed result.

| Fixture | Copy consequence under review | Current state |
|---|---|---|
| IMP-01 | Use A11Y-T5-03 for the exact unrelated connection; preserve the selected path and avoid complex-wide overstatement. | **Not run — Pending** |
| IMP-02 | Use A11Y-T5-02 and A11Y-T5-04 with the first verified same-complex path; require explicit selection. | **Not run — Pending** |
| IMP-03 | Use A11Y-T5-01 and the applicable verified-action or no-alternative pattern; invalidate the selected route. | **Not run — Pending** |
| IMP-04 | Scope impact wording to the exact wheelchair or Avoid stairs path; never describe an escalator as an elevator substitute. | **Not run — Pending** |
| IMP-05 | Copy exposes only the first verified tier-1 action initially; no later-tier or bus wording overtakes it. | **Not run — Pending** |
| IMP-06 | Use exact A11Y-T3-03 **Accessibility not confirmed** and do not direct the rider to the official alternative. | **Not run — Pending** |
| IMP-07 | Use verified-action wording only for the fully passing ride-past-and-return branch; no positive wording for the Unknown-edge branch. | **Not run — Pending** |
| IMP-08 | Before departure, use A11Y-T5-01 plus the exact connection, path consequence, freshness, and first verified action. | **Not run — Pending** |
| IMP-09 | Underway, present identical visible and assistive warning before the known last accessible decision point. | **Not run — Pending** |
| IMP-10 | Use A11Y-T5-08 immediately; invent no rider position or decision point. | **Not run — Pending** |
| IMP-11 | Use A11Y-T5-06 and preserve exact A11Y-T3-01; provide no inaccessible, unverified, or automatic bus action. | **Not run — Pending** |
| IMP-12 | Use A11Y-T5-05; preserve exact **Unknown** and never call the machine out, failed, or broken. | **Not run — Pending** |
| IMP-13 | Use A11Y-T5-07 only for accepted explicit-report evidence and A11Y-T5-09 only for accepted two-omission evidence while the complete path is rechecked; neither one-machine branch proves operation or path restoration. | **Not run — Pending** |
| IMP-14 | Preserve warning wording across every listed lifecycle transition; reconnect warning reads first and the Commute handoff claims no push. | **Not run — Pending** |

## Ownership and downstream use

| Copy decision | Authoritative owner | Catalog boundary |
|---|---|---|
| Exact no-verified-subway, offline structural, and unverified-official-alternative phrases | This catalog, subject to mandatory review | Own only A11Y-T3-01 through A11Y-T3-03 and their evidence scopes. |
| Hard-constraint and route-state trigger | Accessible Route Only state matrix | Consume its decision; copy cannot change it. |
| Exact equipment state phrases, freshness and estimated-return patterns, and response-state presentation | This catalog, subject to the equipment status policy and mandatory review | Own A11Y-T4-01 through A11Y-T4-05 and the two cataloged patterns; Draft approval evidence and all 13 fixture results remain **Pending**. |
| Equipment freshness, anomaly, inventory, empty-response, and restoration trigger | Equipment status policy | Consume its exact-machine decision; copy cannot make evidence valid or clear an adverse state. |
| Exact impact labels, warning patterns, decision-point treatment, and retained warning copy | This catalog, subject to the Task 5 impact and warning artifacts and mandatory review | Own A11Y-T5-01 through A11Y-T5-09 and the approved example pattern; Draft approval and all 14 fixture results remain **Pending**. |
| Impact class, alternative order, and first verified action | Path-impact and reroute playbook | Consume its decision; copy cannot classify an impact or verify an action. |
| Decision point, priority, persistence, Offline, reconnect, and resolution | Underway-warning state matrix consuming Nearby/offline | Consume its state; copy cannot clear or reorder a warning. |
| Commute push behavior | Commute workstream | Task 5 supplies an accessibility-impact handoff only; every push decision remains Pending. |
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
- [ ] A11Y-T4-01 through A11Y-T4-05 are exact and appear only for their equipment-policy triggers.
- [ ] The first Current coherent zero-outage response remains Provisional empty and uses A11Y-T4-04, not A11Y-T4-01.
- [ ] A healthy accepted Current non-empty complete same-scope snapshot may use A11Y-T4-01 for the exact absent target only with valid other-ID outages, current inventory coverage, no prior target outage awaiting restoration, and no veto.
- [ ] A globally empty response still requires two qualifying Current snapshots at least one authoritative minute apart before A11Y-T4-01.
- [ ] A prior target outage never uses the non-empty absence branch to bypass A11Y-T4-05 or the restoration sequence.
- [ ] A11Y-T4-01 never becomes Working, Available, observed operation, or a complete-path claim.
- [ ] A11Y-T4-05 preserves the last-known adverse state until qualifying restoration for the exact machine.
- [ ] Degraded, Unavailable, malformed, incomplete, unjoinable, anomalous, inventory-cutoff, and insufficient evidence never produce positive equipment copy.
- [ ] Every route-critical status uses **Checked _accepted relative age_ ago** from accepted authoritative time without false precision, or **Checked time unavailable** with an Unavailable and Unknown decision.
- [ ] Estimated return is explicitly labeled with **Estimated return: _official estimate_** and never presented as a reopening countdown.
- [ ] Task 4 visible and assistive equipment outputs carry equivalent machine scope, age, state, and certainty without color-only treatment.
- [ ] A11Y-T5-01 through A11Y-T5-03 appear only for their exact mutually exclusive path-impact decisions.
- [ ] A11Y-T5-04 uses an accepted adverse state and the first verified alternative without auto-selection.
- [ ] A11Y-T5-05 preserves exact **Unknown** and never calls the machine out, failed, broken, restored, Working, or Available.
- [ ] A11Y-T5-06 preserves exact A11Y-T3-01 and supplies no inaccessible, unverified, or automatic bus action.
- [ ] A11Y-T5-07 appears only for an accepted explicit, coherent, Current official restoration report and treats it as a continuing complete-path recheck, never machine operation or path restoration.
- [ ] A11Y-T5-08 warns immediately without inventing rider position or a decision point.
- [ ] A11Y-T5-09 appears only for accepted qualifying two-omission evidence, states only that the prior outage is no longer reported, and never says restoration was reported or implies machine operation or path restoration.
- [ ] Every rendered Task 5 field comes from accepted exact connection, equipment-state, path-impact, decision-point, freshness, and first-verified-action evidence.
- [ ] The named-station example remains an example only and never becomes evidence about either station.
- [ ] Task 5 warnings answer what changed, which exact journey part is affected, and what the rider can safely do.
- [ ] Warning and action appear first visually and assistively and persist under the warning matrix.
- [ ] Scenario-39 handoff copy claims no push eligibility, creation, delivery, or approval.
- [ ] All 16 Task 3 fixtures remain **Not run — Pending** until fixed evidence is recorded.
- [ ] All 13 Task 4 fixtures remain **Not run — Pending** until fixed reviewed build, artifact, output, reviewer, date, and durable evidence records exist.
- [ ] All 14 Task 5 fixtures remain **Not run — Pending** until fixed reviewed product and artifact versions, outputs, reviewers, dates, durable evidence, corrections, and reruns exist.
- [ ] No real accessibility, equipment, outage, restoration, path impact, decision point, warning, notification, observed result, production cadence, threshold calibration, approval, Gate 0 passage, or release evidence is claimed.

Every unchecked required item blocks copy approval. Content review cannot approve Task 5 operational warning copy unless Product, Accessibility, Data Quality, and Operations approve the same fixed evidence scope and every blocking scenario passes.
