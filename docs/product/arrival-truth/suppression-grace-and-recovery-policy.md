# Suppression, grace, and recovery policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§9.3, 10.3–10.4, and 31.3 scenarios 15–16; arrival-truth and service-changes plan Task 9 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](suppression-and-recovery-cases.md) |

## Purpose and authority

This policy owns train-level disappearance grace, hard suppression, and the evidence required to recover an exact countdown and primary-board eligibility. It applies only after route/feed-group health has been decided under the [route-level feed health policy](feed-health-policy.md). Snapshot anomalies and feed-wide recovery remain governed by the [snapshot anomaly and recovery cases](snapshot-anomaly-and-recovery-cases.md); time and identity remain governed by the [time and train continuity policy](time-and-train-continuity-policy.md); admission and ordering remain governed by the [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md).

The [arrival confidence and ghost policy](arrival-confidence-and-ghost-policy.md), [evidence veto catalog](evidence-veto-catalog.md), and [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md) retain authority over confidence, negative evidence, and service or track conflicts. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). Rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md).

This policy is **Draft**. Its linked cases remain **Pending — Truth Gate** and cannot be treated as current guidance until approved.

## Public state and internal disposition are separate

Grace and quarantine are internal truth-control dispositions. They are never rider-visible confidence states and never authorize a visible train row.

| Evidence event | Internal disposition | Rider-visible consequence |
|---|---|---|
| First accepted absence from one otherwise healthy complete snapshot | Keep one uncertain continuity candidate in short internal grace. Start the absence clock at that snapshot's authoritative observation time. | Immediately remove **Live**, the exact countdown, and the row from the primary next-three. Do not replace it with Expected, Holding, Uncertain, Scheduled, or a static trip merely to preserve the row. |
| One impossible stop-order regression | Quarantine the candidate for confirmation. Record the regressed sequence and preserve identity evidence for comparison. | Remove the exact countdown and primary row because plausible stop order no longer passes admission. Do not expose “grace” or “quarantine” as copy. |
| A hard-suppression cause | Mark the train or exact stop claim suppressed and retain only the non-personal quality record defined below. | No affected arrival row, countdown, confidence downgrade, or dependent guidance survives. Show only the narrowest supported board-level consequence or service-change explanation. |
| Recovery update one | Keep the candidate internal while the recovery sequence is incomplete. | No exact countdown and no primary eligibility. One apparently good update is insufficient. |
| Recovery update two | Complete full readmission only if both updates prove all five conditions and every current Live admission gate passes. | One supported Live row and exact countdown may return. Task 9 recovery cannot restore Expected; without current movement or stop progress, exact countdown and primary eligibility remain absent. |

Disappearance alone never proves cancellation. A cancellation label or explanation requires separate current cancellation evidence. During first-snapshot grace and after hard suppression caused only by absence, the product says no more than the available evidence supports, such as fewer verified arrivals.

## Healthy complete-snapshot absence

An absence counts only when an accepted snapshot is:

- for the same route/feed group and observation sequence;
- Current, validly decoded, non-regressed, coherent, and otherwise healthy;
- complete for the entity population it claims to replace; and
- not a bulk-drop, suspicious-emptiness, multi-feed loss, malformed, partial, or other snapshot anomaly.

An incomplete, anomalous, stale, malformed, or regressed update neither establishes a healthy absence nor counts as a second healthy absence. It is handled under feed-health and anomaly policy. It also cannot restore the missing entity.

For a previously visible train, the first accepted healthy complete snapshot that omits the entity immediately ends public precision and primary eligibility. Grace exists only to determine whether the same train returns coherently or whether hard suppression is required. Grace never continues a public countdown, consumes a next-three slot, creates **Arrival uncertain**, or implies cancellation.

## Deterministic absence boundaries

Two independent hard-suppression tests run after the first qualifying absence:

1. **Count test:** the same entity is absent from a second consecutive accepted healthy complete snapshot.
2. **Elapsed test:** authoritative elapsed time since the first qualifying absence reaches at least 60 seconds.

Whichever test qualifies first causes hard suppression.

| Boundary | Required decision |
|---|---|
| First healthy complete-snapshot absence at 0 seconds | Immediate loss of Live, exact countdown, and primary slot; internal grace only. |
| A later observation at 59 seconds with no second healthy complete absence | Remain in internal grace. The public row remains absent. Hard suppression has not yet occurred from elapsed time. |
| Exactly 60 seconds since the first qualifying absence | Hard suppress. “At least 60 seconds” includes exactly 60 seconds. |
| Second consecutive healthy complete-snapshot absence before 60 seconds | Hard suppress immediately; do not wait for 60 seconds. |
| Incomplete or anomalous update between absences | Do not count it as a first or second healthy absence. Once a qualifying first absence exists, it does not restore the entity or restart the absence clock; feed-health rules may impose a stricter board state. |

The consecutive-count test concerns accepted healthy complete snapshots. A nonqualifying intervening update cannot manufacture a second absence. A later accepted healthy complete snapshot that again omits the entity is the next countable absence for the established episode; if it is the second countable absence, hard suppression follows. The elapsed test continues from the first qualifying absence and independently qualifies at exactly 60 seconds.

## Hard-suppression causes

Hard suppression occurs immediately when any applicable cause below is established, except where the row explicitly requires confirmation:

| Cause | Trigger | Scope and consequence |
|---|---|---|
| Target removed | The exact directional target stop is no longer in the train's coherent ordered remaining-stop sequence. | Suppress the claim at that target immediately. Static or normal-pattern inclusion cannot restore it. |
| Repeated or elapsed healthy absence | The entity is absent from two consecutive accepted healthy complete snapshots, or the established absence lasts at least 60 seconds. | Suppress the train claim. Do not infer cancellation from absence alone. |
| Arrival expired without continuing evidence | The predicted arrival has passed and no continuing coherent train, movement, stop-progress, or stop-call evidence supports the event. | Suppress the expired event; do not keep a past countdown or reconstruct a future call. |
| Twice-confirmed stop-order regression | An impossible regression appears in one accepted coherent update and is confirmed by a second accepted coherent update. | First regression quarantines internally and removes public precision; the second confirmation hard-suppresses. A single regression alone does not satisfy this hard-suppression cause. |
| Weaker confident duplicate | One-to-one continuity evidence confidently establishes that two records represent one train and identifies the weaker duplicate. | Hard-suppress the weaker record immediately. Keep only the stronger coherent instance if it independently passes every admission gate. |
| Cancellation | Current authoritative evidence explicitly establishes cancellation in the supported train or trip scope. | Suppress within that scope and use only approved cancellation language. Absence is not cancellation evidence. |
| Bypass | Current resolved, scoped evidence establishes that the train will bypass the exact target and direction. | Suppress at the affected exact stop and direction. |
| Suspension | A current suspension covers the train, route, segment, stop, direction, and time scope at issue. | Suppress only within the resolved affected scope. |
| Invalidating track conflict | A non-terminal actual-versus-scheduled-track conflict or other current track/path conflict invalidates the target or downstream prediction. | Suppress affected arrivals and dependent guidance. One later coherent path update begins recovery only; require the full two-update sequence and all five conditions before readmission. Normal terminal variation is not enough. |

These causes are independent. A train suppressed for absence does not need a cancellation explanation, and a train suppressed for a bypass or target removal does not remain eligible merely because it is still present in the feed.

A resolved, scoped bypass is the hard-suppression cause above. When a high-impact bypass or reroute may affect service but material scope remains unresolved, fail closed under the [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md): withhold the affected row as **arrival claim unavailable** and preserve the official message. Do not mislabel that unresolved Task 6 state as a resolved bypass or resolved hard suppression.

## Stop-order confirmation

One impossible stop-order regression is material contradictory evidence, so the candidate immediately loses its exact countdown and primary eligibility and enters internal quarantine. It is not yet hard-suppressed under the twice-confirmed regression cause.

A second accepted coherent update confirming the impossible regression hard-suppresses the candidate. A repeated copy of the same unadvanced snapshot is not an independent confirmation. If a later update instead presents a plausible coherent order, it begins recovery review; it does not instantly restore precision.

## Exact-countdown and primary recovery

Recovery requires two fresh coherent accepted updates for the same candidate after the precision loss or suppression event. Both updates must be newer than the controlling adverse evidence. Each update must be internally coherent and free of a new veto; together the pair must confirm all five conditions:

1. **Stable identity:** one coherent train instance persists without ambiguous merge, split, churn, or weaker duplicate.
2. **Plausible stop order:** remaining stops advance or remain operationally plausible without an impossible regression.
3. **Current movement or progress:** accepted movement or stop-progress evidence is current enough for the proposed Live treatment.
4. **Target still served:** the exact directional target remains in the coherent stopping pattern.
5. **No unresolved service or track conflict:** no cancellation, bypass, suspension, closure, planned-pattern exclusion, unresolved reroute, or invalidating track/path conflict applies.

The pair is qualifying only when no required condition is missing, stale, contradictory, or materially unresolved. Evidence may accumulate across the two updates, but neither update may contradict any of the five conditions, and the second must leave all five currently established. Stable identity and continued target service must be demonstrated across the pair, not asserted from one isolated record.

After the first qualifying update, keep the candidate outside the primary next-three and do not show an exact countdown. After the second qualifying update, reevaluate every Live admission gate. Task 9 recovery completes only when current movement or stop progress and the other four conditions remain established and every Live gate passes; then one supported Live row and exact countdown may return.

If current movement or stop progress is absent, five-condition recovery is incomplete even when the other four conditions hold across two updates. Exact countdown and primary eligibility remain absent, and this branch cannot restore Expected. Independently supported non-primary Holding or Uncertain context may appear only under the [arrival confidence and ghost policy](arrival-confidence-and-ghost-policy.md); that secondary context is not Task 9 recovery and must not be described as completing it.

## Complete and incomplete recovery

| Recovery sequence | Decision |
|---|---|
| One fresh coherent update proves all five conditions | Recovery remains incomplete. No exact countdown or primary eligibility returns. |
| Two consecutive fresh coherent accepted updates collectively prove all five conditions and the second leaves every Live gate passing | Recovery is complete; one supported Live row and exact countdown may return after full readmission. |
| First update qualifies; second is incomplete, stale, malformed, regressed, contradictory, anomalous, or lacks any required condition | The second update does not count and breaks confirmation. Keep the public row absent and restart the two-update sequence from the next qualifying update. |
| Two updates are fresh but identity changes ambiguously, stop order is implausible, current movement/progress is absent, the target is missing, or a service/track conflict remains | Recovery is incomplete. Exact countdown and primary eligibility remain absent. Do not restore Expected, average evidence, downgrade through Task 9, or infer through the missing condition. Any independently supported secondary Holding or Uncertain context remains a Task 8 decision, not completed recovery. |
| Feed-level recovery also applies | Both the route/feed-group recovery rule and this train-level two-update rule must pass. Use the stricter incomplete state; one sequence cannot waive the other. |

## Non-personal quality-review record

Suppressed records may be preserved only for non-personal quality review of false removals, missed ghosts, duplicate handling, and recovery behavior. The record may contain operational evidence needed to reproduce the decision: route/feed group, source and train identifiers, service date, authoritative timestamps, remaining-stop sequences, target stop and direction, movement/progress evidence, trigger, board disposition, and recovery evidence.

Do not attach a suppressed-record review entry to a rider account, saved commute, device identifier, notification token, precise rider location, search history, or other personal or linkable rider data. Do not reuse it for personalization, rider profiling, advertising, or a rider-visible history. Access, retention, correction, and deletion follow the approved non-personal quality and operations controls; this policy creates no new retention period.

## Review record

For every grace, suppression, and recovery decision, preserve:

1. route/feed-group health and whether each snapshot was accepted, healthy, and complete;
2. authoritative observation times, absence count, elapsed absence, and the exact 59/60-second decision when applicable;
3. coherent identity, target stop, ordered remaining stops, movement/progress, service-change, and track evidence;
4. the precise trigger, including first versus second absence and first versus twice-confirmed stop-order regression;
5. internal grace, quarantine, suppression, and recovery dispositions separately from the rider-visible result;
6. the two recovery updates and proof of all five recovery conditions;
7. exact countdown, primary eligibility, board message, and confirmation that cancellation was not inferred from disappearance; and
8. the non-personal quality-review record and applicable access control.

Unknown, incomplete, stale, contradictory, or materially unresolved evidence cannot preserve or restore an exact countdown or primary slot.
