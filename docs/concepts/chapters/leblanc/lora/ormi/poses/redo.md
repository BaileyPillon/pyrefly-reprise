# Ormi poses: redo after the independent judge (2026-09-23, last attempt)

FFX-2 only (Chapter 6, Chateau Leblanc; AGENTS.md hard rule 14: per-subject art, no
game file and no shared tool changed). **Nothing here is approved.** The installed
files are CANDIDATES; `docs/target/approved-hashes.json` is untouched (sha256
`3c5af02f...` before and after; its 115 files verify the same before and after with
`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: ok 115, mismatched 0, missing 0).
The idle (`f7fcdfc3...`) is unchanged and is still the anchor.

This pass does what `../judge.md` "Redo, in order" names, by **editing frames**, not
with more prompt words (hard rule 15). No new LoRA training ran (the upstream item
waits on the owner's plan and the GPU gate), so the kohya gate did not apply; every
render queued alone behind an empty shared ComfyUI queue.

**Sheet:** `sheet.jpg` (idle, then each state whole at idle's scale, face and costume
at 1:1). **Every candidate of this pass:** `redo-candidates.jpg`. Commands:
`redo.sh <step>`; raw frames, cut-outs, masks and sidecars in
`D:/Tools/pyrefly-lora/ormi/poses/<state>/`.

## Result (painter's own scores: an independent judge is still owed)

| State | Before (judge) | Now (self) | Status |
|---|---|---|---|
| attack | 5 (costume) | 6 (head, shield) | best available, below bar |
| cast | 7 | 7 (unchanged, not re-edited) | at the bar |
| hurt | 4 (face, costume, shield, style) | 6 (pose) | best available, below bar |
| ko | 4 (style) | 5 (style) | best available, below bar |

Installed sha256: attack `d90aa2ed`, cast `f0a88fc5` (unchanged), hurt `d7808317`,
ko `fe938948`. Every sidecar carries `note: "best available, below bar"` where the
score is under 7, and the full edit chain in `edits`.

## What was done, per state

**Hurt (judge redo 1).** Base changed to **hurt p5 960242** as the judge recommended
(a real wince, idle's diamond hem, the painterly finish, the shield face visible).
Heart: `repaint.mjs` on the shield face (ellipse 210,625 r60x225), denoise 0.8, no
LoRA, cast's shield as IP-Adapter reference 0.5, 6 seeds; **971005** picked: a clear,
foreshortened red heart on a sunburst face. Left open: the face of the shield is
paler (pink-violet) than idle's deep purple, and the flung open hand still reads
partly as reaching up (the optional hand repaint was not attempted).

**Attack (judge redo 2).** Two diffusion passes on the hem failed and are recorded as
rejects: a masked repaint at 0.75 kept the white band's pale value (972001-006); a
purple prefill turned grey-mauve (972011-016); inpaint from scratch drew skin and odd
cloth (972021-026). Method change: `hemfix.py` edits the pixels. Inside both band
polygons every washed pixel (blue barely above green: grey, white, beige) is
re-coloured on attack's own purple ramp keyed to its luminance (pleat lines survive,
a 7 px median removes the flame outlines), then a row of pale-gold diamonds in cast's
colour and size is drawn along each column's hem bottom with a dark 1 px outline. A
light `repaint.mjs` blend over the bands (0.3 / 0.4, LoRA 0.8, cast's hem as reference
0.4, 6 seeds) integrates it; **972035** picked. Then the red heart brooch on the
shoulder was painted out (0.75, 6 seeds; **972045**, a small gold ornament remains),
and the grey iris (26 px) re-coloured green on a luminance ramp. Left open: no tassel
on the topknot; the shield is edge-on (gold rim and heart, no studded band).

**Ko (judge redo 3).** (1) The red floor-reflection shape under the arm erased to
white (polygon about x 830 to 1070, y 684 to 750; 2 px outline on the new edge).
(2) Whole-frame img2img, LoRA 0.8, IP-Adapter "style transfer" 0.8 on idle + cast
(square-padded), denoise 0.2 and 0.25, 6 seeds; **973004** (0.25) picked: less jelly
gloss, crimson rather than orange sleeves, idle's line work. (3) The judge also scored
the shield 5 (not idle's sunburst); a diffusion repaint of its face came out salmon
(974001-006, rejected), so `shieldfix.py` edits the pixels: the blue band becomes
idle's red band and the blue centre plus orange ornaments a purple face with sunburst
lines, the heart kept (hue-selected and flood-filled from above the belly so his robe
is untouched). (4) A light blend over the disc (0.3 / 0.38, no LoRA, idle + cast's
shield as reference, 6 seeds); **974016** picked. Left open: the wrist guard and belly
keep some gloss, the blended band drifted orange-red, and the style pass added a small
magenta tassel clasp on the chest.

**Cast (optional, not done).** The collar heart clasp and idle's tassel were not
touched: cast passes at 7 and an edit risks it.

**Upstream (not done, needs the owner's plan and the GPU gate):** add cast.960106 to
the ormiX2 training set, captioned with the shield at his side.

## For Bailey

Ask whether **cast at 7** may stand as the style and costume target for the other
three states (the judge's question). The three others are installed as the best
available and are below the bar.

## Files

- `redo.sh` (every diffusion step with its flags), `repaint.mjs` (now also `--poly`,
  `--whole`, `--ref`; the old flags build the old graph), `hemfix.py`, `shieldfix.py`,
  `cut.mjs` (cut-out + guard for a pixel-edited frame)
- `picks.json`, `install.mjs` (adds the below-bar note), `sheet.py` -> `sheet.jpg`,
  `redo-candidates.jpg`
- Backups: `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/ormi/picks/`
  (raw, cut-out, sidecar of every pick, old and new)

## Hard rule 6

§10.1 of `research/ffx2-leblanc-syndicate.md` supports only the stout build, the
shield on his back with the Syndicate heart, and purple samurai attire. The hem
diamonds, band colours, sunburst and eye colour are matched to the installed idle and
cast, not to a source.
