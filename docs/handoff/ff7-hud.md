# FF7 battle HUD: option A made more faithful, built (FF7 only)

Branch `ff7-plumbing` (worktree `D:/pyrefly-ff7`), 2026-09-27. Not merged, not deployed; the
experiment is still behind `FF7_EXPERIMENT_READY = false`.
**Game case: FF7 only** (AGENTS.md rule 14). Nothing under `src/ui/ffx`, `ffx2`, `inkgold`,
`common` or `coach` changed; the HUD's CSS lives under `.ff7hud` with `--ff7-*` tokens; its one
font (M PLUS Rounded 1c 500, OFL, `public/fonts/ff7/` with its OFL file) loads only when the FF7
HUD draws text. Shared plumbing touched: `BattleScreenWiring.createHud` gained its `'ff7'` answer,
`main.ts` registers the harness in development builds only.

Bailey, 2026-09-27: "ff7 screen layout ill go with a but it needs to be EVEN more faithful than a
but remember it is specific to the ff7 encounters". Spec `docs/plans/ff7-hud-faithful-a-spec.md`;
target `docs/concepts/ff7-hud-2026-09-27/a-plus/`.

## What is built (`src/ui/ff7/`, every file under 400 lines)

| File | What |
|---|---|
| `Ff7BattleHud.ts` | `HudPort`: `sync`, `syncVitals`, `syncGauges`, `chooseCommand`, `closeCommandMenu`, `setAtbMode`, `onMenuLevel`, `onEvent`, `update`, projector and targeting port. No coach, advisor, guide, turn list, bracket or banner (spec §8). |
| `ff7Geometry.ts` | Pure layout in FF7 units (320 x 224): desktop stretch rule and phone A. |
| `ff7MenuModel.ts` | Pure command window: four fixed slots (Attack or Limit, Magic, Summon, Item; blanks skipped), Magic grid, Item and Limit lists, target step, All targeting, help, Wait level. |
| `Ff7CommandMenu.ts`, `ff7MenuHtml.ts` | Keys (arrows; Enter / Space / Z; Esc / X / Backspace; **H = SELECT**), taps (a row chooses; a figure aims, a second tap confirms; a tap on the scene backs out), the Esc claim, the finger on targets. |
| `Ff7PartyRows.ts`, `ff7Draw.ts` | Names window (NAME, BARRIER, two-bar box), status window (`cur/ max` HP, current MP, lines, LIMIT and TIME boxes), black strip; window gradient, bevel, gauges. |
| `Ff7HelpLine.ts` | Top window: messages one at a time, an action's name at once, SELECT help, fit to one line. |
| `ff7Marks.ts`, `ff7Art.ts` | Damage numerals (our digit set, green recovery, "Miss"), the ready triangle, the finger. |
| `ff7Tokens.ts`, `ff7-hud.css` | Colours and metrics with their spec tags. |
| `ff7HudFixture.ts`, `Ff7HudDemoScreen.ts` | Deterministic stand-in engine and the harness screen `ff7-hud-demo` (dev only). |

Tests: `ff7-hud-geometry`, `ff7-hud-menu`, `ff7-hud-dom` (real key and click events through the
port; scope and file-size checks), `ff7-game-branch` (createHud now builds the FF7 HUD).

## Target vs build

Real-input check (one headless Chromium, 1600x900 keys, 390x844 touch taps, no console errors):
frames in `docs/screenshots/ff7-hud/`, sheets `side-by-side-1` to `-5` (target left, build right).
Every moment of the target is reached by real input: Cloud's turn, Magic with the MP window,
targeting, SELECT help, Tail Laser with numerals, "Limit" in slot 1, the Limit window.

Same as A+: window material and bevel, band position and split, command window size and anchor,
four slots with the blank, finger, triangle, damage digits, Limit colour table and blink colours,
Limit window, message rules, phone A stacking at one scale.

Deliberate differences, each from the A+ fidelity review (score 7.8):
1. **Body type**: M PLUS Rounded 1c 500 instead of the PR7 Line glyph set, which the review read
   as a techno / Eurostile face; M PLUS has round bowls and the closest measured ratios (digit
   0.86 of the cap, "Cloud" 3.66 caps; FF7 stills 0.86 to 0.90 and about 3.8). Needs Bailey's eye.
2. **Right window spacing**: MP, LIMIT and TIME hang from the right edge at FF7's spacing (3 u,
   2 u, 6 u); the 16:9 slack sits between HP and MP.
3. **Header caps** 3 u (about 0.45 of the name cap with the edge), not 4.5 u.
4. **Phone A**: the command window's bottom sits on the names window's bottom, so it never covers
   the status headers (A+ clipped MP, LIMIT, TIME).

Not re-judged by the fidelity judge yet. Scene and figures in the harness are grey placeholders.

## Estimates that show (all labelled in code; spec §9 #4 is the in-game list)

Message hold (1.2 s + 40 ms a character) and the action name interrupting a queued line; the
Magic grid, MP window and Item list layouts; the Limit blink (4 Hz) and letter step (100 ms); the
triangle's spin; numeral motion; the fingertip point on a figure; tap-on-scene = cancel; the
half-blend of the top window; HP yellow `#F8F070`; heal green `#80F080`.

## What the engine step owes this HUD

- `availableCommands` rows: `'limit'` (replaces Attack while full), `'attack'`, `'ability'` in
  category `'blackmagic'` / `'whitemagic'` (Magic), `'summon'`, `'item'`; `targeting` and
  `preferredTargets` set; `mpCost` after materia; a disabled row greys.
- `limit-gauge` events (0 to 255, `ready`), `Ff7Combatant.ff7.limit` and `ff7.atb` in state, an
  `AtbSnapshot` through `sync` and `syncGauges`; `action-start` with `abilityName`; `message`
  events for "Locked On Target" and the hint lines.
- Pass `itemCount` when `createHud('ff7')` is built with the engine's inventory (today the Item
  list shows names only in the real flow; the harness passes counts).
- Not built yet: Barrier / MBarrier fills (always empty: the slice never raises them), grey names,
  Change and Defend, the orange full TIME state, help descriptions (no sourced text yet), sounds.

## Open for Bailey

Body face (M PLUS Rounded 1c vs PR7 Line); phone A vs phone B; stretch vs pillarbox; the hint's
"it's" (spec §9 #1 to #3).

## Run it

In the worktree: `npx vite --port 5199`, open `http://127.0.0.1:5199/?coach=off`, then in the
console `__pyrefly.goto('ff7-hud-demo')`. Stop the server by its port when done.
