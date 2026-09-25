# Chapter XIV (provisional): Isaaru in the Via Purifico (FFX), end-state options

**Nothing here is built or wired into the game.** No file under `src/`, `tests/`, `critic/`,
`public/art/` or `docs/target/` was touched. These are the options rounds that
`docs/plans/chapter-isaaru-review.md` §6.2 says must be picked before anything you see or hear is
built (hard rule 9). Pick or mix per row. A pick approves only the parts you name (rule 15). Every
sheet is stamped `CONCEPT`. Your words that started this (2026-09-24): *"I'll also add Isaaru's
contest of aeons at Beville and Gippal, in the Den of Woe as two additional chapters in addition to
the ones I selected already"*. This folder covers Isaaru only; Gippal is a separate round.

**Which game (rule 14): FFX only.** Isaaru's duel, Yuna's aeons, CTB and Grand Summon exist only in
FFX (research §0.3; in FFX-2 he is a tour guide). FFX gold accent, CTB queue, no ATB bar. A pick
applies to this chapter only.

Every sheet is one column, 1,200 px wide, with large labels so it reads on a phone.

| Round | Sheet | Files |
|---|---|---|
| O-1 Isaaru | `isaaru/sheet.jpg` | `isaaru/{a,b,c}-frame.jpg` (1600x900 engine frames), `isaaru/{a,b,c}-card.jpg` |
| O-2 His portrait | `portrait/sheet.jpg` | `portrait/{a,b}-dialogue.jpg` (real dialogue frames), `portrait/{a,b}-card.jpg` |
| O-3 The chamber | `chamber/sheet.jpg` | `chamber/{a,b,c}-frame.jpg`, `chamber/{a,b,c}-plate.jpg` |
| O-4 His aeons | `aeons/sheet.jpg`, `aeons/sheet-ko-links.jpg` | `aeons/{a,b,c}-frame.jpg`, `aeons/ko-{fallback,painted}-frame.jpg`, `aeons/{pterya,spathi}-{a,c}-frame.jpg`, cards |
| O-5 Reading the fight | `fight/sheet.jpg`, `fight/sheet-link-card.jpg`, `fight/sheet-phone.jpg` | `fight/{a,b,c}-{m1,m2,m3}.jpg` (1600x900), `fight/{a,b,c}-{m1,m2}-phone.jpg` (390x844 at 2x), the `.html` for each, `fight.css`, `phone-isaaru.css` |
| O-6 Music | not in this set | An audio sketch is its own track, judged by ear on `docs/audio/audition.html` (rule 13) |

## Questions for Bailey, one per round (recommendation first)

1. **O-1 Which Isaaru stands beside his aeons?** A: calm, arms open. B: a summoner staff raised.
   C: hands together in prayer, eyes closed. All three wear the costume the wiki describes in
   words: brown hair tied up, a long dark coat with sea-green lapels, a blue-violet robe, a white
   under-robe, a turquoise cord at the waist. **I recommend C.** Its coat is the closest to that
   description (full-length sea-green lapels), and the pose fits a man who asks Yuna's pardon
   and then never acts in the fight (his record has no actions, research §2.1). B reads as the
   one giving orders. In the game's staging a staff is our idea, not sourced. A's white robe
   glows under the chapter's bloom (`isaaru/a-frame.jpg`).
2. **O-2 Which portrait speaks his lines?** A: courteous, a faint smile. B: steady and
   sorrowful. **I recommend B** for the duel. It is the man who holds that the temple's word
   binds even Braska's daughter, and who asks her forgiveness (research §8.1-8.2). Both were
   painted from O-1 C's look. If you pick another O-1, the portrait is redone from that one.
   The line in the dialogue box is a stand-in: no story text is written until the story draft
   (plan B17).
3. **O-3 Which room is the fight in?** A: red-lit stone, the hallway behind. B: a round room with
   a shaft of light from the way up. C: darker, with pyreflies in the red. **I recommend A.** It
   is closest to what two sources say (the end of a red-lit hallway, research §7), the floor
   reads, and every figure stands out on it. B's shaft says "the way out" without a word, but its
   floor is small. C's motes would be live particles in the game, not paint.
4. **O-4 Do we mark Isaaru's aeons, and how? (plan B18)** The sources give no visual difference:
   his Grothia is Ifrit, Pterya is Valefor, Spathi is Bahamut (research §10.2). A: the paintings
   exactly as they are. B: as they are, plus a name plate ("Grothia, Isaaru's Ifrit"). C: a
   sea-green edge and a darker grade, in his coat's colour. **I recommend C.** Pixels are derived
   in PIL, and the D-089 paintings are never saved over. It also fixes a real problem the frames
   show: the dark Bahamut painting is lost in the dark chamber as it is
   (`aeons/spathi-a-frame.jpg`) and reads with mark C (`aeons/spathi-c-frame.jpg`). On Pterya
   the edge shows less, because Valefor is already teal. B's name can go on the link card
   instead (O-5).
   **Follow-up (plan B19): KO poses, or the dissolve?** 1: the engine's current fallback, where the
   painting dissolves into pyreflies. 2: a painted KO (new render against the Ifrit reference).
   **I recommend the dissolve.** It costs nothing, and the one defeat image we looked at
   (`File:Pterya_defeated.jpg`) shows the aeon breaking into light. A painted set would need a
   hurt and a KO pose for Ifrit, Valefor and Bahamut, and Yuna's aeons would gain them too.
5. **O-5 How does the player read the fight? (plan B20)** Three moments are shown: link 1, where
   Yuna picks an aeon (Ifrit locked, Grothia's gauge full so Hellfire comes first); link 3, where
   Ixion is out and Spathi's count reads 1 (Mega Flare next); and the link 2 card, where Isaaru
   calls Pterya. A: words only, one sentence in the enemy-move panel. B: chips on the HUD (a
   gauge under Grothia's queue tile, a count on Spathi's tile, the aeon's own HP row, a link card
   with three marks). C: marks in the world (a fire ring under Grothia, a big "1" beside Spathi,
   a title across the field). **I recommend B,** and I would keep A's sentence in the enemy-move
   panel (E). B reads at phone width and covers no painting. All three show the mirror lock the
   same way: the Ifrit row is greyed out with its reason (plan B6 = a).
   **Two facts the real frames show, which go with this question:** (i) today, while an aeon is
   out, the HUD still shows Yuna's row and no aeon HP anywhere. B and the phone layouts put the
   aeon's own row in its place, with Yuna waiting underneath. No research file says what FFX's
   own window shows here, so this is our estimate, to check before building. (ii) The aeon's
   queue tiles show a letter (S, I, B) and not its portrait. Also seen: the move advisor today
   suggests "Attack → Isaaru" (the I-G4 / B8 seam in the plan). The frames keep it hidden.
   **Phone** (`fight/sheet-phone.jpg`): this uses the Yojimbo round's phone layout. It has no
   Flee row (whether the party can escape is unsourced, plan O-3). Every fight label is 12 CSS px
   or larger (measured), with no sideways scroll.

## What is sourced and what is ours (rule 6)

- **Looked at before drawing** (not copied, rule 8), seen in a headless browser as look-only frames
  and then deleted: `File:Isaaru-FFX-HD.JPG`, `File:Isaaru_and_his_aeon.jpg`,
  `File:Isaaru_with_Spathi.jpg`, `File:Isaaru_Bevelle.png`, `File:Via_purifico.jpg`,
  `File:Via_purifico_glowing_panel.jpg`, `File:Yuna_finds_auron_in_via_purifico.jpg`,
  `File:Pterya_defeated.jpg`. In our own words, they show: a young man with long brown hair tied
  up; a long coat whose broad sea-green lapels run to the hem over a blue-violet robe; a
  turquoise knot at the waist; a white under-robe. He stands beside his aeon, a little behind
  it. The boss room has dark stone walls, a low parapet with small square red lamps, a
  rust-red frieze, and a dark red-brown tiled floor. The maze corridors are lit teal-green,
  with red pillars. Pterya's defeat shows it breaking into light in the dark.
- **Wiki text** (through `api.php`, revids): *Isaaru* 4026440, *Isaaru (Final Fantasy X boss)*
  3963146, *Via Purifico* 4034460, *Grothia* 3979432, *Pterya* 3979322, *Spathi* 4005169. The
  image lists above come from those pages.
- **Fight rules shown in O-5** come from `research/ffx-isaaru-bevelle.md`: the three links, the
  mirror lock (§1.2), Grothia's gauge starting full so turn one is Hellfire (§4.1, single
  source), and Spathi's Countdown to Mega Flare (§4.3; the count shown, 1, sits inside both the
  5 and the 4-to-1 readings, I-5). Aeon HP, MP and gauges are Chapter X's shipped values (plan
  B2 = a): Ixion 1,513 / 40, Bahamut 1,398 / 35, Yuna 1,650 / 270. No odds or damage numbers
  are invented.
- **Ours:** every colour and light choice, the sea-green mark, the staff in O-1 B, Isaaru's size
  (0.85 times Mortibody's stage height, about a man beside Yuna) and his place at his aeon's
  right, and all overlay designs.

## What went off-canon or wrong while rendering (flagged, not fixed)

- **O-1:** the first two rolls were withdrawn: a feminine side profile (`isaaru/withdrawn-isaaru-a.jpg`)
  and a modern suit coat with dress shoes (`withdrawn-isaaru-a2.jpg`). C's first roll covered
  his face with his hands (`withdrawn-isaaru-c.jpg`). A's "hands clasped" came out as arms open.
  The turquoise knot came out navy on A and blue on C.
- **O-2:** three withdrawn portrait rolls: too close and blond, face paint with a white coat, and
  a halo ring with a flower brooch (`portrait/withdrawn-*.jpg`). The IP-Adapter reference had to
  be forced (`--forceRef`), because O-1 C is 43 % one colour. The cut-out guard rejects any bust
  that fills the canvas, so both were kept with `--keepBad`; a final portrait still needs its
  matte.
- **O-3:** withdrawn: a block wall with no floor, a trench floor, and a sci-fi red disc
  (`chamber/withdrawn-*.jpg`). No plate has the real room's low parapet with square lamps.
  A is a colonnade more than a square room.
- **O-4:** the painted KO's first roll lost the mane and the tan horns (`aeons/withdrawn-ko-roll-1.jpg`).
  The second has a stray pink strand and a blue loincloth.
- **Engine frames:** in our engine today, Yuna stays on the stage next to her summoned aeon.
- ComfyUI was never restarted. No black frames. 22 renders (3 rejected by the cut-out guard), about 5 GPU minutes.

## How these were made

- **Engine frames:** a private Vite server (port 5780, HMR off, GPU browser) running Chapter X
  `seymour-natus`. Playwright request interception patched three modules *in the browser only*:
  the Highbridge build's line-up became `['yuna']` with an empty bench (the plan's I-G1 probe),
  the scene key became Chapter VII's painted staging, and the enemies' Agility became 1 so Yuna
  acts first. Interception also served the candidate images: the chamber plate in place of
  `backdrops/macalania-temple.png`, the aeon painting in place of `characters/seymour-natus/*`
  (the ring hidden), and Isaaru in place of `characters/mortibody/*`. Aeons were summoned
  through the real menu by real clicks. Names were swapped in the DOM, and Isaaru's queue rows
  were hidden (he has no turn, plan B8). Nothing was written to `public/art` or `src/`. The
  dialogue frames use Chapter VII's first story line, with the portrait, speaker, tag and
  heading swapped.
- **Renders:** ComfyUI through `tools/gen/comfy.mjs` presets `character`, `boss` and `backdrop`,
  one at a time, each submitted only when `/queue` had fewer than 3 pending. Every seed and
  prompt is in `recipes.json`. O-4 C and O-3 C's motes are PIL work on existing pixels.
- **O-5 mockups:** the `fight/*.html` files sit over the real frames, using
  `docs/concepts/polish/_kit/kit.css` plus the Yojimbo round's `phone.css`. They were shot in
  Playwright at 1600x900 and at 390x844 (2x). The smallest fight label measured 13 px on desktop
  and 12 px on the phone.
- Scratch (full-size renders, scripts, specs): `D:/Tools/pyrefly-scratch/isaaru-options/`.
