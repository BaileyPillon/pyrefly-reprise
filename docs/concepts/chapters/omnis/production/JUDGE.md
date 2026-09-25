# Chapter XII (Seymour Omnis): independent 1:1 judge of the production candidates

**Game case (rule 14): FFX only.** Omnis, the Mortiphasm discs and the Garden of Pain exist only in FFX.
Judge: a sub-agent of the driver that made none of this art, 2026-09-25. Builder's commit: aceca5fb.
Picks judged against: Bailey, 2026-09-25 ~01:40 EDT, verbatim *"I'll go with all your recommendations"*:
O-1 A (new paint), O-2 B (painted discs, facing quarter lit with a gold rim, plus a HUD strip), O-3 C
(deep violet), B17 c (a new Omnis portrait, falling back to the approved Macalania portrait), with the
Review corrections of `docs/plans/chapter-omnis-review.md`. Bar 7 per subject, worst named first.
These verdicts are a judge's opinion for the orchestrator, not Bailey's approval.

## Method

- Each installed PNG composited over a night tone (28,26,40) and mid grey, looked at at 1:1 and 2x
  (face, both claws, the lower hand, the canvas-cut strips, the disc rim and dividers, the portrait face
  and hair crown, the plate's steps), next to the card or plate Bailey picked (`o1-omnis/a-card.jpg`,
  `o2-discs/b-frame.jpg`, `o3-garden/c-plate.jpg`) and beside the approved `seymour-macalania` and
  `seymour-natus` portraits.
- Measured on the PNGs: alpha islands, soft alpha, near-white opaque pockets (min channel > 235,
  alpha > 200), transparent pockets, and edge halo (share of 1 px edge pixels more than 50 brighter than
  the 9 px interior mean), calibrated on approved files. Backdrop: mean absolute difference against
  `c-plate.jpg` at 1600 px.
- Game size: the builder's real engine frames `production/clean-1600.jpg`, `battle-1600.jpg`,
  `cast-1600.jpg`, `turned-1600.jpg`, `dialogue-1600.jpg`, cropped side by side.
- sha256 of every file re-taken by this judge; all six match the builder's record.

## Measurements

| File | Opaque px | Alpha islands | Soft alpha | Near-white pockets (largest) | Edge halo |
|---|---|---|---|---|---|
| `seymour-omnis/idle.png` | 587,140 | main + 20 specks of 5 px or less | 0 | 39, 25, 24 px | 36.4 % |
| `seymour-omnis/cast.png` | 606,373 | main + 21 specks of 5 px or less | 0 | 39, 25, 24 px (the idle's) | 38.5 % |
| `mortiphasm/idle.png` | 317,700 | 1 | 1,932 (anti-aliased rim) | none | 4.3 % |
| `mortiphasm-facing/idle.png` | 326,956 | 1 | by design (a light layer) | none | n/a |
| `portraits/seymour-omnis.png` | 829,329 | main + 1 speck | 0 | **6,433 px on the forehead**, 3,345, 1,672 | **50.6 %** |
| calibration: `seymour-natus/idle.png` (approved) | | | | | 24.2 % |
| calibration: `portraits/seymour-natus.png`, `seymour-macalania.png` (approved) | | | | | 17.5 %, 7.3 % |

Backdrop `garden-of-pain.png`: MAD 2.6 against the picked `c-plate.jpg` at 1600 px (JPEG noise plus the
steps box); the builder's MAD 0 outside x1341-1981, y774-998 is consistent with that.

## Scores (0 to 10; bar 7)

| Subject | Identity to pick | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| `seymour-omnis` idle | 9 | 7.5 | 7 | 8 | 8 | 6.5 | 7.5 | 8 | **7.7** | PASS |
| `seymour-omnis` cast | 9.5 | 7 | 7 | 8 | 8 | 6.5 | 7 | 6.5 | **7.4** | PASS |
| `mortiphasm` disc | 9 | n/a | n/a | 8 | 7 | 8 | 6.5 | 8.5 | **7.8** | PASS |
| `mortiphasm-facing` layer | 9 | n/a | n/a | n/a | n/a | 8 | 7.5 | 8.5 | **8.3** | PASS |
| `garden-of-pain` backdrop | 9 | n/a | n/a | 7 | 7.5 | n/a | 6.5 | 7.5 | **7.5** | PASS |
| `seymour-omnis` portrait | 6.5 | 7.5 | n/a | 5.5 | n/a | 5.5 | 4.5 | 6 | **5.9** | **FAIL** |

## Per subject, worst named first

**`seymour-omnis` portrait, 5.9 FAIL.**
- **Worst:** a flat, blown cream oval on the forehead: 4,047 px at min channel above 235 inside
  x308-367, y212-299, with an orange rim and no modelling. At 2x it reads as a hole or a spotlight, not
  a highlight, and at dialogue size (`dialogue-1600.jpg`) it is the brightest thing on the card, in the
  middle of his face. The builder's own flag ("may bloom") understates it: it is already blown before any
  grade.
- A 229 px transparent pocket is bitten into the hair crown at (258,159): the white-ground matte took a
  hair highlight. On the dark night tone it shows as a black notch; on the card it will show the scene.
- Costume is not the O-1 A body Bailey picked: red and orange trim and grey cone spikes on the shoulders,
  none of the idle's dark indigo horn shoulders or red eye. The face, hair and purple eyes do read as
  O-1 A, but the portrait reads as a generic long-haired man; the "thin dark veins under his eyes" the
  prompt asked for are not there.
- Edge fringe: 50.6 % of edge pixels are halo, against 17.5 % and 7.3 % on the approved Seymour
  portraits.
- Process: plan §6.2 says "O-5 Omnis portrait: 2 options, only if B17 = c". None were shown; this single
  pick is Bailey's first sight of it. B17's recommendation was "c if O-5 lands; otherwise b".
- **Fix before re-judging:** paint the forehead oval down to the surrounding skin (no GPU), close the
  hair-crown pocket from the raw render's own pixels, peel the edge fringe; then either re-judge it or
  show it with one alternative as the O-5 pair. Until then B17 falls back to b, the approved
  `seymour-macalania` portrait, which the sidecar already names.

**`seymour-omnis` idle, 7.7 PASS.** The same render, pose and crop as O-1 A: light-blue hair, purple
eyes, the dark indigo horned shoulders with red eyes, both red-clawed hands spread, the ribbed chest and
spiral mark, the long skirt of pale strips with red runes. The white pocket between the raised left arm,
the hair and the shoulder strip is open; the pale strips are whole.
- **Worst:** the edges. A 1 px pale fringe from the white ground runs along much of the silhouette
  (edge halo 36.4 % against 24.2 % on the approved Natus idle); it shows at 2x on the claws and the sash
  edge, not at 1600x900. And the render's canvas cuts the outermost strips straight (355 px on the
  left, 129 + 159 px on the right, disclosed): at 1:1 the left strip ends in a vertical line.
- Not "one component" as the record says: there are 20 specks of 5 px or less beside the body. They
  cannot be seen at any size, but the record should say so.
- The skirt of strips and the missing legs are ours, not the game's (the look-only pass saw a lean,
  legged, armoured figure); Bailey picked A for its silhouette, and `idle.json` `offCanon` discloses it.

**`seymour-omnis` cast, 7.4 PASS.** One smooth warp of the idle's own pixels: both arms and claws lift
about 20 degrees, fading to nothing down the strips. At 2x there is no seam, tear or repaint at either
shoulder; the face and chest are the idle's.
- **Worst:** the read at game size. Side by side in `clean-1600` / `cast-1600` the claws rise by roughly
  a claw's length; it reads as "he raises his arms", not as a strong spell pose. The builder discloses
  this. Second: the warp softens the upper-arm texture slightly where it stretches most.
- It inherits the idle's edge fringe (38.5 %).

**`mortiphasm` disc, 7.8 PASS.** The O-2 B disc: one render (912301) with a carved bronze rim, four red
rim diamonds and the four sourced colours (orange Fire, purple Ice, blue Water, yellow Thunder) tinted
per quarter. It is cleaner than the picked frame's disc and reads at 1600x900 in every frame.
- **Worst:** the finish of the PIL work at 1:1. The quarter dividers are flat black strokes, and the
  upper-left one runs a little over the inner rim; each quarter's inner band is a flat, untextured pale
  fill (lavender, orange, blue, yellow); the purple tint lies over the inner half of the left rim diamond.
  None of it shows at game size.
- **The ring order is the estimate (B8), not what the look-only pass saw** (Fire, Thunder, Water, Ice
  clockwise in one game screenshot). This lock covers these pixels only. If Bailey confirms the observed
  order, the re-tinted disc is a new file and needs its own lock, with this hash kept as superseded (the
  Leblanc precedent).
- Never mirror it (a mirror reverses the ring); the sidecar says so.

**`mortiphasm-facing` layer, 8.3 PASS.** Exactly the O-2 B read: the quarter facing Omnis washed light
with a gold rim arc, the other three dimmed 40 %. In `battle-1600` and `turned-1600` the facing quarter is
the first thing the eye finds on each disc, on both sides (rotated 180 degrees for his right).
- **Worst:** the 40 % dim makes the non-facing Water and Ice quarters close in value on the violet plate
  at game size; the T8 HUD strip (O-2 B) carries the words, as Bailey's pick intends.

**`garden-of-pain` backdrop, 7.5 PASS.** The picked violet plate unchanged outside one box, plus the
steps up to a platform, the one sourced Garden fact that question 3 promised. At game size the steps
read as steps behind Omnis, and his blues, the discs' orange and gold, and the party separate from it.
- **Worst:** the steps at 1:1. The treads are ruler-straight with an even stripe rhythm (a venetian-blind
  look), the top slab reads a little like a bench back (disclosed), and the floor slab directly in front
  of the steps has a lifted, torn edge where the box meets the terrace. No seam at the box's sides.
- Otherwise the plate's own finish, which Bailey saw when picking: soft, smeared sky and water detail.
  No staves (the look-only pass saw tall ornamented poles; the builder offers them as props). The sea
  and floating ledges are ours, and the Sea of Sorrow's features are not claimed.

## Not judged

No hurt or KO painting for Omnis and no red-glow painting (the glow is a live effect, as the options
follow-up said); no disc states beyond idle (a turn is a rotation under the fixed facing layer). The HUD
disc strip and the intent line are T8, not art.

## Verdicts

seymour-omnis idle: PASS (locked)
seymour-omnis cast: PASS (locked)
mortiphasm: PASS (locked; ring order still B8, our estimate)
mortiphasm-facing: PASS (locked)
garden-of-pain: PASS (locked)
seymour-omnis portrait: FAIL (not locked; B17 falls back to the approved seymour-macalania portrait)

## Lock record

Set `chapter:omnis:2026-09-25` in `docs/target/approved-hashes.json` (the five PASS files, sha256
re-taken by this judge). Backup: `D:/Tools/pyrefly-art-backup/approved/2026-09-25-omnis/` (PNG plus
sidecar for each). `verify-approved.mjs` at the start of judging: 159 ok; right before the lock (after the Trema
and Gippal locks landed): 168 ok, 0 mismatched, 0 missing; after: 173 ok, 0 mismatched, 0 missing.
Lock commit: e7457293.
