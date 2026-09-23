# Logos poses: last attempt, local masked repaints (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared tool,
game file or FFX chapter changed, AGENTS.md hard rule 14). **Every image here is a
CANDIDATE.** Nothing was added to `docs/target/approved-hashes.json` (sha256
`3c5af02f...c15c` before and after; `verify-approved.mjs` 115 ok / 0 mismatched after the
installs).

The independent judge (`../judge.md`, 6 / 6 / 5 / 5) found only local defects and asked
for masked repaints, not a fourth full-figure batch. This run does exactly that: every
fix repaints a masked region of the installed pick's own SDXL frame and keeps every other
pixel (and its alpha) byte for byte. No retraining (the idle fix + retrain and a second
LoRA round need Bailey's yes on training frames; not done).

**Sheet:** `sheet.jpg` (idle, installed whole, 1:1 face, costume, and the 1:1 fixed
region per state). Every candidate of every round: `renders/fix-<state>.jpg`.

## Method (`fix.mjs`, `fix-support.py`, `fixes.json`)

Per pass: crop around the defect, upscaled to 1024 on the long side; feathered mask;
Animagine XL 4.0 -> **logos-x2 LoRA step 2000 at 0.85** -> IP-Adapter plus on a
**region reference** from the idle (emblem crop, head crop) or from attack's good grip,
0.25 to 0.5, ease in 0.2..0.6 -> `VAEEncode` + `SetLatentNoiseMask` -> KSampler 28 steps,
cfg 6, euler_ancestral, denoise per candidate -> merge back through the same mask. Two
tools the judge's list implied: **paste** (the idle's own radial disc, scaled into the
mesh disc's ellipse, lens kept) and **pre-fill** (flat colour over a defect so the sampler
cannot re-read it: cast's grey stub, ko's cheek lens and sash ring). Alpha is kept for
interior fixes; where the silhouette can move, an isnet-anime matte of the patched frame
replaces it inside the mask (`whiteKey` drops the faint halo left over white). Rounds
chain: a later round's pick is an earlier round's fix. 6 candidates per round, one
prompt at a time behind the shared ComfyUI queue; ComfyUI was never restarted; no black
frames; every install passed the cut-out guard.

## Picks and scores (self-judged by the painter; an independent pass is still owed)

Round-3 criteria, 0 to 10 against the idle at 1:1, the score is the worst criterion,
pass is 7. Judge's scores for the replaced files in brackets.

| State | Pick (chain) | What changed | Worst after | **Score** |
|---|---|---|---|---|
| attack | `97105` <- `96101` | Mesh grille disc -> the idle's radial disc (pasted, repainted at 0.5, dark spokes to a hub); lens ring kept | marks 7, outfit 7, weapon 7 | **7** [6] |
| cast | `97212` <- `96201` | Stub pre-filled, low hand repainted at 0.8: the fist closes on the revolver's grip, index at the trigger, barrel down | weapon 7 (grip dark grey, idle's is darker) | **7** [6] |
| hurt | `97322` <- `97314` <- `97303` <- `96303.r2` | Face 0.74: eye visible, v-brows, clenched-teeth wince, the idle's thin grey jaw strap; helmet front 0.58: wing engraving -> grooves; near hand 0.55: fist around the grip | outfit 6 (robe hides the hakama, no violet fade), pose 6 (walking stride) | **6** [5], **best available, below bar** |
| ko | `97422` <- `97401` <- `96402.r2` | Helmet 0.55: glyph band -> plain ribbed dome; cheek lens pre-filled as hair (no strap drawn); brass ring on the sash removed, outline redrawn at 0.52 | helmet 7, face 7, marks 7, style 7 (hard floor shadow, not new) | **7** [5] |

Sidecars carry `selfScore`, `bar` (`best available, below bar` for hurt; `self-judged at
the bar (7); independent judge owed` for the others), the base render's prompt / OpenPose
/ IP-Adapter, and every fix pass (`fixes[]`). Scale unchanged (cast 0.9, others 1.0);
every crop box, size and baseline is the same as the replaced file's, so the manifest
did not change.

Rejected, per state (see `renders/fix-<state>.jpg`):
- attack: `97101`-`97104` (radial but fainter spokes), `97106` (bluer disc).
- cast round 1 `97201`-`97206` (0.62-0.78): the stub became a grip but the fingers lay over
  the frame; round 2 `97211`-`97216` pre-filled the stub; `97213` equally good, lighter grip.
- hurt: `97301`-`97306` face (97303 picked); `97311`-`97316` helmet (97311/97312/97316 a black
  dot, 97315 a blue spot; 97314 picked); `97321`-`97326` hand (97321/97323/97325 a grey wisp
  above the frame; 97322 picked).
- ko: `97401`-`97406` helmet (all lost the glyphs; the sash pass at 0.85 painted a new
  object each time); `97411`-`97416` sash pre-filled at 0.3-0.4 (blurry outline);
  `97421`-`97426` at 0.45-0.6 (97425/97426 painted a brown plate again; 97422 picked).

## What is still owed

- **An independent judge pass** on the four installed files (the painter has scored one
  point high before).
- **hurt stays below bar.** Its outfit (robe over the hakama, navy hem, no violet fade)
  and pose (an even walking stride) are whole-figure properties, not local fixes. The next
  step is a second LoRA round with more than one pose, which needs Bailey's yes on the
  training frames (attack 97105, cast 97212, ko 97422 would be the candidates).
- **The idle's own hanging-gun defect** is still in `idle.png` (round-3 CANDIDATE, the
  identity anchor, untouched here), so a retrain on it would learn it again.
- Not seen in a running battle.

## Hard rule 6, still open

The Syndicate logo's shape is unsourced (research 10.1: "the Syndicate logo on both
shoulders"); attack now carries the idle's radial disc because the idle does. The chin
protector and purple helmet tie strip research names are not in the idle or any pick.

## Commands (from this folder)

```bash
PY=D:/Tools/ComfyUI/python_embeded/python.exe
$PY -s fix-support.py ref ../../../../../../../public/art/characters/logos/idle.png 270,200,400,330 refs/idle-emblem.png
$PY -s fix-support.py ref ../../../../../../../public/art/characters/logos/attack.png 0,110,240,250 refs/attack-grip.png   # (the LoRA pick 96101, before this run)
node fix.mjs attack cast hurt ko          # round 1
node fix.mjs cast.r2                      # stub pre-filled
node fix.mjs hurt.r2 ko.r2                # helmet front; cheek + sash ring
node fix.mjs ko.r2 --refinish             # alpha only (whiteKey, alphaGrow)
node fix.mjs ko.r3                        # sash at higher denoise
node fix.mjs hurt.r3                      # near-hand grip
node install-fix.mjs attack 97105 --score 7
node install-fix.mjs cast 97212 --score 7
node install-fix.mjs hurt 97322 --score 6 --below
node install-fix.mjs ko 97422 --score 7
node ../../../../../../../tools/gen/manifest.mjs   # unchanged
$PY -s build-sheet.py; for s in attack cast hurt ko; do $PY -s fix-sheet.py $s; done
```

Backups: the replaced LoRA picks in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos/replaced-lora-picks/`,
every chained fix (cutout, patched frame, provenance) in `.../poses-fix/`. Patched frames
(`renders/*.fix.raw.png`) and working crops (`renders/fix-work/`) stay local.
