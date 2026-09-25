# Preflight: the phone battle HUD, option B "compact rail"

2026-09-25. Rule 15 paper preflight. Bailey picked option B for the upright phone
(D-pick of 2026-09-25, "I'll go with all your recommendations"; target:
`docs/concepts/layout/phone-battle-hud/sheet.jpg` row B and `frames/B-*.jpg`).
`node tools/critic-plan.mjs --paths src/ui/common/phoneBattle.ts,src/ui/ffx/phone-hud.css,src/app/screens/BattleScreenWiring.ts`
classes it DEEP (global layout, input and boot; FFX HUD), both games.

## What is built

- **Breakpoint:** `(max-width: 599px) and (orientation: portrait)`. The sheet is drawn for
  390 x 844 and has to hold at 360 x 780; 600 px is the party-prep phone breakpoint, and a
  phone turned sideways (844 x 390) keeps today's layout (option C was not picked).
  Everything is keyed on `html[data-phone-battle]`, which only the phone module sets, so a
  desktop window never matches a phone rule.
- **Field:** `#game` is cut to the field rectangle (window height minus a 324 px panel:
  520 px at 844, 456 px at 780). The renderer measures its container and the presenter
  projects through the canvas rect, so reticles, numerals and plates follow without an
  engine change. One `resize` event is dispatched when the mode changes.
- **Top rail:** FFX, the CTB faces in one row (the acting face larger), the target outlined
  in it; FFX-2, Bahamut's gauge (the boss HP strip) where FFX has the order. Pause is a
  46 px square at the right. The enemy-move line sits under the rail.
- **Bottom panel (from the bottom up):** a one-line footer (FFX: whose turn; FFX-2: the
  command help), the commands as a 2-column grid of 56 px tiles, the tip line (the
  advisor's top move, tap to hide) with GUIDE beside it, three party chips (face, name,
  HP, MP, OD or ATB bar).
- **Target step:** the grid gives way to a target card (FFX: the Sensor card, HP and
  elements; FFX-2: the girl's row) and a Back / Confirm bar. Tapping a figure on the field
  still confirms it (the existing bracket click); Back and Confirm send Escape and Enter
  through the same path the keyboard uses.
- **Removed on the phone:** the floating HIDE MOVES tab and the G / E chips. The guide opens
  as a sheet over the field from GUIDE.

## Where the code goes

New modules only, plus one wrapper line: `src/ui/common/phoneBattle.ts` (mode, field,
chrome, target step; both games), `src/ui/common/phone-battle.css`, `src/ui/ffx/phone-hud.css`,
`src/ui/ffx2/phone-hud.css`, and `createHud()` in `BattleScreenWiring.ts` wraps the HUD's
own `mount`/`unmount`. `FFXBattleHud.ts` and `FFX2BattleHud.ts` (both past 400 lines, the
FFX one being edited by the Yojimbo track) are not touched.

## Game case (rule 14)

Both: shared presentation plumbing. Each game keeps its canon: FFX shows the CTB order,
FFX-2 has no turn list (research/ffx-vs-ffx2-presentation.md §4.2, §9 row 3) and shows the
boss gauge and the ATB on each chip; FFX-2 keeps its pink accent.

## Risks and checks

- Desktop regression: rects of the main panels and the canvas at 1280x720, 1600x900 and
  2000x1012, chapters 1 and 4, measured before and after (must be identical).
- Solvers that assume the 640x360 letterbox (advisor placement, intent pinning, published
  panel rects) keep running on the phone; their inline boxes are overridden in CSS.
  Anything that reads them for gameplay is checked in the real flow.
- CHK-003: every visible text node at or above 14 px in the menu, submenu and target steps,
  walked in the real game with `currentCSSZoom` and transforms folded in.
- Input: real keys and Playwright touch taps from the title in chapters 1, 4, 8 and 9 at
  390 x 844, plus 360 x 780.
- Out of scope, named: Overdrive minigames and the landscape phone keep today's layout.

## Changed during the build (2026-09-25)

- Two one-line hooks outside the new modules, found by the real-flow walk (neither file
  grows): `DamageNumbers.scale()` is 1 on the phone HUD (numerals measured 9 to 10 px), and
  `ZanmatoGauge.place()` takes its phone layout on the phone HUD (at 360x780 it fell back to
  the 4.9 px landscape gauge).
- Transients the first walk caught under 14 px: FFX-2 banners, battle barks, moment-slab small
  caps, the turn cut-in's CTB line (dropped on the phone). The folded Sensor plate stays open
  as the target card. Submenu titles take the tip line's slot in both games.
- Results: `docs/handoff/phone-battle-hud.md`.

## Repair pass (2026-09-25, after the verifier's round)

The verifier refuted two claims and found three majors; the method stays the same (real flow
from the title, touch and keys), with two probes added: a group-target walk (Ch. I
Mega-Potion, Ch. IV and V Pray) and an observer that records every text the phone HUD shows
at its settled size, however briefly.

- **ALL-target commands** had no touch path: group brackets carry no `data-target-id`, so the
  readers never saw a target step. `readGroup` (`src/ui/common/phoneBattleText.ts`) reads
  `.ffx-target--group`; the card names the group, the hint says Confirm or Back, and the
  clipped 13 px "ALL ALLIES" label is hidden on the phone.
- **Framing** (FFX-2 Ch. V Yuna wholly off the frame; left girl cut at 360 in IV and VI; Lulu
  in IX): the pixel scale is fixed by the field's height, so no crop can shrink the fight. The
  canvas is now the 16:9 render at the field's height and slides (`phoneFraming.ts`): at each
  menu so the acting figure and the party stay whole, and while aiming so the aimed figure
  does, carrying the drawn bracket layer with it. No camera, rig or scene changes.
- **CHK-003:** the FFX-2 chain label (5.6 to 6.1 px), Ch. VII's "Cannot be targeted" tag
  (13 px) and the battle-start skip line (9 px) meet 14 px on the phone.
- **Minors:** the enemy-move line hangs under the rail at whatever height the rail has (Ch. VI's
  three gauges) and runs to three lines at full width (Ch. I's target and damage were cut); a
  finger drag steps FFX's paged command list a row; at 360 the chips give the numbers 12 px.
