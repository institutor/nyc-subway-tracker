# Commute alert correction policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 32.3, 33.5, and 34; commute alerts and launch quality plan Task 9; accepted immutable Commute Tasks 2–8 |
| Owner | Operations Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-alert-pilot-review-template.md#pending-drill-record) |

## Purpose and authority

This policy decides whether a commute-notification error requires candidate withdrawal, supported detail handling, a rider correction, ordinary escalation, or governed recovery. It does not establish transit truth, invent operational identity, write notification copy, clear a hold, or authorize release.

The [operations playbook](commute-alert-operations-playbook.md) owns containment and release. Accepted Tasks 2–7 own truth, eligibility, thresholds, timing, message classes, deduplication, capability, and privacy. The [incident log](commute-alert-incident-log-template.md) preserves evidence. Task 10 owns go/no-go.

This Draft is not an MTA guarantee. No correction class, channel, template, observed delivery, materiality review, correction, recovery, reviewer decision, or pilot evidence exists. Gate 0 remains **NO-GO — GATE 0 NOT PASSED**.

## Materiality boundary

A claim is materially wrong when the delivered meaning would cause a rider to make a materially wrong travel or accessibility choice because any of these were wrong:

- route, normalized direction, actual destination/terminal, segment, constituent, entrance/exit, transfer, or path;
- occurrence, effective period, currentness, or resolved state;
- service consequence, including delay, gap, bypass, reroute, short turn, suspension, closure, or blocking accessible-path loss;
- unrounded added time or its supported basis;
- recommended action; or
- an alternative that was unsafe, inaccessible, unavailable, or unverified.

Copy, punctuation, capitalization, source ID, wrapper time, timestamp-only renewal, translation-equivalent wording, and materially equivalent phrasing are not material by themselves. A copy-only change cannot create a new Task 6 impact, delivery, escalation, correction, or recovery.

When materiality is unresolved, use **Hold** and escalate to Commute Product, Data Quality, and the affected domain. Do not choose the less disruptive outcome by assumption.

## Exact five-step correction decision

Apply the first matching step:

| Step | Fixed condition | Required action | Rider communication | Prohibited action |
|---|---|---|---|---|
| 1. Not delivered | Candidate or queued copy is proven not successfully delivered | Cancel or withdraw it; append the exact reason and evidence; preserve the decision package; suppress future use of disproved evidence | None | Send a correction, mark a rider corrected, or late-send the withdrawn candidate |
| 2. Delivered and materially supported | The delivered core claim remains materially supported; only current nonmaterial detail changed | Preserve delivery and baseline; update current in-app details when their owner permits; continue current evaluation | No correction push | Manufacture materiality, duplicate delivery, or rewrite original copy/history |
| 3. Delivered and materially wrong | Successful delivery is proven and the claim meets the materiality boundary | Immediately hold affected delivery; preserve source, decision, payload evidence, and delivery result; mark exact state **Rider correction required**; escalate Product, Content, Operations, Data Quality, and affected Accessibility/Privacy lead | Only an approved correction class, channel, and fixed template may be used | Improvise correction/retraction copy, erase baseline, or release while the required remedy is unavailable |
| 4. Independent new worsening evidence | A new current accepted consequence is independently material under Tasks 5–6, rather than a correction of the prior evidence | Evaluate one ordinary Task 5/6 escalation with full current gates and deduplication | The approved ordinary escalation class/template only | Label it correction, bundle unrelated causes without approval, or send both correction and duplicate escalation |
| 5. Verified improvement or release | Prior disruption delivery exists; current evidence independently proves governed improvement/release; rider had prospectively enabled recovery updates; every Task 5 recovery and Task 6 identity/deduplication gate passes | Evaluate Task 5 recovery prospectively | The approved Task 5 recovery class/template only | Routine all-clear, retroactive opt-in, release-hold message, or recovery from mere feed/alert disappearance |

## Unknown acknowledgment correction boundary

An **Unknown acknowledgment** proves neither Step 1 nor any delivered branch. Task 6 must append **Delivery unresolved — acknowledgment Unknown**, write no successful baseline or represented-window marker, and activate the exact unresolved-attempt lock. Steps 2 and 3 require authoritative Success evidence; Step 1 requires authoritative proof of non-delivery. Unknown supplies neither.

While the lock is active, any same-occurrence, same-delivery-group candidate equivalent to or dependent on the unresolved impact remains **Hold for stronger evidence — Final recheck unresolved**. Never retry, replay, recover, correct, or write a successful baseline solely from Unknown. A preference or window edit that leaves normalized scope unchanged cannot evade the lock.

Only these append-only transitions are allowed:

| Transition | Correction effect |
|---|---|
| Authoritative Success resolves the exact immutable attempt | Close the lock and apply the original frozen class’s ordinary successful-delivery rule: initial/escalation may write its baseline and markers; recovery preserves that baseline and writes only its exact recovery marker. Then apply Step 2 or Step 3 to any materiality review; resolution itself sends nothing |
| Authoritative Failed resolves the exact immutable attempt | Close the lock and apply Step 1; write no baseline and never retry or replay the original |
| Occurrence expires while still Unknown | Append **Expired unresolved** without calling it Success or Failed; close only the active occurrence lock; no late delivery, recovery, or correction |

A correction allegation while delivery remains Unknown is recorded as **Delivery unresolved**, not **Rider correction required** or **Not delivered**. An independently proven different occurrence or delivery group may receive its own ordinary evaluation, but it cannot resolve or correct the Unknown attempt.

## Supported correction effects

When Step 3 has an approved rider-correction path, the remedy may only:

- narrow an unsupported route, direction, segment, constituent, occurrence, path, consequence, or time claim;
- withdraw or suppress future use of disproved evidence;
- remove an unsafe or unverified alternative;
- clarify the supported scope and decision consequence; or
- direct the rider to a separately verified current action.

A correction cannot:

- invent train identity, movement, stopping pattern, track, path, equipment operation, accessibility, alternative, severity, added time, clearance, or recovery;
- turn missing, stale, contradictory, or quarantined evidence into a positive claim;
- serve as new source evidence for a Send, board, route, accessibility path, or recovery;
- erase the original evidence, delivery, Task 6 ledger, delivered baseline, failure, or reviewer result;
- change saved commute state, alert intent, permission, ARO, or other routes;
- claim **Good service**, **All clear**, or MTA certainty; or
- bypass current Tasks 2–7, a switch hold, final queue check, or independent release approval.

A correction cannot serve as positive source, service, accessibility, delivery, or recovery evidence.

## No improvised correction message

No approved commute correction or retraction notification class, channel, or template exists. Operators and incident responders must not compose or send one. Content approval of ad hoc words during an incident does not create a reusable class.

A materially wrong successful delivery therefore remains a blocking incident in **Rider correction required** until:

1. Product approves the exact correction consequence and class;
2. Content approves a fixed visible and assistive template;
3. Data Quality verifies the supported corrected scope;
4. Accessibility and Privacy approve when their domains are affected;
5. Operations proves channel, queue, switch, and no-duplicate behavior; and
6. Release Quality completes fixed original-boundary, integrated, holdout, and shadow reruns.

Documentation alone is not an approved channel or correction.

## Correction decision record

Every correction review preserves:

| Field | Required content |
|---|---|
| Fixed package | Product/build and Tasks 2–9 versions; incident and correction-policy version |
| Original evidence | Source/effective/currentness timeline; accepted, rejected, quarantined, and unresolved evidence |
| Original decision | Eligibility, threshold, timing, class, identity/equivalence, capability, final check, expected/actual outcome |
| Delivery | No attempt, authoritative Success, authoritative Failed, **Delivery unresolved — acknowledgment Unknown**, or **Expired unresolved**; immutable attempt linkage and authoritative resolution evidence; Success is mandatory where Step 2 or 3 is used |
| Materiality | Exact before meaning, corrected supported meaning, rider choice consequence, and controlled material/not-material result |
| Containment | Hold scope, queue cancellation, final switch result, unaffected routes/boards, accessibility/privacy classification |
| Remedy | Applicable step, allowed narrowing/withdrawal/clarification, class/channel/template status, approvals |
| History | Original baseline and ledger preserved; append-only transition and reason; Unknown never overwrites a successful baseline or creates one |
| Recovery | Cause-specific prerequisites, corrected fixed version, reruns, remaining holds, current-only release, no replay |

The [incident log template](commute-alert-incident-log-template.md) records this non-personally. Exact personal evidence stays inside its Task 7 boundary.

## Relationship to ordinary update and recovery

| New evidence | Classification |
|---|---|
| Prior meaning remains supported; current detail changes without rider-choice consequence | Step 2; no correction push |
| Prior meaning was wrong at its authoritative decision time | Step 3; correction required and hold |
| Prior meaning was correct, then a new independent worsening occurs | Step 4; ordinary escalation |
| Prior disruption was correctly delivered and later verified improvement/release passes every prospective recovery gate | Step 5; Task 5 recovery |
| A hold is operationally released | **Release hold**, not a rider recovery or correction |
| A candidate went stale, ended, Offline, or outside-window before delivery | Step 1 plus Suppress where applicable; no late send |
| Delivery acknowledgment remains Unknown | **Delivery unresolved**; no Step 1–3 classification, retry, replay, recovery, correction, or successful-baseline write; covered future action remains Hold |

## Accessibility and privacy

An unsafe accessible alternative, wrong path consequence, missed blocking outage, or weakened ARO is material and requires Accessibility review. Cross-rider delivery, token misuse, post-delete/reset/revoke delivery, personal leakage, or reconstructable analytics requires Privacy containment; do not copy the personal evidence into this record.

Neither Accessibility nor Privacy error may be reduced to “copy only” without that domain lead’s approval and Data Quality evidence.

## Pending gaps

Correction/retraction class, channel, template, lock-screen behavior, provider-specific evidence mappings that can authoritatively resolve Unknown, seen state, severity ordering, remote token lifecycle, numeric “promptly,” and the Task 6 quiet-period proposal remain Pending. The quiet proposal is not applied or used as gate input. The conservative Unknown state, lock, transitions, and correction prohibition apply without inventing a provider mapping.

## Draft review checklist

- [ ] Materiality is tied to a rider decision, not wording churn.
- [ ] The first matching one of exactly five steps controls.
- [ ] Unknown acknowledgment writes only the unresolved-attempt record, never a successful baseline, and is never assumed, retried, replayed, recovered, or used to trigger correction.
- [ ] The exact Unknown lock remains until authoritative resolution or occurrence expiry and cannot be evaded by an equivalent preference/window edit.
- [ ] Step 3 preserves evidence and exact state **Rider correction required**.
- [ ] No correction class, channel, or copy is improvised.
- [ ] Ordinary escalation, Task 5 recovery, and Release hold remain distinct.
- [ ] Original evidence, baseline, ledger, failure, correction, and rerun remain append-only.

Every unchecked item blocks approval. This documentation commit is not evidence.
