# Commute recovery notification policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 28.2, 29.3, 31.6 scenarios 36–39, 31.7–31.8, 33.5, and 34–35; commute alerts and launch quality plan Task 5; accepted Commute Tasks 1–4 and accessibility handoffs |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-message-scenarios.md#pending-execution-record) |

## Purpose and authority

Restoration is silent by default. This policy defines the narrow circumstances in which an explicitly opted-in subway commute may receive one recovery message after a delivered disruption materially changes.

The [timing policy](notification-timing-policy.md) owns the final delivery opportunity, the [eligibility contract](notification-eligibility-contract.md) owns current relevance, the [notification library](../content/commute-notification-library.md) owns disruption wording, and the accessibility owners retain complete-path and equipment truth.

This artifact is **Draft**. **NO-GO — GATE 0 NOT PASSED** remains authoritative. It supplies no real recovery, approval, delivery, or release evidence.

## Product Governance reconciliation

The artifact header and Draft product artifact index row now align on the full Task 5 provenance, accepted Tasks 1–4 and accessibility handoffs, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every recovery observation and reviewer decision remains **Pending**.

## Per-commute setting

The setting is `recovery_updates` with allowed values **On** and **Off**.

- Default is **Off** for every new commute.
- Only an explicit rider action changes it.
- A change is prospective; turning it On during an active episode does not qualify that episode.
- Turning it Off suppresses later recovery even if it was On at disruption delivery.
- The setting does not change lifecycle, notification permission, Accessible Route Only, or disruption eligibility.
- Task 7 owns persistence, deletion, reset, and inventory behavior; those handoffs remain **Pending**.

No lock-screen setting copy or mid-episode opt-in UI is approved. The product never infers the preference from notification interaction, commute frequency, location, or a guessed Home/Work label.

## Seven mandatory release gates

A recovery may be considered only when **all seven** gates Pass:

1. `recovery_updates` was On when the original disruption was delivered and remains On.
2. The original disruption notification was actually delivered successfully.
3. The candidate is linked to the same Task 6 episode and same material commute impact.
4. Every applicable truth owner has completed its exact release or resolution gate.
5. The prior delivered action materially changes for a remaining or upcoming occurrence.
6. lifecycle, permission, connectivity, window, relevance, currentness, and the complete immediate final recheck all Pass.
7. No unresolved adverse condition still requires the rider to follow the prior action or warning.

Any Fail suppresses. Any Unresolved gate holds only for fresh owner evidence while the occurrence remains eligible; it does not create a late replay.

## Evidence that is never sufficient by itself

None of the following proves recovery:

- disappearance, expiration, end time, or absence of an alert;
- elapsed time or a planned end;
- a copy edit, correction, renewed timestamp, or static schedule;
- one equipment record changing or disappearing;
- the first omission of a prior outage;
- another machine’s restoration;
- generic **No official outage reported**; or
- lack of a new disruption message.

A correction alone creates no recovery push. It requires an independent material recovery branch and all seven gates.

## Accessibility recovery

Accessibility recovery requires a fresh, complete reevaluation of every required structural edge, machine, route, direction, platform, boarding area, transfer, exit, and street endpoint for the exact selected path.

An accepted explicit restoration report for one machine uses exact `A11Y-T5-07` and retains the current warning:

> **Restoration was reported for {exact equipment}. Your complete step-free path is still being rechecked; keep following {exact current verified safe action or warning}.**

Accepted qualifying two-omission evidence uses exact `A11Y-T5-09` and retains the current warning:

> **The prior outage is no longer reported for {exact equipment}. Your complete step-free path is still being rechecked; keep following {exact current verified safe action or warning}.**

Neither branch alone permits a recovery. Only a fresh complete-path Pass that materially changes the prior action can reach the recovery template. Never say **Working**, **Available**, **Accessible now**, **all elevators restored**, or infer complete-path recovery from one machine.

## Exact Draft recovery patterns

Words and punctuation outside braces are exact. Visible and assistive output use the same full sentence, field values, certainty, and consequence.

### Added-time threshold recovery — `COMMUTE-R01`

> **The added-time estimate for {exact trip part} no longer exceeds your {5, 10, or 15}-minute alert setting. Open current details before you travel.**

Use only when the current supported estimate passes every owner release gate and changes the prior action for a remaining or upcoming occurrence. No general on-time claim follows.

### Service-impact recovery — `COMMUTE-R02`

> **Current checks now support {route and direction} service at {exact station or segment}; the earlier {bypass, suspension, closure, or short-turn} message no longer applies there. Open current details before you travel.**

The exact impact noun must match the successfully delivered disruption. This pattern does not imply line-wide normal service.

### Complete step-free-path recovery — `COMMUTE-R03`

> **Current checks now support your complete step-free path for {exact journey scope}. Open current details before you travel.**

Use only after the full path passes. Scope cannot widen from one entrance, constituent, direction, path, or occurrence to a station complex or future date.

Never use **All clear**, **Good service**, **On time**, “back to normal,” a routine restore, or equivalent certainty.

## Frequency, deduplication, and remaining occurrences

- Permit at most one recovery for one successfully delivered material impact.
- An equivalent recovery copy, timestamp refresh, repeated release record, or new source identity does not create another recovery.
- Task 6 owns final episode and material-impact identity; integration remains **Pending**.
- After the final affected occurrence ends, suppress recovery unless a remaining future occurrence materially changes and all seven gates independently pass for it.
- For multi-day work, a recovery is scoped only to remaining or upcoming occurrences; it never rewrites a completed occurrence.
- A delivered recovery becomes part of prior-delivery history for later duplicate evaluation, but never a disruption-escalation baseline.

## Required recovery decision record

Every candidate records:

1. fixed policy, product, source, and owner-artifact versions;
2. commute, window, occurrence, episode, and material-impact IDs;
3. original notification candidate, successful-delivery evidence, exact prior action, and original `recovery_updates` value;
4. current setting value and any change time;
5. every current release gate, freshness decision, and evidence reference;
6. remaining/upcoming occurrence and material action delta;
7. lifecycle, permission, connectivity, relevance, window, and complete final-recheck results;
8. selected recovery template and exact fields;
9. current candidate-to-original and current candidate-to-delivery linkage;
10. expected and prohibited visible and assistive results; and
11. actual result, all reviewer decisions and dates, durable evidence, correction, preserved original, and rerun.

## Explicit gaps

- Task 6 episode and material-impact identity is **Pending**.
- Task 7 setting UI, persistence, deletion, and reset behavior is **Pending**.
- There is no approved recovery rule specific to inferred-delay evidence beyond the seven gates and exact added-time pattern.
- Lock-screen privacy and an opt-in change during an active episode remain unspecified; the setting is prospective.
- There is no fixed product/build, real recovery candidate, delivery evidence, reviewer decision, approval, pilot, launch, or measured §29.3 result.

## Draft review checklist

- [ ] Recovery defaults Off and requires explicit prospective per-commute consent.
- [ ] All seven gates pass before a recovery candidate can send.
- [ ] Alert disappearance, time, correction, or partial equipment evidence never proves recovery.
- [ ] Accessibility recovery requires a fresh complete-path Pass.
- [ ] Exact recovery wording remains scoped and avoids a routine all-clear.
- [ ] One delivered material impact produces no more than one recovery.
- [ ] Completed occurrences are not rewritten.

Every unchecked item blocks approval. Policy definitions are not evidence.
