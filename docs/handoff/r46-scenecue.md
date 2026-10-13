# r46-scenecue: the opening scene's cue goes down the pipe first (live check LV43-2), built, measured, left OFF

Written 2026-10-13 by a Sonnet sub-agent of the release driver; it finished a first sub-agent's lane that the usage limit cut off at 14:17 with the change written and uncommitted. Branch
`r46-scenecue` from origin/r45-rc `d5bf2206`; worktree `D:/pyrefly-r46-scenecue` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each before ever removing the tree).
**Nothing is merged and nothing is deployed. Game case: BOTH games** (FFX chapters 1 to 3, FFX-2 chapters 4 and 5, the same shared loading plumbing: it changes WHEN audio is fetched, never WHAT is played).
Paper preflight: [docs/plans/r46-scenecue-review.md](../plans/r46-scenecue-review.md) (`node tools/critic-plan.mjs` classes the six product files DEEP: audio routing, asset loader, unclassified product path).

## The question and the answer

Live check LV43-2 (7b2582e7) found the chapter's scene bed playing at the first spoken line in 2 of 15 runs: at the card confirm everything the run needs starts at once and shares one link.
The driver's rule: the only lever is ORDER. Request the opening scene's cue alone, start the rest only when it has arrived (or after a short cap).

**Answer, measured: the lever works, but the change as designed does not pull it, so the build ships with the ordering OFF by default** (`SCENE_CUE_DEFAULT_ON = false`;
`?scenecue=on` or `?scenecue=<capMs>` turns it on; `?scenecue=off` is the old behaviour). Why:

1. The gate holds what the flow itself starts at the confirm (the SFX parity packs, the chapter's other cues, `preloadBattle`). What actually competes with the cue on the wire is bigger and not
   held: the party prep screen's own art (six portraits, the pause plate, two idle paintings: about 8 to 11 MB, requested 20 to 45 ms after the confirm), the selected card's backdrops (4 to 8 MB,
   requested at selection, before the confirm), and the unlock-time audio still in flight on a quick route (`sprite-v2.mp3` 4.7 MB, `sprite.mp3` 2.7 MB, `title.mp3`, `chapter-select.mp3`).
   The gate's own share is the packs (0.2 MB), the boss, victory and defeat cues and the battle's art.
2. On the 18 Mbit/s link the cue takes 6.5 to 13.8 s to arrive, so in every measured run **the 4 s cap, not the arrival, opened the gate** (checked in the shipped bundle: with `?scenecue=on` the packs
   and the boss cue start at +4011 ms). The cap also lets the warm start the NEXT cue while the first is still downloading, where the base warm was already strictly one cue at a time. So the gate
   adds a little contention to the very file it should protect.
3. 2 of 30 runs with it on never reached a first line (the party prep appeared 9.4 s and 14.7 s after the confirm instead of 1.8 s and 3.0 s, the harness's Enter was swallowed, 120 s timeout);
   0 of 60 runs without it (BEFORE and CONTROL). Cause not established; with 2 of 30 against 0 of 60 it is a signal, not a proof. Reason enough not to default it on.

## What the lane measured (all numbers from files in `D:/Tools/pyrefly-scratch/r46/`; method below)

Production build served by `tools/dist-h2-server.mjs` (HTTP/2 over TLS, host-like cache headers), headless Chromium (`PYREFLY_BROWSER=gpu`), a fresh browser per run (cold cache),
the link emulated through CDP at **18 Mbit/s down (about 2.25 MB/s), 40 ms, 5 Mbit/s up** (what LV43-2 saw), real keys from the title to the first battle menu.
Routes: **fast** (Enter on the card as soon as it is selected, 1.8 s on prep, the scene skipped with Enter held) and **human** (3 s on the board, 3 s on prep, Enter tapped every 1.1 s: a quick reader).
BEFORE = the base build `d5bf2206` (bundle Cnc9DuSS); AFTER = the change, ordering on, same source (bundle DNXni1kx); CONTROL = the same AFTER bundle with `?scenecue=off`
(so the only difference from AFTER is the switch). 9 fast and 6 human runs per side per chapter; times in seconds after the confirm, medians.

Qualifying chapters (derived from the story scripts by `openingSceneCue`, never listed by hand): the opening scene asks for a cue at or before its first line in **20 of the 22 registered chapters**
(equal to `Chapter.music.scene` in all 20, pinned by a test). **Chapter I (`seymour-flux`) opens with `music(null, 600)`: its first line is silent by design, so acceptance does not apply to it**
(the Gagazet bed enters at script step 27); the hidden FF7 experiment has its own flow. Measured on **Chapter II `yunalesca` (FFX, `scene-zanarkand-dome`, 1.06 MB)** and **Chapter IV `ffx2-bahamut` (FFX-2,
`scene-bevelle-underground`, 1.49 MB)**.

| chapter, route | side | cue audibly playing at the first line | cue downloaded | first line | first battle menu | renderer peak over the warm, MB |
|---|---|---|---|---|---|---|
| II FFX, fast (9) | BEFORE | 0 of 9 | 10.7 | 7.0 | 33.0 | 627 |
| | AFTER | 0 of 9 | 10.4 | 7.0 | 33.8 | 613 |
| | CONTROL | 0 of 9 | 10.0 | 7.0 | 33.6 | 591 |
| II FFX, human (6) | BEFORE | 6 of 6 | 6.5 | 8.2 | 66.2 | 736 |
| | AFTER | 3 of 5 audible (4 of 5 playing; +1 failed run) | 6.7 | 8.2 | 67.5 | 766 |
| | CONTROL | 5 of 6 audible (6 of 6 playing) | 6.5 | 8.2 | 63.9 | 728 |
| IV FFX-2, fast (9) | BEFORE | 0 of 9 | 13.5 | 6.8 | 34.3 | 593 |
| | AFTER | 0 of 8 (+1 failed run) | 13.7 | 6.8 | 34.2 | 612 |
| | CONTROL | 0 of 9 | 13.5 | 6.8 | 34.0 | 578 |
| IV FFX-2, human (6) | BEFORE | 0 of 6 | 9.3 | 8.0 | 48.3 | 779 |
| | AFTER | 0 of 6 | 9.8 | 8.0 | 47.6 | 774 |
| | CONTROL | 0 of 6 | 9.6 | 8.0 | 47.0 | 737 |

- **Ordering gain: none.** The cue arrives within 0.7 s of BEFORE and CONTROL on every row, never before the first line on the rows that were late. The base build already plays Chapter II's cue
  at the first line at human pace (6 of 6); at fast pace and for Chapter IV neither side does.
- **First battle menu: not made earlier, not made measurably later** (fast: 33.0 / 33.8 / 33.6 and 34.3 / 34.2 / 34.0 s; human: 66.2 / 67.5 / 63.9 and 48.3 / 47.6 / 47.0 s; one CONTROL run in 60 had a
  118 s menu on a loaded machine, so single runs on this machine can stall).
- **Memory (FOC43-05, about +0.26 GB): not raised.** Renderer peak over the warm, AFTER against BEFORE: 613 against 627, 766 against 736, 612 against 593, 774 against 779 MB (-2 % to +4 %); JS heap
  14 to 15 MB on every side; at most three cues decoded at once. The whole-process-tree peak differed by up to 20 % between BEFORE and CONTROL on the human route (1345 against 1093 MB for Chapter II),
  which is this machine's background load, not the change (it was running other agents' work; CPU 40 to 100 % at batch starts).
- Link caveat, as the preflight said: the emulation shares the link fairly whatever the fetch priority, and Chromium's `fetch()` default is already High. A host that honours RFC 9218 (Cloudflare does)
  would not let the Low-priority art compete with High-priority audio, so the live picture can differ. The proof for any ordering change is a live check after a deploy, not this table.

### The bound experiment: what ordering CAN win (`tools/scene-cue-hold.mjs`, `--hold=art,packs,music`)

The harness holds, in the browser, every request under `/art/`, `/fx/`, the parity packs and the other music cues from the confirm until the opening cue's response has finished (cap 8 s). It is the
most any "start the cue first" rule could achieve without touching what was in flight before the confirm. `?scenecue=off`, 4 fast and 3 human runs per chapter:

| chapter, route | cue audibly playing at the first line | cue downloaded | first battle menu |
|---|---|---|---|
| II FFX, fast (4) | 3 of 4 (4 of 4 playing) | 5.8 (was 10.0 to 10.7) | 32.9 (33.0 to 33.8) |
| II FFX, human (3) | 3 of 3 | 2.9 | 63.6 |
| IV FFX-2, fast (4) | 0 of 4 | 9.3 (was 13.5) | 34.2 |
| IV FFX-2, human (3) | **3 of 3 (was 0 of 6)** | 5.4 to 5.8 (was 9.3 to 9.6) | 46.9 (47.0 to 48.3) |

So order is a real lever: Chapter II quick play and Chapter IV at human pace reach the first line with the music playing, with no later first menu. The price is on the prep screen: the party idle paintings
finish later on the fast route by **about 2 s (idle paintings) and 2 to 3.5 s (the pause plate)** (plate 12.0 against 9.9 s and paintings 14.0 against 12.2 s in Chapter II; plate 14.0 against 10.5 s and paintings 16.2 against 14.2 s in Chapter IV) and about 1 to 2 s at
human pace (11.5 against 10.0 s, 9.9 against 8.2 s). Chapter IV fast stays 0 of 4: 9.3 s is after a first line at 6.8 s whatever is held, because about 8.6 MB (median, measured at the confirm on every side) is still unfinished then, most of it unlock-time audio.

## What would earn a default ON (not built: it changes what a player sees on the prep screen, so it needs Bailey's pick under "end state first", AGENTS.md rule 9)

- **Option A, leave it off** (what ships): no change for players; the music arrives when it arrives.
- **Option B, hold the party prep's art behind the cue**: the bound above. Needs `PartyPrepScreen` and the portrait lane to start their requests through the same gate; the paintings and the plate
  appear 1 to 3.5 s later on a slow link (the cue arrives at 3 to 6 s). Chapter II fast and Chapter IV human pass; Chapter IV fast does not.
- **Option C, B plus not starting the sprite audio (7.4 MB) until the scene is playing**: also helps Chapter IV fast, costs the first SFX sprites a few seconds; not measured.
- Either option should also stop the cap from starting the warm's next cue while the first is in flight (the warm is already one cue at a time; only the other starts need a cap).
- Whatever is built, prove it with the live check after the deploy (LV43-2's method), because the emulation cannot reproduce RFC 9218.

## What changed (game case: both; every change is shared plumbing)

| Item | Case | Why |
|---|---|---|
| `src/app/openingSceneCue.ts` (new): `openingSceneCue(chapter)`, `scriptOpensWithMusic`, `MUSIC_LOOKAHEAD` (moved out of `BattleScreenFlow.ts`, behaviour identical) | both | derived from the `pre` script and `Chapter.music.scene`, the same function the flow calls |
| `src/app/sceneCueGate.ts` (new): `SceneCueGate` (cap timer, `settle`, `after`, `cancel`, `opened`), `sceneCueSwitch`, `sceneCueGateFor`, `SCENE_CUE_CAP_MS = 4000`, `SCENE_CUE_DEFAULT_ON = false` | both | the order lever, behind the page-address switch |
| `src/audio/AudioManager.ts`: `needsFirstFetch(name)`, `warmMusic(names, gate?)` and `fetchWarm` take the gate (one argument when there is none); `src/audio/MusicWarm.ts`: `WarmGate`; `src/audio/MusicLoader.ts`: `load(ctx, name, onFetchEnd?)` | both | additive; with no gate every call is today's call |
| `src/app/chapterMusicWarm.ts`, `src/app/sfxGame.ts`, `src/app/screens/BattleScreenFlow.ts`: the opening cue leads the warm, the packs and `preloadBattle` go through `gate.after` | both | none of them is in `docs/CONTRACTS.md`; nothing under `src/battle/**` or `BattlePresenter*.ts` is touched |
| `tests/unit/scene-cue-gate.test.ts` (new, 40 tests): all 22 chapters against `music.scene`, Chapter I and FF7 give no cue, the gate (arrival, failure, cap, cancel, restart, two runs), the four unchanged cases (no cue, cue cached, sound off, synth fallback), the switch and its default, `GameFlow.runChapter` wiring | both | |
| `tools/dist-h2-server.mjs`, `tools/scene-cue-proof.mjs` (now with `--hold` and `--holdcap`), `tools/scene-cue-hold.mjs`, `tools/scene-cue-table.mjs` | tooling | the measurement |

The cap is **4000 ms**. Reason, from the measurements: a normal link brings a 1 to 1.5 MB cue in about a second, so 4 s is long enough for it; on the 18 Mbit/s link the cue takes 6.5 to 13.8 s, so the cap always
fired, which is also why the AFTER numbers equal CONTROL's; and 4 s is short next to a 33 s load to the first menu, so a dead link adds only 4 s to the rest of the run (the measured first-menu medians moved
by less than the run-to-run spread). The unit tests cover the cap boundary and a fetch that never answers.

## Not fixed / open

- LV43-2 stays open: on the quick route the scene music is not playing at the first line in Chapter II (0 of 9) and Chapter IV (0 of 9 and, at human pace, 0 of 6). The levers are named above.
- The 2 of 30 late-prep runs with the ordering on are unexplained.
- `src/audio/AudioManager.ts` is 809 lines (780 before; over 400 already, house rule 7); this lane added the gate plumbing (+29) rather than split a file nobody asked to split. `BattleScreenFlow.ts` shrank (541 to 527).
- Checks at the tip: `tsc --noEmit` clean; `node tools/orphans.mjs` lists neither new module; the full suite (`node node_modules/vitest/vitest.mjs run --maxWorkers=2`, run once) **1147 files passed, 13 skipped (1160); 17957 tests passed, 69 skipped, 1 todo (18027); exit 0**; `tests/unit/scene-cue-gate.test.ts` 40 of 40.
- Not run: a live check (no deploy is allowed from this lane), a real-network measurement, a phone.
- Reproduce: serve a build with `node tools/dist-h2-server.mjs --dir=dist --port=5246 --key=... --cert=...`, then `PYREFLY_BROWSER=gpu node tools/scene-cue-proof.mjs --url=https://127.0.0.1:5246/ --chapter=yunalesca --route=fast --runs=9 --out=run.json`
  (`--query=scenecue=on|off`, `--hold=art,packs,music`), `node tools/scene-cue-table.mjs --dir=<folder>`. Build from PowerShell with `BASE_PATH='/'` and vite directly, never `npm run build` in a tree whose `public/art` is a junction.
