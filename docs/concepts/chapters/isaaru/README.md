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

**Corrected 2026-09-24 after the adversarial review** (`docs/plans/chapter-isaaru-review.md`,
Review). O-1's old reason ("closest to the coat the wiki describes") was wrong: none of the three
matches the wiki, and the recommendation is now the closest one, A (question 1). Yuna's own commands
(plan B6), shown in every O-5 frame, are now a question, not a given (question 6). The HUD finding
now cites our own specs. The O-5 sheets say the turn order is patched. The phone sheet, which put
three mockups side by side (about 4 px labels on a phone), is split, one phone per row.

Every sheet is one column: 1,200 px wide for the 1600x900 frames, 780 px for the phone mockups.
Shown 390 px wide, no word on a sheet is below 12.5 px, and a phone mockup's 12 CSS px labels stay
12 px. (The HUD text inside a 1600x900 frame cannot read on a phone at any size; those sheets rely
on their captions.)

| Round | Sheet | Files |
|---|---|---|
| O-1 Isaaru | `isaaru/sheet.jpg` | `isaaru/{a,b,c}-frame.jpg` (1600x900 engine frames), `isaaru/{a,b,c}-card.jpg` |
| O-2 His portrait | `portrait/sheet.jpg` | `portrait/{a,b}-dialogue.jpg` (real dialogue frames), `portrait/{a,b}-card.jpg` |
| O-3 The chamber | `chamber/sheet.jpg` | `chamber/{a,b,c}-frame.jpg`, `chamber/{a,b,c}-plate.jpg` |
| O-4 His aeons | `aeons/sheet.jpg`, `aeons/sheet-ko-links.jpg` | `aeons/{a,b,c}-frame.jpg`, `aeons/ko-{fallback,painted}-frame.jpg`, `aeons/{pterya,spathi}-{a,c}-frame.jpg`, cards |
| O-5 Reading the fight | `fight/sheet-link1.jpg`, `fight/sheet-link3.jpg`, `fight/sheet-link-card.jpg`, `fight/sheet-phone-link1.jpg`, `fight/sheet-phone-link3.jpg` | `fight/{a,b,c}-{m1,m2,m3}.jpg` (1600x900), `fight/{a,b,c}-{m1,m2}-phone.jpg` (390x844 at 2x), the `.html` for each, `fight.css`, `phone-isaaru.css` |
| O-6 Music | not in this set | An audio sketch is its own track, judged by ear on `docs/audio/audition.html` (rule 13) |

## Questions for Bailey, one per round (recommendation first)

1. **O-1 Which Isaaru stands beside his aeons?** A: calm, arms open. B: a summoner staff raised.
   C: hands together in prayer, eyes closed. **None of the three matches the wiki's words.** The
   wiki (*Isaaru*, "Appearance") gives brown hair, half-closed eyes, a white robe under a blue
   blouse with long white cuffs, a wide sea-green belt tied in a bow, and a black knee-length
   jacket edged in sea green. All three coats reach the ankles, and no belt is sea green: A and
   B wear a wide white sash, C a blue knot. **I recommend A, as the closest:** a dark coat edged
   in sea green, long white cuffs, half-closed eyes and a wide sash. Its finals would shorten the
   coat to the knee and repaint the sash as a sea-green bow, a masked repaint of the pick, not a
   new round. A's white robe glows under the chapter's bloom (`isaaru/a-frame.jpg`), which the
   final's grade must tame. **If the pose matters more to you, pick C:** hands in prayer fit a
   man who asks Yuna's pardon and then never acts in the fight (his record has no actions,
   research §2.1), and the same two costume fixes apply. B reads as the one giving orders, and a
   staff in this staging is our idea, not sourced. (A version faithful to the wiki cannot be
   composed from these renders: the knee-length jacket needs new paint.)
2. **O-2 Which portrait speaks his lines?** A: courteous, a faint smile. B: steady and
   sorrowful. **I recommend B** for the duel. It is the man who holds that the temple's word
   binds even Braska's daughter, and who asks her forgiveness (research §8.1-8.2). Both were
   painted from O-1 C's look, whose costume does not match the wiki (question 1); the expression
   you pick is repainted from your O-1 pick. The line in the dialogue box is a stand-in: no
   story text is written until the story draft (plan B17).
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
   (`File:Pterya_defeated.jpg`) shows the aeon breaking into light (our reading of one image;
   it does not prove the dissolve is canon). A painted set would need a hurt and a KO pose for
   Ifrit, Valefor and Bahamut, and Yuna's aeons would gain them too.
5. **O-5 How does the player read the fight? (plan B20)** Three moments are shown: link 1, where
   Yuna picks an aeon (Ifrit locked, Grothia's gauge full so Hellfire comes first:
   `fight/sheet-link1.jpg`); link 3 (`fight/sheet-link3.jpg`), where
   Ixion is out and Spathi's count reads 1 (Mega Flare next); and the link 2 card, where Isaaru
   calls Pterya. A: words only, one sentence in the enemy-move panel. B: chips on the HUD (a
   gauge under Grothia's queue tile, a count on Spathi's tile, the aeon's own HP row, a link card
   with three marks). C: marks in the world (a fire ring under Grothia, a big "1" beside Spathi,
   a title across the field). **I recommend B,** and I would keep A's sentence in the enemy-move
   panel (E). B reads at phone width and covers no painting. All three show the mirror lock the
   same way: the Ifrit row is greyed out with its reason. **Every frame is shown with the
   recommended B6 = a and B2 = a, not yet your picks** (question 6 asks B6), and the turn order
   in them is patched: the enemies' Agility was set to 1 in the browser so Yuna acts first.
   **Two facts the real frames show, which go with this question:** (i) today, while an aeon is
   out, the HUD still shows Yuna's row and no aeon HP anywhere. Our own specs already say the
   aeon takes the party's place: `ffx-combat-core.md` §6.1 (`[verified: 2 sources]`: the aeon
   replaces the entire active party, and the party leaves the field) and `visual-bible.md`
   §3.11.6 (the arriving aeon's Overdrive gauge sits in the party-status window). B and the phone
   layouts follow them and put the aeon's own row in Yuna's place. The one unsourced part is B
   keeping Yuna's frozen row underneath it. (ii) The aeon's queue tiles show a letter (S, I, B)
   and not its portrait. Also seen: the move advisor today suggests "Attack → Isaaru" (the I-G4 /
   B8 seam in the plan). The frames keep it hidden.
   **Phone** (`fight/sheet-phone-link1.jpg`, `fight/sheet-phone-link3.jpg`, one phone per row):
   this uses the Yojimbo round's phone layout. It has no Flee row (whether the party can escape
   is unsourced, plan O-3). Every fight label is 12 CSS px or larger (measured), with no sideways
   scroll.
6. **Yuna's own commands while she stands alone (plan B6, shown in every O-5 frame but not yet
   your call).** a) Summon, Grand Summon, White Magic, Items and Defend open; Attack, Talk and
   attack items greyed with "Only an aeon can fight an aeon". b) Everything open, and the enemy
   aeons take 0 from Yuna. c) Summon only. **I recommend a,** labelled our estimate: the sources
   say only aeons can fight his aeons, not what Yuna's menu shows. Whatever you pick, a Yuna with
   no aeon left must lose (the sourced Game Over), never drift into the engine's 400-turn
   stalemate "escape" (plan I-G3). **Follow-up (plan B7):** today every aeon's own menu has an
   Items row (see the phone frames); no source gives aeons an Item command, and our combat notes
   say party items cannot target aeons `[single source]`. **I recommend no Items row on an
   aeon,** our estimate.

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
  B2 = a, the recommendation, not yet your pick): Ixion 1,513 / 40, Bahamut 1,398 / 35, Yuna
  1,650 / 270. No odds or damage numbers are invented.
- **The wiki's words for Isaaru** (*Isaaru*, "Appearance", revid 4026440): brown hair, half-closed
  eyes, a white robe under a blue blouse with long white cuffs, a wide sea-green belt tied in a
  bow, a black knee-length jacket edged in sea green. The wiki does not say his hair is tied up;
  the tied-up hair, the full-length lapels, the blue-violet robe and the turquoise knot under
  "Looked at before drawing" are our reading of the images, not the wiki's words.
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
- **Engine frames:** in our engine today, Yuna stays on the stage next to her summoned aeon. The
  review found this in every live FFX chapter with a summon (I, VII, VIII, X:
  `BattlePresenterStage.ts:145-149`), against `ffx-combat-core.md` §6.1; it is an FFX-wide defect
  for the driver's queue, not an Isaaru choice.
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
- **Sheets:** `scripts/sheets.py` builds every sheet with `scripts/sheet.py` (re-cut 2026-09-24).
- Scratch (full-size renders, scripts, the first cut's specs): `D:/Tools/pyrefly-scratch/isaaru-options/`.
