```text
Build / artifact / target version: main 4f4dc77bc (Release 54) / bundle CLLPzAAR / artifactHash f94803ed3a121626c561eb627c95ec51dfb31273b329f533bec994fb78e2224c (live at https://echoesofspira.com/, deployed 2026-10-18T19:14:59Z; target version: none, the Doublecast option A target is the driver's delegated pick and not a registry tile in docs/target/targets.json)
Review: live
Deployment: PASS (exact artifact byte-identical, all 5309 downloadable files; the r54 changes under test work live on the intended states at 1600x900 and 390x844)
Changed area: NOT APPLICABLE (the focused review owns it: critic/reviews/4f4dc77bc-focused.json, ship SHIP, changedArea PASS)
Ship: N/A (a live review does not gate ship); this pass adds no critical and no major issue and finds no regression against r53; the two majors the focused review disclosed (FOC54-001 CHK-026 on Chapter III, FOC54-002 CHK-027 swap jerks) read again on the live build as disclosed, with the same numbers
Milestone: not assessed
Quality: not assessed (a live review does not recompute the score)
Targets: not assessed
Top issues: none new. Observations only: LV54-1 Chapter III on the live artifact reads CHK-026 FAIL (head 23.7% at aeon hurt-to-KO swaps, the candidate 23.5, live r53 23.6) and CHK-027 FAIL (28 swap jerks of 40 px or more in 1777.8 s, worst 160.4 px; the candidate 31 in 1883.2 s, worst 161.2; r53 live 37 in 1622.3 s, worst 159.9), frame p99 56.2 ms on a busy machine; LV54-2 the harness still cannot play the Doublecast advice (370 turns, outcome undecided then defeat, FOC54-007); LV54-3 FOC54-004 reproduced live ("His aeon is ready. Guard first." over Yuna's menu, which has no Defend); LV54-4 FOC54-005 reproduced live (Yu Yevon's plate reads "HP 99999 / 99999" with no digit grouping, HP only, and a reticle corner crosses the plate's element row); LV54-5 with Kimahri on the field the chips read HP on the Pagodas and Braska's Final Aeon at once (his weapon carries Sensor), where the focused review's pagoda log read "HP ? ? ?" at the same step: not reproduced, recorded; LV54-6 the FFX-2 Chapter IV start card held 0.99 s on a desktop cold load and 7.27 s on a phone cold load (not r54's: no start-card, stage or pose file is in the r54 diff)
Coverage: tested = all 5309 downloadable files byte-compared (--full); poseTrust() empty in every chapter context (17 live contexts, read at the first menu and again after the turns); FFX Chapter III Lulu's Doublecast as two picks by real keys (desktop) and real taps (phone): natural, with the One MP Cost state edit, and the dead end, 6 runs, both viewports; Scan on a Yu Pagoda (immune miss) and the Sensor plate on Yu Yevon (HP 99999 / 99999) on both viewports; FFX Chapter XIV Yuna's locked menu on both viewports and a later duel menu; FFX-2 Chapter IV (Bahamut) real-key and tapped turns on both viewports and FFX Chapter I (Seymour Flux) as regression smokes; the continuity harness on Chapter III on the live artifact; reused = the focused review's code-level findings (the artifact is byte-identical to the candidate it ran on); not tested = see below
Next required review and why: the deep review of this live build (the marker's `deep` obligation, carried from earlier builds) is still owed; this pass settles only `live`
Elapsed review time / repeated work avoided: about 100 minutes wall clock (the 36-minute --full download ran in the background beside the smoke runs); the r53 harness shape (common.mjs, smoke.mjs) and the focused review's Doublecast, Scan and Isaaru probes were copied and adapted, now run from the title by real keys against the live URL
```

Mode: headless Chromium launched by Playwright from node scripts, `PYREFLY_BROWSER=gpu` for every run (ANGLE, D3D11; never SwiftShader, never the Claude-in-Chrome tools or the browser pane, no headed window). No canvas was black. Every run used a fresh browser context (empty HTTP cache, empty storage: a cold load) and a `?livesmoke=<ms>` cache-busting URL. `D:/Tools/pyrefly-scratch/GPU-QUIET` did not exist. **The machine was not idle and not quiet**: other jobs ran throughout (total CPU read 72 percent before the harness and 91 to 97 percent in the ten seconds after it, with none of my processes left running; I did not identify what was running). The smoke runs overlapped the first 36 minutes of the full download. Frame p99 in the continuity run read 56.2 ms (see Step 3). Evidence is in `critic/reviews/4f4dc77bc-live/` (`run/` the result JSON of every run with its steps, `summary.json`, frames as `*-frames.json.gz`, screenshots as JPEG in `run/shots/`; `scripts/` the harness; `continuity/` the harness run with its PNG frames re-encoded as JPEG at quality 72, the PNG originals deleted to keep the folder at 22 MB; `verify-live.json` and `.log`; `run/superseded/` the runs whose pass test or harness was my mistake, explained below; `run/explore-*.json` and `run/probe-*.json` are exploration, not evidence). Nothing was staged or committed. I started no server of my own (the live site was the only target); the one stray process I started, a duplicate of the `--full` download launched by a mistaken first attempt, was killed by PID after 17 minutes; the port-8892 ComfyUI and every other process were left alone.

## Step 1: exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/4f4dc77bc.json --url https://echoesofspira.com/ --changed-from critic/artifacts/9c91a8c3a.json --full --out critic/reviews/4f4dc77bc-live/verify-live.json
```

```json
{
 "result": "PASS",
 "artifactHash": "f94803ed3a121626c561eb627c95ec51dfb31273b329f533bec994fb78e2224c",
 "liveManifest": "match",
 "checked": 5309,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": []
}
```

PASS: the live manifest names this artifact and every compared file is byte-identical with the right content type. The manifest lists 5310 files (10,811,006,079 bytes); `_headers` is read by Cloudflare and never served, so it is the one not downloaded; `index.html` as a browser asks for it is identical to the artifact once Cloudflare's Web Analytics beacon (366 bytes and the line feed after it) is cut out. The run took about 36 minutes (19:22:33Z to 19:58Z). The diff from r53 (9c91a8c3a) is four added files (`index-CLLPzAAR.js`, `index-BoGf7TDm.css`, `exp-fayth-table-DXHbnl4T.js`, `worker-DRncs48z.js`), their four predecessors removed, and `index.html` changed; no painting, audio, data or font file moved (the manifest's total grew by 27,830 bytes). The manifest's two `problems` lines (`art/portrait-parts/paine/{1x,2x}/eyeR-catch.png` decode to a flat colour) are the `intentionalFlatImages` entries r53 carried. `window.__pyrefly.build()` read `{sha: "4f4dc77b", bundle: "index-CLLPzAAR.js"}` in all 17 contexts.

## Step 2: real-input smoke (CHK-016)

Real input only: `page.keyboard.press` for keys (a held Enter through the FFX-2 pre-battle scene where it says "hurried"), `page.mouse.click` for the greyed-row click on the desktop, `page.touchscreen.tap` for every tap on the phone (rows, the list title as Back, the aimed target as confirm, a greyed row). The debug API was read for state (screen, pending menu, battle log, targeting, pose trust, the combatants) and used to act in exactly three places, all listed under "Disclosed shortcuts" below.

| Run (all fresh contexts) | What | Viewport | Result |
|---|---|---|---|
| dc-natural | FFX Chapter III, Lulu Doublecast, the chapter's own state (One MP Cost: every spell 1 MP) | 1600x900 keys, 390x844 taps | 14 of 14 steps OK, both |
| dc-edit | the same with the One MP Cost state edit and MP 20 (greyed rows) | both | 14 of 14, both |
| dc-dead | the same with the edit and MP 10 (the dead end) | both | 13 of 13, both |
| scan-pagoda | Chapter III, Kimahri in by real keys, Special, Scan, Scan on a Yu Pagoda | both | 7 of 7, both; plus a comparison run with the cutscenes and prep skipped by the debug goto (same reading) |
| scan-yevon | the same after the debug autopilot has brought the fight to Yu Yevon; Sensor plate read | both | 8 of 8, both |
| isaaru | FFX Chapter XIV, Yuna's first menu | both | 14 of 14, both |
| isaaru-next | past the first Grand Summon: Valefor, Yuna, Yuna's summon list, Ixion | 1600x900 | 4 of 4 |
| bahamut | FFX-2 Chapter IV, hurried opening, 4 real-key (desktop) and 3 tapped (phone) turns | both | 12 of 12 and 11 of 11 |
| seymour | FFX Chapter I, 3 real-key turns, regression smoke | 1600x900 | 11 of 11 |

185 steps in 17 contexts (the 16 listed plus the goto comparison run), 0 failed in the final runs.

**poseTrust() (a).** `window.__pyrefly.poseTrust()` read `withheld: []` and `unregistered: []` at the first menu and again after the turns in all 17 contexts: Chapter III Doublecast, Scan and Yu Yevon runs, Chapter XIV, Bahamut (30 ok, 12 reference, 9 exempt, 9 held on desktop; 30 ok, 4 reference, 9 held on the phone) and Seymour Flux (36 ok, 5 reference, 7 held). Nothing is withheld on the live build.

**Chapter III, Lulu's Doublecast (b).** Lulu starts off the field (Tidus, Yuna and Auron are the party); she is switched in by real keys (Special, Switch, Lulu) and her turn is reached by passing the others with Defend (Q). Special, Doublecast opens "Doublecast · 1 of 2" (the crumb text; CSS upper-cases it to DOUBLECAST · 1 OF 2). Fira goes to a target pick of step 1 of 2 (help "1 Fira · 8 MP, Pick a target for the first cast."); confirming it opens list 2 under "DOUBLECAST · 2 OF 2" with the lock chip "1 Fira" (kept clear of the boss: x 582, y 126 on desktop, 70 by 20 on the phone), the slab "1 FIRA › YU PAGODA A, 8 MP / 12 MP left. Choose the second cast." and the preview chip "20 −8 → 12" (frame `run/shots/dc-edit-1600x900-list2.jpg`, phone `dc-edit-390x844-list2.jpg`). With the state edit, Firaga and Blizzaga are greyed with "Not enough MP" in list 2 (and only those); in the natural state nothing is greyed (every spell costs 1 MP, "299 MP left", the chip "300 −1 → 299"). The second spell, Blizzard, opens its own target pick ("2 Blizzard · 4 MP, Pick its target. 8 MP left after.") with the chip still up. **Back:** Esc from target 2 returns to list 2; from list 2 one more Esc (desktop) or a tap on the list title, the breadcrumb (phone, "a tap on the title is Back") returns to target 1 ("Doublecast · 1 of 2", help "1 Fira · 8 MP, Pick a target for the first cast.", the chip gone). **Commit:** with both picks made the battle log reads `action-start Doublecast: Fira`, `mp-damage lulu 8`, `damage yu-pagoda-left 1583`, `action-start Doublecast: Blizzard`, `mp-damage lulu 4`, `damage yu-pagoda-left 749` (desktop, edit; Lulu's MP 20 to 8), and `Doublecast: Fira` 1 MP then `Doublecast: Firaga` 1 MP in the natural state: **two casts, each paying its own MP**; the phone runs read 8 then 4 and 1 then 1 the same way, every step by tap (the final commit by a tap on the aimed target, no Enter). **Dead end (MP 10):** after Fira all six rows are greyed, the help line reads "No second spell fits. Esc goes back."; Enter on a greyed row (desktop) or a tap on one (phone) commits nothing (battle log 18 before and after, still list 2); Esc goes to target 1 and Esc again to list 1.

**Scan on a Yu Pagoda (c).** Kimahri in by real keys, Special, Scan, aimed at a Yu Pagoda, Enter: the log reads `action-start Scan`, `miss yu-pagoda-left reason immune` (both viewports, both flows). With Kimahri on the field every Sensor chip reads HP at once (Pagodas 5000 / 5000, Braska's Final Aeon 60000 / 60000; LV54-5). **Sensor on Yu Yevon:** the debug autopilot (speed skip, `autoBattle('intended')`) brought the fight to Yu Yevon in 46.0 s (desktop) and 42.9 s (phone), then was switched off; Kimahri's Scan menu by real keys; the chip and the expanded plate (I) on Yu Yevon read **"HP 99999 / 99999"** (frame `run/shots/scan-yevon-1600x900-sensor-yu-yevon.jpg`, a zoom beside it in the focused review's `zoom-yevon-hp.png`). The plate shows HP only, the digits are not grouped, and a reticle corner's vertical line crosses the element row beside the plate (on desktop it clipped the E of FIRE in my frame; the last HP digit was clear): FOC54-005 reads the same on live.

**Chapter XIV, Isaaru's duels (d).** From the board by real keys to Yuna's first menu: rows `Attack(dis)`, `Special ×2 (dis)`, `White Magic ×10 (dis)`, `Items ×11 (dis)`, `>Overdrive READY`, `Summon ×5`: the cursor opens on Overdrive, the other four rows are greyed, no row and no element on the page says Defend. A real mouse click (desktop) or tap (phone) on a greyed row moves the cursor onto it and resolves nothing (log 5 before and after, the menu still up); Enter on it shakes the stack (the shake class seen) and resolves nothing; Q does nothing; the arrow keys bring the cursor back to Overdrive and Enter starts the Grand Summon (phase `hud:minigame-request`). A longer run past the first Grand Summon reached Valefor's menu (Attack, Overdrive, Aeon, Dismiss), then **a second Yuna menu with the same lock** (`Talk(dis) Attack(dis) Special(dis) White Magic(dis) Items(dis) >Summon ×4`, the cursor on Summon because the Overdrive is spent, no Defend), her summon list (Ifrit, "Mirror of Grothia", greyed) and Ixion's menu. FOC54-004 is live: Yuna's line over the first menu reads "His aeon is ready. Guard first." (frame `run/shots/isaaru-1600x900-yuna-menu.jpg`).

**FFX-2 regression smoke (e).** Chapter IV (Bahamut) from the title by real keys: desktop hurried opening (the start card up 0.99 s, the boss 570.9 px at the first menu and 569.9 px five seconds later), turns by Yuna's first row, Paine's Attack, Rikku's Attack and Yuna's first row; phone (the card up 7.27 s on this cold load, the boss 253.7 and 255.5 px), Paine and Rikku Attack by tap, Yuna by the first row: all OK, poseTrust empty. A Doublecast node, reason line or step strip does not appear in FFX-2 (Bahamut's rows read White Magic, Change, Item for Yuna). FFX Chapter I (Seymour Flux) as a second regression smoke: three real-key turns, the boss 488.8 px at the menu and 483.5 px after 5 s (minus 1.08 percent, inside the smoke's 2 percent line).

**Console and network (f).** Across the 17 contexts: **0 console errors, 0 page errors, 0 responses with status 400 or more (not one 404), 0 image or audio responses served as text/html.** 144 `requestfailed` events (all of the same kind as earlier live reviews: prefetches cancelled by a screen change, no status, no console error; r53 reported 225 in 15 contexts). **The save key.** `pyrefly-reprise:save:v1`, board against the end of each run, is never changed beyond what the build before it changes on a first attempt: `updatedAt`, one `seenCoach` entry, and the chapter rows the board creates (Chapter III runs add `chapters/yunalesca` and `chapters/braskas-final-aeon`; Chapter XIV adds those and six more; Bahamut adds 12 rows; Seymour Flux changes `attempts` 0 to 1 and `playTimeMs`); no key removed in any run, no `version` or `cleared` field changed, 0 of 17 runs removed anything. After the Bahamut and Seymour runs a reload in the same context reached the title with the key byte-identical to what the run wrote (3 of 3).

### Disclosed shortcuts (what was not played by real keys)

1. **The One MP Cost state edit.** The `edit` and `dead` Doublecast runs removed `one-mp-cost` from Lulu's weapon and armor and set her MP to 20 (edit) or 10 (dead) through the debug `battleState()` before her turn, to see greyed rows: with One MP Cost every spell costs 1 MP and nothing can grey. The `natural` runs have no edit and show the whole two-pick flow, the lock chip, the MP-left line, Back and the two-cast commit (1 MP each). The edit is recorded in each result as `stateEdit` and held (Lulu's MP read 20, then 8 after the commit).
2. **The Yu Yevon autopilot.** The `yevon` runs reach Yu Yevon with the debug autopilot at skip speed (a full Chapter III by real keys is 27 to 31 minutes of battle: the harness run in Step 3 is that route). From Kimahri's own menu on, everything is real keys or taps.
3. **The goto comparison run** (`scan-pagoda-goto`) used the debug `gotoChapter` with the cutscenes and the party prep skipped, only to compare the Sensor chip with the real-flow reading (same).

## Step 3: continuity harness on Chapter III (CHK-026 and CHK-027), live artifact

```
node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --evidence=critic/reviews/4f4dc77bc-live/continuity --chapters=braskas-final-aeon --tag=live-r54
```

Real keys from the title to the fight's end, GPU, 1600x900, seed 1. The columns are the focused review's own numbers (its summary and `continuity-live.log`) against this run.

| | candidate (focused) | live r53 (focused) | live r54, this run |
|---|---|---|---|
| battle, swaps (judged) | 1883.2 s, 2466 (2407) | 1622.3 s, 1890 (1839) | 1777.8 s, 2491 (2450) |
| outcome | defeat after 370 turns, retry reached battle | victory, 284 turns | undecided after 370 turns, then defeat, retry reached battle |
| CHK-026 | FAIL | FAIL | **FAIL** |
| max head jump (by registration, a control) | 23.5% (0.2%) | 23.6% (0.2%) | **23.7% (0.2%)** |
| where | aeon hurt to KO (the worst strips: Shiva, Valefor, Ixion, Ifrit) | the same figure | Valefor hurt to KO 23.7 (ratio 0.763), Ifrit 17.0, Bahamut 15.8 |
| stature range, swaps out of band | 0.747 to 1.121, 0 | 0.749 to 1.12, 0 | 0.747 to 1.12, 0 |
| feet from the pixels | 1 over (22 px) | 1 over (35.9 px) | 1 over (21.9 px; Shiva attack to idle) |
| max feet shift by registration | 1.5 px | 1.5 px | 1.5 px |
| CHK-027 | FAIL | FAIL | **FAIL** |
| swap jerks of 40 px or more | 31 (0.99 per minute) | 37 (1.37 per minute) | 28 (0.95 per minute) |
| of those on a steady frame (under 34 ms) | 17 | 35 | 25 |
| worst swap jerk | 161.2 px | 159.9 px | **160.4 px** (Valefor's KO swap, on a 16.2 ms frame) |
| double images of severity 0.4 or more | 5 (worst 0.414) | 1 (worst 0.414) | 4 (worst 0.414) |
| mid-move dashes of 40 px or more | 2 (worst 44) | 4 (worst 116.2) | 2 (worst 46.8) |
| fps, frame p99, frames over 34 ms | 47, 162 ms, 6.6% | 59.3, 33.6 ms, 1.0% | **55.9, 56.2 ms, 2.4%** |
| console errors, 404s | 0, 0 | 0, 0 | 0, 0 |

The live r54 build reads as the candidate did, as the focused review expected (FOC54-001 and FOC54-002 "live too"): the head jump, the worst jerk and the single feet excess are the same figures, and the worst swaps are the same aeon KO swaps (Shiva, Valefor, Ixion, Ifrit). The jerk count (28, 0.95 per minute) sits between the candidate's 31 (0.99) and r53 live's 37 (1.37); 25 of the 28 fell on steady frames, so the clock is not what makes them, and the count moves with what the fight does (284 turns in r53's win, 370 here and in the candidate's run): I read the three as one condition. **Frame p99 56.2 ms at 55.9 fps** (2.4 percent of 99,404 frames over 34 ms, the longest 332.5 ms): the machine was busy (see Mode), so the clock multiplied some moves; the candidate's run read 162 ms and r53's live run 33.6 ms. The outcome is the harness's, not the game's: the harness cannot read the advisor's "Doublecast: A + B" label (FOC54-007), so Lulu's turns fall back to Attack and the fight is lost after 370 turns with 0 seams, as on the candidate. The strips of the worst swaps are in `continuity/braskas-final-aeon-win-live-r54/continuity/strips/`.

## Observations (no new issue)

- **LV54-1, CHK-026 and CHK-027 on Chapter III, live.** Read above: FAIL and FAIL, the disclosed FOC54-001 and FOC54-002, unchanged from the candidate and from r53 live. The head jumps of 16 to 24 percent are Valefor's, Ifrit's and Bahamut's hurt-to-KO swaps; the jerks of 87 to 160 px are Valefor's, Ixion's, Ifrit's and Shiva's KO swaps. Both games' continuity checks are shared plumbing; this chapter is FFX only (the aeons are FFX's).
- **LV54-2, the harness cannot play the two-pick Doublecast (FOC54-007).** Chapter III is a defeat for the harness (370 turns), so no win-state evidence comes from the harness on the live artifact; the intended-line auto run (used by Yu Yevon's route above) still wins through the engine.
- **LV54-3, FOC54-004 live.** Lulu's hint line "His aeon is ready. Guard first." plays over Yuna's first Chapter XIV menu, which has no Defend. Polish.
- **LV54-4, FOC54-005 live.** Yu Yevon's plate: "HP 99999 / 99999" without digit grouping, HP only (the Sensor event carries MP 1 in the focused review; the plate shows none), and a bracket line crosses the plate's element row. Polish.
- **LV54-5, the Sensor chip with Kimahri on the field.** His weapon carries `sensor`, so once he is in, the chips read HP of every target at once. The focused review's pagoda log read "HP ? ? ?" at the Scan target; I did not reproduce it in the real flow or in the debug-goto flow. With Lulu (no Sensor) the chips read "HP ? ? ? Sensor reads HP and weaknesses" as expected. Not a defect as far as the changelog states; recorded because the two readings differ.
- **LV54-6, the held start card on a cold live load of FFX-2 Chapter IV.** 0.99 s on a desktop load and 7.27 s on a phone load (r53: 3.87, 6.18 and 4.53 s on desktop, 3.87 s on the phone). This is r53's disclosed cost; r54's diff contains no start-card, stage or pose file, so it is not r54's. The phone sample is longer than r53's one, on a busy machine.
- **LV54-7, the phone's last commit and the helper.** My first phone Doublecast runs (kept in `run/superseded/`) reported failures that were my harness's: the confirm helper judged "unchanged" from the crumb alone and pressed an extra Enter, which moved the run on one step; the final runs judge by the help line, the battle log and the menu state, and every phone step went through by tap.
- 144 `net::ERR_ABORTED` prefetch cancellations across the contexts (no status, no console error).

## Superseded runs (kept, with why)

- `dc-dead-1600x900` (first): FAIL on "header ... MP-left line": the dead end has no "MP left" line by design ("No second spell fits. Esc goes back."); the assertion was mine. The final run asserts the dead-end text.
- `dc-{edit,natural,dead}-390x844` (first): the extra-Enter helper error (LV54-7), which read list 2 where target 1 belonged. `dc-{edit,natural}-390x844-v2`: passed 14 of 14 but the final commit read "tap-then-key" because the helper judged only the help line; replaced by runs whose helper also reads the battle log and the menu state, every step by tap (14 of 14).
- `dc-{edit,natural}-1600x900-prepatch`: desktop runs of the same script before the phone helper changed; re-run with the final script, same results.
- `scan-pagoda-1600x900` (first): FAIL on an assertion that the Pagoda chip reads "HP ? ? ?" before any Scan; with Kimahri's Sensor weapon on the field it reads HP (LV54-5); the assertion was removed and replaced by a recording.
- `scan-yevon-390x844` (first): `battleState()` returned null for one poll between phases; the helper is null-safe now; re-run passed.
- `isaaru-next-first`: stopped at Valefor's menu because the run never confirmed the aeon's target; re-run reached the later Yuna menus.

## Not tested

A full Chapter III fight to a win by real keys on the live artifact (the harness loses it on FOC54-007; the intended-line autopilot route was used for Yu Yevon and the live r53 win is the focused review's); Sensor on Yu Yevon in Chapter 28 (the word "summon" and its eight offerings; the focused review did it); Slow on Seymour Flux and Doom on Evrae (FOC54-003 and the Doom cast were the focused review's; not re-cast live); Shell, Protect, Reflect and Nuls on a Pagoda; Zanmato's counter; the other Isaaru duel after Grothia (the later menus up to Ixion's were seen); the gamepad; a dead end reached naturally with One MP Cost removed in a shipped chapter (only with the state edit); any FFX-2 chapter beyond Chapter IV and any chapter other than III, XIV, IV and I; sizes other than 1600x900 and 390x844; the full CHK-024 upgrade matrix (a reload per run only); a quiet machine (the harness numbers are from a busy one); listening to any audio; a real phone, Safari.
