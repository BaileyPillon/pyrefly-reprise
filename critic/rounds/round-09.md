# Critic round 09 (release-09 re-cut): deep review of candidate 5ddfde3

```text
Build / artifact / target version: main 5ddfde3023d016e9e6a4f8b8a47577bd44b4fa66 / bundle assets/index-Jw5R1yWQ.js / candidate artifact d125357b4e4c7759f3b69f68b0049a60acaddbcf3cb1c10fb5ee65dd7e0f4212 (dist-gate, not deployed; no critic/artifacts entry yet) / targets.json f051411d046610951f5e86b8a82aef8bac6d320f8e47bb985c6f4f00a3254815
Review: deep (save-data class: before the deploy)
Deployment: NOT APPLICABLE (candidate, not deployed)
Changed area: FAIL (the repaired intent panel breaks the existing pause; new majors in the advice surfaces)
Ship: HOLD. One major regression against live: PR-0122, the enemy-intent panel painted over the pause. Discloses 45 other open majors (listed below), none a regression.
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED, no number). Scored categories: combat 8.5, encounter 8.8, visual 7.6, feel 7.9, narrative 7.7, interface 7.3, onboarding 6.5, prep 8.4, delivery 8.0
Targets: required 31 / matched 19 / failing 11 / unverified 1 / waiting 5
Top issues: PR-0122 (pause overdrawn, HOLD), PR-0125 (Doublecast KOs Lulu), PR-0082 (no ch3 real-input win), PR-0124 (MP above max at seams), PR-0123 (intent odds contradict), PR-0126 (ch5 advisor path lost), PR-0094, PR-0092, PR-0096, PR-0097
Coverage: 6 chapters by real input on the production build (5 wins, 2 loss+retry routes, ch3 defeats only); save migration with the real live save; engine benches; 115 art hashes; audio routing (not heard). Reused: PR-0007 numbers, ch6 stat/AI audit, ch1-5 narrative (dependency arguments below). Not tested: touch, gamepad, other browsers, real phone, listening
Next required review and why: a deep report for the repaired re-cut before its deploy (save-data class); it may reuse this evidence plus a real-key pause matrix re-run
Elapsed review time / repeated work avoided: about 215 min wall clock; one capture owner for six auditors, three reuses under dependency arguments
```

## Score output (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: combat, encounter, visual, feel, narrative, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - build identity is incomplete (main sha, bundle and artifact hash are all required)
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
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-005 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-007 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-010 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-013 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-021 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 46 critical or major issue(s) remain open
  - encounter braskas-final-aeon has no complete real-input flow
  - 11 required target(s) failing
  - 1 required target(s) unverified
  - 5 required target(s) waiting
  - only 19 of 31 required targets matched
  - human judgment not recorded: Audio (CHK-B1)
  - human judgment not recorded: Hands-on feel (CHK-B2) and chapter 6 voices (CHK-B3)
  - human judgment not recorded: Open questions only Bailey can answer
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## Verdicts

- **deployment**: Candidate review: nothing is deployed, so live verification of the exact artifact is not applicable (CHK-017).
- **changedArea**: FAIL: the changed systems mostly met their targets (production build, White Wind, Wait default and the save migration, music fades, chain-seam card, Syndicate scale, committed cures, chapter 6 through its real flow), but the repaired intent panel breaks the existing pause (PR-0122, a regression against live) and opens new majors in the advice surfaces (PR-0123, PR-0126).
- **milestone**: not assessed (deep review).
- **ship**: HOLD: one major regression against the live build (PR-0122). Everything else critical or major is either not a regression, or inside a brand-new feature, and is disclosed.

### Ship reasons

- HOLD: PR-0122 (major) is a regression against the live build. The pause screen is clean on live 1b33971; on this candidate the now-visible enemy-intent panel paints over its close-up, its OPTIONS values and its THIS ENCOUNTER actions in every FFX-2 chapter and survives H, and the FFX chip does the same (reproduced independently; elementFromPoint returns the panel in six of six candidate cases, the panel is 0x0 on live).
- The smallest fix is one visibility rule: hide the .eint layer while the pause is open and restore it on resume. Pressing E before pausing already avoids it, which shows the fix touches nothing else.
- No critical defect was found. The save-data change behaves: a real release-08 save migrates to Wait once and keeps its progress, a real-key Active choice sticks, mid-battle and results reloads are correct, malformed storage never throws.
- Every other major is disclosed and carried, not blocking: not regressions (for example PR-0125 Doublecast, PR-0124 MP above max, PR-0094, PR-0097), unknown on a major (PR-0126, PR-0128; unknown holds only a critical), or inside brand-new features (PR-0123 intent odds, PR-0092 and PR-0096 chapter 6 art, PR-0087 Grenade).
- Apart from PR-0122 the candidate is better than live: a production build that builds, chapter 6 playable to a win and a loss by real input, Wait by default with a correct migration, boss music audible, White Wind working, the chain-seam card clear of the party, and the first real-input wins of chapters 1 and 5.
- The owner override quoted for this run was given for the deploy-cap refusal; it does not change this verdict (RUBRIC §6). Whether to ship past this HOLD is Bailey's decision, not the critic's.

## The ten categories

### combat: 8.5

Candidate main 5ddfde3 (D:/pyrefly-release HEAD 5ddfde3023d016e9e6a4f8b8a47577bd44b4fa66). No browser: I used the pure engines, seeded benches, the unit suite and the capture owner's real-input event logs. Full unit suite on the candidate: 261 files, 5,807 passed, 2 skipped, exit 0 (critic/rounds/round-09/combat-5ddfde3/unit-full.log). GAIN: PR-0086 is fixed. Over 40 seeds of Act III on the real engine, 38 of 40 White Wind casts resolved, each healing Leblanc and Ormi by 157-182 with 0 IMMUNE misses. The other 2 were still charging when the run ended (probe-ww2.json). That is 1/8 of 1,380 or 1,344 inside the step-7 randomiser (research ffx2-leblanc-syndicate §4.4, ffx2-combat-core §2.1). The chapter 6 real-input log shows the same thing in normal play: seq 429 heals Leblanc 175 and Ormi 164 and dispels a status on Ormi. Fractional damage on the trio still reads IMMUNE (tests/unit/chapters/leblanc-white-wind.test.ts, 12/12). Only the three Syndicate units carry immune-to-percentage-damage (grep), so the fix cannot reach another chapter. The chain multipliers in the real log are x1.45 at count 1 and +0.05 per link to x1.80 at count 8, as in §1.7. Act III HP values were re-sampled and all match §3.1-3.3. The damage bands are identical to e119552 (probe-dmg.json). FFX engine refactor: counter-inputs.ts is a pure move, and markEvraeRuntime is a no-op without the airship flag. Chapters 1-3 measure 26/40, 39/40 and 39/40 (+8/8 verifier seeds), the same as e119552. AGAINST, NEW (present on live, newly established): Lulu's Doublecast, the chapter-3 tactic that §4.2 sources and the advisor recommends, aims both casts at Lulu herself when entered through the real command menu. The data row targets 'self', the HUD resolves a one-target row to 'auto', and no spell or enemy step exists, so the engine falls back to Firaga on the caster. Through real keys, 39 of 39 Doublecasts in the two chapter-3 attempts hit Lulu. My probe KOs her from 5,700 HP on seeds 1, 7 and 42 (probe-doublecast.json). CARRIED: PR-0087, Grenade 376-423, always a crit, matching neither source; the conflict is written up for Bailey. Polish PR-0105, 0106, 0107, 0108, 0069, 0054 and 0053: the code is unchanged. Why 8.5 against 8.6 on e119552: one major is fixed, but a major of wider consequence is now proven on the real path. It is not a regression.

### encounter: 8.8

An independent bench on the real chain path (setupForNextLink, shipped intendedStrategy, chateauBuild), re-run on 5ddfde3: critic/rounds/round-09/combat-5ddfde3/bench-r09-{ch6-s1,ch6-s101,ctl-s1,ch5-s1}.json. CHAPTER 6 under the Wait default: 40/40 (seeds 1-40) and 39/40 (seeds 101-140) at D=0, 1,500 and 4,000 ms. Median 93 and 101 s, against 78 s on e119552, because White Wind now heals as §5.4 says. Credible mistakes still cost. Boss-first wins 36/40 and 36/40, with No Love Lost firing 35 and 26 times. The Huggles trap wins 40/40 and 39/40, and Huggles fires in 14-15 runs. Attack-mash wins 3/40 and 2/40. Chapter 4 control: 40/40. Chapter 5 under Wait at D=1,500: 40/40, median 381 s. The unit suite's own 40-seed runs give ch1 26/40, ch2 39/40, ch3 39/40, ch4 40/40 and ch5 40/40. The Mortiorchis-first, cure-Zombie, out-damage-Yu-Yevon and Charon mistakes still lose. GAIN: PR-0076 is fixed for every save. The capture owner's upgrade test took a save written by live 1b33971 (ffx2Atb 'active'), and the candidate read it as 'wait' with the marker. A later real-key choice of ACTIVE stuck through two reloads (evidence/5ddfde3/save/save-compat.json and active-sticks.json; save-ffx2-atb-migration.test.ts 8/8). Real-input wins now exist for chapters 1, 2, 4, 5 and 6. Chapter 6: win in 8:57 over 64 commands with 0 advisor misses, and a loss after a real-key flip to Active, idle to Defeat at 1:58, then RETRY. Chapter 5's is the first on record. AGAINST: chapter 3 has no real-input win in five attempts (PR-0082, now chapter 3 only). The cause is established as the Doublecast defect, which is scored in combat and not repeated here. PR-0008 (ch1 26/40) and PR-0007 are carried and STALLED, so a method check is owed. When the player chooses Active, ch6 wins 14/40 and 12/40 at 1.5 s and 6/40 and 0/40 at 4 s, and ch5 wins 2/40 at 1.5 s. The harness logs 250-460 refused submits in those arms, so this is not a clean player measure. Why 8.8 against 8.7: the default-mode collapse is gone for returning players, measured, and the new chapter sits in a fair band with its sourced healer working. It stays below 9 because of the stalled chapter 1 issues and chapter 3's unplayable signature tactic.

### visual: 7.6

Deep review round 09, candidate main 5ddfde3 (bundle assets/index-Jw5R1yWQ.js, artifact d125357b…4212, real production build in D:/pyrefly-release/dist-gate). Judged only from the capture owner's validated GPU-mode captures (PYREFLY_BROWSER=gpu) at evidence/5ddfde3, taken at 1600x900, 2000x1012, 2560x1080, 1280x960 and 390x844. I opened no browser and started no server. I read 28 target-versus-build composites and 12 contact sheets and crops in critic/rounds/round-09/targets/5ddfde3/. GAINS verified on this candidate: (1) PR-0093 is fixed. The Syndicate now stands at party scale in all three links (20-link-2, 20-link-3, 24-seam-3-first-menu), so stout Ormi is about Paine's height instead of towering over the party. (2) PR-0094 has improved. At chapter 5 seams 2, 3 and 4 the incoming Vegnagun part is fully in frame with every sub-part visible (24-seam-2/3/4-first-menu). The live 1b33971 capture (gaps/ch5-seams-live-1600x900/link-3-first-menu.png) still loses Yuna off the left edge. (3) All 115 approved files ship byte-identical (sha256, targets-hashcheck-5ddfde3.json). Against live 1b33971, the only shipped art changes are the chapter 6 to 8 subjects and art/manifest.json. (4) The new identity-LoRA poses for Leblanc and Logos (attack, cast, hurt, ko) keep the idle's identity, and Leblanc's cast pose now holds the fan fully open. (5) The 21:9 and 2000x1012 frames keep the composition. AGAINST, new: in FFX-2 the enemy-intent card now stays drawn over the pause close-up in every tab and after H (hide panels), across Yuna's, Rikku's and Paine's faces in chapters 4, 5 and 6 and on a phone. This is a regression against live, introduced by 624895d (R09b-VIS-01). Also new, at polish level: at 4:3 a hard-edged 16:9 dark band cuts through the chapter 6 backdrop; the chapter 6 cast queues in one file behind the party; the approved-adjacent Bahamut painting has un-removed white matte holes that bloom turns into glowing blotches. CARRIED and re-observed: PR-0092 (the goons are placeholder silhouettes), PR-0096 (Leblanc's idle holds the fan shut; Ormi's attack, cast, hurt and ko show a different shield and costume from his idle), PR-0097 (bloom on Yuna's White Mage and Gunner paintings), PR-0002 (Yuna hidden behind the FFX command stack in chapters 1 and 3), PR-0005 (turn cut-in never shown), PR-0031 (no ground ring or dim when targeting), PR-0035 (FFX-2 field mirrored), PR-0017 (phone battle shows no party), PR-0094 residue at seam 5 (Shuyin close-up, the acting girl off-screen). Unchanged from round 09's 7.6: the scale fix and seam framing are real gains, but the pause leak spoils the showpiece close-ups on every FFX-2 pause. Anchor 7: functional with conspicuous weaknesses. Provisional: no 1440p or 4K capture, and no chapter 6 capture at 2000x1012.

CHIEF NOTE: the gap pass added one target failure the auditor did not have (the Swordplay Overdrive overlay, PR-0128) and re-observed PR-0016 and PR-0079 on this build instead of reusing them. Score kept at 7.6: the Swordplay deviation is one tile, the overlay itself works.

### feel: 7.9

Deep review round 09, candidate main 5ddfde3 (dist-gate production build, artifact d125357b4e4c7759, bundle assets/index-Jw5R1yWQ.js). I judged it from the capture owner's evidence only, with no browser. The captures were taken in gpu mode (PYREFLY_BROWSER=gpu, no fallback) with real keyboard input and frames sampled every 250 to 350 ms. Contact sheets are in D:/Final Fantasy/critic/rounds/round-09/feel-narrative-5ddfde3/.

GAINS on the candidate:
(1) Chapter 6 action and reaction read clearly. In seq-action-playing, the numbers 548 / 618 / 384 and the counters CHAIN 1 x1.45 and CHAIN 2 x1.50 land within about 1.1 s, Ormi shows a hurt reaction, and the intent read-out moves to Concussive Blast by 1.7 s.
(2) The spherechange lands fast. The light pillar shows at 41 ms and Rikku stands in her White Mage outfit, with a name plate, by about 0.54 s.
(3) PR-0093 is visible in motion. At both chapter 6 seams (seq-seam-2, seq-seam-3) the camera pushes from a wide shot to the whole party facing the trio at party scale, with a name caption, inside 2.5 s. The first menu after each seam frames the party and every enemy.
(4) Retry respects the player. RETRY to prep takes about 3 s, and prep to battle 1.6 to 1.7 s, in chapters 1, 3 and 6 (run.json afterRetry / retryReachedBattle). The pre-battle scene is not replayed.
(5) One Enter hold skips a whole pre-battle scene in every chapter.
(6) The FFX sequences for chapters 1 to 3 keep their character: title card, intro sweep with a boss caption, then damage, reaction and the next menu. A mid-battle Seymour line appears in a speaker card at about 1 s.

COSTS:
(a) NEW, scored in narrative and cross-referenced here: every post-battle scene shows an empty painted room while its victory pose, camera and fx steps run. See N09-FN-02.
(b) PR-0104 is re-observed on 5ddfde3 (FFX-2, Wait). In seq-party-action, Yuna freezes in her throw pose from 0.31 s. Paine's menu is up by 0.57 s, and through 2.31 s no HP bar moves and no number lands.
(c) PR-0061 is carried. By the product's own play clock at the first menu that accepts input (polled, so an upper bound), the wait is 6.5 to 9.2 s: ch1 8.3, ch2 6.5, ch3 6.6, ch4 7.7, ch5 8.9 and ch6 9.1 s. Chapter 6 also plays two enemy actions (13 events) before Yuna's first menu. This is no worse than round 08's 6.8 to 8.1 s in the chapters both rounds measured.
(d) Cross-referenced, scored in visual: PR-0094. The chapter 5 seams at links 3, 4 and 5 still end on close-ups that split the party and cut off the Vegnagun parts. The seam-5 first menu shows Shuyin with Yuna and Rikku out of frame.
(e) Cross-referenced, scored in visual: PR-0017. On a phone, chapter 6 never shows the party through menus, targeting, actions or the spherechange (ffx2-leblanc-win-look-phone).
(f) PR-0109 (prep) is re-observed. After a clear, chapter select comes back on Chapter I.

Frame pacing is reused from the e119552 gap capture with a dependency argument (see reused). The candidate's presenter, renderer and stage code are unchanged since e119552.

Why the score stays at 7.9: the chapter 6 seam framing at party scale is a real gain in motion. It is offset by the empty victory beat now on record (scored in narrative), the whole-menu hold that stays unresolved, and the opening wait that is still open. Bailey's hands-on check (CHK-B2) is still not collected.

CHIEF NOTE: the gap pass re-measured two feel items on 5ddfde3 itself instead of reusing e119552: frame pacing in chapter 6 Act III (720 frames, mean and p50 16.7 ms, p99 16.8 ms, none over 33 ms, RTX 5070 Ti) and the skip-release to first-menu latency (ch1 9.7 and 8.5 s, ch6 10.4 and 9.8 s; PR-0061). Score kept at 7.9.

### narrative: 7.7

Chapter 6 (FFX-2 only) was judged from the shipped script src/story/scripts/ffx2-leblanc.ts at 5ddfde3. I read it against research/ffx2-leblanc-syndicate.md sections 9.1 to 9.4, and against the real-key captures of the win and loss runs.

The script is byte-identical to e119552: git diff e119552..5ddfde3 -- src/story research is empty. It was also exercised this round. tests/unit/story-ffx2-leblanc.test.ts passed 28/28 on the candidate, including the FFX-absence test. story-scripts, story-triggers, story-runner-cutscene and cutscene-advance-and-banner passed 132/132.

Seen in play on the candidate:
- Pre-scene lines 1 to 4 (run.json preScene).
- Esc over the scene opens the pause.
- Act III beats first-not-so-mighty-guard, logos-down and ormi-down fire in the real-key battle log (script-trigger at seq 18, 170 and 1835). The kill order was Logos, then Ormi, then Leblanc, so the beats read as authored.
- The victory results quip 'We got it back.' and NEW BEST.
- After CONFIRM the epilogue opens on 'That's for robbing our airship!' and ends at chapter select. A reload keeps the clear.
- The chapter 1, 2, 4 and 5 aftermath scenes are reachable: Seymour, Yunalesca's 'There. Now no one can summon it.', Rikku's '...Yunie.', and the Shuyin exchange.

The writing is faithful. It follows beats 3 to 15 of section 9.2 in order. The massage is played for comedy, Brother blows the cover, and the one sincere exchange is Paine's 'Turn it off.' Beat 14 runs without a joke. The voices match section 9.3: Leblanc's pet / dearie / lamb, and she keeps the last word; Logos is dry; Ormi is aggrieved. The trio are not moralised and Leblanc is not pathetic.

AGAINST:
(1) NEW on record (not a regression; structural since the post-scene system existed): post-battle scenes play on CutsceneScreen, which draws only a backdrop. Its camera, moveActor and setPose steps do nothing, and fx is a 90 ms flash (src/app/screens/CutsceneScreen.ts:380-392). So chapter 6's restored victory pose is an empty room for about 2.3 s (30-post-scene.png). Its beat 14 has Rikku asking 'What am I looking at?' with nothing to look at: the reveal is text over the Leblanc room backdrop. Yunalesca's 'thins like frost' dissolve is never seen either (N09-FN-02).
(2) PR-0102 is still open: '*better*' is at line 260, and the script is unchanged.
(3) PR-0103 is still open: the two Act III KO beats assume Logos falls first. Not exercised this run, because Logos fell first.
(4) PR-0021: the banter bank is still not built (carried).
(5) The chapter-select card names the chapter 'Leblanc', but its BOSS row reads 'Ormi + Dr. Goon + Fem-Goon' (N09-FN-03, polish).

The act-one-cleared and act-two-cleared seam scenes are reused from the e119552 gap capture with a dependency argument (see reused). This run's seam sequences start after the scene, at moment:battle-start.

Cross-referenced and scored elsewhere: Brother has no portrait (PR-0058, visual); the chapter borrows chapter 4's music cues (audio).

The score is 7.7, down 0.2 from round 09's first pass. The story is unchanged. The drop records the unstaged aftermath found this round, which affects the story's hinge beat in chapter 6 and endings in both games. Bailey's voice judgement (CHK-B3) is still not collected.

CHIEF NOTE: the gap pass captured chapter 6's seam scenes and the whole epilogue line by line on 5ddfde3 itself, so the seam-scene reuse from e119552 is no longer needed. Score kept at 7.7.

### audio: UNVERIFIED (no number)

No score is given, because no agent can hear and there is no numeric owner verdict for this mix. docs/audio/OWNER-VERDICT.md holds only 'Right direction, keep refining' (2026-09-19, explicitly not a number), and targets.json tile 'audio' approves the direction only. NOW.md also quotes a later owner verdict on the same shipped music: 'music is too reminsicent of snes music instead of the more modern final fantasy titles and clair obscur' (Bailey, Build C scope, 2026-09-21). OWNER-VERDICT.md has not recorded it. That verdict is negative and has no number, so the listening half stays UNVERIFIED (RUBRIC section 6, CHK-B1).

Technical and routing half, on candidate 5ddfde3 (artifact d125357b4e4c7759):
(1) Shipped bytes. dist-gate/audio/music, sfx and manifest.json are byte-identical to public/audio (cmp), and unchanged since live 1b33971; the last commit to touch them is a46eb28.
(2) qa.mjs. All 21 cues sit at -15.97 to -16.20 LUFS integrated with a true peak of -1.06 to -2.86 dBTP, 0 clipped samples and every loop seam ok. The SFX sprite has 134 cues with a -1.13 dBTP peak. Per-cue findings: 0; SFX findings: 0. BUT qa.mjs --strict exits 1 on 47 orphan audition files in audio/candidates (PR-0100, carried). Those files take the shipped audio to about 62.4 MB, over the tool's own 60 MB budget, of which the game uses 34.9 MB.
(3) Artifact manifest. All 70 audio files decode 'ok', with 0 problems.
(4) themes-audit. 3 of 21 cues still depart from the bible (PR-0039, carried).
(5) PR-0089 is FIXED and verified on the production build. The capture owner sampled audioDebug() slot gains in 14 real-input runs on both games, and every pre-scene and battle-first-menu sample shows the intended cue at gain 1 with no stuck fading slot. The chapter-select waltz no longer lingers: fading [] everywhere. The chain seams in chapters 5 and 6 hold their boss cue at gain 1 at +0, +1.5 and +3 s. Victory cues are at gain 1 on results for ch1, ch2, ch5 and ch6 (victory-ffx for FFX, victory-ffx2 for FFX-2). Ch4 has no fanfare by design (encounters.ts). Stopped cues clean up by results time. RETRY re-cues the boss theme (ch3, boss-jecht at gain 1). The fix also makes the authored silences real: ch1 now opens its pre-scene on 'Wind only - no score under the bodies' (current null), where live played the select waltz.
(6) Network. Every run requested only the expected cues, with 0 notFound and 0 HTML-for-media. Ch5 requested boss-shuyin, victory-ffx2 and ending-ffx2.
(7) New, and audible only because the fix works: in ch5 the chain cue starts boss-shuyin at link 5. The 'shuyin-appears' entrance scene (first damage to Shuyin) then stops it within 3 s, measured at gain 0.00047 at seam-5+3000. After the confrontation the scene restarts it from the top. This is a false start. The same pattern is traced, not observed, in ch3 for boss-yu-yevon at 'valefor-enters'.

Not reached, so UNVERIFIED: the boss-yu-yevon phase cue and ending-ffx (no real-input ch3 win), the ending-ffx2 level after the ch5 post-scene (requested, gain not sampled), and the level of the pause cue itself (routing proved by the request; pauseMusic.ts unchanged since live).

Disclose to Bailey: after this release he will hear the boss and phase themes at their designed level for the first time in several builds. That may change his audio verdict.

Evidence: D:/Final Fantasy/critic/rounds/round-09/audio/{qa-5ddfde3.txt,qa-5ddfde3.json,themes-audit-5ddfde3.txt,slots-5ddfde3.mjs,slots-5ddfde3.txt,vitest-audio-5ddfde3.txt}; D:/Final Fantasy/critic/rounds/round-09/evidence/5ddfde3/*/run.json (audio[]) and network-media.json; evidence/5ddfde3/build/artifact-manifest-dist-gate.json.

CHIEF NOTE: stays UNVERIFIED with no number (Bailey is not home to listen; CHK-B1). The capture owner's major "the Shuyin phase plays without music" was refuted by the confirmer and re-filed as the polish false start PR-0129; the gap pass also measured the pause cue in and out within 0.75 s and ending-ffx2 at gain 1 3.6 s into the chapter 5 post-scene.

### interface: 7.3

Deep review round 09 (release-09 re-cut), candidate main 5ddfde3 (bundle assets/index-Jw5R1yWQ.js, artifact d125357b...), a real production build. Judged only from the capture owner's evidence in critic/rounds/round-09/evidence/5ddfde3/ (index.json, 438 items). Browser mode was gpu (PYREFLY_BROWSER=gpu) with no fallback, and input was the real keyboard through Playwright. I opened no browser and started no server. Sizes covered: 1600x900, 2000x1012, 390x844, 1280x960 (4:3) and 2560x1080 (21:9). No 4K, 1440p or 1280x720 capture exists (see capturesNeeded). Newcomer walkthrough: SIMULATED, not real.

GAINS, each verified on the candidate:
(1) PR-0090 is FIXED in both games. The enemy-intent panel now renders. FFX ch1: E shows 'Seymour Flux · 2nd in queue · Lance of Atrophy · SCRIPTED · Tidus 707-799 31% HP · IF YOU ATTACK' (seymour-flux-win/12-intent-E.png, look-2000/12-intent-E.png). FFX-2 ch6 shows it by default: 'Fem-Goon · ACTS NEXT · Blizzard · LIKELY 25% · per-girl damage · ODDS' (ffx2-leblanc-win/11-advisor.png), and E hides it (12-intent-E.png). The panel separates scripted moves from weighted ones in principle.
(2) PR-0091 is FIXED. At every chain seam the card does not overlap the party rows: overlapPx2 = 0 at ch6 links 2-3 and ch5 links 2-5 (24-seam-*-first-menu.png, pr0091 in index.json).
(3) PR-0088 improved. FFX-2 party 'wrong-state' misses fell from 16 on e119552 (ch5 15, ch6 1) to 0 on 5ddfde3. The chapter 1 wrong-state misses are Mortiorchis's own Full-Life, not the advisor.
(4) The advisor's menu path is proved with real keys in ch6: 63 decisions and 0 misses. Every named row was found under its 'in X' chip.
(5) Target cancel leaves 0 reticles in every run. The single-target cue is strong: ring, lettered plate, dimmed party, and the 'WAIT — ATB HELD' chip.

AGAINST, new on this candidate:
(a) R09B-INT-01, MAJOR, a REGRESSION against live. The now-visible intent panel paints above the pause in both games. In FFX-2 it covers the THIS ENCOUNTER list and the setting values in OPTIONS at 1600x900 and 1280x960. It sits across Paine's approved close-up even after H (hide panels), and it overlaps X-2 BATTLE on the phone. In FFX an 'E ENEMY MOVE' chip shows through.
(b) R09B-INT-02, MAJOR. The chapter 5 FFX-2 card drops its 'in <submenu>' path on 27 of 283 decisions, starting at link 1 (turn 28, 179 s). The affected moves include Mega Phoenix, X-Potion, Darkness and Black Sky. e119552 had 0 of 162 on the same route. This is wider than the disclosed seam-only trade-off.
(c) R09B-INT-03, MAJOR, inside the newly visible feature. The intent chip pairs the headline move with the top branch's odds. Ch5 shows 'Protect · LIKELY 38%' while its own ODDS list gives Protect 29% and Regen 38%. 'Likely' is also printed for any unscripted move, even at 25%.
(d) Polish: in FFX, opening the intent panel makes the advisor card decline and leaves an orphan 'N HIDE MOVES' chip (1600x900 and 2000x1012). The intent ODDS list and the FFX counter bullets are cut mid-glyph (PR-0010, now in both games). The ch5 HP header lists two unlettered 'BULWARK' rows. Chapter 1 advisor-led play revived Yuna 7 times, and she was KO'd again before acting after 6 of them.

CARRIED and re-observed, unchanged: PR-0001 (phone HUD illegible), PR-0012 (no FFX-2 help line), PR-0013 ('Dr. Goon B'), FOC-06 (FFX phone card absent, orphan chip), PR-0066/PR-0067/PR-0113 (phone board), PR-0110 (N chip over the FFX-2 coach line at 1600x900 and 2000x1012), PR-0111 (guide card empty in ch6 first frame and at 4:3), PR-0112 (now also OPTIONS labels 'MASTER VOL…', 'SOUND EFFE…', 'STRATEGY GU…' at 1280x960), PR-0115 (P does not close the pause), PR-0118 (dialogue card and eyebrow over the pause in ch6), and PR-0074 ('It finishes Dr. Goon, and 1207 damage.'; ch1 'Speeds the party's turns up · inflicts Haste / It puts Haste on the party'). The advisor still sits at 12.2 px effective at every desktop size. That meets FOC-06's 12 px acceptance and stays below CHK-003's 14 px floor.

SCORE 7.3 (7.4 on e119552). The intent panel's arrival and the PR-0091 and PR-0088 repairs are real gains. They are offset by one new major regression (the panel over the pause), two new majors in the advice surfaces, and the unmoved carried majors. What counts as a gain here: a closed interface major with no new major opened in its place. This round closes two and opens three, so the category did not gain.

### onboarding: 6.5

Newcomer walkthrough: SIMULATED. Playwright used real keys on fresh profiles and followed the advisor. It was not a cold-start run from the visible instructions alone. Touch, pointer and gamepad onboarding were not exercised.

GAINS:
(1) PR-0046 is FIXED for the default (Wait) path. The briefing now reads 'In hers, the clock holds while you choose.' at 1600x900 and on the phone (01-briefing.png; briefingText in run.json). The FFX-2 first-turn coach badge reads 'MENU'S UP · GAUGES HOLDING' in ch4 (2000x1012) and ch6 (1600x900) (10-first-menu-coach.png). The Active-mode branch of that badge (87b6277) was not captured, so it is UNVERIFIED.
(2) The one-time Wait migration and a real-key Active choice both survive reloads (save/save-compat.json A and B; save/active-sticks.json). X-2 BATTLE and ATB SPEED appear in FFX-2 OPTIONS at 1600x900 and 1280x960.
(3) REPLAY BRIEFING is reachable from the pause.

AGAINST, carried:
- PR-0098 (major): on the phone, OPTIONS still draws five rows and no scroll cue, so ATB SPEED, STRATEGY GUIDE and BATTLE HELP never appear (ffx2-leblanc-win-look-phone/14-pause-options.png). On this candidate the intent panel also covers the X-2 BATTLE value (R09B-INT-01).
- PR-0110: the advisor's N chip still overprints the first FFX-2 coach line.
- PR-0032: no text size, key remapping, motion or flash row. reduceMotion and lowEffects exist in the save but have no row.
- PR-0033: the defeat screen still teaches nothing (ffx2-leblanc-lose/31-results.png).
- PR-0116: 'Five fights.' with six playable chapters, awaiting Bailey.
- PR-0073: every phone briefing, board and scene hint names a key.

SCORE 6.5 (6.2 on e119552). Repairing the false first-contact clock claim recovers the loss that PR-0046 caused. Accessibility options and phone reach are unchanged.

### prep: 8.4

Prep/delivery auditor, round 09 deep review of the PRODUCTION CANDIDATE 5ddfde3 (dist-gate artifact d125357b…, PYREFLY_BROWSER=gpu, Chromium through Playwright, real keyboard). I opened no browser and worked from critic/rounds/round-09/evidence/5ddfde3/. FOR: (1) Party prep was entered, tabbed and left with Esc back to chapter select in all 14 runs across the six playable chapters (run.json prepEsc='chapter-select'). Chapter 6 prep is complete: three objectives and a sourced tip on the CHAPTER tab, and the DRESSPHERES tab shows Gunner 2/16 learned, 10 AP banked, next Potshot 20 AP, and the Hour of Need grid (ffx2-leblanc-win/04-prep.png, 04b-prep-next.png). (2) Chapter 6 victory rewards match research/ffx2-leblanc-syndicate.md §6.3 exactly: EXP 900, AP 6, Gil 780, items Reassembled Sphere, Charm Bangle, Twist Headband (ffx2-leblanc-win/31-results.png). AP moves consistently: Potshot 10/20 before the fight, 16/20 after the win, still 10/20 on the defeat card. (3) FFX AP follows its rule: Kimahri shows +0 AP after being KO'd by the Zombie→Full-Life combo before he acted (seymour-flux-win-r2/a2-battle-log.json). (4) Retry works and counts attempts. RETRY reaches party prep inside the harness's fixed 3.0 s wait in all five defeat routes (ch1 ×3, ch3 ×2, ch6). Prep to the retried fight's first menu took 9.1 to 16.6 s by harness clock, which includes a fixed 1.5 s wait and PR-0061/PR-0084 battle entry. The pre-battle scene is not replayed on a retry (src/app/screens/BattleScreenFlow.ts:333). ATTEMPTS reads 2 on the second defeat (braskas-final-aeon-win-focus/run.json resultsText). (5) Progress is reliable: after a real-input win, the clear survives a reload in ch1, ch2, ch4, ch5 and ch6 (boardAfterReload.cleared). NEW BEST shows on first clears. AGAINST: PR-0109 carried (chapter select returns the cursor to Chapter I after backing out of prep or finishing a chapter: cardAfterBack='seymour-flux' in all 14 runs). NEW polish: a chained chapter's results show only the last battle's spoils, so chapter 5 ends a 39-minute route on 'EXP 0 · GIL 0' (same text on live 1b33971 in round 08, so pre-existing). The prep chapter card clips its own text (ch6 at 1600x900 and 1280x960, every chapter at 390x844). That is scored in interface and only cross-referenced here. PR-0033 (the defeat card gives no reason) is scored in onboarding. Round 09's first pass scored 8.5 on e119552. The chapter 5 reward screen was seen for the first time this pass and costs 0.1. Chapter 3's victory rewards remain unread (never won with real input, PR-0082).

### delivery: 8

Prep/delivery auditor, candidate 5ddfde3. FOR: (1) PR-0085 is FIXED. The real production build 'npx vite build --outDir dist-gate --emptyOutDir' exited 0 in 1.11 s (evidence/5ddfde3/build/vite-build.log; bundle assets/index-Jw5R1yWQ.js). I re-ran 'node tools/artifact-manifest.mjs build --dir dist-gate' myself: 895 files, 457.4 MB, artifactHash d125357b4e4c7759f3b69f68b0049a60acaddbcf3cb1c10fb5ee65dd7e0f4212, identical to the capture owner's manifest (0 differing files), decode-checked (406 png, 22 webp, 46 ogg and 22 mp3 all 'ok'), problems [], audioUnverified 0 (critic/rounds/round-09/prep-delivery-scratch/manifest-recheck-5ddfde3.json). So the reviewed captures and the deployable artifact are the same bytes. (2) PR-0101 is FIXED. Chapter 6 now requests art/pause/leblanc.png and art/portraits/leblanc.png, both shipped. No run has an image answered with text/html and no run has a response >= 400 (all 14 run.json notFound=[] and htmlImages=[]). The pause over the ch6 pre-battle scene shows Leblanc's painting (ffx2-leblanc-win/05b-scene-esc.png). (3) Complete flows with real keys: wins through results, CONFIRM, epilogue, chapter select and reload in ch1 (on the second attempt), ch2, ch4, ch5 and ch6. The ch6 loss goes Defeat → RETRY → prep → battle. Ch3 reaches results and RETRY on every loss, but its win path is UNVERIFIED (PR-0082). (4) Console: 0 errors in 13 of 14 runs. The one error is 'Failed to load resource: net::ERR_NO_BUFFER_SPACE' at minute 49 of the ch3 focus run. That is a Windows socket-buffer exhaustion on a host also running three other agents' vite dev servers, so it is a suspected host condition, not a product 404 (every request in that run is unique; network-media.json has 99 requests and 0 duplicates). (5) The save-data class change behaves as designed. A release-08 live save loaded by the candidate becomes Wait, carries the marker, and keeps its chapter clear, best time and attempts (save/save-compat.json A and B, injected across origins). A player's ACTIVE choice made with real keys in pause OPTIONS survives two reloads (save/active-sticks.json, 0 console errors). save-compat.json C reads 'wait' only because of a harness artefact: C re-injected onto the stored blob, and load() had not yet persisted the marker (A.storedAfter shows the unmarked string); saveFfx2Atb.ts is idempotent. My code-level probe of SaveStore with truncated JSON, 42, null, an array, a string settings value, null chapters, wrong types and version 999 never throws and falls back to defaults. AGAINST: no load time, card-to-battle time or frame-time measurement exists for this candidate, so PR-0084 (7.7 s on live against the 5 s goal) is carried and UNVERIFIED here. The title, board and prep fetch about 48 MB of media before the first fight (network-media.json against the manifest bytes), which matters on a cold network and has not been measured. PR-0100 is carried: 47 audition candidates (27.5 MB) still ship under audio/candidates. Only Chromium ran; Firefox, Edge, Safari, a real phone and a controller are UNVERIFIED. CHK-024 is incomplete (no same-origin upgrade, no reload mid-battle or on results). Round 09's first pass gave 6.0 because of the unbuildable candidate. With the build and PR-0101 repaired and the migration proved, the score returns to the 8.3 that pass said the evidence supported, less 0.3 for the unmeasured performance on a build that changed the presenter, engine and CSS.

CHIEF NOTE: the gap pass then measured what the auditor deducted 0.3 for: 60 fps with p99 16.8 ms at the first menus (good), but card-to-first-menu 10.1 s (ch1) and 10.8 s (ch6) unthrottled and 20.5 s at 50 Mbps, twice the 5 s goal (PR-0084, PR-0061). Mid-battle and results-screen reloads in chapter 6 behave correctly. The measured result nets to the same 8.0.

## Approved-target gate

Required 31, matched 19, failing 11, unverified 1, waiting on a decision 5.

The visual auditor counted required 31 / matched 19 / failing 10 / unverified 2 / waiting 5; its two unverified tiles, per its capture requests, were the Swordplay Overdrive overlay and Targeting s3 (a Vegnagun part). The gap pass captured Swordplay and it FAILS (PR-0128: the guide card covers the name plate, no HIT x2/x4/x6 ticks); Targeting s3 stays UNVERIFIED (no Attack row reached on seed 1). FAILING (11): the visual auditor's 10, which its checks tie to PR-0002 (Battle HUD FFX), PR-0035 (Battle HUD FFX-2), PR-0005 (Turn cut-in), PR-0031 (targeting mustRemain), PR-0016 (hero plates), PR-0079 and PR-0122 (the Until Dawn pause and Panels hidden (H)), PR-0096 (the Leblanc Syndicate cast pick) and PR-0097 (approved Yuna paintings under bloom); the auditor did not list its 10 tiles by name, so this mapping is by issue, not by tile. Plus Swordplay (PR-0128). WAITING (5): the targets.json waiting list. Composites: critic/rounds/round-09/targets/5ddfde3/.

Protected art: 115 of 115 approved files byte-identical (critic/rounds/round-09/targets-hashcheck-5ddfde3.json).

## Checks

| Check | Result | Mandatory | Chapter | Reason |
|---|---|---|---|---|
| CHK-001 | FAIL | yes | all six | The technical half fails on qa.mjs --strict alone (47 orphan audition files ship, PR-0100). Every per-cue gate passes; routing now passes (PR-0089 fixed). The listening half is CHK-B1 (UNVERIFIED). |
| CHK-002 | FAIL | yes | 1, 4, 5, 6 | The pause no longer owns the window: the enemy-intent layer paints above it in both games and survives H (PR-0122, a regression against live). Pause over a scene still shows the dialogue card on top (PR-0118). |
| CHK-003 | FAIL | yes | all | Advisor minimum 12.2 px at every desktop size (meets FOC-06's 12 px, below this check's 14 px floor); the phone battle HUD stays illegible (PR-0001, PR-0066). 4K and 1440p front-end text is 19.6-34.7 px (gap pass). |
| CHK-004 | FAIL | yes | 5, 6 | Chapter 6 passes (63 decisions, 0 misses, every row found under its chip). Chapter 5 fails: 27 of 283 decisions show no "in <submenu>" chip (PR-0126). |
| CHK-005 | FAIL | yes | 1, 3, 6 | In chapter 3 the card recommends Doublecast about 25 times per attempt and the real menu turns it into a self-KO (PR-0125); in chapter 1 it chains Phoenix Downs into re-KOs (PR-0131). PR-0088's committed-cure guard passes. The per-chapter degenerate-board matrix still does not exist. |
| CHK-006 | FAIL | yes | 1, 4, 5, 6 | Target overlays die correctly (0 reticles after Esc in every run). Three overlays outlive their owner: the intent panel over the pause (PR-0122), the FFX advisor N chip after its card declines (PR-0130, FOC-06), the cutscene dialogue card over the pause (PR-0118). |
| CHK-007 | FAIL | yes | 1, 6 | No raw ids or debug text. The composed advisor sentence is still broken English (PR-0074). |
| CHK-008 | FAIL | yes | all six | The advisor card clears the party rows at every seam (overlapPx2 0) and the chapter 6 intent card clears the Syndicate heads. FAIL: the intent card over the pause close-ups (PR-0122) and the FFX command stack over Yuna (PR-0002). Panel-versus-sprite projection at 1280x720 and 1440p was not measured. |
| CHK-009 | FAIL | yes | 6 and the board | Labels cut mid-word at 1280x960 and on the phone (PR-0112), prep card text cut (PR-0127), phone party names run together (PR-0113). |
| CHK-010 | FAIL | yes | 3, 6 | Brackets, reticle, lettered plate and the yielding party panel are present; the tile's named ground ring under the selected figure and the dim on non-targets are missing (PR-0031). The ALL ALLIES chip attaches to the wrong row (PR-0019). FFX-2 multi-target (Grenade) and 2560x1080 were not captured. |
| CHK-011 | FAIL | yes | all six | Desktop framing passes in every link of chapters 1, 3, 5 and 6 (chapter 5 links 2-4 now fully in frame). FAIL at 390x844 (PR-0017) and at chapter 5 link 5 (PR-0094), and the intent panel pairs a move with another move's odds (PR-0123). |
| CHK-012 | FAIL | no | 5, 6 | Dr. Goon and Fem-Goon are placeholders (PR-0092, disclosed); Nooj and Brother speak on text-only cards (PR-0058). |
| CHK-013 | FAIL | yes | all | Protection PASS: 115 of 115 approved files byte-identical. Rendering FAIL: bloom burns Yuna's approved paintings (PR-0097) and the intent card overdraws the approved pause plates (PR-0122). |
| CHK-014 | PASS | no | all; chapter 6 links 1-3 | Every actor sampled faces across the field; chapter 6 scale holds (PR-0093 fixed); feet on the floor with shadows. Single-file staging logged as polish (PR-0136). |
| CHK-015 | PASS | yes | all six | Esc and P open the pause, Esc resumes, Q/E move tabs, H hides panels, E/G/N toggle, Esc cancels targeting and backs out of prep, RETRY and CONFIRM work, X-2 BATTLE and ATB SPEED change with real keys (engine ticks NORMAL 2948/s, FAST x1.28, SLOW x0.75). Open polish: P does not close the pause (PR-0115). Gamepad and touch not exercised. |
| CHK-016 | PASS | yes | all | 272 capture-owner screenshots each preceded by a screen or state assertion; 0 stale roots once the stacked pause overlay is excluded; run.json fails[] empty in every route. Caveat: __pyrefly.seed() returns the debug seed, not the reseeded retry value. |
| CHK-017 | NOT APPLICABLE | yes | all | The candidate is not deployed, so the live artifact cannot be verified. Its identity was checked instead: two independent builds of the dist-gate manifest give artifact d125357b4e4c7759f3b69f68b0049a60acaddbcf3cb1c10fb5ee65dd7e0f4212 (895 files, 457.4 MB, 0 decode problems, 0 differing files). The live verification owes CHK-017 after the deploy. |
| CHK-018 | PASS | no | all | No shipped path points at a raw or numbered PNG; 0 notFound and 0 HTML-for-image in all 14 runs, including chapter 6's pause and portrait plates. |
| CHK-019 | PASS | yes | all | 496 media files (406 png, 22 webp, 46 ogg, 22 mp3) decode ok; problems [] and audioUnverified 0. |
| CHK-020 | FAIL | yes | shared screens | The FFX-2 command menu still has no help line while FFX shows one (PR-0012). The intent panel opens in FFX-2 and collapses to a chip in FFX from the same saved setting: no written exception, a question for Bailey (proposal P-09-6). |
| CHK-021 | FAIL | yes | all commits 1b33971..5ddfde3 | Presence and absence are proven for the combat, audio and story changes (White Wind immunity flag only on the chapter 6 trio; only the FFX-2 engine reads ffx2Atb; FFX chapters request only FFX cues; story-ffx2-leblanc 28/28 including the FFX-absence test). FAIL on process: commit 0bd85cc states no case (PR-0140). |
| CHK-022 | PASS | yes | seymour-flux | One continuous real-key route: defeat, RETRY, prep, scene, victory 4:36, CONFIRM, epilogue, chapter select, reload keeps the clear. |
| CHK-022 | PASS | yes | yunalesca | Real-key win (159 commands, 11:31, two form changes), post-scene, results, CONFIRM, epilogue, chapter select, reload keeps the clear. Loss path not run on this candidate. |
| CHK-022 | UNVERIFIED | yes | braskas-final-aeon | Defeat, results and RETRY pass in every one of five attempts; there is still no real-input win, so the victory, post-scene and results route is unproven (PR-0082; suspected cause PR-0125). |
| CHK-022 | PASS | yes | ffx2-bahamut | Real-key win at 2000x1012 (58 commands), spherechange, post-scene, results, chapter select, reload keeps the clear. Loss path not run on this candidate. |
| CHK-022 | PASS | yes | ffx2-vegnagun-shuyin | First real-key win on record: 284 commands over 38.6 min, 5 links, 4 seams, spherechange, post-scene, results, chapter select. Loss path not run on this candidate. |
| CHK-022 | PASS | yes | ffx2-leblanc | New chapter: real-key win (64 commands, 8:57, 0 advisor misses, 2 seams, spherechange) through post-scene, results (NEW BEST), CONFIRM, epilogue, chapter select and reload; and a loss (X-2 BATTLE flipped to ACTIVE with real keys, idle, Defeat 1:58) through RETRY, prep and back into battle. |
| CHK-023 | FAIL | yes | 3, 5, 6 | Reached through the normal runtime: White Wind heals and dispels in the real chapter 6 log; the Active flip reaches the engine (idle defeat in 1:58); the chain multipliers follow §1.7; spherechange fires; the ATB SPEED row changes engine ticks (x1.28 / x0.75, ratios not checked against a source); music selection and crossfades hold through seams (PR-0089). FAIL: FFX Doublecast's engine path has no presentation path that supplies a spell or an enemy target, so every real-menu Doublecast hits Lulu (PR-0125). |
| CHK-024 | PASS | yes | all; chapter 6 reloads | Fresh player: every run starts fresh and clears survive reload in five chapters. Returning player: the real release-08 save (ffx2Atb active, no marker, chapter clears, best time, attempts) loads as Wait with ffx2AtbMigrated true and keeps its progress (copied into the candidate origin; the migration reads the raw stored string, so the origin does not change the code path). The player's ACTIVE choice made with real keys survives two reloads. A mid-battle reload records no clear and keeps play time; a results-screen reload keeps the clear and best time. Truncated JSON, wrong types and version 999 never throw and fall back to defaults. save-ffx2-atb-migration 8/8. There is no reset flow in the UI. The same-origin upgrade on Pages can only be run after the deploy: its BEFORE half is staged on live 1b33971 (gaps/chk024 profile) and the AFTER half is owed by the live verification. |
| CHK-B1 | UNVERIFIED | yes | all | No agent can hear and Bailey is not home to listen. With PR-0089 fixed the boss themes will be audible at their designed level for the first time in several builds, so his next listen is materially new. His 2026-09-21 negative verdict ("too reminsicent of snes music") is quoted in NOW.md but not recorded in OWNER-VERDICT.md. |
| CHK-B2 | UNVERIFIED | no | all | Bailey's hands-on feel judgement; he is away. |
| CHK-B3 | UNVERIFIED | no | ffx2-leblanc | Whether chapter 6's voices sound like the characters is Bailey's call; scored only against research §9.3. |

## Encounters (capture owner)

- **ffx2-leblanc**: completed real flow; victory, and a separate defeat with retry. Win at 1600x900, seed 1, Wait mode: title, briefing, chapter select, prep (Esc back and re-enter), pre-scene (Esc over the scene, hold to skip), 3 links with seams 1-2 and 2-3, a spherechange Thief to White Mage with real keys, post-scene, results (Victory 8:57, NEW BEST), CONFIRM, epilogue scene, chapter select, reload keeps the clear. 64 commands, 0 advisor misses. Loss: X-2 BATTLE flipped to ACTIVE with real keys in pause OPTIONS, then idle until Defeat 1:58, RETRY, prep, battle (evidence ffx2-leblanc-lose). Phone 390x844 and 4:3 1280x960 look runs were captured.
- **seymour-flux**: completed real flow; defeat, retry, then victory in one continuous route. seymour-flux-win-r2: attempt 1 (seed 1) was a defeat in 22 commands; RETRY led through prep and the scene to attempt 2, a Victory in 4:36, then CONFIRM, the epilogue, chapter select and a reload that kept the clear. The advisor was followed; the aeon Overdrive one-item rows were handled. Separate runs: an advisor-led defeat plus retry at 1600x900, a phone defeat plus retry at 390x844, and look runs at 2000x1012 and 2560x1080.
- **yunalesca**: completed real flow; victory. 1600x900, seed 1, 159 commands, 11:31, 2 form changes (phase change), post-scene, results, CONFIRM, epilogue, chapter select, reload keeps the clear. Attack on a lone enemy resolves without a target step, so 16-target-single.png shows the action itself.
- **braskas-final-aeon**: NOT completed by real input; defeat (4 attempts, no win). Real-input defeats through results and RETRY: 3 advisor-led attempts and 2 with the boss as the focus target (about 24 min and 365 commands each; one form change reached). Every loss reached the results screen and RETRY returned to battle. No real-input win, so the win path is UNVERIFIED (carries PR-0082). The first run's steering to 'Braska's Final Aeon' failed on the apostrophe in the harness slug. That was fixed for the focus run, so those picks are a harness artefact, not product.
- **ffx2-bahamut**: completed real flow; victory. 2000x1012, Wait, 58 real commands, spherechange, post-scene, results, chapter select, reload keeps the clear. (The capture owner's route-time figure "7:92" is not a valid clock reading and is left out.)
- **ffx2-vegnagun-shuyin**: completed real flow; victory. 1600x900, Wait, seed 1, 284 commands over 38.6 min, 5 links (4 seams, each seam's first menu captured and measured), a spherechange Dark Knight to Black Mage, post-scene, results, chapter select. This is the first real-input win of chapter 5 on record.

## Coverage matrix

### Tested

- Build: the production vite build of 5ddfde3 (exit 0), the cut's build smoke, tsc clean, the full unit suite (261 files, 5,807 passed, 2 skipped), the artifact manifest built twice (895 files, identical, 0 decode problems), 115 approved art hashes.
- All six included chapters entered from the title with real keys on fresh profiles (14 routes, 272 asserted captures, 0 HTTP >= 400, 1 host-side ERR_NO_BUFFER_SPACE): real-input wins in chapters 1, 2, 4, 5 and 6 through results, chapter select and reload; chapter 6 and chapter 1 defeat and RETRY; chapter 3 five defeats through results and RETRY.
- Save-data class: the real release-08 save migrated in the candidate origin, a real-key Active choice across two reloads, mid-battle and results-screen reloads, malformed storage, 8/8 migration tests; the live BEFORE half of the same-origin upgrade staged.
- Combat: engine benches on the real chain path (chapter 6 two seed sets at D=0, 1.5 s and 4 s under Wait and Active, credible mistakes, chapter 4 and 5 controls, chapters 1-3), White Wind, Grenade, damage-band and Doublecast probes, Act III stats re-sampled.
- Interface and onboarding: advisor type floor at every desktop size and 4K/1440p, advisor menu paths over about 350 real-key decisions, target cancel cleanup, the pause matrix (Esc, all tabs, H, resume) in chapters 1, 4, 5 and 6 at 1600x900, 2000x1012 and 390x844 with elementFromPoint, phone OPTIONS walked with ArrowDown, TALK contrast, the ATB SPEED lever with real keys.
- Feel: timed frame sequences for transitions, actions, seams and spherechange; a 720-frame trace in chapter 6 Act III; skip-release latency; cold, warm and 50 Mbps timing.
- Narrative: chapter 6 script against research §9, its seam scenes and the whole epilogue line by line on the candidate, Ormi-first ordering exercised.
- Audio: strict QA, themes-audit, decode, audioDebug slot gains in 14 runs, chapter 5 and 3 music timelines against live, pause cue in and out, ending-ffx2 level.
- Targets: 28 composites and 12 contact sheets against the approved tiles; Swordplay overlay captured.

### Reused, with the reason

- **PR-0007 Zombie-window numbers** from critic/rounds/round-08.json: The Seymour Flux AI, status, CTB and data files are unchanged 1b33971..5ddfde3 (the FFX engine changes are Evrae-only hooks and a pure extraction); chapter 1's 40-seed rate is unchanged at 26/40.
- **Chapter 6 stat-block audit against research §2-§4.6, the Leblanc/Ormi AI audit against §5.3, the ATB SPEED quotients against §1.2** from critic/rounds/round-09.json (e119552; kept as critic/rounds/round-09/chief-5ddfde3/round-09-e119552.json): git diff e119552..5ddfde3 -- research src/data/ffx2 src/battle/ffx2 changes only formulas.ts step 20 (a heal is no longer stopped by the fractional-damage immunity); the Act III HP and stat rows were re-sampled and match.
- **Narrative reading of chapters 1 to 5** from critic/rounds/round-07/08/09 (e119552): git diff e119552..5ddfde3 -- src/story is empty and those scripts are unchanged since 1b33971; their aftermath reachability was re-seen on 5ddfde3.
- **Targeting s1 (a spell on the whole party) MATCHED** from critic/rounds/round-09/evidence/gaps/targets/ch3-hastega-target.png (e119552): TargetCursor.ts is unchanged; the FFXBattleHud.ts change (a2fb6d0) extracts placement keys and gates the pause mouse, not targeting render.
- **PR-0018 contrast value** from round 09 (e119552): No longer reused: re-measured on 5ddfde3 by the gap pass (1.74:1 and 2.87:1).
- **Pause-cue routing level** from round 09 (e119552) and earlier: No longer reused: the gap pass measured the pause cue in and out on 5ddfde3.
- **Capture owner's real-input event logs used by the combat, interface and prep auditors** from critic/rounds/round-09/evidence/5ddfde3/*: Same candidate, same production build (dist-gate), gpu mode; used as event logs by auditors who opened no browser.

### Not tested

- Pointer, touch and gamepad input; Firefox, Edge and Safari; a real phone.
- Real-input loss paths of chapters 2, 4 and 5 (their wins and chapters 1 and 6 losses were run).
- Chapter 6 links 2-3 at 2000x1012; FFX-2 multi-target (Grenade, ALL ENEMIES) and 2560x1080 targeting; pause tabs at 4K and 1440p.
- The Active branch of the FFX-2 first-turn badge (not reachable by a fresh player: PR-0046 note).
- Three reward items with no ItemDef row (named in the brief; not re-examined this round).
- The 26 carried issues marked "NOT re-examined on 5ddfde3" in the issue list.

### Required by this review and not tested

- CHK-017: the exact live artifact (after the deploy), including the AFTER half of the same-origin CHK-024 upgrade (gaps/chk024.mjs after on the staged live profile).
- CHK-022: a real-input win of chapter 3 (blocked in practice by PR-0125).
- CHK-001 / CHK-B1: Bailey's listening.
- CHK-005: the per-chapter degenerate-board matrix.
- CHK-008: panel-versus-sprite projection at 1280x720 and 2560x1440.
- CHK-010: FFX-2 multi-target and the 2560x1080 cue; Targeting s3 (a Vegnagun part).

## Ranked issue list (critical: none; then major, polish, suggestion)

### 1. PR-0122 (major, interface) HOLD

**The now-visible enemy-intent panel is drawn above the pause screen: it covers the pause close-up, the OPTIONS values and the THIS ENCOUNTER actions, and survives H (a regression against live)**

- Game: both (FFX-2: the full panel, on by default, chapters 4, 5 and 6; FFX: the "E ENEMY MOVE" chip, and the full panel after E). Chapter: ffx2-bahamut, ffx2-vegnagun-shuyin, ffx2-leblanc (panel); seymour-flux, yunalesca, braskas-final-aeon (chip). State: pause opened with Esc (or P) from the command menu, every tab, and after H · introducedByCandidate true · regressionVsLive true · inNewFeature false
- Expected: The pause owns the window, as on live 1b33971: no battle HUD layer paints over it, H leaves only the painting and the legend, and the intent panel returns on resume in the state it had.
- Observed: At 1600x900 in chapter 6 the opaque Fem-Goon Blizzard card (headline, per-girl damage, ODDS) sits over REPLAY BRIEFING, RESTART ENCOUNTER, CHAPTER SELECT and QUIT TO TITLE and over the values 80/70/90/1x/WAIT in OPTIONS; on member tabs it lies across Yuna's and Rikku's eyes; after H it lies across Paine's approved close-up with "H SHOW PANELS" as the only other chrome. Same in chapter 4 at 2000x1012 (over Yuna's hair), chapter 5, at 1280x960 and at 390x844 (over the X-2 BATTLE value). In FFX the "E ENEMY MOVE" chip shows through, including after H. Inside the pause E switches tab, so a player who pauses first cannot dismiss the panel. document.elementFromPoint at the panel centre returns the intent panel (eint__body / eint__dmg / eint__who) in all six candidate cases measured; on live the panel is 0x0 and the pause is clean. Workaround proved: pressing E BEFORE pausing hides it and it stays hidden under the pause.
- Repro: Candidate 5ddfde3 dist-gate, fresh profile (intentVisible defaults true; every live save also stores intentVisible true), seed 1, 1600x900, Wait. Chapter select > VI > prep > hold Enter over the scene > first command menu > Esc > ArrowRight to OPTIONS > H.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/14-pause-Esc.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/14-pause-options.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/14h-pause-H.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-lose/15-options-active.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-bahamut-win/14-pause-Esc.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-bahamut-win/14h-pause-H.png; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/14-pause-Esc.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-4x3/14-pause-options.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/14-pause-options.png; critic/rounds/round-09/evidence/gaps/pause/*-panel-01-esc.png and *-panel.json (elementFromPoint, candidate and live); critic/rounds/round-09/evidence/gaps/pause/ffx2-leblanc-1600x900-5ddfde3-ehide-panel-*.png (E-before-pause workaround); critic/rounds/round-09/evidence/5ddfde3/confirm/pause-intent/result-1600x900.json (+14 PNGs, confirmer); critic/rounds/round-09/targets/5ddfde3/pause-all-chapters.jpg; critic/rounds/round-09/targets/5ddfde3/pause-chip-e119552-vs-5ddfde3.png; critic/rounds/round-09/feel-narrative-5ddfde3/pause-intent.jpg
- Confidence: high (seen in every pause capture of both games at five sizes; reproduced independently by the confirmer; live comparison captured). Cause suspected, not traced to one line: EnemyIntent mounts .eint in the unscaled battle overlay (src/ui/common/EnemyIntent.ts:304, z-index 2 in enemy-intent.css:44; FFX2BattleHud.ts:340 mounts it into this.overlay), which stacks above the pause root; PR-0090 (624895d) made it render for the first time.
- Requirement: RUBRIC §2 (the pause centres sharp character close-ups with usable controls and hideable panels); §7 target gate (tile "Pause remade on the Until Dawn character screen" mustRemain and tile "Panels hidden (H)"); CHK-002; CHK-006; CHK-008
- Smallest fix: Hide the .eint layer (panel and chip) while the pause screen is open, from the same place the pause suspends the rest of the battle HUD, and restore it on resume; leave the player's E setting untouched. Alternatively give the pause root a stacking context above the overlay.
- Acceptance check: Real keys, chapters 1 (after E), 4, 5 and 6 at 1600x900, 2000x1012, 1280x960 and 390x844: Esc, every pause tab, H, H again, resume. No .eint pixel is visible while paused (rect, opacity, display; elementFromPoint at the last .eint__panel rect returns a pause node), and after resume the panel is back in its prior visible or hidden state.
- Ship tag reasoning: The pause is an existing, approved screen that is clean on live 1b33971. The intent panel is a live feature that never rendered there (PR-0090); repairing it made it paint over the pause, so something that works live is broken here. This is the one blocking issue of the round.
- Merged from: capture owner (FFX-2 intent panel over the pause); interface R09B-INT-01; feel-narrative N09-FN-01; visual R09b-VIS-01; gap capture (pause matrix and elementFromPoint); confirmer: REPRODUCED

### 2. PR-0125 (major, combat)

**FFX Doublecast entered through the real command menu asks for no spell or target and casts Firaga twice on Lulu herself, KOing her; the chapter 3 advisor recommends it about 25 times per attempt**

- Game: FFX only (chapter 3; the dreams-end preset is the only one granting Doublecast). Chapter: braskas-final-aeon (ch3). State: Lulu's turn, Special > Doublecast > Enter · introducedByCandidate false · regressionVsLive false · inNewFeature false
- Expected: Doublecast asks for a Black Magic spell and an enemy target for its two casts, as in FFX.
- Observed: The Doublecast row carries targeting "self", validTargets ["lulu"] and no wrappedId (src/data/ffx/abilities/special-rikku.ts:240). src/ui/ffx/CommandMenuLogic.ts:176 resolveTargetMode returns "auto" for one valid target, CommandMenu.ts:578 submits targets ["lulu"], and src/battle/ffx/execute.ts resolveDoublecast (about lines 413-452) falls back to the strongest affordable Black Magic (Firaga) aimed at those targets. Production build, real keys: after Enter the menu closes ("Waiting for your turn."), the engine logs "Doublecast: Firaga" on Lulu for 3,184 and 2,948 and KOs her. In the capture owner's two chapter 3 attempts all 39 real-menu Doublecasts hit Lulu (7+ self-KOs per attempt). Engine probe: seeds 1 and 7 KO her from 5,700 HP, seed 42 halves her. The auto-battler, which submits the boss as target directly, wins 39/40.
- Repro: Chapter 3, seed 1, 1600x900: swap Lulu in, Special > Doublecast > Enter. Or R09_FILE=probe-doublecast.test.ts node D:/pyrefly-release/node_modules/vitest/vitest.mjs run --config vitest.config.ts in critic/rounds/round-09/combat-5ddfde3.
- Evidence: critic/rounds/round-09/combat-5ddfde3/probe-doublecast.json; critic/rounds/round-09/evidence/gaps/doublecast-5ddfde3/ (01-lulu-menu, 02-special-doublecast-selected, 03-right-after-enter, 04-after-1500ms, run.json); critic/rounds/round-09/evidence/gaps/doublecast-live/ (live 1b33971, same event sequence); critic/rounds/round-09/evidence/5ddfde3/braskas-final-aeon-win/battle-log.json; critic/rounds/round-09/evidence/5ddfde3/braskas-final-aeon-win/a2-battle-log.json; critic/rounds/round-09/evidence/5ddfde3/braskas-final-aeon-win/turn-log.json
- Confidence: high (traced in code, reproduced on the engine and on the production build by real keys, re-run by the confirmer). That it is the whole cause of chapter 3's missing real-input win is suspected.
- Requirement: Combat correctness (ffx-combat-core §7.4, ffx-bfa-yu-yevon §4.2 "Doublecast + Firaga/Thundaga"); AGENTS.md hard rule 3 (proved by running the engine); CHK-023; CHK-005
- Smallest fix: After Doublecast, open Lulu's Black Magic list and then the chosen spell's enemy target step, and submit {id: "doublecast", wrappedId, targets}. Safety net: resolveDoublecast never aims an offensive spell at the caster's side when the targets are only the self placeholder.
- Acceptance check: probe-doublecast.test.ts: engine action-start targets are a subset of the enemy ids and selfDamage is [] for seeds 1, 7 and 42. A real-key chapter 3 run shows a spell and target step after Doublecast, 0 "lulu>lulu" casts, and reaches a win.
- Severity note: The confirmer called it "at least major, arguably critical for chapter 3's real flow". Kept at major: chapter 3 still finishes (defeat, results and RETRY work every time), and the fight is winnable without Doublecast on the engine. It is not a regression (live logs the same sequence), so it is disclosed.
- Merged from: combat-encounter (new, established); gap capture (production build, real keys, live comparison); confirmer: REPRODUCED

### 3. PR-0082 (major, process)

**Chapter 3 still has no real-input win (narrowed from three chapters to one): five attempts of about 24 minutes each, all defeats; suspected cause PR-0125 (Doublecast KOs Lulu)**

- Game: both. Chapter: seymour-flux, braskas-final-aeon, ffx2-vegnagun-shuyin (and the chapter 2 victory results screen). State: victory, post-battle script, results · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Each included chapter reaches victory, its aftermath and its results through real input at least once.
- Observed: ON 5ddfde3: Chapters 1, 2, 4, 5 and 6 now have real-input wins through results, chapter select and reload on 5ddfde3 (chapter 5's is the first on record). Chapter 3: 3 advisor-led and 2 boss-focus attempts (seeds 1 and 1001) ended in defeat or ran out the 20-25 min budget at 307-369 commands; every loss reached results and RETRY worked. In the first run the advisor recommended Doublecast 17 times and every real-menu Doublecast hit Lulu (PR-0125), so the failures are at least partly that defect; the harness is not an expert player and the first run's steering was hurt by a harness slug bug (fixed for the focus run).
- Repro: Read critic/rounds/round-08/evidence/index.json: 235 entries, 209 of them injected:false. The four win-* runs are labelled injected.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/braskas-final-aeon-win/; critic/rounds/round-09/evidence/5ddfde3/braskas-final-aeon-win-focus/; critic/rounds/round-08/evidence/index.json; critic/rounds/round-08/evidence/ch4/ and critic/rounds/round-08/evidence/win-ffx2-bahamut/run.json (the real-input victory); critic/rounds/round-08/evidence/win-seymour-flux/run.json, win-braskas-final-aeon/run.json, win-ffx2-vegnagun-shuyin/run.json (injected); critic/rounds/round-08/evidence/gaps/ch2-35-results.png and gaps/gap-w-ch2.json (hand-played chapter 2, defeat)
- Confidence: high
- Requirement: CHK-022 and RUBRIC section 5: a debug hook may set up a state but cannot prove a player can win it. Milestone acceptance needs, per included chapter, one continuous legal-input route from normal entry to outcome.
- Smallest fix: Fix PR-0125 first, then one real-input chapter 3 run; the §8 method check stays owed. Never tune the boss.
- Acceptance check: One real-input win of chapter 3 from chapter select to results, CONFIRM and chapter select.
- Repair attempts so far: 1

### 4. PR-0124 (major, combat)

**FFX-2 chain seams carry MP above its maximum (Rikku 123/106) and silently revert a girl to her starting dressphere**

- Game: FFX-2 only (chapters 5 and 6, both chained). Chapter: ffx2-leblanc links 2 and 3; ffx2-vegnagun-shuyin after each seam. State: first command menu after a chain seam, after a spherechange in the previous link · introducedByCandidate false · regressionVsLive false · inNewFeature false
- Expected: Current MP (and HP) never exceeds the maximum of the dressphere the member is in. Whether the worn dressphere should survive a chain seam is a sourcing question, not claimed here.
- Observed: Rikku changed Thief to White Mage with real keys in chapter 6 link 1. At the link 2 first menu her row reads TH "639/934 123/106"; it persists into link 3 and the results list her as THIEF. In chapter 5 Rikku changed to Black Mage in link 1 and shows DK after the seams. Code: src/app/screens/BattleScreenSetup.ts carryFfx2 (about lines 143-149) copies live.hp and live.mp with only Math.max(0, ...) and does not carry currentDressphere; src/battle/ffx2/setup.ts:74 derives stats from the build's starting dressphere and takes member.mp unclamped. The FFX carry clamps (clamp(live.mp, 0, a.stats.maxMp)).
- Repro: Chapter VI, Wait, seed 1, 1600x900: on Rikku's turn in link 1 choose CHANGE > White Mage, win link 1, read Rikku's row at the link 2 first menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/24-seam-2-first-menu.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/24-seam-3-first-menu.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/31-results.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/seq-spherechange/; critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/24-seam-3-first-menu.png; critic/rounds/round-09/confirm/seam2-rows.png (confirmer crop)
- Confidence: high for the observation and the missing clamp (confirmed by code read); the dressphere carry is a question
- Requirement: RUBRIC §6 combat (resources); AGENTS.md hard rule 6 (the dressphere question is unsourced and goes to Bailey or research)
- Smallest fix: Clamp the carried HP and MP to the derived maximums (in carryFfx2 or setup.ts). Separately ask Bailey or research whether the worn dressphere carries across a seam.
- Acceptance check: Engine test: a chain link ending with Rikku in White Mage above the Thief MP maximum starts the next link with mp <= stats.maxMp. On screen no party row ever shows mp > max.
- Ship tag reasoning: Chains and the carry were already live in chapter 5; chapter 6 is new. Not a regression.
- Merged from: capture owner; confirmer: CONFIRMED

### 5. PR-0123 (major, interface)

**The enemy-intent headline pairs the rolled move with a different move's odds ("No action LIKELY 88%" above "Attack 88%"), prints "Likely" at 25 percent, and its odds sum to 101**

- Game: both (shared src/ui/common/EnemyIntent.ts, src/battle/ffx2/intent.ts); observed in FFX-2. Chapter: ffx2-vegnagun-shuyin link 3 (Bulwark) and link 5 (Shuyin); ffx2-leblanc (Fem-Goon). State: first command menu, intent panel on · introducedByCandidate true · regressionVsLive false · inNewFeature true
- Expected: The percentage beside the named move is that move's own probability; "likely" is not claimed below 50 percent; the odds rows sum to 100 plus or minus rounding.
- Observed: Chapter 5 link 5: "SHUYIN ... No action LIKELY 88%, Spends the turn and does nothing" above ODDS "Attack 88%, no action 13%". Link 3: "BULWARK · Protect · LIKELY 38%" while its own ODDS give Regen 38%, Shell 33%, Protect 29%. Chapter 6: "Blizzard · LIKELY 25%". Traced: moveName comes from the first (seeded) dry run (src/battle/ffx2/intent.ts:590-592) while EnemyIntent.ts confidenceHtml (727-732) prints branches[0].percent, the most frequent branch; SAMPLE_COUNT 24 rounding gives 88 + 13.
- Repro: Production build 5ddfde3, seed 1, 1600x900, Wait: chapter 5 to the link 3 and link 5 first menus with the intent panel on.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/24-seam-5-first-menu.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/24-seam-3-first-menu.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-09/evidence/gaps/ch5b-cand-1600x900/link-5-first-menu.png
- Confidence: high (the panel contradicts itself on screen; cause traced by two reviewers)
- Requirement: RUBRIC §2 (honest intent that separates certainty from conditional or random outcomes); CHK-011; CHK-004 scope
- Smallest fix: Print the likelihood of the branch whose label equals moveName; word it "Most likely" only when it is the top branch and "Possible" below 50 percent; normalise the rounded odds.
- Acceptance check: Unit test: for every IntentView the chip percent equals branches.find(b => b.label === moveName).percent and the rows sum to 100 plus or minus 1. The chapter 5 link 3 capture shows Protect with 29 percent.
- Ship tag reasoning: The code predates the candidate, but the panel first becomes visible here (624895d); live shows nothing, so the defect lives inside a feature players have never had. It does not hold the build.
- Merged from: capture owner; interface R09B-INT-03; gap capture (headline half); confirmer: CONFIRMED by code trace

### 6. PR-0126 (major, interface)

**In chapter 5 the FFX-2 advisor card drops its "in <submenu>" path on 27 of 283 decisions, from link 1 onward, wider than the disclosed seam-only PR-0091 trade-off**

- Game: FFX-2 only. Chapter: ffx2-vegnagun-shuyin (ch5). State: command menu, advisor card, 1600x900, Wait · introducedByCandidate true · regressionVsLive unknown · inNewFeature false
- Expected: The card names the move, its menu path and its cost on every non-Attack decision; the PR-0091 trade-off kept the submenu even at the chapter 5 seams.
- Observed: On 27 decisions the card showed move and target with no "in X" chip: Darkness x9, Mega Phoenix x8, X-Potion x5, Black Sky x3, Mega-Potion x1, Phoenix Down x1; the first at turn 28 (179 s), link 1, before any seam. The same route on e119552 had 0 of 162. The gap pass could not reproduce the exact turns (step mode shifts turn order) but saw the chip missing on the two-item "1 Megalixir 2 Mega Phoenix" card and on the compact card at turn 29, while Black Sky cards printed "IN SKILL".
- Repro: Production build 5ddfde3, chapter 5, 1600x900, Wait, seed 1, advisor-led real-key route; read .mad__move .mad__stat for a chip starting "in " on each decision.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/run.json (misses: want.menu null); critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/turn-log.json; critic/rounds/round-09/evidence/e119552/ffx2-vegnagun-shuyin-win/turn-log.json; critic/rounds/round-09/evidence/gaps/ch5-turns-5ddfde3-r3/run.json, turn-26..32 png
- Confidence: high on the counts; medium on the cause (suspected: the advisorLane max-height cap from 0ff00f2, src/ui/ffx2/advisorLane.ts, makes the density ladder shed the chip)
- Requirement: RUBRIC §2 (the advisor says where the action is in the menu and what it costs); CHK-004
- Smallest fix: Keep "in <submenu>" and the cost on every rung except the phone compact rung; shed the explanation lines first.
- Acceptance check: Replay chapter 5 at 1600x900, seed 1, through all five links: 0 non-Attack decisions without an "in X" chip, and the card still clears the party rows at the seams (overlapPx2 0).
- Ship tag reasoning: e119552 printed the path on every chapter 5 decision; no live 1b33971 capture of the same decisions exists, so the regression against live is likely but unproven. Unknown on a major does not hold under RUBRIC §3; disclosed.
- Merged from: interface R09B-INT-02; gap capture (partial reproduction)

### 7. PR-0094 (major, visual)

**Chapter 5 chain-seam camera (narrowed): seams 2-4 now settle with the part fully in frame; at the seam into link 5 the camera holds a Shuyin close-up into the first command menu with Yuna and Rikku off-screen and Paine cut at the left edge**

- Game: FFX-2. Chapter: ffx2-vegnagun-shuyin (ch5), links 2 to 4. State: suspected: the camera or arrival path after a link seam (src/engine/BattlePresenterEvents.ts and the new StageArrivals.ts changed in this candidate). The enemy slots in src/scenes/farplane.ts:132-137 are all to the right of the party, so the framing and not the slots is at fault. · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Each link framed like link 1: the boss part centre-right and fully in frame, every targetable part visible.
- Observed: ON 5ddfde3: Seams 2, 3 and 4 settle with the Vegnagun part and every sub-part in frame (24-seam-2/3/4-first-menu). Seam 5: 26 s after the seam Shuyin fills the centre, his hair under the HP slab, Yuna (acting) and Rikku off-frame, Paine half cut at x=0. Live 1b33971 link 5 is wrong differently (party framed, Shuyin out of frame); neither is clearly worse, so regressionVsLive is false.
- Repro: Seed 1, 1600x900, real input. Win link 1 of chapter 5 and watch the seam to link 2; the same happens at links 3 and 4.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/24-seam-5-first-menu.png; critic/rounds/round-09/targets/5ddfde3/ch5-links.jpg; critic/rounds/round-09/targets/5ddfde3/ch5-seam5.jpg; critic/rounds/round-09/evidence/gaps/ch5b-live-1600x900/link-5-first-menu.png; critic/rounds/round-09/evidence/gaps/ch5b-cand-1600x900/link-5-first-menu.png; critic/rounds/round-09/evidence/e119552/ffx2-vegnagun-shuyin-win/20-link-2.png, 20-link-3.png, 20-link-4.png, seq-seam-2/, seq-seam-4/; steady state: critic/rounds/round-09/evidence/gaps/ch5-seams-cand-1600x900/link-2..5-first-menu.png; live: evidence/gaps/ch5-seams-live-1600x900/link-2-first-menu.png, link-3-first-menu.png; contact sheets critic/rounds/round-09/feel-narrative/vg-seam2.jpg, vg-seam4.jpg
- Confidence: high that the candidate frames links 2 to 4 badly at the first command menu; the regression question is mixed: live link 2 was tidy, live link 3 already framed badly
- Requirement: CHK-011; CHK-014
- Smallest fix: When the Shuyin arrival beat ends, return the camera to the link's idle rig before the first command menu opens.
- Acceptance check: At 1600x900 and 2000x1012 the link 5 first menu shows Shuyin and all three girls whole, Shuyin's head clear of the HP slab.

### 8. PR-0092 (major, visual)

**Chapter 6's Dr. Goon and Fem-Goon ship as the procedural boss-silhouette placeholder**

- Game: FFX-2. Chapter: ffx2-leblanc (ch6), link 1 of 3. State: src/data/ffx2/enemies/leblanc-syndicate-acts.ts:126,163 (spriteKeys ffx2-dr-goon, ffx2-fem-goon); the fallback is at src/engine/BattlePresenterStage.ts:207 · introducedByCandidate true · regressionVsLive false · inNewFeature true
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Painted goons in the chapter's style, or an approved stand-in (CHK-012: a fallback never ships as the final face).
- Observed: ON 5ddfde3: Re-observed on 5ddfde3: the goons are black hooded cones with a cyan core in link 1, the target step and the seams; no goon subject ships under dist-gate/art/characters. Disclosed.
- Repro: Seed 1, 1600x900, GPU. Title > briefing > chapter select > VI Leblanc > prep > START BATTLE > skip the scene. Link 1 opens with Ormi, Dr. Goon and Fem-Goon.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/11-advisor.png, 16-target-single.png, seq-transition-into-battle/
- Confidence: high
- Requirement: CHK-012; RUBRIC §6 visual (no placeholder delivery)
- Smallest fix: Add painted dr-goon and fem-goon subjects (idle as a minimum) under public/art/characters. Per AGENTS.md rule 9 this needs a quick options pick from Bailey first. Until then, disclose the placeholder in the release note.
- Acceptance check: At link 1, 1600x900, both goons render a painted idle. No paintBossSilhouette is staged in chapter 6 (a network log shows art/characters/<goon>/idle.png loaded and decoded).

### 9. PR-0096 (major, visual)

**Chapter 6 pose art (narrowed, disclosed): Leblanc's idle still holds the fan shut, missing Bailey's named pose B; Ormi's attack, cast, hurt and ko show a different shield and costume from his idle**

- Game: FFX-2. Chapter: ffx2-leblanc (ch6), link 3. State: public/art/characters/leblanc (the round-3 candidate set, disclosed in the brief) · introducedByCandidate true · regressionVsLive false · inNewFeature true
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The Leblanc tile's mustChange: 'Leblanc: B (fan fully open, warm magenta), not the screen pose A or the snapped-shut pose C'.
- Observed: ON 5ddfde3: New since e119552: Leblanc and Logos attack/cast/hurt/ko states keep the idle's identity and Leblanc's cast raises a fully open fan; the idle (the frame seen most) still has the fan shut. Ormi's action states carry a red heart shield and red sleeves against the idle's spoked wheel and green-gold sash. Shipped as the best candidate set on Bailey's instruction; disclosed.
- Repro: Seed 1, 1600x900. Reach link 3 of chapter 6.
- Evidence: critic/rounds/round-09/targets/5ddfde3/ch6-pose-sheet.jpg; critic/rounds/round-09/targets/5ddfde3/chapters-leblanc.jpg; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/20-link-3.png; critic/rounds/round-09/targets/chapters-leblanc-cast-leblanc.jpg, chapters-leblanc-cast-ormi.jpg, chapters-leblanc-cast-logos.jpg, chapters-leblanc.jpg
- Confidence: high
- Requirement: RUBRIC §7, the approved-target gate (tile 'The Leblanc Syndicate (FFX-2)', reaction.mustChange)
- Smallest fix: Already planned: replace it with the identity-LoRA render of pose B in the next release. Disclose it in this release note.
- Acceptance check: A composite against docs/concepts/chapters/leblanc/renders/leblanc-b.png shows the fan fully open and the warm magenta palette at 1600x900 in play.

### 10. PR-0097 (major, visual)

**Bloom washes out the approved Yuna Gunner and White Mage paintings whenever Yuna is the ready girl in FFX-2**

- Game: FFX-2. Chapter: ch4, ch5, ch6. State: suspected: bloom from the actor rim or turn highlight on the painted quad (not traced) · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The approved idle rendered with its costume readable at gameplay scale.
- Observed: ON 5ddfde3: Re-observed: whenever Yuna is the ready girl her White Mage or Gunner robe blows out to white (ch6 11-advisor, 20-link-2, 20-link-3; ch4 and ch5).
- Repro: Seed 1, 1600x900. In chapter 6 at the first command menu, compare Yuna in 11-advisor with 16-target-single.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-bahamut-win/11-advisor.png; critic/rounds/round-09/targets/cast-yuna-gunner-in-ch6.jpg; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/20-link-3.png
- Confidence: medium on the cause, high on the observation
- Requirement: CHK-013 (correct rendering of approved art)
- Smallest fix: Clamp the highlight or rim emissive on white-dominant paintings, or exclude party quads from the bloom threshold.
- Acceptance check: At the ch6 first menu, Yuna's torso mean luminance is within 10 percent of the idle PNG's, and her sash and belt stay legible.

### 11. PR-0008 (major, encounter)

**Chapter 1's own intended strategy still wins only 26 of 40 seeds (carried, STALLED)**

- Game: ffx. Chapter: seymour-flux (chapter 1). State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The shipped intended line wins the great majority of seeds, as chapters 2-6 do (39/40 to 40/40).
- Observed: ON 5ddfde3: Unchanged: 26/40 on seeds 1-40 (unit-full.log). STALLED: the §8 method check is owed before another batch.
- Repro: cd D:/pyrefly-release && npx vitest run tests/unit/strategy-seymour-flux.test.ts
- Evidence: critic/rounds/round-09/combat-5ddfde3/unit-full.log; test stdout this round (seeds 1-40: 26 wins)
- Confidence: high
- Requirement: RUBRIC §6 encounter; §8 stagnation rule (method check owed)
- Smallest fix: Carry forward. The written method check required by §8 is owed before another batch in this area.
- Acceptance check: The same command prints at least 36/40, with no loss before player turn 10.

### 12. PR-0007 (major, encounter)

**Zombie-to-Full-Life kills leave no counter-play window (carried, STALLED; evidence reused)**

- Game: ffx. Chapter: seymour-flux (chapter 1). State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: A player paying attention gets at least one turn to answer the Zombie.
- Observed: ON 5ddfde3: Not re-measured (reused with a dependency argument): the Seymour Flux AI, statuses, CTB and data are unchanged 1b33971..5ddfde3. STALLED.
- Repro: As in critic/rounds/round-08.json PR-0007 (seymour-flux, gagazetBuild, intendedStrategy, seeds 1-30).
- Evidence: critic/rounds/round-08.json (reused); critic/rounds/round-08.json (reused with a dependency argument)
- Confidence: high (reused)
- Requirement: RUBRIC §6 encounter
- Smallest fix: Carry forward, method check owed (§8).
- Acceptance check: Median Zombie-to-kill window of at least 1 player turn over seeds 1-30.

### 13. PR-0087 (major, combat)

**Grenade deals 376-423 per enemy (always crit ×2 on base 200), matching neither source's printed figure**

- Game: ffx2. Chapter: ffx2-leblanc (chapter 6), Act I opener (chateauBuild carries 4 Grenades; the advisor's first three picks are Grenade). State: src/data/ffx2/items/effects-damage.ts:33-50 (bonusCrit: 100 at :49); research conflict combat-core §2.9.3/§5.5 vs leblanc-syndicate §4.6/§6.2 · introducedByCandidate true · regressionVsLive false · inNewFeature true
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The sources conflict, and neither supports 376-423 as printed. research/ffx2-combat-core.md §5.5 prints Grenade as '187-212, always critical', which is base 200 after the randomiser. The same table prints Poison Fang 375-423, and the engine reproduces that row without doubling. research/ffx2-leblanc-syndicate.md §4.6 and §6.2 say 'base 300 to every enemy', i.e. 281-317 [verified: 2 sources]. The engine only matches if 'always critical' is read as an extra ×2 on top of a band the table otherwise uses as final damage.
- Observed: ON 5ddfde3: Unchanged on 5ddfde3: 15 probe hits of 376-607, every one critical; the real-input win opens with Grenade on turns 0, 1, 3 and 5. Awaiting Bailey's pick between the conflicting sources (§4.6/§6 about 281-317; ffx2-combat-core §5.5 187-212).
- Repro: R09_FILE=probe-grenade.test.ts in critic/rounds/round-09/combat (group 'ffx2-leblanc-entrance', chateauBuild, seeds 1-30, first ready girl throws a Grenade at all enemies).
- Evidence: critic/rounds/round-09/combat-5ddfde3/probe-grenade.json; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/turn-log.json; critic/rounds/round-09/combat/probe-grenade.json; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/16-target-single.png (advisor card 1,150-1,268); run.json picks turns 0/1/3
- Confidence: medium (conflicting sources; the engine's reading is possible but undocumented)
- Requirement: AGENTS.md hard rule 6: numbers come from research with their source notes, and conflicts are reported, not resolved silently
- Smallest fix: Settle the conflict from the sources: is the published band pre-crit or final, and is it 200 or 300? Record the ruling in both research files. Set the item so it lands in the chosen band (for example, drop bonusCrit or halve the base). Add a unit test that pins Grenade's per-enemy band. FFX-2 only; chapter 6 is the only build that carries Grenades.
- Acceptance check: The probe's unchained per-enemy Grenade damage falls inside the band the two research files now agree on, the advisor card shows the same band, and a test pins it.

### 14. PR-0061 (major, feel)

**The wait from the scene skip to the first usable command menu is 5.4 to 8.4 s (carried)**

- Game: both. Chapter: all six playable chapters. State: battle entry, before the first interactive command menu · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The opening beat reads as deliberate, and a returning player can shorten it.
- Observed: ON 5ddfde3: Re-measured two ways on 5ddfde3: the play clock at the first menu that accepts input (polled, an upper bound) reads ch1 8.3, ch2 6.5, ch3 6.6, ch4 7.7, ch5 8.9, ch6 9.1 s; the gap pass's probe from the real hold-Enter release reads ch1 9.7 and 8.5 s, ch6 10.4 and 9.8 s (the battle screen is active within 15 ms). Chapter 6 plays two enemy actions (13 events) before Yuna's first menu. No better than round 08, possibly worse; a different probe, so not called a regression.
- Repro: Any chapter from the board with real keys; hold Enter through the pre-battle scene; poll __pyrefly playback.awaitingMenu every 150 ms.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/*/run.json firstState.playTimeMs; critic/rounds/round-09/evidence/gaps/skiplatency/seymour-flux-5ddfde3.json; critic/rounds/round-09/evidence/gaps/skiplatency/ffx2-leblanc-5ddfde3.json; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/*/run.json (steps preSceneSkippedWithHolds and 'FOC first'); */seq-transition-into-battle/
- Confidence: medium (the probe's start point is up to a hold-length early, so the true numbers are shorter)
- Requirement: RUBRIC section 6 feel: responsive input, respectful skip.
- Smallest fix: As in round 08: record the intended length of the opening beat and let Confirm end the intro sweep, as the cutscene skip already does.
- Acceptance check: The same probe, per chapter: either the intended length is documented and met, or a Confirm press during the intro reaches the first menu within the chapter's ATB/CTB fill time.

### 15. PR-0127 (major, interface)

**The party-prep CHAPTER card clips its own text: the TIP cut mid-sentence and the thumbnail row cut off at 1280x720 and 1280x960 in every chapter, chapter 6's captions at 1600x900, nearly everything at 390x844**

- Game: both (shared prep card). Chapter: seymour-flux, ffx2-vegnagun-shuyin, ffx2-leblanc (measured); all by construction. State: party prep, CHAPTER tab · introducedByCandidate false · regressionVsLive false · inNewFeature false
- Expected: The synopsis, the three photo captions, the objectives and the sourced TIP can be read in full, or scroll with a visible cue, at 1600x900, 1280x960, 1280x720 and 390x844.
- Observed: 1600x900: chapter 6's three captions are cut at the card edge ("the Syndicate's", "beaten, never", "loses again, shows"); chapter 4 at 2000x1012 fits. 1280x960 and 1280x720, chapters 1, 5 and 6: the TIP stops mid-sentence ("enemy turn and never", "every part's Defense, hit") and the thumbnails are cut; at 1280x720 the prep root overflows by 22 px. 390x844: the card shows only "FFX-2 ·VI OBJECT Survive Russian" (ch6) or "FFX ·I OBJECT Holy Water a" (ch1). Live chapter 1 at 1280x720 is identical.
- Repro: Fresh profile, real keys: title > briefing > chapter select > card > Enter (party prep, CHAPTER tab) at 1600x900 (ch6), 1280x960, 1280x720 and 390x844.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/04-prep.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-4x3/04-prep.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/04-prep.png; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win-look-phone/04-prep.png; critic/rounds/round-09/evidence/gaps/prep/*-5ddfde3-tab0.png; critic/rounds/round-09/evidence/gaps/prep/seymour-flux-1280x720-live-tab0.png (live, identical)
- Confidence: high for the observation; the cause (fixed card height, overflow hidden, no reflow) is suspected
- Requirement: RUBRIC §6 interface (pause and prep usability, readable names and values); CHK-003; CHK-009; platform goals (4:3, phone)
- Smallest fix: Let the CHAPTER card grow into the empty space below it or scroll its left column with a cue; at phone width stack the card above the party list instead of scaling the 16:9 layout.
- Acceptance check: At 1600x900, 1280x960, 1280x720 and 390x844 every text node in the card has scrollHeight <= clientHeight (or a visible scroll cue) and at least 12 px effective size, for chapters 1, 5 and 6.
- Merged from: prep-delivery (new); gap capture (1280x720 and 1280x960, live comparison)

### 16. PR-0098 (major, onboarding)

**On a phone the pause OPTIONS list draws five rows and no scroll cue; ATB SPEED (new), STRATEGY GUIDE and BATTLE HELP are not rendered, yet ArrowDown still selects them and ArrowRight would change a setting the player cannot see**

- Game: both (FFX loses BATTLE HELP; FFX-2 loses ATB SPEED, STRATEGY GUIDE, BATTLE HELP). Chapter: seymour-flux, ffx2-leblanc. State: pause OPTIONS at 390x844 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Every setting row is visible, or visibly scrollable and reachable, at phone width.
- Observed: ON 5ddfde3: Re-observed on the phone: OPTIONS draws MASTER VOLUM..., MUSIC, SOUND EFFECTS, TEXT SPEED, X-2 BATTLE and nothing more; ArrowDown selects ATB SPEED, STRATEGY GUIDE and BATTLE HELP with rect 0x0 (selectable, not drawn). The intent panel also covers X-2 BATTLE (PR-0122).
- Repro: 390x844, any chapter, Esc at the first menu, Q/E to OPTIONS.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/14-pause-options.png; critic/rounds/round-09/evidence/gaps/phone/ffx2-leblanc-5ddfde3-02-options-row*.png; critic/rounds/round-09/evidence/gaps/phone/ffx2-leblanc-5ddfde3.json; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-look-phone/14-pause-options.png; seymour-flux-look-phone/14-pause-options.png; live baseline critic/rounds/round-08/evidence/pause/ffx2-bahamut-390x844-05-options.png; critic/rounds/round-09/evidence/gaps/phone/ffx2-leblanc-02-options-row05.png, row07.png, seymour-flux-02-options-row05.png, phone/*.json
- Confidence: high (clip observed; zero-rect selected rows measured)
- Requirement: RUBRIC section 6, onboarding: usable settings and device usability. CHK-009.
- Smallest fix: In the narrow pause breakpoint, let the settings block size to its content (the encounter block can move below it), or make it an overflow container with a visible fade and scroll-into-view on the selected row.
- Acceptance check: At 390x844 in both games, arrowing through OPTIONS brings every settings row into view with its full label, and a touch drag or tap reaches ATB SPEED in FFX-2.

### 17. FOC-06 (major, interface)

**Residue: the FFX advisor card is absent on a phone (an orphan "N HIDE MOVES" chip remains) and sheds 4 of its 12 rows at 1280x720; the 12 px desktop floor is met**

- Game: FFX (phone card); both (1280x720). Chapter: seymour-flux. State: first command menu at 390x844; 1280x720 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The advisor's recommendation is readable at every supported size in both games, or hidden with a truthful toggle.
- Observed: ON 5ddfde3: Re-observed: on a phone the FFX card is absent (advisorMinEffPx null) with an orphan "N HIDE MOVES" chip; at 1280x720 in chapters 1 and 3 the card keeps a 12.2 px minimum but sheds damage, hit chance and reason (only move, target, GUIDE'S PICK and IN ITEMS remain).
- Repro: 390x844, fresh profile, Chapter 1, first command menu after the coach.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win-look-phone/11-advisor.png; critic/rounds/round-09/evidence/gaps/firstmenu/seymour-flux-1280x720-5ddfde3-02-menu.png; critic/rounds/round-09/evidence/gaps/firstmenu/braskas-final-aeon-1280x720-5ddfde3-02-menu.png; critic/rounds/round-09/evidence/e119552/seymour-flux-look-phone/11-advisor.png; seymour-flux-look-phone/run.json; 1280x720: critic/rounds/round-09/evidence/gaps/firstmenu/seymour-flux-1280x720.json vs seymour-flux-2560x1440.json
- Confidence: high (phone and 1280x720 both captured)
- Requirement: RUBRIC section 6, interface: readable names and values, useful advice. CHK-020 parity.
- Smallest fix: On FFX phone, mount the same compact last rung FFX-2 uses (move and target only). Where no card is shown, label the chip 'N show moves' or hide it.
- Acceptance check: At 390x844 in Chapter 1 the card shows the move and target at 12 px or more, or no chip claims to hide it. At 1280x720 both games list which rows the card drops.

### 18. PR-0002 (major, visual)

**The FFX command stack hides Yuna in Chapters 1 and 3 (carried)**

- Game: FFX. Chapter: seymour-flux and braskas-final-aeon, command menu. State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Party members visible apart from the declared lower-third overlap.
- Observed: ON 5ddfde3: Re-observed at 1600x900, 2000x1012 and 2560x1080: only Yuna's head and staff show above the faded TALK row in chapters 1 and 3.
- Repro: Seed 1, 1600x900, first command menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/11-advisor.png; critic/rounds/round-09/evidence/5ddfde3/braskas-final-aeon-win/11-advisor.png; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win-look-21x9/11-advisor.png; critic/rounds/round-09/evidence/e119552/seymour-flux-win/11-advisor.png; braskas-final-aeon-win/11-advisor.png; targets/presentation-battle-hud-ffx.jpg
- Confidence: high
- Requirement: CHK-008; Battle HUD FFX tile
- Smallest fix: Move party slot 0 right, or lower the stack's reach, per the round-08 ticket.
- Acceptance check: CHK-008: Yuna's projected quad is at most one-third covered at 1600x900 and 2000x1012.

### 19. PR-0016 (major, visual)

**The pause CHAPTER tab shows the last member's close-up (Paine), not the chapter's approved hero plate (carried, re-observed)**

- Game: FFX-2 (seen in ch4 and ch6; FFX not captured). Chapter: ffx2-bahamut and ffx2-leblanc, pause CHAPTER tab. State: pause/chapter-tab.json lists pause/paine.png as the plate for both chapters · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Hero plate chapter 4 tile note: 'The Until Dawn remake moves it to the CHAPTER tab.'
- Observed: ON 5ddfde3: Re-observed on 5ddfde3 (no longer reused): the CHAPTER tab keeps the last member's plate (ch1 kimahri.2x.webp, ch4/5/6 paine.2x.webp) at 1600x900, 2000x1012 and 390x844; in ch4 the intent panel also sits over the tab (PR-0122).
- Repro: In battle press Esc, then ArrowRight to CHAPTER (1600x900).
- Evidence: critic/rounds/round-09/evidence/gaps/pause/seymour-flux-1600x900-5ddfde3-02-tab3-Chapter.png; critic/rounds/round-09/evidence/gaps/pause/ffx2-bahamut-1600x900-5ddfde3-02-tab3-Chapter.png; critic/rounds/round-09/targets/pause-hero-plate-ch4.jpg; critic/rounds/round-09/evidence/e119552/pause/ffx2-bahamut-chapter-tab.png; critic/rounds/round-09/evidence/e119552/live-1b33971/pause/ffx2-bahamut-chapter-tab.png; critic/rounds/round-09/evidence/gaps/targets/ch1-pause-chapter.png, targets-live/ch1-pause-chapter.png
- Confidence: medium: the tile note is an agent's record, not Bailey's words
- Requirement: RUBRIC §7 target gate
- Smallest fix: Paint the chapter's pause plate behind the CHAPTER tab, or ask Bailey whether the member painting is intended there.
- Acceptance check: The pause-ch4 composite shows the approved Yuna and Bahamut plate behind the CHAPTER tab.

### 20. PR-0079 (major, visual)

**The remade pause draws its meter columns across Kimahri's face, breaking the mirror rule Bailey named**

- Game: both (the side-choice rule is shared plumbing; observed on an FFX member). Chapter: 1 (member:kimahri tab). State: pause screen, member tab, 1600x900 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: For each member the chrome moves to the empty side of that member's painting, as frame (b) of docs/concepts/pause-until-dawn/sheet.png mocks for Yuna.
- Observed: ON 5ddfde3: Re-observed on 5ddfde3: the stats and chapter heading sit over Kimahri's mane and muzzle; the intent chip also covers part of the tab strip (PR-0122). Medium confidence on the mustRemain reading.
- Repro: Live site at 1600x900. Chapter 1, battle, Escape, arrow to the KIMAHRI tab. Deterministic, no seed.
- Evidence: critic/rounds/round-09/evidence/gaps/pause/seymour-flux-1600x900-5ddfde3-02-tab2-Kimahri.png; critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-02-member-kimahri.png,critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-00-member-tidus.png and critic/rounds/round-08/evidence/ch4/09-pause-Esc.png (the control cases),public/art/pause/kimahri.json focal {x:0.42,y:0.44},critic/rounds/round-08/targets/pause-until-dawn-sheet.jpg; critic/rounds/round-09/evidence/gaps/targets/ch1-pause-kimahri.png; targets-live/ch1-pause-kimahri.png
- Confidence: high for the observation; medium for the cause — the side-choice input was not traced past the focal sidecar
- Requirement: docs/target/targets.json, tile "Pause remade on the Until Dawn character screen", reaction.mustRemain: "the text block sits on whichever side of THIS painting is empty" (Bailey, 2026-09-21, "B, yes, yes, yes."). RUBRIC section 7: acceptance cases come from mustRemain.
- Smallest fix: Make the side choice read the same focal the stage already fetches (src/ui/common/chapterPanel.ts:252-266, applied at 342-345) and flip the chrome when the focal x falls on the chrome's side, rather than using a fixed or per-game side. Kimahri at 0.42 should put the block on the right.
- Acceptance check: For all three FFX and all three FFX-2 member tabs at 1600x900, assert the bounding box of the chrome block does not intersect the painting's focal point, and read the six composites against frames (a), (b) and (c) of the approved sheet.
- Repair attempts so far: 0

### 21. PR-0031 (major, visual)

**Target selection lacks two named mustRemain properties, the ground ring under the selected figure and the quiet dim on non-targets (carried, narrowed)**

- Game: both. Chapter: braskas-final-aeon (Yu Pagoda A); ffx2-leblanc (Dr. Goon). State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Targeting tile reaction.mustRemain: 'the soft ground ring under every selected figure', 'the quiet dim on everyone who is not a target'.
- Observed: ON 5ddfde3: Re-observed: no ground ring under the selected Yu Pagoda or Dr. Goon and no dim on non-targets (the gap pass saw a ring plus dimmed party on the single-target cue; the tile's named ring under the selected figure and the quiet dim of the other enemies are the missing mustRemain items).
- Repro: Seed 1, 1600x900. Choose ATTACK at the first menu.
- Evidence: critic/rounds/round-09/targets/5ddfde3/fight-targeting-s2.jpg; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/targets/fight-targeting-s2.jpg; fight-targeting-s3-ch6-proxy.jpg
- Confidence: high
- Requirement: RUBRIC §7 target gate
- Smallest fix: Add the ring decal under the targeted figure's foot point and a 15-20 percent dim on untargeted actors while the cursor is live.
- Acceptance check: The s2 composite shows a ring under the Yu Pagoda and a visible dim on the Final Aeon and Pagoda B.

### 22. PR-0005 (major, visual)

**The approved Turn cut-in is still never shown in play (carried)**

- Game: both. Chapter: all. State: showTurnCutIn has no production call site; the only reference is the re-export at src/ui/inkgold/index.ts:17 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Turn cut-in tile.
- Observed: ON 5ddfde3: Re-observed: no turn cut-in in any party-action sequence (ch1 seq-party-action).
- Repro: grep showTurnCutIn src
- Evidence: critic/rounds/round-09/targets/5ddfde3/ch1-party-action.jpg; critic/rounds/round-09/evidence/e119552/seymour-flux-win/seq-party-action/
- Confidence: high
- Requirement: RUBRIC §7 target gate
- Smallest fix: Call showTurnCutIn from the presenter at turn start, or ask Bailey to withdraw the tile.
- Acceptance check: A timed sequence at a party turn start shows the cut-in slab.

### 23. PR-0035 (major, visual)

**The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile (carried)**

- Game: FFX-2. Chapter: ffx2-bahamut. State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The A-ffx2-battle composition.
- Observed: ON 5ddfde3: Re-observed: the FFX-2 field is mirrored against its approved tile.
- Repro: Chapter 4 first menu, 2000x1012.
- Evidence: critic/rounds/round-09/targets/5ddfde3/presentation-battle-hud-ffx2.jpg; critic/rounds/round-09/targets/presentation-battle-hud-ffx2.jpg
- Confidence: high
- Requirement: RUBRIC §7 target gate
- Smallest fix: Carried from round 08: ask Bailey whether the mirrored field is an accepted adaptation, or re-stage it.
- Acceptance check: The composite matches, or the tile carries Bailey's recorded adaptation.

### 24. PR-0128 (major, visual)

**Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks**

- Game: FFX only. Chapter: yunalesca (ch2; Tidus's gauge never filled in ch1). State: Overdrive > Slice & Dice overlay, 1600x900 · introducedByCandidate unknown · regressionVsLive unknown · inNewFeature false
- Expected: The approved tile: a name plate above the panel and tick labels MISS / HIT x2 / HIT x4 / HIT x6.
- Observed: The overlay works ("Slice & Dice · SWORDPLAY · CONFIRM IN THE GOLD ZONE", a 1.8 s ring and gold zone; Enter resolved to Spiral Cut). The "G HIDE GUIDE · Yunalesca · NEXT · Waiting for your turn · MORE" card sits over the top-left of the overlay where the name plate belongs, and the bar shows only MISS...HIT.
- Repro: Seed 1, chapter 2: play until Tidus's menu shows "Overdrive▸READY" (the gap pass used autoBattle, injected, only to fill the gauge), then ArrowDown to it and Enter.
- Evidence: critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/01-tidus-menu.png; critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/02-overdrive-submenu.png; critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/overlay/f00-f23.jpg; docs/screenshots/mockups/A-swordplay-overlay.jpg
- Confidence: medium (one capture; live not captured)
- Requirement: RUBRIC §7 target gate (tile "Swordplay Overdrive", docs/screenshots/mockups/A-swordplay-overlay.jpg)
- Smallest fix: Hide the guide card, or move it below the overlay, while an Overdrive overlay is up; restore the tick labels from the tile.
- Acceptance check: The frame 0.5 s after Enter on Slice & Dice shows the name plate unobstructed and four tick labels.
- Ship tag reasoning: Live was not captured; unknown on a major does not hold (RUBRIC §3). Disclosed.
- Merged from: gap capture (visual-targets request)

### 25. PR-0017 (major, visual)

**At phone width the party and most enemies are off-screen; in chapter 6 the camera never shows the party through menus or hits (carried, extended)**

- Game: both. Chapter: seymour-flux and ffx2-leblanc at 390x844. State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: All combatants in frame. The phone layout is still a gap waiting on Bailey's options.
- Observed: ON 5ddfde3: Re-observed: on a phone chapter 6 never shows the party through menus, targeting, actions or the spherechange; the goons are cut at the left edge.
- Repro: 390x844, first command menu.
- Evidence: critic/rounds/round-09/targets/5ddfde3/ch6-phone.jpg; critic/rounds/round-09/feel-narrative-5ddfde3/phone-ch6.jpg; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-look-phone/11-advisor.png, 23-midfight.png; seymour-flux-look-phone/11-advisor.png; critic/rounds/round-09/evidence/gaps/phone/ffx2-leblanc-03-hit-0.png, -03-hit-1.png, -04-menu-after-hit-0.png, -04-menu-after-hit-1.png; critic/rounds/round-09/feel-narrative/phone-cmp.jpg, lb-phone.jpg
- Confidence: high
- Requirement: CHK-011
- Smallest fix: Covered by the pending phone-layout options round.
- Acceptance check: Every combatant is in frame at 390x844 in chapters 1 to 6.

### 26. PR-0001 (major, interface)

**At 390x844 the battle HUD is illegible in both games (carried, re-observed)**

- Game: both. Chapter: seymour-flux, ffx2-leblanc. State: battle HUD at phone width · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Every battle label at 14 effective px or more at 390x844.
- Observed: ON 5ddfde3: Re-observed at 390x844 in both games: enemy bars, command rows, party rows and the intent panel render at a few px.
- Repro: 390x844, fresh profile, any chapter's first command menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/11-advisor.png; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win-look-phone/11-advisor.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-look-phone/11-advisor.png; seymour-flux-look-phone/11-advisor.png
- Confidence: high (visual); not re-swept numerically this round
- Requirement: CHK-003; RUBRIC section 6, interface.
- Smallest fix: As round 08 says: give the battle HUD its own type floor in the narrow breakpoint and reflow the panels.
- Acceptance check: A leaf-text sweep at 390x844 in one FFX and one FFX-2 chapter finds zero elements under 14 effective px.

### 27. PR-0095 (major, visual)

**Vegnagun's Bulwark, Redoubt and Node parts render as placeholder silhouettes**

- Game: FFX-2. Chapter: ffx2-vegnagun-shuyin (ch5), links 2 to 4. State: spriteKeys vegnagun-bulwark, vegnagun-redoubt and vegnagun-node (src/data/ffx2/enemies/vegnagun-body.ts:31, vegnagun-head.ts:48, vegnagun-leg.ts:32) have no subject in dist-gate/art/characters. The live manifest critic/artifacts/1b33971.json does not contain them either. · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Painted parts, or an approved stand-in.
- Observed: ON 5ddfde3: Re-observed by the capture owner: the Bulwark, Redoubt and Node parts still render as placeholder silhouettes.
- Repro: Seed 1, 1600x900. Reach chapter 5 link 2.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/24-seam-3-first-menu.png; critic/rounds/round-09/evidence/e119552/ffx2-vegnagun-shuyin-win/20-link-2.png, seq-seam-2/
- Confidence: high
- Requirement: CHK-012
- Smallest fix: Paint the three part subjects, after an options pick from Bailey (rule 9).
- Acceptance check: Links 2 to 4 stage painted parts, with no paintBossSilhouette in chapter 5.

### 28. PR-0058 (major, visual)

**FFX-2 speakers without a portrait: Nooj opens chapter 5, and Brother speaks three lines in chapter 6 on a text-only card (carried, widened)**

- Game: FFX-2. Chapter: ffx2-vegnagun-shuyin, pre-battle scene. State:  · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: A speaker portrait, as every other sampled line has.
- Observed: ON 5ddfde3: Re-observed: no nooj or brother portrait ships in dist-gate/art/portraits; the story scripts are unchanged.
- Repro: Chapter 5, pre-battle scene, first line.
- Evidence: D:/pyrefly-release/dist-gate/art/portraits (listing); critic/rounds/round-09/evidence/e119552/ffx2-vegnagun-shuyin-win/05-pre-scene.png; critic/rounds/round-09/evidence/gaps/ffx2-leblanc-flow-1600x900/pre-26.png, pre-28.png, pre-30.png
- Confidence: high
- Requirement: CHK-012
- Smallest fix: As in round 08: paint the FFX-2 speaker portraits after an options pick.
- Acceptance check: The capture shows a painted Nooj portrait.

### 29. PR-0021 (major, narrative)

**The banter bank is still not implemented (carried, re-confirmed on chapter 6)**

- Game: both. Chapter: party prep and results, all chapters including ffx2-leblanc. State: party prep and victory results · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: research/writing-bible.md section 4: slot-, suitability- and mood-matched exchanges on the formation screen and the victory screen.
- Observed: ON 5ddfde3: Re-confirmed on chapter 6: prep and results carry only the chapter's fixed quips.
- Repro: Open chapter 6's party prep with real keys; win it and read the results.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/run.json (prepText, resultsText); D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/04-prep.png, 31-results.png, run.json prepText/resultsText
- Confidence: high on the absence
- Requirement: writing-bible section 4; RUBRIC section 6 narrative names banter.
- Smallest fix: As round 08; or Bailey rules that banter is out of this milestone's scope, and the issue drops to a suggestion.
- Acceptance check: As round 08.

### 30. PR-0012 (major, interface)

**The FFX-2 command menu never says what the highlighted row does (carried, re-observed in the new chapter)**

- Game: FFX-2 only. Chapter: ffx2-leblanc (also 4, 5). State: first command menu · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Parity with FFX, which prints a help slab ('Physical damage') for the highlighted row.
- Observed: ON 5ddfde3: Re-observed: ATTACK / SKILL / CHANGE / ITEM with no help line in chapter 6, while FFX shows "Physical damage".
- Repro: 1600x900, Chapter 6, first command menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/11-advisor.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/11-advisor.png; seymour-flux-win/11-advisor.png
- Confidence: high
- Requirement: CHK-020.
- Smallest fix: As round 08: mount the info slab in FFX2BattleHud, fed from the FFX-2 CommandMenu selection.
- Acceptance check: Every reachable FFX-2 row prints a non-empty description in Chapters 4 to 6.

### 31. PR-0010 (major, interface)

**The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest**

- Game: both (shared panel). Chapter: 1 and 2 shown; anywhere the body overflows. State: battle, intent panel showing (E), IF YOU ATTACK list · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Either the whole counter list is legible, or the hidden part is signposted and reachable with the keyboard and pad the game is played with - the treatment the strategy guide gets with its MORE chip.
- Observed: ON 5ddfde3: Widened: now visible in both games, the intent ODDS list and the FFX counter bullets are cut mid-glyph with no way to read the rest.
- Repro: Chapter 2, first player turn, press E, 1600x900, read the IF YOU ATTACK list; repeat at Chapter 1.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/12-intent-E.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png, ch1-07-enemy-intent.png
- Confidence: high - visible in two chapters and traced to the cap and the clipped class in the shipped CSS
- Requirement: RUBRIC section 6 interface (honest intent that separates certain from conditional); CHK-003 (zero clipped).
- Smallest fix: Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.
- Acceptance check: At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.
- Repair attempts so far: 0

### 32. PR-0011 (major, interface)

**The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named**

- Game: FFX (FFX-2 already shows it). Chapter: 1 (Seymour Flux). State: battle, intent panel showing, Lance of Atrophy queued · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The panel that exists to say what is about to happen names the Zombie that Lance of Atrophy lands with certainty - the status the whole chapter turns on, because the mount answers a living Zombie with Full-Life for 100 percent of max HP plus a guaranteed Death.
- Observed: ON 5ddfde3: Re-observed now that the FFX panel renders: "Lance of Atrophy · SCRIPTED · Tidus 707-799 31% HP" with no mention of its 100 percent Zombie.
- Repro: Chapter 1, first player turn, press E and read the panel while Lance of Atrophy is queued.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/12-intent-E.png; critic/rounds/round-04/evidence/shots/ch1-07-enemy-intent.png; the same panel in FFX-2 (ffx2-bahamut-03-battle-menu.png) renders its ALSO block because it mounts at full
- Confidence: high for the omission on screen; the density split is the established cause, traced in code
- Requirement: RUBRIC section 2 (the enemy-intent display separates certainty from conditional outcomes); CHK-004.
- Smallest fix: Do not widen the FFX panel: keep the brief density that round 02 asked for, but promote a guaranteed or high-chance status into the brief body, either appended to the description line ('- inflicts Zombie') or as a chip beside SCRIPTED. A 100 percent status is not optional detail, it is the move. FFX only.
- Acceptance check: Chapter 1 turn 1 with Lance of Atrophy queued: the panel names Zombie with its chance, at brief density, without growing past its 30 percent cap; the FFX-2 panel is unchanged.
- Repair attempts so far: 0

### 33. PR-0018 (major, interface)

**The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)**

- Game: FFX (measured); FFX-2 not measured. Chapter: braskas-final-aeon. State: first command menu, cursor on TALK · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Every command label at 4.5:1 or better against its own slab.
- Observed: ON 5ddfde3: Re-measured on 5ddfde3 (no longer reused): TALK text rgb(184,134,42) is 1.74:1 on the selected gold row and 2.87:1 on the unselected cream row, both under 3:1; ATTACK scores 10.6-17.4:1.
- Repro: 1600x900, Chapter 3, first command menu.
- Evidence: critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/01-talk-selected.png; critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/02-talk-unselected.png; critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/run.json; critic/rounds/round-09/evidence/e119552/braskas-final-aeon-win/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-010.
- Smallest fix: As round 08: give selected-and-disabled rows their own token (near-black at reduced opacity, or an inverted slab).
- Acceptance check: A contrast sweep of every row state in both games is at 4.5:1 or better.

### 34. PR-0013 (major, interface)

**FFX-2 letters a uniquely named enemy, now 'Dr. Goon B' in Chapter 6 (carried, awaiting Bailey)**

- Game: FFX-2 only. Chapter: ffx2-leblanc. State: target plate · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Whatever Bailey decides for lettering; a unique name reads plain under the FFX rule.
- Observed: ON 5ddfde3: Re-observed: "Dr. Goon B" letters a uniquely named enemy (awaiting Bailey).
- Repro: 1600x900, Chapter 6, ATTACK, then the target step.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/16-target-single.png
- Confidence: high
- Requirement: RUBRIC section 6, interface: clear target sets.
- Smallest fix: Ask Bailey the narrow question recorded in round 08, then apply one rule.
- Acceptance check: A test over the Chapter 6 and Chapter 5 formations pins the chosen lettering.

### 35. PR-0066 (major, interface)

**The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor**

- Game: both. Chapter: title and chapter select (gates all eight tiles). State: title and chapter select, 390x844, fresh context · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: CHK-003 and the change's own acceptance: no text a player must read falls below 14 effective css px, and the title still composes at 390x844.
- Observed: ON 5ddfde3: Re-observed on the phone title and board.
- Repro: Fresh browser context at 390x844 with no resize down from a larger size. Load the live site, press Enter (or tap the chip) to reach the chapter select, walk every leaf text node under .fe and multiply getComputedStyle(el).fontSize by the accumulated transform scale. No seed involved.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/03-card.png; critic/rounds/round-07/evidence/gaps/pause/390x844/run.json (titleEff.min 9.54, boardEff.min 9.54, 25 nodes listed); critic/rounds/round-07/evidence/fe/frontend.json; critic/rounds/round-07/evidence/fe/16-title-390x844.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/shapes/390x844/run.json (partyPanelEff)
- Confidence: high — measured on the live bundle, and the mechanism is traced in the shipped CSS
- Requirement: critic/CHECKS.md CHK-003 pass/fail "zero elements under 14px"; RUBRIC §2 platform goals (phone is a supported shape).
- Smallest fix: src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.
- Acceptance check: In a fresh 390x844 context the leaf-text sweep over .fe on both the title and the chapter select returns zero elements under 14 effective px, documentElement.scrollWidth === clientWidth, and the re-shot capture shows no clipped or overlapping labels; the same sweep at 1600x900 and 2000x1012 is unchanged.
- Repair attempts so far: 0

### 36. PR-0067 (major, interface)

**At 390x844 the FINAL FANTASY X-2 group sits below an unmarked clip, and every control hint on that screen names a key**

- Game: both (the hidden group is FFX-2). Chapter: chapter select; hides ffx2-bahamut, ffx2-vegnagun-shuyin and the Leblanc coming card. State: chapter select, 390x844, first frame · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: All eight tiles in both game groups are discoverable at phone size, or the frame says plainly that there is more, in a way a touch player can act on.
- Observed: ON 5ddfde3: Re-observed on the phone board.
- Repro: Fresh context at 390x844 with touch and mobile emulation. Load the live site, reach the chapter select, screenshot; enumerate [data-action^=fe-card] and compare each getBoundingClientRect().y with .fe-rail's own rect and scrollHeight.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/03-card.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/board/board-title.json (phoneTop: pageScrollable 0, innerScroller .fe-rail over 158; phoneDown: Down moves the selection to ffx2-bahamut); critic/rounds/round-07/evidence/gaps/board/phone-00-top.png; critic/rounds/round-07/evidence/gaps/board/phone-01-scrolled-bottom.png; critic/rounds/round-07/evidence/gaps/board/phone-03-ffx2-card.png; critic/rounds/round-07/evidence/fe/mouse-start.json (phoneActions: fe-card-5 @ y585, fe-card-6 @ y633)
- Confidence: high that the group is off-frame and unannounced and that the hints are keyboard-only; medium that a player fails to find it, because a touch drag was not tried
- Requirement: The change's acceptance that every one of the five existing chapters starts from the new chapter select with keyboard, mouse and touch; CHK-010 scope; CHK-020 (chapters 4 and 5 are reviewed first, precisely because they are always reviewed last).
- Smallest fix: src/app/screens/frontend/frontend.css gives .fe-rail a fixed height with overflow-y:auto and nothing else in the narrow breakpoint. Smallest useful correction: add a bottom fade mask plus a persistent group indicator — for example pin the two game headings as a two-up switch above the rail, so both games are always visible even when their tiles are not — and add a pointer row to the hint bar. Game case: BOTH, one shared screen, though the group that disappears is the FFX-2 one.
- Acceptance check: At 390x844 in a touch context the FINAL FANTASY X-2 heading is visible in the first frame with no gesture; a touch drag on the rail brings IV and V into view; tapping the Bahamut card selects it and the plate then starts Chapter IV.
- Repair attempts so far: 0

### 37. PR-0019 (major, interface)

**The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending**

- Game: both (shared help-slab composition); observed in FFX. Chapter: 1 (Seymour Flux). State: battle, SPECIAL > CHEER with the group target frame live, 1600x900 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: 'Inflicts Cheer. Hits the whole party.' with the ALL ALLIES chip clear of the text.
- Observed: ON 5ddfde3: Partly re-observed (ch3, 1600x900): with Al Bhed Potion on the party the "ALL ALLIES" chip (13 px) is attached to the top row of the list (HI-POTION), not the selected item, and the item list covers Yuna's bracket.
- Repro: 1600x900: Chapter 1, first player turn, Right into SPECIAL, cursor on CHEER, confirm to raise the group target frame, read the help slab.
- Evidence: critic/rounds/round-09/evidence/gaps/multitarget/braskas-final-aeon-1600x900-5ddfde3-item-party.png; critic/rounds/round-04/crops/ch1-help-clip.png; evidence/shots/ch1-13-target-all.png
- Confidence: high
- Requirement: critic/CHECKS.md CHK-009 (every name that can be shown is shown in full) and CHK-010's all-target label. This build also claims every command's help sentence matches its real targeting.
- Smallest fix: Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.
- Acceptance check: For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.
- Repair attempts so far: 0

### 38. PR-0006 (major, interface)

**The move advisor repeats the chapter's own line whatever the board says: it told the player to recast an already-active Shell on all 13 of Yuna's turns, and the guided fight ran 9 minutes without resolving**

- Game: both (shared advisor plumbing; AGENTS.md rule 14 case: BOTH, and CHK-020). Chapter: measured in ffx2-bahamut (ch.4); the same shape measured in seymour-flux (ch.1); round 05 filed the KO/Zombie half in ch.1. State: battle, advisor open (N), following GUIDE'S PICK by keyboard · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Once Shell is on every party member with about 165 seconds left, the advisor moves on to the next useful move — Magic Break, which its own guide column calls the strongest opening in the fight, or Darkness, the damage route. A player who follows GUIDE'S PICK every turn should make progress.
- Observed: Over one guided real-keyboard route of chapter 4 the card printed the identical row on all 301 samples: "Shell -> the party - GUIDE'S PICK - IN WHITE MAGIC - 10 MP - 100% TO HIT - + SHELL"; distinct picks 1. Yuna cast Shell on every one of her 13 turns while the only Shell that ever landed was the first, at seq 19-21 on engine turn 2 with ticksRemaining 165634 on all three members; the whole 901-event log contains 4 status-add events. The party dealt 4,489 of Bahamut's sourced 8,400 HP in 61 engine turns over 9 minutes 5 seconds and the battle never resolved (endScreen "battle"). The blind route that ignored the advisor resolved the same encounter in 2:22. Chapter 1 shows the same shape: 6 of 6 picks were "Hastega -> the party". The advice is otherwise correct and actor-bound — buildAdvisorView returns Magic Break / Mental Break / Armor Break / Attack for Paine, Darkness for Rikku, Shell > Protect > Cure/Cura for Yuna, and never names Shell on a turn where every living active already has it; the repetition is the chapter-line branch, not the ranked branch. NOT RE-MEASURED THIS ROUND: the advisor was exercised (63 commands read off it and driven through the real menu in Chapter 3, 51 of 52 taken exactly as advised) but the repetition claim was not re-benched, so this carries at round 06's severity on round 06's evidence.
- Repro: node -e over critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json: picks.length 301, distinct 1; battleLog action-start yuna:Shell 13; steps[1].v {screen:"battle", turns:301, ms:545528}. Chapter 1: ch1/supp-win-1600x900.json, six Hastega. Engine-side: npx vitest run --config critic/rounds/round-06/bench/vitest.bench.config.ts critic/rounds/round-06/bench/z06-encounter.test.ts.
- Evidence: critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json; critic/rounds/round-06/evidence/ch1/supp-win-1600x900.json; critic/rounds/round-06/evidence/ch4/L-1600x900-guide-open.png; critic/rounds/round-06/bench/out/z06-all.txt; src/engine/tactics/advisor.ts recommendedCommand; src/engine/tactics/ffx2-bahamut.ts
- Confidence: High. The repetition and its consequence come from the engine log, not from inference. The actor-binding half that round 06 first suspected is REFUTED (see PR-0055) and is not part of this finding.
- Requirement: CHK-005 (advice stays useful on damaged or resource-starved boards) and RUBRIC §2 ("the advisor offers legal, useful actions"). Bailey's own reported shape of this defect: "im controlling tidus but the advisor is telling me to use poison fang?"
- Smallest fix: Give the chapter-line branch the same state test the simulated ranking already applies: before recommendedCommand returns the tactic's pick, resolve it on the throwaway copy the advisor already builds and drop it when it changes nothing measurable — a buff whose status is already on every named target, a cure with nothing to cure. One guard in src/engine/tactics/advisor.ts, game-agnostic, and the same short-circuit round 05 traced for the revive branch, so one repair closes both halves.
- Acceptance check: Seeded engine test over chapters 1 and 4: run the advisor's own pick for 30 consecutive player turns and assert no suggestion is returned whose simulated resolution produces no status-add, no damage, no healing and no cure. Plus one real-keyboard capture of chapter 4 in which the pick changes away from Shell on Yuna's second turn, and the route reaches an outcome.
- Repair attempts so far: 1

### 39. PR-0020 (major, visual)

**The dialogue plate over-scales every portrait, so a speaker delivers the line with the top of the face cut off (merges PR-0056)**

- Game: both. Chapter: all five. State: battle, a story beat playing, 1600x900 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The portrait fills its slot, cropped to the head, contained by the card frame.
- Observed: Confirmed on this build, and PR-0056 (Jecht framed off his face) is merged in as the same root: the portrait image is taller than the plate it sits in and is clipped at the top. Measured overflow: Jecht 398 px, Kimahri 231 px, Braska 176 px, Rikku 24 px. The worst player-visible case is the mid-battle beat in Chapter 1, where Seymour says his line with everything above his nose cut away, which removes the expression the line is carrying.
- Repro: Production candidate c71cd82 from D:/pyrefly-release/dist-gate, vite preview, fresh profile, 1600x900, PYREFLY_BROWSER=gpu. Enter each chapter's pre-battle scene and advance line by line with Enter taps, reading .dbox__portrait and the slab rect per line. critic/rounds/round-06/gap-scenes.mjs.
- Evidence: critic/rounds/round-07/evidence/ch1/run.json, ch2/run.json, ch3/run.json, ch4/run.json sceneSpeakers overflowPx 231 / 176 / 398 / 24; critic/rounds/round-07/zz-dlg-ffx.jpg; critic/rounds/round-07/zz-dlg-ch1.jpg; critic/rounds/round-07/evidence/frames-ffx/
- Confidence: High — measured rects on 48 chapter 1 lines and every chapter 2 line, plus two frames.
- Requirement: CHK-012 (the actual crop in its destination), CHK-014 and RUBRIC section 6 visual - this judges the rendering, not the artwork.
- Smallest fix: Already written in the tree after this build: commit 71059ae 'Dialogue card: fit every portrait to its slot, fix Jecht, fix phone width', with 8fe4f99 behind it. Nothing new to design — the next deploy should carry it, and this review should verify it there.
- Acceptance check: At 1600x900 and 2000x1012, in chapters 1, 4 and 5, the portrait element's bounding rect is fully inside the slab's rect and no pixel of the slot's fill colour is visible around the painting.
- Repair attempts so far: 1

### 40. PR-0065 (major, visual)

**The chapter board paints letter tiles and unpainted cards on arrival; the approved board only appears seconds later**

- Game: both. Chapter: chapter select (all). State: chapter select, first arrival, cold and warm cache, 1600x900 and 390x844 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: docs/concepts/polish/showpiece-frontend/chapter-select.png: the dossier PARTY row shows three painted faces and every list row shows its painted thumbnail. A fallback is for a decode failure, not for the first paint.
- Observed: The primary board capture at 1600x900 shows the PARTY row as a grey letter tile "T", Yuna painted, and a grey letter tile "K", while the IV Bahamut, V Vegnagun and Leblanc rows carry no thumbnail at all and II Lady Yunalesca and III Braska's Final Aeon do. Timed sampling puts numbers on it: on a cold load the three dossier faces read letter T / Y / K at the first sample, Tidus resolves at about 0.5 s, Kimahri at about 2.7 s and Yuna only at about 4.4 s; the board itself is on screen at 493 ms. It self-heals — the same row captured at 12 s shows three painted portraits — and it reproduces at 390x844 and with a cleared save. The featured card is correctly an ink silhouette (that is the approved treatment until the chapter is cleared) and is not part of this defect.
- Repro: Fresh context, cold HTTP cache, 1600x900. Load the live site, press Enter on the title, screenshot the chapter select on arrival and at +500 ms, +1 s, +1.5 s, +2 s; sample the .fe-party__face images for complete/naturalWidth at each step.
- Evidence: critic/rounds/round-07/evidence/fe/11-chapter-select-1600x900.png; critic/rounds/round-07/evidence/gaps/board/facechips.json (cold: letters T/Y/K at sample 0, all three decoded by sample 8); critic/rounds/round-07/evidence/gaps/board/cold-00-first-frame.png; critic/rounds/round-07/evidence/gaps/board/facechips-cold-12s.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/fe/19-board-cleared.png; critic/rounds/round-07/targets/polish-chapter-select.jpg
- Confidence: high — the defect is in the reviewer's primary capture of the screen and the timing evidence establishes the cause
- Requirement: critic/CHECKS.md CHK-012 "a fallback never ships as the final face"; the owner-approved chapter-select target; the same letter-tile shape the owner reported himself as LIVE-A2-1.
- Smallest fix: Suspected: the board renders synchronously and the letter or empty card is what paints until each <img> load event fires. Smallest useful correction: await img.decode() on the selected chapter's three dossier faces and on the visible rows' thumbnails before the board's first paint — they are already in the preload list, so this costs a wait, not a fetch — and hold the previous card's art on a selection change. Failing that, make the fallback the ink silhouette the locked cards already use, so no state of this screen ever shows a letter. Game case: BOTH — one shared screen.
- Acceptance check: Fresh cold-cache context at 1600x900 and again at 390x844: the chapter select captured on arrival and at +200 ms shows no letter tile, every unlocked row shows its thumbnail and every .fe-party__face img reports naturalWidth > 0 before the screen is visible; repeat after ArrowRight and ArrowDown.
- Repair attempts so far: 0

### 41. PR-0063 (major, game-awareness)

**The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters**

- Game: FFX-2. Chapter: ffx2-bahamut and ffx2-vegnagun-shuyin (chapter board dossier). State: chapter select, dossier PARTY row, with an FFX-2 card selected · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The dossier's faces for an FFX-2 chapter use yuna-x2.png and rikku-x2.png, as the FFX-2 battle HUD in the same session does.
- Observed: The dossier renders art/portraits/yuna.png and art/portraits/rikku.png — Yuna in her X summoner look, Rikku in her X Al Bhed goggles — beside Paine, who is X-2 only, so the row is visibly two games at once. The correct assets ship and resolve: public/art/portraits/yuna-x2.png and rikku-x2.png exist and the same live session's Chapter 4 battle requests them. The FFX cards are correct (tidus/yuna/kimahri, tidus/yuna/auron), so the fault is FFX-2-only.
- Repro: Title, Enter, ArrowRight until snapshotState().screenState.selectedId === 'ffx2-bahamut', wait for the faces to load, read the .fe-party__face img sources. No seed involved.
- Evidence: critic/rounds/round-07/evidence/fe/faces.json (ffx2 block: yuna.png, rikku.png); critic/rounds/round-07/evidence/fe/53-party-row-zoom-ffx2.png; critic/rounds/round-07/evidence/confirm/c2-faces-and-rim.json (per-card faces for all five chapters; all six portraits complete, naturalWidth 832); critic/rounds/round-07/evidence/confirm/c8-ffx2-party-zoom.png; critic/rounds/round-07/evidence/ch4/run.json battleImgs (portraits/yuna-x2.png, portraits/rikku-x2.png)
- Confidence: high — independently reproduced by the confirmation pass
- Requirement: AGENTS.md hard rule 14 and CHK-021: a change true to FFX does not apply to FFX-2.
- Smallest fix: The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.
- Acceptance check: With an FFX-2 card selected the dossier face images are yuna-x2.png, rikku-x2.png and paine.png; with an FFX card selected they are tidus.png, yuna.png, kimahri.png (and auron.png on Chapter III).
- Repair attempts so far: 0

### 42. PR-0057 (major, visual)

**At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line**

- Game: both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing). Chapter: reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent. State: pre-battle cutscene at 390x844 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: At phone width the speaker name, the faction plate and the line are readable, and the persistent key-hint bar does not overlap them or overflow the viewport.
- Observed: The whole card is compressed into a roughly 60 px strip at the bottom of the 844 px viewport (slot 77x81 at y=747). The .chint bar renders over it: in chapter 5 "ENTER ADVANCE - HOLD ENTER SKIP - ESC MENU" sits across Nooj's name, his YOUTH LEAGUE plate and his line "Baralai carries him."; in chapter 1 the same bar sits across Kimahri's name and line and his portrait is reduced to a sliver. The hint bar is 443 px wide inside a 390 px viewport (x = -27, overflowing 27 px past each edge). Kimahri's image is 94x137 at y=716 against a 77x81 slot at y=747 — larger than its slot in both axes, PR-0020 again at this size. NOT RE-VERIFIED THIS ROUND; commit 71059ae in the tree claims the phone-width half.
- Repro: Serve the candidate (D:/pyrefly-release/dist-gate, vite preview). Viewport 390x844, PYREFLY_BROWSER=gpu. Real keys: Enter at the title, ArrowRight x4 for chapter 5 (none for chapter 1), Enter, Enter at party prep. Wait for screen()=="cutscene" AND .dbox--visible AND computed opacity > 0.5 (an earlier capture shows a mid-fade card and must be discarded). Read the .dbox, .dbox__portrait and .chint rects. Deterministic, no seed.
- Evidence: critic/rounds/round-06/evidence/gaps/escape/phone-v2.json; critic/rounds/round-06/evidence/gaps/escape/ch5-nooj-no-portrait-390x844-v2.png; critic/rounds/round-06/evidence/gaps/escape/ch1-kimahri-painted-390x844-v2.png; critic/rounds/round-06/gap-phone.mjs
- Confidence: High — measured rects plus two frames, reproduced in both games.
- Requirement: RUBRIC §5 legibility and CHK-003; the Ink & Gold spec docs/handoff/presentation-ink-and-gold.md — the dialogue card is the primary narrative surface.
- Smallest fix: Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.
- Acceptance check: At 390x844 in chapters 1 and 5, with .dbox--visible asserted: the .chint rect does not intersect the .dbox__body or the speaker-plate rect, and .chint lies entirely within 0..viewportWidth.
- Repair attempts so far: 1

### 43. PR-0014 (major, visual)

**HUD portrait chips crop through heads; the monogram half is repaired**

- Game: both. Chapter: 1 to 5. State: CTB list, party status rows, prep roster, results rows and pause dossier, 1600x900 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Every portrait chip shows the whole head with air above the hair and below the chin, consistently framed across the set, and no monogram stands in for a shipped character.
- Observed: Half repaired, and that half is verified. Paine is now a painted face everywhere she was a letter monogram: party prep (left list and bottom bar, read at 4x), the pause party bar, the battle HUD chip and results — ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits, and the face is recognisable at chip scale (silver-and-red hair, red eyes, studded collar). The crop half is unchanged: the chips still cut the top of the head on Yuna, Rikku and Paine. PARTIALLY REPAIRED IN THIS BUILD: both Paine idles were replaced and src/ui/common/face-crops.json was re-measured, and Paine's HUD chip now crops her face (portraits/paine.png at 48x70, a 0.684 source aspect into a 0.686 slot, so no distortion either). The FFX half and the rest of the FFX-2 cast were not re-swept, so the ticket stays open.
- Repro: 1600x900: Chapter 1 battle, read the CTB list and the party rows; Chapter 3 battle, read Auron's row; Chapter 4, read Paine's battle row, then lose and read her results row, then RETRY and read the prep roster, then Esc and read the pause chips.
- Evidence: critic/rounds/round-07/evidence/gaps/art/spotcheck.json (chips); critic/rounds/round-07/evidence/gaps/art/paine-chip-zoom.png; critic/rounds/round-07/targets/zoom-ch4-chips.jpg
- Confidence: high
- Requirement: critic/CHECKS.md CHK-012 (the visible crop contains the whole head; a fallback never ships as the final face) and CHK-020 (consistent portrait treatment across shared screens). Owner-reported 2026-09-18 ('Auron's HUD portrait is cropped through the chin').
- Smallest fix: Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.
- Acceptance check: Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.
- Repair attempts so far: 1

### 44. PR-0015 (major, visual)

**Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5**

- Game: FFX-2. Chapter: 5, battle 1 of 5. State: battle, default framing, 1600x900 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The party line and the enemy's painted extent do not intersect in a way that makes either look broken.
- Observed: Re-observed on this candidate: Vegnagun's green tail tip still reads as an un-keyed green shard stuck to Rikku's forearm through all of chapter 5.
- Repro: 1600x900, PYREFLY_BROWSER=gpu. Title, Chapter 5, party prep, Enter, skip the scene, first player turn: look between Rikku's raised right gauntlet and the hilt of her sword.
- Evidence: critic/rounds/round-05/evidence/ch5/04-first-menu.png and the ch5 capture set
- Confidence: high
- Requirement: CHK-014's wider class (art correct in isolation can still be wrong once staged) and CHK-011 (a targetable enemy's readable features are not occluded by the party).
- Smallest fix: Move the Chapter 5 battle-1 enemy slot right, or the party line left, so the tail's green tip clears the party quads. Do not repaint either approved plate.
- Acceptance check: Project the vegnagun-tail quad and each party quad through the Chapter 5 camera and assert zero intersection in the default framing, then re-shoot and confirm no saturated-green pixels (g>170, g-r>60, g-b>45) fall inside any party member's bounding box.
- Repair attempts so far: 0

### 45. PR-0022 (major, visual)

**A KO'd character is the standing billboard rotated about its centre, floating off the ground away from her station**

- Game: FFX (observed); the treatment is shared, so it is expected in both. Chapter: 1 (Seymour Flux). State: battle, after Yuna is KO'd, 1600x900 · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: A downed character reads as down on the ground at her own station, the way FFX stages a KO. Ground contact is a named visual criterion in RUBRIC §6 and in CHK-014.
- Observed: RAISED FROM POLISH TO MAJOR this round, on direct observation rather than a synthesized state: in a real-input capture of Chapter 1, after Yuna is KO'd (her party row reads 0/1500 and is greyed), she is drawn lying horizontally in mid-air at about the other actors' chest height, displaced far left of the party group into empty backdrop, with no ground contact and a white bloom over her torso. It is the most conspicuous wrong thing on screen in that frame, and a KO is a routine event in every chapter. Round 06 filed the same root as polish from a smaller sample; the severity is raised for visibility and frequency, not because the defect changed.
- Repro: Chapter I from the board with real keys; play until Yuna is KO'd, then open target selection and capture at 1600x900 (route as in evidence/ch1/run.json).
- Evidence: critic/rounds/round-07/evidence/ch1/09-targeting.png
- Confidence: high
- Requirement: RUBRIC section 6 visual (poses, ground contact); the approved 'Yuna, battle poses' tile.
- Smallest fix: Rotate the KO billboard about the actor's feet, not its centre, and keep it at the actor's own station on the ground plane; better, give the cast a dedicated downed pose. Game case: BOTH — one shared actor layer.
- Acceptance check: A KO in one FFX and one FFX-2 chapter leaves the character touching the ground plane at her own station, with no gap between the billboard and the floor, at 1600x900 and 2000x1012.
- Repair attempts so far: 0

### 46. PR-0060 (major, process)

**The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce**

- Game: FFX only. Chapter: ch.3 (braskas-final-aeon). State: the yu-yevon-arrives trigger · introducedByCandidate false · regressionVsLive false · inNewFeature false
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The tile's stated acceptance case, "A dialogue line spoken by Yu Yevon with the portrait showing (public/art/portraits/yu-yevon.png)", is producible from play so the tile can be verified.
- Observed: No shipped script gives yu-yevon a say() line. grep -rn "say('yu-yevon'" over src/story/ returns nothing, and a full trace of every say() id in every shipped script does not list it. yu-yevon is declared as a SpeakerId (src/story/dsl.ts:45) and exists as a combatant id, an AI script id and a music/sfx key, but its only story-layer uses are a trigger condition (braskas-final-aeon.ts:221, when: { type: "hp-below", who: "yu-yevon" }) and an fx call (line 349); the lines over his on-field reveal belong to Tidus and then Auron (lines 350-352). public/art/portraits/yu-yevon.png ships at 1.56 MB and can never be displayed as a speaker portrait. The tile's own note already records that the file is a safety net against a 404 rather than a face, which contradicts the acceptance case as written.
- Repro: In D:/pyrefly-release: grep -rn "say('yu-yevon'" src/story/ (no matches); grep -rn "yu-yevon" src/story/ (only dsl.ts:45 and braskas-final-aeon.ts 220/221/223/285/305/347/349). Then play chapter 3 to the yu-yevon-arrives trigger and observe the speaker is Tidus, then Auron.
- Evidence: critic/rounds/round-06/evidence/gaps/yu-yevon/trace.txt (full grep transcript and the tile record); critic/rounds/round-06/evidence/gaps/audio/ch3-phase-7.png (the arrival itself)
- Confidence: High — traced in source, and the tile's own note corroborates it.
- Requirement: CHK-012 and RUBRIC §7's approved-target gate — every required tile in docs/target/targets.json must be matched from the build.
- Smallest fix: An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.
- Acceptance check: Either a captured dialogue frame at 1600x900 shows speaker "Yu Yevon" with yu-yevon.png at naturalWidth > 0, or the tile in docs/target/targets.json carries a delivery state that does not require one.
- Repair attempts so far: 0

### 47. PR-0129 (polish, audio)

**Boss themes false-start at an entrance scene: chapter 5's chain starts boss-shuyin, the "shuyin-appears" scene cuts it to silence at the first hit, then restarts it from the top (chapter 3 does the same at possessed Valefor)**

- Game: both (FFX-2 ch5 observed; FFX ch3 observed by the gap pass; the chain-cue versus scene-cue plumbing is shared). Chapter: ffx2-vegnagun-shuyin link 5; braskas-final-aeon after the BFA KO. State: chain seam into a formation whose entrance scene also scores it
- Expected: One owner decides the music: either the theme plays continuously from the seam, or (if Bailey wants the silent confrontation) it starts once when the scene ends.
- Observed: Chapter 5, seconds from the link-5 change: boss-shuyin replaces boss-vegnagun at 0.5 s (gain 1.0 by 1.0 s), fades to silence at 5.6 s through the scene, restarts from the top at 29.6 s. Live 1b33971 shows the same stop and restart. Chapter 3: boss-jecht restarts at possessed Valefor (376.3 s), fades 4 s later, 24 s of silence, then boss-yu-yevon. The capture owner's major ("never returns") was REFUTED by the confirmer: the after-fight sample is a new boss-shuyin slot, so the theme does come back.
- Repro: Production build 5ddfde3, seed 1, 1600x900, Wait: chapter 5 to link 5, sample window.__pyrefly audioDebug().music every 500 ms from the seam until 10 s after "shuyin-appears" ends.
- Evidence: critic/rounds/round-09/evidence/gaps/ch5b-cand-1600x900/run.json (audio5); critic/rounds/round-09/evidence/gaps/ch5b-live-1600x900/run.json; critic/rounds/round-09/evidence/gaps/audio-braskas-final-aeon-5ddfde3/run.json; critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/run.json (audio[]); critic/rounds/round-09/audio/slots-5ddfde3.txt; src/app/screens/BattleEncounterChain.ts:188-189; src/story/scripts/ffx2-vegnagun-shuyin.ts:355,381
- Confidence: high for the routing state (read from audioDebug, not heard; CHK-001/B1 stay UNVERIFIED)
- Requirement: RUBRIC §6 audio (routing, phase transitions); docs/audio/THEMES.md cue map row 19
- Smallest fix: Remove the leading music(null, ...) from "shuyin-appears" and "valefor-enters" so the chain cue carries through, or give those formations no chain cue so the scene alone starts the theme (Bailey's pick).
- Acceptance check: audioDebug sampled every 500 ms from the link start to 10 s after the scene: exactly one boss-shuyin slot start and no stop before the fight ends (or, in the silence variant, no boss-shuyin before the scene's last line); the same at chapter 3's possessed-Valefor entrance.
- Note: Audible only since the PR-0089 fix; the script order predates the candidate and live does the same.
- Merged from: capture owner (major, refuted and downgraded); audio AUD-09R-01; gap capture (ch5 and ch3 timelines, live comparison); confirmer: NOT CONFIRMED as "never returns"

### 48. PR-0076 (polish, encounter)

**PR-0076 narrowed: under a player-chosen Active, chapters 5 and 6 are rarely won at human decision speed in the bench (the default and every returning save are now Wait)**

- Game: ffx2. Chapter: ffx2-bahamut, ffx2-vegnagun-shuyin, ffx2-leblanc: a returning player's save. State: src/app/SaveData.ts defaultSettings (default only, no migration at e119552)
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: D-029 (Bailey, 2026-09-22): Wait is the default. Bailey then accepted the recommended one-time migration, so returning players get Wait until they choose Active.
- Observed: ON 5ddfde3: Fixed for the default and for returning players (save migration verified). Under a chosen Active: ch6 wins 14/40 and 12/40 at 1.5 s and 6/40 and 0/40 at 4 s; ch5 2/40 at 1.5 s. The harness logs 254-1,056 refused submits in those arms, so part of the collapse may be the bench's own resubmission.
- Repro: Load the live save shape recorded in critic/rounds/round-09/logs/e-save-compat.log into the candidate: candidateSettings.ffx2Atb = 'active'. Bench: R09_SEED0=1 or 101, R09_GROUP=ch6 / ch5 (vegnagun-tail), arms 'ACTIVE D=1500/4000'.
- Evidence: critic/rounds/round-09/combat-5ddfde3/bench-r09-ch6-s1.json; critic/rounds/round-09/combat-5ddfde3/bench-r09-ch6-s101.json; critic/rounds/round-09/combat-5ddfde3/bench-r09-ch5-s1.json; critic/rounds/round-09/logs/e-save-compat.log; critic/rounds/round-09/evidence/e119552/save/save-compat.json; critic/rounds/round-09/evidence/gaps/returning/ch6-01-first-menu-coach.png, ch6-03-after-10s-idle.png, ch6-04-target-chip.png; critic/rounds/round-09/combat/bench-r09-ch6-s1.json, -ch6-s101.json, -ch5-s1.json
- Confidence: high
- Requirement: docs/target/decisions.json D-029; RUBRIC §6 encounter (correct difficulty); cross-ref CHK-024
- Smallest fix: Measure Active with a harness that re-reads the decision instead of resubmitting; then ask Bailey for the target band.
- Acceptance check: A clean Active measure with 0 refused submits is recorded and Bailey rules on the band.

### 49. PR-0130 (polish, interface)

**FFX: opening the intent panel with E makes the advisor card decline and leaves its "N HIDE MOVES" chip floating alone**

- Game: FFX only. Chapter: seymour-flux (1600x900 and 2000x1012). State: first command menu after E
- Expected: Card and intent panel both visible, or the chip hides with its card.
- Observed: After E the card is not drawn and its chip sits alone at the bottom centre.
- Repro: Chapter 1, first command menu, press E.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win-r2/12-intent-E.png; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/12-intent-E.png
- Confidence: high
- Requirement: CHK-006 (overlays die with their owner)
- Smallest fix: Hide the chip with its card, or give the card a second slot while intent is open.
- Acceptance check: After E in chapters 1 to 3 no orphan N chip is on screen.
- Merged from: capture owner; interface R09B-INT-04

### 50. PR-0131 (polish, interface)

**The chapter 1 advisor chains Phoenix Downs into immediate re-KOs: Yuna revived 7 times, KO'd again before acting after 6 of them**

- Game: FFX only. Chapter: seymour-flux attempt 1. State: advisor-led real-key play
- Expected: Revive advice accounts for a telegraphed re-kill or recommends the recovery that survives it.
- Observed: battle-log seq 258-376: 7 Phoenix Downs on Yuna (750 HP); 6 re-KOs before she acted.
- Repro: Chapter 1, seed 1, advisor-followed real keys.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/turn-log.json; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/battle-log.json
- Confidence: medium (one route)
- Requirement: CHK-005 (advice stays useful on damaged boards)
- Smallest fix: Build the degenerate-board matrix CHK-005 asks for first; then weigh revive advice against the next enemy action the intent model already predicts.
- Acceptance check: advisor-degenerate-boards test covers the telegraphed re-kill case in chapter 1.
- Merged from: interface R09B-INT-05

### 51. PR-0132 (polish, interface)

**Chapter 5 lists two identical "BULWARK" rows with no letter, and the intent panel says "BULWARK acts next" without saying which**

- Game: FFX-2 only. Chapter: ffx2-vegnagun-shuyin link 3. State: HP header and intent panel
- Expected: Duplicate enemies are distinguishable wherever they are named.
- Observed: Two unlettered BULWARK rows in the HP header; the intent headline cannot say which acts.
- Repro: Chapter 5, seed 1, link 3 first menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/24-seam-3-first-menu.png
- Confidence: high
- Requirement: RUBRIC §6 interface (clear target sets, readable names)
- Smallest fix: Letter duplicate part names consistently in the header, the intent panel and the target plate.
- Acceptance check: Link 3 shows "BULWARK A" / "BULWARK B" in the header and the intent names one of them.
- Merged from: interface R09B-INT-06

### 52. PR-0133 (polish, narrative)

**Post-battle scenes stage nothing: victory poses, camera moves, dissolves and fx run over an empty painted room, so chapter 6's beat 14 asks "What am I looking at?" with nothing to look at**

- Game: both (CutsceneScreen is shared). Chapter: ffx2-leblanc post-scene (worst); yunalesca ("thins like frost" dissolve); all aftermaths. State: post-battle scene
- Expected: The aftermath shows what its script stages, or the script is written for a backdrop-only scene.
- Observed: CutsceneScreen draws only a backdrop; its camera, moveActor and setPose steps do nothing and fx is a 90 ms flash (src/app/screens/CutsceneScreen.ts:380-392). Chapter 6's victory pose is an empty room for about 2.3 s; the Vegnagun reveal is text over the Chateau backdrop with portraits (gap pass read all 32 lines by single Enter taps).
- Repro: Win chapter 6 with real keys and watch the post-scene; read the epilogue line by line.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/30-post-scene.png; critic/rounds/round-09/evidence/gaps/ffx2-leblanc-flow5dd-1600x900/run.json (post[]); critic/rounds/round-09/evidence/gaps/ffx2-leblanc-flow5dd-1600x900/post-01/02/08/22/30.png; critic/rounds/round-09/feel-narrative-5ddfde3/post-scenes.jpg
- Confidence: high
- Requirement: RUBRIC §2 and §6 narrative (a satisfying aftermath; a scene counts when the player can see it)
- Smallest fix: A design decision first (see proposal P-09-7): stage aftermaths on the battle stage, or rewrite their steps for a still.
- Acceptance check: Chapter 6 beat 14 shows an image of what the line refers to, or its lines no longer point at one.
- Merged from: feel-narrative N09-FN-02

### 53. PR-0134 (polish, narrative)

**Chapter select names chapter VI "Leblanc", but its BOSS row reads "Ormi + Dr. Goon + Fem-Goon" and the silhouette is Ormi**

- Game: FFX-2 only. Chapter: ffx2-leblanc. State: chapter select card
- Expected: The card names the fight the player is choosing.
- Observed: The BOSS row lists only Act I; the silhouette is Ormi.
- Repro: Chapter select, arrow to VI.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/03-card.png
- Confidence: high
- Requirement: RUBRIC §6 narrative (context)
- Smallest fix: List the Syndicate (Leblanc, Ormi, Logos) or the three acts.
- Acceptance check: The VI card names Leblanc among its bosses.
- Merged from: feel-narrative N09-FN-03

### 54. PR-0135 (polish, visual)

**At 4:3 a hard-edged dark 16:9 band cuts across the FFX-2 battle backdrop**

- Game: FFX-2 (seen in chapter 6; not in FFX chapter 1). Chapter: ffx2-leblanc at 1280x960. State: any battle state
- Expected: A full-bleed backdrop with no visible scrim edge.
- Observed: A translucent dark rectangle spans y 120-840 at 1280x960 (a centred 16:9 box); luminance steps 110>78 at the top and 22>38 at the bottom. Also in the e119552 gap captures at 1024x768 and 1600x1200.
- Repro: 1280x960, chapter 6, any battle state.
- Evidence: critic/rounds/round-09/targets/5ddfde3/crop-4x3-band-top.png; critic/rounds/round-09/targets/5ddfde3/crop-4x3-band-bottom.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-4x3/20-link-2.png
- Confidence: medium (cause suspected: an FFX-2 HUD container with a background sized to 16:9)
- Requirement: RUBRIC §2 platforms (4:3); §6 visual composition
- Smallest fix: Remove the fill from the 16:9 HUD box or feather its edges.
- Acceptance check: At 1024x768 and 1280x960 in chapters 4 to 6 no luminance step at the 16:9 box edges.
- Merged from: visual R09b-VIS-02

### 55. PR-0136 (polish, visual)

**At party scale the Syndicate and goons queue in one diagonal file right behind the party**

- Game: FFX-2 only. Chapter: ffx2-leblanc links 1-3. State: default framing
- Expected: Opposing sides separated across the floor.
- Observed: Dr. Goon then Logos stand about 70 px from Paine; the enemies occupy the centre third; the slots were authored for boss scale and only the heights changed (9ba0b71).
- Repro: Seed 1, 1600x900, chapter 6 links 1-3.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/20-link-3.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/targets/5ddfde3/ch6-seam3.jpg
- Confidence: medium
- Requirement: RUBRIC §6 visual (composition, staging)
- Smallest fix: Re-space the chapter 6 enemy slots toward stage right.
- Acceptance check: At 1600x900 no enemy within 150 px of a girl in the default framing; enemies in the right half.
- Merged from: visual R09b-VIS-03

### 56. PR-0137 (polish, visual)

**Bahamut's painting has un-removed white matte holes between wings and body, which bloom turns into glowing blotches**

- Game: FFX-2 only. Chapter: ffx2-bahamut. State: first menu, 2000x1012
- Expected: A clean cutout.
- Observed: Enclosed near-white regions in art/characters/ffx2-bahamut/idle.png (not an approved file) glow in play.
- Repro: 2000x1012, chapter 4, first menu.
- Evidence: critic/rounds/round-09/targets/5ddfde3/crop-ch4-bahamut.png; critic/rounds/round-09/targets/5ddfde3/src-ffx2-bahamut-idle.jpg
- Confidence: high
- Requirement: RUBRIC §6 visual craft
- Smallest fix: Re-matte the enclosed background regions of the Bahamut states; Bailey owns any art pick.
- Acceptance check: No near-white enclosed regions in the idle's alpha, no glowing blotches in play.
- Merged from: visual R09b-VIS-04

### 57. PR-0138 (polish, prep)

**A chained chapter's results show only the last battle's spoils, so chapter 5 ends a 39-minute, five-battle route on "EXP 0 · GIL 0"**

- Game: both (FFX-2 ch5 observed; FFX ch3 and FFX-2 ch6 also chain). Chapter: ffx2-vegnagun-shuyin (observed). State: results after a chain win
- Expected: The spoils of every battle fought, totalled or per link.
- Observed: "EXP 0 ×3 PARTY · AP 20 PER DRESSPHERE · GIL 0" (the final battle's row) where earlier parts carry EXP 5,000-8,000 and 3,000 gil each. Same text on live in round 08.
- Repro: Seed 1, 1600x900, Wait: win chapter 5 through all five links to results.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-vegnagun-shuyin-win/31-results.png; critic/rounds/round-08/evidence/win-ffx2-vegnagun-shuyin/run.json (live, same)
- Confidence: high for chapter 5
- Requirement: RUBRIC §6 prep (understandable results and rewards); research/ffx2-vegnagun-shuyin.md per-battle rows
- Smallest fix: Accumulate each link's spoils in runEncounterChain (src/app/screens/BattleEncounterChain.ts:122-126, suspected) and pass the sum or a per-link list to results.
- Acceptance check: After a real-input chapter 5 win the results equal the sum of the five links' sourced values; chapters 1, 2 and 4 unchanged.
- Merged from: prep-delivery (new)

### 58. PR-0139 (polish, interface)

**The intent panel keeps naming a KO'd enemy for up to 4.5 s ("ORMI ACTS NEXT Concussive Blast" after Ormi falls)**

- Game: FFX-2 as observed (shared panel). Chapter: ffx2-leblanc Act III, Ormi killed first. State: battle after a KO
- Expected: A KO'd combatant is dropped from the read-out within a frame.
- Observed: 0 to 4.5 s after Ormi's KO the panel still reads "ORMI ACTS NEXT Concussive Blast" with damage ranges.
- Repro: Chapter 6 Act III with Ormi targeted first (the gap pass used an injected retarget wrapper).
- Evidence: critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/20-after-ormi-ko-0..3.png; critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/run.json
- Confidence: medium
- Requirement: Honest intent (RUBRIC §2)
- Smallest fix: Recompute the intent on ko events and skip combatants at 0 HP.
- Acceptance check: Within one frame of Ormi's KO the panel names Leblanc or Logos.
- Merged from: gap capture (second half of its intent issue)

### 59. PR-0140 (polish, process)

**Commit 0bd85cc states no game case (CHK-021)**

- Game: both (FFX ch7 data, FFX-2 ch6 meta, shared results layout). Chapter: 6, 7, 8. State: git history
- Expected: Every change records FFX only / FFX-2 only / both with its source.
- Observed: "Chapters 6 to 8: pause hero art paths, Seymour's sprite key, results drop list fits four drops" has no case line and no handoff references it.
- Repro: git log -1 --format=%B 0bd85cc
- Evidence: git history (D:/pyrefly-release at 5ddfde3)
- Confidence: high
- Requirement: AGENTS.md rule 14; CHK-021
- Smallest fix: Add the per-part case (Seymour spriteKey FFX only; Leblanc heroArt FFX-2 only; results layout both) to the chapter handoffs.
- Acceptance check: A handoff line names 0bd85cc and its three cases.
- Merged from: combat-encounter

### 60. PR-0141 (polish, process)

**critic-plan --json omits chapter 6 from the chapters this review owes**

- Game: FFX-2 only. Chapter: ffx2-leblanc. State: review planning
- Expected: The plan lists every registered, unlocked chapter the change set touches.
- Observed: node tools/critic-plan.mjs --json on 5ddfde3 lists five chapters and omits ffx2-leblanc, the main change of the release. This review covered chapter 6 anyway.
- Repro: cd D:/pyrefly-release && node tools/critic-plan.mjs --json
- Evidence: critic/rounds/round-09/chief-5ddfde3/plan.json
- Confidence: high
- Requirement: RUBRIC §4 (the plan is the coverage this review owes)
- Smallest fix: Derive the plan's chapter list from the registry (encounters.ts minus LOCKED_CHAPTER_IDS).
- Acceptance check: The plan output includes ffx2-leblanc for this change set.
- Merged from: combat-encounter

### 61. PR-0084 (polish, delivery)

**Entering a battle takes 7.7 seconds from the chapter card on the live build, against the five-second loading goal**

- Game: both. Chapter: seymour-flux (measured). State: chapter select to the battle screen, live build, warm cache, GPU
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: A player reaches the fight inside the stated budget.
- Observed: ON 5ddfde3: Now measured on 5ddfde3 (RTX 5070 Ti, ANGLE D3D11, driver not read): title 149/127 ms cold/warm, title to board 1.56/1.10 s, card to first menu 10.1/9.7 s (ch1) and 10.8/10.3 s (ch6) with scene skips injected; 60 fps with p99 16.8 ms at both first menus. Throttled to 50 Mbps: card to first menu 20.5 s cold and 18.3 s warm (warm no faster: the ~94 MB of media is not served from cache on the local preview; unverified on Pages). About 52 MB loads before the board.
- Repro: critic/rounds/round-08/verify.mjs against the live URL with PYREFLY_BROWSER=gpu.
- Evidence: critic/rounds/round-09/evidence/gaps/timing/seymour-flux-5ddfde3.json; critic/rounds/round-09/evidence/gaps/timing/ffx2-leblanc-5ddfde3.json; critic/rounds/round-09/evidence/gaps/timing/seymour-flux-50mbps-5ddfde3.json; critic/rounds/round-08/evidence/verify-and-perf.json
- Confidence: high — one named machine, one measurement; not repeated on a cold cache or another machine
- Requirement: RUBRIC section 2 platform goals: 60 fps at 1600x900 and a load under five seconds, measured on named hardware.
- Smallest fix: Measure the split between asset fetch, scene build and the battle-entry beat (PR-0061 needs the same instrumentation), then move whatever is not needed for the first frame behind it.
- Acceptance check: Chapter card to the first interactive command menu is under five seconds on the named hardware, cold and warm, in all five chapters.
- Repair attempts so far: 0

### 62. PR-0121 (polish, visual)

**At 3840x2160 the pause plate stops at 3380x1931 and leaves black bands**

- Game: both. Chapter: all. State: 
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Full-bleed at every size (CHK-002).
- Observed: ON 5ddfde3: Re-observed at 3840x2160 on 5ddfde3: the pause img is drawn at 3380x1931 from (-10,-5), leaving about 470 px dark on the right and 235 px at the bottom; live is identical. The gap pass rated it major; kept at polish (a rare resolution, pre-existing, not a regression).
- Repro: node gaps/firstmenu.mjs seymour-flux 3840x2160 pause
- Evidence: critic/rounds/round-09/evidence/gaps/firstmenu/seymour-flux-3840x2160-5ddfde3-04-pause-small.jpg; critic/rounds/round-09/evidence/gaps/firstmenu/seymour-flux-3840x2160-live.json; evidence/gaps/firstmenu/seymour-flux-3840x2160-04-pause-small.jpg; live: firstmenu-live/seymour-flux-3840x2160.json
- Confidence: high
- Requirement: CHK-002
- Smallest fix: Remove the plate's maximum size cap (it looks like it is the 2x master width) and let object-fit: cover scale it.
- Acceptance check: At 3840x2160 the img rect covers 0,0 to 3840,2160.

### 63. PR-0117 (polish, interface)

**on a phone, Chapter 6's pause prints the three-line chapter eyebrow over the GARMENT GRID row**

- Game: FFX-2. Chapter: ffx2-leblanc, pause at 390x844. State: 
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: No text collision (the phone frame of the Until Dawn sheet).
- Observed: ON 5ddfde3: Re-observed on the phone pause: the chapter heading overlaps the GARMENT GRID stat row.
- Repro: 390x844, chapter 6, Esc from the first menu.
- Evidence: critic/rounds/round-09/evidence/gaps/phone/ffx2-leblanc-5ddfde3-02-options-row*.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-look-phone/14-pause-Esc.png
- Confidence: high
- Requirement: CHK-003/CHK-009 (interface; cross-reference only)
- Smallest fix: Stack the eyebrow below the FFX-2 meter rows, or clamp it to two lines.
- Acceptance check: A phone pause capture in chapter 6 shows no overlapping text boxes.

### 64. PR-0103 (polish, narrative)

**Two Act III KO beats assume Logos falls before Ormi: kill Ormi first and a KO'd Ormi shouts, and Paine calls for the already-dead Ormi**

- Game: FFX-2 only. Chapter: ffx2-leblanc, Act III. State: battle, mid-battle beats logos-down / ormi-down
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Beats that name the living or the dead stay true in either kill order (research section 5.4 treats both orders as live options).
- Observed: ON 5ddfde3: Exercised on 5ddfde3 with Ormi forced first (injected retarget): Ormi's KO bark "Boss... I held the door." and Leblanc's "You did, lamb. Badly. But you did." play, the run reaches results with no stall. Whether the remaining beats read correctly in that order was not settled; left open.
- Repro: Chapter 6, Act III: focus Ormi until KO, then KO Logos, and read the beat.
- Evidence: critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/run.json; src/story/scripts/ffx2-leblanc.ts (mid 'logos-down' / 'ormi-down', midScripts) @ e119552; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/battle-log.json
- Confidence: medium-high (the logic is certain from the source; the branch is not captured)
- Requirement: RUBRIC section 6 narrative (faithful beats, character voice); round 07 PR-0037 is the same class (speakers who are not on the field).
- Smallest fix: Give 'logos-down' an Ormi-already-down variant (Leblanc alone), or split the trigger with a condition on Ormi's state.
- Acceptance check: Kill Ormi first and then Logos: no KO'd speaker talks, and no line names a dead target as next.

### 65. PR-0104 (polish, feel)

**Under Wait's whole-menu hold, a confirmed command does not visibly resolve before the next girl's menu opens (known; the faithful split is deferred by Bailey)**

- Game: FFX-2 only. Chapter: ffx2-leblanc (observed); same mechanism in chapters 4 and 5. State: battle: Yuna confirms Grenade, then Paine's menu opens
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: research/ffx2-combat-core.md section 1.5: time runs at the top-level command window and freezes only in a submenu. The deferred D-029 item 2 would restore that.
- Observed: ON 5ddfde3: Re-observed on 5ddfde3 (Wait): Yuna freezes in her throw pose from 0.31 s; Paine's menu is up by 0.57 s and through 2.31 s no HP bar moves and no number lands.
- Repro: Chapter 6, Wait (default), 1600x900; confirm an Item for the first girl and watch the next menu.
- Evidence: critic/rounds/round-09/feel-narrative-5ddfde3/ffx2-leblanc-win_seq-party-action.jpg; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/seq-party-action/; critic/rounds/round-09/feel-narrative/lb-party-29.jpg
- Confidence: high on the observation; the cause is suspected to be clockHeldByMenu (src/battle/ffx2/active.ts:53-54, the whole-menu hold)
- Requirement: RUBRIC section 6 feel: action and reaction timing. An approved adaptation (D-029 follow-up 2, deferred) that does not erase the observed usability cost.
- Smallest fix: None in this release (Bailey deferred it). Build the faithful top-level/submenu split in the next release, as decided.
- Acceptance check: In Wait, a confirmed command's damage appears while the next girl's top-level menu is open, and time still freezes inside a submenu.

### 66. PR-0102 (polish, narrative)

**Leblanc's line 'I had the *better* half, dearie.' will print its asterisks literally**

- Game: FFX-2 only. Chapter: ffx2-leblanc, post-battle scene, beat 13. State: cutscene after CONFIRM on the victory results
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The emphasis reads as emphasis (or the line reads without markup), as in every other shipped line.
- Observed: ON 5ddfde3: Script unchanged; "*better*" is at line 260.
- Repro: Win chapter 6, CONFIRM, and tap Enter line by line to Leblanc's fourth post-battle line.
- Evidence: src/story/scripts/ffx2-leblanc.ts:260; src/story/scripts/ffx2-leblanc.ts:260; src/ui/common/DialogueBox.ts:364; critic/rounds/round-09/evidence/gaps/ffx2-leblanc-flow-1600x900/run.json (post[])
- Confidence: high (traced and seen in the on-screen text)
- Requirement: CHK-007 (player-facing copy); RUBRIC section 6 narrative.
- Smallest fix: Drop the asterisks ('I had the better half, dearie.'), or add emphasis support to DialogueBox for both games.
- Acceptance check: A capture of that line shows no asterisk characters.

### 67. PR-0109 (polish, prep)

**Chapter select forgets the chapter you were on: backing out of prep, or returning after a clear, puts the cursor back on Chapter I**

- Game: both. Chapter: chapter select (all chapters; most costly for Chapter VI). State: src/app/screens/ChapterSelectScreen.ts:91 (initialIndex ?? 0) with src/ui/common/registerFlowScreens.ts:42 constructing ChapterSelectScreen() with no initialIndex; unchanged since before live 1b33971
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: After Esc from Chapter VI prep, or after a Chapter VI result, the board cursor stays on Chapter VI so another attempt is one Enter away
- Observed: ON 5ddfde3: Re-observed: cardAfterBack "seymour-flux" in all 14 runs; boardAfter and boardAfterReload select seymour-flux after clears of ch2, ch4, ch5 and ch6.
- Repro: Board -> ArrowRight x5 to Leblanc -> Enter -> Esc in prep: the selected card is Seymour Flux.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/*/run.json (cardAfterBack, boardAfter); critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/run.json (cardAfterBack, boardAfter)
- Confidence: high
- Requirement: prep: fast retry and replay
- Smallest fix: Keep the last confirmed chapter id in the flow and pass its tile index as initialIndex when the board is rebuilt.
- Acceptance check: Real keys: Esc from ch.6 prep -> board selectedId 'ffx2-leblanc'; after a ch.6 result -> CONFIRM/CHAPTER SELECT -> selectedId 'ffx2-leblanc'.

### 68. PR-0110 (polish, interface)

**the advisor's 'N HIDE MOVES' chip paints over the FFX-2 first-turn coach line**

- Game: FFX-2 only. Chapter: ffx2-leblanc (on top, 1600x900); ffx2-bahamut (ghosted beneath, 2000x1012). State: first FFX-2 command menu with the coach mark up
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The coach line is legible and nothing is drawn across it.
- Observed: ON 5ddfde3: Re-observed at 1600x900 and 2000x1012.
- Repro: Fresh profile, Chapter 6 at 1600x900 (or 4 at 2000x1012), first command menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/10-first-menu-coach.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/10-first-menu-coach.png; ffx2-bahamut-win/10-first-menu-coach.png; live baseline critic/rounds/round-08/evidence/foc/ffx2-bahamut-2000x1012-first-turn.png
- Confidence: high
- Requirement: CHK-008 / CHK-006 class; the first-turn coach (tile C3).
- Smallest fix: While the coach mark hides the advisor card, hide the card's N toggle with it, or dock the toggle outside the coach rect.
- Acceptance check: At 1600x900, 2000x1012 and 390x844 in Chapters 4 and 6, the N chip does not intersect the coach mark while it is up.

### 69. PR-0111 (polish, interface)

**in Chapter 6 the collapsed strategy guide card is empty, only its title and MORE**

- Game: FFX-2 (seen in ch.6 with three enemy HP bars). Chapter: ffx2-leblanc. State: guide card, left rail, 1600x900
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The collapsed card shows its NEXT line, as it does in Chapters 4 and 5.
- Observed: ON 5ddfde3: Re-observed in the chapter 6 first frame and at 4:3.
- Repro: 1600x900, Chapter 6, first command menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/11-advisor.png; ffx2-vegnagun-shuyin-win/11-advisor.png (one bar: body visible)
- Confidence: medium (cause suspected)
- Requirement: RUBRIC section 6, interface: readable information; CHK-009.
- Smallest fix: Budget the guide card's height after the enemy header, or collapse the header to one line for three or more bars.
- Acceptance check: In Chapter 6 at 1600x900 and 2000x1012 the collapsed guide shows its NEXT move line.

### 70. PR-0112 (polish, interface)

**the FFX-2 pause CHAPTER tab truncates objectives, labels and captions mid-word**

- Game: FFX-2 (FFX not captured). Chapter: ffx2-leblanc, ffx2-bahamut. State: pause CHAPTER tab, 1600x900
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Objectives and labels in full (CHK-009).
- Observed: ON 5ddfde3: Widened: OPTIONS labels "MASTER VOL...", "SOUND EFFE...", "STRATEGY GU..." at 1280x960 and "MASTER VOLUM..." on the phone.
- Repro: 1600x900, Esc at the first menu, then arrows to CHAPTER.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-4x3/14-pause-options.png; critic/rounds/round-09/evidence/e119552/pause/ffx2-leblanc-chapter-tab.png; pause/ffx2-bahamut-chapter-tab.png
- Confidence: high
- Requirement: CHK-009.
- Smallest fix: Let the objective and label cells wrap (the column has vertical room), or widen the encounter column.
- Acceptance check: scrollWidth <= clientWidth + 1 for every label in the tab at 1280 and 3840, in both games.

### 71. PR-0113 (polish, interface)

**the phone chapter board runs the party names together and slides BEST under the hint bar**

- Game: both. Chapter: chapter select at 390x844. State: dossier PARTY and BEST
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Names spaced under each portrait, as on the round-07 phone board; the BEST value visible.
- Observed: ON 5ddfde3: Re-observed ("YUNARIKKUPAINE").
- Repro: 390x844, fresh profile, Chapter 1 or 6 selected.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/03-card.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-look-phone/03-card.png; seymour-flux-look-phone/03-card.png; baseline critic/rounds/round-07/evidence/gaps/board/phone-00-top.png
- Confidence: high
- Requirement: CHK-009; PR-0066/PR-0067 area.
- Smallest fix: Size the name cell to the portrait's width, with a minimum gap, and pad the dossier bottom by the hint bar's height.
- Acceptance check: At 390x844, no party name box intersects its neighbour, and BEST's value is outside the hint bar's rect.

### 72. PR-0115 (polish, interface)

**P opens the pause but does not close it**

- Game: both. Chapter: all. State: battle pause
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The key that opens a pause also resumes it, or the legend names the only resume keys everywhere.
- Observed: ON 5ddfde3: Re-observed: pCloses false in all 14 runs.
- Repro: Any chapter: P, then P.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/*/run.json (pause.pCloses); run.json pause.pCloses=false in all ten runs under critic/rounds/round-09/evidence/e119552/
- Confidence: high
- Requirement: CHK-015.
- Smallest fix: Treat KeyP as resume inside PauseScreen, the way the BattleScreen listener treats it as open.
- Acceptance check: P, then P returns to battle with the command menu intact, in both games.

### 73. PR-0116 (polish, onboarding)

**the briefing opens 'Five fights' while six chapters are playable (question for Bailey: the words are his, tile C1)**

- Game: both (shared briefing). Chapter: first launch. State: Auron's briefing
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The count matches the board, or the line avoids a number.
- Observed: ON 5ddfde3: Unchanged, awaiting Bailey.
- Repro: Fresh profile, Enter on the title.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/01-briefing.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/01-briefing.png; ffx2-leblanc-win/run.json boardAtEntry (tiles 8)
- Confidence: high
- Requirement: RUBRIC section 6, onboarding.
- Smallest fix: Ask Bailey whether to change the number or drop it. Build nothing without his yes (rule 9).
- Acceptance check: The briefing matches whatever Bailey approves.

### 74. PR-0118 (polish, interface)

**Pausing over a cutscene leaves the dialogue card and the scene eyebrow drawn over the pause, and the two headers collide (chapters 1, 4, 6)**

- Game: both (ch.1, ch.4 and ch.6 observed). Chapter: all chapters' pre-battle scenes. State: Esc pressed during a cutscene
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: CHK-002: the full-screen pause owns the window.
- Observed: ON 5ddfde3: Re-observed in chapter 6 (05b-scene-esc).
- Repro: Any chapter: at the first scene line, press Esc and wait 1.1 s.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/05b-scene-esc.png; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/{seymour-flux-win,ffx2-bahamut-win,ffx2-leblanc-win}/05b-scene-esc.png; critic/rounds/round-09/feel-narrative/esc-scene.jpg, lb-scenes.jpg
- Confidence: high
- Requirement: CHK-002
- Smallest fix: Hide or lower the cutscene's dialogue layer and eyebrow while the pause is open over a scene.
- Acceptance check: Esc over a scene in both games shows no cutscene text or portrait above the pause.

### 75. PR-0099 (polish, audio)

**Chapter 6 borrows chapter 4's cues: the comedy entrance plays under 'The machine under the cathedral' and the Syndicate fight under Bahamut's aeon theme; no cue-map row exists for ch6**

- Game: ffx2. Chapter: ffx2-leblanc (ch6), pre-scene (beats 3-7, played for comedy) and battle. State: src/data/encounters.ts:316-346 (FFX2_LEBLANC.music, a documented fallback); src/story/scripts/ffx2-leblanc.ts:175-178, 232-235
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: docs/audio/THEMES.md gives every chapter moment a cue whose 'one emotion' fits it. The massage and Brother comedy (writing-bible §9.2, beat 5) should not sit under row 13's 'The machine under the cathedral' (G minor, HYMN_POISONED).
- Observed: ON 5ddfde3: Re-observed: ch6 requests scene-bevelle-underground and boss-ffx2-aeon (both gain 1); the post-scene uses scene-farplane.
- Repro: Seed 1, ch6 real flow (title > select > prep > pre-scene > battle), 1600x900; see network-media.json.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/network-media.json; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/network-media.json; docs/audio/THEMES.md cue map rows 13 and 17
- Confidence: medium: judged from the documented intent of each cue; no agent can hear
- Requirement: docs/audio/THEMES.md cue map ('the one emotion'), CHK-001 right cue at the real moment; AGENTS.md rule 10 (new content needs Bailey's yes)
- Smallest fix: Disclose it in the release note. Add 'borrowed, pending' rows for ch6 to the THEMES.md cue map. Offer Bailey 2-3 short audio sketches for a Chateau Leblanc scene cue and boss cue (end state first), and build nothing until he picks.
- Acceptance check: THEMES.md has ch6 rows. themes-audit covers the ch6 cues. Bailey's pick is recorded in docs/audio/OWNER-VERDICT.md or decisions.json.

### 76. PR-0100 (polish, audio)

**47 audition candidate files (27 MB) ship in the build under audio/candidates, and qa.mjs --strict exits 1 on them**

- Game: both. Chapter: n/a (artifact hygiene). State: public/audio/candidates/ (commits b789047, 6e8a144, 667904b, 2026-09-22); linked only from docs/audio/audition.html
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Only manifest cues ship. The strict audio gate (CHK-001 step 1) is green, and shipped audio stays within qa's 60 MB budget.
- Observed: ON 5ddfde3: Unchanged: qa.mjs --strict exits 1 on 47 orphans (27.5 MB) under audio/candidates; shipped audio about 62.4 MB against the 60 MB budget.
- Repro: cd D:/pyrefly-release && node tools/audio/qa.mjs --strict; echo $? (prints 1); ls dist-gate/audio/candidates | wc -l (prints 47)
- Evidence: critic/rounds/round-09/audio/qa-5ddfde3.txt; D:/Final Fantasy/critic/rounds/round-09/audio/qa-strict.json
- Confidence: high
- Requirement: CHK-001 step 1 (qa --strict green), CHK-017 artifact contents
- Smallest fix: Move public/audio/candidates to docs/audio/audition/candidates and update the relative links in docs/audio/audition.html (its generator, audition-round1.mjs), or exclude audio/candidates from the build copy.
- Acceptance check: qa.mjs --strict exits 0, and a fresh vite build has no audio/candidates directory.

### 77. PR-0039 (polish, audio)

**Three shipped cues depart from the THEMES bible: no tempo map on scene-gagazet, scene-dreams-end and scene-farplane, FAREWELL_RISE absent from scene-dreams-end, scene-farplane in E minor against the map's E major (carried, widened)**

- Game: both - scene-gagazet and scene-dreams-end are FFX cues, scene-farplane is FFX-2; the cause is shared renderer plumbing. Chapter: the pre-battle scenes of chapters 1, 3 and 5. State: shipped audio
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: docs/audio/THEMES.md's renderer request #1: a lyrical cue carries a tempo map so rubato can move the pulse, or it is listed in TEMPO_MAP_EXEMPT with a stated reason.
- Observed: ON 5ddfde3: Unchanged: themes-audit reports 3 of 21 cues departing from the bible.
- Repro: Run the command above in D:/pyrefly-release.
- Evidence: critic/rounds/round-09/audio/themes-audit-5ddfde3.txt; D:/Final Fantasy/critic/rounds/round-09/audio/themes-audit.json
- Confidence: high on the technical finding; whether it matters musically is Bailey's ear (CHK-B1)
- Requirement: docs/audio/THEMES.md.
- Smallest fix: Implement THEMES.md's requested Track.tempo?: Array<[beat, bpm]> with linear interpolation and give these three a written tempo curve; or, if an arranger judges a static pulse acceptable for one of them, add it to TEMPO_MAP_EXEMPT with a reason as boss-dread and scene-bevelle-underground already are.
- Acceptance check: themes-audit reports no tempo-map failure across the 21 cues, and Bailey signs off the re-rendered cues in an audition tour.
- Repair attempts so far: 0

### 78. PR-0074 (polish, interface)

**The advisor's composed explanation repeats itself and produces broken English (widened)**

- Game: both. Chapter: seymour-flux; ffx2-leblanc. State: advisor card explanation
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: One clean sentence per card.
- Observed: ON 5ddfde3: Re-observed: "It finishes Dr. Goon, and 1207 damage."; ch1 "Speeds the party's turns up · inflicts Haste" then "It puts Haste on the party".
- Repro: 2000x1012, Chapter 1 first menu; 1600x900, Chapter 6 first menu.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/run.json (advisorText); critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win-look-21x9/11-advisor.png; critic/rounds/round-09/evidence/e119552/seymour-flux-look-wide/10-first-menu-coach.png; ffx2-leblanc-win/11-advisor.png
- Confidence: high (grammar); low ('3 HITS' meaning)
- Requirement: RUBRIC section 6, interface: useful advice.
- Smallest fix: Compose the effect and outcome clauses once. Write 'and about 1,207 to the others' (or similar). Label a target count as targets.
- Acceptance check: Across every advisable ability in all six chapters, no status is named twice and no clause lacks a verb.

### 79. PR-0032 (polish, onboarding)

**No text size, no key remapping, no motion or flash accommodation (carried)**

- Game: both. Chapter: pause OPTIONS. State: OPTIONS
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: At least the reduceMotion flag the game already stores is exposed as a row.
- Observed: ON 5ddfde3: Unchanged: no text size, key remapping, motion or flash row; reduceMotion and lowEffects exist in the save with no row.
- Repro: Esc, then OPTIONS in any chapter.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/14-pause-options.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-lose/run.json settingsAfterFlip; ffx2-leblanc-win/14-pause-options.png
- Confidence: high
- Requirement: RUBRIC section 6, onboarding.
- Smallest fix: As round 08 (the end state needs Bailey's pick).
- Acceptance check: As round 08.

### 80. PR-0033 (polish, onboarding)

**The defeat screen says nothing about why the party fell (carried)**

- Game: both. Chapter: ffx2-leblanc, seymour-flux, braskas-final-aeon. State: defeat results
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: An approved defeat-screen target.
- Observed: ON 5ddfde3: Re-observed on the chapter 6 defeat card.
- Repro: Lose any chapter.
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-lose/31-results.png; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-lose/31-results.png
- Confidence: high
- Requirement: RUBRIC section 6, onboarding.
- Smallest fix: End-state options to Bailey first.
- Acceptance check: As round 08.

### 81. PR-0073 (polish, onboarding)

**The title offers exactly one pointer target, labelled PRESS ENTER, with keyboard-only hints — a touch player is never invited to tap**

- Game: both. Chapter: title. State: title, fresh profile, 390x844 and 1600x900
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: A touch player is told, in words or by an affordance, how to start.
- Observed: ON 5ddfde3: Re-observed: every phone briefing, board and scene hint names a key.
- Repro: Fresh profile at 390x844 with touch emulation; tap the chip (works) and tap elsewhere (nothing).
- Evidence: critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/01-briefing.png; critic/rounds/round-07/evidence/confirm/c1-title-input.json; critic/rounds/round-07/evidence/confirm/c3-phone-title.png; critic/rounds/round-07/evidence/confirm/c4-phone-after-chip-tap.png; critic/rounds/round-07/evidence/gaps/board/board-title.json titleInput (all three sizes reach chapter-select on one click); critic/rounds/round-07/evidence/gaps/title-input/390x844-after-tap.png
- Confidence: high
- Requirement: RUBRIC §2 platform goals (touch is supported); the change's own acceptance names touch.
- Smallest fix: Give the chip a pointer-aware label (or a second line) and add a pointer row to the title's ControlsHint, the way the board carries its own hints; optionally accept a pointerdown anywhere on the title root. Game case: BOTH.
- Acceptance check: At 390x844 in a touch context the title names a tap as a way to start, and a tap anywhere on the title root reaches the chapter select.
- Repair attempts so far: 0

### 82. PR-0105 (polish, combat)

**Under Active, an enemy hit keeps the chained girl's command menu open; §1.5 says the hit closes it and applies Delay, and the deviation is not recorded**

- Game: ffx2. Chapter: All FFX-2 chapters with Config = Active. State: 
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: research/ffx2-combat-core.md §1.5 [single source: Split Infinity G0913]: under Active, 'an enemy hit landing while a menu is open closes the menu and applies Delay effect' to that character. Either build that, or record the departure as an owner decision.
- Observed: ON 5ddfde3: Code unchanged e119552..5ddfde3 (git diff src/battle/ffx2 touches only formulas.ts step 20).
- Repro: Read §1.5 against src/battle/ffx2/active.ts ownsInput() (line 94) and the preflight.
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx2; git show 15385ab; docs/plans/ffx2-active-menu-review.md line 16
- Confidence: medium
- Requirement: AGENTS.md hard rule 6 / RUBRIC §2 (a departure from a source is written down, not silent)
- Smallest fix: Add a decisions.json entry that puts the §1.5 departure to Bailey, with the measured cost of each option, or implement close plus Delay under Active only.
- Acceptance check: A decisions.json entry names §1.5 and Bailey's answer, or a unit test shows an Active menu closed by an enemy hit with Delay applied.

### 83. PR-0106 (polish, combat)

**The same 'After her [N] turn' wording is read two ways in Leblanc's script, and the failsafe reading is not labelled**

- Game: ffx2. Chapter: ffx2-leblanc Act III. State: 
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: One reading of the source phrase, or the second reading labelled AUTHORED with its reason (§5.3 does not say which).
- Observed: ON 5ddfde3: Code unchanged.
- Repro: src/battle/ffx2/ai/leblanc-syndicate.ts:180 against :166; tests/unit/chapters/leblanc-engine.test.ts:256.
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx2; source trace
- Confidence: medium
- Requirement: AGENTS.md hard rule 6 (label authored readings)
- Smallest fix: Label the failsafe reading AUTHORED in the comment and the test name, or make it fire on the single turn 25+uses.
- Acceptance check: The comment and the test name the reading and its source line.

### 84. PR-0107 (polish, combat)

**Acts II and III open with every ATB gauge at zero, although they are separate battles**

- Game: ffx2. Chapter: ffx2-leblanc Acts II and III. State: 
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: §2 makes the three Chateau fights separate battles (puzzles and scenes in between). §1.6 [single source]: a normal battle starts every bar at a randomised level.
- Observed: ON 5ddfde3: Code unchanged.
- Repro: src/battle/ffx2/setup.ts:171; src/app/screens/BattleScreenSetup.ts:92; capture battle-log.json seq 0.
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx2; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/battle-log.json (first atb snapshot, all fill 0)
- Confidence: high for the behaviour; low impact
- Requirement: research §1.6
- Smallest fix: Let a group flag its link as a separate battle, so it gets 'normal' randomised gauges while keeping carried HP and MP. Chapter 6 only; the chapter 5 chain is out of scope.
- Acceptance check: Across seeds 1-20, the first actor of Acts II and III varies and opening fills are between 0 and 60% of required.

### 85. PR-0108 (polish, combat)

**The Fast-speed Sleep rule from §1.5 is neither built nor recorded as left out**

- Game: ffx2. Chapter: All FFX-2 chapters, Config ATB SPEED = FAST. State: 
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: §1.5 [single source: Split Infinity G1004]: at Fast, units put to Sleep never wake on their own. Bailey approved the row as 'fine if it's faithful'.
- Observed: ON 5ddfde3: Code unchanged.
- Repro: grep for sleep/fast in src/battle/ffx2 (no handling).
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx2; source trace
- Confidence: medium (low reachability in chapters 4-6)
- Requirement: Bailey's approval condition for the ATB SPEED row; AGENTS.md hard rule 6
- Smallest fix: Implement the rule (Sleep has no timed expiry at Fast), or record the omission as a decision.
- Acceptance check: A unit test at Fast shows Sleep persisting past its Normal-speed duration, or a decisions.json entry records the omission.

### 86. PR-0069 (polish, combat)

**The possessed-aeon mirror does not mirror affinities, although the source comment says it does**

- Game: FFX. Chapter: 3 (Braska's Final Aeon, the possessed-aeon links). State: battle setup, any possessed aeon
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: The shipped code and the comment above it describe the same behaviour.
- Observed: ON 5ddfde3: Code unchanged.
- Repro: Read src/battle/ffx/setup.ts:235-253 and src/battle/common/types.ts:2353-2372 at 8f48237.
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx; src/battle/ffx/setup.ts:235 (the comment) and :247 (c.affinities = { ...c.affinities }); src/battle/common/types.ts:2353-2372 (AeonBuild has no affinities field)
- Confidence: high for the trace; the player impact is none observed
- Requirement: AGENTS.md hard rule 6 (never invent game data) and RUBRIC §5 (a claim is matched to its proof).
- Smallest fix: Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.
- Acceptance check: The comment and the code agree, and a unit test asserts whichever behaviour is chosen for one possessed aeon.
- Repair attempts so far: 0

### 87. PR-0054 (polish, combat)

**The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference**

- Game: FFX-2. Chapter: ffx2-vegnagun-shuyin, link 2. State: the Leg's Action1 when every party member already carries the rolled status
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Each of the three Action1 branches behaves as its source line states, and anything extrapolated is marked as an inference.
- Observed: ON 5ddfde3: Code unchanged.
- Repro: Read research/ffx2-vegnagun-shuyin.md lines 708-711 against src/battle/ffx2/ai/vegnagun.ts legAction1 (lines 72-87).
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx2; research/ffx2-vegnagun-shuyin.md:708-711; src/battle/ffx2/ai/vegnagun.ts:72-87
- Confidence: High on the divergence (both texts read directly). Low player impact: reaching the state needs all three girls already Petrified.
- Requirement: AGENTS.md hard rule 6: numbers and behaviour come from research/*.md with their source notes; unsourced behaviour is left alone and said so.
- Smallest fix: Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.
- Acceptance check: The comment at src/battle/ffx2/ai/vegnagun.ts distinguishes the two sourced fallbacks from the inferred one, or a source line is cited for the Break case.
- Repair attempts so far: 0

### 88. PR-0053 (polish, combat)

**A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation**

- Game: FFX-2. Chapter: ffx2-vegnagun-shuyin. State: not consolidated
- This round: re-observed or re-measured on candidate 5ddfde3 in this round
- Expected: Every issue the round raised reaches the report with its full record.
- Observed: ON 5ddfde3: Code unchanged.
- Repro: n/a — the record is missing, not the behaviour.
- Evidence: git diff e119552 5ddfde3 -- src/battle/ffx; critic/rounds/round-06/bench/out/z06-all.txt; the combat-encounter auditor's category evidence in this report
- Confidence: UNVERIFIED as a product defect. The ID is reserved and open so it is not silently lost; recover the record from the combat auditor's evidence before any repair, and close it as withdrawn if it cannot be restated.
- Requirement: RUBRIC §8: every finding carries expected versus observed, repro, evidence and a fix. This one does not, and is recorded as a tracked gap rather than written up from guesswork.
- Smallest fix: Recover or re-derive the record before the next batch; do not repair anything on this entry alone.
- Acceptance check: The issue is either restated with expected, observed, repro and evidence, or closed as withdrawn.
- Repair attempts so far: 0

### 89. PR-0081 (polish, feel)

**Chapter 5 is 250 actions and 6:21 at FAST; the 5.15 s per action of round 08 does not reproduce (1.52 s per action on the candidate)**

- Game: FFX-2 only. Chapter: ffx2-vegnagun-shuyin. State: battle entry to victory
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: As round 08.
- Observed: Gap capture on the candidate, FAST, intended auto-player: fight 381.2 s across 5 links with 250 action-starts, 1.52 s per action, in line with other chapters (critic/rounds/round-09/evidence/gaps/ch5-fast-cand-1600x900/run.json, gaps/ch5-fast.log). The per-action cost that made this a major does not reproduce; what remains is the chapter's length, which follows its sourced HP and chain.
- Repro: As round 08, at FAST speed with the intended auto-player on the candidate.
- Evidence: critic/rounds/round-09/evidence/gaps/ch5-fast-cand-1600x900/run.json; critic/rounds/round-09/gaps/ch5-fast.log
- Confidence: medium (one run; the auto-player, not a human)
- Requirement: RUBRIC section 6 feel: dead waiting.
- Smallest fix: As round 08.
- Acceptance check: As round 08.

### 90. PR-0114 (polish, interface)

**the 'Coming' badge on the Seymour and Anima tile is overdrawn by its silhouette**

- Game: both (shared board; FFX tile). Chapter: chapter select. State: 1600x900 and 2000x1012
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Badge text fully legible.
- Observed: The silhouette darkens 'ing' of 'Coming'. Live had no silhouette on that tile.
- Repro: Open chapter select at either size.
- Evidence: critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/03-card.png; ffx2-bahamut-win/03-card.png
- Confidence: high
- Requirement: RUBRIC section 6, interface: readable names.
- Smallest fix: Draw the badge above the silhouette layer, or inset the silhouette on Coming tiles.
- Acceptance check: The badge is unobstructed on both Coming tiles at 1600x900 and 2000x1012.

### 91. PR-0119 (polish, onboarding)

**The chain coach mark covers the act-one-cleared dialogue card for about 2 s**

- Game: FFX-2 only. Chapter: ffx2-leblanc seam 1->2. State: 
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Coach marks hold off while a seam dialogue card is up.
- Observed: The 'Keep hitting the same one!' coach card sits over Rikku's speaker tag and line.
- Repro: Fresh profile; ch6 link 1 chained kills into the seam
- Evidence: evidence/gaps/ffx2-leblanc-flow-1600x900/seam-1-to-2/f005-f010.jpg (f008)
- Confidence: medium (fight played by autoBattle)
- Requirement: FOC-05; CHK-022
- Smallest fix: Suppress or queue coach marks while the story card layer is visible.
- Acceptance check: No coach-mark rect intersects the dialogue card in the seam frame sequence.

### 92. PR-0120 (polish, visual)

**Results painting stops 100 px short of the right edge at 2000x1012**

- Game: both (seen in FFX-2). Chapter: 4. State: 
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: A full-bleed painting on wide viewports
- Observed: The cream page background shows from x=1900 to x=2000 on the results screen at 2000x1012. The painting panel ends at the 16:9 stage edge.
- Repro: 2000x1012, win chapter 4, results
- Evidence: e119552/ffx2-bahamut-win/31-results.png (pixel samples x>=1900 = 244,241,232)
- Confidence: medium
- Requirement: 
- Smallest fix: Extend the portrait panel to the viewport's right edge rather than the stage's
- Acceptance check: Pixel at (1995,500) belongs to the painting at 2000x1012

### 93. PR-0026 (polish, interface)

**The Chapter 1 guide still leads with 'Haste is ctb x 8/16' (carried)**

- Game: FFX only. Chapter: seymour-flux. State: strategy guide NEXT blurb
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Plain English.
- Observed: The guideText dump contains 'Haste is ctb x 8/16 — roughly double the party's share of the clock…'.
- Repro: 1600x900, Chapter 1, first menu, G guide.
- Evidence: critic/rounds/round-09/evidence/e119552/seymour-flux-win/run.json guideText
- Confidence: high
- Requirement: CHK-007.
- Smallest fix: As round 08.
- Acceptance check: As round 08.

### 94. PR-0027 (polish, interface)

**Unrendered markdown reaches the screen: 'the target *she* last picked'**

- Game: FFX for the string; the guard is shared. Chapter: 2. State: enemy-intent panel, IF YOU ATTACK list
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Emphasis rendered, or the asterisks removed.
- Observed: The bullet prints the literal asterisks: 'Her Blind/Silence gate reads the target *she* last picked, not your attacker'. 'gate' is also engine-speak in a sentence otherwise written for players. The research citation on the same string is correctly stripped, so only the emphasis markup leaks.
- Repro: Chapter 2, first player turn, press E, 1600x900, read the second bullet.
- Evidence: critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png; src/battle/ffx/intent.ts:355
- Confidence: high
- Requirement: critic/CHECKS.md CHK-007.
- Smallest fix: Drop the asterisks and reword 'gate' to 'counter'; if emphasis is wanted, let the panel's plain() helper turn a paired asterisk run into a span, and assert no rendered intent line contains an unpaired asterisk.
- Acceptance check: A visible-text sweep of all five chapters' intent panels finds no asterisk, underscore pair or backtick, and no 'gate' meaning a counter rule.
- Repair attempts so far: 0

### 95. PR-0037 (polish, narrative)

**Mid-battle beats hard-code speakers who are not in the active formation**

- Game: FFX observed; the same shape exists in the other chapters' midScripts. Chapter: 1, beat 'first-zombie'. State: battle, story beat playing
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The characters on the field speak.
- Observed: The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.
- Repro: Chapter 1: play until a party member is Zombied and read the speaker card.
- Evidence: critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png; src/story/scripts/seymour-flux.ts:278-281; src/data/ffx/builds/gagazet.ts:424-425
- Confidence: high
- Requirement: RUBRIC section 6 narrative (character voice, reachable scenes).
- Smallest fix: Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.
- Acceptance check: Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.
- Repair attempts so far: 0

### 96. PR-0083 (polish, process)

**Four source files were pushed further past the 400-line house limit by this batch**

- Game: both. Chapter: n/a (house style). State: source tree at 1b33971
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: A batch that touches a long file leaves it shorter, or splits it.
- Observed: Reported by the combat auditor from the candidate's own diff: four files already over the limit grew further in this batch. No player effect; it is the kind of drift that makes the next engine change more expensive and it is named here so it is not rediscovered as a surprise.
- Repro: node tools/orphans.mjs is unrelated; count lines over src/battle and src/engine at 1b33971.
- Evidence: combat auditor, round 08 (the four files are named in the diff at 1b33971)
- Confidence: medium — reported, not re-counted by the chief critic
- Requirement: AGENTS.md hard rule 7 and docs/DEV.md "House rules": every source file under 400 lines.
- Smallest fix: Split the four at the next change that touches them, rather than as a separate refactor.
- Acceptance check: No file the next batch touches is over 400 lines when the batch lands.
- Repair attempts so far: 0

### 97. PR-0071 (polish, delivery)

**Two debug-API traps cost this round a day of coverage: battleLog() empties at teardown and autoBattle() silently does nothing before the first menu**

- Game: both. Chapter: all five. State: the window.__pyrefly debug API documented in docs/DEV.md
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: A documented debug hook either does what it says or says it did not.
- Observed: Two behaviours, both found the hard way and both now root-caused. (1) window.__pyrefly.battleLog() returns an EMPTY array once the battle screen is torn down: sampled after the outcome it reads [] in all five chapters (logAfterBattle 0, screen already 'results'), which is why this round's first capture pass stored "[]" for every chapter and one mandatory check could not be judged until the gap pass re-ran it. Sampled while screen() === 'battle' the same call returns the real stream (max length during the fight: ch1 37, ch2 195, ch3 238, ch4 457, ch5 211). (2) autoBattle('intended') only takes effect once awaitingMenu is already true; called on entry to 'battle' it returns true and does nothing, and a run left that way sat at ticks 0 for 300 s. Both are reviewer-facing, not player-facing.
- Repro: In the live page console: enter a battle, call __pyrefly.battleLog() during the fight and again after the results card; call __pyrefly.autoBattle('intended') immediately on entering 'battle'.
- Evidence: critic/rounds/round-07/evidence/gaps/log-ch1/run.json .. log-ch5/run.json (logSamples during the fight; logAfterBattle 0); critic/rounds/round-07/evidence/ch1..ch5/run.json (battleLogFull "[]" from the first pass); critic/rounds/round-07/evidence/guided3/run.json (70,848 characters of log, as the contrast); critic/rounds/round-07/evidence/diag/auto-seymour-flux.json; critic/rounds/round-07/evidence/win1/run.json
- Confidence: high
- Requirement: RUBRIC §5 (evidence matches the claim) and CHK-016; docs/DEV.md documents both hooks.
- Smallest fix: Keep the last battle's log readable after teardown (or make battleLog() throw once the battle is gone rather than return an empty array), and make autoBattle() either wait for the first menu or return false when it cannot take over. Then add the sentence to docs/DEV.md. Game case: BOTH — shared debug API.
- Acceptance check: A capture that calls battleLog() after the results card either gets the fight's events or an error, never a silent empty array; autoBattle() called on entry to a battle drives it or reports that it did not.
- Repair attempts so far: 0

### 98. PR-0034 (polish, visual)

**The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow**

- Game: FFX. Chapter: 1 (Mt. Gagazet). State: battle versus the pre-battle scene, 1600x900
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The moonlit canyon of the approved tile.
- Observed: The shipped gagazet.png is byte-identical to the approved copy and renders faithfully under the pre-battle scene camera, where the composite is a close match. Under the battle camera the same painting is darkened and desaturated to a flat navy wall: the moon and the lit snow floor are gone, and a backdrop-only patch measures mean luminance 70 against the source painting's 114, so the arena reads as a dark cave.
- Repro: Capture Chapter 1's pre-battle scene and its battle at 1600x900 and pair both with docs/screenshots/concept-gagazet.png.
- Evidence: critic/rounds/round-04/targets/presentation-dialogue.jpg (scene camera, faithful); targets/scene-ch1-gagazet.jpg (battle camera, flattened)
- Confidence: high for Chapter 1, the only scene with the same painting under both cameras
- Requirement: The approved scene tile 'Ch.1 Mt. Gagazet'; CHK-013 judges art inside the running game.
- Smallest fix: Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.
- Acceptance check: Re-pair the tile from a battle frame: the moon and the lit snow are present and the backdrop patch's mean luminance is within about 10 percent of the source painting's.
- Repair attempts so far: 0

### 99. PR-0036 (polish, visual)

**The FFX-2 party crowds the left third of the stage while two thirds of it is empty**

- Game: FFX-2. Chapter: 4. State: battle staging, 1600x900
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: A composition comparable to the FFX chapters, which stage their party noticeably larger and further apart.
- Observed: Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.
- Repro: Chapter 4, first ATB turn, 1600x900.
- Evidence: critic/rounds/round-04/evidence/shots/ffx2-bahamut-04-enemy-intent.png, ffx2-bahamut-03-battle-menu.png
- Confidence: high
- Requirement: RUBRIC section 6 visual (composition, staging, ground contact).
- Smallest fix: Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.
- Acceptance check: Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.
- Repair attempts so far: 0

### 100. PR-0028 (polish, interface)

**H does not hide the panels it is labelled for during battle**

- Game: both. Chapter: 1 to 5. State: battle, after pressing H, 1600x900
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Either H hides every optional panel in battle, or its legend says what it actually hides.
- Observed: In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.
- Repro: Any chapter, battle, press H, 1600x900; then Esc and press H on the pause screen and compare.
- Evidence: critic/rounds/round-04/evidence/shots/ch1-07-hide-panels.png, ffx2-bahamut-04-hide-panels.png, ffx2-vegnagun-shuyin-04-hide-panels.png; gaps/g-ch1-backdrop-panels-off.png
- Confidence: medium - the observation is certain; whether the narrower scope is intended is not stated anywhere
- Requirement: RUBRIC section 6 interface (pause and prep usability, cleanup); it also blocks CHK-013's scene-tile evidence.
- Smallest fix: Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.
- Acceptance check: Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.
- Repair attempts so far: 0

### 101. PR-0029 (polish, interface)

**Yu Pagoda A and B carry no always-on field marker**

- Game: FFX. Chapter: 3, battle 1 of 7. State: battle, first player turn, 1600x900
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The CTB's A and B can be mapped to the painted enemies without opening the picker.
- Observed: The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter. PARTIALLY ANSWERED THIS ROUND: the Chapter 3 CTB column does letter the two pagodas A and B and the target chip carries the letter, but there is still no always-on marker on the field itself.
- Repro: Chapter 3, first player turn, 1600x900: compare the CTB tiles with the field.
- Evidence: critic/rounds/round-04/evidence/shots/braskas-final-aeon-03-battle-menu.png; crops/ch3-pagodas.png
- Confidence: high
- Requirement: critic/CHECKS.md CHK-011 (every targetable enemy has an always-on marker).
- Smallest fix: Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.
- Acceptance check: In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.
- Repair attempts so far: 0

### 102. PR-0041 (polish, interface)

**FFX-2 items were unreachable through the command menu for 17 and 12 consecutive turns in the review's harness**

- Game: FFX-2. Chapter: 4 and 5. State: battle, ITEM submenu
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The ITEM row opens its submenu and a Potion or Phoenix Down can be used, as it can in FFX.
- Observed: logs/ffx2-bahamut-run.log records 'revive with a Phoenix Down failed (unreachable); rows=ATTACK|SKILL|CHANGE|ITEM' on every turn from 22 to 38, and ffx2-vegnagun-shuyin-run.log records 'heal with a potion failed (unreachable)' on every turn from 3 to 13. The ITEM row is present in both. In FFX the same harness used Potion, Hi-Potion, X-Potion, Phoenix Down and Eye Drops successfully. The asymmetry is what makes it worth checking rather than dismissing.
- Repro: Not reproduced by hand. Open Chapter 4's ITEM submenu with real arrow keys and try to use a Phoenix Down.
- Evidence: critic/rounds/round-04/evidence/logs/ffx2-bahamut-run.log, ffx2-vegnagun-shuyin-run.log, yunalesca-eventlog.json
- Confidence: low - a harness observation with a plausible harness explanation
- Requirement: CHK-015 (a player-facing behaviour is proved with the player's own input) and CHK-020.
- Smallest fix: None proposed until reproduced by hand. Reproduce with real arrow keys first; if the submenu does open for a human, fix the harness and say so.
- Acceptance check: A hand or scripted real-key run uses an item from the FFX-2 ITEM submenu in both FFX-2 chapters, or the defect is reproduced and traced.
- Repair attempts so far: 0

### 103. PR-0062 (polish, process)

**The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody**

- Game: FFX-2. Chapter: ffx2-vegnagun-shuyin, link 2. State: the reviewer's own instrumentation, not the product
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: A seed that makes the bench land Berserk makes the shipped chapter land it, so the player-facing half of PR-0052 can be captured.
- Observed: Two facts block that capture and both belong in the record. (1) z06-passes and z06-berserk construct an isolated vegnagun-leg battle with engine.setSeed(n), while in shipped play each link is seeded from the chapter run (docs/DEV.md: engines are seeded per battle via BattleSetup.seed), so __pyrefly.setSeed(13) before chapter 5 is not the bench's seed 13. The seed-finder confirms the bench-side hits (seeds 3, 13, 27, 36, 38 put Yuna in White Mage under Berserk, earliest at turn 8) but they address the fixture, not the game. (2) Twenty in-game seeds (1-20) were swept, skipping link 1 and watching link 2 at normal speed, polling battleState about every 300 ms. The Leg link was reached in all 20 runs and Berserk was applied to nobody in any of them, although the AI path is live (src/battle/ffx2/ai/vegnagun.ts:72-87 rolls 1-in-3 Berserk / Break / Slow, and Slow was observed landing on Yuna on link 2 in a diagnostic run) and the bench predicts Berserk on a party member in about 6 of 24 isolated Leg battles. A false hypothesis was chased and discarded: legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", but re-running z06-legai proves the unprefixed ids do fire (19 leg-berserk casts over 24 seeds), so there is no id-resolution bug.
- Repro: critic/rounds/round-06/gap-berserk.mjs and gap-berserk2.mjs (in-game sweep); critic/rounds/round-06/bench/z06-gap-seeds.test.ts (seed finder).
- Evidence: critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep2.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-seed13.json; critic/rounds/round-06/bench/out/z06-gap-seeds.txt
- Confidence: High on both measurements. The discrepancy between 6-in-24 predicted and 0-in-20 observed is unexplained and is the thing to reconcile; it may be the harness's sampling, the chapter seeding, or a real difference between the fixture and the shipped link.
- Requirement: RUBRIC §5: match proof to the claim — a seeded engine fixture cannot stand in for the shipped seeding.
- Smallest fix: Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.
- Acceptance check: A named seed makes the shipped chapter 5 link 2 land Berserk on Yuna in White Mage, and the resulting turn is captured at 1600x900.
- Repair attempts so far: 0

### 104. PR-0044 (suggestion, visual)

**16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them**

- Game: both (15 of the 16 are FFX-2 dresspheres). Chapter: n/a. State: public/art/manifest.json
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: Every subject declares its facing so the sign assertion can run per chapter formation.
- Observed: paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.
- Repro: Read D:/pyrefly-release/public/art/manifest.json.
- Evidence: D:/pyrefly-release/public/art/manifest.json
- Confidence: high
- Requirement: critic/CHECKS.md CHK-014.
- Smallest fix: Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.
- Acceptance check: Every manifest subject carries a facing and the per-formation sign assertion runs green.
- Repair attempts so far: 0

### 105. PR-0072 (suggestion, visual)

**Vegnagun has no ground contact and Paine stands inside its cannon barrel**

- Game: FFX-2. Chapter: 5 (Vegnagun and Shuyin). State: battle, first command frame, 1600x900
- This round: NOT re-examined on 5ddfde3: carried with its round-09 (e119552) record; no reviewer this round looked at it, so it stays open and unverified here
- Expected: The boss is planted on the Farplane floor with the same contact treatment the party actors get, and clearly behind the party in depth.
- Observed: Two of the three things reported during this round hold and one does not. Vegnagun's underside ends in a hard edge above the plain with no cast shadow or contact pool, while all three girls sit on visible contact rings; and Paine's billboard intersects the green cannon barrel so she reads as embedded in the machine rather than standing in front of it. The third claim, that Vegnagun is undersized and reads as a prop, is NOT supported by the capture: it dominates the frame horizontally and stands well above the party. Filed as a suggestion rather than a defect because the approved tile does not settle the depth staging and Bailey has not reacted to this frame.
- Repro: Chapter V from the board with real keys, Enter through the scene, capture the first command menu at 1600x900.
- Evidence: critic/rounds/round-07/evidence/ch5/04-first-menu.png; critic/rounds/round-07/targets/fight-targeting-s3.jpg
- Confidence: high for the ground contact and the overlap; the scale claim is refuted
- Requirement: CHK-014 (contact fits the shot); RUBRIC §6 visual (ground contact).
- Smallest fix: Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.
- Acceptance check: At 1600x900 a contact shadow is visible beneath Vegnagun and no party billboard intersects it, on the first command frame and at target selection.
- Repair attempts so far: 0

## Resolved and verified on this candidate

- **PR-0085**: FIXED. "npx vite build --outDir dist-gate --emptyOutDir" exits 0 in 1.1 s on 5ddfde3 (57524be; f461f2a gates every stylesheet on lightningcss), the cut's build smoke passed, and the artifact manifest reproduces d125357b... twice with 0 differing files. Evidence: critic/rounds/round-09/evidence/5ddfde3/build/vite-build.log; critic/rounds/round-09/prep-delivery-scratch/manifest-recheck-5ddfde3.json.
- **PR-0091**: FIXED. Advisor card against the party rows: overlapPx2 0 at every seam (ch6 links 2-3, ch5 links 2-5) and at the first menus. Trade-off as disclosed (move, target, pick and submenu at the ch5 seams); the wider path loss in chapter 5 is filed separately as PR-0126 (suspected side effect of 0ff00f2). Evidence: index.json pr0091; 24-seam-*-first-menu.png.
- **PR-0089**: FIXED. audioDebug slot gains in 14 real-input runs: the intended cue at gain 1 at every pre-scene and first menu, seams holding at +1.5 and +3 s, victory cues at gain 1, no lingering select waltz, pause cue in and out within 0.75 s. Residual false start filed as PR-0129 (polish). Evidence: critic/rounds/round-09/audio/slots-5ddfde3.txt; evidence/gaps/audio-braskas-final-aeon-5ddfde3/run.json.
- **PR-0086**: FIXED. 38 of 40 Act III White Wind casts resolved and healed Leblanc and Ormi by 157-182 with 0 IMMUNE (the other 2 still charging at run end); real-input seq 429 heals Leblanc 175 and Ormi 164. Fractional damage on the trio still reads IMMUNE (leblanc-white-wind.test.ts 12/12). Evidence: critic/rounds/round-09/combat-5ddfde3/probe-ww2.json; evidence/5ddfde3/ffx2-leblanc-win/battle-log.json.
- **PR-0090**: FIXED as filed: the intent read-out now renders (FFX via E, FFX-2 open by default). Its new defects are filed separately: PR-0122 (over the pause, the HOLD), PR-0123, PR-0139, PR-0130.
- **PR-0088**: FIXED. FFX-2 party wrong-state advisor misses fell from 16 (e119552) to 0 on the same routes; advisor-committed.test.ts 9/9. The chapter 1 wrong-state misses are Mortiorchis's own Full-Life, not the advisor.
- **PR-0093**: FIXED. The Syndicate stands at party scale in all three links (20-link-2, 20-link-3, 24-seam-3-first-menu); Ormi is about Paine's height. Staging residue filed as PR-0136 (polish).
- **PR-0101**: FIXED. Chapter 6 requests art/pause/leblanc.png and art/portraits/leblanc.png, both ship; 0 notFound and 0 HTML-for-image across 14 runs; the pause over the ch6 pre-scene shows Leblanc's painting (05b-scene-esc.png).
- **PR-0046**: FIXED for the default (Wait) path: the briefing reads "In hers, the clock holds while you choose." and the FFX-2 first-turn badge "MENU'S UP · GAUGES HOLDING" (ch4 at 2000x1012, ch6 at 1600x900). The Active branch of 87b6277 cannot be reached by a fresh player (the coach is consumed in the first FFX-2 battle), so it is untested, and the Wait wording is inferred copy awaiting Bailey.

## What stands between this build and acceptance

- The ship gate: PR-0122 (one visibility rule). Everything else below concerns the finished milestone, not the next release.
- Evidence: audio has no number until Bailey listens (CHK-B1); chapter 3 has no real-input win (CHK-022; fix PR-0125 first); the live artifact (CHK-017) exists only after a deploy.
- 46 open majors, 26 of the carried issues not re-examined this round, and every category below the 9.0 floor (the lowest: onboarding 6.5, interface 7.3, visual 7.6, narrative 7.7).
- The target gate: 11 failing, 1 unverified and 5 waiting on Bailey.
- Human judgments not recorded: listening, hands-on feel, chapter 6 voices, and the open questions only Bailey can answer (listed under humanJudgments).
- STALLED areas owing a written §8 method check before another batch: PR-0007 and PR-0008 (chapter 1), PR-0021 (banter).

## What changed since the previous round (round 09 on e119552)

- The candidate now builds in production (PR-0085 fixed), so this round judged the real deployable artifact rather than a substitute.
- Fixed and verified: PR-0085, PR-0091, PR-0089, PR-0086, PR-0090, PR-0088, PR-0093, PR-0101, and PR-0046 for the default path. PR-0076 is fixed for the default and returning players and narrowed to a polish item about a chosen Active.
- New on record: PR-0122 (the repaired intent panel over the pause, the HOLD), PR-0123, PR-0126, PR-0124, PR-0125 (present on live, newly established), PR-0127, PR-0128, and polish PR-0129 to PR-0141.
- Real-input wins now exist for chapters 1, 2, 4, 5 and 6; chapter 5's is the first on record. Chapter 3 remains the one chapter without one, and its likely cause is now known (PR-0125).
- Category movement against the e119552 pass: combat 8.6 to 8.5, encounter 8.7 to 8.8, visual 7.6 to 7.6, feel 7.9 to 7.9, narrative 7.9 to 7.7, interface 7.4 to 7.3, onboarding 6.2 to 6.5, prep 8.5 to 8.4, delivery 6.0 to 8.0, audio UNVERIFIED both times. Rubric v1 rounds 02 and 03 are history under another rubric and are not compared.
- The e119552 report that this file replaces is kept at critic/rounds/round-09/chief-5ddfde3/round-09-e119552.json and .md.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- Nothing in this section is built without Bailey's yes (AGENTS.md hard rule 10).
- P-09-1 and P-09-2 from the e119552 round are done (f461f2a gates every stylesheet on lightningcss and the cut runs a production-build smoke; the fade unit is converted at every port by fadeMsToSec).
- P-09-3 (carried). Show Bailey 2 to 4 options for the Dr. Goon and Fem-Goon paintings and Brother's speaker portrait alongside the planned identity-LoRA Leblanc pose B and a re-rendered Ormi from his idle. Benefit: closes PR-0092, PR-0096 and the Brother half of PR-0058 in one art round. Cost: one options round when art generation is on. Risk: GPU time.
- P-09-4 (carried). Two or three short audio sketches for a Chateau Leblanc scene cue and a brassy, non-threatening Syndicate boss cue (research §10.3) for Bailey to audition (PR-0099). Build nothing until he picks.
- P-09-5 (carried). Stop listing 390x844 as a supported platform until the phone layout has an approved target; PR-0001, PR-0017, PR-0098, PR-0127 (phone half), FOC-06 (phone half) and PR-0113 all wait on that one decision.
- P-09-6 (new). Ask Bailey, with two mock frames, whether the enemy-intent panel should open by default in FFX-2 while FFX starts collapsed to a chip (today's behaviour from one shared setting). Benefit: settles the CHK-020 parity question before more intent work. Cost: two mock frames. Fit: both games; the FFX-2 source has no intent display, so this is presentation, not canon. Risk: none.
- P-09-7 (new). Two options for post-battle scenes (PR-0133): A, play the aftermath on the battle stage so victory poses, camera and dissolves show; B, keep the backdrop and add one painted still per chapter for the reveal beats (chapter 6 beat 14, Yunalesca's dissolve). Show a faked frame of each before building. Benefit: the aftermath is seen, not read. Cost: A is engine work, B is one painting per chapter. Risk: A touches the presenter (a deep review).

## Notes

- Servers: this consolidation started no server. At the end no process listened on ports 5400-5990 (checked with Get-NetTCPConnection); the capture owner reports stopping its preview (127.0.0.1:5630, PID 4460) and confirming the port closed.
- Browser mode for every capture used here: PYREFLY_BROWSER=gpu, no fallback needed.
- Scratch for this consolidation: critic/rounds/round-09/chief-5ddfde3/ (inputs.json holds every agent's full result; build-report.mjs, assemble.mjs, write-md.mjs, plan.json, score-output.txt).
