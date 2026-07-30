# Commute window field dictionary

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §25.1; applying approved specification §§5.1–5.2, 25.1, 26, 28.2–28.3, 31.6–31.7, 32.3, and 34–35; commute alerts and launch quality plan Task 1 |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-window-contract.md#pending-execution-record-for-every-fixture) |

## Purpose and authority

This dictionary defines the rider-confirmed preference fields that make one recurring subway commute window structurally valid. It owns field presence, validation, permitted proposal sources, and reconfirmation triggers. It does not store operational truth, decide disruption eligibility, set delay thresholds, request notification permission, deliver a push, deduplicate episodes, retain history, measure outcomes, operate the service, or authorize launch.

The [commute window contract](commute-window-contract.md) owns the promise, lifecycle, recurrence, overlap, overnight and daylight-saving behavior, and exclusions. The [subway product decisions](../decisions/subway-product-decisions.md) retain the cross-domain disruption-only and recovery boundaries. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. No real rider window, saved trip, station relationship, entrance, exit, transfer, accessibility setting, confirmation, product behavior, reviewer decision, approval, or release evidence exists.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites a narrower §25.1 boundary. This dictionary also applies §§5.1–5.2, 26, 28.2–28.3, 31.6–31.7, 32.3, 34–35, and the full Task 1 plan provenance. Product Governance Lead reconciliation remains **Pending**. This task does not edit the index or invent approval.

## Required field dictionary

Every required value must be present, valid, and explicitly confirmed before lifecycle **Active** is possible. Optional means the window may be valid without that field; it never means the product may infer or promise a value.

| Field | Presence | Validation and meaning | Permitted proposal, inference, and reconfirmation |
|---|---|---|---|
| Active weekdays | Required | Nonempty set of unique New York local weekdays. The weekday belongs to the local date on which the window starts. | May be proposed only from an explicitly saved window. Never infer from passive use. A changed or invalid weekday set requires review and confirmation. |
| Local start time | Required | Valid New York wall time. It anchors the occurrence date and must differ from end time. | Never infer passively. A proposal remains inactive until reviewed with every field and explicitly confirmed. |
| Local end time | Required | Valid New York wall time unequal to start. Later than start is same-day; earlier than start means next-day overnight. | Never infer passively. Equal times are invalid rather than a 24-hour window. Any changed time requires explicit confirmation. |
| Origin | Required | Exact subway complex and exact constituent station where needed to preserve the journey relationship. | May be proposed from an explicitly saved station or trip. A retired, ambiguous, split, merged, or materially remapped relationship requires reconfirmation; never silently substitute a nearby station. |
| Preferred entrance | Optional | Exact entrance that belongs to the selected origin relationship. Coordinates alone are insufficient. Absence creates no entrance promise. | May be proposed only from explicit saved context. If a selected entrance becomes unresolved or remapped, expire until the rider clears it or explicitly reconfirms a valid relationship. Never infer from proximity or location history. |
| Destination | Required | Exact, distinct, meaningful subway destination complex and constituent station where needed. Origin and destination cannot describe the same meaningless journey. | May be proposed from an explicitly saved trip. A retired, ambiguous, or materially remapped relationship requires explicit review; no nearby substitute. |
| Preferred exit | Optional | Exact exit belonging to the destination relationship. Absence is valid and creates no exit or guidance claim. | May be proposed only from explicit saved context. Never infer from proximity, current guidance, or repeated passive arrival. A selected unresolved or remapped exit requires clearing or reconfirmation. |
| Direction | Required | Normalized station-specific passenger direction plus the actual destination or terminal context. Preserve stations with more than two meaningful directions. | Raw compass code, binary Uptown/Downtown assumption, route color, or terminal name alone is invalid. A material mapping change requires reconfirmation; never collapse three directions into two. |
| Primary route | Required | Exactly one subway route with a structurally reviewed relationship to the saved origin, destination, direction, and journey. This field never proves current service. | May be proposed from an explicit saved trip. Structural relationship changes require reconfirmation. A temporary disruption never rewrites the preference. |
| Alternate routes | Required; empty allowed | Explicit unique collection of subway routes, excluding the primary route. Empty is a valid confirmed choice. | Never auto-expand, infer from current service, or add commuter rail. Every alternate still requires current truth and accessibility evaluation when later considered. Structural retirement or remap requires review. |
| Transfer preference | Optional | Exact rider intent for a specified transfer relationship. It stores no platform, walking-time, likelihood, service, or accessibility promise. | Only explicit saved intent may propose it. A missing, ambiguous, retired, or remapped structural relationship requires clearing or reconfirmation; no silent transfer substitute. |
| Preparation lead time | Required | Finite, nonnegative duration used only to open the watch interval before local start. | No approved default, maximum, menu, or passive inference exists. The rider must review and explicitly confirm the value. |
| Accessible Route Only | Required | Explicit **On** or **Off**. When On, it is a hard complete-path constraint and never silently relaxes. | Requires explicit confirmation. Never infer from disability, equipment use, location, or route choice. A failed route does not turn it Off. |
| Avoid Stairs | Required | Explicit **On** or **Off**, independent of Accessible Route Only. An escalator never substitutes for a wheelchair-accessible elevator chain. | Requires explicit confirmation. Never infer or silently couple it to Accessible Route Only. |
| Lifecycle | Required retained state | Retain exactly **Active**, **Paused**, or **Expired**. **Deleted** is a terminal removal, not a retained personalization state. | State changes follow the contract only. Inspection never resumes; daily end never expires; nothing auto-activates. |
| Confirmation provenance | Required before Active | Fixed complete field set, explicit confirmation action, New York confirmation date and time, and source shown for every proposed value. | A proposal, save, edit, or permission state is not confirmation. Any material relationship or field change requires a new complete review and explicit state choice. |

## Preference data never stores operational truth

Never store any of the following as a commute preference or use a retained copy to claim current conditions:

- arrivals, countdowns, or board order;
- current service, alert, incident, bypass, reroute, suspension, or delay state;
- elevator, escalator, or other equipment state;
- current platform, track, zone, walking path, or connection likelihood;
- current accessibility validity;
- crowding, proxy crowding, station density, or train-car state; or
- current positioning, exit, transfer, or route recommendation.

Those are independently evaluated watch inputs owned by later tasks. Temporary disruption, outage, stale evidence, or unavailable live data never rewrites a confirmed preference.

## Proposal and reconfirmation boundary

A proposal may come only from:

1. an explicitly saved station;
2. an explicitly saved trip;
3. an explicitly saved time window; or
4. a later-approved transparent repeated-use source.

Show the proposed value, its exact source, and the complete review together. A proposal is not a saved window, lifecycle state, watch, notification authorization, permission prompt, or confirmation.

Never infer or propose from passive station visits, location or movement history, searches, app opens, account attributes, “home” or “work,” or a current route recommendation. No repeated-use source, threshold, retention rule, or deletion rule is approved. Therefore retain no passive-use history and generate no passive repeated-use suggestion.

Expire with a visible exact reason and complete review when a selected complex or constituent, entrance or exit, direction or destination mapping, route or alternate, transfer relationship, or structural accessibility relationship becomes missing, ambiguous, retired, split, merged, or materially remapped. Never silently substitute. A stable-identity rename alone does not require reconfirmation unless meaning or scope changes.

## Draft review checklist

- [ ] Every required field is present, valid, shown with its proposal source, and explicitly confirmed before Active.
- [ ] Optional entrance, exit, and transfer fields create no promise when absent.
- [ ] Direction preserves station-specific meaning and more than two directions where applicable.
- [ ] Primary and alternate routes remain subway-only structural preferences, never current-service claims.
- [ ] Accessible Route Only and Avoid Stairs remain independent and never silently relax.
- [ ] Preparation lead time has no invented default, maximum, or menu.
- [ ] Passive behavior creates no proposal, history, confirmation, permission prompt, or watch.
- [ ] Material structural changes expire rather than silently remap.
- [ ] No operational truth is stored as preference data.
- [ ] All current evidence, reviewers, approvals, and scenarios remain Pending or absent.

Every unchecked item blocks structural validity. This documentation commit is not working-product evidence.
