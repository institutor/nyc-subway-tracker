# Arrival-truth risk register

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§27 and 33.1; arrival-truth and service-changes plan Task 11 `Artifacts` and `Ordered steps` |
| Owner | Data Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

This register records the five MTA-data limitations in approved specification Section 33.1, the artifact that owns each response, the conservative control, observable failure signals, and the evidence required for review. It creates no source meaning, threshold, admission rule, correction authority, or release exception.

The approved specification supplies the controlling responses: require positive live stop evidence, let current negative evidence veto, fail closed on high-impact ambiguity, expose state and freshness, and maintain quality review with conservative correction tools. The artifacts linked below apply those responses but remain **Draft** until the Truth Gate approves them. Calling a response “approved” in this register refers to the approved specification principle, not to approval of a Draft downstream artifact.

Risk review follows the [provenance, quarantine, and correction policy](../arrival-truth/provenance-quarantine-and-correction-policy.md) and uses the [arrival-truth decision review template](arrival-truth-decision-review-template.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

## Risk states and action rule

| Risk state | Meaning |
|---|---|
| **Open — Truth Gate evidence pending** | The limitation is known and a conservative response is specified, but the linked observed scenario evidence has not passed the Truth Gate. |
| **Controlled — monitored** | The fixed reviewed controls and all required cases passed, with no open release-blocking failure. The limitation still exists and its signals remain under review. |
| **Escalated — blocking failure** | An observable signal shows an unsupported positive claim, a train shown at a bypassed or materially unresolved stop, suspect evidence influencing a primary board, or another unresolved release-blocking control failure. |

All five risks begin **Open — Truth Gate evidence pending**. A passing scenario does not retire the underlying data limitation. Any new source revision, new alert semantics, material recurring signal, false bypass, or conservative-truth weakening returns affected artifacts to the review path in the [review and approval policy](../review-and-approval-policy.md).

## Risk ownership summary

| Risk ID | Section 33.1 limitation | Primary owner artifact | Artifact owner | Current risk state |
|---|---|---|---|---|
| ATR-01 | Supplemented schedules include most, not all, temporary changes. | [Schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) | Product Truth Lead | Open — Truth Gate evidence pending |
| ATR-02 | Station-level alert metadata is optional. | [Service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md) | Product Truth Lead | Open — Truth Gate evidence pending |
| ATR-03 | Alert categories and text can evolve. | [Source evidence register](../arrival-truth/source-evidence-register.md) | Data Quality Lead | Open — Truth Gate evidence pending |
| ATR-04 | Real-time trip identifiers do not always match static identifiers. | [Time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md) | Product Truth Lead | Open — Truth Gate evidence pending |
| ATR-05 | Reroutes may occur between snapshots. | [Reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md) | Product Truth Lead | Open — Truth Gate evidence pending |

The owner artifact owns the product decision; the Data Quality Lead owns this risk record, signal review, and evidence completeness. Operations supplies observed operational review, and Product decides any proposed policy change through the mandatory review path.

## ATR-01 — Supplemented-schedule incompleteness

### Limitation and rider harm

Supplemented GTFS contains most, not all, temporary changes. Treating it as a complete statement of current service can show a scheduled train at a stop removed by a change, restore a missing live stop, or imply normal service during an outage.

### Approved conservative response and owning controls

The approved response is to require positive live stop evidence for a live claim, let current negative evidence veto, fail closed on unresolved high-impact change, and expose schedule state and freshness.

The [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) applies that response by:

- entering fallback only when the exact relevant route/feed group is **Unavailable**;
- establishing a usable supplemented coverage mask independently of occurrence presence and making it the sole positive schedule source inside that scope without treating it as complete or live;
- keeping every current veto and hard-suppression release carryover in force;
- showing a scheduled New York clock time, currency, service date, and persistent **Live data unavailable**;
- never using a schedule to repair a missing train or stop in a healthy replacement period; and
- proceeding to regular GTFS only when no usable supplemented mask applies, otherwise withholding an omitted covered occurrence without unsupported cancellation language, while never implying that schedule coverage proves normal service.

Supporting ownership remains with the [source role and precedence matrix](../arrival-truth/source-role-and-precedence-matrix.md), [evidence veto catalog](../arrival-truth/evidence-veto-catalog.md), and [source evidence register](../arrival-truth/source-evidence-register.md).

### Observable failure signals

- A current live sequence or scoped official change shows a temporary pattern absent from the applicable supplemented edition.
- An applicable alert, bypass, short turn, suspension, closure, or reroute conflicts with a supplemented departure or stop.
- A fallback board shows a supplemented departure that lacks effective/service-date coverage, uses a superseded or timestamp-quarantined edition, or hides older currency behind a fresh retrieval.
- A static trip appears because one train or stop was missing from a healthy real-time snapshot.
- A previously hard-suppressed claim returns as Scheduled while the feed is Unavailable and the two-update live recovery gate cannot be satisfied.
- A rider-facing fallback row uses a countdown, Live, Expected, **on time**, or normal-looking next-three treatment.

### Required review evidence

- [Schedule currency boundary cases](../arrival-truth/schedule-currency-boundary-cases.md): S1, Scenario 19, S3–S5, Scenario 20, S17, S18, Scenarios 43–44 and 49, and timestamp/currency boundary cases.
- [Reroute, short-turn, and bypass cases](../arrival-truth/reroute-short-turn-and-bypass-cases.md): changed-pattern and contradicted-stop runs proving that schedule evidence cannot restore a stop.
- A completed [decision review template](arrival-truth-decision-review-template.md) for every sampled fallback conflict, recording source selection, edition identity, currency, vetoes, public copy, and any later stop outcome.
- Signal disposition showing correction and rerun while preserving the original failure.

### Escalation and exit evidence

Any fallback arrival shown at a resolved or materially unresolved bypassed stop is an **Escalated — blocking failure**. Controlled status requires every named case to pass for one fixed reviewed version, full source/edition provenance, and no unresolved signal that static data overrode negative or missing live evidence.

## ATR-02 — Optional station-level alert scope

### Limitation and rider harm

Station and direction metadata may be absent even for material changes. Absence can neither prove that a station is unaffected nor identify a specific bypass. Unsafe widening can hide unrelated service; unsafe narrowing can show a train that will skip the rider.

### Approved conservative response and owning controls

The approved response is to let negative evidence veto and fail closed on high-impact ambiguity while localizing the consequence.

The [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md) applies that response by:

- jointly resolving active time, route, station or segment, normalized direction, train, and rider consequence;
- withholding only the materially unresolved claim when independent current high-impact evidence exists and scope uncertainty affects that claim;
- distinguishing resolved suppression from arrival claim unavailable;
- preserving the original official message; and
- keeping independent routes, directions, constituent stations, segments, and trains visible.

The [evidence veto catalog](../arrival-truth/evidence-veto-catalog.md) prevents missing scope or generic **Affected** metadata from becoming either a specific bypass or arrival unavailability by itself.

### Observable failure signals

- A high-impact alert is missing station, direction, segment, or train scope needed for an exact-stop decision.
- Structured scope conflicts with official text or maps to more than one materially different consequence.
- A train is shown inside a route-direction or segment whose bypass or reroute risk remained materially unresolved.
- Unrelated opposite-direction, out-of-segment, constituent-station, or shared-complex service is hidden.
- Missing metadata is recorded as proof that a station or direction is unaffected.
- Generic **Affected**, contradiction, or missing metadata alone produces resolved bypass copy or arrival unavailability.

### Required review evidence

- [Service-change scope cases](../arrival-truth/service-change-scope-cases.md): Scenarios 9–12 and S13.
- [Quarantine and recovery review cases](quarantine-recovery-review-cases.md): Q8 contradictory alert scope.
- [Arrival board decision table](../arrival-truth/arrival-board-decision-table.md): active unresolved high-impact scope, bypass contradiction, and localized unaffected-service outcomes.
- Completed alert over- and under-suppression sections in the [decision review template](arrival-truth-decision-review-template.md), including original official text, exact scope, later evidence, and preserved unrelated service.

### Escalation and exit evidence

A positive arrival inside a resolved bypass or a materially unresolved high-impact bypass/reroute scope is **Escalated — blocking failure**. Broad suppression outside supported or unresolved scope is also recorded and corrected, even when conservative. Controlled status requires direct proof that missing metadata created neither an unaffected assumption nor invented specific impact.

## ATR-03 — Evolving alert labels and text

### Limitation and rider harm

Alert categories, field values, and human-readable text can change. Permanent category-to-action mappings can turn a new label into a false bypass, ignore a real service change, or present stronger rider copy than the source supports.

### Approved conservative response and owning controls

The approved response is to expose state and freshness, fail closed only on independently supported high-impact ambiguity, and maintain quality review and conservative correction.

The [source evidence register](../arrival-truth/source-evidence-register.md) applies that response by requiring source-field, publication-cadence, revision-link, and source-semantic revalidation before launch and at every source-version change. The [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md) treats categories as descriptive inputs rather than permanent machine semantics, requires structured scope and official text to agree before a generic label becomes a specific veto, and preserves original official text in details.

The [provenance, quarantine, and correction policy](../arrival-truth/provenance-quarantine-and-correction-policy.md) quarantines contradictory alert scope and permits only evidence-supported segment clarification.

### Observable failure signals

- A new, renamed, removed, or previously unseen alert category or scope value appears.
- Source documentation, field meaning, publication behavior, or revision link changes.
- Structured scope and official text disagree or a shorter summary becomes more specific than the official evidence.
- The same label appears with materially different rider consequences.
- A generic category automatically suppresses, declares a bypass, or creates arrival unavailability without independent high-impact evidence.
- An alert-text edit revives stale, quarantined, or suppressed movement evidence.

### Required review evidence

- A dated [source evidence register](../arrival-truth/source-evidence-register.md) revalidation entry identifying the source revision, observed semantic change, role impact, reviewer, and every artifact returned to Draft.
- [Service-change scope cases](../arrival-truth/service-change-scope-cases.md): Scenario 10 and S13.
- [Quarantine and recovery review cases](quarantine-recovery-review-cases.md): Q8 and P2.
- Completed provenance and alert review in the [decision review template](arrival-truth-decision-review-template.md), comparing original text, structured scope, public summary, disposition, and later evidence.

### Escalation and exit evidence

An evolving label that causes an unsupported positive arrival, invented bypass, or scope widening is **Escalated — blocking failure**. Controlled status requires current source revalidation and passing generic-label, contradiction, and supported-clarification cases against the fixed reviewed semantics.

## ATR-04 — Inconsistent trip identifiers

### Limitation and rider harm

Real-time trip identifiers do not always align with static identifiers and may change during operation. Treating the published identifier as the train can duplicate one train, merge separate trains, preserve a ghost, suppress the wrong record, or restore an unsupported static trip.

### Approved conservative response and owning controls

The approved response is to require positive coherent live evidence, let contradictory identity evidence block a claim, and prefer fewer trustworthy arrivals over a guessed merge.

The [time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md) applies that response by:

- keeping train instance distinct from published trip identifier;
- requiring an exclusive one-to-one match across internal marker when available, route, normalized direction, service date, ordered next stops, track, destination, predicted time, and immediate replacement timing;
- quarantining ambiguous or weaker candidates and never showing ambiguous records as proven separate trains; and
- allowing a stronger candidate only when it independently passes every admission gate.

The [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md) hard-suppresses a confidently weaker duplicate and requires two qualifying updates after public precision loss.

### Observable failure signals

- One train changes published trip identifier while other continuity evidence remains coherent.
- One earlier record maps plausibly to several replacements, several earlier records map to one replacement, or no exclusive match exists.
- Two primary rows share one physical continuity path or one expected train disappears because of an unsupported merge.
- Identity churn, direction change, service-date mismatch, stop-order mismatch, or track/destination conflict is hidden by ETA similarity.
- A static trip is used to restore a live record missing during a healthy replacement period.
- A weaker duplicate consumes a next-three slot or returns after only one update.

### Required review evidence

- [Time and identity acceptance cases](../arrival-truth/time-and-identity-acceptance-cases.md): Scenarios 4 and 5.
- [Suppression and recovery cases](../arrival-truth/suppression-and-recovery-cases.md): duplicate and complete/incomplete recovery cases.
- [Quarantine and recovery review cases](quarantine-recovery-review-cases.md): Q4 duplicate identities and Q5 impossible direction change.
- Completed identity, later-stop-progress, and recovery sections in the [decision review template](arrival-truth-decision-review-template.md), with no raw identifier exposed to riders.

### Escalation and exit evidence

Duplicate primary rows, unsupported merges, or a quarantined identity influencing ordering are **Escalated — blocking failure**. Controlled status requires passing one-to-one, ambiguous, confident-duplicate, direction-conflict, and two-update recovery evidence.

## ATR-05 — Reroutes between snapshots

### Limitation and rider harm

A dispatcher can change a train's path after the latest accepted snapshot. No public claim can guarantee future physical behavior. A countdown that survives a new bypass, removed target, unresolved reroute, or track conflict can send a rider to a train that will not stop.

### Approved conservative response and owning controls

The approved response is to require current exact live stop evidence, let negative evidence veto prediction, fail closed on high-impact ambiguity, and expose state and freshness.

The [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md) applies that response by:

- separating route identity from the current service pattern;
- requiring the exact station-direction in a coherent live sequence plus supporting uncontradicted change evidence for a novel rerouted stop;
- suppressing omitted, bypassed, short-turned, suspended, closed, planned-excluded, or track-invalidated claims;
- making materially unresolved high-impact claims unavailable only in the affected scope; and
- requiring a coherent path across the full two-update recovery before downstream readmission after track conflict.

The [arrival confidence and ghost policy](../arrival-truth/arrival-confidence-and-ghost-policy.md) prevents Holding or Uncertain from concealing stop-pattern uncertainty. The [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md) immediately removes public precision at first healthy disappearance and requires two qualifying updates for recovery.

### Observable failure signals

- The exact target disappears from an ordered remaining-stop sequence after being shown.
- A current bypass, reroute, short turn, suspension, closure, planned-pattern exclusion, or track conflict contradicts a displayed prediction.
- A novel host-line stop appears without both exact-direction live evidence and supporting path evidence.
- A train's service pattern, destination, direction, or actual track changes between accepted snapshots.
- A row remains Holding or Uncertain after exact stop service or track/path becomes materially unresolved.
- A downstream row or guidance returns after only one coherent path update.
- Later accepted evidence shows the train bypassed a target at which it was still publicly shown.

### Required review evidence

- [Reroute, short-turn, and bypass cases](../arrival-truth/reroute-short-turn-and-bypass-cases.md): Scenarios 6–8 and R4–R10.
- [Suppression and recovery cases](../arrival-truth/suppression-and-recovery-cases.md): target removed, resolved bypass, track conflict, and complete/incomplete recovery.
- [Ghost lifecycle boundary cases](../arrival-truth/ghost-lifecycle-boundary-cases.md): stop-pattern or track uncertainty and valid-hold boundaries.
- [Quarantine and recovery review cases](quarantine-recovery-review-cases.md): Q3, Q5, and Q6.
- Completed later stop-progress, Holding-duration, alert over/under-suppression, and recovery sections in the [decision review template](arrival-truth-decision-review-template.md).

### Escalation and exit evidence

Any train shown at a stop that current data identified—or materially left unresolved—as bypassed is **Escalated — blocking failure** and invokes the false-bypass release review. Controlled status requires all reroute, target-removal, path-conflict, stop-pattern-uncertainty, and two-update recovery cases to pass for the fixed reviewed version.

## Cross-risk review and calibration

For each signal:

1. preserve the original decision, source evidence, rider result, failure, correction, and rerun;
2. identify the exact risk ID and owner artifact;
3. use only permitted negative or explanatory corrections;
4. return any weakened or materially changed artifact to Draft under the review policy;
5. rerun every affected direct and integrated acceptance case; and
6. keep the risk Open or Escalated until durable passing evidence resolves the control failure.

Quality calibration may compare operational outcomes by route, station or exact directional stop, normalized direction, terminal versus non-terminal context, and operating period. It may include later stop progress, Holding duration, false removals, missed ghosts, alert over- or under-suppression, and recovery results.

Do not use rider accounts, saved commutes, notification tokens, device identifiers, precise rider locations, searches, or personal rider travel history for these slices. Operational source and train references may be retained only to reproduce the decision. No observed slice silently changes a threshold; any threshold proposal requires Product and Data Quality review and the affected artifacts and cases.

## Truth Gate review record

| Risk ID | Owner artifact reviewed against fixed version | Observable signals reviewed | Required direct and integrated cases attached | Blocking failure open? | Reviewer decisions | Status |
|---|---|---|---|---:|---|---|
| ATR-01 | Pending | Pending | Pending | Pending | Pending | Open — Truth Gate evidence pending |
| ATR-02 | Pending | Pending | Pending | Pending | Pending | Open — Truth Gate evidence pending |
| ATR-03 | Pending | Pending | Pending | Pending | Pending | Open — Truth Gate evidence pending |
| ATR-04 | Pending | Pending | Pending | Pending | Pending | Open — Truth Gate evidence pending |
| ATR-05 | Pending | Pending | Pending | Pending | Pending | Open — Truth Gate evidence pending |

No risk becomes Controlled merely because this register states an expected control. Every row requires observed evidence, all mandatory reviewer decisions, preserved failures and reruns, and no unresolved release-blocking truth error.
