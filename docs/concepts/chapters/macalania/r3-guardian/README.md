# Guado Guardian, Macalania idle, r3 (FFX only)

**Game case: FFX only.** Chapter 7 (Macalania Temple) is an FFX encounter, and the Guado
Guardians (`m141`) of this fight exist only in FFX. Method: `docs/plans/art-method-r3/METHOD-CHECK.md`
(derive from the approved pixels, repair only what must change, no blind re-render rounds). It is
the same treatment commit `935674f` gave Seymour (`../r3-seymour/`).

**Status: CANDIDATE, installed with a backup. Not approved.** There is no entry in
`approved-hashes.json` (checked with `verify-approved.mjs` before and after: 124 ok, 0 mismatched).
Nothing here needs Bailey's yes to be undone.

## What was done
The production idle is the approved concept pick **Guado Guardian A** (`../renders/guardian-a.png`),
taken from its raw render (ComfyUI `pyrefly/guado-guardian-a2_idle_00001_.png`, seed 501031).
**Every opaque pixel is the render's own pixel**: measured, 310,283 opaque px, 0 differ from the raw.
**No repaint.** The cut-out and the framing did not require one.

1. **Cut-out.** The concept's isnet-anime matte (binary) was checked against a SAM 2.1 small mask of
   the raw render, run on the CPU (`scripts/sam_cut.py`). `scripts/cutout.py` made three changes.
   It grew back the thin hair tails and spike tips that isnet dropped (1,756 px), peeled the white
   halo using the rule from `r3-seymour/scripts/matte.py` (870 px), and removed the flat white
   background trapped inside the spear's crescent blade (431 px). Alpha stays binary, the house
   convention.
2. **Framing** (`scripts/frame.py`): the canvas is 826x1153 with 16 px margins on every side and
   `baselineY` 1137 (height minus 16). These match the conventions of the idle it replaces
   (602x1179, `baselineY` 1163). The sidecar's `scale` is left unset, as before.
3. **Facing.** The pixels face screen-left: the face, the eyes and the spear tip all point left.
   The sidecar says `facing: "left"`. The running battle confirms it: both Guardians have
   `planeScaleX` +2.08 (not mirrored) and look toward Yuna, Tidus and Rikku (`ingame-r3-frame.jpg`).

**Both Guardians at 1600x900** (seed 1, same camera): the pair reads as two identical hooded
retainers, heads bowed, spears held low toward the party. They are the same world height as
before (2.91), and at game size they are clearly subordinate to Seymour. That is what research
§9.3 asks for: "subordinate in silhouette to Seymour", "furniture that moves".

**Judgement (self, 1:1 and in battle; no independent judge):** it beats the installed idle (judged 6).
It is Bailey's pick exactly: the hood, the long hair tendrils, the dark shoes and the
spear. The installed idle had a ponytail, bare feet and a blade-down halberd, and the judge had
already named "not the concept's tendrils". The cut-out shows no halo at 1:1 on a dark
background. So it is installed as a CANDIDATE.

## Seymour `hurt.json` facing: fixed (sidecar only)
The pixels of `public/art/characters/seymour-macalania/hurt.png` face **screen-left**: the nose and
lips are on the left of the head and the ear on the right, the hair falls down his back on the right,
and his far sleeve (the one with the emblem) is on the right. The 2026-09-22 cleanup had set the
sidecar to `"right"`. The engine therefore mirrored the plane (scale x -2.71), and Seymour recoiled
facing away from the party (`ingame-hurt-before-fix-*.jpg`). The sidecar is now `"left"`, with a
`facingRecheck` note. There is no pixel change. After the fix, `planeScaleX` is +2.71 and he recoils
toward the party (`ingame-hurt-installed-*.jpg`). The backup of the old sidecar is listed below.

## Findings for the driver / Bailey
- **No belt pouch.** Research §9.3 (`research/ffx-seymour-anima-macalania.md`) says to "Give them a
  belt pouch that is visibly full and then visibly empty". That line is a painter's note for the
  Steal gag, marked `[derived]`, not a game fact. Concept A has no pouch, and the idle it replaces had
  one. The r3 idle keeps Bailey's pixels. The sheet's last row is an **OPTION, not installed**: a
  pouch inpainted on the concept pixels, from one pilot prompt (32.8 s, 4 seeds; seeds 9101 and 9104 shown).
  Adding it is Bailey's call.
- **The robe's lit areas bloom in battle.** The concept's pale-yellow highlights on the lower robe
  pass the stage's bloom and rim light, so at game size the hem reads a little like glowing cloth
  (`ingame-r3-frame.jpg`). The pixels are the concept's. If this is unwanted, the fix belongs to
  the presenter's bloom threshold, not to a repaint. The same bloom washes Seymour's hurt face near
  white (the PR-0097 family).
- The other Guardian states (attack, cast, hurt, ko) were derived from the old idle, so they do not
  match r3: they show the ponytail, the pouch, bare feet and the halberd. Under METHOD-CHECK §2
  state map A, only a hero cast (and optionally a rig-baked hurt) would be derived from this idle.
- In `ingame-installed-frame.jpg` the floor has not finished drawing. The capture came before the
  stage settled, and it is not a difference between the two idles.
- Self-judged only. No independent 1:1 judge has scored this yet.

## Files
- `sheet.jpg`: concept, the idle installed before r3, and r3, side by side. Rows: the whole figure,
  then 1:1 crops of the head, the hand on the spear, the spear head and the hem with the feet, then
  both Guardians in battle at 1:1 (installed, then r3), the whole frames, the Seymour hurt facing
  check, and the pouch option.
- `ingame-*.jpg` and `ingame-*.json`: the battle captures (RTX 5070 Ti, ANGLE D3D11,
  `PYREFLY_BROWSER=gpu`, 1600x900, seed 1, Vite on 5520, stopped by PID). `ingame.mjs` serves each
  variant by request interception and writes PNGs, which were converted to JPEG. The PNGs are in
  `D:/Tools/pyrefly-lora/guardian/r3/ingame/`.
- `scripts/`: `sam_cut.py`, `cutout.py`, `frame.py`, `measure.py` and `cmpmask.py` (cut-out and
  framing); `prep_pouch.py`, `wf_inpaint.mjs`, `wf-pouch.json`, `gpu.mjs` and `upload.mjs` (the
  pouch option pilot); `sheet.py`.
- Scratch and intermediates: `D:/Tools/pyrefly-lora/guardian/r3/` (`raw.png`, `cut.png`, the SAM
  masks, `idle-r3.png` and `idle-r3.json`, the pouch outputs).
- Backups of the replaced files: `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch7-r2/guado-guardian/replaced/`
  (`idle.png` and `idle.json`, seed 520002) and `.../seymour-macalania/replaced/hurt.json`.
- **Rollback:** copy those files back over `public/art/characters/guado-guardian/` and
  `public/art/characters/seymour-macalania/hurt.json`.

**GPU:** one ComfyUI prompt, 32.8 s (the pouch option pilot, from the history API). The idle itself
used no GPU. The cap was 60 minutes.
