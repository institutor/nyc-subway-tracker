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

This policy owns entry into schedule fallback, static-source selection, supplemented-edition supersession, schedule currency, and the rider presentation of a fallback arrival. The [route-level feed health policy](feed-health-policy.md) owns whether a relevant real-time route or feed group is **Unavailable**. The [source role and precedence matrix](source-role-and-precedence-matrix.md) owns source roles, and the [evidence veto catalog](evidence-veto-catalog.md) owns negative evidence. The [approved transit product glossary](../contracts/transit-product-glossary.md) and [approved rider language rules](../contracts/rider-language-rules.md) continue to govern shared terms and public wording. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

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

“Departure-eligible” means that the edition is validated, is not superseded for the applicable coverage, covers the operating service date and departure, is inside its effective coverage and horizon, and is either **Current schedule** or **Stale reference**. A **Topology only** edition is never departure-eligible.

Regular GTFS therefore becomes the next candidate when supplemented GTFS is unavailable; has no validated applicable edition; is expired or outside its effective coverage or horizon; lacks service-date or departure coverage; is superseded without a newer departure-eligible applicable edition; or is **Topology only**. The selector does not return to an earlier supplemented edition that a later validated overlapping edition superseded. If regular GTFS cannot support the claim, the result is no estimate; the product does not invent service.

## Edition identity and supersession

Retain a distinct edition identity, content identity, validation result, supported source version or chronology, publication time when supplied, first successful retrieval time, later successful retrieval observations, effective coverage, service-date coverage, and supersession relationships.

- Determine that one edition is later only from retained source-supported version or chronological evidence. Retrieval order alone does not invent edition order.
- Once a distinct later edition is validated, it supersedes every earlier edition throughout their overlapping coverage. This is true even when the earlier edition still lists the same service date or a more optimistic trip.
- Supersession is monotonic for overlapping coverage. A later read failure, missing file, or repeated retrieval of old content cannot silently roll selection back to an earlier superseded edition.
- A failed or unvalidated new edition never supersedes a validated edition and never erases the last validated copy. The retained validated copy continues aging from its original age anchor.
- Repeated retrieval of content with the same retained edition and content identity is another observation of that edition, not a new edition. It cannot reset currency or remove supersession.
- When editions do not overlap, each remains eligible only within its own supported effective coverage. No coverage, publication time, validity, version order, or service is inferred from retrieval alone.

## Edition age and non-overlapping currency states

Calculate edition age at decision time from the source publication time when that time is supplied and accepted. When no source publication time is available, use the first successful retrieval time of that distinct validated edition. Never invent a publication time. An identical later retrieval does not change the age anchor. A failed new edition does not change the retained edition's anchor, so its age continues increasing.

Apply the first matching state:

| Currency state | Exact boundary and controlling conditions | Departure use |
|---|---|---|
| **Current schedule** | Age is less than or equal to 2 hours; and the edition is validated, non-superseded for the claim, and inside effective and service-date coverage. | May support a clearly labeled scheduled clock time during eligible fallback, subject to every current veto. |
| **Stale reference** | Age is greater than 2 hours and less than or equal to exactly 24 hours; and the edition is validated, non-superseded for the claim, and inside effective and service-date coverage. | May support a visibly stale scheduled clock time in the separated fallback state, subject to every current veto. It may not produce a normal-looking board. |
| **Topology only** | Age is greater than 24 hours, **or** the edition is superseded for the claim, **or** the claim is outside the edition's effective or service-date coverage. | May explain network topology only. It makes no departure or arrival-time claim. Continue to regular GTFS as the next candidate. |

Exactly 2 hours is **Current schedule**. Any positive duration beyond 2 hours through exactly 24 hours is **Stale reference**. Exactly 24 hours is Stale reference; any positive duration beyond 24 hours is **Topology only**. These states have no overlap or gap. Supersession or coverage failure controls regardless of apparent age.

## Negative evidence and service changes

Fallback changes the positive source; it does not weaken precedence. Before showing any scheduled time, apply every current scoped bypass, suspension, missing-stop rule applicable to a healthy live claim, planned-pattern exclusion, station closure, short turn, cancellation, unresolved reroute, and invalidating track conflict supported by the evidence catalog and service-change policies.

A resolved veto suppresses the scheduled claim within its supported scope and preserves the narrowest supported explanation. When a current service change materially affects the scope but its effect on the proposed schedule remains unresolved, replace the optimistic schedule for only that affected scope with exactly:

**Service change—arrival unavailable**

Do not show the scheduled clock time beside or beneath that replacement. Preserve unrelated service and the official service-change message where the governing service-change policy requires it. Neither the absence of an alert nor supplemented coverage proves normal service.

## Rider presentation

An eligible fallback board is visually and semantically separate from the Live and Expected next-three board. For every shown scheduled departure:

- Show a scheduled New York clock time, never a countdown or advancing minute value.
- Show **Scheduled** as its evidence state.
- Keep **Live data unavailable** persistently visible for the affected route or feed group.
- Show the successful retrieval age and the effective operating service date. If publication time is available, retain and expose its distinct age basis in details rather than relabeling it as retrieval time.
- For **Stale reference**, show exactly **Stored schedule—service changes may differ**.
- Keep every known active veto and unresolved service-change decision in force.
- Never say **Live**, **Expected**, or **on time**, imply normal service, mix the row into the live next-three list, or use it to fill a live-board gap.

Repeated retrieval may update the truthful “last retrieved” observation, but it cannot make the edition younger, change its currency state, or hide the edition's original publication/first-retrieval age anchor.

## Required decision record

For every fallback, veto, or no-estimate decision, retain:

1. The exact route or feed-group scope and the evidence that classified it Unavailable.
2. Proof that fallback did not arise from one missing train, a single candidate failure, or another group's health.
3. The operating service date and proposed scheduled departure.
4. Every evaluated supplemented edition's distinct identity, validation result, source-supported order, publication time when supplied, first successful retrieval, content identity, effective coverage, age anchor, age, currency state, and supersession disposition.
5. The regular GTFS eligibility decision when supplemented data did not supply the departure.
6. Every current veto or unresolved service change, its scope, and whether it suppressed or replaced the schedule.
7. The selected source or no-estimate result and the exact rider presentation.

The [schedule currency boundary cases](schedule-currency-boundary-cases.md) define the required acceptance evidence. No scenario becomes approved merely because this policy states its expected decision.
