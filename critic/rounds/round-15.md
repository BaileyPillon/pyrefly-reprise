# Critic round 15: deep review of the live release 28 (main 6ea8528f)

```text
Build / artifact / target version: main 6ea8528f, bundle DecUADzw, artifact 21bca0a4, targets.json sha256 9d08559de9ea
Review: deep (on the live build, after the deploy)
Deployment: PASS (exact artifact byte-identical on 48 and 150 files; 0 pageerrors in about 50 real-input runs; 18 404s are build content, PR-0223/PR-0224)
Changed area: FAIL (CHK-012, CHK-015, CHK-020, CHK-023 fail in changed areas; CHK-022 III/XII/XIII/VIII UNVERIFIED; target gate 7 failing, 21 unverified)
Ship: SHIP (no critical; no major is a regression vs release 27). Discloses 12 majors: PR-0148, PR-0221, PR-0226, PR-0228, PR-0219, PR-0220, PR-0232, PR-0240, PR-0179, PR-0099, PR-0032, PR-0222
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED, no number). Scored categories: combat 9.1, encounter 9, visual 7.8, feel 8.1, narrative 8.4, interface 7.8, onboarding 7.4, prep 8.6, delivery 8.2. Last validated deep report: round 13 on b975397b.
Targets: required 76 / matched 48 / failing 7 / unverified 21 / waiting on decision 5
Top issues: PR-0148 (major); PR-0221 (major); PR-0226 (major); PR-0228 (major); PR-0219 (major); PR-0220 (major); PR-0232 (major); PR-0240 (major); PR-0179 (major); PR-0099 (major)
Coverage: 15 playable chapters by real input on live (12 won, 23/23 retries); III, XII, XIII wins and VIII loss UNVERIFIED; load/frame time, real devices and the gap pass not tested
Next required review and why: follow-up deep pass on live 6ea8528f (or its successor) after the harness fix PR-0225; the deep obligation stays pending
Elapsed review time / repeated work avoided: 809 agent-minutes; focused and live reviews of the same sha reused with dependency arguments
```

## Score output (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: visual, feel, narrative, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category prep is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-017 is FAIL
  - mandatory check CHK-017 is UNVERIFIED
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-B1 is UNVERIFIED
  - 12 critical or major issue(s) remain open
  - encounter braskas-final-aeon has no complete real-input flow
  - encounter seymour-anima-macalania has no complete real-input flow
  - encounter seymour-omnis has no complete real-input flow
  - encounter ffx2-trema has no complete real-input flow
  - encounter ff7-guard-scorpion (hidden) has no complete real-input flow
  - 7 required target(s) failing
  - 21 required target(s) unverified
  - 5 required target(s) waiting
  - only 48 of 76 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148)
  - human judgment not recorded: Feel: Bailey's verdict after releases 22 to 28 changed camera, transitions and actors (CHK-B2)
  - human judgment not recorded: Narrative: Bailey's story read (Q2)
  - human judgment not recorded: D-257: Chapter IV pause hero plate (PR-0242)
  - human judgment not recorded: Ixion Q1: element of Thor's Hammer (IX-2 source conflict; shipped non-elemental, labelled estimate)
  - human judgment not recorded: Songstress paintings for Rikku and Paine (PR-0228) need an options round (rule 9)
  - human judgment not recorded: Accessibility settings rows (PR-0032) change a screen Bailey sees (rules 9, 10)
report: valid evidence
```

For information only (not a score): the weighted mean of the nine scored categories is 8.37. The tool refuses a total while audio has no verified number.

## The ten categories

| Category | Weight | Score | Status |
|---|---:|---:|---|
| combat | 20 | 9.1 | scored |
| encounter | 10 | 9 | scored |
| visual | 15 | 7.8 | scored |
| feel | 10 | 8.1 | scored |
| narrative | 10 | 8.4 | scored |
| audio | 10 | UNVERIFIED | UNVERIFIED |
| interface | 10 | 7.8 | scored |
| onboarding | 5 | 7.4 | scored |
| prep | 5 | 8.6 | scored |
| delivery | 5 | 8.2 | scored |

### combat (9.1)

[combat-encounter auditor, round 15 deep, live 6ea8528f / bundle DecUADzw] No browser opened. Engine work ran at HEAD 1a81a8ed, whose src/battle, src/data (except src/data/ixion-plates.ts, scene art) and src/engine/tactics are byte-identical to the live 6ea8528f (git diff 6ea8528f..HEAD). Scratch: D:/Final Fantasy/critic/rounds/round-15/combat-deep/ (harnesses in r15d/, results in out/). UNIT SUITE: 610 files and 9,617 tests pass. The one failure, strategy-ffx2-bahamut 'heal-only route clears Mega Flare', was a 15 s timeout while two benches ran alongside it; alone it passes 19/19, so it is host load, not a product failure (out/vitest-full.txt). tsc --noEmit is clean (out/tsc.txt). CHANGED DATA AUDITED AGAINST research/: (1) Ixion at Djose (FFX-2 only) against ffx2-ixion-djose.md §3.1 and §4. Every value matches: HP 12,380, MP 9,999, Str/Mag/Def/MDef 62/21/106/82, Agi/Eva/Luck/Acc 138/35/4/0, Lv 28, EXP/AP/Gil 2,600/15/1,800, Pilfer 3,000, absorbs Lightning, weak to Water, immune to Gravity, the status list plus Stop with Slow and Breaks left landable, fractional immunity, Soul of Thamasa drop, Sprint Shoes steal at rate 128, Attack DC16, Thundara all-target 12 MP DC12 not halved, Aerospark 5/8 of current HP never misses, Recharge 200 HP and 200 MP, Thor's Hammer DC30 all-target canMiss false. Estimates are labelled: the 3/4 split, the restart after the Hammer, non-elemental Thor's Hammer (IX-2 conflict, Bailey's Q1 still open), steal baseChance and the Lv 32-34 preset. (2) The PR-0179 arm-a rows (gagazet-aeon-arms.ts) equal ffx-combat-core.md §6.4.3's Mt. Gagazet block value for value for all five aeons. The live Chapter I engine shows Valefor at 1530/1530. (3) The held items Soul of Thamasa and Sprint Shoes are labelled single source with unsourced prices. (4) The D-242 switches: IC-1 ON, the SinirothX Leblanc script ON, PR-0107 and PR-0124 OFF. PR-0108 (Sleep held at Fast) and PR-0145 (all three petrified is a Game Over) are built and tested. SEEDED BENCHES, 40 seeds a row (out/ffx2-three-line.json): IC-2 wraps 0 in every FFX-2 chapter, so PR-0199 is closed. Acta Est Fabula hit only redoubt-r and redoubt-l, 867/867, so PR-0200 is closed. Immune results that still opened a chain: 0, against 110 immune results in Chapter XV and 1-4 in V (round 14 had 109 in XV), so PR-0209 is closed. Leblanc used Not-So-Mighty Guard exactly once per battle, 40 in 40. Ixion's Thundara share of free turns was 0.243 to 0.271 against the sourced 0.25, and Recharge was followed by Thor's Hammer 68/68, 101/101 and 98/98. LIVE RUNTIME = ENGINE (CHK-023): 18 of 19 single-link FFX live logs from the capture owner (Chapters I, II, III, VIII, IX, X, XII) replay event for event through the pure engine at the recorded engine seed (out/ffx-replay.json). The 3 'false' rows are live logs cut before the defeat event, with an identical prefix. Isaaru's log is only the last link, so it is not applicable. The live Chapter II log shows the Grand Summon picker request with all five aeons, then summons. The live Chapter VI log shows Leblanc's turn 1 Guard, then Fan Slap on turn 5 with no repeat Guard. The live Chapter XVI logs show Thundara 13/57 and every Recharge followed by Thor's Hammer. OPEN: PR-0179 narrowed (R15-C01): Chapters II, III and XII still ship aeon rows below both the research's rows and Chapter I's, so aeons get weaker later in the story. D-274 is adopted and its build is in progress. PR-0217 is an unchanged question about Zombie surviving a KO. The FF7 hidden fight is outside FFX/FFX-2: its tests pass and it is not scored here. || Chief: kept at 9.1. The changed data (Ixion, the arm-a aeon rows, the D-242 switches) matches its sources, three FFX-2 engine majors closed (PR-0199, PR-0200, PR-0209), and live logs replay through the engine; PR-0179 (II, III, XII aeon rows) is the one open combat major.

### encounter (9)

[combat-encounter auditor] Three-line benches, 40 seeds plus 40 large seeds for FFX (out/ffx-three-line.json) and 40 seeds for FFX-2 at human pace, 1 s Wait split (out/ffx2-three-line.json). Each row gives wins for the intended line / the advisor's top row / mash. FFX: I Flux 18+20/80 / 19+17/80 / 0. II 79/80 / 72/80 / 0. III 76/80 / 76/80 / 0. VIII 79/80 / 78/80 / 0. IX 72/80 (171/200 shipped not-learned) / 80/80 / 0. X 65/80 / 76/80 / 0. XII 50/80 / 45/80 / 0. XIV 80/80 / 80/80 / 0. FFX-2 at human pace: IV 40/40 / 40/40 / 0. V 30/40 / 37/40 / 0. VI 20/40 / 39/40 (round 14: 10/40) / 0. XI 28/40 / 34/40 (round 14: 29) / 0. XIII 3/40 / 2/40 / 0. XV 6/40 / 6/40 / 0 (D-191's accepted band). XVI Ixion 39/40 / 40/40 / 0, with instant play 40/40, consistent with D-269's 191/200. Mashing Attack loses every listed chapter, so the credible mistake is punished everywhere. Signature mechanics work: disc attacks are now advised in XII (PR-0197), Recharge is the tell for Thor's Hammer in XVI, and there is a checkpoint retry at Trema and at Shuyin. REAL FLOW, from the capture owner: wins by real keys in I (drawn seed), II, IV, V, VI, VIII, IX, X, XI, XIV, XV and XVI (three wins, one of them by touch). VII is NOT APPLICABLE ('coming'). III and XII lost 6/6 and 7/7, and I established why: the harness cannot steer to a lettered target. The advisor asked for 'Slow -> Yu Pagoda A' (yu-pagoda-left) and 'Attack -> Mortiphasm A', but slugOf('Yu Pagoda A') matches no data-target-id, so confirmTarget pressed ArrowRight 8 times and confirmed yu-pagoda-right (already Slowed: 41 wasted Tidus turns) and mortiphasm-3 (cap/lib/route-ui.mjs:125-132). On the same engine seeds the engine's advisor line wins III 9/9 and XII 5/7. The live III and XII runs replay exactly through the engine, so those losses are the command stream the harness fed, not the product. Their real-key wins are UNVERIFIED this round. XIII: no real-key win in 5 attempts across 3 runs with valid unique targets, which matches the bench, and Bailey chose this knowingly from the measured options (D-151, trema-options-2026-09-25: best 6.5 %). VIII's loss and RETRY are UNVERIFIED (harness stalled in the Orders overlay). Held back: Flux's ~45 % instant-play rate for the first chapter (unchanged from round 14), Trema's ~2-7 %, and aeons that are weaker in II and III than in I. || Chief: kept at 9.0. The III and XII real-key losses are harness-caused (PR-0225), so they neither lower this nor count as wins; CHK-022 stays UNVERIFIED for them. The confirmer's XII re-run is recorded as a dissent to be settled by the fixed harness.

### visual (7.8)

[visual-targets auditor, deep round 15, LIVE main 6ea8528f, bundle DecUADzw, artifact 21bca0a4] I did not open a browser. I judged the capture owner's evidence: PYREFLY_BROWSER=gpu, headless Chromium, real keys, taps and pad, at 1600x900, 2000x1012, 2560x1080, 1280x960 and 390x844. For the target gate I made 85 target-vs-build composites (critic/rounds/round-15/targets/*.jpg, script pairs.mjs, grids/g00-g21.jpg) and 14 contact sheets and crops (critic/rounds/round-15/visual/st-*.jpg, crop-*.jpg, script sheet.py). 83 of the 85 build frames are verified=true, mode gpu, not superseded. The two exceptions are ffx2-leblanc-win-p/30-post-scene and ffx2-ixion-djose-win/30-post-scene (verified=false), so those tiles are UNVERIFIED.

PROTECTION: approved 244/244 and judge-locked 48/48 are byte-identical in the stored manifest of the live build. That manifest (critic/artifacts/6ea8528f.json) is byte-identical to live per critic/reviews/6ea8528f-live.json, and it reports problems: []. verify-approved locally: 0 mismatched, 0 missing (targets/hashcheck-live.json).

FOR:
(1) FFX targeting now matches the approved s2 target in Ch III, I and X: the TARGET plate, gold corner brackets, a ring halo, a lettered name tag, the party panel dimmed and every enemy visible. PR-0031 is closed for s2 (D-249).
(2) Chapter XVI (Ixion) looks finished. It matches D-268 look B (possessed violet) at 1600 and 390, and D-273 Chamber C2 (the hole, the amber lamps, the lit floor). The phone framing (release 28, lit floor, every fighter whole) holds.
(3) The Grand Summon staging (Ch XIV): the party leaves the field, and the aeons face Isaaru's aeon at aeon scale. The Ch XIV part of PR-0181 is not seen again.
(4) Line card A (D-232) sits in a clear slot in Ch XIV, Ch VI and Ch XI.
(5) Battle scenes I to VI, VIII to XVI render their approved backdrops and bosses once the fight is up. Facing is correct in every captured chapter. Ground contact and scale hold (Vegnagun option A links 2 to 5, Yojimbo and Daigoro, Natus, Omnis discs, Trema, Den of Woe, Leblanc goons).
(6) The phone results (PR-0001 option B), the phone prep card (PR-0127) and the compact rail HUD hold in both games.
(7) The FF7 door stays invisible on the board: 16 cards, 0 of 15 beaten.

AGAINST:
- New major R15-VIS-01: on the live site, approved art paints seconds late or not at all at the moments the player looks.
  - The pre-battle speaker portrait is empty in 8 of 9 speaker lines (round 14: about 11 of 16 shown).
  - Pre-scene backdrops are black or half-painted in Ch II, IV, VI, IX, XIII, XIV, XV and XVI.
  - The pause member close-up (Bailey's Until Dawn centrepiece) is blank in 12 of 16 first-Esc captures, 6 of 6 tab-next captures and 2 of 2 phone captures. Round 14 showed it in about 24 of 29.
  - The portrait probe shows kimahri.png and rikku-x2.png still undecoded 7.7 to 7.9 s into the scene, with no 404.
  - The cause is not established: the capture order and request lists are the same as round 14, and network timing was not recorded.
- Carried: the Ch IV hero plate differs from its tile (D-257 open). The phone board card strips are missing (R14-VIS-02).
- New polish (hidden FF7 fight): 18 to 27 s of black after the door opens, and no Cloud pause close-up (404).

COVERAGE GAPS: there is no frame of the CHAPTER tab (hero plates, pause dossier C), no element-spell frame (spell FX B), no party-wide target step, no boss or goon hurt poses, no Shiva, no Swordplay, no Ch XI on a phone, and no Abyss A1 plate.

GAIN VS ROUND 14 (8.1): battle-field staging gained (targeting, Ixion, the summon staging). The scene and pause surfaces lost visibly: most players' first look at a chapter is now a black plate with an empty portrait frame, and the pause centrepiece is blank. So the category did not gain: 7.8. If R15-VIS-01 proves to be host network only (a re-capture with resource timing shows the art decoding within the waits), this score should be re-read, not averaged. || Chief: kept at 7.8. PR-0221 was partly reproduced by the confirmer (Ch IV yes, Ch I no), so the observation stands and the cause stays suspected; re-read the score once a resource-timing capture decides host versus product.

### feel (8.1)

Provisional on the timed sequences in critic/rounds/round-15/evidence. That is 167 GPU-mode sequences at about 230 to 350 ms per frame, across 15 chapters and both games, with keyboard, pad, 390x844 touch and reduce motion. Contact sheets are in critic/rounds/round-15/feel-narr/ (r15b-* files are this pass). Gains since round 14: (1) FFX actions are now named on screen, closing PR-0180 in Chapters I and X. Examples: 'Lance of Atrophy' and 'Full-Life' in seymour-flux-win-drawn/seq-party-action and seymour-flux-lose-rm, and 'Blizzard' in seymour-natus-win/seq-action-playing. Chapter IX Zanmato is not captured. (2) The A-2 battle-entry card behaves the same in all 38 transition captures in both games (feel-narr/r15b-transition-last-frames.jpg). It is still up at 2.4 to 3.0 s, which counts as authored time under D-206. (3) Chain seams hand back the menu quickly: Chapter XIV Isaaru seam 1->2 has the new aeon's cut at 1.1 s and the command menu at 1.8 s. Leblanc, Den and Vegnagun seams dolly to the incoming boss as authored. (4) Scene skip is respected: holdsToSkip=1 and Esc opens pause over the pre-battle scene in every run (run.json preScene). Action reads are about 1 s with damage numbers visible (Natus Blizzard, Ixion action-playing). Losses: first-use spherechange lag (R15-FN-02) and FFX-2 Songstress art resolving to a grey placeholder (R15-FN-01, scored under visual). PR-0104 is seen again on the phone. Not measured this round, so no credit given: input latency (no keydown-to-highlight or Confirm-to-action-start probe), PR-0061 scene-skip to first usable menu (the harness clocks cannot be aligned), menu-cancel timing, the FAST Chapter V pace (PR-0081), and the Chapter XII sending motion. No video clip exists, and Bailey has given no feel verdict (CHK-B2).

### narrative (8.4)

Provisional. Dialogue timelines come from run.json dboxTimeline for 40 runs (feel-narr/dbox-all.txt). The Chapter I and XVI scripts were also read from source to confirm the canonical beats beyond where the harness hold-skipped. Gains: (1) Chapter XVI Ixion at Djose is new. It is sourced beat for beat against research/ffx2-ixion-djose.md §7.2: Rikku's verbatim 'This can't be happening.', the fall, Shuyin taking Yuna for Lenne, Baralai revealed, Gippal's 'Take care of things topside.', Yuna's verbatim 'I'm all alone.' and four whistles as a playable beat. Its aftermath is reachable on keyboard, drawn seed and touch. (2) PR-0204 is closed: Chapter X Talk now speaks. Tidus has 'Stop talking...', Auron has 'Kinoc was my friend once...' and Yuna has 'You belong on the Farplane...', each with Seymour's answer (seymour-natus-win). (3) Only fielded speakers voice mid-battle lines (PR-0037 fix). This was checked across I, II, V, VI, XI, XII, XV and XVI. (4) Victory lines follow D-173/D-204: Tidus's grim line in I and II; Chapter IV's results are silent, as canon requires (writing-bible §5.4); 'I'm sorry, Isaaru' in XIV; 'We got it back' in VI. (5) Tone suits each game: FFX lines are elegiac and short, and FFX-2 uses three-beat banter with rationed sincerity (Fallen Aeons 'She didn't choose this.' / 'I know. That's what hurts.' / 'Okay. Hugs later. Road now.'). Open: PR-0161 and PR-0058 are still observed; the Chapter V coda location caption is wrong (R15-FN-03); Auron's 'Spread out' in Chapter III gives a false instruction (R15-FN-04). Coverage caps: the aftermaths of III (the FFX ending), XII and XIII were not reached this round because there was no real-key win; no full line-by-line scene walk exists, since the harness reads 3 or 4 lines and then hold-skips; the PR-0021 rotation re-test was not run; and Bailey's story read is not recorded.

### audio (UNVERIFIED)

[audio auditor, deep round 15, live build main 6ea8528f / bundle DecUADzw / artifact 21bca0a4] There is no number because none can be given. I cannot hear, and I listened to nothing: every result below comes from reading data. docs/audio/OWNER-VERDICT.md has no numeric score for the shipped mix. Bailey's latest ear verdict on the live mix (2026-09-27 ~00:40 EDT, release 21) is 'the game muisic still sounds like snes music', with no number. His Direction B pick (D-235, '7 is the only one that sounds good to me') covers a 12-second comparison clip, not the shipped cues. The Direction B re-renders (commit 5bdc16e6b) are candidates only: they do not ship and Bailey has not heard them as finished cues. Under RUBRIC section 6 the category is UNVERIFIED. It is not averaged away and it is not zero.

TECHNICAL HEALTH IS GOOD, AND THE SHIPPED AUDIO IS UNCHANGED SINCE ROUND 14. critic/artifacts/6ea8528f.json and d8837334.json have identical sha256 for all 25 music cues, the SFX sprite and the manifest. `git diff d8837334 6ea8528f -- src/audio public/audio/music public/audio/sfx` is empty. I stream-hashed all 27 live audio files: every one is byte-identical to the artifact manifest, served as audio/mp3 or application/json (critic/rounds/round-15/audio/live-audio-hashes.tsv). A live probe of audio/candidates returns 404, so PR-0100 is fixed: 0 candidate files ship, and `qa.mjs --strict` exits 0 (qa-strict.txt/json). An independent ffmpeg ebur128 pass decoded every file with 0 errors (ffmpeg-ebur128.tsv). Music measures -15.8 to -16.1 LUFS integrated and -1.1 to -2.9 dBTP, with 0 clipped samples and every loop seam ok. The sprite measures -19.4 LUFS and -1.1 dBTP. themes-audit reports 16 of 16 chapters matching the chapter cue map, and 3 of 25 cues still departing from the bible (PR-0039).

ROUTING LIVE. The capture owner took 263 AudioManager samples in 37 real-input runs (routing-summary.json). Every sampled cue at scene, battle, link seam and results matched THEMES.md's chapter cue map in chapters I, II, III (link 1), IV, V (Vegnagun x4, silence at seam-5 +3 s, then boss-shuyin, victory-ffx2, ending-ffx2 fetched), VI, VIII, IX, X, XI (x3), XII, XIII (scene bed, then boss-ffx2-aeon at the Trema seam), XIV (x3), XV and the new XVI Ixion (bed, boss-ffx2-aeon, victory-ffx2, scene-farplane for the Abyss). Chapter IV's results are silent by design, and every defeat's results are silent (the cue map has no defeat cue). No sample showed a synth source. No audio request returned 404. Chapter I's scoreless pre-scene stays silent (PR-0214 holds: all 5 Chapter I runs reach the first menu on boss-seymour). PR-0216 did not recur in about 34 keyboard or touch fresh sessions. The hidden FF7 fight is silent by design (music null, D-245).

NEW DEFECTS. R15-AUD-01 (major): after a pause, the pause cue took over and played for the rest of the fight in 3 of 52 fight ends (Chapters I, IV and XII). R15-AUD-02 (major): a gamepad-only player gets no audio at all, because unlock listens only for key, pointer and touch events. It showed in 2 of 2 pad runs, and in round 14 as well.

CARRIED: PR-0148 (no numeric owner verdict; owner-reported), PR-0099 (9 of 15 playable chapters still borrow cues, D-209), PR-0039, PR-0203 (D-210 is adopted but not built: the SFX bus is 0.9 over a music bus of 0.7).

Not verified this round: a direct sample of the title cue, the pause cue while paused, SFX event routing, the Chapter III phase 2 to 7 cues and its win cues (reused from round 14), and the XII and XIII victory cues (reused from round 13).

Gain rule: the category gains only when a numeric owner verdict is recorded for the shipped mix.

Note: the relayed chat question (session name, account, weekly usage) cannot be answered from this critic sub-agent and is left to the orchestrating session.

### interface (7.8)

Round 15 deep review of live 6ea8528f (bundle DecUADzw). All captures used headless Playwright with PYREFLY_BROWSER=gpu (one FF7 probe also ran in swiftshader). Evidence is critic/rounds/round-15/evidence/**, 1600x900, 2000x1012, 390x844, 2560x1080 and 1280x960. There are no 1440p or 4K captures this round (see capturesNeeded).

What got better since round 14 (7.7):
- Advisor v3 is in-flight aware. In Bailey's Mega-Potion case, played by real keys in FFX-2 Ch XI at seed 1, the next card never repeated Mega-Potion for either Yuna or Rikku (extras-advisor/run.json, extras-advisor-v3-megapotion/01a-02b).
- On every desktop chapter the advisor card names the menu path ('in Items', 'in White Magic', 'in Orders') and the costs (MP, 'no MP'). The measured advisor minimum is 14.2 effective px with 0 clipped rows (focFirst) and no overlaps except a transient 97 px2 coach overlap.
- Intent is honest. It separates SCRIPTED from MOST LIKELY 58% and POSSIBLE 33%, labels 'IF YOU ATTACK' as conditional, and says 'Lands on one of these, picked when it acts'.
- Target cancel leaves no targets on the board in every chapter (afterTargetCancel targets 0).
- Pause opens and closes with Esc and P, and resumes by Esc. Prep Esc returns to the board.
- The Grand Summon picker on the phone was verified on this same build (reused 6ea8528f-focused).

What holds the score down:
- R15-IF-01 (major): FFX command lists longer than 6 rows cannot be reached by touch on a phone, and the phone TIP still names the unreachable row (Fire Gem in Ch IX, Poison Fang in Ch I). Both phone losses in Ch IX and the Ch I phone losses follow from it.
- R15-IF-02 (major, medium confidence): in Ch XII on the phone, taps on Yuna as a target are intercepted by a dimmed enemy hit box.
- Polish:
  - a clipped turn-list name at 2000x1012
  - filler advisor reasons with misapplied 'ALWAYS HITS' chips
  - Darkness 'Costs the party HP'
  - an illegible Orders dead end in Ch VIII
  - coach bubbles over faces
  - an off-style PAUSE chip
  - the guide rail disagrees with advisor v3 while a heal is charging
  - the Grand Summon subtitle on the phone is still sub-legible (FOC28-P02, carried)

The score is 7.8 and not higher because a phone player cannot reach the advised items, which defeats the device's core flow in two FFX chapters. || Chief: kept at 7.8 although the confirmer downgraded R15-IF-01 to discoverability (PR-0218, now polish). The auditor's stated reason, that a phone player cannot reach the advised items in practice, still holds for a player who is not told about the tap-then-Back ladder (the scripted touch player lost IX 2 of 2), and the other phone major (PR-0232) and the gamepad menu (PR-0219) remain.

### onboarding (7.4)

Present and working by real input:
- Auron's briefing is skippable, time-limited and has 'never show again'. Its copy is honest about FFX CTB and FFX-2 Wait (seymour-flux-win-drawn/run.json briefingText).
- First-time coach marks that you continue with Enter or that fade on their own, with game-aware copy (FFX 'He moves after you'; FFX-2 'GAUGES RUNNING - A COMMAND HOLDS THEM').
- Optional guide (G), advisor (N) and intent (E) toggles.
- A pause OPTIONS tab with master, music and SFX volume, text speed, strategy guide and battle help. FFX-2 alone gets the X-2 BATTLE row.
- A CONTROLS tab exists.
- Settings and progress carry across releases 20 to 25 and main (extras-save-* runs).
- The OS reduce-motion preference is honoured: the battle-entry transition becomes a static card (feel-narr/seymour-flux-lose-rm__seq-transition-into-battle.jpg).
- Keyboard, gamepad shim and touch routes all reached outcomes, and FFX-2 Ch XVI was won by touch on a phone.
- Element chips carry text labels, and targets carry label, brackets and an ALL ALLIES chip, so the cues do not rely on colour alone.

Still missing, and why this does not improve on round 14:
- R15-ONB-01: no in-game text size, no key or button remapping, and no in-game reduce-motion, low-effects or flash toggle. `reduceMotion` and `lowEffects` exist in SaveData but PauseScreenPanels.ts deliberately omits them, and there is no other settings screen.
- Phone access is undermined by R15-IF-01. It is scored in interface and only cross-referenced here.
- Pad evidence comes from a navigator.getGamepads shim, not a real controller.
- The CONTROLS tab content was not captured.

The newcomer walkthrough was SIMULATED (a scripted harness using only visible prompts and ordinary keys or taps), not a real newcomer.

### prep (8.6)

Build main 6ea8528f, bundle DecUADzw, live https://baileypillon.github.io/pyrefly-reprise/. Capture owner's evidence is from headless Chromium, PYREFLY_BROWSER=gpu (critic/rounds/round-15/evidence). PREP AGENCY: every one of the 15 playable chapters reached party prep by real keys. FFX shows the CHAPTER / STATS / SPHERE GRID / EQUIPMENT / ITEMS / OVERDRIVE tabs and a 7-member roster. FFX-2 shows CHAPTER / DRESSPHERES / STATS / ACCESSORIES / ITEMS. Each has objectives and a sourced TIP (run.json prepText in seymour-flux-win-drawn, ffx2-ixion-djose-win, yojimbo-cavern-win, ffx2-den-of-woe-win). Esc from prep returns to the board in every run (prepEsc=chapter-select). The phone prep at 390x844 is readable and has a START BATTLE bar (ffx2-ixion-djose-win-touch/04-prep.png). RESULTS: the victory screens show time, NEW BEST, AP or EXP, gil, items and per-member progress (seymour-flux-win-drawn/31-results.png: AP 10,000 x3, Lv. 4 Key Sphere, +9 S.Lv. Ixion: EXP 2,600, 15 AP per dressphere, Soul of Thamasa). Yojimbo's AP 0 and gil 0 are sourced (research/ffx-yojimbo.md section 2.4). The defeat screens show TURNS, ATTEMPTS and BEST, and ATTEMPTS counts correctly across 2 and 3 losses (seymour-omnis-win-drawn, braskas-final-aeon-win-drawn2, ffx2-trema-win-drawn). RETRY: 23 of 23 retries reached the battle (run.json retryReachedBattle). RETRY goes to prep in 3.0 to 3.6 s and the first command menu follows 5 to 13 s later. Those times include fixed harness waits of 3000, 1500 and 3500 ms. A retry skips the pre-battle scene by design (BattleScreenFlow.ts:344) and reseeds (+1000 per attempt). Chain chapters have checkpoint retry. PROGRESS: a clear persists to the board and survives a reload in all 12 routes that checked (35-board-reload). Best times show on the board (BEST 5:12). Release-20 and release-25 save fixtures carried forward on live with clears, best times and settings intact (extras-save-20/run.json, extras-save-25-main/run.json). The FF7 experiment left the main save byte-identical (extras-door/run.json). The unit suite passes: 38 save/prep/results/flow/FF7-record files, 740 tests (critic/rounds/round-15/delivery/vitest-save-prep-delivery.txt). DEDUCTIONS: the Trema loss wedge is empty (R15-DEL-01). A KO'd member's +0 AP has no stated reason (R15-PREP-01). Three chapters (BFA, Omnis, Trema) were not won in 16 attempts with the advised line, and one BFA loss runs 16:49, which makes the retry loop long; scored under encounter (R15-CAP-04), cross-reference only. Items below the sixth row cannot be reached by touch on a phone, which blocks item-based prep tactics there; scored under interface (R15-CAP-01), cross-reference only. Up from round 14's 8.5 for the stalemate (WITHDREW) card and the results line card, with no new prep-owned defect above polish.

### delivery (8.2)

EXACT ARTIFACT (CHK-017): node tools/artifact-manifest.mjs verify-live against critic/artifacts/6ea8528f.json returned PASS. The artifactHash is 21bca0a4...1254, the live manifest matches, and 48 files (the default sample) were byte-identical (critic/rounds/round-15/delivery/verify-live.txt). A second run with --changed-from critic/artifacts/d8837334.json (everything changed since round 14) plus a 60-file sample was PASS on 150 files, with 0 mismatched, missing or wrong-type (delivery/verify-live-changed-since-r14.json). MEDIA (CHK-019): the manifest has 913 files and 484 MB, decodeChecked=true, problems=[], audioUnverified=0. A cold curl on this host gave index.html 0.16 s, the 3.16 MB bundle 1.07 s, and 4.8 to 5.7 MB backdrops 1.5 to 1.9 s, all with the correct content type. STABILITY: about 50 live headless runs across 15 chapters plus extras recorded 0 pageerror events and 0 JS console errors. The only console errors are 18 resource 404s on 5 distinct URLs (evidence/console-and-404-summary.json). FLOWS (CHK-022): all 15 playable chapters reached an outcome, results and RETRY or CHAPTER SELECT by real keys, with no lock. 12 of 15 were won by real input, with aftermath and board. BFA, Omnis and Trema were not won this round, and the Evrae loss route stalled in the harness. SAVE (CHK-024): the release-20 and release-25 fixtures upgraded cleanly on live, and SaveData.ts has not changed since round 14 (git log d8837334..6ea8528f). DEDUCTIONS: the 404s violate CHK-017's zero-404 rule; the image 404s were served as text/html, and two computed art paths are unchecked (R15-DEL-01 for FFX-2, R15-DEL-02 for FF7). The hidden FF7 fight opens on 20 to 25 s of pure black with no loading card (R15-DEL-03, new feature). On the same build, the cold first-battle load was 12 to 40 s behind the loading card (R15-DEL-04, from the 6ea8528f live review). NOT MEASURED THIS ROUND, so UNVERIFIED and never a pass: first load under 5 s, 60 fps and frame-time spikes on named hardware, and first-ability stalls. Also UNVERIFIED: Firefox, Safari and Edge; a real phone (390x844 was emulated); a real controller (gamepad shim only). The score is provisional on those gaps and cannot reach acceptance until they are measured. It is down from round 14's 8.5 for the new 404 sources and the FF7 black load.

## Verdicts

- **deployment**: PASS. PASS: the live URL serves exactly main 6ea8528f / bundle DecUADzw / artifact 21bca0a4 (48 and 150 files byte-identical), and about 50 real-input runs recorded 0 pageerrors and 0 JS errors. The 18 resource 404s request files that the build itself does not contain (PR-0223, PR-0224): a content defect of the build, not of the deployment.
- **changedArea**: FAIL. FAIL: the changed systems did not all meet their targets: CHK-012, CHK-015, CHK-020 and CHK-023 fail in changed areas (scene runner and art presentation, global input, audio routing after pause), the target gate has 7 failing and 21 unverified tiles, and mandatory CHK-022 coverage for III, XII, XIII and VIII is UNVERIFIED. No regression against the previous live build is established.
- **milestone**: not assessed. not assessed (deep review).
- **ship**: SHIP. SHIP (this build is already live; the verdict records that it is better than release 27 and holds nothing).

Ship reasons:

- No critical defect exists in the reviewed scope: every reached path completes, retries and returns, and saves carry across releases.
- No issue at critical or major severity is a regression against the previous live build: every major is tagged regressionVsLive false or unknown, and unknown holds only a critical.
- The build is better than release 27 in the changed areas: Chapter XVI plays and wins on desktop and phone, advisor v3 fixes Bailey's Mega-Potion case, FFX targeting matches the approved s2 look, the Grand Summon staging and phone fixes hold, and three FFX-2 engine majors are closed.
- The FF7 black load (PR-0222) sits inside a brand-new hidden feature and cannot hold the build.
- The twelve open majors are disclosed and carried into the next batch.

## Target gate

Required 76, matched 48, failing 7, unverified 21, waiting 5. approved 244/244 and judge-locked 48/48 byte-identical in the live manifest; verify-approved 0 mismatched, 0 missing.

Failing:

- cast/Speaker portrait: Braska (Ch II pre-scene: empty portrait frame)
- cast/Speaker portrait: Nooj (Ch V pre-scene: empty portrait frame)
- cast/Speaker portrait: Rikku (FFX-2) (Ch IV pre-scene empty; portrait probe: rikku-x2.png still undecoded 7.7 s into the scene in Ch IV and Ch XVI)
- pause/Pause remade on the Until Dawn character screen (member close-up blank in 12 of 16 first-Esc captures, 6 of 6 tab-next, 2 of 2 phone; renders only in Ch XI, XIII, XV, XVI)
- pause/Pause faces (the close-up the framing applies to is not drawn)
- pause/Hero plate, chapter 4 (carried from round 04; file hash unchanged; D-257 still open)
- polish/Chapter select v2 (390x844: card strips and the Ch XVI plate painting absent; R14-VIS-02 carried)

Unverified:

- Swordplay Overdrive
- Shiva
- portrait Paine (Ch VI post-scene frame not verified)
- portrait Shuyin (no line on screen in a2-30-post-scene)
- portrait Yuna (FFX-2) (no line on screen in Ch IV 30-post-scene)
- portrait Young Auron
- portrait Fayth boy
- portrait Brother
- Yojimbo attack c45
- Yojimbo hurt c35
- Trema hurt c7
- Logos hurt c2
- Leblanc hurt c10
- Ormi hurt c7
- Syndicate goon hurt c4
- Hero plate ch1 (CHAPTER tab not captured)
- All hero plates (CHAPTER tab not captured)
- Targeting s1 (no party-wide target step captured)
- Spell and skill effects B (no element-spell frame identified)
- PR-0201 phone Ch XI (no phone capture; phoneFraming.ts changed in release 28, so round 14 is not reusable)
- Yojimbo hero plate (CHAPTER tab not captured)

Newly matched: fight/Targeting s2 (FFX TARGET plate, corner brackets, ring halo, lettered name tag, every enemy visible; D-249). Decision pictures: dec-ixion-look-b matched (1600 and 390); dec-ixion-chamber-c2 matched (hole, amber lamps, lit floor); dec-ixion-abyss-a1 unverified (30-post-scene is the results card, verified=false); dec-line-card-a matched (Ch XIV compact card top-left, clear of the party); dec-pause-dossier-c-ch2/ch9 unverified (CHAPTER tab not opened; member-tab close-up blank).

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | FAIL | no | Technical half PASS: qa --strict exits 0, every cue -15.97 to -16.20 LUFS and -1.06 to -2.86 dBTP, 0 clips, all seams ok, all 26 media decode, 0 candidate files ship (PR-0100 fixed), cue routing matches the cue map in 16/16 chapters. The check also requires the owner's sign-off on the shipped cues, and his latest ear verdict on this mix is negative (PR-0148). Routing defect PR-0226 is recorded under CHK-023. |
| CHK-002 | PASS | yes | Full-bleed pause plates with no bars at 1600x900, 2000x1012, 2560x1080 and 1280x960 this round; 390x844 and 2000x1012 full-window measurement reused from the focused review of this same sha. The blank close-up inside the plate is PR-0221 (CHK-012), not a layer defect. |
| CHK-003 | FAIL | yes | Advisor minimum 14.2 effective px with 0 clipped on desktop, 15 px on the phone; FAILS on the phone Grand Summon subtitle (FOC28-P02), the Ch VIII Orders disabled-reason text (PR-0236) and the PAUSE chip (PR-0238). No whole-HUD computed font sweep this round. |
| CHK-004 | FAIL | yes | Desktop cards name owned, enabled rows and their submenu (Holy Water in Items, Hastega in White Magic, Fire Gem in Items). On the phone the TIP names Fire Gem (IX) and Poison Fang (I), which sit below the 6-row window and are reachable only by an undiscoverable tap-then-Back ladder (PR-0218): the advice does not say how to reach the row. |
| CHK-005 | PASS | no | Three broken boards give sound advice: Zombie Kimahri before a scripted Full-Life (Holy Water with reason), KO'd Rikku before Photon Spray, and Bailey's Mega-Potion-in-flight case in Ch XI by real keys (no repeat). The full degenerate-board matrix was not run, so this PASS covers only these boards. |
| CHK-006 | PASS | yes | The target cursor clears on cancel in all 15 playable chapters (afterTargetCancel targets 0); the picker leaves no overlay (reused focused, same sha). The Ch VIII Orders dead-end overlay exit was never exercised (PR-0225) and is not covered by this PASS. |
| CHK-007 | PASS | yes | No section signs, file stems or ids in any captured advisor card, intent panel, results or briefing text; citations only in the strategy-guide rail. |
| CHK-008 | FAIL | yes | Persistent panels (guide, intent, advisor, line cards) sit clear of the painted actors in every captured chapter (visual auditor, focFirst overlaps 0). FAIL at polish level on transient ones: Auron's first-time coach bubble over Kimahri's and Yuna's heads (Ch I, 2000x1012), Rikku's gauge coach over Paine's sword (Ch XI), the enemy info panel over the turn list (PR-0233, PR-0237). Minor: the party HUD overlaps Yuna's legs in Ch III at 2000x1012. |
| CHK-009 | FAIL | yes | The turn list reads 'ortiorchis' at 2000x1012 with the Mortiorchis info panel open (PR-0233); in full at 1600x900. |
| CHK-010 | PASS | yes | Single target: TARGET plate with name, brackets, ground ring and hand (Ch I); all allies: brackets on all three, ALL ALLIES chip and plate (FFX-2 Ch XI); phone: a confirm button naming the target. FFX targeting now matches approved s2 (D-249). No party-wide FFX target step was captured (target tile s1 UNVERIFIED). |
| CHK-011 | PASS | yes | Every targetable enemy is on screen and bracketed: both Yu Pagodas plus BFA, Mortiorchis plus Seymour, the three Leblanc targets, Mortibody plus Natus, Omnis plus discs. Not covered: Ch XI on a phone. |
| CHK-012 | FAIL | yes | Empty speaker portraits, blank pause close-ups and letter chips on the live site (PR-0221), and the grey placeholder mannequin for Rikku's and Paine's Songstress (PR-0228). |
| CHK-013 | PASS | yes | Performed as required: 85 in-game target-vs-build composites read against the approved tiles; the findings are the issues above. |
| CHK-014 | PASS | no | Party and bosses face each other in every captured chapter, including Ch XVI Ixion and the Ch XIV aeon-versus-aeon staging; FF7 party on the left per D-262. |
| CHK-015 | FAIL | yes | Keyboard paths pass in both games (Esc, P, H, G, N, E, J, hold-skip, prep Esc, retry); touch rows and targets work. FAILS: the FFX-2 battle menu does not answer a gamepad (PR-0219, confirmed by code trace); a gamepad-only player gets no audio (PR-0220); in Ch XII on the phone Yuna's target tap is intercepted (PR-0232); FFX phone rows below the sixth need an undiscoverable ladder (PR-0218). The pad is an emulated shim, not a real controller. |
| CHK-016 | PASS | yes | Every capture asserts screen, menu and target state; 1060 index entries, 0 route-index mismatches; the 5 30-post-scene frames that fail their assertion are labelled UNVERIFIED and unused; the harness-invalid yunalesca-win is superseded by yunalesca-win-p. Harness decision defects (PR-0225) are separated from product failures and void outcomes rather than captures. |
| CHK-017 | PASS | yes | Exact artifact: verify-live PASS on the 48-file default sample (live review) and on every file changed since round 14 plus a 60-file sample (150 files), byte-identical, live manifest matches, artifactHash 21bca0a4. Audio slice: all 27 audio files byte-identical and correctly typed. |
| CHK-017 | FAIL | yes | Live smoke found 0 pageerrors but 18 resource 404s on 5 URLs: yuna-dark-knight hurt/ko (FFX-2 Trema defeat results, served as text/html; PR-0224) and three Cloud pause files (hidden FF7; PR-0223). The files are absent from the build itself, so this is build content, not deployment identity. |
| CHK-017 | UNVERIFIED | yes | First load under 5 s, 60 fps at 1600x900, frame-time spikes and first-ability stalls on named hardware, browser, network and cache were not measured this round; the only first-battle timing (12 to 40 s behind the loading card, PR-0240) is not a controlled measurement. |
| CHK-018 | FAIL | no | Two runtime-built art paths reach live without the manifest check: wedgeFallenArt (src/ui/common/victoryLine.ts:99-104) and PortraitStage (src/app/screens/pause/PortraitStage.ts:337-338). src/ui/common/portrait.ts already guards the class with knownAbsent(). |
| CHK-019 | PASS | no | Manifest 913 files, decodeChecked=true, problems=[], audioUnverified=0; 150 files byte-identical live; every audio request answered (22 cues); ffmpeg decodes all audio with 0 errors. |
| CHK-020 | FAIL | yes | Paired surfaces exist in both games (advisor, intent, rail, pause tabs, results, coach, battle-start card, seams) with written game-specific exceptions (interface and feel auditors: PASS). FAIL on the player-facing result: the pause member close-up rendered in 4 of 6 FFX-2 and 0 of 10 FFX first-Esc captures. Suspected cause is art latency (PR-0221), not a game split. FFX-2 phone reachability of long lists is untested. |
| CHK-021 | PASS | yes | Each changed subsystem carries a written case and lands only there: aeon arm, Grand Summon/Mix pickers and backOutOfMinigame FFX only; IC-1, the Leblanc script, Sleep at Fast, petrify defeat, Ixion and the action time FFX-2 only; advisor v3 in-flight projection FFX-2 only (advisor-v3.ts:76). FFX chapters request only FFX cues, FFX-2 only FFX-2 cues; FF7 requests no audio. Writing registers per game hold. |
| CHK-022 | UNVERIFIED | yes | Real-key win with results, aftermath, board and reload: I (drawn seed 1925036082), II, IV, V (1001), VI, VIII, IX, X, XI, XIV, XV (1001), XVI (three wins, one by touch). Defeat, results and RETRY into battle: 23 of 23, every playable chapter except VIII. UNVERIFIED: III (0/6) and XII (0/7), harness-invalid for outcome (PR-0225, lettered-target mis-steer; the engine's advisor line wins the same seeds 9/9 and 5/7); XIII (0/5 with valid targets; matches the bench, PR-0227); VIII loss and RETRY (harness stalled in Orders). VII is NOT APPLICABLE (tile 'coming'). No product lock on any reached path. |
| CHK-023 | PASS | yes | Real presentation path proven for: 18 of 19 single-link live FFX logs replay event for event through the pure engine (I, II, III, VIII, IX, X, XII); the Grand Summon picker request with all five aeons then summons (Ch II); Leblanc's Guard then Fan Slap on turn 5 (Ch VI, D-242 switch); Ixion's Thundara 13/57 and Recharge then Thor's Hammer (Ch XVI); advisor v3 never repeats an in-flight Mega-Potion (Ch XI, Bailey's case, real keys); 263 audio samples match the cue map in chapters I to XVI. |
| CHK-023 | FAIL | yes | Audio routing after a pause: in 3 of 52 fight ends (Ch I, IV, XII) the pause cue replaced the battle theme and stayed to the end of the fight (PR-0226); round 14 had 0 in about 50. |
| CHK-023 | UNVERIFIED | yes | Chapter XVI's four whistles and Chapter V's coda Yes/No were hold-skipped by the harness: whether each whistle answers with its light and sound, and where each coda answer leads, is unproven. |
| CHK-024 | PASS | no | Saves written by live releases 20 and 25 boot on release 28 with clears, best times and settings (volumes, text speed, ATB Active/Fast, guide) intact and survive a reload, 0 console errors; this build's clears survive reload in 12 routes. SaveData.ts unchanged since round 14. Invalid storage and two tabs are unit-test only. |
| CHK-025 | UNVERIFIED | no | Hidden and isolated: 16 board tiles, none FF7 and no FF7 text; L-I-M-I moves nothing; L-I-M-I-T opens the fight; the main save stays byte-identical, only pyrefly-reprise:experiments:v1 is written. Not proven: leaving the fight by real input (the harness never found the leave row) and a completed win or loss. |
| CHK-B1 | UNVERIFIED | yes | No agent can hear. OWNER-VERDICT.md has no numeric score for the shipped mix (unchanged since release 21); Bailey's latest ear verdict on it is negative and has no number; D-235 approves Direction B for a 12-second clip only. |
| CHK-B2 | UNVERIFIED | no | No latency probe, no video clip and no feel verdict from Bailey since releases 22 to 28 changed camera, transitions and actors. |

Combat and engine audits (not library checks): R15-CMB-UNIT PASS; R15-CMB-TSC PASS; R15-CMB-DATA-IXION PASS; R15-CMB-DATA-AEON-ARM PASS; R15-CMB-DATA-SWITCHES PASS; R15-CMB-IC1 PASS; R15-CMB-IC2-ACTA PASS; R15-CMB-IXION-AI PASS; R15-CMB-LEBLANC-LIVE PASS; R15-CHK-023-FFX-REPLAY PASS; R15-CHK-023-GRAND-SUMMON PASS; R15-CHK-021 PASS; R15-ENC-BENCH-FFX PASS; R15-ENC-BENCH-FFX2 PASS; R15-ENC-ADVISOR-V3-MEGAPOTION PASS; R15-ENC-III-XII-LOSS-CAUSE PASS; R15-CHK-022-III UNVERIFIED; R15-CHK-022-XII UNVERIFIED; R15-CHK-022-XIII UNVERIFIED; R15-CHK-022-VIII-LOSE UNVERIFIED; R15-CHK-022-OTHERS PASS; R15-CMB-FF7 NOT APPLICABLE; R15-NOTE-RELAYED-REQUEST NOT APPLICABLE; TARGET-GATE FAIL; APPROVED-HASHES PASS.

## Encounters

| Encounter | Real flow complete | Outcome | Note |
|---|---|---|---|
| seymour-flux | yes | victory (drawn seed 1925036082, 2000x1012); defeats on seeds 1 and 1001 at 1600x900, pad and 390x844 | Chapter I (FFX). Full route title > board > prep (Esc back) > pre-scene (Esc pause, hold-skip) > fight > results > aftermath > board > reload, by real keys: seymour-flux-win-drawn/. Losses with RETRY back to prep: seymour-flux-win/, seymour-flux-lose-rm/ (reduce motion), seymour-flux-win-r2-pad/ (gamepad shim; same log as keyboard), seymour-flux-win-touch/ (phone; Poison Fang unreachable by touch, see R15-CAP-01). Advisor card still recommends Poison Fang for Tidus (Bailey's 2026-09-18 complaint). |
| yunalesca | yes | victory seed 1 (2000x1012), 142 real commands | Chapter II (FFX). yunalesca-win-p/ (round-15 patched harness). The first run yunalesca-win/ (2 defeats) is HARNESS-INVALID for outcome: the promoted harness cancelled the Grand Summon picker 14/14 times and fell back to Attack (R15-CAP-07); annotated as superseded in index.json. |
| braskas-final-aeon | no | defeat 6/6 attempts (seeds 1, 1001, three drawn) at 1600x900 and 2000x1012 | Outcome harness-invalid: the capture harness confirmed the wrong lettered enemy (PR-0225, established by the combat auditor from the target ids); the engine's advisor line wins the same seeds (III 9/9, XII 5/7). Real-key win UNVERIFIED this round, not a product failure. |
| seymour-anima-macalania | no | NOT APPLICABLE: board tile is 'coming' (not selectable) | Chapter VII (FFX). boardAtEntry.coming=['seymour-anima-macalania']; the board has 16 tiles, 15 playable ('0 OF 15 BEATEN'). |
| evrae-airship | yes | victory seed 1 (1600x900); lose route undecided | Lose route stalled in the harness (PR-0225); loss and RETRY UNVERIFIED. |
| yojimbo-cavern | yes | victory seed 1 (2000x1012, 17 commands); lose+RETRY 1600x900; phone 390x844 lost 2/2 | Chapter IX (FFX). Phone loss is caused by R15-CAP-01 (Fire Gem below the phone grid's 6-row window, unreachable by touch). |
| seymour-natus | yes | victory seed 1 at 2560x1080 | Chapter X (FFX), wide shape. |
| seymour-omnis | no | defeat 7/7 attempts (1280x960 seeds 1/1001, 390x844 seeds 1/1001, 1600x900 three drawn) | Outcome harness-invalid: the capture harness confirmed the wrong lettered enemy (PR-0225, established by the combat auditor from the target ids); the engine's advisor line wins the same seeds (III 9/9, XII 5/7). Real-key win UNVERIFIED this round, not a product failure. |
| isaaru-via-purifico | yes | victory seed 1 (1600x900) | Chapter XIV (FFX). |
| ffx2-bahamut | yes | victory seed 1 (2000x1012); lose+RETRY with reduce motion; gamepad lost 2/2 | Chapter IV (FFX-2). Gamepad run: 0 party actions in two attempts (R15-CAP-02). |
| ffx2-vegnagun-shuyin | yes | victory seed 1001 after a seed-1 defeat (2000x1012), 4 chain seams | Chapter V (FFX-2). Retry after defeat returned to prep and the second attempt won. |
| ffx2-leblanc | yes | victory seed 1 (2000x1012); lose+RETRY 1600x900 | Chapter VI (FFX-2). Leblanc's first own action after Not-So-Mighty Guard is Fan Slap (switch ON observed in the log). |
| ffx2-fallen-aeons | yes | victory seed 1 (1600x900), 2 seams | Chapter XI (FFX-2). Round 14 had no win (budget). Advisor v3 Mega-Potion case also played here (extras-advisor-v3-megapotion/). |
| ffx2-trema | no | defeat 5/5 win attempts (seeds 1, 1001, three drawn); lose+RETRY works (checkpoint retry lands in battle) | Matches the bench (1-3/40 at human pace) and Bailey's knowing choice D-151; information for Bailey as PR-0227. |
| ffx2-den-of-woe | yes | victory seed 1001 after a seed-1 defeat (1600x900); lose+RETRY | Chapter XV (FFX-2). |
| ffx2-ixion-djose | yes | victory seed 1 (1600x900), drawn seed (2000x1012) and seed 1 on 390x844 touch; lose+RETRY 2000x1012 | Chapter XVI (FFX-2, new since round 14). Phone: Ixion stands on the lit floor. Cold-load pre-scene shows black backdrop and empty portrait (R15-CAP-03). |
| ff7-guard-scorpion (hidden) | no | door opens by L-I-M-I-T; fight reaches command menus; not played to an outcome | FF7 only. Board lists 16 tiles, none FF7, no FF7 text; L-I-M-I moves no cursor; T opens the fight in ~1 s; main save byte-identical before/during/after, only pyrefly-reprise:experiments:v1 written. ~21-24 s black screen before the fight appears on a cold cache (R15-CAP-05). |

## Coverage matrix

**Tested**

- Exact artifact: verify-live PASS on 48 files (live review) and 150 files (every file changed since round 14 plus 60 sampled), artifactHash 21bca0a4; 27 audio files byte-identical.
- Real-key routes on the LIVE site from the title (headless Chromium, PYREFLY_BROWSER=gpu, one browser at a time; 1060 index entries at 1600x900, 2000x1012, 390x844, 1280x960, 2560x1080): wins in I, II, IV, V, VI, VIII, IX, X, XI, XIV, XV, XVI; defeat, results and RETRY in 23 of 23; reduce motion (I, IV); gamepad shim (I, IV); touch 390x844 (I, IX, XII, XVI).
- Engine: full vitest 610 files / 9,617 tests, tsc clean; data audits for Ixion, the arm-a aeon rows and the D-242 switches; seeded three-line benches for all 15 listed chapters (40 small + 40 large seeds FFX, 40 seeds FFX-2 at human pace); live FFX logs replayed through the engine.
- Advisor v3: Bailey's Mega-Potion case by real keys on live Ch XI.
- Battle entry transitions: 38 timed transition sequences in both games; 167 GPU timed sequences overall.
- Phone framing: Ch XVI Ixion on the lit floor, phone results, phone prep, the Grand Summon list (reused focused, same sha).
- FF7 door: hidden on a 16-card board, opens by L-I-M-I-T, main save byte-identical (GPU and SwiftShader).
- Save carried across releases: release 20 and 25 fixtures boot on release 28 with clears, best times and settings.
- Targets: 85 composites against approved tiles; approved 244/244 and judge-locked 48/48 hashes.
- Audio: 263 AudioManager samples in 37 runs; loudness, peaks, seams and decode of every shipped cue.
- Confirmation pass re-ran six of the top findings on live (phone ladder, portrait cold load in I and IV, XII seed 1, FF7 load) and traced the FFX-2 pad path in code.

**Reused (with reason)**

- CHK-002 full-window pause at 390x844 and 2000x1012; CHK-004/CHK-006/CHK-010 for the Grand Summon picker; FOC28-P02: from critic/reviews/6ea8528f-focused.json. Why: Same main sha and artifact, verified byte-identical live; no pause, picker or layout code changed.
- Cold-cache first-battle loading-card observation for Ch XVI (12 to 40 s): from critic/reviews/6ea8528f-live.json. Why: Same build and artifact; loading plumbing unchanged; used only as an observation, not a measurement.
- Chapter III phase cues (boss-yu-yevon links 3-7), victory-ffx and ending-ffx routing: from critic/rounds/round-14/evidence (braskas-final-aeon-win-drawn, -win-seed1). Why: Shipped audio byte-identical since round 14; src/audio and Chapter III musicCues unchanged.
- Chapter IV hero plate FAILING target verdict: from rounds 04 and 14. Why: Shipped plate file hash unchanged, approved tile unchanged, D-257 still open.
- Round-14 bench harnesses (code only, re-run on this build): from critic/rounds/round-14/combat-deep/r14d-final/. Why: No round-14 result reused as evidence.
- FFX-2 gamepad corroboration: from critic/rounds/round-14/evidence/padprobe-ffx2-bahamut/run.json. Why: src/ui/ffx2/CommandMenu.ts input path unchanged; corroboration only, the round-15 pad run is the evidence.

**Not tested**

- Controlled load and frame-time measurement on named hardware, browser, network and cache (CHK-017 performance half).
- Real controller, real phone, Firefox, Edge and Safari (never available on this evidence path).
- 1440p and 4K rotation shapes; Ch XI on a phone (PR-0201 target tile).
- Pause CHAPTER tab (hero plates, pause dossier C), spell and skill effects B, a party-wide FFX target step, boss and goon hurt poses, Shiva, Swordplay, the Ixion Abyss A1 plate.
- Input-latency probe, PR-0061 scene-skip to first usable menu, the Chapter V FAST pace, Chapter XII sending motion, Chapter IX Zanmato.
- A resource-timing HAR that decides whether PR-0221 is host network or product.
- Full degenerate-board matrix for CHK-005; a whole-HUD computed font sweep for CHK-003; the CONTROLS tab content.
- The gap-closing capture pass: the gap agent did not run it (it answered the relayed chat question instead); every item stays UNVERIFIED.
- Round-13 open issues not re-assessed this round (status unknown, NOT claimed fixed): PR-0198 (major): PR-0198 (new; R13-UI-01 = R13-CAP-02 = R13-C03): the FFX advisor recommends HP-restoring items on a living Zom; PR-0061 (major): PR-0061 (carried, STALLED, fifth review at major): 6.4 to 14.4 s from the scene skip to the first usable comma; PR-0201 (major): PR-0201 (new; R13-VIS-01, absorbs the capture owner's phone-edge note): at 390x844 Chapter XI frames Yuna and ; PR-0181 (major): PR-0181 (carried, widened to Ch X and Ch XIV): an FFX summon leaves the party on the field, and in Ch X Bahamu; PR-0153 (major): PR-0153 (carried, STALLED third review): the FFX intent names one damage target for a random-target move and m; PR-0207 (major): PR-0207 (new; R13-UI-03): the phone enemy-intent strip hides the SCRIPTED / MOST LIKELY badge and the odds, so; PR-0206 (major): PR-0206 (new; R13-UI-02): at Chapter I 2000x1012 the advisor card is absent at the first decision while its ch; PR-0123 (major): PR-0123 (carried): the FFX-2 intent headline pairs the rolled move with the top branch's odds, and the guide c; FOC-06 (major): FOC-06 (carried, STALLED): advisor chips render at 12.2 effective px in both games at 1600x900 and 2000x1012; PR-0126 (major): PR-0126 (carried, narrowed): advisor directions still drop the 'in <menu>' chip on some desktop cards and on e; FOC18-01 (major): FOC18-01 (carried from the focused review, disclosed): with option A's 3 s action time, Shiva and Anima no lon; PR-0035 (major): PR-0035 (carried): the FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile; PR-0095 (major): PR-0095 (carried): Vegnagun's Bulwark and Redoubt rings and plates are still not visible at links 3 and 4; PR-0094 (major): PR-0094 (carried): at Ch V link 4 the Redoubt intent card sits on Vegnagun's head painting; PR-0157 (major): PR-0157 (carried, widened to Ch XII): in FFX action shots, HUD cards sit over the party and the boss; PR-0021 (major): PR-0021 (carried, STALLED): still no banter bank; Chapter I still ends on '...Okay. Next one.'; PR-0127 (major): PR-0127 (carried, desktop half): Chapter VI prep polaroid captions are still clipped by the card edge, now see; PR-0144 (major): Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos ; PR-0018 (major): The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carri; PR-0057 (major): At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hidi; PR-0063 (major): The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters; PR-0014 (major): HUD portrait chips crop through heads; the monogram half is repaired; PR-0128 (major): Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and th; PR-0060 (major): The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce; PR-0215 (polish): PR-0215 (new; R13G-04): an FFX engine stalemate ('The battle cannot be won from here.') ends the chapter strai; PR-0109 (polish): PR-0109 (carried, STALLED 5th review, widened; absorbs FOC18-05): the chapter board always opens on Chapter I,; PR-0138 (polish): PR-0138 (carried, now confirmed live and widened to the newly listed Chapter XI): a chained FFX-2 chapter's re; PR-0216 (polish): PR-0216 (new; R13G-07): one of four fresh sessions had no title or chapter-select music at all (ready=true, pl; PR-0205 (polish): PR-0205 (new; R13-FN-02): the Chapter XI Sisters seam captions the link 'Sandy' alone; PR-0211 (polish): PR-0211 (new; R13-VIS-02): mid-battle line cards are drawn across the party (Jecht in Chapter III, Shinra in C; PR-0212 (polish): PR-0212 (new; R13-VIS-03): Valefor's painting is cut by its canvas edge, so a hard straight edge shows on its ; PR-0133 (polish): PR-0133 (carried, more of it repaired): XII and XIV now stage the boss in their aftermath; V and XI still stag; PR-0112 (polish): PR-0112 (carried, widened): the phone pause OPTIONS cuts labels, and the FFX-2 X-2 BATTLE, ATB SPEED, STRATEGY; PR-0170 (polish): PR-0170 (carried, widened): in single-enemy fights Attack fires at once, with no target step and no back-out; PR-0115 (polish): PR-0115 (carried): P opens the pause but does not close it, and P over a pre-battle scene does nothing; PR-0182 (polish): PR-0182 (carried): Kimahri's OVERDRIVE row still ignores the first Enter; PR-0033 (polish): PR-0033 (carried): the Defeat card never says why the party fell; PR-0073 (polish): PR-0073 (carried, narrowed): the phone briefing and phone pre-scene hints still name only keys; PR-0174 (polish): PR-0174 (carried, re-observed on Chapter X): Rikku's preset S.LV 53 stands far above the rest of the party (18; PR-0183 (polish): PR-0183 (carried, seen in Ch III): the FFX target name plate is drawn among the party's heads; PR-0186 (polish): PR-0186 (carried): the Ch III Sensor/info card covers the lower part of Yu Pagoda B and BFA; PR-0176 (polish): PR-0176 and FOC18-02 (carried): aeon turn-order tiles are letter chips (B, V), and Mortibody's chip shows an M; PR-0135 (polish): PR-0135 (carried): at 2000x1012 the FFX-2 field and help band stop short of the right edge; PR-0034 (polish): PR-0034 (carried): the Ch I battle grade drops the approved Gagazet moon and lit snow; PR-0066 (polish): PR-0066 (carried, narrowed and downgraded from major; absorbs FOC18-03): on the 390x844 chapter select v2, fiv; FOC18-04 (polish): Chapter select: selecting a card nudges the cards below it by 2 px (no reordering); PR-0191 (polish): PR-0191 (ZG-1): during Zanmato the gauge panel already reads 0% and 'Next: Daigoro', and the full-gauge banner; PR-0121 (polish): At 3840x2160 the pause plate stops at 3380x1931 and leaves black bands; PR-0184 (polish): R12-VIS-02 (new): the Chapter IX night-sakura arrival shows a straight side cut on the tree and hangs the cano; PR-0185 (polish): R12-VIS-03 (new): Chapter IX enemy-action and arrival shots slice the party's heads at the bottom edge; PR-0188 (polish): R12-UI-02 (new, Ch IX): the intent card describes Yojimbo's Daigoro order as 'non-elemental damage to itself -; PR-0189 (polish): R12-UI-03 (new): labels shown truncated: FFX-2 'CHA… CURSED', the pause CHAPTER tab's 'DRESSPHE…', and the adv; PR-0190 (polish): R12-UI-04 (new, PLAUSIBLE): during an FFX turn cut-in the arrows already move the lifted command cascade, but ; PR-0192 (polish): ADV-X2-1: in FFX-2 the advisor's revive reason says 'Only Yuna can call an aeon' (an FFX concept in FFX-2); PR-0193 (polish): TGT-LBL: the multi-target field label is a fixed 13 px and sits partly under the intent card at 2560x1440 (FFX; PR-0194 (polish): PR-0194: Chapter V: Jecht's Farplane line repeats six times in about four minutes on link 2; PR-0187 (polish): R12-FN-02: the Chapter III results card fires '...Okay. Next one.' between Yu Yevon's death and the FFX ending; PR-0171 (polish): PR-0171 (carried, widened): the pause CHAPTER tab's text column crosses the hero plate's face in battle as wel; PR-0168 (polish): PR-0168 (carried, widened to Chapter IX): the pause SCENE row prints the internal scene key; PR-0019 (polish): The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers th; PR-0010 (polish): The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest; PR-0146 (polish): PR-0146 (carried): the enemy-intent panel shows over the title-card crossfade; PR-0120 (polish): PR-0120 (carried, widened to FFX-2): the results painting stops short of the right edge at 2000x1012; PR-0137 (polish): PR-0137 (carried): Bahamut's painting still shows white matte holes in the wings (not an approved file); PR-0177 (polish): Ch8 FAR range: Evrae shrinks to a thin streak, further than approved option A; R15-02 (polish): R15-02 (carried from the release-15 focused review): the Chapter IX sakura backdrop request is aborted on ever; PR-0130 (polish): After E, the FFX advisor card folds but its 'N HIDE MOVES' chip stays alone mid-screen, and the chip still say; PR-0110 (polish): Residual: the 'N HIDE MOVES' chip text shows through the FFX-2 first-turn coach card; PR-0027 (polish): Literal asterisks in the Yunalesca intent counter: 'the target *she* last picked'; PR-0026 (polish): The chapter 1 guide still leads with 'Haste is ctb x 8/16'; PR-0074 (polish): The advisor's composed sentences are still broken or repetitive English; PR-0162 (polish): Chapter VIII strategy guide reads 'Cid pulls the Tidus's ship out of reach' (the actor substituted into a poss; PR-0163 (polish): Evrae's Pull back order is shown as 'Pull back → Tidus', naming the actor as its target; PR-0113 (polish): The phone chapter board runs the party names together ('YUNARIKKUPAINE'), and BEST slides under the hint bar; PR-0145 (polish): PR-0145 (carried, re-probed): all three girls petrified is not an immediate Game Over; the helpless party is b; PR-0106 (polish): The same 'After her [N] turn' wording is read two ways in Leblanc's script, and the failsafe reading is not la; PR-0107 (polish): Acts II and III open with every ATB gauge at zero, although they are separate battles; PR-0108 (polish): The Fast-speed Sleep rule from §1.5 is neither built nor recorded as left out; PR-0069 (polish): The possessed-aeon mirror does not mirror affinities, although the source comment says it does; PR-0054 (polish): The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference; PR-0053 (polish): A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach cons; PR-0124 (polish): PR-0124 (narrowed): the MP overflow is fixed on live; the dressphere a girl wears still reverts at a chain sea; PR-0007 (polish): PR-0007 (carried, recommend reclassify to information): Zombie then Full-Life leaves no counter-play window be; PR-0159 (polish): Chapter VIII dialogue has no contractions in any of its 47 lines, so Tidus, Rikku, Wakka and Cid all sound sti; PR-0160 (polish): Brother's Al Bhed line prints as plain English, then Rikku 'translates' what the player just read; PR-0102 (polish): PR-0102 (carried): '*better*' asterisks are still in Leblanc's aftermath line; PR-0134 (polish): PR-0134 (carried): the Chapter VI card's BOSS row reads 'Ormi + Dr. Goon + Fem-Goon'; PR-0147 (polish): PR-0147 (carried): all three Leblanc acts play in the one heart room, after the seam line '...Okay. Next room.; PR-0103 (polish): Two Act III KO beats assume Logos falls before Ormi: kill Ormi first and a KO'd Ormi shouts, and Paine calls f; PR-0037 (polish): Mid-battle beats hard-code speakers who are not in the active formation; PR-0158 (polish): Downgraded from critical: a racing debug harness (not a player) can tear an FFX battle down with 'Cannot read ; PR-0164 (polish): Yunalesca's approved painting edges show as hard straight lines in battle: the attack pose's hair is cut by it; PR-0117 (polish): Phone pause: the chapter eyebrow is printed over the GARMENT GRID row, and the grid name is cut ('PROTECTION .; PR-0169 (polish): The advisor badges a move 'GUIDE'S PICK' while the guide card beside it names a different move; PR-0114 (polish): The Seymour and Anima silhouette still draws through the 'Coming' badge; PR-0172 (polish): Defeat results: the vertical chapter title runs into the CHAPTER SELECT button; PR-0173 (polish): R11-PD-02: 239 unreferenced art variant files (126 MB) ship in every build; PR-0175 (polish): Ch5 link 5: a stray reticle labelled with raw ids 'vegnagun-leg' / 'vegnagun-head' at the top-left corner; PR-0178 (polish): Targeting s1: ally brackets cross the command menu; no TARGET plate; PR-0071 (polish): autoBattle('intended') loses Ch1 seed 1 and stalls on the Ch5 Tail link on the newest builds; PR-0166 (polish): Review evidence identity: the capture harness hard-codes 'bundle 81kxOXnv (main 76f587c3)', and the live site ; PR-0151 (polish): Pause OPTIONS labels are cut with ellipses at 1280x960 (MASTER VOL…, SOUND EFFE…, STRATEGY GU…); PR-0131 (polish): The chapter 1 advisor chains Phoenix Downs into immediate re-KOs: Yuna revived 7 times, KO'd again before acti; PR-0136 (polish): At party scale the Syndicate and goons queue in one diagonal file right behind the party; PR-0139 (polish): The intent panel keeps naming a KO'd enemy for up to 4.5 s ("ORMI ACTS NEXT Concussive Blast" after Ormi falls; PR-0140 (polish): Commit 0bd85cc states no game case (CHK-021); PR-0141 (polish): critic-plan --json omits chapter 6 from the chapters this review owes; PR-0081 (polish): Chapter 5 is 250 actions and 6:21 at FAST; the 5.15 s per action of round 08 does not reproduce (1.52 s per ac; PR-0119 (polish): The chain coach mark covers the act-one-cleared dialogue card for about 2 s; PR-0083 (polish): Four source files were pushed further past the 400-line house limit by this batch; PR-0036 (polish): The FFX-2 party crowds the left third of the stage while two thirds of it is empty; PR-0028 (polish): H does not hide the panels it is labelled for during battle; PR-0029 (polish): Yu Pagoda A and B carry no always-on field marker; PR-0062 (polish): The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk ; PR-0210 (suggestion): PR-0210 (new; R13-C04, information for Bailey): D-171 (an enemy hit closes the open menu, built in this range); FOC18-06 (suggestion): Question for Bailey: Chapter XIV's trimmed pause-card copy is an agent's inference; PR-0196 (suggestion): PR-0196 (carried): the targets.json tile 'Yojimbo's look' points at a missing file; PR-0213 (suggestion): PR-0213 (new; R13-VIS-06, harness): two 'mid-fight' captures are pause frames and four 16b captures are pause ; PR-0167 (suggestion): Records question for Bailey: mark the v5 pause (2000x1012, party panel) and v6 phone pause tiles as superseded; PR-0149 (suggestion): A transient 5xx on a pose sidecar is not retried: the pose silently loses its scale, anchor and facing metadat; PR-0044 (suggestion): 16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them; PR-0072 (suggestion): Vegnagun has no ground contact and Paine stands inside its cannon barrel

**Required and not tested (keeps the deep obligation pending)**

- CHK-022 Chapter III real-key win with the FFX ending aftermath (runs harness-invalid, PR-0225)
- CHK-022 Chapter XII real-key win and aftermath (runs harness-invalid, PR-0225)
- CHK-022 Chapter XIII real-key win and aftermath (0 of 5)
- CHK-022 Chapter VIII loss and RETRY (harness stalled, PR-0225)
- CHK-017 first load and frame time on named conditions
- CHK-023 Chapter XVI whistles and Chapter V coda answers through the real presentation path
- CHK-B1 owner listening verdict on the shipped mix (audio category UNVERIFIED)

## Ranked issue list (critical, then major, then polish, then suggestions)

There is no critical issue.

### 1. PR-0148 [major, audio] PR-0148 (carried, owner-reported, STALLED): no numeric owner verdict on the shipped mix, and the latest ear verdict on it is negative

- **Game**: both
- **Chapter**: all
- **Where / state**: whole score as shipped (25 cues, unchanged since release 21)
- **Expected**: Bailey's numeric listening score for the mix that ships, recorded in docs/audio/OWNER-VERDICT.md (CHK-B1). He asked for a score of 9 or more for the milestone.
- **Observed**: The live mix is byte-identical to release 21. Bailey on 2026-09-27: 'the game muisic still sounds like snes music...' (no number). D-235 picks Direction B from a 12-second clip. The 25 Direction B re-renders sit in public/audio/candidates/direction-b-2026-09-27, unshipped and unheard as finished cues. D-253: the score question is still open.
- **Repro and seed**: Read docs/audio/OWNER-VERDICT.md and docs/target/decisions.json (D-168, D-235, D-253). Compare critic/artifacts/6ea8528f.json with d8837334.json: the audio hashes are identical.
- **Evidence**: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json; critic/rounds/round-15/audio/live-audio-hashes.tsv
- **Confidence**: high
- **Requirement**: RUBRIC section 6 audio (Bailey's listening assessment); CHK-B1
- **Smallest fix**: Send Bailey a standalone phone pack of the Direction B re-renders of the most-heard cues (title, chapter-select, battle-ffx, boss-seymour, boss-ffx2-aeon, victory fanfares) with one question: a score out of 10 for each, and whether each may ship. Ship only the cues he approves, then record his number for the shipped mix.
- **Acceptance check**: OWNER-VERDICT.md holds a dated, verbatim numeric score for the cues that are live. The live audio hashes match the approved renders.
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false
- **STALLED** (RUBRIC §8): a method check is owed before the next batch touches it.

### 2. PR-0221 [major, visual] PR-0221 (new; R15-VIS-01 = the capture owner's cold-first-play finding): approved art paints seconds late or not at all on the live site: empty speaker portraits, black or half-painted pre-scene backdrops, a blank pause close-up, letter chips on the battle-start card, missing phone board strips

- **Game**: both
- **Chapter**: I, II, III, IV, V, VI, VIII, IX, XII to XVI (pre-scene and pause); board at 390x844
- **Where / state**: pre-battle scene first line (05-pre-scene, 1.2 s after cutscene); pause first Esc (14-pause-Esc, 1.1 s) and tab-next; battle-start card chips; phone chapter select
- **Expected**: The approved portrait (tiles Braska, Nooj, Rikku FFX-2 and others), the chapter backdrop and the Until Dawn member close-up are on screen when the line or pause appears, as in round 14 (portraits shown in about 11 of 16 speaker lines; close-up in about 24 of 29 pause captures).
- **Observed**: The speaker portrait frame is empty in 8 of 9 speaker lines. It shows only in Ch I at 2000x1012 (drawn seed). Pre-scene backdrops are black or half-painted in Ch II, IV, VI, IX, XIII, XIV, XV and XVI. The pause member close-up is blank in 12 of 16 first-Esc captures (all 10 FFX captures) and in 6 of 6 tab-next captures. The portrait probe finds art/portraits/kimahri.png (Ch I) and rikku-x2.png (Ch IV, XVI) with img.complete=false and naturalWidth=0 for 7.7 to 7.9 s, with no 404 and no console error. The battle-start chips fall back to letters Y/K and R/P (carried PR-0176). The 390 board strips and the Ch XVI plate painting are missing (R14-VIS-02). The same files decode later: the Ch IX post-scene shows the chamber plate and Ginnem.
- **Repro and seed**: Live https://baileypillon.github.io/pyrefly-reprise/, fresh profile, PYREFLY_BROWSER=gpu, seed 1. Title > Enter > select the card by screenState.selectedId (for example ffx2-bahamut) > Enter > prep Enter > wait 1.2 s in the cutscene: the portrait slot is empty. Esc: the member close-up is blank. Or run critic/rounds/round-15/cap/extras.mjs in portrait mode for seymour-flux, ffx2-bahamut or ffx2-ixion-djose.
- **Evidence**: critic/rounds/round-15/visual/st-prescene-r15.jpg versus critic/rounds/round-14/visual/st-prescene-all.jpg; critic/rounds/round-15/visual/st-pause-r15.jpg versus critic/rounds/round-14/visual/st-pause-all.jpg; st-pausetab-r15.jpg; st-portrait-probe.jpg; evidence/extras-portrait-*/run.json; crop-bstart-chips.jpg; st-title.jpg (390 board)
- **Confidence**: high on what is rendered; low on cause
- **Requirement**: RUBRIC 2 (approved artwork: rendering and integration), CHK-012, the approved tiles for the speaker portraits and the Until Dawn pause
- **Smallest fix**: Suspected, not established: on-demand fetch of 1.3 to 1.4 MB PNG portraits and pause masters (plus a 2x webp) queued behind the board's roughly 40 chapter paintings. The smallest correction: preload the chosen chapter's speaker portraits, backdrop and party pause masters when its card is confirmed, ahead of the other board art, and hold the scene's first line (or fade the portrait in) until the image decodes. First, re-capture with resource timing to rule out host network.
- **Acceptance check**: On the live URL, fresh profile, gpu, at 1600x900 and 390x844 in one FFX and one FFX-2 chapter: every speaker portrait is decoded (naturalWidth>0) when its line appears. The backdrop is painted at the first line. The pause close-up is decoded within 1.1 s of Esc and on tab-next. A HAR with timings is attached.
- **Confirmation**: Partly reproduced by the confirmer: Ch IV rikku-x2.png stayed undecoded from 1.2 s to 7.3 s on a cold profile while the same 1.43 MB file downloads alone in 0.59 s (supports the suspected preload queue); Ch I did not reproduce on the confirmer's cold run (portrait decoded by 1.9 s, three faces on the battle-start card). Timing-dependent; reliable at least in Ch IV. Evidence critic/rounds/round-15/evidence/confirm-portrait-ffx2-bahamut/run.json, confirm-portrait-seymour-flux/run.json.
- **Ship tags**: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Absorbs**: R15-VIS-01; capture owner "Cold first play: opening dialogue shows an empty portrait frame"; R14-VIS-02 (390x844 board card strips and the Ch XVI plate painting); the visual auditor's CHK-020 FAIL (close-up shown in 4 of 6 FFX-2 and 0 of 10 FFX first-Esc captures: same suspected cause, not a game split)
- **Related**: PR-0240 (cold first-battle load, same suspected queue); PR-0176 (letter chips, round 13)

### 3. PR-0226 [major, audio] PR-0226 (new; R15-AUD-01): after a pause, the pause cue can replace the battle theme for the rest of the fight

- **Game**: both (FFX Ch I and XII; FFX-2 Ch IV); the fix is shared plumbing
- **Chapter**: I seymour-flux, IV ffx2-bahamut, XII seymour-omnis
- **Where / state**: battle after an Esc/P pause and resume, and a battle entered after a pre-scene pause
- **Expected**: While the pause screen is open, 'pause' plays. On resume, the cue that was playing comes back (THEMES.md cue map row 3; pauseMusic.ts), and the chapter's battle cue (boss-seymour or boss-ffx2-aeon) plays until the fight ends.
- **Observed**: seymour-omnis-win attempt 1 (seed 1, 1280x960): music.current='pause' at gain 1 at the first battle menu with firstState.paused=false, and 'pause' is still the fading cue at the 490 s defeat. ffx2-bahamut-win (seed 1, 1600x900): boss-ffx2-aeon at the first menu; after the in-battle Esc/P pause probes, the fight ends at 399 s with 'pause' as the fading cue. seymour-flux-win attempt 1 (seed 1, 2000x1012): boss-seymour at the first menu, 'pause' at the fight end (221 s). That is 3 of 52 fight ends in 37 runs. Round 14 (d8837334) had 0 in about 50.
- **Repro and seed**: Live build, fresh profile, PYREFLY_BROWSER=gpu, window.__pyrefly.setSeed(1). Enter Chapter IV (or XII) by real keys. At the first battle menu press Esc, then press Esc again within about 150 ms, on the session's first battle pause while pause.mp3 is not yet decoded. Read the AudioManager debug surface 3 s later and again at the fight end. For Chapter XII, the harness's pre-scene Esc pause, resume and hold-skip reproduced it at the first menu.
- **Evidence**: critic/rounds/round-15/evidence/seymour-omnis-win/audio-debug.jsonl, ffx2-bahamut-win/audio-debug.jsonl, seymour-flux-win/audio-debug.jsonl; summary in critic/rounds/round-15/audio/routing-summary.json
- **Confidence**: high on the observed state (product AudioManager state, 3 runs); medium on the cause (suspected, traced in code, not instrumented)
- **Requirement**: CHK-023 (the right cue at each real moment, surviving the next frames); THEMES.md cue map (battle cue per chapter); RUBRIC section 6 audio: technical health and routing
- **Smallest fix**: Suspected cause: src/audio/AudioManager.ts:305 returns early when the requested cue is already current. It does this before incrementing musicRequestId (line 308), so an in-flight playMusic('pause') is not cancelled. That covers both the resume call playMusic(previous) (src/ui/common/pauseMusic.ts:76) and the battle chain's own cue request. When the pause buffer arrives, it replaces the battle cue. Later pauses then see current==='pause' (pauseMusic.ts:55) and remember nothing, so resume never restores. Smallest fix: in playMusic, when this.current?.name === name, run ++this.musicRequestId before returning, so any pending different cue is dropped.
- **Acceptance check**: (1) Unit test with a delayed loader: playMusic('boss-seymour') resolves; playMusic('pause') is left pending; playMusic('boss-seymour') returns early; the pending load then resolves, and currentMusic is still 'boss-seymour'. (2) Live, real keys, fresh profile, Chapters IV and XII: 10 fast pause/resume toggles on a cold first pause; music.current equals the battle cue at +3 s and at the fight end in 10 of 10. The pause screen still plays 'pause' while it is open.
- **Ship tags**: introducedByCandidate false, regressionVsLive "unknown", inNewFeature false
- **Related**: PR-0214 (round 13: the scoreless-scene resume case; did not recur this round, so this is a separate trigger in the same pauseMusic/AudioManager path)

### 4. PR-0228 [major, visual] PR-0228 (new; R15-FN-01): Rikku's and Paine's Songstress dressphere renders as a grey placeholder mannequin

- **Game**: FFX-2
- **Chapter**: XIII Trema (ffx2-trema), VI Leblanc (ffx2-leblanc); any chapter whose Garment Grid offers Songstress to Rikku or Paine
- **Where / state**: src/engine/BattlePresenterArt.ts:67 (art id `${girl}-${dressphere}`); public/art/characters has yuna-songstress only
- **Expected**: After the spherechange flash, the girl stands in her painted Songstress outfit (CHK-012: a fallback never ships as the final face).
- **Observed**: From 0.55 s after the flash until the next cut-in at 2.1 to 2.4 s, Paine (XIII attempt 1, VI) and Rikku (XIII attempt 2) are a flat grey translucent humanoid silhouette standing in the party line.
- **Repro and seed**: Live build 6ea8528f. Chapter XIII at 2000x1012, pinned seed 1 (attempt 1) and 1001 (attempt 2). Real keys: CHANGE, pick Songstress for Paine (attempt 1) or Rikku (attempt 2). Chapter VI at 2000x1012, seed 1, Paine to Songstress.
- **Evidence**: critic/rounds/round-15/evidence/ffx2-trema-win/seq-spherechange/f02-f08.jpg, a2-seq-spherechange/f02-f09.jpg, ffx2-leblanc-win-p/seq-spherechange/f02-f09.jpg; crops in critic/rounds/round-15/feel-narr/r15b-trema-paine-songstress-f06.jpg, r15b-trema-a2-spherechange-crop.jpg, r15b-ffx2-leblanc-win-p-spherechange-crop.jpg
- **Confidence**: high (3 sequences in 2 chapters; art files absent)
- **Requirement**: CHK-012; RUBRIC §6 visual (correct rendering, no placeholder delivery)
- **Smallest fix**: Smallest fix: until the art exists, take Songstress off Rikku's and Paine's grids in the chapters that offer it, or make the art resolver fall back to that girl's current approved dressphere painting rather than the procedural placeholder. The real fix is new rikku-songstress and paine-songstress paintings, which need Bailey's options round (hard rule 9).
- **Acceptance check**: A real-key spherechange to Songstress for Rikku and for Paine in XIII and VI shows a painted figure (not the placeholder) within 0.6 s of the flash, at 1600x900 and 2000x1012.
- **Tag notes**: introducedByCandidate: suspected false: the grids and the missing art predate this build (Songstress was already chosen in round 14's Chapter V run)
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 5. PR-0219 [major, interface] PR-0219 (new to the issue list; round 14 padprobe saw it): the FFX-2 battle command menu ignores a gamepad

- **Game**: FFX-2 only
- **Chapter**: IV Bahamut (all FFX-2 chapters)
- **Where / state**: battle, command menu
- **Expected**: Controller confirm/cancel/arrows drive the FFX-2 menu as they drive FFX's.
- **Observed**: With a standard-mapping pad (Playwright init-script shim, seen by the page) the FFX-2 menu never opened a submenu or submitted a command: 80 A presses, 0 party actions across two attempts, both lost. The same shim drives FFX chapters normally (Chapter I pad log identical to keyboard). Round 14's padprobe saw the same.
- **Repro and seed**: route.mjs ffx2-bahamut win --gamepad --seed=1 on the live site.
- **Evidence**: critic/rounds/round-15/evidence/ffx2-bahamut-win-pad/run.json (contexts.gamepad, picks with no engineDid), turn-log.json; critic/rounds/round-14/evidence/padprobe-ffx2-bahamut/run.json (reused as corroboration)
- **Confidence**: medium (emulated pad; code trace agrees)
- **Requirement**: CHK-015 (gamepad scope)
- **Smallest fix**: Feed src/ui/ffx2/CommandMenu.ts from the pad as FFX does (rawInput.ts / Input buttons); today it listens only to keydown (line 625, KEY_CONFIRM line 245) and clicks.
- **Acceptance check**: route.mjs ffx2-bahamut win --gamepad records party actions and wins seed 1; a real controller check by Bailey.
- **Confirmation**: Confirmed by code trace: src/ui/ffx2/CommandMenu.ts listens only to keydown (line 625) and clicks, with no RawInputWatcher; FFX's CommandMenu polls the pad through rawInput.ts. Not re-run live. Emulated pad only; a real controller is untested.
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 6. PR-0220 [major, audio] PR-0220 (new; R15-AUD-02): a gamepad-only player hears no music or effects until they touch the keyboard, mouse or screen

- **Game**: both (shared plumbing)
- **Chapter**: all; observed in I (seymour-flux-win-r2-pad) and IV (ffx2-bahamut-win-pad)
- **Where / state**: title, board, prep, pre-scene, battle, when driven only by a standard-mapping gamepad
- **Expected**: Audio starts on the player's first input, whatever the input device. Where a browser refuses to start audio from a pad press, the player is told how to turn sound on.
- **Observed**: Pad route, seed 1 (2000x1012 and 1600x900). AudioManager reports ready=false, sampleRate=null and music.current=null at the pre-scene (16.8 s and 19.0 s) and at the first battle menu (41.7 s and 43.1 s). title.mp3 and chapter-select.mp3 are never requested. Audio comes up only after the harness sends a keyboard-fallback key for a button the pad map lacks. Round 14's two pad runs show the same thing.
- **Repro and seed**: Fresh profile, no click and no key: drive title, board, prep and battle only with a standard gamepad (the harness shim: navigator.getGamepads init script, PAD_MAP Enter=0, Escape=1, D-pad 12 to 15). Read the AudioManager debug surface at the title and at the first battle menu.
- **Evidence**: critic/rounds/round-15/evidence/seymour-flux-win-r2-pad/audio-debug.jsonl and run.json media; critic/rounds/round-15/evidence/ffx2-bahamut-win-pad/audio-debug.jsonl; critic/rounds/round-14/evidence/*/ffx2-bahamut-win-pad and seymour-flux-win-pad (same); critic/rounds/round-15/cap/lib/route-evidence.mjs:25-45,130-143
- **Confidence**: high that the code never unlocks on a pad press (AudioManager.ts:274-287 listens only for pointerdown, keydown and touchstart, installed at src/main.ts:54; nothing in src/app/Input.ts calls unlock()); medium on the real-hardware experience, because the run used an emulated pad and no real controller has been tested
- **Requirement**: RUBRIC section 2 platform goals (keyboard, mouse, gamepad and touch); CHK-015 (behaviour proved with the player's own input); CHK-001 step 3 (nothing falls back or stays silent unintentionally)
- **Smallest fix**: Call audio.unlock() when Input's gamepad poll sees its first button press. If the AudioContext stays 'suspended' because the browser does not treat a pad press as a user gesture, show a small 'Sound off: press any key or click to turn it on' chip on the title screen that disappears on unlock.
- **Acceptance check**: Real controller (Xbox or DualSense) on Chrome and Firefox, fresh profile, pad only from page load: within 3 s of the first pad press either music.current='title', or the sound chip is visible and one click brings music.current='title'. The board then plays chapter-select.
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 7. PR-0232 [major, interface] PR-0232 (new; R15-IF-02): in Ch XII on a phone, a dimmed enemy's hit box intercepts taps meant for Yuna

- **Game**: FFX
- **Chapter**: XII Seymour Omnis, 390x844, ally target cursor (Curaga, Life or X-Potion on Yuna)
- **Expected**: Tapping a party member while an ally cursor is up selects that party member.
- **Observed**: 7 taps on Yuna's target failed. Twice Playwright reported the tap intercepted by 'div data-target-id=mortiphasm-2 class=ffx-target ffx-target--enemy ffx-target--dim ffx-target--clickable'; five taps timed out. A real finger would land on the enemy element and switch the heal to Mortiphasm-2.
- **Repro and seed**: 1. Live site, 390x844, hasTouch.
2. Seeds 1 and 1001.
3. Open Chapter XII.
4. On a healer's turn, choose White Magic > Curaga.
5. Tap Yuna.
- **Evidence**: critic/rounds/round-15/evidence/seymour-omnis-win-touch/run.json contexts.touch.blocked (no screenshot of the overlap)
- **Confidence**: medium
- **Requirement**: CHK-015, CHK-010; interface: reliable input
- **Smallest fix**: During ally targeting, give in-set targets pointer priority. For example, set pointer-events: none on dimmed off-side targets whose box overlaps an in-set target, or raise the party targets' z-index.
- **Acceptance check**: At 390x844 in Ch XII, elementFromPoint at Yuna's target centre returns Yuna's target. 10 of 10 taps confirm '-> YUNA'.
- **Ship tags**: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false

### 8. PR-0240 [major, delivery] PR-0240 (new; R15-DEL-04): cold first-battle load runs 12 to 40 s, far past the 5 s load goal; load and frame time are unmeasured on named conditions

- **Game**: both (shared loading plumbing)
- **Chapter**: every chapter's first battle on a cold cache (observed on ffx2-ixion-djose)
- **Where / state**: live 6ea8528f, board -> prep -> battle entry, cold cache
- **Expected**: A load under 5 s and 60 fps at 1600x900, measured on named hardware, browser, network and cache, with spikes and first-ability stalls reported (RUBRIC section 2).
- **Observed**: The 6ea8528f live review (same artifact) recorded ffx2-ixion-djose's loading card at about 12 s to about 40 s across repeated headless cold runs, sometimes beyond the documented 14 to 20 s window (src/ui/common/transitions/loadingCard.ts header). The network is not the bottleneck on this host (bundle 1.07 s, 5.7 MB backdrop 1.9 s by curl), so the suspected cause is client-side decode, processing or upload. The suspicion is untraced. No controlled load or frame-time trace exists this round.
- **Repro and seed**: Fresh profile, live URL, 1600x900, headless Chromium GPU on this host. Board -> XVI Ixion -> Enter -> Enter. Time the cover to the first battle frame from the console.info and performance.mark entries that loadingCard.ts writes.
- **Evidence**: critic/reviews/6ea8528f-live.json (loading-card observation, same artifact); src/ui/common/transitions/loadingCard.ts:5-17; critic/rounds/round-15/delivery/verify-live.txt
- **Confidence**: medium (headless runs on a host that was also running capture lanes; not a controlled benchmark)
- **Requirement**: RUBRIC section 2 platform goals; CHK-017 first load under 5 seconds
- **Smallest fix**: First measure: record the loadingCard performance marks cold and warm per chapter on named hardware and network. Then profile where the 12 to 40 s goes (image decode, texture upload, worker), before any change.
- **Acceptance check**: A timing table per chapter (cold and warm; named GPU, CPU, browser, network) with first battle ready under the agreed budget, plus a frame-time trace at 1600x900 with p95 frame time and spikes over 50 ms listed.
- **Tag notes**: regressionVsLive: unknown (no earlier controlled measurement to compare)
- **Ship tags**: introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Related**: PR-0221 (same suspected art queue)

### 9. PR-0179 [major, combat] PR-0179 (carried, narrowed; R15-C01): Chapters II, III and XII aeons ship stat rows below research §6.4.3 and below Chapter I's, so aeons get weaker later in the story (D-274 adopted, build in progress)

- **Game**: FFX only
- **Chapter**: II Yunalesca, III Braska's Final Aeon, XII Seymour Omnis (inherits III)
- **Where / state**: src/data/ffx/builds/zanarkand.ts, dreams-end.ts (garden-of-pain.ts inherits)
- **Expected**: Aeons never weaker later in the story. Bailey's D-274 (2026-09-28, adopted, delivery in-progress) moves II and III onto the sourced Gagazet rows.
- **Observed**: Live engine HP: Chapter II Valefor 1341, Bahamut 2542. Chapters III and XII Valefor 1465, Bahamut 2840. Chapter I (arm a since D-243) has Valefor 1530, Bahamut 2935. research/ffx-combat-core.md §6.4.3 ('ship these') gives Zanarkand Valefor 1674 / Bahamut 3218 and inside Sin 1886 / 3657.
- **Repro and seed**: getChapter('yunalesca').buildRef.aeons and getChapter('braskas-final-aeon').buildRef.aeons; or the live engineHp in yunalesca-win-p/run.json and braskas-final-aeon-win-p/run.json picks (seed 1).
- **Evidence**: D:/Final Fantasy/src/data/ffx/builds/zanarkand.ts:244-248; D:/Final Fantasy/src/data/ffx/builds/dreams-end.ts:409-413; D:/Final Fantasy/src/data/ffx/builds/garden-of-pain.ts:92; D:/Final Fantasy/critic/rounds/round-15/evidence/yunalesca-win-p/run.json
- **Confidence**: high
- **Requirement**: AGENTS.md rule 6; research/ffx-combat-core.md §6.4.3; D-274
- **Smallest fix**: Build D-274 as decided: in zanarkand.ts and dreams-end.ts, pass the aeon rows through GAGAZET_SOURCED_ROWS with gagazet-aeon-arms.ts's withRow pattern, the way highbridge.ts does. Chapter XII inherits through dreamsEndBuild. Record the case (FFX only).
- **Acceptance check**: For every FFX chapter from I onward, each aeon's maxHp is at least its Chapter I value (unit test over CHAPTERS). The BFA possessed-aeon mirror still follows the party rows. The II, III and XII three-line benches are re-run and reported beside this round's (II 72/80, III 76/80, XII 45/80 advisor).
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false
- **STALLED** (RUBRIC §8): a method check is owed before the next batch touches it.

### 10. PR-0099 [major, audio] PR-0099 (carried, STALLED; docs half fixed): 9 of 15 playable chapters still play at least one borrowed stand-in cue

- **Game**: both (FFX: IX scene, X, XII, XIV; FFX-2: VI, XI, XIII, XV, XVI field bed)
- **Chapter**: VI, IX, X, XI, XII, XIII, XIV, XV, XVI (VII also, but it is 'coming')
- **Where / state**: scene bed and/or battle cue
- **Expected**: D-209 (Bailey): every chapter gets its own composed cue after the audio direction pick; a stand-in does not count as finished.
- **Observed**: The live requests match THEMES.md's cue map exactly, including every stand-in. For example, scene-gagazet opens I, IX, X and XIV; boss-ffx2-aeon carries IV, VI, XI, XIII (phase 2) and XVI; boss-seymour carries I and XII; boss-yojimbo carries IX and XIV. The cue map rows exist and themes-audit passes, so only the owed cues remain.
- **Repro and seed**: Play any listed chapter on the live build and compare its audio requests with the cue map's Status column; or run node tools/audio/themes-audit.mjs.
- **Evidence**: critic/rounds/round-15/audio/themes-audit.txt; critic/rounds/round-15/audio/routing-summary.json; docs/audio/THEMES.md 'The chapter cue map'
- **Confidence**: high
- **Requirement**: D-209; RUBRIC section 6 audio (thematic coherence); THEMES.md chapter cue map
- **Smallest fix**: After Bailey's verdict on the Direction B pack (PR-0148), compose and audition the owed cues named in each row (for example boss-leblanc, boss-trema, the Natus and Omnis Noble Rot cues, Still Water, boss-den-of-woe, the Djose bed). Ship each one only after his ear approves it.
- **Acceptance check**: Every cue-map row reads 'own' (or 'choice' with Bailey's words). themes-audit shows 0 stand-ins. Each new cue has an OWNER-VERDICT.md entry.
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false
- **STALLED** (RUBRIC §8): a method check is owed before the next batch touches it.

### 11. PR-0032 [major, onboarding] PR-0032 (carried from round 13 as polish, raised to major by the onboarding auditor; R15-ONB-01): no in-game accessibility settings (text size, remapping, reduce motion, low effects or flash)

- **Game**: both
- **Chapter**: all; pause OPTIONS tab and title
- **Where / state**: src/app/screens/PauseScreenPanels.ts:44-51 omits the saved reduceMotion and lowEffects on purpose ('belong to a settings screen'), and no settings screen exists; src/app/SaveData.ts:66
- **Expected**: Usable settings for text and input access and for motion and flash accommodations (RUBRIC §6 onboarding).
- **Observed**: OPTIONS lists only volumes, text speed, strategy guide, battle help and, for FFX-2, X-2 BATTLE. Reduce motion follows only the OS preference, which does work. The player cannot change text size, remap keys or turn off flashes or effects.
- **Repro and seed**: Any chapter, Esc, then Q/E to OPTIONS. Also check the title screen: there is no settings entry.
- **Evidence**: critic/rounds/round-15/evidence/seymour-flux-win-drawn/run.json pause.optionsText; 14-pause-options.png
- **Confidence**: high
- **Requirement**: RUBRIC §6 onboarding (weight 5)
- **Smallest fix**: Smallest step: expose the existing Reduce motion and Low effects flags as rows in the approved OPTIONS tab. Text size and remapping follow. Present this to Bailey first (AGENTS.md rules 9 and 10), because it changes a screen he sees.
- **Acceptance check**: Both toggles appear in OPTIONS in both games. Toggling Reduce motion by keys makes the battle-entry card static, as it is under the OS preference. The setting survives a reload.
- **Severity note**: Raised from polish: the rubric weights usable settings and motion/flash accommodations, reduceMotion and lowEffects already exist in SaveData but no screen exposes them, and a player without the OS preference has no way to turn motion down. Presenting it needs Bailey (rules 9 and 10).
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 12. PR-0222 [major, delivery] PR-0222 (new; R15-DEL-03 = the capture owner's FF7 finding = the black half of R15-VIS-02): the hidden FF7 fight opens on about 20 to 27 s of pure black with no loading card on a cold cache, and Esc does nothing meanwhile

- **Game**: ff7 (hidden experiment only)
- **Chapter**: ff7-guard-scorpion (hidden, via the L-I-M-I-T door)
- **Where / state**: live 6ea8528f, board -> L-I-M-I-T -> battle, cold cache, 1600x900
- **Expected**: No cold black before a fight. The chapters' own entry puts the approved loading card over the cover after 400 ms (A-3, loadingCard.ts), and the platform goal is a load under 5 s.
- **Observed**: Frames at 0, 9 and 18 s after the door have mean luminance 0.0 (all black). The HUD first appears at about 24 s (GPU) or 28 s (SwiftShader), with hasEngine=false until then. Escape pressed at 6 s produced another all-black frame (04-ff7-esc.png). This is not network-bound: a cold curl of the 4.8 MB FF7 backdrop took 1.5 s on this host.
- **Repro and seed**: Fresh profile on the live URL at 1600x900, headless Chromium, PYREFLY_BROWSER=gpu (also swiftshader). Title -> board, then type l, i, m, i, t. Sample the canvas every 3 s (critic/rounds/round-15/cap/extras.mjs ff7()). Seed not applicable (load phase).
- **Evidence**: critic/rounds/round-15/evidence/extras-ff7-probe-gpu/f-00s.png..f-45s.png, extras-ff7-probe-swiftshader/, extras-ff7-door/03-ff7-fight.png, 04-ff7-esc.png, extras-ff7-gpu/run.json (ff7Samples)
- **Confidence**: high on the observation; cause traced
- **Requirement**: RUBRIC section 2 platform goals (load under 5 s); A-3 'no cold black before the first fight'; CHK-017 first load
- **Smallest fix**: Traced: experimentPlayIn (src/app/screens/BattleScreenExperiment.ts:103-107) calls playFf7Swirl with only onCover, while the chapters pass whileCovered: entryCardWait (BattleScreenFlow.ts:366). Smallest fix: give the FF7 swirl a cover wait that holds the frozen board frame (or an FF7-styled card, which needs Bailey's look first under hard rule 9) until the battle's art is ready. Preloading the FF7 art while the board is idle after the door would also help.
- **Acceptance check**: On a cold live load at 1600x900 (GPU and SwiftShader), no captured frame between the door and the first HUD frame is all-black for more than 400 ms, and Esc during the wait is either honoured or deliberately inert with a visible cover.
- **Confirmation**: Reproduced by the confirmer: hasEngine false until about 18 s, HUD at about 21.2 s, first command at about 24 s (critic/rounds/round-15/evidence/confirm-ff7/run.json). Esc during the wait not re-tested.
- **Tag notes**: introducedByCandidate: false (arrived with the FF7 fight in releases 23 and 27; release 28 did not touch it); inside a brand-new hidden feature, so it never holds a build
- **Ship tags**: introducedByCandidate false, regressionVsLive false, inNewFeature true
- **Absorbs**: R15-DEL-03; capture owner "Hidden FF7 fight: ~21-24 s of black screen"; R15-VIS-02 (black-load half)

### 13. PR-0218 [polish, interface] PR-0218 (new; R15-IF-01 = the capture owner's phone-grid finding, DOWNGRADED from major after the confirmer's re-run): on a phone, FFX command rows below the sixth are reachable only through an undiscoverable tap-then-Back ladder; the paging marks look like controls and are inert, and the phone TIP names such rows

- **Game**: FFX (FFX-2 not tested)
- **Chapter**: IX Yojimbo (Fire Gem), I Seymour Flux (Poison Fang); any FFX list longer than 6 rows
- **Where / state**: src/ui/ffx/CommandMenu.ts:694-695 (renderRows): the ▲/▼ markers are inert divs, the window follows only the selected index (computeMenuWindow), and there is no swipe or wheel handler
- **Expected**: Every row the menu offers, and in particular every row the advisor or TIP names, can be reached and used with touch alone (CHK-004, CHK-015).
- **Observed**: The Items window at 390x844 shows 6 rows. The up/down marks are decoration (src/ui/ffx/CommandMenu.ts:694-695 render them with no data-ui-action; ffx-hud.css:333 sets pointer-events:none on .ffx-cmd-more; phone-hud.css:280 still calls them taps). Swipe and wheel do nothing. The confirmer showed the rows ARE reachable by touch: each round of "tap the last visible row, then tap the target step's Back" moves the window two rows, and Fire Gem was on screen after 7 rounds. No player is told this, the phone TIP recommends Fire Gem (Ch IX) and Poison Fang (Ch I), and the scripted touch player fell back to Attack and lost Ch IX 2 of 2.
- **Repro and seed**: 1. Live site, 390x844, hasTouch.
2. setSeed(1).
3. Open Chapter IX from the board by selectedId.
4. On Kimahri's turn, tap ITEMS.
5. Tap ▼, then swipe up on the list, then use the wheel.
6. Fire Gem is never shown.
- **Evidence**: critic/rounds/round-15/evidence/extras-phonemenu-yojimbo-cavern/ (01 to 04 png, run.json); yojimbo-cavern-win-touch/run.json; seymour-flux-win-touch/run.json misses[turn 1]; critic/rounds/round-15/evidence/confirm-phoneladder/ (the tap+Back ladder reaching Fire Gem)
- **Confidence**: high
- **Requirement**: RUBRIC §6 interface: reliable input and legal, useful advice; CHK-004, CHK-015; platform goal: touch and phone
- **Smallest fix**: Make ▲/▼ tappable controls with hit areas of at least 44 px that move the selection and window by one page without confirming. Vertical swipe on the stack is optional.
- **Acceptance check**: At 390x844, by touch only, reach and use Fire Gem in Ch IX and Poison Fang in Ch I. A Playwright tap test asserts the visible rows change on each ▼ tap until the last row is shown.
- **Downgrade**: The confirmer refuted "cannot be reached by touch" (critic/rounds/round-15/evidence/confirm-phoneladder/run.json, 01-after-first-tap-back.png, 02-final.png): the original probe's arrow-key check ran with the target step open. What remains is discoverability, not an unusable control.
- **Absorbs**: R15-IF-01; capture owner "FFX phone battle grid: rows below the sixth in a command group cannot be reached by touch" (R15-CAP-01)

### 14. PR-0225 [polish, process] PR-0225 (new; critic tooling, not a product defect; R15-CAP-07 + R15-H01 + R15-FN-05): the capture harness cancels Overdrive pickers, stalls on an all-disabled Orders overlay, cannot steer to a lettered enemy, and its dialogue recorder merges repeats; this voided the Ch III and XII real-key outcomes and the Ch VIII loss route

- **Game**: both (critic tooling)
- **Chapter**: II, III, IV..., VIII
- **Where / state**: critic/runner/lib/route-fight.mjs
- **Expected**: The harness plays pickers like a player and backs out of an overlay with nothing to choose.
- **Observed**: (1) Pickers: the promoted critic/runner/lib/route-fight.mjs finds no rows when a row opens a picker, presses Escape and falls back to Attack: 14/14 Grand Summons thrown away in the first Ch II run (confirmed by the confirmer: yunalesca-win 18 misses vs yunalesca-win-p 1 miss and a win). (2) Orders: the lose route opened Orders with both rows disabled and never escaped (401 empty picks). (3) Lettered targets (combat auditor, established): slugOf('Yu Pagoda A') matches no data-target-id (yu-pagoda-left/right, mortiphasm-1..4), so confirmTarget pressed ArrowRight 8 times and confirmed whatever was highlighted: 43/39/43 Slows landed on the already-Slowed yu-pagoda-right and 13/14/10 'Attack -> Mortiphasm A/B' picks on mortiphasm-3. The live III and XII logs replay exactly through the engine, and the engine's own advisor line wins the same seeds 9/9 (III) and 5/7 (XII). (4) The dboxRecorder merges consecutive same-speaker lines sharing a 24-character prefix and keeps timing a hidden box, so repeats and on-screen durations cannot be measured.
- **Repro and seed**: node critic/runner/lib/route.mjs yunalesca win --seed=1
- **Evidence**: critic/rounds/round-15/evidence/yunalesca-win/run.json misses vs yunalesca-win-p/run.json pickerPlays; evrae-airship-lose-r2/27-no-choosable-row.png; patch in critic/rounds/round-15/cap/lib/route-fight.mjs
- **Confidence**: high
- **Requirement**: CHK-016 (evidence integrity)
- **Smallest fix**: Promote the round-15 patch (picker detection plus arrow/Enter on the named row) into critic/runner/lib/route-fight.mjs; press Escape after an all-disabled overlay and record it; in confirmTarget map a trailing letter through letterTagsOf and assert the highlighted data-target-id before Enter; record only .dbox.dbox--visible and start a new entry per show.
- **Acceptance check**: Yunalesca seed 1 records Grand Summon picks with an aeon summoned; the VIII lose route reaches Defeat and RETRY; a Ch III seed-1 route lands every 'Yu Pagoda A' pick on yu-pagoda-left; a seeded Ch V run lists each Farplane line once per show.
- **Confirmation**: Picker half confirmed. On XII the confirmer re-ran seed 1 (defeat at 67 turns, 0 picker misses) and read the advisor's target as honoured; it did not check the lettered-target mapping, which the combat auditor established from the target ids in battle-log.json. The chief critic treats the III and XII losses as harness-caused (so CHK-022 III/XII stays UNVERIFIED, not FAIL) and records the confirmer's reading as a dissent to be settled by a re-run with the fixed harness.
- **Downgrade**: No player impact; the damage is to evidence, which the report carries as UNVERIFIED mandatory coverage instead.
- **Absorbs**: R15-CAP-07 (capture owner harness finding); R15-H01; R15-FN-05; the capture owner's "Following the advisor by real keys loses Chapters III, XII and XIII every time" for III and XII (cause established as this harness defect)

### 15. PR-0224 [polish, delivery] PR-0224 (R15-DEL-01 = R15-VIS-03 = the capture owner's 404 finding): Trema defeat results request yuna-dark-knight hurt.png and ko.png (404 served as text/html) and show an empty wedge

- **Game**: ffx2 only (Trema; any FFX-2 loss whose leader wears a dressphere with no hurt/ko painting)
- **Chapter**: XIII Trema, defeat results
- **Where / state**: live 6ea8528f, Trema defeat -> results, 1600x900 and 2000x1012
- **Expected**: No 404s and no text/html images on live (CHK-017), and an FFX-2 Yuna figure in the wedge (FOC17-01 / FOC17b-01).
- **Observed**: Each defeat results screen requests art/characters/yuna-dark-knight/hurt.png and ko.png, and both return 404 text/html (2 console errors per loss, 12 in total this round). The onerror chain then removes the image, leaving the right-hand wedge blank.
- **Repro and seed**: Fresh profile, live, seed 1, 1600x900. Board -> XIII Trema -> lose -> results screen. Watch the network panel for 404s.
- **Evidence**: critic/rounds/round-15/evidence/console-and-404-summary.json; ffx2-trema-lose/31-results.png; critic/rounds/round-15/delivery/trema-lose-results-thumb.jpg; public/art/characters/yuna-dark-knight/ holds only attack and idle
- **Confidence**: high
- **Requirement**: CHK-017 (zero 404, zero text/html images); CHK-018 (no shipped path unchecked against the manifest); FOC17b-01 carried from critic/reviews/1a680e41-focused.md
- **Smallest fix**: Traced: wedgeFallenArt (src/ui/common/victoryLine.ts:99-104) builds the dressphere hurt and ko paths blind. Filter them through the art manifest's knownAbsent (as src/ui/common/portrait.ts:57 does), and fall back to FFX-2 art she has (dressphere idle, or the dimmed -x2 portrait) per FOC17b-01. FFX-2 only.
- **Acceptance check**: A Trema loss on live shows an FFX-2 Yuna in the wedge, with 0 404s and 0 console errors in the run.
- **Absorbs**: R15-DEL-01; R15-VIS-03 (carried from round 14); capture owner "404s for yuna-dark-knight hurt/ko poses"

### 16. PR-0223 [polish, delivery] PR-0223 (R15-DEL-02 = the pause half of R15-VIS-02): the hidden FF7 pause requests three missing Cloud files (404) and shows no close-up

- **Game**: ff7 (hidden experiment only)
- **Chapter**: ff7-guard-scorpion, pause
- **Where / state**: live 6ea8528f, FF7 fight -> Enter, Esc, P
- **Expected**: Zero 404s on live. The pause centres a character close-up (RUBRIC section 2), or the FF7 pause is deliberately portrait-free and requests nothing.
- **Observed**: art/pause/cloud.json, art/pause/cloud.png and art/portraits/cloud.png all return 404 (3 console errors per FF7 run, GPU and SwiftShader). The CLOUD pause tab shows stats with an empty portrait area.
- **Repro and seed**: Fresh profile, live, 1600x900. Board -> l,i,m,i,t -> wait for the HUD (about 25 s) -> Esc.
- **Evidence**: critic/rounds/round-15/evidence/extras-ff7-gpu/run.json (notFound); extras-ff7-swiftshader/run.json; extras-ff7-probe-gpu/z-after-keys.png; critic/rounds/round-15/delivery/z-after-keys-thumb.jpg
- **Confidence**: high
- **Requirement**: CHK-017; CHK-018
- **Smallest fix**: Traced: PortraitStage (src/app/screens/pause/PortraitStage.ts:337-338) builds art/pause/<id>.png, falling back to art/portraits/<id>.png, without a knownAbsent check. Guard both with the manifest, and point the FF7 plate at an existing FF7 painting (ff7-film-cloud/idle.png exists) only if Bailey approves that look. FF7 only.
- **Acceptance check**: Pausing the FF7 fight on live produces 0 404s, and the portrait area either shows an approved Cloud image or is deliberately empty without a request.
- **Absorbs**: R15-DEL-02; R15-VIS-02 (pause half)

### 17. PR-0229 [polish, feel] PR-0229 (new; R15-FN-02): the first spherechange into a dressphere shows the old outfit for up to 1.3 s after the change flash, then pops to the new one

- **Game**: FFX-2
- **Chapter**: XV Den of Woe (worst case); also XVI Ixion (about 0.25 s of the old outfit)
- **Expected**: The new outfit is on screen when the change flash clears (about 0.3 to 0.6 s), as it is the second time the same change happens.
- **Observed**: Chapter XV attempt 1, Yuna White Mage to Black Mage: flash from 0.05 to 0.30 s; old White Mage from 0.55 to 1.55 s; Black Mage pops in at 1.82 s with no effect. Attempt 2, the same change: Black Mage at 0.59 s. Chapter XVI, Rikku to Black Mage: old outfit at 0.56 s, new at 0.82 s.
- **Repro and seed**: Live 6ea8528f. Chapter XV at 1600x900, pinned seed 1, real keys: CHANGE, Yuna, Black Mage, on the first change of the session. Compare with attempt 2 (seed 1001).
- **Evidence**: critic/rounds/round-15/feel-narr/r15b-den-spherechange-crop.jpg vs r15b-den-a2-spherechange-crop.jpg (from evidence/ffx2-den-of-woe-win/seq-spherechange and a2-seq-spherechange); critic/rounds/round-15/feel-narr/ffx2-ixion-djose-win__seq-spherechange.jpg
- **Confidence**: medium (one clear first-use case, one mild case, the second use is clean). The cause is suspected: the dressphere painting is loaded lazily on first use.
- **Requirement**: RUBRIC §6 feel: action and reaction timing, smooth transitions
- **Smallest fix**: Warm the idle painting of every dressphere on each girl's Garment Grid at battle load (src/app/imageWarm.ts or the presenter's art preload). Alternatively, hold the flash until the new texture has decoded.
- **Acceptance check**: On a fresh profile, the first spherechange to each grid dressphere shows the new outfit no later than 0.1 s after the flash ends, in XV and XVI, as timed frame sequences at 1600x900 and 390x844.

### 18. PR-0230 [polish, narrative] PR-0230 (new; R15-FN-03): the Chapter V Farplane Glen coda is captioned as Vegnagun's chamber

- **Game**: FFX-2
- **Chapter**: V Vegnagun and Shuyin, the post-results coda
- **Expected**: writing-bible E5-CODA rule 5: the coda is the Farplane Glen and must not be staged in Vegnagun's chamber. Its location strip should name the glen.
- **Observed**: The flower-field glen painting is shown under the location strip 'CHAPTER V · HEART OF THE FARPLANE — VEGNAGUN'S CHAMBER'.
- **Repro and seed**: Live 6ea8528f. Win Chapter V (2000x1012, attempt 2 seed 1001), CONFIRM on the results, and the coda opens.
- **Evidence**: critic/rounds/round-15/evidence/ffx2-vegnagun-shuyin-win/33-after-confirm-scene.png
- **Confidence**: high
- **Requirement**: research/writing-bible.md E5-CODA writing rule 5; RUBRIC §6 narrative (faithful beats)
- **Smallest fix**: Give the coda scene its own location caption, for example 'THE FARPLANE — THE GLEN', using the place name the research doc gives. The Shuyin scene keeps its caption.
- **Acceptance check**: A still of the coda's first frame shows the glen caption, and the Shuyin aftermath still shows Vegnagun's chamber.

### 19. PR-0231 [polish, narrative] PR-0231 (new; R15-FN-04): Auron's Chapter III callout 'Spread out. One swing takes us all.' asks for positioning FFX's CTB battle does not have

- **Game**: FFX
- **Chapter**: III Braska's Final Aeon, phase-2 mid-battle callout
- **Where / state**: src/story/scripts/braskas-final-aeon.ts:233
- **Expected**: Auron's callouts are terse and actionable (writing-bible §1.4). The bible gives this line to Wakka as a self-defeating joke ('Spread out! Spread — aw, son of a—', §E3 mid-battle table).
- **Observed**: Auron says it straight, as an order, over the party-wide attack. The player has no way to spread out.
- **Repro and seed**: Live 6ea8528f. Chapter III at 1600x900, seed 1 (or any seed), real keys into phase 2. The line fires at about 790 s in braskas-final-aeon-win-p.
- **Evidence**: critic/rounds/round-15/feel-narr/dbox-all.txt (braskas-final-aeon-win-p 791676, -drawn 689385, -drawn2 746307)
- **Confidence**: high on the text; this is a tone and usability judgment
- **Requirement**: RUBRIC §6 narrative (character voice) and §2 (advice must be legal and useful)
- **Smallest fix**: Give the line back to Wakka as the bible writes it, or give Auron an actionable version such as 'It hits all of us. Keep everyone up.'
- **Acceptance check**: The phase-2 callout text no longer asks for positioning, and its speaker matches the bible or a recorded decision.

### 20. PR-0161 [polish, narrative] PR-0161 (carried, still observed): Chapter V's Farplane voices appear as present speakers with full portraits and FFX role plates ('Final Aeon', 'High Summoner')

- **Game**: FFX-2
- **Chapter**: V Vegnagun (all links)
- **Expected**: Disembodied Farplane voices (writing-bible E7). Jecht is no longer the Final Aeon in FFX-2.
- **Observed**: Jecht is shown with jecht.png and the role 'Final Aeon'; Braska with braska.png and 'High Summoner' (dboxTimeline).
- **Repro and seed**: Live 6ea8528f. Chapter V at 2000x1012, seed 1001, link 1 (the tail).
- **Evidence**: critic/rounds/round-15/feel-narr/dbox-all.txt (ffx2-vegnagun-shuyin-win 40783, 275876, 1623977)
- **Confidence**: high
- **Requirement**: writing-bible E7 Farplane voice system
- **Smallest fix**: Give the voice lines a narration or 'voice' style: no role plate, or 'FARPLANE' as the plate, with a faded portrait.
- **Acceptance check**: The Chapter V Farplane lines render without FFX role plates.

### 21. PR-0058 [polish, narrative] PR-0058 (carried, partly improved): Shinra still speaks with no portrait and no role plate; Brother and Buddy now have portraits but no role plate

- **Game**: FFX-2
- **Chapter**: XI Road to the Farplane (pre-scene), V (Vegnagun end)
- **Expected**: Named Gullwings crew speak with their portrait and plate, as the YRP do.
- **Observed**: Shinra portrait '-' and empty role (XI at 14365 ms, V at 1742882 ms). Brother (brother-x2.png) and Buddy (buddy.png) have empty roles.
- **Repro and seed**: Live 6ea8528f. Chapter XI at 1600x900, seed 1: the pre-scene first line.
- **Evidence**: critic/rounds/round-15/feel-narr/dbox-all.txt (ffx2-fallen-aeons-win, ffx2-vegnagun-shuyin-win)
- **Confidence**: high
- **Requirement**: RUBRIC §6 narrative (convincing characters); consistency
- **Smallest fix**: Add a Shinra portrait, or an approved text-only treatment decision, plus 'GULLWINGS' role plates for Shinra, Brother and Buddy.
- **Acceptance check**: Chapters XI and V pre-scenes show a plate on every Gullwings line.

### 22. PR-0104 [polish, feel] PR-0104 (carried, seen again on the phone): under Wait, a confirmed FFX-2 command shows nothing on screen before the next girl's menu opens

- **Game**: FFX-2
- **Chapter**: XVI Ixion at Djose, 390x844 touch
- **Expected**: Some readable acknowledgment that Yuna's Shell is charging or has resolved, before Paine's menu takes the screen.
- **Observed**: After SHELL -> ALL ALLIES is confirmed, nothing visible happens for 0.9 s, then Paine's command grid opens at 1.1 s. No Shell effect appears within the 2.0 s sequence.
- **Repro and seed**: Live 6ea8528f. Chapter XVI at 390x844 touch, pinned seed 1: tap Yuna, White Magic, Shell, ALL ALLIES.
- **Evidence**: critic/rounds/round-15/feel-narr/ffx2-ixion-djose-win-touch__seq-party-action.jpg (evidence/ffx2-ixion-djose-win-touch/seq-party-action)
- **Confidence**: low to medium. FFX-2 charge time is canon, so this is a feedback question rather than a timing defect.
- **Requirement**: RUBRIC §6 feel (action and reaction readability)
- **Smallest fix**: Show a small 'charging: Shell' tag on Yuna's row or over her figure while the command is queued.
- **Acceptance check**: A timed sequence shows the queued-command cue within 0.3 s of the confirm, on the phone and at 1600x900.

### 23. PR-0233 [polish, interface] PR-0233 (new; R15-IF-03): the open enemy info panel clips the turn list's last name at 2000x1012

- **Game**: FFX
- **Chapter**: I Seymour Flux, first command menu
- **Expected**: Every name that can be shown is shown in full (CHK-009).
- **Observed**: The turn list reads 'ortiorchis' because the Mortiorchis panel covers the M. At 1600x900 the panel is folded and nothing is clipped.
- **Repro and seed**: 2000x1012, drawn seed 1925036082, Ch I, first Tidus menu, enemy panel open (I).
- **Evidence**: critic/rounds/round-15/evidence/seymour-flux-win-drawn/12-intent-E.png; cap/zz-r15-iface-ctbclip.png
- **Confidence**: high
- **Requirement**: CHK-009, CHK-008
- **Smallest fix**: Keep the enemy panel's right edge clear of the turn-list column, or order the turn list above it.
- **Acceptance check**: At 2000x1012 and 2560x1080 with the panel open, no panel box intersects a turn-list label, and every label has scrollWidth <= clientWidth + 1.

### 24. PR-0234 [polish, interface] PR-0234 (new; R15-IF-04): the advisor card falls back to 'The best of what is offered.' and shows 'ALWAYS HITS' on non-attacks

- **Game**: FFX
- **Chapter**: X Seymour Natus (Talk), VIII Evrae (Pull back), XIV Isaaru (Grand Summon)
- **Where / state**: src/engine/tactics/advisor.ts:966 fallback reason
- **Expected**: The advice says why, and a hit-chance chip appears only on commands that can miss or hit.
- **Observed**: Ch X card: 'Talk, GUIDE'S PICK, NO MP, ALWAYS HITS, The best of what is offered.' The chapter guide's own reason (+10 Strength for Tidus and Auron, +10 Magic Defense for Yuna) is not shown.
- **Repro and seed**: Ch X at 2560x1080, seed 1, first Tidus menu. Ch VIII and XIV, first menu.
- **Evidence**: critic/rounds/round-15/evidence/seymour-natus-win/11-advisor.png; evrae-airship-win/run.json; isaaru-via-purifico-win/run.json
- **Confidence**: high
- **Requirement**: RUBRIC §2: the advisor offers useful actions and separates certainty
- **Smallest fix**: When the pick is the guide's pick, use the matching guide hint text. Suppress hit chips for Talk, Orders and Summon.
- **Acceptance check**: The first card in Ch X, VIII and XIV states a concrete reason, with no 'always hits' on Talk or Orders.

### 25. PR-0235 [polish, interface] PR-0235 (new; R15-IF-05): the Darkness card says 'Costs the party HP'; only the user pays 12.5% of her max HP

- **Game**: FFX-2 (the warning code path is shared)
- **Chapter**: XI Fallen Aeons (Shiva), Paine's turn
- **Where / state**: src/engine/tactics/advisor.ts:823 generic warning
- **Expected**: Per research/ffx2-combat-core.md:340, the user spends 12.5% of her max HP.
- **Observed**: The next-best-move card reads 'Darkness -> all enemies ... Costs the party HP.'
- **Repro and seed**: FFX-2 Ch XI, seed 1, 1600x900. Yuna uses Mega-Potion. Read Paine's card.
- **Evidence**: critic/rounds/round-15/evidence/extras-advisor-v3-megapotion/01b-next-card-while-Mega-Potion-charges.png
- **Confidence**: high
- **Requirement**: Interface: honest costs; AGENTS.md rule 6
- **Smallest fix**: Name the payer and the amount, e.g. 'Costs Paine 12.5% of her max HP'.
- **Acceptance check**: The Darkness card names Paine and the cost in Ch XI and VI.

### 26. PR-0236 [polish, interface] PR-0236 (new; R15-IF-06): in Ch VIII the Orders submenu opens with nothing choosable and its reasons are illegible

- **Game**: FFX
- **Chapter**: VIII Evrae, Tidus with both orders spent
- **Expected**: Reasons are legible (CHK-003), and a submenu with no choice is marked disabled at the top level.
- **Observed**: PULL BACK shows 'Already far' and CLOSE IN shows 'Ordered', both disabled, in dark grey on dark. The top-level Orders row stays enabled. The harness stalled here; the Esc exit was not tested.
- **Repro and seed**: 1600x900, seed 1, Ch VIII lose route until both orders are used, then open Orders.
- **Evidence**: critic/rounds/round-15/evidence/evrae-airship-lose-r2/27-no-choosable-row.png, run.json stuckRows
- **Confidence**: high
- **Requirement**: CHK-003, CHK-004
- **Smallest fix**: Raise the reason text to at least 4.5:1 contrast, and disable the top-level Orders row with a reason when no order is choosable.
- **Acceptance check**: The reason text measures at least 4.5:1. Orders cannot be opened when both rows are disabled.

### 27. PR-0237 [polish, interface] PR-0237 (new; R15-IF-07): first-time coach bubbles cover faces or weapons

- **Game**: both
- **Chapter**: FFX I (Auron bubble over Kimahri's and Yuna's heads, 2000x1012); FFX-2 XI (Rikku gauge coach over Paine's sword, 1600x900)
- **Expected**: No panel intersects a face or weapon (CHK-008).
- **Observed**: The coach boxes sit over the painted actors' heads or weapons while the player reads the menu.
- **Repro and seed**: Fresh profile. Ch I at 2000x1012, first menu, press E. Ch XI at 1600x900, Item targeting.
- **Evidence**: critic/rounds/round-15/evidence/seymour-flux-win-drawn/12-intent-E.png; extras-advisor-v3-megapotion/01a-target-Mega-Potion.png
- **Confidence**: high
- **Requirement**: CHK-008
- **Smallest fix**: Add the coach bubble to the actor safe-zone placement.
- **Acceptance check**: At 1600x900, 2000x1012 and 2560x1080, projected head and weapon rects do not intersect the coach box.

### 28. PR-0238 [polish, interface] PR-0238 (new; R15-IF-08): the PAUSE chip is small, grey and in a system-style font

- **Game**: both
- **Chapter**: every battle, top-left
- **Expected**: At least 14 css px, contrast at least 4.5:1, in HUD type.
- **Observed**: Grey text on a grey chip that does not match the Ink & Gold type. It reads at roughly 12 to 13 px (not measured).
- **Repro and seed**: Any battle at 1600x900.
- **Evidence**: critic/rounds/round-15/cap/zz-r15-iface-pausechip.png
- **Confidence**: medium
- **Requirement**: CHK-003
- **Smallest fix**: Style the chip with the HUD type tokens.
- **Acceptance check**: Computed font-size is at least 14 px and contrast at least 4.5:1.

### 29. PR-0239 [polish, interface] PR-0239 (new; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- **Game**: FFX-2 (the rail is shared)
- **Chapter**: XI Fallen Aeons, Rikku's Mega-Potion charging
- **Expected**: The two panels do not contradict each other about the same turn.
- **Observed**: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- **Repro and seed**: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- **Evidence**: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- **Confidence**: high
- **Requirement**: Interface: useful advice
- **Smallest fix**: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- **Acceptance check**: In the same case, the rail and the card agree or the rail defers.

### 30. FOC28-P02 [polish, interface] FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- **Game**: FFX
- **Chapter**: II and XIV Grand Summon picker, 390x844
- **Expected**: Legible and not clipped.
- **Observed**: Recorded by the focused review of this same build and still open.
- **Repro and seed**: See critic/reviews/6ea8528f-focused.md.
- **Evidence**: critic/reviews/6ea8528f-focused.json (reused, same sha)
- **Confidence**: high
- **Requirement**: CHK-003
- **Smallest fix**: As proposed in the focused report.
- **Acceptance check**: As proposed in the focused report.

### 31. PR-0241 [polish, prep] PR-0241 (new; R15-PREP-01): a KO'd member's '+0 AP' on the victory results gives no reason

- **Game**: ffx (the FFX-2 equivalent is not assessed: its results rows show EXP only for the listed members)
- **Chapter**: I Seymour Flux, victory results (drawn seed 1925036082, 2000x1012)
- **Where / state**: live 6ea8528f, Flux victory -> results
- **Expected**: Understandable results (RUBRIC section 6, prep): a player can tell why a member got nothing.
- **Observed**: Kimahri's row reads 'S.LV 25 · 0/442 AP  +0 AP' under 'AP 10,000 x3 PARTY', with no mark. The battle log shows he was KO'd by Mortiorchis at seq 71, before the victory event, so the zero is the engine's KO rule, but the screen does not say so.
- **Repro and seed**: Live, seed 1925036082 drawn, 2000x1012, the seymour-flux-win-drawn route. Win with Kimahri KO'd at the end, then read the results rows.
- **Evidence**: critic/rounds/round-15/evidence/seymour-flux-win-drawn/31-results.png; seymour-flux-win-drawn/battle-log.json (ko kimahri seq 71); critic/rounds/round-15/delivery/prep-phone-and-results-thumb.jpg
- **Confidence**: high on the observation; the underlying AP rule was not re-audited here (combat owner)
- **Requirement**: RUBRIC section 6 prep: understandable results
- **Smallest fix**: Add a small 'KO · NO AP' tag, or dim the portrait, on rows the engine excluded from AP. The wording and look are a small addition inside the approved results layout, so ask Bailey before building. FFX only unless the FFX-2 sources say the same about EXP.
- **Acceptance check**: A victory with a KO'd FFX member shows why that row got +0, in both the 1600x900 and 390x844 results layouts.

### 32. PR-0242 [polish, visual] PR-0242 (R15-VIS-04, carried target verdict, D-257 open): the Chapter IV pause hero plate is a different painting from its approved tile

- **Game**: FFX-2
- **Chapter**: IV
- **Where / state**: pause CHAPTER plate
- **Expected**: docs/screenshots/concept/pause-ch4.png
- **Observed**: The shipped plate is unchanged since round 04 (hash identical). The decision D-257 is still open with Bailey.
- **Repro and seed**: Chapter IV, Esc, CHAPTER tab.
- **Evidence**: critic/rounds/round-15/targets/pause-hero-ch4.jpg (member tab only this round); carried verdict
- **Confidence**: medium (carried)
- **Requirement**: target tile Hero plate, chapter 4
- **Smallest fix**: Await D-257; no builder action until Bailey picks.
- **Acceptance check**: D-257 settled and a CHAPTER-tab capture that matches the picked plate.

### 33. PR-0039 [polish, audio] PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible, and they bed more chapters

- **Game**: both (scene-gagazet and scene-dreams-end are FFX; scene-farplane is FFX-2)
- **Chapter**: scene-gagazet: I, IX, X, XIV; scene-dreams-end: III, XII; scene-farplane: V, XI, XVI Abyss, VI post-scene
- **Where / state**: lyrical scene beds
- **Expected**: A tempo map on each lyrical cue (THEMES.md, Renderer requests #1). FAREWELL_RISE present in scene-dreams-end.
- **Observed**: themes-audit FAILs scene-gagazet, scene-dreams-end and scene-farplane: no tempo map, so the accompaniment stays on the grid. scene-dreams-end has FAREWELL_RISE ABSENT. scene-farplane's detected key is E minor against a map of E major.
- **Repro and seed**: node tools/audio/themes-audit.mjs
- **Evidence**: critic/rounds/round-15/audio/themes-audit.txt
- **Confidence**: high (data); the audible effect is unverified, because no agent can hear
- **Requirement**: docs/audio/THEMES.md cue bible
- **Smallest fix**: Fold these three cues into the Direction B re-render: add a tempo map to each, and FAREWELL_RISE to scene-dreams-end.
- **Acceptance check**: themes-audit prints '0 of 25 cue(s) depart from the bible', and Bailey hears the three re-renders before they ship.
- **STALLED** (RUBRIC §8): a method check is owed before the next batch touches it.

### 34. PR-0203 [polish, audio] PR-0203 (carried; D-210 adopted, not built): at default settings the SFX bus (0.9) sits above the music bus (0.7)

- **Game**: both
- **Chapter**: all
- **Where / state**: default mixer settings for a new profile
- **Expected**: D-210 (Bailey): lower the sound effects for new profiles only. THEMES.md SFX rule 8: effects sit about 6 dB under the music.
- **Observed**: Every round-15 AudioManager sample reports the defaults master 0.8, music 0.7, sfx 0.9, unchanged since round 13.
- **Repro and seed**: Fresh profile on the live build; read the AudioManager debug surface's volumes.
- **Evidence**: critic/rounds/round-15/evidence/*/audio-debug.jsonl (the volumes field)
- **Confidence**: high on the settings; the loudness balance by ear is unverified
- **Requirement**: D-210; THEMES.md SFX rule 8
- **Smallest fix**: Lower the default SFX volume for new profiles only, per D-210. Existing saves keep their setting. Save-schema class: deep review before deploy.
- **Acceptance check**: A fresh profile reports an sfx default that puts the loudest sprite effect about 6 dB under the music at default settings. An existing save's volumes are unchanged after the upgrade (CHK-024).

### 35. PR-0227 [suggestion, encounter] PR-0227 (information for Bailey; R15-E01 + the XIII part of the capture owner's advisor-loss finding): Chapter XIII is won 1-3 times in 40 at human pace on every line, and 0 in 5 by real keys

- **Game**: FFX-2 only
- **Chapter**: XIII Trema (Paragon then Trema)
- **Expected**: Bailey chose this shape knowingly (D-151, from trema-options-2026-09-25.md, where 'no option reaches 1 win in 4 for a human'), so it is not scored as a defect. It is reported so Bailey sees the listed chapter's measured first-try rate.
- **Observed**: Intended line 1/40 (instant play), 3/40 (1 s). Advisor top row 2/40 (round 14: 0/40). Most losses come at link 1 (Oversoul Paragon). Live real keys: 0 of 5 attempts across ffx2-trema-win, -win-drawn and -lose. The checkpoint retry at the Trema link works.
- **Repro and seed**: R15_CH=ffx2-trema npx vitest run --config critic/rounds/round-15/combat-deep/r15d/vitest.config.ts critic/rounds/round-15/combat-deep/r15d/ffx2.test.ts (seeds 1-40)
- **Evidence**: D:/Final Fantasy/critic/rounds/round-15/combat-deep/out/ffx2-three-line.json; D:/Final Fantasy/docs/plans/trema-options-2026-09-25.md
- **Confidence**: high
- **Requirement**: RUBRIC §6 encounter (fair wins, correct difficulty); chapter-trema-review.md §9 'never weaken a boss; bring Bailey measured options'
- **Smallest fix**: No tuning. Add one line to Bailey's next brief: the listed chapter's measured first-try and within-5 (with checkpoint) rates, and whether he wants it kept as the collection's hardest fight.
- **Acceptance check**: Bailey's answer is recorded in docs/target/decisions.json.
- **Absorbs**: R15-E01; capture owner "Following the advisor by real keys loses ... XIII" (XIII part: matches the bench and D-151)

### 36. PR-0217 [suggestion, combat] R15-C02 (PR-0217 carried, unchanged): the FFX engine keeps Zombie across a KO, and the Chapter II advisor's top row revives KO'd Zombies 452-501 times per 40 seeds

- **Game**: FFX only
- **Chapter**: II Yunalesca (also I Flux: 46 per 40 seeds)
- **Expected**: Sourced behaviour, or a labelled estimate.
- **Observed**: Bench counter zombieReviveTopRows: II 452 (seeds 1-40) and 501 (large seeds); I 46 and 46. Identical to round 14. research/ffx-combat-core.md does not say whether a KO clears Zombie.
- **Repro and seed**: critic/rounds/round-15/combat-deep/r15d/ffx.test.ts, advisor arm, Chapter II
- **Evidence**: D:/Final Fantasy/critic/rounds/round-15/combat-deep/out/ffx-three-line.json
- **Confidence**: medium
- **Requirement**: AGENTS.md rule 6
- **Smallest fix**: Research reading pass (GameFAQs first, D-214) on Zombie at KO. Label the engine's current choice as an estimate until it is settled.
- **Acceptance check**: research/ffx-combat-core.md carries a tagged line on Zombie across KO, and the engine and a unit test follow it.

## Resolved, refuted, merged

Resolved this round (with evidence): PR-0031 (FFX targeting matches approved s2 in Ch I, III, X (visual auditor; D-249)); PR-0180 (FFX actions now named on screen in Ch I and X (feel auditor)); PR-0204 (Chapter X Talk now speaks (narrative auditor, seymour-natus-win)); PR-0199 (IC-2 wraps 0 in every FFX-2 bench row (combat auditor)); PR-0200 (Acta Est Fabula heals only the Redoubts, 867/867 (combat auditor)); PR-0209 (0 immune results opened a chain (combat auditor)); PR-0197 (the XII advisor now advises disc attacks (combat auditor)); PR-0208 (the Ch III advisor card names the lettered Pagoda ('Yu Pagoda A') (combat auditor, live picks)); PR-0100 (audio/candidates returns 404 live; qa --strict exits 0 (audio auditor)); PR-0214 (all 5 Chapter I runs reach the first menu on boss-seymour after the pre-scene (audio auditor)); PR-0001 (phone results (option B) hold (visual auditor)); PR-0195 (the CHK-024 upgrade matrix ran on live with release 20 and 25 fixtures (capture owner, delivery auditor)); PR-0202 (the capture harness records the real drawn seed (index.json, e.g. 1925036082)).

Not recurred (kept open-unknown): PR-0216 (did not recur in about 34 fresh sessions (audio auditor); kept open-unknown, a non-recurrence is not a fix).

- Refuted: Capture owner: "FFX phone battle grid rows below the sixth cannot be reached by touch". By: confirmer (tap-then-Back ladder reaches Fire Gem in 7 rounds). Now: PR-0218, polish, discoverability
- Refuted: Capture owner: "Following the advisor by real keys loses Chapters III, XII and XIII every time" as a product encounter defect. By: combat auditor (lettered-target mis-steer established from target ids; engine advisor line wins the same seeds III 9/9, XII 5/7). Now: III and XII: PR-0225 (harness); XIII: PR-0227 (information for Bailey). The confirmer's XII re-run did not examine the target mapping and is recorded as a dissent.

Merged: PR-0221 = R15-VIS-01 + capture owner cold first play + R14-VIS-02; PR-0222 = R15-DEL-03 + capture owner FF7 black + R15-VIS-02 (black half); PR-0223 = R15-DEL-02 + R15-VIS-02 (pause half); PR-0224 = R15-DEL-01 + R15-VIS-03 + capture owner 404 finding; PR-0225 = R15-CAP-07 + R15-H01 + R15-FN-05 + the III/XII part of the capture owner advisor-loss finding; PR-0218 = R15-IF-01 + R15-CAP-01; PR-0227 = R15-E01 + the XIII part of the capture owner advisor-loss finding; PR-0032 = R15-ONB-01 (round 13 id reused); PR-0179 = R15-C01; PR-0217 = R15-C02. Downgraded: PR-0218 major to polish (confirmer refutation); PR-0225 major to polish (no player impact; the damage is carried as UNVERIFIED coverage).

## What stands between this build and acceptance

- Audio has no number until Bailey scores the shipped mix (PR-0148); the score stays provisional.
- Seven categories are below the 9.0 floor: visual 7.8, interface 7.8, onboarding 7.4, feel 8.1, delivery 8.2, narrative 8.4, prep 8.6.
- Twelve majors are open (listed above), led by the cold-load art gap PR-0221, the pause-cue takeover PR-0226, the Songstress placeholder PR-0228, and the gamepad gaps PR-0219 and PR-0220.
- Real-key completions are missing for III, XII and XIII, and the VIII loss route; the first two need the harness fix PR-0225 before they can be measured.
- The target gate has 7 failing, 21 unverified and 5 waiting tiles; seven human judgments are unrecorded.
- Load and frame time have never been measured on named conditions (CHK-017), and no real device, controller or non-Chromium browser has been tested.

## What changed since the previous round

Round 14 (on release 21, d8837334) collected evidence but wrote no validated report, so the last validated deep report is round 13 (b975397b). Against the prior deep evidence: three FFX-2 engine majors are closed (PR-0199, PR-0200, PR-0209), FFX targeting now matches the approved s2 look (PR-0031), FFX actions are named on screen (PR-0180), Chapter X Talk speaks (PR-0204), the Omnis advisor turns discs (PR-0197), audition candidates no longer ship (PR-0100), the save upgrade matrix ran (PR-0195), and Chapter XVI Ixion at Djose is new, sourced and winnable on desktop and phone. New this round: the cold-load art gap (PR-0221), the pause-cue takeover (PR-0226), the Songstress placeholder (PR-0228), the gamepad gaps (PR-0219, PR-0220), and the hidden FF7 fight's black load (PR-0222, new feature). Rubric v1 rounds 02 and 03 are not compared.

## Proposals (nothing here is built without Bailey's yes)

- Offer Reduce motion and Low effects as rows in the approved OPTIONS tab (both games): the flags already exist in SaveData; benefit: motion and flash accommodation without an OS setting; cost small; fit: accessibility adaptation, no canon change; preview: a mockup of the OPTIONS tab with the two rows (needs Bailey's yes, rules 9 and 10).
- Songstress paintings for Rikku and Paine (FFX-2 only): an options round of 2 to 4 concept frames before any render, or, until then, keep Songstress off their grids in chapters that offer it (needs Bailey's pick).
- A phone paging control for long FFX command lists (FFX only): real 44 px up/down controls that page the window without confirming; preview: a 390x844 mockup of the Items window.
- A short "sound off: press any key or click" chip on the title for a pad-only start (both games), if a pad press cannot unlock audio in the browser.
- Send Bailey a phone pack of the Direction B re-renders of the most-heard cues with one question each: a score out of 10 and ship yes/no (settles PR-0148 and unblocks PR-0099).

## Next review

The deep obligation stays PENDING on 6ea8528f (critic-clear refuses it: required coverage untested and mandatory checks UNVERIFIED). A short follow-up deep pass on the live build (or the next build, which inherits the obligation) must first promote the harness fixes (PR-0225), then capture: real-key wins with aftermath for III (FFX ending), XII and XIII on pinned seeds; the VIII loss and RETRY; a resource-timing HAR for PR-0221; a controlled cold/warm load and frame-time table (CHK-017); the XVI whistles and V coda answers (CHK-023); the pause CHAPTER tab, spell FX B, a party-wide target step, Ch XI on a phone, and the 1440p/4K rotation. The deploy cap for an owed deep review applies (RUBRIC §4); STALLED majors PR-0148, PR-0099 and PR-0179 need their method checks before the next batch touches them (RUBRIC §8).

## Note for the driver

The only chat message relayed into this run was a question to the orchestrator (the session's name, the account, the weekly usage left). The gap-capture agent answered it from the session tools (title "FFX/FFX-2 2.5D game recreation", account bpillon3@gmail.com on Max, about 51% of the weekly all-models allowance left at its reading, resetting 2026-10-03 11:00Z) and skipped the gap captures because of it. The driver should confirm those answers to Bailey from its own session; nothing in this report depends on them.
