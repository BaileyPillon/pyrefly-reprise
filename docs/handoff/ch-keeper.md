# Handoff: the hidden Spectral Keeper chapter (lane ch-keeper; FFX ONLY)

Branch `ch-keeper`, from `origin/r73-int` `d5049f686`, built 2026-11-02 in the tree `D:\pyrefly-anim-proto`. Authority: Bailey, 2026-11-02, "i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on"
(and 2026-10-31, "you make the executive decisions for the next few days"); the decision is D-1039 (2026-10-18, "Spectral Keeper + Fallen Maesters (Recommended)"). Nothing deploys from this branch. **Not run in a browser**
(the lane had no browser, dev server or GPU): every number that is the stage's is an `[estimate]` until the job specs in section 7 are run.

**Game case: FFX only** (rule 14). The Keeper, the Circles, CTB, aeons and the Move command are FFX's; the fight is the story gate before Lady Yunalesca, `research/re-ffx-spectral-keeper.md`. FFX-2's Bevelle Underground
guardians are other fights in the ATB engine and nothing here reads them. The engine plumbing is shared files, inert for every other battle (section 3).

## 1. What is playable now

Type **`keeper`** on chapter select (any case; `src/app/screens/frontend/keeperDoor.ts`) and the board opens the hidden **Chapter 29, The Spectral Keeper**: party prep (Tidus, Yuna, Auron in front; Wakka, Lulu, Kimahri and
Rikku on the bench), the pre scene (a draft for Bailey to read: `src/story/scripts/spectral-keeper.ts`, eleven lines), the fight, the results page, the post scene (six lines). The fight is the game's, read from its files:

- three platforms for the front line (1, 2, 3 at the start; a ring of six round the Keeper, a seventh for an aeon), **all three act before the Keeper does** (First Strike);
- **Move** (a row on all seven characters, bench included) costs the turn at rank 3 and takes a person to a free platform (a ticking mine's platform included);
- the Keeper (52,000 HP) **sweeps** Attack All over the platform in front and its two neighbours after every hit that can change its HP, and its tail (Berserk 50) sets the new front;
- every fourth damaging hit lets it **light two platforms** on its next turn; **a mine's own CTB turn is the blast** (Death 255, a fraction of the maximum) on whoever stands there then, or a fizzle on an empty platform: walking away is the defence;
- **Escape, Flee, Guard and Sentinel are greyed for everyone**, aeons included; Defend, Summon and Switch stay;
- with an aeon out the Keeper uses its plain Attack on a random aeon, the counter gains 1 per Keeper turn and 2 per hit, and the mine is the rock's Circle, which kills a random living aeon.

It is registered as a **hidden experiment-class chapter** (`experimental: true`, number 29, the experiments' own store, no save change, no board card, out of the board's counts): `getChapter('spectral-keeper')`.

## 2. Driver picks, "his to overturn" (the preflight's recommendations under Bailey's blanket yes)

| # | Pick | Alternative | Why |
|---|---|---|---|
| Listed or hidden | **Hidden behind the word `keeper`, number 29** (the brief said "listed, not hidden"; I read D-1039's own words, "a build behind a hidden word", and SK9, "listing is Bailey's", as the governing ones) | Listed as a card on the board | Listing is `CHAPTERS` + `CHAPTER_IDS` + 20 cards: about 280 test files read `CHAPTERS`, a dozen hard-code 19 (`angra-door`, `booth-b4-*`, e2e tiles), every chapter-generic suite wants its art, and the card art does not exist. The steps are in section 8; it is a half-day change, not a rework |
| SK1 layout | **A, "the ring on the dais"**: the Keeper in the middle of a squeezed hexagon, the glyphs as figure-less rings (part anchors) round its feet, the rock to the side | C "lanes" (the fallback if A is illegible under the HUD rails) | the preflight's lean; `[estimate]`, section 7 reads it |
| SK2 arena | **(a) the Dome plate as is** (0 new plates); the scene `src/scenes/spectral-keeper.ts` derives Chapter II's | (b) a glyph-floor variant, (c) a new interior | recommended; the painting is Yunalesca's hall, the game's room is `dome02` (a stand-in) |
| SK3, SK4 look | **Not decided**: no Keeper painting, no glyph painting exist; the stage draws rings for the glyphs and a boss silhouette for the Keeper | 3 concepts each | these are Bailey's to see, and art generation is off in this lane (section 6) |
| SK5 party | **Tidus, Yuna, Auron on Chapter II's `zanarkandBuild`**, Move on all seven | free choice of three (the game's) | a fixed trio is the repo's convention; the build is `[estimate]` with a sourced build point |
| SK6 aeon mode | **Built** (own tests) | Summon off (a deviation) | the formation disables no Summon; "mechanics never bend" |
| SK7 mine fuse | **Base 84 `[estimate]`** (the idle counter cycles to a stored base of three times the tick speed of the record's AGI 0; the script's AGI 8 is written after the opening counters) | 45 (if the script's AGI counts); the live check Q2 settles it | the RE note calls 84 likelier; nobody ran the live check, and a fuse is not ours to choose |
| Q1 start platforms | **1, 2, 3** | 0, 1, 2 followed by a step | every script rule reads 1, 2, 3 (Circles 21 to 23 untargetable, the front starts at 2) |
| SK8 Pilgrimage | **Not a stop** (not built; a stop is `route.ts` data once a longer road exists) | a stop before Yunalesca, or an elite | new gameplay needs Bailey's yes (rule 10) |
| SK9 word | **`keeper`** | any | delegated; K and P unbound, E is start, R is r1; no overlap with the other doors (test) |
| SK10 music | **`boss-challenge`, Yunalesca's cue, a flagged stand-in**; the Dome's bed under the scenes | a new cue on Bailey's ear (rule 13) | no source names this fight's cue |
| SK11 story | **A draft Bailey reads** (the file header says so; the Keeper speaks no word; Kimahri once) | none | the Gippal GP15 precedent |
| SK13 results | **The normal results page** | none (the game's flag word asks for none, Q7 unread) | delegated |
| SK14 | The Fallen Maesters is its own lane (`ch-maesters`); the two ship in one release, one deep review | | deploy cap |

## 3. What changed, by area (all FFX only; inert elsewhere; `docs/CONTRACT-CHANGES.md` has the entry)

- **Contract (`battle/common/types.ts`):** `EnemyGroupDef.platformRing`, `EnemyGroupDef.frontLineFirstStrike`, `BattleEvent` `platform`. **`data/encounters.ts`:** `ChapterId` `'spectral-keeper'`, `ListedChapterId` excludes it, `Chapter.number` 29 (three edits on existing lines; the file stays at 399).
- **New engine files:** `battle/ffx/platforms.ts` (platform state in `state.flags` `plat.*`, the Move row and handler, the sweep zone, the idle-Circle test, the set-up), `battle/ffx/ai/spectral-keeper.ts` (the Keeper's turn and `onHit`, the Circle's blast and `onTargeted`), `battle/ffx/ai/spectral-keeper-rules.ts` (ids, the numbers and their sources).
- **Host files, each a small hook:** `adapt/ctb.ts` (an unarmed Circle takes part in the clock without a turn; **`advanceClock` runs stretch by stretch**, because an idle Circle's counter reaching 0 is a reset and not a turn; the opening counters give the front line First Strike), `setup.ts` (two calls on existing lines; still 399), `commands.ts` (the Move row), `execute.ts` (the trigger gets its command; a Switch hands over the platform), `ai/index.ts` (the `move` trigger handler), `formation-commands.ts` (Guard 0x3022 and Sentinel 0x3023 by ability id; re-exports the set-up calls so `setup.ts` gains no import), `adapt/target-world.ts` (one script id in the keeps-control set).
- **Data:** `data/ffx/spectral-keeper-ids.ts`, `data/ffx/enemies/spectral-keeper.ts` (the Keeper, the seven Circles, the formation), `data/ffx/enemies/spectral-keeper-abilities.ts` (seven rows with their command records word for word from the kernel fixtures), registered in `hidden-ffx.ts` and `command-records/enemies.ts`.
- **Chapter plumbing:** `data/chapter-spectral-keeper.ts`, `data/chapter-meta-spectral-keeper.ts` (+ `chapter-meta.ts`, `chapters-experiments.ts`), `story/scripts/spectral-keeper.ts`, `scenes/spectral-keeper.ts` (+ `experiment-scenes.ts`), `app/screens/frontend/keeperDoor.ts` (+ `chapterDoors.ts`), `engine/pyreflyCanon.ts`, `engine/tactics/lookup.ts`.
- **Tables and tests that force a decision for every new chapter, each answered (FFX only):**
  - source tables: `kernel/forced-action-table.ts` (the Keeper and the seven Circles: forced-action word 0, RE 1.2); `ui/coach/turnOrderLine.ts` (the Keeper gets Auron's "He moves after you" line: First Strike makes it true in every seed, and the engine count is the test's); `critic/runner/lib/route-pure.mjs` (the route's door word `keeper`); `data/art/artNamespace.ts` (`SCENE_BACKDROP_FILE`: the scene key `spectral-keeper` draws `zanarkand-dome`, so the board, party prep, start card, pause tab and preload ask for a file that exists, and the art mirror is not written into).
  - the fixture `tests/fixtures/parity/ffx/evrae-gaze-classes.json`: seven rows added, the class each of the seven record ids takes from its formula byte in `command_records.json` (formula 1 is class 2, formula 3 class 1, the rest 0).
  - tests that pin those tables or counts: `chapter-doors` (twelve doors), `critic-route-doors`, the three neighbour lists in `gagazet-door`, `summon-door` and `yojimbo-door`, `r62-auron-turn-order-tip`, `audio-music-batch2` (the Dome's bed and Yunalesca's cue by reference), `scene-backdrop-file`, `party-stature-chapters` (a hidden FFX chapter like the others), `chapters/exp-fayth` (the hidden scenes' key list), `parity-ffx-isaaru-commands` (the groups that carry `commandDisables`) and `-engine` (`GAME_COMMAND` gains guard and sentinel), `data-ffx-command-records` (519 abilities and 516 records; Glyph Mine's Doom word is a known difference, as Mega Graviton's; Attack All's shatter 120 is the record's alone: 152 such rows), `parity-ffx-reach` (Move is a trigger row like the airship orders, so it joins the markers), `re-parity-ai-merged-hooks` (a Circle hooks `onTargeted` only, as the game's m146), `parity-ffx-loot-data` and `parity-ffx-engine-loot-battles` (the Keeper and its Circles join the Dark Aeons as bodies **without a loot record**: the digest of `m129`'s chunk is not in the repo, rule 6), and `parity-ffx-engine-wiring` (a coverage floor from "more than 5" to "5 or more": seven more rows joined the seeded pool and moved the CTB-class count from 6 to 5; it is a floor, not a game number).
- **Byte-identity for the other chapters:** `advanceClock`'s loop runs exactly once whenever no Circle is in the battle (the second pass finds a ready character and returns), so the elapsed ticks and the counters are the old single stretch's. The rest of the hooks test a flag or a group field no other battle sets. The full unit suite is the proof (section 4).

## 4. Tests

- `tests/unit/chapters/spectral-keeper-data.test.ts` (18): the Keeper and the Circles pinned to the RE note; the seven rows pinned to `command_records.json` and `command_status.json` word for word; the chapter hidden, number 29, unlisted; the battle layer's id copies equal.
- `tests/unit/chapters/spectral-keeper-engine.test.ts` (25), the real engine, seeded: First Strike; the four switched-off commands; no Circle in any ordinary target list; Move (the free list, the hop event, rank 3 like a plain Attack, a refused aim, a Switch handing the platform over, a KO keeping and an Eject freeing); the sweep for each of the six fronts; Provoke (no HP) drawing nothing; an Overdrive being one hit event; the tail setting the front; the lay (two distinct ring Circles, the counter reset), no lay while a mine is live, the blast on the occupant, the fizzle on an empty platform, walking away, moving onto a ticking mine; the turn list showing only an armed Circle; aeon mode (the plain Attack, the rock's mine); **a victory (7,000 gil, 12,000 AP) and a defeat**; determinism; a fork.
- `spectral-keeper-story.test.ts` (7), `spectral-keeper-door.test.ts` (4).
- **Checks run (2026-11-02, this tree, vitest with --maxWorkers=3, final code):** tsc --noEmit clean; node tools/orphans.mjs lists none of the new modules; the Keeper files pass (data 18, engine 27, story 7, door 4); all 173 parity-ffx files pass (3,281 tests); the whole rest of tests/unit except the FFX-2-named, bench, parity, strategy, advisor and booth files passes (1,397 files, 20,014 tests, 0 failed); the strategy, advisor and booth files pass (124 files, 1,604 tests, 0 failed). The FFX-2-named and bench files were not run as a group (the FFX-2 engine and data are untouched; eight FFX-2-named files that read the shared registries were run and pass). No browser, dev server or GPU was used (the lane rule), so every perceivable claim is a prediction in section 7. The first pass found eleven files that pin a table or a count a new hidden chapter must answer; section 3 lists the answers.

## 5. Where the engine departs from the note, or reads it literally (rule 6: said, not tuned)

1. **The fuse base is 84, `[estimate]`** (SK7). A live check (Q2) would settle 84 against 45 and the phase; the fuse then moves by changing the Circle's `stats.agi` at the battle's build (the base comes from the record's AGI 0 at the opening counters).
2. **The sweep leaves out the Circles the game's group holds** for an empty platform (the Attack All cannot hurt a Circle; it only changes the RNG draws a result would have used, so the stream differs from the game's here and nowhere else).
3. **With an aeon out the extra +1 on a hit is unconditional**, as the script's order reads (RE 4.5 item 3, after the HP-class filter); the summary line "+2 per damaging hit" is the same in every case but a miss.
4. **Kimahri's Self-Destruct branch** (RE 4.5 item 4) is not ported: it is unreachable with the sourced party (Kimahri's list is Lancet, Scan, Jump, Mighty Guard, White Wind).
5. **No gear drop and no Pilfer/Nab Gil factor/Arena price:** the loot record of `m129` is not among the 43 in `loot/records.ts` (its digest is not in the repo), so the Keeper pays the four sourced fields (7,000 gil, 12,000 AP / 18,000, a Lv. 4 Key Sphere, Ether/Turbo Ether to steal) and nothing is invented.
6. **The Keeper keeps control when Provoked** (RE 4.1): `adapt/target-world.ts`'s `KEEPS_CONTROL_SCRIPTS` gains `'spectral-keeper'` (one entry, no other monster moves), and the script's `victimOf` aims its tail and its Attack at the Provoker with no draw (a test: Provoke, then the tail lands on Tidus).
7. **The turn forecast** (`predictTurnOrder`) assumes an armed Circle repeats at rank 3 like everyone; a mine takes one turn and goes, so the forecast shows a second Circle row it will not have. A projection, not a promise.
8. **The Warp hop is immediate** (the position is written in the Move action; the game writes it about 20 frames later). Nothing acts in between, so no rule differs.

## 6. ART NEEDS (nothing is painted; nobody queued ComfyUI: rule 12, and Bailey alone approves a painting)

Style reference for every item: the approved paintings in `public/art` (`characters/yunalesca-1` for a boss set: idle 823x1184 with `baselineY`, attack, cast, hurt, ko, `idle@2x`; `backdrops/zanarkand-dome`). Retail references are allowed since 2026-10-18 (rule 8 lifted), but the painting that ships must match the painted look.

| Subject | Poses and size | Used by | Today |
|---|---|---|---|
| **The Spectral Keeper** (a Spirit Beast, the wiki's word) | idle, attack (the tail), cast (laying mines), hurt, ko (the body stays: the death animation is "Boss"), idle@2x; about the Yunalesca-1 canvas family (portrait, roughly 800 to 1200 px on the long side), full-bleed boss aura | `spectralKeeper().spriteKey` = `spectral-keeper` | the stage draws its boss-silhouette placeholder |
| **The platform glyph** | three images, one painting serves all six numbered by an overlay: unlit, occupied, mined (lit); ground decal, square about 512 px with alpha | the Circles (`spriteKey` `spectral-glyph`; the scene draws part-anchor rings until it exists) | rings (part anchors) |
| **The aeon rock** (platform 7) | one image, only seen with an aeon out | the rock's Circle | a ring |
| **The front-trio floor tell** | one image (a gold wedge), only if Layout A is kept | the sweep zone | none: the sweep is told by the Keeper's turn and the damage |
| Mine blast, the Warp hop | two effects, may be drawn in code (the presenter's VFX) | not wired | none |
| Chapter card, thumbnail, pause plate | 3 images from the Keeper pick | `thumbnailKey` (**stand-in: `chapter-yunalesca`**, the same hall), `heroArt` `pause/ch29-spectral-keeper` (fallback: the Dome plate) | stand-ins |
| CTB tile portrait | one 32x32-class face for the Keeper | the turn list | none |

Existing approved art that **does** fit, used here and said so: the Dome plate `backdrops/zanarkand-dome.png` (SK2 a, Yunalesca's hall standing in for the room `dome02`); `chapter-yunalesca` for the card; `characters/yunalesca-1` and `characters/auron` for the pause snapshots.

**Audio:** none new. `boss-challenge` (Yunalesca's cue) is the flagged stand-in; Bailey's ear decides the final (rule 13; the audition page is untouched).

## 7. Browser job specs, with predictions (run these; nothing was run)

Each is a headless-Chromium job from node against a production build (`npm run build` then the preview), `?debug` on; the predictions are written first so a wrong one is a finding.

1. **J1, the door and the opening (1600x900).** Chapter select, type `keeper`. Prediction: the board settles on the chapter with no card; party prep shows Tidus, Yuna, Auron in front and four on the bench; the pre scene plays eleven lines; the battle opens on the Dome plate with the Keeper (a boss silhouette until it is painted) at screen x about 0.55 to 0.74 and **six rings on the floor round it** inside the rails (turn list from x 0.843), the rock's ring at x about 0.86 (**under the turn list: expect a clash, the likeliest layout finding**). Screenshot: `docs/screenshots/ch-keeper-j1-opening.png`.
2. **J2, the menu with real input.** Tidus's turn. Prediction: root list Attack, Cheer, Provoke, ..., Defend, **Move**, the bench names, Escape; Flee, Escape greyed; Auron's Guard and Sentinel greyed with no reason text; Move opens the target cursor on the rings of platforms 4, 5 and 6 (the cursor finds a part-anchored ring); confirm. Prediction: the banner "Tidus steps to glyph 5"; **the figure does not move** (the presenter has no hop for the `platform` event in this build); `window.__pyrefly` state shows `plat.at.tidus` 5.
3. **J3, the sweep.** Attack the Keeper. Prediction: the Keeper answers at once with Attack All on the members standing on the three platforms in front (all three at the start: front 2 is 2, 3, 1); the damage numbers land on the figures; no glyph lights.
4. **J4, the mine.** Play to the fourth damaging hit. Prediction: on its next turn the Keeper uses Glyph Mine (banner "Glyph N flares" twice), two CTB tiles named "Glyph N" appear with a placeholder face and **no platform icon** (not built); after about 84 ticks one of them takes its turn: a Death on whoever still stands there, or "Glyph N" striking itself.
5. **J5, a phone (390x844, touch).** Prediction: the Dome scene has **no phone rigs**, so the ring is clipped on the right and the rock is off-frame; the Move target step is still reachable. If the clipping hides a legal target, Layout C (lanes) is the fallback.
6. **J6, aeon mode.** Summon an aeon. Prediction: the Keeper stops sweeping and attacks the aeon; two hits lay the rock's mine; the rock's ring is at the screen's right edge.
7. **J7, a win and a loss through the real flow.** Prediction: the normal results page, 7,000 gil and 12,000 AP; the post scene (six lines); a defeat returns to the retry card.

## 8. To list it on the board (Bailey's word), the steps

Move `SPECTRAL_KEEPER` out of `chapters-experiments.ts` into `CHAPTERS`; add `'spectral-keeper'` to `CHAPTER_IDS`, drop it from `ListedChapterId`'s exclusions, drop `experimental: true`; give it a roman numeral in `ui/common/roman.ts`; give it a board card (`chapter-spectral-keeper`) and a guide card, doc and tactic (`data/guides`, `engine/tactics`); change the 19s in `angra-door`, `booth-b3/b4-*`, the e2e tile counts and `critic-route-doors`; run the chapter-generic suites; a deep review follows (class DEEP). Do it only after he has played it.

## 9. CHANGELOG lines (FFX only; for the release note that ships it)

- **FFX only (hidden Chapter 29, the word `keeper`): the Spectral Keeper at the foot of the Zanarkand Dome's lift.** Three of the party stand on glyph platforms and all three act before the beast; it answers every blow with a sweep across the platform in front and the two beside it, and every fourth blow lets it light two platforms to burn. A new **Move** command takes a person to a free platform for a turn; Escape, Flee, Guard and Sentinel are off. With an aeon out the rules change (a plain Attack, a mine on the rock). The painting, the glyphs, the music and the story are stand-ins and a draft.
- **FFX only (engine plumbing, no other battle changes): the turn clock can count a character that has no turn** (an unlit glyph), and a trigger command now receives the command it was submitted with.

## 10. Owed, and open questions for Bailey

- **Owed (built nowhere):** the guide card and page and the advisor's tactic line (hidden chapters carry them; the Keeper's would teach "stand outside the front trio, step off a lit glyph" once Jegged's page is read for this fight: preflight Q10); the presenter's hop and the CTB tile's platform icon; a visible tell for the sweep zone and for a lit mine (today the only tells are the banner and the Keeper's turn); the pause-screen hero; the phone rigs; the Pilgrimage stop.
- **Live checks nobody has made (the RE session's, Bailey's 2026-10-19 00:41 words cover them):** Q1 start platforms, Q2 the fuse, Q3 the mine picker's uniformity, Q4 a KO holding its platform, Q6 a miss drawing a sweep, Q11 the Keeper's size.
- **Questions:** (1) Hidden behind `keeper` (this build) or listed on the board now? (2) Layout A (rings round the Keeper), once the job specs are read, or C (lanes)? (3) The Keeper's look and the glyph's look: the three concepts each are still to be drawn (SK3, SK4).
