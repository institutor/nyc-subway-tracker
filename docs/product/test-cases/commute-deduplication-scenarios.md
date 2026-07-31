# Commute deduplication scenarios

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 27, 28.2–28.3, 31.6 scenarios 36–39, 31.7–31.8, and 33.5; commute alerts and launch quality plan Task 6; accepted immutable Commute Tasks 2–5 artifacts |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record) |

## Purpose and authority

`DED-01`–`DED-46` are fixed synthetic definitions for the [disruption episode contract](../commute/disruption-episode-contract.md) and [deduplication decision table](../commute/deduplication-decision-table.md). They distinguish evidence replay, identity ambiguity, initial delivery, escalation, quiet suppression, recovery, correction, and independent incidents.

This artifact is **Draft**. **NO-GO — GATE 0 NOT PASSED** and **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** remain in force. Every route, station, path, source, incident, message, and result below is synthetic. No real rider, service fact, product/build, run, delivery, reviewer decision, approval, pilot, or launch evidence exists.

## Product Governance reconciliation

The product artifact index has not been reconciled to the full Task 6 provenance or six-role review set. Product Governance reconciliation is **Pending**. This task does not edit the index.

## Fixed inherited input contract

`DED-T6-POLICY-v1` identifies these definitions. Accepted Tasks 2–5 are fixed to artifact state at base commit `33af4d48f5a6d2d482041cdf2bf94f3c6d8b9a01`. Each row binds immutable package `DED-xx-SRC-v1`; the Task 6 version is the exact commit containing this pack. Fixed product/build remains **Pending**, so no definition is executable or passed.

Every fixture inherits every value below unless its row explicitly replaces it. The inherited record plus the row is the fixture’s complete fixed input; no omission means “any.”

| Required input | Fixed inherited value |
|---|---|
| Evidence identities | `ALERT-SYN-DED-xx-A/v1`, source type service alert, accepted `2026-08-03T11:39:30Z`, wrapper time recorded separately, effective `[2026-08-03T11:30:00Z, 2026-08-03T13:00:00Z)`, original text and structured fields fixed in the package |
| Currentness/quarantine | Current, coherent, source-health Pass, anomaly Pass, structured/text scope agrees, not quarantined |
| Root/episode | `ROOT-SYN-DED-xx-A`; `EP-SYN-DED-xx-A`; explicit fixture linkage; exact F service, Downtown bound toward Coney Island, ordered Fixture Origin → Fixture Transfer → Fixture Destination segment, controlled type delay/gap, effective lineage `LIN-SYN-DED-xx-A/v1` |
| Delivery group | `GRP-SYN-DED-xx-A`; exact occurrence `OCC-SYN-DED-xx-20260803`; normalized origin, transfer, destination, direction, and standard path requirement |
| Commute/window/lead | `WIN-SYN-DED-xx-A`; Active and Confirmed; permission Granted; connected; America/New_York Monday 2026-08-03; `L=1,800s`, `P=7:30 AM`, `S=8:00 AM`, `E=9:00 AM`; evaluation `2026-08-03T11:40:00Z` / 7:40 AM |
| Tasks 2–3 | All twelve Task 2 gates Pass; Task 3 threshold/persistence Pass for inferred delay, or exact confirmed-impact exception Pass when overridden |
| Current fingerprint | Affected saved segment/direction; severity Not applicable with no scale; verified action **Use Fixture Alternate A.**; unrounded added time `600s` with fixed basis; active end 8:00 AM; exact evidence/effective-period version |
| Prior delivery/baseline | None; no represented-window marker, attempt, or successful delivery |
| Recovery | `recovery_updates=Off` at original/current; no release evidence; no recovery delivered |
| Quiet | No prior journey-occurrence delivery starts quiet; `Q=900` authoritative seconds is an unapproved Draft fixture input, not an MTA guarantee |
| Final checks | Task 5 lifecycle, permission, connectivity, window, freshness, scope, veto, alternative, material state, and prior-delivery recheck all Pass |
| Expected rendering | An eligible candidate uses the applicable accepted Task 5 pattern; visible and assistive output carry identical impact, scope, certainty, action, date, and consequence; Suppress/Hold renders no definitive push |
| Common prohibited output | Duplicate or queued push; stale/unresolved certainty; source/episode IDs; line-color identity; served-stop claim against veto; unsafe/unverified alternative; merged independent incident; baseline write before successful delivery; routine all-clear; guessed Home/Work; MTA or launch guarantee |

Every evaluated candidate in a multi-candidate or labeled-subcase fixture has its own single outcome, class, and reason. A future run must capture every one.

## Fixed synthetic definitions

| Fixture/source | Fixed evidence, identity, and scope override | Fixed baseline, quiet, or recovery override | Exact expected outcome, class/reason, and visible/assistive effect | Fixture-specific prohibited result |
|---|---|---|---|---|
| `DED-01`; `DED-01-SRC-v1` | Exact `ALERT-A/v1` record replays byte-for-byte | Same-group initial successfully delivered at 7:30 with identical fingerprint | **Suppress — Duplicate / exact replay**; zero new message; baseline unchanged | Treat replay as new observation or delivery |
| `DED-02`; `DED-02-SRC-v1` | Text punctuation and wording change; normalized scope/fingerprint unchanged | Same-group initial successfully delivered | **Suppress — Duplicate / copy-only change**; zero new message | New notification or baseline |
| `DED-03`; `DED-03-SRC-v1` | Source ID changes A→B and wrapper/timestamp renews; normalized impact unchanged | Same-group initial successfully delivered | **Suppress — Duplicate / source-packaging churn** | New root from source ID |
| `DED-04`; `DED-04-SRC-v1` | Live feed health recovers; no new journey consequence and no verified incident release | Same-group disruption successfully delivered | **Suppress — Duplicate / feed recovery only**; episode remains continuous | Recovery, all-clear, or new initial |
| `DED-05`; `DED-05-SRC-v1` | Current coherent alert `ALERT-A/v1` and live degradation `LIVE-A/v1` unambiguously match one fact/root/episode/fingerprint | No baseline or quiet block | **Send — Initial / one cross-source normalized candidate**; one Task 5 delay message represents both evidence records | Candidate per source; double delivery |
| `DED-06`; `DED-06-SRC-v1` | Structured scope says Downtown saved segment; text says Uptown remote segment; observation quarantined; Task 2 Gate 5 Unresolved | No accepted replacement | **Hold for stronger evidence — Eligibility unresolved / contradictory quarantined scope**; zero message | Choose a scope; broad definitive push |
| `DED-07`; `DED-07-SRC-v1` | Only generic **Affected**; exact consequence/action absent; Task 2 Gate 9 Fails | No baseline | **Suppress — Ineligible / generic non-decision-changing scope** | Convert Affected to bypass, delay, or closure |
| `DED-08`; `DED-08-SRC-v1` | Two similar records lack explicit linkage and differ ambiguously on narrow segment/effective lineage; provisional roots A/B retained | Disputed merge required for proposed candidate | **Hold for stronger evidence — Identity unresolved / ambiguous split-merge**; zero message | Merge by wording, route, or proximity |
| `DED-09`; `DED-09-SRC-v1` | Current added time `899s`; delivered baseline `600s`; exact worsening `299s` | Prior same-group delivery successful | **Suppress — Below material change / +299s** | Round to five minutes |
| `DED-10`; `DED-10-SRC-v1` | Current added time `900s`; baseline `600s`; exact worsening `300s` | Prior same-group delivery successful | **Send — Escalation / inclusive +300s boundary**; one update | Treat boundary as exclusive |
| `DED-11`; `DED-11-SRC-v1` | Current added time `901s`; baseline `600s`; exact worsening `301s` | Prior same-group delivery successful | **Send — Escalation / +301s**; one update | More than one escalation |
| `DED-12`; `DED-12-SRC-v1` | Baseline end 8:00:00; current end 8:29:59; exact in-window extension `1,799s` | Prior same-group delivery successful | **Suppress — Below material change / 1,799s extension** | Round up to 30 minutes |
| `DED-13`; `DED-13-SRC-v1` | Baseline end 8:00:00; current end 8:30:00; exact extension `1,800s` | Prior same-group delivery successful | **Send — Escalation / inclusive 1,800s boundary** | Treat boundary as exclusive |
| `DED-14`; `DED-14-SRC-v1` | Baseline end 8:00:00; current end 8:30:01; exact extension `1,801s` | Prior same-group delivery successful | **Send — Escalation / 1,801s extension** | Duplicate escalation |
| `DED-15`; `DED-15-SRC-v1` | Baseline end equals window end 9:00; current end 9:30; `min` formula yields zero in-window extension | Prior same-group delivery successful | **Suppress — Below material change / extension wholly beyond window** | Count post-window time |
| `DED-16`; `DED-16-SRC-v1` | Fixed synthetic owner package supplies ordered scale `SEV-SYN-v1`; current severity strictly rises Low→High; actual owner binding remains Pending | Prior same-group delivery successful | **Send — Escalation / approved ordered severity increase**; one update under the fixed synthetic input | Infer scale from words; claim real approval |
| `DED-17`; `DED-17-SRC-v1` | Severity wording strengthens but value/scale is missing or unordered; no other branch Passes | Prior same-group delivery successful | **Suppress — Below material change / severity order unavailable** | Guess severity order |
| `DED-18`; `DED-18-SRC-v1` | Current fingerprint adds exact relevant Fixture Transfer 2 and a newly affected normalized direction; both are supported | Prior same-group delivery successful | **Send — Escalation / new relevant point and direction**; exactly one update | Two updates; raw direction code |
| `DED-19`; `DED-19-SRC-v1` | Newly named Fixture Remote station lies beyond destination and affects no journey dependency | Prior same-group delivery successful | **Suppress — Below material change / point outside journey** | Widen saved journey |
| `DED-20`; `DED-20-SRC-v1` | Direction prose changes but normalizes to the same Downtown bound toward Coney Island value | Prior same-group delivery successful | **Suppress — Duplicate / normalized direction unchanged** | Treat wording as new direction |
| `DED-21`; `DED-21-SRC-v1` | First independently verified action changes A→B; B is current and unselected | Prior same-group delivery successfully recommended A | **Send — Escalation / verified action changed**; one Task 5 update | Auto-select B; keep stale A |
| `DED-22`; `DED-22-SRC-v1` | Delivered action A becomes invalid; complete review finds no verified alternative | Prior same-group delivery successfully recommended A | **Send — Escalation / action invalid and no verified option** | Recommend invalid or unverified option |
| `DED-23`; `DED-23-SRC-v1` | Official alternative wording changes but the candidate remains unverified; current verified action A is unchanged | Prior same-group delivery successful | **Suppress — Below material change / unverified alternative change** | Call candidate accessible or verified |
| `DED-24`; `DED-24-SRC-v1` | Current fingerprint simultaneously adds 300s, a relevant station, and verified action B | Prior same-group delivery successful | **Send — Escalation / multiple material branches**; exactly one update and one baseline replacement after success | One push per branch |
| `DED-25`; `DED-25-SRC-v1` | Inferred delay candidate is pending/undelivered; current confirmed origin bypass forms sibling episode under same root and passes exact bypass gates | No successful baseline; pending delay never delivered | **Send — Initial / current bypass replaces pending delay**; one bypass message only | Delay plus bypass pushes; served-origin claim |
| `DED-26`; `DED-26-SRC-v1` | Confirmed origin bypass forms sibling episode under delivered delay root and changes exact point/action | Delay initial successfully delivered for same group | **Send — Escalation / bypass after delivered delay**; one update | Second initial; retain delay-only copy |
| `DED-27`; `DED-27-SRC-v1` | Windows A/B overlap and normalize to identical route/direction/journey/occurrence/path group | No prior baseline; candidate A evaluated before equivalent candidate B | Original/surviving candidate: all twelve gates Pass → **Send**, class **Initial**, reason surviving candidate. Extra equivalent overlapping-window candidate: Gate 12 Fails → **Suppress**, class **Duplicate**, reason equivalent. One delivery marks and preserves both windows. | Two pushes; merge or delete windows |
| `DED-28`; `DED-28-SRC-v1` | Represented Window B is renamed/edited/recreated without changing normalized group/occurrence | Prior successful delivery marked Windows A/B | **Suppress — Duplicate / represented window edited**; preserve marker and both window records | Erase marker; resend |
| `DED-29`; `DED-29-SRC-v1` | Fixed subcandidates differ on normalized direction, governed accessible-path requirement, or occurrence | No baseline exists for either distinct group | Each subcandidate: **Send — Initial / distinct delivery group** after its own checks | Deduplicate distinct direction/path/occurrence |
| `DED-30`; `DED-30-SRC-v1` | New independent non-severe delay for same journey occurrence evaluated `899s` after another successful delivery; aggregate journey has no material branch | Quiet interval active | **Suppress — Quiet period / elapsed 899s**; never queue | Treat 899 as expired; later replay |
| `DED-31`; `DED-31-SRC-v1` | Same type of current independent non-severe candidate evaluated exactly `900s` after delivery | Quiet interval expired; all Tasks 2–5 checks freshly Pass | **Send — Initial / fresh evaluation at 900s** | Treat 900 as inside quiet; reuse old evidence |
| `DED-32`; `DED-32-SRC-v1` | Same type evaluated `901s` after delivery with fresh all-Pass evidence | Quiet interval expired | **Send — Initial / fresh evaluation at 901s** | Queue from 899; call Q an SLA |
| `DED-33`; `DED-33-SRC-v1` | New independent confirmed exact origin bypass occurs `600s` after delivery; route/direction/journey/consequence all Pass | Inside quiet; severe bypass applies | **Send — Initial / confirmed severe independent impact** | Suppress severe bypass; widen beyond exact commute |
| `DED-34`; `DED-34-SRC-v1` | Fixed subcase A at `900s` has stale alert age `601s`; subcase B at expiry is outside exclusive window end | Quiet expired but final current evaluation Fails | A/B each: **Suppress — Current-only expiry / stale or outside window**; zero replay | Deliver queued 899s content |
| `DED-35`; `DED-35-SRC-v1` | Current alert removes saved origin while positive prediction lists it; alert/live evidence normalize to one bypass candidate | No baseline or quiet block | **Send — Initial / accepted negative veto**; one accurate bypass message | Served-stop claim; candidate per source |
| `DED-36`; `DED-36-SRC-v1` | One source-defined recurring planned campaign has distinct equivalent occurrences; initial summary candidate then equivalent reminder with owner Seen **Unknown** | Summary has no baseline; reminder is represented/equivalent | Summary: **Send — Initial / one planned summary**. Reminder: **Suppress — Duplicate / Unknown Seen cannot authorize**. | Daily push; treat OS delivery as Seen/Not seen |
| `DED-37`; `DED-37-SRC-v1` | Complete release candidate otherwise exists | Prior disruption delivered; `recovery_updates=Off` at original and current | **Suppress — Recovery ineligible / default Off** | Routine all-clear; inferred opt-in |
| `DED-38`; `DED-38-SRC-v1` | Recovery setting On and release candidate current | Original disruption handoff/transport failed; no successful delivery | **Suppress — Recovery ineligible / no prior successful delivery** | Treat attempt as baseline |
| `DED-39`; `DED-39-SRC-v1` | Fixed branches supply only disappearance, effective end, correction, or first equipment omission | Prior disruption delivered; setting On; complete release absent | Every branch: **Suppress — Recovery ineligible / insufficient release evidence** | Recovery, all-clear, or machine-restored claim |
| `DED-40`; `DED-40-SRC-v1` | Same episode/impact/occurrence; complete current owner release; meaningful remaining action change; all final checks Pass | Recovery setting On at original/current; original disruption successfully delivered; no prior recovery | **Send — Recovery / all seven gates Pass**; one exact Task 5 recovery | Escalation class; line-wide restore |
| `DED-41`; `DED-41-SRC-v1` | Equivalent release record/copy/timestamp repeats | One recovery already successfully delivered for the impact | **Suppress — Duplicate / recovery already represented** | Second recovery |
| `DED-42`; `DED-42-SRC-v1` | A: evidence disappears/reappears without verified release. B: complete release closes lineage, then later independently accepted non-overlapping effective interval arrives | Prior initial delivered; B receives a new episode ID after close | A: **Suppress — Duplicate / same unverified-flapping episode**. B: **Send — Initial / new episode after verified close**. | New episode for A; reopen closed episode for B |
| `DED-43`; `DED-43-SRC-v1` | Correction transformation narrows unsupported wording/scope; no independent material branch | Prior same-group delivery successful | **Suppress — Correction only / narrow without trigger**; append transformation | Standalone correction push; erase original |
| `DED-44`; `DED-44-SRC-v1` | Correction is recorded and independent current journey estimate is exactly 300s worse | Prior same-group delivery successful | **Send — Escalation / independent +300s evidence**; correction is not authority | Attribute trigger to correction; multiple pushes |
| `DED-45`; `DED-45-SRC-v1` | Standalone correction/retraction requested; no approved template or independent branch | Prior same-group delivery successful | **Suppress — Correction only / standalone message unavailable** | Invent retraction template or clearance |
| `DED-46`; `DED-46-SRC-v1` | Root A is delay; independent Root B is exact constituent closure; no approved bundled copy. Later complete release applies only to A | A/B independently Pass; B’s confirmed closure bypasses quiet; recovery On and eligible only for A | A and B each: **Send — Initial / independent incident** as separate messages. Later A: **Send — Recovery / A only**; B remains Active. | Merge roots; bundled invented copy; one recovery closes B |

## Pending execution record

Every fixture below has separate actual, reviewer/date, evidence, correction, rerun, and status fields. “All six roles” means Product, Accessibility, Data Quality, Content, Operations, and Privacy reviewing the same fixed versions.

| Fixture | Actual candidate/outcome/class/reason and visible/assistive result | Reviewers and dates | Durable evidence and delivery trace | Correction and preserved original | Rerun | Status |
|---|---|---|---|---|---|---|
| `DED-01` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-02` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-03` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-04` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-05` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-06` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-07` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-08` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-09` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-10` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-11` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-12` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-13` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-14` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-15` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-16` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-17` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-18` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-19` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-20` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-21` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-22` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-23` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-24` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-25` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-26` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-27` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-28` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-29` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-30` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-31` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-32` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-33` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-34` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-35` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-36` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-37` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-38` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-39` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-40` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-41` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-42` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-43` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-44` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-45` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |
| `DED-46` | **Not run — Pending** | All six roles **Pending**; dates **Pending** | **Pending — none** | **Pending / Pending** | **Pending — not run** | **Not run — Pending** |

## Future evidence and correction contract

For each future run:

1. bind the fixed product/build, Task 2–6 artifact/blob versions, truth-owner versions, synthetic package, OS/runtime, and all inherited/override fields;
2. capture each candidate’s frozen inputs, four identities, exclusions, fingerprint/baseline, quiet/recovery math, exact outcome/class/reason, visible/assistive output, delivery attempt/result, marker/baseline write, and prohibited checks;
3. obtain Product, Accessibility, Data Quality, Content, Operations, and Privacy decisions and dates on that same version;
4. preserve durable non-personal evidence;
5. preserve every failed or inconclusive original;
6. append a bounded correction and new fixed version; and
7. rerun under a new attempt linked to the original and correction.

Definitions, documentation commits, synthetic expected output, screenshots without version binding, and one reviewer’s decision are not evidence.

## Privacy and preservation

Every fixture uses synthetic non-personal operational IDs. Operational evidence stays separate from saved commute data, accounts, notification tokens, device IDs, precise location, movement, guessed Home/Work, and rider history. Source/root/episode/group IDs are never rendered. Task 7 owns retention, reset, deletion, and preference persistence.

## Explicit gaps

The Draft 900-second quiet period, cross-source severity order, canonical MTA correlation identifier, non-overlap continuity tolerance, Seen definition, standalone correction/retraction pattern, multi-incident bundled copy, fixed product/build, and Task 7 data lifecycle remain **Pending**. No real evidence, run, delivery, review, approval, pilot, or launch exists.

## Draft review checklist

- [ ] Definitions and execution rows are exactly `DED-01`–`DED-46`.
- [ ] Every definition binds all inherited inputs plus explicit evidence/identity, baseline/quiet/recovery, expected, and prohibited overrides.
- [ ] Every evaluated candidate has one Send/Suppress/Hold outcome plus class/reason.
- [ ] Exact replay, equivalence, linkage, quarantine, escalation boundaries, windows, quiet, delivery, recovery, release, correction, and independent-incident cases match owner policies.
- [ ] Every actual/reviewer/date/evidence/correction/rerun/status field remains **Not run — Pending** or **Pending**.
- [ ] No synthetic definition is presented as product evidence or authorization.

Every unchecked item blocks approval.
