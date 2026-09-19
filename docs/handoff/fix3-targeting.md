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
- **After a party Switch, the member coming in was never on the field.** Found
  while verifying ally targeting, and the worst form of Bailey's complaint:
  `PaintedStage.stage()` only builds actors for the active three, so a benched
  character deliberately has none, and the `switch` event handler's
  `stage.actor(inId)` was always `undefined` — the fade-in ran on nothing and
  the outgoing figure was removed with nobody put in its place. Verified live
  in Chapter 1: after one Switch the engine read
  `activeIds = ["auron","yuna","kimahri"]` while the field held
  `["yuna","kimahri", …]`, and aiming a Potion at Auron drew a bracket over
  empty ground. The handler stages the incoming member on the slot the outgoing
  one vacated (`BattleStage.slotOf`, additive and optional).
  **FFX only** (AGENTS.md rule 14): Switch is FFX's own mid-battle party swap
  [visual-bible §3.3, "The Switch flow"]; FFX-2 has a fixed party of three, no
  equivalent command, and emits no `switch` event. Regression test in
  `tests/unit/presenter-events.test.ts`.

## Fix pass (2026-09-19) — what the adversarial verifier refuted, and the answers

An adversarial pass drove the real game (its own vite server, GPU mode, real
key presses) and refuted the first attempt on four counts. All four are
answered, each pinned by a test, and re-verified with fresh captures in
`docs/screenshots/fix3/targeting/` (`report-fix.json`, `report-ffx2.json`).

### 1. The bracket collapsed to four closed squares on every multi-target cast

**Bailey's own frame, still broken.** Two mistakes, and it took both:

- `TargetCursor.reposition` set `dim = group ? this.entries.length > 1 : …`,
  so **every** target of a party-wide cast wore `.ffx-target--dim` — the
  subordinate treatment, on the three figures the spell was actually for;
- the rule behind that class was
  `.ffx-target--dim .ffx-target__c { opacity: .4; border-width: 2px }`, and
  `border-width` is a **shorthand**: it sets all four sides, closing each
  L-shaped corner into a small square. The file's own comment claimed this
  defect had been fixed in 8653b63; what was fixed there was the *underlay*
  (a `box-shadow`, which follows the whole border box). The shorthand was a
  second, separate instance of the same mistake in the same subtree.

Now a group cast dims nobody, and the stroke weight travels as `--ffx-bw`, a
custom property. No rule under `.ffx-target` may write `border-width` again —
`tests/unit/ui-target-css.test.ts` reads the stylesheet and fails if one does,
because jsdom does not cascade the shorthand and every DOM test passed while a
real browser drew squares.

Measured after, at 1280x720 / 1600x900 / 2000x1000 in all three FFX chapters:
`border = ['3px','0px','0px','3px']`, the underlay identical, colour
`rgb(126,232,176)` (ally green), opacity 1, and zero `.ffx-target--dim`
elements on the cast.

### 2. `visibleInFrame` was 0 for every combatant in every FFX battle

The debug surface required by task item C — and the number the formation is
relaxed against — was dead. Both HUDs handed `setPanels` the **roots** of their
panels, and two of those roots, the advisor's `.mad` and the guide's `.sgd`
(each `position:absolute; inset:0`), are full-viewport **transparent
wrappers**. Measured live they reported 0,0,1600,900, so allies standing in
the open came back 100% covered and `relaxFormation` could tell no fiend from
another.

`src/ui/common/panel-rects.ts` applies the rule a player's eye uses: **a
wrapper that paints nothing hides nothing.** It walks each root and takes the
first descendant that actually paints (a background colour with real alpha, a
background image, a backdrop filter, a visible border). Both HUDs go through
it.

A second half: panels were published only on an engine sync, so between two
syncs the answer went stale — measured with the command list open and nothing
aimed at yet, Tidus was 56% behind the list while `visibleInFrame` still said
1.000. Both HUDs re-measure on a 250 ms timer now (`republishPanels`).

**GAME-AWARE: both games** — shared measurement plumbing behind a defect
(critic CHK-020). FFX-2 was the mirror image of the same bug: `visibleInFrame`
came back *identical* to `visible` in Chapters 4 and 5, i.e. the FFX-2 field
was never measured against its HUD at all, and the advisor card and guide rail
were missing from its panel list entirely. Both added.

### 3. A selected enemy was 36–40% under the turn list

Requirement B(1) caps HUD coverage of a targetable enemy at 25%.
`relaxFormation`'s panel clause was written down and never ran: the loop found
a fiend below its threshold and then asked `occludersOf`, which only knows
about **combatants** — so a fiend standing squarely under the turn list found
nothing to move away from and stayed there. A second clause now nudges an
enemy out from under whichever panel covers most of it (`worstPanelFor` in
`ScreenRects.ts`, `PANEL_CLEAR = 0.78`, enemies only — see 4).

HUD coverage of the **selected** enemy after, recomputed in-page from the real
visible panels by a 24×24 sample grid over the figure's rectangle:

| | 1280x720 | 1600x900 | 2000x1000 |
|---|---|---|---|
| `yu-pagoda-right` (was 0.359 / — / 0.399) | **0.000** | **0.000** | **0.000** |
| `yu-pagoda-left` | 0.000 | 0.000 | 0.000 |
| `braskas-final-aeon` (was 0.210) | **0.000** | **0.000** | **0.000** |
| `seymour-flux` | 0.007 | 0.000 | 0.007 |
| `mortiorchis` | 0.042 | 0.000 | 0.042 |
| `bahamut` (Ch 4) | 0.083 | — | 0.094 |
| `vegnagun-tail` (Ch 5) | 0.000 | — | 0.000 |

The **Sensor card** was the other half of that same capture: it opened
squarely across the pagoda it was describing, over the bracket and over the
name plate. It is pinned at grid 436,166 — in the lane the fiends stand in —
and it follows whatever the player aims at, so no formation can avoid it.
`steerSensor` slides it to whichever side of the target has room
(`src/ui/ffx/sensorSteer.ts`, pure grid geometry,
`tests/unit/ui-sensor-steer.test.ts`) and clears the steer the instant the
cursor closes, so a player who never opens a target cursor sees the card
exactly where it has always been. **GAME-AWARE: FFX only** — the Sensor plate,
the ability and its `I` fold key are FFX's [visual-bible §3.5]; FFX-2 reads an
enemy out on the boss gauge strip along the top, which never enters the lane
and has nothing to move. The test asserts the FFX-2 HUD neither imports the
steer nor uses its property.

### 4. The targeted ally is ~45% behind the command list

**Not changed, because the approved end state draws it that way** — and that
is the honest answer rather than a dodge. Measured off the approved frame
itself, `docs/concepts/targeting/b-ring-and-dim/s1.png`, the command list runs
across the party's legs and Yuna's own rectangle is **~48%** behind it there.
Our build measures 0.458 at 1280x720 and 0.458 at 2000x1000 on the same cast:
the picked look, to within a couple of points. Requirement B(1)'s 25% cap is
written about *targetable enemies*, and that is what clause 3 enforces.

What makes the ally unmistakable is what the mockup uses, and all of it is now
live: the bracket (fixed above, and drawn **over** the list), the green party
row, the lit turn-list tile and the "ALL ALLIES" label. Measured on the
Hastega cast in Chapters 1 and 3, every target reports `ringed: true, dim: 0`
and every non-target `dim: 0.26`, on both sides of the field.

**Open for Bailey:** open the party arc further than the mockups draw it, or
leave it as drawn? Unchanged from the first pass.

### 5. Three of five chapters had never been driven by anyone

Driven now, with real key presses, and captured:

- **Ch 1 Seymour Flux** — the enemy cursor walks `mortiorchis` →
  `seymour-flux`.
- **Ch 2 Yunalesca** — **there is no enemy cursor to drive, and that is FFX.**
  She is the only enemy, and `resolveTargetMode` returns `auto` for a single
  legal target, so Attack confirms without a cursor. The ally cursor and the
  party-wide cast are captured instead; her own visibility is 0.82–0.86 with
  0.000 HUD coverage. Nothing about targeting legality was touched to get
  this answer.
- **Ch 3** — walks `yu-pagoda-left` → `braskas-final-aeon` →
  `yu-pagoda-right`, all three at 0.000 HUD coverage.
- **Ch 4 Bahamut** and **Ch 5 Vegnagun** — the ATB's first actor is a White
  Mage with no Attack row, so the walk plays a real turn (Cure on an ally) and
  takes the next actor's menu. Captured with the **flower** reticle present
  (1) and the **hand** absent (0), the Active/Wait chip reading "ACTIVE — ATB
  RUNNING", a gold L-shaped bracket and the ink plate: rule 14 verified on
  screen, not only in a unit test.

One craft defect fell out of finally looking at Chapter 5. The flower ring was
sized at 1.24× the target's longest side, and Vegnagun's tail projects as a
wide sprawling rectangle, so the ring came out about 800 px across with its
six petals sitting on Rikku's and Paine's faces on the far side of the field.
The approved frame `s3.png` draws the ring at about 1.1× the part it marks, so
the ring follows the figure up to a cap of a third of the shorter screen edge
and no further. **FFX-2 only** — FFX docks the hand instead.

### How this pass was verified

Its own vite dev server on port 5612 (started and stopped here), Playwright
headless in **GPU mode** (`PYREFLY_BROWSER=gpu`) for every run — no black or
blank canvas, no fallback to SwiftShader needed. Real key presses throughout
(ArrowUp/ArrowDown/Enter/Escape); no command was ever issued through the debug
API. The probes are throwaway, under `critic/scratch/`
(`fix-targeting-p2.mjs`, `fix-ffx2-targeting.mjs`), and no product code lives
in them.

One trap worth recording for whoever drives this next: **Escape at the root
command list opens the pause screen**, and every later ArrowDown then walks
the pause menu instead of the command list. That is exactly how the first run
of this probe convinced itself Chapter 3 had no Attack row.

`npx tsc --noEmit` clean; `npm test` 140 files / 4045 tests green;
`node tools/orphans.mjs` lists neither new module.

## Known remaining, and the open questions

1. **The Sensor card opening on top of the enemy it describes — FIXED** in the
   fix pass; see section 3 above. It is steered clear of the aimed-at figure by
   `FFXBattleHud.steerSensor` + `src/ui/ffx/sensorSteer.ts`, rather than by
   moving `SensorPanel.ts`, which belongs to the **ffx-hud** track and is
   untouched. The card still stays out of the panel set the formation settles
   against: it opens *because* the player aimed, so feeding it in would only
   report the fiend they are looking at as invisible.
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
   build as it stands — the fix pass drove Chapter 5 with real key presses at
   two resolutions and the field holds `vegnagun-tail` alone at battle start —
   so the "four parts at once, each separately selectable" case *still* could
   not be exercised live. Reaching the multi-part phase means playing the tail
   down, which no automated walk here does. It is the one requirement in task
   item B(1) with no live measurement behind it. The layout rule for it is written and unit
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

Presenter: `engine/BattlePresenterEvents.ts`, `engine/BattlePresenterPorts.ts`
(the Switch staging fix).

Tests: `tests/unit/engine/formation.test.ts`,
`tests/unit/engine/screen-rects.test.ts`, `tests/unit/ui-target-cursor.test.ts`,
`tests/unit/presenter-events.test.ts`.

Screenshots and the measured report: `docs/screenshots/fix3/targeting/`.
