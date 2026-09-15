# Contract changes

Shared contracts (`src/sprites/format.ts`, `src/engine/SpriteActor.ts`,
`src/app/Input.ts`, `src/battle/common/types.ts`, `src/story/dsl.ts`,
`src/data/encounters.ts`) are written first and imported by everyone else. Any
change to one is recorded here, newest first. Additive only unless a note says
otherwise.

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
