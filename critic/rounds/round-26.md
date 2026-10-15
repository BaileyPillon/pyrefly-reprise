# Round 26: deep review of candidate r47-rc b8aa6f96 (before deploy)

```text
Build / artifact / target version: b8aa6f96 (candidate, bundle DA6NOD0r, manifest hash 916e84ca631eab30...) / not yet deployed / targets ba8a7e74a9d6
Review: deep (save-data class, before deploy)
Deployment: NOT APPLICABLE (candidate not deployed)
Changed area: UNVERIFIED (no regression or new failing case found; parts of the new work unproven)
Ship: SHIP. No critical defect, no regression against live ca9fd0b4. Majors disclosed: PR-0380, PR-0295, PR-0148, PR-0099, PR-0421
Milestone: not assessed
Quality: provisional, no weighted total (narrative, audio, interface, onboarding, prep, delivery UNVERIFIED); last full score: round 24/25 history
Targets: required 51 / matched 36 / failing 0 / unverified 14 / waiting 1
Top issues: PR-0380 jerks (CHK-027 FAIL, carried), PR-0295, PR-0148, PR-0099, PR-0421, PR-0451 (bosses obey Silence, undisclosed), PR-0454, PR-0453, PR-0456, PR-0457
Coverage: see the matrix below
Next required review and why: deep review on the live build after the deploy; this report settles no deep obligation (unscored categories, UNVERIFIED mandatory checks)
Elapsed review time / repeated work avoided: about 190 min; reused round 25 data audits and the focused instruments with dependency arguments
```

## Score output (verbatim)
```text
score: PROVISIONAL — no verified score for narrative, audio, interface, onboarding, prep, delivery (never averaged away, never zero)
below the 9 floor: encounter, visual, feel
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for narrative, audio, interface, onboarding, prep, delivery
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is UNVERIFIED
  - mandatory check CHK-005 is UNVERIFIED
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-007 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is UNVERIFIED
  - mandatory check CHK-010 is UNVERIFIED
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-020 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 5 critical or major issue(s) remain open
  - encounter yunalesca has no complete real-input flow
  - 14 required target(s) unverified
  - 1 required target(s) waiting
  - only 36 of 51 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148, PR-0099)
  - human judgment not recorded: Visual: is the Rikku colour correction acceptable in play across all eight dresspheres (the delegated strength pick)
  - human judgment not recorded: Feel: Bailey's play of the KO dissolve, recoil, blends and the camera cuts (CHK-B2, PR-0437)
  - human judgment not recorded: Accessibility: does COLOUR VISION help a player with a colour weakness (CHK-B3 style judgment)
  - human judgment not recorded: Encounter: human-pace target for FFX-2 V, XIII, XV and the Chapter IX random-play question (PR-0227, PR-0447)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

critic-clear output: `critic:clear no pending marker for build b8aa6f96: kept as candidate evidence`

## Ship reasons
- No critical defect and no regression against live was found: the save-data change is proven (an old live save loads with both new fields off, a reload keeps them, two tabs merge per key, reset clears them, blocked storage does not crash).
- The FFX-2 engine is per-seed identical to live (7 chapters x 60 seeds) and the 200-seed paired FFX bench is identical to live seed by seed, so RC7 L-CMD changes no outcome on the shipped intended line; 17 of 18 chapters were won by real keys, lose and retry in both games.
- Rikku FFX-2 colour correction reads right against the approved Yuna and Paine paintings, and approved art is intact (916 ok, 0 mismatched).
- The three 130 percent TEXT SIZE e2e failures also fail on live with the same elements (re-run by the chief), so they are not new.
- The five majors are carried from round 25, none introduced by this change and none shown to regress; they are disclosed. Unproven parts of the new work (REDUCE FLASHES clips, colour-vision battle groups, a Silenced boss turn, Chapter II real-key win) are UNVERIFIED, not defects found; the ship call rests on no critical defect and no regression, not on those being proved.

## The ten categories

### combat: 9.5
Auditor combat, round 26 (read by the chief). RC7 L-CMD is FFX only (13 files); the FFX-2 engine is untouched. Data re-read from command.bin: Entrust MP 8, Nul-All 4, 246 of 246 records equal. Paired 200-seed bench of the shipped intended line against live: outcome, turns and KOs identical on 200 of 200 seeds in every FFX chapter; FFX-2 per-seed identical on 60 seeds in 7 chapters; goldens 18/18, 6/6, 3/3; 243 parity files and 143 chapter files green; attack-only wins 0 and random 0 except Yojimbo. Doublecast ran 35 times in real play with no damage on a KO foe. Why not higher: PR-0383 and PR-0427 open; the fizzle path, cost refusal, Out of reach and a Silenced Yuna menu have no real-key capture (CHK-023); bosses obeying Silence is undisclosed (PR-0451). Nothing found that is a regression.

### encounter: 8.9
Auditor encounter. Unchanged from round 25: no enemy stat, AI, phase rule, party preset or chapter definition changed (empty diff over src/data/encounters.ts, src/data/ffx2, src/battle/ffx2). 17 of 18 chapters have a real-key win; Chapter II has none (route bot, PR-0397) and the engine intended line wins its seeds 3 of 3. Carried: PR-0227, PR-0407, PR-0447, PR-0448, PR-0257. The new boss Silence enforcement moves Flux phase 2 nearer research row 7 but its balance effect is unmeasured (PR-0451).

### visual: 8.7
Auditor visual-targets, confirmed by the chief on the Rikku sheet and the Thief crop. 8.6 at round 25; +0.1 because the FFX-2 Rikku pose-colour defect is corrected: face, green eyes, golden hair, warm skin and whites sit at the approved Yuna and Paine colour level, Dark Knight and Warrior unchanged; limits as the handoff says (sandy lower strands, Lady Luck yellow). Approved art intact (916 ok, 0 mismatched). Composites read for 44 tiles; compositions hold. Held back by CHK-027 FAIL (141 jerks, PR-0380), the Kimahri and Auron colour change (PR-0436) and the fan size reading (PR-0457).

### feel: 8.5
Auditor feel, held at round 25 value 8.5: neither earns nor loses a point. Timed 10-frame sequences for Chapter I and IV, the summon clip (about 1.5 to 2.2 s, menu back at 3 s) and the Change clip read as in round 25. Open: PR-0380, PR-0379, PR-0437, PR-0438. Many gap-pass clips (attack, special) did not capture the move they name (PR-0450), so hit latency is not newly measured.

### narrative: UNVERIFIED
UNVERIFIED: the specialist auditor scored this category, but its entry did not reach the chief intact (the hand-over was truncated), so the chief cannot defend a number; round 25 value 8.7 is shown for reference only and is not carried. Issues the auditor raised that did reach the chief are in the list. src/story is unchanged by this change.

### audio: UNVERIFIED
UNVERIFIED and locked: no numeric owner listening score exists for the shipped mix (PR-0148, CHK-B1); agents cannot hear. Technical health was read by the chief: every cue decodes, -16.0 LUFS, 24 of 26 pass the stereo gate, themes-audit 4 of 26 depart (PR-0374), 9 chapters on stand-ins (PR-0099). The audio files are identical to live.

### interface: UNVERIFIED
UNVERIFIED: the specialist auditor scored this category, but its entry did not reach the chief intact (the hand-over was truncated), so the chief cannot defend a number; round 25 value 8.2 is shown for reference only and is not carried. Issues the auditor raised that did reach the chief are in the list. Findings that reached the chief: PR-0453 (130 percent clips, same on live), PR-0456 (ring over the intent card), PR-0356 (4K type), PR-0295.

### onboarding: UNVERIFIED
UNVERIFIED: the specialist auditor scored this category, but its entry did not reach the chief intact (the hand-over was truncated), so the chief cannot defend a number; round 25 value 8.3 is shown for reference only and is not carried. Issues the auditor raised that did reach the chief are in the list. New this round and proved by the chief: the ACCESSIBILITY tab exists with five rows and persists (CHK-024 PASS); the phone gate pips show letters R G B Y in both colour-vision modes at 390x844 (gaps/gridcv). Open: PR-0454 (no explanation or preview), REDUCE FLASHES and the battle HUD colour groups not captured.

### prep: UNVERIFIED
UNVERIFIED: the specialist auditor scored this category, but its entry did not reach the chief intact (the hand-over was truncated), so the chief cannot defend a number; round 25 value unverified is shown for reference only and is not carried. Issues the auditor raised that did reach the chief are in the list. The prep captures are read-only views; a changed prep value reaching the first battle menu was not shown, and the PREP-A stat deltas under COLOUR VISION on a phone were not captured (they carry arrows and numbers).

### delivery: UNVERIFIED
UNVERIFIED: the specialist auditor scored this category, but its entry did not reach the chief intact (the hand-over was truncated), so the chief cannot defend a number; round 25 value unverified is shown for reference only and is not carried. Issues the auditor raised that did reach the chief are in the list. Read by the chief: the candidate builds (5222 files, decode-checked), art verify and audit PASS, save-data compatibility PASS (CHK-024), 17 of 18 chapters to the board with lose and retry. Not measured serially: frame stalls (PR-0395). The exact live artifact does not exist yet (deployment NOT APPLICABLE).

Sub-scores (not weighted): characterModels 8.4, enemyModels 8.1, animation 7.8, fidelity 8.6, camera 7.5. No continuity cap applies (CHK-026 PASS, 0 snaps a minute).

## Target gate
required 51, matched 36, failing 0, unverified 14, waiting 1 (tile 35, PR-0399). Visual auditor's count on 44 composites made from round-26 captures; unverified tiles are listed in the visual auditor capturesNeeded (47, 06, 04, 36, 38, 39, 18, 24, 29, 32, 42, 46, 49 and one more); tile 35 waits on a decision (PR-0399).

## Checks

- CHK-001 FAIL (mandatory): Read by the chief from the files on disk. Technical half green: ffmpeg decodes every cue with no error and each sits at -16.0 LUFS (peaks -1.5 to -5.3 dBFS); the stereo gate passes 24 of 26 cues. FAIL on the check own rule: (a) no owner sign-off by ear for the shipped mix (PR-0148); (b) themes-audit FAILs 4 of 26 composed cues (scene-gagazet, scene-dreams-end, scene-farplane, scene-macalania-templ
- CHK-002 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list.
- CHK-003 FAIL (mandatory): Two readings: (a) carried: pause and prep type is about 10 to 12 px at 3840x2160 and the first-time coach card covers prep content (PR-0356, PR-0391; evidence/gaps/pause-matrix-3840x2160/02-pause.png); (b) at 130 percent TEXT SIZE the FFX command-list scroll arrow and the THUNDER sensor chip clip at 1600x900, 2000x1012 and 390x844 (PR-0453). The chief re-ran the three accessibility-a2.spec.ts 130 
- CHK-004 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list. PR-0383 (aeon Defend row) is carried and its code is unchanged.
- CHK-005 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list.
- CHK-006 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list.
- CHK-007 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list.
- CHK-008 FAIL (mandatory): FFX-2 Ch IV Attack target step: three ellipses of the reticle ring lie over the intent card and hide part of the ALSO paragraph and the E HIDE, NEXT and N HIDE MOVES hints (PR-0456, viewed by the chief). The first-time coach card also covers prep content (PR-0356). The visual auditor found the battle panels on empty stage in the mid-fight frames, so the failure is in the target step, not in free p
- CHK-009 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list.
- CHK-010 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list.
- CHK-011 PASS (mandatory): Each boss is visible in a sampled mid-fight frame (11 chapters). The Fallen Aeons frame catches the hit flash, so the Magus Sisters are not seen there (their tile is in progress).
- CHK-012 PASS (mandatory): art-derive verify PASS: 3778 masters, 0 problems, 1263 sidecars each only the fields the game reads; art audit PASS (0 dangling); build privacy gate PASS (1291 text files). Approved art intact: verify-approved ROOT=D:/pyrefly-r47 916 ok, 0 mismatched, 0 missing. Read by the chief from the gate logs.
- CHK-013 PASS (mandatory): Rikku FFX-2 dresspheres read against the approved Yuna and Paine paintings: viewed by the chief in the 3x crop of the Thief dressphere in play and in the eight-dressphere before/after sheet. Face, green eyes, golden hair, warm tan skin and whites read right; the orange lower strands go sandy (Songstress, Alchemist, Gunner) and Lady Luck keeps her yellow dress, as the handoff says. Only the Thief w
- CHK-014 PASS (mandatory): Battle poses face correctly and hold; the pause portraits are viewer-facing plates and were not judged by battle rules.
- CHK-015 UNVERIFIED (mandatory): Real keys and touch are proved for pause (Esc and P in every state), targeting and the flows (capture owner, evidence/*/run.json, gaps/keys-*.log). UNVERIFIED as a whole because the new FFX command behaviours of RC7 (a Silenced Yuna keeps Summon, a Silenced Scan row greys, an out-of-reach command shows Out of reach and leaves the turn open) are proved only by unit tests and no capture reaches them
- CHK-016 PASS (mandatory): Every capture carries asserted state with a stale-root readback (index.json). Four captures were recorded UNVERIFIED by the harness (post scene wanted, results got) in evrae-airship, ffx2-ixion-djose, ffx2-leblanc and seymour-anima-macalania; those chapters have no post cutscene and no wrong-screen image was kept as evidence.
- CHK-017 NOT APPLICABLE (mandatory): The candidate is not deployed, so there is no live artifact to compare. The candidate own manifest was built (5222 files, artifactHash recorded in build.artifactHash, decode-checked; the only problems listed are the two Paine eyeR-catch layers that decode to one flat colour, an intentional flagged exception as in round 25). No critic/artifacts/b8aa6f96.json exists yet; the deploy writes it.
- CHK-018 PASS (mandatory): The art audit finds 515 literal art names in the bundle: 36 shipped files, 479 derived masters, 0 dangling.
- CHK-019 PASS (mandatory): Candidate manifest decode-checked every shipped file; the only flat-colour decodes are the two intentional Paine eyeR-catch layers (listed exception). Audio: ffmpeg decodes every cue with no error.
- CHK-020 UNVERIFIED (mandatory): The specialist auditor for this check returned a result, but its entry (result and evidence) did not reach the chief intact (the hand-over was truncated), so the chief cannot cite it and records UNVERIFIED rather than carrying round 25 forward. Any defect that auditor raised and that did reach the chief is in the issue list. The game case is written for every change in the combat auditor CHK-021 e
- CHK-021 PASS (mandatory): Game case written for every change: RC7 L-CMD is FFX only (docs/handoff/re-parity-rc7-cmd.md; commit 19029cfb), Rikku colour FFX-2 only, ACCESSIBILITY both, sidecar trim both. Proved for the combat part: git diff ca9fd0b4..b8aa6f96 over src/battle/ffx2 and src/data/ffx2 is empty; the FFX-2 engine is per-seed identical to live (7 chapters, 60 seeds); ffx2-atb-golden 6/6.
- CHK-022 UNVERIFIED (mandatory): 17 of 18 chapters reached victory, results and chapter select by real keys, lose and retry done in both games. Chapter II Lady Yunalesca never won by the stock route: defeat (139 turns), a stall at 15 minutes, defeat (124 turns) on the 45-minute rerun; retry reached battle each time. The route bot is the limit (the engine intended line wins the same seeds 3 of 3 and 180 of 200 fresh seeds; PR-0397
- CHK-023 UNVERIFIED (mandatory): Traced from the event logs of 27 real runs: the cost gate and aim gate run on every FFX action; Doublecast ran 35 times with each cast paying its own MP and no damage on a KO foe; a Silence landed on Yuna once and she acted. NOT reached by any real run: a cost-gate refusal, the Doublecast second-cast fizzle, Out of reach, a Silenced Yuna menu, a Silenced boss losing a gated spell. Proved at engine
- CHK-024 PASS (mandatory): Save data proven by the chief reading savecheck.json: an old save written by the LIVE build ca9fd0b4 (28 settings, neither new field) loads on the candidate with REDUCE FLASHES off and COLOUR VISION off, all 28 old settings unchanged, version still 1; set in the UI, a reload keeps both and applies data-reduce-flashes and data-colour-vision; two open tabs (A turned REDUCE FLASHES off, B stepped COL
- CHK-026 PASS (mandatory): Harness 5 of 5 chapters dedicated, 2197.7 s of battle, 59.8 to 60 fps: 0 of 2887 swaps over tolerance (2150 head-registered with the worst 0.3 percent, 737 read by mass with the worst 26.6 percent under the 30 percent tolerance), feet at most 1.2 px; the one costume swap is an FFX-2 dressphere change, not a pose swap. A pass on registered heads shows the table is applied, not that it is right (RUB
- CHK-027 FAIL (mandatory): 141 jerks of 40 px or more in one frame (worst 195.1 px, Fallen Aeons); 0 snaps (0 a minute, under the 0.25 cap); 2647 swaps with a ghost frame, worst severity 0.377 (none over the fail line). Worst per chapter against round 25 live: Flux 75.7 (73.9), Bahamut 42.1 (76.7), Yunalesca 149.3 (149.9), Evrae 107.8 (129.8), Fallen Aeons 195.1 (967.7). Counts of 40 px or more: Flux 9, Bahamut 1, Yunalesca
- CHK-B1 UNVERIFIED (mandatory): No numeric owner listening score for the shipped mix exists (docs/audio/OWNER-VERDICT.md has nothing after 2026-09-28; D-780 has no returned number). Agents cannot hear (hard rule 13); the audio category stays unscored.

## Coverage matrix

Tested:
- save-data class by a labelled-injected old live save (CHK-024)
- 18 chapters by real keys, 17 won (CHK-022), lose and retry in both games, 2000x1012 and 390x844
- continuity harness on 5 chapters (CHK-026, CHK-027)
- combat: paired 200-seed FFX bench and 60-seed FFX-2 bench against live, raw command.bin audit, goldens
- Rikku colour (sheet and in-play crop)
- phone gate pips under both colour-vision modes at 390x844
- 130 percent TEXT SIZE e2e on candidate and live
- audio technical gates
- art gates and candidate manifest
- first-time-fan lens on the strips

Reused (with dependency argument):
- Round 25 data audit of 979 command records, aeon recovery counts and the CTB tick table (from critic/rounds/round-25.json): dependency argument: empty git diff over turnQueue, ctb, statuses, Overdrive kernels, aeon gear and command_status.json; the 246 command-table bytes re-read this round
- Round 25 human-pace FFX-2 benches (PR-0227, PR-0407, PR-0422) and carried PR-0383, PR-0427, PR-0257 (from critic/rounds/round-25.json): src/battle/ffx2 and src/data empty diff; FFX-2 per-seed identity re-run this round
- Art gate logs (verify 278 s, audit, dist-local-paths) (from capture owner gates/*.log): no art or sidecar changed after they ran
- Tile-to-capture pairing of the target gate (from round 25 targets/p1-p3.json): mapping only; every composite was remade on round-26 captures

Not tested:
- REDUCE FLASHES effect (22 sources) as clips; COLOUR VISION in the battle HUD (4 groups) and the PREP-A stat deltas
- a Silenced Yuna menu, a Silenced boss turn, the Doublecast fizzle, Out of reach by real keys
- Rikku seven of eight dresspheres in a real fight frame
- 13 of 18 chapters through the continuity harness
- live-build control for the jerk counts and the Ch IV ring overprint
- serial frame-time comparison with live

Required and not tested:
- CHK-022 Chapter II real-key win, post scene and results
- CHK-023 the unreached RC7 paths by real input
- CHK-015 the changed command menus by real keys
- CHK-002, 004 to 007, 009, 010, 020 (specialist results not delivered to the chief)
- CHK-B1 owner listening score
- REDUCE FLASHES and COLOUR VISION battle proof (changed area)
- scored entries for narrative, interface, onboarding, prep, delivery

## Ranked issues

### PR-0380 [major, feel, both] introducedByCandidate=False regressionVsLive=unknown
**PR-0380 (carried, CHK-027 FAIL, merges the three jerk issues and the fan breakers about teleports and pops): figures and some bosses still jump, pop or teleport 40 px or more in one frame**

- Game/chapter: both / FFX I, II, VIII; FFX-2 IV, XI (harness); fan: XI, VIII, IV
- Expected: No jerk of 40 px or more in one frame outside a camera cut; entrances fade or move in.
- Observed: 141 jerks of 40 px or more over 2197.7 s of battle in 5 chapters (Flux 9, Bahamut 1, Yunalesca 95, Evrae 19, Fallen Aeons 17; worst 195.1 px at an x2-Shiva entrance), 0 snaps. The worst strips are entrances and fade-ins (x2-Shiva, Kimahri, Anima in earlier rounds) where a figure appears at a new place in one frame, plus Valefor, Auron and Yuna steps at swaps; the fan also saw Bahamut grow in one frame (jerk-007) and Yuna go pale for one frame (jerk-003, a Save Sphere wash).
- Repro: node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:<port>/ --chapters=seymour-flux,ffx2-bahamut,yunalesca,evrae-airship,ffx2-fallen-aeons --tag=r26 (seed 1, PYREFLY_BROWSER=gpu, BASE_PATH=/)
- Evidence: critic/rounds/round-26/continuity/continuity-summary.json; critic/rounds/round-26/continuity/ffx2-fallen-aeons-win-r26/continuity/strips/jerk-001-x2-shiva.jpg; critic/rounds/round-26/continuity/evrae-airship-win-r26/continuity/strips/jerk-000-kimahri.jpg; critic/rounds/round-26/continuity/ffx2-bahamut-win-r26/continuity/strips/jerk-007-bahamut.jpg
- Confidence: high for the measurement, medium for the cause (read from strips by eye)
- Requirement: CHK-027; RUBRIC section 6 feel; D-420 to D-426
- Smallest fix: Give entrances and fade-ins an in-between (a short fade or slide) instead of a one-frame appearance; start with the entrance of x2-Shiva and the Kimahri fade-in, then Anima, Overdrive Sin and Paragon (round 25 list).
- Acceptance: The harness over the chapters reports no jerk of 150 px or more outside a staged entrance flagged as such, entrances show at least a 3-frame fade, and jerks of 40 px or more fall under 100 in total.

### PR-0295 [major, interface, both] introducedByCandidate=False regressionVsLive=unknown
**PR-0295 (carried, not re-observed by the chief): the heavy party-prep tabs are a desktop frame shrunk to a phone**

- Game/chapter: both / FFX and FFX-2 prep tabs at 390x844
- Expected: A phone-first prep list readable at about 14 px.
- Observed: Observed at round 25; this round the 390x844 prep captures exist (gaps/preptabs-bah390, preptabs-flux390) but the chief did not judge them, and nothing in the candidate changes the layout rule (the diff touches pause-phone.css by 16 lines and the FFX-2 phone gate pips only).
- Repro: Fresh profile, 390x844 touch, Chapter IV or I prep, open the tabs
- Evidence: critic/rounds/round-26/evidence/gaps/index.json
- Confidence: medium (carried)
- Requirement: RUBRIC section 6 interface and prep
- Smallest fix: One shared single-column list per tab at 14 px (needs Bailey mockup pick first, hard rule 9).
- Acceptance: The tab-3 EQUIPMENT capture on a phone shows 14 px rows and no horizontal scroll.

### PR-0148 [major, audio, both] introducedByCandidate=False regressionVsLive=False
**PR-0148 (carried, eighth review): no numeric owner listening score for the shipped mix**

- Game/chapter: both / all
- Expected: A recorded owner listening score or per-cue ear verdict (RUBRIC section 6 audio, CHK-B1).
- Observed: docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; Bailey later ear words are negative or unscored (D-682, D-683) and D-780 (Owner Checks, 1 to 10) has no returned number. The ElevenLabs cues of 2026-10-10 and 2026-10-12 were chosen under delegation, not by ear. The audio files are identical to live.
- Repro: Read docs/audio/OWNER-VERDICT.md and grep docs/target/decisions.json for audio after 2026-10-12
- Evidence: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json
- Confidence: high (confirmed by the confirmer)
- Requirement: RUBRIC section 6 audio; CHK-001, CHK-B1
- Smallest fix: Bailey plays the Owner Checks session or docs/audio/audition.html and gives one 0-to-10 number for music and one for SFX. No agent infers a number.
- Acceptance: A dated verbatim entry with a number, paired with the build.

### PR-0099 [major, audio, both] introducedByCandidate=False regressionVsLive=False
**PR-0099 (carried): nine chapters still play borrowed or stand-in scene beds or battle cues**

- Game/chapter: both / FFX IX, X, XII, XIV, XVII, XVIII; FFX-2 XIII, XV, XVI
- Expected: Each chapter plays its own composed cue (D-209).
- Observed: The chapter cue map marks those rows borrowed or stand-in (scene-gagazet, scene-dreams-end, scene-bevelle-underground, scene-fahrenheit reused; Chapter XVI plays Chapter XI boss cue). Routing matches the map (0 of 18 depart). Music batch 2 (D-785) is not in this build.
- Repro: node tools/audio/themes-audit.mjs, read the chapter cue map; docs/audio/THEMES.md
- Evidence: critic/rounds/round-26/audio/themes-audit.txt; docs/audio/THEMES.md
- Confidence: high (confirmed by the confirmer)
- Requirement: D-209; RUBRIC section 6 audio
- Smallest fix: Ship music batch 2 (D-785) and have Bailey hear it; nothing to change in this candidate.
- Acceptance: themes-audit lists those rows as own and the routing samples show the new cue.

### PR-0421 [major, visual, FFX-2] introducedByCandidate=unknown regressionVsLive=unknown
**PR-0421 (carried, NOT re-observed, UNVERIFIED): the Ch IV wide camera pull may show the backdrop plate edge**

- Game/chapter: FFX-2 / Ch IV Bahamut
- Expected: No plate edge or blank margin at any camera pull.
- Observed: Not re-judged this round. The first-time fan saw the Change clip push the camera in and the party shoved to the left edge (PR-0437) but no plate edge was measured.
- Repro: Round 25 note; Ch IV change clip
- Evidence: critic/rounds/round-26/evidence/gaps/clip-change
- Confidence: low (carried, unverified)
- Requirement: CHK-008, CHK-011
- Smallest fix: Re-capture the wide pull at 1600x900 and 2000x1012 and read the edges.
- Acceptance: Frames at the widest pull show full plate coverage.

### PR-0453 [minor, interface, FFX only] introducedByCandidate=False regressionVsLive=False
**PR-0453 (new to the list, NOT new to the build): at 130 percent TEXT SIZE the FFX command-list scroll arrow and the THUNDER sensor chip clip**

- Game/chapter: FFX only / Ch I Seymour Flux first command menu (arrow also on the 390x844 phone)
- Expected: No readable element is cut off at any TEXT SIZE step.
- Observed: accessibility-a2.spec.ts 130 percent tests fail at 1600x900, 2000x1012 and 390x844 naming ffx-cmd-more--down and ffx-sensor__chip. The chief ran the same three tests against live ca9fd0b4 (config copy aimed at echoesofspira.com): the same three fail with the same elements. Not a regression.
- Repro: PYREFLY_BROWSER=gpu, BASE_PATH=/, tests/e2e/accessibility-a2.spec.ts -g 130 from D:/pyrefly-r47 on the candidate and with baseURL https://echoesofspira.com/
- Evidence: D:/Tools/pyrefly-scratch/tmp/pwo-cand; D:/Tools/pyrefly-scratch/tmp/pwo-live
- Confidence: high
- Requirement: CHK-003, CHK-009
- Smallest fix: Give the arrow and the chip room (min-width or no overflow clip) at the 130 percent step.
- Acceptance: The three 130 percent tests pass on the candidate.

### PR-0454 [minor, onboarding, both] introducedByCandidate=True regressionVsLive=False
**PR-0454 (new, inside the new ACCESSIBILITY tab): the COLOUR VISION rows carry no explanation of RED-GREEN and BLUE-YELLOW and no preview**

- Game/chapter: both / pause ACCESSIBILITY tab
- Expected: A player who does not know the terms can pick the right mode and see what changes (RUBRIC section 6 onboarding).
- Observed: Five bare rows under COMFORT; values OFF / RED-GREEN / BLUE-YELLOW with no hint line saying which weakness each answers or what changes (target brackets, status tints, gate pips, letters R G B Y).
- Repro: Esc from the first menu, E to ACCESSIBILITY, step COLOUR VISION
- Evidence: critic/rounds/round-26/evidence/savecheck/02-set-on-red-green.png
- Confidence: high
- Requirement: RUBRIC section 6 onboarding
- Smallest fix: A one-line hint under the selected row and ideally a swatch of the four groups.
- Acceptance: Selecting COLOUR VISION shows a hint readable at 390x844 and at 130 percent TEXT SIZE.

### PR-0456 [minor, interface, FFX-2 only] introducedByCandidate=False regressionVsLive=unknown
**PR-0456 (new to the list, introduced-by unknown): the FFX-2 target-step reticle ring overprints the intent card text**

- Game/chapter: FFX-2 only / Ch IV Bahamut, Attack target step, 1600x900
- Expected: The intent card stays readable while a target is chosen (CHK-008).
- Observed: Three pink ellipses of the ring lie over the card and hide part of the ALSO paragraph, E HIDE, NEXT and N HIDE MOVES (viewed by the chief). No live comparison was run.
- Repro: Seed 1, real keys: Ch IV, prep, first menu, Attack
- Evidence: critic/rounds/round-26/evidence/gaps/target-ffx2-bahamut/t1-single.png
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Draw the ring under the HUD layer or move the card while the ring is up.
- Acceptance: The same shot shows the ALSO line and both key hints unobstructed.

### PR-0457 [minor, visual, both] introducedByCandidate=False regressionVsLive=False
**PR-0457 (new, fan-reported, low to medium confidence): figures change apparent size and stance at pose swaps (Paine, Rikku, Auron, Kimahri)**

- Game/chapter: both / FFX-2 IV, FFX II
- Expected: A figure keeps its height across poses except where the painting differs by design.
- Observed: The fan read head size changes of x0.83 to x1.24 and a foot shift at swaps in the strips (Paine hurt/cast, Rikku hurt/cast, Auron hurt/critical, Kimahri idle/hurt). The harness measured registered heads at most 0.3 percent and feet at most 1.2 px; the 737 swaps without a registration were read by mass (worst 26.6 percent, under the 30 percent whole-figure tolerance), so a silhouette difference between poses is a measurement of the painting, not necessarily a size error. Cause not established.
- Repro: Strips swap-020, 024, 058, 164, 264 in ffx2-bahamut-win-r26 and swap-022 in yunalesca-win-r26
- Evidence: critic/rounds/round-26/continuity/ffx2-bahamut-win-r26/continuity/strips; critic/rounds/round-26/continuity/yunalesca-win-r26/continuity/strips
- Confidence: low to medium
- Requirement: CHK-026 (registration limit, RUBRIC 6a); D-420
- Smallest fix: Register the heads of the 737 mass-read swaps so CHK-026 judges them on the 3 percent line; Bailey eye is the independent check (CHK-B3).
- Acceptance: measuredWithRegistration covers Paine, Rikku, Auron and Kimahri and none is over 3 percent.

### PR-0458 [minor, delivery, both] introducedByCandidate=False regressionVsLive=False
**PR-0458 (new to the list, NOT new to the build): the owner first name ships in the JS bundle through 11 face-crops notes**

- Game/chapter: both / production bundle
- Expected: No personal name in player-visible code (public repo, no PII).
- Observed: index-DA6NOD0r.js carries notes like Bailey pick 2026-09-24 from src/ui/common/face-crops.json (11 occurrences). The live source ca9fd0b4 has the same 11 (verified by the chief). dist-local-paths passes because it checks paths, links and sidecar keys only.
- Repro: grep -o Bailey in M:/pyrefly-builds/r47-deep/dist-gate/assets/index-DA6NOD0r.js
- Evidence: critic/rounds/round-26/gates/dist-local-paths.log
- Confidence: high
- Requirement: public-repo no-PII standing rule
- Smallest fix: Strip the note fields from the shipped projection of face-crops.json, as was done for the art sidecars.
- Acceptance: 0 hits for Bailey in the built assets.

### PR-0379 [minor, feel, both] introducedByCandidate=False regressionVsLive=False
**PR-0379 (carried, merges the fan ghosting breakers): double images at pose swaps (two see-through copies for 3 to 4 frames)**

- Game/chapter: both / FFX I, II; FFX-2 IV
- Expected: A pose change blends without two bodies at once.
- Observed: 2647 swaps carry a ghost frame (worst severity 0.377, none over the fail line). The fan listed Paine, Rikku, Bahamut, Seymour, Mortiorchis, Kimahri, Auron; the Auron and Kimahri colour change between poses is PR-0436.
- Repro: ffx2-bahamut-win-r26 swap-020, 024, 058; seymour-flux-win-r26 swap-021
- Evidence: critic/rounds/round-26/continuity/ffx2-bahamut-win-r26/continuity/strips; critic/rounds/round-26/continuity/seymour-flux-win-r26/continuity/strips
- Confidence: medium
- Requirement: CHK-027
- Smallest fix: Shorten the blend or cut on large silhouette changes (round 25 advice).
- Acceptance: Severe double images under the round 25 count of 44.

### PR-0436 [minor, visual, both] introducedByCandidate=False regressionVsLive=False
**PR-0436 (carried, NARROWED: Rikku FFX-2 resolved by this candidate; FFX Kimahri and Auron colour change between poses remains)**

- Game/chapter: both / FFX I, II (Kimahri, Auron)
- Expected: A figure reads in one colour set across its pose paintings.
- Observed: Rikku FFX-2 dresspheres are corrected (CHK-013 PASS). The fan still saw Kimahri blue with an orange sash in one pose and greyish in the next, and Auron coat olive then brown (item to critical).
- Repro: seymour-flux swap-046 Kimahri ready/follow; yunalesca swap-805/807 Auron
- Evidence: critic/rounds/round-26/continuity/seymour-flux-win-r26/continuity/strips; critic/rounds/round-26/continuity/yunalesca-win-r26/continuity/strips
- Confidence: medium
- Requirement: RUBRIC section 6 visual
- Smallest fix: The same colour pass as Rikku for Kimahri and Auron, with Bailey strength pick.
- Acceptance: Strips show one colour set across poses.

### PR-0383 [minor, combat, FFX only] introducedByCandidate=False regressionVsLive=False
**Carried from round 25, not introduced by this change. PR-0383 (FFX only): an aeon menu offers an enabled Defend row with no effect**

- Game/chapter: FFX only / aeon fights
- Expected: No inert enabled row.
- Observed: Round 25 reproduction with Bahamut; the Defend row code is untouched by RC7 (only the Summon row hunk changed).
- Repro: round 25 aeon-defend.out
- Evidence: critic/rounds/round-25/audit-combat/aeon-defend.out
- Confidence: high (carried, not re-run)
- Requirement: CHK-004
- Smallest fix: Hide or grey the row, or give it the sourced effect.
- Acceptance: An aeon command list has no inert enabled row.

### PR-0427 [minor, combat, FFX only] introducedByCandidate=False regressionVsLive=False
**Carried from round 25, not introduced by this change. PR-0427 (FFX only): Counterattack and the Auto-* reactions fire for a sleeping or Threatened wearer**

- Game/chapter: FFX only / reactions
- Expected: Reactions respect the can-act gate.
- Observed: Reaction code is unchanged against live; the RC7 gates only add a refund path for a prepaid reaction item.
- Repro: as round 25
- Evidence: critic/rounds/round-25.json
- Confidence: medium (carried)
- Requirement: research/re-ffx-ctb-status.md
- Smallest fix: Gate reactions on the can-act flag.
- Acceptance: A sleeping wearer does not trigger a reaction.

### PR-0227 [minor, encounter, FFX-2 only] introducedByCandidate=False regressionVsLive=False
**Carried from round 25, not introduced by this change. PR-0227 / PR-0407 (FFX-2 only, a question for Bailey): Chapters V, XIII and XV are won about half or less at human pace; Chapter XIII retry restores the party**

- Game/chapter: FFX-2 only / V, XIII, XV
- Expected: A target for difficulty chosen by Bailey.
- Observed: FFX-2 engine and data are identical to live (per-seed W/L identical on 60 seeds; zero-delay Trema 43 of 60, Vegnagun 57 of 60).
- Repro: audit-combat/ffx2-measure-cand.json
- Evidence: critic/rounds/round-26/audit-combat/ffx2-measure-cand.json
- Confidence: high
- Requirement: RUBRIC section 6 encounter
- Smallest fix: Bailey decides (method check owed).
- Acceptance: Bailey's decision.

### PR-0397 [minor, harness, FFX] introducedByCandidate=False regressionVsLive=False
**PR-0397 (critic tooling, carried, third fire; merges PR-R26-PD-01): the stock route Phoenix-Downs Yunalesca, so Chapter II has no real-key win on this candidate**

- Game/chapter: FFX / Ch II Yunalesca
- Expected: One real-key Chapter II win with post scene and results.
- Observed: Five stock-route attempts over two runs: defeats of 139, 139, 121 and 124 turns and one stall (14 Phoenix Down picks aimed at Yunalesca per run.json). The engine intended line wins seeds 1, 1001 and 2001 and 180 of 200 fresh seeds; attack-only and random win 0 of 60. No product fault found.
- Repro: node critic/runner/lib/route.mjs yunalesca win --attempts=3 --budget=2700000, seed 1
- Evidence: critic/rounds/round-26/evidence/yunalesca-win-b45/run.json; critic/rounds/round-26/audit-combat/yuna-routeseeds.json
- Confidence: high on the harness limit
- Requirement: CHK-022
- Smallest fix: In critic/runner/lib/route-pure.mjs resolveTargetId return the exact-id match before any prefix match (fold in the round 25 patch), then rerun Chapter II at seeds 1 to 5.
- Acceptance: Chapter II stock route wins with 0 target mismatches.

### PR-0450 [minor, harness, both] introducedByCandidate=False regressionVsLive=False
**PR-0450 (critic tooling, carried; merges the wrong-base preview silence, the unregistered queue continuity run and the mis-captured attack and special clips)**

- Game/chapter: both / critic harness
- Expected: A harness fails fast with a clear cause and captures the move it names.
- Observed: A preview started without BASE_PATH=/ answers 200 for / but 404 for assets and every route times out at 120 s with no message (first continuity run, 0 s of battle); queue.mjs ran the continuity probe with no pose registration, so its CHK-026 FAIL up to 69.6 percent is an instrument artefact (the dedicated run PASSES on registered heads); the attack and special clips open the target step and press Defend, so no strike or special resolves in them (the fan UI-covering-the-action breaker rests on these and is dropped).
- Repro: continuity/run.failed-localhost.err; gaps/clips2.mjs
- Evidence: critic/rounds/round-26/continuity/run.failed-localhost.err; critic/rounds/round-26/gaps/clips2.mjs
- Confidence: high
- Requirement: RUBRIC section 5 (separate harness from product failures)
- Smallest fix: route-evidence.mjs checks the first script URL and says wrong base path within 10 s; clips press Enter twice and wait for the enemy turn.
- Acceptance: A wrong-base preview prints the message within 10 s; clip.json marks an action-start within 2 s.

### PR-0395 [minor, delivery, both] introducedByCandidate=False regressionVsLive=unknown
**PR-0395 (carried; merges PR-R26-PD-02): frame stalls of 3 to 6 s in three of four candidate probes, cause not established (loaded host likely)**

- Game/chapter: both / Flux, Bahamut, Yunalesca
- Expected: Max frame under 800 ms at 58.5 fps or better.
- Observed: Max frame 3,261 ms (Bahamut), 6,117 ms (Flux) and 5,872 ms (Yunalesca first run) in the shared route queue; the dedicated continuity run read 59.8 to 60 fps. Round 25 live serial: 123 to 778 ms.
- Repro: compare serial candidate and live probes
- Evidence: critic/rounds/round-26/continuity/continuity-summary.json
- Confidence: low
- Requirement: RUBRIC section 2
- Smallest fix: Re-measure serially against live; no code change proposed.
- Acceptance: Serial max frame under 800 ms and no worse than live.

### PR-0356 [minor, interface, both] introducedByCandidate=False regressionVsLive=False
**Carried from round 25, not introduced by this change. PR-0356 / PR-0391 (CHK-003 FAIL at 3840x2160): pause and prep text is about 10 to 12 px and the first-time coach card covers prep content**

- Game/chapter: both / pause at 4K; prep tabs
- Expected: At least 14 css px equivalent at 2160 tall; the coach card does not cover what it teaches.
- Observed: Pause tab strip and hints tiny at 3840x2160; the first-run card covers the lower part of the prep panel.
- Repro: Fresh profile at 3840x2160; Esc from the first menu
- Evidence: critic/rounds/round-26/evidence/gaps/pause-matrix-3840x2160/02-pause.png
- Confidence: high
- Requirement: CHK-003, CHK-008
- Smallest fix: Scale pause type with the screen height; place the coach card clear of the active section.
- Acceptance: Strip text at least 14 css px equivalent at 2160 tall.

### PR-0451 [polish, combat, FFX only] introducedByCandidate=True regressionVsLive=False
**PR-0451 (new, was R26-CMB-01; FFX only): a Silenced boss now loses about 40 Silence-flagged spells, which live never enforced, and nothing tells the player or the release note**

- Game/chapter: FFX only / Seymour Flux phase 2, Macalania, Natus, Omnis, Sin Genais, Evrae, Yunalesca counters
- Expected: A behaviour change that moves a canonical tactic is disclosed and captured once.
- Observed: Live executor has no Silence check; only the player menu and the Sin Genais AI consulted blockedBySilence. The candidate executeCommand costGate refuses any ability whose game record carries the Silence bit (mac-*, natus-*, omnis-*, mortibody-*, evrae-haste, guardian-*, silence-counter, Flux Reflect, Dispel, flare-self). A refusal emits no action-start and no message; the turn passes. Sourced (FFX.exe flags, re-read from command.bin: 0 differences in 246 records) and nearer canon, but the CHANGELOG names only Yuna Summon, Scan, Half MP and Doublecast; the builder measured 0 Silenced enemy casts in 5,500 intended-line runs, and no capture shows how a fizzled boss turn reads.
- Repro: Compare blockedBySilence callers at ca9fd0b4 and b8aa6f96; critic/rounds/round-26/audit-combat/gated.out; tests/unit/parity-ffx-engine-command.test.ts enemySilenced cases
- Evidence: critic/rounds/round-26/audit-combat/gated.out; src/battle/ffx/command-start.ts; src/battle/ffx/execute.ts
- Confidence: high on the code and flags, medium on the player-visible effect (not captured)
- Requirement: AGENTS.md rule 14, CHK-021, CHK-023
- Smallest fix: One sentence in the release note and CHANGELOG (bosses obey Silence now); capture one Silenced Seymour turn by real keys; measure a Flux Silence line over 40 seeds before and after. Any on-screen cue is a proposal needing Bailey yes.
- Acceptance: Release note names the rule; a real-key capture of a Silenced boss turn exists.

### PR-0452 [polish, combat, FFX only] introducedByCandidate=False regressionVsLive=False
**PR-0452 (new, was R26-CMB-02): the shared StatusId comment still says Silence blocks Summon**

- Game/chapter: FFX only / src/battle/common/types.ts:207
- Expected: The comment states per game what Silence gates.
- Observed: Line 207 says it blocks White and Black Magic and Summon; RC7 proved FFX Silence does not gate Summon. The card, the Studio row, commands.ts and the status data were corrected, this comment was not.
- Repro: Read src/battle/common/types.ts:207
- Evidence: src/battle/common/types.ts
- Confidence: high
- Requirement: AGENTS.md rule 14
- Smallest fix: Reword the comment: FFX gates the commands whose record carries the Silence flag (Scan included), not Summon.
- Acceptance: No FFX claim of Summon near the Silence comment.

### PR-0455 [polish, narrative, both] introducedByCandidate=False regressionVsLive=False
**PR-0455 (new, carried narrative polish): unattributed lines (five Guado guard lines in Ch VII, the four (Whistle) lines with blank speakers)**

- Game/chapter: both / FFX VII Macalania; FFX-2 VII-adjacent whistle lines
- Expected: A speaker on every spoken line.
- Observed: dboxTimeline shows blank speakers on those lines. Not changed by this build (src/story unchanged).
- Repro: Play the chapter by real keys; run.json dboxTimeline
- Evidence: critic/rounds/round-26/evidence/seymour-anima-macalania-win/run.json
- Confidence: high
- Requirement: RUBRIC section 6 narrative
- Smallest fix: Give the Guado lines a speaker tag.
- Acceptance: dboxTimeline shows a speaker on every line.

### PR-0437 [polish, feel, FFX-2] introducedByCandidate=False regressionVsLive=False
**PR-0437 (carried, a question for Bailey; fan-reported again): the Change clip pushes the camera in hard and shoves the party to the frame edge**

- Game/chapter: FFX-2 / Ch IV change clip
- Expected: A coherent camera at a dressphere change.
- Observed: Sampled frames show a tight framing with Yuna, Rikku and Paine about 1.3 times larger and the dragon moved.
- Repro: clip-change screencast
- Evidence: critic/rounds/round-26/evidence/gaps/clip-change
- Confidence: low to medium
- Requirement: RUBRIC section 6 feel
- Smallest fix: None proposed; Bailey decides.
- Acceptance: Bailey's verdict.

### PR-0438 [polish, feel, both] introducedByCandidate=False regressionVsLive=False
**PR-0438 (carried, fan-reported; merges the one-frame Valefor summon white-out): a white flash swamps the figure or the whole screen for a frame or several**

- Game/chapter: both / FFX II summon; FFX-2 IV hits
- Expected: A flash builds up and the pose stays readable.
- Observed: The summon clip goes pure white in one frame (c0400 to c0401, mean brightness 84 to 254) and fades over ten; Paine and Rikku hits blow out for 3 to 5 frames. REDUCE FLASHES (new) softens these but was not captured.
- Repro: gaps/clip-summon screencast frames c0400 to c0411; ffx2-bahamut jerk-009
- Evidence: critic/rounds/round-26/evidence/gaps/clip-summon
- Confidence: medium
- Requirement: RUBRIC section 6 feel
- Smallest fix: Ease the summon flash in over two frames.
- Acceptance: No frame-to-frame brightness jump over 100 in the summon clip.

### PR-0326 [polish, audio, FFX] introducedByCandidate=False regressionVsLive=False
**PR-0326 (carried, narrowed): the first SFX of a cold session fell back to the synth in 1 of 27 runs**

- Game/chapter: FFX / Ch III first run (loaded host)
- Expected: No synth fallback for a UI cue once the sprite is requested.
- Observed: Cursor-move x2 and confirm played via synth 2.3 to 2.95 s in; the rerun was clean; 26 of 27 runs clean.
- Repro: evidence/braskas-final-aeon-win/audio-debug.jsonl first row
- Evidence: critic/rounds/round-26/evidence/braskas-final-aeon-win/audio-debug.jsonl
- Confidence: medium
- Requirement: CHK-001, CHK-023
- Smallest fix: Queue the first tick until the sprite has decoded.
- Acceptance: Five cold loads on a throttled CPU show no synth row.

### PR-0374 [polish, audio, both] introducedByCandidate=False regressionVsLive=False
**PR-0374 (carried): themes-audit FAILs 4 of 26 composed cues against the bible (scene-gagazet, scene-dreams-end, scene-farplane, scene-macalania-temple)**

- Game/chapter: both / FFX I, III, V, VII, IX to XII, XIV; FFX-2 V, XI
- Expected: The bible and the cues agree or an exception is recorded.
- Observed: Same output as round 25.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: critic/rounds/round-26/audio/themes-audit.txt
- Confidence: high
- Requirement: CHK-001
- Smallest fix: Record the four as accepted exceptions or fix the bible rows.
- Acceptance: themes-audit reports 0 of 26 depart.

### PR-0262 [polish, narrative, both] introducedByCandidate=False regressionVsLive=False
**Carried from round 25, not introduced by this change. PR-0262 / PR-0390 / PR-0429 (narrative polish): the results quip ...Okay. Next one. on four chapters, FFX-2 XIII, XV and XVI opening in unattributed third person, Shuyin line repeating three times in about 48 s**

- Game/chapter: both / I, V, VIII, IX, XIII, XV, XVI, XVIII
- Expected: Attributed lines and no repeated quip.
- Observed: dboxTimeline shows them; src/story is unchanged by this build.
- Repro: run.json dboxTimeline
- Evidence: critic/rounds/round-26/evidence/ffx2-vegnagun-shuyin-win/run.json
- Confidence: high
- Requirement: RUBRIC section 6 narrative
- Smallest fix: Vary the quip, attribute the openers, cap Shuyin line at two uses.
- Acceptance: No line repeated more than twice in a fight.

### PR-0446 [suggestion, audio, both] introducedByCandidate=False regressionVsLive=False
**PR-0446 (carried, a question for Bailey): boss-seymour and chapter-select fail the stereo gate as shipped**

- Game/chapter: both / Ch I, XII; chapter select
- Expected: Bailey picks the as-heard or the narrowed variant by ear.
- Observed: boss-seymour corr 0.293, chapter-select 0.431 FAIL; 24 of 26 cues pass.
- Repro: node stereo-gate.mjs
- Evidence: critic/rounds/round-26/audio/stereo-gate.txt
- Confidence: high
- Requirement: D-582
- Smallest fix: Ask Bailey once.
- Acceptance: Bailey's pick.

### PR-0447 [suggestion, encounter, FFX only] introducedByCandidate=False regressionVsLive=False
**PR-0447 (carried, a question for Bailey, FFX only): random legal play wins Chapter IX (Yojimbo) 16 of 60 seeds**

- Game/chapter: FFX only / yojimbo-cavern
- Expected: Bailey's difficulty call.
- Observed: Identical per seed on live and candidate; every other FFX chapter 0 of 60.
- Repro: audit-combat/naive.probe.ts PROBE_POLICY=random
- Evidence: critic/rounds/round-26/audit-combat/naive-cand-random.json
- Confidence: high
- Requirement: RUBRIC section 6 encounter
- Smallest fix: None proposed.
- Acceptance: Bailey's decision.

Carried, not re-observed: PR-0405, PR-0396, PR-0222, PR-0366, PR-0384, PR-0387, PR-0354, PR-0357, PR-0369, PR-0386, PR-0372, PR-0330, PR-0373, PR-0352, PR-0257, PR-0254, PR-0410, PR-0399, PR-0448, PR-0444, PR-0445, PR-0434, PR-0430, PR-0435, PR-0422, PR-0423, PR-0378, PR-0439 to PR-0443, PR-0449: carried unchanged from round 25; the chief neither re-observed nor closed them

## What stands between this build and acceptance
Not a milestone review. For the milestone: every category scored and at least 9.0 (encounter 8.9, visual 8.7, feel 8.5 are below), PR-0380 and the four other majors closed, Chapter II won by real keys, REDUCE FLASHES and COLOUR VISION proven in battle, 14 tiles verified, Bailey listening score and the human judgments, and the exact live artifact verified.

## What changed since round 25 (rubric v2 only)
Candidate adds the ACCESSIBILITY tab and two save fields (proven), Rikku FFX-2 colour correction (visual +0.1, PR-0436 narrowed), the sidecar trim, and FFX RC7 command rules (identical per seed to live on the shipped line). Jerk worst cases are lower than round 25 live in all five chapters (195 against 968 px at Fallen Aeons). Chapter II still has no real-key win (route bot). Three 130 percent HUD clips are the same on live.

## Proposals (nothing here is built without Bailey's yes)
- Release note: one sentence that bosses obey Silence now (PR-0451), plus one real-key capture of a Silenced Seymour turn. Benefit: honest disclosure of a canon-moving change. Cost: a line and one capture. Fit: FFX only. Needs Bailey yes for any on-screen cue.
- A one-line hint and a four-swatch preview under the COLOUR VISION row (PR-0454). Benefit: players can pick the right mode. Cost: small. Fit: both. Preview: a mockup of the row at 390x844 first (hard rule 9).
- Fade or slide boss and aeon entrances in over 3 frames (PR-0380), x2-Shiva and Kimahri first. Benefit: removes the largest jerks. Cost: presenter edit. Fit: both. Needs Bailey yes.
- Tooling (no Bailey decision): fold the exact-id target patch into critic/runner/lib/route-pure.mjs and add a wrong-base-path check to route-evidence.mjs (PR-0397, PR-0450); run Chapter II at seeds 1 to 5 before the deploy.
- Register the heads of the 737 mass-read swaps so CHK-026 judges them at 3 percent (PR-0457).

## Server hygiene
The chief started no server and no browser. At the end no process listens on any port from 5400 to 5990 (5611 shows only closed TIME_WAIT sockets) and PID 71192, named in an auditor note, no longer exists. D:/Tools/pyrefly-overnight/PAUSE exists; the chief did not create it (an earlier agent of this run did) and left it in place, to be renamed away by its creator. Browser mode for every run: PYREFLY_BROWSER=gpu, headless Playwright, no black canvas, no fallback.
