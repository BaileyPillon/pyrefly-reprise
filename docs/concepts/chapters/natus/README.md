# Chapter X: Seymour Natus at the Highbridge of Bevelle (FFX): end-state options

**Nothing here is built or wired into the game.** No file under `src/`, `tests/`,
`critic/`, `public/art/` or `docs/target/` was touched. These are the options rounds that
`docs/plans/chapter-natus-review.md` §6.2 says must be picked before anything you see or
hear is built (hard rule 9). Pick or mix per row. A pick approves only the parts you name
(AGENTS.md rule 15). Every sheet is stamped `CONCEPT`.

**Which game (rule 14): FFX only.** Natus, Mortibody and this Highbridge fight exist only in
FFX (research §0.3). CTB queue, FFX gold accent, no `ig--ffx2`, no ATB bar. A pick applies to
this chapter only.

| Round | Sheet | Files |
|---|---|---|
| O-1 Seymour Natus | `natus/sheet.jpg` | `natus/{a,b,c}-frame.jpg` (1600x900 engine frames), `natus/{a,b,c}-card.jpg` |
| O-2 Mortibody | `mortibody/sheet.jpg`, `mortibody/sheet-ko-revive.jpg` | `mortibody/{a,b,c}-frame.jpg`, `-card.jpg`, `-ko-revive.jpg` |
| O-3 The Highbridge | `highbridge/sheet.jpg` | `highbridge/{a,b,c}-plate.jpg`, `highbridge/{a,b,c}-frame.jpg` |
| O-4 Reading the fight | `fight/sheet.jpg`, `fight/sheet-phone.jpg` | `fight/{a,b,c}-{p1,p2}.jpg` (1600x900), `fight/{a,b,c}-{p1,p2}-phone.jpg` (390x844 at 2x), the `.html` for each, `fight.css`, `phone-natus.css` |
| O-5 Natus's portrait | `portrait/sheet.jpg` | `portrait/{current,a,b}-dialogue.jpg`, `portrait/{current,a,b}-card.jpg` |
| O-6 Music | not in this set | An audio sketch is a separate track, judged by ear on `docs/audio/audition.html` (rule 13) |

## Questions for Bailey, one per round

1. **O-1 How should Seymour Natus look?** A: new paint. White hair swept up in a spiked
   crest, ashen skin, bare ribbed chest, violet armour, a skirt of blade-like plates, and a
   large carved stone ring behind him. B: the same body, but with the approved Macalania
   portrait as the face reference, so he keeps Seymour's light-blue hair and red veins.
   C: A made darker and lit by pyreflies. **I recommend A.** It reads at once as a new
   form, and the ring gives him a shape nothing else in the game has. B reads as Seymour in
   a costume. C almost disappears against the night plate (`natus/c-frame.jpg`); its glow
   and motes would be live particles, not paint. **Follow-up question:** should the ring be
   its own layer that turns slowly? It is a separate layer in all three options (our idea,
   not sourced).
2. **O-2 How should Mortibody look?** A: a bronze horned skull on a bony body, with blade
   legs hanging down. B: pale and ghostly, lit by pyreflies (the Japanese name means
   "Pyrebody"). C: a gold and blue machine sphere with blade arms (the wiki calls it
   "mechanical"). **I recommend A.** It is closest to the reference image we looked at, and it
   does not compete with Natus. B blooms brighter than Natus. C reads as a machine and stops
   reading as a creature. **The KO and revive strip** (`mortibody/sheet-ko-revive.jpg`):
   it breaks into pyreflies, drains Natus, then comes back weaker. Do you want this, with a
   live `-4,000` on Natus? **I recommend yes.** It shows the fight's key trick: killing
   Mortibody damages Natus.
3. **O-3 What light on the Highbridge?** A: grey noon. B: dusk with a low sun. C: night,
   with the city lit. **I recommend C.** Natus's purple and Mortibody's bronze read best on
   it. B is closest to the one FFX screenshot we looked at, but under the Chapter VII grade
   its sun patch blooms behind Mortibody (`highbridge/b-frame.jpg`). If being faithful
   matters more here, pick B and have the scene's own grade tone the sun down.
4. **O-4 How does the player read the fight?** Three moments are shown: the element combo
   (Mortibody casts a tier-1 spell, then Natus casts the -ra version of the same element on
   two party members), two of three Hasted (a third means Desperado), and Kimahri turned to
   stone with the Claw coming next. A: intent text only, one sentence in the enemy-move
   panel. B: chips on the HUD the player already reads (element on Natus's queue tile, HASTE
   badges on party rows, STONE and 90 % on Kimahri's row). C: marks in the world (an element
   sigil and arrow, Haste pips over the party, a red ring under the stone member).
   **I recommend B, with A's sentence kept in the enemy-move panel (the E key).** B reads at
   phone width and covers no painting. C's marks collide with the paintings on a phone.
   **Phone width** (`fight/sheet-phone.jpg`): this uses the Yojimbo round's phone layout,
   with no Flee (the party cannot escape this boss; that is sourced). Every fight label is
   12 CSS px or larger, with no sideways scroll. For comparison, `fight/phone-live-today.jpg`
   is the game as it runs today at 390 px: it has no phone layout.
5. **O-5 Which portrait for his lines after he transforms (question B12)?** Today: the
   approved Macalania portrait on every line. A: a new Natus portrait with O-1 A's look.
   B: the approved portrait darkened and lit by pyreflies, with nothing repainted.
   **I recommend A if you pick O-1 A, and B otherwise.** B is cheap because it comes from
   approved pixels. A still needs a clean cut-out: the cut-out guard rejected the automatic
   one, so the sheet shows the raw render.

## What is sourced and what is ours (rule 6)

- **Looked at before drawing** (not copied, rule 8): the wiki's enemy images
  `File:Seymour Natus-enemy-ffx.png` and `File:Mortibody-enemy-ffx.png`, the FFX Highbridge
  screenshot `File:Bevelle highbridge2.jpg`, `File:Bevelle-artwork-ffx.png` and
  `File:Bevelle FMV.jpg`. They were seen in a headless browser as look-only frames, then
  deleted. The prompts use our own words for what they show: a tall ashen figure with
  silver hair in upswept spikes, violet armour and a long skirt of bladed plates, in front
  of a large carved grey stone ring; a dark bronze skull-like body with horns, two long
  blade legs and a curled segmented tail; a pale stone walkway with a crimson and gold
  zigzag border, a green diamond runner, crimson canopy pillars, water channels, and the
  palace gate at the far end.
- **Wiki text** (read through `api.php`): *Seymour Natus*, revid 4017136 ("a mechanical,
  hovering creature called Mortibody"); *Mortibody*, revid 4017446; *Seymour Guado*, revid
  4034466 (he absorbs the surrounding pyreflies, including Kinoc's, to become Natus;
  *natus* means "born"); *Bevelle*, revid 4008196 ("a long bridge leading to the temple").
  No wiki text describes how either enemy looks.
- **The fight rules shown in O-2 and O-4** come from `research/ffx-seymour-natus-highbridge.md`:
  the tier-1 spell then Multi-ra combo (§4.1), Desperado when all three active members are
  Hasted (§4.3, 3 sources), Break then Shattering Claw with a 90 % shatter (§3), and
  Mortibsorption's 4,000 / 3,000 / 2,000 / 1,000 drain (§4.4, 4 sources). The element order
  shown (Ice) is question B7's estimate. The party numbers are illustrative. The HUD is
  Chapter VII's, with its names swapped.
- **Ours:** every colour and light choice, the ring as its own layer, Mortibody's size and
  height (the Guado Guardian's 2.87 world units, lifted 1 unit so it hovers, placed on
  Natus's screen-left), Natus at 1.3 times Chapter VII Seymour's size, and all overlay
  designs.

## What went off-canon while rendering (flagged, not fixed)

- **O-1:** A and B stand with their feet on the ground; the reference floats. The engine
  could hover him. The model read the bladed skirt as two blade "wings" held in his hands.
  A thin white matte fringe on the skirt glows under bloom. The ring came out as a solid
  plate (seed 911203): the outer band was kept, the centre cut out, and the colour greyed
  in PIL. The first ring roll (911201) came out as a sceptre. Three first rolls were
  withdrawn (`natus/withdrawn-pilot-{1,2,3}.jpg`): slicked navy hair with a ribbon halo, a
  side profile holding the ring like a shield, and a painterly side view. B's reference
  had to be forced (`--forceRef`), because the portrait is 42 % one colour. B's face is
  carried by the reference adapter at 0.5, not transplanted pixel by pixel. If you pick B,
  the finals do the METHOD-CHECK face derive.
- **O-2:** the pilot came out as a red serpent-dragon (`mortibody/withdrawn-a-pilot.jpg`).
  The second roll had white fill in the bone holes (`withdrawn-a-roll-2.jpg`). C's first
  roll was an armoured humanoid (`withdrawn-c-roll-1.jpg`). A has no scorpion tail over
  the top; the spine curls instead.
- **O-3:** none of the plates has the real bridge's crimson inverted-cone canopies. C's gate
  fills the frame and the bridge itself hardly shows. A's pilot (`withdrawn-a-pilot.jpg`)
  was sunny, not grey. C's first roll was an indoor corridor (`withdrawn-c-roll-1.jpg`).
  In the engine the plates sit in Chapter VII's staging (painted seam at 0.89, its bloom
  and grade). A Highbridge scene would get its own.
- **O-4:** Kimahri's stone look is a greyscale-and-cracks stand-in served in place of his
  idle; it is not Chapter VIII's shipped petrify effect.
- **O-5:** the dialogue line and the chapter label are Chapter VII's, not Natus lines. No
  story text was written for this round (the story draft comes first, question B9).

## How these were made

- **Engine frames:** a private Vite server (port 5870, HMR off, GPU browser), Chapter VII
  `seymour-anima-macalania` at its first command menu. Playwright request interception
  served the candidates in place of `art/backdrops/macalania-temple.png`,
  `characters/seymour-macalania/*`, `characters/guado-guardian/*` (Mortibody; Guardian B
  hidden) and `characters/rikku/*` + `portraits/rikku.png` (Kimahri, for the B2 line-up).
  Guide, advisor and target panels were hidden with G / N / I, and HUD names were swapped in
  the DOM. Nothing was written to `public/art`. The dialogue frames use the same interception
  at Seymour's first line in Chapter VII's story.
- **Renders:** ComfyUI through `tools/gen/comfy.mjs` presets `character`, `boss` and
  `backdrop`, one at a time, each submitted only when `/queue` had fewer than 3 pending.
  ComfyUI was never restarted. 25 renders, about 6 GPU minutes; no black frames. Every seed
  and prompt is in `recipes.json`. O-1 C, O-2 B's glow and O-5 B are PIL grades of existing
  pixels (the pyrefly colours are `--pyre-green` / `--pyre-white` from the visual bible).
- **O-4 mockups:** `fight/*.html` over the real frames, using `docs/concepts/polish/_kit/kit.css`
  plus the Yojimbo round's `phone.css`. They were shot in Playwright at 1600x900 and at
  390x844 (2x), and the script measured the smallest fight-label font (12 px on phone,
  13 px on desktop).
- Scratch (full-size renders, scripts, specs): `D:/Tools/pyrefly-scratch/natus-options/`.
