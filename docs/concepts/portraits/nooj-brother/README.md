# Speaker portraits for Nooj and Brother: options (FFX-2 only)

This is an options round (AGENTS.md rule 9). Nothing here ships and nothing was installed into
`public/art`. Nooj speaks first in chapter 5 (`ffx2-vegnagun-shuyin`). Brother has three comm
lines in chapter 6 (`ffx2-leblanc`). Both still speak on a text-only card (critic round 09,
PR-0058). Pick **A, B or C for each speaker** from [`options.jpg`](options.jpg).

**Game case: FFX-2 only.** Both characters are FFX-2 supporting cast, sourced from
`research/visual-bible.md` §1.23.4 and §1.23.7. See the open question about Brother's FFX lines
at the end.

## What is on the sheet

- In each row, two approved FFX-2 speaker portraits (Bailey's picks of 21 Sep: Paine, Shuyin,
  Rikku, Yuna) sit beside the three options at the same size. All five are shown at the full
  832x1216 frame on the same neutral grey.
- Below each row, the **real game's dialogue card** at 1600x900 with each option in place:
  `card-nooj-{A,B,C}.jpg` and `card-brother-{A,B,C}.jpg`. These are captures of the running dev
  build (`window.__pyrefly.gotoChapter`, advanced to the speaker's first line). The option was
  served at `art/portraits/<id>.png` through a Playwright network route, and the art manifest was
  patched in the same way. Nothing under `src/` or `public/art` was edited.
- The crop on the card is the card's own fallback crop (`portrait.ts` `dialogueObjectPosition`
  with no `face-crops.json` row). An installed pick would still need a measured `dialogue` crop
  row. Without one, Nooj C loses his hair loops and Brother B shows a sliver of a raised arm at
  the top of the frame.

## Recipe (the approved one)

The recipe is the same as for the approved portraits (`docs/concepts/portraits/README.md`):

- `tools/gen/comfy.mjs` graph and prompt builder with `--composition portrait` and `--facing none`
- the same STYLE and QUALITY blocks and `SPRITE_NEGATIVE`
- Animagine XL 4.0 Opt, 28 steps, CFG 6, euler_ancestral/normal, 832x1216
- rembg cut-out with a 16 px margin

**No `--ref`.** Neither character has an approved painting to derive from, which is the same
case as the approved Braska and Fayth-boy portraits and the shipped Cid portrait. The method
check's "derive from approved pixels" therefore had nothing to derive from.

The renders ran through a scratch driver, `D:/Tools/pyrefly-lora/portraits/render.mjs`. It
imports the comfy.mjs builders, but it never restarts ComfyUI and it stops on a black frame
instead of recovering. Before each prompt it waited for the shared `/queue` to be empty for
3 minutes, and it sent one prompt at a time.

- **Total GPU:** 7 prompts, 57.6 s of summed ComfyUI execution time (about 1 of the 60 minutes
  allowed).
- **Black frames:** none.
- **Pilots:** Nooj went first and was looked at 1:1 before any other render.
  - Pilot 1 came back with **red** hair. The colour word from "red long johns" had bound to the
    hair.
  - The tags were re-ordered to lead with `brown hair` weighted 1.3, with `red hair` added to the
    negative. Pilot 2 became option A.
  - Brother A was his pilot.

The candidate PNGs, raw renders and per-file sidecars (seed, prompt, negative, execution time,
source line) are in `D:/Tools/pyrefly-lora/portraits/out/`. They are not in the repo.

## Nooj: sourced appearance (rule 6)

`research/visual-bible.md` §1.23.4, FF Wiki *Nooj* §Appearance, `[single source]`:

> "Nooj has long brown hair kept in two loops and a ponytail tied with a red band. He has blue
> eyes and wears blue glasses. He wears red long johns with multiple red and black belts used to
> secure his prosthetic arm and leg. Over his right shoulder is a purple sleeve with fur at the
> top." His left arm and leg are machina prosthetics.

The staging rule is also in §1.23.4 but is marked `[estimate]`: "facing three-quarter left so the
prosthetic arm and leg are toward camera." His beat in chapter 5 is "flat, resolved, suicidal"
(`research/ffx2-vegnagun-shuyin.md` beat 1).

| | What it tries | On canon | Departures |
|---|---|---|---|
| **A** | House framing: straight-on, stern, like Paine and Shuyin | brown hair, ponytail with a **red** band, blue glasses, blue eyes, red suit | grey armour plates where the purple fur-topped sleeve should be; no visible prosthetic; the hair loops are only suggested |
| **B** | The beat's mood: half-lidded, "flat, resolved" | brown hair, ponytail, blue glasses, red suit under purple fur | fur wraps **both** shoulders (source: right shoulder only); **teal** hair tie (source: red); machina joint floats behind his right shoulder, which is the wrong side; not really three-quarter |
| **C** | His asymmetry shown in a head shot: the metal hand at the glasses, a wry look | **both hair loops with red bands** (the only option with them), blue glasses, blue eyes, machina hand on his **left** (correct side) | suit reads purple, not red; the face reads younger and softer than a 21-year-old meyvn; a smile is off his line's tone |

## Brother: sourced appearance (rule 6)

`research/visual-bible.md` §1.23.7, FF Wiki *Brother*, `[single source]`, age 20 in X-2:

> "green eyes with the trademark spiral pupil of the Al Bhed, blond mohawk, and ears adorned with
> multiple earrings. He wears long, grey pants held by blue-and-red suspenders and black gloves
> with iron buttons and red-and-black cuffs. His chest and arms are heavily tattooed."

All three of his chapter-6 lines are yelled over the comm.

| | What it tries | On canon | Departures |
|---|---|---|---|
| **A** | Shouting, which is how every one of his lines reads | tall blond mohawk on shaved sides, green eyes, several earrings, bare chest, **blue** suspenders | tattoos read as faint dark marks only; red missing from the suspenders; pupils not clearly spiral. **Cleaned:** the raw render had a detached red-and-blue braid floating off the left ear, and its alpha was erased (the uncleaned file is kept in scratch) |
| **B** | Cocky grin; the clearest **tattoo** read | green eyes, earrings, large chest tattoo, suspenders with red and blue | mohawk reads more like a swept undercut; both arms are raised behind his head (cropped); head sits high in the frame |
| **C** | Worried ("Buddy, why is nobody yelling back at me?") | swept blond mohawk, green eyes, earrings, sweat drop | suspenders are **orange** with navy edges (source: blue and red); tattoos are only two small rings |

Two things apply to every Brother option:

- The research's comm-portrait spec (40x40 px, X-2 chrome frame, two-frame mouth cycle) was
  written for the rejected pixel-art direction. These options follow the approved
  painted-portrait style instead, as the brief asked.
- There is no mouth-open second frame.

## Open questions for Bailey

1. **Pick A, B or C for Nooj, and A, B or C for Brother.** A pick approves only what you name.
   Every option has listed departures, so a mix is welcome too: for example, "C's hair loops and
   hand with A's face". The follow-up would be one repair pass on the pick, not a new round.
2. **Brother also speaks in the FFX chapter `evrae-airship`, under the same speaker id.** Those
   are the lines at `src/story/scripts/evrae-airship.ts:109-117`. An installed FFX-2 Brother
   portrait would therefore also appear on FFX lines. The research sources describe only his
   X-2 look, so whether his FFX look matches is **unsourced**. Should the FFX-2 portrait ship
   under a separate id (`brother-x2`, as `yuna-x2` and `rikku-x2` do), leaving the FFX lines on
   the text card until his FFX look is sourced?

## Picked and installed (2026-09-24)

Bailey, 2026-09-24: "I'll take all of your recommendations", which here means **Brother A**,
**Nooj C with one repair pass**, and the speaker id **`brother-x2`** for every FFX-2 Brother line.

- **Brother A** is installed unchanged (the braid clean-up above is its only edit) as
  `public/art/portraits/brother-x2.png`. The repair items the judge listed for Brother (red in
  the suspenders, tattoos, spiral pupils) were not part of the pick and were not done.
- **Nooj C** got the judge's one repair pass, side by side in
  [`nooj-c-repair.jpg`](nooj-c-repair.jpg) (left: the candidate, right: installed as
  `public/art/portraits/nooj.png`):
  - **Mouth:** one masked inpaint (`tools/gen/inpaint.mjs`, box 330,585,195,100, latent
    refine at denoise 0.7, seed 5202) to a closed, flat mouth, which fits his chapter-5 beat,
    "flat, resolved". It took two GPU prompts; the first gave a weaker line. One 8 px speck the
    inpaint left on the cheek was filled from its surroundings.
  - **Suit:** a deterministic hue shift of the purple suit to crimson. The fur stays purple, as
    the source has it. No new pixels were generated for this.
  - **Ink:** the line work was grown by 1 px and pulled toward black, with a small saturation and
    contrast lift toward the house's inked poster look.
  - Self-check at 1:1 and 2x by the agent that made the repair (not an independent judge): the
    edges and anatomy are unchanged, the hair still reads brown, and the style is closer to the
    approved set, though still softer than Rikku-x2. The agent's estimate is about 7.5.
  - The candidate, the repaired file, the mask, the inpaint frame and the repair script are
    backed up in `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-picks/`.
- **Dialogue crops:** `src/ui/common/face-crops.json` has measured `portraits` rows and
  `dialogue` rows for both files. The card shows 879 of the 1216 rows, and both paintings put
  hair on row 0, so the dialogue rows anchor near the top. Nooj uses fy 0.04, which shows his
  hair loops through to his collar. Brother uses fy 0.02, which shows his whole mohawk down to
  his collarbones. Real-key captures:
  `docs/screenshots/picks/portrait-nooj-ch5-card.jpg` and
  `docs/screenshots/picks/portrait-brother-ch6-card.jpg`.
