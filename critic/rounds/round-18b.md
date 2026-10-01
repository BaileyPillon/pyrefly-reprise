# Critic round 18b: deep re-review of release 33's fixed candidate f302f163

```text
Build / artifact / target version: main f302f163c6e53c506ef4d26683a31cba272696e8 (bundle index-DCYkAkI-.js), artifact ff26ce51ad23c791dafd678f2b8f750c10479e19bb80d899e05753bcb800299f (1,013 files, dist-gate in D:/pyrefly-rel26c), targets.json sha256 36693f81bb9c60aed0fdcccbb540f00fc235f6ea5facb9524100984f7610ef07
Review: deep (round 18b, re-review reusing round 18 with dependency arguments)
Deployment: NOT APPLICABLE (candidate, not deployed; CHK-017 owed after the deploy)
Changed area: FAIL (polish only: PR-0300 and PR-0301 regress FFX-2 seams against live; PR-0302/0303/0304 in the new hint card; PR-0281 and PR-0282 fixed and verified)
Ship: SHIP. No critical open, no major regression against live. Discloses 13 carried majors: PR-0264, PR-0148, PR-0099, PR-0265, PR-0283, PR-0269, PR-0267, PR-0244, PR-0268, PR-0266, PR-0270, PR-0284, PR-0222
Milestone: not assessed
Quality: provisional (audio UNVERIFIED: no ear verdict). Categories: combat 9.2, encounter 8.8, visual 9.1, feel 8.3, narrative 8.9, audio UNVERIFIED, interface 8.0, onboarding 8.4, prep 9.0, delivery 8.7
Targets: 86 required / 71 matched / 0 failing / 15 unverified / 6 waiting on decision
Top issues: PR-0264, PR-0148, PR-0099, PR-0265, PR-0283 (majors, all carried), then PR-0300 and PR-0301 (polish regressions vs live); details below
Coverage: tested XV by real keys to victory and defeat with Stop-carried seams, every FFX-2 seam with an injected Stop, O3 at 1600x900 / 2000x1012 / 390x844 in both games, release-32 saves, Ch I and IV end to end; reused round 18 for unchanged code; not tested: real browsers other than Chromium, real phone and controller, live artifact
Next required review and why: the live review of f302f163 after the deploy (CHK-017 exact artifact plus real-input smoke)
Elapsed review time / repeated work avoided: about 330 min wall clock; 13 chapters' flows, engine benches, art judgment and the save matrix carried from round 18 instead of replayed
```

## Score output (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: encounter, feel, narrative, interface, onboarding, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category encounter is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 13 critical or major issue(s) remain open
  - 15 required target(s) unverified
  - 6 required target(s) waiting
  - only 71 of 86 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix at V0 (CHK-B1, PR-0148)
  - human judgment not recorded: Audio: are attack and miss SFX audible at the new default (SFX b, D-293; PR-0263)
  - human judgment not recorded: Audio: 78.2 MB of music instead of the recommended ~73 MB (PR-0298)
  - human judgment not recorded: Save: moving a deliberate pre-release 0.35 SFX level to 0.70 (PR-0299, D-293 inferred half)
  - human judgment not recorded: Feel: steady pacing and the calm camera as defaults, and the +2.7 s they add to a hold-skip (CHK-B2, PR-0061)
  - human judgment not recorded: Visual: eye candy D in the running game against the D stills Bailey picked
  - human judgment not recorded: Onboarding: first-run step 1 wording when another chapter is selected (PR-0289)
  - human judgment not recorded: Narrative: Bailey's story read of the Sin chapters and the Ch VII aftermath (CHK-B3)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279) and the Chapter III gauntlet length (PR-0257)
  - human judgment not recorded: Feel: the FFX-2 chain seam opening now runs 2.9-3.1 s against 0.6-0.75 s on live (PR-0301): intended, or to be shortened?
  - human judgment not recorded: Encounter: Chapter XV difficulty at human pace (1 win in 7 real-key attempts on the advisor route; PR-0306) beside Sin (PR-0279) and XIII (PR-0227)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## Verdicts

- **deployment**: The candidate is not deployed; CHK-017 (exact artifact ff26ce51...) and live real-input smoke are owed after the deploy.
- **changedArea**: FAIL, narrowly and at polish level only. The r33-fix meets both acceptance cases (PR-0281 and PR-0282 fixed and verified), and the save-data change still passes (CHK-024 22/22 with release-32 saves). But the release-33 line regresses two things against live 32 at every FFX-2 chain seam (PR-0300 black plate band in XV; PR-0301 a 2.5-3 s slower hand-back), and the new cure-hint card still fails CHK-003 and CHK-008 in places (PR-0302, PR-0303, PR-0304). None of these is critical or major.
- **milestone**: not assessed: a deep review cannot accept a milestone.
- **ship**: SHIP: no critical is open; no major is a regression against live; the round-18 HOLD (PR-0281) is fixed and proven by real keys.

Ship reasons:

- SHIP: round 18's only HOLD reason, PR-0281 (the Chapter XV soft-lock at a Stop-carried seam), is fixed and verified by real keys: natural Stop-carried seams at Wait and ACTIVE with no stall, every FFX-2 chain seam crossed with an injected Stop, and a real-key XV victory through its aftermath.
- No critical issue is open, and no open major is a regression against live 1a6fd3cc or was introduced by this candidate; the save-data change passes CHK-024 with saves written by the release-32 artifact itself.
- Thirteen majors are carried and must be disclosed (PR-0264, PR-0148, PR-0099, PR-0265, PR-0283, PR-0269, PR-0267, PR-0244, PR-0268, PR-0266, PR-0270, PR-0284, PR-0222); every one exists on live too.
- Two polish regressions against live ship with it and should be named in the announcement: PR-0300 (a black right-edge band for about a second at each Chapter XV seam) and PR-0301 (FFX-2 chain seams hand control back about 2.5-3 s later). The release is still better than live, where release 32 lacks the whole release-33 line that round 18 judged to its targets.

## What changed since round 18

Verified by the chief: `git diff 65152c1b..f302f163 --stat` shows docs and critic records plus the r33-fix merge; the only product files are src/ui/common/status-o3.css, statusFigureTint.ts, statusHintCard.ts, withStatusLooks.ts, src/ui/ffx/FFXBattleHud.ts and hudAvoidSelectors.ts, with two new unit tests. The shipped tree differs from round 18's candidate only in index.html and the bundle js/css/map. Round 18 said HOLD on PR-0281 alone; that critical is fixed and verified, and PR-0282 is fixed for its acceptance cases. Round 18's scores move as follows, each with its reason in the category text: visual 8.9 -> 9.1 (the O3 collision major is gone), narrative 8.8 -> 8.9 (XV's beats and aftermath reachable again), interface 7.8 -> 8.0 (PR-0282 gone, four interface majors left), delivery 7.8 -> 8.7 (no lock; XV, XVII and XVIII cleared by real keys), feel 8.4 -> 8.3 (two new polish regressions at FFX-2 seams). Rubric v1 rounds 02 and 03 are not compared.

## Categories

### combat: 9.2

[Combat and encounter auditor, deep round 18b. PRODUCTION CANDIDATE main f302f163 (source D:/pyrefly-rel26c; dist-gate bundle index-DCYkAkI-.js, the r33-fix branch bundle named in docs/handoff/r33-fix.md l.117). No browser was opened and no server was started, so there was nothing to stop and no port to close. The only processes I started were vitest runs in D:/pyrefly-rel26c, and all of them have exited. Scratch is in D:/Final Fantasy/critic/rounds/round-18b/combat/.]

WHAT CHANGED. `git diff 65152c1b..f302f163 --stat` lists product changes in only six files:
- src/ui/common/status-o3.css, statusFigureTint.ts, statusHintCard.ts and withStatusLooks.ts
- src/ui/ffx/FFXBattleHud.ts and hudAvoidSelectors.ts

It also adds two tests (status-o3-hint-place, status-o3-stop-seam). Everything else in the diff is docs, decisions.json and critic records. `git diff 65152c1b..f302f163 -- src/battle src/data src/engine src/story src/app` is EMPTY. Round 18 found src/battle, src/data and tactics unchanged against live 32 (1a6fd3cc), so the engine, data and advisor are byte-identical to live and to round 18.

DEPENDENCY ARGUMENT FOR REUSE. The relevant code, data, settings and test assumptions are unchanged, and the fix touches presentation only (AGENTS rule 1: statusFigureTint imports pace.ts for a rate, nothing else). So round 18's combat evidence carries forward, labelled as reused:
- the O3 hint texts against ffx-combat-core §4.2 and ffx2-combat-core §2.8 (statusWords.ts unchanged)
- the Zombie cure data
- the PR-0267 Bushido numbers
- 16/16 FFX replays on the same engine

NEW EVIDENCE: FULL UNIT SUITE on f302f163 (vitest-full.json, about 140 s on a loaded host):
- 10,485 passed, 40 skipped, 1 failed.
- The failure is the same host-load timeout as round 18: strategy-ffx2-bahamut 'heal-only route' at 15 s. Re-run alone it passes 19/19 in 9.6 s (bahamut-rerun.txt).
- All of these pass: ffx-engine-golden, ffx2-atb-golden, ffx-ctb, ffx-ctb-locks, ffx-statuses, ffx2-statuses, ffx-formulas, ffx2-chain, ffx2-atb-speed, ffx2-status-locks, pace-option, status-o3-* (including the new stop-seam 3/3 and hint-place 6/6), and every den-of-woe and trema test.

NEW EVIDENCE: RUNTIME = ENGINE (CHK-023, ffx-replay.json). This round's two real-key FFX logs replay event for event at seed 1 through the pure candidate engine, with identical outcomes:
- seymour-flux-win: 671/671 events, 73 commands, victory; identical to round 18's 671
- seymour-flux-lose: 48/48 events, defeat

NEW EVIDENCE: PR-0281 COMBAT-SIDE RECHECK (den-stop-seam.json).
- Engine: Stop is written on Yuna in link 1. setupForNextLink carries it into Gippal (link 2) and Nooj (link 3), in both Wait and Active. The engine advances: Gippal opens with Grinder on Yuna and Nooj with Attack on Paine; ATB runs to 32.8 s and 37.2 s.
- Fixed mechanism, using the real StatusFigureTint and TweenGroup, with figures modelled on PaintedActor.update (one-shot moves at dt*paceRate('action') plus a separate idle clock): the Stopped girl's 520 ms slide finishes at 0.533 s, the same as the unstopped girl's. Her idle clock stays at 0 over 10 s, so the sourced FFX-2 freeze look (status-display.md l.155) is kept.
- Traced: PaintedActor.ts:1855 advances tweens by dt*paceRate('action'). The frozen wrapper (statusFigureTint.ts:211-215) calls tweens.update(dt*paceRate('action')) and then update(0). So a frozen figure's moves run at exactly the unfrozen pace, with no double advance.

RUNTIME LOGS (capture owner, real keys):
- XV seed 1: Yuna entered link 3 (Nooj) with Stop at elapsed 0. Stop ticked down in ticks (3 ticks/ms), expired naturally at seq 404, and the link ran 34 turns to a defeat at 46.2 s.
- XV seed 1001: Yuna entered Gippal Stopped and alive, and Gippal was beaten (victory at seq 522).
- XV seed 2: Yuna entered Gippal Stopped, 50 turns, defeat at 71.1 s.
- No elapsedMs-0 freeze in any of them (round 18's signature).

The O3 forecasts shown at runtime match the engine:
- FFX Zombie: 'HI-POTION ON A ZOMBIE -1000 KO' against 750 HP (gaps/flux-zombie-1600x900).
- FFX-2 Curse: 'cannot change dresspheres. Holy Water, Esuna or a Remedy cures it', with the CHANGE row marked CURSED.

CARRIED, unchanged code, not regressions:
- PR-0267 (major, Bushido fail bonus)
- PR-0269 (major, advisor loses the Sin races)
- PR-0273 (polish)
- PR-0217 (suggestion; Yuna zombie/KO seen again in Ch I)

The score equals round 18's 9.2. The engine and data are byte-identical, every re-run matched, and round 18 scored the PR-0281 lock in delivery, not combat, so fixing it neither lowers nor raises combat.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The confirmer re-ran the Bushido bench on the candidate engine (identical to round 18) and narrowed PR-0269: the advisor line loses XVII and won XVIII once on seed 1, so XVIII is unreliable rather than lost. Nothing moves the score: 9.2 held.

### encounter: 8.8

DEPENDENCY ARGUMENT FOR REUSE. Encounter data, AI, triggers, chain carry rules (BattleScreenCarry.ts / BattleScreenSetup.ts under src/app: diff empty) and tactics are byte-identical to round 18 (65152c1b) and to live 32. The benches are deterministic on identical inputs. Carried forward, labelled as reused:
- Round 18's three-line FFX bench, ffx-three-line-r18.json (53/53 rows identical to r17).
- The XV Stop-at-seam frequency bench, den-stop-frequency.json (seeds 1-200; sourced intended line: won 44/200 at Wait with 0 ms decisions, 3/200 at Active with 2.5 s decisions; 11-15% of intended runs and most no-Remedy mistakes enter link 2 with a girl Stopped). On f302f163 these runs now continue instead of locking.
- Sin difficulty (PR-0279), the Chapter III gauntlet length (PR-0257), Chapter XII v3 (PR-0280) and XIII's human-pace rate (PR-0227).

NEW REAL-KEY OUTCOMES on the candidate (capture owner, headless gpu):
- I Seymour Flux: won at 1600x900, 73 turns, the same as round 18; the replay is identical. Lost at 2000x1012 on a credible-mistake path (3 turns), and RETRY reached the battle.
- IV Bahamut: won at 2000x1012 (47 turns; Curse on Paine at seq 3, as sourced). Lost with X-2 BATTLE flipped to ACTIVE, and RETRY reached the battle.
- XV Den of Woe: 0/5 by real keys on seeds 1, 1001, 2, 1002 and 2002, all defeats. RETRY reached the battle each time.

The XV advisor route plays sensibly: Remedy is offered for Stop and Curse, Megalixir under Lightfall pressure, and Darkness on the shades. The closest loss had Nooj at 4,538/23,800. Real-key XV history on the identical engine: r15 1/2, r16 1/2, r17 1/4 (gap pass won on seed 1001), r18 locked, r18b 0/5. That is consistent with the bench at human pace. Party level at the Den is unsourced (research/ffx2-gippal-den-of-woe.md G-12 [estimate]), so this is a question for Bailey (R18b-CE-01), not a defect. No number may be tuned without a source.

INJECTED LANES (labelled hooks; they prove seams, not wins):
- XV crossed both seams with Stop carried (Rikku into Gippal, Yuna into Nooj). The menu came back 15.8 s and 17.4 s after the seams (1600x900), the battle-start moment lasted 2.85 s, and the run reached results. The same at 2000x1012.
- XIII carried Stop on Paine from Paragon into Trema. The menu came back 12.5 s after the seam at 1600x900 and 12.4 s at 390x844.
- Fallen Aeons, Leblanc and Vegnagun (4 seams) cleared Stop at the seams, as the carry rule says (only XIII and XV carry), with 2.8-3.4 s moments and no stall.
- Ixion held a Stopped girl for the whole fight and won.

Why the score stays at 8.8: nothing in encounter data, AI or tactics changed, and the reproducible figures match. XV is now finishable, but round 18 scored the lock in delivery. XV's victory aftermath on this build is unverified by real keys (see capturesNeeded); it does not lower encounter.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass won XV by real keys on the advisor route (seed 1001, 32 turns, both seams crossed) and lost one attempt at ACTIVE with a natural Stop on Rikku carried across seam 1->2 with no stall; XVII and XVIII were won through their aftermaths on the round-17 in-page policy. The XV rate (1 in 7 real-key attempts this round) is put to Bailey as PR-0306, not scored as a defect. 8.8 held.

### visual: 9.1

[visual-targets auditor, deep round 18b, PRODUCTION CANDIDATE main f302f163c6e53c506ef4d26683a31cba272696e8, D:/pyrefly-rel26c/dist-gate, bundle index-DCYkAkI-.js + index-CnNXz4UM.css, 1013 files. Not deployed, so the deployment verdict is NOT APPLICABLE.] I opened no browser and started no server, so I had no port to close. I judged only the capture owner's round-18b evidence: headless Chromium, PYREFLY_BROWSER=gpu (run.json mode 'gpu'), at 1600x900, 2000x1012 and 390x844 touch. Where I reused round-18 frames, the file name says so.

WHAT CHANGED: git diff 65152c1b..f302f163 --stat lists product code in 6 files only: src/ui/common/status-o3.css, statusFigureTint.ts, statusHintCard.ts, withStatusLooks.ts, src/ui/ffx/FFXBattleHud.ts and hudAvoidSelectors.ts. The rest is tests, docs and critic records. I hashed the dist-gate tree and compared it with round 18's artifact manifest of 65152c1b (critic/rounds/round-18b/visual/hashcheck-candidate.json). Only index.html and the bundle js/css/map changed. Every art, fx depth map, audio and font file is byte-identical.

PROTECTED ART: approved 290/290 and judge-locked 48/48 are byte-identical in dist-gate. verify-approved (ROOT=D:/pyrefly-rel26c) gives 338 ok, 0 mismatched, 0 missing.

CARRIED FROM ROUND 18 (reused, with a dependency argument): eye candy D rest grade, living paintings, the calm camera, the facing, scale and ground contact of all 16 capture chapters, enemy identifiability, painted portraits and plates, the 2560x1440 gap frames, and O2 steps 1 and 2. They depend on scene, sprite, fx, presenter and camera code and on art. All of that is byte-identical or untouched by the diff. The only presentation change is the FFX-2 Stop freeze in statusFigureTint.ts, which lets one-shot tweens run while the idle clock stays frozen, so it does not change how a figure looks at rest. My fresh spot checks agree. Round 18 and 18b frames of the same states are pixel-equivalent: cmp-x2-cursed-r18-vs-r18b.jpg and cmp-flux-third-menu-r18-vs-r18b.jpg. Fresh composites picks-eyecandy-d-ch1/ch4 still match the D rest stills, and st-routes.jpg shows Ch I and IV end to end through results and the board, plus the XV links.

NEW EVIDENCE, FOR:
(1) The round-18 O3 collision major (R18-VIS-01, filed as PR-0282) is fixed in both games.
- FFX 1600x900, guide folded: the ZOMBIE card sits at the top left, clear of N HIDE MOVES. hintOverAdvisor is false and cmdsCovered is 0 in 14 of 14 decisions (play-seymour-flux-1600x900-fold/d06.jpg).
- FFX-2 1600x900: the CURSE hint rides inside the guide panel, 0 overlap in 10 of 10 decisions.
- 390x844: the card docks just above the party chips in FFX (flux-zombie-390x844-touch/03-third-menu.jpg) and in FFX-2 (play-ffx2-bahamut-390x844-touch, 10 of 10 decisions, rect [8,436,374,44], cmdsCovered 0 and cmdsNotOnTop 0).
- BATTLE HELP OFF hides the card in FFX-2 on the phone (0 of 10 decisions against 10 of 10 with help on) and in FFX on the desktop (d06 with Yuna a living Zombie: hint null).
(2) Stop-carried FFX-2 seams render cleanly. Yuna stands STOPPED at home in her dressphere at the Gippal link with the menu up (ffx2-den-of-woe-win/24-seam-2-first-menu.png). In the a2 seam sequence the whole party, Stopped Yuna included, stays in frame while the camera hands over to Gippal (visual/st-den-a2-seam2.jpg). The Trema 390x844 and 1600x900 seams and the XV 2000x1012 seams 2 and 3 also hold their composition (visual/st-seams-stop.jpg).
(3) The FFX desktop Zombie forecast (-1000 KO, HURTS chip, ZOMBIE tag, green body and black smoke) matches the O3 target (targets/picks-status-o3-ffx-forecast.jpg).
(4) Under REDUCE MOTION the marks render with the same look and no artefacts (osrm runs).

AGAINST (all polish, none introduced by the candidate):
- PR-0291 is carried and widened. At 1600x900 the red Zombie warning slab still overprints the open Guide card, and the grey TALK help slab ('A one-off action this encounter offers') overprints the Guide's NEXT 'Holy Water -> Yuna' line. Round 18's frame is identical.
- R18b-VIS-01: in Ch IV at 1600x900 the default enemy-intent card covers Rikku's and Paine's heads at Yuna's WHITE MAGIC list. This is the PR-0249 class; that code is unchanged.
- PR-0293, PR-0271, PR-0248 and PR-0247 are carried and not re-captured; their code and art are unchanged.

NOT CAPTURED (UNVERIFIED): the phone target step of O3 (hint under the target card plus the phone Zombie forecast; the 390 forecast run lost its aim and ended on pause); FFX phone BATTLE HELP OFF in a hint state (in both FFX phone runs Yuna stayed Zombie+KO, so no hint was due); 2000x1012 and TEXT SIZE 115/130 % with a hint up.

SCORE: round 18 held visual at 8.9 only because the new O3 collision major offset a real look gain (eye candy D and the calm camera on target). That major is now resolved by fresh evidence in both games and both layouts, and what remains is polish. This meets the anchor '9 = polished with minor issues'. Score 9.1, not higher, because of the open overprints, the intent card over two FFX-2 heads, the 4K pause and the unverified phone target step.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass closed the visual auditor's phone target-step and 2000x1012 gaps (the hint sits under the target card in both games, 0 overlap with rows and advisor at 2000x1012 and at TEXT SIZE 115/130 %), confirmed PR-0293 at 4K and found the hint over the FFX phone tap line (PR-0303, scored under interface). The XV seam plate band (PR-0300) is a rendering flaw as well as a feel one; it is scored once, under feel. 9.1 held.

### feel: 8.3

[feel auditor, deep round 18b. Candidate: main f302f163 from D:/pyrefly-rel26c, production candidate dist-gate, not deployed. I worked only from the capture owner's evidence in critic/rounds/round-18b/evidence: headless Playwright, PYREFLY_BROWSER=gpu, per run.json mode 'gpu'. I opened no browser and started no server, so no port was mine to close. My only command against the worktree was node tools/critic-plan.mjs --json, which reads and does not write. The worktree status was the same before and after (M docs/deploys.log, ?? dist-gate/). My scratch is in critic/rounds/round-18b/feel-narr/ (sheet.py, contact sheets, den-seam-f00-cand-vs-live31a.jpg, den-seam-first-menus.jpg, critic-plan.json).] DEPENDENCY ARGUMENT FOR REUSE: git diff 65152c1b..f302f163 --stat -- src touches 6 files: src/ui/common/{status-o3.css, statusFigureTint.ts, statusHintCard.ts, withStatusLooks.ts} and src/ui/ffx/{FFXBattleHud.ts, hudAvoidSelectors.ts}. Nothing changed in src/engine (presenter, beats, camera, pace), src/battle, src/scenes, src/story, src/audio, public/ or research/. statusFigureTint only alters a figure while the FFX-2 Stop freeze holds it (statusLooks.ts:79, FFX-2 only). The hint-card change is HUD placement. Round 18's feel evidence is therefore carried forward for everything without a Stopped FFX-2 figure: the steady-pacing ratios, the calm camera, REDUCE MOTION over hits in motion, PR-0061 (hold-skip +2.7 s), PR-0104 (2.27 s Shell window with no visual) and PR-0244 (Ch VII kneel/fall over a standing Seymour). It is labelled reused. NEW EVIDENCE: (1) PR-0281's feel consequence is gone. I saw the Stop-carried seams frame by frame, by real keys (ffx2-den-of-woe-win a2-seq-seam-2, Yuna Stopped into Gippal; seq-seam-3, Yuna Stopped into Nooj; ffx2-den-of-woe-win-s2 seq-seam-2). In each, the party slides in by 0.4 s, the camera dollies, the boss caption lands at about 1.8 s, and the moment hands back. The injected lanes measure the moment at 2.85-2.87 s for XV at both sizes, 2.90/2.97 s for XIII at 1600x900 and 390x844, and 2.8-3.4 s for XIV, VI and VIII, with 0 stalls. 24-seam-2-first-menu.png shows Yuna STOPPED at her place with Grinder forecast, so the whole party is in frame. (2) New polish defect R18b-FN-01: every Den of Woe seam on this candidate opens with the right 21-25 % of the frame black. The plate ends in a hard vertical edge, and this lasts about 1.1 s. It happens at 1600x900 and 2000x1012, Stop or no Stop, in 13 of 13 sequences. Live 31a's frame of the same seam fills the width, and so does release 32's (round 17). (3) PR-0285 reproduces unchanged on this build (gaps/flux-zombie-1600x900/seq-hastega-to-lance/frames.json). Hastega splits into 'Tidus was hasted.' at 1.19 s, 'Tidus and Yuna...' at 1.52 s and 'Kimahri was hasted.' at 3.30 s, and 'Yuna became a Zombie.' arrives only at 5.26 s, under Seymour's 'Let it in.'. (4) Under REDUCE MOTION the O3 status marks carry anim=none in both games, at every decision of Ch I (FFX) and Ch IV (FFX-2) (gaps/play-*-osrm/run.json). (5) Both end-to-end chapters hand from scene to fight inside the same 10-frame windows as round 18, with 0 console errors: I (FFX) win and loss, IV (FFX-2) win and loss. OBSERVED, NOT A FINDING: in the injected lanes the first party menu came 15.8-17.4 s after XV's seams and 16.1-16.4 s after XIV's, with one enemy action in that time. VI and VIII took 6.0-6.9 s. Whether that is dead waiting needs a live-32 comparison (capturesNeeded). NOT MEASURED (no credit given): whether a Stopped girl's idle still visibly freezes at rest after the fix, REDUCE MOTION over a Stop-carried seam, and Bailey's feel verdict (CHK-B2). Net: the stall's removal was credited under delivery in round 18 and the new seam-edge flaw is a minor offset, so feel holds at 8.4.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass measured what this auditor asked for. (1) Against live 32 on the same seed and lane, every FFX-2 chain seam now hands control back about 2.5-3 s later: moment:battle-start runs 2.9-3.1 s against 0.6-0.75 s live (PR-0301, a polish regression). (2) The XV black band appears with ?cam=current too, so the calm camera is not its cause; live 32 is full-bleed (PR-0300). (3) Under OS reduced motion a Stop-carried XV seam has no stall and no shake (moment 2.24 s). (4) Whether a Stopped girl's idle still visibly freezes at rest could not be told from pixels (UNVERIFIED). The confirmed seam slowdown is a second small regression at every FFX-2 chain seam, on top of the band the auditor already counted: feel 8.4 -> 8.3.

### narrative: 8.9

[narrative auditor, deep round 18b, candidate f302f163] DEPENDENCY ARGUMENT: the diff from 65152c1b to f302f163 has no file under src/story, research/ or src/data, and statusWords.ts (the cure and message wording) is unchanged. Every script is the one rounds 17 and 18 reviewed. The 15 aftermaths round 18 reached by real input are carried forward and labelled reused: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV and XVI. So are the per-game tone judgments. NEW EVIDENCE (dboxTimeline in run.json): (1) The beats in Chapter XV that round 18 found unreachable once Stop was carried are now reached by real keys. That covers 5 attempts across seeds 1/1001 and 2/1002/2002 at 1600x900 and 2000x1012, including all three natural Stop-carried seams. The order is: pre-scene narration ('Ten old spheres. Paine's recordings, every one.' through 'Theirs. I know those shapes.'), then 'That's Baralai! Isn't it...?' / 'What's left of him.', then 'He's counting us! One more and-', then 'Gippal? He'd never pick a fight with me.' / 'This one would.', then 'His pattern's gone. Watch everything now!' and 'Ooh, Mortar! A Gun Mage could use that.', then 'Nooj too. All three of them.' / '...Of course. He'd go first.', then 'Big light! Big, big light! Hold on!'. These match the D-148 GP15 callout plan, with the shades kept silent (GP13). The FFX-2 register stays quick and warm. (2) Chapter I's aftermath is reached again on this build, through the CONFIRM scene ('You can't send what refuses to go.' to 'Then I stopped counting.'). So is Chapter IV's ('...Yunie.' to 'No arguing! This is a Brother order!'). Both have their in-fight status barks ('He's turned. A cure would hurt him now.'). LOSSES AND OPEN: XV was lost in all 5 attempts on the advisor route (round 17 also lost twice), so its last-shade callout and its aftermath are still UNVERIFIED. So are the XVII and XVIII aftermaths (carried). These issues are carried with unchanged scripts: PR-0254 (Ch VII Talk silent), PR-0255 (Tromell's lines have no speaker), PR-0272 (the XVII cannon beat is a caption only), PR-0262 ('...Okay. Next one.' is reused across chapters; it shows again on the Ch I results here). PR-0244's staging half is scored under feel. Bailey's story read (CHK-B3) is not recorded. Round 18 docked 0.1 for the XV beats being unreachable. That consequence is closed, so narrative goes 8.8 -> 8.9 (round 17's level).

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass reached what this auditor left UNVERIFIED: XV's post-battle scene by real keys (Paine "Enough. Let them rest.", Rikku "We're out! Everybody's out, right?"), results, CONFIRM scene, board and reload, and the XVII and XVIII aftermaths. That is the round-17 coverage restored, which the auditor's 8.9 already assumed. 8.9 held.

### audio: UNVERIFIED (no number)

[Audio auditor, deep round 18b. Candidate: main f302f163 (bundle index-DCYkAkI-.js), D:/pyrefly-rel26c/dist-gate, not deployed. Live is release 32, 1a6fd3cc.] I cannot hear and listened to nothing. Everything below comes from data, offline decoding and the capture owner's runtime logs. No score is given. The listening half has no numeric owner verdict. docs/audio/OWNER-VERDICT.md was last changed in 5e5ef411 on 2026-09-29, and its newest entry is unnumbered. decisions.json holds no ear score either. D-302 and D-303 adopt future music and SFX routes that do not ship in this candidate. D-306 is a budget decision. D-307 asks Bailey for an ear verdict, which is still open. Under RUBRIC section 6 the category is UNVERIFIED, carried as in rounds 17 and 18 (CHK-B1).

WHAT CHANGED SINCE ROUND 18: no audio. `git diff 65152c1b..f302f163 --stat` touches no file under public/audio, src/audio or tools/audio, and no audio call. The only product code changes are 6 UI files: src/ui/common/status-o3.css, statusFigureTint.ts, statusHintCard.ts and withStatusLooks.ts, plus src/ui/ffx/FFXBattleHud.ts and hudAvoidSelectors.ts. A grep of the src diff for audio, sfx, playSfx or music finds nothing. dist-gate/audio is sha256-identical to public/audio (28 of 28 files). public/audio is clean against HEAD, and the candidates folders in dist-gate hold no files.

TECHNICAL (new evidence, PASS): `node tools/audio/qa.mjs --strict` re-run on the candidate exits 0, with 0 cue findings and 0 SFX findings. Its report matches round 18's qa-strict.json byte for byte once timestamps are ignored: 26 cues at -15.98 to -16.21 LUFS and -1.34 to -1.64 dBTP, 0 clipped samples, every loop seam passing, an SFX sprite of 134 cues peaking at -1.13 dBTP, and 80.93 MB of 85 MB in total. An independent ffmpeg decode of all 27 shipped media files gave 0 errors. Stereo figures are reused from round 18 because the bytes are identical.

ROUTING (new runtime evidence, PASS): the capture owner's 6 real-key runs (GPU mode, 1600x900 and 2000x1012) give 57 AudioManager samples. The 38 samples with a cue playing all came from 'prerendered'. The sprite was decoded in 57 of 57 samples, and no synth fallback appears anywhere. The SFX mix reads {b, trim 1, bus 0.70, sfx 0.70} in all 57. Console errors and not-found requests are 0 in every run.
- Chapter III (Seymour Flux): the scene bed scene-gagazet was requested and the fight played boss-seymour. The win went to victory-ffx at results. The loss faded boss-seymour and left the results silent, as authored, since there is no defeat cue.
- Chapter IV (Bahamut): scene-bevelle-underground then boss-ffx2-aeon. Results are silent on both the win and the loss, which matches encounters.ts:237-261 ('no fanfare', no victory field). victory-ffx2 was never requested.
- Chapter XV (Den of Woe, the PR-0281 area): scene-bevelle-underground then boss-shuyin, as in THEMES.md row XV. Across the 3 runs, the music was sampled at seams 2 and 3 at +0, +1.5 and +3 s, every time a Stop-carried seam occurred. Every sample reads boss-shuyin at gain 1 with nothing fading, so the music runs through the seams with no dropout and no restart. The presenter-tween fix did not disturb audio.
- pause.mp3 was requested in all 6 runs.

SAVE (audio half of CHK-024, new evidence, PASS with the corrected criterion): the capture owner's save-matrix.json prints 4 of 22 passing. That is the same harness artefact round 18 corrected in save-matrix-verdict.json: the harness demands that the migrated level and its marker be on disk right after boot, but the app applies D-293 in memory and writes it with the next save. Re-scored from the same data (board reached, in-memory level equal to expected with the marker set, mixer equal, fx flags equal, live switches equal, reload unchanged, no unexpected diffs, 0 errors), all 22 of 22 pass. That includes the release-32 artifact's own written saves, booted into the candidate: the fresh save (0.35, no marker) plays 0.70, and the hand-made save keeps 0.50. Persistence of the first real write is reused from round 18's sfxwrite run (dependency argument: SaveData.ts and saveSfxBalance.ts are unchanged).

REUSED FROM ROUND 18 WITH A DEPENDENCY ARGUMENT (AudioManager.ts, the pause, title and select screens, encounters.ts and the cue files are all unchanged): the pause cue playing and handing back, title and chapter-select samples, victory-ffx2 on FFX-2 wins, the stereo and mono measurements, and the emulated pad-only audio unlock.

OPEN:
- XV's victory-ffx2 at its real results is still not observed. The real-key route lost in 5 of 5 attempts. The injected-lane results have no AudioManager sample. The code sets it (chapter-ffx2-den-of-woe.ts:100), and the generic route was proven on other FFX-2 wins in round 18.
- The carried majors are unchanged: PR-0148 (no numeric ear verdict), PR-0099 (stand-in cues) and PR-0240 (cold chapter entry not re-measured).

Servers: I started no server and opened no browser. A Get-NetTCPConnection check finds no listener on ports 5400 to 5990.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass sampled XV's results after a real-key victory: "playing: victory-ffx2", music bus 0.7 (routing read, not a listen), closing the auditor's open XV victory-cue item. The confirmer measured the cold 10 Mbit/s entry: the V0 music explains about 2-3 s of a 36 s penalty that is mostly art, so PR-0240 is downgraded to polish and moved to delivery. Agents cannot hear: no number without Bailey's ear verdict (CHK-B1).

### interface: 8

Deep re-review round 18b of main f302f163 (release 33 fixed candidate, dist-gate in D:/pyrefly-rel26c). I judged only the capture owner's evidence in D:/Final Fantasy/critic/rounds/round-18b/evidence: index.json (393 entries), run.json files, logs, and the frames I opened. Captures were headless Playwright with PYREFLY_BROWSER=gpu at 1600x900, 2000x1012 and 390x844 (touch). I opened no browser and started no server, so I had no port to stop.

DIFF. git diff 65152c1b..f302f163 --name-only: the only product files that changed are src/ui/common/{statusHintCard.ts, status-o3.css, withStatusLooks.ts, statusFigureTint.ts}, src/ui/ffx/{FFXBattleHud.ts, hudAvoidSelectors.ts}, plus two new unit tests. Everything else is docs or critic records. That diff is my dependency argument for every interface area outside O3: the pause, restart, target, command menu, intent, board, results and text-size code are byte-identical to round 18's candidate.

PR-0282 IS FIXED IN THE CAPTURED STATES:
- 390x844 FFX-2 Ch IV, Paine Cursed: the hint docks above the party chips at [8,436,374x44]. Across 10/10 decisions cmdsCovered=0, cmdsNotOnTop=0 and no overlap with the TIP line (gaps/play-ffx2-bahamut-390x844-touch/d02.jpg).
- 390x844 FFX Ch I, Yuna a living Zombie: the hint sits above the chips and TALK/ATTACK are clear (gaps/flux-zombie-390x844-touch/03-third-menu.jpg).
- BATTLE HELP OFF, set by real taps: hint=null at 10/10 FFX-2 phone decisions. Desktop FFX decision 6 (living Zombie) also has no hint.
- 1600x900 FFX with the guide folded: the hint stays at [53,78,340x103] and NEXT BEST MOVE moves down to [506,133] (hintOverAdvisor=false, d06.jpg).
- FFX-2 desktop at 1600 and 2000: the hint rides inside the guide panel (ffx2-bahamut-win/11-advisor.png).

COMBAT-FACING INFORMATION:
- Advisor: targetMismatches=0 and emptyPicks=0 in all six real-flow runs, including five Chapter XV attempts. The only miss is the known last-aeon Summon harness case (seymour-flux-win turn 55).
- Seam advice: the card at the XV link-2 and link-3 first menus overlaps nothing (0 px2) at 1600x900 and 2000x1012. A carried Stop reads as the STOPPED label plus an icon (24-seam-2-first-menu.png).
- Intent stays honest: MOST LIKELY 96 %/92 %, RANDOM TARGET, 'Lands on one of these, picked when it acts'.
- Controls: Esc, P, N, E and G work by real keys in both games. Target and cancel work at 1600 and 2000 (targets=0 after cancel). There were 0 console errors and 0 404s.

HOLDS IT DOWN:
- PR-0264 (major) re-confirmed on this build: a phone tap on Yuna committed the Hi-Potion for -1000 and KO with no forecast (05-hipotion-aim-zombie-yuna.png).
- PR-0265, PR-0283 and PR-0266 (majors) are carried. Their code is unchanged and they were not retested.
- PR-0291 is re-observed: the red slab sits under the guide's NEXT line at 1600x900.
- New polish R18B-IF-01: the phone cure-hint body is 11 css px and its head 9 px, under the 14 px floor.
- New polish R18B-IF-02: with BATTLE HELP OFF, the FFX-2 phone help line keeps 'Open the White Magic menu.' for Rikku and Paine. The round-18 frames show the same, so it is not caused by this candidate.

WHY 8.0 (7.8 in r18): the new-feature major PR-0282 is gone and the open interface majors drop from 5 to 4. Nothing new rises above polish. The 4:3, 21:9 and 4K shapes were not recaptured, even though the advisor solver gained an obstacle.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass filled most of this auditor's captures: PR-0282 holds at 2000x1012 (folded and open guide), at TEXT SIZE 115 and 130 % in both games, with the FFX-2 guide hidden, and at the phone target step (FFX-2 0 px2 on the tap line); FFX phone BATTLE HELP OFF at a living-Zombie decision shows no hint; an emulated standard pad drives one decision and the pause in each game. Against: PR-0265, PR-0283 and PR-0284 re-confirmed on f302f163; new polish PR-0303 (hint over the FFX phone tap line), PR-0304 (FFX-2 desktop hint missing in an empty guide), PR-0286 widened to 1280x960, and the hint text measured under 14 px at 1280x960 and in the 1600x900 head (PR-0302). Gains and losses balance: 8.0 held.

### onboarding: 8.4

Same evidence base and dependency argument as interface. The only onboarding-relevant code change is statusHintCard.ts. It now reads coachState.battleHelpOn, so the cure hint obeys BATTLE HELP like the other coaching.

CONFIRMED THIS ROUND:
- BATTLE HELP OFF, set by real taps on the phone (OPTIONS reached in 1 swipe, BATTLE HELP in 2-3), removes the hint in FFX-2. Set by real keys on desktop FFX, it removes the hint at a living-Zombie decision. The setting is saved (battleHelp=false).
- Fresh-profile flow by real keys in all six chapter runs: Auron's briefing, then O2 step 1 'AURON · 1 OF 3', then step 2. Esc at step 2 keeps party prep (prepEsc=party-prep).
- Status cues stay non-colour: glyph icons, 'STOPPED' and 'CHANGE CURSED' words, 'Paine was cursed.' message lines, and a written cure per game.
- Settings survive an upgrade. In the save matrix, the release-32 hand-made save comes back with textSize 1.15, reduceMotion true, battleHelp false and SFX 0.5, unexpectedDiffs=[] and the same values after a reload. All 22 cases show observed values equal to expected. The harness's own pass flag reads false in 18 of them, a comparison bug in the harness, not a product failure.

CARRIED FROM ROUND 18 (code unchanged, dependency argument above):
- O2 step 3 and its absence in FFX-2.
- The Sphere Grid A explainer.
- REDUCE MOTION and LOW EFFECTS reach.
- Status marks held still under REDUCE MOTION: statusMarks.ts, statusCalm.ts and status-marks-calm.css are unchanged. This round's DOM probe reads 'anim=none' with REDUCE MOTION both on and off, so it cannot tell the two apart, and no new motion evidence exists.

STILL AGAINST:
- PR-0284 (REPLAY BRIEFING invisible, major).
- PR-0270 (TEXT SIZE grows nothing in the FFX-2 HUD, major).
- PR-0032 (no REDUCE FLASHES, no remap).
- PR-0290, re-observed at every FFX-2 phone decision: 'Paine is cursed: Holy Water cures it.' drops Esuna and Remedy.
- PR-0289, re-observed in all six dossiers: 'Start with the first one.' while Chapter XV or IV is selected.
- PR-0294 (phone OPTIONS scroll window; 00-battle-help-off.jpg).
- The phone hint type at 11/9 px (R18B-IF-01, scored under interface).
- Gamepad is UNVERIFIED.

NEWCOMER WALKTHROUGH: simulated, not real. A scripted harness used visible prompts and ordinary keys at 1600x900 and 2000x1012, and taps at 390x844.

WHY 8.4 (held): BATTLE HELP compliance is a real but small gain. It was already counted with PR-0282 under interface, so it is not counted twice. None of the onboarding majors moved.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The gap pass showed the O3 Zombie smoke held still under REDUCE MOTION set by keys (one constant transform in 30 samples; 30 distinct transforms with it off), so the marks-under-REDUCE-MOTION item is now fresh evidence, not reuse; FFX-2 Curse has no animated mark (NOT APPLICABLE). It also found the desktop half of PR-0305 (the FFX-2 help band stays after BATTLE HELP OFF until the highlight moves). 8.4 held.

### prep: 9

Candidate main f302f163 (D:/pyrefly-rel26c/dist-gate, bundle index-DCYkAkI-.js). Capture: the capture owner's headless Chromium from node, PYREFLY_BROWSER=gpu (critic/rounds/round-18b/evidence; the GPU read 0 % at lane start, logs/gpu-at-lane-start.txt). I opened no browser and started no server. I re-ran 30 vitest files on D:/pyrefly-rel26c HEAD f302f163: 379/379 pass. They cover flow-checkpoint-retry, pause-restart-checkpoint, the chain checkpoint spoils, results-withdrew, every save-* migration, sphere-grid-autolearn/-b and status-o3-stop-seam/-hint-place (critic/rounds/round-18b/prep-delivery/vitest-prep-delivery.txt).

DEPENDENCY ARGUMENT (reuse of round 18's prep evidence): git diff 65152c1b..f302f163 changes only 6 product files, all under src/ui (status-o3.css, statusFigureTint.ts, statusHintCard.ts, withStatusLooks.ts, FFXBattleHud.ts, hudAvoidSelectors.ts). Nothing changed in party prep, the Sphere Grid, results, rewards, chapter select, the checkpoints or src/app. Shipped art and audio are byte-identical (prep-delivery/diff-vs-r18-candidate-65152c1b.txt). So round 18's prep evidence is reused, labelled as reused:
- 18 chapters reach prep by real keys;
- the Sphere Grid A/B/C gap pass;
- 15 wins whose clears survive a reload;
- PR-0258 re-confirmed.

NEW THIS ROUND, by real keys:
- RETRY speed. Eight losses reached RETRY and then a new battle: Flux 2000x1012, Bahamut 2000x1012, and XV x2 at 1600x900 plus x3 at 2000x1012 (the 8th is the seed-1001 attempt at 1600x900). From the end of the fight to the retried battle took 7.2-7.5 s including harness waits (run.json steps). This matches round 18's 7.3-7.8 s and Bailey's steady pacing.
- Wins: Flux (1600x900) and Bahamut (2000x1012) went through results, CONFIRM, the board and a reload that keeps the clear (boardAfterReload.cleared). Results lines are unchanged: Flux AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere; Bahamut EXP 1,300 x3, AP 15 per dressphere, Gris Gris Bag.
- Spherechange by real input in the Bahamut and XV runs (seq-spherechange).
- The Ch XV defeat card reads ATTEMPTS 2/3 with BEST NEVER CLEARED, so the attempt count survives RETRY.

DEDUCTIONS (all carried, none introduced):
- PR-0268 (major): SIN_LINK3_CHECKPOINT is still false at sin-genais-core.ts:199, although D-284 is 'adopted'.
- PR-0295 (polish): the phone prep tabs.
- PR-0258 (polish): the overkill drop quantity.
- PR-0292 (polish): scored under onboarding.

Ch XV's clear (the post-scene, results CLEARED and board) was not reached this round. That is a delivery gap, scored once, in delivery.

No change from round 18's 9.0.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The XV clear the auditor routed to delivery was reached by the gap pass: results "CLEARED ... Victory NEW BEST, EXP 4,200 x3, GIL 35,200, Crystal Ball, Kaiser Knuckles, Magical Dances Vol 1" (sourced Nooj gil 30,000 within the total), board cleared 1/18, reload keeps it. 9.0 held.

### delivery: 8.7

CANDIDATE IDENTITY (mine): node tools/artifact-manifest.mjs build --dir dist-gate in D:/pyrefly-rel26c (HEAD f302f163c6e5):
- 1,013 files, 577,145,021 bytes;
- artifactHash ff26ce51ad23c791dafd678f2b8f750c10479e19bb80d899e05753bcb800299f;
- decodeChecked true, audioUnverified 0, problems [];
- file: critic/rounds/round-18b/prep-delivery/artifact-manifest-dist-gate.json.
Against round 18's candidate (446ef3af...415b) the only differences are the new index js/css/map and index.html. The js grew 396 bytes and the css 51 bytes. Every art, audio, fx and worker file is byte-identical (prep-delivery/diff-vs-r18-candidate-65152c1b.txt). git diff 65152c1b..f302f163 --stat confirms that nothing else changed: docs/critic records plus the r33-fix merge (6 src/ui files and 2 new tests).

PR-0281 (round 18's critical, the R18-DEL-01 deduction) is FIXED BY EVIDENCE.
- Real keys, 3 natural Stop-carried seams, none stalled:
  - den-win seed 1, link 3 log: Yuna has stop ticks from the first events, so she entered Nooj Stopped and acted later;
  - den-win seed 1001: the link-2 log (a2-battle-log.json) has Yuna under Stop from the start with 0 actions; link 2 was won (victory, nextGroupId ffx2-den-nooj) and seam 2->3 was crossed;
  - den-win-s2 seed 2: Yuna was Stopped into Gippal and the menus kept coming until the defeat.
- Injected lane: Stop carried by Rikku over 1->2 and by Yuna over 2->3 in XV at 1600x900 and 2000x1012; by Paine over XIII 1->2 at 1600x900 and 390x844. moment:battle-start lasted 2.85-2.97 s, stalls 0, and the menu opened every time.
- Vegnagun, Leblanc and Fallen Aeons victories had a girl Stopped every link. Their seams reset statuses (stopCarried []), which is why only XIII and XV can carry Stop.
- Bahamut and Ixion (single link) were won with a girl Stopped.
- The code fix (freeze holds only the idle clock; tweens run at the action pace) matches round 18's diagnosis, and status-o3-stop-seam passes.
- No longer a lock, so no longer a regression against live.

FLOWS (CHK-022): 28 runs, 0 console errors (summary plus each run's errors[]). The 6 real-key routes had 0 responses >= 400 and 0 images served as text/html.
- FFX end to end: Flux won at 1600x900 (results, CONFIRM scene, board, reload); lost at 2000x1012, then RETRY and a new battle.
- FFX-2 end to end: Bahamut won and lost at 2000x1012, with the same coverage.
- Ch XV played to an outcome 5 times (all defeats; see prep for RETRY). Its victory aftermath was NOT observed on this candidate (UNVERIFIED). Round 17 observed it on live 1a6fd3cc, and the shared aftermath code is unchanged and exercised by the Flux and Bahamut wins.
- XVII and XVIII wins stay UNVERIFIED (PR-0269, combat).
- Other chapters: round 18's flows are reused. The diff touches only O3 status UI; its FFX-2 Stop part is covered above and its hint-card part is DOM placement with pointer-events none.

SAVE (CHK-024), new run: saves written by the release-32 artifact itself (index-ChAAAZ-I, the live bundle) plus fixtures from releases 20-31a and the edge cases, booted into this build.
- The harness's own summary says 4/22 because it demanded that the migrated values be on disk straight after boot.
- Re-evaluated with round 18's corrected criterion (the code writes them on the next real save, proven by round 18's sfxwrite run): 22/22. That means the board is reached; the in-memory and mixer SFX equal the rule (0.35 without the marker -> 0.70, missing or string -> 0.9, others kept); the fx in memory and the live switches are as expected; the stored slot is unchanged apart from updatedAt; the reload is identical; 0 errors (prep-delivery/save-matrix-reevaluated.json).
- Save code is unchanged since round 18's 28/28, which is reused.

LOAD AND FRAMES: reused from round 18 (title 0.24-0.26 s, board 0.91-0.94 s, 59-60 fps, p95 16.7-16.8 ms, spikes to 117 ms; headless Chromium, RTX 5070 Ti, localhost). The dependency argument: the bundle differs by 396 bytes and the media is identical. The new per-frame work is small and not measured: a tween update while frozen, plus the phone dock's getBoundingClientRect when a hint is shown.

AGAINST:
- PR-0240 (major, STALLED): 10 Mbit/s is unmeasured while music is 81 MB (was 43 MB live).
- PR-0222 (major, FF7 cold black hold): not captured.
- PR-0259 spikes and PR-0223 (polish).
- Never run: Firefox, WebKit, Edge, a real phone and a controller.
- The live artifact is not deployed.

From 7.8 to 8.6: the critical lock is gone and proven gone by real keys. This is round 17's 8.7 level less a little for the XV clear still unobserved on the candidate.

[Chief, after the gap pass and the confirmer, which this auditor had not seen] The auditor put delivery at "round 17's 8.7 level less a little for the XV clear still unobserved". The gap pass then observed it on this build by real keys (2000x1012, GPU: post scene, results CLEARED, CONFIRM scene, board, reload keeps the clear, 0 console errors), and the XVII and XVIII wins through their aftermaths. The confirmer measured the cold 10 Mbit/s entry (first menu 52.0 s against 15.5 s; the V0 music is about 2-3 s of it), which replaces the unmeasured PR-0240 major with a measured, mostly art-bound polish item that live shares. Delivery 8.6 -> 8.7.

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | PASS | yes | Technical and routing half only. qa --strict on the candidate: exit 0, 0 cue and 0 SFX findings, 26 cues -15.98 to -16.21 LUFS, -1.34 to -1.64 dBTP, 0 clips, loop seams pass; ffmpeg decode 27/27 with 0 errors; dist-gate/audio sha-identical to public/audio (28/28). Routing: 57 AudioManager samples from 6 real-key runs, all 38 playing cues prerendered, sprite decoded 57/57, no synth fallback; boss-shuyin continuous across every Stop-carried XV seam; XV results after a real-key victory play victory-ffx2 (gap pass). Pause, title and chapter-select cue samples reused from round 18. The ear half is CHK-B1 (UNVERIFIED). (reused: round-18 (pause, title and chapter-select cue samples; stereo measurements); dependency: git diff 65152c1b..f302f163 touches no file under src/audio, src/app/screens, public/audio or tools/audio, and the six changed UI files make no audio call; the cue files are sha-identical.) |
| CHK-002 | FAIL | yes | Pause full-screen recaptured by Esc and taps at 1600x900, 2000x1012 and 390x844. Fails on carried defects re-confirmed on f302f163: PR-0283 (title root mounted over the restarted fight, 2-44 s) and PR-0293 (4K pause 3369x1925 in both games). Also PR-0300: at the XV link seams the scene plate leaves the right edge black for about a second (live 32 is full-bleed). |
| CHK-003 | FAIL | yes | New, in the changed feature: the cure-hint card measures head 9 / body 10.9 px on the phone in both games at every TEXT SIZE, 10.2 / 12.1 px at 1280x960 and a 12.8 px head at 1600x900 (PR-0302). Carried: PR-0251 (1280x960 HUD at 9.3-9.8 px). |
| CHK-004 | PASS | yes | targetMismatches 0 and emptyPicks 0 in all six real-flow runs including five XV attempts; the card at the XV link-2 and link-3 first menus names the acting girl's own row and overlaps nothing (0 px2) at 1600x900 and 2000x1012. The one miss is the known last-aeon Summon harness case (seymour-flux-win turn 55). The FFX-2 phone help line that names White Magic for Rikku and Paine with BATTLE HELP OFF is help text, not the advisor, and is filed as PR-0305. |
| CHK-006 | FAIL | yes | New evidence passes: target Escape leaves 0 targets; the hint card is empty with no open decision and absent under BATTLE HELP OFF; the seam first menus carry no stale overlay. Fails on PR-0283, re-confirmed on f302f163. The stale FFX-2 help band after BATTLE HELP OFF (PR-0305) is polish. |
| CHK-007 | PASS | yes | 31,287 characters of captured player text scanned for section signs, ffx-/ffx2- stems, row and step numbering, debug, TODO, placeholder, undefined, NaN and [object: 0 hits. |
| CHK-008 | FAIL | yes | The PR-0282 part passes everywhere it was measured: hint vs command rows and advisor 0 overlap at 1600x900, 2000x1012 (folded and open guide), TEXT SIZE 115/130 %, 390x844 menus and the FFX-2 phone target step, both games. The check fails on: PR-0303 (hint over the FFX phone "Tap another ally" line, 6,241 px2), PR-0291 widened (warning and help slabs over the open Guide card), PR-0249 widened (FFX-2 intent card over Rikku's and Paine's heads) and PR-0286 widened to 1280x960. |
| CHK-009 | FAIL | yes | No new label-fit measurement. Carried PR-0275: the board truncates "Sin: the Fins and the ..." and clips the numeral strip. (reused: round-18 CHK-009; dependency: The chapter select screen, its CSS and the board data are unchanged in 65152c1b..f302f163.) |
| CHK-010 | PASS | yes | Reticle, ground glow, TARGET slab and name tag, the matching turn-list entry and dimmed party plates (seymour-flux-lose/16-target-single.png); targets 0 after cancel. Phone target steps in both games show the target card and the go button ("HI-POTION -> YUNA", "ATTACK -> BAHAMUT"). Multi-target ALL ALLIES reused from round 18. (reused: round-18 CHK-010 (multi-target); dependency: TargetCursor.ts and the FFX-2 target code are unchanged in 65152c1b..f302f163.) |
| CHK-011 | PASS | yes | Seymour Flux and Mortiorchis (I), Bahamut (IV) and the XV links Baralai, Gippal and Nooj are visible and identifiable in default framing; other chapters reused from round 18. (reused: round-18 (critic/rounds/round-18/visual/st-midfight-all.jpg); dependency: src/scenes, src/sprites, BattlePresenter*, the camera and every art file are byte-identical in the shipped tree.) |
| CHK-012 | PASS | yes | No monogram fallback in any fresh frame (turn-list chips, party rows, cut-ins, results paintings, board hero plate). Approved 290/290 and judge-locked 48/48 byte-identical in dist-gate; verify-approved 338 ok, 0 mismatched, 0 missing. |
| CHK-013 | PASS | yes | In-game art judgment reused from round 18 (16 chapters at 1600x900 and 2560x1440 gap frames); fresh Ch I and IV rest frames still match the D rest stills, and same-state frames from rounds 18 and 18b are pixel-equivalent. (reused: round-18 CHK-013; dependency: No art, fx depth map or scene file changed; targets.json at the candidate is the same sha256 36693f81 as round 18.) |
| CHK-014 | PASS | no | The party faces the enemies in I, IV and XV and at every Stop-carried seam; a Stopped Yuna keeps her home pose and contact ring at the Gippal link; feet on the ground plane. |
| CHK-015 | FAIL | yes | Real input passes for Esc, P, N, E and G in both games, target and cancel, a spherechange, X-2 BATTLE flipped to ACTIVE, BATTLE HELP and TEXT SIZE set by keys and taps, RETRY, CONFIRM, reload, and an emulated standard pad (one decision and the pause per game). The PR-0281 fix is proved by natural real-key Stop-carried seams in XV (Wait and Active). Fails on PR-0264 (phone tap on a dimmed ally commits with no forecast) and PR-0265 (ESC RESUME tap does nothing), both re-confirmed on f302f163. A real controller was not available. |
| CHK-016 | PASS | yes | Every capture asserts screen and roots first; 393 index items, 0 missing files; injected states are labelled (61 items). Harness flags kept as unverified instead of passed (seymour-flux-win 30-post-scene; a phone frame taken with pause up). Caveat PR-0261: two XV defeats were first logged as "victory" from a per-link log and repeated attempts overwrite frames; the gap pass caught it from the results text and no verdict here rests on those lines. The gap pass flagged its own invalid "ts600" folders. |
| CHK-017 | NOT APPLICABLE | yes | The candidate is not deployed. After a deploy the exact-artifact check is owed against artifactHash ff26ce51ad23c791dafd678f2b8f750c10479e19bb80d899e05753bcb800299f (1,013 files): node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/f302f163.json, plus live real-input smoke. |
| CHK-018 | PASS | yes | No hand-written .N.png or .raw.png path in src (one doc-comment hit); the diff adds no file path; 0 responses >= 400 and 0 images served as text/html in the real-key routes. |
| CHK-019 | PASS | yes | dist-gate manifest: 1,013 files, decodeChecked true, problems [], audioUnverified 0; every art, audio and fx file byte-identical to round 18's candidate. |
| CHK-020 | FAIL | yes | The change itself is paired: the hint docks the same way on both phones, obeys BATTLE HELP in both games, and lives in the guide (FFX-2) or moves the advisor (FFX) on desktop. Fails on PR-0305: with BATTLE HELP OFF the FFX-2 help line goes stale (phone: names White Magic for Rikku and Paine; desktop: the band of the open menu stays), while the FFX line follows each actor. Also visible in round 18's frames. |
| CHK-021 | PASS | yes | PR-0281 is written "FFX-2 only" (the freeze look exists only in FFX-2's statusLooks table) and PR-0282 "both" (docs/handoff/r33-fix.md). Runtime: FFX-2 Ch IV shows the Curse hint with help on and none with help off; FFX Ch I shows the Zombie hint and moves the advisor clear; no Stop freeze in FFX (status-o3-mapping 18/18, status-o3-stop-seam 3/3). |
| CHK-022 | PASS | yes | Fresh on f302f163 by real input: FFX Ch I won (results, CONFIRM scene, board, reload) and lost (RETRY to battle in 7.5 s); FFX-2 Ch IV won and lost the same way; Ch XV lost 5 times with RETRY each time and three natural Stop-carried seams with no stall, then WON by real keys in the gap pass (seed 1001: both seams, post scene, results CLEARED, CONFIRM scene, board cleared 1/18, reload keeps it); XVII and XVIII won through their aftermaths (gap pass, real keys chosen by the round-17 in-page policy). The other 13 chapters' win and loss flows are reused from round 18; every FFX-2 chain was also crossed with an injected Stop with no stall. (reused: round-18 CHK-022 (the 13 chapters not replayed); dependency: Only status-O3 UI changed (six src/ui files). The FFX-2 Stop-freeze change was exercised at every FFX-2 chain seam by the injected lane; the hint change is DOM placement with pointer-events none, gated by BATTLE HELP. No change to the presenter, screens, engine, data, audio or save.) |
| CHK-023 | PASS | yes | Round 18 failed this only on PR-0281. Now: three natural and four injected Stop-carried seams return to the menu (12.4-17.5 s after the seam), with ATB elapsedMs advancing, Stop ticking and expiring, and 34-50 turns played afterwards; the hint obeys BATTLE HELP (0 of 24 decisions with help off); the advisor obstacle keeps the hint and the NEXT BEST MOVE card apart; both FFX real-key logs replay 671/671 and 48/48 events through the pure engine. The settings-to-runtime half is reused from round 18. (reused: round-18 CHK-023 (eye-candy rows, LOW EFFECTS and REDUCE MOTION live and after reload, SFX level to the mixer, pause cue); dependency: src/app, src/audio and src/engine are absent from the diff; withStatusLooks.ts only adds the visible hint's rect to the marks' floor and touches no setting or audio path.) |
| CHK-024 | PASS | yes | Saves written by the live release-32 artifact itself (index-ChAAAZ-I, fresh and hand-made), 8 fixtures from releases 20-31a, the SFX and fx edge cases, a fresh profile and truncated storage, booted into the candidate: 22/22 under round 18's corrected criterion (board reached; in-memory and mixer SFX follow the rule: 0.35 without the marker -> 0.70, missing or string -> 0.9, others kept; fx and live switches as expected; slot unchanged apart from updatedAt; reload identical; 0 errors). The harness's raw 4/22 demands migrated values on disk at boot, which the app writes on the next save (round 18 sfxwrite). The release-32 hand-made save keeps textSize 1.15, reduceMotion true, battleHelp false and SFX 0.5. Round 18's 28/28 also stands (SaveData.ts unchanged). |
| CHK-B1 | UNVERIFIED | yes | No numeric owner listening verdict exists for this mix: OWNER-VERDICT.md is unchanged since 2026-09-29 with no number, and D-307 is an open ear question. Agents cannot hear. |
| CHK-B2 | UNVERIFIED | no | Bailey's feel verdict is not collected on this build (steady pacing, calm camera, the longer FFX-2 seam opening of PR-0301). |
| CHK-B3 | UNVERIFIED | no | Bailey's story read is not collected on this build. |

## Encounters

| Chapter | Real flow | Outcome | Note |
|---|---|---|---|
| seymour-flux | yes | victory (1600x900); defeat + RETRY (2000x1012) | Fresh, real keys, seed 1: title, briefing, board, prep, scene (hold skip, Esc), fight 73 turns (replays 671/671 through the pure engine), results, CONFIRM scene, board, reload keeps the clear. Loss: RETRY to battle in 7.5 s. 0 console errors, 0 404s. Phone and 2000x1012 O3 lanes also ran here. |
| yunalesca | yes | victory | Reused from round 18 (1600x900, seed 1, board after reload keeps the clear.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| braskas-final-aeon | yes | victory | Reused from round 18 (Aftermath III (CHK-022 debt) closed: 7 links, post scene, results, CONFIRM scene, board, reload. 208 turns, same as round 17.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| ffx2-bahamut | yes | victory (2000x1012) to board and reload; defeat + RETRY with X-2 BATTLE flipped to ACTIVE | Fresh, real keys, 47 turns, Curse on Paine at seq 3 as sourced; spherechange by real input. 0 console errors, 0 404s. |
| ffx2-vegnagun-shuyin | yes | victory | Reused from round 18 (4 seams, 168 turns, 27 min.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. This round: victory across 4 seams with an injected Stop (plain seams, Stop does not carry), no stall. |
| ffx2-leblanc | yes | victory | Reused from round 18 (2000x1012.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. This round: victory across 2 seams with an injected Stop, no stall. |
| seymour-anima-macalania | yes | victory | Reused from round 18 (1600x900.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| evrae-airship | yes | victory; loss + RETRY | Reused from round 18 (VIII loss + RETRY (CHK-022 debt) closed: defeat, RETRY, prep, battle on seed 1001. Win at 2000x1012.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| yojimbo-cavern | yes | victory | Reused from round 18 (1600x900.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| seymour-natus | yes | victory | Reused from round 18 (2000x1012.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| ffx2-fallen-aeons | yes | victory | Reused from round 18 (1600x900.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. This round: victory across 2 seams with an injected Stop, no stall; seam hand-back 16.1-16.4 s vs 13.2-13.8 s on live 32 (PR-0301). |
| seymour-omnis | yes | victory (attempt 2); phone: defeat x2 + retry | Reused from round 18 (Aftermath XII (CHK-022 debt) closed at 2000x1012: lost on seed 1, RETRY, won on 1001. Same outcomes as round 17. Phone 390x844 by taps: lost twice with retry each time, same as round 17.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| ffx2-trema | yes | victory (seed-2 route, attempt 2) | Reused from round 18 (Aftermath XIII (CHK-022 debt) closed by ffx2-trema-win-s2: post scene, results, CONFIRM scene, board, reload keeps the clear. The seed-1 route lost on 1 and 1001, and a ?pace=current control on seed 1 also lost (81 turns). So steady pacing does not cause the split from round 17. FFX-2 Active is timing-sensitive, so the paths differ.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. This round: Paragon -> Trema seam with an injected Stop carried on Paine at 1600x900 and 390x844; menu 12.4-12.5 s after the seam, moment 2.9 s, no stall. |
| isaaru-via-purifico | yes | victory | Reused from round 18 (1600x900.). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. |
| ffx2-den-of-woe | yes | victory by real keys (gap pass, seed 1001, 2000x1012) through post scene, results CLEARED, CONFIRM scene, board and reload; defeat x6 + RETRY (seeds 1, 1001, 2, 1002, 2002 and the gap pass's seed 1) and one ACTIVE-mode defeat | PR-0281 fixed by real input: natural Stop-carried seams with no stall (Yuna into Nooj, seed 1; Yuna into Gippal, seeds 1001 and 2; Rikku into Gippal in Active mode); injected lanes crossed both seams at 1600x900 and 2000x1012. The winning run carried Silence, not Stop, across seam 1->2. XV results play victory-ffx2. Seam opening shows a black right-edge band (PR-0300) and hands back ~2.5 s later than live (PR-0301). |
| ffx2-ixion-djose | yes | victory | Reused from round 18 (2000x1012 keys; phone 390x844 by taps also won (96 taps, board after).). Dependency: only status-O3 UI changed in 65152c1b..f302f163; FFX-2 chains were re-crossed with an injected Stop with no stall. This round: victory with a girl Stopped (injected) the whole fight. |
| sin-fins-core | yes | victory (gap pass, seed 1, 228 turns, 2 seams) to board and reload; defeat on the advisor line (confirmer, seed 1) | Real keys chosen by the round-17 in-page policy (POLICY=xvii), setSeed labelled; OVERKILL x1 NEW BEST, board cleared, reload keeps it, 0 console errors. Following the advisor card lost (PR-0269). |
| sin-face | yes | victory (gap pass, seed 7, 67 turns) to board and reload; victory on the advisor line (confirmer, seed 1, 74 turns) | Real keys; post scene, CLEARED Victory NEW BEST, board cleared, reload keeps it, 0 console errors. Round 18 lost seed 1 on the advisor line, so it is unreliable (PR-0269). |

## Target gate

Required 86, matched 71, failing 0, unverified 15, waiting on a decision 6. The visual auditor's tile tally against targets.json at the candidate (sha256 36693f81bb9c60aed0fdcccbb540f00fc235f6ea5facb9524100984f7610ef07, unchanged since round 18): 14 composites this round, 6 of them from round-18 gap captures labelled REUSED. Status display O3 no longer fails. The gap pass verified O3 behaviour at the phone target step and 2000x1012 but made no new tile composite, and its party-hit frame did not match the eye-candy D hit tile (still UNVERIFIED); the chief does not change the tally. Protected art: approved 290/290 and judge-locked 48/48 byte-identical in dist-gate; verify-approved (ROOT=D:/pyrefly-rel26c) 338 ok, 0 mismatched, 0 missing.

## Coverage

Tested:

- Chapter XV by real keys: 6 attempts at Wait (seeds 1, 1001, 2, 1002, 2002 and the gap pass's 1) plus 1 at ACTIVE; natural Stop-carried seams with no stall; a real-key victory through post scene, results CLEARED, CONFIRM scene, board and reload
- Every FFX-2 chain seam with an injected Stop on a girl (XV both seams at 1600x900 and 2000x1012; XIII at 1600x900 and 390x844; V, VI and XI where Stop does not carry) and single-link IV and XVI with a Stopped girl; OS reduced motion over an XV Stop-carried seam
- Live 32 A/B on the same seed and lane for XV and XI seams (timing and plate coverage)
- One chapter per game end to end by real keys: FFX Ch I and FFX-2 Ch IV, win to board and reload, loss to RETRY; plus XVII and XVIII wins through their aftermaths
- Status O3 at 1600x900, 2000x1012 and 390x844 in both games: the cure-hint dock at menus and target steps, guide folded, open and hidden, TEXT SIZE 115 and 130 %, BATTLE HELP OFF by keys and taps (incl. FFX phone at a living-Zombie decision), the Zombie forecast on desktop and phone, the marks under REDUCE MOTION (100 ms sequences), message line vs dialogue; rotating shapes 1280x960, 2560x1080 and 3840x2160
- Save upgrade (CHK-024): saves written by the release-32 artifact plus fixtures 20-31a and edge cases into this build, 22/22 under the corrected criterion
- Combat: full unit suite on f302f163 (10,485 passed, 1 host-load timeout that passes alone), 2/2 FFX real-key logs replayed through the pure engine, the XV Stop-seam engine and tween model, the Bushido bench re-run
- Audio: qa --strict and ffmpeg decode on the candidate, routing from 6 real-key runs, the XV victory cue
- Pause carried majors re-run on f302f163: ESC RESUME tap (8 tabs), RESTART ENCOUNTER, REPLAY BRIEFING; 4K pause in both games
- Cold 10 Mbit/s chapter entry for Ch I (confirmer); emulated standard pad driving one decision and the pause per game
- Artifact identity: dist-gate manifest (1,013 files, decode-checked) and shipped diff against the round-18 candidate; approved art hashes 338/338

Reused, with the reason:

- Engine and data evidence: three-line FFX bench (53 rows), XV Stop-frequency bench (seeds 1-200), Sin difficulty, Ch III gauntlet length, Ch XII v3 rate, XIII human-pace rate, 16/16 FFX replays (from critic/rounds/round-18/combat/): src/battle, src/data, src/engine (tactics included) are unchanged in 65152c1b..f302f163 and the benches are deterministic; the Bushido bench re-run matched exactly.
- Win and loss flows of the 13 chapters not replayed (II, III, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV, XVI) (from critic/rounds/round-18 encounters and CHK-022): git diff 65152c1b..f302f163 changes product code in six files only, all presentation: src/ui/common/status-o3.css, statusFigureTint.ts, statusHintCard.ts, withStatusLooks.ts, src/ui/ffx/FFXBattleHud.ts and hudAvoidSelectors.ts (plus two new unit tests). Nothing changed in src/battle, src/data, src/engine, src/story, src/scenes, src/audio, src/app (SaveData.ts included), public/ or the build config; every shipped art, audio, fx and font file is byte-identical to the round-18 candidate (only index.html and the bundle js/css/map differ). The FFX-2 Stop-freeze change was re-exercised at every FFX-2 chain seam by the injected lane.
- Visual judgment of 16 chapters mid-fight, 2560x1440 gap frames, eye candy D moments, Sphere Grid A/B/C and O2 step 3 tiles (from critic/rounds/round-18/visual and targets): Art, scenes, sprites, presenter, camera and coach code byte-identical; same-state frames from rounds 18 and 18b compared pixel-equivalent.
- Feel: steady-pacing ratios, calm camera frames, REDUCE MOTION over hits, PR-0061 hold-skip, PR-0104 Shell window, PR-0244 Ch VII staging (from critic/rounds/round-18 feel evidence): Presenter, beats, camera and pace code unchanged; statusFigureTint only acts on an FFX-2 Stopped figure.
- Narrative: aftermaths I-XIV and XVI reached by real input, per-game tone judgments (from critic/rounds/round-18 narrative evidence): src/story, src/data, statusWords.ts and research unchanged.
- Audio: pause, title and chapter-select cue samples, stereo measurements, sfxwrite persistence, themes-audit cue map, pad-only audio unlock (from critic/rounds/round-18 audio): No audio, screen or AudioManager file in the diff; cue bytes sha-identical; SaveData.ts and saveSfxBalance.ts unchanged.
- Load and frame time (title 0.24-0.26 s, board 0.91-0.94 s, 59-60 fps, p95 16.7-16.8 ms, spikes to 117 ms) (from critic/rounds/round-18/evidence/perf): Every shipped asset byte-identical; bundle +396 bytes, css +51 bytes; the new per-frame work (a tween update for a frozen figure, one rect read on the phone with a hint up) is negligible but not measured.
- Save matrix 28/28 (saves from releases 29, 30, 31a and 32) and the sfxwrite run (from critic/rounds/round-18/evidence/save-matrix): SaveData.ts, saveSfxBalance.ts, saveComfort.ts and the fixtures are unchanged; this round re-ran the upgrade anyway (22/22).
- Carried pause and text-size measurements: PR-0266 mid-turn repro, PR-0270, PR-0251 4:3 sweep, multi-target ALL ALLIES (from critic/rounds/round-18 gaps): hudTextSize.ts, applyComfort.ts, CommandMenu.ts, TargetCursor.ts and the HUD CSS are unchanged.

Not tested:

- Firefox, WebKit/Safari and Edge; a real phone; a real controller (an emulated standard pad only)
- The live artifact (not deployed): CHK-017 is owed after the deploy
- Whether a Stopped girl's idle still visibly freezes at rest after the fix (12 frames at 250 ms could not separate it from the camera push; a per-actor presenter read is needed)
- Frame time on f302f163 (reused from round 18; the Stop-seam frame-time window was not captured)
- The eye-candy D hit tile (the party-hit frame caught a different moment)
- The hidden FF7 fight (PR-0222, PR-0223, CHK-025)
- Carried polish not re-captured: PR-0271, PR-0248, PR-0247, PR-0246, PR-0252, PR-0276, PR-0277, PR-0239, PR-0273, FOC28-P02, PR-0296, PR-0250, PR-0237, PR-0275
- A second cold 10 Mbit/s entry (FFX-2 chapter) and an art-only breakdown of the 36 s penalty

Required and not tested:

- Bailey's listening verdict (CHK-B1): only Bailey can give it
- The eye-candy phone-tier performance gate on a real phone GPU (carried from round 18; measured only at a phone viewport on the desktop RTX 5070 Ti)
- The Stopped-figure idle freeze at rest after the PR-0281 fix (the feel half of its acceptance)
- Frame time on this exact build (reused with a dependency argument, not re-measured)

Plan: node tools/critic-plan.mjs --json in D:/pyrefly-rel26c at f302f163, saved as critic/rounds/round-18b/chief-critic-plan.json. The plan measures the release-33 line against live 1a6fd3cc, so it lists every system round 18 reviewed; this round re-tested what the r33-fix diff touches and carried the rest with dependency arguments.

## Resolved, downgraded, merged and refuted this round

- **PR-0281** (critical) resolved: FIXED AND VERIFIED on f302f163. The FFX-2 Stop freeze now holds only the idle clock and runs one-shot tweens at the action pace (statusFigureTint.ts:211-215; status-o3-stop-seam 3/3). Real keys: natural Stop-carried seams in XV with no stall (Yuna into Nooj on seed 1, into Gippal on seeds 1001 and 2, Rikku into Gippal at ACTIVE); the engine advances (ATB elapsedMs, Stop ticks and expires, 34-50 turns after the seam). Injected lanes: XV both seams at 1600x900 and 2000x1012, XIII Paragon -> Trema at 1600x900 and 390x844, V, VI and XI (statuses do not carry there), Ixion and Bahamut with a Stopped girl: 0 stalls. XV was then won through its aftermath by real keys.
- **PR-0282** (major) resolved: FIXED AND VERIFIED on f302f163 for its acceptance cases. The cure-hint card covers no command row and no advisor card at any measured decision: 390x844 both games (dock above the party chips, 10/10, and under the target card at the target step), 1600x900 and 2000x1012 with the guide folded and open, TEXT SIZE 115 and 130 %, and with the FFX-2 guide hidden; BATTLE HELP OFF hides it in both games (FFX phone at a living-Zombie decision, FFX-2 phone 10/10, FFX desktop). Follow-ups found inside the same card are filed as PR-0302 (type size), PR-0303 (FFX phone tap line) and PR-0304 (FFX-2 desktop empty guide).
- **PR-0240** downgraded major -> polish: The confirmer measured it: at 10 Mbit/s cold the first menu comes at 52.0 s (15.5 s unthrottled), but the V0 music explains only about 2-3 s; the rest is art that live ships too. The music size is owner-approved (D-292) and within the audio budget; RUBRIC names no cold slow-network budget.
- Merged into **PR-0300**: R18b-FN-01 (feel auditor); R18B-GAP2-04 (gap pass attribution)
- Merged into **PR-0301**: R18B-GAP2-05; the feel auditor's "observed, not a finding" seam hand-back timing
- Merged into **PR-0302**: R18B-IF-01 (interface auditor); R18B-GAP2-02 (gap pass)
- Merged into **PR-0303**: R18B-GAP2-01; the "Tap another ally" clip noted under PR-0264 by the capture owner and the confirmer
- Merged into **PR-0304**: R18B-GAP2-03
- Merged into **PR-0305**: R18B-IF-02 (interface auditor); R18B-GAP2-07 (gap pass)
- Merged into **PR-0306**: R18b-CE-01 (combat-encounter auditor)
- Merged into **PR-0249**: R18b-VIS-01 (visual auditor)
- Merged into **PR-0286**: R18B-GAP2-06
- Merged into **PR-0240**: audio auditor PR-0240; delivery auditor PR-0240
- Merged into **PR-0264**: capture owner issue 1 (same defect, two wordings)
- Refuted or narrowed: PR-0240 as framed ("the V0 music over budget makes the cold entry slow") (confirmer measurement): downgraded, see downgradedThisRound
- Refuted or narrowed: The capture owner's "advisor route lost 5/5, XV victory aftermath unverified" (gap pass): XV won by real keys on the same advisor route (seed 1001) through its aftermath
- Refuted or narrowed: PR-0269 "XVIII still loses on the advisor line" (confirmer): narrowed: XVIII won once on seed 1 on the card; XVII still lost

## Ranked issue list (74 open; critical 0, major 13, polish 55, suggestion 6)

### 1. [major] PR-0264 (carried, re-confirmed on f302f163; friends' playtest "Hi-Potion killed Kimahri"): on the phone, a tap on a dimmed ally commits the heal at once, so a Hi-Potion killed the living Zombie Yuna with no forecast, slab or confirm step

- Category: interface
- Game: FFX (confirm-on-tap is shared target code)
- Chapter and state: I Seymour Flux
- Observed: Confirmed twice on f302f163 (capture owner and confirmer), 390x844 touch, seed 1. Yuna is a living Zombie at 750 HP on Kimahri's turn. ITEMS > Hi-Potion opens a target step aimed at Tidus with no forecast; Yuna's figure is ffx-target--dim. One tap on Yuna's figure used the Hi-Potion: 1000 damage, Yuna 0 HP; stfore, stwarn and confirm were empty. When the aim is moved to Yuna by a swipe instead (gap pass), the phone forecast "HI-POTION -1000 KO", the red slab and "HI-POTION -> YUNA" do show. Desktop shows the forecast, slab and HURTS tag.
- Expected: A tap on another ally moves the aim, as the hint says; a second tap or CONFIRM commits, and the Zombie forecast shows before anything lands.
- Repro: Production candidate f302f163 dist-gate, 390x844 touch, fresh profile, setSeed(1) before the first key. Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; next Kimahri turn Items > Hi-Potion, then tap Yuna's figure once. Script: critic/rounds/round-18b/cap/gaps/sF-flux.mjs --touch.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-390x844-touch/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-390x844-touch/04p-after-hipotion-tap.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/flux-zombie-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20-target-hint.png (swipe path shows the forecast)
- Confidence: high (reproduced by two independent runs)
- Requirement: interface: reliable input and honest information; friends' playtest 2026-09-29; CHK-004
- Where (only if traced): 390x844 target step: TargetCursor figure tap -> confirmTarget (src/ui/ffx/TargetCursor.ts onClick path; traced by the gap pass)
- Smallest fix: On touch, a tap on a non-aimed candidate figure moves the aim instead of confirming; only a tap on the aimed figure or the CONFIRM button commits.
- Acceptance check: Same repro: the first tap on Yuna shows the -1000 KO forecast, the red slab and the rim on HI-POTION -> YUNA, and her HP is unchanged until CONFIRM; the desktop key path stays as it is.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Confirmer correction to the capture owner's wording: the tap on Hi-Potion does not commit; it opens a target step aimed at Tidus, and the tap on the dimmed Yuna commits without a forecast or confirm step. The hint card's overlap with the "Tap another ally" line is filed separately as PR-0303.
- STALLED (open at the same severity in rounds 18 and 18b)

### 2. [major] PR-0148 (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (V0 encode, SFX b)

- Category: audio
- Game: both
- Chapter and state: all
- Observed: docs/audio/OWNER-VERDICT.md last changed in 5e5ef411 (2026-09-29 00:07); every entry says no number out of 10 was given. D-307 (an ear question about battle-ffx and boss-vegnagun) is proposed and unanswered. Confirmed by the confirmer.
- Expected: A numeric owner listening verdict recorded against the exact shipped cues (CHK-B1, RUBRIC section 6).
- Repro: Read docs/audio/OWNER-VERDICT.md and decisions.json D-253, D-283 and D-292. No entry gives a score out of 10 for the R1 mix. No seed is needed.
- Evidence: D:/Final Fantasy/docs/audio/OWNER-VERDICT.md; D:/Final Fantasy/docs/target/decisions.json (D-307)
- Confidence: high
- Requirement: RUBRIC section 6 audio: 'Bailey's listening assessment'; CHK-B1
- Where (only if traced): docs/audio/OWNER-VERDICT.md; shipped public/audio/music/*.mp3 (R1)
- Smallest fix: When D-292's O1 (V0 re-encode) lands, send Bailey the audition page with one question: a number out of 10 for the shipped battle, boss and scene cues. Record it verbatim in OWNER-VERDICT.md.
- Acceptance check: OWNER-VERDICT.md has a dated verbatim numeric verdict naming the exact shipped build or cue set.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Owner-reported. Open at major in rounds 15, 16 and 17: STALLED; the next audio batch starts with a method check (RUBRIC section 8).
- STALLED (open at the same severity in rounds 18 and 18b)

### 3. [major] PR-0099 (carried, STALLED; count corrected): nine chapter rows in THEMES.md still play a stand-in cue, Chapter XV included

- Category: audio
- Game: both
- Chapter and state: VI, IX (scene), X, XI, XII, XIII, XIV, XV, XVI (field bed), XVII, XVIII
- Observed: XV plays Chapter V's boss-shuyin and Chapter IV's scene-bevelle-underground at runtime (13 + 1 AudioManager samples), as THEMES.md row XV says. Counting rule (confirmer): rows marked "stand-in" in the THEMES.md chapter cue-map table are VI, X, XII, XIII, XIV, XV, XVI, XVII and XVIII, nine rows; round 18's "11 of 18" counted rows that borrow a cue under another label.
- Expected: D-209: every chapter gets its own composed cue, and a stand-in never counts as finished.
- Repro: node tools/audio/themes-audit.mjs in D:/pyrefly-rel28 lists the '[borrowed; owed]' rows.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/audio-debug.jsonl; D:/Final Fantasy/docs/audio/THEMES.md
- Confidence: high
- Requirement: D-209; RUBRIC section 6 audio (thematic coherence)
- Where (only if traced): docs/audio/THEMES.md chapter cue map; src/data chapter music records
- Smallest fix: After D-292's newer-model test settles the render path, compose the owed cues in priority order (Sin assault and countdown, Omnis, Natus), each auditioned by Bailey before it ships.
- Acceptance check: themes-audit shows no '[borrowed]' for the chapters delivered, with an ear verdict recorded per cue.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- STALLED (open at the same severity in rounds 18 and 18b)

### 4. [major] PR-0265 (carried, re-confirmed on f302f163): tapping ESC RESUME in the pause does nothing on any tab

- Category: interface
- Game: both
- Chapter and state: any battle (proved in Ch I and Ch IV); pause open
- Observed: 390x844 touch, Ch I: on 8 of 8 tabs ESC RESUME is on top and tapped, and the screen stays "pause". Click was not re-run this round (round 18: 0 of 32 by click and tap, both games).
- Expected: One tap or click on RESUME closes the pause and returns to the battle, as Esc does.
- Repro: critic/rounds/round-18b/cap/gaps/sP-pause.mjs resume seymour-flux --touch (390x844, seed 1)
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/pause-resume-seymour-flux-390x844-touch-gap2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/pause-resume-seymour-flux-390x844-touch-gap2/tab-Options-after.jpg
- Confidence: high
- Requirement: CHK-015 (every input a player can use works); RUBRIC §8 major: unusable controls
- Where (only if traced): src/app/screens/PauseScreen.ts:260 (traced: the 'cancel' data-action is handled only when panelsHidden; Input.onClick queues the action string and never presses the cancel button)
- Smallest fix: Wire .pause__back[data-action=cancel] click and touch to the same onResume path as Esc.
- Acceptance check: resume-taps.mjs at 390x844 touch and 1600x900 mouse: the step 'RESUME, focus on tabs' ends with screen=battle, and so does 'RESUME #1 after a row tap' (or #2 at most), in Ch I and Ch IV.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Traced by the chief in D:/pyrefly-rel28/src/app/screens/PauseScreen.ts:260: handleAction closes on the cancel action only when panelsHidden. Same on live 31a (resume-taps-seymour-flux-390x844-live31a), so it is carried, not introduced. A phone player has no Esc key: the only touch way out is H painting only, then RESUME. Both games (shared pause).
- STALLED (open at the same severity in rounds 18 and 18b)

### 5. [major] PR-0283 (carried, re-confirmed on f302f163): after RESTART ENCOUNTER the title root stays mounted over the whole restarted fight

- Category: interface
- Game: both
- Chapter and state: I and IV (any chapter; restart is shared)
- Observed: By keys at 1600x900, Ch I: roots ["title","battle"] from 2 s to 44 s after the restart, then ["title","results"]. Same as round 18 and live 31a / 32.
- Expected: Only the battle screen is mounted after a restart and the chapter's own stage is drawn.
- Repro: critic/rounds/round-18b/cap/gaps/sP-pause.mjs restart seymour-flux (1600x900, seed 1)
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/pause-restart-seymour-flux-1600x900-gap2/run.json
- Confidence: high
- Requirement: CHK-006 and CHK-002 (a full-screen layer is torn down with its screen); CHK-015; RUBRIC §2 retry
- Where (only if traced): pause > OPTIONS > RESTART ENCOUNTER -> src/app/screens/BattleScreen.ts:630-647 requestExit('restart') -> app.runChapter(..., {restart: true}); the title root is not removed on that path (suspected, partly traced)
- Smallest fix: Make runChapter(restart) replace the screen stack the way the board entry does, or unmount any title root before pushing the restarted battle.
- Acceptance check: Real-key and real-click RESTART ENCOUNTER in one FFX and one FFX-2 chapter at 1600x900 and 390x844: roots ['battle'] only and no 'PRESS ENTER' text 2 s, 6 s and one turn after the restart, through to results.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merged: capture owner issue 3, R18-IF-01, gap 'RESTART ENCOUNTER'. Round 09/10 had restart passing by real keys, so this regressed before 31a and was missed by rounds 16-17.

### 6. [major] PR-0269 (carried, narrowed by the confirmer): the advisor line loses Chapter XVII; Chapter XVIII is unreliable on it (1 win in 3 real-key runs across rounds 18 and 18b)

- Category: combat
- Game: FFX
- Chapter and state: XVII Sin Fins/Core and XVIII Sin Face; seeds 1 and 1001
- Observed: Confirmer on f302f163, route18d.mjs following the card, seed 1, 1600x900: XVII DEFEAT (253 turns, 26 advisor orders; the fins link was won and the seam crossed). XVIII VICTORY in 74 turns, where round 18 lost the same seed in 68; the runs diverge at pick 20 because of real-time minigame and timing variance. The gap pass won both chapters through their aftermaths, but with the round-17 in-page policy, not the advisor card.
- Expected: A card that follows sourced play wins a fair share, as the sensible line does (r17: XVIII 31%, XVII 25.5%).
- Repro: Capture owner routes sin-face-win and sin-fins-core-win, 1600x900 and 2000x1012, seeds 1 and 1001.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/sin-fins-core-win/31-results.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/sin-fins-core-win/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/sin-face-win/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json
- Confidence: high
- Requirement: encounter: fair wins; interface: legal and useful advice
- Where (only if traced): the advisor (src/engine/tactics), unchanged since round 17
- Smallest fix: As round 17: give the Sin tactics the race priorities of the sensible line (damage over top-ups while the timer runs).
- Acceptance check: The advisor-card chain wins at least the sensible line's rate minus a small margin on the 200-seed Sin benches, and one real-key XVIII win on the card.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- STALLED (open at the same severity in rounds 18 and 18b)

### 7. [major] PR-0267 (carried, re-run on f302f163): a failed Bushido keeps its time remaining and earns the timing bonus, so a wrong first press out-damages a correct fast sequence; the UI also aborts on the first wrong press, where canon resets the sequence

- Category: combat
- Game: FFX
- Chapter and state: every FFX chapter where Auron has an Overdrive (forked at XVIII sin-face, seed 1, Auron's first Dragon Fang)
- Observed: Confirmer re-ran the bench on the candidate engine: Dragon Fang canon fail (timer expired) 2,432; wrong press with 3.9 s left 3,617; success with 2.5 s left 3,192 (identical to round 18). research/ffx-overdrive-input-rules-2026-09-30.md Q1: on a fail Auron performs the Fail row with no remaining-time bonus, and a wrong press resets the sequence while the attempt continues.
- Expected: research/ffx-combat-core.md §5.5: a failure resolves the Fail row with no time bonus; the §5.2 bonus is for completing early.
- Repro: Run D:/Final Fantasy/critic/rounds/round-18/combat/bushido-fail-bonus.test.ts with vitest.critic.config.ts in D:/pyrefly-rel26c. Input log: round-17 evidence sin-face-win-cand2, seed 1.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/bushido-fail-bonus.json; D:/Final Fantasy/research/ffx-overdrive-input-rules-2026-09-30.md
- Confidence: high (deterministic)
- Requirement: combat correctness; ffx-combat-core §5.2, §5.5
- Where (only if traced): src/battle/ffx/overdrive.ts:457-458; src/ui/ffx/minigames/logic.ts:53, 59-72 (traced in r17; the code is unchanged)
- Smallest fix: Drop the time-remaining bonus when the input fails, and make a wrong press reset the sequence instead of ending the attempt (both per the Q1 research).
- Acceptance check: On the same forked board, a failed sequence deals the same damage whether 3,900 ms or 0 ms remain, and a success beats every failure. FFX goldens stay unchanged.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- STALLED (open at the same severity in rounds 18 and 18b)

### 8. [major] PR-0244 (carried, STALLED): the Ch VII CONFIRM scene narrates the kneel and the fall over a standing Seymour

- Category: feel
- Game: FFX
- Chapter and state: Ch VII seymour-anima-macalania, after the killing blow and after CONFIRM on the victory results
- Observed: Reused from round 18 with a checked dependency argument (story, scenes, engine and art byte-identical): "He went down on one knee..." and "Then he fell..." play over an upright Seymour in every 250 ms frame. D-301 (kneel and fall art) is adopted, delivery in progress, not wired.
- Expected: Seymour kneeling, then KO'd, and Yuna's sending are visible in the frames, or the standing figure is removed. No run of plate without actor and dialogue longer than about 1 s (the PR-0244 acceptance).
- Repro: node critic/rounds/round-17/cap/gaps/ch7-17.mjs --base=<url> --evidence=<dir> --size=1600x900, seed 1, keyboard, advisor route.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/seymour-anima-macalania-win-confirm250/contact-confirm.jpg (reused)
- Confidence: high
- Requirement: PR-0244 acceptance; CHK-022 aftermath
- Where (only if traced): post scene staging (src/story scripts unchanged since live 31a; the file was not traced)
- Smallest fix: During the kneel/fall/sending beats, hide Seymour's standing figure on the plate or swap in kneel/KO poses, and cut or caption the 1.7 s silent plate before results.
- Acceptance check: Same repro, 250 ms frames: no frame shows the standing Seymour while 'He went down on one knee' or 'Then he fell' is on screen, and no silent plate interval is over 1 s.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Kept at major by the chief: the gap pass timed sequences (250-300 ms frames) FAIL the round-16 acceptance on both halves: 1.7 s of plate with no actor or line before results, and the kneel / fall narration over the standing painting. The feel auditor's downgrade rested on stills. Open at major in rounds 16 and 17: STALLED. FFX only.
- STALLED (open at the same severity in rounds 18 and 18b)

### 9. [major] PR-0268 (carried): Bailey adopted the Sin link-3 retry checkpoint (D-284), but SIN_LINK3_CHECKPOINT is still false (sin-genais-core.ts:199 at f302f163)

- Category: prep
- Game: ffx
- Chapter and state: sin-fins-core
- Observed: SIN_LINK3_CHECKPOINT = false on 65152c1b, so a link-3 loss restarts from the Left Fin.
- Expected: Per Bailey's adoption of D-284, a link-3 loss retries from link 3.
- Repro: Read the constant in D:/pyrefly-rel26c. The behaviour is the same as round 17.
- Evidence: D:/pyrefly-rel26c/src/data/ffx/enemies/sin-genais-core.ts:199; D:/pyrefly-rel26c/docs/target/decisions.json D-284
- Confidence: high
- Requirement: docs/target/decisions.json D-284; RUBRIC §6 prep (fast retry)
- Where (only if traced): Link 3 loss -> RETRY; src/data/ffx/enemies/sin-genais-core.ts:199
- Smallest fix: Turn the checkpoint on as adopted (or record Bailey's deferral in decisions.json).
- Acceptance check: A real-key loss at XVII link 3 followed by RETRY lands at link 3; flow-checkpoint-retry covers it.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- STALLED (open at the same severity in rounds 18 and 18b)

### 10. [major] PR-0266 (carried; hudTextSize and CommandMenu unchanged): at TEXT SIZE 130 % the FFX help slab covers the TALK row in round 18's repro state

- Category: interface
- Game: FFX
- Chapter and state: I Seymour Flux, Tidus's command menu after changing TEXT SIZE in OPTIONS
- Observed: Round 18's measurement stands for its state (Tidus's menu, size changed mid-turn). New this round: the gap pass set TEXT SIZE 115 and 130 % by keys and measured Kimahri's Zombie-hint decision in Ch I and Ch IV at 1600x900 and 390x844: every row coveredFrac 0, scrollFits true, hint vs advisor and help slab 0 overlap. So the cure hint and the moved advisor add no new obstacle; the original mid-turn repro was not re-run.
- Expected: Per text-size.css and hudTextSize.ts (target desk-hud-130.jpg): 4 rows at 130 % that scroll with the marks, and no panel or key label over another.
- Repro: Candidate 1a6fd3cc, 1600x900, a release-31a save with comfort flags off (cap/comfort-seed.json), Chapter I by keys to Tidus's first menu, then P, OPTIONS, TEXT SIZE Right x2 to 130 %, Esc back to battle. Script: critic/rounds/round-17/cap/comfort.mjs seymour-flux --size=1600x900.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-seymour-flux-1600x900/03-130.png (reused); D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1600x900-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/run.json
- Confidence: high for the symptom. Medium for the cause: probably the row cap is applied only when the menu is rebuilt, not when TEXT SIZE changes while the list is open (not traced). The next actor's menu was not captured.
- Requirement: CHK-008 / CHK-003 (panels measured against each other and against the actors, nothing a player must read hidden); A2 target desk-hud-130.jpg
- Where (only if traced): src/ui/ffx/CommandMenu.ts:692/697 (commandRowsCap is applied only when rows are rendered; nothing re-renders when data-text-size changes while the list is open; traced by the confirmer); hudTextSize avoid list (suspected) for the key chips and the party panel
- Smallest fix: Re-run the command-row cap and the panel solver when data-text-size changes (on pause close or on attribute change), or rebuild the open menu then. Keep the PAUSE chip clear of the grown advisor key strip.
- Acceptance check: FFX Ch I, IX and XII at 1600x900, 1280x720 and 2000x1012, TEXT SIZE 115 and 130 % set mid-turn by real keys: the same-turn and next-turn menus show the capped rows plus the scroll mark, TALK fully visible, the acting character's head and torso visible, and 0 intersections among the PAUSE / N / G chips, the help slab, the rows, the party panel and the projected actor quads.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: hudTextSize.ts is unchanged since round 17. The new O3 hint card and icon rows are not in the growth/collision solver either (see PR-0282).
- STALLED (open at the same severity in rounds 18 and 18b)

### 11. [major] PR-0270 (carried; owner-gated switch unchanged): TEXT SIZE grows nothing in the FFX-2 battle HUD

- Category: onboarding
- Game: FFX-2
- Chapter and state: IV Bahamut
- Observed: TEXT_SIZE_WIDE_SCOPE is still false (applyComfort.ts unchanged). The gap pass measured the FFX-2 desktop cure hint at 15.2 px at 100, 115 and 130 %, while the FFX one grows 15.2 -> 17.5 -> 19.7 px.
- Expected: A2 says TEXT SIZE grows the battle HUD, dialogue and menus in both games; the FFX-2 pass waits on Bailey's D-220 Q4 pick.
- Repro: cap/comfort2.mjs ffx2-bahamut --size=1600x900 and --size=390x844 --phone (real keys: P, OPTIONS, TEXT SIZE Right).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-ffx2-bahamut-1600x900/run.json (reused); D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/run.json
- Confidence: high
- Requirement: A2 (D-285); docs/handoff/r31-access.md CHECK major 2 (disclosed)
- Where (only if traced): app/applyComfort.ts TEXT_SIZE_WIDE_SCOPE=false; text-size-wide.css not active
- Smallest fix: Before Q4: label the row honestly (for example "FFX battle HUD and dialogue"). After Bailey's Q4 pick: switch on TEXT_SIZE_WIDE_SCOPE with the FFX-2 intent-board solver slot.
- Acceptance check: After Q4: the FFX-2 command, party and advisor panels grow at 115/130 % on desktop and phone with no overlaps, measured by the comfort probe.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- STALLED (open at the same severity in rounds 18 and 18b)

### 12. [major] PR-0284 (carried, re-confirmed on f302f163): REPLAY BRIEFING opens under the pause UI

- Category: onboarding
- Game: both
- Chapter and state: I and IV (any chapter)
- Observed: By Enter and by click, Ch I 1600x900: .coach-brief (z 90) is under DIV.pause__ui at 0.5 s and 2 s; one Esc removes it unseen.
- Expected: The briefing is drawn over the pause, a click, tap or Enter advances or closes it, and the next Esc returns to the pause and then the fight.
- Repro: critic/rounds/round-18b/cap/gaps/sP-pause.mjs brief seymour-flux
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/pause-brief-seymour-flux-1600x900-gap2/run.json
- Confidence: high
- Requirement: RUBRIC §6 onboarding (optional help reachable); CHK-006; CHK-015
- Where (only if traced): pause > OPTIONS > REPLAY BRIEFING; .coach-brief mounts full-viewport inside the battle root (z 90 inside z 10) beneath pause__ui
- Smallest fix: Mount the replayed briefing above the pause layer (or close the pause while it plays) and let a click or tap advance it.
- Acceptance check: By Enter, click and tap in both games at 1600x900 and 390x844: the briefing text is on top (elementFromPoint inside .coach-brief) 0.5 s after activation; a click/tap advances it; one Esc after it closes returns to the pause and one more to the battle.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 13. [major] PR-0222 (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

- Category: delivery
- Game: FF7 (hidden experiment)
- Chapter and state: FF7 Guard Scorpion (unlisted)
- Observed: Not captured this round. No FF7 file and no shipped asset changed between 65152c1b and f302f163.
- Expected: No black hold: the swirl's last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- Repro: Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears. Press Esc and arrows during the hold.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/prep-delivery/diff-vs-r18-candidate-65152c1b.txt
- Confidence: low (unverified either way)
- Requirement: CHK-017 / CHK-025; RUBRIC §5
- Where (only if traced): secret door -> swirl -> field, cold cache
- Smallest fix: None proposed until it is observed.
- Acceptance check: No black sample longer than 1 s, the field arrives, and Esc and arrows during the hold neither lock nor start anything.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- STALLED (open at the same severity in rounds 18 and 18b)

### 14. [polish] PR-0300 (new; R18b-FN-01 + R18B-GAP2-04): at every Chapter XV link seam the painted cave plate stops short of the right edge, leaving a black band (21-25 % of the width for about 1.1 s, still about 8 % at 2.5 s); live 32 is full-bleed

- Category: feel
- Game: FFX-2 only (seen in XV; VI shows a 6-7 % margin for about 1 s; VIII, XIII and XIV fill the frame)
- Chapter and state: XV ffx2-den-of-woe, seams link 1->2 and 2->3, moment:battle-start
- Observed: In 13 of 13 seam sequences on the candidate (real keys and injected lanes; 1600x900 and 2000x1012; with or without a Stopped girl), frames from 0.05 to 0.76 s have no column with mean luma above 6 past 75-79 % of the width; the plate ends in a hard vertical edge with black beyond it. Live 32 (bundle ChAAAZ-I), same seed and lane, and live 31a cover the frame for the whole sequence. Present already in 65152c1b, where the PR-0281 freeze hid it.
- Expected: The scene plate fills the frame at every camera rest of the seam, as on live.
- Repro: setSeed(1), 1600x900, Ch XV by advisor keys to the link 1->2 seam (route18d.mjs seq-seam-2), or critic/rounds/round-18b/cap/gaps/sSeamStop2.mjs with and without --q=cam=current; 8 frames every 350 ms from the link change.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/feel-narr/den-seam-f00-cand-vs-live31a.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-default.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-camcur.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-live32.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-seq-seam-2/
- Confidence: high for the observation (per-column luma on every frame, A/B against live 32); cause not traced
- Requirement: RUBRIC section 6 feel (coherent camera, smooth transitions) and visual (correct rendering); CHK-002 coverage. Scored once, under feel.
- Where (only if traced): not traced; the gap pass ruled the calm camera out (?cam=current shows the band too, plate edge at x~1270 at 366 ms; default camera edge at x~1470 at 1.8 s)
- Smallest fix: Find which plate or scale change since live 32 shortened the den floor plate at this framing; extend or scale the plate to cover the battle-start moment's widest framing, or clamp the moment camera to the plate bounds. Do not replace the approved painting.
- Acceptance check: Ch XV seams 1->2 and 2->3 at 1600x900 and 2000x1012, seeds 1 and 2, both camera modes: in every frame the rightmost column with mean luma above 6 is at least 95 % of the width.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature false
- Note: Polish, not major: about a second at one chapter's two seams, with the frame filling as the camera settles. Introduced by the release-33 line (already in 65152c1b), not by the r33-fix diff.

### 15. [polish] PR-0301 (new; R18B-GAP2-05): FFX-2 chain seams hand control back about 2.5-3 s later than live 32, because the battle-start moment now runs 2.9-3.1 s instead of 0.6-0.75 s

- Category: feel
- Game: FFX-2 (every chain seam measured: XV and XI)
- Chapter and state: XV ffx2-den-of-woe and XI ffx2-fallen-aeons, seams
- Observed: Same lane on both builds (setSeed 1, labelled Stop and hasten injection), seam -> first party menu: XV live 13.3 / 14.5 s vs candidate 15.8 / 17.4 s; XI live 13.2 / 13.8 s vs candidate 16.1 / 16.4 s. moment:battle-start: live 617-752 ms, candidate 2,862-3,114 ms (2,238 ms with OS reduced motion). The rest of the hand-back (ATB refill plus one enemy action) matches live.
- Expected: A seam no slower than live, unless the longer opening is an approved end-state choice.
- Repro: critic/rounds/round-18b/cap/gaps/sSeamStop2.mjs ffx2-den-of-woe and ffx2-fallen-aeons, setSeed(1), 1600x900; --base=https://baileypillon.github.io/pyrefly-reprise/ for live 32.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-live32-ffx2-den-of-woe-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-live32-ffx2-fallen-aeons-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-default-ffx2-den-of-woe-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-cand-ffx2-fallen-aeons-1600x900/run.json
- Confidence: high for the timing; cause not traced
- Requirement: RUBRIC section 6 feel (responsive input, smooth transitions)
- Where (only if traced): not traced; suspected: the slide-in that the PR-0281 fix now lets finish, or the steady pacing / calm camera defaults of the release-33 line
- Smallest fix: Trace which change lengthened moment:battle-start. If it is the intended look, show Bailey the A/B frames and record the decision; otherwise bring it back to about 0.6 s or open input during it.
- Acceptance check: Same lane on the next candidate: moment:battle-start at most 1 s, or a recorded decision approving the longer opening; seam -> first menu within 0.5 s of live.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature false
- Note: Polish: about 2.5 s more per seam on a 13-17 s hand-back. A question for Bailey if the longer opening is intended.

### 16. [polish] PR-0302 (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- Category: interface
- Game: both
- Chapter and state: I (Zombie), IV (Curse); any hinted status
- Observed: Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- Expected: CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- Repro: critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- Confidence: high (measured)
- Requirement: CHK-003; RUBRIC section 5 (effective text size)
- Where (only if traced): src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- Smallest fix: Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- Acceptance check: Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true

### 17. [polish] PR-0303 (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- Category: interface
- Game: FFX (FFX-2's shorter target card leaves room: 0 px2)
- Chapter and state: I seymour-flux, a target step with a hinted status (Zombie)
- Observed: 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- Expected: The target-step instructions and the hint do not overlap (CHK-008).
- Repro: Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- Confidence: high
- Requirement: CHK-008; PR-0282 acceptance (the hint never over the command surface)
- Where (only if traced): src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- Smallest fix: Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- Acceptance check: 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true

### 18. [polish] PR-0304 (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- Category: interface
- Game: FFX-2 (desktop, guide open)
- Chapter and state: IV ffx2-bahamut, the girls' menus after Curse lands
- Observed: At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- Expected: While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- Repro: Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- Confidence: medium (symptom high; cause suspected)
- Requirement: Status O3 target (the hint in the guide's slot); CHK-008
- Where (only if traced): suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- Smallest fix: Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- Acceptance check: 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true

### 19. [polish] PR-0305 (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- Category: onboarding
- Game: FFX-2 (the FFX help line follows each actor in both modes)
- Chapter and state: IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
- Observed: Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- Expected: The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- Repro: 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- Confidence: medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- Requirement: CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- Where (only if traced): suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- Smallest fix: Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- Acceptance check: BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- Tags: introducedByCandidate false, regressionVsLive "unknown", inNewFeature false

### 20. [polish] PR-0291 (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- Category: interface
- Game: FFX
- Chapter and state: I
- Observed: The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- Expected: As in the approved O3 target, both panels are readable.
- Repro: Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- Confidence: high
- Requirement: approved target O3 / interface readability
- Where (only if traced): 1600x900 Items list aimed at a Zombie
- Smallest fix: Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- Acceptance check: No overlap between .stwarn and the Guide card rect in that frame.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Re-observed on f302f163 and widened (visual auditor): at 1600x900 with the guide open, the red Zombie warning slab and also the grey TALK help slab ("A one-off action this encounter offers") overprint the Guide card's NEXT "Holy Water -> Yuna" line. Round 18's frame is identical.

### 21. [polish] PR-0290 (new, status O3): the phone Curse hint drops Esuna and Remedy ('Paine is cursed: Holy Water cures it.') that the desktop hint lists

- Category: onboarding
- Game: FFX-2
- Chapter and state: Ch IV
- Observed: Phone: 'Paine is cursed: Holy Water cures it.' Desktop: '… Holy Water, Esuna or a Remedy cures it.'
- Expected: The same cure list at every size.
- Repro: FFX-2 Ch IV with Curse on Paine, desktop and phone.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-bahamut-win/11-advisor.png
- Confidence: high (seen again in the gap pass at every phone decision)
- Requirement: RUBRIC §6 onboarding (help that teaches the faithful rules)
- Where (only if traced): 390x844 cure hint
- Smallest fix: Use the full sourced cure list on the phone as well, wrapped to two lines.
- Acceptance check: The phone and desktop hint texts name the same cures for every status in both games.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Re-observed at 10 of 10 FFX-2 phone decisions on f302f163: "Paine is cursed: Holy Water cures it." while desktop reads "Holy Water, Esuna or a Remedy cures it." The new phone dock leaves room for two lines.

### 22. [polish] PR-0286 (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- Category: interface
- Game: FFX
- Chapter and state: Ch I
- Observed: 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- Expected: The message and the dialogue text do not overlap.
- Repro: 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- Confidence: medium
- Requirement: CHK-008
- Where (only if traced): 390x844, a status lands while a battle line is on screen
- Smallest fix: Offset the message line below the banner while a line is up, or queue it until the line ends.
- Acceptance check: Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Widened by the gap pass (merged R18B-GAP2-06): at 1280x960 FFX desktop, "Kimahri was hasted." (371 px2) and then "Yuna became a Zombie." (568 px2) overlap the visible dialogue text for about 2.5 s (13 samples at 200 ms); no overlap at 1600x900, 2000x1012, 2560x1080 or 3840x2160. On the FFX-2 phone the new floor (withStatusLooks.ts) moves the message clear of the docked hint within one 200 ms sample. The FFX phone had 0 px2 of message over dialogue in 15 samples.

### 23. [polish] PR-0285 (new, status O3): the status message line trails the event it names by 1.6-2.5 s and splits one Hastega into three lines

- Category: feel
- Game: both (message line); seen in FFX Ch I
- Chapter and state: I Seymour Flux, seed 1
- Observed: 100 ms frames from the Hastega confirm: 'Tidus was hasted.' 1.29 s, 'Tidus and Yuna were hasted.' 1.5 s, 'Kimahri was hasted.' 3.27-5.2 s, while Lance of Atrophy hits Yuna at ~2.8 s and she is visibly green by ~3.7 s; 'Yuna became a Zombie.' appears only at 5.32 s, under Seymour's 'Let it in.'.
- Expected: The line appears with the event it names; one multi-target cast reads as one line.
- Repro: Seed 1, Ch I, 1600x900: Tidus White Magic > Hastega > confirm; capture 100 ms frames for 6 s.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/seq-hastega-to-lance/frames.json
- Confidence: high
- Requirement: feel: action and reaction timing
- Where (only if traced): status message line (stmsg) queue
- Smallest fix: Collapse lines from one action into one, and drop or replace stale queued lines when a newer status event arrives (or shorten the per-line hold).
- Acceptance check: The same run shows 'Yuna became a Zombie.' within 500 ms of her Zombie tint and one haste line for the one Hastega.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Re-confirmed on f302f163 (100 ms frames): "Tidus was hasted." 1.19 s, "Tidus and Yuna were hasted." 1.52 s, "Kimahri was hasted." 3.30-5.15 s, "Yuna became a Zombie." only at 5.26 s, under "Let it in.".

### 24. [polish] PR-0240 (downgraded major -> polish after a measurement): a cold chapter entry at 10 Mbit/s reaches the first menu at 52 s (15.5 s unthrottled); the V0 music adds only about 2-3 s of it

- Category: delivery
- Game: both
- Chapter and state: all
- Observed: Confirmer, headless gpu, CDP throttling 10 Mbit/s down + 40 ms, cache cleared, Ch I 1600x900, from Enter on the chapter card: first command menu 52.0 s throttled vs 15.5 s unthrottled; boss-seymour playing at 32.6 s vs 6.2 s. Chapter entry fetched two music files (scene-gagazet 3.10 MB, boss-seymour 2.96 MB), about 4.8 s at 10 Mbit/s; live's encode would be about 2.4 s. The rest of the 36 s penalty is art that is identical to live. The music growth was approved by Bailey (D-292) and is within the 85 MB audio budget (80.93 MB; D-306 raises it to 90). RUBRIC names a five-second load goal but no cold slow-network budget.
- Expected: A first battle within the platform load goal on named slow-network conditions (RUBRIC section 2: a load under 5 s).
- Repro: critic/rounds/round-18b cap/confirm cold10 script: cold profile, CDP 10 Mbit/s + 40 ms, Ch I at 1600x900, time from Enter on the chapter card to the first menu and to the battle cue.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/cold10-seymour-flux/cold10.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/warmnet-seymour-flux/cold10.json; D:/Final Fantasy/critic/rounds/round-18b/audio/qa-strict.txt
- Confidence: medium (one run each; toBattle's fixed waits add the same overhead to both)
- Requirement: RUBRIC §2 platform goals; §6 delivery (measured loading)
- Where (only if traced): chapter entry on a cold cache
- Smallest fix: Start the battle before every chapter plate has arrived (progressive art: a low-resolution plate first), and defer the boss cue behind the SFX sprite. Measure the art share first.
- Acceptance check: A named 10 Mbit/s cold run per game: first menu within a budget Bailey sets (none exists today), and the music share recorded.
- Tags: introducedByCandidate false, regressionVsLive "unknown", inNewFeature false
- Note: Merged the audio auditor's and the delivery auditor's PR-0240 entries into this one. Downgraded: the confirmer refuted "music over budget" as framed; the slow entry is art-dominated and exists on live too, and the ~2-3 s music share is an owner-approved size.
- STALLED (open at the same severity in rounds 18 and 18b)

### 25. [polish] PR-0263 (carried, downgraded major -> polish; friends' "no attack SFX"): the fix is delivered by D-293 (SFX b, bus 0.70 in 185/185 samples; a hit's true peak now ~1.5 dB under the music's, was ~7.5 dB) but no ear has confirmed it

- Category: audio
- Game: both
- Chapter and state: all battles
- Observed: The runtime SFX bus is 0.70 in 185 of 185 candidate samples. Measured, not heard: a hit's true peak now sits about 1.5 dB under the music's true peak (hit-1 at -1.02 dBTP x0.7 bus x0.8 cue volume, against music at -1.5 dBTP x0.7). It was about 7.5 dB under. The whiff's 400 ms momentary sits about 7.5 dB under the battle music's median (it was about 13.5 dB under). The two estimates use different windows, so they do not compare directly.
- Expected: D-293 balance b: effects +6 dB against D-210, so a hit lands about level with the music's peaks.
- Repro: Default profile, any chapter: land an attack and a miss. Read the audio debug sfxMix, and see src/engine/BattlePresenterBeats.ts:130 and BattlePresenterEvents.ts:229.
- Evidence: evidence/*/audio-debug.jsonl; critic/rounds/round-17/audio-r17-sfx-vs-music.json (reused, dependency: the sprite is sha-identical and the music loudness is within 0.02 LU)
- Confidence: medium
- Requirement: D-293; CHK-B1
- Smallest fix: None in code. Ask Bailey or the friends to confirm by ear that hits now read over the music. If the miss still disappears, consider the miss cue's own volume of 0.5.
- Acceptance check: An owner or playtester ear note says the attack SFX are audible at the default settings.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 26. [polish] PR-0061 (carried, STALLED, now worse): hold-skip to the first usable menu takes 11.4-12.4 s at the new defaults, about 2.7 s longer than ?pace=current&cam=current (8.7-9.7 s)

- Category: feel
- Game: both
- Chapter and state: Ch I, IV, VII at 1600x900
- Observed: Gap pass, GPU idle (5 %), 3 runs each: default (steady pace, calm camera) Ch I 11406/11484/11497 ms, Ch IV 12157/11962/12368, Ch VII 11516/11608/11648; ?pace=current&cam=current Ch I 8681/8852/8999, IV 9686/9567/9600, VII 8781/8758/8763. The scene itself ends 1.1-1.5 s into the hold, so the rest is intro dolly and enemy-intro beats.
- Expected: Under 3 s.
- Repro: node critic/rounds/round-17/cap/gaps/latency17.mjs <chapter> --base=<url> --evidence=<dir>
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/logs/","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/hold-seymour-flux-default-r1/run.json","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/hold-seymour-flux-current-r1/run.json"]
- Confidence: high
- Requirement: PR-0061 acceptance
- Smallest fix: After a hold-skip, skip or compress the intro dolly and enemy-intro beats regardless of the pace preset.
- Acceptance check: holdToFirstMenuMs < 3000 in I, IV and VII at the default settings.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature false
- Note: Reused from round 18 (presenter, camera and pace code unchanged in this diff).
- STALLED (open at the same severity in rounds 18 and 18b)

### 27. [polish] PR-0104 (carried, 4th review, STALLED): under Wait, a confirmed FFX-2 support command (Shell) shows nothing but a cast pose; the next menu opens at 2.27 s

- Category: feel
- Game: FFX-2
- Chapter and state: IV ffx2-bahamut (1600x900) and VI ffx2-leblanc (2000x1012); XVI on 390x844 shows only a help line
- Observed: Gap pass, 100 ms frames from White Magic > Shell > All allies (Wait, keys): no frame from 0 to 2.2 s shows 'Shell' anywhere; Yuna takes her cast pose; the next menu opens at 2.27 s (round 17: 1.8 s).
- Expected: A confirmed command gets immediate visible acknowledgement, such as its name chip over the actor or a charge cue, while it waits for its turn.
- Repro: Candidate 1a6fd3cc, Ch IV at 1600x900, seed 1: Yuna, White Magic, Shell, All allies.
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/contact-shell.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/seq-shell-confirm-100ms/"]
- Confidence: high on what is shown; FFX-2 charge time itself is canon
- Requirement: RUBRIC §6 feel (input-to-response)
- Smallest fix: Under Wait, show the queued command's name chip over the actor at confirm (FFX-2 only), kept until the action starts.
- Acceptance check: A frame within 300 ms of the confirm shows the command name on or next to the actor, at 1600x900 and 390x844.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Reused from round 18 (FFX-2 HUD and presenter unchanged in this diff).
- STALLED (open at the same severity in rounds 18 and 18b)

### 28. [polish] PR-0289 (new, first run O2): step 1 says 'Start with the first one' while the spot sits on another selected chapter

- Category: onboarding
- Game: both
- Chapter and state: chapter select, first run
- Observed: The plate shows CHAPTER XVI Ixion while the slab reads 'Start with the first one. Tap its picture to begin.' This is a documented open item in firstrun-o2.md.
- Expected: The words match the picture the spot points at, or the spot stays on Chapter I.
- Repro: Fresh profile, 390x844. Choose Ixion on the board before tapping the plate.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/run.json
- Confidence: high
- Requirement: RUBRIC §6 onboarding; approved O2 target (only Chapter I drawn)
- Where (only if traced): 390x844 and desktop board, guide step 1, a chapter other than I selected
- Smallest fix: Ask Bailey which: keep the spot on Chapter I, or reword to 'Tap its picture to begin.' without 'the first one'.
- Acceptance check: With a non-first chapter selected, the slab never says 'the first one'.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Re-observed in all six real-flow runs on f302f163: O2 step 1 says "Start with the first one." while Chapter XV or IV is selected.

### 29. [polish] PR-0292 (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- Category: onboarding
- Game: FFX
- Chapter and state: I prep
- Observed: No key binding: Tab is WALK, A is Left. The phone explainer reads 'CLICK TWICE… press Enter… wheel to zoom' and 'Enter or click again'. On the phone the explainer's buttons start below the fold (one swipe reaches them).
- Expected: Every control has a key or pad route, and touch wording on touch screens.
- Repro: Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- Confidence: high
- Requirement: onboarding: input access
- Where (only if traced): Sphere Grid tab
- Smallest fix: Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- Acceptance check: A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 30. [polish] PR-0287 (new): the FFX-2 OPTIONS settings column overflows at rest (STRATEGY GUIDE cut through the middle, BATTLE HELP below the fold); keyboard and wheel still reach every row

- Category: interface
- Game: FFX-2
- Chapter and state: Ch IV
- Observed: With 3 more rows, the column scrolls (scrollHeight 423 against clientHeight 378). STRATEGY GUIDE is cut through its middle above the chapter caption, and BATTLE HELP is hidden. On live 31a all rows fit (249 px). FFX fits.
- Expected: Every settings row is visible, or a clear scroll cue is shown.
- Repro: FFX-2 chapter, Esc, OPTIONS tab, at 1600x900 or 2000x1012.
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/probe2-ffx2-bahamut-1600x900-cand/10-options-at-rest.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-scroll-ffx2-bahamut-1600x900/","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-scroll-ffx2-bahamut-1600x900-wheel/"]
- Confidence: high
- Requirement: CHK-009, CHK-002
- Where (only if traced): pause OPTIONS at 1600x900 and 2000x1012
- Smallest fix: Give the FFX-2 settings column the height it needs (the caption can move down), or add a visible more-below cue. Keyboard focus must scroll the row into view.
- Acceptance check: All 15 FFX-2 rows are fully visible (or reachable with a visible cue) at 1600x900 and 2000x1012, and ArrowDown reaches BATTLE HELP with it on screen.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature true
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 31. [polish] PR-0288 (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- Category: interface
- Game: FFX
- Chapter and state: Ch I
- Observed: 'TIDUS · Nothing left to say — A one-off action this enc…'
- Expected: The full help sentence, wrapped if needed.
- Repro: 390x844 Ch I after Talk is used up, cursor on TALK.
- Evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- Confidence: high
- Requirement: CHK-009
- Where (only if traced): 390x844 command menu, TALK disabled
- Smallest fix: Allow two lines, or shorten the copy for the phone.
- Acceptance check: scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 32. [polish] PR-0294 (new finding): the phone OPTIONS settings list is a ~100 px scroll window (4 of 10-12 rows visible), so the three new eye-candy rows need scrolling with little cue

- Category: onboarding
- Game: both
- Chapter and state: all
- Observed: 4 of 10 (FFX) or 12 (FFX-2) rows show in a 100 px scroller (top 439, bottom 539). The only cue is a faded partial row. Raw touch drags do reach and flip all three new rows (probe3b), but synthesized scroll gestures did not move the tab strip (probe3).
- Expected: The rows are discoverable and reachable by a thumb.
- Repro: 390x844: tap the pause chip, swipe the tab strip to OPTIONS, look at SETTINGS.
- Evidence: round-18/evidence/probe3b-seymour-flux-390x844-cand/11-options-by-tap.jpg, 23-fxSpectacle.jpg; logs/probe3b-*.log
- Confidence: high
- Requirement: RUBRIC §6 onboarding (device usability); CHK-015
- Where (only if traced): 390x844 pause OPTIONS
- Smallest fix: Let the phone OPTIONS page scroll as one page, or give the settings list more height and a visible more-below cue.
- Acceptance check: At 390x844 every settings row can be seen by scrolling the page, with a visible cue, in both games.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 33. [polish] PR-0293 (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- Category: visual
- Game: both
- Chapter and state: I, IV, VII, XVII, XVIII (every chapter checked)
- Observed: Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- Expected: CHK-002: the pause painting covers the window at every supported size.
- Repro: Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- Confidence: high
- Requirement: CHK-002
- Where (only if traced): pause layer at 4K (the 3360x1920 master is not scaled to cover)
- Smallest fix: Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- Acceptance check: pauseRect.full is true at 3840x2160 in both games.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- Note: Confirmed on f302f163 by the gap pass: pauseRect [-4,-2,3368x1925] in FFX (kimahri.2x.webp 3360x1920) and [-4,-2,3369x1925] in FFX-2; full=false in both.

### 34. [polish] PR-0251 (carried, re-measured at 4:3): at 1280x960 the battle HUD falls to 9.3-9.8 px effective with 32-35 visible elements under the 14 px floor

- Category: interface
- Game: both
- Chapter and state: Ch I and Ch IV battle HUD; pause OPTIONS on a phone
- Observed: Gap pass, fresh context at 1280x960: FFX min 9.8 px (32 elements under 14), FFX-2 min 9.3 px (35 under 14): CTB names 10.8 px, item badges 12.9 px, HP denominators 12.4 px, OD 9.8 px. At 2560x1080 the minimum is 13.6-13.9 px with 3-7 elements under 14; 2560x1440 menus 13.8 px with 2 under 14 (the coach footer).
- Expected: Zero text a player must read under 14 px effective at the CHK-002 viewports.
- Repro: node critic/rounds/round-17/cap/gaps/sweep.mjs <chapter> <WxH> [touch]
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-1280x960/run.json","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-ffx2-bahamut-1280x960/run.json","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-2560x1080/run.json"]
- Confidence: high
- Requirement: CHK-003; PR-0251 acceptance (text part)
- Smallest fix: Floor the stage-scaled HUD labels at 14 px effective (CTB names, badges, OD, FFX-2 job and max-HP spans), and raise the phone pause .pause__k / .pause__v / .pause__tab to 14 px.
- Acceptance check: sweep.mjs reports under14 = 0 for the battle HUD at 1600x900, 1280x960 and 390x844, and for every pause tab at 390x844.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 35. [polish] PR-0032 (carried, weight up): no REDUCE FLASHES row and no key remapping, while the new default look adds ink impact frames and lens flares; the soft-flash path exists but reads a setting no row writes

- Category: onboarding
- Game: both
- Chapter and state: all
- Observed: The spectacle defaults on:
- Up to 3 ink impact frames per rolling second (SpectacleRules FlashBudget).
- Lens flares (LensFlare).

A 'soft' impact frame and a 0.35 flare peak exist behind eyeCandy.reduceFlashes, but fxEnv reads a 'reduceFlashes' setting that no row writes (settingsAtBoard has no such key). The workarounds are REDUCE MOTION (removes impact frames) or turning off BATTLE SPECTACLE and CINEMA LIGHT, and none of those rows mentions flashes. Remapping is still absent.
- Expected: A player-reachable flash reduction when the default look flashes. Remapping stays a Bailey decision.
- Repro: Pause OPTIONS in either game: there is no flash row.
- Evidence: D:/pyrefly-rel26c/src/engine/fx/c/SpectacleRules.ts:43,181,201; src/app/fxEnv.ts:41; round-18/evidence/fxrows-*/run.json settingsAtBoard
- Confidence: high
- Requirement: RUBRIC §6 onboarding (motion and flash accommodations); D-220 Q7 undecided
- Where (only if traced): pause OPTIONS; battle with BATTLE SPECTACLE and CINEMA LIGHT on (default)
- Smallest fix: Ask Bailey (D-220 Q7). If yes, add a REDUCE FLASHES row writing settings.reduceFlashes. Until then, name the flash in the BATTLE SPECTACLE row's help.
- Acceptance check: A row toggles reduceFlashes by keys, mouse and taps. With it on, impactFrame is 'soft' and the flare peak is 0.35. It persists across a reload.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 36. [polish] PR-0237 (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- Category: interface
- Game: FFX-2
- Chapter and state: Ch XVI, Ch IV
- Observed: Rikku's line lies over 'IXION ACTS NEXT … MOST LIKELY 83%' and the random-target list, and over 'BAHAMUT ACTS NEXT … SCRIPTED'.
- Expected: The intent line stays readable.
- Repro: Fresh profile at 390x844, FFX-2 chapter, first menu.
- Evidence: round-18/evidence/ffx2-ixion-djose-win-touch/10-first-menu-coach.png; probe-ffx2-bahamut-390x844-touch-cand/10-status-hint-over-commands.jpg
- Confidence: high
- Requirement: CHK-008
- Where (only if traced): 390x844 first command menu
- Smallest fix: As in round 17.
- Acceptance check: Coach box ∩ intent box = 0 at 390x844.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 37. [polish] PR-0249 (carried, widened): the FFX-2 intent card covers the girls at 1600x900, in multi-target (Yuna's lower body) and at Yuna's WHITE MAGIC list (Rikku's and Paine's heads)

- Category: interface
- Game: FFX-2
- Chapter and state: IV Bahamut
- Observed: Heads are now clear. The intent card (x 10 to 385, y 560 to 880) sits over the White Mage's skirt and the end of her staff.
- Expected: No panel over a face or a weapon.
- Repro: Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-1600x900/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-1600x900-osrm/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-x2-osrm-d02-paine.jpg
- Confidence: low
- Requirement: CHK-008
- Smallest fix: Add the projected party quads to the intent card's placement test while targeting.
- Acceptance check: Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Widened (merged R18b-VIS-01): in Ch IV at 1600x900 the default intent card also covers Rikku's head and Paine's head and torso while Yuna's WHITE MAGIC list is open, which hides Paine's Cursed darkening; the same with REDUCE MOTION on. Intent and camera code are unchanged in this diff.
- STALLED (open at the same severity in rounds 18 and 18b)

### 38. [polish] PR-0275 (carried, confirmed): the board truncates 'Sin: the Fins and the …' and clips the Roman-numeral strip

- Category: interface
- Game: both
- Chapter and state: chapter select
- Observed: Unchanged: 'Sin: the Fins and the …', and 'VII'', 'KIV', 'KVII'' in the strip.
- Expected: Full names, and whole numerals.
- Repro: Open the board at 1600x900 or 2000x1012.
- Evidence: round-18/evidence/seymour-natus-win/35-board-reload.png; seymour-flux-win/03-card.png
- Confidence: high
- Requirement: CHK-009
- Where (only if traced): 1600x900 and 2000x1012
- Smallest fix: As in round 17.
- Acceptance check: scrollWidth <= clientWidth + 1 on every board row and numeral chip at 1280, 1600, 2000 and 3840.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 39. [polish] PR-0250 (carried, confirmed): the phone results location caption is clipped

- Category: interface
- Game: FFX
- Chapter and state: Ch XII
- Observed: 'INSIDE SIN — THE GARDEN C…'
- Expected: The full caption.
- Repro: Lose or win Ch XII at 390x844.
- Evidence: round-18/evidence/seymour-omnis-win-touch/31-results.png
- Confidence: high
- Requirement: CHK-009
- Where (only if traced): 390x844 results
- Smallest fix: As in round 17.
- Acceptance check: The caption's scrollHeight <= clientHeight + 1 at 390x844.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 40. [polish] PR-0274 (carried, confirmed): no advisor card at the first command menu of either Sin chapter

- Category: interface
- Game: FFX
- Chapter and state: XVII, XVIII
- Observed: cardFirst.card is null in sin-face-win (1600x900) and sin-fins-core-win (2000x1012), although cardText exists in the DOM.
- Expected: The advisor card is shown by default, as in every other chapter.
- Repro: Enter Ch XVII or XVIII and reach the first menu.
- Evidence: round-18/evidence/sin-face-win/run.json cardFirst; sin-fins-core-win/run.json cardFirst
- Confidence: high
- Requirement: CHK-004
- Where (only if traced): first command menu
- Smallest fix: As in round 17.
- Acceptance check: The card is visible (non-null box) at the first menu of both Sin chapters.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 41. [polish] PR-0296 (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- Category: interface
- Game: FFX
- Chapter and state: XVII sin-fins-core, first decisions
- Observed: Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- Expected: CHK-008: plates never cover the intent text.
- Repro: 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/"]
- Confidence: medium (frames only)
- Requirement: CHK-008
- Where (only if traced): 390x844 battle HUD
- Smallest fix: Reserve the intent line's band from the range plate on the phone layout.
- Acceptance check: No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 42. [polish] PR-0295 (new finding, outside the changed area): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed at 0.61 (tiny text), unlike CHAPTER and SPHERE GRID

- Category: prep
- Game: FFX
- Chapter and state: party prep, any FFX chapter
- Observed: Gap pass (sphere-phonetabs-390x844-touch): only CHAPTER and SPHERE GRID have a phone page; the other four tabs are the scaled desktop board.
- Expected: Every prep tab is usable at phone size (RUBRIC §6 device usability).
- Repro: 390x844 touch, Ch I prep, swipe through the tabs.
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-phonetabs-390x844-touch/"]
- Confidence: high
- Requirement: RUBRIC §6 onboarding/prep device usability; CHK-003
- Where (only if traced): 390x844 party prep tabs
- Smallest fix: Give the remaining prep tabs the phone page treatment Sphere Grid B introduced.
- Acceptance check: CHK-003 sweep of each prep tab at 390x844: no player text under 14 px.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried (prep code unchanged).

### 43. [polish] PR-0259 (carried, improved): isolated frame-time spikes of 66-117 ms in fights

- Category: delivery
- Game: both
- Chapter and state: sin-face, seymour-flux, ffx2-ixion-djose
- Observed: Maximum spikes of 116.7 ms (XVIII, 4 frames over 50 ms), 83 ms (I) and 66.5 ms (XVI phone tier), with fx on and off alike. Average 59-60 fps, p95 16.7-16.8 ms. Round 17 measured 150-217 ms.
- Expected: No visible hitch in the fight.
- Repro: critic/rounds/round-18/cap/perf18.mjs, cold profile, GPU mostly idle (21 % / 8 %).
- Evidence: critic/rounds/round-18/evidence/perf/*.json
- Confidence: medium
- Requirement: RUBRIC §2 (report spikes)
- Where (only if traced): fight playing, 20 s windows
- Smallest fix: Profile the spike frames (likely first-use shader compiles or texture uploads) and pre-warm them.
- Acceptance check: Maximum frame time under 50 ms in the same windows.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 44. [polish] PR-0258 (carried, re-confirmed): FFX victory spoils ignore the sourced x2-on-overkill drop quantity

- Category: prep
- Game: ffx
- Chapter and state: seymour-anima-macalania
- Observed: OVERKILL x1 with 'ITEMS Ability Sphere ×3, Blk Magic Sphere'.
- Expected: The sourced overkill quantity (4), per round 17.
- Repro: seymour-anima-macalania-win, seed 1, 1600x900, real keys.
- Evidence: critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json (resultsText)
- Confidence: high
- Requirement: AGENTS.md rule 6; RUBRIC §6 prep
- Where (only if traced): results after an OVERKILL win
- Smallest fix: Apply the sourced overkill drop multiplier in the results spoils.
- Acceptance check: The same run shows the sourced overkill quantity.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried (data unchanged).
- STALLED (open at the same severity in rounds 18 and 18b)

### 45. [polish] PR-0254 (carried, STALLED): Chapter VII Talk is still silent

- Category: narrative
- Game: FFX
- Chapter and state: VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- Observed: The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- Expected: A Tidus line and Seymour's reply within 3 s of each Talk.
- Repro: Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- Confidence: high
- Requirement: narrative: banter and reachable character voice
- Smallest fix: Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- Acceptance check: The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 46. [polish] PR-0255 (carried): Tromell's five aftermath lines in Chapter VII still have no speaker

- Category: narrative
- Game: FFX
- Chapter and state: VII aftermath (CONFIRM scene)
- Observed: 'Step away from Lord Seymour, Lady Summoner.' and four more lines have speaker '' (dbox 376877-377023 ms).
- Expected: The speaker 'Tromell' with a name plate.
- Repro: Ch VII win, CONFIRM on results.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt
- Confidence: high
- Requirement: narrative: character voice
- Smallest fix: Add a 'tromell' speaker with a name plate and no portrait (like 'brother'), and move the lines to it.
- Acceptance check: The dboxTimeline shows speaker 'Tromell' on the five lines.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 47. [polish] PR-0272 (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- Category: narrative
- Game: FFX
- Chapter and state: XVII sin-fins-core, seam 1 -> 2
- Observed: The line 'The Fahrenheit's cannon tears the fin away.' plays (567826 ms), then the seam shows an empty sky (46 ms), Sin fading in (410 ms) and 'Right Fin' at 1496 ms. There is no hit and no fin separation (2000x1012).
- Expected: A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- Repro: Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- Evidence: critic/rounds/round-18/feel-narr/sin-fins-core-win__seq-seam-2.jpg; dbox-all.txt
- Confidence: high
- Requirement: narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- Smallest fix: Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- Acceptance check: A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 48. [polish] PR-0256 (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- Category: feel
- Game: FFX-2
- Chapter and state: XVI aftermath, whistles 1 to 4
- Observed: The lines are unchanged ('A small gold light answers.' ... 'It runs ahead, over a bridge of light.'). The harness hold-skipped them 50 ms apart, so no plate frames exist for this build. Carried on the unchanged script and scene.
- Expected: A visible light, nearer on each whistle.
- Repro: Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt (ffx2-ixion-djose-win)
- Confidence: medium
- Requirement: feel/narrative: shown, not told
- Smallest fix: A small gold mote fx step per whistle.
- Acceptance check: A timed capture after each whistle shows the light, nearer each time.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 49. [polish] PR-0279 (carried, a question for Bailey): Sin's difficulty is still undecided (D-282); nothing in the engine changed, so the r17 figures stand

- Category: encounter
- Game: FFX
- Chapter and state: XVII, XVIII
- Observed: Unchanged data and AI. Real keys lost 2/2 in each chapter this round.
- Expected: Bailey's call on D-282
- Repro: r17 sin benches (reused, see reused)
- Evidence: D:/Final Fantasy/critic/rounds/round-17/combat/sin-bench-out.txt
- Confidence: high
- Requirement: encounter: correct difficulty
- Smallest fix: Ask Bailey
- Acceptance check: A decision is recorded in decisions.json
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 50. [polish] PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows (208 real-key turns this round, the same as round 17)

- Category: encounter
- Game: FFX
- Chapter and state: III
- Observed: braskas-final-aeon-win: 208 turns, 24.3 min; the replay matches all 1,292 events
- Expected: The release note figure matches the measured length
- Repro: runs-summary.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-replay.json
- Confidence: high
- Requirement: encounter pacing
- Smallest fix: Correct the note or ask Bailey
- Acceptance check: The note matches the bench
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 51. [polish] PR-0280 (carried): the v3 card's Chapter XII rate is unchanged (bench identical); the live v4 card covers it

- Category: encounter
- Game: FFX
- Chapter and state: XII
- Observed: ffx-three-line-r18.json XII rows are identical to round 17
- Expected: n/a
- Repro: Run ffx-bench.test.ts
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- Confidence: high
- Requirement: advice usefulness
- Smallest fix: none needed now
- Acceptance check: n/a
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 52. [polish] PR-0220 (carried, downgraded major -> polish): an emulated pad-only run now unlocks audio on the first pad A (title, chapter-select, boss-seymour), but headless Chromium already had user activation, so a real Chrome with a real controller is not proven

- Category: audio
- Game: both
- Chapter and state: all
- Observed: Gap pass pad-only-seymour-flux-1600x900: standard-mapping virtual pad, no keyboard/pointer/touch events; after the first pad A ready:true, playing:'title'; board 'chapter-select'; first battle menu 'boss-seymour'. navigator.userActivation was already active in headless Chromium, so the run cannot tell a pad gesture from none.
- Expected: The first gamepad button unlocks the AudioContext, and the title or chapter-select music starts.
- Repro: From a fresh profile, press only gamepad buttons from the title into a battle, then read __pyrefly audio debug: ready and playing.
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pad-only-seymour-flux-1600x900/run.json"]
- Confidence: low (unknown)
- Requirement: RUBRIC s2 platform goals (gamepad); CHK-023
- Smallest fix: Add one emulated-gamepad Playwright run that asserts audio ready and a playing cue.
- Acceptance check: A real controller on real Chrome (or a headed browser with userActivation provably false before the pad press) reaches the title cue on the first pad button.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 53. [polish] PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- Category: audio
- Game: both
- Chapter and state: I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- Observed: themes-audit fails scene-gagazet, scene-dreams-end and scene-farplane, the same as round 17. Note: scene-farplane measures E minor against the map's E major.
- Expected: Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Smallest fix: Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- Acceptance check: themes-audit reports 0 departures for these cues.
- Tags: introducedByCandidate false, regressionVsLive false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 54. [polish] PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- Category: audio
- Game: ffx
- Chapter and state: VII
- Observed: FAIL scene-macalania-temple: the cue is not in the bible's cue map.
- Expected: Every shipped cue has a row in the bible's cue map.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Smallest fix: Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- Acceptance check: themes-audit shows ok for scene-macalania-temple.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 55. [polish] PR-0278 (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- Category: audio
- Game: both
- Chapter and state: docs
- Observed: Line 656 is '| ## Owed cues for chapters not yet listed'. Rows XVII and XVIII sit at lines 667 and 668, after a stray separator at line 666, outside the table. themes-audit still reads 18 of 18.
- Expected: One contiguous table of rows I to XVIII.
- Repro: Open D:/pyrefly-rel26c/docs/audio/THEMES.md at lines 638 to 668.
- Evidence: docs/audio/THEMES.md:656,666-668
- Confidence: high
- Requirement: docs hygiene
- Smallest fix: Move the XVII and XVIII rows up under XVI, and put a blank line before the '## Owed cues' heading.
- Acceptance check: The rendered markdown shows one table of 18 rows, and themes-audit still passes.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 56. [polish] PR-0298 (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- Category: audio
- Game: both
- Chapter and state: all
- Observed: The music is 78.2 MB and the total 80.93 MB (qa). The AUDIO_BUDGET_BYTES constant went from 60 to 85 MB, and the D-292 note in manifest-io.mjs documents the gap. Each chapter's music download roughly doubled; for example III requests 12.7 MB of music, up from 6.5. Any effect on slow-link loading is the delivery category's call (PR-0240) and is not scored here. NOW.md already lists 'music 78 MB ok?' as open for Bailey.
- Expected: D-292 as worded: the music grows from about 39 MB to about 73 MB.
- Repro: node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- Confidence: high
- Requirement: RUBRIC s7 (a pick approves what Bailey named)
- Smallest fix: Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- Acceptance check: decisions.json records Bailey's answer on the 78 MB size.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 57. [polish] PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- Category: visual
- Game: FFX only
- Chapter and state: XVIII Sin: the Face
- Observed: When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- Expected: No HUD panel over a face, including during camera moves (CHK-008).
- Repro: Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- Evidence: critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- Confidence: medium (observed; no live action-frame evidence to compare)
- Requirement: CHK-008
- Where (only if traced): Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- Smallest fix: Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- Acceptance check: XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 58. [polish] PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- Category: visual
- Game: FFX only
- Chapter and state: VII Seymour and Anima
- Observed: The card spans Guardian B from shoulders to knees; only his head shows above it.
- Expected: The Sensor card placed clear of the fiends' projected quads.
- Repro: Seed 1, Ch VII, 1600x900. Target by real keys, then cancel.
- Evidence: critic/rounds/round-17/evidence/seymour-anima-macalania-win/16b-after-cancel.png; 16-target-single.png
- Confidence: high
- Requirement: CHK-008
- Where (only if traced): Sensor card placement (not traced)
- Smallest fix: Use the line-card free-slot picker for the Sensor card, or dismiss it on cancel.
- Acceptance check: Ch VII 16b-after-cancel at 1600x900 and 2000x1012: no enemy torso under the card.
- Tags: introducedByCandidate false, regressionVsLive false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 59. [polish] PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- Category: interface
- Game: FFX
- Chapter and state: Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- Observed: 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- Expected: The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- Repro: node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- Confidence: high
- Requirement: PR-0246 acceptance; CHK-009
- Smallest fix: Wrap the label to two lines, or drop the verb when the name is long.
- Acceptance check: The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- Tags: introducedByCandidate false, regressionVsLive false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 60. [polish] PR-0252 (carried): the first-turn coach card overlaps the selected command row

- Category: interface
- Game: FFX
- Chapter and state: X Seymour Natus at 2000x1012 (2560x1080 not captured)
- Observed: Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- Expected: Coach clear of the command stack.
- Repro: Fresh profile, 2000x1012, Ch X first menu.
- Evidence: critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Add the command stack to coachActorAvoid's rects at wide sizes.
- Acceptance check: 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 61. [polish] PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- Category: interface
- Game: FFX-2
- Chapter and state: IV Bahamut
- Observed: The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- Expected: Header visible, or scrolling inside the rows only.
- Repro: Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- Evidence: critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- Confidence: high
- Requirement: CHK-009
- Smallest fix: Make the header sticky, or scroll the rows container only.
- Acceptance check: Header box fully inside the list viewport after wheel up and down.
- Tags: introducedByCandidate true, regressionVsLive false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 62. [polish] PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- Category: interface
- Game: FFX
- Chapter and state: I Seymour Flux
- Observed: The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- Expected: The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- Repro: Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- Evidence: critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- Confidence: low
- Requirement: CHK-005 (says in plain words what to spend the turn on)
- Smallest fix: Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- Acceptance check: On the same board the card names the raise, then the cure, in that order.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 63. [polish] PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- Category: interface
- Game: FFX-2 (the rail is shared)
- Chapter and state: XI Fallen Aeons, Rikku's Mega-Potion charging
- Observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- Expected: The two panels do not contradict each other about the same turn.
- Repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- Evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- Confidence: high
- Requirement: Interface: useful advice
- Smallest fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- Acceptance check: In the same case, the rail and the card agree or the rail defers.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 64. [polish] PR-0273 (new; gap pass): Ch XVII link 3 (on Sin's back) still lists disabled PULL BACK and CLOSE IN rows at the top of the command menu

- Category: combat
- Game: FFX
- Chapter and state: Ch XVII sin-fins-core, link 3 (Sinspawn Genais + Sin's Core), every party menu
- Observed: In link 3 the menu reads PULL BACK / CLOSE IN / ATTACK / SPECIAL / WHITE MAGIC / ITEMS, and the engine marks both orders disabled. The stage also still shows the Fahrenheit deck.
- Expected: research/ffx-sin.md §1 table, link 3: 'on Sin's back (the party jumps from the ship) ... no Trigger Command'. No order rows in link 3.
- Repro: Real-key win seed 1 (gaproute.mjs sin-fins-core, POLICY=xvii): the first link-3 menu.
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/sin-fins-core-win-r17gap-s1/seq-seam-3/f20.jpg; D:/Final Fantasy/critic/rounds/round-17/combat/gaplink3-out.json
- Confidence: high
- Requirement: research/ffx-sin.md §1 (link 3 has no Trigger Command); CHK-004
- Where (only if traced): engine emits disabled 'pull-back'/'close-in' triggers in link 3 (in-process probe combat/gaplink3-out.json); AirshipOrders folds orders only when airship.range is set (src/ui/ffx/AirshipOrders.ts:137); file of the trigger source not traced
- Smallest fix: Drop the airship trigger commands from link 3's formation or triggers, or hide disabled trigger rows when no range state exists.
- Acceptance check: The first link-3 menu lists no PULL BACK or CLOSE IN row, and in-process the link-3 decision carries no trigger commands.
- Tags: introducedByCandidate false, regressionVsLive false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 65. [polish] FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- Category: interface
- Game: FFX
- Chapter and state: II and XIV Grand Summon picker, 390x844
- Observed: Recorded by the focused review of this same build and still open.
- Expected: Legible and not clipped.
- Repro: See critic/reviews/6ea8528f-focused.md.
- Evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
- Confidence: high
- Requirement: CHK-003
- Smallest fix: As proposed in the focused report.
- Acceptance check: As proposed in the focused report.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 66. [polish] PR-0223 (carried): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- Category: delivery
- Game: FF7 (hidden experiment)
- Chapter and state: FF7 Guard Scorpion
- Observed: Not captured in round 17. No FF7 file changed in this candidate.
- Expected: 0 requests >= 400 on the FF7 pause.
- Repro: FF7 door, then battle, then Esc; record the network log.
- Evidence: absent; builder claim only (docs/handoff/r29-load.md)
- Confidence: low
- Requirement: CHK-017 / CHK-018
- Where (only if traced): pause in the FF7 fight
- Smallest fix: None until observed.
- Acceptance check: FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 67. [polish] PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- Category: visual
- Game: FFX
- Chapter and state: VII, battle, Anima's arrival at 390x844 touch
- Observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- Expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- Repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- Confidence: high
- Requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- Smallest fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- Acceptance check: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 68. [polish] PR-0261 (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- Category: harness
- Game: both (tooling)
- Chapter and state: all phone routes
- Observed: The run.json files of ffx2-den-of-woe-win and -stall-{cand,fxoff,pacecurrent,confirmer} say outcome 'victory', although the chain never finished; runs-summary.json repeats it; only index.json's note says soft-lock. Round 17's reticle-interception-as-timeout part is unchanged.
- Expected: contexts.touch.blocked names the element that intercepts the tap.
- Repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- Confidence: high
- Requirement: CHK-016 evidence integrity
- Smallest fix: Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- Acceptance check: A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: New instance (merged with the delivery auditor's note): route-fight.mjs:265 read battleLog() holding link 2's per-link victory, so two XV defeats were first logged as "victory"; repeated attempts also overwrite frames (20-link-2.png, 24-seam-2-first-menu.png). The gap pass caught it from the results text ("Defeat"). No verdict here rests on the mislabelled lines.
- STALLED (open at the same severity in rounds 18 and 18b)

### 69. [suggestion] PR-0306 (new, a question for Bailey; R18b-CE-01): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 7 real-key attempts this round (seeds 1, 1001, 2, 1002, 2002 and the gap pass's 1 / 1001; one Active-mode loss besides)

- Category: encounter
- Game: FFX-2 only
- Chapter and state: XV ffx2-den-of-woe, links 2 (Gippal) and 3 (Nooj)
- Observed: The capture owner lost 5 of 5 (closest: Nooj at 4,538 / 23,800). The gap pass lost seed 1 and won seed 1001 (32 turns, 324 s) on the same advisor route, and lost one attempt at X-2 BATTLE ACTIVE. Engine bench on the identical engine (round 18, sourced intended line, seeds 1-200): 44/200 at Wait with instant decisions, 3/200 at Active with 2.5 s decisions. The advisor plays legally and sensibly (Remedy for Stop and Curse, Megalixir under Lightfall, Darkness on the shades).
- Expected: Bailey decides whether the Den's difficulty is right. The bosses' numbers are sourced; the party level at the Den is an unsourced estimate (research/ffx2-gippal-den-of-woe.md section 5, G-12).
- Repro: Production candidate f302f163, fresh profile, setSeed before the first key, real keys following the advisor every turn (critic/rounds/round-18b/cap route18d.mjs). Bench: critic/rounds/round-18/combat/den-stop-frequency.test.ts.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win-s2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/ffx2-den-of-woe-win-gap2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/xv-active-1600x900-s1/run.json; D:/Final Fantasy/critic/rounds/round-18/combat/den-stop-frequency.json
- Confidence: high for the observed rates; no source says what the rate should be
- Requirement: RUBRIC section 6 encounter (fair wins and losses); AGENTS.md hard rule 6 (never invent data)
- Smallest fix: No code change from the critic. Put the XV figures to Bailey alongside PR-0279 (Sin) and PR-0227 (XIII); if a change is wanted, measure party-side options only (the level estimate or the prep kit) before building any.
- Acceptance check: Bailey's decision recorded in docs/target/decisions.json; if a party-side option is chosen, re-run the bench and three real-key XV attempts and report win rates against the chosen band.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 70. [suggestion] PR-0299 (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- Category: audio
- Game: both
- Chapter and state: all
- Observed: src/app/saveSfxBalance.ts moves any 0.35 stored without the marker. The rule works exactly as stated (28 of 28 cases pass), but D-293 marks the existing-save half as inferred, and NOW.md lists it as open for Bailey. A pre-release player who picked 0.35 by hand cannot be told apart from an untouched one.
- Expected: RUBRIC s7: an inferred item is asked before it is built.
- Repro: Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- Confidence: high
- Requirement: RUBRIC s7 inferred items; D-293
- Smallest fix: Ask Bailey whether this is acceptable. No code change unless he says no.
- Acceptance check: D-293's inferred note moves to named, or is reversed by Bailey.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 71. [suggestion] R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- Category: target-registry
- Game: both
- Chapter and state: docs/target/targets.json group picks-0929
- Observed: All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- Expected: Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- Repro: Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- Evidence: D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- Confidence: high
- Requirement: RUBRIC §7 (delivery field, required targets)
- Smallest fix: Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- Acceptance check: node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 72. [suggestion] PR-0217 (carried): Zombie is kept across a KO (unsourced); the advisor top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- Category: combat
- Game: FFX
- Chapter and state: I, II
- Observed: The three-line bench is identical to round 17, zombieReviveTopRows included
- Expected: A sourced rule, or the rule labelled as an assumption
- Repro: ffx-bench.test.ts
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- Confidence: medium
- Requirement: AGENTS.md rule 6
- Smallest fix: Source the rule or label it
- Acceptance check: A written source
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 73. [suggestion] PR-0227 (carried, information): Chapter XIII is rarely won at human pace. Seed 1 lost on 1 and 1001 (and on ?pace=current); the seed-2 route won on 1002

- Category: encounter
- Game: FFX-2
- Chapter and state: XIII Trema
- Observed: ffx2-trema-win: defeat@1, defeat@1001. ffx2-trema-win-s2: defeat@2, victory@1002 (333 turns). ffx2-trema-win-pacecurrent: defeat@1.
- Expected: Information for Bailey
- Repro: runs-summary.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json
- Confidence: medium (Active ATB is wall-clock sensitive)
- Requirement: encounter: fair difficulty
- Smallest fix: none (a question)
- Acceptance check: n/a
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- STALLED (open at the same severity in rounds 18 and 18b)

### 74. [suggestion] PR-0262 (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four

- Category: narrative
- Game: FFX
- Chapter and state: results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
- Observed: src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
- Expected: No two chapters share a first-choice quip, and at most two use 'That's it?'.
- Repro: Win I, II and VIII and read the results quip.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/seymour-flux-win/run.json
- Confidence: high
- Requirement: narrative: character voice, no repetition across chapters
- Smallest fix: Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
- Acceptance check: First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.
- Tags: introducedByCandidate "unknown", regressionVsLive "unknown"
- Note: Seen again on f302f163: Ch I victory results read "...Okay. Next one." (seymour-flux-win/run.json resultsText).
- STALLED (open at the same severity in rounds 18 and 18b)

## What stands between this build and acceptance

- Audio has no number until Bailey gives an ear verdict on the shipped mix (CHK-B1, PR-0148).
- Six categories are under the 9.0 floor: encounter 8.8, feel 8.3, narrative 8.9, interface 8.0, onboarding 8.4, delivery 8.7.
- 13 majors are open (PR-0264, PR-0148, PR-0099, PR-0265, PR-0283, PR-0269, PR-0267, PR-0244, PR-0268, PR-0266, PR-0270, PR-0284, PR-0222); acceptance needs none.
- Mandatory checks failing: CHK-002, CHK-003, CHK-006, CHK-008, CHK-009, CHK-015, CHK-020; CHK-B1 UNVERIFIED.
- Targets: 15 unverified and 6 waiting on Bailey.
- 11 human judgments are not recorded.
- The exact artifact has to be verified live, and a milestone review is the only one that can accept.

## Human judgments owed

- Audio: Bailey's numeric listening score for the shipped mix at V0 (CHK-B1, PR-0148) (Latest owner-side verdicts: 'still sounds like snes music' (09-27), 'tinny and hollow ... close to good' (09-28), the friends' 'music bad' (09-29), concurred.): not recorded
- Audio: are attack and miss SFX audible at the new default (SFX b, D-293; PR-0263) (Measured only: a hit's true peak is ~1.5 dB under the music's.): not recorded
- Audio: 78.2 MB of music instead of the recommended ~73 MB (PR-0298): not recorded
- Save: moving a deliberate pre-release 0.35 SFX level to 0.70 (PR-0299, D-293 inferred half): not recorded
- Feel: steady pacing and the calm camera as defaults, and the +2.7 s they add to a hold-skip (CHK-B2, PR-0061): not recorded
- Visual: eye candy D in the running game against the D stills Bailey picked: not recorded
- Onboarding: first-run step 1 wording when another chapter is selected (PR-0289): not recorded
- Narrative: Bailey's story read of the Sin chapters and the Ch VII aftermath (CHK-B3): not recorded
- Encounter: Sin difficulty (D-282, PR-0279) and the Chapter III gauntlet length (PR-0257): not recorded
- Feel: the FFX-2 chain seam opening now runs 2.9-3.1 s against 0.6-0.75 s on live (PR-0301): intended, or to be shortened?: not recorded
- Encounter: Chapter XV difficulty at human pace (1 win in 7 real-key attempts on the advisor route; PR-0306) beside Sin (PR-0279) and XIII (PR-0227): not recorded

## Next review

If deployed: the live review of f302f163 (CHK-017 against artifactHash ff26ce51..., live real-input smoke on one chapter per game and one FFX-2 chain seam). This deep report covers the save-data class and the r33-fix before the deploy; whether it also settles the deep obligation carried from 1a6fd3cc is decided by critic-clear, not here. The next batch should start with method checks for the STALLED items (PR-0264, PR-0265, PR-0283, PR-0148, PR-0099 and the rest of "stalled"), and with PR-0300 / PR-0301 traced against live 32 before any fix. Carry requiredNotTested.

## Server hygiene and elapsed time

The chief started no server and opened no browser; Get-NetTCPConnection showed no listener on ports 5400-5990 at the start of the chief's work (re-checked before writing the prose). The capture owner stopped vite preview 5840 (PID 56644) and the release-32 save server 5841 (PID 64272) by PID and saw 0 listeners on 5840-5849; the confirmer stopped its preview on 5840 (PID 64372) by PID and confirmed the port closed.

Wall clock from the capture owner's start (about 18:02 EDT) to this report (about 23:30 EDT): capture about 130 min, six auditors 20-48 min in parallel, gap pass about 115 min, confirmer about 30 min, chief about 40 min. Repeated work avoided: round 18's engine benches, flows for 13 chapters, art judgment and save matrix were carried with dependency arguments; only the r33-fix area, the FFX-2 seams and one chapter per game were replayed.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- A presenter stall watchdog: when playback has not advanced for 45 s while the engine is undecided and no menu is awaited, log a console error (logging only at first). Benefit: a PR-0281-class lock becomes visible instead of a frozen frame. Cost: small, presenter-side. Fit: neutral to both games. Risk: masking a real bug if it ever releases silently. Nothing is built without Bailey's yes.
- A standing headless regression lane that crosses every FFX-2 chain seam and phase moment with each carried status (Stop, Sleep, Curse, KO) through the real presenter and records moment length and plate coverage (it would have caught PR-0300 and PR-0301 as well as PR-0281). Cost: test time only. The r33-fix added a unit test for the tween clock, not this lane. Nothing is built without Bailey's yes.
- One short help line under each of the three eye-candy OPTIONS rows (carried from round 18; the approved A2 frame has none, so it is a question for Bailey).

## critic-clear output (verbatim)

```text
critic:clear no pending marker for build f302f163: kept as candidate evidence
```
