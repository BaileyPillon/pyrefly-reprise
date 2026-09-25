# Chapter XIII (provisional): Trema, Cloister 100 of the Via Infinito (FFX-2): end-state options

**Nothing here is built or wired into the game.** No file under `src/`, `tests/`, `critic/`,
`public/art/` or `docs/target/` was touched. These are the options rounds that
`docs/plans/chapter-trema-review.md` §6.2 says come back picked before anything you see or hear
is built (hard rule 9). Pick or mix per row. A pick approves only the parts you name (AGENTS.md
rule 15). Every sheet is stamped `CONCEPT`.

**Which game (rule 14): FFX-2 only.** Trema, Paragon and Cloister 100 exist only in FFX-2
(research §0). Every frame uses the Chapter IV FFX-2 ATB HUD (pink accent) and the TR10 line-up
Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight at Lv 99. A pick applies to this chapter only.

| Round | Sheet | Files |
|---|---|---|
| O-1 Trema | `trema/sheet.jpg` | `trema/{a-priest,b-unsent,c-puppeteer}-{frame,card}.jpg` |
| O-2 Paragon | `paragon/sheet.jpg` | `paragon/{a-gold,b-fiend}-{frame,card}.jpg` |
| O-2b The link (Trema destroys Paragon) | `paragon/sheet-link.jpg` | `paragon/{a-gold,b-fiend}-link-{1,2,3}.jpg` |
| O-3 Cloister 100 | `cloister/sheet.jpg` | `cloister/{a-derived,b-repaint,c-new}-{plate,frame}.jpg` |
| O-4 Reading the fight | `fight/sheet.jpg`, `fight/sheet-phone.jpg` | `fight/{a,b,c}-{p1,p2}.jpg` (1600x900), `fight/{a,b,c}-{p1,p2}-phone.jpg` (390x844 at 2x), the `.html` for each, `fight.css` |
| O-5 Trema's portrait | not in this set | Made from the O-1 pick (plan §6.2), so it waits for that answer |
| O-6 Music | not in this set | An audio sketch is its own track, judged by ear on `docs/audio/audition.html` (rule 13) |

## Questions for Bailey, one per round

1. **O-1 How should Trema look?** A: the priest. Ivory and gold robe, a black and red stole,
   a tall black hat, a long white beard, green-grey skin, one hand raised. B: A's own pixels
   graded ashen, with a pale pyrefly rim and the hem fading into pyreflies. C: a "dark
   puppeteer" (the name his Scan gives him): a dark robe, with pale pyrefly threads hanging
   from his hand. **I recommend A.** It is closest to the one sourced line (an old man in a torn
   Yevon priest's robe) and to the game's own look, and it reads at once on the teal plate. B's
   motes and fade would be live effects, not paint. They could be kept for his last beat,
   because he "fades away" when he is beaten (sourced). C is the most menacing, but it reads as
   a different character: the robe became tights, and he looks young in the body.
   *Still to fix in A before a final:* the stole's crest is gold, not a round red one. The
   render had a halo disc behind him, which was removed by a colour flood-fill
   (`scripts/dehalo.py`). The hands are green-grey but the face is paler.
2. **O-2 How should Paragon look?** A: a gold-and-black armoured beast on four legs, with
   curled horns and a crown of spikes. B: a black fiend with ember veins, a skull face and a
   tall spined back. **I recommend A.** It is the closest to the one sourced fact about its
   look (it uses the Nemesis model), and the gold stands apart from Trema's ivory, so the link
   reads as a change of enemy. *Flaws:* A has a loose curved blade in front of it (a tail or
   scythe that is not attached). B has white holes in its tail cut-out.
   **The link strip** (`paragon/sheet-link.jpg`) shows the sourced beat as three stills: Paragon
   is beaten, the old man appears and breaks it into pyreflies, and he takes the floor. Link 2
   opens with no results screen between. Question: **stage this as a short scene between the
   links?** **I recommend yes.** It is the chapter's story beat, and it tells the player that
   Trema is the real fight. The dissolve and motes are stand-ins for particles.
3. **O-3 Which Cloister 100?** A: the approved Bevelle Underground plate kept pixel for pixel,
   graded teal, with the orange lamps turned cold white. Our own banner design hangs upside down
   from the vaults, and there are pyrefly motes. B: the approved plate repainted at denoise 0.7.
   It is the same room and layout, now teal and blue, with hanging banners, cold lamp panels and
   a round emblem at the back. C: new. A round teal chamber with carved wall panels and a column
   of light in the middle. **I recommend B.** It keeps the approved underworld family
   (the research's "same Bevelle underworld"), and it is the only one that reads as a cloister
   at game scale. In A the banners look like flat stand-in shapes. In C the column of light
   stands right behind the boss (`cloister/c-new-frame.jpg`). *None of the three shows Yu
   Yevon's likeness on the banners.* That is sourced, but painting it would copy the game's
   design (rule 8). A's banner emblem is our own shape.
4. **O-4 How does the player read the fight?** Two moments are shown. In link 1, a Dark Knight
   is about to pick Darkness, and Paragon answers any attack that Protect or Shell cannot reduce
   with Big Bang. In link 2, Trema is just above half his HP, and Meteor comes next. A: intent
   text only, one sentence in the enemy-move panel (the E key). B: chips on the HUD the player
   already reads. "Draws Big Bang" sits on the Darkness command, and "Counter: Big Bang" sits
   under Paragon's bar. Ticks at 1/2, 1/4 and 1/6 on Trema's bar are labelled Meteor, Meteor and
   Ultima, with "Next: Meteor below 1/2". C: marks in the world. A red ring under Paragon and an
   arrow to the party; a 1/2 sigil over Trema and an amber ring on the party with "12 hits".
   **I recommend B, with A's sentence kept in the enemy-move panel.** B puts the one thing the
   player must not do (pick Darkness on Paragon) on the button itself. The ticks also answer the
   plan's seven-digit question (TR-G7). C's labels crowd the paintings on a phone.
   **Both views show the numerals grouped with commas** (`512,340/999,999`). Today the gauge
   prints `999999/999999`. **Phone width** (`fight/sheet-phone.jpg`): this is our own 390x844
   layout, because the game has none (see Natus `fight/phone-live-today.jpg`). The seven-digit
   numerals fit on one line. The measured smallest label is 12 CSS px on every page (13 to 14 on
   some desktop pages), with no sideways scroll. There is no Flee: nothing sourced says the party
   can escape, and the plan leaves it out.

## What is sourced and what is ours (rule 6)

- **Looked at before drawing** (not copied, rule 8), in a headless browser as look-only frames
  that were then deleted: the wiki's `File:FFX-2INTLMPS2_Trema_Idle.png`,
  `File:FFX-2INTLMPS2_Trema_Battle_Idle.png`, `File:Trema_in_FFX-2.jpg`,
  `File:Trema_X2_portrait.png`, `File:Paragon_X2_portrait.png`, `File:FFX_Nemesis.PNG`,
  `File:Via_Infinito.jpg`, `File:Via_Infinito2.jpg`, `File:Tonberry_Floor.jpg` and
  `File:Via_infinito_final_floor.jpg`. They were found through `api.php` on the pages *Trema*
  (revid 4011844), *Trema (boss)* (4008691), *Via Infinito* (3983658) and *Paragon (Final
  Fantasy X-2)* (3998078), the same revisions the research cites. Nothing was downloaded
  (rule 11). The prompts put what they show in our own words:
  - Trema: a very old man with grey-green skin, a thin white moustache and a long thin beard. He
    wears a tall black cylindrical hat with a red and white band and a round crest, and an ivory
    and gold coat with grey patterned lapels over a black stole with a round red crest.
  - Paragon: a crouching gold and dark armoured beast with curled horns and a crown of spikes.
  - The Via Infinito: dark teal curved halls, tall white banners with a black emblem, glowing
    white wall lamps and engraved round floor plates.
- **Research text:** `research/ffx2-trema.md`.
  - The look lines are from §6.1 and §6.2.
  - The link beat is from §2 step 2 ("in quite an impressive scene", 3 sources).
  - "He fades away" is from §2 step 4.
  - Paragon's counter is from §4.1. That Darkness is a "none"-class attack is plan §4.1 #8.
  - HP 999,999 and 200,000 are from §3.
  - Meteor below 1/2 and below 1/4, and Ultima below 1/6, are from §4.2 (**T-1**: one source
    says 75 % for Ultima).
  - Meteor's 12 hits at 1/8 of max HP each are from §4.2 (**T-2**: one source says 10 hits).
  - The Darkness hint ("Special damage to every foe. Ignores Defense.") is the
    `ffx2-vegnagun-shuyin` §6.4 quote carried in `src/data/ffx2/abilities/dark-knight.ts`.
  - The party's Lv 99 HP and MP (5,355 / 338 for Dark Knight, 2,553 / 107 for Alchemist) are
    the §5 table, `[single source]`.
  - The current HP values (200,000 on Paragon, 512,340 on Trema) are illustrative.
  - No chip shows odds or a target. Meteor's type (TR3) is not shown, because it is not
    decided.
- **Ours:** every colour and light choice; the banner emblem; the size and placement of Trema
  (300 px at the Chapter IV boss spot) and Paragon (320 px); the link stills; every overlay
  design; and the phone layout.

## What went off-canon while rendering (flagged, not fixed)

- **O-1:** the pilot (`trema/withdrawn-pilot-pillars-profile.jpg`) came out in profile, with
  gold pillars around him. Then came a military coat (`withdrawn-a2-military-coat.jpg`), brimmed
  top hats (`withdrawn-a3-top-hat.jpg`), and a white robe with no stole
  (`withdrawn-a5-no-stole.jpg`). The hat only came right with the tag "eboshi". Seed 924113 had
  a halo disc behind him (`withdrawn-a6-halo-before-cleanup.jpg`). The disc was removed by a
  connected flood-fill on its peach colour, which gave A. C's first roll bowed
  (`withdrawn-c1-bowing.jpg`). C's kept roll used A as an identity reference (IP-Adapter,
  `--forceRef`). The render kept the hat and beard but not the robe. The quarantined rolls (seeds
  924101, 924104, 924106, 924111, 924112 and the halo-free retry of 924111, which grew wings)
  failed the cut-out guard and have no sidecar.
- **O-2:** A's first variant holds a glaive (`paragon/withdrawn-a1-holds-a-glaive.jpg`). B's
  second variant stood upright with a sword. B's veins came out ember red, not the pyrefly green
  the prompt asked for; they are shown as they came.
- **O-3:** the first B roll (denoise 0.55) kept the orange lamps and grew no banners. Its PNG was
  overwritten by a copy on this case-insensitive disk, and only its sidecar remains in
  `recipes.json`. A second C roll came out as a sci-fi corridor
  (`cloister/withdrawn-c2-scifi-corridor.jpg`). In the engine the plates sit in Chapter IV's
  staging (its grade, bloom and camera), so the top of each plate (A's banners, B's emblem) is
  mostly cropped. A Cloister scene would get its own staging.
- **O-4:** the "DARKNESS" command row and its hint line are patches over the real top row
  (which reads ARCANA). In the Dark Knight's real menu, Darkness is its own command.

## How these were made

- **Engine frames:** a private Vite server on port 5740 (HMR off, no file watching, GPU
  browser) loaded Chapter IV `ffx2-bahamut` at its first command menu (`scripts/shot.mjs`).
  Playwright request interception served these in place of the originals:
  - each candidate plate in place of `art/backdrops/bevelle-underground.png`;
  - `yuna-dark-knight`, `rikku-alchemist` and `paine-dark-knight` in place of the Chapter IV
    dresspheres.
  The boss was hidden. A MutationObserver swapped the HUD text: the names, the DK / AL badges,
  and the HP and MP (`scripts/names.sh`). The guide, advisor and enemy-move panels were closed
  with G / N / E. Each capture wrote three layers (full, plate, HUD). The bosses were
  composited between plate and HUD with a contact shadow (`scripts/frame.py`). Nothing was
  written to `public/art`. The server was stopped by its port.
- **Renders:** ComfyUI through `tools/gen/comfy.mjs`, presets `character`, `boss` and
  `backdrop`. Jobs went one at a time, each only when `/queue` had fewer than 3 pending. ComfyUI
  was never restarted, and there were no black frames. 15 jobs (24 images), about 7 GPU minutes
  against a 60-minute cap. Seeds and prompts are in `recipes.json`.
  - O-1 B and C's threads are PIL work on existing pixels (`scripts/unsent.py`), using the
    visual bible's `--pyre-green` `#8BE8B0` and `--pyre-white` `#E9FFF4`.
  - O-3 A is PIL work on the approved pixels (`scripts/plateA.py`). O-3 B is an img2img of them.
  - The link stills are `scripts/ko.py`.
- **O-4 mockups:** `scripts/gen_fight.py` writes the pages, and `scripts/shoot_fight.mjs` shoots
  them and measures the smallest font. They use the frozen `docs/concepts/polish/_kit/kit.css`
  (`ig--ffx2`).
- **Sheets:** `scripts/sheets.py` → `scripts/sheet.py`, 2000 px wide with 40 px captions, so they
  read on a phone with one zoom.
- Scratch (full-size renders, captures, logs): `D:/Tools/pyrefly-scratch/trema-options/`.
