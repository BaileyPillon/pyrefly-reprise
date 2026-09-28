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
