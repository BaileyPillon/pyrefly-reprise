# Contract changes

Shared contracts (`src/sprites/format.ts`, `src/engine/SpriteActor.ts`,
`src/app/Input.ts`, `src/battle/common/types.ts`, `src/story/dsl.ts`,
`src/data/encounters.ts`) are written first and imported by everyone else. Any
change to one is recorded here, newest first. Additive only unless a note says
otherwise.

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
