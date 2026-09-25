# Chapter XII: Seymour Omnis inside Sin, the Garden of Pain (FFX): end-state options

**Nothing here is built or wired into the game.** No file under `src/`, `tests/`, `critic/`,
`public/art/` or `docs/target/` was touched. These are the options rounds that
`docs/plans/chapter-omnis-review.md` §6.2 says come first (hard rule 9). Pick or mix per row.
A pick approves only the parts you name (rule 15). Every sheet is stamped `CONCEPT`.

**Which game (rule 14): FFX only.** Omnis, the Mortiphasm discs and the Garden of Pain exist
only in FFX (research §0.3). CTB queue, FFX gold accent, no `ig--ffx2`, no ATB bar. A pick
applies to this chapter only.

**The ring order is our estimate.** Nothing we read says in what order the four colours sit
around a disc (research O-7) or what the discs reset to after Ultima (O-11). Every sheet uses
Fire, Water, Ice, Thunder clockwise (GameFAQs' reset cycle read as a ring), as plan question
B8 proposes. The colours themselves are sourced (research §4.1): orange Fire, purple Ice, blue
Water, yellow Thunder.

| Round | Sheet | Files |
|---|---|---|
| **O-2 The discs (first: readability decides the rest)** | `o2-discs/sheet.jpg`, `o2-discs/sheet-phone.jpg` | `o2-discs/{a,b,c}-frame.jpg` (1600x900), `{a,b,c}-turn.jpg` (one 90° turn in four frames), `{a,c}-disc-card.jpg`, `{a,b,c}-phone.jpg` (390x844 at 2x), the `.html` for each mockup |
| O-1 Seymour Omnis | `o1-omnis/sheet.jpg` | `o1-omnis/{a,b,c}-frame.jpg`, `{a,b,c}-glow-frame.jpg`, `{a,b,c}-card.jpg` |
| O-3 The Garden of Pain | `o3-garden/sheet.jpg` | `o3-garden/{a,b,c}-plate.jpg`, `{a,b,c}-frame.jpg` |
| O-4 Reading the fight (B14) | `o4-fight/sheet.jpg`, `o4-fight/sheet-phone.jpg` | `o4-fight/{a,b,c}-{i,ii,iii}.jpg` (1600x900), `-phone.jpg` (390x844 at 2x), the `.html` for each |
| O-5 Omnis's portrait | not in this set | Only if B17 = c, and only after O-1 is picked: it is drawn from the pick |
| O-6 Music | not in this set | An audio sketch is its own track, judged by ear on `docs/audio/audition.html` (rule 13) |

## Questions for Bailey, one per round

1. **O-2 (first) How should the four discs read?** The whole fight turns on one fact: which
   colour each disc points at Seymour. A: painted discs, the quarter facing him lit with a gold
   rim, the other quarters dimmed. B: A, plus a disc strip on the HUD that names each disc's facing
   element (colour, symbol and word) and says what that makes him ("absorbs Fire, weak to Ice").
   C: flat Ink & Gold rings with a symbol on every quarter and a pointer toward him, tilted to read
   as a mesh that turns. **I recommend B.** A keeps the discs part of the painting, but on a phone
   the discs are about 80 CSS px and colour alone carries the fight; the strip says it in words,
   works without colour vision and updates when a turn lands (`o2-discs/b-turn.jpg`). C reads the
   cleanest (`c-disc-card.jpg`) but puts interface graphics into the painted world (rule 9's
   painted 2.5D), and it drops the "large discs" look the sources describe. **Follow-up (B8):** the
   colour order around a disc is our estimate; confirm it from your memory or footage you watch
   before the chapter is listed.
2. **O-1 How should Seymour Omnis look?** A: new paint. Long light-blue hair, dark indigo
   shoulders with horn spikes, both clawed arms spread, and a long skirt of hanging dark strips
   instead of legs, so he hovers. B: the approved Macalania portrait as the face reference (long
   silver hair, red markings), a lean horned body tapering into claws. C: A made translucent and
   lit by pyreflies (one source calls him translucent). Each is shown calm and glowing red.
   **I recommend A.** It has the widest silhouette, reads as a last form, and his spread arms
   frame the four discs. B reads as Seymour's face, but the horns and lean body are ours and it
   reads smaller than the discs. C nearly disappears against the plate, and its glow state is the
   weakest. You can mix: A's body with B's long silver hair is a finals question, not a new round.
   **Follow-up:** the red glow here is a tint and halo; in the game it would be a live effect
   (pulse plus particles). Fine as the direction?
3. **O-3 What light in the Garden of Pain?** A: crimson dusk. B: pale day, a rose sea,
   waterfalls from floating ledges. C: deep violet. **I recommend C.** In the engine the orange
   Fire quarter, the gold rims and his red glow all stand out against violet
   (`o3-garden/c-glow-frame.jpg`); on A the red glow sinks into the red plate; B is the most
   faithful to "a red-tinged sea under a cloudless sky" as painted, but under Chapter III's grade
   its bright horizon blooms behind him (`o3-garden/b-frame.jpg`). If being faithful matters more
   here, pick B and let the scene's own grade tone the horizon down.
4. **O-4 How does the player read the attack counter (B14)?** All three sit on O-2 B. A: the
   red glow only, as the game does it. B: six diamond pips beside his queue tile ("2 of 6"; three
   below 20,000 HP), full and red when he is about to act. C: one line of intent in the
   enemy-move slot (turn one: "four Firaga next, he absorbs Fire and is weak to Ice"; the glow:
   "Dispel on the party, then Ultima"; after a turn: "three Firaga and one Thundara next").
   **I recommend C.** It says in words what the discs mean for the next turn, which is the lesson
   the fight teaches, and it matches Chapter X's pick (a chip strip plus a sentence). B's pips
   show a number the game hides; add them only if you want the counter itself on screen. No chip
   or line names which party member a spell hits (that mapping is an estimate, B12).
5. **Reference look (rule 6 and rule 11).** No image was fetched this round, so these looks come
   from the text sources only. The wiki has official concept art of Omnis and of the discs
   ("the reels"). **Do you want a look-only pass at those images before the finals** (seen in a
   headless browser and deleted, as the Natus round did), or should the finals stay with these
   text-only designs? **I recommend the look-only pass**, before any final is painted; it needs
   your yes because it fetches images.

## What is sourced and what is ours (rule 6)

- **Sourced** (`research/ffx-seymour-omnis.md`, wiki text read through `api.php`: *Seymour Omnis*
  revid 4032306, *Mortiphasm*, *Inside Sin*): he hovers in front of four large discs; each disc
  has four coloured sections, orange Fire, purple Ice, blue Water, yellow Thunder, and the section
  closest to him counts; the fight opens with all four on Fire; a spell on a disc turns it 90°
  right and a physical hit 90° left, and only Wakka, Valefor, Anima and Mindy reach them; one disc
  on an element halves it, two make him immune, three absorb, four absorb and make him weak to the
  opposite (all Fire = weak to Ice); four spells a turn, -ra on one or two discs, -ga on three or
  four; six attacks on him (three below 20,000 HP) make him glow red, then Dispel on the party,
  then Ultima, then every disc moves to the next element. The Garden of Pain is steps up to a
  platform; the Sea of Sorrow beside it is a red-tinged sea with watery blue walkways, waterfalls
  and Yevon symbols. One Let's Play calls him translucent.
- **Not looked at:** no reference image was fetched this round (the brief said no downloads,
  rule 11), so every look here comes from the text facts above and is our own design. The Natus
  round looked at the wiki's images in a headless browser before drawing; see the last question.
- **Ours:** his whole look (hair, horns, shoulders, the hanging strips, the missing legs), the
  disc painting and frame, where the four discs sit (two each side, facing him), the lit quarter
  and gold rim that mark "facing him", the Ink & Gold rings and their symbols, the disc strip, the
  pips and the intent wording, the plates' light, the staves as stone posts, the floating ledges.
  The party numbers are Chapter III's.

## What went off-canon while rendering (flagged, not fixed)

- **O-1:** the first pilot (seed 912101) was a flowing, ethereal figure cropped at the edges,
  with no boss read; withdrawn. A's shoulders carry red horn-claws and a spiral mark on the
  chest the prompt did not ask for. B's first roll (912201) had legs and a crest; withdrawn. B's
  horns are the model's, not sourced. A was rejected by the pipeline's cut-out guard although the
  guard passes the file alone; the quarantined cut-out was used. A white highlight on A's left
  shoulder blooms in the engine; the composite caps highlights at 228.
- **O-2:** C's rings are drawn in PIL, not painted; a turning mesh would be built in three.js.
  A and B's disc is one render (912301) whose square frame was cut away and whose quarters were
  tinted in PIL; the quarter lines are drawn on. On the phone, the queue row and the "Tidus
  Command" label cover the left discs; a Garden of Pain phone layout would move them.
- **O-3:** none of the plates shows a clear flight of steps (A has a short dais), and only B has
  waterfalls. Thirteen backdrop renders went in: eight pilots missed (a glowing lava road, an
  empty sea with one rock, an indoor hall, a giant red orb, a flying creature); the three kept
  plates are img2img paint-overs of one assembled start image (sky and ledges from 912407, the
  terrace floor from 912403). The staves are thin posts, not described anywhere.
- **Engine staging:** every frame uses Chapter III's red grade, bloom and floor light pools; the
  plates' own colour shifts toward red under it. The queue icon is Omnis's composite, cropped.
- **O-4:** frames i to iii sit on plate C (my O-3 pick) so the glow reads; party HP and MP are
  Chapter III's.

## How these were made

- **Engine frames:** a private Vite server (port 5700, HMR off, GPU browser), Chapter III
  `braskas-final-aeon` at its first command menu (Tidus, Yuna, Auron: plan B2 a). Playwright
  request interception served the candidate plate in place of `art/backdrops/dreams-end.png` and
  one composite image (Omnis plus the four discs) in place of `characters/braskas-final-aeon-1/*`.
  Dream's End's own props were hidden in the scene (floating ruins, fire rims, floor cracks,
  rocks, embers), both Yu Pagodas were hidden, the Talk and Flee rows were removed (Omnis has no
  Talk and cannot be fled, research §4.6), the Mortiphasms were taken out of the turn queue (they
  have no turns, §2), and the names were swapped in the DOM. Guide, advisor and target panels
  were hidden with G / N / I. The boss was placed by projecting it to screen x 1000 before each
  shot. Nothing was written to `public/art`. The plates sit under Chapter III's red grade and
  lights; a Garden of Pain scene would get its own.
- **Renders:** ComfyUI through `tools/gen/comfy.mjs` (presets `character`, `boss`, `backdrop`),
  one job at a time, each submitted only when `/queue` had fewer than 3 pending. ComfyUI was
  never restarted; no black frames. 18 renders (4 character, 1 boss, 13 backdrop), about 5 GPU minutes. Every seed and prompt is in
  `recipes.json`. O-1 C, every red-glow state and every disc are PIL work on rendered pixels
  (`scripts/omnis_build.py`; the other scripts sit beside it).
- **Mockups:** `o2-discs/*.html` and `o4-fight/*.html` over the real frames, using
  `docs/concepts/polish/_kit/kit.css` and the Yojimbo round's `phone.css`, shot in Playwright
  at 1600x900 and 390x844 (2x). The script measured the smallest fight label: 13 px at 1600x900, 12 px on the phone; no sideways scroll at 390 px.
- Scratch (full-size renders, scripts, composites): `D:/Tools/pyrefly-scratch/omnis-options/`.
