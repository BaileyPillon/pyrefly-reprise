# Contract changes

Shared contracts (`src/sprites/format.ts`, `src/engine/SpriteActor.ts`,
`src/app/Input.ts`, `src/battle/common/types.ts`, `src/story/dsl.ts`,
`src/data/encounters.ts`) are written first and imported by everyone else. Any
change to one is recorded here, newest first. Additive only unless a note says
otherwise.

## 2026-09-24 — Chapter XI, Fallen Aeons: `ChapterId` gains `'ffx2-fallen-aeons'`, `Chapter.number` widens to 11, `EnemyGroupDef.restoresPartyOnEntry`

**FFX-2 only** [AGENTS.md hard rule 14] (research `ffx2-fallen-aeons.md` §0: ATB,
dresspheres and the aeons' action counter; none of it transfers to the FFX aeons); the
registration itself is shared plumbing. Bailey, 2026-09-24: "I'll go with your
recommendations for all" (FA1-FA19 and O-1..O-4 on `docs/plans/chapter-fallen-aeons-review.md`).

**Additive** in `src/data/encounters.ts`: `ChapterId` gains `'ffx2-fallen-aeons'`;
`Chapter.number` widens from `1 … 10` to `1 … 11`. The record lives in
`src/data/chapter-ffx2-fallen-aeons.ts` and sits in `UNLISTED_CHAPTERS`, the Chapter IX and
X precedent. Every `Record<ChapterId, …>` gains the key (`learn/atlas/cites.ts`,
`tests/unit/learn-atlas-data.test.ts`). No save migration: nothing lists this id yet.

**Additive** in `src/battle/common/types.ts`: `EnemyGroupDef.restoresPartyOnEntry?: boolean`
(FA2 b, a sourced `[conflict]`: GamerGuides has Save Spheres between the platforms, FFExodus
has none). The FFX-2 setup (`src/battle/ffx2/setup.ts#restoreAtSaveSphere`) gives the party
full HP and MP on entry and stands a KO'd girl up; items stay spent. It also marks the link
as the FA3 retry checkpoint for the flow to read (**not wired yet**: the flow still retries a
lost chapter from link 1). Set only on the Road's links 2 and 3.

Not listed contract files, recorded for the same reason as the entries below (FFX-2 only;
no FFX code path reads any of them):
- `AbilityDef.extra` gains `setHpTo` / `setMpTo` (Delta Attack: exactly 1 HP and 0 MP) and
  `mpFractionOfCurrent` (Heavenly Strike's MP half, Absorb's MP drain), documented in
  `src/battle/ffx2/aeon-effects.ts`.
- `AiScript` (`src/battle/ffx2/internal.ts`) gains `onTargeted` (once per party action aimed
  at the enemy, hit, miss, immune or status-only: FA8 a) and `onRegen` (a Regen tick healed
  it). Called from `engineHooks.ts#notifyEnemiesTargeted` and `#payStatusClocks`.
Chapters 4, 5 and 6 event logs measured byte-identical before and after over 120 seeded runs
(20 seeds each, Wait at 0 ms and Active at 700 ms a menu), against a detached worktree of
`bc188dd5`.

## 2026-09-24 — Chapter X, Seymour Natus: `ChapterId` gains `'seymour-natus'`, `Chapter.number` widens to 10

**FFX only** [AGENTS.md hard rule 14] (research `ffx-seymour-natus-highbridge.md` §0.3:
FFX-2 has no Natus, no Mortibody and no Highbridge boss); the registration itself is
shared plumbing. Bailey, 2026-09-24: "I'll go with your recommendations for all".

**Additive** in `src/data/encounters.ts`: `ChapterId` gains `'seymour-natus'`;
`Chapter.number` widens from `1 … 9` to `1 … 10`. The record lives in
`src/data/chapter-seymour-natus.ts` and sits in `UNLISTED_CHAPTERS`
(`src/data/chapters-unlisted.ts`), the Chapter IX precedent: `getChapter` and
`window.__pyrefly.gotoChapter` reach it, `CHAPTERS` / `CHAPTER_IDS` and chapter select
do not. Every `Record<ChapterId, …>` gains the key (`learn/atlas/cites.ts`,
`tests/unit/learn-atlas-data.test.ts`). No save migration: a save only holds ids it has
seen, and nothing lists this one yet.

Not a listed contract file, recorded for the same reason as the entries below:
`AbilityDef.extra` gains one documented key, `distinctTargetsPerHit: true`
(`src/battle/ffx/scripted.ts` table): a `random-enemy` hit after the first avoids the
member the previous hit picked when anyone else stands (`targeting.ts#nextHitTargets`).
Only Natus's four Multi-ra rows carry it; every other record resolves through the same
single RNG pick as before (Chapters 1, 2, 3, 7, 8 and 9 event logs measured
byte-identical over 72 seeded runs, before and after).

Repair, same day (behaviour, not a listed contract): `targeting.ts#redirectTarget` no longer
sends an action an enemy aims at **itself** to its provoker. Natus's 24,000 Protect counter is
decompiled as "Counter Self" [ffx-seymour-natus-highbridge §2.1, verified: 3 sources]; before
the repair a Provoked Natus put it on Tidus, or bounced it off a Reflected Tidus onto
Mortibody. The general reading is ours. Every other targetable, Provoke-landable FFX enemy in
our data is Braska's Final Aeon (the research lists him Provoke-immune: a Chapter III data gap,
not changed here), whose only self row is the form-change cue; Chapters 1, 2, 3, 7, 8 and 9
event logs measured byte-identical over 96 seeded runs, half of them with Provoke put on every enemy that
can take it (`tests/unit/chapters/natus-provoke.test.ts` pins the reach).

## 2026-09-24 — `AvailableCommand.preferredTargets`: where the target cursor opens

**Both games** [AGENTS.md hard rule 14]: shared plumbing, the same rule in each.
Bailey, live build: "when i click an attack it defaults to targeting my party member
instead of the enemy". Reproduced with real keys on every unlocked chapter: Attack and
every `single-enemy` row opened on an enemy, but a `single-any` row lists the party
too and the cursor opened on the leftmost figure, a party member — most X-2 skills
(Power Break, Drain, Doom, Death, Cheap Shot, Flametongue) and FFX's Dispel.

**Additive, optional** in `src/battle/common/types.ts` `AvailableCommand`:
`preferredTargets?: CombatantId[]`, the subset of `validTargets` the cursor opens on
(the leftmost of them on screen); the arrows still walk every valid target. Set only
when it narrows the list, so every existing row and fixture is unchanged. Filled by
both engines (`battle/ffx/commands.ts`, `battle/ffx2/targeting.ts` via
`battle/ffx2/aim.ts`) from the new pure `battle/common/aim.ts`: an enemy for damage,
debuffs, drains, Dispel and rows that say nothing about themselves (Copycat, Mix); a
party member for heals, buffs and cleanses; a KO'd party member first for a revive.
Neither `research/ffx-combat-core.md`, `research/ffx2-combat-core.md` nor
`research/ffx-vs-ffx2-presentation.md` says where the retail cursor opens, so this
is the standard FF convention, not a sourced rule. Read by `TargetCursor.showSingle`'s
new optional `prefer` argument from both command menus. Tests:
`tests/unit/target-default-side-ffx.test.ts`, `tests/unit/target-default-side-ffx2.test.ts`.

## 2026-09-24 — Scene staging switches move to `SceneStaging`; gain `holdParty` and `enemySpots`

Not a listed contract file; recorded for the same reason as the entry below. **Both games**
as plumbing, inert for every scene that sets neither new field. Additive and optional:

- `SceneStaging` (`src/scenes/types.ts`) now holds the optional per-location switches
  (`enemyLaneX`, `partAnchors`, `figureBloomMaskArt`, and the two below). `SceneBuild`
  and `SceneSlots` both extend it, so every existing field keeps its name and type;
  `stagingOf(build)` copies the ones a build set onto its slots.
- `holdParty?: boolean`: the stage's measured relaxation (`src/engine/StageRelax.ts`)
  never moves a party member, and a party member overlapping a fiend moves neither.
  Set by Mt. Gagazet, the Zanarkand Dome and Dream's End (FFX only, Chapters 1-3, PR-0002 A), whose
  party slot tables are now solved against the fiends' settled places.
- `enemySpots?: Record<combatantId, Spot>`: a named enemy's standing spot, overriding
  its slot; the formation solver and the relaxation leave it there. Set by the
  Farplane (FFX-2 only, Chapter 5) for Vegnagun's body at link 3 (D-044).
- Unchanged for everyone else: the relaxation's party-and-fiend rule is back to the
  shared step it had before 49789dd6 (that commit's "only the fiend gives way" moved
  fiends in Chapters 3, 7 and 8).

## 2026-09-24 — `encounters.ts`: `UNLISTED_CHAPTERS` moves to `chapters-unlisted.ts` (re-exported); FFX explicit targets must be `targetable`

**FFX only** (Chapter IX, the Yojimbo repair pass). The contract surface does not change:
`UNLISTED_CHAPTERS` moved to the new `src/data/chapters-unlisted.ts` for the house 400-line rule,
and `src/data/encounters.ts` re-exports it under the same name and type (`getChapter` is unchanged).
Two notes on the engine seams listed with the Chapter IX entry below:

- `src/battle/ffx/targeting.ts#resolveTargets`: an explicitly submitted **cross-side** target must now
  be `targetable` (not untargetable, not hidden), the same check `validTargets` offers the menu and the
  one the FFX-2 engine already makes. An invalid pick falls back to the row's own rule. The FFX
  engine only; same-side picks are unchanged. Listed chapters' event logs are byte-identical
  (96 of 96 runs).
- `src/battle/ffx/execute.ts`: `shapeOverdrive` moved verbatim to `src/battle/ffx/overdriveShape.ts`
  (rule 7). Behaviour is unchanged.

## 2026-09-24 — Music key `boss-yojimbo` (Chapter IX); five runtime instrument stand-ins

**The key: FFX only** [AGENTS.md hard rule 14]: Lady Ginnem's Yojimbo in the Cavern of the
Stolen Fayth is an FFX encounter (research/ffx-yojimbo.md). Additive: `MUSIC_KEYS` in
`src/audio/tracks/index.ts` (§8's list, 21 -> 22) gains the key the Chapter IX preflight
reserved (`docs/plans/chapter-yojimbo-review.md` §6.1), composed in `boss-yojimbo.ts`
("The Summoner's Sorrow", from the O-6 sketch A Bailey picked on 2026-09-24), registered in
`COMPOSED` and `TRACK_NOTES` and rendered into `public/audio/manifest.json`. `MusicKey`
stays a plain `string`. **Not wired yet**: no chapter, formation or meta names it; the
wiring belongs to the Chapter IX data owner (`docs/concepts/chapters/yojimbo/INSTALLED.md`).

**The stand-ins: both games** (shared plumbing). `INSTRUMENTS` in `src/audio/instruments.ts`
gains `cello-solo` -> strings-low, `violin-solo` -> strings, `piano-felt` -> piano,
`horn` -> brass and `cymbal-swell` -> crash, so the synthesised fallback can play the cue
instead of throwing. The first four are the voices `sfx/design.ts` `RUNTIME_STAND_INS`
already used for those names, so no sound effect's fallback changes; `piano-felt` was not
in that list, and no effect names it. Offline renders still use the sampled presets.

## 2026-09-24 — `ChapterId` gains `'yojimbo-cavern'`; `Chapter.number` gains `9`; `UNLISTED_CHAPTERS`; `getChapter` reaches it

`src/data/encounters.ts`, additive. **FFX only** for the chapter (Chapter IX, Lady
Ginnem's Yojimbo in the Cavern of the Stolen Fayth, `research/ffx-yojimbo.md`
candidate A); **both** for the plumbing, which is inert for every listed chapter.

- `ChapterId` gains `'yojimbo-cavern'`; `Chapter.number` widens from `1..8` to `1..9`.
  Any `Record<ChapterId, …>` literal needs the key (the two in `learn/atlas/cites.ts`
  and `tests/unit/learn-atlas-data.test.ts` have it).
- New export `UNLISTED_CHAPTERS: readonly Chapter[]` — chapters that are **registered
  but not listed**. They are not in `CHAPTERS` or `CHAPTER_IDS`, so chapter select,
  the jukebox, `__pyrefly.chapters()` and every chapter-generic suite do not see
  them; `getChapter(id)` now falls back to this list, so the flow and
  `window.__pyrefly.gotoChapter('yojimbo-cavern')` run it end to end. No card of any
  kind shows (not even COMING): its picks are Bailey's (AGENTS.md hard rule 9).
  Listing it later is moving the record into `CHAPTERS` and the id into `CHAPTER_IDS`.
- `YOJIMBO_CAVERN` is re-exported beside `EVRAE_AIRSHIP`; the record lives in
  `src/data/chapter-yojimbo-cavern.ts` with a placeholder scene (`gagazet`),
  placeholder music (Chapter 1's cues) and placeholder scripts (battle start and
  results only), each labelled as such.

Not contract files, recorded because the FFX engine is shared: `ActorRuntime` gains
`ordersOnly?: boolean` (`src/battle/ffx/state.ts`; `turnQueue.ts#queueMembers`
skips such an actor, so it is on the field with no CTB turn), and an `AbilityDef`
whose `extra` carries `ordersActor` + `orderedAbility` makes that actor act on the
orderer's turn (`src/battle/ffx/orders.ts`, hooked at the end of
`execute.ts#executeCommand`). Only the Yojimbo formation sets either, and the FFX
chapters' event logs at fixed seeds were measured byte-identical before and after
(45 runs: Chapters 1, 2, 3, 7, 8 × seeds 1, 7, 42 × attack / defend / intended).

## 2026-09-24 — `SpeakerId` gains `'seymour-macalania'`

`src/story/dsl.ts`, additive. **FFX only** (Chapter VII, Macalania Temple): Bailey picked
portrait option A for Chapter VII's Seymour on 2026-09-24 ("All your recommendations";
`docs/concepts/portraits/seymour-macalania/`). The 15 lines in
`src/story/scripts/seymour-anima-macalania.ts` now speak as `'seymour-macalania'` and show
`public/art/portraits/seymour-macalania.png`; Chapter I (`seymour-flux.ts`) and every other
`'seymour'` line keep the Flux-era portrait. The name plate still reads "Seymour"
(`DialogueBox.defaultName` strips `-macalania`) and the role chip still reads "Maester"
(`speaker-roles.ts`). Actor ids (`showActor('seymour', ...)`) are unchanged.

## 2026-09-24 — Scene slots gain `enemyLaneX` and `partAnchors`; `PaintedActor` gains `figure: false` and `paintPoint`

Not a listed contract file. It is recorded here because `SceneSlots` (`src/scenes/index.ts`)
and `SceneBuild` (`src/scenes/types.ts`) are what every scene and the stage build against,
and `docs/plans/vegnagun-parts-wiring.md` §2 asked for this note. **Both games** as
plumbing, and inert for every scene that sets neither field. Additive and optional:

- `enemyLaneX?: [left, right]` pins the enemy lane's x for the formation solver
  instead of deriving it from `enemy`. Only the Leblanc Last Room sets it (FFX-2 only,
  Chapter 6), to move Dr. Goon off Paine.
- `partAnchors?: PartAnchors` (`src/engine/PartAnchors.ts`), keyed by combatant id: a
  part staged with no figure, placed on its parent's painting or overhead, and kept out
  of the formation solver and the overlap pass. Only the Farplane sets it (FFX-2 only,
  Chapter 5), for Vegnagun's Bulwarks, Redoubts and Nodes (D-044).
- `PaintedActorOptions.figure?: boolean` (default true) and
  `PaintedActor.paintPoint(u, t)`, the world point of a spot on the live painting.

## 2026-09-24 — Music key `boss-seymour-macalania` (Chapter VII); four runtime instrument stand-ins

**The key: FFX only** [AGENTS.md hard rule 14]: Seymour and the Guado Guardians at
Macalania is an FFX encounter (research/ffx-seymour-anima-macalania.md). Additive:
`MUSIC_KEYS` in `src/audio/tracks/index.ts` (§8's list) gains the key the Chapter VII
preflight reserved (`docs/plans/chapter-macalania-review.md` §6.3), composed in
`boss-seymour-macalania.ts` ("The Courtesy", from the sketch A Bailey picked on
2026-09-24), registered in `COMPOSED` and rendered into `public/audio/manifest.json`.
`MusicKey` stays a plain `string`. The chapter's `music.battle`, the formation's
`musicCues` and the chapter meta's `musicKeys` now name it instead of Chapter 1's
`boss-seymour`. Not changed: the story script's pre-battle `music('boss-seymour', 1000)`
(`src/story/scripts/seymour-anima-macalania.ts`, another agent's folder) still plays
the Flux theme under the reveal until the battle-start cue replaces it.

**The stand-ins: both games** (shared plumbing). `INSTRUMENTS` in
`src/audio/instruments.ts` gains `harpsichord`, `oboe`, `clarinet` and
`string-quartet`, each pointing at an existing synthesised voice (`pluck`, `flute`,
`flute`, `strings`), so a cue that names these sampled presets synthesises instead of
throwing when the browser falls back (request #1 in
`docs/audio/requests-menus-clair-obscur.md`). Each points at the same voice
`sfx/design.ts` `RUNTIME_STAND_INS` already used for the name, so no sound effect's
fallback changes; the offline render still plays the real sampled preset.

## 2026-09-24 — `SpeakerId` gains `'brother-x2'`: FFX-2 Brother's own voice and portrait id

**FFX-2 only** [AGENTS.md hard rule 14]: Brother's look is sourced only for X-2
(`research/visual-bible.md` §1.23.7), so his painted portrait must not reach the FFX
Evrae lines. **Additive, one union member** in `src/story/dsl.ts` `SpeakerId`:

- `'brother-x2'` — every FFX-2 Brother line (chapter 4 `ffx2-bahamut.ts`, chapter 5
  `ffx2-vegnagun-shuyin.ts`, chapter 6 `ffx2-leblanc.ts`) now uses it; the portrait is
  `public/art/portraits/brother-x2.png`. The name plate still reads "Brother", because
  `DialogueBox.defaultName` strips `-x2` as for `yuna-x2` / `rikku-x2`. No role chip
  (the airship crew are untagged in `speaker-roles.ts`).
- `'brother'` stays, unchanged, for the FFX Evrae lines (`evrae-airship.ts`), which keep
  the text-only card until his FFX look is sourced.

Why: Bailey's pick of 2026-09-24 ("I'll take all of your recommendations"), the
speaker-id ruling in `docs/concepts/portraits/nooj-brother/JUDGE.md` §2.

## 2026-09-23 — `EnemyRewards.stolenGil` and `steal.stealRate`: FFX-2 Steal and Pilfer Gil work

**FFX-2 only** [AGENTS.md hard rule 14]: the Thief's Steal and Pilfer Gil are FFX-2
commands resolved by `src/battle/ffx2/steal.ts`; the FFX engine reads neither field.
**Additive, two optional fields** in `src/battle/common/types.ts` `EnemyRewards`:

- `steal.stealRate?: number` — the published steal byte out of 255 (Leblanc 192,
  Bahamut 128). The FFX-2 engine rolls `rng.int(0, 254) < stealRate`, or
  `baseChance` on the /255 scale when absent [`ffx2-bahamut.md` §1.6].
- `stolenGil?: number` — what Pilfer Gil takes, once per enemy (SinirothX "Stolen Gil",
  `ffx2-combat-core.md` §8.3). Set on the Act III Syndicate (1,500 / 640 / 600), Bahamut
  (2,200) and every Vegnagun part and Shuyin (`ffx2-vegnagun-shuyin.md` §3).

Why: chapter 6 (live since release 09) offers Rikku both commands and neither did
anything (Steal: `action-start`, `action-end`, nothing between; Pilfer Gil: a
0-damage hit). Stolen items go to the `inventory:<id>` flags; pilfered gil goes to
`flags.stolenGil` and `BattleResult.gil` (not on a defeat). Plan:
`docs/plans/questions-for-bailey-2026-09-23.md` Q5.

## 2026-09-23 — Two music keys: `scene-fahrenheit`, `boss-evrae` (Chapter VIII)

**FFX only** [AGENTS.md hard rule 14]: Evrae on the Fahrenheit is an FFX encounter
(research/ffx-evrae-airship.md §0.4). Additive: `MUSIC_KEYS` in
`src/audio/tracks/index.ts` (CONTRACT-CHANGES §8's list) gains the two keys the
Chapter VIII preflight reserved, both composed and registered in `COMPOSED`
(`scene-fahrenheit.ts`, `boss-evrae.ts`, shared material in `fahrenheit.ts`) and
rendered into `public/audio/manifest.json`. `MusicKey` stays a plain `string`;
nothing else changes. The chapter's `music`, the formation's `musicCues`, the
chapter meta's `musicKeys` and the story script's two `music()` steps now name them
instead of Chapter 1's stopgap pair. Handoff: `docs/handoff/chapter-evrae-music.md`.

## 2026-09-23 — `AvailableCommand.wrapsCategory`: Doublecast asks for a spell and an enemy (PR-0125)

Key `fix-ffx-doublecast-aim`. **FFX only** [AGENTS.md hard rule 14]: Doublecast
is Lulu's FFX ability and chapter 3's `dreams-end` is the only build granting it.

**Additive, one optional field** in `src/battle/common/types.ts`:
`AvailableCommand.wrapsCategory?: AbilityCategory`. A row that sets it is a
**wrapper**: choosing it opens that category's rows as a second step, and the
command submitted is the wrapper's own id with the chosen row's id as the
already-documented `AbilityCommand.wrappedId` and that row's target step
supplying `targets`. Only the FFX engine sets it (`battle/ffx/commands.ts`, for
any ability whose record carries `extra.castsTwoBlackMagicSpells` — today only
`doublecast`, `'blackmagic'`). A consumer that ignores it behaves exactly as
before.

Why: critic round 09 (PR-0125) found the FFX menu read Doublecast's self-only
`validTargets: ['lulu']` as a finished aim and submitted `{ id: 'doublecast',
targets: ['lulu'] }` with no `wrappedId`; the engine's fallback cast Firaga twice
on Lulu (self-KO on seeds 1 and 7). `research/ffx-combat-core.md` §7.4 row 41
defines Doublecast as *"Two Blk Magic casts at a fixed rank 3"*, so the menu now
opens the Black Magic list and that spell's enemy target step
(`ui/ffx/CommandMenu.ts`, `CommandMenuLogic.ts wrappedGroup / wrapCommand`).

Also in this change, no contract impact: the resolver moved to
`src/battle/ffx/doublecast.ts` and gained a guard (an offensive spell whose aim
is only the caster's own id, or nothing, is re-aimed at the spell's own legal
targets); the advisor skips a wrapper row in its own ranking and prints the
chapter line's Doublecast as `"Doublecast: <spell>"` with the exact `wrappedId`
and targets (`engine/tactics/advisor.ts wrappedLabel`).

## 2026-09-23 — Chapter 8 registered, LOCKED: `evrae-airship` (Evrae)

Key `chapter-evrae-integration`. **FFX only** [AGENTS.md hard rule 14]: the
airship distance mechanic "has no X-2 counterpart"
(`research/ffx-evrae-airship.md` §0.4); an FFX party without Yuna. Number 8 by
display order after the seven already registered (the D-018 rule Leblanc's 6
and Macalania's 7 used); narratively it comes before Chapter 1. Id
`evrae-airship` is the formation's id and the COMING row's, so the coming
card drops off by itself the day its lock line goes.

**Additive only, the same shape as Chapter 7's entry below:**

- `src/data/encounters.ts`: `ChapterId` gains `'evrae-airship'`;
  `Chapter.number` gains `8`; `EVRAE_AIRSHIP` appended to
  `CHAPTERS`/`CHAPTER_IDS` (eighth, last) and re-exported. The record lives in
  `src/data/chapter-evrae-airship.ts` (type-only import of `Chapter`).
- `src/data/chapter-meta.ts`: `ChapterMeta.numeral` gains `'VIII'`;
  `EVRAE_META` (now a real `ChapterMeta`, id `evrae-airship`) appended.
- `src/story/registry.ts`: `ChapterKey` gains the id; `STORY_CHAPTERS`,
  `AI_EMITTED_TRIGGERS` (empty) and `CHAIN_SEAMS` (empty: one formation, every
  beat an in-fight interrupt) gain an entry.
- `src/engine/tactics/index.ts`: `evrae` under `'evrae'` (the guide's one
  `bossIds` entry; Cid is never a target). `src/data/guides/index.ts`:
  `EVRAE_GUIDE` appended (its `id` corrected to the chapter id).
- `src/scenes/index.ts`: `'evrae-airship-deck'` in `SCENE_FACTORIES` and
  `SCENES`; `src/debug/sceneScreens.ts`: `scene-evrae-airship-deck`.
- `src/app/screens/frontend/comingChapters.ts`: `'evrae-airship'` added to
  `LOCKED_CHAPTER_IDS` (every Evrae painting is CANDIDATE; the order widget
  and the NEAR/FAR staging are INFERRED).

**Not contract files, recorded because they are shared:** `BattleScreen.ts`
gains one optional hook (`BattleScreenAirship.ts`: returns `null` on every
scene without a published range director); `FFXBattleHud.ts` routes the
command menu through `AirshipOrders.choose`, a pass-through unless
`state.flags['airship.range']` is set (only the Evrae encounter sets it).
`src/battle/ffx/ai/index.ts`: the two order triggers now emit a `message`
when queued, as Talk does (found by `trigger-commands.test.ts` on
registration). `special-orders-evrae.ts`: `name` is the approved copy
("Pull back" / "Close in", D-020 Q9) instead of the id.

**No new `MusicKey`.** The preflight's two cues (`scene-fahrenheit`,
`boss-evrae`) are unbuilt and `docs/audio/THEMES.md` names no Evrae cue, so
`Chapter.music`, the script's two `music()` calls, the formation's
`musicCues` and the meta's `musicKeys` route Chapter 1's `scene-gagazet` /
`boss-seymour` plus `victory-ffx` as a recorded stopgap. Four script `sfx()`
keys not in the bank were swapped (`airship-engine-loop` -> `machina-whir`,
`comm-click` -> `cursor-move`, `wyrm-fall` -> `ko-fall`, `cannon-report` ->
`explosion`). No boss number changed.

## 2026-09-22 — FFX-2 Wait mode: `FFX2BattleEngine.tick` doc comment only

Key `ffx2-wait-mode`. **FFX-2 only** [AGENTS.md hard rule 14]. Bailey's D-029
(`docs/target/decisions.json`): Wait mode, and Wait the default.

**No shape change.** `src/battle/common/types.ts`: the doc comment on
`FFX2BattleEngine.tick` said the fight runs in Active mode (D-009); it now
names both Config ATB modes and says the mode belongs to the engine. The mode
itself is engine-side and additive, outside the contract files:
`Ffx2EngineOptions.atbMode?: 'wait' | 'active'` (default `'wait'`),
`FFX2Engine.setAtbMode` / `atbMode()` (structural, like `setAtbSpeed`, not on
the interface), and an optional `atbMode?()` on the presenter's
`ActiveClockEngine` slice (`src/engine/BattlePresenterActive.ts`). Preflight
`docs/plans/ffx2-wait-mode-review.md`; handoff `docs/handoff/ffx2-wait-mode.md`.

## 2026-09-22 — Chapter 7 registered, LOCKED: `seymour-anima-macalania` (Seymour and Anima)

Key `chapter-macalania-integration`. **FFX only** [AGENTS.md hard rule 14]:
an FFX encounter with an FFX party (`research/ffx-seymour-anima-macalania.md`).
Number 7 by display order, after the six already registered (the rule
`docs/target/decisions.json` D-018 used for Leblanc's 6); narratively it comes
before Chapter 1.

**Additive only, three widened unions, one new record, one new lock set:**

- `src/data/encounters.ts`: `ChapterId` gains `'seymour-anima-macalania'`;
  `Chapter.number` gains `7`; `SEYMOUR_ANIMA_MACALANIA` appended to
  `CHAPTERS`/`CHAPTER_IDS` (seventh, last) and re-exported. The record itself
  lives in `src/data/chapter-seymour-anima-macalania.ts` (type-only import of
  `Chapter`, so no runtime cycle) to keep the contract file under 400 lines.
- `src/data/chapter-meta.ts`: `ChapterMeta.numeral` gains `'VII'`;
  `SEYMOUR_ANIMA_MACALANIA_META` (now a real `ChapterMeta`) appended.
- `src/story/registry.ts`: `ChapterKey` gains the id; `STORY_CHAPTERS`,
  `AI_EMITTED_TRIGGERS` (empty) and `CHAIN_SEAMS` (empty: one continuous
  battle, every beat an in-fight interrupt) gain an entry.
- `src/engine/tactics/index.ts`: `seymourAnimaMacalania` under its four
  combatant ids (the guide's `bossIds`). `src/data/guides/index.ts`:
  `SEYMOUR_ANIMA_MACALANIA_GUIDE` appended.
- `src/scenes/index.ts`: `'macalania-temple'` in `SCENE_FACTORIES` and
  `SCENES`; `src/debug/api.ts`: `scene-macalania-temple` debug screen.
- **New: `LOCKED_CHAPTER_IDS`** in `src/app/screens/frontend/comingChapters.ts`,
  read by `buildChapterTiles` (plus an optional `locked` on
  `ChapterRegistries` for tests). A registered chapter listed there is hidden
  from chapter select and its COMING row stays; everything else (the flow,
  `gotoChapter`, the chapter-generic tests) reaches it. Unlocking is deleting
  its one line. Macalania is listed: all of its art is CANDIDATE.
- `src/ui/common/roman.ts` (shared plumbing, **both** games): `romanNumeral`
  now covers I-VIII. It stopped at V, so Leblanc's cutscene eyebrow and prep
  header printed "6" against its meta's "VI" (a live bug, fixed in passing).

**No new `MusicKey`.** The chapter's own two cues (`scene-macalania-temple`,
`boss-seymour-macalania`, preflight §6.3) are unbuilt compositions and neither
`docs/audio/THEMES.md` nor `docs/plans/music-modern-sound.md` names one, so
`Chapter.music`, the script's two `music()` calls, the formation's
`musicCues` and the meta's `musicKeys` route Chapter 1's `scene-gagazet` /
`boss-seymour` plus `victory-ffx` as a recorded stopgap. Three script `sfx()`
keys that do not exist in the bank (`chamber-door`, `guado-robes`,
`sphere-crack`) were swapped for `dome-echo`, `footstep`, `petrify-shatter`
(an unknown cue throws in the cutscene runner). No boss number changed.

## 2026-09-22 — Chapter 6 registered: `ffx2-leblanc` (The Leblanc Syndicate)

Key `chapter-leblanc-integration`. **FFX-2 only** [AGENTS.md hard rule 14].
`docs/target/decisions.json` D-018 (Bailey, 2026-09-21) answers the paper
preflight's Q1: chapter number 6, id `ffx2-leblanc`.

**Additive only, three widened unions, one new record:**

- `src/data/encounters.ts`: `ChapterId` gains `'ffx2-leblanc'`;
  `Chapter.number` gains `6`; `FFX2_LEBLANC` added to `CHAPTERS`/`CHAPTER_IDS`
  (sixth, last).
- `src/data/chapter-meta.ts`: `ChapterMeta.numeral` gains `'VI'`;
  `FFX2_LEBLANC_META` (`src/data/chapter-meta-ffx2-leblanc.ts`, now a real
  `ChapterMeta` rather than the draft-relaxed type it shipped as) appended to
  `CHAPTER_META`.
- `src/story/registry.ts`: `ChapterKey` gains `'ffx2-leblanc'`;
  `STORY_CHAPTERS`, `AI_EMITTED_TRIGGERS` (empty — no AI script emits
  `script-trigger` in this chapter) and `CHAIN_SEAMS` (`act-one-cleared`,
  `act-two-cleared`) all gain an entry.
- `src/engine/tactics/index.ts`: `ffx2Leblanc` registered under all eight
  `LEBLANC_BOSS_IDS`, the same one-tactic-many-ids pattern Chapter 5 uses.
- `src/data/guides/index.ts`: `FFX2_LEBLANC_GUIDE` appended to `GUIDES`.

**Reconciled while wiring** (both tracks' own handoffs flagged these as owed
to the integrator, not invented here): `src/story/scripts/ffx2-leblanc.ts`'s
`LEBLANC_COMBATANT_IDS.ormiActOne`/`logosActTwo` were `'ormi-act1'`/
`'logos-act2'`, which matched no shipped enemy record — corrected to the real
`'ormi-entrance'`/`'logos-room'` (the same ids the guide's own `phases` use).
`LEBLANC_ABILITY_IDS.notSoMightyGuard` was `'x2-lb-not-so-mighty-guard'`
against the shipped `'x2-leblanc-not-so-mighty-guard'` — corrected. No boss
number changed.

**No new `MusicKey`.** No cue is named for this chapter in
`docs/plans/music-modern-sound.md` or `docs/audio/THEMES.md`, and composing
one is outside this track's brief — inventing a `MUSIC_KEYS` entry with no
real composition would need a `docs/audio/THEMES.md` cue-map row and a track
file this track cannot author. Per the integrator's own brief ("if none is
named, the cue chapter 4 uses, and say so"), `Chapter.music` and the story
script's three `music()` calls reuse Chapter 4's `scene-bevelle-underground`
and `boss-ffx2-aeon`, plus `scene-farplane` for the post-battle Vegnagun-reveal
hush and the shared `victory-ffx2` fanfare — all three already real,
registered `MUSIC_KEYS`. A future music track can compose this chapter's own
cues and swap the three calls in `ffx2-leblanc.ts`.

`sceneKey: 'leblanc-last-room'` (already registered in `src/scenes/index.ts`
by an earlier track) is reused for all three acts, including the entrance and
Logos' room — no options round has picked distinct dioramas for those yet.
Recorded as a gap in `docs/handoff/chapter-leblanc.md`, not a silent guess.

## 2026-09-21 — `SpeakerId` gains `'cid'` (the Evrae chapter's voice over the deck)

Key `chapter-evrae-script`. **FFX only** [AGENTS.md hard rule 14].
`research/ffx-evrae-airship.md` §0.4 fences the encounter in — the airship
distance mechanic "has no X-2 counterpart" — and Cid appears aboard the
*Fahrenheit* at a point in FFX's story. `src/battle/ffx2/**`, `src/data/ffx2/**`
and every FFX-2 script are untouched; the absence case is the last describe
block of `tests/unit/chapters/evrae-script.test.ts`.

**Additive, one union member.** `src/story/dsl.ts`'s `SpeakerId` gains `'cid'`,
under the FFX supporting cast. No existing script, runner or screen changes:

- `SPEAKER_ROLES` (`src/ui/common/speaker-roles.ts`) is a `Partial` record and
  deliberately leaves the airship crew untagged, so it needed no entry;
- `DialogueBox`'s `defaultName` title-cases the id, giving `Cid`;
- the id is the same string as the combatant id `CID_ID` in
  `src/data/ffx/enemies/evrae.ts`, on purpose — Cid takes a CTB row in this
  encounter and speaks on the same deck, and one name for one person keeps the
  presenter's actor lookup honest.

Why it was needed: preflight beats 7 and 9 (`docs/plans/chapter-evrae-review.md`
§7) are Cid's by name — the mechanic delivered as characterisation, and the
victory revoked a minute later by Bevelle's own guns. Writing them as `'none'`
would have thrown away the only character in the chapter with an opinion.

## 2026-09-21 — Active ATB: `FFX2BattleEngine.tick` takes options, and gains `inputValid`

Key `ffx2-active-atb`. Shipped in `45f98b9` **without this entry** — hard rule 2
was broken by a pushed commit, and the wave-1a verifier caught it. Recorded here
after the fact rather than quietly; the change itself stands.

**FFX-2 only** [AGENTS.md hard rule 14]. Active mode is an FFX-2 Config entry
(`research/ffx2-combat-core.md` §1.5: time never stops, including while browsing
a list or a submenu) and Bailey chose it for FFX-2 by name
(`docs/target/decisions.json` D-009, 2026-09-21: *"For ffx-2 I choose active."*).
FFX is CTB and has no clock to run (`research/ffx-vs-ffx2-presentation.md` §4.3),
so `BattleEngine` — the interface FFX implements — is untouched, and
`tests/unit/ffx-no-active-clock.test.ts` is the absence test.

Both changes are on `FFX2BattleEngine` (`src/battle/common/types.ts`) and both
are additive; no existing caller needed a line changed.

**`tick(ms: number, opts?: { throughInput?: boolean }): BattleEvent[]`** — the
second parameter is new and optional. Without it the method behaves exactly as
before (the presenter's `'waiting'` branch still calls `tick(nextEventMs)` bare,
and a run that never opens a menu is bit-identical). With `throughInput` a girl
standing ready for a command is treated as *queued for input* rather than
acting, so she no longer stops the sub-step loop.

**`inputValid(actorId: CombatantId): boolean`** — new method. Is the command
menu open for `actorId` still answerable: ready, able to act, not chain-locked,
not Berserked, battle still running. The presenter polls it once per pump step,
**and again before it submits a command** — the wave-1a repair, without which a
command confirmed in the same step its owner was KO'd executed as a different
girl. `FFX2Engine.submit` refuses such a command at the root.

Implementations: `src/battle/ffx2/engine.ts` (predicates in
`src/battle/ffx2/active.ts`). Consumers: `src/engine/BattlePresenter.ts` and
`src/engine/BattlePresenterActive.ts`, both through the structural
`activeClockEngine()` probe, which returns `null` for FFX.

## 2026-09-20 — results: `BattleResult` carries turn participation separately from AP eligibility

Key `builda1-repair` (round 04 repair, second pass — the verifier refuted the
first PR-0003 fix). **FFX only** [AGENTS.md hard rule 14]: the switch/reserve
roster and the AP-eligibility rule this closes a gap in are both FFX Sphere
Grid mechanics (`research/ffx-combat-core.md` §10.1); FFX-2 has no chained
reserve concept and its own `levelsGained` path is untouched. Additive and
optional; nothing about AP, Sphere Levels or outcome resolution changes.

**`BattleResult.turnsTaken?: Record<CombatantId, number>`** (`src/battle/common/types.ts`),
set by `src/battle/ffx/results.ts`'s `buildBattleResult` from `ActorRuntime.turnsTaken`
over the full roster (`activeIds` + `reserveIds`), independent of `alive`/`ko`/`petrify`.
`sphereLevelsGained`'s keys answer "did this member earn AP" (excludes anyone
KO'd or petrified at the end); `turnsTaken`'s keys answer "did this member act
at all". The verifier found the first PR-0003 fix still conflated the two:
`src/ui/common/resultsMath.ts`'s `buildMemberRows` unioned reserve members into
the row set only when they were a `sphereLevelsGained` key, so a reserve member
who switched in, took turns, and was KO'd before the battle ended (Chapter 1,
seeds 3/8/12, Auron) had no row at all — the defect PR-0003 is titled after,
surviving inside the "fix". `buildMemberRows` now unions reserve members from
**either** set, so a member who acted always gets a row (0 AP when ineligible),
and a member switched out before completing a turn (never in either set) still
correctly gets none.

## 2026-09-19 — targeting: `AvailableCommand` carries the ability's own `targeting`

Key `fix3-targeting`. **Both games** [AGENTS.md hard rule 14, critic CHK-020]:
this is a display defect in shared menu logic that both engines feed, so both
engines publish the field and both HUDs read it. Additive and optional; nothing
about resolution, legality or outcome changes.

**`AvailableCommand.targeting?: Targeting`** (`src/battle/common/types.ts`),
set by `src/battle/ffx/commands.ts` (ability rows and item rows) and
`src/battle/ffx2/targeting.ts` (attack, ability and item rows).

The UI is the only consumer. Before this, the command menu could not tell
"pick one of these three allies" from "this hits all three": both arrive with
an empty `command.targets` and three `validTargets`. So Hastega opened a
single-target cursor, put a hairline bracket over one ally, and the engine then
— correctly — buffed all three. That is the defect in the Chapter 3 screenshot
Bailey sent with *"it's not clear which ally is being selected for buffs"*.

`resolveTargetMode` (`src/ui/ffx/CommandMenuLogic.ts`) gains a fourth case,
`{ mode: 'all', targets }`, for `all-enemies` / `all-allies` / `all`. A caller
that builds an `AvailableCommand` by hand — a fixture, a mock screen — omits
the field and gets exactly the old behaviour.

Also additive on the presentation side, and not a `docs/CONTRACTS.md` file, so
recorded here only because the HUD boundary moved: `HudPort` gains an optional
`setTargetingPort(port)`. A HUD with no 3D field behind it (the mock screens)
never receives one and falls back to a fixed box, as before.

## 2026-09-19 — combat fix pass: the FFX content registry carries Rikku's Mix table

Key `builda-combat` (fix pass, after an adversarial verifier refuted two of the
track's claims). **FFX only** [AGENTS.md hard rule 14]: Mix, Steal and the
`Use` submenu are FFX commands in FFX data resolved by the FFX CTB engine, and
nothing under `src/battle/ffx2` was touched. No shape in
`src/battle/common/types.ts` changed. Additive.

**1. `FFXContentRegistry` gains `addMixRecipes` / `mixResult` / `mixPairs`, and
`registerFFXMixRecipes` joins `registerFFXAbilities` / `registerFFXItems`**
(`src/battle/ffx/registry.ts`, wired at the documented boot join in
`src/app/screens/BattleScreenContent.ts`). `src/data/ffx/mixes/recipes.ts` has
shipped `MIX_RECIPES` since the data pass with **no reader anywhere in the
project**, so `MixResult.resultAbilityId` was `null` on every path and Mix —
Rikku's Overdrive in all three FFX builds — spent a full gauge and emitted no
event at all. The layering rule keeps `src/battle/**` out of `src/data/**`, so
the table arrives exactly the way abilities and items do.

**2. `MixResult.resultAbilityId` is now optional in practice, not required.**
The contract already describes the field as the resolved id "or `null` when the
pair has no recipe"; `execute.ts` now resolves the pair itself from
`MixResult.ingredients` when the overlay left it `null`, and a pair with no
recipe is **refused out loud** (`"Mix failed!"`, the wording the `MessageKind`
doc comment already uses) with the gauge kept, instead of resolving a
`formula: 'none'`, `hits: 0` record in silence. An overlay that does resolve the
pair is still honoured, so no caller has to change.

**3. A connecting FFX hit that computes to 0 now emits `damage` with
`amount: 0`.** Not a shape change — the event and its range already allow it —
but a behaviour change for anything that counts `damage` events. §291's
`immune_to_percentage_damage` enemies "take 0", and §5.7 authors Bio Fury and
Death Fury at `power: 0` on purpose, so suppressing the event made three
shipped Overdrive rows invisible. `formula: 'none'` actions (Steal, Cheer,
`Use`) never ran a damage chain and are excluded.

## 2026-09-19 — critic round 02, combat track: two readers for fields that had none

Key `builda-combat`. No shape changed; two doc comments in
`src/battle/common/types.ts` were corrected to describe a reading the data
already relied on, and `src/battle/ffx/state.ts`'s `FFXRuntime` gained one
private field. Additive.

**1. `EnemyDef.doomTurns` / `EnemyFields.doomTurns` (doc only).** The comment
said "when this enemy **inflicts** it". `src/data/ffx/enemies/braskas-final-aeon.ts`
sets `doomTurns: 3` on Yu Yevon for the opposite reading and says so inline —
`research/ffx-bfa-yu-yevon.md` §3.1: *"Doom counter kills Yu Yevon in exactly 3
turns (e.g., Candle of Life)"* `[verified: 2 sources]`. The field had **no
reader at all**, and the Candle of Life's own `duration: 254` is a placeholder
its record calls one, so the Doom route set a 254-turn timer and killed nobody.
`statuses.ts applyStatus` now lets a target's own `doomTurns` win over the
ability's duration, and the comments describe both directions.

**2. `AbilityDef.targeting` on `reflect` — `single-ally` -> `single-any`.** Data,
not a type: the old value was tagged `[estimate]`, and §3.5 names casting
Reflect **on Yu Yevon** as one of the five documented ways the fight ends. It
could not be aimed at an enemy at all. Protect and Shell are untouched.

**3. `FFXRuntime.progress` (additive, engine-private).** `{ bestEnemyHp,
atTurn }`, feeding a stalemate guard in `engine.ts`: 400 turns with no new low
on the enemy side's total HP ends the battle as `'escape'`. `FFXRuntime` is not
a published contract shape — it never reaches `state()` — but it is listed here
because the guard changes when a battle can end. Every canonical route out of
Yu Yevon reaches a new minimum inside a handful of turns; the longest intended
line in the project wins in ~195.

## 2026-09-19 — Chapter music fields say which boss theme scores which fight

Critic round 02 #02: every boss fight was scored with the generic `battle-ffx`,
and the boss cue the pre-scene had faded in was crossfaded straight back out on
the frame the battle screen appeared. The formations' own declared cues
(`seymour-flux.ts:217`, `yunalesca.ts:157`, `braskas-final-aeon.ts:247`/`:481`,
`bahamut.ts:114`, the four Vegnagun parts, `shuyin.ts:90`) were dead data: the
only reader of `EnemyGroupDef.musicCues` was the *chained-link* branch of
`BattleScreen`.

**1. `src/data/encounters.ts` — `ChapterMusic.post` is now optional (additive).**

Every shipped `post` script opens with a `music()` step of its own (each one
`music(null, …)`: the chapter card lands in silence and the coda brings its own
theme up afterwards), so the flow's forced `chapter.music.post` was a 1.4 s
fade-in of `title` that the script immediately faded out. The field stays for a
chapter whose post scene is scored from outside; no chapter sets it now.
`BattleScreenFlow.playCutscene` only plays `scene`/`post` when the script does
not name a cue in its opening steps.

**2. `src/data/encounters.ts` — the five `music` records now name real cues.**

No type change. `scene` moves from `boss-dread` to each chapter's own scene bed
(`scene-gagazet`, `scene-zanarkand-dome`, `scene-dreams-end`,
`scene-bevelle-underground`, `scene-farplane`) and `battle` from `battle-ffx` to
each chapter's own boss theme (`boss-seymour`, `boss-yunalesca`, `boss-jecht`,
`boss-ffx2-aeon`, `boss-vegnagun`), with `phase2` naming the real second cue
where there is one (`boss-yu-yevon`, `boss-shuyin`) and dropped where there is
not. FFX chapters name only FFX cues and FFX-2 chapters only FFX-2 cues; the two
scores share none, and `tests/unit/flow-encounter-chain.test.ts` asserts it
rather than assuming it.

The fields keep their two jobs — the fallback when a formation or a script names
nothing, and the "this fight" group in the pause menu's jukebox
(`PauseScreen.chapterMusicKeys`, `CHAPTER_META.musicKeys`). Both now list what a
player actually hears.

**3. `src/data/chapter-meta.ts` — `musicKeys` follows.** Each chapter's dossier
listed `['boss-dread', 'battle-ffx']`; it now lists that chapter's own cues,
including the ending cue its coda plays.

Note left for the owner: once boss routing is right, `battle-ffx` ("We can win
this") and `boss-dread` ("Something is watching") have no encounter left in a
five-boss game. They are still in the jukebox and are listed as deliberately
unwired in `tests/unit/audio-cue-reachability.test.ts`. Whether the FFX arc
should gain a normal-battle or approach cue is Bailey's call.

## 2026-09-17 (third pass) — Chapter 3: Doublecast resolves, and Lulu's Overdrive is reachable

Key `braskas-final-aeon`. One engine change, in one function, reached only by an
ability whose **own data record** asks for it. No shared type changed: the hook
it uses, `AbilityCommand.wrappedId`, has been in `src/battle/common/types.ts`
since the contract was written, documented as *"Doublecast / Copycat wrapper:
the ability id this one is repeating"*, and had **no reader anywhere in the
engine**.

**1. `src/battle/ffx/execute.ts` (additive) — Doublecast did nothing.**

`research/ffx-bfa-yu-yevon.md` §4.2's recommendation for this chapter's preset
grants *"Doublecast + Firaga/Thundaga"* by name `[verified: 2 sources]`, and
`src/data/ffx/builds/dreams-end.ts` gives Lulu both. The ability record
(`data/ffx/abilities/special-rikku.ts`) carries
`extra.castsTwoBlackMagicSpells: true` and a note saying *"the two chosen spells
own MP costs are paid separately by the engine"* — but `formula: 'none'`,
`power: 0`. Nothing read the flag, so submitting the row the menu offered
resolved a no-damage, no-status ability and **spent the turn**.

`executeCommand` now routes any `kind: 'ability'` command whose resolved def
sets that flag to a new `resolveDoublecast`:

* the wrapped spell is `command.wrappedId`, and it must be **Black Magic the
  caster has actually learned**; a command that arrives without a usable one
  falls back to the strongest spell the caster can pay for twice, rather than
  being refused — refusing a row the menu offered is how a headless caller ends
  up resubmitting it for ever (cf. decision 9);
* **both casts pay their own MP**, and the second is skipped if the first
  emptied the pool;
* **two targets are honoured**: `targets` of length 1 sends both casts there,
  length 2 sends one each, which is FFX's own "a spell and a target, twice";
* the turn is charged at Doublecast's own **rank 3** — that is the ability, and
  the whole of its power.

Scope: only `doublecast` sets the flag today, and only `dreams-end`'s Lulu is
granted it. Every other ability, build and chapter is untouched. The change
makes the *player* stronger, which is the one direction this file usually does
not go, so to be explicit: it is not a tuning lever, it is an ability the
research grants and the engine was silently eating.

**2. `src/engine/tactics/braskas-final-aeon.ts` — Lulu's Overdrive was unreachable
(tactic-side, no engine change).**

`data/ffx/abilities/special-menu-markers.ts` flags this itself, in its own doc
comment: the generic `'fury'` id is a menu marker and *"it is not what an
`OverdriveCommand.id` should actually be for Lulu — that must be one of the 19
tier-specific ids"*, with the gap recorded as unclosed by either the builds
agent or the UI. `dreams-end` lists `unlockedOverdriveIds: ['fury']`, so the
only Overdrive row she is ever offered is refused outright by `execute.ts` as a
marker. The Chapter 3 tactic now reads the row for **availability** and submits
one of the ids the marker's own `resolvesToOneOf` names, exactly as it already
does for the Talk trigger command. **The underlying gap is still open for the
builds/UI owners** — every other chapter that fields Lulu still has a dead
Overdrive row.

(Measured aside, recorded so nobody re-derives it: firing it is *not* worth a
turn in this encounter. Every `<spell>-fury` record is `targeting: 'random-enemy'`
at a fraction of the spell's power — five casts of 583-607, two of which went
into a Yu Pagoda — against 3,810 for the Doublecast it displaced. The tactic
therefore leaves the gauge unspent and says why.)

**3. Not an engine change, but it belongs next to them: `dreams-end` now carries
§4.4's Stoneproof rule.** §4.4 `[verified: 2 sources]` asks for *"exactly one or
two Stoneproof pieces"* so that *"the Jecht Beam → shatter threat is a real,
solvable decision rather than a coin flip"*. The build had inherited **seven**
from `research/ffx-seymour-flux.md` §7.7.2 loadout C, which made Petrify land
zero times in a full chain and §1.6's "signature lethality" inert; it now carries
**two**, on Yuna and Lulu. This closes the blocker the previous round's verifier
raised, by applying the chapter's own research rather than by documenting the
conflict. The cross-document conflict with §7.7.2 is real and still wants a
research ruling; this chapter's own `[verified: 2 sources]` section wins for
this chapter's own build.

## 2026-09-17 (second pass) — Chapter 3: the Yu Pagoda revive rule, FFX chain inventory, `max-hp-x2`

Key `braskas-final-aeon`. Everything here was found by running the chapter
headlessly through the shipped `intendedStrategy`, end to end across all seven
links, and by three verifier findings against the first pass of the same day.
**All four changes make the game harder or stricter, none easier.** Item 2 is
behaviour **every FFX chain sees**; item 3 is behaviour every FFX chapter sees.

**1. `src/battle/common/types.ts` (additive), `src/battle/ffx/{state,setup,hp,engine}.ts`,
`src/data/ffx/enemies/braskas-final-aeon.ts` — the Yu Pagodas never revived.**

`ffx-bfa-yu-yevon.md` §1.4 heads the rule "**Revive rule (critical to implement
correctly)**" [verified: 2 sources]: a destroyed Yu Pagoda returns with
`new max HP = 5,000 + excess damage from the killing blow` after **63 ticks** in
the Braska's Final Aeon fight (its own AGI 40 → base 7 → rank-3 recovery 21 →
3 × 21) and **72** in the possessed-aeon and Yu Yevon fights, then re-enters the
CTB queue at `baseCTB × 3` like a revived character. Nothing implemented it and
no data field could carry it, so two swings on turn 20 switched the boss's
entire heal / cleanse / Overdrive economy off for the remaining 170 turns of the
fight: measured, both pillars were permanently dead from turn ~21 of a ~190-turn
battle, Power Wave was cast four or five times in a whole encounter, and §1.6's
own tuning table sat on its "both Pagodas down" row (10-20 % gauge a turn)
instead of its "both alive" row (60 %) for 89 % of the fight.

* `EnemyDef` and `EnemyFields` gain one optional field, `reviveRule:
  { delayTicks, baseMaxHp }` (`PartReviveRule`). Purely additive; every existing
  enemy omits it and is unaffected.
* `FFXRuntime` gains `pendingPartRevivals`, a list of `{ id, atTicks, maxHp }`
  against `state.ticks` — the field-wide CTB clock, not a turn count, because a
  dead part takes no turns of its own.
* `hp.ts` gains `schedulePartRevival` (armed from `dealDamage`, which is the only
  place the killing blow's *excess* is knowable) and `resolveDuePartRevivals`,
  which `engine.ts advance()` calls once per turn straight after the clock moves
  and before the next actor is chosen. `restorePart` already existed and had no
  caller.
* Both Yu Pagodas now ship `reviveRule`.

This makes Chapter 3 a materially harder and much longer encounter — Power Wave
now lands 40 to 80 times a fight rather than four or five — and the chapter's
tactic was rewritten around it. See `docs/handoff/play-braskas-final-aeon.md`.

**2. `src/battle/ffx/{state,execute,ticks}.ts` — an FFX chain silently
restocked the whole item bag at every link.**

`app/screens/BattleScreenSetup.ts carryInventory()` reads
`state.flags['inventory:<itemId>']` and returns the build's original count
untouched when that flag is absent. Only the FFX-2 engine ever wrote it; the FFX
engine keeps its counts in `rt.inventory`, a `Map`, and nothing mirrored them.
So every FFX chain refilled the bag between links: measured on Chapter 3, whose
seven links share one inventory, the party spent **25-36 X-Potions out of a
build that owns 10**, and the count printed after each link was still 10. A new
`state.ts spendItem(ctx, id)` is now the single place the FFX engine decrements
an item, and it mirrors the new count into the flag. `execute.ts` (the Item
command) and `ticks.ts` (Auto-Potion / Auto-Med / Auto-Phoenix) both go through
it. **Chapter 5's FFX-2 chain is unaffected** — it already wrote the flag.
Chapters that are a single battle are unaffected either way.

**3. `src/battle/ffx/statuses.ts` — `max-hp-x2` and `max-mp-x2` were statuses
with no effect.**

Both are listed in `MIX_FLAGS`, both are applied by shipped items (Stamina
Tablet, Stamina Tonic, Mana Tablet, Mana Tonic) and by four Mixes, and nothing
in the engine read either one — so the Stamina Tablets `ffx-bfa-yu-yevon §4.4`
puts in the Dream's End bag were inert. `applyPoolDoubler` now moves the ceiling
on apply and puts it back on removal (including the KO path, which `wipeStatuses`
takes), clamping current HP/MP under the new ceiling and capping at §9's
99,999 / 9,999. The status record's own wording is honoured exactly: *"No
immediate healing — existing current HP is unchanged, only the ceiling rises."*
Any chapter whose build carries one of those items will now see it work.

**4. `src/data/ffx/builds/dreams-end.ts` — two loadout corrections against
§4.4.**

* The inventory preset in §4.4 reads "**2 Stamina Tonics**"; the build shipped
  `stamina-tablet`. A Tablet is `single-ally`, a Tonic is `all-allies`, so the
  shipped pair doubled two HP bars where the research's pair doubles the party's.
* The three actives' **Strength**, and **Auron's Agility**, are re-derived —
  this is the round's one deliberate deviation from a published preset and it is
  documented in full, with its measurement table, in that file's
  `PRESET_CORRECTION` comment. In short: §4.1 labels its entire stat block
  `[estimate]` and says the preset "should be tuned so the fight is winnable";
  with item 1 live, §4.1 as published loses link 1 **200 times out of 200** under
  every tactical line measured; §4.4 [verified: 2 sources] publishes the
  encounter's only offensive anchor, "Yuna's Strength at least 28", against
  §4.1's 20, so that ×1.5 ratio is applied to Tidus (32→48), Yuna (20→30) and
  Auron (42→50, clamped to the upper band `tests/unit/data-ffx-builds.test.ts`
  holds every chapter's preset to). Auron's Agility goes **22 → 29**: §4.1 gives
  the party's entire damage output the *lowest* Agility of all seven characters,
  which puts a rank-3 Attack at 30 ticks against Tidus's 21. Measured: published
  preset 0 %, Strength alone 84.5 %, Agility alone 10.5 %, both **96.2 %**
  (962/1000). No other stat on any character moved and **no enemy number moved
  at all**.

**5. `src/battle/ffx/ticks.ts` — Auto-Med threw a Remedy away on every hit.**

`AUTO_MED_ORDER`'s last row is `['remedy', 'any']` and the `'any'` sentinel
matched unconditionally, so an Auto-Med wearer consumed a Remedy after *every
damaging action that touched them*, healthy or not. Auron carries Auto-Med in
the Dream's End build and emptied the six-Remedy bag inside the first minute of
Chapter 3 — which started mattering the moment item counts carried between links
(item 2). It now fires only when the wearer actually has one of the ailments a
Remedy cures (`REMEDY_CURES`), Petrify included, which is the answer §4.4 names
for a character without Stoneproof. Any chapter whose build carries Auto-Med
will now spend fewer items and cure the same ailments; measured cost to Chapter
3, 97.0 % → 96.2 %.

Not fixed, deliberately, and carried as a blocker in the round's report:
`ffx-bfa-yu-yevon §4.4`'s "exactly one or two Stoneproof pieces" against the
seven the build inherits from `ffx-seymour-flux §7.7.2` loadout C. It is a live
cross-document conflict, it deletes this chapter's signature Jecht Beam →
shatter chain (measured: zero Petrify applications in a full chain), and the
instruction this agent works under forbids deleting an inherited ability.
Measured cost of applying it anyway: **96.2 % → 85.0 %**.

## 2026-09-17 — Chapter 3: the chain, the Pagodas, the Overdrive gauge, Sleep, MP items, the fayth's Auto-Life

Key `braskas-final-aeon`. Found by running the chapter headlessly through the
shipped `intendedStrategy`, end to end across all seven links
(`tests/unit/strategy-braskas-final-aeon.test.ts`). Before this round the
chapter was a guaranteed defeat on turn 128 of link 1; after it, 1,138 wins in
1,200 contiguous seeds (94.8%). **One additive type change** (item 6); the rest
are engine and data. Items 4, 5 and 6 are behaviour **every FFX chapter sees**,
so Chapters 1 and 2 should re-measure.

**1. `src/data/ffx/enemies/braskas-final-aeon.ts` — the chapter's chain was
severed after link 1.**

`braskasFinalAeonGroup.nextGroupId` read `'possessed-aeons'`, which no formation
exports. `BattleScreen.runEncounter` logged `chapter chains to "possessed-aeons"
but no formation exports that id` and **stopped**, so the possessed-aeon
gauntlet and Yu Yevon were unreachable in play. It now reads
`'possessed-valefor'`, the head of the default five-mandatory-aeon chain
(`ffx-bfa-yu-yevon.md` §2.1, acquisition order). A caller with a different
roster still overrides it by rebuilding with `buildPossessedAeonChain`.
`tests/unit/story-triggers.test.ts` carries a `DANGLING_CHAIN_LINKS` workaround
for exactly this and says to delete the entry when the data is fixed; its walk
now follows the real link, so the entry is dead weight rather than load-bearing.

**2. `src/battle/ffx/ai/braskas-final-aeon.ts` — no Yu Pagoda in the chapter
ever cast Power Wave.**

The data names the two rotations by context, `yu-pagoda-bfa` and
`yu-pagoda-aeon`, because the two Power Wave records differ (§1.4, §2.3). Only
`yu-pagoda` was registered, so `chooseAiCommand` fell through to its plain-Attack
fallback: the boss was never healed for 1,500, never cleansed, and never got the
+20% to his Overdrive gauge. Both ids are now registered against the same
rotation.

**3. `src/battle/ffx/ai/braskas-final-aeon.ts` — Braska's Final Aeon never used
a single Overdrive, in either form, and the Talk trigger command was inert.**

`setup.ts` builds an `overdrive` block for party members and for aeons and for
nobody else, so `ai.self.overdrive` on an enemy is `undefined` and the gauge
check in his own script could never be true. Measured before the fix: 200
battles, zero Triumphant Grasps, zero Ultimate Jecht Shots, zero Jecht Bombers.
`execute.ts`'s Talk handler zeroed `boss.overdrive.gauge`, which does not exist,
so the Trigger Command — the encounter's designed panic button — did nothing at
all. That is the whole of §1.6 and of §7's checklist item 2.

The gauge now lives on `ctx.state.flags['bfa.gauge']`, the bag this script
already used for `bfa.talkPending` and which both Pagodas and `consumeBfaTalk`
can reach. **`bfaGauge` returns the higher of the flag and
`boss.overdrive?.gauge`**, so a future `setup.ts` that does give enemies a gauge
takes over without a second change, and `tests/unit/ffx-ai.test.ts`'s fixtures
keep working unmodified. Rates are §1.6's: +20 flat per Power Wave
[verified: 2 sources], 0–10 per damaging player **action** against him, and 0–10
when he acts [estimate]. "Per action" is counted off `hitIndex === 0` in the
event log — the same counting rule §3.4.1 states for Yu Yevon's counter. The
gauge carries across the form transition and is not reset (§1.6, §1.7).

The same file now also gates a **possessed aeon's** Overdrive on its own gauge
(15–30 per Power Wave, 0–10 targeted/acting — §2.3's figures are the only
quantified enemy-gauge numbers published anywhere). `POSSESSED_AEON_ABILITY_IDS`
flattens §2.2's "Attack, <special>, <Overdrive>" into one list, so the script
picked Diamond Dust or Mega Flare as an ordinary 50% roll: a 9,999 party-wide
Overdrive on the aeon's first real turn. The split is made off the ability's own
`category === 'overdrive'`, so no data change was needed.

**4. `src/battle/ffx/abilities.ts` — Sleep was permanent, and it was a
soft-lock, not a fidelity gap.**

`state.ts canAct` drops a sleeper out of the CTB queue entirely, and
`ticks.ts onTurnEnd` is the only caller of `tickDurationStatuses` — so a sleeping
actor never reaches a turn end and its 3-turn Sleep never counts down. One Yu
Pagoda Curse put Tidus to sleep on turn 17 of a 204-turn battle and he never
acted again. A landed **physical hit now wakes a sleeper**, which is what the
shipped status record already said it did in as many words
(`data/ffx/statuses/core.ts` `sleep`: "Physical damage wakes the sleeper; magic
damage does not", with `curedBy` listing "any physical hit"; `ffx-combat-core.md`
§4.2). Residual, not fixed here: a sleeper nobody hits and nobody cures is still
out for good.

**5. `src/battle/ffx/formulas.ts` — `poolOf` now reads `extra.restoresPool`, so
Ether, Turbo Ether, Elixir, Megalixir and the MP mixes restore MP again.**

`AbilityDef` has no pool field of its own, and the data layer says so above
Ether's record ("no separate 'pool' field, so the pool is noted via
`extra.restoresPool`"). Nothing read it, so every MP restorative healed HP
instead — which deletes the MP economy of any long fight.
`tests/unit/strategy-chapter2.test.ts` already had this written up as a known
gap it did not own. Restricted to records carrying the `heals` flag, so a
damaging record that happens to carry the key cannot change pool.

**6. `src/battle/common/types.ts` (ADDITIVE), `src/battle/ffx/setup.ts`,
`src/battle/ffx/hp.ts`, `src/data/ffx/enemies/braskas-final-aeon.ts` — the
fayth's permanent Auto-Life.**

`EnemyGroupDef` gains one optional boolean, `grantsPermanentAutoLife`. §2.3
[verified: 3 sources]: from the possessed-aeon fights onward the whole party
carries a permanent, non-consumable Auto-Life granted by the fayth, a KO'd
member revives immediately, and the consequence the same table draws is that
**those battles cannot be lost** — the only documented loss being deliberate
party-wide self-petrification, which is unaffected because Petrify is not a KO.
Nothing applied it. `setup.ts` now applies it to every member, active and
benched, when the formation sets the flag; the five possessed-aeon formations
and `yuYevonGroup` set it.

`hp.ts koActor` also **stopped consuming it**. That function already told a
permanent Auto-Life apart from a cast one — it emits `cause: 'fayth'` for the
permanent case — and then removed it anyway, so the unlosable half of the rule
survived exactly one KO a head. A cast Auto-Life is still consumed. A revived
member still loses its other buffs, which is §2.3's own "KO revival loses buffs".

**7. `src/battle/ffx/setup.ts` — a possessed aeon now mirrors the player's own
aeon's stat block.**

§2.2 [verified: 2 sources]: the bestiary lists a possessed aeon's HP as "Yuna
Valefor HP" and its Strength / Magic / Defense / Magic Defense / Agility /
Accuracy / Evasion as "Varies"; only Luck is fixed, forced to **1**. It is a
live copy, not a table, which is why `data/ffx/enemies/braskas-final-aeon.ts`
ships `stats: { hp: 1, … }` placeholders with a doc comment saying the engine
must overwrite them at setup. Until it did, all five possessed aeons stood up
with **1 HP** and died to the first hit, which made five of the chapter's seven
links a walkover. `mirrorPossessedAeon` is a no-op for every other enemy in the
game: the id has to start with `possessed-` *and* name an aeon the party owns.

**Order matters here.** Items 3 (the aeon's Overdrive gate), 6 (the fayth's
Auto-Life) and 7 (the mirror) are one change, not three, and shipping any of
them alone makes the chapter *less* canon rather than more: the mirror alone
took the gauntlet from 197/200 to **0/200**, because real aeon stats plus an
ungated Overdrive plus no Auto-Life is a turn-9 party wipe in a sequence §2.3
says cannot be lost at all.

## 2026-09-17 — FFX-2 charges Darkness's HP cost, calls `onDamaged`, and gives MP back

Key `ffx2-vegnagun-shuyin`, second round. Three more defects of the same shape
as the five below: a field the data layer writes and the engine never reads. All
three are FFX-2-wide behaviour, so **Chapter 4 must re-measure Bahamut against
them**. None changes a type; all three are additive.

The first two make the game **harder**. Chapter 5's line was winning 92.5% of
chains while two of the chapter's defining mechanics were switched off; with
them on, the same line fell to 23/40 and had to be rebuilt.

**1. `src/battle/ffx2/resolve.ts` + `targeting.ts` — an ability's HP cost was
never charged.**

`AbilityDef.extra.hpCostPercent` is written by exactly one definition in the
game, `x2-dark-knight-darkness`, which sets `12.5` with a comment citing
`research/ffx2-vegnagun-shuyin.md` §6.4: "**12.5% (1/8) of user's max HP**"
`[verified: 2 sources]`. §7.1 names that cost as the ability's entire downside
("Its cost is HP, not MP"). `resolveAbility` deducted `ability.mpCost` and
nothing else, and `performCommand` forwarded `ability.extra` only as minigame
`params`, so the strongest player ability in Chapter 5 — special damage to all
enemies, ignoring Defense, long range — was free. Measured on Chapter 5's own
chain the unpaid cost is **65,442–83,430 HP per chain**, over ten full party
bars.

Now: `targeting.ts` exports `hpCostFor(actor, ability)` (percent of the actor's
max HP, waived under Spellspring when `extra.freeUnderSpellspring` is set, 0 for
every other ability in the game) and greys the row out with `'Not enough HP'`
when she cannot pay, exactly as the MP row above it does — §6.4's "fails if the
user cannot pay it". `resolveAbility` deducts it beside the MP cost and emits a
`damage` event on the caster so the HUD shows it. Because the row is disabled
when `hp <= cost`, the subtraction floors at 1 and can never KO the caster; it
is a cost, not an attack, so it registers no chain and cannot crit.

**2. `src/battle/ffx2/engine.ts` — `AiScript.onDamaged` was declared and never
called.**

`internal.ts` has always declared `onDamaged?(ctx, sourceId, amount)` and three
FFX-2 scripts have always implemented it. Only `onTurnResolved` was ever
invoked, so all three implementations were dead code and three canon mechanics
were silently inert:

- **§3.3's Core attack log** — the Core records who hit it and with which
  mitigation class, and the Bulwarks answer in kind on their next turn. §3.3
  calls this "**the fight's whole identity**". Censused over 20 Body fights and
  338 Darkness casts before the fix: **zero** occurrences of "Hostile activity
  detected", "Physical attack detected" or "Magical attack detected", and the
  party took literally zero damage across the entire Body fight. After: eight
  retaliations in a single fight.
- **§3.2's Node colour machine**, which advances "on (own turn resolves) **OR**
  (hit by any attack)". Without it the GREEN face — Cura, Regen, Shell and
  Protect **on the Leg** — came up half as often as it should, and the all-enemy
  player rows carried no downside at the Leg at all.
- **§3.4's Odi Et Amo counter**, which fires the game's hardest buff-wipe after
  a fixed number of hits on the Head.

Wired in `afterAction`, driven off the event drafts the finished action
produced rather than from inside `resolve.ts`: each enemy that took damage is
notified **once**, with the action's total, counters included, and the event
log's ordering is untouched. An HP cost paid by a party caster is excluded — it
is the caster paying for her own ability, not a hit on her.

**3. `src/battle/ffx2/resolve.ts` — every MP restorative in X-2 was inert.**

`extra.restoresMp` (Ether 100, Turbo Ether 500, the Alchemist's Stash-Ether) and
`extra.alsoRestoresMp` (Elixir and Megalixir, which `ffx2-combat-core.md` §5.5
gives as "up to 9999 HP **and 999 MP**") were written by the data layer and read
by nobody, so the six Turbo Ethers §6.8 stocks for a five-battle chain with no
menu between links could not refill a single spell. `resolveAbility` now applies
either field to each living target and emits `mp-heal`. This one favours the
player; it is a restorative doing what its own description says it does.

## 2026-09-17 — FFX-2 gets an Item command, accessories, and three damage-rule repairs

Key `ffx2-vegnagun-shuyin`. Five defects found by running Chapter 5 — the
five-battle Vegnagun chain into Shuyin — headlessly through the shipped
`intendedStrategy` (`tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts`). None
changes a type. All five are behaviour **every** FFX-2 chapter sees, so Chapter
4's agent should re-measure Bahamut against them.

**1. `src/battle/ffx2/targeting.ts`, `setup.ts`, `execute.ts`, `engine.ts` — the
FFX-2 command menu never offered an Item row, so the party's inventory was
unreachable.**

`execute.ts` has always resolved a `kind: 'item'` command, `Ffx2EngineOptions`
has always carried an `items` registry, `FFX2PartyBuild.inventory` has always
been populated, and `BattleScreenSetup.carryInventory` has always read the item
counts back out of `state.flags['inventory:<itemId>']` when a chained link hands
the party on. Nothing wrote those flags and nothing built the rows, so the whole
inventory was decorative: `farplaneBuild` ships 25 Phoenix Downs, 20 X-Potions
and the Light and Lunar Curtains that `research/ffx2-vegnagun-shuyin.md` §7.2
opens the Shuyin fight with ("Light Curtain (Protect) on all three + Lunar
Curtain (Shell) on all three"), and a player could reach none of them.

Additive, and it follows the FFX side's shape (`src/battle/ffx/commands.ts`):

- `buildState` seeds `flags['inventory:<itemId>']` from the build, then from
  `options.carriedParty.inventory` when a chain hands one in, and exports
  `inventoryCounts(state)`.
- `MenuContext` gains optional `items` and `inventory`; `buildCommands` appends
  one `category: 'item'` row per stocked, `usableInBattle` item, with the
  **item's** `targeting` (a Phoenix Down is `single-ally`) and the effect
  ability's `flags` (so `can-target-dead` keeps a KO'd girl selectable). No rows
  while Berserk or Itchy, per §2.8.
- `performCommand` decrements the count on the **resolving** action, not on the
  pick, so an interrupted charge does not eat the stock.

A UI that reads `AvailableCommand.category` will now see `'item'` rows in FFX-2
where it previously saw none. `src/ui/ffx2/CommandMenu.ts` already groups by
category, so this is new content in an existing submenu, not a new shape.

**2. `src/battle/ffx2/adapters.ts` — every `percent-total` revive and item heal
in `src/data/ffx2/**` landed at a sixteenth of its value.**

`types.ts` defines `percent-total` as `targetMaxHP * DmgCon // 16`, and this
folder's own baseline tables are written in those units (`tail-beam` `power: 5`
for 5/16, `full-life` `power: 16` for a full revive). Every `percent-total`
definition in the **data** layer instead writes the plain fraction — Phoenix
Down `0.25`, Life `0.5`, Full-Life `1.0`, White Wind `0.375`, X-Potion /
Elixir / Megalixir `1.0`, Machina Maw's Revival `0.5`, and the Core's and the
Head's own Full-Life and Acta Est Fabula `1.0` — each with a comment saying so
("revives at 50% max HP [ffx2-combat-core §2.3]"). Fourteen definitions across
eight files, consistently.

Read literally against the engine's units they were all sixteen times too small:
a Phoenix Down stood a girl up on **1.6%** of her bar against §2.3's sourced
"Phoenix Down 25%, Life spell 50%, Full-Life 100%" `[verified: 2 sources]`, an
X-Potion healed 6.25% instead of the full bar, and the Core revived a 3,000-HP
Bulwark on 187. Revival simply did not work.

Converted at the one seam between the two conventions —
`abilityRegistryFrom` — rather than by editing fourteen data definitions or by
changing a formula the baseline tables depend on. A `power` above 1 is already
in DmgCon units and passes through untouched, so the normalisation is idempotent
if the data layer is ever rewritten to the documented shape.

**3. `src/battle/ffx2/resolve.ts` — a heal registered a Chain hit.**

The Chain does three things to a target: raises the damage of the next hit,
removes its evasion, and locks it out of starting an action while the window is
open (`ffx2-combat-core.md` §1.7). `resolveAbility` called `registerHit` for
every ability with a formula, **including restoratives**, which turned the
party's own healer into the boss's best weapon. Measured on the Tail, seed 7:
Yuna's Pray opened a 2-second window on all three girls and the Noli Me Tangere
107 ticks later landed at ×1.45 for **1,869 / 1,812 / 1,741** against §1.2's
sourced band of **1,171–1,323**, one-shotting the White Mage from full; the same
window also froze whoever had just been healed. Now an ability that `heals`
(flag or the `healing` formula, spelled exactly as `formulas.ts` spells it)
neither registers a chain nor emits a `chain` event. Revives already skipped it.

**4. `src/battle/ffx2/accessories.ts` (new) + `setup.ts` — accessories did
nothing.**

`setup.ts` has always documented a girl's stat block as
`level + dressphere + garment grid + accessories` and every build file annotates
what it equips ("max HP +100%", "Str +30"). Only the first three terms were ever
computed. The new module is the engine's cited baseline for §5.4's statistic
accessories, in the same spirit as `dressphere-stats.ts` and the fallback Grids
in `garment-grids.ts`; a `AccessoryDef` data registry may supersede it later.
Stats only — Ribbon's immunity and Adamantite's constant Protect/Shell are
statuses and are not modelled.

Chapter 5's case: §7.2 makes the Tail fight's whole survival condition "keep
everyone **above 1,323 HP**" (Noli Me Tangere is a flat 1,250 constant of
`damageType: 'other'`, so nothing mitigates it and §7.2 says outright that "raw
max HP is the only defence"), and §6.3/§6.7 answer it with a Crystal Bangle on
all three. With accessories inert a Lv 46 White Mage stood at 1,244 max HP and
died to the first Noli Me Tangere of the chain, from full, with no play
available. **Chapter 4's `bevelleBuild` equips six accessories too and will get
stronger; re-measure Bahamut.**

**5. `src/data/ffx2/abilities/dark-knight.ts` — Darkness was typed
`physical`.**

`damageType` is the field flowchart step 16 (Protect/Shell) and the Bulwarks'
retaliation log both read. §6.4 calls Darkness "**Special** damage to ALL
enemies. Ignores Defense. Long range. Cannot crit", and §3.3's retaliation table
names it explicitly under the third class: "the third class (NONE, i.e.
Darkness/Charon/fixed/fractional player abilities) gets answered with the
single-target buff-strip instead of the AoE". Typed `physical`, every Darkness in
the Body/Core fight was answered with "Physical attack detected" — 5/16 of max
HP to the **whole party** from **both** Bulwarks — instead of "Hostile activity
detected" on the caster alone, roughly ten times the retaliation the encounter is
built around. Now `damageType: 'other'`, and `crit-eligible` is dropped to match
§6.4's "Cannot crit". This also stops an enemy Protect halving it, which is
correct: the Nodes cast Protect on the Leg and the Right Bulwark on the Core.

## 2026-09-17 — FFX-2 `validTargets` is the legal pool, and Bahamut's party-wide magic cannot be evaded

Key `ffx2-bahamut`. Two defects found by running Chapter 4 headlessly through
the shipped `intendedStrategy` (`tests/unit/strategy-ffx2-bahamut.test.ts`).
Neither changes a type; both change what the FFX-2 engine *reports* and both are
behaviour other chapter agents will see, so they are recorded here.

**1. `src/battle/ffx2/targeting.ts` — `validTargetIds` returned one id for every
`single-*` ability, not the pool.**

`AvailableCommand.validTargets` is the cursor's candidate list — one entry means
"auto-target", several mean "let the player choose"
(`src/ui/ffx2/CommandMenu.ts:238`, `src/ui/ffx/CommandMenuLogic.ts:153`), and the
FFX engine fills it that way (`src/battle/ffx/commands.ts` offers Cure as all
three actives). The FFX-2 version computed it by running `resolveTargets` with a
stub RNG. That is right for `self` and the `all-*` modes and **wrong for every
`single-*` mode**, because `resolveTargets` exists to *choose*: it returned
`[pool[0]]`.

Measured consequence in Chapter 4: the White Mage's `Cure`, `Cura` and `Life`
were offered with `validTargets: ['yuna']` only — she could not heal Rikku or
Paine at all, through the menu or through any tactic, because both read this
list. On a multi-part boss the same bug pins every single-enemy row to the first
part.

Now: `single-enemy` returns every targetable opponent, `single-ally` every
targetable ally, `single-any` everyone targetable; `can-target-dead` still opens
the dead. Everything else still goes through `resolveTargets` unchanged.
**Not additive** — rows that used to carry one id now carry up to three. Callers
that assumed `validTargets[0]` is "the" target still work; callers that used the
length as a proxy for "is this single-target?" must read `ability.targeting`
instead.

**2. `src/battle/ffx2/abilities-core.ts` — Bahamut's Curse, Impulse and Mega
Flare were evadable.**

The engine's guard is `canMiss !== false`, so a flag that is merely absent means
"can miss". `src/data/ffx2/enemies/bahamut-abilities.ts` carries
`canMiss: false` on all three, but `src/battle/ffx2/ai/bahamut.ts` submits the
**engine-side** ids (`bahamut-curse`, `impulse`, `mega-flare`), so the record
consulted was the fallback table in `abilities-core.ts`, which omitted the flag.
Measured on seed 1 before the fix:
`{"type":"miss","targetId":"yuna","sourceId":"bahamut","reason":"evaded"}` on an
**Impulse** — party-wide fractional magic, dodged.

`research/ffx2-bahamut.md` §2.2 lists Impulse and Mega Flare as hitting "All 3"
with no accuracy term, and §1.1 is explicit that the evadable move is the
*physical* one. The three fallback entries now carry `canMiss: false`, matching
the data record. This made the fight **harder**, not easier.

Bahamut-only ids, so no other encounter's numbers move.

## 2026-09-17 — `'sensor'` event payload and `Combatant.revealed` (additive)

Key `ffx2-sensor`. Nothing in the project emitted a `'sensor'` `BattleEvent`:
`grep -rn "type: 'sensor'" src/` matched only the union member's own
declaration. Both HUDs already consumed it, so `src/ui/ffx2/BossGauges.ts`
printed its `SCAN` hint instead of enemy HP for an entire battle and
`src/ui/ffx/SensorPanel.ts` never opened. The FFX-2 engine now emits it; see
`docs/handoff/fix-ffx2-sensor.md`, including the read-only finding that **FFX
is still broken the same way** (its Scan sets an inert `scan` status, and the
`sensor` auto-ability on Kimahri's Spear has no reader at all).

Two additive, optional changes to `src/battle/common/types.ts`; nothing
existing changes shape and `npx tsc --noEmit` is clean.

- **`BattleEvent` `'sensor'` gains `hp?`, `maxHp?`, `mp?`, `maxMp?` and
  `weaknesses?: ElementId[]`.** A snapshot at reveal time, so a panel can print
  numerals from the event alone rather than reaching into `state()`. The fields
  being **absent** is meaningful: it is how the engine expresses X-2's `- - -`
  row for a target whose numbers stay secret (`immune-to-sensor`, or
  `flags.hideHpBar`). `immune-to-scan` still fails a full Scan outright, as a
  `'miss'` with `reason: 'immune'`.
- **`Combatant.revealed?: boolean`.** Latched when Sensor/Scan reveals a
  combatant and **never cleared**, so the reveal survives KO, form changes and
  a chained link. `state().combatants[id]` is the same object the engine
  mutates, so `state()` exposes it immediately.

For ability authors: mark a reveal in data with `extra: { reveals: 'scan' }`
(or `{ scan: true }` / `{ sensor: true }`). The FFX-2 engine checks that marker
first and only then falls back to matching `scan` / `libra` / `ma'at's feather`
in the ability's name or id — `src/battle/ffx2/**` cannot import
`src/data/ffx2/**`, so it has to recognise the action from the `AbilityDef`
shape. Support upgrades (`targeting: 'self'`, or carrying `extra.passive`) are
never treated as reveals, which is what keeps Scan Lv. 2 / Lv. 3
[ffx2-combat-core §3.7] out of it when they are transcribed.

## 2026-09-17 — OPEN ITEM: possessed-aeon accuracy bytes (no contract change)

Recorded here because it is a behaviour of the shared
`src/battle/common/types.ts` `AbilityDef` contract that data cannot express
today, not because any contract shape changed. Nothing is additive or
breaking; this entry exists so the gap is tracked somewhere other than a
file header.

**What.** The ten possessed-aeon Attack/Special records in
`src/data/ffx/enemies/braskas-final-aeon-abilities.ts` (`category: 'aeon'`:
`possessed-valefor-sonic-wings`, `possessed-ifrit-meteor-strike`,
`possessed-ixion-aerospark`, `possessed-shiva-heavenly-strike`,
`possessed-bahamut-impulse`, `possessed-anima-pain`,
`possessed-yojimbo-daigoro`, `possessed-cindy-camisade`,
`possessed-sandy-razzia`, `possessed-mindy-passado`) are typed
`damageType: 'physical'` (or `'magical'`, for Pain) but carry **no**
`accuracy` byte. `src/battle/ffx/accuracy.ts` tests `user.side === 'enemy'`
*before* the damage-type branch, so an enemy-side action with no byte takes
the ALWAYS-hit path: **all ten always hit**, and Darkness, Aim/Reflex stacks,
Evasion and the Luck differential never apply to them.

**Why it is still open.** No research source publishes an accuracy byte for
these rows, and none was invented:

- `research/ffx-bfa-yu-yevon.md` publishes exactly one accuracy byte in the
  whole chapter — Blade Blitz's 150, §1.3 line 105 — and none for §2.2's
  possessed-aeon movesets.
- `research/ffx-combat-core.md` §6.3's aeon table has no accuracy column.
  §2.11 line 476 says enemy ability rows carry their own byte
  `[verified: 2 sources]`, while §2.11 line 478 says aeon **Attack** variants
  use the `Accuracy x2.5` / `x1.5` hit formulas `[single source]`. A possessed
  aeon is an enemy made of an aeon, so the two rules point opposite ways.
- `research/ffx-bfa-yu-yevon.md` §2.2 line 350 lists a possessed aeon's own
  **Accuracy** stat as "Varies" (mirrored live off the player's aeon,
  `[verified: 2 sources]`) — which only means something if something reads it,
  and today nothing does. `possessedAeonEnemyDef` in
  `src/data/ffx/enemies/braskas-final-aeon.ts` ships `acc: 0` as an explicit
  placeholder for the live mirror.

**Shipped behaviour:** unchanged — always-hit, documented in that file's
header and asserted by `tests/unit/chapters/possessed-aeons.test.ts` so the
gap stays visible instead of looking intentional.

**To close it**, one of:
1. a decompiled per-row accuracy byte for ids 203–233, which the data agent
   then transcribes with a citation; or
2. an engine-side rule (owner: the engine agent) letting a possessed aeon's
   mirrored Accuracy stat feed the hit-chance table — e.g. honouring
   `extra.mirrorsCasterStats` before the `user.side === 'enemy'` shortcut, so
   §6.3's `x2.5` / `x1.5` Attack multipliers become meaningful.

Adding `accuracy: 100` by analogy with `left-arm-strike` is **not** a close:
that byte is itself an `[estimate]`, and copying an estimate across ten rows
would launder a guess into ten apparent data points.

## 2026-09-15 — `BattleResult.nextGroupId` and `FFX2MemberBuild.statuses` (additive)

Orchestrator decision 6 says "`victory` carries `nextGroupId`", but
`BattleResult` had no field for it, so the X-2 engine had nowhere to report the
next link of the Vegnagun chain. Two optional fields added; nothing existing
changes shape and both are `undefined` for a fresh, unchained encounter.

- **`BattleResult.nextGroupId?: string`**. Copied from
  `EnemyGroupDef.nextGroupId` on a **victory** only. The engine still never
  advances groups itself — it reports this and stops; the BattleScreen re-inits
  for the named group with the party's carried-over state and
  `BattleSetup.chained = true`. Both engines should populate it the same way.
- **`FFX2MemberBuild.statuses?: Partial<Record<StatusId, StatusInstance>>`**.
  The X-2 mirror of the `FFXMemberBuild.statuses` added in the entry below, so
  the BattleScreen's carry-over code is the same shape for both games. HP and MP
  were already carried by `hp` / `mp`; X-2 gate effects ride along on the
  carried `garmentGrid.passedGates`, since gate bonuses survive KO and revival
  and a chained link is the same battle [ffx2-combat-core §4.1].

For FFX-2 engine consumers: like the FFX engine, `src/battle/ffx2/**` imports
nothing from `src/data/ffx2/**`. It resolves `AbilityDef`s, dresspheres and
Garment Grids through registries passed to the `FFX2Engine` constructor, and
falls back to a small research-cited baseline (`src/battle/ffx2/abilities*.ts`,
`dresspheres.ts`, `dressphere-stats.ts`, `garment-grids.ts`) for any id the
injected registry does not know. Those fallbacks are scaffolding for the data
agent to supersede, not a second source of truth.

The data files' own `DressphereDef` and `GarmentGridDef` are internal shapes
rather than contracts, so `src/battle/ffx2/adapters.ts` converts them
**structurally** — neither folder imports the other. Wire them up at boot:

```ts
new FFX2Engine({
  abilities: abilityRegistryFrom(FFX2_ABILITIES),
  items: itemRegistryFrom(FFX2_ITEMS),
  dresspheres: dressphereRegistryFrom(STANDARD_DRESSPHERES, statsFn),
  garmentGrids: garmentGridRegistryFrom(GARMENT_GRIDS),
  minigames: false, // e2e / headless: roll default outcomes, never suspend
});
```

## 2026-09-15 — chained-encounter carry-over reaches `types.ts` (additive)

Orchestrator decision 6 below specifies that `init(setup)` accepts "a full
carried-over party state (HP, MP, statuses, Overdrive gauges, aeon state, item
counts) and a `chained: true` flag", but three of those had nowhere to live in
the contract. Three optional fields added; nothing existing changes shape, and
every field is `undefined` for a fresh encounter.

- **`BattleSetup.chained?: boolean`**. True when this battle is a link in a
  chain rather than a fresh encounter: no results screen between links, and
  mid-chain story scripts may play. The FFX engine reads it into
  `BattleResult`/`victory` handling and suppresses the between-link results
  beat; it still never advances groups itself.
- **`FFXMemberBuild.statuses?: Partial<Record<StatusId, StatusInstance>>`**.
  Statuses the member carries in from the previous link. HP, MP and the
  Overdrive gauge were already carried by `hp` / `mp` / `overdrive.gauge`.
- **`AeonBuild.statuses?: Partial<Record<StatusId, StatusInstance>>`**. Same,
  for an aeon; `hp` / `mp` / `overdriveGauge` / `reviveCountdown` already
  existed.

Also for FFX engine consumers: the engine does **not** import `src/data/ffx/**`.
It resolves `AbilityDef`s and `ItemDef`s through a registry the app populates at
boot — `registerFFXAbilities(defs)` / `registerFFXItems(defs)` from
`src/battle/ffx/index.ts`. Four structural actions (`attack`, `defend`,
`aeon-shield`, `aeon-boost`) ship with the engine and may be overridden by
registering the same id.

## 2026-09-15 — `src/data/ffx2/ids.ts`: `'gris-gris-bag'` added to `AccessoryId`

Additive only. Bahamut's stat block (`ffx2-bahamut.md` §1.6) drops **Gris-Gris
Bag** in both the common and rare slot — Curseproof, Def +4 / MDef +4 — and the
research recommends it as the answer to his opening Curse. No existing
`AccessoryId` covered it, so it is added rather than widening the field to
`string`. Used by `src/data/ffx2/enemies/bahamut.ts` (rewards) and available to
`src/data/ffx2/builds/bevelle.ts`.

## 2026-09-15 — battle, story and encounter contracts land

First publication of the battle-side contracts. Nothing existed before, so
nothing broke; this entry exists so later diffs have a baseline. Read
`docs/CONTRACTS.md` for how each kind of agent consumes them.

- **`src/battle/common/types.ts`** (new). Ids, elements and affinity tables,
  the full FFX and FFX-2 status unions, `Stats`/`StatBlock`, `Combatant` plus
  `FFXCombatant` / `FFX2Combatant`, `AutoAbilityId`, `AbilityDef` / `ItemDef`,
  the `Command` union with typed minigame payloads, the `BattleEvent` union,
  `BattleEngine` / `FFXBattleEngine` / `FFX2BattleEngine`, `BattleState`,
  `MidBattleTrigger`, `BattleResult`, `Rng`, and the party / enemy build types.
- **`src/battle/common/rng.ts`** (new). `SeededRng` (mulberry32) plus the
  `damageRng` / `percentRoll` / `byteRoll` helpers. Covered by
  `tests/unit/rng.test.ts`.
- **`src/story/dsl.ts`** (new). `Step` union, `SpeakerId`, builder helpers,
  `ChapterScripts`, and `lintScript()` for the writing-bible house rules.
- **`src/data/encounters.ts`** (new). `Chapter` / `ChapterId` and the five
  records, importing typed stubs under `src/data/ffx/**`, `src/data/ffx2/**`
  and `src/story/scripts/**`.
- **`src/data/ffx/ids.ts`, `src/data/ffx2/ids.ts`** (new). Every id union.

Three naming decisions worth knowing about, all documented in
`docs/CONTRACTS.md` under "Vocabulary notes":

- The Thunder element is spelled **`'lightning'`** in both games.
- `FormulaKey` uses the **decompile's own names** (`strength`, `magic`,
  `special-magic`, `percent-current`, …) rather than the informal
  `physical`/`magical`/`demi` shorthand, because that is what the research
  tables the data agents transcribe are keyed by. Drain, Osmose, Absorb and
  Lancet are `ActionFlag`s, not formulas.
- `ElementId` includes **`'gravity'`**, which FFX itself does not have but the
  FFX Sensor panel draws a chip for and FFX-2 uses for real.

## 2026-09-15 — foundation integration

- **`SpriteActorOptions.anchorOffsetPx?: number`** (additive, default `0`).
  With `anchor: 'feet'`, the plane is sunk by this many logical pixels so the
  sprite's feet line — not the bottom edge of its canvas — sits on the ground.
  `buildSpriteActorInput()` now emits it as `size[1] - anchor[1]`, so sprite
  authors get it for free; existing callers that pass canvases directly are
  unaffected. Tidus has 4 empty rows under his feet and floated without it.
- **`Input` latches presses** (behaviour fix). A button that went down and back
  up between two frames used to be swallowed; `justPressed` now reports it once
  on the next sampled frame. Real taps and synthetic e2e keystrokes both
  depended on this. Covered by `tests/unit/input.test.ts`.
- **`Button` gains `'select'`** (additive). Bound to `KeyM` / `KeyV` and
  standard-gamepad button 8. `BUTTONS` is one entry longer; nothing indexes it
  positionally. The demo scene uses it to toggle music.
- **`PyreflyDebugApi`** gains `audioDebug()`, `playMusic()`, `playSfx()` and
  `setMuted()` (additive). The e2e boot spec only asserts a subset of keys.
- **Preview port default moved 4173 → 4319** in `playwright.config.ts` and
  `tools/screenshot.mjs`; both still honour `PREVIEW_PORT`.
</content>

## Orchestrator decisions on the contract author's open questions (2026-09-15)

1. **FormulaKey names**: keep the decompile-faithful closed set (`strength`, `magic`, `percent-current`, …). Drain/Osmose/Absorb stay ActionFlags. No rename.
2. **Chapter 4 (Bahamut)**: display number stays 4; the encounter is FFX-2 **Chapter 2** (Bevelle Underground, party Lv ~20-28). ARCHITECTURE.md updated.
3. **Yunalesca overflow**: `EnemyForm.overflowCarries` per form (default false) is the rule.
4. **Special dresspheres**: the X-2 engine owns the swap (parts are separate combatants; `activeIds` swapped). No dedicated state field.
5. **BattleResult**: one shape for both games; unused fields are undefined.
6. **Chained encounters**: the engine never advances groups itself. `victory` carries `nextGroupId`; the BattleScreen re-inits the engine for the next group with the party's carried-over state (HP, MP, statuses, Overdrive gauges, aeon state, item counts) and a `chained: true` flag so no results screen shows between links and mid-chain story scripts can play. Engine `init(setup)` must therefore accept a full carried-over party state.
7. **ItemDef.effect**: `AbilityId` only. Items register their effect as an ability with `category: 'item'`.
8. **Music keys** (final; audio agents compose these, data agents reference them):
   `title`, `chapter-select`, `scene-gagazet`, `boss-seymour`, `scene-zanarkand-dome`, `boss-yunalesca`, `scene-dreams-end`, `boss-jecht`, `boss-yu-yevon`, `victory-ffx`, `ending-ffx`, `scene-bevelle-underground`, `boss-ffx2-aeon`, `scene-farplane`, `boss-vegnagun`, `boss-shuyin`, `victory-ffx2`, `ending-ffx2`. Existing stand-ins: `battle-ffx` → use for `boss-seymour` until replaced; `boss-dread` → `boss-yunalesca`.

9. **Lulu's Fury picks its spell on the command, not in the minigame result.**
   `FuryResult` carries `sweptDegrees` and `casts` but no spell, which looked
   like a contract gap. It is not one: in the original, Fury opens Lulu's Black
   Magic list, the player picks one spell, *and only then* rotates. So the
   choice happens at command-selection time and the existing
   `OverdriveCommand.id` already carries it. **No change to `FuryResult`.**

   - The `'fury'` ability in `src/data/ffx/abilities/special-menu-markers.ts` is
     a **menu marker only**. It must never reach `engine.submit()`; the engine
     should reject it with a clear message rather than resolve it.
   - The UI's Overdrive submenu for Lulu lists the specific `<spell>-fury` ids,
     derived by intersecting the marker's `extra.resolvesToOneOf` with the
     member's `learnedAbilityIds` — so the endgame Lulu offers the fire /
     blizzard / thunder / water tiers plus `bio-fury`, and does not offer
     `flare-fury` or `ultima-fury`, which she has not learned.
   - The chosen `<spell>-fury` id is the `OverdriveCommand.id`; the engine reads
     the spell from it for `degreesPerCast(spell, magic)` and resolves `casts`
     repetitions.
   - Builds keep `unlockedOverdriveIds: ['fury']` — the marker is what unlocks
     the submenu.

   The same rule generalises: a minigame result carries only what the *player's
   performance* produced. Anything chosen from a menu belongs on the `Command`.

10. **Never style a bare `.ig-*` class outside `src/ui/inkgold/`.**
    The Ink & Gold layer is a shared namespace: `src/ui/ffx/**`,
    `src/ui/ffx2/**` and `src/ui/common/**` all render the same class names
    into the same document. A bare rule in a consumer's stylesheet therefore
    applies to every other consumer's elements too.

    This already happened: `src/ui/ffx/minigames/overdrive-minigames.css`
    declared an unscoped `.ig-minigame { opacity: 0; transition: … }` as the
    enter-animation for its own overlays, revealed by its own `.ffx-mg--open`.
    Because the selector was not scoped, it also hid the FFX-2 Trigger Happy
    and Lady Luck overlays, which never add that class — they rendered
    invisible with no error anywhere.

    The rule: in a consumer stylesheet, every `.ig-*` selector must be scoped
    by an owned ancestor or an owned co-class — `.ffx-hud .ig-minigame`,
    `.ig-minigame.ffx2-reels`. Only files under `src/ui/inkgold/` may declare a
    bare `.ig-*` rule. Specificity overrides are a workaround, not a fix: the
    leak stays for the next consumer, so fix the unscoped selector at source.

    The same reasoning is why the layer is frozen-additive. A renamed or
    retuned token reaches three folders at once, so it goes through the
    coordinator.

11. **The presenter draws damage numerals, for both games. HUDs never
    headline a damage figure.**
    `docs/ARCHITECTURE.md` already files damage numbers under `ui/common/` — a
    shared, presenter-driven component — not under either HUD. That assignment
    stands and is now explicit, because the FFX-2 HUD's chain pop had grown a
    large `.ig-damage` numeral of its own. With the presenter also drawing
    damage, two systems would render `.ig-damage` into one document: the same
    shape as the `.ig-minigame` collision behind decision 10.

    - The presenter owns every per-hit figure: damage, healing (negative
      `amount`), MISS / IMMUNE / ABSORBED, and the multi-hit ladder driven by
      `hitIndex` / `hitCount`.
    - An FFX-2 **chain** is not a damage figure. The HUD shows it as a
      separate, smaller `CHAIN ×N` chip that never renders a number in
      numeral-size type.
    - A HUD may still *react* to a damage event (a status bar flash, a portrait
      shake) through `HudPort.onEvent`; it just must not draw the number.

12. **SUPERSEDES DECISION 11. Each game's HUD owns its damage numerals.**
    Decision 11 ruled that the presenter draws damage numerals for both games
    and told the FFX-2 HUD to stop drawing them. That did not match the code:
    the BattleScreen **hides the presenter's numerals whenever a HUD is
    mounted**, and the FFX HUD has always drawn its own. So applying decision 11
    left **FFX-2 battles drawing no damage numbers at all** — a regression the
    ruling itself caused. `tools/orphans.mjs` confirms it: the shared
    `src/ui/common/DamageNumbers.ts` and `damageLadder.ts` have no importers.

    Lesson recorded: a ruling about who renders what must be checked against
    what the screen actually mounts, not against the architecture diagram.

    - The HUD mounted for a battle draws every per-hit figure: damage, healing
      (negative `amount`), MISS / IMMUNE / ABSORBED, and the multi-hit ladder
      from `hitIndex` / `hitCount`. FFX already does; FFX-2 must.
    - FFX-2 should **reuse** `src/ui/common/DamageNumbers.ts` and
      `damageLadder.ts` rather than write a third implementation.
    - An FFX-2 **chain** is still not a damage figure, but it now rides on the
      numeral it belongs to, as a `CHAIN ×N` chip attached to that hit.
    - The single-owner rule from decision 11 still stands — it just points at the
      HUD instead of the presenter. Two systems must never both draw
      `.ig-damage` for the same hit.

13. **`AbilityDef.extra.statsFrom` — a two-actor rig where the turn slot and
    the stat block belong to different combatants.** (Chapter 1, 2026-09-17.)

    `research/ffx-seymour-flux.md` §5.4 settles an ambiguity the wiki leaves
    open: Cross Cleave and Total Annihilation appear under *both* enemies'
    ability lists, but the decompiled `monster_actions.json` puts them on
    **`m142` (Seymour Flux) only**, and the damage math is decisive — Cross
    Cleave with Seymour's Strength 30 is 2,275 against a Def-30 character where
    every guide reports "around 2,000", and with the mount's Strength 40 it is
    5,294. §4.4.2's "On attribution" paragraph states the shipping rule in as
    many words: *"the Mortiorchis actor owns the turn slot and the animation;
    the Seymour actor owns the stats."*

    The engine had no way to express that, so the mount's actions used the
    mount's stats. Measured: Cross Cleave hit a 2,420-HP Tidus for **5,776** on
    turn one, which is a party wipe before anybody acts.

    The addition is one optional field and one optional resolve option, and it
    is inert everywhere it is not set:

    - `AbilityDef.extra.statsFrom: CombatantId` (data). Set on `cross-cleave`
      and `total-annihilation` in
      `src/data/ffx/enemies/seymour-flux-abilities.ts`, nowhere else.
    - `ResolveOptions.statsUser?: FFXCombatant` (`src/battle/ffx/abilities.ts`).
      Read at exactly one place — the `DamageInput.user` handed to
      `computeDamage`. **Only the damage chain** sees it. The events, the
      targeting, the reflect/nul handling, the MP cost, the CTB charge and the
      Overdrive bookkeeping all stay with the actor whose turn it is, so the
      mount still owns the animation and the log still reads
      `actorId: 'mortiorchis'`.
    - `src/battle/ffx/execute.ts` wires the two together and no-ops when the
      named actor is the one already acting or is not on the field.

    Other chapters are unaffected: no other `AbilityDef` sets `statsFrom`, and
    an unset `statsUser` leaves `resolveAbility` byte-identical.

14. **`rollDefaultMinigame` honours the Overdrive the command named.**
    (Chapter 1, 2026-09-17. `src/battle/ffx/overdrive.ts`.)

    The `kimahri-rage` branch defaulted to `user.overdrive.unlockedOverdriveIds[0]`
    and **discarded `def.id`** — the record the `OverdriveCommand` actually
    carried. Every Ronso Rage therefore resolved as whatever sat first in the
    list, which for the Gagazet preset is Jump. Measured as
    `action-start{ command.id: 'mighty-guard', abilityId: 'jump' }`: the command
    named Mighty Guard, the gauge was spent, and Jump came out. That made
    §6 row 13's answer to Total Annihilation — and §7.9.2's *rule* that Kimahri
    arrives with a full gauge because he Lancet-learned it off Biran Ronso
    minutes earlier — uncastable.

    Now `rage.rageId = def.id`, matching the `lulu-fury` branch directly above
    it ("the spell rode in on `OverdriveCommand.id`"). A menu marker can never
    reach the branch: `execute.ts` refuses those first. The change affects any
    caller that names a Rage and previously silently got Jump, which is a fix
    in every case.

15. **The Chapter 1 AI script targets the field, not `activeIds`.**
    (`src/battle/ffx/ai/seymour-flux.ts`, 2026-09-17.)

    While an aeon holds the field it is "the *only* present friendly actor —
    the party is off-stage with frozen counters" (`state.ts friendlies`,
    ffx-combat-core §6.1), and that is the mechanical basis of
    ffx-seymour-flux §6 row 15's summon-to-stall. But `targeting.ts` filters an
    *explicit* target list on `onField` alone, which a frozen party member still
    satisfies, so a script that hands the engine `state.activeIds` can land
    Lance of Atrophy or Full-Life on an off-stage member through a summon.

    Seymour's and the mount's target helpers now read `livingFriendlies(ctx)`
    instead, which is the engine's own answer to the same question. This is a
    Chapter 1 change only; the general `targeting.ts` behaviour is untouched and
    is recorded here as a **known sharp edge for other chapters' scripts**.
