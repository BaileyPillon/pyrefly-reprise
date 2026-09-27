# Sin, the assault from the *Fahrenheit*: chapter concepts (FFX only, 2026-09-27)

Bailey accepted item 24 of `docs/plans/next-content-2026-09-27.md` on 2026-09-27: "Start the
research and concept frames for the two new chapters". This folder holds the Sin half. Ixion is
handled separately.

These are **options, not a build.** Nothing in `src/` changed, and no painting jobs ran. This is
the cheap, broad rung of the ladder (AGENTS.md rules 9 and 15): three written concepts, each with
one rough layout frame. Pick one or mix them. A pick approves only what Bailey names.

**Game case: FFX only** (rule 14). This chapter is built on the CTB turn order, Cid's Trigger
Command, the airship range and aeons. None of these has an FFX-2 counterpart (`research/ffx-sin.md`
§0.3).

**Sources:** every number here comes from `research/ffx-sin.md` (commit `3c3dfa06`), with the tags
it uses there. Anything we judged ourselves is marked *our estimate*.

## Files (read in this order on a phone)

| File | What it is |
|---|---|
| `part-1-overview.jpg` | The three concepts in one line each, the recommendation, and the two questions that come with any pick |
| `part-2-concept-A.jpg` | Concept A: its frame, callouts, how it plays, what it teaches, faithfulness, cost, risks |
| `part-3-concept-B.jpg` | Concept B, the same layout |
| `part-4-concept-C.jpg` | Concept C, the same layout |
| `part-5-paintings.jpg` | The paintings each concept needs, with counts |
| `frame-A-1600.jpg`, `frame-B-1600.jpg`, `frame-C-1600.jpg` | The rough frames at full 1600 × 900 |
| `src/` | `page.html`, `frames.js`, `sheets.js`, `render.mjs`. Re-render from the repo root with `node docs/concepts/chapters/sin-2026-09-27/src/render.mjs all` |

Each sheet part is a 1080-px-wide JPEG under 500 KB.

The frames are **rough layouts**:
- Flat grey shapes with dashed outlines stand in for paintings that do not exist yet.
- The background is our own Evrae deck painting (`public/art/backdrops/evrae-airship-deck.png`),
  retinted.
- The party figures are our own idle sprites, desaturated so they read as placeholders.
- The HUD is a rough Ink & Gold stand-in.
- Party HP and MP maxima come from the presets (`zanarkand.ts` in A and C, `dreams-end.ts` in B).
  The current values in the frames are illustrative.
- No retail image is used (rule 8).

## The three concepts

### A. The whole assault: one chapter, four links

- **How it plays.**
  - Link I is the Left Fin and link II the Right Fin. The player closes in to Armor Break them
    (they are Armored, Defense 100), then pulls back to stay safe.
  - Up close, the Fin's Ram delays the party, and its Negation strips statuses from both sides.
    Far away, Negation only cleanses the Fin, and a charged Gravija does nothing.
  - Link III is Genais and the Core on Sin's back. Genais shields the Core and absorbs magic aimed
    at it. When Genais shells, the Core charges Gravija. Killing the Core ends the link even if
    Genais is still standing.
  - Links I to III run on one party state: HP, MP, statuses and Overdrive carry over (§1.2,
    `[verified: 3 sources]`).
  - The game's own break follows: a save and re-equip on the deck, with Yuna's scene.
  - Link IV is Overdrive Sin. It pulls the ship in for three turns, then its mouth opens, then
    Giga-Graviton gives a scripted Game Over.
- **What it teaches.**
  - Range buys safety, not damage.
  - Armor Break is the key to every link.
  - Kill order matters.
  - A burst has to be planned against a clock.
- **Faithfulness.** The most faithful concept: every link, the carry-over and the break are the
  game's own. A Game Over at link IV restarts at link IV, as the real save does. That retry rule is
  our estimate.
- **Cost.** The most.
  - All eleven new mechanics in §11.
  - Five colossal subjects, about 27 paintings.
  - Three backdrops.
  - One chapter slot, XVI. `Chapter.number` in `src/data/encounters.ts` stops at 15, so widening
    it is an additive contract change (rule 2).
- **Risks.**
  - Length. Each 65,000-HP Fin takes about 30 to 45 party actions at the Zanarkand party's damage
    (our estimate from the §6.2 table), so this would be by far the longest chapter.
  - The Fins can feel like Evrae twice over.
  - Losing at link III means replaying both Fins.
  - The Negation chance formulas (S-12) come from a single source, and their units are unclear.
    They need named tunables.
- **Staging: Sin in parts.** Sin is never whole on screen. Each link shows the part being fought,
  bigger than the frame, and a four-link strip says where the player is.
- **Frame A** shows link I at NEAR:
  1. The link strip with the carry bracket.
  2. The Fin's core gathering energy.
  3. The telegraph note.
  4. Cid's PULL BACK order. Cid acts before the Fin in the forecast, so the Gravija will do
     nothing.
  5. The HP that carries into link II.

### B. The countdown: Overdrive Sin alone, links I to III as a painted prologue

- **How it plays.**
  - The prologue is four or five painted plates: the Hymn plan, the ship's cannons tearing off
    both Fins, the jump onto Sin's back, and Sinfall into Bevelle.
  - Then comes one fight.
  - Turns 1 to 3 are "Drawn to Sin.": only Wakka, magic and long-range rows reach, so the party
    Hastes, Focuses and Cheers.
  - From turn 4 Sin is in reach: Armor Break, then everything. Overdrives and aeon Overdrives are
    saved for the end.
  - Giga-Graviton comes on turn 13. It takes 100% of max HP, inflicts Death, and gives a scripted
    Game Over that Auto-Life and aeons cannot stop.
  - Turn 13 is our default. The sources say 12 or 13 (S-1).
- **What it teaches.** Planning a burst, and Wards against Gaze. Gaze comes after six targetings,
  or three by an aeon. It rolls Petrify, Confuse or Zombie at 30% on the whole party, and any Ward
  blocks it completely (§5.4).
- **Faithfulness.** The fight is exact, but three of the four links are told, not played. Cid's
  range orders, Negation, Genais and the Core are all cut, and the prologue must say so plainly.
- **Cost.** The least.
  - Three new mechanics: percent-of-max damage with Death, the clock with its scripted Game Over,
    and Gaze.
  - One colossal subject, about 9 head paintings.
  - One backdrop: the deck over Bevelle at dusk.
  - Four or five plates.
- **Risks.**
  - The chapter rests on one number. 140,000 HP in about 9 melee turns is out of reach without
    Overdrives at the preset's damage. Plain attacks give about 85,000 to 100,000 (§6.2). So it
    needs a bench at human speed first.
  - S-1 moves the window by about six party actions.
  - The chapter is short.
  - The scripted Game Over has to read as the design, not as a bug.
- **Staging: the face fills the sky.** The head comes closer with each pull, and the mouth opens in
  stages. The mouth is the clock.
- **Frame B** shows Sin's turn 7:
  1. A 13-segment clock ring: 3 pulls, 9 in reach, then Giga-Graviton.
  2. The head at mouth stage 2 of 3.
  3. The Gaze counter.
  4. The turn order, with each Sin turn tagged by its clock number.
  5. Party B's Stoneproof and Haste.

### C. Two chapters, split where the game saves

- **How it plays.**
  - Chapter one is "Sin: the Fins and the Core" (working title). It covers links I to III on one
    party state and ends at Sinfall.
  - Chapter two is "Sin: the Face" (working title). It opens on the deck with Yuna's scene and a
    re-equip, then runs link IV. The Right Fin's Stoneproof drop (§2.4) can change hands during the
    re-equip.
- **What it teaches.** Chapter one is the range and kill-order puzzle, Evrae's big brother.
  Chapter two is the race.
- **Faithfulness.** As faithful as A. All four links are played, and the split is the game's own
  save.
- **Cost.** A's art, plus a second chapter card and a second chapter slot (XVI and XVII).
- **Risks.**
  - Chapter one is Evrae's mechanic twice more and may feel repetitive.
  - The roster tilts further towards FFX: 11 FFX : 7 FFX-2 with Ixion.
  - Chapter two can be played without chapter one. That is fine, because chapters are free to
    pick.
- **Staging: the ship and Sin's back are the stage, and Sin is the landscape.**
- **Frame C** shows link III:
  1. The two chapter cards.
  2. The Core charging, awake because Genais has shelled.
  3. Genais in its shell: Armored, immune to Gravija, and it casts Cura on itself whenever it is
     hit.
  4. Lulu's spell at the Core absorbed ("Magic absorbed.").
  5. HP and statuses carried in from the Fins.

## Recommendation: A as the end state, reached through B

1. **Build link IV first.** It carries the two biggest risks: painting a colossal subject, and the
   140,000-HP race. A painting pilot of the head and a bench at human speed with the chosen party
   answer both before anything else is spent.
2. **Ship it unlisted behind a switch**, as Trema did. Then add links I to III in front. They
   reuse Evrae's range command, forecast and order widget.
3. **Keep one chapter slot.** With Ixion, the roster becomes 10 FFX : 7 FFX-2, as the plan sheet
   proposed.
4. **Take the staging ideas from all three.** Use "Sin in parts" for links I to III, and the
   mouth-as-clock from B for link IV.
5. **Fall back to C if the bench shows A is too long for one sitting.** Split A at the save and it
   becomes C: the same content, plus one card.

## Two questions that come with any pick

1. **Which party (S-29)?**
   - **Party A:** `zanarkand.ts` as it ships. It blocks Gaze's Confuse and Zombie, but not Petrify.
   - **Party B:** the Garden of Pain party with Yuna's Tetra Ring back. It carries Stoneproof on
     Yuna and Lulu, and it runs straight on into Omnis.
   - The research recommends B (our estimate).
2. **Giga-Graviton on Sin's 12th or 13th turn (S-1)?**
   - Gestahl counts 12. bover_87 reads 13.
   - The default is 13 (bover_87, GameFAQs).
   - It needs a check in the Steam HD Remaster. Bailey is asked before anyone takes over the screen.

## Paintings the chapter needs

All paintings are original and made with our own pipeline (rule 8). A pilot comes before any
batch, and the head at colossal scale is the first pilot.

| Subject | States | A | B | C |
|---|---|---:|---:|---:|
| Overdrive Sin, the head | far, mid and near approach; mouth stages 1, 2, 3 and fully open; Gaze; defeat | 9 | 9 | 9 |
| Left Fin | near idle, far idle, gathering energy, hurt, torn off | 5 | — | 5 |
| Right Fin | the same five, painted as its own arm (a mirror of the Left Fin would be cheaper, but only with Bailey's yes) | 5 | — | 5 |
| Sinspawn Genais | out of its shell, in its shell, hurt, death | 4 | — | 4 |
| Sin's Core | inactive, gathering energy, hurt, death | 4 | — | 4 |
| Backdrop: the deck in flight | the Evrae deck repainted with Sin's flank filling the far sky | 1 | — | 1 |
| Backdrop: Sin's back | the ridged hide around the Core (§9.1) | 1 | — | 1 |
| Backdrop: the deck over Bevelle | dusk, Sin winged and propped on a tower (§9.1) | 1 | 1 | 1 |
| Story plates | the Hymn plan, a cannon tearing off a Fin, the jump, Sinfall, Evenfall (§9.2) | 3 | 5 | 3 |
| Chapter card | | 1 | 1 | 2 |
| Portrait: Brother, FFX look | the existing `brother-x2` is his FFX-2 look (rule 14) | 1 | 1 | 1 |
| **Total** | | **35** | **17** | **36** |

**Reused from disk:**
- All seven party members with every pose, and Yuna's summon pose.
- The five story aeons.
- Cid's portrait.
- The Evrae deck painting, as the base for the new deck.
- The Trigger Command widget.

The turn-order icons for the Sin parts are crops, not new paintings.

**Music** (Bailey judges by ear, rule 13). Two original cues are needed:
- An assault cue for links I to III.
- A countdown cue for link IV. No source names a track for the head (S-21).

The Hymn is part of the plan in the story (§9.4), so a motif grounded in it is canon ground. It
must be written fresh, never quoted.

## What happens after Bailey picks

1. Record liked, disliked, must remain, must change and undecided in the tile's `reaction`
   (`docs/target/targets.json`, rule 15).
2. Raise the fidelity for the surviving concept only. That means faked screenshots of the finished
   moment, starting with the pilot painting of the head.
3. Bench link IV at human speed with the chosen party before any engine work is committed. Only
   player-side fixes are allowed; the boss is never weakened.
