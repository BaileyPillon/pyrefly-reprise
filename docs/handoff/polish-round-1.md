# Polish round 1 — integration

Key: `polish-round-1`. Scope: integrate the nine polish agents' work, verify it
against the live game, and say what is actually fixed.

Run: 2026-09-17, dev server on `:5210`, gallery at
`docs/screenshots/60/`, 1600x900, SwiftShader.

---

## 1. Type check

`npx tsc --noEmit` is **clean** across the whole tree, before and after the one
edit this pass made. No errors in the Yunalesca tactics files, none in the art
fleet's files, none anywhere.

Two errors that earlier agents reported as outstanding are gone: the
`BattlePresenterTactics.ts` TS6133 `hasAeonLeft` and the `dreams-end.ts(1407)`
TS2554 "Expected 6 arguments, but got 5" have both been resolved by their
owners since those reports were written.

## 2. Tests

One real polish-caused failure, fixed here.

### Fixed: `tests/unit/ui-ffx2-hud.test.ts` — stale ATB track bounds

`FFX2BattleHud > draws a shorter ATB track for the lower required (faster) bar`
asserted `slowWidth <= 53.34`, and got `132`.

The assertion was stale, not the code. The test still described the ATB bar as
a stub borrowing `.ig-stat__od`'s `[24, 53.33]` geometry. `PartyRows.ts`
deliberately redefined it as a full-width second line under the HP/MP data —
§4.3's verified layout — with its own exported bounds:

```ts
export const BAR_MIN_PX = 58;
export const BAR_MAX_PX = 132;
```

The `ffx2-battle` agent updated four other cases in this file in the same pass
and missed this one. The fix imports the two constants rather than restating
the numbers, so the next geometry change cannot drift again:

```ts
expect(fastWidth).toBeGreaterThanOrEqual(BAR_MIN_PX);
expect(slowWidth).toBeLessThanOrEqual(BAR_MAX_PX);
```

`tests/unit/ui-ffx2-hud.test.ts` is 9/9 green.

### Not polish-caused, not fixed

- **`tests/unit/strategy-chapter2.test.ts`** failed 5 cases on the first run of
  this pass (`expected 'defeat' to be 'victory'`, and `Mega Death must kill all
  three actives: expected 1 to be 3`). It **passed** on the later runs. That
  file and its subject belong to the Yunalesca tactics agent, who was editing
  live throughout; not touched here.
- **Four audio failures** — `audio-worker.test.ts`, `audio.test.ts` (x2),
  `audio-registry.test.ts`. All are wall-clock timeouts on offline DSP music
  renders, confirmed in isolation: `Error: Test timed out in 60000ms`, with
  `audio-registry.test.ts` taking 440s for a file that normally passes. The box
  is running dozens of concurrent Chromium processes from the other agents.
  Environmental. **Re-run on a quiet machine before believing them.**
- **Vitest worker-start timeouts** — `[vitest-pool]: Failed to start forks
  worker` for `controls-hint-pointer`, `party-prep-inkgold`,
  `party-prep-panels`, `ui-ffx2-party-prep`, `ui-ffx2-trigger-happy`. Same
  cause. This is the same symptom the `sphere-grid` agent reported as a hook
  timeout in `party-prep-panels.test.ts`.

Best counts observed this pass, discounting the load-induced noise:
**2344 passed / 9 failed of 2353** on the first run (5 tactics + 3 hud + 1),
falling to **2233 passed / 6 failed** on the degraded later run where the
tactics and HUD files had gone green and only the audio timeouts remained.

## 3. Orphaned modules

`node tools/orphans.mjs`: **394 modules, 379 reachable from `src/main.ts`, 15
orphaned.**

**No polish agent orphaned anything.** In particular there is no stranded
`DamageNumbers` implementation: `src/ui/common/DamageNumbers.ts` is the single
implementation and is reachable, `src/ui/ffx/DamageNumbers.ts` is a reachable
thin adapter, and `src/ui/ffx2/DamageLayer.ts` mounts the same class. CONTRACT
decision 12 holds.

Fourteen of the fifteen orphans predate this round — the legacy pixel-art
subsystem (`src/sprites/**`, `engine/SpriteActor.ts`, `engine/BlobShadow.ts`,
`engine/shaders/SpriteShader.ts`, `scenes/placeholder-sprites.ts`), plus
`audio/dsp/index.ts`, `battle/ffx2/fixtures.ts`, `ui/common/MessageBar.ts` and
`ui/ffx2/PartyPrep.ts`. Every one has an mtime of 2026-09-15 or 09-16 and none
had an importer at `HEAD` either.

The fifteenth is **`src/story/registry.ts`** (new, untracked, 2026-09-16
13:32), whose only importers are `tests/unit/story-triggers.test.ts` and
`story-scripts.test.ts`. This is **by design, not a defect** — the module's own
header calls it "the audit surface the test suite uses", and it exists to hold
invariants (`id === script`, AI-emitted names resolve, per-script time budgets)
that nothing in the type system can express. The shipping path to the story
content is `src/data/encounters.ts` → `src/story/scripts/*`, which is reachable.
Worth a note in `tools/orphans.mjs`'s allowlist if it ever grows one, so the
next reader does not "fix" it by deleting it.

## 4. Gallery — what is visibly fixed

All 15 frames captured to `docs/screenshots/60/`.

### Fixed, confirmed on screen

| Issue | Evidence |
| --- | --- |
| **Sphere grid tab was a ~340x100 strip** | `60/42b-sphere-grid.png` — full-bleed grid, legible node graph, colour legend, `Hastega` tooltip, sphere counts, WALK/±/CENTRE controls, AP bar. Emphatically fixed. |
| **Results screen read `RESULTS · 0:00`** | `60/49-results.png` — `RESULTS · 1:12`, `Defeat` in display italic, TURNS 15, ATTEMPTS 1, `BEST — NEVER CLEARED`, roster with portraits and S.LV/AP. |
| **Chapter select was unbalanced** | `60/41-chapter-select.png` — three columns bottoming out on one line: hero slab + ivory info slab, chapter thumbnail stack, right rail with LOCATION / BOSS / PARTY portraits / BEST. |
| **Command menu had a dead DEFEND row and four bare switch rows** | `60/44-battle-open.png` — `ATTACK / SPECIAL ×6 / WHITE MAGIC ×3 / ITEMS ×27 / SWITCH ×4`. One collapsed SWITCH row, no DEFEND. |
| **Submenu** | `60/45-battle-skills.png` — `WHITE MAGIC` header, HASTE / HASTEGA / SLOW with MP costs in tags. Clean. |
| **FFX-2 HUD formation and party rows** | `60/53-ffx2-vegnagun.png` — right-and-back stagger, boss strip, party rows with dressphere monograms (WM/DK/DK), HP/MP, per-actor ATB tracks of visibly different widths, KO chip on Paine. |
| **Painted pose scale (partially — see below)** | `60/47-boss-attack.png` — the KO pose is no longer stretched to standing height. |

### Remaining

**(a) Damage numerals still collide across targets.**
`60/50-yunalesca.png` prints `113` and `MISS` through each other on Yunalesca,
and stacks `+4400` / `30` / `235` on Tidus with `30` overdrawing `235`.
`60/53-ffx2-vegnagun.png` piles `50` / `+46` / `384` into an illegible knot on
Yuna. `60/47-boss-attack.png` shows `758` and `00` overlapping into `75800`.

The per-target ladder is correct — `60/51-bfa.png` stacks `1208` above `2620`
cleanly. The gap is **cross-target** deconfliction. `src/ui/common/damageLadder.ts`
offers only:

```ts
/** `+/-6px` random x jitter so simultaneous hits on different targets don't overlap [§3.6]. */
export function jitterX(rng: () => number = Math.random): number {
  return (rng() * 2 - 1) * 6;
}
```

±6px cannot separate two numerals whose targets project to nearly the same
screen point, which is exactly what happens when party members are downed and
piled up. `deflectFromRects` in `src/ui/common/DamageNumbers.ts` deflects off
HUD *panels* only; it has no notion of other live numerals. The fix is a
short-lived occupancy list of on-screen numeral rects that a new numeral
deflects from, reusing `deflectFromRects`.

Caveat on severity: `tools/gallery.mjs:keepBest` deliberately keeps the
*heaviest* PNG of three candidate timings as a proxy for "caught something
happening", so 46/47/48 are the busiest frame of each action and overstate how
many numerals coexist. `50` and `53` are plain single shots and still show the
collision, so the defect is real.

**(b) Downed bodies still overlap their neighbours.**
The `painted-poses` fix is genuine and large — `computePoseScale` now derives
one pixels-per-world-unit from the idle pose, so Tidus's KO plane is about
**2.06 x 1.25** world units instead of the **2.62 x 1.75** it was when every
pose was forced to standing height. It no longer reads as "twice his standing
size".

But it is still wider than the slot pitch. Measured live off the scene graph at
chapter 1, standing planes are Yuna **1.31 x 1.82** and Kimahri **1.14 x 1.84**,
at slot centres `x = -2.95`, `-1.55` (Tidus) and `-1.05`. Computing the prone
planes from the shipped sidecars (`public/art/characters/*/ko.json`, all
landscape: tidus 1216x735, yuna 1200x708, kimahri 1216x832) against their idle
baselines gives prone widths of **2.06 / 2.02 / 1.88**. Two prone bodies whose
x centres are 0.50 apart therefore overlap almost entirely, which is what
`60/47-boss-attack.png` and `60/48-overdrive.png` show: Tidus lying across
Kimahri, both sprawling into Yuna's slot.

`maxExtent` (default 2.2 x worldHeight ≈ 3.96) never bites, so the clamp is not
the lever. The lever is either a prone-specific extent cap near the slot pitch,
or nudging a downed actor's slot apart. This is a follow-up for the
`painted-poses` owner, not a regression.

**(c) The FFX-2 Bahamut frame has no HUD at all.**
`60/52-ffx2-bahamut.png` shows the scene and actors correctly but **zero UI**.
This is the `ffx2-battle` agent's reported blocker reproducing exactly:
`runMidBattleScript` hides the entire HUD for the length of a mid-battle beat,
and `first-mega-flare-countdown` overruns its 30000ms budget on every Bahamut
run. The gallery does not gate its shutter on `.ffx2hud:not([hidden])`, so it
photographs the blank window. Two fixes needed, neither in this pass's scope:
the presenter should not blank the HUD for a whole beat, and `tools/gallery.mjs`
should gate on the HUD being visible.

**(d) The FFX-2 boss strip is stuck in SCAN.**
`60/53-ffx2-vegnagun.png` shows `Vegnagun … SCAN`. Confirms the `ffx2-battle`
blocker: nothing in `src/battle/ffx2/engine.ts` emits the `sensor` event, so the
strip can never reveal HP in real play. Engine owner's fix.

**(e) The party still loses Chapter 1 under `auto: 'intended'`.**
`report.json` records `outcome: "defeat"` with all three members at 0 HP, and
`60/49-results.png` is a Defeat panel. Every action frame in this gallery is
therefore photographed during a losing fight, which is also why 46/47/48 are
full of KO poses. Balance/tactics owner. Until it is fixed, the gallery cannot
show a healthy mid-fight party.

**(f) One console error during capture**, carried in `report.json`:
`[chapter:braskas-final-aeon] [presenter] mid-battle script "yunalesca-form-2"
did not finish within 30000ms; abandoning the beat and resuming the battle`.
Same class of problem as (c).

**(g) `needsOverdrivePass: true`** — the gallery never observed a real overdrive
in the chapter 1 run, so `60/48-overdrive.png` is the best of the action
candidates rather than a genuine overdrive frame.

### Not re-checked here

The `dreams-end-scene` residual rim-shell finding and the write conflict on
`src/scenes/dreams-end.ts` are unchanged; that agent deliberately made no source
edit. `50-yunalesca.png` and `51-bfa.png` do show Auron drawn almost entirely
behind Tidus, which is a formation/depth question nobody currently owns.

## 5. Files changed by this pass

- `tests/unit/ui-ffx2-hud.test.ts` — ATB track bounds imported from
  `PartyRows.ts` instead of hard-coded stale numbers.
- `docs/handoff/polish-round-1.md` — this file.
- `docs/screenshots/60/*.png` + `report.json` — the gallery.

No source file was edited. A temporary probe script was written to
`tools/zz-integration-round1-probe.tmp.mjs` and **removed**; the unique name was
chosen to avoid the `tools/zz-probe.tmp.mjs` collision the `sphere-grid` agent
hit.

## 6. For the orchestrator

Unowned defects surfaced by the nine reports that still need routing, none of
them fixable inside any one polish key:

1. `src/battle/ffx/commands.ts:132` — party switching is unreachable game-wide
   (`enabled: isAlive(bench)`, and a benched member is never `onField`).
   Visible as the greyed `SWITCH ×4` in `60/44-battle-open.png`.
2. `src/battle/ffx/execute.ts` `case 'trigger'` — emits no `abilityId`, so the
   `bfa-talk` story beat is unreachable.
3. `src/data/ffx/enemies/braskas-final-aeon.ts:130` — `nextGroupId` is the
   placeholder `'possessed-aeons'`, which no formation exports, so Chapter 3
   stops dead after Braska's Final Aeon and 12 of its 15 mid-battle beats,
   including Jecht's goodbye, are unreachable.
4. `src/app/screens/BattleScreenFlow.ts:196` — `save.recordClear` is handed the
   raw wall clock before `clearTimeMs`'s plausibility floor, so an automated run
   at `speed: 'skip'` writes an unbeatable best time.
5. Chapter 1 and both X-2 chapters are unwinnable under `auto: 'intended'`.
6. `src/ui/common/party-prep.css` — `#ui` is `pointer-events: none`, so the prep
   shell's tabs, roster rows and START BATTLE never receive a pointer event.
