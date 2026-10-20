# Release 60, the conference demo build (branch `r60-rc`)

**Game case: both games, one case per part.** The HD-2D look: Chapter I FFX and Chapter IV FFX-2 only. Demo motion and the two hit fixes: both. Bahamut's rig FFX-2 only, Seymour Flux's FFX only. Demo mode: Chapter I FFX only
(party opens), Chapter IV FFX-2 only (clean win). The foe cursor (`cursorStartFoe`, branch `re-parity-r60-t3b`): FFX only. The retarget fix: FFX-2 only. **Not deployed, no review run:** the driver does both.

Bailey, 2026-10-20 about 11:00 EDT: look "HD-2D bold (Recommended)", boss rigs "Yes, both (Recommended)", demo opening "Demo mode: party moves first (Recommended)" (decisions 157a to c); "I demo my game in a week at a huge
gaming conference." (2026-10-26). The CHANGELOG entry "Release 60" is the full account; this file is where to look.

## What is on by default, and how each is gated

| Part | Default | Off / forced by | Where |
|---|---|---|---|
| HD-2D look, bold | Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`) only | `?look=off` (off everywhere), any `?look=` (the address's word everywhere) | `engine/look/LookConfig.ts#CHAPTER_LOOKS`, `LookState.ts#applyChapterLook`, called by `BattleScreen` before the figures load; `FxSceneInfo.chapter` |
| Demo motion | on in a page, off with no page | `?motion=off`, `?motion=classic` | `engine/motion/DemoMotion.ts#demoMotionFromSearch` |
| Weak-hit hold floor | FFX 40 ms, FFX-2 28 ms (option C's light holds) | with the demo motion off the shipped hold | `motion/DemoHit.ts#demoStopMs(f, weakFloorMs)`, `fx/c/SpectacleRules.planHit` |
| White flash on a big figure | scaled by the plane's world area (1.0 to 3.5, 0.4 from 9) | REDUCE FLASHES skips it | `motion/DemoHit.ts#demoFlashPeak`, `motion/DemoHitBeat.ts#blowFlash` |
| Demo mode | off | `?demo=1` (tab-kept), `?demo=0` | `app/demoMode.ts`, `app/runSeed.ts`, `BattleScreenFlow.ts#attemptSeed` |

Measured plane areas (`PaintedActor.poseSize`, real fights, world units squared): Tidus 2.6, Yuna 2.1 (FFX-2 2.2), Rikku 2.2, Paine 1.2, Kimahri 3.7, Mortiorchis 16, Bahamut 17, Seymour Flux 23.

## Demo mode seeds

`tests/unit/demo-mode.test.ts` proves them on the engines. Chapter I (FFX engine): seeds 7, 10, 12 put Tidus's menu after `sensor, sensor, turn-start` with no enemy act and nobody down; the shipped line wins all three; seed 7 loses no one
for the whole fight. Chapter IV (FFX-2 engine, Wait, shipped line, seeds 1 to 60): every seed wins and none loses a girl; seed 56 is the fastest (98.1 s engine time, 5,466 damage taken, one Mega Flare).

## Art

`D:/pyrefly-art-demo` is the build's art (rigs ffx2-bahamut, ifrit, lulu, pterya, seymour-flux-body, valefor; `rig-gate --verify` PASS for all six on it). **It holds no maps.** The look's figure light and depth fog read
`<painting>.normal.png`, `@2x`, `backdrops/<room>.depth.png` (`D:/pyrefly-art-maps`); without them the look plays with unlit figures and the height fog, and each missing map is a 404 in the console (a figure the maps lane did
not cover, such as the gunner dresssphere, 404s on every pose even when the maps ship). Merge the maps into the release's art folder, and list the covered subjects in the manifest if the 404s matter to a review.

## How it was checked in the real game (scratch, not in the repo)

`D:/Tools/pyrefly-scratch/2026-10-20/r60/tools/record.mjs` (the demo-int recorder with a first-menu walker that pins no seed) with the harness's Vite serving `/art/*` from `D:/pyrefly-art-demo` and the maps from
`D:/pyrefly-art-maps`; plans in `tools/plans/`; runs and stills in `runs/`. Headless Chromium on the real GPU, one at a time, the Vite stopped by PID. Stills in `docs/screenshots/r60/`.

## Open (also in the CHANGELOG entry)

- A frame gap of about 0.8 s at the start of Chapter I's battle with the look on (1.1 s before `Renderer.prepareLook`, which builds the look's passes before the shader warm-up; none above 70 ms in Chapter IV; `tools/hitch.mjs` in the scratch folder); the figures' relight program variant and the room's set-up are what is left. Not checked: whether it shows under the battle entry's swirl.
- The maps are not in `D:/pyrefly-art-demo` (above).
- The hidden FF7 experiment gets the demo motion by default too (shared plumbing, `?motion=off` turns it off): not looked at; the lane's own note says nothing was built for FF7.
- `lookState.armed` is also set by the automatic chapter look so the figures bind their maps; the F6 to F8 keys and `__pyrefly.look.stats()` behave as before (the stats are the last frame's: they stay stale after leaving a look chapter, the passes themselves are switched off, checked by their `enabled` flags in one page going Chapter I, II, IV).
