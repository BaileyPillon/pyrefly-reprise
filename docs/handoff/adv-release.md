# Handoff — release round 2

**Key:** `release`. Preview port 5360, serving `critic/scratch/prod-release2`
at `/pyrefly-reprise/`.

The integration pass over four parallel branches — `pause-input`, `advisor`,
`enemy-intent`, `art-manifest` — plus the production build, the real-input
verification, the commit and the live deploy.

Screenshots: `docs/screenshots/release2/*.png` (1600x900).

---

## 1. What came in, and what it cost to merge

| Branch | Landed clean? |
|---|---|
| `pause-input` | tsc + tests green; **one design gap found in the browser** — §2 |
| `advisor` | clean |
| `enemy-intent` | clean |
| `art-manifest` | clean; ends the 404 storm the live site was making |

`npx tsc --noEmit` was clean on the merged tree at first try, and the full
`npx vitest run` was **3020/3020 across 93 files** before any change of mine.
There were no type-level or test-level integration slips between the four
branches at all, which is worth recording: four agents touched
`FFXBattleHud.ts`, `FFX2BattleHud.ts`, `SaveData.ts` and `ControlsHint.ts` in
the same round and none of them collided.

Everything that follows was found by **running the built site**, not by the
suite.

## 2. The bug the suite could not see: Esc still did nothing

`pause-input` fixed `P`, Start and the PAUSE chip at the command menu, and its
own e2e proves that with real keys. It deliberately left **Esc** refused there:

```ts
private get canPauseOnCancel(): boolean {
  if (!this.canPause) return false;
  return this.presenter?.snapshot()['awaitingMenu'] !== true;   // <- was
}
```

The reasoning was sound as far as it went — Esc is the command menu's back
button, and one key cannot mean "out of targeting" and "open the pause" on the
same press. But the player's report was *"I tried esc and P during battle"*,
and the command menu is the only place a battle ever waits for a human. So the
release would have shipped with the first of the two keys they named still
doing nothing, in the exact spot they pressed it.

Caught by driving the production bundle:

```
at command menu   {"awaitingMenu":true, "stack":["title","battle"]}
after Esc         {"awaitingMenu":true, "stack":["title","battle"]}   <- nothing
```

### 2.1 The conflict is not always on

Reading both menus, Esc is only bound when there is somewhere to go back to:

* **FFX** (`ui/ffx/CommandMenu.ts`): `onSubButton` and `onTargetButton` each
  handle `'cancel'`. **`onTopButton` has no cancel branch at all.**
* **FFX-2** (`ui/ffx2/CommandMenu.ts`): the `KEY_CANCEL` branch steps
  `target -> sub -> top` and then stops — at `view === 'top'` it
  `preventDefault()`s and returns.

At the top row, in both games, Esc is unbound. That is also where a player sits
when they decide to pause. So it is free, and taking it costs the menu nothing.

### 2.2 The fix

New file `src/ui/common/menuCancel.ts` — a module-level flag, the same shape as
`setRawInputSuspended` in `ui/ffx/rawInput.ts` and for the same reason: the
presenter calls `chooseCommand()` outside App's per-frame screen loop, so
`BattleScreen` has no handle on the open menu to ask.

Each menu publishes as its view changes; `canPauseOnCancel` reads it:

```ts
private get canPauseOnCancel(): boolean {
  if (!this.canPause) return false;
  if (this.presenter?.snapshot()['awaitingMenu'] !== true) return true;
  return !menuOwnsCancel();
}
```

**The FFX side publishes from a property accessor, not from the renderer**, and
that is the one subtle part. `openTarget` sets `state = 'target'` and goes
straight to the reticle without calling `renderStack()` — publishing from the
renderer would have left Esc looking free while the player was mid-targeting,
which is the precise bug the old restriction existed to prevent. Turning
`state` into a getter/setter pair makes every one of the five transitions
publish, including that one, with no call-site changes.

Both menus also publish `false` on teardown (`finish` / `cleanup`), and
`BattleScreen.exit` resets it. Without that, a battle left mid-submenu leaves
Esc dead for every later battle in the session.

`tests/unit/menu-cancel.test.ts` (10 tests) walks every view change in both
menus with real key events, because the failure mode here is a *missed
transition* rather than wrong logic.

### 2.3 What Esc does now

| Where | Esc |
|---|---|
| Top row of the command menu | **opens the pause** |
| In a submenu | backs out to the top row |
| While targeting | backs out of targeting |
| Anywhere else in a battle | opens the pause |

`P`, Start and the PAUSE chip still work everywhere, submenus included, so a
player deep in a targeting reticle is never locked out of the pause.

## 3. A dead art path, repointed

`tests/unit/chapter-meta.test.ts` went red **mid-session**, with nothing of
mine near it: the art fleet promoted `characters/vegnagun-head/idle.1.png` to
`idle.png` while the suite was running, and Chapter 5's third snapshot still
named the un-promoted variant. One-word repoint in `src/data/chapter-meta.ts`,
same class of fix as commit `0c45fc8`.

`grep -rn '\.[0-9]\.png\|\.raw\.png' src/ --include=*.ts` is now empty, so no
other shipped path is sitting on a variant the fleet is free to promote out
from under it. **That grep is worth re-running at the top of every release.**

### 3.1 Two more, after the session crashed and was resumed

The Claude Code app crashed mid-release and took the preview server with it.
On the resume, `npx vitest run` came back **2 failed**, both `chapter-meta`,
both the same shape again — the fleet had shipped two subjects under different
names than the meta expected:

| Meta said | Fleet shipped | Fix |
|---|---|---|
| `portraits/lenne.png` | `characters/lenne/idle.png` | snapshot repoint |
| `portraits/shuyin.png` | `characters/shuyin/idle.png` | `heroArtFallback` repoint |

Neither portrait has ever existed under `public/art/portraits/`; Lenne and
Shuyin were delivered as *characters*, not portraits. So this is not a
promotion race like §3 — it is a naming mismatch that only bit once the fleet
got far enough to ship them at all.

The useful generalisation: **`chapter-meta.ts` is the one file that names art
paths by hand, and it is the file most likely to be red at the top of a
release.** Everything else now goes through the manifest.

Worth considering next round: a check that fails at *build* time rather than
in the suite, so a bad path cannot reach a bundle at all.

## 4. Edits outside my files

All additive, all with the Edit tool:

| File | Edit | Owner |
|---|---|---|
| `src/ui/ffx/CommandMenu.ts` | `state` field -> accessor pair that publishes; `setMenuOwnsCancel(false)` in `finish()`; one import | HUD |
| `src/ui/ffx2/CommandMenu.ts` | one publish line in each of `renderTop`/`renderSub`/`renderTargets`; one in `cleanup()`; one import | HUD |
| `src/app/screens/BattleScreen.ts` | `canPauseOnCancel` body + doc comment; reset in `exit()`; one import | `pause-input` |
| `src/data/chapter-meta.ts` | one image path (§3) | chapter data |

Mine outright: `src/ui/common/menuCancel.ts`, `tests/unit/menu-cancel.test.ts`,
`critic/scratch/release2-verify.mjs`, this file.

## 5. Two traps in the verification harness

Both cost a run, both are worth knowing before writing the next one.

**`gotoChapter` without `auto` never resolves.** It parks on player input, so
`await page.evaluate(() => __pyrefly.gotoChapter(id, {...}))` hangs the script
forever rather than the game. Kick it and watch the screen instead:

```js
await page.evaluate((id) => { window.__pyrefly.gotoChapter(id, {...}).catch(() => {}); }, id);
```

Same for `skipResults: false`, which parks on the results screen.

**The debug beat `pause:open` bypasses `canPause` on purpose.** Every pause
screenshot and pause test in the repo before this round opened the menu through
it, which is exactly why a pause that no real key could open stayed green for a
release. Anything asserting *a player can do this* has to use
`page.keyboard.press`.

### 5.1 Pressing Enter and then calling `gotoChapter` races two transitions

This one cost a whole verification run and very nearly went into the release
notes as a game bug. The harness did:

```js
await page.keyboard.press('Enter');   // starts the REAL flow
await pump(20);                       // ...which is nowhere near enough
await page.evaluate(() => __pyrefly.gotoChapter(id, {...}));
```

The first guess — "two transitions racing, wait for the wipe to settle" — was
wrong, and the fixed-wait version of the harness reproduced the bug exactly.
The real mechanism is a **parked promise**:

1. Enter runs `TitleScreen.advance()` -> `playWipe` -> `app.startFlow()`.
2. `GameFlow.start()` loops on `await this.chapterSelect()`, which resolves
   only when the chapter-select screen sets its own `done`.
3. `gotoChapter` -> `flow.runChapter` `replace`s chapter-select out from under
   that parked loop. Being replaced resolves `done` as **`null`**.
4. `start()` reads `null` as *the player backed out* and answers with
   `await this.app.goto('title')` — `BattleScreenFlow.ts:161`.

So the title is pushed **back** while the battle is being pushed, and the
loser's root is orphaned inside `#ui` rather than removed. Waiting for the wipe
cannot help, because the damage is done later, by `gotoChapter` itself.

`#ui` is `z-index:10`; the WebGL `#game` is `z-index:0`. So the orphaned title
painting — opaque, `inset:0` — sits over the entire battle diorama. Every
battle screenshot came back with "Pyrefly Reprise / AN UNOFFICIAL FAN TRIBUTE"
across the middle and **no actors on stage at all**, which reads exactly like
"the art pipeline is broken" and is not that even slightly.

The game is fine. Driven with keys only, the real path never leaks:

```
title        {"screen":"title",         "titleRoots":1, "screenRoots":["title"]}
after Enter  {"screen":"chapter-select","titleRoots":0, "screenRoots":["chapter-select"]}
after select {"screen":"party-prep",    "titleRoots":0, "screenRoots":["party-prep"]}
```

`screenRoots` (`#ui > [data-screen]`) holds exactly one entry the whole way
down, and `flow` uses `replace` at every step. The leak needs two flows racing,
which only a harness can arrange.

The fix is to **never start the real flow in a run that uses `gotoChapter`**.
`enterTitle()` now asserts the harness is sitting on the title and presses
nothing; `gotoChapter` replaces the title directly and the stack stays at
exactly `["battle"]`:

```
at title    {"screen":"title", "stack":["title"],  "titleRoots":1, "screenRoots":["title"]}
at menu     {"screen":"battle","stack":["battle"], "titleRoots":0, "screenRoots":["battle"]}
after Esc   {"screen":"pause", "stack":["battle","pause"],         "screenRoots":["battle","pause"]}
```

The same rule applies to any future harness: **press Enter to test the real
flow, or call `gotoChapter`, but not both in one page.**

`assertNoStaleRoots()` now runs before every battle screenshot and throws
rather than letting a contaminated PNG reach `docs/screenshots/`. It checks
that `#ui > [data-screen]` matches `app.screens` **element for element** and
that `.ig-title-screen` is gone. Both failures are otherwise silent, and both
read as art-pipeline bugs when they are not.

The wider lesson, and the reason this is written up at length: **a screenshot
that looks broken is a claim about the harness first and the game second.**
Half an hour went into "the art fleet shipped nothing to the stage" before the
DOM said the stage was merely covered up.

### 5.2 `battle-open-ch4.png` was a photograph of the title screen

The assertion added in §5.1 paid for itself on its first run by failing on a
bug that had nothing to do with it:

```
Error: stale screen roots at open vegnagun: roots=[title] stack=[title] titleRoots=1
```

The chapter-open loop asked for a chapter called **`vegnagun`**. There is no
such chapter. The ids are `seymour-flux`, `yunalesca`, `braskas-final-aeon`,
`ffx2-bahamut`, `ffx2-vegnagun-shuyin`; chapter 4 is `ffx2-bahamut`.

`getChapter('vegnagun')` returns `undefined`, `runChapter` bails to `null`
without touching a screen, the page stays on the title — and the loop then
waited its 150 frames, gave up silently, and **screenshotted the title screen
as `battle-open-ch4.png`**. That file has been in `docs/screenshots/` looking
like a chapter-4 battle for as long as the script has existed. Nothing failed,
because nothing ever checked that the chapter opened.

Both guards are now in place, and both are one line:

* the id loop screenshots only when `screen === 'battle' && awaitingMenu`;
* the results step screenshots only when `screen === 'results'`.

**A wait loop that `break`s on success and falls through on failure is a silent
failure by construction.** Every one of them in this harness now has an assert
after it. Worth grepping for the pattern in the other `critic/scratch/*.mjs`
runners, which were written the same way.

## 6. Verified in the browser

See §7 of the JSON returned to the caller for the numbers. In short: the five
real keys (Esc, P, H, N, E) driven with `page.keyboard.press` against the
production bundle, the five-chapter sweep, zero console errors, and zero image
requests answered with `text/html` — the last of those being the `art-manifest`
branch's whole point, and the reason the live network panel is no longer red.
