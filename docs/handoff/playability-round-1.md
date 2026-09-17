# Playability round 1 — integration

**Scope.** The five per-chapter playability agents each landed independently.
This pass type-checks and tests the combined tree, fixes the one place their
edits collided, then plays all five chapters through the **real app** rather
than through a headless harness, and re-captures the gallery.

Nothing in this pass touched a boss's HP, stats, abilities, counters or AI
script. The one code change is to a **test harness**, and it made the suite
stricter, not looser.

---

## 1. Type-check and tests

| | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx vitest run` (before the fix) | **2 failed**, 2,485 passed, 73 files |
| `npx vitest run` (after the fix) | **2,487 passed**, 73 files, 0 failed |

Both failures were in `tests/unit/strategy-ffx2-bahamut.test.ts`, and both were
integration breakage of exactly the kind this pass exists to catch.

### 1.1 What collided

The Chapter 4 agent reported `engineChanged: false, buildChanged: false` — it
changed nothing. The Chapter 5 agent (`ffx2-vegnagun-shuyin`) changed the
**shared FFX-2 engine and the shared Dark Knight data**, and three of its edits
land on `Darkness`, which is Chapter 4's main damage command too:

| Edit | File | Citation |
|---|---|---|
| Darkness costs **12.5% of the user's max HP** per cast | `src/battle/ffx2/targeting.ts` (`hpCostFor`), `src/battle/ffx2/resolve.ts`, `src/data/ffx2/abilities/dark-knight.ts` | `research/ffx2-vegnagun-shuyin.md` §6.4 `[verified: 2 sources]`, §7.1 |
| `damageType: 'physical'` → `'other'` | `src/data/ffx2/abilities/dark-knight.ts` | §6.4 "Special damage… Ignores Defense", §3.3 retaliation table |
| dropped `crit-eligible` | `src/data/ffx2/abilities/dark-knight.ts` | §6.4 "Cannot crit" |

All three are canon corrections, all three make the **player** weaker, and all
three are correct. They are not the problem. The problem is that Chapter 4's
test harness was calibrated against the engine as it stood *before* them, when
Darkness was free, uncapped and could crit.

### 1.2 Attribution, measured

Rather than guess which of the three moved the bars, each was toggled
independently over the same 30 contiguous seeds (probe since deleted):

```
variant                             no-mitigation line          Magic Break route
shipped (all three canon edits)     0 wins, 4/30 MF kills       26/30      <- failing
no HP cost                          0 wins, 18/30 MF kills      30/30
crit-eligible restored              0 wins, 4/30 MF kills       24/30
damageType 'physical' restored      0 wins, 4/30 MF kills       26/30
fully pre-Chapter-5 Darkness        0 wins, 17/30 MF kills      30/30
```

**The HP cost alone accounts for both failures.** The crit flag and the damage
type are irrelevant to this encounter.

The mechanism is not subtle. On `src/data/ffx2/builds/bevelle.ts` the Dark
Knight is **Rikku, 1,839 max HP**, so each Darkness now costs her 229 HP. The
test's own counter-lines spam Darkness down to a 25% floor and then *swing*,
with no healer by construction — so she bleeds herself to ~25%, stops, and the
party dies to the cycle's ordinary physicals slightly **earlier** than it used
to, instead of to the Mega Flare that used to finish it. Average Darkness casts
per run fell from 6.1 to 3.0 and Bahamut was left at ~4,810 of 8,400 instead of
~4,355.

### 1.3 The fix

`tests/unit/strategy-ffx2-bahamut.test.ts` only. **No engine, data, build or
tactic file was touched, and no assertion bar was lowered.**

1. **The counter-lines' Dark Knight floor: `0.25` → `0.375`.** The floor was
   written when Darkness was free, so any value above zero was inert; it is not
   inert now. Three casts' worth is what the shipped tactic's own
   `DARKNESS_FLOOR` models with the sustain turn underneath it
   (`src/engine/tactics/ffx2-bahamut.ts`) — a real player stops spending HP she
   cannot replace. This restores §2.4's Magic Break route from 26/30 to
   **30/30 against its unchanged bar of 28**. It rescues no losing line: the
   no-mitigation line still loses **0/30** at every floor from 0.25 to 0.6, and
   the Shell (30/30) and heal-only (22/30) routes are unmoved.

2. **The "Mega Flare landed the killing blow on ≥15/30" aggregate was
   replaced.** That assertion measured last-hit attribution, which is the one
   thing the HP cost legitimately moves, and it was measured on a free
   Darkness. It is replaced by three assertions of what §2.4 actually claims,
   all of which are harder to satisfy by accident:

   * every one of the 30 seeds is a **full three-body wipe** (30/30);
   * **Mega Flare is in the fight on every one of them** (30/30);
   * it still lands the killing blow on some of them (≥2; measured 4).

   The test's own block comment already said the real shape — *"the wipe is the
   cycle, not one ability"* — so this makes the assertions agree with the prose
   above them.

The shipped Chapter 4 tactic is unaffected and still wins **40/40 contiguous
seeds** with all three girls alive.

---

## 2. Five-chapter sweep through the real app

Driven by `critic/scratch/sweep.mjs` against a dev server on **port 5230**, one
fresh page load per chapter, with

```js
window.__pyrefly.gotoChapter(id, {
  skipCutscenes: true, skipPrep: true, seed: 1, auto: 'intended', speed: 'skip',
})
```

**All five are victories with complete chains.**

| # | Chapter | Outcome | Turns | Links | elapsedMs | Wall | Console errors |
|---|---|---|---:|---:|---:|---:|---|
| 1 | `seymour-flux` | **victory** | 82 | 1 | 122,267 | 123 s | 1 (cutscene budget) |
| 2 | `yunalesca` | **victory** | 237 | 1 | 214,767 | 217 s | 0 |
| 3 | `braskas-final-aeon` | **victory** | 104 | **7** | 224,358 | 227 s | 1 (cutscene budget) |
| 4 | `ffx2-bahamut` | **victory** | 75 | 1 | 64,444 | 66 s | 1 (cutscene budget) |
| 5 | `ffx2-vegnagun-shuyin` | **victory** | 58 | **5** | 449,058 | 452 s | 0 |

`preview` was `false` on all five, so every one ran a real engine rather than
the demo reel. Link counts match what the chapter agents reported (1 / 1 / 7 /
1 / 5). Raw report, including the event-log tail capture path for any
non-victory: `critic/scratch/sweep-report.json`.

**Two metric caveats, so these numbers are not misread:**

* `turns` is `BattleResult.turns`, i.e. the engine's global turn counter
  (`state.turn`, incremented per `turn-start`), so it counts **enemy turns
  too** — it is not the count of player decisions the chapter agents reported.
* For a **chained** encounter it is the **last link's** count only, because
  `BattleScreenResult.result` is the final battle's result. That is why
  Chapter 3 reads 104 turns across 7 links and Chapter 5 reads 58 across 5;
  neither is the whole encounter's length. `elapsedMs` *is* the whole chain.

The first attempt used a 180 s per-chapter budget and timed out on Chapters 2
and 3. That was the budget, not the game — see issue 1.

---

## 3. Gallery and victory captures

`node tools/gallery.mjs --url=http://localhost:5230/ --out-dir=docs/screenshots/70 --mode=gallery`

15 frames, **zero errors and zero notes** in the report (saved alongside as
`docs/screenshots/70/report.json`). Renderer was
`ANGLE (… SwiftShader …)`; data wiring loaded 343 FFX abilities / 69 items and
324 FFX-2 abilities / 33 items / 14 dresspheres / 43 Garment Grids.

Two victory frames were added by `critic/scratch/victory-shots.mjs`:

* **`54-yunalesca-form3.png`** — played at `speed: 'normal'` and captured by
  polling the live engine for `combatants['yunalesca'].enemy.formIndex === 2`
  rather than guessing a turn number. The watcher recorded forms `[0, 1, 2]`,
  so all three forms were genuinely walked; the frame catches the
  Metamorphosis banner on the Form III entry.
* **`55-results-victory.png`** — Chapter 1's results panel after a real
  victory, with `skipResults: false` (`gotoChapter` defaults it to `true`
  whenever `auto` is set, which is why the panel is otherwise never reached).
  Screen state confirmed `outcome: 'victory'`, `clearMs: 121419`, `newBest`.

All 17 frames were read. What they show, and what is wrong with them, is in
§4.

---

## 4. Issues

Ranked. None of these block the five chapters being winnable — that is settled
in §2 — and none were introduced by the fix in §1.

### 1. `speed: 'skip'` does not make a mid-battle story beat cheap — HIGH (stability / tooling)

Three of the five chapters log a **`console.error`** during an automated run:

```
[cutscene] mid-battle beat "seymour-half" ran past its 8000ms budget;
cut short and resuming the battle (logged once per beat)
```

…and the same for `yu-yevon-arrives` (Ch. 3) and
`first-mega-flare-countdown` (Ch. 4). The gallery pass logs a third variant,
`yunalesca-last-quarter`.

This contradicts the runner's own documented contract —
`src/app/screens/BattleScreenCutscenes.ts` lines 43-44: *"`'skip'` playback is
the one case that still shows nothing… an e2e chapter run cannot afford eight
seconds a beat."* Two independent reasons it is not free:

* `setAutoAdvance(on, { instant })` only swaps the **dialogue** port for a
  no-op (line 295). A beat's `camera` and `wait` steps are untouched.
* `BattleScreen.ts:138` constructs the runner **without a `sleep`**, so
  `const wait = opts.sleep ?? sleepMs` (line 125) is always the real
  `setTimeout`. Nothing in the screen ever injects a collapsing clock.

And the budget is wall-clock while the animation is frame-driven:
`BattleCamera.moveTo` (line 136) tweens through `tweens.toAsync`, advanced by
`update(dt)` with `dt` clamped to `maxDelta = 1/20 s`
(`src/app/App.ts:65, 192`). A `camera('action', 400)` therefore needs **at
least 8 rendered frames**; under SwiftShader that is seconds of wall clock,
while the 8,000 ms deadline is a plain timer. The beat loses the race and is
cut short.

Consequences: automated runs are 1.5 s/turn rather than instant (Chapter 5
takes 7.5 minutes), any "no console errors" gate fails on three chapters, and
the beat the player would see is **truncated**. On a real GPU at 60 fps the
tween completes in its authored 400 ms, so this is unlikely to be player-facing
— it is a capture/e2e defect, but it is firing `console.error` and the rubric
scores that under Stability.

Suggested fix: inject a `sleep` into `createMidBattleCutscenes` that collapses
to zero under `'skip'`, and make the deadline frame-based (or skip the beat
outright) rather than wall-clock.

### 2. Damage numbers stack on top of each other — HIGH (UI polish)

Visible in `46-attack.png`, `47-boss-attack.png`, `50-yunalesca.png`,
`51-bfa.png` and worst in **`53-ffx2-vegnagun.png`**, where a multi-hit action
piles roughly eight numbers (`290`, `424`, `428`, `391`, `409`, `270`, and two
more fully occluded) at one screen position, mutually illegible. On the FFX
side `50-yunalesca.png` has `2200` buried under `1850`. Multi-hit and
multi-target results need fanning, stacking with an offset, or queueing.

### 3. Damage numbers and enemy sprites render under the right-hand HUD — HIGH (UI / framing)

In `47-boss-attack.png` the numbers `604`, `571` and `578` are drawn across and
behind the CTB column. More seriously, **Mortiorchis is ~70% hidden** behind
the CTB list and party-status window and clipped by the right screen edge in
every Chapter 1 battle frame (`44`, `45`, `46`, `47`, `48`) — the fight's
second enemy is effectively off-frame. The same happens to the right-hand **Yu
Pagoda** in `51-bfa.png`. Either the stage needs to inset its enemy anchors
from the HUD, or the HUD needs to sit over dead space.

### 4. The CTB list uses single-letter tiles instead of portraits — MEDIUM (UI fidelity)

Every battle frame shows `T` / `Y` / `K` / `A` / `S` / `M` tiles (and `WM` /
`DK` / `WR` on the FFX-2 side). The rubric asks for *"portraits in the CTB
list"*, and the portraits plainly **exist** — they are used in party prep
(`42-party-prep.png`), the results rows (`55`), the chapter-select party strip
(`41`) and the cutscene box (`43`). This looks like an unfinished wiring rather
than a design decision.

### 5. Rikku's Dark Knight sprite is her default outfit — MEDIUM (character fidelity)

In `53-ffx2-vegnagun.png` the status panel reads `DK` for **both** Rikku and
Paine (correct — §7.1's two-Dark-Knight standard clear). Paine's sprite is the
black Dark Knight armour; **Rikku's is her default Thief look** (orange/green).
One of the two is wrong, and it is Rikku's. Same default look in
`52-ffx2-bahamut.png`, where she is also `DK`.

### 6. `48-overdrive.png` contains no Overdrive, `46-attack.png` no attack — MEDIUM (capture coverage)

`48-overdrive.png` shows Yuna KO'd on the ground with ordinary damage numbers —
the gallery's Overdrive capture missed its moment, so **the gallery has no
evidence an Overdrive renders at all**. `46-attack.png` likewise shows Tidus in
an idle pose with a damage number and no swing or weapon VFX. Both are the
capture timing, not necessarily the feature — but as it stands two of the
fifteen frames do not show what they are named for.

### 7. Rikku is blown out to pure white by a cast bloom — LOW (VFX)

`52-ffx2-bahamut.png`: her sprite is entirely white, silhouette lost. The heal
/ cast flash has no ceiling.

### 8. Two boss sprites read as flat untextured shapes — LOW/MEDIUM (art, needs an art-fleet ruling)

* `53-ffx2-vegnagun.png`: Vegnagun reads as a plain brown-and-green wedge with
  almost no surface detail — it does not read as a giant machina.
* `51-bfa.png`: Braska's Final Aeon reads as a flat green silhouette with very
  little internal detail next to, say, Seymour Flux in `44-battle-open.png`.

Both may be intentional, and `public/art/**` and `src/scenes/**` are the art
fleet's, so this is **reported, not touched**.

### 9. Portrait style and crop are inconsistent — LOW (art)

In `42-party-prep.png`, Auron's portrait is noticeably more photo-real and
lighter than the anime-styled rest, and the crops vary widely (Wakka and Rikku
are zoomed much tighter than Tidus or Yuna). Kimahri's small results-row
thumbnail in `49`/`55` washes out to pale blue and does not read as him at that
size, although his full portrait in `43-pre-cutscene.png` is excellent.

### 10. The element panel shows bare labels — LOW (UI)

The Sensor panel in the Chapter 1 frames lists `FIRE ICE THUNDER / WATER HOLY
GRAV` with no values, icons or weak/resist/absorb state, so it is not clear
what it is telling the player.

---

## 5. Files

* Fixed: `tests/unit/strategy-ffx2-bahamut.test.ts`
* Sweep harness: `critic/scratch/sweep.mjs` → `critic/scratch/sweep-report.json`
* Victory captures: `critic/scratch/victory-shots.mjs`
* Screenshots: `docs/screenshots/70/` (15 gallery + `54-yunalesca-form3.png` +
  `55-results-victory.png` + `report.json`)
