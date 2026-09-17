# Round 2 — `speed: 'skip'` really does make a mid-battle beat cheap

Fixes issue **1 (HIGH)** of `docs/handoff/playability-round-1.md` §4: an
automated run at `speed: 'skip'` paid full price for every mid-battle story
beat, three of the five chapters logged a `console.error` on every sweep, and a
chapter took minutes of wall clock that the beats — not the battle — were
spending.

---

## 1. What was actually wrong

Three separate things, and the round-1 report named two of them. All three had
to go for `'skip'` to be free.

### 1.1 The skip latch was one-shot, and every beat cleared it

`setAutoAdvance(on, { instant })` did two things: swap the dialogue port for a
no-op, and call `runner.skip()`. But `skip()` is a latch on the script **in
flight**, and `play()` opens with `runner.reset()`, which set `skippedFlag =
false` again. So a chapter got exactly *one* cheap beat — the one that happened
to be playing when the speed was set, usually none — and paid the full eight
seconds for every beat after it.

This is why the round-1 report could say `'skip'` "only swaps the dialogue
port": functionally that is what was left of it.

Fix: `CutsceneRunner.setInstant(on)` — the same fast-forward, but **sticky**.
`reset()` now restores the skip latch to the instant flag rather than to
`false`, so the latch is a property of the playback speed rather than of one
script. `src/story/runner/CutsceneRunner.ts`.

### 1.2 Nothing collapsed a `wait` or a camera move

`const wait = opts.sleep ?? sleepMs` was always the real `setTimeout`, because
`BattleScreen` never passed a `sleep`. A `beat(3000)` cost three seconds even
at `'skip'`.

Fix, in two places, because two different things can change:

* `BattleScreen.ts` now injects a clock at construction — `defaultSleep` with
  the interval zeroed when the run **starts** at `'skip'` (an e2e/critic run).
  `defaultSleep` rather than a bare `Promise.resolve()` on purpose: a resolved
  promise is a microtask, and a battle made of microtasks never yields to
  `requestAnimationFrame` — the reason `BattlePresenterUtil` documents that
  primitive at all.
* `BattleScreenCutscenes.ts` collapses the same waits again from inside, keyed
  on its own `instant` mode. That is the path a speed change *mid-fight* takes
  (`BattlePresenter.setSpeed` → `syncAutoAdvance` → `setAutoAdvance`), which
  the screen cannot see from its constructor.

Camera moves are collapsed differently, because a tween that is merely not
awaited is a tween still running into the fight that resumes under it. Under
`'skip'` a `camera` step **snaps** the rig (`CameraPort.snapTo`) and a
`showActor`/`hideActor` sets the alpha outright. Same end state, no frames.

### 1.3 The budget was on the wrong clock

This is the one that fired the `console.error`, and it would have kept firing
in `auto` mode even after 1.1 and 1.2.

A beat's animations are advanced from `update(dt)` with `dt` clamped at
`1/20 s` (`App.ts`), so an authored `camera('action', 400)` cannot finish in
fewer than **eight rendered frames**, however long those frames take. The
8,000 ms budget was a plain `setTimeout`. Under SwiftShader — the gallery, the
sweep, CI — eight frames is seconds of wall clock, so the beat lost a race it
was never given a fair shot at, got cut short, and logged.

Fix: the budget and each line's deadline are now spent in **scene time**,
ticked by the same `update(dt)` the tweens are. Wall clock survives only as a
**stall guard**: if no frame has arrived for `FRAME_STALL_MS` (500 ms) the loop
has stopped underneath the beat (`App.stop()` mid-capture, a backgrounded tab)
and scene time is never going to advance again, so the wall-clock reading is
allowed to end it. A beat must never be able to wedge a battle, and it still
cannot.

Under `'skip'` there is no budget at all — nothing is raced, so nothing can
overrun. That is also why the log is gone rather than merely quieter.

### 1.4 …and the log is no longer a `console.error`

An overrun is a pacing note: the fight carried on, the remaining poses, flags
and music still landed. It is not a fault, and every automated gate we have —
the sweep, the gallery report, CI — fails a run that logs a `console.error`.
So: `console.info` under a strategy, `console.warn` for a human (there it means
a beat someone was watching got cut off), never `console.error`. Still once per
script name.

---

## 2. Measured: the five-chapter sweep

`critic/scratch/sweep.mjs`, seed 1, Chromium on SwiftShader, one fresh page
load per chapter, driven by

```js
window.__pyrefly.gotoChapter(id, {
  skipCutscenes: true, skipPrep: true, seed: 1, auto: 'intended', speed: 'skip',
})
```

**Both halves were run on port 5241 against an isolated copy of the tree**
(`scratchpad/app`, source snapshot + junctions to `node_modules` and
`public/art`), so a concurrent agent's half-saved file could not decide the
result — the first attempt on the live tree was killed by exactly that, twice.
The "before" build is this same tree with the four behavioural changes reverted
in place, so the two runs differ only in those.

<!-- RESULTS -->

---

## 3. Files

<!-- FILES -->

---

## 4. Notes for whoever picks this up next

* `FRAME_STALL_MS` is the only wall-clock number left in the beat path. If a
  capture ever legitimately renders slower than one frame per 500 ms, it will
  start ending beats early again — raise it there rather than going back to a
  wall-clock budget.
* `DialogueBox`'s own `auto` hold still reads `performance.now()`
  (`src/ui/common/DialogueBox.ts`), so a line's *hold* is wall clock while its
  *typing* is frame-driven. It is bounded by the scene-time line deadline now,
  so it cannot overrun a beat, but it is the next thing to move if a beat ever
  reads as rushed under a slow renderer.
* `BattlePresenter.fastForward()` sets `speed` without calling
  `syncAutoAdvance()`, so holding R1 does not put the runner into `'skip'` mode
  even when it reaches that speed. Pre-existing, deliberately left alone: the
  injected clock keys off the speed the run *started* at, so nothing a human
  presses can silently blow through a beat's dialogue.
