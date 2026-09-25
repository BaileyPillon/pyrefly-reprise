# Chapter XI: Fallen Aeons, hero plate options (FFX-2 only)

**CONCEPT. Nothing is installed.** No file under `src/`, `tests/`, `critic/`, `public/art/`
or `docs/target/` was written. `sheet.jpg` shows each option as a painting, on the real pause
CHAPTER tab, and on the party-prep chapter card, all at 1600x900. It is laid out one option per
row so it reads on a phone.

**Game case (rule 14): FFX-2 only.** This is the Road to the Farplane gauntlet
(`research/ffx2-fallen-aeons.md` §0 and §6.2). The captures use the FFX-2 pause (pink accent,
dresspheres) and the FFX-2 prep screen. No option applies to an FFX chapter.

## The question for Bailey

Which painting should Chapter XI use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Yuna asks Anima's forgiveness | Yuna in the White Mage dressphere, the hood up, at the left. The possessed Anima stands on the Road behind her on the right. This is beat 6: Yuna asks her forgiveness. | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | The possessed Shiva, close up | Shiva's blue face and dreadlocks, ice crystals behind her head, and the violet glow in her eyes. This is beat 3: the first platform, where Yuna is caught by surprise. | `b-*.jpg` |
| **C** | Sandy, with Cindy and Mindy behind her | Sandy in red mantis armour, looking left. Cindy and Mindy stand behind her on the left. This is beat 5: the second platform, and Yuna's dismay that they have fallen too. | `c-*.jpg` |

**My recommendation is B.** It is the only option that reads on both surfaces. The pause tab
crops every plate tightly to one face, and in B that face is Shiva's, with the violet eyes. The
card's strip on the right shows her dreadlocks and the violet light. It is also the approved
Chapter IX pattern (D-074: the boss close up).

- **Runner-up: A**, if you want the FFX-2 house pattern (Chapters IV and V: Yuna's face with the
  aeon behind). It is the one option that says "her own aeons", and its card shows Anima clearly.
  But the pause tab can only frame Yuna's face under the tab's text column.
- **C** shows the most of the chapter's three fights, but the least in the game. Both surfaces
  show only Sandy. Cindy and Mindy sit at the far left of the plate, where neither surface reaches.

A pick approves only the properties you name.

## What is sourced, and what is ours

- **Story beats.** Beats 3, 5 and 6 come from research §6.2, the SinirothX quote pattern: surprise
  at Shiva, dismay at the Sisters, forgiveness asked of Anima.
- **The party look.** Yuna is in the White Mage dressphere, because the chapter's build is
  FA4 a / FA5 a (`farplaneBuild`, `[verified: 3 sources]`).
- **The possessed look is the picked O-2 B**, the Chapter IV violet. It is in x2-anima's own
  pixels, and B's words ask for it. Research F-12 says no source confirms a recolour; this is the
  house precedent. The Sisters are **not** violet, because O-2 applied to Shiva and Anima only, so
  C has no violet.
- **The Road** is the picked O-3 A plate. A's right half uses its pixels.
- **Ours:**
  - every composition;
  - Yuna's expression (steady rather than downcast; the render did not give sorrow);
  - Shiva's forehead gem and the ice shards behind her;
  - the rainbow bead tie in Sandy's hair.
- No game data is shown on the plates.

## How they were made

**Base recipe.** This is the approved hero-plate recipe (`public/art/pause/*.json`, the FFX-2
plates `ch4-ffx2-bahamut`, `ch5-ffx2-vegnagun-shuyin`, `rikku-ffx2`, `paine`):

- `tools/gen/comfy.mjs hero`: Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
  normal. Composition `hero`, so the painted background is kept and there is no rembg.
- Every prompt and seed is in `run.mjs`. The sidecars of the three renders used are in `renders/`.

**References**, disclosed as the Yojimbo round did:

- **A** forces Yuna's White Mage idle at 0.5 linear, 0.25 to 0.85, the approved FFX-2 plates'
  setting. The idle is 62 % one colour, so the monochrome guard would skip it. At 1:1 the forced
  render shows no colour burn. The first render, which ran without the reference (961101), drew
  the Gunner's pink hood.
- **B** ran prompt-only. The guard skipped the head crop of x2-shiva's idle (49 % one colour), and
  I did not force it.
- **C** ran prompt-only. The guard skipped Sandy's idle (40.4 % one colour, just over the line).

**Rounds.** Each render was looked at 1:1 before the next one.

- **A.**
  - 961101 wore the pink Gunner hood; the words were changed to the White Mage's white hood.
  - Every later base (961102 to 961107, including round a3, which asked for the open half in words)
    filled the frame with the hood.
  - After two failures on composition (rule 15), the method changed. af-961103's Yuna, her own
    pixels under the isnet-anime matte, is moved 230 px left. The space she leaves is the
    installed Road plate, blurred for depth. Anima is x2-anima's idle as installed, facing left,
    toward her.
- **B.** The pilot 962101 was used as it came, with no pixel work.
- **C.**
  - Pilot 963101 was centred, with glowing pink eyes.
  - The words dropped the violet and asked for red eyes and room on the left.
  - 963103 put her on the right, and it is the base.
  - Cindy and Mindy are their installed idles' own pixels, graded toward the Road's light,
    blurred for depth, and faded at the crop edge.

**Repair, A.** af-961103 drew Yuna's eyes the wrong way round. By the visual bible, her left eye
is blue and her right eye is green. The two irises traded hue inside a box around each eye; value,
saturation and every line were kept. `crops-1to1.jpg` shows before and after.

**GPU use.** 12 renders, about 6 GPU minutes. They were submitted only while the shared queue had
fewer than 3 jobs pending, and that made this round slow, because the queue was mostly full. No
render came back black. ComfyUI was never restarted. Nothing was downloaded: the mattes used the
`isnet-anime.onnx` already on disk (`../../natus/hero-plate/scripts/matte.py`).

## In the game

**How the captures were made.**

- Real GPU (`PYREFLY_BROWSER=gpu`). Our own Vite server on port 5860, with HMR and the watcher
  off, stopped by its PID.
- The capture scripts are shared with Chapter X and live in `../../natus/hero-plate/scripts/`:
  `shot.mjs fa`, `words-fa.json`, `sheet.py fa`, `masters.py fa` and `labels-fa.json`.
- Chapter XI (`ffx2-fallen-aeons`) is registered but unlisted, and it has **no `ChapterMeta`**, so
  neither surface can show a plate for it yet. The captures therefore run **Chapter V (FFX-2)**.
  Its build is the same `farplaneBuild` (Yuna White Mage 46, Rikku and Paine Dark Knight 48 / 50),
  and its scene key (`farplane`) is Chapter XI's registered placeholder.
- Chapter V's plate URLs (`pause/ch5-ffx2-vegnagun-shuyin.*`) are answered with each option by
  Playwright request interception. The `.json` carries each option's face focal.
- **The words.** Chapter V's words are swapped, in the page DOM only, for Chapter XI's registered
  number, title, subtitle, location and blurb.
  - "Defeat Shiva, the Magus Sisters and Anima" is the chapter's own shape (research §6.2).
  - BATTLE 1 OF 3 is its three links.
  - The quote, the handwritten line, the tip and the snapshots do not exist yet, so they are
    blanked, not invented.

**What the captures still show from Chapter V.**

- The battle under the pause veil.
- The HUD's boss name, which now reads "Fallen Aeons" because of the word swap.
- The 2x masters served here are a lanczos upscale, not the RealESRGAN route of the installed
  plates.

## Off-model and open, not fixed

- **A:**
  - Yuna's expression is steady, not the sorrow asked for.
  - Her eyes needed the swap described above.
  - The hood's gold crescent is a ring, not a moon pattern.
- **B:**
  - The void behind her is dark violet, not the Road's bright pale void.
  - Her eyes glow pink-violet with a patterned iris.
  - She wears gold bands on two locks and a diamond gem on her forehead; the installed idle has
    neither.
- **C:**
  - The mantis crest reads as thin blades more than as a helm.
  - The bead tie in her hair is unsourced.
  - Cindy and Mindy are soft and small. Mindy's wing is cut by Cindy's head.

## Where the full-resolution files are

- The option PNGs and the three base renders:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/fallen-aeons/`.
- Everything else: `D:/Tools/pyrefly-scratch/hero-plates/fallen-aeons/`.

**Owed on a pick.**

- The 2x master by the RealESRGAN route.
- A `ChapterMeta` with `heroArt` for Chapter XI (the integrator's work).
- Installing the plate to `public/art/pause/`.
