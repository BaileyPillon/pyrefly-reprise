# Critic round 16 (deep, policy v2): release 29 production candidate 49005f73

```text
Build / artifact / target version: main 49005f73 (49005f7360649e036aa49a812bd544f56ff3f8bf), bundle C73AJ1Ds, artifact 091f420632fe1adf994b83c04d1a2c1d8f5ba37912b03cbe96f2445fc474b526 (913 files, dist-gate from D:/pyrefly-rel28), targets.json ed2b288e83628af41273c7d7e577bd4d942a16eb84e80249c6770faa158f85c0
Review: deep (save-data class: deep before deploy)
Deployment: NOT APPLICABLE (production candidate, not deployed; CHK-017 owed after the deploy)
Changed area: FAIL (save-data change PASSES; Chapter VII brings three new majors; CHK-003/004/008/009/012 fail)
Ship: SHIP. No critical, no regression against live 6ea8528f, save upgrade proven by running. Discloses 10 majors: PR-0243, PR-0244, PR-0245 (new, inside Chapter VII), PR-0148, PR-0228, PR-0220, PR-0099, PR-0032, PR-0240, PR-0222 (carried)
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED, no number); scored categories: combat 9.3, encounter 9.0, visual 8.7, feel 8.1, narrative 8.7, interface 8.2, onboarding 7.5, prep 8.9, delivery 8.6
Targets: required 79 / matched 61 / failing 0 / unverified 18 / waiting on decision 5
Top issues: PR-0243 Ch VII opens on Guado Guardian A (feel, f00.jpg); PR-0244 Ch VII aftermath is an empty plate (gaps/ch7-1600x900-r2/seq-after-confirm); PR-0245 revive advice on a KO'd enemy (win-touch/turn-log.json); PR-0228 Songstress mannequin; PR-0148 no owner audio verdict
Coverage: 16/16 chapters won by real input with aftermath and reload; 10-case save matrix + e2e save spec; engine replay; reused: FFX-2 bench, reduced-motion entry; not tested: browsers other than Chromium, real devices, 1440p/4K, FF7 cold door
Next required review and why: LIVE review after the deploy (CHK-017 exact artifact, live save-reload smoke); next deep re-checks PR-0243/0244/0245 and requiredNotTested
Elapsed review time / repeated work avoided: about 395 min wall clock (capture 330 agent-min); no auditor opened a browser; FFX-2 bench reused with a dependency argument
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
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-005 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-B1 is UNVERIFIED
  - 10 critical or major issue(s) remain open
  - 18 required target(s) unverified
  - 5 required target(s) waiting
  - only 61 of 79 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148)
  - human judgment not recorded: Audio: the new scene-macalania-temple cue (sketch A in remaster R1)
  - human judgment not recorded: Feel: Bailey's verdict on a build that adds a chapter and changes load order and transitions (CHK-B2)
  - human judgment not recorded: Narrative: Bailey's story read of Chapter VII and the newly reached Ch III, XII and XIII aftermaths (CHK-B3)
  - human judgment not recorded: Songstress paintings for Rikku and Paine (PR-0228) need an options round (rule 9)
  - human judgment not recorded: Accessibility settings rows (PR-0032) change a screen Bailey sees (rules 9, 10)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## Verdicts

- **deployment: NOT APPLICABLE.** Production candidate, not deployed: there is no live artifact to verify (task instruction). CHK-017 is owed after the deploy.
- **changedArea: FAIL.** FAIL. The save-data change passes completely (CHK-024), the load, audio and input repairs mostly land (PR-0219, 0221, 0226, 0232, 0233 resolved), and Chapter VII is playable end to end on desktop and phone, but the newly reachable chapter brings three majors (PR-0243 wrong opening subject, PR-0244 invisible aftermath staging, PR-0245 revive advice on a KO'd enemy) and CHK-003/004/008/009/012 fail.
- **milestone: not assessed.** not assessed (deep review); audio is UNVERIFIED and several categories are below 9.0.
- **ship: SHIP.** SHIP: no critical defect, no regression against live 6ea8528f; the save-data class is proven safe by running.

Ship reasons:

- No critical defect was found: every one of the 16 chapters finishes through its real flow, with results, aftermath, board and a reload that keeps the clear.
- The save-data change (D-210) is proven by running: a release-28-written save keeps its own SFX level and all progress; settings without a level get 0.9; no settings object and fresh profiles get 0.35; tests/e2e/save-upgrade.spec.ts passes 2/2 on the candidate.
- No issue is a regression against live 6ea8528f: every critical/major carries regressionVsLive false.
- The three new majors (PR-0243, PR-0244, PR-0245) are inside Chapter VII, a feature that does not exist live; none is critical, so they are disclosed, not blocking, and Chapter VII need not ship switched off.
- The remaining majors (PR-0148, PR-0228, PR-0220, PR-0099, PR-0032, PR-0240, PR-0222) are carried from live and disclosed; several improved (PR-0240 narrowed to the 10 Mbit/s case, PR-0099 from 9/15 to 9/16).
- The candidate is better than live: PR-0219 (pad in FFX-2), PR-0221 (art paints), PR-0226 (pause cue), PR-0232 (phone taps), PR-0233, PR-0179 and the owed CHK-022 coverage all land.

Majors this release discloses:

- PR-0148: PR-0148 (carried, owner-reported, STALLED): no numeric owner verdict on the shipped mix, and the latest ear verdict is negative
- PR-0243: PR-0243 (new; R16-FN-01 = R16-VIS-02): Chapter VII opens on the wrong subject: the battle-start card and the intro dolly name and show Guado Guardian A instead of Seymour
- PR-0244: PR-0244 (new; gap pass): Chapter VII aftermath staging is invisible: about 3.4 s of empty plate after CONFIRM (and 2.4 s before results); the kneel, KO and sending are never seen
- PR-0245: PR-0245 (new; R16-IF-01): the Chapter VII advisor recommends Phoenix Down on the KO'd Guado Guardian A, 16 turns in a row
- PR-0228: PR-0228 (carried): the Songstress dressphere renders as a grey placeholder mannequin
- PR-0220: PR-0220 (fix built, not proven at runtime): a pad-only player may still hear nothing until they touch a key, the mouse or the screen
- PR-0099: PR-0099 (carried, STALLED, improved): 9 of 16 playable chapters still play at least one borrowed stand-in cue
- PR-0032: PR-0032 (carried): no in-game text size, remapping, or reduce-motion, low-effects or flash setting
- PR-0240: PR-0240 (carried, narrowed): on a cold 10 Mbit/s link the first battle still waits about 19 s behind the loading card (met at 50 Mbit/s and above)
- PR-0222: PR-0222 (carried): the fix for the hidden FF7 fight's 20-40 s of black on a cold cache is claimed but was not captured this round

## The save-data class (why this review ran before the deploy)

CHK-024 **PASS**. SAVE-DATA CLASS, proved by running. Every case wanted by the task is proven by running the code. A save the release-28 build itself wrote keeps its own sfx (0.65), and the upgrade carries its progress, clears, best times, attempts, flags, unlocked and seenCoach byte-for-byte (carryDiffs []). Settings without a finite sfxVolume (missing, null or string) get 0.9; an explicit 0 stays 0. No settings object, a fresh profile and truncated storage get 0.35. The release-20 and release-25 fixtures keep 0.65 and 0.9. All values survive a reload, and the applied mixer volumes equal the stored settings. Harmless observation: a migrated 0.9 is not written back to storage until the next save, but migrate() re-derives it on every load. The reset/confirmation part is NOT APPLICABLE: SaveStore.reset() has no caller in src, so there is no player reset flow. tests/e2e/save-upgrade.spec.ts itself was not run this round; the in-browser matrix covers the same fixtures and more. Observation, not a defect: a save without a stored sfxVolume is not written back, so migrate() re-derives 0.9 on each boot until the player changes a setting. Chief final validation: the SaveData.ts diff 6ea8528f..49005f73 is exactly the two D-210 lines (defaultSettings sfxVolume 0.35; migrate() gives 0.9 when raw.settings exists without a finite sfxVolume); the save-matrix JSON re-read shows all 10 cases sfxOk and reloadOk with no errors and carryDiffs [] where computed; and tests/e2e/save-upgrade.spec.ts run by the chief against dist-gate (vite preview 127.0.0.1:5741, PYREFLY_BROWSER=gpu, headless) passed 2/2 (release-20 save: clears, ribbons, best times, volumes, text speed and ATB mode; truncated save boots fresh with no error).

Evidence: critic/rounds/round-16/evidence/save-matrix/save-matrix.json, critic/rounds/round-16/chief/save-upgrade-e2e.txt.

## Categories

| Category | Weight | Score | Status |
|---|---:|---:|---|
| combat | 20 | 9.3 | scored |
| encounter | 10 | 9 | scored |
| visual | 15 | 8.7 | scored |
| feel | 10 | 8.1 | scored |
| narrative | 10 | 8.7 | scored |
| audio | 10 | (none) | UNVERIFIED |
| interface | 10 | 8.2 | scored |
| onboarding | 5 | 7.5 | scored |
| prep | 5 | 8.9 | scored |
| delivery | 5 | 8.6 | scored |

### combat (9.3)

[combat-encounter auditor, round 16 deep, candidate main 49005f73 built in D:/pyrefly-rel28; no browser opened and no server started, so none to stop. Scratch files are in D:/Final Fantasy/critic/rounds/round-16/combat/.] WHAT CHANGED IN COMBAT: git diff 6ea8528f..49005f73 is empty for src/battle, src/data/ffx/enemies, src/data/ffx2 and src/data/encounters.ts. The data changes are late-aeon-rows.ts (new), zanarkand.ts, dreams-end.ts and gagazet-aeon-arms.ts (an exported type and function only). The tactics changes (advisor.ts, guide.ts, guide-inflight.ts) alter reason and warning strings and the FFX-2 guide rail's NEXT only, not suggestions[0].command. DATA AUDIT: all 100 cells of ZANARKAND_SOURCED_ROWS and INSIDE_SIN_SOURCED_ROWS equal research/ffx-combat-core.md §6.4.3 (N=300 and N=360, Luck 17). garden-of-pain.ts:92 clones the Chapter III aeons. The possessed aeons mirror the live roster (ffx-bfa-yu-yevon.md §2.2). Aeon HP now rises through the story: Macalania, then Gagazet, then Zanarkand, then inside Sin. This closes PR-0179. TESTS ON THE CANDIDATE: 23 targeted files, 235 tests pass; a broad sweep of 205 files and 4,014 tests (chapters plus every strategy-, ffx-, ffx2-, data-, engine- and battle- file) all pass. FFX-2 goldens are byte-identical. RUNTIME = ENGINE (CHK-023): 15 real-key capture logs replay event for event through the pure engine at their recorded seeds (combat/ffx-replay.json): Chapters II, III link 1 (1,292 events), VII x3, VIII x2, IX, X, XII x3, and I x2. Chapter I at seed 1 is an identical prefix of a truncated log; Isaaru's log is the last link only, so replay does not apply. Live engineHp shows the sourced rows (Chapter II Valefor 1674 / Bahamut 3218; Chapter III 1886 / 3657; possessed-bahamut 3657/3657). SEEDED BENCH (combat/ffx-three-line-r16.json): chapters whose data did not change are identical to round 15. Open: PR-0217 (suggestion). FFX-2 engine bench reused from round 15 with a dependency argument.

### encounter (9)

CHAPTER VII (newly unlocked, FFX): the enemy data matches research/ffx-seymour-anima-macalania.md §1-3 and §8.4 (Seymour 6,000 HP / Mag 25 then 32 / poison 40 / Threaten-immune; Guardians 2,000 HP with overkill 2,000; Anima 18,000 HP, poison-immune, not immune to percentage damage; aeons 1146/1515/1513/1342). Engine tests cover the element cycle, Cover, the 5,999 cap and 1 HP floor, the summon at 3,000, Steal economics and act three. Bench: intended 189/200, advisor 193/200; mistake 0/200 (loses in act one). Real keys: wins at 1600x900 (52 commands) and at 390x844 touch (106), and a loss with RETRY to prep. CHAPTER II is fairer on the sourced rows (40-seed intended 40/40 and 40/40; median decisions 146 -> 124). CHAPTER III: win rate flat (intended 57 -> 59 of 60), but the possessed-aeon gauntlet is about 2.3x longer (R16-E01). UNCHANGED: Chapter I is won by the intended line about 47 % of the time (real keys won only on a drawn seed, as in round 15). Chapter XII is 27/40 intended and lost twice by touch. Chapter XIII is PR-0227 (Bailey's choice). No canonical tactic is penalised.

### visual (8.7)

[visual-targets auditor, deep round 16, PRODUCTION CANDIDATE main 49005f73, dist-gate bundle C73AJ1Ds, artifact 091f4206; not deployed] I opened no browser and started no server, so there was nothing to stop. I judged the capture owner's evidence: PYREFLY_BROWSER=gpu headless Chromium, real keys, taps and pad, at 1600x900, 2000x1012, 2560x1080, 1280x960 and 390x844. I used 832 verified frames and left out the 7 frames marked verified=false (the 30-post-scene frames that landed on results). I made 75 target-vs-build composites (critic/rounds/round-16/targets/*.jpg, pairs.mjs, grids/g00-g12.jpg) and 12 contact sheets (critic/rounds/round-16/visual/st-*.jpg).

PROTECTION: in the candidate manifest, approved art is 244/244 byte-identical and judge-locked art 48/48. I recomputed all 913 manifest hashes against dist-gate and every one matched. verify-approved: 0 mismatched, 0 missing.

FOR:
(1) R15-VIS-01 / PR-0221 is resolved on this candidate.
- Every pre-scene first line that has a speaker shows the speaker's portrait, painted: Kimahri, Braska, Rikku (Ch IV, VI, VII, XVI), Nooj, Wakka, Lulu, Shinra. In round 15, 8 of 9 were empty.
- Every pre-scene backdrop is painted. Ch X is black on purpose: its script says fade('black') behind the interlude narration.
- The Until Dawn pause close-up paints in 20 of 20 first-Esc captures, 15 of 15 tab-next captures and on the phone. In round 15 it was blank in 12 of 16, 6 of 6 and 2 of 2.
- The chapter select plate and every card strip are painted on desktop and at 390x844, which closes R14-VIS-02.
(2) Chapter VII is new and renders its approved art at gameplay scale:
- backdrop A, pixel-true to the tile, in battle and in the scenes;
- Seymour form B, arms crossed;
- Guardian A with his face and pointed ears visible;
- the Seymour pause plate.
The fight stands exactly on Bailey's picked party layout B at 1600 and 390 (composites dec-macalania-layout-b*). The party standing among the fiends is that pick's disclosed cost, so I do not count it as a defect. Occluders fade while a target is chosen, and every fiend stays identifiable.
(3) Party-wide FFX targeting (s1) matches its target in Ch VII: a TARGET plate naming all three, brackets on each member, and the ALL ALLIES tag. s2 matches in Ch III and Ch VII.
(4) D-257: the Ch IV pause plate file is now pixel-identical to its tile (mean abs diff 0.0), so it no longer fails.
(5) Facing, ground contact and scale hold in all 16 chapters' mid-fight frames.

AGAINST:
- Carried major PR-0228: the Songstress dressphere still renders as a grey placeholder mannequin (Ch XIII 23-midfight).
- New polish R16-VIS-02: the Chapter VII battle-start card headlines 'Guado Guardian A', with his painting, instead of Seymour, the chapter's boss.
- New polish R16-VIS-03: after a target cancel, the Sensor card sits over Guardian B's staff and torso at 1600 and 2000.

UNCAPTURED: Anima's arrival (the money shot), any on-screen Seymour Ch VII speaker line, the CHAPTER tab in Ch I, IV and IX, and the boss hurt poses.

GAIN VS ROUND 15 (7.8): yes. The main surfaces the player looks at first (scene portraits, backdrops, the pause centrepiece, the board) now render their approved art. The target gate went from 7 failing to 0. The score stays below 9 because of the carried placeholder mannequin and the Ch VII card mis-headline, and because Anima's arrival is not evidenced. [CHIEF NOTE] The gap pass later captured Anima's arrival (camera drop, chains, one continuous rise, Seymour greyed with CANNOT BE TARGETED, Anima's gold tag) and a Seymour Ch VII speaker line; it also found the 390x844 arrival clipping (PR-0247). R16-VIS-02 is merged into PR-0243 and scored under feel. The auditor's score is kept: the new arrival evidence and the new phone clipping roughly offset, and PR-0228 and the Ch VII opening card stay.

### feel (8.1)

[feel auditor, deep round 16, PRODUCTION CANDIDATE main 49005f73 from D:/pyrefly-rel28, not deployed; judged only on the capture owner's evidence in critic/rounds/round-16/evidence (headless Chromium, PYREFLY_BROWSER=gpu, ANGLE D3D11). I opened no browser and started no server, so I had nothing to stop and no port to close.] Scratch is in critic/rounds/round-16/feel-narr/: 112 contact sheets of the timed sequences (sheet.py), stills grids (grid.py: grid-banner-f00.jpg, grid-33-after-confirm.jpg, grid-05-pre-scene.jpg, grid-choices.jpg) and crops. The sequences cover 16 chapters and both games, by keyboard, pad shim and 390x844 touch, at about 250 to 330 ms per frame. GAINS: (1) PR-0229 did not recur. The first spherechange shows the new outfit 287 to 562 ms after the flash in Ch IV (pad), XV and XVI, against up to 1.8 s in round 15 (ffx2-bahamut-win-pad, ffx2-den-of-woe-win and ffx2-ixion-djose-win seq-spherechange). (2) Chain seams are coherent. There are 19 seam sequences, and all read the same way at about 2.5 s: fade, dolly to the incoming boss, name caption, then the menu. That includes all six Ch III possessed-aeon seams (braskas-final-aeon-win__seq-seam-2..7.jpg). (3) Every one of the 16 chapters now reaches its aftermath by real input (CHK-022), including III, VII, XII and XIII. Pre-scene Esc opens pause and one hold skips the scene in 24 of 24 runs (runs-summary.json). (4) Frame pacing on the named host: 60 fps, p99 16.8 ms, one 183 ms spike in the Ch IV fight (perf/*.json). The loading wait is scored under delivery. LOSSES: the new Chapter VII opens on the wrong subject. The Ink & Gold battle-start card and the intro dolly caption both name 'Guado Guardian A', with the retainer's painting, in all three Ch VII runs (R16-FN-01, major, new feature). Ch VII Talk shows 'Tidus SPEAKS' for about 1.6 s and nothing is said (R16-FN-03). PR-0104 is seen again by pad: after Shell is confirmed in Ch IV, nothing visible happens for 1.27 s, then Paine's menu opens at 1.52 s. Cross-references scored elsewhere: Paine's Songstress is still a grey mannequin after the change flash in Ch XIII (visual, R15-FN-01), and in Ch VII the party is staged inside the enemy line (visual, capture owner R16-CAP-01). NOT MEASURED, so no credit given: input latency (no keydown-to-highlight or confirm-to-action probe), scene-skip to first menu (PR-0061), Anima's entrance (the chapter's 'money shot', research §9.4, not captured), the Ch VII aftermath staging over time, Ch IX Zanmato, any video clip, and Bailey's feel verdict (CHK-B2). The score stays at round 15's 8.1: the gains are real, but they are offset by a conspicuous defect in the one chapter that is new this round. [CHIEF NOTE] The gap pass then measured input latency (keydown to highlight 3-17 ms, confirm to action start 15 ms in Ch VII) and captured Anima's arrival as one continuous move (credit), and found the Ch VII aftermath plays as an empty plate for about 3.4 s after CONFIRM with the kneel, KO and sending unseen (PR-0244, major). The auditor's 8.1 is kept: the new credit and the new major offset.

### narrative (8.7)

[narrative auditor, deep round 16, candidate 49005f73] Dialogue timelines come from run.json dboxTimeline for 24 runs plus the lines and choices of the 4 labelled scene runs (feel-narr/dbox-all.txt). Scripts were read from D:/pyrefly-rel28/src/story. The beats were checked against research/writing-bible.md and research/ffx-seymour-anima-macalania.md §9.6 and §9.7. GAINS: (1) The Ch III ending aftermath is reached by real keys for the first time. It follows writing-bible E4 post-battle beat for beat: 'Is that it? Did we—', Auron's 'Overdue. By ten years.' and 'This is your world now', Tidus's 'Then don't say goodbye / Say the other thing', and the narration 'That's the end of my story ... I left in the part where she kept walking.' Yu Yevon's mid-battle beats are the funeral the bible asks for: a farewell per aeon and 'Something small can eat anything. / Give it a thousand years.' (braskas-final-aeon-win). (2) The new Ch VII script covers §9.6 beats 3 to 8 and §9.7 beats 9 to 12. The guardians confront Seymour before Yuna leaves the Chamber. He explains the patricide in a level voice, reads her plan aloud, and the scene holds her unqualified 'Yes.' After the fight the Guado take the body and break the sphere, Yuna says '...I didn't send him.', and the chapter framing lands in Tidus's narration: 'We won that fight in about six minutes. / Then they took the body, the sphere and our names.' This is reached on desktop and 390x844 touch. (3) The Ch XII aftermath is reached (Yuna sends him: '...Goodbye, Seymour.'). So is the Ch XIII aftermath: Trema's 'Why do you fight, if not to forget?' and Yuna's 'For what I made with them. Every day of it.' (4) The Ch V coda by real keys: Whistle then Yes, Whistle then No ('He's already with me. / Thank you for asking.') and Keep walking. Each is dignified and each ends on its own lines, as E5-CODA rule 4 asks. The eyebrow now reads 'CHAPTER V · THE FARPLANE GLEN', so PR-0230 is resolved. (5) PR-0231 is resolved: Auron now says 'It hits all of us. Keep everyone up.' (6) PR-0161: Braska, Auron and Jecht carry the 'Farplane' plate in FFX-2 while FFX Ch II keeps 'High Summoner'. That is game-aware, but the visual voice treatment is not captured. (7) PR-0058: Brother, Buddy and Shinra carry 'Gullwings'. Shinra is name-only because he has no painting. OPEN: the first-Boost callout in Ch VII misstates the mechanic (R16-FN-02). Ch VII Talk is silent (R16-FN-03). Tromell's five lines have no name plate (R16-FN-04). The Ch XVI whistles say a light answers but none is shown (R16-FN-05, cross-referenced from feel). 'That's it?' is Tidus's reaction in four aftermaths (R16-FN-06, suggestion). CAPS: the harness hold-skips after 3 or 4 lines, so scene staging is read from the timelines and the scripts, not seen. Bailey's story read is not recorded (CHK-B3).

### audio (UNVERIFIED)

[audio auditor, deep round 16, production candidate main 49005f73 built into D:/pyrefly-rel28/dist-gate, artifactHash 091f4206..., not deployed] I cannot hear, and I listened to nothing: every result here comes from reading data. There is no score because none can be given. docs/audio/OWNER-VERDICT.md still has no numeric owner score for the shipped mix. Bailey's latest ear verdict on the live mix (2026-09-27, release 21) is 'still sounds like snes music', with no number. His 2026-09-28 verdict on the three Chapter VII sketches was 'tinny and hollow' and 'close to good'. The shipped scene-macalania-temple is sketch A put through remaster R1. That was the driver's pick under D-278, which Bailey delegated in so many words, and Bailey has not heard R1. Under RUBRIC section 6 the category is UNVERIFIED: it is not averaged away and it is not zero.

TECHNICAL HEALTH: PASS. The only audio that changed against live 6ea8528f is audio/manifest.json plus one new file, music/scene-macalania-temple.mp3 (sha fd920a04, the same bytes as public/). All 27 other audio files are hash-identical to critic/artifacts/6ea8528f.json. I ran `qa.mjs --strict` against dist-gate/audio: exit 0 and 0 findings. All 26 cues measure -15.97 to -16.20 LUFS and -1.06 to -2.86 dBTP, with 0 clipped samples and every seam ok. The SFX sprite has 134 cues and peaks at -1.13 dBTP. Total audio is 41.57 of the 60 MB budget. An independent ffmpeg decode of every music and SFX file gave 0 errors. The new cue measures -15.9 LUFS, -1.4 dBTP and LRA 7.8 by ebur128; it is 63.0 s long at 44.1 kHz stereo and agrees with its manifest entry. The artifact manifest has decodeChecked=true, audioUnverified=0 and problems=[].

MEASURED, NOT HEARD. The shipped Chapter VII scene cue is phase-coherent: L/R correlation 0.74, side 8.2 dB under the mid, mono-sum loss -0.6 dB. So the R1 repair for 'hollow' did land in the file. However, 15 of the 26 shipped cues, including the chapter's own battle cue boss-seymour-macalania (0.24) and title, pause, chapter-select, scene-gagazet and boss-yunalesca, sit at correlation 0.04 to 0.16 with mono-sum loss of 2.4 to 2.9 dB. That is the signature docs/audio/remaster-2026-09-29 tied to 'hollow'. Whether to remaster the whole pack is Bailey's open decision, so this is a question for him, not a defect (critic/rounds/round-16/cap/audio-r16-stereo.json).

ROUTING: PASS on the runtime evidence. The capture owner took AudioManager samples in 24 real-input runs. Every sampled scene, battle, seam and results cue matches the chapter cue map in chapters I to XVI, and the source was 'prerendered' in every sample: no synth fallback, the sprite decoded, 0 console errors and 0 missing files. The NEWLY UNLOCKED Chapter VII (desktop 1600x900, phone 390x844 touch, and the loss at 2000x1012) played scene-macalania-temple under the pre-scene, boss-seymour-macalania in battle with Anima summoned, victory-ffx on both wins and silence on the loss results. The loss silence is by design: the cue map has no defeat cue.

The silences in the samples are authored:
- Chapter I's Prominence opening is wind only (seymour-flux.ts:69).
- Chapter III has 3 s of silence at the jecht-falls seam (braskas-final-aeon.ts:251), then boss-yu-yevon.
- Chapter IV's results are silent (encounters.ts:234, writing-bible §5.4).
- Chapter V goes silent at seam-5 +3 s, then plays boss-shuyin.

PR-0226 (the pause cue stealing the battle theme) is fixed at runtime. All 30 fight ends in round 16 fade out the battle cue after an Esc pause in battle, against 3 of 52 in round 15.

PR-0203 / D-210 is delivered. A fresh profile runs with sfx 0.35. The save matrix proved these AudioManager volumes after an upgrade and a reload:
- a save with its own level keeps it (0.65);
- a save with settings but no finite sfxVolume gets 0.9 (missing, null or string);
- a save that stored 0 keeps 0;
- a save with no settings object gets 0.35, as does a fresh profile and a truncated save.

CHK-023 whistles: the Chapter XVI whistles and the Chapter V coda Whistle each fire the whistle-answer SFX 13 to 16 ms after the real key, and Keep walking fires none.

OPEN:
- PR-0220 (pad-only unlock) has no runtime proof. The pad run was 'gamepad shim + keyboard', and a JS shim cannot grant Chromium user activation.
- 9 of 16 chapters still borrow stand-in cues (PR-0099). This improved from 9 of 15, because Chapter VII now has its own cues.
- 3 cues still depart from the bible (PR-0039).
- themes-audit cannot check the new cue (R16-AUD-01).

I started no servers and opened no browser. dist-gate already existed, and no port was bound by me, so there was nothing to close.

### interface (8.2)

[CHIEF RECONCILIATION: auditor 7.9 -> 8.2] The interface auditor held the score at +0.1 over round 15 for two stated reasons: the new R16-IF-01 major, and "the phone flow still loses a third of advised moves in Ch VII". The confirmer refuted the second (a vertical drag reaches every advised row; the 31 misses are the tap-only harness; PR-0218 stays a discoverability polish) and showed that a real coordinate touch on Yuna in Ch XII reaches Yuna (PR-0232 resolved; the auditor had it UNVERIFIED). The gap pass verified PR-0233 at 1600x900, 2000x1012 and 2560x1080 (no plate/name intersection). Against that, the gap pass found a new polish: at 390 px the active pause tab is off-screen and its labels are 12-13 px (PR-0251). R16-IF-01 (PR-0245) still stands. Net +0.3, not more, because a legal-and-useful-advice major landed in the newly reachable chapter and CHK-003/004/008/009 still fail. AUDITOR TEXT FOLLOWS. Deep review round 16 of the production candidate main 49005f73 (dist-gate from D:/pyrefly-rel28). I judged only the capture owner's evidence at critic/rounds/round-16/evidence: index.json, runs-summary.json, each run's run.json and turn-log.json, and the screenshots. Captures were headless Playwright with PYREFLY_BROWSER=gpu at 1600x900, 2000x1012, 390x844 touch, 2560x1080 and 1280x960. There are no 1440p or 4K captures. I opened no browser and started no server.

GAINS SINCE ROUND 15 (7.8):
- PR-0219 is fixed. FFX-2 Ch IV was won by the gamepad shim with 199 pad presses. The only keyboard fallbacks were N, E and G, which have no pad button. Round 15 got 0 party actions. The prompts switch to pad glyphs (TRIANGLE, SQUARE, R2 in ffx2-bahamut-win-pad/12-intent-E.png).
- PR-0238 is fixed. The PAUSE chip is now a styled ink chip in every capture, where round 15 showed a grey system button.
- PR-0236 is fixed. In Ch VIII the Orders widget was used 5 times with no dead end. The disabled reason 'Already near' and the 'THIS ORDER COSTS' panel are legible (evrae-airship-lose/26-orders-widget.png).
- Target cancel leaves 0 targets in all 16 chapters.
- Pause works in every run: Esc and P open and close it, Esc resumes, and H hides and restores all 12 panels.
- Advisor type measures 14.2 effective px on desktop and 15 px on the phone, with no coach/advisor overlap except one case at 2560x1080.
- Intent stays honest: SCRIPTED, 'RANDOM TARGET' and 'Lands on one of these, picked when it acts'.
- Multi-target selection shows brackets on all three, an ALL ALLIES chip and a TARGET plate naming everyone, in both games.

WHAT HOLDS THE SCORE DOWN:
- R16-IF-01 (major, new chapter): the Ch VII advisor/TIP recommends 'Phoenix Down -> Guado Guardian A' after that Guardian is KO'd, on 16 turns in a row.
- PR-0218 recurs in Ch VII on the phone. 30 of 106 advised moves (Petrify Grenade, Poison Fang, Shell, NulTide) sit below row 6 of the phone grid and were unreachable by the scripted touch player.
- R16-IF-03: the phone confirm button clips to 'TTACK -> GUADO GUARDIAN'.
- R16-IF-05: at 2560x1080 the coach line covers the selected command row.
- R16-IF-06: in FFX-2 the intent card sits over Rikku's and Paine's heads during targeting.
- R16-IF-04: the phone results location caption is clipped (pre-existing).

UNVERIFIED on this candidate: PR-0232, PR-0233 and FOC28-P02 were not captured in their acceptance state.

WHY NOT HIGHER: +0.1, not more, because a new major landed in the newly reachable chapter and the phone flow still loses a third of advised moves in Ch VII.

### onboarding (7.5)

PRESENT AND WORKING (real input, this candidate):
- Auron's briefing now says 'Sixteen fights'. It is honest about FFX CTB and FFX-2 ATB, skippable, time-limited, and has 'D never show this again' (run.json briefingText).
- The first-time coach line 'He moves after you. Not before. Use it.' is dismissed with Enter.
- The G, N and E toggles work in all runs.
- Pause has OPTIONS, CONTROLS and MUSIC tabs, with master, music and SFX volume, text speed, strategy guide and battle help. SFX now defaults to 35 under music 70 (D-210).
- The save matrix passes all 10 cases: sfxOk and reloadOk true, 0 diffs (logs/save-matrix.log).
- Pad prompts switch to pad glyph names in FFX-2.
- A gamepad-only player can now drive the FFX-2 menu (PR-0219).
- The FFX-2 X-2 BATTLE option was flipped by real input (ffx2-bahamut-lose/15-options-active.png).
- Prep shows the objectives, a sourced TIP and a control legend, and prep Esc returns to the board.
- Targets carry text labels, brackets and ALL ALLIES chips, so the cues do not rely on colour alone.

STILL MISSING (PR-0032, carried major): there is no in-game text size, key or button remapping, or reduce-motion, low-effects or flash setting. The OPTIONS list is unchanged in 14-pause-options.png at 1600x900 and 390x844.

OTHER GAPS:
- On the phone the settings column scrolls with no visible affordance: STRATEGY GUIDE and BATTLE HELP sit under a 10 px fade. This is intentional (PR-0098) but hard to discover.
- The CONTROLS tab content was not captured again.
- The OS reduce-motion evidence is reused from round 15 (see reused).

NEWCOMER: the walkthrough was SIMULATED (a scripted harness using visible prompts and ordinary keys, taps and pad), not a real newcomer.

WHY +0.1: the pad-only device path now works end to end in FFX-2, and the SFX default no longer buries music. The accessibility-settings gap is unchanged.

### prep (8.9)

Candidate main 49005f73 (dist-gate bundle index-C73AJ1Ds.js, artifactHash 091f4206...b526, 913 files). The capture owner used headless Chromium from node with PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti). I opened no browser and started no server. I worked from critic/rounds/round-16/evidence (index.json with 839 captures, runs-summary.json with 23 runs, save-matrix/, perf/, logs/) and one vitest run on D:/pyrefly-rel28: 25 files and 259 tests passed (critic/rounds/round-16/prep-delivery/vitest-prep-delivery.txt).

PREP AGENCY: all 16 chapters reached party prep by real keys. Esc from prep returns to the board in every run (prepEscGoesTo=chapter-select). The board cursor now comes back on the chapter that was entered in every run (cardAfterBack = that chapter). Round 12 reported that PR-0109 snapped the cursor back to Chapter I; that no longer happens. Chapter VII (new) prep has CHAPTER / STATS / SPHERE GRID / EQUIPMENT / ITEMS / OVERDRIVE tabs, a 7-member roster, three objectives and a TIP ('Steal from each Guardian once ... Hi-Potion Seymour gets below 4,800 HP'). The TIP matches research/ffx-seymour-anima-macalania.md section 2.4 (seymour-anima-macalania-win/run.json prepText). FFX-2 runs exercised a dressphere change (change=1).

RESULTS AND REWARDS: Chapter VII victory shows AP 6,330 and GIL 8,600 (31-results.png). Both are exact sums of the sourced values with Anima overkilled: 2,000 + 290 + 290 + 3,750 AP and 5,000 + 300 + 300 + 3,000 gil (research sections 1.x, 2.1, 3.1). A member who took no turn now reads 'no full turn taken · no AP' (Natus Kimahri, Omnis Tidus), so PR-0241 is RESOLVED. Defeat screens show TURNS, ATTEMPTS and BEST.

RETRY: every loss route reached a new battle through prep: Flux x2, Evrae, Bahamut, Anima, Den, Trema x3, Omnis-phone x2. The time from fight end to the next battle was 7.1 to 7.5 s, including harness waits. flow-checkpoint-retry.test.ts (21 tests) covers RETRY for all 16 chapters plus the Chapter XI checkpoint.

PROGRESS: every win's clear survives a real reload (boardAfterReload). The upgrade matrix preserved clears, best-time ribbons, attempts, flags, unlocked and seenCoach with 0 carryDiffs (see delivery and CHK-024).

DEDUCTIONS: R16-PREP-01 (polish, new, FFX-wide): the victory spoils ignore the sourced x2-on-overkill drop quantity, so Chapter VII shows Ability Sphere x3 where the sources give 4. Long retry loops in Trema (a 24-minute win) and Seymour Flux (wins only on a drawn seed) are encounter matters; cross-reference only.

Gain over round 15 (8.6): two prep and results defects closed (PR-0241, and PR-0224's empty Trema wedge), the new chapter's prep-to-reward-to-retry loop proven by real keys, and the save-class upgrade proven.

### delivery (8.6)

Production candidate 49005f73 built into dist-gate (bundle index-C73AJ1Ds.js, artifactHash 091f420632fe...c474b526, 913 files, 485,052,557 bytes, decodeChecked=true, problems=[], audioUnverified=0; evidence/artifact-manifest-dist-gate.json). Against live 6ea8528f the file-level diff is exactly the expected set: new bundle, css and worker; the new audio/music/scene-macalania-temple.mp3; the ch4 pause plate (D-257) with its sidecars; two provisional-backdrop sidecars; audio/manifest.json; index.html. .nojekyll is absent only because deploy-pages.mjs:527 writes it at deploy.

FLOWS (CHK-022): all 16 chapters reached an outcome by real input in 23 runs, with 0 console errors, 0 responses >=400 and 0 images served as text/html (runs-summary.json, network-and-console-summary.json). In round 15 there were 18 resource 404s on 5 URLs. Every chapter was won by real input:
- Chapter I only on a drawn seed.
- Chapter XIII on a drawn seed, after a loss and retry.
- Chapter IV by the gamepad shim.
- Chapters VII and XVI also by touch at 390x844.
Every win reached results, its aftermath lines (dboxTimeline after the fight) and the board. The round-15 CHK-022 debt is closed: Chapter III won with the FFX ending aftermath (18 lines), Chapter XII won with its aftermath, Chapter XIII won with its aftermath, and the Chapter VIII loss reached RETRY. The seven '30-post-scene' UNVERIFIED captures are a harness timing expectation (results come before the confirm-scene), labelled honestly; they are not product failures.

SAVE (CHK-024, save-data class): the full upgrade matrix PASSES by real keys plus a reload:
- the release-28 artifact (bundle DecUADzw) wrote the hand-made save;
- own sfx 0.65 is kept;
- settings present but sfx missing, null or 'loud' become 0.9;
- sfx 0 is kept;
- no settings object, a fresh profile and truncated storage get 0.35;
- the release-20 and release-25 fixtures carry their volumes;
- progress carries over with 0 carryDiffs;
- pause OPTIONS reads SOUND EFFECTS 65;
- mixer volumes match.
SaveData.ts diff 6ea8528f..49005f73 is the two D-210 lines only.

LOAD AND FRAME TIME, named conditions: headless Chromium, cold profile and cache, localhost vite preview, RTX 5070 Ti, 12 of 16 threads, ComfyUI rendering in the background. Title-ready arrives at 0.26 s (unthrottled), 0.50 s (50 Mbit/s) and 1.37 s (10 Mbit/s). The first-battle loading card showed 0 s unthrottled and 0.8 s at 50 Mbit/s, but 18.8 s at 10 Mbit/s, with the first command menu 30.9 s after choosing the card (PR-0240 residual). Idle and fight frame times were 60 fps with p95 16.7 to 16.8 ms. One 183 ms frame appeared in the FFX-2 Bahamut fight (R16-DEL-01).

DEDUCTIONS:
- PR-0240 residual at 10 Mbit/s.
- 94 to 184 MB cold transfer per chapter entry.
- The 183 ms spike.
- The FF7 fixes (PR-0222/0223) were not captured.

UNVERIFIED and never passed: Firefox, Safari/WebKit and Edge; a real phone; a real controller (shim only); 4:3, 1440p and 4K frame times; phone frame times; the live URL (candidate not deployed). I started no server; at the end no listener exists on ports 5400 to 5990.

Up from 8.2 for 404s cleared, load measured and mostly met, and the save matrix complete.

## Approved-target gate

Required 79, matched 61, failing 0, unverified 18, waiting 5. visual auditor's tally 58 matched / 21 unverified, moved to 61 / 18 by the gap pass (Seymour Ch VII portrait, hero plates ch1 and ch4). Anima's arrival stays unverified.

Newly matched since round 15:

- cast/Speaker portrait: Braska (Ch II pre-scene, portrait painted)
- cast/Speaker portrait: Nooj (Ch V pre-scene, portrait painted)
- cast/Speaker portrait: Rikku (FFX-2) (Ch IV, VI, VII, XVI pre-scenes, portrait painted)
- cast/Speaker portrait: Paine (Ch XV post-scene and Ch XIII after-confirm)
- cast/Speaker portrait: Yuna (FFX-2) (Ch XVI after-confirm, desktop and phone)
- pause/Pause remade on the Until Dawn character screen (close-up painted in 20 of 20 first-Esc, 15 of 15 tab-next, and on the phone)
- pause/Pause faces (Rikku FFX-2 face clear of both columns)
- polish/Chapter select v2 (plate and every card strip painted, desktop and 390x844)
- fight/Targeting: a spell on the whole party (Ch VII NulBlaze: TARGET plate names the three, brackets on each member, ALL ALLIES tag)
- chapters/Seymour and Anima, Macalania Temple (new: backdrop A, Seymour B arms crossed, Guardian A face and ears, at 1600, 2000 and 390)
- cast/Speaker portrait: Seymour, Chapter VII (gap pass: Seymour / MAESTER / "Guardians. You are early." with seymour-macalania.png, compared with card-A: face, light-blue hair, red collar)
- pause/Hero plate, chapter 1 (gap pass: CHAPTER tab full-bleed, pause/ch1-seymour-flux.2x.webp, root rect = viewport at 1600x900 and 2000x1012; chief viewed the frame)
- pause/Hero plate, chapter 4 (D-257: file pixel-identical to the tile; gap pass: CHAPTER tab full-bleed at 1600x900 and 2000x1012; chief viewed the frame)

Unverified:

- presentation/Swordplay Overdrive (no picker frame captured)
- cast/Shiva (no frame)
- cast/Speaker portrait: Shuyin (no Shuyin line on screen in any verified frame)
- cast/Speaker portrait: Young Auron
- cast/Speaker portrait: Fayth boy
- cast/Speaker portrait: Brother (FFX-2)
- cast/Yojimbo attack c45
- cast/Yojimbo hurt c35
- cast/Trema hurt c7
- cast/Logos hurt c2
- cast/Leblanc hurt c10
- cast/Ormi hurt c7
- cast/Syndicate goon hurt c4
- pause/All hero plates (only the Ch XIV CHAPTER tab captured; it paints its own plate)
- fight/Spell and skill effects B (no element-spell frame identified)
- phone/PR-0201 phone Ch XI (no Ch XI phone run)
- chapters/Anima's arrival, Macalania Temple (gap pass at 1600x900: camera drop, chains, one continuous rise, Seymour greyed with CANNOT BE TARGETED, Anima's gold tag all seen; the violet under-ice light is not evident and the Guardians' deaths were not exercised on seed 1, so the tile is not yet matched; 390x844 clipping filed as PR-0247)
- chapters/Yojimbo's hero plate (CHAPTER tab not captured)

Decision pictures (not counted): dec-macalania-layout-b (1600 and 390): matched: the build stands exactly on the picked layout B frames; dec-ixion-look-b: matched; dec-ixion-chamber-c2: matched; dec-line-card-a: unverified (Ch XIV 11-advisor frame shows the turn cut-in, no line card)

Approved art: approved 244/244 and judge-locked 48/48 byte-identical in the candidate manifest (hashcheck-candidate.json); the manifest matches dist-gate byte for byte (913/913 files recomputed); verify-approved in D:/pyrefly-rel28: 244 ok / 48 ok, 0 mismatched, 0 missing; manifest problems [], decodeChecked true

## Checks

| Check | Mandatory | Result | State |
|---|---|---|---|
| CHK-001 | yes | FAIL | all shipped audio of candidate 49005f73 (dist-gate), both games |
| CHK-002 | yes | UNVERIFIED | FFX Ch VII / FFX-2 Ch IV and XVI pause |
| CHK-003 | yes | FAIL | all chapters, first menu; Ch VII phone targeting |
| CHK-004 | yes | FAIL | FFX Ch VII, 390x844 touch, seed 1, turns 32-50 |
| CHK-005 | yes | UNVERIFIED | advisor on constructed broken boards |
| CHK-006 | yes | PASS | all 16 chapters |
| CHK-007 | yes | PASS | all runs |
| CHK-008 | yes | FAIL | battle HUD panels against painted actors, both games |
| CHK-009 | yes | FAIL | Ch VII / Ch XVI phone; Ch VII desktop |
| CHK-010 | yes | PASS | FFX Ch VII, FFX-2 Ch IV |
| CHK-011 | no | PASS | all chapters' first menu, target step and mid-fight |
| CHK-012 | yes | FAIL | Ch XIII FFX-2 Trema, 23-midfight; all pre-scenes and pauses |
| CHK-013 | no | PASS | all 16 chapters: pre-scene, first menu, mid-fight, pause, results, board |
| CHK-014 | no | PASS | all chapters' battle frames |
| CHK-015 | yes | PASS | all 16 chapters; Ch XII and VII phone targeting |
| CHK-016 | yes | PASS | evidence index |
| CHK-017 | yes | NOT APPLICABLE | candidate on local preview |
| CHK-018 | yes | PASS | src/ of the candidate; every run's network log |
| CHK-019 | yes | PASS | all 913 shipped files |
| CHK-020 | yes | PASS | FFX Ch VII vs FFX-2 Ch IV/XVI |
| CHK-021 | yes | PASS | aeon rows and Ch VII (FFX only), FFX-2 absence, Farplane plate (FFX-2 only), cues by game |
| CHK-022 | yes | PASS | all 16 chapters, win and loss |
| CHK-023 | yes | PASS | engine replay, Ch V coda, Ch XVI whistles, audio routing in 16 chapters |
| CHK-023 | yes | UNVERIFIED | PR-0220 pad-only audio unlock at the title |
| CHK-024 | yes | PASS | release-28-written save and release-20/25 fixtures upgraded to the candidate; fresh, truncated, no-settings, missing/null/string/zero sfx cases |
| CHK-025 | yes | PASS | FF7 hidden experiment and board, candidate source; automated only |
| CHK-B1 | yes | UNVERIFIED | owner listening verdict |
| CHK-B2 | no | UNVERIFIED | owner feel verdict |
| CHK-B3 | no | UNVERIFIED | owner story read |

- **CHK-001 FAIL.** TECHNICAL HALF: PASS. qa --strict gives exit 0 and 0 findings on dist-gate/audio: 26 cues at -15.97 to -16.20 LUFS and -1.06 to -2.86 dBTP, 0 clips, every seam ok. The sprite peaks at -1.13 dBTP. All files decode with 0 ffmpeg errors. The only audio changes against live are the manifest and the new scene-macalania-temple.mp3 (-15.9 LUFS, -1.4 dBTP). Routing matches the cue map in 16/16 chapters with no synth fallback.

SIGN-OFF HALF: not met. The owner's latest ear verdict on the shipped mix is negative and has no number (PR-0148). The new Chapter VII scene cue ships on the driver's pick under D-278, which Bailey delegated; that is a legitimate decision to ship, but it is not an ear sign-off on R1.

themes-audit: 16/16 chapters match the chapter cue map. 4/26 cues are flagged: 3 carried (PR-0039), plus the new cue, which the tool cannot check (R16-AUD-01).
- **CHK-002 UNVERIFIED.** Full-bleed pause plates with no bars appear by eye at 1600x900 (seymour-anima-macalania-win/14-pause-options.png), 390x844 and 2000x1012. Not available this round: the getBoundingClientRect==viewport measurement, the currentSrc tier, and any 1440p or 4K capture, which a deep review rotates in. The gap pass measured the pause root rect equal to the viewport in Ch I and Ch IV at 1600x900 and 2000x1012 only; the six-viewport sweep (1440p and 4K included) is still not run.
- **CHK-003 FAIL.** The advisor measures 14.2 effective px on desktop and 15 px on the phone, with 0 clipped rows in all 48 measured states. It FAILS on the phone target-confirm button, which clips to 'TTACK -> GUADO GUARDIAN' in Ch VII (R16-IF-03), and on the phone results side caption (R16-IF-04). No whole-screen legibility walk was run. Gap pass: at 390x844 the pause tab labels are 13 px and the breadcrumb 12 px (PR-0251).
- **CHK-004 FAIL.** The advisor card named Phoenix Down on the KO'd Guado Guardian A for 16 consecutive decisions in Ch VII (PR-0245). The row-window half is refuted: rows below the sixth are reachable by a drag (PR-0218 is a discoverability polish). Desktop cards name owned rows with menu path and cost.
- **CHK-005 UNVERIFIED.** No constructed broken-board matrix was captured this round. Round 15's PASS cannot be reused: r29-text changed advisor copy and the guide rail (PR-0234/0239). The only degenerate board observed (one enemy of two KO'd, Ch VII) produced the wrong recommendation; that is scored under CHK-004.
- **CHK-006 PASS.** Target cancel leaves 0 targets and the menu restored in all runs (afterTargetCancel.targets 0). Pause H hides all panels (0 visible) and brings back 12. No stale title roots appear. Only the cancel exit was measured; the turn-passing and battle-end exits were covered only implicitly by the continued runs.
- **CHK-007 PASS.** None of the captured briefing, prep, board, pause, advisor or intent text carries a section sign, file stem, raw id, TODO or placeholder copy. The only 'placeholder' hits are a JSON field name in run.json.
- **CHK-008 FAIL.** Polish level only. FAILS at polish level in three places. (a) At 2560x1080 the coach line overlaps the command stack by 3598 px2 over the selected TALK row (R16-IF-05). (b) In FFX-2 Ch IV at 1600x900, the intent card sits over Rikku's and Paine's heads while Shell is targeting (R16-IF-06). (c) In Ch VII at 1600x900 with E open, the intent card covers the end of the guide rail's 'Guado Guardian A'. Visual: Polish only. In Ch VII, after a target cancel, the Sensor card lies over Guardian B's staff and torso at 1600x900 and 2000x1012; his face stays clear. No other panel-over-face finding in the captured states. The only overlaps permitted are the declared ones: the command stack over the party's lower third, and the party panel over Guardian B's feet, which the layout B sheet disclosed.
- **CHK-009 FAIL.** Names are clipped in three places: the phone confirm label (Ch VII), the phone results location caption ('MACALANIA TEMPL', 'CHAMBER OF THE I'), and the guide rail name under the intent card.  PR-0233 itself now PASSES: the gap pass opened the Mortiorchis plate at 1600x900, 2000x1012 and 2560x1080 with zero name intersections.
- **CHK-010 PASS.** Single target shows brackets, a name plate, the TARGET chip, a Sensor plate and a dimmed party (Ch VII 1600x900 and 390x844). All allies shows brackets on all three, the ALL ALLIES chip and a TARGET plate listing every name (FFX Ch VII NulBlaze; FFX-2 Ch IV Shell 'All allies'). The phone names its target on the confirm button.
- **CHK-011 PASS.** Every targetable enemy can be identified in its default framing: both Yu Pagodas in Ch III, all Vegnagun parts through the links, the Leblanc goons, and in Ch VII both Guardians and Seymour. While a target is chosen in Ch VII the party occluders fade. Anima's form was not captured. Gap pass: Anima's arrival is now captured; she is identifiable with a gold tag at 1600x900 (clipped for about 1 s at 390x844, PR-0247).
- **CHK-012 FAIL.** The painted portrait layers are present in every chip, speaker frame and pause close-up captured. The fallback-as-final-face rule still fails for the Songstress dressphere, which renders as a grey placeholder mannequin (PR-0228, carried, not a regression). Confirmer: no rikku-songstress or paine-songstress art ships.
- **CHK-013 PASS.** Approved art judged in the running game at 1600x900, 2000x1012, 2560x1080 and 390x844, beside its tile. Nothing approved was re-judged on taste.
- **CHK-014 PASS.** Party and bosses face across the field in all 16 chapters. Ch VII stands on layout B exactly as picked. Pause portraits are viewer-facing by design. The capture owner's 'formations overlap' major was refuted by the confirmer: the at-rest frame matches the layout-B sheet adopted under D-189 figure for figure.
- **CHK-015 PASS.** Real input on the production candidate, positive and cancel paths: keyboard in all 16 chapters (Esc, P, H, G, N, E, hold-skip, prep Esc, target cancel, RETRY); the FFX-2 command menu driven by the gamepad shim to a win (PR-0219 fixed, 199 pad presses); touch wins in Ch VII and XVI at 390x844. The two touch failures the capture owner filed were refuted by the confirmer: a real coordinate touch at Yuna's reticle centre in Ch XII selects Yuna (battle log targets ['yuna']), so PR-0232 is fixed for a player; and a vertical drag reaches the advised rows below the sixth (PR-0218 stays a discoverability polish). Limits, stated rather than passed: the pad is a JS shim (a real controller is not evidence here; PR-0220 is recorded under CHK-023), the phone is emulation, and no Firefox or Safari run exists.
- **CHK-016 PASS.** index.json has 839 entries plus the gap-pass entries; 0 mismatches between asserted and stale-root screen; the 7 frames the harness marked verified=false (30-post-scene landing on results) were excluded by every auditor and the tiles that relied on them stay UNVERIFIED.
- **CHK-017 NOT APPLICABLE.** The candidate is not deployed, so the exact live artifact cannot be verified; the deployment verdict is NOT APPLICABLE. Owed after the deploy: node tools/artifact-manifest.mjs verify-live against critic/artifacts/49005f73.json plus the live save-reload smoke. Measured on the candidate, for the record (not a pass of this check): title-ready 0.26 s unthrottled, 0.50 s at 50 Mbit/s, 1.37 s at 10 Mbit/s; first-battle loading card 0 s, 0.8 s and 18.8 s (PR-0240); 60 fps with p95 16.7-16.8 ms and one 183 ms frame (PR-0259); headless rAF is capped at 60 fps.
- **CHK-018 PASS.** No shipped path sits on a promotable variant. No run requested a missing file, including the new scene-macalania-temple cue and Chapter VII's art. PR-0224's missing Trema hurt/ko requests are gone.
- **CHK-019 PASS.** All 913 shipped files decode, and the manifest reports no problems. The new MP3 and the changed ch4 pause plate (PNG and 2x WebP) are included. Visual: The candidate manifest reports decodeChecked true and problems []. I recomputed 913/913 hashes against dist-gate and all matched. Audio: The artifact manifest has decodeChecked=true, audioUnverified=0 and problems=[]. An independent ffmpeg full decode of every dist-gate music and SFX MP3 gave 0 errors. The new cue is 63.0 s, 44.1 kHz stereo, 130 kbps and byte-identical to public/. 0 notFound across 24 capture runs. Every audio request was answered, 24 distinct music cues plus the sprite.
- **CHK-020 PASS.** Paired surfaces exist in both games: advisor, intent, guide rail, the pause tabs (party/CHAPTER/GUIDE/OPTIONS/CONTROLS/MUSIC), results, coach and targeting. Written exceptions: the FFX-2 X-2 BATTLE row and ATB chip. The FFX-2 pad gap (PR-0219) is closed. PR-0237's phone coach placement is left alike in both games.
- **CHK-021 PASS.** Combat: Selected by critic-plan: FFX game data changed and a new FFX chapter was unlocked. Narrative: Narrative scope. The Farplane voice plate is FFX-2 only: Braska, Auron and Jecht read 'Farplane' in Ch V, while FFX Ch II still gives Braska 'High Summoner' and Jecht 'Final Aeon' (dboxTimeline). Ch VII names no FFX-2 speaker and uses FFX roles ('Guardian', 'Summoner', 'Maester'). Audio: FFX chapters (I, II, III, VII, VIII, IX, X, XII, XIV) play only FFX cues (victory-ffx, ending-ffx). FFX-2 chapters (IV, V, VI, XI, XIII, XV, XVI) play only FFX-2 cues (victory-ffx2, ending-ffx2), and Chapter IV's results are silent by design. The new scene-macalania-temple is FFX only (D-278) and is heard only in Chapter VII. The pad unlock and the SFX default are shared plumbing, true to both games.
- **CHK-022 PASS.** Every chapter reached its real destination: results, the post-battle or confirm aftermath lines, the board, and a reload that keeps the clear. Every recorded loss reached RETRY, then prep, then a new battle. Pre-scene Esc opened pause and a hold skipped the scene in all 23 runs. Round 15's owed items (Chapter III, XII and XIII wins with aftermath; the Chapter VIII loss and RETRY) are closed. Caveats: Chapters I and XIII were won only on drawn seeds (an encounter matter, and not a regression per the capture owner). Loss routes by real input exist for 7 of 16 chapters; the other 9 retry through the same shared flow, covered by flow-checkpoint-retry.test.ts for all 16. Feel and narrative facet. Every chapter the plan lists reaches its outcome, the post-battle scene or aftermath, the results, and return to the board with the clear surviving a reload, by real input: I (drawn seed 493744557), II, III (208 commands, 6 seams, the FFX ending aftermath), IV (pad), V, VI, VII (desktop and 390x844 touch), VIII, IX, X, XI, XII (2000x1012), XIII (drawn seed after a defeat), XIV, XV (seed 1001), XVI (desktop and touch). Defeat, results and RETRY back to prep and into the fight: I, IV, VII, VIII (Orders widget used 5 times), XII touch, XIII, XV. The four 30-post-scene fails ('wanted cutscene got results') are harness expectations: Ch VII's post script runs results() first by design. Whether the aftermaths land emotionally is judged in the narrative category, not proven by this check. Gap pass: three further Ch VII real-input wins (keyboard x2, touch) from the title through the aftermath, 0 console errors, 0 404s.
- **CHK-023 PASS.** Engine: Selected by critic-plan. The changed aeon rows, the Grand Summon picker, and Chapter VII's summon, Nul, Steal and Petrify traced from real input through the engine. Scenes: Ch XVI's whistles and Ch V's coda through the real presentation path. The fight was injected (labelled) and every choice was played by real keys. XVI: four '(Whistle)' picks. Each starts the whistle-answer cue 2 to 16 ms after the pick and advances to its own line ('A small gold light answers.' ... 'It runs ahead, over a bridge of light.'), then the scene ends in the Bevelle Underground narration. V: Whistle then Yes reaches the fayth's 'Okay.' and the ending narration. Whistle then No reaches Yuna's 'He's already with me.' Keep walking goes straight to the narration. Caveat: the gold light is described in text but not seen in any still (R16-FN-05). Audio routing: 24 runs. At every sampled moment the cue matches THEMES.md's chapter cue map, and every source is 'prerendered'. There were 30 fight ends after an Esc pause in battle. All 30 fade out the battle cue, never 'pause' (round 15: 3 of 52 were stuck on 'pause', PR-0226), so PR-0226 is fixed at runtime. The new Chapter VII plays the right cues on desktop, phone and the loss route. The silences in the samples are authored: Chapter I's opening, Chapter III's jecht-falls seam, Chapter IV's results, Chapter V's seam-5 and every defeat's results. Chapter XVI's whistles and Chapter V's coda Whistle each fire whistle-answer 13 to 16 ms after the real Enter, and Keep walking fires none (the fight before the coda was injected and labelled; the coda input was real). 455 audio, pause-music and save-sfx unit tests pass in D:/pyrefly-rel28. Gap pass: pause over the Ch VII pre-scene returns scene-macalania-temple and the Ch I pre-scene silence is restored; Esc within 3 ms of the first menu and a quick Esc-Esc keep the battle theme.
- **CHK-023 UNVERIFIED.** padUnlock.ts is built and tests/unit/audio-pad-unlock.test.ts passes. However, the only pad run (ffx2-bahamut-win-pad) is labelled 'gamepad shim + keyboard', and title.mp3 was fetched before any pad input. A JS shim over navigator.getGamepads does not make Chromium grant user activation, and the fix depends on exactly that activation. So no run proves a pad-only player hears music. RUBRIC §5: emulation is not proof of a real controller.
- **CHK-024 PASS.** SAVE-DATA CLASS, proved by running. Every case wanted by the task is proven by running the code. A save the release-28 build itself wrote keeps its own sfx (0.65), and the upgrade carries its progress, clears, best times, attempts, flags, unlocked and seenCoach byte-for-byte (carryDiffs []). Settings without a finite sfxVolume (missing, null or string) get 0.9; an explicit 0 stays 0. No settings object, a fresh profile and truncated storage get 0.35. The release-20 and release-25 fixtures keep 0.65 and 0.9. All values survive a reload, and the applied mixer volumes equal the stored settings. Harmless observation: a migrated 0.9 is not written back to storage until the next save, but migrate() re-derives it on every load. The reset/confirmation part is NOT APPLICABLE: SaveStore.reset() has no caller in src, so there is no player reset flow. tests/e2e/save-upgrade.spec.ts itself was not run this round; the in-browser matrix covers the same fixtures and more. Observation, not a defect: a save without a stored sfxVolume is not written back, so migrate() re-derives 0.9 on each boot until the player changes a setting. Chief final validation: the SaveData.ts diff 6ea8528f..49005f73 is exactly the two D-210 lines (defaultSettings sfxVolume 0.35; migrate() gives 0.9 when raw.settings exists without a finite sfxVolume); the save-matrix JSON re-read shows all 10 cases sfxOk and reloadOk with no errors and carryDiffs [] where computed; and tests/e2e/save-upgrade.spec.ts run by the chief against dist-gate (vite preview 127.0.0.1:5741, PYREFLY_BROWSER=gpu, headless) passed 2/2 (release-20 save: clears, ribbons, best times, volumes, text speed and ATB mode; truncated save boots fresh with no error).
- **CHK-025 PASS.** The check's automation passes on the candidate. The board lists 16 tiles now that Chapter VII is unlocked, with no FF7 card. The in-browser FF7 door and pause were not captured this round (0 of 839 captures), and r29-load changed the door's hold behaviour. So the verification of PR-0222/PR-0223 in a real browser stays UNVERIFIED; see those issues and capturesNeeded. The PASS covers the automated half (hidden board, game branches, experiment store) and the captured 16-tile board with no FF7 card; the in-browser door hold is carried as PR-0222/PR-0223.
- **CHK-B1 UNVERIFIED.** No agent can hear. OWNER-VERDICT.md has no numeric score for the shipped mix. The latest ear verdict on the mix is negative ('still sounds like snes music'). Bailey has not heard R1 of the new cue: his 'tinny and hollow' was about the unremastered sketches, and D-278 delegated the pick. Approving a direction or delegating a pick is not a cue sign-off.
- **CHK-B2 UNVERIFIED.** There is no input-latency probe, no video clip, and no feel verdict from Bailey on a build that adds a chapter and changes load order and transitions. (The gap pass measured keydown-to-highlight 3-17 ms and confirm-to-action 15 ms; a measurement is not the owner's feel verdict.)
- **CHK-B3 UNVERIFIED.** Bailey's story read is not recorded for Chapter VII or for the newly reached Ch III, XII and XIII aftermaths.

Audit checks (not in the library): A16-DATA-AEON-ROWS PASS; A16-DATA-CH7-SAMPLE PASS; A16-BENCH-FFX PASS; A16-BENCH-AEON23 PASS; A16-BENCH-CH7-200 PASS; A16-UNIT-COMBAT PASS; A16-BENCH-FFX2 PASS.

## Encounters

| Chapter | Real flow | Outcome |
|---|---|---|
| seymour-flux | yes | victory (drawn seed 493744557, 1600x900); defeats on seeds 1 and 1001 at 2000x1012 with RETRY back to prep |
| yunalesca | yes | victory seed 1 (1600x900), 120 real commands |
| braskas-final-aeon | yes | victory seed 1 (1600x900), 208 commands, 6 link seams, results, FFX ending aftermath, board, reload |
| ffx2-bahamut | yes | victory seed 1 by the gamepad shim (1600x900, 199 pad presses); defeat + RETRY at 2000x1012 |
| ffx2-vegnagun-shuyin | yes | victory seed 1 (1600x900), 4 chain seams, aftermath, board, reload |
| ffx2-leblanc | yes | victory seed 1 (2000x1012) |
| seymour-anima-macalania | yes | victory seed 1 at 1600x900 (52 commands) and at 390x844 touch (106 commands); defeat + RETRY at 2000x1012 |
| evrae-airship | yes | victory seed 1 (2000x1012); defeat + RETRY at 1600x900 using the Orders widget 5 times |
| yojimbo-cavern | yes | victory seed 1 (1600x900) |
| seymour-natus | yes | victory seed 1 (2560x1080 wide) |
| ffx2-fallen-aeons | yes | victory seed 1 (1600x900), 2 seams |
| seymour-omnis | yes | victory seed 1 (2000x1012), 130 commands, aftermath, board, reload; phone 390x844 touch lost seeds 1 and 1001 with RETRY |
| ffx2-trema | yes | victory on drawn seed 662661233 (2000x1012, attempt 2, 315 commands, 24:28 fight), aftermath, board, reload; defeats on seeds 1, 1001 and 662660233 with RETRY |
| isaaru-via-purifico | yes | victory seed 1 (1280x960, 4:3) |
| ffx2-den-of-woe | yes | victory seed 1001 after a seed-1 defeat and RETRY (2000x1012) |
| ffx2-ixion-djose | yes | victory seed 1 at 1600x900 and at 390x844 touch |

## Coverage matrix

**Tested**

- SAVE-DATA CLASS (why this review is deep before deploy): 10-case upgrade matrix by real keys plus reload, with a save written by the release-28 artifact itself (own sfx 0.65 kept; settings with missing/null/string sfx -> 0.9; stored 0 kept; no settings object, fresh profile, truncated -> 0.35; release-20 and release-25 fixtures carried; 0 carry diffs); tests/e2e/save-upgrade.spec.ts 2/2 on dist-gate (chief); unit save-* 9 files / 53 tests.
- Real input on the candidate (headless Chromium, PYREFLY_BROWSER=gpu, one browser at a time): wins in all 16 chapters with results, aftermath, board and reload (Ch I and XIII on drawn seeds; Ch IV by the gamepad shim; Ch VII and XVI also by touch at 390x844); defeat, results and RETRY in I, IV, VII, VIII, XII (touch), XIII, XV; 1600x900, 2000x1012, 2560x1080, 1280x960, 390x844.
- Chapter VII end to end: 3 capture-owner runs (desktop win, touch win, loss + RETRY) and 3 gap-pass wins (keyboard x2, touch), pre-scene with its cue, Anima's arrival timed, aftermath timed, results rewards against research.
- Engine: 15 real-key logs replayed event for event; 100 aeon-row cells audited against research §6.4.3; three-line benches for every FFX chapter; Ch VII 200-seed bench; 205 files / 4,014 unit tests; FFX-2 goldens byte-identical.
- Audio: qa --strict exit 0 on dist-gate, ffmpeg decode of every file, routing in 24 runs, pause/resume races (early Esc, Esc-Esc), pre-scene pause restore, title and chapter-select cues, whistles within 16 ms.
- Targets: 75 composites and 12 contact sheets; approved 244/244 and judge-locked 48/48 byte-identical; 913/913 manifest hashes recomputed.
- Load and frame time on named conditions: cold profile at unthrottled, 50 Mbit/s and 10 Mbit/s; 60 fps, p95 <= 16.8 ms.
- Input latency (gap pass): keydown to highlight 3-17 ms; confirm to action start 15 ms in Ch VII.
- Confirmation re-runs on the candidate: Ch XII coordinate tap, Ch VII phone drag, layout B against its approved sheet, Songstress art listing, Ch VII opening card cause.

**Reused, with the reason**

- FFX-2 three-line bench, from round 15 (live 6ea8528f): src/battle, src/data/ffx2 and the FFX-2 chapter files are unchanged 6ea8528f..49005f73; tactics changes touch only text and the guide rail; FFX-2 goldens re-ran byte-identical on the candidate; no open related defect.
- Reduced-motion battle entry (onboarding), from round 15 feel-narr/seymour-flux-lose-rm (6ea8528f): no r29 branch changed the battle-entry transition or the reduced-motion path; labelled reused, not re-verified.
- Leblanc chapter and Vegnagun-parts tiles' matched reading, from round 15: re-checked on round 16 frames; only the reading of what the tile approves carries.

**Not tested**

- Firefox, Safari/WebKit and Edge; a real phone; a real controller (shim only).
- Frame times at 4:3, 1440p, 4K and on the phone with CPU throttling.
- Ch XII phone win by touch (the harness cannot yet use coordinate taps; the confirmer proved the tap works).
- Ch II and Ch IX pause CHAPTER tab (hero plate all / Yojimbo); Ch I Swordplay picker; boss hurt beats (Ch VI, IX, XIII); Ch XI at 390x844; FFX element-spell frame; Ch XIV line card; Shuyin, Young Auron, Fayth boy and Brother lines; Ch V Farplane voice treatment (PR-0161); Ch IX Zanmato; any video clip.
- Anima's arrival: the violet under-ice light and the Guardians' deaths (not reached on seed 1).
- Audio pause at a link seam (PR-0226 neighbour); pad-only audio unlock (PR-0220).
- Acceptance states of PR-0234, PR-0235, PR-0237, PR-0239, FOC28-P02, and the Ch VIII all-refused Orders state.
- Ch VII desktop board with one Guardian KO'd (R16-IF-01 on desktop; not reached in two seed-1 runs).
- Reload mid-battle and mid-pre-scene in Ch VII.

**Required and not tested**

- CHK-017 exact live artifact: NOT APPLICABLE until the deploy; owed then (verify-live against critic/artifacts/49005f73.json plus the live save-reload smoke).
- CHK-002 six-viewport full-bleed and currentSrc sweep (1440p and 4K never captured).
- CHK-005 advisor on constructed broken boards (round 15 not reusable: r29-text changed advisor copy).
- CHK-B1 owner listening verdict (agents cannot hear).
- CHK-023 pad-only audio unlock (PR-0220) with a real controller or a browser-level pad.
- CHK-025 browser half: the FF7 door hold at 25 and 10 Mbit/s cold, with Esc and arrows during the hold and the main save byte-identical (PR-0222, PR-0223).
- PR-0240 cold 10 Mbit/s first-battle entry for Ch I and VII, and at 390x844 with 4x CPU throttling.

## Issues, ranked (all open)

### 1. PR-0148 [major, audio]

**PR-0148 (carried, owner-reported, STALLED): no numeric owner verdict on the shipped mix, and the latest ear verdict is negative** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: both
- Chapter and state: all
- Expected: A numeric owner verdict on the cues this build ships (CHK-B1), and a direction the owner likes.
- Observed: docs/audio/OWNER-VERDICT.md has no number for the shipped mix. The last ear verdict on it is 'the game muisic still sounds like snes music' (2026-09-27, release 21). The music this candidate ships is unchanged apart from one new cue. New measurement, not heard: 15 of 26 shipped cues have L/R correlation 0.04 to 0.16 and mono-sum loss of 2.4 to 2.9 dB. docs/audio/remaster-2026-09-29 tied that signature to 'hollow' when Bailey heard it in the sketches. The only coherent new cue is scene-macalania-temple (0.74).
- Repro: Read docs/audio/OWNER-VERDICT.md. Run `python critic/rounds/round-16/cap/audio-r16-corr-tmp.py <cues>` against D:/pyrefly-rel28/dist-gate/audio/music.
- Evidence: docs/audio/OWNER-VERDICT.md; critic/rounds/round-16/cap/audio-r16-stereo.json
- Confidence: high (owner's words); the stereo figures are measured, and what they sound like is not established
- Confirmation: CONFIRMED by the confirmer from the record (OWNER-VERDICT.md has no number; agents cannot hear).
- Requirement: RUBRIC §6 audio (Bailey's listening assessment); CHK-B1
- Where: all shipped music, public/audio/music/*.mp3
- Smallest fix: Ask Bailey one question with the audition page: a number out of 10 for the shipped mix, and whether remaster R1 should apply to the whole pack. Build nothing on the remaster until he says yes.
- Acceptance check: OWNER-VERDICT.md records a dated numeric verdict naming the build and cues.

### 2. PR-0243 [major, feel]

**PR-0243 (new; R16-FN-01 = R16-VIS-02): Chapter VII opens on the wrong subject: the battle-start card and the intro dolly name and show Guado Guardian A instead of Seymour** introducedByCandidate=True, regressionVsLive=False, inNewFeature=True.

- Game: FFX (the fix is in shared code, so the fix case is both games; only Chapter VII shows the symptom)
- Chapter and state: VII seymour-anima-macalania, the pre-battle scene handing over to the fight
- Expected: The chapter's boss card and dolly name and show Seymour, the approved 'boss card' opening beat (research §9.1/§9.6 beat 7).
- Observed: In all three Ch VII runs (1600x900, 2000x1012, 390x844 touch), the Ink & Gold boss card shows the Guado retainer's painting and the title 'Guado / Guardian / A'. The intro dolly's letterbox caption then reads 'Guado Guardian A' ('Guado Guardian', clipped, on the phone). The other 15 chapters name their boss (Evrae, Vegnagun, Seymour ...).
- Repro: Fresh profile, seed 1: board, Chapter VII, START, hold Enter to skip the scene. Read the card at about 0 to 0.7 s and the caption at 1.9 to 2.9 s.
- Evidence: critic/rounds/round-16/evidence/seymour-anima-macalania-win/seq-transition-into-battle/f00.jpg; feel-narr/seymour-anima-macalania-win__seq-transition-into-battle.jpg, -win-touch__, -lose__; feel-narr/grid-banner-f00.jpg; run.json firstState enemy order [guado-guardian-a, seymour-macalania, guado-guardian-b, anima-macalania]
- Confidence: high
- Confirmation: CONFIRMED by the confirmer for the card (f00.jpg; cause traced). The dolly caption is seen in the frames, its code path not traced.
- Requirement: RUBRIC §2 approved Ink & Gold direction (the battle-start boss card), feel: coherent camera and transitions
- Where: src/app/screens/BattleScreen.ts:374-377 (showBattleStart takes the first visible non-part enemy in state.enemyIds; the Macalania formation puts Guado Guardian A in slot 0, src/scenes/macalania-temple.ts ENEMY_SLOTS); src/app/screens/battlePreload.ts:221 makes the same first-enemy pick (visual auditor). The dolly caption is suspected to share it (not traced).
- Smallest fix: Pick the card's and the dolly's subject from a chapter-declared boss id (or the largest-maxHp enemy) instead of enemyIds[0]. Alternatively, order Seymour first in the Macalania formation, if slot staging allows.
- Acceptance check: Ch VII transition f00 reads 'Seymour' with his painting, and the dolly caption names Seymour at 1600x900 and 390x844. The f00 grid for the other 15 chapters is unchanged.
- Merged from: R16-FN-01 (feel, major); R16-VIS-02 (visual, polish; same root, cross-referenced, not scored twice)

### 3. PR-0244 [major, feel]

**PR-0244 (new; gap pass): Chapter VII aftermath staging is invisible: about 3.4 s of empty plate after CONFIRM (and 2.4 s before results); the kneel, KO and sending are never seen** introducedByCandidate=True, regressionVsLive=False, inNewFeature=True.

- Game: FFX
- Chapter and state: VII seymour-anima-macalania, post-battle aftermath
- Expected: Research §9.7 beats 9-10 as scripted (src/story/scripts/seymour-anima-macalania.ts:216-231): the player sees Seymour kneel and fall, then Yuna kneel and begin the sending, before the Guado interrupt. At minimum, the silent beats should not play as a blank plate.
- Observed: After CONFIRM on the victory results, the painted Macalania plate shows with no actors and no dialogue for about 3.4 s (seq-after-confirm frames f00-f11). Then Tidus says '...That's it?'. Seymour's kneel and KO, Yuna's kneel and sending dance, and Seymour's hideActor are never visible, because the whole post scene is plate plus dialogue box. A further 2.4 s of empty plate comes between the kill and the results screen. The sphere-shatter flash is visible.
- Repro: Candidate 49005f73 dist-gate, 1600x900, fresh profile, setSeed(1), then real keys: title, board, Chapter VII, prep, hold-skip the scene, win (46 turns by the advisor). On the results screen press Enter once and do not touch keys for 12 s.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-1600x900-r2/seq-after-confirm/, seq-before-results/, run.json after.aftermathFrames; the phone shows the same in gaps/ch7-390x844-touch-r2/seq-after-confirm/
- Confidence: high on what is observed. The cause is not traced: setPose, fx and hideActor act on battle-stage actors that the cutscene plate does not show.
- Confirmation: Observed directly in a timed sequence (48 frames at 250 ms, 1600x900; the phone shows the same). Not re-run by the confirmer.
- Requirement: CHK-022 aftermath; docs/target Chapter VII narrative per research §9.7; feel-narrative category
- Where: src/story/scripts/seymour-anima-macalania.ts:200-247 (post beats), the cutscene presentation of the post scene
- Cross-reference: narrative (research §9.7 beats 9-10 are scripted but not visible); scored once, under feel
- Smallest fix: Show the battle stage, or staged actors, during the post-results beats (kneel, KO, sending dance) before switching to the plate. Otherwise cut the silent beats and put a caption in their place, so no empty plate lasts longer than about 1 s.
- Acceptance check: The same repro, sampled every 250 ms after CONFIRM: Seymour kneeling and then KO'd, and Yuna's sending, are visible in frames, and no run of frames longer than 1 s shows the plate with no actor and no dialogue.

### 4. PR-0245 [major, interface]

**PR-0245 (new; R16-IF-01): the Chapter VII advisor recommends Phoenix Down on the KO'd Guado Guardian A, 16 turns in a row** introducedByCandidate=True, regressionVsLive=False, inNewFeature=True.

- Game: FFX
- Chapter and state: VII Seymour and Anima (Macalania), act one after Guardian A falls and Guardian B is still standing
- Expected: The advisor offers only legal, useful actions. A KO'd enemy is never a revive target, and the recommendation moves to Guardian B or Seymour.
- Observed: From turn 32, with Guado Guardian A at 0/2000, Guardian B at 1052/2000 and no party member KO'd, the card and phone TIP read 'Phoenix Down -> Guado Guardian A in Items' for Yuna, Rikku and Tidus on 16 of the next 19 decisions. The KO'd enemy's reticle cannot be tapped (5000 ms timeout). Enter then spent the Phoenix Down on full-HP Yuna. That is 16 wasted turns.
- Repro: node critic/runner/lib/route.mjs seymour-anima-macalania win --size=390x844 --touch --seed=1 against the candidate; read turn-log.json turns 32-50. On desktop, reaching the same board requires killing one Guardian without Petrify Grenade.
- Evidence: critic/rounds/round-16/evidence/seymour-anima-macalania-win-touch/turn-log.json (turns 32-50), run.json contexts.touch.blocked (16x target:guado-guardian-a)
- Confidence: high that the advice was shown (read from .mad__move, the same source as the phone TIP). The cause is suspected, not traced: advisor-revive.ts downedActives filters to the party, so the enemy candidate likely comes from the simulated ranking (advisor-eval) scoring Phoenix Down against KO'd non-removed enemies.
- Requirement: RUBRIC §2 (the advisor offers legal, useful actions); CHK-004
- Where: src/engine/tactics (suspected advisor-eval candidate generation; not traced to a line)
- Note: The combat auditor found the candidate changed only advisor strings and the guide rail, never suggestions[0].command, so the suspected ranking defect is latent in shared advisor code and this chapter is where it becomes reachable. Whether any other chapter with a KO-but-not-removed enemy can reach it is unknown (acceptance check below adds that sweep). The confirmer did not re-run it; the gap pass did not reach the state on desktop in two seed-1 runs.
- Smallest fix: Exclude KO'd enemies (and any non-selectable target) from the Phoenix Down / Life candidates in the advisor's ranking. Add a unit case: Ch VII with one Guardian at 0 HP never suggests a revive on an enemy.
- Acceptance check: Re-run the same seed-1 phone route: 0 decisions name a revive item on an enemy, and the advice after Guardian A falls targets Guardian B or Seymour. A unit test over 40 seeds of Ch VII asserts the same. Also: a unit sweep over every chapter whose enemies can be KO'd without removal asserts no revive item is ever suggested on an enemy.

### 5. PR-0228 [major, visual]

**PR-0228 (carried): the Songstress dressphere renders as a grey placeholder mannequin** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: FFX-2
- Chapter and state: XIII Trema (and any chapter that stages the Songstress dressphere)
- Expected: The dressphere's painted battle art, like the other dresspheres.
- Observed: In the mid-fight frame of Ch XIII a grey, untextured human mannequin stands in the party line where the dressphere painting should be.
- Repro: Chapter XIII from the board, seed 1, 1600x900, real keys: fight until a party member is in Songstress (23-midfight after 3 commands).
- Evidence: critic/rounds/round-16/evidence/ffx2-trema-win/23-midfight.png
- Confidence: high
- Confirmation: CONFIRMED: dist-gate/art/characters has yuna-songstress only; no rikku-songstress or paine-songstress, so a Songstress change by Rikku or Paine falls back to the mannequin. FFX-2 only.
- Requirement: CHK-012 (a fallback never ships as the final face); RUBRIC §6 visual
- Where: art for the Songstress dressphere (not traced to a file)
- Smallest fix: Ship the Songstress painting for Rikku and Paine, or keep the dressphere off the stage until its art exists.
- Acceptance check: Ch XIII mid-fight with Songstress active shows painted art and no grey mannequin, at 1600x900 and 390x844.

### 6. PR-0220 [major, audio]

**PR-0220 (fix built, not proven at runtime): a pad-only player may still hear nothing until they touch a key, the mouse or the screen** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: both
- Chapter and state: title and every chapter
- Expected: With a real controller and no key, pointer or touch, the first pad press on the title starts the AudioContext and the title cue plays.
- Observed: The fix polls getGamepads and calls unlock() under Chromium's pad activation, and its unit test passes. The capture's only pad run was 'gamepad shim + keyboard', and title.mp3 was already fetched before any pad input. A JS shim cannot produce Chromium user activation, so this evidence neither confirms nor refutes the fix.
- Repro: Fresh profile, Chromium, real gamepad. Load the title and press only pad buttons. Read window.__pyrefly audioDebug(): ready and playing.
- Evidence: critic/rounds/round-16/evidence/ffx2-bahamut-win-pad/audio-debug.jsonl; index.json entry 'gamepad shim + keyboard'
- Confidence: medium (the code path is plausible; the runtime proof is missing)
- Requirement: RUBRIC §2 platform goals (gamepad); CHK-015; CHK-023
- Where: src/audio/padUnlock.ts (new)
- Note: Fix merged (src/audio/padUnlock.ts), unit test passes; runtime proof needs a real controller or a browser-level pad input. Carried open until proven.
- Smallest fix: No code change asked for. Collect one real-controller run, owner hardware or a CDP-level input that the browser treats as a real pad, recording audioDebug at the title before and after the first press.
- Acceptance check: audioDebug shows ready=true and playing='title' after a pad-only press, with no keyboard, pointer or touch event in the run log.

### 7. PR-0099 [major, audio]

**PR-0099 (carried, STALLED, improved): 9 of 16 playable chapters still play at least one borrowed stand-in cue** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: both
- Chapter and state: VI, IX, X, XI, XII, XIII, XIV, XV, XVI
- Expected: Each chapter's own cue as the cue map specifies, or a recorded owner decision to keep a borrow.
- Observed: themes-audit marks 9 chapters as borrowed. Examples: Natus uses boss-seymour-macalania, Yojimbo and Isaaru use scene-gagazet as the bed, and Trema uses boss-ffx2-aeon as the stand-in for boss-trema. Chapter VII now has its own scene and battle cues, so it moves off the list (round 15: 9 of 15).
- Repro: node tools/audio/themes-audit.mjs in D:/pyrefly-rel28
- Evidence: critic/rounds/round-16/cap/audio-themes-audit.txt
- Confidence: high
- Requirement: RUBRIC §6 audio (thematic coherence); THEMES.md chapter cue map
- Where: THEMES.md chapter cue map rows marked 'borrowed; owed'
- Smallest fix: Unchanged plan: compose the owed cues in the approved Direction B, with each one auditioned by Bailey before it ships.
- Acceptance check: themes-audit lists no 'borrowed; owed' rows, or each remaining borrow cites an owner decision.

### 8. PR-0032 [major, onboarding]

**PR-0032 (carried): no in-game text size, remapping, or reduce-motion, low-effects or flash setting** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: both
- Chapter and state: all, pause OPTIONS
- Expected: The accessibility settings the category names, as RUBRIC §6 onboarding requires.
- Observed: OPTIONS still lists only master, music and SFX volume, text speed, strategy guide and battle help.
- Repro: Esc > OPTIONS in any chapter.
- Evidence: seymour-anima-macalania-win/14-pause-options.png; seymour-anima-macalania-win-touch/14-pause-options.png
- Confidence: high
- Requirement: RUBRIC §6 onboarding
- Where: src/app/screens/PauseScreenPanels.ts
- Smallest fix: Expose the existing SaveData reduceMotion and lowEffects as rows. Adding text scale and remapping needs a mockup and Bailey's yes (new UI).
- Acceptance check: The toggles persist across reload and change the battle-entry transition and effects.

### 9. PR-0240 [major, delivery]

**PR-0240 (carried, narrowed): on a cold 10 Mbit/s link the first battle still waits about 19 s behind the loading card (met at 50 Mbit/s and above)** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: both
- Chapter and state: XVI Ixion (measured); shared preload for every chapter
- Expected: A load under 5 s on named conditions (RUBRIC section 2 platform goals).
- Observed: Setup: cold profile, 10 Mbit/s down with 40 ms latency (CDP), 1600x900, localhost preview of dist-gate. Title arrives at 1.37 s. After Enter on the card the loading card was visible for 18.8 s, and the first command menu came 30.9 s after the card was chosen. 105 MB were transferred in 115 requests. For comparison, Chapter VII at 50 Mbit/s showed the card for 0.8 s (first menu at 12.2 s), and unthrottled runs showed 0 s. Cold transfer per chapter entry is 94 to 184 MB. The r29-load fix brought the card from 17-29 s down to about 1 s at 25 Mbit/s on the builder's harness; the bandwidth-bound residual remains below that.
- Repro: node critic/rounds/round-16/cap/perf-probe.mjs ffx2-ixion-djose --base=<dist-gate preview>/pyrefly-reprise/ --evidence=<dir> --net=10mbps --size=1600x900 with PYREFLY_BROWSER=gpu, cold profile. Seedless (the chapter's default seed).
- Evidence: critic/rounds/round-16/evidence/perf/perf-ffx2-ixion-djose-10mbps-1600x900.json; perf-seymour-anima-macalania-50mbps-1600x900.json; docs/handoff/r29-load.md (the builder's before and after at 25 Mbit/s)
- Confidence: medium-high: the 18.7 s extra time to the first menu against 50 Mbit/s is robust. The loading-card time comes from a class*='load' visibility heuristic, and there is one run per condition.
- Requirement: RUBRIC section 2 (load under five seconds on named conditions); CHK-017
- Where: first entry from the board: card Enter -> prep -> pre-scene -> battle, cold cache
- Smallest fix: The builder's proposal 1, which needs Bailey's yes because it touches the art pipeline: build-time derived files, meaning downscaled WebP for the board's rail strips and WebP encodes of the scene and battle backdrops. This cuts the board from about 90 MB and a backdrop from about 6 MB to about 1 MB. No replacement of the approved originals.
- Acceptance check: Cold 10 Mbit/s runs of Chapter XVI and Chapter I at 1600x900 and at 390x844 (4x CPU): loading card at most 5 s. Screenshots of the card at 5 s and 15 s.
- Merged from: the capture owner's 'First battle on a 10 Mbps cold cache shows the loading card for 18.8 s' (same measurement, same root)

### 10. PR-0222 [major, delivery]

**PR-0222 (carried): the fix for the hidden FF7 fight's 20-40 s of black on a cold cache is claimed but was not captured this round** introducedByCandidate=False, regressionVsLive=False, inNewFeature=False.

- Game: FF7 (hidden experiment)
- Chapter and state: FF7 Guard Scorpion (unlisted)
- Expected: No black hold: the swirl's own last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- Observed: There is no FF7 capture in round 16 (0 of 839 index entries). The builder's harness reports black from 1.0 s to 39.3 s before, and after a held swirl with the field at 6.8-8.6 s (docs/handoff/r29-load.md). The builder's own note says Esc during the hold was not re-tested in a browser. The critic has not validated this.
- Repro: Cold profile, 1600x900, 25 Mbit/s: open the secret door (L-I-M-I-T on the board, with FF7_EXPERIMENT_READY as shipped) and sample frames every 200 ms until the field. Press Esc and arrows during the hold.
- Evidence: absent in critic/rounds/round-16/evidence; builder claim in docs/handoff/r29-load.md and docs/screenshots/r29-load/ff7-cold-door-hold-after.jpg
- Confidence: low (unverified either way)
- Requirement: CHK-017 / CHK-025; RUBRIC section 5 (an agent's report is not validation)
- Where: secret door -> swirl -> field, cold cache
- Note: inNewFeature set to false by the chief: the hidden FF7 fight has been live since releases 23/27, so it is not a feature that is new in this candidate. The r29-load fix is claimed by the builder and was not observed by the critic; the issue stays open until captured.
- Smallest fix: None proposed until it is observed; capture it (see capturesNeeded).
- Acceptance check: Cold capture at 1600x900 at 25 and 10 Mbit/s: no black sample longer than 1 s, the field arrives, Esc and arrows during the hold start nothing, and the main save stays byte-identical.

### 11. PR-0218 [polish, interface]

**PR-0218 (carried, refined by the confirmer): on a phone, advised rows below the six-row window are reachable only by a vertical drag that nothing announces; the list wraps to the top on further drags**

- Game: FFX
- Chapter and state: VII, 390x844 touch
- Expected: The phone either reaches the advised row by a discoverable scroll or paging control, or the TIP names only rows that are reachable.
- Observed: Chapter VII 390x844 touch: the route (tap-only harness) recorded 31 of 106 advised moves it could not tap. The confirmer showed two 150 px vertical drags on .ffx-cmd-area bring PETRIFY GRENADE, POISON FANG and the other rows into the window (confirm-drag/seymour-anima-macalania-Items.json); only a small down mark at the grid edge hints at it, the advisor card does not say "swipe", and further drags wrap to the top.
- Repro: Same route as R16-IF-01; see run.json misses.
- Evidence: seymour-anima-macalania-win-touch/run.json misses (31) and turn-log.json
- Confidence: medium: the harness may not use the ladder that round 15's confirmer found
- Requirement: CHK-004, CHK-015
- Where: FFX phone command grid
- Smallest fix: Make the paging marks live controls (or scroll the grid) on the FFX phone layout, and have the TIP say 'scroll' when the row is off-page.
- Acceptance check: The Ch VII phone route reaches Petrify Grenade by taps alone, with 0 misses for rows the TIP names.
- Merged from: the capture owner's major 'Phone: the advisor names moves below the 6-row window' (REFUTED as a major: the harness never swipes)

### 12. PR-0246 [polish, interface]

**PR-0246 (new; R16-IF-03 = the capture owner's confirm-label finding): the phone target-confirm button clips long target names ('TTACK -> GUADO GUARDIAN')**

- Game: FFX
- Chapter and state: VII, 390x844, Attack targeting
- Expected: The full action and target name fit, wrapping or shrinking to the 14 px floor.
- Observed: The centred label overflows both ends of the skewed button, cutting off the leading A of ATTACK and the trailing 'A' of the name. 'ATTACK -> SEYMOUR OMNIS' fits.
- Repro: Ch VII, phone, first Rikku turn, ATTACK, target Guado Guardian A.
- Evidence: seymour-anima-macalania-win-touch/16-target-single.png
- Confidence: high
- Requirement: CHK-009, CHK-003
- Where: FFX phone target confirm button
- Smallest fix: Let the confirm label wrap to two lines (or drop the verb when the name is long) and assert scrollWidth <= clientWidth.
- Acceptance check: At 390x844, the Ch VII confirm label for Guado Guardian A has scrollWidth <= clientWidth + 1 and no glyph is cut.
- Merged from: capture owner 'Phone confirm button clips the target name at both ends in Chapter VII'

### 13. PR-0247 [polish, visual]

**PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s**

- Game: FFX
- Chapter and state: VII, battle, Anima's arrival at 390x844 touch
- Expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- Observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- Repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- Confidence: high
- Requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- Smallest fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- Acceptance check: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.

### 14. PR-0248 [polish, visual]

**PR-0248 (new; R16-VIS-03): after a target cancel in Chapter VII the Sensor card sits over Guardian B's staff and torso**

- Game: ffx
- Chapter and state: VII, first menu after Escape from target selection
- Expected: Per CHK-008, no panel covers a face or a weapon outside the declared overlaps.
- Observed: The 'Seymour HP ???' Sensor card covers Guardian B's staff and robe. At 2000x1012 it covers most of his body below the head. His face stays clear.
- Repro: Chapter VII, seed 1: ATTACK, then Escape, at 1600x900 and 2000x1012.
- Evidence: critic/rounds/round-16/evidence/seymour-anima-macalania-lose/16b-after-cancel.png; critic/rounds/round-16/evidence/seymour-anima-macalania-win/16b-after-cancel.png
- Confidence: high
- Requirement: CHK-008
- Where: Sensor card placement (not traced)
- Smallest fix: Place the Sensor card in a slot clear of the fiends' projected quads (the line-card slot picker already does this), or dismiss it on cancel.
- Acceptance check: After ATTACK and Escape in Ch VII, the Sensor card does not intersect any fiend's face or weapon at 1600x900 and 2000x1012.

### 15. PR-0249 [polish, interface]

**PR-0249 (new; R16-IF-06 = the capture owner's intent-panel finding): the enemy-intent card is placed over actors and names: over Rikku's and Paine's heads during FFX-2 party targeting, and over the end of the guide rail's 'Guado Guardian A' in Chapter VII**

- Game: FFX-2
- Chapter and state: IV Bahamut, 1600x900, Shell -> All allies with E open
- Expected: Persistent panels never cover a face.
- Observed: The Bahamut intent card (ALSO row, 'J HOLD +1 MORE') covers the heads of Rikku and Paine, who move up-left in the targeting frame.
- Repro: Ch IV seed 1, Yuna, White Magic > Shell, with the intent panel open.
- Evidence: extras-ffx2-bahamut-1600x900/52-target-all.jpg
- Confidence: medium (one frame)
- Requirement: CHK-008
- Where: FFX-2 intent panel placement
- Smallest fix: Measure the intent card against the targeting-camera actor rects and slide it clear, or fold it while targeting.
- Acceptance check: In the same state, no party face rect intersects the intent card at 1600x900 or 2000x1012.
- Merged from: capture owner 'FFX-2 Ch IV: the enemy-intent panel covers Rikku and Paine during All Allies targeting'; interface CHK-008 (c): the intent card covers the end of the guide rail name in Ch VII with E open

### 16. PR-0250 [polish, interface]

**PR-0250 (R16-IF-04): the phone results location caption is clipped (both games)**

- Game: both
- Chapter and state: VII 'MACALANIA TEMPL...', XVI 'DJOSE TEMPLE - CHAMBER OF THE I...'
- Expected: The caption is shown in full or shortened deliberately.
- Observed: The vertical side caption runs off the top of the screen.
- Repro: Win any chapter with a long location on the phone and look at the results.
- Evidence: seymour-anima-macalania-win-touch/31-results.png; ffx2-ixion-djose-win-touch/31-results.png; the same in round-15 ffx2-ixion-djose-win-touch/31-results.png
- Confidence: high
- Requirement: CHK-009
- Where: results screen, phone layout
- Smallest fix: Clamp the caption to the viewport height with a line-clamp, or use the short location name on phones.
- Acceptance check: At 390x844 the caption box lies inside the viewport for Ch VII and Ch XVI.

### 17. PR-0251 [polish, interface]

**PR-0251 (new; gap pass): at 390 px wide the active pause tab (CONTROLS) sits off the right edge and the tab labels and breadcrumb are 12-13 px**

- Game: both
- Chapter and state: Pause, CONTROLS tab (seen in Ch I and Ch IV)
- Expected: The active tab is scrolled into view, and text is at least 14 px under the project's text-size check.
- Observed: With CONTROLS selected at 390x844, the tab strip shows TIDUS/YUNA/KIMAHRI/CHAPTER/GU..., so the active tab is past the right edge. 32 text runs are under 14 px, among them the tab labels at 13 px and the breadcrumb at 12 px.
- Repro: Candidate dist-gate, desktop context at 1600x900, Ch I or Ch IV first menu, Esc, ArrowRight to CONTROLS, then page.setViewportSize(390,844).
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/pause-seymour-flux/pause-controls-390x844.jpg, gaps/pause-ffx2-bahamut/pause-controls-390x844.jpg, run.json tabs['controls-390x844']
- Confidence: medium: a resized desktop context, not an isMobile device
- Requirement: CHK-002/003/009 text size and clipping; phone layout
- Smallest fix: scrollIntoView({inline:'nearest'}) on .pause__tab--on whenever the tab changes, and raise the phone tab label size to at least 14 px.
- Acceptance check: Real phone context (hasTouch, isMobile) at 390x844: on every tab the .pause__tab--on rect lies within 0..390, and the pause text walk finds nothing under 14 px.

### 18. PR-0252 [polish, interface]

**PR-0252 (R16-IF-05): at 2560x1080 the first-turn coach line covers the selected command row**

- Game: FFX
- Chapter and state: X Seymour Natus, first menu, fresh profile
- Expected: The coach clears the command stack, as at 1600x900 and 2000x1012.
- Observed: Auron's coach line sits over the TALK row and the Tidus cut-in (foc overlap with commands 3598 px2). Every other size reports 0 overlap.
- Repro: route.mjs seymour-natus win --size=2560x1080 --seed=1, first menu.
- Evidence: seymour-natus-win/10-first-menu-coach.png; index.json foc overlaps
- Confidence: medium; suspected side effect of the PR-0237 actor-avoid placement
- Requirement: CHK-008
- Where: src/ui/coach/coachActorAvoid.ts (suspected)
- Smallest fix: Include the command stack as a hard exclusion in coachActorAvoid's candidate places.
- Acceptance check: At 2560x1080, the first-menu foc overlaps list is empty.

### 19. PR-0253 [polish, narrative]

**PR-0253 (new; R16-FN-02): Chapter VII's first-Boost callout misstates the mechanic ('twice as hard') and reads as a threat**

- Game: FFX
- Chapter and state: VII, act two, Anima's first Boost (mid script mac-first-boost)
- Expected: Boost makes Anima take x1.5 damage and healing until her next turn. It is the player's damage window (research/ffx-seymour-anima-macalania.md §3.4, §5.3 table, §6.3). The number is 1.5, not 2, and the line should point the player at attacking, not at bracing.
- Observed: Rikku: 'She's winding up! That wasn't a spell!' With Lulu not fielded, Tidus follows with the fallback 'Whatever hits next hits twice as hard!' (126809 to 131326 ms, seymour-anima-macalania-win; also on touch).
- Repro: Ch VII seed 1, desktop: bring Seymour to 3,000 HP so Anima is summoned, and wait for her first Boost.
- Evidence: critic/rounds/round-16/feel-narr/dbox-all.txt (seymour-anima-macalania-win s32-s33); D:/pyrefly-rel28/src/story/scripts/seymour-anima-macalania.ts:326-330
- Confidence: high
- Requirement: AGENTS.md rule 6 (never invent game data); narrative: faithful beats; same class as PR-0231
- Where: src/story/scripts/seymour-anima-macalania.ts:327-329
- Smallest fix: Rewrite both variants without a wrong multiplier and name her as the one exposed. For example, Lulu: 'She's open. Whatever lands next hurts her more.' Tidus fallback: 'She's open! Hit her now!'
- Acceptance check: The mac-first-boost text contains no 'twice' and describes damage Anima takes. A script-text unit test pins it.

### 20. PR-0254 [polish, narrative]

**PR-0254 (new; R16-FN-03): Chapter VII Talk shows 'Tidus SPEAKS' and nothing is said (PR-0204 class)**

- Game: FFX
- Chapter and state: VII, act one, Tidus and Yuna Talk
- Expected: A Trigger Command that promises speech says something, as Chapter X now does. Otherwise it does not promise speech.
- Observed: The Talk banner reads 'TIDUS: +10 STRENGTH', then 'Tidus SPEAKS', for about 1.6 s. No dialogue line appears for Tidus's or Yuna's Talk: dboxTimeline has no line between 25104 and 110627 ms, while turn-log turn 5 shows Yuna's Talk. Chapter X, by contrast, voices each Talk (D-203).
- Repro: Ch VII seed 1: on Tidus's first turn choose Talk.
- Evidence: critic/rounds/round-16/feel-narr/crop-ch7-talk-f00.jpg, crop-ch7-talk-f02.jpg; seymour-anima-macalania-win/turn-log.json; D:/pyrefly-rel28/src/story/scripts/seymour-anima-macalania.ts:285-311 (no Talk mid entries)
- Confidence: high
- Requirement: narrative: reachable banter and beats; feel: no dead beat
- Where: src/story/scripts/seymour-anima-macalania.ts mid/midScripts
- Smallest fix: Add three 'ability-used talk' mid entries for Tidus, Yuna and Wakka, one exchange each, as seymour-natus.ts does. The lines are new content, so ask Bailey if D-203 does not cover Chapter VII. As a stopgap, drop the 'SPEAKS' chip when no line is registered.
- Acceptance check: A real-key Talk by Tidus, Yuna and Wakka in Ch VII each produces a dboxTimeline line within 2 s of the banner.

### 21. PR-0255 [polish, narrative]

**PR-0255 (new; R16-FN-04): Tromell's five aftermath lines in Chapter VII have no speaker name**

- Game: FFX
- Chapter and state: VII aftermath (§9.7 beat 10)
- Expected: The player can tell who takes the body and breaks the sphere. Research §9.7 names Tromell.
- Observed: 'Step away from Lord Seymour, Lady Summoner.', 'You will not put hands on him again.', 'He will be cared for...', 'And this. This was never yours.' and 'Traitors, all of you...' are spoken with speaker '' and no portrait. That is the same register as the stage-direction captions used elsewhere. By design, the header says: speaker 'none'.
- Repro: Win Ch VII by any seed and CONFIRM the results.
- Evidence: critic/rounds/round-16/feel-narr/dbox-all.txt (seymour-anima-macalania-win s38-s44); src/story/scripts/seymour-anima-macalania.ts:233-248
- Confidence: high on the data; the rendered box is not captured
- Requirement: narrative: context and reachable scenes; related to PR-0058
- Where: src/story/scripts/seymour-anima-macalania.ts:235-248
- Smallest fix: Give the lines a text-only 'Tromell' name plate, with the TEXT_ONLY portrait mechanism that Ch XVI uses for Nooj. No painting needs commissioning.
- Acceptance check: A still of 'Step away from Lord Seymour' shows the name Tromell and no empty portrait frame.

### 22. PR-0256 [polish, feel]

**PR-0256 (new; R16-FN-05): Chapter XVI whistles: 'A small gold light answers' is told, not shown**

- Game: FFX-2
- Chapter and state: XVI aftermath, whistles 1 to 4
- Expected: The answering light the text describes can be seen, at least faintly, and grows nearer across the four whistles.
- Observed: After each (Whistle) the whistle-answer cue plays and the line changes. The plate is identical in 21-choice and in 21b, 23b and 24b ('It runs ahead, over a bridge'), with no visible light.
- Repro: Win Ch XVI (the injected fight is acceptable for this scene), then press Enter on each (Whistle).
- Evidence: critic/rounds/round-16/feel-narr/grid-choices.jpg; scene-ffx2-ixion-djose-0000/run.json
- Confidence: medium (stills only; a transient effect could fall between captures)
- Requirement: CHK-023 visible feedback; feel: readable effects
- Smallest fix: Add a small fx step (a gold mote, stepped nearer per whistle) beside each answer line, or confirm one already exists and capture it.
- Acceptance check: A timed sequence after each whistle shows the light, larger or nearer on each of the four.

### 23. PR-0104 [polish, feel]

**PR-0104 (carried, seen by pad): under Wait, a confirmed FFX-2 command shows nothing before the next menu opens**

- Game: FFX-2
- Chapter and state: IV ffx2-bahamut, pad shim, 1600x900
- Expected: A confirmed command gives immediate visible acknowledgement (its name or a charge cue) while it waits for the ATB.
- Observed: After Shell is confirmed, no effect and no action name appear from 52 to 1268 ms. Paine's menu opens at 1520 ms. No Shell visual appears within the 2.27 s sequence.
- Repro: Ch IV seed 1 by pad: Yuna, White Magic, Shell, all allies.
- Evidence: critic/rounds/round-16/feel-narr/ffx2-bahamut-win-pad__seq-party-action.jpg
- Confidence: high
- Requirement: feel: input-to-response
- Smallest fix: Show the queued command's name chip over the actor at confirm under Wait (FFX-2 only).
- Acceptance check: A frame within 300 ms of confirm shows the Shell label over Yuna.

### 24. PR-0257 [polish, encounter]

**PR-0257 (new; R16-E01): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows; the release note's '~37 %' is the whole-chapter figure**

- Game: FFX
- Chapter and state: III Braska's Final Aeon, links 2-6 (possessed aeons)
- Expected: The length cost is disclosed accurately to Bailey. Only Bailey decides whether measured options are wanted; nothing is tuned.
- Observed: Links 2-6, engine turns on wins. The handoff's own 200-seed table: 95.8 -> 221.7 (+131 %). My 60 seeds: 86.1 -> 213.5 (Valefor 6.9->11.8, Ifrit 4.1->37.9, Ixion 12.4->32.9, Shiva 10.8->43.6, Bahamut 51.9->87.3). The 37 % is the whole chapter (322.8 -> 443.5). Cause, measured on seed 1: the Pagodas' sourced 1,500 Power Wave heals outpace the party on the larger mirrors. Possessed Bahamut: 127 engine turns, 63,000 healed against about 27,000 dealt. Real keys: 75 player commands on the five possessed aeons. The tactic comment in braskas-final-aeon.ts (about L1447) still says the fight is 'over in three'. Wins are unchanged and the sequence cannot be lost (Auto-Life).
- Repro: cd D:/pyrefly-rel28 && PYREFLY_MEASURE=1 AEON23_SEEDS=60 AEON23_CHAPTERS=braskas-final-aeon npx vitest run tests/unit/chapters/aeon-hp-2-3-bench.test.ts; seed-1 trace: SEED=1 npx vitest run --config "D:/Final Fantasy/critic/rounds/round-16/combat/vitest.critic.config.ts" trace-possessed
- Evidence: D:/Final Fantasy/critic/rounds/round-16/combat/trace-out.jsonl; D:/pyrefly-rel28/docs/handoff/aeon-hp-2-3.md; D:/Final Fantasy/critic/rounds/round-16/evidence/braskas-final-aeon-win/turn-log.json
- Confidence: high
- Requirement: RUBRIC §6 encounter pacing; RUBRIC §3 accurate disclosure; AGENTS.md rule 6
- Where: src/data/ffx/builds/late-aeon-rows.ts INSIDE_SIN_SOURCED_ROWS (mirrored by enemies/braskas-final-aeon.ts); stale comment src/engine/tactics/braskas-final-aeon.ts about L1447
- Smallest fix: Correct the disclosure to 'links 2-6 about 2.3x longer (about 95 -> 220 engine turns)'. Refresh the stale comment. Offer measured options only if Bailey asks.
- Acceptance check: The release announcement and the handoff state the links 2-6 figure. Any option comes with a 200-seed per-link bench.

### 25. PR-0258 [polish, prep]

**PR-0258 (new; R16-PREP-01): FFX victory spoils ignore the sourced x2-on-overkill drop quantity (Chapter VII shows Ability Sphere x3 where the sources give 4)**

- Game: FFX only
- Chapter and state: VII Seymour and Anima (observed); every FFX chapter whose overkilled enemy has a drop (I, II, VIII, ...)
- Expected: research/ffx-seymour-anima-macalania.md:224 gives each Guado Guardian Ability Sphere x1 (x2 on overkill), and :264 gives Anima Ability Sphere x1 (x2 overkill). With Anima overkilled that is 1 + 1 + 2 = 4 Ability Spheres plus Seymour's Blk Magic Sphere. The same rule is sourced in ffx-seymour-flux.md:109, ffx-yunalesca.md:1005 and ffx-evrae-airship.md:126.
- Observed: Seed 1 at 1600x900 by real keys: OVERKILL x1. AP 6,330 = 2,000 + 290 + 290 + 3,750 proves the overkilled enemy was Anima. The results show 'Ability Sphere x3, Blk Magic Sphere' (desktop and 390x844 runs). Traced: src/battle/ffx/results.ts:31-35 applies apOverkill for overkilled ids but pushes each drop with its base count.
- Repro: setSeed(1), then play Chapter VII by real keys to a victory that overkills Anima (the capture owner's seymour-anima-macalania-win route), then read the results ITEMS row.
- Evidence: critic/rounds/round-16/evidence/seymour-anima-macalania-win/31-results.png; run.json resultsText; seymour-anima-macalania-win-touch/run.json
- Confidence: high
- Requirement: AGENTS.md hard rule 6 (sourced data); prep category (understandable, correct rewards)
- Where: results screen after a victory with an overkill
- Smallest fix: In collectRewards, when ctx.rt.overkilled includes the id, push the drop with count x2, or add a sourced overkillCount per drop where the research gives one.
- Acceptance check: A unit test: a seed-1 Chapter VII victory with Anima overkilled yields ability-sphere x4. The results screen reads 'Ability Sphere x4, Blk Magic Sphere'. Non-overkill wins are unchanged.

### 26. PR-0259 [polish, delivery]

**PR-0259 (new; R16-DEL-01): one 183 ms frame during the FFX-2 Bahamut fight on a cold run**

- Game: FFX-2
- Chapter and state: IV Bahamut
- Expected: Frame times without spikes above about 50 ms, and no first-ability stall (RUBRIC section 2).
- Observed: 1 of 1,191 frames exceeded 50 ms (max 183.3 ms; p95 16.8). By comparison, Chapter I's max was 33.4 ms and Chapters VII and XVI had max 16.8 ms. Cause not established; a first-use texture or shader upload is suspected. ComfyUI was rendering in the background.
- Repro: node critic/rounds/round-16/cap/perf-probe.mjs ffx2-bahamut --net=none --size=1600x900, cold profile, PYREFLY_BROWSER=gpu
- Evidence: critic/rounds/round-16/evidence/perf/perf-ffx2-bahamut-none-1600x900.json
- Confidence: low (one sample, injected fight, shared GPU)
- Requirement: RUBRIC section 2 (report frame-time spikes and first-ability stalls)
- Where: fight playing (INJECTED autoBattle('intended') after the measured idle window), cold profile, 1600x900, GPU
- Smallest fix: Record a performance trace on three cold repeats. If it is a first-use upload, add that texture or VFX to battlePreload's warm phase.
- Acceptance check: Three cold Chapter IV runs at 1600x900 with the GPU idle: max frame under 50 ms.

### 27. PR-0223 [polish, delivery]

**PR-0223 (carried): the FF7 pause no longer requests three missing Cloud files, per the builder; not captured this round**

- Game: FF7 (hidden experiment)
- Chapter and state: FF7 Guard Scorpion
- Expected: 0 requests >= 400 on the FF7 pause.
- Observed: Not captured in round 16. The builder reports 3 404s before and 0 after (docs/handoff/r29-load.md).
- Repro: FF7 door, then battle, then Esc; record the network log.
- Evidence: absent; builder claim only
- Confidence: low
- Requirement: CHK-017 / CHK-018
- Where: pause in the FF7 fight
- Note: inNewFeature false: the FF7 experiment is live already. Fix claimed, not captured.
- Smallest fix: None until observed.
- Acceptance check: FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.

### 28. PR-0039 [polish, audio]

**PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible**

- Game: FFX (scene-gagazet, scene-dreams-end), FFX-2 (scene-farplane)
- Chapter and state: I, III, V, IX, X, XI, XIV and others using these beds
- Expected: The themes, keys and tempo maps the bible names.
- Observed: themes-audit FAIL:
- scene-gagazet: no tempo map on a lyrical cue.
- scene-dreams-end: FAREWELL_RISE absent, key C major against none in the map, no tempo map.
- scene-farplane: E minor against the map's E major, no tempo map.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: critic/rounds/round-16/cap/audio-themes-audit.txt
- Confidence: high
- Requirement: THEMES.md cue map; CHK-001 step 2
- Where: src/audio/tracks/scene-gagazet.ts, scene-dreams-end.ts, scene-farplane.ts
- Smallest fix: Fold into the Direction B re-render of these beds.
- Acceptance check: themes-audit shows ok for these three cues.

### 29. PR-0260 [polish, audio]

**PR-0260 (new; R16-AUD-01): themes-audit cannot check the new Chapter VII scene cue, so its bible conformance is unverified**

- Game: FFX
- Chapter and state: VII (Seymour and Anima, Macalania)
- Expected: themes-audit checks every shipped cue against its row.
- Observed: themes-audit prints 'FAIL scene-macalania-temple ? bpm ? (map: none) — cue is not in the bible's cue map'. THEMES.md row 26 does define the cue (F# minor, 56 bpm, HYMN_HEAD), and src/audio/tracks/scene-macalania-temple.ts declares bpm 56. The audit's own table has no entry for the cue. This is not player-facing: the cue's tempo, key and theme check simply never runs.
- Repro: cd D:/pyrefly-rel28 && node tools/audio/themes-audit.mjs | grep macalania-temple
- Evidence: critic/rounds/round-16/cap/audio-themes-audit.txt; D:/pyrefly-rel28/docs/audio/THEMES.md:578
- Confidence: high
- Requirement: CHK-001 step 2
- Where: tools/audio/themes-audit.mjs, the hard-coded cue table near line 100 (it ends at boss-yojimbo; traced)
- Smallest fix: Add 'scene-macalania-temple': { key: 'F# minor', bpm: 56, meter: [4, 4], themes: ['HYMN_HEAD'] } to the audit's cue table, as THEMES.md row 26 states. Also correct the stale comment at src/data/chapter-seymour-anima-macalania.ts:64, which still calls the scene cue 'Chapter 1's cue as a recorded stopgap'.
- Acceptance check: themes-audit prints an ok or a real finding for scene-macalania-temple, not '? bpm / map: none'.

### 30. PR-0261 [polish, harness]

**PR-0261 (critic tooling, not a product defect): the route harness records a reticle interception as a plain timeout, taps with locator.tap instead of a coordinate touch, never swipes the phone grid, and expects the post scene before results**

- Game: both (tooling)
- Chapter and state: all phone routes
- Expected: contexts.touch.blocked names the element that intercepts the tap.
- Observed: route-evidence.mjs tap() only matches 'from <…> intercepts pointer events'. Playwright's '<div …> intercepts pointer events' form is recorded as 'Timeout 5000ms', which hid the Auron-over-Yuna cause in the Ch XII and Ch VII routes. Also, the route expects the post scene before the results screen, so 30-post-scene is UNVERIFIED in the six chapters whose results come first. The confirmer showed the consequence: 13 "blocked" Ch XII taps and 31 Ch VII phone "misses" were harness artefacts (a coordinate touch reaches Yuna; a drag reaches the rows), which the capture owner had filed as two majors.
- Repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/diag-tap/seymour-omnis-yuna.json
- Confidence: high
- Requirement: CHK-016 evidence integrity
- Smallest fix: Match /<([^>]*)>[^\n]*intercepts pointer events/ in route-evidence.mjs tap(); shoot the post scene after CONFIRM when results come first. Use page.touchscreen.tap at the reticle centre, and teach the phone route to drag .ffx-cmd-area before a row counts as unreachable.
- Acceptance check: A rerun of the Ch XII phone route names data-target-id=auron in blocked.

### 31. PR-0061 [polish, feel]

**PR-0061 (carried, re-measured): a hold-skip of the pre-battle scene takes 8.0 s (Ch VII, 3 runs) and 9.1 s (Ch IV) to the first usable menu**

- Game: both
- Chapter and state: VII (FFX) and IV (FFX-2), pre-battle scene to first menu
- Expected: A respected skip lands the player on the first usable menu quickly (feel: respectful skip and replay).
- Observed: Hold-skip to the first usable command menu: 8.0 s in Chapter VII (three runs) and 9.1 s in Chapter IV, inside the known 6.3-11.9 s range.
- Repro: gaps-latency.mjs on the candidate: fresh profile, seed 1, 1600x900, board -> chapter -> prep -> hold Enter over the scene; time to the first menu.
- Evidence: critic/rounds/round-16/evidence/gaps/ch7-1600x900/run.json latency; gaps/latency-ffx2-bahamut/run.json
- Confidence: high on the measurement
- Requirement: RUBRIC §6 feel (respectful skip)
- Smallest fix: Unchanged from its earlier rounds: start the battle load earlier or overlap it with the skip.
- Acceptance check: Hold-skip to the first usable menu under 3 s in Ch VII and Ch IV at 1600x900.

### 32. PR-0161 [polish, narrative]

**PR-0161 (carried, still observed): Chapter V's Farplane voices appear as present speakers with full portraits and FFX role plates ('Final Aeon', 'High Summoner')**

- Game: FFX-2
- Chapter and state: V Vegnagun (all links)
- Expected: Disembodied Farplane voices (writing-bible E7). Jecht is no longer the Final Aeon in FFX-2.
- Observed: Jecht is shown with jecht.png and the role 'Final Aeon'; Braska with braska.png and 'High Summoner' (dboxTimeline).
- Repro: Live 6ea8528f. Chapter V at 2000x1012, seed 1001, link 1 (the tail).
- Evidence: critic/rounds/round-15/feel-narr/dbox-all.txt (ffx2-vegnagun-shuyin-win 40783, 275876, 1623977)
- Confidence: high
- Requirement: writing-bible E7 Farplane voice system
- Note: Carried from round 15. The candidate merged a fix (r29-text); its acceptance state was not captured on this candidate, so the issue stays open until observed. Seen this round: Braska, Auron and Jecht now carry a "Farplane" plate in FFX-2 while FFX Ch II keeps "High Summoner" (game-aware, CHK-021 PASS); the Farplane voice treatment itself was not captured.
- Smallest fix: Give the voice lines a narration or 'voice' style: no role plate, or 'FARPLANE' as the plate, with a faded portrait.
- Acceptance check: The Chapter V Farplane lines render without FFX role plates.

### 33. PR-0234 [polish, interface]

**PR-0234 (carried; R15-IF-04): the advisor card falls back to 'The best of what is offered.' and shows 'ALWAYS HITS' on non-attacks**

- Game: FFX
- Chapter and state: X Seymour Natus (Talk), VIII Evrae (Pull back), XIV Isaaru (Grand Summon)
- Expected: The advice says why, and a hit-chance chip appears only on commands that can miss or hit.
- Observed: Ch X card: 'Talk, GUIDE'S PICK, NO MP, ALWAYS HITS, The best of what is offered.' The chapter guide's own reason (+10 Strength for Tidus and Auron, +10 Magic Defense for Yuna) is not shown.
- Repro: Ch X at 2560x1080, seed 1, first Tidus menu. Ch VIII and XIV, first menu.
- Evidence: critic/rounds/round-15/evidence/seymour-natus-win/11-advisor.png; evrae-airship-win/run.json; isaaru-via-purifico-win/run.json
- Confidence: high
- Requirement: RUBRIC §2: the advisor offers useful actions and separates certainty
- Where: src/engine/tactics/advisor.ts:966 fallback reason
- Note: Carried from round 15. The candidate merged a fix (r29-text); its acceptance state was not captured on this candidate, so the issue stays open until observed.
- Smallest fix: When the pick is the guide's pick, use the matching guide hint text. Suppress hit chips for Talk, Orders and Summon.
- Acceptance check: The first card in Ch X, VIII and XIV states a concrete reason, with no 'always hits' on Talk or Orders.

### 34. PR-0235 [polish, interface]

**PR-0235 (carried; R15-IF-05): the Darkness card says 'Costs the party HP'; only the user pays 12.5% of her max HP**

- Game: FFX-2 (the warning code path is shared)
- Chapter and state: XI Fallen Aeons (Shiva), Paine's turn
- Expected: Per research/ffx2-combat-core.md:340, the user spends 12.5% of her max HP.
- Observed: The next-best-move card reads 'Darkness -> all enemies ... Costs the party HP.'
- Repro: FFX-2 Ch XI, seed 1, 1600x900. Yuna uses Mega-Potion. Read Paine's card.
- Evidence: critic/rounds/round-15/evidence/extras-advisor-v3-megapotion/01b-next-card-while-Mega-Potion-charges.png
- Confidence: high
- Requirement: Interface: honest costs; AGENTS.md rule 6
- Where: src/engine/tactics/advisor.ts:823 generic warning
- Note: Carried from round 15. The candidate merged a fix (r29-text); its acceptance state was not captured on this candidate, so the issue stays open until observed.
- Smallest fix: Name the payer and the amount, e.g. 'Costs Paine 12.5% of her max HP'.
- Acceptance check: The Darkness card names Paine and the cost in Ch XI and VI.

### 35. PR-0237 [polish, interface]

**PR-0237 (carried; R15-IF-07): first-time coach bubbles cover faces or weapons**

- Game: both
- Chapter and state: FFX I (Auron bubble over Kimahri's and Yuna's heads, 2000x1012); FFX-2 XI (Rikku gauge coach over Paine's sword, 1600x900)
- Expected: No panel intersects a face or weapon (CHK-008).
- Observed: The coach boxes sit over the painted actors' heads or weapons while the player reads the menu.
- Repro: Fresh profile. Ch I at 2000x1012, first menu, press E. Ch XI at 1600x900, Item targeting.
- Evidence: critic/rounds/round-15/evidence/seymour-flux-win-drawn/12-intent-E.png; extras-advisor-v3-megapotion/01a-target-Mega-Potion.png
- Confidence: high
- Requirement: CHK-008
- Note: Carried from round 15. The candidate merged a fix (r29-input); its acceptance state was not captured on this candidate, so the issue stays open until observed.
- Smallest fix: Add the coach bubble to the actor safe-zone placement.
- Acceptance check: At 1600x900, 2000x1012 and 2560x1080, projected head and weapon rects do not intersect the coach box.

### 36. PR-0239 [polish, interface]

**PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3**

- Game: FFX-2 (the rail is shared)
- Chapter and state: XI Fallen Aeons, Rikku's Mega-Potion charging
- Expected: The two panels do not contradict each other about the same turn.
- Observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- Repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- Evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- Confidence: high
- Requirement: Interface: useful advice
- Note: Carried from round 15. The candidate merged a fix (r29-text); its acceptance state was not captured on this candidate, so the issue stays open until observed.
- Smallest fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- Acceptance check: In the same case, the rail and the card agree or the rail defers.

### 37. FOC28-P02 [polish, interface]

**FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone**

- Game: FFX
- Chapter and state: II and XIV Grand Summon picker, 390x844
- Expected: Legible and not clipped.
- Observed: Recorded by the focused review of this same build and still open.
- Repro: See critic/reviews/6ea8528f-focused.md.
- Evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
- Confidence: high
- Requirement: CHK-003
- Note: Carried from round 15. The candidate merged a fix (r29-input); its acceptance state was not captured on this candidate, so the issue stays open until observed.
- Smallest fix: As proposed in the focused report.
- Acceptance check: As proposed in the focused report.

### 38. PR-0262 [suggestion, narrative]

**PR-0262 (new; R16-FN-06): Tidus's aftermath reaction is 'That's it?' in four chapters**

- Game: FFX
- Chapter and state: I, III, VII and VIII aftermaths
- Expected: Aftermath reactions vary across the anthology.
- Observed: I: 'That's it? We just walk past them?' III: 'That's it? That's what ate the world?' (the bible gives this line to Rikku). VII: '...That's it?' VIII: 'That's it? We just won'. Played in order, the phrase becomes a tic.
- Repro: Read the dboxTimeline of the four wins.
- Evidence: critic/rounds/round-16/feel-narr/dbox-all.txt
- Confidence: high
- Requirement: narrative: character voice
- Smallest fix: Reword the Ch VII and VIII instances; keep III's bible line.
- Acceptance check: At most two chapters use the phrase.

### 39. PR-0217 [suggestion, combat]

**Carried and re-measured: Zombie is kept across a KO (unsourced); the Chapter II advisor revives KO'd Zombies 257-307 times per 40 seeds (was 452-501)**

- Game: FFX only
- Chapter and state: II Yunalesca (also I Seymour Flux)
- Expected: Sourced behaviour, or a labelled estimate.
- Observed: zombieReviveTopRows: Chapter II 257 and 307; Chapter I 46 and 46. There is no research change in this candidate.
- Repro: cd D:/pyrefly-rel28 && npx vitest run --config "D:/Final Fantasy/critic/rounds/round-16/combat/vitest.critic.config.ts" ffx-bench
- Evidence: D:/Final Fantasy/critic/rounds/round-16/combat/ffx-three-line-r16.json
- Confidence: medium
- Requirement: AGENTS.md rule 6
- Smallest fix: A research pass on Zombie at KO (GameFAQs first), and label the engine's current choice as an estimate meanwhile.
- Acceptance check: A tagged research line exists, and the engine and a unit test follow it.

### 40. PR-0227 [suggestion, encounter]

**Carried, information for Bailey: Chapter XIII is rarely won at human pace; real keys lost at seeds 1 and 1001 and won only on a drawn seed**

- Game: FFX-2 only
- Chapter and state: XIII Trema
- Expected: Bailey's knowing choice (D-151), not scored as a defect.
- Observed: Defeats at seeds 1 and 1001, a victory on a drawn seed. Bench reused from round 15: 1-3/40.
- Repro: D:/Final Fantasy/critic/rounds/round-16/evidence/runs-summary.json
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/runs-summary.json; D:/Final Fantasy/critic/rounds/round-15/combat-deep/out/ffx2-three-line.json
- Confidence: high
- Requirement: RUBRIC §6 encounter (information only)
- Smallest fix: None without Bailey's word.
- Acceptance check: Bailey's answer is recorded.

## Refuted, resolved, merged

Refuted by the confirmer (not filed as defects):

- **Chapter VII: party and enemy formations overlap on the battle stage (capture owner, major, R16-CAP-01).** I reproduced the composition, but it is the adopted layout, not a defect. The candidate's first-menu frame (evidence/seymour-anima-macalania-win/11-advisor.png, 1600x900) matches, figure for figure, the layout-B sheet that decision D-189 adopted: docs/concepts/chapters/macalania/unlock/party-layout/b-1600x900.jpg. In both, Tidus is in front of Guardian A's staff and Rikku is in front of Seymour's robe. D-189 is Bailey's word, 2026-09-25, 'All your recommendations'. It is coded as MACALANIA_PARTY_LAYOUT='b' in src/scenes/macalania-temple-layout.ts:99, with pinned enemySpots. The figures overlap in depth (the party in front, the fiends behind), which is the picked staging. They do not collide. On the phone, the at-rest frame (win-touch/11-advisor.png) does not show Guardian A covering Yuna. In the targeting frame (16-target-single.png) Guardian A stands beside Yuna, and the tap-hand icon covers her arm, not his sprite. Changing the spacing would mean a new layout option for Bailey (rule 9); this should not be filed as a major defect against the approved target. If anything, it is an observation for the tile's 'inferred' notes, because the pick was a blanket one. No new browser run was needed: the candidate frame already exists and matches the approved sheet. D-189 was a blanket pick ("All your recommendations"): does layout B's at-rest depth overlap (Tidus in front of Guardian A's staff, Rikku in front of Seymour's robe) read as intended? An inferred item, never a failure (RUBRIC §7).
- **Phone: tapping Yuna while targeting allies in Chapter XII lands on Auron (capture owner, major, R16-CAP-02).** This is a Playwright actionability artifact, not a player problem. I reproduced it on the candidate (dist-gate served by vite preview on 127.0.0.1:5731, PYREFLY_BROWSER=gpu, headless, 390x844 with hasTouch and isMobile, seed 1, real keys to the first menu, real taps on Items and Hi-Potion). At Yuna's reticle centre (151.5, 310), elementFromPoint is Auron's reticle, as reported, which is why locator.tap refuses with 'intercepts pointer events'. A real finger tap, page.touchscreen.tap at that same point, resolved to Yuna. The battle log shows action-start item hi-potion targets ['yuna'] and a -1000 damage event on targetId 'yuna'. Evidence: critic/rounds/round-16/evidence/confirm-tap/seymour-omnis-yuna.json and seymour-omnis-yuna-{before,centre}.jpg; script cap/confirm-tap.mjs. The game picks the target from the touch point, not from the topmost reticle, so PR-0232's ally case works for a player. The route's 13 'blocked' taps and its phone losses are the harness falling back to keys, not taps that miss. Minor residual: a tap on a non-cursored ally confirms at once instead of moving the cursor first. That is not what this finding claims. PR-0232 resolved; the harness defect is PR-0261.
- **Phone: the advisor names moves below the 6-row window (capture owner, major, R16-CAP-03).** The advised rows can be reached by touch. The route's 31 misses come from the harness, which only taps and never swipes. Candidate: vite preview 5731, gpu, headless, 390x844 touch, seed 1, Chapter VII by real keys, a real tap on Items. The window showed Potion to Ether plus a down mark (.ffx-cmd-more--down, drawn at the grid's right edge, src/ui/ffx/phone-hud.css:280). Vertical touch drags (CDP Input.dispatchTouchEvent) on .ffx-cmd-area step the list, via dragList '.ffx-cmd-area' in src/ui/ffx/phoneHud.ts:55 and src/ui/common/phoneBattle.ts:177. Two 150 px drags brought ECHO SCREEN, SOFT, GRENADE, PETRIFY GRENADE, SILENCE GRENADE and POISON FANG into the window. Evidence: critic/rounds/round-16/evidence/confirm-drag/seymour-anima-macalania-Items.json and the before and after-drag jpgs; script cap/confirm-drag.mjs. The finding's own bar is 'can be reached by touch, or the card says how', and the first half holds. Minor, unfiled: further drags wrap the list back to the top, and the card does not say 'swipe'. That is a discoverability polish item, not a major. The harness should learn to swipe before this is re-measured. Downgraded into PR-0218 (polish, discoverability).

Resolved this round: PR-0221 (visual auditor: every pre-scene speaker portrait, every backdrop, the Until Dawn close-up (20/20, 15/15, phone) and the board plates paint on this candidate); PR-0226 (audio auditor: 30 of 30 fight ends after an Esc pause fade the battle cue, never pause (round 15: 3 of 52 stuck); gap pass: Esc 3 ms after the first menu and Esc-Esc keep the battle theme); PR-0219 (capture owner: FFX-2 Ch IV won by the gamepad shim, 199 pad presses (round 15: 0 party actions)); PR-0232 (confirmer: a coordinate touch at Yuna's reticle centre in Ch XII selects Yuna (confirm-tap/seymour-omnis-yuna.json)); PR-0233 (gap pass: Mortiorchis plate open at 1600x900, 2000x1012 and 2560x1080, zero intersections with turn-list names); PR-0179 (combat auditor: all 100 cells of the Zanarkand and inside-Sin rows equal research §6.4.3; aeon HP rises through the story); PR-0203 (audio and delivery auditors, chief: fresh profile 0.35; D-210 migration proven by the save matrix and the e2e spec); PR-0224 (delivery auditor: 0 missing-file requests in 23 runs, Trema wedge filled); PR-0236 (interface auditor: Orders used 5 times in Ch VIII, 'Already near' and 'THIS ORDER COSTS' legible (the all-refused state is not captured)); PR-0238 (interface auditor: the PAUSE chip is an ink chip in every capture); PR-0241 (prep auditor: 'no full turn taken · no AP' on Natus Kimahri and Omnis Tidus); PR-0242 (visual auditor: the Ch IV pause plate is pixel-identical to its tile (D-257); gap pass: CHAPTER tab full-bleed at two sizes); PR-0230 (narrative auditor: eyebrow reads 'CHAPTER V · THE FARPLANE GLEN'); PR-0231 (narrative auditor: Auron says 'It hits all of us. Keep everyone up.'); PR-0058 (narrative auditor: Brother, Buddy and Shinra carry the 'Gullwings' plate; Shinra is name-only because no painting exists (a painting would be a new art decision)); PR-0225 (capture owner: the harness now plays Overdrive pickers, escapes dead menus and steers to lettered targets; Ch III won by real keys with 6 seams).

Did not recur: PR-0229 (feel auditor: new outfit 287-562 ms after the flash in Ch IV (pad), XV, XVI (round 15: up to 1.8 s)).

Merged: R16-FN-01 (feel, major) + R16-VIS-02 (visual, polish) -> PR-0243 (scored under feel); PR-0240 + capture owner's '10 Mbps cold cache 18.8 s' -> PR-0240; R16-IF-03 + capture owner's phone confirm-label clip -> PR-0246; R16-IF-06 + capture owner's FFX-2 intent panel + interface CHK-008(c) -> PR-0249; capture owner's harness timeout finding + the confirmer's swipe/coordinate-tap findings -> PR-0261. Downgraded: capture owner's PR-0218 major -> PR-0218 polish (reachable by drag; discoverability only); gap-pass minors (Anima phone framing, pause tab at 390) -> polish (rubric has no minor severity).

Stalled (open at the same severity in rounds 15 and 16; the next batch in these areas starts with a method check): PR-0148, PR-0099, PR-0039.

## What stands between this build and acceptance

- Audio has no number: CHK-B1 needs Bailey's numeric verdict on the shipped mix (PR-0148); 9 chapters still borrow cues (PR-0099).
- Seven categories are below the 9.0 floor: visual 8.7, feel 8.1, narrative 8.7, interface 8.2, onboarding 7.5, prep 8.9, delivery 8.6.
- Ten majors are open; three of them (PR-0243, PR-0244, PR-0245) are in the new Chapter VII and have small, well-located fixes.
- Mandatory checks still FAIL (CHK-001, 003, 004, 008, 009, 012) or are UNVERIFIED (CHK-002, 005, the pad half of 023, B1).
- 18 required targets unverified and 5 waiting on a decision; human judgments B1, B2, B3 and two option rounds are not recorded.
- The exact deployed artifact has to pass live verification (CHK-017).

## What changed since round 15

Round 15 reviewed live 6ea8528f and left its deep obligation pending for untested coverage. This candidate closes that coverage: Chapter III won by real keys with the FFX ending aftermath, Chapters XII and XIII won with their aftermaths, the Chapter VIII loss and RETRY, the Ch XVI whistles and Ch V coda through the real presentation path, and load and frame time measured on named conditions. Resolved: PR-0219, 0221, 0226, 0232, 0233, 0179, 0203, 0224, 0236, 0238, 0241, 0242, 0230, 0231, 0058, 0225; PR-0229 did not recur. The target gate went from 7 failing to 0. New: Chapter VII is playable end to end, with three majors of its own (wrong opening subject, invisible aftermath staging, revive advice on a KO'd enemy) and nine polish items. Category movement is stated inside each category's evidence (for example interface 7.8 to 8.2, prep 8.6 to 8.9, delivery 8.2 to 8.6); no comparison is made with rubric v1 rounds 02 and 03.

## Proposals (nothing here is built without Bailey's yes)

- **Songstress paintings for Rikku and Paine (PR-0228).** Benefit: removes the only grey placeholder mannequin a player can reach (CHK-012). Cost: an options round plus two ComfyUI paintings when art generation is on. Source-game fit: canon: all three can wear Songstress in FFX-2. Risk: none to approved art. Preview: 2-4 painted options at gameplay scale beside yuna-songstress.
- **Accessibility rows in OPTIONS (PR-0032).** Benefit: reduce-motion and low-effects already exist in SaveData; exposing them is small. Cost: rows now; text scale and remapping need a mockup. Source-game fit: both games. Risk: screen change needs Bailey's yes (rules 9, 10). Preview: a mockup of the OPTIONS column with the two rows.
- **Build-time derived WebP art for the board strips and backdrops (PR-0240, builder proposal 1).** Benefit: cuts about 90 MB board and 6 MB backdrops to about 1 MB each; brings the 10 Mbit/s load toward 5 s. Cost: an art-pipeline step; approved originals untouched. Source-game fit: both. Risk: must be a recorded authorised transformation (RUBRIC §7). Preview: side-by-side of an original and its derived WebP at display size.
- **One audio question for Bailey (PR-0148).** Benefit: turns CHK-B1 from UNVERIFIED into a number. Cost: one message with the audition page. Source-game fit: both. Risk: none. Preview: a number out of 10 for the shipped mix, and whether remaster R1 should apply to the whole pack.
- **Chapter VII Talk lines for Tidus, Yuna and Wakka (PR-0254).** Benefit: the Talk chip promises speech; Chapter X already voices it (D-203). Cost: three short exchanges. Source-game fit: FFX only. Risk: new content: ask whether D-203 covers Chapter VII. Preview: the three exchanges as text.
- **Chapter III possessed-aeon length (PR-0257).** Benefit: information only unless Bailey wants options. Cost: a 200-seed per-link bench per option. Source-game fit: FFX; sourced rows stay. Risk: never tune boss numbers without Bailey. Preview: measured per-link turn counts.

## Housekeeping

Every server started for this review was stopped by its own listening PID and its port confirmed closed: 5617 (PID 39584) and 5618 (PID 60472) by the capture owner, 5731 (PID 19316) by the confirmer, 5733 (PID 73460) by the gap pass, and 5741 (PID 23388) by the chief after the e2e save spec; a final check found no listener on 5400-5990. Browser mode: headless Chromium from node, PYREFLY_BROWSER=gpu (ANGLE D3D11), no fallback. Nothing was deleted, committed, pushed or deployed; no file under critic/pending was touched by hand.

## critic-clear output

```text
critic:clear no pending marker for build 49005f73: kept as candidate evidence
```
