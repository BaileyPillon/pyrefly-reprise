# Biran and Yenke: Kimahri's solo trial at the Mountain Gate (a hidden FFX chapter)

**Status (2026-10-14 and 15, built for Bailey, via the release driver):** built, tested and proved in a production build in a browser; **not merged and not deployed**. Branch `ch-biran-yenke` (from `origin/r48-rc` ea431aa0, with the
reverse-engineering session's note `origin/re-ffx-biran-yenke` 1ea0cd49 merged), in a worktree of its own (a sibling folder of the main tree). Tip: see the last line of this file.

**Authority:** Bailey, 2026-10-07, D-536 (his blanket yes to the driver's recommendation): "Biran and Yenke Ronso (FFX, Kimahri's solo trial)"; 2026-10-14, relayed by the driver, verbatim: "Please work on finishing the
unimplemented chapters STAT". The driver's decisions: the chapter ships **hidden behind the typed word `gagazet`**, hidden chapter **number 25** (Fayth is 22, the Tourist Trap 23, Valefor at Besaid 24), listing it on the board
waits for Bailey's word, the art is provisional and no approved painting is replaced, the music is an existing cue by reference, and Kimahri's party is the Seymour Flux chapter's preset (see "Kimahri's party").

**Game case: FFX only** (AGENTS.md rule 14). CTB, Kimahri's Lancet and Ronso Rage and the two Ronso brothers at the Mountain Gate are FFX's; FFX-2's Gagazet mission (Garik and the Youths) is another fight and shares nothing
with this one. The shared plumbing (the registry row, the door row, one scene row, one scripted-extra dispatch line, one set-up call, `ItemDrop.rare` and the results line that reads it) is "both" (CHK-020), additive and inert
for every other chapter: the 18 FFX golden digests, the FFX-2 and FF7 goldens do not move.

## What Bailey should see first

1. On the chapter board type **`gagazet`** (G, A, Z, A, G, E, T on the keyboard; A is left, **Z is the confirm key and the screen swallows it while the word is being typed**, E is start; G and T are bound to nothing). No
   card on the board changes: there is none, and the board still says "of 18".
2. Party prep says **EXP** (header "EXP · BIRAN AND YENKE"); the opening plays (Yenke and Biran at the gate, Kimahri's one line); the first menu is **Kimahri alone** facing the two brothers on Chapter I's Mt. Gagazet, with
   the guide open and the advisor's first tip "Lancet".
3. Fight it as the guide says: **Lancet each brother** (one Rage a cast; a new Rage fills the gauge), spend the Rages (Fire Breath and Aqua Breath hit both brothers), keep a Potion for under 45 percent, and use the plain
   Attack only while the brothers are apart (together, the other one stands guard and the blow does 8). **Learn Biran's Rages before Yenke falls.**
4. Look at: the HP bars (the brothers' HP is set from Kimahri's own numbers at the start: Biran 3,208, Yenke 2,406 for this Kimahri), the guide card's lines that follow the guard and the sides, the two **provisional**
   paintings of the brothers, and the music (the generic boss cue; Bailey judges music by ear).

## What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| Stats from Kimahri | `battle/ffx/ai/biran-yenke-stats.ts` (one pure function, the note's worked examples pinned), `biran-yenke-setup.ts` (called from `battle/ffx/setup.ts`) |
| The two scripts, sides, guard | `battle/ffx/ai/biran-yenke.ts` (the turn) and `biran-yenke-rules.ts` (half-HP, partner death, sides, defence swap, the hit hook), one import in `ai/index.ts` |
| Lancet teaches Ronso Rages | `battle/ffx/ronso-rage.ts` (new; the lessons table lives here, the battle layer imports no data) and one dispatch line in `battle/ffx/scripted.ts` for `extra.learnsRonsoRage` |
| Data: the bodies, the formation, the rows | `data/ffx/enemies/biran-yenke.ts`, `biran-yenke-abilities.ts` (six rows with their command records), `data/ffx/biran-yenke-ids.ts`, the Friend Sphere in `data/ffx/items/spheres.ts`, records in `data/ffx/command-records/` |
| The party | `data/ffx/builds/kimahri-trial.ts` |
| Chapter record, pause metadata, registry | `data/chapter-biran-yenke.ts` (number 25, `experimental`), `chapter-meta-biran-yenke.ts`, one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| Story | `story/scripts/biran-yenke.ts`: five opening lines and three closing, our own words, no barks, no victory quips |
| Stage | `scenes/gagazet-ronso.ts` (a thin derivation of Chapter I's Mt. Gagazet that drops Chapter I's whole staging and sets this fight's), a row in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts`, two rows in `engine/BattlePresenterDepartures.ts` (the brothers' bodies stay: they are people, beaten and alive) |
| Guide, advisor | `data/guides/biran-yenke.ts`, `data/guides/docs/biran-yenke.ts`, `engine/tactics/biran-yenke.ts` (+ registries); research `research/ffx-biran-yenke.md` |
| The word | `app/screens/frontend/gagazetDoor.ts` and one row in `chapterDoors.ts` |
| Contract change | `ItemDrop.rare` in `battle/common/types.ts` and the line in `battle/ffx/results.ts` that reads it (`docs/CONTRACT-CHANGES.md`) |
| Tests | `tests/unit/chapters/biran-yenke-{stats,data,engine,hit,rewards,chapter,bench}.test.ts`, `tests/unit/gagazet-door.test.ts`, `tests/unit/helpers/ronsoDrive.ts`; edited: `chapter-doors.test.ts` (eight words), `data-ffx-command-records.test.ts` (490 / 488 / 2), `data-reward-items-resolve.test.ts` (the rare item), `guide-doc.test.ts` (an HP line set by the party), `audio-music-batch2-2026-10-12.test.ts`, `exp-fayth.test.ts`, `party-stature-chapters.test.ts`, `presenter-departures.test.ts`, and the fixture `evrae-gaze-classes.json` (five records) |

No source file added is over 400 lines (hard rule 7); `data/ffx/index.ts` ends at **399** (its two imports folded into one so a second chapter has one line of room; the next hidden chapter that registers there needs another
fold), `encounters.ts` stays at 397. Two test files are over 400 lines, as many of the repository's are (`biran-yenke-engine.test.ts` 401 and `gagazet-door.test.ts` 456).

## The data, its sources and tags (rule 6: nothing invented)

**Every number of the fight is the game's own**, read from its files by the reverse-engineering session (`research/re-ffx-biran-yenke.md`, "RE section n"); the written sources (Jegged, the FF Wiki, this repository's
Kimahri notes) are digested in `research/ffx-biran-yenke.md`, which also lists where the file overrules them. The RE note tags its lines `[bytes]` (read from the two monster files and the executable, not run):

| Field | Value | Tag |
|---|---|---|
| The two records (identical bytes) | HP, STR, MAG, MDF and AGI are placeholders overwritten at the start; DEF 30, MDEF 10 (then 50), Luck 15, Evasion 0, Accuracy 100, MP 200; the immunity set; Doom counter 20; Threaten byte 0 | `[bytes]` RE section 2 |
| The stats from Kimahri | `U = ((C / 32) + 30) * 586 / 730`; Biran HP 8 x U, Yenke 6 x U; the STR and MAG tables by `k = (Kimahri HP - 644) / 200`; the AGI offsets; MDF 50 | `[bytes]`, arithmetic `[inferred]`; the note's worked example 7,896 / 5,922 is pinned |
| Rewards | 1,500 gil, 4,500 AP (6,750 on an Overkill, threshold 2,500), one drop slot: Return Sphere x1, a Friend Sphere in its place one time in eight (x2 either on an Overkill), a gear drop; steal Lv. 3 Key Sphere (rare x2); Bribe blocked | `[bytes]` RE section 2; Jegged agrees on the items `[verified: 2 sources]` |
| The cycles, half-HP, partner death, sides, defence swap, the hit hook | RE sections 5.2 to 5.7 | `[bytes]`; see below for what is `[inferred]` |
| The move rows | Bulldoze, Fire Breath, Aqua Breath, Berserk, Mighty Guard, White Wind, with their command records | `[bytes]` RE section 6; records equal the game's table word for word (the rank and chance bytes were read from the kernel tables with the RE session's command reader) |
| The lessons | Biran: Mighty Guard (gated), Thrust Kick, Self-Destruct, Doom; Yenke: White Wind (gated), Fire Breath, Aqua Breath, Stone Breath; one a cast, the first Kimahri lacks | `[bytes]` RE section 7 |

**What is `[inferred]` or `[unproved]` in the note, and so here** (RE section 9): no hook was run (the AI is read, not executed; RE then compared the build with the decode on the real engine and found it matching, 132 of 132
same-seed runs identical); the defence swap's **property-gate quirk** (only Kimahri's plain Attack passes; the Rages, Jump and Lancet do not) rests on the executable's resolver bytes; **both brothers start on the same side**
(Area 0 is inferred; the initial value was not read); the clamps on the stat writes were not traced; the turn order and first actor were not traced (Biran is 4 AGI points faster than Yenke at the start); the dialogue scenes
are not reproduced (the driver's decision: no barks).

**Our own estimates, tagged in the files:** Kimahri's party (Chapter I's preset, `[estimate]` as Chapter I tags it, with the gauge at 45), the stage positions and heights, the two paintings, the music cue, the guide's wording.

## How the fight works (as built)

- **At the start** the brothers' HP, STR, MAG, AGI and MDF are set from Kimahri's (RE section 3): for the shipped Kimahri (STR 26, MAG 22, HP 2,310) Biran has 3,208 HP and Yenke 2,406. A weaker Kimahri meets weaker
  brothers; a stronger one stronger.
- **Turns** (RE 5.3): Biran Thunder, Bulldoze, Blizzard, Bulldoze; Yenke Fire Breath, Aqua Breath, Bulldoze, always at Kimahri. Every Bulldoze moves its user to the other side of the arena.
- **Half HP** (RE 5.2, 5.3): the first turn after a brother drops below half of his maximum HP, while his brother lives, he casts his own Rage (Biran Mighty Guard, Yenke White Wind) on both brothers if they share a side,
  otherwise on himself, and the gate on that Rage opens for Lancet when he **queues** it. A brother who falls first cancels it for good.
- **A brother falls** (RE 5.4): Yenke's MAG x5/4, Haste on himself, AGI := Kimahri's AGI - 4; or Biran's STR x5/4 and Berserk on himself (a swing every turn, no more Thunder or Blizzard).
- **The guard** (RE 5.6): Kimahri's plain Attack on one brother, while both stand on the same side, makes the other stand in: his DEF goes to 254 with Sentinel on until he is next hit. **Measured: a guarded plain Attack
  does 8, the same blow with the brothers apart 440 to 480 (the RE review measured 436 at one roll): under two percent, not Jegged's "a quarter".** Jump, Thrust Kick, the Rages, Lancet and items are never turned aside.
  Mug and Quick Hit would also pass the game's gate quirk (a command-id byte), but Kimahri has neither here.
- **The one random draw** (RE 5.7): every non-lethal hit on a brother takes one draw of the script stream (`v12 := GetRandomValue() mod 100`, starting at 200) which in the game only picks a line of dialogue. The chapter
  shows none, but keeps the draw so the stream stands where the game's does. A lethal hit turns Sentinel off and draws nothing; the release (DEF 30, Sentinel off) happens only while Sentinel is on.
- **Lancet** (`ronso-rage.ts`): after a hit lands on a brother, Kimahri learns the first Rage on that brother's list he lacks, gated as above; a new Rage fills his gauge to 100 and prints "Kimahri learns ...". Lancet on
  any other enemy writes nothing (pinned on Seymour Flux, and by the 18 goldens; RE ran 20 of 20 Lancet checks elsewhere).
- **Rewards** (`ItemDrop.rare`): each brother's death pays one item from one slot, never none and never both.
- **The end:** Kimahri alone; Escape, Flee and Switch are off. A defeat is the normal loss. Self-Destruct (a Rage Kimahri can learn here) ejects him: the engine's existing all-ejected rule ends the fight as a **withdrawal**
  (`'escape'`, the results panel "WITHDREW"), not a defeat; the guide warns and the advisor never picks it.

## The disagreement: a Berserk Biran

Jegged says a Berserk Biran **cannot teach**, so learn his Rages before Yenke falls. The game's file says (RE sections 5.4, 5.5, 7) that when Yenke falls first Biran's pending half-HP action is cancelled (so **Mighty Guard
is never offered**) but that Biran still teaches Thrust Kick, Self-Destruct and Doom, because his learned-move word is rewritten on every Lancet. The chapter follows the file (rule 6; RE confirmed it on the real engine). The
**guide says only what is true under both** ("learn Biran's Rages, Mighty Guard first of all, before Yenke falls; a Berserk Biran never offers Mighty Guard") and never says what a Berserk Biran will or will not teach.

## Kimahri's party (the preset call, said plainly)

There is no preset for this build point in the research. The duel is minutes before Chapter I's Prominence on the same mountain, so the party is **Chapter I's `gagazetBuild`, Kimahri alone**, with only what a source takes off
(`data/ffx/builds/kimahri-trial.ts`): Mighty Guard, White Wind and Self-Destruct (what the duel teaches; with them the half-HP gate and the chapter's point would be moot), Talk (Seymour Flux's own command), two Mega-Potions
and 20,000 gil (found on the trail afterwards), and his gauge at 45 ("a Kimahri without a fresh Rage", `ffx-seymour-flux.md` C-16, `[estimate]`). He keeps Jump, Lancet, his gear and grid. The driver accepted the call
("Kimahri starts WITHOUT Mighty Guard, White Wind and Self-Destruct, keeping Jump and gauge 45"); `KIMAHRI_KEEPS_THE_PRESETS_RAGES` is the one switch that puts the preset's Rages back.

## Art made and installed (provisional; Bailey alone approves a painting)

Two **new subjects**, `characters/biran-ronso` and `characters/yenke-ronso` (a standing painting each, `idle.png` and its sidecar), made locally with ComfyUI (Animagine XL 4.0, plain text-to-image, no reference): 12 renders
of Biran in one round and 24 of Yenke over two (the first round's Yenke had a metal-mesh muzzle artefact, fixed in round two with a "snout" wording and negatives), one pick each, cut out with the anime matting model and
flipped to face the party. Picks: Biran 766 x 1190 (baseline 1174), Yenke 540 x 1171 (baseline 1155). They live only in a **new hard-link art mirror** (the release art with the two subjects added and the manifest
regenerated); nothing under an existing subject was written, and no approved painting (Kimahri's included) was replaced or touched. The candidates, contact sheets and prompts are in the lane's staging on the build drive
(not in the repository; `public/art` is gitignored on main). The Mountain Gate itself has no painting: the stage is Chapter I's valley. In the browser the two read as the visual bible's brothers (Biran: blond mane, grey-blue
fur, orange wrap and leather vambraces; Yenke: brown mane, bare upper arms), both standing in profile toward Kimahri; they are candidates for Bailey's eye, not approved art.

## Music

`scene-gagazet` (the mountain's own bed) under the scenes, `boss-challenge` for the fight (the game's one generic boss track, our original take; no source names this fight's cue) and `victory-ffx`. Nobody has heard it
in this fight. The music table test lists the chapter, and `boss-challenge` now has three owners.

## Tests, the bench, the suite

- **The chapter's own suites** (113 tests, all green): `biran-yenke-stats` 13 (the pure function and the note's worked examples), `-data` 21 (records, rewards, formation and ids pinned to the note), `-engine` 26 (the cycles,
  the sides, the half-HP Rage, the partner-death changes, the defence swap, Lancet's lessons, the end), `-hit` 7 (the one script-stream draw per non-lethal hit, counted; the release only while Sentinel is on; the guard
  measured on five seeds), `-rewards` 4 (300 fights: one item a brother, the Friend Sphere 62 times in 600 slots against 75 expected, within two standard deviations of one in eight; the Overkill doubling), `-chapter` 19
  (registration, scene, store, story, guide, advisor), `-bench` 1, and `gagazet-door` 22 (the first door with a confirm letter: the Z is swallowed by the live match, with the control; the word against every sibling word in both
  orders). `chapter-doors` (eight words) was edited.
- **The bench** (100 seeds a line on the real engine with the shipped preset, printed by `biran-yenke-bench.test.ts`; measured, never tuned): **the advisor's line wins 100 of 100 in 16.4 decisions on average and learns 7.4
  Rages; the plain Attack with a Potion under 45 percent wins 100 of 100 in 25.1 decisions; the plain Attack alone wins 0 of 100** (it loses in 7.4). The preset is Chapter I's Kimahri minutes after this fight, so he is
  stronger than the typical player's Kimahri at the gate (the walkthrough calls it hard-pressed); the brothers' stats follow Kimahri's own, so a weaker Kimahri meets weaker brothers. If the preset moves the table moves.
- `node node_modules/typescript/bin/tsc --noEmit` clean; `node tools/orphans.mjs`: none of this chapter's modules is listed (the list is the repository's own old orphans); `node tools/audio/qa.mjs` green, 68.87 of 105 MB, 0
  findings (no audio added).
- **The full unit suite, once** (2 workers, 2,259 s): 1,257 files (1,239 passed, 15 skipped, **3 failed**), 19,740 tests (19,662 passed, **3 failed**, 74 skipped, 1 todo). All three were tests that enumerate every
  departure kind, shipped command record or scene file meeting the new chapter; none touched a game rule. **Fixed** (e5a72d74) and re-run green: `presenter-departures` (16 kinds become 18), `re-parity-ai-evrae` (the gaze-class
  fixture gains the five new records), `ui-ffx-guide-folded-scenes` (the scene derives from Chapter I's and now drops its whole staging instead of naming the folded guide). Before the suite a targeted batch had already
  turned up and fixed six collateral failures (the music table and the `boss-challenge` owners, the hidden scene list, the hidden FFX stature list, the HP line set by the party, the guide's citation form) and the RE review's
  red `data-ffx-command-records`.

## Browser proof

On a production build of this tree (`vite build` with `BASE_PATH=/`, run from PowerShell: **a Git Bash shell turns a bare `/` into its own install path and builds a dist whose assets live under it**; output to a folder on
the build drive, bundle `index-DrBD3wK5.js`; `vite preview` on :5541; headless Chromium in GPU mode from node, never the built-in pane; the overnight art runner was already held by a standing pause file, left untouched; the
preview server stopped by its port afterwards). The script is `proof.mjs` in the lane's scratch folder (not committed). Every run: **zero console errors, zero 404s**.

- **Board and the word (real keys): PASS.** 18 cards, none for the chapter, "of 18 beaten", no EXP text; typing `gagazet` opens party prep for `biran-yenke` and for no other chapter (the Z opens nothing else); the six other
  hidden words (`leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`) still open their own chapters; `limit` still hands the board to FF7's battle screen, as it did before this chapter.
- **A WIN at 1600x900: PASS.** The opening's five lines; the first menu is Kimahri alone, the brothers painted (not placeholders) on `gagazet-ronso`, the guide open, HP 3,208 and 2,406 (Kimahri STR 26, MAG 22);
  **Lancet through the real menu (Special, Lancet, Enter) teaches "Kimahri learns Fire Breath" and fills the gauge** (the first-time coach tips held the menu until Enter, as in every first fight); then the shipped
  advisor line: **0:56 of battle time**, Kimahri 6 Lancet, 6 Fire Breath, 2 Hi-Potion; Biran Thunder 2, Bulldoze 4, Blizzard 2 and his half-HP Mighty Guard once; Yenke Fire Breath 3, Aqua Breath 3, Bulldoze 2 and his
  White Wind once; six Rages learned; the closing scene's three lines; **Victory: AP 9,000, Gil 3,000, Return Sphere x2** (one item a brother), Kimahri +12 S.Lv. The experiments' store holds the attempt and the clear; the
  save holds nothing of the chapter.
- **A LOSS (the plain Attack only): PASS.** Defeat in 19 turns (0:29), "FELL", RETRY and CHAPTER SELECT, "NEVER CLEARED"; Enter on RETRY goes back to party prep; the attempt is in the experiments' store.
- **A phone, 390x844 touch: PASS.** First menu (the queue strip, the first-time tip, the four command buttons), the win in 0:59 with all eight Rages learned, the closing lines and the results. The first build cropped
  Biran's mane at the right edge of this frame; he now stands 0.3 nearer the middle (2.15 to 1.85) and the whole figure fits.
- **Not exercised in a browser: Self-Destruct.** A probe using the debug API's `forceCommand` left the battle screen at its first menu (the screen waits for a menu answer that never comes), so the withdrawal panel was not
  reached; the engine's end is pinned in `biran-yenke-engine.test.ts`, and the panel is the app's existing one for `'escape'` (PR-0215).
- **Screenshots, each looked at, under `docs/screenshots/ch-biran-yenke/`:** 1600x900 `party-prep`, `intro-line-1`, `intro-line-4`, `first-menu-tip`, `first-menu`, `stage-no-hud`, `special-menu`, `lancet-cast`,
  `lancet-learned`, `closing-line-1`, `results`, `loss-first-menu`, `loss-results`, `loss-after-retry`; `board-before-the-word`, `board-party-prep-after-the-word`; 390x844 `party-prep`, `intro-line-1`, `intro-line-4`,
  `first-menu-tip`, `first-menu`, `stage-no-hud`, `one-brother-down`, `closing-line-1`, `results`.

### What the screenshots show that is not this chapter's to fix (HUD placement; reported, not changed)

- At 1600x900 the **Sensor tab** (right of the focused brother's head) lands over Biran's head: the cursor starts on Yenke, who stands left of Biran, so his tab sits on the nearer figure (`I` hides it). The same family as the
  disclosed HUD placements of other chapters.
- The advisor's first tip is "Lancet -> Biran Ronso" while the target cursor starts on Yenke: a player who presses Enter three times learns Yenke's Fire Breath first, which is as good a first lesson.
- Kimahri's HP reads 1,974 of 2,310 at the first menu in the browser: Biran, the faster brother, opened with Thunder before Kimahri's first turn on that seed (his queue entry reads "Bulldoze, 2nd"); party prep and the engine's start say 2,310.

## Open items

1. **Berserk Biran swings the engine's generic Attack** (the numbers equal Bulldoze's) **and never flips side** (the event-7 flip is not modelled). Nothing reads his side after Yenke dies (the half-HP action is
   cancelled and the defence swap needs a living partner). **The question this item used to carry, whether the game's default monster attack is Bulldoze, is answered** (the RE session's last pass): a Berserk monster's
   default attack is the forced-action word of its record, and Biran's is Bulldoze (0x60A5), so Berserk's x3/2 applies to his swing (`research/re-ffx-targeting.md` section 3 and FFX-G04 for the forced turn, FFX-H02 for the
   record's forced-action word, `research/re-ffx-damage.md` for the x3/2: it applies when the executing command is the user's default attack). The engine's generic Attack has the same numbers (formula 1, power 16) and
   already takes the x3/2 as the default attack, so nothing visible changes and there is no engine change.
2. The **Mountain Gate painting**, the **two brothers' paintings** (provisional), a yield pose for them, and the **music** are Bailey's picks. Listing the chapter on the board waits for his word.
3. **Not modelled:** the gear drop (the game gives each brother one; the engine has no gear record for it), the Steal in this build (Kimahri's preset has no Steal), the brothers' dialogue (no barks), the camera's side words.
4. **Self-Destruct** ends the fight as a withdrawal (see above), not in a browser run; a defeat is the game's "game over" in the field event's flag word. The difference is in the existing all-ejected rule, not in this chapter.
5. `data/ffx/index.ts` is at 399 lines: the next hidden chapter that adds a line there needs a fold.
6. The pause screen's hero art `pause/ch25-biran-yenke` is not made (the fallback is Kimahri's portrait).
7. **Disk:** D: had 1.1 GB free while this lane worked (it dropped about 300 MB in twelve minutes from a writer that is not this lane); every build, render and temp folder of this lane is on M:, and the 11 GB production build
   made for the proof is still there for the driver to look at or delete.

## Merge hot spots (the driver)

The parallel hidden-chapter lanes add lines in the same places: `encounters.ts`, `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, `scenes/experiment-scenes.ts`, `engine/pyreflyCanon.ts`,
`tests/unit/chapter-doors.test.ts`, `tests/unit/chapters/exp-fayth.test.ts` (the scene-row list), `tests/unit/audio-music-batch2-2026-10-12.test.ts` (the chapter table and the owners), `tests/unit/engine/party-stature-chapters.test.ts`
(the hidden FFX list), `tests/unit/data-ffx-command-records.test.ts` (three counts), `tests/unit/presenter-departures.test.ts` (the kind count), `tests/fixtures/parity/ffx/evrae-gaze-classes.json`,
`data/ffx/index.ts` (399 of 400 lines), `docs/CONTRACT-CHANGES.md` and `CHANGELOG.md`.

Tip: code, tests and data at e5a72d74; the commit that adds this file, the changelog entry, the story comment fix and the screenshots follows it and is the branch tip (`git log -1 ch-biran-yenke`).
