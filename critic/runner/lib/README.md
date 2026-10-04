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
  reads and picks. **Release 38 (D-359):** a pick no longer records `badge`.
  `readPick` used to note whether the card printed the "Guide's pick" tag
  (`.mad__badge`, `badge: true`); the tag is gone from the card in both games
  because the guide and the advisor are separate, so no evidence file made
  from release 38 on carries that field. Evidence from release 37.1 and
  before has `badge: true` on the picks the tactic made. **An auditor who
  compares picks across that boundary must read "no badge" as D-359, not as a
  regression**; nothing in `critic/runner` ever keyed a verdict or a gate on
  the field (checked in the independent check of `r38-polish`, 2026-10-04).

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

### `route.mjs` — one chapter, title to board again, the full capture route

Promoted from `critic/rounds/round-13/cap/route.mjs` (gitignored, one round
only) by batch t1-b5 of `docs/plans/thresholds-program-2026-09-26.md`. Split in
four: `route.mjs` (the flow), `route-fight.mjs` (one attempt of the fight),
`route-ui.mjs` (reading and choosing from the HUD), `route-evidence.mjs` (the
browser context, the input path and the evidence files).

```
node critic/runner/lib/route.mjs <chapterId> <win|lose> --base=<url> --evidence=<dir>
     [--size=1600x900] [--budget=900000] [--tag=x] [--seed=1|drawn] [--attempts=1]
     [--touch] [--gamepad] [--reduce-motion] [--nochange] [--jpeg]
```

- **The seed (PR-0202).** `--seed=N` (default 1) calls
  `window.__pyrefly.setSeed(N)` before the first key and lists it in
  `run.json.hooks` (a labelled setup hook, CHK-015). `run.json.seed` is the
  engine's own `battleState().seed` at the first menu, `battleSeeds` has it at
  every link and retry, and `firstEnemyAction` is the first enemy
  `action-start` of the attempt, so two routes on one pinned seed can be
  compared. `--seed=drawn` pins nothing and still records the drawn seed.
  Never again read `__pyrefly.seed()`: it is the next run's pin, not the seed a
  battle used.
- **Captures assert the named state (PR-0213).** `snap(file, state, want)`
  reads the screen, the menu and the target cursor in the same call as the
  CHK-016 stale roots; `asserted` is written from that read, and a wanted state
  that was not there is written `UNVERIFIED (...)` with `verified: false`.
  The mid-fight shot resumes from the pause first; 16 and 16b are only shot
  when a target cursor really opened (one retry after a scripted line).
  `node critic/runner/lib/route-index.mjs <evidence>/index.json` is the
  acceptance check: it exits 1 if any entry's asserted screen differs from its
  stale-root screen (it finds round 13's own "in battle" pause frames).
- **Chapter VIII's Orders widget.** The PULL BACK / CLOSE IN widget is a second
  `.ig-cmd-stack` over the main one. `readRows` reads only visible rows and
  prefers the overlay stack, and a target is confirmed only when a cursor is
  up, so the advisor's "Pull back, in Orders" is played like any other move.
  The lose route takes Defend, else a standing order in VIII, else Attack.
- **Evidence contexts.** `--touch` (hasTouch, isMobile; command rows and
  reticles chosen with `page.tap`, every tap and every keyboard fallback
  counted), `--gamepad` (an init script replaces `navigator.getGamepads` with
  one standard-mapping pad; Enter, Escape and the arrows go through it, other
  keys are counted as fallbacks), `--reduce-motion` (context `reducedMotion`
  plus `emulateMedia`; the page's `matchMedia` and the save's setting are read
  back). `run.json.contexts` records each. Every run writes
  `audio-debug.jsonl` (one whole `audioDebug()` per line, no 4,000-character
  cut) and `run.json.dboxTimeline` (every dialogue line shown, speaker,
  portrait, screen and timing, from an init-script recorder).

- **Pickers, dead menus, lettered targets, dialogue (PR-0225, round 15).**
  `route-pure.mjs` holds the decisions as pure functions, with
  `tests/unit/critic-route-harness.test.ts` (game case: both; the letter rule
  is FFX only). (1) A menu row that opens an Overdrive or Grand Summon picker
  (`.ffx-mg-list`) is played with arrows and Enter on the row the advisor card
  names, and listed in `run.json.pickerPlays`; it used to be cancelled with
  Escape and replaced by Attack. (2) An open overlay whose rows are all
  disabled is backed out of with Escape, in `run.json.escapes` (with a
  `27-dead-menu-escaped` capture), and a menu that cannot be chosen from is
  counted and stopped after 25 (`emptyPicks`, `stuckRows`). (3) `confirmTarget`
  resolves a name to a `data-target-id` (display name, then trailing letter
  through `letterTagMap`, a copy of `letterTagsOf` that the test holds equal to
  it, then the old id-slug match), steers until that id is highlighted, and
  returns `wanted`, `target` and `mismatch`; every mismatch or unresolved name
  is in `run.json.targetMismatches`, so a wrong confirm is never a silent pick.
  (4) The dialogue recorder reads only `.dbox.dbox--visible` and makes one entry
  per show (`dboxStep`): a typewriter growing is one entry, a repeat or a line
  that opens with the previous line's words is a new one, and `endMs` is when
  the box went away.

- **Overdrive overlays typed as shown, the end of a route read from the screen, post scenes watched (PR-0261, round 19;
  game case: the two overlays are FFX only, the rest both).** (1) `route-minigame.mjs`: when an Overdrive overlay is up, a
  Bushido (Auron) is typed chip by chip from the glyphs on screen (`route-pure.mjs#keysForChips`; the circle is `x`,
  never Escape, which opens the pause), a Swordplay (Tidus) is confirmed when the marker, carried forward by the key's travel
  time, is inside the gold zone (`swordplayPressNow`; a miss only restarts the sweep, as in the game). The old Enter 3 s
  after the overlay opened was 0 correct inputs and a press at a random spot, so every Auron or Tidus Overdrive was a
  floor. Each play is in `run.json.minigames` (chips, keys, where the marker was at every Enter against the zone, and the
  `correctInputs` the engine received); the first of each kind is shot (`28-bushido-overlay`, `28-swordplay-overlay`). Every
  other overlay (reels, fury, Mix, the pickers) keeps the old handling. (2) `route-pure.mjs#deriveOutcome` reads the end of a
  route from the results screen's words, then from the screen and the LAST link's outcome event, never from the first
  `victory` event in the log (a chain logs one per link, and the log read at the results holds none). A fight that never
  finished is `outcome: "stalled"`, `run.json.stalledAt = { link, phase }` and a `fails` entry "stalled at link 2,
  moment:battle-start"; `rec.lastChain` is the last chain state the loop read. (3) `route-scene.mjs#watchThenTap`: a
  cutscene after the results (and the scene after CONFIRM) is watched with NO input first (`run.json.post.scene.watch`: did it
  move by itself?), then advanced with one Enter at a time; the old 4 s hold fast-forwarded it (hold-to-skip is 550 ms), which
  produced round 19's refuted "scene runs with no input" major. A hold is the fallback only after 90 taps.
  Cases: `tests/unit/critic-route-harness.test.ts` (the key table is also read against `AuronSequence.ts`'s own GLYPH table).

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

**PR-0062** (`critic/rounds/round-06.json`) asked to expose the per-link seed
a chapter actually used. No new debug API was needed after all:
`battleState().seed` is the engine's own seed, and `route.mjs` records it at
every battle start, link and retry (PR-0202, batch t1-b5).
