# fix3 — targeting and enemy visibility

**Owner's criticism (Bailey, with a Chapter 3 screenshot):** *"it's not clear
which ally is being selected for buffs and not clear which enemy is being
selected for attacking. some enemies are hidden behind bigger enemies? they are
not clearly visible."*

In that frame Tidus is choosing Hastega. The only targeting cue is a pair of
hairline corner brackets — a **fixed 64 px** box around a projected head point,
the same size for a Yu Pagoda and for a 4-unit aeon — over Yuna and Auron, plus
a name tag a few pixels tall. Nothing says the cast hits all three. Both Yu
Pagodas are completely behind Braska's Final Aeon's painting. Yu Pagoda's
turn-list portrait reads as a letter tile.

**Approved end state:** option **B**, *"hand, ring and a quiet dim"*, picked by
Bailey on 2026-09-19 from the four mockups in `docs/concepts/targeting/`. The
three pictures in `docs/concepts/targeting/b-ring-and-dim/` (s1 Hastega on the
party, s2 an attack on a Yu Pagoda, s3 an FFX-2 attack on Vegnagun) **are** the
target; this track was built to them.

## Game-aware case (AGENTS.md rule 14, critic CHK-021)

Decided from `docs/concepts/targeting/options.json`, which cites
`research/visual-bible.md` §4.2 / §4.7 / §3.5 and
`research/ffx-vs-ffx2-presentation.md` §9 — never from memory.

| Change | Case | Source |
|---|---|---|
| Pointing-hand cursor docked against the silhouette | **FFX only** | visual-bible §4.2; FFX-2 "does not use FFX's finger cursor" |
| Six-petal flower field reticle | **FFX-2 only** | visual-bible §4.7 — a rotating flower, *not* a bracket |
| Active / Wait indicator | **FFX-2 only** | a real FFX-2 Config entry; FFX's CTB has no such setting |
| Four-corner bracket scaled to the figure's bounds | **both** | visual-bible §3.5 |
| Ink name plate with its letter tag | **both** | §3.5; the tag is the only mark telling Yu Pagoda B from C |
| Spread formation, no silhouette crossing another | **both** | neither game ever lets one enemy hide another |
| Accent pool under the target, quiet dim on the rest | **both** | option B's two "neither game" additions, accepted for both |
| Cycling in on-screen order, lit rows/tiles, yielding panel | **both** | shared plumbing (CHK-020) |
| `AvailableCommand.targeting` / the Hastega fix | **both** | a display bug in shared menu logic (CHK-020) |

`ffx-vs-ffx2-presentation.md` §9 row 2 is explicit that the two chromes must
never be mixed, so the cursor takes a `chrome` and each HUD states its own.
`tests/unit/ui-target-cursor.test.ts` asserts FFX-2 never draws the hand and
FFX never draws the flower.

## What is on screen now

**The HUD** (`src/ui/ffx/TargetCursor.ts`, shared by both games):

- a four-corner bracket **scaled to the figure's own bounds** — the tight alpha
  box of the pose actually showing — gold `#F2C21E` enemy, green `#7EE8B0`
  ally, blue `#8FD0F0` self, each stroke over an ink underlay;
- an ink **name plate under the target** with its letter tag as a chip, and a
  one-line note when one is knowable ("already Hasted", "HP full");
- the **hand** (FFX) docked 21 px clear of the silhouette at 1920, withdrawn
  entirely on a multi-target cast; the **flower** (FFX-2) instead;
- a multi-target command brackets **every** target, flashes them together, and
  labels them "ALL ALLIES" / "ALL ENEMIES";
- arrow keys cycle in **on-screen left-to-right order**, not engine order;
- the targeted party rows and turn-list tiles light in sync, and the
  party-status panel yields while an **enemy** is aimed at (on an ally cast it
  stays lit and the rows go green instead — the approved frames' own rule).

**The field** (`src/engine/TargetHighlight.ts`, `PaintedActor`):

- a soft accent pool under each selected figure, or a halo **behind** it when
  it levitates and has no feet (a Yu Pagoda, Vegnagun's head);
- every non-target drops 26% in brightness and saturation, both sides of the
  field, restored the instant selection ends or is cancelled. A new
  `desaturate` shader uniform does the colour half; brightness alone reads as a
  lighting change and the eye still finds the saturated fiend.

**The formation** (`src/engine/Formation.ts` + `PaintedStage.relaxFormation`):

- the ground plan packs the fiends biggest-at-the-back, biggest in the middle,
  the rest alternating outward, clearance guaranteed by construction;
- then a **measured** pass finishes the job against the camera. This is the
  half that mattered. Measured live in Chapter 3, the ground plan put the aeon
  at x 2.03 z −8 and the Pagodas at x 1.27 and 3.33 — a clean spread on the
  ground — and on screen the aeon ran 771..1152 while the Pagodas sat at
  838..989 and 1035..1176, both inside it. Perspective undoes in the frame what
  the ground plan gets right, so the relaxation measures the real rectangles
  and pushes along world x by the deficit converted through each actor's own
  pixels-per-unit. It runs only in the opening seconds (the establishing camera
  move and the battle-start card), re-arms while the camera is still moving,
  and stops before the first command menu: **nothing on this field moves in
  answer to a command**, which was option D's idea and was not picked.

## Measured, before and after

`window.__pyrefly.targeting()` reports each combatant's screen rect, its
visible fraction and its occluders. Chapter 3 at 1600x900:

| | before | after |
|---|---|---|
| `yu-pagoda-left` | 0.00 (entirely behind the aeon) | **0.96** |
| `yu-pagoda-right` | 0.00 | **1.00** |
| `braskas-final-aeon` | 0.55 | **0.93** |
| `seymour-flux` (Ch 1) | 0.45 (behind Mortiorchis) | **0.97** |
| `mortiorchis` | 1.00 | 0.99 |

Two visibility numbers are reported, and the split is deliberate:

- `visible` counts **other combatants** only. This is what the x-ray fallback
  answers to, because fading the fiends in front of a target does nothing about
  a card sitting on top of it.
- `visibleInFrame` also counts the HUD panels that have declared themselves.
  This is the honest "can the player see it", and it is what the formation is
  relaxed against, so a fiend standing under the turn list is moved out from
  under it.

## Also fixed here

- **Hastega asked which ally to buff.** A party-wide cast arrives with an empty
  `command.targets` and three `validTargets` — indistinguishable from "pick one
  of these three" — so the menu opened a single-target cursor, bracketed one
  ally, and the engine then (correctly) buffed all three.
  `AvailableCommand.targeting` is now published by both engines (additive,
  optional; entry in `docs/CONTRACT-CHANGES.md`) and `resolveTargetMode`
  returns a new `'all'` mode. **No battle math, targeting legality or outcome
  changed** — only what the menu shows.
- **FFX-2's name plate printed the raw combatant id** (`yu-pagoda-c`) on a
  player-facing surface. It prints the display name now, and FFX-2's targeting
  uses the shared cursor with its own chrome rather than a second
  implementation.
- **Yu Pagoda's turn-list "letter tile".** The body-crop layer *was* emitted and
  the painting *did* load — `bodyCrop`'s estimate places a humanoid head near
  the top of the canvas, and a Yu Pagoda sits small in the middle of a padded
  square, so the crop framed sky and the ink monogram showed straight through
  it. `refineBodyCropFromAlpha` measures the loaded image and frames its real
  silhouette. A hand-measured `face-crops.json` row still wins.
- **The bracket corners rendered as solid squares** in the first capture of this
  pass: the ink underlay was a `box-shadow`, which follows the whole border box.
  It is a pseudo-element inheriting the per-side border widths now.

## Known remaining, and the open questions

1. **The Sensor card opens on top of the enemy it describes.** Aim at a fiend
   and `SensorPanel` opens over it; measured, that takes the target's
   `visibleInFrame` to 0 while `visible` stays near 1. The card is transient and
   follows the target, so no formation can avoid it — it needs to be placed
   clear of the aimed-at enemy. `SensorPanel.ts` belongs to the **ffx-hud**
   track, so it is reported rather than moved, and the card is deliberately
   excluded from the panel set the formation settles against (including it only
   reports the fiend the player is looking at as invisible).
2. **The party arc still overlaps.** Auron and Kimahri sit at 0.67–0.74 behind
   Tidus after the relaxation has done what the party lane allows. The approved
   frames draw the party close and overlapping, so this is the picked look
   rather than a defect; the x-ray fallback covers the rest, and every ally is
   unmistakable from its bracket, its green pool and its lit row. **Question for
   Bailey:** open the party arc further, or leave it as the mockups draw it?
3. **The FFX-2 field staging is still ours, not FFX-2's.** The open question in
   `docs/concepts/targeting/options.json` — FFX-2 canon puts the party on the
   right and the enemies on the left, and only option A staged it that way —
   **is still unanswered**. This track kept the house staging, as option B does.
   Bailey owes that yes/no.
4. **Vegnagun's parts.** Chapter 5 stages one part per formation link in the
   build as it stands, so the "four parts at once, each separately selectable"
   case could not be exercised live. The layout rule for it is written and unit
   tested (`tests/unit/engine/formation.test.ts`), and parts are leashed to
   their machine, but it wants a live check once the multi-part formation is
   reachable.

## Files

Engine: `Formation.ts`, `ScreenRects.ts`, `TargetHighlight.ts` (all new),
`PaintedArt.ts` (`measureAlpha`), `PaintedScale.ts` (`contentBox`),
`PaintedActor.ts` (`contentQuad`, `setSelectAccent`, `setDim`),
`shaders/PaintedShader.ts` (`desaturate`), `BattlePresenterStage.ts`
(`projectRect`, `visibility`, `visibilityInFrame`, `occluders`, `xray`,
`applyFormation`, `relaxFormation`), `HudPort.ts` (`TargetingPort`).

UI: `ffx/TargetCursor.ts`, `ffx/CommandMenu.ts`, `ffx/CommandMenuLogic.ts`,
`ffx/FFXBattleHud.ts`, `ffx/ffx-hud.css`, `ffx/portraits.ts`,
`ffx2/CommandMenu.ts`, `ffx2/FFX2BattleHud.ts`, `ffx2/ffx2-hud.css`,
`common/portrait.ts`.

Engine data: `battle/common/types.ts`, `battle/ffx/commands.ts`,
`battle/ffx2/targeting.ts` (all `AvailableCommand.targeting`).

App/debug: `app/screens/BattleScreen.ts`, `debug/api.ts`.

Tests: `tests/unit/engine/formation.test.ts`,
`tests/unit/engine/screen-rects.test.ts`, `tests/unit/ui-target-cursor.test.ts`.

Screenshots and the measured report: `docs/screenshots/fix3/targeting/`.
