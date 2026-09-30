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
