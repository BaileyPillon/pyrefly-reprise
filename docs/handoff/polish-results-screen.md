# Polish pass: the Results panel

Key: `results-screen`. Scope: `src/app/screens/ResultsScreen.ts`,
`src/ui/common/results.css`, `src/ui/common/resultsMath.ts`, plus one
additive debug registration (`src/debug/resultsDemo.ts`, hooked from
`src/debug/api.ts`).

## The defects

From `docs/screenshots/49-results.png`:

1. **`RESULTS · 0:00` after a 14-second fight.** The header chip printed the
   engine's `BattleResult.elapsedMs`, and the FFX engine never advances it:
   that field only moves inside `wait` effects, which the FFX engine does not
   emit. Every FFX clear therefore reported a zero-length battle.
2. **Tidus grinning under "Defeat".** The wedge always held the leader's
   standing victory portrait, and the panel printed the same gold rules, the
   same victory quip register ("…Okay. Next one.") and the same `CONFIRM ▸`
   whether the party had won or been wiped. The loss read as a win with a
   different word on it.
3. **An incomplete victory ledger.** No Overkill tag, no drops, no per-member
   sphere-level ups, and nothing for FFX-2's split award (EXP to the girl, AP
   to the dressphere she is wearing).

## What changed

### The clear time — `resultsMath.clearTimeMs`

A three-tier fallback, preferring real clocks over estimates:

1. `BattleScreenResult.elapsedMs`, the wall clock the presenter measures. This
   is the number that was there all along and was simply never passed through.
2. the engine's own `result.elapsedMs`, for FFX-2, which does advance it;
3. `result.elapsedTicks` converted at the game's tick rate, as a last resort.

Tiers 1 and 2 are gated on `MIN_PLAUSIBLE_WALL_CLOCK_MS = 1000`: an automated
run at `speed: 'skip'` collapses every animation wait to zero and finishes a
chapter in a few hundred ms, so a sub-second wall clock is not a play session
and the tick estimate takes over rather than printing a true-but-useless
`0:00`. `FFX2_MS_PER_TICK` is exact (`TICK_RATE_BASE = 3000`/s); `FFX_MS_PER_TICK
= 400` is a **measured estimate** — FFX's CTB tick has no wall-clock definition,
and a 21-turn chapter-1 fight at `fast` ran 106 ticks in 34.6 s.

Plumbing: `BattleScreenFlow.showResults` now forwards `outcome.elapsedMs` and
`previousBestMs` into the options, and `ui/common/registerFlowScreens.ts`
passes both through. `previousBestMs` is needed because the flow calls
`save.recordClear` *before* it shows the panel, so by the time the panel runs
the record has already been beaten and `NEW BEST` could never light.

### The defeat variant — a sombre slab

`.rres--defeat` is a separate register, not a recoloured victory:

- **The figure.** `heroHtml()` stops using the standing portrait and loads
  `art/characters/<leader>/hurt.png`, falling back through `ko.png` to *no art
  at all* via an `onerror` chain, so a missing pose removes its own `<img>`
  rather than showing a grin. `hurt` is preferred over `ko` because the KO
  sheets are wide prone figures that do not sit in a tall vertical wedge.
- **The palette.** The page inverts to ink: a near-black ground, the gold
  stripe swapped for a cold desaturated violet, and a veil (`.rres__ink::before`)
  over the figure so it reads as a shape in the dark rather than a hero shot.
- **The register.** No quip (a quip is a victory register — this was the tonal
  bug the screen was rebuilt for), no gold, no spoils. The ledger prints the
  record instead: `TURNS`, `ATTEMPTS`, `BEST` (`—` / `NEVER CLEARED` when the
  chapter has never fallen). Nothing rolls up — `revealMs` starts at
  `COUNT_UP_MS`, so the panel is already settled when it lands.
- **The actions.** `RETRY` / `CHAPTER SELECT` slabs with a cursor in place of
  `CONFIRM ▸`, reported through a new `onChoice(ResultsChoice)` callback.
  Either axis moves the cursor; `cancel` exits to chapter select.

`trigger('results:continue')` stays the neutral dismiss the gallery and e2e
already use, so automated runs keep their old retry-from-prep behaviour;
`results:retry` and `results:chapter-select` were added alongside it.

The attempt counter is read, not incremented: `GameFlow.runChapter` records the
attempt before the battle starts, and counting it again here doubled every
defeat.

### The victory ledger — complete per FFX / FFX-2

- **FFX**: `AP` (with `×N PARTY` — FFX credits the *full* AP to every active
  member, not a split of a pool), `GIL`, `ITEMS` as a printed list, an
  `OVERKILL ×N` tag from `result.overkilled`, and `NEW BEST`.
- **FFX-2**: `EXP` as the headline award plus a separate `AP · PER DRESSPHERE`
  row, since X-2 pays the girl and the sphere she is wearing separately
  (`ffx2-combat-core §3.0`). A formation that earns no AP gets no row rather
  than a printed zero.
- **Per member** (`buildMemberRows`): the award, a `+N S.Lv` / `+N Lv` badge
  that lands only once the counters finish rolling, and a second line showing
  where progression now stands — `S.LV 31 · 0/755 AP` for FFX, or
  `WHITE MAGE · CURA 60/80 AP` (`· MASTERED` when the sphere is finished) for
  FFX-2. All of it is pure and DOM-free so
  `tests/unit/ui-common-results.test.ts` can assert the arithmetic.

Chapter 4's `--silent` variant is untouched: same page with the flourish
drained, no roll-up, no quip.

## Verifying it

Three fixture-driven screens, registered additively from `installDebugApi` so
`main.ts`'s existing `results` / `results-silent` registrations are unchanged:

```js
await window.__pyrefly.goto('results-victory'); // FFX, full spoils, overkill
await window.__pyrefly.goto('results-defeat');  // 14.2 s — the 0:00 case
await window.__pyrefly.goto('results-ffx2');    // EXP + per-dressphere AP
```

The fixtures deliberately set `result.elapsedMs: 0` so they exercise the
wall-clock path rather than papering over it.

```
node tools/screenshot.mjs --url=http://localhost:5206/ \
  --screen=results-defeat --frames=150 \
  --out=docs/screenshots/polish/results-defeat.png
```

Captured: `docs/screenshots/polish/results-victory.png` (header reads
`RESULTS · 1:42`), `results-defeat.png` (`RESULTS · 0:14`, the fallen pose,
`RETRY` / `CHAPTER SELECT`), `results-ffx2.png` (`RESULTS · 4:28`, EXP + AP).

`npx tsc --noEmit` is clean. `tests/unit/ui-common-results.test.ts` (27) and
`tests/unit/results-inkgold.test.ts` (9) pass.

## PR-0078 fix — the victory portrait was showing one eye (2026-09-22)

Round 08's deep review (`critic/rounds/round-08.md` #5) traced it: `heroHtml()`
gave the victory `<img>` a fixed `height` and `width: auto`, so the browser's
own intrinsic-ratio sizing (not any crop math) decided where the portrait
landed, and `.rres__ink`'s `overflow: hidden` silently clipped whatever missed
the wedge — both games, every chapter, not a regression of this release.

Fixed both games (shared results plumbing, AGENTS.md rule 14 case: **both**):

- `src/ui/common/portrait.ts` — new `coverCropBox(crop, frameW, frameH, opts)`,
  {@link cropStyle}'s own placement generalised from percent-of-a-square-frame
  to an absolute pixel box for a frame whose width and height differ (the
  wedge is tall and narrow; `cropStyle`'s own comment says square is a hard
  requirement).
- `src/ui/common/resultsMath.ts` — `RESULTS_HERO_FRAME` (the wedge's portrait
  box, mirrored in `results.css`'s `.rres__hero-frame`) and `resultsHeroBox(id)`,
  which places the measured `face-crops.json` eye line inside it.
- `src/app/screens/ResultsScreen.ts` — `heroHtml()`'s victory branch now wraps
  the portrait in `.rres__hero-frame` and gives the `<img>` the computed box as
  an inline style, `manualCrop: true` so {@link refineFaceCrop}'s DOM sweep
  does not adopt it and overwrite the box with its own square-tile math. The
  defeat branch (the fallen `hurt.png`/`ko.png` pose) is untouched — it already
  framed correctly and was the control case in the review.
- `src/ui/common/results.css` — added `.rres__hero-frame`; the pre-existing
  `.rres__hero` rule is unchanged (its `left`/`top`/`height`/`width`/`object-fit`
  are all overridden inline for the victory case, and still apply as before to
  the untouched defeat `<img>`).

Test-first: `tests/unit/ui-common-results.test.ts` — for every playable party
portrait, `resultsHeroBox` always covers `RESULTS_HERO_FRAME` (no bare paper at
an edge) and the measured eye line plus a head-height margin lands inside the
frame. Confirmed failing before the fix (`resultsHeroBox`/`RESULTS_HERO_FRAME`
did not exist), passing after.

Verified live: `npx tsc --noEmit` clean; own vite dev server (`PYREFLY_BROWSER=gpu`),
chapter 1 (`seymour-flux`) and chapter 4 (`ffx2-bahamut`) won through
`window.__pyrefly.gotoChapter(..., { auto: 'intended', speed: 'skip' })`,
screenshots at `docs/screenshots/results/pr-0078-ffx.png` and
`pr-0078-ffx2.png` — Tidus's and Yuna's whole faces (both eyes, hair, chin) are
inside the wedge on both.

## Left for someone else

- **`BattleScreenFlow.ts:196` can write a `0:00` best time.** The flow calls
  `save.recordClear(id, outcome.elapsedMs, …)` with the *raw* wall clock,
  before the panel applies `clearTimeMs`'s plausibility floor. An automated
  run at `speed: 'skip'` therefore records a sub-second best that no human can
  beat, and Chapter Select prints it. The panel itself is safe (it records
  `this.clearMs`). Not fixed here — that file is outside this key's scope.
- **Paine has no portrait**; `results-ffx2.png` shows the `P` letter fallback
  where the other two have faces. `public/art/**` belongs to the art fleet.
- **`FFX_MS_PER_TICK = 400` is a guess.** It only matters for runs with no
  real clock, but if the CTB tick ever gets a wall-clock definition, that
  constant should follow it.
