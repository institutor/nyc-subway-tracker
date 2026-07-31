# Useful station and entrance ranking rules

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§14.3, 19.3–19.4, 26.2, and 31.4 scenario 21; nearby-station and offline-experience plan `Product artifact map` and Task 3 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 3 brief; Task 11 saved-personalization input boundary |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending — scenario 21, accessible-ranking evidence, and Release 1 evidence have not been produced |

## Purpose and authority

This contract owns practical-walk ranking of nearby station complexes, entrance eligibility, constituent-station grouping, application of supplied accessible-path truth, and transparent personalization. It does not own location permission, arrival admission, service-change resolution, complete-path validity, equipment state, journey planning, platform positioning, or release approval.

The [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md) supplies only the location precision the rider permitted. The [nearby and offline experience contract](experience-contract.md) owns preserved context and prohibits a ranking refresh from silently replacing the rider's selected station or direction. The [saved stations and rider-controlled personalization contract](saved-station-and-personalization-contract.md), Task 11, supplies only explicit Active preference and optional explicit time-window inputs and owns their controls. The [Nearby card and direction contract](nearby-card-and-direction-contract.md) consumes this contract's final ordered output without another ranking pass. Arrival and service-change decisions remain owned by the governed artifacts under `docs/product/arrival-truth/`; accessibility and guidance remain companion-owned.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and public wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**, so public arrival boards remain blocked. Accessibility owner artifacts, observed scenario 21 evidence, and Release 1 approval are also absent. The cases below are expected review fixtures, not observed passes.

## Governance and applying-provenance reconciliation

The artifact header and Draft [artifact index](../artifact-index.md) row register Product, Accessibility, Data Quality, Content, and Privacy and include approved-specification §26.2 when Task 11 supplies saved-personalization inputs. The [review and approval policy](../review-and-approval-policy.md) requires Privacy review because explicit saved preferences, time windows, and permitted location are personal-data inputs to ranking.

| Governance question | Current record | Required disposition |
|---|---|---|
| Registered reviewer set | Product, Accessibility, Data Quality, Content, Privacy | Reviewer routing is reconciled in the artifact header and Draft index row. |
| Applicable reviewer minimum | Product, Accessibility, Data Quality, Content, Privacy | All five roles must review the same fixed version. Privacy reviews saved-preference, explicit-time-window, and permitted-location application. |
| Registered source provenance | §§14.3, 19.3–19.4, 26.2, and §31.4 scenario 21 | Task 3 retains ranking ownership; Task 11 does not redefine eligibility or baseline order. |
| Review evidence | Pending | A Privacy decision and all other mandatory reviewer decisions on the same fixed version are required before advancement from **Draft**. |

This metadata reconciliation does not invent Privacy approval or satisfy any scenario gate.

## “Nearest” means nearest useful entrance

“Nearest” is the shortest practical street walk to a specific entrance that can admit the rider and serve the relevant constituent station and passenger direction. It is never straight-line distance to a station centroid.

The decision sequence is fixed:

1. Start with specific entrance records, not station centers.
2. Join each entrance only to its verified station complex, constituent station, routes, and passenger-serving directions.
3. Apply hard entrance, closure, and current-service exclusions.
4. When Accessible Route Only is enabled, apply the supplied exact path and equipment constraints.
5. Compare practical street-walk usefulness only among the remaining entrances.
6. Select the best eligible entrance for each relevant constituent station and direction.
7. Group verified connected constituents into one complex result without erasing operational axes or direction-specific entrance facts.
8. Establish the baseline nearest-useful order.
9. Apply only permitted, visible personalization as a presentation modifier.
10. Preserve the closer workable comparison whenever personalization promotes a farther station.

If entrance evidence cannot support a practical comparison, the app offers the bottom-anchored station picker. It does not fall back to centroid distance, guess an entrance, or invent a nearest result.

## Ranking evidence record

Every candidate, including excluded entrances, retains enough evidence to explain the result.

| Evidence family | Required fields |
|---|---|
| Identity and scope | Station-complex identity and rider-recognizable name; constituent station; entrance identity and street/corner description; verified complex connection; routes; exact passenger-serving directions or operational axes; selected destination/direction context when one exists. |
| Location and walking usefulness | Permitted location precision—precise, approximate, or unavailable; whether it supports a current proximity claim; entrance coordinates and validation state; estimated practical street walking time; applicable street-access restriction; explicit confirmation that no centroid substitute was used. |
| Entrance eligibility | Entry, exit-only, restricted, or Unknown permission; operating-time restriction; constituent station, routes, and directions reached; current entrance or station closure scope and effective period; evidence freshness; whether boarding in the relevant direction is supported. |
| Arrival usefulness | Direction-specific upstream qualified-arrival availability; supplied evidence state and board area; resolved service-change consequence; whether passenger service is established; distinction between no qualified arrival, unavailable data, and resolved no service. |
| Accessibility | Accessible Route Only state; exact accessible entrance; constituent, route, direction, platform, transfer, and exit scope as applicable; verified path record; every required route-critical equipment state and freshness result; valid, invalid, or Unknown path; visible reason a closer unverified entrance lost. |
| Personalization | Explicit saved station, entrance, or direction preference; permitted time-of-day context; baseline nearest-useful result; whether presentation order changed; visible reason for promotion; proof the closer workable result remains visible. |
| Decision and review | Eligible or excluded disposition; exact exclusion reason; baseline practical-walk rank; final display rank; winning station and entrance; decisive evidence; rider-visible explanation; every closer candidate and why it did not win; reviewer, date, and evidence status. |

Location is a ranking input only. It never admits a train, clears a service-change veto, establishes an accessible path, confirms a platform, or strengthens evidence.

## Hard exclusions and narrow scope

Exclude an entrance from automatic useful-entrance ranking when:

- it is exit-only, restricted against the required entry, or its entry permission is Unknown;
- a current resolved closure applies to that entrance;
- it does not reach the required constituent station;
- it does not serve the required passenger direction or operational axis;
- current resolved service evidence establishes that boarding in the exact scope is unavailable;
- its coordinates or verified entrance relationship cannot support a practical-walk comparison;
- it is only physically near or similarly named, without a verified connection;
- Accessible Route Only is enabled and the exact entrance-to-direction path is invalid or Unknown;
- a required accessible connection or route-critical equipment state is broken, stale, unmatched, or Unknown; or
- a preference attempts to override any entry, closure, service, accessibility, or evidence exclusion.

Exclusions remain scoped:

- One closed entrance does not close another entrance.
- One closed constituent does not remove unrelated services in the same complex.
- One inaccessible route or direction does not make a whole complex inaccessible.
- Generic **Affected** metadata does not prove a closure, bypass, or unavailable entrance.
- Missing qualified-arrival evidence does not itself prove the station is not serving passengers.
- Missing closure evidence does not prove an entrance is open.

A station may remain visible with an honest limited or unavailable arrival state when current evidence has not resolved passenger service as absent. Ranking must not hide it merely to make the result set appear more certain.

## Qualified-arrival and service-change boundary

Ranking consumes direction-specific upstream decisions; it does not inspect raw predictions or restore weaker candidates.

- Only use the exact qualified-arrival availability and consequence supplied for the entrance's relevant constituent and direction.
- Do not infer a usable train from route identity, a static schedule, normal pattern, station name, or geographic proximity.
- A resolved bypass, closure, suspension, short turn, or track conflict removes the affected service from the usefulness claim.
- Materially unresolved high-impact stop service cannot be described as currently serving.
- No arrival row because evidence is limited is different from resolved no service.
- Holding and Uncertain remain outside the primary next-three.
- Scheduled fallback remains **Scheduled** and cannot be treated as a current boardable train.
- Other routes, directions, constituents, entrances, and feed groups remain independently eligible.

The current Gate 0 no-go means these consumed results are not approved for public launch.

## Accessible Route Only

Accessible Route Only is a hard constraint, never a preference weight.

- Never substitute the nearest staircase.
- Never treat a station badge, one elevator, or equipment inventory as a complete path.
- Never inherit accessibility from another route, direction, constituent, or same-name station.
- Never treat Unknown as available.
- Never relax the constraint because a non-accessible result is closer or faster.
- Never use an unverified rerouted platform.
- Never let personalization override path validity.

Without an active destination, Nearby may rank a verified step-free origin entrance-to-directional-platform chain. It must describe only that directional station access, not a complete accessible journey.

With an active destination, the companion accessibility owner must verify the complete street-to-street path: entrance, fare-control or mezzanine connection, transfer passages, correct directional platforms, boarding area, destination platform, exit path, and street. Among complete valid accessible routes, the companion hierarchy controls: fewer single-point elevator dependencies, fewer transfers, shorter accessible walking distance, lower disruption risk, then travel time. Raw entrance proximity cannot override that result.

If a full destination path has been evaluated and none qualifies, use:

**No verified step-free subway route is available right now.**

Do not use that full-journey statement when only origin directional access was evaluated. Exact origin-access copy remains Pending Accessibility and Content review.

## Station-complex grouping

Group constituents only when a verified connection establishes one passenger complex. Physical closeness or a shared name is insufficient.

One grouped complex result retains:

- every constituent station;
- every passenger-serving operational axis and direction;
- each entrance-to-constituent and entrance-to-direction relationship;
- route- and direction-specific accessibility;
- scoped closures and service changes; and
- a different useful entrance for each direction when required.

A closer entrance serving another axis cannot be called best for the selected direction. Without an explicit selected journey or saved direction, the app does not invent a “likely direction”; it evaluates neutral complex usefulness and passes every direction to the [Nearby card and direction contract](nearby-card-and-direction-contract.md).

Re-ranking may update suggestion order. It may not navigate away from an explicitly selected station, change the rider's direction, clear filters, reset scroll position, or collapse axes into a generic Uptown/Downtown pair.

## Personalization

Only explicit saved preferences and their permitted time-of-day context supplied by the [saved stations and rider-controlled personalization contract](saved-station-and-personalization-contract.md) may influence presentation order. The record must be Active; a Paused record supplies no ordering or time-window influence. No optional time window may be inferred or applied outside the rider-entered window.

When a farther but usable station is promoted:

- retain the baseline nearest-useful station and entrance;
- keep both walking times and current usability visible;
- keep the closer workable station in the result set;
- label the promoted result with the saved-preference reason;
- never call the promoted result **nearest**; and
- never alter arrival, service-change, closure, accessibility, or entrance truth.

No inferred movement history, hidden habit model, account, or preference may override a hard exclusion. Task 11 owns inspection, explicit editing and saving, pausing, station-specific reset, and deletion controls without changing this contract's baseline or final ranking authority.

## Task 4 handoff

This contract passes the [Nearby card and direction contract](nearby-card-and-direction-contract.md):

- the final ordered set of eligible station complexes;
- each complex's baseline nearest-useful order and any permitted, visible personalization reason for its final position;
- every verified constituent station, passenger-serving operational axis, and direction;
- exact entrance-to-constituent and entrance-to-direction relationships, including a different useful entrance by direction when required; and
- supplied walking time, accessibility, closure, service, and ranking explanations at their exact scope.

Task 4 takes up to the first three eligible complexes in that final order. It must not rerank, duplicate, widen a relationship, relax an exclusion, or let the number or state of arrival rows influence complex order. When fewer than three eligible complexes remain, Task 4 shows fewer honestly.

Scenario 21 remains **Not run — Pending** under this **Draft** contract. The current decision remains **NO-GO — GATE 0 NOT PASSED; public boards blocked**, and no accessibility approval is present.

## Deterministic ranking cases

Each case is an expected fixture. Its result remains **Not run — Pending** until Task 14 observes the same fixed reviewed version.

### UR-C01 — Restricted entrance

| Case field | Fixed value |
|---|---|
| Inputs | Complex A entrance A1 is a 2-minute walk and exit-only; A2 is a 6-minute walk, permits entry, and serves the selected direction. Complex B entrance B1 is a 4-minute walk, permits entry, and serves that direction. Both complexes otherwise have equivalent qualified-arrival evidence. |
| Winner | **Complex B, entrance B1.** |
| Rejected or lower candidate | A1 is hard-excluded. Complex A remains eligible only through A2 and ranks below B. |
| Decisive evidence | A1 cannot admit the rider; B1 is the shortest eligible entrance. |
| Visible explanation | **The closest entrance is exit-only. B1 is the shortest entrance you can use for this direction.** |
| Prohibited result | Routing through A1, using Complex A's centroid distance, hiding A1's exclusion, or calling A1 useful because it is closest. |
| Evidence status | Not run — Pending |

### UR-C02 — Closed entrance

| Case field | Fixed value |
|---|---|
| Inputs | Complex A entrance A1 is a 2-minute walk with a current resolved closure; A2 is open and 7 minutes away. Complex B entrance B1 is open and 5 minutes away. The closure applies only to A1. |
| Winner | **Complex B, entrance B1.** |
| Rejected or lower candidate | A1 is excluded. Complex A remains a valid lower result through A2. |
| Decisive evidence | B1 is the shortest currently eligible entrance; A1 has a scoped closure. |
| Visible explanation | **A1 is currently closed. B1 is the shorter open entrance.** |
| Prohibited result | Ranking through A1, treating all of Complex A as closed, or treating absent unrelated alert evidence as proof that A1 reopened. |
| Evidence status | Not run — Pending |

### UR-C03 — Multi-axis complex

| Case field | Fixed value |
|---|---|
| Inputs | Verified connected Complex C contains Axis 1 and Axis 2. C1 is a 2-minute walk and serves only Axis 1. C2 is a 3-minute walk and serves the explicitly selected Axis 2 direction. Complex D entrance D1 is a 4-minute walk and serves that direction. Qualified service exists for the selected direction. |
| Winner | **One Complex C result, using entrance C2 for the selected Axis 2 direction.** |
| Rejected or lower candidate | C1 remains mapped to Axis 1 but is not best for Axis 2. D1 is the next eligible result. |
| Decisive evidence | C2 is the shortest entrance verified to reach the selected direction. |
| Visible explanation | **C1 serves a different part of this complex. Use C2 for the selected direction.** |
| Prohibited result | Duplicate Complex C cards, generic two-way grouping, claiming C1 reaches Axis 2, or erasing either axis. |
| Evidence status | Not run — Pending |

### UR-C04 — Accessible mode with Unknown

| Case field | Fixed value |
|---|---|
| Inputs | Complex A's staircase entrance is 2 minutes away and not step-free. Its nominal accessible entrance is 5 minutes away, but one required path edge or route-critical equipment state is Unknown. Complex B entrance B1 is 7 minutes away with the exact direction and applicable path verified and current. Accessible Route Only is enabled. |
| Winner | **Complex B, entrance B1.** |
| Rejected or lower candidate | Both Complex A entrances are ineligible: one is not step-free and the other's required path is Unknown. |
| Decisive evidence | B1 is the nearest candidate with a verified applicable step-free path. |
| Visible explanation | **The closer entrances do not have a currently verified step-free path for this direction.** |
| Prohibited result | Stair substitution, treating Unknown as available, using a complex badge as proof, disabling Accessible Route Only, or calling the origin chain a complete journey without a destination assessment. |
| No-winner branch | If B1 is also unavailable and no verified candidate remains, report no verified applicable path; do not guess an accessible entrance. |
| Evidence status | Not run — Pending |

### UR-C05 — Farther saved preference

| Case field | Fixed value |
|---|---|
| Inputs | Complex A entrance A1 is a 4-minute walk and currently usable. Complex B entrance B1 is a 7-minute walk, currently usable, and explicitly saved. Neither has an arrival, entrance, service, or accessibility disadvantage. |
| Baseline winner | **Complex A, entrance A1.** |
| Permitted final display | Complex B may appear first only with a visible **Saved preference** reason. Complex A remains visible as the closer workable result with its 4-minute walk. |
| Decisive evidence | A is geographically more useful; the rider explicitly saved B. |
| Visible explanation | **Saved preference · 7-minute walk. A is closer at 4 minutes.** |
| Prohibited result | Hiding A, calling B nearest, obscuring either walking time, or allowing preference to alter operational truth. |
| Evidence status | Not run — Pending |

## Review and release conditions

| Review question | Required Draft result | Evidence needed later |
|---|---|---|
| Does ranking start from usable entrances rather than centroids? | Yes. | Scenario 21 and entrance-coverage observation |
| Are hard exclusions applied before walking comparison and personalization? | Yes. | UR-C01–UR-C05 observed results |
| Does every result preserve exact constituent and direction scope? | Yes. | Multi-axis and direction review |
| Does Accessible Route Only reject Unknown without silently relaxing? | Yes. | Companion complete-path/equipment evidence and UR-C04 |
| Can a preference hide or rewrite the closer workable result? | No. | UR-C05 and saved-state evidence |
| Can ranking admit a train or clear a service-change veto? | No. | Upstream Gate 0 evidence and Task 14 integration review |
| Are Privacy routing and §26.2 applying provenance aligned between the artifact and Draft index row? | Yes; no Privacy decision or approval is implied. | Same-version Privacy decision with every other mandatory reviewer |
| Are current approval and scenario results claimed? | No. Gate 0 is a no-go; this artifact and every case remain Draft/Pending. | Required reviewer decisions and observed evidence |
