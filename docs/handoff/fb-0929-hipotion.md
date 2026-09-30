# fb-0929 track: "Hi-Potion killed Kimahri" (Chapter I, Seymour Flux)

Branch `fb-0929-hipotion` (worktree `D:/pyrefly-r29-load`, from `origin/main` 1c313c17). Not merged, not pushed, not deployed.

## The report

Bailey, 2026-09-29, passing on a friend's feedback that Bailey agrees with: "Hi potion killed kimahri instead of healing lol during first encounter during encounter with Seymour flux".

## Game case

**FFX only.** Zombie turns healing into damage in FFX (research/ffx-combat-core.md §4.2 and the item table: "HP-restoring items *damage* a Zombie for the same amount; revival items *kill* it", "Hi-Potion on a Zombie therefore deals exactly 1 000 damage"). Seymour Flux's Lance of Atrophy lands Zombie at 100% and Mortiorchis follows with Full-Life, which kills a Zombie (research/ffx-seymour-flux.md §5, §6).

FFX-2 was checked as well. Its sources and its data define no Zombie (`FFX2StatusId` has none, `src/data/ffx2` never mentions it). An FFX-2 item sweep of every FFX-2 chapter (40 seeds each, 6,662 restoratives on allies) found no HP drop and no KO after a restorative. Every change here is in `src/ui/ffx`, the FFX HUD, plus one added `export` in `src/battle/ffx/turnQueue.ts`.

## What was reproduced, and how (hard rule 3: by running it)

Scratch probes are in `D:/Tools/pyrefly-scratch/fb-0929/hipotion/probes/`. Their results are next to them: `sweep-before.json`, `matrix-ffx-before.txt`, `ffx2-items-before.txt`, `advisor-zombie-before.txt`.

1. **Engine sweep.** 400 Chapter I seeds. The policy threw a random restorative (Potion, Hi-Potion, X-Potion, Mega-Potion, Phoenix Down, Mega Phoenix, Elixir, Al Bhed Potion) at Kimahri half the time and at a random ally otherwise, and followed the guide the rest of the time. That made 5,589 restorative uses. **HP fell on a non-Zombie: 0 times.** HP fell on a living Zombie 232 times, 159 of them a KO. That is canon. In 61 more cases Kimahri was KO'd in the enemy phase straight after a heal. For example, seed 16, turn 4: a Hi-Potion on Kimahri at full HP, then Seymour's Lance of Atrophy (363 damage, Zombie), then Mortiorchis' Full-Life (2,310 damage, KO). A player sees "I Hi-Potioned Kimahri and he died".
2. **Item × state matrix** through the real resolve path (`simulateFFXCommand` → `executeCommand`), on a live Chapter I board. It covers Kimahri, Tidus and Yuna; normal at full and low HP; Zombie at full and low HP; Poison, Berserk, Confuse, KO, a KO'd Zombie, and Mighty Guard plus Zombie; with 10 items. **0 violations in 300 cases.**
3. **Advisor and guide.** 200 seeds, 300 boards with a living Zombie ally. The advisor card's top three rows and the guide's pick were checked. **0 rows healed a Zombie into damage.** PR-0198's guard (`advisor-guard.ts`) holds. On the real board the guide says "Holy Water → Kimahri".
4. **The HUD, with real input on a production build** (headless Chromium, `PYREFLY_BROWSER=gpu`, script `D:/Tools/pyrefly-scratch/fb-0929/hipotion/drive.mjs`). The live build (release 31a) and this branch were both run on seed 12, turn 3, with Kimahri a living Zombie at 1,563 HP. At 1600x900 the input was mouse clicks: Items, then Hi-Potion, then a click on Kimahri's bracket. At 390x844 the input was taps. The engine did the same thing on both builds: 1,000 damage to Kimahri, which is canon.

## The proven cause

The engine is right. Kimahri was a Zombie, and **the game did not tell the player**:

- **Kimahri's party plate dropped the Zombie pip.** `PartyStatusWindow` drew the first six statuses in the order they landed, all in one sky blue. Kimahri's Mighty Guard, the chapter's own opening move, puts exactly six statuses on him: Protect, Shell and the four Nul-spells. With Haste on top of that, the Zombie from Lance of Atrophy was the seventh or eighth status and was never drawn. Even when it was drawn, it looked the same as every other pip. The documented intent is a Zombie icon in its own colour: research/visual-bible.md "Status icons" gives the Zombie glyph `#A8C48A`, and Lance of Atrophy is described as "leaving the green Zombie icon". The CTB list already did this. The party plate did not.
- **Aiming a restorative at a Zombie ally said nothing.** The target plate read just "Kimahri". The documented help contract for "a party target" is "name, and any statuses spelled out in words" (visual-bible §3.16).

Whether the friend saw the two-step (Lance of Atrophy, then the Full-Life kill) or a Hi-Potion on a Zombie Kimahri, the missing warning is the same.

## The fix (defect, on)

- `src/ui/ffx/statusPips.ts` (new). The plate orders its pips most alarming first, in the same order the CTB list has always used (`ICON_PRIORITY`, now exported from `turnQueue.ts`), and colours them from the visual-bible table, which now lives in one place shared with `CtbList`. Zombie comes first, in green, and has a readable title ("Zombie").
- `src/ui/ffx/zombieTargetNote.ts` (new). When a living Zombie ally is targeted, the plate says "Zombie". When the command would hurt that ally, it also says what the engine's own preview says it will do: "Zombie: 1,000 damage", "Zombie: this KOs", or "~N damage" for a spell, whose amount varies. This is wired in `FFXBattleHud` in front of the existing notes.

Tests (`tests/unit/fb0929-zombie-warning.test.ts`) run on a real Chapter I board reached by the guide's own line (Mighty Guard, then Lance of Atrophy). Three failed before the fix and pass after it (`test-before.txt` / `test-after.txt` in the scratch folder):

- the plate draws the Zombie pip in `#a8c48a` under Mighty Guard's statuses (before, it drew `haste,protect,shell,nulblaze,nulfrost,nulshock` and no Zombie);
- a Hi-Potion aimed at Kimahri reads "Zombie: 1,000 damage";
- a Phoenix Down aimed at Kimahri reads "Zombie: this KOs".

`tests/unit/fb0929-item-heal-sweep.test.ts` is a guard, not a failing-first test: over 60 seeds of the random restorative policy, HP falls, or a KO follows, exactly when the target is a living Zombie.

## Options for Bailey (built, OFF, rules 9 and 10)

With a mouse, a click on a target bracket or a turn-list tile **selects and confirms at once**. A player who clicks Kimahri therefore never sees the plate's new note. That is the friend's path. Two options go further. Both are off, and `?zombiewarn=guard`, `?zombiewarn=word` or `?zombiewarn=guard,word` turns them on for a capture (`src/ui/ffx/zombieWarnOptions.ts`, `zombie-warn.css`):

- **guard**: a click that would hurt a living Zombie ally only aims the first time, and the plate shows the warning. A second click, or Enter, confirms. A click on anyone else still confirms at once.
- **word**: the party plate spells out "ZOMBIE" after the pips, in the pip's green, while the Zombie is on.

## Evidence (JPEG, `docs/screenshots/fb-0929/hipotion/`)

| Frame | Before (live 31a) | After (this branch) |
|---|---|---|
| Hi-Potion aimed at the Zombie Kimahri, 1600x900 | `before-desk-hipotion-on-zombie-kimahri.jpg` (plate: "Kimahri", nothing else) | `after-desk-hipotion-on-zombie-kimahri.jpg` ("Kimahri ZOMBIE: 1,000 DAMAGE") |
| The same, 390x844 | `before-phone-hipotion-on-zombie-kimahri.jpg` | `after-phone-hipotion-on-zombie-kimahri.jpg` |
| Kimahri's pips under Mighty Guard + Zombie | `before-desk-mighty-guard-board.jpg` | `after-desk-mighty-guard-board.jpg`; close-up `mighty-guard-pips-before-top-after-bottom.jpg` (before: six sky-blue pips, no Zombie; after: green Zombie first) |
| Options on | | `option-word-desk-party-plate.jpg`, `option-word-phone-board.jpg`, `option-guard-desk-first-click-aims.jpg` (the first click left the battle log unchanged and put the plate on Kimahri with the warning) |

The Mighty Guard frames on the live and local builds are seed 12's real Zombie board. The six Mighty Guard statuses were then copied onto Kimahri in the page and the plate redrawn. In 100 browser seeds, the seed search never reached a Zombie-on-Mighty-Guard board with a party turn free before the Full-Life. The unit test reaches that board for real in the engine.

## Checks

- `npx tsc --noEmit`: clean.
- 75 targeted vitest files (every file touching the HUD, CTB list, command menu, turn queue and advisor zombie guard, plus the two new ones): all pass.
- Full suite, run once: 662 files passed and 1 failed. The failure was `strategy-ffx2-bahamut` "heal-only route", a 15 s timeout under load (16.9 s). It passes alone in 7.5 s. It is FFX-2 code this track does not touch.
- `node tools/orphans.mjs`: 24 orphans, the same as main (1,055 modules; the 3 new ones are all reachable).

## Not done / open

- The options are off and need Bailey's pick.
- The engine still accepts a restorative explicitly aimed at a KO'd ally: a Potion on a KO'd Kimahri sets his HP to 200 while he stays KO'd (matrix rows `kimahri ko potion` / `hi-potion` / `x-potion` / `elixir`). The HUD never offers that target, because `validTargets` leaves KO'd allies out for potions. In the 400-seed sweep it never happened through `submit` from a real menu row. It is only reachable by calling `forceCommand` / `simulate` by hand. It is left alone and not fixed here.
- No sprite tint on a zombified character. The sources give an icon, not a tint, so this was not invented.
- The phone's target detail panel ("Kimahri HP 1563 / 2310 · Hi-Potion · Restores ...") does not repeat the Zombie note. The plate above it does show it.

## CHECK (independent, 2026-09-29, did not build this)

Verdict: **the two claimed fixes hold, no regression, no rule break. No blockers.** Game case confirmed FFX only (Zombie is sourced for FFX only; `FFX2StatusId` has none; every change is under `src/ui/ffx` plus one added `export` in `src/battle/ffx/turnQueue.ts`, no engine behaviour changed).

What was re-run (scratch: `D:/Tools/pyrefly-scratch/fb-0929/hipotion-check/`):

- **Engine sweep, my own policy** (`sweep.mts`, a different RNG, seeds 1001-1400, Kimahri targeted 60 % of the time, Megalixir added): 5,123 restoratives on allies, **0 cases** where HP fell or a KO followed on anyone who was not a living Zombie; 266 uses on a living Zombie (150 on Kimahri), all hurt, as canon says. On 57 of 278 boards with a living Zombie Kimahri, Zombie was the seventh or later status, so the old plate (first six in landing order) could not draw it. That confirms the plate defect independently.
- **Tests fail before the fix:** the two new test files, run against an `origin/main` (1c313c17) copy of `src` + `tests`: `fb0929-zombie-warning` fails 5 of 8 (the pip, the 1,000-damage note, the KO note, and the two option tests); the 3 "stays the same" cases pass; the heal sweep passes before and after (it is a guard, as the builder says). On the branch all 9 pass.
- **Real input, natural board, no state injection.** The builder had to copy Mighty Guard's statuses onto Kimahri for the browser frames. I reached the real board through the presenter instead: `autoBattle` with a strategy replaying an engine-verified line (seed 42: Kimahri opens with Mighty Guard, everyone else defends), then handing the 6th decision to a human. Kimahri: living Zombie, 730/2310 HP, statuses `protect, shell, nulblaze, nulfrost, nulshock, nultide, critical, zombie`. Items -> Hi-Potion -> click (1600x900) or tap (390x844) on Kimahri's bracket.
  - **Live 31a (before), 1600x900:** plate pips `protect, shell, nulblaze, nulfrost, nulshock, nultide`, all `rgb(127,198,232)`, **no Zombie**. Target plate: "Kimahri". Mouse hover: "Kimahri". Click -> 1,000 damage, KO.
  - **Branch production build (after), 1600x900:** pips `Zombie rgb(168,196,138)` first, then Protect, Shell, Nulblaze, Nulfrost, Nulshock. The target cursor opens on Kimahri and the plate reads "Kimahri ZOMBIE: THIS KOS" (730 HP < 1,000, so "this KOs" is right). Click -> 1,000 damage, KO (canon, unchanged).
  - **Branch, 390x844 taps:** the same pips (green Zombie first in the card's pip row), the plate reads "Kimahri ZOMBIE: THIS KOS"; the tap resolves the same canon 1,000.
  - Page errors: 0 on every run. Frames: `shots/{live,branch}-desk/`, `shots/branch-phone/`, pip close-ups `shots/*-desk/zoom-pips.jpg`.
- **Options are off:** `ZOMBIE_WARN_ON` is `{ guard: false, word: false }`; no "ZOMBIE" word on any default-build frame; a click on the bracket confirms in one go on the default build, as before.
- `npx tsc --noEmit` clean. Full suite, once: **664 files passed, 5 skipped, 0 failed** (10,195 tests). `node tools/orphans.mjs`: 24, unchanged. `git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main`: no conflicts (the merge base is origin/main itself, a fast-forward). `D:/Final Fantasy/src/ui/ffx/CtbList.ts` is clean in the main tree.

Findings (none blocks):

1. **Minor, noted for Bailey's pick:** with a mouse, the new target-plate note shows only when the cursor opens on, or keys onto, the Zombie. Hover does not move the cursor ("hover plate" stayed on the default target in the before run and did not change in the after run), and a click on a bracket confirms at once. On the natural board the cursor defaults to Kimahri, so the note was visible. When it does not default to him, the only on-by-default warning is a 5 px green pip on a dimmed, inactive row, which is hard to tell from the blue pips. The builder's `guard` and `word` options address exactly this, and they are correctly OFF.
2. **Minor, canon but worth knowing:** Zombie survives KO here (`SURVIVES_KO`, sourced from ffx-yunalesca section 15.2 #29, which contradicts the combat-core summary column; the choice is documented in `statuses.ts`). So a Phoenix Down on a KO'd Zombie Kimahri brings him back **still Zombie** at low HP, and the next Hi-Potion kills him again. My sweep saw this 260 times. It is another "the potion killed him" path. The new pip and plate cover it (the pip is drawn on the revived Kimahri). The engine rule is not changed, following rule 6.
3. **Minor, house style:** `CommandMenu.ts` (857 -> 865 lines) and `FFXBattleHud.ts` (1645 -> 1647) were already over the 400-line rule on main. They grew slightly. No new file is over 400 lines.
4. **Minor:** `zombieTargetNote` takes precedence over the existing notes. A Zombie ally who is also Doomed, or already Protected, shows the Zombie note instead of "Doom N" / "already Protected". Harmless in Chapter I.
5. **Out of scope, pre-existing (live too):** on this board the guide rail reads "NEXT TIDUS -> Holy Water -> Kimahri" while Tidus is KO'd and Yuna is the actor. The Moves card correctly names Yuna. See `shots/live-desk/02-default-target.jpg`.

Moved (no deletes): the `origin/main` archive used for the fails-before run, to `F:/pyrefly-parked/2026-09-29/hipotion-check/` (logged in MOVED.txt there). The preview server on 8150 was stopped by PID.
