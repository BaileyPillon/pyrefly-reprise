# Handoff: the phone battle HUD, option B "compact rail"

2026-09-25. Bailey picked option B for the upright phone ("I'll go with all your
recommendations", 2026-09-25 ~01:40 EDT). Target: `docs/concepts/layout/phone-battle-hud/sheet.jpg`
row B and `frames/B-*.jpg`. Preflight: `docs/plans/phone-battle-hud-review.md`.

**Game case (rule 14): both.** Shared plumbing in `src/ui/common/phoneBattle.ts` and
`phone-battle*.css`; each game keeps its own canon in its own half. FFX: the CTB order on
the rail, the Overdrive bar on each chip, the Sensor card as the target card
(`src/ui/ffx/phoneHud.ts`, `phone-hud*.css`). FFX-2: no turn list (FFX-2 has none,
`research/ffx-vs-ffx2-presentation.md` §4.2, §9 row 3), the boss gauge on the rail, the ATB
bar on each chip, the pink accent, "girl" in the target hint (`src/ui/ffx2/phoneHud.ts`,
`phone-hud.css`).

## What is built

- **When:** `(max-width: 599px) and (orientation: portrait)`, keyed on
  `html[data-phone-battle]`, which only `phoneBattle.ts` sets while a battle HUD is mounted.
  A phone held sideways and every desktop size keep today's HUD.
- **Field:** `#game` is cut to the window minus a 324 px panel: 390x520 at 390x844,
  360x456 at 360x780 (FFX-2: 0.93 aspect, left-aligned, as the sheet's frame).
- **Rail:** FFX CTB faces (acting face larger, target outlined); FFX-2 boss gauge; pause as a
  46 px square; the enemy-move line under it, two lines at most.
- **Panel (bottom up):** footer line (whose turn + the command help), the commands in a
  2-column grid of 56 px tiles, the tip line (the advisor's top move; a tap on it is the
  advisor's switch) with GUIDE at its right end, three party chips.
- **Submenus:** their title takes the tip line's slot (FFX breadcrumb, FFX-2 title).
- **Target step:** the grid gives way to a target card (FFX: the Sensor card, kept open while
  aiming; FFX-2: the girl's row) and a Back / Confirm bar. Back and Confirm send Escape and
  Enter through `window`, the path a key takes. A tap on a figure confirms it (the existing
  bracket click); a horizontal swipe on the field steps the cursor.
- **Gone on the phone:** the floating HIDE MOVES tab and the G / E chips; the guide opens as a
  sheet behind GUIDE.
- **Two hooks outside the new modules** (no line added to either file):
  `src/ui/common/DamageNumbers.ts` `scale()` is 1 on the phone HUD (numerals were 9 px);
  `src/ui/ffx/ZanmatoGauge.ts` `place()` takes the phone layout on the phone HUD (at 360x780 it
  fell back to the 4.9 px landscape gauge). The wiring is `createHud()` in
  `src/app/screens/BattleScreenWiring.ts`.
- **Transients restyled:** banners and telegraphs under the rail (both games), battle barks
  (`.dbox`) and moment slabs at 14 px or more, the turn cut-in's "YOUR TURN · CTB n OF m"
  line dropped on the phone (3.8 px there; the rail says whose turn it is).

## Verified (2026-09-25)

- Real flow from the title (Enter, chapter card tapped, Enter, prep, cutscene held), real keys
  and Playwright touch taps, in chapters I, IV, VIII and IX at 390x844 and 360x780, plus a
  keys-only pass in IV (390), VIII and IX (360): first command, submenu, target step, Back,
  swipe, Confirm, then five more turns. Every battle-HUD text node 14 px or more in the menu,
  submenu, target, guide and during the turns (sampled every 200 ms); no sideways scroll;
  0 console errors, 0 404s. Shots: `docs/screenshots/phone-battle-hud/` (target beside build).
- Desktop unchanged: `desktop-before-after.jpg` and `desktop-rects.json` (HEAD vs this change
  at 1280x720, 1600x900, 2000x1012, Chapters I and IV). FFX rects identical except the advisor
  card at 1280x720, whose width flips between 219.1 and 227.1 run to run in both builds (same
  text); FFX-2 differences are the running ATB clock and differ between two runs of the same build.
- `tests/unit/phone-battle-hud.test.ts` (21 tests): mode switch, chrome, Back/Confirm keys,
  swipe, advisor tap, GUIDE, the wrapper, both readers, both hooks, and that every phone rule
  is scoped under `html[data-phone-battle]` and never under 14 px.

## Repair pass (2026-09-25, after the verifier's round)

The verifier refuted "target step done" (ALL-target commands had no touch path) and "every
text at least 14 px" (FFX-2 chain label 5.6 to 6.1 px, Ch. VII tag 13 px), and found the
FFX-2 framing major (Ch. V's acting girl wholly off the frame). Fixed, game case **both**:

- **Group aims** (Pray, Mega-Potion, -ga spells): `readGroup` in
  `src/ui/common/phoneBattleText.ts` reads `.ffx-target--group` (those brackets carry no
  `data-target-id`). The step comes up: the card names the group ("All allies"), the hint
  says "All three girls at once" (FFX-2) or "The whole party at once" (FFX), Confirm names the
  move, the swipe is off. The 13 px "ALL ALLIES" label (clipped at the left edge) is hidden on
  the phone; the card carries it.
- **The field slides** (`src/ui/common/phoneFraming.ts`): the canvas is the 16:9 render at the
  field's height, and `--phud-left` picks which slice the window shows. With a menu up it
  glides so the acting figure, then the party and the largest enemy, stay whole (ties go to
  the old home: FFX centred, FFX-2 the sheet's 0.93 frame). While aiming at one figure it jumps
  so the aimed figure is whole, and shifts the drawn bracket layer by the same amount until
  the cursor redraws it (measured: bracket and silhouette agree within 2 px). No camera, rig,
  scene or number changes. The pixel scale is fixed by the field's height, so when a fight is
  wider than the window something stays off: Chapter VII (unlisted) keeps Seymour and drops
  Yuna unless Yuna acts.
- **CHK-003:** FFX-2 `.ffx2chain__label`, Ch. VII `.mac-tag__plate` ("Cannot be targeted";
  the gold Anima tag is 26 px) and the battle-start skip line (`.bstart__skip`, 9 px) are
  14 px on the phone. Desktop sizes unchanged.
- **Minors:** the enemy-move line hangs under the rail at the rail's real height
  (`--phud-rail-bottom`; Ch. VI's three gauges were covered) and runs to three lines at full
  width (Ch. I's target and damage were cut); banners and Yojimbo's gauge sit under it
  (`--phud-line-bottom`). A finger drag on FFX's paged command window steps it a row per
  48 px. At 360 wide the chips give the numbers 12 px (face 28 px), so "6492" and "140" no
  longer run together.
- The observer run also caught the field plate's note ("already Hasted", `.ffx-target__note`,
  11 px): 14 px on the phone, 11 px on the desktop as before.
- Tests: `tests/unit/phone-battle-hud-repair.test.ts` (15).

**Verified (repair):** real flow from the title (Enter, chapter card tapped, prep, cutscene
held) in Ch. I, IV, V, VI, VIII, IX at 390x844 and 360x780, touch and keys: group aims by
touch (Ch. I Mega-Potion and Ch. V Pray: card "All allies", Confirm tap resolves the turn),
single aims, Back, swipe, Confirm; an observer recorded every text the phone HUD showed at its
settled size: none under 14 px outside the results and pause screens. FFX-2 chain label
measured 14 px on the phone (auto battle, Ch. IV). Ch. VII tag 14 px on the phone, 13 px on the
desktop. Bracket and silhouette agree within 2 px after the aim jump. Desktop 1280x720,
1600x900, 2000x1012 and a sideways 844x390, Ch. I, IV, V: FFX rects identical to HEAD, FFX-2
differences the same as HEAD against itself (`repair-desktop-rects.json`). 0 console errors.
Shots: `docs/screenshots/phone-battle-hud/repair-*.jpg` (sheet beside build).

## Open, not done here

- **Chapter IX on the phone:** Yojimbo's gauge (approved phone frame, about 145 px tall) sits
  under the rail over the top of the field, where the cavern camera puts Yojimbo and Daigoro,
  so on the 390x520 field the enemies are mostly behind it. The phone framing of Chapter IX
  belongs to the Yojimbo polish track; it should be framed against the new field (390x520 /
  360x456), not the full window. (The slide now keeps Lulu whole there.)
- **Results screen** at 390x844 is still the desktop layout scaled down (text 4 to 9 px);
  not part of the battle HUD.
- **Coach lines** say "Enter continue" on a touch phone; a tap works (it dismisses the line).
- FFX-2's target flower reticle is drawn by `src/engine/TargetHighlight.ts` (another track's
  file) and is larger than the sheet's corner brackets.
- Overdrive minigames and the landscape phone keep today's layout (named out of scope in the
  preflight).
