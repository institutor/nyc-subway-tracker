# Accessible Route Only state matrix

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19.3–19.4, 21.10, 23.1, 23.3, 23.5, 29.4, 31.5, §31.6 scenario 35, and 33.3; accessibility and platform-guidance plan `Product artifact map`, Task 3 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`, and Task 8 positioning-priority extension |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This matrix makes Accessible Route Only a persistent hard constraint and defines how candidate subway paths, no-route outcomes, offline structural results, explicit bus-inclusive choices, and resilient ranking behave. It consumes the [complete accessible-path contract](complete-path-contract.md), [path-edge review checklist](path-edge-review-checklist.md), [station-direction coverage register](station-direction-coverage-register.md), and [station-direction review guide](station-direction-review-guide.md).

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and all decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md). Exact Task 3 wording is cataloged in the [accessibility copy catalog](accessibility-copy-catalog.md).

This artifact is **Draft**. It defines expected and prohibited behavior only. It contains no real station, route, entrance, direction, platform, boarding area, path, equipment, status, journey, observed result, reviewer decision, or approval evidence. All 16 fixtures are **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 3 does not pass Gate 0, approve any path or coverage record, authorize an accessible-now claim, or make the Release 1 accessibility decision.

## Governance provenance status

The artifact header and Draft [artifact index](../artifact-index.md) row include the Task 3 accessibility provenance and the Task 8 positioning-priority extension, with Product, Accessibility, Data Quality, Content, and Operations review. Reviewer decisions, scenario evidence, and approval remain **Pending**.

## Controlling invariant

When Accessible Route Only is On:

1. It remains On until the rider explicitly changes that setting.
2. It constrains the exact origin entrance and path, every transfer, destination platform and exit, normalized direction, platform, boarding area, and every required edge independently.
3. Every required structural and current-state decision must pass for the same complete path and exact scope.
4. A faster route, station badge, equipment presence, ordinary-platform record, unverified replacement, or official suggested alternative cannot relax or fill any requirement.
5. Missing, Unknown, stale-under-owner-rule, partial, wrong-direction, wrong-entrance, wrong-platform, unreviewed, blocked, or unavailable required evidence rejects that candidate.
6. A rejected candidate never changes the rider's setting to Off. It produces another eligible candidate or the truthful no-verified-route state.

Preference state and route eligibility are separate. **On with no eligible route** is a valid product state; it is never converted into **Off with a route**.

## Independent hard-constraint scopes

Each scope below must pass for the one candidate under review. A pass in one row cannot compensate for Fail or Unknown in another.

| Scope | Required pass result | Fail-closed examples | Prohibited relaxation |
|---|---|---|---|
| Origin street endpoint | Exact street endpoint and exact reviewed entrance begin a complete chain. | Missing corner, nearby staircase, wrong entrance, coordinate-only match | Start at the complex, mezzanine, or nearest entrance instead |
| Origin path | Every ordered edge from street through fare control or mezzanine to the correct boarding area passes. | Partial chain, gap, wrong constituent, unreviewed edge | Infer a path from a badge or one machine |
| Route and direction | Exact route or line and normalized rider direction match the accepted atomic coverage row and current service. | Opposite direction only, ambiguous direction, changed pattern | Borrow coverage from another direction or line |
| Platform | Exact current directional platform has its own complete accepted scope. | Reroute or replacement platform unverified, ordinary platform only | Transfer ordinary-platform evidence to a reroute |
| Boarding area | Exact step-free boarding area is verified and connected to the chain. | General platform access only, area missing or wrong | Treat reaching any part of a platform as sufficient |
| Transfer | Every arrival-platform-to-departure-boarding-area subchain passes independently and in order. | Non-step-free passage, wrong platform, one Unknown edge | Keep a transfer because origin and destination pass |
| Destination platform | Exact alighting platform matches current service and the reviewed chain. | Wrong direction, replacement platform, unresolved service change | End validation when the train reaches the station |
| Destination egress | A complete path continues from the exact platform through the exact exit to the intended street endpoint. | Required elevator unavailable, exit closed, last edge Unknown | Keep the route because origin boarding is step-free |
| Every required edge | Movement, endpoints, direction, official equipment identity where applicable, official path membership, restrictions, and verification pass. | Any missing, stale, partial, contradictory, or unreviewed field | Average edge results or inherit from an adjacent edge |
| Current equipment decisions | Every route-critical machine decision is accepted and current under its authoritative owner. | Unavailable, Unknown, stale, unmatched, provisional, anomalous | Treat equipment presence or absence of an alert as available |
| Current route and platform decisions | Service still uses every reviewed route, direction, platform, transfer, and destination relationship. | Bypass, closure, reroute, unresolved replacement | Preserve the structural route despite current conflict |

## Candidate truth and decision order

Evaluate one candidate path in this order:

1. Preserve the current Accessible Route Only setting.
2. Freeze one exact journey intent, one unique stable canonical path identity, and the candidate's separately versioned evidence package.
3. Require an accepted atomic station-direction coverage row for every origin, transfer, destination, entrance, platform, and boarding-area scope.
4. Require one continuous street-to-street chain under the complete-path contract.
5. Require every edge and every official accessible-path membership decision to pass.
6. Require current service to use the exact reviewed route, direction, platforms, transfers, and destination exit relationship.
7. Require every route-critical equipment decision to be current and accepted under its owner rule.
8. Reject immediately when any required result is Fail or Unknown.
9. Admit the candidate to resilient ranking only after every hard-constraint check passes.

| Cumulative result | Candidate disposition | Rider-state effect |
|---|---|---|
| Every required structural and current decision passes for the same complete path | **Eligible for Accessible Route Only ranking** | Setting remains On |
| Any required decision affirmatively fails | **Rejected** | Setting remains On; preserve journey intent |
| Any required decision is missing, Unknown, stale-under-owner-rule, partial, wrong-scope, unreviewed, blocked, or unavailable | **Rejected — required evidence is not confirmed** | Setting remains On; preserve journey intent |
| No candidate remains | **No verified step-free subway route** | Setting remains On; show exact no-route copy |

An official recommendation, alert, map line, complex badge, or previous result is an input to review, never a substitute for this cumulative decision.

## Preference persistence matrix

Only an explicit rider action that directly changes Accessible Route Only may turn it Off. A generic reset or deletion is not that action unless the rider is shown that this named setting will change and explicitly confirms it.

| Event or transition | State before | Required state after | Required behavior | Prohibited behavior |
|---|---|---|---|---|
| Open another screen and return | On | On | Reapply the hard constraint to the preserved or newly requested journey. | Reset because navigation changed. |
| App backgrounds and foregrounds | On | On | Revalidate current route inputs without changing the setting. | Default to Off on resume. |
| Refresh | On | On | Re-evaluate candidates; keep the current journey intent. | Relax after refresh finds no route. |
| Connectivity becomes Offline | On | On | Apply the offline structural rule. | Turn Off to show an unverified route. |
| Reconnect | On | On | Re-evaluate current evidence while preserving On. | Treat reconnect as a new default state. |
| Location permission denied or revoked | On | On | Use rider-selected, saved, or last-used context where available; require the same complete-path checks. | Turn Off because zero-tap location is unavailable. |
| No eligible current subway route | On | On | Preserve origin, destination, time, and other journey context; show exact no-route copy. | Show a stair-based or partially verified route. |
| Saved station or trip deleted | On | On | Remove only the selected saved object; preserve the active setting and any remaining journey context. | Use deletion to disable the constraint. |
| Generic settings or data reset | On | On | Preserve On unless the confirmation explicitly names Accessible Route Only as a setting being changed. | Hide a setting change inside a broad reset. |
| Another saved item contains a different preference | On | On | Keep the active rider setting; require an explicit change before using another value. | Let a saved item silently override On. |
| Rider explicitly changes Accessible Route Only to Off | On | Off | Apply Off only after the direct rider action is committed and expose the resulting state. | Infer the action from route selection, dismissal, or bus decline. |
| Rider explicitly changes Accessible Route Only to On | Off | On | Re-evaluate the whole requested journey under this matrix. | Keep a previously selected non-compliant route. |

## Destination egress and ride-past-and-return

### Broken destination egress

Destination validation ends at the intended street endpoint, not at the arrival platform or station complex. If any required exit edge is unavailable, blocked, Unknown, stale-under-owner-rule, wrong-scope, or unreviewed, the complete candidate is rejected even when:

- the origin entrance and boarding path pass;
- every train segment and transfer passes;
- the destination station has an informational accessibility badge;
- another exit exists but has not independently passed for the intended endpoint; or
- the broken machine is the final connection after alighting.

The rider's destination intent remains unchanged while another complete path is evaluated.

### Ride-past-and-return

A ride-past-and-return workaround may enter ranking only when all of the following independently pass:

- every added train segment;
- each added alighting platform and boarding area;
- every added transfer passage;
- the reversal movement and exact reverse direction;
- every required entrance, exit, and street endpoint;
- every required path edge and official accessible-path membership;
- every required equipment identity and current decision; and
- the current service, direction, and platform scope for the entire extended chain.

One Fail or Unknown added decision rejects the whole workaround. The original path's evidence cannot be reused to fill a return-direction, reversal, platform, transfer, boarding-area, equipment, or exit gap.

## Reroutes and official alternatives

| Proposed result | Required decision | Rider treatment |
|---|---|---|
| Train uses a rerouted or replacement platform | Require a separate complete structural row and accepted current decisions for that exact platform and boarding area. | Exclude it when any required decision is not Pass. |
| Official subway alternative has a complete accepted path and current decisions | Treat it as a new candidate under every hard constraint. | It may enter ranking; official status supplies no preference. |
| Official subway alternative lacks any complete or current decision | Exclude it from Accessible Route Only results. | Show **Accessibility not confirmed** only where the alternative itself is disclosed. |
| Unverified replacement is faster or more direct | Keep it excluded. | Never relax the constraint or imply accessibility. |

## No-route and explicit bus boundary

When no eligible current subway candidate remains, keep Accessible Route Only On, preserve the requested origin and destination, and show exactly:

**No verified step-free subway route is available right now.**

This is a supported no-result state, not an error.

A bus-inclusive journey is outside the subway-only result and requires a separate, explicit rider choice. Until that choice:

- do not insert a bus leg;
- do not replace the no-verified-subway result;
- do not infer consent from viewing, dismissing, refreshing, declining, or returning;
- do not describe an unverified bus or subway alternative as accessible; and
- do not turn Accessible Route Only Off.

After an explicit bus-inclusive choice, evaluate that journey separately under its applicable complete-path and current-state evidence. The choice does not weaken, rewrite, or retroactively validate the subway result. Declining or not choosing bus leaves the exact no-verified-subway result in place.

## Offline structural rule

Offline mode never supports a current equipment-availability or accessible-now claim.

| Stored evidence state | Required result | Required visible and assistive copy | Prohibited claim |
|---|---|---|---|
| Stored structural evidence remains complete and eligible under its authoritative owner rule for the exact path | The path may be shown as structural planning information only. | **Structurally step-free; live elevator status unavailable** | Accessible, Accessible now, Working, all elevators available |
| Stored structural evidence is missing, invalid, stale under its owner rule, partial, wrong-scope, or unreviewed | Do not make a positive structural claim. | Preserve journey context; show no Task 3 positive accessibility phrase and do not invent Task 4 or Task 5 copy. | Structurally step-free or any positive accessibility badge |
| A last-known outage exists but cannot be refreshed | Do not convert it into current state or restoration evidence. | Task 4 owns the pending equipment-state and freshness wording. | Current outage, current availability, restored, Working |
| A last-known available result exists but cannot be refreshed | Treat current route-critical equipment state as unavailable for a current claim. | Task 4 owns the pending equipment-state and freshness wording. | Accessible now or current availability |

The exact structural phrase must be visible and conveyed with equivalent meaning to assistive technology. Color, icon, or an accessibility badge cannot replace it.

## Resilient route ranking

Ranking starts only after every hard-constraint decision passes. It cannot rehabilitate an invalid path.

Compare fully eligible paths lexicographically in this exact order:

| Rank level | Criterion | Better value | Decision rule |
|---:|---|---|---|
| 1 | Single-point elevator dependencies | Fewer | Compare first. A dependency counts only from the accepted complete-path topology: its loss invalidates the candidate and no independently complete redundant chain remains. |
| 2 | Transfers | Fewer | Compare only when level 1 ties. |
| 3 | Accessible walking distance | Shorter | Compare only when levels 1 and 2 tie. Use the accepted accessible path, not a stair-based shortcut. |
| 4 | Disruption risk | Lower | Compare only when levels 1 through 3 tie. Use only an accepted, comparable owner decision. |
| 5 | Travel time | Shorter | Compare only when levels 1 through 4 tie. |

The ranking is not a weighted score, average, composite index, tunable blend, or hidden override. A later criterion cannot compensate for a worse earlier criterion. In particular, a small travel-time saving cannot outrank fewer single-point elevator dependencies, fewer transfers, shorter accessible walking, or lower disruption risk.

When all five rider-relevant values tie exactly, apply one neutral final tie-break: ascending stable canonical alternative identity supplied by the complete-path owner, using the complete-path contract's NFC-plus-unsigned-UTF-8-byte comparator. For an alternative that is exactly one path, that alternative identity is its stable canonical path identity. The identity's unique normalized comparison form must be fixed in the same decision package, remain stable across evidence refreshes and copy changes for the same alternative, and remain separate from mutable display names and evidence-version identifiers. Missing, duplicate, mutable, or conflicting canonical identities make the first-choice decision incomplete.

This final identity order exists only to keep the initial selection, bounded-list cutoff, and repeated presentation stable. It does not mean the selected alternative is better, shorter, safer, more resilient, more accessible, more current, or more trustworthy than another fully tied candidate. Source order, retrieval order, response order, wrapper order, record enumeration, render order, localized label order, and prior screen position are never tie-breakers.

If a required comparative input is missing, Unknown, incomparable, stale-under-owner-rule, or unreviewed, do not claim that one eligible path is the better-ranked path. Preserve the candidates without a comparative superiority claim until the ranking package is complete; never guess a value or let travel time cross the unresolved criterion.

## Fixture execution record

Every fixture below must be executed against one immutable product version and the fixed versions of this matrix, the copy catalog, the complete-path contract, the coverage register, and all applicable current-decision artifacts. Expected prose is not actual evidence.

### ARO-01 — persistence across transitions

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Accessible Route Only starts On; navigation, foregrounding, Offline, reconnect, and refresh occur. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | The control remains On after every transition; each result remains constrained. |
| Expected assistive result | Assistive technology conveys that Accessible Route Only remains On after every transition. |
| Prohibited visible and assistive result | Any silent Off state, relaxed route, or announcement that the setting changed without a direct rider action. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-02 — origin evidence incomplete or Unknown

| Evidence field | Record |
|---|---|
| Input paths and current decisions | The exact origin entrance or one required origin edge is incomplete or Unknown. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject the candidate; do not show it as a verified step-free route. |
| Expected assistive result | The candidate is not announced as accessible or available under Accessible Route Only. |
| Prohibited visible and assistive result | Infer origin accessibility from a badge, nearby entrance, equipment presence, or partial chain. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-03 — transfer passage incomplete or Unknown

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Origin and destination scopes pass; one required transfer passage is incomplete or Unknown. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject the complete candidate. |
| Expected assistive result | Do not announce the journey as a verified step-free route. |
| Prohibited visible and assistive result | Keep the route because both endpoint stations have accessibility evidence. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-04 — destination platform reachable but egress broken

| Evidence field | Record |
|---|---|
| Input paths and current decisions | The destination platform is reachable; one required destination-exit edge is broken. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject the candidate and preserve the intended destination while evaluating another complete path. |
| Expected assistive result | Convey no verified route for that candidate; do not stop validation at the platform. |
| Prohibited visible and assistive result | Present the route as accessible because origin boarding and train travel pass. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-05 — only the opposite direction is covered

| Evidence field | Record |
|---|---|
| Input paths and current decisions | A complete row exists only for the direction opposite the rider's requested journey. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject the requested direction. |
| Expected assistive result | Do not announce the opposite-direction record as support for this journey. |
| Prohibited visible and assistive result | Generalize a station, line, platform, or entrance record across directions. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-06 — boarding area unverified

| Evidence field | Record |
|---|---|
| Input paths and current decisions | A step-free path reaches the directional platform, but the exact boarding area is unverified. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject the candidate. |
| Expected assistive result | Do not announce a verified step-free journey or imply that general platform access is enough. |
| Prohibited visible and assistive result | Treat arrival at any part of the platform as complete boarding access. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-07 — reroute uses an unverified platform

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Current service reroutes a train from the ordinary reviewed platform to an unverified replacement platform. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject accessible routing for the rerouted candidate. |
| Expected assistive result | Do not announce the ordinary-platform route as valid for the replacement platform. |
| Prohibited visible and assistive result | Inherit ordinary-platform coverage or relax because the route identity is unchanged. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-08 — complete ride-past-and-return workaround

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Every added segment, platform, boarding area, transfer, reversal, direction, edge, equipment decision, exit, and endpoint independently passes. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Admit the workaround to the same resilient ranking as any other fully eligible path. |
| Expected assistive result | Convey the complete added travel and reversal without implying preference before ranking. |
| Prohibited visible and assistive result | Auto-prefer the workaround, omit added segments, or borrow evidence from the direct path. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-09 — ride-past-and-return has one Unknown edge

| Evidence field | Record |
|---|---|
| Input paths and current decisions | One added reversal, platform, boarding-area, equipment, transfer, or exit decision is Unknown. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Reject the entire workaround. |
| Expected assistive result | Do not announce the workaround as a verified step-free option. |
| Prohibited visible and assistive result | Treat the workaround label or all other passing edges as compensation for the Unknown edge. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-10 — no verified subway route

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Every current subway candidate is rejected under at least one required hard-constraint decision. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Show exactly **No verified step-free subway route is available right now.** Preserve journey context and keep the setting On. |
| Expected assistive result | Announce exactly **No verified step-free subway route is available right now.** |
| Prohibited visible and assistive result | Show a partially verified, stair-based, or bus-inclusive route; say that the setting was turned Off; call the state an error. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-11 — no explicit bus choice

| Evidence field | Record |
|---|---|
| Input paths and current decisions | No verified subway route remains and the rider has not explicitly chosen a bus-inclusive journey. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Keep every bus leg out of the subway result and retain the exact no-route message. |
| Expected assistive result | Do not announce a bus-inclusive itinerary as the result; preserve the no-verified-subway state. |
| Prohibited visible and assistive result | Insert, auto-select, or imply consent to a bus leg. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-12 — explicit bus-inclusive choice

| Evidence field | Record |
|---|---|
| Input paths and current decisions | The rider makes a separate explicit choice to evaluate a bus-inclusive journey. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Evaluate the bus-inclusive journey separately; keep the subway-only no-route truth unchanged. |
| Expected assistive result | Convey that a separate bus-inclusive option is being evaluated without describing an unverified alternative as accessible. |
| Prohibited visible and assistive result | Weaken the subway constraint, retroactively validate a subway path, or treat the choice as turning Accessible Route Only Off. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-13 — offline with eligible stored structural evidence

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Offline; stored complete-path structural evidence remains eligible under its owner rule; live equipment status is unavailable. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Show exactly **Structurally step-free; live elevator status unavailable** and keep the setting On. |
| Expected assistive result | Announce exactly **Structurally step-free; live elevator status unavailable**. |
| Prohibited visible and assistive result | Accessible, Accessible now, Working, current availability, or restoration. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-14 — official alternative lacks complete review

| Evidence field | Record |
|---|---|
| Input paths and current decisions | An official suggested alternative lacks one or more complete-path or accepted current decisions. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Exclude it from Accessible Route Only results and label the disclosed alternative exactly **Accessibility not confirmed**. |
| Expected assistive result | Announce exactly **Accessibility not confirmed** with the disclosed alternative. |
| Prohibited visible and assistive result | Accessible, Accessible now, Working, Probably accessible, or promotion because the source is official. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-15 — multiple eligible paths require exact ranking

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Four fully eligible alternatives in the same applicable tier have fixed, accepted values for all five ranking levels and tie exactly at every level. Their distinct canonical identities and normalized comparison forms are `PATH-SYN-ARO-15-A`, `PATH-SYN-ARO-15-B`, `PATH-SYN-ARO-15-C`, and `PATH-SYN-ARO-15-D`; the governed comparator orders them A, B, C, D. Run A and Run B contain the same alternatives and decisions, but source, retrieval, wrapper, and record-enumeration order are shuffled. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Apply the five rider-relevant levels, then the governed neutral canonical-identity comparator. Both runs show A, B, C, D in that order; A is first and every bounded-list cutoff has identical membership and order, without a superiority claim between tied candidates. |
| Expected assistive result | Present the same stable order in both runs; do not announce the identity tie-break as a reason that one tied alternative is better, shorter, safer, or more accessible. |
| Prohibited visible and assistive result | Weighted score, average, hidden override, comparison of an ineligible path, source or retrieval order as a tie-break, changed first choice or cutoff membership after the shuffle, or rider-facing exposure of a canonical identity. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

### ARO-16 — faster path has more single-point dependencies

| Evidence field | Record |
|---|---|
| Input paths and current decisions | Two paths are fully eligible; the faster path has more single-point elevator dependencies. |
| Fixed product and artifact versions | Not recorded |
| Expected visible result | Rank the path with fewer single-point elevator dependencies first. |
| Expected assistive result | Present the more resilient path first; do not announce the faster path as best. |
| Prohibited visible and assistive result | Let travel-time savings compensate for worse level-1 resilience. |
| Actual visible, assistive, and decision result | Not observed |
| Required reviewers and review date | Product, Accessibility, Data Quality, Content; date not recorded |
| Evidence | None |
| Disposition and correction | Pending; none recorded |
| Rerun and evidence status | Not run; **Not run — Pending** |

## Ownership and downstream use

| Decision | Authoritative owner | Task 3 boundary |
|---|---|---|
| Complete structural path and edge eligibility | Complete-path contract and station-direction coverage artifacts | Consume exact-scope decisions; do not create real coverage. |
| Current equipment state, freshness, anomaly, and restoration | Draft Task 4 equipment artifacts | Treat Pending or unaccepted required decisions as Unknown; wording and observed evidence remain Pending. |
| Outage impact, alternative order, and underway warnings | Draft Task 5 impact and warning artifacts | Preserve the hard constraint; reviewer decisions, observed evidence, and warning wording remain Pending. |
| Accessible Route Only persistence, candidate exclusion, bus boundary, offline structural rule, and ranking order | This matrix | Own the deterministic behavior defined here. |
| Rider-visible Task 3 accessibility wording | Accessibility copy catalog | Use only the exact accepted phrases and evidence scopes. |
| Release approval | Release governance | This Draft supplies no approval or observed evidence. |

## Review completion checklist

- [ ] Accessible Route Only remains On through navigation, foregrounding, Offline, reconnect, refresh, permission denial, no route, reset, deletion, and another saved item's preference.
- [ ] Only a direct, explicit rider change can turn the setting Off.
- [ ] Origin entrance and path, every transfer, destination platform and exit, direction, platform, boarding area, and every required edge are independently constrained.
- [ ] Missing, Unknown, stale-under-owner-rule, partial, wrong-direction, wrong-entrance, wrong-platform, unreviewed, blocked, and unavailable required evidence all reject the candidate.
- [ ] A broken destination exit invalidates the complete path.
- [ ] Every added ride-past-and-return element passes independently.
- [ ] Rerouted and official alternatives receive complete independent review.
- [ ] The exact no-route, offline structural, and unverified-alternative phrases appear visibly and through assistive technology.
- [ ] Bus inclusion requires a separate explicit rider choice and never rewrites the subway-only result.
- [ ] Ranking applies only to fully eligible candidates, uses the exact five rider-relevant levels, and then uses stable canonical alternative identity only as a neutral final tie-break.
- [ ] No weighted score, average, later-criterion override, hidden relaxation, source-order tie-break, or superiority claim from canonical identity exists.
- [ ] ARO-15 repeats a full tie with shuffled source and retrieval order and preserves the same first choice and bounded-list cutoff membership.
- [ ] All 16 fixtures keep fixed-version, input, expected, prohibited, actual, reviewer, date, evidence, correction, rerun, and status fields separate.
- [ ] All 16 fixtures remain **Not run — Pending** until fixed evidence is recorded.
- [ ] Task 4 and Task 5 owners receive only the defined boundaries; no later copy is invented here.
- [ ] No real accessibility, current equipment, observed result, approval, Gate 0 passage, or release evidence is claimed.

Every unchecked required item blocks review completion. A completed matrix still does not authorize public accessibility behavior until all mandatory reviewers approve the same fixed version and all blocking scenarios pass.

## Task 8 append-only Release 2 positioning priority

This append-only Task 8 extension leaves every preceding Task 3 definition, all 16 original fixture records, their IDs, expected results, statuses, counts, wording, and evidence fields unchanged. It adds only the Release 2 positioning-priority boundary and fixture below. `ARO-17` is not part of the Release 1 inventory of 16 Task 3 ARO fixtures or the Release 1 acceptance pack's 54 fixture definitions.

| Extension governance field | Value |
|---|---|
| Applying source and plan provenance | Approved specification §§23.1, 23.3, 23.5, 29.4, and §31.6 scenario 35; accessibility and platform-guidance plan Task 8 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Consumed Task 7 authority | [Platform guidance evidence standard](../guidance/platform-evidence-standard.md) and [platform state and positioning certainty matrix](../guidance/platform-state-and-certainty-matrix.md) |
| Task 8 presentation owner | [Front, Middle, and Back positioning rider experience](../guidance/positioning-rider-experience.md) |
| Required extension reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status and approval | **Draft**; approval **Pending** |
| Scenario result | **Not run — Pending** |

The artifact header and Draft index row now carry this Task 8 provenance and Operations review requirement. This metadata reconciliation does not approve the extension; its reviewer decisions and scenario result remain **Pending**.

Task 7 continues to own **Platform confirmed**, **Expected platform**, **Check station signs**, **Verified**, **Expected**, **Unavailable**, the hard actual-versus-scheduled-track conflict, recovery, and independent guidance reevaluation. This extension consumes those decisions and does not redefine them.

### Positioning-priority matrix

| Condition | Required Accessible Route Only result | Prohibited behavior |
|---|---|---|
| A verified complete accessible boarding and exit path maps to a different supported zone than a shorter stair-based or convenience objective | Make the accessible zone primary and preserve its supported benefit and certainty. | Let quickest stairs, faster transfer, travel time, crowding, or convenience override it. |
| The route is structurally step-free but the Front/Middle/Back relationship has not independently passed Task 7 for the exact scope | Preserve the route decision but show and announce no positioning claim. | Infer a zone from structural accessibility, elevator presence, a station badge, or entrance coordinates. |
| Positioning is **Unavailable** while Accessible Route Only remains On | Keep the hard constraint On and omit positioning. | Silently relax Accessible Route Only to show an ordinary zone. |
| A replacement platform or rerouted orientation lacks its own complete accessible-zone evidence | Reject inherited accessible positioning for that platform and preserve only independently supported state. | Borrow the ordinary platform's accessible zone, boarding area, exit, elevator chain, or geometry. |
| Task 7 reports an invalidating unresolved nonterminal actual-versus-scheduled-track conflict | Suppress the affected arrival and every dependent accessible-positioning instruction; preserve unrelated service that independently passes. | Convert the conflict to a lower-certainty accessible recommendation or a **Check station signs** row. |

An available complete accessible path does not automatically create a positioning claim. The exact station, constituent, route, direction, service-pattern variation, platform, orientation, stopping relationship, objective, boarding/exit area, and zone relationship must independently pass Task 7. Positioning omission never changes Accessible Route Only to Off and never makes a stair-based recommendation eligible.

### ARO-17: verified accessible zone outranks quickest stairs

| Evidence field | Record |
|---|---|
| Fixed source and policy versions | Synthetic `ARO-17-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; Task 8 definitions bound by the commit containing this extension; fixed product/build **Pending** |
| Immutable input paths and current decisions | At `T0−30s` and `T0`, one admitted synthetic train has a supported Front quickest-stairs objective and a separately supported Middle verified accessible objective. The exact complete street-to-street accessible boarding/exit chain, current route-critical equipment decisions, exact area-to-zone relationship, platform, direction, service pattern, and Task 7 evidence all pass for Middle. Accessible Route Only is On at evaluation `T0+5s`. |
| Expected visible result | Present **Middle—nearest elevator** as the primary recommendation for the verified accessible boarding and exit path. No competing Front stair-based recommendation overrides it. |
| Expected assistive result | Announce Middle, the verified accessible objective, its supported certainty and benefit, and Accessible Route Only priority. Do not announce Front or another convenience zone as preferred. |
| Prohibited visible and assistive result | Quickest stairs, faster transfer, crowding, travel time, or convenience overrides Middle; structural accessibility creates a zone without Task 7 evidence; Accessible Route Only turns Off; an unverified reroute inherits Middle; a hard conflict becomes lower-certainty guidance. |
| Actual visible, assistive, and decision result | **Pending — not observed** |
| Required reviewer decisions and dates | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending**; all dates **Pending** |
| Durable evidence and attachments | **Pending — none recorded** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Status | **Not run — Pending** |

This synthetic fixture defines an expected result only. It establishes no real path, zone, geometry, station, route-direction coverage, equipment state, actual-track observation, rendered result, reviewer approval, Gate 0 passage, Release 1 change, or Release 2 authorization. Evaluation belongs only to Task 12's later separate Release 2 decision.
