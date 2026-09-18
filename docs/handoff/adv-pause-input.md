# Handoff — pause input, and HIDE PANELS

**Key:** `pause-input`. Port 5351 (dev), 5352 (preview of
`critic/scratch/prod-pause-input`).

The bug the player reported on the live site — *"it doesn't seem like there's a
way to pause? I tried esc and P during battle"* — plus the feature they asked
for in the same breath: a way to put the pause menu's chrome away and look at
the painting.

---

## 1. The bug, and why every existing test was green

`BattleScreen.canPause` returned `false` while
`presenter.snapshot().awaitingMenu` was true. For a human that is **nearly all
of a battle**: the only moment a fight waits is the command menu, so the only
moment a player presses Esc or P is the one moment the pause refused to open.

Reproduced before touching anything, with real `page.keyboard.press` in a live
Chapter 1 battle on a dev server:

```
before Esc: canPause:false  awaitingMenu:true  phase:"command:tidus"
after Esc : canPause:false  stack:["battle"]          <- nothing happened
after P   : canPause:false  stack:["battle"]          <- nothing happened
```

Nothing in the suite caught it because **the debug beat `pause:open` bypasses
`canPause` on purpose** (`BattleScreen.trigger`, and it is documented as doing
so — a capture tool wants the menu on a predictable frame). Every pause
screenshot and every pause test opened the menu through that beat, so they were
all green while the real key did nothing. That is the reason
`tests/e2e/pause.spec.ts` opens the menu *only* with real keys and the mouse,
and uses the debug API purely to look at the result afterwards.

## 2. The fix is about who owns the keyboard, not about which key

The old restriction was not arbitrary. Both command menus take the keyboard
straight off `window` — `ui/ffx/rawInput.ts`'s `RawInputWatcher` and the raw
listener in `ui/ffx2/CommandMenu.ts` — because the presenter calls
`HudPort.chooseCommand()` and awaits a promise, outside App's per-frame screen
loop. A pause stacked on one of those would have had two screens on the same
arrow keys, and **Enter would have resolved a real command from behind the pause
screen**, taking a turn in a game that is supposed to be frozen.

So the conflict is closed at the source and the restriction is gone.

### 2.1 `Input.claimKeyboard()` — the keyboard half

`src/app/Input.ts` now attaches its `keydown`/`keyup` listeners in the **capture
phase**, which makes it the first listener in the page. `claimKeyboard(onKey?)`
returns a release function; while a claim is up, `Input`'s handler calls
`stopImmediatePropagation()` and the event never reaches any other `window`
listener at all.

Three properties matter and each has a test:

* **The claimant still plays normally.** The swallow happens *inside* `Input`'s
  own handler, after it has recorded the press — so the pause screen keeps
  reading Esc while it owns the keyboard.
* **Unmapped keys reach the claimant.** `onKey` is handed the raw event, which
  is the only reason `H` works without adding a global binding to `Input`'s
  abstract map — a contract file thirty agents import — for one screen's toggle.
* **Chords are left alone.** `Ctrl`/`Meta`/`Alt` presses are not swallowed, so
  Ctrl+R and devtools still work with the menu up.

Claims nest (release restores the previous one) and releasing twice is a no-op.

### 2.2 `setRawInputSuspended()` — the gamepad half

The keyboard claim cannot touch the gamepad: `RawInputWatcher` polls it from its
own `requestAnimationFrame`, and nothing upstream can intercept that. So
`ui/ffx/rawInput.ts` gained a module-level mute — `setRawInputSuspended(bool)`,
four lines, default off — which `BattleScreen` flips alongside the presenter
gate in `PauseScreen`'s `onPause` callback. The poll keeps running (so the loop
is alive on resume) and `padHeld` is deliberately *not* cleared, so a button held
across the pause does not fire a fresh edge the moment the menu closes.

**This is the one edit outside the files this task owns.** It is unavoidable:
without it, opening the pause over a live FFX command menu would have introduced
a new defect (pad Cross submitting a command from behind the menu) worse than
the one being fixed. `ui/ffx2/CommandMenu.ts` needs no equivalent — it is
keyboard-only, so the claim covers it.

This also closes the "gamepad leak" that Part 2 of `pause-screen.md` lists under
*Known gaps*.

### 2.3 Esc is the one way in that still waits

| Way in | When it works |
|---|---|
| `P` | any time in a battle, command menu included |
| Start / Options (pad), `E`, `C` | same |
| the **PAUSE** chip, top-left | same, for a mouse |
| `Esc` / Circle | only when the HUD is *not* waiting for a command |

Esc is the command menu's own back button — out of targeting, out of a submenu,
back to the top row — and that is the FFX behaviour the brief asks to keep. A
key cannot mean "back out of targeting" and "open the pause" on the same press,
and the HUD does not expose its menu depth for the pause to ask about. So Esc
stays the menu's while a menu is up, and the other three cover that window.
`canPause` (everything but a minigame) and `canPauseOnCancel` (`canPause` plus
"no command menu") are the two getters, and both are in `snapshot()`.

A **minigame** still blocks the pause outright. Those are timed inputs; freezing
one mid-swing is a fairness question, not an input-ownership one.

### 2.4 The PAUSE chip

`BattleScreen` mounts a `<button class="battle-pause-chip ig">` with
`data-action="pause:open"` into its own screen root. `Input.onClick` already
turns any `[data-action]` under `#ui` into an entry in `input.actions`, so it
needs no listener. It carries `.ig` (and `.ig--ffx2`) because it sits outside the
HUD's themed stage and would otherwise print gold on a pink screen. z-index 45 —
above the HUD's layers (up to 40), below the pause overlay's 60, so the menu it
opens covers it. Styled in `pause-screen.css` because that is the stylesheet
already imported along with `PauseScreen`.

## 3. HIDE PANELS

`H`, **Triangle** (pad Y, or Shift/Tab/Q), the **HIDE PANELS** menu row, or the
chip on the hint strip. The row's label is the action, so it flips to **SHOW
PANELS**. Remembered in `Settings.pausePanelsHidden`, default `false` — a pause
menu that opened with no menu on it would read as broken the first time.

One class on the inner stage does the work:

```css
.pause--bare > *:not(.pause__art) { display: none; }
```

"Hidden" genuinely means the scrim and the vignette too. Those exist only to
give the chrome something to sit on; left behind they would be a dark ramp across
a picture with nothing on it, which defeats the point of the mode. What is left
is the painting and one faint line bottom-left — `.pause__bare-hint`, *"H show
panels · Esc resume"* — mounted on `.pause__chrome` in device pixels, for the
same reason the `ControlsHint` strip is (see `pause-screen.md` §3).

While bare, only the toggle and the two ways out answer. Arrows and Confirm are
ignored: moving a cursor nobody can see, and worse, firing QUIT TO TITLE blind,
is not a trade worth making for consistency.

`H` is not in `Input`'s abstract map. It arrives through the keyboard claim's
`onKey` callback, edge-only and chord-guarded, the same shape as the strategy
guide's `G`.

**Not done: the prep menu's CHAPTER tab.** The brief marked it optional.
`src/ui/ffx/party-prep/ChapterPanel.ts` is the tab and it belongs to another
agent; it also has no full-bleed art mode to toggle today — the hero art there is
a `background-image` behind a fixed two-column layout, so "hide the panels" would
leave an empty tab rather than a painting. Giving it one is a layout change in
that file, not a flag.

## 4. Files

| File | What changed |
|---|---|
| `src/app/Input.ts` | capture-phase listeners; `claimKeyboard()` / `keyboardClaimed` |
| `src/app/SaveData.ts` | `Settings.pausePanelsHidden` (default false) |
| `src/app/screens/BattleScreen.ts` | `canPause` no longer blocks on a command menu; new `canPauseOnCancel`; the PAUSE chip; raw-input mute wired to the pause |
| `src/app/screens/PauseScreen.ts` | the keyboard claim; HIDE PANELS (key, pad, row, chip, trigger); the bare hint |
| `src/ui/common/pause-screen.css` | `.pause--bare`, `.pause__bare-hint`, `.battle-pause-chip` |
| `src/ui/ffx/rawInput.ts` | **additive, outside this task's files** — `setRawInputSuspended()` / `rawInputSuspended()`; see §2.2 |
| `tests/e2e/pause.spec.ts` | new, 7 tests, real input only |
| `tests/unit/pause-panels.test.ts` | new, 17 tests (jsdom) |

`src/app/screens/CutsceneScreen.ts` was **read only** — Esc over a cutscene
already opened the pause with SKIP SCENE, and it was verified rather than
changed.

## 5. Verification

```
npx tsc --noEmit -p tsconfig.json     # clean, whole tree
npx vitest run                        # 93 files, 3014 tests, all green
PREVIEW_PORT=5352 npx playwright test tests/e2e/pause.spec.ts   # 7 passed
```

The e2e build is `npx vite build --outDir critic/scratch/prod-pause-input`,
served with `npx vite preview --outDir critic/scratch/prod-pause-input --port
5352 --strictPort`; playwright's `reuseExistingServer` picks that up.

### 5.1 In the running game, with real keys

`critic/scratch/pause-verify.mjs` (dev server, port 5351) drives the game the
way a player does — Enter on the title, chapter select, prep, cutscene, battle —
and presses real keys for everything. One run:

| Claim | Result |
|---|---|
| Esc opens the pause with no command menu up | `stack ["battle","pause"]` on the first press |
| The battle is frozen | log `0 -> 0` across 90 pumped frames; `paused:true` |
| Resume restarts it | log `0 -> 3` after the resume |
| **P opens the pause at a command menu** | `awaitingMenu:true` → `stack ["battle","pause"]` |
| The menu below stops hearing the keyboard | two ArrowDowns: command row `Attack -> Attack`, pause row `RESUME -> RESTART ENCOUNTER`, log `3 -> 3` |
| `H` | `panelsHidden:true`, visible stage children `["pause__art"]`, bare hint up, row label `SHOW PANELS` |
| `H` again | all nine slabs back |
| The PAUSE chip | click → `stack ["battle","pause"]` |
| Esc over the opening cutscene | `stack ["cutscene","pause"]`, rows include `SKIP SCENE`, no `RESTART ENCOUNTER` |

No console errors, no page errors, across every step.

### 5.2 Captures

`docs/screenshots/adv/` (1600x900):

| File | What |
|---|---|
| `pause-esc.png` | opened with a real Esc, early in Chapter 1 |
| `pause-p.png` | opened with a real `P` while the command menu was up — the bug |
| `pause-hidden.png` | `H` pressed: the painting, and one line bottom-left |
| `pause-cutscene.png` | Esc over the opening cutscene, `SKIP SCENE` on the menu |
| `pause-chip.png` | the battle with the PAUSE chip in the corner |

## 6. Two things seen in passing, neither mine

* **Seymour's billboard has black quads in it.** Plainly visible in
  `pause-chip.png`: two large solid-black rectangles across the boss actor on the
  Chapter 1 field. It is not a layout bug in the chip or the HUD — it is the
  painted cutout. Art track.
* **`pause-screen.md` §"Known gaps" is now one item shorter.** The gamepad leak
  described there is closed by §2.2. The other two (no transition, photo mode's
  limits) are unchanged, and the PARTY-tab clipping listed under "Still open" is
  untouched.
