# Critic round 05 — deep review (rubric v2)

```text
Build / artifact / target version: main 740ab21fdac5fea6f1ee8fb8754c66e3ddf0d6a2 · bundle index-BcRUW86B.js ·
                                   production candidate in D:/pyrefly-release/dist-gate, NOT deployed (no artifact manifest exists) ·
                                   targets.json sha256 737dfa88c8c300aa38094ccb312cc89acb1578485c742e2224f8f2cc89e25185
Review: deep
Deployment: NOT APPLICABLE (nothing is deployed; CHK-017 is owed after a deploy)
Changed area: FAIL
Milestone: not assessed
Quality: PROVISIONAL — no verified score for feel, narrative or audio. The seven scored categories cover
         70 of the 100 weight and average 7.90 over that 70. There is no total and no acceptance.
         The last full v2 assessment was round 04 on candidate bc2571c, also provisional.
Targets: 38 required / 20 matched / 8 failing / 10 unverified / 8 waiting on a decision
Top issues: PR-0045 critical (FFX-2 Berserk on a no-Attack dressphere → zero command rows → the menu cannot
            be answered), then PR-0001, PR-0002, PR-0046, PR-0006, PR-0014, PR-0047, PR-0048, PR-0049, PR-0012
Coverage: tested — five real-input chapter routes to an outcome, the whole onboarding flow on real input,
          effective text size, the rebuilt guide, all five round-04 repairs re-proved, unchanged high-risk
          mechanics sampled, win rates re-measured, FFX-2 per-blow vitals filmed, protected-art hashes.
          Reused with reason — chapter 2 staging, scenes, paintings, audio, prep screens, pause plates, the
          FFX-2 engine outside one line, advisor ranking, non-counter AI (all from round 04 on bc2571c; none
          of those files changed). Not tested — any VICTORY on real input, every enemy form change, audio of
          any kind, motion and camera, the narrative beats, non-Chromium browsers, gamepad, a physical device,
          and the cold-start walkthrough this change set owed.
Next required review and why: focused review of the seven repairs, then a DEEP review before public
          deployment — this candidate changed the save schema, the global input claim, the shared strategy
          guide and the FFX results contract, and tools/deploy-pages.mjs will refuse a shared-system change
          without a passing deep report for that commit.
Elapsed review time / repeated work avoided: 380 minutes across six passes; carrying round 04's unchanged
          evidence avoided roughly a second full capture session, while four bodies of evidence were
          deliberately re-measured because the counter gate or the guide rewrite could have moved them.
```

## Score output (`node tools/critic-score.mjs --report critic/rounds/round-05.json`), verbatim

```text
score: PROVISIONAL — no verified score for feel, narrative, audio (never averaged away, never zero)
below the 9 floor: combat, encounter, visual, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - build identity is incomplete (main sha, bundle and artifact hash are all required)
  - score is provisional: no verified score for feel, narrative, audio
  - category combat is below the 9 floor
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category prep is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-020 is FAIL
  - 25 critical or major issue(s) remain open
  - 8 required target(s) failing
  - 10 required target(s) unverified
  - 8 required target(s) waiting
  - only 20 of 38 required targets matched
  - human judgment not recorded: An audio listening score out of ten
  - human judgment not recorded: The FFX-2 ATB Active-vs-Wait decision
  - human judgment not recorded: A verdict on the eight speaker portrait candidates
  - human judgment not recorded: Options rounds for the phone layout, the move advisor, the enemy next-move panel and the defeat screen
  - human judgment not recorded: Bailey yes on docs/PRODUCT-BRIEF.md
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

The tool computes the total and decides acceptance; this reviewer does not. It returns no number here
because three categories have no verified score, which is the correct outcome and not a formality.

## What this candidate is

Build A.1 (`bc2571c`, the candidate round 04 reviewed and refused) plus its repairs plus the onboarding
Bailey approved on 2026-09-20. Eighteen commits, 41 source and test files, +4852 / −359. No game data value
changed anywhere: `git diff 7191674..740ab21 -- src/data/ research/` is empty, so the changed-value audit is
vacuous rather than skipped.

The honest headline is that **most of what this candidate set out to do, it did**. Every one of round 04's
named repairs holds under independent re-proof, the CHK-023 runtime proofs landed, chapter 5 reached an
outcome on real input for the first time in any round, and the approved onboarding shipped faithfully at
desktop after a proper options round. The changed area still fails, on four specific counts, and a separate
reachable critical was found in shipped content.

## The ten categories

| Category | Weight | Score | One line |
|---|---:|---:|---|
| Combat correctness | 20 | **8.3** | Clean engine, all repairs hold, 42 sourced lookups exact — held down by a reachable critical in FFX-2 command construction |
| Encounter authenticity | 10 | **8.6** | Every sampled boss value matches its source exactly; AI, counters and phase rules alive; chapter 1's own line wins 55 % |
| Characters and visual craft | 15 | **7.4** | New work at the 9 level; the unrepaired staging, cropping and target-miss defects hold it where round 04 left it |
| Game feel and direction | 10 | *UNVERIFIED* | No clips, no timed sequences, no camera study, no frame-time trace. Provisional, not zero |
| Narrative and voice | 10 | *UNVERIFIED* | Two major copy defects found, but defect-finding is not coverage; no beat-level pass, no victory aftermath ever reached |
| Music and sound | 10 | *UNVERIFIED* | Nothing changed, agents cannot hear, and Bailey's listening score is still not recorded |
| Interface and controls | 10 | **7.0** | Up from 6.6 on repairs that hold; a refuted Escape claim; held down by type size, a new overlap and FFX-2 parity |
| Onboarding and access | 5 | **7.2** | Up from 4.2 — the whole approved briefing shipped — with three defects of its own and no cold-start walkthrough |
| Preparation and replay | 5 | **8.0** | The ledger repair is real and seen live in all five chapters; no victory path has ever been played |
| Stability and delivery | 5 | **8.8** | tsc clean, 4290/4290 green, 0 console errors, 0 404s, save migration works; no device, browser or frame-time evidence |

Full evidence for each sits in `critic/rounds/round-05.json` under `categories`.

### Why three categories carry no number

Feel, narrative and audio are **provisional, never averaged away and never scored zero** (RUBRIC §6).

- **Feel** — nothing in `bc2571c..740ab21` touches animation or camera code, and no motion evidence was
  captured. Round 04 left this UNVERIFIED too, so there is no number to carry.
- **Narrative** — PR-0046 and PR-0047 are real major defects in new copy, but nobody read the five chapters'
  beats against `research/writing-bible.md` this round, and no victory aftermath has been reached on real
  input in any round. The pre-battle scenes *were* captured in full and read naturally (24 lines in chapter 3,
  12 in chapter 4, both ending on their own), which is encouraging and is not coverage.
- **Audio** — no audio work happened, agents cannot hear (AGENTS.md hard rule 13), and the board's own
  request, "a score out of ten for the audio, next time you listen", is still unanswered. Until Bailey gives
  it, this category cannot be scored at all.

## Approved-target gate

| | Count |
|---|---:|
| Required | **38** |
| Matched | 20 |
| Failing | 8 |
| Unverified | 10 |
| Waiting on a decision | 8 |

The required set is every approved tile this release must deliver — presentation, scenes, cast, pause and
"how a fight plays" — excluding the twelve polish ideas, the three unbuilt chapters, the audio-direction tile
and the phone group. Round 04 counted 35; the three approved onboarding tiles registered on 2026-09-20 bring
it to 38.

**New this round.** C2 (FFX first-use line) **matched**: the line holds the menu for one confirm, in Auron's
voice, and clears the 14 px floor. C3 (FFX-2 line and the pause rows) **matched**, with the tile's own
recorded knowing departure. C1 (Auron's briefing) **failing** on two named properties — at 390 × 844 the
approved left/right split is gone and the text is printed over the painting (PR-0048), and the frame names
**D** for NEVER SHOW THIS AGAIN while the build binds Shift, Tab and Q and advertises only Shift (PR-0049).
At desktop C1 is otherwise a faithful, handsome delivery of the frame, with a real measured 944 px timer
filling 2 → 95 % over 19 s.

**Re-matched this round** because the surfaces changed: the veteran title screen at both sizes, the pause
"panels hidden (H)" tile, the pause "party panel" tile, and chapter 1's pause hero plate at 2000 × 1012
(pixel-for-pixel the approved v5 composition with only the two new rows added). One difference for Bailey's
eye and **not** scored as a defect: the party-panel hint strip reads `▲▼ NAVIGATE · ◀▶ ADJUST · ENTER SELECT
· ESC MENU` where the approved frame reads `… · F PHOTO MODE · ESC BACK`.

**Protected artwork is intact.** sha256 over every file named by the 24 approved sets in
`docs/target/approved-hashes.json` against `dist-gate`: **94 match, 0 different, 0 changedSinceSeen.** The 8
entries reported missing are the speaker portraits Bailey picked on 2026-09-20, whose tiles do not exist at
this commit. Nothing was regenerated, re-judged or proposed for replacement on taste.

**Delivery field.** `targets.json` now carries the optional `delivery` field. C1, C2 and C3 read
`implemented` with no `verifiedBy`. On the strength of this report C2 and C3 may be moved to `verified` with
`verifiedBy = {report: critic/rounds/round-05.json, sha: 740ab21}`. **C1 must not be.** The reviewer does not
edit the board.

## Coverage matrix

**Tested on this candidate.** Five real-keyboard routes, one per chapter, from normal entry through the
pre-battle scene to an outcome, results and RETRY, plus two further advisor-led real-input routes to results.
The whole onboarding flow on real input, including skip by key, by mouse click and by touchscreen tap at
390 × 844, the persistence of never-show-again across a reload and the veteran migration. Effective rendered
text size across both games' HUDs at three viewports. The rebuilt strategy guide, open and collapsed, at both
desktop sizes in both games. All five round-04 repairs, re-proved with seeded benches against the real engine
and the real presenter. Unchanged high-risk mechanics sampled: 42 ICV_BASE lookups and the §1.2 clamp, Haste
on the CTB forecast the HUD actually draws, Slow against a 255 immunity, Yunalesca's 21-tick cadence, and the
FFX-2 chain and tick constants. Win rates re-measured, seeds 1–20 × three lines per FFX chapter and seeds 1–8
per FFX-2 link. The FFX-2 per-blow party-row sync filmed at the DOM over 40 frames. Protected-art hashes.
Save and settings across a real upgrade. `tsc`, the full 162-file suite, and 0 console errors / 0 not-found
responses across 205 capture rows.

**Reused, with the dependency argument.** Chapter 2's actor staging and facing, from round 04 on `bc2571c`:
nothing in the range touches `public/art`, `src/scenes`, `src/sprites` or the presenter's staging code, no
chapter-2 facing defect is open, same GPU renderer and viewport. Scenes, paintings, audio files and routing,
party prep screens, pause plates, the FFX-2 engine outside the one-line identity filter, advisor ranking and
enemy AI other than counters, all from round 04 on `bc2571c` and all verified unchanged against
`git diff --name-only bc2571c..740ab21`. Round 04's FFX-2 combat evidence outside the PR-0024 line (1 file,
16 insertions, 4 deletions; no FFX-2 data, dressphere, garment grid, chain or ATB value moved).

**Deliberately NOT reused.** Round 04's FFX win rates and attrition — the `canCounter` gate changes how much
damage a boss returns, so every number here was re-measured. Round 04's ICV_BASE, command-rank and Haste/Slow
sampling — cheap to redo, so all 42 lookups were re-run. Round 04's legibility numbers — re-measured with an
independent method on the surface this build rewrote.

**Not tested.** Any chapter through a **victory** on real input, and therefore the victory scene, the victory
results card and the credited reward path. Every enemy **form change** — Seymour Flux into Mortiorchis,
Yunalesca's three forms, Vegnagun links 2–5 and Shuyin were never staged. The FFX half of CHK-023 at the DOM.
PR-0045 on real input. Any FFX-2 coach line firing on a real spherechange. Audio of any kind. Motion,
animation timing, camera and frame time. The narrative beats. Gamepad, a physical touch device, Firefox,
Safari and Edge; 4:3, 21:9, 1440p and 4K beyond one 2560 × 1440 backdrop capture.

**Required and not tested** (`coverage.requiredNotTested`). The one that matters most: **no cold-start
walkthrough was run**, simulated or real. RUBRIC §4 asks for one whenever onboarding changes, and onboarding
is the headline change of this candidate. The onboarding score is capped by that absence and says so. Also
owed: CHK-011 across every form change, CHK-023's FFX clauses at the DOM, CHK-013's 2560 × 1440 subject read,
and a real-input victory that a milestone review will require.

## Checks

| Check | Result | Note |
|---|---|---|
| CHK-015 real input | PASS | 205 evidence rows, `injected=0` on every one; no debug hook established any capability |
| **CHK-016 state asserted** | **PASS** | Repairs round 04's FAIL. One wait failed and threw; three mis-navigated runs were caught and discarded, not reported |
| **CHK-017 exact artifact** | **NOT APPLICABLE** | Not deployed. Candidate digests recorded in `build.artifactHashNote`; owed after a deploy |
| **CHK-020 FFX/FFX-2 parity** | **FAIL** | Two of three paired surfaces now match and the reported Escape asymmetry was **refuted**. Fails on PR-0012 |
| CHK-021 game-aware change | PASS | Every change carries a written FFX-only / FFX-2-only / both case that holds against the sources and the other game's code |
| **CHK-022 real flow to outcome** | **PASS** | All five chapters, chapter 5 included for the first time. All outcomes were defeats; no win is claimed |
| CHK-023 real presentation path | UNVERIFIED | Two of three clauses closed, including the FFX-2 vitals film at the DOM. The two FFX clauses are proved only to the HudPort |
| CHK-024 save upgrade | PASS | Fresh and veteran profiles both exercised with real input, not only in unit tests |
| CHK-003 legibility | FAIL | PR-0001, re-measured independently on the surface this build rewrote |
| CHK-008 panels vs actors | FAIL | PR-0002, plus the new PR-0050 on the FFX-2 side |
| CHK-011 enemies visible | UNVERIFIED | Every formation reached is clean; no form change was reached, and incomplete scope is not a pass |
| CHK-012 portraits | FAIL | PR-0014; traced to an absent asset that lands one commit later |
| CHK-013 approved art | UNVERIFIED | The guard-rail half passes completely (94/94); the 2560 × 1440 subject read was not done |
| CHK-014 facing and pose | PASS | Chapters 1, 3, 4, 5 re-observed; chapter 2 carried with its dependency argument |
| CHK-019 media decodes | PASS | No undecodable or blank shipped media; no all-black render reached a capture |
| CHK-B1 / CHK-B2 | UNVERIFIED | Bailey's audio score and a feel judgment have not been asked for or recorded |
| CHK-B3 options round | PASS | Onboarding went through three mocked-up options and a recorded pick **before** the build |

## Repaired and verified this round

| ID | What | How it was proved |
|---|---|---|
| PR-0003 | FFX results ledger dropped party members | 96 finished battles across chapters 1–3 × 16 seeds × 2 lines: every win and every loss returns a row for each starting active member plus every reserve member who completed a turn. Seen live on all five defeat screens, in the FFX-2 form too |
| PR-0004 | A Threatened enemy still counterattacked | Real chapter 2 encounter, seeds 1–14, Threaten landed by casting the real ability off the real command list: 17 landed hits on a Threatened boss → **0** counters; 113 hits without → 95. The new `isAlive` clause was measured and deleted no sourced counter |
| PR-0009 | Strategy guide sliced its last line | Two passes. The column now breaks on whole lines with MORE in its own row, captured at both desktop sizes in both games. *(But see PR-0001 and PR-0050.)* |
| PR-0023 | Letter tags moved when a twin died | The map is cached on `rt.letterTags`; `state.enemyIds` is only pushed to during setup, so a death cannot invalidate it |
| PR-0024 | Duplicate Attack filtered by category | Real `buildCommands` against real registries for all 14 shipped dresspheres; nothing but `x2-<sphere>-attack` is ever dropped; FFX's own `commands.ts` proven free of `x2-` and `dressphere` |
| PR-0025 | Unsourced denied-turn constant | Now an explicit `[estimate]` block with its reason and an open question for Bailey; `results.ts` cites §10.1 and the quote is verbatim at `research/ffx-combat-core.md:1755` |
| PR-0038 | Over-wide "mute at boot" claim | Corrected in 959577d; not independently re-tested at runtime |
| PR-0040 | `state.ts` over the 400-line limit | 328 lines; predicates moved to a new 121-line file with full re-exports — a move, not an API change |
| PR-0042 | Round-04 evidence integrity | Superseded: round 05 re-captured the affected flows with per-capture assertions |

## Refuted

One submitted major finding did not survive confirmation and is recorded rather than quietly dropped.

> **"Escape does not pause from the FFX-2 command menu; it takes two presses, and FFX takes one."**
> **REFUTED.** The observation was real but misattributed to input routing. On a controlled re-run of the
> same candidate, with the command menu at its top row and no key pressed at the menu at all, **one Escape
> opens pause in FFX-2**, exactly as in FFX (`evidence/confirm/esc-ffx2-nokeys.json`, `esc-ffx-nokeys.json`).
> The two-press sequence reproduces only after an Enter has been pressed at the menu, and then it is correct
> cancel behaviour: with the coach line up, one Enter cleared the line **and** opened the White Magic
> submenu; the first Escape unwinds that submenu and the second pauses.
>
> What survives is smaller and real, kept as **PR-0051** (polish): the FFX-2 coach line does not claim its
> dismissing confirm key, so that press falls through to the menu. CHK-020 therefore does **not** fail on
> Escape parity; it fails on PR-0012.

A calibration case should be added to `critic/calibration/cases.json` from this, per RUBRIC §9.

## Ranked issues

Critical first, then major, then polish. Within a severity: Bailey's own reported problems, frequency, player
impact, coverage, effort. Never by what most cheaply lifts a decimal. Every issue's full expected/observed,
repro, seed, evidence path, confidence, requirement, fix and acceptance check is in
`critic/rounds/round-05.json` under `issues`; the lines below are the ranked summary.

### Critical

**1 · PR-0045 — A Berserked girl wearing White Mage, Black Mage or Songstress is offered no command at all.**
*FFX-2 only* (FFX has no dressphere concept and every FFX character always has Attack). Chapter 5, link 2
(Vegnagun Leg), in shipped content. `buildCommands` gates the generic Attack row on `sphere?.hasAttack` and
gates the ability, spherechange and item rows on `!berserked`; for the three dresspheres with no Attack
nothing is left and the list is literally `[]`. Measured across all 14 shipped dresspheres: berserked row
count is 1 for eleven of them and **0** for songstress, white-mage and black-mage. Reachability is shipped
content, verified independently: Yuna starts both FFX-2 chapters as White Mage, the Vegnagun Leg owns
`x2-vegnagun-leg-berserk` at chance 75, and the data is correctly sourced. Real presenter, seeds 1–24:
22 wins, 0 losses and **2 zero-row turns** (seeds 3 and 13), the naive line hitting the same seed. In real
play it is worse than the bench: `FFX2BattleHud.ts:711` hands the empty array straight to `openCommandMenu`
and neither the HUD nor `CommandMenu.ts` has a zero-row guard, so the awaited promise has no submittable row
to resolve it — a hard lock at the menu. **Smallest fix:** resolve a Berserked FFX-2 turn automatically
(§2.8: the player loses control). The exact combination of Berserk and a no-Attack dressphere is *not settled
by the sources* — §2.8 says "only the basic Attack command", §3.4–3.6 say there is no Attack command — so per
AGENTS.md hard rule 6 do not invent a damage row: raise it with Bailey and meanwhile fall through to a
pass/Defend. Add an invariant that `buildCommands` never returns `[]` for a living unit.
*Caveat stated plainly:* the lock is traced in source, not filmed; no real-input route reached a Berserk on
Yuna inside the capture budget.

### Major

**2 · PR-0001 — Most of the battle HUD still renders below the 14 px legibility floor, including the panel
this build rewrote.** Both games, all five chapters. Re-measured with an independent method: the strategy
guide reads 11.5–13.25 effective px at 1600 × 900, 12.93 at 2000 × 1012, and 2.8–4.88 px at 390 × 844; the
advisor chips 9.75–10.5 px. The coach layer added in this build is the only battle-adjacent surface that
clears the floor. **PR-0009 rebuilt the guide column without raising its type, so the cheapest moment to fix
this just passed.** Open across three reviews; `npm run critic:status` will print STALLED for it.

**3 · PR-0002 — The FFX command stack covers a whole party member head to foot.** Chapters 1 and 3. In
chapter 3 Yuna is present in the status rows at 5130/5130 and visible only as a pale sliver behind the
TALK/ATTACK/SPECIAL/WHITE MAGIC/ITEMS/FLEE slabs. `docs/ENGINE-API.md#hud-safe-area` permits the stack over
the party's **lower third**; this exceeds it. One of Bailey's own reported problems.

**4 · PR-0046 — The build tells the player the FFX-2 clock is running while it is standing still.** Two
surfaces, one root claim, merged into one ticket: the briefing's fourth line ("In hers, the clock does not
wait.") and the FFX-2 HUD's permanent top-left `ACTIVE — ATB RUNNING` badge. Measured, not assumed: with the
chapter 4 command menu open, `BattleState.ticks` read 8189 at t0 and **8189** after 2013 ms, identical at
2000 × 1012 and 390 × 844, with the FFX control reading 0 → 0 because FFX is turn-based by design. The build
itself changed the FFX-2 first-use badge from "GAUGES RUNNING" to "KEEP PLAYING / NOTHING TO PRESS" for
exactly this reason, one commit earlier — the louder claims were not changed with it. **The decision is
Bailey's:** correct the copy, or answer the Active-vs-Wait question and make the engine match. Do not edit
approved copy on a reviewer's say-so.

**5 · PR-0006 — The move advisor's advice loses fights the game's own strategy wins.** Newly corroborated and
stronger than round 04's finding: two real-input routes that followed the advisor's pick **every turn** both
lost — chapter 3 at 64 player turns / 5:55, chapter 4 at 15 turns / 1:40 — in chapters whose `intendedStrategy`
wins 20/20 and 8/8 in seeded runs. (Two runs, one sample each; this corroborates the defect rather than
quantifying it.)

**6 · PR-0014 — Paine's portrait chip is a grey "P" monogram and the painted chips crop through hairlines.**
Traced to the asset, not the UI: `art/portraits/paine.png` is absent from this build. Bailey picked the
replacements on 2026-09-20 and they land at `e8df350`, **one commit after this candidate**, so a rebuilt
candidate should close the monogram half. The crop half is separate and will not close with it.

**7 · PR-0047 — Rikku's dressphere line teaches the opposite of the project's own sourced rule.** FFX-2. The
shipped line reads "New dress, new moves! Swap any time — it costs her nothing." `research/ffx2-combat-core.md`
§4.2 [verified: 2 sources] says the change consumes the whole turn, and
`research/ffx-vs-ffx2-presentation.md` P-2 explicitly discards the "any time" wording. The build's own menu
contradicts the line: `CommandMenu.ts:343` styles the Change row as an Overdrive-class action with the
comment "because section 4.5 costs the whole turn". New copy on an approved feature, so offer Bailey two or
three wordings rather than picking one.

**8 · PR-0048 — At 390 × 844 the briefing prints its text over Auron's painting, gold on his red coat.** The
approved left/right split is gone and the two lowest-contrast lines are the two carrying the FFX-2 clock rule
and the permanent opt-out. Fixing it corrects the build toward an existing decision and needs no new approval.

**9 · PR-0049 — The briefing's permanent opt-out fires on Tab and Q; the screen names Shift and the approved
frame named D.** Both chips carry `role=button` and `tabindex=0`, so a keyboard or switch user pressing Tab
to reach the chip they want instead writes the permanent opt-out on the first press, with no confirmation and
no on-screen trace. Bind the key the frame names and leave Tab to move focus.

**10 · PR-0012 — The FFX-2 command menu never tells the player what the highlighted row does.** FFX prints a
help slab in the same state. This is the CHK-020 parity failure of record. Reuse FFX's data path, placed
where FFX-2's own chrome puts it rather than copying FFX's composition.

**11 · PR-0016 — The chapter 4 pause hero plate is cropped past its approved framing** to a face-only
close-up, losing the character with Bahamut, the scarf, the costume and the sky. Chapter 1's plate holds its
framing at both sizes, so the rule that works already exists.

**12 · PR-0005 — The approved Turn cut-in is still never drawn.** `showTurnCutIn` is defined and re-exported
and has no production call site; the approved target cannot be delivered. AGENTS.md hard rule 4.

**13 · PR-0031 — FFX-2 target selection is missing four elements the approved frame shows** (the top TARGET
plate, the PART pill, the actor chip, the letter tag and the footer hint). Merges PR-0030. A player is told
what is highlighted but not who is acting, that the thing is a part, which part it is, or that the arrows
change target. *Note for the builder:* the leader-line marker on the same tile is recorded as `undecided` and
must not be built without Bailey's yes.

**14 · PR-0050 — The collapsed strategy-guide chip is drawn on top of the FFX-2 boss nameplate, HP bar and
SCAN label.** *A regression of the changed area.* `strategy-guide.css:373` gives the toggle a static
`top: 44px` fallback and `StrategyGuide.ts:337` clears the measured anchor the moment the guide is hidden —
both files were rewritten in this candidate.

**15 · PR-0015 — Vegnagun's green tail tip reads as an un-keyed green shard stuck to Rikku's forearm**
through all of chapter 5.

**16 · PR-0008 — Chapter 1's own intended strategy wins 11 of 20 seeds while every other chapter's intended
line wins 95–100 %.** Re-measured on this candidate with the counter gate in place: ch1 11/20, ch2 19/20,
ch3 20/20, ch4 8/8, ch5 links 8/8 except the leg's 7/8. A naive line losing a boss fight is correct and
matches this round's five real-keyboard defeats. The inconsistency is that the **first** chapter is the one
the game's own recommended line loses 45 % of the time. This is a balance question for Bailey, not a
mechanical bug — the numbers are sourced and must not be tuned (AGENTS.md hard rule 6).

**17–25 · Carried forward from round 04, open, not re-tested this round.** PR-0007 (chapter 1's Zombie
sequence has no counter-play), PR-0010 (the intent panel cuts its counter rules mid-glyph with no keyboard
way to read the rest), PR-0011 (the FFX intent panel omits Lance of Atrophy's 100 % Zombie), PR-0013 (FFX-2
letters enemies by formation position), PR-0017 (at phone width one of chapter 1's two enemies is entirely
off-screen), PR-0018 (the selected command label is the least readable text on screen, at 1.53:1), PR-0019
(the command help sentence is truncated mid-word), PR-0020 (the dialogue card draws its portrait larger than
its slot), PR-0021 (the banter bank is authored but not implemented). Dependency argument for each, recorded
in the JSON: none of the code, assets, settings or targets they depend on changed in `bc2571c..740ab21` and
no related defect was opened or closed — **their current state is inherited, not re-observed.**

### Polish

**26 · PR-0051** (new) — the FFX-2 first-use line does not claim its dismissing confirm key, so that Enter
falls through and opens a submenu the player did not ask for. This is what survived the refuted Escape
finding. Then, carried forward: PR-0022 (a KO'd member as a rotated floating billboard), PR-0026 (developer
vocabulary on screen), PR-0027 (unrendered markdown), PR-0028 (H does not hide the panels it is labelled
for), PR-0029 (Yu Pagoda A and B carry no always-on field marker), PR-0032 (no text size, key remapping or
motion accommodations — *partly addressed*: a BATTLE HELP row and a replayable briefing now exist and
persist), PR-0033 (the defeat screen has no approved target and tells a losing player nothing), PR-0034,
PR-0035, PR-0036 (backdrop grade, FFX-2 field mirroring, FFX-2 party crowding), PR-0037 (mid-battle beats
hard-code absent speakers), PR-0039 (3 of 21 cues have no tempo map), PR-0041 (FFX-2 item reachability),
PR-0043 (**re-scoped**: chapter 5 now reaches an outcome, but **no chapter has ever been captured through a
victory on real input**, so the victory scene, the victory results card and the reward path remain unseen),
and PR-0044 (suggestion: 16 of 51 manifest subjects carry no facing).

## What stands between this build and acceptance

Acceptance needs the weighted total at 9.60 unrounded, every category at or above 9.0, no UNVERIFIED category
or mandatory check, no open critical or major defect, every encounter through its real flow, every required
target matched, the human judgments recorded and the exact deployment verified live. Concretely:

1. **One critical to close** (PR-0045), and the class of defect to make impossible.
2. **Twenty-four open majors**, of which nine are inherited and untested this round. The next batch should
   either repair or re-test them; an inherited major cannot be argued away.
3. **Three categories with no score at all.** Feel and narrative need one pass each. Audio needs *Bailey*,
   not an agent: the listening score the board asks for.
4. **Eighteen of 38 required targets not matched**, eight of them failing and eight waiting on decisions only
   Bailey can give (phone layout, advisor, enemy next-move panel, defeat screen).
5. **No victory has ever been played.** Until one is, CHK-022 cannot pass at milestone strength and the
   reward, aftermath and mastery loops are unjudged.
6. **No device, browser, controller or frame-time evidence exists at all**, and the platform goals in
   RUBRIC §2 name all of them.
7. **Live verification** of whatever is actually deployed (CHK-017), which this candidate has never had.

Two operating notes under RUBRIC §8. PR-0001 is open at the same severity across three reviews and PR-0002,
PR-0005, PR-0012, PR-0014 and PR-0016 across two, so the next batch in those areas starts with a **written
method check**, not a third similar attempt. And this candidate has now had one repair-and-recheck cycle; a
second is normal-mode budget, but a third needs a usage reading and one of: take the failing change out,
defer the candidate, or ask Bailey.

## What changed since the previous round

Round 04 reviewed candidate `bc2571c` and refused it: changed area FAIL on PR-0003, PR-0004 and PR-0009 plus
CHK-023 runtime gaps, with CHK-016 failing and chapter 5 never reaching an outcome. Round 05 reviews that
candidate plus its repairs plus the approved onboarding.

- **All five named repairs hold** under independent re-proof, and two of them were repaired twice after this
  project's own repair verifier refuted the first attempt — that verifier did its job and is the reason
  PR-0009 and PR-0003 are genuinely closed now.
- **CHK-016 moves FAIL → PASS.** Captures now assert their screen and throw; three mis-navigated runs were
  caught and discarded rather than reported.
- **CHK-022 moves UNVERIFIED → PASS.** Chapter 5 reached an outcome, results and retry on real input for the
  first time in any round.
- **CHK-023 moves from three open clauses to one.** The FFX-2 per-blow vitals sync is now filmed at the DOM
  on real keys, and the "empty battle log" of earlier rounds was diagnosed as a harness fault, not a defect.
- **Onboarding went from nothing to Bailey's approved option C**, delivered after a proper options round —
  the single largest category movement in the build (4.2 → 7.2).
- **One regression was introduced** by the changed area (PR-0050) and **four new defects** ship with the new
  work (PR-0046, PR-0047, PR-0048, PR-0049, plus the polish PR-0051).
- **One submitted major was refuted** on re-test rather than being allowed to stand.

Rounds 02 and 03 were scored under rubric v1 with its A/B/C parts. Their numbers are history under another
rubric and are **not** compared here.

## Proposals — nothing here is built without Bailey's yes

*Unscored. Each is an idea with its benefit, cost and risk, not a requirement.*

1. **An invariant instead of a patch.** Give `buildCommands` in both games a shipped rule that a living,
   non-removed unit always receives at least one submittable row, and give `FFX2BattleHud.chooseCommand` a
   guard that resolves the turn rather than awaiting a promise nothing can settle. This is the general form
   of PR-0045 and makes the class impossible. Small cost, no fidelity risk; it needs a yes only because it
   adds an engine-level rule.
2. **Ask the FFX-2 Active-vs-Wait question directly, once, with a 20-second clip of each.** It currently
   blocks PR-0046, colours tiles C1 and C3, and decides whether a first-timer is told the truth about the
   game they are about to play. The sources have the answer for the real game; the decision is how faithful
   Bailey wants this build to be. One options round at the "minimal interactive prototype" rung.
3. **Buy a victory.** Budget one scripted-but-real-input win per game in the next review: chapter 3 (median
   9 player turns on the sourced Candle of Life exit) and chapter 4 (8/8 seeds on the intended line). Perhaps
   30 minutes of capture would close the victory half of CHK-022, the reward path, the victory results card
   and most of the narrative aftermath gap at once. This is the highest-value coverage purchase available.
4. **Run the cold-start walkthrough**, once the three onboarding defects are repaired, and show Bailey the
   result — he has never seen a first-timer read of his own onboarding. Pair it with CHK-B2, which is the
   right moment to ask for his judgment.
5. **Raise the shared Ink & Gold type tokens to a 14 px effective floor at desktop as a standalone change**
   with its own before-and-after measurement, instead of attaching it to the next feature. Every feature that
   touches a HUD surface currently rebuilds it without fixing it. Say explicitly that the phone half stays
   blocked on the phone options round rather than bundling the two.
6. **Add a calibration case** from this round's refuted finding (a reviewer's own open submenu read as an
   input-routing failure). It is a `should-pass` case with a confirmed artefact, and RUBRIC §9 asks for one
   whenever the critic records a mistake.

---

*Reviewed against `critic/RUBRIC.md` policy v2 and `critic/CHECKS.md`. Machine-readable report:
`critic/rounds/round-05.json`. Evidence: `critic/rounds/round-05/evidence/`, benches
`critic/rounds/round-05/bench/`, target composites `critic/rounds/round-05/targets/`. Browser mode
`PYREFLY_BROWSER=gpu` (ANGLE d3d11) for every run; no software fallback was used. The preview server on
127.0.0.1:5473 was stopped by its own listening PID. No product code was changed, nothing was committed,
pushed or deployed, and nothing under `critic/pending` was edited or deleted.*
