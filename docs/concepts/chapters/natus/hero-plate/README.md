# Chapter X: Seymour Natus, hero plate options (FFX only)

**CONCEPT. Nothing is installed.** No file under `src/`, `tests/`, `critic/`, `public/art/`
or `docs/target/` was written. `sheet.jpg` shows each option as a painting, on the real pause
CHAPTER tab, and on the party-prep chapter card, all at 1600x900. It is laid out one option per
row so it reads on a phone.

**Game case (rule 14): FFX only.** Natus, Mortibody and the Highbridge fight exist only in FFX
(`research/ffx-seymour-natus-highbridge.md` §0.3). The captures use the FFX pause and the FFX
prep screen. No option applies to an FFX-2 chapter.

## The question for Bailey

Which painting should Chapter X use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Kimahri's stand | Kimahri at the left, snarling toward the right. Natus stands close behind him on the right, with his ring. This is beat 8: Kimahri plants his spear on Seymour's chest. | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | Seymour Natus, born of the pyreflies | The boss close up at night. White upswept hair, ashen lavender skin, violet eyes, violet armour, and his carved stone ring behind his head. Lanterns hang in the night air. | `b-*.jpg` |
| **C** | Yuna turns back | Yuna at the right, looking back over her shoulder, with the lit city behind her. Down the bridge on the left, Natus waits with Mortibody. This is beat 9: the party turns round. | `c-*.jpg` |

**My recommendation is B.** It is the only option that shows the boss on both surfaces. The pause
tab crops every plate tightly to one face, and in B that face is Natus's. The card's strip on the
right shows the ring and the lanterns. It is also the approved Chapter IX pattern (D-074: the boss
close up), and his ring is the installed layer's own pixels, so it is on model.

- **Runner-up: A**, if you want the house pattern of Chapters I to III: a party face with the boss
  behind. The pause tab shows only Kimahri. Natus shows only on the card, and there he is dim and
  soft, because he is set behind Kimahri.
- **C tells the chapter's hook best** (the one Seymour fight the party goes back into), but it is
  the weakest in the game. Both surfaces show Yuna and the bridge. Natus and Mortibody sit at the
  left of the plate, under the pause text, and the card does not show them.

A pick approves only the properties you name.

## What is sourced, and what is ours

- **Story beats.** Beats 7 to 9 come from research §8.2, paraphrased from Auronlu's FFX script,
  `[verified: 3 sources]` for the reunion. Kimahri's stand is beat 8, and the turn-back is beat 9.
  The opening line-up (Tidus, Yuna, Kimahri) is research §8.3, `[estimate]`.
- **Natus, his ring and Mortibody.** These are the picked O-1 A, O-2 A and the installed candidate
  idles (`INSTALLED.md`). The ring is placed exactly as the idle sidecar's `layers` block says:
  diameter 974, centre (346, 469), behind the figure.
- **The night with the city lit** is the picked O-3 C.
- **Ours:**
  - every composition;
  - Kimahri's snarl and Yuna's look back;
  - the hanging and floating lanterns (the O-3 C plate has lamps along the bridge; paper lanterns
    in the air are the sampler's reading of "lanterns");
  - Natus's glowing violet eyes and the pink tips in his hair;
  - the lavender halo round the composited figures.
- No game data is shown on the plates.

## How they were made

**Base recipe.** This is the approved hero-plate recipe (`public/art/pause/*.json`):

- `tools/gen/comfy.mjs hero`: Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
  normal. Composition `hero`, so the painted background is kept and there is no rembg.
- **References.** Every base render used its reference; none was skipped by the monochrome guard.
  - A: Kimahri's idle at 0.55 linear, 0.25 to 0.85. This is exactly the approved Kimahri plate.
  - C: Yuna's idle at 0.5, as on her approved plate.
  - B: a head crop of the installed Natus portrait, (130,200)-(730,800), at 0.35 ease in, 0.2 to
    0.6. This is the Macalania and Yojimbo boss-plate setting. It is forced (`--forceRef`), because
    the crop is 41 % one colour, just over the guard's 40 %. The crop is kept in scratch, because
    `public/art` never goes to `main`.
- **Identity words.**
  - Kimahri's and Yuna's words and negatives are copied from their approved plates
    (`kimahri.json`, `yuna.json`).
  - Natus's words come from the O-1 A recipe (`../recipes.json`, `natus-a4`).
- Every prompt and seed is in `run.mjs`. The sidecars of the three renders used are in `renders/`.

**Pilot and rounds.** Each render was looked at 1:1 before the next one.

- **A.** Pilot 951101 came out centred and front-on, with a full horn, gold ornaments and a smirk.
  The words gained "from side, facing right, on the left of the frame". 951102 is the base used.
- **B, rounds 1 and 2.** In 952101 to 952106, every "stone ring" phrase became something else:
  ram horns, a shield held in front of his chest, or a halo of spikes. After two failures (rule
  15), the ring was no longer asked of the sampler. Round b2 asks for open night sky behind his
  head (952201 to 952204). `compose.py` then sets the installed ring layer behind him.
  - The seeds rendered with the portrait reference drew the portrait's gold spike crown.
  - 952203 is the only one without it, so it is the base.
- **C.** 953101, 953103 and 953105 raised a hand to the face. 953102 and 953104 were centred.
  953106 has the right composition: Yuna on the right, her back half turned, the bridge and the
  spires behind her.

**Second figures are composited, not prompted.** The Yojimbo round established this (method r3):
a second figure asked of the sampler binds to the first. So in A and C, Natus (with his ring
layer) and Mortibody are the installed idles' own pixels. They are graded toward the night,
blurred for depth of field, and placed behind the hero's isnet-anime matte (`scripts/matte.py`,
the pipeline's installed weights). The matte keeps only the hero's own connected shape, so
bright lanterns that the matte also kept do not land on top of the boss.

**Repair, C.** 953106 drew Yuna's eyes the wrong way round. By the visual bible, her left eye is
blue and her right eye is green. The two irises traded hue inside a box around each eye. That
changed 1,037 px; the value, the saturation and every line were kept. `crops-1to1.jpg` shows
before and after.

**GPU use.** 21 renders, about 12 GPU minutes, submitted only while the shared queue had fewer
than 3 jobs pending. No render came back black. ComfyUI was never restarted. Nothing was
downloaded; the matte used the `isnet-anime.onnx` already on disk, and `matte.py` refuses to run
rather than fetch it.

## In the game

**How the captures were made.**

- Real GPU (`PYREFLY_BROWSER=gpu`). Our own Vite server on port 5860, with HMR and the watcher
  off, stopped by its PID. The scripts are in `scripts/`.
- Chapter X (`seymour-natus`) is registered but unlisted, and it has **no `ChapterMeta`**, so
  neither surface can show a plate for it yet. The captures therefore run **Chapter I (FFX)**.
  Its party (Tidus, Yuna, Kimahri) is Chapter X's opening line-up, and its scene key
  (`gagazet`) is Chapter X's registered placeholder.
- Chapter I's plate URLs (`pause/ch1-seymour-flux.png`, `.2x.webp`, `.json`) are answered with
  each option by Playwright request interception. The `.json` carries each option's face focal
  (`scripts/shot.mjs`).
- **The words.** Chapter I's words are swapped, in the page DOM only, for Chapter X's registered
  title, number, subtitle, location and blurb (`scripts/words-natus.json`).
  - Chapter X has no quote, handwritten line, tip or snapshots yet, so those are blanked, not
    invented.
  - "Defeat Seymour Natus" is the one objective the sources support: the battle ends when Natus
    dies (research §4.5).

**What the captures still show from Chapter I.**

- The party levels and weapons.
- The battle under the pause veil.
- The 2x masters served here are a lanczos upscale (`scripts/masters.py`), not the RealESRGAN
  route of the installed plates.

## Off-model and open, not fixed

- **A:**
  - Kimahri wears a gold circlet with blue gems, a black mark on his cheek and red face paint.
    None of these is on his approved plate.
  - Natus behind him is dim and soft, and his skirt blades are cut by the frame.
- **B:**
  - His hair falls to his shoulders rather than standing in the O-1 A crest, and it has pink tips.
  - He wears a violet gem on his chest, and his pauldrons are white rather than violet.
  - The dark streaks under his eyes are the prompt's "dark veins".
- **C:**
  - Mortibody is small and cut by the left edge. At card size it reads as a shape, not as a
    creature.
  - The lanterns are paper lanterns, which are ours.

## Where the full-resolution files are

- The option PNGs and the three base renders:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/natus/`.
- Everything else (every render, mattes, captures): `D:/Tools/pyrefly-scratch/hero-plates/natus/`.

**Owed on a pick.**

- The 2x master by the RealESRGAN route.
- A `ChapterMeta` with `heroArt` for Chapter X (the integrator's work).
- Installing the plate to `public/art/pause/`.
