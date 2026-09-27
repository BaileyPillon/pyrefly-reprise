# Perspectives round: how the rear paintings were made (art agent, 2026-09-27)

Stage 1 of the art brief: the Chapter I party (FFX: `tidus`, `yuna`, `kimahri`) and the Chapter IV
party (FFX-2: `yuna-white-mage`, `rikku-dark-knight`, `paine-warrior`) in REAR three-quarter view.
Options-round CANDIDATES only (AGENTS.md rule 9): nothing is in `public/art`, nothing is approved,
nothing of `tools/gen` was edited. Game case: per character art, each chapter's own party; the
method itself is shared and applies to both games.

**The view.** Camera behind the character and a little to the character's right; the character
faces INTO the frame toward screen-right (a boss off to the upper right). Seen from behind, the
character's RIGHT side is on screen-right.

## Result

| Subject | Pick | Chirality vs the idle | Weak |
|---|---|---|---|
| tidus | B3 #3, seed 270013 | sword in the right hand, pauldron on the right shoulder | red knit sleeve on the right arm (idle: left); blade paler |
| yuna | B4 #3, seed 271013 | staff in the right hand | staff upright (idle: low diagonal); near-straight back |
| kimahri | B4 #1, seed 272011, POST | spear in the right hand | horn trimmed by hand; gold spearhead, blue tail tuft |
| yuna-white-mage | B2 #2, seed 273012 | rod in the right hand, head low behind as in the idle | open back panel; plain ring rod head; flatter shading |
| rikku-dark-knight | ~~B2 #1, seed 274011, POST~~ replaced in stage 2 by B3 #3, seed 274023 (see below) | both hands on a planted sword (non-chiral) | stage 1's pick drifted to gold/bronze armour with bright tabard panels |
| paine-warrior | B3 #2, seed 275022 | sword at her right, hands on the pommel | red strappy top at the shoulder blades; white-winged guard |

Installed: `D:/pyrefly-mock-persp/public/mock-art/<subject>/rear34.png` + `rear34.json` (served at
`/mock-art/<subject>/rear34.png`), listed in `READY.json`. Sheets: `sheet-01..06-<subject>.jpg`
(the idle and every candidate at one height, the pick framed in gold). Every render, picked or not,
with its raw frame and sidecar: `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-perspectives/`.

## Which method won, and why

Piloted on Tidus, 4 renders per arm, same seeds, looked at full size (brief: A, then B, C only if
both fail; C was not needed).

1. **A: txt2img + rear phrasing + Method F reference (0.28).** 4 of 4 were genuine back views with
   no "looking back" glance, and the most natural paintings of the round. But the sword hand was a
   coin flip (3 of 4 in the LEFT hand) and most came out as a straight back view, not turned.
2. **B v1: A + OpenPose rear skeleton (Trema scale 0.8, shoulders from its front skeleton).** The
   right hand was held every time, but the figures were small (the body about 720 px of 1216),
   long-legged with small heads, and 2 of 4 weapons broke (a blade on both ends, a rod plus a loose
   blade).
3. **B v2: the skeleton traced off A #2, the checkpoint's own unaided back view** (head top about
   145, neck 322, hips 590, knees 805, ankles 1020 on 832x1216: anime proportions, head about 18 % of
   the height like the idles). 4 of 4 right-handed, full size, painting quality equal to A.
4. **B v3: v2 turned toward screen-right** (head and right ear moved right, shoulders a little
   narrower, the RIGHT foot a step forward into the frame). 8 of 8 turned toward the upper right.

**Winner: B v3.** Only the skeleton decides the weapon hand and the turn; the reference and the
words carry identity. Two rules learnt on the way:

- **The weapon hand must be unmistakable in the skeleton.** A hand low at the hip was ignored: in 5
  of 8 Yuna and Kimahri v3 renders the staff or spear went to the LEFT hand or was doubled. A hand
  raised to chest height, out to the side (v4 skeletons), put it in the right hand in at least 6 of 8.
- **Costume side-pieces stay a coin flip.** Tidus's pauldron landed on the right shoulder in about 5
  of 12 v2/v3 renders; the checkpoint prefers the LEFT (its own Tidus).

**Why chirality fights the checkpoint here (for the main session).** All six shipped idles are
flipped renders (`flipped: true` in each `idle.json`; `tools/gen/flip.py`), so each idle carries the
MIRROR of the checkpoint's native chirality. A native rear render therefore comes out mirrored against
the idle (Tidus A #3: sword and pauldron both on the left, the exact mirror of the idle). Mirroring a
native rear render would match the idle exactly and cheaply, but the brief says chiral subjects are
rerolled, never mirrored, so none of the picks is mirrored. If that rule is relaxed for subjects
whose idle is itself mirrored, stage 2 gets cheaper.

## The recipe (every pick)

- Animagine XL 4.0 Opt, 28 steps, cfg 6, euler_ancestral / normal, 832x1216 (Kimahri v4 and
  Rikku: 1024x1216, the weapon left the narrower frame).
- IP-Adapter plus SDXL ViT-H, forced on (no colour-spread guard in this graph), a batch of two
  references combined by concat: the idle square-padded on white and a square head crop
  (`make-refs.py`). Weight 0.28, ease in, 0.2 to 0.6, K+V (FFX-2 round 2 on: 0.40, 0.2 to 0.75;
  the costumes held closer, with the words fixed at the same time, so the two are not separated).
- xinsir OpenPose SDXL ControlNet, strength 0.70 / 0.75 alternating, 0 to 1, the subject's rear
  skeleton (`skeletons.py`: COCO-18, right side on screen-right, no nose or eyes, the right ear only).
- Positive: `<identity>, <pose>, [emphasis], (from behind:1.3), back view, facing away, looking
  ahead, full body, standing, feet visible, simple background, white background, <STYLE_TAGS>,
  <QUALITY_TAGS>` (the house style and quality blocks from `tools/gen/comfy.mjs`, unchanged).
- Negative: `SPRITE_NEGATIVE` (with `EFFECTS_NEGATIVE`) + `(looking at viewer:1.2), looking back,
  facing viewer, front view, straight-on, symmetrical, portrait` + the subject's own list. The
  facing contract's `FACING_NEGATIVE` (which bans `from behind`) is not used.
- Identity = each idle's sidecar words, minus effect words, eye colour, expression and anything a
  back view cannot show; for the FFX-2 girls read off the idle PICTURE where the sidecar disagrees
  (White Mage: red zigzag trim; Rikku: no helmet, full armour; Paine: red sword, combat boots).
  The exact strings of every render are in its `cand-N.json` and in each pick's `rear34.json`.
- rembg isnet-anime, 16 px margin, then the cut-out guard (`tools/gen/cutout-guard.mjs`).

Per-subject fixes that mattered: Kimahri `standing at rest, holding spear, upright spear` plus the
idle's full horn negative list; White Mage `(white boots:1.2)` and `red boots, high heels, slit,
trumpet, broom, long staff` negated; Rikku `greaves, armored legs, full armor`, `(full plate
armor:1.3), (fully armored:1.2)` and `(bare thighs:1.3), (bare back:1.3), backless outfit` negated;
Paine `black combat boots, red buckle straps`, `(combat boots:1.3), (chunky boots:1.2)` and
`(high heels:1.4), (stiletto heels:1.3), thigh boots` negated (Paine round 3 added `ribbon, sash,
hanging cloth, bare legs, loincloth` to the negative; its `(black thighhighs:1.3)` went through the
identity channel, was escaped and carried no weight).

## Post edits (alpha only, no repaint; `post.py`)

- **kimahri**: the render drew one long thin gold horn; its alpha above the headband was cut away
  along a jagged line, leaving a short broken stub (1,342 px removed). One broken horn, as the brief
  requires.
- **rikku-dark-knight**: the render floated a second, detached sword at the left (the guard's
  "second blob"); that component was dropped (37,143 px).

## Withdrawn candidates (not picked because of a defect; all kept in the backup folder)

- tidus: A/cand-1, A/cand-4 (sword in the left hand); A/cand-2 (pauldron left); A/cand-3 (fully
  mirrored); B/cand-1, B/cand-3 (small figure, broken weapon); B/cand-2 (blade on both ends); B/cand-4
  (right, but small); B2/cand-1, B2/cand-2 (pauldrons on both shoulders); B2/cand-3 (good, straight
  back view: the runner-up); B2/cand-4 (hood up); B3/cand-1, 2, 5, 6 (pauldron left); B3/cand-4 (two
  swords); B3/cand-7 (two pauldrons); B3/cand-8 (guard: crop covers the canvas).
- yuna: B/cand-1, B/cand-4 (staff in the left hand); B/cand-2, B/cand-3, B4/cand-1, B4/cand-2 (staff
  upside down; B/cand-2 also a floor blob); B4/cand-4 (guard: crop covers the canvas).
- kimahri: B/cand-1, B/cand-3 (two spears; B/cand-3 faces left); B/cand-2 (horn curl, spear cut by the
  frame: runner-up); B/cand-4 (spear in the left hand, full horn); B4/cand-2, B4h/cand-3, B4h/cand-4
  (a spearhead on both ends; B4h = no horn words, which did not help).
- yuna-white-mage: B/cand-1 (broom-like rod, short robe); B/cand-2 (plain tube rod, red boots:
  runner-up); B/cand-3 (slit, red heels); B/cand-4 (a trumpet); B2/cand-1 (rod both ends); B2/cand-3
  (rod in the left hand); B2/cand-4 (a gold club).
- rikku-dark-knight: B/cand-1..4 (bare thighs, back or midriff; B/cand-2 sword on the left); B2/cand-2
  (bare thighs); B2/cand-3 (rainbow cloth); B2/cand-4 (sword on the left).
- paine-warrior: B/cand-1..4 (stiletto thigh boots or heels; B/cand-2 sword on the left); B2/cand-1,
  B2/cand-4 (no thigh-highs); B2/cand-2 (a long ribbon); B2/cand-3, B3/cand-3 (sword on the left);
  B3/cand-1 (silver-blue blade); B3/cand-4 (flame-shaped blade).

## Counts

64 renders (Tidus 20, Yuna 8, Kimahri 8, White Mage 8, Rikku 8, Paine 12), 846 s of GPU execution
(14.1 min, 13.2 s a render, from ComfyUI's history), about 44 min wall on a queue shared with the FF7
art session. Never more than 3 of ours pending; nobody else's job touched; no black frame; ComfyUI
never restarted.

## For the rigs

- `baselineY` is the FEET row, not the last opaque row: Tidus's blade tip hangs 16 px lower,
  Kimahri's spear butt 9 px, Rikku's sword tip 12 px (all nearer the camera). The sidecars say so.
- `scale` = `PoseFrame.scale` with the idle as the reference pose (`src/engine/PaintedScale.ts`):
  idle figure height / rear figure height, head top to feet, weapons excluded (Tidus 1.182, Yuna
  0.997, Kimahri 1.070, White Mage 1.113, Rikku 1.113, Paine 1.107). Without it the rear figure
  stands shorter than the idle.
- `facingInImage`: `away-right` (tidus, kimahri, rikku) = turned toward screen-right; `away`
  (yuna, white mage, paine) = near-straight back view, a little toward the right.
- None is mirrored; do not mirror tidus, yuna, kimahri or paine in a rig (chiral).

## Files

Scripts: `D:/pyrefly-mock-persp/tools/zz-persp-art/` (`make-refs.py`, `skeletons.py`, `render.mjs`,
`post.py`, `install-picks.py`, `sheets.py`, `look.py`), copied here as `scripts/*.txt`.

---

# Stage 2 (2026-09-27, 02:45 to 05:15 EDT)

Order from the main session: (0) one Rikku reroll, (1) hi-res rear views, (2) reverse-angle plates,
(3) the proscenium, (4) boss rear views, (5) floors, because `REQUEST.md` asks for them (it marks
them NEEDED). Every item is a CANDIDATE and nothing in `public/art` or `tools/gen` was touched.
READY.json was rewritten after each item. It now lists 16 items; every path exists, each with a sidecar.

| # | Item | Pick (installed under `/mock-art/`) | Method | Weak | Sheet |
|---|---|---|---|---|---|
| 0 | Rikku Dark Knight, dark-palette reroll | `rikku-dark-knight/rear34.png` = B3 #3, seed 274023 (**replaces** B2 #1) | B (rear skeleton `rdk-v1`), IP-Adapter 0.5 / 0.2-0.8, the idle's dark words weighted, gold/bronze armour and tabards negated; 6 renders | a dark cape panel with orange tips at her left; outlines slightly orange; one hand on the pommel (idle: two) | `sheet-05` |
| 1 | Hi-res rear views (Hero Shoulder) | `tidus/rear34-hi.png` 1390x2244, `yuna-white-mage/rear34-hi.png` 1311x2099 | the picked raw render -> RealESRGAN x4 -> 2x -> img2img denoise 0.4 with the pick's own prompt and seed -> rembg; the same painting at 2x (denoise 0.3 and a plain upscale kept for comparison) | residuals of the 1x picks; the figure is 1844 / 2067 px, so a mid-thigh crop fills about 1100-1200 px (1:1 or smaller at 1080) | `sheet-07` |
| 2 | Reverse-angle plates | `gagazet/plate-reverse.png` = E #14 (rig name `plate-gagazet-reverse`); `bevelle-underground/plate-reverse.png` = F #15 (`plate-bevelle-reverse`), 2688x1536 | house backdrop preset, img2img from **today's plate mirrored** with the horizon moved up (top cropped, near floor stretched: `mirror-init.py`), denoise 0.75 / 0.70 | Gagazet: smoother brushwork than today's plate. Bevelle: fine at 1:1; its round seal is a sunburst, not today's gear | `sheet-08`, `sheet-09` |
| 3 | P13 proscenium, 1920x1080 RGBA | `proscenium/proscenium.png` = #2 (ink velvet); alternate `proscenium/proscenium-crimson.png` = #4 | a code-drawn layout sketch (`proscenium.py sketch`) painted over by img2img at 0.62-0.65, then POST: the opening cut to alpha exactly at REQUEST.md's x 200-1720, y 118-1010 (top corners r 70), and the footlights lit (a warm wash over the opening's foot, alpha up to 0.42) | the finish (cut + glow) is post, not painted; the arch is gold in both games (FFX-2's Ink & Gold accent is pyre pink: tint it if wanted) | `sheet-10` |
| 4 | Boss rear views | `seymour-flux-body/rear34.png` = A3 #4, seed 279014; `ffx2-bahamut/rear34.png` = A #1, seed 279101, POST | A (rear phrasing + Method F reference), boss framing; bosses face into the frame toward screen-LEFT; both near-symmetric (mirroring allowed, none needed) | Seymour: crest spikier than the idle's fan of locks, legs hang instead of crossing. Bahamut: brighter red wings; trapped white background keyed out (`post.py keywhite`) | `sheet-11`, `sheet-12` |
| 5 | Diorama floors, 4096x4096, straight down | `floor-gagazet/top.png` = #1; `floor-bevelle/top.png` = #8 | 1024 img2img over a layout sketch (`floors.py`) -> RealESRGAN x4 -> smoothstep falloff to the fog colour over the outer 10 %. Mapping as the scene code: image top = world -z; Gagazet 44 u centred (0,-2), Bevelle 46 u centred (0,-5); the hole at the scene's `HOLE` (2.4, -7.8) = px (2260, 1799) | Gagazet: rocks small and few, the ice pockets glow. Bevelle: a punched cyan hole with cracks rather than torn plating; the brass inlay was lost; no edge band (optional, not made) | `sheet-13` |

## What failed, and why (stage 2)

- **Reverse plates by txt2img with the plate as a style reference** (IP-Adapter "style transfer",
  0.7 and 1.0; night and dark words weighted): 8 renders per plate came back daylit or pastel,
  while today's plates are dark. What worked was img2img from the mirrored plate. A mirror swaps
  the near walls exactly as a 180-degree turn does, and the palette and brushwork carry over; at
  0.70-0.75 the structure is repainted. The horizon had to be moved up in the init: the first
  mirrored picks (D #11, kept as alternates) put it at about 60 %, and REQUEST.md asks for about 45 %.
  A 0.15 shift was not enough for Bevelle (the model re-chose its vanishing point at about 66 %);
  a 0.28 shift landed it at about 48 %.
- **Seymour's crest**: the words "fan-shaped crest" drew giant fans, feather fans, maces and a
  blade arch (A #1-#4). Plain hair words lost the crest (A2). "Swept up and back into a tall crest
  of stiff spikes" with the reference at 0.5 got it (A3 #4). A3 #5 was withdrawn: its ribbons fill the frame.
- **Bevelle floor hole**: I drew a brass ring round the arena that ran through the hole, and the
  checkpoint painted the two as one neat round porthole (#3). A masked repaint of the hole region
  (SetLatentNoiseMask + ImageCompositeMasked) failed twice (#5 a dark dent, #6 a gash). What worked
  was a second layout with no ring and the torn shards drawn in (#7, #8).
- **Proscenium finish**: my first finish painted the crest's dip into the opening with the flat
  glow colour and left the footlights unlit. Both were fixed in the finish step; no re-render was needed.

## Stage 2 counts

64 renders (Rikku 6, hi-res 4, plates 28, proscenium 4, bosses 14, floors 8), 990 s of GPU
execution (16.5 min). The whole round: 128 renders, 1859 s (31.0 min). All times are from
ComfyUI's history (client id `pyrefly-persp-art`), and the queue was shared with the FF7 and music
sessions. Never more than 3 of ours pending; no other job touched; no black frame; ComfyUI never
restarted.

## Spotted in passing (not changed)

- The shipped `public/art/characters/ffx2-bahamut/idle.png` has patches of white background
  trapped between the wings and the body (rembg; the same defect keyed out of the rear view). It
  is visible on `sheet-12` and in the rig's P06 frame.
