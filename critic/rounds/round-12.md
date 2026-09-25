# Critic round 12: deep review of the live build 5be4babe

```text
Build / artifact / target version: main 5be4babe, bundle Dat8v42m, artifact 75a8050bfe31cb8e… (critic/artifacts/5be4babe.json, live byte match), targets.json sha256 d5f76c2bb64c84b8…
Review: deep (after the deploy, on the live site; carries the deep obligations of 12 earlier builds)
Deployment: PASS (exact artifact live, CHK-017; 0 console errors, 0 responses >= 400 in 34 capture runs)
Changed area: FAIL (open majors in the changed systems: PR-0076, PR-0105, PR-0008, PR-0179, PR-0180, PR-0181, PR-0061)
Ship: SHIP (stays live): no critical, no major regression against release 14 (1c22066e). Discloses 32 majors, led by PR-0148, PR-0061, PR-0076, PR-0008, PR-0180
Milestone: not assessed
Quality: PROVISIONAL, no total (audio UNVERIFIED: no owner listening verdict). Categories: combat 8.6, encounter 8.7, visual 8.2, feel 7.8, narrative 7.9, audio UNVERIFIED, interface 7.3, onboarding 6.9, prep 8.5, delivery 8.0
Targets: 64 required / 53 matched / 6 failing / 5 unverified / 9 waiting on decision
Top issues: PR-0148, PR-0061, PR-0076, PR-0008, PR-0180, PR-0153 (full ranked list below)
Coverage: 8 playable chapters by real input from the title (Ch VII locked); Ch V win path, CHK-024, frame time, non-Chromium and Bailey's CHK-B1/B2 not tested
Next required review and why: the deep obligation stays pending on 5be4babe until a Ch V win on the default and an FFX all-enemies target state are captured; the next candidate owes a focused review before deploy
Elapsed review time / repeated work avoided: about 230 min wall clock (about 700 agent-minutes); round-11 combat and narrative evidence reused with dependency arguments, one browser owner
```

## Score output (tools/critic-score.mjs, verbatim)

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
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-007 is FAIL
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-005 is UNVERIFIED
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-007 is FAIL
  - mandatory check CHK-008 is UNVERIFIED
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-010 is UNVERIFIED
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-010 is UNVERIFIED
  - 32 critical or major issue(s) remain open
  - encounter ffx2-vegnagun-shuyin has no complete real-input flow
  - encounter seymour-anima-macalania has no complete real-input flow
  - 6 required target(s) failing
  - 5 required target(s) unverified
  - 9 required target(s) waiting
  - only 53 of 64 required targets matched
  - human judgment not recorded: Audio listening verdict on the shipped mix, including boss-yojimbo (CHK-B1)
  - human judgment not recorded: Bailey play session on Chapter IX (CHK-B2)
  - human judgment not recorded: Chapter V on the default Wait split: accept the live cost, expose the whole-menu hold, or add a coach line (PR-0076)
  - human judgment not recorded: D-010: an enemy hit closes the open menu and delays that girl (PR-0105)
  - human judgment not recorded: PR-0008 re-baseline of the Chapter I preset and the fresh-profile seed
  - human judgment not recorded: PR-0035: is the mirrored FFX-2 field an accepted adaptation?
  - human judgment not recorded: PR-0021: banter bank in or out of this milestone
  - human judgment not recorded: D-068: Chapter IX mid-battle callouts, gated on Bailey reading the story draft
  - human judgment not recorded: PR-0170: a command with one valid target fires without a target step (faithful or not?)
report: valid evidence
```

## critic-clear output (verbatim)

```text
  still pending deep: required coverage was not tested: CHK-022 for plan chapter ffx2-vegnagun-shuyin: the Chapter V victory path on the shipped default (link 5 Shuyin, the aftermath with the Fayth lines, victory results, the saved clear, and with it the live half of PR-0129 FFX-2 and the Shuyin and Fayth tiles): three live runs lost at link 4., CHK-010 (plan check): the FFX ALL ENEMIES targeting state; the Chapter III party offered no Black Magic row.
```

## Verdicts

- **deployment: PASS.** The exact artifact 75a8050b is live (CHK-017 PASS, byte match with critic/artifacts/5be4babe.json) and the capture owner's runs were clean: 0 console errors, 0 responses >= 400, 0 html-typed media, clears survive a reload.
- **changedArea: FAIL.** FAIL: the changed systems carry open majors: the Wait split default exposes PR-0105 and costs Chapter V (PR-0076, win path unverified), two sourced fixes dropped Chapter I to 17/40 (PR-0008), and the new Chapter IX has PR-0179 (aeon data), PR-0181 (summon staging) and PR-0180 (unnamed actions), plus the slowest first menu (PR-0061).
- **milestone: not assessed.** Not assessed in a deep review. The score tool's gates are reported below for information.
- **ship: SHIP.** SHIP (stays live): no critical, no major regression against release 14.

Ship reasons:
- No critical defect is open on 5be4babe: no crash, lock, lost progress or unfinishable encounter was observed in 34 capture runs and the gap pass (0 console errors, every outcome reached results and RETRY or the board).
- No major is a regression against the replaced live build 1c22066e: every major is tagged regressionVsLive false, except PR-0061 whose tag is unknown (no release-14 measurement), which does not hold a build at major.
- The majors this build introduced or exposed (PR-0076 and PR-0105 through the Wait split default, PR-0008 through two sourced fixes) come from sourced corrections and an owner decision, not from breakage, and are disclosed; PR-0179 lies inside the new Chapter IX.
- The build is better than release 14: Chapter III is winnable by real input for the first time, aeon Items, FFX-2 magic evasion, the steal banner, the Chapter II pause snapshot, Leblanc's fan and eleven visual majors are repaired with live proof, and Chapter IX is complete and faithful.

**Majors this release discloses** (every one is regressionVsLive false, or unknown for PR-0061; none is critical):
- PR-0148: Bailey's 2026-09-21 verdict that the score sounds like SNES music is still unaddressed: no shipped cue was re-rendered in 76f587c3..5be4babe, and there is still no owner listening verdict on the mix that ships
- PR-0061: 6.3 to 11.9 s from the scene skip to the first usable command menu; the new Chapter IX is the slowest (11.9 s)
- PR-0076: on the shipped default, Chapter V was lost at the Head link in 3 of 3 live real-key runs; the bench wins 7 of 40 at 1 s of top-list time, and the win path is unverified on this build
- PR-0008: Chapter I's intended line now wins 17 of 40 and the advisor 20 of 40, and seed 1, which every fresh profile gets, loses both; live, the advisor-following capture won 1 of 5 decided attempts
- PR-0180: FFX battles never show an action's name, so Zanmato and Yojimbo's other moves land unnamed (every FFX chapter; most visible in Chapter IX)
- PR-0153: the FFX intent names one damage target for a random-target move and marks it SCRIPTED; wrong in Ch I (4/4 runs) and Ch VIII (hidden lethal hit)
- PR-0001: at 390x844 the battle HUD in both games is the desktop stage scaled down: text a few px tall, one party member in frame, the HUD over the boss; the Victory/Defeat results are a letterboxed miniature too
- PR-0105: under the shipped default Wait split, a hit on a girl whose top-level menu is open keeps her menu; the sources say it closes the menu and delays her turn
- PR-0181: an FFX summon leaves the party standing on the field beside the aeon, and the party panel keeps the party's rows instead of the aeon's (FFX only)
- R13-04: in Chapter VIII the FFX command stack covers Tidus, the acting character
- PR-0157: FFX action shots put a party member under the enemy info card and the acting boss under the turn-order column
- PR-0126: the advisor card still drops its 'in <menu>' directions at density 6, on every phone card and on many desktop cards
- FOC-06: HUD text a player must read is below the 14 px floor at every desktop shape: the advisor chips at 12.2 px (1600x900, 2000x1012), the FFX HUD at 8.4 px and the FFX-2 HUD at 7.8 px at 1280x720/960, the pause at 9.3-9.8 px, 13.3 px ...
- PR-0179: the Gagazet preset's five aeons ship an invented ~0.55x scaling (738-1,398 HP) below the sourced Mt. Gagazet table and its "never weaker than" floor, so aeons die to Kozuka or Wakizashi before Zanmato; Chapter IX inherits the ro...
- PR-0095: Vegnagun's Bulwark and Redoubt C* rings and plates are not visible; the command window covers the Bulwark forelegs
- PR-0094: at Chapter V link 4 the Redoubt intent card sits on Vegnagun's head painting
- PR-0031: target selection lacks the approved ground ring under the selected figure and the quiet dim on non-targets
- PR-0035: the FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile
- PR-0021: no banter bank; four FFX chapters end on the same '...Okay. Next one.'
- PR-0099: Chapter 6 (Leblanc) still has no THEMES.md cue-map row for the Chapter-4 cues it borrows
- PR-0127: Chapter VI prep polaroid captions are still clipped by the card edge, now seen at 2000x1012; the phone half is repaired (D-071)
- PR-0067: on the 390x844 chapter board the FINAL FANTASY X-2 group, IX and the COMING card sit below an unmarked clip, and the selected chapter can be invisible in the rail
- PR-0129: the Chapter III chain cue ownership is fixed on live; the Chapter V boss-shuyin half is unverified live because no run reached Shuyin
- PR-0123: The enemy-intent headline still pairs the rolled move with the top branch's odds: 'No action MOST LIKELY 88%' above 'Attack 88%, no action 12%' [carried from round 11, not re-tested on this build]
- PR-0144: Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the... [carried from round 11, not re-tested on this build]
- PR-0018: The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured) [carried from round 11, not re-tested on this build]
- PR-0066: The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor [carried from round 11, not re-tested on this build]
- PR-0057: At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line [carried from round 11, not re-tested on this build]
- PR-0063: The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters [carried from round 11, not re-tested on this build]
- PR-0014: HUD portrait chips crop through heads; the monogram half is repaired [carried from round 11, not re-tested on this build]
- PR-0128: Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks [carried from round 11, not re-tested on this build]
- PR-0060: The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce [carried from round 11, not re-tested on this build]

## Categories

| Category | Weight | Score | Status |
|---|---:|---:|---|
| combat | 20 | 8.6 | scored |
| encounter | 10 | 8.7 | scored |
| visual | 15 | 8.2 | scored |
| feel | 10 | 7.8 | scored |
| narrative | 10 | 7.9 | scored |
| audio | 10 | — | UNVERIFIED |
| interface | 10 | 7.3 | scored |
| onboarding | 5 | 6.9 | scored |
| prep | 5 | 8.5 | scored |
| delivery | 5 | 8 | scored |

What counts as a gain this round (RUBRIC section 8): a major closed with live proof, not a cosmetic change. Combat gained two majors closed live (PR-0154, PR-0155) against one new (PR-0179) and one escalation (PR-0105). Visual gained about eleven majors closed or narrowed live. Interface gained four majors closed (PR-0152, PR-0143, PR-0156, PR-0082's interface root). Feel has no gain (PR-0061 still stalled, PR-0180 newly found).

### combat (8.6)

BUILD: main 5be4babe, bundle Dat8v42m, artifact 75a8050b (capture owner's live record). I opened no browser. Engine work ran on D:/pyrefly-rel15, which is exactly 5be4babe (src is clean; the only untracked or modified files are critic/ and dist-gate/), and on a git-archive copy of 5be4babe for the benches, since deleted. Bench sources and logs: critic/rounds/round-12/combat/ (r12/*.test.ts, bench-*.log, probe-*.json). Browser evidence is the capture owner's: PYREFLY_BROWSER=gpu, headless Chromium, real keys. UNIT SUITE on 5be4babe: 370/370 files, 7,002 tests passed, 5 skipped, exit 0 (unit-full.log). It includes ffx-ctb 34, ffx-ctb-locks 7, ffx-statuses 22, ffx-doublecast-aim 9, ffx-aeon-no-items 9, ffx-no-active-clock 3, ffx2-atb-golden 6, ffx2-active-atb 23, ffx2-wait-split 13, ffx2-wait-split-presenter 4, ffx2-magic-never-misses 10, ffx2-chain 12, ffx2-steal 7, flow-encounter-chain 45, enemy-intent 30, seymour-flux-poison-crossing 5, seymour-flux-mortibsorption 4, yojimbo-engine 29, yojimbo-content 25, yojimbo-repair 19, yojimbo-bench 3. CHANGED DATA AND RULES, 76f587c3..5be4babe, audited against research/: (1) Chapter IX Yojimbo against ffx-yojimbo.md §2-§4. HP 33,000, MP 2,000, Str 34, Def 80, Mag 35, MDef 0, Agi 32, Overkill 4,060, Doom 5, no rewards, neutral affinities. Immunities, flags and the formation [Ginnem, Yojimbo, Daigoro] match. Kozuka Str 16, Wakizashi Str 28 single random, Zanmato fixed 200 (9,999, party, canMiss false), Daigoro Str 25 with DC 20, +20 crit and 10% shatter. Gauge +3 when targeted and +2 when attacking, bands 25/50/80/100. The unsourced parts (even odds, 0 start and reset, per-action targeting, untargetable bystanders, Threaten immune) are labelled estimates. PASS. (2) Seymour Flux: the phase moves only on a real hit, and Poison below 50% leaves phase 1, per ffx-seymour-flux §4.3 lines 200/313-316 [verified: 2 sources]. Mortibsorption runs the threshold counters (§4.3 line 314). PASS. (3) FFX aeons have no Item row, per ffx-combat-core §6.2 (Shield, Boost, Dismiss). PASS. (4) FFX-2 magic never rolls, and Enchanted Ammo keeps Accuracy 'Stat', per ffx2-combat-core §2.9 lines 605/620. PASS. (5) Steal names: Mute Shock matches ffx2-bahamut §1.6 lines 200-201. PASS. (6) Wait split, per ffx2-combat-core §1.5: the clock runs at the top list and holds in a submenu; that the target cursor also holds is our reading, disclosed. PASS as a rule. (7) The possessed-aeon name capitalisation and the null music cues change no combat. LIVE RUNTIME (capture event logs, CHK-023): Yojimbo's gauge events fire live (targeted +3, attacking +2, zanmato 100 -> 0). Doom from the Ronso Rage chooser (rages [jump, doom]) lands with a count of 5 and ticks 4-3-2-1 on his turns, and the chapter was won by it in 16 turns. Zanmato fired live for 9,999 to Kimahri and Yuna (contact-zanmato.jpg). Aeon menus show Attack / Aeon / Dismiss, with no Items. Steal names its item in the ch6 banner (Budget Grenade, X-Potion), so PR-0143 is now live-verified. There are no evasions of magical rows in 21,523 live ch5 events or in the 40-seed benches, so PR-0154 is repaired. BFA Doublecast still hits twice (capture). AGAINST: NEW MAJOR R12-C01, the Gagazet preset's aeons (738-1,398 HP) sit below the verified battle-count floor. ESCALATED PR-0105 to major: under the new default Wait split, a hit on a girl whose top list is open keeps her menu, which §1.1/§1.5 say it closes. Carried polish, code unchanged: PR-0145, PR-0106, PR-0107, PR-0108, PR-0069, PR-0054, PR-0053, and PR-0124 (a sourcing question). GAIN VS ROUND 11 (8.5): two majors closed with live proof (PR-0154, PR-0155), PR-0143 now live, and a new chapter whose combat is faithful and sourced. One new major and one escalation. Net +0.1. CHIEF NOTE: the gap pass proved live that the Wait split runs the clock at the top list and holds in a submenu (CHK-023 live half), that an aeon absorbs Zanmato (Valefor, seq 339-345), and the Doom kill in full (ticks 5 to 0, KO, victory). PR-0181 (summon staging) is cross-referenced from visual, not scored here. No rescore.

### encounter (8.7)

Fresh 40-seed engine benches on 5be4babe (critic/rounds/round-12/combat/bench-ffx.log, probe-ffx-bench.json). Intended line / advisor top row: Seymour Flux 17/40 and 20/40 (round 11: 26 and 27; seed 1 loses both). Yunalesca 39/40 and 38/40, Braska's Final Aeon link 1 39/40 and 39/40, Evrae 40/40 and 40/40, all identical to round 11, so the shared CTB changes (ordersOnly queue filter, nextHitTargets, aim, the Provoke self-target guard) moved nothing there. Yojimbo 40/40 and 40/40, by Doom in about 18 turns. Unit bench over 200 seeds: intended 200/200, magic race 143/200, credibly wrong attack-mash 0/200 with 0.98 Zanmatos a battle. So the sourced shortcut wins, racing is a real risk, and the habit earlier chapters reward is punished. That is the design research §4.1/§5.3 describes. FFX-2 benches (bench-ffx2.log, bench-ffx2-arms.log) put the modelled decision time D_top on the top list, where the shipped Wait split runs the clock. ch4: 40/40 at every D. ch5: 39/40 at 0 ms, 39/40 at 250, 31/40 at 500, 7/40 at 1,000, 0/40 at 2,500. ch6: 40/40, 37/40, 29/40, 11/40 and 4/40. Under the whole-menu hold (?wait=hold), ch4-6 win 40/40, 39/40 and 40/40 at any D. Mashing under the split loses 0/40 everywhere. REAL FLOW (capture owner, live, real keys): ch2, ch3 (first attempt; PR-0082 is repaired, and round 11 had no ch3 win), ch4, ch6, ch8 and ch9 (at 1600, 2000 and 390x844) were won. ch9 also lost to Zanmato with Retry, and ch4 lost under Active with Retry. ch1 won 1 of 5 decided attempts (a loss at 1600 then a Retry win; three losses at 2000; r1 was a harness stall). ch5 lost both live attempts at the Head link (46.5 and 42.2 min, seed 1): items spent, the party Silenced, Darkened and Poisoned at 40-197 HP. That is the Wait split's cost, which Bailey accepted when he turned it on (D-029 follow-up 2; builder's measurement 32/40 at 0.5 s), now seen live. DEDUCTIONS: PR-0008 is worse, 26 -> 17 of 40 from two sourced fixes (Poison phase, aeon Items), and seed 1 still loses. PR-0076 is now the default's cost, not an opt-in's (information for Bailey). R12-C01's aeon fragility removes a sourced Yojimbo counterplay: Bahamut + Shield vs Zanmato (cross-ref, scored in combat). GAIN VS ROUND 11 (8.9 -> 8.7): Chapter 3 was won through real play, and Chapter IX is authentic and fair. Against that, Chapter 1's intended line is under half, Chapter 5 was not won live on the shipped default, and one sourced counterplay is lost to the aeon data gap. CHIEF NOTE: a third live Chapter V attempt (gap pass) also lost at link 4; the chapter's win path stays unverified on this build (PR-0076). No rescore.

### visual (8.2)

Deep review, round 12. The build is the LIVE site at main 5be4babe, bundle Dat8v42m, artifact 75a8050b. I judged it only from the capture owner's evidence: PYREFLY_BROWSER=gpu, headless Chromium through Playwright, real keys, at 1600x900, 2000x1012 and 390x844. I opened no browser. I read 64 target-versus-build composites (critic/rounds/round-12/targets/*.jpg) and 20 contact sheets and crops (critic/rounds/round-12/visual/*.jpg).

PROTECTION: all 185 approved files are byte-identical in the live manifest and decode ok (targets/hashcheck-live.json). That includes Leblanc's fan-open idle, the Yojimbo, Daigoro, Ginnem, chamber and sakura set, and the ch9 hero plate.

REPAIRED SINCE ROUND 11 (76f587c3), all seen on live:
- PR-0002: Yuna now stands clear of the FFX command stack in ch1 (1600 and 2000) and in ch3.
- PR-0005 (D-042 B): the command cascade and Auron's coach line draw above the turn cut-in slab.
- PR-0096: Leblanc holds the red fan fully open, with her fan clear of the intent card.
- PR-0016: the pause CHAPTER tab shows the chapter hero plate in ch2, ch3, ch4, ch8 and ch9.
- PR-0065: 17 of 17 briefings show Auron and the backdrop. The chapter cards show painted party busts, including ch8.
- PR-0022 (FFX): KO'd party members lie flat on the floor at their stations in the ch9 Zanmato frames.
- PR-0079 is not reproduced (the ch9 Kimahri tab keeps the stats clear of his face). PR-0057 is not reproduced on the ch9 phone pre-scene.
- PR-0127 (D-071): the phone prep is now the stacked, scrolling card, as approved.
- PR-0150: FFX-2 targeting now has the TARGET plate, the actor/dressphere plate, the six-petal reticle and the ATB chip (ch6).
- PR-0095, narrowed: the Nodes now use the approved top-edge markers, and the hooded cones are gone.
- PR-0094, narrowed: the link-3 intent card no longer covers Vegnagun's body.

NEW CHAPTER IX (FFX): it renders the approved picks faithfully:
- Yojimbo is the new gold, orange and purple painting (O-1 A), shown on the battle-start card and in the field.
- Daigoro is the koma-inu (O-2 B).
- Ginnem has the pyrefly edge glow on the cutscene stage (O-3 B).
- The cold chamber with its shaft of daylight is used in the scenes (O-4 A).
- The Zanmato gauge bar has its 25/50/80 bands (O-5 A).
- The pause hero plate is option B.
- Enemies face the party, the scale is readable, and the phone view frames the fiends.

AGAINST THE SCORE, CARRIED MAJORS:
- R13-04: Tidus is under the stack in ch8. Disclosed; the fix is not live.
- PR-0157, narrowed: during FFX actions, Seymour Flux's info card covers Yuna's body, and the acting boss sits under the turn-order column.
- PR-0094, link 4: the Redoubt intent card sits on the head painting.
- PR-0095: the Bulwark and Redoubt C* rings and plates are not visible in any link 3 or link 4 frame. The command window covers the Bulwark forelegs.
- PR-0035: the FFX-2 field is mirrored.
- PR-0031: no ground ring or dim on non-targets.
- PR-0017 / R15-01: on a phone, only one party member is in frame in ch4 and ch9.

NEW POLISH:
- R12-VIS-01: the ch1 target name plate sits on Yuna's face.
- R12-VIS-02: the ch9 sakura overlay shows a straight side cut and hangs above the horizon.
- R12-VIS-03: the ch9 enemy-action and arrival shots slice the party's heads at the bottom edge.
- R12-VIS-04: the ch3 Sensor card covers the lower half of Yu Pagoda B while BFA is targeted.

CARRIED POLISH, SEEN AGAIN: PR-0176 (aeon letter chips), PR-0137, PR-0135, PR-0120 (now also in FFX-2), PR-0034 and PR-0178.

COVERAGE GAP: no 4:3, 21:9, 1440p or 4K captures. The ch1 hero plate, Swordplay, Shuyin and five speaker portraits were not captured.

NET: about eleven visual majors were closed or narrowed with live proof, and a new chapter looks finished. Several majors remain, and the new issues are polish. Anchor 7 means functional with conspicuous weaknesses and 9 means polished with minor issues; this build sits between them. Round 11 scored 7.6. The gain for this category is the count of majors closed with live proof, not cosmetic tweaks. CHIEF NOTE: the gap pass ran after this score. It matched 8 more target tiles on live (Ch I, V and VI hero plates, five speaker portraits, the Evrae order widget, the Zanmato gauge full state; pause faces clear at 1280x720 and 1280x960; an FFX-2 KO lies grounded) and found one new major (PR-0181, the FFX summon leaves the party on the field) plus the 4K pause band (PR-0121, carried). The chief judged these to offset and did not rescore.

### feel (7.8)

Deep round 12, LIVE main 5be4babe, bundle Dat8v42m, artifact 75a8050b. Judged only the capture owner's evidence (PYREFLY_BROWSER=gpu, headless Chromium on ANGLE/RTX 5070 Ti, real keyboard, no black-canvas fallback; up to 4 capture browsers at once, latency measured alone). No browser opened. 28 timed sequences turned into contact sheets with the index.jsonl timestamps (sampled every 200 to 400 ms): critic/rounds/round-12/feel-narr/*.jpg (the script is sheet.py). Pacing from 17 run.json files and 4 latency/*.json files. FOR: (1) Chapter III can now be won with real keys (PR-0082 repaired), so its motion shows for the first time. All six chain seams (seq-seam-2..7) push from a wide shot to the new boss, show the name caption by about 1.1 s and hold clean to 2.5 s, the same way every time. (2) The summon is now in motion (zanmato-aeon-r3/seq-summon): the aeon appears by about 0.8 s, is fully in by 1.3 s, and its menu is up at 2.07 s. (3) Zanmato fires on live with real keys (r3). The KOs land one after another from 0.66 s to 1.9 s, then the defeat fade starts at 2.8 s. (4) The first usable menu comes 0.3 to 1.3 s sooner in five chapters: ch2 6.3 s (was 7.6), ch3 6.35 s (was 7.0-7.2), ch4 7.6 s (was 8.2), ch6 9.0 s (was 9.5), ch8 6.8 s (was 7.0-7.2). (5) Skip and replay still respect the player. One Enter hold skips the scene in all 17 runs, and Esc over a scene opens the pause. RETRY reaches prep about 3.1 s after the results and the battle 1.7 s after that, in ch1, ch4, ch5 and ch9. (6) Chapter IX's arrival (card at 0.07 s, stage at 0.7 s, sakura and Yojimbo stepping in by 1.6 s) reads as deliberate. AGAINST: (a) NEW R12-FN-01 (major). FFX never shows an action's name on screen. Zanmato, the new chapter's signature kill, lands unnamed while the gauge panel already reads 0% / 'Next: Daigoro'. Yojimbo's ordinary turns hold about 1.5 s on his idle painting with nothing to read before the damage appears. This was traced in code. (b) PR-0061 (major, STALLED) is still open. Ch1 is 8.0-8.1 s (8.8 s from leaving the scene, measured alone), ch5 is 9.3-9.6 s, and the new ch9 is the worst yet at 11.4-11.9 s. (c) PR-0104 is seen again in ch4 and ch6: the next girl's cut-in is at 0.3 s and her menu is up by about 0.85-1.0 s, before the confirmed action visibly resolves. (d) PR-0146 is seen again in ch4: the intent panel shows over the title-card crossfade at 363 ms. (e) NEW R12-FN-03 (polish): the aeon fades in behind Kimahri while the whole party stays on the field. NOT EVIDENCED in motion: the Mega Flare, Energy Ray and Meteor Strike Overdrives, the Zanmato-on-an-aeon route, and input-to-response latency (the sampling is too coarse). Net: seams, summon and Zanmato are now evidenced and five chapters load a little faster. Against that, a newly found shared major and a new chapter with the slowest first menu. Anchor 7 = functional with conspicuous weaknesses. 7.8 against round 11's 7.9, because R12-FN-01 existed before and round 11 missed it. CHIEF NOTE: the gap pass measured input-to-response at 7.7-8.3 ms median (all within one 60 Hz frame, ch1 and ch4), timed Mega Flare and Energy Ray, and confirmed by DOM read that no action name shows in FFX (PR-0180). No rescore.

### narrative (7.9)

SOURCES: src/story at 5be4babe (D:/pyrefly-rel15), read against research/writing-bible.md sections 1, 2.1, 5.4 and 6, and research/ffx-yojimbo.md sections 5 and 6. git diff 76f587c3..5be4babe -- src/story touches only yojimbo-cavern.ts (new), seymour-anima-macalania.ts (Chapter VII, still 'coming' and locked on live, so NOT APPLICABLE), and additive lines in dsl.ts and registry.ts. Every other chapter's text is unchanged. SEEN ON LIVE: all 19 Chapter IX pre-battle lines, each with its approved portrait (yojimbo-cavern-scenewalk/run.json plus sp-*.png). The first line of the Chapter IX post scene ('She's gone. Truly, this time.') and the Ginnem staging still (30-post-scene.png). The Chapter III epilogue opener, Rikku's 'Is that it? Did we—' (33-after-confirm-scene.png). Results quips for ch1, ch2, ch3, ch6 and ch8, plus the Chapter IX, IV and V results. FOR: (1) Chapter IX (new, FFX only) hits research section 6.2 beats 1 to 5 in order. Lulu hangs back, the fayth theft is explained, Kimahri says 'Unsent.', Lulu recognises Ginnem and says she was too young, the sending is broken, Lulu takes on her last duty, and Yuna sends Ginnem after the fight. The wording is original. Lulu's voice is dry and without contractions, Wakka's 'ya' and the one tension-release line per scene follow section 6's checklist, and Kimahri speaks once after a silence. The grim tier correctly suppresses victory quips. (2) Ginnem is now staged in the aftermath, so PR-0133 is partly addressed, for Chapter IX only. (3) Chapter III's emotional payoff is now reachable with legal input: post scene, results, then the epilogue. That was the biggest narrative gap in round 11. (4) Mid-battle triggers fire in real-key logs: ch1 seymour-lance; ch2 all five Yunalesca beats; ch3 bfa-talk, bfa-low, bfa-sword and jecht-falls; ch4 three; ch5 four; ch6 three; ch8 four. AGAINST: (a) PR-0021 (major, STALLED): there is still no banter bank, and ch1, ch2, ch3 and ch8 all end on the same '...Okay. Next one.'. (b) NEW R12-FN-02 (polish): that quip fires on the Chapter III results card, between Yu Yevon's death and the FFX ending epilogue. (c) Carried with their text unchanged: PR-0159 (no contractions in Chapter VIII), PR-0160, PR-0161, PR-0058, PR-0102, PR-0134, PR-0147, PR-0103 and PR-0037. PR-0133 is seen again in Chapter III: the epilogue opens on the backdrop alone. (d) Chapter IX has no mid-battle beats. D-068 is adopted, but the lines are held until Bailey reads the story draft, so this is not scored as a defect; it is listed as a question for Bailey. NOT READ ON SCREEN: the Chapter IX post scene after line 20 (Lulu's crack, line 31), the Chapter III epilogue after its first line (Auron's sending, Tidus fading, the narration), the Chapter III gauntlet seam dialogue, and the Chapter V seam scenes. Net: a faithful, well-voiced new chapter and a reachable FFX ending, against unchanged carried debt and a mistimed quip. 7.9 against round 11's 7.7. CHIEF NOTE: the gap pass read all 13 Chapter IX aftermath lines live in script order; the Chapter III epilogue beyond its first line and the gauntlet beats were still not reached (two more attempts lost in phase 1, a harness route problem). No rescore.

### audio (UNVERIFIED)

No numeric score. I cannot hear, and I listened to nothing — every result below comes from reading data (ffmpeg-backed tools/audio/qa.mjs, tools/audio/themes-audit.mjs, vitest, the capture owner's audioDebug samples and network logs from critic/rounds/round-12/evidence/). docs/audio/OWNER-VERDICT.md still records only 'Right direction, keep refining' (2026-09-19, explicitly not a number) plus three 'accepted on recommendation, not by ear' entries (Evrae D-039, Macalania D-048, Yojimbo O-6 D-063); no numeric verdict exists for any cue, including the new boss-yojimbo. RUBRIC.md section 6 requires the listening score to be the owner's recorded verdict; with none on record the category stays UNVERIFIED, never averaged away and never zero. This is the fifth deep round in a row without a number (rounds 10, 11, and now 12 all record the same gap; PR-0148 is STALLED). TECHNICAL HEALTH IS GOOD: all 25 shipped music cues (including the new boss-yojimbo) and the 134-cue SFX sprite decode cleanly, -15.97 to -16.20 integrated LUFS, -1.06 to -2.86 dBTP true peak, 0 clipped samples, every loop seam 'ok' (node tools/audio/qa.mjs --strict run fresh against the exact build in D:/pyrefly-rel15, 5be4babe). Routing is technically sound for every real moment sampled (title, briefing, chapter-select, pre-battle scene, first battle menu, chain seams, results, pause) across 34 real-input runs: 0 console errors, 0 404s, 0 html-typed media (critic/rounds/round-12/evidence/network-summary.json); the currently-playing cue's source reads 'prerendered' (never a synth fallback) in every sample where the harness's 4000-char truncation left it readable. qa.mjs --strict still exits 1 (CHK-001 technical gate is not green) solely because 52 orphan audition-candidate files (34.2 MB) still ship in the live artifact and are not in the manifest (PR-0100, STALLED 3 rounds). Three cues still depart from the THEMES.md bible unchanged (PR-0039, STALLED). Chapter 6 (Leblanc) still has no THEMES.md cue-map row for its borrowed Chapter-4 cues (PR-0099, STALLED). PR-0129 (major, chain-entrance double-ownership) is FIXED on the FFX/Chapter-3 side and live-verified this round (continuous boss-yu-yevon across links 3-7, no boss-jecht return); the FFX-2/Chapter-5 (boss-shuyin) half is fixed in code and covered by a new real-chain unit test (audio-chain-entrance-owner.test.ts, 5/5 pass) plus the builder's own real-key proof from round 11, but round-12's own two live attempts at Chapter 5 both ended in defeat before reaching Shuyin, so independent live confirmation for that half is still open (see capturesNeeded).

### interface (7.3)

Round 12 deep review of LIVE 5be4babe / bundle Dat8v42m / artifact 75a8050b. Auditor opened no browser. All judgments come from the capture owner's evidence: Playwright headless Chromium with PYREFLY_BROWSER=gpu (ANGLE, RTX 5070 Ti, no fallback), real keyboard and mouse, fresh profiles, seed 1 at 1600x900, 2000x1012 and 390x844 (critic/rounds/round-12/evidence/index.json, 714 items). My crops and contact sheets are in critic/rounds/round-12/interface/.

REPAIRED since round 11 (76f587c3), seen in this evidence:
- PR-0152: the pause CHAPTER snapshot is three thumbnails in Ch II, IV and IX at 1600, 2000 and 390 (interface/pausech.jpg).
- PR-0143: FFX-2 battle messages draw. 'Rikku STOLE BUDGET GRENADE!', 'DR. GOON HAS NOTHING LEFT TO STEAL' and 'STOLE X-POTION!' match the engine message events (ffx2-leblanc-steal/, interface/steal.jpg).
- PR-0082, interface root: the card and target plate letter the Pagodas ('Yu Pagoda A'), and Ch III was won following the advisor (333 commands).
- PR-0156: not re-observed. 1,431 decision-time HUD HP/MP readings across 17 turn logs show none above maximum.
- The target cursor opens on the sensible side. Attack defaults to an enemy, and potions to a party member (target-*/run.json). FFX all-allies shows the ALL ALLIES chip beside the selected row and frames the whole party (interface/target.jpg).
- PR-0010 improved: the counter list ends in 'J HOLD · +2 MORE' instead of a mid-glyph cut. J itself was not exercised.
- The phone pause and phone prep now read at 390x844 (D-071).

STILL OPEN or NEW:
- PR-0153 (major, second review, stalled): the intent card names one damage target for a random-target move and marks it SCRIPTED. Ch I said TIDUS 707-799, and Lance hit Yuna for 789 in 4 of 4 seed-1 runs. Ch VIII said WAKKA, and Evrae KO'd Tidus for 1283. The same pattern is new in Ch IX: Daigoro's bite is shown as SCRIPTED KIMAHRI.
- PR-0126 (major): the card drops its 'in <menu>' chip at density 6. Every phone card is affected, and on desktop it hit Fire Gem, Ice Gem, Dispel and Mega Flare in Ch I, Holy Water and Phoenix Down in Ch II, and Darkness, Mega-Potion, Lunar Curtain and Potion in Ch V. Traced to MoveAdvisor.ts:590/600.
- FOC-06 (major): the desktop advisor chips measure 12.2 effective px in Ch I, II, III, VIII and IX.
- PR-0001 = R15-01 (major): the phone battle HUD is illegible. Widened: the phone Victory and Defeat results are a letterboxed miniature.
- PR-0127 desktop half (major): the Ch VI prep captions are still clipped at 2000x1012.
- PR-0067 (major): on the phone board, the FFX-2 group and IX sit below an unmarked clip.
- New R12-UI-01 (major, cause not established): following the advisor lost Ch V at link 4 in 2 of 2 live runs. The same harness won in round 11.
- Polish: R12-UI-02 (the Ch IX intent says 'damage to itself'); R12-UI-03 ('CHA… CURSED', 'DRESSPHE…', an advisor effect chip cut at the card edge); R12-UI-04 (plausible: the first Enter during the turn cut-in is spent); PR-0130, PR-0110, PR-0115, PR-0168 (now also 'CAVERN STOLEN FAYTH'), PR-0171, PR-0027, PR-0026, PR-0074 (+'Max Hp X2'), PR-0162, PR-0163, PR-0165, PR-0112, PR-0113 half, PR-0019 narrowed, PR-0170.

NOT RE-TESTED on this build: PR-0018, PR-0123, PR-0144, PR-0139, PR-0028, PR-0029 and PR-0169.

GAIN VERSUS ROUND 11 (7.0): four interface majors were repaired and the new defects are mostly polish. The three stalled majors (PR-0153, PR-0126, FOC-06) and the phone family keep the category well below 9.

PROVISIONAL: the 1280x720, 4:3, 21:9, 1440p and 4K shapes, touch and gamepad were not captured (see capturesNeeded). CHIEF NOTE: the gap pass added the rotated-shape type sweep (FFX HUD 8.4 px, FFX-2 7.8 px at 1280x720/960; merged into FOC-06), CHK-010 all-enemies/all-allies passes for FFX-2 and FFX all-allies, and the 13 px multi-target label (PR-0193); no rescore. R12-UI-01 is merged into PR-0076 (encounter): its cause is not established and the combat bench points at the Wait split.

### onboarding (6.9)

The newcomer walkthrough was SIMULATED. It is a paper cold-start read of the real-key capture sequence: title > Auron's briefing > board > prep > pre-scene > first menu, at 1600x900, 2000x1012 and 390x844, in both games. No real newcomer took part.

GAINS on this build:
- PR-0116 closed. The briefing reads 'Eight fights. That is all this is.', derived from the playable chapter list (D-136), and it matches the 8 playable tiles plus 1 COMING.
- The coach copy no longer calls the command menu a list (D-136). 'read the list' in the FFX line is the approved turn-order wording.
- FFX-2 Wait is the default, and Bailey's D-121/D-136 lines render verbatim and readable: 'GAUGES RUNNING · A COMMAND HOLDS THEM' plus Rikku's 'Bar's full, she's up!...' (ffx2-bahamut-win/10-first-menu-coach.png).
- The phone title now says 'TAP TO BEGIN / TAP BEGIN · B BRIEFING', so PR-0073 is partly repaired.
- The phone prep is one readable scrolling page (D-071).
- The pause CONTROLS tab lists keyboard and gamepad bindings.
- Non-colour cues hold: status text (CRS, SIL, DRK, PSN), element labels, the Zanmato gauge in words ('Next: Daigoro, Kozuka or Wakizashi'), and a numeric Doom countdown (FFX).
- The X-2 BATTLE Wait/Active row was flipped with real keys (ffx2-bahamut-lose/15-options-active.png).

STILL OPEN:
- PR-0032: no text-size, key-remap or flash setting. reduceMotion follows the OS only. OPTIONS lists MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, STRATEGY GUIDE, BATTLE HELP, plus X-2 BATTLE and ATB SPEED in FFX-2. CONTROLS is a reference list with no remapping (src/app/screens/pause/panels.ts:145).
- PR-0033: the Defeat screen shows only TURNS, ATTEMPTS and BEST, never why the party fell (seymour-flux-win-r5-1600/31-results.png, yojimbo-cavern-zanmato-aeon-r3/41-results.png).
- PR-0073, rest: the phone briefing, board, pre-scene and prep hints still name only keys ('ENTER / ESC SKIP', 'D NEVER SHOW THIS AGAIN', 'LEFT/RIGHT CHOOSE', 'HOLD ENTER SKIP').
- The FFX first-turn coach line still sits under the turn cut-in slab in Ch I and IX (cross-reference PR-0005, scored under visual).
- The phone battle is unusable (cross-reference PR-0001, scored under interface).

NOT TESTED: gamepad, touch, a real phone, and PR-0119. Gain versus round 11 (6.6): +0.3 for three closed or partial onboarding items. No accessibility setting was added.

### prep (8.5)

Prep/delivery auditor, round 12 deep review, subject LIVE main 5be4babe / bundle Dat8v42m / artifactHash 75a8050b. No browser opened; worked entirely from the capture owner's critic/rounds/round-12/evidence/ (index.json, 714 items, 0 staleRootProblems, 0 harness fails). FOR: (1) Rewards are correctly sourced even where they read as zero. Chapter IX (Yojimbo, new this build) victory shows 'AP 0 x3 PARTY GIL 0' (yojimbo-cavern-win/run.json resultsText) which matches research/ffx-yojimbo.md S2.4 exactly ('None. Drop chance 0, steal chance 0, equipment chance 0, 0 AP, 0 gil [decompiled]+GameFAQs, verified 2 sources'). Chapter III (Braska's Final Aeon) victory also shows AP 0/GIL 0 (braskas-final-aeon-win/run.json), matching research/ffx-bfa-yu-yevon.md S1.7 ('Overkill threshold 20,000 but AP 0 -- overkill is cosmetic here; there is no reward either way', verified 2 sources). Chapter I (Seymour Flux) shows AP 10,000 / GIL 6,000 / Lv.4 Key Sphere on the win, consistent with prior rounds' sourced figures. (2) Chapter III is a genuinely new positive: 333 real-key commands, 25:59, links 1-7 (BFA -> possessed Valefor/Ifrit/Ixion/Shiva/Bahamut -> Yu Yevon), reaching post scene, Victory NEW BEST results, the Rikku CONFIRM scene, board and a reload that keeps the clear. This is the first time in three reviews (round 10, round 11 both ended in defeat before the aftermath) that chapter III's full prep->battle->rewards loop has been demonstrated end to end by real input; the capture owner's note states 'PR-0082 is repaired on live.' (3) Retry is fast and reaches a genuine new fight: ffx2-bahamut-lose/run.json shows afterRetry='party-prep', retryReachedBattle=true after a 1.98-minute defeat (fightMs 44517); seymour-flux was retried through 4 real defeats (win-r2/r3/r4, each a genuine loss with its own turn count) before a 5th real-key win, each time landing back in party-prep with a fresh battle. (4) Progress is reliable: 9 of 9 sampled '35-board-reload' captures across seymour-flux, yunalesca, braskas-final-aeon, ffx2-bahamut, ffx2-leblanc, yojimbo-cavern (1600, 2000 and 390x844) and evrae-airship assert screen=chapter-select with 0 stale-root problems, i.e. the cleared chapter comes back from the save after a real reload in every sampled case. AGAINST: PR-0109 is re-observed a 4th consecutive round and now over a wider chapter set. Every one of the 16 run.json files that record a prep Esc-back this round -- across seymour-flux, braskas-final-aeon, evrae-airship, ffx2-bahamut, ffx2-leblanc, ffx2-vegnagun-shuyin and both new-chapter Yojimbo runs -- shows cardAfterBack='seymour-flux' regardless of which chapter's prep was actually entered: the chapter-select cursor always snaps back to Chapter I. This is now STALLED at the rubric S8 threshold (three-plus reviews, same issue, same severity, no gain) and should get a written method check before another repair attempt, not a fifth similar observation. Chapter V's (ffx2-vegnagun-shuyin) results screen (PR-0138: an odd 'EXP 0 x3 PARTY AP 20 PER DRESSPHERE GIL 0' wording observed in round 11) could not be re-examined this round because neither vegnagun-shuyin attempt reached victory (both were genuine defeats at turn 235/299 and turn 264, run.json outcome='defeat'); it stays carried, neither confirmed nor cleared. Net: the sourced-rewards story is stronger and more broadly demonstrated than round 11 (8.4), chapter III's long-standing prep-to-reward gap closed, but the STALLED cursor defect persisting a 4th round and widening in scope keeps the category well short of the 9.0 floor.

### delivery (8)

Prep/delivery auditor, round 12, subject LIVE main 5be4babe. FOR: (1) CHK-017: critic/pending/5be4babe.json records liveArtifact.result=PASS (111 files checked at deploy) and critic/reviews/5be4babe-live.json settled the live obligation on 2026-09-25T06:16:34Z; artifactHash 75a8050b matches critic/artifacts/5be4babe.json (1003 files, decodeChecked, problems:[]). (2) Console/network health across every sampled real-key run this round (36 run.json files spanning seymour-flux x5, yunalesca, braskas-final-aeon, ffx2-bahamut x3, ffx2-leblanc x2, ffx2-vegnagun-shuyin x2, yojimbo-cavern x3, evrae-airship, plus pause/rage/target/scenewalk probes): consoleErrors=0 and fails=[] in every one; the 17 network-media.json logs I opened directly (seymour-flux-win, ffx2-bahamut-win/lose, braskas-final-aeon-win, etc.) each show notFound:[] and htmlImages:[] against ~250 distinct art/audio URLs (network-summary.json). (3) CHK-022 completeness genuinely improved versus round 11: chapter III (Braska's Final Aeon) now reaches victory/aftermath/results/CONFIRM/reload for the first time in three reviews (PR-0082 repaired, see prep evidence); chapter IX (Yojimbo, brand new) completes title->briefing->board->prep->scene->battle->win->results->board->reload in one continuous real-key route (yojimbo-cavern-win/run.json). Chapter V (ffx2-vegnagun-shuyin) got real coverage of its loss+retry path this round (two honest defeats at turn 235/299 and 264 of a seed-1 run, 3 chain seams reached in the first attempt, afterRetry='party-prep', retryReachedBattle=true) but its win path is still not demonstrated on this exact build -- carried UNVERIFIED, not a new defect, since round 11's ch5 win evidence used a presenter (BattleScreenFlow.ts, BattleEncounterChain.ts, etc., 33+ src/app files changed 76f587c3..5be4babe) that has since changed and cannot be reused under RUBRIC S5. (4) Loading/latency was finally measured with real numbers this round via latency.mjs (single-browser, uncontended per hostNote, GPU host = RTX 5070 Ti via ANGLE, fresh profile, no throttling): domcontentloaded 363-555ms, title screen 379-574ms, chapter board 2668-3213ms, prep 3225-3751ms -- all comfortably under the rubric's 5-second load target on this one hardware/network condition. But the same data confirms the carried first-usable-command-menu stall (round 11's PR-0061, 7.0-9.5s there) is unresolved: sceneLeftToRowsVisibleMs is 8813ms (seymour-flux), 8273ms (ffx2-bahamut), 7095ms (braskas-final-aeon) and 11917ms (yojimbo-cavern, the new chapter, the worst measurement yet). This is STALLED and belongs to delivery's 'measured loading' scope even though round 11 filed it under feel; I am cross-referencing it, not re-scoring it twice. AGAINST: CHK-024 (save/settings survive an actual upgrade) is now UNVERIFIED for a fourth consecutive review with zero player-path progress -- SaveData.ts and saveMerge.ts are byte-identical 76f587c3..5be4babe (git diff --stat empty), so no new persistence risk was introduced this round, but the required fixture-based upgrade matrix (a previous release's localStorage loaded before boot, invalid/truncated storage, reload mid-battle) has still never been run once. A mandatory check with four straight UNVERIFIED reviews is itself an evidence-process failure that blocks milestone acceptance regardless of how safe the unchanged code looks. Frame-time/fps and any spike measurement remain completely UNVERIFIED (no profiler in this round's harness, same gap as round 11). Only headless Chromium at 1600x900/2000x1012/390x844 ran; Firefox, Edge, Safari, a real phone, touch and a controller are UNVERIFIED, unchanged since round 11. Round 11's dead-payload finding (R11-PD-02, ~34% unreferenced art/audio) cannot be reused: src/engine/PaintedArt.ts (the asset loader) is listed as a changed shared system for this build, which invalidates the old measurement per RUBRIC S5, and my own attempt to recompute it from this round's partial route sampling against the shipped manifest produced an inflated, methodologically unsound number (many unrequested files are simply poses/actions no sampled route happened to trigger, not proven-dead payload) -- I am not reporting that number and list a proper re-measurement in capturesNeeded instead of manufacturing a figure. Net: real CHK-022 gains (ch III unblocked, ch IX delivered clean, ch V's loss half covered) and a first real loading-time dataset move the score up from round 11's 7.9, but the still-completely-unproven CHK-024 obligation across four reviews, the confirmed-not-improved first-menu stall, and the unchanged cross-browser/device and frame-time gaps hold it well under 9.0. CHIEF NOTE: the CHK-024 gap is recorded as PR-0195 (process) and in requiredNotTested rather than as a major player defect; the first-menu stall is scored under feel as PR-0061 and only cross-referenced here. No rescore.

## Target gate

- Required 64, matched 53, failing 6, unverified 5, waiting on a decision 9.
- required = matched + failing + unverified; waiting counted separately. The auditor counted 45/6/13 before the gap pass; the chief moved the 8 tiles the gap pass matched on live (gapPassMatched) from unverified to matched. The failing tiles are the ones the auditor's issues name; the auditor did not list them by tile. Excluded: rejected tiles, audio and key-art tiles, locked Chapter VII.
- Auditor count before the gap pass: {"required":64,"matched":45,"failing":6,"unverified":13,"waiting":9}.
- Matched by the gap pass: pause: Chapter I hero plate (with H, 1600 and 2000); pause: all hero plates (Chapters V and VI added; II, III, IV, VIII, IX by the auditor); portrait: Paine; portrait: Yuna (FFX-2); portrait: Young Auron; portrait: Brother (FFX-2); chapters: the Evrae order widget (cost preview, FAR frame); Chapter IX: the Zanmato gauge full state with its one-shot banner.
- Failing: presentation/Battle HUD, FFX (R13-04, Chapter VIII); presentation/Battle HUD, FFX-2 (PR-0035); fight/Targeting s1 (PR-0031, PR-0178); fight/Targeting s2 (PR-0031); chapters/Vegnagun's parts (PR-0095); presentation/Battle HUD on a phone, D-140 (PR-0001).
- Still unverified: Swordplay Overdrive overlay (PR-0128: Tidus's Overdrive never charged); Targeting s3 on a Bulwark or Redoubt (PR-0095); Shuyin in battle (cast); Shuyin speaker portrait; Fayth boy speaker portrait.
- Approved art: 185 of 185 approved files byte-identical in the live manifest and decoding (critic/rounds/round-12/targets/hashcheck-live.json).
- Composites: critic/rounds/round-12/targets/*.jpg (64 composites).

## Encounters (real input from the title, capture owner)

| Chapter | Real flow complete | Outcome |
|---|---|---|
| seymour-flux | true | defeat, RETRY, then victory (1600x900); five defeats at 2000x1012 |
| yunalesca | true | victory |
| braskas-final-aeon | true | victory on the first attempt |
| ffx2-bahamut | true | victory (1600x900); defeat and RETRY (1600x900, Active); defeat (390x844) |
| ffx2-vegnagun-shuyin | false | defeat twice at the Head link (link 4), each followed by RETRY into a new battle |
| ffx2-leblanc | true | victory |
| seymour-anima-macalania | false | NOT APPLICABLE: locked |
| evrae-airship | true | victory |
| yojimbo-cavern | true | victory at 1600x900, 2000x1012 and 390x844; three defeats in the Zanmato and aeon probes, each followed by RETRY |

- **seymour-flux.** FFX, Chapter I, seed 1. The 1600x900 route ran title, briefing ('Eight fights'), board, prep (Esc back, then re-enter), the pre-scene (Esc pause, Enter, hold-skip), a loss, the Defeat results, RETRY, a win in 46 commands, the aftermath (Seymour), results (Victory NEW BEST, AP 10,000), the board, and a reload that keeps the clear (seymour-flux-win-r5-1600/). At 2000x1012: r1 stalled for 20 minutes because the harness did not confirm the new Ronso Rage chooser (a harness cause, see R12-01 and rage-*/). r2 to r4 were real defeats, each reaching RETRY into a new fight. Aeon Overdrives played: Mega Flare, Energy Ray and Meteor Strike. The loss rate matches carried PR-0008.
- **yunalesca.** FFX, Chapter II, 1600x900, seed 1, 174 commands in 12:53. Both form changes are in the log (form-change seq 457 and 941). There were 5 summons and 5 aeon Overdrives, and no aeon used an item. After the fight: results (Victory, AP 14,000), the CONFIRM scene (Yunalesca), the board, and a reload that keeps the clear. The pause CHAPTER tab was probed separately at 1600 and 2000 (pause-chapter-yunalesca-*): the snapshot is now three thumbnails, so PR-0152 is repaired. Evidence: yunalesca-win/.
- **braskas-final-aeon.** FFX, Chapter III, 1600x900, seed 1, 333 real-key commands in 25:59. The chain ran links 1 to 7: BFA, then possessed Valefor, Ifrit, Ixion, Shiva and Bahamut, then Yu Yevon. Every seam has a frame sequence and a first-menu capture. There were 23 Doublecasts through Special > Doublecast, and each hit twice. After the fight: the post scene, results (Victory NEW BEST), the CONFIRM scene (Rikku), the board, and a reload that keeps the clear. PR-0082 is repaired on live. Music: boss-jecht, then silence at link 2 while valefor-enters owns the cue (by design), then boss-yu-yevon through links 3 to 7, then victory-ffx. PR-0129 routing holds. Target single, target all and cancel were probed separately (target-braskas-final-aeon-1600x900/). Evidence: braskas-final-aeon-win/.
- **ffx2-bahamut.** FFX-2, Chapter IV, seed 1. Win: 51 commands, the aftermath (Rikku '...Yunie.'), results that stay silent by design, the board and a reload (ffx2-bahamut-win/). Loss: in pause OPTIONS, X-2 BATTLE was flipped from WAIT, the shipped default, to ACTIVE with real keys. The party then idled to Defeat, and RETRY led to prep and a new battle (ffx2-bahamut-lose/). The 390x844 run lost because the phone advisor cards carry no 'in <menu>' directions (carried PR-0126), so the harness could not follow them (ffx2-bahamut-win-look-phone/). The spherechange was refused in this run: Paine was Cursed, which is correct. The spherechange is covered in Chapters V and VI instead.
- **ffx2-vegnagun-shuyin.** FFX-2, Chapter V, seed 1. Real keys at 2000x1012 (45:37, 299 commands) and at 1600x900 (41 min, 301 commands). Both runs went through links 2 to 4 with seam sequences and a spherechange (Paine Dark Knight > White Mage). Both lost on the Head: Acta Est Fabula (a 9,999 heal) was cast 20 to 23 times and Mors Certa 28 to 34 times. In round 11's win on 76f587c3 those counts were 12 and 4. This matches the builder's own bench for the new Wait split default (72b79a04: 5 wins in 40 at 1.5 s on the top-level list). Because of that default change, the win path (link 5 Shuyin, aftermath, victory results) is UNVERIFIED on this build, and round 11's win cannot be reused. See R12-02. Set to false by the chief critic: the route reached its outcome only as a defeat (results, RETRY into a new battle) in three live runs; link 5, the victory aftermath and the saved clear were never reached on this build, and CHK-022 requires a reachable aftermath. The capture owner recorded true.
- **ffx2-leblanc.** FFX-2, Chapter VI, 2000x1012, seed 1, 94 commands. Rikku made a spherechange (Thief > White Mage). Both seams (links 2 and 3) have sequences. After the fight: results (Victory NEW BEST), the CONFIRM scene (Rikku), the board and a reload. Leblanc's idle now holds the fan open (zoom-leblanc-fan-link3.png), so PR-0096 is repaired. Steal probe (ffx2-leblanc-steal/, 1600x900): the banner read 'Rikku STOLE BUDGET GRENADE!', then 'DR. GOON HAS NOTHING LEFT TO STEAL', then 'STOLE X-POTION!'. That repairs PR-0143 and verifies the steal names. The cues are still Chapter IV's (carried PR-0099).
- **seymour-anima-macalania.** FFX, Chapter VII is a COMING card. The arrow keys skip it by design (stepSelection), so the release-15 Chapter VII fixes, Anima's approved paintings and the party's own summoned Anima cannot be reached on live. No playable roster owns Anima: Chapters II and III summon Valefor to Bahamut only. Petrify did land once in Chapter III (Auron), but no frame caught the stone look, so it is UNVERIFIED.
- **evrae-airship.** FFX, Chapter VIII, 2000x1012, seed 1, 66 commands in 4:20. Wakka's Element Reels and Tidus's Spiral Cut Overdrives played. After the fight: results (Victory NEW BEST, AP 5,400), the CONFIRM scene (Wakka 'It just... dropped.'), the board and a reload. The pause CHAPTER tab was captured at 1600x900. R13-04 (the stack over Tidus) is known and disclosed and was not re-measured.
- **yojimbo-cavern.** FFX, Chapter IX (new), seed 1. The win is by Kimahri's Doom: title, board, prep (Esc back), the arrival scene (Esc pause, hold-skip), then 16 commands, Doom count 5 to 0, the post scene with Ginnem and the sending, results (Victory, AP 0 and Gil 0, which is sourced), the board and a reload. Folders: yojimbo-cavern-win-1600/, yojimbo-cavern-win/ (holds the 2000x1012 run, which overwrote the first 1600 run) and yojimbo-cavern-win-phone/. Zanmato fired in probe r3: the gauge went from 100 to 0 with cause 'zanmato' (seq 309) and the party took 9,999 each (seq-zanmato/). An aeon taking Zanmato stayed UNVERIFIED: in three attempts all five aeons fell before the gauge reached 100. The aeon menu is Attack / Overdrive / Aeon / Dismiss with no Items row, so PR-0155 is repaired. Pause works in Chapter IX with Esc, P and the mouse PAUSE chip, over the scene and in battle. The Attack on Yojimbo fires without a target step (carried PR-0170). Gap pass: An aeon absorbed Zanmato live (Valefor, gaps/ch9-aeon-r5); the Doom kill logged in full (gaps/ch9-doom); all 13 aftermath lines read live.

## Checks

Mandatory = the checks critic/pending/5be4babe.json selected (CHK-002 to CHK-023). Several reviewers recorded the same check from different evidence; all records are kept.

| Check | Result | Mandatory | Recorded by | State |
|---|---|---|---|---|
| CHK-015 | PASS | yes | capture owner |  |
| CHK-016 | PASS | yes | capture owner |  |
| CHK-022 | UNVERIFIED | yes | capture owner |  |
| CHK-017 | PASS | yes | capture owner |  |
| CHK-021 | PASS | yes | capture owner |  |
| CHK-023 | PASS | yes | capture owner |  |
| CHK-011 | PASS | yes | capture owner |  |
| CHK-019 | PASS | yes | capture owner |  |
| CHK-021 | PASS | yes | combat-encounter auditor | all changed combat subsystems, both games |
| CHK-023 | PASS | yes | combat-encounter auditor | ch3, ch5, ch6, ch9 live real-key runs |
| CHK-023 | UNVERIFIED | yes | combat-encounter auditor | ch4 default Wait; ch9 aeon route |
| CHK-022 | PASS | yes | combat-encounter auditor | all eight listed chapters |
| CHK-008 | FAIL | yes | visual-targets auditor | FFX ch1, ch3, ch8, ch9 first menu, target selection, party and enemy action sequences; FFX-2 ch4, ch5 links 2-4, ch6 lin |
| CHK-011 | FAIL | yes | visual-targets auditor | default framings, target states and action frames in ch1-6, ch8 and ch9; phone ch4 and ch9 |
| CHK-012 | FAIL | yes | visual-targets auditor | chapter cards, briefings, prep, HUD chips, turn order, dialogue speakers, pause, results; all runs |
| CHK-013 | PASS | yes | visual-targets auditor | approved art rendered in battle, dialogue, pause, results and front end at 1600x900, 2000x1012 and 390x844 |
| CHK-014 | PASS | yes | visual-targets auditor | every captured formation in ch1-6, ch8, ch9, aeon entrances (ch9 Bahamut), KO poses, cutscene staging |
| CHK-022 | PASS | yes | feel-narrative auditor | FFX ch1 seymour-flux: loss, RETRY, win, aftermath, results, board, reload |
| CHK-022 | UNVERIFIED | yes | feel-narrative auditor | FFX ch2 yunalesca: win path complete, loss path not run |
| CHK-022 | PASS | yes | feel-narrative auditor | FFX ch3 braskas-final-aeon: win through 7 links to post scene, results, epilogue, board, reload |
| CHK-022 | UNVERIFIED | yes | feel-narrative auditor | FFX ch3 braskas-final-aeon: loss and retry |
| CHK-022 | PASS | yes | feel-narrative auditor | FFX-2 ch4 ffx2-bahamut: win, aftermath, silent results, board, reload; Active-mode defeat, RETRY, new battle |
| CHK-022 | UNVERIFIED | yes | feel-narrative auditor | FFX-2 ch5 ffx2-vegnagun-shuyin: loss after 4 seams reaches RETRY; win not reached on this build |
| CHK-022 | UNVERIFIED | yes | feel-narrative auditor | FFX-2 ch6 ffx2-leblanc: win with two seams, results, aftermath, board; loss not run |
| CHK-022 | UNVERIFIED | yes | feel-narrative auditor | FFX ch8 evrae-airship: win path complete; loss not run |
| CHK-022 | PASS | yes | feel-narrative auditor | FFX ch9 yojimbo-cavern (new): win by Doom at 2000x1012, 1600x900, 390x844; Zanmato defeat and RETRY |
| CHK-015 | PASS | yes | feel-narrative auditor | all played chapters: pre-scene hold-skip, Esc over a scene, RETRY |
| CHK-023 | PASS | yes | feel-narrative auditor | mid-battle story beats through the real presenter path, ch1, 2, 4, 5, 6, 8 and ch3 link 1 |
| CHK-023 | UNVERIFIED | yes | feel-narrative auditor | ch3 possessed-aeon gauntlet beats (valefor-enters .. yu-yevon-arrives), ch9 (none built) |
| CHK-007 | FAIL | yes | feel-narrative auditor | player-facing narrative copy: ch6 aftermath (carried PR-0102); ch9 card, prep, briefing, guide |
| CHK-021 | PASS | yes | feel-narrative auditor | narrative game split: ch9 FFX grammar and grim tier; ch4 silent results; FFX-2 quips separate |
| CHK-016 | PASS | yes | feel-narrative auditor | integrity of the sequences and stills used for feel and narrative |
| CHK-B2 | UNVERIFIED | no | feel-narrative auditor | human feel judgment of Chapter IX, Zanmato and the loading changes |
| CHK-001 | FAIL | no | audio auditor |  |
| CHK-019 | PASS | yes | audio auditor |  |
| CHK-021 | PASS | yes | audio auditor |  |
| CHK-023 | PASS | yes | audio auditor | Chapter 3 (FFX, Braska's Final Aeon): chain-entrance ownership after PR-0129's fix |
| CHK-023 | UNVERIFIED | yes | audio auditor | Chapter 5 (FFX-2, Vegnagun/Shuyin): boss-shuyin single-start after PR-0129's fix |
| CHK-B1 | UNVERIFIED | no | audio auditor |  |
| CHK-002 | UNVERIFIED | yes | interface-onboarding auditor | pause over battle and over a pre-battle scene; FFX Ch I/II/VIII/IX, FFX-2 Ch IV |
| CHK-003 | FAIL | yes | interface-onboarding auditor | first command menu, all FFX chapters; phone battle, phone results in Ch IV and IX |
| CHK-004 | FAIL | yes | interface-onboarding auditor | every advisor decision on the guided real-key routes |
| CHK-005 | UNVERIFIED | yes | interface-onboarding auditor | Ch I Kimahri with Yuna KO'd; Ch III; Ch V link 4 |
| CHK-006 | FAIL | yes | interface-onboarding auditor | FFX first menu after E; FFX-2 first-turn coach; target cancel |
| CHK-007 | FAIL | yes | interface-onboarding auditor | pause CHAPTER tab; intent; guide; advisor |
| CHK-008 | UNVERIFIED | yes | interface-onboarding auditor | first command menus |
| CHK-009 | FAIL | yes | interface-onboarding auditor | FFX-2 command menu; pause CHAPTER; advisor; phone pause; prep |
| CHK-010 | UNVERIFIED | yes | interface-onboarding auditor | target step in Ch III (FFX) and Ch VI (FFX-2) |
| CHK-015 | FAIL | yes | interface-onboarding auditor | real keys and mouse on the live bundle, all chapters |
| CHK-020 | PASS | yes | interface-onboarding auditor | prep, pause, command menu, intent, advisor, guide, results; FFX Ch I/II/III/VIII/IX and FFX-2 Ch IV/V/VI |
| CHK-017 | PASS | yes | prep-delivery auditor | live URL, whole artifact, 2026-09-25T05:54:55Z deploy window |
| CHK-019 | PASS | yes | prep-delivery auditor | whole artifact at deploy |
| CHK-016 | PASS | yes | prep-delivery auditor | capture owner's evidence index, round 12 |
| CHK-022 | PASS | yes | prep-delivery auditor | FFX ch III braskas-final-aeon, 1600x900, seed 1, real keys, 333 commands, 25:59, links 1-7 |
| CHK-022 | PASS | yes | prep-delivery auditor | FFX ch IX yojimbo-cavern, 1600x900 and 2000x1012 and 390x844, seed 1 |
| CHK-022 | UNVERIFIED | yes | prep-delivery auditor | FFX-2 ch V ffx2-vegnagun-shuyin, 1600x900 and 2000x1012, seed 1 |
| CHK-024 | UNVERIFIED | no | prep-delivery auditor | save/settings upgrade matrix |
| CHK-015 | PASS | yes | prep-delivery auditor | prep enter/Esc-back/re-enter, RETRY into a new fight, results CONFIRM, board after reload |
| CHK-023 | PASS | yes | prep-delivery auditor | results/rewards, FFX ch III and ch IX |
| CHK-023 | UNVERIFIED | yes | prep-delivery auditor | FFX-2 ch V results screen wording |
| CHK-018 | PASS | yes | prep-delivery auditor | art/audio path resolution at runtime |
| CHK-021 | PASS | yes | prep-delivery auditor | prep and results screens, presence/absence per game |
| CHK-023 | PASS | yes | gap pass | FFX-2 Ch IV, 1600x900, default Wait |
| CHK-023 | PASS | yes | gap pass | FFX Ch IX, 1600x900 |
| CHK-023 | PASS | yes | gap pass | FFX Ch IX, 1600x900 |
| CHK-022 | PASS | yes | gap pass | FFX Ch II, III, VIII, IX; FFX-2 Ch VI |
| CHK-022 | UNVERIFIED | yes | gap pass | FFX-2 Ch V, 1600x900, default Wait |
| CHK-002 | FAIL | yes | gap pass | pause over battle, Ch I, IV, IX, V, VI, II at five shapes |
| CHK-003 | FAIL | yes | gap pass | first menu and pause at five shapes, both games |
| CHK-008 | FAIL | yes | gap pass | Ch I, IV, IX first menu and action at 1280x960, 2560x1080, 2560x1440, 3840x2160 |
| CHK-010 | UNVERIFIED | yes | gap pass | Ch VI and Ch III at 1280x720 and 2560x1440 |
| CHK-013 | PASS | yes | gap pass | dialogue, 1600x900, Ch II, III, IV, VI |
| CHK-B2 | UNVERIFIED | no | gap pass | Ch IX |
| CHK-B1 | UNVERIFIED | no | gap pass | all cues |

- **CHK-015 PASS** (capture owner): Every player-facing key in scope produced its state change on the production bundle. Two input defects remain: P opens the pause but does not close it (pCloses=false in all runs, carried PR-0115), and Kimahri's OVERDRIVE ignores the first Enter (R12-01). No gamepad or touch-device evidence.
- **CHK-016 PASS** (capture owner): Three harness limits are disclosed here and are not game defects. (1) The route harness counts targets with [data-target-id], which only clickable targets carry, so its 'targets:0' readings and its target steering are void; target.mjs used .ffx-target and .ffx2-tplate instead. (2) The 2000x1012 Chapter IX run reused and overwrote the folder of the first 1600 run; the index takes the last write and the 1600 run was redone as yojimbo-cavern-win-1600/. (3) The first Chapter I 2000 run stalled on a waiting overlay because of the harness, not the product; the harness was patched and the run redone.
- **CHK-022 UNVERIFIED** (capture owner): 7 of the 8 playable chapters went from the title through win, aftermath, results, board and reload with real keys. RETRY was taken at least once per game (FFX: Chapters I and IX; FFX-2: Chapters IV and V). Chapter V reached its outcome only as a defeat (results, then RETRY into a new battle): the Shuyin link, the victory aftermath and the saved clear were not reached on this build, and round 11's win on 76f587c3 cannot be reused because the FFX-2 Wait default changed (72b79a04). Chapter VII is locked (NOT APPLICABLE).
- **CHK-017 PASS** (capture owner): Load time was measured on this machine's unthrottled network with an empty cache. Another process held the GPU at about 90 percent during the latency runs. No throttled-network, Safari, Firefox or real-phone evidence.
- **CHK-021 PASS** (capture owner): Each release-15 change showed up in its own game only. The FFX side of the FFX-2 message-line change was not separately inspected.
- **CHK-023 PASS** (capture owner): Steal was reached through Rikku's real Skill > Steal menu path. The engine message and the HUD banner agree.
- **CHK-011 PASS** (capture owner): Each targetable enemy received a bracket or a plate when the target moved (3 of 3 in Chapter III and in Chapter VI).
- **CHK-019 PASS** (capture owner): The decode check comes from the deploy tool's manifest, confirmed on the live copy. Agents cannot listen.
- **CHK-021 PASS** (combat-encounter auditor): Every src commit in 76f587c3..5be4babe states its game case (FFX only / FFX-2 only / both); none is missing one. Engine-level presence and absence are pinned by tests: ffx-no-active-clock (the Wait split is absent from FFX), ffx-aeon-no-items (FFX only; FFX-2 has no aeons), ffx2-magic-never-misses (FFX-2 hit.ts only; FFX keeps accuracy.ts), and yojimbo-* (FFX only). Live: aeon rows show no Items in ch9. The FFX-2 X-2 BATTLE option appears only in FFX-2 pause OPTIONS (capture 14-pause-options on ch4).
- **CHK-023 PASS** (combat-encounter auditor): Changed combat subsystems are invoked by the normal runtime with the expected data, from capture event logs on live 5be4babe: Yojimbo gauge events (targeted +3, attacking +2, zanmato 100->0); Ronso Rage minigame-request with the engine ids [jump, doom], then Doom count 5 ticking on Yojimbo's turns to a victory; Zanmato 9,999 on each live party member; aeon menus Attack/Aeon/Dismiss with no Items (PR-0155); the FFX-2 steal banner names the item (Budget Grenade, X-Potion; PR-0143); no magical-row evasion in 21,523 ch5 events (PR-0154); Doublecast hits twice in ch3.
- **CHK-023 UNVERIFIED** (combat-encounter auditor): No live capture instruments the FFX-2 Wait split's menu-level relay (FFX2BattleHud.onMenuLevel -> presenter -> FFX2Engine.setMenuLevel), so it is not shown live that the clock runs at the top list and holds in a submenu. It is proven only by unit tests (ffx2-wait-split 13, ffx2-wait-split-presenter 4) and a code trace. The same gap leaves the live aeon absorbing Zanmato unseen: every live aeon was KO'd before Zanmato, and the captured battle logs end before the Zanmato and Doom-KO events.
- **CHK-022 PASS** (combat-encounter auditor): Combat and encounter outcome coverage reused from the capture owner, live, real keys from the title. Victory: ch2, ch3, ch4, ch6, ch8, ch9 (at 1600, 2000 and 390x844). Defeat then Retry into a new fight: ch1, ch4 (Active), ch5 (twice), ch9 (Zanmato). Every outcome reached results, then the board or party prep. Only the combat and encounter reading is taken here; the delivery judgment belongs to its auditor. Reused from round-12 capture owner (same build 5be4babe): Same round, same live artifact 75a8050b; no code change between capture and this audit.
- **CHK-008 FAIL** (visual-targets auditor): Panels still intersect painted actors: (1) Ch1 target selection on Mortiorchis: the 'Mortiorchis' name plate is drawn over Yuna's head at 1600 and over her face at 2000 (R12-VIS-01, new). (2) Ch1 Seymour's action on Yuna and Tidus's Hastega: the Seymour Flux info card covers Yuna's body, and Seymour himself is under the turn-order column (PR-0157, narrowed; Tidus is now clear). (3) Ch8: the command stack covers Tidus (R13-04, disclosed). (4) Ch5 link 3: the command window covers Vegnagun's forelegs (the Bulwarks). (5) Phone ch9: the party status rows sit over Yojimbo's lower body. Phone ch4: the help band runs across Bahamut. Clear this round: - the ch1 and ch3 stack against Yuna; - the cut-in against the command menu; - the ch6 intent card against Leblanc's fan; - the ch9 first menu at 1600 and 2000; - the pause stats against faces in ch9 and ch6. The declared permitted overlaps were not measured numerically. 1280x720 and 2560x1440 were not captured.
- **CHK-011 FAIL** (visual-targets auditor): In the default framing, every targetable enemy is identifiable: - ch1: Seymour and Mortiorchis; - ch3: the Final Aeon, both Yu Pagodas and the possessed aeons in links 2-7; - ch5: the Nodes as edge markers; - ch6: the goons, Ormi, Logos and Leblanc; - ch8: Evrae; - ch9: Yojimbo and Daigoro. The check fails on these points: (a) The party rule: Tidus is under the ch8 stack (R13-04). On a phone, ch4 shows only Paine and the ch9 midfight shows only Yuna (PR-0017). (b) Ch5 link 3: the Bulwarks are Vegnagun's painted forelegs, and the command window covers their lower part. No Bulwark ring or plate is visible at 1600 or 2000. (c) Ch3: while BFA is targeted, the Sensor card covers about half of Yu Pagoda B (polish).
- **CHK-012 FAIL** (visual-targets auditor): The cold-launch fallbacks are gone on every captured fresh profile (PR-0065 repaired). All 17 briefings show Auron and the backdrop, and all 15 desktop chapter cards show painted party busts, including ch8's Wakka and Rikku. The ch9 speakers (Lulu, Wakka, Tidus, Auron, Rikku, Kimahri, Yuna) load their painted portraits. Yojimbo's turn-order tile is cut from his own painting (D-054). The remaining fallback is PR-0176: aeon turn-order tiles still render ink letter chips ('I' for Ifrit, 'B' for Bahamut in ch9). That is a monogram shipped as the final face (polish).
- **CHK-013 PASS** (visual-targets auditor): Protection holds: 185 of 185 approved files are byte-identical on live, and every one decodes. The approved art renders as picked: - Leblanc's fan-open idle (PR-0096 repaired); - the Yojimbo painting and longer-blade cast; - Daigoro B; - Ginnem B with its glow on the cutscene stage; - the cold chamber A; - the ch9 hero plate B; - Shiva and the possessed aeons in ch3; - the goons, Nooj, Braska, Rikku-x2 and Yunalesca. Polish notes that do not fail protection: - the sakura overlay shows a straight side cut and floats above the horizon in the arrival shot (R12-VIS-02, rendering only); - Bahamut's matte holes (PR-0137, not an approved file). PR-0164 (Yunalesca hair edge) was not re-captured.
- **CHK-014 PASS** (visual-targets auditor): Facing and staging look right in every captured frame: - Enemies face the party in every chapter, including Yojimbo and Daigoro in ch9 and every possessed aeon in ch3. - Party members face the enemy side. - The aeon summoned in ch9 (Bahamut) stands with the party and faces Yojimbo. - KO'd FFX party members lie on the floor rather than floating (ch9). FFX-2 KO was not captured. - Ginnem's standing pose reads correctly on the cutscene stage. The numeric manifest-facing cross-check is still missing for 16 subjects (PR-0044), so this check is visual only.
- **CHK-022 PASS** (feel-narrative auditor): At 1600x900, seed 1: a defeat, then RETRY to prep (3.1 s) and to the battle (1.7 s), then a victory in 46 turns. The aftermath scene came after CONFIRM, then the results ('...Okay. Next one.'), the board, and a reload that keeps the clear. The 2000x1012 runs r2 to r4 are three more defeat-to-RETRY loops.
- **CHK-022 UNVERIFIED** (feel-narrative auditor): The win passes: 174 turns, both form changes, results, the aftermath after CONFIRM, the board, and a reload. The loss and RETRY path was not run on 5be4babe. Round 11 cannot be reused because the presenter and lifecycle changed.
- **CHK-022 PASS** (feel-narrative auditor): Won on the first attempt with 333 real-key commands. The route reached the post scene, the results, the CONFIRM epilogue ('Is that it? Did we—') and the board. PR-0082 is repaired. The loss path on this build is recorded separately.
- **CHK-022 UNVERIFIED** (feel-narrative auditor): No Chapter III defeat was run on 5be4babe. Round 11's two losses ran on 76f587c3, before the presenter, departure and recall changes, so they are not reused.
- **CHK-022 PASS** (feel-narrative auditor): Both destinations were reached with real keys at 1600x900. The results carry the 'Results' heading and no quip, as writing-bible section 5.4 requires for E6.
- **CHK-022 UNVERIFIED** (feel-narrative auditor): The loss path passes. Two runs (46.5 and 42.2 min) reached all 4 seams, lost, and went through RETRY to prep and the battle. The win, the aftermath and the seam scenes were not reached or captured on 5be4babe. Which link RETRY restarts from was not recorded.
- **CHK-022 UNVERIFIED** (feel-narrative auditor): The win passes at 2000x1012: 94 turns, 2 seams, results ('We got it back.'), then the aftermath scene. The loss path was not run on this build. The FFX-2 HUD message change stops round 11's loss evidence from being reused.
- **CHK-022 UNVERIFIED** (feel-narrative auditor): The win passes: 66 turns, results, the aftermath scene, the board and a reload. The loss and RETRY path is still not run by the critic's capture.
- **CHK-022 PASS** (feel-narrative auditor): All three wins reached the post scene, the results (no quip, as the grim tier requires), the board and a reload that keeps the clear. r3 fired Zanmato (gauge 100 to 0) and reached the Defeat results, then RETRY to party prep. r2 was a plain defeat that also reached RETRY.
- **CHK-015 PASS** (feel-narrative auditor): This covers skip and replay from the feel side only. In all 17 runs one Enter hold skipped the scene (it takes 1.3 to 1.7 s to leave it), and Esc over the scene opened the pause. RETRY reached prep and then the battle without replaying the scene. The pause key matrix belongs to the interface auditor.
- **CHK-023 PASS** (feel-narrative auditor): The script-trigger events are in the real-key battle logs: seymour-lance; yunalesca-form-2, form-3, first-zombie, mega-death and last-quarter; bfa-talk, bfa-low, bfa-sword and jecht-falls; first-mega-flare-countdown, bahamut-half and bahamut-low; shuyin-line-1 to 3 and jecht-no-overtime; first-not-so-mighty-guard, logos-down and ormi-down; evrae-first-inhale, out-of-breath, cid-first-volley and haste-phase.
- **CHK-023 UNVERIFIED** (feel-narrative auditor): These are presenter-side 'mid' triggers (hp-below and ko), not engine script-triggers, so the battle log does not record them. Only valefor-enters is indirectly evidenced, by the music going silent at link 2. No frame or text of the gauntlet lines exists, because the seam sequences start at link change and the lines fire at the first hit. Chapter IX has no mid-battle beats; D-068 is gated on Bailey.
- **CHK-007 FAIL** (feel-narrative auditor): This FAIL is carried only. The '*better*' asterisks are still in the Leblanc aftermath line at 5be4babe; that line was traced in source, not captured on screen. The Chapter IX strings are clean. The guide's 'ffx-yojimbo §...' citations are the allowed guide citations. The briefing's 'read the list' refers to the CTB turn order and was deliberately kept (commit 777cde81).
- **CHK-021 PASS** (feel-narrative auditor): Chapter IX is written as FFX only, with its source and FFX cutscene grammar, and has no victory quip (grim tier). Chapter IV keeps its 'Results' heading and no quip. The FFX-2 chapters keep their own quip bank ('We got it back.').
- **CHK-016 PASS** (feel-narrative auditor): Every sequence I used asserts screen=battle, and every still asserts its screen. Two harness defects were excluded from product judgment. yojimbo-cavern-zanmato-aeon/seq-summon records 3.35 s of the Summon list with nothing happening (mistimed; r3's sequence was used instead). yojimbo-cavern-zanmato-aeon/11-aeon-menu.png is labelled as the aeon menu but shows the Summon list.
- **CHK-B2 UNVERIFIED** (feel-narrative auditor): No play session by Bailey is recorded for 5be4babe. Agents measure timing; they do not judge feel.
- **CHK-001 FAIL** (audio auditor): Technical measurement is clean (see CHK-019), but the check's own pass/fail bar is 'qa strict green AND the owner has signed off on the audition list for the cues in this build.' Neither holds: node tools/audio/qa.mjs --strict exits 1 (52 orphan candidate files under public/audio/candidates, 34.2 MB, not in the manifest — same defect as round 11, PR-0100), and docs/audio/OWNER-VERDICT.md carries no sign-off for any cue shipped in this build, including the new boss-yojimbo (only a 2026-09-24 'accepted on recommendation, not by ear' entry for the O-6 sketch, explicitly 'not a finished, composed or wired cue').
- **CHK-019 PASS** (audio auditor): Every shipped audio file decodes; nothing is silent or clipped. Freshly re-run against the exact reviewed build, not reused.
- **CHK-021 PASS** (audio auditor): FFX chapters (Seymour Flux, Yunalesca, Braska's Final Aeon, Evrae, Yojimbo) request only FFX and shared cues (title, chapter-select, pause, sprite) plus their own scene/boss/victory-ffx cues; FFX-2 chapters (Bahamut, Vegnagun/Shuyin, Leblanc) request only FFX-2 and shared cues, ending on victory-ffx2 where a fanfare plays at all.
- **CHK-023 PASS** (audio auditor): Live evidence confirms the PR-0129 fix: silence at link 2 (Valefor) as designed, then a single continuous boss-yu-yevon from seam-3 through seam-7 with no boss-jecht return, matching the new audio-chain-entrance-owner.test.ts guarantee run on this build's source.
- **CHK-023 UNVERIFIED** (audio auditor): The fix is in code (MusicPhaseCue.track widened to allow null, cueForGroup change, commit 1ac99739) and covered by a real-chain unit test, and the builder's own round-11 real-key proof (docs/screenshots/round11/pr0129-*) shows boss-shuyin starting once and holding. But round-12's own two independent live attempts at Chapter 5 (both directories misleadingly named '-win') both ended in defeat at Vegnagun's head (turn ~235/299), never reaching Shuyin's seam, so no independent live sample this round shows the fixed routing at that seam. Not a regression finding — simply not exercised live this round.
- **CHK-B1 UNVERIFIED** (audio auditor): No numeric owner verdict exists for the shipped score, including the new boss-yojimbo cue. docs/audio/OWNER-VERDICT.md's most recent entries are all 'accepted on recommendation, not by ear'; the standing direction verdict from 2026-09-19 ('Right direction, keep refining') is explicitly not a score. I did not and cannot listen.
- **CHK-002 UNVERIFIED** (interface-onboarding auditor): Judged by eye only. The pause plate fills the window at 1600x900, 2000x1012 and 390x844 in Ch I, VIII, IX and IV, and the slid FFX-2 plate feathers. No getBoundingClientRect, currentSrc or scrollWidth measurement was taken. The 1280x720, 2560x1080 and 3840x2160 fresh contexts were not captured.
- **CHK-003 FAIL** (interface-onboarding auditor): The advisor card's small labels measure 12.2 effective px, under the 14 px floor, at 1600x900 and 2000x1012 in Ch I, II, III, VIII and IX (run.json focFirst.advisorMinEffPx; FOC-06). At 390x844 the battle HUD in both games and the Victory/Defeat results are drawn as a letterboxed miniature at roughly 4 to 7 px (PR-0001/R15-01, widened). No full leaf-text sweep was run on any screen.
- **CHK-004 FAIL** (interface-onboarding auditor): Ownership holds: every named row was an enabled row of the acting character, and the routes executed 15 to 310 picks per chapter through the named menus. The 'says where' half fails. At density 6 the card drops 'in <menu>': 60 of 60 phone picks in Ch IV, and Ch IX on the phone. On desktop: Ch I at 1600 (Fire Gem x2, Ice Gem x2, Dispel, Mega Flare), Ch II (Holy Water, Phoenix Down) and Ch V (Darkness x4, Mega-Potion, Lunar Curtain, Potion x3). Traced to src/ui/common/MoveAdvisor.ts:590 and :600 (PR-0126).
- **CHK-005 UNVERIFIED** (interface-onboarding auditor): Positive: on the degenerate Ch I board the card says 'Leave Yuna down for now — a raise brings Yuna back still a Zombie, and Full-Life kills a Zombie outright', the win logs only 1 revive, and Ch III was won following the advisor. Negative and unexplained: two advisor-following Ch V runs lost at link 4 (R12-UI-01). The constructed degenerate-board matrix was not run.
- **CHK-006 FAIL** (interface-onboarding auditor): FFX: after E the advisor card folds and its 'N HIDE MOVES' chip floats alone over the party panel, still saying HIDE (PR-0130, Ch I, 1600). FFX-2: the chip's text still shows through Rikku's first-turn coach card (PR-0110, Ch IV, 1600). Passing: the reticle is gone after Esc from targeting (afterTargetCancel targets 0, target-*/run.json), and the FFX-2 steal banner is replaced line by line.
- **CHK-007 FAIL** (interface-onboarding auditor): The pause SCENE row prints the key 'CAVERN STOLEN FAYTH' (PR-0168, new in Ch IX). Literal '*she*' in the Yunalesca intent (PR-0027). 'Haste is ctb x 8/16' leads the Ch I guide (PR-0026). 'MAX HP X2' / 'Max Hp X2' in the Ch III advisor. The Ch IX intent says 'non-elemental damage to itself' (R12-UI-02). Ch VIII: 'Cid pulls the Tidus's ship' (PR-0162) and 'Pull back → Tidus' (PR-0163).
- **CHK-008 UNVERIFIED** (interface-onboarding auditor): No sprite-projection intersection data was captured. The panel-over-actor findings (PR-0002, R13-04) belong to the visual auditor. By eye, the desktop advisor, intent and guide cards in Ch I, III, IV, VI and IX sit clear of faces at 1600 and 2000.
- **CHK-009 FAIL** (interface-onboarding auditor): Seen truncated: the FFX-2 Change row as 'CHA… CURSED' (Ch IV, 1600); the pause CHAPTER party column as 'DRESSPHE…' (Ch IV, 2000); the advisor effect chip '+ PROTECT, SHELL, NULBLAZE, NULFROST, NULSHOC' cut by the card edge (Ch I, 2000); phone pause 'MASTER VOLUM…', 'CAVERN STO…', 'BOSS HP 100…' and 'GLORIOUS BANG…' (PR-0112); and the Ch VI prep captions (PR-0127). Passing: the CTB and target plates show 'Braska's Final Aeon' and 'Possessed Bahamut' in full.
- **CHK-010 UNVERIFIED** (interface-onboarding auditor): Captured states pass. FFX single target in Ch III at 1600: brackets, the lettered plate 'Yu Pagoda A', the pointing hand, the CTB row lit and the party dimmed. FFX all-allies (Al Bhed Potion): the ALL ALLIES chip and every party row framed. FFX-2 single target in Ch VI at 2000: 'TARGET Dr. Goon' plate, flower reticle and hint bar. Not captured: an FFX-2 multi-target (Grenade → all enemies), an FFX ALL ENEMIES label, and the 1280 and 2560 sizes the check names.
- **CHK-015 FAIL** (interface-onboarding auditor): Working with real input: - Esc opens and resumes the pause at the command menu and over a scene. - P opens the pause. - The PAUSE chip click works, and Enter afterwards reaches the menu. - Q/E tabs, H, E, G and N. - X-2 BATTLE flips with the arrows and Enter. - RETRY reaches prep. Failing: - P never closes the pause (pCloses false in every run). - P over a pre-battle cutscene does nothing (pause-matrix/yojimbo-cavern.json) (PR-0115). - Plausible: the first Enter pressed during an FFX turn cut-in is spent, while the arrows already move the lifted command cascade (R12-UI-04). Not tested: gamepad and touch.
- **CHK-020 PASS** (interface-onboarding auditor): The shared screens match in both games: pause tabs, OPTIONS, CONTROLS, CHAPTER and hide; prep tabs (the differences are the written game differences); the advisor, guide and intent layout; results; and target cancel. The FFX-2 message banner now exists (PR-0143 closed), which removes the largest parity gap. The remaining differences are written game-specific exceptions: the X-2 BATTLE/ATB SPEED rows are FFX-2 only, and FFX folds the intent panel by default.
- **CHK-017 PASS** (prep-delivery auditor): live artifact verified at deploy and independently settled
- **CHK-019 PASS** (prep-delivery auditor): every shipped file decode-checked at deploy, no problems
- **CHK-016 PASS** (prep-delivery auditor): every round-12 capture asserts a screen/state before shooting; 0 stale-root problems across 714 items and 0 fails across all 36 run.json files
- **CHK-022 PASS** (prep-delivery auditor): chapter III (Braska's Final Aeon) reaches victory, aftermath, results, CONFIRM and a reload that keeps the clear for the first time in three reviews
- **CHK-022 PASS** (prep-delivery auditor): new chapter IX (Yojimbo) completes one continuous real-key route from title to a reload that keeps the clear
- **CHK-022 UNVERIFIED** (prep-delivery auditor): loss and retry newly confirmed this round; the win half of chapter V is still not demonstrated on this exact build and round 11's win evidence cannot be reused (presenter/flow files changed)
- **CHK-024 UNVERIFIED** (prep-delivery auditor): SaveData.ts and saveMerge.ts are byte-identical to the round-11 base (no new persistence risk), but the required fixture-based upgrade matrix has never been run in four consecutive reviews; a pass from an unrelated code-identity argument is not a pass. 4th consecutive review with this mandatory check UNVERIFIED.
- **CHK-015 PASS** (prep-delivery auditor): prep Esc-back, RETRY, and CONFIRM all work by real input in every sampled route this round Reused from round-11 report (prep/results/retry scope) plus fresh round-12 confirmation: BattleScreenFlow.ts's retry path (prep Esc back, RETRY -> prep -> new battle) is exercised fresh this round with real keys in 6+ chapters; not a stale reuse, a re-confirmation
- **CHK-023 PASS** (prep-delivery auditor): results and rewards match the real battle outcome and its research source, including two legitimately zero-reward victories
- **CHK-023 UNVERIFIED** (prep-delivery auditor): chapter V's odd reward wording (PR-0138) could not be re-examined because no vegnagun-shuyin attempt this round reached victory
- **CHK-018 PASS** (prep-delivery auditor): no evidence of a broken shipped path surfacing at runtime Reused from round-11 report plus this round's clean network logs: 0 404s and 0 html-typed media across every sampled network-media.json this round is consistent with, and reinforces, round 11's grep-based finding that no shipped path is hand-written onto a variant
- **CHK-021 PASS** (prep-delivery auditor): prep and results screens carry each game's own tabs and vocabulary (SPHERE GRID/EQUIPMENT/OVERDRIVE for FFX, DRESSPHERES/ACCESSORIES for FFX-2) with no cross-game leakage observed in the sampled prepText fields
- **CHK-023 PASS** (gap pass): Live half of the FFX-2 Wait split: on the shipped default (save.settings.ffx2Atb = wait, no ?wait), Yuna's top list held 3,038 ms advanced the engine 5,106 ticks and Bahamut acted; her White Magic submenu held 3,025 ms advanced 0 ticks with every ATB fill frozen. Closes the UNVERIFIED relay record of the combat auditor for the Wait split.
- **CHK-023 PASS** (gap pass): An aeon absorbs Zanmato live: seq 339 gauge 100 to 0 (cause zanmato), 340 action-start Zanmato, 341 damage valefor 9999, 342 ko valefor, 345 dismiss; no party damage. The Bahamut + Shield variant was not reached.
- **CHK-023 PASS** (gap pass): The Doom kill in full: Doom lands at seq 16 (5 turns), ticks 4, 3, 2, 1, 0 (seq 32-152), status expires (153), Yojimbo KO (155), victory (156), 19 turns.
- **CHK-022 PASS** (gap pass): One real-key defeat each in Ch III, Ch II, Ch VIII and FFX-2 Ch VI (Active flipped with real keys), each through Defeat results and RETRY to prep and a new battle in 1.66-1.74 s; Ch IX post scene: all 13 lines read live in script order, then results, board and a reload that keeps the clear.
- **CHK-022 UNVERIFIED** (gap pass): A third real-key Chapter V run lost at link 4 after 38.7 min: link 5 (Shuyin), the victory aftermath and the saved clear are still not reached on this build (PR-0076).
- **CHK-002 FAIL** (gap pass): Passes at 1280x720, 1280x960, 2560x1080 and 2560x1440 (option-B slid plates feather, no hard bar; currentSrc the .2x.webp tier; no horizontal scroll). Fails at 3840x2160 in every chapter captured: the plate stops at 3375x1929 and leaves a hard empty band (PR-0121).
- **CHK-003 FAIL** (gap pass): Leaf-text sweep with transforms: nothing reaches 14 px at any rotated shape (FFX HUD 8.4 px and FFX-2 HUD 7.8 px at 1280x720/960; pause 9.3-9.8 px; 11.7-12.2 px at 2560x1080; 13.3 px at 2560x1440 and 3840x2160). Prep, results and board not swept (FOC-06).
- **CHK-008 FAIL** (gap pass): Deep-rotation shapes keep their composition with no scroll or side bars, but at 1280x960 and 2560x1080 in Ch I the Mortiorchis info card and the party rows sit over Yuna and Kimahri (PR-0157). No action frame exists for Ch IV.
- **CHK-010 UNVERIFIED** (gap pass): FFX-2 all-enemies (Grenade) and all-allies (Light Curtain) and FFX all-allies (Mega Phoenix) pass with explicit labels; the FFX ALL ENEMIES state was not captured (no Black Magic row in the Ch III party). The field label is a fixed 13 px (PR-0193).
- **CHK-013 PASS** (gap pass): Speaker portraits Paine, Yuna (FFX-2), Young Auron, Brother (FFX-2) and Jecht render portrait, name, role chip and line with no crop damage; the Fayth boy is unverified (needs a Chapter V win).
- **CHK-B2 UNVERIFIED** (gap pass): A play session by Bailey on 5be4babe covering Chapter IX from the title is needed; an agent cannot supply it.
- **CHK-B1 UNVERIFIED** (gap pass): No dated owner listening verdict on the finished wired mix including boss-yojimbo; agents cannot hear (AGENTS.md rule 13).

## Coverage matrix

### Tested
- Identity: CHK-017 PASS, live artifact 75a8050b equals critic/artifacts/5be4babe.json (1003 files, decodeChecked, no problems); 0 console errors and 0 responses >= 400 across 34 capture runs; 185/185 approved art hashes.
- Real-key routes on live from the title (gpu, 714 indexed captures, 0 stale roots): wins with aftermath, results, board and reload in Ch I (after a RETRY), II, III (first attempt), IV, VI, VIII and IX (1600, 2000, 390x844); defeats with RETRY in Ch I (x4), IV (Active), V (x3), IX (Zanmato), and by the gap pass in II, III, VIII and VI.
- Probes: Zanmato firing and an aeon absorbing it, the Doom kill logged in full, Steal names, Ronso Rage input, target single/all/cancel, pause CHAPTER at 1600/2000/390 and with H in Ch I, V, VI, the Ch IX pause matrix and scene walk, the Ch VIII Orders widget and FAR range, FFX-2 KO pose, Wait split live (top list vs submenu), cold-load latency, input-to-response latency (median 7.7-8.3 ms).
- Deep-rotation shapes (gap pass): 1280x720, 1280x960, 2560x1080, 2560x1440, 3840x2160 in Ch I, II, IV, V, VI, IX: first menu, pause, type sweep.
- Combat and encounter: unit suite 370 files / 7,002 tests on 5be4babe; data audit of every changed value (Yojimbo, Seymour Flux phase and Mortibsorption, aeon Items, FFX-2 magic hit, steal names, Wait split) against research; 40-seed benches for Ch I, II, III, VIII, IX (FFX) and IV-VI (FFX-2) at five decision times and two Wait readings; engine confirmation of PR-0105 (20/20) and PR-0008 (17/40).
- Visual: 64 target composites, 20 contact sheets and crops. Feel: 28 timed sequences plus the gap pass's 50 ms Zanmato strike and Overdrive sequences. Narrative: Ch IX pre-battle (19 lines) and aftermath (13 lines) read live. Audio (read, not heard): qa.mjs --strict and themes-audit on all 25 cues and the SFX sprite; audioDebug routing in 34 runs.

### Reused, with the dependency argument
- Combat carried polish PR-0145, PR-0106, PR-0107, PR-0108, PR-0069, PR-0054, PR-0053, PR-0124, PR-0007. From critic/rounds/round-11.json (76f587c3). Why: git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; no related fix landed.
- Narrative text findings for Ch I-VI and VIII (PR-0159, PR-0160, PR-0161, PR-0058, PR-0102, PR-0134, PR-0147, PR-0103, PR-0037) and their first aftermath lines. From critic/rounds/round-11.json (76f587c3). Why: git diff -- src/story changes only yojimbo-cavern.ts (new), seymour-anima-macalania.ts (locked) and additive lines in dsl.ts and registry.ts; staging findings were re-observed, not reused.
- CHK-018 (no hand-written shipped path). From critic/rounds/round-11.json. Why: Reinforced by this round's 17 clean network-media logs (0 404s, 0 html-typed media).
- R13-04 measurement. From critic/reviews/1c22066e-focused.json via 5be4babe-focused. Why: Release 15 reverted the Evrae re-lay (a2a1b1f5); the visual auditor re-observed Tidus under the stack on live.
- Audio identity for 24 of 25 cues. From critic/rounds/round-11 audio check. Why: Byte-identical (only manifest.json and boss-yojimbo.mp3 changed); qa.mjs and themes-audit were re-run fresh anyway.

Not reused, because a dependency changed:
- Round 11's Chapter V win (the FFX-2 Wait default and 33+ presenter files changed)
- Round 11 portrait crops (DialogueBox.ts, portrait.ts, portraitHost.ts and face-crops.json changed)
- Round 11's dead-payload figure (the asset loader changed)

### Not tested
- Chapter VII (locked: NOT APPLICABLE): the release-15 Chapter VII fixes, Anima's approved paintings and the party's summoned Anima cannot be reached on live.
- Petrify stone look (Ch III): petrify landed once, no frame caught it.
- Bahamut + Shield absorbing Zanmato (only Valefor unshielded was reached).
- Meteor Strike: NOT APPLICABLE as an Overdrive (Ifrit's Overdrive menu offered Hellfire).
- Ch III epilogue beyond its first line and the possessed-aeon gauntlet dialogue on screen.
- Latency measured alone for Ch II, V, VI and VIII (play-clock figures only).
- R15-02 sakura aborted request (aborted requests not logged).
- The FFX side of the FFX-2 message-line change (separately).
- PR-0018, PR-0123, PR-0144, PR-0063, PR-0014 and 30 carried polish items (listed per issue).
- Milestone gap (not owed by this plan): CHK-B1: owner listening verdict (audio category UNVERIFIED).
- Milestone gap (not owed by this plan): CHK-B2: a Bailey play session on the new Chapter IX.
- Milestone gap (not owed by this plan): CHK-024: save and settings upgrade matrix (fourth review without it; SaveData.ts unchanged in range).
- Milestone gap (not owed by this plan): Performance on named hardware: frame time / 60 fps at 1600x900 and spikes (no profiler ran).
- Milestone gap (not owed by this plan): Firefox, Edge, Safari, a real phone, touch and a real gamepad.
- Milestone gap (not owed by this plan): CHK-023 live: the FFX2BattleHud -> presenter -> FFX2Engine.setMenuLevel relay itself is not instrumented (its effect is now shown live by the gap pass).
- Milestone gap (not owed by this plan): A sound dead-payload re-measurement (PR-0173).
- Swordplay overlay (PR-0128): Tidus’s Overdrive never charged in eight Chapter I routes; Targeting s3 on a Vegnagun part (PR-0095).

### Required and not tested
Owed coverage = the systems, chapters and checks critic-plan / critic/pending/5be4babe.json selected (CHK-002 to CHK-023 over the listed systems and chapters). The items below are milestone or platform gaps outside that plan and are listed under notTested.

- CHK-022 for plan chapter ffx2-vegnagun-shuyin: the Chapter V victory path on the shipped default (link 5 Shuyin, the aftermath with the Fayth lines, victory results, the saved clear, and with it the live half of PR-0129 FFX-2 and the Shuyin and Fayth tiles): three live runs lost at link 4.
- CHK-010 (plan check): the FFX ALL ENEMIES targeting state; the Chapter III party offered no Black Magic row.

## Ranked issue list (all open)

128 open issues: 32 major, 91 polish, 5 suggestions, no critical. Ranked by severity, then owner-reported, frequency, player impact, coverage and effort. STALLED (RUBRIC section 8, method check owed before another batch): PR-0061, PR-0008, PR-0153, PR-0001, PR-0126, FOC-06, PR-0021, PR-0099, PR-0195, PR-0109, PR-0100, PR-0039.

### 1. PR-0148 (major, audio): Bailey's 2026-09-21 verdict that the score sounds like SNES music is still unaddressed: no shipped cue was re-rendered in 76f587c3..5be4babe, and there is still no owner listening verdict on the mix that ships

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** all chapters (the whole score)
- **observed:** docs/audio/OWNER-VERDICT.md's newest entries (2026-09-23/24) are all 'accepted on recommendation, not by ear' for specific chapters (Evrae, Macalania mood, Yojimbo O-6 sketch); none is a listen of the finished, mixed, wired cue, and none is numeric. The 2026-09-19 direction check ('Right direction, keep refining') remains the only positive-toned entry and is explicitly not an acceptance of the current mix. In the reviewed range public/audio changed only manifest.json and the new boss-yojimbo.mp3 (audio auditor, git diff 76f587c3..5be4babe -- public/audio), so none of the 24 cues Bailey judged was re-rendered.
- **repro:** Read docs/audio/OWNER-VERDICT.md end to end; grep for a numeric score or the word 'score' attached to a verdict — none found.
- **evidence:** D:/Final Fantasy/docs/audio/OWNER-VERDICT.md; critic/rounds/round-11.md issue #1 (same finding, unchanged)
- **confidence:** high
- **requirement:** RUBRIC.md section 6 (audio's listening score is the owner's recorded verdict); CHK-B1
- **fix:** Run npm run audio:render -- --all --audition, send Bailey docs/audio/audition/ with the current tour order (now 25 cues including boss-yojimbo), and record whatever he says verbatim in OWNER-VERDICT.md, numeric or not.
- **acceptanceCheck:** OWNER-VERDICT.md carries a dated entry naming the finished shipped mix (not a pre-integration sketch) with Bailey's own words.
- **ownerReported:** Bailey, 2026-09-21 (NOW.md): "music is too reminsicent of snes music instead of the more modern final fantasy titles and clair obscur. all of these next to be fixed very next build."

### 2. PR-0061 (major, feel): 6.3 to 11.9 s from the scene skip to the first usable command menu; the new Chapter IX is the slowest (11.9 s)

- **Tags:** introducedByCandidate false, regressionVsLive "unknown", inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** all; worst in yojimbo-cavern (FFX)
- **expected:** The opening beat reads as deliberate, and a returning player can shorten it (RUBRIC section 6 feel: respectful skip and replay, no dead waiting).
- **observed:** Play clock at the first menu that accepts input on 5be4babe: ch2 6.3 s, ch3 6.35 s, ch8 6.8 s, ch4 7.6-7.65 s, ch1 8.0-8.1 s, ch6 9.0 s, ch5 9.3-9.6 s, ch9 11.4-11.9 s. Measured alone from leaving the scene to the menu: ch3 7.1 s, ch4 8.3 s, ch1 8.8 s, ch9 11.9 s. Against round 11: 0.3 to 1.3 s faster in ch2, 3, 4, 6 and 8, unchanged in ch1 and ch5. Chapter IX adds the arrival (sakura and Yojimbo stepping in by 1.6 s) and, because of CTB order, Yojimbo's and Daigoro's opening turn before the first party menu. Measured alone from leaving the scene to visible command rows (capture owner): Ch III 7.1 s, Ch IV 8.3 s, Ch I 8.8 s, Ch IX 11.9 s. CONFIRMED independently on live (Ch IX 11,953 ms, Ch I 8,912 ms). Confirmer detail: sceneLeftToBattleMs is only 3 to 12 ms, so the battle screen mounts at once; nearly all the delay lies between battle mount and the first awaitingMenu (the entry sweep or arrival cinematic, not asset fetch). Page load itself is fast (DOMContentLoaded 0.36-0.56 s, board 2.7-3.2 s), so this is the battle-entry stall, not a load failure.
- **repro:** Any chapter, seed 1, from the title. Hold Enter over the pre-battle scene and time until the command rows are visible.
- **evidence:** critic/rounds/round-12/evidence/latency/*.json; critic/rounds/round-12/evidence/*/run.json firstState.playTimeMs; critic/rounds/round-12/feel-narr/yojimbo-cavern-win__seq-transition-into-battle.jpg
- **confidence:** high
- **verdict:** CONFIRMED
- **requirement:** RUBRIC section 6 feel. Section 8's stagnation rule applies: this is the fourth review open at major, so a written method check is owed before another batch.
- **fix:** Method check first. Then the smallest probe: let Confirm cut the battle-entry card and the boss caption once they have shown, for example after the first view in a session. The Chapter IX arrival stays as approved.
- **acceptanceCheck:** latency.mjs alone at 1600x900 in ch1, ch5 and ch9: with Confirm pressed, the first menu arrives no more than 5 s after leaving the scene, and the default path is unchanged.
- **tagNote:** Five chapters are 0.3 to 1.3 s faster than round 11 (76f587c3) and Ch I and V are unchanged; no measurement exists for release 14 (1c22066e) itself, so the regression tag stays unknown. A major with an unknown regression tag does not hold (RUBRIC section 3).
- **mergedFrom:** capture owner (PR-0061, feel); feel-narrative auditor (PR-0061); prep-delivery auditor (delivery cross-reference, same root); confirmer (reproduced)

### 3. PR-0076 (major, encounter): on the shipped default, Chapter V was lost at the Head link in 3 of 3 live real-key runs; the bench wins 7 of 40 at 1 s of top-list time, and the win path is unverified on this build

- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2 only
- **chapter:** Chapter V (Vegnagun and Shuyin), also Chapter VI; default X-2 BATTLE = WAIT
- **where:** src/battle/ffx2/active.ts:67 DEFAULT_WAIT_SPLIT = true (Bailey's decision, D-029 follow-up 2)
- **expected:** Bailey accepted a measured cost: ch5 32/40 with 0.5 s on the top list (commit 2ddc0caa). This entry reports what that cost looks like in play. The latest owner decision (D-029 follow-up 2, adopted 2026-09-24) made the faithful split the Wait default; the numbers shown with that choice were 32/40 at 0.5 s (commit 2ddc0caa).
- **observed:** Bench, intended line, D_top 0 / 250 / 500 / 1,000 / 2,500 ms: ch5 39, 39, 31, 7, 0 of 40; ch6 40, 37, 29, 11, 4 of 40; ch4 40/40 throughout. Under ?wait=hold all three win 40, 39 and 40 of 40. Live: ch5 lost both capture attempts at the Head link (46.5 and 42.2 min, about 300 commands; items spent; all three girls Silenced, Darkened and Poisoned at 40-197 HP). Round 11 reached a live ch5 outcome under the whole-menu hold. A third real-key run by the gap pass (ffx2-vegnagun-shuyin-win-walk, 38.7 min) also lost at link 4. In the two capture runs the Head cast Acta Est Fabula 20-23 times and Mors Certa 28-34 times (round 11 win: 12 and 4); at the loss the party was Silenced, Darkened and Poisoned at 40-197 HP, the Head at 17,023/38,420, both Redoubts near 200/2,500. In the last 120 picks the advisor named Darkness 32 times, Potion 30 and Hi-Potion 23 (R12-UI-01). Whether the advisor contributes beyond the clock is NOT established: the Ch V advisor bench under the split was not run.
- **repro:** Bench: critic/rounds/round-12/combat/r12/ffx2.test.ts with R12_ARMS=250,500 R12_MODES=wait-split. Live: Chapter V from the title, seed 1, default options. Live: route.mjs ffx2-vegnagun-shuyin win 1600x900 (seed 1, default options).
- **evidence:** critic/rounds/round-12/combat/bench-ffx2.log; bench-ffx2-arms.log; critic/rounds/round-12/evidence/ffx2-vegnagun-shuyin-win/run.json (finalBattle); logs/vegnagun-win.log; logs/vegnagun-win-r2.log; critic/rounds/round-12/evidence/ffx2-vegnagun-shuyin-win/ and ffx2-vegnagun-shuyin-win-r2/ (battle-log.json, turn-log.json, 20-link-4.png, 31-results.png); critic/rounds/round-12/evidence/gaps/ffx2-vegnagun-shuyin-win-walk/run.json
- **confidence:** high on the live losses and the bench numbers; medium that the clock is the main cause (harness decision time is not a human's); low for any advisor cause
- **verdict:** PLAUSIBLE (cause); CONFIRMED (live losses)
- **requirement:** RUBRIC section 2 (latest owner decision governs) and section 6 encounter (fair wins and losses, correct difficulty); CHK-022 (the Chapter V win path is unverified on this build); CHK-005
- **fix:** No boss change. (1) Run the 40-seed Ch V advisor bench under the split at 0, 1,000 and 1,500 ms to separate an advisor defect from the clock. (2) Show Bailey the live result beside the numbers he accepted, with the options already built: the whole-menu hold (?wait=hold today) as a visible Wait choice, or a coach line that opening a submenu stops the clock. FFX-2 only.
- **acceptanceCheck:** Bailey's recorded answer in docs/target/decisions.json; the advisor bench published; one live real-key Chapter V win on the shipped default through Shuyin, the aftermath and the saved clear.
- **tagNote:** The split became the default in the reviewed range (72b79a04) and was already live in release 14 (1c22066e), so it is not a regression against the replaced live build.
- **decisionFor:** Bailey
- **mergedFrom:** combat-encounter auditor (PR-0076); capture owner (R12-02, filed as information for Bailey); interface auditor (R12-UI-01, major, PLAUSIBLE, cause not established)

### 4. PR-0008 (major, encounter): Chapter I's intended line now wins 17 of 40 and the advisor 20 of 40, and seed 1, which every fresh profile gets, loses both; live, the advisor-following capture won 1 of 5 decided attempts

- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX only
- **chapter:** Chapter I, Seymour Flux, from a fresh profile
- **where:** not traced to one line; the preset (src/data/ffx/builds/gagazet.ts, [estimate]) against the corrected sourced rules
- **expected:** A reliably winnable intended line for the chapter's authored preset (round 11: 26 of 40 intended, 27 of 40 advisor)
- **observed:** Bench on 5be4babe: intended 17/40 and advisor 20/40, with seed 1 lost by both. The builder measured the drop from two sourced fixes: 26 -> 23 from the Poison phase fix (6debabd9, §4.3), then 23 -> 17 from aeons losing Items (7be35cb8, §6.2), which is in 5be4babe's own delta against release 14. Live: 1600x900 lost once, then won on Retry. 2000x1012 lost three times (r2 in 5 player turns to Lance of Atrophy then Mortiorchis Full-Life, the PR-0007 pattern); r1 was a harness stall. CONFIRMED in the engine by the confirmer (strategy-seymour-flux: seeds 1-40, 17 wins; seed 1 a defeat with 45,687 Seymour HP left at turn 47). The live 1-in-5 figure rests on the capture owner's evidence and was not re-run by the confirmer.
- **repro:** Bench: critic/rounds/round-12/combat/r12/ffx.test.ts, seeds 1-40. Live: title > briefing > board > Chapter I, seed 1, following the advisor card.
- **evidence:** critic/rounds/round-12/combat/bench-ffx.log; commit fd9d4a2d; critic/rounds/round-12/evidence/logs/flux-win-r2..r5.log; seymour-flux-win-r2/battle-log.json
- **confidence:** high
- **verdict:** CONFIRMED
- **requirement:** RUBRIC §6 encounter: fair wins and losses, correct difficulty; the boss-side-fix-needs-measured-options rule (no boss change)
- **fix:** Do not tune Seymour. Put docs/plans/pr-0008-method-check.md's re-baseline to Bailey with the new 17/40 number, and the fresh-profile seed question. A method check is required: this is the third review with PR-0008 open at major.
- **acceptanceCheck:** Bailey's recorded decision, then a re-run bench with the decided preset or seed policy. The live first attempt on a fresh profile is re-captured.
- **tagNote:** The 26 -> 17 drop comes from two sourced fixes in the range (6debabd9, 7be35cb8); no mechanic broke, so it is not a regression. A sourced correction applied to a preset tagged [estimate]: any repair belongs to the preset sourcing or seed policy, never to Seymour.
- **decisionFor:** Bailey

### 5. PR-0180 (major, feel, was R12-FN-01): FFX battles never show an action's name, so Zanmato and Yojimbo's other moves land unnamed (every FFX chapter; most visible in Chapter IX)

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX (every FFX chapter: I, II, III, VIII, IX); most visible in Chapter IX
- **chapter:** yojimbo-cavern (and all FFX chapters)
- **where:** Traced: src/app/screens/BattleScreen.ts:278-291 (messageBar is created only when a factory is registered or there is no HUD); src/engine/BattlePresenterFallbacks.ts:33 (setMessageBarFactory is never called anywhere in src); src/engine/BattlePresenterBeats.ts:40-42 (abilityName is sent to that null bar); src/ui/ffx/FFXBattleHud.ts:553-561 (action-start shows no name); src/ui/ffx/ZanmatoGauge.ts:204-211 (the banner clears when the gauge leaves 100)
- **expected:** FFX puts the ability name in the battle message strip for each named action (the strip MessageBar.ts describes: 'Seymour uses Total Annihilation!', visual-bible section 3.1). Zanmato in particular should be named as it strikes, because the chapter teaches the Daigoro, Kozuka, Wakizashi and Zanmato bands.
- **observed:** In yojimbo-cavern-zanmato-aeon-r3/seq-zanmato (frames every 200 ms from 42 ms), the camera pushes onto an idle Yojimbo. Then 9999 lands on Kimahri at 0.66 s and on Yuna at about 1.5 s, and the defeat fade starts at 2.8 s. No frame shows 'Zanmato'. The gauge panel already reads 0% and 'Next: Daigoro' as the strike lands, because ZanmatoGauge clears its one-shot banner as soon as the gauge drops. In yojimbo-cavern-win/seq-action-playing, the shot holds on an unchanging idle Yojimbo from 0.59 to 2.14 s before 1148 appears on Lulu, with no name, so the player cannot tell Kozuka from Wakizashi from Daigoro. The BFA and Seymour sequences show no action names either; only Overdrives get the name slab. Gap pass (ch9-aeon-r5/seq-zanmato-strike-1, 90 frames at about 50 ms with a DOM read per frame): the .ig-banner message bar stayed hidden with empty text for the whole strike, and the same holds for ordinary actions in this chapter.
- **repro:** Live, seed 1, 1600x900. Title, Enter, board, choose Chapter IX, prep, hold Enter over the scene. Summon each aeon and let them fall, and keep acting until the gauge reaches 100. Watch Yojimbo's next turn.
- **evidence:** critic/rounds/round-12/evidence/yojimbo-cavern-zanmato-aeon-r3/seq-zanmato/f00-f15.jpg; .../contact-zanmato.jpg; critic/rounds/round-12/evidence/yojimbo-cavern-win/seq-action-playing/f02-f08.jpg; critic/rounds/round-12/feel-narr/braskas-final-aeon-win__seq-action-playing.jpg
- **confidence:** medium-high (traced in code and seen in 4 sequences). A runtime query of the message-bar element during an enemy action would settle it.
- **verdict:** CONFIRMED (gap-pass DOM read)
- **requirement:** RUBRIC section 6 feel (readable effects, action and reaction timing) and interface (readable names); CHK-023
- **fix:** FFX only: on action-start with an abilityName, show the name in the FFX HUD's existing message banner, or register the real MessageBar factory for FFX. Keep the Zanmato banner up until the Zanmato action ends.
- **acceptanceCheck:** Real-key Chapter IX run: a frame within 250 ms of Yojimbo's action-start shows 'Zanmato', 'Kozuka', 'Wakizashi' or 'Daigoro'. A Chapter I frame shows Seymour's move name. FFX-2 chapters are unchanged (CHK-021).
- **tagNote:** The missing FFX message strip predates the range (setMessageBarFactory is never called); Chapter IX makes it most visible.

### 6. PR-0153 (major, interface): the FFX intent names one damage target for a random-target move and marks it SCRIPTED; wrong in Ch I (4/4 runs) and Ch VIII (hidden lethal hit)

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** ffx
- **chapter:** seymour-flux, evrae-airship, yojimbo-cavern (new)
- **where:** FFX intent panel (E); suspected cause as traced in round 11: src/battle/ffx/intent.ts branchKey ignores targets
- **expected:** Only the move is certain. Every possible target is shown with its own range, lethal members are flagged, and the whole is labelled as a random pick.
- **observed:** Ch I, seed 1, 1600x900: 'Lance of Atrophy SCRIPTED … DAMAGE TIDUS 707-799'. The engine's Lance hit YUNA for 789 in 4 of 4 runs (r2-r5 battle-log seq 10-11). Ch VIII, 2000x1012: 'Attack SCRIPTED — Physical non-elemental damage to a random character … WAKKA 1,262-1,425'. Evrae hit TIDUS for 1283 and KO'd him (seq 11-12). Ch IX (new): Daigoro's bite (targeting random-enemy in data/ffx/enemies/yojimbo-abilities.ts) is shown as 'SCRIPTED … KIMAHRI 517-584'.
- **repro:** Seed 1 (fresh profile). From the title, Enter through the briefing, choose Ch I (or VIII or IX), Enter through prep, hold Enter through the scene. At the first menu press E. Compare the named row with the engine's first damage event for that move.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/battle-log.json; D:/Final Fantasy/critic/rounds/round-12/interface/c8.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/evrae-airship-win/battle-log.json; D:/Final Fantasy/critic/rounds/round-12/interface/c9-intent.jpg
- **confidence:** high (panel text and engine logs agree on 4 runs in Ch I and 1 in Ch VIII)
- **requirement:** RUBRIC §2 and §6 interface: honest intent that separates certain from conditional; CHK-004 scope (the intent panel)
- **fix:** When the ability's targeting is random or sampled runs disagree on the target, estimate every candidate and render all rows under a 'random target' label with lethal flags. Keep SCRIPTED for the move only.
- **acceptanceCheck:** At the Ch VIII first menu the card lists Tidus, Wakka and Rikku with Tidus flagged lethal. The Ch I Lance lists all three members. Over a logged run of each FFX chapter, no random-target move shows a single named target.

### 7. PR-0001 (major, interface): at 390x844 the battle HUD in both games is the desktop stage scaled down: text a few px tall, one party member in frame, the HUD over the boss; the Victory/Defeat results are a letterboxed miniature too

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** ffx2-bahamut, yojimbo-cavern, every chapter
- **where:** the 640x360 stage scaled to phone width (suspected single global scale). D-140 option B (compact rail) is adopted but not scheduled.
- **expected:** A readable phone battle and results layout. Every text node is at least 14 effective px, and RETRY / CHAPTER SELECT can be read and tapped.
- **observed:** Battle: the command rows, party rows, CTB list, intent and guide are a few px tall (only the FFX-2 help band and the Ch IX Zanmato gauge read). Results: the Victory card (Ch IX) and Defeat card (Ch IV) occupy a 390x220 strip in mid-screen. The AP/GIL/TURNS labels and the party rows are about 4 to 6 px, and the RETRY and CHAPTER SELECT buttons are tiny. Framing (visual auditor, PR-0017): Ch4 phone: only Paine is in frame, and the help band crosses Bahamut mid-screen. Ch9 phone midfight: only Yuna shows (foreground, cropped), and the party status rows sit over Yojimbo's lower body. The approved compact rail (D-140 option B) is not built. CONFIRMED on yojimbo-cavern-win-phone/11-advisor.png (command rows about 6 px; the advisor headline is borderline-readable, its other lines are not; the Zanmato gauge reads).
- **repro:** 390x844, seed 1. Ch IX from the title to its Victory results; Ch IV from the title to Defeat results.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/phone-results.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-b1.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg; D:/Final Fantasy/critic/rounds/round-12/visual/phone.jpg; D:/Final Fantasy/critic/rounds/round-12/targets/phone-battle-hud.jpg; critic/rounds/round-12/evidence/contact-phone-ch9.jpg; yojimbo-cavern-win-phone/11-advisor.png
- **confidence:** high by eye; not measured
- **verdict:** CONFIRMED
- **requirement:** CHK-003; RUBRIC §2 platform goals (phone)
- **fix:** Build the adopted D-140 option B (compact rail) for both games, FFX keeping the CTB rail and FFX-2 its ATB chips; give the results screen its own phone layout (show Bailey the results options first, rule 9).
- **acceptanceCheck:** At 390x844 the leaf-text sweep of the battle HUD and the results screen returns zero nodes under 14 effective px, and one touch turn plus a RETRY tap completes. At 390x844 in ch1, ch4 and ch9, all three party members and the boss are visible and no panel crosses the boss quad.
- **mergedFrom:** interface auditor (PR-0001); visual auditor (PR-0017 / R15-01); capture owner (R15-01); confirmer (reproduced)
- **alsoKnownAs:** R15-01; PR-0017

### 8. PR-0105 (major, combat): under the shipped default Wait split, a hit on a girl whose top-level menu is open keeps her menu; the sources say it closes the menu and delays her turn

- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2 only
- **chapter:** Chapters IV, V and VI, default X-2 BATTLE = WAIT
- **where:** src/battle/ffx2/active.ts:202-214 (inputStillValid: 'Chained is still hers'), with DEFAULT_WAIT_SPLIT = true at active.ts:67
- **expected:** ffx2-combat-core §1.1 table (line 50): 'being hit while the command menu is open cancels the menu and delays the turn'. §1.5 Active note (line 211, single source Split Infinity): the hit closes the menu and applies Delay. Wait runs the clock at the top list (§1.5), so this now applies to the default.
- **observed:** With the split on (default since a999d133), the clock runs while the top list is open. An enemy hit on the menu owner leaves her menu open, or holds her command until the chain window closes. The builder's commit 2ddc0caa says so and defers it ('Both are for the next batch'). Before the split it could happen only under the opt-in Active. LIVE (gap pass, gaps/ch4-wait-split, fresh profile, default Wait, seed 1): Bahamut's Attack hit Yuna for 170 (seq 28) while her top list was open, and her rows, awaitingMenu and plate highlight all stayed (f084-f099). Engine: the confirmer reproduced it in 20 of 20 seeds (confirm/pr0105.test.ts). CONTEXT: this is a recorded deferral, not an oversight: active.ts calls it an open question for Bailey, and docs/target/decisions.json D-010 is "proposed, asked 2026-09-21, not answered". The default split has made that question more urgent.
- **repro:** Engine: FFX2Engine default options, Chapter IV. At the first player-input call setMenuLevel('top'), tick(3000, {throughInput: true}) until Bahamut hits the owner, then check inputValid(owner): it is true, so the menu stays open. Live: default Wait, hold the first girl's top list open until Bahamut attacks her.
- **evidence:** src/battle/ffx2/active.ts header ('Active's held-command and menu-owner rules ... are reachable under Wait too'); commit 2ddc0caa message; critic/rounds/round-12/combat/bench-ffx2.log ('commands held' 337-1,897 under wait-split at D_top >= 1,000 ms)
- **confidence:** high (code trace and builder's own statement); the live frame is still owed (capturesNeeded)
- **verdict:** CONFIRMED (engine 20/20 and live frames)
- **requirement:** RUBRIC §2 faithful ATB; AGENTS.md rule 6
- **fix:** Put D-010 to Bailey now with the live frames (rule 10: do not build it unilaterally). If he adopts the sourced rule: when a girl who owns an open menu takes damage from an enemy action, close the menu and apply the section 4.8 Delay, in both Active and the Wait split; record that the Split Infinity line is a single source; measure ch4-6 before and after, no boss change. FFX-2 only.
- **acceptanceCheck:** Engine test: a hit on the owner under wait-split with the top list open makes inputValid false and lowers her ATB by the Delay percentage. Live: a frame sequence at 1600x900 shows the menu closing on the hit.
- **tagNote:** Exposure only: the menu rule is older, the default split that reaches it is in the range and was already live in release 14.
- **decisionFor:** Bailey (D-010)

### 9. PR-0181 (major, visual, was SUM-1 (absorbs R12-FN-03)): an FFX summon leaves the party standing on the field beside the aeon, and the party panel keeps the party's rows instead of the aeon's (FFX only)

- **Tags:** introducedByCandidate "unknown", regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX only
- **chapter:** IX (any FFX summon)
- **where:** Battle after Yuna's Summon, 1600x900
- **expected:** FFX: on Summon the rest of the party leaves the battle (research/ffx-vs-ffx2-presentation.md:295, citing the FF Wiki; research/ffx-isaaru-bevelle.md:69 via ffx-combat-core §6.1, 'a summon replaces the party'). The aeon stands alone, and its HP is what the player tracks.
- **observed:** The engine has Bahamut alone on the field: Bahamut acts at seq 19-24, and Daigoro hits bahamut for 484 at seq 30. Yet the frames show Lulu, Kimahri and Yuna standing next to Bahamut, and the party panel lists Lulu, Kimahri and Yuna rather than the aeon. The same holds for Valefor as Zanmato lands. Even the in-game coach line reads 'Call the aeon. It fights alone, and it takes the blows meant for her.' Feel auditor (R12-FN-03): In zanmato-aeon-r3/seq-summon, Bahamut fades in from 0.8 s at party slot 1, half-hidden behind Kimahri. Yuna, Kimahri and the KO'd Lulu stay in place through to the aeon menu at 2.07 s (f10). The research does not source the staging, so this is judged against the build's own help line.
- **repro:** Fresh profile, live, 1600x900, Chapter IX from the title with real keys: skip the scene, Attack with Kimahri, then Yuna: Summon > Bahamut. Watch the next 4 s. Seed 1.
- **evidence:** critic/rounds/round-12/evidence/gaps/od-yojimbo-cavern-bahamut/seq-od-0-Attack/f079.jpg, contact-megaflare.jpg, battle-log.json; ch9-aeon-r5/contact-strike1b.jpg; shape-yojimbo-cavern-2560x1440/30-action.png (coach line); critic/rounds/round-12/evidence/yojimbo-cavern-zanmato-aeon-r3/seq-summon/f03-f10.jpg; critic/rounds/round-12/evidence/yojimbo-cavern-zanmato-aeon/11-aeon-menu.png (help line)
- **confidence:** high (frames plus event log plus code trace)
- **requirement:** AGENTS.md rule 14 / CHK-021 (FFX presentation fidelity); RUBRIC category combat and visual (aeons)
- **fix:** FFX only: in summon(), fade out and remove (or hide) the active party actors before the aeon arrives, and restore them on the aeon's dismiss or KO. Switch the FFX party panel to the aeon's row while it is out. FFX-2 has no summons and is untouched.
- **acceptanceCheck:** A real-key Summon in Ch IX shows only the aeon (plus the enemies) until dismissal. The party panel shows the aeon's HP. After the aeon's dismiss or KO the three party figures return.
- **tagNote:** summon() predates the range; whether earlier builds showed the same staging was not re-checked. Chapter IX, where it is most visible, is new.
- **mergedFrom:** gap pass (SUM-1, major); feel-narrative auditor (R12-FN-03, polish)

### 10. R13-04 (major, visual): in Chapter VIII the FFX command stack covers Tidus, the acting character

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX
- **chapter:** evrae-airship (Chapter VIII), first menu
- **where:** src/scenes/evrae-airship-deck.ts (formation), not traced to a line
- **expected:** The acting party member is visible beside the command stack (CHK-008 / CHK-011, the approved Battle HUD FFX tile).
- **observed:** At 2000x1012, on the first menu (11-advisor.png), only Tidus's hair and sword show behind the ORDERS/ATTACK rows. Wakka is now fully visible and Rikku is clear.
- **repro:** Title > briefing > board > Evrae > prep > pre-scene > first menu, seed 1, 2000x1012.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/evrae-airship-win/11-advisor.png
- **confidence:** high
- **requirement:** CHK-008, CHK-011, targets.json presentation/Battle HUD FFX
- **fix:** Ship the R13-04 option B re-lay that is already on main (commit a2a1b1f5 reverted it from this release).
- **acceptanceCheck:** The ch8 first menu at 1600x900 and 2000x1012 shows Tidus's face and body clear of every command row.

### 11. PR-0157 (major, visual): FFX action shots put a party member under the enemy info card and the acting boss under the turn-order column

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX
- **chapter:** seymour-flux (Chapter I), party and enemy action sequences
- **where:** src/ui/ffx/SensorPanel.ts / action camera rig, not traced
- **expected:** During an action, the actor and the target are both readable, with no panel over their figures.
- **observed:** On Seymour's attack on Yuna (789 damage, seq-action-playing f00-f04), the Seymour Flux card (HP, weakness row) covers Yuna's torso and skirt. Her face is just clear. Seymour, the attacker, is drawn at the right edge under the turn-order chips. On Tidus's Hastega (seq-party-action f02-f06), Tidus is now clear (an improvement since round 11), but Yuna's body is still under the card. Gap pass (deep rotation): at 1280x960 and 2560x1080 in Ch I the Mortiorchis info card and the party rows sit over Yuna and Kimahri (gaps/contact-shapes-a.jpg).
- **repro:** Chapter I from the title, seed 1, 1600x900, Tidus Hastega, then Seymour's turn.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/seq-action-playing/f02.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/seq-party-action/f02.jpg
- **confidence:** high
- **requirement:** CHK-008
- **fix:** Hide the enemy info card for the duration of an action (it already yields during target selection), or dock it above the party panel on the action rig. Frame the boss rig so the attacker clears the turn column.
- **acceptanceCheck:** In the ch1 and ch3 action sequences at 1600 and 2000, no HUD panel box intersects any actor quad, and the acting enemy's face is inside the frame and outside every panel.

### 12. PR-0126 (major, interface): the advisor card still drops its 'in <menu>' directions at density 6, on every phone card and on many desktop cards

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** ffx2-bahamut (phone), yojimbo-cavern (phone), seymour-flux, yunalesca, ffx2-vegnagun-shuyin (desktop)
- **where:** src/ui/common/MoveAdvisor.ts:590 (`bare = density >= MAX_DENSITY`) and :600 (bare omits statsHtml, so the menu chip goes too)
- **expected:** Every suggestion names the submenu it lives in, at every density.
- **observed:** The harness read no 'in' chip in these cases: - Phone Ch IV: 60 of 60 picks (Shell, Darkness, Magic Break, Hi-Potion, Phoenix Down, Potion, Cura, Drain). The run lost because the harness could not follow them. - Phone Ch IX: Fira, Fire Gem, NulFrost. - 1600x900 Ch I: Fire Gem x2, Ice Gem x2, Dispel, Mega Flare. - Ch II: Holy Water, Phoenix Down. - Ch V: Darkness x4, Mega-Potion, Lunar Curtain, Potion x3. The phone frame shows 'Shell → the party' with no 'in White Magic'.
- **repro:** 390x844, seed 1, Ch IV from the title. At the first menu read the advisor card. Also 1600x900 Ch I turns 11, 13, 35 and 44 (run.json picks with want.menu null).
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-bahamut-win-look-phone/run.json; D:/Final Fantasy/critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/run.json; D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-vegnagun-shuyin-win-r2/run.json; D:/Final Fantasy/critic/rounds/round-12/interface/phone-b1.jpg
- **confidence:** high (DOM reads, a frame and a source trace agree)
- **requirement:** RUBRIC §2 (the advisor says where an action is and what it costs); CHK-004
- **fix:** Keep the menu chip on the label line in the bare rung. Drop the effect and reason text first, never the directions.
- **acceptanceCheck:** Every run.json pick for a submenu row at 390x844, 1600x900 and 2000x1012 carries a non-null want.menu, and the phone card screenshot shows 'in White Magic'.

### 13. FOC-06 (major, interface): HUD text a player must read is below the 14 px floor at every desktop shape: the advisor chips at 12.2 px (1600x900, 2000x1012), the FFX HUD at 8.4 px and the FFX-2 HUD at 7.8 px at 1280x720/960, the pause at 9.3-9.8 px, 13.3 px even at 4K

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both (measured on FFX chapters)
- **chapter:** seymour-flux, yunalesca, braskas-final-aeon, evrae-airship, yojimbo-cavern
- **where:** move-advisor.css chip and stat tokens (the phone half now shows a compact card instead of an orphan chip)
- **expected:** No text a player must read under 14 effective px.
- **observed:** run.json focFirst.advisorMinEffPx = 12.2 at 1600x900 and 2000x1012 in every FFX chapter run. 'Next best move', 'Guide's pick', 'in White Magic', '30 MP' and 'always hits' are all 12.2 px. Rotation sweep (gap pass): Effective minimum size with transforms included. At 1280x720 and 1280x960: FFX HUD 8.4 px ('E' keycap), with 15-21 leaves under 12 px; FFX-2 HUD 7.8 px ('Scripted' / 'Possible 25%' chips), with 28-52 under 12 px; pause 9.3-9.8 px. At 2560x1080: 11.7-12.2 px. At 2560x1440 and 3840x2160: 13.3 px ('PAUSE' chip). The field ALL ENEMIES / ALL ALLIES label is a fixed 13 px.
- **repro:** Seed 1, any FFX chapter from the title, first command menu at 1600x900. Measure the effective font size of .mad__stat and .mad__badge, transforms included.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/run.json; D:/Final Fantasy/critic/rounds/round-12/evidence/evrae-airship-win/run.json; D:/Final Fantasy/critic/rounds/round-12/evidence/yojimbo-cavern-win/run.json; critic/rounds/round-12/evidence/gaps/shape-*/run.json (menu.minFont, menu.under10, pause.minFont, under12count)
- **confidence:** high (measured)
- **requirement:** CHK-003
- **fix:** Put a 14 px floor on the type tokens the stage scale drives (max(14px, calc(token * scale))) for chips, key hints, badges and small plates, and let the layout reflow instead of shrinking the type.
- **acceptanceCheck:** advisorMinEffPx >= 14 at 1600x900 and 2000x1012 in every chapter. The same sweep at the five shapes returns zero leaves under 14 px in the battle HUD and pause for FFX and FFX-2, and the screenshots show no clipping.
- **mergedFrom:** interface auditor (FOC-06); gap pass (CHK-003 at the rotated shapes; one root: no floor on stage-scaled type)

### 14. PR-0179 (major, combat, was R12-C01): the Gagazet preset's five aeons ship an invented ~0.55x scaling (738-1,398 HP) below the sourced Mt. Gagazet table and its "never weaker than" floor, so aeons die to Kozuka or Wakizashi before Zanmato; Chapter IX inherits the rows (FFX only)

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature true. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX only
- **chapter:** Chapter I (Seymour Flux) and Chapter IX (Yojimbo), which reuses gagazetBuild
- **where:** src/data/ffx/builds/gagazet.ts:428-432 (aeon rows), reused by src/data/ffx/builds/yojimbo-cavern.ts
- **expected:** research/ffx-combat-core.md §6.4.3 'ship these', Mt. Gagazet N=250: Valefor 1,530, Ifrit 2,075, Ixion 2,055, Shiva 1,830, Bahamut 2,935 HP (plus MP/Str/Def/Mag/MDef/Agi/Eva/Acc). §6.4.1: an aeon is 'never weaker than' the floor, which for N=240-269 is 1,229 / 1,597 / 1,605 / 1,444 / 2,258. The earlier Macalania preset (macalania.ts:276-282) already has 1,146-1,515.
- **observed:** The shipped rows are Valefor 738, Ifrit 988, Ixion 983, Shiva 878, Bahamut 1,398, with Mag 29-37 and Def 22-38. The file's comment settles an older conflict that combat-core §6.4 has since resolved. Live ch9 aeon route (r1, r3): five summons, each KO'd by a single Kozuka or Wakizashi (932-1,618) before Zanmato; Zanmato then landed on the party and ended the fight. Derived: Zanmato under Shield is 10,000/4 = 2,500, which a §6.4.3 Bahamut (2,935) survives and no shipped aeon does. Bench, 200 seeds, magic-race line: 143 -> 153 wins with §6.4.3 aeons, and aeons absorb Zanmato 122 -> 132 times of 178. Chapter I is unchanged (17 -> 16 of 40), because Banish makes aeon HP moot there, as §6.4.4 says. CONFIRMED (confirmer): gagazet.ts:428-432 against research/ffx-combat-core.md section 6.4.3 (lines ~1243-1247); the file comment at gagazet.ts:362-376 states the scaling; yojimbo-cavern.ts:85 clones gagazetBuild without overriding aeons. Canon framing corrected: ffx-yojimbo.md line 167 says the aeon takes Zanmato and dies, so strategy 3 is ABSORBING Zanmato, not surviving it; "a shielded Bahamut survives" rests on a Shield factor research line 342 marks as unverified and is derived only. Gap pass: an aeon (Valefor) did absorb Zanmato live once (gaps/ch9-aeon-r5, seq 339-345), reached only on the advisor-heal route after five attempts in which aeons fell in two hits.
- **repro:** Engine: init yojimbo-cavern with yojimboCavernBuild, any seed. Summon any aeon and let Yojimbo act once in the Kozuka or Wakizashi band: the aeon is KO'd. Live: title > board > Chapter IX > play without Doom and summon aeons (seed 1).
- **evidence:** critic/rounds/round-12/evidence/yojimbo-cavern-zanmato-aeon-r3/battle-log.json seq 230-297; critic/rounds/round-12/combat/r12/yojimbo-aeon.test.ts output (143/200 vs 153/200); critic/rounds/round-12/combat/bench-ffx.log (seymour-flux 643 arm 16/40)
- **confidence:** high on the data discrepancy (file versus research table); medium on player impact, which is measured as small
- **verdict:** CONFIRMED
- **requirement:** AGENTS.md hard rule 6 (numbers from research/*.md); RUBRIC §2 faithful mechanics; ffx-yojimbo §5.3 strategy 3
- **fix:** Replace the five Gagazet aeon rows with combat-core §6.4.3's Mt. Gagazet block, all nine stats, keeping the §7.9.2 gauges. Re-run strategy-seymour-flux and yojimbo-bench and publish before and after (measure, never tune). FFX only.
- **acceptanceCheck:** A unit test pins every Gagazet aeon stat to §6.4.3, and asserts each is at or above the §6.4.1 N=240-269 floor and the Macalania row. The Chapter I and Chapter IX benches are re-reported. A live or engine run shows a shielded Bahamut surviving Zanmato.
- **tagNote:** gagazet.ts is unchanged since 712f6e75; Chapter IX (new, not in release 14) is where the rows now matter. Chapter I impact is nil (16 vs 17 of 40).

### 15. PR-0095 (major, visual-target): Vegnagun's Bulwark and Redoubt C* rings and plates are not visible; the command window covers the Bulwark forelegs

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2
- **chapter:** ffx2-vegnagun-shuyin (Chapter V), links 3 and 4, first menu
- **where:** src/scenes/farplane-parts.ts, src/scenes/farplane.ts (reverted in 5be4babe)
- **expected:** Option C* from D-044: rings and name plates on the body's painted forelegs (Bulwarks) and on the head's tusk and jaw (Redoubts), visible in the normal menu frame.
- **observed:** Link 2 matches option C: NODE A/B/C top-edge markers, and no cones. In link 3 (1600 and 2000), no RIGHT/LEFT BULWARK ring or plate is drawn on the painted forelegs, and the WHITE MAGIC/CHANGE rows cover the lower forelegs. In link 4, no RIGHT/LEFT REDOUBT ring shows on the tusk or jaw, and the Right Redoubt intent card sits on the lower head painting (PR-0094). The release reverted 04681f5c, the fix that moved the Body so the Left Bulwark's ring and plate cleared the command window. Gap pass: links 3 and 4 were reached again under Wait, but no target cursor was held on a Bulwark or a Redoubt, so whether the rings exist under the command window stays UNVERIFIED.
- **repro:** Chapter V from the title, seed 1, 1600x900, advance to link 3 and link 4 first menus.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/targets/chapters-vegnagun-parts-link3.jpg; D:/Final Fantasy/critic/rounds/round-12/targets/chapters-vegnagun-parts-link4.jpg; D:/Final Fantasy/critic/rounds/round-12/visual/ch5-links.jpg
- **confidence:** medium (the rings may exist but be hidden under the command window; no target-selection capture on a Bulwark or Redoubt)
- **requirement:** targets.json chapters/Vegnagun's parts (D-044, mustChange C*), CHK-011
- **fix:** Re-land 04681f5c (Body on option C's spot) so the Bulwark rings and plates clear the command window, and dock the Redoubt intent card off the head painting.
- **acceptanceCheck:** The link 3 and link 4 first menus at 1600x900 and 2000x1012 show both Bulwark rings and plates on the forelegs and both Redoubt rings on the head, none under a panel.
- **tagNote:** 04681f5c (the fix) came after release 14 and was reverted before release 15, so it was never live.

### 16. PR-0094 (major, visual): at Chapter V link 4 the Redoubt intent card sits on Vegnagun's head painting

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2 only
- **chapter:** ffx2-vegnagun-shuyin, link 3 (Bulwarks)
- **where:** first menu after the seam into link 3, 1600x900
- **expected:** CHK-008: the boss's painted body is not hidden by a HUD panel.
- **observed:** The 'RIGHT BULWARK / Protect' intent card (x 958-1330, y 75-397) covers Vegnagun's body painting (x 860-1230, y 170-480) except its left ring and the lower legs.
- **repro:** Live, 1600x900, seed 1. Chapter V, win links 1 and 2 > seam into link 3 > first menu.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/targets/chapters-vegnagun-parts-link4.jpg; D:/Final Fantasy/critic/rounds/round-12/visual/ch5-links.jpg
- **confidence:** high
- **requirement:** CHK-008; RUBRIC §6 visual composition
- **fix:** Frame link 3 so that the body clears the intent card's zone, or give the intent card a per-link alternative anchor away from the body. The rest of PR-0094 carries.
- **acceptanceCheck:** Link 3 first menu at 1600x900 and 2000x1012: less than 15% of the body painting is under any panel.
- **round12:** Narrowed on 5be4babe (visual auditor): the link-3 intent card no longer covers Vegnagun's body; at link 4 the Right Redoubt intent card sits on the lower head painting (targets/chapters-vegnagun-parts-link4.jpg, visual/ch5-links.jpg).
- **carried from:** round-11 (76f587c3)

### 17. PR-0031 (major, visual-target): target selection lacks the approved ground ring under the selected figure and the quiet dim on non-targets

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** braskas-final-aeon (Chapter III) single and all-allies targeting; ffx2-leblanc (Chapter VI) single target
- **where:** src/ui/ffx/TargetCursor.ts, targetCursorParts.ts, not traced
- **expected:** Option B, 'hand, ring and a quiet dim': a soft ground ring under every selected figure and a quiet dim on everyone who is not a target.
- **observed:** Ch3 Yu Pagoda A and Braska's Final Aeon targets have brackets, the pointing hand and a name plate, but no visible ground ring and no dim on the other enemies. All-allies (Al Bhed Potion) shows brackets and an ALL ALLIES chip, with no TARGET plate (PR-0178: the bracket corners cross the command rows). The FFX-2 ch6 target on Dr. Goon now has the TARGET and actor plates and the flower reticle, but Ormi and Fem-Goon are not dimmed.
- **repro:** Chapter III, seed 1, 1600x900, ATTACK, then arrow right and left; ITEMS > Al Bhed Potion.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/targets/fight-targeting-s1.jpg; D:/Final Fantasy/critic/rounds/round-12/targets/fight-targeting-s2.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/target-braskas-final-aeon-1600x900/contact.jpg
- **confidence:** high
- **requirement:** targets.json fight/Targeting s1, s2 (reaction mustRemain)
- **fix:** Draw the existing ground decal under each selected actor and apply a ~30% dim to non-target actors while the cursor is live.
- **acceptanceCheck:** The s1 and s2 composites show a ring under every selected figure and a visible dim on non-targets.

### 18. PR-0035 (major, visual-target): the FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2
- **chapter:** ffx2-bahamut (Chapter IV), first menu
- **expected:** The composition of docs/screenshots/mockups/A-ffx2-battle.jpg.
- **observed:** The party stands centre-left and Bahamut centre-right. The approved tile has Bahamut on the left and the party on the right.
- **repro:** Chapter IV from the title, seed 1, 1600x900, first menu.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/targets/presentation-battle-hud-ffx2.jpg
- **confidence:** high
- **requirement:** targets.json presentation/Battle HUD, FFX-2
- **fix:** Ask Bailey whether the mirrored field is an accepted adaptation. If it is not, swap the FFX-2 formation sides.
- **acceptanceCheck:** The composite reads as the same composition, or the tile records an approved adaptation.
- **decisionFor:** Bailey (accepted adaptation or swap)

### 19. PR-0021 (major, narrative): no banter bank; four FFX chapters end on the same '...Okay. Next one.'

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both (FFX quips observed)
- **chapter:** seymour-flux, yunalesca, braskas-final-aeon, evrae-airship
- **expected:** Rotating, in-character, per-tier victory lines and banter (writing-bible sections 4 and 5.4: rotate 3 per character per tier).
- **observed:** The results text reads '...Okay. Next one.' in ch1, ch2 and ch3, and 'Okay. Next one.' in ch8, on 5be4babe. Prep carries only fixed quips. Chapter IX correctly has none (grim tier).
- **repro:** Win ch1, ch2, ch3 and ch8 with real keys and read the results card.
- **evidence:** critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/run.json, yunalesca-win/run.json, braskas-final-aeon-win/run.json, evrae-airship-win/run.json (resultsText)
- **confidence:** high
- **requirement:** writing-bible section 4; RUBRIC section 6 narrative (banter)
- **fix:** Method check first (stalled). Then wire section 4's Win and Form slots as a sampled bank, keyed by chapter and tier, for FFX first.
- **acceptanceCheck:** Three seeded wins of the same FFX chapter show at least two different lines, each allowed for that chapter's tier.
- **decisionFor:** Bailey (banter bank in or out of this milestone)

### 20. PR-0099 (major, audio): Chapter 6 (Leblanc) still has no THEMES.md cue-map row for the Chapter-4 cues it borrows

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2 only
- **chapter:** Chapter VI (Leblanc)
- **observed:** src/data/encounters.ts now documents the fallback in a code comment (D-018: 'this chapter ships its flourish, unlike Chapter 4's suppressed one'), which is better than round 11's undocumented state, but docs/audio/THEMES.md still has zero rows mentioning Chapter 6, Leblanc or Chateau; live capture confirms Chapter 6 plays scene-bevelle-underground, boss-ffx2-aeon and victory-ffx2 exactly as coded. Capture owner: pre-scene scene-bevelle-underground, battle and seams boss-ffx2-aeon, results victory-ffx2 (ffx2-leblanc-win/run.json).
- **repro:** grep -in 'chapter 6\|leblanc\|chateau' docs/audio/THEMES.md (0 hits). Real-key win through Chapter 6 and read audioDebug at pre-scene/first-menu/results.
- **evidence:** D:/Final Fantasy/docs/audio/THEMES.md; D:/Final Fantasy/src/data/encounters.ts (FFX2_LEBLANC.music comment); critic/rounds/round-12/evidence/ffx2-leblanc-win/run.json (audio[])
- **confidence:** high
- **requirement:** CHK-001 (the right cue at the real moment, documented); docs/audio/THEMES.md cue map
- **fix:** Add a Chapter 6 row to THEMES.md's cue map (even if it only documents the intentional reuse of Chapter 4's cues) so the bible matches what ships, or compose the dedicated cue if Bailey wants one.
- **acceptanceCheck:** THEMES.md's cue-map table has a Chapter 6 row; themes-audit.mjs covers it.
- **mergedFrom:** audio auditor (major); capture owner (polish, same observation)

### 21. PR-0127 (major, interface): Chapter VI prep polaroid captions are still clipped by the card edge, now seen at 2000x1012; the phone half is repaired (D-071)

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** ffx2
- **chapter:** ffx2-leblanc
- **where:** party-prep CHAPTER card (shared card)
- **expected:** Every polaroid caption is shown in full.
- **observed:** At 2000x1012 the captions read 'the Syndicate's', 'beaten, never' and 'loses again, shows', cut at the card bottom with no scroll cue on the card.
- **repro:** 2000x1012, fresh profile, Ch VI from the title into party prep, CHAPTER tab.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c6prep.jpg
- **confidence:** high
- **requirement:** CHK-009
- **fix:** Size the polaroid row to fit two caption lines, or reduce the photo height so the captions fit inside the card.
- **acceptanceCheck:** scrollHeight <= clientHeight + 1 for every caption at 1280x720, 1600x900 and 2000x1012, and the screenshot shows the whole caption.

### 22. PR-0067 (major, interface): on the 390x844 chapter board the FINAL FANTASY X-2 group, IX and the COMING card sit below an unmarked clip, and the selected chapter can be invisible in the rail

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** chapter select
- **where:** src/app/screens/frontend/frontend.css .fe-rail (fixed height with overflow)
- **expected:** Both game groups are discoverable in the first frame at phone size, with a touch affordance.
- **observed:** With Ch IV selected the rail shows only FFX I, II, III and VIII. The IX, COMING and FFX-2 groups are below the fold with no fade or indicator, and 'BEST' slides under the hint bar (PR-0113 half). The labels are now readable (PR-0066 looks repaired but is unmeasured).
- **repro:** 390x844, fresh profile, title, Enter through the briefing, arrow to Ch IV.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/phone-board.jpg
- **confidence:** high
- **requirement:** RUBRIC §2 platform goals; CHK-009 scope (chapter select)
- **fix:** Pin the two game headings as a two-up switch above the rail, add a bottom fade, and give the hint bar a touch row.
- **acceptanceCheck:** At 390x844 in a touch context the FFX-2 heading is visible in the first frame, and a drag brings IV to VI into view.

### 23. PR-0129 (major, audio): the Chapter III chain cue ownership is fixed on live; the Chapter V boss-shuyin half is unverified live because no run reached Shuyin

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both (FFX-2 ch5 re-observed live this round; FFX ch3 from reused evidence; the chain-cue versus scene-cue plumbing is shared)
- **chapter:** ffx2-vegnagun-shuyin link 5; braskas-final-aeon possessed-aeon gauntlet
- **where:** src/app/screens/BattleEncounterChain.ts:188-189 (the chain cue at link start); src/story/scripts/ffx2-vegnagun-shuyin.ts:355; src/data/ffx/enemies/braskas-final-aeon.ts:365
- **expected:** One owner decides the music at each chain entrance. Either the chain cue carries through the entrance scene, or the scene alone starts the theme and the next links do not override it. In chapter 3, the gauntlet keeps the cue the 'valefor-enters' scene chose, unless Bailey decides otherwise.
- **observed:** CHAPTER 5, live 76f587c3, 1600x900, real keys. boss-shuyin plays at gain 1 at 1791.1 s and 1792.6 s, while the party has already fought Shuyin for five turns without damaging him. At 1794.1 s current is null with no fading slot. Turn 189 shows Shuyin's HP go 23850 to 18918, and his first damage triggers 'shuyin-appears' (when: hp-below fraction 1), whose first step is music(null, 900). By after-fight (2054.2 s) a boss-shuyin fading slot at 0.85 shows the theme was started again. CHAPTER 3, reused from round 09 (5ddfde3, data unchanged): boss-jecht restarts at possessed Valefor (376.3 s) and is silenced 4 s later by 'valefor-enters'. That scene ends on music('boss-yu-yevon') at 405.5 s. At 414.2 s the possessed-Ifrit link's chain cue (braskas-final-aeon.ts:365, boss-jecht) replaces it, so the rest of the gauntlet plays under Jecht's theme, and boss-yu-yevon returns only at Yu Yevon (658.4 s). NEW this round: the chapter 3 yu-yevon-to-jecht swap was not in the round 10 ticket.
- **repro:** Chapter 5: seed 1, 1600x900, Wait mode, real keys to link 5. Sample window.__pyrefly audioDebug().music every 500 ms from the link 4-to-5 seam until 10 s after 'shuyin-appears' ends. Chapter 3: win to the possessed aeons and sample every 500 ms from the BFA KO to Yu Yevon.
- **evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/run.json (audio[] seam-5*, after-fight); ffx2-vegnagun-shuyin-win/turn-log.json; D:/Final Fantasy/critic/rounds/round-09/evidence/gaps/audio-braskas-final-aeon-5ddfde3/run.json (reused); git show 76f587c3:src/story/scripts/ffx2-vegnagun-shuyin.ts:273-277,354-381; git show 76f587c3:src/story/scripts/braskas-final-aeon.ts:280-306; git show 76f587c3:src/data/ffx/enemies/braskas-final-aeon.ts:247,365,481
- **confidence:** high on the chapter 5 routing state (read from audioDebug, not heard; samples 1.5 s apart); medium-high on chapter 3 (reused, with the dependency argument recorded in CHK-023)
- **requirement:** RUBRIC section 6 audio (routing, phase transitions); CHK-023 (the result survives the next frames); THEMES.md cue map rows 8, 9 and 19
- **fix:** Chapter 5: drop the leading music(null, 900) from 'shuyin-appears' so the chain cue carries through, or give Shuyin's formation no chain cue so the scene starts it. Chapter 3: set the possessed-aeon formations' musicCues to boss-yu-yevon (or remove them) so the cue 'valefor-enters' starts is not overridden. Ask Bailey which way when the sources do not say.
- **acceptanceCheck:** audioDebug sampled every 500 ms: chapter 5 has exactly one boss-shuyin start from the seam to the end of the fight, or none before the scene's last line in the silence variant. Chapter 3 has no boss-jecht between 'valefor-enters' ending and the Yu Yevon link, or the owner-chosen equivalent.
- **round12:** PARTLY REPAIRED on 5be4babe: the FFX / Chapter III half is live-verified (boss-yu-yevon continuous across links 3-7, no boss-jecht return; braskas-final-aeon-win run.json audio). The FFX-2 / Chapter V half (single boss-shuyin start) is fixed in code and pinned by audio-chain-entrance-owner.test.ts (5/5), but no critic capture reached Shuyin: all three live Chapter V runs lost at link 4. It stays open until that half is seen live.
- **mergedFrom:** audio PR-0129; gap pass (ch3 possessed-aeon links, a999d133, 500 ms samples)
- **carried from:** round-11 (76f587c3)

### 24. PR-0123 (major, interface): The enemy-intent headline still pairs the rolled move with the top branch's odds: 'No action MOST LIKELY 88%' above 'Attack 88%, no action 12%'

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2 (the FFX panel builds its label the same way; not observed there)
- **chapter:** ffx2-vegnagun-shuyin (5), link 5
- **where:** not traced this round (FFX-2 intent headline composition)
- **expected:** The headline names the most likely branch with its own percentage, or labels the rolled move with its true share.
- **observed:** At the first menu of link 5 (Shuyin), the headline says 'No action, MOST LIKELY 88%, Spends the turn and does nothing.' while ODDS lists Attack 88% and no action 12%. The link-3 Bulwark headline is honest ('Protect POSSIBLE 29%' with Regen 38%, Shell 33%, Protect 29%).
- **repro:** Live, ch5, 1600x900: play to link 5 and read the intent panel at the first menu.
- **evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/24-seam-5-first-menu.png; 24-seam-3-first-menu.png
- **confidence:** high
- **requirement:** Honest intent that separates certain from conditional
- **fix:** Take the headline's percentage from the branch actually named (moveName), or name the top branch.
- **acceptanceCheck:** At the ch5 link-5 first menu the headline percentage equals that move's ODDS row; a unit test pairs the headline and branch for every sampled report.
- **round12:** Not re-tested on 5be4babe: the Ch V link 5 intent headline needs a Chapter V win route, which no run reached.
- **mergedFrom:** interface; feel-narrative (link 5 headline)
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 25. PR-0144 (major, interface): Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the research

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2 only
- **chapter:** ffx2-leblanc Act III (Last Room)
- **where:** src/data/guides/ffx2-leblanc.ts:111-118; src/engine/tactics/guide.ts:275 (bossId tests only state.combatants[bossId] !== undefined)
- **expected:** The hint describes the command's actual target. For Leblanc, research §3.4: 'Hit her with a sword, not a spell' (Def 10, MDef 62), which her own sensorText repeats.
- **observed:** Engine probe, Act III, seeds 1-20: all 11 'Attack -> Ormi' and 4 'Attack -> Logos' NEXT lines read 'Logos' Evasion 40 is the highest in the fight — a plain swing misses him more than it hits', including rows where only Ormi is alive. On LIVE with real keys (gap pass): Logos KO, NEXT 'RIKKU Attack -> Ormi'; the reason line is hidden at the default fit and, after a real click on MORE, prints the Logos evasion line detached from its NEXT header. The Leblanc hint ('she wants spells, not swords') can never print because the Logos hint matches first, and it inverts §3.4.
- **repro:** cd 'D:/Final Fantasy/critic/rounds/round-10/combat'; R10_FILE=probe-guide-hints.test.ts node D:/pyrefly-release/node_modules/vitest/vitest.mjs run --config vitest.config.ts. Game: chapter 6 Act III after Logos falls, press G on a turn whose NEXT is Attack, click MORE. Seed 1.
- **evidence:** critic/rounds/round-10/combat/probe-guide-hints.json; critic/rounds/round-10/evidence/gaps/ch6-guide/guide3-open-0.png; critic/rounds/round-10/evidence/gaps/ch6-guide/guide3-more-0.png; critic/rounds/round-10/confirm/probe-guide-hints.orig.json
- **confidence:** high (code path, probe re-run by the confirmer, on screen with real keys)
- **requirement:** RUBRIC §2 (the guide gives legal, useful and honest advice); research ffx2-leblanc-syndicate §3.2, §3.4; AGENTS.md rule 6
- **fix:** Add a target condition to GuideHint (for example targetId) and use it on those two hints in place of bossId; reword the Leblanc hint to §3.4; correct or delete the unread FFX2_LEBLANC.sensorTexts.leblanc. Keep the NEXT reason visible at every fit rung, as the source intends.
- **acceptanceCheck:** probe-guide-hints shows the Logos line only on Attack -> Logos and a §3.4-consistent line on Attack -> Leblanc, pinned by a unit test; on screen the reason sits under its NEXT header at the default fit.
- **round12:** Not re-tested on 5be4babe (the Ch VI guide line after Logos falls was not captured).
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 26. PR-0018 (major, interface): The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX (measured); FFX-2 not measured
- **chapter:** braskas-final-aeon
- **expected:** Every command label at 4.5:1 or better against its own slab.
- **observed:** ON 5ddfde3: Re-measured on 5ddfde3 (no longer reused): TALK text rgb(184,134,42) is 1.74:1 on the selected gold row and 2.87:1 on the unselected cream row, both under 3:1; ATTACK scores 10.6-17.4:1.
- **repro:** 1600x900, Chapter 3, first command menu.
- **evidence:** critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/01-talk-selected.png; critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/02-talk-unselected.png; critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/run.json; critic/rounds/round-09/evidence/e119552/braskas-final-aeon-win/10-first-menu-coach.png
- **confidence:** high
- **requirement:** CHK-010.
- **fix:** As round 08: give selected-and-disabled rows their own token (near-black at reduced opacity, or an inverted slab).
- **acceptanceCheck:** A contrast sweep of every row state in both games is at 4.5:1 or better.
- **round12:** Not re-tested on 5be4babe (no contrast measurement of the selected row this round).
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 27. PR-0066 (major, interface): The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** title and chapter select (gates all eight tiles)
- **expected:** CHK-003 and the change's own acceptance: no text a player must read falls below 14 effective css px, and the title still composes at 390x844.
- **observed:** ON 5ddfde3: Re-observed on the phone title and board.
- **repro:** Fresh browser context at 390x844 with no resize down from a larger size. Load the live site, press Enter (or tap the chip) to reach the chapter select, walk every leaf text node under .fe and multiply getComputedStyle(el).fontSize by the accumulated transform scale. No seed involved.
- **evidence:** critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/03-card.png; critic/rounds/round-07/evidence/gaps/pause/390x844/run.json (titleEff.min 9.54, boardEff.min 9.54, 25 nodes listed); critic/rounds/round-07/evidence/fe/frontend.json; critic/rounds/round-07/evidence/fe/16-title-390x844.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/shapes/390x844/run.json (partyPanelEff)
- **confidence:** high — measured on the live bundle, and the mechanism is traced in the shipped CSS
- **requirement:** critic/CHECKS.md CHK-003 pass/fail "zero elements under 14px"; RUBRIC §2 platform goals (phone is a supported shape).
- **fix:** src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.
- **acceptanceCheck:** In a fresh 390x844 context the leaf-text sweep over .fe on both the title and the chapter select returns zero elements under 14 effective px, documentElement.scrollWidth === clientWidth, and the re-shot capture shows no clipped or overlapping labels; the same sweep at 1600x900 and 2000x1012 is unchanged.
- **round12:** Looks repaired by eye on the 390x844 board (interface auditor) but not measured; stays open until a leaf-text sweep of the title, board and prep passes.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 28. PR-0057 (major, visual): At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing)
- **chapter:** reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent
- **expected:** At phone width the speaker name, the faction plate and the line are readable, and the persistent key-hint bar does not overlap them or overflow the viewport.
- **observed:** The whole card is compressed into a roughly 60 px strip at the bottom of the 844 px viewport (slot 77x81 at y=747). The .chint bar renders over it: in chapter 5 "ENTER ADVANCE - HOLD ENTER SKIP - ESC MENU" sits across Nooj's name, his YOUTH LEAGUE plate and his line "Baralai carries him."; in chapter 1 the same bar sits across Kimahri's name and line and his portrait is reduced to a sliver. The hint bar is 443 px wide inside a 390 px viewport (x = -27, overflowing 27 px past each edge). Kimahri's image is 94x137 at y=716 against a 77x81 slot at y=747 — larger than its slot in both axes, PR-0020 again at this size. NOT RE-VERIFIED THIS ROUND; commit 71059ae in the tree claims the phone-width half.
- **repro:** Serve the candidate (D:/pyrefly-release/dist-gate, vite preview). Viewport 390x844, PYREFLY_BROWSER=gpu. Real keys: Enter at the title, ArrowRight x4 for chapter 5 (none for chapter 1), Enter, Enter at party prep. Wait for screen()=="cutscene" AND .dbox--visible AND computed opacity > 0.5 (an earlier capture shows a mid-fade card and must be discarded). Read the .dbox, .dbox__portrait and .chint rects. Deterministic, no seed.
- **evidence:** critic/rounds/round-06/evidence/gaps/escape/phone-v2.json; critic/rounds/round-06/evidence/gaps/escape/ch5-nooj-no-portrait-390x844-v2.png; critic/rounds/round-06/evidence/gaps/escape/ch1-kimahri-painted-390x844-v2.png; critic/rounds/round-06/gap-phone.mjs
- **confidence:** High — measured rects plus two frames, reproduced in both games.
- **requirement:** RUBRIC §5 legibility and CHK-003; the Ink & Gold spec docs/handoff/presentation-ink-and-gold.md — the dialogue card is the primary narrative surface.
- **fix:** Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.
- **acceptanceCheck:** At 390x844 in chapters 1 and 5, with .dbox--visible asserted: the .chint rect does not intersect the .dbox__body or the speaker-plate rect, and .chint lies entirely within 0..viewportWidth.
- **round12:** Narrowed: not reproduced on the Chapter IX phone pre-scene (visual auditor); the other chapters were not re-checked at phone width.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 29. PR-0063 (major, game-awareness): The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX-2
- **chapter:** ffx2-bahamut and ffx2-vegnagun-shuyin (chapter board dossier)
- **expected:** The dossier's faces for an FFX-2 chapter use yuna-x2.png and rikku-x2.png, as the FFX-2 battle HUD in the same session does.
- **observed:** The dossier renders art/portraits/yuna.png and art/portraits/rikku.png — Yuna in her X summoner look, Rikku in her X Al Bhed goggles — beside Paine, who is X-2 only, so the row is visibly two games at once. The correct assets ship and resolve: public/art/portraits/yuna-x2.png and rikku-x2.png exist and the same live session's Chapter 4 battle requests them. The FFX cards are correct (tidus/yuna/kimahri, tidus/yuna/auron), so the fault is FFX-2-only.
- **repro:** Title, Enter, ArrowRight until snapshotState().screenState.selectedId === 'ffx2-bahamut', wait for the faces to load, read the .fe-party__face img sources. No seed involved.
- **evidence:** critic/rounds/round-07/evidence/fe/faces.json (ffx2 block: yuna.png, rikku.png); critic/rounds/round-07/evidence/fe/53-party-row-zoom-ffx2.png; critic/rounds/round-07/evidence/confirm/c2-faces-and-rim.json (per-card faces for all five chapters; all six portraits complete, naturalWidth 832); critic/rounds/round-07/evidence/confirm/c8-ffx2-party-zoom.png; critic/rounds/round-07/evidence/ch4/run.json battleImgs (portraits/yuna-x2.png, portraits/rikku-x2.png)
- **confidence:** high — independently reproduced by the confirmation pass
- **requirement:** AGENTS.md hard rule 14 and CHK-021: a change true to FFX does not apply to FFX-2.
- **fix:** The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.
- **acceptanceCheck:** With an FFX-2 card selected the dossier face images are yuna-x2.png, rikku-x2.png and paine.png; with an FFX card selected they are tidus.png, yuna.png, kimahri.png (and auron.png on Chapter III).
- **round12:** Not re-tested on 5be4babe for the FFX-2 outfits specifically (the visual auditor saw painted busts on all 15 desktop cards but did not rule on FFX versus FFX-2 costumes).
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 30. PR-0014 (major, visual): HUD portrait chips crop through heads; the monogram half is repaired

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** both
- **chapter:** 1 to 5
- **expected:** Every portrait chip shows the whole head with air above the hair and below the chin, consistently framed across the set, and no monogram stands in for a shipped character.
- **observed:** Half repaired, and that half is verified. Paine is now a painted face everywhere she was a letter monogram: party prep (left list and bottom bar, read at 4x), the pause party bar, the battle HUD chip and results — ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits, and the face is recognisable at chip scale (silver-and-red hair, red eyes, studded collar). The crop half is unchanged: the chips still cut the top of the head on Yuna, Rikku and Paine. PARTIALLY REPAIRED IN THIS BUILD: both Paine idles were replaced and src/ui/common/face-crops.json was re-measured, and Paine's HUD chip now crops her face (portraits/paine.png at 48x70, a 0.684 source aspect into a 0.686 slot, so no distortion either). The FFX half and the rest of the FFX-2 cast were not re-swept, so the ticket stays open.
- **repro:** 1600x900: Chapter 1 battle, read the CTB list and the party rows; Chapter 3 battle, read Auron's row; Chapter 4, read Paine's battle row, then lose and read her results row, then RETRY and read the prep roster, then Esc and read the pause chips.
- **evidence:** critic/rounds/round-07/evidence/gaps/art/spotcheck.json (chips); critic/rounds/round-07/evidence/gaps/art/paine-chip-zoom.png; critic/rounds/round-07/targets/zoom-ch4-chips.jpg
- **confidence:** high
- **requirement:** critic/CHECKS.md CHK-012 (the visible crop contains the whole head; a fallback never ships as the final face) and CHK-020 (consistent portrait treatment across shared screens). Owner-reported 2026-09-18 ('Auron's HUD portrait is cropped through the chin').
- **fix:** Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.
- **acceptanceCheck:** Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.
- **round12:** Not re-tested on 5be4babe.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 31. PR-0128 (major, visual): Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX only
- **chapter:** yunalesca (ch2; Tidus's gauge never filled in ch1)
- **expected:** The approved tile: a name plate above the panel and tick labels MISS / HIT x2 / HIT x4 / HIT x6.
- **observed:** The overlay works ("Slice & Dice · SWORDPLAY · CONFIRM IN THE GOLD ZONE", a 1.8 s ring and gold zone; Enter resolved to Spiral Cut). The "G HIDE GUIDE · Yunalesca · NEXT · Waiting for your turn · MORE" card sits over the top-left of the overlay where the name plate belongs, and the bar shows only MISS...HIT.
- **repro:** Seed 1, chapter 2: play until Tidus's menu shows "Overdrive▸READY" (the gap pass used autoBattle, injected, only to fill the gauge), then ArrowDown to it and Enter.
- **evidence:** critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/01-tidus-menu.png; critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/02-overdrive-submenu.png; critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/overlay/f00-f23.jpg; docs/screenshots/mockups/A-swordplay-overlay.jpg; critic/rounds/round-10/evidence/gaps/ch2-win/swordplay-overlay-sheet.jpg
- **confidence:** medium (one capture; live not captured)
- **requirement:** RUBRIC §7 target gate (tile "Swordplay Overdrive", docs/screenshots/mockups/A-swordplay-overlay.jpg)
- **fix:** Hide the guide card, or move it below the overlay, while an Overdrive overlay is up; restore the tick labels from the tile.
- **acceptanceCheck:** The frame 0.5 s after Enter on Slice & Dice shows the name plate unobstructed and four tick labels.
- **round12:** UNVERIFIED on 5be4babe: Tidus's Overdrive never charged in eight real-key Chapter I routes, so no frame of the Swordplay overlay exists (gap pass, od-seymour-flux-tidus).
- **mergedFrom:** gap capture (visual-targets request)
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 32. PR-0060 (major, process): The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce

- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Release frame: live 5be4babe (release 15) against the build it replaced, 1c22066e (release 14).
- **game:** FFX only
- **chapter:** ch.3 (braskas-final-aeon)
- **expected:** The tile's stated acceptance case, "A dialogue line spoken by Yu Yevon with the portrait showing (public/art/portraits/yu-yevon.png)", is producible from play so the tile can be verified.
- **observed:** No shipped script gives yu-yevon a say() line. grep -rn "say('yu-yevon'" over src/story/ returns nothing, and a full trace of every say() id in every shipped script does not list it. yu-yevon is declared as a SpeakerId (src/story/dsl.ts:45) and exists as a combatant id, an AI script id and a music/sfx key, but its only story-layer uses are a trigger condition (braskas-final-aeon.ts:221, when: { type: "hp-below", who: "yu-yevon" }) and an fx call (line 349); the lines over his on-field reveal belong to Tidus and then Auron (lines 350-352). public/art/portraits/yu-yevon.png ships at 1.56 MB and can never be displayed as a speaker portrait. The tile's own note already records that the file is a safety net against a 404 rather than a face, which contradicts the acceptance case as written.
- **repro:** In D:/pyrefly-release: grep -rn "say('yu-yevon'" src/story/ (no matches); grep -rn "yu-yevon" src/story/ (only dsl.ts:45 and braskas-final-aeon.ts 220/221/223/285/305/347/349). Then play chapter 3 to the yu-yevon-arrives trigger and observe the speaker is Tidus, then Auron.
- **evidence:** critic/rounds/round-06/evidence/gaps/yu-yevon/trace.txt (full grep transcript and the tile record); critic/rounds/round-06/evidence/gaps/audio/ch3-phase-7.png (the arrival itself)
- **confidence:** High — traced in source, and the tile's own note corroborates it.
- **requirement:** CHK-012 and RUBRIC §7's approved-target gate — every required tile in docs/target/targets.json must be matched from the build.
- **fix:** An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.
- **acceptanceCheck:** Either a captured dialogue frame at 1600x900 shows speaker "Yu Yevon" with yu-yevon.png at naturalWidth > 0, or the tile in docs/target/targets.json carries a delivery state that does not require one.
- **round12:** Not re-tested; a records question, unchanged.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 33. PR-0182 (polish, interface, was R12-01 (absorbs R15-03)): Kimahri's Ronso Rage takes five presses, two of them silent: the first Enter on OVERDRIVE does nothing, and the chosen Rage is asked again in a 'CHOOSE A RAGE' overlay

- **game:** FFX
- **chapter:** I (Mighty Guard), IX (Doom)
- **where:** Kimahri's command menu, OVERDRIVE READY
- **expected:** One Enter opens the Overdrive list, and the Rage picked there fires after its own confirm, as Auron's Overdrive does on the first Enter.
- **observed:** Chapter I, seed 1, Kimahri's first turn. ArrowDown to OVERDRIVE, then Enter: after 1.5 s the rows are unchanged, the log shows no event, and a 1.2 s pause before the Enter changes nothing. A second Enter opens Jump / Mighty Guard / White Wind. ArrowDown and Enter on Mighty Guard: nothing again. Another Enter opens the 'RONSO RAGE · CHOOSE A RAGE Jump Mighty Guard White Wind' overlay, and only its Enter fires Mighty Guard. Chapter IX's Doom follows the same pattern ('Doom (one-item group, direct)' followed by 'Doom' in every turn log). The overlay has no timeout, so a harness that did not confirm it waited 20 minutes.
- **repro:** node critic/rounds/round-12/cap/rage.mjs seymour-flux 'Mighty Guard' 1600x900 (OPEN_TWICE=1 shows the second Enter opening the list)
- **evidence:** critic/rounds/round-12/evidence/rage-seymour-flux-MightyGuard-1600x900-r3/ and -r4/ (run.json, 01-overdrive-enter.png, 01b-overdrive-second-enter.png); seymour-flux-win/ (the 20-minute stall)
- **confidence:** high (reproduced 4 times at two sizes)
- **requirement:** CHK-015; interface (reliable input)
- **fix:** Make OVERDRIVE open Kimahri's Rage list on the first Enter, and either let the menu choice fire directly or make the KimahriRage overlay the only chooser (opened by the first Enter).
- **acceptanceCheck:** From Kimahri's menu, Overdrive > Mighty Guard in Chapter I and Overdrive > Doom in Chapter IX each fire after Enter, ArrowDown(s), Enter and at most one overlay confirm, with no press that changes nothing

### 34. PR-0191 (polish, feel, was ZG-1): during Zanmato the gauge panel already reads 0% and 'Next: Daigoro', and the full-gauge banner can last about 0.6 s

- **game:** FFX only
- **chapter:** IX
- **where:** Zanmato gauge panel and banner during the strike, 1600x900
- **expected:** The approved O-5 banner holds its one-shot (BANNER_HOLD_MS 2600), and the panel should not name the next ordinary move while Zanmato is still playing out. The engine's decision-time reset is sourced and fine; the HUD should follow the presented events, not the state that is already ahead of them.
- **observed:** The gauge reached 100 through Valefor's attack (seq 335) and Yojimbo's turn came next. The banner showed at 145,894 ms and was removed at 146,486 when the gauge reset at decision time (seq 339). Then, for the whole strike playback, the panel showed '0%' and 'Next: Daigoro' while the 9999 landed on Valefor (seq-zanmato-strike-1 f000-f030).
- **repro:** Fresh profile, live, 1600x900, Chapter IX, advisor-guided heals, never Doom, summon aeons from 85%, as in yoj.mjs aeon with ADV=heal. First Zanmato at about 146 s. Seed 1.
- **evidence:** critic/rounds/round-12/evidence/gaps/ch9-aeon-r5/recorder.json (marks), seq-zanmato-strike-1/frames.json, contact-strike1.jpg, contact-strike1b.jpg
- **confidence:** medium-high (timings measured; exact cause in ZanmatoGauge update order not traced)
- **requirement:** Approved tile 'The Zanmato gauge (FFX)'; RUBRIC feel (readable, coherent action and reaction)
- **fix:** Drive the gauge view from the presented overdrive-gauge event (or hold the full state until Zanmato's action-end), and let the banner finish its hold even if the reset arrives.
- **acceptanceCheck:** In a replay of the same route, the banner stays at least 2.6 s, and the panel reads Zanmato (or full) until the 9999 has landed.

### 35. PR-0121 (polish, visual): At 3840x2160 the pause plate stops at 3380x1931 and leaves black bands

- **game:** both
- **chapter:** all
- **expected:** Full-bleed at every size (CHK-002).
- **observed:** The plate <img> is 3375x1929 at (-7,-4) in a 3840x2160 viewport: Tidus (ch1), Yuna FFX-2 (ch4) and Lulu (ch9). About 470 px on the right and 235 px at the bottom are empty dark page with a hard edge, and there is no feathered falloff. It looks capped at the 2x master's natural 3360x1920 (plus the 1.0046 push-in). At 2560x1440 the same plates cover the window.
- **repro:** node gaps/firstmenu.mjs seymour-flux 3840x2160 pause
- **evidence:** critic/rounds/round-12/evidence/gaps/shape-seymour-flux-3840x2160/20-pause.png (+_pause-small.jpg), shape-ffx2-bahamut-3840x2160/20-pause.png (+_pause-small.jpg), shape-yojimbo-cavern-3840x2160/run.json (pause.imgs rect)
- **confidence:** high
- **requirement:** CHK-002
- **fix:** In the pause framing (src/app/screens/pause/PortraitStage.ts place(), fed by framePlate or the framer), never let the plate box fall below cover size for the viewport. Allow an upscale past the 2x master's natural size, or feather that edge when the cap applies. Not traced to the exact line.
- **acceptanceCheck:** A fresh 3840x2160 context in ch1, ch4 and ch9 shows the plate rect covering the viewport (or a slid plate with a feathered edge), and the screenshot has no hard bar. 2560x1440 is unchanged.
- **round12:** Re-observed on 5be4babe by the gap pass at 3840x2160 in Ch I, IV and IX (the plate is 3375x1929 at (-7,-4), a hard empty band of about 470 px right and 235 px bottom; it passes at 1280x720, 1280x960, 2560x1080 and 2560x1440). The gap pass filed it as a new major (PAUSE-4K); it is the same defect round 11 filed as PR-0121 at polish on 76f587c3, so it keeps its id and severity for consistency; CHK-002 fails at 4K.
- **carried from:** round-11 (76f587c3)

### 36. PR-0183 (polish, visual, was R12-VIS-01): in Chapter I target selection, the target name plate is drawn over Yuna's head and face

- **game:** FFX
- **chapter:** seymour-flux (Chapter I), ATTACK target on Mortiorchis
- **expected:** The target plate docks against the selected enemy and clears every actor's face (CHK-008).
- **observed:** The 'Mortiorchis' plate docks where Yuna now stands after the PR-0002 move. At 1600x900 it covers the top of her head; at 2000x1012 it covers her face. A second 'I MORTIORCHIS' chip floats separately to the right.
- **repro:** Chapter I from the title, seed 1, first menu > ATTACK (default target Mortiorchis), at 1600x900 and 2000x1012.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/visual/ch1-target-zoom.jpg
- **confidence:** high
- **requirement:** CHK-008
- **fix:** Add actor quads to the target plate's avoid set (hudAvoidSelectors / targetChipClear already avoid panels), or dock the plate above the enemy's bracket.
- **acceptanceCheck:** In ch1 and ch3 target selection at 1600 and 2000, the plate's box does not intersect any party member's head box.

### 37. PR-0186 (polish, visual, was R12-VIS-04): while Braska's Final Aeon is targeted, the Sensor card covers the lower half of Yu Pagoda B

- **game:** FFX
- **chapter:** braskas-final-aeon (Chapter III), target selection, arrow right to BFA
- **expected:** No targetable enemy more than about 25% occluded, even while targeting (CHK-011).
- **observed:** The 'Braska's Final Aeon HP ???' Sensor card sits over Yu Pagoda B's base. Only its roof shows.
- **repro:** Chapter III from the title, 1600x900, seed 1, ATTACK, arrow right.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/visual/ch3-target-zoom.jpg
- **confidence:** high
- **requirement:** CHK-011
- **fix:** Include enemy quads in the Sensor card's avoid rect (enemyObstacleRect.ts exists), or dock the card under the turn column.
- **acceptanceCheck:** In every ch3 target state at 1600 and 2000, both Pagodas are at least 75% visible.

### 38. PR-0184 (polish, visual, was R12-VIS-02): the Chapter IX night-sakura arrival shows a straight side cut on the tree and hangs the canopy above the horizon

- **game:** FFX
- **chapter:** yojimbo-cavern (Chapter IX), battle-start arrival sequence
- **expected:** The arrival from sheet-arrival.jpg option A: a grounded tree, no visible plate edge.
- **observed:** When the camera frames Yojimbo (seq-transition f05-f09), the approved sakura canopy fills the upper frame. Its right side ends in a straight vertical fade, and its trunk base floats above the floor line. In the approved option A bottom row, the tree stands on the chamber floor with the cave walls still visible.
- **repro:** Chapter IX from the title, 1600x900, seed 1, watch the pre-scene hand over to the fight.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/targets/ch9-sakura-arrival.jpg; D:/Final Fantasy/critic/rounds/round-12/visual/ch9-arrival.jpg
- **confidence:** medium
- **requirement:** CHK-013 (render of approved art), D-072
- **fix:** Rendering only (the approved PNG stays untouched): anchor the overlay quad's base to the floor plane behind the pad, and widen the quad's side alpha falloff in src/scenes/cavern-stolen-fayth-arrival.ts (suspected).
- **acceptanceCheck:** The arrival frames at 1600 and 2000 show no straight edge on the canopy and a trunk meeting the floor.

### 39. PR-0185 (polish, visual, was R12-VIS-03): Chapter IX enemy-action and arrival shots slice the party's heads at the bottom edge

- **game:** FFX
- **chapter:** yojimbo-cavern (Chapter IX), Kimahri attack result, Yojimbo's actions, arrival
- **expected:** Either a clean over-the-shoulder with readable party silhouettes, or the party fully out of frame.
- **observed:** The camera frames Yojimbo, and the tops of Kimahri's, Yuna's and Lulu's heads poke in along the bottom edge, cut mid-face (16-target-single 2000, seq-action-playing, arrival f06-f09). It reads as an accidental crop rather than an over-the-shoulder shot.
- **repro:** Chapter IX from the title, 2000x1012 or 1600x900, seed 1, first ATTACK and the following enemy turn.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/yojimbo-cavern-win/16-target-single.png; D:/Final Fantasy/critic/rounds/round-12/evidence/yojimbo-cavern-win-1600/seq-transition-into-battle/f06.jpg
- **confidence:** medium
- **requirement:** visual composition (RUBRIC section 6), related to PR-0157
- **fix:** Lower the Yojimbo shot's camera or pull it closer on src/scenes/cavern-stolen-fayth-rigs.ts, so the party is fully below the frame or a deliberate shoulder silhouette.
- **acceptanceCheck:** No party head is cut by the frame edge in the ch9 enemy-action and arrival frames at 1600 and 2000.

### 40. PR-0188 (polish, interface, was R12-UI-02): the intent card describes Yojimbo's Daigoro order as 'non-elemental damage to itself - never misses.'

- **game:** ffx
- **chapter:** yojimbo-cavern
- **where:** src/battle/ffx/intent.ts describeAbility (TARGET_WORD self → 'itself'; damageType 'other' still falls into the damage sentence with an empty kind, so it starts lower-case). The row is YOJIMBO_DAIGORO_ORDER (targeting 'self', formula 'none', no status) in src/data/ffx/enemies/yojimbo-abilities.ts
- **expected:** The order row reads as an order ('Orders Daigoro to bite a random character'), and the bite's damage is shown as a random pick (see PR-0153).
- **observed:** The first menu after E, 1600x900, shows 'YOJIMBO Daigoro SCRIPTED — non-elemental damage to itself - never misses. DAMAGE KIMAHRI 517-584'.
- **repro:** Seed 1, Ch IX from the title, first menu, press E.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c9-intent.jpg
- **confidence:** high
- **requirement:** CHK-004 scope (intent names what the move does); CHK-007
- **fix:** In describeAbility, give formula 'none' with no status effects its own sentence (an order or a no-damage action), and never pair 'damage' with targeting 'self' for a no-power row.
- **acceptanceCheck:** At the Ch IX first menu the intent sentence for the Daigoro order contains neither 'damage to itself' nor a lower-case start.

### 41. PR-0189 (polish, interface, was R12-UI-03): labels shown truncated: FFX-2 'CHA… CURSED', the pause CHAPTER tab's 'DRESSPHE…', and the advisor effect chip cut at the card's slanted edge

- **game:** both
- **chapter:** ffx2-bahamut (Change row, pause), seymour-flux (advisor chip)
- **where:** FFX-2 command row with a status tag; the pause CHAPTER party column; the advisor effect chip row
- **expected:** Every name that can be shown is shown in full.
- **observed:** Ch IV 1600x900 with Paine Cursed: the Change row reads 'CHA…  CURSED'. Ch IV 2000x1012 pause CHAPTER tab: each member's dressphere line reads 'DRESSPHE…'. Ch I 2000x1012, Kimahri: '+ PROTECT, SHELL, NULBLAZE, NULFROST, NULSHOC' runs off the card edge.
- **repro:** Seed 1. Ch IV: reach Paine's turn after Curse and open the menu, or Esc then the CHAPTER tab at 2000x1012. Ch I 2000x1012: Kimahri's first turn with Mighty Guard advised.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/pausech-zoom.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/rage2000.jpg
- **confidence:** high
- **requirement:** CHK-009
- **fix:** Let a status tag wrap under the label or shrink it, never the command name. Widen the pause party column, or put the dressphere under the name. Wrap the effect chip inside the card's inner box.
- **acceptanceCheck:** scrollWidth <= clientWidth + 1 for these labels at 1280, 1600, 2000 and 3840, and no ellipsis is engaged.

### 42. PR-0190 (polish, interface, was R12-UI-04): during an FFX turn cut-in the arrows already move the lifted command cascade, but the first Enter only ends the cut-in, so a confirm on the highlighted row is lost

- **game:** ffx (PR-0005 option B lift is FFX only)
- **chapter:** seymour-flux (Kimahri's first turn); likely every FFX turn with a cut-in
- **where:** src/ui/common/transitions/TurnCutInLayer.ts:14-15 and :101-104 (confirmPress ends the hold; the comment assumes no menu exists yet, but option B lifts the cascade above the slab)
- **expected:** Either the cascade takes no input until the hold ends, or Enter on a highlighted row both ends the cut-in and confirms.
- **observed:** rage r3 and r4, 1600x900, awaitingMenu true on Kimahri's turn: four ArrowDown presses moved the selection to OVERDRIVE, but Enter left the top-level menu unchanged 1.5 s later. A second Enter opened Jump / Mighty Guard / White Wind. The capture owner's route needed a 'second Enter on Kimahri OVERDRIVE' patch, and the 2000x1012 r1 run stalled here.
- **repro:** 1600x900, seed 1, Ch I from the title. On Kimahri's first command menu press ArrowDown x4 at 120 ms spacing, then Enter, within the cut-in hold.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/rage-seymour-flux-MightyGuard-1600x900-r4/run.json; D:/Final Fantasy/critic/rounds/round-12/interface/rage3.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/rage.jpg
- **confidence:** medium (the timing was not recorded against the cut-in's lifetime)
- **verdict:** PLAUSIBLE
- **requirement:** CHK-015 (reliable input); RUBRIC §6 interface
- **fix:** Hold arrow input while the cut-in is up, or forward the confirm press to the menu after dismissing the cut-in.
- **acceptanceCheck:** A real-key test presses Arrow then Enter at 100, 300 and 600 ms after a cut-in starts. Each time either the arrow is ignored, or the Enter opens the highlighted row.

### 43. PR-0192 (polish, interface, was ADV-X2-1): ADV-X2-1: in FFX-2 the advisor's revive reason says 'Only Yuna can call an aeon' (an FFX concept in FFX-2)

- **game:** FFX-2 only
- **chapter:** VI (any FFX-2 chapter with Yuna KO'd)
- **where:** Advisor card, second suggestion, Phoenix Down → Yuna
- **expected:** FFX-2 Yuna has no Summon command. The reason should list only what her current dressphere actually loses (rule 14: a change true to FFX does not apply to FFX-2).
- **observed:** 'Only Yuna can call an aeon — stand Yuna up.' shown in Chapter VI (Leblanc) with Yuna as a Gunner.
- **repro:** Fresh profile, live, 1600x900, Chapter VI from the title, default Wait. Hold the first top list until Yuna is KO'd (about 60 s). Read the advisor card. Seed 1.
- **evidence:** critic/rounds/round-12/evidence/gaps/ko-ffx2-leblanc/ko-2.png
- **confidence:** high (screenshot plus code trace)
- **requirement:** AGENTS.md rule 14; CHK-021; RUBRIC §2 (the advisor offers legal, useful actions)
- **fix:** Gate the 'call an aeon' clause on the FFX game (or on the fallen actor actually having a Summon command in state). FFX unchanged.
- **acceptanceCheck:** The same Ch VI state shows a reason without 'aeon'. An FFX chapter with Yuna KO'd still says 'call an aeon'.

### 44. PR-0193 (polish, interface, was TGT-LBL): TGT-LBL: the multi-target field label is a fixed 13 px and sits partly under the intent card at 2560x1440 (FFX-2 Ch VI)

- **game:** both
- **chapter:** VI (FFX-2); III (FFX)
- **where:** Target selection for all enemies or all allies at 1280x720 and 2560x1440
- **expected:** CHK-010: an explicit ALL ENEMIES / ALL ALLIES label that reads at a glance; CHK-003 14 px floor.
- **observed:** 'ALL ENEMIES' / 'ALL ALLIES' is 13 px at both 1280x720 and 2560x1440 (it does not scale with the stage). At 2560x1440 in Ch VI the Grenade label is partly overlapped by the Fem-Goon intent card. The TARGET plate and brackets are clear.
- **repro:** Fresh context 2560x1440, live, Chapter VI from the title. Yuna: Item > Grenade > Enter. Seed 1.
- **evidence:** critic/rounds/round-12/evidence/gaps/targets-ffx2-leblanc-2560x1440/Grenade-targeting.png, run.json (allEl px and rect); contact-multitarget.jpg
- **confidence:** medium (measured size; the overlap judged from the screenshot)
- **requirement:** critic/CHECKS.md CHK-010, CHK-003
- **fix:** Scale the label with the stage and floor it at 14 px. Add the intent card to the label's avoid list.
- **acceptanceCheck:** At 1280x720 and 2560x1440 the label is at least 14 px effective and does not intersect the intent card.

### 45. PR-0194 (polish, narrative): PR-0194: Chapter V: Jecht's Farplane line repeats six times in about four minutes on link 2

- **game:** FFX-2 only
- **chapter:** V, link 2 (the Leg)
- **where:** Mid-battle Farplane voice
- **expected:** The script intends the line to repeat ('worth hearing twice', ffx2-vegnagun-shuyin.ts:419-421), and the writing bible asks for one-shot pools. Six times in about four minutes wears it out.
- **observed:** 'Forget the lights up top. The leg's the job.' appeared at 489, 533, 565, 630, 728 and 750 s of the run, six separate showings.
- **repro:** Fresh profile, live, 1600x900, Chapter V from the title, advisor-guided real keys to link 2, then fight the Leg. Seed 1.
- **evidence:** critic/rounds/round-12/evidence/gaps/ffx2-vegnagun-shuyin-win-walk/run.json (dboxTimeline), 40-beat-14..33.jpg
- **confidence:** high (observed); judged minor
- **requirement:** RUBRIC narrative (banter, stakes); src/story/scripts/ffx2-vegnagun-shuyin.ts header (one-shot pools)
- **fix:** Cap the 'farplane-voice' pool at two showings per battle, or add a cooldown.
- **acceptanceCheck:** The same route shows the line at most twice on link 2.

### 46. PR-0187 (polish, narrative, was R12-FN-02): R12-FN-02: the Chapter III results card fires '...Okay. Next one.' between Yu Yevon's death and the FFX ending

- **game:** FFX only
- **chapter:** braskas-final-aeon, results between post and epilogue
- **where:** D:/pyrefly-rel15/src/story/scripts/braskas-final-aeon.ts:120 (results() before the epilogue), :170-178 (victoryQuips)
- **expected:** No light or 'next' tally line in the middle of the FFX ending. writing-bible section 5.4: 'never fire a victory quip after a story-critical loss-shaped victory (E4's aeon kills)... suppress the tally flourish'. The epilogue that follows is Auron's sending and Tidus fading.
- **observed:** The results read 'Victory NEW BEST ...Okay. Next one.'. CONFIRM then opens the epilogue ('Is that it? Did we—'). The script deliberately gives this chapter an end-of-chapter quip bank.
- **repro:** Win Chapter III with real keys (seed 1) and read the results card.
- **evidence:** critic/rounds/round-12/evidence/braskas-final-aeon-win/31-results.png; .../run.json resultsText; .../33-after-confirm-scene.png
- **confidence:** medium (section 5.4 also lists Tidus's grim line for E4, so the call is partly interpretive; a question for Bailey)
- **requirement:** writing-bible section 5.4; RUBRIC section 6 narrative (right tone, satisfying aftermath)
- **fix:** Set victoryQuips to {} for braskas-final-aeon, as Chapter IX does.
- **acceptanceCheck:** A real-key Chapter III win shows the results with no quip, and the epilogue follows unchanged.

### 47. PR-0195 (polish, process): the CHK-024 save and settings upgrade matrix has never been run, four reviews in a row

- **chapter:** n/a (cross-cutting, save/settings persistence)
- **expected:** a fixture of a previous release's localStorage is loaded before boot and the returning-player path (settings applied, progress preserved, invalid/truncated storage handled, reload mid-battle) is exercised at least once, per CHK-024's own SCOPE
- **observed:** no round-09 through round-12 evidence contains a fixture-based upgrade test; every save-adjacent capture this round is a same-session board-reload, not a cross-version upgrade
- **repro:** n/a - this is an evidence gap, not a reproduced player-facing bug
- **evidence:** critic/rounds/round-12/evidence/index.json (9 'save'-matching items are all *-win/35-board-reload.png); git diff --stat 76f587c3..5be4babe -- src/app/SaveData.ts src/app/saveMerge.ts is empty, confirming no new code risk but also that the old gap was never closed
- **confidence:** high (absence confirmed directly in the evidence tree)
- **requirement:** RUBRIC S6 milestone gate: 'no UNVERIFIED mandatory check'; CHK-024 SCOPE names exactly this matrix
- **fix:** add a tests/fixtures/saves/ snapshot of the current live build's localStorage and load it before boot in one Playwright run per release, per CHK-024's own AUTOMATE note
- **acceptanceCheck:** a released build's report shows CHK-024 result=PASS with evidence naming the specific fixture, returning-player scenario and reload point exercised
- **note:** The prep-delivery auditor filed this as a major delivery defect. No player-facing failure was observed and SaveData.ts / saveMerge.ts are byte-identical in the range, so the chief records it as a process issue and as a requiredNotTested item; it still blocks any milestone claim (RUBRIC section 6: no UNVERIFIED mandatory check).

### 48. PR-0109 (polish, prep): Chapter-select cursor always snaps back to Chapter I after leaving prep, not the chapter just visited (PR-0109, STALLED)

- **chapter:** all (observed in seymour-flux, braskas-final-aeon, evrae-airship, ffx2-bahamut, ffx2-leblanc, ffx2-vegnagun-shuyin, yojimbo-cavern)
- **where:** src/app screens: party prep Esc-back handler and chapter-select cursor restore
- **expected:** Esc-back from party prep returns the chapter-select cursor to the chapter that was just backed out of
- **observed:** cardAfterBack='seymour-flux' in all 16 round-12 run.json files that record a prep Esc-back, regardless of which chapter's prep was entered
- **repro:** From chapter-select, enter any chapter's Party Prep, press Esc to back out; the highlighted card is always Chapter I (Seymour Flux) instead of the chapter you were just in. Seed is irrelevant.
- **evidence:** critic/rounds/round-12/evidence/{braskas-final-aeon-win,evrae-airship-win,ffx2-bahamut-win,ffx2-leblanc-win,ffx2-vegnagun-shuyin-win,yojimbo-cavern-win}/run.json field cardAfterBack
- **confidence:** high (16/16 samples this round, 4th consecutive review observing it)
- **requirement:** RUBRIC S8 stagnation rule: 3+ reviews with the same issue open at the same severity is STALLED and needs a written method check before another similar repair attempt
- **fix:** Persist the last-visited chapter id and restore the cursor to it on Esc-back, instead of defaulting to index 0
- **acceptanceCheck:** Enter prep for chapters other than I (e.g. V, IX), Esc back, and confirm cardAfterBack equals that chapter's id across a fresh real-key sample of at least 5 chapters
- **note:** The prep-delivery auditor raised it to major because it is STALLED; stalling calls for a method check (RUBRIC section 8), not a higher severity, and the impact (the cursor returns to Chapter I) is unchanged, so it stays polish as in round 11.

### 49. PR-0170 (polish, interface): Attack on Yojimbo fires at once, with no target step and no back-out

- **game:** FFX
- **chapter:** IX
- **where:** command menu > Attack
- **expected:** A consistent target step, or a documented one-target rule
- **observed:** 600 ms after Enter on ATTACK, Lulu's hit (297) is already on screen. Ginnem and Daigoro cannot be targeted, so Yojimbo is the only valid target.
- **repro:** route.mjs yojimbo-cavern win 1600x900 1600 (step 16)
- **evidence:** critic/rounds/round-12/evidence/yojimbo-cavern-win-1600/16-target-single.png
- **confidence:** high
- **requirement:** interface: clear target sets
- **fix:** Show the target step even with one valid target, or leave it and tell Bailey
- **acceptanceCheck:** Enter on Attack in Chapter IX shows the bracket on Yojimbo, and Escape returns to the menu
- **note:** Gap pass: the cause is established. CommandMenuLogic.ts:176 resolveTargetMode returns "auto" when a command has exactly one valid target. Whether that is faithful is a question, not a scored defect.

### 50. PR-0171 (polish, interface): the pause CHAPTER tab's text column crosses the hero plate's face in battle as well as over a scene, now also on Chapter IX

- **game:** both
- **chapter:** II, IX
- **where:** pause > CHAPTER
- **expected:** Text clears the hero's face; no empty headings
- **observed:** Chapter II: the quote and the three thumbnails sit across Yuna's eyes at 1600 and 2000, and over a scene the 'THE PARTY' heading is empty. Chapter IX: the quote and thumbnails sit across Yojimbo's mask.
- **repro:** node critic/rounds/round-12/cap/pausechapter.mjs yunalesca 2000x1012; pausechapter.mjs yojimbo-cavern 2000x1012
- **evidence:** critic/rounds/round-12/evidence/pause-chapter-yunalesca-2000x1012/scene-chapter-tab.png, pause-chapter-yunalesca-1600x900/battle-chapter-tab.png, pause-chapter-yojimbo-cavern-2000x1012/battle-chapter-tab.png
- **confidence:** high
- **requirement:** RUBRIC §2 pause close-ups; PR-0079 mirror rule
- **fix:** Move the scene column to the side away from each plate's face, or dim and inset it; hide THE PARTY while a scene has no party.
- **acceptanceCheck:** No text box overlaps the face region of any ch2 or ch9 plate at 1600 or 2000

### 51. PR-0168 (polish, interface): the pause SCENE row prints the internal scene key

- **game:** both
- **chapter:** III, VIII, IX
- **where:** pause > CHAPTER > SCENE
- **expected:** The chapter's location name ('Cavern of the Stolen Fayth — the last chamber')
- **observed:** 'CAVERN STOLEN FAYTH' (IX), 'DREAMS END' with its apostrophe dropped (III), 'EVRAE AIRSHIP DECK' (VIII)
- **repro:** pausechapter.mjs yojimbo-cavern 2000x1012
- **evidence:** critic/rounds/round-12/evidence/pause-chapter-*/run.json (shots[].text)
- **confidence:** high
- **requirement:** CHK-007
- **fix:** Read chapter.location, not sceneKey
- **acceptanceCheck:** The SCENE row equals the dossier's LOCATION for every chapter

### 52. PR-0019 (polish, interface): The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending

- **game:** both (shared help-slab composition); observed in FFX
- **chapter:** 1 (Seymour Flux)
- **expected:** 'Inflicts Cheer. Hits the whole party.' with the ALL ALLIES chip clear of the text.
- **observed:** ON 5ddfde3: Partly re-observed (ch3, 1600x900): with Al Bhed Potion on the party the "ALL ALLIES" chip (13 px) is attached to the top row of the list (HI-POTION), not the selected item, and the item list covers Yuna's bracket.
- **repro:** 1600x900: Chapter 1, first player turn, Right into SPECIAL, cursor on CHEER, confirm to raise the group target frame, read the help slab.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg
- **confidence:** high
- **requirement:** critic/CHECKS.md CHK-009 (every name that can be shown is shown in full) and CHK-010's all-target label. This build also claims every command's help sentence matches its real targeting.
- **fix:** Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.
- **acceptanceCheck:** For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.
- **round12:** Narrowed and re-observed (interface auditor): the ALL ALLIES chip now docks beside the selected row (repaired half), but the help sentence still ends "...Hits the whole...". Severity lowered from major to polish because only the truncated sentence remains.
- **carried from:** round-11 (76f587c3)

### 53. PR-0010 (polish, interface): The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest

- **game:** both (shared panel)
- **chapter:** 1 and 2 shown; anywhere the body overflows
- **expected:** Either the whole counter list is legible, or the hidden part is signposted and reachable with the keyboard and pad the game is played with - the treatment the strategy guide gets with its MORE chip.
- **observed:** ON 5ddfde3: Widened: now visible in both games, the intent ODDS list and the FFX counter bullets are cut mid-glyph with no way to read the rest.
- **repro:** Chapter 2, first player turn, press E, 1600x900, read the IF YOU ATTACK list; repeat at Chapter 1.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg
- **confidence:** high - visible in two chapters and traced to the cap and the clipped class in the shipped CSS
- **requirement:** RUBRIC section 6 interface (honest intent that separates certain from conditional); CHK-003 (zero clipped).
- **fix:** Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.
- **acceptanceCheck:** At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.
- **round12:** Improved (interface auditor): the counter list now ends "J HOLD · +2 MORE" instead of a mid-glyph cut; J itself was not exercised. Severity lowered from major to polish because the mid-glyph cut is gone and a key path is advertised.
- **carried from:** round-11 (76f587c3)

### 54. PR-0104 (polish, feel): under Wait, a confirmed FFX-2 command does not visibly resolve before the next girl's cut-in and menu

- **game:** FFX-2 only
- **chapter:** ffx2-bahamut, ffx2-leblanc
- **expected:** The confirmed action reads before the next decision is asked for.
- **observed:** Ch6: Grenade is confirmed, Paine's cut-in comes at 0.30 s and her menu at about 1.0 s, and Rikku's wind-up starts only at about 1.7 s with no impact by 2.2 s. Ch4: Shell is confirmed, Rikku's cut-in and menu are up by 0.85 s, and Yuna starts casting at 2.38 s. The FFX-2 battle-message change (2dff49ba) did not alter this.
- **repro:** Ch4 or ch6, Wait mode (the default), seed 1: confirm any command with real keys.
- **evidence:** critic/rounds/round-12/feel-narr/ffx2-leblanc-win__seq-party-action.jpg; critic/rounds/round-12/feel-narr/ffx2-bahamut-win__seq-party-action.jpg
- **confidence:** high
- **requirement:** RUBRIC section 6 feel (action and reaction timing)
- **fix:** Hold the next cut-in until the confirmed action's action-start has played at least its wind-up, in Wait mode only.
- **acceptanceCheck:** Ch6 seq-party-action: the confirmed action's visible start comes before the next cut-in frame.

### 55. PR-0146 (polish, feel): the enemy-intent panel shows over the title-card crossfade

- **game:** FFX-2 (observed ch4)
- **chapter:** ffx2-bahamut
- **expected:** Panels arrive after the intro sweep.
- **observed:** The 'Curse' intent slab is visible over the fading card at 363 ms and gone at 658 ms.
- **repro:** Ch4 from the title, seed 1: hold Enter over the scene.
- **evidence:** critic/rounds/round-12/feel-narr/ffx2-bahamut-win__seq-transition-into-battle.jpg
- **confidence:** high
- **requirement:** RUBRIC section 6 feel (smooth transitions)
- **fix:** Mount the intent panel only after the battle-start moment resolves.
- **acceptanceCheck:** No HUD panel in any transition frame before the boss caption.

### 56. PR-0133 (polish, narrative): aftermath scenes stage only the backdrop, except Chapter IX

- **game:** both
- **chapter:** braskas-final-aeon epilogue (observed); others carried
- **expected:** The aftermath shows the people it is about (writing-bible section 2.1).
- **observed:** Chapter IX now stages Lady Ginnem for the sending (30-post-scene.png). Chapter III's post scene and epilogue open on the bare Inside Sin backdrop (30-post-scene.png, 33-after-confirm-scene.png), although the script poses Yuna and Auron.
- **repro:** Win Chapter III and watch the post scene and the epilogue.
- **evidence:** critic/rounds/round-12/evidence/braskas-final-aeon-win/30-post-scene.png; .../33-after-confirm-scene.png; critic/rounds/round-12/evidence/yojimbo-cavern-win-1600/30-post-scene.png
- **confidence:** medium (only first-line stills exist)
- **requirement:** RUBRIC section 6 narrative (satisfying aftermath)
- **fix:** Use the Chapter IX cutscene-figure staging (cutsceneFigures) for the actors that Chapter III's epilogue addresses.
- **acceptanceCheck:** A timed capture of the Chapter III epilogue shows Auron and Yuna on stage for the sending.

### 57. PR-0176 (polish, visual): aeon turn-order tiles show ink letter chips instead of portraits

- **game:** FFX
- **chapter:** yojimbo-cavern (Chapter IX) with Ifrit and Bahamut summoned
- **expected:** The aeon's portrait crop, as every other combatant has.
- **observed:** The turn order shows 'I' and 'B' letter tiles while an aeon is out. Interface auditor, same observation: Ifrit and Bahamut show as "I" and "B" tiles in Chapter IX.
- **repro:** Chapter IX, 1600x900, Yuna > Summon > Ifrit or Bahamut.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/visual/zanmato.jpg
- **confidence:** high
- **requirement:** CHK-012
- **fix:** Cut turn-order tiles from the approved aeon idles, as done for Yojimbo (D-054).
- **acceptanceCheck:** Every aeon tile shows a painted face in ch3 and ch9.

### 58. PR-0120 (polish, visual): the results painting stops short of the right edge at 2000x1012

- **game:** both
- **chapter:** yojimbo-cavern (IX) and ffx2-leblanc (VI) results
- **expected:** The results painting fills to the window edge.
- **observed:** The cream page shows beyond the painting panel at the right edge on ch9 and ch6 results at 2000x1012.
- **repro:** Win Chapter IX or VI at 2000x1012.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/visual/results.jpg
- **confidence:** high
- **requirement:** CHK-002
- **fix:** Size the painting panel to the window, not the 16:9 stage.
- **acceptanceCheck:** There is no cream strip at the right edge at 2000x1012 in either game.

### 59. PR-0135 (polish, visual): hard side strips beside the 16:9 battle view at 2000x1012 (FFX-2 Ch VI: field and help band stop at x=100 and x=1900)

- **game:** both
- **chapter:** ffx2-leblanc and ffx2-bahamut at 2000x1012 and 1600x900; seymour-flux battle camera
- **expected:** Full-width field; clean matte; the approved backdrop's moon and lit snow read in battle.
- **observed:** The field and help band stop at x=100 and x=1900 in ch6 at 2000x1012. White blotches show in Bahamut's wings. The Gagazet backdrop reads as a flat navy wall under the battle camera.
- **repro:** As in round 11.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-leblanc-win/20-link-3.png; D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-bahamut-win/11-advisor.png; D:/Final Fantasy/critic/rounds/round-12/targets/scenes-ch1-gagazet.jpg
- **confidence:** high
- **requirement:** CHK-002, CHK-013
- **fix:** As filed in round 11.
- **acceptanceCheck:** As filed in round 11.

### 60. PR-0137 (polish, visual): Bahamut's painting still shows white matte holes in the wings (not an approved file)

- **game:** both
- **chapter:** ffx2-leblanc and ffx2-bahamut at 2000x1012 and 1600x900; seymour-flux battle camera
- **expected:** Full-width field; clean matte; the approved backdrop's moon and lit snow read in battle.
- **observed:** The field and help band stop at x=100 and x=1900 in ch6 at 2000x1012. White blotches show in Bahamut's wings. The Gagazet backdrop reads as a flat navy wall under the battle camera.
- **repro:** As in round 11.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-leblanc-win/20-link-3.png; D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-bahamut-win/11-advisor.png; D:/Final Fantasy/critic/rounds/round-12/targets/scenes-ch1-gagazet.jpg
- **confidence:** high
- **requirement:** CHK-002, CHK-013
- **fix:** As filed in round 11.
- **acceptanceCheck:** As filed in round 11.

### 61. PR-0034 (polish, visual): the Chapter I battle grade drops the approved Gagazet backdrop's moon and lit snow

- **game:** both
- **chapter:** ffx2-leblanc and ffx2-bahamut at 2000x1012 and 1600x900; seymour-flux battle camera
- **expected:** Full-width field; clean matte; the approved backdrop's moon and lit snow read in battle.
- **observed:** The field and help band stop at x=100 and x=1900 in ch6 at 2000x1012. White blotches show in Bahamut's wings. The Gagazet backdrop reads as a flat navy wall under the battle camera.
- **repro:** As in round 11.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-leblanc-win/20-link-3.png; D:/Final Fantasy/critic/rounds/round-12/evidence/ffx2-bahamut-win/11-advisor.png; D:/Final Fantasy/critic/rounds/round-12/targets/scenes-ch1-gagazet.jpg
- **confidence:** high
- **requirement:** CHK-002, CHK-013
- **fix:** As filed in round 11.
- **acceptanceCheck:** As filed in round 11.

### 62. PR-0100 (polish, audio): 52 audition-candidate files (34.2 MB) still ship live under audio/candidates and fail the strict audio gate

- **observed:** node tools/audio/qa.mjs --strict exits 1 against the current build solely because of unmanifested candidate files (same 52 as round 11, same set). The live artifact-manifest confirms all 52 are still present (audio/candidates/*.ogg and *.mp3), pushing shipped audio from 40.54 MB (what the game actually uses) to 74.8 MB.
- **repro:** cd D:/pyrefly-rel15 && node tools/audio/qa.mjs --strict; echo $? prints 1. Compare against critic/rounds/round-12/evidence/live/artifact-manifest.json's audio/candidates/* entries.
- **evidence:** D:/pyrefly-rel15 qa.mjs --strict output; D:/Final Fantasy/critic/rounds/round-12/evidence/live/artifact-manifest.json
- **confidence:** high
- **requirement:** CHK-001's own remediation ('wire tools/audio/qa.mjs --strict into the deploy preflight')
- **fix:** Exclude public/audio/candidates from the production build/deploy copy (move it under docs/audio/audition/candidates as CHECKS.md already recommends), and add qa.mjs --strict to tools/deploy-pages.mjs's preflight so a future orphan batch fails the deploy instead of shipping silently.
- **acceptanceCheck:** A fresh build has no audio/candidates directory in dist/, and qa.mjs --strict exits 0 against it.

### 63. PR-0039 (polish, audio): three shipped cues still depart from the THEMES.md bible

- **observed:** themes-audit.mjs still flags exactly the same three cues as round 11: scene-gagazet (no tempo map on a lyrical cue), scene-dreams-end (no tempo map; FAREWELL_RISE absent), scene-farplane (no tempo map; E minor against the map's E major). All 22 other cues, including the new boss-yojimbo (0% off-grid, exact match to its C minor map entry), pass cleanly.
- **repro:** cd D:/pyrefly-rel15 && node tools/audio/themes-audit.mjs — '3 of 25 cue(s) depart from the bible', names above.
- **evidence:** D:/pyrefly-rel15 themes-audit.mjs output
- **confidence:** high
- **requirement:** docs/audio/THEMES.md (Renderer requests #1; cue-map rows for scene-gagazet, scene-dreams-end, scene-farplane)
- **fix:** Add tempo maps to the three lyrical cues per THEMES.md's own renderer rule; add FAREWELL_RISE to scene-dreams-end; correct scene-farplane to E major or update the bible's row if E minor was a deliberate later choice.
- **acceptanceCheck:** themes-audit.mjs reports 0 of 25 cues departing from the bible.

### 64. PR-0032 (polish, onboarding): no text-size, key-remap or flash setting; reduce-motion follows the OS only; CONTROLS is a reference list

- **game:** both
- **chapter:** pause OPTIONS / CONTROLS
- **where:** src/app/screens/pause/panels.ts:145 (controlsColumns is read-only); SaveData reduceMotion has no OPTIONS row
- **expected:** In-game text size, remapping, and flash/motion accommodations.
- **observed:** OPTIONS lists MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, STRATEGY GUIDE and BATTLE HELP, plus X-2 BATTLE and ATB SPEED in FFX-2. Zanmato and summons flash full-frame white with no setting.
- **repro:** Any chapter, Esc, OPTIONS tab.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/opts-zoom.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/seymour-flux-win-r5-1600/run.json; D:/Final Fantasy/critic/rounds/round-12/evidence/yojimbo-cavern-zanmato-aeon-r3/contact-zanmato.jpg
- **confidence:** high
- **requirement:** RUBRIC §6 onboarding (text and input access, motion and flash accommodations)
- **fix:** Add rows for Text size (100/115/130 %), Reduce flashes and Reduce motion (overriding the OS setting), and a remap list in CONTROLS.
- **acceptanceCheck:** Each setting exists, changes the game with real keys, and survives a reload.

### 65. PR-0033 (polish, onboarding): the Defeat screen still says nothing about why the party fell

- **game:** both
- **chapter:** every chapter
- **where:** results Defeat card
- **expected:** One line naming the cause and a pointer (for example 'Zanmato — Yojimbo's gauge reached full; hit him less often').
- **observed:** Defeat shows only TURNS, ATTEMPTS and BEST ('NEVER CLEARED'), in Ch I (1600), Ch IX after Zanmato, and Ch IV on the phone.
- **repro:** Seed 1, lose any chapter, read the Defeat card.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/opts.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/zan.jpg
- **confidence:** high
- **requirement:** RUBRIC §6 onboarding (help that teaches the rules); the 'Defeat screen' target tile is a gap
- **fix:** Add a one-line cause read from the battle log's last KO source.
- **acceptanceCheck:** After a Zanmato wipe in Ch IX, the Defeat card names Zanmato.

### 66. PR-0073 (polish, onboarding): the phone title now says TAP, but the briefing, board, pre-scene and prep hints still name only keys

- **game:** both
- **chapter:** front end and scenes at 390x844
- **where:** briefing, chapter select and cutscene hint bars
- **expected:** Touch equivalents on every phone hint.
- **observed:** 'TAP TO BEGIN / TAP BEGIN · B BRIEFING' on the title (repaired). But: 'ENTER / ESC SKIP — 20 SECONDS, ONCE · D NEVER SHOW THIS AGAIN', 'LEFT/RIGHT CHOOSE · UP/DOWN GAME · ENTER BEGIN · ESC BACK', and 'ENTER ADVANCE · HOLD ENTER SKIP · ESC MENU'.
- **repro:** 390x844, fresh profile, title to the pre-scene.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/phone-b1.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-board.jpg
- **confidence:** high
- **requirement:** RUBRIC §6 onboarding (device usability)
- **fix:** Use the same touch-aware hint component as the title on every phone hint bar.
- **acceptanceCheck:** No phone hint bar names only a key.

### 67. PR-0177 (polish, visual-target): Ch8 FAR range: Evrae shrinks to a thin streak, further than approved option A

- **game:** FFX only
- **chapter:** Ch VIII after Pull back
- **where:** FAR staging
- **expected:** Target A: a ghosted but readable serpent at FAR
- **observed:** Only a small curl of tail in the sky
- **repro:** Chapter VIII, Orders > Pull back, wait for Cid's turn.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/evidence/gaps/ch8-orders-1600x900/30-far-1.png
- **confidence:** medium
- **requirement:** Evrae order/range widget tile (option A)
- **fix:** Raise Evrae's FAR scale and opacity toward the target frame.
- **acceptanceCheck:** Side-by-side with sheet.png A-FAR shows a comparably sized ghosted Evrae.
- **round12:** Gap pass (gaps/ch8-orders-1600x900/30-far-1.png): Evrae reads small and distant at FAR, and the Orders cost preview renders; the distance was not measured against approved option A, so the issue stays open.
- **carried from:** round-11 (76f587c3)

### 68. R15-02 (polish, delivery): the Chapter IX sakura backdrop request is aborted on every entry

- **game:** FFX only
- **chapter:** Chapter IX
- **expected:** No aborted or duplicate art request on entry.
- **observed:** Not re-measured: the round-12 network logs do not record aborted requests; every media request that completed returned 200 and decoded.
- **repro:** As filed in critic/reviews/5be4babe-focused.json.
- **evidence:** critic/reviews/5be4babe-focused.json; critic/rounds/round-12/evidence/network-summary.json
- **confidence:** low on this build (not re-measured)
- **requirement:** CHK-019
- **fix:** As filed.
- **acceptanceCheck:** A network log that records aborted requests shows none for sakura.png on Chapter IX entry.
- **verification:** not re-tested on this build

### 69. PR-0130 (polish, interface): After E, the FFX advisor card folds but its 'N HIDE MOVES' chip stays alone mid-screen, and the chip still says HIDE

- **game:** FFX
- **chapter:** seymour-flux (1), yunalesca (2)
- **where:** FFX HUD advisor placement (not traced)
- **expected:** The chip goes with the card, or reads SHOW.
- **observed:** With the intent open, the card is gone and the chip floats (bottom centre in ch1, mid-top in ch2).
- **repro:** Live, ch1 first menu, press E.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-006
- **fix:** Hide the chip whenever the card declines placement.
- **acceptanceCheck:** After E in ch1 and ch2, no visible .mad chip without its card.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0130: the orphan 'N HIDE MOVES' chip after E (Ch I 1600).
- **carried from:** round-11 (76f587c3)

### 70. PR-0110 (polish, interface): Residual: the 'N HIDE MOVES' chip text shows through the FFX-2 first-turn coach card

- **game:** FFX-2
- **chapter:** ffx2-leblanc (6)
- **where:** FFX-2 coach layer (not traced)
- **expected:** The coach card is opaque over the chip, or the chip waits.
- **observed:** '…IDE MOVES' is visible behind the coach's RIKKU header.
- **repro:** Live, ch6 fresh profile, first menu.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** medium
- **requirement:** CHK-006
- **fix:** Hide the chip while the coach mark shows.
- **acceptanceCheck:** No chip text inside the coach card rect.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0110: the chip text shows through the FFX-2 coach card (Ch IV 1600).
- **carried from:** round-11 (76f587c3)

### 71. PR-0115 (polish, interface): P opens the pause but does not close it, and P over a pre-battle cutscene does nothing (Esc works in both)

- **game:** both
- **chapter:** all runs
- **where:** pause input handling (not traced)
- **expected:** P toggles, like Esc.
- **observed:** pClose false in every route run (both games, all three sizes).
- **repro:** Live, any chapter: P, then P.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-015
- **fix:** Treat P as a toggle in the pause screen's key handler.
- **acceptanceCheck:** Real P twice returns screen=battle in both games.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0115: P never closes the pause (every run), and P over a cutscene does nothing (Ch IX pause-matrix).
- **mergedFrom:** interface; capture owner CHK-015
- **carried from:** round-11 (76f587c3)

### 72. PR-0027 (polish, interface): Literal asterisks in the Yunalesca intent counter: 'the target *she* last picked'

- **game:** FFX
- **chapter:** yunalesca (2)
- **where:** src/battle/ffx/intent.ts:355
- **expected:** Plain or emphasised text without asterisks.
- **observed:** Unrendered markdown in the IF YOU ATTACK list.
- **repro:** Live, ch2 first menu, E.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-007
- **fix:** Remove the asterisks from the string.
- **acceptanceCheck:** No '*' in any visible intent text.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0027: '*she*' (Ch II).
- **carried from:** round-11 (76f587c3)

### 73. PR-0026 (polish, interface): The chapter 1 guide still leads with 'Haste is ctb x 8/16'

- **game:** FFX
- **chapter:** seymour-flux (1)
- **where:** src/data/guides (ch1; not traced)
- **expected:** Player language ('Haste roughly doubles your turns').
- **observed:** The guideText opens its reason with engine notation.
- **repro:** Live, ch1 first menu, G then MORE.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-007
- **fix:** Reword the line.
- **acceptanceCheck:** Guide text has no 'ctb x'.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0026: 'Haste is ctb x 8/16' plus a citation leads the Ch I guide.
- **carried from:** round-11 (76f587c3)

### 74. PR-0074 (polish, interface): The advisor's composed sentences are still broken or repetitive English

- **game:** both
- **chapter:** ffx2-leblanc (6), braskas-final-aeon (3), ffx2-bahamut (4)
- **where:** advisor reason composer (not traced)
- **expected:** One plain sentence per reason.
- **observed:** 'It finishes Fem-Goon, and 565 damage.'; 'It puts Max Hp X2 on the party, and Left-Arm Strike is worth about 2490.'; 'Inflicts Shell / It puts Shell on the party.'
- **repro:** Live first menus of ch6, ch3 and ch4.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-007
- **fix:** Template per effect kind; drop the duplicated effect line.
- **acceptanceCheck:** A copy sweep over 300 advisor cards finds no 'and N damage' or duplicated status sentence.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0074: 'Inflicts Shell / It puts Shell on the party.', 'The best of what is offered.', 'It puts Max Hp X2 on the party' (Ch III).
- **carried from:** round-11 (76f587c3)

### 75. PR-0162 (polish, interface): Chapter VIII strategy guide reads 'Cid pulls the Tidus's ship out of reach' (the actor substituted into a possessive)

- **game:** ffx
- **chapter:** evrae-airship
- **where:** G guide, Next row for Pull back
- **expected:** 'Cid pulls the ship out of reach' (or 'Tidus orders Cid to pull back', as the battle message already says).
- **observed:** The actor name is templated into 'the {actor}'s ship'.
- **repro:** Chapter VIII, first menu, press G.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-007; RUBRIC section 6 interface
- **fix:** Fix the Pull back and Close in guide template string.
- **acceptanceCheck:** The guide text for both orders reads grammatically for every actor. A unit test covers the rendered string.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0162: 'Cid pulls the Tidus's ship'.
- **note:** src/data/guides/evrae.ts changed d9decadb..76f587c3 (12 lines); not traced to the line.
- **mergedFrom:** feel-narrative; capture owner
- **carried from:** round-11 (76f587c3)

### 76. PR-0163 (polish, interface): Evrae's Pull back order is shown as 'Pull back → Tidus', naming the actor as its target

- **game:** FFX
- **chapter:** evrae-airship (8)
- **where:** advisor/guide target naming for the trigger kind (not traced)
- **expected:** 'Pull back' with no target, or '→ the ship'.
- **observed:** The guide and the advisor both print 'Pull back → Tidus', and 'Pull back → Rikku' on Rikku's turn, although the order moves the ship.
- **repro:** Live, ch8 first menu.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** medium
- **requirement:** Readable, legal advice
- **fix:** Suppress targetName for self-only trigger rows.
- **acceptanceCheck:** The ch8 card reads 'Pull back' with no arrow.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0163: 'Pull back → Tidus'.
- **mergedFrom:** interface R11-UI-08; capture owner
- **carried from:** round-11 (76f587c3)

### 77. PR-0165 (polish, interface): The chapter board lists VIII above the COMING VII card, and the COMING card cannot be focused

- **game:** FFX
- **chapter:** board
- **expected:** Numeric order (VII before VIII), or an explicit design decision
- **observed:** Order in the FFX group: I, II, III, VIII, then 'Seymour and Anima — Coming'. Real-key walks never land on the COMING card.
- **repro:** LIVE, board
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **fix:** Sort COMING rows by chapter number.
- **acceptanceCheck:** The board shows VII before VIII.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0165: the COMING card sits after VIII and IX and cannot be focused (lockedCardReachable = seymour-flux).
- **carried from:** round-11 (76f587c3)

### 78. PR-0112 (polish, interface): Phone pause labels are still cut with ellipses ('MASTER VOLUM...', 'BEVELLE UN...'), and the CHAPTER tab objectives wrap in a narrow column

- **game:** both
- **chapter:** ffx2-bahamut (4) phone; ffx2-leblanc (6) 1600x900
- **where:** pause CSS (not traced)
- **expected:** Full labels, and objectives laid out at a readable measure.
- **observed:** On the phone, settings and scene values are ellipsised. At 1600x900 the ch6 objectives wrap one or two words per line ('2. DISPEL / LEBLANC'S NOT- / SO-MIGHTY / GUARD').
- **repro:** Live, 390x844 ch4 pause OPTIONS and CHAPTER; 1600x900 ch6 Esc over the scene.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-009
- **fix:** Widen the objective column; let settings labels wrap on the phone.
- **acceptanceCheck:** No engaged text-overflow in the pause at 390x844 and 1600x900.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0112: phone pause ellipses.
- **carried from:** round-11 (76f587c3)

### 79. PR-0113 (polish, interface): The phone chapter board runs the party names together ('YUNARIKKUPAINE'), and BEST slides under the hint bar

- **game:** both
- **chapter:** board, ffx2-bahamut selected
- **where:** frontend board phone CSS (not traced)
- **expected:** Separated names; BEST visible.
- **observed:** As in round 10.
- **repro:** Live, 390x844, chapter select.
- **evidence:** D:/Final Fantasy/critic/rounds/round-12/interface/c1-intent2.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/b4-coach.jpg; D:/Final Fantasy/critic/rounds/round-12/evidence/pause-matrix/yojimbo-cavern.json; D:/Final Fantasy/critic/rounds/round-12/interface/pausech.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/intents.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/target.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/board.jpg; D:/Final Fantasy/critic/rounds/round-12/interface/phone-yoj.jpg
- **confidence:** high
- **requirement:** CHK-009
- **fix:** Add a gap between names; reserve the hint bar's height.
- **acceptanceCheck:** At 390x844 the name boxes do not touch and BEST sits above the hint bar.
- **round12:** Re-observed on 5be4babe (interface auditor): PR-0113: the names are now separated, but BEST still slides under the hint bar.
- **carried from:** round-11 (76f587c3)

### 80. PR-0145 (polish, combat): all three girls petrified is not an immediate Game Over; the helpless party is beaten down over 23-60 s

- **game:** FFX-2 only
- **chapter:** ffx2-leblanc logos/last room; ffx2-vegnagun-shuyin tail
- **expected:** Immediate Game Over when every party member is Petrified (ffx2-combat-core §2.8, [verified: 2 sources]).
- **observed:** The round-10 probe re-run on 76f587c3 gives defeat after 40, 48, 60 and 23 game seconds, with 11-27 enemy actions against a fully petrified party.
- **repro:** critic/rounds/round-11/combat/r11p/probe-petrify.test.ts (set-up via engine internals)
- **evidence:** critic/rounds/round-11/combat/probe-petrify.json
- **confidence:** high
- **requirement:** research ffx2-combat-core §2.8
- **fix:** End the battle as a defeat when no living party member is free of Petrify.
- **acceptanceCheck:** The probe reports defeat with 0 enemy actions after all three are petrified.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 81. PR-0106 (polish, combat): The same 'After her [N] turn' wording is read two ways in Leblanc's script, and the failsafe reading is not labelled

- **game:** ffx2
- **chapter:** ffx2-leblanc Act III
- **expected:** One reading of the source phrase, or the second reading labelled AUTHORED with its reason (§5.3 does not say which).
- **observed:** ON 5ddfde3: Code unchanged.
- **repro:** src/battle/ffx2/ai/leblanc-syndicate.ts:180 against :166; tests/unit/chapters/leblanc-engine.test.ts:256.
- **evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; source trace
- **confidence:** medium
- **requirement:** AGENTS.md hard rule 6 (label authored readings)
- **fix:** Label the failsafe reading AUTHORED in the comment and the test name, or make it fire on the single turn 25+uses.
- **acceptanceCheck:** The comment and the test name the reading and its source line.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 82. PR-0107 (polish, combat): Acts II and III open with every ATB gauge at zero, although they are separate battles

- **game:** ffx2
- **chapter:** ffx2-leblanc Acts II and III
- **expected:** §2 makes the three Chateau fights separate battles (puzzles and scenes in between). §1.6 [single source]: a normal battle starts every bar at a randomised level.
- **observed:** ON 5ddfde3: Code unchanged.
- **repro:** src/battle/ffx2/setup.ts:171; src/app/screens/BattleScreenSetup.ts:92; capture battle-log.json seq 0.
- **evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/battle-log.json (first atb snapshot, all fill 0)
- **confidence:** high for the behaviour; low impact
- **requirement:** research §1.6
- **fix:** Let a group flag its link as a separate battle, so it gets 'normal' randomised gauges while keeping carried HP and MP. Chapter 6 only; the chapter 5 chain is out of scope.
- **acceptanceCheck:** Across seeds 1-20, the first actor of Acts II and III varies and opening fills are between 0 and 60% of required.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 83. PR-0108 (polish, combat): The Fast-speed Sleep rule from §1.5 is neither built nor recorded as left out

- **game:** ffx2
- **chapter:** All FFX-2 chapters, Config ATB SPEED = FAST
- **expected:** §1.5 [single source: Split Infinity G1004]: at Fast, units put to Sleep never wake on their own. Bailey approved the row as 'fine if it's faithful'.
- **observed:** ON 5ddfde3: Code unchanged.
- **repro:** grep for sleep/fast in src/battle/ffx2 (no handling).
- **evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; source trace
- **confidence:** medium (low reachability in chapters 4-6)
- **requirement:** Bailey's approval condition for the ATB SPEED row; AGENTS.md hard rule 6
- **fix:** Implement the rule (Sleep has no timed expiry at Fast), or record the omission as a decision.
- **acceptanceCheck:** A unit test at Fast shows Sleep persisting past its Normal-speed duration, or a decisions.json entry records the omission.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 84. PR-0069 (polish, combat): The possessed-aeon mirror does not mirror affinities, although the source comment says it does

- **game:** FFX
- **chapter:** 3 (Braska's Final Aeon, the possessed-aeon links)
- **expected:** The shipped code and the comment above it describe the same behaviour.
- **observed:** ON 5ddfde3: Code unchanged.
- **repro:** Read src/battle/ffx/setup.ts:235-253 and src/battle/common/types.ts:2353-2372 at 8f48237.
- **evidence:** git diff e119552 5ddfde3 -- src/battle/ffx; src/battle/ffx/setup.ts:235 (the comment) and :247 (c.affinities = { ...c.affinities }); src/battle/common/types.ts:2353-2372 (AeonBuild has no affinities field)
- **confidence:** high for the trace; the player impact is none observed
- **requirement:** AGENTS.md hard rule 6 (never invent game data) and RUBRIC §5 (a claim is matched to its proof).
- **fix:** Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.
- **acceptanceCheck:** The comment and the code agree, and a unit test asserts whichever behaviour is chosen for one possessed aeon.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 85. PR-0054 (polish, combat): The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference

- **game:** FFX-2
- **chapter:** ffx2-vegnagun-shuyin, link 2
- **expected:** Each of the three Action1 branches behaves as its source line states, and anything extrapolated is marked as an inference.
- **observed:** ON 5ddfde3: Code unchanged.
- **repro:** Read research/ffx2-vegnagun-shuyin.md lines 708-711 against src/battle/ffx2/ai/vegnagun.ts legAction1 (lines 72-87).
- **evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; research/ffx2-vegnagun-shuyin.md:708-711; src/battle/ffx2/ai/vegnagun.ts:72-87
- **confidence:** High on the divergence (both texts read directly). Low player impact: reaching the state needs all three girls already Petrified.
- **requirement:** AGENTS.md hard rule 6: numbers and behaviour come from research/*.md with their source notes; unsourced behaviour is left alone and said so.
- **fix:** Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.
- **acceptanceCheck:** The comment at src/battle/ffx2/ai/vegnagun.ts distinguishes the two sourced fallbacks from the inferred one, or a source line is cited for the Break case.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 86. PR-0053 (polish, combat): A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation

- **game:** FFX-2
- **chapter:** ffx2-vegnagun-shuyin
- **expected:** Every issue the round raised reaches the report with its full record.
- **observed:** ON 5ddfde3: Code unchanged.
- **repro:** n/a — the record is missing, not the behaviour.
- **evidence:** git diff e119552 5ddfde3 -- src/battle/ffx; critic/rounds/round-06/bench/out/z06-all.txt; the combat-encounter auditor's category evidence in this report
- **confidence:** UNVERIFIED as a product defect. The ID is reserved and open so it is not silently lost; recover the record from the combat auditor's evidence before any repair, and close it as withdrawn if it cannot be restated.
- **requirement:** RUBRIC §8: every finding carries expected versus observed, repro, evidence and a fix. This one does not, and is recorded as a tracked gap rather than written up from guesswork.
- **fix:** Recover or re-derive the record before the next batch; do not repair anything on this entry alone.
- **acceptanceCheck:** The issue is either restated with expected, observed, repro and evidence, or closed as withdrawn.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 87. PR-0124 (polish, combat): the MP overflow is fixed on live; the dressphere a girl wears still reverts at a chain seam, and whether it should is unsourced

- **game:** FFX-2 only
- **chapter:** ffx2-leblanc links 2-3; ffx2-vegnagun-shuyin links 2-5
- **expected:** A decision: Bailey, or a one-battle check on a real copy (§8.2).
- **observed:** Rikku ends link 1 of ch6 as White Mage and starts Act II as Thief at 106/106 MP (clamped). In ch5 she ends link 1 as Black Mage at 1,250/1,250 HP and starts link 2 as Dark Knight at 1,250/5,652 HP, because HP carries by value into a dressphere with a larger bar. research/ffx2-combat-core §8.2 records the carry as a [gap] after searching more than 16 sources.
- **repro:** Chapter VI, Wait, seed 1: CHANGE Rikku Thief to White Mage in Act I, win Act I, read her row at the Act II first menu.
- **evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/turn-log.json turns 20-22; ffx2-vegnagun-shuyin-win/turn-log.json turns 53-55
- **confidence:** high on the observation; the requirement is unsourced
- **requirement:** AGENTS.md hard rule 6 (unsourced goes to Bailey)
- **fix:** Ask Bailey or check on a real copy. If the dressphere should carry, carry currentDressphere in BattleScreenSetup.carryFfx2.
- **acceptanceCheck:** A recorded decision; then a seam test for the chosen behaviour.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 88. PR-0007 (polish, encounter): Zombie then Full-Life leaves no counter-play window because of sourced CTB math, not a mechanics defect

- **game:** FFX only
- **chapter:** seymour-flux
- **expected:** The guide or intent tells the player that the answer is getting ahead on CTB (Haste, pre-emptive Holy Water), not reacting afterwards.
- **observed:** The FFX CTB and AI code is unchanged since round 10. research/ffx-seymour-flux line 279 gives both actors Agility 38, and line 655 says 'Requires beating it on CTB — high Agility or Haste'. docs/plans/pr-0007-method-check.md re-scopes the fix to information.
- **repro:** Chapter I, any seed; Lance of Atrophy lands Zombie and the mount's Full-Life follows with no party turn between.
- **evidence:** reused: critic/rounds/round-10.json PR-0007; docs/plans/pr-0007-method-check.md; research/ffx-seymour-flux.md lines 279, 655
- **confidence:** high on the sourcing
- **requirement:** RUBRIC §5 (never penalise canon); §6 interface (honest information)
- **fix:** Close as a combat/encounter defect. Carry the wording change to the interface/onboarding batch, with options shown to Bailey (hard rule 9).
- **acceptanceCheck:** Bailey picks a wording, and the guide shows it in Chapter 1.
- **round12:** Carried unchanged (combat auditor): git diff 76f587c3..5be4babe leaves chain.ts, gauges.ts, statuses.ts, overdrive.ts, aeons.ts, hp.ts, accuracy.ts, damage.ts, formulas.ts, dresspheres.ts, garment-grids.ts and the Leblanc and Vegnagun AI untouched; reused with that dependency argument.
- **carried from:** round-11 (76f587c3)

### 89. PR-0159 (polish, narrative): Chapter VIII dialogue has no contractions in any of its 47 lines, so Tidus, Rikku, Wakka and Cid all sound stilted and alike

- **game:** ffx
- **chapter:** evrae-airship
- **where:** pre-scene, mid-battle callouts, aftermath
- **expected:** writing-bible section 1.1: Tidus is 'contemporary, casual' (gonna, c'mon). Section 1.8: Rikku is fast and youth-casual. Section 1.5: Wakka ('ya', 'brudda'). The FFX register of chapters 1 to 3.
- **observed:** 'That is it? We just won?' (Tidus), 'You are welcome.' and 'We are not going in?' (Rikku), 'It is faster. Why is it faster?' (Tidus), 'That is the city shooting at us!' (Cid). There are 0 contractions in 47 says. The other FFX scripts use them in 19 of 57, 14 of 59 and 32 of 76 lines.
- **repro:** Read src/story/scripts/evrae-airship.ts, or play Chapter VIII's pre-scene.
- **evidence:** critic/rounds/round-11/evidence/evrae-airship-scenewalk/run.json; src/story/scripts/evrae-airship.ts (say lines)
- **confidence:** high
- **requirement:** RUBRIC section 6 narrative (character voice); writing-bible section 1
- **fix:** A voice pass on the Chapter VIII lines only: restore natural contractions and each speaker's tics. Keep the beats and the line count.
- **acceptanceCheck:** A re-read against writing-bible section 1 finds Tidus, Rikku and Wakka distinguishable by voice with names hidden. Story tests still pass.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 90. PR-0160 (polish, narrative): Brother's Al Bhed line prints as plain English, then Rikku 'translates' what the player just read

- **game:** ffx
- **chapter:** evrae-airship
- **where:** pre-scene beat 2
- **expected:** writing-bible section 1.8: FFX Al Bhed is shown as untranslated cipher text. Write the line in English, tag it [ALBHED] and encipher it, so Rikku's translation carries the meaning.
- **observed:** Brother: 'YUNA! Bevelle! They are marrying her to that man!', then Rikku: 'He says Bevelle. He says within the hour.' The script comment flags this as 'uncertain line 1'.
- **repro:** Chapter VIII pre-scene, lines 5 and 6.
- **evidence:** critic/rounds/round-11/evidence/evrae-airship-scenewalk/sp-06-Brother.png; src/story/scripts/evrae-airship.ts (beat 2)
- **confidence:** high
- **requirement:** RUBRIC section 6 narrative (faithful beats); writing-bible section 1.8 implementation note
- **fix:** Encipher Brother's FFX lines (a DialogueBox or say option) and let Rikku's line carry the content, or have Brother speak in a mix of Al Bhed and English.
- **acceptanceCheck:** The Chapter VIII pre-scene shows Brother's beat-2 line as Al Bhed cipher, and Rikku's next line conveys Bevelle and 'within the hour'. FFX-2 brother-x2 lines are unchanged.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 91. PR-0161 (polish, narrative): Chapter 5's Farplane voices (Braska, Auron) are staged as present speakers with full portraits and role plates

- **game:** ffx2
- **chapter:** ffx2-vegnagun-shuyin
- **where:** pre-scene Act 1, lines 9 and 10
- **expected:** writing-bible E7 line 8: 'no visual source — audio only. Two voices out of the Farplane.' The player should read these as voices.
- **observed:** 'That's my daughter.' shows Braska's full portrait and a HIGH SUMMONER plate, the same card a speaker standing in the room gets. Nothing marks it as a voice from the Farplane.
- **repro:** Chapter V pre-scene, advance to line 10.
- **evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-scenewalk/sp-10-Braska.png, sp-11-Auron.png
- **confidence:** medium (a staging choice; the approved portrait itself is not in question)
- **requirement:** RUBRIC section 6 narrative (faithful beats); writing-bible E7 Act 1
- **fix:** This is a perceivable change, so it needs options for Bailey first. For example: an off-screen voice treatment (italic text, a 'from the Farplane' plate, a faded or pyrefly-veiled portrait).
- **acceptanceCheck:** Bailey picks a treatment. Lines 9 and 10 then read as voices, and every other speaker's card is unchanged.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 92. PR-0058 (polish, narrative): Some speakers still talk on a portrait-less card (PR-0058 family): Brother in Evrae, Gippal and Shinra in chapter 5

- **game:** both
- **chapter:** 8 (Brother), 5 (Gippal pre-scene, Shinra at the seam into link 5)
- **expected:** Every speaking character has an approved portrait, or the card is designed for a voice-only line
- **observed:** The dbox__portrait element is empty for these speakers. Nooj (ch5) and Brother (ch6, FFX-2 art) now have portraits, so those parts are repaired.
- **repro:** LIVE, walk the pre-scenes line by line
- **evidence:** critic/rounds/round-11/evidence/evrae-airship-scenewalk/run.json; ffx2-vegnagun-shuyin-scenewalk/run.json; ffx2-vegnagun-shuyin-win/20-link-5.png
- **confidence:** high
- **fix:** Add portraits through the options process, or give the portrait-less card a deliberate layout.
- **acceptanceCheck:** The scenewalk reports a portrait for every speaker.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged. Gap pass: FFX Brother in Chapter VIII still speaks with no portrait (evrae-airship-scenewalk/sp-06-Brother.png).
- **carried from:** round-11 (76f587c3)

### 93. PR-0102 (polish, narrative): '*better*' asterisks are still in Leblanc's aftermath line

- **game:** ffx2
- **chapter:** ffx2-leblanc
- **where:** post-battle scene, beat 13
- **expected:** No literal markup on screen.
- **observed:** src/story/scripts/ffx2-leblanc.ts:260 still reads "I had the *better* half, dearie." (traced; not captured on screen this round).
- **repro:** Win Chapter VI, advance the aftermath to beat 13.
- **evidence:** src/story/scripts/ffx2-leblanc.ts:260
- **confidence:** high
- **requirement:** CHK-007; RUBRIC section 6 narrative
- **fix:** Drop the asterisks.
- **acceptanceCheck:** The line renders without asterisks in an aftermath scenewalk.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 94. PR-0134 (polish, narrative): the Chapter VI card's BOSS row reads 'Ormi + Dr. Goon + Fem-Goon'

- **game:** ffx2
- **chapter:** ffx2-leblanc
- **where:** chapter select card
- **expected:** The card names the Syndicate or the three acts.
- **observed:** dossier: 'BOSS Ormi + Dr. Goon + Fem-Goon' on a card titled 'Leblanc'.
- **repro:** Chapter select, arrow to VI.
- **evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/run.json dossier; 03-card.png
- **confidence:** high
- **requirement:** RUBRIC section 6 narrative (context)
- **fix:** List Leblanc, Logos and Ormi (or the three acts).
- **acceptanceCheck:** The VI card's BOSS row names Leblanc.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 95. PR-0147 (polish, narrative): all three Leblanc acts play in the one heart room, after the seam line '...Okay. Next room.'

- **game:** ffx2
- **chapter:** ffx2-leblanc
- **where:** chain seams 1->2 and 2->3
- **expected:** Each act reads as a new room, or the line does not promise one.
- **observed:** seq-seam-2 settles in the same heart-sign room as Act I.
- **repro:** Chapter VI, clear Act I.
- **evidence:** critic/rounds/round-11/feel-narr/ffx2-leblanc-win__seq-seam-2.jpg
- **confidence:** high
- **requirement:** RUBRIC section 6 narrative
- **fix:** Reword the seam line (the cheap fix), or offer Bailey per-act backdrop options.
- **acceptanceCheck:** The line and the stage agree in a seam capture.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 96. PR-0103 (polish, narrative): Two Act III KO beats assume Logos falls before Ormi: kill Ormi first and a KO'd Ormi shouts, and Paine calls for the already-dead Ormi

- **game:** FFX-2 only
- **chapter:** ffx2-leblanc, Act III
- **expected:** Beats that name the living or the dead stay true in either kill order (research section 5.4 treats both orders as live options).
- **observed:** ON 5ddfde3: Exercised on 5ddfde3 with Ormi forced first (injected retarget): Ormi's KO bark "Boss... I held the door." and Leblanc's "You did, lamb. Badly. But you did." play, the run reaches results with no stall. Whether the remaining beats read correctly in that order was not settled; left open.
- **repro:** Chapter 6, Act III: focus Ormi until KO, then KO Logos, and read the beat.
- **evidence:** critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/run.json; src/story/scripts/ffx2-leblanc.ts (mid 'logos-down' / 'ormi-down', midScripts) @ e119552; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/battle-log.json
- **confidence:** medium-high (the logic is certain from the source; the branch is not captured)
- **requirement:** RUBRIC section 6 narrative (faithful beats, character voice); round 07 PR-0037 is the same class (speakers who are not on the field).
- **fix:** Give 'logos-down' an Ormi-already-down variant (Leblanc alone), or split the trigger with a condition on Ormi's state.
- **acceptanceCheck:** Kill Ormi first and then Logos: no KO'd speaker talks, and no line names a dead target as next.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 97. PR-0037 (polish, narrative): Mid-battle beats hard-code speakers who are not in the active formation

- **game:** FFX observed; the same shape exists in the other chapters' midScripts
- **chapter:** 1, beat 'first-zombie'
- **expected:** The characters on the field speak.
- **observed:** The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.
- **repro:** Chapter 1: play until a party member is Zombied and read the speaker card.
- **evidence:** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png; src/story/scripts/seymour-flux.ts:278-281; src/data/ffx/builds/gagazet.ts:424-425
- **confidence:** high
- **requirement:** RUBRIC section 6 narrative (character voice, reachable scenes).
- **fix:** Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.
- **acceptanceCheck:** Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.
- **round12:** Carried (feel-narrative auditor): git diff 76f587c3..5be4babe -- src/story leaves this text unchanged.
- **carried from:** round-11 (76f587c3)

### 98. PR-0158 (polish, delivery): Downgraded from critical: a racing debug harness (not a player) can tear an FFX battle down with 'Cannot read properties of null (reading syncHud)'; a real Escape at 0.5-4 s after battle mount is handled correctly

- **game:** both-unknown (reproduced in FFX ch1 only)
- **chapter:** seymour-flux (reported); others unknown
- **where:** src/engine/BattlePresenter.ts syncHud call path (suspected; not traced here). Scored under delivery; listed here because it is an input path.
- **expected:** Escape at any moment of a battle either opens the pause or is ignored; it never ends the encounter.
- **observed:** The confirmer built 76f587c3 from git archive (bundle 81kxOXnv), fresh profile, seed 1, real keys only, and pressed Escape 0.5, 1, 2, 3 and 4 s after battle mount in chapters 1 and 6: 10 of 10 with 0 console or page errors (the early presses dismissed the battle-start banner, the later ones opened and closed the pause). The original control script reproduced the TypeError only because it presses KeyZ on the title and then calls __pyrefly.gotoChapter, so two flows race (NOW.md reached the same conclusion, "HARNESS ARTIFACT"). The remaining teardown weakness is hardened in hotfix 12.3 (e11fcdf, b0dd23c), after this build.
- **repro:** Fresh profile, seed 1, live site: title > board > Seymour Flux > prep > Enter > hold Enter through the scene > press Escape about 0.5 to 3 s after the battle screen appears, before the first command menu. Watch the console and the screen.
- **evidence:** critic/rounds/round-11/confirm/esc76-ch1.json, esc76-ch6.json and the per-delay JPEGs; critic/rounds/round-11/confirm/control76.mjs; critic/reviews/bcbdb483-live.md lines 88-104
- **confidence:** high (refuted as a player path by the confirmer on the exact bundle)
- **requirement:** RUBRIC §3 critical class (an encounter that cannot finish / lost progress); CHK-015 every state where the player can press the key
- **fix:** Guard the pause-open path while the presenter is not yet bound: the hotfix 12.3 worktree already targets this, per NOW.md.
- **acceptanceCheck:** Real Escape at 0.5, 1, 2, 3 and 4 s after battle mount in ch1 and ch6, on the live build: no console error, pause opens or the key is ignored, and the battle continues.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **mergedFrom:** interface R11-UI-00 (critical); confirmer: NOT REPRODUCED through the real flow; refuted as critical
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 99. PR-0164 (polish, visual): Yunalesca's approved painting edges show as hard straight lines in battle: the attack pose's hair is cut by its canvas edge, and a pale hard-edged rectangle shows over her quad at the hit moment

- **game:** FFX only (defect case); a render-side fix would be shared plumbing (both)
- **chapter:** yunalesca (II)
- **where:** battle, Yunalesca's attack pose, 2000x1012
- **expected:** CHK-013: approved art renders without visible artefacts.
- **observed:** Vertical cut at the left and horizontal cut at the top of her hair (crop visual/ch2-yunalesca-hurt-crop.png). public/art/characters/yunalesca-1/attack.png has opaque hair pixels touching x=0 and the top edge. The file matches its approved hash, so this is not a regression.
- **repro:** Chapter II at 2000x1012 (seed 1): wait for Yunalesca's attack.
- **evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/yunalesca-win-2000/23-midfight.png; D:/Final Fantasy/critic/rounds/round-11/visual/yunalesca-1-attack-on-magenta.png
- **confidence:** high
- **requirement:** CHK-013; approved art protection (do not regenerate)
- **fix:** Do not replace the painting. Either feather alpha within a few pixels of each character quad's border in the sprite shader, or put an outpainted edge extension to Bailey as an explicit revision.
- **acceptanceCheck:** Ch2 attack frame at 2000x1012: no straight hard edge through the hair; the approved file stays byte-identical, or Bailey records a revision.
- **round12:** Not re-captured this round (visual auditor).
- **mergedFrom:** visual R11-VIS-03; capture owner (pale rectangle at the hit moment)
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 100. PR-0117 (polish, interface): Phone pause: the chapter eyebrow is printed over the GARMENT GRID row, and the grid name is cut ('PROTECTION ...')

- **game:** FFX-2
- **chapter:** ffx2-bahamut (4) (previously ch6)
- **where:** pause phone layout (not traced)
- **expected:** The eyebrow sits below the stats with no overlap.
- **observed:** At 390x844 the 'CHAPTER IV · BEVELLE UNDERGROUND — SOMETHING SHE NAMED' eyebrow overlaps the DRESSPHERE/GARMENT GRID rows.
- **repro:** Live, 390x844, ch4 first menu, Esc.
- **evidence:** critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/14-pause-Esc.png
- **confidence:** high
- **requirement:** CHK-008/CHK-009 on the pause
- **fix:** Reserve the eyebrow's height in the phone stats column, or let the stats scroll.
- **acceptanceCheck:** At 390x844 in ch4 and ch6, no rect overlap between the eyebrow and any stat row, and no ellipsis on the grid name.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 101. PR-0169 (polish, interface): The advisor badges a move 'GUIDE'S PICK' while the guide card beside it names a different move

- **game:** FFX-2
- **chapter:** ffx2-vegnagun-shuyin (5), link 1 first menu
- **where:** src/ui/common/MoveAdvisor.ts:591
- **expected:** One 'guide' voice, or a badge whose wording does not claim the guide's endorsement when the guide disagrees.
- **observed:** The guide card says 'NEXT YUNA Pray → the party'; the advisor card says 'Light Curtain → the party GUIDE'S PICK'. The badge comes from the chapter tactic (source 'tactic'), not from the guide the player is reading.
- **repro:** Live, ch5, seed 1, first menu at 1600x900.
- **evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/11-advisor.png; run.json guideText/advisorText
- **confidence:** high (observed); impact medium
- **requirement:** Legal and useful advice (RUBRIC §2: guide and advisor are separate capabilities)
- **fix:** Show the badge only when the suggestion equals the guide's NEXT row, or rename it (for example 'Chapter plan').
- **acceptanceCheck:** Over a ch5 route, no frame shows the badge on a move that differs from the guide card's NEXT.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 102. PR-0114 (polish, interface): The Seymour and Anima silhouette still draws through the 'Coming' badge

- **game:** FFX
- **chapter:** board
- **where:** board tile z-order (not traced)
- **expected:** The badge sits above the silhouette.
- **observed:** The silhouette line crosses 'Coming'.
- **repro:** Live, chapter select at 1600x900.
- **evidence:** critic/rounds/round-11/evidence/seymour-flux-win/03-card.png
- **confidence:** high
- **requirement:** Legibility
- **fix:** Raise the badge's z-index.
- **acceptanceCheck:** The badge text is unobstructed.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 103. PR-0172 (polish, layout): Defeat results: the vertical chapter title runs into the CHAPTER SELECT button

- **game:** both (seen Ch8 FFX)
- **chapter:** Ch VIII defeat results
- **where:** results vertical eyebrow
- **expected:** Vertical title ends above the buttons
- **observed:** '... · FELL' overlaps the CHAPTER SELECT button's right edge
- **repro:** Lose Chapter VIII at 1600x900.
- **evidence:** critic/rounds/round-11/evidence/gaps/evrae-airship-lose-r1/results.png
- **confidence:** high
- **requirement:** Results layout
- **fix:** Cap the vertical title height above the button row, or shorten it.
- **acceptanceCheck:** No overlap for the longest chapter title at 1600x900.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 104. PR-0138 (polish, prep): a chained chapter's results show only the last battle's spoils

- **game:** FFX-2
- **chapter:** V ffx2-vegnagun-shuyin
- **expected:** Owner decision needed: either a chain total, or a labelled last-battle ledger. The numbers themselves are sourced.
- **observed:** After the 33:41, five-link live win the results read 'EXP 0 ×3 PARTY · AP 20 PER DRESSPHERE · GIL 0' with no items. That is exactly the research row for the final battle (research/ffx2-vegnagun-shuyin.md:435), while earlier links are worth 5,000-8,000 EXP and 3,000 gil each (lines 203-309). Chapter 6's 900/6/780 is likewise the final battle only (§6.3).
- **repro:** Win chapter V with real keys and read results.
- **evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/run.json resultsText
- **confidence:** high
- **requirement:** prep: understandable results
- **fix:** Ask Bailey which reading is wanted. If the chain total, sum the per-link spoils in the chain flow before ResultsScreen. If last battle only, label the ledger 'final battle'.
- **acceptanceCheck:** The chapter V results either total the sourced link spoils or say which battle they cover.
- **round12:** Not re-tested: no Chapter V victory results were reached on this build.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 105. PR-0173 (polish, delivery): R11-PD-02: 239 unreferenced art variant files (126 MB) ship in every build

- **game:** both
- **chapter:** n/a (artifact)
- **expected:** Only the files the game can request ship to Pages.
- **observed:** critic/artifacts/76f587c3.json lists 36 *.raw.png (40.5 MB) and 203 numbered variants *.N.png/json (85.1 MB), for example art/portraits/f4blulu.1.raw.png and f4lulu.3.png. None is named in src (CHK-018 grep), none is in the art manifest (0 numbered or raw entries), and none was requested in any of the 17 runs (logs/network-media-all.json: 203 art files requested, 0 variants). With the 52 audio candidates of PR-0100 (34.2 MB, up from 47 / 27.5 MB in round 10), about 160 MB of the 467 MB artifact is never used.
- **repro:** node -e over critic/artifacts/76f587c3.json filtering /\.raw\.png$/ and /\.[0-9]+\.(png|json)$/.
- **evidence:** critic/artifacts/76f587c3.json; critic/rounds/round-11/evidence/logs/network-media-all.json
- **confidence:** high
- **requirement:** delivery: valid, lean media and deploy hygiene (the GitHub Pages site-size limit is 1 GB)
- **fix:** Exclude *.raw.png and numbered variant files (plus audio/candidates, PR-0100) from the dist copy in the build or deploy step. They stay on disk and in D:\Tools\pyrefly-art-backup.
- **acceptanceCheck:** The next artifact manifest has 0 files matching \.raw\.png or \.[0-9]+\.(png|json) under art/, and 0 under audio/candidates; a full route still shows 0 404s.
- **round12:** Not re-measured: the asset loader (PaintedArt.ts) changed, so round 11's 126 MB figure cannot be reused; the prep-delivery auditor declined to publish an unsound recount. Re-measurement owed.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 106. PR-0174 (polish, prep): R11-PD-03: Rikku's Evrae preset is S.Lv 53, out of line with the chapters on either side (40 at Macalania, 42 at Gagazet)

- **game:** FFX
- **chapter:** VIII evrae-airship, party prep and results
- **where:** src/data/ffx/builds/fahrenheit.ts:212 (traced)
- **expected:** One offset convention across the FFX presets, so Rikku's sphere level does not drop by 11 between Evrae and Mt. Gagazet. The research values are all [estimate].
- **observed:** The prep shows Rikku S.LV 53 (Tidus 24, Wakka 24, Lulu 24, Auron 26, Kimahri 22). The results show 'Rikku +1 S.Lv S.LV 54 · 2,153/3,424 AP' against +9 for the others. src/data/ffx/builds/fahrenheit.ts:212 folds research §9.3's ~28 plus the +25 offset into 53. macalania.ts:209 (earlier in the story) says 40 and gagazet.ts:358 (later) says 42, each claiming the same +25 offset.
- **repro:** Board > VIII > prep; compare with I > prep.
- **evidence:** critic/rounds/round-11/evidence/evrae-airship-win/run.json prepText and resultsText; evrae-airship-win/31-results.png; research/ffx-evrae-airship.md §9.3; research/ffx-seymour-flux.md:725
- **confidence:** medium (internal inconsistency is certain; which value is right is unsourced)
- **requirement:** AGENTS.md rule 6 (no invented numbers) and prep: meaningful sourced preparation. FFX only: S.Lv does not exist in FFX-2.
- **fix:** Do not guess. Have the data owner state the offset convention in the research docs, then align fahrenheit.ts:212 or the other two presets with it.
- **acceptanceCheck:** Rikku's preset S.Lv rises monotonically along the story order Macalania < Evrae < Gagazet <= Zanarkand, with a source note on each.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 107. PR-0175 (polish, targeting): Ch5 link 5: a stray reticle labelled with raw ids 'vegnagun-leg' / 'vegnagun-head' at the top-left corner

- **game:** FFX-2 only
- **chapter:** Ch V ffx2-vegnagun-shuyin, link 5 opening dialogue
- **where:** target reticle/plate for departed parts (not traced)
- **expected:** No reticle for parts that are gone; plates never show internal ids
- **observed:** Throughout the link-5 dialogue a ring sits at (0,0), plated 'vegnagun-leg' then 'vegnagun-head', over the boss bar
- **repro:** Live dc2669ac, seed 1, 1600x900. Links 2-4 fast-forwarded by autoBattle to under 12% HP, then real keys; walk the link-5 dialogue with Enter.
- **evidence:** critic/rounds/round-11/evidence/gaps/ffx2-vegnagun-shuyin-seams-r1/speaker-Shuyin.png, scene-28-in-battle-link5/
- **confidence:** medium (seen once; the dedicated probe could not reach link 5 because autoBattle stalled on the Tail)
- **requirement:** Targeting s3 / HUD hygiene
- **fix:** Drop reticles and plates for combatants not in the current link, and fall back to the display name, never the id.
- **acceptanceCheck:** A real-key pass through the link 4-to-5 seam shows no reticle in the corner, and no plate text matches /^[a-z]+-[a-z-]+$/.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 108. PR-0178 (polish, visual-target): Targeting s1: ally brackets cross the command menu; no TARGET plate

- **game:** FFX only
- **chapter:** Ch III (any FFX all-ally spell)
- **where:** ally bracket placement
- **expected:** Target s1: brackets around the three allies clear of the menu, plus a 'TARGET Tidus, Yuna & Auron' plate
- **observed:** The lower bracket corners draw across the HASTEGA/SLOW rows; only an 'ALL ALLIES' chip
- **repro:** Chapter III, Tidus > White Magic > Hastega > Enter.
- **evidence:** critic/rounds/round-11/evidence/gaps/ch3-hastega/hastega-party-targeted.png
- **confidence:** high
- **requirement:** Targeting s1 tile
- **fix:** Clip brackets behind the command stack (z-order) and add the target plate.
- **acceptanceCheck:** No bracket line intersects a command row; the plate lists the three names.
- **round12:** Re-observed on 5be4babe (visual auditor, fight-targeting-s2 composite and target-braskas-final-aeon-1600x900/contact.jpg): the all-allies bracket corners still cross the command rows and there is no TARGET plate.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 109. PR-0071 (polish, tooling): autoBattle('intended') loses Ch1 seed 1 and stalls on the Ch5 Tail link on the newest builds

- **game:** both
- **chapter:** Ch I, Ch V
- **where:** debug strategy (engine or tactic, not traced)
- **expected:** The chapter's own line wins, as the tactic docs measure
- **observed:** Ch1: Defeat in 47 turns (CXcGU7y1). Ch5: no progress past the Tail in 15-25 min ('intended' fast and 'attack' skip; CzzK-khs, Ji5E4fD0). Ch6: 'attack' lost Act II (Ji5E4fD0).
- **repro:** window.__pyrefly.gotoChapter('seymour-flux',{seed:1, auto:'intended', speed:'fast'})
- **evidence:** critic/rounds/round-11/evidence/gaps/seymour-flux-seams-r1/run.json; gaps/ch5-link5-target/run.json; gaps/ch5-nemo-miss/run.json
- **confidence:** medium (might be a real balance shift after 6debabd9 or only the tactic)
- **requirement:** Evidence tooling; CHK-016 routes
- **fix:** Re-measure the intended lines on the current tree (40 seeds) and repair the tactic, or record why they changed.
- **acceptanceCheck:** gotoChapter auto 'intended' wins Ch1 and passes the Ch5 Tail on seed 1.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 110. PR-0166 (polish, process): Review evidence identity: the capture harness hard-codes 'bundle 81kxOXnv (main 76f587c3)', and the live site was replaced mid-capture (bcbdb483 at 17:52Z, then dc2669ac, e3b8c2a3, a999d133), so later runs carry a label they cannot prove; four captures also do not show their labelled state

- **game:** both
- **chapter:** review tooling
- **expected:** Every capture records the bundle it actually loaded (document script src) and the state it asserts; a deep review of a live build pins that build (a local git-archive build of the sha, or a pause on deploys during capture).
- **observed:** Runs started after 17:52Z (braskas-final-aeon-win 18:09Z, the four scene walks 18:35Z, pause-matrix 18:39Z, braskas-final-aeon-win-r2 18:39Z, the ch5 final reload) most likely captured bcbdb483. None of the gap-pass evidence is on 76f587c3. Mislabelled states: ffx2-vegnagun-shuyin-win/16-target-single.png (White Magic list, not a targeted part), yunalesca-win-2000/16b-after-cancel.png (the pause), evrae-airship-win/30-post-scene.png (blank card mid-transition), seymour-flux-win/10-first-menu-coach.png (under the turn cut-in).
- **repro:** Compare docs/deploys.log with the run start times in critic/rounds/round-11/evidence/index.jsonl; read route.mjs for the hard-coded label.
- **evidence:** docs/deploys.log; critic/rounds/round-11/cap/lib.mjs, route.mjs; critic/rounds/round-11/evidence/index.json
- **confidence:** high
- **requirement:** RUBRIC section 5 (record the artifact); CHK-016
- **fix:** Record the loaded bundle from the page in every run.json and refuse to label otherwise; for a deep review of a sha that may be replaced, capture against a local build of that sha.
- **acceptanceCheck:** Every run.json of the next deep review carries the bundle name read from the page, and it matches the reviewed sha's artifact record.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **mergedFrom:** visual R11-EVD-01; prep-delivery R11-PD-04; audio R11-AUD-EV1; gap pass (build attribution)
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 111. PR-0151 (polish, interface): Pause OPTIONS labels are cut with ellipses at 1280x960 (MASTER VOL…, SOUND EFFE…, STRATEGY GU…)

- **game:** both (seen in chapter 6)
- **chapter:** ffx2-leblanc
- **expected:** Full labels at 4:3 (CHK-003/CHK-009).
- **observed:** At 1280x960 the settings names end in ellipses; at 2560x1080 the same screen lays out cleanly.
- **repro:** Chapter 6 at 1280x960, Esc, OPTIONS.
- **evidence:** critic/rounds/round-10/evidence/gaps/ch6-tour-1280x960/pause-options.png
- **confidence:** high
- **requirement:** CHK-003, CHK-009
- **fix:** Widen the settings column or wrap the labels at 4:3.
- **acceptanceCheck:** No ellipsis at 1280x960 and 1024x768.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 112. PR-0131 (polish, interface): The chapter 1 advisor chains Phoenix Downs into immediate re-KOs: Yuna revived 7 times, KO'd again before acting after 6 of them

- **game:** FFX only
- **chapter:** seymour-flux attempt 1
- **expected:** Revive advice accounts for a telegraphed re-kill or recommends the recovery that survives it.
- **observed:** battle-log seq 258-376: 7 Phoenix Downs on Yuna (750 HP); 6 re-KOs before she acted.
- **repro:** Chapter 1, seed 1, advisor-followed real keys.
- **evidence:** critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/turn-log.json; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/battle-log.json
- **confidence:** medium (one route)
- **requirement:** CHK-005 (advice stays useful on damaged boards)
- **fix:** Build the degenerate-board matrix CHK-005 asks for first; then weigh revive advice against the next enemy action the intent model already predicts.
- **acceptanceCheck:** advisor-degenerate-boards test covers the telegraphed re-kill case in chapter 1.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **mergedFrom:** interface R09B-INT-05
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 113. PR-0136 (polish, visual): At party scale the Syndicate and goons queue in one diagonal file right behind the party

- **game:** FFX-2 only
- **chapter:** ffx2-leblanc links 1-3
- **expected:** Opposing sides separated across the floor.
- **observed:** Dr. Goon then Logos stand about 70 px from Paine; the enemies occupy the centre third; the slots were authored for boss scale and only the heights changed (9ba0b71).
- **repro:** Seed 1, 1600x900, chapter 6 links 1-3.
- **evidence:** critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/20-link-3.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/targets/5ddfde3/ch6-seam3.jpg
- **confidence:** medium
- **requirement:** RUBRIC §6 visual (composition, staging)
- **fix:** Re-space the chapter 6 enemy slots toward stage right.
- **acceptanceCheck:** At 1600x900 no enemy within 150 px of a girl in the default framing; enemies in the right half.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **mergedFrom:** visual R09b-VIS-03
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 114. PR-0139 (polish, interface): The intent panel keeps naming a KO'd enemy for up to 4.5 s ("ORMI ACTS NEXT Concussive Blast" after Ormi falls)

- **game:** FFX-2 as observed (shared panel)
- **chapter:** ffx2-leblanc Act III, Ormi killed first
- **expected:** A KO'd combatant is dropped from the read-out within a frame.
- **observed:** 0 to 4.5 s after Ormi's KO the panel still reads "ORMI ACTS NEXT Concussive Blast" with damage ranges.
- **repro:** Chapter 6 Act III with Ormi targeted first (the gap pass used an injected retarget wrapper).
- **evidence:** critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/20-after-ormi-ko-0..3.png; critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/run.json
- **confidence:** medium
- **requirement:** Honest intent (RUBRIC §2)
- **fix:** Recompute the intent on ko events and skip combatants at 0 HP.
- **acceptanceCheck:** Within one frame of Ormi's KO the panel names Leblanc or Logos.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **mergedFrom:** gap capture (second half of its intent issue)
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 115. PR-0140 (polish, process): Commit 0bd85cc states no game case (CHK-021)

- **game:** both (FFX ch7 data, FFX-2 ch6 meta, shared results layout)
- **chapter:** 6, 7, 8
- **expected:** Every change records FFX only / FFX-2 only / both with its source.
- **observed:** "Chapters 6 to 8: pause hero art paths, Seymour's sprite key, results drop list fits four drops" has no case line and no handoff references it.
- **repro:** git log -1 --format=%B 0bd85cc
- **evidence:** git history (D:/pyrefly-release at 5ddfde3)
- **confidence:** high
- **requirement:** AGENTS.md rule 14; CHK-021
- **fix:** Add the per-part case (Seymour spriteKey FFX only; Leblanc heroArt FFX-2 only; results layout both) to the chapter handoffs.
- **acceptanceCheck:** A handoff line names 0bd85cc and its three cases.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **mergedFrom:** combat-encounter
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 116. PR-0141 (polish, process): critic-plan --json omits chapter 6 from the chapters this review owes

- **game:** FFX-2 only
- **chapter:** ffx2-leblanc
- **expected:** The plan lists every registered, unlocked chapter the change set touches.
- **observed:** node tools/critic-plan.mjs --json on 5ddfde3 lists five chapters and omits ffx2-leblanc, the main change of the release. This review covered chapter 6 anyway.
- **repro:** cd D:/pyrefly-release && node tools/critic-plan.mjs --json
- **evidence:** critic/rounds/round-09/chief-5ddfde3/plan.json
- **confidence:** high
- **requirement:** RUBRIC §4 (the plan is the coverage this review owes)
- **fix:** Derive the plan's chapter list from the registry (encounters.ts minus LOCKED_CHAPTER_IDS).
- **acceptanceCheck:** The plan output includes ffx2-leblanc for this change set.
- **round12:** Re-observed and widened: critic/pending/5be4babe.json lists chapters seymour-flux, yunalesca, braskas-final-aeon, ffx2-bahamut and ffx2-vegnagun-shuyin only, omitting Chapters VI, VIII and the new IX that this build changed.
- **mergedFrom:** combat-encounter
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 117. PR-0081 (polish, feel): Chapter 5 is 250 actions and 6:21 at FAST; the 5.15 s per action of round 08 does not reproduce (1.52 s per action on the candidate)

- **game:** FFX-2 only
- **chapter:** ffx2-vegnagun-shuyin
- **expected:** As round 08.
- **observed:** Gap capture on the candidate, FAST, intended auto-player: fight 381.2 s across 5 links with 250 action-starts, 1.52 s per action, in line with other chapters (critic/rounds/round-09/evidence/gaps/ch5-fast-cand-1600x900/run.json, gaps/ch5-fast.log). The per-action cost that made this a major does not reproduce; what remains is the chapter's length, which follows its sourced HP and chain.
- **repro:** As round 08, at FAST speed with the intended auto-player on the candidate.
- **evidence:** critic/rounds/round-09/evidence/gaps/ch5-fast-cand-1600x900/run.json; critic/rounds/round-09/gaps/ch5-fast.log
- **confidence:** medium (one run; the auto-player, not a human)
- **requirement:** RUBRIC section 6 feel: dead waiting.
- **fix:** As round 08.
- **acceptanceCheck:** As round 08.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 118. PR-0119 (polish, onboarding): The chain coach mark covers the act-one-cleared dialogue card for about 2 s

- **game:** FFX-2 only
- **chapter:** ffx2-leblanc seam 1->2
- **expected:** Coach marks hold off while a seam dialogue card is up.
- **observed:** The 'Keep hitting the same one!' coach card sits over Rikku's speaker tag and line.
- **repro:** Fresh profile; ch6 link 1 chained kills into the seam
- **evidence:** evidence/gaps/ffx2-leblanc-flow-1600x900/seam-1-to-2/f005-f010.jpg (f008)
- **confidence:** medium (fight played by autoBattle)
- **requirement:** FOC-05; CHK-022
- **fix:** Suppress or queue coach marks while the story card layer is visible.
- **acceptanceCheck:** No coach-mark rect intersects the dialogue card in the seam frame sequence.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 119. PR-0083 (polish, process): Four source files were pushed further past the 400-line house limit by this batch

- **game:** both
- **chapter:** n/a (house style)
- **expected:** A batch that touches a long file leaves it shorter, or splits it.
- **observed:** Reported by the combat auditor from the candidate's own diff: four files already over the limit grew further in this batch. No player effect; it is the kind of drift that makes the next engine change more expensive and it is named here so it is not rediscovered as a surprise.
- **repro:** node tools/orphans.mjs is unrelated; count lines over src/battle and src/engine at 1b33971.
- **evidence:** combat auditor, round 08 (the four files are named in the diff at 1b33971)
- **confidence:** medium — reported, not re-counted by the chief critic
- **requirement:** AGENTS.md hard rule 7 and docs/DEV.md "House rules": every source file under 400 lines.
- **fix:** Split the four at the next change that touches them, rather than as a separate refactor.
- **acceptanceCheck:** No file the next batch touches is over 400 lines when the batch lands.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 120. PR-0036 (polish, visual): The FFX-2 party crowds the left third of the stage while two thirds of it is empty

- **game:** FFX-2
- **chapter:** 4
- **expected:** A composition comparable to the FFX chapters, which stage their party noticeably larger and further apart.
- **observed:** Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.
- **repro:** Chapter 4, first ATB turn, 1600x900.
- **evidence:** critic/rounds/round-04/evidence/shots/ffx2-bahamut-04-enemy-intent.png, ffx2-bahamut-03-battle-menu.png
- **confidence:** high
- **requirement:** RUBRIC section 6 visual (composition, staging, ground contact).
- **fix:** Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.
- **acceptanceCheck:** Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 121. PR-0028 (polish, interface): H does not hide the panels it is labelled for during battle

- **game:** both
- **chapter:** 1 to 5
- **expected:** Either H hides every optional panel in battle, or its legend says what it actually hides.
- **observed:** In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.
- **repro:** Any chapter, battle, press H, 1600x900; then Esc and press H on the pause screen and compare.
- **evidence:** critic/rounds/round-04/evidence/shots/ch1-07-hide-panels.png, ffx2-bahamut-04-hide-panels.png, ffx2-vegnagun-shuyin-04-hide-panels.png; gaps/g-ch1-backdrop-panels-off.png
- **confidence:** medium - the observation is certain; whether the narrower scope is intended is not stated anywhere
- **requirement:** RUBRIC section 6 interface (pause and prep usability, cleanup); it also blocks CHK-013's scene-tile evidence.
- **fix:** Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.
- **acceptanceCheck:** Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 122. PR-0029 (polish, interface): Yu Pagoda A and B carry no always-on field marker

- **game:** FFX
- **chapter:** 3, battle 1 of 7
- **expected:** The CTB's A and B can be mapped to the painted enemies without opening the picker.
- **observed:** The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter. PARTIALLY ANSWERED THIS ROUND: the Chapter 3 CTB column does letter the two pagodas A and B and the target chip carries the letter, but there is still no always-on marker on the field itself.
- **repro:** Chapter 3, first player turn, 1600x900: compare the CTB tiles with the field.
- **evidence:** critic/rounds/round-04/evidence/shots/braskas-final-aeon-03-battle-menu.png; crops/ch3-pagodas.png
- **confidence:** high
- **requirement:** critic/CHECKS.md CHK-011 (every targetable enemy has an always-on marker).
- **fix:** Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.
- **acceptanceCheck:** In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 123. PR-0062 (polish, process): The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody

- **game:** FFX-2
- **chapter:** ffx2-vegnagun-shuyin, link 2
- **expected:** A seed that makes the bench land Berserk makes the shipped chapter land it, so the player-facing half of PR-0052 can be captured.
- **observed:** Two facts block that capture and both belong in the record. (1) z06-passes and z06-berserk construct an isolated vegnagun-leg battle with engine.setSeed(n), while in shipped play each link is seeded from the chapter run (docs/DEV.md: engines are seeded per battle via BattleSetup.seed), so __pyrefly.setSeed(13) before chapter 5 is not the bench's seed 13. The seed-finder confirms the bench-side hits (seeds 3, 13, 27, 36, 38 put Yuna in White Mage under Berserk, earliest at turn 8) but they address the fixture, not the game. (2) Twenty in-game seeds (1-20) were swept, skipping link 1 and watching link 2 at normal speed, polling battleState about every 300 ms. The Leg link was reached in all 20 runs and Berserk was applied to nobody in any of them, although the AI path is live (src/battle/ffx2/ai/vegnagun.ts:72-87 rolls 1-in-3 Berserk / Break / Slow, and Slow was observed landing on Yuna on link 2 in a diagnostic run) and the bench predicts Berserk on a party member in about 6 of 24 isolated Leg battles. A false hypothesis was chased and discarded: legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", but re-running z06-legai proves the unprefixed ids do fire (19 leg-berserk casts over 24 seeds), so there is no id-resolution bug.
- **repro:** critic/rounds/round-06/gap-berserk.mjs and gap-berserk2.mjs (in-game sweep); critic/rounds/round-06/bench/z06-gap-seeds.test.ts (seed finder).
- **evidence:** critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep2.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-seed13.json; critic/rounds/round-06/bench/out/z06-gap-seeds.txt
- **confidence:** High on both measurements. The discrepancy between 6-in-24 predicted and 0-in-20 observed is unexplained and is the thing to reconcile; it may be the harness's sampling, the chapter seeding, or a real difference between the fixture and the shipped link.
- **requirement:** RUBRIC §5: match proof to the claim — a seeded engine fixture cannot stand in for the shipped seeding.
- **fix:** Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.
- **acceptanceCheck:** A named seed makes the shipped chapter 5 link 2 land Berserk on Yuna in White Mage, and the resulting turn is captured at 1600x900.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 124. PR-0167 (suggestion, visual): Records question for Bailey: mark the v5 pause (2000x1012, party panel) and v6 phone pause tiles as superseded by the approved Until Dawn remake

- **game:** both
- **chapter:** pause
- **where:** docs/target/targets.json
- **expected:** One approved target per state.
- **observed:** The build follows the remake, which matches its frames at every captured size. The older v5/v6 tiles are still marked approved.
- **repro:** n/a
- **evidence:** D:/Final Fantasy/critic/rounds/round-11/targets/pause-rebuilt-2000.jpg; D:/Final Fantasy/critic/rounds/round-11/targets/pause-party-panel.jpg; D:/Final Fantasy/critic/rounds/round-11/targets/phone-pause.jpg
- **confidence:** high
- **requirement:** RUBRIC §7 (latest explicit owner decision)
- **fix:** Ask Bailey. Until he answers, these 3 tiles are counted as waiting.
- **acceptanceCheck:** targets.json records superseded, or still-required, on each tile.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 125. PR-0149 (suggestion, delivery): A transient 5xx on a pose sidecar is not retried: the pose silently loses its scale, anchor and facing metadata

- **game:** both
- **chapter:** braskas-final-aeon (observed 503)
- **where:** src/engine/PaintedArt.ts:133-139
- **expected:** A transient host error on a shipped file is retried once before falling back.
- **observed:** art/characters/braskas-final-aeon-1/hurt.json returned 503 once on live (the file exists, 2,113 bytes; a curl re-fetch returned 200 application/json). tryLoadMeta returns null on !res.ok. No visual consequence captured.
- **repro:** Not reproducible on demand (a GitHub Pages hiccup at about minute 40 of the chapter 3 run).
- **evidence:** critic/rounds/round-10/evidence/braskas-final-aeon-win/network-media.json
- **confidence:** low for player impact (traced in code, not observed)
- **requirement:** delivery: valid media under real hosting
- **fix:** Retry once after about 500 ms on a 5xx or a thrown fetch in tryLoadMeta and tryLoadTexture.
- **acceptanceCheck:** A unit test with a fetch stub answering 503 then 200 gets the sidecar.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 126. PR-0044 (suggestion, visual): 16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them

- **game:** both (15 of the 16 are FFX-2 dresspheres)
- **chapter:** n/a
- **expected:** Every subject declares its facing so the sign assertion can run per chapter formation.
- **observed:** paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.
- **repro:** Read D:/pyrefly-release/public/art/manifest.json.
- **evidence:** D:/pyrefly-release/public/art/manifest.json
- **confidence:** high
- **requirement:** critic/CHECKS.md CHK-014.
- **fix:** Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.
- **acceptanceCheck:** Every manifest subject carries a facing and the per-formation sign assertion runs green.
- **round12:** Still open: CHK-014 stayed visual-only this round.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 127. PR-0072 (suggestion, visual): Vegnagun has no ground contact and Paine stands inside its cannon barrel

- **game:** FFX-2
- **chapter:** 5 (Vegnagun and Shuyin)
- **expected:** The boss is planted on the Farplane floor with the same contact treatment the party actors get, and clearly behind the party in depth.
- **observed:** Two of the three things reported during this round hold and one does not. Vegnagun's underside ends in a hard edge above the plain with no cast shadow or contact pool, while all three girls sit on visible contact rings; and Paine's billboard intersects the green cannon barrel so she reads as embedded in the machine rather than standing in front of it. The third claim, that Vegnagun is undersized and reads as a prop, is NOT supported by the capture: it dominates the frame horizontally and stands well above the party. Filed as a suggestion rather than a defect because the approved tile does not settle the depth staging and Bailey has not reacted to this frame.
- **repro:** Chapter V from the board with real keys, Enter through the scene, capture the first command menu at 1600x900.
- **evidence:** critic/rounds/round-07/evidence/ch5/04-first-menu.png; critic/rounds/round-07/targets/fight-targeting-s3.jpg
- **confidence:** high for the ground contact and the overlap; the scale claim is refuted
- **requirement:** CHK-014 (contact fits the shot); RUBRIC §6 visual (ground contact).
- **fix:** Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.
- **acceptanceCheck:** At 1600x900 a contact shadow is visible beneath Vegnagun and no party billboard intersects it, on the first command frame and at target selection.
- **round12:** Not re-tested on 5be4babe; carried as filed in round 11.
- **verification:** not re-tested on this build
- **carried from:** round-11 (76f587c3)

### 128. PR-0196 (suggestion, visual-target): Records: the targets.json tile 'Yojimbo's look' points at a missing file, and delivery fields lag the build

- **game:** FFX (tile), both (records)
- **chapter:** docs/target/targets.json
- **expected:** Tile srcs exist, and delivery reflects the build.
- **observed:** The tile's src docs/concepts/chapters/yojimbo/boss/a-new-frame.jpg does not exist; the frame on disk is a-repaint-frame.jpg. The Yojimbo tiles, PR-0002, PR-0005-ffx and PR-0127 still read delivery 'not-scheduled' although they are built and live.
- **repro:** node -e check of fs.existsSync on every tile src.
- **evidence:** docs/target/targets.json; D:/Final Fantasy/critic/rounds/round-12/targets/ch9-yojimbo-look.jpg
- **confidence:** high
- **requirement:** RUBRIC section 7
- **fix:** Point the src at a-repaint-frame.jpg. Let this report's validated verdicts move the matched tiles to 'verified' (verifiedBy).
- **acceptanceCheck:** Every tile src exists, and the matched tiles carry verifiedBy.

## Resolved this round (live proof on 5be4babe)

- **PR-0082:** Chapter III won on live with real keys on the first attempt (333 commands, links 1-7, aftermath, results, CONFIRM scene, reload keeps the clear; braskas-final-aeon-win/).
- **PR-0155:** FFX aeon menus show Attack / Overdrive / Aeon / Dismiss with no Items row, and no aeon used an item in Chapters II, III or IX (turn logs).
- **PR-0143:** The FFX-2 banner names the stolen item: "Rikku STOLE BUDGET GRENADE!", "DR. GOON HAS NOTHING LEFT TO STEAL", "STOLE X-POTION!" (ffx2-leblanc-steal/).
- **PR-0154:** No evasion of a magical row in 21,523 live Chapter V events or in the 40-seed benches (combat auditor).
- **PR-0156:** 1,431 decision-time HUD HP/MP readings across 17 turn logs show none above maximum (interface auditor).
- **PR-0152:** The Chapter II pause CHAPTER snapshot is three thumbnails at 1600, 2000 and 390 (pause-chapter-yunalesca-*).
- **PR-0096:** Leblanc's idle holds the red fan fully open, clear of the intent card (ffx2-leblanc-win/zoom-leblanc-fan-link3.png).
- **PR-0002:** Yuna stands clear of the FFX command stack in Chapters I and III at 1600 and 2000; the Chapter VIII half is tracked as R13-04.
- **PR-0005:** The command cascade and Auron's coach line draw above the turn cut-in slab (D-042 B).
- **PR-0016:** The pause CHAPTER tab shows the chapter hero plate in Chapters I (gap pass, with H), II, III, IV, V, VI (gap pass), VIII and IX.
- **PR-0065:** 17 of 17 briefings show Auron and the backdrop; every desktop chapter card shows painted party busts on fresh profiles.
- **PR-0022:** KO'd party members lie on the floor at their stations: FFX in the Chapter IX Zanmato frames, FFX-2 Yuna in Chapter VI (gaps/ko-ffx2-leblanc).
- **PR-0079:** Not reproduced: the Chapter IX Kimahri tab and the Chapter VI tabs keep the stats clear of faces, and the gap pass found every face clear at 1280x960 and 1280x720 (gaps/shape-*-1280x*/21-tab-*.png).
- **PR-0150:** FFX-2 targeting shows the TARGET plate, the actor/dressphere plate, the six-petal reticle and the ATB chip (Chapter VI).
- **PR-0020:** Gap pass: Paine, Yuna (FFX-2), Young Auron, Brother (FFX-2) and Jecht render portrait, name, role chip and line with no crop damage (gaps/contact-speakers.jpg). The Fayth boy stays unverified (his only lines follow a Chapter V win).
- **PR-0084:** Load time is now measured: DOMContentLoaded 0.36-0.56 s, title 0.38-0.57 s, board 2.7-3.2 s, prep 3.2-3.8 s on a fresh profile (latency/*.json). The battle-entry stall is tracked as PR-0061.
- **PR-0116:** The briefing reads 'Eight fights. That is all this is.', derived from the playable chapter list (D-136).

Merged, downgraded and escalated:
- PR-0017 merged into PR-0001: one root: the phone battle layout (D-140 B).
- R15-01 merged into PR-0001: same defect under the focused review's id.
- R15-03 merged into PR-0182: Ronso Rage asks twice; widened to the first OVERDRIVE Enter.
- R12-02 (capture owner) and R12-UI-01 (interface auditor) merged into PR-0076: the same Chapter V losses under the Wait split default.
- R12-FN-03 (feel auditor) merged into PR-0181: the same summon staging.
- CHK-003 rotated shapes (gap pass) merged into FOC-06: one root: no floor on stage-scaled type.
- PAUSE-4K (gap pass) merged into PR-0121: the same 4K pause band round 11 filed.
- delivery first-menu stall (prep-delivery auditor) merged into PR-0061: cross-reference, scored once under feel.
- PR-0195 (CHK-024 unrun) major to polish (process): an evidence gap, not an observed player defect; it stays in requiredNotTested and blocks any milestone.
- PR-0109 major (auditor) to polish: stalling calls for a method check, not a higher severity.
- PR-0121 major (gap pass) to polish: same defect and severity as round 11.
- PR-0019 major to polish: the chip half is repaired; only the truncated help sentence remains.
- PR-0010 major to polish: the mid-glyph cut is gone; J HOLD is advertised.
- PR-0105 polish to major: the Wait split default makes it reachable in normal play (confirmed live and in 20/20 engine seeds).
- PR-0076 polish to major: now the default's cost: Chapter V lost 3 of 3 live; the win path is unverified.

Confirmer (independent retest of the top issues):
- CONFIRMED: PR-0061 (carried, STALLED): 7.1 to 11.9 s from a held-Enter scene skip to the first usable… Reproduced on the live site in PYREFLY_BROWSER=gpu mode, fresh context, 1600x900. I ran a copy of latency.mjs that writes to critic/rounds/round-12/confirm/latency/ so the original evidence was not overwritten. Time from leaving the scene to visible command rows: Chapter IX 11,953 ms and Chapter I 8,912 ms. The reviewer measured 11.9 s and 8.8 s. I also recomputed their JSON marks for III (7,094 ms) and IV (8,265 ms), which match. New detail on the cause: sceneLeftToBattleMs is only 3 to 12 ms, so the battle screen mounts almost at once. Nearly all of the delay falls between battle mount and the first awaitingMenu, which points at the battle-entry sweep or arrival cinematic, not asset fetch or scene teardown. The cause is not traced to a line. Severity major stands. regressionVsLive remains unknown.
- CONFIRMED: R15-01 (carried, disclosed): the phone FFX battle HUD text is below the legibility floor, … I inspected critic/rounds/round-12/evidence/yojimbo-cavern-win-phone/11-advisor.png (390x844). At native size the command rows (ATTACK/SPECIAL/ITEMS/OVERDRIVE/SWITCH, about 6 px), the CTB portrait list, the strategy guide card, the party HP/MP rows and Yojimbo's target card are all well below the CHK-003 floor. The Zanmato gauge panel is readable. One correction: the advisor card's headline ('HIDE MOVES', 'Kimahri', 'Doom -> Yojimbo') is borderline-readable, not 'a few pixels'. Its secondary lines are not. This was already disclosed, so it is not a regression. The fix needs a phone-HUD options round with Bailey before anything is built (rule 9).
- CONFIRMED: R12-C01 (new): the Gagazet preset's five aeons sit below the verified battle-count floor (… The data discrepancy is confirmed in D:/pyrefly-rel15. gagazet.ts:428-432 ships Valefor 738, Ifrit 988, Ixion 983, Shiva 878 and Bahamut 1,398 HP. research/ffx-combat-core.md §6.4.3 (lines ~1243-1247) gives 1,530 / 2,075 / 2,055 / 1,830 / 2,935 for Mt. Gagazet N=250. Line 1200 says §6.4.1 is a lower bound that an aeon is 'never weaker than' [verified: 3 sources]. The shipped rows are an invented scaling: the file comment at gagazet.ts:362-376 says '~0.55x HP/MP, ~0.8x everything else'. That breaks rule 6. It also breaks the file's own monotonic argument, because the earlier Macalania preset (macalania.ts:276-282) has higher HP (1,146-1,515). yojimbo-cavern.ts:85 spreads structuredClone(gagazetBuild) and does not override aeons, so Chapter IX inherits the rows. Canon caveat on the title's framing: ffx-yojimbo.md line 167 says the aeon 'takes it, and ... dies', so strategy 3 is absorbing Zanmato, not surviving it. The real player-facing issue is that too-weak aeons die to Kozuka or Wakizashi before Zanmato fires. The 'shielded Bahamut survives' check relies on a Shield factor that research line 342 marks as not verified, so it should be stated as derived. I did not rerun the live aeon route or the 200-seed bench. Player impact is small, as the reviewer says. The fix is FFX only: use the §6.4.3 rows (measure, never tune).
- CONFIRMED: PR-0105 (carried, escalated from polish): under the shipped default Wait split, a hit on a… Reproduced in the engine with critic/rounds/round-12/confirm/pr0105.test.ts in D:/pyrefly-rel15 (config vitest.confirm.mjs). Setup: FFX2Engine with default options (waitSplit()=true), Chapter IV with bevelleBuild, seeds 1-20. At the first player input I called setMenuLevel('top') and ticked 100 ms with throughInput until the owner took damage. In 20 of 20 seeds she was hit and inputValid(owner) stayed true, so the menu stayed open. Research says the opposite: ffx2-combat-core.md line 50 (§1.1 table) and line 211 (§1.5 Active, [single source: Split Infinity G0913]). The default split puts the clock under the open top list, so this is now reachable under the default Wait. Important context the finding leaves out: the behaviour is a deliberate deferral, not an oversight. active.ts's doc comment on inputStillValid calls the rule 'an open question for Bailey'. docs/target/decisions.json D-010 is state 'proposed', 'asked 2026-09-21, not answered'. It should be reported as an owner decision that the default split has made more urgent, not built unilaterally (rule 10). The live frame sequence is still owed. FFX-2 only.
- CONFIRMED: PR-0008 (carried, STALLED, worse): Chapter I's intended line now wins 17 of 40 and the adv… The engine side is reproduced in D:/pyrefly-rel15 (5be4babe). tests/unit/strategy-seymour-flux.test.ts reports 'seeds 1-40: 17 wins'. Seed 1 is a documented defeat, with 45,687 Seymour HP left at turn 47. The reviewer's bench-ffx.log shows the advisor-top-row line at 20/40 with seed 1 lost. The finding text reached me truncated, and I did not re-run the live advisor-following captures (1 win in 5 decided attempts). The live part rests on the reviewer's evidence, and I have not verified it independently. The cause is not traced. The drop came from sourced rule fixes (Poison phase, aeons losing Items) applied to a preset tagged [estimate], so any correction belongs to the preset's sourcing, never to Seymour's numbers. R12-C01's aeon rows are part of that preset, but the reviewer's own arm (16/40) shows they do not explain Chapter I. FFX only.

## What stands between this build and acceptance

- An audio listening verdict from Bailey on the shipped mix (the audio category has no score until then), and an answer to his 2026-09-21 "SNES" verdict (PR-0148).
- 32 open majors, led by the first-menu stall (PR-0061), Chapter V on the default (PR-0076), Chapter I at 17/40 (PR-0008), unnamed FFX actions (PR-0180), the wrong-target intent (PR-0153), the phone battle HUD (PR-0001) and the summon staging (PR-0181).
- Every category at 9.0 or more: all nine scored categories are below the floor (6.9 to 8.7).
- Every chapter through its real flow: Chapter V has no live win on this build; Chapter VII is locked and outside the playable scope.
- Targets: 6 failing and 5 unverified of 64, plus 9 waiting on Bailey.
- Mandatory checks: CHK-002, 003, 004, 006, 007, 008, 009, 011, 012 and 015 FAIL; CHK-005, 010, 022 and 023 have UNVERIFIED records; CHK-024 has never run.
- Human judgments not recorded: CHK-B1, CHK-B2, PR-0076, D-010, PR-0008, PR-0035, PR-0021, D-068, PR-0170.

## What changed since the previous round (round 11, on 76f587c3)

Round 11 is the previous deep evidence under rubric v2; rounds 02 and 03 were scored under rubric v1 and are not compared here.

- Category scores against round 11: combat 8.5 to 8.6, encounter 8.9 to 8.7, visual 7.6 to 8.2, feel 7.9 to 7.8, narrative 7.7 to 7.9, audio UNVERIFIED both times, interface 7.0 to 7.3, onboarding 6.6 to 6.9, prep 8.4 to 8.5, delivery 7.9 to 8.0.
- Resolved with live proof: PR-0082, PR-0155, PR-0143, PR-0154, PR-0156, PR-0152, PR-0096, PR-0002, PR-0005, PR-0016, PR-0065, PR-0022, PR-0079, PR-0150, PR-0020, PR-0084, PR-0116.
- The biggest gains: Chapter III is won by real input for the first time (PR-0082), so its seams, aftermath, results and FFX ending are reachable; aeons lost the party's Items (PR-0155); FFX-2 magic never rolls (PR-0154); the FFX-2 banner names stolen items (PR-0143); Leblanc's fan is open (PR-0096); the pause hero plates, cold-launch art and FFX stack placement are repaired.
- New this round: Chapter IX (Yojimbo) is faithful and sourced (gauge bands, Doom 5, Zanmato 9,999, no rewards) and renders every approved pick; its defects are PR-0179 (aeon data), PR-0180 (unnamed actions, shared FFX), PR-0181 (summon staging), PR-0191 (Zanmato panel ahead of the strike) and polish.
- Worse: the Wait split default costs Chapter V (lost 3 of 3 live) and exposes PR-0105; Chapter I fell from 26 to 17 of 40 through two sourced fixes (PR-0008).
- Coverage this round added the 4:3, 21:9, 1440p and 4K shapes, measured load and input latency, and the live Wait split, which round 11 did not have.

## Proposals (nothing here is built without Bailey's yes)

Unscored. Each needs Bailey's explicit yes (AGENTS.md rule 10), and anything he will see gets options first (rule 9).

1. Chapter V at human speed (FFX-2 only): offer the already-built whole-menu hold as a visible Wait choice beside the faithful split, or a first-turn coach line that opening a submenu stops the clock. Benefit: a winnable Chapter V at human decision times (bench 40/40 under the hold). Cost: small (both exist). Fit: the split is canon, the hold is an accessibility adaptation. Preview: a mockup of the pause OPTIONS row and the coach bubble.
2. D-010 (FFX-2 only): adopt the single-source rule that an enemy hit closes the open menu and delays that girl, in Active and the Wait split. Benefit: fidelity under the new default. Cost: engine change plus a ch4-6 re-bench. Risk: single source (Split Infinity) and harder fights. Preview: the gap pass frames of the hit today (gaps/ch4-wait-split/seq-C-hit-on-open-girl).
3. FFX message strip (FFX only): name each enemy action in the top strip as FFX does, and hold the Zanmato banner through the strike. Benefit: Zanmato and the Daigoro/Kozuka/Wakizashi bands become readable. Cost: register the existing MessageBar for FFX. Fit: canon presentation. Preview: a still of Ch IX with "Zanmato" in the strip.
4. Intent "random target" layout (both games, checked per game): list every possible target with its range and a can-KO flag when the move picks at random. Benefit: fixes PR-0153 honestly. Cost: intent panel change. Preview: a mockup at 1600x900 for Ch VIII (Tidus lethal).
5. Defeat screen reason (both games): one line saying what ended the run (for example "Zanmato, 9,999 to each"). Benefit: onboarding (PR-0033). Cost: small. Preview: a results mockup.
6. Phone results layout (both games) to go with D-140 B: a stacked full-width results card with a large RETRY. Benefit: the phone flow finishes legibly. Preview: two options at 390x844.
7. Accessibility options (both games): text size, flash reduction and key remapping in pause OPTIONS (PR-0032). Preview: an OPTIONS mockup.
8. Critic process: pin the reviewed build during capture and record the loaded bundle in every run.json; instrument menu level and message-bar text in the capture recorder; add a fixture-based save upgrade matrix (CHK-024) to the capture harness. Benefit: removes three recurring UNVERIFIED items. Cost: harness work only.
