# Chapter IX — Yojimbo, Cavern of the Stolen Fayth (FFX) — end-state options

**Nothing here is built or wired into the game.** No file under `src/`, `tests/`,
`critic/` or `public/art/` was touched. These are the hard-rule-9 options rounds that
`docs/plans/chapter-yojimbo-review.md` §6.2 says must come back picked before anything
perceivable is built. Pick or mix per row; a pick approves only the properties you name
(AGENTS.md rule 15). Everything is a concept: `CONCEPT` is stamped on every sheet.

**Game case (rule 14): FFX only.** Lady Ginnem's Yojimbo (research candidate A), CTB
queue, the boss's Zanmato gauge. No frame carries `ig--ffx2`, an ATB bar or the pink
accent; a pick applies to this FFX chapter and to no FFX-2 chapter.

| Round | Sheet | Frames |
|---|---|---|
| O-1 Yojimbo as the boss | `boss/sheet.jpg` | `boss/{a,b,c}-*-frame.jpg`, `boss/*-card.jpg` |
| O-2 Daigoro | `daigoro/sheet.jpg` | `daigoro/{a,b,c}-{frame,card}.jpg` |
| O-3 Lady Ginnem | `ginnem/sheet.jpg` | `ginnem/{a,b,c}-*-{frame,card}.jpg` |
| O-4 The chamber | `chamber/sheet.jpg`, `chamber/sheet-arrival.jpg` | `chamber/*-plate.jpg` (full plate), `chamber/*-staged.jpg`, `chamber/*-arrival.jpg` (the night-sakura arrival overlay on each plate) |
| O-5 The Zanmato gauge | `gauge/sheet.jpg`, `gauge/sheet-phone.jpg` | `gauge/{a,b,c}-{mid,full}.jpg` at 1600x900, `gauge/{a,b,c}-{mid,full}-phone.jpg` at 390x844 (shot at 2x), and the `.html` that drew each (`gauge.css`, `phone.css`) |
| O-6 Music | top of `docs/audio/audition.html` | `docs/audio/sketches/2026-09-24/yojimbo-{a-summoners-sorrow,b-ronins-price,c-unsent-lady}.mp3`; scores in `tools/audio/scores/2026-09-24/`. Agents cannot hear (rule 13): only the measurements are checked |

## Questions for Bailey, one per round

1. **O-1 Yojimbo's look (question B6).** A: new paint in the wiki colours (gold
   *jingasa*, fanged *menpo*, gold pauldrons, purple robes, orange sash, *geta*). B: the
   existing painting as it is (navy coat, bone mask, straw hat). C: the existing
   painting with the navy shifted to purple. **Recommend A.** On whether the existing
   painting can be used as it is: **no.** It is not approved (no hashes, no tile), it
   follows the visual bible's guessed navy rather than the sourced gold/orange/purple, and
   in a real battle frame it disappears into a cool backdrop (`boss/b-existing-frame.jpg`).
   C shows the ceiling of a recolour: purple comes out of the pixels, gold and orange
   cannot. A still needs a clean pass before it is final: it is a side profile, and a
   second scabbard crosses behind him.
2. **O-2 Daigoro.** A: a plain working dog, sitting. B: a *koma-inu* lion-dog (the name
   the game's own data gives him). C: a lean dark dog in Yojimbo's purple and gold.
   **Recommend B** (the only one drawn from a source, and the cream reads against
   every chamber). Size is our estimate from the visual bible (about 0.4 of a party
   member).
3. **O-3 Lady Ginnem, unsent.** A: solid. B: a pyrefly glow and motes on her outline.
   C: half-formed, pyreflies below the waist. **Recommend B**: she reads as unsent
   without losing her face for Lulu's scene. The motes and the fade would be live
   particles and a shader, not paint.
4. **O-4 The chamber.** A: cold grey-blue with a shaft of daylight. B: violet dark with
   drifting pyrefly motes. C: warm amber stone lanterns. **Recommend A** (it gives the
   gold and purple Yojimbo the most contrast, and the cold suits Lulu's scene), with B's
   motes added as live particles if you like them. **The arrival overlay**
   (`chamber/sheet-arrival.jpg`): when he is summoned, a night dimension forms over the
   cave, one sakura tree blooms with blue flowers, and he steps out from it. Question:
   play this arrival at the start of the fight? **Recommend yes, on A.** The cold plate
   turns to night with the least colour clash; on C the amber shows through as brown.
5. **O-5 The Zanmato gauge.** A: a bar under his name with the 25/50/80 bands.
   B: a ring round his CTB tile. C: a katana that slides out of its scabbard as the gauge
   fills, with a one-shot "Zanmato" banner when it is full. Each is shown at 58 % and at
   full. **Recommend A for the information with C's full-gauge banner.** If the stills
   do not settle it, a small clickable prototype comes next (plan risk R1). **Phone
   width** (`gauge/sheet-phone.jpg`): each option has a portrait layout of its own at
   390x844, every gauge label at least 12 CSS px, no sideways scroll. On a phone the
   turn queue moves to a row along the top of the scene, because a right-hand column
   covers Yojimbo. A still reads best on a phone. C's labels are cut to 25 / 50 / 80
   plus one line of text, because the words do not fit along a short blade.
6. **O-6 The music.** In the game this fight plays Lulu's theme. The sketches quote
   nothing: not Lulu's theme and no other tune from the games. A "The Summoner's Sorrow":
   Lulu's grief first (cello, a pulse joins, one crack). B "The Ronin's Price":
   Yojimbo's menace first, with one layer added at each gauge threshold and a single
   cut for Zanmato. C "The Unsent Lady": Ginnem first (a distant soprano, pyreflies, the
   score's own "sending" phrase). **Recommend A**: it answers the plan's brief (B7)
   most directly, and the fight is Lulu's. If you like B's gauge-driven layers, they
   could become A's second half. I cannot hear any of these.

## What the sources say, and what is ours

- **The chamber (research §6.1, `[verified: 2 sources]`):** "a large open cave room with a
  **teleport pad in the middle** (dormant until after the battle)". The wiki's
  *Cavern of the Stolen Fayth* page (revid 4034145, read 2026-09-24) adds only that the
  cave sits "in a gorge to the north of the Calm Lands". Light and colour are
  `[estimate]` by the research's own note, hence three moods.
- **Yojimbo (research §6.3, wiki `[single source]`):** robes shading gold, orange and
  purple, gold-spiral pauldrons, *jinbaori*, gold-embossed *jingasa*, *geta*, fanged
  *menpo*. Conflict Y-7: the visual bible's navy is `[estimate]` and yields.
- **Daigoro:** only "Yojimbo's dog, *Koma Inu* in the data". His look is ours.
- **Lady Ginnem:** the wiki's *Ginnem* page (revid 3963153) says "a palette swap of
  Belgemine" with "white makeup on her face". Her design words come from the
  *Belgemine* page (revid 3963149: side hair ornaments, forehead mark, robe sectioned
  with bands, sleeves cuffed above the elbow, lattice bell cuffs, fingerless gloves, obi
  with an orange sash and a red tassel). Her colours are unsourced and ours.
- **The gauge (research §4.1):** thresholds 25 / 50 / 80 / 100 `[verified: 3 sources]`;
  Zanmato 9,999 to the whole party `[verified: 4 sources]`; HP 33,000 `[decompiled]`.
  The party numbers, Yojimbo's current HP and the 58 % are illustrative.

## What went off-canon while rendering (flagged, not fixed)

- **The sakura came out pink both times** (`chamber/sakura-raw-before-recolour.jpg`; the
  source says blue). It was recoloured from its own pixels to the visual bible's
  `#8FC8F0` and blended onto each plate in PIL. The cut-out guard rejected the
  background-removed version, so the tree is a soft blend and its trunk is faint. The
  night gradient and the petal colour are the bible's `[estimate]`. The falling petals
  are drawn dots; in the game they would be particles.
- **The chamber plates have no teleport pad.** Three prompts asked for one; none came
  out readable. The pad would be a floor prop in the scene, not paint (dormant, lit
  after the battle).
- Chamber: the pilot (`chamber/withdrawn-pilot.jpg`) read as an icy canyon over water;
  the next roll (`withdrawn-a2-corridor.jpg`) as a built stone corridor with a glowing
  monolith; C's first roll (`withdrawn-c-lamppost.jpg`) put a street lamp in the cave.
  Each was rerolled once with a tighter prompt.
- Yojimbo A's first roll (`boss/withdrawn-a-first-roll-card.jpg`) grew rainbow ribbon
  swirls from "shading from gold to orange to purple" and lost the armour; rerolled once.
- Daigoro A came out tan, not grey-brown, and facing right (mirrored for the frame).
  Daigoro C has a pink rim on its legs.
- Ginnem's hair came out fair, not brunette, and the white make-up is faint.

## How these were made

- **Battle frame (O-1):** the real game on a scratch Vite dev server (port 5860, HMR
  off, real GPU), Chapter I at its first command menu, HUD off and the enemy
  billboards hidden from the console, then each painting composited in PIL at twice a
  party member's height on the boss's ground point (the engine measured 92 px per world
  unit there). The chamber, Daigoro and Ginnem frames are flat composites on the new
  plates, not engine renders.
- **Renders:** ComfyUI, `tools/gen/comfy.mjs` presets `backdrop` / `character` /
  `boss --nonBiped`, one at a time after three empty minutes on the shared queue, never
  restarted. 12 renders, about 2½ GPU minutes. Seeds and prompts: `recipes.json`.
- **Gauge mockups:** `docs/concepts/polish/_kit/kit.css` (Ink & Gold) plus
  `gauge/gauge.css`, rendered with `docs/concepts/polish/_kit/shoot.mjs` at 1600x900.
  The plate is the Chapter I frame with Lulu, Kimahri and Yuna composited in.
- **Phone gauge mockups:** `gauge/phone.css` plus kit.css, shot at 390x844 CSS px at 2x in
  Playwright; the script also reads the smallest gauge-label font size (12 px on all six).
- **Arrival overlay:** 2 renders (about 20 GPU seconds, after three empty minutes each),
  composited in PIL; recipes under `sakura-*` in `recipes.json`.
- **Music:** `node tools/audio/scores/render-sketches.mjs --date=2026-09-24` (the same
  instruments, hall and master as the shipped cues). The decoded MP3s measure -16.0 /
  -16.0 / -16.2 LUFS with true peaks of -1.07 / -1.34 / -1.20 dBTP, and every tilt gate
  passes. Every pitch was checked against the key: all stay in natural minor, with no
  raised sixth and no dominant chord.
- Scratch (renders at full size, scripts): `D:/Tools/pyrefly-scratch/yojimbo/` and
  `D:/Tools/pyrefly-scratch/yojimbo-options/`.
