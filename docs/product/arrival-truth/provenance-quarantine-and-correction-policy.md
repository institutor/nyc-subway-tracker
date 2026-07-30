# Provenance, quarantine, and correction policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §27; arrival-truth and service-changes plan Task 11 `Artifacts` and `Ordered steps` |
| Owner | Data Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](../quality/quarantine-recovery-review-cases.md) |

## Purpose and authority

This policy owns the evidence trail for arrival-truth decisions, reversible isolation of suspect records, and the boundary of an authorized operational correction. It does not change arrival admission, source precedence, feed health, confidence, suppression, recovery, service-change, or fallback rules. Those decisions remain with their narrower owner artifacts.

The [core arrival contract](core-arrival-contract.md) owns positive live-arrival eligibility. The [source role and precedence matrix](source-role-and-precedence-matrix.md) and [evidence veto catalog](evidence-veto-catalog.md) own evidence order and vetoes. The [route-level feed health policy](feed-health-policy.md), [time and train continuity policy](time-and-train-continuity-policy.md), [arrival confidence and ghost policy](arrival-confidence-and-ghost-policy.md), [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md), [service-change impact and resolution policy](service-change-impact-and-resolution-policy.md), [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md), and [schedule fallback and currency policy](schedule-fallback-and-currency-policy.md) retain their named boundaries.

Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). Public wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. Its review cases remain **Pending — Truth Gate** and its expected outcomes are not approved scenario results.

## Evidence-trail invariant

Every evaluated rider claim receives one reproducible decision record, whether the result is shown, withheld, suppressed, unavailable, scheduled, or no estimate. The record must let a later reviewer reconstruct the decision from evidence that existed at the decision time; a later outcome may evaluate that decision but may not rewrite its original evidence.

At minimum, every record retains all six provenance elements required by the approved specification:

1. source type;
2. source timestamp;
3. effective period;
4. exact route, station, direction, trip, train, segment, stop, track, or other claim scope;
5. transformation into the displayed or withheld state; and
6. the reason for suppression, unavailability, quarantine, or no estimate when applicable.

Missing provenance does not become positive evidence. If a required source time, scope, or transformation cannot be reconstructed, the stronger public claim remains absent and the gap is recorded for review.

## Required decision envelope

Retain one decision envelope for each candidate and exact directional-stop claim. Board-level explanations receive their own envelope linked to the candidate decisions that caused the board state.

| Evidence-trail field | Required content | Review purpose |
|---|---|---|
| Decision identity | Stable decision reference, authoritative evaluation time, fixed product-policy version, and prior decision link when this is a transition. | Distinguishes one decision from a later reevaluation without using rider identity. |
| Claim type and exact scope | Positive live-arrival, Expected, Holding, confirmed-pattern Uncertain, suppression, arrival claim unavailable, schedule fallback, no estimate, guidance unavailable, or board-level gap; exact route, station complex, constituent station, directional stop, normalized direction, destination, train instance, service date, segment, and track/path scope as applicable. | Prevents evidence for one station, direction, route, train, or segment from being widened to another. |
| Source type | Fresh subway GTFS-RT, supplemented GTFS, regular GTFS, service alert, validity/freshness evidence, authorized correction, or other source class already registered by the [source evidence register](source-evidence-register.md). | Shows the claim authority and limits of each input. |
| Source time and acceptance | Source timestamp, first and latest retrieval when relevant, authoritative comparison time, age, freshness or currency state, decoding/completeness result, and timestamp acceptance or quarantine reason. | Proves that stale, future, regressed, malformed, or otherwise inadmissible evidence did not become current. |
| Effective period | Start and end when supplied, operating service date, supplemented-edition coverage, early-display versus active-operation state, and the exact instant used for the decision. | Prevents future, expired, or out-of-coverage evidence from changing current service. |
| Source-supported scope | Structured route, exact station or segment, normalized direction, train or trip, ordered remaining stops, destination, track, and original official alert text; identify missing or contradictory dimensions explicitly. | Localizes both positive evidence and negative risk. |
| Validity and quarantine result | Accepted, rejected, or quarantined for each input; trigger class; affected evidence unit; first observation; related records; and whether it is prohibited from candidate generation, admission, ordering, fallback selection, guidance, positive correction authority, or recovery. | Demonstrates that suspect records did not influence the primary board or manufacture positive evidence. |
| Transformation trace | Candidate generation, exact-stop match, destination/direction normalization, source precedence, every admission gate, service-change and track reconciliation, confidence state, suppression or fallback decision, ordering inputs, and final board placement. | Reconstructs how source evidence became a rider state without a hidden assumption. |
| Negative evidence and defeated claim | Every current veto or material unresolved risk, its scope, the positive prediction or schedule it defeated, and the row-specific release prerequisite. | Proves that negative evidence was applied before positive prediction. |
| Final disposition and reason | Internal grace, quarantine, suppressed, unavailable, admitted Live, admitted Expected, secondary Holding or Uncertain, Scheduled, or no estimate; primary eligibility; precision; reason; and any dependent guidance consequence. | Keeps internal control state separate from public presentation. |
| Rider presentation | Exact route, direction, destination, time treatment, state, freshness, localized service-change explanation, board-level gap message, and assistive-reading equivalent actually shown—or an explicit record that no train row was shown. | Lets review compare evidence strength with the public claim. |
| Recovery and correction links | Adverse evidence, row-specific release prerequisite, both qualifying updates where governed, correction authority and before/after state, and the later decision that superseded this one. | Makes isolation and corrections reversible without erasing history. |

### Outcome-specific minimums

| Public or withheld outcome | Evidence that must be traceable in addition to the common envelope |
|---|---|
| Live or Expected primary row | Fresh accepted positive source, all admission gates, every veto check, arrival range or estimate, ordering after admission, and primary position. |
| Holding or confirmed-pattern Uncertain context | Last accepted movement or stop progress, movement age, Due episode when applicable, confirmed exact stop and track/path, frozen or removed precision, and exclusion from the next-three count. |
| Suppressed row | Exact failed gate or resolved hard veto, defeated positive claim, supported scope, rider explanation if any, and the governing release prerequisite. |
| Arrival claim unavailable | Independent current high-impact evidence, the material scope uncertainty, original official message, exact scope withheld, and proof that neither a resolved bypass nor unrelated suppression was invented. Generic **Affected** metadata alone is insufficient. |
| Scheduled fallback | Feed-group **Unavailable** decision, selected schedule edition and source order, currency anchor and state, operating service date and coverage, every current veto, any hard-suppression carryover, scheduled clock-time presentation, and persistent **Live data unavailable**. |
| No estimate | Every source evaluated, its ineligibility or veto reason, and the public unavailable state; absence of an estimate cannot be recorded as normal service. |
| Fewer-than-three board explanation | Candidate decisions that produced the gap and the evidence that authorized the exact limitation, service-change, or live-horizon message. A gap message cannot authorize a replacement row. |

## Rider-visible evidence, internal provenance

The rider sees only the plain-language state and freshness needed to make a transit decision:

- route, rider-recognizable direction, actual destination, and exact station context;
- supported countdown, Expected range, frozen Holding evidence, **Arrival uncertain**, or scheduled clock time;
- **Live data updating**, **Live data unavailable**, schedule currency and retrieval age when governed, or the narrowest supported service-change consequence; and
- a clear absence of the train row when stop service is not supported.

Do not expose raw trip or train identifiers, source field names, stop suffixes, numeric direction codes, internal confidence scores, quarantine classes, correction actor identities, or internal reason codes. Internal provenance remains available to authorized support, Data Quality, Product, Operations, and release review. A plain-language summary must not claim more certainty or broader scope than the internal evidence.

## Quarantine boundary

Quarantine is reversible isolation of a suspect evidence unit. It is not a rider-facing state, a weaker form of admission, proof of cancellation, or permission to retain an old row.

Before candidate generation, board admission, ordering, fallback selection, dependent guidance, or correction is decided:

1. evaluate validity, chronology, identity, scope, and snapshot coherence;
2. isolate every record or snapshot that meets a trigger below;
3. preserve the last independently accepted evidence only under its governing frozen, unavailable, suppression, or secondary-context rule;
4. prohibit the suspect evidence from creating, retaining, ranking, relabeling, or restoring a primary row; and
5. record the trigger, affected scope, defeated or withheld claim, rider consequence, and recovery evidence required.

A quarantined record cannot contribute a time, stop, destination, direction, identity join, alert clearance, schedule edition, ordering position, positive correction authority, recovery count, or proof of normal service. It also cannot fill an empty next-three slot. It may prompt conservative isolation or review, but any correction still requires its own accepted evidence and cannot create a positive claim. Independently coherent records outside its exact scope remain eligible under their own evidence.

## Deterministic quarantine triggers and release

| Trigger class | Deterministic entry decision | Immediate public and board consequence | Evidence-unit release; claim readmission remains separately governed |
|---|---|---|---|
| Malformed timestamp | A required timestamp is unparseable, structurally invalid, absent where the governing source requires it, or cannot be placed on authoritative chronology. | Isolate the affected record or snapshot before freshness, currency, movement, ordering, or fallback use. It supplies no primary row, countdown, Scheduled time, or recovery update. Apply the governing feed, train, alert, or schedule unavailable treatment. | A newer accepted source observation must contain valid authoritative time and resolve chronology. It does not repair or rewrite the old record. Any affected feed or train still completes its governing coherent recovery sequence. |
| Implausible, future, regressed, or contradictory timestamp | The time violates the source-specific chronology rule. A live-feed future time beyond the still-uncalibrated small-skew allowance is ineligible; a supplied supplemented publication time future by **any positive amount** is quarantined under the schedule policy; a regressed or contradictory time is ineligible regardless of plausible content. | Isolate before age classification and do not clamp, normalize, substitute retrieval time, reverse chronology, or accept the record because its prediction looks plausible. | Require newer, source-supported, non-regressed, non-contradictory chronology. Exact age zero is valid only where the schedule policy permits it. The small-skew allowance remains nonnumeric until approved calibration and cannot be used to manufacture schedule currency. |
| Stop-order regression | An accepted train sequence moves backward impossibly relative to accepted progress. The first independent regression enters quarantine; a second independently accepted coherent confirmation invokes the Task 9 hard-suppression rule. A replay is not confirmation. | Remove exact precision and primary eligibility on the first regression. After confirmation two, keep the claim hard-suppressed. Do not let a plausible ETA override impossible order. | A later plausible coherent order begins recovery review only. Require the full two-update train recovery, all five conditions, and every Live gate before a primary row or exact countdown returns. |
| Duplicate identities | Two or more records could represent the same train without an exclusive one-to-one continuity match, or one record duplicates a stronger coherent instance. | For ambiguity, quarantine the weaker candidate, or all plausible candidates when none is independently stronger; show neither as proven separate. When one-to-one evidence confidently identifies a weaker duplicate, hard-suppress that weaker record and evaluate the stronger record independently. | Establish genuinely separate coherent train instances or an exclusive one-to-one identity across fresh accepted evidence. Any candidate that lost public precision completes the governing two-update recovery before Live readmission. |
| Impossible direction change | The same proposed train instance changes normalized direction in a way that conflicts with its ordered remaining stops, destination, service date, or accepted progress and cannot be explained by a coherent supported operating pattern. | Quarantine the affected identity; remove it from primary admission and next-three ordering. Do not relabel direction, destination, or route from the contradictory record. | Require fresh accepted evidence that establishes one stable identity, normalized direction, destination, and plausible ordered pattern. If public precision was lost, complete the governing two-update recovery pair before Live readmission. A never-admitted candidate still must pass the one-to-one identity and every admission gate. A legitimate terminal or operational reversal must be positively supported; it is not inferred from the contradiction. |
| Track conflict | An explicit actual-versus-scheduled-track conflict outside normal terminal behavior makes the target or downstream path unreliable. | Quarantine the train internally for the affected downstream claims and hard-suppress those arrivals and dependent guidance. Preserve unrelated trains. Do not show Uncertain, a Scheduled replacement, or **Check station signs** for the invalidated claim. | The first later fresh coherent update may reestablish a trustworthy path but restores nothing. A second consecutive qualifying update must preserve that path, prove all five Task 9 conditions across the pair, and leave every Live gate passing. |
| Suspiciously empty snapshot | A complete-looking snapshot has an empty or implausibly empty population without reliable operational evidence, including contextual bulk-loss evidence under the feed-health policy. | Quarantine the snapshot from positive decisions; do not clear the board as mass cancellation or normal service. Preserve only the prior coherent frozen context with **Live data updating** as governed, and keep healthy unrelated groups live. | Require two consecutive fresh, complete, valid, non-regressed, credibly populated coherent snapshots for that route/feed group. Only then reevaluate individual trains; no prior row returns automatically. |
| Contradictory alert scope | Structured route, station or segment, direction, active period, impact, or official text conflict so the record cannot support one reliable scope or consequence. | Quarantine that alert record from proving a specific bypass, clearance, or normal service. Preserve any independently supported veto. Only independent current high-impact evidence plus material scope uncertainty may make the narrow affected claim unavailable; contradiction or generic **Affected** alone cannot. | Require newer current alert evidence whose structured scope and official text are coherent for the claim. Clearing the alert-record quarantine does not create movement, a stop call, or readmit a suppressed train; apply every row-specific and catalog-wide release gate. |

### Coherent-evidence-only recovery

Manual confidence, a support note, an ended alert, a schedule, a corrected label, the rider's report, or a new prediction cannot release quarantine by itself. Release requires source-supported evidence that directly resolves the trigger, is newer than the adverse evidence, is fresh and accepted under the owning policy, and introduces no new contradiction or veto.

Two distinct decisions must be recorded:

1. **Evidence-unit release:** the newer record or snapshot is no longer suspect for the trigger that caused quarantine.
2. **Public-claim readmission:** the train, Scheduled claim, or guidance separately passes all current source, freshness, admission, service-change, track, suppression-recovery, and presentation gates.

Evidence-unit release never automatically performs claim readmission. Where Tasks 4, 7, 9, or 10 require two coherent observations, the first qualifying observation restores nothing. Nonconsecutive, stale, malformed, anomalous, regressed, incomplete, or contradictory evidence breaks confirmation. Static data and corrections never count as live recovery updates.

## Correction policy

An authorized correction is a scoped, reviewable operational decision applied on top of source interpretation. It may reduce an unsupported claim or make supported scope clearer. It cannot become a source of live evidence.

Before a correction takes effect, retain its decision identity, authorized role, decision time, evidence available at that time, exact claim and scope, correction class, before-and-after transformation, rider consequence, effective period or release condition, and independent evidence required for reversal. A correction remains separate from the original source record; neither history is overwritten.

### Permitted corrections

| Permitted correction | Allowed effect | Evidence and scope boundary |
|---|---|---|
| Suppress a known bad arrival | Remove the affected arrival, exact countdown, primary slot, and dependent guidance. | Name the exact train or stop claim and the authoritative or reproducible defect. It cannot widen beyond supported scope or declare cancellation without cancellation evidence. |
| Clarify an alert's affected segment | Narrow or accurately express a supported route, station or segment, direction, active period, and rider consequence. | Preserve the original official text and structured evidence. Clarification cannot invent a bypass, station, direction, or path, nor convert generic **Affected** into a specific impact. |
| Mark platform guidance unavailable | Remove front/middle/back, platform, exit, or transfer guidance when direction, platform, orientation, geometry, or operating path is unresolved. | It changes guidance only. It cannot suppress or create a train arrival unless the separate arrival gates independently require that result. |
| Correct geometry or accessibility relationships | Repair a verified relationship between an entrance, constituent station, passage, platform, equipment chain, exit, or guidance record. | Preserve verification evidence, prior relationship, affected paths, and dependent claims. It cannot declare equipment operational or a route accessible now without current authoritative evidence. |

### Forbidden corrections

No correction may:

- fabricate movement or stop progress;
- add an unsupported train, stop call, arrival, countdown, Scheduled departure, direction, destination, platform, or track assignment;
- declare an elevator or escalator operational without authoritative evidence;
- make a quarantined record eligible, count it as a recovery update, or manufacture one of the five recovery conditions;
- replace a missing or unusable source timestamp with a convenient value;
- clear a bypass, suspension, closure, planned-pattern exclusion, unresolved reroute, track conflict, or hard-suppression carryover without the governing evidence; or
- rewrite the original decision record to hide a failure, correction, or rerun.

### Correction precedence and reversal

Apply a permitted correction only after validity and negative-evidence checks. It may make the result more conservative or make already-supported scope more precise; it cannot override a source veto or supply positive authority that the source hierarchy withholds.

A correction ends only when its recorded effective period ends and coherent authoritative evidence supports reversal. Reversal creates a new linked decision; it does not delete the original correction. If the correction removed public precision or primary eligibility, the claim completes the same governing recovery and admission path as any other affected claim. A correction cannot be used to skip the first recovery update, accept static evidence as movement, or restore Expected through Task 9.

## Review, calibration, and privacy boundary

Use the [arrival-truth decision review template](../quality/arrival-truth-decision-review-template.md) to examine why a train was shown or hidden, later stop progress, Holding duration, alert over- or under-suppression, correction effects, and recovery evidence. Use the [quarantine and recovery review cases](../quality/quarantine-recovery-review-cases.md) to prove every trigger and correction boundary. The [arrival-truth risk register](../quality/arrival-truth-risk-register.md) owns the five MTA-data risks and their evidence obligations.

Threshold review may compare non-personal operational decisions by route, station, normalized direction, terminal versus non-terminal context, and operating period. Do not attach review records to rider accounts, saved commutes, notification tokens, device identifiers, precise rider locations, searches, or personal rider history. A later rider outcome can reveal a quality error; it cannot retroactively manufacture evidence that was absent when the original decision was made.

## Required review decision

A reviewer must be able to answer all of the following from durable evidence:

1. What exact claim and scope were evaluated?
2. Which source types, timestamps, effective periods, and records were accepted, rejected, or quarantined?
3. Which transformation and precedence decisions produced the shown, hidden, suppressed, unavailable, scheduled, or no-estimate outcome?
4. Did any suspect record influence candidate generation, admission, ordering, fallback selection, correction, recovery, or the primary board?
5. What did the rider see, including freshness and localized consequence?
6. What coherent evidence released the evidence unit, and what separate evidence readmitted the public claim?
7. Did any correction reduce or clarify an unsupported claim without manufacturing positive evidence?

Any **Yes** answer to question 4, any correction-created positive evidence, or any unreconstructable required provenance is a blocking failure for this artifact's Truth Gate review.
