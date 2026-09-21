# Round 07 — deep review of the live build `main 8f48237` (bundle `D260C6cS`)

```text
Build / artifact / target version: main 8f48237 · bundle index-D260C6cS.js · artifact 9136334332789869… · targets.json sha256 bf6a859f761b5e4d…
Review: deep (after the deploy, on the live build, per RUBRIC §4 as adopted 2026-09-21)
Deployment: PASS
Changed area: FAIL
Ship: SHIP — no critical anywhere, no regression against live fd0ae96, and every major this change introduced sits inside the brand-new front end
Milestone: not assessed (a deep review cannot accept a milestone)
Quality: PROVISIONAL — nine of ten categories scored; audio is UNVERIFIED because nobody has heard this build
Targets: 28 required / 11 matched / 4 failing / 9 unverified / 4 waiting on a decision
Top issues: PR-0066, PR-0001, PR-0065, PR-0063, PR-0067, PR-0064, PR-0068, PR-0008, PR-0007, PR-0002
Coverage: five chapters played end to end on the live site with real keys; the first victories ever recorded (one per game); ordered engine logs for both games; approved art verified by hash. Audio, real hardware and three of five victories are still untested
Next required review and why: live + focused on the next deploy; the next DEEP is owed by the Active ATB engine change and must open with the §8 method check for Chapter 1
Elapsed review time / repeated work avoided: ~240 minutes across capture, four auditors, a gap pass, a confirmation pass and this consolidation; four round-06 findings were carried with written dependency arguments instead of being re-benched
```

## The score, verbatim

`node tools/critic-score.mjs --report critic/rounds/round-07.json`

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: combat, encounter, visual, feel, narrative, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category combat is below the 9 floor
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category prep is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-021 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-014 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-007 is UNVERIFIED
  - mandatory check CHK-001 is UNVERIFIED
  - mandatory check CHK-B1 is UNVERIFIED
  - 32 critical or major issue(s) remain open
  - 4 required target(s) failing
  - 9 required target(s) unverified
  - 4 required target(s) waiting
  - only 11 of 28 required targets matched
  - human judgment not recorded: Audio for build 8f48237
  - human judgment not recorded: The yu-pagoda cast and hurt poses losing the tiered silhouette
  - human judgment not recorded: The KO treatment, the phone layout and the Chapter 1 / Chapter 3 length ratio
report: valid evidence
```

One number in that output needs a word: the milestone gate counts every critical or major issue whose
status is not the literal `fixed-verified`, so it says 32 where the rubric’s own open test says **31 open**
(PR-0059 is closed this round and the gate still counts it). I use 31 everywhere below, and the gate’s
stricter count changes nothing: either number refuses the milestone.

I do not compute the total and I do not decide acceptance — the code does. For information only, and
explicitly **not** the score: the nine scored categories carry 90 of the 100 weight and average **7.99**
across that weight. The tenth is audio, and the rubric is right to refuse to average it away.

## The ten categories

### `combat` — **8.8** (weight 20)

The changed-value audit has an EMPTY change set, and that is proved rather than assumed: git diff --name-only fd0ae96 8f48237 -- src/battle src/data src/engine/tactics research returns nothing, so the combat engines here are byte-identical to the ones round 06 reviewed. Re-run on the reviewed build rather than reused: in the clean worktree D:/pyrefly-release at 8f48237, npx tsc --noEmit exits 0 and the full suite is 181 files / 4,566 tests green in 56.0 s (round 06 on c71cd82: 176 / 4,455; the five extra files are the front-end and learn suites, no combat suite was removed or weakened). CHK-023 is proved for FFX from the live build's own ordered event log — guided3/run.json, 584 events over 105 turn-starts from 63 commands each read off the in-game advisor and driven through the real command menu — where the Yu Pagodas die and return at 6,361 and 6,631 HP (research §1.4's 5,000 + excess damage), Zombie lands on Braska's Final Aeon five times and is stripped four (the BFA-variant Power Wave, not the aeon-fight variant), Jecht Beam's Petrify is cleared by an Auto-Med Remedy counter, four aeons are summoned and KO'd and a fifth summoned, ten statuses apply and expire with the right reason, and all three miss events in 584 are physical attacks with reason 'evaded' — hard rule 5 observed in play rather than in a unit test. CHK-023 is now proved for FFX-2 as well, which round 06 could not do on the live artifact: the gap pass sampled the log during the fight and chapters 4 and 5 carry atb, chain, spherechange and script-trigger events (peak length 457 and 211). Held at round 06's 8.8: nothing in the engines moved, my verification is broader than round 06's, and against that stand PR-0052 and PR-0054 unchanged in this very engine and one newly traced source-versus-code divergence (PR-0069, no observed player effect).

### `encounter` — **8.9** (weight 10)

Win rates re-measured on this build, seeded, in D:/pyrefly-release at 8f48237: the shipped intended line wins Chapter 1 26/40, Chapter 2 39/40, Chapter 3 39/40, Chapter 4 40/40, Chapter 5 40/40. Credibly wrong tactics still lose and canonical ones are not punished for being strong: killing the Mortiorchis before Seymour loses on all four canonical seeds; curing Zombie at Yunalesca loses to Mega Death and Zombieproof loses outright; mashing Attack into Bahamut's Defense 160 wins 0/30; the Charon line wins 0/15; each researched survival route behaves as researched (Shell-only 30/30, Magic-Break-only 30/30, heal-only 22/30). Boss records spot-audited against research/: Braska's Final Aeon 60,000 / 120,000 with overkill 20,000; the Yu Pagoda reviveRule delayTicks 63 in the BFA context and 72 otherwise with baseMaxHp 5,000, a derived CTB-tick value and correctly not a turn counter; the possessed aeons ship 1-HP placeholders and mirrorPossessedAeon really does overwrite them from the live AeonBuild with Luck forced to 1. The two carried Chapter 1 majors were re-measured and are now open for four consecutive reviews, so §8's stagnation rule applies: PR-0007 gives 44 Zombie-to-KO events over seeds 1-30 with 37 (84.1 %) at a zero player-turn window, and PR-0008's fourteen losing seeds are the same fourteen, five of them ending at player turns 2, 5, 5, 6 and 6. New this round and corroborating from the player's seat: on the live build, after walking the route with real keys, the game's own intended strategy still lost Chapter 1 at 0:48. Held at 8.9 because no encounter data, AI script, formation or reward moved and no regression appeared.

### `visual` — **7.8** (weight 15)

Protected art intact: all 26 sets and 146 files in docs/target/approved-hashes.json, including art4:2026-09-21's 42 poses and the two title key-art files, ship byte-identical in critic/artifacts/8f48237.json (761 files, artifactHash 913633..., problems [], audioUnverified 0). Matched targets: the new title (gold-rim deduction aside, both silhouettes correct and recognisable, reflections and ground contact present), party prep, dialogue card, FFX-2 battle HUD, pause hero plates for chapters 1 and 4, all five painted backdrops rendered in play, and the settled chapter board. Carried LIVE-A2-1 is fixed: the Chapter 4 prep screen shows painted faces for Yuna, Rikku and Paine, and Paine's HUD chip crops her face. Standing poses and facing are right in every chapter sampled (party facing +1, enemies -1, no placeholders). Deductions, none of them in the approved art itself: the FFX command plate covers a party member in chapters 1 and 3; the KO billboard is the standing pose rotated about its centre, floating at chest height off its station; the new board paints letter tiles and unpainted cards on arrival; the title's gold rim is about 1 px against a 230 px figure; Vegnagun has no contact shadow and Paine intersects it. RAISED from the visual auditor's 7.6 to 7.8 on my own re-examination of the primary captures, and the reason is recorded rather than implied: two of that number's deductions were overstated — target selection does draw a corner-bracket reticle, a pointer and an anchored name chip in Chapter 3 (what is missing is the dim and the hint bar, which is PR-0031), and Seymour Flux is not a sliver at the first command frame, he reads clearly from the waist up. The rest of the list I confirmed image by image.

### `feel` — **8.0** (weight 10)

Held at round 06's 8.0 on this build: real gains on the new front end, one new cost, and the round's biggest measured cost unmoved. Verified on the live artifact in gpu mode from timed frame sequences, re-measured as greyscale frame-to-frame deltas. (1) reduceMotion on the new title is a clean pass: two captures 1.3 s apart with a full-width pointer sweep between them are byte-identical (0 pixels differing by more than 25 levels); with motion on, the same sweep changes only the area around the two figures (439 of 90,000 sampled pixels). (2) The title-to-board transition completes inside 240 ms: of 8 frames at 120 ms only 0-to-1 changes (mean delta 84.3 of 255) and frames 1-7 are static. (3) FFX action and reaction read well: a 12-frame party-attack sequence at 130 ms shows the attack pose, the damage number, the enemy hurt pose, Lance of Atrophy on Yuna and her status glow inside 650 ms, then a mid-battle beat types in; the boss sequence shows Full-Life's 1500, the KO, and the next command menu open 260 ms later. The near-static frames are the typewriter reveal and the game waiting for the player, not dropped animation. (4) Skip and replay are respectful: the scene screen prints ENTER ADVANCE / HOLD ENTER SKIP / ESC MENU and a 1.2 s Enter hold skipped the whole pre-battle scene in all five chapters. Against that: the KO treatment (PR-0022), the 6.3 to 9.9 s wait before the first command (PR-0061, carried and not re-measured), and no frame-time measurement on named hardware anywhere in this round.

### `narrative` — **7.6** (weight 10)

Held at round 06's 7.6: no script, speaker list or portrait changed in this build and the two things that hold the number down are both unchanged. Chapter 5 — the climax chapter — still opens on a speaker with no face at all: the card renders the name plate 'Nooj' with img null and naturalWidth 0. The dialogue plate still over-scales every portrait it does have, by a measured 398 px for Jecht, 231 for Kimahri, 176 for Braska and 24 for Rikku, and the worst player-visible case is a mid-battle beat where Seymour delivers his line with everything above his nose cut away. What IS newly verified and good: every chapter's pre-battle scene is reachable through the normal entry route and was played through with real keys; the first victory ever recorded lands a victory quip on the results card ('...Okay. Next one.'); Chapter 4 plays a post-battle victory scene. Newly found and filed: Chapter 2 wins straight into the results card with no post-battle scene at all while Chapter 4 plays one (PR-0070) — a question for Bailey, not an assumption. Banter is still authored and not implemented (PR-0021, carried, not re-verified).

### `audio` — **UNVERIFIED** (weight 10)

UNVERIFIED for the second consecutive round, and it cannot become a pass by analysis. What IS established: every chapter's cues are requested and served on the live build — title.mp3, chapter-select.mp3, pause.mp3, scene-gagazet.mp3, boss-seymour.mp3 in Chapter 1's 60 media requests and boss-ffx2-aeon.mp3 in Chapter 4's 44 — with zero 404s and nothing served as text/html across nine sessions, and the artifact manifest decode-checks every shipped file with audioUnverified 0. What is NOT established, and is what this category scores: nobody has heard this build. AGENTS.md rule 13 says Bailey judges audio from docs/audio/audition.html, and no listening assessment for 8f48237 exists. No agent in this round claims to have listened; we read data. CHK-001 and CHK-B1 are recorded UNVERIFIED with that reason, the score is provisional under RUBRIC §6, and it is never averaged away and never zero.

### `interface` — **7.3** (weight 10)

Held at round 06's 7.3: a genuine gain on the desktop front end, offset by one newly proved wrong-information defect and a phone story that is worse than round 06 recorded. Gains: the new chapter board is clear and legible at 1600x900 (minimum 14.44 effective px) and at 2000x1012 (16.24); the in-battle strategy guide holds 14.25 in all five chapters; locked cards behave (clicking a COMING card does not move the selection and Enter afterwards still starts the selected playable chapter); cleared state is read from the save and survives a reload; the advisor names the menu path, the cost and the certainty ('IN WHITE MAGIC', '30 MP', 'ALWAYS HITS') and 51 of 52 of its picks were taken exactly as advised through the real menu. Costs: PR-0068, newly proved and traced — the FFX-2 chip reads 'ACTIVE - ATB RUNNING' while a three-second hold moves the engine clock by literally nothing in both chapters, and the field it reads is never assigned, so it can only ever say ACTIVE; PR-0066, the whole new front end at 9.54 effective px at 390x844; PR-0001, the battle HUD at 2.68 to 4.02 effective px at the same width, which is worse than round 06 described; PR-0067, the FFX-2 group below an unmarked clip with keyboard-only hints; PR-0012, the FFX-2 command menu still explaining nothing while the FFX one does; PR-0031, target selection without the actor chip or the confirm/change/back hints.

### `onboarding` — **4.6** (weight 5)

Held at round 06's 4.6. The one real gain is that the new title honours prefers-reduced-motion properly — two captures 1.3 s apart with a pointer sweep between them are byte-identical, which is a proper static fallback rather than a slower animation. Everything else that holds this category down is unchanged and most of it was not touched by this build: the onboarding briefing is present but switched off, so a first-timer gets no teaching pass at all; there is still no text-size setting, no key remapping and no in-game motion or flash accommodation (PR-0032); and the new front end makes the touch story worse rather than better — all four control hints on the board name keys, the title's hint row names Arrows / WASD, Enter and Esc with no pointer row, and the one pointer target on the title is labelled PRESS ENTER (PR-0073). No cold-start walkthrough was run this round and none could be: RUBRIC §4 asks for one every third deep review with only the visible instructions, and the visible instructions are keyboard-only on a screen the change made.

### `prep` — **8.2** (weight 5)

RAISED from round 06's 8.0, and the reason is a first, not a repair: the whole reward and progress chain is verified on the live build for the first time in any round. Chapter 2 won through the normal entry route reads 'ZANARKAND DOME - THE GREAT HALL · CLEARED · 3:20 · Victory · NEW BEST' with AP 14,000 x3, GIL 9,000, a Lv 3 Key Sphere and per-member S.Lv gains; Chapter 4 reads 'BEVELLE UNDERGROUND - LIMBO · CLEARED · 1:36 · NEW BEST' with EXP 1,300 x3, AP 15 per dressphere, GIL 1,000 and a Gris Gris Bag, and the FFX-2 ledger is correctly per dressphere ('WHITE MAGE - CURAGA 40/80 AP', 'DARK KNIGHT - MASTERED'). Both returned to the board with the card cleared and both survived a full page reload, so progress is read back from the save and not merely held in memory. Retry is fast and works from every chapter: Enter on the results card took RETRY back to party prep in all five. Party prep is reachable, its tabs switch, Esc returns to the board and the chapter can be re-entered. Against that: prep is still the same three fixed presets with no meaningful choice before a fight, the defeat card still tells the player nothing about why they lost (PR-0033), and the Chapter 1 difficulty that makes retry the common path is PR-0008.

### `delivery` — **8.9** (weight 5)

Held at round 06's 8.9. Strong: the exact artifact is verified live — a single bundle script index-D260C6cS.js in the page, matching docs/deploys.log's 2026-09-21T18:24:26 main=8f48237 bundle=D260C6cS, with the deploy's own byte-for-byte comparison recording result PASS over 69 files and the manifest covering 761 files with problems [] and audioUnverified 0. Zero console errors and zero responses at or above 400 across nine browser sessions plus the gap pass; no image or audio URL served as text/html; every chapter's art loaded and decoded. (The 404s in gaps/art/spotcheck.json are the reviewer's own guessed URL pattern art/sprites/<name>-<pose>.png, not the game's requests, and are recorded as harness noise.) The tree is green: tsc clean and 181 files / 4,566 tests passing at 8f48237 in the release worktree. Nothing under learn/ is in the shipped bundle, so that plumbing is out of scope. Missing, and it is why this is not a 9.5: no frame-time or load measurement on named hardware in this round, no real phone, no real controller, and no Safari, Firefox or Edge evidence — RUBRIC §2 calls that UNVERIFIED rather than a pass, and it has been unverified every round. Two debug-API traps cost this round a whole coverage pass (PR-0071).

## The approved-target gate

| | Count |
|---|---:|
| Required in scope | 28 |
| Matched | 11 |
| Failing | 4 |
| Unverified | 9 |
| Waiting on a decision | 4 |

Failing: the title's gold rim, the chapter board's first paint, the FFX battle HUD framing and the targeting frame. Unverified: nine tiles whose acceptance needs evidence this round did not gather (audio direction tiles, the pause tiles beyond chapters 1 and 4, the phone group, the Turn cut-in). Waiting on a decision: four tiles Bailey has not ruled on, including the yu-pagoda cast and hurt poses the builder disclosed. The nine learning-site tiles are out of scope: the shipped bundle contains zero learn/ files.

Protected art is intact: all 26 sets and 146 files in `docs/target/approved-hashes.json`, including the
42 poses of `art4:2026-09-21` and the two title key-art files, ship byte-identical in the artifact
manifest. Nothing in this report proposes replacing approved art; every visual finding is about how it is
rendered, framed or staged.

## Coverage matrix

### Tested this round

- All five chapters played end to end through the normal entry route with real keyboard input on the live site, defeat and retry in every one (CHK-015, CHK-022 defeat half).
- Victory through the normal entry route in one FFX and one FFX-2 chapter, with the post-battle scene, the reward ledger, the cleared card and a full page reload (CHK-022 victory half for those two).
- Ordered engine event logs from the live artifact for all five chapters, sampled during the fight, plus a 584-event FFX log from 63 advisor-read commands (CHK-023, both games).
- The new front end: title and board at 1600x900, 2000x1012 and 390x844; mouse and emulated touch on the title at all three sizes; locked-card behaviour; cleared state from a seeded save and from a real victory; reduceMotion; cold and warm first-paint timing; phone rail geometry.
- Approved-art identity by hash for all 26 sets and 146 files against the shipped manifest, plus in-play rendering, decode and facing spot-checks.
- Exact-artifact verification of the live site, byte-for-byte against the build, with the full manifest.
- Seeded win-rate benches for all five chapters on the reviewed build, credibly wrong tactics, researched survival routes, and the five Chapter 1 losing seeds replayed through the real route.
- Type-size sweeps at three viewports on the title, the board, the battle HUD, the pause screen and the party panel.
- Timed frame sequences for the title-to-board transition, one FFX party command and one FFX boss action, re-measured as frame-to-frame deltas.
- tsc and the full unit suite at 8f48237 in the clean release worktree (181 files, 4,566 tests).

### Reused, with its dependency argument

- **PR-0052, the FFX-2 Berserk silent turn** (from round-06) — git diff --name-only c71cd82 8f48237 -- src/battle returns nothing, so src/battle/ffx2/targeting.ts and src/battle/ffx2/execute.ts are byte-identical to the build round 06 reviewed. Both were re-read at 8f48237 rather than taking the report's word; no related defect has been opened or closed since; round 06's repair of the zero-row half is independently re-confirmed live (0 zeroRowMenus in chapters 4 and 5).
- **PR-0054, the Vegnagun Leg's unsourced Absorb fallback** (from round-06) — src/battle/ffx2/ai/vegnagun.ts is unchanged between c71cd82 and 8f48237, re-read at 8f48237, and research/ffx2-vegnagun-shuyin.md is unchanged.
- **Round 06's CHK-021 both-ways trace of the FFX-2 Berserk change** (from round-06) — The relevant engine files are byte-identical in this build; the presence/absence half was nonetheless re-sampled on this build's own HUD dumps rather than reusing the capture.
- **The carried majors and polish items PR-0005, PR-0010, PR-0011, PR-0016, PR-0017, PR-0018, PR-0019, PR-0021, PR-0035, PR-0057, PR-0060 and the polish list from PR-0027 down** (from round-06) — None of their files changed between fd0ae96 and 8f48237 and no related defect closed, so they carry at round 06's severity on round 06's evidence. Each is marked NOT RE-VERIFIED THIS ROUND in its own record: they are carried forward, not re-proved, and they are not counted as this round's coverage.

### Not tested

- Any browser other than Chromium: no Safari, Firefox or Edge evidence exists in any round.
- Real hardware: no physical phone, no real controller, no named-hardware frame-time or load measurement. RUBRIC §2 calls emulation no proof of any of the three.
- The 4:3, 21:9, 1440p and 4K shapes that a deep review is supposed to rotate through.
- A cold-start onboarding walkthrough (the briefing is switched off).
- A systematic player-facing copy sweep (CHK-007) and transient-overlay lifetimes (CHK-006).
- Save migration across an upgrade (CHK-024); only within-build persistence was proved.
- The FFX-2 half of the advisor bench (CHK-005 was proved in FFX only).
- The pause screen beyond Chapter 1 at three viewports, and beyond the two hero plates already matched.

### Required and not tested

- CHK-001 and CHK-B1: nobody heard this build. The audio category is UNVERIFIED and cannot be scored until Bailey auditions it.
- CHK-022 victory half for seymour-flux, braskas-final-aeon and ffx2-vegnagun-shuyin: three of five chapters have never been won, in any round, by any input path.
- A victory by a player's own command presses: both wins on record had the route walked with real keys and the fight handed to the documented autoBattle hook (PR-0043).
- CHK-006 and CHK-007, both mandatory in this plan and both recorded UNVERIFIED.
- Named-hardware performance evidence, which RUBRIC §2 requires and which no round has ever produced.

## Checks

| Check | Result | Mandatory | Scope | Mode |
|---|---|---|---|---|
| CHK-017 | **PASS** | yes | both · all | gpu, live |
| CHK-015 | **PASS** | yes | both · all five | real keyboard and mouse input, gpu, live |
| CHK-016 | **PASS** | yes | both · all folders under critic/rounds/round-07/evidence | gpu |
| CHK-016 | **FAIL** | no | both · this round's own harness | gpu |
| CHK-022 | **PASS** | yes | both · all five | real input, gpu, live |
| CHK-022 | **PASS** | yes | both · yunalesca (FFX) and ffx2-bahamut (FFX-2) | real-key route, fight driven by the documented autoBattle hook (labelled injected), gpu, live |
| CHK-022 | **UNVERIFIED** | yes | both · seymour-flux, braskas-final-aeon, ffx2-vegnagun-shuyin | gpu, live |
| CHK-023 | **PASS** | yes | FFX · 3 (Braska's Final Aeon and the Yu Pagodas) | ordered engine event log captured on the live site, gpu |
| CHK-023 | **PASS** | yes | FFX-2 · 4 (Bahamut) and 5 (Vegnagun and Shuyin) | real input, gpu, live |
| CHK-021 | **FAIL** | yes | both · chapter board dossier, FFX-2 tiles | gpu, live |
| CHK-020 | **FAIL** | yes | FFX versus FFX-2 · 1-3 versus 4-5 | source trace at 8f48237 plus live captures |
| CHK-013 | **PASS** | yes | both · all five | gpu, live |
| CHK-012 | **FAIL** | yes | both · chapter select | gpu, live |
| CHK-014 | **FAIL** | yes | both · 1-5 first command frames; ch1 after a KO | gpu, live |
| CHK-008 | **FAIL** | yes | FFX · 1 and 3 | gpu, live |
| CHK-011 | **FAIL** | no | both · 1 and 5 fail; 3 passes | gpu, live |
| CHK-003 | **FAIL** | yes | both · title, chapter select and battle | gpu, live |
| CHK-002 | **FAIL** | no | both · chapter select | gpu, live |
| CHK-010 | **PASS** | yes | both · chapter select and all five battle menus | gpu, live |
| CHK-009 | **PASS** | no | both · all five | gpu, live |
| CHK-004 | **PASS** | yes | both · 1-5, benched in 3 | real input, gpu, live |
| CHK-005 | **PASS** | yes | FFX · 3 | real input, gpu, live |
| CHK-006 | **UNVERIFIED** | yes | both · all five | gpu, live |
| CHK-007 | **UNVERIFIED** | yes | both · all five | gpu, live |
| CHK-018 | **PASS** | no | both · all five plus title and board | gpu, live |
| CHK-019 | **PASS** | no | both · the shipped bundle | manifest analysis |
| CHK-024 | **UNVERIFIED** | no | both · save and settings | gpu, live |
| CHK-001 | **UNVERIFIED** | yes | both · all five | no listening — agents cannot hear (AGENTS.md rule 13) |
| CHK-B1 | **UNVERIFIED** | yes | both · all five | human judgment, not obtained |
| CHK-B3 | **PASS** | no | both · title and chapter select | human judgment on record |

Every record's reason, evidence and minutes are in `critic/rounds/round-07.json`. Two entries carry the
same id deliberately: `CHK-016` passes for the captures and fails for the battle-log blob the first capture
pass wrote empty, and `CHK-022` and `CHK-023` are recorded per game and per outcome rather than averaged.

## Ranked issues

Critical first, then major, then polish, then suggestions; within a severity, Bailey's own reported
problems, frequency, player impact, coverage and effort — never whatever most cheaply lifts a decimal.
Full expected / observed / repro / evidence / fix / acceptance for each one is in the JSON.

**No critical defect was found.** One was proposed during this round and refuted on the live build: see
"What this round refuted" below.


### Major

**1. PR-0001 — Phone width renders the battle HUD at 2.7 to 4.0 effective px: two thirds of the in-battle text is illegible**
*both · chapter all five (measured in 1, Seymour Flux) · category interface · introducedByCandidate: false · regressionVsLive: false*

RE-MEASURED ON THIS BUILD, not reused. At 390x844 the first command frame reports 25 of 56 visible leaf text nodes under the floor, minimum 2.68 effective px: the two OD labels and "Overdrive" at 2.68, the whole CTB portrait column (Tidus, Seymour Flux, Mortiorchis, Kimahri, Yuna) at 3.41, the advisor header and "hide guide" at 3.47, the submenu counts x4 / x3 / x27 at 3.90 and every "/maxHP" and "/maxMP" at 4.02. Pausing over that frame keeps them: 25 of 113 nodes under the floor with the same 2.68 minimum. This is a different root from the new front end (PR-0066): the battle HUD scales its own type, the front end scales through --fe-k.

Smallest fix: Give the battle HUD its own type floor the way the front end needs one: clamp the HUD type tokens at 14px inside the narrow breakpoint and let the panels reflow or stack, rather than letting one scalar shrink type and layout together. Game case: BOTH — one shared battle HUD shell, measured in FFX and reported on the FFX-2 side of the same sweep.

**2. PR-0066 — The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor**
*both · chapter title and chapter select (gates all eight tiles) · category interface · introducedByCandidate: true · regressionVsLive: false · inNewFeature: true*

At 390x844 the chapter board reports 22 visible leaf text nodes at 9.54 effective px — the three party names, the LOCATION / BOSS / PARTY / BEST keys, the chapter numerals, the CTB badge, both visible "Coming" badges and all four control hints — with the chapter numeral at 10.27 and the chapter prose and boss line at 11.74. The title reports 9.54 for the eyebrow "An unofficial fan tribute" and for "Arrows / WASD", "Enter" and "Esc". At 1600x900 the same sweep has a minimum of 14.44 and at 2000x1012 of 16.24, so only the narrow breakpoint fails. Explicitly NOT a defect: fe-title__strap reports -14.44 / -16.24 because the measuring helper multiplies by matrix.a = -1 on the rotated vertical rail; the rail reads correctly at |eff| 14.44.

Smallest fix: src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.

**3. PR-0065 — The chapter board paints letter tiles and unpainted cards on arrival; the approved board only appears seconds later**
*both · chapter chapter select (all) · category visual · introducedByCandidate: true · regressionVsLive: false · inNewFeature: true*

The primary board capture at 1600x900 shows the PARTY row as a grey letter tile "T", Yuna painted, and a grey letter tile "K", while the IV Bahamut, V Vegnagun and Leblanc rows carry no thumbnail at all and II Lady Yunalesca and III Braska's Final Aeon do. Timed sampling puts numbers on it: on a cold load the three dossier faces read letter T / Y / K at the first sample, Tidus resolves at about 0.5 s, Kimahri at about 2.7 s and Yuna only at about 4.4 s; the board itself is on screen at 493 ms. It self-heals — the same row captured at 12 s shows three painted portraits — and it reproduces at 390x844 and with a cleared save. The featured card is correctly an ink silhouette (that is the approved treatment until the chapter is cleared) and is not part of this defect.

Smallest fix: Suspected: the board renders synchronously and the letter or empty card is what paints until each <img> load event fires. Smallest useful correction: await img.decode() on the selected chapter's three dossier faces and on the visible rows' thumbnails before the board's first paint — they are already in the preload list, so this costs a wait, not a fetch — and hold the previous card's art on a selection change. Failing that, make the fallback the ink silhouette the locked cards already use, so no state of this screen ever shows a letter. Game case: BOTH — one shared screen.

**4. PR-0063 — The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters**
*FFX-2 · chapter ffx2-bahamut and ffx2-vegnagun-shuyin (chapter board dossier) · category game-awareness · introducedByCandidate: true · regressionVsLive: false · inNewFeature: true*

The dossier renders art/portraits/yuna.png and art/portraits/rikku.png — Yuna in her X summoner look, Rikku in her X Al Bhed goggles — beside Paine, who is X-2 only, so the row is visibly two games at once. The correct assets ship and resolve: public/art/portraits/yuna-x2.png and rikku-x2.png exist and the same live session's Chapter 4 battle requests them. The FFX cards are correct (tidus/yuna/kimahri, tidus/yuna/auron), so the fault is FFX-2-only.

Smallest fix: The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.

**5. PR-0067 — At 390x844 the FINAL FANTASY X-2 group sits below an unmarked clip, and every control hint on that screen names a key**
*both (the hidden group is FFX-2) · chapter chapter select; hides ffx2-bahamut, ffx2-vegnagun-shuyin and the Leblanc coming card · category interface · introducedByCandidate: true · regressionVsLive: false · inNewFeature: true*

The phone board shows the hero, the prose slab, the FINAL FANTASY X heading and four tiles, then the dossier keys and the hints. The FINAL FANTASY X-2 heading and its three tiles are below .fe-rail's clip: the rail has 158 px of overflow and the page itself does not scroll (pageScrollable 0). There is no scrollbar, fade, chevron or count. The four control hints read "LEFT/RIGHT CHOOSE · UP/DOWN GAME · ENTER BEGIN · ESC BACK" — all keyboard, on a device with no keyboard — so the one affordance that does reveal the group is both unavailable and unmentioned to a touch player. It is not unreachable: pressing Down moves the selection from seymour-flux to ffx2-bahamut and the frame follows it, and the rail is overflow-y auto so a drag should scroll it. A touch drag on the rail was never attempted, so reachability by touch is untested.

Smallest fix: src/app/screens/frontend/frontend.css gives .fe-rail a fixed height with overflow-y:auto and nothing else in the narrow breakpoint. Smallest useful correction: add a bottom fade mask plus a persistent group indicator — for example pin the two game headings as a two-up switch above the rail, so both games are always visible even when their tiles are not — and add a pointer row to the hint bar. Game case: BOTH, one shared screen, though the group that disappears is the FFX-2 one.

**6. PR-0064 — The title's two figures have no perceptible gold rim, so they read as flat black cut-outs instead of the approved gold-rimmed ink silhouettes**
*both · chapter title screen · category target-fidelity · introducedByCandidate: true · regressionVsLive: false · inNewFeature: true*

The computed filter on both .fe-sil figures is brightness(0) drop-shadow(rgba(227,185,74,0.95) 0 0 1.11px) drop-shadow(rgba(227,185,74,0.3) 0 0 3.33px), on figures rendered at 149x231 and 161x216 css px at 1600x900 — a full-strength rim of about one pixel against a 230 px figure. Cropping the same relative region from the live capture and from after.png and scaling both to one width: the target has a continuous gold edge around both figures; the live build shows only a faint trace on a few high-contrast edges (hair, staff, the flower) and the bodies read as solid black. At 390x844 the rim is not perceptible at all. The reflections (brightness(0) blur(2.44px), no rim) and the 17 motes are present and correct.

Smallest fix: Scale the rim with the rendered figure instead of pinning it near 1 px: widen the inner drop-shadow to roughly 3 to 4 px at 1600-wide, expressed against the figure's own height, keep the soft outer one, then re-take the target-versus-build pair. Game case: BOTH — one shared title.

**7. PR-0068 — The FFX-2 HUD says "ACTIVE — ATB RUNNING" while the engine clock is frozen, and it can never say anything else**
*FFX-2 · chapter ffx2-bahamut (4) and ffx2-vegnagun-shuyin (5) · category interface · introducedByCandidate: false · regressionVsLive: false*

CONFIRMED on this artifact in both FFX-2 chapters. With .ffx2-atbmode visible and reading "ACTIVE - ATB RUNNING", a three-second hold moved the engine clock by nothing at all: chapter 4 ticks 8189 to 8189, events 8 to 8, battleLog 8 to 8; chapter 5 ticks 7891 to 7891, events 6 to 6, log 6 to 6. The chip is still visible at the end of the hold. Traced: src/ui/ffx2/FFX2BattleHud.ts:144 declares private atbMode: 'active' | 'wait' = 'active' and nothing ever assigns it, so line 956 can only ever print the ACTIVE string. Earlier rounds could not see the chip because it renders only while a cursor is live and the sampling press had already committed the command.

Smallest fix: Two parts, and only the first is this ticket: make the chip reflect the engine rather than a field nothing writes — drive it from the presenter's own clock state, and until Active ATB actually lands, print the truth (the clock waits for the command). The engine change to a real Active clock is the separate approved track.

**8. PR-0008 — Chapter 1's own intended strategy wins 26 of 40 seeds, and five of the fourteen losses are over within two to six player turns**
*FFX · chapter 1 (Seymour Flux) · category encounter · introducedByCandidate: false · regressionVsLive: false*

CARRIED AND STALLED — open at the same severity in rounds 04, 05, 06 and 07, so RUBRIC §8's stagnation rule applies and a written method check is owed before another batch in this area. Re-measured on this build, not reused: npx vitest run tests/unit/strategy-seymour-flux.test.ts in D:/pyrefly-release at 8f48237 prints 'seeds 1-40: 26 wins' (65 %) against Chapter 2's 39/40, Chapter 3's 39/40, Chapter 4's 40/40 and Chapter 5's 40/40. New this round: an independent bench over the same forty seeds reproduces the same fourteen losing seeds and times each in PLAYER turns — seeds 20, 10, 29, 15 and 18 end at player turns 2, 5, 5, 6 and 6, with Seymour still above 63,000 HP on four of them, and each of those five was then replayed through the real entry route on the live site. The live build corroborates it twice from the player's seat: the first legal route through Chapter 1 ended '0:43 Defeat' after three command-menu presses, and handing the fight to the game's own 'intended' strategy through the documented hook, after walking the route with real keys, still ended '0:48 Defeat' at 47 turns.

Smallest fix: Not proposed here. Under RUBRIC §8 the next batch in chapter 1 starts with a written method check instead of a third similar repair attempt: the current route and why it stalled, up to two alternatives, the smallest test that tells them apart, and one choice of continue / change method / small probe / defer / ask Bailey.

**9. PR-0007 — Chapter 1's signature mechanic has no counter-play: 37 of 44 Zombie kills give the player zero turns in between**
*FFX · chapter 1 (Seymour Flux) · category encounter · introducedByCandidate: false · regressionVsLive: false*

CARRIED AND STALLED — fourth consecutive review at the same severity. Re-measured on this build rather than reused: over seeds 1-30 there are 44 Zombie-to-KO events, 37 of them (84.1 %) with ZERO player turns between the Zombie landing and the kill, and the median window is 0. The seven non-zero windows are 12, 19, 4, 17, 33 and 28 turns, so the mechanic is either instant or nearly irrelevant with almost nothing in between. The number is bit-for-bit round 04's, which is expected: git diff --name-only fd0ae96 8f48237 -- src/battle src/data research returns nothing.

Smallest fix: A proposal, not a repair to apply unasked (AGENTS.md rule 10). The smallest sourced-looking lever is the scheduling of the Full-Life follow-up relative to the Zombie in src/battle/ffx/ai/seymour-flux.ts: if the research supports the two landing on separate scheduled turns rather than inside one AI step, separating them restores the window at no cost to the boss's numbers. If the sources do not settle it, say so and ask Bailey rather than tuning.

**10. PR-0002 — The FFX command plate covers a whole party member: Yuna is a staff tip above the menu in Chapter 1 and is not on stage at all in Chapter 3**
*FFX · chapter 1 (Seymour Flux) and 3 (Braska's Final Aeon) · category visual · introducedByCandidate: false · regressionVsLive: false*

Confirmed on this build by direct reading of the first command frame. In Chapter 1 the TALK / ATTACK / SPECIAL / WHITE MAGIC / ITEMS / FLEE plate sits over the left party station: Yuna's painting shows only as a ghost behind the translucent TALK row and as a staff tip above it, while Tidus and Kimahri stand clear. In Chapter 3 Yuna is not visible on stage at all and the CTB portrait column clips the right edge of Braska's Final Aeon. FFX-2 Chapter 4 and Chapter 5 are framed correctly, so this is an FFX stage-layout fault and not a shared one. What round 07 does NOT confirm is the stronger claim that Seymour Flux is reduced to a sliver at the first command frame: he reads clearly from the waist up, and only his right side is clipped by the column — the sliver appears at target selection, which is PR-0031's frame.

Smallest fix: Give the FFX stage a reserved gutter on both sides: inset the left party station so it clears the command plate's rectangle and the right enemy station so it clears the CTB column, measured from the panels' actual bounding boxes rather than by eye. Game case: FFX only — the FFX-2 stations already clear their panels.

**11. PR-0022 — A KO'd character is the standing billboard rotated about its centre, floating off the ground away from her station**
*FFX (observed); the treatment is shared, so it is expected in both · chapter 1 (Seymour Flux) · category visual · introducedByCandidate: false · regressionVsLive: false*

RAISED FROM POLISH TO MAJOR this round, on direct observation rather than a synthesized state: in a real-input capture of Chapter 1, after Yuna is KO'd (her party row reads 0/1500 and is greyed), she is drawn lying horizontally in mid-air at about the other actors' chest height, displaced far left of the party group into empty backdrop, with no ground contact and a white bloom over her torso. It is the most conspicuous wrong thing on screen in that frame, and a KO is a routine event in every chapter. Round 06 filed the same root as polish from a smaller sample; the severity is raised for visibility and frequency, not because the defect changed.

Smallest fix: Rotate the KO billboard about the actor's feet, not its centre, and keep it at the actor's own station on the ground plane; better, give the cast a dedicated downed pose. Game case: BOTH — one shared actor layer.

**12. PR-0031 — Target selection names the target but never says who is acting, that the arrows change it, or how to go back — and in two chapters the target itself is behind the HUD**
*both · chapter 1, 3, 4 and 5 · category visual · introducedByCandidate: false · regressionVsLive: false*

Re-measured this round, and one claim made during this round was REFUTED by the primary capture: the build does draw a target treatment. In Chapter 3 at 1600x900 a corner-bracket reticle, a gold pointer hand and an anchored name chip ("Yu Pagoda B") sit on the selected Yu Pagoda, the command list stays on screen and the Sensor panel reads its HP. What is still missing everywhere is the rest of the approved frame: no top TARGET plate, no actor chip saying who is acting, no PART pill or letter tag on the plate, no dimming of non-targets and no ENTER CONFIRM / arrows CHANGE TARGET / ESC BACK hint bar. Separately, in Chapter 1 the chip floats over empty ground because the enemy station sits under the CTB portrait column, and in Chapter 5 the target is at the right frame edge — those two are the staging fault of PR-0002 showing through this frame.

Smallest fix: Smallest useful step, in this order: restore the ENTER / arrows / ESC hint bar and the actor chip, then the PART pill and letter tag, then the dim. The anchoring failure in chapters 1 and 5 is fixed by PR-0002, not here. Game case: BOTH — the approved frames cover both games and the elements are missing in both.

**13. PR-0020 — The dialogue plate over-scales every portrait, so a speaker delivers the line with the top of the face cut off (merges PR-0056)**
*both · chapter all five · category visual · introducedByCandidate: false · regressionVsLive: false*

Confirmed on this build, and PR-0056 (Jecht framed off his face) is merged in as the same root: the portrait image is taller than the plate it sits in and is clipped at the top. Measured overflow: Jecht 398 px, Kimahri 231 px, Braska 176 px, Rikku 24 px. The worst player-visible case is the mid-battle beat in Chapter 1, where Seymour says his line with everything above his nose cut away, which removes the expression the line is carrying.

Smallest fix: Already written in the tree after this build: commit 71059ae 'Dialogue card: fit every portrait to its slot, fix Jecht, fix phone width', with 8fe4f99 behind it. Nothing new to design — the next deploy should carry it, and this review should verify it there.

**14. PR-0058 — Chapter 5 opens with a speaker who has no face: Nooj's portrait is absent, not merely mis-cropped (ten FFX-2 speakers, one ticket)**
*FFX-2 only (every FFX script speaker is covered) · chapter ch.5 (Nooj in the pre-battle scene, Lenne over five post-victory lines); ch.4 has the same gap for Leblanc, Logos, Ormi and Brother · category visual · introducedByCandidate: false · regressionVsLive: false*

Confirmed on this build through the real entry route. The dialogue card renders with the name plate 'Nooj' and no image at all: the portrait element resolves to img null with naturalWidth 0, so the plate is an empty frame. This is the first speaker a player meets in Chapter 5, the game's climax chapter. The other four chapters' first speakers (Kimahri, Braska, Jecht, Rikku) do render a painting.

Smallest fix: Supply or alias a portrait for Nooj in the portrait resolver, or, until the painting exists, let the card fall back to the ink-silhouette treatment the new chapter board already uses for an unpainted card, rather than an empty frame. The ten FFX-2 speakers with no portrait are one ticket, not ten. Game case: FFX-2 only — every FFX speaker reached this round has a painting.

**15. PR-0052 — A Berserked girl on a dressphere with no Attack spends her turn on nothing at all, with no action and no line — 3 of every 4 Berserked turns in Chapter 5 link 2**
*FFX-2 · chapter ffx2-vegnagun-shuyin, link 2 (the Vegnagun Leg) · category combat · introducedByCandidate: false · regressionVsLive: false*

CARRIED, unchanged, second consecutive review. Both files were re-read at 8f48237 rather than taking round 06's word: berserkCommand still returns { kind: 'defend', targets: [] } when buildCommands yields no attack row (src/battle/ffx2/targeting.ts:394-398), and execute.ts:145-155 finds no ability for that kind and calls finishAction, which emits only action-end plus an atb snapshot and never an action-start, so no ability name, no target and no message reach the presentation layer. The code's own comment records the reason honestly (research §2.8 says Attack only, §3.4-3.6 say those three dresspheres have no Attack command, and research/ does not settle it), which makes this an open question for Bailey rather than a coding mistake. git diff --name-only c71cd82 8f48237 -- src/battle returns nothing, so nothing about it moved in this build; round 06's repair of the zero-row half is independently re-confirmed live (0 zeroRowMenus in chapters 4 and 5).

Smallest fix: (a) Emit an action-start for the Berserked pass carrying the "Wait" row's own wording, so the log and the message bar name the turn the way a missed action is named; the vocabulary already exists at targeting.ts:368-378, which makes this cheaper than a new string. (b) Put the source conflict to Bailey rather than guessing: §2.8 says only Attack, §3.4-3.6 say those three dresspheres have no Attack command, and research/ does not settle it. The builder was right not to invent a damage row (AGENTS.md hard rule 6); only berserkCommand changes if the answer is "she swings anyway".

**16. PR-0012 — The FFX-2 command menu, unlike the FFX one, never tells the player what the highlighted row does**
*FFX-2 · chapter 4 and 5 · category interface · introducedByCandidate: false · regressionVsLive: false*

Re-confirmed on this build by direct reading of the first command frame in Chapter 5: the FFX-2 menu shows WHITE MAGIC / CHANGE / ITEM with no help line anywhere, while the FFX menu in Chapter 1 prints 'Physical damage' above the plate for the highlighted row. Same screen, same job, one game gets the work.

Smallest fix: Mount the same info slab in FFX2BattleHud and feed it from the FFX-2 CommandMenu's selection, reusing commandHelpText's FFX-2 registry lookup.

**17. PR-0006 — The move advisor repeats the chapter's own line whatever the board says: it told the player to recast an already-active Shell on all 13 of Yuna's turns, and the guided fight ran 9 minutes without resolving**
*both (shared advisor plumbing; AGENTS.md rule 14 case: BOTH, and CHK-020) · chapter measured in ffx2-bahamut (ch.4); the same shape measured in seymour-flux (ch.1); round 05 filed the KO/Zombie half in ch.1 · category interface · introducedByCandidate: false · regressionVsLive: false*

Over one guided real-keyboard route of chapter 4 the card printed the identical row on all 301 samples: "Shell -> the party - GUIDE'S PICK - IN WHITE MAGIC - 10 MP - 100% TO HIT - + SHELL"; distinct picks 1. Yuna cast Shell on every one of her 13 turns while the only Shell that ever landed was the first, at seq 19-21 on engine turn 2 with ticksRemaining 165634 on all three members; the whole 901-event log contains 4 status-add events. The party dealt 4,489 of Bahamut's sourced 8,400 HP in 61 engine turns over 9 minutes 5 seconds and the battle never resolved (endScreen "battle"). The blind route that ignored the advisor resolved the same encounter in 2:22. Chapter 1 shows the same shape: 6 of 6 picks were "Hastega -> the party". The advice is otherwise correct and actor-bound — buildAdvisorView returns Magic Break / Mental Break / Armor Break / Attack for Paine, Darkness for Rikku, Shell > Protect > Cure/Cura for Yuna, and never names Shell on a turn where every living active already has it; the repetition is the chapter-line branch, not the ranked branch. NOT RE-MEASURED THIS ROUND: the advisor was exercised (63 commands read off it and driven through the real menu in Chapter 3, 5

Smallest fix: Give the chapter-line branch the same state test the simulated ranking already applies: before recommendedCommand returns the tactic's pick, resolve it on the throwaway copy the advisor already builds and drop it when it changes nothing measurable — a buff whose status is already on every named target, a cure with nothing to cure. One guard in src/engine/tactics/advisor.ts, game-agnostic, and the same short-circuit round 05 traced for the revive branch, so one repair closes both halves.

**18. PR-0014 — HUD portrait chips crop through heads; the monogram half is repaired**
*both · chapter 1 to 5 · category visual · introducedByCandidate: false · regressionVsLive: false*

Half repaired, and that half is verified. Paine is now a painted face everywhere she was a letter monogram: party prep (left list and bottom bar, read at 4x), the pause party bar, the battle HUD chip and results — ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits, and the face is recognisable at chip scale (silver-and-red hair, red eyes, studded collar). The crop half is unchanged: the chips still cut the top of the head on Yuna, Rikku and Paine. PARTIALLY REPAIRED IN THIS BUILD: both Paine idles were replaced and src/ui/common/face-crops.json was re-measured, and Paine's HUD chip now crops her face (portraits/paine.png at 48x70, a 0.684 source aspect into a 0.686 slot, so no distortion either). The FFX half and the rest of the FFX-2 cast were not re-swept, so the ticket stays open.

Smallest fix: Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.

**19. PR-0016 — The Chapter 4 pause plate is cropped past its approved framing and loses Bahamut entirely**
*FFX-2 as observed; the framing rule is shared and should be checked for all five plates · chapter 4 (Bahamut) · category visual · introducedByCandidate: false · regressionVsLive: false*

Re-confirmed on this candidate's own capture. The chapter 4 pause plate is scaled to a face-only close-up: the eyes and cheek fill the frame and the character with Bahamut, the scarf, the costume and the sky that the approved painting composed around are outside the viewport. Chapter 1's plate, by contrast, holds its approved full-bleed framing at both sizes. NOT RE-VERIFIED THIS ROUND: the pause sweep covered Chapter 1 at 1600x900, 2000x1012 and 390x844 only.

Smallest fix: Give the Chapter 4 pause plate the same cover-fit rule the Chapter 1 plate uses, or a focal box that keeps Bahamut's head inside the frame at 16:9, instead of the current zoom.

**20. PR-0005 — The approved Turn cut-in never appears in play: showTurnCutIn has no production call site**
*both (the tile names chapter 1) · chapter observed in 1 · category visual · introducedByCandidate: false · regressionVsLive: false*

Re-traced on the candidate: no cut-in appears on any turn in any of this round's five real-input routes. showTurnCutIn is defined at src/ui/inkgold/cutin.ts:84 and re-exported at src/ui/inkgold/index.ts:17, and a grep over src/ finds no other reference — it has no production call site, so the approved target cannot be delivered. This is the "built but wired to nothing" class of AGENTS.md hard rule 4. NOT RE-VERIFIED THIS ROUND.

Smallest fix: Either wire the cut-in into the turn-start path of the presenter and HUD, at the same place the CTB list marks the new actor, or, if the direction has changed since the tile was approved, take it back to Bailey as an end-state question. This is the owner's decision, not a builder's silent one.

**21. PR-0060 — The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce**
*FFX only · chapter ch.3 (braskas-final-aeon) · category process · introducedByCandidate: false · regressionVsLive: false*

No shipped script gives yu-yevon a say() line. grep -rn "say('yu-yevon'" over src/story/ returns nothing, and a full trace of every say() id in every shipped script does not list it. yu-yevon is declared as a SpeakerId (src/story/dsl.ts:45) and exists as a combatant id, an AI script id and a music/sfx key, but its only story-layer uses are a trigger condition (braskas-final-aeon.ts:221, when: { type: "hp-below", who: "yu-yevon" }) and an fx call (line 349); the lines over his on-field reveal belong to Tidus and then Auron (lines 350-352). public/art/portraits/yu-yevon.png ships at 1.56 MB and can never be displayed as a speaker portrait. The tile's own note already records that the file is a safety net against a 404 rather than a face, which contradicts the acceptance case as written.

Smallest fix: An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.

**22. PR-0035 — The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile, and Bahamut is under-lit**
*FFX-2 · chapter 4 · category visual · introducedByCandidate: false · regressionVsLive: false*

The field is mirrored - Bahamut sits right of centre and the party stand left - and Bahamut is rendered much darker and lower-contrast than in the approved tile, where his red wings and purple armour carry the left third. Neither docs/handoff/presentation-ink-and-gold.md nor research/ffx-vs-ffx2-presentation.md states a party/enemy side convention, so whether the mirror is intended cannot be decided from the sources. NOT RE-VERIFIED against the tile this round.

Smallest fix: Ask Bailey once whether the FFX-2 field keeps the approved left-enemy composition or the mirrored one and record the answer against the tile. Either way, raise Bahamut's key light so he reads against the dark Bevelle backdrop as he does in the tile.

**23. PR-0010 — The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest**
*both (shared panel) · chapter 1 and 2 shown; anywhere the body overflows · category interface · introducedByCandidate: false · regressionVsLive: false*

The body is capped at 30 percent of the frame (src/ui/common/EnemyIntent.ts:214, 459-462) and overflows with only a 6 px mask fade, no scrollbar, no chip and no key. At Yunalesca turn 1 the third bullet, 'and the Blind counter never fires' - the rule that decides whether the fight is winnable - is sliced through the middle of its glyphs at the panel edge. At Seymour Flux turn 1 the third bullet reads 'Below 50% HP Seymour answers with Reflect and' with 'phase 2 opens' cut off. The only way to reach the hidden text is a mouse wheel over the panel. NOT RE-VERIFIED THIS ROUND.

Smallest fix: Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.

**24. PR-0011 — The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named**
*FFX (FFX-2 already shows it) · chapter 1 (Seymour Flux) · category interface · introducedByCandidate: false · regressionVsLive: false*

The panel reads 'Lance of Atrophy / SCRIPTED / Physical non-elemental damage to one character - never misses' with a DAMAGE block (TIDUS 707-799, 31% HP) and then the counter list. Zombie is not mentioned anywhere. The Statuses block that would carry it renders only at density 'full' (EnemyIntent.ts:785) and FFX deliberately mounts the panel at density 'brief' (FFXBattleHud.ts:431). The data is there: lanceOfAtrophy carries statusEffects zombie chance 100 (src/data/ffx/enemies/seymour-flux-abilities.ts:88). NOT RE-VERIFIED THIS ROUND.

Smallest fix: Do not widen the FFX panel: keep the brief density that round 02 asked for, but promote a guaranteed or high-chance status into the brief body, either appended to the description line ('- inflicts Zombie') or as a chip beside SCRIPTED. A 100 percent status is not optional detail, it is the move. FFX only.

**25. PR-0013 — FFX-2 letters enemies by formation position, so a unique boss is lettered A and its identical sub-parts become B, C and D**
*FFX-2 · chapter 5 (Vegnagun and Shuyin), links 2 to 4 · category interface · introducedByCandidate: false · regressionVsLive: false*

src/ui/ffx2/FFX2BattleHud.ts:827-834 letterTagOf() returns String.fromCharCode(65 + enemies.indexOf(id)) whenever the live enemy count is two or more, with no grouping by name. Driven live with real keys to Chapter 5 link 2, the engine enemy list is [vegnagun-leg 'Vegnagun', node-a 'Node', node-b 'Node', node-c 'Node'], so the unique Vegnagun is lettered A and the three identical Nodes become B, C and D - the opposite of what src/battle/ffx/turnQueue.ts:256-265 now does. vegnagun-body (Bulwark x2) and vegnagun-head (Redoubt x2) hit the same case. The player-facing cost photographed today: three identical NODE boss gauges with nothing to tell them apart and an intent panel reading 'NODE - Dies Irae - ACTS NEXT' with no way to know which Node. STILL VISIBLE THIS ROUND: the Chapter 3 CTB column letters the two Yu Pagodas A and B and the target chip reads 'Yu Pagoda B', which is the intended half; the FFX-2 half was not re-swept.

Smallest fix: Do not copy the FFX rule across on a reviewer's say-so. Ask Bailey the narrow question - for a boss plus its same-named sub-parts, does FFX-2 letter from A per name group, and is a lone fiend plain? - then apply the same display-name grouping turnQueue.ts letterTagFor() now uses.

**26. PR-0017 — At phone width one of Chapter 1's two enemies is entirely off-screen**
*both (shared camera fitting); observed in FFX chapter 1 · chapter 1 (Seymour Flux) · category visual · introducedByCandidate: false · regressionVsLive: false*

At 390x844 the camera zooms to preserve Seymour Flux's height and pushes Mortiorchis more than 95 percent outside the viewport - only a few pixels of green tentacle remain at x 376-390. The enemy is still in the CTB list, still in the enemy card and still targetable, but the player cannot see what they are aiming at. The lower 40 percent of the screen is empty backdrop at the same time, so the space exists. NOT RE-VERIFIED THIS ROUND: the 390x844 sweep captured the first command frame and pause, not the enemy stations.

Smallest fix: Fit the camera to the enemy formation's bounding box rather than to the lead enemy's height, using the empty lower band. The phone layout is an approved gap awaiting Bailey's options, so this belongs with that decision rather than as a standalone tweak.

**27. PR-0018 — The selected command label is the least readable text on screen, at 1.53:1**
*both (shared Ink & Gold command-row tokens); observed in FFX chapter 3 · chapter 3 (Braska's Final Aeon) · category interface · introducedByCandidate: false · regressionVsLive: false*

The cursor opens on TALK, which is disabled, and its label renders in a muted brown on the gold selection slab. Measured glyph #C39432 against slab #E4BC4D gives a contrast ratio of 1.53:1, below the 3:1 floor for large text; the unselected ATTACK row directly beneath measures 15.44:1. The player's current selection is the hardest thing on the screen to read. NOT RE-MEASURED THIS ROUND.

Smallest fix: Give the selected-and-disabled state its own token: keep the gold slab but use the normal near-black label at reduced opacity, or invert the slab, so selection never reduces contrast below 4.5:1.

**28. PR-0019 — The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending**
*both (shared help-slab composition); observed in FFX · chapter 1 (Seymour Flux) · category interface · introducedByCandidate: false · regressionVsLive: false*

The slab reads 'Inflicts Cheer Hits the whole par' with the green ALL ALLIES chip drawn over the final word - a hard overlap, not an ellipsis - because the chip is drawn inside the slab's own box rather than beside it, and there is no punctuation between the two clauses. NOT RE-VERIFIED THIS ROUND.

Smallest fix: Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.

**29. PR-0021 — The banter bank is authored but not implemented: no formation-screen or victory-screen exchanges exist in either game**
*both · chapter party prep and results, all five · category narrative · introducedByCandidate: false · regressionVsLive: false*

Confirmed still open and unchanged. git diff 740ab21..c71cd82 -- src/ touches no file that could feed a banter slot, and chapter 4's and chapter 5's prep and results captures show no exchange. Second consecutive review leaving it open at the same severity, so RUBRIC §8's method check applies to the next batch in this area. NOT RE-VERIFIED THIS ROUND.

Smallest fix: Add a banter table beside the writing bible's own tags and a picker that matches slot, suitability and mood to the current formation and outcome, then host it on the prep screen and the victory results screen.

**30. PR-0057 — At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line**
*both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing) · chapter reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent · category visual · introducedByCandidate: false · regressionVsLive: false*

The whole card is compressed into a roughly 60 px strip at the bottom of the 844 px viewport (slot 77x81 at y=747). The .chint bar renders over it: in chapter 5 "ENTER ADVANCE - HOLD ENTER SKIP - ESC MENU" sits across Nooj's name, his YOUTH LEAGUE plate and his line "Baralai carries him."; in chapter 1 the same bar sits across Kimahri's name and line and his portrait is reduced to a sliver. The hint bar is 443 px wide inside a 390 px viewport (x = -27, overflowing 27 px past each edge). Kimahri's image is 94x137 at y=716 against a 77x81 slot at y=747 — larger than its slot in both axes, PR-0020 again at this size. NOT RE-VERIFIED THIS ROUND; commit 71059ae in the tree claims the phone-width half.

Smallest fix: Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.

**31. PR-0015 — Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5**
*FFX-2 · chapter 5, battle 1 of 5 · category visual · introducedByCandidate: false · regressionVsLive: false*

Re-observed on this candidate: Vegnagun's green tail tip still reads as an un-keyed green shard stuck to Rikku's forearm through all of chapter 5.

Smallest fix: Move the Chapter 5 battle-1 enemy slot right, or the party line left, so the tail's green tip clears the party quads. Do not repaint either approved plate.


### Polish

**32. PR-0069 — The possessed-aeon mirror does not mirror affinities, although the source comment says it does**
*FFX · chapter 3 (Braska's Final Aeon, the possessed-aeon links) · category combat · introducedByCandidate: undefined · regressionVsLive: undefined*

Traced, not grepped. src/battle/ffx/setup.ts:241-253 mirrorPossessedAeon correctly overwrites stats, HP, MP and the form's HP from the live AeonBuild with Luck forced to 1 — that part is wired and is what hard rule 4 exists to catch. But the doc comment two lines above (src/battle/ffx/setup.ts:235) says "Affinities are mirrored too, so 'hit its weakness' means something", and the code does c.affinities = { ...c.affinities }: a shallow copy of the enemy's OWN affinities, a no-op. It could not do otherwise — AeonBuild (src/battle/common/types.ts:2353-2372) carries no affinities field to mirror from. There is no observed player effect: the possessed aeon uses the affinities in its data file, which is a defensible authored choice. The defect is that the source asserts a behaviour the data model cannot provide, which is exactly the kind of statement a later change will trust.

Smallest fix: Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.

**33. PR-0070 — Winning Chapter 2 cuts straight from the battle to the results card with no post-battle scene, while Chapter 4 plays one**
*FFX · chapter 2 (Lady Yunalesca) · category narrative · introducedByCandidate: undefined · regressionVsLive: undefined*

On the first victory ever recorded through the normal entry route, Chapter 2 goes battle -> results with afterBattle = "results" and postSceneLines empty. The aftermath the player does get is the victory quip on the results card ("...Okay. Next one.") and the ledger. Chapter 4 plays a post-battle scene in the same run of the same harness, so the machinery exists and Chapter 2 does not use it. Whether Yunalesca is meant to have one is a question for Bailey, not an assumption for a reviewer.

Smallest fix: Ask Bailey whether Chapter 2 should have an aftermath beat; if yes, it is a script, not a mechanism. Game case: FFX only unless Bailey says the rule is shared.

**34. PR-0074 — The advisor's explanation prints the status name twice: 'inflicts Haste / Haste on the party.'**
*both (observed in FFX) · chapter 1 (Seymour Flux) · category interface · introducedByCandidate: undefined · regressionVsLive: undefined*

The advisor card for Hastega reads "Speeds the party's turns up · inflicts Haste" and then, on the next line, "Haste on the party." — the status name lands twice and the second line is a fragment. The same duplication appears in the pause capture's text dump. Round 06's PR-0026 ('Haste is ctb x 8/16') does not appear in this build, so the developer-vocabulary half of that copy looks repaired and this is what replaced it.

Smallest fix: Suspected: the effect clause and the status clause are composed independently and both name the status. Compose one of them. Game case: BOTH — shared advisor copy.

**35. PR-0073 — The title offers exactly one pointer target, labelled PRESS ENTER, with keyboard-only hints — a touch player is never invited to tap**
*both · chapter title · category onboarding · introducedByCandidate: undefined · regressionVsLive: undefined*

The pointer path itself WORKS and a claim that it does not was refuted this round: the chip is <span class="fe-title__chip" data-action="confirm" role="button" tabindex="0">, it is the only [data-action] node on the screen, and one click at its centre (128,554 at 1600x900; 144,624 at 2000x1012) or one tap at (82,281) in a 390x844 touch context moves screen() from 'title' to 'chapter-select'. What remains is wording and reach: the chip is the ONLY pointer target — a click anywhere else does nothing — it is a 131x43 button at phone size, and it says PRESS ENTER beside a ControlsHint row that names Arrows / WASD, Enter and Esc and no pointer at all.

Smallest fix: Give the chip a pointer-aware label (or a second line) and add a pointer row to the title's ControlsHint, the way the board carries its own hints; optionally accept a pointerdown anywhere on the title root. Game case: BOTH.

**36. PR-0043 — No chapter has been won by real input alone: the two victories on record had the route walked with keys and the fight handed to the game's own strategy**
*both · chapter all five · category process · introducedByCandidate: false · regressionVsLive: false*

LARGELY REPAIRED THIS ROUND, and restated. For the first time the victory half of CHK-022 is on record in both games: Chapter 2 (FFX) reads 'ZANARKAND DOME - THE GREAT HALL · CLEARED · 3:20 · Victory · NEW BEST' with AP 14,000 x3, GIL 9,000 and a Lv 3 Key Sphere; Chapter 4 (FFX-2) reads 'BEVELLE UNDERGROUND - LIMBO · CLEARED · 1:36 · NEW BEST' with EXP 1,300 x3, AP 15 per dressphere, GIL 1,000 and a Gris Gris Bag; both returned to the board with the card cleared and both survived a full page reload, so the cleared state is read back from the save. What is still missing is narrower than round 06's ticket: the ROUTE was real keys but the FIGHT was driven by the documented autoBattle('intended') hook, so no chapter has been won by a player's own command presses, and chapters 1, 3 and 5 have not been won at all.

Smallest fix: One real-input win per game, on a seed the bench says the intended line wins, driven through the command menu. Chapter 2 and Chapter 4 are the cheapest candidates at 39/40 and 40/40.

**37. PR-0061 — The player waits 6.3 to 9.9 seconds after the battle screen appears before the first command menu accepts input, in every chapter**
*both · chapter all five · category feel · introducedByCandidate: undefined · regressionVsLive: undefined*

Measured on the candidate with real keys: battle screen to first interactive command menu is 9,887 ms in chapter 1, 6,260 ms in chapter 2, 6,317 ms in chapter 3, 7,340 ms in chapter 4 and 8,631 ms in chapter 5. Every other transition is fast (title to chapter select 252-290 ms, chapter select to prep 1-76 ms, prep to scene 62-152 ms, skip release to battle 1-657 ms). No key press was found that shortens the opening beat. Frame pacing during this window is not the cause: the trace records 1,919 frames over 31.98 s at mean 16.67 ms, p99 16.8 ms, 0 frames over 33 ms, approximately 60 fps.

Smallest fix: Confirm the intended length with the presenter's owner; if it is not intended, let a confirm press end the battle-start moment the way the cutscene skip already works.

**38. PR-0062 — The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody**
*FFX-2 · chapter ffx2-vegnagun-shuyin, link 2 · category process · introducedByCandidate: undefined · regressionVsLive: undefined*

Two facts block that capture and both belong in the record. (1) z06-passes and z06-berserk construct an isolated vegnagun-leg battle with engine.setSeed(n), while in shipped play each link is seeded from the chapter run (docs/DEV.md: engines are seeded per battle via BattleSetup.seed), so __pyrefly.setSeed(13) before chapter 5 is not the bench's seed 13. The seed-finder confirms the bench-side hits (seeds 3, 13, 27, 36, 38 put Yuna in White Mage under Berserk, earliest at turn 8) but they address the fixture, not the game. (2) Twenty in-game seeds (1-20) were swept, skipping link 1 and watching link 2 at normal speed, polling battleState about every 300 ms. The Leg link was reached in all 20 runs and Berserk was applied to nobody in any of them, although the AI path is live (src/battle/ffx2/ai/vegnagun.ts:72-87 rolls 1-in-3 Berserk / Break / Slow, and Slow was observed landing on Yuna on link 2 in a diagnostic run) and the bench predicts Berserk on a party member in about 6 of 24 isolated Leg battles. A false hypothesis was chased and discarded: legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", but re-running z06-legai proves the unprefixed ids d

Smallest fix: Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.

**39. PR-0054 — The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference**
*FFX-2 · chapter ffx2-vegnagun-shuyin, link 2 · category combat · introducedByCandidate: undefined · regressionVsLive: undefined*

research/ffx2-vegnagun-shuyin.md:708-711 gives the Absorb fallback explicitly for two of the three branches — "1/3: Berserk on a non-Berserked char (if all Berserked -> Absorb)" and "1/3: Slow on a non-Slowed char (if all Slowed -> Absorb)" — and gives no fallback for "1/3: Break on a non-Petrified char". src/battle/ffx2/ai/vegnagun.ts:82-85 applies the same Absorb fallback to all three, and the function's doc comment cites §5.2 for the whole rule including the Break case. The extrapolation is reasonable and probably right; it is not marked as one.

Smallest fix: Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.

**40. PR-0034 — The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow**
*FFX · chapter 1 (Mt. Gagazet) · category visual · introducedByCandidate: undefined · regressionVsLive: undefined*

The shipped gagazet.png is byte-identical to the approved copy and renders faithfully under the pre-battle scene camera, where the composite is a close match. Under the battle camera the same painting is darkened and desaturated to a flat navy wall: the moon and the lit snow floor are gone, and a backdrop-only patch measures mean luminance 70 against the source painting's 114, so the arena reads as a dark cave.

Smallest fix: Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.

**41. PR-0036 — The FFX-2 party crowds the left third of the stage while two thirds of it is empty**
*FFX-2 · chapter 4 · category visual · introducedByCandidate: undefined · regressionVsLive: undefined*

Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.

Smallest fix: Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.

**42. PR-0027 — Unrendered markdown reaches the screen: 'the target *she* last picked'**
*FFX for the string; the guard is shared · chapter 2 · category interface · introducedByCandidate: undefined · regressionVsLive: undefined*

The bullet prints the literal asterisks: 'Her Blind/Silence gate reads the target *she* last picked, not your attacker'. 'gate' is also engine-speak in a sentence otherwise written for players. The research citation on the same string is correctly stripped, so only the emphasis markup leaks.

Smallest fix: Drop the asterisks and reword 'gate' to 'counter'; if emphasis is wanted, let the panel's plain() helper turn a paired asterisk run into a span, and assert no rendered intent line contains an unpaired asterisk.

**43. PR-0028 — H does not hide the panels it is labelled for during battle**
*both · chapter 1 to 5 · category interface · introducedByCandidate: undefined · regressionVsLive: undefined*

In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.

Smallest fix: Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.

**44. PR-0029 — Yu Pagoda A and B carry no always-on field marker**
*FFX · chapter 3, battle 1 of 7 · category interface · introducedByCandidate: undefined · regressionVsLive: undefined*

The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter. PARTIALLY ANSWERED THIS ROUND: the Chapter 3 CTB column does letter the two pagodas A and B and the target chip carries the letter, but there is still no always-on marker on the field itself.

Smallest fix: Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.

**45. PR-0041 — FFX-2 items were unreachable through the command menu for 17 and 12 consecutive turns in the review's harness**
*FFX-2 · chapter 4 and 5 · category interface · introducedByCandidate: undefined · regressionVsLive: undefined*

logs/ffx2-bahamut-run.log records 'revive with a Phoenix Down failed (unreachable); rows=ATTACK|SKILL|CHANGE|ITEM' on every turn from 22 to 38, and ffx2-vegnagun-shuyin-run.log records 'heal with a potion failed (unreachable)' on every turn from 3 to 13. The ITEM row is present in both. In FFX the same harness used Potion, Hi-Potion, X-Potion, Phoenix Down and Eye Drops successfully. The asymmetry is what makes it worth checking rather than dismissing.

Smallest fix: None proposed until reproduced by hand. Reproduce with real arrow keys first; if the submenu does open for a human, fix the harness and say so.

**46. PR-0037 — Mid-battle beats hard-code speakers who are not in the active formation**
*FFX observed; the same shape exists in the other chapters' midScripts · chapter 1, beat 'first-zombie' · category narrative · introducedByCandidate: undefined · regressionVsLive: undefined*

The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.

Smallest fix: Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.

**47. PR-0039 — 3 of 21 shipped cues have no tempo map, so written rubato cannot bend the pulse**
*both - scene-gagazet and scene-dreams-end are FFX cues, scene-farplane is FFX-2; the cause is shared renderer plumbing · chapter the pre-battle scenes of chapters 1, 3 and 5 · category audio · introducedByCandidate: undefined · regressionVsLive: undefined*

node tools/audio/themes-audit.mjs scene-gagazet scene-dreams-end scene-farplane --verbose marks all three FAIL, in each case solely on 'no tempo map on a lyrical cue'. Every other check for the three is a note or expected. Predates Build A.1 and is not a regression.

Smallest fix: Implement THEMES.md's requested Track.tempo?: Array<[beat, bpm]> with linear interpolation and give these three a written tempo curve; or, if an arranger judges a static pulse acceptable for one of them, add it to TEMPO_MAP_EXEMPT with a reason as boss-dread and scene-bevelle-underground already are.

**48. PR-0032 — No text size, no key remapping, and no in-game motion or flash accommodation**
*both · chapter all · category onboarding · introducedByCandidate: undefined · regressionVsLive: undefined*

Unchanged, and this candidate widens it: with ONBOARDING_LIVE = false there is no in-game help at all, on top of the accessibility gaps round 05 recorded. No text size control, no key remapping, no motion or flash accommodation.

Smallest fix: Needs an end state from Bailey before it is built, because it changes a screen he will see (AGENTS.md rule 9). The cheapest step that needs no new decision is to surface the reduceMotion flag the game already reads as a seventh OPTIONS row, since the behaviour behind it already ships.

**49. PR-0033 — The defeat screen has no approved target and tells the player nothing about why they lost**
*both · chapter all · category onboarding · introducedByCandidate: undefined · regressionVsLive: undefined*

After a loss the screen shows the word Defeat, TURNS, ATTEMPTS, BEST / NEVER CLEARED and RETRY / CHAPTER SELECT; in FFX the right half is empty black (PR-0003). It never names what killed the party, which objective went unmet, or what to try differently - and in this review the party lost eleven times across four chapters with no guidance between attempts.

Smallest fix: Take the defeat screen through the standing end-state process: two to four options for Bailey before anything is built. Nothing here should be implemented without that pick.

**50. PR-0071 — Two debug-API traps cost this round a day of coverage: battleLog() empties at teardown and autoBattle() silently does nothing before the first menu**
*both · chapter all five · category delivery · introducedByCandidate: undefined · regressionVsLive: undefined*

Two behaviours, both found the hard way and both now root-caused. (1) window.__pyrefly.battleLog() returns an EMPTY array once the battle screen is torn down: sampled after the outcome it reads [] in all five chapters (logAfterBattle 0, screen already 'results'), which is why this round's first capture pass stored "[]" for every chapter and one mandatory check could not be judged until the gap pass re-ran it. Sampled while screen() === 'battle' the same call returns the real stream (max length during the fight: ch1 37, ch2 195, ch3 238, ch4 457, ch5 211). (2) autoBattle('intended') only takes effect once awaitingMenu is already true; called on entry to 'battle' it returns true and does nothing, and a run left that way sat at ticks 0 for 300 s. Both are reviewer-facing, not player-facing.

Smallest fix: Keep the last battle's log readable after teardown (or make battleLog() throw once the battle is gone rather than return an empty array), and make autoBattle() either wait for the first menu or return false when it cannot take over. Then add the sentence to docs/DEV.md. Game case: BOTH — shared debug API.


### Suggestion

**51. PR-0044 — 16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them**
*both (15 of the 16 are FFX-2 dresspheres) · chapter n/a · category visual · introducedByCandidate: undefined · regressionVsLive: undefined*

paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.

Smallest fix: Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.

**52. PR-0072 — Vegnagun has no ground contact and Paine stands inside its cannon barrel**
*FFX-2 · chapter 5 (Vegnagun and Shuyin) · category visual · introducedByCandidate: undefined · regressionVsLive: undefined*

Two of the three things reported during this round hold and one does not. Vegnagun's underside ends in a hard edge above the plain with no cast shadow or contact pool, while all three girls sit on visible contact rings; and Paine's billboard intersects the green cannon barrel so she reads as embedded in the machine rather than standing in front of it. The third claim, that Vegnagun is undersized and reads as a prop, is NOT supported by the capture: it dominates the frame horizontally and stands well above the party. Filed as a suggestion rather than a defect because the approved tile does not settle the depth staging and Bailey has not reacted to this frame.

Smallest fix: Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.


### Closed this round

**53. PR-0059 — Evidence integrity: three of this round's recorded claims are contradicted by its own data files (CHK-016 FAIL)**
*both · chapter all five, plus the dark probe · category process*

Status: closed — a round-06 reporting defect, not a product one; this round re-derived every claim it touched from primary evidence

**54. PR-0053 — A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation**
*FFX-2 · chapter ffx2-vegnagun-shuyin · category combat*

Status: closed — round 06 recorded the id with no record; this round re-derived the affected claims from primary evidence and the divergence does not recur at 8f48237

**55. PR-0026 — Developer vocabulary on screen: 'Haste is ctb x 8/16'**
*FFX (the string); sweep the other four guides · chapter 1 · category interface*

Status: closed — not present in this build: the Hastega card now reads in player words, and the duplication that replaced it is PR-0074

## What this round refuted

Adversarial about evidence means adversarial about our own. Three claims raised inside this round did not
survive checking, and dropping them matters as much as keeping the rest:

- **"The title screen cannot be passed with a mouse or a touch screen."** Proposed as a critical. It does not
  reproduce. The chip is `<span class="fe-title__chip" data-action="confirm" role="button" tabindex="0">`, it
  is the only `[data-action]` node on the screen, and one click at its centre at 1600×900 and 2000×1012 and
  one tap at 390×844 each move `screen()` from `title` to `chapter-select`. The nine probe points that
  "failed" all missed the button. What survives is a wording and affordance nit, filed as PR-0073.
- **"Target selection draws no target: no reticle, no dimming, no banner."** Chapter 3 at 1600×900 draws a
  corner-bracket reticle, a gold pointer hand and an anchored name chip on the selected Yu Pagoda, with the
  command list still on screen. What is genuinely missing is the actor chip, the PART pill, the dim and the
  confirm/change/back hints — PR-0031, restated to what the captures actually show.
- **"Vegnagun is undersized and reads as a prop."** Not supported by the capture: it dominates the frame.
  The ground contact and the Paine overlap in the same report are real and are kept, as PR-0072.

A fourth correction runs the other way: **PR-0022, the KO billboard, is raised from polish to major** on
direct observation in a real-input capture, for visibility and frequency, not because the defect changed.

## What stands between this build and acceptance

The 9.60 standard is unchanged by the 2026-09-21 release rules: shipping and finishing are different
questions, and this build ships while being a long way from finished. Concretely:

1. **Audio has never been judged.** Nobody has heard 8f48237. Until Bailey auditions a build, the category is
   UNVERIFIED, the score is provisional, and the milestone gate cannot even be evaluated. This is now two
   consecutive rounds.
2. **Every one of the nine scored categories is below the 9.0 floor**, onboarding worst at 4.6. The floor is a
   gate, not an average: nine separate categories have to move.
3. **31 majors are open.** Seven of them are new, five of those seven are inside the front end this build
   introduced, and two of them — PR-0007 and PR-0008 — are now open at the same severity in four consecutive
   reviews, which triggers §8's stagnation rule.
4. **Seven mandatory checks are FAIL or UNVERIFIED**: CHK-003, CHK-008, CHK-012, CHK-014, CHK-020, CHK-021
   fail; CHK-001, CHK-B1, CHK-006, CHK-007 and half of CHK-022 are unverified.
5. **Three of five chapters have never been won, in any round, by any input path**, and the two wins on record
   had the fight driven by the game's own strategy rather than a player's presses.
6. **Only 11 of 28 required targets match**, and four of the misses are on this release's headline screens.
7. **No evidence exists for real hardware, a real controller, a real phone, Safari, Firefox or Edge, or
   frame-time and load measurement on named hardware** — in this round or any earlier one.

## What changed since round 06

Round 06 reviewed candidate `c71cd82`, which is the live build `fd0ae96`. Rounds 02 and 03 were scored under
rubric v1 and their A/B/C numbers are history under another rubric; nothing here is compared with them.

**Better than round 06:**

- LIVE-A2-1 is fixed: the Chapter 4 prep screen shows painted faces for Yuna, Rikku and Paine, and Paine's
  HUD chip crops her face.
- 42 owner-approved poses ship, byte-identical, and every chapter's art still loads and decodes.
- The desktop front end is a genuine gain: a clear, legible chapter board, locked cards that behave, cleared
  state read from the save, and a title that honours `prefers-reduced-motion` byte-for-byte.
- Coverage that no round had before: the victory half of CHK-022 in both games, with the post-battle scene,
  the reward ledger, the cleared card and a page reload; and the FFX-2 half of CHK-023 from ordered engine
  logs on the live artifact, which round 06 could not produce.
- `prep` rises 8.0 → 8.2 on that new evidence; `visual` rises 7.6 → 7.8 because two of that number's
  deductions were overstated and I say so rather than leaving a number I cannot defend.

**Worse or newly exposed:**

- Five new majors inside the new front end (PR-0063 to PR-0067), all measured against Bailey's own approved
  pictures.
- PR-0068, newly proved and traced: the FFX-2 HUD asserts the ATB is running while the engine clock is frozen,
  and the field it reads is never assigned.
- The phone story is worse than round 06 recorded: the battle HUD measures 2.68 effective px at 390×844.

**Unchanged, and that is the point:** `git diff fd0ae96 8f48237 -- src/battle src/data src/engine/tactics
research` is empty. `combat` and `encounter` hold at 8.8 and 8.9 because nothing in them moved, not because
nobody looked — both were re-run on the reviewed build rather than reused.

## Proposals (nothing here is built without Bailey's yes)

Unscored. Each is a smallest-useful correction for an issue above, not a new idea for the game.

1. Give the FFX stage a reserved gutter on both sides, measured from the command plate and CTB column bounding boxes rather than by eye, so no living party member or boss can sit under a panel (fixes PR-0002 and the anchoring half of PR-0031). FFX only — the FFX-2 stations already clear their panels.
2. Give the type tokens their own 14 px floor inside the narrow breakpoint on both the front end and the battle HUD, and let the phone column reflow rather than shrink (PR-0066, PR-0001). Both games, one shared shell each.
3. Await decode on the board's on-screen art before its first paint, and make the fallback the ink silhouette the locked cards already use, so no state of the chapter select ever shows a letter tile (PR-0065).
4. Bring Bailey the measured Chapter 1 table and let him choose: the boss-side-fix rule asks for measured options, and the two sourced candidates are the Gagazet party build's opening resources (player-side, boss untouched) and Seymour Flux's own sourced opening rotation. Change no boss stat before he picks (PR-0008, PR-0007).
5. Ask Bailey the one question research/ leaves open on Berserk in FFX-2: does a girl on a dressphere with no Attack command swing anyway, or does she lose the turn? Until then, make the lost turn legible (PR-0052).
6. Give the cast a dedicated downed pose, or at minimum rotate the KO billboard about the feet and keep it at its own station (PR-0022).
7. Let an unpainted speaker fall back to the ink-silhouette treatment the new board already uses, rather than an empty frame, until the ten FFX-2 portraits exist (PR-0058).
8. Add a pointer row to the title and board hint bars and a scroll affordance to the phone rail, so a touch player is told how to start and can see that a second game group exists (PR-0073, PR-0067).
9. Fix the two debug-API traps before the next review spends a pass on them: keep the battle log readable after teardown and make autoBattle report when it cannot take over (PR-0071).

Two of these are questions before they are changes, and neither should be built until Bailey answers:
the Chapter 1 difficulty decision (measured options, per the boss-side-fix rule — an agent does not tune a
sourced boss), and the FFX-2 Berserk question the research does not settle.

