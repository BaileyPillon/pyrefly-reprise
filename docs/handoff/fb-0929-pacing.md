# fb-0929 pacing: "moves and transitions happen too fast" (OPTIONS, default off)

Branch `fb-0929-pacing` (from main 1c313c17), worktree `D:/pyrefly-aeon-hp`. Not merged, not pushed, not deployed.

## The words

Bailey, 2026-09-29, passing on a friend's feedback and agreeing with it: "moves and transitions happen too fast".

## What was reproduced, and how

Measured on the **live site** (release 31a, 52a431d0) by real keys in headless Chromium at 1600x900, seed 3, with
`tools/pace-measure.mjs` (new; reads the presenter's own per-event trace, the menu state, every damage numeral's
lifetime and the transition overlays each frame; the debug API only reads, except `autoBattle('intended')` to
finish a fight so the KO and end beats could be timed). Chapter I (Seymour Flux, FFX) and Chapter IV (Bahamut,
FFX-2), plus Chapter I on a 390x844 phone viewport. Full tables: `docs/concepts/fb-0929/pacing/README.md`.

The short version, live, Chapter I:

- Tidus's plain Attack, from the confirm key to the frame settling: **0.79 s** (confirm to movement 11 ms; wind-up
  0.22 s, hit 0.35 s, settle 0.20 s). Enemy actions 0.7 to 2.5 s.
- A damage numeral is on screen **0.9 s** (0.5 s for a miss).
- The next menu opens in the same frame the last beat ends (0 ms gap).
- KO beat 0.62 s; defeat beat 1.1 s, then 1.35 s to the results screen; results wipe 0.5 s.
- Battle entry overlay 1.3 to 1.6 s (includes loading); battle screen to first menu 8.3 s (start card + camera).

FFX-2 Chapter IV is the same shape (plain attack ~0.8 s, numerals 0.9 s, menu gap under 20 ms in Wait).
Phone and desktop measure the same.

## Cause

Not a defect. The authored presentation timings (`TIMING` in `src/engine/BattlePresenterEvents.ts`,
`MOMENT_TIMING` in `BattleMoments.ts`, numeral lifetimes in `src/ui/common/damageLadder.ts`) are all `[ours]` /
`[estimate]` and play exactly as written. The fast feel is concentrated in the party's plain attacks (under
0.8 s from key to settle) and in numerals that are gone in 0.9 s, with no pause before the next menu.

## What the sources say about the originals' timing

Nothing usable in seconds. `research/ffx-vs-ffx2-presentation.md` open question 5: "Exact durations, in seconds,
for any of it ... Every timing in `visual-bible.md` §3.8 is `[estimate]`". The only retail observation is
`research/observed-ffx-steam-2026-09-26.md` §2.2: an FFX enemy Fire kept its name in the help bar "roughly 1.5 to 2
seconds" (screenshots about 0.6 s apart, not frame-exact); our longest enemy actions run 2.3 to 2.5 s, so there is
no sourced case of our spell beats being shorter than FFX's. The FFX-2 sources say its ATB is "faster" with
simultaneous actions (§4.2) and that the Config has an ATB speed (Slow / Normal / Fast; a clock rate, not an
animation speed). So **no "measured" (canon-timed) preset was built**: it would have to invent numbers (rule 6).
If Bailey wants canon pacing, it needs frame-timed footage from the Steam copy.

## The option (built, default off)

`src/engine/pace.ts` (pure, no DOM, no three): presets `current` (default, the live build, every factor exactly 1),
`steady`, `relaxed`, with separate FFX and FFX-2 values (table in the concepts README; all `[ours]`). Picked by
`?pace=<name>` at boot (`src/main.ts`) or `__pyrefly.pace('<name>')` (`src/debug/api.ts`).

What it stretches, all presentation:
- presenter waits (`BattlePresenter.sleep`) and camera moves (`BattleMoments.scale`): factor `action`;
- one-shot actor tweens (`PaintedActor.update`, `SpriteActor.update`; the idle clock is not scaled), hit sparks and
  spell effects (`BattlePresenterStage.update`): the same factor, so every guarded animation and its guard stay in step;
- damage numerals (`src/ui/common/DamageNumbers.ts`): factor `numeral`;
- battle entry (`transitions/entry.ts`) and results wipe (`transitions/index.ts`): factor `transition`.

`BattleScreen` names its game to the module when a fight starts and resets it on exit, so cutscenes and the board
are never paced, and FF7 never is.

**FFX-2 Active honesty:** the Active pump hands the engine real elapsed time only while a menu is open and waits on
the unscaled `baseSleep`; an animation never pays the clock (`BattlePresenterActive.ts` property 5). So a slower
preset costs wall time only, never ATB, in Wait or Active. Pinned by `tests/unit/pace-option.test.ts`: Chapter I and
Chapter IV played through the real presenter under `relaxed` emit the identical engine event log to `current`, and
every wait is either unchanged or stretched by exactly the action factor.

## Game case

**Both, with separate presets** (hard rule 14): FFX is CTB, one actor at a time, and stretches most (x1.2 / x1.4);
FFX-2 is sourced as a faster ATB with simultaneous actions (`ffx-vs-ffx2-presentation.md` §4.2) and stretches less
(x1.1 / x1.25). FF7 is excluded. The switch itself is shared plumbing.

## Evidence

- Live measurements: `docs/concepts/fb-0929/pacing/beats/live-ch1.json`, `live-ch4.json`.
- Per preset on this branch: `beats/ch1-{current,steady,relaxed}.json`, `beats/ch4-*.json`.
- Clips (8 s, H.264, 1280 wide, 1.5 to 1.8 MB) and two stills each: `docs/concepts/fb-0929/pacing/ch{1,4}-{current,steady,relaxed}.mp4|-windup.jpg|-numeral.jpg`.
- Contract note: `docs/CONTRACT-CHANGES.md` (PaintedActor / SpriteActor `update`).

## Checks

`npx tsc --noEmit` clean. `npx vitest run tests/unit/pace-option.test.ts` 6/6. Full suite once: 662 files passed,
1 timed out under load (`strategy-ffx2-bahamut.test.ts`, engine-only, no presenter), which passes alone (19/19).
`node tools/orphans.mjs`: 24 orphaned, `pace.ts` reachable.

## Not done

- Nothing is on by default and nothing ships: Bailey picks a preset (or none) first.
- No in-game OPTIONS row for pacing; if Bailey wants it player-facing, that is a new pause row (mockup first).
- The battle-start card and turn cut-in are not paced (they are cards, not action beats); the ability-name banner
  keeps its own hold time.
- The victory beat and battle-to-results were timed live only for FFX-2 victory and FFX defeat; the presets'
  victory path was not run (the pacing multiplies the same waits).
- The entry-overlay row includes loading time and is noisy across runs.
- A canon-timed preset needs frame-timed footage from the Steam copy (rule 6).

## CHECK (independent, 2026-09-29; did not build it)

Verdict: **no blockers.** Fresh production builds (`BASE_PATH=/`) of the branch (c19ce1f5) and of origin/main (1c313c17, a `git archive`, no worktree), served on ports 8310/8311, measured with `tools/pace-measure.mjs` by real keys, headless Chromium `PYREFLY_BROWSER=gpu`, 1600x900, seed 3, 3 turns. Raw output kept in `F:/pyrefly-parked/2026-09-29/pm/`.

- **No switch = origin/main.** Medians, main vs branch: Ch I windUp 232/232 ms, hit 357/358, actionEnd 201/202, numeral life 903/886, partyAction 779/795, enemyAction 1238/1262, KO 623/627, first menu 8248/8294, wipe 484/483; Ch IV windUp 809/809, hit 360/361, numeral 909/898, partyAction 2581/2581, menuGap 617/631, first menu 6880/6883. Differences are run noise. The per-event traces (48 events Ch I, 53 Ch IV) have identical type sequences and the same party. Code read: every hook multiplies by `paceFactor`/`paceRate` = exactly 1 at `current`; entry and wipe take the untouched path when `f === 1`; no audio file is touched (cues and levels unchanged).
- **The switch does what the handoff says** (branch, vs `current`): FFX Ch I relaxed windUp x1.37, hit x1.39, actionEnd x1.40, numeral life x1.60, enemyAction x1.36; steady numeral x1.30, windUp x1.19. FFX-2 Ch IV relaxed windUp x1.25, hit x1.26, numeral x1.50, steady numeral x1.25, windUp x1.10. Event type sequences under `relaxed` equal `current` in both chapters (48 and 53 events). Battle entry overlay grows (1311 to 1474 ms Ch I, 1402 to 1576 Ch IV; includes loading, noisy). Results wipe under a preset was not measured (no `--finish` run); the code path is a plain `durationMs` scale.
- **Claimed defect fix:** none is claimed (the handoff says "Not a defect"), so no fail-without-fix test applies.
- **Scope:** `git diff` against the merge base touches nothing under `src/battle` or `src/data`; the src changes are the 13 files the handoff names plus `src/engine/pace.ts`. Rules read: layering (pace.ts pure), contract note present, new file and edits under 400 lines, no `public/art`.
- **Checks:** `npx tsc --noEmit` clean; `pace-option.test.ts` 6/6; 28 related presenter/damage-number/transition/entry test files, 317 tests, all pass; `git merge-tree` of merge-base, HEAD and origin/main has no conflicts (origin/main equals the merge base, so the branch fast-forwards).
- Minor: the ATB-clock claim (a slower preset costs wall time, not ATB) is pinned by the unit test only; the real-key Ch IV run showed unchanged event sequences under `relaxed`, which agrees.
