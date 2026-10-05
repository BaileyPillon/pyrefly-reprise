Build under test: branch `r39-uifix` at 67a7ced8 (origin/r39-uifix, base c3c4daba), run from its own worktree on a dev server (no production build). The runs marked "post-fix" are the same branch plus the Shift fix, commit e23d282c.
Live reference: https://echoesofspira.com, release 38, bundle `index-X5kGUd9G.js`. Its `src/` equals the branch base except the old address's moved-note code on the title (`git diff 8136f2ed c3c4daba -- src`), so a live run is a true "before".
Review: independent check of a branch by a sub-agent that did not build it (not a rubric review: no score, no milestone claim, no deploy).
Result: PASS on every item of the brief (nine rows below). One defect, the stray Shift tap, was found by the builder (left open in its handoff) and is fixed here. One major finding lives in the guide text, not in the branch's code (section 6).
Ship read-off (RUBRIC section 3): no critical defect introduced or left reachable by the branch's code, no regression against live found. The guide-text finding is tagged introducedByCandidate true (Defend now makes it actionable) and regressionVsLive false; the driver decides whether it holds release 39. Fixing the two strings in the same release is recommended.

## Method, hooks, servers

- Headless Chromium from node via Playwright (`PYREFLY_BROWSER=gpu`, never the Claude-in-Chrome tools or the browser pane), the critic's `openRoute` and `makeInput` as the facade only: real keys, real mouse, real touch events (390x844, `hasTouch` + `isMobile`), a virtual standard-mapping pad (`window.__routePad`: 0 Cross, 1 Circle, 2 Square, 3 Triangle, 8 Select, d-pad 12 to 15). At most two browsers at once. Every assertion is made in my own scripts (`D:/Tools/pyrefly-scratch/2026-10-04/r39-uifix-check/`: `defend.mjs`, `od.mjs`, `cells.mjs`, `slab.mjs`, `firstrun.mjs`, `tabsweep.mjs`).
- Hooks, all labelled in every result file: `__pyrefly.setSeed(1)` before the first input; `__pyrefly.gotoChapter(id, {skipCutscenes, skipPrep, seed})` to start a chapter's first battle for the chapter-level probes (the Defend tab sweep, the advisor cells, the slab, Bushido and Swordplay); `battleState()` to set Tidus's and Auron's Overdrive gauge to 100 for the two overlays. The Defend runs of section 2 and the first-run walks of section 5 start from the title with real keys, touch or pad (only `setSeed(1)` before the first key). Everything inside a fight is real input.
- Servers: one Vite dev server of the worktree on 127.0.0.1:7230 (HMR and file watcher off, private dependency cache), started twice (PID 89128 for the candidate, PID 80056 after the fix); both stopped by PID, port 7230 confirmed closed. Nothing was killed by name; no process of mine is left. Nothing was deleted. Two scratch files of mine were moved out of the worktree to `F:/pyrefly-parked/2026-10-04/r39-uifix-check/`: the dev-server config `.r39check-vite-tmp.config.mjs` and `zz-tmp-r39check-ta.test.ts` (the engine run of section 7, never committed). No ACTIONS.md or DECISIONS.md row was added; the driver records.

## 1. Verdict by item

| Item | Verdict | The numbers that decide it (live release 38 -> branch) |
|---|---|---|
| PR-0360 Bushido and Swordplay answer taps and clicks (FFX only) | PASS | Shooting Star, touch 390x844, 7 taps: success false / 0 inputs / 0 ms -> success true / 7 of 7 / 2,597.8 ms left. Mouse 1600x900, 7 clicks: false / 0 / 0 -> true / 7 / 2,725.6 ms. Spiral Cut, tap in the gold zone: fail at the timer (0 ms) -> success, 1,442.7 ms and 393.5 ms (two runs); click: fail -> success, 415.3 ms; Enter: success on the second press (a miss only restarts the sweep), 2,076.8 ms; pad Cross: success, 383.4 ms |
| PR-0361 chips name the control per device (FFX only) | PASS | keyboard: `Q-triangle  Esc-circle  K-square  Esc-circle  left  right  Enter-cross`, typing exactly the printed names completes it (7 of 7, 3,179.8 ms); mouse: same chips, words CLICK THE SEQUENCE; touch: symbols only, 66x50 px each, TAP THE SEQUENCE; pad: symbols only, 7 of 7 in 1,533.4 ms. Live printed bare glyphs on every device and the words "ENTER THE SEQUENCE" even on a phone (my keyboard run on live: "no key for printed label"). Dragon Fang names F and R for L1 and R1 |
| PR-0362 the press that dismisses the last coach card does nothing else (FFX only) | PASS | Fresh profile, Chapter I, ONE Enter or ONE pad Cross on the third card: card gone, targets 0, selecting false (live: card gone AND 2 targets, selecting true). The next press: 2 targets, selecting true; the third picks, and Tidus's Attack resolves. A tap on ATTACK still answers on the first tap on both builds (2 targets) |
| PR-0330 the advisor card in the narrow boxes (both games, shared ladder) | PASS, with limits that the handoff already discloses | section 4 |
| FFX Defend: a tab, Triangle / Q / click / tap (FFX only) | PASS | section 2 |
| The FFX enemy-move slab's pad button Triangle -> Select; FFX-2 keeps Triangle | PASS | section 3 |
| The critic harness typer fix (`ac941c78`, shared critic tooling) | PASS | the critic's own `playMinigame` on a keyboard context, Chapter XVII Dragon Fang: chips `down left up right FL1 RR1 Esc-circle Enter-cross`, `data-btn` = down left up right l1 r1 cancel confirm, keys typed `ArrowDown ArrowLeft ArrowUp ArrowRight f r x Enter`, no unknown glyph, engine success true, 8 of 8, 2,605.8 ms left; `critic-route-harness.test.ts` passes in the suite |
| No regression in the first-run guide | PASS | section 5 |
| Gates: tsc, full suite, orphans | PASS (one timeout under load, explained) | `tsc --noEmit` (TypeScript 7.0.2) exit 0 on 67a7ced8 and on the final tree; `node tools/orphans.mjs`: 1,222 modules, 24 orphaned (the baseline, none new: `defendControl.ts` and `overlayInput.ts` are imported); full suite on the final tree: 810 files: 804 passed, 1 failed, 5 skipped; 11,919 tests passed, 1 failed, 46 skipped, 1 todo (1,236 s on a box at 99 % CPU; the builder's run took 732 s and had 0 failed). The one failure is `tests/unit/strategy-ffx2-bahamut.test.ts`, "heal-only route clears Mega Flare": "Test timed out in 15000ms" (a 30-seed FFX-2 engine simulation; it takes 19 to 23 s on this box, alone or in the suite, and the file passes 19 of 19 with `--testTimeout=90000`). It imports nothing the branch changed (`git diff c3c4daba..HEAD -- src/battle src/engine src/data` is empty), so I read it as load, not as a regression |

## 2. FFX Defend (item b)

Real input at the first command menu of Chapter I (`seymour-flux`, seed 1, fresh profile, `?coach=off`, from the title by real keys), candidate and again post-fix:

| Input | The tab read | The engine did |
|---|---|---|
| key `Q`, 1600x900 | `Q-triangle DEFEND`, 157x29 px | `action-start Defend (tidus)`, `status-add defend` on Tidus, then `turn-start` for seymour-flux, mortiorchis, kimahri; the next menu is `command:kimahri` and the tab is up again |
| click on the tab, 1600x900 | same | the same events, the same next menu |
| tap on the tab, 390x844 touch | `DEFEND`, 104x40 px | the same events, the same next menu |
| pad Triangle (button 3), 1600x900 | `triangle DEFEND`, 137x29 px | the same events, the same next menu; the slab did not move |
| key `Q` at 2000x1012 | `Q-triangle DEFEND`, 176x32 px | the same events, the same next menu |

The tab never covers anything. At each of 1600x900 (tab at 72.5,853.1), 2000x1012 (182,959.2) and 390x844 (8,798) it is inside the viewport (bottom 881.8 of 900, 991.6 of 1012, 838 of 844), `elementFromPoint` returns the tab at five points of it, it overlaps no visible HUD element that has content (the only hit on the phone is its own parent `phud-panel`), and it overlaps no combatant's painted rectangle (`__pyrefly.targeting().rects`). The same sweep at the first menu of every FFX chapter (I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII) at both desktop sizes, and of I, VII, XII, XVII and VIII on the phone: the same positions, zero overlaps, zero fighters. In all seven FFX-2 chapters (IV, V, VI, XI, XIII, XV, XVI) there is no tab. On live: no tab, six rows with no Defend, and Q or Shift opens the party swap (Auron, Wakka, Lulu, Rikku): Defend was unreachable.

## 3. The enemy-move slab (item c), pad on the virtual standard pad

| Build, chapter | Select (button 8) | Triangle (button 3) | Chip |
|---|---|---|---|
| branch FFX, Chapter I | opens the slab, the menu stays open (six rows); again: closes | Defend (`tidus:defend`), the slab unchanged | "Select enemy move" / "Select hide" |
| branch FFX-2, Chapter IV | nothing | folds and unfolds the slab; no action spent | "Triangle hide" / "Triangle enemy move" |
| live FFX, Chapter I | nothing | opens the slab AND the party swap list (Auron, Wakka, Lulu, Rikku) | "Triangle enemy move" |

The key E toggles the slab on both games, unchanged.

## 4. PR-0330 (item d): the first menu, seed 1, the card's own text, box and cap, 1600x900 and 2000x1012

`textPastBottom` (a text line below the card's bottom edge) is 0 in all 20 cells, and in no cell does the card's rectangle overlap a combatant's rectangle.

| Chapter, size | Live (release 38) | Branch |
|---|---|---|
| VII, 1600x900 | 56 chars, no cost, no effect | 237 chars, cost "no MP", effect, reason |
| VII, 2000x1012 | 252 chars, cost, effect, reason | identical |
| IX, 1600x900 | 69 chars, no cost, no effect | 102 chars, cost, effect |
| IX, 2000x1012 | 69 chars | 102 chars, cost, effect |
| XII, 1600x900 | 54 chars, no cost | 141 chars, cost, the runner-up's reason; the lead's effect is not printed (limit) |
| XII, 2000x1012 | 150 chars, no cost | 197 chars, cost and effect |
| XVII, 1600x900 and 2000x1012 | 24 chars, box 36/42 grid px against a 37 cap (the cost row under the fade) | 30 chars, 29/29, cost "no MP" |
| XVIII, 1600x900 and 2000x1012 | 40 chars, 36/42 against 37 | 46 chars, 29/29, cost "30 MP" |

Shared ladder, FFX-2: the seven FFX-2 chapters (IV, V, VI, XI, XIII, XV, XVI) at 1600x900 print byte-identical card text on live and on the branch (106, 162, 166, 136, 135, 141, 94 characters) at the same width to within 2.5 px (552.7, 444.6, 469.1 px identical; Bahamut's 492.7 against 490.2). Phone (390x844, Chapters I, VII, XII, XVII): the one-line tip is identical on both builds ("Hastega -> the party White Magic", "Steal -> Guado Guardian A Special", "Wakka Switch", "Close in Orders").

Limits, as the handoff discloses and my numbers confirm: Chapter XII at 1600x900 keeps the cost but not the lead's effect (the 85x98 box); the two Sin strips carry name, path and cost only. Neither is a regression.

## 5. First-run guide (item e): a fresh profile from the title to Tidus's first Attack

Keys, touch (390x844) and pad, each on the branch and on live. Steps 1 to 3 read the same on both builds: the briefing, the board card "AURON 1 OF 3 - Start with the first one." (touch wording "Tap its picture to begin..."), the party-prep card "2 OF 3 - Your party is ready.", the third card "3 OF 3 ... Pick ATTACK, then pick who it hits." (touch: "Tap ATTACK, then tap who it hits."); `seenCoach` ends with `firstrun-board`, `firstrun-prep`, `ffx-turn-order`, `firstrun-battle`; no guide element is left on screen; Tidus's first action is Attack. The only difference is the intended one (item PR-0362). Auron's next coach line ("You have taken enough. Spend it - an Overdrive never misses.") arrives on both builds (live: on screen in the snapshot taken 13 s after the first command; branch plus fix: 8.25 s after it). The touch walk needs 43 taps on the dialogue window to get through the opening scene without the skip hook.

## 6. Defects and findings

| ID | Severity | What | introducedByCandidate | regressionVsLive |
|---|---|---|---|---|
| R39C-01 | major | The Chapter I guide says "Get Shell up, or Defend" and "Shell or Defend now" against Total Annihilation. Total Annihilation is magic and Defend halves physical damage only (engine run: 3,855 plain, 3,855 Defend, 1,925 Shell at Magic Defense 20), and both sources the guide follows pair the two (Shell first, then Defend), never as alternatives. Defend is now pressable, so a first-timer who picks the "or" Defend takes the blast unreduced and the party is wiped. Exact strings and the recommended replacements: section 7. Not edited, as briefed | true (the text is byte-identical on live; the candidate makes its wrong half executable) | false (on live the same text could only be followed through Shell, because Defend did not exist) |
| R39C-02 | minor | A stray Shift tap at the FFX command menu spent the turn (`rawInput.KEY_MAP` reads Shift as Triangle; the tab names Q only). Found by the builder, left open for Bailey | true | true in effect (on live Shift opened the party swap) |
| R39C-02 status | fixed | Commit e23d282c on r39-uifix: section 8. Re-run with real input post-fix: Shift spends no turn | | |
| R39C-03 | polish | `src/ui/coach/CoachMark.ts` went from 392 to 415 lines, over the 400-line house rule (AGENTS.md rule 7; the O2 plan said it would stay under). The other touched files were already over 400 | true | false |
| R39C-04 | polish, suspected, not run on another layout | The tab and the Bushido chips print `Q`, `K`, `F`, `R` from `KeyboardEvent.code` (QWERTY positions). On an AZERTY layout the key labelled Q has the code `KeyA` (the cursor-left key) and the Defend key is the one labelled A. The same code-based reading is how every key of the game works; only the printed names are new | true (new labels) | false |
| R39C-05 | minor, carried | On a pad, Square (button 2) is also the strategy guide's toggle, so Shooting Star's Square chip on a pad also opens the guide. The builder reports it; I did not re-test it, and it dates from release 38's Square chip | false | false |

Not defects: the PR-0362 reversal of the O2 "first press acts" acceptance for the keyboard and the pad (flagged for Bailey by the builder, one commit `74ad8a30` to revert); the XII and Sin-strip limits; Square/K naming.
Out of scope, noticed: `research/ffx-combat-core.md` section 0 (V14 to V16) gives the HD Bushido orders as Dragon Fang `... L1 R1 cross circle`, Shooting Star `triangle cross square circle left right circle`; the build ships `... L1 R1 circle cross` and `triangle circle square circle left right cross`. The handoff already says the order is our estimate pending Bailey's Steam check.

## 7. The Chapter I guide text (job 3)

Where it lives: `src/data/guides/seymour-flux.ts`, the WATCH rail, lines 120 and 126, byte-identical on the branch base c3c4daba, on `main` and on `r381-guide` (daf140b6 changes nothing there). `r381-guide` adds a reading-view page, `src/data/guides/docs/seymour-flux.ts`, whose line 67 says "Defend as the attack hits to cut the damage even further." (after line 65's Shell / Mighty Guard / Mighty G sentence).

What the sources say:
- `research/ffx-combat-core.md` section 2.4 rows 5 and 6 and the section 4.2 status table (`src/data/ffx/statuses/core.ts` cites section 4.2 as `[verified: 2 sources]`; the Defend input note adds SinirothX's Stat Mechanics FAQ, read 2026-10-04: "Cuts physical damage by 1/2"): Defend halves **physical** damage, Shell halves **magical** damage. The engine matches (`formulas.ts`: Defend sits in the physical-only block).
- `research/ffx-seymour-flux.md` section 5.2: Total Annihilation is Magic, base 44, 5 hits, party-wide, 3,300 to 4,145 per member unmitigated; "Halve if Shell is up ... This is why Shell / Mighty Guard / a Mighty Mix is the canonical answer." Defend does not appear in the damage model.
- `research/ffx-seymour-flux.md` section 6 row 13 (wiki, `[verified: 2 sources]`): "Shell (or Kimahri's Mighty Guard, or a Rikku Mighty Mix) **+** Defend before Total Annihilation": a strategy line, with Defend as an addition to Shell.
- Jegged's FFX guide (`research/jegged-encounter-guides-ffx-a.md`, Chapter 1, read 2026-10-03): Shell on the party, or Kimahri's Mighty Guard, or a Rikku Mighty G Mix, **then** Defend as the hit lands. A sequence, not an alternative.
- Engine run, 2026-10-04 (real `computeDamage`, the real `totalAnnihilation` and `crossCleave` records, Seymour Magic 15 / Strength 30, target Defense and Magic Defense 20): Total Annihilation per hit x 5: plain 771 x 5 = 3,855; Defend 3,855; Shell 1,925; Protect 3,855; Defend + Shell 1,925. Cross Cleave (physical): plain 2,453; Defend 1,226; Protect 1,226; Shell 2,453. So in this build Defend never touches Total Annihilation.

So the "or" is wrong against every source (they all pair Shell with Defend), and "Defend" is wrong against the engine and the combat-core. The sources disagree among themselves about whether the real game's Defend also blunts magic (Jegged and the wiki recommend it after Shell; the combat-core and the FAQ say physical only); that is a Steam-copy question for Bailey, and it would change the engine, not just the text.

Current strings (exact):
- line 120, `name: 'Auto-Attack Mode'`: `Get Shell up, or Defend — it is ~3,300-4,145 of magic across the party and Shell halves it`
- line 126, `name: 'Ready To Annihilate'`: `Shell or Defend now, and top up anyone who would not survive ~4,300 — a summon stalls the ladder outright`
- r381-guide only, `docs/seymour-flux.ts` line 67: `Defend as the attack hits to cut the damage even further.`

Recommended (true of the engine as built; Jegged's "then Defend" is a labelled adaptation):
- line 120: `Get Shell up, or Kimahri's Mighty Guard — it is ~3,300-4,145 of magic across the party and Shell halves it` (cite `ffx-seymour-flux §5.2, §6 row 13`, add `ffx-combat-core §2.4`)
- line 126: `Shell now (Defend only halves physical hits, so it will not cut this), and top up anyone who would not survive ~4,300 — a summon stalls the ladder outright` (cite `ffx-seymour-flux §4.4.2, §5.2`, add `ffx-combat-core §2.4`)
- r381-guide line 67: replace with `Defend will not help against this one: it only halves physical hits, and Total Annihilation is magic. Shell is what halves it.`
- research: add to the Chapter 1 "Our adaptation of Jegged" list in `jegged-encounter-guides-ffx-a.md`: "Defend. Jegged: Shell or Mighty Guard, then Defend as the hit lands. Ours: Defend halves physical damage only (combat-core section 2.4; engine run 2026-10-04: Total Annihilation 3,855 plain, 3,855 Defend, 1,925 Shell), so the guide names Shell and Mighty Guard only. Open for Bailey: whether the real game's Defend also halves magic (Steam copy); if it does, the engine and Jegged's line stand and these strings go back to 'Shell first, then Defend as it lands'."
The "~4,300" in line 126 is the unshelled figure; with Shell up the blast is about 1,900 to 2,000 (section 5.2). Left as is.

## 8. The Shift fix (job 2, FFX only; commit e23d282c)

What Shift does today, found first (grep of `src/` for `ShiftLeft`, `ShiftRight`, `'triangle'`, `KEY_MAP`, and every `new RawInputWatcher`):
- `src/app/Input.ts` KEY_MAP: Shift, Tab and Q are `triangle`; consumers: the sphere grid's walk mode (`SphereGridPanel.ts`, `sphereGridHelp.ts`), the demo scene's cast, the pause (a deliberate no-op for Shift, `pause/keys.ts`). Untouched.
- `src/ui/ffx/rawInput.ts` KEY_MAP (the HUD watcher): Shift and Q are `triangle`; consumers: the FFX command menu (Defend, the thing changed), Bushido's Triangle chip, the coach line's "navigated" flag, the briefing (swallows modifiers by design). FFX-2's command menu and Trigger Happy take only the pad through this watcher, and nothing in `src/ui/ffx2/` reads Shift. The slab toggles on E and, on a pad, on button 3 (FFX-2) or 8 (FFX): Shift never toggled it.
- Change: `RawInputWatcher` also passes the key code (`KeyboardEvent.code`; additive third argument, every existing callback ignores it); `defendControl.pressDefends(code)` is true for the pad (no code) and for `KeyQ`; the Triangle branch of `CommandMenu.onTopButton` asks it. KEY_MAP is not touched, so every other thing Shift does is as before.
- Pinned (tests): `ui-ffx-defend-control` (26: "Shift is Defend too" became "Shift is not Defend", plus five pins: the watcher still reads Shift and Q as Triangle and names the key, a pad press carries no key, `pressDefends`, a Shift tap is still a keyboard press so the tab names the keys, a Shift tap still wakes a suspended menu) and `ffx-overlay-input` (36: Shift still presses the Bushido Triangle chip). Mutation check: with the guard removed, 2 of the 26 defend-control cases fail.
- Real input, post-fix (headless Chromium, the same dev setup): Shift at Chapter I's first menu: no event, the same six rows, the tab still up; Q, the pad's Triangle, a click and a tap each Defend (`action-start Defend`, next menu Kimahri); Bushido Shooting Star typed with Shift for the Triangle chip and the printed names for the rest: success, 7 of 7, 3,028.4 ms; the slab on Select (FFX) and on Triangle (FFX-2) as in section 3.

## 9. Frames (`docs/screenshots/r39-uifix-check/`, JPEG)

`r39chk-01-defend-tab-three-sizes` (the tab at 1600x900, 2000x1012, 390x844) - `r39chk-02-bushido-live-vs-branch` - `r39chk-03-swordplay-live-vs-branch` - `r39chk-04-advisor-vii-ix-xii-1600x900` - `r39chk-05-advisor-sin-strips-1600x900` - `r39chk-06-coach-one-enter-live-vs-branch` - `r39chk-07-slab-pad-buttons` - `r39chk-08-first-run-by-keys-and-touch` - `r39chk-09-shift-ignored-q-defends` (post-fix).
Raw probe output (JSON and every frame): `D:/Tools/pyrefly-scratch/2026-10-04/r39-uifix-check/out/`.
