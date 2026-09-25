# PR-0096: Leblanc's idle with the fan open (candidate, FFX-2 only)

**Game case: FFX-2 only.** Chapter VI (the Leblanc Syndicate) is an FFX-2 chapter, and Leblanc is
an FFX-2 subject. Nothing here touches FFX art or shared code.

**Issue.** Round 11 deep review, item 18 (PR-0096, major, carried): the installed idle
(`public/art/characters/leblanc/idle.png`, sha256 `4fea45f9...`) holds the fan shut against her
lips. Bailey named pick B ("fan fully open, warm magenta"; targets.json, chapters/The Leblanc
Syndicate, mustChange). The acceptance check is that link 3 at 1600x900 shows the idle with the fan
open.

**Status: CANDIDATE, not installed.** Files are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-25-leblanc-fan/`:
`idle.fan-open.red.png` / `.json` (recommended), `idle.fan-open.magenta.png` / `.json`, the masks,
`gates.*.json`, `transplant.*.json`, the in-game frames and run logs (`ingame/`), and the capture
harness copy (`harness/`). Sheet: `sheet.jpg` in this folder. It shows the four figures side by
side at 1:1, the fan at 2x, and the real Chapter VI frame.

## Method (r3: idle pixels plus a transplant, no GPU)

`fan_open.py --layer guard --theta0 196 --theta1 288 --r0 168 --r1 168 --phi0 268 --defringe 3 [--hue magenta]`
(run with `D:/Tools/sd-scripts/.venv/Scripts/python.exe`, the Python install that has OpenCV).

1. **The leaf comes from Leblanc's own installed `cast.png`.** That cast holds the open folding fan:
   a red leaf, silver and black sticks, and a black end band with gold lines. Its outer guard,
   black with blue stripes, is exactly what the idle's closed fan looks like, so the two paintings
   already show the same fan. The leaf is taken from source angles 268 to 350 degrees around the
   cast's rivet at (304,163), skipping the guard stack. It is polar-remapped at 4x supersampling
   onto a flat sector around the idle's end cap at (498,222), from 196 to 288 degrees, radius 168.
2. **Layering.** The leaf sits behind the hair and head. The idle's closed fan stays in front as
   the open fan's front guard, with its tip at her lips as before. The idle's hand and end cap
   (the skin mask plus 1 px of finger ink, and the rivet within 24 px) are pasted back on top. The
   result is that she smiles over the guard and the open leaf frames her head. A front-layered
   version, with the leaf over her face, was tried and dropped: it hides her far eye and half of
   the smile.
3. **Seam.** At 124 pixels, the old white cut-out matte along the hair edge would show against the
   leaf. The rule catches grey-white, low-chroma pixels (not blonde, whose chroma is about 40),
   reached from the transparent area in 3 px or less, plus enclosed white pockets. Those pixels
   become transparent. The join is clean at 6x, so the seam got **no ComfyUI repaint**.
   GPU time was 0 minutes.
4. **Magenta** is the same file with only the red leaf hues rotated to a warm magenta. The ink,
   the silver sticks and the gold line are unchanged.

## Gates (`gates.py`, both variants PASS)

| | red | magenta |
|---|---|---|
| canvas | 591x1118, same as idle (the idle's sidecar baselineY 1102 holds) | same |
| changed px | 15,232, all inside the new fan mask plus the matte mask | same |
| changed outside those masks | **0** (MAD 0.0) | 0 |
| of which newly opaque (over transparent) | 15,108 | 15,108 |
| changed bbox / margin to canvas | (383,54)-(549,217) / 41 px (at least 16 required) | same |
| installed idle on disk | unchanged, sha256 `4fea45f9...` | |

## Real frame (1600x900, `PYREFLY_BROWSER=gpu`, real keys)

A copy of the round-11 capture route (`critic/rounds/round-11/cap/route.mjs`, not modified in
place) was run against this folder's `vite.fan.config.mjs`: its own server on 5780, HMR and the
watcher off, stopped by its PID afterwards. The route was real keyboard input on a fresh profile
from the title: briefing, board, prep (Esc back and re-enter), pre-scene (hold to skip), then the
fight following the advisor, with the spherechange, the seams into links 2 and 3, and the link 3
command menu. It stopped at the first link 3 menu with Leblanc in `idle`. The only change to the
game was Playwright `route.fulfill` on `/art/characters/leblanc/idle.png`, which served 3 requests.
There were 0 console errors and 0 404s.

- `docs/screenshots/round11/pr0096-leblanc-fan-red-ch6-link3.jpg` (Leblanc rect 81x156 at (800,380))
- `docs/screenshots/round11/pr0096-leblanc-fan-magenta-ch6-link3.jpg`

The open fan reads at game scale. Red separates from the pink heart backdrop better than magenta
does.

**Seen, outside this track:** at the link 3 menu, the left edge of the enemy intent card (x about
867) cuts through the right half of the open leaf. This is the same family of issue as PR-0094, and
it is left to whoever owns the intent card.

## Open for Bailey (two named properties disagree)

- Pick B says the fan is fully open and **warm magenta**. D-036 (2026-09-23, a later decision) says
  the fan "stays the red leaf with silver ribs the installed cast already shows". That note was
  written because D-036 assumed the idle already showed the red leaf. It does not: the idle's fan
  is closed and black. **Recommended: red.** It agrees with D-036 and with the installed cast, so
  idle and cast show one fan, and it reads better on the chapter's pink set. Magenta is ready if
  Bailey prefers pick B's colour words.
- Pick B's fan is a round **uchiwa** held at the chest. Neither candidate copies that shape or pose.
  Both keep the idle's pose and the folding fan that research and the cast describe. "Fan fully
  open" is the property the targets tile names.
- To install on a yes: copy the chosen PNG to `public/art/characters/leblanc/idle.png`. The existing
  `idle.json` stays valid, because the canvas and baseline are unchanged. Back up the replaced
  file, and only on Bailey's word record its sha256 in `approved-hashes.json` (METHOD-CHECK Step 0).
