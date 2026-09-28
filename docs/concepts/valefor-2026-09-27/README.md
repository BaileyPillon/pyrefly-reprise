# Valefor idle: three options (2026-09-28)

**Game case: FFX only.** Valefor is an FFX aeon (Yuna's Summon and Grand Summon, chapters I, II,
III, VII, IX, X, XII and the unlisted XIV). FFX-2 has no summons, so nothing here applies to the
FFX-2 chapters. Follows `docs/plans/valefor-overdrive-bug-2026-09-27.md` §C (symptom S2, "looks
nothing like valefor"). **Options only: nothing is installed**, `public/art/` and
`docs/target/approved-hashes.json` are untouched, and nothing is built until Bailey picks.

## 1. The colour, from written sources

| Source | Id | What it says about her colour |
|---|---|---|
| FF Wiki, *Valefor (Final Fantasy X)*, read through the MediaWiki API (`action=parse`, wikitext) | **revid 4032533** | Profile: "Valefor is a large, avian creature notable for her dragon-like wings. She primarily attacks with her strong talons. Some of her body is covered in **red feathers** and she has a long lizard-like tail." Nothing else about colour. |
| FF Wiki, *Valefor (summon)*, *Valefor (Final Fantasy X boss)*, *Dark Valefor (Final Fantasy X)*, *Valefor (Final Fantasy X-2)*, *Pterya*, *Aeon (Final Fantasy X)* | revids 3944530, 3979321, 4028546, 3979327, 3979322, 4029264 | Silent on her colour. |
| GameFAQs FFX (PS2) guides: Aeon FAQ (PFriedman), Aeon Stats FAQ (JungleJim), Aeon Ability List (tempest_storm34), Aeons Translation (RinoaMao), Dark Aeon FAQ (Huang_SJ), Boss Guides (Haunter12O; Gestahl), Monster Encyclopedia (Ceebs), Guide and Walkthrough (Split_Infinity), FAQ/Walkthrough (KeyBlade999), Game Script (Shotgunnova, page 1 of the paged guide; page 2 sat behind a bot check, which I did not get around) | FAQ ids 15597, 21367, 69156, 13348, 16257, 15427, 16895, 14377, 18197, 69037, 43142 | Every Valefor mention is about abilities, stats or story. **None describes her colour.** |

**Finding.** One written source gives a colour: **red feathers on "some of her body"**. It is
`[single source]`, as `research/visual-bible.md` §1.13 already says. The sources say nothing about
the colour of the rest of her (the scales, the wing membranes, the tail). Nothing supports the
installed **teal** body. That came from an AI judge's memory (`docs/handoff/art3-aeons.md` §7.2),
and hard rule 6 does not accept memory as a source. So:

- **Red feathers** are sourced, from one source.
- **All of her in red** (option A) goes further than the source: it reads "some" as "all".
- **The non-red colour** is **our estimate** in every option: dark slate in B, teal-green in C,
  cream underbelly in A. The bible's underwing `#E0B06A` is also marked `[estimate]`.
- The deciding check, if Bailey wants one before he picks, is the Steam HD Remaster (his rule:
  facts come from that copy, and only with his leave to take over the screen). His own reaction,
  "looks nothing like valefor", counts as evidence too.

`research/` was not edited (outside this brief). §1.13's palette swatches (feathers
`#8E2A22/#C94A38/#E8836A`) describe option A. If Bailey picks B or C, the bible row should say
"red feathers on part of the body; body colour unsourced (estimate)".

## 2. The options

The sheet: `valefor-options-1-idles.jpg` (the three idles and the installed painting on one
ground), `valefor-options-2{A,B,C}-1600.jpg` (Chapter IX at 1600x900, 1:1),
`valefor-options-2X-installed-1600.jpg` (the installed painting at the same scale, for reference),
and `valefor-options-3-phone.jpg` (390x844, 1:1). Every part is under 1 MB.

| | Option | What it shows | Which source traits it carries | Seed |
|---|---|---|---|---|
| **A** | Red plumage | Red from beak to tail, cream underbelly, feathered wings with a dragon-like shape, a long scaly tail, talons planted | avian, talons, red feathers, lizard tail. Reads "some" as "all". Of the three, the closest to a phoenix (the old judge's complaint about the red round) | 2709145 |
| **B** | Red feathers over a dark scaled body | Red crest, ruff and neck feathers, and red wing membranes on a dark slate scaled body. Bat-like dragon wings, a cream throat, a long lizard tail with a red feather ridge | the most literal reading of all five traits: avian head and beak, dragon-like (membrane) wings, strong talons, red feathers on **part** of the body, long lizard-like tail | 2709234, mirrored |
| **C** | Red feathers over a teal-green body (blend) | Red crest, neck feathers and tail ridge on a teal-green scaled body. Tan membrane dragon wings, cream underbelly, blue beak | all five traits. Keeps the installed painting's teal family for the unsourced part, so it is the continuity option | 2709342 |

All three are in the house finish of the installed FFX aeons (Ifrit, Shiva, Bahamut): the same
Animagine XL 4.0 checkpoint, the same shared style, quality and negative blocks from
`tools/gen/comfy.mjs`, 28 steps, CFG 6, Euler Ancestral. They share the aeons' facing contract:
the art faces **left**, like `ifrit/idle.json` and `bahamut/idle.json` (`"facing": "left"`), with
the aeons' creature facing phrase `(from side:1.15), three-quarter view, (looking at viewer:1.2)`.
The stage mirrors an aeon to face the enemy, so the composites show her mirrored, the way the game
would draw her. B's render came back facing right. It was mirrored with the same move `flip.py`
makes, which the chirality note in `art3-aeons.md` allows for Valefor because she is symmetric.
Each option has a sidecar beside its cut-out with the exact prompt, the negative, the seed and the
cleanup applied.

### What I looked at, and what I rejected

I looked at 68 candidates: five rounds, one prompt at a time, only while ComfyUI's queue was empty,
batch size 1, about 9 to 13 s each. There were no black frames. Rejected for:

- **The subject touching the frame:** most of the 1216x832 renders. The 1344x768 bucket fixed most
  of it.
- **Retained background:** paint-sheet swirls, and a feather fan that filled the frame.
- **A sprite sheet of many birds:** one seed.
- **Two tails:** B 2709225, the best-looking B of round 3. Adding `two tails, extra tail` to the
  negative fixed it.
- **Flat vector colouring in C:** the tag `limited palette` caused it, so I dropped it.
- **A floating sword or wing fragments:** A 2709102 and A 2709131.
- **Birds with no lizard tail:** C 2709332.
- **Facing the wrong way:** C 2709311. It had other defects too.

The emphasis `(wide shot, small in frame:1.3)` wrecked a whole round (textures filling the frame,
multiples), and I backed it out. Every candidate, sidecar and raw render is in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor/{A,B,C}/`. The picks are in `picks/`,
the Chapter IX frames in `frames/`, and the composites in `composites/`.

### Cut-out checks (final files, `picks/valefor-{A,B,C}-idle.png`)

Cleanup, in order:

- `scripts/clean.py` removes near-white slivers that are connected to the transparent outside:
  background trapped under the tail and claws, 42 / 282 / 808 px. For B it also removes a painted
  floor-shadow smear under the feet (10,314 px).
- `defringe.py` from the FF7 round (6 passes) removes pale edge fringe and decontaminates the edge.
- `scripts/finalize.py` re-crops to 16 px margins.

Then the checks run.

| | Size | Strict: components at alpha >= 8, 8-connected (a second piece of 24 px or more fails) | Halo: edge pixels still lighter than the figure inside (defringe's own test), must be < 0.5 % | Pipeline guard (`checkCutoutFile`) |
|---|---|---|---|---|
| A | 1284x719 | **1**, PASS | 15 of 8,260 (0.18 %), PASS | ok |
| B | 1338x742 | **1**, PASS | 4 of 8,613 (0.05 %), PASS | ok |
| C | 1327x774 | **1**, PASS | 16 of 9,775 (0.16 %), PASS | ok |

For comparison, the installed Bahamut and Shiva idles show 297 and 1,632 such edge pixels with no
cleanup. Alpha is binary on all three.

**Disclosed:**

- **C:** one wing-claw tip touched the top of the render (10 px). The tip is flattened by a few
  pixels.
- **A:** the head hangs low, below the shoulders.
- **B:** the pose is more frontal than the others.

## 3. On the Chapter IX field

The frames come from a **headless production run**:

- The build was `vite build` of main `2ec4538f` into a private outDir, bundle **`index-eoq6aKmL.js`**,
  the live release-26 bundle. It was served by `vite preview` on port 6811 and stopped afterwards.
- The browser was Playwright Chromium with `PYREFLY_BROWSER=gpu`.
- The run: `setSeed(1)`, then `gotoChapter('yojimbo-cavern', {skipCutscenes: true})`, then the first
  command menu, then `trigger('hud:off')`.
- A second frame was taken with the party faded out, as a background plate.

Each composite has three layers: the plate, then Valefor, then the party (cut from the real frame
by its difference to the plate). So she stands **a step behind the party, beside them, feet on the
party's ground line**, and the party stays in front. Her figure height (the tight alpha box, which
is the same measure as `projectRect`) is **1.80x the party's mean figure height**:

| Viewport | Party figure | Valefor figure | Valefor wingspan |
|---|---|---|---|
| 1600x900 | 225 px | 406 px | A 739, B 755, C 701 px. All fit, to the right of the party |
| 390x844 | 130 px | 233 px | A 425, B 434, C 404 px. **Wider than the 390 px screen**: clipped by 74 / 79 / 64 px |

**Findings for whoever builds the scale fix** (bug plan B.2; not built here):

1. **On a phone, 1.8x does not fit** beside the party. With canon staging (the party leaves the
   field, `research/ffx-combat-core.md` §6.1, PR-0181 on `iter2-b5`), she would stand alone and
   centred. At 1.8x she is still wider than the screen, so the phone either needs a smaller ratio
   or a camera pull-back while an aeon is out.
2. In IX the camera looks over the party's shoulders, and the enemies stand up-centre. A
   right-facing aeon placed to the right of the party looks away from Yojimbo.
3. The cut-outs are composited **unlit**. In the game the painted shader grades them to the
   cavern, so they will sit darker than they do here.

## Recommendation

**B, "red feathers over a dark scaled body".**

- It is the only option that follows every written trait literally: avian, dragon-like wings,
  strong talons, red feathers on some of the body, a long lizard-like tail.
- It cannot be mistaken for a phoenix, which was the old red round's failure.
- It reads clearly against Chapter IX's blue-black cavern at both sizes.

The dark slate body is our estimate, and so is C's teal-green.

**Runner-up: C.** Pick it if Bailey remembers a blue-green body and wants the continuity. A is the
option to pick only if he remembers her as red all over.

After the pick (plan §C.2):

1. Save it as a board tile, with Bailey's `reaction`.
2. Add its hashes to `approved-hashes.json`. That is Bailey's step, not an agent's.
3. Re-render `attack` and `overdrive` from the picked idle with `--ref`.
4. Correct §1.13 and `cast.json`'s `blue feathers`.

## Rules

- **Rule 6:** colour from the cited sources only. The unsourced parts are labelled as our estimate.
- **Rule 8:** txt2img only. There was **no image input of any kind**: no `--ref`, no img2img, no
  IP-Adapter, no retail frame, nothing traced. The prompts are text, from the written description
  and the shared house blocks, and they carry the series tag the whole cast carries.
- **Rule 9:** options only. Nothing is installed or approved.
- **Rule 14:** FFX only.

GPU: shared ComfyUI, no restart, one prompt at a time.

## Files

- `valefor-options-*.jpg`: the sheet.
- `scripts/`: `run.sh` (the generator calls; the final prompts reproduce all three picks, and each
  pick's sidecar carries its exact prompt), `clean.py`, `finalize.py`, `strict.py`,
  `composite.py`, `capture-ix.mjs` (the headless production capture), `sheet.mjs`, `prev.mjs`
  (contact strips used while looking).
- Candidates and full-resolution PNGs: `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor/`.

---

# Repair round: B2 and B3 (2026-09-28)

**Game case: FFX only** (Valefor is an FFX aeon; FFX-2 has no summons). **Options only:** nothing
is installed, `public/art/` and `docs/target/approved-hashes.json` are untouched, and nothing is
built until Bailey picks.

## What the judge found, and what changed

| Finding on round 1 | Repair |
|---|---|
| A has a second head; C is a six-limbed dragon | Both repairs come from **B's design** only: one head, two legs, two membrane wings, one tail. `second head, six limbs, four legs, extra legs, forked tail, looped tail` added to the negative. |
| B copies the installed Bahamut's black-and-red scheme | The dark slate body is gone. **B2** is pale ash, **B3** muted teal-green (below). |
| B has a pale smear where the tail folds | The fold is gone. The repaint starts from B's render with the folded tail end replaced by one tapering tail (`make-init.py`), so both picks have one tail ending in one point. |
| Every composite was **mirrored** to face right, away from Yojimbo, with the near wing over him | Nothing is mirrored anywhere in this round. Both paintings are **painted facing right** (B's own render faced right; round 1 mirrored it twice). In the composites she stands **left of the party, a step behind**, so facing right is facing Yojimbo, and her wings stay clear of him (0 px inside his box at 1600x900). |
| On a phone every option is wider than the screen | At 390x844 the ratio is now the largest that fits the width with a 12 px margin (**1.53x / 1.52x**). See "Phone finding" for what that costs. |

**Facing, in the engine's terms** (`src/engine/BattlePresenterActors.ts`, `mirrorFor`): an aeon's
world facing is +x. Both sidecars declare `"facing": "right"`, so the stage would draw them **as
painted, never mirrored**. Whether +x points at Yojimbo on screen in Chapter IX was not measured
here (the composite places her where it does); whoever installs the pick should check it on the
running chapter.

## The colours (our estimate: the sources name only the red feathers)

The one written source is unchanged: FF Wiki revid 4032533, "Some of her body is covered in red
feathers", avian, dragon-like wings, strong talons, long lizard-like tail. Everything that is not
red feathers is **our estimate** in both options.

- **B2, pale ash.** Chosen so the body stays clear of every installed aeon: Ifrit is saturated
  red-orange with tan horns, Shiva blue, Ixion a navy body with a silver mane and gold armour,
  Bahamut black-violet with dark red membranes, the installed Valefor teal. A **warm bronze** body
  under red feathers would sit in Ifrit's warm red-orange-tan family, so I did not use it. Pale ash
  is the only body tone no installed aeon wears, and it reads strongest on Chapter IX's blue-black
  cavern. Measured (`scripts/repair/palette.py`, CIE76 in Lab, B2's three body tones against the
  five largest colour clusters of each installed idle): the nearest match to every B2 tone is
  **Ixion**. The shadow tone is dE 5.7 from his grey-brown `#594d47`, and the lit tone is dE 15.5
  from his silver mane `#c6bd9d`. That is a mane or armour accent on him, not a body. Round 1's B
  had its nearest match on **Bahamut** (dE 8.1 to 9.9 across all three tones), which is the clash
  the judge saw.
- **B3, muted teal-green.** The continuity option: red feathers over a desaturated version of the
  installed painting's teal (its main body tone is dE 3.9 from the installed Valefor's `#293d3d`,
  on purpose). Avian head and beak, two legs and two membrane wings, not a six-limbed dragon.

Both keep B's red crest, ruff, neck feathers, tail ridge and red wing membranes, the cream throat,
the ivory beak and the dark talons.

## How they were made

- **Image input: our own render only.** Both are img2img at **denoise 0.62** from **B's own raw
  render** (`B/idle-2709234.raw.png`, seed 2709234, painted facing right). Nothing was mirrored at
  any step. Before the repaint, `scripts/repair/make-init.py` recolours the dark slate body to the
  option's colour. It leaves the red feathers and membranes, the cream throat, the beak and the
  talons alone. It also removes the painted floor shadow and the folded tail end, and draws one
  flat tapering tail tip for the sampler to repaint. No retail frame, reference or trace was used
  (rule 8). The prompts are text: B's tags with the new body colour, `--facing right`, and the
  shared house blocks. It is the same finish as the installed FFX aeons: Animagine XL 4.0, the
  house style, quality and negative blocks from `tools/gen/comfy.mjs`, 28 steps, CFG 6, Euler
  Ancestral, 1344x768. `scripts/repair/run-repair.sh` reproduces every candidate.
- **GPU.** 17 renders, one at a time, each only while ComfyUI's queue was empty, batch 1, about
  10 s each. There were **no black frames**. `COMFY_LOG_DIR` pointed at a folder whose restart
  sentinel lies in the future, so comfy.mjs's black-frame guard could not restart the shared
  ComfyUI during this run (it would have stopped instead).
- **What I looked at, and rejected (all looked at, on grey and on cavern blue):**
  - **The tail tip.** Before the tapered tail was drawn into the init, B2 2709401 made a hollow
    loop, B2 2709402/2709403 a feather fan, and B3 2709501/2709503/2709504 a toothed or forked tip.
    B3 2709511's tip stayed flat and unshaded.
  - **A white hole in the flank:** B3 2709502 and B3 2709512.
  - **A grey smudge on the neck:** B2 2709412.
  - **A wing claw touching the render frame:** B2 2709414 (7 px), B3 2709511 (6 px) and B3 2709515
    (14 px; it also bares fangs).
  - **The runner-up:** B2 2709413 (clean, but a softer finish than the house line art).

## The picks and the cut-out checks

Each pick went through `clean.py`, then `defringe.py` (6 passes), then `finalize.py` (no flip), then
`strict.py` and the pipeline guard `checkCutoutFile`. On B2 I checked what the cleanup removed,
because the body is pale: the removed pixels are background white trapped between the wing edge
and the tail ridge, and none of them is body.

| | Pick | Size | Strict (components, alpha >= 8, 8-connected) | Halo (< 0.5 %) | Render frame touched | Pipeline guard |
|---|---|---|---|---|---|---|
| **B2** | seed **2709411**, img2img 0.62 | 1346x742 | **1**, PASS | 13 of 8,071 (0.16 %), PASS | no | ok |
| **B3** | seed **2709514**, img2img 0.62 | 1355x745 | **1**, PASS | 4 of 7,966 (0.05 %), PASS | no | ok |

Alpha is binary on both.

**Disclosed:**

- **B3:** the tail tip carries a faint olive patch left over from the flat init tip.
- **B2:** the far foot is a darker grey than the body. This is the old slate outline showing
  through.

## On the Chapter IX field

The frames are round 1's production captures: bundle `index-eoq6aKmL.js` (main `2ec4538f`),
headless Playwright with `PYREFLY_BROWSER=gpu`, first command menu, HUD off, plus the party-faded
plate. `scripts/repair/composite2.py` builds each composite in three layers: the plate, then
Valefor **unmirrored**, then the party cut from the real frame. It places her by search: every x
where her opaque pixels stay off the enemies' projected boxes (padded by 4 % of party height) and
inside a 12 px screen margin, and of those, the x where the party hides the least of her.

| Viewport | Party figure | Ratio | Valefor figure (h x w) | Pixels in Yojimbo's box | Result |
|---|---|---|---|---|---|
| 1600x900, B2 | 225 px | **1.80x** | 406 x 751 | **0** | Left of the party, feet 11 px behind their line, facing Yojimbo; wing clear of him and of Ginnem |
| 1600x900, B3 | 225 px | **1.80x** | 406 x 753 | **0** | Same. One wing-tip pixel enters Ginnem's padded box, about 8 px short of her own box |
| 390x844, B2, party on the field | 130 px | **1.53x** (fits: 366 px wide, 12 px margins) | 198 x 366 | **4,367** | Fits the screen and faces Yojimbo, but her right wing covers his lower half, and the party hides her legs |
| 390x844, B3, party on the field | 130 px | **1.52x** | 197 x 366 | **4,020** | Same |
| 390x844, B2, party off (canon) | 130 px | **1.53x** | 198 x 366 | **0** | Party gone (`research/ffx-combat-core.md` §6.1). She is brought 65 px toward the camera on the painted floor and is clear of every enemy |
| 390x844, B3, party off (canon) | 130 px | **1.52x** | 197 x 366 | **0** | Same (61 px) |

**Phone finding** (for whoever builds the scale fix, bug plan B.2; not built here):

- With the party on the field, no ratio that fits the width keeps her wing off Yojimbo. The
  largest ratio that clears him beside the party is **0.99x**, smaller than the party.
- With canon staging (the party leaves while an aeon is out), the width-fitting 1.52x to 1.53x
  works and clears him.
- The composites are unlit. In the game the painted shader grades her to the cavern, so she will
  sit darker than she does here. B2's pale body will stay the brightest thing on the field.

## Recommendation

**B2** if Bailey wants her to read as herself at a glance. It has the literal traits of B without
Bahamut's black, it has a body colour no other aeon wears, and it gives the strongest silhouette in
the cavern.

**B3** if he remembers a blue-green body and wants continuity with the painting installed today.

Either way the body colour is our estimate. The Steam HD Remaster check (with his leave) is still
the way to settle it.

The after-pick steps are unchanged (plan §C.2):

1. Save the pick as a board tile with Bailey's reaction.
2. Bailey adds the hashes to `approved-hashes.json`.
3. Re-render `attack` and `overdrive` from the pick, **painted facing right**.
4. Correct the bible §1.13 and `cast.json`.

## Rules

- **Rule 6:** only the red feathers are sourced. The body colours are labelled as our estimate.
- **Rule 8:** the art is original. The only image input is our own round-1 render.
- **Rule 9:** options only. Nothing is installed or approved, and `approved-hashes.json` is
  untouched.
- **Rule 14:** FFX only.

## Files (repair round)

- **Sheet:**
  - `valefor-options-4-repair-idles.jpg`: B as first painted, the installed painting, B2 and B3.
  - `valefor-options-5B2-1600.jpg` and `valefor-options-5B3-1600.jpg`: Chapter IX at 1600x900, 1:1.
  - `valefor-options-6-repair-phone.jpg`: 390x844, 1:1, with the party on the field and with canon
    staging.
  - Every part is under 1 MB.
- **`scripts/repair/`:**
  - `make-init.py`: builds the recoloured, tail-fixed init.
  - `run-repair.sh`: the generator calls.
  - `cutout.sh`: clean, then defringe, then finalize, then strict.
  - `composite2.py`: the unmirrored, searched placement, with an optional canon-staging mode.
  - `palette.py`: the colour-distance check.
  - `look.py`: the contact strips used while looking.
  - `sheet-repair.mjs`: builds the sheet parts.
- **Full resolution:** `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor/repair/`.
  - `picks/valefor-B2-idle.png` and `picks/valefor-B3-idle.png`, with sidecars.
  - Every candidate (with its `.raw.png` and prompt json) under `B2/` and `B3/`.
  - `init/`, `composites/` (with `composites.jsonl`) and `look/`.
