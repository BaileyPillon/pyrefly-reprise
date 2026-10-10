# Handoff: the hidden Sinspawn Gui chapter (Mushroom Rock Road), branch `ch-gui`

**Game case: FFX only.** No FFX-2 or FF7 file reads anything below (the three goldens, `ffx-engine-golden` with its 18 digests, `ffx2-atb-golden` and `ff7-golden`, are unchanged).
Built overnight 2026-10-10 from `re-parity-rc1` 931613a8 (the live build 39.4.3) on Bailey's words "I'll add in those 2 chapter recommendations" and "i want those chapters added in over night while im sleep ...
also include the reverse engineered and decompiled game mechanics please. this is really important." The driver's reading of them (recorded as his delegation): the chapter ships **hidden** behind a typed word,
its art is **provisional** (new subjects only, never replacing an approved painting), end state first is waived for the night, and his concept pick is **A, "Two Rounds on the Ridge"**.
Plan and answers: [ch-gui-review](../plans/ch-gui-review.md) (section 9.1). Research: [ffx-sinspawn-gui](../../research/ffx-sinspawn-gui.md) and [re-ffx-ai-gui](../../research/re-ffx-ai-gui.md) ("RE n").

## What exists

Type `mushroom` on the chapter board (the board has no card for it and "of 18" stays the eighteen). The chapter is one chain of two fights:

1. **The Ridge, with the player's own three of six** (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu; Switch open; no Rikku, no Anima): Sinspawn Gui, four parts. The body (12,000 HP) is the only part that has to fall. The head
   (4,000, out of melee reach) runs a three-turn cycle through the body: Thunder, a turn where it shakes (a telegraph the player can read), Venom; **a hit that does damage while it shakes puts the cycle back and the Venom never comes**.
   The two arms (800 each, Armored, no turns) shield the body from every physical command while one stands (spells, Overdrives, Lancet pass), and grow back together on the body's 3rd or 4th turn once both are down; every death of a part pays again.
   The body goes Attack, Attack, Demi and then alternates, faster once it is under a third of its HP.
2. **A seam**: a white-out and three plain lines of Tidus (Concept A: no beam in real time), fired on the first body's KO.
3. **The guest hour, Yuna, Seymour and Auron** (Switch off, no bench; HP and MP carried): the weaker rematch on the ruined plate (body 6,000, head 1,000, Strength 15, Demi from the first turn) with **Seymour as a guest the player
   commands**: his own Black Magic and Cure lists, his Overdrive **Requiem**, a Stoic gauge that starts empty. He holds the loss open like any member (the game loses only when all three are down), earns nothing and has no results row.
4. **One results screen** pays both fights (both bodies' gil, AP, Key Spheres, a row for everyone who fought in either). Fight 2 is the retry checkpoint; a retry that opens with fewer than two of the three standing restores them.

Scenes before and after (ten lines, nine lines), the strategy guide's card and page, the advisor's line, the Sensor lines, the pause metadata and the music are all in. Music uses **existing cues only** (the dread theme, Seymour's own; the game's "Peril" and
"Challenge" are owed by role in `docs/audio/THEMES.md`).

## What is an estimate, and what is the game's

- **The game's own, from the reverse engineering (RE):** every number of the three monsters and both formations, the two scripts' rules, the command rows, Seymour's party-table row, Requiem and the Stoic rule, the loot rows, the two fights' launch settings.
  Pinned by `tests/unit/chapters/sinspawn-gui-data.test.ts` and `-rules.test.ts`. **The boss was never tuned.**
- **An ESTIMATE (research Q-14, RE section 11 item 9: player data, not in the game's files):** the party at the Ridge. Each Sphere Grid stat is the floor of the midpoint between the game's start-of-game record (`ply_save` rows 0 to 5) and the Macalania preset
  (`data/ffx/builds/mushroom-rock.ts`; its header and a code comment say so, and a test pins the method). The kits are what the cited guides name (Tidus Haste and Cheer, Lulu the four tier-one spells, Yuna Cure and Esuna, Auron's Breaks, Kimahri Lancet).
  The guide card and page quote **no number of the party**. If the fight reads too hard or too easy, the party estimate is what moves, inside its stated range, and the move is recorded. **Morning option for Bailey:** a real save at Mushroom Rock Road read in
  the emulator (the PCSX2 lane's method) would source it.
- **Departures from the RE note, found by running the engine** (each is written where it applies): (1) **Requiem on an Armored arm is not reduced**: the note reads the missing piercing flag as "an arm takes a third", but the game's own Armored rule
  also exempts a user with Pierce (`kernel/modifiers.ts#armoredMod`) and Seymour's staff carries Piercing, so the engine, which runs that rule, lands the whole blow. (2) **Kimahri's Lancet does damage to the head** (it drains HP), so it counts as the hit that stops the Venom;
  a Scan, which reaches it and does nothing, does not. (3) **Seymour's Stoic gauge gains `floor(damage x 30 / max HP) + 1`** a monster hit (the game's count, RE 7.4) while every other character keeps the engine's older model, because the kernel that has the "+1"
  (`kernel/overdrive-hooks.ts`) is not wired and wiring it would move every chapter's gauge; the guest-only branch is in `overdrive.ts#onDamageTaken`.
- **Not modelled, so not promised (nothing in the guide mentions any):** the equipment piece the second body drops (a weapon with Sleepstrike or Piercing, or armour with Sleepproof); Tough and Heavy on the body; the four Distiller immunities of the
  head and arms; Slice immunity; the game's own Overkill rule for the six Key Spheres (the engine's rule is its own and the guide never claims "558 HP"); Anima and Yuna's Summon in the guest hour end to end (the formation does not disable it; RE Q-15 B);
  the results panel's banking rule (RE Q-6 is partial: both fights are pooled on one screen, GameFAQs, single source); Gui's in-battle size (RE Q-13 not read: the figures are an estimate for the framing).
- **Concept A's defaults the driver set:** the arms' AP and gil farm is kept and never mentioned; no Anima; link 1's party prep is the player's own three of six; existing camera rigs (D-318 not adopted).

## Numbers (200 seeds, real engine, the Ridge party estimate; `tests/unit/chapters/sinspawn-gui-bench.test.ts`)

| Line | Chain won | Fight 2 won (of those that reach it) |
|---|---|---|
| the shipped advisor line (`src/engine/tactics/sinspawn-gui.ts`) | 196/200 (98 %) | 196/196 |
| the same without Auron's Power Break | 116/200 (58 %) | 116/116 |
| Attack only | 0/200 | none reached |

**By line-up (40 seeds each, the same advisor line, every three of the six; first-fight openers):** the line is built around Auron's Power Break, so the default three (Tidus, Auron, Lulu) is the best of the twenty at 39/40; the rest of the Auron line-ups
win 38/40 (Tidus, Auron, Wakka), 37/40 (Yuna, Auron, Lulu), 31/40 (Tidus, Yuna, Auron), 28/40 (Yuna, Auron, Wakka); line-ups without him win from 26/40 (Tidus, Wakka, Lulu) down to none (Yuna, Kimahri and Wakka; Kimahri's line-ups are the weakest on this
estimate). A rule that switches Auron in when he is not on the field helped some (Tidus, Yuna, Lulu 8/40 to 40/40) and hurt others (Tidus, Wakka, Lulu 26/40 to 12/40), so it was **not** adopted; the chapter's tip and the guide's page tell the player to bring him.
Every line-up reaches an outcome (no stall). The party estimate is behind every one of these numbers.

The one lever the game's own rows hand the player is **Power Break**: it lands on the body only (RE 3.2) and halves its Attack (`research/ffx-combat-core.md` 2.10). The guide's page carries it as the one addition to the encounter guide's plan, marked in the file header.

## Where things are (new files are all under `ch-gui`; shared files touched are listed with the reason)

- Engine: `battle/ffx/line-up.ts` (the per-link line-up, the retry restore), `ai/sinspawn-gui.ts` and `ai/sinspawn-gui-rules.ts` (the game's three monster scripts), `setup.ts`, `commands.ts`, `execute.ts`, `targeting.ts` (BattleDistance reach),
  `statuses.ts` (a Slow with duration 0), `results.ts` (banked rewards), `turnQueue.ts` and `ai/script-random.ts` (Seymour is actor 7), `overdrive.ts` (the guest's Stoic count), `engine-end.ts` (the guest in the loss rule).
- Data: `data/ffx/enemies/sinspawn-gui*.ts`, `builds/mushroom-rock.ts` (the estimate), `builds/seymour-guest.ts`, `abilities/overdrive-seymour.ts`, `command-records/*`, `items/spheres.ts` (Lv. 1 Key Sphere), `sinspawn-gui-ids.ts`,
  `chapter-sinspawn-gui.ts`, `chapter-meta-sinspawn-gui.ts`, `encounters.ts` (the id, number 21, the experiments' list).
- Presentation: `scenes/mushroom-rock-road.ts` (and `scenes/index.ts`, `scenes/types.ts`: the optional `swapBackdrop`), `app/screens/BattleScreen.ts` (a link on another plate: one pulse and the swap), `engine/pyreflyCanon.ts`,
  `story/scripts/sinspawn-gui.ts` (not in `story/registry.ts`, like the Experiment's), `engine/tactics/sinspawn-gui.ts` (+ `index.ts`, `lookup.ts`), `data/guides/sinspawn-gui.ts` and `docs/sinspawn-gui.ts` (+ the two indexes).
- App: `app/screens/frontend/mushroomDoor.ts` and `ChapterSelectScreen.ts` (the third typed word), `BattleChainCheckpoint.ts` (`standingIn` knows the line-up), `BattleChainSpoils.ts` (pooling per member), `BattleEncounterChain.ts`.
- Contract files changed, all additive: `battle/common/types.ts` (see `docs/CONTRACT-CHANGES.md`, 2026-10-10), `data/encounters.ts`.
- Tools: `tools/gui-smoke.mjs` (the real-key browser run), `tools/gui-art-install.mjs` (the art, below).
- Tests: `tests/unit/chapters/sinspawn-gui-{data,rules,flow,story,bench}.test.ts`, `helpers/guiUnits.ts`, `helpers/guiBench.ts`, `ffx-guest-member.test.ts`, `mushroom-door.test.ts`, `chapter-numbers.test.ts`; touched on purpose:
  `trema-hopeless-retry` (the rule is now also named by `sinspawn-gui-2`), `strategy-guide` (the length line counts the listed chapters, the Experiment lane's hunk byte for byte), `party-stature-chapters`, four lines of `exp-leblanc*.test.ts`.

## The art (provisional; none is in git: `public/art` is gitignored)

The overnight art run's picks (`F:/pyrefly-overnight-art/2026-10-10/new-chapters-picks.md`; newer renders under `D:/pyrefly-overnight-art/2026-10-10/`) are installed by **`node tools/gui-art-install.mjs [--dest public/art] [--dry-run] [--list]`** into NEW folders only:
`characters/sinspawn-gui`, `-2`, `-head`, `-head-2`, `-arm-left`, `-arm-right`, and `backdrops/mushroom-rock-road` (the camp) and `mushroom-rock-road-ruined`. Every picture is cut with its run's own matte, its painted ground shadow taken out, and framed with the house 16 px margin;
a file that already stands there is copied to `<real art folder>-replaced/` first, never overwritten in place. It regenerates the manifest. **For the release tree: run it with `--dest` the release `public/art` (or copy the new folders and run `node tools/gen/manifest.mjs`).**
Seymour stands on the party side as his approved Macalania painting (`seymour-macalania`; it faces left and the stage mirrors it); his `attack`, `item` and `victory` poses fall back to the idle until the run's renders are picked and added to the table.
The staging is an estimate for the framing (`scenes/mushroom-rock-road.ts`: the body 4.4 m, the head 3.6, the arms 3.3 against the party's 1.75).

## Proof

`npx tsc --noEmit` clean; the new and affected unit files pass (the story, data, rules, flow and bench files above, the three goldens, the guide and registry suites); `node tools/orphans.mjs` lists none of the new modules; the full suite once at the end
(`npm test -- --testTimeout=60000 --maxWorkers=4`). In a real browser (headless Chromium, real GPU, real keys then the advisor's line, `tools/gui-smoke.mjs`): the typed word, party prep that holds, the pre scene, the four parts, a real-key Attack, the head's
warning, the arms down and grown back, the seam, the guest hour's first menu, the post scene and the results; screenshots under `docs/screenshots/ch-gui/` (1600x900 and 390x844).

## Open, in the order they matter

1. **The party estimate** (above): Bailey's call, or a real save.
2. The second fight's art is the first body's cracked variant; Seymour's three missing poses; the seam has no painted stills (the battle's cutscene ports have no backdrop step; the white-out stands in).
3. **The Guest slab** (a banner when Seymour joins) is not built; the pre and post scenes and the guide carry him. Cut before a link, as ordered.
4. The RE note's Requiem line, the Lancet line and the Stoic count (above) are corrections for the note's next revision.
5. Listing the chapter on the board is the driver's word, not this branch's.

## Merging with the Experiment lane (`ch-experiment`, 8f268b17)

A trial merge (`git merge-tree`) of this branch with `origin/ch-experiment` reports four textual conflicts, all of the "both added a line in the same place" kind, and nothing else (the guide and docs indexes, `tactics/index.ts`, `lookup.ts`, `BattleEncounterChain.ts`,
`types.ts` and `scenes/index.ts` merge on their own). Keep both sides in each:

- `src/data/encounters.ts`: both imports (`FFX2_EXPERIMENT`, `SINSPAWN_GUI`); `ListedChapterId` excludes `'ff7-guard-scorpion' | 'exp-leblanc' | 'ffx2-masterpiece-theatre' | 'sinspawn-gui'`; the `number` union keeps 19, 20 (theirs) and 21 (ours);
  `EXPERIMENT_CHAPTERS = [experimentalLeblanc(FFX2_LEBLANC), FFX2_EXPERIMENT, SINSPAWN_GUI]`.
- `src/data/chapter-meta.ts`: both imports; `UNLISTED_CHAPTER_META = [EXP_LEBLANC_META, EXPERIMENT_META, SINSPAWN_GUI_META]`.
- `src/app/screens/ChapterSelectScreen.ts`: three typed-word doors besides FF7's: `leblancDoor`, `mushroomDoor` and `experimentDoor`, each fed in `onKey` and reset in the same place; `wordKey` is `leblancDoor.continued || mushroomDoor.continued || experimentDoor.continued`.
  No word may begin with, end with or contain another (limit, leblanc, mushroom, experiment): they do not.
- `docs/CONTRACT-CHANGES.md`: both new entries stay, newest first.

`tests/unit/strategy-guide.test.ts` carries the Experiment lane's hunk byte for byte (the same change in both branches merges clean). After the merge run `tests/unit/chapter-numbers.test.ts` (19, 20 and 21 must stay unique), `mushroom-door.test.ts`, the Experiment's door test and `exp-leblanc-door.test.ts`
(four words on one board), then the full suite.
