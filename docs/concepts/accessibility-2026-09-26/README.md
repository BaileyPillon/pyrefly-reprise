# Accessibility settings: options round, 2026-09-26 (PR-0032, reopens D-005)

Bailey said yes to an options round on 2026-09-26: *"I'll go with all of your
recommendations"*, which covered item 1 of the driver's sheet: show options for text
size, reduce motion, reduce flashes and key remap, all off by default. This folder is
that round. **Nothing in `src/` is built or changed.** Bailey picks, and only then does
a build start (AGENTS.md rule 9).

**Game case: both.** The settings are shared plumbing (the pause screen, `SaveData`,
`Input`, both games' presenters; `critic/CHECKS.md` CHK-020). The FFX-2 HUD
(`ffx2hud`) needs its own 130 % layout pass. The frames here are from FFX Chapter I.

`sheet.jpg` is the phone-readable sheet, with the three options, the 130 % frames and
the costs. The single frames sit beside it (`desk-*.jpg` at 1600x900, `phone-*.jpg`
at 390x844).

## The four settings (the same in every option)

| setting | values | default | what it does |
|---|---|---|---|
| TEXT SIZE | 100 / 115 / 130 % | 100 % | Larger type in the battle HUD, dialogue and menus (see "What 130 % does") |
| REDUCE MOTION | OFF / ON | OFF | Holds the camera still in battle: no sweeps, shakes or parallax. The field already exists in `Settings.reduceMotion`; the title and the pause already follow it, but battle does not yet |
| REDUCE FLASHES | OFF / ON | OFF | Softens the white screen-flashes (`vfx.screenFlash`) and the hit, crit and status flashes in both games' presenters |
| CONTROLS remap | per key | the current `KEY_MAP` | Enter on a row, then press the new key. A key that is already in use swaps with it, Esc cancels, and there is RESET TO DEFAULTS. A pad keeps its own layout. On a touch-only phone, the row is hidden until a keyboard or pad is used |

## The options

| | Option | How it plays | Cost |
|---|---|---|---|
| **A** | **Rows in the pause SETTINGS column** (`desk-A-options.jpg`, `desk-A-controls.jpg`, `phone-A-options.jpg`) | Pause, OPTIONS: TEXT SIZE, REDUCE MOTION and REDUCE FLASHES sit under TEXT SPEED and are nudged with Left / Right like the other rows. REMAP CONTROLS opens the existing CONTROLS tab, whose rows can now be rebound. | The smallest. No new screen and no new tab. The settings column goes from 6 rows to 10; on a phone it already scrolls under its fade (PR-0098). The downside: a player can only find the settings once a scene or fight is running, which is after the first flash. |
| **B** | **Its own ACCESSIBILITY tab** (`desk-B-access.jpg`, `phone-B-access.jpg`) | A ninth tab after OPTIONS. READING AND COMFORT on the left; on the right, the main keys with REMAP EVERY KEY and RESET TO DEFAULTS. | Small to medium. The tab strip gets longer (one more swipe on a phone), and the keys are listed in two tabs (here and in CONTROLS). It has the same late-discovery problem as A. |
| **C** | **A's rows, plus a comfort card on first launch** (`desk-C-prompt.jpg`, `phone-C-prompt.jpg`) | The first time the player presses Enter at the title, one ivory Ink & Gold card offers TEXT SIZE (with an "Aa" sample at each size), REDUCE MOTION and REDUCE FLASHES, all OFF. BEGIN or Esc closes it, and it never appears again. After that, everything lives in A's rows. | A's cost, plus one card and one saved "asked" flag. Everyone sees the card once. In return, flashes and text size can be set **before** the opening scene and the first battle flash, the only point where they fully help. |

**Recommendation: C.** REDUCE FLASHES only fully helps if it is set before the first
flash, and TEXT SIZE before the first line of dialogue. C is the only option that
makes that possible, and it costs one dismissible card on top of A, the cheapest
option. B's separate tab adds strip length and a second key list, and it still has
the late-discovery problem.

## What 130 % does

- **Desktop battle HUD** (`desk-hud-130.jpg`, beside `desk-hud-100.jpg`).
  - The HUD is drawn on a fixed 640x360 grid. Text size therefore grows each panel as
    a unit from the corner it is pinned to, so nothing inside a panel re-wraps.
  - At 130 %:
    - the command list shows 4 rows and scrolls (▲ ▼);
    - the turn queue shows 5 portraits;
    - the enemy card moves up and to the left, clear of the queue and the party list;
    - the move advisor moves right by the amount the guide grew.
  - `desk-hud-130-naive.jpg` shows what "multiply every font by 1.3" does instead: the
    guide and advisor clip, the enemy card runs into the party list, and the party
    list runs off the right edge. That clipping is why TEXT SIZE is real layout work,
    not a single CSS line.
- **Dialogue card** (`desk-dbox-100.jpg`, `desk-dbox-130.jpg`). The line, the name,
  the GUARDIAN tag, the chapter eyebrow and the key strip all grow; the card keeps its
  size.
- **Phone** (`phone-hud-100.jpg`, `phone-hud-130.jpg`, `phone-dbox-130.jpg`).
  - The phone HUD uses flow layout, so its type grows and reflows.
  - One rule is drawn in: the fixed-width party card caps its name and numbers at
    115 %. Otherwise "Kimahri" is cut to "Kima…" and HP runs into MP ("2420115").

## Costs and risks for every option

- **Save data.** TEXT SIZE, REDUCE FLASHES, the key map and C's "asked" flag are new
  `Settings` fields, and old saves need a default for each. That makes this a
  **save-data class** change (`src/app/SaveData.ts`): a **deep review before
  deploy**, not after (AGENTS.md "Release"), plus the CHK-024 matrix.
- **The remap must follow `pause/keys.ts`.** The pause answers Q, E, F and Tab raw,
  to avoid the `KEY_MAP` collisions (`docs/handoff/pause-remake.md`, "The keyboard").
  A remapped key has to update that table too, or it breaks the pause strip. This is
  the riskiest part of the build.
- **Layering.** REDUCE FLASHES belongs at the presenter's ports
  (`BattlePresenterPorts.ts`), not inside the pure presenter (hard rule 1).
- **FFX-2** needs its own 130 % HUD layout; nothing here measures it.
- **Pause text at 130 %** is not drawn. The pause is already at 14 px desktop / 12 px
  phone floors and would scale its `--pu-fs` variables.

## Found on the live build while capturing (not caused by this round)

- **CONTROLS tab, 1600x900.** Four labels are cut off with an ellipsis: "Move down a
  menu", "Adjust a setting", "Resume the fight" and "Hide everything but the
  painting" (measured `scrollWidth > clientWidth`; `desk-today-controls.jpg`). A and
  C rebuild this tab, and their frame shows the labels at full width.
- **OPTIONS tab, 390x844.** "MASTER VOLUM…" is cut off (`phone-today-options.jpg`).
  The phone frames here draw the fix: the wide key column goes from 118 to 140 px and
  the meter shrinks to fit.

## How these were made

- **Real frames of the live build**, https://baileypillon.github.io/pyrefly-reprise/
  (release 20).
  - Headless Chromium on the GPU (`PYREFLY_BROWSER=gpu`).
  - 1600x900, and 390x844 with touch at device scale 2.
  - Seed 1, muted. Chapter I was entered through `__pyrefly.gotoChapter`.
  - No local server was started.
- **`inject.js` draws the proposed rows into the live page** using the live pause's
  own markup and classes, so the shipped stylesheet styles them. C's card is new
  markup in the Ink & Gold tokens and faces. Text in the card is 14 px or larger.
- **130 % desktop.** Each HUD panel is scaled from its anchored corner, plus the four
  layout moves listed above. **130 % phone and dialogue.** Every text run is scaled
  by 1.3.
- To reproduce:
  - `PYREFLY_BROWSER=gpu node docs/concepts/accessibility-2026-09-26/capture.mjs desk`
    (or `phone`), which writes PNGs to `frames/`;
  - `node .../render-sheet.mjs` builds `sheet.jpg` from `sheet.html`;
  - the committed JPEGs were converted from those PNGs.
- Our own art only. Nothing was downloaded.

## Questions for Bailey

1. **A, B or C?** (Recommended: C.)
2. If C, is the card's wording right: "Before the first fight · Make it comfortable ·
   Three choices, all off unless you turn them on"?
