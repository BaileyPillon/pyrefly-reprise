# Sin: art options for the two Sin chapters (FFX only, 2026-09-29)

Bailey, 2026-09-28 ~22:00 EDT: "all your recommendations", then "please work on implementing all remaining chapters
that we decided upon". The remaining decided chapters are the two Sin chapters:
- D-263: concept A as the end state, reached through B
- D-264: the Garden of Pain party with Yuna's Tetra Ring back
- D-270: two chapters, "the Fins and the Core" (links I to III), then "the Face" (link IV)

This folder is the **art options round** for both chapters, for Bailey's morning pick.

**These are options, not approved art.** Nothing is installed in `public/art/`, nothing is wired, and nothing is
listed or on the end-state board (rule 9). Bailey let the driver pick tonight (D-279), so each section marks one
recommended pick with its reasons. Each pick is an agent's look.

**Game case: FFX only** (rule 14). Links I to IV are fought from the *Fahrenheit* and on Sin's back. They use CTB
turn order, Cid's Trigger Command, the airship range and aeons, none of which exists in FFX-2
(`research/ffx-sin.md` §0.3).

## Open first

| File | What |
|---|---|
| `options.html` | **The morning sheet**, self-contained (JPEG data URIs, 6.6 MB). An overview of every pick, then one section per subject with the options at battle size (1600 × 900), strengths and faults, and the pick marked. It ends with the method and every render with its verdict. The head section is `head/section.html`, embedded as it is |
| `part-1.jpg` to `part-7.jpg` | The same page for a phone, one section per part, 1080 px wide: 1 overview, 2 the head, 3 the Left Fin, 4 the Right Fin, 5 link III (Genais and the Core), 6 the link-IV backdrop, 7 the method and every render |
| `frames/` | The 16 rough battle frames (`fin-<a,b>-<l,r>-<near,far>.jpg`, `fin-*-l-near-charge.jpg`, `genais-<a,b>[-shell].jpg`, `bk-<a,b>.jpg`) and three strips (`cores.jpg`, `bk-plates.jpg`, `plates.jpg`) |
| `head/` | The head agent's part: Sin's head, C repaired and A head-on, with its own README |

## The picks (an agent's look; the reasons are in the sheet)

| Subject | Options | Pick |
|---|---|---|
| Sin's head (link IV) | C repaired, A head-on | **C repaired** (see `head/README.md`) |
| Left and Right Fins (links I, II), FAR and NEAR | A: a clawed arm with a ribbed fin. B: a whale's pectoral fin with claws | **A**: it reads as an arm at both ranges. B's tip turns into a second head at NEAR |
| Sinspawn Genais (link III) | A: a fiend under a craggy dome shell. B: a tentacled fiend in a conch | **A**: the shell state reads at a glance |
| Sin's Core (link III) | A: a dark pearl in a hump of scales. B: a lantern bulb on a tall stalk | **A**: its charge reads across the frame |
| Link IV backdrop, the deck over Bevelle at dusk | A: golden dusk. B: violet evenfall, the lamps lit | **A**: its light matches the head rigs' plate, and its city is now small and far |

## What the frames are (rough, not the HUD build)

- **The painting.** It is full frame, with light states the engine would add over one painting (`src/compose.py`):
  - NEAR shades the deck and FAR leaves it lit.
  - A core at rest is darkened, and a charging core glows ("Core gathers energy.").
  - Round 3's dressed deck layer is laid back over every Fin frame, so all the Sin frames share one deck.
- **The party.** The Garden of Pain line-up (Tidus, Yuna, Auron) as our own idle sprites. HP and MP maxima come from
  `src/data/ffx/builds/dreams-end.ts` (D-264, S-29, our estimate). The current values are illustrative: links I to
  III carry HP between them (research §1.2).
- **A stand-in HUD** in the game's fonts (`src/frame.html`):
  - the link strip
  - the range dial
  - Cid's order: CLOSE IN or PULL BACK, as in Chapter VIII
  - the CTB column with Cid
  - the sourced system messages ("Sin remains motionless.", "Core gathers energy.", "Core is inactive.", "Magic absorbed.")
- **The link-IV backdrop frames.** The Evrae-layout plate is rolled 11.6 degrees, as the engine rolls it, with a flat
  stand-in deck and rail drawn in code (`src/compose_bk.py`). The engine's own deck is geometry.

## How it was made (rule 8: original art only)

- **Written sources only:**
  - `research/ffx-sin.md` §1.1, §2.1, §4, §5, §9.1 to §9.3
  - `research/ffx-evrae-airship.md` §12
  - FF Wiki text read through the MediaWiki API on 2026-09-28: "Left Fin" (revid 3981190), "Right Fin" (4031682),
    "Sinspawn Genais" (4016986), "Sinspawn Geneaux" (4016978), "Sin (core)" (4015250), and "Sin (Final Fantasy X)",
    Appearance
- **No retail image anywhere.** None was used as input, reference or IP-Adapter. No prompt names the creature, the
  game or the franchise. The image inputs were:
  - our code-drawn sketches: `src/sketch.py`, `src/sketch_link3.py`, `src/bk_init.py`, `src/bk_city.py`, `src/shell.py`
  - round 3's plate p6 and its deck layer
  - Bailey's approved Evrae plate (`public/art/backdrops/evrae-airship-deck.png`, our own)
- **Engines:**
  - The creatures and plates use z_image_turbo, painted INTO their plate as masked repaints (`src/gen.py` mouth mode),
    so every pixel outside the creature is the plate's.
  - The link-IV relights use animagine-xl-4.0-opt as img2img at 0.40, so the Evrae hull keeps its shape.
  - Every render gets a RealESRGAN x4 detail pass to 2352 × 1344.
- **Passes** (`src/run1.sh` to `src/run8.sh`), each after LOOKING at the last:
  1. the plates and the first backdrops
  2. Genais v1
  3. the Fins and the backdrop relights
  4. Genais v2, a fiend and not a cute animal
  5. FAR v2, with round 3's head in words
  6. the city, the limb words and the shelled state
  7. Fin A left, a spread hand
  8. a smaller city, and Fin B left as a paddle
  9. and 10. the city's method check (`src/bk_city.py`, rule 15, run by the head agent's copy): v3, then v4, a tiny
     city drawn in frame coordinates. v4 held for A (bk-a-8) and failed for B, so B keeps v1 (bk-b-4)
- **Every render has a `.prov.json`:** seed, strengths, prompt and inputs.
- **GPU.** We submitted only while fewer than 3 prompts were queued in total (shared with the head agent), one of
  ours at a time, with batch size 1. ComfyUI was down after the evening reboot and was started once through the
  PyreflyComfyUI task; it was never restarted. 47 jobs ran, and none came out black.

**Candidates** (full size, raw, with provenance) are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/`:
`plates/`, `fins/`, `link3/`, `backdrop/`, `sketches/`, `frames-bg/`. The head agent's are in `head-*`.

## Faults left (an agent's look; all are in the sheet)

- **Fins:**
  - At NEAR the top of an arm can still read as a beaked head. It is worst in B, where three renders did not fix it.
  - The painted core is bright even at rest, so the at-rest state is our darkening of it.
  - At FAR Sin is bigger than "small against clean sky", which the range director could scale.
  - The Right Fin A shoulder grew a few machine-like rings. A local repaint would fix them.
- **Genais:**
  - A's face is still a little toad-like.
  - B sits in white puffs that no source asks for.
- **The Core:** A sits close behind Genais, so "out of reach" is told by the HUD more than by distance.
- **Backdrops:**
  - A's city is now small and far, but its tower wears an odd crown and a dark haze bank sits behind it.
  - B's city is still too near and too big, and its twilight would need the head relit.

## Re-render (from the repo root; `src/`, the GPU rules above)

```
python src/bk_init.py "<main repo>/public/art/backdrops/evrae-airship-deck.png" <cand>/sketches
python src/sketch.py <round3>/plate/p6.base.png <cand>/sketches flight;  python src/sketch.py x <cand>/sketches back
bash src/run1.sh                                   # the plates, the backdrop tries
python src/sketch.py <cand>/plates/back-1.base.png <cand>/sketches/link3v2 genais
python src/sketch.py <cand>/plates/flight-1.base.png <cand>/sketches/fins fins
bash src/run2.sh ... bash src/run8.sh              # see each script's header; shell.py and bk_city.py prepare 6 and 8
python src/make_frames.py                          # frame backgrounds + src/jobs.json
PYREFLY_BROWSER=gpu node src/render.mjs frames src/jobs.json
python src/build_sheet.py                          # options.html from src/sheet.json (embeds head/section.html)
PYREFLY_BROWSER=gpu node src/render.mjs sheets     # part-*.jpg
```

Here `src/` is `docs/concepts/chapters/sin-2026-09-29/src/`, `<cand>` is the candidates folder, and `<round3>` is
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3`.

## Questions for Bailey

1. For each subject: take the pick, the other option, or a mix? A pick approves only what you name.
2. Should the range state change Sin's size (FAR smaller), or only the deck's light?
3. For link IV: golden dusk (matches the head) or violet evenfall (the head relit)?

After the picks:
1. Record liked, disliked, must remain, must change and undecided in each tile's `reaction` (rule 15).
2. Do one repair pass on each pick (the Fin's beak-like tip, the Right Fin's rings, the tower's crown).
3. Cut the picked creatures into layers for the engine, as round 3 did for the head.
