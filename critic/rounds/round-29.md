# Round 29: deep review of the live build e9907cad8 (release 64)

```text
Build / artifact / target version: main e9907cad8, bundle BygGxbJE, artifactHash d764fe0ed0580d31a9e272db3824d205e11aba276132517dca8b27371c9d9966, targets ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98
Review: deep (the live build https://echoesofspira.com/, owed since release 61 / round 28)
Deployment: PASS
Changed area: FAIL
Ship: SHIP (interim build under rule A; majors disclosed below)
Milestone: not assessed
Quality: provisional, no full score (no verified number for audio, onboarding, prep, delivery; round 28 was provisional too); scored categories: combat 9.5, encounter 9, visual 8.3, feel 8, narrative 8.7, interface 8.1
Targets: required 8 / matched 6 / failing 0 / unverified 2 / waiting 1
Top issues: PR-0380 (hard-cut pose swaps under the pack), PR-0459 (Auron head size in the close-up), PR-0379 (double-image swaps), PR-0517 (Rikku and Paine ready poses), PR-0513 (stale protected-art ledger)
Coverage: Chapters I and IV in full; 16 of 19 chapters won by real keys; continuity for 2 chapters plus the extras in the JSON; see the matrix
Next required review and why: The deep obligation for the live build e9907cad8 is settled by this report except the unmeasured chapters: the next candidate that touches the pose swap, smear or pro camera needs a focused review with CHK-026 and CHK-027 on Chapters I and IV plus the chapters in continuity.unverifiedChapters one at a time (Braska, Sin fins and core, Mirror Aeons). The next deep review owes Bailey's listening verdict (CHK-B1), the prep and accessibility walk (PR-0503), first-load and booth timing, and the three chapters with no win.
Elapsed review time / repeated work avoided: 758 minutes (Capture owner about 540 minutes of runs across the day (09:26 to about 18:20 EDT), auditors, gap pass, fan and confirmer from 18:22 to 19:51; chief consolidation from 19:52. Repeated work avoided: the chief reused the capture owner's evidence and the auditors' readings by reference and .)
```

## Score output (verbatim from tools/critic-score.mjs)

```text
score: PROVISIONAL — no verified score for audio, onboarding, prep, delivery (never averaged away, never zero)
below the 9 floor: visual, feel, narrative, interface
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio, onboarding, prep, delivery
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - mandatory check CHK-001 is UNVERIFIED
  - mandatory check CHK-003 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-011 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 9 critical or major issue(s) remain open
  - encounter yunalesca has no complete real-input flow
  - encounter braskas-final-aeon has no complete real-input flow
  - encounter mirror-aeons has no complete real-input flow
  - 2 required target(s) unverified
  - 1 required target(s) waiting
  - only 6 of 8 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148; a music-only 7/10 of 2026-10-13 is on record)
  - human judgment not recorded: Feel: are the hard-cut hit and attack poses (the smear) the look he wants, and are the pro camera shots right (PR-0380, PR-0521; CHK-B2)
  - human judgment not recorded: Art: does his 2026-10-24 blanket cover the repainted Yuna, Kimahri, Rikku Dark Knight and Paine Warrior and the re-cut Seymour Flux and Bahamut, and does he want the ready poses repainted (PR-0513, PR-0517)
  - human judgment not recorded: Audio: keep or change the silent Chapter IV results screen (PR-0504)
  - human judgment not recorded: Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
  - human judgment not recorded: Narrative: Rikku's grin and Yuna's wedge in Chapter IV (PR-0485)
  - human judgment not recorded: Accessibility: COLOUR VISION, TEXT SIZE and REDUCE FLASHES never walked (PR-0503)
report: valid evidence
```

## Verdicts

- **deployment**: PASS: the exact artifact is live (verify-live PASS twice, 1,436 files byte-compared, 0 mismatched; bundle index-BygGxbJE.js; artifactHash d764fe0e... equals the deploy log) and the capture owner's runs were clean: 0 console errors and 0 not-found requests in all runs, 16 of 19 chapters won from the title by real input. First-load time was not measured.
- **changedArea**: FAIL: CHK-026 fails in Chapter I and CHK-027 fails in both pack chapters (PR-0459, PR-0380), CHK-008 fails (PR-0516), the protected-art ledger is stale (PR-0513), the Rikku and Paine ready poses mismatch (PR-0517), and CHK-001, CHK-003, CHK-011, CHK-023 and CHK-B1 are UNVERIFIED mandatory checks.
- **ship**: SHIP: no critical defect; the regression-tagged majors (PR-0380, PR-0459) sit inside the conference pack, a feature that ?pack=off turns back into the round-28 behaviour (0 snaps), so by RUBRIC 3 they are disclosed and carried, not blocking; the engine, data and save paths are byte-identical to the round 28 candidate. One condition is stated, not assumed: if Bailey says he did not approve the repainted figures, PR-0513 becomes an unapproved asset replacement, which RUBRIC 6 never waives.

Ship reasons:

- No critical defect was found or left reachable: every route by real input ended in a result screen with 0 console errors and 0 not-found requests; the save-data class passed (12 fixtures, SaveData.ts byte-identical); the live artifact matches the deploy byte for byte.
- The two regression-tagged majors, PR-0380 (hard-cut pose swaps, 4.67 and 7.51 snaps per minute) and PR-0459 (Auron's head 7 and 9.5 percent in the pro camera close-up), are inside the new conference pack and disappear with ?pack=off; they are disclosed and carried, and the next batch must address them.
- Combat and encounter content are unchanged and re-proved: git diff of src/battle, src/data and src/engine/tactics is empty against 660c19bbd, and all thirteen r27 probe and measure outputs are byte-identical.
- PR-0513 (89 approved paintings changed, ledger not updated) rests on Bailey's recorded blanket delegation of 2026-10-24; it is disclosed and needs his explicit word or a revision record.
- The changed area FAILS and the quality score is provisional (audio, onboarding, prep and delivery have no verified number), so this is an interim build that ships under rule A, not a milestone.

Majors this release discloses (for the announcement):

- PR-0380 (major): with the default conference pack, pose swaps are hard cuts in Chapters I and IV (4.67 and 7.51 snaps per minute against 0.25), plus Auron mid-move head drops; ?pack=off gives 0.
- PR-0459 (major): Auron's head changes 7 and 9.5 percent at two swaps in the killing-blow close-up in Chapter I (CHK-026 FAIL); the chapters without the pack measured later by the chief all pass CHK-026.
- PR-0379 (major, carried): the remaining pose swaps are see-through double images for 3 to 6 frames on Kimahri, Yuna, Paine and Rikku.
- PR-0517 (major): Rikku Dark Knight and Paine Warrior ready poses read as a different costume and size from attack and idle, and Paine's ready pose floats.
- PR-0513 (major): 89 approved paintings changed and the protected-art ledger was not updated; rests on Bailey's 2026-10-24 blanket delegation.
- PR-0481 (major, carried): demo battle start is 18 s (Chapter IV) and 22.6 to 28.5 s (Chapter I) from the picker press to the first command.
- PR-0148 (major, carried): no owner listening verdict covers the current mix (music only 7/10 on 2026-10-13).
- PR-0099 and PR-0295 (majors, carried, not re-examined): stand-in cues and the phone prep tabs.

## The ten categories

### combat: 9.5

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. Combat auditor, round 29, live build e9907cad8 (bundle BygGxbJE), engine run from D:/pyrefly-release55 at that commit. IDENTITY: git diff 660c19bbd e9907cad8 is empty for src/battle, src/data/ffx, src/data/ffx2, src/data/ff7, src/data/encounters.ts, src/engine/tactics, src/story and every research/ffx*.md and ffx2*.md; the only data-path changes are art registration tables, src/data/motion/realMotion.ts and src/data/procam/proShots.ts (presentation); critic-plan reports dataAudit:false. Three new research docs (re-ffx2-ai-tourist-trap, -valefor, yojimbo-valefor) feed no code. So no changed game-data value exists to audit against a source. RE-RUN, NOT ASSUMED: the r27 combat probe toolkit (aeonmenu, bahamut56, ch3/ko, chain, demoseeds, hidden, immunefuzz 51,782 forks, kernel 478 checks, kernelx2 68 checks, naive attack/random FFX 40 seeds x 12 chapters and FFX-2) plus ffx-parity-measure (200 seeds x 12 FFX chapters, seeds 5001-5200) and ffx2-parity-measure (100 seeds x 7 chapters) were re-run on this tree: all 13 outputs are byte-identical to r27's (md5 of the JSON compared), which also proves determinism. Own benches (intended line): Chapter I 100/100 (avg 52 turns; wrong lines attack-only, defend-only, random 0/30 each); Yunalesca 37/40, Braska 39/40, Anima 39/40, Evrae 39/40, Yojimbo 39/40, Natus 38/40, Omnis 38/40, Via Purifico 40/40, Sin core 40/40, Sin face 40/40, Mirror Aeons 31/40; FFX-2 Bahamut 40/40 at Wait and 40/40 at Active (median win 107 s / 141 s), Vegnagun, Leblanc, Fallen Aeons, Den of Woe, Ixion 15/15, Trema 8/15 (measure 71/100); all identical to r28. ICV_BASE: all 256 Agility values equal the research 1.2 breakpoint table (0 diffs). Haste/Slow/rank/delay/Zombie/Phoenix rules are covered by the unit suite and kernel probes. FULL UNIT SUITE on the live tree (180 s timeouts, 4 workers): 25,976 tests, 25,859 passed, 112 skipped, 4 failed; the 4 failures are all tests/unit/live-record.test.ts (docs/LIVE.md vs the release worktree's dirty docs/deploys.log and critic ledger: an environment artefact of this review tree, no combat file). CHK-023 on the new things with combat reach: (a) the sound pass adds two mid-battle triggers (pass-talk-yuna, pass-talk-kimahri) to Chapter I via setupForChapter; with the pass forced on, 60 of 60 seeds give an event stream identical to pass-off except the extra script-trigger events, and the browser logs show them firing in every default desktop Chapter I run and in no other chapter, nor in the pack-off or phone runs; (b) demoStartGauges (demo mode only, FFX only): setupForChapter returns the chapter's own object without ?demo=1, and 50 per member with it; the booth win ran the same 51 turns as the engine at seed 7. Real-flow logs agree with the sources: Chapter I Mortibsorption heals 4000,3000,2000,1000,1000,1000 (research floor 1,000), Lance of Atrophy then Full-Life, Bushido Dragon Fang with 8 of 8 inputs; Chapter IV Bahamut order Curse once, Attack x3, Impulse x2, countdown, Mega Flare (the engine's re-parity script supersedes research/ffx2-bahamut.md section 2.1), Mega Flare power 14 from the game's own row (185/254/410 in the demo defeat). Held at r28's 9.5: no engine change, nothing regressed; deducted for the pad-driven Overdrive input windows never captured by the owner (CHK-023, third review running) and PR-0460 still unverified in a browser. No gain claimed.

### encounter: 9

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. Encounter data, AI scripts, phases, party builds and chapter registry are byte-identical to live r61 (git diff empty, see combat). Demo seeds re-verified on the engine: Chapter I seeds 7, 10 and 12 open with Tidus's menu before any enemy acts, nobody down, and the intended line wins them in 51, 55 and 54 turns (booth win seed 7 = 51 turns in the browser); the ordinary fresh seed has the enemy act first in 75 of 100 seeds. Bahamut seed 56 and the 40-seed Active/Wait runs win with one Mega Flare each. Real-key flows this build: 16 of the 19 planned chapters won from the title (Chapter I three sizes plus phone defeat, Chapter IV, Vegnagun x5 links, Leblanc x3, Anima, Evrae, Yojimbo, Natus, Omnis, Fallen Aeons, Trema 228 turns, Via Purifico, Den of Woe, Ixion, Sin core, Sin face after a route fix), plus defeat and retry in both demo fights; this removes one of the reasons r28 held 8.9 (16 of 19 without a real-key flow). Credible wrong lines lose or stall: attack-only and random lose 40/40 in 10 of 12 FFX chapters (Sin core attack-only never ends, as r27; random wins Yojimbo 10/40); Chapter IV attack-only never wins or loses (bench harness fallback). NOT demonstrated: a real-key win of Yunalesca (defeat seed 1 112 turns, seed 2 122) and Braska's Final Aeon (defeat 356 and 327 turns); both traced to the capture route, not the engine (see issues PR-0397 and the Braska Doublecast limit), so UNVERIFIED rather than a finding; Mirror Aeons has no browser flow at all. Remaining reasons from r28 that I could not re-test and that stand: Trema about 60 percent at human pace (PR-0227; engine 8/15 and 71/100), Den of Woe 95 percent (PR-0498), hidden chapters that do not punish credible mistakes (PR-0447; the hidden Last Summoning wins 60/60 with attack only). Demo mode deliberately sets every FFX party member to a 50 percent Overdrive gauge (owner decision 173c), which departs from the chapter's sourced build (Kimahri 100, Tidus 40) in demo mode only; intended-line win rate in demo mode is 58/60 against 60/60 outside it. Score moved +0.1 from 8.9 only for the added real-flow coverage; no encounter content changed.

### visual: 8.3

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. PROVISIONAL 8.3 against round 28's 8.4, on build e9907cad8 / bundle BygGxbJE, live https://echoesofspira.com/. I opened no browser. Read from the capture owner's headless-GPU Playwright evidence (PYREFLY_BROWSER=gpu, 1214 index entries) and two of its continuity-harness runs on the live build. COVERAGE: Chapters I and IV in full (1600x900, 2000x1012, 390x844 touch, demo 1920 and 2560, continuity strips); Chapters II, III, V to XVIII sampled by their settled first-menu and mid-fight stills only (1600x900) and the titles at 1600 and 2000. CREDITS: Chapter IV reads as a finished lit stage (Bahamut re-cut is a clean cut-out with no cyan rim, party whole and well sized); Rikku Dark Knight, Paine Warrior, Yuna and Kimahri repaints sit closer to their idles than the r63 paintings (side-by-side sheets, no regression found; Rikku DK's Defend/follow/cast now read as the idle armour); the Echo title and the booth thanks card are clean at 2000, 1920 and 2560; results and pause match their tiles; static pose census unchanged (1106 paintings: 829 pass, 79 waived, 0 fail, 198 exempt, 73 out of band, same as round 28). DEBITS: CHK-026 FAILS in Chapter I (Auron's attack to follow 0.9295 and follow to idle 1.0948 head ratio in the pro camera's killing-blow close-up; the same run with the pack off passes) and CHK-027 FAILS in both chapters (hard-cut pose swaps 4.67 and 7.51 per minute, 0 in round 28; 58 and 20 jerks over 40 px, mostly camera cuts the harness cannot always tell from teleports); crossfade ghosting is still present (170 and 261 swaps, worst severity 0.333 and 0.343, under the 0.4 fail line; figures nearly vanish mid-swap in the Yuna, Paine and Mortiorchis strips); the Chapter I action shots crop Seymour Flux's head out of the frame in 3 of 3 captures; on the cold first visit the title painting is a blur and the Chapter I boss card shows only Seymour's head with a hard edge (first run only; duration unmeasured); Paine Warrior's ready costume differs from her idle (carried, not worsened). Protected-art ledger finding (89 changed approved files, ledger not updated) is scored here as a gate, not a visual defect, and is not multiplied into the score. BAILEY'S FIVE SUB-SCORES (provisional, not part of the weighted score): characterModels 7.0 (capped at 7.0 while CHK-026 FAILS, RUBRIC 6a), enemyModels 7.9 (cleaner boss edges raise it from 7.8; Mortiorchis still dissolves through a see-through frame, rigs read by silhouette only), animation 7.0 (capped: CHK-026 FAIL and snaps per minute 4.67 and 7.51 over 0.25 cap it at 7.0, tighter than 7.5), fidelity 8.6 carried, camera 7.5 carried (directed shots help, boss cropped in action shots). Only 2 of 19 chapters have continuity numbers: the review's own harness run died at about 18:22 EDT (see capturesNeeded). CHIEF NOTE: I read the Rikku ready to attack and Paine ready to idle strips and the Lance and Full-Life clip sheet; the ready-pose costume mismatch (PR-0517) is kept at 8.3 because the auditor already weighed the carried Paine ready mismatch; the stale ledger (PR-0513) is a gate, not multiplied into this score.

### feel: 8

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. Judged from the capture owner's GPU headless evidence (index mode gpu, no black canvas) and the two default-pack continuity runs on the live site; I opened no browser. Round 28 scored 8.2 and the build since then has gained as well as lost. GAINS, seen in frames: (1) Boss specials read well. The Lance of Atrophy clip (clip-ffx-specials/clips/lance-of-atrophy-00..13, 3.2 s at 1920x1080) shows a red telegraph wash and a name banner, a camera push to Seymour, a visible bolt, then the hit with a glass damage number and Seymour's bark on the impact. (2) The defeat card (THE PARTY HAS FALLEN, cause, turn, attempt, TRY AGAIN / OTHER FIGHT) appears and TRY AGAIN is back at a first menu 3 to 4 s after the press (21:27:20 to 21:27:23, 15:02:21 to 15:02:25). The thanks card and the picker return are reached by real pad input. (3) The F1 HUD steps back during an action (Chapter IV seq-action-playing: the command block and cards recede, the Shell and Reflect ripples and the damage number stay clear). (4) Frame pacing on the pack-on runs is 59.5 fps (Chapter I) and 59.7 fps (Chapter IV), with 91 and 338 slow frames of about 23,700 and 22,400 and a worst frame of 353 ms and 136 ms. (5) The scripted mid-fight voice lines fire on their events (16 of 16 plays heard in the demo run) and the Talk exchanges are timed under the 8 s beat budget. DEBITS: (a) CHK-027 FAILS in both pack chapters. Snaps (a pose change with no in-between frame) are 4.67 per minute in Chapter I and 7.51 per minute in Chapter IV against the 0.25 threshold, so the animation sub-score is capped at 7.5 (RUBRIC 6a). With the pack off the same chapters read 0 and 0. The snaps are mostly to-hurt and ready-to-attack cuts that land on the impact frame, and the size and feet hold: Chapter IV's CHK-026 passes with a worst head change of 0.2 percent and feet of 0.3 px, and the guide lines in the strips stay on the head. (b) Swap jerks of 40 px or more rise from 15 (Chapter I) and 1 (Chapter IV) with the pack off to 58 and 20 with it on (worst non-camera 246 px). The ghost, double-image swaps remain on 170 of 213 and 261 of 308 counted swaps, with worst severity 0.34. (c) The 1,275 px 'jerk' on Yuna at Holy Water and the victory-pose swaps (Tidus head x1.41, Yuna feet 1,201 px) are camera moves the harness did not classify as cuts, so they are harness blind spots, not scored here. (d) Chapter I: Seymour's bark box covers the first menu's rows for 2 to 4 s. (e) Demo pick to first command is 26 s in Chapter I (11.3 s voiced intro plus about 15 s) and 18 s in Chapter IV at the fastest press (PR-0481; round 28 read 12 to 14 s). (f) A KO still has no fall (PR-0473). (g) The Mega Flare detonation and the physical attack cycle (wind-up, lunge, smear, recoil) are in no clip: the Mega Flare clip ends 3.1 s after action-start, before the first impact (the engine action lasts about 4.9 s), so the pack's headline motion is UNVERIFIED as a feel. Held below 8.2 because the measured motion regression is a documented FAIL and the main new feel claims were not captured; not lower because input, camera, retry and frame pacing are good.

### narrative: 8.7

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. Held at round 28's 8.7. Dependency argument for the reused reading: git diff 660c19bbd e9907cad8 -- src/story adds only src/story/scripts/seymour-flux-pass.ts (48 lines) and leaves research/writing-bible.md untouched, so the text of every other chapter is byte-identical to the version rounds 27 and 28 read. Read fresh this round: the whole Chapter I script (seymour-flux.ts) against writing-bible E1 and its checklist, which holds all five required beats (Kimahri's charge, the Jecht-is-Sin reveal and the bargain, the post-battle telling of Yuna, the Fayth Scar and the dream); the whole Chapter IV script against E6, which keeps Rikku's recognition, Yuna's three-line appeal, Paine's permission, the three mid-fight callouts (they fire in the battle log), no fayth, no Shuyin and no victory quip; and the new pass script (Yuna's Talk, 'Lady Yuna. You need not suffer.' / 'No. I will walk it to the end.'; Kimahri's Talk), which is in voice (courteous condescension, the whole-beat 'No.', third person, dropped articles) and fires in the real fight (battle-log pass-talk-yuna and pass-talk-kimahri; audio-debug shows each voiced play heard). Aftermath is reachable and in tone in the frames: Chapter I Seymour 'You can't send what refuses to go' after the results; Chapter IV Rikku '...Yunie.'; Chapters V to XVI first lines and post-scenes seen for Vegnagun, Leblanc, Anima (post-scene reached after results), Evrae ('It just... dropped.'), Yojimbo, Natus (narration over black), Fallen Aeons, Omnis, Trema, Via Purifico, Den of Woe and Ixion (Yuna: 'Where the fayth stood, there's only a hole.'). Tone follows each game (elegiac FFX, buoyant FFX-2 with a sudden sincere beat). Debits: PR-0485 is still open (Rikku's wide grin on the sorrowful '...Yunie.' and Yuna's smiling wedge on the silent results; the bible says Rikku may be scared but may not be funny in E6); the Yunalesca and Braska wins did not complete so their aftermaths were not seen this round, Mirror Aeons has no evidence directory, and I read only the scripts above in full, so no gain over 8.7 is claimed.

### audio: UNVERIFIED (no number)

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. No number. I cannot hear; no agent heard anything. Technical health and routing are good, but the listening half is not a number for this mix. TECHNICAL (my own run, ffmpeg and node, no browser): qa.mjs --strict on the shipped files = 43 music cues, 0 findings, integrated -16.2 to -16.0 LUFS, worst true peak -1.48 dBTP, 0 clipped, loop seams 43/43 ok (step and spectral-flux), octave balance ok, SFX sprites 0 findings, manifest consistent, 71.6 MB of 105 MB budget (critic/rounds/round-29/audio/qa.json, qa.log). All 285 shipped mp3 (music, sfx, voice, voice-pass) decode with zero ffmpeg errors (audio/decode-all.log). All 300 audio files in the artifact manifest e9907cad8 are hash-equal to dist-release and public/audio. Since the round-28 build (660c19bbd) no existing audio file changed; 10 files were added, the 9 Chapter I voice-pass lines plus their json (-21.5 to -21.9 LUFS, peaks -3.4 to -7.4 dBFS, 0.9 to 3.7 s, same level as the 222 shipped voice lines). 54 live runs: 0 audio requests missing from the manifest, 0 not-found, 0 console errors, voice cache failed=0 in every run. 16 audio and results unit files pass (225 tests). ROUTING (AudioManager snapshots, 54 runs, live echoesofspira.com): the cue at battle start equals the chapter's data cue in every chapter sampled (Ch I boss-seymour; II boss-challenge; III boss-jecht; IV boss-bahamut; V boss-vegnagun; VI boss-leblanc; VII boss-seymour-macalania; VIII boss-evrae; IX boss-yojimbo; X boss-isaaru; Natus, Omnis, Sin face/fins, Den of Woe, Fallen Aeons, Ixion, Trema link 1 scene bed then boss-trema from link 2), scene beds correct, link seams keep the chain cue, win results play victory-ffx / victory-ffx2, losses play defeat-ffx (phone Ch I, Braska, Yunalesca) and defeat-ffx2 (Mega Flare). Round-28 major PR-0504 (demo win silent, victory cue started then killed) is FIXED for Chapter I: results=victory-ffx in demo-ffx-win and demo-ffx-thanks. Chapter IV's win is now silent on the default desktop (conference pack on) and plays 'pause' with the pack off or on phone: this is by design (passSilentWin / PASS_SILENT_WIN, src/audio/pass/passResults.ts; r61 quietResults.ts) and is left to the owner's ear, not a routing fault. Voice ducking engages exactly while a voice plays (22 of 22 snapshots with a live voice). OWNER VERDICT: Bailey gave a number for the MUSIC only, 'I like all the music 7/10' on 2026-10-13 (D-804, D-809; docs/target/targets.json waiting item). It is not in docs/audio/OWNER-VERDICT.md, which rounds 27 and 28 relied on when they said no number exists, so PR-0148's wording is stale. It does not cover this mix: it predates three re-rendered victory cues (victory-ffx, victory-ffx2, victory-bahamut), five re-rendered SFX files, 245 voice lines and the conference sound pass, and the sound effects and voice have no score (targets.json: 'The sound effects have none yet'). Nothing averaged, nothing zeroed. Gaps in routing evidence (listed in capturesNeeded): title cue, FFX chapter select, pause-menu cue mid-battle, demo defeat card / TRY AGAIN and thanks card cues, attract reel audio, boss-shuyin at Shuyin's entrance, boss-yu-yevon (Braska never reached link 2), scene-gagazet under the Chapter I voiced intro. One minor routing defect: UI sounds fall back to the procedural synth in the first seconds of a session (see issues). CHIEF NOTE: the audio status stays UNVERIFIED with no number (no owner verdict covers this mix).

### interface: 8.1

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. Read from round-29 stills only (no browser opened by me). Sizes seen: 1600x900 and 2000x1012 (Chapter I FFX, Chapter IV FFX-2, plus Ch II/III/XVIII chapters at 1600), 390x844 touch (Ch I, Ch IV), 1920x1080 and 2560x1440 (booth/demo, pad). Held near r28's 8.2, minus 0.1 for new unproven or untidy surfaces. WORKS: target sets read clearly in both games (pointing hand, TARGET flag with damage type, brackets/lotus ring); Esc from target selection returns to the same menu with 0 targets (16b, run.json afterTargetCancel); enemy-intent card separates SCRIPTED from conditional (IF YOU ATTACK block, 'Lands on one of these, picked when it acts', random-target damage ranges per ally, ZOMBIE 50% chip) and the FFX-2 Bahamut card states the Mega Flare wait honestly; pad glyph sets follow the pad (Xbox A/B/X/Y, PlayStation cross/circle, Switch layout) on title, picker, menu, defeat card; defeat card 'FELLED BY CROSS CLEAVE / MEGA FLARE, TURN, ATTEMPT, TRY AGAIN / OTHER FIGHT' is readable and both buttons reachable by pad; pause plates are full-bleed at 1600, 2000, 1920, 2560 and 390 (visual); KO tab on the pause strip carries a red dot as well as colour. PROBLEMS (all minor or polish, none critical): (1) the evidence for the default Chapter I/IV HUD is partly invalid: run.json cardFirst/focFirst/advisorMinEffPx (14.2) describe the 487x175 NEXT BEST MOVE card, which is not on screen in any default-HUD frame (pack ON shows a one-row chip; pack=off frame shows the card), so the legibility figure is for a hidden node; (2) the default HUD drops the advisor's reason, benefit (+2,310), CURES KO tag and the Lance-of-Atrophy warning that the classic card carried (the chip keeps target, MP cost and a star on the owning submenu row): a design change since r28 that needs Bailey's confirmation against the F1 target; (3) the E intent card sits over the current actor's turn-order portrait (Tidus NOW ghosts through it) at 1600 and 2000; (4) first menu: turn-intro wipe plus Seymour's bark box hide 2 to 4 rows for several seconds (PR-0502 class, re-observed); (5) at 2000x1012 the FFX-2 target flag overprints the advisor chip; (6) Doublecast advisor reads NO MP while the open picker shows 16 MP per Firaga (Sin face) and 1 MP (Braska); (7) phone: Chapter IV CHANGE plate text spills out of its tiles and is clipped at both screen edges, pause tab strip and header clipped, OPTIONS pane stops at a half-visible TEXT SPEED row with no visible scroll cue, element-affinity chips crowd the 'Tap another enemy' line; (8) demo picker first paint shows empty plates, broken-image alt text and a silhouette for Paine; (9) visual estimate of intent-card and guide body text at 1600x900 is about 12 to 13 px, under the 14 px floor, but no DOM sweep exists (CHK-003 UNVERIFIED). Carried and not re-measured: PR-0295 (heavy prep tabs on phone; only the Chapter tab was captured), PR-0456, PR-0488. Not testable from this evidence: 4K, 4:3, ultrawide; real touch on an ally target (harness tap timeouts on target:rikku nine times in the Bahamut phone route, ally unresolved on three Holy Water turns in the Seymour phone route; PR-0483 class, UNVERIFIED, no product fault shown).

### onboarding: UNVERIFIED (no number)

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. No number, for the third review running. Not a single frame of the pause ACCESSIBILITY tab (TEXT SIZE, REDUCE FLASHES, COLOUR VISION), the CONTROLS tab or the release-62 controls card, the MUSIC tab, or key remapping exists in round 29; the tabs are only seen as labels in the strip (ACCESSIBILITY, CONTROLS, MUSIC are present at 1600, 2000, 1920 and 2560). No written accessibility walk (PR-0503 carried). Newcomer walkthrough: SIMULATED only, never real. The capture routes are scripted real-input runs (Playwright keyboard, a virtual standard-mapping pad in three layouts, touch taps) from a fresh profile; no human newcomer, no real phone, no real controller. What the stills do show: Auron's guide on a fresh profile reads clearly (briefing 'Nineteen fights ... nothing moves until you act / the clock keeps running until you pick a command', chapter-select card, prep card 'Your party is ready', ESC skip, D never show again) at 1600 and on the phone; the booth picker tells the visitor the controls and 'Follow the NEXT tip to win', although the on-screen tip never uses the word NEXT except in the folded guide strip; pad glyph families are correct; the defeat card gives TRY AGAIN and OTHER FIGHT. Defects seen: Auron's first-turn tip 'He strikes first' is printed in the same frame as a turn order that puts Tidus first and Seymour third (PR-0487 class, re-observed at 1600 with pack off, and on the phone); the booth attract reel never started in 100 to 196 s of idle on the live title (see issue), so the unattended booth has no demonstration; phone pause shows keyboard hints (ESC RESUME, H PAINTING ONLY); the VISUAL STYLE and PRESENTATION rows are still unexplained (PR-0508, PR-0511 carried). Motion and flash accommodations, text scaling and non-colour cues beyond the KO dot cannot be judged, so the category stays UNVERIFIED.

### prep: UNVERIFIED (no number)

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. No number (tenth review with the same open half, PR-0503). Build main e9907cad8 / bundle BygGxbJE, live https://echoesofspira.com/. I opened no browser; I read the capture owner's critic/rounds/round-29/evidence (1,214 index entries: 1,200 verified, 14 recorded UNVERIFIED with a cause, 0 injected, all mode gpu, headless Chromium ANGLE D3D11 on this PC: Ryzen 7 7800X3D, RTX 5070 Ti, 64 GB, 2560x1440 monitor, confirmed by me).

SEEN AND PROVED. (1) Results and rewards: 15 victory results screens read (Ch I AP 10,000 x4, gil 6,000, Lv. 4 Key Sphere, which is Seymour Flux's drop in src/data/ffx/enemies/seymour-flux.ts; Ch IV 1,300 EXP, 1,000 gil, Gris Gris Bag; Omnis shows Tidus '+0AP no full turn taken', the sourced FFX rule; Sin core 28,800 AP and Return Sphere), each with chapter, time, NEW BEST, per-character gains and a CONFIRM path. (2) Defeat is understood: the non-demo defeat results (Yunalesca, Braska, Seymour phone) show turns, attempts, 'BEST NEVER CLEARED', RETRY and CHAPTER SELECT; the demo defeat card (r62) names the cause ('FELLED BY MEGA FLARE, TURN 23 / ATTEMPT 1 / 3:56') with TRY AGAIN and OTHER FIGHT. (3) Retry works and is fast in the demo: defeat card to retried first command menu 3.3 s and 3.6 s (index timestamps, 4 runs, both games). Non-demo RETRY goes to party-prep and the retried first menu was reached in 6 of 6 defeats; results to first menu 13.0 to 16.8 s, which is an upper bound because the route waits 1.5 s on prep and holds Enter 3.5 s through the scene (r24 measured 7.6 to 10.2 s); not scored as a defect. (4) Progress is reliable: after a win the board shows the chapter cleared and the same state after a real reload in 31 of 31 reload captures; save matrix 19 loads, 0 errors, only the intended migrations (CHK-024). (5) Pre-fight prep screen (CHAPTER tab): objectives and a sourced TIP per chapter (e.g. 'Do not cure every Zombie before Form III', 'Kill both Pagodas the same turn') with Auron's coach, 45 captures. (6) Demo flow: win, results, Echo end card, picker with the cursor on the OTHER fight (demo-ffx-thanks 34-picker-after), and r64's unattended end card to title (the capture owner's 'not back at picker' fail is the harness expecting the old flow, not a defect).

NOT SEEN, so no number: the prep agency itself. No run opened STATS, SPHERE GRID, EQUIPMENT, ITEMS or OVERDRIVE (FFX) or Dresspheres, Accessories and Items (FFX-2), changed a value, and showed it in the first menu; the tabs are 'for later' in Auron's words and the route never goes there. The r62 repair of PR-0509 (hold-Home reset restores default settings, commit 272e75190) was not exercised: the r29 reset ran with default settings and so proves nothing. A phone prep walk (PR-0295) is also missing.

Cross-references, scored elsewhere and not repeated: FFX-2 Bahamut win results screen is silent with the conference pack on (audio-debug results:null in 8 of 8 pack-on wins, demo and non-demo; the cue is 'pause' when the pack is off or on the phone: packoff run and phone run), PR-0504 class, audio; Esc does not open the pause while the E enemy-move slab is open (gap-esc: Den of Woe and Isaaru need two presses), interface. Win path of Yunalesca (defeat on seeds 1 and 2, no route misses) and Braska (defeat on seeds 1 and 2, but its Doublecast picks failed in the route: dcFail 2 and misses at turns 48 to 71, the harness bug the capture owner fixed at 18:06) is UNVERIFIED and is not charged to prep.

### delivery: UNVERIFIED (no number)

Chief critic, round 29, live build e9907cad8 (bundle BygGxbJE). Auditor reading, adopted unless noted in the issue list. No number. The booth-hardware load and start measurements and the browser and device coverage the category needs are missing; what is proved is below. Build main e9907cad8, bundle BygGxbJE, live https://echoesofspira.com/. I opened no browser (read the capture owner's evidence; ran tools only).

PROVED. (1) Exact artifact (CHK-017): critic/artifacts/e9907cad8.json (7,169 files, 11,063 MB, artifactHash d764fe0e...9371) verify-live PASS twice: 168 sampled files, then all 1,384 added or changed files since 660c19bbd plus a 40 file sample plus index.html and press/index.html = 1,436 byte-compared, 0 mismatched, 0 missing, 0 wrong type, errors 0; index.html equals the artifact once the Cloudflare analytics beacon is cut out; the served bundle is index-BygGxbJE.js and the dist-release manifest hash equals the live hash; deploys.log line main=e9907cad8 bundle=BygGxbJE release=64 status=ok. (2) Shipping references and media (CHK-018, CHK-019): art-derive verify on dist-release (the live artifact): 5,404 masters, 5,052 pixel-compared, 0 problems; audit: 1,371 literal art names in the bundle, 0 dangling; manifest decodeChecked true, 0 audio unverified, 2 flat-colour files both on the intentional list (Paine eyeR-catch 1x, 2x). (3) Console and network: 0 console or page errors and 0 not-found requests in all 54 run.json files and in the attract, esc and press gap runs; /press/ loads (200, 11 images ok, no horizontal scroll at desktop and phone width). The press page's trailer row is hidden until press.json names a file, and trailer.mp4 is 404 by design, not a defect. (4) Complete flows by real input (CHK-022): title to chapter select to prep to scene to fight to results to chapter select, board kept after reload, for 15 of 19 chapters at 1600x900 (Ch I and IV also 2000x1012 and 390x844 touch; Ch IV win on the phone); post-battle scenes after results CONFIRM reached where they exist (e.g. Anima 11 lines, Ixion 30 lines); the capture owner's note that Anima has no post scene is wrong, the harness looked before the results screen (the order is results, then CONFIRM, then the scene). Demo Ch I and IV from the picker by simulated pad to win, defeat, TRY AGAIN, OTHER FIGHT, thanks card and hold-Home reset ring. (5) Saves (CHK-024): 12 release fixtures (20 to 37.1) and 7 titleArt and visualStyle variants load in a fresh browser, 0 errors, only intended migrations (sfxVolume 0.35 to 0.7, bogus titleArt and visualStyle corrected); SaveData.ts and the save schema have an empty git diff since 660c19bbd. (6) Frame times, headless GPU Chromium (ANGLE D3D11) on Ryzen 7 7800X3D / RTX 5070 Ti / 64 GB, 1600x900, local PC, warm cache, real network to Cloudflare: Chapter I 59.5 to 59.8 fps over 388 to 398 s of battle, slow frames 47 to 96 (0.2 to 0.4 percent), max frame 321 to 381 ms in 10 of 11 runs (r28: 305); Chapter IV 59.7 fps, slow frames 293 to 338 (1.3 to 1.5 percent, r28 601 and 2.6 percent), max frame 125 to 136 ms (r28 351, improved).

NOT PROVED, so no number. (a) First-load time: no run recorded navigation timing, cold or warm, on this PC or on a limited network (CHK-017 asks for under 5 s). (b) Battle start on the booth path: press to battle screen is 0.15 s for Ch IV (r28 2.5 s) and 10.9 to 12.6 s for Ch I (it now includes the ~10 s voiced intro), but the A press to first command interval measured the same way as round 28 (index timestamps, picker card chosen to first menu) is 18.4 s for Ch IV in both runs (r28 18.4 and 19.7 s) and 22.6 to 28.5 s for Ch I (r28 15.8 to 18.1 s); no frame probe ran on the demo start, so PR-0481's frame spikes are not re-measured and its fix is not shown. (c) One 129.8 s frame gap in 1 of 11 continuity runs (Ch I, pack off, the run needed a stall recovery after 165.6 s quiet at command:auron and took 19.3 min against 8.5), not reproduced in the 10 others including an identical re-run; host contention from other lanes is possible but unproved. (d) Browsers and devices: Chromium only; no Firefox, WebKit or Safari play, no real controller (simulated pad), no real phone. (e) Win flows: Yunalesca and Braska no win (defeat and retry work), Mirror Aeons not run.

## Bailey's five visual sub-scores (unscored, caps applied)

characterModels 7.0, enemyModels 7.9, animation 7.0, fidelity 8.6, camera 7.5 (previous: 7.0, 7.8, 7.0, 8.6, 7.5).

Bailey's five visual sub-scores (provisional; not part of the weighted score). CHK-026 FAILS in Chapter I, so characterModels and animation are capped at 7.0 (RUBRIC 6a); snaps per minute of 4.67 and 7.51 exceed the 0.25 line, so animation is also under the 7.5 cap. enemyModels 7.8 to 7.9: the Seymour Flux and Bahamut re-cut has clean cut-out edges with no cyan rim, while Mortiorchis still dissolves through a see-through frame. characterModels and animation sit at their caps. Fidelity and camera are carried; the directed camera shots help but crop the boss in the action stills (PR-0479, PR-0521).

## Continuity (CHK-026, CHK-027)

No official 19-chapter summary exists: the review's own run died (PR-0522). This object aggregates the capture owner's live runs of Chapters I and IV with the default pack (the registry of the live build, --pose-measure-from=D:/pyrefly-release55, 114 subjects), their pack-off controls, the four Chapter I bisects, two confirming runs, and the chief's extra single-chapter runs listed in extraChapters. Snaps per minute, size and jerks are those of the default-pack runs.

| Chapter | CHK-026 | CHK-027 | snaps per minute | max head jump (registered) | worst jerk | summary |
|---|---|---|---:|---:|---:|---|
| seymour-flux (pack on) | FAIL | FAIL | 4.67 | 9.5 | 1275.2 | critic/rounds/round-29/evidence/continuity-summary-seymour-flux.json |
| ffx2-bahamut (pack on) | PASS | FAIL | 7.51 | 0.2 | 79.3 | critic/rounds/round-29/evidence/continuity-summary-ffx2-bahamut.json |
| ffx2-leblanc (chief run) | PASS | FAIL | 0 | 28.7 | 82.9 | critic/rounds/round-29/evidence/continuity-summary-ffx2-leblanc.json |
| seymour-anima-macalania (chief run) | PASS | FAIL | 0 | 22.1 | 125.8 | critic/rounds/round-29/evidence/continuity-summary-seymour-anima-macalania.json |
| yojimbo-cavern (chief run) | PASS | PASS | 0 | 4.8 | 26.9 | critic/rounds/round-29/evidence/continuity-summary-yojimbo-cavern.json |
| seymour-natus (chief run) | PASS | PASS | 0 | 13.4 | 38.5 | critic/rounds/round-29/evidence/continuity-summary-seymour-natus.json |
| evrae-airship (chief run) | PASS | FAIL | 0 | 0.1 | 66.8 | critic/rounds/round-29/evidence/continuity-summary-evrae-airship.json |
| seymour-omnis (chief run) | PASS | FAIL | 0 | 8.7 | 48.3 | critic/rounds/round-29/evidence/continuity-summary-seymour-omnis.json |
| isaaru-via-purifico (chief run) | PASS | FAIL | 0 | 16.6 | 62 | critic/rounds/round-29/evidence/continuity-summary-isaaru-via-purifico.json |
| ffx2-den-of-woe (chief run) | PASS | FAIL | 0 | 2.9 | 54.1 | critic/rounds/round-29/evidence/continuity-summary-ffx2-den-of-woe.json |
| ffx2-ixion-djose (chief run) | PASS | FAIL | 0 | 18.9 | 56.5 | critic/rounds/round-29/evidence/continuity-summary-ffx2-ixion-djose.json |
| ffx2-fallen-aeons (chief run) | PASS | FAIL | 0.15 | 15.6 | 82.9 | critic/rounds/round-29/evidence/continuity-summary-ffx2-fallen-aeons.json |
| ffx2-vegnagun-shuyin (chief run) | PASS | FAIL | 0 | 9.4 | 203.2 | critic/rounds/round-29/evidence/continuity-summary-ffx2-vegnagun-shuyin.json |
| sin-face (chief run) | PASS | PASS | 0 | 0.1 | 0 | critic/rounds/round-29/evidence/continuity-summary-sin-face.json |
| yunalesca (chief run) | PASS | FAIL | 0 | 10.7 | 149.2 | critic/rounds/round-29/evidence/continuity-summary-yunalesca.json |
| ffx2-trema (chief run) | FAIL | FAIL | 0 | 2.3 | 121.7 | critic/rounds/round-29/evidence/continuity-summary-ffx2-trema.json |

Pack-off controls: snaps per minute {'seymour-flux': 0, 'ffx2-bahamut': 0}, jerks of 40 px or more {'seymour-flux': 15, 'ffx2-bahamut': 1}, head over tolerance {'seymour-flux': 0, 'ffx2-bahamut': 0}.

UNVERIFIED for CHK-026 and CHK-027: braskas-final-aeon, sin-fins-core, mirror-aeons.

## Checks

| Check | Result | Mandatory | State |
|---|---|---|---|
| CHK-001 | UNVERIFIED | yes | technical and routing checked; listening absent |
| CHK-002 | PASS | yes | visual proof only |
| CHK-003 | UNVERIFIED | yes | no computed sweep |
| CHK-004 | PASS | yes | command menu per actor, Chapters I, II, III, IV, XVIII |
| CHK-005 | UNVERIFIED | no | Chapter I first menu with an ally KO only |
| CHK-006 | PASS | yes | target cancel, pause, retry, results, Esc absorb |
| CHK-007 | PASS | yes | all captured screens |
| CHK-008 | FAIL | yes | first menu, E intent, target, Bushido at 1600, 2000, 2560 |
| CHK-009 | PASS | yes | HUD, target flag, intent card, pause |
| CHK-010 | PASS | yes | target selection after ATTACK, Chapters I and IV, 1600, 2000, 390 |
| CHK-011 | UNVERIFIED | yes | no coverage projection run |
| CHK-012 | FAIL | no | cold first load only |
| CHK-013 | PASS | yes | repainted poses, Seymour Flux and Bahamut re-cut, 1600x900, 2000x1012, demo 2560x1440 |
| CHK-014 | PASS | yes | sampled stills, Chapters I to IV and sampled others |
| CHK-015 | PASS | yes | the exercised set; target-all by a party-wide spell only |
| CHK-016 | PASS | yes | evidence integrity |
| CHK-017 | PASS | yes | live exact artifact, 2026-10-25 |
| CHK-018 | PASS | no | dist-release (the live artifact) |
| CHK-019 | PASS | yes | manifest of e9907cad8, 7,169 files |
| CHK-020 | PASS | yes | paired screens both games |
| CHK-021 | PASS | yes | engine, event logs and the written cases |
| CHK-022 | UNVERIFIED | no | 16 of 19 chapters won; defeat and retry in both demo fights and Chapter I |
| CHK-023 | UNVERIFIED | yes | invoked and correct in the logs; pad Overdrive windows absent |
| CHK-024 | PASS | no | save-data class, live site |
| CHK-026 | FAIL | yes | Chapter I FAIL, Chapter IV PASS, others per the continuity object |
| CHK-027 | FAIL | yes | Chapters I and IV, default pack |
| CHK-B1 | UNVERIFIED | yes | owner listening verdict |
| CHK-B2 | UNVERIFIED | no | owner feel judgment |

- **CHK-001 UNVERIFIED**: Technical half PASS (qa --strict: 43 music cues, 0 findings, -16.2 to -16.0 LUFS, worst true peak -1.48 dBTP, loop seams 43 of 43; 285 mp3 decode clean; 300 of 300 files hash-equal to the artifact manifest; 0 not-found and 0 console errors in 54 runs). Routing PASS on every moment sampled: each chapter's battle cue equals its data cue, scene beds, link seams and win and loss results are right; title, FFX chapter select and the pause cue (Chapter I and IV, restored on resume) added by the gap pass. One minor FAIL (UI synth fallback in the first seconds, PR-0514), Chapter IV win results silent by design (PR-0504), and moments with no snapshot (demo defeat card cue, thanks card, attract card audio, Shuyin's entrance, Yu Yevon, the Chapter I voiced-intro bed). The listening half is absent for this mix (PR-0148). Not a pass.
- **CHK-002 PASS**: Pause plates fill the window with no side bars at 1600x900, 2000x1012, 1920x1080, 2560x1440 and 390x844. No getBoundingClientRect or scrollWidth figures exist; 1280x720, 3840x2160 and 2560x1080 were not captured.
- **CHK-003 UNVERIFIED**: No computed font-size or clipping sweep exists for any screen; the only measurement (advisorMinEffPx 14.2) was taken on a card that is not visible in the default HUD (PR-0519). By eye, intent-card and guide body text is about 12 to 13 px at 1600x900 and phone chips and pause labels about 11 to 12 px (suspected under the floor).
- **CHK-004 PASS**: The advisor names the owning submenu and matches the real menu (Mega Phoenix on ITEMS in Chapter I, Magic Break on Skill in Chapter IV). One exception, filed: the Doublecast card says NO MP while the picker lists the cost (PR-0515).
- **CHK-005 UNVERIFIED**: Chapter I seed 1 first menu has a KO'd Kimahri and the advisor correctly proposes Mega Phoenix with the Lance warning (pack-off frame); no other broken board (healer down, no MP, silence on the only caster) was captured on screen.
- **CHK-006 PASS**: Overlay cleanup seen for target cancel (0 targets, 5 rows), pause (Esc opens, Esc resumes), defeat card to retry, results to board. Esc layering note filed (PR-0523). Not exercised: Overdrive or rage picker death-mid-decision, the spherechange wheel's four exits.
- **CHK-007 PASS**: No raw ids, section citations or debug strings in the HUDs, pause, picker, defeat card or results. Open polish: PR-0508 and the press-page copy (PR-0526).
- **CHK-008 FAIL**: Panels over painted actors and live controls: the E intent card over the current actor in the turn order, the bark box and turn-intro wipe over command rows, the FFX-2 target flag over the header and advisor chip at 2000x1012, the Bushido card over Auron's name plate, and a scripted dialogue box over the boss nameplate at 2560x1440 (PR-0516, PR-0502). Actor-quad projection (proxy, gap pass): Chapter IV 0 hits at 1280, 1600, 2000 and 2560; Chapter I 0 at 1280 and 1600, 1 at 2000 and 2 at 2560. None hides a required control permanently.
- **CHK-009 PASS**: Names are shown in full (Seymour Flux, Mortiorchis, Braska's Final Aeon, Lance of Atrophy, Doublecast: Firaga + Firaga, Magic Break, Hour of Need). Phone turn-order chips carry portraits only, by design.
- **CHK-010 PASS**: Selection is obvious in both games (gold or pink row, hand pointer, TARGET flag, brackets, lotus ring on Bahamut). Single-ally target selection by touch and KO'd-ally targeting were not captured (PR-0483).
- **CHK-011 UNVERIFIED**: Every targetable enemy is identifiable in the sampled first-menu frames; in Chapter III the second Yu Pagoda is mostly behind Braska's Final Aeon with only an edge showing, the same layout as round 27, but the covered fraction was not measured.
- **CHK-012 FAIL**: Throttled cold cache: the demo picker's tiles and party chips are empty boxes and silhouettes until about 20 to 40 s, the title is a blur for its first seconds, and alt-text icons appeared in two captures (PR-0520). Warm: whole. The every-subject roster check was not run.
- **CHK-013 PASS**: Repainted poses (Yuna cast, hurt, critical, victory, item; Kimahri ready, follow, hurt, defend, sleep; Rikku Dark Knight follow, cast, hurt, critical, victory; Paine Warrior ready, follow, victory, item, sleep) compared with the r63 paintings and in the running game: no regression in how they render; the boss re-cut has clean edges. Chapter IV at 2560x1440 in game: first menu only, no HUD hits. The protection-ledger half is PR-0513; the ready-pose costume mismatch is PR-0517.
- **CHK-014 PASS**: Party faces the boss side, attack and cast poses aim across the field, no mirrored neighbours. Carried: Kimahri and Auron partly behind Tidus in Chapters I and III. Sampled stills only; no numeric slot-versus-facing cross-check.
- **CHK-015 PASS**: Real keyboard, touch and a simulated gamepad (Xbox, PlayStation, Switch layouts) drove every route: Esc, P, pause tabs, N, E, G, single and party-wide targets, cancel from targeting, scene Esc and skip, Bushido by chips (8 of 8), Doublecast, Switch, Change, spherechange, results CONFIRM, demo reset ring. The only injection was setSeed(1) (and the labelled gap-esc navigation). Not shown: a physical controller, Safari, Overdrive input windows by pad, the prep tabs and the hold-Home reset with changed settings.
- **CHK-016 PASS**: index.json carries 1,360 entries at the time of writing, 1,346 verified with an asserted screen; the 14 recorded UNVERIFIED (seven pause-Esc captures where an open slab or guide took the first Esc, two post-scene captures where the harness looked before the results screen, phone captures without a keyboard) are used as no pass. 0 injected entries bar the labelled gap-esc. Harness faults were separated from product results and labelled (PR-0512, PR-0397); the invalid runs are kept under names with INVALID, WRONGPOSEMEASURE or STALL.
- **CHK-017 PASS**: Live page serves assets/index-BygGxbJE.js and shows RELEASE 64 e9907cad; verify-live PASS twice (168 sampled files, then all 1,384 added or changed files since 660c19bbd plus a 40 file sample plus index.html and press/index.html = 1,436 byte-compared: 0 mismatched, 0 missing, 0 wrong type); artifactHash d764fe0ed0580d31a9e272db3824d205e11aba276132517dca8b27371c9d9966 equals dist-release, the stored manifest and docs/deploys.log (main=e9907cad8 bundle=BygGxbJE release=64). 0 console errors and 0 not-found requests in all captured runs. First-load time (under 5 s) was not measured, so that half is UNVERIFIED and goes to delivery.
- **CHK-018 PASS**: art-derive verify: 5,404 masters, 5,052 pixel-compared, 0 problems; audit: 1,371 literal art names in the bundle, 0 dangling; strip thumbnails 38 of 38.
- **CHK-019 PASS**: decodeChecked true, audioUnverified 0, the only two flat-colour findings are Paine eyeR-catch 1x and 2x, both on policy intentionalFlatImages; 0 wrong content types in verify-live.
- **CHK-020 PASS**: Paired FFX and FFX-2 flows exist for title, briefing, prep, first menu, E intent, G guide, target, pause, results, defeat card and picker; both show the same structure with game-specific differences. FFX-2-only defects: phone CHANGE plate (PR-0518), Paine and Rikku ready poses (PR-0517).
- **CHK-021 PASS**: The Talk triggers (pass-talk-yuna, pass-talk-kimahri) appear as script-trigger events in every default desktop Chapter I run and in none of the 17 other chapters, not with the pack off and not on the phone; FFX-2 logs carry none (no FFX-2 voiced battle line exists, matching the sources). Demo half-gauge is FFX only (FFX-2 returns the chapter's own object). The Auron tip is chapter-keyed. The pose-swap smear and pose pop apply to both games and are present in both runs. Not verified beyond reading: that each effect landed in the right game on screen.
- **CHK-022 UNVERIFIED**: Won by real keys from normal entry to results, CONFIRM, post scene where one exists and a reload that keeps the board: Seymour Flux, Bahamut, Vegnagun and Shuyin, Leblanc, Anima, Evrae, Yojimbo, Natus, Fallen Aeons, Omnis, Trema, Via Purifico, Den of Woe, Ixion and Djose, Sin fins and core, Sin face (after a harness repair). Not won: Yunalesca and Braska (route limits, PR-0397) and Mirror Aeons (not run). The capture owner's "no post scene" notes for Anima and Ixion are wrong (PR-0512).
- **CHK-023 UNVERIFIED**: One real input traced to engine event, effect and state: Bushido by keyboard (8 of 8), spherechange with its plate, Mega Flare countdown then cast (185, 254 and 410 in the demo defeat), Lance of Atrophy then Full-Life, Mortibsorption heals 4000, 3000, 2000, 1000, 1000, 1000, Doublecast to a damage event, the Talk triggers after the Talk command, demo half gauges reaching the fight (a booth win ran the same 51 turns as the engine at seed 7). Still not proven for the third review: any pad-driven Overdrive input window (Bushido, Slice and Dice, Ronso Rage and the Trigger-Command inputs by gamepad). The Mega Flare detonation and the physical attack cycle are in no frame-rate clip (the clip ends 3.1 s after action-start, before the first impact).
- **CHK-024 PASS**: 12 release fixtures (20 to 37.1) and 7 titleArt and visualStyle variants load in a fresh browser before boot, 0 errors, only intended migrations; SaveData.ts and the save schema have an empty git diff since 660c19bbd. No fixture newer than 37.1 exists, so a save written by release 63 migrating to 64 is covered by the empty diff, not by a load.
- **CHK-026 FAIL**: Chapter I, default pack: 2 swaps over the head tolerance (Auron attack to follow 7.05 percent and follow to idle 9.5 percent, registered, in the killing-blow close-up); a fresh confirming run reproduced it (3 over, 9.4 percent); ?pack=off: 0. Chapter IV: 308 of 308 swaps registered, worst head 0.2 percent, feet 0.3 px: PASS. The check proves the table is applied at every swap, not that the table is right (RUBRIC 6a); the strips I read keep the head on the guide line. Chapters run one at a time by the chief after the review run died: 13 of 14 PASS CHK-026  (no head over tolerance, registered heads where the registry has the pose, the rest read by figure mass at the coarse tolerance); the exceptions: ffx2-trema. Trema fails on the feet of Paragon only (16 swaps, 9.4 to 10.4 px, PR-0529). Chapters not in the continuity object: UNVERIFIED (PR-0522).
- **CHK-027 FAIL**: Chapter I 4.67 snaps per minute (31 hard cuts), 58 jerks of 40 px or more; Chapter IV 7.51 (47 hard cuts), 20 jerks; ghost swaps 170 of 213 and 261 of 308 with worst severity 0.333 and 0.343 (0 over the 0.4 line); fps 59.5 and 59.7. Pack off: 0 snaps and 15 and 1 jerks. Fresh confirming runs: 4.95 and 7.49. Chapters without the pack (chief runs): snaps per minute at most 0.15 everywhere (the pack is the cause of the hard cuts), CHK-027 FAIL on jerks of 40 px or more in 11 of 14 (ffx2-leblanc 8, seymour-anima-macalania 8, evrae-airship 17, seymour-omnis 1, isaaru-via-purifico 15, ffx2-den-of-woe 11, ffx2-ixion-djose 2, ffx2-fallen-aeons 12, ffx2-vegnagun-shuyin 6, yunalesca 60, ffx2-trema 60), ghost swaps severity at most 0.366, none over the 0.4 line. See PR-0380, PR-0379.
- **CHK-B1 UNVERIFIED**: Music only: 7/10 (2026-10-13, D-804), older than the current cues; SFX, voice and the conference sound pass have no ear verdict. Approving a direction is not a numeric score.
- **CHK-B2 UNVERIFIED**: Bailey's play of the hard-cut pose pops, the camera shots and the unseen Mega Flare detonation is not recorded.

## Target gate

Required 8, matched 6, failing 0, unverified 2, waiting on a decision 1.

Composites read from tools/end-state-board.mjs --pair in critic/rounds/round-29/targets: A-title, A-ink-and-gold-battle, A-ffx2-battle, A-results, pause until dawn (Chapters I and IV), seymour-flux-body, phone-pr0001 captured; phone-pr0201 (Chapter XI) has no capture. The visual auditor reported the counts (6 matched, 2 unverified) without naming the second unverified tile; the chief reads it as seymour-flux-body, whose approved painting files changed in the r63 boss re-cut (PR-0513) and is therefore not independently re-matched. Waiting: the demo-only surfaces (picker, QR plate, reset ring, attract card) have no tile in targets.json (hard rule 9). Audio and key-art tiles are not screenshot matches.

## Encounters through their real flow

| Encounter | Real flow complete | Outcome |
|---|---|---|
| seymour-flux | yes | victory (53 turns, 1600x900 and 2000x1012, seed 1, keyboard); lose and retry exercised (Ch I lose route turn 4; demo defeat card TRY AGAIN reached the next fight); phone 390x844 touch route ended in defeat at turn 35, identical to round 28 |
| yunalesca | NO | defeat on seed 1 (155 turns) and seed 2 (122 turns); route reached the results screen but not a win |
| braskas-final-aeon | NO | first run stalled at the 900 s budget (budget error, discarded); defeat at turn 356 (27 min, seed 1) and turn 327 (30 min, seed 2) |
| ffx2-bahamut | yes | victory (59 turns at 1600x900, 2000x1012, 390x844 touch); defeat by Mega Flare in the demo flow, TRY AGAIN to the next fight |
| ffx2-vegnagun-shuyin | yes | victory (81 turns, 5 links) |
| ffx2-leblanc | yes | victory (91 turns, 3 links) |
| seymour-anima-macalania | yes | victory (59 turns) |
| evrae-airship | yes | victory (85 turns) |
| yojimbo-cavern | yes | victory (14 turns) |
| seymour-natus | yes | victory (26 turns) |
| ffx2-fallen-aeons | yes | victory (54 turns, 3 links) |
| seymour-omnis | yes | victory (92 turns) |
| ffx2-trema | yes | victory (228 turns, 2 links) |
| isaaru-via-purifico | yes | victory (38 turns, 3 links) |
| ffx2-den-of-woe | yes | victory (30 turns, 3 links) |
| ffx2-ixion-djose | yes | victory (29 turns) |
| sin-fins-core | yes | victory (303 turns, 3 links) |
| sin-face | yes | victory (45 turns) after two harness repairs; the stock harness stalled at turn 4 on seeds 1 and 2 |
| demo-booth-ffx-ch1 | yes | ?demo=1: pad from the title through the picker to a win, results CONFIRM, thanks card; a press reached the picker in 162 ms with the cursor on the other fight; untouched, the card goes to the title |
| demo-booth-ffx2-ch4 | yes | ?demo=1: pad win and pad defeat; the new defeat card (TRY AGAIN, OTHER FIGHT) appeared with 'Felled by Mega Flare'; TRY AGAIN reached the next fight; OTHER FIGHT started the other chapter's fight directly |
| mirror-aeons | NO | not run |

## Coverage matrix

Tested:

- Live exact artifact (verify-live twice, 1,436 files), art-derive verify and audit, manifest decode, save fixtures (12 plus 7 variants), 0 console errors and 0 404 across all runs.
- Real-input flows at 1600x900 for 18 chapters (16 wins, Chapters II and III defeats on two seeds each, Mirror Aeons not run); Chapters I and IV also at 2000x1012 and 390x844 touch; defeat, retry and lose routes in Chapter I and IV.
- Demo mode ?demo=1 by simulated Xbox, PlayStation and Switch pads at 1920x1080 and 2560x1440: picker, win, thanks card (pressed and untouched), defeat card TRY AGAIN and OTHER FIGHT, hold-reset ring, idle card; /press/ at desktop and phone width.
- Continuity harness on the live site with the default pack for Chapters I and IV, the pack-off controls, four Chapter I bisects, two confirming runs, plus the chief's extra single-chapter runs (see continuity.extraChapters).
- Engines: the r27 probe toolkit (13 outputs byte-identical), ffx and ffx2 parity measures, benches on every chapter, the full unit suite, CTB table (256 of 256).
- Audio: technical QA of all cues and sprites, routing snapshots in 54 runs, voice ducking, new voice files, plus the gap pass (title, chapter select, pause cue, cold-profile synth fallback).
- Gap pass: cold-cache timed capture, warm picker, actor-quad projection at four sizes in Chapters I and IV, settled Chapter IV first menu, Esc with the guide open, Auron tip on party-first seeds.
- Target composites for 7 captured required tiles; first-time-fan read of the strips and sequences; a chief re-read of the Rikku and Paine strips and the Lance and Full-Life clip sheet.

Reused, with the reason:

- Combat engine and encounter data identity with round 28 (from git diff 660c19bbd e9907cad8): No diff under src/battle, src/data/ffx, src/data/ffx2, src/data/encounters.ts, src/engine/tactics, src/story (bar the 48-line pass script) or research/ffx*.md and ffx2*.md; all probes and benches were nevertheless re-run and are byte-identical to round 27.
- Story text of every chapter other than Chapters I and IV (from critic/rounds/round-28.json narrative): src/story differs only by src/story/scripts/seymour-flux-pass.ts; research/writing-bible.md untouched; narrative held at 8.7 with Chapters I and IV re-read in full and 14 others sampled.
- PR-0099 and PR-0295 text (from critic/rounds/round-28.md): No existing audio file changed since 660c19bbd; prep and phone tabs were not captured this round, so PR-0295 is carried without new evidence (labelled low confidence).
- PR-0227 (Trema about 60 percent at human pace), PR-0498 (Den of Woe 95 percent), PR-0447 (hidden chapters do not punish credible mistakes) (from critic/rounds/round-28.json (combat auditor)): Engine and data diff empty and the r27 measures re-ran identical; labelled reused, not re-measured.

Not tested:

- Firefox, WebKit and Safari play, a physical controller, a real phone, 4K, 4:3 and ultrawide shapes, booth-PC timing and a human-paced press.
- Pad-driven Overdrive input windows (CHK-023), the Mega Flare detonation and the physical attack cycle as frame-rate clips, single-ally touch targeting.
- The prep tabs, the pause ACCESSIBILITY, CONTROLS and MUSIC tabs, key remapping, a written accessibility walk, the hold-Home reset with changed settings, a real newcomer walkthrough.
- First-load navigation timing, the demo start frame probe, a soak of the demo loop.
- Bailey's listening and feel judgments.

Required and not tested:

- CHK-026 and CHK-027 for the chapters not listed in continuity.extraChapters (the review's own 19-chapter run died, PR-0522): every other planned chapter, including those where the repainted Yuna, Kimahri, Rikku Dark Knight and Paine Warrior appear.
- CHK-022 real-key wins of Yunalesca, Braska's Final Aeon and Mirror Aeons.
- CHK-023 pad-driven Overdrive windows; CHK-003 computed font-size sweep; CHK-011 coverage projection for Chapter III; CHK-B1 owner listening verdict.
- Onboarding, prep and delivery category evidence (accessibility walk, prep tab walk, first-load time, booth-hardware start and frame probe).

Human judgments (none recorded):

- Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148; a music-only 7/10 of 2026-10-13 is on record)
- Feel: are the hard-cut hit and attack poses (the smear) the look he wants, and are the pro camera shots right (PR-0380, PR-0521; CHK-B2)
- Art: does his 2026-10-24 blanket cover the repainted Yuna, Kimahri, Rikku Dark Knight and Paine Warrior and the re-cut Seymour Flux and Bahamut, and does he want the ready poses repainted (PR-0513, PR-0517)
- Audio: keep or change the silent Chapter IV results screen (PR-0504)
- Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
- Narrative: Rikku's grin and Yuna's wedge in Chapter IV (PR-0485)
- Accessibility: COLOUR VISION, TEXT SIZE and REDUCE FLASHES never walked (PR-0503)

## Static checks

- **pose-census**: {"totals": {"subjects": 146, "paintings": 1106, "waived": 79, "fail": 0, "exempt": 198, "rigged": 0, "pass": 829}, "report": "critic/rounds/round-29/static/pose-census.json", "note": "Unchanged from round 28 (73 out of band); static, no browser, not CHK-026."}
- **verify-approved**: {"root": "D:/pyrefly-art-r64 (public/art of e9907cad8)", "ok": 828, "approved": 780, "judgeLocked": 48, "mismatched": 89, "missing": 0, "report": "critic/rounds/round-29/static/verify-approved.txt", "note": "PR-0513; round 28: 917 ok, 0 mismatched."}
- **art-derive**: {"masters": 5404, "pixelCompared": 5052, "problems": 0, "danglingArtNames": 0}
- **unit-suite**: {"tests": 25976, "passed": 25859, "skipped": 112, "failed": 4, "note": "the four failures are all tests/unit/live-record.test.ts (docs/LIVE.md against the release worktree's dirty docs/deploys.log and ledger): an environment artefact of the review tree, no battle, data or engine test failed."}

## Issues, ranked (39 open)

### PR-0380 (major, feel): With the default conference pack, pose changes are hard cuts: 4.67 snaps per minute in Chapter I and 7.51 in Chapter IV (limit 0.25; round 28 measured 0), and swap jerks of 40 px or more rise to 58 and 20

- Game, chapter: both (FFX Chapter I and FFX-2 Chapter IV, desktop; the pack is on by default there since release 63); seymour-flux, ffx2-bahamut; battle, hit and attack poses
- Tags: introducedByCandidate True, regressionVsLive True, inNewFeature True
- Observed: Frame-by-frame continuity on the live build, seed 1, 1600x900, 59.5 and 59.7 fps. Chapter I: 31 snaps in 398.4 s (22 to the hurt pose, 7 to follow), 58 jerks of 40 px or more; Chapter IV: 47 snaps in 375.7 s (22 to attack, 20 to hurt), 20 jerks of 40 px or more (Rikku ready to attack 11 times, worst 79.3 px). The same two routes with ?pack=off read 0 snaps and 15 and 1 jerks (worst 70 and 48 px). Bisect on Chapter I: ?smear=off gives 0 snaps and 33 jerks, ?pro=off 5.38 snaps, ?curves=today and ?moments=today leave the snaps (4.3 and 4.8), so the smear lane makes the cuts and the smear lane with the pro look makes the extra jerks. A fresh confirming run of both chapters (tag confirm) read 4.95 and 7.49 snaps per minute, worst jerks 290.7 and 89.5 px. The strips show a clean same-place pop on the frame the hit lands (Yuna idle to hurt as the bolt arrives, Auron attack to follow with the cape thrown up, Rikku ready to a lunge); head and feet stay on the guide lines. Also with the pack on, 21 jerks of 40 px or more fall mid-move in Chapter I (pack off: 3): four times Auron's head drops 141 to 158 px in one frame with no pose change (frames 11556, 13055, 13944, 22509), then rises 99 to 114 px on the damage event; cause suspected (the strike curve's wind-up dip, or a registration offset), not traced, and no frames of the move exist. The 1,275 px "jerks" in the table are camera cuts the harness cannot always separate from a teleport and are not quoted as player-visible. The cross-dissolves that remain on the other swaps are PR-0379. Outside the pack the same harness still finds swap jerks of 40 px or more in 11 of 14 further chapters (ffx2-leblanc 8, seymour-anima-macalania 8, evrae-airship 17, seymour-omnis 1, isaaru-via-purifico 15, ffx2-den-of-woe 11, ffx2-ixion-djose 2, ffx2-fallen-aeons 12, ffx2-vegnagun-shuyin 6, yunalesca 60, ffx2-trema 60; worst single frame 203.2 px, which may be a scene or camera cut); this is the older PR-0380 class of round 28 (rig and swap jerks, 40 to 48 px then) and is reached with the pack off as well, so it is not caused by the pack.
- Expected: CHK-027: at most 0.25 snaps per minute of battle and no jerk of 40 px or more at a swap outside a planned camera cut (RUBRIC 6a, Bailey 2026-10-04 "snapping around in a discontinuous half motion").
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=seymour-flux --goal=win --size=1600x900 --seed=1 --pose-measure-from=D:/pyrefly-release55 ; repeat with --chapters=ffx2-bahamut and with the base https://echoesofspira.com/?pack=off# and ?smear=off# ; strips under the evidence folders. Seed 1, GPU headless.
- Evidence: critic/rounds/round-29/evidence/continuity-summary-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-ffx2-bahamut.json; critic/rounds/round-29/evidence/continuity-summary-packoff-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-packoff-ffx2-bahamut.json; critic/rounds/round-29/evidence/continuity-summary-bis-smear-off-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-bis-pro-off-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-confirm-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-confirm-ffx2-bahamut.json; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-000-kimahri-idle-hurt.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-102-auron-attack-follow.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-158-rikku-ready-attack.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-117-paine-ready-attack.jpg
- Confidence: high on the counts and the A/B (pack on versus off, same seed, same harness, reproduced by a second run); high that the smear lane makes the snaps in Chapter I (bisect), medium for Chapter IV (not bisected); medium on the Auron mid-move drops (cause not traced). Whether a hard cut on the impact frame is the intended held-hit look is Bailey's call (CHK-B2).
- Requirement: CHK-027 and RUBRIC 6a (animation sub-score capped at 7.5 above 0.25 snaps per minute); Bailey D-420 to D-426
- Where: smear lane of the conference pack, src/engine/motion (suspected, not traced to a line)
- Smallest fix: Decide the look with Bailey first (proposal 1). If the cut is not the intended look: keep one to three blend frames on the to-hurt and ready-to-attack swaps so the smear covers the change, or default ?smear to off until it does; ease the Auron strike start over 3 to 4 frames. If it is the intended look: record it as a designed smear in CHK-027 so the metric measures only undesigned snaps. Do not tune it without Bailey's word on the look.
- Acceptance check: Harness, Chapters I and IV, pack on, seed 1, 1600x900: snaps per minute at most 0.25 or the designed smear listed and excluded by an owner decision; swap jerks at most the pack-off counts (15 and 1) and no mid-move jerk of 40 px or more for Auron; strips show no two-body frame on the swaps that remain.
- Note: Merges the capture owner's hard-cut finding, the visual auditor's, the feel auditor's R29-F01 and R29-F02, and the first-time fan's eleven snapping breakers (Kimahri idle to hurt, Yuna idle to hurt and critical to hurt, Auron attack to follow, Paine ready to attack, cast to hurt, idle to hurt, Rikku ready to attack): one root defect.

### PR-0459 (major, visual): Chapter I: Auron's head changes size by 7 and 9.5 percent at two pose swaps in the pro camera's killing-blow close-up (CHK-026 FAIL, default pack); the other chapters are measured later by the chief, one chapter at a time (see continuity)

- Game, chapter: FFX only (Chapter I measured; the repainted Yuna and Kimahri also appear in Chapters II, III, VII to XVI and are unmeasured); seymour-flux; battle, last blow, about 423 s, pro camera close-up
- Tags: introducedByCandidate True, regressionVsLive True, inNewFeature True
- Observed: Registered heads: Auron attack to follow x0.9295 (27.4 to 25.4 px) and follow to idle x1.0948 (27.7 to 30.4 px), tolerance 3 percent, both inside the close-up lens. Two more over-tolerance swaps (Tidus and Yuna idle to victory, x1.41 and x1.24) fall in a camera cut and are excluded by the harness. Feet are fine (worst 1.2 px, limit 2). With ?pack=off the same route has 0 swaps over tolerance (registration jump 0.2 percent). A fresh confirming run on the live site reproduced the FAIL (3 swaps over, 9.4 percent registered). Chapter IV passes (308 of 308 swaps registered, worst head 0.2 percent, feet 0.3 px). The other 17 chapters are UNVERIFIED: the review's own 19-chapter run died after the Chapter I party-prep step (PR-0522); the chapters measured afterwards by the chief are listed under continuity.
- Expected: CHK-026: a figure's head changes by at most 3 percent across a pose swap unless the camera cuts in the same frame (RUBRIC 6a; Bailey 2026-10-04 "their size changes too sometimes and that looks really bad").
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=seymour-flux --goal=win --size=1600x900 --seed=1 --pose-measure-from=D:/pyrefly-release55 ; read swaps 233 and 234 of continuity.json; compare the ?pack=off run.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/continuity.json; critic/rounds/round-29/evidence/continuity-summary-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-confirm-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-packoff-seymour-flux.json; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-102-auron-attack-follow.jpg
- Confidence: high on the measurement (two runs); medium on the cause (suspected: the close lens yaws the planes, as docs/handoff/r63-rc.md also says)
- Requirement: CHK-026, RUBRIC 6a (characterModels and animation sub-scores capped at 7.0 while it fails)
- Where: pro camera close-up lens (src/engine, suspected, not traced)
- Smallest fix: Make the pro camera's close-up size the same figure the same way at both poses (compensate the head ratio inside the lens), or hold the pose across the close-up, or use a pose registered for that lens. The Final Aeon of Braska, Sin fins and core and Mirror Aeons are still unmeasured.
- Acceptance check: Harness, Chapter I, pack on, seed 1, 1600x900: CHK-026 PASS with headOverTolerance 0 outside camera cuts; every other planned chapter has a measured result.

### PR-0379 (major, feel): Pose swaps that are not hard cuts are still see-through cross-dissolves: two Kimahris, two Yunas, two Paines and two Rikkus for 3 to 6 frames (carried; 170 of 213 and 261 of 308 swaps, worst severity 0.34)

- Game, chapter: both (shared pose-swap plumbing; seen on Kimahri, Yuna, Mortiorchis in FFX Chapter I and Paine, Rikku in FFX-2 Chapter IV); seymour-flux, ffx2-bahamut; battle, pose swaps
- Tags: introducedByCandidate False, regressionVsLive False, inNewFeature False
- Observed: The harness counts ghost swaps on 170 of 213 (Chapter I, 661 ghost frames) and 261 of 308 (Chapter IV, 955 frames), worst severity 0.333 and 0.343, none over the 0.4 fail line. The first-time fan lists the same pattern across figures and games: Kimahri idle to ready and back (swap-026, swap-043), hurt to idle (swap-001, a green ghost for 6 frames), KO to idle (swap-007); Yuna hurt to critical (swap-080, ghost-015), hurt to idle (ghost-117, a pale smear that nearly vanishes), item to idle (ghost-179); Mortiorchis idle to attack (a see-through skeleton for 4 or more frames); Paine ready, idle, follow and attack on nearly every change (seven strips; ready to idle dissolves between two different costumes, PR-0517); Rikku attack to follow (ghost-213). With smear off the 199 double-image swaps return, so removing the smear cut trades snaps for dissolves (PR-0380).
- Expected: A swap reads as one figure (CHK-027 item 3, Bailey 2026-10-04 "half motion").
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=ffx2-bahamut --goal=win --size=1600x900 --seed=1 --pose-measure-from=D:/pyrefly-release55 ; strips ghost-*.jpg in the cont2 folders.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-026-kimahri-idle-ready.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-080-yuna-hurt-critical.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/ghost-117-yuna-hurt-idle.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/ghost-075-mortiorchis-idle-attack.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/ghost-150-paine-ready-idle.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/ghost-213-rikku-attack-follow.jpg; critic/rounds/round-29/evidence/continuity-summary-seymour-flux.json; critic/rounds/round-29/evidence/continuity-summary-ffx2-bahamut.json
- Confidence: high on the counts and strips; the severity of the dissolves for a watching player is Bailey's call
- Requirement: CHK-027 item 3; carried PR-0379 of rounds 26 to 28
- Where: pose swap blend, src/engine (not traced)
- Smallest fix: Shorten the blend to two or three frames on whole-figure swaps with a large silhouette change, or cut cleanly on the hit frame as the smear does; do not both dissolve and cut. Same fix surface as PR-0380: decide the look once for both.
- Acceptance check: Worst ghost severity under 0.3 and no strip with two bodies both above half opacity in the Chapter I and IV runs.

### PR-0517 (major, visual): FFX-2 Chapter IV: Rikku Dark Knight's and Paine Warrior's ready poses read as different figures from their attack and idle poses (colour, size, costume), and Paine's ready pose floats about 20 px above the floor line

- Game, chapter: FFX-2 only (Rikku Dark Knight, Paine Warrior; the repainted poses also appear in the hidden Chapter VI); ffx2-bahamut; battle, ready to attack, ready to idle
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature False
- Observed: Strip swap-158 (Rikku ready to attack, head x0.9995 registered): the ready pose is a slim, dark-teal stance and the attack pose a larger bright orange and grey lunge, shifted forward, with no frame between; the follow pose is again red and black (swap-137). Strip swap-291 (Paine ready to idle): the ready pose wears a sleeveless white top, red sash and silver heels and her feet hang above the orange floor guide through frames -6 to -1; the idle pose is the black jacket with chunky buckled boots and stands on the line; the strips show the figure dissolving from one costume to the other. The head and feet registration passes (CHK-026 PASS), so this is a painting consistency problem, not a registration one. The r63 ready pose of Paine had the same mismatch (carried); the r64 repaint reduced it for Defend, follow and cast but kept the ready pose different. The visual auditor judged the other r64 repainted poses as closer to their idles than r63 (side-by-side sheets); this finding is limited to the ready poses the strips show.
- Expected: The same costume and a consistent body size across a figure's poses (RUBRIC visual: consistency); feet on the ground line.
- Repro: Chapter IV real keys, seed 1: Rikku and Paine ready (waiting for their turn) to attack and to idle; strips from the continuity harness.
- Evidence: critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-158-rikku-ready-attack.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-137-rikku-attack-follow.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-291-paine-ready-idle.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-117-paine-ready-attack.jpg; critic/rounds/round-29/crops/paine-r63-vs-r64.jpg; critic/rounds/round-29/crops/rikku-dk-r63-vs-r64.jpg
- Confidence: high that the ready poses differ in the strips I read (two strips read by me, the fan lists seven more); medium on severity (ready lasts a short time per turn)
- Requirement: RUBRIC visual (consistency across poses), CHK-013 guard rails
- Smallest fix: Only with Bailey's yes (hard rule 9 and 10, approved art is never replaced on taste): repaint the two ready poses locked to the idle costume and standing on the floor line. Until then, tell Bailey what the strips show.
- Acceptance check: Side-by-side of ready, idle and attack for Rikku Dark Knight and Paine Warrior: same costume, similar mass, feet on the line; the strips show no costume change at the swap.
- Note: Merges the fan's Rikku size, colour and costume breakers, the Paine floating-feet breaker and the visual auditor's carried "Paine ready pose is a different costume".

### PR-0513 (major, visual): Protected-art ledger is stale: verify-approved reports 828 ok and 89 mismatched on the shipped art (round 28: 917 ok, 0 mismatched)

- Game, chapter: both (FFX Tidus, Yuna, Kimahri, Seymour Flux; FFX-2 Yuna White Mage, Rikku Dark Knight, Paine Warrior, Bahamut); all chapters that field these figures
- Tags: introducedByCandidate True, regressionVsLive False, inNewFeature False
- Observed: docs/target/approved-hashes.json against the art mirror D:/pyrefly-art-r64 (public/art of e9907cad8): approved list 780 ok and 89 mismatched, judge-locked list 48 of 48 ok, 0 missing. The 89: Yuna 12, Kimahri 11, Paine Warrior 13 and Rikku Dark Knight 10 (the r64 repaint; docs/handoff/r64-art.md records Bailey's 2026-10-24 blanket "you can make all the decisions for me, ill go with all your recommendations"), Seymour Flux body 11 and Bahamut 8 (the r63 boss re-cut), Tidus 11 and Yuna White Mage 13 (the 2026-10-22 art batch, ACTIONS.md). approved-hashes.json "is not edited (it keeps the history)", so a later unrecorded change would look the same. No pause or portrait file is among them, and the in-game result renders correctly (CHK-013 PASS). What is on record is a blanket delegation, not a per-asset approval.
- Expected: A replaced approved painting is recorded as an explicit revision with the owner's words and its new hash, so the protection check still means something (RUBRIC 2 and 7).
- Repro: cd D:/pyrefly-release55; ROOT=D:/pyrefly-release55 node D:/Tools/pyrefly-lora/tools/verify-approved.mjs ; list in critic/rounds/round-29/static/verify-approved.txt
- Evidence: critic/rounds/round-29/static/verify-approved.txt; D:/pyrefly-release55/docs/handoff/r64-art.md; D:/pyrefly-release55/docs/handoff/r64-art-shas.json; ACTIONS.md (2026-10-22 and 2026-10-23 rows)
- Confidence: high on the mismatch count; the approval question is Bailey's
- Requirement: RUBRIC 2 and 7 (approved artwork protected; protected assets intact or explicitly revised)
- Smallest fix: Add a revision row per replaced file (old hash, new hash, batch, Bailey's quoted words, date) to approved-hashes.json or a superseding list and rerun verify-approved to 0 mismatched; ask Bailey whether the blanket covers the replaced figures or whether he wants to see them first (proposal 4). If he says he did not approve them, this becomes an unapproved asset replacement, which RUBRIC 6 never waives.
- Acceptance check: verify-approved: 0 mismatched, 0 missing, each changed file carries a revision record with the owner's words.

### PR-0481 (major, delivery): Demo battle start (carried): 18 s from the picker press to the first command in Chapter IV and 22.6 to 28.5 s in Chapter I; frame spikes not re-measured

- Game, chapter: both (demo mode; Chapter I FFX and Chapter IV FFX-2); demo seymour-flux and ffx2-bahamut
- Tags: introducedByCandidate False, regressionVsLive False, inNewFeature False
- Observed: Same measure as round 28 (index timestamps, picker card chosen to first command menu): Chapter IV 18.4 s and 18.4 s (round 28: 18.4 and 19.7 s); Chapter I 22.6, 26.5 and 28.5 s (round 28: 15.8 and 18.1 s). Press to battle screen fell (Chapter IV 0.15 s from 2.5 s; Chapter I 10.9 to 12.6 s now contains the roughly 10 s voiced intro of release 62), so the warm-up moved the load before the press but the wait to the first command did not shorten; the rest is the authored opening. The feel auditor read 26 s and 18 s at the fastest press. No frame probe ran on the demo start, so the 0.8 to 1.0 s frames of round 28 are neither confirmed nor cleared; whether A skips the Chapter I intro in the booth flow was not exercised.
- Expected: A booth visitor reaches the first command quickly; round 28 recorded 12 to 14 s and flagged it.
- Repro: https://echoesofspira.com/?demo=1, simulated pad, D-pad to the card, A, wait for awaitingMenu (critic/rounds/round-29/cap/demo.mjs), 1920x1080, seeds 7 and 56, headless GPU Chromium.
- Evidence: critic/rounds/round-29/evidence/index.json (demo-ffx-win, demo-ffx-thanks, demo-ffx-lose, demo-ffx2-win, demo-ffx2-lose2: 03b to 10-first-menu timestamps); critic/rounds/round-29/cap/demo.mjs
- Confidence: medium on the interval (same method, 7 comparable runs, fastest possible press, headless); unverified on frames; the booth PC and a human pace are not measured
- Requirement: RUBRIC feel and delivery (dead waiting); booth plan
- Where: demo flow: src/app/demo (not traced)
- Smallest fix: Measure on the booth PC with a human-paced press, with and without A during the Chapter I intro; if still over about 10 s, stage the opening (boss card, camera sweep) or start the prebuild at the title; otherwise state 20 to 30 s in the booth script.
- Acceptance check: Booth PC, 3 cold and 3 warm presses per chapter at 2560x1440: press to first command at or under 12 s, or the staged opening documented; no frame over 250 ms after the first 2 s.

### PR-0148 (major, audio): No numeric owner listening verdict covers the shipped mix (carried, twelfth review): music has an owner number (7/10, 2026-10-13), SFX, voice and the conference sound pass have none

- Game, chapter: both; all
- Tags: introducedByCandidate False, regressionVsLive False, inNewFeature False
- Observed: docs/target/decisions.json D-804 and targets.json record "I like all the music 7/10" (2026-10-13, ear verdict, music only). docs/audio/OWNER-VERDICT.md, which rounds 27 and 28 read, does not list it, so those rounds said no number existed (corrected here). The number predates three re-rendered victory cues, five re-rendered SFX files, 245 voice lines and the conference sound pass, and the sound effects have no score. No agent heard anything. Technical health is clean (43 music cues, 0 findings, -16.2 to -16.0 LUFS, worst true peak -1.48 dBTP, 285 mp3 decode clean, 300 of 300 files hash-equal to the artifact manifest).
- Expected: A recorded owner listening verdict that covers the shipped mix, or the audio category stays UNVERIFIED (RUBRIC audio; CHK-B1).
- Repro: Read docs/target/decisions.json D-804, D-809, D-810; docs/target/targets.json waiting list; docs/audio/OWNER-VERDICT.md (newest entry 2026-09-28).
- Evidence: critic/rounds/round-29/audio/qa.json; critic/rounds/round-29/audio/qa.log; docs/target/decisions.json (D-804)
- Confidence: high
- Requirement: audio category: Bailey's listening assessment; CHK-B1
- Smallest fix: Copy the D-804 verdict into OWNER-VERDICT.md, then ask Bailey for a number on the current build (music, sound effects, voice) after he listens to the Chapter I and IV demo fights. Agents cannot hear (hard rule 13).
- Acceptance check: A dated owner number for each of music, SFX and voice is on record after release 64.

### PR-0099 (major, audio): Borrowed or stand-in scene beds and battle cues in some chapters (carried; not re-examined this round)

- Game, chapter: both; several chapters
- Tags: introducedByCandidate False, regressionVsLive False, inNewFeature False
- Observed: Carried unchanged from round 28 (eleven chapters then). This round's routing probe shows each chapter's battle cue equals its data cue and that Trema link 1 plays the scene bed by data (tremaBattleCue), but whether a cue is a stand-in is an ear and sourcing judgment nobody made this round. Dependency argument for carrying it: git diff 660c19bbd e9907cad8 changes no existing audio file (10 voice files added), so the cue set judged in round 28 is the cue set shipped here.
- Expected: Every chapter plays a sourced or owner-approved cue (RUBRIC audio).
- Repro: Read the chapter cue table in src/data against docs/audio/THEMES.md.
- Evidence: critic/rounds/round-29/audio/qa.json; critic/rounds/round-28.md (PR-0099)
- Confidence: low (reused, not re-examined)
- Requirement: RUBRIC audio; carried PR-0099
- Smallest fix: Owner decision on which stand-ins to replace (audio choices are delegated to the driver "for now", 2026-10-22).
- Acceptance check: The list of stand-in cues is re-read against the shipped table and each carries an owner decision.

### PR-0295 (major, interface): Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; the phone prep tabs were not captured this round)

- Game, chapter: both; party prep, 390x844
- Tags: introducedByCandidate False, regressionVsLive False, inNewFeature False
- Observed: Not re-examined: only the Chapter tab of prep was captured on the phone. The new phone findings are listed separately (PR-0518). The prep tabs themselves are never walked at any size (PR-0503), so the carried finding stays at its r28 severity without new evidence.
- Expected: Prep is usable on a phone (RUBRIC interface; device usability).
- Repro: Chapter IV, 390x844 touch, party prep: one frame per tab.
- Evidence: critic/rounds/round-28.md (PR-0295)
- Confidence: low (carried, not re-examined)
- Requirement: RUBRIC interface and onboarding (device usability)
- Smallest fix: A dedicated prep-walk route (PR-0503) at 390x844, then decide the phone layout.
- Acceptance check: One frame per prep tab at 390x844 with no clipped or unreachable control.

### PR-0504 (minor, audio): Chapter IV win results are silent on the default desktop build (by a deliberate release 62 pick that nobody has heard); Chapter I demo wins now play the victory cue (round 28 major fixed)

- Game, chapter: FFX-2 only (Chapter IV results); ffx2-bahamut results screen, win
- Observed: With the conference pack on (default on desktop since release 63) the Chapter IV results screen plays nothing for 24 one-second samples (playing=null; 8 of 8 pack-on wins, demo and normal; a fresh confirming win also read null). With the pack off or on the phone the same screen plays "pause". Chapter I wins play victory-ffx, also in demo (round 28's PR-0504 is fixed there). The code says silence is intended: PASS_SILENT_WIN in src/audio/pass/passResults.ts, picked from the writing bible's "music simply stops", a driver pick under Bailey's 2026-10-22 delegation and not an ear verdict. Round 27 played victory-bahamut here, so the screen changed from earlier releases. Whether a booth should end its boss fight on silence is an ear call.
- Expected: Per the design: silence. The open question is whether the owner wants it.
- Repro: Chapter IV win at 1920x1080 with the default pack, seed 56; read window.__pyrefly.audioDebug().playing at results; A/B with ?pack=off or a phone viewport.
- Evidence: critic/rounds/round-29/evidence/audio-ffx2-results/run.json; critic/rounds/round-29/evidence/ffx2-bahamut-win-r1600/audio-debug.jsonl; critic/rounds/round-29/evidence/ffx2-bahamut-win-packoff/audio-debug.jsonl; critic/rounds/round-29/evidence/ffx2-bahamut-win-confirm/audio-debug.jsonl
- Confidence: high on the observation and the design intent
- Requirement: audio: right cue at each real moment; owner judgment
- Smallest fix: Bailey listens to the Chapter IV results with the pack on and says keep or change; if change, remove ffx2-bahamut from PASS_SILENT_WIN so the pause cue plays.
- Acceptance check: results snapshot reads playing=pause, or the owner confirms silence.
- Note: The capture owner ranked this major (a regression against round 27); the audio auditor read the code and ranked it by design. The chief keeps minor: a designed behaviour awaiting the owner's ear, not a routing fault. If Bailey dislikes it, it becomes a one-line change.

### PR-0460 (minor, combat): Chapter III possession links 3 to 6: whether the Summon rows are inert is unknown (carried; downgraded from major: not reproduced at the engine layer, never reached in a browser)

- Game, chapter: FFX only; braskas-final-aeon links 3 to 6
- Observed: No real-key run reached link 2 or later (Braska never left link 1). Engine side, re-run and byte-identical to round 27: possessed-ifrit lists Ixion, Shiva, Bahamut as ENABLED Summon rows and possessed-bahamut and Yu Yevon list none with Grand Summon grey. The confirmer re-read the probe output and could not reproduce "greyed rows where Enter does nothing" at that layer; whether the original allows summoning in a possession link is not in research/*.md, so under hard rule 6 this is an unknown, not a bug.
- Expected: Rows match the original's behaviour (research/re-ffx-last-summoning.md).
- Repro: critic/rounds/round-29/audit-combat/ch3.probe.ts (engine); browser: Chapter III links 3 to 6, real keys, first Yuna menu.
- Evidence: critic/rounds/round-29/audit-combat/ch3-cand.json
- Confidence: UNVERIFIED; high that engine code is unchanged
- Requirement: RE menu-draw parity; AGENTS.md rule 6
- Smallest fix: Capture the link 3 to 6 menu once the route can win link 1 (PR-0397); record the original's behaviour in research.
- Acceptance check: Real-key run of links 3 to 6 whose Summon area matches the recorded original.

### PR-0514 (minor, audio): UI sounds fall back to the procedural synth for the first seconds of a session (97 entries in 29 of 54 live runs; round 28: 0 of 16)

- Game, chapter: both; title and chapter picker, every chapter's first presses
- Observed: The first cursor-move, confirm and ambient wind sounds were played through the synth path (sfxLog via=synth) instead of the shipped sprite, at AudioManager time 1.0 to 6.8 s, and in 4 runs until 8.7 to 10.2 s (Chapter IV route: 13 cursor-moves at 3.1 to 5.6 s, first sprite sound at 9.2 s). The gap pass reproduced it on a cold profile (14 of the first about 29 SFX of the Chapter IV route; Chapter I 1). The timbre differs from the shipped glass and bell set. Cause not isolated: several heavy lanes ran, and release 63 added boot work (fight prebuild, warm); no controlled A/B.
- Expected: CHK-001 step 3: nothing falls back to the synth path.
- Repro: Fresh profile, GPU headless, open https://echoesofspira.com/, press Enter and Down within 3 s of the first input, read the AudioManager debug sfxLog.
- Evidence: critic/rounds/round-29/cap/aud3.mjs; critic/rounds/round-29/evidence/ffx2-bahamut-win-r1600/audio-debug.jsonl; critic/rounds/round-29/evidence/gaps/audio-a/result.json
- Confidence: high that it happens, medium on the cause
- Requirement: CHK-001 step 3; audio useful feedback
- Smallest fix: Load and decode the SFX sprites ahead of the music and voice warm, and make UI cues wait for the sprite or stay silent rather than use the synth.
- Acceptance check: With 4x CPU throttle and a cold cache, a press at 1 s produces no via=synth entry in 5 of 5 runs.

### PR-0516 (minor, interface): Panels over painted actors and live controls (CHK-008 FAIL): the E intent card covers the current actor in the turn order, the target flag overprints the advisor chip and the actor header, the Bushido card hides Auron's name plate, and a scripted dialogue box covers the boss nameplate at 2560x1440

- Game, chapter: both (E card FFX Chapter I; target flag FFX-2 Chapter IV at 2000x1012); seymour-flux, ffx2-bahamut; first menu, intent, target
- Observed: At 1600x900 and 2000x1012 the E card sits over the NOW slot, its portrait and the TURN ORDER label (Tidus ghosts through "3RD IN QUEUE"); at 2000x1012 the FFX-2 TARGET plate overprints Paine's portrait, the first letter of "Magic Break" and the advisor chip; the Bushido card hides Auron's name plate; the Chapter I first menu at 2560x1440 on an unpinned seed sits under the scripted Seymour dialogue slab, which covers the upper part of Mortiorchis and the boss nameplate (proxy projection: 1 hit at 2000, 2 at 2560, none at 1280 and 1600; Chapter IV 0 hits at all four sizes). Guide and intel panels cover the boss side in Vegnagun, Paragon, Natus and Omnis (polish). Intent-card and guide body text measures about 12 to 13 px effective by eye at 1600x900 (suspected under the 14 px floor; no DOM sweep exists, CHK-003). None hides a required control permanently.
- Expected: No panel hides the active actor or the target; text at or above the 14 px floor (CHK-003, CHK-008).
- Repro: Chapter I first menu, press E, 1600x900 and 2000x1012; Chapter IV Attack, cursor on Bahamut, 2000x1012; gap-hud at 2560x1440.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-r1600/12-intent-E.jpg; critic/rounds/round-29/evidence/seymour-flux-win-r2000/12-intent-E.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-r2000/16-target-single.jpg; critic/rounds/round-29/evidence/gaps/hud/result.json; critic/rounds/round-29/evidence/gaps/hud/seymour-flux-2560x1440-first-menu.jpg
- Confidence: high for the overlaps, low for the pixel sizes
- Requirement: RUBRIC interface; CHK-003, CHK-008
- Smallest fix: Anchor the intent card below the turn strip, nudge the target flag off the header, raise the Bushido card, and run a DOM font-size sweep on visible nodes only.
- Acceptance check: No overlap between .eint__panel and the turn strip or between the target flag and the header at 1600x900, 2000x1012 and 4:3; a computed font-size sweep reports no visible text under 14 px.
- Note: Merges the capture owner's E-card and target-flag findings, the interface auditor's, and the visual gap pass's dialogue-box observation (PR-0456 carried class).

### PR-0502 (minor, interface): Chapter I: Seymour's bark box covers the first menu's rows for 2 to 4 s (and on the phone the SPECIAL and ESCAPE rows); Chapter IV's turn-intro wipe hides most of the scene with an unreadable gold label (carried PR-0502, re-observed)

- Game, chapter: both (bark box FFX Chapter I; wipe FFX-2 Chapter IV); seymour-flux, ffx2-bahamut; first menu
- Observed: Bark lines last 1.5 to 4 s (10 in the fight) and cover the lower command rows and the active party card while awaitingMenu is true, at 1600x900 and 390x844. Chapter IV: Paine's portrait wipe covers about 42 percent of the left screen, Bahamut is nearly invisible and "YOUR TURN . ATB 3 OF 3" is gold over pink and black; the settled frames are fine and the wipe's duration was not measured (frames 10 and 11 are 55 ms apart). Whether a press is blocked while the bark box is up was not tested.
- Expected: No bark or wipe covers live menu rows.
- Repro: Chapter I first menu, screenshot at awaitingMenu; Chapter IV first menu, frames at 55 ms steps.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-r1600/10-first-menu-coach.jpg; critic/rounds/round-29/evidence/seymour-flux-win-phone-touch/10-first-menu-coach.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-r1600/10-first-menu-coach.jpg; critic/rounds/round-29/crops/ch4-first-menu-lowerthird.png
- Confidence: medium (transient)
- Requirement: RUBRIC interface; carried PR-0502
- Smallest fix: Place barks above the command column or shrink them; shorten the wipe or let the menu show through and raise the label contrast.
- Acceptance check: No bark rectangle intersects .ig-cmd rows at 1600x900 and 390x844; the wipe duration is measured and under 0.6 s.

### PR-0519 (minor, interface): Question for Bailey: the default Chapter I and IV HUD no longer shows the advisor's reason, benefit or cure tag

- Game, chapter: both (Chapters I and IV, pack on); seymour-flux, ffx2-bahamut; first menu
- Observed: The pack-on default shows a one-row chip ("Mega Phoenix -> the party - no MP", star on ITEMS). The classic card (pack=off) showed IN ITEMS, +2,310, CURES KO and the Lance-of-Atrophy warning. The folded G strip keeps only the first sentence. The harness's cardFirst and advisorMinEffPx measure a card that is not on screen in any default-HUD frame, so they are not evidence of what a player reads.
- Expected: Either the F1 target is the one-row tip (then fine) or the reason line is restored; the harness measures visible nodes only.
- Repro: Chapter I first menu with and without ?pack=off.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-r1600/11-advisor.jpg; critic/rounds/round-29/evidence/seymour-flux-win-packoff/12-intent-E.png
- Confidence: high on what is on screen; whether it is intended is not known
- Requirement: RUBRIC interface (legal and useful advice); hard rule 9
- Smallest fix: Decision for Bailey against the F1 target; make the harness read visible nodes only.
- Acceptance check: Owner decision recorded; harness legibility figures describe visible nodes.
- Note: Not a defect finding until the owner says the reason line was wanted.

### PR-0515 (minor, interface): Doublecast advice says NO MP while the spell picker shows the MP cost

- Game, chapter: FFX only (Sin face, Braska's Final Aeon: Lulu's Doublecast); sin-face, braskas-final-aeon
- Observed: The advisor strip reads "Doublecast: Firaga + Firaga -> Sin, IN SPECIAL, NO MP" while the open picker lists Firaga at 16 MP (two casts, 32 MP); Braska: advisor NO MP, picker rows 1 MP. The Doublecast row is free but the recommended action is not. Cost basis such as Half MP was not traced.
- Expected: The advisor states the summed cost of the two named spells (CHK-004).
- Repro: Sin face, Lulu's turn, open the advisor and the Doublecast picker.
- Evidence: critic/rounds/round-29/evidence/sin-face-win-r1600/25-doublecast.jpg; critic/rounds/round-29/evidence/braskas-final-aeon-win-r1600b/25-doublecast.jpg
- Confidence: medium
- Requirement: CHK-004; RUBRIC interface (legal and useful advice)
- Smallest fix: Show the summed cost of the named spells in the chip and the card for Doublecast.
- Acceptance check: Chip text equals the picker cost for Doublecast on both chapters.

### PR-0518 (minor, interface): Phone 390x844: the Chapter IV CHANGE plate text spills out of its tiles and is clipped at both edges; the pause header collides with the tab strip and the OPTIONS list stops at a half row

- Game, chapter: both (CHANGE plate FFX-2; pause both); ffx2-bahamut, seymour-flux; phone
- Observed: GUNNER and WARRIOR labels sit on the tile border outside their boxes, GUNNER is cut at the left edge and "GRANTS: BLUE" at the right (one settled-looking frame; the spherechange frames are covered by a coach card). Pause: the title wraps to two lines touching the tab row, tabs read "ER GUIDE OPTIONS ACCESSIBI", OPTIONS shows three sliders and a half-hidden TEXT SPEED row with no scroll cue, and keyboard hints (ESC RESUME, H PAINTING ONLY) are printed on a touch screen. Whether the lists scroll is UNVERIFIED.
- Expected: No clipped text on a phone; touch hints on a touch screen.
- Repro: Chapter IV phone route: open CHANGE; open pause, OPTIONS.
- Evidence: critic/rounds/round-29/evidence/ffx2-bahamut-win-phone-touch/21-change-open.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-phone-touch/14-pause-options.jpg; critic/rounds/round-29/evidence/ffx2-bahamut-win-phone-touch/14-pause-Esc.jpg
- Confidence: medium (single captures)
- Requirement: RUBRIC interface and onboarding (device usability)
- Smallest fix: Wrap label and Grants line inside the tile; one-line the header, add a scroll cue, show a tap target for Resume and hide key hints on touch.
- Acceptance check: Phone captures at 360, 390 and 430 widths show no clipped text and a visible way to reach every row.

### PR-0520 (minor, visual): A cold first visit shows partly loaded art: a blurred title, the Chapter I card with only Seymour's head, and in the demo picker empty tiles and silhouette chips (reached 20 to 40 s on a throttled link)

- Game, chapter: both; title, Chapter I card, demo picker
- Observed: Throttled to 4 Mbps and 150 ms RTT with the cache off: the title is ready in 5.8 to 7.5 s and the picker is reached about 1.5 s after Enter, but the Chapter I and IV tile thumbnails are empty boxes and the Yuna and Kimahri chips silhouettes until about 20 to 40 s; broken-image alt text ("Yuna", "Paine") appeared in two picker captures and Paine's chip stayed a silhouette in a 2560x1440 picker after a win. The same screens are whole warm (picker 3 s after opening, 1920x1080: hero, tiles and the three chips complete, every image decoded). No 404. The booth PC is warm after the first load.
- Expected: CHK-012: no fallback silhouette or alt-text icon on a shipped screen.
- Repro: gap-cold.mjs and gap-pick.mjs in critic/rounds/round-29/cap (throttled cold) against the warm run.
- Evidence: critic/rounds/round-29/evidence/gaps/cold/result.json; critic/rounds/round-29/evidence/gaps/picker/cold-t5s.jpg; critic/rounds/round-29/evidence/gaps/picker/warm-1920-ch4-3s.jpg; critic/rounds/round-29/crops/titles-contact.jpg; critic/rounds/round-29/crops/picker.jpg
- Confidence: medium (cold cache and throttle; headless)
- Requirement: CHK-012; RUBRIC visual
- Smallest fix: Hold the picker until its plates and the three portraits are decoded, or show a painted placeholder, never the alt-text icon; warm the booth cache once before opening.
- Acceptance check: Cold throttled picker shows no empty plate or alt text after the first paint, 5 of 5 runs; Paine's chip loads.

### PR-0479 (minor, visual): Chapter I action shots crop Seymour Flux's head out of the frame (3 of 3 mid-fight captures); the settled menu shots frame him whole (carried PR-0479, worse with the pro camera)

- Game, chapter: FFX only; seymour-flux; mid-fight
- Observed: His head and shoulders are above the frame and the turn-order ribbon sits over his torso in 23-midfight at 1600x900, 2000x1012 and the demo run; round 28's static mid-fight showed him whole. A directed shot, judged from three stills.
- Expected: The boss's head stays inside the safe frame.
- Repro: Chapter I mid-fight stills at 1600x900 and 2000x1012.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-r1600/23-midfight.jpg; critic/rounds/round-29/evidence/seymour-flux-win-r2000/23-midfight.jpg; critic/rounds/round-29/evidence/demo-ffx-win/seymour-flux-win/23-midfight.png; critic/rounds/round-28/evidence/seymour-flux-win/23-midfight.png
- Confidence: medium
- Requirement: RUBRIC visual (composition, staging)
- Smallest fix: Clamp the pro camera's Chapter I action shot so the head stays in the safe frame, or cut to a wide frame for the boss.
- Acceptance check: Mid-fight stills at three sizes show the whole head.

### PR-0521 (minor, feel): Pro camera shots in Chapter I: a hard cut to wide shrinks the party to a third; Full-Life pushes in with the party out of frame; Lance of Atrophy leaves half the arena empty and its bolt reads as aimed at empty space (taste, for Bailey)

- Game, chapter: FFX only; seymour-flux; action shots
- Observed: The fan lists three camera breakers (seq-action-playing f02 to f03; full-life-01 to 03; lance-of-atrophy-05 to 08). I read the Lance and Full-Life contact sheet: the Lance bolt is a thin purple line in flight at the right of the party (frame 07) and the 728 appears on Tidus on the next frame, so it connects; Full-Life is a deliberate close-up on the caster pair with the party off frame; the right half of the wide shot is dark empty stage. These are directed-camera choices, not errors; the camera sub-score is carried at 7.5 and the judgment is Bailey's (CHK-B2).
- Expected: A camera that keeps the party readable at action time (RUBRIC feel: coherent camera).
- Repro: Chapter I, Lance of Atrophy and Full-Life clips (critic/rounds/round-29/evidence/clip-ffx-specials).
- Evidence: critic/rounds/round-29/evidence/clip-ffx-specials/clips/lance-of-atrophy-06.jpg; critic/rounds/round-29/evidence/clip-ffx-specials/clips/lance-of-atrophy-08.jpg; critic/rounds/round-29/evidence/clip-ffx-specials/clips/full-life-02.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/seq-action-playing/f02.jpg
- Confidence: medium on severity (I read two clips; taste)
- Requirement: RUBRIC feel; CHK-B2
- Smallest fix: Show Bailey the clips and let him name what he wants; if the party must stay in frame, widen the Full-Life shot.
- Acceptance check: Owner verdict on the camera shots recorded.

### PR-0529 (minor, visual): FFX-2 Chapter VII (Trema): Paragon feet move about 10 px at 16 pose swaps (idle to cast, cast to hurt; CHK-026 FAIL on feet in a chapter without the pack)

- Game, chapter: FFX-2 only (boss Paragon); ffx2-trema; battle, Paragon idle, cast and hurt
- Observed: Chief run of the continuity harness on the live site, seed 1, 1600x900, 1,160.7 s of battle, 2,103 swaps counted: head 0 over tolerance (worst registered 0.2 percent, mass-read 2.3 percent) but 16 swaps of a standing figure move its feet more than 2 px, all Paragon: idle to cast +10.2 and +10.4 px, cast to hurt -9.8 px, hurt to cast +9.6 px, cast to idle -10.3 px (swaps 5991, 6105, 6137, 6227, 6259, 6443, 6475, 6484, 6489, 6610, 6642, 6817, 6849, 6876, 8238, 8320). The figure is about 520 px tall in the frame, so the step is about 2 percent of its height: a visible bob when it casts, not a size jump. No snaps (0 per minute), 2,078 ghost swaps (worst 0.349), 60 jerks of 40 px or more (worst 121.7 px). I did not read the strips.
- Expected: CHK-026: the feet of a standing figure change by at most 2 px at 1600 wide at a pose swap.
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=ffx2-trema --goal=win --size=1600x900 --seed=1 --pose-measure-from=D:/pyrefly-release55
- Evidence: critic/rounds/round-29/evidence/continuity-summary-ffx2-trema.json; critic/rounds/round-29/evidence/ffx2-trema-win-cont3/continuity/continuity.json; critic/rounds/round-29/evidence/ffx2-trema-win-cont3/continuity/strips/swap-190-paragon-idle-cast.jpg
- Confidence: medium: one run, numbers firm, strips not read by me; whether it predates this release is unknown (no earlier Trema run exists)
- Requirement: CHK-026 (feet)
- Smallest fix: Register the Paragon cast and hurt poses to the idle feet line, or accept the bob as a designed cast hop and list it in the check.
- Acceptance check: Harness, ffx2-trema, seed 1: feetOverTolerance 0.

### PR-0522 (minor, harness): The review's own 19-chapter continuity run died after the Chapter I party-prep step; CHK-026 and CHK-027 were measured by the capture owner for Chapters I and IV only and by the chief for the chapters listed under continuity

- Game, chapter: both; chapters outside Chapters I and IV
- Observed: run-r29.log stops after "prepEscGoesTo party-prep" for seymour-flux; the process was gone; the folder held only 05b-scene-esc.png and an audio file; no continuity-summary.json. A stale RIG-RECORD lock (lane r29-continuity) was left behind and is gone now. Not a product defect. The chief re-ran further chapters one at a time with the same harness, seed 1, 1600x900: 14 chapters: ffx2-leblanc (head 28.7%, feet 0.8 px, snaps/min 0, jerks>=40px 8, ghost 0.356); seymour-anima-macalania (head 22.1%, feet 0.9 px, snaps/min 0, jerks>=40px 8, ghost 0.329); yojimbo-cavern (head 4.8%, feet 0.4 px, snaps/min 0, jerks>=40px 0, ghost 0.315); seymour-natus (head 13.4%, feet 0.8 px, snaps/min 0, jerks>=40px 0, ghost 0.329); evrae-airship (head 0.1%, feet 1.1 px, snaps/min 0, jerks>=40px 17, ghost 0.366); seymour-omnis (head 8.7%, feet 1.5 px, snaps/min 0, jerks>=40px 1, ghost 0.285); isaaru-via-purifico (head 16.6%, feet 1.3 px, snaps/min 0, jerks>=40px 15, ghost 0.33); ffx2-den-of-woe (head 2.9%, feet 0.8 px, snaps/min 0, jerks>=40px 11, ghost 0.339); ffx2-ixion-djose (head 18.9%, feet 0.5 px, snaps/min 0, jerks>=40px 2, ghost 0.314); ffx2-fallen-aeons (head 15.6%, feet 1.2 px, snaps/min 0.15, jerks>=40px 12, ghost 0.336); ffx2-vegnagun-shuyin (head 9.4%, feet 0.7 px, snaps/min 0, jerks>=40px 6, ghost 0.321); sin-face (head 0.1%, feet 0.5 px, snaps/min 0, jerks>=40px 0, ghost 0.248); yunalesca (head 10.7%, feet 1 px, snaps/min 0, jerks>=40px 60, ghost 0.352); ffx2-trema (head 2.3%, feet 10.4 px, snaps/min 0, jerks>=40px 60, ghost 0.349). Every chapter not in that list is UNVERIFIED for CHK-026 and CHK-027.
- Expected: RUBRIC 6a: the harness is a required evidence step of a deep review over every listed chapter.
- Repro: Read run-r29.log and list the folder.
- Evidence: critic/rounds/round-29/continuity/run-r29.log
- Confidence: high
- Requirement: RUBRIC 6a, CHK-026, CHK-027 coverage
- Smallest fix: Re-run the harness one chapter at a time with a progress file (the chapters still UNVERIFIED first), and remove a stale lock only after the PID is confirmed gone.
- Acceptance check: continuity-summary.json lists all 19 chapters with a verdict or a stated cause.

### PR-0523 (minor, interface): Esc from the command menu closes an open guide panel first, so the pause seems ignored (Den of Woe, Isaaru via Purifico, where the guide is open by default)

- Game, chapter: both; ffx2-den-of-woe, isaaru-via-purifico
- Observed: After N, E and G toggles in those chapters the first Esc left the screen on "battle" and the second opened the pause; with Esc alone the pause opened at once in all four chapters tried. Chapters I and IV (guide folded by default) always paused on the first Esc. Seven pause-Esc captures were recorded UNVERIFIED for this reason.
- Expected: Esc pauses, or the player sees that it closes the guide (it does close it).
- Repro: gap-esc.mjs: chapter, wait for the menu, n n e e g g, Escape.
- Evidence: critic/rounds/round-29/evidence/gap-esc/result.json
- Confidence: medium
- Requirement: CHK-015 (Esc in every state)
- Smallest fix: Document or show the layering; optionally let Esc pause when the guide is open by default.
- Acceptance check: Esc opens the pause on the first press with the guide open, or a visible cue says Esc closes the guide.

### PR-0487 (minor, onboarding): Chapter I's "He strikes first" first-menu tip is false in 25 of 100 seeds and contradicts the turn order shown beside it (PR-0487 remainder); the tip line was not observed on screen on party-first seeds

- Game, chapter: FFX only; seymour-flux, first menu
- Observed: The tip is now chapter-keyed, so the other FFX chapters are right against the engine's party-first counts (Evrae, Natus, Omnis, Sin core, Mirror Aeons 0 of 40 enemy-first; Anima, Yojimbo, Via Purifico, Sin face 40 of 40; Yunalesca 13, Braska 37). Chapter I still shows it at every first menu, and the engine has the enemy act first in 75 of 100 seeds (Bailey's pick 168c): stills at seed 1 (pack off, phone) show "He strikes first" with Tidus first and Seymour third in the queue. The gap pass on party-first seeds 7, 10 and 12 saw no false line, but also no Auron first-command line on enemy-first seed 1, so "shows only where true" is UNVERIFIED (the script's briefing flag on seed 7 read false, a probable timing fault).
- Expected: The tip matches the state at the first menu on every seed.
- Repro: Chapter I, fresh profile, coach on, seed 7, 10 or 12 versus seed 1.
- Evidence: critic/rounds/round-29/combat/c1-intended.json; critic/rounds/round-29/evidence/seymour-flux-win-packoff/12-intent-E.png; critic/rounds/round-29/evidence/seymour-flux-win-phone-touch/12-intent-E.jpg; critic/rounds/round-29/evidence/gaps/auron-tip/result.json
- Confidence: high on the 75 of 100; the on-screen part is UNVERIFIED
- Requirement: CHK-007 player meaning; hard rule 3
- Smallest fix: Show the line only when the battle log has an action-start before the first menu; otherwise the party-first line.
- Acceptance check: Tip text matches the state at the first menu on seeds 1 to 100.

### PR-0397 (minor, harness): The stock route cannot win Yunalesca or Braska's Final Aeon: its target resolver aims Phoenix Down at Yunalesca and it cannot make the Doublecast pick (route limits, not product findings)

- Game, chapter: FFX only; yunalesca, braskas-final-aeon
- Observed: Yunalesca seeds 1 and 2 end in defeat (112 and 122 turns): resolveTargetId prefix-matches "Yuna" to the enemy id "yunalesca", so 12 (seed 1) and 6 (seed 2) consecutive Phoenix Downs hit the boss, which is immune (research/ffx-yunalesca.md line 114). Braska seeds 1 and 2 end in defeat (356 and 327 turns, 27 and 30 min, after a first run hit the 900 s budget): 67 and 71 failed "Doublecast: Firaga + Firaga" picks, after which Lulu plain-attacks (same limit that stalled Sin face until the 18:10 fix; Sin face then won in 45 turns). Engine side: 37 of 40 and 39 of 40 intended-line wins, and rounds 24 to 27 won Chapter III. The engine and data are unchanged since round 28.
- Expected: A real-key win of both chapters (CHK-022).
- Repro: route.mjs yunalesca win --seed=1|2 ; route.mjs braskas-final-aeon win --seed=1|2 --budget=3000000.
- Evidence: critic/rounds/round-29/evidence/yunalesca-win-r1600/turn-log.json; critic/rounds/round-29/evidence/yunalesca-win-seed2/turn-log.json; critic/rounds/round-29/evidence/braskas-final-aeon-win-r1600b/run.json; critic/rounds/round-29/cap/lib2/route-pure.mjs
- Confidence: high that the route is the cause; not shown that the product lists a KO'd Yuna in that DOM order
- Requirement: CHK-022; RUBRIC 5
- Smallest fix: In the route: prefer an exact id or name match among the party before any prefix match and never across sides; parse the "+" in the Doublecast label; budget Chapter III. Re-run both.
- Acceptance check: Zero turn-log rows with want Yuna and target yunalesca; two consecutive real-key wins of each.

### PR-0461 (minor, coverage): Three of 19 chapters still have no demonstrated real-key win: Yunalesca, Braska's Final Aeon (both PR-0397) and Mirror Aeons (no run)

- Game, chapter: FFX; yunalesca, braskas-final-aeon, mirror-aeons
- Observed: Sixteen chapters were won from the title by real keys this round (round 28: 3 of 19), plus defeat and retry in both demo fights. Mirror Aeons has no browser flow at all; the engine bench has it at 31 of 40. This reduces the carried PR-0461 (major in round 28) to a coverage note because the remaining gaps are route limits and one unrun chapter, not product failures.
- Expected: CHK-022: a win through its real flow for every included chapter (a milestone gate).
- Repro: Re-run Braska and Mirror Aeons with the fixed route.
- Evidence: critic/rounds/round-29/combat/ffx-others.json; critic/rounds/round-29/evidence/index.json
- Confidence: medium
- Requirement: CHK-022
- Smallest fix: Fix the route (PR-0397), then run the three.
- Acceptance check: Three real-key wins recorded.

### PR-0483 (minor, harness): The phone touch route cannot aim an ally (UNVERIFIED, no product fault shown)

- Game, chapter: both; seymour-flux, ffx2-bahamut; 390x844
- Observed: The phone routes fell back to the keyboard 72 (Bahamut) and 59 (Seymour) times; nine tap timeouts on target:rikku; three Holy Water turns left the cursor on the enemy because "Yuna" could not be resolved; the Seymour phone route ended in defeat at turn 35, identical to round 28. Legibility figures were measured on a hidden node (PR-0519).
- Expected: Touch can target an ally.
- Repro: critic/rounds/round-29/evidence/*-phone-touch/run.json
- Evidence: critic/rounds/round-29/evidence/ffx2-bahamut-win-phone-touch/run.json; critic/rounds/round-29/evidence/seymour-flux-win-phone-touch/run.json
- Confidence: medium
- Requirement: CHK-010, CHK-015
- Smallest fix: Make the route tap ally chips with a visibility check; keep UNVERIFIED until a real phone is used.
- Acceptance check: A touch-only run heals an ally.

### PR-0512 (minor, harness): Critic tooling defects found this round (evidence integrity): the continuity harness reads the current tree's pose-measure table, a stale attract selector, a wrong "no post scene" note, and demo.mjs expects the old flow

- Game, chapter: both; critic tooling
- Observed: (1) continuity.mjs reads docs/target/pose-measure.json from the current tree unless --pose-measure-from names the tree under review: with the review tree's older table it reported 127 false head failures (run discarded, kept as seymour-flux-win-cont-WRONGPOSEMEASURE). (2) gap-attract and demo-attract look for .demo-attract, but with the booth screens on the idle card is [data-role=booth-attract]: their "attract never started in 100 to 196 s" is a harness miss, and the screenshots show the "Pick up the controller / Press any button" card up from about 60 s (I read fresh-36.jpg); a first-draft finding that the booth reel never starts is therefore withdrawn. The wake by a press from the card was not exercised. (3) The capture owner's notes that Anima and Ixion have no post-battle scene are wrong: the order is results, CONFIRM, then the scene (Anima 11 lines, Ixion 30). (4) demo.mjs expects the picker after a win; the booth now shows the thanks card, then the title. (5) route default budget of 15 minutes cut Chapter III.
- Expected: The harness reads the registry of the artifact under review and the selectors of the shipped UI (CHK-016).
- Repro: See cap logs.
- Evidence: critic/rounds/round-29/cap/gap-attract.mjs; critic/rounds/round-29/evidence/gap-attract/fresh-36.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont-WRONGPOSEMEASURE; critic/rounds/round-29/cap/lib2
- Confidence: high
- Requirement: CHK-016
- Smallest fix: Default --pose-measure-from to the build under review; query [data-role=booth-attract] as well; expect the scene after results CONFIRM; update demo.mjs; then re-run the wake test with a key, a click, a touch and a pad button.
- Acceptance check: selftest and a clean run with the stock lib.

### PR-0503 (minor, process): Prep and onboarding have no number again (tenth review): the prep tabs and the pause ACCESSIBILITY, CONTROLS and MUSIC tabs are never walked; the stagnation rule is tripped

- Game, chapter: both; party prep, pause tabs
- Observed: The route opens the CHAPTER tab of party prep (45 captures), then Auron says the other tabs are for later and the route starts the battle. STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE (FFX) and Dresspheres, Accessories, Items (FFX-2) have no frame; no value is changed and shown in the first menu; no phone prep frame. No frame of TEXT SIZE, REDUCE FLASHES, COLOUR VISION, the controls card or key remapping exists. The same ID has stayed open at the same severity across reviews, so RUBRIC section 8 requires a written method check before a third similar capture batch.
- Expected: A written prep and accessibility walk (RUBRIC prep and onboarding).
- Repro: Read run.json prepText, prepEsc.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-r1600/run.json
- Confidence: high
- Requirement: RUBRIC prep, onboarding; section 8 stagnation
- Smallest fix: Method change, not more chapter runs: one dedicated prep-and-accessibility walk route (Chapter I FFX and Chapter IV FFX-2, real keys at 1600x900 and 390x844, one frame per tab, one value change per game shown in the first menu).
- Acceptance check: One frame per tab, one changed value visible in the first menu per game, and a written accessibility walk.

### PR-0509 (minor, prep): Booth hold-Home reset keeps the previous visitor's settings: repaired in code at release 62 (commit 272e75190), not shown repaired in play

- Game, chapter: both (demo mode); demo reset
- Observed: The round 29 reset captures ran with untouched default settings, so settingsAfter equals the defaults and proves nothing; the pad reset ended in "Execution context destroyed" from the reload it triggered (expected). src/app/demo/demoReset.ts clearVisitorState leaves every setting at defaultSettings() (read).
- Expected: A reset returns every setting to default.
- Repro: Demo mode: set MASTER VOLUME 0, VISUAL STYLE CLASSIC, X-2 BATTLE ACTIVE, hold Home 1.5 s, read settings.
- Evidence: critic/rounds/round-29/evidence/demo-ffx-win/run.json; D:/pyrefly-release55/src/app/demo/demoReset.ts
- Confidence: medium
- Requirement: booth plan
- Smallest fix: Capture it as described, with the pad Back+Start chord too.
- Acceptance check: Settings read default after both reset routes.

### PR-0480 (minor, delivery): Run-wide max frame: Chapter I 321 to 381 ms (round 28: 305), Chapter IV improved to 125 to 136 ms (round 28: 351); 59.5 to 59.8 fps

- Game, chapter: both; seymour-flux, ffx2-bahamut
- Observed: Eleven continuity runs, 1600x900 headless GPU: Chapter I slow frames 47 to 96 of about 23,700 (0.2 to 0.4 percent) and the spike is present with the pro look off, so it is not the new look; Chapter IV slow frames 293 to 338 (1.3 to 1.5 percent; round 28 601 and 2.6 percent). The start-of-battle share was not separated.
- Expected: Stable frame times (RUBRIC delivery).
- Repro: Continuity probes in the cont2 folders.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/continuity.json; critic/rounds/round-29/evidence/seymour-flux-win-bis-pro-off/continuity/continuity.json; critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/continuity.json
- Confidence: medium
- Requirement: RUBRIC delivery
- Smallest fix: Split the first 5 s of the battle from steady play in the probe, then trace the spike.
- Acceptance check: Max frame under 250 ms after the first 2 s in Chapter I.

### PR-0527 (minor, delivery): UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 continuity runs (Chapter I, conference pack off)

- Game, chapter: FFX; seymour-flux, pack off
- Observed: seymour-flux-win-packoff: probe maxDtMs 129830.5, fps 55.7, the run took 19.25 min against 8.5 for its siblings, and a harness stall recovery fired after 165.6 s of no events at command:auron. The same flow re-run had a 381 ms maximum; no second occurrence in 54 runs. Host contention (several lanes ran) cannot be told from a page hang with this evidence.
- Expected: No multi-second freeze.
- Repro: Re-run the pack-off Chapter I continuity alone on an idle machine, 3 runs.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-packoff/continuity/continuity.json
- Confidence: low (cause UNVERIFIED)
- Requirement: RUBRIC delivery
- Smallest fix: Re-run alone; if it recurs, capture long tasks and visibility state.
- Acceptance check: 3 clean runs, or a traced cause.

### PR-0473 (minor, feel): A knock-out has no fall and a revive has no rise (carried, re-observed)

- Game, chapter: both; seymour-flux; KO and revive
- Observed: The KO strip shows a seated figure that does not change for 12 frames; Kimahri KO to idle is a see-through double (PR-0379).
- Expected: A KO has a visible fall (RUBRIC feel: action and reaction timing).
- Repro: Chapter I, Kimahri KO and revive, strips swap-003 and swap-007.
- Evidence: critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-003-kimahri-idle-ko.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-007-kimahri-ko-idle.jpg
- Confidence: medium
- Requirement: RUBRIC feel; carried PR-0473
- Smallest fix: A short fall and rise on KO and revive, with Bailey's yes (hard rule 10).
- Acceptance check: Strips show a fall over several frames.

### PR-0485 (polish, narrative): A question for Bailey (carried): Rikku's wide grin on the sorrowful "...Yunie." and Yuna's smiling wedge on the silent Chapter IV results

- Game, chapter: FFX-2 only; ffx2-bahamut; scene and results
- Observed: The writing bible (E6) lets Rikku be scared but not funny; the frames still show the grin and the wedge. Re-observed.
- Expected: Expression matches the beat (writing-bible E6).
- Repro: Chapter IV post-scene and results frames.
- Evidence: critic/rounds/round-29/evidence/ffx2-bahamut-win-r1600/
- Confidence: medium
- Requirement: RUBRIC narrative; writing-bible E6
- Smallest fix: Owner decision.
- Acceptance check: Owner verdict recorded.

### PR-0508 (polish, onboarding): Carried, re-observed: the VISUAL STYLE row is unexplained and the PRESENTATION row reads "THE ECHO - B" (PR-0508 and PR-0511)

- Game, chapter: both; pause OPTIONS
- Observed: Still unexplained in every pause capture; the press page says "five fights" for a nineteen-fight game.
- Expected: Settings say what they do.
- Repro: Pause, OPTIONS.
- Evidence: critic/rounds/round-29/evidence/ffx2-bahamut-win-phone-touch/14-pause-options.jpg
- Confidence: medium
- Requirement: CHK-007
- Smallest fix: One line of copy per row.
- Acceptance check: Rows explain themselves.

### PR-0526 (polish, interface): Small copy and fit points in the booth and phone surfaces

- Game, chapter: both; demo defeat card, picker, phone target card, press page
- Observed: The defeat card footer says "+ CHOOSE / A PICK / B PICKER" while the button is OTHER FIGHT; the picker says "Follow the NEXT tip to win" but the default menu chip never says NEXT; the phone target card's affinity chips show no effect and touch the "Tap another enemy" line; the press page says "five fights" and omits touch.
- Expected: Copy matches the controls.
- Repro: See the evidence.
- Evidence: critic/rounds/round-29/evidence/demo-ffx-lose/seymour-flux-lose/31-defeat-card-retry.png; critic/rounds/round-29/evidence/demo-ffx-win/seymour-flux-win/03-picker.png; critic/rounds/round-29/evidence/seymour-flux-win-phone-touch/16-target-single.jpg; critic/rounds/round-29/evidence/gap-press/press-desk.jpg
- Confidence: high
- Requirement: CHK-007
- Smallest fix: Match the footer to the button name; label the chip NEXT or reword; update the press copy.
- Acceptance check: Copy audit passes.

### PR-0528 (polish, visual): First-time fan polish breakers kept: one empty-stage frame as Bahamut fades in half see-through; damage numbers sit on the boss's face for 4 or more frames; the title-card Seymour is drawn see-through over the battle's Seymour during the card-to-battle fade; hit flashes white-wash Yuna and Tidus for 3 to 6 frames

- Game, chapter: both; ffx2-bahamut, seymour-flux
- Observed: All single instances from strips and sequences; I did not independently confirm them. Also noted by the fan and not kept: with ?pack=off the arena backdrop is a flat saturated blue (not what the default shows).
- Expected: Clean entrances and readable hits.
- Repro: ffx2-bahamut-win-cont2/seq-transition-into-battle f03 and f04; seymour-flux-win-cont2/seq-transition-into-battle f06.
- Evidence: critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/seq-transition-into-battle/f03.jpg; critic/rounds/round-29/evidence/seymour-flux-win-cont2/seq-transition-into-battle/f06.jpg
- Confidence: low to medium
- Requirement: RUBRIC visual, feel
- Smallest fix: Hold the boss frame until it is drawn; offset damage numbers.
- Acceptance check: Entrance frames show the boss whole.

### PR-0524 (polish, encounter): research/ffx2-bahamut.md sections 2.1 to 2.4 are stale against the engine and carry no superseded banner

- Game, chapter: FFX-2 only; ffx2-bahamut
- Observed: The doc says the loop repeats from Curse and gives Mega Flare as 614 to 1,165 (constant 24); the engine follows the game's own script and table (Curse once; power 14, row 0x409c; observed 185, 254 and 410). The code comments and research/re-ffx2-ai-bahamut-vegnagun.md say so. Not a player defect.
- Expected: A reader of the doc is pointed to the current rotation (hard rule 6: sourced numbers stay traceable).
- Repro: Compare research/ffx2-bahamut.md lines 249 to 282 and 384 to 440 with src/battle/ffx2/ai/bahamut.ts.
- Evidence: research/ffx2-bahamut.md; src/battle/ffx2/ai/bahamut.ts
- Confidence: high
- Requirement: AGENTS.md rule 6
- Smallest fix: Add a "superseded by re-ffx2-ai-bahamut-vegnagun.md sections 2 and B6" banner.
- Acceptance check: Banner present.

### PR-0525 (polish, encounter): Demo mode departs from the sourced Overdrive start gauges (owner decision 173c, demo only)

- Game, chapter: FFX only (demo mode); demo seymour-flux
- Observed: ?demo=1 sets every FFX party member to 50 percent; the chapter's build has Kimahri at 100, Tidus 40, Auron 50. Outside demo nothing changes; intended-line wins are 58 of 60 in demo against 60 of 60 outside. Recorded so the departure stays visible.
- Expected: Sourced values outside the booth (hard rule 6).
- Repro: Engine probe demoStartGauges.
- Evidence: critic/rounds/round-29/audit-combat/demoseeds-flux-cand.json
- Confidence: high
- Requirement: AGENTS.md rule 6; owner decision 173c
- Smallest fix: None; keep the note.
- Acceptance check: None.

## What stands between this build and acceptance

- Score: visual (8.3), feel (8.0), narrative (8.7) and interface (8.1) are under the 9.0 floor, encounter sits at 9.0, and audio, onboarding, prep and delivery have no verified number.
- Mandatory checks not PASS: CHK-001, CHK-003, CHK-011, CHK-023 and CHK-B1 (UNVERIFIED), CHK-008, CHK-026 and CHK-027 (FAIL).
- Open majors: PR-0380, PR-0459, PR-0379, PR-0517, PR-0513, PR-0481, PR-0148, PR-0099, PR-0295.
- Encounters without a real-key win: Yunalesca, Braska's Final Aeon, Mirror Aeons. Targets: two unverified and one waiting. Human judgments: none recorded.
- A deep review cannot accept a milestone; the exact-artifact check passed for this live build, so deployment is not the obstacle.

## What changed since round 28 (candidate 660c19bbd)

- Gains: Chapter I demo wins now play the victory cue (round 28 PR-0504 fixed); sixteen chapters now have a real-key win from the title (round 28: three); the demo defeat card and TRY AGAIN work in both fights (3 to 4 s back to a first menu); Chapter IV frame times improved (max frame 125 to 136 ms against 351, slow frames 1.3 to 1.5 percent against 2.6); the Bahamut and Seymour Flux re-cut reads as a clean cut-out; the Echo end card and the booth idle card are clean; the demo press reaches the picker and the battle screen faster (Chapter IV 0.15 s from 2.5 s).
- Losses: the conference pack's smear lane turned pose swaps into hard cuts (snaps per minute 0 to 4.67 and 7.51), CHK-026 now fails in Chapter I, the protected-art ledger no longer matches the shipped paintings, Chapter IV results are silent by design, and the synth fallback for UI sounds appeared in 29 of 54 runs (0 of 16 in round 28).
- Unchanged: combat engine, data, saves and story (byte-identical), the carried audio verdict gap, the three chapters with no win, and the stalled prep and onboarding walk.
- Corrected readings: a music-only owner number of 7/10 exists (2026-10-13), which rounds 27 and 28 missed; a first-draft finding that the booth idle card never starts is withdrawn (harness selector miss, PR-0512); the capture owner's "no post scene" notes for Anima and Ixion are wrong.

## Proposals (nothing here is built without Bailey's yes)

- Pose swaps for Monday (needs Bailey's yes): look at critic/rounds/round-29/evidence/seymour-flux-win-cont2/continuity/strips/swap-014-yuna-idle-hurt.jpg and critic/rounds/round-29/evidence/ffx2-bahamut-win-cont2/continuity/strips/swap-158-rikku-ready-attack.jpg and say whether the hard cut on the hit frame is the look. If not, run the booth with ?smear=off or give the swaps a two-frame blend; if yes, record it as a designed smear in CHK-027. (benefit: ends the standing FAIL on both chapters; cost: small; risk: smear off brings back the dissolves, PR-0379; source-game fit: both)
- A pre-Monday safety switch (needs Bailey's yes): if the booth must show no hard cut and no close-up head change, launch it with ?pack=off, which measured 0 snaps and 0 head failures, at the cost of the pack's look, camera and F1 HUD.
- Booth PC rehearsal (needs Bailey's yes to spend the time): one cold and one warm run of both demo fights at human pace on the booth machine with a frame log, to turn PR-0481 and PR-0520 from headless numbers into booth numbers.
- Art ledger (process, needs Bailey's word on approval): record the 89 replaced files as explicit revisions in approved-hashes.json, each with his quoted words, and ask whether he wants to see the repainted figures first.
- Ready-pose repaint (needs Bailey's yes, hard rule 10): lock the Rikku Dark Knight and Paine Warrior ready poses to their idle costumes and the floor line (PR-0517).
- Silent Chapter IV results (needs Bailey's ear): one listen to decide keep silence or play the pause cue (PR-0504).
- Prep and accessibility walk (method change, PR-0503): one dedicated route instead of a tenth chapter run.
