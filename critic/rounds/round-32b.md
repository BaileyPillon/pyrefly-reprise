# Round 32b: deep re-issue of round 32 for the live build e3f51bf18 (releases 69 and 70, bundle UNVtEttT)

```text
Supersedes: round-32 (same build, same artifact hash; the bundle was re-curled at the start and at the end of the gap pass; precedent round 30b, rounds 18b and 19b)
Build / artifact / target version: main e3f51bf18, bundle index-UNVtEttT.js, artifactHash 5720fa8287425ebb9f9b1575590436bf66d7a245d686bca9c6471beab55d1fe4, targets.json sha256 1b09ad4e5a0315f4233b38cdaccc5a6ce2c3854fe9d5a6f21db39145ad6ca5b2
Review: deep (the live build https://echoesofspira.com/, owed since release 68; carries the obligations of releases 69 and 70)
Deployment: PASS (exact live artifact: 7,169 files compared at deploy, bundle re-curled twice, 42 of 42 sampled files sha256-equal, 0 console errors in every job)
Changed area: FAIL (CHK-003 clipped half and CHK-009 = PR-0586, CHK-020 = PR-0543, CHK-008, CHK-011, CHK-026, CHK-027; CHK-002, CHK-006, CHK-018, CHK-019 and CHK-022 now PASS)
Ship: SHIP (no critical defect; no new major; PR-0581 and PR-0582 are regressions inside the release-70 booth treatment, a brand-new switchable feature); majors disclosed: PR-0581, PR-0582, PR-0531, PR-0380, PR-0379, PR-0148, PR-0567, PR-0295, PR-0570, PR-0517, PR-0459
Milestone: not assessed (a deep review cannot accept one)
Quality: PROVISIONAL, no full score; scored categories: combat 9.4, encounter 9.2, visual 8.3, feel 7.8, narrative 8.8, interface 7.9; UNVERIFIED (no number, never averaged away): audio, onboarding, prep, delivery
Targets: required 18 / matched 15 / failing 0 / unverified 3 / waiting 2
Top issues: PR-0581 Braska Tidus teleports 302-417 px; PR-0582 Ixion KO slide 80-91 px; PR-0531/0380/0379 pose-swap continuity (13 and 8 of 19); PR-0148 no listening verdict; PR-0567 phone load 11.1 s / 18.4 s (improved, budgets missed); new: PR-0598 key prompt strip hidden from link 2 of an F1 chain, PR-0599 Chapter V link 5 retry 38.6 s
Coverage: 19 of 19 chapters by real keys; lose-and-retry at a later link in 9 of 9 chained chapters; six-size pause matrix; legibility sweep of 51 surfaces; overlay exits in three chapters; pause and prep tabs by key and tap; live cold and phone load; not tested: see below
Next required review and why: the harness on Chapters III, VII and XIV after any change to the booth holds; the four UNVERIFIED categories; Bailey's listening verdict (CHK-001, CHK-B1); the fixes of PR-0586, PR-0598, PR-0599 re-read on live
Elapsed review time / repeated work avoided: chief 45 min for the re-issue; lanes ran separately; the round-32 capture, harness and engine evidence is reused unchanged for the checks that did not need re-running (PASS only by dependency arguments recorded below)
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
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - 11 critical or major issue(s) remain open
  - 3 required target(s) unverified
  - 2 required target(s) waiting
  - only 15 of 18 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148)
  - human judgment not recorded: Art and feel: the still beside Chapter I of the treated arenas' grade (booth-ffx-b3b J6, PR-0585), and whether the release-70 Braska and Isaaru holds stay on while PR-0581 and PR-0582 are open
  - human judgment not recorded: Feel: are the planned smear hard cuts (22.5 a minute), the pro camera shots and the big turn cut-in the look he wants (PR-0530, PR-0521, PR-0536; CHK-B2)
  - human judgment not recorded: Feel: is Yuna's dress change a hard swap under a flash, or should it blend (PR-0589)
  - human judgment not recorded: Art: should the Rikku Dark Knight and Paine Warrior ready and attack poses be repainted or only registered (PR-0517)
  - human judgment not recorded: Audio: keep or change the silent Chapter IV results screen (PR-0504)
  - human judgment not recorded: Audio: the sound pass in the ten treated chapters, by ear (PR-0588)
  - human judgment not recorded: Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
  - human judgment not recorded: Narrative: portrait expression on grief lines in both games (PR-0485)
  - human judgment not recorded: Accessibility: do COLOUR VISION, TEXT SIZE, REDUCE FLASHES and REDUCE MOTION do what he wants (PR-0503, PR-0559)
  - human judgment not recorded: Interface: build key remapping (the mock shows REMAP KEYS) or drop the line from the rubric reading (PR-0596)
report: valid evidence
```

## Verdicts
- **deployment**: PASS: CHK-017 PASS kept from round 32 (the deploy-time live check compared 7,169 files with 0 console errors). Re-checked in this pass: the live page served index-UNVtEttT.js at the start (04:41 EST) and again at the end (index-UNVtEttT.js); the dist-release manifest hash 5720fa82... equals the pending marker's and 42 of 42 files sampled from the live site were sha256-equal to it (G1); every gap job (G1 to G4) read index-UNVtEttT.js and ended with 0 console errors.
- **changedArea**: FAIL: CHK-003 (the clipped half: the F1 selected-label cut, PR-0586), CHK-009 (PR-0586), CHK-020 (the FFX target step has no Enter/Esc strip, PR-0543), CHK-008, CHK-011, CHK-026 and CHK-027 FAIL. CHK-002 (six sizes), CHK-006 (overlay exits in both games), CHK-018, CHK-019 and CHK-022 (later-link retry in 9 of 9 chained chapters) now PASS. Combat and encounter changed nothing and re-measured identical in round 32. CHK-001 and CHK-B1 stay UNVERIFIED, filed non-mandatory by reviewer judgment in the form of round 30b; they pass nothing.
- **ship**: SHIP by the rules: no critical defect was found in round 32 or in the gap pass, and the gap pass found no new major. PR-0581 and PR-0582 stay the two majors that are regressions against release 68; both sit inside the release-70 booth treatment, a feature that did not exist at release 68 and can be switched off per chapter (PieceHolds; ?treated=pack is clean), and a defect inside a brand-new feature does not block. The new findings are minor or polish: PR-0598 (the key prompt strip hidden from link 2 of an F1 chain) sits inside the F1 HUD's new reach into chained chapters; PR-0594, 0596, 0597, 0599 to 0602 are older than the candidate or not regressions. The chief repeats the round-32 advice that release 71 not widen the ProneLay or return-flip behaviour until PR-0581 and PR-0582 pass the harness.

Ship reasons:
- No critical defect found in round 32 or in the gap pass: 19 of 19 chapters won by real keys, a lose-and-retry at a later link read in 9 of 9 chained chapters (every retry returned to the expected link with its boss, music and a clean first menu, 0 console errors), the six-size pause matrix and the overlay exits are clean, the whole shipped image set loads in Chromium and WebKit (5,502 of 5,502), the engine probes were md5-identical to round 31 and the unit suite had 0 failures.
- The two major regressions against release 68 (PR-0581 Braska, PR-0582 Ixion KO slide) are inside the release-70 booth treatment, a feature that did not exist at release 68 and can be switched off per chapter; by RUBRIC section 3 a defect inside a brand-new feature does not hold the build. They are disclosed and carried into the next batch, and the chief asks that release 71 not widen the behaviour that causes them.
- The gap pass found no regression outside a new feature: PR-0586 and PR-0598 are inside the F1 HUD's reach into more chapters (new in releases 69 and 70) and minor; PR-0594, PR-0596, PR-0597 and the phone findings PR-0600 to PR-0602 are older than the candidate.
- CHK-026 (13 of 19 chapters) and CHK-027 (8 of 19) fail and are carried; the build is better than release 68 on the carried defects (swap jerks 66 to 34, see-through time 1,689 to 1,623 ms a minute, snaps 0.00 a minute) and worse in Braska, Anima and Isaaru.
- Four categories stay UNVERIFIED and CHK-001 and CHK-B1 need Bailey's ears, so no milestone claim is made (milestone not assessed).

## What the gap pass settled
Round 32 shipped (SHIP) but left the focused and deep obligations of e3f51bf18 open: nine mandatory checks UNVERIFIED and six categories with no number. This re-issue, built after four gap groups on the live bundle (G1 static, G2 layout, G3 chains and overlays, G4 walks) and the auditors' saved results, replaces them:
- **CHK-002 PASS** (G2): the pause plate at 390x844, 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160 (plus 1440x1080, 2560x1440, 3440x1440), each in a fresh browser; slid and capped cases read; no sideways scroll.
- **CHK-003 FAIL** (G2): zero text under 14 px on 51 surfaces (3,474 elements); one real clipped label, the Isaaru SPECIAL command (PR-0586).
- **CHK-006 PASS** (G3): overlays left four ways in Chapters I, IV and VI (52 asserts, 51 ok, the miss a hook losing the fight); the stale victory-state class that hides the key prompt strip from link 2 of an F1 chain is filed as PR-0598.
- **CHK-018 PASS, CHK-019 PASS** (G1): art-derive audit and verify, the whole shipped image set in Chromium and WebKit (5,502 of 5,502), the manifest decode check, 42 of 42 live files byte-equal.
- **CHK-020 FAIL** (G1, G4): the FFX target step has no Enter/Esc strip (PR-0543, polish, open since 30b); everything else paired is the same screen or a deliberate game difference.
- **CHK-022 PASS** (G3 and the assembler's extension): a lose-and-retry at a later link in all 9 chained chapters returned to the expected link each time; PR-0587 closed; PR-0598 and PR-0599 filed.
- **CHK-001 and CHK-B1 stay UNVERIFIED**, filed mandatory:false by reviewer judgment: Bailey's own listening verdict (PR-0148). Precedent: rounds 04, 05, 06, 12, 13, 22, 23, 28 and 30b; ratified by the driver (decision 212l). They pass nothing and stay owed.
- **narrative 8.8 and interface 7.9** are scored from the saved auditor results; **audio, onboarding, prep, delivery** stay UNVERIFIED in their auditors' words (the gap evidence is recorded in each category's text as a supplement; no auditor re-scored them).
- **Issues**: 49 auditor issues merged by substance (4 new: PR-0594 to PR-0597; 6 extensions; 1 superseded; 39 duplicates), a PR-0503 stale sentence corrected, 5 new from the gap groups (PR-0598 to PR-0602), 3 closed by evidence (PR-0559, PR-0587, PR-0520).

## The ten categories
| Category | Score | Status |
|---|---|---|
| combat | 9.4 | scored |
| encounter | 9.2 | scored |
| visual | 8.3 | scored |
| feel | 7.8 | scored |
| narrative | 8.8 | scored |
| audio | no number | UNVERIFIED |
| interface | 7.9 | scored |
| onboarding | no number | UNVERIFIED |
| prep | no number | UNVERIFIED |
| delivery | no number | UNVERIFIED |

### combat
Combat auditor, round 32 (tree HEAD 58e28ccef, git diff e3f51bf18..HEAD empty for src, tests, tools, research, critic/runner). git diff 2a9340249..e3f51bf18 is empty for src/battle, src/engine/tactics, src/story, research and src/data (one 3-line art registration excepted): the 61 changed src files are presenter, staging, HUD ribbon, load order, pose holds and look code, none of which emits, reorders or alters a BattleEvent or touches the seeded RNG. All 16 engine probes and both parity measures re-ran md5-identical to round 31 (kernel 478 checks and kernelx2 68 checks 0 mismatches; immunefuzz 51,782 forks 0 friendly fire). Full unit suite on this tree, serial at testTimeout 240 s: 28,004 tests, 27,850 passed, 0 failed, 153 skipped, 1 todo. orphans: 24 pre-existing, none of HeadlineBoss, LoadHold, LeaveRelease, BackgroundQueue, EntryMarks, PieceHolds. 19 chapters won by real keys, 0 NaN or undefined in 25 battle logs. Held back: the Items-list touch path is only partly exercised (PR-0483), later-link retry unverified (PR-0587), Chapter III possession Summon rows unseen in a browser (PR-0460), the 2560x1440 crash unreproduced but unproven (PR-0565). Nothing found a combat defect, regression or lock.

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): the retry from a later link of a chained chapter that was held back (PR-0587) is now read on the live bundle in all 9 chained chapters (G3) with equal rewards on the retried wins; the score is not re-written by the combat auditor.

### encounter
Encounter auditor, round 32. Data, AI scripts, phases, rewards and the chapter registry are byte-identical to round 31. Intended-line win rates re-measured (engine, FFX 200 seeds 5001-5200, FFX-2 100 seeds): Seymour Flux 200/200, Yunalesca 180, Braska 197 (chain 95/100), Anima 189, Evrae 194, Yojimbo 196, Natus 190, Omnis 174, Via Purifico 180, Sin core 178, Sin face 200, Mirror Aeons 148; FFX-2 Bahamut 100, Vegnagun 99, Leblanc 100, Fallen Aeons 100, Trema 71, Den of Woe 100, Ixion 100. Credible wrong lines lose (attack-only 0/40 in 11 of 12 FFX chapters). All 19 chapters reached results by real keys; Yunalesca seed 1 lost (the capture bot walked into Mega Death) and seed 3 won; Mirror Aeons needed a 40-minute budget (PR-0592). New Leblanc chain: the links name their own boss in the ribbon (Ormi, then Logos), 13 abilities all in research/ffx2-leblanc-syndicate.md, rewards 900 EXP, 780 gil, 6 AP. Chapter VII ribbon names Seymour while both Guardians stand (HeadlineBoss). Held back: Trema about 60 percent at human pace, Mirror Aeons 74 percent and a 20-minute fight, Omnis 87 percent, Den of Woe 95 percent, hidden chapters that do not punish credible mistakes, demo mode 50 percent gauges, the stale research/ffx2-bahamut.md, and retry from a later chained link (PR-0587).

### visual
Visual auditor, round 32 plus the chief's reading of the harness numbers. Approved art intact (ROOT=D:/pyrefly-release55 verify-approved: 917 ok, 0 mismatched, 0 missing). Credits: gated swap jerks 66 to 34 against round 31, snaps 0.00 a minute, ghosting 1,689 to 1,623 ms a minute (worst severity 0.367, under 0.4); Leblanc (new) PASS on both continuity checks; Bahamut, Natus, Omnis PASS. Debits: PR-0581 and PR-0582 (release-70 booth holds), Braska reads worse than round 31 (PR-0583, PR-0584), CHK-026 FAIL in 13 of 19 chapters (445 head swaps, mostly Lulu's rig head; Trema Paragon feet 10.4 px) and CHK-027 FAIL in 8, treated arenas much darker than the approved backdrops (PR-0585, Bailey's call), carried overlaps (CHK-008 FAIL). 18 target composites: 15 matched, 3 unverified, 0 failing. Not seen: a settled party-prep frame, a Shuyin dialogue portrait, Leblanc at 2560x1440 beyond the first menu. Net 8.3, 0.1 under round 31: the swap-jerk and ghosting gains do not offset the Braska and Ixion regressions while CHK-026 fails in 13 chapters.

### feel
Feel auditor, round 32, from files only. Real keys on 19 chapters, two retries, 0 console errors, 0 404s in every run. Leblanc: boss card to stage dissolve, the Darkness Dance and Shield Bash labels and MISS pop read cleanly, the menu is back inside about 2.4 s. Chain seams paced (Leblanc 2 seams at 100.7 s and 211.8 s; Braska 6; Vegnagun 4). Retry: Chapter I defeat panel 1.0 s after the last KO and TRY AGAIN to first menu 9.7 s (PR-0590, noisy lane), Chapter IV 9.9 s. HOLD ENTER skips and ESC opens pause in all 19 chapters. Live-gap lane on the same bundle for Braska and Isaaru only: Braska teleports of 306 to 417 px and 254 to 290 px hops (PR-0581), Isaaru 89 to 91 px KO slide (PR-0582). The chief confirmed both against the harness run of the same bundle (3 teleports 302 to 340 px; Isaaru 89.6 px; Anima 80.3 px). The first-time-fan lens adds the camera cuts, dress-change pop and turn cut-in (PR-0521, PR-0589, PR-0536). Scored 7.8: animation and camera are capped below 7.5 by CHK-026 and the planned cuts, and the two release-70 regressions sit in the third and fourteenth chapters.

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): G3 read the chain seams and retries: every retry returned to the expected link in 10 to 17 s (Chapter V link 5 took 38.6 s, PR-0599) and the F1 key prompt strip is hidden from link 2 of an F1 chain (PR-0598); not re-scored.

### narrative
Round 32, LIVE build e3f51bf18. DEPENDENCY ARGUMENT for the unchanged text (reused from round 31, 8.8, itself reused from 30b): git diff --stat 2a9340249..e3f51bf18 over src/story, research/writing-bible.md and src/data/encounters.ts is EMPTY, so every script and the bible are byte-identical to the ones round 31 read; releases 69 and 70 changed motion, camera holds, HUD headline, rig scripting and load order, not a line of text; no open related defect except the carried portrait-expression polish (PR-0485). FRESH REAL-KEY EVIDENCE this round, played by real keys on the live site: pre-scene, scene skip (ESC opens pause, HOLD ENTER skips), results, Confirm, post scene, chapter select and clear kept after reload for 17 distinct chapters plus extra viewport runs (CHK-022): Chapter I seymour-flux (Kimahri's 'Kimahri knows this one. And this one.'; post 'You can't send what refuses to go.', then Zanarkand 'You are a dream.'), II yunalesca (seed 3 victory: 'There. Now no one can summon it.'; seed 1 lost at 98 turns to the pro-defeat card, a capture-bot loss), III braska (post 'Is that it? Did we—', Auron 'Overdue. By ten years.'; results AP 0, gil 0 as the sourced record), IV bahamut (card says 'Results', no victory word or quip, Rikku '...Yunie.', per the bible E6 ban), V vegnagun-shuyin ('(Whistle)', the Farplane coda; results '...Let's go home.'), VI leblanc (new in r69; original text: 'Pink. They rob us, and I have to wear pink.' / 'It suits you.', post 'That's for robbing our airship!', 'She means Noo—' / 'Ormi.' / '...Right. Nobody.', last beat 'I still hate the pink.' / 'Keep it. It suits you.'; the comic tone fits FFX-2 and Leblanc's known fondness for Nooj, and no bible line is contradicted), VII anima-macalania, VIII evrae, IX yojimbo-cavern ('She's gone. Truly, this time.'), X natus, XI fallen-aeons, XII omnis ('So. This is how it ends for me.'), XIII trema, XIV isaaru ('No. Please. Keep that for the road ahead.'), XV den-of-woe, XVI ixion-djose, XVII sin-fins-core, XVIII sin-face and the mirror-aeons hidden chapter (rerun with a 40-minute budget; first run stalled at the 15-minute default budget, a budget not a hang). Every one reached its aftermath, results and chapter select with the clear kept after reload; 0 console errors, 0 not-found. Tone by game: FFX chapters carry the grim register (Seymour, Yunalesca, Isaaru), FFX-2 Chapter IV carries none and V a quiet one, VI to XVI the lighter Gullwings banter with grief held where the bible calls for it (Den of Woe 'Two years I thought they chose it.'; Trema 'Why do you fight, if not to forget?'). Short one-line scenes before results in Den of Woe ('No.', Paine, script line 16) and Trema ('Hole in the floor. Out.', script line 182) are in the scripts and are by design. NOT RE-SCORED: phone scene reading (the phone touch runs were lost before any post scene), Chapter I phone retry text; portraits still do not change expression with grief lines (PR-0485, carried; the dialogue box shows one portrait file per speaker). Score 8.8 unchanged: the writing is original and consistent, aftermath reachable everywhere; held under 9.0 by the carried portrait expression, the human judgment on grief-line expression not recorded, and no phone-scene evidence.

### audio
UNVERIFIED, no number. I cannot hear and no agent heard anything; I opened no browser (read the capture owner's AudioManager snapshots and network lists from PYREFLY_BROWSER=gpu headless Playwright runs; ffmpeg/node/curl/vitest only). There is still no numeric owner listening verdict for this mix. docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; the only number is the music-only 7/10 of 2026-10-13 (D-804), older than the re-rendered victory cues, SFX and voice passes and the conference sound pass; D-1371 says CHK-B1 cannot be delegated. Approving a direction is not a score, so nothing is averaged or zeroed.

TECHNICAL (my own run, critic/rounds/round-32/audio/): (1) tools/audio/qa.mjs --strict exit 0: 43 music cues, 0 with findings, 0 sfx findings; integrated -16.21 to -16.01 LUFS; worst true peak -1.48 dBTP (boss-sin-countdown); 0 clipped samples; loop seams 43 of 43 ok; SFX sprite 134 cues peak -1.13 dBTP; v2 sprite 92 cues -1.11; 9 parity packs findings-free; 222 voice lines + 9 voice-pass lines; 71.61 of 105 MB. (2) All 319 mp3 under public/audio decode with 0 ffmpeg errors (34 are unshipped candidates). 300 of 300 shipped audio entries of critic/artifacts/e3f51bf18.json are sha256-equal to public/audio and to round 31's manifest (0 differ), manifest decodeChecked true, audioUnverified 0. (3) LIVE https://echoesofspira.com/: curl HEAD on all 300 shipped audio files returns 200, correct content-type and content-length equal to the local size, 300 of 300 (head.log). (4) themes-audit: 0 chapters depart from the chapter cue map (Leblanc, Anima, Natus, Trema, Isaaru, Den of Woe, Ixion among the rows; several are 'borrowed; owed' as before). (5) vitest audio-pass*, audio-shipped-files, audio-cue-reachability, audio-leblanc-one-music, booth-treated*, pause-music, ffx-pass-state, audio-manifest: 14 files, 235 tests pass.

CHANGE SCOPE: git diff 2a9340249..e3f51bf18 over public/audio, tools/audio, docs/audio is empty; src/audio changes only passSwitch.ts, where audioNewOn() went from 'a booth chapter' to isTreatedChapter(run,'audio'). So the shipped cues are the ones round 31 measured, but the SOUND PASS (+4 dB master makeup before the limiter, -14 dB voice duck, layered hits, UI family trims, music dip before big blows, FFX victory cue started at the last blow in place of the sting) now reaches all ten treated chapters on desktop (r69 Leblanc; r70 Yunalesca, Braska, Anima, Natus, Isaaru, Trema, Den of Woe; no PIECE_HOLDS row holds 'audio'). Every pass number was measured on Chapter I and IV fights only (passMix.ts header).

ROUTING (CHK-001/023; 26 runs, 171 AudioManager snapshots, seed 1, real keys): every cached track in every snapshot has source 'prerendered' (238 entries, 0 synth); ready true, context running, not muted, volumes master 0.8 music 0.7 sfx 0.7; notFound [] and htmlImages [] in all 26 network lists; 0 console errors (logs). Right cue at each moment: first battle menu plays scene-then-boss as designed in every chapter (Leblanc scene-chateau-leblanc then boss-leblanc and boss-leblanc through seams 2 and 3; Yunalesca scene-zanarkand-dome then boss-challenge; Anima scene-macalania-temple then boss-seymour-macalania; Natus boss-seymour-natus; Isaaru boss-isaaru; Den of Woe boss-den-of-woe; Fallen Aeons and Ixion boss-ffx2-fallen-aeons by the data (sourced mood); Evrae boss-evrae; Sin boss-sin-countdown / boss-sin-assault). Trema plays scene-bevelle-underground at the first menu (Paragon link) and boss-trema from seam 2: this is chapter data TR16 a, not a fault. Braska boss-jecht, then silent at seam 2 (the scripted valefor-enters scene, +0/+1.5/+3 s, same as round 31), then boss-yu-yevon at seams 3 to 7. Chapter V boss-vegnagun at seams 2 to 5; boss-shuyin requested but its playing is not sampled (carried). Mirror Aeons boss-challenge then boss-yojimbo. Wins end on victory-ffx (FFX) or victory-ffx2 (Leblanc, Trema, Den of Woe, Fallen Aeons, Ixion, Vegnagun); Chapter IV desktop wins are silent at results (PASS_SILENT_WIN, D-1294/D-1352, quiet results) and the 390x844 touch win plays 'pause' because the pass is off on phone class (packDefaultOn is desktop only). Losses: defeat-ffx at the Flux phone results, defeat-ffx on the Yunalesca seed-1 loss as boss-challenge fades. In Anima and Natus after-fight snapshots victory-ffx is already fading while the non-treated Omnis shows the 'victory-fanfare' sting at the last blow: proof that the pass's victory-at-last-blow routing is live in the treated chapters. Voice: asked equals started and every play ended or stopped with cache.failed 0 in 23 of 26 runs; Mirror Aeons (both runs) and Sin face show started = asked + 1 with one unlogged start, while a pre-scene Esc skip happened; not audible-proved, not filed as a defect, noted for the next voice capture.

NOT EVIDENCED (UNVERIFIED, capturesNeeded): title/chapter-select/pause playing state, the retried fight's theme after a loss, a dense last-blow-to-results music timeline, master loudness and true peak of the pass in any newly reached chapter, boss-shuyin and the ending beds playing, and Bailey's ears. Verdict: technical health and routing are sound for what was sampled; the listening half decides the number and has no owner verdict.

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): G4 (4e) read the audio state on the live bundle: no music at the title before any key and 0.7 s after the first Enter, the chapter-select cue from about 1.5 s after the board at gain 1, the four audio files fetched on the way 200 audio/mpeg, no audio error; Chapter V reached link 5 with boss-vegnagun for links 1 to 5, silence 26.4 to 40.8 s while the entrance scene owns the music (track null by design) and boss-shuyin at gain 1 at the first menu. G3 read the retried-fight theme in every retried chain: it equals the chain's boss theme. Still not evidenced: master loudness and true peak of the pass in any newly reached chapter, a dense last-blow-to-results music timeline, ending beds, and Bailey's ears. UNVERIFIED stays.

### interface
Round 32 deep review, live build main e3f51bf18 (bundle index-UNVtEttT, release 70), https://echoesofspira.com/. I opened no browser. I read the capture owner's evidence (critic/rounds/round-32/evidence: index.json 694 frames, 683 asserted-and-verified, 11 UNVERIFIED and not used; PYREFLY_BROWSER=gpu headless Playwright; injected 0 on every frame; 28 run.json) and the r31 live stills of the same code for the surfaces that did not change. Sizes SEEN: 1600x900 (all 19 chapters), 2000x1012 (Chapter I and IV), 390x844 touch (Chapter I twice, Chapter IV once). NOT SEEN: 4:3, ultrawide, 1440p, 4K (the rotating deep shapes were not captured this round; r31's six-size sweep is reused, see reused). I also re-ran tests/unit/advisor-ownership.test.ts and advisor-degenerate-boards.test.ts on HEAD 58e28ccef (git diff e3f51bf18..HEAD over src is empty): 29 of 29 pass, advisor suggestions owned by the acting character in all 19 chapters at 300+ decisions each (model level).

WHAT CHANGED IN MY AREA. Release 69/70 widened the treatment (DemoGate.TREATED_CHAPTERS) so the F1 HUD (the ink-and-gold command slab, turn strip, party panel, intent card) now plays in TEN chapters (FFX I, II, III, VII, X, XIV; FFX-2 IV, VI, XIII, XV) where release 68 had two; no 'hud' hold exists in PieceHolds. The builder took IX, XII, V and XI back out for two layout majors (Zanmato gauge against the turn strip; intent card against the party panel) before shipping, which is the right kind of self-check and I confirm those four still draw the old HUD in the capture. HeadlineBoss (the F1 ribbon names the declared boss) is verified in frames: Chapter VII ribbon 'Seymour' with both Guado Guardians targetable, Leblanc 'Ormi' then 'Logos' per link, Trema 'Paragon', Isaaru 'Isaaru' over Grothia's turn, Braska's Final Aeon. Artifact diff 2a9340249 to e3f51bf18: 7,170 files each, one changed (index.html), 7 content-hashed JS bundles renamed, zero art, audio or CSS change.

WORKS. (1) Target selection is strong in every chapter seen: pointing hand (FFX) or lotus ring (FFX-2), a TARGET flag with the name and damage type, brackets, the other party rows dimmed; Esc returns to the same menu with 0 targets in all 25 desktop runs (run.json afterTargetCancel) and FFX-2 prints ENTER CONFIRM / CHANGE TARGET / ESC BACK; on the phone a party command shows 'All allies - Mega Phoenix - Hits the whole party - The whole party at once - Confirm or Back' with BACK and a labelled confirm button (CHK-010 multi-target label seen on the phone, not on desktop). (2) Advice is legal, owned and located: 0 label mismatches and 0 target mismatches in the 25 desktop runs (about 1,900 picks); the chip names action, target, MP cost and the submenu (the star on the owning row; 'IN ITEMS', 'IN ORDERS', 'IN OVERDRIVE', 'IN SKILL' in the G card); on broken boards it stays right (Chapter I with Kimahri KO proposes Mega Phoenix, no MP; Chapter IV with Yuna cursed shows CURSE: Holy Water, Esuna, Remedy; Evrae's card marks KO on Tidus 1,262-1,265 and Rikku 880). (3) Enemy intent separates certain from conditional: SCRIPTED versus POSSIBLE 4% (Leblanc Fem-Goon), ZOMBIE 50% chip, DAMAGE RANDOM TARGET with per-ally ranges and 'Lands on one of these, picked when it acts', IF YOU ATTACK blocks (Yunalesca Absorb, Den of Woe), the Mega Flare 'about 25 seconds on the game's own clock' ALSO line; Chapter VIII's Orders widget states the cost ('THIS ORDER COSTS: Turn now, Cid's next turn'). (4) Overlay cleanup: after a lost fight, TRY AGAIN, party prep, second loss and CHAPTER SELECT nothing of the lost fight survived in either game (r32 lose-retry runs, FFX Chapter I and FFX-2 Chapter IV; the default moves to CHAPTER SELECT after the second loss). (5) Pause: Esc and P open and close with real keys in all 25 desktop runs and in the FFX-2 phone run; the plate is full-bleed with the face on screen at 1600, 2000 and 390; FFX-2 Leblanc and every new chapter pause with their own plates. (6) Copy: 0 developer-vocabulary hits in 2,228 captured text strings. (7) KO is a KO tag plus strike-through, statuses are words, dressphere badges are letters; no colour-only state seen. (8) Effective text size: advisorMinEffPx 14.2 at 1600 and 2000 in every chapter that reports it (including Leblanc, the new F1 chapter), 15 on the phone, 0 clipped advisor rows except Braska and Yunalesca where the DOM list names 'Tidus / Items' and 'Tidus / White Magic' (the row, not a visible cut).

PROBLEMS (none critical; none major that this release introduced). New this round, all in the widened F1 HUD: (a) the F1 command row cuts the SELECTED row's own name or hint: Isaaru, Yuna, SPECIAL selected shows 'SPECI...  x2  Open the Special ...' (a name cut mid-word, CHK-009 FAIL; the builder logged it as the XIV minor and did not fix it, docs/handoff/booth-b3.md 12.4; release 69 and the old HUD showed 'SPECIAL'); Braska and Natus show 'TALK  A one-off action this...' (the hint that tells the player what the row does loses 'encounter offers'); R32-INT-01. (b) The intent card's default height hides the half that matters: Den of Woe's IF YOU ATTACK text stops mid-sentence ('each landing strike, a miss or a no-effect hit once): at 8'), Leblanc's whole-party Thunder shows two of three girls with the second row fading and '+11 MORE', Chapter I still shows the IF YOU ATTACK header with no body (R31-INT-01, fourth review at this severity); the 'J HOLD +N MORE' cue exists on the card, so this is a default-state problem, not a missing feature; R32-INT-02. (c) Speaker boxes and the turn-intro wipe cover the first menu or the HUD: Chapter I (SPECIAL, WHITE MAGIC, ITEMS) at 1600, 2000 and on the phone and again on the retry; Isaaru (Yuna's line over the ribbon), Trema (Yuna's line over her own party plate), Den of Woe (Paine's line over the ribbon and over Baralai's intent card), Anima (the Rikku turn-intro wipe over the whole menu at the frame asserted awaitingMenu); R32-INT-03. (d) The intent card sits over the NOW tile at 1600 and 2000 (Chapter I, R31-INT-02) and, new in the F1 Chapter VII, over the 'Seymour' ribbon's HP bar; R32-INT-04. Carried and unchanged: 'GRANTS: BLUE' pink on cream in the Chapter IV CHANGE list (R31-INT-04); the phone pause header wraps over the tab dots, the tab strip is cut at CHAPTER/ACCESSI so ACCESSIBILITY, CONTROLS and MUSIC are reached only by an unprompted swipe, the phone options pane shows three rows with no scroll cue and a clipped TEXT SPEED row, CHANGE tiles clip ('UNNER', 'GRANTS: BLUI'), the phone pause shows ESC RESUME and H PAINTING ONLY (R31-INT-06); pause chrome is low contrast (header 'ECHOES OF SPIRA - FINAL FANTASY X' is the faintest text on the page; the frames are visually identical to r31 whose pixel sampling gave 1.9 to 3.5:1) (R31-INT-07); FFX target mode has no Enter/Esc strip while FFX-2 does, and the hint strip says 'Intel' where the panel says GUIDE (R31-INT-08); the phone enemy-move line abbreviates party names ('Yun 168-190 / Rik 92-104 / Pai 115-130' in Chapter IV, 'Tid 755 / Yun 796 / Kim 745' in Chapter I at three targets; R31-INT-05/PR-0571); FFX-2 target plate overlaps the advisor chip at 2000 wide (PR-0577). Unproven again: whether a touch player can reach and aim the advisor's picks: in the three phone runs the Items taps found only the first six of 27 rows (Mega Phoenix yes; Poison Fang, Holy Water, X-Potion no: 20 and 23 picks 'want != took', Attack taken, both Chapter I phone runs lost at turn 35 and 39) and all 5 FFX-2 ally-heal taps on Rikku were 'tap blocked' and finished by a key fallback; this is the third review with the same reading (R31-INT-10/PR-0483), I cannot tell harness from product from these frames, and I do not raise it above minor without a touch-only probe.

Score reasoning. r31 was 8.0. This round fixes nothing in my area (every stalled item above is open for a fourth review: INT-01, 02, 03, 04, 06, 07, 08), adds one name-truncation regression and three new instances of stalled patterns in the chapters the release newly dressed, and adds real strengths (the F1 HUD's target flag, intent card and cost lines now read the same in ten chapters; the Orders widget; the phone group-target card). No gain, one new minor regression: 7.9. Not judged because no frame exists: 4:3, ultrawide, 1440p, 4K; Leblanc at 2000 and 390; the Items, Special and Change lists beyond their first rows; the prep tabs beyond the first on any size; all-party and multi-target frames on desktop; gamepad hints (reused from round 30b under r31's argument).

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): G2 measured the size matrix and the legibility sweep (CHK-002 PASS at six sizes; CHK-003: 3,474 text elements on 51 surfaces, smallest 14 px, none under; one real clipped label, PR-0586). G3 read the overlay exits in Chapters I, IV and VI (52 asserts, 51 ok, the one miss a hook losing the fight) and found the stale f1-over class that hides the key prompt strip from link 2 of an F1 chain (PR-0598). G4 measured TEXT SIZE 100/115/130 on the desktop F1 HUD and the phone menu (PR-0559 holds live; PR-0558 sized), the phone pause targets (PR-0600), the phone Items list (PR-0601) and the Overdrive and Sphere Grid prep controls (PR-0557, PR-0555). The auditor's 7.9 is unchanged.

### onboarding
Round 32 deep review, live build e3f51bf18 (bundle index-UNVtEttT). No number, for the sixth review running. NEWCOMER WALKTHROUGH: SIMULATED only, never real: every route is a scripted real-input Playwright run from a fresh profile (keyboard; touch taps at 390x844); no human newcomer, no real phone, no real controller, no Safari. WHY NO NUMBER: the capture owner's route never opens the pause ACCESSIBILITY, CONTROLS or MUSIC tabs (run.json pause.tabs lists only the character tabs, Chapter, Guide, Options; the 14-pause frames are Esc, the next tab and OPTIONS only), so there is no round-32 frame of TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS or COLOUR VISION, nothing of the first menu at TEXT SIZE 115 or 130, and no phone ACCESSIBILITY frame (the two FFX phone runs' pause frames are UNVERIFIED: 'screen wanted pause got battle', the first Esc being spent on the first-time coach card). WHAT I CAN SAY, labelled by source. Seen this round on the live build: title strip lists ARROWS/WASD, ENTER, ESC, B Briefing, L Changelog, T Title art and prints 'RELEASE 70 e3f51bf1'; Auron's briefing teaches the rule that differs between the games ('In the FFX fights, nothing moves until you act', 'In the FFX-2 fights, the clock keeps running until you pick a command. Then it waits') and is skippable ('ENTER / ESC SKIP - 20 SECONDS, ONCE', 'D NEVER SHOW THIS AGAIN'); the board guide is three steps with ESC SKIP THE GUIDE (phone: TAP HERE SKIP THE GUIDE); the prep says 'The tabs are for later. Start the battle.'; the board names CTB or ATB per chapter; on the phone the first menu carries a first-time coach (Chapter I Auron 'He strikes first. Weather it, then hit back.', Chapter IV Rikku 'GAUGES RUNNING - A COMMAND HOLDS THEM', both 'FIRST TIME ONLY'); desktop F1 chapters (I, IV, VI and the seven new ones) show no teaching card at the first menu (release 64 decision D-1344, still an open question for Bailey, not a defect); the pause CONTROLS and OPTIONS panes exist (Options now also lists VOICE and VOICE-OVER); non-colour cues hold (KO tag and strike-through, status words, dressphere letter badges, the pointing hand with TARGET text, key-glyph chips including controller glyphs on the Bushido overlay). Reused (round 31 gap pass, same live code: the artifact diff shows no art, audio or CSS change and no source change in the pause, settings or access files): the ACCESSIBILITY tab rows are TEXT SIZE (100 to 130), REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION; setting them sets their attributes (round-31 evidence/gaps/seymour-flux-a11y and a11y-keys); the CONTROLS tab is a read-only key list. By code reading, not by frame: the new treatment's ending flash and ring, the breath wash and the hit flash honour REDUCE FLASHES and REDUCE MOTION (EndingPlan.ts, BreathPlan.ts, DemoHitBeat.ts), so the flashes release 69 and 70 added to ten chapters are covered in design; no frame shows the cap holding. GAPS THAT KEEP THE CATEGORY UNSCORABLE: COLOUR VISION never shown on a frame, TEXT SIZE 115 and 130 never shown on a treated first menu (PR-0558 overlaps seen by the focused review only), REDUCE FLASHES never shown on an ending, no phone ACCESSIBILITY frame, remapping is not built (see R32-ONB-01), no real device. DEFECTS SEEN: phone pause hides the ACCESSIBILITY tab (carried R31-INT-06), phone pause still prints keyboard hints, VISUAL STYLE 'HD-2D' and PRESENTATION 'THE ECHO - B' are unexplained on both games' options (PR-0508). The category is never averaged away; it blocks any milestone claim.

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): G4 (4a, 4b) walked the pause by real keys at 1600x900 and by real taps at 390x844 in Chapter I (FFX) and Chapter IV (FFX-2): the tab strip (TIDUS/YUNA/KIMAHRI or YUNA/RIKKU/PAINE, CHAPTER, GUIDE, OPTIONS, ACCESSIBILITY, CONTROLS, MUSIC) reachable by keys and, on the phone, by a real swipe (scrollLeft 0, 275, 550) and taps; ACCESSIBILITY rows TEXT SIZE 100/115/130, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS and COLOUR VISION (RED-GREEN) set their attributes; the desktop F1 HUD grows with TEXT SIZE (Chapter I turn strip 401, 461, 522 px; command column 425, 489, 552 px) and the phone command menu type goes from 16 to 20.8 px; the PAUSE chip is 46 by 46 px and opens the pause. Defects: phone ACCESSIBILITY rows are 350 by 20 px and RESUME 156 by 22 px, below the 24 px WCAG 2.2 minimum (PR-0600); the E card covers the turn strip at 115 and 130 (PR-0558). Still not shown: COLOUR VISION and REDUCE FLASHES at the level of a frame of an ending, a real device, a human newcomer. No number is written: the auditor did not read this evidence, and the category blocks any milestone claim.

### prep
Deep review round 32, live build main e3f51bf18 (release 70), bundle index-UNVtEttT.js, artifactHash 5720fa82..., https://echoesofspira.com/. I opened no browser. I read the capture owner's critic/rounds/round-32/evidence (694 index entries, 28 run.json, all PYREFLY_BROWSER=gpu headless Chromium, injected false on every entry; the only setup hook is the labelled setSeed(1)) and ran tools only (verify-live, git diffs, save vitest, grep).

SEEN AND PROVED. (1) Results and rewards read clearly and trace to sources in all 19 chapters, each won by real keys from the title to results, CONFIRM, the post scene, chapter select and a real reload. New this round, Leblanc (FFX-2 VI): EXP 1,620 / AP 11 / gil 1,580 / Potion x2, Black Choker, Favorite Outfit, Defense Veil, Charm Bangle, Twist Headband, Reassembled Sphere equals the sum of the three acts' per-enemy rows in src/data/ffx2/enemies/leblanc-syndicate*.ts (EXP 240+480+900, gil 340+460+780, AP 3+2+6) and the drops of research/ffx2-leblanc-syndicate.md section 6.3; the wiki-over-zero_six choice for the Act II pair is the documented G9 recommendation. FFX spot checks against research: Evrae AP 5,400 (ffx-evrae-airship.md:63), Natus Overkill AP 9,450 and gil 3,500 (ffx-seymour-natus-highbridge.md:66,517), Omnis AP 24,000 / gil 12,000 / Lv. 3 Key Sphere (ffx-seymour-omnis.md:481), Sin core 18,000 + Genais 1,800 = 19,800 AP, gil 10,000 + 10,000, Return and MP Spheres, Sin face 20,000 AP (ffx-sin.md:138-140), Isaaru 5,000 AP / 0 gil (ffx-isaaru-bevelle.md:49), Braska 0 / 0. (2) Progress is reliable: 22 of 22 victories show the clear on the board and the identical clear, selection and tile count after a real page reload (1600x900, 2000x1012, 390x844). (3) Retry is fast and clear where shown: Chapter I defeat card 'Try again / Chapter select' 1.0 s after the last KO and a first menu 9.7 s after TRY AGAIN with a new seed; Chapter IV card at 19.2 s and 9.9 s to a first menu (round 31: 10.2 s); the second loss and OTHER FIGHT / CHAPTER SELECT return to the board in both; phone defeat card names TURNS, ATTEMPTS, BEST and offers RETRY / CHAPTER SELECT and the phone retry reached a battle (32-after-retry, 33-retry-battle). (4) Advisor-to-menu agency: 24 of 24 item picks found their row in the Chapter I desktop runs (1600x900 and 2000x1012), 0 misses.

NOT SEEN, so no number. The prep agency itself: no capture in 694 entries opens STATS, SPHERE GRID, EQUIPMENT, ITEMS or OVERDRIVE (FFX) or DRESSSPHERES, STATS, ACCESSORIES, ITEMS (FFX-2), changes a value and shows it in the first menu; Auron's card says 'Tabs are for later' and every route starts the battle from the CHAPTER tab (PR-0503, now the fifteenth review with the same open half; the RUBRIC section 8 method check has still not been written). Retry in the 17 other chapters (chained ones included) was not shown this round although BattleScreen.releaseParts and the new LeaveRelease.endFight (release 69) changed what a leaving fight frees; the phone Items list shows six rows and the harness lost the touch Chapter I run at two seeds (known PR-0539, same as round 31), so a touch player's route to Poison Fang and an ally target stays unproven (PR-0483, scored under interface). One internal contradiction on a results card, filed R32-P1: Mirror Aeons shows 'S.LV 180 - 28,000/22,000 AP' with no S.Lv gain.

Indicative only, not a score: with agency unseen, the proved half (sourced results, retry, progress) would read about 9.0, a little lower for R32-P1. Cross-references scored elsewhere: first-command waits and phone load (delivery), phone Items list (interface).

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): G4 (4c) opened every prep tab by key and by tap in both games: FFX CHAPTER, STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE (Sphere Grid walk and activate changes S.LV and the STR node; Overdrive mode equip by tap) and FFX-2 CHAPTER, DRESSPHERES, STATS, ACCESSORIES, ITEMS, which expose no value-changing control (dresspheres change in battle). Findings: the STATS tab keeps the pre-spend value after an activation (PR-0555, with numbers), the Overdrive rows have no key route on the desktop (PR-0557), a STR node or an Overdrive mode does not show in the first command menu, the phone prep strip is cut at open, and the first-run Auron box overlays the Sphere Grid first-time card (PR-0602). G3 read retries in 9 chained chapters with results equal to the clean wins. G4 closed PR-0483 as a route (pager to Poison Fang page 4 and Holy Water page 2, both target steps, the Holy Water confirm by tap). No number is written: the auditor did not read this evidence and the "changed value shown in the first menu" half is not shown.

### delivery
Deep review round 32, live build main e3f51bf18 (release 70), bundle index-UNVtEttT.js, https://echoesofspira.com/. Host named by the capture owner and the focused review: Windows 11, Ryzen 7 7800X3D, 64 GB, RTX 5070 Ti, headless Chromium (Playwright) with PYREFLY_BROWSER=gpu (ANGLE D3D11, no black canvas, no fallback), real Cloudflare network, warm cache. I opened no browser.

PROVED. (1) Exact artifact (CHK-017): my own verify-live against critic/artifacts/e3f51bf18.json = PASS, liveManifest match, 57 files checked (sample), 0 mismatched, 0 missing, 0 wrong type, 0 errors; index.html identical once Cloudflare's analytics beacon is cut; the live page names assets/index-UNVtEttT.js (curl, 200, 1,453,453 bytes brotli, 0.44 s from the edge, node-side); the live review's full compare of 7,169 files was PASS and rehash of the stored manifest agrees with artifactHash 5720fa8287425ebb9f9b1575590436bf66d7a245d686bca9c6471beab55d1fe4. (2) Console and network on the live build: 28 run.json, 0 console errors, 0 not-found, 0 html-served-as-image, 7,470 art and audio requests recorded (598 audio, the mp3 cues named, 200s). (3) Complete flows by real input (CHK-022 win path): all 19 chapters won from the title to results, CONFIRM and the post scene, chapter select and a real reload: Flux 53 turns (1600x900 and 2000x1012), Yunalesca 147 (seed 3; seed 1 a capture-bot defeat at 98), Braska 284 (28.9 min, 6 seams), Bahamut 60 (1600x900, 2000x1012, 390x844 touch), Vegnagun 90, Leblanc 83 (10.8 min, 2 seams), Anima 58, Evrae 85, Yojimbo 14, Natus 26, Fallen Aeons 52, Omnis 92, Trema 226 (22.8 min), Isaaru 38, Den of Woe 27, Ixion 26, Sin core 321, Sin face 45, Mirror Aeons 209 (20.3 min; the first run stalled at the 15-minute harness budget, not a hang). Defeat and TRY AGAIN shown in Chapters I and IV. 12 of 694 captures are harness UNVERIFIED, each with a cause (six results frames taken after the scene had passed, four phone Esc frames because a phone has no Esc). (4) Saves (CHK-024): no persistence file changed between round 31's build 2a9340249 and e3f51bf18 (git diff of src/app: saveVisualStyle.ts is a three-line comment change; no new getItem/setItem/localStorage line anywhere in src); I ran 18 save, settings and defaults vitest files = 215 tests passed; 22 of 22 real reload checks keep the clear; the live review's volume 80 to 60 survives a reload; the upgrade matrix of round 29 is reused on that argument. (5) Shipping references and media (CHK-018, CHK-019): the grep for variant or raw art paths in src finds one comment only; critic/artifacts diff 2a9340249 to e3f51bf18 is 7 JS files added and 7 removed plus index.html, no art or audio byte changed; manifest decodeChecked true, audioUnverified 0; the focused review's art-derive verify and audit on dist-gate (5,404 masters, 0 problems, 0 dangling) is reused on that argument. (6) Frame times, reused from the focused review's candidate runs of the same content-hashed bundle (live byte-identical to the artifact), 1600x900, continuity probe p50 16.6 ms in all: Braska 59.5 fps p99 29.9 ms max 530.5 ms (live 69: 26.8 / 277.2), Yunalesca p99 29.8 max 525.4 (live 69: 33.8 / 150.0), Anima p99 25.5 max 270, Natus p99 22.6 max 338, Isaaru p99 20.3 max 195, Den of Woe p99 22.2 max 142, Trema 55.8 fps p99 94.3 ms max 170.7 with 2.5 percent of frames over 34 ms (live 69: 79.1 / 743.3 / 2.5 percent; round 31 focused: 57.3 fps, 72.5 ms), so PR-0544 stays open and is a little worse, with the host shared by other lanes. (7) An unreproduced renderer crash once seen at 2560x1440 in Leblanc: the release driver's probe and skeptic pass (D:/Tools/pyrefly-scratch/2026-10-31/r69-crash) ran 21 treated live browser runs with the same recipe, the read, host load and a second visit and saw 0 crashes against 3 of 3 in one earlier hour; fault injection shows an audio-service kill and a GPU-process kill each survive; cause unknown, not refuted, not run again here (carried PR-0565).

NOT PROVED, so no number. (a) First-load time on the live URL in a browser: no coldload run exists for this build (fourth review with no number, PR-0520; node-side arithmetic only: HTML 1.9 kB, bundle 1.45 MB brotli in 0.44 s). (b) The release 69 phone load order (?phonediet) on a phone profile and the page-memory growth per chapter change (PR-0567, PR-0573): the builder's own CHANGELOG claims 20.4 to 13.8 s in Chapter I and 42.3 to 23.7 s in Chapter IV on a 10 Mbit/s profile and says the 8 s budget is still missed; no independent run read it on live. (c) Browsers and devices: Chromium only; no Firefox, WebKit or Safari, no real phone or controller. (d) Frame times for 12 of 19 chapters on this build and none from a live run of this round (the r32 live continuity run covered only Chapter I before the evidence was cut). (e) Loss and retry in 17 chapters on release 69's changed teardown (R32-D1). Indicative only, not a score: the proved half is strong (identity, 19 of 19 flows, 0 errors, saves) and the measured weaknesses are PR-0544, single frames of 270 to 530 ms, and the unmeasured load and browser matrix, which together would hold the category near 8.5 if the named gaps close clean.

ROUND 32b SUPPLEMENT (gathered after the auditor wrote the text above; it does not change the score or status): G4 (4d) measured the live bundle: cold load to an interactive title 0.9 s median (0.86, 0.89, 1.00 s; 3.1 MB, 15 requests, 1600x900, cache off, host idle), 22.5 s throttled to 1.6 Mbit/s and 150 ms; the first Enter at the title opens the Auron briefing 1.3 s later and the board follows by the briefing's own timeout about 21 s later (a second Enter brings it at once); phone10 (390x844, DPR 2, CPU x4, 10 Mbit/s, 40 ms): Chapter I load wait 11.1 s and 80.1 MB (release 68 candidate 19.8 s and 93.6 MB), Chapter IV 18.4 s and 60.7 MB (42.4 s and 94.0 MB), host 28 to 32 percent busy so upper bounds, budgets of 8 s and 50 MB still missed (PR-0567). G1 loaded the whole shipped image set in Chromium and WebKit (5,502 of 5,502). G3 timed 9 retries (9.5 to 16.5 s; Chapter V link 5 38.6 s, PR-0599). Page-memory growth over five visits (PR-0573), Firefox, Safari, a real phone and frame times for 12 of 19 chapters from a live run are still not proved. No number is written: the auditor did not read this evidence.

## Visual sub-scores (outside the weighted score)
characterModels 7, enemyModels 7.9, animation 7, fidelity 8.5, camera 7.4 (unchanged from round 32; round 31: 7, 7.9, 7, 8.6, 7.5). characterModels and animation sit at their cap while CHK-026 fails in 13 chapters; enemyModels holds at 7.9; fidelity 8.5 (0.1 down: the treated arenas are graded much darker than the approved backdrops, PR-0585, a question for Bailey); camera 7.4 (0.1 down: Braska midfight framing PR-0583 and the Braska/Den of Woe/Sin camera cuts of PR-0521).

## Continuity harness
continuity harness (CHK-026/CHK-027): 19 chapter(s), 10638.5 s of battle, 56.3 to 59.9 fps, 19 of 19 run by the dedicated harness; CHK-026 FAIL (445 swap(s) change a head by more than the tolerance (worst 97.1 percent; 97.1 percent where the head is registered); 26 swap(s) of a standing figure move its feet more than the tolerance (worst 18 px at 1600 wide); 25 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.732 to 1.469; the bands are tools/posescale/pose-bands.mjs's); 54 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 290.7 px at 1600 wide), whatever stance the registration claims); CHK-027 FAIL (34 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 227.3 px); 3 MID-MOVE teleport(s) of 300 px or more in one frame (worst 340 px: no lunge covers its whole reach in one frame)); 1,623 ms of see-through a minute (97.4 frames a minute at 60 Hz) Read by harness 5e1bbdec47c9 (38 files; tree D:/pyrefly-release55 at 58e28ccef; policy 5ef4a3ed; probe v3 2c2bfe73; pose table b8cead6d (114 subjects); waivers 84fc043f (80 rows)).

| Chapter | CHK-026 | CHK-027 | swaps | ghost ms/min | worst head % | worst feet px | worst jerk px |
|---|---|---|---|---|---|---|---|
| seymour-flux | FAIL | PASS | 205 | 510 | 10.8 | 4.9 | 241.2 |
| yunalesca | FAIL | FAIL | 630 | 5611 | 2.5 | 0.8 | 256.3 |
| braskas-final-aeon | FAIL | FAIL | 1429 | 1422 | 97.1 | 18 | 340 |
| ffx2-bahamut | PASS | PASS | 277 | 584 | 0.7 | 0.4 | 32.3 |
| ffx2-vegnagun-shuyin | PASS | FAIL | 478 | 736 | 9.4 | 0.6 | 201.6 |
| ffx2-leblanc | PASS | PASS | 597 | 1676 | 28.8 | 0.8 | 48.5 |
| seymour-anima-macalania | FAIL | FAIL | 292 | 1030 | 22.2 | 0.9 | 245 |
| evrae-airship | FAIL | PASS | 353 | 1258 | 15.5 | 1.1 | 38.7 |
| yojimbo-cavern | FAIL | PASS | 78 | 495 | 15.4 | 0.3 | 24.2 |
| seymour-natus | PASS | PASS | 141 | 1501 | 13.4 | 0.8 | 202.8 |
| ffx2-fallen-aeons | FAIL | FAIL | 381 | 1161 | 15.6 | 1.1 | 45.5 |
| seymour-omnis | PASS | PASS | 631 | 1272 | 8.7 | 1.5 | 27.9 |
| ffx2-trema | FAIL | PASS | 1761 | 2644 | 2.2 | 10.4 | 67 |
| isaaru-via-purifico | FAIL | FAIL | 223 | 470 | 22 | 1.3 | 89.6 |
| ffx2-den-of-woe | PASS | FAIL | 216 | 1085 | 2.8 | 1 | 139.9 |
| ffx2-ixion-djose | FAIL | PASS | 296 | 3444 | 18.9 | 0.5 | 0 |
| sin-fins-core | FAIL | FAIL | 1616 | 1421 | 15.5 | 1.4 | 169.3 |
| sin-face | FAIL | PASS | 286 | 2548 | 15.5 | 1.1 | 47.8 |
| mirror-aeons | FAIL | PASS | 980 | 1015 | 19.8 | 1 | 73.5 |

## Target gate
18 required, 15 matched, 0 failing, 3 unverified, 2 waiting. Visual auditor's counts from critic/rounds/round-32/targets (title, chapter select, dialogue, results, party prep, pause, phone pause, Auron briefing, boss body sheets, Leblanc, Braska, Macalania, Natus, FFX and FFX-2 battle). Unverified: the settled party-prep frame, a Shuyin dialogue portrait, Leblanc at 2560x1440 beyond the first menu. Waiting: surfaces with no tile in targets.json.

## Checks
| Check | Result | Mandatory | Note |
|---|---|---|---|
| CHK-001 | UNVERIFIED | no | Technical half PASS (qa --strict 43 cues, 0 findings; -16.21 to -16.01 LUFS; worst true peak -1.48 dBTP; 319 mp3 decode with 0 errors; 300 of 300 audio files sha256-equal to the manifest and live HEAD 200; 171 AudioManager snapshots, 0 synth fallbacks; 235 aud |
| CHK-002 | PASS | yes | Live bundle UNVtEttT, fresh sweep (round 31's matrix is not reused). All six sizes: the pause opened from the command menu and Escape closed it back to the battle; currentSrc is pause/tidus.2x.webp; documentElement.scrollWidth equals clientWidth (390, 1280, 16 |
| CHK-003 | FAIL | yes | Under 14 px: none on any surface. 51 of 51 surfaces measured (none UNVERIFIED), 3,474 text elements (matrix 12 surfaces/977, phone 12/544, battle FFX 15/1,034, battle FFX-2 12/919), smallest 14 px; the extra shapes add 8 surfaces/707 elements, smallest 14 px,  |
| CHK-004 | PASS | no | advisor row named versus row pressed, desktop, 19 chapters |
| CHK-006 | PASS | yes | By real keys (Esc, Enter, E, G, the menu keys; labelled hooks only to fill the Overdrive gauge, set enemies to 1 hp and finish the fight, CHK-015). 52 asserts across the three chapters, 51 OK. Overlays covered: the intent card (E opens and closes), the guide p |
| CHK-008 | FAIL | no | Minor overlaps in sampled frames: Omnis advisor text over the boss and the party legs; Yunalesca body behind the damage number and HP plate; the CHAIN box clipped at the edge (PR-0591); carried PR-0516 and PR-0553. |
| CHK-009 | FAIL | yes | The F1 command row prints 'SPECI...' and 'A one-off action this...' on the selected row in Chapters XIV, III and X (PR-0586); round 31 printed the labels whole. Round 32b: the same cut is also on the selected row of Chapter I (SPECIAL x4 and SWITCH x4 at every |
| CHK-011 | FAIL | no | Braska 23-midfight: the headline boss is mostly out of frame under the turn order (PR-0583); the other 18 chapters showed every enemy in the frames read. |
| CHK-012 | PASS | no |  |
| CHK-013 | PASS | yes | The live shipped derivatives were not re-hashed by the visual auditor (the deploy gate does that). |
| CHK-014 | PASS | yes |  |
| CHK-015 | PASS | yes | Only setSeed(N) before the first key, and the labelled injected hp=1 plus autoBattle defend in the two lose-retry captures. Phone touch: the pager and Holy Water target step by real taps (PR-0483); Poison Fang not tapped. |
| CHK-016 | PASS | yes | Every capture asserts screen, chapter and state; 8 runs record one UNVERIFIED frame (30-post-scene.png: the scene plays after CONFIRM, PR-0593) and the phone defeat run its pause captures. No screenshot of a wrong screen is claimed. |
| CHK-017 | PASS | yes | exact live artifact |
| CHK-018 | PASS | yes | art-derive audit on dist-release exits 0: 1,360 text files read, 1,371 literal art names (42 a shipped file, 1,329 a derived master, 0 dangling), 38 of 38 strip thumbnails in the record and in the bundle. art-derive verify exits 0: 5,404 masters (1,309 WebP, 4 |
| CHK-019 | PASS | yes | The deploy manifest of e3f51bf18 (critic/artifacts/e3f51bf18.json, 7,170 files, hash 5720fa82...) has decodeChecked true and audioUnverified 0: 5,785 files decode 'ok' (1,367 webp, 4,125 png, 285 mp3, 8 jpg), 1,383 are not media (json, js, css, html, woff2, tx |
| CHK-020 | FAIL | yes | Polish-level, one open omission class and no regression: the FFX target step has no ENTER CONFIRM / ESC BACK strip that the FFX-2 target step draws (src/ui/ffx2/TargetPlates.ts:28, targetPlateGeometry.ts:16), the FFX hint strip keeps 'Enter Select' while a tar |
| CHK-021 | PASS | yes | every release 69 and 70 change touching battle play, checked for its written game case |
| CHK-022 | PASS | yes | Round 32 reached results, CONFIRM, the post scene and chapter select in 19 of 19 chapters by real keys with 0 console errors and 0 not-found requests, and the clear survived a reload (22 of 22). Round 32b closes the part it left UNVERIFIED, the retry from a la |
| CHK-023 | PASS | yes | HeadlineBoss names the declared boss per link; stageLinkBegins seams completed in Leblanc 2, Den of Woe 2, Fallen Aeons 2, Braska 6, Via Purifico 2; the stageFreeze form-change guard is never reached on this engine. |
| CHK-026 | FAIL | yes | 445 swap(s) change a head by more than the tolerance (worst 97.1 percent; 97.1 percent where the head is registered); 26 swap(s) of a standing figure move its feet more than the tolerance (worst 18 px at 1600 wide); 25 swap(s) draw a pose outside its height ba |
| CHK-027 | FAIL | yes | 34 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 227.3 px); 3 MID-MOVE teleport(s) of 300 px or more in one frame (worst 340 px: no lunge covers its whole reach in one frame) |
| CHK-B1 | UNVERIFIED | no | No numeric owner listening verdict covers the shipped mix (PR-0148): OWNER-VERDICT.md has no entry after 2026-09-28 and the only number is the music-only 7/10 of 2026-10-13 (D-804), older than the re-rendered cues, SFX and voice passes and the sound pass now r |

## Coverage matrix
**Tested**
- Live exact artifact: the page serves index-UNVtEttT.js (curl at the end of this review); the deploy-time live check compared 7,169 files (PASS); 0 console errors and 0 404s in every capture-owner run.
- All 19 chapters won by real keys from the title to results, CONFIRM and chapter select (capture owner, 1600x900; I and IV also 2000x1012 and 390x844 touch) and again by the continuity harness (10,638.5 s of battle, 56.3 to 59.9 fps, dedicated harness 5e1bbdec47c9, pose table b8cead6d, GPU mode, no fallback).
- Loss and TRY AGAIN by real keys: Chapters I and IV (single link).
- Engines: 16 probe and measure outputs re-run and md5-identical to round 31; full unit suite (28,004 tests, 0 failed); orphans 24 pre-existing, none of release 69 or 70.
- Audio: qa --strict and the live file byte-equality; the Leblanc pause cue and return to the boss theme at 1600x900.
- Gap pass on the live bundle: Leblanc at 2560x1440, seeds 1 to 3 with crash instrumentation (0 crashes); the phone pause chip in both games (PASS); the phone Items pager and Holy Water target step by real taps (partly proved); the orchestrator's live-gap lane for Braska and Isaaru seeds 1 and 2 (same bundle, dedicated harness).
- First-time-fan lens over 19 chapters of strips and sheets; its breakers are filed as issues (PR-0589, PR-0591, folded into PR-0521, PR-0528, PR-0536, PR-0517, PR-0379).
- ROUND 32b, G1 (static, no browser except the image load): art-derive audit (1,371 literal art names, 0 dangling) and verify (5,404 masters, 5,052 pixel-compared, 38 thumbnails, 0 problems) on the exact live artifact; the whole shipped image set loaded in Chromium and WebKit (5,502 of 5,502 each, 0 failed); 42 of 42 live files sha256-equal; the manifest decode check; 64 round-32 frames paired for FFX and FFX-2 parity (CHK-020); 49 auditor issues merged by substance.
- ROUND 32b, G2 (layout): the pause plate at 390x844, 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160 (plus 1440x1080, 2560x1440, 3440x1440) each in a fresh browser; the legibility sweep over 51 surfaces and 3,474 text elements in the ten F1-treated chapters and the pause (smallest 14 px, one clipped label).
- ROUND 32b, G3 (overlays and chains): E, G, submenu, target step, Overdrive picker, dressphere wheel and result banner left four ways in Chapters I, IV and VI; a lose-and-retry at a later link in all 9 chained chapters (Leblanc x2, Braska, Isaaru, Den of Woe, Fallen Aeons x2, Trema, Chapter V link 5, Sin core link 3, Mirror Aeons Act II) with 0 console errors and the wins' rewards compared with the clean wins.
- ROUND 32b, G4 (walks): the pause ACCESSIBILITY, CONTROLS and MUSIC tabs and TEXT SIZE 100/115/130 by key and by tap in Chapters I and IV; every prep tab of both games by key and by tap; the phone Items pager and both target steps; the live cold load, the throttled load and the phone10 load; the title and chapter-select audio state.
**Reused, with the reason**
- Carried issue text of 56 round-31 issues not touched by a round-32 lane (marked carriedFrom on each) (from critic/rounds/round-31.json): git diff 2a9340249..e3f51bf18 is empty for src/battle, src/story, src/data (one art table excepted) and research, and the carried interface, prep and onboarding items were not re-walked, so they are listed open and carried, never as re-observed. No PASS rests on them.
- The carried minors PR-0460 (Chapter III Summon rows) and PR-0524 (stale research/ffx2-bahamut.md) (from critic/rounds/round-31.json and round 30b): Dependency argument: git diff 2a9340249..e3f51bf18 is empty for src/battle, src/data (one art table) and research, and the probes that bear on them (ch3, aeonmenu) are md5-identical.
- Narrative score 8.8 (the text of the story, the bible and the encounters) (from critic/rounds/round-31.json (itself reused from round 30b)): git diff 2a9340249..e3f51bf18 over src/story, research/writing-bible.md and src/data/encounters.ts is empty, so every script is byte-identical to the one round 31 read; fresh real-key play of 17 chapters on the live site this round (CHK-022) found no contradiction. Dependency argument recorded in the category text; the auditor gave the number.
- CHK-019 audio decode of the files that did not change since round 31 (from critic/rounds/round-32/audio/verify.log and critic/artifacts/e3f51bf18.json): The stored manifests of 2a9340249 and e3f51bf18 differ by 7 renamed JS chunks and index.html only: 0 files under art/, audio/, fonts/ or fx/ and no CSS changed (gaps-G1-static/artifact-diff-2a9340249-vs-e3f51bf18.json); the decode of every shipped image was re-run this pass.
- CHK-003 on the nine untreated chapters (Vegnagun/Shuyin, Evrae, Yojimbo, Omnis, Ixion, Sin core, Sin face, Mirror Aeons; Fallen Aeons only at 390x844) (from release 68 (round 31 sweep)): git diff 2a9340249 e3f51bf18 -- src/ui is exactly src/ui/hudf1/HudF1.ts (3 lines) and HudF1Switch.ts (10 lines); no .css under src changed and src/app/screens/pause has no diff, so the old HUD those chapters draw is unchanged since release 68.
**Not tested**
- Chapter III links 3 to 6 Summon and Grand Summon rows in a browser (PR-0460)
- Page-memory growth over five visits (PR-0573) and three phone10 runs per chapter (PR-0567: one run each was made)
- Loudness, true peak and voice-over-music margin in the treated chapters; ending beds and voice counters; a dense last-blow-to-results music timeline (PR-0588)
- Bailey's listening verdict on the shipped mix (CHK-001, CHK-B1, PR-0148): a human judgment only he can give; filed mandatory:false and UNVERIFIED in the form of round 30b
- Bailey's verdicts on the arena grade (J6), the dress-change look, the camera and cut look (PR-0585, PR-0589, PR-0530, PR-0521): recorded:false human judgments
- COLOUR VISION and REDUCE FLASHES judged on a frame of an ending (the attributes were set; no frame shows the cap holding); the hold-Home reset; key remapping (not built, PR-0596)
- The Trema "restore" branch of the retry (a retry entered with fewer than two girls standing); loss and retry in the single-link chapters other than I and IV
- A control for the Chapter IV TEXT SIZE 130 G and N presses with nothing in flight (3 of 3 closed within 350 ms while an action played; not attributed to TEXT SIZE)
- Aspect ratios 4:3, ultrawide beyond 2560x1080, 1440p and 4K for the battle HUD; Leblanc at 2000 and 390; the Items, Special and Change lists beyond their first rows (the pause plate was measured at 3840x2160 and 3440x1440)
- Firefox, WebKit and Safari for play (WebKit and Chromium only for the whole-set image load); a real phone, a physical controller and a human newcomer (hardware and people this review does not have)
- A settled party-prep frame, a Shuyin portrait, Braska booth on and off side by side, Bailey's still J6
**Required and not tested**
- none: the owner-only and hardware items are in the list above with their reasons.

## Encounters through their real flow
- seymour-flux: victory 53 turns (1600x900), victory 53 (2000x1012), seed 1; lose-retry shown; 390x844 touch runs DEFEATED at seeds 1 and 2 (the route harness did not page the Items list: PR-0483) (Real keys title to chapter select; post scene plays after results CONFIRM)
- yunalesca: seed 1: defeat at 98 turns (pro-defeat card, the capture bot losing); seed 3: victory 147 turns (Seed 3 won by real keys to results and board; same seed as round 31)
- braskas-final-aeon: victory 284 turns, 28.9 min (6 link seams, 0 console errors; booth treatment (r70): PR-0581)
- ffx2-bahamut: victory 60 turns at 1600x900, 2000x1012 and 390x844 touch; lose-retry shown (Spherechange frame sequence captured; touch run completed with 0 want!=took)
- ffx2-vegnagun-shuyin: victory 90 turns (post scene lines read)
- ffx2-leblanc: victory 83 turns, 10.8 min (New in r69, booth treatment; 2 seams; post scene after CONFIRM reads; 3 further runs at 2560x1440 (seeds 1 to 3) reached results with 0 crashes)
- seymour-anima-macalania: victory 58 turns (booth treatment (r70): PR-0582)
- evrae-airship: victory 85 turns (wide swap scope (r69))
- yojimbo-cavern: victory 14 turns
- seymour-natus: victory 26 turns (booth treatment (r70))
- ffx2-fallen-aeons: victory 52 turns
- seymour-omnis: victory 92 turns
- ffx2-trema: victory 226 turns, 22.8 min (booth treatment (r70))
- isaaru-via-purifico: victory 38 turns (booth treatment (r70): PR-0582)
- ffx2-den-of-woe: victory 27 turns (booth treatment (r70))
- ffx2-ixion-djose: victory 26 turns
- sin-fins-core: victory 321 turns, 18.6 min
- sin-face: victory 45 turns
- mirror-aeons: first run STALLED at the 15-min default budget (link 2, 162 turns); rerun with a 40-min budget: victory, 20.3 min (The stall was the budget, not a hang (PR-0592))
- Round 32b added a lose-and-retry at a later link for: ffx2-leblanc (links 2 and 3), braskas-final-aeon (link 3), isaaru-via-purifico (link 3), ffx2-den-of-woe (link 3), ffx2-fallen-aeons (links 2 and 3), ffx2-trema (link 2), ffx2-vegnagun-shuyin (link 5), sin-fins-core (link 3), mirror-aeons (Act II).

## Ranked issue list (99; 3 closed in this round, the rest open)
Critical, then major, minor, polish. Every major carries introducedByCandidate, regressionVsLive and inNewFeature.

### PR-0581 [major] feel, FFX: R70-C1 Braska (FFX III): Tidus's real-snappy return flip drawn 1.66x larger reads as one-frame teleports of 306 to 417 px and 254 to 290 px attack hops under the release-70 booth hold
Chapter: Chapter III braskas-final-aeon
Observed: Round-32 harness (braskas-final-aeon-win-r32): 3 mid-move teleports of Tidus of 340, 312.8 and 302.1 px in one frame (no pose swap, not a camera cut: all other figures step 20 px or less in the same frame; Tidus's own move speed is about 45 px a frame), 138 dashes over the fail line (worst 294.5 px). The live-gap lane (live70, 1,696.7 s) reads four teleports of 306 to 417 px in Energy Rain (worst 416.6 px) and 26 plain-Attack hops of 254 to 290 px straight up in one frame, against a live-69 control of 116 px at most; the pack arm's worst dash is 116.2 px. Round 31 (release 68) Braska had 0 teleports and a worst dash of 153.6 px. The focused review of this build (critic/reviews/e3f51bf18-focused.json) rated this polish from a three-seed read; the deep review reads the whole run, finds the player-visible size of it (a main character crossing a third of the screen in one frame, twice a fight, in the third chapter) and rates it major.
Expected: A move may not move a figure faster than the move itself: no single-frame plane step above the policy limit (CHK-027 item 4) and no dash over 150 px.
Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=braskas-final-aeon --goal=win --size=1600x900 --seed=1 --tag=r32; read continuity.json jerks of kind teleport (figure tidus, about 1195 s, frame 69853); compare with ?treated=pack.
Evidence: critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/jerk-005-tidus.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/continuity.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-braska-live.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/braskas-final-aeon-win-live70/continuity/strips/jerk-000-tidus.jpg
Smallest fix: Suspected cause (not traced to a line): the treated Braska hold in src/engine/motion/PieceHolds.ts lets Tidus's return flip draw 1.66x larger, which the plane-step reads as a jump. Smallest correction: hold the flip at the idle's size for the treated chapter (or take the Braska row out of PIECE_HOLDS) until the curves lane re-measures it.
Acceptance: Harness on braskas-final-aeon, seeds 1 and 2: 0 teleports of 300 px or more, no dash over 150 px, CHK-027 PASS for Tidus.
Confidence: high for the measurement and the strip; the cause is suspected
Tags: introducedByCandidate true, regressionVsLive true, inNewFeature true

### PR-0582 [major] feel, FFX: R70-C2 Ixion's KO floor slide (ProneLay) lands at its 355 px maximum in the treated chapters: an 80 to 91 px one-frame feet jerk at the KO swap
Chapter: Chapter XIV isaaru-via-purifico and Chapter VII seymour-anima-macalania
Observed: Harness: Ixion idle-to-KO feet jerk 89.6 px in Chapter XIV (frame 16224, about 274 s) and 80.3 px in Chapter VII (frame 14824, about 252 s); round 31 read 27.3 px and 0 px. The live-gap lane read 89.2 px (seed 1) and 90.8 px (seed 2) in XIV with the KO painting placed 355 px from the idle plane (ProneLay at its maximum) against minus 9 px at ?treated=pack. ?pro=off and ?pack=off do not remove it; ?hud=today shrinks the slide to 250 px and passes seed 1 but not seed 2 (86.4 px). Strip swap-233-ixion-idle-ko.jpg shows the lying body well to the right of the standing figure after a red blend. The finding is wider than the focused review's (Chapter XIV only).
Expected: A KO lands where the figure fell; the KO swap moves the feet less than 40 px in one frame (CHK-027 item 9).
Repro: Harness --chapters=isaaru-via-purifico (and seymour-anima-macalania) --seed=1 or 2; read swap jerks for figure ixion; compare ?treated=pack.
Evidence: critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg; critic/rounds/round-32/continuity/seymour-anima-macalania-win-r32/continuity/strips/jerk-026-ixion.jpg; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s1.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s2.json
Smallest fix: Suspected: ProneLay (src/engine/motion) picks its maximum slide candidate under the treated holds' setProneAvoid areas. Smallest correction: cap the KO plane within 40 px of the standing plane, or ease it over the dissolve.
Acceptance: Harness on Chapters XIV (seeds 1 and 2) and VII: Ixion's swap jerk under 40 px.
Confidence: high for the measurement; medium for the cause
Tags: introducedByCandidate true, regressionVsLive true, inNewFeature true

### PR-0531 [major] visual, both: Figures still change head, height or feet at pose swaps in 13 of 19 chapters (CHK-026 FAIL; the umbrella for PR-0529, PR-0534 and PR-0459)
Chapter: Chapters I, II, III, VII to XIX (14 of 19; PASS in IV, V, VI, X, XII... see continuity)
Observed: Harness (10,638.5 s of battle, 11,649 swaps, harness 5e1bbdec47c9, pose table b8cead6d): 445 head swaps over tolerance (worst 97.1 percent at Braska's victory cheer; 15.5 percent is Lulu's rig head), 26 feet moves over 2 px (worst 18 px, Braska; Trema Paragon 10.4 px), 25 swaps outside the height band (round 31: 5; 23 of them in Braska), 54 silhouette-stance misses (23). FAIL in 13 of 19: Seymour Flux, Yunalesca, Braska, Anima, Evrae, Yojimbo, Fallen Aeons, Trema, Isaaru, Ixion, Sin core, Sin face, Mirror Aeons. PASS: Bahamut, Vegnagun, Leblanc, Natus, Omnis, Den of Woe. Leblanc, new in r69, is PASS on CHK-026 and CHK-027. Braska is worse than round 31 (PR-0584).
Expected: Head within 3 percent, standing feet within 2 px at 1600 wide, stature inside the pose band at every swap (CHK-026).
Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); the 19-chapter run of this round is critic/rounds/round-31/continuity
Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-trema-win-r32/continuity/strips/swap-207-paragon-idle-cast.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/swap-1172-yuna-idle-victory.jpg
Smallest fix: Re-register the pose paintings the strips name to the idle head and ground line (registration, never a repaint on taste), refit the Den of Woe and Ixion poses outside their height band, and have the harness read the head from the part's own box for rig figures; do not loosen the tolerance. A written method check is owed before a third batch (RUBRIC section 8: open in rounds 29, 30, 30b, 31).
Acceptance: Harness on Chapters I, IV, VII, IX, XI, XII, XIII, XVI: feet, height and stance lists empty outside written waivers; the five named strips show one size.
Confidence: high for the counts, medium for the visible weight of the rig-head share
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0380 [major] feel, both: CHK-027 FAILS in 8 of 19 chapters: 34 pose-swap jerks of 40 px or more in one frame (round 31: 66), worst 227.3 px; 3 mid-move teleports (round 31: 0)
Chapter: II, III, V, XI, XII, XIV, XVII, XIX (yunalesca, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-fallen-aeons, ffx2-trema, ffx2-den-of-woe, sin-fins-core, mirror-aeons)
Observed: Harness: 34 swap jerks of 40 px or more (worst 227.3 px, Braska), 3 mid-move teleports of 300 px or more (340 px, Braska Tidus: PR-0581), 138 dashes over the fail line (worst 294.5 px), 175 jerks over the fail line; snaps 0.00 a minute (the 7.5 animation cap does not bind). FAIL: Yunalesca, Braska, Vegnagun (tail 201.6 px), Anima (Ixion 80.3 px: PR-0582), Fallen Aeons (45.5 px), Isaaru (89.6 px: PR-0582), Den of Woe (Rikku 139.9 px stand-to-kneel drop), Sin core (left fin 169.3 px). Better than round 31 at swaps (66 to 34); worse in Braska, Anima and Isaaru, which the booth treatment first reached in release 70.
Expected: No jump of 40 px or more in one frame at a pose swap, or a swap that happens under a cut with no ghost (CHK-027).
Repro: Continuity harness, ffx2-vegnagun-shuyin and sin-fins-core, seed 1, 1600x900 (strips under critic/rounds/round-31/continuity/<chapter>-win-r31/continuity/strips)
Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-den-of-woe-win-r32/continuity/strips/jerk-004-rikku.jpg; critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg
Smallest fix: Start with the Sin fins/core and Vegnagun swap lists (the worst two); register Ixion hurt and KO to one feet anchor; extend the registered stance to the poses the lists name. Method check owed (RUBRIC section 8).
Acceptance: Harness on the eight chapters: swap jerks over the line under 10 in total.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0379 [major] feel, both: See-through cross-dissolves at pose swaps: 1,623 ms a minute (round 31: 1,689), worst severity 0.367; Yunalesca 5,611 ms and FFX-2 Ixion 3,444 ms a minute stay over
Chapter: worst: Yunalesca 5,531, Ixion 5,030, Evrae 3,186, Trema 2,724, Sin face 2,569 ms a minute
Observed: Harness: 1,623 ms a minute of see-through frames (97.4 frames a minute at 60 Hz), worst severity 0.367 under the 0.4 line, 0 over the fail line. Yunalesca 5,611 ms a minute (strip ghost-233), Ixion 3,444, Trema 2,644, Sin face 2,548 remain the worst. Gated swap jerks 66 to 34.
Expected: Under 1,000 ms a minute of see-through in every chapter (the issue's own line).
Repro: Continuity harness, any chapter, seed 1.
Evidence: critic/rounds/round-32/continuity/continuity-summary.json
Smallest fix: Continue the planned list: Evrae head registration, Sin face lunge return, Yunalesca planned cuts over 120 px, then move each of the four exceptions to the wide scope when its blocker clears.
Acceptance: All 19 chapters under 1,000 ms a minute or named exceptions.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0570 [major] feel, FFX only (Chapter I Tidus; Chapter II Tidus peaks 39.3 px and Chapter IV Rikku 30.9 px, no step): Chapter I Tidus's revive steps 89 px sideways in one frame at +117 ms (r68 removed the first-frame pop; the step moved later)
Chapter: seymour-flux
Observed: Release 69 fixed this: the revive slide target is read once at revive start (unit suite revive-follows-slide passes; Mega Phoenix and Phoenix Down revives resolve through the real menu in the Chapter I runs). The harness's Chapter I run lists no one-frame revive step of Tidus over the fail line (seymour-flux CHK-027 PASS, 0 swap jerks), but Tidus head moves of 80 to 162 px at swaps under a smear are present (frames 22585, 11541, 22705). The revive step itself was not isolated, so the fix is probable and not closed.
Expected: No step over 40 px in one frame of a revive (CHK-027 item 4).
Repro: https://echoesofspira.com/?coach=off, Chapter I, seed 1: let Kimahri fall, revive him or Tidus (Mega Phoenix or Phoenix Down); record 60 Hz stepped frames and track the standing plane (probe D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/lib).
Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json; critic/rounds/round-32/evidence/seymour-flux-win-r32/turn-log.json
Smallest fix: Isolate the Chapter I revive in the harness (Tidus after Phoenix Down at +117 ms) and read the plane step; close if under 40 px.
Acceptance: One revive strip of Tidus with a plane step under 40 px at +117 ms.
Confidence: medium
Tags: introducedByCandidate unknown, regressionVsLive false, inNewFeature false

### PR-0517 [major] visual, FFX-2 only: FFX-2 Chapter IV: Rikku's and Paine's attack and ready poses still read as a different-sized figure from their idle (carried; r68's ready hold did not change it)
Chapter: ffx2-bahamut
Observed: Carried. The fan strips show it again in Leblanc: Rikku grows to about 1.4 times when her ready stance starts (ffx2-leblanc seq-action-playing frames 6 to 9, seq-party-action frames 0 to 1), and Ormi's Shield Bash lunge is a pink ghost that pops back to its seat (a double-image read, folded here and into PR-0379). The harness CHK-026 reads Leblanc and Bahamut as PASS, because the head control passes a registered pose by construction (PR-0534).
Expected: A figure keeps one size across a pose change (CHK-026; Bailey 2026-10-04).
Repro: Continuity harness ffx2-bahamut, seed 1, 1600x900.
Evidence: critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-202-paine-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-207-rikku-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-267-rikku-idle-attack.jpg
Smallest fix: Register the attack and follow paintings to the idle head and ground line (or give the swap a smear cut); Bailey decides whether the Dark Knight and Warrior ready poses are repainted.
Acceptance: Strip header real head within 3 percent for the named swaps; harness stays PASS.
Confidence: medium (one strip read in full by the chief; the others by their headers)
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0459 [major] visual, FFX only: Chapter I (FFX): Auron's head changes 9.3 percent at two swaps and one swap draws him at stature 0.765 (CHK-026 FAIL, still open, a fourth deep review)
Chapter: seymour-flux
Observed: Chapter I (FFX): Seymour Flux CHK-026 FAIL again (max head jump 10.8 percent, 1 stature miss); the strips were not re-read for Auron specifically this round. Carried; folded into PR-0531's numbers.
Expected: Head within 3 percent at every swap (CHK-026).
Repro: Continuity harness, seymour-flux, seed 1, 1600x900; strips swap-265-auron-follow-idle.jpg and the Auron entries of continuity.json.
Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json
Smallest fix: Method check first (RUBRIC section 8; stalled since round 29): read the two strips, re-register Auron follow to the idle head, re-run Chapter I.
Acceptance: Chapter I harness: Auron worstHeadPct under 3 and heightOver 0.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0148 [major] audio, both: No numeric owner listening verdict covers the shipped mix (carried; an evidence gap, not a player defect)
Chapter: all
Observed: Carried, an evidence gap and not a player defect: docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; the only number is 'I like all the music 7/10' (2026-10-13, D-804), music only, before the re-rendered victory cues, the SFX and voice passes and the conference sound pass. The technical half is clean (qa --strict 0 findings, 300 of 300 live files byte-equal, 0 synth fallbacks).
Expected: CHK-B1: a dated verbatim numeric verdict naming the build or cue set.
Repro: Read docs/target/decisions.json (D-804, D-1310, D-1371) and docs/audio/OWNER-VERDICT.md.
Evidence: critic/rounds/round-32/audio/qa.log; docs/audio/OWNER-VERDICT.md
Smallest fix: Bailey listens to docs/audio/audition.html and gives a 0 to 10 number for music, SFX and voice, recorded verbatim.
Acceptance: A dated verbatim numeric verdict naming the build or cue set is recorded.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0567 [major] delivery, both: A phone on a 10 Mbit/s line waits 11.1 s (Chapter I) and 18.4 s (Chapter IV) on the loading card, 80.1 and 60.7 MB on the wire, before the first command (release 68: 19.8 s and 42.4 s, about 94 MB); the 8 s and 50 MB lines are still missed
Chapter: seymour-flux and ffx2-bahamut (measured); suspected for all
Observed: Carried and unmeasured on the build: round 31 read 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card on a 10 Mbit/s phone profile. Release 69 added ?phonediet (CHANGELOG, the builder's own claim: 20.4 to 13.8 s and 42.3 to 23.7 s, with the 8 s budget still missed). No independent run measured the live build this round; PR-0573 (page memory per chapter change) is likewise not re-read after release 69's screen release and LeaveRelease.endFight. ROUND 32b ADDITION (G4 (4d) on the live release-70 bundle): phone10 profile (390x844, DPR 2, touch, CPU x4, 10 Mbit/s, 40 ms), pad route: Chapter I load wait 11.1 s (card 10.5 s, total 61.0 s, 80.1 MB to the menu), Chapter IV load wait 18.4 s (card 18.3 s, total 49.1 s, 60.7 MB). The release 68 candidate read 19.8 s and 93.6 MB (Chapter I) and 42.4 s and 94.0 MB (Chapter IV), so the load order of release 69 helps (about 9 s and 24 s less) but the 8 s budget and the 50 MB acceptance line are still missed (+3.1 s and +10.4 s). The host was 28 to 32 percent busy (the release 71 build), so these numbers are upper bounds. Three runs per chapter were not made.
Expected: A phone reaches the first command menu without a 20 to 40 s load card; the 5 s goal of BUDGETS B2a holds on the desktop line.
Repro: critic/reviews/2a9340249-focused/budgets jobs/first-command.mjs --profile=phone10 --mode=pad (emulation only; a desktop GPU is not a phone).
Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json; critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-r67.json; critic/reviews/2a9340249-focused/budgets/first-command-desk50-pad-cand68.json; critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/phone10/first-command-phone10-pad-r32-g4-live.json
Smallest fix: Measure the wire set before the first menu with ?loaddiet=off and on, find what is fetched before the opening poses need it (suspected: the whole chapter's 1x paintings plus board strips), defer the rest until after the first menu.
Acceptance: Three runs per chapter: phone10 wire bytes to the first menu at most 50 MB, load wait at most 8 s, desk50 Chapter I load card at most 5.0 s.
Confidence: medium (one run per chapter, host 28 to 32 percent busy)
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0295 [major] interface, both: Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; not re-examined; the prep tab strip is cut at ACCESS on the 390x844 prep capture)
Chapter: prep, phone
Observed: Carried, not re-walked: only the first prep tab was captured at 390x844 (the strip is cut at 'ACCESS' in Chapter IV). ROUND 32b ADDITION (G4 (4c) evidence, severity left to the driver): The phone prep tabs were walked by tap and swipe on the live bundle (FFX CHAPTER, STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; FFX-2 CHAPTER, DRESSPHERES, STATS, ACCESSORIES, ITEMS): the strip is cut at open (3 of 6 FFX tabs and 2 of 5 FFX-2 tabs off screen) and the tabs are 37 px tall, but a real swipe moves the strip, it follows the selected tab, and the tabs seen are phone layouts (stacked, foldable sections), so "a desktop frame squeezed onto a phone" is not what the tabs walked show.
Expected: A phone prep that is a phone layout.
Repro: 390x844 touch, any chapter, prep screen.
Evidence: critic/rounds/round-32/evidence/ffx2-bahamut-win-r32-phone-touch/04-prep.png; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx2/run.json
Smallest fix: Walk it (PR-0503), then fix on what the walk shows.
Acceptance: Per tab at 390x844: opened by tap, readable, one change made, visible in the first menu.
Confidence: low this round
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0583 [minor] visual, FFX: Braska 23-midfight: at a command moment the aeon is mostly out of frame under the turn order and the red sky reads near black (CHK-011 FAIL)
Chapter: Chapter III braskas-final-aeon
Observed: Only the aeon's sword and shoulder show at the top right under the turn order; round 31's frame of the same capture step showed the whole aeon under a red sun. The other frames of the chapter (first menu, targeting, link seams) show the boss well.
Expected: The headline boss's head and torso are inside the frame at every command moment (CHK-011).
Repro: Chapter III, real keys, seed 1, 1600x900; capture 23-midfight.
Evidence: critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/23-midfight.png; critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg
Smallest fix: Check the treated pro-camera shot for the second form against the form's height, or add a CHAPTER FRAMING row.
Acceptance: At every command moment of the chapter the boss's head and torso are inside the frame.
Confidence: medium

### PR-0584 [minor] visual, FFX: Braska victory cheer: the swap numbers sit far over tolerance (head x1.97, 290.7 px stance, a 227 px Auron head jerk) but what the player sees under the victory close-up is not established
Chapter: Chapter III braskas-final-aeon
Observed: Tidus critical-to-victory reads head x1.97; Yuna idle-to-victory 290.7 px stance, height x0.84, real head x1.26; Auron a 227 px head jerk at a swap. Braska reads 23 swaps outside the height band (round 31: 0), 17 silhouette-stance misses (0) and feet 18 px (1.4 px); most of the numbers sit at the victory cheer, where the camera moves to a close-up on Auron a few frames earlier, so the party may be mostly off view at the swap.
Expected: Head within 3 percent and stance within 7 px at each swap, or a written rule that excuses a swap under the victory camera.
Repro: Chapter III to the end; harness swaps 1171, 1172, 1767; strip jerk-046-auron.
Evidence: critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/swap-1172-yuna-idle-victory.jpg
Smallest fix: Record the victory with the pro camera off and read the same swaps; then either register the victory poses or write the excusal rule (continuity.unseen).
Acceptance: The same swaps read inside tolerance or are excused by a written rule.
Confidence: low

### PR-0585 [minor] visual, both: Approved backdrops are graded much darker in the treated chapters (Leblanc's warm backdrop C, Braska's red sky, Macalania's lit hall): a question for Bailey, not scored as a defect
Chapter: treated chapters (Leblanc, Braska, Macalania, Natus and the other booth chapters)
Observed: The grade is the intended booth treatment, but Leblanc's backdrop C reads dark magenta, Braska's red sky near black and Macalania dim blue in battle. The handoff (booth-ffx-b3b J6) says a still beside Chapter I is owed before Bailey judges it.
Expected: Approved art stays recognisable in the running game; Bailey judges the grade.
Repro: Compare critic/rounds/round-32/targets/leblanc-backdrop.jpg and critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg.
Evidence: critic/rounds/round-32/targets/leblanc-backdrop.jpg; critic/rounds/round-32/targets/macalania-backdrop.jpg; critic/rounds/round-32/targets/natus.jpg
Smallest fix: Show Bailey the still beside Chapter I (job J6) and take his verdict. No change before that.
Acceptance: Bailey's recorded verdict on the arena grade.
Confidence: medium

### PR-0586 [minor] interface, FFX only: R32-INT-01: the F1 command row cuts the selected row's own label or hint ('SPECI...' on Isaaru, 'A one-off action this...' on Braska and Natus)
Chapter: Chapter XIV Isaaru (Yuna), Chapter III Braska, Chapter X Natus
Observed: With the cursor on SPECIAL the row prints 'SPECI...  x2  Open the Special ...': the label loses its last letters before the hint does. On TALK the hint ends 'A one-off action this...'. In round 31 the Braska and Yuna rows (old HUD) printed TALK and SPECIAL whole. The builder traces it to the F1 row's label against its x2 badge and inline description (docs/handoff/booth-b3.md 12.4); I did not trace the CSS line. ROUND 32b ADDITION (G2 layout sweep): Instrument confirmation on the live bundle: sweep.mjs battle, Isaaru, 1600x900, first menu: .ffx-cmd__label 'Special' sw 53 / cw 47 on three surfaces (out-battle.json results['isaaru-via-purifico']); the four other FFX F1 chapters swept (Yunalesca, Braska, Anima, Natus) and the four FFX-2 chapters (Bahamut, Leblanc, Trema, Den of Woe) cut no label at the first-menu cursor state. The TALK-row hint cut on Braska and Natus is a different cursor state and was not reproduced by this sweep (kept as filed). ROUND 32b ADDITION (G4): The same cut is on Chapter I (FFX, F1 since earlier releases) at every TEXT SIZE: SPECIAL (x4) reads 53 px of text in a 47 px box, SWITCH (x4) 49 in 40, and the inline description is cut as well; the F1 CSS did not change between releases 69 and 70, so in Chapter I the cut is older than the candidate. The candidate tags below are right for the chapters the F1 HUD newly reached (Isaaru, Braska, Natus); they do not describe Chapter I.
Expected: Every name that can be shown is shown in full; a hint may shorten, a label may not (CHK-009).
Repro: Real keys from the title: Chapter XIV, party prep, Start Battle, first menu, cursor on SPECIAL (1600x900, seed 1); Chapters III and X, TALK.
Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png; critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/seymour-natus-win-r32/12-intent-E.png; critic/rounds/round-32/gaps-G2-layout/battle-a/gaps/sweep/out-battle.json; critic/rounds/round-32/gaps-G2-layout/battle-a/gaps/sweep-battle-isaaru-via-purifico/01-battle-menu.png; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json
Smallest fix: Let the label keep its width and truncate the inline description first.
Acceptance: The label prints whole on every selected row of the three chapters at 1600x900 and 2000x1012.
Confidence: high that it shows; medium on the cause

### PR-0587 [minor] delivery, both: Retry after a loss inside a later link of a chained chapter is UNVERIFIED on the release 69 and 70 build
*Status: fixed (verified round 32b).*
Chapter: Chapter VI Leblanc (new), Chapter III Braska link 3 and later, Vegnagun, Trema, Sin core, Mirror Aeons
Observed: Releases 69 and 70 changed the chain runner (setHeadlineBoss per link), the presenter's run (stageLinkBegins clears the staging layer from link 2) and BattleScreen.releaseParts. Loss and TRY AGAIN was re-shown on this build only in single-link Chapters I and IV. No capture lost link 2 or later of a chained chapter and pressed TRY AGAIN. Nothing observed failing; unit tests booth-leblanc-chain and chain-checkpoint pass.
Expected: The retried link starts at the checkpoint with its own boss in the ribbon, a clear staging layer, music, a first menu, and the earlier links' rewards summed (PR-0138).
Repro: Real keys, Chapter VI Leblanc: win link 1, lose link 2 (idle), CONFIRM, TRY AGAIN; read the ribbon, the first menu and the results sum. Repeat in Chapter III link 3 or later.
Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-32/evidence/ffx2-bahamut-lose-retry/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/g3-summary.json; critic/rounds/round-32/gaps-G3-chains-overlays/g3-extension-summary.json
Smallest fix: Add a lose-and-retry capture in Leblanc and Braska link 3 to the next review.
Acceptance: Retry reaches a first menu of the retried link in about 10 s, the ribbon names that link, 0 console errors, the results sum the earlier links.
Confidence: medium

### PR-0588 [minor] audio, both: The sound pass (+4 dB makeup, -14 dB voice duck, layered hits) now plays in ten chapters but its level was measured only in Chapters I and IV
Chapter: FFX II, III, VII, X, XIV; FFX-2 VI, XIII, XV (the treated chapters)
Observed: Releases 69 and 70 changed audioNewOn() to isTreatedChapter(run,'audio') (src/audio/pass/passSwitch.ts:72); no PIECE_HOLDS row holds 'audio', so the pass runs in every treated chapter. passMix.ts states its numbers came from Chapter I and IV recordings. The capture evidence holds no loudness, true-peak or voice-over-music reading for the other chapters. The safety shaper bounds the peak by design, but the live result is not shown.
Expected: Short-term loudness median about -16 to -14 LUFS, true peak at or under -1 dBTP and every voice line at least +6 dB over the music in the treated chapters too (passMix.ts targets).
Repro: Play Chapters II, III and VI with the master tapped (window.__pyrefly.audioPass() reports makeup and trim) and run the existing measure tools against a Chapter I fight.
Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-omnis-win-r32/audio-debug.jsonl
Smallest fix: Record one fight each in Chapters II, III and VI and one more FFX-2 chapter, run tools/audio measure, and either confirm the targets or give the chapter its own makeup row. Measurement first; no change until read.
Acceptance: A measurement file per chapter in the review folder inside the targets.
Confidence: medium (reach proved from code, level unmeasured)

### PR-0589 [minor] feel, FFX-2 only: First-time fan: Yuna's dress change is a one-frame swap of a small hooded figure for a taller Warrior under a flash and a label, with Ixion see-through and doubled in the same frames
Chapter: Chapters V, XV, XIII dressphere change (Yuna white mage to Warrior)
Observed: Fan sheets of ffx2-vegnagun-shuyin, ffx2-ixion-djose and ffx2-den-of-woe spherechange: the white mage is replaced in one frame by the Warrior, who reads taller and a step forward; the 'Yuna Warrior GATE Blue' label sits on the guide text for a few frames; in the Ixion strip Ixion is a see-through double then jumps in front of the party. The harness counts four costume swaps (worst head 50.2 percent, feet 23.1 px) separately from same-art swaps. A dress change is a designed transformation, so the size change is partly intended; whether the pop is the look Bailey wants is his call.
Expected: A transformation reads as one continuous move; no label over readable text.
Repro: FFX-2 Chapter V or XV, Change to Warrior on Yuna; read seq-spherechange.
Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-ixion-djose-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-den-of-woe-win-r32__seq-spherechange.jpg
Smallest fix: Ask Bailey whether the dress change should be a blended or held transformation; no change until he answers.
Acceptance: Bailey's verdict on the Yuna dress-change strip.
Confidence: low to medium (strips read by a fan reviewer, not strip-by-strip by the chief)

### PR-0590 [minor] delivery, both: Chapter I retry reaches the first menu in 9.7 s, double round 31's 4.9 s (one noisy lane; Chapter IV 9.9 s against 10.2 s)
Chapter: Chapter I and IV retry
Observed: TRY AGAIN to first menu 9,747 ms (pro-defeat, party-prep, battle), defeat panel 974 ms after the last KO. The capture shared the machine with other lanes, so this is low confidence.
Expected: Retry no slower than the previous live build.
Repro: Lose Chapter I on seed 1, press Enter on TRY AGAIN, time to the first command menu on a quiet machine.
Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json
Smallest fix: Re-measure on a single quiet lane; if it holds, look at release 69's load order for the party-prep step on a retry.
Acceptance: Single-lane real-key retry of Chapter I in 6 s or less to the first menu.
Confidence: low

### PR-0592 [minor] harness, FFX: Mirror Aeons needs about 20 minutes of fight, above the route harness default budget of 15 minutes (the first run stalled at link 2; the 40-minute rerun won in 20.3 min)
Chapter: mirror-aeons
Observed: First run stopped at the budget on link 2 (162 turns, 900 s); the rerun with --budget=2400000 won in 20.3 min. Round 31 measured 19.8 min.
Expected: The route budget covers the longest chapter.
Repro: route.mjs mirror-aeons win --seed=1, default budget, then with --budget=2400000.
Evidence: critic/rounds/round-32/evidence/mirror-aeons-win-r32/run.json; critic/rounds/round-32/evidence/mirror-aeons-win-r32b/run.json
Smallest fix: Add mirror-aeons to LONG_FIGHT_BUDGET_MS in critic/runner/lib/route-pure.mjs.
Acceptance: A default-budget run completes.
Confidence: high

### PR-0571 [minor] interface, FFX-2 only: Phone FFX-2 enemy-move line abbreviates the party to 'Yun / Rik / Pai' (new in r68; trades round 30's split figure for abbreviated names)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV, 390x844 touch
Observed: Round 30 (r66) printed 'YUNA 168-190 / RIKKU 92-104 / PAINE 115-' with the last range broken over two lines; r68 prints 'Yun 168-190 / Rik 92-104 / Pai 115-130' on two rows and 'ACTS NEXT' became 'NEXT'. The figures are whole now; the names are abbreviated although the row has room (about 100 px free). The FFX line keeps full names. Chief read scratch/phone-intent-cmp.png.
Expected: Names whole where they fit (CHK-009), figures not split.
Repro: 390x844 touch, Chapter IV, first menu.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-31/scratch/phone-intent-cmp.png
Smallest fix: Keep full names and wrap by pair, or abbreviate only when a name does not fit its slot.
Acceptance: Yuna, Rikku and Paine whole at 390x844 with no figure split.
Confidence: high

### PR-0572 [minor] delivery, both: Release 68's load-diet claim is not shown by the first-command job (bytes and wait equal release 67's within noise)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux, ffx2-bahamut
Observed: Wire bytes to the first menu 110.31 / 112.03 MB against 110.34 / 111.89 (desk50) and 93.56 / 94.04 against 93.65 / 92.19 (phone10); load wait 5.92 / 4.44 s against 6.03 / 4.53 and 19.8 / 42.4 against 20.1 / 39.2. The release note says the first menu no longer waits for every pose; the handoff says it changes what the menu waits for, not what is fetched.
Expected: The measured wait or bytes fall, or the note does not claim it.
Repro: critic/reviews/2a9340249-focused/budgets first-command-*-cand68.json against *-r67.json; also with ?loaddiet=off.
Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json
Smallest fix: Run the pair default vs ?loaddiet=off on phone10 and say which is which, or reword the player note.
Acceptance: Paired run shows the stated difference or the note is changed.
Confidence: medium

### PR-0573 [minor] delivery, both: Page memory climbs 60 to 110 MB with every chapter change, no plateau in five visits (434 to 700 MB at the board; tree peak 3,225 MB); the focused review rated it major
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux and ffx2-bahamut
Observed: chapter-memory job: 434, 440, 511, 624, 700 MB at the board; JS heap flat (24.7 to 31.4 MB); growth 74 percent against a proposed 10 percent budget (r67: 321 to 642, 85 percent). DOM at the board is flat from the third visit (r67 rose), but the gap pass still reads CDP nodes +485 a visit (223 detached, no HUD classes). No failure observed; the budget is proposed, not owner-approved, so the chief rates it minor.
Expected: Memory settles (cache caps 96 paintings / 900 MB; texture governor 2,600 MB).
Repro: critic/reviews/2a9340249-focused/budgets chapter-memory job; run to eight or more visits.
Evidence: critic/reviews/2a9340249-focused/budgets/chapter-memory-desk50-cand68.json
Smallest fix: Extend the job to eight changes and trace which cache holds the growth (the JS heap is not it).
Acceptance: Growth between visit 4 and 8 within 10 percent, tree peak at most 3,500 MB.
Confidence: medium

### PR-0580 [minor] delivery, both: Frame-time outliers in the live 19-chapter run: Yunalesca one 5,610 ms frame and p99 51 ms (56.2 fps), Mirror Aeons 1,026 ms, Braska 705 ms, Vegnagun 482 ms, Trema p99 74.7 ms (extends PR-0544, PR-0480, PR-0527)
*Carried from round 31; not re-examined in round 32.*
Chapter: yunalesca, mirror-aeons, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-trema
Observed: frameTime.maxMs 5,609.7 (Yunalesca, longFramePct 2.6, fps 56.2), 1,026.2 (Mirror Aeons), 704.5 (Braska), 481.5 (Vegnagun; r66 446); Trema p99 74.7 ms, 2.3 percent over 34 ms, 56.7 fps (r66 71.2 ms, same). Other chapters 59.5 to 60 fps with p99 19 to 39 ms. The combat auditor's unit suite ran on the same host during the harness, so a host stall is possible for the 5.6 s frame: not shown either way (harness frameP99MsIsPacing false).
Expected: BUDGETS B4a to B4c: at least 59.5 fps, p99 at most 25 ms, at most 0.5 percent over 34 ms in every chapter.
Repro: Continuity harness, Yunalesca and Trema, seed 1, host idle.
Evidence: critic/rounds/round-31/continuity/yunalesca-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/continuity-summary.json
Smallest fix: Re-run Yunalesca on an idle host to settle the 5.6 s frame; per-frame trace of Trema against battle clock and phase (PR-0544).
Acceptance: Yunalesca max frame under 500 ms on an idle host; Trema p99 at most 25 ms.
Confidence: medium for the numbers, low for cause

### PR-0565 [minor] delivery, FFX-2: A renderer crash again: the chief's Chapter VI gap run (Leblanc) ended in "Page crashed" after about seven minutes of polling an empty menu (extends PR-0565)
Chapter: ffx2-leblanc
Observed: r31: the chief's Chapter VI gap run ended in 'Page crashed' once. Round 32 added 3 full Leblanc fights at 2560x1440 (seeds 1, 2 and 3, GPU mode, crash, pageerror and console-error listeners on): all reached results in 305 to 319 s with 0 crashes and 0 console errors. Together with the 0 of 21 earlier runs the crash is unreproduced in 0 of 24. That is not proof of absence; the first-menu command row at 2560x1440 was captured but not judged separately.
Expected: No renderer crash in a long session.
Repro: critic/rounds/round-31/gaps-chief/th-probe.mjs ffx2-leblanc with the Defend branch removed (the menu never reopens).
Evidence: critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-probe.json; critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-s1
Smallest fix: Capture the renderer's crash dump on the next occurrence; the long-session memory growth (PR-0573) is a suspect.
Acceptance: No crash across ten 10-minute idle runs.
Confidence: low

### PR-0479 [minor] visual, FFX only: Chapter I action shot: the humanoid Seymour's upper body leaves the top of the frame under the turn order (the creature's head is inside; the confirmer refuted the 'head cropped' wording)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux
Observed: In 23-midfight.png the Mortiorchis head with spines and jaw is wholly inside the frame (about y 20 to 300); the humanoid torso at the right runs off the top edge and the turn-order icons overlap it. In seq-party-action f02 the same figure is cropped at the top. Carried at minor since round 30; the auditor's raise to major is not supported.
Expected: Outside an intended close-up the boss stays in frame.
Repro: Chapter I by real keys, seed 1, first attack.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/23-midfight.png; critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f02.jpg
Smallest fix: Lower the action camera for this boss or move the turn order off the quad.
Acceptance: Same state: the torso is wholly inside the frame.
Confidence: high

### PR-0530 [minor] feel, both: Question for Bailey: hard cuts rose from 75 to 3,864 (22 a minute) because ?swapscope=wide turned the planned smear cuts on in 13 more chapters; the fan reads them as camera jerks and pops (Chapter I battle start, the Chapter IV sphere change, Braska seams)
Chapter: all; fan captures in seymour-flux, ffx2-bahamut, braskas-final-aeon
Observed: Unchanged: 3,990 planned hard cuts in 10,638.5 s (22.5 a minute), 4,772 smears planned, 4,606 swaps smeared. Awaiting Bailey's verdict on the look.
Expected: Bailey's judgment of the planned smear cuts and the pro camera shots (PR-0530, PR-0521).
Repro: Chapter I and IV by real keys; see the fan's captures seq-transition-into-battle and seq-spherechange.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/continuity/continuity-summary.json
Smallest fix: Show Bailey the strips and ask; build nothing until he answers.
Acceptance: A recorded verbatim judgment.
Confidence: medium

### PR-0473 [minor] feel, FFX only (Chapter I): A revive is a dissolve with no rise: Kimahri returns as a pale see-through figure over Yuna (carried, re-observed by the fan in three Chapter I runs)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux
Observed: seq-party-action f07 to f09 at 1600, 2000 and the phone: the revived figure is pale for three frames and floats above the floor line with Yuna drawn through it. See PR-0570 for the one-frame step.
Expected: A rise that reads as standing up.
Repro: Chapter I turn 3, Mega Phoenix with Kimahri down.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f07.jpg; critic/rounds/round-31/evidence/seymour-flux-win-2k/seq-party-action
Smallest fix: As PR-0570, then a rise.
Acceptance: Strip of the revive shows one figure, grounded, from frame 0.
Confidence: high

### PR-0534 [minor] visual, FFX only: Lulu's rig head reads 5 to 15 percent different at ready, cast and idle in the FFX chapters (about 470 of the 476 CHK-026 head fails; likely the head part's box, not a visible jump)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters II, III, VII to XIX with Lulu
Observed: headRig 920 swaps read from the rig's own head mesh; the chapter strips show no visible jump. Harness head fails 476 (round 30b 489).
Expected: The harness reads the head from the part's own box.
Repro: Continuity harness, braskas-final-aeon, strip swap-172-lulu-ready-item.jpg (round 30b path).
Evidence: critic/rounds/round-31/continuity/continuity-summary.json
Smallest fix: Read the rig head with its own box in critic/runner/lib/continuity-rig.mjs, or show the strips are not visible.
Acceptance: Lulu rig head swaps under 5 percent or shown not visible.
Confidence: medium

### PR-0529 [minor] visual, FFX-2 only: FFX-2 Chapter XII (Trema): Paragon's feet move 10.5 px at the cast-to-idle swap with nine see-through frames and height x1.13 (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-trema
Observed: strip swap-147: two overlapped Paragons for nine frames, feet 10.5 px apart (22.2 px from the pixels); the only feet-over fail of the 19 chapters at that size.
Expected: Feet within 2 px, a cut or a short blend.
Repro: Continuity harness ffx2-trema, seed 1.
Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/strips/swap-147-paragon-cast-idle.jpg
Smallest fix: Register Paragon cast and idle feet; shorten the blend on this boss.
Acceptance: Paragon swaps have 3 or fewer ghost frames, feet within 2 px.
Confidence: high

### PR-0516 [minor] interface, both: Panels over painted actors and live controls (CHK-008 FAIL, carried): the Chapter I E card covers the NOW tile of the turn order; the Vegnagun chain counter, panels and damage numbers stack; the 'Possessed ...' banner crosses the aeon's body
Chapter: Chapter I, Chapter V, Chapter III seams
Observed: At 1600 and 2000 the opened E card sits over the current actor's turn-order tile ('3RD IN QUEUE' over 'NOW') and Seymour's figure (R31-INT-02). The fan lists the same class: the Vegnagun chain box cut at the screen edge ('x1.9') with piled damage numbers, the Possessed Ixion/Valefor/Bahamut/Yu Yevon banner as a dark bar across the aeon, and the big turn cut-in covering the party at turn start (PR-0536). The 80-state sweep at 1280x720 and 2560x1440 was not re-run (PR-0552, PR-0553, PR-0560 carried). ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-04; FFX only, F1 Chapter VII): At 1600 and 2000 the Chapter I card sits over the NOW tile and the acting hero's portrait. In Chapter VII the card starts at x about 353 and hides the right part of the 'Seymour' ribbon and its HP bar. ROUND 32 AUDITOR ADDITION (visual-targets "Carried framing and overlap polish", the Omnis item; FFX only): Omnis's advisor text lies over the boss and the party's legs (the Flux and Yunalesca items of the same issue are PR-0479 and PR-0553).
Expected: No panel hides the current actor's turn slot or a figure it should not (CHK-008).
Repro: Chapter I first menu, press E, screenshot.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2; critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/12-intent-E.png
Smallest fix: Anchor the intent card left of or below the turn order; move the possessed banner off the body.
Acceptance: Intersection of the card and the NOW tile is 0 at 1280x720, 1600x900, 2000x1012, 2560x1440 in Chapter I.
Confidence: high

### PR-0502 [minor] interface, both: The boss's bark box, the opening quip banner and the turn-intro wipe cover the first command menu (carried, stalled, now also on retry)
Chapter: Chapter I first menu; Chapter I and IV retry
Observed: Seymour's line 'It's quieter on the other side.' covers SPECIAL, WHITE MAGIC and ITEMS at 1600, 2000 and the phone while the menu is awaiting input; the banner lasts under 1 s (gap pass); on both retries the first menu is under the actor's full-height portrait wipe. Seymour's banter card hides Skills and Magic rows and Tidus's plate (visual auditor, 10-first-menu-coach). ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-03; both games, the newly treated chapters): Chapter I: Seymour's line covers SPECIAL, WHITE MAGIC and ITEMS at 1600, 2000 and 390, and again on the retry. Isaaru: Yuna's line covers the boss ribbon. Trema: Yuna's line covers her party plate and the command menu's lower edge. Den of Woe: Paine's line covers the ribbon and Baralai's intent card. Anima: the Rikku turn-intro wipe covers the whole menu at the frame asserted awaitingMenu=true.
Expected: The command rows are visible while the menu awaits input, or the menu does not await until they are.
Repro: Chapter I real keys, first menu, no key pressed; or lose and TRY AGAIN.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/10-first-menu-coach.png; critic/rounds/round-31/evidence/seymour-flux-lose-retry/3-retry-menu.jpg; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/3-retry-menu.jpg; critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-trema-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-den-of-woe-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/10-first-menu-coach.png
Smallest fix: Place the bark clear of the command stack or hold awaiting until it has cleared.
Acceptance: At awaitingMenu true the command rows are unobscured.
Confidence: high

### PR-0540 [minor] interface, both: Chapter I intent card shows the IF YOU ATTACK header with no body (carried, stalled; third review at the same severity)
Chapter: Chapter I
Observed: The conditional body (Delay Attack or Buster punished with party-wide Slowga; Protect under 75 percent; Reflect and phase 2 under 50 percent) is in the DOM but the card height clips it until J is held. Chapter II shows its body. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-02; both games, no longer Chapter I only): Chapter I: the 'IF YOU ATTACK' header is shown with no body and 'J HOLD +3 MORE' under it (1600 and 2000). Den of Woe: the IF YOU ATTACK text is cut mid-sentence ('Counts every result the party applies to him (each landing strike, a miss or a no-effect hit once): at 8'), '+1 MORE'. Leblanc: a whole-party Thunder lists Yuna and a half-faded Rikku, Paine is not shown, '+11 MORE'. The cue to read more exists; the default state hides the conditional rule.
Expected: The conditional half is readable by default or the header is not drawn without a body.
Repro: Chapter I, seed 1, first menu, press E.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-den-of-woe-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-leblanc-win-r32/12-intent-E.png
Smallest fix: Let the card grow to its content as Chapter II's does.
Acceptance: E shows a non-empty IF YOU ATTACK body without J; scrollHeight equals clientHeight.
Confidence: high

### PR-0541 [minor] interface, FFX-2 only: Chapter IV desktop CHANGE list: 'GRANTS: BLUE' is pink on cream and nearly invisible, and a grant is never explained (carried, stalled)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-bahamut
Observed: The unselected WARRIOR row's GRANTS: BLUE is nearly invisible; Gunner's GRANTS: GREEN on the selected row reads.
Expected: Readable rows and one line saying what a grant is.
Repro: Chapter IV, ArrowDown to CHANGE, Enter.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/21-change-open.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/21-change-open.png
Smallest fix: Use the row ink for unselected GRANTS and add one explanatory line.
Acceptance: GRANTS contrast at least 4.5:1 selected and unselected.
Confidence: high

### PR-0518 [minor] interface, both: Phone 390x844: CHANGE tiles clip their text (UNNER, GRANTS: BLUI), the pause header wraps over the tab dots, the tab strip is cut at CHAPTER with no scroll cue (ACCESSIBILITY, CONTROLS and MUSIC are reached only by an unprompted swipe), the options pane stops at a half row, and the phone pause shows keyboard hints (carried, stalled; merges PR-0554, R31-ONB-01)
Chapter: Chapter I and IV phone
Observed: The pause chip is a 46x46 target and a tap opens the pause (gap pass). A real touch swipe on the strip scrolls it; nothing hints at it. Smallest visible text on the phone pause is 14 px; no horizontal page scroll (scrollWidth 390). ROUND 32b ADDITION (G2 layout sweep): At 390x844 (touch context, Escape) the pause on e3f51bf18 still draws the header 'ECHOES OF SPIRA - FINAL FANTASY X' wrapped onto two lines against the tab dots, the tab strip cut at CHAPTER with no scroll cue, and the keyboard hints 'ESC RESUME' and 'H PAINTING ONLY'; the plate itself covers the window (-489.1,-2.4, 1486.7x849.6) and the face is partly under the stat block. Not a new defect. ROUND 32b ADDITION (G4 (4b)): Phone pause: GUIDE to MUSIC are off screen at open; a real swipe scrolls the strip (0, 275, 550) and tapping ACCESSIBILITY, CONTROLS and MUSIC makes each the active tab; nothing hints at the strip.
Expected: Every tab reachable by sight; tiles whole; touch hints on a touch device.
Repro: 390x844 touch, Chapter I, tap the chip, read the strip.
Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause/phone-pause-0.png; critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause2/swipe1.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-32/gaps-G2-layout/matrix/gaps/sweep-matrix-390x844/02-pause.png; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
Smallest fix: Fade the strip edge as a scroll cue; hide keyboard hints on touch; fit the tile text.
Acceptance: Strip shows an edge cue; no clipped tile text at 390x844.
Confidence: high

### PR-0542 [minor] interface, both: Pause chrome labels are low contrast, about 1.9 to 3.5:1 by pixel sampling (carried, stalled)
*Carried from round 31; not re-examined in round 32.*
Chapter: pause
Observed: header 1.88:1, BATTLE STATS 2.37, H PAINTING ONLY 2.83, inactive tab 3.49, options section titles 2.38 (thin antialiased text, rough figure).
Expected: At least 4.5:1 for small text.
Repro: Pause screenshot, sample.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/14-pause-Esc.png
Smallest fix: Raise the label tokens.
Acceptance: Sampled contrast at least 4.5:1.
Confidence: medium

### PR-0543 [minor] interface, FFX only: FFX target mode lacks the Enter/Esc strip FFX-2 shows, and the hint strip calls the guide 'Intel' (carried, stalled; CHK-020 polish difference)
Chapter: FFX target mode
Observed: FFX-2 target frames show ENTER CONFIRM / ESC BACK; FFX frames do not; the hint strip labels the guide Intel while its panel says GUIDE. ROUND 32b ADDITION (G1 pairing (CHK-020)): Re-read on 64 round-32 frames in four chapter pairs: the FFX target step still has no ENTER CONFIRM / ESC BACK strip while src/ui/ffx2/TargetPlates.ts:28 draws one for FFX-2, and the hint strip still says Intel for the panel headed GUIDE. Same on the F1 HUD and the older HUD; present in release 69; not a regression.
Expected: The same help in both, in one word.
Repro: Chapter I, Attack, target step.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/16-target-single.png; critic/rounds/round-32/gaps-G1-static/chk020-pairing.json
Smallest fix: Add the strip and unify the word.
Acceptance: Both games print the strip; one word for the guide.
Confidence: high

### PR-0483 [minor] interface, FFX (Chapter I phone): A touch player's route to Poison Fang and Holy Water in the 27-item Chapter I list: the pager, both target steps and the Holy Water confirm work by real taps (round 32b); a Poison Fang confirm tap on an enemy plate was not made
Chapter: seymour-flux
Observed: The phone Chapter I routes were lost at seeds 1 and 2 (23 of 35 and 20 of 39 picks wanted Poison Fang or Holy Water and took Attack; desktop 2 of 53, with no Attack substitutions; Bahamut at 390x844 touch 0 mismatches). The chief's gap pass opened ITEMS by real taps ('1-6 OF 27', the previous button disabled), tapped the 44x44 next button ('7-12 OF 27') and tapped HOLY WATER, which opened its target step ('HOLY WATER -> TIDUS', help text 'Tap another ally to switch'). The route harness (critic/runner/lib/route-fight.mjs lines 229 to 238) reads only the six visible rows and falls back to Attack, which is how the run lost; CommandMenuPaging.ts and its unit test pass. The first draft of this finding was a major phone defect with low confidence on cause; the gap pass refutes it as a product defect, and it is filed minor for what stays unproven. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-10; FFX-2 Chapter IV phone, low confidence; would be major only if a touch-only probe shows no route): Chapter I phone, two seeds: only the first six of 27 Items rows were found (Mega Phoenix applied; Poison Fang, Holy Water, X-Potion not: 23 and 20 picks 'want != took', Attack taken) and both runs were defeated (turn 35 and 39). Chapter IV phone: 5 of 5 taps on the Rikku plate for Cure/Cura were 'tap blocked' and finished by a key fallback. I cannot tell a harness limit from a product defect on these frames. ROUND 32b ADDITION (G4 (4b) on the live bundle): Chapter I at 390x844: the Items pager (44 x 44 buttons, 1-6 OF 27) reaches Holy Water on page 2 and Poison Fang on page 4 by real taps; Poison Fang opens an enemy target step (plates mortiorchis, seymour-flux) and BACK works by tap; Holy Water opens the ally step with plates yuna 75 x 96 and tidus 95 x 103, elementFromPoint at each plate centre is that plate, the first tap on another ally switches the target (HOLY WATER to YUNA) and a second tap on the same plate confirms (awaitingMenu drops at once). The route exists; the acceptance wording (want equals took on every row) is met for Holy Water; a Poison Fang confirm tap on an enemy plate was not made, so the issue stays open as a minor until the next touch run.
Expected: A touch player can reach every row the advisor names and aim an ally.
Repro: 390x844 touch, Chapter I, Items, swipe to Holy Water, Yuna as target.
Evidence: critic/rounds/round-32/evidence/gaps/phone-items-pager/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-s2-touch/turn-log.json; critic/rounds/round-32/evidence/ffx2-bahamut-win-r32-phone-touch/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b3-poison-fang-target.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b4-holy-water-target.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b5-after-confirm.jpg
Smallest fix: Teach the route harness to tap the page button when the wanted row is not among the six visible rows (PR-0539); then tap Poison Fang and a target plate with real touch events.
Acceptance: A 390x844 touch run of Chapter I takes Holy Water and Poison Fang as named (want equals took on every row).
Confidence: high that the harness caused the defeats; medium that the player path is whole

### PR-0558 [minor] interface, both (F1 HUD: Chapters I and IV): At TEXT SIZE 115 and 130 the desktop F1 HUD overlaps: the boss ribbon over the guide chip and the intent panel over the turn strip; the Chapter IV help band sat under the PAUSE chip (merges R68-P1)
Chapter: Chapter I, IV
Observed: Focused review R68-P1 (candidate bundle, 1280x720 and 1600x900). The gap pass set TEXT SIZE 100 to 115 to 130 on the live pause and saw data-text-size set and the tab strip larger; it did not capture the battle HUD at 130 (r68 now scales the desktop HUD, so PR-0559 is probably fixed, not re-verified). ROUND 32b ADDITION (G4 (4a, 4f), sized on the live bundle): Chapter I: the E card covers the turn strip, 80 x 111 px at TEXT SIZE 100 (that is PR-0516), 137 x 128 at 115 and 221 x 145 at 130, with the folded Sensor tab also under it by 6, 10 and 14 px. Chapter IV at 130: the guide chips (G HIDE GUIDE and [ ] SCROLL) overlap the boss ribbon by 14 px and hide the HP SCAN chip; at 100 and 115 they clear it. The help band under the PAUSE chip was not seen (the F1 HUD has no PAUSE chip on the desktop).
Expected: No overlap at any text size.
Repro: Pause, ACCESSIBILITY, TEXT SIZE 130, resume, open E and G.
Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y-keys/a11y-after-changes.png; critic/rounds/round-32/gaps-G4-walks-optional/crops/ch4-guide-vs-ribbon-100-115-130.png; critic/rounds/round-32/gaps-G4-walks-optional/4f-ffx2-panels/ts130-again-g-plus1500.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json
Smallest fix: Reflow the ribbon and the intent panel under the larger scale.
Acceptance: Rect intersections 0 at 130 in Chapters I and IV.
Confidence: medium

### PR-0549 [minor] visual, both: Party figures stack on each other in staging: Auron is almost wholly behind Tidus in Chapter III; the party reads as toys against Vegnagun and Bahamut (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: braskas-final-aeon, ffx2-vegnagun-shuyin
Observed: Only Auron's coat edge shows behind Tidus in 23-midfight (two figures read). The fan also lists Ixion's body sitting through Yu Yevon.
Expected: Three readable figures.
Repro: Chapter III by real keys, seed 1, 23-midfight.
Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/23-midfight.png
Smallest fix: Offset Auron's slot in this chapter's layout.
Acceptance: All three heroes visible at the first menu.
Confidence: high

### PR-0521 [minor] feel, FFX-2 (Chapter IV): Pro camera framing in the action stills: Bahamut zooms and shifts within a turn; the sphere change swings the scene sideways (carried; see PR-0530 for the question to Bailey)
Chapter: ffx2-bahamut
Observed: Carried and widened by the first-time fan: a hard camera cut mid-action in Seymour Flux (a boss framing flips to a wide shot, the party at about half size, frames 2 to 3 of seq-action-playing), in Braska (a tight dark close-up to a wide shot, party about two thirds), in the Den of Woe seams (the party jumps about 1.8 times closer; seam 3's first frame has no party), and in Sin (the head about 1.4 times larger after the Yuna cut-in). 22.5 hard cuts a minute (3,990 in 10,638 s) are the planned smear cuts (PR-0530) awaiting Bailey.
Expected: A coherent camera (Bailey's judgment, PR-0530).
Repro: Chapter IV, Rikku WARRIOR change at 1600 and 2000.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/seq-spherechange
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: medium

### PR-0481 [minor] feel, both: Time to the first command: about 42 s in Chapter I and 21 to 23 s in Chapter IV from picking the chapter (pre-scene read included); the retry is now 4.9 s (Chapter I) and 10.2 s (Chapter IV)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters I and IV
Observed: Round 30b: 43.2 s and 26.6 s; retry 16.5 s and 9.9 s. The chained chapters retry in 9.6 to 13.6 s (this round's gap runs).
Expected: A short wait to the first command.
Repro: Chapter select to awaitingMenu with a timer.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/run.json; critic/rounds/round-31/gaps-chief/lose-braskas-final-aeon.log
Smallest fix: See PR-0567.
Acceptance: As PR-0567.
Confidence: high

### PR-0532 [minor] audio, FFX only: Chapter I's win fanfare is cut at the results swap and restarted from its first note (carried; contradicts D-1295 'one fanfare')
Chapter: seymour-flux
Observed: Carried and reached further: the early victory cue (FFX only) is in the fading list at gain 0.64 and 0.002 with no current track 4.0 s (Anima) and 17.4 s (Natus) before the results panel, and the results snapshot then shows victory-ffx current at gain 1: the same cut-and-restart round 31 read in Chapter I, now in two more chapters. Two snapshots, not a dense timeline; a fade could also be the cue ending.
Expected: D-1295: one fanfare.
Repro: Chapter I win, dense audioDebug timeline from the last blow.
Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-natus-win-r32/audio-debug.jsonl
Smallest fix: Skip the exit's stopMusic for a win when the results cue is already current.
Acceptance: A 100 ms timeline shows victory-ffx continuous.
Confidence: medium

### PR-0514 [minor] audio, both: The first UI sounds of a session fall back to the procedural synth, more often and for longer this round (7 of 11 logged runs, up to 14 sounds in the FFX-2 chapters; round 30: 2 of 17)
*Carried from round 31; not re-examined in round 32.*
Chapter: title and chapter select, first 2 to 7 s of a fresh profile
Observed: ffx2-bahamut-win-2k 13 synth sounds 3.47 to 6.05 s; phone 9; vegnagun 14 (3.83 to 6.58 s); the Chapter I runs are clean. Cause not established (sprites 2.7 and 4.6 MB over the live network, host load, or the r68 load order).
Expected: CHK-001 item 3: nothing falls back to synth.
Repro: Fresh profile, FFX-2 chapter select to Chapter IV; move and confirm within 3 to 6 s.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/audio-debug.jsonl; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/audio-debug.jsonl
Smallest fix: Gate the UI cue on the first sprite decode, or start its fetch ahead of art.
Acceptance: Ten cold runs log no synth entry in the first 7 s.
Confidence: medium for the entries, none for the cause

### PR-0504 [minor] audio, FFX-2 only: Chapter IV win results are silent on the default desktop build, by a release 62 pick nobody has heard (carried question for Bailey; re-observed at 1600 and 2000)
Chapter: ffx2-bahamut
Observed: Carried and re-observed in round 32: Chapter IV desktop wins (1600x900, 2000x1012) end with music.current null at results; the 390x844 touch win plays 'pause' at results because the pass is off on phone class. D-1352 keeps silence until Bailey has listened.
Expected: Bailey's decision.
Repro: Chapter IV win.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/audio-debug.jsonl
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: high

### PR-0523 [minor] interface, both: Esc from the command menu closes an open guide panel first, so the pause seems ignored (carried; re-observed in Den of Woe, Trema and Via Purifico; a gap-pass Esc after ACCESSIBILITY row changes took more than 1.2 s to close, not reproduced as a defect)
Chapter: ffx2-den-of-woe, ffx2-trema, isaaru-via-purifico
Observed: pOpens and resumedByEsc are true; three pause captures read screen battle. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-13; FFX only, Chapter I phone): Both FFX phone runs: Esc at the command menu returned the plain menu and the pause frames are UNVERIFIED; the FFX-2 phone run (no coach at that moment) paused normally. The pause chip works (r31).
Expected: The first Esc pauses or the panel says it closed first.
Repro: Open the guide, press Esc.
Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/14-pause-Esc.png; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/14-pause-Esc.png
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0550 [minor] interface, FFX only: Gamepad: the A that confirms the target also stops Wakka's first reel as the overlay opens (carried; the pad evidence is reused from round 30b under a written argument)
*Carried from round 31; not re-examined in round 32.*
Chapter: Wakka Overdrive
Observed: Not re-driven this round (reused from round 30b).
Expected: The first reel runs until pressed.
Repro: As in round 30b.
Evidence: critic/rounds/round-30/gaps2/g2
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0460 [minor] combat, FFX only: Chapter III possession links 3 to 6 Summon rows still not seen in a browser this round (carried; reused from round 30b under a written argument)
Chapter: braskas-final-aeon
Observed: Carried: the real-key Braska run (284 turns, 6 seams) used Summon once (Bahamut, link 1); links 3 to 6 never opened the Summon or Grand Summon rows. The engine probe ch3 shows every row enabled with a picker of five aeons (md5-identical to round 31).
Expected: Seen by real keys.
Repro: As round 30b.
Evidence: critic/rounds/round-30/gaps2
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0503 [minor] process, both: Prep agency (STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; DRESSSPHERES, ACCESSORIES) and the r68 prep tab roles were never walked by key or touch (carried, the fourteenth review; the pause ACCESSIBILITY tab was walked by round 31's gap pass, not by round 32's (PR-0597))
Chapter: all
Observed: 291 entries, 11 of them prep first tab; none opens another tab or changes a value. ROUND 31's gap pass walked pause E (Tidus, Yuna, Kimahri, Chapter, Guide, Options, Accessibility, Controls, Music), TEXT SIZE 100 to 115 to 130 (data-text-size), REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS toggles. Not done: COLOUR VISION on a frame, key remap, prep tabs, hold-Home reset. RUBRIC section 8 requires the method check before another attempt; none is written. ROUND 32b ADDITION (G4 (4c) walked the prep tabs, and 4a/4b the pause tabs, in round 32b): Every prep tab of both games was opened by key and by tap on the live bundle (see PR-0295 for the list); the FFX Sphere Grid and Overdrive controls were exercised; FFX-2 prep exposes no value-changing control. The acceptance wording (the changed value shown in the first menu) is not met: a STR node and an Overdrive mode do not appear on the first command menu. The pause ACCESSIBILITY, CONTROLS and MUSIC tabs were walked by key at 1600x900 and by tap at 390x844 in Chapters I and IV (PR-0597).
Expected: Per game and input: each prep tab opened, one change made, visible in the first menu.
Repro: Add one scripted real-input walk to the capture owner.
Evidence: critic/rounds/round-31/evidence/index.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx2/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
Smallest fix: Write the method check; assign the walk to the capture owner's script.
Acceptance: A run.json with the walks and the changed value in the first menu, both games, both sizes.
Confidence: high

### PR-0520 [minor] delivery, both: First-load time on the live URL still not measured in a browser (carried, the fourth review)
*Status: fixed (verified round 32b).*
Chapter: title
Observed: Node-side arithmetic: cold title about 3.1 MB on the wire (bundle 1,450,107 B brotli in 0.47 s), inside the proposed 4 MB. No browser timing.
Expected: Title usable under 5 s cold on a named profile.
Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/coldload.mjs --base=https://echoesofspira.com/
Evidence: critic/reviews/2a9340249-focused/cold-cand/gaps/coldload/out.json; critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/gaps/coldload/out.json; critic/rounds/round-32/gaps-G4-walks-optional/4i-title-enter/run.json
Smallest fix: Run coldload.mjs against the live URL.
Acceptance: A report line with the median and the throttled load.
Confidence: high that it is unmeasured

### PR-0544 [minor] delivery, FFX-2: FFX-2 Trema 56.7 fps, p99 74.7 ms, 2.3 percent over 34 ms (carried since round 30; see PR-0580 for the other outliers)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-trema
Observed: Live run: 56.7 fps, 1,588 of 67,748 frames over 34 ms, max 158 ms.
Expected: B4a to B4c.
Repro: Trema continuity.
Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json
Smallest fix: Per-frame trace first.
Acceptance: p99 at most 25 ms.
Confidence: high for numbers

### PR-0547 [minor] interface, FFX-2 only: FFX-2 results ledger names the dressphere Rikku started in, not the one she finished in (carried, re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-bahamut
Observed: As round 30b.
Expected: The finishing dress.
Repro: Chapter IV win, change Rikku, results.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/31-results.png
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0539 [minor] harness, both: Critic harness limits (carried): the phone Items list is 6 rows of 27 for the route, timed sequences carry no frame timestamps, the capture owner's retry folder for Chapter IV mixes runs and its images are not indexed (R31-U1), and the cardFirst advisor measurement describes a card not on screen (R31-INT-09)
Chapter: critic runner
Observed: Carried and widened: the phone Items list is 6 rows of 27 for the route and the harness never taps the page button (PR-0483); the route budget misses Mirror Aeons (PR-0592); the post scene still is taken before the scene (PR-0593); the engine logs of Vegnagun, Ixion, Sin core and Sin face end before the final victory event and the run.json fight step reads 'undecided' (those four victories rest on the results screen text, which reads Victory with the clear time).
Expected: One run per folder, every image indexed.
Repro: ls --time-style=full-iso on the folder against run.json.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
Smallest fix: Re-run into a clean folder with the images indexed.
Acceptance: A folder whose run.json and images share one run and are in index.json with verified true.
Confidence: high

### PR-0099 [minor] audio, both: Stand-in or borrowed scene beds and battle cues in eleven chapters (carried; not re-judged by ear)
*Carried from round 31; not re-examined in round 32.*
Chapter: eleven chapters
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0515 [minor] interface, FFX-2 only: Doublecast advice says NO MP while the spell picker shows the MP cost (carried, not re-examined)
*Carried from round 31; not re-examined in round 32.*
Chapter: doublecast
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0485 [minor] narrative, both: Portrait expression never follows the line; 46 emotion tags are read by nothing (carried; no story file changed)
Chapter: all
Observed: Carried: dboxTimeline shows one portrait file per speaker for the whole scene (Leblanc: rikku-x2.webp, paine.webp); no expression change on grief lines. Awaits Bailey.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0537 [minor] visual, FFX only: The live Chapter I boss card has no approved target (carried, not re-examined)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0552 [minor] interface, FFX-2 only: FFX-2 Mega Flare telegraph: the CHAIN counter is drawn over the ATTACK row (carried; not re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0555 [minor] prep, FFX only: The prep STATS tab keeps the pre-spend value after a Sphere Grid activation (carried; not walked)
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c)): Confirmed by tap with numbers: after WALK AND ACTIVATE the grid says Strength +2 activated and STR is now 33, Power 12 to 11 and the roster S.LV 30 to 28, while the STATS tab still shows S.LV 30 and STRENGTH 31.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-stats-1-after-spend.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-grid-1-after.jpg
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0556 [minor] onboarding, FFX only: The Sphere Grid card says Enter acts, but Enter after the card starts the battle (carried; not walked)
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c, 4h), reworded): The stated sequence (Enter after the card starts the battle) was not reproduced. Seen instead: while WALKING the shell hint under the grid says ENTER BEGINS THE BATTLE - ESC BACK while the canvas footer says ENTER ACTS - ESC RELEASES, and the first Esc while WALKING left WALKING lit (the second released it); in one run Esc left the prep for the chapter board.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4h-grid-keys/run.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0557 [minor] prep, FFX only: OVERDRIVE modes on the prep tab have no keyboard route (carried; not walked)
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c)): Confirmed by key on the live bundle: the desktop OVERDRIVE mode rows (STOIC, WARRIOR) have no tabindex, no role and no key route; the phone rows have tabindex 0 and role button and a tap moves EQUIPPED from WARRIOR to STOIC.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-key-od-0.jpg
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0559 [minor] onboarding, both: TEXT SIZE scaled the pause and the phone command menu but not the desktop battle HUD (r68 a11y-text now scales it per the focused review; not re-verified live)
*Status: fixed (verified round 32b).*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b1-phone-textsize-130-menu.jpg
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0560 [minor] interface, FFX only: Chapter I ally target with the Items list open: rows cover the TARGET plate and hand (carried; not re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0561 [minor] prep, FFX-2 only: The FFX-2 prep STATS tab does not say it leaves accessories and the Garment Grid out (carried; not walked)
*Carried from round 31; not re-examined in round 32.*
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0562 [minor] onboarding, both: On the phone the first-run guide step 3 pointer covers part of the TIP text (carried; not re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: phone
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0563 [minor] delivery, both: WebKit 26.6: party-plate portraits draw as noise at the first menu (carried; Chromium only this round)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0564 [minor] delivery, both: WebKit 26.6 holds 12 to 26 fps at the first menu (carried; Chromium only this round)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0566 [minor] feel, both: First sight still stalls: the first 0.1 to 4.1 s of every battle carry 5 to 9 frames over 100 ms (carried; the live run records the worst frames, not when they fall)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0568 [minor] feel, both: hz-matrix: chained beats differ 25 to 30 ms between 60 and 120 or 144 Hz (carried; not re-run)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0594 [minor] prep, FFX only: Mirror Aeons results row prints 'S.LV 180 - 28,000/22,000 AP' with no Sphere Level gain
Chapter: mirror-aeons
Observed: After a won Mirror Aeons run (FFX, 209 turns) the results card shows AP 28,000 x3 party and each row 'S.LV 180 / 175 / 170 - 28,000/22,000 AP +28,000 AP' with no '+1 S.Lv' badge. A progress readout above its own threshold contradicts itself: the rule in src/battle/ffx/results.ts (apForLevel capped at 22,000, levels gained while banked is at least the cost) would give a level, and Omnis, the same game and the same rule, shows 24,000 AP as '+1 S.Lv, 2,000/22,000'. The battle log's link-1 result carries sphereLevelsGained 0 for all three with ap 20,000 while the displayed AP is 28,000 (the chain's two links paid 20,000 and 8,000); suspected cause: the level count is made from the last link's own AP while the screen shows the pooled total. The same string is in the round 30 and round 31 continuity runs, so it is old, not new.
Expected: Either a +S.Lv badge with a remainder under the threshold, or an AP figure that matches the level maths; never a bar above its own limit. Which number is the game's is for the sources to settle (research/ffx-mirror-aeons.md lists the sisters at 10,000 AP each, 12,000 on Overkill); not invented here.
Repro: Real keys from the title: chapter select to Mirror Aeons (Chapter XII), seed 1, win both links (about 20 minutes), read the results card (critic/rounds/round-32/evidence/mirror-aeons-win-r32b/31-results.png, run.json resultsText).
Evidence: critic/rounds/round-32/evidence/mirror-aeons-win-r32b/31-results.png
Smallest fix: Make the level count and the displayed AP come from the same total in a pooled or chained FFX result (src/battle/ffx/results.ts sphereLevels against src/ui/common/resultsMath.ts sphereGridDetail), then re-read against the research rows.
Acceptance: Mirror Aeons win: every member row has remainder below its threshold or a +S.Lv badge; Omnis and Sin core rows unchanged.
Confidence: medium (the display is observed; the cause is suspected, not traced)

### PR-0596 [minor] onboarding, both: Key remapping is not built: CONTROLS is a read-only list
Chapter: Pause CONTROLS tab
Observed: The CONTROLS tab lists G/X, N/RT, E/RS, J/LT, Q/Y, F/LB, Esc/Menu, H/Y, Enter/Z/A and so on and offers no way to change any binding.
Expected: The rubric's onboarding category names remapping among the accommodations.
Repro: Esc, then tab to CONTROLS (round-31 frame pause-E7.png).
Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/pause-E7.png
Smallest fix: Question for Bailey, not a proposal to build: the mock shows it, the code says it is not built, and no issue tracked it. Decide build or drop the line from the rubric reading.
Acceptance: A decision recorded in decisions.json; if built, rebinding one key persists across reload and shows in the hint strip.
Confidence: high

### PR-0597 [minor] process, both: The capture owner's route still never opens ACCESSIBILITY, CONTROLS or MUSIC, so onboarding has had no number for six reviews
Chapter: Pause
Observed: run.json pause.tabs lists six tabs in every run and the 14-pause frames stop at OPTIONS; the three tabs appear only as labels. The phone FFX pause frames are UNVERIFIED in both seeds. ROUND 32b ADDITION (G4 (4a, 4b)): The gap groups walked ACCESSIBILITY, CONTROLS and MUSIC by key (1600x900) and by tap (390x844) in Chapters I and IV and measured TEXT SIZE 100/115/130 on the first menus, so this round has the frames; the capture owner's route itself still does not open the tabs, so the issue stays for the next index.
Expected: A deep review shows text size, motion, flash and colour-vision settings on frames, on desktop and phone.
Repro: Read run.json pause.tabs and index.json state of the 14-pause frames in any r32 run.
Evidence: critic/rounds/round-32/auditors/audit_interface-onboarding.md; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-ffx2-bahamut/run.json
Smallest fix: Add to the route: open the pause, step to ACCESSIBILITY, set TEXT SIZE 130, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS and COLOUR VISION one at a time, screenshot each with the first menu behind it, on desktop and phone, in one F1 chapter of each game.
Acceptance: The next index.json has one verified frame per setting per game and per size.
Confidence: high

### PR-0598 [minor] interface, both: The key prompt strip (Enter Select / G Intel / Q Defend / P Pause) is hidden from link 2 of an F1 chain: the victory-state class f1-over outlives its link
Chapter: F1 chains: Leblanc (FFX-2 VI), Trema (XIII), Den of Woe (XV), Isaaru (FFX XIV), Braska (FFX III)
Observed: G3 read .f1-prompts at every first menu: at the link 2 and link 3 seam menus of Isaaru, Den of Woe, Trema, Leblanc (links 2 and 3) and Braska (link 3) the strip has opacity 0 and the HUD root carries f1-over (seamPrompts 0, seamF1OverOnHudRoot true, the rule 'hud-f1 f1-over f1-prompts' matches); at link 1 and at every retried link 1 (a new BattleScreen and HUD) it is 1. Cause read in the source at e3f51bf18: HudF1.onEvent (src/ui/hudf1/HudF1.ts:250) adds f1-over on every victory or defeat event, only release() removes it (lines 164 and 194), and hudf1-act.css line 30 hides .f1-prompts under it; a chain's link victory is a victory event. The strip is the on-screen key help, so a player who reaches link 2 loses it exactly when a new boss arrives. Fallen Aeons (old HUD) keeps its prompts at links 2 and 3.
Expected: The victory-state class lives only for the link that ended; each link's first menu shows the key help.
Repro: Real keys, Leblanc: win link 1, read .f1-prompts opacity at the link 2 first menu (0) and after a loss and RETRY at link 1 (1). Same in Isaaru link 3, Den of Woe link 3, Trema link 2, Braska link 3.
Evidence: critic/rounds/round-32/gaps-G3-chains-overlays/3c-isaaru/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3c-den-of-woe/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3b-trema/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3d-leblanc/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3e-leblanc/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3f-braska/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/g3-summary.json
Smallest fix: Clear f1-over (and the other end-of-fight classes) when the next link begins, in the presenter's link seam (stageLinkBegins / the chain runner), not only in release().
Acceptance: At the first menu of every link of Leblanc, Braska, Isaaru, Trema and Den of Woe the .f1-prompts opacity is 1 and f1-over is absent from the HUD root.
Confidence: high for the measurement and the cause (the class and the rule are in the source)

### PR-0599 [minor] delivery, FFX-2 only: Retry from link 5 of Chapter V takes 38.6 s from the key to the first menu; every other retry took 9.5 to 16.5 s
Chapter: Chapter V Vegnagun and Shuyin, link 5
Observed: The results card names Defeat (turns 7, attempts 1); Enter on RETRY reached the battle (screens results, battle: no cutscene screen) and the first menu 38.55 s later, with Shuyin, boss-shuyin at gain 1 and resumeAt 5. The 9 other retries read in the same pass took 9.5 to 16.5 s (Fallen Aeons 16.5 s and 10.4 s, Trema 13.8 s, Sin core 11.1 s, Mirror Aeons 10.6 s, Isaaru 11.6 s, Den of Woe 10.6 s, Leblanc 9.5 s and 9.7 s, Braska 11.3 s). G4 (4e) saw the same link-5 entrance hold the music in silence from 26.4 to 40.8 s on the first visit, which is the likely share. Not traced: whether the retried link replays that entrance inside the battle and whether Enter skips it.
Expected: A retry of a link the player has seen returns to the first menu in about 10 s (PR-0587 acceptance); an entrance already seen is skippable.
Repro: Chapter V, hook to link 5, lose, Enter on RETRY, time to the first menu (3g-shuyin).
Evidence: critic/rounds/round-32/gaps-G3-chains-overlays/3g-shuyin/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4e-audio/run.json
Smallest fix: Read the retried link 5 start in the presenter; if the entrance replays, let a held Enter skip it as the first visit does.
Acceptance: Retry of Chapter V link 5 reaches the first menu in 15 s or less, or the entrance is skippable by the same key as on the first visit.
Confidence: low to medium (one run, cause not traced)

### PR-0600 [minor] onboarding, both: Phone pause touch targets: every ACCESSIBILITY row is 350 x 20 px and RESUME is 156 x 22 px, below 44 px and below the 24 px WCAG 2.2 AA minimum
Chapter: Phone pause (Chapters I and IV)
Observed: G4 (4b): the tab buttons are 47 px tall, but the five ACCESSIBILITY rows (TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION) are 350 x 20 px and the RESUME control is 156 x 22 px; all are tappable (data-action pause:row:<id>). Related to PR-0578 (board chips).
Expected: A touch target of at least 44 px (24 px is the WCAG 2.2 AA floor) for the controls a player with a motor or vision need reaches for.
Repro: Phone, Esc or the PAUSE chip, ACCESSIBILITY tab, read the row rects.
Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/p1-accessibility.jpg
Smallest fix: Give the pause rows and RESUME a 44 px minimum height on the phone class.
Acceptance: Every pause row and RESUME at 390x844 is at least 44 px tall.
Confidence: high

### PR-0601 [minor] interface, FFX only: Phone Items list: three of the six tiles on page 1 cut their names (MEGA-POTI..., PHOENIX DO..., MEGA PHOE...) and the pager's next button covers the left edge of the GUIDE chip
Chapter: Chapter I phone Items list
Observed: G4 (4b): MEGA-POTION, PHOENIX DOWN and MEGA PHOENIX are ellipsized in their tiles; the next-page button (44 x 44) sits on the left edge of the GUIDE chip (same family as PR-0518 CHANGE tiles).
Expected: Every name that can be shown is shown in full (CHK-009).
Repro: Phone, Chapter I, ITEMS, read page 1.
Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b2-items-page1.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
Smallest fix: Let the item tile wrap to two lines or shrink the count badge; move the pager clear of the guide chip.
Acceptance: Page 1 of the phone Items list prints all six names whole and the pager does not overlap a chip.
Confidence: high

### PR-0602 [minor] onboarding, both: Phone prep: the first-run Auron guide box and the START BATTLE spotlight sit over the Sphere Grid first-time card and cover part of its text and its SHOW ME ON THE GRID button
Chapter: Phone party prep, first visit to SPHERE GRID
Observed: G4 (4c): the Auron box ("Tabs are for later. Tap START BATTLE.") and the spotlight cover the card's text and its SHOW ME ON THE GRID button; GOT IT (102 x 44) is reachable.
Expected: A first-time card and the guide box do not compete for the same space; both stay readable.
Repro: Phone, fresh profile, Chapter I, party prep, tap SPHERE GRID.
Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-tab_SPHERE_GRID-card.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json
Smallest fix: Dismiss or move the Auron box while a first-time card is up.
Acceptance: The card's text and both of its buttons are uncovered on a fresh profile at 390x844.
Confidence: high

### PR-0591 [polish] interface, FFX-2 only: First-time fan: the CHAIN counter box changes place from frame to frame (right edge, under the tail, mid-screen) and is clipped at the right edge
Chapter: Chapter V Vegnagun
Observed: In seq-action-playing the CHAIN box moves in the 10 frames and is cut off at the screen edge in several; the guide and intent cards also sit over Shiva (Fallen Aeons) and the tail (Vegnagun).
Expected: A counter sits still and inside the screen.
Repro: Chapter V chain attack; fan sheet ffx2-vegnagun-shuyin-win-r32__seq-action-playing.
Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-action-playing.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-fallen-aeons-win-r32__seq-party-action.jpg
Smallest fix: Anchor the counter to one slot.
Acceptance: The CHAIN box does not move between consecutive frames and is not clipped.
Confidence: medium

### PR-0593 [polish] harness, both: 30-post-scene.png is taken before the post scene (it plays after CONFIRM): eight runs log 'screen wanted cutscene got results' and the scene still is missing
Chapter: six chapters
Observed: The scene is reachable and its lines were read after CONFIRM (33-after-confirm-scene.png, Leblanc: Rikku, "That's for robbing our airship!"), but the 30 capture reads results.
Expected: The post-scene frame is asserted where the scene is.
Repro: Read run.json fails of the six runs.
Evidence: critic/rounds/round-32/evidence/ffx2-leblanc-win-r32/run.json
Smallest fix: Assert 33-after-confirm-scene.png as the post-scene capture.
Acceptance: No UNVERIFIED on the post-scene frame.
Confidence: high

### PR-0577 [polish] interface, FFX-2 only: FFX-2 target flag plate overlaps the command panel edge and clips the status tag ("Curse") at 1280 to 2000 wide (new in r68)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV
Observed: Focused review R68-P2, candidate bundle (same artifact as live).
Expected: No overlap and no clipped tag.
Repro: Chapter IV, Attack, target step, 1280 to 2000 wide.
Evidence: critic/reviews/2a9340249-focused.json
Smallest fix: Offset the flag clear of the panel edge.
Acceptance: Flag and panel rects do not intersect at five widths.
Confidence: medium (focused review; not re-observed live by the chief)

### PR-0578 [polish] interface, both: Phone board: three text chips under 44 px (skip the guide 18 px, two hint chips) (R68-P3)
*Carried from round 31; not re-examined in round 32.*
Chapter: phone board
Observed: Focused review R68-P3; the chief's phone sweep read 14 px type, none under 14 px, on the battle menu, first menu and pause (separate from touch-target size).
Expected: 44 px touch targets.
Repro: tools/text-floor-sweep.mjs --touch=1 --targets=1 --sizes=390x844.
Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/gaps-chief/gaps/sweep/out-phone.json
Smallest fix: Pad the chips to 44 px.
Acceptance: Touch-target probe lists no control under 44 px on the board.
Confidence: medium

### PR-0579 [polish] visual, FFX-2 only: Magic Break caption box sits over its own pink tag and clips it (FFX-2 Chapter IV, 2000x1012; one capture)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-bahamut
Observed: The caption box overlaps the MAGIC BREAK tag so the tag text is half hidden. On the phone the same two labels sit side by side without clipping (23-midfight).
Expected: One readable label.
Repro: node critic/runner/lib/route.mjs ffx2-bahamut win --size=2000x1012 --seed=1; open 23-midfight.png (moment dependent).
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/23-midfight.png
Smallest fix: Offset the tag or drop the duplicate while the caption shows.
Acceptance: A Magic Break capture shows one readable label.
Confidence: low

### PR-0553 [polish] interface, FFX only: Chapter II: Tidus's HP plate covers Yunalesca's lower body in the hit frame; the party panel crosses Auron's boots (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: yunalesca
Observed: The plate sits over her legs and feet during the damage burst.
Expected: HUD off the boss body or faded over it.
Repro: Chapter II, seed 3, first hit, 23-midfight.
Evidence: critic/rounds/round-31/evidence/yunalesca-win/23-midfight.png
Smallest fix: Move the plates down or fade over a boss quad.
Acceptance: No plate over the boss body at that moment.
Confidence: high

### PR-0548 [polish] feel, both: Hit flashes, whiteouts and glow edges wash out the figure for a frame or more (carried): Braska's Final Aeon is a white blob for five frames on a heal, Vegnagun flickers copper for a frame, Rikku glows double at the sphere change
*Carried from round 31; not re-examined in round 32.*
Chapter: braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-bahamut
Observed: Fan strips: braska seq-action-playing f02-f06; vegnagun seq-action-playing f04 and f09; bahamut seq-spherechange f01-f02.
Expected: A flash that stays readable.
Repro: Chapter III Power Wave heal; Chapter V chain; Chapter IV change.
Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-action-playing; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing
Smallest fix: Cap the heal wash and the glow on the figure's alpha.
Acceptance: The figure outline stays readable in the named frames.
Confidence: medium

### PR-0574 [polish] feel, FFX only: A boss or aeon and its pagodas appear in one frame (Braska battle start and aeon swaps); the party flashes from faded to full in one frame at the seams (first-time fan; the feel auditor read seams 3 and 5 as readable and paced)
*Carried from round 31; not re-examined in round 32.*
Chapter: braskas-final-aeon
Observed: See captures; the arena is empty for about 1.1 s, then a flash and the possessed aeon with a name banner.
Expected: A readable arrival.
Repro: Chapter III by real keys.
Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-transition-into-battle; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
Smallest fix: None until Bailey judges the seam look (PR-0530).
Acceptance: A recorded verdict.
Confidence: low

### PR-0575 [polish] feel, FFX only: MISS pops over healthy allies when a party-wide Mega Phoenix is used with one ally down (unsourced; do not change without a source)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux
Observed: The engine logs miss reason wrong-state for tidus and yuna while Kimahri's revive resolves; it reads as if the item failed. Round 30b saw the same.
Expected: Unknown: no source says what the original draws.
Repro: Chapter I seed 1 turn 3.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f04.jpg; critic/rounds/round-31/evidence/seymour-flux-win/battle-log.json
Smallest fix: Source the original, or ask Bailey.
Acceptance: A sourced statement then the same repro.
Confidence: low

### PR-0576 [polish] feel, FFX only: UNVERIFIED observation: a blank cream cutscene frame between the Yunalesca victory and the results card
*Carried from round 31; not re-examined in round 32.*
Chapter: yunalesca
Observed: yunalesca-win/30-post-scene.png: flat cream with the chapter eyebrow and the advance strip and no painting; the harness read the screen as results (UNVERIFIED capture). Chapter I shows a washed painting.
Expected: The painting under the wash, or a few frames only.
Repro: Chapter II seed 3, capture at the end of the fight (timed sequence needed).
Evidence: critic/rounds/round-31/evidence/yunalesca-win/30-post-scene.png
Smallest fix: None until measured.
Acceptance: A timed sequence shows under 500 ms of a painting-less frame.
Confidence: low

### PR-0536 [polish] feel, both: The turn cut-in (MF-16) covers nearly half the stage for several frames at every turn start in every chapter the fan looked at; the first-time fan rated it major
Chapter: all
Observed: Carried; the first-time fan counted the turn-start cut-in covering most of the stage for about three frames in 11 chapters of both games (Trema, Den of Woe, Fallen Aeons, Bahamut, Yojimbo, Sin face, Evrae, Yunalesca, Natus, Mirror Aeons) and a giant damage number over the boss. A design choice awaiting Bailey's look (PR-0530).
Expected: Bailey's judgment.
Repro: Any chapter, turn start.
Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-transition
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: medium

### PR-0528 [polish] visual, both: First-time fan polish breakers kept: attacks that do not visibly connect (a Yunalesca slash arc around Tidus while she stands at the right edge; a Bahamut hit that arrives as a purple streak from off-screen), one empty-stage frame as Bahamut fades in, a monster vanishing for a frame (Mortiorchis)
Chapter: yunalesca, ffx2-bahamut, seymour-flux
Observed: Carried; round 32 adds two fan readings: Vegnagun's Tail Beam damage number (1766) and a pink ring appear on Rikku but the tail does not visibly fire toward her (seq-party-action frames 4 to 8), and Ormi's Shield Bash lunge returns in one frame with a MISS floating in the gap.
Expected: Effects aimed at their target.
Repro: see captures
Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange
Smallest fix: Aim the slash and the streak from the actor.
Acceptance: Frames show origin at the actor.
Confidence: low

### PR-0524 [polish] encounter, FFX-2 only: research/ffx2-bahamut.md still carries the superseded Mega Flare constant 24 and the 614 to 1,165 damage with no banner (carried)
Chapter: ffx2-bahamut
Observed: Carried: research/ffx2-bahamut.md still carries the superseded Mega Flare constant and damage range with no banner (git diff 2a9340249 e3f51bf18 -- research is empty).
Expected: A superseded banner.
Repro: head and section 2.3 of research/ffx2-bahamut.md against re-ffx2-ai-bahamut-vegnagun.md section 2.3.
Evidence: research/ffx2-bahamut.md
Smallest fix: Add the banner.
Acceptance: The banner exists.
Confidence: high

### PR-0533 [polish] test-coverage, both (tooling): The 15 s default test timeout fails 27 CPU-bound suites when the suite shares the host with browser jobs (extends PR-0533; the 13 files pass 239 of 239 serially)
*Carried from round 31; not re-examined in round 32.*
Chapter: advisor, strategy-chapter2, door tests, ui-ffx2-atbmode, audio-manifest-io
Observed: 28 failed in 27 suites, all 15 s timeouts (one EPERM on a lock file) while the harness ran.
Expected: A green full suite on a loaded host.
Repro: npm test while a capture runs.
Evidence: critic/rounds/round-31/audit-combat/full-suite.json
Smallest fix: Give the fuzz-style files a 60 s timeout; retry the lock open on EPERM.
Acceptance: npm test passes while one browser job runs.
Confidence: high

### PR-0519 [polish] interface, both: Question for Bailey (carried): the default F1 HUD shows the advisor as a one-row chip; the reason, benefit and CURES KO tag live only in the G card
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters I and IV
Observed: Advice itself is right: 784 of 784 picks found their row; the reason is one key away.
Expected: Bailey's decision.
Repro: Chapter I first menu.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/11-advisor.png
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: high

### PR-0546 [polish] prep, both: The pro-defeat card now names its cause at normal speed ('Felled by Attack, turn 4, attempt 1' ) after r67's repair; the SKIP-speed wording was not re-run
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters I and IV
Observed: Seen at normal speed in both chapters; SKIP not re-run.
Expected: A cause at every speed.
Repro: Lose with battle speed SKIP.
Evidence: critic/rounds/round-31/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
Smallest fix: Run it at SKIP.
Acceptance: The card names a cause at SKIP.
Confidence: medium

### PR-0487 [polish] onboarding, FFX only: 'He strikes first' coach against a turn order that puts Seymour third (carried; not reproduced in seed 1 where Seymour does strike first)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I phone
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0508 [polish] onboarding, both: VISUAL STYLE and PRESENTATION 'THE ECHO - B' are unexplained and the FFX options pane shows no focused row (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: options
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0569 [polish] delivery, both: Firefox console font warnings for Rajdhani and Chakra (carried; Chromium only this round)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0526 [polish] interface, both: Small copy and fit points in the booth and phone surfaces (carried, not re-examined)
*Carried from round 31; not re-examined in round 32.*
Chapter: booth, phone
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0527 [polish] delivery, both: UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 runs in round 29 (carried; none seen in the 19 live runs, but see the 5.6 s frame in PR-0580)
*Carried from round 31; not re-examined in round 32.*
Chapter: harness
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0595 [polish] interface, FFX only: A ready Overdrive sits as the fifth row inside the bottom fade; the advisor's star is the only cue
Chapter: Chapter XIV Isaaru
Observed: 'OVERDRIVE (star) READY' is drawn at roughly a quarter strength under the scroll fade with a down arrow; the advisor's pick (Grand Summon: Shiva, IN OVERDRIVE) lives in that row while the cursor starts on SPECIAL.
Expected: A ready Overdrive reads as ready without scrolling.
Repro: Chapter XIV first menu, Yuna, 1600x900.
Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png
Smallest fix: Float a ready Overdrive row to the top slot or exempt it from the fade.
Acceptance: At 1600 the OVERDRIVE row's text contrast is at least 4.5:1 whenever the gauge is full.
Confidence: medium (contrast not measured)

## Issue closures
- PR-0559: TEXT SIZE 100 to 115 to 130 scales the desktop F1 HUD in Chapters I and IV on the live bundle (Chapter I: turn strip 401 to 461 to 522 px wide, command column 425 to 489 to 552, party plates 500 to 575 to 650, ribbon 413 to 475 to 537, hero 180 to 207 to 233, prompt bar 484 to 556 to 629; Chapter IV: party plates 485 to 558 to 631, command column 443 to 509 to 575, hero 300 to 345 to 390) and the phone command menu type goes from 16 to 20.8 px (G4 4a, 4b). The overlaps at 115 and 130 are PR-0558.
- PR-0587: a lose-and-retry at a later link was read on the live bundle in all 9 chained chapters (G3): every retry returned to the expected link with its own boss and music, a clean first menu and 0 console errors; the retried wins paid the same rewards as the clean wins. The two findings it produced are PR-0598 and PR-0599.
- PR-0520: the first-load time of the live URL was measured in a browser (G4 4d): cold load to an interactive title 0.9 s median (0.86, 0.89, 1.00 s; 3.1 MB, 15 requests; cache off, 1600x900, host idle) and 22.5 s throttled to 1.6 Mbit/s and 150 ms; the first Enter to the board 21.4 s through the Auron briefing's own timeout (a second Enter brings it at once). The phone profile is PR-0567.

## What stands between this build and acceptance
- Every category scored, which needs the four UNVERIFIED categories (audio, onboarding, prep, delivery) rerun by their auditors; no milestone is claimed while any is missing.
- visual and feel at 9.0 or more: CHK-026 and CHK-027 PASS in all 19 chapters (PR-0531, PR-0380, PR-0379, PR-0581, PR-0582), open at the same severity for five reviews (rounds 29, 30, 30b, 31, 32) and still owing a written method check.
- CHK-009 and the CHK-003 clipped half fixed (PR-0586), CHK-020 (PR-0543), and CHK-001 and CHK-B1 settled by Bailey's listening verdict (PR-0148).
- 18 of 18 required targets matched (3 unverified, 2 waiting) and every human judgment recorded.

## Proposals (nothing here is built without Bailey's yes)
- Written method check for the pose-swap family (RUBRIC section 8: PR-0531, PR-0380 and PR-0379 have been open at the same severity in rounds 29, 30, 30b, 31 and 32): read the worst strip per class (Braska Tidus flip, Ixion KO slide, Vegnagun tail, Den of Woe Rikku kneel, Sin fin, Trema Paragon), say which release-69 and 70 switches helped, then choose continue, change method or ask Bailey. Nothing built without his yes.
- Take the Braska return-flip scale and the Isaaru and Anima ProneLay candidate out of the treated holds, or cap them, and re-run the harness on Chapters III, VII and XIV before release 71 (booth batch 4) widens the same behaviour; the smallest test is the harness at seeds 1 and 2.
- Show Bailey the still beside Chapter I of a treated arena and an untreated one (J6) and ask for one verdict on the grade (PR-0585), and one on Yuna's dress change (PR-0589).
- Teach the route harness to tap the Items page button and Poison Fang's enemy plate, add mirror-aeons to LONG_FIGHT_BUDGET_MS, assert 33-after-confirm-scene as the post-scene capture and open ACCESSIBILITY, CONTROLS and MUSIC (PR-0483, PR-0592, PR-0593, PR-0597). The lose-and-retry at a later link is no longer a proposal: g3chain.mjs (accepting both the TRY AGAIN and RETRY labels) reads it in all 9 chained chapters.
- Measure the sound pass (LUFS, true peak, voice margin) in Chapters II, III and VI and one more FFX-2 chapter before it is called done in ten chapters (PR-0588).
- Clear the f1-over class at the next link's start so the key prompt strip returns in links 2 and later of an F1 chain (PR-0598), and read why the Chapter V link 5 retry takes 38.6 s (PR-0599). Both are small and in the F1 HUD / presenter seam release 71 is already touching.
- Phone: give the pause rows and RESUME a 44 px minimum height (PR-0600), let the Items tiles show their names (PR-0601) and keep the Auron box off a first-time card (PR-0602). The phone10 load improved on live (11.1 s and 18.4 s); the next step toward the 8 s and 50 MB lines is the load order and the wire bytes (PR-0567).
- A question for Bailey, not a build proposal (AGENTS.md rule 10): key remapping is not built although the approved mock drew REMAP KEYS and RESET KEYS: build it or drop the line from the rubric reading (PR-0596).
- Re-run the audio, onboarding, prep and delivery auditors on the round-32b evidence (G2 to G4) so the four categories can carry numbers; the first-time-fan breakers that match no filed issue (about eight, listed in the auditor merge) are left to the driver to fold into PR-0379 and PR-0574 or ignore.

## Next review
The deep and focused obligations of releases 69 and 70 are settled by this re-issue if critic-clear accepts it (changed area FAIL; CHK-001 and CHK-B1 stay UNVERIFIED, filed non-mandatory, and pass nothing). The next review owes: the harness on Chapters III, VII and XIV after any change to the booth holds (PR-0581, PR-0582); the four UNVERIFIED categories (audio, onboarding, prep, delivery: rerun their auditors on the round-32b evidence); Bailey's listening verdict and his answers on J6, the camera and cut look and the key-remapping question; the written method check for the pose-swap family; the fixes for PR-0586, PR-0598 and PR-0599 re-read on the live build; three phone10 runs per chapter and a five-visit memory read (PR-0567, PR-0573).

## Server hygiene
No server was started by the chief or by G1 to G4 (the live site was the subject); no RIG-RECORD lock is held; no tracked file in the release tree changed; the release-71 candidate's branch and dist-gate were not touched.
