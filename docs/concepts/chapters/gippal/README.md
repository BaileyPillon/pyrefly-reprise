# Chapter XV (provisional): the Den of Woe, Gippal and the shades (FFX-2 only): end-state options

**None of this is built or connected to the game.** Nothing under `src/`, `tests/`, `critic/`,
`public/art/` or `docs/target/` was changed. These are the options rounds that
`docs/plans/chapter-gippal-review.md` §6.2 says come first (hard rule 9). Pick or mix per row. A
pick approves only the parts you name (AGENTS.md rule 15). Every sheet is stamped `CONCEPT`.

**Which game (rule 14): FFX-2 only.** Every frame uses the real Chapter V ATB HUD and the Chapter V
line-up: Yuna as a White Mage, Rikku and Paine as Dark Knights (GP5 a). A pick applies to this
chapter only.

| Round | Sheet | Files |
|---|---|---|
| O-1 Gippal's shade | `o1-shade/sheet.jpg` | `o1-shade/{a-pyrefly-edge,b-translucent,c-anger-red,d-chapter4-violet}-frame.jpg` (1600x900), `cards.jpg`, `withdrawn-rolls.jpg` |
| O-3 The Den | `o3-den/sheet.jpg` | `o3-den/{a,b,c}-frame.jpg`, `{a,b,c}-plate.jpg`, `guide-a.jpg`, `withdrawn-rolls.jpg` |
| O-4 Reading the fight | `o4-fight/sheet.jpg`, `o4-fight/sheet-phone.jpg` | `o4-fight/{a,b,c}-{p1,p2,p3}.jpg` (1600x900), `{a,b,c}-p2-phone.jpg` (390x844 at 2x), the `.html` pages, `fight.css`, `phone.css`, `phone-live-today.jpg` |
| O-2 Baralai and Nooj | not made yet | These depend on GP1. If you pick b or c there, they are drawn in the treatment you pick in O-1 |
| O-5 Music | not in this set | Music is its own track, judged by ear on `docs/audio/audition.html` (rule 13) |

## Questions for Bailey, one per round

1. **O-1: How should Gippal's shade look?** All four start from one painting of Gippal: blond
   spikes, a patch over his right eye, a blue jumpsuit, purple overalls, grey armour plates, a
   machina mortar. Only the treatment changes.
   - A: the man as painted, with pyreflies at his edges.
   - B: translucent and lit from within, in cold colours.
   - C: a red pyrefly body that holds his shape, with his feet coming apart into motes.
   - D: the Chapter IV violet, the look you picked for Chapter XI's possessed aeons.

   **I recommend B.** The scan text says he is an illusion made of pyreflies, and B reads that
   way at once. It matches the approved Shuyin painting, which is also cold and translucent, and
   Shuyin is the one behind the shades. He still reads as Gippal by his outline: the spiky hair,
   the patch and the mortar. A reads as the real man. D says "possessed", which the shades are
   not. **C is the alternative if you want each shade coloured by its feeling.** The scan texts
   give sorrow for Baralai, anger for Gippal and despair for Nooj. The colours for those would
   be ours. **Follow-up question:** whatever you pick in O-1 also applies to Baralai and Nooj in
   O-2. Is that right?
2. **O-3: What light should the Den have?** All three use one painted cave: a rectangular
   clearing of cracked stone, rock walls and a tunnel mouth at the far end. Only the light
   changes.
   - A: cold blue pyreflies.
   - B: crimson.
   - C: near dark, with one shaft of light from the ravine above.

   **I recommend A.** The party and the shade read best on it, and the pink FFX-2 HUD stays
   apart from it. B is the angriest light, but its red fights the pink HUD and the red warning
   chips. C is the most mournful, but the party is hardest to read on it. In C the shaft lands
   in the middle of the floor, not on the fighters.
3. **O-4: How does the player read the fight?** The sheet shows three moments:
   - Baralai counting blows toward Drill Shot at 8.
   - Gippal's five-step cycle, with Bullseye next.
   - Nooj near the 2,999 HP line where Lightfall fires.

   The options:
   - A: intent text only, one or two sentences in the enemy-move card (the E key).
   - B: chips on the HUD the player already reads: a "Shade 2 of 3" counter, a strip showing the
     cycle, the blow counter as pips, a mark at 2,999 on Nooj's HP bar, and "KO at Lightfall" on
     Yuna's row.
   - C: marks in the world: a counter circle over the shade and a red ring under the member at
     risk.

   **I recommend B, with A's sentence kept in the enemy-move card**, as in Chapter X. B works at
   phone width and covers no painting. C's marks sit on top of the paintings. **Phone width**
   (`o4-fight/sheet-phone.jpg`) has its own layout. Every fight label is 12 CSS px or larger
   (measured), nothing scrolls sideways, and there is no Flee: the Den cannot be escaped (research
   §3). For comparison, `phone-live-today.jpg` is the game as it runs today at 390 px, with no
   phone layout. **"Shade 2 of 3" is our wording**, and it only fits if GP1 is b or c.

## What is sourced and what is ours (rule 6)

- **Gippal's look** comes from `research/visual-bible.md` §1.23.5, which quotes the FF Wiki page
  *Gippal*, revid 3972827 `[single source]`: an Al Bhed with green spiral-pupil eyes, a patch over
  his **right** eye, short spiky blond hair, armour over a blue jumpsuit and purple overalls,
  indigo boots, and a large machina mortar with a rounded saw blade. **The shade treatment is
  ours:** no source I read says how the shades look (research G-13). What the sources do say is
  that he is an illusion of Gippal made of pyreflies, formed from his anger (research C-3,
  `[verified: 2]`). No wiki image was fetched, and nothing was downloaded (rule 11).
- **The Den**, research §6.1: a pyrefly-filled cave under Mushroom Rock Road, with a
  **rectangular clearing** at the centre where the bosses are fought `[single source:
  GamerGuides]`. The rock, the floor, the tunnel mouth and all three lights are ours.
- **The rules shown in O-4** come from research §4:
  - Baralai: +1 per hit or HP change; at 8, Drill Shot for 3/4 of max HP on the last attacker
    (§4.2; 8 against 10 is conflict G-5; per action against per hit is GP11).
  - Gippal: the cycle Grinder, Attack, Grinder, Attack, Bullseye (15/16 of the time). Bullseye
    takes 9/16 of current HP and cannot kill. Below 1/3 HP his moves turn random and Mortar is
    added (§4.1; the trigger is conflict G-2).
  - Nooj: Lightfall, 5,000 to all, once, at 2,999 HP or less (§4.3, G-2).
  - Yuna's 2,488 max HP was measured on the engine (plan §3).

  The blow count (6), the last attacker (Paine) and the party HP are illustrative. The HP bars
  are the HUD as captured and do not show the moment's real HP.
- **Ours:** every treatment, colour and light choice; Gippal's size in the frames (340 px tall,
  about 1.2 times Rikku at a similar depth, placed on the right where the enemy stands); the
  "Shade n of 3" label; and all overlay designs.

## What went off-canon while rendering (flagged, not fixed)

- **O-1:**
  - The mortar came out as a long pipe with no saw blade, so the pilot misses the "rounded saw
    blade". The patch covers the correct (right) eye but sits low on the cheek at 1:1.
  - The overalls read as a purple sash and apron over the jumpsuit.
  - Three rolls were withdrawn (`o1-shade/withdrawn-rolls.jpg`):
    - seed 951101 had a huge saw-cannon that ran off the canvas, so the cut-out guard rejected
      it;
    - seed 951103 had the patch on the wrong eye and floating discs;
    - seed 951104 had no weapon at all.
  - The finals would fix the weapon and the patch with a masked repaint. Nothing about the
    treatments depends on them.
- **O-3:**
  - The model would not paint a floor on its own. Five rolls were withdrawn
    (`o3-den/withdrawn-rolls.jpg`):
    - the first had star-shaped motes and a floor too thin to stand the party on;
    - the next was a ravine;
    - one was a flat, empty hall;
    - the two rolls lit crimson and dark lost the floor entirely.
  - The kept cave was painted over a rough layout guide (`guide-a.jpg`, img2img at denoise 0.8).
  - B and C are grades of A's pixels, so the composition is identical and only the light
    changes.
  - The painted pyreflies became glowing domes on the floor. The floating motes are drawn on top
    as a stand-in for the engine's live particles.
  - The plate is about as detailed as the Chapter XI road plate, not a hero painting.
- **O-4:** Baralai and Nooj are placeholder shapes (Gippal's outline filled dark) until O-2. The
  shapes are there only so the chips have something to point at.

## How these were made

- **Battle frames:**
  - The real game ran on a private Vite server (port 5820, HMR off, GPU browser), stopped at the
    first command menu of Chapter XI (`ffx2-fallen-aeons`). That chapter uses the Chapter V
    line-up and HUD.
  - Each capture gave two layers: the scene with the HUD off, and the HUD alone. The guide, the
    enemy-move card and the best-move card were collapsed with G, E and N.
  - The boss name in the HUD was swapped (Shiva to Gippal, Baralai or Nooj) by a MutationObserver
    that rewrites the HUD's own text.
  - The frames are flat composites in PIL: the candidate plate, then the approved party paintings
    at the positions and heights the engine's camera projects, then the candidate shade, then the
    real HUD layer. They are not engine renders of the Den: a new Den scene is track T5.
  - Nothing was written to `public/art`. The server was stopped by its port afterwards.
- **GPU:** 10 ComfyUI renders (4 of Gippal, 6 of the cave), about 3 GPU minutes
  of the 60-minute cap, with no black frames. Each job was submitted only while fewer than 3 were
  pending. ComfyUI was never restarted: the black-frame guard's restart sentinel pointed at a
  private log folder. Seeds and prompts are in `recipes.json`. The prompts' weight brackets were
  escaped by the client, as in earlier rounds, so the weights did not apply.
- **Treatments:** `scripts/possess.py` (the Chapter XI method: A's pyrefly edge, D's violet) and
  `scripts/shade.py` (B, C) work on the pilot's pixels only, with no GPU. `scripts/denplates.py`
  makes the three lights. `scripts/guide.py` makes the layout guide.
- **O-4:** `scripts/o4_html.py` writes the pages over the real frames, using
  `docs/concepts/polish/_kit/kit.css` for fonts and tokens. `scripts/shoot.mjs` shoots them in
  Playwright and measures the smallest fight-label font: 14 px at 1600x900, 12 px on the phone.
- Scratch (full-size renders, captures, sheet specs): `D:/Tools/pyrefly-scratch/gippal-options/`.
