# Ormi round 2: independent judge (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc; AGENTS.md hard rule 14: art review of one
FFX-2 subject, no game file, shared tool or render changed). A different agent from the
painter of `round2.md`. **I rendered nothing and changed no installed file.**

**Verdict: FAIL. No state reaches the bar (7).** attack **6**, cast **5**, hurt **5**,
ko **4**. All four stay CANDIDATES. `docs/target/approved-hashes.json` sha256
`3c5af02f...` before and after this pass; its 115 files verify identical before and
after (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: ok 115, mismatched 0,
missing 0). The idle `f7fcdfc3...` is unchanged.

**Sheet:** `judge-sheet.jpg` (built by `judge-sheet-r2.py`, 1.1 MB).
- Row 1: idle and the four installed round-2 files, whole, at idle's pixel scale times
  each sidecar `scale` (how `PaintedActor` sizes them).
- Row 2: the round-1 files they replaced (backup `.../2026-09-23-lora-r2/ormi/replaced/`),
  same rule.
- Row 3: the painter's crops from a running battle (`ingame-r2-*.png`).
- Rows 4 to 6: heads, shields, costume and edit defects at native 1:1.

**Provenance:** the four installed PNGs hash the same as the pick cut-outs in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/picks/` and as each
sidecar's `sha256`: attack `9b203c99`, cast `27a95207`, hurt `df0f3970`, ko `b3890392`.
Every sidecar says `status: CANDIDATE`, `method: lora-r2+openpose`, `facing: right`.
Every alpha channel is binary (0 semi-transparent pixels).

## Method

- **Anchor:** `public/art/characters/ormi/idle.png`, looked at 1:1 beside every crop.
- **Criteria:** round 3's seven (head and topknot, face, costume, shield, build, line and
  shading style, pose reads as its state) plus **anatomy** (limbs, feet, hands, open
  sandals). Each 0 to 10; **the score is the worst criterion; the bar is 7**.
- **The heart:** idle's shield has no heart (a purple sunburst inside a red, gold-studded
  band), so the heart is judged against research 10.1 and the rest of the shield against
  idle. Research 10.1 supports only the stout build, the large shield on his back with
  the Syndicate heart, and purple samurai-style attire; every other colour and pattern is
  judged against idle (hard rule 6).
- **Value check** (the numbers behind "lighter than idle"): median lightness of the purple
  pixels (hue 238 to 306, saturation above 0.25): idle 0.21; round 2 attack 0.24, **cast
  0.55**, hurt 0.27, ko 0.41; round 1 attack 0.27, cast 0.30, hurt 0.38, ko 0.37.

## Scores

| State | Head | Face | Costume | Shield | Build | Style | Pose | Anatomy | **Score** | Worst |
|---|---|---|---|---|---|---|---|---|---|---|
| attack | 6 | 6 | 6 | 6 | 8 | 6 | 8 | 7 | **6** | head, face, costume, shield, style |
| cast | 6 | 7 | **5** | 6 | 8 | 6 | 7 | 8 | **5** | costume |
| hurt | 6 | 7 | **5** | **5** | 8 | 6 | 6 | 7 | **5** | costume, shield |
| ko | 7 | 7 | 5 | **4** | 8 | 6 | 8 | 6 | **4** | shield |

**attack** (`attack.c.980002.knot982201`)
- Head 6: small maroon topknot, red tie, **no striped tassel**, no temple mark.
- Face 6: green eye, bared teeth, a real scowl; but a **round pink blush** on the cheek,
  not idle's tan cheek mark.
- Costume 6: crimson sleeve, yellow sash and teal curtain are right. The hakama is
  two-toned: the front leg pale mauve with cream and brown diamonds, the back leg
  near-black indigo pleats **with no hem pattern at all**. A small brown tassel is left
  on the belly (the knot repaint's remainder).
- Shield 6: one shield, face-on, **leading the bash**, a red heart (research) on a purple
  sunburst (idle). Plain gold rim, no red studded band.
- Style 6: clean cel lines and hard two-tone shadows, flatter than idle's soft painterly
  shading; values close to idle's.
- Pose 8: the strongest attack yet. The shield leads, both feet planted in a lunge.
- Anatomy 7: both legs, open sandals; a pale patch on the rear heel.

**cast** (`cast.a.980101.knot982003.tassel982013`)
- Head 6: small topknot, no tassel, no marks. Face 7: green eye, bared teeth, a scowl.
- **Costume 5:** the kimono and hakama are **pale lavender** (purple median lightness 0.55
  against idle's 0.21, the widest gap in the set); the diamond hem floats on lavender with
  no dark band; invented cyan-and-white geometric cuffs. The collar knot is gone and the
  gold band in its place is clean at 2x, with one faint red fleck.
- Shield 6: the heart is clear, but the face is **mostly red** with gold flame spikes and
  only a small lavender centre: idle's order (narrow red band, big purple sunburst)
  with the proportions inverted. No studs.
- Pose 7: raised fist, planted legs, teeth bared: a wind-up or war cry.

**hurt** (`hurt.c.980203.knot982106`)
- Face 7: **a real wince** (eyes squeezed, clenched teeth). Round 1's "singing" face is
  fixed.
- **Costume 5:** the sash ties in **a large lemon-yellow bow** at the front, brighter and
  bigger than idle's gold sash; the teal curtain is replaced by a dark panel with gold
  dots; a red stroke on the belly (knot residue). Diamond hem present.
- **Shield 5:** on his back, seen from behind: only the gold back and rim. No heart, no
  sunburst, no red band.
- Pose 6: both feet planted (the skeleton fix held), hand to the belly, a slight lean
  back, the hakama swinging. It reads as a stagger, but a mild one for a hit.

**ko** (`ko.a.980305.noshield.head981036.badge981041.shadow2`)
- Head 7: the regrown topknot is right, **with idle's striped tassel** (the only state
  with it). Face 7: eyes shut, brow knit, out cold.
- Costume 5: the hakama pattern is **gold squares**, not diamonds; **the invented red cord
  knot is still at the collar**; at the left collar a **blurred rainbow smear** where the
  badge was painted out; the shoulder mantle ends in a **straight stepped cut** on its
  right edge where the shield was erased.
- **Shield 4: none.** Research 10.1's one prop and idle's silhouette are both gone. Lying
  on his back, a strapped shield could be hidden under him, but not one edge of rim
  shows, so at engine scale he is a different, prop-less figure.
- Style 6: the round-1 gloss and neon edges are mostly gone (a few glossy streaks on the
  sash). Pose 8: flat on his back, head right, on the floor line.
- Anatomy 6: **one foot shows**; the second leg is lost in the hakama mass.

**Against the painter's self-scores** (`round2.md`): attack 6 = 6. **Cast 6 -> 5**: the
lavender is a costume defect, not only a finish one. **Hurt 6 -> 5**: the back-view
shield and the bow. **Ko 5 -> 4**: an absent shield is below the painter's 5, and the
collar smear and straight cut were not listed.

## In-game scale (looked at in the painter's running-battle captures)

- The painter measured the sprite rect from the engine in a running battle
  (`ingame.mjs`, GPU ANGLE D3D11, each pose paired with idle under the same camera,
  drift under 0.7 percent) times a texture head measure: head vs idle 0.999, 0.999,
  1.026, 1.008 (`scale-check-r2.json`). The method is sound: the rect is the engine's.
- **Looked at** (`ingame-r2-*.png`, sheet row 3, and 3x head crops): the heads read the
  same size as idle's in all four; my rough dome-width read at 3x is within about 10
  percent, attack and cast slightly larger because the face turns toward the camera.
  No state swells or shrinks when it swaps in. The lunge and stagger are shorter than
  idle (0.87, 0.89), the cast's raised fist taller (1.08): right for the poses.
- **Facing:** all four face the party (screen-left in battle), as idle does. The ko lies
  on the floor line.
- **Scale is not a blocker this round.**

## Against round 1

| State | Round 1 LoRA pick (independent judge) | Round 1 redo (installed until today) | Round 2 (this judge) | What changed |
|---|---|---|---|---|
| attack | 5 (painted white hem, brooch) | painter 6 | **6** | Up from the judged 5. The shield now faces the camera and leads with its heart; the hem fade and brooch are gone. New: the back leg lost its hem; the pink blush |
| cast | **7** (960106) | 960106, judge 7 | **5** | **Down.** A judged 7 was replaced by a pale lavender cast to keep one finish. Round 1's is closer to idle in value (0.30 vs 0.55) and finish |
| hurt | 4 (singing face, sash sack, neon) | painter 6 | **5** | Up from 4. A real wince, feet planted, no neon. The shield turned its back to the camera and the sash became a bow |
| ko | 4 (glossy neon, halo shield) | painter 5 | **4** | Same number, different cause. The gloss and the halo are gone, the tassel is back; the shield is now absent and the erase left a smear and a straight cut |

**Set-level:**
1. **"One finish" holds, but it is the wrong one.** Round 2's four share a flat cel
   finish; round 1's attack, cast and hurt shared idle's deeper painterly finish and
   only ko was off (sheet rows 1 and 2). Round 2 unified the set away from the anchor,
   most visibly in cast.
2. **The topknot tassel is missing in three of four** (attack, cast, hurt), as in round
   1. The r2 LoRA drew it at the step pick in the idle pose, but not in these frames.
3. **The heart:** clear in attack and cast, absent in hurt (back view) and ko (no shield).
4. **Round 1's defects fixed:** the white hem fade and brooch (attack), the singing face
   and neon (hurt), the glossy neon ko, the back-shield duplication in every state.
5. **Hard rule 15:** this is the fifth pass on Ormi's poses, and the tassel and style
   items have now survived two reviews. A written method check is owed before a third
   try on them; the redo below uses frame edits, not a new batch.

## Redo, in order

1. **Cast: put round 1's `cast.960106` back** (backup `replaced/cast.png` + `.json`):
   judged 7, closer to idle than round 2's cast on every criterion but pose. The painter
   left this as Bailey's call; my recommendation is to restore it, and to use it,
   not round 2's frames, as the finish target for the others.
2. **Value and finish, all round-2 frames:** a colour grade of the purple cloth toward
   idle's (median lightness 0.21) as a masked pixel edit, then an img2img pass at 0.15 to
   0.25 denoise with idle as the IP-Adapter style reference at a higher weight than 0.3,
   and without `cel shading` in the style tags.
3. **Ko:** repaint the collar smear and the straight shoulder cut (`erase-poly.py` +
   `repaint.mjs`), remove the red knot, repaint the hakama squares as idle's diamonds,
   and give him his shield back: a gold rim and a slice of red studded band showing
   under his back, or the shield fallen flat beside him. If no repaint holds, the
   absence is Bailey's call.
4. **Hurt:** repaint the bow as idle's gold sash knotted at the side, restore the teal
   curtain, remove the belly stroke. The shield: repaint it face side out (sunburst,
   red band, heart), since a back view cannot show the research's heart.
5. **Attack:** repaint the back leg's hem with idle's diamonds on a dark band, the blush
   as idle's tan cheek mark, and a red studded band inside the shield rim.
6. **Tassel on attack, cast (if round 2's is kept) and hurt:** ko's head repaint recipe
   (981036) drew it; reuse it.

## Hard rule 6

Research 10.1 supports only a stout build, a large shield on his back with the Syndicate
heart, and purple samurai-style attire. Topknot, tassel, marks, sleeves, sash, curtain,
hem pattern and shield colours are judged against the installed idle, not a source.
The idle's heartless shield still contradicts 10.1.
