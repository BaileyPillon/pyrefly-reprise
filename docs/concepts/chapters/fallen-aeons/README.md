# Chapter XI — Fallen Aeons, the Road to the Farplane (FFX-2) — end-state options

**Nothing here is built or wired into the game.** No file under `src/`, `tests/`, `critic/`,
`public/art/` or `docs/target/` was touched. These are the hard-rule-9 options rounds that
`docs/plans/chapter-fallen-aeons-review.md` §7.2 says must come back picked before anything
perceivable is built. Pick or mix per row. A pick approves only the properties you name
(AGENTS.md rule 15). Every sheet is stamped `CONCEPT`.

**Game case (rule 14): FFX-2 only.** Every frame uses Chapter V's FFX-2 ATB HUD and the
Chapter V preset (Yuna as a White Mage, Rikku and Paine as Dark Knights; FA4 = a). A pick
applies to this FFX-2 chapter only, not to any FFX chapter. The approved FFX Shiva painting
itself does not change.

| Round | Sheet | Frames |
|---|---|---|
| O-1 The Magus Sisters | `o1-sisters/sheet.jpg` | `o1-sisters/{a-armoured,b-insect-helms,c-robed}-frame-{farplane,road}.jpg`, `*-trio.jpg` |
| O-2 The possessed look | `o2-possessed/sheet.jpg` | `o2-possessed/{shiva,anima}-{a-none,b-chapter4-violet,c-pyrefly-edge}-{frame-road,frame-farplane,card}.jpg` |
| O-3 The Road | `o3-road/sheet.jpg` | `o3-road/{a-one-platform,b-three-platforms,c-dimmed}-{plate,frame}.jpg` |
| O-4 Between the links | `o4-transitions/sheet.jpg` | `o4-transitions/{a,b,c}-{1,2,3}.jpg` |

## Questions for Bailey, one per round

1. **O-1 The Magus Sisters.** FA13's scope stays: one idle and one cast each.
   - A: armoured sisters. Their faces show, and the insect armour is worn as a costume.
   - B: insect helms. Their faces are hidden, and they read as creatures first.
   - C: robed. Insect motifs appear only as ornament.

   **Recommend A.** It follows the only source most literally: they "resemble their *FFIV*
   incarnations, but wear insectoid armour". It keeps three faces for the story beats. Its
   silhouettes are the three the visual bible asks for: a tall V, a squat dome and a small
   hovering teardrop. A still needs a clean pass before it becomes a final:
   - Sandy's scythe must grow from her forearm. Here it floats beside her.
   - Cindy's shell should have black spots on red. Here the spots are white, on red and blue.
   - Mindy's striped abdomen belongs behind her. Here she wears it in front, like a skirt.
2. **O-2 The possessed look (FA12).** F-12 says no source confirms a recolour.
   - A: none. The approved painting as it is.
   - B: the Chapter IV violet. Violet eyes, a violet rim and a dark violet aura, with the
     shadows graded toward violet.
   - C: pyrefly edge. The painting's pixels are untouched, with a pale pyrefly rim and motes
     around the outline.

   **Recommend B, as the preflight did, if the arena is a Road plate (O-3 A or B).** On the
   approved Farplane the violet aura almost disappears into the violet field (sheet row 3).
   On the Road's bright void it stands out. If you keep the Farplane as it is (FA14 a), pick
   C instead. Anima follows the pick, but only after FA11 (is the Anima painting approved?)
   is answered.
3. **O-3 The Road (FA14).** Every option keeps the approved sky and spire.
   - A: one large floating platform over a bright void.
   - B: A, plus the second and third platforms receding toward the spire.
   - C: A under a dimmed Farplane.

   **Recommend A for the three battles.** It is the brightest, the possessed violet shows best
   on it, and one plate serves all three links. **Use B's wide plate as the establishing shot
   between links** (O-4 B). C is the most mournful, but the party is hardest to read on it.
4. **O-4 Between the links (FA2, FA3).**
   - A: a hard cut to an Ink & Gold title card.
   - B: the camera glides along plate B to the next platform.
   - C: a fade to white on a Save Sphere, with "HP and MP restored".

   **Recommend C if FA2 = b** (full restore): it shows the player the restore and marks the
   FA3 retry point. **Otherwise recommend A.** B is the most cinematic and the most engine
   work: it needs a camera path over a plate the scene does not have yet.

## What the sources say, and what is ours

- **The Sisters.** Source: the FF Wiki page *Magus Sisters (Final Fantasy X)*, revid 4045223,
  §Profile, read on 2026-09-24 through the parse API. It says they "resemble their
  incarnations from *Final Fantasy IV*, but wear insectoid armor", and adds:
  - Sandy "is tall and slim and wears red armor", modelled on a praying mantis.
  - Cindy "is rotund and wears blue and red armor", modelled on a ladybug.
  - Mindy "is the smallest", wears orange armour modelled on a bee, and "hovers during battle".

  This is `[single source]`, as `research/visual-bible.md` §1.22.6 already says. The FFIV
  page (*Magus Sisters*, revid 4045225) gives no look beyond its sprites and Amano art, which
  were not fetched. Everything else is ours: faces, hair, helmets, robes, and every colour
  except the three named armours. The FFX-2 enemy pages (Cindy 3980350, Mindy 3980352, Sandy
  3980354) were read by the research, not re-read here. The staging comes from the visual
  bible and is `[estimate]` there: Sandy at the back left, Cindy at the front, Mindy hovering
  on the right with a half-size shadow. The sizes in the frames are ours: Sandy 2.3, Cindy 1.7
  and Mindy 1.2 world units, at the party's scale.
- **The possessed look.** No source confirms a recolour (research F-12; "Dark Shiva" is a
  guide nickname). B follows the house precedent (the `ffx2-bahamut` idle's violet eyes and
  aura). It is not canon.
- **The Road.** Research §9, `[verified: 2 sources]`: "floating stone paths over a bright
  void ... then three large platforms for the bosses". The platform's shape, its stone and its
  glowing cracks are ours. So is Shiva's height in the frames (about 2.6 world units).

## How these were made

Method r3: derive from approved pixels, pilot one image, and look at it at 1:1 before the rest.

- **Anchors.** The Shiva idle is approved (`cast:shiva`), and so is the Farplane backdrop
  (`scene:farplane`). The Anima idle is used **pending FA11**. The approved files were only
  read; nothing under `public/art` was written.
- **Battle frames.** The real game ran on a scratch Vite server (port 5873, HMR off, real GPU),
  stopped at Chapter V's first command menu. Each frame was captured in two layers:
  - the engine plate, with the HUD off and the enemy billboards hidden;
  - the real HUD alone, on a transparent background with the canvas hidden. The guide, the
    enemy-move card and the best-move card were closed with their own keys (G, E and N).

  The enemy names in the HUD were swapped in the page's text before capture: Vegnagun became
  Shiva or Anima. The three-row enemy block is Chapter VI's, renamed Sandy, Cindy and Mindy.
  The paintings were composited in PIL between the plate and the HUD. The party's positions
  and heights are the engine's own, projected from the live camera.

  The Road frames are flat composites. The Farplane scene draws a procedural flower floor in
  3D, so swapping the Road plate in through request interception would still show flowers
  under the party. A real Road needs its own scene ground (track T5).
- **O-1 renders.** `tools/gen/comfy.mjs character` with the house recipe (Animagine XL 4.0 Opt,
  cut-out guard on). One prompt at a time, submitted only while fewer than 3 prompts were
  pending. The pilot, Sandy A, was checked at 1:1 first. It held a staff, had no scythes and
  stood in full profile (`withdrawn-pilot-sandy-a.jpg`). The prompt was tightened, then 9
  renders ran. Five weak ones were rerolled once each; each `withdrawn-*.jpg` file name says
  why it was dropped.
- **O-2.** No GPU. `scripts/possess.py` works on the approved pixels only.
  - B is a colour grade (shadows toward violet, highlights kept), plus a rim, an eye glow and
    an aura behind the figure. Line work and shapes are identical to the approved file;
    `shiva-b-provenance-changed-pixels.jpg` marks the graded pixels.
  - C leaves every figure pixel exactly as approved and adds a rim and motes outside it. In
    the game these would be live particles, not paint.
- **O-3.** Only the approved plate's flower field was masked (`a-guide-before-repaint.jpg`,
  `a-mask.jpg`). A masked img2img (`SetLatentNoiseMask`, denoise 0.75) repainted it over a
  rough guide. The result was pasted back inside the feathered mask, so the sky, spire and
  cliffs keep the approved pixels. The first pilot looked like a desert, so A took two more
  tries and B took two; the withdrawn files are kept. B and C were then built from A's own
  pixels: B places two smaller copies of A's island toward the spire, and C is a grade.
- **O-4.** Stills built from the frames above. The Save Sphere is a drawn placeholder.
- **GPU.** 20 renders, about 5 minutes of the 60-minute cap. No black frame. ComfyUI was never
  restarted: the black-frame guard's restart sentinel pointed at a private log folder. Seeds
  and prompts are in `recipes.json`; scripts and sheet specs are in `scripts/`. Full-size
  renders and captures are in `D:/Tools/pyrefly-scratch/fallen-aeons-options/`.
