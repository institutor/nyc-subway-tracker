# Commute deduplication decision table

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 27, 28.2–28.3, 31.6 scenarios 36–39, 31.7–31.8, and 33.5; commute alerts and launch quality plan Task 6; accepted immutable Commute Tasks 2–5 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-deduplication-scenarios.md#pending-execution-record) |

## Purpose and authority

This table applies the [disruption episode contract](disruption-episode-contract.md) to one frozen notification evaluation. It consumes the [Task 2 gates](notification-eligibility-contract.md), [Task 3 thresholds](delay-threshold-policy.md), [Task 4 lifecycle and permission states](../ux/commute-window-state-matrix.md), and Task 5 [timing](notification-timing-policy.md), [copy](../content/commute-notification-library.md), and [recovery](recovery-notification-policy.md) rules without weakening them.

Every completed evaluation has exactly one **Send**, **Suppress**, or **Hold for stronger evidence** outcome plus a separate class and reason. This table does not define source truth, rider copy, transport success, retention, or launch.

This is unapproved **Draft product policy**, not an MTA guarantee. No row is a run or approval. **NO-GO — GATE 0 NOT PASSED** and **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** remain independent blockers.

## Product Governance alignment

The product artifact index and this header align on the full Task 6 provenance, Commute Product ownership, and the six-role reviewer set. Both remain **Draft**, approval evidence remains **Pending**, and index alignment is not approval or execution evidence.

## Outcome, class, and reason contract

| Outcome | Allowed class | Required meaning |
|---|---|---|
| **Send** | **Initial**, **Escalation**, or **Recovery** | Candidate may proceed only after the immediate Task 5 final recheck; this is not evidence that delivery succeeded |
| **Suppress** | **Ineligible**, **Duplicate**, **Below material change**, **Recovery ineligible**, **Correction only**, or **Current-only expiry** | Create no notification handoff and never queue the candidate |
| **Hold for stronger evidence** | **Eligibility unresolved**, **Identity unresolved**, **Recovery unresolved**, or **Final recheck unresolved** | Send nothing; only the controlling missing evidence may transition the state. For an unresolved acknowledgment, only exact authoritative resolution or occurrence expiry closes its lock |

The reason records the exact failed, unresolved, duplicate, material, delivery-acknowledgment, recovery, or correction branch. Never use a score, majority, severity word, or fallback outcome.

## Deterministic decision order

Apply all ten steps in order:

1. **Freeze evaluation.** Bind authoritative evaluation time, fixed product/artifact/source versions, occurrence, journey/window inputs, and current evidence.
2. **Consume Task 2.** Any gate Fail → **Suppress / Ineligible**. No Fail plus any Unresolved → **Hold for stronger evidence / Eligibility unresolved**. All twelve Pass → continue.
3. **Exclude invalid evidence.** Preserve but exclude owner-rejected or quarantined observations from identity, impact, release, and recovery.
4. **Normalize identity.** Resolve incident root, narrow episode, journey occurrence, equivalent windows, delivery group, and current impact fingerprint. Ambiguous required linkage → **Hold / Identity unresolved**.
5. **Resolve delivery memory.** Load only the last successfully delivered fingerprint for the same group and any active **Delivery unresolved — acknowledgment Unknown** record. Attempts, failures, Unknown acknowledgments, Holds, Suppresses, Seen state, and copy-only candidates are not baselines.
6. **No prior successful delivery.** An active unresolved-attempt lock covering the same occurrence, delivery group, and equivalent or dependent impact → **Hold for stronger evidence / Final recheck unresolved**. Suppress an already represented equivalent-window candidate. Otherwise all-Pass current evidence → **Send / Initial**.
7. **Prior delivery.** Equivalent → **Suppress / Duplicate**. Any named material branch → **Send / Escalation**. Improvement or release enters recovery. Otherwise → **Suppress / Below material change**.
8. **Apply recovery.** Send only if all seven Task 5 recovery gates Pass. Any recovery Fail suppresses; no Fail plus any Unresolved holds.
9. **Rerun final checks.** Immediately recheck lifecycle, permission, connectivity, `[P,E)`, freshness, scope, veto, alternative, material state, represented windows, prior successful delivery, and active unresolved-attempt locks. Fail suppresses; Unresolved holds.
10. **Write after result.** Write a new initial/escalation baseline and represented-window markers only after authoritative successful-delivery evidence. Failed and Unknown delivery results write neither; Unknown writes only the conservative unresolved-attempt record. Recovery never becomes an escalation baseline.

No step queues content for later replay.

## Deterministic decision rows

Each row assumes every prerequisite not named as failing or unresolved Passes. “Baseline” always means the last successfully delivered same-group fingerprint.

| ID | Frozen decisive facts | Outcome | Class | Exact reason and state effect |
|---|---|---|---|---|
| `DDT-01` | Any Task 2 gate Fails | **Suppress** | **Ineligible** | Record exact failed gate; do not normalize a rider candidate |
| `DDT-02` | No Task 2 Fail; one or more gates Unresolved | **Hold for stronger evidence** | **Eligibility unresolved** | Send nothing; only newer accepted evidence can restart evaluation |
| `DDT-03` | Required observation is quarantined; no accepted evidence resolves identity and no definite gate Fail exists | **Hold for stronger evidence** | **Identity unresolved** | Quarantined evidence cannot participate |
| `DDT-04` | Generic **Affected** supplies no exact scope or decision change | **Suppress** | **Ineligible** | Task 2 impact/decision gate Fails; no broad message |
| `DDT-05` | Cross-source root, split, or merge remains ambiguous | **Hold for stronger evidence** | **Identity unresolved** | Preserve provisional roots; do not merge |
| `DDT-06` | Coherent alert and live degradation describe one exact fact; no successful baseline or active unresolved-attempt lock | **Send** | **Initial** | Normalize one candidate, not one per source |
| `DDT-07` | Accepted alert veto conflicts with positive prediction; exact adverse candidate passes all gates; no baseline | **Send** | **Initial** | Negative evidence controls; render no served-stop claim |
| `DDT-08` | Accepted supplemented planned pattern reaches its Task 5 opportunity; no baseline | **Send** | **Initial** | Future-effective planned candidate; no movement claim |
| `DDT-09` | Static GTFS is the only claimed current disruption or release evidence | **Suppress** | **Ineligible** | Static data cannot create current truth or recovery |
| `DDT-10` | Exact source record replays after successful same-group delivery | **Suppress** | **Duplicate** | Existing marker and baseline remain |
| `DDT-11` | Only wording, punctuation, translation, ordering, or copy changes | **Suppress** | **Duplicate** | Normalized fingerprint is equivalent |
| `DDT-12` | Only retrieval time, wrapper, source ID, or source timestamp changes | **Suppress** | **Duplicate** | Packaging churn is not rider consequence |
| `DDT-13` | Feed resumes without a new exact journey consequence or verified release | **Suppress** | **Duplicate** | Episode remains continuous; no recovery |
| `DDT-14` | Alert and live source independently repeat the same delivered fact | **Suppress** | **Duplicate** | Cross-source agreement adds evidence, not a message |
| `DDT-15` | Equivalent recurring planned work or Unknown Seen reminder state | **Suppress** | **Duplicate** | Preserve one summary; Unknown cannot create reminder |
| `DDT-16` | Baseline family changes but no named material branch passes | **Suppress** | **Below material change** | Never switch comparison family to manufacture change |
| `DDT-17` | Ordered owner severity is strictly higher than baseline | **Send** | **Escalation** | Severity branch Pass; one escalation |
| `DDT-18` | Severity value is missing, free text, or lacks approved order; no other branch passes | **Suppress** | **Below material change** | Severity branch cannot pass |
| `DDT-19` | New exact relevant station appears | **Send** | **Escalation** | New-scope branch Pass |
| `DDT-20` | New normalized relevant direction appears | **Send** | **Escalation** | New-direction branch Pass |
| `DDT-21` | Station edit is outside the exact journey or normalized direction is unchanged | **Suppress** | **Below material change** | No relevant scope branch |
| `DDT-22` | Current verified action changes | **Send** | **Escalation** | Action branch Pass; new action remains unselected |
| `DDT-23` | Baseline action becomes invalid and no verified alternative remains | **Send** | **Escalation** | Action branch Pass with exact no-verified-alternative result |
| `DDT-24` | Only an unverified alternative or action wording changes | **Suppress** | **Below material change** | Unsafe/unverified change cannot establish action branch |
| `DDT-25` | Current unrounded journey estimate is 299 seconds worse | **Suppress** | **Below material change** | Added-time branch Fails without rounding |
| `DDT-26` | Current unrounded journey estimate is exactly 300 seconds worse | **Send** | **Escalation** | Inclusive added-time boundary Passes |
| `DDT-27` | Current unrounded journey estimate is 301 seconds worse | **Send** | **Escalation** | Added-time branch Passes |
| `DDT-28` | Extension into actual window is 1,799 seconds | **Suppress** | **Below material change** | Extension branch Fails without rounding |
| `DDT-29` | Extension into actual window is exactly 1,800 seconds | **Send** | **Escalation** | Inclusive extension boundary Passes |
| `DDT-30` | Extension into actual window is 1,801 seconds | **Send** | **Escalation** | Extension branch Passes |
| `DDT-31` | Estimated-end movement is wholly beyond exclusive window end | **Suppress** | **Below material change** | `min` formula adds zero in-window time |
| `DDT-32` | Several named branches Pass in one frozen evaluation | **Send** | **Escalation** | Produce exactly one escalation; one successful baseline replacement |
| `DDT-33` | Pending undelivered delay is superseded by a current confirmed bypass before any delivery | **Send** | **Initial** | One current bypass candidate replaces the pending delay; no delay baseline exists |
| `DDT-34` | Current bypass arises after a delay delivered for the same root/group and a named branch Passes | **Send** | **Escalation** | Sibling bypass episode produces one escalation, not another initial |
| `DDT-35` | First equivalent overlapping-window candidate has all gates Pass; no successful baseline or active unresolved-attempt lock | **Send** | **Initial** | Surviving candidate represents every equivalent window |
| `DDT-36` | Extra equivalent overlapping-window candidate is already represented | **Suppress** | **Duplicate** | Gate 12 Fails; preserve every window and mark all after delivery |
| `DDT-37` | Represented window is later edited, renamed, deleted, or recreated for the same journey occurrence | **Suppress** | **Duplicate** | Ledger marker persists; no resend |
| `DDT-38` | Route, normalized direction, occurrence, journey scope, or path requirement differs materially | **Send** | **Initial** | Distinct delivery group remains independently eligible |
| `DDT-39` | Independent incident/root produces an independently eligible exact candidate | **Send** | **Initial** | Retain separate identity; do not invent bundled copy |
| `DDT-47` | Final recheck has a definite lifecycle, permission, connectivity, window, freshness, scope, veto, alternative, material, or history Fail | **Suppress** | **Ineligible** | Do not hand off or write baseline |
| `DDT-48` | Final recheck has no Fail but a material item remains Unresolved | **Hold for stronger evidence** | **Final recheck unresolved** | Send nothing; no baseline write |
| `DDT-49A` | Initial handoff is eligible, but transport attempt fails | **Send** | **Initial** | Record failed delivery; write no baseline or window marker; never replay old content |
| `DDT-49B` | Escalation handoff is eligible, but transport attempt fails | **Send** | **Escalation** | Record failed delivery; retain prior baseline and window markers; never replay old content |
| `DDT-49C` | Initial handoff occurs, but the delivery acknowledgment is Unknown | **Send** | **Initial** | Append **Delivery unresolved — acknowledgment Unknown**; write no successful baseline or represented-window marker; activate the exact unresolved-attempt lock |
| `DDT-49D` | Escalation handoff occurs, but the delivery acknowledgment is Unknown | **Send** | **Escalation** | Append **Delivery unresolved — acknowledgment Unknown**; retain the prior successful baseline and markers without replacement; activate the exact unresolved-attempt lock |
| `DDT-49E` | Recovery handoff occurs, but the delivery acknowledgment is Unknown | **Send** | **Recovery** | Append **Delivery unresolved — acknowledgment Unknown**; retain the disruption baseline; write no recovery marker; activate the exact unresolved-attempt lock |
| `DDT-49F` | A current candidate is equivalent to, or requires comparison with, the same occurrence/group impact covered by an active unresolved-attempt lock | **Hold for stronger evidence** | **Final recheck unresolved** | Send nothing; do not retry, replay, correct, recover, or write a successful baseline; only authoritative resolution or occurrence expiry can close the active lock |
| `DDT-50` | Recovery setting was Off at original delivery or is Off now | **Suppress** | **Recovery ineligible** | Prospective consent gate Fails |
| `DDT-51` | No original successful disruption delivery exists | **Suppress** | **Recovery ineligible** | Attempted, failed, Unknown, held, or suppressed candidate is not enough |
| `DDT-52` | Recovery release evidence is incomplete with no definite recovery Fail | **Hold for stronger evidence** | **Recovery unresolved** | Retain prior warning/action while opportunity remains |
| `DDT-53` | All seven recovery gates Pass for same episode/impact/occurrence | **Send** | **Recovery** | At most one recovery; never an escalation baseline |
| `DDT-54` | Equivalent recovery already delivered for the impact | **Suppress** | **Duplicate** | One recovery maximum |
| `DDT-55` | Disappearance, effective end, one omission, correction, static data, or generic absence is the only recovery evidence | **Suppress** | **Recovery ineligible** | No release or all-clear claim |
| `DDT-56` | Evidence disappears and later reappears without verified release after prior delivery | **Suppress** | **Duplicate** | Same episode and delivery baseline continue |
| `DDT-57` | Verified release closed the lineage; a later independently accepted effective interval now passes all gates | **Send** | **Initial** | Create a new episode; do not reopen the closed one |
| `DDT-58` | Correction only narrows or clarifies a supported claim | **Suppress** | **Correction only** | Preserve transformation; no standalone push or baseline change |
| `DDT-59` | Correction accompanies independent current evidence that passes a named branch | **Send** | **Escalation** | Independent evidence supports the message, not the correction |
| `DDT-60` | Standalone correction/retraction is requested without an approved pattern or material branch | **Suppress** | **Correction only** | No template or authorization exists |

## Quarantined quiet-period proposals

`DDT-40`–`DDT-46` preserve the original 900-second idea only as unapproved design input. They are not decision rows, are not part of the deterministic order, cannot be executed or marked Pass/Fail, supply no gate input, and have no Send, Suppress, Hold, class, or reason.

| Proposal ID | Unapproved proposed input | Governance disposition |
|---|---|---|
| `DDT-40` | An unrelated non-severe initial incident at 899 seconds after another delivery | **Draft proposal — non-executable; no outcome** |
| `DDT-41` | The same kind of incident exactly 900 seconds after another delivery | **Draft proposal — non-executable; no outcome** |
| `DDT-42` | The same kind of incident 901 seconds after another delivery | **Draft proposal — non-executable; no outcome** |
| `DDT-43` | A proposed severe-impact exception during the proposed interval | **Draft proposal — non-executable; no outcome** |
| `DDT-44` | A proposed escalation exception during the proposed interval | **Draft proposal — non-executable; no outcome** |
| `DDT-45` | A proposed recovery exception during the proposed interval | **Draft proposal — non-executable; no outcome** |
| `DDT-46` | A proposed expiry-boundary currentness check | **Draft proposal — non-executable; no outcome** |

No product behavior may collect a quiet-period timestamp, apply the proposed interval, suppress or send because of it, bypass it, or treat it as an evaluation record until Product, Content, Operations, Privacy, and Release Quality approve a replacement policy and fixed evidence.

## Conservative Unknown delivery-acknowledgment ledger

There is one acknowledgment mechanism for every delivery attempt. When authoritative delivery evidence proves neither Success nor Failed, append the exact controlled state **Delivery unresolved — acknowledgment Unknown**. Unknown is not a third kind of delivery success or failure.

The single unresolved-attempt record contains only the immutable attempt ID; occurrence key and confirmed preference version; delivery-group ID; represented episode/impact IDs; frozen normalized impact fingerprint; frozen message class and payload version; authoritative attempt time; acknowledgment state Unknown; and empty resolution evidence. It writes no successful baseline, represented-window marker, recovery entitlement, Seen state, correction entitlement, or retry entitlement.

The active unresolved-attempt lock covers the same occurrence, delivery group, and any candidate equivalent to or dependent on the unresolved impact, even if a window or preference edit leaves that normalized scope unchanged. It does not block an independently proven different occurrence or delivery group. While active, it forces **Hold for stronger evidence / Final recheck unresolved** for covered future action so a potentially delivered message cannot be duplicated.

| Authoritative transition | Ledger and delivery-memory effect | Notification effect |
|---|---|---|
| Unknown remains unresolved | Preserve the same append-only record and active lock; baseline and markers remain unchanged | No retry, replay, correction, recovery, or dependent future delivery |
| Authoritative Success resolves the exact attempt | Append Success evidence; close the lock; apply the original frozen class’s ordinary successful-delivery rule: initial/escalation writes its baseline and markers, while recovery preserves that baseline and writes only its exact recovery marker | Resolution itself sends nothing; current later candidates receive a fresh evaluation |
| Authoritative Failed resolves the exact attempt | Append Failed evidence; close the lock; write no baseline or marker | Never retry or replay the original; only a fresh current independently eligible evaluation may create a new attempt |
| Occurrence expires before authoritative resolution | Append **Expired unresolved** without converting Unknown to Success or Failed; close only the active occurrence lock; write no baseline or marker | No late send, retry, replay, recovery, or correction; a later occurrence is independent |

An inferred provider state, elapsed time, process restart, queue absence, message visibility, Seen state, or operator assumption cannot resolve Unknown.

## Baseline and marker write rules

| Delivery result | Baseline | Represented-window markers | Episode history |
|---|---|---|---|
| Candidate suppressed or held | Unchanged | Unchanged | Append decision and reason |
| Send candidate transport fails | Unchanged | Unchanged | Append attempt/failure; no replay entitlement |
| Delivery acknowledgment Unknown | Unchanged; never write a successful baseline | Unchanged | Append the unresolved-attempt record and activate its exact lock |
| Unknown authoritatively resolves to Success | Apply the original frozen class: write or replace for initial/escalation; never replace the disruption baseline for recovery | Mark represented windows for initial/escalation or the exact recovery impact for recovery | Append authoritative resolution; close the lock; send nothing from resolution alone |
| Unknown authoritatively resolves to Failed | Unchanged | Unchanged | Append authoritative resolution; close the lock; no retry or replay |
| Occurrence expires while acknowledgment remains Unknown | Unchanged | Unchanged | Append Expired unresolved; close the active occurrence lock; no late action |
| Initial successfully delivered | Write delivered fingerprint | Mark every equivalent represented window | Append successful delivery linkage |
| Escalation successfully delivered | Replace with escalation fingerprint | Preserve/add represented windows | Append old and new baseline linkage |
| Recovery successfully delivered | Never replace escalation baseline | Mark recovery for exact delivered impact only | Append recovery linkage |
| Verified silent close | Unchanged historical baseline | Preserve historical markers | Append release and close |

Window edits cannot delete history. Seen state never controls delivery success or baseline identity.

## Independent incidents and release

Two roots may each produce an independently eligible candidate. Mark multiple represented episodes against one delivery only if an already-approved message pattern exactly expresses them all; otherwise keep separate candidates and never invent bundled copy. Release or recovery for one root/episode/group changes no other incident.

## Required decision record

Every evaluation binds the complete record required by the episode contract, including all frozen versions and authoritative times, four identity layers, evidence exclusions, current and delivered fingerprints, represented windows, active unresolved-attempt record and resolution evidence, exact Task 2–5 decisions, one outcome, class/reason, final recheck, attempt/result, baseline write/no-write, expected/prohibited output, and separate actual, six reviewer/date, durable evidence, correction, preserved original, rerun, and status fields. Quarantined quiet-period proposals are not evaluation inputs or records.

## Explicit gaps

The 900-second quiet-period proposal, provider-specific evidence that can authoritatively resolve Unknown to Success or Failed, cross-source severity order, canonical MTA incident/campaign identifier, non-overlap continuity tolerance, Seen definition, standalone correction/retraction pattern, multi-incident bundled copy, and Task 7 retention/reset/deletion decisions are **Pending**. The quiet proposal is not collected, applied, or used as gate input. The conservative Unknown state and lock apply without inventing a provider mapping. No real evaluation, delivery, reviewer approval, pilot, or launch evidence exists.

## Draft review checklist

- [ ] The ten-step order produces exactly one outcome plus class/reason.
- [ ] Rejected/quarantined evidence and ambiguous identity cannot Send.
- [ ] Cross-source agreement creates one candidate and negative evidence retains precedence.
- [ ] Every equivalent edit suppresses without changing baseline.
- [ ] All five material branches and exact 299/300/301 and 1799/1800/1801 boundaries are deterministic.
- [ ] Equivalent windows share markers; distinct groups and incidents remain independent.
- [ ] `DDT-40`–`DDT-46` remain quarantined, non-executable, outcome-free, and absent from gates and evaluation records.
- [ ] Unknown writes one unresolved-attempt record, never a successful baseline, and blocks only its exact duplicate-prone scope until authoritative resolution or occurrence expiry.
- [ ] Baselines and markers write only after successful delivery.
- [ ] Recovery and correction rows preserve Task 5 gates and append-only history.
- [ ] Every executable scenario actual and review field remains **Not run — Pending** or **Pending**; quarantined proposal records remain non-executable with approval Pending.

Every unchecked item blocks approval. Definitions are not evidence.
