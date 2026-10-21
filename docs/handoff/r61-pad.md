# r61-pad: the conference demo on a gamepad, at 1440p

Branch `r61-pad` (worktree `D:/pyrefly-rig-valefor`), from `origin/r61-repro` 07ccc0029 (live r60 plus the build-parity fix). **Both games** (input and hint plumbing); the one
per-game decision is the FFX enemy-move slab's pad button (below). No deploy, no review: this is a branch for the integrator.

Bailey, 2026-10-21 ~00:30 EDT, decision 169: visitors play with "A gamepad (Recommended)" ("I make sure every demo screen works fully on a pad, with pad button hints"), on
"A 1440p monitor", with "Headphones for the player"; the conference is Monday 2026-10-26.

## What was wrong (the audit; scratch: `D:/Tools/pyrefly-scratch/2026-10-21/r61-pad/`: tools, command files, `runs/*.json`, `shots/`, `progress.md`)

A simulated gamepad (`navigator.getGamepads` stubbed in an init script; node sets buttons and axes; headless GPU Chromium at 2560x1440, the dev server with `?demo=1`) played the demo
path with the pad and nothing else, the game's own `intended` strategy telling the bot WHAT to do at each open menu and the pad doing it (d-pad to the row, A, B, the target cursor).
The actions were almost all reachable already (`Input`'s A / B / Y / LB / RB / Start / d-pad / left stick, the HUD's `RawInputWatcher`, the guide's X, the advisor's RT, the slab's pad
button). What was wrong:

1. **Every hint named the wrong thing.** The build said `Cross`, `Circle`, `L1`, `R2` in plain words (PlayStation names on what is, at the booth, an Xbox pad), or only the key (`G`, `E`, `Esc`,
   `Enter`, `I`, `H`), and the HUD chips said the pad's words whenever a pad was merely PLUGGED IN, not when it was the thing the player had just pressed.
2. **The FFX enemy-move slab's pad button was Back / Select.** The booth resets the demo with Back + Start held (r61-flow); a Back press must not also flip a persisted setting.
3. **Three actions had no pad route:** the FFX enemy plate's fold (`I`), and (by hint only) the title's CHANGELOG / BRIEFING (no pad button, no need).
4. **The stick**: a per-axis 0.45 dead zone with no hysteresis (a diagonal counted as two directions; a thumb on the edge flickered), and two different repeat tables.
5. **1440p**: the cutscene and results hint strip was a flat 12px.

## What was built

- `src/app/padMap.ts` (pure): the standard-mapping numbers, `stickDirection` (engage 0.5, release 0.3, the longer axis wins with a 1.3 bias), repeat 350 / 115 ms, `padFamilyOf(Gamepad.id)`,
  the labels per family. `Input` and `RawInputWatcher` both read it.
- `src/app/inputDevice.ts`: `html[data-input]` (`keyboard` / `gamepad` / `pointer`) and `html[data-pad]` (`xbox` / `playstation` / `nintendo`), written by `Input` on any trusted key, any
  pad control (X and the triggers included) and a pointerdown. `?demo=1` starts on the pad's words (the browser hides a pad until a button is pressed). See `docs/CONTRACT-CHANGES.md`.
- `src/ui/common/padGlyphs.ts` + `pad-glyphs.css`: the buttons drawn (discs for A B X Y in the pad's own colours, plates for LB RB LT RT, the d-pad, Menu / View, the sticks) as `<kbd class="pg">`
  with the three families' labels in `data-x` / `data-p` / `data-n`; `keyHint(key, pad)` writes a chip once with both halves and the stylesheet shows the one in use (no widget re-renders).
- Converted to it: the title (Press chip, hint row; entries with no pad button are hidden for a pad), party prep (strip and panel hint), the briefing and first-run cards, the guide / advisor /
  enemy-move chips and the slab's MORE chip, the sensor plate, the Defend tab, Bushido's chips, Swordplay / Trigger Happy / Lady Luck words (`PRESS A`, `MASH RB`), FFX-2's target legend, the
  sphere grid's strip and help keys, the pause legend (CSS only, so the credits / eye-candy / presentation pages follow), a CONTROLS tab with the pad's names and an "In a fight" column,
  and `ControlsHint` (cutscene, board, pilgrimage).
- **Pad map in a fight:** A confirm, B back, Y Defend (FFX; the enemy-move slab in FFX-2), X the strategy guide, RT the best-move card, **R3 the enemy-move slab in FFX**, LT held = the slab's
  MORE (both), **L3 folds the enemy plate (FFX)**, LB / RB the party swap (FFX), Start the pause (LB / RB tabs, Y the painting alone, B closes), right stick scrolls the guide. **Back is free.**


## The audit table

"Before" is read from the code at `origin/r61-repro` (the same simulated-pad run was not repeated on that tree: the disk and the lock allowed one tree). "After" is measured on this branch, 2560x1440, `?demo=1`, the dev server, the pad and nothing else. FPS is the page's own `requestAnimationFrame` cadence on the RTX 5070 Ti: **60.0 fps, median 16.7 ms, 99th percentile 16.8 ms, worst frame 16.8 ms** at the title, the board and the first command menu of both chapters (the frame-time governor on, no `?crisp=` pin; `runs/c20-path.out.json`).

| Screen | Action | Pad works (before -> after) | Hint shown (before -> after) | 1440p |
|---|---|---|---|---|
| Title | begin (A or Start); stick drifts the painting | yes -> yes | "Press Enter" and a key-only row -> "Press (A)", d-pad MOVE, (A) CONFIRM, (B) CANCEL; CHANGELOG / BRIEFING have no pad button and are hidden for a pad | ok, 60 fps, text >= 14px |
| Auron's briefing | A or B skips | yes -> yes | "Enter / Esc" -> (A) | ok |
| Board (chapter select) | d-pad and stick choose (left / right) and change game (up / down); A begins; B back | yes -> yes. Stick (measured): rest 0 moves, a flick 1, a diagonal 1 (no game change), edge jitter 1, held 1 s = 7 (one, then a step every 115 ms) | "Cross begin" words, one cross for two jobs -> (A) BEGIN (B) BACK, left / right "choose" and up / down "game" drawn apart | ok |
| Party prep | d-pad up / down member, left / right tabs; A or Start begins; B back; LB / RB page the CHAPTER column; Sphere Grid: Y walks, d-pad steps, A acts, X help, LB / RB zoom | yes -> yes | ENTER / ESC text -> (A) / (B); the sphere grid's strip reads "LB RB ZOOM, Y WALKS, X HELP" for a pad (canvas text) | ok; the sphere grid strip is canvas text and small |
| Story scene | A advances, hold A skips, B menu | yes -> yes (passed by hold A on both chapters) | a 12px strip of "Cross", "Hold Cross" -> (A) ADVANCE, HOLD (A) SKIP, (B) MENU at 20px | ok (the strip grows with the window) |
| Battle, command menu (FFX and FFX-2) | d-pad / stick to a row, A, B; the groups Special / White Magic / Items / Overdrive / Change / Switch open and B closes them; a 27-row list scrolls by d-pad | yes -> yes (every group of both menus opened and closed by pad; the 27-row Items list walked) | none on the rows | ok |
| Target selection | single: A on a foe, left / right steps, B back to the menu, A confirms and a hit lands; all: Mega-Potion rings all three allies, B cancels | yes -> yes | FFX-2 legend ENTER / ESC text -> (A) CONFIRM, d-pad CHANGE TARGET, (B) BACK | ok |
| Defend | FFX: Y at the top menu (the original's Triangle); FFX-2: a row | yes -> yes | "Q triangle DEFEND" -> a Y disc beside DEFEND (a PlayStation pad draws the triangle) | ok |
| Party swap (FFX) | LB or RB opens the reserve list, B closes | yes -> yes | none | ok |
| Optional panels | X guide (the right stick scrolls it), RT best move, enemy move (FFX **R3**, was Back; FFX-2 Y), LT held = the slab's MORE, FFX enemy plate fold **L3** (new; it had only `I`) | mostly -> all; Back flips nothing now | words / keys only -> (X) GUIDE, (RT) BEST MOVE, (RS) ENEMY MOVE, (LT) HOLD +n MORE, (LS) on the plate | ok |
| Overdrive | the Overdrive row (a single item goes straight to the aim; Tidus's list holds one, Kimahri's two; an aeon has one row); Tidus's Swordplay answered with A | yes -> yes | "PRESS CROSS IN THE GOLD ZONE" -> "PRESS A IN THE GOLD ZONE"; Bushido's chips draw A / B / X / Y (unit tests) | ok |
| Mega Flare moments | FFX: Bahamut summoned by pad, then his Overdrive row; FFX-2: the countdown banner "BAHAMUT 5, 4, 3, 2" and the slab's Mega Flare card | -> played by pad to the win | the slab's "LT HOLD +1 MORE" drawn | ok |
| Pause | Start opens over a live menu; LB / RB walk the 9 tabs; d-pad down enters, left / right adjust (SOUND EFFECTS 70 -> 60 checked), Y the painting alone, B or Start closes (the battle menu is still waiting) | yes -> yes | the Q / E bumpers and the Esc / H legend -> LB / RB, (B) RESUME, (Y) PAINTING ONLY; the CONTROLS tab lists the pad's names and an "In a fight" column | ok (the type is at its 17px cap: the smallest text of the demo, unchanged) |
| Results | A continues; the defeat page's two slabs move with the d-pad and act with A | yes -> yes | a bare "CONFIRM" -> (A) CONFIRM | ok |
| Whole run | both demo chapters won with the pad and nothing else, the game's `intended` line as the oracle: Chapter I (FFX) 51 turns, 0 unreachable, results at 11:29; Chapter IV (FFX-2) 41 turns, 0 unreachable, back to the board 4.7 s after A | | | |
| PlayStation and Switch pads | the same standard indices read the same eleven buttons (a unit test per family); in the browser a DualSense-named pad shows the cross, circle, square, triangle, L2, R2, L3, R3 and a Pro-Controller-named one B, A, Y, X, ZR; the keyboard flips the chips back on the next key, a pad press flips them forward | -> same | | |

## Audio at the defaults, for headphones

Fresh-profile defaults: master 0.8, music 0.7, effects 0.70, voice 0.9 (voice-over on). Measured with analysers on the mixer's own nodes through the pre-battle story scene and 90 s of Chapter I (`runs/a01-audio.out.json`): the master (before its limiter) peaks at **-5.2 dBFS** in the scene and **-9.5 dBFS** in the fight, never near full scale; a voiced line sits **+7.7 dB** over the music beneath it (voice about -22.7 dBFS RMS, the ducked music -30.4). **No default changed.** The mix is quiet at the master (about -25 dBFS RMS): a booth sets the headphone amp, not this game.

## Checks

`tsc --noEmit -p .` clean (the only errors in this sparse tree are the tests that import `docs/concepts`, as on the base); the three goldens pass (FFX engine 18, FFX-2 ATB 6, FF7 3); new unit tests: `pad-map` (stick timelines, families), `pad-glyphs` (the store, the glyphs, three pad families read the same buttons), `pad-hints-markup`, `pause-controls-pad`, `ffx-sensor-pad-toggle`; updated: the chip, minigame-wording, Defend-tab, title and Trigger Happy tests; the related suites pass (a few pattern-wide tests such as `ui-pause-stack` need `--testTimeout=170000` on this loaded disk, as before).

## Open items (need Bailey's hands, or a decision)

- **A real pad.** Everything above is a simulated pad on the standard mapping. Not judged: how the stick and d-pad FEEL, the analog trigger thresholds (RT / LT use the browser's `pressed`), a pad outside the standard mapping (an old generic one on Firefox), and the "no input yet" first impression (Chrome hides a pad until a button is pressed; `?demo=1` shows the pad's words meanwhile).
- **r61-ux: TITLE ART (T) and the OPTIONS rows (VISUAL STYLE) are not on this base.** `titleInfoHtml.entryHtml(action, key, label, pad?)` takes the pad button now: give TITLE ART `'Triangle'` (Y) and handle `input.justPressed('triangle')` in `TitleScreen.handleInput` (`cycleArt`) after the merge, else a pad player cannot reach it (it is hidden for a pad until then). The pause OPTIONS rows already move and adjust by pad, so VISUAL STYLE will.
- **r61-flow's reset (Back + Start):** nothing in a fight, the title, the scene, the results or the pause reads Back now. Two places still do: the Sphere Grid tab's AUTO-LEARN (prep) and the FF7 door's pad word. A note is in `D:/Tools/pyrefly-scratch/2026-10-21/r61-flow/NOTE-from-r61-pad.md`.
- **First-use cards (this base only; the booth build has none)** say "Click its picture" and the like, and take the first A at a menu. Not changed.
- **1440p:** the pause menu's type stops growing at 17px (its clamps cap; 14px at 1600x900), so at 2560x1440 it is the smallest text of the demo (above the 14px floor, readable, unchanged); the Sphere Grid's hint strip is drawn on a canvas at a small size. Nothing overflows the window on any demo screen (a scan of every text node on each screen found none outside it except the strategy guide's scrolled rows).
- **The Defend tab's glyph lags one menu key** when the last key was one the menu does not read (G, N, J): the page-wide chips flip at once, the tab on the next menu key.
- **Not run in a browser:** Bushido (Auron), Trigger Happy (FFX-2 Gunner) and Lady Luck (FFX-2 Gambler) prompts, and FFX-2's Change dressphere WITH a turn spent (the Change list opened and closed by pad; the fights used the oracle's picks). Their words and chips are pinned by unit tests.
- **FFX-2's enemy slab stays on Y** (FFX moved to R3 because Back was taken); one button for both games (R3) is a one-line change if Bailey prefers it.
