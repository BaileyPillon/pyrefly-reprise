# Macalania r3 poses: Seymour and the Guado Guardian, cast and hurt (FFX only)

**Game case: FFX only.** Chapter VII (`seymour-anima-macalania`): human-form Seymour and the Guado
Guardians (`m141`) of this fight exist only in FFX. No FFX-2 chapter and no shared code is touched.

**Status: CANDIDATES / OPTIONS. Nothing installed.** `public/art`, `src/`, `tests/`, `critic/`,
`docs/target/approved-hashes.json` and `docs/handoff/NOW.md` were not edited. `verify-approved.mjs`:
126 ok, 0 mismatched, 0 missing. Anchor idles unchanged (Seymour `edb8a444...`, Guardian `963b58ee...`).
Method: `docs/plans/art-method-r3/METHOD-CHECK.md` (derive from the at-bar pixels, repaint only
what must change, pilot and LOOK at 1:1 first, no blind re-render rounds).

Sheet: [`sheet.jpg`](sheet.jpg): per subject idle | cast | hurt | none, whole and 1:1 (generated
pixels tinted magenta), then the running battle at 1600x900 (six frames and 1:1 actor crops).
Candidate files: `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-mac-r3-poses/<subject>/`
(`cast.png`, `hurt.png`, sidecars, `*.gates.json`, `*.painted.png`, `ingame.json`).

## Why these two states

`poseForCommand` sends every enemy `ability`, `summon` and (through `POSE_FALLBACKS`
`item -> cast`) `item` to the cast painting. Research (`research/ffx-seymour-anima-macalania.md`
section 4): Seymour casts Shell, the -ra spells, the -ga spells against an aeon, the Multi- spells
and summons Anima; the Guardians cast Protect, Blizzard, Thunder, Shremedy and use Hi-Potion /
Remedy. One cast painting per subject therefore covers every action. No new object (no potion,
no spell effect) is painted: the engine's flash carries the spell, and a potion would be wrong
for the spells.

## What each candidate is

| File | Derivation (idle pixels) | Generated pixels | Gates |
|---|---|---|---|
| Seymour `cast` | The visible hand turned up 50 deg about its root under the lapel and lifted 22 px (fingers raised before the chest); the back locks bent outward from the scalp, up to 28 deg at the tips; the upper body leans 8 deg toward the party about the hips (smooth waist bend). | The sleeve where the fingers were: 3,209 px (0.74 %), masked img2img, seed 7104 of 4 | idle pixels 99.3 %, invented colours 0 % of painted, canvas/baseline = idle's, no soft alpha |
| Seymour `hurt` | Upper body leans back 9 deg about the hips (band y 430..620); robe below unchanged. | none | idle pixels 100 % |
| Guardian `cast` | Fist and whole spear turn 35 deg as one rigid part about the wrist: the front finial rises toward the party, the crescent drops behind; the last 45 px of the forearm bend into the wrist. | The robe where the shaft and forearm were: 8,636 px (2.87 %), seed 7212 of 4 | idle pixels 97.1 %, invented colours 0 % |
| Guardian `hurt` | Upper body leans back 10 deg about the hips (band y 490..670); forearm, fist and spear follow rigidly. | The robe strip the shaft uncovered: 5,701 px (1.84 %), seed 7312 of 4 | idle pixels 98.2 %, invented colours 0 % |

Graph for every repaint (`scripts/repaint.py`): hole crop + 48 px margin, RealESRGAN x4 then Lanczos
to a 1024 short side, Animagine XL 4.0 Opt, `SetLatentNoiseMask` on the hole dilated 4 px only,
denoise 0.6, 28 steps, the moved part pasted back exactly afterwards. Words name only cloth
(negatives forbid spear, pole, hand, skin). No sidecar `scale`: same canvas and `baselineY` as the
idle, so scale 1.0 by construction. Facing `left`, as the idles.

## Hurt against none (at game size)

Captured mid-flinch, 8 frames after `recoil(340)`, same seed and rig (`intro`) for both. **None**
is the idle's own files served as `hurt`: only the warm tint and the knock-back. **Agent's call:**
both derived hurts read as a recoil (head and shoulders thrown back, about 45 to 60 image px),
none reads as the idle. So both are kept as the candidate over none. They are mild; if an
independent judge scores a tie, none wins (no `hurt` file, the engine's `hurt -> idle` fallback).

## Found, not fixed (for the driver or Bailey)

- **The installed Seymour `hurt.png` and `cast.png` are the old non-r3 renders** (judge 2 scored
  the hurt's identity 5 against the r3 idle). These candidates are the replacements for review.
- **The Guardian's pale robe blooms in battle** (judge 2, PR-0097 family): visible in every frame
  here, cast and hurt included. A presenter fix, outside this task.
- Seymour: `despeck` dropped 40 px of detached pale hair fragments beside the fringe (the ones
  judge 2 noted) from the moved layers; Guardian: 57 to 101 px of shaft fragments.
- At 1:1 the Seymour hand still has the idle's hard black outline on its new sides (it reads as a
  raised hand, a little card-like); the Guardian's shaft exit on the robe edge is repainted cloth.
- Attack and ko files were not touched (state map A in the method check: not shown for these two).

## GPU and browser

ComfyUI shared, `/queue` empty 3 minutes before each prompt, one at a time, never restarted. Four
prompts (4 seeds each): 44.3 s, 40.4 s (superseded, the spear mask left robe fringe on the moved
shaft; fixed and re-run), 35.9 s, 35.7 s = **2.6 GPU minutes** (cap 45). No all-black frame.
Browser: own Vite on :5830 (`--strictPort`, HMR and watching off via a scratch config), stopped by
PID; `PYREFLY_BROWSER=gpu`, renderer ANGLE NVIDIA RTX 5070 Ti D3D11; candidates served by
`page.route` (`ingame.mjs`); 0 page errors, 0 failed requests.

## Scripts (`scripts/`, run with `D:/Tools/sd-scripts/.venv/Scripts/python.exe` unless noted)

`sam_parts.py` (ComfyUI embedded python, CPU: SAM 2.1 small part masks), `gua_spear_mask.py`
(fitted shaft axis + SAM), `rig.py` (layer warps, holes, prefill, despeck), `sey_derive.py`,
`gua_derive.py`, `repaint.py`, `assemble.py`, `gates.py`, `sidecar.py`, `look.py`, `sheet.py`;
`../ingame.mjs` (node).

## Owed

An independent 1:1 judge of the four candidates (bar 7), then Bailey's pick per state (cast
candidate or none; hurt candidate or none) before anything is installed.
