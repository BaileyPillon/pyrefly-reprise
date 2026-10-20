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
     [--size=1600x900] [--budget=<ms>] [--tag=x] [--seed=1|drawn] [--attempts=1]
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
  it, then the id that IS the name's slug, then the one id that starts the slug or that the slug starts; two ids that fit are
  unresolved, never the first on screen: PR-0397, round 25), steers until that id is highlighted, and
  returns `wanted`, `target` and `mismatch`; every mismatch or unresolved name
  is in `run.json.targetMismatches`, so a wrong confirm is never a silent pick.
  (4) The dialogue recorder reads only `.dbox.dbox--visible` and makes one entry
  per show (`dboxStep`): a typewriter growing is one entry, a repeat or a line
  that opens with the previous line's words is a new one, and `endMs` is when
  the box went away.

- **Overdrive overlays typed as shown, the end of a route read from the screen, post scenes watched (PR-0261, round 19;
  game case: the two overlays are FFX only, the rest both).** (1) `route-minigame.mjs`: when an Overdrive overlay is up, a
  Bushido (Auron) is typed chip by chip from the chips on screen (`route-pure.mjs#keysForChips`; the circle is `x`,
  never Escape, which opens the pause; since release 39 a chip names the key for the device, "Q△" on a keyboard, so the
  harness reads each chip's `data-btn` first and its bare glyph only for a build that has none), a Swordplay (Tidus) is confirmed when the marker, carried forward by the key's travel
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

### `continuity.mjs` — CHK-026 and CHK-027, frame by frame (Bailey, 2026-10-04, D-420 to D-426)

The harness for "as poses change the characters change size", "pose changes snapping around in a discontinuous half
motion". Before it the critic took stills and timed sequences at moments picked in advance, so the frames just before and
after a pose swap were rarely side by side, and no check followed a figure's size or feet over time.

```
node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir> --chapters=seymour-flux,ffx2-bahamut,evrae-airship
     [--goal=win|lose] [--size=1600x900] [--budget=1800000] [--seed=1] [--tag=x]
     [--pose-measure=<pose-measure.json> | --pose-measure-from=<repo root>] [--only-aggregate] [--summary=<file>]
```

Run it with `PYREFLY_BROWSER=gpu` (in software the game draws at about 3 fps and two frames of one swap cannot be told
apart; the harness says UNVERIFIED below 30 fps). One chapter after another, one browser at a time, headless Playwright from
node (never the Claude-in-Chrome extension or the built-in pane). For each chapter it runs `route.mjs` (real keys, title to
board again) with `--continuity`, which attaches the probe to the route's own page, and writes

- `<evidence>/<chapter>-<goal>[-tag]/continuity/continuity.json`: the two checks' results with their reasons, the summary
  (battle seconds, swaps per minute, head and feet worst cases, snaps per minute, ghost swaps and frames, jerks), `perFigure`
  and `coverage` (who was measured by the registration and who from the silhouette, pose by pose), every swap (figure, from
  and to pose, head ratio and its source, feet shift in px at 1600 wide, outline IoU and centroid shift, blend and ghost
  frames, cut or snap, the battle-log event just before it) and every jerk (px, the move's own speed, at a swap or mid-move);
- `.../continuity/strips/*.jpg`: the transition strips of the worst ten swaps, the worst five jerks and the worst five double
  images, each figure and pose pair once before any repeat of one (see below);
- `<evidence>/continuity-summary.json`: every chapter, and the whole run's numbers and checks (snaps per minute over all the
  battle seconds). `CONT_RAW_DIR=<dir>` also keeps what the probe recorded, gzipped, to re-run the analysis later.

How it sees (all of it plain engine state a running build already exposes; **no engine hook, so it also measures a build that is
already live**; `tests/unit/critic-continuity-contract.test.ts` pins every field it reads):

| File | Does |
|---|---|
| `continuity-probe.mjs` | Runs in the page right after each frame the game draws (`app.nextFrame()`): per visible figure, each of its two painted planes' pose, fade and the screen position of the painting's four corners (mirror and yaw included); how far the camera alone moved the figure's world point; the battle log's new events; a rolling buffer of rendered frames, from which 14 frames before and 6 after every swap and every jerk candidate (20 cells; the ring is never shorter than that) are cropped to the figure and JPEG encoded two per frame. A swap is the frame in which the painting that dominates a figure changes (so a cut, a crossfade and the KO collapse are all swaps). A pose is keyed by the figure, the pose name AND the painting the plane draws (`slot.painted.url`): a spherechange or a boss's change of form re-points the same pose name at another painting, and the earlier key (name only) kept reading the first painting's head, feet and outline for every later one (release 39's round 22 read Paine's registered feet 20 px off at every swap that way). **Version 2 (pose continuity W4):** while the camera moves, each plane's record also carries how far the camera alone moved each of its four corners since the last frame (`cs`, 8 numbers; nothing while the camera is still), so the node side can project the shift of each tracked point. |
| `continuity-rig-probe.mjs`, `continuity-rig.mjs` | **(R57-002, release 58)** A RIGGED figure draws no plane, so the painted probe saw it never change pose. `continuity-rig-probe.mjs` is stringified into the page beside the probe (`env.rig`) and reads a rig from the public surface of `RigActor` (`pose`, `blending`, `landmark`, `feetPoint`, `contentQuad`, the head part's mesh): per frame the head, feet and centroid on the screen and in the idle plane's own coordinates, the mesh areas and the key's box. The probe treats the rig's KEY as the pose, so a change of key is a swap (`swaps[].rig`). `continuity-rig.mjs` reads it back: `rigTrack` (what `figureTrack` returns for a rig), `analyzeRigSwap` (a change of key judged on the head mesh, the planted feet's ground line and the key's height, at the last frame before it and the first after it with no move in flight), `rigCoverage`, and the policy's `rig` block (`false` gives the earlier reading back). `critic/CHECKS.md` CHK-026 item 9. |
| `continuity-silhouette.mjs` | **(W4: also the pixels' own readings: the silhouette's stance, its top and ground line (`estimateExtent`), the subject's kind and the pose's class from `tools/posescale/pose-kinds.mjs`, a hold's real head ratio, the record's painting sha.)** Decodes each painting's alpha (sharp) and finds its anchors: the head box and the stance from the registration (`docs/target/pose-measure.json`, `tools/posescale/`) where a fresh record exists, else the stance, the mass and the centroid from the silhouette (a figure with no registration is followed by its centroid, r40). A head cannot be read off a silhouette (the neck estimator tried was wrong by 22 percent at the median); the header says what was measured against what. |
| `continuity-pure.mjs` | The maths: a flat plane through the camera is a homography of its four corners, so any anchor is one multiply; head size, feet, outline IoU and centroid shift, blend and ghost frames, snaps, jerks, the summary and the two verdicts. Held to known answers by `tests/unit/critic-continuity-pure.test.ts`. |
| `continuity-readings.mjs` | **(W4)** The HEIGHT, the independent FEET and the real HEAD readings of CHK-026, all from the pixels and the planes' quads of one frame, judged in the gate's bands (`tools/posescale/pose-bands.mjs`); `poseReadings` is what `analyzeSwap` calls. Held by `tests/unit/critic-continuity-pose.test.ts`. |
| `continuity-camera.mjs`, `continuity-geometry.mjs` | **(W4)** The camera's shift of any point of a painting on a plane (exact: the plane is flat, so the plane's quad now and its corners under last frame's camera are two homographies), and the projective maps themselves (`unitSquareToQuad`, `applyH`, `invertH`, `polygonArea`), split out of `continuity-pure.mjs`, which re-exports them. |
| `continuity-waivers.mjs` | **(W4)** The pose waiver ledger (`docs/target/pose-waivers.json`, the gate's): which poses the owner (or, for a `legacy` row, the release driver under his request) has let stand outside a band. A waived pose is read and shown, never failed; a row whose sha names another painting is stale. |
| `continuity-staged.mjs` | A swap with a figure's FFX-2 `twirl-*` key on either side is one staged costume change, not a snap (r40 instrument edit (b)): the classification, and the grouping of the steps of one change. |
| `continuity-wash.mjs` | The Save Sphere's wash (r43, FOC40-02): how much of the picture the veil hides (its element's opacity times its background alpha), whether the step of a jerk was under it, the `covered` tag, the spans of frames the wash was up. The probe records the opacity; this reads it. |
| `continuity-held.mjs` | The longest freeze in the middle of a blend (both paintings showing, neither fade moving), read from the fades (r40 instrument edit (c)). |
| `continuity-summary.mjs` | The chapter's numbers and the two verdicts (`summarize`, `verdicts`, `swapBadness`, `distinctFirst`, `worstSwaps`): split out of `continuity-pure.mjs`, which re-exports them, to stay under the 400-line house limit. |
| `continuity-analyze.mjs` | From the probe's records to swaps, jerks, summary, per-figure coverage and the worst events. |
| `continuity-strips.mjs` | Puts the cropped frames side by side with a green line at the head and an orange line at the feet (magenta at the centroid, for a figure followed by it) taken from the frame before the event, a cross where each frame's head and feet were measured, the event cell outlined in red; more than 12 cells go in two rows. |
| `continuity.mjs` | `attachProbe` (used by `route.mjs --continuity`), the chapter loop and the aggregate. |
| `continuity-calibrate.mjs` | Read-only: re-runs the two measurements the wide tolerances rest on (the silhouette's stance and mass against the reviewed registration) and prints them. |

**R59-D146, a key that brings in another head (release 59, decision 146; both games, review tooling).** `continuity-rig-probe.mjs` now also reports `rg.hv`, the name of a head VARIANT part drawn at a real size (`continuity.rig.headVariants`: `front`, `fdef`, `fod`; `variantMinArea`, 0.02 of the idle plane, because a version 1 rig stores such a part as an always-visible speck), and `continuity-rig.mjs#analyzeRigSwap` compares the `head` part's mesh only between two keys that show the same head: a change into or out of Lulu's front-view `defend` or `od-fury` is `metric: 'variant'` and is judged by the head the registration gives the key (`analyzeRun({..., measure})`, `realHeadOfRegistration`) against the key's class band, not by a mesh ratio that read 0.80 and 1.25. Kimahri's `follow` (1.29 of the idle's height, PR-0462) still fails on its height. Cases: `tests/unit/critic-continuity-rig-analyze.test.ts`, `critic-continuity-rig.test.ts`, and the five shipped rigs' real files in `critic-continuity-rig-real.test.ts`. Details: `critic/CHECKS.md` CHK-026, R59-D146.

**Pose continuity (W4, 2026-10-16; Bailey: "pose continuity is the strongest recurring issue we need a permanent fix for this please.").** CHK-026 gains a HEIGHT reading and a FEET reading from the pixels (and the real head across a recorded hold), the head reading is kept and labelled `control`, CHK-027 is split into jerks AT a pose swap (gated) and mid-move dashes (reported; a mid-move step of 300 px or more is a teleport and still gated), the camera's shift is projected per tracked point (probe version 2), and the frame time is a number of its own (`summary.frameTime`, each jerk's `frameMs` and `longFrame`). `critic/CHECKS.md` CHK-026 item 8 and CHK-027 item 9 have the reasoning and the numbers, `continuity` in `critic/policy.json` the switches (`readings`, `jerks`, `waivers`, `tracking.camera`), each of which gives the earlier reading back for an old-versus-new run of one recording. **Replaying a recording** (`CONT_RAW_DIR=<dir>` keeps the probe's frames gzipped): `anchorsForPoses` (with `waivers: loadPoseWaivers(...)`) then `analyzeRun` re-runs the whole analysis on it offline, the paintings read from `public/art` (see `D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/w4/replay.mjs`). Nothing in a version 1 recording says where the camera moved a head, so those keep the origin's shift. The static census (`node tools/pose-gate.mjs --report`) is not part of this harness: the plan lists it for every candidate (`plan.staticChecks`).

**What CHK-026 judges (r391).** A change of *pose* inside one outfit or form. A swap between two paintings of different subjects (a dressphere change, a boss's next form: `costume`) is staged by its own sequence (the twirl) and a swap between two pose names that draw one painting (`sameArt`: a pose that falls back to the idle's) cannot change the figure's size and moves only by the pose state's own recoil or lean (CHK-027's jerks): both are counted and shown (`size.costumeSwaps`, `costumeWorstHeadPct`, `costumeWorstFeetPx`, `sameArtSwaps`) and not judged against the 3 percent and 2 px tolerances.

**Setup hook `ROUTE_SETART` (r391).** `ROUTE_SETART=<party art prefix>:<art id>` (for example `rikku:rikku-berserker`) swaps that figure's painting once at the first menu, the way a spherechange does (`Stage.setArt`), then waits 16 s for the dressphere twirl; it is a labelled setup hook like `setSeed` (CHK-015), recorded in `run.json` `hooks`. It exists so the harness can play a painting no chapter's Garment Grid offers (no build puts Rikku Berserker one Change away); use it with `NOCHANGE=1` so the route's own scripted CHANGE does not swap the art again.

**Stall watchdog (r391).** `route-fight.mjs` watches the battle log: with no new event for `ROUTE_STALL_MS` (default 120 s) it backs out of every menu (three Escapes), notes `stallRecovery` and keeps a screenshot (`27b-stalled-menu.png`); after three recoveries with still nothing it gives the fight up as stalled (`run.json` `stuckStop`). Round 22's Chapter VI and the first r391 run both sat 10 to 15 minutes in a submenu the route could not leave (the advisor wanted an item, the open list was White Magic, PR-0348) and only then ended.

**Fight budget.** `--budget` (default 1,800,000 ms, 30 minutes; it was 900 s; since r43 a chapter with a long-fight budget of its own in `route-pure.mjs` `LONG_FIGHT_BUDGET_MS`, Chapters II, III and XVII at 50 minutes and XIII at 100, gets the longer of the two: round 25's Chapter III had 1,733 s of battle inside the 1,800 s cap, PR-0433) is how long a chapter's fight may run before the route cuts it; round 22 ended Ch III, V, XI, XII and XVII mid-fight at 900 s. `route.mjs`'s `findCard` now walks every tile of the 18-tile board (PR-0359: the old walk never reached Ch XVI Ixion), and `--summary=<file>` keeps a retry from overwriting a review's `continuity-summary.json` (PR-0398).

**The Save Sphere's wash (r43; docs/handoff/r41-aeonjump.md, FOC40-02; FFX-2 Chapter XI only in effect).** The card between the links of the Road washes the whole frame to a pale lilac white (`.ssphere__wash`, `rgba(246, 240, 250, 0.74)`, so it hides 74 percent of the picture at full opacity) and restages the next link under it; Anima's group scale lands under the wash, her head climbs about 900 px in one frame, and the probe, which copies the canvas and cannot see an HTML overlay, counted it as a jerk (960 px in the trace, 967.7 px in round 25): the run's headline worst jerk and the first of its strips, though not what decides the chapter (round 25's Chapter XI has 15 more jerks of 40 px or more). The probe now reads the wash element's computed opacity on every frame it is up (`continuity.wash.selector`; `w` on the frame record and `meta.wash.alpha`), and a jerk whose step (frame n-1 to n, both frames) was under a wash carries it in `continuity.json` (`jerks[].wash`, the cover it gave; the chapter's `wash` block shows where the wash was up and `jerksUnderWash`). **The excuse is the owner's and ships OFF until his yes** (the definition of a jerk is Bailey's, D-420 to D-426; r41-aeonjump listed it as an option "neither built" under AGENTS.md rule 10; no yes of his is recorded): with `continuity.wash.excuse: false` every jerk is counted as before and the wash is only shown on the ones it was over. With `excuse: true` (his words and date quoted in the policy note, a D-row in the ledger, the `minCover` he picks: 0.7 or 0.5) a jerk whose step was under a veil that hides at least `continuity.wash.minCover` is tagged `covered` and left out of the summary, the verdict and the worst-jerk strips; it is not hidden even then: `continuity.json` keeps it in `jerks` with the wash over it, counts it in `summary.motion.jerksCovered` and `worstCoveredJerkPx`, and says so in a `note` on the CHK-027 result. `CONT_CFG='{"wash":{"excuse":true}}'` runs that what-if for one run without touching the policy (the way to show him the effect first); `selector: null` stops the probe reading the page. `tests/unit/critic-continuity-wash.test.ts`, and the guard in `tests/unit/critic-continuity-policy.test.ts` that a switch of this kind is on only with his words in its note.

**The harness prints a `REPORT LINE:` too** (r43, PR-0450: one per instrument) and writes it as `reportLine` in `continuity-summary.json`: the chapters, the battle seconds, the frame rates it ran at, how many chapters it ran as the dedicated harness, both verdicts with their reasons and the jerks the wash covered.

**The probe belongs to this harness (r43, PR-0450 d).** `route.mjs --continuity` stops before it opens a browser unless `continuity.mjs` started it (`CONT_DEDICATED=1`): a probe attached to a capture route ran beside other work, without the pose registration, and read a loaded host (round 25: Chapter I 41.8 percent and 48 px at 46 fps against 12.1 percent and 0.8 px at 59.6 fps on the same chapter), so inline numbers are not scored. Run this harness alone, on an idle host.

Thresholds, caps and their reasoning are the `continuity` block of `critic/policy.json` and `critic/CHECKS.md` CHK-026 and
CHK-027; the caps on the sub-scores are RUBRIC section 6a and `continuityCaps` (`tools/critic-continuity-caps.mjs`, re-exported by `tools/critic-policy.mjs`). What it does not
see: pose changes in cutscenes (it watches the battle screen), a figure drawn by no plane (Vegnagun's parts), anything the
page cannot give it on a build whose field names changed (it then says UNVERIFIED and the contract test fails first).

### `coldload.mjs`, `sweep.mjs`, `gap-boot.mjs` — the delivery and legibility instruments (r43, PR-0450)

Round 25's capture owner wrote `delivery.mjs` and `pause-matrix.mjs` for the round, and both mis-measured: the first loaded the page twice and started its clock after the page was ready, so the number it printed was a warm second load; the second swept an 11 px floor, recorded no minimum and ran Chapter I only. The chief's `coldload.mjs` and `sweep14.mjs` measured it right; they are these files now, so the next review runs them instead of writing a third pair. Each prints one `REPORT LINE:` for the review's report and writes its numbers under `<evidence>/gaps/`. Run them one at a time, alone, with `PYREFLY_BROWSER=gpu`, from node (never the Claude-in-Chrome extension or the in-app pane); the pure rules are in `coldload-pure.mjs` and `legibility-pure.mjs`.

```
node critic/runner/lib/coldload.mjs --base=<url> --evidence=<dir> [--size=1600x900] [--runs=3] [--throttle=1.6,0.75,150|off] [--frames=0]
node critic/runner/lib/sweep.mjs <battle|phone|prep|matrix> --base=<url> --evidence=<dir> [--floor=14] [--chapters=a,b] [--tabs=7]
```

- **`coldload.mjs`** (delivery: "measured loading ... on named hardware, browser, network and cache conditions"). Per profile (three unthrottled, one at 1.6 Mbps down / 0.75 up / 150 ms): a fresh headless Chromium, the HTTP cache switched off over CDP *before* the navigation, **one** `goto` that returns at the commit, the clock started *before* that `goto`, and *ready* meaning the debug API is ready and the screen is the title; then Enter must move the title on (`enterToNextMs`). The run records how many times the main frame navigated and whether the cache was off; a run that navigated twice, or whose cache was not off, is **not a cold-load number** and is named in the line instead of averaged. The host's CPU is sampled for a second before every run: a busy host (over 40 percent) is written into the run and the line, so a number taken beside other browsers is never passed off as an idle-host number. The line carries the median and range of the unthrottled loads, the bytes and requests by the title, the throttled load, and the conditions (URL, rendering mode, viewport, Chromium version, OS, CPU, cores, RAM; no host name). `--frames=180` also samples frame times on the screen the run ends on, named.
- **`sweep.mjs`** (CHK-003 and CHK-009, and CHK-002's matrix). `battle`: all 18 chapters at 1600x900, the first command menu as the player meets it (coach marks still up), the menu with them cleared, and the pause opened from it. `phone`: four chapters at 390x844 with a touch context. `prep`: Chapter I and Chapter IV at both sizes, every prep tab. `matrix`: Chapter I at CHK-002's six viewports, each in a fresh browser, with the pause plate's rect, `currentSrc`, scale chain and page width read off the open pause. Every surface records the **smallest text** and the **count under 14 css px** (`--floor`), and the clipped or ellipsised names. A surface it could not reach (a pause that did not open, a menu that was not awaiting input when it was measured, a chapter that did not load) is **UNVERIFIED with the reason**, named in the line and never counted as a pass; a snapshot is claimed only for the state its read-back found (`makeSnap`).
- **`gap-boot.mjs`** (`bootChapter`): title, board (by arrow keys or a hidden chapter's typed word), prep, the pre-battle scene and the first menu, by real keys; the scratch `gaplib.mjs#boot` of the last two rounds with the subject and the evidence folder as arguments and the failed snapshots handed back.

Cases: `tests/unit/critic-instruments-coldload.test.ts` (the order of the calls on a fake page and a virtual clock, and the rules), `tests/unit/critic-instruments-legibility.test.ts` (`collectText` run inside a jsdom window as `page.evaluate` runs it, the judging, and the sweeps against a fake booted chapter). The lane that promoted them was not allowed a browser, so they have not yet been run live: the first review that runs them should say so if either misbehaves, and the report line is the proof they ran.

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

**Lulu's Doublecast (release 59, CHK-022; FFX only).** `route-doublecast.mjs` plays the card's `"Doublecast: Firaga + Firaga"` as Special > Doublecast > the first cast's row and its target > the second cast's row and its target (`playDoublecast`; `doublecastCasts` reads both names, an exact row name is tried before one that merely contains it). The route used to look for one row containing the whole text after the colon (`firaga + firaga`); the list's rows are the spell names alone, so no Doublecast was ever played, `dcFail` reached 2 on the second try and every later one fell to Attack: in the release 58 review's Chapter III run 84 of 368 picks were Lulu's Doublecast turned into an Attack, and the party fell with the boss at about half HP (live r57 too). Cases: `tests/unit/critic-route-doublecast.test.ts`, built on that run's card, Special rows and recorded steps. On the real game (Chapter III, seed 1, 1600x900, 9 minutes of fight): 12 Doublecasts played as Firaga + Firaga (`run.json` `doublecast`, 0 misses, no `dcFail`; the engine log shows Lulu's "Doublecast: Firaga" 12 times), the first form (60,000) was down at about 7 minutes and the 120,000 form was reached, where the release 58 route had the first form at 39,000 of 60,000 after 9 minutes, reached the 120,000 form after 15 and fell at 60,000 of 120,000 after 32 (the full chapter was not replayed here; the review owes that run).

**Where the CHK-022 route's moves come from, and why Chapters III and XIV did not finish in the release 58 review (release 59 diagnosis).** The route (`route.mjs` / `route-fight.mjs`, also the one the continuity harness starts) plays by real keys and takes every move from the advisor CARD on screen (`route-ui.mjs#readAdvice`: the card's label, target and "in <menu>" chip). It does not use `__pyrefly.autoBattle`, which plays the chapter's TACTIC (`BattlePresenterStrategies.ts#intendedStrategy`, the strategy guide's NEXT line); the lane kit's `ko` mode uses that to reach a knock-out. The two are different players: only FFX-2 Chapter XIII's card is made to follow the tactic (`advisor-line.ts`, DIFF-B); in FFX the card is the simulated ranking, with the v4 search on top of it in the browser (a wall-clock search, `app/advisorV4/core.ts`). **Chapter III** was a route bug, fixed above (Doublecast; the other 284 picks of that run match the card, `misses` held only the 84). **Chapter XIV** is not: the route took the card's move on all 42 picks (`took` equals `want`, `misses` and `targetMismatches` empty) and the party fell to Spathi's Mega Flare in the third link with Spathi on 7,874 of 20,000. On the engine, seed 1, the shipped tactic wins all three links (35 of 40 seeds win, seeds 3, 18, 22, 31 and 40 lose in link 3); the card at the first menu already differs from it (the card summons Valefor where the tactic spends Yuna's full Grand Summon gauge), and following the v3 card (no v4 search) on the engine wins links 1 and 2 with four of the five aeons knocked out and is defeated at turn 0 of link 3 (0 of 40 seeds; the browser's card also has the v4 search on top, so this is the card's direction, not the browser's exact moves). The route cannot fix that: it needs the card to follow the chapter's line in Chapter XIV as DIFF-B did for XIII (advisor/engine code, FFX only, a decision for the driver and Bailey), or the harness to read the strategy guide's NEXT line instead of the card for CHK-022 (a different player, which the check's wording would have to name).

**Release 59 follow-up (decision 145; FFX only): Chapter XIV's card now follows the chapter's line.** The card is the line on the boards of `LINE_FIRST_CHAPTERS` (`src/engine/tactics/advisor-line.ts`: Chapter XIII as before, Chapter XIV and the Mirror Aeons chapter new), the line is read through the engine the HUD hands the advisor (`AdvisorOptions.lineEngine`), and a Grand Summon is printed with its aeon, `Grand Summon: Shiva`. The route still plays the card and nothing else: `route-pure.mjs#rowLabelOf` reads that label as the menu row `Grand Summon` (the picker that row opens is then played on the aeon the card's text names, as before). On the engine, following the card wins Chapter XIV 35 of 40 seeds (13 before; the tactic wins 35), 39 of 40 with advisor v4's look-ahead on top as the browser has it (27 before). The measurement and the table of every chapter: `docs/handoff/r59-advisor-line.md`, `critic/bench/r59-advisor/sweep.ts`. The diagnosis in the paragraph above describes the build before this change.
