# Demo integration preview (conference demo, 2026-10-26): branch `demo-int`

**Game case: both games (shared plumbing, dev flags and kit only); the Bahamut rig is FFX-2 only, the Seymour Flux rig is FFX only. Nothing ships: no deploy, no review, no `main`.** Built overnight 2026-10-20 from `origin/r59-rc` (6db09ac86), so that one tree can show Bailey the demo chapters (Chapter I Seymour Flux FFX, Chapter IV Bahamut FFX-2; decisions 150, 153, 156) as TODAY against DEMO.

## What is merged (in this order, `--no-ff`)

| # | Branch (tip) | Result |
|---|---|---|
| 1 | `demo-motion` c9f4df395 | `?motion=demo`, the rig variant cross-fade (`RigKey.fadeMs`, format v2.1). Clean. |
| 2 | `rig-demo-bosses` 791f080a9 (on `rig-expressive-2` on `rig-expressive`) | the rig kit and subject configs: `ffx2-bahamut-x` (FFX-2), `seymour-flux-x` (FFX), plus the aeon rigs' subject files. Clean. |
| 3 | `re-parity-x2-retarget-fix` 4c389df7f | FFX-2 only: a skill aimed at a foe that dies before it lands no longer re-aims at the girls; re-pins `ffx2-atb-golden` (the branch carries the new pins). Clean. |
| 4 | `r59-fixes` 0befa7935 | the move advisor follows the chapter's own tactic (FFX Chapter XIV, Mirror Aeons), the continuity head measure. One conflict, `docs/CONTRACT-CHANGES.md` (both sides added an entry at the top): both kept, newest first. |
| 5 | `demo-look` ab9ebc0ff (the looks lane's local tip: pass 1, pass 2 and the BOLD strength; `origin/demo-look` only has 918963c89) | `?look=hd2d|cinematic|anime`, `?lookstrength=bold`. Clean. |

Checks on the merged tree: `tsc --noEmit` clean; `ffx-engine-golden` (18), `ffx2-atb-golden` (6), `ff7-golden` (3) pass as the tree has them; the full vitest run is 23,831 passed and 1 timeout (`advisor-floor` "27. Mirror Aeons", 15 s cap under the full parallel load; alone it passes, 9.2 s, so it is load-sensitive, not broken).

## Art: `D:/pyrefly-art-demo`

`node tools/art-mirror-add-rigs.mjs --from D:/pyrefly-art-r59 --rigs <stage> --to D:/pyrefly-art-demo --subjects ffx2-bahamut,seymour-flux-body`, where `<stage>` holds the rig lane's verify copies (`D:/pyrefly-art-rigs-work/ffx2-bahamut-x/verify-copy/ffx2-bahamut`, `.../seymour-flux-x/verify-copy/seymour-flux-body`) because the art id is not the rig folder's name. PROVED: 5,808 files, 5,541 hard-linked to r59's, 266 rig files copied; the manifest lists `ffx2-bahamut, ifrit, lulu, pterya, seymour-flux-body, valefor`. `rig-gate --verify` passes for all six against the new mirror. `public/art` was NOT repointed (the junction is still `D:/pyrefly-art-r59`): the harness serves `/art/*` from the art root it is told (see below).

## How the clips are made (scratch, not in the repo): `D:/Tools/pyrefly-scratch/2026-10-20/demo-int/`

`tools/record.mjs` is the looks lane's recorder with three steps added (`menuTo`, `dispatch`, `watch`); `tools/harness.mjs` starts one Vite whose config serves `/art/*` from `art-root.txt` and the lighting maps from `D:/pyrefly-art-maps`; `plans/*.json` are the scripted plays (real keys on a paused page clock stepped 60 Hz, seed pinned to 1); `tools/batch.mjs` holds `RIG-RECORD` once for a list of jobs; `tools/assemble.sh` encodes and builds the side by side. TODAY is `--art D:/pyrefly-art-r59 --look none` (no flags); DEMO is `--art D:/pyrefly-art-demo --look hd2d --strength bold --extra motion=demo`. Both run the same plan; the battle logs are identical event for event (`tools/cmplog.py`), only the timing differs a little.

## The clips (first version, 2026-10-20 05:45 to 06:20; the look is `demo-look` ab9ebc0ff, the looks lane's last commit; it had not pushed since 03:45)

`D:/Tools/pyrefly-scratch/2026-10-20/demo-int/clips/` (1600x900, 60 fps, H.264) and `.../stills/`: `v2-clean-*` is the default of the pair (the advisor and guide panels hidden by `N`/`G`/`E` in the settle phase, so the picture is what is being compared; Chapter I needs only `N`); `v2-*` is the HUD as the game plays today. For each chapter: `-DEMO.mp4` (B alone), `-TODAY.mp4`, `-TODAY-vs-DEMO.mp4` (3200x900). Chapter I is 41 s, Chapter IV 55 s; `v3long-clean-ch4-bahamut-*` is Chapter IV to the Mega Flare (about 100 s), where TODAY and DEMO drift apart in the order of events after about 14 events (the 41 s and 55 s pairs have identical logs). Stills: six matched pairs per chapter, PNG from the page, `<name>-TODAY.png`, `<name>-DEMO.png`, `<name>-pair.jpg` and a `-sheet.jpg` of all pairs. Frame cost (real time, RTX 5070 Ti, first menu): DEMO renders in 1.1 to 3.0 ms a frame at 1600x900 and 2560x1440 with rAF p99 16.8 ms (locked 60 fps); `perf/` has the numbers.

Seen in the clips: a painted Bahamut dissolves between two paintings mid-pose (a ghosted double image) where the DEMO rig holds a solid pose with its own rim; Seymour's rig takes a hit with the hurt head; the bold look gives the room a tilt-shift blur, motes, a coloured pool under a spell (the Fire Gem's red light on a blue room) and the Mega Flare a heavy bloom. Still wrong or not done: the normal-map relight does not light rigged figures (the two bosses and Lulu, Valefor, Ifrit, Pterya), so the girls and the party are lit and the bosses are not; the Fire Gem and Mega Flare flashes blow out to white on purpose; the zombie status draws black discs round Yuna (in TODAY too); the 100 s Chapter IV pair is not frame-matched; `?lookdrift=1` was not used.

Re-run after merging newer looks commits (tsc and the three goldens first): `bash D:/Tools/pyrefly-scratch/2026-10-20/demo-int/tools/rerun.sh v3` records all eight runs under one `RIG-RECORD` hold (about 25 minutes) and assembles `v3-clean-*` and `v3-*`.
