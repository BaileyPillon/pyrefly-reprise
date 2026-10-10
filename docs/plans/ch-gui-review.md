# Paper preflight: the hidden chapter "Sinspawn Gui" at Mushroom Rock Road (Operation Mi'ihen), with Seymour on the party's side (FFX only)

Paper preflight under `critic/RUBRIC.md` §4 and AGENTS.md rule 15 (combat core is a deep class). Written 2026-10-10 ~00:50 EDT by the chapter agent
(branch `ch-gui`, worktree `D:/pyrefly-r3942-giants-ffx`, from `origin/re-parity-rc1` 931613a8, the live build 39.4.3). **Docs only.** The research
(`D:/Tools/pyrefly-scratch/2026-10-10/new-chapters/ffx-sinspawn-gui/research.md`) and the reverse-engineering note (`D:/Tools/ffx-parity/new-chapters/ffx-sinspawn-gui/re-ffx-ai-gui.md`)
had not landed when this was written; every point that depends on them is listed in §9 and decided there when they arrive.

**Verdict: PROCEED** on the generic engine support, the hidden word, the registration and the scaffolding now; the chapter's numbers, rules and lines wait for the two
inputs (rule 6: unsourced means left out, said out loud).

## 1. Authority, game case, what "hidden" means

Bailey, 2026-10-10 (verbatim): "I'll add in those 2 chapter recommendations." Then: "i want those chapters added in over night while im sleep along with what you are working on now.
also include the reverse engineered and decompiled game mechanics please. this is really important." The driver's reading, recorded as his delegation: end state first is waived for
tonight because he asked to build now; the chapter ships **hidden behind a typed word** (the precedent is the experimental Leblanc chapter, D-507 onward) so he plays it in the morning;
listing it on the board waits for his word; the art is **provisional** (new subjects only, never replacing an approved painting).

**Game case: FFX only** (rule 14). CTB, the FFX status set and a guest party member are FFX's; FFX-2's ATB engine and FF7's engine import none of the files below, so the FFX-2 and FF7
goldens must not move. Shared plumbing touched (`types.ts`, `encounters.ts`, the chapter-select board) is case "both" and additive (CHK-020).

Nothing here needs the save: the chapter is `experimental: true` like Leblanc's preview, so attempts, clears and time go to `pyrefly-reprise:experiments:v1`
(`app/experiments/experimentRecords.ts`), never `pyrefly-reprise:save:v1`. **No save schema, no migration, no `SaveData.ts` change: the "save-data class" deep review is not triggered.**
It is no part of "N of 18", the veteran check or total play time. The review class is the combat core's (deep review after the deploy, on the live build).

## 2. What exists and is reused (read, not assumed)

| Need | What the tree already has | Where |
|---|---|---|
| Hidden typed word | `WordDoor` (any case, 2 s between letters, a wrong letter or a board key resets, `continued` leaves the word's own presses to the word) and the Leblanc door built on it | `app/screens/frontend/secretDoor.ts`, `leblancDoor.ts`, `ChapterSelectScreen.ts` (`leblancDoor`, `wordKey`, `opening`) |
| Hidden chapter registry | `experimental?: true` on `Chapter`, `EXPERIMENT_CHAPTERS` (found by `getChapter`, not in `CHAPTERS`/`CHAPTER_IDS`, so every count and chapter-generic suite stays the eighteen), `ChapterId` without `ListedChapterId` | `data/encounters.ts` |
| The experiment flow | prep, scene, entry, chain, results, retry through the standard flow with `experimentProgress` in place of the save | `app/screens/BattleScreenFlow.ts`, `app/experiments/*` |
| Pause record | `UNLISTED_CHAPTER_META` | `data/chapter-meta.ts` |
| AI | `registerAiScript` (turn), `registerScriptHooks` (`preTurn`, `onTargeted`, `onHit`, `postPoison`), the reaction queue, the game's random streams (`script-random.ts`, `game-rolls.ts`), `slot-pair.ts`, `mount-revive.ts` | `battle/ffx/ai/*` |
| Multi-part bosses | `EnemyGroupDef.enemies` + `parts`, `flags.isPart` / `partOf`, a battle that ends when the non-part enemy falls (`engine-end.ts#checkEnd`), parts with their own slot, art and Sensor line (Chapter III's pagodas, Sin's Fins and Genais) | `data/ffx/enemies/*`, `battle/ffx/engine-end.ts` |
| Party-side AI | **none.** `Combatant.controller` exists and `execute.ts#actsAutomatically` already sends an `'ai'` actor to `chooseAiCommand`, but `memberToCombatant` hard-codes `'player'` and `ai/index.ts#activeScriptId` reads only `self.enemy`. A party-side `'ai'` actor would fall into the *fallback* (a plain Attack at `livingFriendlies`, i.e. its own side) | `battle/ffx/setup.ts`, `ai/index.ts` |
| Scene, plate, stage | `SceneFactory` per location, `SCENES` / `SCENE_FACTORIES`, `ScenePalettes`, `pyreflyCanon`, plate-rooms; a **provisional plate** precedent (Chapter XVI's `djose-chamber`) | `src/scenes/*`, `engine/fx/*` |

## 3. The guest party member (Seymour)

**Shape (additive, FFX only).** `FFXMemberBuild.guest?: { control: 'player' | 'ai'; aiScriptId?: string; ... }`, copied onto the combatant as `FFXCombatant.guest`. A guest is an
ordinary party-side combatant in `activeSlots` (so every surface that lists `activeIds` already draws him: the HUD rows, the CTB list, the stage slot, the pause meters, the advisor's
targets), with four differences and no others:

1. **Who takes his turn.** `control: 'player'` is the existing path (a command menu from his own `learnedAbilityIds`); `'ai'` sets `controller: 'ai'` and a registered script id read by
   `activeScriptId` / `scriptIdOf` for a combatant with no `enemy` block. Its opponents are `opponentsOf` (already side-aware: a party-side actor's are `livingEnemies`), never the
   fallback's `livingFriendlies`. Which of the two is the game's is **the RE note's answer** (§9 Q1); the engine supports both so the data decides, not the code.
2. **He is not the player's to lose.** `checkEnd`'s party-wipe test counts the standing members *without* guests unless the data says otherwise (`keepsPartyAlive`, default false);
   a KO'd guest is not a defeat. (§9 Q3 settles the game's rule.)
3. **No rewards, no bench.** He earns no AP and has no row on the results panel; he is never in `reserve`, so he can neither be switched in nor out (Switch swaps the *acting* member with a
   reserve member, and an AI guest never opens a menu).
4. **He is named on screen as a guest** only where a screen would otherwise mislead (the prep roster). No new chrome: a one-word tag on the prep row, nothing in battle.

Not in scope unless the data forces it: a **fourth** party-side body. The scene and the FFX HUD are laid for three; the game's forced party for this fight (the formation's
`forced_party` field) decides whether the guest takes the third slot or stands beside three players (§9 Q2). A fourth body would be a presentation change (scene slot, HUD row) and is
named as a risk, not built on a guess.

**Determinism and layering (rule 1).** Everything above is `src/battle/**` and `src/data/**`: no DOM, no `three`, seeded RNG only. The guest's script draws from the same game streams the
bosses' scripts do, in the order the game's script does (so a replay of seed S is stable).

## 4. The multi-part boss (Gui)

Built from the **formation and monster rows** in the RE note (how many bodies Gui has, which one ends the fight, what each part's HP, defences, immunities, drops, steals and
element are, which parts can be targeted, what dies with what). The engine already ends a battle when the non-part enemies fall (`checkEnd`) and already models a part that goes
down while the body lives (`isPart`, `hidden`, `untargetable`, `reviveRule`). If the game's rule is different (for example the body ending the fight only after a part is gone),
that rule is a kernel in `ai/gui-rules.ts` driven by hooks, not a new engine branch. Parts get their own slot, Sensor/Scan words (our own), art subject and stature entry
(`data/ffx/fiend-stature.ts`) so the framing rules keep nobody nearer the party than they allow.

## 5. The hidden word

`'mushroom'`: eight letters, a third `WordDoor` beside Leblanc's (`frontend/mushroomDoor.ts` mirrors `leblancDoor.ts`: one constant for the word, one for the chapter). The board has no
card. Checked against the keyboard map (`app/Input.ts`): M and V are `select`, S is `down`, R is `r1`, the rest are unbound; the board ignores `select`/`r1`, and `wordKey`
already consumes `down` while a word's later letter is typed (the A of "leblanc" is `left`). The last letter is **M = select**, which party prep must not see: the existing
`opening` frame consumes every button before the door opens (F393-03), so the same path is used. No word may begin another (a unit test pins `limit`, `leblanc`, `mushroom`: none is
a prefix of another). `wordKey` becomes "any door's word just continued". The unlock is not remembered, as for Leblanc.

## 6. The chapter itself (files, in the order they are built)

| Piece | Files (new unless named) | Notes |
|---|---|---|
| Guest + generic engine | `battle/common/types.ts` (additive: `FFXMemberBuild.guest`, `FFXCombatant.guest`), `battle/ffx/setup.ts`, `ai/index.ts`, `ai/hooks.ts` (`scriptIdOf`), `engine-end.ts` (wipe test), `tests/unit/ffx-guest-member.test.ts` | contract file: an entry in `docs/CONTRACT-CHANGES.md` |
| Data | `data/ffx/enemies/sinspawn-gui.ts` + `-abilities.ts`, `data/ffx/builds/mushroom-rock.ts` (party and Seymour), `data/ffx/index.ts` | numbers from the RE note and `research.md`, each cited; the party's stats are an `[estimate]` unless a source gives them |
| AI | `battle/ffx/ai/sinspawn-gui.ts` + `-rules.ts` (the game's script as rule tables and hooks), the guest's script | facts only, no decompiled code |
| Registration | `data/chapter-sinspawn-gui.ts` (`experimental: true`), `encounters.ts` (`ChapterId`, `EXPERIMENT_CHAPTERS`), `chapter-meta-sinspawn-gui.ts` (+ `UNLISTED_CHAPTER_META`), `app/screens/frontend/mushroomDoor.ts`, `ChapterSelectScreen.ts`, the numeral `EXP` | mirrors Leblanc's wiring |
| Story | `story/scripts/sinspawn-gui.ts`, `story/registry.ts` | intro and outro in the writing bible's voice, no verbatim game lines |
| Scene | `scenes/mushroom-rock-road.ts`, `scenes/index.ts`, `ScenePalettes`, `fx` rows | on a **provisional** plate |
| Music | an existing cue (`docs/audio/THEMES.md` cue map) | no new audio, no new `MusicKey` |
| Advisor + guide | `engine/tactics/sinspawn-gui.ts`, `data/guides/sinspawn-gui.ts` (+ docs), cited to Jegged (`research/jegged-encounter-guides-ffx-*.md`) | the line the e2e plays |
| Art | `public/art/characters/<new subjects>/`, `public/art/backdrops/mushroom-rock-road*`, registration rows | new folders only; stand-ins from approved art, labelled, if the run is late |

## 7. Risks and how each is closed

| # | Risk | Closure |
|---|---|---|
| R1 | A guest in `activeIds` changes a surface that assumed three *player* members (results rows, AP split, prep, pause, `TurnCutIn` "CTB n OF m", the advisor's revive/roster code) | read each of the 55 `activeIds` readers in `src/ui`, `src/app`, `src/engine`; add a guest-aware test for the ones that count or reward (results, AP), leave the rest; the guest flag is the only branch |
| R2 | The engine change moves a number in another chapter | every change is gated on `guest` (absent everywhere else); `ffx-engine-golden` (all 18 FFX digests), the FFX-2 and FF7 goldens and the 500-seed tables run unchanged |
| R3 | A party-side AI script is read as an enemy script (`enemy` block missing: crashes in code that assumes `self.enemy`) | grep every `.enemy!` / `.enemy?` reader reachable from `chooseAiCommand` and the hooks; unit test the guest through a whole battle |
| R4 | The fight is unwinnable or trivial because the party's stats are an estimate | the boss and Seymour use the game's numbers untouched; only the party estimate may move, inside the research's bounds, and it is measured (200 seeds, intended line and a naive line) before it is called done; **the boss is never tuned** |
| R5 | A fourth party-side body is needed | §3: decided from the data; if needed the chapter ships with the third slot and the gap is listed |
| R6 | The hidden word collides with a board key or with another door | §5; a test pins prefixes; a real-key e2e types it |
| R7 | The art is late or poor | stand-ins from approved art (Seymour = `seymour-macalania`; a labelled placeholder for Gui's bodies), declared provisional in the registration and the handoff; the chapter plays without it |
| R8 | The shared tree: nobody else is in this worktree; `public/art` is a junction to the release art | new subject folders only; nothing under an existing subject; no build, no copy of the tree |
| R9 | Sparse set lacks a file | widen with `git sparse-checkout add` |

## 8. Proof plan

1. `node node_modules/typescript/bin/tsc --noEmit` clean after each piece (3 s on this tree).
2. Unit: the guest (`ffx-guest-member.test.ts`: setup, control both ways, wipe rule, no rewards, determinism of a seeded run), the door (`mushroom-door.test.ts` plus the existing
   `ff7-secret-door` / Leblanc door suites), the data (`sinspawn-gui-data.test.ts`: every stat cell cites the note, abilities resolve, drops resolve), the AI (rule tables against the
   note's rows, branch by branch), the chapter record, the pause meta, the registry counts (still eighteen), the story, the guide.
3. Regression: `ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`, the chapter suites that import `setup.ts`; then the full suite once at the end
   (`--testTimeout=60000 --maxWorkers=4`).
4. Bench: the advisor's line and a naive line over 200 seeds, to show a win is reachable and the fight is neither a walkover nor a wall (reported, not tuned).
5. Real input: a headless Playwright run on a dev server (one server, stopped after): title, board, the word typed, party prep stays up until Enter, the scene, the fight by
   keys with the advisor's line to a win, results; screenshots at 1600x900 and 390x844 (few: D: has 2.9 GB).
6. `node tools/orphans.mjs` after the new modules (rule 4).

## 9. Open points that the inputs settle (decided when they land; this section is updated in place)

| # | Question | Source |
|---|---|---|
| Q1 | Is Seymour player-controlled or the game's AI? His stats, command list, Overdrive (Requiem?) or summon (Anima in play?) | RE note (guest rows, command table) |
| Q2 | The forced party for this fight and its slot order (three bodies including Seymour, or three plus him) | RE note (formation `forced_party`) |
| Q3 | Does a KO'd Seymour matter to the game's loss rule? Does the battle end if every *player* member falls while he stands? | RE note; `research.md` |
| Q4 | Gui's bodies and parts: rows, HP, defences, immunities, elements, drops, steals; which one ends the fight; the hooks that run | RE note |
| Q5 | Which music plays at Mushroom Rock Road in the game, and which existing cue of ours fits (no new audio) | `research.md`, `docs/audio/THEMES.md` |
| Q6 | The party's stats at this point (no source gives them in earlier chapters either) | `research.md`; else an `[estimate]` bounded by the nearest earlier build |
| Q7 | The staging and presentation concept | the driver's pick from `concepts.md` |

### 9.1 Answers, 2026-10-10 (the inputs landed: `research/re-ffx-ai-gui.md`, `research/ffx-sinspawn-gui.md`, the driver's concept pick)

| # | Answer | Where it is built |
|---|---|---|
| Q1 | **Player-controlled, no Anima.** The field event adds him as a normal party member (actor 7); no script gives him AI, a forced command or a line. Row 7 of the party table: HP 1,200, MP 999, 20 / 25 / 35 / 100 / AGI 20 / LCK 18; a staff with Piercing and an armour with Sensor; Overdrive **Requiem** (Stoic, gauge 0 to 100; magic, power 40, all enemies); no summon. RE 7.1 to 7.5. | `FFXGuestSpec { control: 'player', keepsPartyAlive: true }`, `data/ffx/builds/seymour-guest.ts`, `abilities/overdrive-seymour.ts` |
| Q2 | **Fight 2 only: Yuna (slot 1), Seymour (2), Auron (3), Switch disabled**; fight 1 is the player's own three of the six with Switch open. RE 2.1. | `EnemyGroupDef.lineUp` (`joins`, `activeSlots`, `noSwitch`), `battle/ffx/line-up.ts` |
| Q3 | **Seymour counts like any member**: nothing in the death handler special-cases him; the battle is lost only when Yuna, Seymour and Auron are all at 0. RE 7.1, G-02. (The first build did not hold the loss open for him; `tests/unit/chapters/sinspawn-gui-rules.test.ts` caught it and `keepsPartyAlive: true` fixes it.) | `engine-end.ts#checkEnd` reads `guest.keepsPartyAlive` |
| Q4 | **Four parts, one boss**: body (12,000 / 6,000 HP), head (4,000 / 1,000, out of melee reach), two Armored arms (800, no turns, regrow). Only the body has to fall. Immunities, drops and steals are RE 3.1 to 3.3; the hooks are RE 5. | `data/ffx/enemies/sinspawn-gui*.ts`, `battle/ffx/ai/sinspawn-gui*.ts` |
| Q5 | **Existing cues only**: the dread theme for the Ridge, Seymour's own for the guest hour (the game's "Peril" and "Challenge" are named by role in `docs/audio/THEMES.md`, owed). | `chapter-sinspawn-gui.ts`, `THEMES.md` |
| Q6 | **An estimate, labelled everywhere**: the floor of the midpoint of the game's start-of-game record and Macalania's preset, per stat. Kits are what the cited guides name for this fight. Not in the guide's numbers. A real save at Mushroom Rock Road read in the emulator would source it. | `data/ffx/builds/mushroom-rock.ts` |
| Q7 | **Concept A, "Two Rounds on the Ridge"**, in slices (link 2 first, then link 1); the seam is a white-out and three plain lines of Tidus (no beam in real time); the arms' AP and gil farm is kept and never mentioned; no Anima; link 1's party prep is the player's three of six. | `story/scripts/sinspawn-gui.ts`, `chapter-sinspawn-gui.ts` |
