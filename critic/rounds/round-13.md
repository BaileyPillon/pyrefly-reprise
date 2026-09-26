# Critic round 13: deep review of live b975397b (release 18)

```text
Build / artifact / target version: main b975397b, bundle Dd1Fjf8_, artifact 1d4de5ed… (critic/artifacts/b975397b.json); targets.json 61e81202…; LIVE https://baileypillon.github.io/pyrefly-reprise/ since 2026-09-26T06:27:00.994Z, replacing 1a680e41 (release 17.1)
Review: deep (round 13; after the deploy, on the live build)
Deployment: PASS. The exact artifact is live (CHK-017 PASS twice), and the capture runs were clean (0 console errors, 0 responses >= 400).
Changed area: FAIL. Open majors remain in the changed area, three of them inside new features (PR-0201, FOC18-01, PR-0099). No regression against 1a680e41.
Ship: SHIP. The build is better than 1a680e41, with no critical and no regression. It discloses 33 majors (listed under "Ship verdict").
Milestone: not assessed
Quality: PROVISIONAL. Audio is UNVERIFIED (no owner listening verdict), and every other category is below 9.0. The last full score is none under policy v2.
Targets: 69 required / 59 matched / 5 failing / 5 unverified / 6 waiting on a decision
Top issues: PR-0148, PR-0198, PR-0208, PR-0199, PR-0200 (ranked list below)
Coverage: 13 listed chapters (11 through a real-key outcome), both games, 7 screen shapes. Chapter III win path and an FFX-2 multi-target state NOT tested (required).
Next required review and why: a short follow-up deep pass (Chapter III win on a pinned seed; one FFX-2 multi-target state). The deep obligation stays pending.
Elapsed review time / repeated work avoided: 250 min wall clock; focused captures and round-12 routing reused with dependency arguments
```

## Score (tools/critic-score.mjs, verbatim)

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
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-005 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-010 is FAIL
  - mandatory check CHK-010 is UNVERIFIED
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-005 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-014 is FAIL
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-003 is FAIL
  - 33 critical or major issue(s) remain open
  - encounter braskas-final-aeon has no complete real-input flow
  - encounter evrae-airship has no complete real-input flow
  - encounter ffx2-leblanc has no complete real-input flow
  - encounter seymour-anima-macalania has no complete real-input flow
  - 5 required target(s) failing
  - 5 required target(s) unverified
  - 6 required target(s) waiting
  - only 59 of 69 required targets matched
  - human judgment not recorded: Audio listening verdict on the shipped mix (CHK-B1); D-168 books the fifteen-minute session
  - human judgment not recorded: Pick between the FFX-2 engine fixes on branch ffx2-engine-fixes-0926 (IC-2 target wrap PR-0199, Acta Est Fabula targeting PR-0200, IC-1 PR-0209)
  - human judgment not recorded: FOC18-01: accept that under option A Shiva and Anima no longer separate the right and wrong lines, or pick another sourced option
  - human judgment not recorded: D-085: read the Chapter X Talk lines and callouts so the empty SPEAKS beat can be filled or removed (PR-0204)
  - human judgment not recorded: PR-0179: which sourced aeon preset the Gagazet, Chapter X and Chapter XIV parties use
  - human judgment not recorded: PR-0035: is the mirrored FFX-2 field an accepted adaptation?
  - human judgment not recorded: PR-0021: banter bank in or out of this milestone
  - human judgment not recorded: PR-0170: a command with one valid target fires without a target step (faithful or not?)
  - human judgment not recorded: PR-0058 / R13-VIS-05: should Shinra and the FFX Brother get speaker portraits (no art or tile exists)?
  - human judgment not recorded: FOC18-06: Chapter XIV's trimmed pause-card copy is an agent's inference
  - human judgment not recorded: Bailey play session on Chapter IX (CHK-B2)
report: valid evidence
```

The code decides the total and acceptance. The total is provisional because audio has no number, and it is never averaged away. For information only, the nine scored categories are listed below; they are not a score.

## Verdicts

- **deployment**: PASS: the exact artifact is live (CHK-017 PASS in the live review and again by the delivery auditor, 91 files byte-identical, artifactHash 1d4de5ed) and the capture owner's real-key runs were clean (0 console errors, 0 pageerrors, 0 responses >= 400, 0 HTML-typed media).
- **changedArea**: FAIL: the changed area carries open majors, three of them introduced with this release inside new features (PR-0201 phone framing in XI, FOC18-01 in XI, PR-0099 cue-map rows), and the plan checks CHK-003, CHK-005, CHK-006, CHK-008, CHK-009, CHK-010, CHK-011, CHK-012, CHK-014 and CHK-015 fail somewhere in scope. No regression against 1a680e41 was found.
- **milestone**: not assessed: a deep review cannot accept a milestone.
- **ship**: SHIP (the build is already live; this records that it is better than 1a680e41 and should stay).

### Ship verdict: SHIP

- No critical defect is open on b975397b: no crash, lock or lost progress in the first-wave routes and the gap pass (0 console errors, every outcome reached a destination, 10 of 10 reloads kept the clear). Chapter III was not won live, but the engine replay shows the encounter is winnable (39/40, and seed 1 wins with the advisor in 135 commands); the losses come from following an unlettered advisor target (PR-0208) and a Zombie-heal recommendation (PR-0198), both majors.
- No major is a regression against the replaced live build 1a680e41: every major is tagged regressionVsLive false except PR-0206, whose tags are unknown (no 1a680e41 measurement at 2000x1012), which does not hold a build at major.
- The majors this build introduced sit inside brand-new features (Chapter XI's phone framing PR-0201 and option A trade-off FOC18-01, and the missing cue-map rows PR-0099 for the newly listed chapters); they are disclosed and do not hold.
- The build is better than 1a680e41: Chapter V is winnable by real keys on the shipped default (3 wins, one on a pinned seed with a replayable key log), PR-0105 and PR-0129 are closed with live proof, the phone battle HUD and the phone board are repaired, and four new chapters are sourced and complete their real flows.

**Majors this release discloses** (none is a regression; each is carried into the next batch):

- PR-0148: no owner listening verdict on the mix that ships; Bailey's 2026-09-21 'too reminiscent of SNES music' is still unanswered and no cue was re-rendered
- PR-0198: the FFX advisor recommends HP-restoring items on a living Zombie ally; live in Chapter III it told a Zombie Yuna to drink an Elixir, which dealt 5,130 to her and KO'd her in 2 of 4 real-key losses
- PR-0208: the Chapter III advisor card names its target 'Yu Pagoda' with no A/B letter; following it Slows the wrong Pagoda from command 8 on, and a pinned seed-1 real-key run ended in the engine stalemate; Chapter III was won 0 of 5 times live on this build
- PR-0199: an FFX-2 all-target move whose target dies mid-move wraps its remaining hits onto a target already hit and skips a living one; confirmed live in every Chapter V log
- PR-0200: Acta Est Fabula also heals the Vegnagun Head for 9,999 on every cast (16/16, 18/18 and 22/22 casts in the three live Chapter V logs); the source says it targets both Redoubts only
- PR-0061: 6.4 to 14.4 s from the scene skip to the first usable command menu; the new XI and XIV run 10.3 to 10.8 s, and Chapter I took 14.4 s this round
- PR-0180: FFX battles never name an action, so Seymour Natus's party-wide hit and follow-up land unnamed, as Zanmato did in IX
- PR-0201: at 390x844 Chapter XI frames Yuna and Mindy out of the picture (Yuna cut or absent in 3 of 4 boss frames, Mindy half out; Anima near the edge at the link-3 first menu)
- PR-0181: an FFX summon leaves the party on the field, and in Ch X Bahamut is drawn at party scale, hidden behind Tidus and Yuna
- PR-0153: the FFX intent names one damage target for a random-target move and marks it SCRIPTED
- PR-0207: the phone enemy-intent strip hides the SCRIPTED / MOST LIKELY badge and the odds, so a 50% guess reads as certain (both games)
- PR-0206: at Chapter I 2000x1012 the advisor card is absent at the first decision while its chip still says 'N HIDE MOVES'
- PR-0123: the FFX-2 intent headline pairs the rolled move with the top branch's odds, and the guide contradicts both
- FOC-06: advisor chips render at 12.2 effective px in both games at 1600x900 and 2000x1012
- PR-0126: advisor directions still drop the 'in <menu>' chip on some desktop cards and on every phone tip
- PR-0001: the phone Victory and Defeat results are still a letterboxed desktop miniature
- PR-0179: the Gagazet preset's aeons ship an invented ~0.55x scaling, below the sourced battle-count floor
- FOC18-01: with option A's 3 s action time, Shiva and Anima no longer punish the credibly wrong line
- PR-0031: FFX target selection has no TARGET plate, no ground ring and no dim on non-targets
- PR-0035: the FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile
- PR-0095: Vegnagun's Bulwark and Redoubt rings and plates are still not visible at links 3 and 4
- PR-0094: at Ch V link 4 the Redoubt intent card sits on Vegnagun's head painting
- PR-0157: in FFX action shots, HUD cards sit over the party and the boss
- PR-0021: still no banter bank; Chapter I still ends on '...Okay. Next one.'
- PR-0099: THEMES.md's cue map has no row for Chapters VI, X, XI, XII, XIII or XIV, which all borrow other chapters' cues; four more chapters were listed on stand-ins in this release
- PR-0127: Chapter VI prep polaroid captions are still clipped by the card edge, now seen at 2000x1012; the phone half is repaired (D-071)
- PR-0144: Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the research
- PR-0018: The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)
- PR-0057: At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line
- PR-0063: The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters
- PR-0014: HUD portrait chips crop through heads; the monogram half is repaired
- PR-0128: Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks
- PR-0060: The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce

## The ten categories

| Category | Weight | Score | Status |
|---|---:|---:|---|
| combat | 20 | 8.7 | scored |
| encounter | 10 | 8.8 | scored |
| visual | 15 | 8.3 | scored |
| feel | 10 | 7.8 | scored |
| narrative | 10 | 8.1 | scored |
| audio | 10 | — | UNVERIFIED |
| interface | 10 | 7.2 | scored |
| onboarding | 5 | 7.1 | scored |
| prep | 5 | 8.5 | scored |
| delivery | 5 | 8.2 | scored |

### combat: 8.7

[combat-encounter auditor] BUILD b975397b (bundle Dd1Fjf8_, artifact 1d4de5ed..., live since 2026-09-26 06:27Z). No browser opened. All engine work ran on a git-archive copy of b975397b (src/tests byte-identical to the commit; deleted afterwards, its junctions unlinked first). Scratch and logs: D:/Final Fantasy/critic/rounds/round-13/combat-deep/ (bench sources in r13d/). UNIT SUITE at b975397b: 418 files passed, 7,773 tests; 11 files failed and tsc reported 26 errors, all because docs/concepts and docs/audio were left out of the review copy (ENOENT / unresolved import from docs/concepts/pause-until-dawn/**, docs/audio/THEMES.md, leblanc renders, macalania sheets). No combat or encounter file failed (vitest-full.log, tsc.log). Every combat file of the changed chapters passes: omnis-engine 18, omnis-counter 18, omnis-readout 20, natus-engine 14, natus-phases 12, natus-provoke 4, isaaru-engine 17, isaaru-duel 17, fallen-aeons-engine 19, fallen-aeons-ai 8, fallen-aeons-action-time 5, fallen-aeons-flow-chain 28, data-ffx-nul-targeting 8, plus the standing ffx-ctb / statuses / ffx2-chain / atb-golden / wait-split sets (230 combat-related files green). CHANGED DATA AUDITED against research/: (1) Seymour Omnis vs ffx-seymour-omnis.md §1-§4: HP 80,000 [4 sources; GameFAQs 60,000 outvoted, labelled O-1], MP 999, Str 20, Def 180 (100 after Dispel, 150 after Ultima), Mag 35, MDef 100, Agi 40, Luck 20, Eva/Acc 0, AP 24,000/36,000, Gil 12,000, Overkill 15,000, Zanmato level 4, the §1.3 immunity list and flags, Shining/Supreme Gem steal, Lv.3 Key Sphere drop; -ra DC 24, -ga DC 42, Ultima DC 64 type Other, Dispel all-party not reflectable; glow after 6 attacks (3 below 20,000); ladder 1 half / 2 immune / 3 absorb / 4 absorb + weak opposite; reset cycle Fire, Water, Ice, Thunder labelled O-11 estimate; Mortiphasm immune to damage, out of melee reach (Wakka, Valefor, Anima, Mindy), never a random pick. PASS. (2) Isaaru vs ffx-isaaru-bevelle.md §2: Isaaru 10 HP, no turn; Grothia 8,000 / 600 / 23 / 10 / 21 / 0 / 18, Pterya 12,000 / 1,000 / 20 / 10 / 18 / 10 / 21, Spathi 20,000 / 1,500 / 31 / 0 / 38 / 0 / 20, Overkill 2,550, 5,000 AP bonus labelled single source. PASS. (3) Natus AP 6,300 / 9,450 [3 sources]; chapter data only re-registered. PASS. (4) The Ifrit Fire Eater and Ixion Lightning Eater added to every FFX summoned aeon, sourced from ffx-seymour-flux.md l.856-858 (decompile + wiki). PASS. (5) Chapter XI: the Road's 3 s action time is a labelled estimate on a sourced rule [2 sources], FFX-2 only. PASS as a rule. LIVE RUNTIME (CHK-021/023), from the capture owner's live logs: the gauge hold after an action is 3.3-3.5 s at p10 on Chapter XI (1600x900 and 390x844) against 0.4-0.6 s on IV and V (action-time-live.json), so action time is live on the Road and absent elsewhere; the IV/V/VI benches at 0 ms reproduce round 12's medians exactly (100.5 / 360.2 / 125.6 s). Omnis live: glow, Dispel, Ultima, the disc reset and the below-20,000 callout all fire (seymour-omnis-win*/battle-log.json). Isaaru live: Spathi countdown, Shield against Mega Flare, the 5,000 AP bonus on results. CLOSED: PR-0105 (major). D-171 is built: an enemy hit closes the open top-level menu (bench 'menus invalidated' 12 -> 348 on ch4 at 1 s). FFX-2 IC ISSUES: IC-2 is CONFIRMED live (R13-C01: 23 all-target moves in the three live Chapter V runs skipped a living Redoubt and hit the Head twice; resolve.ts:116-122). IC-1's root is confirmed in code (resolve.ts:319 registers the chain before the immune check at :340) and reachable only on the enemy side in Chapter V (Rikku and Paine Attacks on the physically immune nodes, 13 events in the bench). The IC-1 chain lock of a lone girl is REFUTED for this build: there are 0 party-side immune chains in 8 live logs and in 480 bench chains (R13-C02). AGAINST: R13-C01 (major, pre-existing), PR-0179 (carried major, unchanged; its Bahamut row now also sits in the owner-approved Chapter X and XIV presets, 1,398 HP against the Isaaru research's P3 floor of 2,139), R13-C04 (information: D-171's premise was withdrawn by research §9.2 on 2026-09-26). Carried polish with unchanged code: PR-0145, PR-0106, PR-0107, PR-0108, PR-0069, PR-0054, PR-0053, PR-0124. GAIN VS ROUND 12 (8.6): one major closed with runtime evidence (PR-0105), and four newly listed chapters whose combat data is sourced and correctly labelled. One pre-existing major is newly identified (IC-2), and PR-0179 is still open. Net +0.1.

### encounter: 8.8

**Chief:** Kept at the auditor's 8.8. The gap pass established R13-E01's cause for the pinned seed 1 (the card's unlettered Pagoda, now PR-0208, scored under interface), and PR-0197 is downgraded because its seed premise was wrong; neither moves this category's balance.

[combat-encounter auditor] FRESH ENGINE BENCHES on b975397b, 40 seeds per arm (critic/rounds/round-13/combat-deep/). FFX, advisor top row (ffx-livelike.json): each arm was run two ways. 'bench' is the usual driver. 'livelike' uses the registry the running game builds (BattleScreenContent.loadFfxContent: abilities, items and MIX_RECIPES in the process-wide registry) and the options the FFX HUD passes (MoveAdvisor, {}). Both ran on seeds 1-40 and on 40 large seeds in the range runSeed.ts draws. Bench and livelike are identical in every row, and so are the runs with the chapter's mid-battle triggers (ffx-livelike-triggers.json). Results: BFA link 1 39/40 and 37/40; Yunalesca 37/40 and 36/40; Seymour Flux 22/40 and 15/40; Natus 36/40 and 38/40; Omnis 24/40 and 25/40; Isaaru 40/40 and 40/40. The capture owner's intended-line bench (critic/rounds/round-13/combat/bench-ffx.log) agrees: Flux 17/40, Yunalesca 39/40, BFA 39/40, Natus 37/40, Omnis 27/40, Isaaru 40/40, Evrae 40/40, Yojimbo 40/40. FFX-2, intended line, per modelled top-list decision time (bench-ffx2*.log). Chapter IV: 40/40 at every time. Chapter V: 39/40 at 0 ms, 37 at 250, 28 at 500, 14 at 1 s (round 12: 7), 0 at 2.5 s. Chapter VI: 40 / 38 / 33 / 17 / 0. Chapter XI: 34 / 34 / 33 / 25 / 9 of 40. Mashing loses 0/40 everywhere, so the credibly wrong habit is still punished. Under the whole-menu hold every chapter is flat at its 0 ms rate. REAL FLOW (capture owner, live, real keys, headless GPU): Chapter V won 2 of 3 attempts on the shipped default X-2 BATTLE WAIT: 36:30 over 255 commands without the scripted spherechange, and a RETRY win at 1600x900. That settles the deep obligation carried since fd0ae96 and CLOSES PR-0076. Also won live: Flux (first attempt), Yunalesca (on the RETRY), Bahamut, Natus (first attempt, 3:13), Isaaru (4:07, AP 5,000), Fallen Aeons (1600x900 and phone), Omnis (1 win in 4 attempts, which fits a 60 % advisor rate: P(0 or 1 of 4) is about 0.18). PR-0008 is settled by owner decision D-172: a fresh first seed, and Chapter I re-baselined, with the intended line on 1-40 unchanged at 17/40. AGAINST: R13-E01 (major): Braska's Final Aeon lost 4 of 4 live attempts although the engine wins 37-39/40 with the live wiring, live-range seeds and triggers. The cause is not established, and the win path is unverified on this build. FOC18-01 (disclosed major, Chapter XI option A): not re-measured by me. R13-E02 (polish): the advisor never aims a Mortiphasm, so 0 disc turns in 4 live Omnis attempts, although the tactic and guide teach disc turning. PR-0179's aeon fragility still removes sourced counterplay (cross-reference, scored in combat). EVIDENCE CAVEAT (R13-EV01): the capture labels every live run 'seed 1'. Since D-172 a run from real keys draws a fresh random seed unless __pyrefly.setSeed is called (src/app/runSeed.ts drawRunSeed; src/debug/api.ts:324/373 seed() returns the unpinned default 1). The live seeds are therefore unknown, and no live outcome can be replayed through the engine (bfa-replay.json: the first live event is BFA acting at tick 0, where seed 1 in the engine starts with Tidus). GAIN VS ROUND 12 (8.7): Chapter V won live on the default, Chapter I's first-attempt problem answered by Bailey's pick, and four new chapters that are fair and beatable. Against that, one chapter (III) was not won live in this round. Net +0.1.

### visual: 8.3

**Chief:** Kept at 8.3. Gap pass: R13-VIS-04 refuted (polish, no effect on the number); the deep rotation shapes, the speaker portraits, the hero plates, the Onboarding C2 coach line and the Evrae Orders widget pass, which fills coverage the auditor listed as a gap without changing the majors.

[visual-targets auditor] Deep round 13, LIVE main b975397b, bundle Dd1Fjf8_, artifact 1d4de5ed. I judged the capture owner's evidence only: PYREFLY_BROWSER=gpu, headless Chromium on ANGLE/RTX 5070 Ti, real keys, at 1600x900, 2000x1012 and 390x844. I opened no browser. I read 67 target-vs-build composites (critic/rounds/round-13/targets/*.jpg; the script is pairs.mjs) and 14 contact sheets and crops (critic/rounds/round-13/visual/*.jpg; the script is sheet.py).

PROTECTION: The approved list (184/184) and the judge-locked list (48/48) are byte-identical in the live artifact manifest. The manifest reports problems: []. The local copies also match (verify-approved: 232 ok, 0 mismatched, 0 missing; targets/hashcheck-live.json).

FOR:
(1) Chapter select v2 renders option C at 1600 and 390: the boss on its scene, the VICTORY sash plus ribbon with the time, the progress strip, VII COMING in number order, and the phone as one scrolling column.
(2) The phone battle HUD is now the approved option B compact rail in both games: CTB rail or boss bar on top, three chips, a thumb grid, a TIP line and GUIDE. This closes the layout half of the stalled PR-0001.
(3) The four newly listed chapters render their picks:
- Natus O-1 A, with the stone ring behind him;
- the Sisters O-1 A armoured trio at link 2, with Shiva and Anima clear of their intent cards;
- Omnis with his four painted discs;
- Isaaru's aeons on their own paintings, facing Yuna.
(4) Shuyin is now seen live at link 5, and the seam push onto him reads cleanly.
(5) Ch V link 2 keeps the approved top-edge Node markers.
(6) PR-0002 (Yuna clear of the stack), PR-0005 B (the cascade above the cut-in) and PR-0012 A (the FFX-2 help band) hold.
(7) Facing is correct in every captured chapter.

AGAINST:
- New major R13-VIS-01: on a phone, Ch XI clips Yuna and Mindy out of frame.
- Carried majors, seen again: PR-0181 (the Ch X Bahamut is drawn at party scale behind Tidus and Yuna, and Yuna stands in front of Valefor in Ch XIV), PR-0035 (the FFX-2 field is mirrored), PR-0031 (no TARGET plate, ground ring or dim in FFX targeting, Ch III and Ch X), PR-0095 and PR-0094 (the Bulwark and Redoubt rings are missing, and the link-4 intent card sits on the head), and PR-0157, now in Ch XII too.
- New polish:
  - R13-VIS-02: mid-battle line cards are drawn across the party.
  - R13-VIS-03: Valefor's canvas-edge cut.
  - R13-VIS-04: the Omnis plate shows blank on arrival.
- Carried polish seen again: PR-0176 and FOC18-02 (letter chips), PR-0183, PR-0186, PR-0135 and PR-0034.

COVERAGE GAP: There are no 4:3, 21:9, 1440p or 4K captures this round, and no CHAPTER-tab hero plates. Chapters VI, VIII and IX come only from the focused review's candidate captures, which have the same artifact hash.

GAIN VS ROUND 12 (8.2): one stalled major was closed with live proof (the phone HUD layout), and four chapters were added that look finished. Against that, one new major and one carried major widened to two more chapters. Anchor 7 is functional with conspicuous weaknesses; anchor 9 is polished with minor issues. The gain for this category is majors closed with live proof.

### feel: 7.8

**Chief:** Kept at 7.8. The gap pass removes one concern (the Chapter I opening depends on the seed, not on this build) and confirms the XII battle-start card; the carried majors stand.

[feel-narrative auditor] Deep round 13, LIVE main b975397b, bundle Dd1Fjf8_, artifact 1d4de5ed. I judged only the capture owner's evidence (PYREFLY_BROWSER=gpu, headless Chromium on ANGLE / RTX 5070 Ti, real keyboard, no black-canvas fallback) and opened no browser. I made contact sheets of all 81 timed sequences with the frame timestamps in index.jsonl, saved to critic/rounds/round-13/feel-narr/*.jpg (script sheet.py, stills by tile.py and stack.py). Pacing comes from 17 run.json files (steps, firstState.playback.lastEvents, playTimeMs).

FOR:
(1) Chapter V is now winnable with real keys on the shipped default X-2 BATTLE WAIT: 2 wins in 3 attempts at 2000x1012 and 1600x900. All four seams read the same way, a wide shot pushing to the new boss with the name caption by 0.8 to 1.1 s, held clean to 2.5 s (ffx2-vegnagun-shuyin-win-nochange__seq-seam-5.jpg).
(2) The four newly listed chapters open the house way. In X, XI and XIV the title card is at 0.04 s, the stage at 0.35 to 0.41 s, and the push to the boss plus the caption come by 1.2 to 1.6 s. The XI chain seams (Shiva to the Sisters to Anima) and the XIV aeon seams keep the same grammar (seq-seam-2/3 sheets).
(3) Skip and replay still respect the player. One Enter hold skips the scene in all 17 runs, and Esc over every pre-scene opens the pause. RETRY reaches prep 3.08 s after results and the battle 1.65 s later in II, III, IV, X, XI and XII, the same as round 12.
(4) PR-0104 is partly better. The next girl's cut-in now lands about 1.05 s after the confirm (round 12: 0.3 s), and her menu at 1.8 s (IV, XI).

AGAINST:
(a) PR-0061 (major, carried, STALLED): time to the first usable menu is II 6.35 to 7.73 s, III 7.73, IV 7.57 to 7.60, V 9.32 to 11.25, X 8.07, XI 10.4 to 10.8, XII 6.45, XIV 10.33. Chapter I took 14.37 s this round against 8.05 to 8.12 s in round 12 on the same seed 1. Its opening now plays Seymour's Lance of Atrophy, a 3,333 ms callout, and Mortiorchis's turn before Tidus acts. Why the seed-1 turn order changed is not established; that belongs to the combat auditor.
(b) PR-0180 (major, carried): FFX still never names an action. Natus's party-wide hit and his second strike land unnamed (seymour-natus-win__seq-action-playing.jpg).
(c) NEW R13-FN-01: Chapter X's Talk shows the 'Tidus, +10 Strength' and 'SPEAKS' plate for about 1.7 s, and nobody speaks.
(d) PR-0104 is seen again: the confirmed Shell never visibly resolves before Rikku's cut-in and menu.
(e) NEW R13-FN-02: the XI Sisters seam captions the link 'Sandy' alone.

NOT EVIDENCED: input-to-response latency (no latency run this round; the round-12 7.7 to 8.3 ms is history, not reused, because the presenter and input-adjacent files changed); Isaaru's party action (that sequence caught the pause screen, a harness Esc recovery, so it is excluded); the XII sending dance in motion; whether the XII battle-start card shows (capture requested).

Net: Chapter V's real-key win and consistent openings in four new chapters, against the same two carried majors and one worse Chapter I opening. Anchor 7 = functional with conspicuous weaknesses; held at 7.8.

### narrative: 8.1

**Chief:** Kept at 8.1. Gap scene walks: the pre scenes of X (26 lines), XI (9), XII (11), XIV (22) and VIII (32) all pass with plates and portraits; post scenes and the V coda remain unwalked.

[feel-narrative auditor] SOURCES. src/story/scripts at b975397b, read in full: seymour-natus.ts, seymour-omnis.ts, ffx-isaaru.ts and ffx2-fallen-aeons.ts, plus the braskas-final-aeon.ts and yojimbo-cavern.ts diffs since round 12's 5be4babe. They were read against research/ffx-seymour-natus-highbridge.md §8.2-8.3, ffx-seymour-omnis.md §8.2-8.3, ffx2-fallen-aeons.md §6.2 and writing-bible.md §1, §2.1-2.2 and §5.4. Remedy curing Stop in FFX-2 (Chapter XI callout) was checked against ffx2-combat-core.md §580: correct.

SEEN ON LIVE (real keys):
- The first four pre-scene lines of every chapter played.
- The first post lines of X ('We made camp under the trees...'), XI ('Rest now. All of you.' / 'Flowers? Down here?'), XII (Seymour 'So. This is how it ends for me.', Wakka 'Send him') and XIV (Isaaru 'Keep that for the road ahead.'), and V (Yuna 'She asked me to—', Shuyin 'You're not her.').
- The results quips: I '...Okay. Next one.', II 'May they rest.', V '...Let's go home.' and 'That one wasn't fun.', XIV '...I'm sorry, Isaaru.' Grim tier is silent in X and XII.
- The after-CONFIRM scenes of I, II, IV, V and XI (Leblanc 'Took you long enough, Gullwings.').
- AI and story triggers in the battle logs: XII all nine callout kinds, XI shiva-entrance, stop-lands-yuna and shiva-falls, I, II, IV and V as before.

FOR:
(1) Four new chapters follow their sourced beats in order, with original wording. X compresses research beats 1 to 3 into Tidus's past-tense narration, tells 4 to 6 as an interlude, and stages 7 to 9 in full: Kinoc dropped, Kimahri's 'Yuna goes. Kimahri stays.', the turn-back, then camp and the Calm Lands. XII hits beats 1, 3 and 5: he claims Sin, 'Your death is your father's life', and Wakka tells Yuna to send him. The sending is staged with Seymour present, the pay-off of four Seymour chapters. XIV plays the aeon contest. XI plays beats 1, 3, 5, 6 and 7: Shiva's surprise, dismay at the Sisters, 'Anima... forgive me', the Glen and Leblanc.
(2) Voices keep the bible. Kimahri speaks in the third person, Wakka says 'ya', Auron is terse ('Kinoc.', 'Hmph.'), Lulu is spare, and Seymour frames death as mercy. The FFX-2 banter is three beats with exactly one sincere exchange (the Shiva seam), and Paine's 'We don't hover.' ends one. CHK-021 holds: the FFX register is in X, XII and XIV; the FFX-2 register is in XI.
(3) Continuity is written across chapters. XIV's close ('The stairs came out on the bridge') hands to X's 'We found each other at the bridge'.
(4) Grim-tier quip suppression is applied correctly to X and XII. PR-0187's fix (Chapter III results card now silent) is in source.
(5) Every new chapter's aftermath is reachable with legal input.

AGAINST:
(a) PR-0021 (major, carried, STALLED): still no banter bank, and Chapter I still ends on '...Okay. Next one.'.
(b) NEW R13-FN-01: Chapter X's three Talk lines and its callouts are written but held back (D-085 read not recorded), so the Trigger Command plays an empty 'SPEAKS' beat. This is a question for Bailey, scored only for the empty on-screen beat.
(c) PR-0058 extends to XI: Shinra, Brother and Buddy speak with no portrait and no role plate, over the Farplane plate, while the script says they are on the comm.
(d) PR-0133: the V and XI aftermaths still stage the backdrop only, although XII and XIV now stage their bosses.

NOT READ ON SCREEN: every pre and post line after the first four; the XIV seam cries; XI links 2 and 3 callouts (the battle logs cover link 1 only); the new Chapter IX callouts; Chapter III's aftermath and PR-0187 live (no Chapter III win this round, 0 of 4); the V coda.

Net: four faithful, well-voiced chapters and a reachable aftermath for each, against unchanged carried debt. 8.1 against 7.9.

### audio: UNVERIFIED (no number)

**Chief:** UNVERIFIED with no number, as the rubric requires: no owner listening verdict on the shipped mix (PR-0148, CHK-B1). The gap pass adds a routing FAIL (PR-0214) and a one-in-four silent session (PR-0216), and closes Chapter XIII routing.

[audio auditor] No number is given, because none can be. I cannot hear and I listened to nothing. Every result here comes from reading data: ffmpeg-backed tools/audio/qa.mjs --strict and tools/audio/themes-audit.mjs, run fresh on the MP3s that ship; the capture owner's AudioManager samples (131 samples in 17 real-key live runs); network-summary.json; and code traces. docs/audio/OWNER-VERDICT.md has no new entry since round 12. Its newest entries are still the three 'accepted on recommendation, not by ear' records (D-039, D-048, D-063), and the only direction check on the mix is 'Right direction, keep refining' (2026-09-19), which is not a number. D-168 (2026-09-25) books Bailey's fifteen-minute listening session but does not settle CHK-B1. Under RUBRIC §6 and the task rule, the listening score must be the owner's recorded verdict, so the category stays UNVERIFIED: it is not averaged away and it is not zero. This is the sixth deep round in a row with no number (PR-0148, STALLED).

TECHNICAL HEALTH IS GOOD, AND THE AUDIO IS IDENTICAL TO ROUND 12. `git diff 5be4babe b975397b -- public/audio src/audio` is empty. The live artifact-manifest.json hash (1d4de5ed…) equals critic/artifacts/b975397b.json, and all 79 shipped audio files match it byte for byte. Every file decodes, audioUnverified=0 and problems=[]. The local public/audio matches too: the manifest.json differs only in CRLF line endings. All 25 music cues measure -15.97 to -16.20 LUFS integrated and -1.06 to -2.86 dBTP true peak, with 0 clipped samples, every loop seam ok and 0 cue findings. The 134-cue SFX sprite peaks at -1.13 dBTP with no silent slice. qa --strict still exits 1, only because the 52 audition-candidate files (34.2 MB) under audio/candidates ship and are not in the manifest (PR-0100).

ROUTING LIVE: I checked the cue at each sampled real moment against the chapter config and Bailey's decisions, in 9 chapters: I, II, III (links 1-2), IV, V, X, XI, XII and XIV. Every sampled cue was right. Chapter XI matches D-112 exactly: scene-farplane, then boss-ffx2-aeon on all three Road links, then victory-ffx2. The newly listed FFX chapters play their disclosed stand-ins: X plays scene-gagazet and boss-seymour-macalania (D-091); XII plays scene-dreams-end and boss-seymour (B18); XIV plays scene-gagazet and boss-yojimbo (D-186). Chapter IV's results screen is silent by design (writing-bible §5.4). Every defeat results screen is silent, and the cue map has no defeat cue. There were 0 console errors, 0 404s and 0 html-typed media. No sample showed a synth fallback. The 43 track entries I could read in the truncated samples were all 'prerendered'. The FFX-2 track entries fall past the harness's 4,000-character cut, so for those I rely on the 200 fetch plus the ffmpeg decode.

PR-0129 IS NOW CLOSED ON BOTH HALVES. Chapter V's Shuyin seam, in both live wins: boss-vegnagun at seam-5 and at +1.5 s; silence at +3 s, where the chain cue is null and Vegnagun's theme is fading out; boss-shuyin is the cue fading at the end of the fight; victory-ffx2 plays at results. So there was no false start before the scene's music('boss-shuyin'), and there is one owner (src/data/ffx2/enemies/shuyin.ts:95, src/story/scripts/ffx2-vegnagun-shuyin.ts:355/381).

STILL OPEN: PR-0099, now wider: THEMES.md has no cue-map row for chapters VI, X, XI, XII, XIII or XIV, and release 18 lists four more chapters on borrowed cues, so scene-gagazet now opens four listed FFX chapters. PR-0039: 3 of 25 cues still depart from the bible, and those three cues now bed more chapters. New polish item R13-AUD-01: the default SFX bus of 0.9 against a music bus of 0.7 breaks THEMES.md SFX rule 8.

NOT VERIFIED LIVE: the pause, title and chapter-select cues have no direct AudioManager sample, only fetch order and a code trace. Chapter XIII (Trema) routing has never been captured live. Chapter III links 3-7 and ending-ffx are reused from round 12 with a dependency argument.

Gain rule for the next round: this category gains only when a numeric owner verdict is recorded for the shipped mix. A technical fix alone (orphans, cue-map rows, tempo maps) does not count as a gain.

### interface: 7.2

**Chief:** Chief adjustment 7.3 -> 7.2: the gap pass found one more interface major that the auditor could not score, PR-0208 (the Chapter III card names 'Yu Pagoda' without its letter; following it Slows the wrong Pagoda and the pinned seed-1 run ended in a stalemate). Advice that cannot be followed as written is interface, where the rubric scores legal and useful advice. PR-0206's round-12 comparison is also weaker than first stated (PR-0202); it stays a major on its own observation.

[interface-onboarding auditor] Deep round 13, LIVE b975397b / bundle Dd1Fjf8_ / artifact 1d4de5ed. I opened no browser. Everything comes from the capture owner's evidence (critic/rounds/round-13/evidence/index.json, 637 items, PYREFLY_BROWSER=gpu headless Chromium, real keys, seed 1, sizes 1600x900, 2000x1012 and 390x844), plus source traces in the D:/Final Fantasy tree. The phone runs used the keyboard, not touch. No 1280, 4:3, 21:9, 1440p or 4K shape was captured, so the score is PROVISIONAL (see capturesNeeded).

REPAIRED OR IMPROVED since round 12 (5be4babe):
- PR-0001, battle half: the phone battle is now the compact rail (D-140 B). The advisor tip measures 15 px, and the party, commands, intent strip and boss plate all read at 390x844 (seymour-omnis-win-phone/11-advisor.png, ffx2-fallen-aeons-win-phone/11-advisor.png).
- PR-0067: the phone board shows both game groups in the first frame and uses TAP hints (ffx2-fallen-aeons-win-phone/03-card.png).
- PR-0165, half: VII COMING now sits in number order.
- Chapter select v2 works by arrow keys at 1600 and 2000, and keeps the clear after a reload (seymour-natus-win/34-board-after.png, 35-board-reload.png).
- PR-0018 looks repaired: the selected TALK row is dark ink on gold in Ch III and X (not contrast-measured).
- The FFX all-enemies target state passes: ALL ENEMIES chip, both enemies bracketed, CTB entries lit (target-all-seymour-natus-1600x900/01-all-enemies.png).
- The Omnis two-step card names both menus ('1 Wakka IN SWITCH, 2 Cheer IN SPECIAL').
- The FFX-2 intent separates the rolled move from its odds ('Kick MOST LIKELY 50%', with the odds rows).
- Pause works by Esc, the chip, H, tabs and OPTIONS in both games at all three sizes.

NEW MAJORS:
- R13-UI-01: in Ch III the advisor tells a Zombie Yuna to use an Elixir on herself. She was KO'd in 2 of 4 losses (traced to braskas-final-aeon.ts:1356-1358).
- R13-UI-02: at Ch I 2000x1012, first decision, the advisor card is absent while its chip says 'N HIDE MOVES'. Round 12 had the card at 552,69 in the same state.
- R13-UI-03: the phone intent strip hides the SCRIPTED / MOST LIKELY badge and the odds in both games (traced to phone-battle-parts.css:199-211).

CARRIED AND CONFIRMED OPEN: PR-0153 (Ch I Lance shown SCRIPTED on TIDUS, engine hit Yuna and Auron), PR-0123 (Ch V link 5 'No action MOST LIKELY 83%' above 'Attack 83%'), FOC-06 (advisor chips 12.2 px in both games at 1600 and 2000), PR-0126 (narrowed: 67 of about 2,032 desktop submenu picks lack the menu chip, and no phone tip shows one), PR-0001 results half. Polish: PR-0112, PR-0170 (widened), PR-0115, PR-0182.

NOT RE-TESTED: PR-0127 and PR-0144 (Ch VI not captured), Ch VIII's PR-0153, PR-0010, PR-0019, PR-0139, PR-0169 and PR-0189.

GAIN VERSUS ROUND 12 (7.3): the phone battle repair is the largest interface gain since round 08. Three new majors offset it, and two majors (PR-0153, FOC-06) are STALLED a third review, so the score holds at 7.3.

### onboarding: 7.1

[interface-onboarding auditor] The newcomer walkthrough was SIMULATED. It is a paper cold-start read of the real-key capture sequence (title > Auron's briefing > board > prep > pre-scene > first-menu coach), in both games at 1600x900, 2000x1012 and 390x844. No real newcomer, no touch input and no gamepad were involved.

GAINS:
- Auron's briefing now states both clocks plainly: 'In the FFX fights, nothing moves until you act... In the FFX-2 fights, the clock keeps running until you pick a command.' It reads 'Thirteen fights', which matches the board's 0 OF 13 (01-briefing.png at all three sizes).
- The phone board and phone prep speak touch ('TAP A CARD CHOOSE · TAP THE PLATE BEGIN', a START BATTLE button, MORE BELOW).
- The phone battle is now usable at 390x844, which removes the largest device-usability gap.
- The first-turn coach marks render in both games: Auron's 'He moves after you. Not before.' and Rikku's approved D-136 line with 'GAUGES RUNNING · A COMMAND HOLDS THEM'.
- Non-colour cues hold: status words, element words, 'COLOUR ORDER: OUR ESTIMATE', 'ZOMBIE 50%' and numeric HP and MP.
- REPLAY BRIEFING and RESTART ENCOUNTER sit in pause OPTIONS.

STILL OPEN:
- PR-0032: OPTIONS still has no text-size, key-remap or flash setting; the rows are unchanged (seymour-natus-win/14-pause-options.png).
- PR-0033: the Defeat card still never says why the party fell (seymour-omnis-win/31-results.png).
- PR-0073, narrowed: the phone briefing ('ENTER / ESC SKIP', 'D NEVER SHOW THIS AGAIN') and the phone pre-scene ('ENTER ADVANCE · HOLD ENTER SKIP · ESC MENU') still name only keys.
- Phone pause OPTIONS hides the FFX-2 X-2 BATTLE row below a fade; scored under interface as PR-0112.
- The phone results miniature is scored under interface as PR-0001.

NOT TESTED: gamepad, touch, a real phone, and reduce-motion. Gain versus round 12 (6.9): +0.2 for the briefing, the phone touch hints and phone battle usability. No accessibility setting was added.

### prep: 8.5

[prep-delivery auditor] Prep and delivery auditor, round 13 deep review of the LIVE site, main b975397b, bundle Dd1Fjf8_, artifactHash 1d4de5ed. I opened no browser and worked from the capture owner's critic/rounds/round-13/evidence (637 items, staleRootProblems [], every route in gpu mode). Points for: (1) The results screens show the sourced rewards on every newly listed chapter that was won live. X Natus shows AP 6,300 and GIL 3,500 (research/ffx-seymour-natus-highbridge.md lines 66-67, 3 sources). XII Omnis shows AP 24,000, GIL 12,000 and a Lv. 3 Key Sphere (ffx-seymour-omnis.md lines 67-68 and 93). XIV Isaaru shows 5,000 AP to Yuna, the GameFAQs figure (ffx-isaaru-bevelle.md I-1; results.ts victoryBonusAp is the only results change in 1a680e41..b975397b). II Yunalesca shows 14,000 AP and 9,000 gil, granted once at the end (ffx-yunalesca.md lines 89 and 94). The per-character AP rule holds: Natus Yuna +0 while Petrified/Ejected, Flux Auron +0 from the reserve. (2) RETRY is reliable and reseeds. 10 real defeats (III x2 runs, IV, V, X, XI, XII x2, II x2) each went RETRY, then party-prep, then a fresh battle (retryReachedBattle true). Code trace: BattleScreenFlow.ts:346 adds 1000 per attempt, and flow-checkpoint-retry.test.ts passes 15/15. Chapter XI's D-100 checkpoint (resume at the lost link) is reused from the focused pass on the byte-identical artifact. (3) Progress is reliable: 10 of 10 reload checks keep the clear, and the v2 board shows the ribbon with the best time and '1 OF 13 BEATEN' (seymour-natus-win/35-board-reload.png). (4) Chapter V's aftermath was reached live for the first time since round 11. That let the results screen be checked, and it confirms PR-0138. Points against: PR-0109 is STALLED at its 5th review and has widened (it absorbs FOC18-05). In 16 of 16 non-Chapter-I prep Esc-backs, and in 9 of 9 non-Chapter-I results returns, the board lands on Chapter I. Traced cause: registerFlowScreens.ts:42 builds ChapterSelectScreen with no options, and ChapterSelectScreen.ts:110 defaults initialIndex to 0. The board now has 14 cards, so getting back to XI takes about 11 presses. PR-0138 is confirmed live. After five battles, Chapter V's results read EXP 0 / AP 20 / GIL 0, which is Shuyin's row alone (ffx2-vegnagun-shuyin.md line 435). The newly listed XI shows only Anima's row (6,000 / 15 / 2,000 / Tetra Band) and drops Shiva (8,000 / 15 / 2,000) and the Sisters. PR-0174 (Rikku at S.LV 53 against a party at 18-25) was re-observed on the Chapter X prep (seymour-natus-win/04-prep.png). Prep agency (tabs, party, equipment) was not exercised this round. Round 12's judgment is reused, because PartyPrepScreen and PartyPrepContent are byte-identical between 5be4babe and b975397b. The Chapter V retry restarts all five links (36-39 min at the harness pace). That is canon: the research puts the point of no return before the chain (line 1127), so it is not a defect, and a checkpoint there would be a proposal only. Net: the sourced-reward story got wider and V's loop closed. But the stalled cursor defect, now more costly on a 14-card board, and the confirmed chain-spoils misreport on two FFX-2 chapters leave the score where it was (round 12: 8.5). The measure of gain for this category is PR-0109 or PR-0138 closing; neither did.

### delivery: 8.2

**Chief:** Kept at 8.2. The gap pass adds a real-key win in IX and XIII and measured entry latency (ready 0.37-0.42 s, hold-skip 1.2-1.6 s), and confirms the Chapter III win path is still unreached.

[prep-delivery auditor] Points for: (1) CHK-017 PASS, re-run by me. `node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/b975397b.json --changed-from critic/artifacts/1a680e41.json --sample 80` returned result PASS, liveManifest match, 91 files byte-identical (every changed file included: index.html, the Dd1Fjf8_ bundle and map, the new CSS, the Macalania pause plate png/webp/json), 0 mismatched, missing or wrong type, and artifactHash 1d4de5ed. Evidence: critic/rounds/round-13/delivery/verify-live-changed.json and verify-live.txt. (2) CHK-019 PASS. The manifest has decodeChecked true and problems [], with 486 png, 29 webp, 46 ogg and 31 mp3 all decoding 'ok'. Across 15 real-key routes and the probes, htmlImages is [] everywhere. (3) Runtime health: 0 console errors, 0 pageerrors, 0 responses >= 400 and 0 media typed as HTML, over 258 distinct live files in 15 routes (network-summary.json; lib.mjs listens for console, pageerror and response status). (4) CHK-022: the obligation carried since fd0ae96 is settled for Chapter V. It was won by real keys on the shipped default X-2 BATTLE WAIT in 2 of 3 attempts (36:30 at 2000x1012 with no scripted spherechange; 39:01 at 1600x900 after a link-4 loss and RETRY), then the post scene, results, CONFIRM scene, board and a reload that keeps the clear. Chapters I, II, IV, X, XI and XIV (and XII on the phone) also completed entry to outcome to results to board to reload by real keys, at 1600x900, 2000x1012 and 390x844. (5) Save/reload: 10 of 10 fresh-profile clears survive a reload. The persistence code (SaveData.ts, saveMerge.ts, saveFfx2Atb.ts) is byte-identical from 5be4babe to b975397b, and 172 of 172 save, migration, retry, results and chapter-select unit tests pass (critic/rounds/round-13/delivery/vitest-save-prep.txt, run at HEAD; those files are identical to b975397b). (6) Load: the board probe reached __pyreflyReady at 697 ms, for a cold navigation plus a warm reload with transfer 0, at 1600x900 on this machine's network with no throttling. Points against: Chapter III's win path was not reached on this build (0 of 4 real-key attempts, all lost in link 1). Its aftermath, CONFIRM and ribbon flow are UNVERIFIED on b975397b. The FFX CTB engine and presenter changed in 1a680e41..b975397b, so round 12's live win cannot be reused. Difficulty and advice belong to the encounter and interface auditors (R13-CAP-02). VI, VIII, IX and XIII reached their outcomes on this artifact only through the focused pass's labelled 1-HP hook: their destinations are proven, their real-key outcomes are not. No cold-cache time to painted title and no first-usable-menu latency were measured this round (PR-0061 is cross-referenced to feel, not re-scored), and no frame-time or spike data exists at all. The host was contended (up to five capture browsers at once). Only headless Chromium ran, with ANGLE on an RTX 5070 Ti. The phone routes were keyboard-only emulation. Firefox, Edge, Safari, a real phone, touch and a gamepad are UNVERIFIED. The CHK-024 upgrade matrix is still unrun (PR-0195, 5th review). New this round (R13-PD-01): the capture harness labels every run 'seed 1' from window.__pyrefly.seed(), which returns the debug variable. Since release 17, real-key runs draw a fresh seed (runSeed.ts, BattleScreenFlow.ts:306), so no live run's seed is actually known. Carried but not re-examined: PR-0173 (the artifact is now 1,071 files and 560 MB, and still ships audio/candidates), R15-02 (Chapter IX was not run), PR-0149 and PR-0158. Net: the exact-artifact and media checks are clean and fully proven, and the Chapter V gap from round 12 is closed. Up from 8.0 in round 12. It stays under 9.0 because of the unmeasured load, frame time and browser coverage, the Chapter III win path, and the CHK-024 matrix. Those unknowns are listed in capturesNeeded; they are not scored as defects.

## Approved-target gate

Required 69, matched 59, failing 5, unverified 5, waiting on a decision 6. required = matched + failing + unverified; waiting counted separately. The auditor counted 51/4/14 before the gap pass; the chief moved the eight tiles the gap pass matched from unverified to matched and the Ch IV hero plate from unverified to failing (carried). Excluded as in critic/rounds/round-13/targets/tally.json: rejected tiles, the audio tile, concept key art, the learning-site tiles, locked Chapter VII, undelivered polish tiles, and the superseded Title and Chapter select tiles.

- Matched by the gap pass: portrait Paine; portrait Young Auron; portrait Fayth boy; portrait Brother (FFX-2); hero plate ch1; all hero plates (13 chapters full-bleed, H hides the panels; Ch IV counted separately as failing); Onboarding C2 (first-use Auron line on screen before the confirm press, Ch I and III); Evrae order widget (option A: cost slab, Trigger tag, greyed CLOSE IN; FAR re-staging not flown).
- Failing: presentation/Battle HUD, FFX-2 (PR-0035); fight/Targeting s1 (PR-0031, PR-0178; Ch X ALL ENEMIES); fight/Targeting s2 (PR-0031; Ch III Yu Pagoda A); chapters/Vegnagun's parts (PR-0095, PR-0094); hero plate ch4 (a different painting from the approved tile; failing since round 04, carried).
- Still unverified: Swordplay Overdrive (PR-0128: Tidus's Overdrive never filled on the seed-1 route); Shiva (FFX summon): summoned live in I, II, III and XIV but no frame after her arrival; portrait Shuyin (the Chapter V post scene was not walked line by line); Yojimbo's look (reference file missing, PR-0196); Yojimbo hero plate (the pause plate shows, but no target-vs-build composite was made).
- Waiting: Five gap tiles plus the Yu Yevon portrait (no line speaks; owner decision owed, PR-0060).
- Protected art: Approved 184/184 and judge-locked 48/48 byte-identical in the live manifest and locally (verify-approved: 232 ok, 0 mismatched, 0 missing; critic/rounds/round-13/targets/hashcheck-live.json).
- Reused from the focused review: cast-goons, cast-yuna-gunner, chapters-evrae, chapters-leblanc, ch9-yojimbo-sheet, ch9-daigoro, ch9-ginnem, ch9-chamber, ch9-zanmato-gauge. critic/reviews/b975397b-focused captures are of the production candidate of b975397b, whose artifact hash 1d4de5ed equals the live artifact-manifest.json; same code, assets and GPU capture mode.

## Encounters (real flow on the live build)

| Chapter | Game | Real flow complete | Outcome |
|---|---|---|---|
| seymour-flux | ffx | yes | victory on the first attempt (2000x1012, seed 1, 52 commands) |
| yunalesca | ffx | yes | defeat then RETRY victory (2000x1012, seed 1); plus a deliberate loss route (1600x900) with RETRY reaching battle |
| braskas-final-aeon | ffx | no | defeat in 5 of 5 real-key attempts on b975397b (4 first-wave on unknown seeds, 1 gap-pass on pinned seed 1 ending in the engine stalemate after 334 commands and 25 min); RETRY reached battle after each first-wave loss |
| ffx2-bahamut | ffx2 | yes | victory (2000x1012, 50 commands); plus a loss (1600x900, flipped to ACTIVE with real keys) and RETRY reaching battle |
| ffx2-vegnagun-shuyin | ffx2 | yes | victory: 2 wins in 3 first-wave real-key attempts on the default Wait split (unknown seeds) plus a gap-pass win on the first attempt with the seed pinned to 1 (258 commands, 38:50) |
| seymour-natus | ffx | yes | victory on the first attempt (1600x900, 48 commands, 3:13); plus a loss route (2000x1012) with RETRY reaching battle |
| seymour-omnis | ffx | yes | victory only at 390x844 on RETRY (attempt 2); defeats in 2 of 2 at 2000x1012 and in attempt 1 at 390x844, all seed 1 |
| isaaru-via-purifico | ffx | yes | victory on the first attempt (1600x900, 44 commands, 3 links) |
| ffx2-fallen-aeons | ffx2 | yes | victory at 1600x900 (169 commands, 18:19) and at 390x844 (82 commands); loss route at 2000x1012 with RETRY reaching battle |
| yojimbo-cavern | ffx | yes | victory by Doom in 15 commands (1:46), pinned seed 1, 1600x900 |
| ffx2-trema | ffx2 | yes | victory in 326 commands (28:40), pinned seed 1, 1600x900 |
| evrae-airship | ffx | no | not played to an outcome by real keys this round |
| ffx2-leblanc | ffx2 | no | not captured this round |
| seymour-anima-macalania | ffx | no | not playable: the COMING card |

- **seymour-flux**: Full route from the title to the board and a reload that keeps the clear. Kimahri's OVERDRIVE row needed a second Enter again (rageSecondEnter=1, carried R12-01). Seed: first-wave run unpinned (label 'seed 1' is wrong, PR-0202). Gap pass: seymour-flux-win-seed1-post (pinned seeds 1, 1001, 2001) walked the post scene and epilogue (Fayth boy portrait).
- **yunalesca**: Attempt 1 lost after 197 commands. RETRY went to prep and then battle; attempt 2 won in 217 commands, followed by the post scene, results and the board. The FFX lose-and-retry was done here and in seymour-natus-lose. Gap pass: a pinned seed 186798638 run won in 173 commands.
- **braskas-final-aeon**: The loss, RETRY and prep path is verified. The win path was not reached on this build, although round 12 won it live on 5be4babe. The engine bench on the b975397b source is unchanged at 39/40 (seed 1 wins) for both the intended line and the advisor's top row (critic/rounds/round-13/combat/bench-ffx.log). In 2 of the 4 losses the advisor card told Yuna to use an Elixir on herself while she was Zombie, and she was KO'd (see R13-CAP-02). Gap pass: the first divergence from the engine's seed-1 advisor run is command 8, a Slow on the wrong Pagoda because the card names 'Yu Pagoda' without a letter (PR-0208); the stalemate returns straight to chapter select with no results or RETRY (PR-0215). The win path (post scene, silent results, epilogue, board ribbon, reload) is UNVERIFIED on this build.
- **ffx2-bahamut**: Spherechange through CHANGE by real keys; seq-spherechange frames saved.
- **ffx2-vegnagun-shuyin**: This settles the deep obligation carried since fd0ae96. Run 1 (NOCHANGE=1, 2000x1012): title, board, prep with Esc back, pre scene with Esc pause and hold-skip, then all five links (4 seams, each with a frame sequence and a first-menu capture). Won in 36:30 over 255 commands, then the post scene (Yuna/Shuyin lines), Victory results, the CONFIRM scene, the board, and a reload that keeps the clear. Options read 'X-2 BATTLE WAIT' (evidence/ffx2-vegnagun-shuyin-win-nochange/run.json pause.optionsText). Run 2 (1600x900, with the harness's scripted Paine spherechange): attempt 1 lost at link 4, RETRY reached prep and battle, attempt 2 won with 257 commands (77 min total). Music: boss-vegnagun on links 1-4, boss-shuyin on link 5, then victory-ffx2 (audio samples in run.json), so PR-0129's FFX-2 half holds live. The first-wave seed labels are wrong (PR-0202); the gap-pass run is the replayable one (gaps/ffx2-vegnagun-shuyin-win-seed1-waitsplit/).
- **seymour-natus**: Newly listed, FFX. Results: AP 6,300. Yuna got +0 AP because she was Petrified/Ejected at the end, which is correct under the sourced rule. The clear survives a reload (ribbon 3:13). The FFX ALL ENEMIES target state was captured here by real keys (target-all-seymour-natus-1600x900: Bahamut Impulse bracketing Natus and Mortibody).
- **seymour-omnis**: Newly listed, FFX. The harness followed the advisor card with at most 1 deviation per fight. Results: AP 24,000 and a Lv. 3 Key Sphere. Tidus got +0 AP because the advisor switched him out on his first turn, which is correct under the sourced rule. See R13-CAP-01. Chief: the seed premise of R13-CAP-01 is wrong (PR-0202); kept as polish PR-0197. Gap pass: disc turning works by real keys (omnis-discs-1600x900).
- **isaaru-via-purifico**: Newly listed, FFX. The pause tabs show Yuna only (aeon-only party). Results, the board and the reload all passed.
- **ffx2-fallen-aeons**: Newly listed, FFX-2. Shiva, the Magus Sisters and Anima were chained in one battle, with seams captured. Results: EXP 6,000 x3, AP 15 per dressphere, a Tetra Band. The phone framing loses Mindy and Anima at some moments (R13-CAP-04). Gap pass: three pinned seed-1 runs (win; loss in link 2; win on the retry) with per-link event logs.
- **yojimbo-cavern**: Gap pass: title, board, prep with Esc back, pre scene with hold-skip, fight, results, chapter select with the clear (gaps/yojimbo-cavern-win-seed1-callouts/run.json). Loss path not run this round.
- **ffx2-trema**: Gap pass: full real-key route, one seam, post scene, results (10,000 EXP, Dark Matter), chapter select (gaps/ffx2-trema-win-seed1-audio/run.json). Loss path not run this round.
- **evrae-airship**: Pre scene walked line by line and the Orders widget captured (gap pass). The focused review reached its destinations through a labelled 1-HP hook on the byte-identical candidate, which is not a real-key route. Round 12 won it live on 5be4babe; not reusable across the FFX engine and presenter changes.
- **ffx2-leblanc**: Only the focused review's labelled 1-HP-hook destinations on the byte-identical candidate, and the pause CHAPTER hero plate (gap pass).
- **seymour-anima-macalania**: Chapter VII is still LOCKED. The arrow walk on board v2 cannot select it (the route's findCard never lands on it), which is by design.

## Coverage matrix

**Tested**

- Identity: CHK-017 PASS twice (live review: 50 files; delivery auditor: 91 files incl. every changed file), live artifactHash 1d4de5ed = critic/artifacts/b975397b.json; 0 console errors, 0 pageerrors, 0 responses >= 400 over 258 distinct live files in the first wave; 184/184 approved and 48/48 judge-locked hashes.
- Real-key routes on LIVE from the title (gpu, 637 indexed first-wave captures, 0 stale roots): wins with aftermath, results, board and reload in I, II (after RETRY), IV, V (x2, default Wait), X, XI (1600 and 390), XII (390, on RETRY), XIV; defeats with RETRY into battle in II, III (x4), IV (Active), V, X, XI, XII (x3).
- Gap pass with pinned seeds: V win on the Wait split (seed 1, replayable key log); III seed 1 divergence vs the engine (command 8) and stalemate; IX and XIII full wins; XII disc turning by real keys; XI per-link event logs; XIV callouts; II seed 186798638 Zombie cards; I seed 1 / 1001 / 2001 opening order; entry latency on an idle host.
- Probes: FFX ALL ENEMIES (Ch X); Chapter XII target cursor on Omnis and discs; deep rotation shapes 1280x960, 2560x1080, 2560x1440, 3840x2160 in I, IV, X; phone 390x844 IV (touch emulation) and IX; pause CHAPTER hero plates for all 13 chapters with H; speaker portraits; first-use coach line; Ch VIII Orders widget; Ch X Talk mechanics; Ch XII battle-start card; board XII sequence; title, board and pause cues; Trema routing.
- Combat and encounter: unit suite at b975397b (418 files, 7,773 tests passed; 11 failures only from docs left out of the review copy, none in combat); data audit of every changed value (Omnis, Isaaru, Natus AP, Ifrit/Ixion Eater, Road action time) against research; 40-seed benches for FFX (bench and livelike, seeds 1-40 and 40 live-range seeds, with and without triggers) and FFX-2 (per decision time 0-2.5 s); IC-2 / Acta / IC-1 scans of every live Chapter V log.
- Audio: qa --strict and themes-audit on the shipped files, 131 live AudioManager samples plus the gap probes, network decode.
- Scene walks: pre scenes of VIII, X, XI, XII, XIV line by line; first post lines of V, X, XI, XII, XIV.

**Reused, with the reason**

- (prep-delivery) critic/reviews/b975397b-focused.json: destinations for VI, VIII, IX and XIII (outcome reached by a labelled HP hook, so their real-key outcomes stay UNVERIFIED), the Chapter XI checkpoint RETRY resuming at the Sisters link, the board taps and clicks, and the full vitest run (8012 passed) for CHK-018's unit part. Dependency argument: same commit b975397b, and the live bytes are identical to that candidate (CHK-017 PASS this round, 91 files including every changed file).
- (prep-delivery) critic/rounds/round-12.json prep agency judgment (prep tabs and panels). Dependency argument: src/app/screens/PartyPrepScreen.ts and PartyPrepContent.ts are byte-identical from 5be4babe to b975397b, and no related prep-agency defect is open.
- (audio) critic/rounds/round-12.json + round-12 evidence braskas-final-aeon-win (live 5be4babe): FFX Chapter III links 3-7 boss-yu-yevon continuity and ending-ffx. The dependency argument is in the CHK-023 record: audio files, BattleEncounterChain.ts, the Chapter III formations and the script's music steps are unchanged 5be4babe..b975397b.
- (audio) critic/rounds/round-12/evidence/evrae-airship-win/run.json (VIII: scene-fahrenheit, boss-evrae, victory-ffx): unchanged dependencies.
- (audio) critic/rounds/round-12/evidence/yojimbo-cavern-win/run.json (IX: scene-gagazet, boss-yojimbo, victory-ffx): only non-music script and comment changes since.
- (audio) critic/rounds/round-12/evidence/ffx2-leblanc-win/run.json (VI: scene-bevelle-underground, boss-ffx2-aeon, victory-ffx2): unchanged dependencies.
- (interface-onboarding) CHK-020's written FFX intent-default exception was read from source (src/ui/ffx/FFXBattleHud.ts:205-224), not reused from a report.
- (interface-onboarding) FOC18-03 (phone chapter select 12 px) is carried from critic/reviews/b975397b-focused.json without re-measurement; same build, board code unchanged since that review.
- (visual-targets) Nine target composites (Leblanc goons and backdrop, Yuna Gunner, Evrae backdrop, Yojimbo sheet, Daigoro, Ginnem, chamber, Zanmato gauge) use critic/reviews/b975397b-focused captures of the production candidate. Dependency argument: that candidate is b975397b and its artifact hash 1d4de5ed equals the live artifact-manifest.json (evidence/live), so the code, assets and settings are identical; the capture environment is the same (PYREFLY_BROWSER=gpu, headless Chromium); no open related defect touches these subjects' rendering. Labelled as reused in targets/tally.json.
- (visual-targets) Carried issue text and history for PR-0181, PR-0035, PR-0031, PR-0095, PR-0094, PR-0157, PR-0183, PR-0186, PR-0176, PR-0135, PR-0034 and PR-0196 from critic/rounds/round-12.json. Each was re-observed on live b975397b this round with new evidence; only the IDs and wording are reused.
- (visual-targets) Not re-verified this round and carried unchanged from round 12, with no reuse claimed: R13-04 (Ch VIII desktop menu), PR-0128, PR-0014 (the crop half), PR-0164, PR-0184, PR-0185, PR-0137 and PR-0121.

**Not tested**

- Chapter VI Leblanc (FFX-2) and VIII Evrae (FFX): no real-key outcome this round (not plan chapters).
- Loss paths of IX and XIII; Chapter IX gauge-50%, gauge-full and Zanmato-on-an-aeon callouts.
- Post scenes of X, XI, XII, XIV line by line; the V coda; the XII sending dance in motion; frames of the XI link-2 and link-3 beats.
- Swordplay Overdrive overlay (PR-0128); Shiva in battle after her arrival; Shuyin's speaker portrait; Bulwark / Redoubt target cursor (PR-0095).
- Frame time and spikes; cold-cache load to a painted title under throttling; Firefox, Edge, Safari; a real phone; a gamepad; touch on prep and results (platform gaps, no evidence path yet).
- The CHK-024 save and settings upgrade matrix (PR-0195).
- Audio listening (no agent can hear; owner verdict owed).
- Chapter VII (locked COMING card, by design).

**Required and not tested (these keep the deep obligation pending)**

- CHK-022 for plan chapter braskas-final-aeon (FFX, Chapter III): the victory path on b975397b (post scene, the silent results card with the PR-0187 fix, epilogue, CONFIRM, board ribbon, reload). Five real-key attempts lost in link 1, the last on a pinned seed 1 that followed the card's unlettered 'Yu Pagoda' onto the wrong Pagoda and ended in the engine stalemate (PR-0208, PR-0198, PR-0215). Round 12's live win on 5be4babe cannot be reused: the FFX CTB engine, presenter, DialogueBox and scene runner changed since.
- CHK-010 (plan check), FFX-2 half: one FFX-2 multi-target (all enemies or all allies) target state by real keys. The probe aborted on a White Mage with no Attack row; src/ui/ffx2 targeting and placement code changed 5be4babe..b975397b, so round 12's FFX-2 target captures cannot be reused.

Rule: Owed coverage = the systems, chapters and checks listed in critic/pending/b975397b.json (plan chapters I-V; CHK-002 to CHK-023 except CHK-018), plus the four newly listed chapters as part of the changed area. Platform and milestone gaps outside that plan are listed under notTested.

## Checks

| Check | Result | Mandatory | Scope | Recorded by |
|---|---|---|---|---|
| CHK-016 | PASS | yes |  | capture-owner |
| CHK-015 | FAIL | yes |  | capture-owner |
| CHK-010 | PASS | yes |  | capture-owner |
| CHK-017 | PASS | yes |  | capture-owner |
| CHK-023 | PASS | yes |  | capture-owner |
| CHK-017 | PASS | yes | live URL https://baileypillon.github.io/pyrefly-reprise/, main b975397b, bundle Dd1Fjf8_ | prep-delivery |
| CHK-019 | PASS | yes | all shipped media, both games | prep-delivery |
| CHK-018 | PASS | no | b975397b source + live network | prep-delivery |
| CHK-022 | PASS | yes | chapters I, II, IV, V, X, XI, XII, XIV: outcome to results to chapter select / RETRY to prep to battle | prep-delivery |
| CHK-022 | UNVERIFIED | yes | Chapter III Braska's Final Aeon, win path | prep-delivery |
| CHK-022 | PASS | no | real-key route from the title to victory, results and chapter select, pinned seed 1 (gap pass) | gap-capture |
| CHK-022 | UNVERIFIED | no | Chapters VI Leblanc (FFX-2) and VIII Evrae (FFX): real-key outcome | prep-delivery |
| CHK-015 | PASS | yes | prep, results, chapter select; keyboard; 1600x900, 2000x1012, 390x844 | prep-delivery |
| CHK-015 | UNVERIFIED | no | prep, results: gamepad and touch | prep-delivery |
| CHK-016 | PASS | yes | round-13 capture evidence, screen and state assertions | prep-delivery |
| CHK-016 | FAIL | yes | round-13 run.json seed and retrySeed fields, index.json seedNote | prep-delivery |
| CHK-024 | UNVERIFIED | no | save data and settings, returning player | prep-delivery |
| CHK-001 | FAIL | no | all shipped music cues and the SFX sprite, build b975397b (the local public/audio is byte-identical to the live artifact) | audio |
| CHK-001 | FAIL | no | theme usage of all 25 cues against the THEMES.md cue map | audio |
| CHK-001 | PASS | no | live routing at the sampled real moments (pre-battle scene, first battle menu, chain seams +0/+1.5/+3 s, after the fight, results) in chapte | audio |
| CHK-001 | FAIL | no | SFX-against-music bus balance at default settings (both games) | audio |
| CHK-B1 | UNVERIFIED | no | the owner's listening verdict on the shipped mix (both games) | audio |
| CHK-017 | PASS | yes | live audio artifact identity and decode | audio |
| CHK-019 | PASS | yes | silence and decode of every shipped cue and SFX slice | audio |
| CHK-023 | PASS | yes | FFX-2 Chapter V, the link-4 to link-5 seam (Vegnagun to Shuyin), default X-2 BATTLE WAIT, both live wins (2000x1012 NOCHANGE and 1600x900) | audio |
| CHK-023 | PASS | yes | FFX Chapter III chain music, links 3-7 (boss-yu-yevon) and ending-ffx | audio |
| CHK-023 | PASS | yes | FFX Chapters VIII (Evrae) and IX (Yojimbo), FFX-2 Chapter VI (Leblanc): live routing | audio |
| CHK-023 | PASS | yes | FFX-2 Chapter XIII (Trema), listed since release 16 (fc7f1a20) | audio |
| CHK-023 | FAIL | yes | the pause cue while the pause menu is open (battle and scene), the return to the interrupted cue, and the title and chapter-select cues (bot | audio |
| CHK-021 | PASS | yes | game-awareness of cue choice across the 13 listed chapters | audio |
| CHK-022 | PASS | yes | audio at the outcome: victory results, defeat results, post scene (both games) | audio |
| CHK-022 | PASS | yes | FFX Chapter I seymour-flux: title > board > prep > scene > battle win > post > results > CONFIRM scene > board > reload | feel-narrative |
| CHK-022 | PASS | yes | FFX Chapter II yunalesca: defeat > RETRY > prep > battle > win > post > results > epilogue (Yunalesca 'There. Now no one can summon it.') >  | feel-narrative |
| CHK-022 | UNVERIFIED | yes | FFX Chapter III braskas-final-aeon: win path, post scene, silent results card (PR-0187 fix) and epilogue | feel-narrative |
| CHK-022 | PASS | yes | FFX-2 Chapter IV ffx2-bahamut: win > post > results (silent) > CONFIRM scene (Rikku '...Yunie.') > board; loss under ACTIVE > RETRY > battle | feel-narrative |
| CHK-022 | PASS | yes | FFX-2 Chapter V ffx2-vegnagun-shuyin on the shipped default X-2 BATTLE WAIT: 5 links > post (Yuna/Shuyin) > results > CONFIRM scene > board  | feel-narrative |
| CHK-022 | PASS | yes | Newly listed X seymour-natus, XI ffx2-fallen-aeons, XII seymour-omnis, XIV isaaru-via-purifico: win > post > results > (epilogue where scrip | feel-narrative |
| CHK-015 | PASS | yes | both games, pre-battle cutscene: Esc opens the pause, one Enter hold skips; defeat results: Enter = RETRY | feel-narrative |
| CHK-021 | PASS | yes | story register per game in the four new chapters | feel-narrative |
| CHK-016 | PASS | yes | integrity of the feel/narrative inputs | feel-narrative |
| CHK-007 | PASS | yes | player-facing scene and results copy in X, XI, XII, XIV, V | feel-narrative |
| CHK-023 | PASS | yes | FFX Chapter X Talk (Trigger Command) through the presenter | feel-narrative |
| CHK-002 | FAIL | yes | pause over battle and over a scene, title, board, results; both games; 1600x900, 2000x1012, 390x844 | interface-onboarding |
| CHK-003 | FAIL | yes | first command menu after the coach, every captured chapter | interface-onboarding |
| CHK-004 | FAIL | yes | every harness decision that followed the advisor card with real keys | interface-onboarding |
| CHK-005 | FAIL | yes | Ch III Braska's Final Aeon, Yuna Zombie (Triumphant Grasp) and below the MP floor | interface-onboarding |
| CHK-006 | FAIL | yes | overlays after confirm, cancel, turn pass and battle end | interface-onboarding |
| CHK-007 | PASS | yes | advisor, intent, pause (all tabs' text), prep, pre and post scenes, results; 20 run records | interface-onboarding |
| CHK-008 | FAIL | yes | all captured battle states | interface-onboarding |
| CHK-009 | FAIL | yes | CTB list, command rows, pause OPTIONS; 1600, 2000, 390 | interface-onboarding |
| CHK-010 | FAIL | yes | FFX single target (Ch III Yu Pagoda A) and ALL ENEMIES (Ch X Bahamut Impulse) | interface-onboarding |
| CHK-010 | UNVERIFIED | yes | FFX-2 multi-target (all enemies / all allies) target state by real keys | interface-onboarding |
| CHK-015 | FAIL | yes | production bundle, real keys and mouse; command menu, target, scene, pause | interface-onboarding |
| CHK-020 | PASS | yes | pause, prep, advisor, intent, guide, board in both games | interface-onboarding |
| CHK-016 | PASS | yes | all captures used here | interface-onboarding |
| CHK-021 | PASS | yes | Every changed combat subsystem 1a680e41..b975397b: action time (FFX-2, Chapter XI Road links), Ifrit and Ixion Eater affinities (FFX, every  | combat-encounter |
| CHK-023 | PASS | yes | Normal runtime invokes the changed subsystems: the Road's action time, Omnis's glow, Dispel, Ultima, reset and 20,000-HP callout, Isaaru's S | combat-encounter |
| CHK-023 | PASS | yes | Omnis disc turns (affinity-change cause part-turn) and Chapter XI's sisters-first-down / anima-third-pain triggers on the live build | combat-encounter |
| CHK-005 | FAIL | yes | FFX Zombie board: the advisor's top row on a living Zombie (Yunalesca, Seymour Flux, BFA) | combat-encounter |
| CHK-022 | PASS | yes | Chapter V (FFX-2 Vegnagun and Shuyin), win on the shipped default Wait split, real keys, live | combat-encounter |
| CHK-022 | UNVERIFIED | yes | Chapter III (FFX Braska's Final Aeon), win path on b975397b | combat-encounter |
| CHK-022 | PASS | yes | Chapters I, II, IV, X, XI, XII and XIV: win through the real flow on the live build | combat-encounter |
| CHK-013 | PASS | yes | all captured chapters (I-V, X, XI, XII, XIV live; VI, VIII, IX from the focused candidate captures, same artifact) | visual-targets |
| CHK-011 | FAIL | yes | desktop 1600/2000 all captured chapters; phone Ch XI links 1-3, Ch XII, and Ch VI and VIII (focused) | visual-targets |
| CHK-008 | FAIL | yes | first menu, target, action and seam frames, 1600/2000 | visual-targets |
| CHK-012 | FAIL | yes | Ch X Bahamut turn, Ch XIV midfight, Ch X first menu, Ch V link 5 | visual-targets |
| CHK-014 | FAIL | yes | all captured chapters, first menu and action frames | visual-targets |
| CHK-016 | FAIL | yes | evidence validation | visual-targets |
| CHK-022 | PASS | yes | win on the shipped default Wait split, seed pinned to 1, no scripted spherechange: all seams, post scene, results, board | gap-capture |
| CHK-002 | PASS | yes | first menu and pause at 1280x960, 2560x1080, 2560x1440, 3840x2160 (deep rotation shapes) | gap-capture |
| CHK-003 | FAIL | yes | smallest effective text at the deep rotation shapes | gap-capture |
| CHK-011 | PASS | yes | 390x844 (touch emulation): first menu, target step, pause | gap-capture |
| CHK-013 | PASS | yes | speaker portrait lines at 1600x900: Paine, Brother (FFX-2), Young Auron, the Fayth boy | gap-capture |
| CHK-013 | PASS | yes | pause CHAPTER tab hero plates at 2000x1012, with and without H | gap-capture |
| CHK-015 | PASS | yes | first-use Auron coach line before the confirm press (tile Onboarding C2) | gap-capture |
| CHK-023 | PASS | yes | grothia-ready and pterya-called (link 1), spathi-called (link 2) | gap-capture |
| CHK-023 | PASS | no | Doom lands callout | gap-capture |
| CHK-015 | PASS | yes | Orders widget opened by real keys at 1600x900 and 2000x1012 | gap-capture |

The reason and evidence for each check are in round-13.json.

## Ranked issue list (145 open: 33 major, 103 polish, 9 suggestions; no critical)

Ranking: critical first, then major, then polish, then suggestions. Within a severity the order is Bailey's reported problems, then frequency, player impact, coverage and effort. Issues re-observed or new this round come before carried issues that were not re-tested. Full fields for every issue are in round-13.json. A carried, not re-tested issue keeps its round-12 text there.

### 1. PR-0148 [major] STALLED

**PR-0148 (carried, owner-reported, STALLED): no owner listening verdict on the mix that ships; Bailey's 2026-09-21 'too reminiscent of SNES music' is still unanswered and no cue was re-rendered**

Game both · chapter all chapters (the whole score) · category audio · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: OWNER-VERDICT.md is unchanged since 2026-09-24 and holds only 'accepted on recommendation, not by ear' entries plus the 2026-09-19 direction check. D-168 (2026-09-25) books a fifteen-minute listening session that has not happened. `git diff 5be4babe b975397b -- public/audio src/audio` is empty, so nothing Bailey criticised has changed. This is the sixth deep round with no number.
- Expected: A dated owner verdict, numeric or at least on the finished and wired mix, recorded verbatim in OWNER-VERDICT.md after the 'SNES' criticism was acted on (RUBRIC §6, CHK-B1).
- Repro: Read docs/audio/OWNER-VERDICT.md end to end: there is no numeric score and no verdict naming the shipped mix. Run `git diff --stat 5be4babe b975397b -- public/audio src/audio`: the output is empty.
- Evidence: D:/Final Fantasy/docs/audio/OWNER-VERDICT.md; D:/Final Fantasy/docs/target/decisions.json D-168; critic/rounds/round-12.json PR-0148
- Where: docs/audio/OWNER-VERDICT.md; public/audio/music/*
- Confidence: high
- Requirement: RUBRIC.md §6 (the audio listening score is the owner's recorded verdict); CHK-B1; AGENTS.md rule 13
- Smallest fix: Hold the booked D-168 session: the four named shipped cues plus the control/A/B/C direction clips from docs/audio/audition.html. Record Bailey's words verbatim, with a number if he gives one. Add the R13-AUD-01 bus-balance question and the owed stand-in cues from PR-0099 to the same session, so that one listen settles all three.
- Acceptance: OWNER-VERDICT.md has a dated entry naming the build or cue set that ships, in Bailey's own words. If he gives a number, the next deep round scores the audio category from it.
- Reported by: audio: PR-0148 (carried, owner-reported, STALLED): no owner listening verdict on the mix that ships; Bailey's 2026-09-21 'too reminiscent of SNES music' is still unanswered and no cue was re-rendered

### 2. PR-0198 [major]

**PR-0198 (new; R13-UI-01 = R13-CAP-02 = R13-C03): the FFX advisor recommends HP-restoring items on a living Zombie ally; live in Chapter III it told a Zombie Yuna to drink an Elixir, which dealt 5,130 to her and KO'd her in 2 of 4 real-key losses**

Game ffx · chapter III braskas-final-aeon (live, 2 of 4 losses); II yunalesca and I seymour-flux (engine, rare seeds) · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Yuna had Zombie (Triumphant Grasp, battle-log seq 1209, never removed) and was below the MP floor. The card named 'Elixir → Yuna, in Items'. The harness followed it, the Elixir dealt 5,130 to her, and she was KO'd (seq 2371-2375). The same happened in run r2 (turn 256, seq 2353). That is 2 of the 4 real-key losses this round; two other Elixirs, on a non-Zombie Yuna, healed normally.
- Expected: The card never offers an HP-restoring item to a Zombie actor. Under Zombie the refill uses Ether or Turbo Ether (MP only), or the card says to cure the Zombie first (CHK-005, RUBRIC §2: legal and useful advice that handles recovery).
- Repro: LIVE, fresh profile, seed 1, 1600x900. Chapter III, follow the advisor card with real keys until Braska's Final Aeon lands Triumphant Grasp (Zombie) on Yuna and her MP falls under two Curagas. The card names Elixir on Yuna.
- Evidence: critic/rounds/round-13/evidence/braskas-final-aeon-win/turn-log.json turn 244 and battle-log.json seq 1209, 2371-2375; critic/rounds/round-13/evidence/braskas-final-aeon-win-r2/turn-log.json turn 256 and battle-log.json seq 2353-2356
- Where: src/engine/tactics/braskas-final-aeon.ts:1356-1358 (supportTurn MP refill: row(commands, ['Turbo Ether','Ether','Elixir'], actorId) with no Zombie check)
- Confidence: high (engine event logs from two live runs)
- Requirement: CHK-005; RUBRIC §2 advisor legality and usefulness
- confirmation: Confirmed by the independent confirmer from both live logs (Zombie added seq 1209 / 1164, never removed; Elixir, +5130 damage, self-KO at seq 2375 / 2357). Correction adopted: the Phoenix Downs the card offered on her KO'd Zombie body did revive her (revive events 1516, 1568, 1803, 1822), so that half cost turns, not lives. Gap pass (Chapter II, pinned seed 186798638, 173 commands): the real HUD never named a Potion on a Zombie in 11 Zombie decisions; that exact engine state was not reproduced live, so the Yunalesca and Flux rows rest on the engine probe only.
- tagReason: src/engine/tactics/braskas-final-aeon.ts and the advisor core are byte-identical 1a680e41..b975397b (git diff --stat), so the defect was live before this build and is not a regression.
- openQuestion: Raised by the confirmer, unsourced either way: the engine keeps Zombie across 12 KO and revive cycles; research/ffx-combat-core.md does not say whether KO clears Zombie in FFX. Recorded as PR-0217; no change until sourced (AGENTS.md rule 6).
- Smallest fix: In supportTurn, skip Elixir (and any HP-restoring refill) while the actor has Zombie. Prefer Turbo Ether or Ether. If only Elixir is left, return the zombieCureReason line. Optionally let advisor-guard reject any item whose preview damages its own user.
- Acceptance: A unit board in Ch III with Yuna Zombie and MP under MP_FLOOR, and all of Elixir, Ether and Turbo Ether in stock: the top card names Ether or Turbo Ether, or a Holy Water / cure line, never Elixir. Over 20 guided seeds no advisor-named item KOs its own user.
- Reported by: interface-onboarding: R13-UI-01: Ch III advisor tells a Zombie Yuna to use an Elixir on herself, and she KOs herself | capture-owner: The advisor tells a Zombie Yuna to drink an Elixir, and it KOs her | combat-encounter: R13-C03 (engine repro of R13-CAP-02): the advisor's top row aims HP-restoring items at a living Zombie, which damages or kills them

### 3. PR-0208 [major]

**PR-0208 (new; R13G-01, absorbs R13-E01): the Chapter III advisor card names its target 'Yu Pagoda' with no A/B letter; following it Slows the wrong Pagoda from command 8 on, and a pinned seed-1 real-key run ended in the engine stalemate; Chapter III was won 0 of 5 times live on this build**

Game ffx · chapter III braskas-final-aeon, link 1 (BFA forms 1-2 with Yu Pagoda A and B) · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: The card reads 'Slow -> Yu Pagoda'. On the same board the advisor's top row is Slow on yu-pagoda-right. With no letter, the player (and the harness, which picks the first match) Slows yu-pagoda-left, the one already slowed. This repeats at every later Slow. The pinned seed-1 real-key route reached the engine stalemate after 334 commands and 25 min, while the pure advisor run on seed 1 wins in 135 commands.
- Expected: The card's target text tells the two Pagodas apart the way the CTB tile and the targeting name plate do ('Yu Pagoda A' / 'Yu Pagoda B'), so following the card reproduces the advisor's winning line.
- Repro: Live 1600x900, fresh profile, __pyrefly.setSeed(1) before the first key, real keys following the card. At engine turn 17 (Tidus) the card says 'Slow -> Yu Pagoda'. critic/rounds/round-13/cap/gaps/replay/bfa-advisor-div.test.ts lists every mismatch: cmd 8, 12, 15, 17, 21, 27, 34, 35.
- Evidence: critic/rounds/round-13/evidence/gaps/bfa-seed1-advisor-divergence.json; critic/rounds/round-13/evidence/gaps/braskas-final-aeon-win-seed1/turn-log.json (want.target 'Yu Pagoda'); critic/rounds/round-13/evidence/gaps/bfa-seed1-replay.json
- Where: src/engine/tactics/advisor.ts:1070 (targetName: scoped ?? target?.name) does not apply the duplicate-name letter that src/battle/ffx/turnQueue.ts letterTags (~line 250) gives the CTB tile and the name plate
- Confidence: high
- Requirement: interface (legal and useful advice, clear target sets); CHK-022 BFA win path
- causeStatus: Established for the pinned seed 1: the engine replay of the live command stream matches event for event through command 166, so the engine is faithful and the divergence is the input; the first divergent action is command 8 (engine turn 17, live seq 90), Slow on yu-pagoda-left where the advisor's top row on the identical board is Slow on yu-pagoda-right. The four earlier losses were on unknown seeds (PR-0202); two of them also carried PR-0198. At seed 1 the pure advisor run wins in 135 commands; the bench wins 37-39 of 40 with the live wiring.
- tagReason: The advisor card's target naming and src/engine/tactics/braskas-final-aeon.ts are unchanged 5be4babe..b975397b; round 12's live win on 5be4babe is consistent with a lucky target pick. Not introduced here and not a regression against 1a680e41.
- severityNote: Major, not critical: the encounter can be won (engine 39/40; the CTB list and the target name plate both show the A/B letters), but the taught line is unusable as written and the flow ends in a stalemate with no RETRY (PR-0215).
- Smallest fix: Build the advisor's targetName from the same letter-tag map (or pass the lettered display name) so the card reads 'Yu Pagoda B'. Games: FFX; the FFX-2 HUD letters its own rows, so check it separately.
- Acceptance: Live seed-1 real-key route: at engine turn 17 the card reads 'Slow -> Yu Pagoda B' (or A, matching its target id), the live command stream matches the advisor top row through command 166, and the chapter is won.
- Reported by: gap-capture: R13G-01: BFA advisor card names 'Yu Pagoda' with no A/B letter; following it Slows the wrong Pagoda and the fight stalemates | combat-encounter: R13-E01: BFA lost 4 of 4 live real-key attempts while the engine, with the live wiring and live-range seeds, wins 37-39 of 40; cause not established

### 4. PR-0199 [major]

**PR-0199 (new; IC-2 = R13-C01 = R13G-02): an FFX-2 all-target move whose target dies mid-move wraps its remaining hits onto a target already hit and skips a living one; confirmed live in every Chapter V log**

Game ffx2 · chapter V (Vegnagun and Shuyin), Head link; the engine path is shared by every FFX-2 chapter · category combat · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Live, real keys: Paine's and Rikku's Darkness (targets vegnagun-head, redoubt-r, redoubt-l) hit the Head twice and redoubt-r once. redoubt-r is KO'd mid-move and redoubt-l is never hit. This happened 23 times in the three live Chapter V runs (e.g. ffx2-vegnagun-shuyin-win-nochange/battle-log.json seq 2815 and 3775; ffx2-vegnagun-shuyin-win/a2-battle-log.json seq 1304). The benches found no enemy-side case in Chapters IV, V, VI or XI (0 in 480 chain runs).
- Expected: research/ffx2-combat-core.md §9.1 (per-target definition, verified: 3 sources): the target list is taken once at the start. Each living target takes its own hits. A target that dies is skipped and its hits are never redirected.
- Repro: Live Chapter V, Head link: with one Redoubt low enough that Darkness kills it, have Paine (Dark Knight) use Darkness. The live seed is unknown (R13-EV01); the event pattern repeats in every run. In code: resolve.ts targetForHit re-filters living targets per hit and returns living[hitIndex % living.length].
- Evidence: critic/rounds/round-13/evidence/ic-scan/ic-scan.json; critic/rounds/round-13/combat-deep/ic-rescan.json (23 live occurrences, all party-side); critic/rounds/round-13/combat-deep/probe-ffx2-bench.json (ic: wrapEnemyOnParty 0)
- Where: src/battle/ffx2/resolve.ts:116-122 (targetForHit) and :263 (the call with index t), at b975397b
- Confidence: high
- Requirement: combat correctness; AGENTS.md rule 6 (sourced mechanics)
- confirmation: Confirmed independently: 13 wrap candidates by the confirmer's narrower scan and 23 by the combat auditor's, over the three first-wave Chapter V logs; 4 more in the gap pass's pinned seed-1 Wait-split win (seq 1299-1329: Paine's Darkness hits the Head twice, redoubt-l never; the wrapped hit also extends the chain). Same defect, counted once.
- branchNote: Fix already built on branch ffx2-engine-fixes-0926 (awaiting Bailey's pick). Do not duplicate it.
- Smallest fix: Already on branch ffx2-engine-fixes-0926: snapshot the living targets at action start, give each its own ability.hits, skip (never redirect) a target that dies. Keep the per-strike roll for random-* moves.
- Acceptance: A seeded unit case where Darkness KOs redoubt-r on its first hit: redoubt-l takes exactly one hit, the Head exactly one. The ic-scan over new live Chapter V logs shows 0 wraps. Chapters IV and VI event logs stay byte-identical.
- Reported by: combat-encounter: R13-C01 (IC-2 confirmed live): an all-target move whose target dies mid-move wraps its remaining hits onto a target already hit and skips a living one | capture-owner: IC-2 confirmed live: an all-target move whose hit KOs a Redoubt moves its last hit onto the Head | gap-capture: R13G-02 (confirms IC-2): an FFX-2 all-target move wraps its remaining hits onto an enemy already hit after a KO mid-move

### 5. PR-0200 [major]

**PR-0200 (new): Acta Est Fabula also heals the Vegnagun Head for 9,999 on every cast (16/16, 18/18 and 22/22 casts in the three live Chapter V logs); the source says it targets both Redoubts only**

Game ffx2 · chapter V ffx2-vegnagun-shuyin, Head link · category combat/engine · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Every Acta Est Fabula cast in 3 live Chapter V logs (16, 18 and 22 casts) healed vegnagun-head -9,999 as well as both Redoubts. That is up to ~220,000 HP of unsourced healing per fight, and it is part of why the Head link is long.
- Expected: research/ffx2-vegnagun-shuyin.md §3.4: Acta targets both Redoubts only.
- Repro: Any Chapter V run that reaches the Head link. Grep the battle log for abilityName 'Acta Est Fabula'.
- Evidence: critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/battle-log.json; ffx2-vegnagun-shuyin-win/{battle-log.json,a2-battle-log.json}
- Where: Acta row targeting 'all-allies' (per the branch plan, section 3.3)
- Confidence: high
- Requirement: AGENTS.md rule 6
- confirmation: Confirmed by the confirmer on all three logs; research/ffx2-vegnagun-shuyin.md l.402 ('both Redoubts').
- branchNote: Fix (namedTargetsOnly) already on branch ffx2-engine-fixes-0926, awaiting Bailey's pick.
- Smallest fix: Already on branch ffx2-engine-fixes-0926 (namedTargetsOnly), awaiting Bailey's pick.
- Acceptance: A live log with 0 heal events on vegnagun-head from Acta.
- Reported by: capture-owner: Acta Est Fabula heals the Vegnagun Head for 9,999 on every cast (live)

### 6. PR-0061 [major] STALLED

**PR-0061 (carried, STALLED, fifth review at major): 6.4 to 14.4 s from the scene skip to the first usable command menu; the new XI and XIV run 10.3 to 10.8 s, and Chapter I took 14.4 s this round**

Game both · chapter all; worst this round seymour-flux (I) at 14.37 s, then ffx2-vegnagun-shuyin (V) 11.25, ffx2-fallen-aeons (XI) 10.77, isaaru-via-purifico (XIV) 10.33 · category feel · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: playTimeMs at the first awaitingMenu: I 14,366; II 6,350 and 7,733; III 7,733; IV 7,566 and 7,600; V 9,316 and 11,249; X 8,066 and 8,083; XI 10,400 to 10,766; XII 6,450; XIV 10,333. In Chapter I, seed 1 now opens with Seymour's Lance of Atrophy, a 3,333 ms callout and Mortiorchis's Full-Life before Tidus acts. In round 12 (5be4babe) Tidus acted first on the same seed in all five runs (8.05 to 8.12 s). Why the order changed is not established; it is cross-referenced to the combat auditor. XI and XIV spend 2.4 to 2.7 s on an opening enemy action plus callout (canonical: Grothia's full gauge, research §4.1)
- Expected: a first command within a few seconds of leaving the scene, with the establishing beat and any opening telegraph kept short
- Repro: real keys from the title to any chapter, hold Enter to skip the pre-scene, read window.__pyrefly.snapshotState().playTimeMs when playback.awaitingMenu first turns true; seed 1 (fresh profile)
- Evidence: critic/rounds/round-13/evidence/*/run.json firstState.playTimeMs and firstState.playback.lastEvents; critic/rounds/round-12/evidence/seymour-flux-win*/run.json
- Where: not traced (the time is card hold, camera push, sensor reads and any enemy opening with its callout)
- Confidence: high for the measurements; low for the cause of the Chapter I opening change (one run)
- Requirement: RUBRIC §6 feel: responsive input, no dead waiting; CHK-022
- gapPass: Gap latency run (host otherwise idle, gpu, unpinned seed): scene left to rows visible I 16.1 s, IV 8.2 s, X 8.5 s; ready at 0.37-0.42 s; hold-skip 1.2-1.6 s. With the seed truly pinned to 1, Tidus acts first in Chapter I, as in round 12; Flux opens on seed 1001. The long Chapter I opening therefore depends on the seed, not on this build (R13G-09), so regressionVsLive is false (the issue was open on 5be4babe, before live).
- Smallest fix: method check first (STALLED): shorten the establishing push and card hold, let sensor reads run under the push, and let an opening callout auto-advance under the enemy action instead of holding it
- Acceptance: median scene-skip to first menu at or under 6 s across I, II, IV, V, X, XI, XII and XIV at 1600x900, seed 1, measured alone on the host
- Reported by: feel-narrative: PR-0061 (carried, STALLED, fifth review at major): 6.4 to 14.4 s from the scene skip to the first usable command menu; the new XI and XIV run 10.3 to 10.8 s, and Chapter I took 14.4 s this round

### 7. PR-0180 [major] STALLED

**PR-0180 (carried): FFX battles never name an action, so Seymour Natus's party-wide hit and follow-up land unnamed, as Zanmato did in IX**

Game FFX (every FFX chapter; seen this round in X and XII) · chapter seymour-natus (X), seymour-omnis (XII), and all FFX chapters · category feel · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: seymour-natus-win seq-action-playing: 281, 258 and 303 land on the party from 0.04 to 0.74 s, the camera cuts to Natus, and a second hit of 1,099 and 1,101 lands at 1.9 to 2.1 s. No action name is shown at any point
- Expected: the enemy's action name is readable as it begins (FFX shows it top-centre)
- Repro: real keys to Chapter X, seed 1, let Natus act; frames every 230 ms
- Evidence: critic/rounds/round-13/feel-narr/ffx-actions.jpg
- Where: traced in round 12 (no action-name surface in the FFX HUD); not re-traced
- Confidence: high
- Requirement: RUBRIC §6 feel (readable effects); research FFX presentation
- Smallest fix: show the acting combatant's ability name in a top-centre FFX banner for enemy actions
- Acceptance: in X and XII the enemy's ability name is in the DOM and on screen within 200 ms of action-start
- Reported by: feel-narrative: PR-0180 (carried): FFX battles never name an action, so Seymour Natus's party-wide hit and follow-up land unnamed, as Zanmato did in IX

### 8. PR-0201 [major]

**PR-0201 (new; R13-VIS-01, absorbs the capture owner's phone-edge note): at 390x844 Chapter XI frames Yuna and Mindy out of the picture (Yuna cut or absent in 3 of 4 boss frames, Mindy half out; Anima near the edge at the link-3 first menu)**

Game FFX-2 only · chapter ffx2-fallen-aeons (XI), links 1-3 · category visual · introducedByCandidate true · regressionVsLive false · inNewFeature true

- Observed: Contact sheet of the four boss states: - Shiva: Yuna (White Mage) is half cut at the left edge. - Sisters, first menu: Yuna is absent, and Mindy is half out at the right edge. - Sisters, later: Yuna is fully in, and Mindy is absent. - Anima: Yuna is absent. In 11-advisor and 16-target-single, Yuna is cut through her body at x=0. The phone frames of Ch VI (focused) and Ch XII keep all three party members and the boss in frame.
- Expected: Every party member and every targetable enemy at least about 75% in frame at phone width (CHK-011), as the approved option B frames show.
- Repro: Fresh profile, 390x844 touch emulation, seed 1. Title, then chapter select, then XI, prep, START BATTLE, skip the scene. Look at the first menu of links 1 to 3.
- Evidence: critic/rounds/round-13/evidence/ffx2-fallen-aeons-win-phone/contact-phone-bosses.jpg; .../11-advisor.png; .../16-target-single.png
- Where: 390x844, battle first menu and target states
- Confidence: high (3 of 4 frames)
- Requirement: CHK-011 (party and enemy visibility); phone battle HUD tile D-140 option B keeps the field readable
- Smallest fix: Suspected, not traced: the phone camera framing (src/ui/common/phoneFraming.ts or the Road scene's phone rig) does not fit the Road's wide formation. Fit the framed extent to the party slots plus every enemy slot for this chapter, or tighten slot spacing at phone aspect.
- Acceptance: At 390x844, in links 1, 2 and 3 (first menu and target step), Yuna, Rikku, Paine and each targetable enemy (Shiva; Sandy, Cindy, Mindy; Anima) are at least 75% inside the viewport.
- Reported by: visual-targets: R13-VIS-01 (new): on a phone, Chapter XI frames Yuna and Mindy out of the picture | capture-owner: The phone camera loses bosses at the edge: Mindy clipped in link 2, Anima nearly off frame at the link-3 first menu

### 9. PR-0181 [major] STALLED

**PR-0181 (carried, widened to Ch X and Ch XIV): an FFX summon leaves the party on the field, and in Ch X Bahamut is drawn at party scale, hidden behind Tidus and Yuna**

Game FFX only · chapter seymour-natus (X), Bahamut's turn; isaaru-via-purifico (XIV) midfight · category visual · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: On Bahamut's turn in Ch X (Aeon menu IMPULSE, ALL ENEMIES): - Bahamut's dark wings are painted at party height behind Tidus and Yuna, and his body is mostly covered. - Tidus, Yuna and Kimahri stand in place. - The party rows stay on screen (dimmed). In Ch XIV, Yuna stands in front of the summoned Valefor.
- Expected: The aeon alone on the field, at aeon scale and clear of the party. This was already the requirement in round 12.
- Repro: Ch X from the title, seed 1: Tidus, Kimahri, Yuna Summon then Bahamut; open Aeon, then Impulse (critic/rounds/round-13/cap/allprobe.mjs).
- Evidence: critic/rounds/round-13/evidence/target-all-seymour-natus-1600x900/01-all-enemies.png; critic/rounds/round-13/visual/natus-bahamut-crop2.jpg; critic/rounds/round-13/evidence/isaaru-via-purifico-win/23-midfight.png
- Where: 1600x900
- Confidence: high
- Requirement: CHK-011 party/aeon rule; CHK-014 staging and scale
- Smallest fix: As in round 12: on an FFX summon, move the party off stage (or hide them) and stage the aeon at its own slot and scale, clear of the party quads.
- Acceptance: In Ch I, X and XIV, on the aeon's first menu, the aeon is at least 75% unoccluded, no party quad overlaps it, and the party rows are replaced by the aeon's.
- Reported by: visual-targets: PR-0181 (carried, widened to Ch X and Ch XIV): an FFX summon leaves the party on the field, and in Ch X Bahamut is drawn at party scale, hidden behind Tidus and Yuna | capture-owner: Carried PR-0181: with Bahamut summoned, the party stays on the field and the panel keeps the party rows

### 10. PR-0153 [major] STALLED

**PR-0153 (carried, STALLED third review): the FFX intent names one damage target for a random-target move and marks it SCRIPTED**

Game ffx · chapter seymour-flux (re-observed); VIII and IX not re-tested · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Ch I, seed 1, 2000x1012, first menu: 'Lance of Atrophy SCRIPTED ... DAMAGE TIDUS 707-799'. In the same run the next Lances hit YUNA (seq 115, 144, 268) and AURON (seq 214), never Tidus.
- Expected: A random-target move lists every candidate under a 'random target' label; SCRIPTED describes the move only.
- Repro: LIVE, fresh profile, seed 1, 2000x1012. Chapter I first menu, press E, read the intent. Play on and compare with battle-log lance-of-atrophy targets.
- Evidence: critic/rounds/round-13/evidence/seymour-flux-win/12-intent-E.png; seymour-flux-win/battle-log.json seq 3, 115, 144, 214, 268
- Where: not traced this round
- Confidence: high
- Requirement: RUBRIC §2 honest intent (certain vs conditional)
- Smallest fix: As round 12: for random or sampled targeting, estimate every candidate and render all rows under 'random target', with lethal flags.
- Acceptance: Ch I Lance lists all three members; Ch VIII lists Tidus, Wakka and Rikku; no random-target move shows a single named target over a logged run.
- Reported by: interface-onboarding: PR-0153 (carried, STALLED third review): the FFX intent names one damage target for a random-target move and marks it SCRIPTED

### 11. PR-0207 [major]

**PR-0207 (new; R13-UI-03): the phone enemy-intent strip hides the SCRIPTED / MOST LIKELY badge and the odds, so a 50% guess reads as certain (both games)**

Game both · chapter ffx2-fallen-aeons (observed); every chapter at 390x844 · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Ch XI Shiva, 390x844: 'SHIVA ACTS NEXT · Kick · PAINE 179-202' with no qualifier. The desktop card for the same fight reads 'Kick MOST LIKELY 50%', with ODDS Kick 50%, Heavenly Strike 25%, Blizzaga 25%.
- Expected: Honest intent that separates certain from conditional (RUBRIC §2). On phone the line keeps a short certainty token ('scripted', or 'likely 50%').
- Repro: LIVE, 390x844, fresh profile. Chapter XI, first command menu: read the red intent line under the rail.
- Evidence: critic/rounds/round-13/evidence/ffx2-fallen-aeons-win-phone/11-advisor.png; desktop comparison critic/rounds/round-13/evidence/ffx2-fallen-aeons-win/11-advisor.png
- Where: src/ui/common/phone-battle-parts.css:199-211 (display:none on .eint__conf and .eint__odds under html[data-phone-battle]); from 8bee6347, live since before 1a680e41
- Confidence: high (screenshot plus traced CSS rule)
- Requirement: RUBRIC §2 honest intent; CHK-004 scope (intent panel)
- Smallest fix: Stop hiding .eint__conf on phone: render it inline as a short token ('likely 50%' / 'scripted') after the move name, still inside the 3-line clamp. Keep .eint__odds hidden.
- Acceptance: At 390x844 in Ch XI (Shiva) and Ch V link 5 the phone intent line shows the certainty token matching the desktop badge, and no scripted/likely move renders without one.
- Reported by: interface-onboarding: R13-UI-03: the phone enemy-intent strip drops the SCRIPTED / MOST LIKELY badge and the odds, so a 50% guess reads as certain (both games)

### 12. PR-0206 [major]

**PR-0206 (new; R13-UI-02): at Chapter I 2000x1012 the advisor card is absent at the first decision while its chip still says 'N HIDE MOVES'**

Game ffx · chapter seymour-flux · category interface · introducedByCandidate unknown · regressionVsLive unknown · inNewFeature false

- Observed: The first menu, 11-advisor.png and 12-intent-E.png show no card. The only trace is an 'N HIDE MOVES' chip at about (1010,928) under the party. measureCardVsRows returned card=null and focAfterCoach found no visible .mad__card, while the card text exists in the DOM ('Next best move Tidus Hastega...'). Pressing N would 'hide' a card the player cannot see.
- Expected: As on 5be4babe in round 12 (card at 552,69, 316x254 in the same state): the NEXT BEST MOVE card is visible at the first menu, and the chip's words match the card's state.
- Repro: LIVE, fresh profile, 2000x1012, seed 1. Title, board, Chapter I, prep, skip the scene, dismiss the coach: at the first command menu (Tidus) no advisor card is shown.
- Evidence: critic/rounds/round-13/evidence/seymour-flux-win/11-advisor.png, 12-intent-E.png, run.json (cardFirst.card null, focAfterCoach.advisorMinEffPx null); compare critic/rounds/round-12/evidence/seymour-flux-win/run.json cardFirst
- Where: src/ui/ffx/FFXBattleHud.ts placeAdvisor, no-zone branch (about lines 1067-1098: card.hidden = true, the chip stays). Why advisorZone declines here is not established.
- Confidence: medium-high (one run this round, deterministic seed; the round-12 comparison is the same state)
- Requirement: RUBRIC §2 advisor capability; CHK-006 (a chip must not outlive or misdescribe its card); CHK-015
- chiefNote: The round-12 comparison is weaker than stated: the first-wave run was not on seed 1 (PR-0202), so 'the same state' is not established. The FFXBattleHud change 1a680e41..b975397b only adds Chapter XII readout selectors, which exist only when the Omnis readout is wired (BattleScreenWiring.ts:133), so the suspected obstacle cause is unlikely; cause unknown. Tags stay unknown (a major with unknown tags does not hold a build).
- Smallest fix: Find which obstacle took the only zone at Ch I 2000x1012 (log the solver's rejected rects for this decision). Suspects include the new chapter-panel obstacles in FFXBattleHud.ts:1239-1240; hidden elements must yield no rect. When no zone exists, dock the card compact in the guide rail instead of hiding it, or at least relabel the chip 'N SHOW MOVES' and add a no-room note.
- Acceptance: Ch I, seed 1, at 1600x900 and 2000x1012: the first-menu .mad__card is visible with a non-zero rect and intersects no party face. N hides it and N shows it, and the chip text matches each time. ui-ffx-hud-safe-zones gains a 2000x1012 case.
- Reported by: interface-onboarding: R13-UI-02: at Chapter I 2000x1012 the advisor card is missing at the first decision while its chip says 'N HIDE MOVES'

### 13. PR-0123 [major] STALLED

**PR-0123 (carried): the FFX-2 intent headline pairs the rolled move with the top branch's odds, and the guide contradicts both**

Game ffx2 · chapter ffx2-vegnagun-shuyin link 5 · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Link 5, first menu, 2000x1012: 'No action MOST LIKELY 83%' above ODDS 'Attack 83%, no action 17%'. The guide beside it reads 'WATCH Terror of Zanarkand THIS TURN, SHUYIN'.
- Expected: The headline percentage is the named move's own ODDS row.
- Repro: LIVE, 2000x1012, seed 1, default X-2 BATTLE WAIT. Chapter V to link 5 (Shuyin), first command menu.
- Evidence: critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/24-seam-5-first-menu.png
- Where: not traced
- Confidence: high
- Requirement: RUBRIC §2 honest intent
- Smallest fix: Take the headline percentage from the branch named by moveName, or name the top branch; make the guide's WATCH line read from the same forecast.
- Acceptance: At the Ch V link-5 first menu the headline % equals that move's ODDS row, and the guide's WATCH line does not name a different move for this turn.
- Reported by: interface-onboarding: PR-0123 (carried): the FFX-2 intent headline pairs the rolled move with the top branch's odds, and the guide contradicts both | capture-owner: The intent headline says 'No action MOST LIKELY 83%' over an Odds table giving Attack 83%, no action 17%

### 14. FOC-06 [major] STALLED

**FOC-06 (carried, STALLED): advisor chips render at 12.2 effective px in both games at 1600x900 and 2000x1012**

Game both · chapter all captured (X, XIV, II, XII, III, XI, IV, V) · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: focAfterCoach: 'Guide's pick', 'in White Magic', '10 MP', 'always hits' and '+ Shell' are 12.2 px. That holds in Ch XI at 1600 and in Ch IV, V and II at 2000 (FFX-2 and FFX alike), and in Ch X and XIV at 1600. 'Next best move' is 12.2-12.93. The hidden-panel pause hint 'H SHOW PANELS · ESC RESUME' also looks under the floor (not measured).
- Expected: Every leaf a player must read is at least 14 effective px (CHK-003).
- Repro: LIVE, seed 1, any chapter, first menu after the coach, at 1600x900 or 2000x1012: measure .mad__card leaves with the transform-aware walk.
- Evidence: critic/rounds/round-13/evidence/{ffx2-fallen-aeons-win,ffx2-bahamut-win,ffx2-vegnagun-shuyin-win-nochange,yunalesca-win,isaaru-via-purifico-win,seymour-omnis-win}/run.json focAfterCoach
- Where: not traced this round
- Confidence: high
- Requirement: CHK-003
- Smallest fix: Floor the card's chip tokens at max(14px, token*scale) and let the card reflow.
- Acceptance: advisorMinEffPx >= 14 at 1600x900 and 2000x1012 in every chapter of both games; a rotation sweep of the battle HUD and pause finds no leaf under 14 px.
- Reported by: interface-onboarding: FOC-06 (carried, STALLED): advisor chips render at 12.2 effective px in both games at 1600x900 and 2000x1012

### 15. PR-0126 [major] STALLED

**PR-0126 (carried, narrowed): advisor directions still drop the 'in <menu>' chip on some desktop cards and on every phone tip**

Game both · chapter I, III, V, XI, XII (desktop); XI, XII (phone) · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Desktop: 67 of about 2,032 followed submenu picks carried no menu. Examples: Ch I Fire Gem x5; Ch III Phoenix Down x7; Ch V Black Sky, Darkness, Mega-Potion, Megalixir; Ch XI Darkness x5, Pray x6, Cura, X-Potion; Ch XII Al Bhed Potion, Curaga. Phone: the tip line shows only the move, as in 'TIP Wakka' (a Switch) and 'TIP Darkness → all enemies'.
- Expected: Every card that names a submenu row says which menu it lives in, on every device.
- Repro: LIVE, seed 1. Follow the advisor in Ch XI at 1600x900 and read the card on turns naming Pray or Darkness; at 390x844 read the TIP line in Ch XI and XII.
- Evidence: critic/rounds/round-13/evidence/*/turn-log.json (want.menu null); seymour-omnis-win-phone/11-advisor.png; ffx2-fallen-aeons-win-phone/11-advisor.png
- Where: round 12 traced MoveAdvisor.ts:590/600; not re-traced
- Confidence: high
- Requirement: CHK-004 (say where)
- Smallest fix: Keep the menu chip on the label line in every density rung, and on the phone tip ('TIP Darkness · Skill'); drop the reason text first.
- Acceptance: Every run.json pick for a submenu row at 390x844, 1600x900 and 2000x1012 carries a non-null want.menu, and the phone tip screenshot shows the menu word.
- Reported by: interface-onboarding: PR-0126 (carried, narrowed): advisor directions still drop the 'in <menu>' chip on some desktop cards and on every phone tip | gap-capture: R13G-08 (carried PR-0126 family): the advisor card drops its 'in <menu>' chip for Kimahri's Mighty Guard

### 16. PR-0001 [major] STALLED

**PR-0001 (carried, narrowed to results): the phone Victory and Defeat results are still a letterboxed desktop miniature**

Game both · chapter XII (Defeat), XI (Victory) observed · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: The battle half is repaired: the compact rail, min 15 px. The results card still occupies about 390x220 in mid-screen. Labels, party rows and the RETRY / CHAPTER SELECT buttons are a few px tall.
- Expected: At 390x844 the results read at 14 px or more and RETRY / CONFIRM are thumb-size.
- Repro: LIVE, 390x844, lose Chapter XII or win Chapter XI.
- Evidence: critic/rounds/round-13/evidence/seymour-omnis-win-phone/31-results.png; ffx2-fallen-aeons-win-phone/31-results.png
- Where: not traced
- Confidence: high
- Requirement: CHK-002, CHK-003; RUBRIC §2 platform goals (phone)
- Smallest fix: Give the results screen a phone layout: show Bailey options first (rule 9), then build the pick.
- Acceptance: At 390x844 the results leaf-text sweep returns no node under 14 px, and a RETRY tap reaches prep.
- Reported by: interface-onboarding: PR-0001 (carried, narrowed to results): the phone Victory and Defeat results are still a letterboxed desktop miniature

### 17. PR-0179 [major] STALLED

**PR-0179 (carried, unchanged): the Gagazet preset's aeons ship an invented ~0.55x scaling, below the sourced battle-count floor**

Game ffx · chapter IX (Yojimbo), I (Flux) through the Gagazet preset; inherited by the owner-approved presets of X (Natus) and XIV (Isaaru) · category combat · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: gagazet.ts aeon rows unchanged at b975397b (Valefor 738, Ifrit 988, Ixion 983, Shiva 878, Bahamut 1,398 HP). highbridge.ts takes Bahamut from this preset and via-purifico.ts inherits it, so Chapter XIV's aeon duel fields a 1,398-HP Bahamut against research/ffx-isaaru-bevelle.md §5.1 P3 'the weakest the aeons can be' 2,139.
- Expected: research/ffx-combat-core.md §6.4.3, Mt. Gagazet block; ffx-isaaru-bevelle.md §5.1 P3 floor.
- Repro: Read src/data/ffx/builds/gagazet.ts:427-433; highbridge.ts aeons(); via-purifico.ts aeons().
- Evidence: critic/rounds/round-13/combat/bench-ffx.log (the 643 probe row); critic/rounds/round-12.json PR-0179
- Where: src/data/ffx/builds/gagazet.ts:427-433
- Confidence: high
- Requirement: AGENTS.md rule 6; combat correctness
- Smallest fix: Put the sourced §6.4.3 rows (or a measured choice among sourced presets) to Bailey once, then re-measure Chapters I, IX, X and XIV.
- Acceptance: Aeon rows equal a sourced preset, and the bench is re-measured for every chapter that inherits them.
- Reported by: combat-encounter: PR-0179 (carried, unchanged): the Gagazet preset's aeons ship an invented ~0.55x scaling, below the sourced battle-count floor

### 18. FOC18-01 [major]

**FOC18-01 (carried from the focused review, disclosed): with option A's 3 s action time, Shiva and Anima no longer punish the credibly wrong line**

Game ffx2 · chapter XI (Fallen Aeons), Shiva and Anima links · category encounter · introducedByCandidate true · regressionVsLive false · inNewFeature true

- Observed: The builders measured 40/40 for the wrong line as for the right one on Shiva and Anima; only the Sisters still separate the lines. Not re-measured in this deep review.
- Expected: A credibly wrong line loses more often than the intended line (RUBRIC §5).
- Repro: tests/unit/chapters/fallen-aeons-ship-bench.test.ts wrong-line arms, option A on
- Evidence: critic/reviews/b975397b-focused.json FOC18-01; commit 474ad54e
- Where: src/data/ffx2/enemies/fallen-aeons-road.ts ROAD_ACTION_TIME_SECONDS = 3 (traced)
- Confidence: medium (builders' measurement, not re-run here)
- Requirement: encounter: intended versus wrong tactics
- Smallest fix: Bailey's call among sourced options. No boss number tuned.
- Acceptance: The wrong line wins measurably less than the right line on at least two of the three links at human pace.
- Reported by: combat-encounter: FOC18-01 (carried from the focused review, disclosed): with option A's 3 s action time, Shiva and Anima no longer punish the credibly wrong line

### 19. PR-0031 [major] STALLED

**PR-0031 (carried): FFX target selection has no TARGET plate, no ground ring and no dim on non-targets**

Game FFX only · chapter braskas-final-aeon (III) single target; seymour-natus (X) ALL ENEMIES; seymour-flux (I) · category visual-target · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: Ch III, Attack on Yu Pagoda A: brackets, a pointing hand and a small name plate. There is no top TARGET plate, no ring under the Pagoda, and BFA and Pagoda B are not dimmed. Ch X, ALL ENEMIES: only an 'ALL ENEMIES' chip beside IMPULSE and brackets on Mortibody. There is no TARGET plate naming both enemies and no ground rings.
- Expected: Tiles s1 and s2 (docs/concepts/targeting/b-ring-and-dim).
- Repro: Ch III from the title, seed 1: first menu, Attack, default target. Ch X: Bahamut, Aeon, Impulse.
- Evidence: critic/rounds/round-13/targets/fight-targeting-s2-ch3.jpg; critic/rounds/round-13/targets/fight-targeting-s1-all-enemies.jpg
- Where: src/ui/ffx/TargetCursor.ts, targetCursorParts.ts, not traced
- Confidence: high
- Requirement: CHK-010; tiles Targeting s1 and s2
- Smallest fix: Bring the FFX target step to the approved B look: a top TARGET plate with the target set, a ground ring under each target, and a quiet dim on non-targets (PR-0178 covers the plate).
- Acceptance: Composites of s1 and s2 in Ch III at 1600 and 2560 show the plate, the rings and the dim.
- Reported by: visual-targets: PR-0031 (carried): FFX target selection has no TARGET plate, no ground ring and no dim on non-targets

### 20. PR-0035 [major] STALLED

**PR-0035 (carried): the FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile**

Game FFX-2 only · chapter ffx2-bahamut (IV), ffx2-vegnagun-shuyin (V), ffx2-fallen-aeons (XI) · category visual-target · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: The party stands centre-left and the boss centre-right, with the command window on the right. The approved tile has the boss on the left and the party on the right.
- Expected: docs/screenshots/mockups/A-ffx2-battle.jpg composition
- Repro: Any FFX-2 chapter, first menu, seed 1.
- Evidence: critic/rounds/round-13/targets/presentation-battle-hud-ffx2.jpg; scenes-ch4-bevelle.jpg; scenes-ch5-farplane.jpg
- Confidence: high
- Requirement: RUBRIC section 7 approved-target gate
- Smallest fix: Unchanged: mirror the FFX-2 stage and HUD to the tile, or get Bailey to re-approve the current mirrored layout.
- Acceptance: A target-vs-build composite in Ch IV at 1600 shows Bahamut left and the party right.
- Reported by: visual-targets: PR-0035 (carried): the FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile

### 21. PR-0095 [major] STALLED

**PR-0095 (carried): Vegnagun's Bulwark and Redoubt rings and plates are still not visible at links 3 and 4**

Game FFX-2 only · chapter ffx2-vegnagun-shuyin (V), links 3 and 4 · category visual-target · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: The link-3 first menu shows no ring or plate on either painted foreleg, although the RIGHT and LEFT BULWARK bars are listed. The link-4 first menu shows no ring on either tusk.
- Expected: Option C rings on the body's painted forelegs and tusks (docs/concepts/chapters/vegnagun/parts/options.jpg).
- Repro: Ch V, NOCHANGE=1, 2000x1012, seed 1; win links 1 and 2 by real keys.
- Evidence: critic/rounds/round-13/visual/st-ch-veg.jpg; critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/20-link-3.png, 20-link-4.png
- Where: src/scenes/farplane-parts.ts, src/scenes/farplane.ts (reverted in 5be4babe)
- Confidence: high
- Requirement: tile Vegnagun's parts; CHK-011 always-on marker
- gapPass: Target cursor on a Bulwark / Redoubt (links 3 and 4) was requested in the gap pass and not captured.
- Smallest fix: Draw the approved C* rings and name plates at the Bulwark and Redoubt anchors, above the command window.
- Acceptance: Link 3 and 4 first menus at 1600 and 2000 show a ring and a plate on each part, unoccluded.
- Reported by: visual-targets: PR-0095 (carried): Vegnagun's Bulwark and Redoubt rings and plates are still not visible at links 3 and 4

### 22. PR-0094 [major] STALLED

**PR-0094 (carried): at Ch V link 4 the Redoubt intent card sits on Vegnagun's head painting**

Game FFX-2 only · chapter ffx2-vegnagun-shuyin (V), link 4 · category visual · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: The 'RIGHT REDOUBT / No action' card is drawn over the upper-middle of the head painting.
- Expected: Intent card clear of the boss painting (CHK-008).
- Repro: As PR-0095, at the link-4 first menu, 2000x1012.
- Evidence: critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/20-link-4.png
- Where: first menu after the seam into link 3, 1600x900
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Place the intent card in the free right column above the command window at link 4, as in links 2 and 3.
- Acceptance: The link-4 intent card box does not intersect the head quad at 1600 or 2000.
- Reported by: visual-targets: PR-0094 (carried): at Ch V link 4 the Redoubt intent card sits on Vegnagun's head painting

### 23. PR-0157 [major] STALLED

**PR-0157 (carried, widened to Ch XII): in FFX action shots, HUD cards sit over the party and the boss**

Game FFX only · chapter seymour-omnis (XII) midfight; seymour-flux (I) · category visual · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: In the Ch XII close shot at 1600, the ENEMY INTENT card covers the right half of Yuna's skirt, and the turn-order chips sit over Omnis's lower-right discs.
- Expected: No HUD panel over a face, a weapon or the acting boss (CHK-008).
- Repro: Ch XII from the title, seed 1: play three commands; mid-fight close shot.
- Evidence: critic/rounds/round-13/evidence/seymour-omnis-win/23-midfight.png; critic/rounds/round-13/visual/actions.jpg
- Where: src/ui/ffx/SensorPanel.ts / action camera rig, not traced
- Confidence: medium (one frame)
- Requirement: CHK-008
- chiefNote: R13G-06 (Chapter XII target step: the Enemy Intent panel covers the targeted lower-right Mortiphasm, the Sensor card the lower-left one) is the same root, HUD panels that do not avoid projected actor quads, so it is folded in here rather than counted twice.
- Smallest fix: During FFX action cameras, fade or shift the intent card and the turn column away from the projected actor quads.
- Acceptance: In Ch I and XII action sequences, no HUD box intersects a party quad's upper two thirds or the acting boss quad.
- Reported by: visual-targets: PR-0157 (carried, widened to Ch XII): in FFX action shots, HUD cards sit over the party and the boss | gap-capture: R13G-06: in Chapter XII the Enemy Intent panel covers the targeted lower-right Mortiphasm, and the Sensor card covers the lower-left one

### 24. PR-0021 [major] STALLED

**PR-0021 (carried, STALLED): still no banter bank; Chapter I still ends on '...Okay. Next one.'**

Game both (FFX quips observed) · chapter seymour-flux (I) observed; the new chapters are grim tier and correctly silent, so they add no repetition · category narrative · introducedByCandidate false · regressionVsLive false · inNewFeature false

- Observed: results for I read '...Okay. Next one.' The bible's §4 banter bank is still not built
- Expected: varied in-character banter from the §4 bank
- Repro: win Chapter I with real keys, read the results card
- Evidence: critic/rounds/round-13/evidence/seymour-flux-win/run.json resultsText
- Where: src/story/scripts/*.ts victoryQuips (bank in writing-bible §4 not wired)
- Confidence: high
- Requirement: writing-bible §4, §5.4; RUBRIC §6 narrative
- Smallest fix: method check first (STALLED): wire §4.1 and §4.2 as Win-slot and results lines, rotated per chapter tier
- Acceptance: five Chapter I wins show at least three distinct results lines, none outside the grim tier
- Reported by: feel-narrative: PR-0021 (carried, STALLED): still no banter bank; Chapter I still ends on '...Okay. Next one.'

### 25. PR-0099 [major] STALLED

**PR-0099 (carried, STALLED, scope widened by release 18): THEMES.md's cue map has no row for Chapters VI, X, XI, XII, XIII or XIV, which all borrow other chapters' cues; four more chapters were listed on stand-ins in this release**

Game both · chapter FFX X, XII, XIV; FFX-2 VI, XI, XIII · category audio · introducedByCandidate true · regressionVsLive false · inNewFeature true

- Observed: `grep -in 'leblanc|natus|omnis|isaaru|fallen|trema' docs/audio/THEMES.md` finds 0 hits. Live, the stand-ins play exactly as configured. scene-gagazet ('The mountain does not care') now opens four listed FFX chapters: I at Gagazet, but also IX in the Cavern, X on the Bevelle Highbridge and XIV in the Via Purifico. boss-yojimbo, Bailey's pick for Chapter IX's Lulu's-Theme slot, also scores Isaaru. boss-ffx2-aeon scores IV, VI, XI (three links) and XIII. None of the new cues the decisions adopted exist yet. The stand-ins are disclosed in code and decisions, but not in the bible the themes audit checks against.
- Expected: Every listed chapter's cues are documented in the bible, including intentional reuse and the owed original cue each decision names. The rows would cover: D-091 (Natus: a new SEYMOUR_UNMOORED cue, boss-seymour-macalania as stand-in), D-145 B18 (Omnis: a new cue, boss-seymour as stand-in), D-186 (Isaaru: an unbuilt cue, scene-gagazet and boss-yojimbo as stand-ins), D-112 (Fallen Aeons: boss-ffx2-aeon by choice) and TR16 (Trema: boss-ffx2-aeon as a stand-in for boss-trema).
- Repro: grep the cue map for the six chapters (0 rows). Play X, XII and XIV live and read audioDebug at pre-scene and first menu (round-13 evidence: seymour-natus-win, seymour-omnis-win-phone, isaaru-via-purifico-win).
- Evidence: D:/Final Fantasy/docs/audio/THEMES.md; D:/Final Fantasy/critic/rounds/round-13/evidence/{seymour-natus-win,seymour-omnis-win-phone,isaaru-via-purifico-win,ffx2-fallen-aeons-win}/run.json; D:/Final Fantasy/src/data/chapter-seymour-natus.ts:29-33,64-70; D:/Final Fantasy/src/story/scripts/ffx-isaaru.ts:84,111
- Where: docs/audio/THEMES.md 'The cue map' (25 rows, Chapters I-V, VII, VIII and IX only)
- Confidence: high
- Requirement: CHK-001 (the right cue at the real moment, documented against THEMES.md); docs/target/decisions.json D-091, D-145 (B18), D-186, D-112, TR16
- Smallest fix: Add one cue-map row per listed chapter that borrows cues, naming the cue it plays now, whether that is a choice (XI, VI) or a stand-in (X, XII, XIV, XIII), and the owed cue with its decision id. Then put the owed Natus, Omnis and Isaaru cue sketches on the D-168 listening agenda rather than composing them unheard.
- Acceptance: The THEMES.md cue map has rows for VI, X, XI, XII, XIII and XIV. themes-audit.mjs covers the chapter-to-cue mapping, and a grep for each chapter name hits.
- Reported by: audio: PR-0099 (carried, STALLED, scope widened by release 18): THEMES.md's cue map has no row for Chapters VI, X, XI, XII, XIII or XIV, which all borrow other chapters' cues; four more chapters were listed on stand-ins in this release

### 26. PR-0127 [major] (carried, not re-tested)

**PR-0127 (carried, desktop half): Chapter VI prep polaroid captions are still clipped by the card edge, now seen at 2000x1012; the phone half is repaired (D-071)**

Game ffx2 · chapter ffx2-leblanc · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Size the polaroid row to fit two caption lines, or reduce the photo height so the captions fit inside the card.

### 27. PR-0144 [major] (carried, not re-tested)

**Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the research**

Game FFX-2 only · chapter ffx2-leblanc Act III (Last Room) · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Add a target condition to GuideHint (for example targetId) and use it on those two hints in place of bossId; reword the Leblanc hint to §3.4; correct or delete the unread FFX2_LEBLANC.sensorTexts.leblanc. Keep the NEXT reason visible at every fit rung, as the source intends.

### 28. PR-0018 [major] (carried, not re-tested)

**The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)**

Game FFX (measured); FFX-2 not measured · chapter braskas-final-aeon · category interface · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. The interface auditor reports the selected TALK row now looks like dark ink on gold in Ch III and X, but it was not contrast-measured, so the issue stays open until measured. Next correction: As round 08: give selected-and-disabled rows their own token (near-black at reduced opacity, or an inverted slab).

### 29. PR-0057 [major] (carried, not re-tested)

**At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line**

Game both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing) · chapter reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent · category visual · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.

### 30. PR-0063 [major] (carried, not re-tested)

**The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters**

Game FFX-2 · chapter ffx2-bahamut and ffx2-vegnagun-shuyin (chapter board dossier) · category game-awareness · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Chapter select v2 replaced the dossier with the boss painting; whether the FFX-2 party row still shows FFX portraits was not checked. Next correction: The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.

### 31. PR-0014 [major] (carried, not re-tested)

**HUD portrait chips crop through heads; the monogram half is repaired**

Game both · chapter 1 to 5 · category visual · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.

### 32. PR-0128 [major] (carried, not re-tested)

**Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks**

Game FFX only · chapter yunalesca (ch2; Tidus's gauge never filled in ch1) · category visual · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Gap pass: the seed-1 Chapter I route never filled Tidus's Overdrive, so the overlay was not reached. Next correction: Hide the guide card, or move it below the overlay, while an Overdrive overlay is up; restore the tick labels from the tile.

### 33. PR-0060 [major] (carried, not re-tested)

**The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce**

Game FFX only · chapter ch.3 (braskas-final-aeon) · category process · introducedByCandidate false · regressionVsLive false · inNewFeature false

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.

### 34. PR-0197 [polish]

**PR-0197 (new; R13-E02, absorbs R13-CAP-01, downgraded from major): in Chapter XII the advisor never aims a Mortiphasm, so disc turning (the fight's signature mechanic, taught by the guide) went unused in 4 live attempts, and its top row trails the intended line on the bench (24 vs 27 of 40)**

Game ffx · chapter XII (Seymour Omnis) · category encounter

- Observed: Live turn logs: Tidus switches to Wakka, then 'Wakka: Attack > Seymour Omnis' every time. 0 affinity-change part-turn events in 4 attempts. The intended tactic (engine/tactics/seymour-omnis.ts rule 4) turns a disc when three or more discs share a colour. Advisor-top-row wins 24-25/40 against the intended line's 27/40.
- Expected: research/ffx-seymour-omnis.md §5 row 2 [verified: 4 sources]: turning discs is the main counter to four -ga spells.
- Repro: Live Chapter XII: follow the advisor card; watch Wakka's rows.
- Evidence: critic/rounds/round-13/evidence/seymour-omnis-win*/turn-log.json and battle-log.json; critic/rounds/round-13/combat-deep/ffx-livelike.json
- Confidence: high
- Requirement: interface: useful advice; encounter: signature mechanic (cross-referenced; not scored twice)
- downgradeReason: The capture owner's major rested on 'seed 1, which every fresh profile gets'. The gap pass showed the first-wave runs were not on seed 1 (they read __pyrefly.seed(), the next battle's seed; R13G-09), and since D-172 a fresh profile draws a fresh seed. What remains is a 3-seed bench gap that is not statistically meaningful at 40 seeds and a live 1-of-4 that fits a 60% rate. The confirmer confirmed the bench numbers but not the seed premise. Disc turning itself works live by real keys (gap pass omnis-discs-1600x900: part-turn events and readout updates).
- Smallest fix: Let the advisor score a disc turn (magic or Wakka's blow) by the affinity change it simulates, or defer to the chapter tactic's row when three or more discs match.
- Acceptance: The advisor-top-row bench turns a disc in most Omnis runs, and its win rate is at least the intended line's 27/40.
- Reported by: combat-encounter: R13-E02: the advisor never recommends hitting a disc, so the fight's signature mechanic went unused in all 4 live attempts | capture-owner: Following the advisor on the fresh-profile seed loses Chapter XII

### 35. PR-0215 [polish]

**PR-0215 (new; R13G-04): an FFX engine stalemate ('The battle cannot be won from here.') ends the chapter straight to chapter select, with no Defeat results and no RETRY, after 25 minutes in Chapter III**

Game ffx (engine stalemate rule) · chapter III braskas-final-aeon (any FFX fight that trips the stalemate watch) · category delivery

- Observed: After 'The battle cannot be won from here.' (outcome 'escape') the screen went from battle directly to chapter-select. No results screen and no RETRY after a 25-minute fight.
- Expected: The player sees why the fight ended and gets the retry the defeat path offers (fast retry, understandable results).
- Repro: Live, setSeed(1), Chapter III following the card as written (see R13G-01); the stalemate trips at about command 334.
- Evidence: critic/rounds/round-13/evidence/gaps/braskas-final-aeon-win-seed1/run.json (afterFight = resultsScreen = chapter-select), battle-log.json tail
- Where: engine: src/battle/ffx/engine.ts:430 finish('escape'); the flow's handling of the 'escape' kind was not traced
- Confidence: medium (one occurrence; the flow code for 'escape' was not traced)
- Requirement: prep/replay (fast retry, understandable results); CHK-022
- Smallest fix: Route the stalemate outcome through the results screen as a defeat-like 'withdrew' result with RETRY.
- Acceptance: Trip the stalemate by real keys (or a debug-set state followed by real-key exit): a results card explains the withdrawal and RETRY re-enters the fight.
- Reported by: gap-capture: R13G-04: an engine stalemate ends the chapter straight to chapter select, with no results or retry

### 36. PR-0109 [polish]

**PR-0109 (carried, STALLED 5th review, widened; absorbs FOC18-05): the chapter board always opens on Chapter I, after a prep Esc-back, after results/CONFIRM and after a reload**

Game both · chapter chapter select (all 13 playable chapters) · category prep

- Observed: cardAfterBack = seymour-flux in 16 of 16 prep Esc-backs from chapters other than Chapter I, and boardAfter.selectedId = seymour-flux in 9 of 9 results returns from chapters other than Chapter I. On the new 14-card board, getting back to XI or XIII takes about 11 ArrowRight presses.
- Expected: The board comes back on the chapter the player just chose, backed out of, or finished.
- Repro: Live b975397b, fresh profile, 1600x900. Title, Enter, briefing Enter, ArrowRight x10 to V Vegnagun, Enter to prep, Esc: the board has selectedId seymour-flux. Same after winning any chapter and pressing CONFIRM. The seed is irrelevant.
- Evidence: critic/rounds/round-13/evidence/*/run.json (cardAfterBack, boardAfter.selectedId); critic/rounds/round-13/evidence/seymour-natus-win/35-board-reload.png
- Where: src/ui/common/registerFlowScreens.ts:42 constructs ChapterSelectScreen with no options; src/app/screens/ChapterSelectScreen.ts:110 defaults initialIndex to 0 (traced)
- Confidence: high (observed in every run; cause traced in source)
- Requirement: RUBRIC §6 prep: fast retry and reliable progress; CHK-015
- Smallest fix: Keep the last chosen or played chapter id on the flow (session memory) and pass it to ChapterSelectScreen as initialIndex, both on prep cancel and on the results return. This is stalled (RUBRIC §8), so write the method check first.
- Acceptance: With real keys at 1600x900, 2000x1012 and 390x844, after Esc from prep and after CONFIRM on results for each of the 13 playable chapters, snapshotState().screenState.selectedId equals that chapter.
- Reported by: prep-delivery: PR-0109 (carried, STALLED 5th review, widened; absorbs FOC18-05): the chapter board always opens on Chapter I, after a prep Esc-back, after results/CONFIRM and after a reload

### 37. PR-0138 [polish]

**PR-0138 (carried, now confirmed live and widened to the newly listed Chapter XI): a chained FFX-2 chapter's results show only the last link's spoils**

Game ffx2 (FFX-2 only: the FFX chains grant their rewards once at the end per the sources, e.g. ffx-yunalesca.md line 94, and BFA's AP is 0) · chapter V Vegnagun and Shuyin; XI Fallen Aeons · category prep

- Observed: V's victory reads 'EXP 0 x3 PARTY / AP 20 PER DRESSPHERE / GIL 0' (36:30, five links), which is exactly Shuyin's row. XI reads 'EXP 6,000 / AP 15 / GIL 2,000 / Tetra Band', which is Anima's row alone.
- Expected: The spoils of every battle in the chain. Sourced rows: Vegnagun Tail 5,000 EXP / 5 AP / 3,000 gil (ffx2-vegnagun-shuyin.md line 203), later links 6,000, 8,000 and 7,000 EXP with 3,000 gil each (lines 232, 261, 308), Shuyin 0 / 20 / 0 (line 435). Road to the Farplane: Shiva 8,000 / 15 / 2,000 (ffx2-fallen-aeons.md line 107), the Sisters (AP [conflict], line 129), Anima 6,000 / 15 / 2,000 with the Tetra Band (lines 145 and 149).
- Repro: Live b975397b, fresh profile, 2000x1012. Play Chapter V to victory by real keys on the default X-2 BATTLE WAIT and read the results ledger. Or play Chapter XI to victory at 1600x900. The seed was not recorded (see R13-PD-01).
- Evidence: critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/31-results.png; critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/run.json resultsText; critic/rounds/round-13/evidence/ffx2-fallen-aeons-win/run.json resultsText
- Where: results ledger for chained encounters (not traced to a line)
- Confidence: high
- Requirement: RUBRIC §6 prep: understandable results; AGAINST hard rule 6: the sourced reward rows
- Smallest fix: For FFX-2 chains, accumulate each link's EXP, gil and drops in the ledger that the results screen reads (or show a per-link ledger). Label the Sisters' AP conflict. Leave the FFX chains unchanged.
- Acceptance: A real-key Chapter V win shows EXP and gil equal to the sum of the sourced rows for the links fought, and a Chapter XI win includes Shiva's 8,000 EXP and 2,000 gil. A unit test on the chain ledger covers both. FFX III and II results are unchanged.
- Reported by: prep-delivery: PR-0138 (carried, now confirmed live and widened to the newly listed Chapter XI): a chained FFX-2 chapter's results show only the last link's spoils

### 38. PR-0204 [polish]

**PR-0204 (new; R13-FN-01 = R13G-05): Chapter X Talk shows the 'Tidus, +10 Strength' plate and a 'SPEAKS' chip for about 1.7 s and nobody speaks; the three Talk lines are drafted but held back until Bailey reads them (D-085)**

Game FFX only · chapter seymour-natus (X), any turn Tidus, Auron or Yuna uses Talk · category narrative

- Observed: after Talk, 'Tidus, +10 Strength' then 'Tidus SPEAKS' holds about 1.7 s at top-left, and no dialogue box appears. The canonical beat (research §8.2 'During') and its drafted lines ('Stop talking. You never say anything.' and two more) are absent
- Expected: the Trigger Command says something, or does not claim to
- Repro: real keys to Chapter X, seed 1, choose Talk with Tidus; frames every 230 ms
- Evidence: critic/rounds/round-13/feel-narr/ffx-actions.jpg (seymour-natus-win seq-party-action); docs/plans/natus-story-draft.md lines 113-121
- Where: src/story/scripts/seymour-natus.ts mid: [] and midScripts: {} (held pending D-085); src/battle/ffx/ai/seymour-natus-rules.ts consumeNatusTalk emits only the stat message (traced)
- Confidence: high
- Requirement: research/ffx-seymour-natus-highbridge.md §8.2 and §8.3; RUBRIC §6 narrative; RUBRIC §7 (the held lines are a decision for Bailey, not a defect in themselves)
- gapPass: Mechanics pass live: Tidus str 31 -> 41 and Yuna mdef 39 -> 49, once each (research §6.2, 4 sources). Auron's Talk not tested (not in the X line-up).
- Smallest fix: ask Bailey to read the draft's Talk and callout lines (D-085). Until then, drop the 'SPEAKS' tag so the plate only reports the bonus
- Acceptance: Talk in Chapter X shows the character's line in the dialogue box, or shows only the bonus plate, with no 'SPEAKS' tag and nothing said
- Reported by: feel-narrative: R13-FN-01 (new): Chapter X's Talk plays an empty 'SPEAKS' beat; the three Talk lines are written in the draft but held back | gap-capture: R13G-05: Chapter X Talk shows only a stat banner and 'Tidus speaks', with no line

### 39. PR-0214 [polish]

**PR-0214 (new; R13G-03): after resuming a scoreless scene (Chapter I pre-scene, 'Wind only'), the pause cue keeps playing at full gain (3 of 3 runs); battle and the Chapter V pre-scene resume correctly**

Game both (shared plumbing) · chapter I seymour-flux, pre-battle scene · category audio

- Observed: The pre-scene is silent by design ('Wind only', music(null)). Esc starts 'pause'. After Esc resumes the scene, AudioManager still reports current = 'pause' at gain 1, 1.5 s later and until the script's next music() cue. 3 of 3 runs.
- Expected: Resuming returns to what was playing before, here silence: the pause cue fades out.
- Repro: Live 1600x900, fresh profile. Chapter I, Enter through prep, wait 2.5 s in the pre-scene, Esc, wait 1 s, Esc, then sample __pyrefly.audioDebug().music.current after 1.5 s.
- Evidence: critic/rounds/round-13/evidence/gaps/probe-pause-audio-seymour-flux-1600x900/run.json; probe-r2-.../run.json; probe-r3-.../run.json
- Where: src/ui/common/pauseMusic.ts:64: `if (!previous || previous === PAUSE_CUE) return;` leaves the pause cue running when the remembered cue is null
- Confidence: high
- Requirement: audio routing (the interrupted cue returns); CHK-023
- Smallest fix: When the remembered cue is null, stop the music (stopMusic with the out-of-pause fade) instead of returning.
- Acceptance: The same probe reads music.current = null 1.5 s after resuming the Ch I pre-scene, and battle and Ch V resumes still restore their cues.
- Reported by: gap-capture: R13G-03: the pause cue keeps playing after resuming a scoreless scene (Ch I pre-scene)

### 40. PR-0216 [polish]

**PR-0216 (new; R13G-07): one of four fresh sessions had no title or chapter-select music at all (ready=true, playing=null, sprite not decoded) on a contended host; cause not established**

Game both · chapter title and chapter select · category audio

- Observed: In 1 of 4 fresh 2000x1012 runs, audioDebug reported ready=true but playing=null and no current cue from the first key through 6 s on the board. The other three played 'title', then 'chapter-select' at gain 1.
- Expected: The title cue starts on the first key in every session.
- Repro: Live 2000x1012, fresh profile, Enter on the title, sample audioDebug at +2, +3, +4, +6 s and on the board. The silent run was taken while four other capture browsers were running.
- Evidence: critic/rounds/round-13/evidence/gaps/probe-audio-title-board-2000x1012/run.json (silent) vs probe-r2-..., probe-r3-... (normal)
- Where: not traced
- Confidence: low (cause not established; host load and headless audio unlock not ruled out)
- Requirement: audio technical health
- Smallest fix: First reproduce it on an idle host. If it recurs, log the unlock and music-request sequence in audioDebug to find the dropped request.
- Acceptance: 20 fresh idle-host runs all report 'title' by +3 s and 'chapter-select' on the board.
- Reported by: gap-capture: R13G-07: one of four fresh sessions had no title or board music at all

### 41. PR-0203 [polish]

**PR-0203 (new; R13-AUD-01): at default settings the SFX bus (0.9) sits above the music bus (0.7), so the loudest effects peak about 2 dB over the music; THEMES.md SFX rule 8 asks for 6 dB under**

Game both · chapter all chapters (global mix) · category audio

- Observed: The sprite peaks at -1.13 dBTP. 81 of 134 slices peak above -7 dBFS in the file (ultima -1.14, lightning-3 -1.28, hit-1 -1.37). Live AudioManager samples show the defaults master 0.8, music 0.7, sfx 0.9, which is +2.2 dB of bus gain for SFX. Music peaks at -1.06 to -2.86 dBTP. Net result: the loudest effects peak about 2 dB above the music's peaks, about 8 dB from the rule. SOUND-DESIGN.md calls this an open question for Bailey, and nothing records him being asked. I cannot hear whether it sounds wrong.
- Expected: Effects peak 6 dB below the music's ceiling (THEMES.md SFX rule 8), or Bailey's recorded decision to keep them louder.
- Repro: node tools/audio/qa.mjs --json=<out>, then read sfx.cues[].peakDb. Read any round-13 run.json audio[0] 'volumes' (seed 1, fresh profile).
- Evidence: D:/Final Fantasy/critic/rounds/round-13/audio/qa-strict.json; D:/Final Fantasy/critic/rounds/round-13/evidence/ffx2-vegnagun-shuyin-win-nochange/run.json
- Where: src/audio/AudioManager.ts:121-122 (default musicVolume 0.7, sfxVolume 0.9); docs/audio/THEMES.md 'Sound-effect rules' hard rule 8; docs/audio/SOUND-DESIGN.md 'One open question for the mix'
- Confidence: high (measurement); the player impact is unknown without Bailey's ear
- Requirement: docs/audio/THEMES.md SFX hard rule 8; CHK-001 (technical gate) and CHK-B1 (owner judgment)
- Smallest fix: Ask the question in the D-168 session: 'keep the effects this loud, or lower them?'. Record the answer. If lower, change only the default SFX bus (about 0.35 meets rule 8; the bank itself stays as it is). If keep, amend rule 8 in THEMES.md with Bailey's words.
- Acceptance: Either the default sfxVolume puts the sprite's peak at or below music peak -6 dB (the arithmetic from qa-strict.json and the bus values), or THEMES.md rule 8 carries Bailey's dated exception.
- Reported by: audio: R13-AUD-01 (new): at default settings the SFX bus (0.9) sits above the music bus (0.7), so the loudest effects peak about 2 dB over the music; THEMES.md's SFX rule 8 asks for 6 dB under, and this open question was never put to Bailey

### 42. PR-0205 [polish]

**PR-0205 (new; R13-FN-02): the Chapter XI Sisters seam captions the link 'Sandy' alone**

Game FFX-2 only · chapter ffx2-fallen-aeons (XI), seam 1 to 2 · category feel

- Observed: the push to the three sisters shows the caption 'Sandy' from 1.1 to 2.2 s, while the guide panel calls the link 'Magus Sisters'
- Expected: 'Magus Sisters' (or all three names) for a three-sister formation
- Repro: real keys, win link 1 of Chapter XI; frames every 350 ms after the seam
- Evidence: critic/rounds/round-13/feel-narr/ffx2-fallen-aeons-win__seq-seam-2.jpg; ffx2-fallen-aeons-win/20-link-2.png
- Where: suspected: the seam caption takes the formation's first enemy name
- Confidence: high
- Requirement: RUBRIC §6 feel (readable transitions)
- Smallest fix: let a formation carry a display name for its seam caption, and set 'Magus Sisters' for link 2
- Acceptance: seam 2 caption reads 'Magus Sisters'
- Reported by: feel-narrative: R13-FN-02 (new): the Chapter XI Sisters seam captions the link 'Sandy' alone

### 43. PR-0211 [polish]

**PR-0211 (new; R13-VIS-02): mid-battle line cards are drawn across the party (Jecht in Chapter III, Shinra in Chapter V)**

Game both · chapter braskas-final-aeon (III, Jecht line); ffx2-vegnagun-shuyin (V, Shinra line at link 5) · category visual

- Observed: Ch III at 1600: the Jecht speaker card (typing its line) covers Lulu, Auron and Yuna below the shoulders at centre stage. Ch V at 2000: a translucent Shinra card with no portrait lies across Yuna and Rikku.
- Expected: Dialogue over actors measured against the painted quads (CHK-008 scope: cutscene dialogue over actors).
- Repro: Ch III: reach the Doublecast beat, seed 1. Ch V: reach link 5, when Shinra's line fires.
- Evidence: critic/rounds/round-13/evidence/braskas-final-aeon-win/25-doublecast.png; critic/rounds/round-13/visual/link5-crop.jpg
- Confidence: medium (transient frames)
- Requirement: CHK-008
- Smallest fix: During battle, anchor mid-battle line cards in a band that avoids the party quads (for example above the field, under the guide), or push the camera while one shows.
- Acceptance: Every mid-battle line in Ch III and Ch V at 1600 and 2000 has no intersection with a party face or torso.
- Reported by: visual-targets: R13-VIS-02 (new): mid-battle line cards are drawn across the party

### 44. PR-0212 [polish]

**PR-0212 (new; R13-VIS-03): Valefor's painting is cut by its canvas edge, so a hard straight edge shows on its wing**

Game FFX only · chapter isaaru-via-purifico (XIV), after the summon · category visual

- Observed: The summoned Valefor's far wing ends in a straight vertical and horizontal cut. Traced: public/art/characters/valefor/idle.png (1057x830) has 314 opaque pixels on its right border column (0 on the other borders). The file is not in approved-hashes.json or judge-locked-hashes.json.
- Expected: Paintings fully inside their canvas (the same class as PR-0164).
- Repro: Ch XIV, seed 1: Yuna, Summon, Valefor; midfight frame.
- Evidence: critic/rounds/round-13/visual/isaaru-mid-crop.jpg; critic/rounds/round-13/evidence/isaaru-via-purifico-win/23-midfight.png
- Confidence: high (cause traced in the file)
- Requirement: CHK-013 (correct rendering in game)
- Smallest fix: Re-cut or pad valefor/idle.png so the wing is whole, or mask it with a soft edge. Check attack.png and overdrive.png the same way.
- Acceptance: 0 opaque pixels (alpha > 32) on every border row and column of the Valefor pose files; no straight edge in a Ch XIV summon frame.
- Reported by: visual-targets: R13-VIS-03 (new): Valefor's painting is cut by its canvas edge, so a hard straight edge shows on its wing

### 45. PR-0209 [polish]

**PR-0209 (new; IC-1 = R13-C02): an immune result still opens or extends the victim's chain window (resolve.ts:319 before the immune check at :340); reachable only on the enemy side in Chapter V; the lone-survivor chain lock was not observed live or in 480 bench chains**

Game ffx2 · chapter V (nodes); the lock case only in unlisted Chapter XV · category combat

- Observed: resolve.ts registers the chain (:319) and emits a 'chain' event before computeDamage's immune result (:329, :340). Bench, Chapter V: Rikku and Paine Attacks on the physically immune nodes register a chain (13 events over 40 seeds and 3 arms). Party side: 0 immune chains in 8 live logs and in every bench arm of IV, V, VI and XI, so the IC-1 lock is refuted for b975397b. The capture's ic-scan could not have found it: it looks for damage events, and an immune result emits a 'miss'.
- Expected: Unsourced either way. research/ffx2-combat-core.md §9.2: the GameFAQs reading (Split_Infinity: attacks on Invincible 'will fail'; only damaging attacks disturb the gauge) is 'no chain', labelled an estimate for Bailey.
- Repro: critic/rounds/round-13/combat-deep/r13d/ffx2.test.ts (IC counters), R12_ARMS=0,1000 R12_MODES=wait-split
- Evidence: critic/rounds/round-13/combat-deep/probe-ffx2-bench.json (ic.ch5.immuneChainOnEnemy 13); ic-rescan.json (live missTypes: evaded 24, wrong-state 4, immune 0)
- Where: src/battle/ffx2/resolve.ts:319-343
- Confidence: high
- Requirement: combat; question for Bailey (RUBRIC §7 inferred versus named)
- branchNote: Part of the FFX-2 engine track on ffx2-engine-fixes-0926; do not duplicate.
- refutedPart: The sole-survivor party-side chain lock (IC-1's player-facing symptom) is not reproduced: 0 party-side immune chains in 8 live logs, 480 bench chains and the gap pass (one 0-damage hit on a sole survivor with chain count 0).
- Smallest fix: Bailey decides whether an immune or Invincible hit chains. If 'no', decide immunity before registerHit (branch ffx2-engine-fixes-0926).
- Acceptance: After the decision, the IC counters match it in the bench, and Chapters IV and VI event logs are unchanged.
- Reported by: combat-encounter: R13-C02 (IC-1): an immune result still opens or extends the victim's chain window; the lone-survivor chain lock is not reachable on the live build

### 46. PR-0104 [polish]

**PR-0104 (carried, partly improved): under Wait, a confirmed FFX-2 command still does not visibly resolve before the next girl's cut-in and menu**

Game FFX-2 only · chapter ffx2-fallen-aeons (XI), ffx2-bahamut (IV) · category feel

- Observed: Yuna confirms Shell and steps forward (0.3 to 0.8 s). Rikku's full cut-in is up at 1.05 s and her menu at 1.8 s. No Shell effect and no SHL tag appears in the party rows by 2.3 s. Round 12: cut-in at 0.3 s
- Expected: the confirmed action's effect reads before the next command menu takes the eye
- Repro: real keys, Chapter XI link 1, Yuna White Magic > Shell under X-2 BATTLE WAIT; frames every 250 ms
- Evidence: critic/rounds/round-13/feel-narr/ffx2-actions.jpg, fa-action-zoom.jpg
- Where: not traced
- Confidence: medium (2.3 s window; the effect may land after it)
- Requirement: RUBRIC §6 feel (action and reaction timing)
- Smallest fix: hold the next cut-in until the queued action's effect event has played, or at least its status tag
- Acceptance: in XI and IV the SHL tag or the effect shows before the next girl's cut-in starts
- Reported by: feel-narrative: PR-0104 (carried, partly improved): under Wait, a confirmed FFX-2 command still does not visibly resolve before the next girl's cut-in and menu

### 47. PR-0058 [polish]

**PR-0058 (carried) reaches Chapter XI: Shinra, Brother and Buddy speak with no portrait and no role plate, over the Farplane road plate, though the script puts them on the comm**

Game FFX-2 only · chapter ffx2-fallen-aeons (XI) pre-scene lines 1 to 3 · category narrative

- Observed: 'Shinra / Readings under the temple. The fayth are gone.' shows on a bare card over the destination plate. The next two lines do the same
- Expected: a portrait, or a clear comm treatment (for example a COMM plate), so the scene reads as the bridge talking to the girls
- Repro: real keys to Chapter XI, first pre-scene lines
- Evidence: critic/rounds/round-13/feel-narr/fa-story.jpg (05-pre-scene.png)
- Where: src/story/scripts/ffx2-fallen-aeons.ts PRE (speakers shinra, brother-x2, buddy)
- Confidence: high
- Requirement: writing-bible §2.2; PR-0058
- chiefNote: Gap pass: no portrait art or approved tile exists for Shinra or the FFX Brother, so those speakers' portrait-less cards are not a render defect; whether they should get one is a question for Bailey (R13-VIS-05).
- Smallest fix: add the Celsius crew's portraits, or a comm plate for off-stage voices
- Acceptance: XI lines 1 to 3 show a portrait or a comm tag
- Reported by: feel-narrative: PR-0058 (carried) reaches Chapter XI: Shinra, Brother and Buddy speak with no portrait and no role plate, over the Farplane road plate, though the script puts them on the comm | visual-targets: R13-VIS-05 (question for Bailey): Shinra's Ch V mid-battle lines use the no-portrait card

### 48. PR-0133 [polish]

**PR-0133 (carried, more of it repaired): XII and XIV now stage the boss in their aftermath; V and XI still stage the backdrop only**

Game both · chapter ffx2-vegnagun-shuyin (V) post and epilogue, ffx2-fallen-aeons (XI) post · category narrative

- Observed: V's Yuna and Shuyin post lines play over the empty Farplane plate. XI's Glen and Leblanc lines play over the plate with portraits only. XII shows Seymour standing through the sending, and XIV shows Isaaru
- Expected: the speakers staged in the aftermath
- Repro: win V or XI with real keys
- Evidence: critic/rounds/round-13/feel-narr/veg-story.jpg, fa-story.jpg, ffx-new-story.jpg
- Where: story scripts post (no showActor)
- Confidence: high
- Requirement: RUBRIC §2 (aftermath matters); PR-0133
- Smallest fix: showActor for Shuyin in V's post, and for the Leblanc trio in XI's epilogue where paintings exist
- Acceptance: V post and XI epilogue captures show the speakers on stage
- Reported by: feel-narrative: PR-0133 (carried, more of it repaired): XII and XIV now stage the boss in their aftermath; V and XI still stage the backdrop only

### 49. PR-0112 [polish]

**PR-0112 (carried, widened): the phone pause OPTIONS cuts labels, and the FFX-2 X-2 BATTLE, ATB SPEED, STRATEGY GUIDE and BATTLE HELP rows sit below a fade with no scroll cue**

Game both (the X-2 rows are FFX-2 only) · chapter XI (observed) · category interface

- Observed: 'MASTER VOLUM…'. The X-2 BATTLE / WAIT row is half-faded under 'THIS ENCOUNTER', and the rows after it are not shown. The tab strip is cut ('TER GUIDE OPTIONS CONTROLS'), and the header wraps 'FINAL FANTASY / X-2'. Whether touch scrolling reaches the rows is unverified.
- Expected: All settings rows are visible or visibly scrollable, with full labels.
- Repro: LIVE, 390x844, Chapter XI, Esc, OPTIONS tab.
- Evidence: critic/rounds/round-13/evidence/ffx2-fallen-aeons-win-phone/14-pause-options.png
- Where: not traced
- Confidence: high for what is shown, unverified for scroll reachability
- Requirement: CHK-009; pause usability
- Smallest fix: Stack each row as label over control on phone, drop the ellipsis, and add a scroll hint or put SETTINGS after THIS ENCOUNTER in one scrolling column.
- Acceptance: At 390x844 every settings row is reachable by touch scroll, no label is ellipsised, and X-2 BATTLE flips by tap.
- Reported by: interface-onboarding: PR-0112 (carried, widened): the phone pause OPTIONS cuts labels, and the FFX-2 X-2 BATTLE, ATB SPEED, STRATEGY GUIDE and BATTLE HELP rows sit below a fade with no scroll cue

### 50. PR-0170 [polish]

**PR-0170 (carried, widened): in single-enemy fights Attack fires at once, with no target step and no back-out**

Game both · chapter II, XI, XII, XIV (plus IX from round 12) · category interface

- Observed: Ch XII, 1600x900: Attack went straight to play:turn-start with no targets, and the next Escape opened the pause. 16-target-single shows targets=0 in Ch II, XI, XII and XIV.
- Expected: Enter on Attack shows the target bracket even with one valid target, and Escape returns to the menu (or leave it and tell Bailey).
- Repro: LIVE, seed 1. Chapter XII first menu, Enter on ATTACK.
- Evidence: critic/rounds/round-13/evidence/target-seymour-omnis-1600x900/run.json; yunalesca-win, isaaru-via-purifico-win, ffx2-fallen-aeons-win, seymour-omnis-win /16-target-single.png
- Where: not traced
- Confidence: high
- Requirement: CHK-010; cancel paths (RUBRIC §5)
- Smallest fix: Open the target step for single-target commands whatever the target count.
- Acceptance: In Ch II and XII, Enter on Attack shows the bracket on the boss, and Escape returns to the command menu.
- Reported by: interface-onboarding: PR-0170 (carried, widened): in single-enemy fights Attack fires at once, with no target step and no back-out

### 51. PR-0115 [polish]

**PR-0115 (carried): P opens the pause but does not close it, and P over a pre-battle scene does nothing**

Game both · chapter all captured · category interface

- Observed: pause.pClose=false in every run. pause-matrix: 'P over pre-battle cutscene' leaves screen=cutscene in Ch X and XI.
- Expected: P toggles the pause wherever Esc does.
- Repro: LIVE, any chapter: press P at the command menu, then P again; press P during the pre-battle scene.
- Evidence: critic/rounds/round-13/evidence/pause-matrix/seymour-natus.json; pause-matrix/ffx2-fallen-aeons.json; */run.json pause
- Where: not traced
- Confidence: high
- Requirement: CHK-015
- Smallest fix: Bind P as a toggle in the pause screen and in the cutscene layer.
- Acceptance: A real-key e2e case shows that P opens and closes the pause from the menu and from a scene.
- Reported by: interface-onboarding: PR-0115 (carried): P opens the pause but does not close it, and P over a pre-battle scene does nothing | capture-owner: Carried PR-0115: P opens the pause but never closes it, and P over a cutscene does nothing

### 52. PR-0182 [polish]

**PR-0182 (carried): Kimahri's OVERDRIVE row still ignores the first Enter**

Game ffx · chapter seymour-flux · category interface

- Observed: rageSecondEnter=1 in the Ch I win (the harness needed a second Enter).
- Expected: The first Enter on OVERDRIVE opens the Ronso Rage list.
- Repro: LIVE, seed 1, Chapter I, Kimahri's first turn: ArrowDown to OVERDRIVE, then Enter.
- Evidence: critic/rounds/round-13/evidence/seymour-flux-win/run.json (rageSecondEnter)
- Where: not traced
- Confidence: high
- Requirement: CHK-015
- Smallest fix: As round 12: open the list on the first Enter, and use one chooser.
- Acceptance: Overdrive > Mighty Guard fires with Enter, arrows, Enter and at most one confirm, with no dead press.
- Reported by: interface-onboarding: PR-0182 (carried): Kimahri's OVERDRIVE row still ignores the first Enter | capture-owner: Carried R12-01: Kimahri's OVERDRIVE row ignores the first Enter

### 53. PR-0032 [polish]

**PR-0032 (carried): no text-size, key-remap or flash setting; reduce-motion follows the OS only**

Game both · chapter all · category onboarding

- Observed: OPTIONS lists MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, STRATEGY GUIDE and BATTLE HELP (plus X-2 BATTLE and ATB SPEED in FFX-2), as in round 12.
- Expected: Text size, reduce flashes and reduce motion as options, and remappable controls.
- Repro: LIVE, any chapter, Esc, OPTIONS.
- Evidence: critic/rounds/round-13/evidence/seymour-natus-win/14-pause-options.png; ffx2-vegnagun-shuyin-win/14-pause-options.png
- Where: src/app/screens/pause/panels.ts (round 12)
- Confidence: high
- Requirement: RUBRIC §6 onboarding (text and input access, motion and flash)
- Smallest fix: Add Text size (100/115/130%), Reduce flashes, Reduce motion override and a CONTROLS remap list. Show Bailey the rows first if the layout changes.
- Acceptance: Each setting changes the game with real keys and survives a reload.
- Reported by: interface-onboarding: PR-0032 (carried): no text-size, key-remap or flash setting; reduce-motion follows the OS only

### 54. PR-0033 [polish]

**PR-0033 (carried): the Defeat card never says why the party fell**

Game both · chapter XII (observed), all · category onboarding

- Observed: Defeat shows TURNS 80, ATTEMPTS 1, BEST 'NEVER CLEARED' and the party AP, and nothing about the cause.
- Expected: One line naming the cause (the last KO source).
- Repro: LIVE, 2000x1012, lose Chapter XII.
- Evidence: critic/rounds/round-13/evidence/seymour-omnis-win/31-results.png
- Where: not traced
- Confidence: high
- Requirement: RUBRIC §6 onboarding (help that teaches)
- Smallest fix: Read the last ko event's source and ability from the battle log into one line.
- Acceptance: After a Ch IX Zanmato wipe or a Ch XII loss, the Defeat card names the finishing move.
- Reported by: interface-onboarding: PR-0033 (carried): the Defeat card never says why the party fell

### 55. PR-0073 [polish]

**PR-0073 (carried, narrowed): the phone briefing and phone pre-scene hints still name only keys**

Game both · chapter all (phone) · category onboarding

- Observed: Briefing: 'ENTER / ESC SKIP — 20 SECONDS, ONCE · D NEVER SHOW THIS AGAIN'. Pre-scene: 'ENTER ADVANCE · HOLD ENTER SKIP · ESC MENU'. The board ('TAP A CARD CHOOSE · TAP THE PLATE BEGIN · TAP HERE BACK') and prep (START BATTLE) are repaired.
- Expected: Touch wording on phone, as the phone board and prep now have.
- Repro: LIVE, 390x844, fresh profile, title to briefing to board to scene.
- Evidence: critic/rounds/round-13/evidence/ffx2-fallen-aeons-win-phone/01-briefing.png, 05-pre-scene.png, 03-card.png
- Where: not traced
- Confidence: high
- Requirement: RUBRIC §6 onboarding (device usability)
- Smallest fix: Swap to touch phrases under html[data-phone-battle] or a coarse pointer ('TAP SKIP', 'TAP ADVANCE · HOLD SKIP', 'NEVER SHOW AGAIN' as a button).
- Acceptance: At 390x844 in a touch context no briefing or scene hint names a key, and each named tap works.
- Reported by: interface-onboarding: PR-0073 (carried, narrowed): the phone briefing and phone pre-scene hints still name only keys

### 56. PR-0174 [polish]

**PR-0174 (carried, re-observed on Chapter X): Rikku's preset S.LV 53 stands far above the rest of the party (18-25) in the Chapter X prep**

Game ffx · chapter X Seymour Natus (inherits Chapter VIII's Rikku via highbridge.ts atTheTop(fahrenheitBuild)) · category prep

- Observed: The prep roster shows Tidus 24, Yuna 18, Kimahri 22, Auron 25, Wakka 24, Lulu 24, Rikku 53.
- Expected: A Rikku sphere level in line with the sourced +25 offset over the other characters' 14-22 (ffx-seymour-anima-macalania.md line 666) and with the Macalania (40) and Gagazet (42) presets on either side.
- Repro: Live b975397b, 1600x900: title, board, ArrowRight to X Seymour Natus, Enter, and read the prep roster.
- Evidence: critic/rounds/round-13/evidence/seymour-natus-win/04-prep.png; src/data/ffx/builds/fahrenheit.ts:212 at b975397b
- Where: src/data/ffx/builds/fahrenheit.ts:212 (traced)
- Confidence: medium (the offset source is a range, not a value)
- Requirement: Hard rule 6 (sourced data); RUBRIC §6 prep: meaningful sourced prep
- Smallest fix: Re-derive Rikku's Chapter VIII sLv from the §9.2 offset against the documented range, or record the 53 as an estimate with its reasoning. Chapter X follows automatically.
- Acceptance: The VIII and X prep rosters show a Rikku S.LV consistent with the Macalania and Gagazet presets, with its source tag in the build file.
- Reported by: prep-delivery: PR-0174 (carried, re-observed on Chapter X): Rikku's preset S.LV 53 stands far above the rest of the party (18-25) in the Chapter X prep

### 57. PR-0195 [polish]

**PR-0195 (carried, 5th review): the CHK-024 save and settings upgrade matrix has still never been run**

Game both · chapter all · category process

- Observed: Only fresh-profile save and reload is proven (10 of 10 this round). No release-17 save has ever been loaded before boot on the new build, and truncated storage and mid-battle reload have never been exercised live.
- Expected: The CHK-024 matrix runs whenever persistence or a release changes. Four chapters were newly listed this release.
- Repro: Not run. Needs a localStorage export from 1a680e41 with clears and non-default settings.
- Evidence: critic/rounds/round-13/delivery/vitest-save-prep.txt (unit tests only)
- Confidence: high (absence of evidence)
- Requirement: CHK-024
- Smallest fix: Add tests/fixtures/saves/release-17.json and a Playwright run that injects it before boot on the live URL.
- Acceptance: Clears, ribbons, best times, volumes and the ATB mode from the fixture show on b975397b's board and pause Options after boot, and truncated JSON boots to a fresh save without an error.
- Reported by: prep-delivery: PR-0195 (carried, 5th review): the CHK-024 save and settings upgrade matrix has still never been run

### 58. PR-0100 [polish]

**PR-0100 (carried, STALLED): 52 audition-candidate files (34.2 MB) still ship live under audio/candidates, and the strict audio gate still fails on them**

Game both · chapter n/a (delivery) · category audio

- Observed: The live artifact carries 52 files and 34,229,075 bytes under audio/candidates. qa.mjs --strict exits 1, with the only problems being 52 'orphan file not in the manifest: candidates/…' lines. The game never requests these files. This is unchanged from round 12.
- Expected: Only manifest-listed audio ships, and `qa.mjs --strict` exits 0.
- Repro: node tools/audio/qa.mjs --strict; echo $? (1). Read the live artifact-manifest.json files[] filtered to audio/candidates (52 entries).
- Evidence: D:/Final Fantasy/critic/rounds/round-13/audio/qa-strict.txt; D:/Final Fantasy/critic/rounds/round-13/evidence/live/artifact-manifest.json
- Where: public/audio/candidates/* (referenced only by docs/audio/audition.html through ../../public/audio/candidates/; never by src/)
- Confidence: high
- Requirement: CHK-001 step 1 (qa strict green); CHK-017 (shipped files are deliberate)
- Smallest fix: Move the candidates to docs/audio/audition/candidates and update the src paths in docs/audio/audition.html. Or exclude public/audio/candidates from the production copy. Add qa.mjs --strict to the deploy preflight.
- Acceptance: A fresh build has no audio/candidates in dist, qa.mjs --strict exits 0, and audition.html still plays every candidate locally.
- Reported by: audio: PR-0100 (carried, STALLED): 52 audition-candidate files (34.2 MB) still ship live under audio/candidates, and the strict audio gate still fails on them

### 59. PR-0039 [polish]

**PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible, and release 18 plays them in more chapters**

Game both · chapter scene-gagazet (FFX I, IX, X, XIV); scene-dreams-end (FFX III, XII); scene-farplane (FFX-2 V, XI) · category audio

- Observed: themes-audit.mjs: 3 of 25 cues depart. scene-gagazet and scene-farplane have no tempo map. scene-dreams-end has FAREWELL_RISE absent and no tempo map. scene-farplane measures E minor against a map of E major. Unchanged since round 12. Exposure grew: scene-gagazet now opens four listed chapters, scene-dreams-end two and scene-farplane two.
- Expected: themes-audit.mjs reports 0 of 25 departures: a tempo map on each lyrical cue, FAREWELL_RISE in scene-dreams-end, and scene-farplane in E major as mapped (or the map corrected on purpose).
- Repro: node tools/audio/themes-audit.mjs
- Evidence: D:/Final Fantasy/critic/rounds/round-13/audio/themes-audit.txt
- Where: src/audio/tracks/scene-gagazet.ts, scene-dreams-end.ts, scene-farplane.ts; docs/audio/THEMES.md rows 10, 12, 14
- Confidence: high
- Requirement: docs/audio/THEMES.md cue map and Renderer requests #1; CHK-001 step 2
- Smallest fix: Add tempo maps to the three lyrical cues and FAREWELL_RISE to scene-dreams-end. Correct scene-farplane's mode, or change its bible row if E minor was deliberate. Re-render only these three cues, and play them to Bailey before they ship.
- Acceptance: themes-audit.mjs reports '0 of 25 cue(s) depart from the bible', and qa.mjs stays clean for the re-rendered cues.
- Reported by: audio: PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible, and release 18 plays them in more chapters

### 60. PR-0183 [polish]

**PR-0183 (carried, seen in Ch III): the FFX target name plate is drawn among the party's heads**

Game FFX only · chapter braskas-final-aeon (III), Attack on Yu Pagoda A · category visual

- Observed: The 'Yu Pagoda A' plate sits between Auron's and Yuna's heads, over Yuna's staff, far from the Pagoda.
- Expected: The plate at the target, clear of party faces.
- Repro: Ch III first menu, Attack, default target, 1600x900, seed 1.
- Evidence: critic/rounds/round-13/targets/fight-targeting-s2-ch3.jpg
- Confidence: high
- Requirement: CHK-008, CHK-010
- Smallest fix: Anchor the plate to the target quad and clamp it away from the party quads.
- Acceptance: In Ch I and III single-target frames the name plate does not intersect any party face.
- Reported by: visual-targets: PR-0183 (carried, seen in Ch III): the FFX target name plate is drawn among the party's heads

### 61. PR-0186 [polish]

**PR-0186 (carried): the Ch III Sensor/info card covers the lower part of Yu Pagoda B and BFA**

Game FFX only · chapter braskas-final-aeon (III) · category visual

- Observed: While a Pagoda or BFA is selected, the 'Yu Pagoda / BFA HP ???' card overlaps Pagoda B's base and BFA's lower body.
- Expected: Info card clear of every targetable enemy.
- Repro: Ch III, first menu, then Attack, 1600, seed 1.
- Evidence: critic/rounds/round-13/targets/fight-targeting-s2-ch3.jpg; critic/rounds/round-13/evidence/braskas-final-aeon-win/16b-after-cancel.png
- Confidence: high
- Requirement: CHK-008, CHK-011
- Smallest fix: As in round 12: move the card into the free column left of the turn list.
- Acceptance: The card box does not intersect either Pagoda quad or BFA at 1600 or 2000.
- Reported by: visual-targets: PR-0186 (carried): the Ch III Sensor/info card covers the lower part of Yu Pagoda B and BFA

### 62. PR-0176 [polish]

**PR-0176 and FOC18-02 (carried): aeon turn-order tiles are letter chips (B, V), and Mortibody's chip shows an M monogram**

Game FFX only · chapter seymour-natus (X), isaaru-via-purifico (XIV) · category visual

- Observed: In the Ch X turn list, Bahamut shows 'B' tiles and Mortibody's chip shows an 'M' through its painting. In Ch XIV, Valefor shows 'V' tiles.
- Expected: A painted face in every turn-order tile (CHK-012).
- Repro: Ch X Bahamut turn; Ch XIV after the summon; 1600, seed 1.
- Evidence: critic/rounds/round-13/evidence/target-all-seymour-natus-1600x900/01-all-enemies.png; critic/rounds/round-13/evidence/isaaru-via-purifico-win/23-midfight.png
- Confidence: high
- Requirement: CHK-012
- absorbs: FOC18-02 (Mortibody's M monogram chip, Chapter X)
- Smallest fix: Cut the aeon tiles from the aeons' own paintings (public/art/portraits/bahamut.png and valefor.png exist), and give Mortibody an opaque crop.
- Acceptance: No turn-order tile in Ch I, III, IX, X or XIV renders the monogram layer visibly.
- Reported by: visual-targets: PR-0176 and FOC18-02 (carried): aeon turn-order tiles are letter chips (B, V), and Mortibody's chip shows an M monogram

### 63. PR-0135 [polish]

**PR-0135 (carried): at 2000x1012 the FFX-2 field and help band stop short of the right edge**

Game FFX-2 only · chapter ffx2-bahamut (IV), ffx2-vegnagun-shuyin (V), ffx2-fallen-aeons (XI) · category visual

- Observed: A hard dark strip runs down the right side of the FFX-2 battle frames at 2000x1012.
- Expected: A full-bleed field.
- Repro: Any FFX-2 chapter first menu at 2000x1012.
- Evidence: critic/rounds/round-13/targets/presentation-battle-hud-ffx2.jpg; critic/rounds/round-13/targets/scenes-ch5-farplane.jpg
- Confidence: medium
- Requirement: RUBRIC section 5 (global layout)
- Smallest fix: Extend the FFX-2 stage and help band to the viewport width.
- Acceptance: At 2000x1012 and 2560x1080, the Ch IV first menu has no flat strip at the left or right edge.
- Reported by: visual-targets: PR-0135 (carried): at 2000x1012 the FFX-2 field and help band stop short of the right edge

### 64. PR-0034 [polish]

**PR-0034 (carried): the Ch I battle grade drops the approved Gagazet moon and lit snow**

Game FFX only · chapter seymour-flux (I) · category visual

- Observed: The battle frames are a dark blue grade with no moon; the cutscene shows the approved plate with its moon.
- Expected: The concept-gagazet look.
- Repro: Ch I first menu, 1600 or 2000.
- Evidence: critic/rounds/round-13/targets/scenes-ch1-gagazet.jpg
- Confidence: medium
- Requirement: tile Ch. 1 Mt. Gagazet
- Smallest fix: Relight the battle grade toward the approved plate.
- Acceptance: The composite shows the moon and lit snow in the battle framing.
- Reported by: visual-targets: PR-0034 (carried): the Ch I battle grade drops the approved Gagazet moon and lit snow

### 65. PR-0066 [polish]

**PR-0066 (carried, narrowed and downgraded from major; absorbs FOC18-03): on the 390x844 chapter select v2, five text runs render at 12 px, below the 14 px floor**

Game both · chapter title and chapter select (gates all eight tiles) · category interface

- Observed: the 'Chapter select' heading, 'Chapter I', '/13', 'CTB' and 'Final Fantasy X' render at 12 px on the candidate; live measures 12 px on the same 390x844 board
- Expected: CHK-003 and the change's own acceptance: no text a player must read falls below 14 effective css px, and the title still composes at 390x844.
- Repro: Fresh browser context at 390x844 with no resize down from a larger size. Load the live site, press Enter (or tap the chip) to reach the chapter select, walk every leaf text node under .fe and multiply getComputedStyle(el).fontSize by the accumulated transform scale. No seed involved.
- Evidence: tools/zz-foc18.tmp/textprobe.mjs; critic/reviews/b975397b-focused/cselect/390-new-ch1.jpg
- Confidence: high — measured on the live bundle, and the mechanism is traced in the shipped CSS
- Requirement: critic/CHECKS.md CHK-003 pass/fail "zero elements under 14px"; RUBRIC §2 platform goals (phone is a supported shape).
- downgradeReason: Chapter select v2 (D-183) replaced the board PR-0066 measured at 9.54 px; the focused review of this exact artifact measured the remaining small runs at 12 px and classed them polish. The interface auditor found the phone board and prep readable, with touch hints.
- Smallest fix: src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.
- Acceptance: In a fresh 390x844 context the leaf-text sweep over .fe on both the title and the chapter select returns zero elements under 14 effective px, documentElement.scrollWidth === clientWidth, and the re-shot capture shows no clipped or overlapping labels; the same sweep at 1600x900 and 2000x1012 is unchanged.

### 66. FOC18-04 [polish]

**Chapter select: selecting a card nudges the cards below it by 2 px (no reordering)**

Game both · chapter chapter select at 1600x900 and 2000x1012 · category —

- Observed: the newly selected card grows 2 px and moves 2 to 2.5 px left, the old one returns 9 to 10 px right, and when Chapter I is reselected every card below shifts down 2 px. The order never changes and Enter never starts another chapter (13 of 13 clicks began the clicked chapter), so this is not the shifting list Bailey disliked
- Expected: 'the selected card lit in place'; nothing else moves
- Repro: node tools/zz-foc18.tmp/cardmove.mjs <base> 1600 900 1
- Evidence: tools/zz-foc18.tmp/cardmove.mjs; critic/reviews/b975397b-focused/cselect/report.json
- Where: suspected: the selected-card border / notch rule in chapter-select-c.css adds 2 px of height
- Confidence: high (bounding rects before and after each click, hover settled first)
- Requirement: targets.json chapter-select v2 reaction: disliked 'the list that shifts under the cursor'
- Smallest fix: reserve the selected border on every card (transparent), or draw it with an outline or inset shadow
- Acceptance: cardmove probe: only the selected and previously selected cards change, with 0 px height change

### 67. PR-0202 [polish]

**PR-0202 (new; R13-PD-01 = R13-EV01 = R13G-09, evidence integrity): the capture harness labels every run 'seed 1' from window.__pyrefly.seed(), which returns the next battle's seed; real-key runs have drawn a fresh seed since release 17 (D-172), so no first-wave round-13 run's seed is known**

Game both · chapter all routes in round 13 · category process

- Observed: index.json's seedNote and every run.json seed and retrySeed read 1, including after RETRY. The BFA note compares 4 live losses on 'seed 1' with the bench's 'seed 1 wins 39/40'.
- Expected: The recorded seed is the one the battle used, or the run pins one and says so.
- Repro: Read route.mjs:179, then src/debug/api.ts:324-386 at b975397b: seed() returns currentSeed, which only setSeed changes. Chapter select calls runChapter(id, {}) (BattleScreenFlow.ts:249), which draws a fresh seed.
- Evidence: critic/rounds/round-13/cap/route.mjs; critic/rounds/round-13/evidence/braskas-final-aeon-win/run.json
- Where: critic/rounds/round-13/cap/route.mjs:179 and :418 read window.__pyrefly.seed(); src/debug/api.ts:324/373 return the debug variable currentSeed (default 1); src/app/screens/pause/restartCarry.ts openRun draws via runSeed.ts drawRunSeed when no seed is pinned; src/app/screens/BattleScreenFlow.ts:306 and :346 (traced)
- Confidence: high (source trace; not executed)
- Requirement: CHK-016 scope: any number a report quotes from a page; RUBRIC §5: record the seed
- chiefNote: Harness defect, not a product defect. The gap pass fixed it for its own runs (setSeed before the first key, battleState().seed read back = 1). It invalidated three first-wave premises in this round: the Chapter XII "fresh-profile seed" claim (PR-0197), the Chapter I "opening order changed" claim (PR-0061) and the Chapter I 2000x1012 "same state" comparison (PR-0206).
- Smallest fix: The harness calls window.__pyrefly.setSeed(N) before the first key, records it as a labelled setup hook (allowed by CHK-015), and relabels round-13's seed fields as 'drawn, unrecorded'. This changes no product code.
- Acceptance: Two routes with setSeed(1) produce the same first enemy action, run.json seed equals N, and the BFA live-versus-bench comparison is repeated on a pinned seed.
- Reported by: prep-delivery: R13-PD-01 (new): the capture harness labels every live run 'seed 1', but real-key runs have drawn a fresh seed since release 17, so no round-13 run's seed is known | combat-encounter: R13-EV01: every live run is labelled 'seed 1', but runs from real keys draw a fresh random seed; the live outcomes cannot be replayed | gap-capture: R13G-09 (harness, not product): earlier round-13 'seed 1' live captures were not on seed 1

### 68. PR-0191 [polish] (carried, not re-tested)

**PR-0191 (ZG-1): during Zanmato the gauge panel already reads 0% and 'Next: Daigoro', and the full-gauge banner can last about 0.6 s**

Game FFX only · chapter IX · category feel

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Drive the gauge view from the presented overdrive-gauge event (or hold the full state until Zanmato's action-end), and let the banner finish its hold even if the reset arrives.

### 69. PR-0121 [polish] (carried, not re-tested)

**At 3840x2160 the pause plate stops at 3380x1931 and leaves black bands**

Game both · chapter all · category visual

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: In the pause framing (src/app/screens/pause/PortraitStage.ts place(), fed by framePlate or the framer), never let the plate box fall below cover size for the viewport. Allow an upscale past the 2x master's natural size, or feather that edge when the cap applies. Not traced to the exact line.

### 70. PR-0184 [polish] (carried, not re-tested)

**R12-VIS-02 (new): the Chapter IX night-sakura arrival shows a straight side cut on the tree and hangs the canopy above the horizon**

Game FFX · chapter yojimbo-cavern (Chapter IX), battle-start arrival sequence · category visual

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Rendering only (the approved PNG stays untouched): anchor the overlay quad's base to the floor plane behind the pad, and widen the quad's side alpha falloff in src/scenes/cavern-stolen-fayth-arrival.ts (suspected).

### 71. PR-0185 [polish] (carried, not re-tested)

**R12-VIS-03 (new): Chapter IX enemy-action and arrival shots slice the party's heads at the bottom edge**

Game FFX · chapter yojimbo-cavern (Chapter IX), Kimahri attack result, Yojimbo's actions, arrival · category visual

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Lower the Yojimbo shot's camera or pull it closer on src/scenes/cavern-stolen-fayth-rigs.ts, so the party is fully below the frame or a deliberate shoulder silhouette.

### 72. PR-0188 [polish] (carried, not re-tested)

**R12-UI-02 (new, Ch IX): the intent card describes Yojimbo's Daigoro order as 'non-elemental damage to itself - never misses.'**

Game ffx · chapter yojimbo-cavern · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: In describeAbility, give formula 'none' with no status effects its own sentence (an order or a no-damage action), and never pair 'damage' with targeting 'self' for a no-power row.

### 73. PR-0189 [polish] (carried, not re-tested)

**R12-UI-03 (new): labels shown truncated: FFX-2 'CHA… CURSED', the pause CHAPTER tab's 'DRESSPHE…', and the advisor effect chip cut at the card's slanted edge**

Game both · chapter ffx2-bahamut (Change row, pause), seymour-flux (advisor chip) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Let a status tag wrap under the label or shrink it, never the command name. Widen the pause party column, or put the dressphere under the name. Wrap the effect chip inside the card's inner box.

### 74. PR-0190 [polish] (carried, not re-tested)

**R12-UI-04 (new, PLAUSIBLE): during an FFX turn cut-in the arrows already move the lifted command cascade, but the first Enter only ends the cut-in, so a confirm on the highlighted row is lost**

Game ffx (PR-0005 option B lift is FFX only) · chapter seymour-flux (Kimahri's first turn); likely every FFX turn with a cut-in · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Hold arrow input while the cut-in is up, or forward the confirm press to the menu after dismissing the cut-in.

### 75. PR-0192 [polish] (carried, not re-tested)

**ADV-X2-1: in FFX-2 the advisor's revive reason says 'Only Yuna can call an aeon' (an FFX concept in FFX-2)**

Game FFX-2 only · chapter VI (any FFX-2 chapter with Yuna KO'd) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Gate the 'call an aeon' clause on the FFX game (or on the fallen actor actually having a Summon command in state). FFX unchanged.

### 76. PR-0193 [polish] (carried, not re-tested)

**TGT-LBL: the multi-target field label is a fixed 13 px and sits partly under the intent card at 2560x1440 (FFX-2 Ch VI)**

Game both · chapter VI (FFX-2); III (FFX) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Scale the label with the stage and floor it at 14 px. Add the intent card to the label's avoid list.

### 77. PR-0194 [polish] (carried, not re-tested)

**PR-0194: Chapter V: Jecht's Farplane line repeats six times in about four minutes on link 2**

Game FFX-2 only · chapter V, link 2 (the Leg) · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Cap the 'farplane-voice' pool at two showings per battle, or add a cooldown.

### 78. PR-0187 [polish] (carried, not re-tested)

**R12-FN-02: the Chapter III results card fires '...Okay. Next one.' between Yu Yevon's death and the FFX ending**

Game FFX only · chapter braskas-final-aeon, results between post and epilogue · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. The fix is in source (Chapter III results card silent); not seen live because Chapter III was not won this round. Next correction: Set victoryQuips to {} for braskas-final-aeon, as Chapter IX does.

### 79. PR-0171 [polish] (carried, not re-tested)

**PR-0171 (carried, widened): the pause CHAPTER tab's text column crosses the hero plate's face in battle as well as over a scene, now also on Chapter IX**

Game both · chapter II, IX · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Move the scene column to the side away from each plate's face, or dim and inset it; hide THE PARTY while a scene has no party.

### 80. PR-0168 [polish] (carried, not re-tested)

**PR-0168 (carried, widened to Chapter IX): the pause SCENE row prints the internal scene key**

Game both · chapter III, VIII, IX · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Read chapter.location, not sceneKey

### 81. PR-0019 [polish] (carried, not re-tested)

**The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending**

Game both (shared help-slab composition); observed in FFX · chapter 1 (Seymour Flux) · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.

### 82. PR-0010 [polish] (carried, not re-tested)

**The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest**

Game both (shared panel) · chapter 1 and 2 shown; anywhere the body overflows · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.

### 83. PR-0146 [polish] (carried, not re-tested)

**PR-0146 (carried): the enemy-intent panel shows over the title-card crossfade**

Game FFX-2 (observed ch4) · chapter ffx2-bahamut · category feel

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Mount the intent panel only after the battle-start moment resolves.

### 84. PR-0120 [polish] (carried, not re-tested)

**PR-0120 (carried, widened to FFX-2): the results painting stops short of the right edge at 2000x1012**

Game both · chapter yojimbo-cavern (IX) and ffx2-leblanc (VI) results · category visual

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Size the painting panel to the window, not the 16:9 stage.

### 85. PR-0137 [polish] (carried, not re-tested)

**PR-0137 (carried): Bahamut's painting still shows white matte holes in the wings (not an approved file)**

Game both · chapter ffx2-leblanc and ffx2-bahamut at 2000x1012 and 1600x900; seymour-flux battle camera · category visual

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: As filed in round 11.

### 86. PR-0177 [polish] (carried, not re-tested)

**Ch8 FAR range: Evrae shrinks to a thin streak, further than approved option A**

Game FFX only · chapter Ch VIII after Pull back · category visual-target

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Raise Evrae's FAR scale and opacity toward the target frame.

### 87. R15-02 [polish] (carried, not re-tested)

**R15-02 (carried from the release-15 focused review): the Chapter IX sakura backdrop request is aborted on every entry**

Game FFX only · chapter Chapter IX · category delivery

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: As filed.

### 88. PR-0130 [polish] (carried, not re-tested)

**After E, the FFX advisor card folds but its 'N HIDE MOVES' chip stays alone mid-screen, and the chip still says HIDE**

Game FFX · chapter seymour-flux (1), yunalesca (2) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Hide the chip whenever the card declines placement.

### 89. PR-0110 [polish] (carried, not re-tested)

**Residual: the 'N HIDE MOVES' chip text shows through the FFX-2 first-turn coach card**

Game FFX-2 · chapter ffx2-leblanc (6) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Hide the chip while the coach mark shows.

### 90. PR-0027 [polish] (carried, not re-tested)

**Literal asterisks in the Yunalesca intent counter: 'the target *she* last picked'**

Game FFX · chapter yunalesca (2) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Remove the asterisks from the string.

### 91. PR-0026 [polish] (carried, not re-tested)

**The chapter 1 guide still leads with 'Haste is ctb x 8/16'**

Game FFX · chapter seymour-flux (1) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Reword the line.

### 92. PR-0074 [polish] (carried, not re-tested)

**The advisor's composed sentences are still broken or repetitive English**

Game both · chapter ffx2-leblanc (6), braskas-final-aeon (3), ffx2-bahamut (4) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Template per effect kind; drop the duplicated effect line.

### 93. PR-0162 [polish] (carried, not re-tested)

**Chapter VIII strategy guide reads 'Cid pulls the Tidus's ship out of reach' (the actor substituted into a possessive)**

Game ffx · chapter evrae-airship · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. src/data/guides/evrae.ts changed d9decadb..76f587c3 (12 lines); not traced to the line. Next correction: Fix the Pull back and Close in guide template string.

### 94. PR-0163 [polish] (carried, not re-tested)

**Evrae's Pull back order is shown as 'Pull back → Tidus', naming the actor as its target**

Game FFX · chapter evrae-airship (8) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Suppress targetName for self-only trigger rows.

### 95. PR-0113 [polish] (carried, not re-tested)

**The phone chapter board runs the party names together ('YUNARIKKUPAINE'), and BEST slides under the hint bar**

Game both · chapter board, ffx2-bahamut selected · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Add a gap between names; reserve the hint bar's height.

### 96. PR-0145 [polish] (carried, not re-tested)

**PR-0145 (carried, re-probed): all three girls petrified is not an immediate Game Over; the helpless party is beaten down over 23-60 s**

Game FFX-2 only · chapter ffx2-leblanc logos/last room; ffx2-vegnagun-shuyin tail · category combat

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: End the battle as a defeat when no living party member is free of Petrify.

### 97. PR-0106 [polish] (carried, not re-tested)

**The same 'After her [N] turn' wording is read two ways in Leblanc's script, and the failsafe reading is not labelled**

Game ffx2 · chapter ffx2-leblanc Act III · category combat

Carried from round 12 (last observed 5ddfde3 (round 10), reused); not re-tested in round 13. Next correction: Label the failsafe reading AUTHORED in the comment and the test name, or make it fire on the single turn 25+uses.

### 98. PR-0107 [polish] (carried, not re-tested)

**Acts II and III open with every ATB gauge at zero, although they are separate battles**

Game ffx2 · chapter ffx2-leblanc Acts II and III · category combat

Carried from round 12 (last observed 5ddfde3 (round 10), reused); not re-tested in round 13. Next correction: Let a group flag its link as a separate battle, so it gets 'normal' randomised gauges while keeping carried HP and MP. Chapter 6 only; the chapter 5 chain is out of scope.

### 99. PR-0108 [polish] (carried, not re-tested)

**The Fast-speed Sleep rule from §1.5 is neither built nor recorded as left out**

Game ffx2 · chapter All FFX-2 chapters, Config ATB SPEED = FAST · category combat

Carried from round 12 (last observed 5ddfde3 (round 10), reused); not re-tested in round 13. Next correction: Implement the rule (Sleep has no timed expiry at Fast), or record the omission as a decision.

### 100. PR-0069 [polish] (carried, not re-tested)

**The possessed-aeon mirror does not mirror affinities, although the source comment says it does**

Game FFX · chapter 3 (Braska's Final Aeon, the possessed-aeon links) · category combat

Carried from round 12 (last observed 5ddfde3 (round 10), reused); not re-tested in round 13. Next correction: Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.

### 101. PR-0054 [polish] (carried, not re-tested)

**The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference**

Game FFX-2 · chapter ffx2-vegnagun-shuyin, link 2 · category combat

Carried from round 12 (last observed 5ddfde3 (round 10), reused); not re-tested in round 13. Next correction: Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.

### 102. PR-0053 [polish] (carried, not re-tested)

**A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation**

Game FFX-2 · chapter ffx2-vegnagun-shuyin · category combat

Carried from round 12 (last observed 5ddfde3 (round 10), reused); not re-tested in round 13. Next correction: Recover or re-derive the record before the next batch; do not repair anything on this entry alone.

### 103. PR-0124 [polish] (carried, not re-tested)

**PR-0124 (narrowed): the MP overflow is fixed on live; the dressphere a girl wears still reverts at a chain seam, and whether it should is unsourced**

Game FFX-2 only · chapter ffx2-leblanc links 2-3; ffx2-vegnagun-shuyin links 2-5 · category combat

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Ask Bailey or check on a real copy. If the dressphere should carry, carry currentDressphere in BattleScreenSetup.carryFfx2.

### 104. PR-0007 [polish] (carried, not re-tested)

**PR-0007 (carried, recommend reclassify to information): Zombie then Full-Life leaves no counter-play window because of sourced CTB math, not a mechanics defect**

Game FFX only · chapter seymour-flux · category encounter

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Close as a combat/encounter defect. Carry the wording change to the interface/onboarding batch, with options shown to Bailey (hard rule 9).

### 105. PR-0159 [polish] (carried, not re-tested)

**Chapter VIII dialogue has no contractions in any of its 47 lines, so Tidus, Rikku, Wakka and Cid all sound stilted and alike**

Game ffx · chapter evrae-airship · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: A voice pass on the Chapter VIII lines only: restore natural contractions and each speaker's tics. Keep the beats and the line count.

### 106. PR-0160 [polish] (carried, not re-tested)

**Brother's Al Bhed line prints as plain English, then Rikku 'translates' what the player just read**

Game ffx · chapter evrae-airship · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Encipher Brother's FFX lines (a DialogueBox or say option) and let Rikku's line carry the content, or have Brother speak in a mix of Al Bhed and English.

### 107. PR-0161 [polish] (carried, not re-tested)

**Chapter 5's Farplane voices (Braska, Auron) are staged as present speakers with full portraits and role plates**

Game ffx2 · chapter ffx2-vegnagun-shuyin · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: This is a perceivable change, so it needs options for Bailey first. For example: an off-screen voice treatment (italic text, a 'from the Farplane' plate, a faded or pyrefly-veiled portrait).

### 108. PR-0102 [polish] (carried, not re-tested)

**PR-0102 (carried): '*better*' asterisks are still in Leblanc's aftermath line**

Game ffx2 · chapter ffx2-leblanc · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Drop the asterisks.

### 109. PR-0134 [polish] (carried, not re-tested)

**PR-0134 (carried): the Chapter VI card's BOSS row reads 'Ormi + Dr. Goon + Fem-Goon'**

Game ffx2 · chapter ffx2-leblanc · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: List Leblanc, Logos and Ormi (or the three acts).

### 110. PR-0147 [polish] (carried, not re-tested)

**PR-0147 (carried): all three Leblanc acts play in the one heart room, after the seam line '...Okay. Next room.'**

Game ffx2 · chapter ffx2-leblanc · category narrative

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Reword the seam line (the cheap fix), or offer Bailey per-act backdrop options.

### 111. PR-0103 [polish] (carried, not re-tested)

**Two Act III KO beats assume Logos falls before Ormi: kill Ormi first and a KO'd Ormi shouts, and Paine calls for the already-dead Ormi**

Game FFX-2 only · chapter ffx2-leblanc, Act III · category narrative

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Give 'logos-down' an Ormi-already-down variant (Leblanc alone), or split the trigger with a condition on Ormi's state.

### 112. PR-0037 [polish] (carried, not re-tested)

**Mid-battle beats hard-code speakers who are not in the active formation**

Game FFX observed; the same shape exists in the other chapters' midScripts · chapter 1, beat 'first-zombie' · category narrative

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.

### 113. PR-0158 [polish] (carried, not re-tested)

**Downgraded from critical: a racing debug harness (not a player) can tear an FFX battle down with 'Cannot read properties of null (reading syncHud)'; a real Escape at 0.5-4 s after battle mount is handled correctly**

Game both-unknown (reproduced in FFX ch1 only) · chapter seymour-flux (reported); others unknown · category delivery

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Guard the pause-open path while the presenter is not yet bound: the hotfix 12.3 worktree already targets this, per NOW.md.

### 114. PR-0164 [polish] (carried, not re-tested)

**Yunalesca's approved painting edges show as hard straight lines in battle: the attack pose's hair is cut by its canvas edge, and a pale hard-edged rectangle shows over her quad at the hit moment**

Game FFX only (defect case); a render-side fix would be shared plumbing (both) · chapter yunalesca (II) · category visual

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Do not replace the painting. Either feather alpha within a few pixels of each character quad's border in the sprite shader, or put an outpainted edge extension to Bailey as an explicit revision.

### 115. PR-0117 [polish] (carried, not re-tested)

**Phone pause: the chapter eyebrow is printed over the GARMENT GRID row, and the grid name is cut ('PROTECTION ...')**

Game FFX-2 · chapter ffx2-bahamut (4) (previously ch6) · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Reserve the eyebrow's height in the phone stats column, or let the stats scroll.

### 116. PR-0169 [polish] (carried, not re-tested)

**The advisor badges a move 'GUIDE'S PICK' while the guide card beside it names a different move**

Game FFX-2 · chapter ffx2-vegnagun-shuyin (5), link 1 first menu · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Show the badge only when the suggestion equals the guide's NEXT row, or rename it (for example 'Chapter plan').

### 117. PR-0114 [polish] (carried, not re-tested)

**The Seymour and Anima silhouette still draws through the 'Coming' badge**

Game FFX · chapter board · category interface

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Raise the badge's z-index.

### 118. PR-0172 [polish] (carried, not re-tested)

**Defeat results: the vertical chapter title runs into the CHAPTER SELECT button**

Game both (seen Ch8 FFX) · chapter Ch VIII defeat results · category layout

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Cap the vertical title height above the button row, or shorten it.

### 119. PR-0173 [polish] (carried, not re-tested)

**R11-PD-02: 239 unreferenced art variant files (126 MB) ship in every build**

Game both · chapter n/a (artifact) · category delivery

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Exclude *.raw.png and numbered variant files (plus audio/candidates, PR-0100) from the dist copy in the build or deploy step. They stay on disk and in D:\Tools\pyrefly-art-backup.

### 120. PR-0175 [polish] (carried, not re-tested)

**Ch5 link 5: a stray reticle labelled with raw ids 'vegnagun-leg' / 'vegnagun-head' at the top-left corner**

Game FFX-2 only · chapter Ch V ffx2-vegnagun-shuyin, link 5 opening dialogue · category targeting

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Drop reticles and plates for combatants not in the current link, and fall back to the display name, never the id.

### 121. PR-0178 [polish] (carried, not re-tested)

**Targeting s1: ally brackets cross the command menu; no TARGET plate**

Game FFX only · chapter Ch III (any FFX all-ally spell) · category visual-target

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Clip brackets behind the command stack (z-order) and add the target plate.

### 122. PR-0071 [polish] (carried, not re-tested)

**autoBattle('intended') loses Ch1 seed 1 and stalls on the Ch5 Tail link on the newest builds**

Game both · chapter Ch I, Ch V · category tooling

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Re-measure the intended lines on the current tree (40 seeds) and repair the tactic, or record why they changed.

### 123. PR-0166 [polish] (carried, not re-tested)

**Review evidence identity: the capture harness hard-codes 'bundle 81kxOXnv (main 76f587c3)', and the live site was replaced mid-capture (bcbdb483 at 17:52Z, then dc2669ac, e3b8c2a3, a999d133), so later runs carry a label they cannot prove; four captures also do not show their labelled state**

Game both · chapter review tooling · category process

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Record the loaded bundle from the page in every run.json and refuse to label otherwise; for a deep review of a sha that may be replaced, capture against a local build of that sha.

### 124. PR-0151 [polish] (carried, not re-tested)

**Pause OPTIONS labels are cut with ellipses at 1280x960 (MASTER VOL…, SOUND EFFE…, STRATEGY GU…)**

Game both (seen in chapter 6) · chapter ffx2-leblanc · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Widen the settings column or wrap the labels at 4:3.

### 125. PR-0131 [polish] (carried, not re-tested)

**The chapter 1 advisor chains Phoenix Downs into immediate re-KOs: Yuna revived 7 times, KO'd again before acting after 6 of them**

Game FFX only · chapter seymour-flux attempt 1 · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Build the degenerate-board matrix CHK-005 asks for first; then weigh revive advice against the next enemy action the intent model already predicts.

### 126. PR-0136 [polish] (carried, not re-tested)

**At party scale the Syndicate and goons queue in one diagonal file right behind the party**

Game FFX-2 only · chapter ffx2-leblanc links 1-3 · category visual

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Re-space the chapter 6 enemy slots toward stage right.

### 127. PR-0139 [polish] (carried, not re-tested)

**The intent panel keeps naming a KO'd enemy for up to 4.5 s ("ORMI ACTS NEXT Concussive Blast" after Ormi falls)**

Game FFX-2 as observed (shared panel) · chapter ffx2-leblanc Act III, Ormi killed first · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Recompute the intent on ko events and skip combatants at 0 HP.

### 128. PR-0140 [polish] (carried, not re-tested)

**Commit 0bd85cc states no game case (CHK-021)**

Game both (FFX ch7 data, FFX-2 ch6 meta, shared results layout) · chapter 6, 7, 8 · category process

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Add the per-part case (Seymour spriteKey FFX only; Leblanc heroArt FFX-2 only; results layout both) to the chapter handoffs.

### 129. PR-0141 [polish] (carried, not re-tested)

**critic-plan --json omits chapter 6 from the chapters this review owes**

Game FFX-2 only · chapter ffx2-leblanc · category process

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Derive the plan's chapter list from the registry (encounters.ts minus LOCKED_CHAPTER_IDS).

### 130. PR-0081 [polish] (carried, not re-tested)

**Chapter 5 is 250 actions and 6:21 at FAST; the 5.15 s per action of round 08 does not reproduce (1.52 s per action on the candidate)**

Game FFX-2 only · chapter ffx2-vegnagun-shuyin · category feel

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: As round 08.

### 131. PR-0119 [polish] (carried, not re-tested)

**The chain coach mark covers the act-one-cleared dialogue card for about 2 s**

Game FFX-2 only · chapter ffx2-leblanc seam 1->2 · category onboarding

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Suppress or queue coach marks while the story card layer is visible.

### 132. PR-0083 [polish] (carried, not re-tested)

**Four source files were pushed further past the 400-line house limit by this batch**

Game both · chapter n/a (house style) · category process

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Split the four at the next change that touches them, rather than as a separate refactor.

### 133. PR-0036 [polish] (carried, not re-tested)

**The FFX-2 party crowds the left third of the stage while two thirds of it is empty**

Game FFX-2 · chapter 4 · category visual

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.

### 134. PR-0028 [polish] (carried, not re-tested)

**H does not hide the panels it is labelled for during battle**

Game both · chapter 1 to 5 · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.

### 135. PR-0029 [polish] (carried, not re-tested)

**Yu Pagoda A and B carry no always-on field marker**

Game FFX · chapter 3, battle 1 of 7 · category interface

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.

### 136. PR-0062 [polish] (carried, not re-tested)

**The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody**

Game FFX-2 · chapter ffx2-vegnagun-shuyin, link 2 · category process

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.

### 137. PR-0210 [suggestion]

**PR-0210 (new; R13-C04, information for Bailey): D-171 (an enemy hit closes the open menu, built in this range) rests on a reading that research §9.2 withdrew on 2026-09-26**

Game ffx2 · chapter every FFX-2 chapter under Active or the Wait split's top list · category combat

- Observed: Engine at b975397b: an enemy hit on a girl whose top-level menu is open closes it (commit 07af1f90; bench 'menus invalidated' ch5 at 1 s: 1,261). research/ffx2-combat-core.md §9.2 (ea05f877, after this build) corrects §1.1: Split's example ties the menu cancel to Delay-effect (DELEF) attacks, not to every hit.
- Expected: The latest owner decision governs (D-171, adopted). The sources now say only Delay-effect abilities cancel the menu.
- Repro: Any FFX-2 chapter on the Wait split: leave the top list open while an enemy lands an ordinary hit.
- Evidence: git show ea05f877 (§9.2 row 'Does a hit reset the gauge or cancel a command?'); docs/target/decisions.json D-171; critic/rounds/round-13/combat-deep/bench-ffx2.log
- Confidence: high
- Requirement: combat correctness versus an owner decision (RUBRIC §2: latest explicit owner decision; canon stays a requirement)
- Smallest fix: Put the corrected reading to Bailey once: keep D-171 as an approved adaptation, or limit the menu close to DELEF abilities.
- Acceptance: decisions.json records Bailey's answer, and the engine matches it.
- Reported by: combat-encounter: R13-C04 (information for Bailey): D-171 (every enemy hit closes the open menu) rests on a reading that research §9.2 withdrew on 2026-09-26

### 138. PR-0217 [suggestion]

**PR-0217 (new, question from the confirmer): the FFX engine keeps Zombie across KO and revive (12 KOs, no status-remove, Chapter III live logs); research/ffx-combat-core.md does not say whether KO clears Zombie**

Game ffx · chapter III braskas-final-aeon (observed); any FFX Zombie board · category combat

- Observed: braskas-final-aeon-win and -win-r2 battle logs: Yuna's Zombie (added seq 1209 / 1164) survives every KO and Phoenix Down revive.
- Expected: Unknown: the research does not state it (grep of ffx-combat-core.md for Zombie with KO / revive finds only the Life / Phoenix Down kill rule).
- Repro: Read the two battle logs for status events on yuna after each ko.
- Evidence: critic/rounds/round-13/evidence/braskas-final-aeon-win/battle-log.json; braskas-final-aeon-win-r2/battle-log.json; research/ffx-combat-core.md l.560, l.1680
- Confidence: high for the observation; the rule is unsourced
- Requirement: AGENTS.md rule 6: never invent game data; if unsourced, leave it alone and say so
- Smallest fix: Source the rule (GameFAQs preferred when sources conflict) before any change.
- Acceptance: research/ffx-combat-core.md states whether KO clears Zombie, with sources; the engine is then checked against it.
- Reported by: confirm: The advisor tells a Zombie Yuna to drink an Elixir (correction note)

### 139. FOC18-06 [suggestion]

**Question for Bailey: Chapter XIV's trimmed pause-card copy is an agent's inference**

Game ffx · chapter isaaru-via-purifico (XIV) · category —

- Observed: 'Summoner Against Summoner' / 'three aeons, one fayth each' are recorded as INFERRED in NOW.md (D-186)
- Expected: copy Bailey has named
- Repro: pause in Chapter XIV, CHAPTER tab
- Evidence: critic/reviews/b975397b-focused/cand-isaaru-via-purifico-pauseprobe-esc-1600x900.jpg
- Where: src/data/chapter-meta-isaaru.ts
- Confidence: high
- Requirement: RUBRIC §7: an inferred item never fails a build; it is asked
- Smallest fix: ask Bailey
- Acceptance: Bailey's recorded answer

### 140. PR-0196 [suggestion]

**PR-0196 (carried): the targets.json tile 'Yojimbo's look' points at a missing file**

Game FFX only · chapter yojimbo-cavern (IX) · category visual-target

- Observed: The tile's src docs/concepts/chapters/yojimbo/boss/a-new-frame.jpg does not exist, so the composite cannot be made (pairs.mjs MISSING).
- Expected: Tile src resolves.
- Repro: node critic/rounds/round-13/targets/pairs.mjs
- Evidence: critic/rounds/round-13/targets/pairs.json
- Confidence: high
- Requirement: RUBRIC section 7 (each required target has a reference)
- Smallest fix: Point the tile at the existing a-repaint-frame.jpg (what round 12 used), or restore the file.
- Acceptance: All 69 required tiles resolve their src.
- Reported by: visual-targets: PR-0196 (carried): the targets.json tile 'Yojimbo's look' points at a missing file

### 141. PR-0213 [suggestion]

**PR-0213 (new; R13-VIS-06, harness): two 'mid-fight' captures are pause frames and four 16b captures are pause because targeting never opened; the assertion accepts 'in battle' where it should require the named state**

Game both · chapter seymour-flux, seymour-natus (23-midfight); yunalesca, seymour-omnis, phone runs (16b) · category tooling

- Observed: The index staleRoots records screen=pause, while 'asserted' reads 'in battle'. The Omnis target probe never reached a target state (a scripted disc lesson line took the Attack).
- Expected: A failed state wait records UNVERIFIED (CHK-016).
- Repro: critic/rounds/round-13/cap/route.mjs, the step before 23-midfight and 16b.
- Evidence: critic/rounds/round-13/evidence/index.json; critic/rounds/round-13/evidence/target-seymour-omnis-1600x900/run.json
- Confidence: high
- Requirement: CHK-016
- Smallest fix: Make the midfight snap assert screen==='battle' (resume first). Only press Esc for 16b when targetsShown is non-empty. Retry the Omnis target probe after the disc-lesson line.
- Acceptance: No index item whose staleRoots.screen differs from its asserted screen.
- Reported by: visual-targets: R13-VIS-06 (harness): two 'mid-fight' captures are pause frames, and four 16b captures are pause because targeting never opened

### 142. PR-0167 [suggestion] (carried, not re-tested)

**Records question for Bailey: mark the v5 pause (2000x1012, party panel) and v6 phone pause tiles as superseded by the approved Until Dawn remake**

Game both · chapter pause · category visual

Carried from round 12 (last observed 5be4babe); not re-tested in round 13. Next correction: Ask Bailey. Until he answers, these 3 tiles are counted as waiting.

### 143. PR-0149 [suggestion] (carried, not re-tested)

**A transient 5xx on a pose sidecar is not retried: the pose silently loses its scale, anchor and facing metadata**

Game both · chapter braskas-final-aeon (observed 503) · category delivery

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Retry once after about 500 ms on a 5xx or a thrown fetch in tryLoadMeta and tryLoadTexture.

### 144. PR-0044 [suggestion] (carried, not re-tested)

**16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them**

Game both (15 of the 16 are FFX-2 dresspheres) · chapter n/a · category visual

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.

### 145. PR-0072 [suggestion] (carried, not re-tested)

**Vegnagun has no ground contact and Paine stands inside its cannon barrel**

Game FFX-2 · chapter 5 (Vegnagun and Shuyin) · category visual

Carried from round 12 (last observed 5ddfde3 (round 10)); not re-tested in round 13. Next correction: Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.

## Resolved, merged, downgraded and refuted this round

- **Resolved PR-0076**: Chapter V won by real keys on the shipped default X-2 BATTLE WAIT: 2 of 3 first-wave attempts (36:30 over 255 commands with no scripted spherechange; a RETRY win at 1600x900) and a gap-pass win on the first attempt with the seed pinned to 1 (258 commands, 38:50, all seams, post scene, results, board). Evidence: evidence/ffx2-vegnagun-shuyin-win-nochange/, -win/, gaps/ffx2-vegnagun-shuyin-win-seed1-waitsplit/.
- **Resolved PR-0105**: D-171 built: an enemy hit closes the open top-level menu (bench 'menus invalidated' 12 -> 348 on Chapter IV at 1 s). See PR-0210 for the withdrawn research premise.
- **Resolved PR-0008**: Settled by owner decision D-172 (Chapter I re-baselined and a fresh first-attempt seed); the gap pass confirms that pinned seed 1 opens with Tidus as the engine does. The intended line on seeds 1-40 is 17/40, now a known and owner-accepted baseline.
- **Resolved PR-0129**: FFX-2 half verified live: boss-vegnagun on links 1-4, boss-shuyin at link 5 with no false start, victory-ffx2 at results, in both first-wave Chapter V wins (audio CHK-023).
- **Resolved PR-0067**: The 390x844 chapter select v2 shows both game groups in the first frame with TAP hints (ffx2-fallen-aeons-win-phone/03-card.png).
- **Resolved PR-0165**: VII COMING now sits in number order; the COMING card being unselectable is by design for a locked chapter (D-183 option C, board walk skips VII).
- **Resolved R13-04**: Not reproduced: the gap pass captured the Chapter VIII first menu with Orders open at 2000x1012 and 1600x900 and Tidus stands clear of the stack at both sizes (probe-shape-evrae-airship-*).
- **Downgraded PR-0197** (major to polish): Its premise ('seed 1, which every fresh profile gets') is false for this build (D-172, PR-0202); the remaining bench gap (24 vs 27 of 40) is not meaningful.
- **Downgraded PR-0066** (major to polish): Chapter select v2 replaced the measured board; the focused review measured the remaining phone text at 12 px (FOC18-03).
- **Refuted R13-VIS-04**: Refuted by the gap pass (probe-board-xii-seq-1600x900: 11 frames about 135 ms apart; selectedId seymour-omnis from 53 ms; hero art, title, dossier and highlight stable for 1.4 s, no black plate).
- **Refuted IC-1 (lone-survivor chain lock)**: Not reproduced on the live build: 0 party-side immune chains in 8 live logs, 480 bench chains and the gap pass. The code-level root stays open as polish PR-0209 (enemy side only).
- **Refuted R13-CAP-01 premise**: 'Seed 1, which every fresh profile gets' is false for this build (D-172; PR-0202). The issue is kept, downgraded, as PR-0197.
- Merged: PR-0198 = R13-UI-01 + R13-CAP-02 + R13-C03 (one advisor defect: HP-restoring advice on a Zombie)
- Merged: PR-0199 = IC-2 + R13-C01 + R13G-02 (one FFX-2 engine defect)
- Merged: PR-0208 = R13G-01 + R13-E01 (the Chapter III live losses and their established cause on seed 1)
- Merged: PR-0201 = R13-VIS-01 + the capture owner's phone-edge note (Chapter XI phone framing)
- Merged: PR-0197 = R13-E02 + R13-CAP-01 (Chapter XII advisor and discs)
- Merged: PR-0204 = R13-FN-01 + R13G-05 (Chapter X Talk)
- Merged: PR-0202 = R13-PD-01 + R13-EV01 + R13G-09 (seed labels)
- Merged: PR-0157 absorbs R13G-06; PR-0126 absorbs R13G-08; PR-0123 absorbs the capture owner's intent headline note; PR-0115, PR-0182 and PR-0181 absorb the capture owner's carried notes; PR-0058 absorbs R13-VIS-05; PR-0176 absorbs FOC18-02; PR-0066 absorbs FOC18-03; PR-0109 absorbs FOC18-05

STALLED (open at the same severity in rounds 12 and 13; a method check is owed before a third batch): PR-0148, PR-0061, PR-0180, PR-0181, PR-0153, PR-0123, FOC-06, PR-0126, PR-0001, PR-0179, PR-0031, PR-0035, PR-0095, PR-0094, PR-0157, PR-0021, PR-0099.

## What stands between this build and acceptance

- **Evidence.** Audio has no owner listening verdict (CHK-B1, PR-0148). Two plan-owed items are untested: the Chapter III win path and an FFX-2 multi-target state. Frame time, non-Chromium browsers, real devices, gamepad and the save upgrade matrix (CHK-024) have never been measured.
- **Defects.** 33 majors are open. The heaviest for players: the advisor recommends heals on Zombies (PR-0198) and names an unlettered Pagoda (PR-0208), so the taught line loses Chapter III; the FFX-2 engine wraps all-target hits (PR-0199) and Acta heals the Head (PR-0200), both built on a branch and waiting for Bailey's pick; slow first menus (PR-0061); no FFX action names (PR-0180); Chapter XI phone framing (PR-0201); summon staging (PR-0181); honest intent on phone and desktop (PR-0207, PR-0153, PR-0123); small advisor text (FOC-06).
- **Real flow.** Chapter III (no live win on this build), VI and VIII (no real-key outcome this round) and locked VII.
- **Targets.** 5 failing, 5 unverified and 6 waiting.
- **Categories.** Every category must reach 9.0, and the total must reach 9.60 unrounded.
- **Human judgments.** 11 are not recorded (listed in round-13.json).

## What changed since round 12 (5be4babe)

- Chapter V is now winnable by real keys on the shipped default Wait split: 3 wins, one of them on a pinned seed with a replayable key log. PR-0076 is closed. This was the item that kept round 12's deep review owed.
- PR-0105 is closed (D-171 built). PR-0129 is closed on both halves. PR-0008 is settled by owner decision D-172. PR-0067 and PR-0165 are fixed on chapter select v2. R13-04 is not reproduced. The phone battle HUD is now the approved option B rail, which closes the battle half of PR-0001.
- Four chapters are newly listed (X, XI, XII, XIV). Their combat data is sourced, their scenes follow the sourced beats, and each completes its real flow live.
- New majors, none of them a regression:
  - the advisor's Zombie-heal advice (PR-0198);
  - the unlettered Pagoda target on the Chapter III card (PR-0208);
  - the FFX-2 all-target wrap and the Acta self-heal (PR-0199, PR-0200), both pre-existing and now confirmed live;
  - Chapter XI phone framing (PR-0201);
  - the phone intent certainty badge (PR-0207);
  - the Chapter I 2000x1012 advisor card (PR-0206).
- The first-wave captures mislabelled their seeds (PR-0202). The gap pass pinned the seeds and corrected three premises.
- Score movement against round 12, all under policy v2:
  - combat 8.6 to 8.7, encounter 8.7 to 8.8, visual 8.2 to 8.3, narrative 7.9 to 8.1, onboarding 6.9 to 7.1, delivery 8.0 to 8.2;
  - feel held at 7.8 and prep held at 8.5;
  - interface went from 7.3 to 7.2 after the chief's adjustment for PR-0208;
  - audio is still UNVERIFIED.
  - Rounds 02 and 03 are rubric v1 history and are not compared.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- Visible whole-menu hold for FFX-2 at human decision time (carried from round 12, FFX-2 only). Idea: offer the built whole-menu hold as a visible Wait choice beside the faithful split, or a first-turn coach line that opening a submenu stops the clock. Benefit: the benches drop from 39/40 at 0 ms to 14/40 at 1 s of top-list time in Chapter V (17/40 in VI, 25/40 in XI) and are flat under the hold. Cost: small, both exist. Fit and risk: the split is canon; the hold is an accessibility adaptation. Preview: a mockup of the pause OPTIONS row and the coach bubble.
- Chapter V checkpoint at the Shuyin link (FFX-2 only, from the prep auditor). Idea: RETRY after a link-4 or link-5 loss resumes there instead of restarting five links (36-39 min per attempt at the harness pace). Benefit: fewer 40-minute replays. Fit and risk: research puts the point of no return before the chain (ffx2-vegnagun-shuyin.md l.1127), so this is an adaptation, not a correction. Preview: the RETRY card with a 'Resume at Shuyin' row.
- A first-turn coach line in Chapter XII that teaches disc turning (FFX only). Idea: one Wakka / Lulu line when all four discs match, pointing at a Mortiphasm. Benefit: the fight's signature mechanic went unused in all 4 advisor-led live attempts (PR-0197). Fit: the guide already teaches it; research §3 sources the turn rule. Risk: coach clutter. Preview: a frame of the first Chapter XII menu with the bubble.

## Next review

The deep obligation stays PENDING on b975397b (critic-clear refuses it: two plan-owed items were not tested). A short follow-up deep pass on the live b975397b (or the next live build, which inherits the obligation) must capture (1) a Chapter III real-key win on a pinned seed with the Pagoda chosen by its letter where the card is ambiguous (the engine's seed-1 advisor run wins in 135 commands), through the post scene, the silent results card, the epilogue, the board and a reload; and (2) one FFX-2 multi-target target state by real keys. Every other result here is reusable for the same artifact with this report's dependency arguments. Before those runs the capture harness must pin and record the battle seed (PR-0202). Den of Woe (Chapter XV, merged on main after this build) owes its focused review before any deploy, and the deploy cap for an owed deep review applies (RUBRIC §4). Method checks are owed before the next batch touches the 17 STALLED majors (RUBRIC §8).

## Obligation settlement (tools/critic-clear.mjs, verbatim)

```text
  still pending deep: required coverage was not tested: CHK-022 for plan chapter braskas-final-aeon (FFX, Chapter III): the victory path on b975397b (post scene, the silent results card with the PR-0187 fix, epilogue, CONFIRM, board ribbon, reload). Five real-key attempts lost in link 1, the last on a pinned seed 1 that followed the card's unlettered 'Yu Pagoda' onto the wrong Pagoda and ended in the engine stalemate (PR-0208, PR-0198, PR-0215). Round 12's live win on 5be4babe cannot be reused: the FFX CTB engine, presenter, DialogueBox and scene runner changed since., CHK-010 (plan check), FFX-2 half: one FFX-2 multi-target (all enemies or all allies) target state by real keys. The probe aborted on a White Mage with no Attack row; src/ui/ffx2 targeting and placement code changed 5be4babe..b975397b, so round 12's FFX-2 target captures cannot be reused.
Exit code 2
```
