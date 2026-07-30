# Schedule fallback and currency policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§11–12, 31.3 scenarios 19–20, and 31.8 scenarios 43–44 and 49; arrival-truth and service-changes plan Task 10 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

This policy owns entry into schedule fallback, static-source selection, supplemented-edition supersession, schedule currency, and the rider presentation of a fallback arrival. The [route-level feed health policy](feed-health-policy.md) owns whether a relevant real-time route or feed group is **Unavailable**. The [source role and precedence matrix](source-role-and-precedence-matrix.md) owns source roles, the [evidence veto catalog](evidence-veto-catalog.md) owns negative evidence and its catalog-wide release gate, the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md) owns the two-update recovery sequence, and the [time and train continuity policy](time-and-train-continuity-policy.md) owns authoritative comparison time. The [approved transit product glossary](../contracts/transit-product-glossary.md) and [approved rider language rules](../contracts/rider-language-rules.md) continue to govern shared terms and public wording. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. Its linked evidence remains **Pending — Truth Gate** under the [review and approval policy](../review-and-approval-policy.md), so its expected decisions are not approved scenario results.

## Fallback entry gate

Schedule fallback is a separate board state, not a weaker live-arrival state. It may begin only for the exact route or feed group that the feed-health policy has classified **Unavailable**. Every other route or feed group is evaluated independently.

Fallback must not begin for any of these conditions by themselves:

- One expected train is missing from an otherwise healthy complete real-time snapshot.
- One train has stale movement evidence while its route or feed group remains healthy.
- A candidate fails its exact-stop, destination, direction, identity, movement, service-change, or track gate.
- The board has fewer than three admitted Live or Expected trains.
- Another route or feed group is Degraded or Unavailable.

During the published real-time replacement period, a static trip absent from a healthy full snapshot creates no fallback candidate and no cancellation claim. Static data never repairs a missing real-time trip or stop call. A Degraded group remains in its separately governed frozen **Live data updating** treatment unless and until the feed-health policy classifies that group Unavailable and the separately reviewed product state enters fallback.

## Deterministic candidate selection

After the relevant route or feed group is proven Unavailable, apply current negative evidence first and then select a schedule source in this order:

1. Select the newest validated, non-superseded supplemented GTFS edition that covers the trip's operating service date, includes the proposed departure within its effective coverage and horizon, and remains departure-eligible under the currency rules below.
2. If no supplemented edition passes every condition in step 1, evaluate regular GTFS for the same operating service date and proposed departure.
3. If regular GTFS is also unavailable, invalid for that service date, outside its effective coverage, or otherwise unable to support that departure, show no arrival estimate.

“Departure-eligible” means that the edition is validated; has an accepted age anchor and authoritative comparison; is not superseded for the claim within applicable overlapping coverage; covers the operating service date and departure; is inside its effective coverage and horizon; and is either **Current schedule** or **Stale reference**. A **Topology only** or timestamp-quarantined edition is never departure-eligible.

Regular GTFS therefore becomes the next candidate when supplemented GTFS is unavailable; has no validated applicable edition; is expired or outside its effective coverage or horizon; lacks service-date or departure coverage; has unusable timestamp evidence; is superseded for the claim without a newer departure-eligible applicable edition; or is **Topology only**. Within overlapping coverage, the selector does not return to an earlier supplemented edition that a later validated edition superseded. Outside that overlap, an earlier edition may remain the newest eligible supplement for a claim inside its own still-valid coverage. If regular GTFS cannot support the claim, the result is no estimate; the product does not invent service.

## Edition identity and supersession

Retain a distinct currency-edition identity, canonical schedule-content identity, transport and metadata wrapper observations, validation result, supported source version or chronology, publication time when supplied, first successful retrieval time, later successful retrieval observations, effective coverage, service-date coverage, and claim-scoped supersession relationships.

- Normalize the schedule into canonical semantic content before assigning currency-edition identity. Unchanged trips, stop times, service calendars, and effective schedule semantics remain the same currency edition even when a transport wrapper, source label or version wrapper, publication wrapper, filename, compression, or retrieval observation changes. Such wrapper-only changes cannot reset age or create supersession.
- A distinct currency edition requires independently validated changed canonical schedule content plus source-supported edition chronology. Retrieval order alone does not establish distinctness or later order.
- Once a distinct later edition is validated, it supersedes every earlier edition only for claims within their overlapping effective and service-date coverage. This is true even when the earlier edition still lists the same service date or a more optimistic trip; the selector cannot cherry-pick from the earlier edition inside the overlap.
- Supersession is monotonic for claims inside overlapping coverage. A later read failure, missing file, or repeated retrieval of old or wrapper-changed unchanged content cannot silently roll selection back to an earlier superseded edition.
- A later edition does not supersede an earlier edition for a claim outside their overlap. When that claim remains inside the earlier edition's own effective and service-date coverage, the earlier edition may remain the newest eligible supplement if it passes every other gate.
- A failed or unvalidated new edition never supersedes a validated edition and never erases the last validated copy. The retained validated copy continues aging from its original age anchor.
- Repeated retrieval of the same canonical schedule content is another observation of that currency edition, not a new edition. It cannot reset currency or remove supersession even when wrapper or publication metadata differs.
- When editions do not overlap, each remains eligible only within its own supported effective coverage. No coverage, publication time, validity, version order, or service is inferred from retrieval alone.

## Edition age and non-overlapping currency states

Calculate edition age against the authoritative comparison time governed by the time and train continuity policy, never the rider's device clock, phone date, manual setting, display clock, or device time zone. Compare timestamps with only the approved **small skew allowance**. That allowance remains an uncalibrated policy value requiring observed evidence and Product and Data Quality approval; this policy assigns no numeric value.

Use a supplied publication time as the age anchor only when it is source-supported, non-regressed, internally and chronologically non-contradictory, and not impermissibly future relative to authoritative comparison time after the small skew allowance. A negative age never classifies an edition **Current schedule**. When source publication time is genuinely unavailable, use the first successful retrieval time of that distinct validated currency edition. Never invent a publication time. An identical or wrapper-only later retrieval does not change the age anchor. A failed new edition does not change the retained edition's anchor, so its age continues increasing.

If a supplied publication timestamp is impermissibly future beyond the small skew allowance, regressed, or contradictory, quarantine that edition from departure eligibility. Do not silently replace the bad supplied timestamp with the latest retrieval time, call the edition Current, or guess chronology. Continue to regular GTFS or no estimate until the conflict resolves. “Genuinely unavailable” is limited to the absence of a supplied publication timestamp; it does not include a supplied but unusable timestamp.

Only an edition with an accepted age anchor and authoritative comparison enters the three-state currency partition. Apply the first matching state:

| Currency state | Exact boundary and controlling conditions | Departure use |
|---|---|---|
| **Current schedule** | Age is less than or equal to 2 hours; and the edition is validated, non-superseded for the claim, and inside effective and service-date coverage. | May support a clearly labeled scheduled clock time during eligible fallback, subject to every current veto. |
| **Stale reference** | Age is greater than 2 hours and less than or equal to exactly 24 hours; and the edition is validated, non-superseded for the claim, and inside effective and service-date coverage. | May support a visibly stale scheduled clock time in the separated fallback state, subject to every current veto. It may not produce a normal-looking board. |
| **Topology only** | Age is greater than 24 hours, **or** the edition is superseded for the claim, **or** the claim is outside the edition's effective or service-date coverage. | May explain network topology only. It makes no departure or arrival-time claim. Continue to regular GTFS as the next candidate. |

Exactly 2 hours is **Current schedule**. Any positive duration beyond 2 hours through exactly 24 hours is **Stale reference**. Exactly 24 hours is Stale reference; any positive duration beyond 24 hours is **Topology only**. For editions admitted to currency classification, these states have no overlap or gap. Supersession or coverage failure controls regardless of apparent age; unusable timestamp evidence is quarantined before classification.

## Negative evidence and service changes

Fallback changes the positive source; it does not weaken precedence. Before showing any scheduled time, apply every current scoped bypass, suspension, missing-stop rule applicable to a healthy live claim, planned-pattern exclusion, station closure, short turn, cancellation, unresolved reroute, and invalidating track conflict supported by the evidence catalog and service-change policies.

A resolved veto suppresses the scheduled claim within its supported scope and preserves the narrowest supported explanation. **Service change—arrival unavailable** requires independent current high-impact evidence of a governed possible bypass, reroute, short turn, suspension, closure, or invalidating track/path change, as applicable, plus material scope uncertainty that affects the proposed claim. When both conditions hold and the effect on the proposed schedule remains unresolved, replace the optimistic schedule for only that affected scope with exactly:

**Service change—arrival unavailable**

Do not show the scheduled clock time beside or beneath that replacement. Preserve unrelated service and the official service-change message where the governing service-change policy requires it. A delay-only alert, generic **Affected** marker, missing station or direction metadata, or contradiction alone cannot create arrival unavailability. None of those facts proves normal service either. Missing or contradictory scope can contribute to unavailability only when the required independent current high-impact evidence already exists and the uncertainty materially affects the claim. Neither the absence of an alert nor supplemented coverage proves normal service.

### Catalog-wide release carryover

A claim previously hard-suppressed by a resolved catalog veto remains suppressed after its alert ends or adverse condition clears until the row-specific release prerequisite and the catalog-wide release gate both pass. Recovery requires two consecutive fresh coherent accepted updates newer than the adverse evidence. Across the pair, prove all five Task 9 conditions: stable identity, plausible stop order, current movement or stop progress, continued service at the exact directional target, and no unresolved service or track conflict; then reevaluate every Live gate.

The first qualifying update restores nothing. Static, supplemented, or regular schedule data is not a recovery update. An Unavailable feed supplies no qualifying recovery update. Therefore a static trip during fallback cannot restore the previously hard-suppressed claim, an exact countdown, primary eligibility, guidance, or a Scheduled arrival. Keep **Live data unavailable** visible and use only a neutral evidence-supported no-arrival treatment; do not preserve or invent a stale service-change cause after that cause has ended. Apply this carryover only to the previously suppressed claim. Unrelated claims continue through their own independent fallback, veto, and eligibility decisions.

## Rider presentation

An eligible fallback board is visually and semantically separate from the Live and Expected next-three board. For every shown scheduled departure:

- Show a scheduled New York clock time, never a countdown or advancing minute value.
- Show **Scheduled** as its evidence state.
- Keep **Live data unavailable** persistently visible for the affected route or feed group.
- Show the currency age and its truthful anchor (**Published** when an accepted publication time exists, otherwise **First retrieved**), the latest successful **Last retrieved** age, and the effective operating service date. When currency age and last-retrieved age differ, surface both together so a fresh retrieval cannot hide an older publication/first-retrieval age.
- For **Stale reference**, show exactly **Stored schedule—service changes may differ**.
- Keep every known active veto and unresolved service-change decision in force.
- Never say **Live**, **Expected**, or **on time**, imply normal service, mix the row into the live next-three list, or use it to fill a live-board gap.

Repeated retrieval may update the truthful **Last retrieved** observation, but it cannot make the edition younger, change its currency state, or hide the edition's original publication/first-retrieval currency age.

## Required decision record

For every fallback, veto, or no-estimate decision, retain:

1. The exact route or feed-group scope and the evidence that classified it Unavailable.
2. Proof that fallback did not arise from one missing train, a single candidate failure, or another group's health.
3. The operating service date and proposed scheduled departure.
4. Every evaluated supplemented currency edition's canonical schedule-content identity, wrapper observations, validation result, source-supported order, publication time when supplied, timestamp acceptance or quarantine reason, first successful retrieval, latest retrieval, effective coverage, age anchor, authoritative comparison time, age, currency state, and claim-scoped supersession disposition.
5. The regular GTFS eligibility decision when supplemented data did not supply the departure.
6. Every current veto or unresolved service change, its independent high-impact evidence where applicable, material scope uncertainty, and whether it suppressed or replaced the schedule.
7. Any prior hard suppression, row-specific prerequisite, both recovery updates, all five Task 9 recovery conditions, and Live-gate result.
8. The selected source or no-estimate result and the exact rider presentation, including both currency age and last-retrieved age when they differ.

The [schedule currency boundary cases](schedule-currency-boundary-cases.md) define the required acceptance evidence. No scenario becomes approved merely because this policy states its expected decision.
