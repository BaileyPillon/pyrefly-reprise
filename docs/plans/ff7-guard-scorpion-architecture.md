# FF7 slice: Guard Scorpion, hidden experiment (architecture, paper only)

Written 2026-09-27 for the driver. Nothing here is built. It is the plan and the
paper preflight for a **new engine** (critic-plan classes it DEEP, see section 7).

**Bailey, 2026-09-27 ~00:35 EDT, verbatim:** "go with guard scorpion first, full
speed ahead, but make it a hidden selectable encounter since it's experimental
then tell me how to select it. dont make it so obvious on the encounter/chapter menu"

**Game case (AGENTS.md rule 14): FF7 only**, plus the shared plumbing it has to
touch (contracts, battle screen, board, flow), which is "both" for FFX and FFX-2 in
the sense of CHK-020: those two games must come out of it byte-identical. The rule
needs a third case now; `critic/policy.json` has no `ff7` game yet (a driver to-do,
section 7, because this plan must not edit `critic/`).

**Sources.** `docs/plans/next-content-2026-09-27.md` had not landed when this was
written; nothing below depends on it. There is **no FF7 research in `research/` yet**,
so this document contains no FF7 numbers at all (rule 6). Every number the engine
needs is listed in section 1.6 as a question the research file must answer, with its
source, before the data module that uses it is written.

---

## 0. Decisions in one screen

| Question | Recommendation |
|---|---|
| Where the engine lives | `src/battle/ff7/`, a third pure engine on `src/battle/common`, implementing the same `BattleEngine` facade plus the ATB methods the presenter already duck-types (`tick`, `gaugeSnapshot`, `inputValid`). No code shared with `src/battle/ffx2` beyond `common/`. |
| How it is registered | A `Chapter` record in `UNLISTED_CHAPTERS` with `game: 'ff7'`, `number: 0`, `experimental: true`. `getChapter` and `__pyrefly.gotoChapter` find it; `CHAPTERS`, `CHAPTER_IDS`, the board, the strip, the briefing and every chapter-generic suite do not. |
| **Secret access (recommended)** | **On chapter select, type L-I-M-I-T. On a phone or with a mouse, tap the small "Chapter select" label at the top seven times.** No card, no hint, no change to the board, before or after. |
| Save | Its own localStorage key, `pyrefly-reprise:experiments:v1`, through a new `src/app/experiments/` module. `SaveData.ts` and the main save key `pyrefly-reprise:save:v1` are never written by this fight (keeps it out of the save-data class and out of every progress count). |
| RETRY / return | No prep screen. Defeat panel offers RETRY (straight back in, new seed) and back to the board. Victory shows results, then the board, with the cursor where it was and no trace of the fight. Pause QUIT returns to the board. |
| Critic | Experimental: outside the 15-chapter milestone and the score unless Bailey says otherwise. It still owes the deep review for a new engine, after the deploy (not before: it is not save-data). Any regression in the 15 chapters blocks the deploy as usual. |
| The look | Not decided here. HUD, scene, character art, the success flash, and music each go to an options round (rule 9, rule 13). Until Bailey picks, the fight runs on the painted loader's grey silhouettes and a stand-in HUD that never ships. |

---

## 1. The engine: `src/battle/ff7/`

### 1.1 What is shared and what is FF7's own

Reused as is (no edits):

- `common/rng.ts` (`SeededRng`): the only randomness. Draw order is fixed per step; a
  new roll goes at the end of its step (CONTRACTS.md, engine agents).
- `common/clone.ts`, `common/aim.ts`, `common/intentTargets.ts` where their target
  rules fit (single, all enemies, all party, random living).
- The playback protocol exactly as written in `docs/CONTRACTS.md`: `nextDecision()`
  pure for `player-input` and `battle-over`, `resolved` and `waiting` advance, every
  event numbered by `seq`, events are JSON data, healing through the damage chain is
  a negative `damage`.
- The `waiting` decision and `tick(ms, { throughInput })`: the presenter already
  drives any engine that has `tick`, `gaugeSnapshot` and `inputValid`
  (`BattlePresenterUtil.ts:28-32`, `BattlePresenterActive.ts:137`), so FF7's real-time
  ATB rides the FFX-2 path in the presenter with no presenter change.
- `AtbSnapshot` for the bars (fill 0 to 1, ready, charge `null`, state). FF7 has no
  charge bar; the field stays `null`.
- Existing events where the meaning is the same: `turn-start`, `action-start`,
  `action-end`, `damage`, `heal`, `miss`, `mp-damage`, `ko`, `revive`, `message`,
  `counter` (Tail Laser is a counter), `form-change` (the tail raised and lowered is
  modelled as two forms, so the presenter's pose swap plays it), `sensor` (Scan, if
  the party has it at that point), `victory`, `defeat`, `camera`, `vfx`, `sfx`, `wait`.

FF7's own (rule "do not share status logic between games", CONTRACTS.md):

- **Formulas**: FF7's physical and magical damage chains, random variance, critical,
  hit and evade, elemental multipliers, the damage cap, row modifiers, Defend.
- **ATB**: FF7's fill model from Dexterity, its Battle Speed setting, its three modes
  (Active, Recommended, Wait), and its **command queue** (a chosen command waits its
  turn while another action plays; FF7 executes queued actions in order).
- **Limit**: the Limit gauge, filled by damage taken, the Limit level, and the Limit
  command that **replaces Attack** while the gauge is full.
- **Materia**: slots and links on weapon and armour; the Magic command's spell list and
  the stat changes come from equipped materia, not from a character's own list.
- **Rows**: front and back row per character, and long-range weapons that ignore it.
- **Enemy AI in FF7's own shape**: a main script plus counter sections (FF7's enemy
  scripts are sectioned; the research must say which section Tail Laser lives in and
  exactly what triggers it).

### 1.2 Module list (every file under 400 lines)

| File | Owns | Budget |
|---|---|---|
| `src/battle/ff7/index.ts` | Public surface: `Ff7Engine`, `makeFf7Engine`, option and registry types. | ~60 |
| `src/battle/ff7/engine.ts` | The facade: `init`, `nextDecision`, `submit`, `tick`, `gaugeSnapshot`, `inputValid`, `state`, `setSeed`, `setAtbMode`, `setBattleSpeed`. Delegates everything. | ~300 |
| `src/battle/ff7/internal.ts` | Engine-private types: `Ff7Unit`, `Emit`, `EventDraft`, registries, `AiContext`. | ~200 |
| `src/battle/ff7/log.ts` | `emit()` with `seq`, the log, JSON-safety guard. (Same pattern as the FFX-2 engine; copied, not imported, so FFX-2 stays untouched.) | ~60 |
| `src/battle/ff7/setup.ts` | Builds `Ff7Combatant`s from `Ff7PartyBuild` and the enemy group: derived stats, materia effects, rows, starting gauges. | ~250 |
| `src/battle/ff7/stats.ts` | Derived stats (attack, defense, magic attack, magic defense, hit, evade and their percentages) from base stats + equipment + materia, per research. | ~200 |
| `src/battle/ff7/atb.ts` | Fill per unit per ms from Dexterity and Battle Speed; the three modes; when the clock holds under a menu. Pure functions + state step. | ~250 |
| `src/battle/ff7/queue.ts` | The command queue: order, what happens to a queued command whose actor or target died, counters jumping the queue (per research). | ~180 |
| `src/battle/ff7/formulas.ts` | Physical, magical, healing damage; variance; critical; row; Defend; elements; cap. One exported function per research subsection so each has one test. | ~350 |
| `src/battle/ff7/hit.ts` | Physical hit and evade, magic hit, the rolls in fixed order. | ~150 |
| `src/battle/ff7/limit.ts` | Gauge fill from damage taken, level, readiness, reset on use; the `limit-gauge` event. | ~150 |
| `src/battle/ff7/materia.ts` | Slot and link model; which commands and spells materia grants; MP costs; stat changes. Slice subset: only the materia the party holds at the Sector 1 reactor. | ~250 |
| `src/battle/ff7/commands.ts` | `AvailableCommand[]` per actor: Attack (or Limit when full), Magic (with submenu from materia), Item; `enabled` and `disabledReason` computed here, never in the UI. | ~250 |
| `src/battle/ff7/resolve.ts` | Executes one queued action into events: targets, rolls, damage, KO, then counters, then triggers. | ~350 |
| `src/battle/ff7/counters.ts` | Enemy counter sections: when a counter fires, what it targets, whether it queues or interrupts. | ~150 |
| `src/battle/ff7/results.ts` | `BattleResult`: EXP, AP, gil, drops, turn count, time. | ~120 |
| `src/battle/ff7/ai/index.ts` | AI script registry keyed by `aiScriptId`. | ~40 |
| `src/battle/ff7/ai/guard-scorpion.ts` | The boss script, transcribed from research: its opening, its targeting pattern, raising and lowering the tail, the tail-up counter. | ~200 |
| `src/battle/ff7/simulate.ts` | Headless auto-battle for tests and the bench: named strategies, fixed seed, zero decision time. | ~250 |

### 1.3 Contract changes (all additive; one entry in `docs/CONTRACT-CHANGES.md`)

1. `GameId = 'ffx' | 'ffx2' | 'ff7'` (`src/battle/common/types.ts:32`). Additive by the
   letter, **risky in practice**: about 90 sites in `src/` branch as
   `game === 'ffx' ? A : B` and would send FF7 down FFX-2's branch silently. Section
   3.3 is the audit that makes this safe. The `Record<GameId, ...>` maps
   (`ARC_FINALE`, `GROUP_LABELS`, `GAME_LABELS`, `HOME_ASPECT`) fail `tsc` until they
   get an `ff7` entry, which is the wanted behaviour.
2. New contract file **`src/battle/common/types-ff7.ts`** (listed in CONTRACTS.md), so
   the 2660-line `types.ts` does not grow: `Ff7BaseStats`, `Ff7DerivedStats`,
   `Ff7Combatant extends Combatant` (with `ff7: { base, derived, row, limit, materia,
   atb }`), `LimitState`, `MateriaInstance`, `MateriaSlotLayout`, `Ff7MemberBuild`,
   `Ff7PartyBuild`, `Ff7EnemyFields`. `types.ts` imports these type-only.
   The `StatBlock` on an `Ff7Combatant` carries HP and MP (what shared UI reads);
   its other fields are mirrors documented in the file, and **the engine reads only
   the `ff7` block**, so no FFX or FFX-2 meaning leaks into an FF7 formula.
3. Unions widened: `AnyCombatant += Ff7Combatant`, `AnyPartyBuild += Ff7PartyBuild`,
   `BattleSetup.party += Ff7PartyBuild`, `EnemyDef.ff7?: Ff7EnemyFields`.
4. New event `{ type: 'limit-gauge'; actorId; value; level; ready }`. Not
   `overdrive-gauge`: shared UI prints "Overdrive" off that event.
5. New command `{ kind: 'limit'; id; targets }`. Magic is the existing
   `{ kind: 'ability' }`, Item is `{ kind: 'item' }`, Attack is `{ kind: 'attack' }`.
   Vocabulary table row: "an FF7 Limit is `'limit'`, never `'overdrive'`".
6. `src/data/encounters.ts`: `ChapterId += 'ff7-guard-scorpion'`; `Chapter.number`
   union gains `0` (documented: "0 = no place on the board"); new optional
   `Chapter.experimental?: true`; `Chapter.buildRef += Ff7PartyBuild`.
7. `src/data/ff7/ids.ts`, the FF7 id unions (a contract file like the other two
   `ids.ts`).

### 1.4 Events the presenter will see

A typical enemy turn: `turn-start`, `action-start` (Guard Scorpion, ability id),
`camera` / `vfx` / `sfx` pacing hints, `damage` per target, `limit-gauge` per party
member hit, `action-end`. The tail: `form-change` to `tail-up`, a `message` for the
in-battle hint line if the research confirms the game shows one, and `form-change`
back. A player's physical hit while the tail is up: the hit's own events, then
`counter` (Tail Laser) with its `damage` events, in the order the research gives.
A Limit: `action-start` with the Limit id, `damage`, `limit-gauge` back to empty.
The ATB rides `waiting` + `tick` with no per-tick event, as FFX-2 does; the HUD reads
`gaugeSnapshot()` through `sync` and `syncGauges`.

### 1.5 Determinism

- Time enters the engine only through `tick(ms)`. The same seed + the same commands at
  the same tick offsets give the same log byte for byte (a test, section 4).
- Rolls per action in one documented order (hit, critical, variance, then any status),
  written in `resolve.ts`'s header and in the research file.
- The queue is ordered by readiness time, ties broken by a fixed rule from research
  (or, if the research is silent, by slot order, marked `[estimate]` and told to
  Bailey).
- No `Math.random()`, no `Date`, no DOM, no `three`, no imports from `src/engine`,
  `src/ui` or `src/data` (the engine takes registries in its options, as FFX-2 does).

### 1.6 From research to data

Research files to write first (GameFAQs preferred where sources conflict, per
Bailey; read GameFAQs in the built-in browser pane if WebFetch is refused, close the
tabs after; every row tagged `[verified: 2 sources]`, `[single source]` or
`[estimate]`, the last labelled "our estimate" to Bailey):

- `research/ff7-combat-core.md`: ATB fill from Dexterity and Battle Speed; Active,
  Recommended and Wait semantics; the command queue; physical and magical damage
  chains with worked examples; variance; critical; hit and evade; row and long range;
  Defend; element multipliers; the damage cap; Limit gauge fill and levels; materia
  slots, links, stat changes and MP costs; how enemy counters fire. The Battle
  Mechanics FAQ on GameFAQs is the candidate primary source (to confirm it and its
  author and version when it is read, not from memory).
- `research/ff7-guard-scorpion.md`: the boss's level, HP, MP, stats, affinities,
  immunities, rewards and drops; its full AI script by section (the opening, targeting,
  when the tail rises and falls, the Tail Laser trigger, what the hint line says
  verbatim and who says it); the party at that point (Cloud's and Barret's levels,
  stats, rows, weapons, armour, accessories, materia, Limit level and starting gauge,
  the inventory reachable before the fight); whether the fight can be escaped.
- `research/observed-ff7-*.md` if Bailey allows checks in a real copy (the Steam rule,
  `feedback-real-game-steam-version`, is about FFX; ask before assuming FF7 is owned).

Data modules, each number with its `// §x.y [tag]` cite:

| File | Holds |
|---|---|
| `src/data/ff7/ids.ts` | FF7 id unions: characters, abilities, spells, materia, items, equipment, enemies. |
| `src/data/ff7/abilities.ts` | Attack, the spells the party's materia grants, the Limits (Braver, Big Shot, if research confirms), the boss's abilities. |
| `src/data/ff7/materia.ts`, `items.ts`, `equipment.ts` | Only the slice's rows. |
| `src/data/ff7/builds/sector1-reactor.ts` | `Ff7PartyBuild`: Cloud and Barret at the fight. |
| `src/data/ff7/enemies/guard-scorpion.ts` | `EnemyGroupDef` with `game: 'ff7'`, `EnemyDef.ff7`, `aiScriptId: 'guard-scorpion'`, rewards. |
| `src/data/ff7/index.ts` | Registry builder the app hands to `Ff7Engine`. |
| `src/data/chapter-ff7-guard-scorpion.ts` | The `Chapter` record (hidden), imported by `chapters-unlisted.ts`. |
| `src/story/scripts/ff7-guard-scorpion.ts` | Minimal `ChapterScripts`: `pre = [battleStart()]`, `post = [results()]`, no quips, no mid until a story options round. |

---

## 2. The hidden encounter

### 2.1 Registration

`src/data/chapter-ff7-guard-scorpion.ts` exports `FF7_GUARD_SCORPION`:
`id: 'ff7-guard-scorpion'`, `game: 'ff7'`, `number: 0`, `experimental: true`, a plain
title and location, `sensorTexts: {}`. `chapters-unlisted.ts` becomes
`UNLISTED_CHAPTERS = [FF7_GUARD_SCORPION]`.

What that gives for free, verified in `src/`: the board is built from `CHAPTERS`
only (`chapterGrid.ts:172`), so **no card, no FF7 group, no ribbon**; the strip counts
tiles (`chapterProgress.ts`), so it stays "N of 15"; `CHAPTER_IDS` and
`__pyrefly.chapters()` are unchanged; `getChapter` finds it (`encounters.ts`), so
`__pyrefly.gotoChapter('ff7-guard-scorpion')` runs it. The briefing and coach copy key
off listed chapters and the game; section 3.3 keeps FF7 out of both.

Known snags the build must handle (found reading the code, to be proven by running):

- `audio-cue-reachability.test.ts:115` iterates `[...CHAPTERS, ...UNLISTED_CHAPTERS]`,
  so the record's `music` keys must resolve. No retail FF7 music may ship (rule 8),
  and an original cue needs Bailey's ear (rule 13). Until then: an explicit silent
  placeholder the test accepts, not an FFX or FFX-2 cue (the cue map never crosses
  scores). **Open question for Bailey** (section 6).
- `arcCleared('ff7', ...)` in `BattleScreenFlow.ts:150` filters `CHAPTERS` by game, finds
  none and returns **true vacuously**. The experiment flow must never reach arc logic;
  `ARC_FINALE.ff7` must point at nothing that triggers an ending.
- `ChapterSelectScreen.trigger('select:<id>')` only finds board tiles, so it cannot
  open the fight. Good: it stays hidden from that debug route. Tests use
  `gotoChapter` or real keys.

### 2.2 Ways to open it (desktop and phone, not obvious on the menu)

Facts that shape the options: the board ignores the `select`, `start`, `l1`, `r1`
and `triangle` buttons (`ChapterSelectScreen.handleInput`); the letters L, I, T and
several others are bound to no button at all (`Input.ts` `KEY_MAP`); W, A, S, D move
the cursor and Z, X, Enter, Space, Esc, Backspace begin or leave; anything with
`data-action` gets `cursor: pointer` (`index.html:78-83`), which would give a tap
target away on a desktop unless overridden.

**Option A (recommended): type LIMIT, or tap the label seven times.**
- Keyboard: on chapter select, type L I M I T (at most ~2 s between letters). None of
  the five letters moves the cursor or starts a chapter (M is Select, unused on the
  board). A wrong letter resets the matcher silently.
- Phone and mouse: tap the small "Chapter select" label at the top of the board seven
  times within ~4 s. It gets a `data-action` with `cursor: default`, no hover, no
  sound, no press state.
- Gamepad (bonus): L1 R1 L1 R1 Select.
- On success, one brief sign (the look is Bailey's pick; the default proposal is the
  label's gold tick flashing once), then straight into the fight.
- Why: one word to remember, on theme (Limit Breaks are FF7's signature), works on
  every device, and nothing on the board changes.

**Option B: the unused shoulder buttons + a long-press.**
Keyboard F R F R Q (L1 R1 L1 R1 Triangle), gamepad the same buttons; phone: press
and hold the "N of 15 beaten" strip for two seconds. Downsides: F R F R Q is hard to
remember, and a long-press on iOS fights the text callout and scroll.

**Option C: hidden in a painting.**
Put the cursor on Chapter III (Braska's Final Aeon) and press Select three times;
on a phone, tap the plate's painted backdrop corner five times. Most hidden, but tied
to one card, awkward to explain, and the backdrop sits under scrolling content on a
phone.

Implementation (A): `src/app/screens/frontend/secretDoor.ts`, a pure matcher
(`feedKey(code, atMs)`, `feedTap(atMs)`, returns `'open' | null`; no DOM, unit-tested),
plus about 20 lines in `ChapterSelectScreen`: a **non-exclusive** `claimKeyboard`
while the board is up (buttons still latch as today), the eyebrow's `data-action`,
and on `'open'` it resolves `done` with `'ff7-guard-scorpion'` **without** calling
`rememberBoardChapter` (so the board never reopens on a hidden id). `snapshot()` and
the tile list are unchanged.

### 2.3 Flow, save, RETRY and return

`BattleScreenFlow.runChapter` gets one line at the top:
`if (chapter.experimental) return runExperiment(this, chapter, opts)`. The new
`src/app/screens/BattleScreenExperiment.ts` (the flow file is already over 400 lines):

1. No party prep (there is no FF7 prep screen; a prep screen is a new screen and would
   need its own options round).
2. `experimentRecords.recordAttempt(id)` instead of `save.recordAttempt`.
3. No pre-scene in the slice (the script is `[battleStart()]`).
4. `BattleScreen` with the chapter; its two save writes are guarded:
   `addPlayTime` (`BattleScreen.ts:717`) goes to the experiment store for an
   experimental chapter.
5. Victory: results panel through `ResultsScreen` with recording off
   (`ResultsScreen.ts:144` guarded), clear time and turns into the experiment store,
   then return to the board, cursor where it was, nothing new on it.
6. Defeat: the existing defeat panel. RETRY goes straight back in with
   `seed + attempt * 1000` (as chapters do); CHAPTER SELECT returns to the board.
7. Pause: RESTART ENCOUNTER restarts it; QUIT returns to the board.

`src/app/experiments/experimentRecords.ts`: key `pyrefly-reprise:experiments:v1`,
`{ [id]: { attempts, clears, bestTimeMs, playTimeMs, lastPlayedAt } }`, every read
and write in try/catch, a corrupt value reads as empty and is never merged into the
main save. Because nothing writes `save.chapters['ff7-guard-scorpion']`, the veteran
check (`SaveData.ts:259`), total play time (`SaveData.ts:436`) and the victory-line
count (`victoryLine.ts:56`) cannot see the fight. A test proves the main save key is
byte-identical after a full run (section 4).

### 2.4 How the critic should treat it

- Experimental: outside the 15-chapter milestone, the single score and the
  every-encounter gate, until Bailey says otherwise. The board stays "of 15".
- A defect inside the fight does not block a deploy (brand-new feature rule); a
  regression in any of the 15 chapters does, and the focused review before the deploy
  checks exactly that (goldens unchanged, board unchanged, save untouched).
- critic-plan today (run 2026-09-27 on the planned paths): **DEEP, focused before
  deploy, deep after on the live build**; `src/battle/ff7/**` and
  `src/app/experiments/**` show as "unclassified product path". Driver to-do (not
  done here, `critic/` is out of bounds for this brief): add an `ff7-engine` system
  row and an `ff7` game to `critic/policy.json`, and a CHECKS entry "an experimental
  encounter writes nothing to the main save and appears nowhere on the board".

---

## 3. Presentation plumbing (the look is left to the options round)

### 3.1 Reused unchanged

`BattleScreen` (scene load, stage, presenter, pause chip, pause, results hand-off),
`BattlePresenter*` (the ATB path is duck-typed; no game checks inside except the
optional `turnCutIn` port's type), `PaintedStage` and `PaintedArt` (grey silhouettes
until the art is approved: the loader never rejects), `TargetHighlight` through
`TargetingPort`, `withPhoneLayout` (with an FF7 install function), the pause screen
(after the audit), the defeat and results panels (recording off).

### 3.2 New, all FF7 only

- `src/ui/ff7/Ff7BattleHud.ts` implementing `HudPort`: command window (Attack, Magic,
  Item; **Limit replaces Attack while the gauge is full**), Magic submenu from
  `AvailableCommand` data, target cursor via `TargetingPort`, party rows (name, HP,
  MP, ATB bar, Limit gauge, and the Barrier and MBarrier bars FF7 draws in the same
  row, hidden when the slice cannot raise them), the enemy name list, and the help
  line that names the enemy's action. `syncGauges` and `setAtbMode` implemented.
  Split into `Ff7CommandMenu.ts`, `Ff7PartyRows.ts`, `Ff7HelpLine.ts`,
  `phoneHud.ts` to stay under 400 lines each.
- `src/scenes/sector1-reactor.ts`: a `SceneFactory` (intro, idle, action, victory rigs;
  party and enemy slots) for an original painted backdrop.
- Original painted art for Cloud, Barret and Guard Scorpion through the ComfyUI
  pipeline, only if NOW.md says art generation is on (rule 12). No retail FF7 art,
  model, screenshot or sound as input or output (rule 8).
- Spell effects: Bolt and Ice map onto the existing lightning and ice effects through
  an explicit `ff7` branch in `SpellFxLookup`.

### 3.3 The game-branch audit (the part that keeps FFX and FFX-2 safe)

About 90 `game === 'ffx'` / `'ffx2'` sites across ~45 files. For each one reachable
from the FF7 path, choose an explicit `ff7` answer; for the rest, prove they are not
reachable. Found so far (reading, to be proven by running):

| Site | What would go wrong with a bare `'ff7'` | Answer |
|---|---|---|
| `BattleScreenWiring.createEngine` | builds an `FFX2Engine` | `Ff7Engine` branch |
| `BattleScreenWiring.createHud` | FFX-2 HUD, then `withCoach` puts **Rikku's** coach lines on it | `Ff7BattleHud`, no coach |
| `applyAtbConfig` | applies FFX-2's saved ATB mode | FF7's own mode (default is a question for Bailey) |
| `battleSpellFx`, `abilityFactsFor` | FFX-2 looks and facts | `ff7` entries |
| Advisor, strategy guide, enemy intent, `MoveAdvisor` | FFX-2 rules guessing FF7 moves | off for `ff7` in the slice |
| `BattleScreenSetup.ts:60` | reads `buildRef.game === 'ffx2'` | fine; add an `ff7` guard |
| `TurnCutIn` / `TurnCutInLayer` | FFX-2 cut-in | none for `ff7` until the options round |
| `resultsMath`, `victoryLine`, `phoneBattleText` | FFX-2 wording | `ff7` wording or none |
| `ARC_FINALE`, `arcCleared` | vacuous "arc cleared" | never reached from `runExperiment` |
| `GROUP_LABELS`, `GAME_LABELS`, `HOME_ASPECT` | `tsc` error (good) | `ff7` entries; the board test proves no FF7 group renders |
| Party-prep and sphere-grid panels, chapter cards | unreachable (no prep, no card) | a test asserts they are never constructed for `ff7` |

---

## 4. Build order, tests and file ownership

Each step ends green (`npx tsc --noEmit`, the step's tests, and the FFX and FFX-2
goldens **byte-identical**: `tests/unit/ffx2-atb-golden.test.ts` and the FFX golden
suites) before the next starts.

| Step | Owns | Tests |
|---|---|---|
| **0. Research** | `research/ff7-combat-core.md`, `research/ff7-guard-scorpion.md` | none (a reviewer reads the tags) |
| **1. Contracts** | `common/types.ts` (additive), `common/types-ff7.ts`, `data/ff7/ids.ts`, `encounters.ts` union and field additions, `docs/CONTRACTS.md`, `docs/CONTRACT-CHANGES.md` | `tsc`; every golden unchanged |
| **2. Data** | `src/data/ff7/**` | `ff7-data-cites.test.ts`: every numeric field has a `§` cite in its file |
| **3. Formulas** | `ff7/formulas.ts`, `hit.ts`, `stats.ts` | `ff7-formulas.test.ts`: every worked example in the research, one `it` each, cite in the title |
| **4. Engine** | the rest of `src/battle/ff7/**` | `ff7-atb.test.ts` (fill times, modes, the menu hold), `ff7-queue.test.ts`, `ff7-limit.test.ts`, `ff7-guard-scorpion-ai.test.ts` (the pattern, the tail-up counter), `ff7-engine-determinism.test.ts` (same seed and commands give the same log; `seq` monotonic; JSON round-trip) |
| **5. Golden + bench** | `ff7/simulate.ts`, tests | `ff7-guard-scorpion-golden.test.ts` (sha256 of the full log, seeds 1 to 20, two strategies, pinned once research is locked); `ff7-guard-scorpion-bench.test.ts` (seeds 1 to 200: win rate, turns, time for "always attack", "attack only while the tail is down", "magic"; recorded in `docs/plans/ff7-guard-scorpion-bench.md`; never tune numbers to hit a target) |
| **6. Registration + flow + save** | `data/chapter-ff7-guard-scorpion.ts`, `chapters-unlisted.ts`, `story/scripts/ff7-guard-scorpion.ts`, `app/experiments/experimentRecords.ts`, `BattleScreenExperiment.ts`, one line each in `BattleScreenFlow.ts`, `BattleScreen.ts`, `ResultsScreen.ts`, the audit branches of 3.3 | `ff7-hidden-board.test.ts` (15 tiles, no FF7 group, strip total 15, `CHAPTER_IDS` unchanged, `getChapter` finds it); `ff7-save-isolation.test.ts` (a full run leaves `pyrefly-reprise:save:v1` byte-identical, the experiment key updated); `ff7-flow.test.ts` (RETRY re-enters, return lands on the board with the old cursor) |
| **7. Secret door** | `frontend/secretDoor.ts`, the lines in `ChapterSelectScreen.ts` | `ff7-secret-door.test.ts` (LIMIT opens, typo resets, timeout resets, 7 taps open, 6 do not, no board navigation sequence opens it, the cursor never moves while typing) |
| **8. Options round** (in parallel with 2 to 5) | mockups under `docs/concepts/ff7-guard-scorpion/`, tiles in `docs/target/targets.json` | Bailey picks: HUD look, scene, character art, success flash, music |
| **9. HUD + scene + art** (after the pick) | `src/ui/ff7/**`, `src/scenes/sector1-reactor.ts`, art | HUD unit tests on `sync` and the menu; real-input browser check; screenshots in `docs/screenshots/ff7/` next to the target |
| **10. e2e + release** | `tests/e2e/ff7-hidden.spec.ts` | real keys L I M I T into the fight, a phone viewport with seven taps, auto to victory, back to a board of 15; then the release sequence in AGENTS.md |

Steps 1 to 7 can land with no perceivable change to the shipped game except the door
itself, which only does something for someone who knows the word.

---

## 5. Paper preflight (deep class: new engine)

Invariants the deep review checks, each with its test:

- **I1** FFX and FFX-2 replay byte-identical (the goldens).
- **I2** The board is unchanged: same 15 tiles, same order, same strip, no FF7 group,
  same `snapshot()` (`ff7-hidden-board`).
- **I3** The main save is untouched by any FF7 run, win, loss, retry or quit
  (`ff7-save-isolation`).
- **I4** The FF7 engine imports nothing from `src/engine`, `src/ui`, `src/data` or
  `three`, and never calls `Math.random` (a layering test like the existing ones).
- **I5** Determinism and JSON-safe events (`ff7-engine-determinism`).
- **I6** Every FF7 number has a research cite and a tag; unsourced values are listed
  to Bailey, not guessed (`ff7-data-cites` plus reading).
- **I7** `node tools/orphans.mjs` shows no FF7 module wired to nothing (rule 4).
- **I8** No retail FF7 asset anywhere in the diff (rule 8).

Risks, most likely first: the game-branch audit misses a site that is reached only at
runtime (mitigate: a unit test that builds the FF7 battle screen's collaborators and
asserts none of them is an FFX-2 class); the FF7 ATB queue does not fit "one action
at a time" in the presenter (mitigate: the queue lives in the engine and the
presenter only ever sees one resolved action per decision); research is thin on the
AI's counter timing (mitigate: stop and ask, label any estimate).

---

## 6. Questions for Bailey (asked by the driver, not by this document)

1. The secret: A (type LIMIT, or tap the "Chapter select" label seven times) as
   recommended, or B or C.
2. Music until an original cue is approved: silence, or a sketch for the audition page.
3. FF7's ATB mode default: Active, Recommended or Wait (FFX-2 defaults to Wait, D-029).
4. Whether Bailey owns FF7 on Steam for in-game checks, as with FFX.
