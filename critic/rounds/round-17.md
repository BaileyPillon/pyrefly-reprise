# Critic round 17: deep review of the release 32 candidate (1a6fd3cc)

```text
Build / artifact / target version: main 1a6fd3cc (1a6fd3cc883a), bundle index-ChAAAZ-I.js, artifactHash 2011851984efc73c88b12be5f0b6b5f07abe1bf4c2bd3659f7f2f69cb025e591 (dist-gate, 1005 files), targets.json sha256 3ceb8b55...9512
Review: deep (save-data class: settings.textSize in src/app/SaveData.ts, deep before deploy)
Deployment: NOT APPLICABLE (candidate not deployed; live verification owed after the deploy)
Changed area: FAIL (the save change passes; TEXT SIZE collides at 115/130 % on the FFX desktop HUD and does nothing for FFX-2; the Zombie warning is 11 px at 1600x900)
Ship: SHIP. No critical defect, no regression against live 52a431d0; all 18 chapters won by real keys; saves from live 31a and releases 20-29 load intact. Discloses 14 majors: PR-0148, PR-0263, PR-0264, PR-0265, PR-0266, PR-0267, PR-0268, PR-0244, PR-0269, PR-0270, PR-0240, PR-0099, PR-0220, PR-0222
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED: no numeric owner listening score); categories combat 9.2, encounter 8.8, visual 8.9, feel 8.3, narrative 8.9, audio UNVERIFIED, interface 8.2, onboarding 8.2, prep 8.9, delivery 8.7
Targets: required 81 / matched 61 / failing 0 / unverified 20 / waiting on decision 5
Top issues: PR-0148 music has no owner score; PR-0263 hits under the music; PR-0264 Zombie warning 11 px; PR-0265 pause RESUME dead to tap/click; PR-0266 TEXT SIZE 130 % collisions; PR-0267 failed Bushido out-damages success; PR-0268 adopted Sin checkpoint shipped off (details below)
Coverage: tested = save matrix, 18/18 real-key wins, losses + RETRY, engine replay, friends' fixes, motion options, legibility sweeps, audio tech/routing, load; reused = FFX-2 combat bench, PR-0226 pause hand-back (dependency arguments below); not tested = Sphere Grid by real input, gamepad, Firefox/WebKit, real phone, save reset flow, FF7, 2560x1440 art frames, 1280x720
Next required review and why: LIVE review after the deploy (CHK-017 exact artifact + save/reload smoke); the next batch (D-293 SFX default touches stored settings) is save-data class again, so deep before its deploy
Elapsed review time / repeated work avoided: about 300 min wall clock; the gap pass chased only the owed items (XV/XVII/XVIII wins, Ch VII timing, motion, latency, sweeps); no chapter the capture owner had won was replayed
```

## Score (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, narrative, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category prep is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-013 is UNVERIFIED
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-017 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 14 critical or major issue(s) remain open
  - 20 required target(s) unverified
  - 5 required target(s) waiting
  - only 61 of 81 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped R1 mix (CHK-B1, PR-0148)
  - human judgment not recorded: Audio: attack and miss SFX level at the default mix (PR-0263, D-293)
  - human judgment not recorded: Feel: Bailey's play of this build, pacing and camera (CHK-B2)
  - human judgment not recorded: Narrative: Bailey's story read of the Sin chapters and the Ch VII aftermath (CHK-B3)
  - human judgment not recorded: Encounter: Sin difficulty, D-282 (PR-0279)
  - human judgment not recorded: Onboarding: D-220 Q4, TEXT SIZE for FFX-2 and the pause (PR-0270)
  - human judgment not recorded: Onboarding: D-220 Q7 / A3, key remapping and flash reduction (PR-0032)
  - human judgment not recorded: Interface: status display decision (research/status-display.md; the Zombie pip is colour-only)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## critic-clear (verbatim)

```text
critic:clear no pending marker for build 1a6fd3cc: kept as candidate evidence
```

The score is provisional: audio has no verified number, so no total is claimed. The code, not the chief, decides the total and acceptance.

## Verdicts

- **deployment**: NOT APPLICABLE. The candidate is not deployed; live verification (CHK-017 verify-live against critic/artifacts/1a6fd3cc.json) is owed after the deploy.
- **changedArea**: FAIL. FAIL: the save-data change itself passes (13-case matrix, no loss, textSize migration exact), and the friends' fixes work, but the new TEXT SIZE setting collides at 115/130 % on the FFX desktop HUD (PR-0266), does nothing for FFX-2 (PR-0270), and the new Zombie warning is below the legibility floor at 1600x900 (PR-0264); CHK-003, CHK-008, CHK-009, CHK-015 and CHK-020 fail.
- **milestone**: not assessed. not assessed (deep review); audio is UNVERIFIED, 7 categories are under 9.0, 14 majors are open and 20 required tiles are unverified.
- **ship**: SHIP. SHIP: no critical defect, no regression against live 52a431d0; every major is either inside a brand-new feature or pre-existing on live, and is disclosed.

**Why SHIP**

- No critical defect: every one of the 18 chapters was won by real keys on the candidate and reached results, aftermath, board and reload; losses reach RETRY; 0 console errors and 0 failed media requests in 27+ runs.
- The save-data change is safe: saves written by live release 31a and by releases 20, 25, 28 and 29 load with every setting, clear, pick and option kept, textSize migrates to 1, garbage is coerced, and truncated storage boots clean; nothing can lose progress.
- No regression against live: the pause RESUME tap defect (PR-0265) and every other pre-existing major reproduce on live 31a or predate it; the XVIII and XV losses were input-timing variance and both chapters were then won by real keys on the candidate.
- The new majors PR-0264, PR-0266 and PR-0270 are inside brand-new features that do not exist on live (the Zombie plate warning, where live shows no warning at all, and TEXT SIZE, which defaults to the unchanged 100 %); they do not hold the build and are disclosed.
- The candidate is better than live: it answers the friends' playtest (Zombie warning, list scrolling, six Sphere Grid bugs, miss sound, coach close, phone TAP wording) and adds TEXT SIZE, REDUCE MOTION and LOW EFFECTS, which work on FFX by keys and taps.

**Majors this release must disclose**

- PR-0148 (major): PR-0148 (carried, owner-reported, STALLED): no numeric owner verdict on the shipped mix, and the latest owner-side verdicts are negative
- PR-0263 (major): PR-0263 (new; R17-AUD-01; owner-concurred friend report): attack and miss sound effects sit well under the battle music at the default mix
- PR-0264 (major, new feature): PR-0264 (new; gap pass = R17-IF-02): the new Zombie heal warning on the FFX target plate is 11 px dim grey caps at 1600x900, and one click commits the heal
- PR-0265 (major): PR-0265 (new; gap pass): the pause screen's ESC RESUME button does nothing when tapped or clicked (both games)
- PR-0266 (major, new feature): PR-0266 (new; capture owner = R17-VIS-01 = R17-ON-02): at TEXT SIZE 115 and 130 % the FFX desktop command list is not re-capped on the open turn, the help slab hides TALK, the grown stack hides the acting character, and the PAUSE / N / G key chips collide
- PR-0267 (major): PR-0267 (new; R17-CE-01): a failed Bushido keeps its time remaining and earns the timing bonus, so a wrong first press out-damages a correct, fast sequence
- PR-0268 (major): PR-0268 (new; R17-PREP-01 = R17-CE-02): Bailey adopted the Sin link-3 retry checkpoint (D-284), but the candidate ships SIN_LINK3_CHECKPOINT = false, so a link-3 loss in Chapter XVII restarts from the Left Fin
- PR-0244 (major): PR-0244 (carried): the Ch VII aftermath narrates the kneel and the fall over a standing Seymour, with 1.7 s of plate and no words before results
- PR-0269 (major): PR-0269 (new): following the advisor card every turn loses the Sin races: XVIII 5 of 5 on the candidate (3 seeds), XVII 2 of 2 on the Right Fin, while a sensible real-key line wins both
- PR-0270 (major, new feature): PR-0270 (new; capture owner = R17-ON-01; disclosed by the builder): TEXT SIZE grows neither the FFX-2 battle HUD nor the pause in either game (TEXT_SIZE_WIDE_SCOPE = false, awaiting D-220 Q4)
- PR-0240 (major): PR-0240 (carried, unchanged): on a cold 10 Mbit/s link the first battle waits about 19 s behind the loading card
- PR-0099 (major): PR-0099 (carried, STALLED): 11 of 18 listed chapters still play at least one borrowed stand-in cue
- PR-0220 (major): PR-0220 (carried, fix built, not proven at runtime): a pad-only player may still hear nothing until they touch a key, the mouse or the screen
- PR-0222 (major): PR-0222 (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

## Categories

| Category | Weight | Score | Auditor | Status |
|---|---:|---:|---:|---|
| combat | 20 | 9.2 | 9.2 | scored |
| encounter | 10 | 8.8 | 8.8 | scored |
| visual | 15 | 8.9 | 8.9 | scored |
| feel | 10 | 8.3 | 8.2 | scored |
| narrative | 10 | 8.9 | 8.8 | scored |
| audio | 10 | UNVERIFIED | - | UNVERIFIED |
| interface | 10 | 8.2 | 8.4 | scored |
| onboarding | 5 | 8.2 | 8.1 | scored |
| prep | 5 | 8.9 | 8.9 | scored |
| delivery | 5 | 8.7 | 8.6 | scored |

### combat: 9.2

[combat-encounter auditor, round 17 deep, PRODUCTION CANDIDATE main 1a6fd3cc in D:/pyrefly-rel28. No browser opened, no server started; the only processes I started were vitest runs, and the last one (the builder's Sin chain bench, PID tree 20516) was stopped by its PID once its main tables were written, with 0 of my node processes left. Scratch: D:/Final Fantasy/critic/rounds/round-17/combat/.]

WHAT CHANGED IN COMBAT. git diff 52a431d0..1a6fd3cc for src/battle is one line: ICON_PRIORITY is now exported from turnQueue.ts, with the order unchanged. src/data and src/engine/tactics have no diff. Since round 16 (49005f73), release 30 added the Sin engine (ai/sin-*.ts, overdrive-sin*, engine-end.ts split), the Sin data, advisor v4 and PR-0245. src/battle/ffx2 and src/data/ffx2 have no diff since 49005f73, and common/types.ts changed additively (bossId, doc comments).

DATA AUDIT (sin-dump.txt). Every Sin value matches research/ffx-sin.md §2.1-§3.4, and each is a cited decompiled or verified cell. Checked: the Fins at 65,000 HP / DEF 100 / MDEF 50 / AGI 20, Armored, percentage- and Delay-immune, Threaten immune by S-6, Armor and Mental Break landable. Genais at 20,000 / DEF 80 / MAG 35 / AGI 25, weak to Fire, absorbs Water, Zombie 80, Silence 100, Reflect 255, Slow/Haste/Doom/Power/Magic Break landable. The Core at 36,000 / STR 1 / MDEF 100 / Reflect 255. Overdrive Sin at 140,000 / DEF 40 / MDEF 40 / AGI 30. Overkill thresholds 10k/10k/2k/3k/16k, AP 16,000/17,000 (S-4)/1,800/18,000/20,000, and gil, steals and drops as §2.4. Rows: Ram 28 strong-delay, Smack 34 long-range, Gravija percent-current 12, the whiff row with no damage, Negation's 24-status list both ways, Venom as magic-formula 32 physical with Poison 100, Thrashing 32 crit, Sigh Dark 3 turns, Waterga 42 counter, Cura 40 counter, the Core's F/B/T/W at 16 party-wide and reflectable, Gaze 20 at 30% x3 plus the aeon Gaze at 50, and Giga-Graviton percent-total 16 with KO 255. All are rank 3 with canMiss:false explicit (hard rule 5). The AI rules match §5, and every unsourced rule (S-1, S-8, S-12, S-13, S-25, S-27, S-28) is a named, labelled tunable. The engine tests (sin-fins-engine, sin-core-engine, sin-engine, sin-data, sin-carry) pin each rule and pass.

ZOMBIE (friends' fix). It is canon per research/ffx-combat-core.md l.1686-1687 ('Hi-Potion on a Zombie deals exactly 1,000 damage'). The runtime agrees: the capture owner's friends-zombie run shows Hi-Potion on the Zombie Kimahri as damage 1000, 1563 -> 563. Zombie is FFX-only, sourced: FFX-2's 25 negative statuses have none (ffx2-combat-core.md §489ff).

SPHERE GRID STAT MATH. It follows §10.1: other stats cap at 255, and 1 S.Lv buys four travelled nodes. HP and MP nodes raise the base pool (sphere-grid-fb0929.test.ts passes).

TESTS. The full suite on the candidate is 674 files passed and 5 skipped, 10,260 tests passed, exit 0 (full-suite.txt). That includes the FFX engine golden, ffx2-atb-golden, ffx-ctb, ffx-statuses, ffx-formulas, ffx2-chain, ffx2-atb-speed, ffx2-status-locks and every chapter test.

RUNTIME = ENGINE (CHK-023, ffx-replay.json). 19 real-key capture logs replay event for event through the pure engine at their recorded seeds: II, III (1,292 events), VII, VIII x2, IX, X, XII x4, XVII links 1 at seeds 1 and 1001, and XVIII x5. The XVIII run captured on LIVE 31a (a win) also replays 433/433 on the candidate engine, so candidate and live combat are identical. The XVIII win-on-live / loss-on-candidate difference at seed 1 is Overdrive minigame wall-clock timing, not a regression. All three logs are identical for 203 events, then Dragon Fang's timeRemainingMs (256.7 vs 335 vs 189.8 ms) changes the damage, and the candidate run died with Sin at 1,848 HP. Chapter I's log is truncated (660/661 prefix), and Isaaru's is last-link only, so replay does not apply there.

DEFECT FOUND (R17-CE-01, major, pre-existing). A failed Bushido keeps its time remaining and gets the §5.2 timing bonus. A wrong first press at 3.9 s left deals 3,617, against 3,192 for a fast correct sequence and 2,432 for the canon expired failure (bushido-fail-bonus.json). All three capture-owner Dragon Fangs were this failure path.

Carried: PR-0217 (Zombie kept across KO, unsourced). The three-line bench still counts 46-307 advisor top rows reviving KO'd Zombies in Chapters I and II; the counts are unchanged from round 16.

No canonical tactic is penalised.

*Score note:* 9.2: polished and faithful on everything changed, minus one newly found major formula defect on a player path. It is pre-existing and not a regression.

### encounter: 8.8

**Chief:** Kept at 8.8. The gap pass then won XVII (seed 1, 228 real commands) and XVIII (seed 7) by real keys on the sensible line, which confirms the benches (winnable, harsh); the Sin difficulty question stays with Bailey (PR-0279) and the adopted checkpoint is undelivered (PR-0268, scored under prep).

SEEDED THREE-LINE BENCH (ffx-three-line-r17.json; the round-16 harness with paths changed; v3 card, seeds 1-40 plus 40 large seeds). The intended and mash lines are identical to round 16 in all 9 unchanged FFX chapters, which is what an unchanged engine and data should give. The v3 card is identical except XII Omnis: 24/40 and 18/40, against 25/40 and 20/40 in round 16 (the PR-0245 revive-aim change, which is shared advisor code). The card players actually see in FFX is v3 with the v4 lift. Through the game's worker path at mini (v4/results/r17-mini-face-omnis.json, seeds 1-20), XII is v4 17/20 against v3 13/20, so the live card is better on XII, not worse.

NEW FFX CHAPTERS (listed in release 30, first deep audit here). I re-ran the builder's 200-seed benches on the candidate, and both reproduce the D-282 figures exactly (sin-bench-out.txt, sin-fins-core-bench-rows.txt).
- XVIII: the sensible line wins 62/200 (31%) with Giga-Graviton on turn 13 (D-280) and 7/200 on turn 12. The advisor card wins 44/200 and the naive line 0. v4 mini wins 5/20, the same as v3's 5/20. Auron's Dragon Fang is the only gauge that fills.
- XVII: the sensible chain wins 51/200 (25.5%). Per link, rested, it is 100/100/81%. Carried-state link 3 is where it dies: Core counter spells after Genais falls (Gestahl's single-source 100% counter, S-13-after) plus Negation (S-12, single-source wiki formula, labelled). With Negation off the chain is 44%. The advisor card chain is 6/200 (3%), dying mostly on link 2. The naive line is 0.
- The data and AI are faithful and labelled (see combat). The difficulty rests on the harshest reading of two single-source rules and on an estimated preset (S-29).
- The capture owner's advisor-following real-key runs lost XVII twice on the Right Fin (as the card chain predicts: 85/190 through link 2) and XVIII three times on the candidate. XVIII won once on live 31a, which replays exactly on the candidate engine.
- Bailey adopted the link-3 checkpoint (D-284: 'Sin link-3 checkpoint ON (SIN_LINK3_CHECKPOINT)', 'handled in the release 31 merge'), but the candidate still ships SIN_LINK3_CHECKPOINT = false (src/data/ffx/enemies/sin-genais-core.ts:199). A link-3 loss still restarts from the Left Fin (R17-CE-02).

FFX-2. The engine and data are unchanged since round 16. Den of Woe's shipped bench, run fresh (den-shipped-bench.txt), gives 48/200 first try at the live Wait default and 127/162 within 3/5, 18/200 on Active. The real-key capture lost Den of Woe at seeds 1 and 1001, where round 16 won at 1001. ATB outcomes depend on input wall-clock, the r16 and r17 logs diverge from event 0 on real-time status ticks, and the engine did not change, so this is variance and not a regression (confidence medium). Bahamut, Fallen Aeons, Ixion, Leblanc, Trema (seed 1002) and Vegnagun were won by real keys.

Carried: PR-0227 (XIII information), PR-0257 (III gauntlet length).

### visual: 8.9

**Chief:** Kept at 8.9. The gap pass sweeps at 1280x960, 2560x1080 and 3840x2160 show the pause painting full-bleed from the 2x tier with no layer scale; no 2560x1440 in-game frame of the new Sin art exists (CHK-013 stays UNVERIFIED), and 20 required tiles stay unverified.

[visual-targets auditor, deep round 17, PRODUCTION CANDIDATE main 1a6fd3cc (D:/pyrefly-rel28/dist-gate, bundle index-ChAAAZ-I.js, artifact 2011851984efc73c...; not deployed). Deployment verdict: NOT APPLICABLE.]

No browser opened and no server started, so there was nothing to stop and no port to close. I judged the capture owner's evidence only. It was captured with PYREFLY_BROWSER=gpu headless Chromium at 1600x900, 2000x1012 and 390x844. I left out the 6 frames marked verified=false (30-post-scene frames that landed on results).

Work done:
- 85 target-vs-build composites: critic/rounds/round-17/targets/*.jpg, with pairs.mjs and grids g00-g21.
- 14 contact sheets and zooms: critic/rounds/round-17/visual/st-*.jpg.

PROTECTION:
- Approved art: 290/290 byte-identical in a manifest I built from dist-gate (1005 files, problems [], decodeChecked true).
- Judge-locked art: 48/48 byte-identical.
- verify-approved (ROOT=D:/pyrefly-rel28): 338 ok, 0 mismatched, 0 missing.

FOR:
(1) PR-0228 is resolved. Rikku's Songstress renders painted in Ch XIII (ffx2-trema-win/23-midfight.png). In round 16 the same frame showed a grey mannequin.
(2) PR-0243 is resolved. The Ch VII battle-start card headlines Seymour, with his painting (seymour-anima-macalania-win/seq-transition-into-battle/f00.jpg).
(3) The new Sin chapters XVII and XVIII render their picked art at gameplay scale and stand on their listed frames:
- the Fins and the body at FAR, with Left Fin and Right Fin each painted and not mirrored;
- head C, the Bevelle dusk backdrop, the clock ring;
- the cards, the prep plate and the pause close-ups.
Live 31a and the candidate are identical at rest at 1600 (sin-face-win-live31a vs sin-face-win 23-midfight).
(4) Shiva is now evidenced in Ch XI with the house violet grade.
(5) Every speaker portrait on screen is painted. Every backdrop is painted (Ch X's black is scripted).
(6) The pause close-ups paint on desktop and phone.
(7) Facing, ground contact and scale hold in all 18 chapters' mid-fight frames.
(8) Targeting s1 (FFX Ch I and FFX-2 Ch IV), s2 (Ch III, Ch VII) and s3 match their targets.
(9) HUD panels at rest are unchanged against the actors compared with round 16 (Ch I 11-advisor at 2000x1012 in both rounds).

AGAINST:
- New major inside the new TEXT SIZE feature (R17-VIS-01): at 130 % on 1600x900 FFX, the enlarged command stack hides the acting Tidus completely. The help slab also covers the TALK row.
- New polish (R17-VIS-02): in Ch XVIII, during each party action, the push-in camera moves Yuna under the fixed Sin clock note. The note covers her face and staff for about 1 s.
- Carried polish PR-0248: the Ch VII Sensor card still sits over Guardian B's torso.

UNCAPTURED:
- the wide, 4:3 and 1440p/4K shapes (the candidate changed text-size-wide.css and the panel layout);
- Sin on a phone;
- Paine's Songstress;
- Anima's arrival;
- the CHAPTER hero plates.

GAIN VS ROUND 16 (8.7): yes, by removing the carried visual major and the Ch VII mis-headline. The new major is confined to a default-off accessibility setting at one size.

### feel: 8.3

**Chief:** +0.1 over the auditor (8.2), from gap-pass evidence the auditor could not credit: candidate input latency 3-16 ms keydown to highlight, 14 ms confirm to action-start, 17-25 ms by touch (latency-*/run.json); REDUCE MOTION and LOW EFFECTS proven in motion in both games at 1600x900 and 390x844; XVII seam 2->3 reads in about 4.3 s. Held down by PR-0244 (timed FAIL, kept major), PR-0061 (8.3-9.3 s, unchanged) and PR-0104.

[feel auditor, deep round 17, PRODUCTION CANDIDATE main 1a6fd3cc from D:/pyrefly-rel28, not deployed. Judged only on the capture owner's evidence in critic/rounds/round-17/evidence: headless Chromium, PYREFLY_BROWSER=gpu, ANGLE D3D11 on an RTX 5070 Ti. I opened no browser and started no server, so there was no port to close. I ran only node tools/critic-plan.mjs --json in the worktree, which left the worktree unchanged.] Scratch is in critic/rounds/round-17/feel-narr/: 116 contact sheets made by sheet.py, the dialogue timelines in dbox-all.txt and critic-plan.json. The sequences cover 18 chapters and both games, by keyboard and by 390x844 touch, at about 230 to 330 ms per frame. GAINS: (1) PR-0243 is closed. In Ch VII the Ink & Gold battle-start card reads 'Seymour' with his painting, and the intro dolly ends on the caption 'Seymour' (seymour-anima-macalania-win__seq-transition-into-battle.jpg, f00 to f09). (2) PR-0244 is partly repaired. The Ch VII aftermath is no longer an empty plate: Seymour stands on it and narration carries the kneel, the fall and the sending. It is downgraded to polish because the standing painting contradicts that narration (see issue). (3) The new Sin chapters present coherently. XVII has the battle card, then a dolly to the fin with the caption 'Left Fin', and the menu comes back at about 2.8 s. Seam 1->2 fades, dollies to the Right Fin and hands back at 2.5 s. XVIII's entry is the same, and its countdown reads at a glance (the '13 TURNS LEFT' dial and 'MOUTH SHUT'). 'Drawn to Sin.' is captioned about 0.7 s after the party action resolves (sin-face-win__seq-action-playing.jpg). (4) Skip and pause are respected. In 25 of 25 runs, Esc over the pre-battle scene opens pause and one hold skips the scene (preScene.escOpens / holdsToSkip in run.json). (5) The coach line now closes on one outside click or tap, with no command confirmed and the selection unchanged. That holds for FFX and FFX-2, desktop and phone (friends-coach*/run.json closedByOutside=true, confirmedNothing=true, logDelta 0). (6) The default-off switches leave feel unchanged. The Ch XVIII Hastega sequence on the candidate matches live 31a frame for frame within capture jitter (sin-face-win vs sin-face-win-live31a seq-party-action). Chain seams in III, V, VI, XI, XIV and XV still read the same way at about 2.5 s (braskas-final-aeon-win__seq-seam-2..7). LOSSES and OPEN: PR-0104 is still open for a third review (STALLED). In Ch IV at 1600x900, nothing visible happens for 1.8 s after Shell is confirmed, until Rikku's menu opens. In Ch VI, Rikku's Grenade is not seen within 2.3 s. The phone shows only a help line. PR-0254 is still open (second review): Ch VII Talk shows 'Tidus SPEAKS' for about 1.6 s and nothing is said. XVII's key story beats are captions on the unchanged deck plate (new feature). Real players found the pacing too fast in the friends' playtest on 31a. The candidate keeps that pacing by default: steady pacing (D-294) was adopted after this candidate and is not built here, so this is weighed, not filed. Frame pacing is 58 to 60 fps with p99 16.8 ms, but idle has single spikes of 200 to 217 ms (perf/*.json; scored under delivery). NOT MEASURED, so no credit given: input latency on this build (CommandMenu.ts and CommandMenuScroll.ts changed, so round 16's 3 to 17 ms is not reusable); hold-skip to first menu (PR-0061); REDUCE MOTION and LOW EFFECTS in motion (stills only); Ch VII's post scene over time; XVII links 2 and 3 and its jump; and Bailey's own feel verdict on this build (CHK-B2). Net: the two feel majors of round 16 are resolved or downgraded, and the pacing complaint and the stalled polish items remain. 8.1 -> 8.2.

### narrative: 8.9

**Chief:** +0.1 over the auditor (8.8): the three aftermaths the auditor had to leave UNVERIFIED were reached on the candidate by real keys in the gap pass: XVII (all three link-3 callouts, the Sinfall post scene), XVIII (Beat 11, Breaking Through) and XV (Paine's aftermath). All 18 chapters now reach their aftermath on this build. Held down by PR-0244, PR-0254, PR-0255, PR-0272 and no Bailey story read (CHK-B3).

[narrative auditor, deep round 17, candidate 1a6fd3cc] Dialogue timelines come from run.json dboxTimeline for 25 runs (feel-narr/dbox-all.txt). Scripts were read from D:/pyrefly-rel28/src/story (sin-fins-core.ts, sin-face.ts, seymour-anima-macalania.ts). Beats were checked against research/ffx-sin.md §9.2 and research/writing-bible.md §2.1 and §2.3. The only story changes since round 16 are Ch VII and the two Sin scripts (git diff 49005f73..1a6fd3cc -- src/story). Since live 31a there are none (git diff 52a431d0..1a6fd3cc -- src/story is empty). GAINS: (1) Chapter XVII's pre-battle scene follows ffx-sin.md §9.2 beats 1 to 5 in original words. Lulu gives the Hymn plan, and Wakka and Rikku both claim it: 'Neither of you said it.' Rikku says Shelinda has told Spira to sing, and Cid puts the Hymn on the speakers. Brother halts over 'Tidus. My sister...', and Tidus answers 'Yeah. I will.' Tidus throws the Gagazet sphere and Yuna smiles. Then Sin answers, and Cid sees the shine at the base of the arm. In battle, the Trigger lines follow §9.2 beat 5: 'Cid! Take us in close!' / 'Give me a second!', with a line for the telegraph and one for the cannon seam ('One arm down! Now the other side!' / 'Other side? It has two of those?!'). (2) Chapter XVIII follows beats 9 to 11. Yuna asks 'Do you think it hurts him?' and the silence is the answer (writing-bible §2.1 'Silence as dialogue'). She works out that Yu Yevon joins the summoned aeon. The climax obeys the rule: 'Tidus. Please... do not go away.', then the cut to Rikku. Sin rises with wings, Cid says the main gun is still dead, Tidus shouts 'Hey, old man! I'm coming!', and the aftermath is 'Breaking Through' narrated in Tidus's past tense with the glimpse of Seymour. The aftermath lines come from the live 31a run and are reused (see reused). Tone fits FFX in both: elegiac, short lines, one joke per heavy scene, Grim-tier victory quips. (3) PR-0253 is resolved: the first-Boost callout is now 'She's open! Hit her now, it'll hurt her more!'. (4) 15 chapters reach their aftermath by real input on the candidate: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV and XVI, both games, with 5 to 33 post lines each. That includes III ('I left in the part where she kept walking.') and XII ('Then don't keep him waiting.'). Chapter X Talk still speaks three exchanges. OPEN: Ch VII Talk is silent (PR-0254). Tromell's five lines have no name plate (PR-0255), although Brother now shows the name-only plate that would fix it. The Ch VII narration says Seymour kneels and falls over a painting of him standing (PR-0244, cross-referenced from feel). 'That's it?' still recurs, and 'Okay. Next one.' is now shared by VIII and XVIII (PR-0262, suggestion). XVII's cannon, gun and jump beats are caption-only placeholders. UNVERIFIED on this build: the XVII win path (Sinfall aftermath and link-3 callouts), the XVIII win on the candidate, and the XV aftermath. The harness hold-skips after 3 or 4 lines, so staging is read from timelines and scripts. Bailey's own story read is not recorded (CHK-B3).

### audio: UNVERIFIED (no number)

[Audio auditor, deep round 17. Production candidate is main 1a6fd3cc, served from D:/pyrefly-rel28/dist-gate, which already existed. It is not deployed.] I cannot hear, and I listened to nothing: every result here comes from reading data. No score is given because none can be given. Neither docs/audio/OWNER-VERDICT.md nor docs/target/decisions.json holds a numeric owner verdict on the shipped mix. The owner-side verdicts on record are all without numbers and all negative or partial: Bailey's 2026-09-27 'still sounds like snes music', his 2026-09-28 'tinny and hollow ... close to good' on the Chapter VII sketches, and the friends' 2026-09-29 playtest ('music bad', 'no attack SFX'), which Bailey concurred with. D-283 (the whole score in R1) and D-292 (O1, a V0 re-encode) are adoptions made on the driver's recommendation, not ear scores. Under RUBRIC section 6 the category is UNVERIFIED: it is not averaged away and it is not zero.

WHAT CHANGED: all 27 shipped audio files (26 music cues, the SFX sprite and manifest.json) are sha256-identical to the live 52a431d0 artifact manifest (critic/artifacts/52a431d0.json). The only audio code in the candidate's delta is src/audio/sfxMix.ts, the ?sfxmix switch (default a, trim 1), and the miss SFX, which changed from 'cancel' to 'whiff' (src/engine/BattlePresenterPorts.ts:424). Against round 16 (49005f73), every music cue except boss-vegnagun, scene-bevelle-underground and scene-macalania-temple was replaced by its R1 remaster in release 31a. So nothing technical was reused: it was all measured again.

TECHNICAL: PASS.
- `node tools/audio/qa.mjs --strict` in D:/pyrefly-rel28: exit 0, 0 cue findings, 0 SFX findings, manifest problems [].
- 26 cues measure -15.98 to -16.19 LUFS and -1.10 to -1.73 dBTP, with 0 clipped samples, every loop seam ok and every tilt gate ok.
- The sprite has 134 cues and peaks at -1.13 dBTP. Total audio is 42.95 of the 60 MB budget. dist-gate/audio is byte-identical to public/audio.
- An independent `ffmpeg -f null` decode of all 27 files gave 0 errors. The ebur128 spot checks agree with qa within 0.1 LU (title -15.9 LUFS / -1.3 dBTP; boss-yu-yevon -16.0 / -1.4; victory-ffx2 -16.0 / -1.3; boss-evrae -16.0 / -1.3).

STEREO (measured, not heard): R1 removed the 'hollow' signature from the whole pack. L/R correlation is now 0.65 to 0.84 on all 26 cues. In round 16, 15 cues sat at 0.04 to 0.16. Mono-sum loss is now -0.37 to -0.89 dB, down from as much as -2.86. Data: critic/rounds/round-17/audio-r17-stereo.json.

THEMES: themes-audit agrees with all 18 rows of the chapter cue map. 4 cues still depart from the bible: scene-gagazet, scene-dreams-end and scene-farplane have no tempo map (PR-0039), and scene-macalania-temple is not in the bible's cue map (PR-0260). That is the same set as round 16.

ROUTING: PASS on this round's runtime evidence.
- The sample: 178 AudioManager samples from 30 real-input runs (keyboard, keyboard plus mouse, touch plus keyboard on 390x844), GPU mode.
- Every playing cue came from source 'prerendered' (127 of 127). The sprite decoded in every sample, with 0 console errors and 0 not-found in every run.json.
- Scene beds, battle cues and chain seams match the cue map in every sampled chapter (I, III, IV, V, VII, VIII, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII). Chapter VI Leblanc has network evidence only.
- Wins: victory-ffx on FFX wins and victory-ffx2 on FFX-2 wins, with no crossing. Chapter IV's results are silent, as authored (encounters.ts:234).
- Defeats: results are silent on every loss (VIII, IV, XII, XV, XIII, XVII, XVIII). The cue map has no defeat cue.
- After an Esc pause, the pause cue hands back to the battle cue: every prompt after-fight sample shows the chapter's own battle cue fading.
- The silences are authored: Chapter I's wind-only opening (seymour-flux.ts:69); Chapter III jecht-falls, then the Valefor link starts silent until valefor-enters fires on first damage (PR-0129, braskas-final-aeon.ts:365); Chapter V seam-5 hands over to boss-shuyin.
- XIII Paragon's link on the scene bed is the documented stand-in.
- ?sfxmix default-off: 174 of 174 candidate samples read {a, 1, 0.35}. The other 4 are live-build samples, which have no such field.

SAVE (audio half of CHK-024): PASS. In all 13 save-matrix cases (release-31a written, fixtures 20/25/28/29, textSize coercions, fresh, truncated), the AudioManager volumes equal the loaded settings after the upgrade.

OPEN:
- The runtime proof that a miss plays 'whiff' is missing. The static trace is event 'miss' -> cue('miss', {volume: 0.5}) -> whiff, and the cue is in the sprite.
- The suspended-context overlap probe was not run by the critic.
- The title and chapter-select cues were not sampled while playing (they are proven only at request level).
- PR-0220 has no pad evidence.
- 11 of 18 chapters borrow stand-in cues (PR-0099).
- Measured, not heard: at the default mix, attack SFX peak about 8 dB and the miss whiff about 13.5 dB under the battle music's median (R17-AUD-01).

NOTE for the driver: D-292 O1 (about 73 MB of music) will exceed qa.mjs's 60 MB budget gate unless the budget is revised with it.

I started no server and opened no browser. dist-gate was not rebuilt. Get-NetTCPConnection shows no listener on ports 5400 to 5990.

### interface: 8.2

**Chief:** -0.2 from the auditor (8.4): the gap pass found a major the auditor did not have, PR-0265 (the pause ESC RESUME button does nothing on tap or click, both games, the same on live), which makes the phone pause exit depend on a workaround; and it measured the new Zombie warning at 11 px (PR-0264). PR-0218 now passes (page buttons by real taps), PR-0213 FFX-2 target cancel passes.

Deep review round 17, production candidate main 1a6fd3cc (bundle index-ChAAAZ-I.js, as the save matrix loaded it from dist-gate on 127.0.0.1:5700). I judged only the capture owner's evidence in critic/rounds/round-17/evidence: index.json, each run.json and turn-log/battle-log, the logs, and the screenshots I opened. The captures were headless Playwright with PYREFLY_BROWSER=gpu at 1600x900, 2000x1012 and 390x844 (touch in the -touch and friends phone runs; keyboard on a phone viewport in the comfort runs). There are no 2560x1080, 4K or 4:3 captures this round. I opened no browser and started no server, so I had no port to close.

GAINS SINCE ROUND 16 (8.2):
- PR-0245 (major) is resolved. In the Ch VII win, Guardian A is at 0 HP from turn 8. None of the next 20+ advised picks is a Phoenix Down on it (turn-log). This matches the r30-ch7 repair.
- PR-0234 is fixed. The Ch X card reads 'Talk' with its real sentence and no 'ALWAYS HITS' (seymour-natus-win/16-target-single.png).
- PR-0235 is fixed. The Darkness card now says 'Costs Rikku 12.5% of max HP' (comfort-ffx2-bahamut-1600x900-r2/12-hud-text-130.jpg).
- Phone reach (PR-0218) is much better. In the phone Ch XII run, 45 of 46 advised moves were taken, against 30 misses in 106 in r16 Ch VII. The one miss is a row below the fold that the tap-only harness never paged to.
- Advice is legal and reachable on desktop. In every FFX and FFX-2 run the advised row was found and taken. The only exceptions are the 'last remaining aeon' Summon cases: the engine did summon, and the harness saw no submenu (the same in r16).
- 0 target mismatches in 22 chapter runs. Single-target and cancel frames are clean (e.g. seymour-natus-win/16, 16b). Multi-target shows brackets, an ALL ALLIES chip and the TARGET plate in both games (extras-*/52-target-all.jpg).
- Esc pause worked from the command menu in all 22 chapter runs, and H hides and restores the panels in both games.
- The mouse wheel scrolls the command lists in both games. The more-below mark pages the FFX list, with 0 log events and no targeting opened (friends-wheel*).
- The first-time coach line now closes on any outside click or tap in both games, both sizes, and confirms nothing (friends-coach*). On the phone it says TAP CONTINUE.
- A new Zombie warning on the target plate: 'Kimahri ZOMBIE: 1,000 DAMAGE', matching the engine's 1000 damage (friends-zombie*).
- Intent stays honest: SCRIPTED / MOST LIKELY 83% / 'Lands on one of these, picked when it acts', Zombie 50% with Ward, and 'Colour order: our estimate' for Omnis.
- CHK-007: a grep of every captured briefing, prep, advisor, intent, pause, scene and results text found no developer vocabulary.

WHAT HOLDS IT DOWN (all polish, no interface major):
- The desktop Zombie warning is about 10-11 px grey type (R17-IF-02), while a single click commits.
- The board truncates 'Sin: the Fins and the ...' and clips the Roman-numeral strip (R17-IF-03).
- No advisor card or N chip at the first menu of either Sin chapter, candidate and live alike (R17-IF-04).
- The phone coach card sits over the FFX-2 intent line and boss plate (PR-0237 phone).
- The phone results caption is clipped (PR-0250).
- In FFX-2 multi-target, the intent card sits over Yuna's lower body (PR-0249 refined).
- The FFX-2 list header is clipped after a wheel scroll (R17-IF-05).
- The Ch I Zombie note reads against its own pick (R17-IF-06, low confidence).
- The coach overlaps the selected row in Ch X at 2000x1012 (PR-0252).
- CHK-003 has no DOM sweep; the builder measured the FFX-2 help band at 11.7 px. CHK-002 and the wide/4K shapes are UNVERIFIED.

WHY +0.2, not more: the interface major is gone and two carried polish items are verified fixed. CHK-003, CHK-008 and CHK-009 still fail, and the deep rotation shapes were not captured.

### onboarding: 8.2

**Chief:** +0.1 over the auditor (8.1): the two things the auditor could not credit were then proven: TEXT SIZE, REDUCE MOTION and LOW EFFECTS set by real TAPS on 390x844 in both games (textsize-taps-*-r2), and LOW EFFECTS drawing 33 of 110 sparks (30 %) per hit in both games. Held down by PR-0266 and PR-0270 (both inside the new setting) and PR-0032 (no remap, no flash setting).

PR-0032's core landed and was proven with real keys on this candidate (comfort-* runs, both games, 1600x900, 2000x1012, 390x844):
- The OPTIONS rows read TEXT SIZE, REDUCE MOTION and LOW EFFECTS in the approved order, in both games' pause (…/22-options-rm-le-on.jpg).
- TEXT SIZE steps 100 → 115 → 130, clamps, and Confirm wraps to 100 (textSizeRow).
- The settings persist across a reload and sit on <html> before any pause (afterReload.html textSize 130, reduceMotion true, lowEffects true).
- FFX text really grows:
  - desktop command label effective size 24.5 → 28.2 → 31.9 px (cmdScale 2.506 → 3.258)
  - phone labels 18.4 / 20.8 px at 115 / 130
  - 0 clipped rows
- REDUCE MOTION does what it says in battle over 20 presses:
  - FFX 1600: smooth-move frames 377 → 0, roll 247 → 0, shake 65 → 0
  - FFX-2 1600: 266 → 0, 150 → 0, 64 → 0
  - Moves become cuts (5 → 24 cuts over 3 degrees), which is the approved option (a).
- The save matrix keeps every setting of a release-31a save and of the release-28/29/25/20 fixtures. textSize becomes 1 on <html>, 1.15 and 1.3 are kept, garbage is coerced to 1, and truncated storage boots clean (save-matrix/save-matrix.json). Save integrity itself is delivery's category.

Other onboarding gains:
- The coach line closes on any outside press, says TAP on phones and ENTER on desktop, and the FFX-2 line fades on its own.
- The Zombie heal warning is a text cue, not colour only.
- Auron's briefing now says 'Eighteen fights', matching the 18-tile board, and stays honest about CTB versus ATB.

STILL MISSING OR WEAK:
- R17-ON-01 (major, disclosed by the builder's checker, new feature): TEXT SIZE changes nothing in the FFX-2 battle HUD or in the pause in either game. FFX-2 effective size stays 24.6/24.5/24.5 px on desktop and 16/16/16 on the phone, and 10- vs 12-hud-text frames are identical. It waits on D-220 Q4.
- R17-ON-02: FFX HUD collisions at 130 % that the solver does not measure:
  - the PAUSE chip over N HIDE MOVES
  - N HIDE MOVES over G GUIDE
  - the help slab over the TALK row
  - the party panel over the downed Yuna
- The rest of PR-0032 is now polish: no key remapping and no flash reduction (A3/C and D-220 Q7 undecided).
- LOW EFFECTS: the flag and its persistence are proven, but its in-battle effect (30 % sparks) was not measured.
- Phone TEXT SIZE by real taps was not captured this round; the comfort phone runs used keys on a phone viewport.
- Status pips are colour-only squares (the Zombie pip is pale green, title 'Zombie'). This is the open status-display decision for Bailey, not scored as a defect.

NEWCOMER: SIMULATED, not real. A scripted harness went from a fresh profile through title, briefing, board, prep, scene and fight using visible prompts and ordinary keys and taps.

WHY +0.6: three of the five missing accommodations now exist and work on FFX. FFX-2 gets only part of TEXT SIZE, 130 % collides, remap and flash are still absent, and the phone tap path is unverified.

### prep: 8.9

Candidate main 1a6fd3cc (dist-gate bundle index-ChAAAZ-I.js). The capture owner used headless Chromium from node with PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti). I opened no browser and started no server. Sources: critic/rounds/round-17/evidence (index.json, 997 entries; 27 run.json files, summarised in critic/rounds/round-17/prep-delivery/runs-summary.json), plus one vitest run on D:/pyrefly-rel28 (37 files, 455 tests passed; critic/rounds/round-17/prep-delivery/vitest-prep-delivery.txt).

PREP AGENCY: every one of the 18 chapters reached party prep by real keys. Esc from prep returns to the board with the cursor on the chapter that was entered, in every run (prepEsc=chapter-select, cardAfterBack = that chapter). FFX prep has the CHAPTER / STATS / SPHERE GRID / EQUIPMENT / ITEMS / OVERDRIVE tabs. FFX-2 runs exercised a dressphere change (seq-spherechange).

Sphere Grid (FFX only): six friend-reported bugs fixed:
- the travelled-step price;
- an opened lock still drawn as closed;
- locks re-closing after prep re-entry while the key stayed spent;
- the HP/MP base stat skipped;
- walk mode wandering out of reach;
- the click hint.
sphere-grid-fb0929.test.ts and sphere-grid-model.test.ts pass on the candidate. The builder-side CHECK in docs/handoff/fb-0929-sphere.md reproduces each fix in a browser. The critic's capture owner took no Sphere Grid capture, so the interaction is UNVERIFIED here (see capturesNeeded) and gets only partial credit.

RESULTS AND REWARDS: results screens show AP/EXP, GIL, ITEMS and per-member lines, and 'no full turn taken · no AP' still appears (Natus Kimahri, Omnis Tidus). Defeat screens show TURNS, ATTEMPTS and BEST. PR-0258 is re-confirmed on this build: Chapter VII shows OVERKILL x1 with 'Ability Sphere x3', where the sources give 4. results.ts:31-35 is unchanged.

RETRY: every loss reached RETRY, then prep, then a new battle: VIII, IV, XVIII x4, XVII x2, XII (desktop and phone), XIII and XV. Fight end to the next battle took 6.0 to 7.3 s including harness waits, the same as round 16. flow-checkpoint-retry.test.ts covers all 18 chapters.

PROGRESS: every win's clear survives a real reload (boardAfterReload); see CHK-024 for the upgrade matrix.

DEDUCTIONS:
- R17-PREP-01 (major, new): Bailey adopted the Sin link-3 retry checkpoint on 2026-09-29 (D-284), but it ships OFF (sin-genais-core.ts:199 SIN_LINK3_CHECKPOINT = false).
- PR-0258 (polish, carried).
- The Sphere Grid fixes were not observed by the critic.

No gain over round 16 (8.9): the Sphere Grid repairs are offset by the undelivered adopted checkpoint.

### delivery: 8.7

**Chief:** +0.1 over the auditor (8.6): the three win paths the auditor counted as unobserved (XV, XVII, XVIII) were reached on the candidate by real keys in the gap pass, so every one of the 18 chapters now has a real-key win through results, board and reload on this build. Held down by PR-0240 (18.6 s loading card at 10 Mbit/s), PR-0259 and no Firefox, WebKit, real phone or controller evidence.

Production candidate 1a6fd3cc in D:/pyrefly-rel28/dist-gate. My decode-checked manifest has 1005 files, 509.5 MB, artifactHash 2011851984efc73c88b12be5f0b6b5f07abe1bf4c2bd3659f7f2f69cb025e591, decodeChecked=true, problems=[], audioUnverified=0 (critic/rounds/round-17/prep-delivery/artifact-manifest-dist-gate.json). Against live 52a431d0 (critic/artifacts/52a431d0.json) the file diff is exactly:
- the new bundle, css and map;
- index.html and the worker map;
- .nojekyll, which only the deploy writes.
No art or audio file changed (prep-delivery/diff-vs-live-52a431d0.json).

FLOWS (CHK-022): 27 runs, 2,936 media requests, 0 console errors, 0 responses >= 400, 0 images served as text/html. 15 of 18 chapters were won by real keys through results, aftermath and board, plus a reload that keeps the clear:
- FFX: I, II, III (with aftermath; settles round 15's III debt), VII, VIII, IX, X, XII (loss, RETRY, then a win with aftermath; settles XII) and XIV.
- FFX-2: IV, V, VI, XI, XIII (loss, RETRY, win) and XVI (desktop and 390x844 touch).
- The VIII loss reached RETRY and a new battle (settles round 15's VIII debt).

Wins NOT reached on this candidate, all by the advisor-following harness, each with RETRY working: XV Den of Woe (2 losses), XVII (2 losses on the right fin), XVIII (3 losses). XVIII was won on live 31a with seed 1 by the same harness. The turn logs match for 33 turns and first diverge after Auron's Dragon Fang, a timed Overdrive input: Sin's HP is 80,472 on live and 80,449 on the candidate at turn 34. The outcome difference is therefore input-timing variance, not established as a regression. Those three wins are UNVERIFIED.

SAVE (CHK-024, save-data class), all by running (critic/rounds/round-17/evidence/save-matrix/save-matrix.json, logs/save-matrix.log):
- A save written by the live release-31a artifact itself and fixtures from releases 20, 25, 28 and 29 load on the candidate with every setting, clear, best-time ribbon, attempt, flag, unlocked entry and seenCoach kept (diffs [], unexpectedDiffs []).
- textSize reads 1 with <html data-text-size=100>.
- A stored 1.15 or 1.3 is kept and applied on the first frame without opening pause (CHK-023).
- 2, '130', null and non-boolean flags coerce to the defaults.
- A fresh profile and truncated storage boot to defaults with no errors.
- Every case survives a reload.
- In both games, desktop and 390x844, a returning release-31a player set TEXT SIZE 115/130 %, REDUCE MOTION and LOW EFFECTS by real keys in OPTIONS. All three persisted through a reload (comfort-*-r2 run.json, persisted=true).
- The capture harness's tsOk=false on old saves is its own strictness: it wants textSize in the stored blob before any write; storage is rewritten on the next save. Not a defect.

LOAD AND FRAME TIME, named conditions: headless Chromium, cold profile and cache, localhost vite preview of dist-gate, RTX 5070 Ti, agents capped at 12 of 16 threads, host load 59-87 % with other headless browsers resident (logs/host-load*.txt).
- Title-ready: 0.33-0.35 s unthrottled, 0.59 s at 50 Mbit/s, 1.41-1.49 s at 10 Mbit/s.
- Chapter-entry loading card: 0-0.3 s unthrottled, 1.1 s at 50 Mbit/s (XVIII), but 18.6 s at 10 Mbit/s (first menu 32.1 s after the card; run 1 showed 31.1 s). PR-0240 is unchanged from round 16's 18.8 s.
- Cold transfer is 125-201 MB per chapter session.
- Frames: average 58-60 fps, p95 16.7-16.8 ms. Spikes: 217 and 200 ms max in the Bahamut idle window, 200 ms in the Ixion fight, 150 ms in the Sin Face fight (PR-0259; the loaded host confounds them).

UNVERIFIED and never passed: Firefox, Safari/WebKit and Edge; a real phone; a real controller; the FF7 cold hold and pause (PR-0222/0223); the save reset flow; the live artifact (the candidate is not deployed).

SERVERS: I started none. The capture owner's lanes.log records stopping 5701 (PID 55552 and 63816) and 5700 (PID 47832). At the end, Get-NetTCPConnection shows no listener on ports 5400-5990.

No gain over round 16 (8.6): save and settings coverage is stronger, but three chapters' win paths are unobserved on this build and the load residual and spikes are unchanged.

## Approved-target gate

required 81 / matched 61 / failing 0 / unverified 20 / waiting 5.

The visual auditor's tally: required = round 16's 79 plus the two Sin chapter picks that shipped in release 30. Round 16's matches for the Ch VII Seymour speaker portrait and the Ch I and Ch IV CHAPTER hero plates were not reused (PauseScreen, PauseScreenPanels and pause/PauseView changed; r30 changed Ch VII's scene flow), so they count as unverified. The gap pass added no tile matches.

Approved art: approved 290/290 and judge-locked 48/48 byte-identical in the dist-gate manifest; verify-approved (ROOT=D:/pyrefly-rel28) 338 ok, 0 mismatched, 0 missing.

## Encounters (real flow on the candidate)

| Chapter | Real flow | Outcome |
|---|---|---|
| seymour-flux | yes | victory |
| yunalesca | yes | victory |
| braskas-final-aeon | yes | victory |
| seymour-anima-macalania | yes | victory |
| evrae-airship | yes | victory + defeat/RETRY |
| yojimbo-cavern | yes | victory |
| seymour-natus | yes | victory |
| seymour-omnis | yes | defeat then RETRY then victory (desktop); defeat x2 (phone) |
| isaaru-via-purifico | yes | victory |
| sin-fins-core | yes | victory (gap pass, seed 1, 1600x900, keyboard); defeat x2 + RETRY (advisor-following, 2000x1012) |
| sin-face | yes | victory (gap pass, seed 7, 1600x900); defeats x5 advisor-following (seeds 1, 1001, 2, 3); defeat + RETRY |
| ffx2-bahamut | yes | victory + defeat/RETRY |
| ffx2-vegnagun-shuyin | yes | victory |
| ffx2-leblanc | yes | victory |
| ffx2-fallen-aeons | yes | victory |
| ffx2-trema | yes | defeat then RETRY then victory |
| ffx2-den-of-woe | yes | victory (gap pass: seed 1 lost, RETRY, seed 1001 won, 2000x1012); defeat x2 (capture owner) |
| ffx2-ixion-djose | yes | victory (desktop and phone) |

- **seymour-flux**: I, 2000x1012, seed 1: title, briefing, board, prep (Esc back), scene (Esc skip), fight, results, CONFIRM, aftermath scene, board, reload. 30-post-scene is UNVERIFIED: the screen was already results, which is harness timing (same as round 16). Evidence: seymour-flux-win/.
- **yunalesca**: II, 1600x900, seed 1: the full route through to board and reload. 30-post-scene UNVERIFIED (same harness timing). The aftermath scene after CONFIRM is captured in 33-after-confirm-scene.png.
- **braskas-final-aeon**: III, 1600x900, seed 1, 21 min: 7 links and 6 seams, each with its first menu captured, Doublecast, Overdrive minigame, post scene, results, aftermath, board, reload. Settles the III aftermath owed to CHK-022.
- **seymour-anima-macalania**: VII, 1600x900, seed 1: the full route through to board and reload.
- **evrae-airship**: VIII: win at 2000x1012 (orders widget, results, board, reload); loss at 1600x900 reached Defeat, RETRY and back into battle. Settles the VIII loss + RETRY owed to CHK-022. 30-post-scene on the win is UNVERIFIED (harness timing).
- **yojimbo-cavern**: IX, 1600x900, seed 1: the full route through to board and reload.
- **seymour-natus**: X, 2000x1012, seed 1: the full route through to board and reload.
- **seymour-omnis**: XII at 2000x1012, seeds 1 then 1001: lost attempt 1, RETRY, won attempt 2 with post scene, results, board and reload. Settles the XII aftermath. The phone run (390x844, touch) completed the whole flow but lost both attempts with RETRY reached. That loss comes from following the advisor, not from a flow failure.
- **isaaru-via-purifico**: XIV, 1600x900, seed 1: 3 links, post scene, results, board and reload.
- **sin-fins-core**: Gap pass: one continuous real-key run from the board through links 1-3 (sensible line, Slice & Dice x2 and Dragon Fang 7/7 played by keys), 228 commands, 14:25 of fight, then the Sinfall post scene, results CLEARED Victory OVERKILL NEW BEST, board and reload (evidence/gaps/sin-fins-core-win-r17gap-s1/). Earlier: two advisor-following attempts wiped on the Right Fin (evidence/sin-fins-core-win/), with RETRY back into battle.
- **sin-face**: Gap pass: seed 7, keyboard, 67 real commands, Bushido 7/7 correct (engine success: true), post scene Beat 11 Breaking Through, results CLEARED Victory with victory-ffx, board and reload (evidence/gaps/sin-face-win-r17gap-s7/). Seeds 3 and 4 on the same line lost to Giga-Graviton on Sin's 13th turn. Advisor-following runs lost 5 of 5 (PR-0269).
- **ffx2-bahamut**: IV: win at 1600x900 (6.9 min, results NEW BEST, CONFIRM, aftermath, board, reload with the cleared tick kept); loss at 2000x1012 reached Defeat, RETRY and back into battle. This is the FFX-2 loss + retry.
- **ffx2-vegnagun-shuyin**: V, 1600x900, 23.6 min: 5 links, spherechange sequence, post scene, results, board and reload.
- **ffx2-leblanc**: VI, 2000x1012: 3 links, spherechange, results, board and reload. 30-post-scene UNVERIFIED (harness timing).
- **ffx2-fallen-aeons**: XI, 1600x900, 16 min: 3 links, spherechange, post scene, results, board and reload.
- **ffx2-trema**: XIII, 1600x900, 33.6 min: lost attempt 1, RETRY, won attempt 2. Phase seam, spherechange (21-change-open), post scene, results, aftermath, board and reload. Settles the XIII aftermath owed to CHK-022.
- **ffx2-den-of-woe**: Gap pass: through both seams, post scene, results CLEARED Victory, after-CONFIRM aftermath, board and reload (evidence/gaps/ffx2-den-of-woe-win-r17gap/). The capture owner's two losses are ATB wall-clock variance, not a regression (engine and data unchanged).
- **ffx2-ixion-djose**: XVI: the lane-A runs stopped at the board with ASSERT-FAIL 'card got seymour-flux'. route.mjs walks only 16 cards and XVI is the 18th, which is a harness cause. Re-run with a 24-press walk (cap/route17.mjs): 2000x1012 win and 390x844 touch win, each through results, board and reload. 30-post-scene UNVERIFIED on both (harness timing).

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | PASS | yes | Technical half: qa --strict exit 0, 0 findings; 26 cues -15.98 to -16.19 LUFS, -1.10 to -1.73 dBTP, 0 clips, every seam ok; all 27 audio files decode (ffmpeg); themes-audit agrees with 18/18 chapter rows. All audio files are sha256-identical to live 52a431d0. The ear half is CHK-B1 (UNVERIFIED). |
| CHK-002 | UNVERIFIED | yes | The gap pass measured the pause painting in fresh contexts at 1280x960, 2560x1080 and 3840x2160 (rect = viewport, 2x webp tier, layerTransform none: PASS at those three). The check names six viewports: 1280x720 was not captured (1280x960 was used instead), and 390x844, 1600x900 and 2000x1012 have frames but no rect / currentSrc measurement this round. |
| CHK-003 | FAIL | yes | DOM sweep (gap pass): FFX HUD at 1600x900 has 5 nodes at 12.3 px; FFX-2 HUD 12 nodes, min 11.7 px; at 1280x960 FFX 31 nodes (min 9.8), FFX-2 18 (min 9.3); the phone pause OPTIONS rows 12-13 px; the new Zombie note 11 px at 1600x900 (PR-0264, PR-0251). The advisor measures 14.2 px desktop, 15 phone; 2560x1080 and 4K have 0 nodes under 14. |
| CHK-004 | PASS | yes | Every advised row was found enabled in the named submenu and taken in 22 chapter runs (took == want); 0 target mismatches; phone Ch XII 45 of 46 advised moves taken. Side note filed as PR-0273: XVII link 3 lists disabled order rows. |
| CHK-005 | PASS | no | Zombie boards: the guide offers Holy Water on the Zombie Kimahri and the plate warns; wording issue PR-0277 (low confidence). |
| CHK-006 | PASS | yes | FFX target cancel (16b in Ch I to XII), FFX-2 single-target cancel in Ch IV (gap pass: 0 reticles, targeting classes gone, menu back on Attack), coach closed by an outside press with nothing confirmed. |
| CHK-007 | PASS | yes | No developer vocabulary in any captured player-facing text. |
| CHK-008 | FAIL | yes | At default settings panels at rest match round 16 and clear faces. Failures: TEXT SIZE 130 % hides the acting FFX character and TALK, and the key chips collide (PR-0266, new feature); the XVIII clock note over Yuna during action camera moves (PR-0271); the Ch VII Sensor card over Guardian B (PR-0248); the phone coach over the FFX-2 intent line (PR-0237); the FFX-2 multi-target intent card over Yuna (PR-0249); the Ch X coach over the selected row at 2000x1012 (PR-0252). The gap-pass TEXT SIZE 130 % sweep of Ch IX and XII (16 menus at 1600x900 and 2000x1012) found 0 command/help/chip/party overlaps once a menu is rebuilt. |
| CHK-009 | FAIL | yes | Truncated or clipped names: the board's 'Sin: the Fins and the ...' and the Roman-numeral strip (PR-0275), the phone confirm button 'TTACK -> GUADO GUARDIAN' (PR-0246), the FFX-2 Item header after a wheel scroll (PR-0276), the phone results caption (PR-0250). |
| CHK-010 | PASS | yes | Single and multi-target cues in both games, including FFX-2 single target in the gap pass. |
| CHK-011 | PASS | yes | Every targetable enemy identifiable in its default framing in all 18 chapters. |
| CHK-012 | PASS | no | No placeholder face or body visible; the Songstress mannequin (PR-0228) is gone for Rikku. Paine's Songstress was not in play in any run. |
| CHK-013 | UNVERIFIED | yes | The new Sin art and Rikku's Songstress render correctly beside their neighbours at 1600 and 2000, but the check requires 2560x1440 in-game frames, none were captured, and Paine's Songstress was never seen in game. |
| CHK-014 | PASS | yes | Facing, ground contact and scale consistent in all 18 chapters; Sin's fins are separate paintings. |
| CHK-015 | FAIL | yes | Keyboard (Enter, Esc, P, H, N, E, G, arrows, Backspace), mouse wheel and scroll-mark clicks, touch taps, Overdrive minigames and spherechange were all proven with real input on the candidate (capture owner, feel, interface). But the gap pass proved that a tap or a mouse click on the pause screen's visible ESC RESUME button does nothing in both games (PR-0265; the same on live 31a). A control a player can see and use does not work, so the check fails. No gamepad run this round (not run: the command lists changed, and the round-16 shim evidence is not reusable). |
| CHK-016 | PASS | yes | Every capture asserts screen and state first; 6-7 30-post-scene stills that landed on results were marked UNVERIFIED by the harness and excluded; ASSERT-FAIL at card selection was thrown, not shot. |
| CHK-017 | NOT APPLICABLE | yes | Exact live artifact: the candidate is not deployed. Owed after the deploy: node tools/artifact-manifest.mjs verify-live against critic/artifacts/1a6fd3cc.json plus a live save/reload smoke with a release-31a save. |
| CHK-017 | FAIL | yes | Load and frame time on named conditions (headless Chromium, cold profile and cache, localhost preview of dist-gate, RTX 5070 Ti, host load 59-87 %): title-ready 0.33-1.49 s everywhere (met); chapter loading card 0-0.3 s unthrottled and 1.1 s at 50 Mbit/s (met) but 18.6 s at 10 Mbit/s, first menu 32.1 s after the card (PR-0240, unchanged); frames 58-60 fps average, p95 16.7-16.8 ms, spikes 150-217 ms (PR-0259, host saturation not excluded). |
| CHK-018 | PASS | no | No intermediate art file referenced; 2,936 media requests with 0 >= 400 and 0 HTML-typed images. |
| CHK-019 | PASS | yes | 1005 files hashed and decode-checked (problems [], decodeChecked true); approved 290/290 and judge-locked 48/48 byte-identical; no media file differs from live 52a431d0. |
| CHK-020 | FAIL | yes | Parity holds for the coach close, wheel scroll, OPTIONS rows, REDUCE MOTION, LOW EFFECTS, the pause H and audio routing. TEXT SIZE scales the FFX HUD but not the FFX-2 HUD or either pause (PR-0270, a documented owner-gated switch inside a new feature). |
| CHK-021 | PASS | yes | Every change carries a written, sourced game case (Sin, Zombie, Sphere Grid and advisor v4 FFX only; comfort rows, scroll fixes and coach close both); presence and absence pinned by tests and runs; default-off switches inert without their parameter (174 of 174 audio samples read sfxmix a; cam and pace current; no zombie-warn class). |
| CHK-022 | PASS | yes | Every one of the 18 listed chapters was won on the candidate by real input through results, CONFIRM, aftermath, the board and a reload that keeps the clear: 15 by the capture owner, and XVII (seed 1, 1600x900, 228 commands, minigames played), XVIII (seed 7, 1600x900, 67 commands, Bushido 7/7) and XV (seed 1001 after a loss and RETRY, 2000x1012) by the gap pass. Losses reached Results and RETRY back into battle in VIII (owed since round 15), IV (FFX-2), XII (desktop and phone), XIII, XV, XVII and XVIII. The III, XII and XIII aftermaths owed since round 15 are settled. Seeds were set by the labelled setSeed hook before the first key; no other hook was used on the win routes. Six 30-post-scene stills landed on results (harness timing) and were excluded; the post scenes are proven by the dialogue timelines and the after-CONFIRM frames. |
| CHK-023 | PASS | yes | Real input reaches the real system: 19 real-key FFX logs replay event for event through the pure engine (including XVII link 1 and XVIII x5); the Hi-Potion on a Zombie Kimahri deals 1,000 in the running game; a miss plays whiff and never cancel (gap pass, FFX Ch XII seed 6 and FFX-2 Ch IV); 0 music-overlap samples (keys, suspended context, phone taps); stored TEXT SIZE / REDUCE MOTION / LOW EFFECTS apply on boot before pause; audio routing matches the cue map in every sampled chapter. |
| CHK-023 | FAIL | yes | Ch VII Talk: a real-key Talk by Tidus shows 'Tidus speaks' and no line in 7.1 s of frames (PR-0254). The Ch X Talk in the same build speaks. |
| CHK-024 | PASS | yes | SAVE-DATA CLASS, proved by running: a save written by the live release-31a artifact itself (served and stopped by PID) and fixtures from releases 20, 25, 28 and 29 load on the candidate with every setting, clear, best time, attempt, flag, pick and seenCoach kept (diffs []); textSize reads 1 with html data-text-size=100; stored 1.15 and 1.3 are kept and applied on the first frame; 2, "130" and null coerce to 1; fresh and truncated storage boot; AudioManager volumes equal the loaded settings in all 13 cases; every case survives a reload. TEXT SIZE 100/115/130, REDUCE MOTION and LOW EFFECTS set by real keys (desktop and phone viewport) and by real taps (390x844) in both games persist through a reload. Not driven: the save reset / confirmation flow. |
| CHK-025 | UNVERIFIED | no | The hidden FF7 fight was not captured this round (PR-0222, PR-0223); no FF7 file changed in this candidate. |
| CHK-B1 | UNVERIFIED | yes | No numeric owner listening verdict on the shipped mix exists; the latest owner-side verdicts are negative ("still sounds like snes music"; the friends' "music bad", concurred). Agents cannot hear. |
| CHK-B2 | UNVERIFIED | no | No owner play of 1a6fd3cc recorded; the latest human verdict is the friends' playtest on live 31a (pacing too fast, no attack sound). |
| CHK-B3 | UNVERIFIED | no | Bailey's story read of the Sin chapters and the newly reached aftermaths is not recorded. |

## Coverage matrix

**Tested**

- SAVE-DATA CLASS: 13-case save matrix by running on dist-gate, including a save written by the live release-31a artifact itself and fixtures 20/25/28/29, textSize coercions, fresh and truncated storage, every case reloaded; AudioManager volumes equal the loaded settings; TEXT SIZE / REDUCE MOTION / LOW EFFECTS set by real keys (1600x900, 2000x1012, 390x844 viewport) and real taps (390x844) in both games, persisted through a reload.
- CHK-022: all 18 chapters won by real input on the candidate through results, aftermath, board and reload (15 by the capture owner, XV/XVII/XVIII by the gap pass); losses with RETRY in VIII, IV, XII (desktop and touch), XIII, XV, XVII, XVIII; XVI also by 390x844 touch.
- Engine: 19 real-key FFX logs replayed event for event (CHK-023); the Sin data audited cell by cell against research/ffx-sin.md; Sin benches at 200 seeds; three-line bench for every FFX chapter; Den of Woe 200-seed bench; the Bushido failure path (PR-0267) on a forked board; full suite 674 files / 10,260 tests passed.
- Friends' playtest fixes by real input: Zombie pip and plate (desktop and phone, damage 1000 in the running game), wheel and scroll marks (both games), coach close on an outside press (both games, both sizes), miss plays whiff (FFX Ch XII seed 6, FFX-2 Ch IV).
- Motion: REDUCE MOTION on/off timed sequences in Ch I and IV at 1600x900 and 390x844 (0 smooth moves, roll and shake with RM on); LOW EFFECTS 33 of 110 sparks per hit; input latency by keys and touch; hold-skip timing; XVII seams 1->2 and 2->3.
- Interface: DOM legibility sweep at 1600x900, 1280x960, 2560x1080, 3840x2160 and 390x844; pause painting rect and tier at 1280x960, 2560x1080 and 4K; TEXT SIZE 130 % sweep of Ch IX and XII (16 menus); FFX-2 single-target and cancel; phone list paging; pause RESUME by tap and click on the candidate and on live 31a.
- Visual: 85 target-vs-build composites, 14 contact sheets, approved and judge-locked hashes, mid-fight facing and staging in all 18 chapters.
- Audio: qa --strict, ffmpeg decode of all 27 files, ebur128 spot checks, stereo correlation, themes-audit, 178 routing samples from 30 real-input runs, music-overlap probe (keys, suspended context, phone taps), title and chapter-select cues, XVII results cue.
- Load and frame time on named conditions (cold profile, unthrottled, 50 and 10 Mbit/s).

**Reused, with the dependency argument**

- FFX-2 combat bench (ATB speeds, chains, dresspheres, Garment Grid gates) (from round 16 (49005f73), carried from round 15): git diff 49005f73..1a6fd3cc is empty for src/battle/ffx2 and src/data/ffx2; common/types.ts changed additively only; the FFX-2 golden and chain tests pass on the candidate; no open related defect. A fresh Den of Woe 200-seed bench was added.
- PR-0226 pause hand-back of the battle cue (from round 16): The candidate's pause diffs add only comfort and text-size rows and touch no music call; src/audio/musicSlot.ts unchanged since 52a431d0; this round's after-fight samples agree.
- XVIII Breaking Through lines and results quip (narrative content) (from this round's live 31a run (sin-face-win-live31a)): git diff 52a431d0..1a6fd3cc -- src/story is empty. Superseded for reachability by the gap-pass candidate win (sin-face-win-r17gap-s7).

**Not tested**

- Sphere Grid interaction (the six friend-reported fixes) by real input in party prep: builder CHECK and unit tests only
- Gamepad: no pad run this round (the command lists changed; round 16's shim evidence is not reusable); real controller absent
- Firefox, Safari/WebKit, Edge; a real phone
- The save reset / confirmation flow
- The hidden FF7 fight (PR-0222, PR-0223, CHK-025)
- Idle-host frame-time re-measure (PR-0259)
- XVII and XVIII first menu held 2 s after the coach closes (R17-IF-04 follow-up); phone first menus for FOC30-P01/P02
- The Ch III valefor-enters silence timing (PR-0129, informational)
- LOW EFFECTS off-side spark count (the source passes share 1)
- Touch target/confirm latency in Ch IV (Yuna has no Attack row)
- The XVII link-3 checkpoint RETRY (not applicable: the switch ships off)
- Paine's Songstress in game; Anima's arrival; the CHAPTER hero plates
- PR-0247, PR-0256, PR-0257, PR-0161, PR-0239, FOC28-P02 and PR-0261 (carried, not re-tested)

**Required and not tested**

- CHK-002: 1280x720 in a fresh context, and rect / currentSrc measurements at 390x844, 1600x900 and 2000x1012
- CHK-013: 2560x1440 in-game frames of the Sin art and both Songstress paintings (Paine not seen in game)
- CHK-B1: Bailey's numeric listening score (only Bailey can give it)
- CHK-015: a gamepad run on this candidate's changed command lists
- CHK-017: live verification of this exact artifact, owed after the deploy
- CHK-024: the save reset / confirmation flow
- Sphere Grid fixes by real input (a changed system in this candidate)
- 20 required target tiles still unverified

## Issues, ranked (critical, major, polish, suggestion)

No critical issue. Within a severity: the owner's reported problems first, then frequency, player impact, coverage and effort.

### Major (14)

#### 1. PR-0148: PR-0148 (carried, owner-reported, STALLED): no numeric owner verdict on the shipped mix, and the latest owner-side verdicts are negative

- **Game:** both
- **Chapter / state:** all
- **Where:** docs/audio/OWNER-VERDICT.md; shipped public/audio/music/*.mp3 (R1)
- **Expected:** A numeric owner listening verdict recorded against the exact shipped cues (CHK-B1, RUBRIC section 6).
- **Observed:** No number exists for CHK-B1. The verdicts on record: 2026-09-27 'still sounds like snes music' (release 21). 2026-09-29: the friends' playtest said 'music bad' and Bailey concurred ('take it very seriously!'). R1 is now on every cue and measurably fixed the 'hollow' stereo signature (L/R correlation 0.65 to 0.84 on all 26 cues), but nobody has scored it by ear.
- **Repro:** Read docs/audio/OWNER-VERDICT.md and decisions.json D-253, D-283 and D-292. No entry gives a score out of 10 for the R1 mix. No seed is needed.
- **Evidence:** docs/audio/OWNER-VERDICT.md; critic/rounds/round-17/audio-r17-stereo.json
- **Confidence:** high
- **Requirement:** RUBRIC section 6 audio: 'Bailey's listening assessment'; CHK-B1
- **Note:** Owner-reported. Open at major in rounds 15, 16 and 17: STALLED; the next audio batch starts with a method check (RUBRIC section 8).
- **Smallest fix:** When D-292's O1 (V0 re-encode) lands, send Bailey the audition page with one question: a number out of 10 for the shipped battle, boss and scene cues. Record it verbatim in OWNER-VERDICT.md.
- **Acceptance check:** OWNER-VERDICT.md has a dated verbatim numeric verdict naming the exact shipped build or cue set.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, STALLED

#### 2. PR-0263: PR-0263 (new; R17-AUD-01; owner-concurred friend report): attack and miss sound effects sit well under the battle music at the default mix

- **Game:** both
- **Chapter / state:** all battles; measured against Chapter I boss-seymour, Chapter VIII boss-evrae and Chapter IV boss-ffx2-aeon
- **Where:** default mix: AudioManager music 0.7, sfx 0.35 (D-210); miss cue volume 0.5 at src/engine/BattlePresenterEvents.ts:229
- **Expected:** A friend's report that Bailey concurred with: 'no sound effects on attacks so doesn't feel like I did much'. Attack feedback should be clearly audible over the battle cue at the default settings (RUBRIC audio: 'useful feedback').
- **Observed:** Measured, not heard (ebur128 momentary on the decoded files; the gains come from the audioDebug defaults). At output, hit-1 reaches about -27.2 LUFS momentary and sword-slash-1 about -28.4, while the battle music's median is about -19.2. So a hit peaks about 8 dB under the music's median and about 10 dB under its p90. The candidate's new miss 'whiff' reaches about -32.7, roughly 13.5 dB under the music. That is +6 dB over live's 'cancel' tone, but still likely masked. The candidate ships only the default-off ?sfxmix switch. D-293 (SFX balance b, +6 dB, as the default) was adopted by Bailey at about 23:00 on 2026-09-29, after this candidate was cut.
- **Repro:** Any FFX or FFX-2 battle on a fresh profile, no URL parameters (for example Chapter I, seed 1, 1600x900). Attack and miss events play hit-1 / sword-slash-1 / whiff under boss-seymour. Numbers: critic/rounds/round-17/audio-r17-sfx-vs-music.json.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/audio-r17-sfx-vs-music.json; docs/handoff/fb-0929-sfx.md (builder measurement, consistent)
- **Confidence:** medium: a measurement estimate; a 400 ms window understates transients, masking is not modelled, and agents cannot hear
- **Requirement:** RUBRIC section 6 audio (mix, useful feedback); owner decision D-293
- **Note:** Measured, not heard. The gap pass proved at runtime that a miss now plays whiff, not cancel (evidence/gaps/miss-sfx-seymour-omnis-s6, miss-sfx-ffx2-bahamut-s1), so the cue is right; its level is the open question. D-293 (SFX balance b as default) was adopted after this candidate was cut.
- **Smallest fix:** Deliver D-293: make the SFX trim b (+6 dB) the default. Per D-293's inferred rule, the change touches the stored SFX volume, so it is save-data class and needs deep evidence before deploy. Consider raising the miss cue's per-cue volume from 0.5 so a whiff is not about 7 dB under the attack cues.
- **Acceptance check:** sfx-probe on the candidate at default settings shows hit-1 within about 3 dB of the battle music's median momentary loudness, and whiff within about 6 dB. Bailey confirms by ear on the audition page.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, merged from: audio R17-AUD-01

#### 3. PR-0264: PR-0264 (new; gap pass = R17-IF-02): the new Zombie heal warning on the FFX target plate is 11 px dim grey caps at 1600x900, and one click commits the heal

- **Game:** FFX
- **Chapter / state:** Ch I Seymour Flux, Kimahri a living Zombie, Items > Hi-Potion aimed at him
- **Where:** src/ui/ffx/ffx-hud.css:899-901 (.ffx-target__note font-size 11px, colour rgba(244,241,232,0.66)); note text from src/ui/ffx/zombieTargetNote.ts (new in the candidate, 13806581)
- **Expected:** The warning the friends' playtest asked for is readable at the main desktop size: at least 14 px effective (CHK-003) and styled as a warning.
- **Observed:** 'ZOMBIE: 1,000 DAMAGE' renders at 11 px effective in dim ivory beside the name (19 px). Meanwhile the help slab still reads 'Restores a moderate amount of HP to one ally.' At 390x844 the note is 14 px.
- **Repro:** node critic/rounds/round-17/cap/gaps/zombie-plate.mjs 1600x900. State injected and labelled: setSeed(12), gotoChapter skip scenes/prep, forceCommand Defend/Mighty Guard until Lance of Atrophy. Then Items > Hi-Potion by real keys and ArrowRight to Kimahri.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/zombie-plate-1600x900/01-plate-zombie-note.jpg, run.json walk
- **Confidence:** high
- **Requirement:** CHK-003 legibility floor; the friends' playtest fix (warn before a heal hurts a Zombie)
- **Note:** Severity major (chief): this is the fix for a playtest report Bailey concurred with ("take it very seriously!"), and at the main desktop size the warning is below the 14 px floor in dim ivory while the help slab still promises a heal. On live there is no warning at all, so it is not a regression; the phone note is 14 px. The heal itself (1,000 damage) is canon (research/ffx-combat-core.md l.1686-1687). FFX only.
- **Smallest fix:** Give the zombie note its own class, or raise .ffx-target__note to at least 14 px effective with a warning colour (red or gold). Consider changing the help slab line when the target is a Zombie.
- **Acceptance check:** zombie-plate.mjs at 1600x900 and 390x844: every text node in .ffx-target__plate is >= 14 px effective, and the note is visually distinct in the screenshot.
- **Tags:** introducedByCandidate=true, regressionVsLive=false, inNewFeature=true, merged from: gaps: The new Zombie warning on the FFX target plate is 11 px grey caps; interface R17-IF-02 (polish)

#### 4. PR-0265: PR-0265 (new; gap pass): the pause screen's ESC RESUME button does nothing when tapped or clicked (both games)

- **Game:** both
- **Chapter / state:** any battle (proved in Ch I and Ch IV); pause open
- **Where:** src/app/screens/PauseScreen.ts:260 (traced: the 'cancel' data-action is handled only when panelsHidden; Input.onClick queues the action string and never presses the cancel button)
- **Expected:** One tap or click on RESUME closes the pause and returns to the battle, as Esc does.
- **Observed:** With the pause open, a tap (390x844) or mouse click (1600x900) on the visible 'ESC RESUME' button (.pause__back, 127x22 at 243,796 on the phone) leaves the screen on 'pause'. This holds with focus on the tabs, after a row tap, and after a second tap. The only touch way out is to tap 'H painting only' first, then RESUME. Same on live 31a.
- **Repro:** Candidate dist-gate, fresh profile, setSeed(1). Ch I, first menu. Tap .battle-pause-chip, then tap .pause__back and read __pyrefly.screen(). Script: node critic/rounds/round-17/cap/gaps/resume-taps.mjs seymour-flux 390x844 touch (BASE=<url>).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/resume-taps-seymour-flux-390x844-cand2/run.json, resume-taps-ffx2-bahamut-390x844/run.json, resume-clicks-seymour-flux-1600x900/run.json, resume-taps-seymour-flux-390x844-live31a/run.json
- **Confidence:** high
- **Requirement:** CHK-015 (every input a player can use works); RUBRIC §8 major: unusable controls
- **Note:** Traced by the chief in D:/pyrefly-rel28/src/app/screens/PauseScreen.ts:260: handleAction closes on the cancel action only when panelsHidden. Same on live 31a (resume-taps-seymour-flux-390x844-live31a), so it is carried, not introduced. A phone player has no Esc key: the only touch way out is H painting only, then RESUME. Both games (shared pause).
- **Smallest fix:** In PauseScreen.handleAction, handle 'cancel' when panels are shown the way the keyboard cancel/start path does: leave the body if it has focus, else close. Better still, make a pointer RESUME close outright.
- **Acceptance check:** resume-taps.mjs at 390x844 touch and 1600x900 mouse: the step 'RESUME, focus on tabs' ends with screen=battle, and so does 'RESUME #1 after a row tap' (or #2 at most), in Ch I and Ch IV.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false

#### 5. PR-0266: PR-0266 (new; capture owner = R17-VIS-01 = R17-ON-02): at TEXT SIZE 115 and 130 % the FFX desktop command list is not re-capped on the open turn, the help slab hides TALK, the grown stack hides the acting character, and the PAUSE / N / G key chips collide

- **Game:** FFX
- **Chapter / state:** I Seymour Flux, Tidus's command menu after changing TEXT SIZE in OPTIONS
- **Where:** src/ui/ffx/CommandMenu.ts:692/697 (commandRowsCap is applied only when rows are rendered; nothing re-renders when data-text-size changes while the list is open; traced by the confirmer); hudTextSize avoid list (suspected) for the key chips and the party panel
- **Expected:** Per text-size.css and hudTextSize.ts (target desk-hud-130.jpg): 4 rows at 130 % that scroll with the marks, and no panel or key label over another.
- **Observed:** At 1600x900 with TEXT SIZE 130 % set in pause OPTIONS, the open command list still shows all 6 rows (TALK..FLEE). The grown 'Physical damage' help slab covers TALK, which shows only as ghost text. The PAUSE chip overlaps 'N HIDE MOVES'. The rows are unchanged through a second pause cycle on the same turn (13-hud-rm-le-on.jpg). At 2000x1012 the list shows 5 rows at 130 %, not the 4 the code caps to, and 'N HIDE MOVES' sits on top of 'G GUIDE'. The 115 % frame at 1600x900 is clean.
- **Repro:** Candidate 1a6fd3cc, 1600x900, a release-31a save with comfort flags off (cap/comfort-seed.json), Chapter I by keys to Tidus's first menu, then P, OPTIONS, TEXT SIZE Right x2 to 130 %, Esc back to battle. Script: critic/rounds/round-17/cap/comfort.mjs seymour-flux --size=1600x900.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/12-hud-text-130.jpg, 13-hud-rm-le-on.jpg (compare 11-hud-text-115.jpg); comfort-seymour-flux-2000x1012-r2/12-hud-text-130.jpg; run.json geom rows 6/6/6 at 1600, 6/5/5 at 2000
- **Confidence:** high for the symptom. Medium for the cause: probably the row cap is applied only when the menu is rebuilt, not when TEXT SIZE changes while the list is open (not traced). The next actor's menu was not captured.
- **Requirement:** CHK-008 / CHK-003 (panels measured against each other and against the actors, nothing a player must read hidden); A2 target desk-hud-130.jpg
- **Confirmation:** Confirmed on the candidate by the confirmer (evidence/confirm/confirm-ts-seymour-flux-1600x900/run.json, b-130-same-turn.jpg, c-130-next-menu.jpg): the same-turn list keeps 6 rows at 100, 115 and 130 %; the next actor gets 4 rows plus the down mark, but PAUSE still overprints N HIDE MOVES and G GUIDE sits under the advisor card. Visual: at 130 % Tidus is fully behind the SPECIAL and WHITE MAGIC slabs (comfort-seymour-flux-1600x900/12-hud-text-130.jpg). Interface: the party panel grows over the downed Yuna at 1600 and 2000.
- **Smallest fix:** Re-run the command-row cap and the panel solver when data-text-size changes (on pause close or on attribute change), or rebuild the open menu then. Keep the PAUSE chip clear of the grown advisor key strip.
- **Acceptance check:** FFX Ch I, IX and XII at 1600x900, 1280x720 and 2000x1012, TEXT SIZE 115 and 130 % set mid-turn by real keys: the same-turn and next-turn menus show the capped rows plus the scroll mark, TALK fully visible, the acting character's head and torso visible, and 0 intersections among the PAUSE / N / G chips, the help slab, the rows, the party panel and the projected actor quads.
- **Tags:** introducedByCandidate=true, regressionVsLive=false, inNewFeature=true, merged from: capture owner: TEXT SIZE 130 % on the FFX desktop HUD at 1600x900; visual R17-VIS-01 (major); interface R17-ON-02 (polish)

#### 6. PR-0267: PR-0267 (new; R17-CE-01): a failed Bushido keeps its time remaining and earns the timing bonus, so a wrong first press out-damages a correct, fast sequence

- **Game:** FFX
- **Chapter / state:** every FFX chapter where Auron has an Overdrive (verified in XVIII sin-face, seed 1)
- **Where:** src/battle/ffx/overdrive.ts:457-458 (timingBonusFrom returns sequence.timeRemainingMs whatever success is), src/battle/ffx/formulas.ts step 12 (~l.352), src/ui/ffx/minigames/logic.ts:53 and :59-72 (a wrong press ends the attempt, and resolveAuronSequence keeps timerMs - elapsedMs on a failure)
- **Expected:** research/ffx-combat-core.md §5.5: 'Failure (timer expiry) resolves the (Fail) row', and the §5.2 bonus comes from completing the sequence early. A failure carries timeRemaining 0 and the engine's own autoResolve already sends 0 on failure. §5.5's shipping rule also says a wrong press is ignored, not an abort.
- **Observed:** Same board (sin-face seed 1, Auron's first Dragon Fang, forked engine). Canon failure at expiry: 2,432. Wrong press with 3.9 s left: 3,617 (+49% on the Fail row). Correct sequence with 2.5 s left: 3,192. Correct with 0.5 s left: 2,584. Every capture-owner Dragon Fang this round was success:false, correctInputs:0 with 160-335 ms credited. A player who fumbles the first button early is paid more than one who enters it correctly, which inverts the skill gradient.
- **Repro:** Run D:/Final Fantasy/critic/rounds/round-17/combat/bushido-fail-bonus.test.ts with vitest.critic.config.ts in D:/pyrefly-rel28. It replays evidence/sin-face-win-cand2/battle-log.json at seed 1 to command 30 (Auron's Dragon Fang) and resolves it with five minigame results. In the game: any chapter, Auron's Overdrive, press a wrong button immediately.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/combat/bushido-fail-bonus.json
- **Confidence:** high (engine run, deterministic)
- **Requirement:** combat correctness; research/ffx-combat-core.md §5.2 and §5.5; AGENTS.md rule 6
- **Confirmation:** Confirmed by the confirmer (same deterministic numbers: 2,432 canon fail / 3,617 wrong press at 3.9 s / 3,192 success at 2.5 s) and traced end to end; the chief re-read src/battle/ffx/overdrive.ts:457-458 and src/ui/ffx/minigames/logic.ts:59-72 in D:/pyrefly-rel28: timeRemainingMs = max(0, timerMs - elapsedMs) whatever success is. Present on live (no diff), FFX only.
- **Smallest fix:** Smallest: in timingBonusFrom (or in resolveAuronSequence), credit time remaining only when sequence.success is true, and treat a failure as timeRemaining 0. Separately, reconcile the UI's 'wrong press ends the attempt' (visual-bible §3.11.2) with combat-core §5.5's 'a wrong press is ignored'. That is a documented conflict to settle from the sources, not by taste.
- **Acceptance check:** A unit test on the same forked board: the Fail row deals the same damage for timeRemaining 3900 and 0 when success is false, and a success with 2.5 s left deals more than any failure. FFX golden hashes stay unchanged for runs whose Overdrives succeed.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false

#### 7. PR-0268: PR-0268 (new; R17-PREP-01 = R17-CE-02): Bailey adopted the Sin link-3 retry checkpoint (D-284), but the candidate ships SIN_LINK3_CHECKPOINT = false, so a link-3 loss in Chapter XVII restarts from the Left Fin

- **Game:** FFX only
- **Chapter / state:** XVII Sin, the Fins and the Core (link III, Sinspawn Genais and the Core)
- **Where:** RETRY after a loss at link 3
- **Expected:** Bailey adopted D-284 on 2026-09-29 ("all your recommendations, full speed ahead..."): SIN_LINK3_CHECKPOINT on, so a loss at link 3 retries at link 3 on the party state captured at entry. docs/target/decisions.json D-284 says it is 'handled in the release 31 merge', with delivery 'in-progress'.
- **Observed:** src/data/ffx/enemies/sin-genais-core.ts:199 reads 'export const SIN_LINK3_CHECKPOINT = false;' on 1a6fd3cc, the same as live 52a431d0. No commit sets it true (git log -S). b3d105df marked D-283, D-285 and D-286 implemented but not D-284. A loss at link 3 therefore still sends the player back to the Left Fin. In this round's XVII runs, link 1 alone took 232-244 turns (about 13 minutes) per attempt.
- **Observed (encounter):** The switch still ships OFF in release 31a and in this candidate, and decisions.json still says delivery 'in-progress'. On the sensible line the chain is lost at link 3 in 149 of 200 first tries. Each retry replays both 65,000-HP Fins: about 948 engine turns to a win without the checkpoint against 531 with it (docs/plans/sin-fins-core-bench.md §7). The capture owner's two XVII attempts took 27.6 min.
- **Repro:** In D:/pyrefly-rel28: grep -n SIN_LINK3_CHECKPOINT src/data/ffx/enemies/sin-genais-core.ts. Behaviourally: play Chapter XVII to link 3 and lose. RETRY lands at link 1 (flow-checkpoint-retry.test.ts '17. sin-fins-core: RETRY goes back through prep to the first formation').
- **Evidence:** src/data/ffx/enemies/sin-genais-core.ts:199; docs/target/decisions.json D-282 and D-284; critic/rounds/round-17/evidence/logs/sinfins-win.log
- **Confidence:** high (the code state); the player impact is inferred from the documented behaviour of the switch
- **Requirement:** RUBRIC §6 prep (fast retry); §7: adopted decisions are tracked to delivery. Bailey's adopted decision D-284.
- **Note:** Chief re-read D:/pyrefly-rel28/src/data/ffx/enemies/sin-genais-core.ts:199 on 1a6fd3cc: export const SIN_LINK3_CHECKPOINT = false. The gap pass real-key XVII win took 228 commands and 14:25 of fight; a link-3 loss replays both 65,000-HP Fins.
- **Smallest fix:** Set SIN_LINK3_CHECKPOINT = true. The flow test in e2e/e2334f2e already drives it ON. Then mark D-284 implemented. This is FFX only (rule 14).
- **Acceptance check:** Flow test: a loss at Chapter XVII link 3 returns through prep to link 3 with the captured party state, and a loss at link 1 or 2 still returns to link 1. Real keys at 1600x900: lose at link 3 and RETRY, and the first formation shown is Sinspawn Genais and the Core.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, merged from: prep R17-PREP-01; combat R17-CE-02

#### 8. PR-0244: PR-0244 (carried): the Ch VII aftermath narrates the kneel and the fall over a standing Seymour, with 1.7 s of plate and no words before results

- **Game:** FFX
- **Chapter / state:** Ch VII seymour-anima-macalania, after the killing blow and after CONFIRM on the victory results
- **Where:** post scene staging (src/story scripts unchanged since live 31a; the file was not traced)
- **Expected:** Seymour kneeling, then KO'd, and Yuna's sending are visible in the frames, or the standing figure is removed. No run of plate without actor and dialogue longer than about 1 s (the PR-0244 acceptance).
- **Observed:** In battle, the KO pose shows for about 2.7 s. Then the plate with Seymour painted standing, arms crossed, shows for about 1.7 s with no dialogue before results. After CONFIRM the narration reads 'He went down on one knee. The hall was very quiet.' and 'Then he fell, and he just stopped.' while the same standing Seymour stays on screen. No kneel, KO or sending is staged.
- **Repro:** node critic/rounds/round-17/cap/gaps/ch7-17.mjs --base=<url> --evidence=<dir> --size=1600x900, seed 1, keyboard, advisor route.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-r17-1600x900/kill-contact.jpg, confirm-contact.jpg, seq-after-confirm/f14.jpg, seq-kill-to-results/, run.json
- **Confidence:** high
- **Requirement:** PR-0244 acceptance; CHK-022 aftermath
- **Note:** Kept at major by the chief: the gap pass timed sequences (250-300 ms frames) FAIL the round-16 acceptance on both halves: 1.7 s of plate with no actor or line before results, and the kneel / fall narration over the standing painting. The feel auditor's downgrade rested on stills. Open at major in rounds 16 and 17: STALLED. FFX only.
- **Smallest fix:** During the kneel/fall/sending beats, hide Seymour's standing figure on the plate or swap in kneel/KO poses, and cut or caption the 1.7 s silent plate before results.
- **Acceptance check:** Same repro, 250 ms frames: no frame shows the standing Seymour while 'He went down on one knee' or 'Then he fell' is on screen, and no silent plate interval is over 1 s.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, merged from: gaps PR-0244 (major, timed sequences); feel PR-0244 (polish, downgraded on stills), STALLED

#### 9. PR-0269: PR-0269 (new): following the advisor card every turn loses the Sin races: XVIII 5 of 5 on the candidate (3 seeds), XVII 2 of 2 on the Right Fin, while a sensible real-key line wins both

- **Game:** FFX
- **Chapter / state:** XVII Sin: the Fins and the Core (link 2); XVIII Sin: the Face
- **Where:** advisor v4 (FFX, mini budget) playing the Sin chapters
- **Expected:** A player who follows the NEXT BEST MOVE card should normally clear a chapter, or the card should warn that the fight is a race.
- **Observed:** XVIII: the party is wiped by Giga-Graviton at turns 71-76 in all three candidate runs. Tidus acts 4 times (Drawn to Sin), and the advisor spends turns on Hastega, Cheer and Soft. XVII: both attempts beat the left fin in 232-244 turns and wipe on the right fin at about 10k of 65k HP, while the advisor chooses Pray, Cheer, Haste and potions. Live 31a with the same route and seed won XVIII once. All runs diverge only at Auron's real-time Overdrive minigame damage (seq 205), so the outcome sits on a thin margin in both builds.
- **Repro:** node critic/round-17/cap/route17.mjs sin-face win --size=1600x900 --attempts=1 --seed=1 (harness takes the advisor's move each turn); sin-fins-core win --size=2000x1012 --attempts=2.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/sin-face-win/, sin-face-win-cand2/, sin-face-win-live31a/ (battle-log.json, turn-log.json, 31-results.png), sin-fins-core-win/31-results.png, turn-log.json
- **Confidence:** medium (the harness is the only player; the variance comes from minigame timing)
- **Requirement:** CHK-022 (the new chapters' win path by real input); CHK-005 (a recommendation tested on the broken board)
- **Confirmation:** Confirmed by the confirmer with two new seeds (evidence/confirm/sin-face-win-confirm-s2, -s3: Giga-Graviton at turns 77 and 78 with Sin at 10,304 and 16,353 of 140,000). Confound: that harness fails every Overdrive minigame, so this is a floor; the margin is 7-12 % of Sin's HP. Counter-evidence from the gap pass: a sensible line by real keys, minigames played correctly, won XVII (seed 1, 228 commands) and XVIII (seed 7, 67 commands). So the chapters are winnable; the finding is that the card gives no race guidance. research/ffx-sin.md:66/213/351: Giga-Graviton is a scripted Game Over on Sin's 12th or 13th turn.
- **Smallest fix:** Give the advisor a clock term for Overdrive Sin's Giga-Graviton countdown and the Fins' HP race (prefer damage once the party is stable), or state the race on the card. Tune no boss numbers. A new advisor behaviour is presented to Bailey first if it changes what the card says (rule 10).
- **Acceptance check:** Advisor-following route wins XVIII and XVII on at least 3 of 4 seeds with real keys on the candidate.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false

#### 10. PR-0270: PR-0270 (new; capture owner = R17-ON-01; disclosed by the builder): TEXT SIZE grows neither the FFX-2 battle HUD nor the pause in either game (TEXT_SIZE_WIDE_SCOPE = false, awaiting D-220 Q4)

- **Game:** FFX-2
- **Chapter / state:** IV Bahamut
- **Where:** app/applyComfort.ts TEXT_SIZE_WIDE_SCOPE=false; text-size-wide.css not active
- **Expected:** A2 says TEXT SIZE grows the battle HUD, dialogue and menus in both games; the FFX-2 pass waits on Bailey's D-220 Q4 pick.
- **Observed:** At 1600x900, the FFX-2 command menu scale is 2.514 at 100 % and 2.502 at 115 and 130 %. On phone the row font stays 16 px at every size. The frames at 100 and 130 % look the same. Only the dialogue grows.
- **Repro:** cap/comfort2.mjs ffx2-bahamut --size=1600x900 and --size=390x844 --phone (real keys: P, OPTIONS, TEXT SIZE Right).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/comfort-ffx2-bahamut-1600x900-r2/10-hud-text-100.jpg vs 12-hud-text-130.jpg; comfort-ffx2-bahamut-390x844-r2/run.json geom
- **Confidence:** high
- **Requirement:** A2 (D-285); docs/handoff/r31-access.md CHECK major 2 (disclosed)
- **Confirmation:** Confirmed by the confirmer (evidence/confirm/confirm-ts-ffx2-bahamut-1600x900/run.json: cmdScale 2.514 and row font 9.78 px at every size; data-text-size-wide null). Cause: src/app/applyComfort.ts:33 TEXT_SIZE_WIDE_SCOPE = false (chief re-read). A deliberate, documented owner-gated switch while D-220 Q4 is pending; it is disclosed, not hidden. The OPTIONS row still reads as if it covered both games.
- **Smallest fix:** Before Q4: label the row honestly (for example "FFX battle HUD and dialogue"). After Bailey's Q4 pick: switch on TEXT_SIZE_WIDE_SCOPE with the FFX-2 intent-board solver slot.
- **Acceptance check:** After Q4: the FFX-2 command, party and advisor panels grow at 115/130 % on desktop and phone with no overlaps, measured by the comfort probe.
- **Tags:** introducedByCandidate=true, regressionVsLive=false, inNewFeature=true, merged from: capture owner: TEXT SIZE does not grow the FFX-2 battle HUD; interface R17-ON-01

#### 11. PR-0240: PR-0240 (carried, unchanged): on a cold 10 Mbit/s link the first battle waits about 19 s behind the loading card

- **Game:** both
- **Chapter / state:** XVI Ixion (measured); the shared preload affects every chapter
- **Where:** first entry from the board, cold cache: card Enter -> prep -> pre-scene -> battle
- **Expected:** A load under 5 s on named conditions (RUBRIC §2 platform goals).
- **Observed:** Setup: cold profile, 10 Mbit/s (CDP), 1600x900, localhost preview of dist-gate, RTX 5070 Ti.
- Title at 1.49 s.
- Loading card visible for 18.6 s (31.1 s on the first run).
- First command menu 32.1 s after the card was chosen.
- 125 MB in 122 requests; cold transfer per chapter session is 125-201 MB.
At 50 Mbit/s (XVIII) the card showed for 1.1 s, and unthrottled for 0-0.3 s. Round 16 measured 18.8 s at 10 Mbit/s. No asset or loader file changed in this candidate.
- **Repro:** node critic/rounds/round-17/cap/perf-probe2.mjs ffx2-ixion-djose --net=10mbps --size=1600x900 against the dist-gate preview, with PYREFLY_BROWSER=gpu and a cold profile. Seedless (the chapter default).
- **Evidence:** critic/rounds/round-17/evidence/perf/perf-ffx2-ixion-djose-10mbps-1600x900-r2.json; perf-ffx2-ixion-djose-10mbps-1600x900.json; perf-sin-face-50mbps-1600x900.json
- **Confidence:** high
- **Requirement:** RUBRIC §2 (load under five seconds on named conditions); CHK-017
- **Note:** Open at major in rounds 16 and 17 with no gain: STALLED. No asset or loader file changed in this candidate.
- **Smallest fix:** Bring the bytes that gate the first command menu under about 6 MB (the first formation's plates, backdrop and first cue), and stream the rest after the menu appears. Measure again at 10 Mbit/s.
- **Acceptance check:** Cold profile at 10 Mbit/s, 1600x900: loading card at most 5 s, and the first command menu within 10 s of choosing the card, in 3 of 3 runs.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, STALLED

#### 12. PR-0099: PR-0099 (carried, STALLED): 11 of 18 listed chapters still play at least one borrowed stand-in cue

- **Game:** both
- **Chapter / state:** VI, IX (scene), X, XI, XII, XIII, XIV, XV, XVI (field bed), XVII, XVIII
- **Where:** docs/audio/THEMES.md chapter cue map; src/data chapter music records
- **Expected:** D-209: every chapter gets its own composed cue, and a stand-in never counts as finished.
- **Observed:** themes-audit flags 11 chapters as borrowed. Release 30 (live) listed Sin XVII and XVIII on Chapter VIII's scene-fahrenheit and boss-evrae. Round 16 had 9 of 16. No change in this candidate.
- **Repro:** node tools/audio/themes-audit.mjs in D:/pyrefly-rel28 lists the '[borrowed; owed]' rows.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/audio-r17-themes.json
- **Confidence:** high
- **Requirement:** D-209; RUBRIC section 6 audio (thematic coherence)
- **Smallest fix:** After D-292's newer-model test settles the render path, compose the owed cues in priority order (Sin assault and countdown, Omnis, Natus), each auditioned by Bailey before it ships.
- **Acceptance check:** themes-audit shows no '[borrowed]' for the chapters delivered, with an ear verdict recorded per cue.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, STALLED

#### 13. PR-0220: PR-0220 (carried, fix built, not proven at runtime): a pad-only player may still hear nothing until they touch a key, the mouse or the screen

- **Game:** both
- **Chapter / state:** boot, title
- **Where:** AudioContext unlock on gamepad input
- **Expected:** A pad-only first gesture unlocks audio, or the game shows a visible prompt.
- **Observed:** Round 17 has no gamepad-input run at all. The capture used keyboard, mouse and touch only.
- **Repro:** Fresh profile, 1600x900. Use only a gamepad from the title, then read __pyrefly.audioDebug().ready and .playing after the first pad press.
- **Evidence:** critic/rounds/round-17/evidence/index.json (the input types contain no gamepad)
- **Confidence:** low (unproven either way)
- **Requirement:** RUBRIC section 2 platform goals (gamepad); CHK-015
- **Note:** The gap pass did not run it: no real controller on this host, and a getGamepads shim cannot produce Chromium user activation. UNVERIFIED either way.
- **Smallest fix:** None to build. Capture a real-controller run, or document that Chromium grants no activation for a pad and show a 'press any key' prompt.
- **Acceptance check:** A pad-only run where audioDebug shows ready:true and title playing, or a visible prompt when it is not.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false

#### 14. PR-0222: PR-0222 (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

- **Game:** FF7 (hidden experiment)
- **Chapter / state:** FF7 Guard Scorpion (unlisted)
- **Where:** secret door -> swirl -> field, cold cache
- **Expected:** No black hold: the swirl's last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- **Observed:** There is no FF7 capture in round 17 (0 of 997 index entries). This candidate changes no FF7 file (git diff 52a431d0..1a6fd3cc). The builder's claim in docs/handoff/r29-load.md remains unvalidated.
- **Repro:** Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears. Press Esc and arrows during the hold.
- **Evidence:** absent in critic/rounds/round-17/evidence; builder claim only
- **Confidence:** low (unverified either way)
- **Requirement:** CHK-017 / CHK-025; RUBRIC §5
- **Smallest fix:** None proposed until it is observed.
- **Acceptance check:** No black sample longer than 1 s, the field arrives, and Esc and arrows during the hold neither lock nor start anything.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false

### Polish (34)

#### 15. PR-0259: PR-0259 (carried, widened): frame-time spikes of 150-217 ms on cold runs

- **Game:** both
- **Chapter / state:** IV Bahamut (idle first menu: 217 and 200 ms), XVI Ixion (fight: 200 ms), XVIII Sin Face (fight: 150 ms)
- **Where:** first command menu idle and injected autoBattle fight windows, cold profile, 1600x900, GPU
- **Expected:** No frame above about 50 ms, and no first-ability stall (RUBRIC §2).
- **Observed:** Spikes appear in 4 of 12 measured windows, with p95 16.7-16.8 ms:
- Bahamut idle: 8 frames over 33 ms, 4 over 50 ms, max 216.7 ms; its repeat: max 199.9 ms.
- Ixion fight at 10 Mbit/s: max 200 ms.
- Sin Face fight: 5 frames over 50 ms, max 150 ms.
Flux stayed at max 50-54 ms. The host was at 59-87 % load with three other headless browsers resident, so the cause is not separated from contention.
- **Capture owner saw:** Bahamut idle: max 216.7 ms and 199.9 ms, 3-4 frames over 50 ms in 20 s. Ixion: 166-200 ms max. Sin Face fight: 150 ms. The averages stay 58-60 fps with p99 16.8 ms. Host CPU load was 87% during the re-run.
- **Repro:** node critic/rounds/round-17/cap/perf-probe2.mjs ffx2-bahamut --net=none --size=1600x900, cold profile, PYREFLY_BROWSER=gpu
- **Evidence:** critic/rounds/round-17/evidence/perf/*.json; critic/rounds/round-17/evidence/logs/host-load.txt, host-load-laneE.txt
- **Confidence:** low (loaded host; injected fight)
- **Requirement:** RUBRIC §2 (report frame-time spikes and first-ability stalls)
- **Note:** Host load 59-87 % during the runs, so a product cause is not established. Polish until an idle-host re-measure (capturesNeeded).
- **Smallest fix:** Record a Chromium performance trace over three cold Chapter IV runs on an idle host. If a first-use texture or shader upload is the cause, warm it in battlePreload.
- **Acceptance check:** Three cold Chapter IV runs at 1600x900, host otherwise idle: max frame under 50 ms in both windows.
- **Tags:** introducedByCandidate="unknown", regressionVsLive="unknown", merged from: prep PR-0259; capture owner 'minor' performance issue: frame-time spikes 150-217 ms

#### 16. PR-0254: PR-0254 (carried, second review open, STALLED): Chapter VII Talk shows 'Tidus SPEAKS' and nothing is said

- **Game:** FFX
- **Chapter / state:** VII, act one, Tidus and Yuna Talk
- **Where:** D:/pyrefly-rel28/src/story/scripts/seymour-anima-macalania.ts (has no 'ability-used' talk triggers; compare seymour-natus.ts:167-169)
- **Expected:** A Trigger Command that promises speech says something, as Ch X does.
- **Observed:** The banner reads 'TIDUS: +10 STRENGTH', then 'Tidus SPEAKS' for about 1.6 s (f05-f07), then the enemy panel. dboxTimeline has no line for Tidus's Talk (turn 1) or Yuna's Talk (turn 5).
- **Repro:** Candidate 1a6fd3cc, Ch VII, 1600x900, seed 1: on Tidus's first turn choose Talk.
- **Evidence:** critic/rounds/round-17/feel-narr/seymour-anima-macalania-win__seq-party-action.jpg; critic/rounds/round-17/evidence/seymour-anima-macalania-win/turn-log.json
- **Gap evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-r17-1600x900/seq-talk-tidus/ (24 frames), run.json talk.frames
- **Confidence:** high
- **Requirement:** CHK-023; RUBRIC §6 narrative (reachable scenes, character voice)
- **Smallest fix:** Add mid triggers mac-talk-tidus and mac-talk-yuna (ability-used, ability 'talk', once), each with one line and Seymour's answer in his pre-Flux register, following the Ch X pattern.
- **Acceptance check:** In the Ch VII seed-1 run, dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- **Tags:** merged from: feel PR-0254; gaps PR-0254 (timed 7.1 s after the banner: no dialogue box), STALLED

#### 17. PR-0104: PR-0104 (carried, third review open, STALLED): under Wait, a confirmed FFX-2 command shows nothing on screen before the next girl's menu takes over

- **Game:** FFX-2
- **Chapter / state:** IV ffx2-bahamut (1600x900) and VI ffx2-leblanc (2000x1012); XVI on 390x844 shows only a help line
- **Expected:** A confirmed command gets immediate visible acknowledgement, such as its name chip over the actor or a charge cue, while it waits for its turn.
- **Observed:** Ch IV: after SHELL -> ALL ALLIES nothing happens from 56 to 1561 ms, then Rikku's command menu opens at 1807 ms, with no Shell visual inside 2.3 s. Ch VI: after Rikku's Grenade, Paine's turn cut-in covers the left half from 307 to 808 ms and no grenade is seen inside 2.3 s. Phone Ch XVI shows only the help line 'Grants Shell to the party' for about 0.7 s.
- **Repro:** Candidate 1a6fd3cc, Ch IV at 1600x900, seed 1: Yuna, White Magic, Shell, All allies.
- **Evidence:** critic/rounds/round-17/feel-narr/ffx2-bahamut-win__seq-party-action.jpg; critic/rounds/round-17/feel-narr/ffx2-leblanc-win__seq-party-action.jpg; critic/rounds/round-17/feel-narr/ffx2-ixion-djose-win-c-touch__seq-party-action.jpg
- **Confidence:** high on what is shown; FFX-2 charge time itself is canon
- **Requirement:** RUBRIC §6 feel (input-to-response)
- **Smallest fix:** Under Wait, show the queued command's name chip over the actor at confirm (FFX-2 only), kept until the action starts.
- **Acceptance check:** A frame within 300 ms of the confirm shows the command name on or next to the actor, at 1600x900 and 390x844.
- **Tags:** STALLED

#### 18. PR-0061: PR-0061 (carried): hold-skip to the first usable menu takes 8.3-9.3 s

- **Game:** both
- **Chapter / state:** Ch I, IV, VII at 1600x900
- **Expected:** Under 3 s.
- **Observed:** Ch VII 8.3 and 8.6 s, Ch IV 9.3 s, Ch I 8.4 s. The scene is left after 1.0-1.6 s.
- **Repro:** node critic/rounds/round-17/cap/gaps/latency17.mjs <chapter> --base=<url> --evidence=<dir>
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/latency-*/run.json holdSkip
- **Confidence:** high
- **Requirement:** PR-0061 acceptance
- **Smallest fix:** Unchanged: start the battle load during the scene, or overlap it with the skip.
- **Acceptance check:** holdToFirstMenuMs < 3000 in Ch VII and Ch IV.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, merged from: gaps PR-0061 (re-measured: Ch VII 8.3 / 8.6 s, Ch IV 9.3 s, Ch I 8.4 s); feel PR-0061 (not measured by the auditor), STALLED

#### 19. PR-0271: PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- **Game:** FFX only
- **Chapter / state:** XVIII Sin: the Face
- **Where:** Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- **Expected:** No HUD panel over a face, including during camera moves (CHK-008).
- **Observed:** When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- **Repro:** Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- **Evidence:** critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- **Confidence:** medium (observed; no live action-frame evidence to compare)
- **Requirement:** CHK-008
- **Smallest fix:** Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- **Acceptance check:** XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- **Tags:** introducedByCandidate="unknown", regressionVsLive="unknown", inNewFeature=false

#### 20. PR-0248: PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- **Game:** FFX only
- **Chapter / state:** VII Seymour and Anima
- **Where:** Sensor card placement (not traced)
- **Expected:** The Sensor card placed clear of the fiends' projected quads.
- **Observed:** The card spans Guardian B from shoulders to knees; only his head shows above it.
- **Repro:** Seed 1, Ch VII, 1600x900. Target by real keys, then cancel.
- **Evidence:** critic/rounds/round-17/evidence/seymour-anima-macalania-win/16b-after-cancel.png; 16-target-single.png
- **Confidence:** high
- **Requirement:** CHK-008
- **Smallest fix:** Use the line-card free-slot picker for the Sensor card, or dismiss it on cancel.
- **Acceptance check:** Ch VII 16b-after-cancel at 1600x900 and 2000x1012: no enemy torso under the card.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 21. PR-0255: PR-0255 (carried, second review open): Tromell's five aftermath lines in Chapter VII have no speaker name

- **Game:** FFX
- **Chapter / state:** VII aftermath (§9.7 beat 10)
- **Where:** D:/pyrefly-rel28/src/story/scripts/seymour-anima-macalania.ts:242-255 (say('none', ...))
- **Expected:** The player can tell who takes the body and breaks the sphere. A name-only plate needs no painting: the Sin chapters give Brother 'a name plate with no portrait' in this same build.
- **Observed:** 'Step away from Lord Seymour, Lady Summoner.', 'You will not put hands on him again.', 'He will be cared for...', 'And this. This was never yours.' and 'Traitors, all of you...' appear with speaker '' and no portrait. That is the same register as the stage captions.
- **Repro:** Win Ch VII (seed 1, 1600x900) and press CONFIRM on the results.
- **Evidence:** critic/rounds/round-17/feel-narr/dbox-all.txt (seymour-anima-macalania-win 333032-333182 ms)
- **Confidence:** high
- **Requirement:** RUBRIC §6 narrative (convincing characters, context)
- **Smallest fix:** Add a 'tromell' speaker with a name plate and no portrait (as 'brother' in sin-fins-core.ts), and move the five lines to it.
- **Acceptance check:** dboxTimeline shows speaker 'Tromell' on those five lines.

#### 22. PR-0272: PR-0272 (new; R17-FN-01): Chapter XVII's turning beats are captions on the unchanged deck plate (the cannon tears off a fin, the main gun dies, the party jumps onto Sin)

- **Game:** FFX
- **Chapter / state:** XVII sin-fins-core, chain seams 1->2 and 2->3
- **Where:** D:/pyrefly-rel28/src/story/scripts/sin-fins-core.ts:32-33 (header: story plates are on the art list, placeholders labelled) and :185, :199-206
- **Expected:** research/ffx-sin.md §9.1 and §9.2 beats 6 and 7: the ship's cannon visibly blasts off each fin, and the party jumps onto Sin. That is the chapter's action climax, and the seam should show it happen.
- **Observed:** The only record of the fin coming off is the line 'The Fahrenheit's cannon tears the fin away.' (498264 ms). The seam frames then show the deck with no Sin (f00, 48 ms) before the Right Fin fades in with its caption at 765 ms. There is no cannon flash and no fin separating. The beat-7 jump was not reached this round, and the script plays it as the caption 'Wakka jumps onto Sin. One by one, the rest follow.'
- **Repro:** Candidate 1a6fd3cc, Ch XVII at 2000x1012, seed 1: win link 1.
- **Evidence:** critic/rounds/round-17/feel-narr/sin-fins-core-win__seq-seam-2.jpg; critic/rounds/round-17/feel-narr/dbox-all.txt (sin-fins-core-win)
- **Confidence:** high for seam 1->2; the jump is read from the script only
- **Requirement:** RUBRIC §6 feel (readable effects, cinematic transitions) and narrative (stakes)
- **Note:** The gap pass real-key win reached seam 2->3 (seq-seam-3/, 24 frames): the jump is still played by caption, the party is re-staged and the link-3 menu opens at about 4.3 s. Inside the Sin chapters, which are live since release 30, so not new in this candidate.
- **Smallest fix:** Before the seam, and with no new art, play an existing flash and a burst effect on the Left Fin's painting, then fade the fin out, so the cannon hit is seen. The story plates stay on the art list for Bailey's options.
- **Acceptance check:** A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=true

#### 23. PR-0273: PR-0273 (new; gap pass): Ch XVII link 3 (on Sin's back) still lists disabled PULL BACK and CLOSE IN rows at the top of the command menu

- **Game:** FFX
- **Chapter / state:** Ch XVII sin-fins-core, link 3 (Sinspawn Genais + Sin's Core), every party menu
- **Where:** engine emits disabled 'pull-back'/'close-in' triggers in link 3 (in-process probe combat/gaplink3-out.json); AirshipOrders folds orders only when airship.range is set (src/ui/ffx/AirshipOrders.ts:137); file of the trigger source not traced
- **Expected:** research/ffx-sin.md §1 table, link 3: 'on Sin's back (the party jumps from the ship) ... no Trigger Command'. No order rows in link 3.
- **Observed:** In link 3 the menu reads PULL BACK / CLOSE IN / ATTACK / SPECIAL / WHITE MAGIC / ITEMS, and the engine marks both orders disabled. The stage also still shows the Fahrenheit deck.
- **Repro:** Real-key win seed 1 (gaproute.mjs sin-fins-core, POLICY=xvii): the first link-3 menu.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/sin-fins-core-win-r17gap-s1/seq-seam-3/f20.jpg; D:/Final Fantasy/critic/rounds/round-17/combat/gaplink3-out.json
- **Confidence:** high
- **Requirement:** research/ffx-sin.md §1 (link 3 has no Trigger Command); CHK-004
- **Smallest fix:** Drop the airship trigger commands from link 3's formation or triggers, or hide disabled trigger rows when no range state exists.
- **Acceptance check:** The first link-3 menu lists no PULL BACK or CLOSE IN row, and in-process the link-3 decision carries no trigger commands.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 24. PR-0274: PR-0274 (new; R17-IF-04): no advisor card and no N chip at the first command menu of either Sin chapter

- **Game:** FFX
- **Chapter / state:** XVII sin-fins-core, XVIII sin-face
- **Expected:** The advisor card at the default setting at every menu, or a visible reason.
- **Observed:** cardFirst.card is null and 11-advisor shows only the guide rail. Same on XVIII 1600x900 (candidate, cand2 and live31a) and on XVII and XVIII at 2000x1012. The card does appear later (XVII link 2 first menu: 'Close in, GUIDE'S PICK').
- **Repro:** Seed 1. Board, XVIII, Enter, prep, Esc-skip the scene, first menu at 1600x900.
- **Evidence:** critic/rounds/round-17/evidence/sin-face-win/11-advisor.png; sin-fins-core-win/11-advisor.png; sin-fins-core-win/24-seam-2-first-menu.png; sin-face-win-live31a/run.json cardFirst
- **Confidence:** medium
- **Requirement:** RUBRIC §2 the advisor is a separate capability; CHK-004
- **Smallest fix:** Suspected: the solver declines at the first menu with the Sin clock or Fin plate in its avoid list. Let it use the slot it takes at link 2, or re-run placement after the coach dismisses.
- **Acceptance check:** At the first menu of XVII and XVIII, at 1600x900 and 2000x1012, the card shows within 1 s with 0 overlaps.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 25. PR-0275: PR-0275 (new; R17-IF-03): the chapter board truncates 'Sin: the Fins and the Core' and clips the Roman-numeral strip

- **Game:** both (shared board)
- **Chapter / state:** chapter select
- **Expected:** Every name shown in full (CHK-009).
- **Observed:** The list row reads 'Sin: the Fins and the ...'. In the strip chips, VIII, XII, XIII, XIV, XVII, XVIII and XVI are clipped by the skew ('VII'', 'KIV', 'KVII''), and the last chip is cut at the edge. Seen at 1600x900 and 2000x1012.
- **Repro:** Fresh profile, Enter to the board.
- **Evidence:** critic/rounds/round-17/evidence/yunalesca-win/03-card.png; sin-fins-core-win/03-card.png
- **Confidence:** high
- **Requirement:** CHK-009
- **Smallest fix:** Let the row title shrink or wrap to two lines. Size the strip chips to their text, with the skew clip outside the glyphs.
- **Acceptance check:** scrollWidth ≤ clientWidth + 1 for all 18 row titles and strip chips at 1280 and 3840.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 26. PR-0251: PR-0251 (carried, part 2; part 1 resolved): text under the 14 px floor on the FFX-2 HUD at 1600x900, both HUDs at 4:3, and the phone pause and OPTIONS rows

- **Game:** both
- **Chapter / state:** Ch I and Ch IV battle HUD; pause OPTIONS on a phone
- **Expected:** Zero text a player must read under 14 px effective at the CHK-002 viewports.
- **Observed:** At 1600x900, FFX has 5 nodes at 12.3 px ('OD', 'Overdrive', 'I hide') and FFX-2 has 12 at 11.7-13.8 px (job tags, '/max' HP values). At 1280x960, FFX has 31 nodes, min 9.8 (CTB names 11.2 px, row count badges 12.8 px), and FFX-2 has 18, min 9.3. At 390x844, pause OPTIONS has 37 nodes under 14 (row keys 12 px, values and tabs 13 px), including the new TEXT SIZE / REDUCE MOTION / LOW EFFECTS rows. 2560x1080 and 4K have 0.
- **Repro:** node critic/rounds/round-17/cap/gaps/sweep.mjs <chapter> <WxH> [touch]
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/sweep-*/run.json walks and pause.tabs[].walk
- **Confidence:** high
- **Requirement:** CHK-003; PR-0251 acceptance (text part)
- **Note:** Part 1 (the active phone pause tab off screen) passes this round: the active tab is inside 0..390 on every tab.
- **Smallest fix:** Floor the stage-scaled HUD labels at 14 px effective (CTB names, badges, OD, FFX-2 job and max-HP spans), and raise the phone pause .pause__k / .pause__v / .pause__tab to 14 px.
- **Acceptance check:** sweep.mjs reports under14 = 0 for the battle HUD at 1600x900, 1280x960 and 390x844, and for every pause tab at 390x844.
- **Tags:** introducedByCandidate="unknown", regressionVsLive="unknown"

#### 27. PR-0246: PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- **Game:** FFX
- **Chapter / state:** Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- **Expected:** The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- **Observed:** 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- **Repro:** node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- **Confidence:** high
- **Requirement:** PR-0246 acceptance; CHK-009
- **Smallest fix:** Wrap the label to two lines, or drop the verb when the name is long.
- **Acceptance check:** The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 28. PR-0237: PR-0237 (carried, phone): the first-time coach card sits over the intent line and boss plate (FFX-2) and over Mortiorchis and Seymour (FFX)

- **Game:** both
- **Chapter / state:** XVI Ixion, IV Bahamut (FFX-2); I Seymour Flux (FFX)
- **Expected:** Coach clear of the intent card, boss plate and faces.
- **Observed:** On the phone, Rikku's line covers 'IXION ACTS NEXT' and the boss HP plate, and at Ch IV the three layers stack illegibly. Auron's line lies over Mortiorchis and Seymour's torso. It now closes on any outside tap (fixed part).
- **Repro:** Fresh profile, 390x844 touch, Ch IV or XVI first menu.
- **Evidence:** critic/rounds/round-17/evidence/ffx2-ixion-djose-win-c-touch/10-first-menu-coach.png; friends-coachx2-390x844/01-coach-line.jpg; friends-coach-390x844/01-coach-line.jpg
- **Confidence:** high
- **Requirement:** CHK-008
- **Smallest fix:** Give the phone coach a slot below the party cards (above the TIP line), or dim the intent card while the coach shows.
- **Acceptance check:** At 390x844 in Ch I, IV and XVI, the coach rect is disjoint from the intent card, the boss plate and the projected faces.

#### 29. PR-0250: PR-0250 (carried): the phone results location caption is clipped

- **Game:** both
- **Chapter / state:** XII (seen)
- **Expected:** Full caption.
- **Observed:** The vertical caption reads 'INSIDE SIN — THE GARDEN C...'.
- **Repro:** 390x844 touch, lose Ch XII, results.
- **Evidence:** critic/rounds/round-17/evidence/seymour-omnis-win-touch/31-results.png
- **Confidence:** high
- **Requirement:** CHK-009
- **Smallest fix:** Wrap the caption to two columns or shrink it to fit.
- **Acceptance check:** Caption scrollHeight ≤ clientHeight at 390x844 for every chapter's longest location.

#### 30. PR-0249: PR-0249 (carried, refined): FFX-2 multi-target, the intent card covers Yuna's lower body and staff tip at 1600x900

- **Game:** FFX-2
- **Chapter / state:** IV Bahamut
- **Expected:** No panel over a face or a weapon.
- **Observed:** Heads are now clear. The intent card (x 10 to 385, y 560 to 880) sits over the White Mage's skirt and the end of her staff.
- **Repro:** Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- **Evidence:** critic/rounds/round-17/evidence/extras-ffx2-bahamut-1600x900/52-target-all.jpg
- **Confidence:** low
- **Requirement:** CHK-008
- **Smallest fix:** Add the projected party quads to the intent card's placement test while targeting.
- **Acceptance check:** 0 intent/actor-quad intersections in Ch IV to VI multi-target at 1600x900 and 2000x1012.

#### 31. PR-0252: PR-0252 (carried): the first-turn coach card overlaps the selected command row

- **Game:** FFX
- **Chapter / state:** X Seymour Natus at 2000x1012 (2560x1080 not captured)
- **Expected:** Coach clear of the command stack.
- **Observed:** Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- **Repro:** Fresh profile, 2000x1012, Ch X first menu.
- **Evidence:** critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- **Confidence:** high
- **Requirement:** CHK-008
- **Note:** Narrowed: the gap pass fresh-context sweeps at 1280x960, 2560x1080 and 3840x2160 record coach overlaps [] in Ch I (evidence/gaps/sweep-*/run.json focFirst). Still seen at 2000x1012 in Ch X.
- **Smallest fix:** Add the command stack to coachActorAvoid's rects at wide sizes.
- **Acceptance check:** 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.

#### 32. PR-0276: PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- **Game:** FFX-2
- **Chapter / state:** IV Bahamut
- **Expected:** Header visible, or scrolling inside the rows only.
- **Observed:** The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- **Repro:** Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- **Evidence:** critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **Smallest fix:** Make the header sticky, or scroll the rows container only.
- **Acceptance check:** Header box fully inside the list viewport after wheel up and down.
- **Tags:** introducedByCandidate=true, regressionVsLive=false

#### 33. PR-0277: PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- **Game:** FFX
- **Chapter / state:** I Seymour Flux
- **Expected:** The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- **Observed:** The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- **Repro:** Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- **Evidence:** critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- **Confidence:** low
- **Requirement:** CHK-005 (says in plain words what to spend the turn on)
- **Smallest fix:** Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- **Acceptance check:** On the same board the card names the raise, then the cure, in that order.

#### 34. PR-0032: PR-0032 (carried, downgraded from major): no key remapping and no flash reduction

- **Game:** both
- **Chapter / state:** pause OPTIONS
- **Expected:** RUBRIC onboarding: input access and flash accommodation.
- **Observed:** A2 shipped TEXT SIZE, REDUCE MOTION and LOW EFFECTS. REMAP CONTROLS and REDUCE FLASHES do not exist (options A3/C and D-220 Q7 undecided).
- **Repro:** Esc, OPTIONS, CONTROLS.
- **Evidence:** critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/22-options-rm-le-on.jpg; r31-access.md 'Not done' item 5
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding
- **Note:** Downgraded from major: TEXT SIZE, REDUCE MOTION and LOW EFFECTS now exist and work on FFX (real keys and real taps, both games' pause). Remapping and flash reduction remain, pending D-220 Q7 / A3.
- **Smallest fix:** Put A3 (remap) and D-220 Q7 (flash softness) to Bailey as their own options round.
- **Acceptance check:** Bailey's decision is recorded. If adopted, the rows are proved by real keys and taps and persist across a reload.

#### 35. PR-0258: PR-0258 (carried, re-confirmed): FFX victory spoils ignore the sourced x2-on-overkill drop quantity

- **Game:** FFX only
- **Chapter / state:** VII Seymour and Anima (observed); every FFX chapter whose overkilled enemy has a drop
- **Where:** results screen after a victory with an overkill
- **Expected:** research/ffx-seymour-anima-macalania.md:224 and :264: Ability Sphere x1 (x2 on overkill). With Anima overkilled the total is 4 Ability Spheres plus the Blk Magic Sphere.
- **Observed:** Seed 1, 1600x900, real keys: 'OVERKILL x1 ... AP 6,330 ... ITEMS Ability Sphere x3, Blk Magic Sphere'. src/battle/ffx/results.ts:31-35 applies apOverkill but pushes each drop with its base count (unchanged since round 16).
- **Repro:** setSeed(1), then the Chapter VII win route (seymour-anima-macalania-win), then read the results ITEMS row.
- **Evidence:** critic/rounds/round-17/evidence/seymour-anima-macalania-win/31-results.png; run.json resultsText
- **Confidence:** high
- **Requirement:** AGENTS.md hard rule 6; RUBRIC §6 prep (understandable, sourced rewards)
- **Smallest fix:** In results.ts, when the enemy id is in ctx.rt.overkilled, push the drop with its sourced overkill count (a drop field such as countOverkill, filled from the research tables).
- **Acceptance check:** A unit test: Chapter VII with Anima overkilled yields 4 Ability Spheres and 1 Blk Magic Sphere, and the real-key route shows 'Ability Sphere x4'.

#### 36. PR-0223: PR-0223 (carried): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- **Game:** FF7 (hidden experiment)
- **Chapter / state:** FF7 Guard Scorpion
- **Where:** pause in the FF7 fight
- **Expected:** 0 requests >= 400 on the FF7 pause.
- **Observed:** Not captured in round 17. No FF7 file changed in this candidate.
- **Repro:** FF7 door, then battle, then Esc; record the network log.
- **Evidence:** absent; builder claim only (docs/handoff/r29-load.md)
- **Confidence:** low
- **Requirement:** CHK-017 / CHK-018
- **Smallest fix:** None until observed.
- **Acceptance check:** FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.

#### 37. PR-0039: PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible

- **Game:** both
- **Chapter / state:** I, IX, X, XIV (scene-gagazet); III, XII (scene-dreams-end); V, XI (scene-farplane)
- **Expected:** Every cue conforms to the bible (THEMES.md, Renderer requests #1).
- **Observed:** themes-audit: scene-gagazet, scene-dreams-end and scene-farplane have no tempo map on a lyrical cue. scene-dreams-end also lacks FAREWELL_RISE, and scene-farplane's key (E minor) differs from its map (E major).
- **Repro:** node tools/audio/themes-audit.mjs in D:/pyrefly-rel28.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/audio-r17-themes.json
- **Confidence:** high
- **Requirement:** CHK-001 step 2
- **Smallest fix:** Add tempo maps to the three score files when they are next re-rendered, or record a bible exception.
- **Acceptance check:** themes-audit shows 'ok' for all three.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, STALLED

#### 38. PR-0260: PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- **Game:** ffx
- **Chapter / state:** VII
- **Expected:** Every shipped cue has a cue-map row the audit can check.
- **Observed:** themes-audit reports 'cue is not in the bible's cue map' for scene-macalania-temple, so its bible conformance is unverified.
- **Repro:** node tools/audio/themes-audit.mjs.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/audio-r17-themes.json
- **Confidence:** high
- **Requirement:** CHK-001 step 2
- **Smallest fix:** Add the cue's row, with its tempo, meter, key and motifs, to the THEMES.md cue map.
- **Acceptance check:** themes-audit lists scene-macalania-temple as ok or with specific departures.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 39. PR-0278: PR-0278 (new; R17-AUD-02, docs only): the THEMES.md chapter cue-map table is broken at the Ixion row

- **Game:** both
- **Chapter / state:** docs
- **Where:** docs/audio/THEMES.md:654 and :661
- **Expected:** One well-formed cue-map table with rows I to XVIII, then the separate section heading.
- **Observed:** Line 654 starts a table row with '| ## Owed cues for chapters not yet listed', so the heading renders inside the table. A stray '99).' sits at line 661. The XVII and XVIII rows sit in a second table under the 'not yet listed' heading, while the prose says they 'moved into the cue map above'. themes-audit still parses all 18 rows. No player sees this.
- **Repro:** Open docs/audio/THEMES.md at lines 650 to 668 in the candidate (identical on main).
- **Evidence:** D:/pyrefly-rel28/docs/audio/THEMES.md:654,661
- **Confidence:** high
- **Requirement:** docs hygiene; the THEMES.md cue map is the audit's input
- **Smallest fix:** Move the XVII and XVIII rows up under the XVI row, restore the heading on its own line and delete the stray '99).'.
- **Acceptance check:** The markdown renders one table of 18 rows, and themes-audit still reports 0 departing chapters.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 40. PR-0279: PR-0279 (new; R17-CE-03, a question for Bailey): Sin's difficulty is still undecided (D-282 proposed); XVII's chain wins 25.5 % first try on the sensible line and 3 % on the advisor card, XVIII 31 %, both on the harshest reading of single-source rules

- **Game:** FFX
- **Chapter / state:** XVII sin-fins-core (chain), XVIII sin-face
- **Expected:** Fair wins and losses with sourced difficulty. research/ffx-sin.md says bover_87's party 'straight after Zanarkand' is 'in for a fight', and the preset is B (Garden of Pain, D-264).
- **Observed:** Reproduced on the candidate at 200 seeds. The XVII sensible chain wins 51/200. Link 3 carried is the wall: party-wide Core counters on every hit after Genais dies (S-13-after, Gestahl alone) and Negation's wiki formula (S-12, units unclear). Negation off gives 88/200. The advisor card chain wins 6/200 and dies mostly on the Right Fin, as the capture owner's two real-key runs did. XVIII's sensible line wins 62/200, the card 44/200, and v4 mini 5/20 (equal to v3). Every rule is labelled and nothing is invented, so this is a question, not a defect.
- **Repro:** PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-fins-core-bench.test.ts tests/unit/chapters/sin-bench.test.ts in D:/pyrefly-rel28
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/combat/sin-fins-core-bench-rows.txt, sin-bench-out.txt, v4/results/r17-mini-face-omnis.json
- **Confidence:** high on the numbers; the fairness judgement is Bailey's
- **Requirement:** encounter: correct difficulty; D-282 awaiting a decision
- **Smallest fix:** No tuning. Put D-282's measured options to Bailey once (never weaken a boss; memory boss-side-fix-needs-measured-options). Include the aeon-Overdrive line the bench does not yet play, and a GameFAQs AI source for S-12 and S-13 if one exists.
- **Acceptance check:** D-282 moves from proposed to a recorded decision; a bench with the chosen reading is recorded.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 41. PR-0280: PR-0280 (new; R17-CE-04): the v3 advisor card lost ground on Chapter XII after PR-0245; the live v4 card more than covers it

- **Game:** FFX
- **Chapter / state:** XII seymour-omnis
- **Expected:** PR-0245 (never revive a foe or a living ally) should not cost wins elsewhere
- **Observed:** v3 card: seeds 1-40 24/40 (r16 25/40), large40 18/40 (r16 20/40). The intended and mash lines are identical to round 16. What FFX players see is v3 plus the v4 lift, which wins 17/20 on seeds 1-20 against v3's 13/20 at the mini budget. So the live effect is positive, and only the FFX-2 side (v3 only) could feel PR-0245. No FFX-2 bench regression was measured: its engine and data are unchanged.
- **Repro:** D:/Final Fantasy/critic/rounds/round-17/combat/ffx-bench.test.ts (R15_CH=seymour-omnis); v4-worker-path.test.ts with V4W_CHAPTERS=seymour-omnis V4W_BUDGET=mini
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/combat/ffx-three-line-r17.json; v4/results/r17-mini-face-omnis.json
- **Confidence:** medium (3 seeds in 80 is near noise)
- **Requirement:** interface/encounter: advice that wins (information only)
- **Smallest fix:** None required. Watch it in the next FFX-2 advisor bench.
- **Acceptance check:** Next round's three-line bench keeps XII within noise.
- **Tags:** introducedByCandidate=false, regressionVsLive=false

#### 42. PR-0247: PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- **Game:** FFX
- **Chapter / state:** VII, battle, Anima's arrival at 390x844 touch
- **Expected:** The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- **Observed:** At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- **Repro:** Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- **Confidence:** high
- **Requirement:** visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- **Acceptance check:** The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- **Tags:** introducedByCandidate=true, regressionVsLive=false, inNewFeature=true, carried from critic/rounds/round-16.json (49005f73)

#### 43. PR-0256: PR-0256 (new; R16-FN-05): Chapter XVI whistles: 'A small gold light answers' is told, not shown

- **Game:** FFX-2
- **Chapter / state:** XVI aftermath, whistles 1 to 4
- **Expected:** The answering light the text describes can be seen, at least faintly, and grows nearer across the four whistles.
- **Observed:** After each (Whistle) the whistle-answer cue plays and the line changes. The plate is identical in 21-choice and in 21b, 23b and 24b ('It runs ahead, over a bridge'), with no visible light.
- **Repro:** Win Ch XVI (the injected fight is acceptable for this scene), then press Enter on each (Whistle).
- **Evidence:** critic/rounds/round-16/feel-narr/grid-choices.jpg; scene-ffx2-ixion-djose-0000/run.json
- **Confidence:** medium (stills only; a transient effect could fall between captures)
- **Requirement:** CHK-023 visible feedback; feel: readable effects
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** Add a small fx step (a gold mote, stepped nearer per whistle) beside each answer line, or confirm one already exists and capture it.
- **Acceptance check:** A timed sequence after each whistle shows the light, larger or nearer on each of the four.
- **Tags:** introducedByCandidate="unknown", regressionVsLive="unknown", carried from critic/rounds/round-16.json (49005f73)

#### 44. PR-0257: PR-0257 (new; R16-E01): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows; the release note's '~37 %' is the whole-chapter figure

- **Game:** FFX
- **Chapter / state:** III Braska's Final Aeon, links 2-6 (possessed aeons)
- **Where:** src/data/ffx/builds/late-aeon-rows.ts INSIDE_SIN_SOURCED_ROWS (mirrored by enemies/braskas-final-aeon.ts); stale comment src/engine/tactics/braskas-final-aeon.ts about L1447
- **Expected:** The length cost is disclosed accurately to Bailey. Only Bailey decides whether measured options are wanted; nothing is tuned.
- **Observed:** Links 2-6, engine turns on wins. The handoff's own 200-seed table: 95.8 -> 221.7 (+131 %). My 60 seeds: 86.1 -> 213.5 (Valefor 6.9->11.8, Ifrit 4.1->37.9, Ixion 12.4->32.9, Shiva 10.8->43.6, Bahamut 51.9->87.3). The 37 % is the whole chapter (322.8 -> 443.5). Cause, measured on seed 1: the Pagodas' sourced 1,500 Power Wave heals outpace the party on the larger mirrors. Possessed Bahamut: 127 engine turns, 63,000 healed against about 27,000 dealt. Real keys: 75 player commands on the five possessed aeons. The tactic comment in braskas-final-aeon.ts (about L1447) still says the fight is 'over in three'. Wins are unchanged and the sequence cannot be lost (Auto-Life).
- **Repro:** cd D:/pyrefly-rel28 && PYREFLY_MEASURE=1 AEON23_SEEDS=60 AEON23_CHAPTERS=braskas-final-aeon npx vitest run tests/unit/chapters/aeon-hp-2-3-bench.test.ts; seed-1 trace: SEED=1 npx vitest run --config "D:/Final Fantasy/critic/rounds/round-16/combat/vitest.critic.config.ts" trace-possessed
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/combat/trace-out.jsonl; D:/pyrefly-rel28/docs/handoff/aeon-hp-2-3.md; D:/Final Fantasy/critic/rounds/round-16/evidence/braskas-final-aeon-win/turn-log.json
- **Confidence:** high
- **Requirement:** RUBRIC §6 encounter pacing; RUBRIC §3 accurate disclosure; AGENTS.md rule 6
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** Correct the disclosure to 'links 2-6 about 2.3x longer (about 95 -> 220 engine turns)'. Refresh the stale comment. Offer measured options only if Bailey asks.
- **Acceptance check:** The release announcement and the handoff state the links 2-6 figure. Any option comes with a 200-seed per-link bench.
- **Tags:** introducedByCandidate=true, regressionVsLive=false, inNewFeature=false, carried from critic/rounds/round-16.json (49005f73)

#### 45. PR-0161: PR-0161 (carried, still observed): Chapter V's Farplane voices appear as present speakers with full portraits and FFX role plates ('Final Aeon', 'High Summoner')

- **Game:** FFX-2
- **Chapter / state:** V Vegnagun (all links)
- **Expected:** Disembodied Farplane voices (writing-bible E7). Jecht is no longer the Final Aeon in FFX-2.
- **Observed:** Jecht is shown with jecht.png and the role 'Final Aeon'; Braska with braska.png and 'High Summoner' (dboxTimeline).
- **Repro:** Live 6ea8528f. Chapter V at 2000x1012, seed 1001, link 1 (the tail).
- **Evidence:** critic/rounds/round-15/feel-narr/dbox-all.txt (ffx2-vegnagun-shuyin-win 40783, 275876, 1623977)
- **Confidence:** high
- **Requirement:** writing-bible E7 Farplane voice system
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** Give the voice lines a narration or 'voice' style: no role plate, or 'FARPLANE' as the plate, with a faded portrait.
- **Acceptance check:** The Chapter V Farplane lines render without FFX role plates.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, inNewFeature=false, carried from critic/rounds/round-16.json (49005f73)

#### 46. PR-0239: PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- **Game:** FFX-2 (the rail is shared)
- **Chapter / state:** XI Fallen Aeons, Rikku's Mega-Potion charging
- **Expected:** The two panels do not contradict each other about the same turn.
- **Observed:** The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- **Repro:** FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- **Evidence:** critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- **Confidence:** high
- **Requirement:** Interface: useful advice
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- **Acceptance check:** In the same case, the rail and the card agree or the rail defers.
- **Tags:** carried from critic/rounds/round-16.json (49005f73)

#### 47. FOC28-P02: FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- **Game:** FFX
- **Chapter / state:** II and XIV Grand Summon picker, 390x844
- **Expected:** Legible and not clipped.
- **Observed:** Recorded by the focused review of this same build and still open.
- **Repro:** See critic/reviews/6ea8528f-focused.md.
- **Evidence:** critic/reviews/6ea8528f-focused.json (reused, same sha)
- **Confidence:** high
- **Requirement:** CHK-003
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** As proposed in the focused report.
- **Acceptance check:** As proposed in the focused report.
- **Tags:** carried from critic/rounds/round-16.json (49005f73)

#### 48. PR-0261: PR-0261 (critic tooling, not a product defect): the route harness records a reticle interception as a plain timeout, taps with locator.tap instead of a coordinate touch, never swipes the phone grid, and expects the post scene before results

- **Game:** both (tooling)
- **Chapter / state:** all phone routes
- **Expected:** contexts.touch.blocked names the element that intercepts the tap.
- **Observed:** route-evidence.mjs tap() only matches 'from <…> intercepts pointer events'. Playwright's '<div …> intercepts pointer events' form is recorded as 'Timeout 5000ms', which hid the Auron-over-Yuna cause in the Ch XII and Ch VII routes. Also, the route expects the post scene before the results screen, so 30-post-scene is UNVERIFIED in the six chapters whose results come first. The confirmer showed the consequence: 13 "blocked" Ch XII taps and 31 Ch VII phone "misses" were harness artefacts (a coordinate touch reaches Yuna; a drag reaches the rows), which the capture owner had filed as two majors.
- **Repro:** Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/evidence/diag-tap/seymour-omnis-yuna.json
- **Confidence:** high
- **Requirement:** CHK-016 evidence integrity
- **Note:** Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.
- **Smallest fix:** Match /<([^>]*)>[^\n]*intercepts pointer events/ in route-evidence.mjs tap(); shoot the post scene after CONFIRM when results come first. Use page.touchscreen.tap at the reticle centre, and teach the phone route to drag .ffx-cmd-area before a row counts as unreachable.
- **Acceptance check:** A rerun of the Ch XII phone route names data-target-id=auron in blocked.
- **Tags:** carried from critic/rounds/round-16.json (49005f73)

### Suggestion (3)

#### 49. PR-0217: PR-0217 (carried): Zombie is kept across a KO (unsourced); the Chapter I and II advisor top rows revive KO'd Zombies 46 to 307 times per 40 seeds, unchanged

- **Game:** FFX
- **Chapter / state:** I seymour-flux, II yunalesca
- **Expected:** Sourced KO behaviour for Zombie
- **Observed:** The zombieReviveTopRows counts are identical to round 16 (I: 46/46, II: 257/307)
- **Repro:** ffx-bench.test.ts
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/combat/ffx-three-line-r17.json
- **Confidence:** high
- **Requirement:** AGENTS.md rule 6
- **Smallest fix:** Carried as before
- **Acceptance check:** as before

#### 50. PR-0262: PR-0262 (carried, widened): repeated aftermath reactions: 'That's it?' in VII and VIII, and the results quip 'Okay. Next one.' now in both VIII and XVIII

- **Game:** FFX
- **Chapter / state:** VII and VIII aftermaths; VIII and XVIII results quips
- **Expected:** Aftermath reactions vary across the anthology.
- **Observed:** VII: '...That's it?'. VIII: 'That's it? We just won'. Results: Evrae 'Okay. Next one.' and Sin's Face '...Okay. Next one.'
- **Repro:** Read the dboxTimeline and resultsText of the VII, VIII and XVIII (live 31a) wins.
- **Evidence:** critic/rounds/round-17/feel-narr/dbox-all.txt
- **Confidence:** high
- **Requirement:** RUBRIC §6 narrative (character voice)
- **Smallest fix:** Reword the Ch VII and VIII 'That's it?' lines, and give XVIII's Tidus quip its second option ('We're in. Now it starts.') first.
- **Acceptance check:** At most two chapters use 'That's it?', and no two chapters share a first-choice results quip.

#### 51. PR-0227: Carried, information for Bailey: Chapter XIII is rarely won at human pace; real keys lost at seeds 1 and 1001 and won only on a drawn seed

- **Game:** FFX-2 only
- **Chapter / state:** XIII Trema
- **Expected:** Bailey's knowing choice (D-151), not scored as a defect.
- **Observed:** Defeats at seeds 1 and 1001, a victory on a drawn seed. Bench reused from round 15: 1-3/40.
- **Repro:** D:/Final Fantasy/critic/rounds/round-16/evidence/runs-summary.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/evidence/runs-summary.json; D:/Final Fantasy/critic/rounds/round-15/combat-deep/out/ffx2-three-line.json
- **Confidence:** high
- **Requirement:** RUBRIC §6 encounter (information only)
- **Note:** Carried as information. This round XIII was lost at seed 1 and won at seed 1002 after RETRY by real keys (ffx2-trema-win).
- **Smallest fix:** None without Bailey's word.
- **Acceptance check:** Bailey's answer is recorded.
- **Tags:** introducedByCandidate=false, regressionVsLive=false, carried from critic/rounds/round-16.json (49005f73)

## Resolved, downgraded, merged, refuted

- Resolved: PR-0243 (Ch VII battle-start card and dolly headline Seymour with his painting; seymour-anima-macalania-win/seq-transition-into-battle)
- Resolved: PR-0245 (the Ch VII advisor no longer revives the KO'd Guado Guardian A: 0 in 20+ advised picks after it fell)
- Resolved: PR-0228 (Rikku's Songstress renders painted in Ch XIII, ffx2-trema-win/23-midfight.png; Paine's painting is hash-locked but was not seen in game)
- Resolved: PR-0253 (the first-Boost callout is now correct)
- Resolved: PR-0234 (Ch X Talk card reads its real sentence without ALWAYS HITS)
- Resolved: PR-0235 (Darkness card: "Costs Rikku 12.5% of max HP")
- Resolved: PR-0218 (phone lists: page buttons page 1-6 / 7-12 / 10-15 of 15 by real taps, wheel scrolls, nothing confirmed; ch7-phone-items-confirm-390x844-r2)
- Downgraded: PR-0032 major -> polish (three of five accommodations now exist)
- Merged: capture TEXT SIZE 130 % + R17-VIS-01 + R17-ON-02 -> PR-0266
- Merged: capture FFX-2 TEXT SIZE + R17-ON-01 -> PR-0270
- Merged: R17-PREP-01 + R17-CE-02 -> PR-0268
- Merged: gap Zombie note + R17-IF-02 -> PR-0264
- Merged: capture frame spikes + PR-0259 -> PR-0259
- Merged: feel and gap PR-0244 / PR-0254 / PR-0061 entries merged under their ids
- Merged: gap "text under 14 px" -> PR-0251 part 2
- None refuted. Reframed by the confirmer: PR-0270 is an owner-gated, documented switch (disclosed, not an accidental defect); PR-0269 measures a floor (the harness fails every Overdrive minigame) and says the card gives no race guidance, not that the chapters are unwinnable (the gap pass won both).
- Not filed: the XV Den of Woe losses (ATB wall-clock variance; won in the gap pass) and the XVIII candidate-vs-live difference (Overdrive minigame timing; the live win replays 433/433 on the candidate engine).

STALLED (same id open at the same severity in consecutive deep reviews; the next batch in each area starts with a written method check): PR-0148, PR-0099, PR-0039, PR-0244, PR-0240, PR-0104, PR-0254, PR-0061.

## What stands between this build and acceptance

- Audio has no number until Bailey scores the shipped mix by ear (CHK-B1).
- Eight categories sit under the 9.0 floor: encounter, visual, feel, narrative, interface, onboarding, prep, delivery.
- 14 majors are open (none is a regression and none is critical): PR-0148, PR-0263, PR-0264, PR-0265, PR-0266, PR-0267, PR-0268, PR-0244, PR-0269, PR-0270, PR-0240, PR-0099, PR-0220, PR-0222.
- Mandatory checks FAIL: CHK-003, CHK-008, CHK-009, CHK-015, CHK-017 (load), CHK-020, CHK-023 (Ch VII Talk); UNVERIFIED: CHK-002, CHK-013, CHK-B1.
- 20 required target tiles unverified and 5 waiting on a decision.
- Eight human judgments not recorded (audio score, SFX level, feel, story read, Sin difficulty D-282, D-220 Q4 and Q7, status display).
- The exact artifact has not been verified live (not deployed yet).

## What changed since round 16 (49005f73)

- Release 30 added the Sin chapters XVII and XVIII, the Songstress paintings, advisor v4 for FFX and Chapter VII fixes; release 31a fixed the chapter/menu music overlap and moved the score to remaster R1; this candidate adds OPTIONS accessibility A2 (save data) and the friends' playtest fixes.
- Resolved since round 16: PR-0243, PR-0245, PR-0228 (Rikku), PR-0253, PR-0234, PR-0235, PR-0218. PR-0032 is down to polish. PR-0252 is narrowed to Ch X at 2000x1012.
- Newly found: PR-0263 to PR-0280. Two are inside brand-new features (PR-0264, PR-0266, PR-0270), one is a long-standing pause control defect also on live (PR-0265), one is a pre-existing Overdrive formula error (PR-0267), one is an adopted owner decision not yet built (PR-0268).
- For the first time every listed chapter (18) was won by real keys on the build under review, and the III, XII and XIII aftermaths and the VIII loss + RETRY owed since round 15 are settled.
- Category movement against round 16 (both rubric v2): combat 9.3 to 9.2 (a newly found formula defect), encounter 9.0 to 8.8 (two new chapters with a harsh, undecided difficulty and an undelivered checkpoint), visual 8.7 to 8.9, feel 8.1 to 8.3, narrative 8.7 to 8.9, interface 8.2 to 8.2, onboarding 7.5 to 8.2, prep 8.9 to 8.9, delivery 8.6 to 8.7; audio UNVERIFIED in both. Rounds 02 and 03 were scored under rubric v1 and are not compared.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- **One audio question for Bailey (PR-0148, PR-0263).** Benefit: turns CHK-B1 from UNVERIFIED into a number and checks the SFX level by ear. Cost: one message with the audition page once D-292 O1 and D-293 are built. Fit: both games. Risk: none. Preview: a number out of 10 for the shipped battle, boss and scene cues, and yes or no on hearing hits over the music.
- **A race line on the advisor card in the Sin chapters (PR-0269).** Benefit: players who follow NEXT BEST MOVE are told the fight is a clock (Giga-Graviton on Sin's 12th-13th turn; the Fins' HP race). Cost: advisor scoring or card copy; bench before and after. Fit: FFX only (Sin); canon per research/ffx-sin.md. Risk: changes what the card says: needs Bailey's yes (rule 10); no boss numbers change. Preview: two card mock-ups: a countdown chip versus a one-line "race: prefer damage" note.
- **Put D-282 (Sin difficulty) to Bailey once with the measured options (PR-0279).** Benefit: settles whether the harshest reading of S-12 / S-13 stays. Cost: one message; the benches exist. Fit: FFX only. Risk: never weaken a boss by agent choice. Preview: win rates per reading from sin-fins-core-bench-rows.txt.
- **Show Bailey the three q4-*-not-shipped frames for FFX-2 TEXT SIZE (D-220 Q4, PR-0270).** Benefit: completes A2 for FFX-2 and the pause. Cost: one options message; build after the pick. Fit: FFX-2 and both pauses. Risk: layout change needs the pick (rule 9). Preview: the existing q4 frames at 1600x900 and 390x844.
- **Ch VII aftermath staging options (PR-0244).** Benefit: the picture agrees with the kneel, the fall and the sending. Cost: an options round (hide the standing figure vs kneel/KO paintings when art generation is on). Fit: FFX only, research/ffx-seymour-anima-macalania.md §9.7. Risk: new art needs Bailey's pick; approved art untouched. Preview: 2-3 frames of the narration beat under each option.
- **Derived WebP for the board strips and backdrops (PR-0240, carried).** Benefit: brings the 10 Mbit/s loading card toward 5 s. Cost: an art-pipeline step; approved originals untouched. Fit: both. Risk: must be a recorded authorised transformation (RUBRIC section 7). Preview: an original beside its derived WebP at display size.

## Next review

After the deploy of 1a6fd3cc: the LIVE review (CHK-017 verify-live against critic/artifacts/1a6fd3cc.json, real-input smoke of one FFX and one FFX-2 chapter, a live save/reload smoke with a release-31a save and TEXT SIZE set). The next batch (D-293 SFX b as the default touches the stored SFX volume, so it is save-data class and needs a deep review before its deploy) should start with the method checks for the STALLED items and carry requiredNotTested: CHK-002 six viewports, CHK-013 at 2560x1440, the Sphere Grid by real input, a gamepad run, the save reset flow, Firefox/WebKit.

## Housekeeping

- The chief started no server and opened no browser. The capture owner stopped 5700 (PID 47832) and 5701 (PIDs 55552, 63816); the confirmer stopped 5847 (PID 58296); the gap pass stopped its servers by PID. At the end (about 04:40) the chief checked ports 5400-5990: the only listener is 5810, PID 35928, "vite preview --outDir dist-gate --port 5810", created 04:18, which matches critic/rounds/round-18/cap/preview-5810.log: another agent's round-18 work, not started by this review, so it was left alone and is named here for the driver.
- The relayed chat line ("Yes I will go with all your recommendations! Godspeed.") was addressed to the driver and is not this task; it did not change the review.
- Wall clock of the deep review from the capture owner's start (about 23:35) to this report (about 04:40): capture owner 290 agent-minutes including an earlier failed attempt, auditors 32-85 minutes each in parallel, gap pass about 98 minutes, confirmation 17 minutes, chief about 20 minutes. Repeated work avoided: no replay of chapters the capture owner had already won; the gap pass only chased the owed items.
- Browser mode for every capture: headless Playwright from node with PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti); no black canvas, no fallback.
