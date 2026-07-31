# Commute notification library

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 28.2, 29.3, 31.6 scenarios 36–39, 31.7–31.8, 33.5, and 34–35; commute alerts and launch quality plan Task 5; rider language rules; accepted Commute Tasks 1–4 and accessibility handoffs |
| Owner | Content Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-message-scenarios.md#pending-execution-record) |

## Purpose and authority

This library owns exact Draft title and body patterns for delivered subway commute disruptions, escalations, and accessibility impacts. The [timing policy](../commute/notification-timing-policy.md) decides when a message may be sent; the [eligibility contract](../commute/notification-eligibility-contract.md) decides whether the impact qualifies; and the [recovery policy](../commute/recovery-notification-policy.md) owns recovery wording.

This library preserves the Task 4 [permission pre-prompt](commute-window-copy-catalog.md#permission-copy) without editing, reproducing, or repurposing it as delivered-notification copy.

This artifact is **Draft**. **NO-GO — GATE 0 NOT PASSED** remains authoritative. No string below is approved, rendered, delivered, spoken, localized, reviewed, or evidenced in a fixed product.

## Product Governance reconciliation

The artifact header and Draft product artifact index row now align on the full Task 5 provenance, rider-language rules, accepted Tasks 1–4 and accessibility handoffs, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every rendered-notification result and reviewer decision remains **Pending**.

## Rendering contract

Braced fields are required evidence-backed substitutions; braces never appear to riders. A message must answer what changed, which exact part of the saved trip is affected, and what the rider can safely do.

| Required field | Exact rule |
|---|---|
| Trip descriptor | Rider-recognizable route, normalized **bound** direction, actual destination or terminal, and occurrence; never a raw route-direction code |
| `{route and direction}` substitution | Every substitution renders the rider-recognizable route, normalized bound direction, and actual destination or terminal; never a route and direction without its destination context |
| Impact | Plain-language current or scheduled impact with evidence-matched certainty |
| Scope | Exact direction, station, constituent, entrance, exit, transfer, segment, or selected accessible-path role |
| Occurrence | Calendar date and commute window, not a service-day label |
| Action | First independently verified action, or an exact no-verified-alternative result; never auto-selected |
| Alternative | Only the first result from the governed verified tier; bus is named as a separate explicit choice |
| Added time | Included only when supported; rendered as **about {supported added minutes} extra minutes** |
| Accessibility evidence | Exact connection, accepted state, owner freshness, path consequence, and verified/no-verified-alternative result |
| Invitation | Every initial or escalation body ends exactly **Open current details.** |
| Internal provenance | Fixed source/evidence versions, episode/impact handoff, owner decisions, final recheck, and template ID; never rider-visible raw codes |

The most decision-relevant impact and action remain visible without opening the app. A title never relies on route color or an icon. Visible and assistive output use the same complete title, body fields, order, punctuation, scope, certainty, and consequence.

## Date and time rendering

- A same-day occurrence renders like **Mon, Aug 3, 8:00–9:00 AM**.
- An overnight occurrence renders like **Mon, Aug 3, 11:30 PM–Tue, Aug 4, 12:30 AM**.
- Both calendar dates remain explicit when an interval crosses midnight.
- Fall-back and spring-forward occurrences retain the fixed occurrence identity supplied by the time policy; copy never invents a duplicate or phantom interval.
- Never expose “service day,” an offset, a source timestamp, or a time-zone implementation term.

## Exact Draft disruption patterns

Words and punctuation outside braces are exact. Optional sentences appear only when their stated evidence exists.

### Planned change — `COMMUTE-N01`

Title:

> **Planned change for {trip descriptor}**

Body:

> {route and direction} service is scheduled to {exact future impact} at {exact station or segment} during {occurrence}. {verified action or exact no-verified-alternative result} Open current details.

The phrase **is scheduled to** is required. This template never claims the future plan is operating now or vetoes current arrivals early.

### Active delay — `COMMUTE-N02`

Title:

> **Delay affects {trip descriptor}**

Body without a supported added-time estimate:

> {route and direction} service is delayed on {exact segment} during {occurrence}. {verified action or exact no-verified-alternative result} Open current details.

Optional supported estimate sentence, inserted immediately before the invitation:

> Allow about {supported added minutes} extra minutes.

Do not infer minutes from a severity label, round a below-threshold value upward, or expose raw seconds.

### Suspension — `COMMUTE-N03`

Title:

> **Service suspended for {trip descriptor}**

Body:

> {route and direction} service is suspended on {exact station or segment} during {occurrence}. {verified action or exact no-verified-alternative result} Open current details.

### Bypassed stop — `COMMUTE-N04`

Title:

> **{station} stop change**

Body:

> {route and direction} trains are not stopping at {station} during {occurrence}. {verified action or exact no-verified-alternative result} Open current details.

This template is permitted only when the reconciled effective stop set confirms the bypass. It never says an excluded station is served.

### Short turn — `COMMUTE-N05`

Title:

> **Service ends before {destination}**

Body:

> {route and direction} service ends at {verified short-turn terminal}, before {destination}, during {occurrence}. {verified action or exact no-verified-alternative result} Open current details.

### Station or constituent closure — `COMMUTE-N06`

Title:

> **{exact station or station part} is closed**

Body:

> {exact station, constituent, entrance, exit, or passage} is closed during {occurrence}, affecting {route and direction} travel. {verified action or exact no-verified-alternative result} Open current details.

The scope stays on the accepted closed part. An entrance, constituent, or passage closure never becomes a whole-complex claim.

### Escalation — `COMMUTE-N07`

Title:

> **Update for {trip descriptor}**

Body:

> {exact worsened impact} now affects {exact newly material scope} during {occurrence}. {verified current action or exact no-verified-alternative result} Open current details.

Use this pattern only after the [timing policy escalation test](../commute/notification-timing-policy.md#escalation-policy) passes. State only supported changes from the last successfully delivered baseline.

## Exact accessibility handoff patterns

These exact accepted [accessibility catalog](../accessibility/accessibility-copy-catalog.md#exact-warning-patterns) sentences are consumed without paraphrase. Their presence does not itself make a push eligible.

### Accepted adverse state with first verified alternative — `A11Y-T5-04`

> **{Exact connection}: {exact accepted adverse equipment state}. Your selected step-free path is unavailable; choose {first verified alternative}.**

### Unknown required connection with first verified alternative — `A11Y-T5-05`

> **Current status for {exact required connection} is Unknown. Your selected step-free path cannot be verified right now; choose {first verified alternative}.**

An Unknown material notification remains subject to the eligibility contract’s owner-approved cannot-verify and Hold rules. Copy cannot turn Unknown into an outage.

### Blocking with no verified alternative — `A11Y-T5-06`

> **{Exact connection}: {exact accepted equipment state}. {Exact selected-path consequence} No verified alternative is available for {exact affected journey scope}. No verified step-free subway route is available right now.**

For an accepted adverse state, `{Exact selected-path consequence}` is exactly **Your selected step-free path is unavailable.** For Unknown it is exactly **Your selected step-free path cannot be verified right now.**

When one of these patterns is eligible for delivery, use title **Accessibility change for {trip descriptor}**, preserve the complete exact sentence, add the owner-approved exact freshness statement, and end with **Open current details.**

Only the first verified tier is initially offered:

1. another complete verified path in the same complex;
2. a nearby verified accessible subway station;
3. a verified accessible subway detour; then
4. a bus-inclusive alternative, explicitly named as a separate rider choice.

The option remains unselected and uses **choose**. A disclosed but incomplete option is labeled exactly **Accessibility not confirmed** and is never recommended. Never use **Working**, **Available**, **Accessible now**, **all elevators restored**, or transform **Unknown** into an outage.

## Continuing accessibility recheck language

One-machine evidence does not authorize recovery. Preserve the exact source-matched handoff:

`A11Y-T5-07`

> **Restoration was reported for {exact equipment}. Your complete step-free path is still being rechecked; keep following {exact current verified safe action or warning}.**

`A11Y-T5-09`

> **The prior outage is no longer reported for {exact equipment}. Your complete step-free path is still being rechecked; keep following {exact current verified safe action or warning}.**

The first pattern is exclusive to an accepted explicit restoration report. The second is exclusive to the accepted two-omission branch. Neither says that equipment operates or the path is restored.

## No definitive-message states

There is no definitive delivered template for:

- stale evidence;
- unresolved or contradictory scope;
- a generic line-wide or data-health condition;
- an unsafe or unverified alternative;
- an inferred state before Task 3 persistence;
- a severity word without exact journey consequence; or
- an equivalent copy or timestamp refresh.

Those states Hold, suppress, or omit the optional alternative under their owner contracts. Fresh wording cannot make stale evidence current.

## Assistive and lock-screen parity

- Speak route identity and bound destination; color is supplemental.
- Put the affected trip part and safe action before lower-priority detail.
- Preserve the same date, impact, certainty, added time, accessibility state, freshness, and invitation visibly and assistively.
- Do not rely on color, icon, sound, animation, haptic, truncation, or notification category for meaning.
- At largest text or in a truncated surface, never remove the impact, exact affected trip part, safe action/no-alternative result, or invitation before secondary detail.
- Do not expose guessed Home/Work labels, personal addresses, raw IDs, or unrelated trip history.

## Explicit gaps

There is no localization, lock-screen privacy decision, truncation result, largest-text capture, assistive transcript, fixed product/build, rendered output, reviewer decision, approval, delivery, pilot, or launch evidence. Task 6 episode integration and an approved severity order remain **Pending**.

## Draft review checklist

- [ ] Every pattern answers what changed, which exact trip part is affected, and what to do.
- [ ] Planned certainty, bypass stop truth, closure scope, and added-time wording match the evidence.
- [ ] Every initial/escalation body ends with exact **Open current details.**
- [ ] Accessibility strings remain exact, path-scoped, fresh, tier-ordered, and unselected.
- [ ] Unresolved, stale, contradictory, generic, and equivalent-copy states have no definitive template.
- [ ] Visible and assistive output preserve equivalent meaning.

Every unchecked item blocks approval. Template definitions are not evidence.
