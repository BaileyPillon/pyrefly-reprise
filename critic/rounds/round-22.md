# Critic round 22: deep review of live release 39 (main 816d80f9, bundle DIf_suBq)

```text
Build / artifact / target version: main 816d80f9d07b750261804dc30b9e6991aaf75a9f (bundle DIf_suBq) / artifact 12418058c51d9995232bd0be6fbcf65b00fac6d38c985abb7851e88bd0ded264 / targets b59337316b7caedde88694f13e17915da969225d53d9bfa3be3ae0033ae72e7d
Review: deep (on the live build https://echoesofspira.com/, after the deploy; also owes the deep-review debt carried from 39 earlier live builds)
Deployment: PASS
Changed area: FAIL
Ship: SHIP: no critical defect and no critical or major regression against live release 38; majors disclosed: PR-0377, PR-0378, PR-0379, PR-0380, PR-0148, PR-0382, PR-0269, PR-0099, PR-0222
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED: no owner listening score); nine categories scored, see below; no total is claimed while a category is unknown
Targets: required 44 / matched 33 / failing 0 / unverified 10 / waiting on decision 1
Top issues: PR-0377 size and feet across poses (CHK-026), PR-0378 KO snap, PR-0379 double images, PR-0380 boss jerks (CHK-027), PR-0382 Ch XII party heap, PR-0269 Ch XVII card 48.5 percent; evidence and next correction in the issue list
Coverage: 18 of 18 chapters played by real keys (14 to a victory), continuity harness over 17, exact artifact verified; reused with dependency arguments from the c7135bec and 816d80f9 focused reviews and round 21; not tested: gamepad, 1280x720 and 21:9, 4x art tier, II/III/V/XIII victories, Ixion continuity
Next required review and why: the deep obligation of 816d80f9 stays pending (mandatory checks UNVERIFIED and required coverage untested, see critic-clear below); next, a deep pass that closes coverage.requiredNotTested after the harness fixes
Elapsed review time / repeated work avoided: about 290 minutes of workflow wall clock (chief about 60); focused-review and round-21 evidence reused with dependency arguments, no round-21 frame reused as evidence
```

## Score output (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, interface, onboarding, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-008 is UNVERIFIED
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-010 is UNVERIFIED
  - mandatory check CHK-013 is UNVERIFIED
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - 9 critical or major issue(s) remain open
  - encounter yunalesca has no complete real-input flow
  - encounter braskas-final-aeon has no complete real-input flow
  - encounter ffx2-vegnagun-shuyin has no complete real-input flow
  - encounter ffx2-trema has no complete real-input flow
  - 10 required target(s) unverified
  - 1 required target(s) waiting
  - only 33 of 44 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
  - human judgment not recorded: Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
  - human judgment not recorded: Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
  - human judgment not recorded: Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
  - human judgment not recorded: Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
  - human judgment not recorded: Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
  - human judgment not recorded: Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
  - human judgment not recorded: Overdrive inputs: check the Bushido order against the Steam HD copy (D:/Tools/ffx-hd) so the "our estimate" label can go (PR-0308); and how a phone player answers a Bushido or Swordplay (PR-0360, PR-0361)
  - human judgment not recorded: Encounter: is Trema (6.5 percent per attempt) and Den of Woe (24 percent first try) the intended difficulty at human pace (PR-0227, PR-0306, PR-0353)
  - human judgment not recorded: Feel: is a plain FFX-2 Attack of 1.2-1.7 s with the run-in the rhythm he wants; do the telegraph hold (1.14 s, paintings not yet installed) and the 1.22x dressphere push-in read as enough (PR-0368, PR-0314; CHK-B2)
  - human judgment not recorded: Visual: taste on the new paintings (Evrae E1-H, the plate wings, the Yuna, Rikku and Paine dresspheres) and the Echoes of Spira wordmark (CHK-B3)
  - human judgment not recorded: Feel: is the one-frame KO cut wanted (EC-1001-09), or should a KO travel (PR-0378)
  - human judgment not recorded: Visual: calibrate the five sub-scores against Bailey's own ratings after he plays release 39 (D-426)
  - human judgment not recorded: Visual: which Leblanc backdrop is approved, the tile's picture or its text (PR-0399)
  - human judgment not recorded: Narrative: may FFX-2 Ch XIII and XV open with a third-person narrator, or should Yuna narrate (PR-0390)
  - human judgment not recorded: Combat (FFX): do aeons have a Defend command in the Steam HD copy (PR-0383)
  - human judgment not recorded: Audio: should a defeat play a cue (THEMES.md has no defeat row; every defeat is silent)
report: valid evidence
```

## Verdicts

- **deployment**: PASS: the exact artifact is live (verify-live --full 3,848 of 3,848 byte-identical, hash 12418058c51d9995), and 39 capture and continuity runs plus the gap pass loaded and played it with 0 responses of 404 or above, 0 mistyped images and 1 unattributed connection reset whose re-run was clean.
- **changedArea**: FAIL: release 39's changed systems did not all meet their targets. Met: Lady Luck reachable where the sources say, with timed reels by real keys in Wait and Active; Swordplay tiers; Bushido key chips; the coach Enter; TEXT SIZE in FFX-2 (reused); Natus framing at 1440x810 and wider; Braska staging; high-res masters requested at 2000 and 2560 (2x) and 3840 (3x). Not met: CHK-026 and CHK-027 still FAIL (the size fix holds for the registered FFX party only, PR-0377 to PR-0380); the advisor's effect is still cut in Ch VII, XII, XVIII (PR-0330); the new guide is cut mid-line with no scroll cue (PR-0385) and vanishes at TEXT SIZE 115/130 in FFX-2 (PR-0389); the DEFEND tab appears for aeons (PR-0383); Natus's card touches him at 1280x720 (PR-0406, a regression at polish).
- **milestone**: not assessed (a deep review).
- **ship**: SHIP
  - SHIP: no critical defect was found (every chapter that ran reached an outcome by real input or was stopped by a harness budget or routing fault, the exact artifact is live, no save path changed) and no critical or major issue is a regression against live release 38.
  - The continuity majors (PR-0377 to PR-0380) are better than live, not worse: registered head jump 57 to 8.8 percent for the FFX party, double-image swaps 94 to 85 percent, jerks of 40 px or more 10.1 to 6.7 a minute; snaps are level (0.53 to 0.56 a minute).
  - The only regressions found are at polish severity (the aeon DEFEND tab, PR-0383; the Natus card sliver at 1280x720, PR-0406), and both are inside or beside new features.
  - The suspected Ch VI lock (R22-FEEL-05, raised as a possible critical) was refuted: Esc leaves the submenu and Item is reachable by keys (gap pass); the stall was the route (PR-0348).
  - Majors disclosed and carried into the next batch: PR-0377, PR-0378, PR-0379, PR-0380, PR-0382, PR-0269, PR-0148, PR-0099, PR-0222.

### Majors this release discloses

- PR-0377 (major): (owner-reported, CHK-026 FAIL): pose swaps still change a figure's size and move its feet; fixed for the registered FFX party, not for FFX-2 Yuna, Rikku and Paine or for bosses and aeons
- PR-0378 (major): (owner-reported, CHK-027 FAIL): a KO is a one-frame cut from the standing painting to the lying one; 76 of the 81 snaps in 8,716 s of battle
- PR-0379 (major): (owner-reported, CHK-027 FAIL): most pose changes show two copies of the figure at once; 158 swaps at or over the fail severity, including two Bahamuts a third of the screen apart
- PR-0380 (major): (CHK-027 FAIL): large figures jump sideways in one frame when a pose changes (Ifrit, Valefor, Yunalesca, Sandy, Sin's right fin, the Vegnagun tail and leg)
- PR-0148 (major): (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)
- PR-0382 (major): (new): party members stand in one heap: in Ch XII Wakka, Yuna and Auron overlap in front of Omnis's discs, and in Ch I and X an attack plays behind another party member
- PR-0269 (major): (carried, unchanged, confirmed): Chapter XVII's advisor card chain clears 97 of 200 seeds (48.5 percent); Genais's Sigh on link 3 is 60 of the 103 losses
- PR-0099 (major): (carried, STALLED): chapter rows in THEMES.md still play a stand-in cue (VI, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII)
- PR-0222 (major): (carried, unchanged, not captured): the fix for the hidden FF7 fight's black hold on a cold cache is still not observed

## The ten categories

| Category | Weight | Score | Status |
|---|---:|---:|---|
| combat | 20 | 9.4 | scored |
| encounter | 10 | 8.9 | scored |
| visual | 15 | 7.8 | scored |
| feel | 10 | 7.8 | scored |
| narrative | 10 | 9 | scored |
| audio | 10 | none | UNVERIFIED |
| interface | 10 | 8.6 | scored |
| onboarding | 5 | 8.7 | scored |
| prep | 5 | 9 | scored |
| delivery | 5 | 8.5 | scored |

### combat: 9.4

CHIEF: 9.4 (round 21: 9.3), accepts the combat auditor. The gap pass strengthens it: Lady Luck Change and reels by real keys in Ch V, XI, XV and XVI in Wait and Active, and the aeon DEFEND tab seen live (PR-0383, polish). Held below 9.5 by PR-0269 and the labelled estimates. AUDITOR: Round 22 combat audit of live main 816d80f9 (bundle DIf_suBq), no browser; round 21 was 9.3. src/battle, src/engine/tactics and BattlePresenterStrategies are unchanged between release 38 (8136f2ed) and 816d80f9 apart from 43 lines in src/battle/ffx2 (execute.ts, index.ts, minigames.ts: the seeded Lady Luck reel layout). Proof by running code, not by diff: (1) A/B event-log hashes, release 38 export vs HEAD, FFX-2 chains IV, V, VI, V and VI change-once, XI, XIII, XV, human Wait split and Active 1.5 s, 100 seeds each = 1,600 runs, 0 logs moved; (2) FFX three-line bench (intended, advisor top row, mash) 53 rows over seeds 1-40 plus 40 large seeds, byte-identical to release 38 and to round 20; (3) Chapter XVII 200 seeds card 97/200, sensible 51/200, naive 0/200, identical to base; (4) an advisor-card follower on all 7 FFX-2 chapters through setupForChapter/setupForNextLink, 25 seeds, same wins on both trees and 0 recommendations of a Change into Lady Luck or of her reels. Changed values audited against research: Swordplay tiers 22/16/12/9 percent and 1,400/1,150/900/700 ms equal research/ffx-combat-core.md 5.3 (our estimate adopted by Bailey 2026-10-04, ordering sourced, timers unchanged), and reach the real overlays (jsdom run of the engine params: zones 22, 16, 12, 9 percent) and the live engine (Spiral Cut request travelMs 1400, zonePercent 22 in the sin-fins-core log, then a real Enter pressed it successfully); Lady Luck Garment Grid layouts for all 7 FFX-2 chapters computed with the engine's own gridNodeContents equal research/ffx2-lady-luck-availability.md sections 0 and 3 (absent in IV and VI, node 4 in V, XI, XIII, XV, node 1 in XVI; Paine keeps White Mage in V/XI/XV); the live Trema log shows Paine's real Change into and out of Lady Luck. Lady Luck reels (FFX-2 only): engine draws stopOrder and phases only on a human request; tools/ladyluck-reels-bench pay run, 20,000 spins: masher 74.6 percent Dud, careful aiming Cherry 9.0 percent Dud, careful Red 7 75 percent triple Red 7; chapters bench engine!= 0 in every timed arm (message always agrees with the stopped symbols); the Dud is sourced (research 3.12, 75 percent of current HP). 18 new guide documents: every one of 39 HP figures equals engine data (the 10 not found by id are per-form or spawned entries I checked by hand: Yunalesca 48,000 and 60,000, Anima 18,000, Vegnagun nodes 300,000, Bulwarks 3,000, Redoubts 2,500; 2 are text noise), and the FFX-2 Steal and Drop columns equal the engine's reward data. The Ch I guide fix (Defend does not halve Total Annihilation) agrees with research ffx-combat-core 5.1 and 5.2 (Defend //2 physical only, Shell //2 magical). Unit suite: 862 of 872 files pass, 12,940 tests; the 5 failing files are not combat (3 read Lady Luck and pose art files absent from this checkout's public/art, one scans scratch tools files for the old GitHub address, and strategy-ffx2-bahamut's heal-only test timed out at 15 s under load and passes alone in 7.4 s). Gains over round 21: PR-0340 (Lady Luck reachable by no player) resolved, PR-0349 (reel stop a uniform draw, 74 percent Dud) resolved by the timed reels, the phone Fail-row path (PR-0360) fixed, Swordplay tiers now differ. Held below 9.5 by PR-0269 (Chapter XVII card chain 48.5 percent, unchanged), the new Lady Luck reels and Swordplay numbers being labelled estimates, one polish item (aeons are offered Defend, below), and live evidence that is thinner than a full round: no live reel throw and only the Spiral Cut tier were seen this round (the other three tiers and the reels are reused from the c7135bec focused review with a dependency argument, git diff c7135bec 816d80f9 -- src touches only Stage, PoseCut, an Evrae scene, scene types and hud-floor.css).

### encounter: 8.9

CHIEF: 8.9 (round 21: 8.9), accepts the encounter auditor. Ch XI (102 turns) and Ch XV were won by real keys on seed 2 and Ch XVI by keys in the gap pass, which closes two coverage holes but changes no measured rate; held by PR-0269, PR-0257, PR-0279, PR-0227 and PR-0306. AUDITOR: Round 22 encounter audit, held at 8.9 (round 21: 8.9). No enemy, AI script, phase rule, party preset or chapter file changed in release 39 (git diff 8136f2ed 816d80f9 over src/data excluding art and guides lists only the Swordplay tiers, the Lady Luck builds djose, farplane and via-infinito, and the Lady Luck dressphere header), so win rates are unchanged by construction and by measurement: FFX intended-line wins over seeds 1-40: Ch I 18/40, II 40/40, III 39/40, X-anima 38/40, VIII 40/40, Yojimbo 33/40, Natus 31/40, Omnis 27/40, Isaaru 40/40, Sin Face 12/40 (advisor 15/40), mash 0/40 everywhere; FFX-2 at the human Wait split, 100 seeds: IV 100, V 91, VI 83, XI 81, XIII 5, XV 20; Active 1.5 s: IV 100, V 44, VI 24, XI 57, XIII 4, XV 6; Ch XVII card 97/200. Bosses and HP: the 39 HP figures in the new guide documents match the engine; Paragon is the Oversoul form (210,000), Trema 999,999. Canonical tactics were not penalised. Real-key flows this round (headless GPU Chromium, seed 1 pinned, 700 s fight budget, which is shorter than round 21's 900 s): victories in Ch I, VIII, IX, X, XII, XVIII, the Yojimbo chapter and FFX-2 IV (plus a lost run and retry reaching battle in IV and I); defeats on seed 1 in Ch II (engine intended 40/40 and advisor 38/40, a harness line that loses in Yunalesca's third form to Zombie Curaga), XIII and XV; budget stalls in III (link 1 done at 700 s, the gauntlet is slow, PR-0257), V, VI, XI and XVII; Ch XVI was not played at all because the capture harness's findCard presses Right only 16 times and the 18th tile needs 17. Not a game defect, and real-flow victory for XIII and XV has now gone unseen for five rounds (UNVERIFIED, not a deduction; PR-0227 and PR-0306 are Bailey's questions, not engine faults). Release 39 adds Lady Luck as a Change option in V, XI, XIII, XV and XVI: she is a double-edged gamble (a Dud removes 75 percent of the party's current HP, sourced) and the advisor card never recommends her, so no encounter becomes easier or harder by default; a player who throws her every turn in Ch V wins 0 to 4 percent against 97 percent for the shipped line, a documented sourced risk. Held by PR-0269, PR-0257, PR-0279 (Sin difficulty undecided), PR-0227/0306 and incomplete real-flow coverage.

### visual: 7.8

CHIEF: 7.8 (round 21: 8.1 before the continuity harness), accepts the visual auditor. Gap-pass captures at 2000x1012, 2560x1440 and 3840x2160 show the 2x and 3x masters loading and the HUD and Natus composites holding (the chief looked at hud-ffx-2560x1440), which offsets the new major PR-0382 (party heap in Ch XII) and the 4K label collision; CHK-026 FAIL (PR-0377) is the main weight. AUDITOR: PROVISIONAL, from 1600x900 GPU captures only (PYREFLY_BROWSER=gpu, headless Playwright by the capture owner; I opened no browser). STRENGTHS: the approved art is intact (verify-approved against the release tree D:/pyrefly-r39-int: 807 ok, 0 mismatched, 0 missing; judge-locked 48/0/0; art-derive verify on that dist: 2874 masters, 0 problems; the live artifact was byte-matched to it by the live review). Every chapter that played (17 of 18) reads as one coherent painted 2.5D look: figures face the foe (Paine DK checked), scale and depth read, rim light and backdrops hold at actual size, Natus is large, clear of his Sensor card and recognisable (346 px class), Braska's aeon stands clear of the party with both Yu Pagodas visible, Lady Luck's 45 new paintings (Yuna, Rikku, Paine) are one consistent set. Target gate: 44 required, 33 matched, 0 failing, 10 unverified, 1 waiting (composites in critic/rounds/round-22/targets/). WEAKNESSES: (1) CHK-026 FAIL and CHK-027 FAIL in 17 of 17 measured chapters: 1688 head swaps and 1749 feet swaps over tolerance of 10479; where a head is registered the worst jump is 8.0 to 8.8 percent in FFX chapters (3 percent allowed; the release claim of 57 to 8 is borne out there) but 37.7 percent (Yuna idle to ready, Ch XI), 33.0 percent (Paine attack to idle, Ch XI) and 11.1 percent (Yuna LL idle to ready, 19 times, Ch XV) in FFX-2; 0.56 snaps per minute against 0.25; 158 double-image swaps at or over 0.40; 979 jerks of 40 px or more; boss feet shifts of 100 to 145 px (Braska, Bahamut, Isaaru, Anima, Vegnagun leg). Strips show party KO swaps as bare hard cuts, hit-flash and KO-flash covering most boss swaps, and a stand-over-lie double figure in a plain frame (Evrae Rikku, 23-midfight). The harness cannot judge unregistered figures beyond mass, and several 100 percent-plus 'head' numbers (Evrae 115.7, Sin fin feet 665 px) are silhouette artefacts of long or airborne bodies that the strips do not show as defects. (2) A visible HUD overprint: status chips hide the names of Cindy and Mindy. (3) Chapter-select hero card and party faces paint late (first-paint placeholders). (4) Party plates cover the lower legs of figures standing right in four chapters. (5) NOT SEEN: Chapter XVI Ixion (route aborted at chapter select), every size except 1600x900 (so the headline 2x/3x/4x art, F plus and 1440p/4K sharpness are unverified: only title and pause 2x loaded in these runs), phone, the pause CHAPTER tab, the Lady Luck reel overlay. Bailey's visual sub-scores, provisional with the RUBRIC 6a caps: characterModels 7.0 (capped by CHK-026 FAIL; 8.2 uncapped), enemyModels 8.0, animation 7.0 (capped; snaps 0.56 per minute also exceed 0.25), fidelity 8.4 (1600x900 only), camera not judged here. Score would rise toward 9 only when CHK-026 and CHK-027 pass and the 1440p/4K and phone captures exist.

### feel: 7.8

CHIEF: 7.8 (round 21: 8.7 before the harness; a re-baseline, not a build regression: like for like with release 38 it is slightly better), accepts the feel auditor. Input and pacing are polished; PR-0378 to PR-0380 are frequent, measured and the owner's own complaint. AUDITOR: FEEL AUDITOR, deep round 22, live main 816d80f9 bundle DIf_suBq, https://echoesofspira.com/, headless Playwright with PYREFLY_BROWSER=gpu (no black canvas, no fallback), 1600x900, seed 1, real keys. Judged from: the continuity harness (critic/rounds/round-22/continuity/<chapter>-win-r22/continuity/continuity.json and strips/*.jpg; 17 chapters, 8,716 s of battle, about 60 fps, 0 probe errors), the capture owner's timed sequences (seq-transition-into-battle, seq-party-action, seq-action-playing, 10 frames at 230-300 ms in Ch I and Ch IV), run.json turn logs and dboxTimelines, and the results/scene frames. No clip of continuous video exists, so motion judged from strips and 250 ms sequences only.

WHAT HOLDS: (1) Turn cadence is healthy: median gap between commands 2.4-8.6 s in 17 of 18 chapters (Ch I 5.3 s, Ch VIII 3.3 s, Ch IV 5.7 s, Ch XVIII 2.4 s); no chapter shows a dead wait other than Ch VI (R22-FEEL-05, unverified). (2) Frame time: 59.5-60 fps in every played chapter; 2,093 of 550,112 frames (0.38 percent) over the harness slow line, worst single frame 533 ms in Ch I (a one-off hitch) and 474 ms in Ch V, so a stall exists but is rare. (3) The Ch I Lance of Atrophy sequence reads: telegraph, hit ring and the 799 numeral landing with the hit, 'Yuna became a Zombie' banner, then Seymour's 'Let it in.' about 2 s later; the Hastega sequence resolves in about 2.4 s with a banner per haste; the FFX-2 Ch IV hit shows the numeral, slash arc and CHAIN x1.45 tag together. The cut-in portrait (Rikku, Tidus) wipes in over about 0.5-0.75 s with the menu already visible, so it does not block input. (4) Skip and pause pacing: Esc over a pre-battle scene opens pause (05b frames, every chapter), HOLD ENTER skips (1-14 holds), Retry reaches battle again from a defeat in Ch I and Ch IV (retryReachedBattle true, new seed 1001). (5) The pre-battle scene hands over to the first menu inside the first 54 ms frame of the sequence in Ch I and Ch IV, so the handover is a cut with no dead air.

WHAT FAILS (measured by the harness, not by eye): CHK-027 FAIL: 81 snaps in 8,716 s = 0.56 per minute against the 0.25 limit (live release 38 measured 0.53), 86 hard cuts, 9,309 of 10,895 swaps (85 percent; release 38: 94 percent) show a double image, 158 of them at or over the fail severity (worst 0.453), 2,647 jerks (18.2 per minute; 979 of 40 px or more = 6.7 per minute; release 38: 19.7 and 10.1 per minute), worst 815 px (Vegnagun tail attack, hidden behind a white flash). 76 of the 81 snaps are the KO collapse (standing painting cut to the lying one, strip seymour-flux swap-013 yuna idle-ko: IoU 0.036, 0 blend frames), five are Sin fin cast/idle cuts in Ch XVII. If the KO cut were blended the rate would be about 0.03 per minute and CHK-027's snap test would pass; the KO cut is a scripted beat (EC-1001-09) so the owner decides. CHK-026 FAIL: 1,688 of 10,479 measured swaps change a head over tolerance and 1,749 move a standing figure's feet over 2 px. Where a head is registered the table works for the FFX party (Tidus worst 7.8 percent over 938 swaps, Wakka 8.8, Auron 2.0, all feet within 2 px except one Tidus swap), which supports the release note's drop from 57 to 8 percent for Chapters I and VIII; it does NOT hold for FFX-2: Yuna idle to ready in Ch XI reads head x1.38 WITH registration (37.7 percent, swaps 949, 973, 975, strip swap-973-yuna-idle-ready.jpg shows the visibly larger pose and a 3-frame ghost), Den of Woe reads 11.1 percent, and Paine has only 32 of 997 swaps registered, 336 of them over 2 px on the feet (worst 26 px). Almost every boss and aeon is read from the silhouette only (feet tolerance 6 px), 1,100+ over; the harness cannot say whether that is a slide or a bounding-box change, and the strips (Sin right-fin attack-idle 665 px, drawn as a near-identical whale) suggest a reading artefact there. The note 'feet no longer slide sideways' is true for the registered FFX party and not shown for Paine or the bosses.

COMPARISON TO RELEASE 38 (same harness): improved on registered heads (57 to 8-9 percent in FFX), double images (94 to 85 percent), jerks per minute (19.7 to 18.2), snaps unchanged (0.53 to 0.56; Ch I 0.88 to 1.01, Ch VIII 0.46 to 0.36, Ch IV 0.14 to 0.17). Not a regression; not a pass.

SCORE 7.8 (anchor: 7 conspicuous weaknesses, 9 polished with minor issues). Round 21 read 8.7 BEFORE the harness existed; this is a re-baseline on the new evidence, not a build regression (like for like with release 38 it is slightly better). Input and pacing are polished; the continuity breaks are frequent, measured, and the owner's own complaint. The five visual sub-scores are the chief's to set; the caps apply (CHK-026 FAIL: characterModels and animation at most 7.0; snaps 0.56 over 0.25: animation at most 7.5, so the binding cap is 7.0). NOT MEASURED: key-to-first-pixel latency in milliseconds (no timing harness for it; proxies only), real controller feel, natural-pace scene reading (the harness taps Enter every 1.5 s), Ch XVI Ixion (not run, harness fault, see issue R22-HARNESS-01).

### narrative: 9

CHIEF: 9.0 (round 21: 9.0), accepts the narrative auditor; Ch XV's aftermath ("No.") and Ch XI's ("Took you long enough, Gullwings.") and their results were reached this round (gap pass, seed 2), Ch XIII's were not. Open: PR-0390, PR-0255, PR-0262. AUDITOR: NARRATIVE AUDITOR, deep round 22, live main 816d80f9. No browser opened. Read from the capture owner's dboxTimeline text in 19 run.json files and the scene/results frames.

REUSE, WITH DEPENDENCY ARGUMENT: git diff --stat 8136f2ed 816d80f9 and 6461999e 816d80f9 over src/story and research/writing-bible.md are both empty, so no script changed since round 21. Of 17 chapters compared against round 21's timelines (critic/rounds/round-21/evidence/<chapter>-win*/run.json), 15 are line-for-line identical (speaker and text, final period normalised) and the other two differ only in random battle banter (Fallen Aeons: one new Rikku line 'Yunie's frozen! Remedy, now!'; Braska, Leblanc, Vegnagun and Sin Fins differ only because this run ended earlier than round 21's). So the round-21 reading of voice, beats and tone carries to this build for the text. It is labelled reused. It does NOT carry for reach (CHK-022): the presenter and lifecycle changed in release 39.

BEATS AND VOICE, re-read this round: FFX stays elegiac and short (Ch I: Seymour 'I am the bandage', Tidus 'He's not a bargaining chip. He's my old man.', the Fayth Boy reveal; Ch III: Jecht 'Whoa. No old man?' then Tidus 'Not today, old man', and Tidus saying 'Dad' once, which is exactly the writing bible's one permitted moment; Auron one to seven words; Yuna 'Yes.'; Kimahri third person). FFX-2 stays buoyant (Rikku/Paine/Yuna three-beat banter in Ch VI: 'Rikku: Best day. Yuna: We never speak of this', Leblanc and Brother set pieces) with one sincere beat held short (Ch IV 'You can rest. You can rest.', and the deliberate silence after Bahamut the bible calls for). Each game's tone is right for itself (CHK-021). Seymour in Ch VII and X is written as the bible wants a villain who states the theme. Isaaru's Ch XIV exchange is original and kind.

REACH BY REAL INPUT ON THIS BUILD (CHK-022): victory, aftermath scene or results, CONFIRM, board and (Ch I) reload kept the clear: Ch I, VIII, IV (win to board), VII, X, XII, XIV, XVIII reached the board; Ch IX Yojimbo's aftermath played; Ch I and Ch IV defeat reached the Defeat screen with RETRY and CHAPTER SELECT, and Retry reached battle. NOT reached on this build: Ch II Yunalesca (bot defeated at turn 116), Ch XIII Trema and Ch XV Den of Woe (bot defeated; Trema's aftermath unreached for the fifth consecutive round, PR-0227; Den of Woe PR-0306/PR-0353), Ch III, V, XI, XVII (700 s route budget ended mid-fight, Ch III while Jecht was in his finishing beat at 745 s), Ch VI (stalled, R22-FEEL-05) and Ch XVI Ixion (not run; harness could not select the 18th tile, R22-HARNESS-01). 9 of 18 reached on this build. Round 21 reached 16 of 18 on 6461999e.

OPEN POLISH: PR-0255 re-observed (Tromell's five Ch VII lines still have speaker '', src/story/scripts/seymour-anima-macalania.ts say('none', ...) lines 248-261, deliberate per the script comment but they read as unattributed narration); new R22-NARR-01 (Ch XIII and XV open with a third-person narrator while the writing bible 2.2 gives FFX-2 'Yuna as chapter narrator'; Ch V's closing narration is first person Yuna). The results quip '...Okay. Next one.' still shows after Ch I (PR-0262).

SCORE 9.0, held (round 21: 9.0): nothing in the text moved, the reach evidence on this build is thinner (9 of 18 against 16 of 18), and the checks that only the owner can close, a natural-pace story read and taste (CHK-B3), are not recorded; the held-back ceiling is the same open polish plus the unreached Trema and Den of Woe endings. Reading pace is unmeasured because the harness taps Enter every 1.5 s; in-fight banter dwells a median 2.2 s for 4-7 words and 2.5 s for 8-11 (1.0-5.3 s range), which is at the quick end for slow readers but not a defect.

### audio: UNVERIFIED

UNVERIFIED, no number (the audio auditor's result, kept by the chief): no numeric owner listening verdict exists for the shipped music v2 and SFX v2 (PR-0148, CHK-B1). Technical health PASS (29 files byte-identical to round 21 and live, qa --strict 0 findings, 28 of 28 decode, -16.0 to -16.2 LUFS); routing PASS at the real moments in 17 of 17 chapters plus the pause hand-back (gap pass); open: PR-0326 synth first sounds, PR-0373 late cue fetch, PR-0099 stand-in cues. AUDITOR: UNVERIFIED, no number: docs/audio/OWNER-VERDICT.md and docs/target/targets.json hold no numeric owner listening score for the shipped music v2 and SFX v2 (the latest ear words are 2026-09-27 'still sounds like snes music' and 2026-09-28 'tinny and hollow ... close to good', both about older mixes; D-349 'no number given yet'; D-307 to D-309 unanswered). Approving a direction is not a numeric score (RUBRIC section 5). I cannot hear and listened to nothing; every judgement below is decoding, measurement and the capture owner's AudioManager and network logs. I opened no browser and started no server; the capture owner's runs used PYREFLY_BROWSER=gpu per run.json mode. TECHNICAL: PASS. Audio is unchanged since round 21: git diff 6461999e..816d80f9 over public/audio, src/audio, docs/audio is empty (only tools/audio/music-overlap-probe.mjs and sfx-probe.mjs changed, test probes); all 29 shipped audio files (26 music, 2 SFX sprites, manifest.json) are sha256-identical to critic/artifacts/816d80f9.json (artifactHash 12418058...), to round 21's 6461999e manifest, and (critic/reviews/816d80f9-live.json, verify-live --full 3,848 of 3,848 byte-identical with content types) live. `node tools/audio/qa.mjs --strict`: 0 cue findings, 0 SFX findings; 26 music cues -16.00 to -16.21 LUFS, -1.08 to -3.06 dBTP, 0 clipped samples, every loop seam ok; v1 sprite 134 cues peak -1.13 dBTP, v2 sprite 100 cues peak -1.12 dBTP; total 88.49 MB of the 90 MB budget (1.5 MB headroom: any owed new cue will need a budget decision). Independent ffmpeg 9.0.1 ebur128 on all 28 MP3s agrees (-15.8 to -16.0 LUFS, true peak -1.1 to -3.1; sprites -18.5 and -19.4 LUFS) and decodes 28 of 28 with 0 errors. 15 audio vitest files, 130 tests, pass. Stereo (L/R correlation 0.64 to 0.80, mono-sum loss 0.49 to 0.91 dB, no hollow-phase signature) reused from round 21 with a byte-identity argument. themes-audit: 0 chapters depart from the chapter cue map; the same four source cues depart from the bible as in rounds 20 and 21 (PR-0039 scene-gagazet, scene-dreams-end, scene-farplane; PR-0260 scene-macalania-temple); not a player-observable problem. ROUTING (CHK-023), 19 runs with 75 music samples (plus 15 continuity runs): music.current matched playing in every sample; every sample with a cue was source 'prerendered' (0 from the synth path); ready true, not muted, volumes 0.8/0.7/0.7, sfxMix option b / bus 0.70 in every sample; v2 sprite game was ffx in every FFX run and ffx2 in every FFX-2 run (98 of 98 samples). The right cue at the real moments, matched to THEMES.md 'The chapter cue map': battle cue at the first menu in 17 of 17 chapters that reached it (boss-seymour I and XII, boss-yunalesca II, boss-jecht III, boss-ffx2-aeon IV, VI, XI, boss-vegnagun V, boss-seymour-macalania VII and X, boss-evrae VIII, XVII, XVIII, boss-yojimbo IX and XIV, boss-shuyin XV, and XIII on its labelled scene-bed stand-in); scene cue at the pre-scene sample for every chapter except I (silent by script: seymour-flux.ts opens music(null, 600), the sting enters at the reveal, line 105; 2 of 2 as in rounds 20 and 21); victory-ffx at results in 9 FFX wins (I, VII, VIII, IX, X, XII, XIV, XVIII; XVII on the continuity run), victory-ffx2 at results in the Chapter VI win (continuity run), Chapter IV win silent by design (cue map 'none'); across seams the cue held with no restart (Fallen Aeons links 2 and 3 boss-ffx2-aeon at gain 1 across +1.5 s and +3 s samples, Den of Woe boss-shuyin, Isaaru boss-yojimbo, Sin I to III boss-evrae); Chapter III boss-jecht, a script-owned silent link 2 (braskas-final-aeon.ts 251 and 280) and boss-yu-yevon at links 3 and 4 (continuity run). All 5 defeats (Flux lose, Bahamut lose, Yunalesca, Trema, Den of Woe) end with no cue at after-fight or results (silent by design: showResults plays music only on a victory; there is no defeat row in THEMES.md; a question for Bailey, not scored). Network: 0 not found, 0 audio console errors (the one console error in seymour-flux-win is a single net::ERR_CONNECTION_CLOSED on an unnamed resource; all audio keys loaded). OPEN ROUTING FINDINGS (both carried, polish): the first UI sounds of a session are the procedural synth (R20-AUD-01 / PR-0326, third consecutive review) and music cues are fetched at the moment of use (R21-AUD-01). NOT VERIFIED THIS ROUND: AudioManager while paused (reused from round 21), Chapter XIII Trema phase 2 and victory (defeat again, fifth consecutive round), Chapter XV Den of Woe victory, Chapter V Vegnagun to Shuyin phase and victory, Chapter XVI Ixion (route aborted at the board), the ending cues playing, the Chapter I sting. Score: none; the unknown stays unknown and is never averaged away or zeroed.

### interface: 8.6

CHIEF: 8.6 (round 21: 8.3), accepts the interface auditor. The gap pass removed the worst doubt (Ch VI: Esc and Item reachable) and added three polish items (PR-0391 4K labels, PR-0392 revive cursor, PR-0393 reticles). AUDITOR: Interface, information and controls, deep round 22, live main 816d80f9 (bundle DIf_suBq). No browser opened. Judged from the capture owner's evidence at 1600x900 only (PYREFLY_BROWSER=gpu, headless Playwright, real keyboard, seed 1 pinned, fresh profile): 17 chapters captured (the 18th, Ch XVI Ixion, never reached the board card: harness limit). Reused, labelled: critic/reviews/c7135bec-focused (390x844 phone, 1280x720 / 1024x768 / 2000x1012 floor cells, TEXT SIZE 115 and 130 in FFX-2, phone touch turns) with a written dependency argument (the delta c7135bec to 816d80f9 touches only the Ch X Sensor card top rule in hud-floor.css and Evrae's crossfade; the live artifact was verified byte for byte as 816d80f9). 2000x1012, wide 21:9, 4:3 and 4K were NOT captured fresh. WHAT HOLDS: honest enemy intent that separates certain from conditional (SCRIPTED, POSSIBLE 25%, MOST LIKELY 58%, RANDOM TARGET with per-target damage ranges and 'picked when it acts', IF YOU ATTACK conditionals, 'OUR ESTIMATE' labels on the Omnis discs and Sin's Giga-Graviton turn); the advisor names the move, its menu path ('IN WHITE MAGIC', 'IN ITEMS', 'IN SWITCH') and its cost in 17 of 17 chapters; every advisor pick the harness could read was an enabled row the actor owned (no foreign move; targetMismatches [] apart from a harness name-matching bug, see issues); advisor and HUD text effective size 14.2 px minimum at 1600x900 with no panel/panel overlap and no advisor clipping in 15 of 17 chapters; names are whole (Seymour Flux, Braska's Final Aeon, Guado Guardian A, Seymour Natus wrap onto two lines, none ellipsised); the target cursor is a ground ring, corner brackets, a name tag, a TARGET slab and a lit turn-list portrait (Ch I, III, VII, IX, X, XII, XIX-Leblanc, Trema), and Cancel returns the screen to battle with 0 target elements in all 12 chapters probed; Ch III Yu Pagodas are now visible and selectable; the pause is full-bleed with a usable tab strip, H hides panels, Esc resumes; no developer vocabulary (a regex sweep of advisor, intent, board, prep, pause, results and briefing text over 18 run.json found no section sign, file stem, row number, debug or id). WHAT HOLDS IT BELOW 9: (1) the strategy-guide sheet is cut mid-line at its foot with no visible scroll bar and no key hint (Ch I, V, XI, XII, XIII, XVII), (2) the advisor's effect text is ellipsised in Ch VII and XII and absent in Ch XVIII although release 39 says the narrow boxes keep cost and effect, (3) pause section headers and the 'H PAINTING ONLY' hint measure 2.4 to 2.9 : 1 and the title tagline 1.9 : 1 from rendered pixels, (4) the cleared-tile best-time ribbon on the board is clipped ('8:0', '5:4'), (5) story dialogue boxes cover the advisor card, guide and party plate at the first menu in Ch XI, XIII and XIV, (6) carried and re-confirmed by reuse: the guide's labels fall below the 14 px floor in windows under 1600 wide (R39F-05) and the guide disappears at TEXT SIZE 115 and 130 in FFX-2 Ch IV and VI (R39F-08), (7) guide copy tells the player to 'reload an earlier save' (Ch V). No critical or major defect found in this category. Against round 21 (8.3): the card stub in five chapters (PR-0330) is mostly repaired, TEXT SIZE reaches the FFX-2 HUD (reused), phone Bushido/Swordplay taps work (reused); +0.3. Not scored higher because multi-target and all-party target cues, the pause GUIDE and CONTROLS tabs, the status-icon hint card and every size other than 1600x900 are not freshly evidenced.

### onboarding: 8.7

CHIEF: 8.7 (round 21: 8.5), accepts the onboarding auditor (PR-0270 and PR-0362 resolved). Newcomer walkthrough SIMULATED by a scripted route; no real newcomer. AUDITOR: Onboarding, accessibility and options, deep round 22, live main 816d80f9. NEWCOMER WALKTHROUGH: SIMULATED only (a scripted Playwright route from a fresh profile that follows visible prompts with real Enter/Esc/arrow keys; the driver knows the game, so it is not a real newcomer and not a cold read). No real newcomer, pad or phone walkthrough was done this round (pad and touch first-run reused from c7135bec firstrun-cand-pad/touch, with dependency argument: coach files untouched by the 816d80f9 delta). VERIFIED LIVE: Auron's briefing on a fresh profile (eighteen fights; CTB waits, ATB clock runs) with 'ENTER / ESC SKIP, 20 SECONDS, ONCE' and 'D NEVER SHOW THIS AGAIN'; a three-step coach (board 1 of 3, prep 2 of 3, first menu 3 of 3 'FIRST TIME ONLY', 'ENTER CONTINUE') that is skippable with Esc; the first-menu tip's closing Enter no longer picks Attack: in all 14 runs where the tip showed, the first engine action was the advisor's move (Hastega, Shell, Steal, Talk, Close in...), so PR-0362 is repaired on live; the first prep and board hint strips name the keys; Esc in a cutscene opens a pause on the CHAPTER tab with the objectives; FFX-2 first tip says 'a command holds them, take your time, nobody moves' matching the X-2 BATTLE: WAIT default shown in OPTIONS; OPTIONS lists TEXT SPEED, TEXT SIZE (100%; 115 and 130 reused), REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE and BATTLE HELP toggles, X-2 BATTLE and ATB SPEED in FFX-2, REPLAY BRIEFING, RESTART ENCOUNTER. Non-colour cues: targets use shape (ring, brackets, tag) plus a name, element chips carry text and weak/absorb words, KO is strike-through plus dimming, FFX-2 shows 'WAIT, ATB HELD' text. HELD BELOW 9: (1) the board's first card says 'Click its picture to begin' to a keyboard player in 17 of 17 keyboard runs (R39F-06, inNewFeature), while the same card covers chapter rows VII to XII; (2) no key remapping exists (CONTROLS tab lists keys only), no REDUCE FLASHES row (the engine reads a reduceFlashes flag, fxEnv.ts:41, but no setting exposes it) and no colour-vision option, a proposal for Bailey, not a defect to fix unasked; (3) the first-run tip did not show in 4 of 17 fresh-profile runs (Ch XI, XIII, XIV, XV; a story dialogue box was up instead in the three frames read; whether the tip is only deferred is unverified); (4) pause section headers and hints at 2.4 to 2.9 : 1 contrast; (5) not captured: the CONTROLS and EYE CANDY pages, TEXT SIZE at 115/130 live this round, the phone OPTIONS window (PR-0372), prep tabs STATS/SPHERE GRID/EQUIPMENT/ITEMS/OVERDRIVE, Esc-back from prep without the coach up (the harness's Esc only dismissed the coach: prepEscGoesTo stayed party-prep). Against round 21 (8.5): PR-0270 (TEXT SIZE reaches FFX-2, major) and PR-0362 are resolved, +0.2.

### prep: 9

CHIEF: 9.0 (round 21: 9.1), accepts the prep auditor; the seed-2 wins add two FFX-2 reward rows not seen in the round's main set (Ch XV: EXP 4,200 x3, GIL 35,200, Crystal Ball, Kaiser Knuckles, Magical Dances Vol 1; Ch XI: EXP 23,000 x3, AP 54 per dressphere, GIL 7,000, Crystal Gloves, Pixie Dust, Faerie Earrings x2, Tetra Band); not re-audited against research this round. Prep tabs still unopened by input (fourth round). AUDITOR: PREP AND DELIVERY AUDITOR, round 22 deep review of live main 816d80f9 (bundle DIf_suBq). I opened no browser; I ran only HTTP reads (one --full artifact-manifest verify-live, curl HEAD). Worked from critic/rounds/round-22/evidence (447 indexed captures, 444 verified, all headless Chromium 153 on ANGLE D3D11, PYREFLY_BROWSER=gpu, 1600x900, keyboard, seed 1 pinned) and critic/rounds/round-22/continuity (431 of 431 verified). The capture owner's note in the task is stale: the run finished (logs/ALLDONE) and 20 evidence folders exist.

RESULTS AND REWARDS (sourced). Nine victory panels are comparable with round 21 and read identical with the clock removed: Flux AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere (src/data/ffx/enemies/seymour-flux.ts cites research 1.1 and 1.4 for each value); Evrae AP 5,400, GIL 2,600; Anima OVERKILL x1, GIL 8,600; Natus AP 6,300, GIL 3,500; Omnis AP 24,000, GIL 12,000; Isaaru AP 5,000; Yojimbo AP 0 GIL 0; FFX-2 IV EXP 1,300, AP 15 per dressphere, GIL 1,000, Gris Gris Bag; FFX-2 VI EXP 1,640, GIL 1,590. Sin Face and Sin Fins differ only by who was KO'd and an overkill in this run (28,800 vs 19,800 AP). No reward value changed in release 39 (src/app/screens has no Results or Prep change in the diff; chapterCards.ts is one line).

RETRY AND PROGRESS. Defeat flow with real keys on FFX I and FFX-2 IV: Defeat panel (turns, attempts, 'NEVER CLEARED'), RETRY and CHAPTER SELECT; retry reaches the party prep and then the battle in 7.4 to 7.6 s (round 21 median 8.4 s). 9 of 9 victory runs in the main set keep the cleared tile, best time and 'N of 18 beaten' through a real page reload (boardAfterReload equals boardAfter for Flux, Evrae, Anima, Natus, Omnis, Isaaru, Yojimbo, Sin Face, Bahamut). SaveData.ts and saveComfort.ts are unchanged since round 21's build (git diff 6461999e..816d80f9 empty), and the live review of the same artifact read a setting and a chapter record back identical after reload.

PREP AGENCY. All 18 tiles are listed on the board; party prep was read on its CHAPTER tab (04-prep.png, both games: objectives, a sourced TIP such as Bio first for Flux, party list, six FFX tabs and five FFX-2 tabs, Start Battle, Auron's three-step guide). The tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSPHERES and ACCESSORIES were again not opened by input at any size (fourth round), so 'a prep choice changes the fight, with a sourced consequence' is carried from round 20 and 21 on a dependency argument for desktop (PartyPrep and its data untouched by the diff) and is NOT carried for phone (PR-0295 is still open).

NOT SHOWN THIS ROUND: no win and so no reward row for XIII Trema and XV Den of Woe (route bot lost again, PR-0353, third review, STALLED), nor for III Braska, V Vegnagun, XI Fallen Aeons (budget ended first) or XVI Ixion (harness could not select the tile). Score 9.0: held just under round 21's 9.1 because the same unopened-tab gap now sits beside seven chapters with no reward row this round; no defect in results, retry or progress was found.

### delivery: 8.5

CHIEF: 8.5 (round 21: 8.7), accepts the delivery auditor. The exact artifact and the 404/mime sweep are clean; the first slow-4G measurement (8.3 s to ready, 14 to 24 s to the board, a 36 s reload in 3 of 4 runs, PR-0394) and 61 to 160 MiB per session keep it down; Ch XVI is reachable by keys. AUDITOR: EXACT ARTIFACT (CHK-017, mine). node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/816d80f9.json --full against https://echoesofspira.com/: PASS, artifactHash 12418058c51d9995232bd0be6fbcf65b00fac6d38c985abb7851e88bd0ded264, liveManifest match, 3,848 of 3,848 files compared byte for byte and by content type, 0 mismatched, 0 missing, 0 wrongType, 0 errors; index.html equals the artifact once Cloudflare's one Web Analytics beacon (366 bytes and the line feed) is cut out (output critic/rounds/round-22/delivery/verify-live-full.json; it took about 24 minutes on this connection). curl HEAD of four sample files: 200 with the right content types (text/javascript, image/webp, image/png, audio/mpeg), CF-Cache-Status HIT, Cache-Control public, max-age=0, must-revalidate on all of them, including the content-hashed bundle.

CLEAN LOADS. 39 headless runs (20 capture runs and 19 continuity runs, 5,835 media requests): 0 responses with status 404 or above, 0 images answered as text/html, 0 requests naming a file the shipped manifest lacks (all 2,960 requests of the 20 capture runs resolved against critic/artifacts/816d80f9.json after decoding %40), 1 console error (Flux win, 'Failed to load resource: net::ERR_CONNECTION_CLOSED', no URL recorded; the Flux re-run in the continuity set read 0). Round 21 treated a single transport reset that re-ran clean as a PASS; same here, disclosed as D22-05.

FRAME TIME on named hardware: AMD Ryzen 7 7800X3D, 63.6 GB RAM, NVIDIA GeForce RTX 5070 Ti (driver 32.0.16.1047), Windows 11, headless Chromium 153 on ANGLE D3D11 (mode gpu, no black canvas, no fallback), 1600x900, device scale 1, this machine's own connection to the live site (live review read 3.5 to 5.4 MB/s), fresh profile and empty cache, host load NOT recorded (the capture queue ran three jobs at once, runq.sh xargs -P3). Continuity probe over 17 chapters: 8,716 s and 521,825 battle frames, 59.5 to 60.0 fps in every chapter, 2,093 frames over 34 ms (0.40 percent), worst single frame 533 ms (Flux), 474 ms (Vegnagun), 461 ms (Trema), 455 ms (Anima). Three FFX-2 chapters exceed 1 percent slow frames (XIII 1.52, IV 1.15, V 1.04); every FFX chapter reads 0.26 percent or less (D22-06).

BYTES. Media requested per session, summed from the manifest sizes: 61 to 160 MiB (median 119 MiB over 19 chapters); the board alone, before any chapter, had already requested 64 files and 96 MiB (Ixion run). The deployed site is 8,323,984,350 bytes (7.75 GiB), 7.2 GB of it PNG masters at 2x to 4x, largest file 14.8 MB (Cloudflare per-file limit not approached). No throttled-network, cold-cache timing, weaker-GPU, non-Chromium, phone or 2000x1012 capture exists in this round, so load time (CHK-017's 5-second clause) is UNVERIFIED (fifth review; PR-0259).

FLOWS. Victory by real keys to the results panel and board for 11 of 18 chapters (I, VII, VIII, IX, X, XII, XIV, XVII, XVIII from the main set; XVII also from the continuity set; FFX-2 IV and VI); defeat then retry then battle on FFX I and FFX-2 IV. Not completed: III, V, XI (700 s and 930 s budgets ended mid-fight; round 21 needed 14 to 30 minutes for the same fights), II, XIII, XV (route bot lost, deterministic, same as rounds 20 and 21), XVI (the harness cannot select the 18th tile, D22-01). CHK-024: the full upgrade matrix is NOT APPLICABLE (SaveData.ts, saveComfort.ts and every storage key untouched; ArtGovernor and FrameGovernor use no storage); the reload smoke passed 9 of 9 here and in the live review.

Score 8.5 (round 21: 8.7): the artifact, the 404 and mime sweep and the frame rate are clean; held down by unmeasured load time and size at 100+ MiB per session, no non-Chromium or throttled evidence, seven chapters with no victory this round (cause: harness or budget, not established as product), and two recurring stalls (PR-0348, PR-0353).

### Bailey's five visual sub-scores (not part of the weighted score)

characterModels 7, enemyModels 8, animation 7, fidelity 8.5, camera 7.8 (round 21: 8.2, 7.8, 7.4, 8.2, 7.9). Bailey's five visual sub-scores (provisional; not part of the weighted score). Caps applied: CHK-026 FAIL caps characterModels and animation at 7.0; 0.56 snaps a minute caps animation at 7.5. characterModels 7.0 (capped; uncapped about 8.2: the 45 Lady Luck paintings are one consistent set and the FFX party now holds its size). enemyModels 8.0 (Natus large and clear, Braska clear of the party; boss feet still shift at swaps). animation 7.0 (capped; uncapped about 7.2: the KO cut, double images and boss jerks are frequent, measured and the owner's own complaint, and slightly better than release 38). fidelity 8.5 (2x masters at 2000x1012 and 2560x1440 and 3x at 3840x2160 seen in the gap pass and sharp in the composites; 4x never requested; 4K affinity labels collide). camera 7.8 (one framing alternation in Ch VII; release 39's calmer Ch III camera and girls-in-frame fix were not graded). The drop against round 21 is a re-baseline on new evidence (the harness), not a build regression.

### Continuity harness aggregate (CHK-026, CHK-027)

```json
{
 "checks": {
  "CHK-026": {
   "result": "FAIL",
   "reasons": [
    "1688 swap(s) change a head by more than the tolerance (worst 115.7 percent; 37.7 percent where the head is registered)",
    "1749 swap(s) of a standing figure move its feet more than the tolerance (worst 665.5 px at 1600 wide)"
   ],
   "note": "3104 of 10479 measured swaps had a registered head (tolerance 3 percent); 7375 were read by the figure's mass (tolerance 30 percent, whole-figure jumps only); 0 had no reading"
  },
  "CHK-027": {
   "result": "FAIL",
   "reasons": [
    "0.56 snaps per minute is over 0.25",
    "979 jerk(s) of 40 px or more in one frame (worst 815.5 px)",
    "158 swap(s) show a double image of severity 0.4 or more (worst 0.453)"
   ]
  }
 },
 "size": {
  "maxHeadJumpPct": 115.7,
  "maxHeadJumpPctRegistration": 37.7,
  "headOverTolerance": 1688,
  "maxFeetShiftPx": 665.5,
  "feetOverTolerance": 1749,
  "headMeasured": 10479,
  "headRegistration": 3104,
  "headSilhouette": 7375,
  "headUnmeasured": 0
 },
 "motion": {
  "snaps": 81,
  "snapsPerMinute": 0.56,
  "hardCuts": 86,
  "hardCutsPerMinute": 0.59,
  "ghostSwaps": 9309,
  "ghostFrames": 39603,
  "worstGhostSeverity": 0.453,
  "ghostOverFail": 158,
  "jerks": 2647,
  "worstJerkPx": 815.5,
  "jerksOverFail": 979,
  "lowestIou": 0.006,
  "maxCentroidShiftPx": 328
 }
}
```

Source: critic/rounds/round-22/continuity/continuity-summary-r22-17ch.json (recovered from run.log; continuity-summary.json on disk holds only the Ixion retry, PR-0398). PYREFLY_BROWSER=gpu headless Playwright, about 60 fps, 0 probe errors. Against live release 38 on the same harness: registered head 57 to 37.7 worst (8.8 for the FFX party); double-image swaps 94 to 85 percent; jerks per minute 19.7 to 18.2 (40 px or more: 10.1 to 6.7); snaps per minute 0.53 to 0.56. Unmeasured: ffx2-ixion-djose (the harness could not select its tile; the chapter itself was won by keys in the gap pass).

## Target gate

Required 44, matched 33, failing 0, unverified 10, waiting on a decision 1. Visual auditor's count from 1600x900 composites in critic/rounds/round-22/targets/; the gap pass added 2000x1012, 2560x1440 and 3840x2160 composites (critic/rounds/round-22/evidence/gaps/composites/), of which Natus matches sheet variant A and the HUD composition holds; the counts were not re-graded from them. Waiting: the Leblanc tile (PR-0399).

## Encounters (real input on the live build)

| Ch | Chapter | Game | Complete real flow | Outcome |
|---|---|---|---|---|
| I | seymour-flux | FFX | yes | victory seed 1 (capture and continuity); defeat then Retry to battle (seymour-flux-lose); phone 390x844 touch: defeat (Results, CONFIRM, board and reload kept the clear. The capture owner's own return was cut short; the queue finished afterwards (logs/ALLDONE).) |
| II | yunalesca | FFX | no | defeat seed 1 at turn 116 (capture and continuity); a seed-2 long run was killed unfinished (The route threw its Phoenix Downs at Yunalesca (PR-0397); engine intended 40 of 40.) |
| III | braskas-final-aeon | FFX | no | stalled by the 700 s budget (link 1 done) and 933 s in the continuity run (PR-0257 gauntlet length, PR-0339 budget.) |
| IV | ffx2-bahamut | FFX-2 | yes | victory (capture, continuity, phone touch); defeat then Retry to battle (Board and reload kept the clear.) |
| V | ffx2-vegnagun-shuyin | FFX-2 | no | stalled by the budget (capture 700 s, continuity 935 s); a seed-2 long run was killed (Lady Luck reels thrown live by Yuna in the gap pass.) |
| VI | ffx2-leblanc | FFX-2 | yes | victory in the continuity run; the capture run idled 12 minutes in a submenu (route fault, PR-0348) (Gap pass: Esc out of the submenu and Item reachable by keys.) |
| VII | seymour-anima-macalania | FFX | yes | victory (Aftermath plays after CONFIRM.) |
| VIII | evrae-airship | FFX | yes | victory |
| IX | yojimbo-cavern | FFX | yes | victory (Aftermath played.) |
| X | seymour-natus | FFX | yes | victory at 1600x900, 2000x1012, 2560x1440 and 3840x2160 |
| XI | ffx2-fallen-aeons | FFX-2 | yes | stalled by the 700 s and 934 s budgets on seed 1 (capture, continuity, phone); VICTORY seed 2 in the gap pass (102 turns, 13:10, results with reward row, aftermath after CONFIRM, board and reload kept the clear) (The long fight needs more than the route's 700 s budget (PR-0339).) |
| XII | seymour-omnis | FFX | yes | victory (capture); continuity run stalled by its budget |
| XIII | ffx2-trema | FFX-2 | no | defeat seed 1 (89 and 99 turns); defeat seed 2 (83 turns) and its Retry (seed 1003, 5 turns) in the gap pass; Defeat results with RETRY reached each time (Real-flow victory unseen for the sixth round (PR-0227, PR-0353).) |
| XIV | isaaru-via-purifico | FFX | yes | victory |
| XV | ffx2-den-of-woe | FFX-2 | yes | defeat seed 1 (capture and continuity); VICTORY seed 2 in the gap pass (39 turns, 5:16, results with reward row, aftermath scene after CONFIRM, board and reload kept the clear) (First real-key victory of Ch XV seen by the critic since round 19.) |
| XVI | ffx2-ixion-djose | FFX-2 | yes | victory in the gap pass (45 turns; board, card, prep, fight, results, aftermath, board) (The capture and continuity routes could not select the 18th tile (PR-0359); continuity not measured; retry leg not run.) |
| XVII | sin-fins-core | FFX | yes | victory in the continuity run; the capture run stalled by its budget |
| XVIII | sin-face | FFX | yes | victory |

## Checks

| Check | Mandatory | Result | Reason |
|---|---|---|---|
| CHK-001 | no | FAIL | Step 3 fails again at polish severity: the first UI sounds of a cold session are the synth path (PR-0326). Music never synth (0 of 75 samples). |
| CHK-002 | yes | UNVERIFIED | Full-bleed pause, cutscene pause, results, board and title verified at 1600x900; the gap pass added 2000x1012, 2560x1440, 3840x2160 (Ch I, IV, VIII, X) and 390x844 pause captures, but the painting rect and currentSrc were not measured at 1280x720 and 2560x1080, and the phone pause header clips (PR-0372). |
| CHK-003 | yes | FAIL | Polish-severity failures: the advisor effect text is ellipsised in Ch VII and XII (PR-0330), the guide labels fall to 11.4 px at 1280x720 and 9.1 px at 1024x768 (PR-0251, reused), pause headers and hint at 2.4 to 2.9 : 1 and the title tagline 1.9 : 1 (PR-0356), the guide sheet is cut mid-line with no scroll cue (PR-0385). At 1600x900 advisor rows hold 14.2 px minimum. |
| CHK-004 | yes | PASS | The card names the move, its menu path and cost in 17 of 17 chapters; every readable pick was an enabled row the actor owned. The Ch VI doubt (combat auditor UNVERIFIED) is closed by the gap pass: from Rikku's White Magic submenu one Esc returns to the root list, Item lists Phoenix Down and Enter plays it on Paine (revive read-back not taken; PR-0392 for the default cursor). |
| CHK-005 | no | UNVERIFIED | Engine benches pass (the card never recommends Lady Luck in 14 arms; Ch XVII card 97 of 200 equals release 38), but the broken-board matrix (two down, healer down, status lock, no MP, no revive stock, telegraphed re-kill) was not run. |
| CHK-006 | yes | PASS | After opening a target cursor and pressing Cancel the screen returned to battle with 0 target elements and the command rows restored in all 12 chapters probed (real keys). |
| CHK-007 | yes | PASS | No section sign, file stem, row number, debug word or id in any captured player-facing text (18 run.json sweeps). Copy that does not fit the game is PR-0388 (polish). |
| CHK-008 | yes | UNVERIFIED | At 1600x900 no advisor, guide or intent panel sits on a face or weapon in 17 first menus; party plates cover lower legs (PR-0366) and a story box covers the advisor in Ch XI, XIII, XIV (PR-0370). 1280x720 was not captured this round; the Natus card at six sizes is reused from the focused review (R39F-11, PR-0406); 2000x1012, 2560x1440 and 3840x2160 exist for Ch I, IV, VIII, X but were not swept for overlaps. (reused: critic/reviews/816d80f9-focused.json (R39F-01, R39F-11)) |
| CHK-009 | yes | FAIL | Polish severity: turn-list names are whole, but the Magus Sisters' status chips half-hide "Cindy" and "Mindy" (Ch XI) and Ormi's tag overprints "Dr. Goon" (Ch VI) (PR-0355); the best-time ribbon is clipped (PR-0387); 4K affinity labels collide (PR-0391). |
| CHK-010 | yes | UNVERIFIED | Single target (ring, brackets, name tag, TARGET slab, lit turn-list portrait) in Ch I, III, VI; all-allies Hastega with "ALL ALLIES" and three brackets (gap pass). Not captured: all-enemies, aeon and Overdrive target sets, Vegnagun links 3 and 4, and the 1280 and 2560 pair the check asks for. |
| CHK-011 | yes | PASS | Every targetable enemy that matters was visible at 1600x900 (both Yu Pagodas, Mortibody and Natus, the four Omnis discs, Sandy, Cindy and Mindy, the Vegnagun tail, leg and body links). |
| CHK-012 | yes | PASS | Every roster chip and speaker portrait captured is a painted face, the Lady Luck plates included; the late first paint on the board is PR-0384. |
| CHK-013 | yes | UNVERIFIED | At 1600x900 the art reads as approved (33 target composites; verify-approved 807 ok, judge-locked 48/0/0). The gap pass captured 2560x1440 for Ch I, IV, VIII, X with 2x masters loading and composites (the chief looked at hud-ffx-2560x1440: sharp, composition holds); 3x masters load at 3840x2160. Not judged at 2560x1440: the 45 Lady Luck paintings and the Garden of Pain, Via Purifico and Road to the Farplane backdrops; the 4x tier was never requested (DPR 1; the ?arttier=high run was killed). |
| CHK-014 | yes | PASS | Figures face across the field at 1600x900 in all 17 chapters (Paine Dark Knight confirmed in a crop); attack and cast poses aim at the target. |
| CHK-015 | yes | UNVERIFIED | Keyboard proved everywhere (Esc, N, E, G, H, targeting, cancel, Lady Luck Change and reel stops in Wait and Active, aeon summon), touch at 390x844 in Ch I, IV and XI (gap pass). No gamepad input was exercised on this build, and the pause from inside a submenu, while targeting and during an animation was not pressed this round. |
| CHK-016 | yes | PASS | Every capture asserts its screen and chapter before it shoots: 444 of 447 main-set and 431 of 431 continuity captures verified; the three that were not (30-post-scene in Ch I, VII, VIII) were recorded as UNVERIFIED instead of filed, which is the check working (the route expects the scene before results, PR-0339). The Ixion assert-fail stopped the run rather than shooting the wrong chapter. |
| CHK-017 | yes | PASS | Exact artifact on the live URL: verify-live --full, 3,848 of 3,848 files byte-identical and the right content types, artifactHash 12418058c51d9995 (Cloudflare's analytics beacon cut out of index.html exactly). 39 headless runs plus the gap pass: 0 responses of 404 or above, 0 images served as text/html, 1 console error (an unattributed connection reset in the Ch I win run; its re-run read 0). The load-time clause stays unmeasured on a normal link (PR-0259); slow-4G arrival 8.3 s to ready. |
| CHK-018 | yes | PASS | No hand-written variant path in src; all 2,960 media requests of the 20 capture runs resolve against the shipped manifest after decoding %40. |
| CHK-019 | yes | PASS | The manifest was built with decode checks (decodeChecked true); 28 of 28 MP3s decode with ffmpeg; qa --strict 0 findings. |
| CHK-020 | yes | PASS | The same screens carry the same work in both games (advisor card with menu path and cost, intent card with SCRIPTED / POSSIBLE / MOST LIKELY, guide, pause), each in its own game's vocabulary. |
| CHK-021 | yes | PASS | FFX-only changes (Swordplay tiers, the Defend tab) and FFX-2-only changes (Lady Luck and its reels) sit in the right game: FFX logs show overdrive events and no chain, spherechange or Lady Luck; FFX-2 the reverse; the DEFEND tab is absent on the FFX-2 menu; Lady Luck is absent in IV and VI and present in V, XI, XIII, XV and XVI. Audio voicing follows the game in 98 of 98 samples. |
| CHK-022 | yes | UNVERIFIED | Real-key victory with results and return to the board on this build in 14 of 18 chapters: I, IV, VI (continuity run), VII, VIII, IX, X, XI (seed 2, gap pass, 102 turns), XII, XIV, XV (seed 2, gap pass), XVI (gap pass), XVII (continuity run), XVIII, each with aftermath where the chapter has one and the clear kept across a reload; defeat then Retry to battle in FFX I and FFX-2 IV (and XIII). Not reached: II (seed-1 defeat, a route targeting bug, PR-0397), III and V (budget ended mid-fight, PR-0339), XIII (defeat on seeds 1 and 2). The long seed-2 runs for II, III and V were killed unfinished. |
| CHK-023 | yes | PASS | Through the real presentation path: Swordplay Spiral Cut live (travelMs 1400, zone 22, a real Enter succeeded; the other three tiers proved engine to overlay in jsdom); Bushido typed by real keys with key-named chips; Lady Luck Change and reels (overlay, three stop keys, DUD readout) by real keys in Ch V, XI, XV and XVI in Wait and Active ATB; music routing at real moments in 17 of 17 chapters reached and the pause hand-back in Ch I and IV (gap pass). |
| CHK-024 | no | PASS | Reload smoke only (SaveData untouched since round 21): 11 of 11 victory runs read keep the cleared tile, best time and board position across a real reload, Ch XV seed 2 included. |
| CHK-025 | no | NOT APPLICABLE | No hidden experiment is on the board and no FF7 route is in this scope; the board lists 18 tiles. |
| CHK-026 | yes | FAIL | Harness: 1688 swap(s) change a head by more than the tolerance (worst 115.7 percent; 37.7 percent where the head is registered); 1749 swap(s) of a standing figure move its feet more than the tolerance (worst 665.5 px at 1600 wide). 3104 of 10479 measured swaps had a registered head (tolerance 3 percent); 7375 were read by the figure's mass (tolerance 30 percent, whole-figure jumps only); 0 had no reading. Ch XVI Ixion was not measured (the harness could not select its tile). |
| CHK-027 | yes | FAIL | Harness: 0.56 snaps per minute is over 0.25; 979 jerk(s) of 40 px or more in one frame (worst 815.5 px); 158 swap(s) show a double image of severity 0.4 or more (worst 0.453). 86 hard cuts; 9,309 of 10,895 swaps show a double image. Ch XVI Ixion was not measured. |
| CHK-B1 | no | UNVERIFIED | Agents cannot hear; no numeric owner listening verdict exists for the shipped music v2 and SFX v2 (PR-0148). |
| CHK-B2 | no | UNVERIFIED | Feel needs the owner's hands; key-to-first-pixel latency was not measured (latency.mjs written, not run). |
| CHK-B3 | no | UNVERIFIED | No human story read is recorded for release 39; the harness taps through scenes. A natural-pace check showed scenes never auto-advance (a line stayed 90 s untouched). |

## Coverage matrix

**Tested**

- All 18 chapters on the live site by real keys at 1600x900 (GPU, seed 1): 17 by the capture and continuity routes, Ch XVI by the gap pass; victory with results and board in 14 of 18 (see encounters), defeat then Retry in FFX I and FFX-2 IV.
- Continuity harness over 17 chapters, 8,716 s of battle, about 60 fps, 0 probe errors; strips read by the visual and feel auditors, the first-time fan and the chief.
- Exact artifact: verify-live --full 3,848 of 3,848 files; 404 and mime sweep over 39 runs and the gap pass.
- Engine: FFX-2 A/B 1,600 runs and FFX three-line bench byte-identical to release 38; Ch XVII 200 seeds; FFX-2 card follower 7 chapters x 25 seeds; Lady Luck grids, reels bench (20,000 spins), Swordplay params to overlay in jsdom; 39 guide HP figures and FFX-2 loot columns against engine data; npm test 862 of 872 files (5 failing files are non-combat environment or scratch issues).
- Lady Luck by real keys: Change rows in XI, XIII, XV, XVI; Paine's two-Change route in XI and XV; reels thrown in V, XI, XV, XVI, Wait and Active.
- Hi-res: Ch I, IV, VIII, X at 2000x1012, 2560x1440 and 3840x2160 with network logs (2x and 3x masters) and target composites.
- Phone 390x844 touch: Ch I (prep, first menu, pause, Defeat results), Ch IV (Victory results), Ch XI framing.
- Audio: decode, loudness, qa --strict, 15 vitest files, routing in 19 runs, pause hand-back in Ch I and IV, the Ch I reveal sting, title and board cues, cold-start synth log.
- Slow-4G arrival and reload (emulated, 4 runs); a natural-pace scene read in Ch I.
- Ch VI: Esc out of a submenu, Item, Phoenix Down target by keys; aeon summon and its menu in Ch II.

**Reused, with the reason**

- TEXT SIZE 115 and 130 in FFX-2 (R39F-08), the guide label floor at 1280x720 and 1024x768 (R39F-05), phone Bushido and Swordplay taps, reels by pad and tap, pad first-run, from critic/reviews/c7135bec-focused.json: git diff c7135bec 816d80f9 -- src touches only BattlePresenterStage.ts, PoseCut.ts, scenes/evrae-airship-deck.ts, scenes/types.ts and hud-floor.css; src/battle, src/data and src/ui/ffx2 are identical; the live artifact was verified byte for byte; no related defect open.
- Natus Sensor card at six window sizes (R39F-01, R39F-11), from critic/reviews/816d80f9-focused.json: Same build: the live artifact equals the focused review's rebuilt dist (3,848 of 3,848 files); nothing after 816d80f9 touches src or public.
- Narrative voice and beats (text only), from critic/rounds/round-21.json: git diff 6461999e 816d80f9 over src/story and research/writing-bible.md is empty; 15 of 17 timelines line-for-line identical. Not reused for reach (CHK-022).
- Audio stereo image and saved audio settings after reload, from critic/rounds/round-21.json: All 29 audio files sha256-identical to round 21 and to the live artifact; SaveData.ts unchanged.
- Swordplay tiers 2 to 4 (Slice and Dice, Energy Rain, Blitz Ace) live, from jsdom engine-to-overlay probe this round (critic/rounds/round-22/combat/od-params-probe.json): Spiral Cut ran live through the same overlay with the same parameter path; the gap pass could not bring up Tidus's Overdrive row for the other three.

**Not tested**

- Gamepad input on this build (CHK-015).
- Window sizes 1280x720, 1366x768, 2560x1080 (21:9), 4:3 (1024x768) fresh; the 4x art tier (?arttier=high killed); DPR above 1.
- Firefox, WebKit/Safari, a real phone, a weaker or integrated GPU; load time on a normal link with a cold cache (only emulated slow 4G).
- Continuity harness over Ch XVI; continuous video clips (motion judged from strips and 250 ms sequences).
- Key-to-first-pixel latency (latency.mjs written, not run).
- Prep tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSPHERES, ACCESSORIES by input (fourth round).
- The FFX-2 twirl after release 39's fixes (PR-0334, PR-0314, PR-0364) and 21:9 pipe slabs (PR-0344).
- Vegnagun links 3 and 4, Sin Face mouth-open, all-enemies, aeon and Overdrive target sets (CHK-010).
- The broken-board advisor matrix (CHK-005); the Phoenix Down revive read-back in Ch VI.

**Required and not tested (keeps the deep obligation open)**

- CHK-022: real-key victory with post-battle scene, results and saved reward for Ch II Yunalesca, Ch III Braska's Final Aeon, Ch V Vegnagun and Shuyin and Ch XIII Trema
- CHK-026 and CHK-027 over Ch XVI Ixion (the harness could not select the tile)
- CHK-015: gamepad input on the live build, and the pause from a submenu, while targeting and during an animation
- CHK-013: the 45 Lady Luck paintings and the new Garden of Pain, Via Purifico and Road to the Farplane backdrops judged in game at 2560x1440, and the 4x tier
- CHK-008 and CHK-002 at 1280x720 and 2560x1080 (painting rect, panels over faces and weapons)
- CHK-010: all-enemies, aeon and Overdrive target sets at 1280 and 2560
- CHK-B1, CHK-B2, CHK-B3: Bailey's listening score, play verdict on feel and story read for release 39

## Issues, ranked (critical, major, polish, suggestion)

141 open issues: 0 critical, 9 major, 117 polish, 15 suggestion. New this round: PR-0377 to PR-0406 (the R39F ids of the focused reviews and the auditors' working ids are recorded as aliases). Carried issues not re-observed this round say so in their round22 field.

### PR-0377 [major, visual] (owner-reported, CHK-026 FAIL): pose swaps still change a figure's size and move its feet; fixed for the registered FFX party, not for FFX-2 Yuna, Rikku and Paine or for bosses and aeons

- **Game / chapter / state:** both (FFX-2 party worst; bosses and aeons in both games; the FFX party is within 8.8 percent) / all 17 measured; worst Ch XI, XIII, XV (FFX-2) and Ch III, XIV, VII, IV (boss feet) / pose swaps in battle
- **Observed:** 17 of 17 measured chapters fail CHK-026: 1,688 of 10,479 measured swaps change a head over tolerance and 1,749 move a standing figure's feet over it. Where the head is registered the FFX party now holds 7.8 to 8.8 percent (Tidus 7.8 over 938 swaps, Wakka 8.8, Auron 2.0; release 38 measured 57), so the release claim holds for FFX party figures. It does not hold for FFX-2: Yuna idle to ready x1.3765 with registration in Ch XI (swaps 949, 973, 975; feet 7.8 to 9.5 px), Paine attack to idle x0.67 (swaps 964, 872), Yuna as Lady Luck idle to ready 11.1 percent 19 times in Ch XV; Paine has 32 of 997 swaps registered and 336 move the feet over 2 px (worst 26 px). The fan saw Rikku about a third shorter in her Trema ready pose (swap-246), Wakka bigger at critical, Auron bigger in his follow-through, and Yuna's feet stepping sideways at item-to-idle (Den of Woe swap-282) and lifting off the floor line at idle-to-ready (Trema swap-115). Boss and aeon feet move 100 to 145 px at hurt and idle swaps (Braska 145.5, Bahamut 112, Isaaru 107.5, Anima 99.7, Vegnagun leg 105); those are silhouette readings, often under a flash, and the strips do not always show a slide.
- **Expected:** CHK-026: head within 3 percent and a standing figure's feet within 2 px at 1600 wide at every pose swap, unless the camera cuts in that frame.
- **Repro:** Live, real keys from the title, seed 1, 1600x900, GPU: Chapter XI (ffx2-fallen-aeons) link 1, watch Yuna start a command (swap 973 at frame 56193) and Paine end an attack (swap 964); Chapter XIII Rikku idle to ready (swap 246). Harness: node critic/runner/lib/continuity.mjs over the chapter. (seed 1)
- **Evidence:** critic/rounds/round-22/continuity/continuity-summary-r22-17ch.json; critic/rounds/round-22/continuity/ffx2-fallen-aeons-win-r22/continuity/strips/swap-973-yuna-idle-ready.jpg; critic/rounds/round-22/continuity/ffx2-fallen-aeons-win-r22/continuity/strips/swap-964-paine-attack-idle.jpg; critic/rounds/round-22/continuity/ffx2-trema-win-r22/continuity/strips/swap-246-rikku-idle-ready.jpg; critic/rounds/round-22/continuity/ffx2-den-of-woe-win-r22/continuity/strips/swap-282-yuna-item-idle.jpg; critic/rounds/round-22/continuity/braskas-final-aeon-win-r22/continuity/strips/swap-156-braskas-final-aeon-idle-hurt.jpg
- **Confidence:** high for the measured numbers (confirmer re-read swaps 949, 973, 975, 964, 872; the chief looked at strip swap-973); medium for the cause
- **Requirement:** CHK-026; RUBRIC 6a (caps characterModels and animation at 7.0); Bailey 2026-10-04 "It is soooo bad and ruins the immersion"
- **Where:** suspected src/data/art/poseRegistrationFfx2.ts (Yuna Gunner and Lady Luck ready/idle, Paine attack/idle, Rikku ready) and poseRegistrationFoes.ts (boss hurt/ko feet); not traced
- **Fix:** Register Yuna (Gunner, Lady Luck, White Mage), Rikku and Paine ready/attack/idle/item poses to one head height and foot point, and the boss and aeon hurt/ko feet; rerun the harness. Where a registered pair cannot be reconciled, keep the swap under an existing flash.
- **Acceptance:** Harness over Ch XI, XIII, XV and III: no registered head swap over 3 percent, standing party feet within 2 px, boss feet under 10 px away from camera cuts; Paine registered in at least 90 percent of her swaps.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R39F-03; R22 visual-targets CHK-026; R22-FEEL-02 (size and feet half); fan: size jump x2, sliding or floating feet
- **Note:** Not a regression: the live release 38 baseline was worse (57 percent registered head jump). Lady Luck Yuna's 11.1 percent is inside the new Lady Luck feature; the issue as a whole is not.

### PR-0378 [major, feel] (owner-reported, CHK-027 FAIL): a KO is a one-frame cut from the standing painting to the lying one; 76 of the 81 snaps in 8,716 s of battle

- **Game / chapter / state:** both / all 17 measured / a KO in battle
- **Observed:** 0.56 snaps per minute of battle against the 0.25 limit (81 snaps in 145.3 minutes; release 38 measured 0.53). 76 of them are hurt/idle to ko with 0 blend frames and an outline overlap of about 0.04: the standing figure vanishes and a lying figure appears, often up to a body length to the side. Five are Sin fin cast/idle cuts (Ch XVII swaps 80, 94, 263, 515, 641). Per chapter: Ch I 1.01, Ch XIV 1.39, Ch VII 1.09, Ch XVII 1.00, Ch XV 0.99 snaps a minute. The fan saw it in all 17 played chapters on party members, aeons and bosses (Tidus, Yuna, Auron, Lulu, Shiva, Ifrit, Valefor, Seymour, Braska's Final Aeon, the Vegnagun leg).
- **Expected:** CHK-027: at most 0.25 snaps per minute; a KO travels (a collapse in-between or a short matched dissolve) unless the owner wants the cut. Blending the KO alone would bring the rate to about 0.03 a minute.
- **Repro:** Live, seed 1, 1600x900, real keys: Chapter I to the first KO (Yuna, Lance of Atrophy, about 54 s in); harness strip swap-013 (Yuna idle to ko) and swap-062 (Tidus hurt to ko). (seed 1)
- **Evidence:** critic/rounds/round-22/continuity/seymour-flux-win-r22/continuity/strips/swap-013-yuna-idle-ko.jpg; critic/rounds/round-22/continuity/seymour-flux-win-r22/continuity/strips/swap-062-tidus-hurt-ko.jpg; critic/rounds/round-22/continuity/isaaru-via-purifico-win-r22/continuity/strips/swap-193-ifrit-hurt-ko.jpg; critic/rounds/round-22/continuity/sin-fins-core-win-r22/continuity/continuity.json
- **Confidence:** high (confirmer: Ch I 8 of 8 snaps to ko, lowest IoU 0.035; Ch XI 4 of 4)
- **Requirement:** CHK-027; RUBRIC 6a (animation capped at 7.5 while snaps exceed 0.25); EC-1001-09 says the KO cut was a scripted choice, so the owner decides between the cut and a transition
- **Where:** suspected: the presenter pose-swap path for ko in src/engine/BattlePresenterStage.ts (crossfadeMs 0 for ko); not traced to a line
- **Fix:** Ask Bailey whether the KO cut is wanted (EC-1001-09). If not: give ko and revive an in-between (one painted fall frame) or a 6 to 8 frame matched dissolve anchored at the feet; keep the 5 Sin fin cuts under the fin flash.
- **Acceptance:** Harness over Ch I, VII, XIV and XVII: snaps per minute at or under 0.25, and strip swap-013 shows blend frames.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R22-FEEL-01; R39F-04 (snap half); fan: snapping (18 strips)

### PR-0379 [major, feel] (owner-reported, CHK-027 FAIL): most pose changes show two copies of the figure at once; 158 swaps at or over the fail severity, including two Bahamuts a third of the screen apart

- **Game / chapter / state:** both / every measured chapter / any pose change
- **Observed:** 9,309 of 10,895 swaps (85 percent; release 38: 94) carry a double image, 158 at or over the 0.40 fail severity (worst 0.453). The fan saw two Paines, two Rikkus, two Yunas (one lying, one standing), two Shivas, two Yojimbos, two Tiduses in a timed sequence, and in Ch IV Bahamut fading out on the left while a second Bahamut fades in about a third of the screen to the right (swap-298). In Ch VIII a standing Rikku is drawn translucent over her own lying KO figure in a plain frame (23-midfight). Evrae's two-heads hurt frame (PR-0367) is unchanged because release 39 reverted the Evrae cut (R39F-02).
- **Expected:** CHK-027: no multi-frame double image of two unlike poses; a crossfade only between registered, like silhouettes.
- **Repro:** Live, seed 1, 1600x900: Chapter IV, Bahamut's first attack (swap 298); Chapter XI, Yuna idle to ready (swap 973, 3 ghost frames); Chapter VIII, Rikku's KO near the 23-midfight capture. (seed 1)
- **Evidence:** critic/rounds/round-22/continuity/ffx2-bahamut-win-r22/continuity/strips/swap-298-bahamut-idle-attack.jpg; critic/rounds/round-22/continuity/ffx2-vegnagun-shuyin-win-r22/continuity/strips/ghost-067-rikku-ko-idle.jpg; critic/rounds/round-22/continuity/ffx2-fallen-aeons-win-r22/continuity/strips/ghost-197-yuna-ko-idle.jpg; critic/rounds/round-22/targets/evrae-rikku-crop.jpg; critic/rounds/round-22/continuity/seymour-natus-win-r22/continuity/strips/ghost-145-auron-attack-follow.jpg
- **Confidence:** high (confirmer: Ch XI 876 ghost swaps, Ch I 415)
- **Requirement:** CHK-027, RUBRIC 6a (animation capped at 7.0 while CHK-026 fails and at 7.5 while snaps exceed 0.25)
- **Where:** suspected: the pose crossfade in src/engine/BattlePresenterStage.ts (crossfadeMs 120/140) applied to unlike and unregistered silhouettes; not traced
- **Fix:** Crossfade only registered, like silhouettes; for unlike pairs cut on a registered head or hide the swap under the existing flash; register Bahamut's attack pose to its idle position.
- **Acceptance:** Harness over Ch IV, VIII, XI: ghost swaps over the fail severity at or under 10 across them, and no strip with two separated copies of one figure.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R39F-04 (double-image half); R22-FEEL-02 (ghost half); PR-0367 merged; fan: half-motion/ghosting (32 strips) and the two Bahamuts

### PR-0380 [major, feel] (CHK-027 FAIL): large figures jump sideways in one frame when a pose changes (Ifrit, Valefor, Yunalesca, Sandy, Sin's right fin, the Vegnagun tail and leg)

- **Game / chapter / state:** both / II, III, V, XI, XIV, XVII / pose swaps of bosses and aeons (KO, attack, telegraph)
- **Observed:** 2,647 jerks, 979 of 40 px or more (6.7 a minute; release 38 10.1), worst 815.5 px (the Vegnagun tail attack, under a white flash). The fan saw Ifrit's KO pose appear about 200 px over (Braska, Isaaru), Valefor's KO land to the side, Yunalesca jump a quarter screen, Sin's right fin and the Vegnagun tail swing to new places with nothing between, and Sandy go from floating upright to lying sideways off to the right.
- **Expected:** A pose change moves the figure no more than its own motion (CHK-027 jerks).
- **Repro:** Live, seed 1, 1600x900: Chapter V first tail attack (about 7 min, jerk-000-vegnagun-tail); Chapter XIV Ifrit KO (jerk-000-ifrit); Chapter XI Sandy KO (jerk-002-sandy); Chapter II Yunalesca (jerk-002). (seed 1)
- **Evidence:** critic/rounds/round-22/continuity/ffx2-vegnagun-shuyin-win-r22/continuity/strips/jerk-000-vegnagun-tail.jpg; critic/rounds/round-22/continuity/isaaru-via-purifico-win-r22/continuity/strips/jerk-000-ifrit.jpg; critic/rounds/round-22/continuity/ffx2-fallen-aeons-win-r22/continuity/strips/jerk-002-sandy.jpg; critic/rounds/round-22/continuity/yunalesca-win-r22/continuity/strips/jerk-002-yunalesca.jpg; critic/rounds/round-22/continuity/sin-fins-core-win-r22/continuity/strips/jerk-001-right-fin.jpg
- **Confidence:** medium (several are under a flash; the Sin fin feet numbers are silhouette artefacts the strips do not show)
- **Requirement:** CHK-027
- **Where:** suspected: boss and aeon pose anchors in src/data/art/poseRegistrationFoes.ts; not traced
- **Fix:** Anchor each boss and aeon pose to the idle's feet point (the same table as PR-0377); where the pose genuinely moves (a tail swing), add one in-between.
- **Acceptance:** Harness over Ch V, XI, XIV and XVII: worst jerk under 100 px outside camera cuts, jerks of 40 px or more under 2 a minute.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R22-FEEL-03; fan: jerks or teleports in a move (8)

### PR-0148 [major, audio] (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)

- **Game / chapter / state:** both / all
- **Observed:** RUBRIC section 6 includes Bailey's listening assessment in the audio category and no numeric owner verdict exists for the shipped mix. The last ear words on shipped audio are 2026-09-27 'still sounds like snes music' (release 21); music v2 and SFX v2 (D-302, D-303, D-306) were adopted on recommendation without listening; D-349 records 'no number given yet'; D-307, D-308 and D-309 are unanswered. OWNER-VERDICT.md is unchanged since 2026-09-29. Audio bytes in build 6461999e are identical to round 20's, so nothing has changed that would answer this.
- **Repro:** Read docs/audio/OWNER-VERDICT.md, docs/target/decisions.json (D-302, D-303, D-307 to D-309, D-349) and docs/target/targets.json (audio tile): no number from 0 to 10 for the shipped mix.
- **Evidence:** docs/audio/OWNER-VERDICT.md; docs/target/decisions.json D-349; critic/rounds/round-20.json R20 audio category (same state); git diff cd9dbbb0..6461999e over public/audio and src/audio is empty
- **Confidence:** high
- **Requirement:** RUBRIC section 6 (audio: Bailey's listening assessment), CHK-B1, AGENTS.md hard rule 13
- **Where:** owner judgment, not a code path
- **Fix:** Bailey listens from docs/audio/audition.html (ten minutes) and gives one number from 0 to 10 for the shipped music v2 and SFX v2, plus an answer to D-307, D-308 and D-309. The critic then scores the category; an agent never invents the number.
- **Acceptance:** A dated, verbatim numeric verdict in OWNER-VERDICT.md tied to a named build and cue set; the audio category moves from UNVERIFIED to scored.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Carried, owner-reported, STALLED (third review): the audio auditor again left audio UNVERIFIED for the same reason; audio files are byte-identical to round 21. carried from round 21 and re-observed or updated in round 22

### PR-0382 [major, visual] (new): party members stand in one heap: in Ch XII Wakka, Yuna and Auron overlap in front of Omnis's discs, and in Ch I and X an attack plays behind another party member

- **Game / chapter / state:** FFX / XII (worst), I, X / mid-fight, during party actions
- **Observed:** Ch XII mid-fight at 1600x900: Wakka stands directly in front of Yuna, who stands in front of Auron, all three inside one figure-width, between the left discs and the party plates (the chief looked at the capture). Ch I: Auron's whole attack happens behind Yuna (ghost-386); Ch X: Tidus's follow-through behind another figure (ghost-208). One moment per chapter; whether the heap is a transient during an action or the formation itself was not established.
- **Expected:** Each party member reads as a separate figure in its own slot, as in the approved battle targets.
- **Repro:** Live, seed 1, 1600x900, real keys: Chapter XII, the 23-midfight capture; Chapter I, Auron's attack (strip ghost-386). (seed 1)
- **Evidence:** critic/rounds/round-22/evidence/seymour-omnis-win/23-midfight.png; critic/rounds/round-22/continuity/seymour-flux-win-r22/continuity/strips/ghost-386-auron-attack-follow.jpg; critic/rounds/round-22/continuity/seymour-natus-win-r22/continuity/strips/ghost-208-tidus-attack-follow.jpg
- **Confidence:** medium (seen in single frames; formation versus transient not separated)
- **Requirement:** RUBRIC 6 visual (staging, composition); approved battle targets
- **Where:** suspected: Ch XII formation slots or the attack travel path (targeting, formation and camera changed in release 39); not traced
- **Fix:** Measure the three slot positions in Ch XII at the first menu and during an attack; if the formation overlaps, spread the slots; if the attacker travels across allies, route the travel in front.
- **Acceptance:** Ch XII first menu and mid-action captures at 1600x900 and 2560x1440: party figures overlap by under 15 percent of the smaller figure's box.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Merged / aliases:** fan: characters pile on top of each other
- **Note:** Round 21 recorded the party in front of a disc in Ch XII (PR-0365), so the overlap may predate release 39; not compared like for like.

### PR-0269 [major, combat] (carried, unchanged, confirmed): Chapter XVII's advisor card chain clears 97 of 200 seeds (48.5 percent); Genais's Sigh on link 3 is 60 of the 103 losses

- **Game / chapter / state:** FFX / Ch XVII Sin: the Fins and the Core (sin-fins-core), link 3
- **Observed:** Card-following chain (v3 card, shipped options {}, seeds 1-200): 97/200 on cd9dbbb0 and on 6461999e (identical); sensible line 51/200, naive 0/200 (escape at link 1). Losses: link3 Sin Genais's Sigh 60, link 3 core elements 29, link 2 fins 12. Real keys this round: victory on the long-budget re-run (234 turns), stalled at link 3 on the short budget. The confirmer re-ran sin-ab.test.ts on the current tree (critic/rounds/round-21/combat/sin-ab-confirm.json) and got the same 97/200, sensible 51/200, naive 0/200. Open at major in rounds 19b, 20 and 21 (stalled by the two-review rule: a written method check is owed before another batch).
- **Expected:** The advisor's first-ranked line should be a competitive route through the chain on a clear majority of seeds (round 19b/20 bar).
- **Repro:** critic/rounds/round-21/combat/sin-ab.test.ts with R21_ROOT=D:/Final Fantasy (and the cd9dbbb0 export for A/B); sin-ab-cand.json equals sin-ab-base.json and round 20's.
- **Evidence:** critic/rounds/round-22/combat/sin-ab-cand.json; critic/rounds/round-22/combat/sin-ab-base.json
- **Confidence:** high
- **Requirement:** Encounter and advisor fairness (RUBRIC 6 combat; CHK-005)
- **Where:** src/engine/tactics (sin-common, sin-fins-core)
- **Fix:** Teach the Ch XVII card a Genais's Sigh answer for link 3 (Genais's Sigh is the single largest loss) and re-measure on 200 seeds; do not change boss numbers.
- **Acceptance:** Card chain wins at least 70/100 on 200 seeds with Genais's Sigh no longer the largest loss; Ch XVIII rows unchanged.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Confirmer re-read the 200-seed bench: identical on release 38 and 39 (not a regression). carried from round 21 and re-observed or updated in round 22

### PR-0099 [major, audio] (carried, STALLED): chapter rows in THEMES.md still play a stand-in cue (VI, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII)

- **Game / chapter / state:** both (FFX: IX, X, XII, XIV, XVII, XVIII; FFX-2: VI, XI, XIII, XV, XVI) / VI, IX to XIII (FFX-2: VI, XI, XIII, XV, XVI), XIV, XVII, XVIII
- **Observed:** The chapter cue map marks these chapters 'stand-in' or 'borrowed' (themes-audit prints 'borrowed; owed' on VI, IX, X, XI, XIII, XIV, XV, XVI, XVII, XVIII; XII is a stand-in in the table). Round 21's routing confirms what plays: Ch VI, XI, XVI and XIII phase 2 on boss-ffx2-aeon; Ch IX and XIV on boss-yojimbo; Ch X on boss-seymour-macalania; Ch XII on boss-seymour with scene-dreams-end; Ch XV on boss-shuyin; Ch XVII and XVIII on scene-fahrenheit and boss-evrae. D-209 says a stand-in never counts as finished. Nothing changed in this build.
- **Repro:** node tools/audio/themes-audit.mjs (cue-map section), then read critic/rounds/round-21/audio/routing.json for the cues actually playing per chapter.
- **Evidence:** critic/rounds/round-21/audio/themes-audit.txt; critic/rounds/round-21/audio/routing.json
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md chapter cue map; D-209
- **Where:** docs/audio/THEMES.md 'The chapter cue map'; src/data/encounters.ts music records
- **Fix:** Compose and ship the owed cues in D-209's list after the audio direction pick (boss-leblanc, boss-trema, boss-den-of-woe, the Natus and Omnis cues, the Sin assault and countdown cues, and the rest), each auditioned by Bailey before it ships (rules 8 and 13).
- **Acceptance:** The row's Status changes from stand-in to own, themes-audit shows the new cue against the bible, and routing evidence shows the new key at that chapter's boss moment.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Carried; the audio auditor's cue-map sweep shows the same stand-ins (boss-ffx2-aeon for IV, VI, XI; boss-evrae for VIII, XVII, XVIII; boss-yojimbo for IX and XIV; XIII on a labelled scene bed). Audio unchanged since round 21. carried from round 21 and re-observed or updated in round 22

### PR-0222 [major, delivery] (carried, unchanged, not captured): the fix for the hidden FF7 fight's black hold on a cold cache is still not observed

- **Game / chapter / state:** FF7 experiment (hidden)
- **Observed:** Not captured in round 21. No FF7 product file changed in release 38 (only tests/unit/ff7-repair.test.ts), so the carried state stands, with no credit and no fresh evidence.
- **Expected:** No black hold: the swirl's last frame holds until the art settles.
- **Repro:** Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears; press Esc and arrows during the hold.
- **Evidence:** critic/rounds/round-20.json PR-0222
- **Confidence:** low (not observed)
- **Requirement:** CHK-017 and CHK-025; RUBRIC section 5
- **Fix:** None proposed until observed.
- **Acceptance:** Frames every 200 ms on a cold throttled load with no black frame after the swirl.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Carried, not captured: the hidden FF7 fight is outside this round's scope (CHK-025 NOT APPLICABLE). carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0381 [polish, feel] (new): the camera flips between two framings over three frames in Ch VII; other reported "camera jerks" are ordinary cuts

- **Game / chapter / state:** FFX (Ch VII); the others both / VII / turn and action cuts
- **Observed:** Ch VII (Anima): frames -1, 0, +1, +2 alternate two framings so Tidus snaps left and right (jerk-000-tidus). The fan also named Ormi's close-up cutting to a wide shot (Ch VI), Sinspawn Genais popping in over the party (Ch XVII) and a jump in Ch XII; a close-up to wide cut is ordinary cinematic grammar, so only the Ch VII flip is kept as a defect.
- **Expected:** A camera change is one cut or one move, never an alternation.
- **Repro:** Live, seed 1, 1600x900: Chapter VII, strip jerk-000-tidus. (seed 1)
- **Evidence:** critic/rounds/round-22/continuity/seymour-anima-macalania-win-r22/continuity/strips/jerk-000-tidus.jpg; critic/rounds/round-22/continuity/ffx2-leblanc-win-r22/continuity/strips/jerk-000-ormi.jpg; critic/rounds/round-22/continuity/sin-fins-core-win-r22/continuity/strips/jerk-000-sinspawn-genais.jpg
- **Confidence:** medium (one occurrence, one run)
- **Requirement:** CHK-027; RUBRIC 6 feel (coherent camera)
- **Fix:** Find the two shot requests that alternate in Ch VII (probably two beats asking for different framings in the same tick) and let the later one win.
- **Acceptance:** Harness over Ch VII: no jerk strip whose neighbouring frames alternate framings.
- **Merged / aliases:** fan: camera jerks (4)
- **Note:** Downgraded from the fan's major: one confirmed alternation in one chapter; the other three are intended cuts.

### PR-0383 [polish, combat] (new, FFX only): the new DEFEND tab, and the engine row behind it, is offered on a summoned aeon's turn

- **Game / chapter / state:** FFX / any FFX chapter with a summon (seen in Ch II) / an aeon's turn
- **Observed:** Live (gap pass): in Ch II, Yuna Summon > Valefor by real keys; on Valefor's turn the rows are Attack / Aeon / Dismiss and the "Q triangle DEFEND" tab is at the bottom left. Engine probe: Valefor's list holds Defend (enabled) and submitting it adds the defend status. research/ffx-combat-core.md line 1118 and ffx-seymour-flux.md line 867 list Defend among the statuses aeons are immune to. Not checked in the Steam HD copy.
- **Expected:** An aeon's menu in FFX uses Shield and Boost; no source read here gives aeons a Defend command. Not checked against the Steam HD copy.
- **Repro:** tests: critic/rounds/round-22/combat/aeon-defend.test.ts (summon Valefor in the Yunalesca chapter, list d.commands at the aeon's turn); in game, summon an aeon and look at the bottom-left tab
- **Evidence:** critic/rounds/round-22/evidence/gaps/yunalesca-aeon/40-aeon-menu-0.png; critic/rounds/round-22/combat/aeon-defend.json
- **Confidence:** medium (engine behaviour proved; the original game's aeon menu not verified)
- **Requirement:** AGENTS rule 6 (never invent game data), CHK-021
- **Where:** src/ui/ffx/defendControl.ts defendCommandOf; src/ui/ffx/CommandMenu.ts:268
- **Fix:** Hide the tab and the engine row for aeon actors, or confirm in the Steam HD copy that aeons can Defend and say so in research.
- **Acceptance:** On an aeon's turn the command list has no enabled defend row and the tab is absent; a character's turn still shows it
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature true
- **Note:** The tab is new in release 39; release 38 hid the row. Polish: a legal-looking extra command, no wrong result shown.

### PR-0384 [polish, visual] (new): the chapter-select hero card and party faces paint late (empty frame, grey silhouettes, a missing boss layer after a reload)

- **Game / chapter / state:** both / chapter select
- **Observed:** On first arrival at the board the hero card is an empty dark frame and the party faces are grey silhouettes (Ch VIII 03-card, Ch XII 03-card). After a reload in Ch XII Auron's face is still a placeholder 3.7 s later and Seymour Omnis does not draw on the card although his layer is authored; in Ch VIII the card shows the clouds with no Evrae right after the win and Evrae on black with no scene after a reload. Settled cards (Flux, Bahamut, Natus, Yojimbo, Macalania, Isaaru, Sin) match the approved 'boss on its scene' tile.
- **Expected:** Card layers appear together, or the card fades in once complete.
- **Repro:** Fresh profile, 1600x900, GPU, headless, live site: title, board; capture at once, then after a win and after a reload.
- **Evidence:** critic/rounds/round-22/evidence/seymour-omnis-win/03-card.png, 34-board-after.png, 35-board-reload.png; evrae-airship-win/34-board-after.png, 35-board-reload.png; critic/rounds/round-22/targets/board-cards.jpg
- **Confidence:** medium (timing, one pass, no throttled network)
- **Requirement:** CHK-012 (fallback not final), tile 'Chapter select v2'
- **Fix:** Hold the card's reveal until its layers are decoded, or draw scene and boss from one composited image.
- **Acceptance:** A timed 0 to 3 s sequence of arrival and of a reload shows no empty card and no placeholder face once the screen reports ready.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown

### PR-0385 [polish, interface] (new, in the new scrolling guide): the guide sheet is cut mid-line at its foot with no visible scroll bar and no key hint

- **Game / chapter / state:** both / FFX Ch I, XII, XVII; FFX-2 Ch V, XI / open on live main 816d80f9
- **Observed:** The in-battle guide panel ends in a half-drawn line of type: Ch I 'Seymour again, and this time Kimahri and', Ch XVII 'Moves In before you can attack.' sliced through the glyphs, Ch V (FFX-2 Vegnagun Tail) a bullet cut at 'Noli Me Tangere does 1,250 damage to', Ch XI and XII cut lines. strategy-guide.css says the 2.4 px scroll bar is the only cue ('no mask and no fade'), but no thumb is visible in any capture, and no on-screen chip names the scroll keys ([ and ], Home, End, wheel, right stick; ControlsHint offers only 'G guide'). A player sees clipped text and does not learn it scrolls.
- **Expected:** A scrollable sheet shows that it scrolls (a visible bar or a one-line key hint) and does not slice a line through the middle.
- **Repro:** Live https://echoesofspira.com/, fresh profile, 1600x900, setSeed(1) before the first key; Chapter I (or XVII) to the first menu; read the top-left guide panel.
- **Evidence:** critic/rounds/round-22/evidence/seymour-flux-win/11-advisor.png; critic/rounds/round-22/evidence/sin-fins-core-win/11-advisor.png; critic/rounds/round-22/evidence/ffx2-vegnagun-shuyin-win/12-intent-E.png; critic/rounds/round-22/scratch/xvii-guide.png
- **Confidence:** medium (the missing thumb is read from headless GPU captures; a real browser may draw an overlay bar)
- **Requirement:** CHK-003, CHK-009 (text not clipped); onboarding: discoverable help
- **Where:** src/ui/common/strategy-guide.css .sgd__panel (lines 105-153); src/ui/common/StrategyGuide.ts (hint chip)
- **Fix:** Show the scroll cue the CSS promises (a visible thumb or track in headless and on real browsers) and add a short '[ ] SCROLL' chip beside HIDE GUIDE; or set the panel height to whole lines.
- **Acceptance:** A capture of Ch I and XVII at 1600x900 shows a visible scroll cue or key chip and no sliced line; pressing ] moves the sheet.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true

### PR-0386 [polish, onboarding] (R39F-06, reproduced live in 17 of 17 keyboard runs): the first-run board card says "Click its picture to begin" to a keyboard player

- **Game / chapter / state:** both / chapter select, first run / open, carried from critic/reviews/c7135bec-focused.md R39F-06
- **Observed:** In 17 of 17 keyboard runs on a fresh profile the board card reads 'Start with the first one. / Start with this one. Click its picture to begin. The others wait on the board.' Keys (arrows, Enter) are what the footer strip and the player use; the touch card says 'Tap its picture'. The same card also covers chapter rows VII to XII and the BOSS value while it is up.
- **Expected:** The verb follows the device in use (as the reels and Overdrive overlays do).
- **Repro:** Fresh profile, press Enter on the title, skip the briefing, read the first card on the board.
- **Evidence:** critic/rounds/round-22/evidence/seymour-flux-win/03-card.png; critic/rounds/round-22/evidence/*/run.json (dossier)
- **Confidence:** high
- **Requirement:** CHK-007, onboarding copy; target tile for the first-run guide
- **Where:** src/ui/coach/firstRunCopy.ts (suspected)
- **Fix:** Say 'Press Enter to begin' (or 'Pick this one') with the device's control for key and pad; keep 'Tap its picture' for touch.
- **Acceptance:** Step 1 names the control in use on key, pad and touch.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Merged / aliases:** R39F-06

### PR-0387 [polish, interface] (new): the best-time ribbon on a cleared tile is clipped ("8:0" for 8:02, "5:4" for 5:44)

- **Game / chapter / state:** both / chapter select after a win
- **Observed:** After a win the board's cleared tile carries a gold corner ribbon whose time is cut off: '8:02' reads '8:0' (Seymour Flux) and '5:44' reads '5:4' (Bahamut). Both in FFX and FFX-2.
- **Expected:** The time is fully inside the ribbon.
- **Repro:** Win Chapter I (or IV) and read the board after Confirm (34-board-after.png).
- **Evidence:** critic/rounds/round-22/evidence/seymour-flux-win/34-board-after.png; critic/rounds/round-22/evidence/ffx2-bahamut-win/34-board-after.png; critic/rounds/round-22/scratch/board-tile.png
- **Confidence:** high
- **Requirement:** CHK-009 (values readable)
- **Where:** src/app/screens/ChapterSelectScreen.ts / its stylesheet (suspected)
- **Fix:** Shrink or re-seat the ribbon text so its right edge clears the clip.
- **Acceptance:** After a win in Ch I and IV the ribbon shows the whole time at 1280x720, 1600x900 and 2560x1440.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown

### PR-0388 [polish, interface] (new): guide copy tells the player to reload a save and level up, which this chapter-based game has no screen for

- **Game / chapter / state:** both / V (FFX-2), IX and I (FFX)
- **Observed:** FFX-2 Ch V Vegnagun Tail guide: 'If its attacks are too much for you to survive, reload an earlier save and level up a little first.' (the game is chapter-based with retry; there is no save to reload and no levelling between fights). FFX Ch IX Yojimbo guide: 'In the next area an unsent summoner, Lady Ginnem, waits...' and Ch I prep text 'Get ready before the next area' read as walkthrough prose. These are adapted from the Jegged guides (standing rule 2026-10-03).
- **Expected:** Guide copy is meaningful in this game's flow (labelled adaptations).
- **Repro:** Chapter V first menu, read the top-left guide.
- **Evidence:** critic/rounds/round-22/evidence/ffx2-vegnagun-shuyin-win/12-intent-E.png; src/data/guides/docs/ffx2-vegnagun-shuyin.ts:36; src/data/guides/docs/seymour-flux.ts:19
- **Confidence:** high
- **Requirement:** CHK-007 (player-facing copy fits the game); docs: guide follows Jegged in our words, adaptations labelled
- **Where:** src/data/guides/docs/ffx2-vegnagun-shuyin.ts:36
- **Fix:** Replace those sentences with the game's own equivalent ('lose and retry, or revisit Party Prep') or drop them.
- **Acceptance:** No guide sentence tells the player to reload a save, level up or walk to a next area.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown

### PR-0389 [polish, interface] (R39F-08, reused): at TEXT SIZE 115 and 130 the in-battle guide disappears in FFX-2 Ch IV and VI and G does nothing

- **Game / chapter / state:** FFX-2 / IV, VI / open, not re-measured this round
- **Observed:** Reused: the guide panel is 0x0 at 115 and 130 percent in Ch IV and VI, and G toggles a flag with nothing shown; the pause GUIDE tab still shows the page.
- **Expected:** A designed give-way tells the player where the guide went.
- **Repro:** Pause, OPTIONS, TEXT SIZE 130, back to the first menu, press G.
- **Evidence:** critic/reviews/c7135bec-focused/results/textsize-ffx2-bahamut-1600x900-130-pause.json (reused)
- **Confidence:** medium (reused evidence)
- **Requirement:** CHK-003, CHK-015
- **Where:** src/ui/common/StrategyGuide.ts (sgd--squeezed)
- **Fix:** Show a one-line 'GUIDE: pause menu' chip while the sheet is squeezed.
- **Acceptance:** At TEXT SIZE 115 and 130 in Ch IV and VI, G shows the guide or a chip that says where it went.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Merged / aliases:** R39F-08

### PR-0390 [polish, narrative] (new, FFX-2 only): Ch XIII Trema and Ch XV Den of Woe open with a third-person narrator; the writing bible gives FFX-2 Yuna as chapter narrator

- **Game / chapter / state:** FFX-2 only / Ch XIII Trema pre-scene, Ch XV Den of Woe pre-scene
- **Observed:** Unnamed third-person lines: 'Ten old spheres. Paine's recordings, every one.' and 'Under Bevelle, a dungeon goes down a hundred floors. At the top, a stranger told the kids a story.' Ch V's closing narration is first-person Yuna ('Rikku talked the whole way. I let her.').
- **Expected:** research/writing-bible.md 2.2: FFX-2 opens chapters with Yuna's voice, lighter than Tidus's and forward-looking.
- **Repro:** Ch XIII and Ch XV, pre-battle scene, first four lines.
- **Evidence:** critic/rounds/round-22/evidence/ffx2-den-of-woe-win/run.json dboxTimeline; src/story/scripts/ffx2-den-of-woe.ts lines 59-63; src/story/scripts/ffx2-trema.ts lines 79-82
- **Confidence:** medium (the bible is our own style guide; the owner may prefer the third person)
- **Requirement:** research/writing-bible.md 2.2
- **Fix:** Rewrite the eight lines in Yuna's first-person voice, or record the third person as an approved variation.
- **Acceptance:** The pre-scene lines of Ch XIII and XV read as Yuna, or a decision row records the variation.
- **Tags:** introducedByCandidate false, regressionVsLive false

### PR-0391 [polish, interface] (new, 4K): at 3840x2160 the enemy affinity row's labels run into each other and the coach mark and PAUSE label draw much smaller than the menu

- **Game / chapter / state:** FFX / X (seen); other chapters not checked at 4K
- **Observed:** At 3840x2160 in Ch X (first menu) the Mortibody panel's affinity row prints overlapping labels (FIR/THU/WAT/HOLY/GRAV run into each other) and the Auron coach mark and PAUSE label render at a much smaller size than the command menu and party plates.
- **Repro:** PYREFLY_BROWSER=gpu, route seymour-natus, size 3840x2160, seed 1, look at 10-first-menu-coach.png
- **Confidence:** high
- **Requirement:** CHK-009, CHK-003 at 4K (RUBRIC 5 deep size rotation)
- **Where:** evidence/gaps/seymour-natus-win-hires-3840x2160/10-first-menu-coach.png
- **Fix:** Scale the enemy affinity row and coach mark with the same HUD scale as the command menu, or cap the row to fit its panel at large viewports.
- **Acceptance:** 4K first menu shows non-overlapping affinity labels and coach text of comparable size to the menu

### PR-0392 [polish, interface] (new, FFX-2): a Phoenix Down's target cursor opens on a living ally, so Enter on the default wastes it; the revive itself was not read back

- **Game / chapter / state:** FFX-2 / VI
- **Observed:** With Paine KO'd in Ch VI, choosing Phoenix Down puts the cursor on Yuna (alive); Paine needs two Right presses; Enter on the default would waste the item.
- **Repro:** Ch VI, seed 1, real keys: Rikku Item > Phoenix Down while Paine is KO'd; evidence/gaps/ffx2-leblanc-pd3/52-phoenix-target.png and leblanc-log.json (pd-trail yuna, rikku, paine)
- **Confidence:** medium
- **Requirement:** CHK-004 (advice reachable and executed), CHK-015
- **Where:** FFX-2 item target step
- **Fix:** Default a revive item's cursor to the first KO'd ally when one exists (check against the FFX-2 source before changing).
- **Acceptance:** cursor opens on the KO'd ally
- **Note:** Esc out of the White Magic submenu and Item are reachable by real keys (gap pass), so the Ch VI 12-minute stall of the capture run was the route, not the game (see PR-0348). What the original FFX-2 does with a revive cursor was not checked against a source.

### PR-0393 [polish, interface] (new, FFX-2): at the target step the reticle ovals draw over the command list and the enemy-move text

- **Game / chapter / state:** FFX-2 / V, XVI
- **Observed:** In the Vegnagun Tail and Ixion target steps the pink reticle ovals draw over the command list and the enemy-move panel text.
- **Repro:** Ch V Yuna as Lady Luck, Skill > Attack Reels target step; evidence/gaps/ffx2-vegnagun-shuyin-luck/30-reel-attack-reels-a.png
- **Confidence:** medium
- **Requirement:** CHK-008, CHK-010
- **Where:** FFX-2 target step
- **Fix:** Dim or hide the command list during the target step, or draw the reticles under the HUD.
- **Acceptance:** labels readable during the target step

### PR-0394 [polish, delivery] (new, low confidence): on emulated slow 4G a reload at the board took 36 s to DOMContentLoaded in 3 of 4 runs (first load 8.3 s); the first Enter stays on the title at least 3.6 s

- **Game / chapter / state:** both
- **Observed:** Reload after reaching the board under 1.6 Mbit/s took 36 s in 3 of 4 runs against 8.3 s for the first load; 8-9 requests were pending when it started. Cause not established.
- **Repro:** critic/rounds/round-22/scratch/arrival.mjs 4
- **Confidence:** low
- **Requirement:** CHK-017 load clause; RUBRIC 2 platform goals (load under five seconds)
- **Where:** evidence/gaps/arrival/arrival.json
- **Fix:** Establish whether background preloads starve the reload; defer them on slow links.
- **Acceptance:** reload on throttled network no slower than the first load

### PR-0395 [polish, delivery] (new, D22-06): FFX-2 Ch IV, V and XIII run 1.0 to 1.5 percent of battle frames over 34 ms (FFX at most 0.26) and single frames reach 474 to 533 ms in four chapters

- **Game / chapter / state:** FFX-2 / IV, V, XIII / live battle, 1600x900, headless Chromium 153 GPU on RTX 5070 Ti, probe attached
- **Observed:** All 17 probed chapters hold 59.5 to 60.0 fps overall (8,716 s, 0.40 percent of frames over 34 ms), but the three FFX-2 chapters above run 1.0 to 1.5 percent against 0.26 percent or less for every FFX chapter, and a half-second frame occurs once or more in four chapters. Host load was not recorded (three jobs ran at once) and the probe adds its own copy cost, so the figures are conditional. Cause not established; the on-demand 2 MB twirl keys of PR-0327 are a suspect for the dressphere chapters.
- **Expected:** A steady 60 fps without a visible stall; round 21 read 0 frames over 50 ms on a single-lane run.
- **Repro:** node critic/runner/lib/route.mjs ffx2-trema win --continuity on a quiet host; compare slowFrames and maxDtMs.
- **Evidence:** critic/rounds/round-22/continuity/ffx2-trema-win-r22/continuity/continuity.json (probe), ffx2-bahamut-win-r22, ffx2-vegnagun-shuyin-win-r22, seymour-flux-win-r22
- **Confidence:** medium (host load not recorded)
- **Requirement:** RUBRIC 2 (60 fps, frame-time spikes reported)
- **Fix:** Re-run those three alone with the quiet-host marker and record when each over-34 ms frame falls against network and dressphere-change events.
- **Acceptance:** On a quiet host, Ch IV, V and XIII hold under 0.5 percent of frames over 34 ms and no frame over 250 ms.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### PR-0397 [polish, harness] (critic tooling, new): the route's target matcher resolves "Yuna" to "Yunalesca" and "Potion" to "Al Bhed Potion", which cost the Ch II run

- **Game / chapter / state:** both / II, VIII
- **Observed:** Ch II Yunalesca: the advice 'Phoenix Down -> Yuna' was confirmed on 'yunalesca' with mismatch:false for turns 95 to 112 (engineDid targets [yunalesca], her HP unchanged at 41,735), so Yuna stayed at 0/2450 and the route ended in a defeat at 10:28. Ch VIII Evrae turns 62, 64, 67: advice 'Potion' pressed 'Al Bhed Potion'. Four runs read Summon rows as took:null although the engine summoned.
- **Expected:** The matcher uses exact labels, so the evidence shows the advice executed or flags a mismatch.
- **Repro:** critic/rounds/round-22/evidence/yunalesca-win/run.json picks 95-112; evrae-airship-win picks 62, 64, 67.
- **Evidence:** critic/rounds/round-22/evidence/yunalesca-win/run.json
- **Confidence:** high
- **Requirement:** RUBRIC 5 (separate harness failures from product failures)
- **Where:** critic/runner/lib/route-fight.mjs (suspected)
- **Fix:** Match on the whole label, case-insensitively, before any substring.
- **Acceptance:** A rerun of Ch II seed 1 throws its Phoenix Downs at Yuna.
- **Tags:** introducedByCandidate false, regressionVsLive false

### PR-0398 [polish, harness] (critic tooling, new): a continuity retry overwrites the whole review's continuity-summary.json (the chief recovered the 17-chapter aggregate from run.log into continuity-summary-r22-17ch.json)

- **Game / chapter / state:** both / all
- **Observed:** critic/rounds/round-22/continuity/continuity-summary.json has 0 s of battle and UNVERIFIED for both checks (the r22b Ixion rerun overwrote it); the aggregate exists in the task brief and in each chapter's continuity.json.
- **Expected:** One summary of the 17 measured chapters, as validateReport requires for the report's continuity field.
- **Repro:** Open the file.
- **Evidence:** critic/rounds/round-22/continuity/continuity-summary.json; critic/rounds/round-22/continuity/continuity-summary-r22-17ch.json; critic/rounds/round-22/continuity/run.log
- **Confidence:** high
- **Requirement:** RUBRIC 6a: deep report carries the harness aggregate
- **Fix:** Merge the 17 per-chapter files into one summary before the report is validated; I checked the sums (head over 1688, feet over 1749).
- **Acceptance:** critic-clear accepts the report.
- **Tags:** introducedByCandidate false, regressionVsLive false

### PR-0401 [polish, visual] (new): a Yu Pagoda appears out of a white flash with no fade (Ch III) and Overdrive Sin is absent for three frames and then pops in (Ch XVIII)

- **Game / chapter / state:** FFX / III, XVIII / after a flash; battle start
- **Observed:** Strip jerk-005-yu-pagoda-right shows the pagoda present after a flash with no fade-in; strip jerk-000-overdrive-sin shows frames -6 to -4 with no Sin, then Sin's head in place.
- **Expected:** An entrance fades or is covered by a deliberate beat.
- **Repro:** Live, seed 1, 1600x900: Chapter III (link 3), Chapter XVIII battle start. (seed 1)
- **Evidence:** critic/rounds/round-22/continuity/braskas-final-aeon-win-r22/continuity/strips/jerk-005-yu-pagoda-right.jpg; critic/rounds/round-22/continuity/sin-face-win-r22/continuity/strips/jerk-000-overdrive-sin.jpg
- **Confidence:** medium
- **Requirement:** CHK-027 (popping); RUBRIC 6 feel
- **Fix:** Fade the pagoda in under the flash tail; hold the battle reveal until Sin's painting is decoded.
- **Acceptance:** Strips at those two moments show a fade or no empty frames.
- **Merged / aliases:** fan: popping (2)

### PR-0402 [polish, feel] (new): two boss physical attacks land from across the field (Braska's Left-Arm Strike on Yuna for 2,402; Paragon on Yuna for 1,561) with no travel or reach

- **Game / chapter / state:** both / III (FFX), XIII (FFX-2) / enemy action
- **Observed:** Timed sequences show the damage numeral on Yuna while the boss stays on its side of the field.
- **Expected:** A physical strike reads as reaching its target (a lunge, a projectile or a cut to contact).
- **Repro:** Live, seed 1: Chapter III seq-action-playing f00; Chapter XIII seq-action-playing f03-f05. (seed 1)
- **Evidence:** critic/rounds/round-22/evidence/braskas-final-aeon-win/seq-action-playing/f00.jpg; critic/rounds/round-22/evidence/ffx2-trema-win/seq-action-playing
- **Confidence:** medium (stills at 250 ms; no continuous clip)
- **Requirement:** RUBRIC 6 feel (action and reaction timing)
- **Fix:** Give large-boss physical moves a reach beat (lunge or contact cut); release 39 already did this for the party's strike on Braska.
- **Acceptance:** A clip of each move shows contact before the numeral.
- **Merged / aliases:** fan: attacks that do not connect (2)

### PR-0403 [polish, visual] (new, low confidence): mid-fight in Ch XIV the whole frame, HUD included, is washed grey with only Yuna in colour and a figure cut off at the right edge

- **Game / chapter / state:** FFX / XIV / mid-fight
- **Observed:** One capture (23-midfight); whether it is a deliberate summon or Overdrive dim was not established.
- **Expected:** A deliberate dim reads as one, and no figure is cut by the frame edge.
- **Repro:** Live, seed 1, 1600x900, Chapter XIV 23-midfight. (seed 1)
- **Evidence:** critic/rounds/round-22/evidence/isaaru-via-purifico-win/23-midfight.png
- **Confidence:** low
- **Requirement:** RUBRIC 6 visual
- **Fix:** Identify the beat at that moment; if it is a summon dim, leave it and frame the cut-off figure.
- **Acceptance:** A labelled capture of the same beat.
- **Merged / aliases:** fan: other (Isaaru grey wash)

### PR-0404 [polish, delivery] (R39F-07, carried from the focused review, not re-measured): the 2x backdrop masters depend on the browser's link estimate; below 10 Mbps six un-held backdrops stay 1x

- **Game / chapter / state:** both / all / art tier choice
- **Observed:** Recorded by critic/reviews/c7135bec-focused.json; this round saw 2x masters requested at 2000x1012 and 2560x1440 and 3x at 3840x2160 on this machine's link, and did not test a slow link for art tier.
- **Expected:** The art tier follows the window and GPU as the changelog says, or the link rule is stated.
- **Repro:** As in the focused review.
- **Evidence:** critic/reviews/c7135bec-focused.json; critic/rounds/round-22/evidence/gaps/seymour-flux-win-hires-2560x1440/network-media.json
- **Confidence:** medium
- **Requirement:** CHK-013; release 39 claim
- **Fix:** State the link rule in the changelog or drop it for held backdrops.
- **Acceptance:** At 2560x1440 with a throttled link the documented tier loads.
- **Merged / aliases:** R39F-07

### PR-0406 [polish, visual] (R39F-11, carried from the focused review): at 1280x720 and 1366x768 the pinned Sensor card touches the tips of one of Natus's wing spikes (1.6 to 2.3 percent of his painted pixels; live 38: 0)

- **Game / chapter / state:** FFX / X / first menu
- **Observed:** Recorded by critic/reviews/816d80f9-focused.json; at 1440x810 and wider the card is clear (0.0 to 0.1 percent), confirmed again at 1600x900, 2000x1012, 2560x1440 and 3840x2160 this round.
- **Expected:** No panel over a boss painting (CHK-008).
- **Repro:** Ch X first menu at 1280x720.
- **Evidence:** critic/reviews/816d80f9-focused.json; critic/rounds/round-22/evidence/gaps/composites/natus-2560x1440.jpg
- **Confidence:** high
- **Requirement:** CHK-008
- **Fix:** Lift the card a few pixels more in the narrow framing rows.
- **Acceptance:** At 1280x720 and 1366x768 the card covers 0 percent of Natus.
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature false
- **Merged / aliases:** R39F-11

### PR-0334 [polish, feel] (confirmed, was low confidence): the twirl start draws a hard-edged white rectangle over the changing girl in every dressphere change

- **Game / chapter / state:** FFX-2 only / Ch V, VI, XI, XV
- **Observed:** A white slab about 60 by 110 px at 1600x900 sits over the girl for 150 to 450 ms (300 to 600 ms in Den of Woe) at the start of the twirl in 7 of 7 captured changes (Leblanc 1,500 ms; Vegnagun 1,350-1,650 ms; Fallen Aeons 1,350-1,500 ms and 1,500-1,800 ms; Den 1,800-2,100 ms and 1,500 ms; Vegnagun #2 1,500-1,800 ms), before the dress swaps. Merged with the visual auditor's re-observation (four chapters: Leblanc Paine Warrior to Songstress, Den of Woe Yuna White to Black Mage, Trema Paine Dark Knight to Songstress, Vegnagun Paine Dark Knight to White Mage; evidence critic/rounds/round-21/vis/leb-pair.jpg, sph-ffx2-den-of-woe-win.jpg, sph-ffx2-vegnagun-shuyin-win.jpg, trema-sph.jpg). Confidence is now high (7 of 7 clipped changes); it persists after the 119 new paintings and the 25 held 2x masters; the correction is in the key's alpha edge, never a repaint of approved art.
- **Expected:** A soft twirl-in (the ribbon aura seen in the close-up) with no block shape.
- **Repro:** Any FFX-2 Garment Grid change at 1600x900, seed 1; frames in critic/rounds/round-21/feel-narr/spheres4.jpg.
- **Evidence:** critic/rounds/round-21/feel-narr/spheres4.jpg
- **Confidence:** high
- **Requirement:** RUBRIC 6 animation and readable effects
- **Fix:** Suspected: the first key of the twirl set is drawn unmasked or at the wrong alpha box; check the key's alpha edge and ease it in. Visual and animation auditors to cross-check the master.
- **Acceptance:** Read 7 consecutive changes at 50 ms steps: no flat white rectangle with straight edges at any frame.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Release 39 says the white rectangle at the start of an outfit change is gone; this round did not grade a twirl, so the fix is not verified. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0314 [polish, feel] (carried, STALLED: open in 19b, 20 and 21): the FFX-2 dressphere shot is absent in 6 of 7 captured changes and the new push-in is not seen in any of them

- **Game / chapter / state:** FFX-2 only / Ch V, VI, XI, XV
- **Observed:** Seven clipped changes: Vegnagun Paine dark knight to white mage (first change) plays the close-up from 3.15 s to about 4.6 s (1.45 s hold, ribbon aura then the new dress); the other six (Leblanc Paine, Vegnagun Paine #2, Fallen Aeons Paine #1 and #2, Den of Woe Yuna #1 and #2) show the girl's small-frame twirl and nothing else: the framing at the start and end is the same (Leblanc 900 vs 2,700 ms, Fallen Aeons 1,650 vs 2,550 ms), so neither the close-up nor the 1.22x push-in of D-346 plays. In every absent case an enemy turn starts 0.9 to 4.3 s after the change (meta.json events), the likely gate. Round 20: 5 of 10 absent.
- **Expected:** Every dressphere change gets a held close shot or, where none is clean, the push-in (D-346).
- **Repro:** critic/rounds/round-21/evidence/ffx2-leblanc-win, ffx2-vegnagun-shuyin-win, ffx2-fallen-aeons-win, ffx2-den-of-woe-win clips/spherechange and spherechange-2; read with critic/rounds/round-21/feel-narr/strip.py (seed 1, 1600x900, Active, real keys).
- **Evidence:** critic/rounds/round-21/feel-narr/spheres4.jpg, veg-sphere.jpg, veg-sphere2.jpg, leb-sphere.jpg, fa-sphere.jpg
- **Confidence:** medium (clips and meta events; gate not traced)
- **Requirement:** RUBRIC 6 feel: coherent camera, impactful but readable effects; D-346
- **Fix:** Per the stalled-area rule, a written method check before a third attempt: log which gate (another actor acting, no clean frame, menu up) refused each shot, then decide whether the push-in may start at the hand-back after the enemy action, or whether an enemy action should queue behind a dressphere shot in Active mode. No Wait-mode change without Bailey.
- **Acceptance:** In Leblanc, Vegnagun and Fallen Aeons at 1600x900 seed 1, at least 5 of 6 changes show a shot or a measurable camera push for at least 1.4 s, with no enemy action inside it and the command menu closed.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature true
- **Note:** Release 39 says the close-up on a change now starts with it; not graded this round. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0330 [polish, interface] (carried, mostly repaired): the advisor card no longer shrinks to a stub, but its effect sentence is ellipsised in Ch VII and XII and absent in Ch XVIII (I-2)

- **Game / chapter / state:** FFX only (FFX-2 cards are full) / Ch VII, IX, XII, XVII, XVIII
- **Observed:** Ch VII "Take the pouch off Guado Guardian A: one..."; Ch XII "It puts Cheer on the party; next, Mortiphasm Spells..."; Ch XVIII and XVII show move, path and cost with no effect. Ch IX and XIII/XIV fit. Release 39 says the narrow boxes keep cost and effect.
- **Expected:** Every card prints the move, target, menu path, cost and a reason (r38's own acceptance).
- **Repro:** Fresh profile, seed 1, real keys to the first menu of Ch VII, IX, XII, XVII, XVIII at 1600x900.
- **Evidence:** critic/rounds/round-22/evidence/seymour-anima-macalania-win/11-advisor.png; critic/rounds/round-22/evidence/seymour-omnis-win/11-advisor.png; critic/rounds/round-22/evidence/sin-face-win/11-advisor.png
- **Confidence:** high
- **Requirement:** RUBRIC section 2 (advisor says where and what it costs), CHK-004
- **Fix:** Let the effect sentence wrap to a second line in the narrow box, or author a short form for the long ones.
- **Acceptance:** advisorClippedOrOverflowing is [] in Ch VII, XII, XVII and XVIII and each card shows an effect.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** I-2
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0354 [polish, interface] (carried, widened to Ch IX): the intent card says 'Deals no damage' above damage rows

- **Game / chapter / state:** FFX only / Ch IX, Ch XII
- **Observed:** Ch XII: 'Mortiphasm Spells SCRIPTED Deals no damage.' then DAMAGE Tidus 2,066-2,333 34% HP, Auron 2,066-2,333. Ch IX: 'Daigoro SCRIPTED Deals no damage.' above DAMAGE Lulu 544-615 42%, Kimahri 517-584, Yuna 553-624 (identical text in round 20; intent code unchanged).
- **Expected:** Honest intent: either the damage sentence or the rows, never both contradictory.
- **Repro:** Fresh profile, real keys to the first menu of Ch XII and Ch IX, press E.
- **Evidence:** critic/rounds/round-21/evidence/seymour-omnis-win/12-intent-E.png; yojimbo-cavern-win/run.json intentText
- **Confidence:** high
- **Requirement:** RUBRIC: honest enemy intent
- **Fix:** Suppress the 'Deals no damage' line when the ability has damage rows or fix the 'none' formula rows (suspected: src/battle/ffx/intent.ts describeAbility on placeholder rows).
- **Acceptance:** Intent text of both fights has no 'Deals no damage' beside a DAMAGE block.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0326 [polish, audio] (carried, third consecutive review, STALLED): the first UI sounds of a cold session are the procedural synth (57 of 6,128 logged effects; sfxLog[0] is synth in 16 of 19 runs, 2.1 to 10.8 s), before the recorded sprites decode

- **Game / chapter / state:** both / title, chapter select, all
- **Observed:** On a fresh profile, sfxLog[0] is synth in 34 of 39 runs (cursor-move 98 and confirm 11 of 109 synth entries), at AudioContext time 1.8 to 3.7 s; the sprite or v2 bank takes over from 2.1 to 6.9 s (median 3.1 s; 8.5, 13.6 and 36.3 s in three loaded runs). 'battle-start' (TitleScreen.ts:196, void audio.playSfxFromSprite('battle-start')) appears in 0 of 39 sfxLogs; before PR-0326 it was synth in 24 of 24, so the title's press-start cue is now silent where it was the arcade synth. Round 20 measured 25 of 27 and 0 of 27. The music half improved: the previous cue was still current at the pre-scene sample in 1 of 39 runs (3 of 27 before). Capture ran 3 to 5 lanes on one host, so load is a candidate cause, but the pattern did not change. GAP PASS addendum (real keys, fresh profile, 1600x900 gpu, five runs plus two at 4x CPU throttle): the title Enter at about 0.9 s asked for no sound in 7 of 7 runs; the first sound is the first board cursor-move through the sprite at 3.8-4.4 s after load. TitleScreen.advance calls playSfxFromSprite('battle-start') and plays nothing if the v1 sprite is not decoded yet; unthrottled and throttled behave the same, so it is not a load effect (the sprite decode time was not measured directly). Suggested smallest fix: warm the SFX sprite decode at boot, or gate the press on it. Evidence: critic/rounds/round-21/evidence/gaps/title-sfx/runs-thr1.json and runs-thr4.json.
- **Repro:** Fresh profile, headless Chromium PYREFLY_BROWSER=gpu, live URL, press Enter at the title (real key), then move the board cursor; read window.__pyrefly audio debug sfxLog (e.g. critic/rounds/round-21/evidence/seymour-flux-win/audio-debug.jsonl, last row: first entry 'confirm' via synth at 2.752 s, no 'battle-start'). Seeds are not involved.
- **Evidence:** critic/rounds/round-22/evidence/seymour-flux-lose/audio-debug.jsonl; critic/rounds/round-22/evidence/ffx2-bahamut-lose/audio-debug.jsonl
- **Confidence:** medium (the observation is firm; the cause is unestablished)
- **Requirement:** CHK-001 step 3 (nothing falls back to the synth path), PR-0326
- **Where:** src/app/screens/TitleScreen.ts:196; src/audio/AudioManager.ts:524-540 (suspected, not traced at run time)
- **Fix:** Smallest probe first, no product change yet: on a quiet host, log the return value and the branch taken by AudioManager.playSfxFromSprite('battle-start') (src/audio/AudioManager.ts:524: ctx null, no manifest sfx, sprite not decoded within waitMs, or no slice) to say whether this is load or a branch. Then either preload the v1 sprite before the title's first press or let the first UI sounds wait for it (PR-0326's own intent: the cue plays from its sprite or not at all).
- **Acceptance:** A fresh-profile run on a quiet host shows 0 via:synth entries in sfxLog and one 'battle-start' via sprite at the title press (PR-0326's acceptance check), repeated in at least 5 runs.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0301 [polish, feel] (carried, re-observed): FFX-2 chain seams still hand control back later than 2.5 s

- **Game / chapter / state:** FFX-2 only / Ch V link 2, Ch VI link 2
- **Observed:** Leblanc link 2 and Vegnagun link 2 (seq-seam-2, eight frames from 45 ms to 2,513 ms) show the new arena, the party and a name plate (Logos, Vegnagun at about 1.4 s) but no command menu by 2.51 s. Same as round 20.
- **Expected:** Control returns in about 0.6-0.75 s as at live 32, or the longer opening is Bailey's choice.
- **Repro:** critic/rounds/round-21/evidence/ffx2-leblanc-win/seq-seam-2 and ffx2-vegnagun-shuyin-win-again/seq-seam-2 (sheet critic/rounds/round-21/feel-narr/seams2.jpg).
- **Evidence:** critic/rounds/round-21/feel-narr/seams2.jpg
- **Confidence:** medium
- **Requirement:** RUBRIC 6: transitions and dead waiting
- **Fix:** Per the existing ticket: shorten the seam's battle-start moment for FFX-2, or ask Bailey whether the longer opening is intended.
- **Acceptance:** Seam to menu-up under 1.5 s on Leblanc and Vegnagun.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0363 [polish, interface] (new; R21-IF-04 + R21-FEEL-02, emulated pad only): a pad's Circle that resumes from the pause also cancels the menu level or the target cursor underneath, where keyboard P keeps both

- **Game / chapter / state:** both (pad Circle; FFX Ch I and FFX-2 Ch IV)
- **Observed:** Pause matrices: pad Circle resume from a Special submenu returns to the top row (rows 4 to 6) and from targeting returns with targets 0; keyboard P keeps both (rows 4, targets 2). FFX-2 pad White Magic: rows 7 to 3. Merged with R21-FEEL-02: FFX Flux pad matrix row 10, pause opened with Start while targeting (targets 2); Circle resumes with targets 0, where keyboard P resumes with targets 2. FFX-2 pad White Magic: rows 7 to 3. Emulated standard-mapping pad, not real hardware; one run each (the FFX matrix was shifted by PR-0362).
- **Expected:** Resume restores the exact state, as the keyboard does.
- **Repro:** seymour-flux-pausematrix-1600x900-pad cases 8, 10; ffx2-bahamut-pausematrix-1600x900-pad case 8.
- **Evidence:** critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900-pad/run.json; critic/rounds/round-21/evidence/ffx2-bahamut-pausematrix-1600x900-pad/run.json
- **Confidence:** medium-low
- **Requirement:** CHK-015, CHK-006
- **Fix:** Consume the Circle edge in the pause handler so the menu does not also see it.
- **Acceptance:** Pad matrix: after resume rows and targets equal their pre-pause values.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0251 [polish, interface] (carried, narrowed): battle labels keep the 14 px floor at 1600x900 (advisor 14.2 px minimum), but the strategy guide's labels draw at 11.4 px at 1280x720 and 9.1 px at 1024x768 (R39F-05, reused)

- **Game / chapter / state:** both
- **Observed:** 1600x900: FFX 12.25 px (OD, Overdrive, key labels), colour-order note 12 px; FFX-2 command-info label 11.68 px, max-HP/MP numbers 12.5 px; dialogue role chip 8.51 px. 2000x1012: 13.77 px (FFX), 13.13 px (FFX-2). 1440x900: 11.03 px; 1024x768: 7.84 px with 27 distinct elements under 14. 2560 and 4K pass (14 px).
- **Expected:** 14 px floor on desktop.
- **Repro:** textSweep fields of the first-menu runs.
- **Evidence:** critic/rounds/round-21/audit-if1.tmp.mjs output; evidence/seymour-flux-first-1024x768/run.json
- **Confidence:** high
- **Requirement:** CHK-003
- **Fix:** Raise the HUD key labels and label classes to a floor in CSS.
- **Acceptance:** textSweep minEffPx >= 14 at 1600x900 and 2000x1012.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** I-8; R39F-05
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0366 [polish, visual] (carried, widened): HUD panels stand over painted figures: party plates cover the lower legs of figures standing right (Ch II, III, VII, VIII, XVIII), the HP bars hide Yuna's lower half during Left-Arm Strike, the chain counter and enemy-move card cover Bahamut's lower body, Omnis's intent text runs across the fight

- **Game / chapter / state:** FFX-2 only / Ch IV, VI, XV
- **Observed:** (a) Ch IV Bahamut 1024x768 first menu: the ACTS NEXT intent card covers Bahamut's torso and Paine, and its damage table truncates names to 'YU...' and 'RIKK...'. (b) Ch XV Den of Woe 2560x1080 after a chain hit: the CHAIN x1.45 slab covers Rikku's and Paine's legs. (c) Ch VI Leblanc 2560x1440: the guide card's MORE row overlaps Yuna's raised pistol.
- **Repro:** FFX-2 Ch IV at 1024x768; Ch XV at 2560x1080 after the first chain hit; Ch VI at 2560x1440 first menu, seed 1.
- **Evidence:** critic/rounds/round-22/evidence/braskas-final-aeon-win/23-midfight.png; critic/rounds/round-22/evidence/seymour-anima-macalania-win/23-midfight.png; critic/rounds/round-22/evidence/sin-face-win/23-midfight.png; critic/rounds/round-22/evidence/braskas-final-aeon-win/seq-action-playing/f00.jpg; critic/rounds/round-22/evidence/seymour-omnis-win/23-midfight.png
- **Confidence:** high that they are seen; the 4:3 and ultrawide shapes were not captured in round 20
- **Requirement:** CHK-008 no panel intersects a face or a weapon
- **Where:** first menu / chain
- **Fix:** Put the 4:3 intent card in the HUD-free zone (or shrink to the strip form below 1100 px wide), lift the chain slab above the girls' feet at ultrawide, keep the guide card clear of the gunner's raised arm; measure each with the CHK-008 matrix.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Merged / aliases:** visual-targets: party plates over lower legs; fan: UI covering the action (major, downgraded: no face or weapon is covered; feet and lower bodies under plates)
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0364 [polish, visual] (new; V21-VIS-01): in the FFX-2 run-in the camera pans and Yuna is cut off at the left frame edge for about 1 s

- **Game / chapter / state:** FFX-2 only / Ch VI (any FFX-2 chapter with a run-in)
- **Observed:** Leblanc 1600x900, Rikku Thief's Attack run-in at about t=1.5-1.9 s of the attack clip: the shot follows Rikku toward Ormi and Yuna stands half, then almost fully, outside the left edge while the white Paine stays in view.
- **Repro:** FFX-2 Ch VI Leblanc seed 1, party order Yuna, Rikku, Paine, Rikku Attack on Ormi; extract frames from ffx2-leblanc-win/clips/attack/attack.mp4 at 1.5 s and 1.9 s.
- **Evidence:** critic/rounds/round-21/vis/leb-att-pair.jpg
- **Confidence:** medium (one clip, one state; other chapters not checked)
- **Requirement:** RUBRIC feel: coherent camera; CHK-014
- **Where:** run-in follow camera (D-354)
- **Fix:** Clamp the run-in follow so every party member stays inside the frame (or limit the pan to the actor's own span) and check at 1600x900 and 2000x1012.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** Release 39 says the camera keeps every girl in the frame on a run-in; not graded this round. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0344 [polish, visual] (updated): the painted plate wings fill the 21:9 void with no mirrored lantern, but each meets the plate at a hard tilted seam with a bright lantern at the very edge; the r20 "Bahamut reads about 12 percent smaller at 2000x1012" half was not re-measured

- **Game / chapter / state:** FFX-2 only / Ch IV, XV
- **Observed:** Ch IV Bahamut 2560x1080: left and right wing strips cover the former void with no mirrored lantern, but each meets the plate at a vertical, slightly tilted seam with a brighter lantern at the edge. Ch XV was viewed at 2560x1080 with the same two-wing layout. The round-20 text of this id covered the mirrored lantern and a 12 percent smaller Bahamut at 2000x1012 (low-medium confidence). Release 38's painted wings (D-343) removed the mirrored lantern at 2560x1080 (Ch IV and XV); the seam is the remaining defect; the 2000x1012 framing was not captured (CHK-014 reads 1024x768, 2560x1080, 2560x1440 only).
- **Repro:** FFX-2 Ch IV, 2560x1080 first menu; crop vis/bah-wings.jpg.
- **Evidence:** critic/rounds/round-21/vis/bah-wings.jpg
- **Confidence:** high
- **Requirement:** RUBRIC visual: composition, consistency
- **Where:** plate wings at 21:9
- **Fix:** Blend the strip into the plate over 40-80 px (a soft mask) and darken the edge lantern; approved painting unchanged.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** Release 39 says the pipe slabs at Bevelle's plate edges in wide windows are gone; 21:9 was not captured this round. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0365 [polish, visual] (new; V21-VIS-02): Ch XII first menu hides one Mortiphasm disc behind Yuna and Auron (5.8 percent visible at 2560x1440, 4.4 percent at 2000x1012)

- **Game / chapter / state:** FFX only / Ch XII Seymour Omnis
- **Observed:** seymour-omnis first menu, seed 1: the rect-visibility readout for the four discs is 0.558, 0.058, 0.699 and 0.804 at 2560x1440 (0.531, 0.044, 0.709, 0.828 at 2000x1012); the lower-left disc is covered by the two girls' bodies in the frame. The other three discs are visible. The round-20 1600x900 reading of this state was not measured, so whether release 38 changed it is unknown (the capture owner's first-menu frames were retaken with the top row asserted).
- **Repro:** FFX Ch XII seed 1, open the first menu, read run.json rects or the crop vis/omnis-discs.jpg.
- **Evidence:** critic/rounds/round-21/evidence/seymour-omnis-first-2560x1440/run.json; critic/rounds/round-21/vis/omnis-discs.jpg
- **Confidence:** high for the frame; unknown whether new
- **Requirement:** CHK-011 no targetable enemy more than about 25 percent occluded in the default framing
- **Where:** first command menu
- **Fix:** Offset the disc formation or stage the party so no disc is under 75 percent visible (the round-20 reading at 1600x900 was not measured, so whether release 38 changed it is unknown).
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** See PR-0382: the Ch XII party heap stands in front of the discs. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0310 [polish, visual] (carried, narrowed): Braska's Final Aeon now stands clear of the party with both Yu Pagodas visible; with Yuna first her staff keeps a sliver of overlap with the aeon through the menu (R39F-10)

- **Game / chapter / state:** FFX only / Ch III Braska's Final Aeon
- **Observed:** Ch II: Yunalesca stands clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012. Ch VIII: Rikku stands beside the coil without overlap in every window shape. Ch III (staging switched off by decision): Auron stands in front of the Yu Pagoda base and the party's weapons reach the boss's sword. Downgrade reason: release 38 restaged Ch II (Yunalesca clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012) and Ch VIII (Rikku beside the coil with no overlap at 2560x1440, 2560x1080, 1440x900 and 1024x768); the Ch III table is written and switched off by Bailey's pick (CHAPTER_III_STAGED = false), so what remains is a known and chosen state at polish severity.
- **Repro:** FFX Ch III first menu, seed 1, 2560x1440 (braskas-final-aeon-first-2560x1440/11-first-menu-clean.png).
- **Evidence:** critic/rounds/round-21/vis/yuna-gap.jpg; vis/braska-gap.jpg
- **Confidence:** high
- **Requirement:** CHK-014 / ground contact and scale
- **Where:** first menu
- **Fix:** Enable the written Chapter III table (CHAPTER_III_STAGED) when Bailey picks the 'another way' round; nothing to do for II and VIII.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R39F-10
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0308 [polish, combat] (carried, narrowed): the Swordplay tiers now differ and carry Bailey's adoption of the estimates (D-413, verified live for Spiral Cut, jsdom for the other three); open: the Bushido button order is still our estimate

- **Game / chapter / state:** FFX / Ch II, XII, XVII, XVIII (Auron's Bushido, Tidus's Swordplay)
- **Observed:** FIXED: each Bushido now plays its own sourced length and order (Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6; the 7-chip default is gone), typed by real keys in six live runs. STILL OPEN: (1) all four Swordplay tiers play one zone and speed (12.22 percent, 1,059 ms) although the sourced ordering says stronger tiers get a narrower zone and a faster marker (ffx-combat-core 5.3 rule 2, verified 2 sources); the values are unpublished, so rule 6 forbids inventing them. (2) The button order is the GameFAQs order and labelled 'our estimate'; research D3 records that GF-KB's Shooting Star order (two Circles) matches no other source and the International table in 5.5 disagrees; the Steam HD copy would settle it. (3) Square is keyboard K / pad 2 with no on-screen key hint beyond the chip. (4) Banishing Blade and Tornado have not been seen in a real run. GAP PASS update (real keys, Ch VII Macalania, 1600x900, seed 1, Auron/Tidus gauge forced to 100: a labelled hook): Banishing Blade (7 chips, correctInputs 7, success, damage 4605) and Tornado (6 chips, correctInputs 6, success) play their own sequence, and Slice and Dice (timer 3000), Energy Rain (2600) and Blitz Ace (2200) each resolved success with travelMs 1059 and zonePercent 12.22. So the "never seen in a real run" half of this ticket is closed; the Swordplay tier numbers (no source) and the button-order estimate remain. The miss path was not exercised.
- **Expected:** The sourced ordering of Swordplay difficulty across tiers, and a sourced order for every Bushido button.
- **Repro:** od-params-probe.json (params per ability); bushido-oracle.json; yunalesca-win/run.json minigames; sin-fins-core-win-long/run.json.
- **Evidence:** critic/rounds/round-21/combat/od-params-probe.json, bushido-oracle.json; critic/rounds/round-21/evidence/*/run.json minigames
- **Confidence:** high
- **Requirement:** AGENTS rule 6 and 14; ffx-combat-core 5.3 and 5.5
- **Where:** src/data/ffx/overdrives/inputs.ts
- **Fix:** Bailey's yes to the 5.3 estimates (22/16/12/9 percent, 1,400/1,150/900/700 ms) or sourced values makes it a four-row edit in inputs.ts; check the Steam HD copy for the Bushido order; add a key legend for the Square chip.
- **Acceptance:** Swordplay zone width decreases and speed increases from Spiral Cut to Blitz Ace in od-params-probe.json; the Steam copy's Bushido order matches inputs.ts.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0369 [polish, interface] (new; R21-IF-02): in Ch XII target mode the TARGET plate lies over the disc panel's "FACING HIM" label

- **Game / chapter / state:** FFX only / Ch XII
- **Observed:** At 1600x900, 2000x1012 and 2560x1440 the 'TARGET Seymour Omnis' plate cuts the 'FACING HIM' label in half; the Sensor card also stands over the boss torso (PR-0248 pattern).
- **Expected:** Overlays do not overprint each other's labels.
- **Repro:** Ch XII, seed 1, first menu, Attack.
- **Evidence:** critic/rounds/round-21/evidence/seymour-omnis-win/16-target-single.png; seymour-omnis-first-2560x1440-targetopen/11-first-menu-clean.png
- **Confidence:** high
- **Requirement:** CHK-008
- **Fix:** Move the target plate below the disc panel or shift the disc panel one row.
- **Acceptance:** 16-target-single frame at three sizes shows 'FACING HIM' whole.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0370 [polish, interface] (carried, widened to Ch XI, XIII, XIV): a story dialogue box covers the advisor card, the guide and (Ch XIII) part of a party plate at the first menu

- **Game / chapter / state:** FFX-2 only / Ch XV
- **Observed:** At 1600x900 the Rikku/'Sphere Hunter' banner ('That's Baralai! Isn't it...?') covers the top of the intent card (name, SCRIPTED tag, damage header) and the guide's NEXT label while Yuna's menu is up; its role chip measures 8.51 px effective.
- **Expected:** Banter must not hide the information the player needs for the turn they are choosing, or the menu waits for it.
- **Repro:** FFX-2 Ch XV, seed 1, first menu at about 3.7 s.
- **Evidence:** critic/rounds/round-22/evidence/ffx2-trema-win/10-first-menu-coach.png; critic/rounds/round-22/evidence/ffx2-fallen-aeons-win/10-first-menu-coach.png; critic/rounds/round-22/evidence/isaaru-via-purifico-win/11-advisor.png
- **Confidence:** medium
- **Requirement:** CHK-002, CHK-003, CHK-008
- **Fix:** Hold the command menu or move the banner clear of the intent card; raise the role chip to the floor.
- **Acceptance:** Frame at first menu shows intent card whole.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Merged / aliases:** I-7
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0371 [polish, interface] (new, low confidence; R21-IF-05): the guide rail's NEXT and the advisor card name different actions at the same first menu (Ch IX, Ch XI)

- **Game / chapter / state:** FFX Ch IX, FFX-2 Ch XI
- **Observed:** Ch IX: guide 'Kimahri Defend -> Kimahri', advisor 'Fire Gem -> Yojimbo'. Ch XI: guide 'Yuna X-Potion -> Yuna', advisor 'Shell -> the party'. The other 16 chapters agree.
- **Expected:** Two 'next' prompts on one screen either agree or say why they differ (PR-0239 family).
- **Repro:** First menu of Ch IX and Ch XI, seed 1.
- **Evidence:** critic/rounds/round-21/evidence/yojimbo-cavern-win/11-advisor.png; ffx2-fallen-aeons-win/run.json pause.esc.text
- **Confidence:** low
- **Requirement:** RUBRIC: advisor and strategy guide are separate capabilities
- **Fix:** Label the guide as the designed line, or reconcile with the advisor.
- **Acceptance:** No unexplained disagreement in the 18-chapter first-menu sweep.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0372 [polish, onboarding] (carried, confirmed live): at 390x844 the pause OPTIONS list is a 100 px scroll box showing 4 to 5 of 10 settings; the tab strip and header clip at the right

- **Game / chapter / state:** both
- **Observed:** 390x844: MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED visible, a ghost row, then THIS ENCOUNTER; the tab strip starts at 'TER' (CHAPTER) with the first tabs off screen; brand line wraps and clips on its left edge.
- **Expected:** Accessibility rows reachable and discoverable on touch.
- **Repro:** Phone viewport, pause, Options.
- **Evidence:** critic/rounds/round-22/evidence/gaps/seymour-flux-phone-pause/phone-pause.json
- **Confidence:** low
- **Requirement:** onboarding: settings and device usability
- **Fix:** Show a scroll affordance or move accessibility rows first; verify the list scrolls by touch.
- **Acceptance:** Touch frame sequence reaches REDUCE MOTION and TEXT SIZE.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0373 [polish, audio] (carried, widened, low confidence): music cues are fetched at the moment of use: victory-ffx is not cached at the after-fight sample in 8 of 8 FFX wins, and Ch IV's scene bed was still the previous cue at the first line in 2 of 3 runs

- **Game / chapter / state:** both / all chapters with a victory cue (not IV)
- **Observed:** In 18 of 18 wins where the cue later played, victory-ffx or victory-ffx2 was not decoded at the after-fight sample (the boss cue is decoded by the first menu). In 1 of 19 victory results (evrae-airship-win, host at 100 percent CPU) the results sample 4.2 s after the fight still showed playing null and the cue undecoded although victory-ffx.mp3 had been requested; the repeat (evrae-airship-win-r2) played it. Round 20 noted the same at Chapter X ('victory-ffx not cached at the results sample'). It is unknown whether a real player on a slow connection hears a late fanfare.
- **Repro:** critic/rounds/round-21/evidence/evrae-airship-win/audio-debug.jsonl, rows after-fight (384,963 ms) and results (389,167 ms): playing null, victory-ffx cached false; compare evrae-airship-win-r2 (results: victory-ffx).
- **Evidence:** critic/rounds/round-22/evidence/ffx2-bahamut-lose/audio-debug.jsonl; critic/rounds/round-22/continuity/ffx2-bahamut-win-r22/audio-debug.jsonl
- **Confidence:** low
- **Requirement:** CHK-023 (the right cue at the real moment, no silent unintended gap); RUBRIC section 6 audio (phase transitions)
- **Where:** battle preload and results music call (suspected: BattleScreenFlow results path); not traced
- **Fix:** Suggestion only: request the chapter's victory cue with the boss cue at the first menu (the same prefetch the boss cue gets), then measure the fight-end to fanfare delay on a throttled connection before changing anything; if the measured delay is under about half a second on a slow link, close it.
- **Acceptance:** At the after-fight sample the victory cue is cached in a fresh-profile run, and the results sample shows it playing in 10 of 10 wins; a throttled-network run shows the fanfare starting within the results screen's first second.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0374 [polish, audio] (new; R21-AUD-02): FFX Ch I pause cue starts 0.5-1.0 s late and without a crossfade; FFX-2 Ch IV switches within 0.5 s

- **Game / chapter / state:** FFX only (FFX-2 behaves as expected) / Ch I
- **Observed:** Esc in FFX Ch I: boss-seymour is still current at gain 1 at +0.5 s and the pause cue is current at gain 1 by +1.0 s (150 ms sampling). FFX-2 Ch IV at +0.5 s already has the pause cue current with the boss cue fading. Gap pass PASS on the pause hand-back itself in both games (resume restores the battle cue); this is only the open-side difference.
- **Expected:** Both games duck the battle cue on opening pause with the same timing.
- **Repro:** toBattle seymour-flux then ffx2-bahamut, setSeed(1), real Esc, sample audioDebug every 150 ms.
- **Evidence:** critic/rounds/round-21/evidence/gaps/pause-audio/seymour-flux-fine.json, audio-debug-seymour-flux.jsonl
- **Confidence:** medium (one lane, host not otherwise idle)
- **Requirement:** CHK-023
- **Where:** pause open audio path
- **Fix:** Check why the FFX pause cue is requested later than the FFX-2 one; make the duck on open the same in both.
- **Acceptance:** At +0.5 s after Esc the pause cue is current or the boss cue is below gain 0.5 in Ch I.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0104 [polish, feel] (carried, 6th review, STALLED, not re-observed): a confirmed FFX-2 Shell in Wait shows only a cast pose, no name chip

- **Game / chapter / state:** FFX-2 only / Ch IV
- **Observed:** No Bahamut clip was recorded (clips 0 in all four Bahamut lanes), so the item could not be re-read; carried unchanged, UNVERIFIED this round.
- **Expected:** A name chip in Wait as in Active.
- **Repro:** Bahamut Wait mode, Yuna Shell; needs a clip.
- **Evidence:** none this round
- **Confidence:** low (carried)
- **Requirement:** RUBRIC 6
- **Fix:** Per the method check already owed for this stalled issue.
- **Acceptance:** Name chip visible during the cast in Wait.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0315 [polish, feel] (carried, not re-observed): the twirl crossfade may double-expose the neighbouring girl as well as the changer for about 0.2 s

- **Game / chapter / state:** FFX-2 only / Ch IV-XV
- **Observed:** Not measured at the 150-300 ms steps used here; frames at 1,500-1,800 ms in the Den clips show the party blended with the changer but the double image could not be separated from the white slab (PR-0334).
- **Expected:** A clean crossfade of the changing girl only.
- **Repro:** Garment Grid change at 50 ms steps.
- **Evidence:** critic/rounds/round-21/feel-narr/spheres4.jpg
- **Confidence:** low
- **Requirement:** RUBRIC 6
- **Fix:** Re-measure after PR-0334 is repaired.
- **Acceptance:** No second figure's alpha changes during a change.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0316 [polish, visual] (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera

- **Game / chapter / state:** FFX-2 only / IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012
- **Observed:** Bahamut's head is readable (not blown out) at 2560x1440 and 2560x1080 this round; the 2000x1012 frame that the ticket names was not captured (PR-0316 stays open until it is). Cyan rim fringe on the wing cut-outs is visible in the 2560x1440 boss crop.
- **Expected:** The boss's face reads clearly in his signature framing.
- **Repro:** Candidate, seed 1, Ch IV, first menu.
- **Evidence:** critic/rounds/round-21/evidence/ffx2-bahamut-first-2560x1440/13-crop-boss.png
- **Confidence:** medium
- **Requirement:** visual: recognisability, lighting
- **Fix:** Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
- **Acceptance:** Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0333 [polish, visual] (new): FFX-2 Bahamut at 390x844 has its head, neck and the top of its wings under the BAHAMUT ACTS NEXT intent strip

- **Game / chapter / state:** FFX-2 only / ffx2-bahamut (Ch IV), 390x844 touch, first menu
- **Observed:** At 390x844 the first-menu frame is covered by the coach card, so the head-under-intent-strip question cannot be read; the mid-fight phone frame shows the head clear with the strip hidden (critic/rounds/round-21/vis/phone.jpg). Not captured after the coach card is dismissed.
- **Expected:** The boss's head is whole between the intent strip and the party.
- **Repro:** Seed 1, Ch IV first menu at 390x844 touch.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/fm-ffx2-bahamut-390x844/10-first-menu.png; critic/rounds/round-19b/visual/crop-bah-phone.png; critic/rounds/round-19b/audit/phone-bah-r19-r19b.png
- **Confidence:** medium
- **Requirement:** CHK-008; RUBRIC section 5 (accidental crop damage)
- **Where:** colossus master framing at the phone layout; the clearance field does not count the intent strip as a panel (suspected)
- **Fix:** Count the intent strip in the clearance field on the phone, or fail the colossus master closed at 390 wide.
- **Acceptance:** Bahamut's head fully below the intent strip at 390x844 on three first menus, compared with a live-35 frame at the same seed.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0341 [polish, visual] (downgraded major to polish, not reproduced): Ch IX Yojimbo and Daigoro drawn in every round-21 capture

- **Game / chapter / state:** FFX only / Ch IX Yojimbo
- **Observed:** Yojimbo and Daigoro are visible 1.0 at the 2000x1012 ui first menu and the 1600x900 route frame, and 1.0 / 0.751 at 2560x1440. Round 20's single missing-boss frame (same state at 2000x1012) is not seen again. Downgrade reason: the round-20 single-frame observation (an unconfirmed single run on a loaded host) did not recur in the 2000x1012 UI first menu, the 2560x1440 first menu or the 1600x900 route; the cause was never established. Not reproduced is not proven absent: keep the portraitTimeline readout and close after one more clean quiet-host run.
- **Repro:** FFX Ch IX seed 1 first menu at 2000x1012 on a fresh profile; repeat several times.
- **Evidence:** critic/rounds/round-21/evidence/yojimbo-cavern-first-2000x1012-ui/run.json; vis/yoj-r20-r21.jpg
- **Confidence:** medium (not reproduced is not proven absent)
- **Requirement:** CHK-011
- **Where:** first menu
- **Fix:** Keep the portraitTimeline readout and rerun once on a quiet machine; close if clean.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0255 [polish, narrative] (carried, re-observed): Tromell's five Chapter VII aftermath lines have speaker ''

- **Game / chapter / state:** FFX only / Ch VII
- **Observed:** dbox lines 42-48 of seymour-anima-macalania-win: 'Step away from Lord Seymour, Lady Summoner.', 'You will not put hands on him again.', 'He will be cared for. By his own people.', 'And this. This was never yours.', 'Traitors, all of you. It will be announced.' with an empty speaker.
- **Expected:** A named speaker (Tromell) or an intentional crowd tag.
- **Repro:** critic/rounds/round-21/evidence/seymour-anima-macalania-win/run.json dboxTimeline.
- **Evidence:** critic/rounds/round-21/feel-narr/dbox21-all.txt
- **Confidence:** high
- **Requirement:** writing-bible voice
- **Fix:** Set the speaker in the Chapter VII script.
- **Acceptance:** No empty-speaker line in the Chapter VII aftermath.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Re-observed: speaker '' on Tromell's five lines (src/story/scripts/seymour-anima-macalania.ts lines 248-261). carried from round 21 and re-observed or updated in round 22

### PR-0256 [polish, feel] (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- **Game / chapter / state:** FFX-2 / XVI aftermath, whistles 1 to 4
- **Observed:** Chapter XVI: "(Whistle)", "A small gold light answers.", "The light comes nearer." and the like have an empty speaker and no mote was captured in the scene frames (re-observed in the dbox timelines).
- **Expected:** A visible light, nearer on each whistle.
- **Repro:** Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- **Evidence:** critic/rounds/round-19b/feel-narr/dbox-all.txt
- **Confidence:** medium
- **Requirement:** feel/narrative: shown, not told
- **Fix:** A small gold mote fx step per whistle.
- **Acceptance:** A timed capture after each whistle shows the light, nearer each time.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0272 [polish, narrative] (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- **Game / chapter / state:** FFX / XVII sin-fins-core, seam 1 -> 2
- **Observed:** Chapter XVII: "The Fahrenheit's cannon tears the fin away." (battle, 368,321 ms) is still a caption on the unchanged deck plate.
- **Expected:** A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- **Repro:** Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- **Evidence:** critic/rounds/round-19b/feel-narr/dbox-all.txt
- **Confidence:** high
- **Requirement:** narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- **Fix:** Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- **Acceptance:** A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0350 [polish, combat] (carried, unchanged, low confidence, suspected): the immune-status miss event can pop twice for a two-status move and counts as 'targeted' for the Fallen Aeons counter

- **Game / chapter / state:** FFX-2 / status-only actions on immune targets, Ch XI
- **Observed:** r21-probes2.json identical to round 20 (abilities with formula none and two or more hostile statuses listed).
- **Expected:** One miss pop per action.
- **Repro:** r20-probes2.test.ts
- **Evidence:** critic/rounds/round-21/combat/r21-probes2.json
- **Confidence:** low
- **Requirement:** Presentation parity of misses
- **Where:** src/battle/ffx2 (immune miss event)
- **Fix:** Collapse to one miss event per target per action.
- **Acceptance:** A two-status move on an immune boss emits one miss event.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0351 [polish, combat] (carried, unchanged, low confidence): the Trigger Happy damage forecast floors at 6 hits while a human who presses fewer times now deals fewer

- **Game / chapter / state:** FFX-2 / Gunner Trigger Happy, Ch VI
- **Observed:** Live matrix: 3 presses give 3 damage events (12,17,17) on all five input devices; the forecast copy is unchanged from round 20.
- **Expected:** Forecast agrees with the honoured human count.
- **Repro:** critic/rounds/round-21/evidence/feat/th-*/run.json
- **Evidence:** critic/rounds/round-21/evidence/feat/th-ffx2-leblanc-kbd-r-3p-1600x900/run.json
- **Confidence:** low
- **Requirement:** Honest intent display
- **Where:** FFX-2 forecast text
- **Fix:** Show the forecast as a range from the honoured count.
- **Acceptance:** Forecast copy names the pressed-count rule.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0273 [polish, combat] (carried, unchanged): Ch XVII link 3 (on Sin's back) still lists disabled ESCAPE, PULL BACK and CLOSE IN rows at the top of the command menu

- **Game / chapter / state:** FFX / Ch XVII link 3
- **Observed:** link3-rows.json identical to round 20: attack, abilities, then escape(disabled), trigger:pull-back(disabled), trigger:close-in(disabled) before items.
- **Expected:** Rows that can never be used on this link are hidden.
- **Repro:** link3-rows.test.ts
- **Evidence:** critic/rounds/round-21/combat/link3-rows.json
- **Confidence:** high
- **Requirement:** Honest command lists
- **Where:** Ch XVII link-3 setup
- **Fix:** Hide the three rows on link 3.
- **Acceptance:** link3-rows.json has no disabled rows for Tidus.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0257 [polish, encounter] (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer than the sourced rows (204 and 220 real-key turns this round)

- **Game / chapter / state:** FFX / Ch III Braska's Final Aeon
- **Observed:** Victory on the long-budget re-runs in 220 turns and 204 turns (r2); the short budget stalled at link 3. Bench intended 39/40.
- **Expected:** Length near the sourced rows.
- **Repro:** critic/rounds/round-21/evidence/braskas-final-aeon-win-long*/run.json
- **Evidence:** critic/rounds/round-21/evidence/braskas-final-aeon-win-long/run.json
- **Confidence:** high
- **Requirement:** RUBRIC 6 encounter
- **Where:** src/data/chapter-braska.ts
- **Fix:** Bailey's call on the gauntlet's length.
- **Acceptance:** Real-key turn count near the sourced total.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Re-observed: link 1 alone took 125 real-key turns and the 700 s budget; engine intended 39 of 40. carried from round 21 and re-observed or updated in round 22

### PR-0279 [polish, encounter] (carried, a question for Bailey): Sin's difficulty is undecided (D-282); nothing changed, so the Ch XVII and XVIII figures stand

- **Game / chapter / state:** FFX / Ch XVII and XVIII Sin
- **Observed:** Ch XVII card 97/200, sensible 51/200; Ch XVIII intended 12/40, advisor 15/40, mash 0/40 (byte-identical to round 20).
- **Expected:** Bailey's difficulty decision.
- **Repro:** ffx-bench.test.ts sin-face rows; sin-ab-cand.json
- **Evidence:** critic/rounds/round-21/combat/ffx-three-line-r20.json
- **Confidence:** high
- **Requirement:** D-282
- **Where:** src/data (Sin)
- **Fix:** Bailey's decision.
- **Acceptance:** Recorded decision.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0280 [polish, encounter] (carried): the v3 card's Chapter XII rate is unchanged (Omnis intended 27/40, advisor 24/40); the live v4 card covers it

- **Game / chapter / state:** FFX / Ch XII Seymour Omnis
- **Observed:** Three-line bench row identical to round 20.
- **Expected:** n/a
- **Repro:** ffx-bench.test.ts seymour-omnis
- **Evidence:** critic/rounds/round-21/combat/ffx-three-line-r20.json
- **Confidence:** high
- **Requirement:** RUBRIC 6
- **Where:** src/engine/tactics
- **Fix:** None needed beyond the live card.
- **Acceptance:** Row stable.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0263 [polish, audio] (carried, polish): the SFX level fix (D-293, bus 0.70, mix b) is delivered but no ear has confirmed it

- **Game / chapter / state:** both / all
- **Observed:** sfxMix {option b, trim 1, bus 0.70} and volumes 0.8/0.7/0.7 in 307 of 307 samples; both sprites are byte-identical to round 20. Whether the attack sounds now read as present against the music is an ear question.
- **Repro:** critic/rounds/round-21/audio/routing.txt (problems=0 on every run).
- **Evidence:** critic/rounds/round-21/audio/routing.json
- **Confidence:** high (measurement), unverified (listening)
- **Requirement:** CHK-B1
- **Where:** src/audio/AudioManager.ts sfxBusGain; src/app/saveSfxBalance.ts
- **Fix:** Bailey's ear on the audition page (part of the PR-0148 verdict).
- **Acceptance:** Bailey's recorded reaction to the SFX level.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0220 [polish, audio] (carried, polish): a real controller on a real Chrome is not proven to unlock audio

- **Game / chapter / state:** both / title
- **Observed:** Emulated pad-only runs (seymour-flux-win-pad, ffx2-bahamut-win-pad) reached the boss cue at the first menu, and audio-pad-unlock unit tests pass (2 of 2), but headless Chromium already has user activation, so a real pad and a real browser are untested.
- **Repro:** critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl; npx vitest run tests/unit/audio-pad-unlock.test.ts.
- **Evidence:** critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl
- **Confidence:** medium
- **Requirement:** CHK-001 / platform goals (real controller evidence is UNVERIFIED, not a pass)
- **Where:** src/audio/padUnlock.ts
- **Fix:** A real-controller check in desktop Chrome (hardware), Bailey or a tester.
- **Acceptance:** A pad-only fresh session in real Chrome plays the title or board cue after the first pad A.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0039 [polish, audio] (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- **Game / chapter / state:** both / I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- **Observed:** themes-audit output is byte-identical to round 20's: 4 of 26 cues depart (scene-gagazet, scene-dreams-end, scene-farplane with no tempo map; scene-macalania-temple is 'not in the bible's cue map').
- **Expected:** Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- **Repro:** node tools/audio/themes-audit.mjs
- **Evidence:** themes-audit output, round 18
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md
- **Fix:** Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- **Acceptance:** themes-audit reports 0 departures for these cues.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0260 [polish, audio] (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- **Game / chapter / state:** ffx / VII
- **Observed:** themes-audit cannot check the Chapter VII scene cue scene-macalania-temple: it is "not in the bible's cue map" (output byte-identical to round 20).
- **Expected:** Every shipped cue has a row in the bible's cue map.
- **Repro:** node tools/audio/themes-audit.mjs
- **Evidence:** themes-audit output, round 18
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md
- **Fix:** Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- **Acceptance:** themes-audit shows ok for scene-macalania-temple.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0278 [polish, audio] (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- **Game / chapter / state:** FFX-2 (the Ixion row), docs / XVI
- **Observed:** The Ixion row's last cell is cut off mid-sentence and the 'Owed cues for chapters not yet listed' heading is glued into the table as a row; the Sin rows then follow a stray '99).' line.
- **Repro:** Read docs/audio/THEMES.md from the line '| XVI | `ffx2-ixion-djose` Ixion'.
- **Evidence:** docs/audio/THEMES.md (cue map section)
- **Confidence:** high
- **Requirement:** docs accuracy
- **Where:** docs/audio/THEMES.md
- **Fix:** Repair the table text (documentation only).
- **Acceptance:** The table renders as one table; themes-audit still reads 18 chapters.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0298 [polish, audio] (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- **Game / chapter / state:** both / all
- **Observed:** qa.mjs total shipped audio is 88.49 MB of the 90 MB budget (D-306 raised the cap from 85 MB; the accepted recommendation said about 73 MB of music). A question for Bailey, nothing changed in this build.
- **Expected:** D-292 as worded: the music grows from about 39 MB to about 73 MB.
- **Repro:** node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- **Confidence:** high
- **Requirement:** RUBRIC s7 (a pick approves what Bailey named)
- **Fix:** Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- **Acceptance:** decisions.json records Bailey's answer on the 78 MB size.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0032 [polish, onboarding] (carried, a proposal for Bailey): no key remapping, no REDUCE FLASHES row (the engine already reads a reduceFlashes flag, fxEnv.ts:41) and no colour-vision option

- **Game / chapter / state:** both / pause > OPTIONS, both games
- **Observed:** Re-observed: no REDUCE FLASHES row and no key remapping (the CONTROLS tab is read-only).
- **Expected:** A flash accommodation and input remap in OPTIONS (accessibility target).
- **Repro:** Esc, OPTIONS tab in any chapter.
- **Evidence:** critic/rounds/round-20/evidence/seymour-flux-win/run.json pause.optionsText; critic/rounds/round-20/evidence/seymour-flux-win/14-pause-options.png
- **Confidence:** high
- **Requirement:** RUBRIC section 6 (motion and flash accommodations, input access)
- **Where:** src/app/fxEnv.ts still reads a reduceFlashes flag no row writes
- **Fix:** Add a REDUCE FLASHES row that writes the existing fxEnv flag; list remapping as a question for Bailey.
- **Acceptance:** OPTIONS shows REDUCE FLASHES and toggling it removes impact frames and flares in a fight.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** I-10
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0237 [polish, interface] (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- **Game / chapter / state:** FFX-2 only / IV Bahamut, first menu, 390x844 touch
- **Observed:** Re-observed: the phone first-time coach tag overprints the FFX-2 intent third line ("115-" cut), Ch IV.
- **Expected:** The coach sits below the intent strip.
- **Repro:** Fresh profile, Chapter IV, 390x844 touch, first menu.
- **Evidence:** critic/rounds/round-20/evidence/ffx2-bahamut-win-phone-touch/10-first-menu-coach.png
- **Confidence:** high
- **Requirement:** CHK-008
- **Where:** coach placement on the phone (src/ui/coach, not traced)
- **Fix:** Place the phone coach under the intent strip.
- **Acceptance:** 0 px2 between the coach and the intent strip at 390x844 in Ch IV, V, VI.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0357 [polish, interface] (new; R20-IF-04 + capture owner): the intent card's overflow/ALSO line is cut mid-sentence and ghosted behind the dashed footer rule (Ch I, Ch IV; 2000x1012)

- **Game / chapter / state:** both (Ch I, Ch IV seen) / I Seymour Flux, IV Bahamut, desktop
- **Observed:** Re-observed: the Leblanc intent odds list is ghosted behind the dashed rule at 2000x1012.
- **Expected:** A collapsed card ends on a whole line or a clearly dimmed 'more' cue.
- **Repro:** Chapter IV, E open at the first menu, 1600x900 or 2000x1012.
- **Evidence:** critic/rounds/round-20/evidence/ffx2-bahamut-win/11-advisor.png; ffx2-bahamut-lose/11-advisor.png; audit/zz-contrast.tmp.mjs; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- **Confidence:** medium
- **Requirement:** CHK-003; RUBRIC section 2
- **Where:** enemy intent card overflow fade with 'J HOLD +N MORE'
- **Fix:** Clip at a line boundary, or put the consequence ('Slowing him slows it too') in the first visible line.
- **Acceptance:** No card line shown at under 3:1 and none cut mid-sentence in the collapsed state.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0324 [polish, interface] (carried, half fixed): Ronso Rage no longer called timed in code (live card not captured); Yuna's Grand Summon is still called a "Timed input"

- **Game / chapter / state:** FFX only / XIV Isaaru, first menu, 1600x900 seed 1
- **Observed:** Re-observed: Yuna's Grand Summon still reads "Timed input" (Ch XIV); the Ronso Rage live card was not captured.
- **Expected:** No 'Timed input' on an untimed picker (project data: no timed input; a picker only).
- **Repro:** Real keys to Chapter XIV, first menu, read the advisor card.
- **Evidence:** critic/rounds/round-20/evidence/isaaru-via-purifico-win/run.json advisorText
- **Confidence:** high
- **Requirement:** RUBRIC section 2; AGENTS.md rule 6
- **Where:** src/engine/tactics/advisor.ts:653 (the fix excludes only kimahri-rage); src/battle/ffx/overdrive.ts timerMsFor returns 0 for yuna-grand-summon
- **Fix:** Add the phrase only when timerMsFor(def) is above 0 (Swordplay, Bushido, Lady Luck reels keep it).
- **Acceptance:** No 'Timed input' on Ronso Rage, Grand Summon or Mix rows; Bushido and reels keep it.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0259 [polish, delivery] (carried, fifth review, narrowed): a session requests 61 to 160 MiB of media (median 119; 96 MiB at the board) and the first measured slow-4G arrival is 8.3 s to ready and 14 to 24 s to the board; no weaker-GPU, non-Chromium or phone timing

- **Game / chapter / state:** both / all; new per-frame work in the pause (living portrait canvases), 8 more rooms with drift-driven plate defocus, plate wings, and about 5 MB of twirl keys at battle start (desktop full tier)
- **Observed:** Measured live, cold cache, 1600x900, Ryzen 7 7800X3D, RTX 5070 Ti, headless Chromium 153, shared host (CPU 65 to 97 percent): title ready in 623 to 810 ms (1,485 KB, 5 requests, FCP 188 to 340 ms); 59.7 to 60.0 fps over 12 s idle and 15 to 18 s action windows in Flux, Bahamut and Sin Fins and Core, p99 16.8 ms, max 33.4 ms, 0 frames over 50 ms; first-ability windows max 33.2 and 16.8 ms. Before the first command menu the page fetches 166 to 192 requests, 82.7 to 88.0 MB art and 17.9 to 20.1 MB audio; card Enter to first menu 9.9 to 12.2 s unthrottled including the scene-skip hold. Never measured: 10 Mbit with 40 ms latency (round 18b measured 52.0 s on a 577 MB build; this is 798 MB), a mid-range GPU, Firefox, Safari, Edge, 3840x2160 and 2560x1080 timings, the pause with a living portrait, the first dressphere change, Sin's first ability window. PR-0240 (no non-Chromium play evidence: Playwright WebKit ran only the build image-load gate; Firefox will not start on this machine) is carried inside this ticket.
- **Expected:** 60 fps at 1600x900 and a load under five seconds on named hardware, browser, network and cache, with frame-time spikes and first-ability stalls reported.
- **Repro:** one browser lane, nothing else running, named GPU and CPU: Chapter I and IV 1600x900 cold cache unthrottled and at 10 Mbit/s 40 ms; 60 s frame-time windows in Flux, Bahamut (with a dressphere change), Via Purifico or Zanarkand (defocus rooms) and in the pause with a living portrait.
- **Evidence:** critic/rounds/round-22/evidence/gaps/arrival/arrival.json; critic/rounds/round-22/delivery/verify-live-full.json
- **Confidence:** high for the measured figures; the throttled and weaker-hardware outcomes are unknown
- **Requirement:** RUBRIC sections 2 and 6; CHK-017 load clause
- **Where:** capture method (4 to 5 parallel lanes on one host)
- **Fix:** Add a throttled-entry and low-GPU slot to the perf protocol (the single-lane protocol itself worked) and decide with Bailey whether a lighter pre-menu payload is wanted if the 10 Mbit entry exceeds the target; no product change proposed until measured.
- **Acceptance:** A report with named hardware and the figures above for cd9dbbb0.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0353 [polish, delivery] (carried, STALLED, narrowed): the seed-1 route still loses Ch XIII Trema and Ch XV Den of Woe; a seed-2 real-key run won Ch XV (39 turns, 5:16, results, aftermath, board and reload), so only Trema's reward row stays unseen (Trema lost again on seed 2 and its retry)

- **Game / chapter / state:** FFX-2 only / XIII and XV
- **Observed:** Den of Woe: defeats at 10 and 33 picks (two attempts) and 11, 20, 62, 18, 15 (five attempts), the second run's cards read TURNS 4 ATTEMPTS 5; 19b won it first try on the same chapter. Trema: defeats at 95, 81 (two attempts) and 97, 82, 83, 95, 98 (five), results TURNS 275 and 363, never cleared in four rounds. Loss, results, RETRY and chapter select work in both. No victory flow, post-battle scene or reward row for either chapter exists on this build. Round 20's engine A/B (identical digests on 120 seeds) says the engine did not change for Den; this evidence cannot separate encounter tuning, the route's policy or timing, so the cause is not established.
- **Expected:** A real-flow win for each included chapter, with results rows, post-scene, board and a reload that keeps the clear (CHK-022).
- **Repro:** node critic/rounds/round-21/cap/route21.mjs ffx2-den-of-woe win --base=https://baileypillon.github.io/pyrefly-reprise/ --attempts=5 and the same for ffx2-trema; PYREFLY_BROWSER=gpu, seeds 1, 1001, 2001, 3001, 4001.
- **Evidence:** critic/rounds/round-22/evidence/gaps/ffx2-trema-win-long/run.json; critic/rounds/round-22/evidence/ffx2-trema-win/run.json; critic/rounds/round-22/evidence/ffx2-den-of-woe-win/run.json; critic/rounds/round-22/evidence/gaps/ffx2-den-of-woe-win-long/run.json; critic/rounds/round-22/evidence/gaps/ffx2-den-of-woe-win-long/31-results.png
- **Confidence:** high that no win is recorded; low on cause
- **Requirement:** CHK-022; RUBRIC section 5 and the milestone gate; balance itself belongs to the combat and encounter auditors and is not scored twice
- **Fix:** Write the method check RUBRIC section 8 asks for before a third batch: either a hand-played or strategy-guide route (Jegged) for each chapter on an idle host, or a seeded engine run of the sourced intended strategy, to decide route fault versus tuning; whichever shows a legitimate win through the real flow settles CHK-022 for the chapter. No tuning proposed by this auditor.
- **Acceptance:** One recorded win per chapter through results, CONFIRM, scene, board and reload, with the reward row read against the research docs.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0348 [polish, harness] (reclassified as critic tooling): the Ch VI route idled 12 minutes inside Rikku's White Magic submenu because it never presses Esc; the gap pass showed one Esc returns to the root list and Item lists Phoenix Down, so the game path works

- **Game / chapter / state:** FFX-2 only / VI
- **Observed:** ffx2-leblanc-win: victory seed 1 attempt 1, 70 turns, 446 s fight, 9.9 min, 0 console errors; the stalled-run DOM dump and Esc probe the issue asked for were never taken, so the cause (menu reopening in a submenu, or the route not pressing Back) is still not established.
- **Expected:** A run reaches an outcome, or a player at an open menu can always back out.
- **Repro:** Three serial seed 1 runs of route21.mjs ffx2-leblanc win on an idle host; on a stall dump the menu depth and top-row labels, then press Esc and record the result.
- **Evidence:** critic/rounds/round-22/evidence/ffx2-leblanc-win/27-no-choosable-row.png; critic/rounds/round-22/evidence/gaps/ffx2-leblanc-pd3/51-after-esc-root.png; critic/rounds/round-22/evidence/gaps/ffx2-leblanc-pd3/52-phoenix-target.png
- **Confidence:** medium
- **Requirement:** CHK-022; RUBRIC section 5 (separate harness failures and product failures)
- **Fix:** Teach the route to back out of a submenu with Esc before looking for a root row.
- **Acceptance:** Two further consecutive wins with no stall, or a captured stall with its Esc result.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R22-FEEL-05 (was major, UNVERIFIED possible critical: refuted as a product defect by the gap pass); prep-delivery PR-0348
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0295 [polish, prep] (carried, not re-captured): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed (tiny text); no prep tab other than CHAPTER was opened this round at any size (third round; also PR-0292)

- **Game / chapter / state:** both
- **Observed:** The capture opened prep only on the CHAPTER tab (04-prep.png) and returned; no tab key, pad or tap was sent. The release did not touch PartyPrep, so round 20's finding is carried, unrechecked.
- **Expected:** Every prep tab usable at phone size (RUBRIC section 6).
- **Repro:** 390x844 touch, Chapter I prep, swipe through the tabs.
- **Evidence:** critic/rounds/round-20.json PR-0295; no round 21 capture
- **Confidence:** medium (carried)
- **Requirement:** RUBRIC section 6 onboarding and prep device usability; CHK-003
- **Fix:** Give the remaining prep tabs the phone page treatment Sphere Grid B introduced, after a capture confirms the state.
- **Acceptance:** A phone capture of every prep tab at 390x844 with readable text.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0292 [polish, onboarding] (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- **Game / chapter / state:** FFX / I prep
- **Observed:** Carried, not captured (the prep tabs were not opened by input at any size; third round without them). Prep code untouched in release 38.
- **Expected:** Every control has a key or pad route, and touch wording on touch screens.
- **Repro:** Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- **Confidence:** high
- **Requirement:** onboarding: input access
- **Where:** Sphere Grid tab
- **Fix:** Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- **Acceptance:** A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0327 [polish, delivery] (carried, not captured): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; cold or throttled behaviour still unobserved

- **Game / chapter / state:** FFX-2 only
- **Observed:** Trema runs request paine-warrior, paine-thief and yuna-warrior twirl-forming and twirl-end files during play; no timing of key arrival against the outfit frame exists on a throttled cache.
- **Expected:** Keys present when the twirl plays, or a clean fallback.
- **Repro:** Cold profile, 10 Mbit, Chapter IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
- **Evidence:** critic/rounds/round-21/evidence/ffx2-trema-win/network-media.json (twirl requests present, no timing)
- **Confidence:** low (builder-stated, never captured)
- **Requirement:** RUBRIC section 2 measured loading
- **Fix:** Prefetch the party's twirl keys at battle start at idle priority, after the throttled capture shows a gap.
- **Acceptance:** A throttled capture where every twirl key response ends before the outfit frame.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0223 [polish, delivery] (carried, unchanged): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- **Game / chapter / state:** FF7 experiment (hidden)
- **Observed:** Not captured in round 21; no FF7 file changed.
- **Expected:** 0 requests >= 400 on the FF7 pause.
- **Repro:** FF7 door, then battle, then Esc; record the network log.
- **Evidence:** critic/rounds/round-20.json PR-0223
- **Confidence:** low
- **Requirement:** CHK-017 and CHK-018
- **Fix:** None until observed.
- **Acceptance:** A network log of the FF7 pause with no 4xx.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0339 [polish, harness] (critic tooling, carried, widened): the route's 700 s fight budget ends Ch III, V, XI and XVII mid-fight (XI needed 13 minutes on seed 2), and it expects a post-battle scene before results where four chapters play it after Confirm

- **Game / chapter / state:** both / ffx2-trema, sin-fins-core, sin-face; post-scene in I, II, VII, VIII, VI
- **Observed:** The route bot loses at human pace: Yunalesca lost on seeds 1, 1001 and three more attempts (116-121 turns, 643-720 s per fight) and won only on seed 4001 after 58 minutes; Trema lost 5 of 5 (81-98 turns); Den of Woe lost 4 of 4 plus one chain-link win, then defeat. Braska and Sin Fins Core stalled at link 3 on the short budget and won on the long re-runs. No victory results screen was captured for Trema or Den of Woe (product cause not established; see PR-0227 and PR-0306).
- **Expected:** A recorded real-key win through results and back to the board for every included chapter (CHK-022).
- **Repro:** cap/lanes.sh with ffx2-trema win --seed=1|2|3 --attempts=2; gapcap/swordplay.mjs sin-fins-core 1600x900 "" 1
- **Evidence:** critic/rounds/round-21/evidence/ffx2-trema-win-r2/run.json, ffx2-den-of-woe-win-r2/run.json, yunalesca-win-r2/run.json
- **Confidence:** high that it is not a product regression; unknown whether a better bot wins
- **Requirement:** CHK-022
- **Fix:** Teach the route to enter the shown Overdrive input and a race-aware policy for the Sin chapters, raise the turn cap, and read the post-scene after CONFIRM (with PR-0261).
- **Acceptance:** A recorded win through results, CONFIRM, scene and board for XIII, XVII and XVIII.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** D22-02; D22-08; H-1 (second half)
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0261 [polish, harness] (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- **Game / chapter / state:** both (tooling) / all phone routes
- **Observed:** Pattern persists: Braska and Sin Fins Core short runs stalled at link 3 and read as outcome "victory" in the collation; seven victories carry an unverified 30-post-scene frame (the screen wanted a cutscene and got results, PR-0339 pattern).
- **Expected:** contexts.touch.blocked names the element that intercepts the tap.
- **Repro:** Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- **Confidence:** high
- **Requirement:** CHK-016 evidence integrity
- **Fix:** Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- **Acceptance:** A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0375 [polish, harness] (critic tooling, new; R21-PD-02): the pause matrix assumes a plain top row at the FFX first menu, so four FFX rows fail on a shifted state

- **Game / chapter / state:** FFX only (FFX-2 first menus open on a row that is not Attack at the coach)
- **Observed:** seymour-flux-pausematrix-1600x900 row 4 starts with targets 2 (the target cursor open) because the last coach card's Enter also chose Attack (OBS-03); Esc therefore closes the cursor instead of opening pause, and rows 5 to 7 run one state out of step and read FAIL. The pad run's row 11 (targeting Esc) starts with targets 0 and rows 12 and 13 follow. Every row after the shift behaves as the rules say. The report would read 14 pass 4 fail and 10 pass 3 fail as a product failure.
- **Expected:** A row fails only when the game's response differs from the rule from the stated state.
- **Repro:** node critic/rounds/round-21/cap/pausematrix21.mjs seymour-flux and read run.json rows 4 to 7 (before.targets).
- **Evidence:** critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900/run.json, -pad, -390x844-touch
- **Confidence:** high
- **Requirement:** CHK-015 and CHK-016 (state asserted before a row counts)
- **Fix:** Assert the precondition of each row from the game snapshot (top row, targets 0) and press Esc once to close a stray cursor before the row, or stamp the row UNVERIFIED instead of FAIL; keep OBS-03 itself with the onboarding and interface auditors.
- **Acceptance:** Flux matrix reads 18 of 18 on a rerun from the same build.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0376 [polish, harness] (critic tooling, new; R21-PD-03 + gap-pass bug): clip21.mjs threw ReferenceError (Cannot access "path" before initialization) in 21 run.json files, so most clip routes recorded no clips

- **Game / chapter / state:** both
- **Observed:** clipError appears 9 to 20 times in 21 run.json files (Flux win, pad, reduce-motion, phone clips, lose-clips, Bahamut win, pad and phone, Sin Fins long, Braska long r2, Evrae, Natus, Omnis, Anima, Ixion, Isaaru, Sin Face and others); clips exist for only nine runs (135 clips, 38 transitions: Braska, Yojimbo, Leblanc, Fallen Aeons, Vegnagun, Den, Yunalesca, Sin Fins), and the runs asked for clips with --clips (Bahamut phone clips, Flux phone clips, lose-clips) hold none. Auditors judging motion or transitions must not count these runs. Merged with the gap pass's own diagnosis: in finish() a local "let path" (the actor's path samples) shadowed the node:path import; renamed to samplePath in the scratch copy (cap/clip21.mjs lines 138-152, not re-run for the phone, pad, reduce-motion and lose routes). The gap pass re-recorded the Flux and Braska telegraph-hold clips and the Bahamut attack and skill-travel clips with it.
- **Expected:** Every run started with clips leaves its clip folders.
- **Repro:** grep clipError critic/rounds/round-21/evidence/ffx2-bahamut-win/run.json; ls evidence/ffx2-bahamut-win/clips (empty).
- **Evidence:** critic/rounds/round-21/evidence/*/run.json steps k=clipError; critic/rounds/round-21/evidence/*/clips
- **Confidence:** high
- **Requirement:** CHK-016 (evidence the harness proved)
- **Fix:** Move the path import or declaration ahead of its first use in critic/rounds/round-21/cap/clip21.mjs and re-record the missing clips (a capture-owner step; no product change).
- **Acceptance:** A repeat of ffx2-bahamut-lose-clips leaves its clips and no clipError step.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### FOC37-03 [polish, interface] (carried from the focused review, not reproduced): the Ch IV first-run coach tag clips at 2000x1012 for some first actors

- **Game / chapter / state:** FFX-2 only / IV Bahamut, 2000x1012, seed 2 (focused review)
- **Observed:** Round 20 captured 2000x1012 coaches at seeds 1, 1001 and 1002 (Ch IV, Ch XIII, others): all inside the page (tag right edge near x 525 of 2000 in Ch IV). Seed 2 of Ch IV was not run, so the focused finding neither confirmed nor cleared.
- **Expected:** Coach and tag stay inside the viewport.
- **Repro:** Chapter IV, seed 2, 2000x1012, first menu.
- **Evidence:** critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused.json FOC37-03; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- **Confidence:** low (not reproduced)
- **Requirement:** CHK-003
- **Where:** coach tag width (src/ui/coach, not traced)
- **Fix:** Clamp the coach card and tag to the viewport width.
- **Acceptance:** Seed sweep 1-6 at 2000x1012 in Ch IV: tag right edge below the page width.
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0342 [polish, visual] (new; V20-02): Ch IX: a foreign blue tree painting shows over the cavern backdrop for part of the fight

- **Game / chapter / state:** FFX only / Chapter IX
- **Observed:** A bright blue-white tree canopy with falling petals appears in the upper right of the cavern battle plate in 13-guide-G (about 5.7 s after the first menu) and faintly behind Yojimbo in 16-target-single; the cavern plate is otherwise a near-black platform. It looks like a crossfade or layer from another room (Macalania woods). Round 19b's Ch IX frames show no tree.
- **Expected:** The Cavern of the Stolen Fayth plate and its approved look only.
- **Repro:** As V20-01, then press G at the first menu and screenshot at 2000x1012.
- **Evidence:** critic/rounds/round-20/evidence/yojimbo-cavern-win/13-guide-G.png, critic/rounds/round-20/vis/yoj13-crop.jpg
- **Confidence:** medium-low (one run; cause unestablished)
- **Requirement:** CHK-013 (art judged in the running game); approved art identity
- **Where:** 13-guide-G (clear), 16-target-single (faint), 2000x1012 seed 1
- **Fix:** Identify which layer paints the tree (suspected A-7 living-backdrop sky layer or a plate crossfade) and restrict it to rooms that own it; the fix lives with V20-01.
- **Acceptance:** No tree or foreign painting at any point of a Ch IX fight in 3 of 3 runs at 1600x900 and 2000x1012.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0355 [polish, interface] (carried, widened to FFX-2 Ch XI): a boss bar's status chips overprint the next boss's name (Ormi's STATUS tag over "Dr. Goon" in Ch VI; the Magus Sisters' chips half-hide "Cindy" and "Mindy" in Ch XI)

- **Game / chapter / state:** FFX-2 only / VI Leblanc Syndicate, first link, Dr. Goon KO'd, Ormi with four statuses, 1600x900 seed 1
- **Observed:** Ormi's 'STATUS [4]' tag sits on the 'Dr. Goon' row and covers the top half of the name; the frame is static (the run sat idle on it for minutes).
- **Expected:** Every enemy name is readable (CHK-009).
- **Repro:** Chapter VI at 1600x900, get Ormi to carry four statuses, open any Rikku or Yuna menu; read the enemy list at top left.
- **Evidence:** critic/rounds/round-22/evidence/ffx2-fallen-aeons-win/24-seam-2-first-menu.png; critic/rounds/round-22/targets/sisters-bars-crop.jpg
- **Confidence:** medium (one chapter and state; the first-run harness stalled in this state)
- **Requirement:** CHK-009
- **Where:** FFX-2 enemy list status tag placement (src/ui/ffx2, not traced)
- **Fix:** Add the status row's height to each bar slot, or place the chips at the bar's right end.
- **Acceptance:** All three Sisters' names and Dr. Goon's are whole with statuses on at 1280x720, 1600x900 and 2560x1440.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Merged / aliases:** visual-targets: Magus Sisters bars
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0320 [polish, visual] (carried): the first-time Rikku coach line is still up over the girls' feet during the held dressphere shot (Ch XIII 2000x1012)

- **Game / chapter / state:** FFX-2 only / Ch XIII Trema
- **Observed:** While the shot label 'Paine Songstress' is up, the pink 'GAUGES RUNNING - A COMMAND HOLDS THEM' tag and the Rikku quote card sit across Paine's shins and feet. The builder's html.mix-held rule hides the coach but the disclosed evidence shows the rule, not the flow; in the natural run it does not hide it.
- **Expected:** The coach line hidden for the shot and back after it.
- **Repro:** FFX-2 Ch XIII seed 1: first CHANGE with the coach unseen; frames f02-f06.
- **Evidence:** critic/rounds/round-20/vis/trema-coach.jpg, critic/rounds/round-20/vis/trema-spc.jpg
- **Confidence:** high
- **Requirement:** CHK-008
- **Where:** first CHANGE (Paine to Songstress), 2000x1012, seq-spherechange f02-f08
- **Fix:** Apply the hide in the code path that raises the coach after the held shot starts (the coach registers its own listener after the shot's class is set).
- **Acceptance:** No coach-mark box intersects a girl's painted box in any frame of the shot in Ch IV, XIII at 1600x900 and 2000x1012.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0347 [polish, feel] (new; R20-FEEL-03): at the Den of Woe link-2 seam the camera pushes Yuna out of the left edge by 2.5 s (also in 19b)

- **Game / chapter / state:** FFX-2 only / Ch XV Den of Woe, link 1 to 2 seam, 1600x900
- **Observed:** seq-seam-2: frames f03-f05 hold the whole party; by f06 (2.18 s) Yuna is at the left edge and by f07 (2.51 s) only her staff and a sliver show while the Gippal line card is up. Same composition in round 19b f07 and in the r19route run, so it is not a regression.
- **Expected:** Camera keeps all three girls in frame or cuts away deliberately.
- **Repro:** Route harness ffx2-den-of-woe seed 1, link 1 won, watch the seam to link 2; frames critic/rounds/round-20/evidence/ffx2-den-of-woe-win/seq-seam-2/f06.jpg and f07.jpg
- **Evidence:** critic/rounds/round-20/feel-narr/seam-den2.jpg; critic/rounds/round-20/feel-narr/seam-den19.jpg
- **Confidence:** medium
- **Requirement:** RUBRIC 6: coherent camera
- **Fix:** Clamp the seam camera's end pose on the party's leftmost member for this chapter.
- **Acceptance:** Den link-2 seam at 1600x900 and 2000x1012: all three girls fully visible at every frame through the first menu.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0346 [polish, feel] (new; R20-FEEL-01, low confidence): under a loaded host the chapter card stays up 3-4 s into the transition after a hurried scene entry

- **Game / chapter / state:** both / FFX Ch I, III; FFX-2 Ch IV, XIII, XV (observed slow); most other chapters show the fast path
- **Observed:** The hurried entry (PR-0061) gives 3.4-5.2 s to first menu in 23 of 28 runs. In five runs the full chapter card is still on screen 2.75-4.08 s into the hand-over sequence (Flux win f09 at 2950 ms, Braska 3303 ms, Trema 4084 ms then gone at 4533, Bahamut lose 3777 ms, Den first run 2749 ms) and first menu was 5.4, 7.4, 6.3, 4.7 (lose) and 16.9 s. All five started in the first parallel burst (lanes A, B, C, D at 17:37:25Z) or the Den lane with 3 other lanes active; the Den first run alone cost 31 s wall against 19-20 s for the rest.
- **Expected:** Card 0.7 s after a hurried scene and first menu in about 3.2-4.8 s (docs/handoff/r37-scenes.md), at least on a single lane.
- **Repro:** Route harness, fresh profile, hold Enter through the pre-scene, then watch seq-transition-into-battle. Seed 1. Compare critic/rounds/round-20/feel-narr/trprof.py output (luminance 163-175 = card) for seymour-flux-win, braskas-final-aeon-win, ffx2-trema-win, ffx2-bahamut-lose against the fast runs.
- **Evidence:** critic/rounds/round-20/feel-narr/trprof.py; critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-20/evidence/seymour-flux-win/seq-transition-into-battle/f09.jpg
- **Confidence:** low (host load vs load-time wait not separated; no single-lane retime)
- **Requirement:** RUBRIC 4 and 9: a resource-contention timeout is investigated before it is called a game defect; PR-0061 closure needs the claim measured
- **Where:** src/ui/common/transitions/openingHurry.ts (suspected, not traced)
- **Fix:** Re-run Flux, Braska, Trema and Bahamut entry alone on one lane and log when the card is dismissed and what it waits on; if it waits on the battle load, nothing to change, otherwise cap the hurried card at 0.7 s.
- **Acceptance:** Single-lane entry for the four runs: card gone and first menu under 5.5 s in all four, 3 repeats.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0356 [polish, interface] (carried, re-measured): pause section headers, the "H PAINTING ONLY" hint and the title tagline are low contrast (2.4 to 2.9 : 1; tagline 1.9 : 1)

- **Game / chapter / state:** both / pause: member tab, OPTIONS, phone header; 1600x900, 2000x1012, 390x844
- **Observed:** Pixel estimates: BATTLE STATS 2.5:1, THIS ENCOUNTER 2.8:1, ABOUT 2.4:1 (1600x900 and 2000x1012), phone PYREFLY REPRISE header 2.1:1 and IN THIS FIGHT 2.2:1. The values and row labels beside them read at 11 to 14:1. Estimates over a busy painting, so the figure is approximate.
- **Expected:** Text a player must read at 3:1 or better (the PR-0322 repair uses 3:1 for dimmed state text).
- **Repro:** Open the pause on Ch I or Ch IV; run critic/rounds/round-20/audit/zz-contrast.tmp.mjs.
- **Evidence:** critic/rounds/round-22/evidence/seymour-flux-win/14-pause-options.png; critic/rounds/round-22/evidence/seymour-flux-win/14-pause-Esc.png
- **Confidence:** medium-low
- **Requirement:** CHK-003
- **Where:** src/ui/common/pause-screen.css label colour tokens (not traced)
- **Fix:** Lift the section-label token to 3:1 against the darkest and lightest part of the plate it sits on.
- **Acceptance:** Section labels at 3:1 or better on every plate at 1600x900 and 390x844.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Merged / aliases:** I-4
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0248 [polish, visual] (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- **Game / chapter / state:** FFX only / VII Seymour and Anima, single-target step, 2000x1012
- **Observed:** The 'Guado Guardian A HP ???' Sensor card covers Guardian B's torso and robe while Guardian A is targeted.
- **Expected:** No panel over a painted figure the player may target next.
- **Repro:** Chapter VII, Attack, step to Guado Guardian A.
- **Evidence:** critic/rounds/round-20/evidence/seymour-anima-macalania-win/16-target-single.png
- **Confidence:** high
- **Requirement:** CHK-008
- **Where:** Sensor card placement
- **Fix:** Add the projected enemy quads to the Sensor card's placement test.
- **Acceptance:** Sensor card clear of every enemy box except the target in Ch VII, X, XII.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### FOC37-01 [polish, interface] (carried from the focused review, downgraded major -> polish): the Lady Luck reel overlay is covered by the guide card; unreachable by players (PR-0340) and not reproduced live

- **Game / chapter / state:** FFX-2 only (Lady Luck minigame) / not driven in round 20
- **Observed:** Reported by the focused review's Lady Luck lane ('reel 1 and the DUD warning half hidden'); not re-reproduced by that review and not exercised in round 20 (no Lady Luck fight was driven).
- **Expected:** The overlay sits above the guide card, or the guide hides while a minigame is open.
- **Repro:** Open the Lady Luck reel overlay with the guide card on.
- **Evidence:** critic/reviews/cd9dbbb08-focused.json FOC37-01
- **Confidence:** unverified
- **Requirement:** CHK-006, CHK-008
- **Where:** minigame overlay z-order under the guide card at top left (not traced)
- **Fix:** Raise the overlay above the guide or hide the guide during a minigame.
- **Acceptance:** Reel 1 and the DUD warning fully visible with the guide on, 1600x900 and 390x844.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0321 [polish, interface] (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor

- **Game / chapter / state:** both / any (pause > OPTIONS > EYE CANDY) at 390x844
- **Observed:** 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
- **Expected:** CHK-003: no player text under 14 css px at 390x844.
- **Repro:** 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
- **Evidence:** critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
- **Confidence:** high
- **Requirement:** CHK-003
- **Where:** src/ui/common/pause-screen.css:824-825 (--pu-fs:12px; --pu-fs-v:13px, an authored phone exception)
- **Fix:** Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
- **Acceptance:** ecfont at 390x844 in both games: under14 empty, no clipping.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** R19-IF-02
- **Note:** The new page inherits the pre-existing phone pause floor; the capture owner filed it as minor/new, the interface auditor as a pre-existing exception. One issue. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0249 [polish, interface] (carried, re-observed by the chief): the FFX-2 intent card covers the girls at 1600x900; at the whole-party Shell target in Ch IV it stands over Rikku and Paine

- **Game / chapter / state:** FFX-2 / IV Bahamut
- **Observed:** tgt-ffx2-bahamut-1600x900-shell/target.png (c69de96a, seed 1, real keys): the BAHAMUT ACTS NEXT card (x about 490-865, y about 185-500) covers Rikku and Paine almost to the feet while the target brackets frame them; Yuna stays clear. Under the colossus master the girls stand further back than in round 18b's frame, so the overlap reads larger; whether it differs from live 35 at this state is not captured.
- **Expected:** No panel over a face or a weapon.
- **Repro:** Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png
- **Confidence:** high for the observation; unknown against live
- **Requirement:** CHK-008
- **Fix:** Add the projected party quads to the intent card's placement test while targeting.
- **Acceptance:** Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Widened (merged R18b-VIS-01): in Ch IV at 1600x900 the default intent card also covers Rikku's head and Paine's head and torso while Yuna's WHITE MAGIC list is open, which hides Paine's Cursed darkening; the same with REDUCE MOTION on. Intent and camera code are unchanged in this diff. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### FOC28-P02 [polish, interface] (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- **Game / chapter / state:** FFX / II and XIV Grand Summon picker, 390x844
- **Observed:** Recorded by the focused review of this same build and still open.
- **Expected:** Legible and not clipped.
- **Repro:** See critic/reviews/6ea8528f-focused.md.
- **Evidence:** critic/reviews/6ea8528f-focused.json (reused, same sha)
- **Confidence:** high
- **Requirement:** CHK-003
- **Fix:** As proposed in the focused report.
- **Acceptance:** As proposed in the focused report.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0239 [polish, interface] (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- **Game / chapter / state:** FFX-2 (the rail is shared) / XI Fallen Aeons, Rikku's Mega-Potion charging
- **Observed:** The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- **Expected:** The two panels do not contradict each other about the same turn.
- **Repro:** FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- **Evidence:** critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- **Confidence:** high
- **Requirement:** Interface: useful advice
- **Fix:** Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- **Acceptance:** In the same case, the rail and the card agree or the rail defers.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0246 [polish, interface] (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- **Game / chapter / state:** FFX / Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- **Observed:** 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- **Expected:** The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- **Repro:** node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- **Confidence:** high
- **Requirement:** PR-0246 acceptance; CHK-009
- **Fix:** Wrap the label to two lines, or drop the verb when the name is long.
- **Acceptance:** The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0247 [polish, visual] (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- **Game / chapter / state:** FFX / VII, battle, Anima's arrival at 390x844 touch
- **Observed:** At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- **Expected:** The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- **Repro:** Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- **Confidence:** high
- **Requirement:** visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- **Fix:** Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- **Acceptance:** The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0250 [polish, interface] (carried, confirmed): the phone results location caption is clipped

- **Game / chapter / state:** FFX / Ch XII
- **Observed:** 'INSIDE SIN — THE GARDEN C…'
- **Expected:** The full caption.
- **Repro:** Lose or win Ch XII at 390x844.
- **Evidence:** round-18/evidence/seymour-omnis-win-touch/31-results.png
- **Confidence:** high
- **Requirement:** CHK-009
- **Where:** 390x844 results
- **Fix:** As in round 17.
- **Acceptance:** The caption's scrollHeight <= clientHeight + 1 at 390x844.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0252 [polish, interface] (carried): the first-turn coach card overlaps the selected command row

- **Game / chapter / state:** FFX / X Seymour Natus at 2000x1012 (2560x1080 not captured)
- **Observed:** Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- **Expected:** Coach clear of the command stack.
- **Repro:** Fresh profile, 2000x1012, Ch X first menu.
- **Evidence:** critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- **Confidence:** high
- **Requirement:** CHK-008
- **Fix:** Add the command stack to coachActorAvoid's rects at wide sizes.
- **Acceptance:** 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0254 [polish, narrative] (carried, STALLED): Chapter VII Talk is still silent

- **Game / chapter / state:** FFX / VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- **Observed:** The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- **Expected:** A Tidus line and Seymour's reply within 3 s of each Talk.
- **Repro:** Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- **Evidence:** critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- **Confidence:** high
- **Requirement:** narrative: banter and reachable character voice
- **Fix:** Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- **Acceptance:** The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0271 [polish, visual] (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- **Game / chapter / state:** FFX only / XVIII Sin: the Face
- **Observed:** When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- **Expected:** No HUD panel over a face, including during camera moves (CHK-008).
- **Repro:** Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- **Evidence:** critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- **Confidence:** medium (observed; no live action-frame evidence to compare)
- **Requirement:** CHK-008
- **Where:** Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- **Fix:** Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- **Acceptance:** XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0276 [polish, interface] (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- **Game / chapter / state:** FFX-2 / IV Bahamut
- **Observed:** The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- **Expected:** Header visible, or scrolling inside the rows only.
- **Repro:** Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- **Evidence:** critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **Fix:** Make the header sticky, or scroll the rows container only.
- **Acceptance:** Header box fully inside the list viewport after wheel up and down.
- **Tags:** introducedByCandidate true, regressionVsLive false
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0277 [polish, interface] (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- **Game / chapter / state:** FFX / I Seymour Flux
- **Observed:** The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- **Expected:** The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- **Repro:** Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- **Evidence:** critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- **Confidence:** low
- **Requirement:** CHK-005 (says in plain words what to spend the turn on)
- **Fix:** Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- **Acceptance:** On the same board the card names the raise, then the cure, in that order.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0286 [polish, interface] (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- **Game / chapter / state:** FFX / Ch I
- **Observed:** 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- **Expected:** The message and the dialogue text do not overlap.
- **Repro:** 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- **Confidence:** medium
- **Requirement:** CHK-008
- **Where:** 390x844, a status lands while a battle line is on screen
- **Fix:** Offset the message line below the banner while a line is up, or queue it until the line ends.
- **Acceptance:** Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Merged / aliases:** capture-owner issue 4; R18-IF-05
- **Note:** Widened by the gap pass (merged R18B-GAP2-06): at 1280x960 FFX desktop, "Kimahri was hasted." (371 px2) and then "Yuna became a Zombie." (568 px2) overlap the visible dialogue text for about 2.5 s (13 samples at 200 ms); no overlap at 1600x900, 2000x1012, 2560x1080 or 3840x2160. On the FFX-2 phone the new floor (withStatusLooks.ts) moves the message clear of the docked hint within one 200 ms sample. The FFX phone had 0 px2 of message over dialogue in 15 samples. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0288 [polish, interface] (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- **Game / chapter / state:** FFX / Ch I
- **Observed:** 'TIDUS · Nothing left to say — A one-off action this enc…'
- **Expected:** The full help sentence, wrapped if needed.
- **Repro:** 390x844 Ch I after Talk is used up, cursor on TALK.
- **Evidence:** round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **Where:** 390x844 command menu, TALK disabled
- **Fix:** Allow two lines, or shorten the copy for the phone.
- **Acceptance:** scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0291 [polish, interface] (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- **Game / chapter / state:** FFX / I
- **Observed:** The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- **Expected:** As in the approved O3 target, both panels are readable.
- **Repro:** Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- **Confidence:** high
- **Requirement:** approved target O3 / interface readability
- **Where:** 1600x900 Items list aimed at a Zombie
- **Fix:** Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- **Acceptance:** No overlap between .stwarn and the Guide card rect in that frame.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** Re-observed on f302f163 and widened (visual auditor): at 1600x900 with the guide open, the red Zombie warning slab and also the grey TALK help slab ("A one-off action this encounter offers") overprint the Guide card's NEXT "Holy Water -> Yuna" line. Round 18's frame is identical. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0293 [polish, visual] (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- **Game / chapter / state:** both / I, IV, VII, XVII, XVIII (every chapter checked)
- **Observed:** Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- **Expected:** CHK-002: the pause painting covers the window at every supported size.
- **Repro:** Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- **Confidence:** high
- **Requirement:** CHK-002
- **Where:** pause layer at 4K (the 3360x1920 master is not scaled to cover)
- **Fix:** Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- **Acceptance:** pauseRect.full is true at 3840x2160 in both games.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** 4K pause not re-graded; see PR-0391 for the 4K battle HUD. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0296 [polish, interface] (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- **Game / chapter / state:** FFX / XVII sin-fins-core, first decisions
- **Observed:** Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- **Expected:** CHK-008: plates never cover the intent text.
- **Repro:** 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/
- **Confidence:** medium (frames only)
- **Requirement:** CHK-008
- **Where:** 390x844 battle HUD
- **Fix:** Reserve the intent line's band from the range plate on the phone layout.
- **Acceptance:** No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0302 [polish, interface] (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- **Game / chapter / state:** both / I (Zombie), IV (Curse); any hinted status
- **Observed:** Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- **Expected:** CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- **Repro:** critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- **Confidence:** high (measured)
- **Requirement:** CHK-003; RUBRIC section 5 (effective text size)
- **Where:** src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- **Fix:** Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- **Acceptance:** Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0303 [polish, interface] (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- **Game / chapter / state:** FFX (FFX-2's shorter target card leaves room: 0 px2) / I seymour-flux, a target step with a hinted status (Zombie)
- **Observed:** 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- **Expected:** The target-step instructions and the hint do not overlap (CHK-008).
- **Repro:** Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- **Confidence:** high
- **Requirement:** CHK-008; PR-0282 acceptance (the hint never over the command surface)
- **Where:** src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- **Fix:** Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- **Acceptance:** 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0304 [polish, interface] (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- **Game / chapter / state:** FFX-2 (desktop, guide open) / IV ffx2-bahamut, the girls' menus after Curse lands
- **Observed:** At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- **Expected:** While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- **Repro:** Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- **Confidence:** medium (symptom high; cause suspected)
- **Requirement:** Status O3 target (the hint in the guide's slot); CHK-008
- **Where:** suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- **Fix:** Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- **Acceptance:** 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0305 [polish, onboarding] (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- **Game / chapter / state:** FFX-2 (the FFX help line follows each actor in both modes) / IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
- **Observed:** Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- **Expected:** The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- **Repro:** 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- **Confidence:** medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- **Requirement:** CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- **Where:** suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- **Fix:** Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- **Acceptance:** BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- **Tags:** introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0317 [polish, visual] (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900

- **Game / chapter / state:** FFX only / I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03)
- **Observed:** His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
- **Expected:** A boss in action stays inside the frame (CHK-014).
- **Repro:** Candidate, seed 1, 1600x900, Ch I, let Seymour act.
- **Evidence:** critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
- **Confidence:** high
- **Requirement:** CHK-014; CHK-013
- **Fix:** Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
- **Acceptance:** Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.
- **Merged / aliases:** R19-VIS-05
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0319 [polish, visual] (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line

- **Game / chapter / state:** FFX only / IX yojimbo-cavern, first menu 2000x1012
- **Observed:** Under the colossus master the far-back figure stands on the party's line at party scale.
- **Expected:** Background staging reads as background.
- **Repro:** Candidate, seed 1, Ch IX first menu.
- **Evidence:** critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
- **Confidence:** low
- **Requirement:** visual: composition
- **Fix:** Push the prop deeper or dim it under the colossus master.
- **Acceptance:** In the first-menu frame Ginnem sits clearly behind the line or out of view.
- **Merged / aliases:** R19-VIS-08
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0322 [polish, onboarding] (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey

- **Game / chapter / state:** both / pause > OPTIONS > EYE CANDY
- **Observed:** FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
- **Expected:** Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
- **Repro:** Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
- **Confidence:** high (contrast estimated from JPEG)
- **Requirement:** D-317; CHK-003
- **Fix:** Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
- **Acceptance:** After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Merged / aliases:** R19-ON-01
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0323 [polish, onboarding] (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")

- **Game / chapter / state:** both / pause > OPTIONS > EYE CANDY
- **Observed:** CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
- **Expected:** Copy a first-time player understands (CHK-007).
- **Repro:** Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
- **Confidence:** high
- **Requirement:** CHK-007
- **Fix:** Name the thing: "Off: the standard battle camera", "Off: the plain splash".
- **Acceptance:** No "today" in the page's help strings; capture at 1600x900.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Merged / aliases:** R19-ON-02
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0325 [polish, interface] (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot

- **Game / chapter / state:** FFX only / I seymour-flux, 1600x900
- **Observed:** 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
- **Expected:** The selected row is obvious (CHK-010).
- **Repro:** Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
- **Evidence:** critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
- **Confidence:** medium-low
- **Requirement:** CHK-010
- **Fix:** If confirmed, give the selected row the filled slab of the main list.
- **Acceptance:** Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Merged / aliases:** R19-IF-04
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0331 [polish, visual] (new, a question for Bailey): the fail-closed gates take the D-316 colossus master away from Natus, Braska's Final Aeon and Evrae; only Yojimbo and FFX-2 Bahamut keep it

- **Game / chapter / state:** FFX only (Ch III, VIII, X) / seymour-natus, braskas-final-aeon, evrae-airship, 1600x900 to 2560x1440
- **Observed:** At all five aspects Natus, BFA and Evrae render exactly as live 35 (pixel-mean difference 10, 22, 17, mostly HUD text): Natus about 160-190 px tall at 1600x900 against about 470 px in round 19's candidate. Not worse than live; narrower than round 19 promised.
- **Expected:** D-316 lists colossus presence for the big bosses.
- **Repro:** Seed 1, first menu of Ch X, III, VIII at 1600x900; compare with gaps/fm-*-live35.
- **Evidence:** critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/evidence/gaps/plate/seymour-natus.json
- **Confidence:** high
- **Requirement:** D-316 scope; RUBRIC visual and feel (boss presence)
- **Where:** src/engine/fx/mix/framing.ts, plate.ts (gates)
- **Fix:** Ask Bailey whether Natus should get its master back by steering the Sensor card off the boss (builder's proposal); list the three chapters as "today's framing" in the release notes.
- **Acceptance:** Bailey's decision recorded; if steered, Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged / aliases:** V19B-01; feel suggestion "Natus, BFA and Evrae lost their colossus master"
- **Note:** Natus now stands 346 px tall and clear of his card (D-427); the question for Braska's Final Aeon, Evrae and Yunalesca stays. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0332 [polish, visual] (new, pre-existing): at 2560x1080 every measured chapter shows plate side bands; worst is Yunalesca (15.4 percent of the plate share, dark pillars and a tilted edge)

- **Game / chapter / state:** both (FFX measured in 6 chapters; FFX-2 Bahamut 9.4 percent) / yunalesca, braskas-final-aeon, seymour-natus, yojimbo-cavern, evrae-airship, seymour-flux, ffx2-bahamut; 2560x1080 first menu
- **Observed:** plate share at 2560x1080, chosen = today: Yunalesca 0.154, BFA 0.103, Natus 0.094, Yojimbo 0.094, Evrae 0.085, Flux 0.034, Bahamut 0.094. No live-35 frame at this aspect; parity rests on the builder's chosen = today measurement.
- **Expected:** The painted plate fills a 21:9 frame (platform goal 4:3 to 21:9), or the edge is dressed.
- **Repro:** Seed 1, Ch II first menu at 2560x1080; gapcap/plateprobe.mjs.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/fm-yunalesca-2560x1080/11-first-menu-N-G-hidden.png; critic/rounds/round-19b/evidence/gaps/plate/*.json
- **Confidence:** medium
- **Requirement:** RUBRIC section 2 platform goals; visual composition
- **Where:** plate cover-fit for frames wider than 2:1 (suspected)
- **Fix:** Cover-scale the plate for frames wider than 2:1 (crop top and bottom) or extend the edge with the existing fog; never repaint approved plates.
- **Acceptance:** Plate share 0 at 2560x1080 in all seven chapters.
- **Tags:** introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- **Merged / aliases:** V19B-02
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0335 [polish, harness] (critic tooling, widened; R20-PD-04 + capture owner): the phone route never uses the FFX list's page buttons, so the intended Poison Fang and Holy Water lines are never taken by touch (Ch I phone defeat 3 of 3, as 19b), and non-battle screens are reached by keyboard

- **Game / chapter / state:** FFX only / I Seymour Flux, 390x844 touch
- **Observed:** Three phone attempts end in defeat at 9, 11 and 31 turns; run.json misses list 'Poison Fang' and 'Holy Water' with only the first six rows (Potion to Mega Phoenix) of x27 exposed; the harness fell back to Attack. Product reachability by touch is not shown either way. Three phone attempts (seed 1 and seed 2001) ended in defeat at 9, 31 and 11 turns and 9 turns. The misses list turns 3-7 wanting Poison Fang and turns 1-2 wanting Holy Water; subRows show Potion, Hi-Potion, X-Potion, Mega-Potion, Phoenix Down, Mega Phoenix only, although the pause shows 27 items. Taps were 31 and 167; keyboard fallbacks 38 and 61 (START BATTLE, CONFIRM, RETRY and chapter select were pressed on the keyboard). Capture owner: Wanted Poison Fang, the route took Attack; Yuna down, defeat. Identical 9-turn defeat in round 19b; desktop wins in 73 turns.
- **Expected:** A touch run reaches any item by the page buttons the phone shows.
- **Repro:** critic/rounds/round-20/cap/route20.mjs seymour-flux --size=390x844 --touch
- **Evidence:** critic/rounds/round-20/evidence/seymour-flux-win-phone-touch/run.json misses; seymour-flux-win-phone-r2-touch/run.json
- **Confidence:** high for the harness limit; unknown for the product
- **Requirement:** CHK-015, CHK-022
- **Where:** critic/runner/lib/route-ui.mjs chooser.choose (taps visible rows only); product: src/ui/ffx/CommandMenuScroll.ts (6-row window, phone page buttons)
- **Fix:** Teach the touch chooser to tap the page buttons until the row shows.
- **Acceptance:** A touch run plays Holy Water and Poison Fang on the advisor's turn.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Merged / aliases:** R19B-PD-02; R20-PD-04; capture owner: phone Ch I cannot play the intended line
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0336 [polish, harness] (carried from round 19 unnamed, critic tooling): the save matrix reports a false FAIL for the fresh-profile case

- **Game / chapter / state:** both / n/a
- **Observed:** save-matrix.json says 23 of 24 and fails fresh-profile; its unexpectedDiffs (version, chapters {}, unlocked [], seenCoach [briefing], flags {}) are the normal default save; looks, parts, volumes, reload and errors are all correct.
- **Expected:** The harness passes a correct default save.
- **Repro:** critic/rounds/round-19b/cap/save-matrix19.mjs
- **Evidence:** critic/rounds/round-19b/evidence/save-matrix/save-matrix.json
- **Confidence:** high
- **Requirement:** CHK-024 evidence quality
- **Fix:** Make expected("{}") the default save shape.
- **Acceptance:** The matrix prints 24 of 24 on an unchanged build.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Merged / aliases:** R19B-PD-03
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0337 [polish, harness] (critic tooling, carried): network and console logging gaps; the one console error of the round (net::ERR_CONNECTION_CLOSED, Ch I win) was logged with no URL; the Ch I re-run read 0

- **Game / chapter / state:** both / n/a
- **Observed:** network-and-console-summary.json: 3,317 requests for 24 route runs and 0 for each of the 53 gap-pass sessions; the 36 save-matrix board shots carry an asserted screen but no verified stamp.
- **Expected:** Every capture session records requests, status >= 400 and console errors.
- **Repro:** critic/rounds/round-19b/gapcap/gaplib.mjs; critic/rounds/round-19b/cap/save-matrix19.mjs
- **Evidence:** critic/rounds/round-19b/evidence/network-and-console-summary.json
- **Confidence:** high
- **Requirement:** CHK-016, CHK-018
- **Fix:** Record requests and console errors in gaplib.mjs and save-matrix19.mjs; stamp the matrix shots through the route runs' screen assertion.
- **Acceptance:** Every 19c session carries a network and console log.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Merged / aliases:** R19B-PD-04; D22-05; X-1
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0359 [polish, harness] (critic tooling, carried, cause proved): route.mjs findCard presses ArrowRight at most 16 times, so the 18th tile (Ch XVI Ixion) is never selected; the gap pass reached and won it with 18 presses, so the board is keyboard-reachable

- **Game / chapter / state:** both (tooling) / XVI Ixion and Djose, board
- **Observed:** ffx2-ixion-djose-win and -r2 threw 'ASSERT-FAIL card ffx2-ixion-djose got seymour-flux' after 12 s; the walk reaches ffx2-den-of-woe and turns back. Run 3 reached the card and won. Not a product fault: the board has 18 tiles and the cursor moves tile by tile. Related: the route's 'fight' step still labels a chain link's win 'victory' when a later link is lost (PR-0261).
- **Expected:** The harness reaches any of the 18 tiles and labels an outcome from the final results screen.
- **Repro:** node critic/runner/lib/route.mjs ffx2-ixion-djose win --base=<live>, size 2000x1012 (runs 1 and 2 of this round).
- **Evidence:** critic/rounds/round-22/evidence/ffx2-ixion-djose-win/run.json; critic/rounds/round-22/evidence/ffx2-ixion-djose-win/99-error.png; critic/rounds/round-22/evidence/gaps/ffx2-ixion-djose-win-gap/run.json
- **Confidence:** high
- **Requirement:** CHK-016 (a failed wait throws and never screenshots the wrong screen; it did throw)
- **Where:** critic/runner/lib/route.mjs:84-88
- **Fix:** Press up to the tile count, and fail loudly when the walk does not find the card.
- **Acceptance:** All 18 chapters reach their card in one pass; a chain defeat reads 'defeat' in steps.
- **Merged / aliases:** R22-HARNESS-01; D22-01; H-1 (first half); combat-encounter: capture harness cannot select the 18th tile
- **Note:** carried from round 21 and re-observed or updated in round 22

### PR-0396 [suggestion, delivery] (new, D22-07, a question for Bailey): the content-hashed bundle is served max-age=0, must-revalidate, so a return visit revalidates every file

- **Game / chapter / state:** both / hosting / returning visit
- **Observed:** curl HEAD: assets/index-DIf_suBq.js, art/*.webp, art/*.png and audio/*.mp3 all answer Cache-Control: public, max-age=0, must-revalidate with an ETag, CF-Cache-Status HIT. The live review saw 13 x 304 after one reload. Safe and correct, but each return visit makes a conditional request per file. Art files are not content-hashed, so only assets/* qualifies for immutable caching.
- **Expected:** Content-hashed files under assets/ are cacheable for a year (the vetted _headers hook in tools/deploy-host.mjs exists for this).
- **Repro:** curl -I https://echoesofspira.com/assets/index-DIf_suBq.js
- **Evidence:** critic/rounds/round-22/delivery/verify-live-full.json (assetCacheControl); curl HEAD on 2026-10-05
- **Confidence:** high
- **Requirement:** delivery (returning-player load)
- **Fix:** Ship the vetted _headers with a one-year immutable rule for /assets/* only; Bailey decides (it touches hosting).
- **Acceptance:** curl -I on /assets/index-*.js shows a long immutable cache; art and audio unchanged.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0399 [suggestion, visual] (a question for Bailey): the approved Leblanc backdrop tile's picture (crate warehouse, teal door) and its written pick (magenta/cyan, door and heart panel) disagree; the build follows the text

- **Game / chapter / state:** FFX-2 / ffx2-leblanc
- **Observed:** The approved tile 'The Leblanc Syndicate (FFX-2)' shows a crate warehouse with a teal door; its own text says 'mixed magenta/cyan, visible door and heart panel'. The build (neon heart over a blue door) matches the text, not the picture. Delivery is 'in-progress'.
- **Expected:** One reference.
- **Repro:** node tools/end-state-board.mjs --pair docs/concepts/chapters/leblanc/renders/backdrop-c.png critic/rounds/round-22/evidence/ffx2-leblanc-win/23-midfight.png
- **Evidence:** critic/rounds/round-22/targets/leblanc.jpg
- **Confidence:** medium
- **Requirement:** RUBRIC 7: waiting on a decision
- **Fix:** Ask Bailey which of the two he approved; no art change proposed.
- **Acceptance:** Bailey's answer recorded in the tile's reaction.
- **Tags:** introducedByCandidate false, regressionVsLive false

### PR-0400 [suggestion, combat] (new, FFX only): research/ffx-seymour-flux.md row 13 and the Jegged notes still recommend Defend before Total Annihilation while the shipped guide and the engine say Defend halves physical hits only

- **Game / chapter / state:** FFX / I
- **Observed:** research/ffx-seymour-flux.md section 6 row 13 and research/jegged-encounter-guides-ffx-a.md row 1 name 'Shell + Defend'; the shipped guide and WATCH rail now say Defend only halves physical hits, matching research/ffx-combat-core.md 5.1 and the engine (3,855 plain, 3,855 with Defend, 1,925 with Shell).
- **Expected:** A labelled conflict in research so the next guide edit does not restore it.
- **Repro:** read the two research files against tests/unit/guide-seymour-defend-magic.test.ts
- **Evidence:** critic/rounds/round-22/combat (source reads)
- **Confidence:** high
- **Requirement:** AGENTS rule 6 (sources and their conflicts recorded)
- **Where:** research/ffx-seymour-flux.md
- **Fix:** Add a one-line conflict note to ffx-seymour-flux.md row 13 and, if Bailey wishes, check Defend against Total Annihilation in the Steam HD copy.
- **Acceptance:** research/ffx-seymour-flux.md row 13 carries a conflict note.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature true

### PR-0405 [suggestion, delivery] (R39F-09, carried from the focused review): the title fetches 58 art files before input (live 38: 27); the board alone had requested 96 MiB in the Ixion run

- **Game / chapter / state:** both / title, board / cold start
- **Observed:** Focused review count; this round's Ixion run requested 64 files and 96 MiB before leaving the board.
- **Expected:** A first screen that asks only for what it draws.
- **Repro:** Fresh profile, title, network log.
- **Evidence:** critic/reviews/c7135bec-focused.json; critic/rounds/round-22/evidence/ffx2-ixion-djose-win/network-media.json
- **Confidence:** medium
- **Requirement:** RUBRIC 2 load goal
- **Fix:** Defer prefetch until the first input.
- **Acceptance:** Title requests at most the files it draws.
- **Merged / aliases:** R39F-09

### PR-0299 [suggestion, audio] (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- **Game / chapter / state:** both / all
- **Observed:** The save migration moves an untouched 0.35 SFX level to 0.70, which cannot tell a deliberate 0.35 from the old default (D-293 marks this half as inferred). A question for Bailey, nothing changed in this build.
- **Expected:** RUBRIC s7: an inferred item is asked before it is built.
- **Repro:** Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- **Confidence:** high
- **Requirement:** RUBRIC s7 inferred items; D-293
- **Fix:** Ask Bailey whether this is acceptable. No code change unless he says no.
- **Acceptance:** D-293's inferred note moves to named, or is reversed by Bailey.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0358 [suggestion, interface] (new; R20-IF-05, a question for Bailey): the phone advisor line names the menu but not the cost

- **Game / chapter / state:** both / I (FFX) and IV (FFX-2), 390x844
- **Observed:** Re-observed: the phone advisor line names the menu but not the cost.
- **Expected:** RUBRIC section 2: the advisor says where an action is and what it costs.
- **Repro:** First menu at 390x844 in Ch I or IV.
- **Evidence:** critic/rounds/round-20/evidence/seymour-flux-win-phone-r2-touch/11-advisor.png; ffx2-bahamut-win-phone-touch/run.json advisorText
- **Confidence:** medium
- **Requirement:** RUBRIC section 2
- **Where:** phone TIP line (covered by tests/unit/advisor-phone-tip-menu.test.ts, which asserts the menu only)
- **Fix:** Append the MP when it fits on the line; no change if Bailey prefers the shorter tip.
- **Acceptance:** Phone tip shows the MP cost for a spell at 390x844 without ellipsis.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0227 [suggestion, encounter] (carried, STALLED, a question for Bailey): Chapter XIII (Trema) is not won at human pace by real keys, now 0 of 25 across rounds 19-21 (0 of 7 this round)

- **Game / chapter / state:** FFX-2 / Ch XIII Trema (Oversoul Paragon link, then Trema)
- **Observed:** Shipped bench (D-151 options 1 and 3, 200 seeds): chapter 13/200 at the human Wait split (6.5 percent), 14/200 bench; Paragon link 28/200, Trema alone 170/200. Real keys this round: seeds 1 and 1001, plus five attempts on seeds 1 to 4001: 7 defeats at link 1. P(0 of 25 | 6.5 percent) is about 0.19, so the real-key record agrees with the shipped bench: the wall is the authored Paragon link, not the route. No victory flow has been shown for four rounds. Merged: the gap pass ran Trema under the labelled autoBattle('intended') hook at fast speed: link 1 won once (phase 2 reached, boss-ffx2-aeon replaces the scene bed at 169 s), then 12 defeats in 13 attempts in 20 minutes, never a win (a bot result, not a human one); the narrative auditor's R21-NARR-01 (the Trema and Den aftermath have no real-flow evidence for the 4th and 3rd round) is a cross-reference, not a separate ticket. Bench: Trema whole chapter 13/200 (6.5 percent) human split.
- **Expected:** Bailey's decision whether roughly 1 win in 15 tries is the intended difficulty; if yes, the chapter needs its win flow shown by a long human run.
- **Repro:** PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/trema-shipped-bench.test.ts; critic/rounds/round-21/logs/ffx2-trema-r2.log
- **Evidence:** critic/rounds/round-21/evidence/ffx2-trema-win-r2/run.json; ffx2-trema-win/run.json
- **Confidence:** high on the numbers; the difficulty intent is Bailey's
- **Requirement:** RUBRIC 6 encounter (correct difficulty); CHK-022 (milestone)
- **Where:** src/data/chapter-ffx2-trema.ts
- **Fix:** Run the RUBRIC 8 method check (route, why it stalled, two alternatives, the smallest test, one choice) and put the difficulty question to Bailey; do not tune boss numbers unasked (boss-side fix needs measured options).
- **Acceptance:** Bailey's recorded pick; a real-key victory with its results screen on the live build.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Trema lost again on seed 1 (89 and 99 turns); bench 5 of 100 at the human Wait split. Still a question for Bailey. carried from round 21 and re-observed or updated in round 22

### PR-0306 [suggestion, encounter] (carried, STALLED, a question for Bailey): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 18 real-key attempts over rounds 20-21 (0 of 7 this round)

- **Game / chapter / state:** FFX-2 / Ch XV Den of Woe (Baralai, Gippal, Nooj chain)
- **Observed:** Shipped bench re-run: first try 48/200 at the live Wait split, within 3 tries 127, within 5 tries 162, Active 1.5 s 18/200 (identical to round 20). Real keys this round: seeds 1 and 1001 plus five attempts (1 to 4001): 7 defeats, some with a link won first (the chain ended in defeat each time). Over rounds 20-21: 1 of 18 against 24 percent first try, P(1 or fewer) about 0.05, a mild shortfall that harness pace may explain; no engine change in release 38 (A/B digests 0 of 120 differ). The gap pass completed the Den of Woe victory flow once under the autoBattle('intended') hook (not human-paced, labelled): win on the third link, post-battle scene, Results (Victory, EXP/AP/Gil, NEW BEST, 2:34), Confirm, scene, back on the board. So the flow works and the results screen reads well; strict CHK-022 still wants a human-paced win.
- **Expected:** Real-key wins in the neighbourhood of the shipped bench, or a recorded reason why not.
- **Repro:** PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/den-of-woe-shipped-bench.test.ts; critic/rounds/round-21/logs/ffx2-den-of-woe-r2.log
- **Evidence:** critic/rounds/round-21/evidence/ffx2-den-of-woe-win-r2/run.json
- **Confidence:** medium
- **Requirement:** RUBRIC 6 encounter; CHK-022
- **Where:** src/data/chapter-ffx2-den-of-woe.ts
- **Fix:** Method check per RUBRIC 8 (same issue open at the same severity for two reviews); a quiet-host human-paced run to separate harness pace from difficulty.
- **Acceptance:** A real-key victory with its results screen, or Bailey's note that the difficulty is intended.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** Ch XV was won once by real keys this round (seed 2, 5:16); the bench at the human Wait split is 20 of 100. Still a question for Bailey. carried from round 21 and re-observed or updated in round 22

### PR-0217 [suggestion, combat] (carried): Zombie is kept across a KO (unsourced); the advisor's top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- **Game / chapter / state:** FFX / Ch I, II
- **Observed:** Three-line bench zombie rows unchanged and no status code changed in release 38.
- **Expected:** A sourced rule.
- **Repro:** ffx-bench.test.ts zombieHealTopRows, zombieReviveTopRows
- **Evidence:** critic/rounds/round-21/combat/ffx-three-line-r20.json
- **Confidence:** medium
- **Requirement:** AGENTS rule 6
- **Where:** src/battle/ffx status handling
- **Fix:** Source or label the rule.
- **Acceptance:** Research entry exists.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0352 [suggestion, prep] (carried, FFX only): Natus ships no item drop although research sources Lv. 2 Key Sphere x2 (x4 on overkill)

- **Game / chapter / state:** FFX only / X
- **Observed:** Natus's results panel in round 21 again has no ITEMS row (AP 6,300 x4, GIL 3,500); no Natus data changed in release 38.
- **Expected:** research/ffx-seymour-natus-highbridge.md line 96: Lv. 2 Key Sphere x2, x4 on overkill.
- **Repro:** Read the results text of evidence/seymour-natus-win/run.json.
- **Evidence:** critic/rounds/round-21/evidence/seymour-natus-win/run.json resultsText
- **Confidence:** high
- **Requirement:** AGENTS.md rule 6
- **Fix:** Add the item record from research/ffx-seymour-natus-highbridge.md line 96, still Bailey's to confirm.
- **Acceptance:** Natus results show the sourced Lv. 2 Key Sphere line.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0368 [suggestion, feel] (new, a question for Bailey; R21-FEEL-03, the builder's own): the FFX-2 run-in makes a plain Attack about 1.2-1.7 s long; is that the rhythm he wants

- **Game / chapter / state:** FFX-2 only / Ch V, VI
- **Observed:** Rikku's plain Attack at Vegnagun: menu closes 1.2 s, numeral 2.0 s, home by 2.4 s; engine hold to the next event 1,622 and 1,690 ms for Rikku, 598-984 ms for Paine; FFX-2 turn medians moved -0.4 to +1.4 s against round 20 (Fallen Aeons 7.1 to 8.5). The ATB clock keeps running during it in Active.
- **Expected:** A judgment, not a defect against any source.
- **Repro:** critic/rounds/round-21/evidence/ffx2-vegnagun-shuyin-win/clips/attack-2, ffx2-leblanc-win/clips/attack.
- **Evidence:** critic/rounds/round-21/feel-narr/veg-attack.jpg
- **Confidence:** high on the numbers
- **Requirement:** AGENTS rule 10 (ideas need a yes)
- **Fix:** None until Bailey answers (D-354 ask 5 leaves the run home, 0.27-0.39 s of it, open). Nothing to build without his yes.
- **Acceptance:** Bailey's reaction recorded in the tile.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0262 [suggestion, narrative] (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four

- **Game / chapter / state:** FFX / results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
- **Observed:** src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
- **Expected:** No two chapters share a first-choice quip, and at most two use 'That's it?'.
- **Repro:** Win I, II and VIII and read the results quip.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/seymour-flux-win/run.json
- **Confidence:** high
- **Requirement:** narrative: character voice, no repetition across chapters
- **Fix:** Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
- **Acceptance:** First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Seen again on f302f163: Ch I victory results read "...Okay. Next one." (seymour-flux-win/run.json resultsText). carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0297 [suggestion, target-registry] R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- **Game / chapter / state:** both / docs/target/targets.json group picks-0929
- **Observed:** All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- **Expected:** Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- **Repro:** Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- **Evidence:** D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- **Confidence:** high
- **Requirement:** RUBRIC §7 (delivery field, required targets)
- **Fix:** Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- **Acceptance:** node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands. carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0329 [suggestion, interface] (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON

- **Game / chapter / state:** both / pause > EYE CANDY
- **Observed:** A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
- **Expected:** As adopted in D-317 ("players who had a look off keep the new parts off").
- **Repro:** Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
- **Confidence:** high (behaviour); taste question
- **Requirement:** D-317; RUBRIC section 7 (inferred items never fail a build)
- **Fix:** None unless Bailey wants it.
- **Acceptance:** Bailey's answer recorded.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

### PR-0338 [suggestion, harness] (new, test harness): tests/unit/strategy-ffx2-bahamut.test.ts "heal-only route" takes about 10.8 s against the 15 s limit and timed out once on a loaded machine

- **Game / chapter / state:** FFX-2 / n/a (unit test)
- **Observed:** 324-file subset run: 1 failure, a timeout; re-run alone 19/19 pass in 11.8 s.
- **Expected:** A unit test well inside its time limit.
- **Repro:** npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts on a loaded host
- **Evidence:** critic/rounds/round-19b/combat/vitest-combat-subset.txt
- **Confidence:** high
- **Requirement:** test reliability
- **Fix:** Give that case its own timeout or fewer seeds.
- **Acceptance:** The case passes inside the subset run under load.
- **Merged / aliases:** combat "strategy-ffx2-bahamut heal-only route timeout"
- **Note:** carried from round 21; not re-observed in round 22 (open until a review shows otherwise)

## Resolved this round

- **PR-0360** (major): Phone taps and clicks answer Bushido and Swordplay (release 39); verified by critic/reviews/c7135bec-focused.json (reused: src/battle and src/ui/ffx are identical between c7135bec and 816d80f9, the live artifact was verified byte for byte).
- **PR-0340** (major): Lady Luck is in the Garment Grid in Ch V, XI, XIII, XV and XVI (engine grids match research/ffx2-lady-luck-availability.md; Change rows seen live in XI, XIII, XV, XVI; reels thrown by real keys in V, XI, XV and XVI in Wait and Active). Evidence: critic/rounds/round-22/combat/lady-layout.json, critic/rounds/round-22/evidence/gaps/ffx2-ixion-djose-luckW/, -luckA/, ffx2-fallen-aeons-change-paine/.
- **PR-0270** (major): TEXT SIZE reaches the FFX-2 battle HUD and pause (D-414); verified by critic/reviews/c7135bec-focused.json (reused with the same dependency argument). The residual is PR-0389 (the guide disappears at 115 and 130 in Ch IV and VI).
- **PR-0361** (major): Bushido chips name the key for the device: Shooting Star and Dragon Fang typed by real keys in six live battles with key-named chips read back (critic/rounds/round-22/evidence/sin-fins-core-win/battle-log.json).
- **PR-0362** (polish): The Enter that closes the last first-turn tip no longer picks Attack: in all 14 live runs where the tip showed, the first engine action was the advisor's move.
- **PR-0349** (polish): Reels are timed by the press (D-428): 20,000-spin bench, a careful aimer gets 9.0 percent Dud against 74.6 percent for a masher; the message always agrees with the stopped symbols. Evidence: critic/rounds/round-22/combat/ladyluck-pay.txt, ladyluck-chapters.txt; live reel overlays in critic/rounds/round-22/evidence/gaps/ffx2-vegnagun-shuyin-luck/.
- **PR-0289** (polish): The first-run card says "Start with this one." when another chapter is selected (D-416), read in the live dossiers; the "Click its picture" verb is PR-0386.

## Merged, downgraded and refuted

- PR-0377 <- R39F-03 + visual-targets CHK-026 issue + R22-FEEL-02 size half + fan size jumps and sliding feet
- PR-0379 <- R39F-04 double-image half + R22-FEEL-02 ghost half + PR-0367 + fan ghosting (two Bahamuts)
- PR-0378 <- R22-FEEL-01 + fan snapping
- PR-0380 <- R22-FEEL-03 + fan jerks or teleports
- PR-0330 <- I-2
- PR-0356 <- I-4
- PR-0370 <- I-7
- PR-0251 <- I-8 / R39F-05
- PR-0355 <- Magus Sisters bars
- PR-0366 <- party plates over legs + fan UI covering the action
- PR-0310 <- R39F-10
- PR-0032 <- I-10
- PR-0359 <- R22-HARNESS-01 + D22-01 + H-1
- PR-0339 <- D22-02 + D22-08
- PR-0337 <- D22-05 + X-1
- PR-0348 <- R22-FEEL-05
- PR-0372 <- gap pass phone OPTIONS
- PR-0326 <- audio issue 1
- PR-0373 <- audio issue 2
- the visual auditor's two UNVERIFIED items (Ixion, high-res) became coverage, not issues
- R22-FEEL-05 major (possible critical) -> refuted as a product defect, kept as critic tooling PR-0348: the gap pass reached Esc and Item by keys
- fan camera jerks major -> PR-0381 polish (one alternation; the rest are intended cuts)
- fan UI covering the action major -> folded into PR-0366 polish (no face or weapon covered)
- fan popping and attacks that do not connect stay polish as the fan rated them
- Refuted R22-FEEL-05: Not reproduced as a product trap: one Esc returns Rikku's White Magic submenu to the root list and Item lists Phoenix Down (critic/rounds/round-22/evidence/gaps/ffx2-leblanc-pd3/).

## Human judgments still owed

- [not recorded] Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
- [not recorded] Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
- [not recorded] Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
- [not recorded] Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
- [not recorded] Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
- [not recorded] Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
- [recorded] Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270) (D-416 and D-414 (adopted): "Start with this one." and TEXT SIZE in FFX-2)
- [not recorded] Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
- [not recorded] Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
- [recorded] Combat (FFX-2): should Lady Luck be reachable (a grid node for its owner) or ship dormant (PR-0340); should the reels be timed by the press (PR-0349) (D-361, D-417 and D-428 (adopted): Lady Luck selectable where the guides allow it, reels timed by the press)
- [recorded] Swordplay: yes to the estimates in research/ffx-combat-core.md 5.3 (zone 22/16/12/9 percent, marker 1,400/1,150/900/700 ms), or wait for sourced numbers (a four-row edit, PR-0308) (D-413 (adopted 2026-10-04))
- [not recorded] Overdrive inputs: check the Bushido order against the Steam HD copy (D:/Tools/ffx-hd) so the "our estimate" label can go (PR-0308); and how a phone player answers a Bushido or Swordplay (PR-0360, PR-0361)
- [not recorded] Encounter: is Trema (6.5 percent per attempt) and Den of Woe (24 percent first try) the intended difficulty at human pace (PR-0227, PR-0306, PR-0353)
- [not recorded] Feel: is a plain FFX-2 Attack of 1.2-1.7 s with the run-in the rhythm he wants; do the telegraph hold (1.14 s, paintings not yet installed) and the 1.22x dressphere push-in read as enough (PR-0368, PR-0314; CHK-B2)
- [not recorded] Visual: taste on the new paintings (Evrae E1-H, the plate wings, the Yuna, Rikku and Paine dresspheres) and the Echoes of Spira wordmark (CHK-B3)
- [not recorded] Feel: is the one-frame KO cut wanted (EC-1001-09), or should a KO travel (PR-0378)
- [not recorded] Visual: calibrate the five sub-scores against Bailey's own ratings after he plays release 39 (D-426)
- [not recorded] Visual: which Leblanc backdrop is approved, the tile's picture or its text (PR-0399)
- [not recorded] Narrative: may FFX-2 Ch XIII and XV open with a third-person narrator, or should Yuna narrate (PR-0390)
- [not recorded] Combat (FFX): do aeons have a Defend command in the Steam HD copy (PR-0383)
- [not recorded] Audio: should a defeat play a cue (THEMES.md has no defeat row; every defeat is silent)

## What stands between this build and acceptance

- Audio has no score until Bailey gives a numeric listening verdict (PR-0148, CHK-B1).
- Six categories sit under the 9.0 floor: visual 7.8 and feel 7.8 (the continuity majors PR-0377 to PR-0380 and PR-0382), delivery 8.5, interface 8.6, onboarding 8.7, encounter 8.9; the weighted score cannot reach 9.60 while visual and feel stay below 8.
- Nine critical or major issues are open (none critical).
- CHK-026 and CHK-027 FAIL; CHK-003 and CHK-009 FAIL at polish severity; CHK-002, CHK-008, CHK-010, CHK-013, CHK-015 and CHK-022 are UNVERIFIED.
- Four chapters have no real-input victory on this build (II, III, V, XIII); Trema's has not been seen for six rounds.
- Targets: 10 unverified and 1 waiting of 44.
- Bailey's judgments listed above.

## What changed since round 21

- Release 39 replaced release 38 on the live site; round 21 judged 6461999e (release 38.0) on the GitHub address, this round judged 816d80f9 on echoesofspira.com.
- The continuity harness (CHK-026, CHK-027) and the first-time fan ran in a deep review for the first time. The visual and feel scores fell (8.1 to 7.8, 8.7 to 7.8) because the new evidence measures breaks the earlier stills could not see; on the same harness release 39 is slightly better than release 38, not worse.
- Resolved: PR-0340, PR-0349, PR-0360, PR-0361, PR-0270, PR-0362, PR-0289. Combat 9.3 to 9.4, interface 8.3 to 8.6, onboarding 8.5 to 8.7; prep 9.1 to 9.0 and delivery 8.7 to 8.5 on thinner or newly negative evidence (slow-4G loads).
- First real-key victories seen for Ch XV (Den of Woe) since round 19, and for Ch XI on seed 2; Trema still unseen.
- Rubric v1 rounds 02 and 03 are history under another rubric and are not compared here.

## Proposals (nothing here is built without Bailey's yes)

- KO transition (PR-0378): if Bailey does not want the one-frame KO cut, one painted fall frame per party member or a 6 to 8 frame matched dissolve anchored at the feet. Benefit: the harness's snap rate drops from 0.56 to about 0.03 a minute and the most visible break goes. Cost: either 9 to 12 new paintings (art pipeline, mockup first) or a presenter change plus a test. Fit: both games; the originals animate a collapse. Risk: a dissolve can read as ghosting (PR-0379). Preview: a before/after strip mockup of Ch I swap-013. Nothing is built without Bailey's yes.
- Accessibility (PR-0032): a REDUCE FLASHES row (the engine already reads a reduceFlashes flag, fxEnv.ts:41), key remapping and a colour-vision option. Benefit: flashes now hide many pose swaps, so a player who cannot take them needs the row. Cost: one settings row is small; remapping is a larger UI. Fit: both. Preview: an OPTIONS page mockup. Nothing is built without Bailey's yes.
- Defeat cue: THEMES.md has no defeat row, so every defeat is silent. A short sting per game (FFX elegiac, FFX-2 lighter) could mark the moment. Fit: both, sourced from each game's own defeat conventions. Preview: an audio sketch in docs/audio/audition.html. Nothing is built without Bailey's yes.
- Immutable caching for /assets/* (PR-0396): one Cloudflare _headers rule for the content-hashed bundle only. Benefit: a returning player skips one revalidation per file. Cost: small; it touches hosting, so Bailey decides. Nothing is built without Bailey's yes.

## Next review

The live build 816d80f9 still owes the items in coverage.requiredNotTested; critic-clear decides what this report settles (a deep review with required coverage untested and mandatory checks UNVERIFIED settles nothing). Critic tooling first (no product change, no Bailey decision needed): findCard presses up to the tile count (PR-0359), a 1,500 s budget for III, V, XI and XVII (PR-0339), whole-label target matching (PR-0397), Esc out of submenus (PR-0348), a per-run continuity summary (PR-0398), then a gamepad lane and the 1280x720 / 2560x1080 / 2560x1440 captures. Product batch, in order: PR-0377 (FFX-2 and boss pose registration), PR-0379 and PR-0380 (crossfade and boss anchors), PR-0378 once Bailey answers the KO-cut question, PR-0382 (Ch XII heap), then the polish set (PR-0385, PR-0330, PR-0389, PR-0383, PR-0406). STALLED with a written method check owed before a further attempt: PR-0148, PR-0269, PR-0353, PR-0326, PR-0099.

## Server and process hygiene

The chief opened no browser and started no server. At report time the gap pass's background queue (critic/rounds/round-22/scratch/queue-gaps.sh) had finished every job except its last, a seed-2 1,700 s Ch XVII run that was not needed (Ch XVII was already won in the continuity run); the chief stopped it by PID (node 93308 and its two child processes, taskkill /T). The 1,700 s runs for Ch XI, XIII and XV had ended on their own (XI victory, XIII two defeats, XV victory) and were read as evidence. The capture owner's queue had finished (logs/ALLDONE). No node process naming round-22 remains.

## critic-clear output (verbatim)

```text
  still pending deep: required coverage was not tested: CHK-022: real-key victory with post-battle scene, results and saved reward for Ch II Yunalesca, Ch III Braska's Final Aeon, Ch V Vegnagun and Shuyin and Ch XIII Trema, CHK-026 and CHK-027 over Ch XVI Ixion (the harness could not select the tile), CHK-015: gamepad input on the live build, and the pause from a submenu, while targeting and during an animation, CHK-013: the 45 Lady Luck paintings and the new Garden of Pain, Via Purifico and Road to the Farplane backdrops judged in game at 2560x1440, and the 4x tier, CHK-008 and CHK-002 at 1280x720 and 2560x1080 (painting rect, panels over faces and weapons), CHK-010: all-enemies, aeon and Overdrive target sets at 1280 and 2560, CHK-B1, CHK-B2, CHK-B3: Bailey's listening score, play verdict on feel and story read for release 39
```
