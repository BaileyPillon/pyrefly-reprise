Nothing is built; options for Bailey.

# Panels: more of P14 (options round, 2026-09-30)

**Bailey, 2026-09-30:** "show me more of P14 panels I'm interested. Is that like persona style? How does persona do
it?"

This round raises the fidelity of one option Bailey is interested in (AGENTS.md rule 9, "raise the fidelity of the
choices"). P14 "Panels" came from the perspectives round (`../perspectives-2026-09-27/`): three angled panels as the
resting battle screen. Here panels are explored both ways: as the resting screen (PA, P14 redone properly) and, above
all, as **moments** (PB to PF). A pick approves only what Bailey names.

**Every image is a COMPOSITE**: assembled in 2D (Python + PIL) from the real-engine frames already on disk and the
shipped paintings. No new art, no GPU render, no `src/` change. Every word on screen comes from our own data or UI
(`src/`), never invented. Each file's sources, when it would play, how long and one weak point are in
[`frames.json`](frames.json).

## Start here

- [`sheet-all.jpg`](sheet-all.jpg): every concept, both chapters side by side, labelled, each tile tagged COMPOSITE
  with what it is made of.
- The two clips: [`motion/PB-ffx-ch1.mp4`](motion/PB-ffx-ch1.mp4) and [`motion/PB-ffx2-ch4.mp4`](motion/PB-ffx2-ch4.mp4)
  (2.5 s each, 1600x900), with five-frame strips beside them.
- Chapters: **I** `seymour-flux` (FFX: Tidus, Yuna, Kimahri vs Seymour Flux and Mortiorchis) and **IV** `ffx2-bahamut`
  (FFX-2: White Mage Yuna, Dark Knight Rikku, Warrior Paine vs Bahamut).

## What P14 was, and what the judges said

P14 split the resting battle screen into three slanted panels (the actor close, the stage, the boss close). Three
blind judges gave it eye candy 6.83, readability 5.0, "not cardboard" 4.67 (`../perspectives-2026-09-27/judges/`):
"VS-screen energy ... great as a two-second intro, exhausting as the screen I stare at every turn"; "the menu sits on
Tidus's portrait and the health bars on the villain's face"; "Rikku is sliced in half by a border". One judge said
never to leave a triptych on screen as the resting state; another called it "slick trailer material" with the fight
"squeezed into the middle panel".

## The Persona grammar we borrow (and what we do not)

The working description in this round's brief: Persona uses comic panels and cut-ins mostly as **punctuation** on big
moments (a weakness hit or a critical, a hand-off, the all-out finisher, the victory card), with a normal 3D battle
view in between. That description is being sourced separately; nothing below depends on more than it. Each concept
names which beat it borrows. We borrow the grammar (cut-ins as punctuation, diagonal splits, reaction shots), never the
trade dress: no red-and-black ransom-note lettering, no Persona logos, shapes or characters. The dress is our own Ink
& Gold (`docs/handoff/presentation-ink-and-gold.md`): ink, paper, Yevon gold in FFX chapters, pyre pink in FFX-2
chapters, blood red for enemies only, slabs slanted 12 degrees (FFX leans `/`, FFX-2 leans `\`, as the two HUD skins
do), Cormorant Garamond italic for names, Chakra Petch for labels, Rajdhani for numbers.

## At a glance

| # | Concept | When it plays | How long | Build | Art to do it properly | Game case |
|---|---|---|---|---|---|---|
| PA-a | Comic page master, three slashes | the resting command screen | while choosing | medium to large (new battle layout) | busts per member and per FFX-2 dressphere, boss busts | ours, both |
| PA-b | Stage with two insets | the resting command screen | while choosing | medium | as PA-a, smaller | ours, both |
| **PB** | **Cut-in band** | FFX: an Overdrive. FFX-2: a chain reaching 5, 10, 20 | 2.5 s | **small** | an eyes close-up per character (stand-ins exist) | ours; the word is per game |
| **PC** | **Reaction panels** | a boss's signature attack | about 1.2 s | medium | bracing faces per member, boss wind-up poses | ours, both |
| PD | Victory card | the results page | until CONFIRM | small to medium | none for FFX (poses exist) | FFX poses; Ch IV canon: no pose |
| PE | Turn panel | when a turn starts, docked while choosing | while choosing | small to medium | busts per FFX-2 dressphere | ours; FFX left, FFX-2 right |
| PF | The move as a comic strip | an Overdrive or signature skill | about 2 s | medium | eyes + attack + boss hurt per move (mostly exist) | ours; FFX-2 has no Overdrive |

Build sizes are rough. Anything that touches the presenter, the camera or the global battle layout is shared
presentation core: a focused review before the deploy and a deep review after (AGENTS.md, Release).

## PA · Comic page master (P14 redone), as the resting screen

`frames/<chapter>/PA-a.jpg`, `frames/<chapter>/PA-b.jpg`

- **What it is.** (a) Three vertical slashes: the actor close on the left with the command list in its lower half, the
  stage in the middle, the boss close on the right, and the HUD moved into P21's two bands (turn order, help and boss
  plate on top, the party rows below), the most readable desktop layout in that round (P21, readability 7.83). (b) One
  full-bleed stage panel with two inset panels, the actor lower left and the boss upper right; the HUD stays close to
  today's (menu raised above the actor inset, turn order along the top edge).
- **What changed from P14.** No HUD sits on a face; the party rows are whole and readable; no member is cut by a
  gutter; the boss and the actor each have one clean close-up; in FFX-2 the gutters lean `\` like the FFX-2 skin and
  the bottom band carries today's real FFX-2 rows (ATB gauges, dressphere tiles).
- **When and how long.** Every party turn, for as long as the menu is open.
- **Persona grammar.** This is the one concept that is *not* Persona's grammar as described: it keeps panels on screen
  at rest, which the judges already said tires them. It is here because P14 was this, done as well as we can.
- **Cost.** PA-a: the stage stays the real canvas, shown through the middle panel's clip; the camera needs a rig that
  fits the party and the boss into the middle 45 %; the close-ups are page layers (painted busts, not 3D shots); the
  HUD moves into bands (P21's band layout is itself unbuilt and unapproved). PA-b is cheaper: the stage is today's
  full frame, the insets are two page layers, and each chapter needs safe corners for them. Neither survives an
  upright phone (the phone pick stays P15).
- **Game case.** Ours in both games (no source uses panels). Per game: gold and `/` in FFX, pink and `\` in FFX-2; the
  turn-order strip is FFX only (FFX-2 has no queue, `research/ffx-vs-ffx2-presentation.md` §4.2). In PA-a FFX-2's menu
  moves into Yuna's panel on the left, a change to the approved FFX-2 skin (chrome anchored right).
- **Weak points.** (a) Still a triptych at rest: the fight shrinks to the middle 45 % of the width, and the close-ups
  are portraits that never change during the turn. (b) The insets cover about a quarter of the stage; a longer party
  line or a bigger boss collides with them. Chapter IV's close-ups are battle paintings enlarged (White Mage Yuna has
  no bust portrait), so they are soft.

## PB · Cut-in: the punctuation

`frames/<chapter>/PB.jpg` (the hold frame), `motion/PB-<chapter>.mp4` + `-strip.jpg`

- **What it is.** Over the battle (dimmed and softened, like the approved turn cut-in's backdrop), one diagonal band
  slashes in: a huge close-up of the actor's eyes, gold (FFX) or pink (FFX-2) brush-stroke edges that run ahead of the
  fill, ink flecks, and one line of our own words. It holds, then slides out along its own axis.
  - **FFX, Chapter I:** Tidus's Overdrive. The words are the shipped Overdrive name slab's two lines, set large:
    `OVERDRIVE` / `Spiral Cut` (`src/data/ffx/abilities/overdrive-tidus.ts`; his only unlocked Overdrive in the
    Gagazet build). The base is today's stage with the shipped Overdrive rig: the 260 ms letterbox and the held
    push-in (`src/engine/BattleMoments.ts`).
  - **FFX-2, Chapter IV:** a chain reaching 5. The words are our chain chip's, set large: `5` / `CHAIN ×1.65`
    (`src/ui/ffx2/ChainCounter.ts`; ×1.65 = `chainMultiplier(5)` = 1.40 + 0.05 × 5 in `src/battle/ffx2/chain.ts`).
    The base is the real-engine hit (Paine's slash, the engine's 131) from the M4 motion master.
- **When.** FFX: in place of today's Overdrive name slab (after the Swordplay bar, before the payoff). FFX-2: on the
  hit that takes a chain to 5, then 10 and 20 (the chip's own tiers), never per hit.
- **How long.** 2.5 s: band in over 0.22 s, a hold of about 1.5 s with a slow drift, out over 0.32 s. With reduced
  motion on: a cut in, the hold, a cut out (as D-212 already turns camera moves into cuts).
- **Persona grammar.** The closest to it: the cut-in as punctuation on a big moment, with the normal battle view
  before and after.
- **Cost.** Small, the cheapest here: one page layer (a rotated band with a clip reveal, brush-edge masks, the eyes
  image, the word in the house fonts) next to the existing `src/ui/inkgold/cutin.ts` and `wipe.ts`, plus two hooks
  (FFX: the Overdrive moment; FFX-2: the `chain` event's count). Presenter hook: focused review before the deploy.
- **Art.** An eyes close-up per character. Stand-ins exist for everyone in both chapters: the pause-screen paintings
  (`public/art/pause/*.2x.webp`: Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku, and FFX-2 Yuna, Rikku, Paine). The
  proper version is an eyes close-up painted per character in battle light.
- **Game case.** Ours in both, with a game-aware word: the Overdrive name in FFX (FFX-2 has no Overdrive command); the
  chain in FFX-2 (the chain is FFX-2 only, §5.1). FFX-2's ATB runs in real time, so under Active the battle clock
  (gauges and chain windows) must stop while the band is up; canon itself switches between Wait and Active during
  certain attacks (§4.2), which is the precedent. FFX's CTB waits anyway.
- **Weak points.** The eyes come from the pause paintings (Tidus's is a daylight grin), so they do not match the night
  battle. In FFX-2, anything longer than a beat must stop the clock or it costs the player the chain it celebrates.

## PC · Reaction panels on the enemy's big attack

`frames/<chapter>/PC.jpg`

- **What it is.** For about a second the screen becomes a manga page: the boss winding up (tall panel, telegraph red),
  the targeted member's face, and the stage below with the shipped banner line and the party rows, whose HP is about
  to move.
  - **FFX, Chapter I:** `Seymour Flux · USES LANCE OF ATROPHY ON TIDUS` (the ability's `messageTemplate`,
    `src/data/ffx/enemies/seymour-flux-abilities.ts`), his attack painting, and Tidus from the chapter's own painting.
  - **FFX-2, Chapter IV:** `Bahamut · CASTS MEGA FLARE` (`src/data/ffx2/enemies/bahamut-abilities.ts`), Bahamut with a
    charge drawn at the jaw, and Yuna from the chapter's own painting of her with the aeon.
- **When.** At the start of a boss's signature attack. The presenter already stages that beat for the telegraphed
  finishers (`BattleMoments.telegraph`: Total Annihilation, Mega Flare, the Ultimate Jecht Shot, Terror of
  Zanarkand); in FFX a named single-target blow such as Lance of Atrophy can use it too, with the target's face.
  Mega Flare is turn 12 of Bahamut's fixed loop, right after the 5-4-3-2-1 Countdown, so canon already builds it up.
- **How long.** About 1.2 s, then a cut to the hit.
- **Persona grammar.** The reaction shot: the threat, the face, the stakes, before the blow.
- **Cost.** Medium: a three-panel page layer (the stage is the live canvas through a clip), choosing the target's face,
  per-boss wind-up art. FFX-2: the clock stops for it, as PB.
- **Art.** Bracing faces per member (none exist; each chapter painting has one mood); wind-up paintings for bosses
  (Bahamut has none; Seymour Flux's attack painting is off-model next to his idle).
- **Game case.** Ours in both; the FFX-2 clock rule as PB.
- **Weak points.** Seymour's attack painting (wilder hair, torn robe) reads as a different design in a close-up;
  Tidus's tearful painting is too strong to reuse on every hit; Yuna's is calm (a small smile), not bracing.

## PD · Victory card

`frames/<chapter>/PD.jpg`

- **What it is.** The approved Ink & Gold results page, with its single portrait replaced by three angled panels, one
  per member. Values are the real ones (`src/data`), the layout is the shipped page's (`ResultsScreen.ts`,
  `results.css`).
  - **FFX, Chapter I:** the painted victory poses, pyreflies (Seymour Flux dissolves into pyreflies, §3.2), `Victory`,
    the chapter's first quip `...Okay. Next one.` (`src/story/scripts/seymour-flux.ts`), AP 10,000 ×3 PARTY, GIL
    6,000, Lv. 4 Key Sphere.
  - **FFX-2, Chapter IV, canon-true:** the girls do **not** pose after Bahamut (§2.2: "the girls do not perform a
    victory pose at all after Bahamut"; the chapter ships `victoryPose: 'hold'` and the silent results page). So the
    panels hold their battle stance, drained like the shipped silent page (grey stripe, greyed portraits, `Results`
    at 140 instead of `Victory` at 200, no quip, no count-up flourish): EXP 1,300, AP 15 per dressphere, GIL 1,000,
    Gris-Gris Bag (spelled as our data spells it; today's page prints "Gris Gris Bag", see "Found along the way").
- **When and how long.** After the victory poses (FFX) or the held stance (Chapter IV), until CONFIRM.
- **Persona grammar.** The victory card.
- **Cost.** Small to medium: one screen (`ResultsScreen.ts`, `results.css`, and the phone page in `resultsPhone.ts`).
  It replaces an approved tile, so it needs Bailey's yes like any new screen.
- **Art.** None needed in FFX: all seven FFX party members have a victory painting. FFX-2 poses vary per dressphere
  (Dark Knight Rikku has none), and the hold chapters use stance paintings anyway.
- **Game case.** FFX has victory poses (§2.1); FFX-2 withholds them after Bahamut and Shuyin (§2.2), and FFX withholds
  them in Zanarkand (§2.1), so the quiet card also serves Chapters II, V and XIII (Trema, our estimate).
- **Weak points.** The three victory poses are separate paintings with different scales and light, so they read as
  three cards more than one moment. Chapter IV's three panels are more ceremony than today's single greyed portrait;
  the quieter answer may be one panel.

## PE · Turn panel

`frames/<chapter>/PE.jpg`

- **What it is.** The approved turn cut-in (the ivory slab with the portrait, `YOUR TURN · CTB 1 OF 3`) no longer
  leaves: it docks at the screen edge and holds the command list, while the rest of the battle stays as it is, not
  dimmed or blurred, with the turn order and the party rows live. FFX: from the left, gold. FFX-2: from the right,
  pink, stopping above the party rows so the ATB gauges stay in view.
- **When and how long.** When a member's turn starts (a 0.18 s slide, the cut-in's slam), docked while choosing, out
  on confirm.
- **Persona grammar.** The hand-off: whose turn it is, said with a face.
- **Cost.** Small to medium: it extends `src/ui/inkgold/cutin.ts` / `TurnCutInLayer.ts` and moves the command menu
  into the slab. Today the cut-in plays only on each member's first turn and never delays input (PR-0061); a docked
  panel on every turn must keep that promise. FFX-2's right-hand side needs `cutin.ts`'s `side: 'right'`, which
  `src/engine/TurnCutIn.ts` notes misplaces the slab today.
- **Art.** Busts per member; per FFX-2 dressphere (White Mage Yuna has no bust, so her battle painting stands in).
- **Game case.** Ours in both (the cut-in is Ink & Gold chrome). FFX from the left, FFX-2 from the right, as each skin
  anchors its chrome; the FFX-2 right-hand cut-in was "not mocked yet" in the spec, and this is that mock.
- **Weak points.** It covers a third of the stage for the whole command input; long lists (Special, Items) must page
  inside a shorter foot.

## PF · The move as a comic strip

`strips/PF-<chapter>.jpg` (a 2x2 storyboard of the four beats as the player would see them)

- **What it is.** Over the dimmed battle, a comic page fills panel by panel: 1 the eyes (wind-up), 2 the move, 3 the
  impact on the boss, 4 the name splash across the finished page; then a 19-degree wipe (the house's screen-change
  wipe) and the damage lands on the live stage.
  - **FFX, Chapter I:** Tidus's Overdrive, `OVERDRIVE` / `Spiral Cut`.
  - **FFX-2, Chapter IV:** Rikku's `Darkness` (`src/data/ffx2/abilities/dark-knight.ts`: all enemies, ignores Defense,
    paid in HP; the Bevelle build's key move), labelled `RIKKU · DARK KNIGHT`.
- **When and how long.** About 2 s: eyes 0 to 0.35 s, move to 0.8, impact to 1.2, name to 2.0. FFX: every Overdrive.
  FFX-2: rationed (first use of a signature skill, or a finisher), with the clock stopped.
- **Persona grammar.** The finisher as a set piece.
- **Cost.** Medium: a page layer with four clipped panels, per-move composition data (which paintings, burst colours),
  and the rule that the page ends before the hit resolves so the damage number stays the game's.
- **Art.** Mostly exists: attack paintings for all seven FFX members, boss hurt paintings for Seymour Flux and Bahamut;
  the eyes as PB.
- **Game case.** Ours in both; FFX-2 has no Overdrive, so the strip goes on a signature skill.
- **Weak points.** Four stills stand in for a move the game animates; if the page hides the real payoff, the move
  loses its own animation. Rikku's eyes come from a small bust enlarged 3.3x (soft).

## Found along the way (not fixed here)

- **The shipped Chapter IV results page prints "Gris Gris Bag"** (no hyphen): the accessory has no item record, so
  `itemLabel` title-cases the id. Checked by running `src/ui/common/resultsMath.ts` (`itemLabel('gris-gris-bag')`
  returns `"Gris Gris Bag"`). Our data spells it Gris-Gris Bag. FFX-2 only.
- **The shipped `ffx2-bahamut/idle.png` has pale cut-out debris** at the neck spines and wing roots (next to the trapped
  white the perspectives round reported). A close-up magnifies it. A colour key to hide it was tried and dropped: it
  also ate the glowing neck scales.
- **P21's FFX-2 band mock** (perspectives round) lays the girls' rows as FFX-style `/` slabs; the approved FFX-2 skin
  leans `\`. PA-a uses today's real FFX-2 rows instead.

## Needs new art to be done properly

1. Eyes close-ups per character in battle light (PB, PF); the pause paintings are the stand-ins.
2. Bracing or reaction faces per member (PC).
3. Bust portraits per FFX-2 dressphere (PA, PE); White Mage Yuna has none.
4. Boss wind-up paintings (PC): Bahamut has no attack or cast pose; Seymour Flux's is off-model.
5. Optional: a matched set of victory poses for the card (PD), and a clean Bahamut cut-out.

## Questions for Bailey

1. Which beats should get panels: the cut-in (PB), reaction panels (PC), the victory card (PD), the turn panel (PE),
   the comic strip (PF)? Or panels at rest after all (PA-a or PA-b)?
2. For FFX-2: is freezing the battle clock during a cut-in acceptable (canon toggles Wait and Active by itself during
   certain attacks)?
3. For the quiet chapters (II, IV, V, XIII): three drained panels, or keep today's single greyed portrait?

## Method and files

- `frames/<ffx-ch1|ffx2-ch4>/<PA-a|PA-b|PB|PC|PD|PE>.jpg`: 1920x1080 JPEG q88.
- `motion/PB-<chapter>.mp4`: 2.5 s, 30 fps PIL frames, H.264 yuv420p CRF 23, 1600x900; `-strip.jpg`: five frames.
- `strips/PF-<chapter>.jpg`: the four beats, each a 1920x1080 frame, as a 2x2 storyboard.
- `sheet-all.jpg`, `frames.json` (per image: the source files, when it plays, how long, one weak point).
- `scripts/*.py.txt`: the composition scripts (rename to `.py`; `run_all.py` rebuilds everything). The stage behind
  most frames is today's dressed frame (`../perspectives-2026-09-27/frames/<chapter>/P01-today-dressed.jpg`) with its
  HUD painted out; where the HUD had covered a figure (Tidus's blade and turn ring, Seymour's hem, Rikku's sword) that
  part is repainted from the shipped idle painting, registered to the frame by an edge-correlation search
  (`register.py`, `register-runs.py`). HUD pieces are cut from the real frames along their measured slab outlines
  (`geo.py`, `hud.py`). The FFX-2 hit in PB is the real engine's (the M4 motion master in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-perspectives/motion-masters/`).
- Scratch lived in `D:/Tools/pyrefly-scratch/panels/` and was deleted at the end.
