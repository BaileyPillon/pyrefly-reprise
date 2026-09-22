# Production — Macalania Temple: Seymour, the Guado Guardians, Anima (2026-09-22)

**Game: FFX only** (chapter art for an FFX chapter; no shared tool, engine or game
file changed; AGENTS.md rule 14). **Every item is a CANDIDATE, not approved.** No
entry was added to `docs/target/approved-hashes.json`; its 115 files hashed the
same before and after this run. Anima's board-approved `idle`, `attack` and
`overdrive` were not written.

**Veto sheet: `sheet.jpg`** — one row per installed item: the picked concept (or
the picked idle the state was referenced from), the installed painting whole, a
1:1 native-pixel face crop and a 1:1 native-pixel detail crop. Scores in the row
labels are my own at 1:1, worst criterion, bar 7; they are not an independent
judge's.

Bailey's picks (`docs/target/targets.json`, D-019): backdrop **A** (warm brazier
gold), Seymour **B** (arms crossed, warm rim), Guado Guardian **A** (the on-canon
reroll), Anima **reuses the approved painting**. Visual facts:
`research/ffx-seymour-anima-macalania.md` §9.

## Recipe

Sprites: **method F**, the Leblanc pilot 2 winner
(`docs/concepts/chapters/leblanc/pilot2/judge.md`): Animagine XL 4.0, 28 steps,
cfg 6, euler_ancestral/normal, the shared STYLE/QUALITY/SPRITE_NEGATIVE/
FACING_NEGATIVE blocks, IP-Adapter reference = batch of a square pad and a
square head crop (`make-refs.py`), concat, 0.4, ease in, 0.2 to 0.6. Only the
words are this chapter's (`words/`, the per-state blocks in `run.mjs`), written
from the picked concepts' pixels and §9; pose words are Danbooru tags and the
sprite lint stripped nothing. **idle first from the picked concept's refs, then
every other state from the picked idle's refs.** Four candidates per item,
judged at 1:1 (`judge-sheet.py`); every render's prompt, seed and reference
settings are in `renders/<subject>/<tag>.json`.

Backdrop: img2img from the picked frame `renders/backdrop-a.png` (denoise 0.45
and 0.55) with §9.1's painter's brief in the words, the backdrop preset's
RealESRGAN x2 route. Pause plate: the hero preset (1344x768, 30 steps, hero
framing and negatives) with the installed Seymour idle's head as a 0.35
reference, plus the 2x master every other plate has (`macalania.2x.webp`).

## What was installed (`install.mjs`, sidecars carry `status: CANDIDATE`)

| Item | File | Pick | Score | Honest read |
|---|---|---|---|---|
| Seymour idle | `characters/seymour-macalania/idle.png` | `idle.510007` | 7 | Concept B's arms-crossed stance, navy robe with red trim, green sash and underskirt, orange hem lattice, tattooed bare chest, courteous closed-eye smile. **Human ears** per research §9.2 (the concept drew elf ears; options.json flagged it for the painter pass). Hair sleeker than the concept. Round 1 (510001-004) read feminine and was dropped after one word change (`adult male, sharp facial features, pectorals`, negatives `androgynous, feminine`). |
| Seymour attack | `.../attack.png` | `attack2.510113` | 5 | An open-palm thrust, whole body in frame on a 1024x1216 canvas (attempt 2: all four 832-wide attempt-1 renders ran off the canvas, pilot 2's finding 5). Off: red streaks across the face idle lacks (the veins drawn as paint); hem lattice missing. |
| Seymour cast | `.../cast.png` | `cast.510202` | 6 | Arm raised, hand on chest, eyes shut. Off: robe a brighter blue, a yellow ribbon. |
| Seymour hurt | `.../hurt.png` | `hurt.510302` | 6 | Head back, eyes shut, hand at the chest. Off: an orange/teal sleeve emblem. |
| Seymour ko | `.../ko.png` | `ko.510401` | 6 | On his side, head left, eyes shut. Off: the chest tattoo reads as a red diamond. |
| Guardian idle | `characters/guado-guardian/idle.png` | `idle.520002` | 6 | Concept A: blue skin, red hair, pointed ears, ochre robe with green trim, and a **full belt pouch** (the Steal gag, §9.3). Off: spear held blade-down, bare feet, a ponytail instead of the concept's tendrils. Round 2 (spear tip up, shoes) came back flatter and harsher; round 1's painting was kept. |
| Guardian attack | `.../attack.png` | `attack.520102` | 6 | A crouched low spear thrust, pouch visible. Off: robe more orange, a different spear head. |
| Guardian cast | `.../cast.png` | `cast.520203` | 7 | Raises a green potion bottle (enemy item use shows the cast pose), pouch, spear. |
| Guardian hurt | `.../hurt.png` | `hurt.520301` | 7 | Head back, eyes shut, hand on the stomach, pouch kept. |
| Guardian ko | `.../ko.png` | `ko.520402` | 6 | Face down, head left, spear beside him; the spear tip touches the frame edge. |
| Anima hurt | `characters/anima/hurt.png` | `hurtE.530343` | 7 identity | The approved idle tilted back 10 degrees and repainted at denoise 0.35. The same creature at 1:1 (one eye, helmet, stitched horns, bandages, fur skirt); the pose is a small recoil, not a new drawing. |
| Anima ko | `characters/anima/ko.png` | `koE.530442` | 6 | The idle drooped forward 14 degrees, denoise 0.3. Reads as a lean more than a collapse. |
| Backdrop | `backdrops/macalania-temple.png` | `backdrop.540001.d45` | 7 | Backdrop A's hall, braziers and ice floor kept, crisper metalwork. §9.1's "light travelling through the walls" is no stronger than in A. Replaces the 2026-09-21 candidate (a different seed that had lost A's composition). |
| Pause plate | `pause/macalania.png` + `.2x.webp` | `hero.550003` | 6 | Seymour's courteous smile with the ice spires behind him, human ear, purple eye. Off: more saturated than the Leblanc bar; the facial veins read as cracks. |

## Anima: two failures, a method check, then a third method

Anima's enemy part asks for `cast`, `hurt` and `ko`, which the aeon never had.
Attempt 1 (method F) and attempt 2 (the recipe behind her approved attack: the
tall idle at 0.8, linear) lost her identity in all 24 renders: worms, beetles,
legs with claws, two eyes, a salmon colour burn. Per hard rule 15 the method
check was written before a third try: `anima-method-check.md`. Attempt 3 took
the pose from the approved idle's own pixels (`puppet.py`: the idle rotated as a
whole, then img2img at 0.3 to 0.4 with method F's references). It held her
identity in every one of its renders I looked at. The first puppet pass
(seeds 53032x/53042x) clipped a horn tip and the skirt at the frame edge; the
second (scaled to 0.88, 53033x/53043x) still clipped the hurt horn; the third
(shifted inside the frame, 53034x/53044x) is the one installed. **`cast` is not painted**: the
engine shows her approved `attack` for it (`POSE_FALLBACKS.cast`).

**Side effect to know about:** `public/art/characters/anima/` is shared with
Yuna's aeon Anima, so the aeon now also has these `hurt` and `ko` paintings
(before, it fell back to `idle`). Both are the same creature (§9.4 note 1);
research says Seymour's Anima is the *smaller* model, which is a matter of
on-screen scale, not of the painting.

## Not done

- **Seymour's portrait**: the existing `portraits/seymour.png` (human form) is
  what the story's speaker lines already use; no new one was painted, so no
  face-crops row changed. The Guardians never speak.
- **The Guardian's empty pouch** (§9.3's payoff after a Steal): not painted; the
  engine has no pose for it.
- **Anima `cast`**: not painted (falls back to the approved attack).
- **Wiring**: `pause/macalania` needs a `PLATE_FRAMING` row in
  `src/app/screens/pause/plates.ts` and a `ChapterMeta.heroArt` when the chapter
  is registered; both are integrator files, not this track's.
- An independent judge pass on every item (these scores are mine).

## Files

`run.mjs` (all renders), `make-refs.py` + `refs/`, `puppet.py`, `words/` (the
picked round's words; `words-round1/` the replaced ones), `judge-sheet.py`,
`picks.json`, `install.mjs`, `build-sheet.py` -> `sheet.jpg`,
`anima-method-check.md`. Every render image (and every raw frame) stays local
(`.gitignore`) and is backed up, with the refs and the replaced 2026-09-21 files,
in `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-macalania/`
(`renders/`, `picks/`, `replaced-2026-09-21/`). The 2026-09-21 run's numbered
candidates and raw frames that sat inside `public/art/characters/guado-guardian/`
were moved there too.
