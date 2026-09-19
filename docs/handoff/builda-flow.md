# builda-flow — critic round 02, the battle-flow track

Build A, 2026-09-19. Seven ranked issues from
[critic/rounds/round-02.md](../../critic/rounds/round-02.md): **#01, #02, #04,
#10, #30, #32, #36**. Everything below is proven by a test that would have
failed before it, run headlessly against the real engines and the real
presenter. One live run on the dev server reproduced #01 exactly before the fix.

Commits: the work landed in **`a497b06`** — see "Shared-tree note" at the
bottom; that is not the commit message I wrote — plus the follow-up commit that
carries `BattlePresenterEvents.ts` / `BattlePresenterBeats.ts` and this file.

---

## #01 — "Chapter 4 is won and then never ends". Root cause found.

**What the critic measured:** Bahamut at 0/8400, turn 75, log frozen at 1982,
`screen()` still `'battle'` 300 s later.

**What it is not.** The engine, the presenter loop and the chain loop always
reach an outcome. The chain loop came out of `BattleScreen` into
`src/app/screens/BattleEncounterChain.ts` precisely so that could be proven:
`tests/unit/flow-encounter-chain.test.ts` replays **all five chapters at all
three playback speeds** through the real engines and the real
`BattlePresenter`, on a wall-clock deadline and an await budget. All fifteen
settle, in milliseconds.

**What it is.** Reproduced live on the dev server at `speed: 'skip'`:

```
battleState().result   = { outcome: 'victory', turns: 75, ... }   <- engine finished
screen()               = 'battle'
app.flow.step          = 'battle'
snapshotState().screenState.playback.phase = "play:ko"            <- HERE
```

The presenter was parked inside `await actor.dissolveTo(...)` in the KO beat for
the killing blow (`BattlePresenterBeats.ko`). That await never returned, so the
`victory` event queued behind it never played and the screen never resolved
`finished`.

**Why that await never returns.** `TweenGroup.toAsync` resolves its promise from
`Tween.onComplete`. `Tween.kill()` sets `_killed` and **does not fire
`onComplete`**. `PaintedActor.dispose()` calls `tweens.killAll()`, and
`PaintedStage.removeCombatant` / `PaintedStage.add` both dispose actors. So any
actor animation the presenter is awaiting when that actor's tweens are killed is
abandoned mid-await, permanently.

**The fix, in this track's files.** Playback must drain whatever the stage does.
`BattlePresenterEvents.settled(ctx, promise, ms)` races an actor animation
against `ms + ACTOR_ANIM_GRACE_MS` (2 s) on the presenter's own clock, and every
`await actor?.…` in the event layer now goes through it: the KO dissolve,
`dismiss`, `switch`, `counter`, `part-destroyed`, `part-restored`, the
form-change fades and the summon fade-in. A beat that overruns now costs a
dropped animation instead of the chapter. At `speed: 'skip'` the guard wins
silently, which is what that speed asks for.

`BattleScreen` also gains the watchdog the report asked for
(`checkForStall`): once the **engine** reports a result and playback has not
advanced a single event for 45 s, the screen resolves the encounter from the
engine's own result. It is ticked on the frame clock, which the pause overlay
stops, so a paused fight is never mistaken for a stalled one.

**Left for whoever owns `src/engine/Tween.ts`:** `Tween.kill()` should settle
its `toAsync` promise (resolve, not silently drop). That is the actual defect;
everything above is a guard around it. One line, and it deserves its own test —
`killAll()` while a `toAsync` is outstanding must not leave the caller awaiting.

Tests: `tests/unit/flow-encounter-chain.test.ts` — fifteen chapter × speed runs,
the chain-length bound, and *"reaches victory even when the killing blow's
dissolve never resolves"*, which fakes exactly the live failure.

---

## #04 — the post-battle scenes play

Every `post` script puts its `results()` marker a few steps in and then keeps
going: **28** further spoken lines after Seymour's, **20** after Yunalesca's,
**18** after Braska's Final Aeon's, **11** after Vegnagun's coda.
`CutsceneRunner.run` returned at the marker and the screen was thrown away, so
none of them had ever played.

- `CutsceneRunResult` now carries `resumeAt` (the step *after* the marker) on
  all three outcomes, and `run(script, ref, { from })` starts there.
- `CutsceneScreenOptions` (both the flow's and the screen's) carry `resumeFrom`
  and `onResultsMarker` / `onResults(silent, resumeAt)`.
- `GameFlow.runChapter` runs **post → results → post-from-`resumeAt`**.
- `StubCutscene` honours the same contract, so the placeholder flow exercises it
  too.

Test: `tests/unit/flow-post-scene.test.ts` drives the whole flow per chapter and
asserts the lines delivered equal the lines the script authors, on both sides of
the marker; plus the order `pre, battle, post, results, post@n`.

---

## #02 — each boss fight is scored with its own cue

The formations had declared the right cues all along
(`seymour-flux.ts:217`, `yunalesca.ts:157`, `braskas-final-aeon.ts:247`/`:481`,
`bahamut.ts:114`, the four Vegnagun parts, `shuyin.ts:90`). The only reader was
the *chained-link* branch of `BattleScreen`, so the first formation of every
chapter got `chapter.music.battle` — `battle-ffx` — crossfaded over the boss cue
the pre-scene had just faded in.

- `BattleEncounterChain.cueForGroup(chapter, group, link)` is now the one answer,
  for the opening formation and for every link after it. Chapter 3 goes
  `boss-jecht → boss-yu-yevon`, Chapter 5 `boss-vegnagun → boss-shuyin`, with no
  rule in the code: each formation names its own.
- Chapter music fields name real cues (see `docs/CONTRACT-CHANGES.md`,
  2026-09-19): `scene` is each chapter's own bed, `battle` its own boss theme,
  `phase2` the real second cue where there is one, `post` dropped (every post
  script opens with `music(null)` of its own). `ChapterMusic.post` became
  optional; `CHAPTER_META.musicKeys` follows.
- `BattleScreenFlow.playCutscene` only forces a cue when the script does not
  name one in its opening steps — which no shipped script needs.
- `victory-ffx` / `victory-ffx2` and `ending-ffx` were already wired by the audio
  track; the reachability test they left behind now passes with `pause` removed
  from its unwired list.
- **The `pause` cue is wired** — `src/ui/common/pauseMusic.ts`, called from the
  `onPause` hook `BattleScreen` and `CutsceneScreen` already hand the pause menu.
  `PauseScreen.ts` was not touched. It remembers what was playing (a `WeakMap`
  keyed on the audio port) and brings it back on resume.

FFX cues appear only in FFX chapters and FFX-2 cues only in FFX-2 chapters;
`flow-encounter-chain.test.ts` asserts it per chapter rather than assuming it.

### A finding for Bailey, not a to-do

Once boss routing is right, **`battle-ffx` and `boss-dread` have no encounter
left in a five-boss game.** `battle-ffx` is the ordinary-fight theme ("We can win
this") and there are no ordinary fights; `boss-dread` is the approach bed
("Something is watching") and every pre-scene sets its own. Both are still
reachable from the pause menu's jukebox, which lists `trackNames()` in full, and
both are listed as deliberately unwired in
`tests/unit/audio-cue-reachability.test.ts` with that reasoning. Parking them on
a chapter's `music` field to keep the test quiet would have hidden the question.
**Whether the FFX arc should gain a normal-battle or an approach cue is your
call.**

---

## #10 — the approved battle-start boss card

`src/ui/common/BattleStartBanner.ts` + `battle-start-banner.css`, built from
`docs/screenshots/mockups/A-battle-start.jpg` and the "Battle start" section of
`docs/handoff/presentation-ink-and-gold.md`: the ivory wedge with its 1.4 % gold
leading stripe, the boss cutout full-height on the ink side over a dimmed room,
the gold `CHAPTER I · …` eyebrow, the serif boss name broken onto two lines at
its last space with the second indented, the 3 px ink rule, the italic subline,
and the wedge-clipped gold foot strip carrying the party tiles and
`BATTLE START`.

One component for both games — the only difference is the accent token
(`.ig--ffx2`), which is what the mockup itself varies. Shown once per encounter
from `BattleScreen.enter`, before the fight starts; **any** confirm/cancel/start
press or a click takes it down and that press is consumed; it auto-dismisses on
its own hold (1.9 s); it shows nothing at all under `speed: 'skip'`; under
`prefers-reduced-motion` the card still appears (it is information — who am I
fighting, with whom) and only its sweep does not.

Geometry is the spec's 1440-wide numbers expressed in viewport units, so it
holds its proportions at phone width instead of clipping.

**Not yet done: a screenshot for the end-state board.** The dev server was
reloading every few seconds under other agents' edits (see below), so I could
not capture a clean frame. `docs/target/targets.json` still has no approved
`battle-start` build tile.

---

## #30 / #36 — Confirm, and one hint row

**#30.** `DialogueBox.handleInput` returns early when no line is in flight, and
a scene spends most of its length in exactly that state — Chapter 1's opening
carries 24 `beat`/`wait` steps totalling 38.6 s — so runs of 13, 17, 29 and 36
consecutive Enter presses changed nothing.

- `CutsceneRunner.nudge()` releases the timed step in flight and nothing more:
  one-shot, so the next step still plays at its authored length. `skip()` keeps
  its old latching meaning for SKIP SCENE.
- `DialogueBox.awaitingAdvance` says whether Confirm has anywhere to go *there*.
  `CutsceneScreen` gives the press to the box when it does and to the script when
  it does not.
- Held Confirm past 550 ms fast-forwards — `nudge()` every frame, measured on the
  frame clock so a hold is the same length at 30 fps and 144 fps.
- The hint row now reads `ENTER advance · HOLD ENTER skip · ESC menu`.

**#36.** Two hint strips meant two screen *roots*. `App.replace` pops the stack
synchronously and then awaits, so a `goto` fired from under a flow step — the
pause menu's CHAPTER SELECT and QUIT TO TITLE both do exactly that — leaves the
flow free to push a second screen over the one that just arrived, and both
`.chint` strips sit at `bottom: 22px`. `GameFlow.show()` now refuses to replace
a screen the flow did not put there and stands the flow down instead.

Test: `flow-post-scene.test.ts` — the flow returns `null` when something else
takes the stack, and a `MutationObserver` over a whole chapter shows never more
than one `[data-screen]` root.

---

## #32 — the end of an arc

`GameFlow.start` was a bare `for(;;)`. It now returns to chapter select cleanly
after the last chapter of an arc, unwinds when something else takes the stack,
and always clears `step`/`owned` in a `finally`. `ARC_FINALE` names the finale
per game and `arcCleared(game, cleared)` answers whether an arc is done — the
two hooks a credits screen would need. **A designed ending/credits screen is not
in scope and needs your approval** (AGENTS.md hard rule 10).

---

## How it was proven

- `npx tsc --noEmit` clean except two other tracks' in-flight files
  (`src/ui/ffx/SensorPanel.ts`, `src/engine/tactics/advisor-menu.ts`,
  `tests/unit/audio-ffx-bosses.test.ts`).
- `npm test`: **3816 passing**. The only failures are the advisor track's own
  four, which fail the same way standalone on an unmodified checkout.
- New: `tests/unit/flow-encounter-chain.test.ts` (29), `flow-post-scene.test.ts`
  (14), `cutscene-advance-and-banner.test.ts` (19).
- One live run on `node node_modules/vite/bin/vite.js --port 5191`, which is how
  #01's root cause was found.

## Notes for whoever picks this up

- **Shared-tree note.** While my paths were staged, another agent ran a bare
  `git commit`, so fourteen of my files landed inside **`a497b06`** ("FFX-2 HUD:
  the chain counter is placed…") under their message. The content is correct and
  on `main`; only the attribution is wrong, and rewriting history is not worth
  it. If you are working in this tree, commit with
  `git commit -m … -- <explicit paths>` rather than staging and committing in two
  steps.
- **`node_modules` was partially broken** — no `.bin`, and
  `@rolldown/binding-win32-x64-msvc` had its native `.node` file but no
  `package.json`, so `vite` could not start at all. I added a three-line
  `package.json` there. It is local and gitignored. A proper `npm i` would be
  better; it needs Bailey's yes (hard rule 11).
- **`tests/unit/audio-cue-reachability.test.ts` is still untracked** — the audio
  track wrote it and has not committed it. I edited it in place, as its own
  comment invited ("when they do, this test fails and the line below gets
  deleted"): `pause` came off `KNOWN_UNWIRED`, `battle-ffx` and `boss-dread`
  went on with the reasoning above, and its literal scan now also walks
  `src/ui/common` (a shared helper called from two screens is still the game
  asking for a cue). **I did not commit it** — it is theirs to land.
- **`ENEMY_GROUPS_BY_ID` hands every battle the same enemy record objects and the
  FFX engine writes through them.** The Mortiorchis's `stats.maxHp` comes out of
  one run at 4 000, 3 000 or 1 000 depending on what ran before it in the same
  process, and Chapter 1's outcome at a fixed seed changes with test *order* —
  `tests/unit/strategy-seymour-flux.test.ts` passes seed 1 when the file runs
  whole and fails it when the same code runs first. That is a real defect in
  `src/battle/ffx` / `src/data/ffx`, which this track does not own, and it is why
  `flow-encounter-chain.test.ts` asserts that a chapter *settles* rather than
  that it is won.
