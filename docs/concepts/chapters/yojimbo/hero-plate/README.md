# Chapter IX — Yojimbo: hero plate options (FFX only)

**CONCEPT. Nothing is installed.** No file under `src/`, `tests/`, `critic/`, `public/art/`
or `docs/target/` was written. `sheet.jpg` shows each option as a painting, on the real pause
CHAPTER tab, and on the party-prep chapter card, all at 1600x900.

**Game case (rule 14): FFX only.** This is Lady Ginnem's Yojimbo in the Cavern of the Stolen
Fayth (B1). The captures use the FFX pause and the FFX prep screen, and no option applies to an
FFX-2 chapter.

## The question for Bailey

Which painting should Chapter IX use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Lulu and the unsent Lady Ginnem | Lulu, head bowed, in the cold chamber. Ginnem stands pale and half-transparent behind her shoulder, facing her. The moment Lulu recognises her (research §6.2 beat 3). | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | Yojimbo drawing Zanmato | The boss close up: gold jingasa, fanged gold menpo, purple robes, orange sash, a katana leaving its scabbard. | `b-*.jpg` |
| **C** | Lulu's last duty | Lulu's **approved** plate face (her composed half-smile) moved into the cavern, with Yojimbo standing dark behind her. | `c-*.jpg` |

**My recommendation is B.** It is the only option that reads on both surfaces at a glance. The
pause tab crops every chapter plate tightly to one face: `ref-ch1-pause.jpg` is Chapter I's
approved plate on the same tab. In B, that one face is Yojimbo's mask, and the card's right-hand
strip shows his gold hat brim. B was also the one option that needed only a small erase repair
(below).

- **Runner-up: C**, if you want Chapter IX to keep the house pattern: a party member's face, with
  the boss behind. In C, Lulu's face is her approved pixels, so it is on model by construction.
  But Yojimbo is visible only in the card's corner, not on the pause tab. The cut-out also needs a
  clean pass (`crops-1to1.jpg`).
- **A tells the story best**, but it is the weakest in the game. The pause tab shows only Lulu.
  Ginnem appears only on the card.

A pick approves only the properties you name.

## What is sourced, and what is ours

- Story beats: Lulu recognises Lady Ginnem, the unsent summoner she guarded first. Ginnem breaks
  Yuna's sending. Lulu takes on her last duty as Ginnem's guardian. Source:
  `research/ffx-yojimbo.md` §6.2, `[verified: 2 sources]`.
- Yojimbo's gold / orange / purple look: research §6.3, from the wiki (single source).
- Ginnem's look: the installed CANDIDATE idle, `public/art/characters/ginnem/idle.png`.
- The chamber's cold grey-blue light is the picked O-4 A. Light and colour are `[estimate]` in the
  research.
- These are ours: every composition, Lulu's expressions, the blade glint, and the pale blue light
  orbs that stand in for pyreflies.
- No game data is shown on the plates.

## How they were made (method r3, `docs/plans/art-method-r3/METHOD-CHECK.md`)

**Base recipe.** The approved hero-plate recipe (`public/art/pause/lulu.json`, `ch2-yunalesca.json`):

- `tools/gen/comfy.mjs hero`: Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
  normal.
- Composition `hero`, so the painted background is kept and there is no rembg.
- Lulu's identity words and negatives are copied verbatim from her approved plate.
- Every prompt and seed is in `run.mjs`. The sidecars of the renders that were used are in
  `renders/`.

**Pilot.** The pilot (`a-909101`) was looked at 1:1 before any batch. "Pyreflies" drew winged
insects, and the bokeh read as city lights. Both were fixed in the words.

**Round 1** (`withdrawn-round1-prompted-figures.jpg`). The second figure's words bound to Lulu:

- A painted her face white.
- "ghost" drew sheet ghosts.
- C put the samurai hat on Lulu's own head.

So from then on, the second figure is not asked of the sampler. It is **composited from its
installed idle's own pixels** (`compose.py`): blurred for depth of field, lit cold, and placed
behind Lulu's matte. The matte is isnet-anime, the pipeline's installed model.

**Round 2** (`withdrawn-round2-lulu-bases.jpg`). Lulu-only renders.

**Round 3** (`withdrawn-round3-img2img-from-approved.jpg`). img2img from her approved plate. At
0.5 to 0.62 it kept the Macalania woods and the smirk, so C takes her approved pixels directly
and replaces only the background: the installed cavern backdrop candidate, blurred.

**Round 4** (`withdrawn-round4-with-references.jpg`). Every earlier render had run **without its
IP-Adapter reference**. The monochrome guard in `comfy.mjs`, added 2026-09-21 after the approved
plates, skips Lulu's idle (top-2 share 0.46, the case it was calibrated on) and both Yojimbo crops
(0.73 padded, 0.50 tight).

- A's final base, `a4-909143`, forces Lulu's idle at 0.5 linear, 0.25 to 0.85. That is exactly
  the approved Lulu plate's reference. At 1:1 it shows no colour burn, and her lace collar and
  dress came back.
- B could not honour the guard with any reference, so it is prompt-only. That is disclosed, and I
  did not force it.

**B's repair.** The mask's glowing blue eyes and teeth are unsourced: the idle's eye holes are
dark. They were darkened inside a box around the mask openings only, 4,813 px. That is an erase,
with nothing painted. See `crops-1to1.jpg`, before and after.

**GPU use.** About 10 GPU minutes (50 renders at 10 to 16 s each), one at a time on an empty
queue. No render came back black.

## In the game

**How the captures were made.**

- Real GPU. Our own Vite server on port 5880, HMR off, stopped by PID. Scripts are in `scripts/`.
- Chapter IX (`yojimbo-cavern`) is registered but has **no `ChapterMeta`**, so neither surface can
  show a plate for it yet. The captures therefore run Chapter I (FFX).
- Its plate URLs (`pause/ch1-seymour-flux.png`, `.2x.webp`, `.json`) are answered with each option
  by Playwright request interception. The `.json` carries a face focal, as every installed
  sidecar does.
- Chapter I's words are swapped, in the page DOM only, for Chapter IX's registered title,
  subtitle, location and blurb (`scripts/words.json`).
- Chapter IX has no quote, tip, snapshots or first two objectives yet, so those are blanked and
  not invented. "Defeat Yojimbo" is the one objective the sources support.

**What the captures still show from Chapter I.**

- The party (Tidus, Yuna, Kimahri) and SCENE GAGAZET are Chapter I's. Gagazet is also Chapter IX's
  registered placeholder scene.
- The 2x masters served here are a lanczos upscale, not the RealESRGAN route of the installed
  plates.

## Off-model and open, not fixed

- A: hair falls across Lulu's eyes; they are downcast. Ginnem's hair is fair, as her idle is.
  Brunette was never sourced.
- A: Ginnem's crop ends at mid-body, at the bottom edge of the plate.
- B: his hat is the right conical jingasa. The pauldron shows only at the lower right.
- B: the blade is patterned blue steel, which is ours.
- C: Lulu's expression is the approved plate's half-smile, not new "resolve".
- C: the cut-out shows a straight edge along her hair at 1:1, and a light fringe under the jaw
  (plate backlight). Both need a clean pass if C is picked.
- **Downloads (rule 11), disclosed.** While matting, `rembg` fetched two model files I had not
  asked for, before I saw it happening. They came from `github.com/danielgatis/rembg` releases:
  - `isnet-general-use.onnx`, 179 MB
  - `u2net_human_seg.onnx`, 176 MB

  Both are now in `D:/Tools/ComfyUI/rembg-models/models/`. **I did not use them.** Every matte
  here comes from the installed `isnet-anime`. They are left in place for Bailey to keep or
  delete.

## Where the full-resolution files are

- The option PNGs and the two base renders: `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo-hero-plate/`.
- Everything else: `D:/Tools/pyrefly-scratch/yoj-hero/`.

**Owed on a pick.**

- The 2x master by the RealESRGAN route.
- A `ChapterMeta` with `heroArt` for Chapter IX (the integrator's).
- Installing to `public/art/pause/`.
