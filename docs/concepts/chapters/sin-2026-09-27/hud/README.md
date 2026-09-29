# Sin: HUD mockups, package M (FFX only, 2026-09-29)

Option frames for the new HUD surfaces of the two Sin chapters (XVII the Fins and the Core, XVIII the Face), from
`docs/plans/sin-two-chapters-plan.md` section 3.2 and REVIEW must-change 4. **Nothing here is built or wired.** No file
under `src/` changed. These are options, not approved art or an approved HUD (AGENTS.md rule 9).

**Game case (rule 14): FFX only.** CTB, the Trigger Command order to Cid, the airship range and Cid are FFX; FFX-2 has
none of them (`research/ffx-sin.md` section 0.3). *Absence test:* no frame carries the FFX-2 accent, mirrored slabs or an
ATB bar, and nothing here applies to an FFX-2 chapter.

**Who picked.** Bailey delegated the pick to the driver for tonight (D-279), so **one option per surface is marked
recommended, and package H builds that one.** These are the driver's picks, not Bailey's words: the tile `reaction` stays
empty, and the recommendation belongs under `inferred` until Bailey reacts.

Open [`sheet.html`](sheet.html): one self-contained page (JPEG data URIs, 3.2 MB, no other file needed), phone-readable.
Full-size frames are in `frames/` (`<scene>-1600.jpg` at 1600 × 900, `<scene>-390.jpg` at 390 × 844, drawn at 2x).

## What is real and what is not

- **The game's own CSS** is linked by relative path (`src/ui/inkgold/tokens.css`, `slabs.css`, `src/ui/ffx/ffx-hud.css`,
  `src/ui/common/phone-battle.css`, `src/ui/ffx/phone-hud.css`, `phone-hud-parts.css`). The turn list, party cards,
  command cascade, the phone rail, chips and grid, and the Trigger order widget are the shipped classes with the
  shipped markup, not a redraw. The game loads its fonts from `/fonts/`, which a `file://` page cannot, so `mk.css`
  declares the same four families from `public/fonts/`.
- **New pieces** are drawn in `hud/src/mk.css` in real pixels on the 14 px type floor (CHK-003) in the game's tokens
  (ink, paper, gold, the telegraph amber and red, MP sky).
- **Plates:** Overdrive Sin's round-3 painting, stages 2 and 4 (`src/plates/sin-stage-2.jpg`, `-4.jpg`, from
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/final/`, our own art) and the Evrae deck backdrop
  (`src/plates/evrae-deck.jpg`, from `public/art/backdrops/evrae-airship-deck.png`). Sprites and portraits are the game's own.
- **Not art:** the Fins are grey stand-in silhouettes (the plan's placeholder), labelled on every frame that has one. No
  retail image is used anywhere (rule 8).
- **Illustrative:** party HP, MP and status lists. **Our estimate:** Giga-Graviton on Sin's 13th turn (S-1: the sources say
  12 or 13; every M1 frame says so), and which turns each mouth stage covers (the sources give the stages, not the turns).
- **Not a screenshot of the running game.** It is a composite. The stand-in guide rail (top-left on the desk) marks the
  shipped guide card's space; the move advisor's card is not drawn (see "Placement" below).

## The five surfaces and the pick for each

| # | Surface | Options | **Recommended** |
|---|---|---|---|
| M1 | Link 4's clock (Sin's turns left before Giga-Graviton) | A mouth ring, B tagged turn order, C painted jaw with a pip strip | **A, the mouth ring** |
| M2 | "What Negation took" (research section 11 item 4) | A banner, B ghost chips | **A, the banner** |
| M3 | The link strip in Chapter XVII | A three pips with the carry bracket, B nothing new | **A, the strip** |
| M4 | The Fins' charge and range readout (links I to III) | A shipped surfaces only, B a Fin plate, C a Fin plate with counters | **B, the Fin plate (range and charge)** |
| M5 | The Trigger order widget without volley pips | Before (the fault), A cost line only, B cost line plus a race line | **B, the race line (collapses to A when the core is not charged)** |

M1 to M3 are the plan's own numbering. M4 is the driver's "charge and range readout" for links I to III, and M5 is REVIEW
must-change 4 ("the widget without pips"), so both are added here and named after those requests.

### Frames

`m1a-t8`, `m1a-t12`, `m1b-t8`, `m1b-t12`, `m1c-t8`, `m1c-t12` (turn 8 = mouth open 2 of 3; turn 12 = fully open, one
turn left), `m2a`, `m2b`, `m3a`, `m3b`, `m4a`, `m4b`, `m4b-far`, `m4c`, `m5-before`, `m5a`, `m5b`.

## The recommendation, with reasons, and what package H builds

Positions are real pixels at 1600 × 900 (divide by 2.5 for the 640 × 360 stage grid) and at 390 × 844 for the phone.
Fonts and colours are the game's tokens: Chakra Petch (display), Rajdhani (numerals), Exo 2 (text), Cormorant Garamond
italic (names); ink `#0b0a12`, paper `#f4f1e8`, gold `#e3b94a`, alarm red `#e8412e` (the telegraph's own), sky `#7fc6e8`.

### M1: A, the mouth ring

**Why.** It is the only option that shows the whole race on every turn; B's frame at turn 8 has no 13th row in the list
yet, so the number appears only when the end is two rows away. The centre numeral is the biggest glyph in the frame and
reads on a phone (C's 13 pips shrink to 20 px each). It reads four flags and edits nothing shipped, and its length
follows `sin.gigaGravitonTurn`, so the Steam check for S-1 redraws it with no art change.

**Reads** (`src/battle/ffx/ai/overdrive-sin-rules.ts`, all published every Sin turn): `sin.turn` (Sin's turns taken),
`sin.turnsLeft`, `sin.gigaGravitonTurn` (N: 12 or 13), `sin.mouthStage` (0 pulls, 1 to 3 opening, 4 fully open).

**Layout.**
- **Ring.** N segments (13 by default), grouped **3 pulls + (N-4) melee + 1 last**. Segment k is lit when `k <= sin.turn`;
  the segment for `sin.turn` gets a 3 px white outline. Colours: pulls ivory `#f4f1e8`, window gold `#e3b94a`, last
  `#e8412e`. Lit opacity 1, unlit 0.26, the last one 0.6. From `sin.turnsLeft <= 1` the last segment pulses (opacity
  0.55 to 1 over 0.5 s, the telegraph's own beat). Gaps 3.2 degrees. The disc behind the numeral is `rgba(11,10,18,.84)`.
- **Centre.** `sin.turnsLeft` in Rajdhani 700 (34 percent of the ring's diameter), white, `#ff6b57` at 1 or 0; caption
  "TURNS LEFT" in Chakra Petch 14 px, 0.05 em.
- **Desk.** Ring 190 px at (420, 30). Under it at (420, 230), width 236: a gold skewed chip ("MOUTH SHUT", "MOUTH OPEN 1 OF 3"
  to "3 OF 3", "MOUTH FULLY OPEN", from `sin.mouthStage`) and an ink slab with the S-1 line. Top-left stays with the guide rail.
- **Phone.** One ink slab, `left/right: 10`, `top: 250` (mid-field, over the city, between the head and the party, clear of
  the rail at 10 to 62 and the party chips from 486), 96 high: ring 84 px (numeral only) then a gold chip
  ("OPEN 2 OF 3"), "GIGA-GRAVITON IN n" (Chakra Petch 15 px, 0.08 em) and the S-1 line at 14 px.
- **S-1 line:** "Giga-Graviton on Sin's 13th turn: our estimate (the sources say 12 or 13)"; phone "13th turn: our estimate (12 or 13)".
  Show it while S-1 is unsettled (one constant, dropped when Bailey schedules the Steam check).

**Held constant, not part of the vote:** the Gaze counter pill (six diamonds, `sin.gazeCounter`, threshold 6) is drawn the
same in every M1 option, desk (420, 352) under the stack, phone (10, 68). Build it as drawn unless Bailey objects.

**Runners-up.** B is the cheapest (a `.ig-ctb__tag` on Sin's tiles, `mk-turn` gold, and a red row that reads GIGA-GRAVITON);
C carries the same inputs on a thinner slab (Sin's name, stage chip, 13 pips 3 + 9 + 1) and is the fallback if the ring feels heavy.

### M2: A, the banner

**Why.** It names the statuses in words (row dots are 5 to 7 px, colour only). It says three things in one place: what the
party lost, what the Fin lost (Negation strips both sides), and what it cured (Poison, Petrify, Slow, Darkness: the mercy
research section 11 item 4 asks the HUD to show). It uses the banner slot on the phone; B's ghost chips need three columns
over the party cards and crowd the field once a member loses three statuses (Yuna in the frame).

**Reads** `sin.negation.lastTaken` (published by package F for the near counter and package G for the Core's): the status
ids removed, per combatant.

**Layout.** An ink slab (`rgba(11,10,18,.92)`), skewX(-12deg), gold left edge 5 px. Head "NEGATION" (Chakra Petch 14 px, 0.26 em,
gold). Up to three lines, each a small chip and the names: `PARTY LOST` (red chip) the buffs the party lost, merged across
members with a count ("Protect ×2"); `FIN LOST` (paper chip) the Fin's own Breaks; `CURED` (sky chip) the party's Poison,
Petrify, Slow and Darkness that Negation removed. A group with nothing in it is not drawn. Desk: (420, 44), 610 wide, 18 px
lines. Phone: `left/right: 10`, `top: 70`, 15 px lines. Hold: until the next action banner replaces it, at most 3 s (our estimate).

### M3: A, the strip

**Why.** The game has no save between the links, so the faithful retry (the plan's default) sends a player who loses link III
back to the Left Fin: the strip is where "III of III, and it all carries" is said. It is a long chapter (140 to 190 turns
before measuring). It needs no engine contract: the strip reads which foes are on the board (`left-fin` is I, `right-fin`
is II, `sinspawn-genais` or `sin-core` is III). B (the existing reveal plate, `EnemyGroupDef.headline`) is the free fallback.

**Layout.** Three skewed tags: done (dim, underlined), current (gold), next (ink). Under them a 12 px gold bracket and one
caption on an ink chip: "One party state · HP · MP · status · Overdrive carry" (phone: "One party state carries"). Desk (410, 52),
tags 15 px, 0.12 em. Phone: `left/right: 10`, `top: 70`, tags "I Left Fin", "II Right", "III Core". Chapter XVIII shows no strip.

### M4: B, the Fin plate (range and charge)

**Why.** "Pull back before the Fin acts" is the whole Gravija answer, and it is time-critical. In A the cue is a 5 px turn-list
dot (9 px on the phone, under the 14 px floor) and a banner that leaves after about 1.4 s. B says the range in words and
holds the charge state where the player is looking. It adds no hidden information: it reads only `airship.range` and
`sin.fin.charged`. C shows two counters the game keeps secret (`sin.fin.hits`, `sin.fin.regularActs`), which changes what the
player knows about the fight and needs Bailey's own yes (rule 10). It matches the Sensor text ("it charges Gravija; the Pull
Back command avoids it") for a player who has not opened the panel.

**Reads** `airship.range` (`'near'` or `'far'`), `sin.fin.charged`, and the Fin named by `airship.countsTargetings`.

**Layout.** An ink plate, skewX(-12deg), blood-red left edge 5 px: the Fin's name (Cormorant italic 30 px) and a range chip
(NEAR gold, FAR sky; Chakra Petch 15 px, 0.2 em). **While `sin.fin.charged`:** a red pulsing bar
(`#e8412e`, 0.5 s) "CORE CHARGED · GRAVIJA ON ITS NEXT TURN". **At FAR:** a quiet line, "The core does not charge at range"
(research 5.1.2, three sources). At NEAR and uncharged the bar and the line are both absent. Desk (820, 56), 470 wide.
Phone `left/right: 10`, `top: 70`, name 24 px, bar text "CORE CHARGED · GRAVIJA NEXT". The turn-list charge dot and the
stage-2 screen-edge glow the game already ships stay as they are (A is what B builds on).

### M5: B, the race line (collapses to A)

**Why.** The shipped widget (`AirshipOrders.ts#openWidget`) reads a missing `airship.missilesLeft` as the full rack, so in a Fin
fight it would say an order costs "1 volley" with three full pips, when Cid fires no missiles (S-19): frame `m5-before` is
that fault. The pips must go either way. A is the minimum. B adds the one line that answers the only question that matters
here: does Cid move before the Fin? The line shows only while `sin.fin.charged`, so on every other turn the slab is exactly A.

**Layout** (the shipped `.ffx-airship-order__slab`, unchanged classes):
- Drop `.ffx-airship-order__left` (the pips and "Volleys left n") when `airship.missilesLeft` is absent. Evrae always sets the
  flag, so **Evrae's slab does not change**.
- Cost line: "Turn now · Cid's next turn" (the "· 1 volley" clause goes with the flag).
- Race line (new class `.ffx-airship-order__race`, 6.4 grid px = 16 px; 14 px on the phone): green `#1f6b34` on ivory
  "Cid moves before the Fin: its Gravija whiffs"; when Cid's next turn comes after the Fin's, red `#a3241a`
  "Cid moves after the Fin: too late" (modifier `--late`, not drawn here). The order comes from the turn forecast the move advisor already
  uses (`src/engine/tactics/airship-orders.ts`), passed to `open()` as one more argument.
- The ORDER marker on Cid's turn-list tile: the shipped chip beside his name on the desk. On the phone the rail hides
  names, so dock a gold ring and a 14 px tag ("ORD") on his tile.

## Placement: what the builder must check

- **The strategy-guide rail** owns the desk's top-left (about x 50 to 380, y 85 to 280 at 1600 × 900) while the guide is on,
  so every desk slab here sits to its right (x 410 or more). The frames draw a stand-in guide rail so this is visible.
- **The move advisor's card** takes the best free box (`hudSafeZones.ts#solveBox`) around every selector listed in
  `hudAvoidSelectors.ts`. Each new slab's **solid child** (never an `inset: 0` wrapper) must be added to that list, or the
  advisor will land on it. This file is package H's, not package M's.
- **On the phone** the new slabs sit between the rail (10 to 62) and the party chips (486 to 548), inside the field: M1 and
  the Fin plate are the two that cover part of the painting, and both leave the boss's face clear in these frames.
- **Acting fade:** `.ffxhud--acting` fades the cards to 0.16 while an action plays (`ffx-hud.css`). Decide per slab whether
  it fades (the clock should not: it is the one thing a player must read during a turn).

## Faults left (an agent's look, not a judge's)

- The Fin silhouette is crude on purpose (a stand-in). At 1600 × 900 its label is small type at the foot of the plate.
- **M2-B on the desk:** the ghost chips overlap the party sprites. That is a fair picture of B's cost.
- **M1 on the phone:** the slab covers a strip of city. Nothing of the boss is hidden.
- The shipped guide rail is a stand-in, drawn to show its space, not its exact look.
- Portrait crops in the turn list are the object-position of the `.ig-ctb__tile img` rule, not the game's measured
  `face-crops.json` head crops, so a face may sit a little high or low.
- Party HP, MP and gauge values, and the status chips on the party rows, are illustrative.

## Open for Bailey (nothing is built until he answers or the driver's picks stand)

1. The five picks above (the driver's, D-279). Reactions to record in `docs/target/targets.json` when Bailey names them:
   liked, disliked, must remain, must change, undecided.
2. **The Gaze pill** (six diamonds): held constant here; a fourth small surface Bailey has not been asked about.
3. **M4-C** (counters that the game keeps secret) is a showpiece option that needs its own yes.
4. **S-1** (12 or 13): the ring redraws itself; only the Steam check settles it (D-266).
5. The Fin art does not exist yet: every Fin frame is a stand-in silhouette.

## Re-render

From the repo root, headless Chromium from `file://` (no dev server, no build):

```
PYREFLY_BROWSER=gpu node docs/concepts/chapters/sin-2026-09-27/hud/src/render.mjs            # every scene
PYREFLY_BROWSER=gpu node docs/concepts/chapters/sin-2026-09-27/hud/src/render.mjs m4b m5b    # some
python docs/concepts/chapters/sin-2026-09-27/hud/src/build_sheet.py                          # rewrites sheet.html
```

`src/hud.html?id=<scene>&mode=desk|phone` is one frame; `src/hud.js` defines the scenes (`SC`).
`public/art/` (the party sprites and portraits) must exist locally, as it does on this disk.
