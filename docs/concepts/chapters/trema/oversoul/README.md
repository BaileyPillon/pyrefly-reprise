# Chapter XIII: what Oversoul Paragon looks like (options, 2026-09-25)

**Which game (rule 14): FFX-2 only.** Oversoul exists only in FFX-2, and so do Paragon and Cloister 100.

**Status:** these are options for Bailey. Nothing is installed or approved. The locked Paragon painting
(`public/art/characters/paragon/idle.png`, sha256 `0e3972b558c0…`) was not edited. All the work was done on copies.
`verify-approved.mjs`: 185 ok, 0 mismatched, 0 missing, before and after.

This only matters if Bailey picks option 1 in `docs/plans/trema-options-2026-09-25.md` (Oversoul Paragon).

## What the sources say

| What | Source | Confidence |
|---|---|---|
| When a fiend Oversouls, "the fiend's body absorbs pyreflies, acquiring a blue cast" | FF Wiki, *Oversoul (Final Fantasy X-2)*, revid **4041089** (api.php) | single source for the words |
| The transformation shows blue motes streaming into the fiends, and an **"Oversoul!"** action caption above them. The fiends look blue-violet | The same page's screenshot, *File:Oversoul FFX-2.jpg* (file page revid **2493543**). I looked at it in the browser and saved nothing | picture, supports the row above |
| "blue pyrefly aura" on the transformation | `research/ffx2-combat-core.md` §6.9 | `[verified: 2 sources]` for the paragraph |
| Oversouled fiends appear **in red** in Shinra's Bestiary | wiki revid 4041089 | That is the bestiary screen, not the battle |
| Paragon keeps the **same name** in both forms. Its Oversoul form has its own Scan text: "An even more powerful version of what was already the greatest fiend in Spira…" | FF Wiki, *Paragon (Final Fantasy X-2)*, revid **3998078**, infobox `sec 2 = Oversoul` | single source |
| **Paragon's own Oversoul look** | Not described in any source I found: the wiki's Paragon page, `research/ffx2-trema.md`, the visual bible, or SinirothX's *Enemy Encyclopedia* (GameFAQs 31807; its Oversoul section lists numbers only) | **gap** |

Two notes for whoever writes the brief:
- `research/ffx2-trema.md` has no section 12. Its sections run from 0 to 11. The Oversoul facts are in §3.2 and §4.1.
- `ffx2-trema.md` §3.2 says Paragon "arrives Oversouled". The wiki says Oversoul "will always be the first action any
  monster of that type takes". Whether the chapter opens with an on-screen "Oversoul!" beat is a question for the
  scene track. I did not decide it here.

So there is a sourced visible difference: **a blue cast, from the pyreflies it absorbs.** How strong the cast is, and
whether the motes stay around it after the transformation, is **ours (inferred)**. The words "acquiring a blue cast"
suggest the colour lasts. The screenshot shows only the moment of the change.

## The options (`sheet.jpg`, frames in `frames/`)

Every frame is a **real engine frame at 1600x900**. The installed Cloister 100 staging is the same as in
`production/`: Chapter IV `ffx2-bahamut` is loaded to its first command menu, and request interception serves
`via-infinito.png` and the Paragon files in place of Bahamut's, plus the TR10 dresspheres. The HUD name reads
"Paragon". `-full` frames have the HUD and `-clean` frames do not. `base-*` is the normal Paragon, for comparison.

| Option | What it is | What it costs to build | Risk |
|---|---|---|---|
| **A: blue cast only** | A new painted-shader term, `c = mix(c, pow(luma,0.85) * castColor * 2.2, 0.55)`, with castColor `#6fa8ff`. It goes just before the quiet dim. For the frame it was injected into this actor's own materials at runtime; `src/` was not edited | One uniform pair in `PaintedShader.ts` + `PaintedActor`, set when the Oversoul variant is on | Reads violet-grey rather than blue in this dark staging, and the red eyes dull |
| **B: blue cast + blue rim + blue pyrefly motes** (recommended) | A at 0.8, plus the existing rim uniform in blue `#7cc4ff` at 0.7, plus one `ParticleField` from the `pyreflies` preset recoloured blue (`#4f9dff`, `#7cc4ff`, `#bfe4ff`, `#2f6dff`, white): 70 motes, size 26, a 6.6 x 4.8 x 2.4 box on the boss | A, plus a particle field owned by the actor. No new art | The motes are a stand-in drift. The absorption, where motes stream inward during the transformation, would be an animation still to do |
| **C: painted blue recolour** (GPU) | A copy of the locked idle was pre-graded to a blue gradient map and repainted at denoise 0.18 (seed 925122, animagine-xl-4.0-opt, 30 steps, cfg 6, long side 1344). The source alpha was kept exactly. Shown with B's rim and motes | A second texture (`paragon/oversoul` pose or subject). A new painting would need a judge and Bailey's name on it | At 1:1 the forehead crest was redrawn as a blue spiked crest (the gold diamond is gone). Luma differs from the locked painting by a mean of 21 of 255 inside the figure. In the engine it reads darker than B |

**Recommendation: B.** It shows the sourced blue cast and the pyreflies that cause it. It leaves the locked painting
untouched, needs no new art to judge, and can be switched off with the Oversoul variant.

## GPU and method

- **Jobs:** 15 ComfyUI renders, all option C pilots, each 8.6 to 9.9 s of execution. The queue was empty or under 3
  each time, and I never had more than 2 of my own jobs in flight. No black frames. ComfyUI was not restarted.
  Nothing was downloaded.
- **The pilots, looked at 1:1:**
  - Pilot 1 used a luma-times-blue grade at d 0.35 and 0.45. It came out grey steel, and 0.45 changed the armour shapes.
  - Pilot 2 used a gradient map at d 0.25 and 0.30. The blue was right, but the head crest and the chest plates were
    redrawn.
  - Pilots 3 and 4 used d 0.15 to 0.20. This is the least drift, and the crest is still reinterpreted at every seed.
  - Look-only JPEGs and every sidecar are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu3/oversoul-paragon/`.
    The C candidate PNG, `c-925122-18.png`, sha256 `5f17e2d025d2…`, is there too, with its sidecar.
- **IP-Adapter:** not used. The img2img from the painting carries the identity, so `--forceRef` did not apply.
- **Scripts** are in `scripts/`:
  - `oversoul_repaint.py`: the C repaint, queue-aware, with `GRADE` / `GRADEMODE=map` as env settings;
  - `shot-os.mjs`: the engine frames. It is `production/scripts/shot2.mjs` plus `--tex`, `--cast`, `--castGain`,
    `--castColor`, `--rim`, `--rimColor` and `--motes`, on a private Vite on port 5890 with HMR off. That server was
    stopped by its port;
  - `sheet.py`: the sheet.

## Owed, and not decided here

- **Inferred (ours):**
  - the cast strength and colour;
  - that the cast lasts all fight;
  - the motes staying around the boss, with their count, size and box;
  - the rim;
  - keeping the name plate unchanged (no source shows a change).
- Not made:
  - the transformation beat, where blue motes stream in under an "Oversoul!" caption;
  - Oversoul cast, hurt or KO variants (only the idle was treated).
