# Critic capture harness (`critic/runner/lib/`)

The reusable browser-capture plumbing a critic review's capture owner and
gap-closing agents drive the game through. Promoted out of
`critic/rounds/round-06/{lib,play,supp,gap-audio}.mjs` by PR-0059
(`critic/rounds/round-06.json`), the second consecutive round with an
evidence-integrity finding (round 05 was PR-0042). Both rounds had rewritten
this plumbing from scratch and reintroduced the same class of bug: a wait
loop that times out and falls through into a screenshot of the wrong state,
or a note that claims more than the recorded data supports. This directory
exists so nobody has to write it again.

**No product code lives here, and nothing under `src/` imports it.** These are
Node scripts run directly (`node critic/runner/lib/play.mjs ...`), not part of
the app build.

## What each file guarantees

### `lib.mjs` — core primitives

- **`open({ base, width, height, fresh, touch })`** launches one browser page
  against `base` (required — nothing here hardcodes a port; round-06's bug
  was baking in `127.0.0.1:5473`, which only happened to be right for that
  one round's `vite preview`). Returns `{ browser, ctx, page, consoleErrors,
  notFound, htmlImages, net }`.
- **`waitFor(label, predicate, { ms, pollMs })`** is the one polling loop in
  this library. **It throws** `ASSERT-FAIL <label> after <ms>ms` when
  `predicate` never returns a truthy value inside the deadline. Nothing in
  this directory polls with a bare `for (...; i < N; i++)` loop that exits
  silently on timeout — that pattern is CHK-016's own recorded incident
  (`critic/CHECKS.md`): a screenshot taken after a failed wait is not
  evidence of anything, and a harness that takes it anyway is grading itself,
  not the game.
- **`assertScreen(page, expected, ms)`** reads `window.__pyrefly.screen()`
  until it equals `expected`, or throws via `waitFor`. **Guarantee:** if a
  capture's metadata says `asserted: "screen=X"`, `assertScreen` is what
  proved it — never write that string by hand next to a call that didn't
  make it.
- **`shoot(page, evidenceDir, file, meta)`** takes the screenshot and appends
  `meta` (plus `mode` and `ts`) to `evidenceDir/index.json` via
  `makeIndexer`. `meta.asserted` should name a state a helper actually read
  back, not one the caller merely intended to be in.
- **`waitBattleMenu(page, ms)`** waits for `screen() === 'battle'` and
  `awaitingMenu === true` in the snapshot, or throws.
- **`commandRows(page)`** reads the command rows the player actually sees:
  `.ig-cmd` elements inside `.ig-cmd-stack` (`src/ui/ffx/CommandMenu.ts:697`,
  `src/ui/ffx2/CommandMenu.ts:320`). Returns `{ stackPresent, rows }` and
  never throws by itself, so a caller that wants the raw read (rather than an
  assertion) can have it.
- **`assertMenuRows(page, { context })`** is `commandRows` with the
  invariant enforced: it throws if `.ig-cmd-stack` itself is missing from the
  DOM, because that means the selector is looking at the wrong screen, not
  that the menu has zero rows. **A real zero-row menu still has an (empty)
  stack** and is returned normally — that is a player-visible product
  condition worth recording, not a harness failure. **Guarantee:** every
  `menuRowSamples` / `rowCounts` entry produced by `assertMenuRows` reflects
  the DOM the player is actually looking at.
- **`sampleCutsceneSpeakers(page, { maxLines, tapDelayMs })`** advances a
  cutscene one line at a time with a **tap** (`keyboard.press('Enter')`),
  sampling the speaker before each advance, and stops when the screen leaves
  `'cutscene'`. **Do not replace the tap with a held key** —
  `CutsceneScreen.handleInput` (`src/app/screens/CutsceneScreen.ts`) nudges
  the script every frame Enter is down, so holding it for any noticeable
  duration fast-forwards through most or all of the scene in one step. That
  is exactly what made round-06's `play.mjs` sample only one speaker per
  chapter: it held Enter for 1300 ms between samples.

### `play.mjs` — one chapter, real input

Walks title → chapter select → prep → pre-battle scene → battle → post-battle
scene → results → back to chapter select with real Playwright keyboard input
(CHK-022 / CHK-015), asserting every screen transition (CHK-016) and using
`assertMenuRows` for the command-row invariant instead of a guessed selector.

```
node critic/runner/lib/play.mjs <chapterIndex 0-4> --base=<url> --evidence=<dir> [--budget=<ms>]
```

`chapterIndex` follows `['seymour-flux', 'yunalesca', 'braskas-final-aeon',
'ffx2-bahamut', 'ffx2-vegnagun-shuyin']`. Writes `<evidence>/ch<N+1>/run.json`
and the numbered screenshots named in that file, and appends every shot to
`<evidence>/index.json`.

### `supp.mjs` — supplementary passes

Four modes, still real input (a click on `[data-ui-action]` is a real pointer
event per `src/ui/ffx/rawInput.ts`):

```
node critic/runner/lib/supp.mjs <mode> <chapterIndex> [w] [h] --base=<url> --evidence=<dir>
```

- `dark <idx> <w> <h>` — fresh-profile onboarding-dark assertions. Fixed for
  PR-0059: the `pause` capture now calls `assertScreen(page, 'pause')` and
  uses its return value in `asserted`, instead of writing `asserted:
  "screen=pause"` next to an Escape press whose result was never read.
- `layout <idx> <w> <h>` — the collapsed strategy-guide chip and the guide
  column's effective text size.
- `coach <idx> <w> <h>` — onboarding forced on via the debug API
  (`injected: true` on every capture in this mode).
- `win <idx> <w> <h> [budgetMs]` — plays the advisor's own recommendation
  with real arrow-key navigation and Enter, using `assertMenuRows` for row
  reads and picks.

### `gap-audio.mjs` — mid-encounter music crossfade

Enters a chapter with real keys, then hands the turns to the shipped
"intended" auto-strategy so the run survives to a phase change, watching for
the audio track to switch.

```
node critic/runner/lib/gap-audio.mjs <chapterIndex 2 or 4> --base=<url> --evidence=<dir>
```

Fixed for PR-0059: reads `audioDebug().playing` (the field
`AudioManager.debug()` actually returns, `src/audio/AudioManager.ts:550`)
instead of a best-effort `d.music ?? d.currentTrack ?? d.track`, none of
which exist on that object — every prior sample recorded `music: null` even
while the raw debug object showed a track playing.

### `cli.mjs` — small arg helper

`parseArgs`, `requireBase`, `requireEvidence`. `requireBase` /
`requireEvidence` throw immediately with a usage message when neither the
flag nor the matching env var (`PYREFLY_BASE`, `PYREFLY_EVIDENCE`) is given —
on purpose: hardcoding a port or a round's evidence path into the library
itself is exactly how it drifted stale between rounds 05 and 06.

### `selftest.mjs` — does the library still work

```
node critic/runner/lib/selftest.mjs
```

No flags. Builds the app into a scratch temp directory (never the shared
`dist/`), serves it with `vite preview` — the same way every real deep
review serves its subject, never `vite dev` (dev mode's dependency
pre-bundler can force a full-page reload the first time chapter/battle code
is requested, which has nothing to do with the harness and would make the
test flaky for the wrong reason) — and drives one chapter to a real command
menu with the debug API's fast path (`gotoChapter(..., { speed: 'skip' })`;
fine here because nothing this script produces is ever critic evidence).
Then it asserts, and **throws on failure**, the exact three things PR-0059
found broken:

1. `assertMenuRows` sees real, non-empty `.ig-cmd` rows on an open menu.
2. `assertScreen` reads back a real `'pause'` after Escape.
3. `audioDebug()`'s response actually has a `playing` field.

Budget: 90 seconds wall clock, build and server start included (typically
finishes in 10-15s: ~1-2s to build, a few seconds for the browser and the
fast-path battle entry). Picks a port from `6100 + pid % 400` to avoid
colliding with another agent's dev server (5173/5190) or preview server
(5400-5990) in this shared tree, and kills its own preview server by its own
PID (spawned via `node node_modules/vite/bin/vite.js`, not `npx`/`npm run
build`, so the PID is the real process and not a shell wrapper) and deletes
its scratch build directory in a `finally`, whether it passed or not.

## How a reviewer uses this

1. Start (or reuse) whatever is serving the subject — the production
   candidate via `vite preview`, or the live site directly.
2. `node critic/runner/lib/play.mjs 0 --base=http://127.0.0.1:<port>/pyrefly-reprise/ --evidence=critic/rounds/round-<NN>/evidence`
   once per chapter index 0-4.
3. Add `supp.mjs` / `gap-audio.mjs` passes as the review plan calls for,
   pointed at the same `--base` and `--evidence`.
4. Read `<evidence>/index.json` and each chapter's `run.json` /
   `supp-*.json` — every entry's `asserted` field names a state a helper in
   this library actually read back.

Before trusting a round's evidence, or after touching anything in this
directory, run `node critic/runner/lib/selftest.mjs` — if it doesn't pass,
nothing captured with these scripts is trustworthy either.

## What this does not fix

**PR-0062** (`critic/rounds/round-06.json`) asks to expose the per-link seed
a chapter actually used through the debug API, so a bench seed can be
reproduced in play. That is a change to `src/debug/api.ts` — product code,
not the harness — and is out of scope here; AGENTS.md rule 10 requires
Bailey's yes before anything new is built there. Listed, not built.
