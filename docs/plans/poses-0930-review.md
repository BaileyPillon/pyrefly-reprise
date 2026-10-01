# Paper preflight: poses-0930 (Sleep and Low-HP paintings, Bahamut splash, Paine Songstress)

`node tools/critic-plan.mjs --paths` classes the change DEEP (shared systems: the presenter's pose map, the asset
loader, the status tap). Rule 15 asks for this note before building; it was written during the build, after the
first working version, so it is late. Disclosed here and in the handoff.

## What can go wrong, and the check for each

| Risk | Where | Check |
|---|---|---|
| A figure with no sleep or critical painting shows a grey stand-in or a wrong painting | `BattlePresenterArt` PARTY_POSES + fallbacks | fallbacks to `idle` in both tables (FFX and dressphere); `rest-poses.test.ts` pose-map case (Kimahri, Paine Dark Knight); the tap asks `paints(id, pose)` before swapping |
| A presenter pose (ready, attack, cast, item, hurt, defend, victory, ko) gets replaced | `restPoses.ts` wrapper | only a request for a rest name (idle, sleep, critical) is translated; test "an action's own poses are never replaced" |
| The flinch hands back a stale rest ("sleep" after the hit woke her) | PaintedActor flinch `back = requested` | every rest name is translated to the current rest; test "a stale rest request" |
| The fight changes | rule 1 | the tap reads the state only; the real Chapter I run's event transcript is identical with and without the tap |
| KO, Petrify, Stop, Zombie precedence | `restPoseOf` | table test; Petrify and FFX-2 Stop hold the painting they had |
| The low-HP threshold differs from the yellow digits | FFX 50 %, FFX-2 33 % | every HP 1..100 compared with each HUD's own class |
| Z's float above the standing head while the hunched painting is up | `withStatusLooks` head anchor | `headTop` from the painting's sidecar; test + browser frame |
| The Bahamut splash 404s before the install | `splashArtFor` | the manifest gate returns null while the file is not listed; test |
| Something is written to `public/art` or `approved-hashes.json` before release 33 is live | the brief's timing rule | the package lives in `D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/`; proofs route requests; the build is `vite build --outDir` (no `prebuild` manifest step) |
| Files over 400 lines grow | rule 7 | only files under 400 lines changed |
| REDUCE MOTION | comfort | the swap is the figure's usual crossfade; the marks keep their calm stills (browser check with the OS reduced-motion preference) |

## Game case (rule 14)

Both games, each with its own threshold (FFX HP < 50 %, the SOS line; FFX-2 HP < 33 %) and its own look (FFX the
slouch, FFX-2 the kneel), painted per character. The Bahamut splash and Paine's Songstress slots are FFX-2 only.

## Day set (D-301, branch poses-day): paper preflight, written during the build (late, disclosed)

`critic-plan --paths` on the six changed files: DEEP (the presenter's `body` departure and restage are shared).

| Risk | Where | Check |
|---|---|---|
| A painted `ko` gets rolled onto its back as well (a prone canvas turned 90 degrees) | `BattlePresenterDepartures.body`, `BattlePresenterStage` restage | `lieDown` only without a painted `ko` (`stage.paints`); presenter test both ways; the Ch VII kill by keys reads `lieRoll 0`, `prone true` |
| A kneel or fall 404s before the install | `CutsceneStage.setPose` | a painting is used only when the manifest lists it; bare browser run: no request, 0 responses of 400 or more |
| PR-0244's staging lost for Seymour without the art | the same | `cutscene-story-poses.test.ts` both ways; `cutscene-stage.test.ts` unchanged and green |
| Isaaru or Shuyin changes before the install | `stagesUnpaintedPoses` stays Seymour-only | test: without the manifest entry their element is byte-identical after `setPose` |
| The painting lies behind the dialogue box | placement | browser frames at 1600x900 and 390x844; per-pose centre for Seymour (first proof caught the fall behind the box) |
| Dialogue or game data changes | rules 6 | no line changed; Isaaru gains one `setPose` at his own "Isaaru kneels" beat, Shuyin's two steps swap order |
| Files over 400 lines grow | rule 7 | `ffx2-vegnagun-shuyin.ts` (481) and `BattlePresenterStage.ts` (861) keep their line counts |

Game case: Seymour at Macalania and Isaaru FFX only, Shuyin FFX-2 only, Kimahri (no code) FFX only; the cutscene
port and the departure guard are shared plumbing.
