# Camera Lab (branch `camera-lab`; a test harness, D-318)

**Bailey, 2026-10-02 ~00:10 EDT:** "tell the other agents about this and let's build a playable test of
it before we incorporate it in the whole game please." The spec is the paper preflight
`docs/plans/camera-lab-review.md`; its grammar table is the shot list.

**What it is.** A playable test of the Clair Obscur / Persona battle camera on Chapter I (FFX, Seymour Flux)
and Chapter IV (FFX-2, Bahamut), with live switches, so Bailey can decide what, if anything, goes into the
whole game. It is **not** the game's camera, it is not on `main`, and without `?camera=lab` nothing of it is
built or called.

**Game case (rule 14):** both games, as a test. FFX cuts between held shots on beats (the one sourced shape,
`research/battle-camera-perspectives.md` §A.2): each turn opens on the actor's own hero shot. FFX-2 holds one
over-the-shoulder master while any menu is open and never cuts while a girl's menu is open (D-316); it cuts
on actions only while no menu is open, with no per-girl hand-off. Every camera placement is ours.

## How to run it

- Dev: `node node_modules/vite/bin/vite.js --config <a config with cacheDir inside the worktree>` from
  `D:/pyrefly-camera-lab`, then open `http://127.0.0.1:5260/?camera=lab`.
- The private page: `node tools/lab/build-lab.mjs` builds `dist-lab/` (a `--base ./` bundle that boots straight
  into the lab, with only the two chapters' files); `node tools/lab/serve-lab.mjs --port 5270 --open` serves it.
  `node tools/lab/serve-lab.mjs --prefix /x/y/ --csp` serves it under a sub-path with the artifact
  publisher's same-origin policy (how it was tested).
- The fallback: double-click `play-camera-lab.cmd` (builds `dist-lab/` once if missing, serves it on port
  5270, opens the default browser; closing the window stops it).
- **Published for Bailey (2026-10-03, account bpillon3):** https://claude.ai/artifact/JiXrBrUSeeMmSQmwoRLeqi
  (dist-lab built 2026-10-02 06:01Z, 245 files, 55.6 MB; re-tested by the session under the publisher's policy
  at a sub-path: both chapters boot and play by keys, no console errors, no failed requests, no policy
  violations, FFX-2 0 cuts with a menu open). Built on origin/main c19454eb, before the MAX mix (8aee1e69)
  reached main; rebasing onto it waits for Bailey's verdict (plan: "When the MAX mix lands on main").

## The panel and the switches

| Row | Keys | What it does |
|---|---|---|
| CHAPTER | ← → | I · Seymour Flux (FFX) or IV · Bahamut (FFX-2) |
| STYLE | ← →, in battle `1` | **Persona**: hip height, slight up-tilt, wide lens, still. **Clair Obscur**: chest height, normal lens, 2-3 m, a slow drift; a short slow-down on a hit; the skill list cuts closer and lower; the target cut |
| VIEWS | ← →, in battle `2` | **Rear paintings**: a figure shows its rear three-quarter painting when the lens looks past it at its foe (within 58°). **Today's paintings**: front paintings only, and the hero shots come round to the side |
| MENU | ← →, in battle `3` | **At the hero**: the command list moves beside the acting figure's torso on the boss's side, re-anchored only when a cut lands, back to the panel when it would cover the boss or another party member (or on a phone). **Today's panel** |
| TARGET CUT | ← →, in battle `4` | Clair Obscur, FFX: while an enemy is picked, a cut to a close, slightly low view of it from the party's side; a new cut when the highlight moves; ally targets keep the shot |

`↑ ↓` pick a row, `Enter` starts, `T` (or the button) plays today's version of the same chapter. In battle a
chip at the top names the lab state; a click or `L` opens the switches; `1`-`4` flip them at once (none of
these keys is the game's). Switches persist per browser (guarded storage; a throwing storage keeps the
defaults).

## The grammar as built

| Beat | Persona | Clair Obscur |
|---|---|---|
| FFX turn starts | HERO, cut as the menu opens | same, chest height, drift |
| FFX-2, any menu open | PARTY SHOULDER (P2h), held | same, drift |
| Skill or magic list | no change | HERO CLOSE |
| Enemy target | no change | TARGET (TARGET CUT on) |
| Physical attack | LUNGE SIDE, held through the hit | same, slow-down on the hit |
| Spell or skill | CASTER LOW, then IMPACT WIDE (one beat, two shots, the second after the 1.2 s hold) | same |
| Item | ITEM CLOSE | same |
| Enemy turn | ENEMY FRONT | ENEMY BEHIND PARTY |
| Big attack (Overdrive, Mega Flare, Total Annihilation, a telegraphed attack) | COLOSSUS (an Overdrive on the party: CASTER LOW) | same, slow-down |
| Victory | VICTORY, the finisher | same |
| After an action | FFX: held to the next beat; FFX-2: PARTY SHOULDER | same |

Rules: cuts only; a shot holds 1.2 s inside its beat; one cut per beat (the spell pair excepted); the HUD lays
out in the frame the cut lands; no shake on routine hits (a heavy one at half); REDUCE MOTION turns the drift
and the slow-down off; every lens on the viewer's side of the party-to-boss line and inside the painted set
(30° of -z); no painting mirrored; planes turned square to the lens. The lab **yields** to the presenter's
own authored moments (the opening and boss reveal, a charge telegraph, a form change, a data file's camera
event, a mid-battle scene, the defeat): their camera plays, the first move as a cut, until the next beat.
The turn cut-in slab and the letterbox and name slabs still play over lab shots.

## Files

- `src/engine/lab/`: `LabTypes.ts` (beats, switches, shots), `shotChoice.ts` (the grammar, pure),
  `LabDirectorCore.ts` (the cut rules, pure), `labGeometry.ts` (math and rules, pure), `labShots.ts` (the shot
  solver, pure), `labChapters.ts` (formations, shot numbers, rear paintings, flaws), `LabCamera.ts` (the
  camera the presenter sees: the painted stage keeps its identity, only its `camera` is swapped in a lab
  battle), `LabDirector.ts` (three-side: cuts, drift, slow-down), `paintingViews.ts` (rear paintings, square
  to the lens), `LabSession.ts` (the flag and the switches), `forceLab.ts` (the bundle's flag).
- `src/ui/lab/`: `CameraLabScreen.ts` (the panel), `bootCameraLab.ts` (the page's flow), `battleLab.ts` (what a
  lab battle adds to `BattleScreen`), `labChip.ts`, `labRows.ts`, `menuAtHero.ts`, `lab.css`.
- Touched, additively: `BattlePresenterPorts.ts` (`PresenterDeps.lab`, optional), `BattlePresenter.ts`,
  `BattleMoments.ts`, `BattlePresenterBeats.ts`, `BattlePresenterEvents.ts` (one-line beats), `PaintedActor.ts`
  (`setViewPose`, a view override nothing else calls), `BattleScreen.ts` (the lab wiring behind
  `cameraLabForBattle`, a dynamic import), `main.ts` (the panel instead of the title behind the flag),
  `tools/orphans.mjs` (the lab bundle's entry). No file listed in `docs/CONTRACTS.md` was touched.
- `public/mock-art/` (six candidate rear paintings, never `public/art`), `lab.html` + `src/lab-entry.ts` (the
  bundle's entry), `tools/lab/` (`build-lab.mjs`, `serve-lab.mjs`, `lab-assets.txt`), `play-camera-lab.cmd`.
- Tests: `tests/unit/camera-lab.test.ts` (grammar, cut rules, geometry, the presenter's camera),
  `tests/unit/camera-lab-presenter.test.ts` (the real presenter in a real FFX-2 Active fight: no cut while a
  menu is open).

## Verification (2026-10-02, headless GPU Chromium from node, 1600x900, real keys only)

- `tsc --noEmit` clean. `tests/unit/camera-lab.test.ts` and `camera-lab-presenter.test.ts`: 24/24. The presenter,
  camera and actor suites (`presenter-*`, `camera-*`, `target-frame-hold-*`, `tests/unit/engine`): 430/430. The full
  suite in the worktree: 719 files passed, 5 skipped, 1 timed out under load (`strategy-ffx2-bahamut.test.ts`,
  the heal-only route, 15 s limit; it passes alone in 11.1 s and does not touch the lab).
- Every chapter in every style played from the lab panel to victory by keys (a scratch bot that reads the
  intended strategy's pick and presses the arrows and Enter; seed 4 for Chapter I, seed 1 for Chapter IV),
  a JPEG per beat, no console errors, no failed requests:

  | Run | Turns | Cuts | Cuts with a menu open | Of those, as the menu opened |
  |---|---|---|---|---|
  | I Persona | 47, victory | (counter added after this run) | | |
  | I Clair Obscur | 47, victory | (counter added after this run) | | |
  | IV Persona | 50 | (counter added after this run) | | |
  | IV Clair Obscur | 47 | 148 | 0 (FFX-2) | 21 |
  | I, every switch flipped (Clair Obscur) | 47 | 171 | 40 (FFX skill lists) | 47 |
  | IV, every switch flipped (Clair Obscur) | 49 | 157 | 0 (FFX-2) | 15 |

  FFX cuts with a menu open are the skill-list and target cuts the grammar asks for; FFX-2 never cut with a
  menu open in any run. "Play today's version" played Chapter I with no lab object built.
- Flag off: the same chapter without `?camera=lab` on this branch and on origin/main (its source exported into
  an excluded folder, the same public files), same seed, same keys: at all nine beats per chapter the rig and
  its rest pose are identical, no lab DOM, no lab snapshot, no console errors; the only lab modules loaded are
  the flag's (`LabSession.ts`, `LabTypes.ts`).
- The private page (`build-lab.mjs --artifact`): 246 files, 55.62 MB, largest 4.66 MB. Served at `/x/y/` with
  the publisher's CSP and document shell: it boots into the panel and a battle plays by keys in both chapters
  with no console errors, no failed requests and no CSP violations; with `localStorage` throwing it still runs.
- The launcher served on 5270 (tested with `LAB_NO_OPEN=1`, then stopped).

## Stand-ins and known gaps

- **Candidate paintings.** The six rear paintings are the perspectives round's candidates with their named
  flaws (the panel lists them). A girl who spherechanges, an aeon, and anyone with VIEWS off keeps the front
  painting: hero shots come round to the side (64° off the line instead of 47°), the FFX-2 master becomes
  today's wide master, Clair Obscur's enemy turn becomes the front three-quarter on the enemy.
- **The menu at the hero** lands beside the hero only where it covers no more than a quarter of another
  figure and none of a head; in the wide Persona hero shot the party and Mortiorchis often stand there, so
  it falls back to today's panel on many turns (it tries the chest, the waist and the hip first).
- **Lunges** ride the plane, which faces the lens, so a lunge reads across the frame rather than along the
  ground toward the target.
- **Clair Obscur's slow-down** slows the field's clock (figures, effects, camera) to 0.35x for 260 ms; the
  presenter's own timing is unchanged. The drift is a post-offset of at most 0.22 units at 0.045 units/s.
- **Formation.** Chapter I keeps today's spots (M4 was filmed on them); Chapter IV takes P2/P2h's party moved
  as one so Bahamut keeps his spot over his pool and reflection.
- **Yields.** The opening and boss reveal, charge telegraphs (Mega Flare's countdown), form changes, a data
  file's camera event, mid-battle scenes and the defeat are the presenter's own shots (its first move lands as a
  cut). The turn cut-in slab, the Overdrive letterbox and name slab and the Mega Flare splash still play over
  lab shots.
- **The private page** shrinks the paintings (characters and rear paintings 0.6, portraits 0.5, backdrops 0.8),
  drops the music (the game's synth plays), and leaves out the pause plates, the title art and the Sleep poses,
  with the manifests trimmed so nothing asks for them: there a reserve switched in (Wakka, Lulu, Rikku) or
  another FFX-2 dressphere shows a stand-in silhouette and a sleeping figure its nearest painting. The launcher
  serves whatever `dist-lab/` holds plus anything else from `public/`; build it without `--artifact` for full
  resolution and music.
- **FFX after an action** holds the last shot until the next beat names one (the next turn's hero shot or an
  enemy turn).
- No phone layout (the plan's scope): on a phone the menu stays a panel.
- The verification bot, the frame captures and the clips are scratch (`D:/Tools/pyrefly-scratch/camera-lab/`),
  not on the branch.

## If it goes further

Nothing here is wired for the whole game: no settings row, no save data, no other chapter. Taking any part
further is Bailey's call (rule 10) and would follow D-316/D-317 (settings switches on the EYE CANDY page, a
deep review: presenter and camera are shared presentation core).

**Worktree:** `D:/pyrefly-camera-lab` (sparse: no `docs/screenshots`), junctions `node_modules`, `public/art`,
`public/fx` to the main tree, read-only. Unlink the junctions (`cmd /c rmdir`) before any worktree removal.
