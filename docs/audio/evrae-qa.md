# Chapter VIII (Evrae) music — independent QA

FFX only: Chapter VIII (Evrae on the deck of the Fahrenheit) is an FFX chapter
(AGENTS.md rule 14). This QA covers the two new cues and their wiring only.
I cannot hear; every check below is technical/routing, per the brief. The
listening verdict stays Bailey's (`docs/audio/OWNER-VERDICT.md`).

## What was checked, and how

- Decode + `tools/audio/qa.mjs` (the project's own on-disk QA tool, which
  decodes each MP3 the way a browser will) against all 7 delivered files.
- `ffmpeg -af ebur128=peak=true` cross-check of integrated LUFS and true peak
  for the two shipped cues.
- `tools/audio/seam-probe.mjs` for the loop-seam verdict on both shipped cues,
  compared against the shipped catalogue.
- Manifest (`public/audio/manifest.json`) entries for both keys.
- Source wiring: `src/audio/tracks/index.ts`, `src/data/chapter-evrae-airship.ts`,
  `src/data/ffx/enemies/evrae.ts`, `src/data/chapter-meta-evrae.ts`,
  `src/story/scripts/evrae-airship.ts`.
- Note data for quoted retail melody (rule 8): read `themes.ts`,
  `scene-fahrenheit.ts`, `boss-evrae.ts` in full.
- Real in-game check: `npx vite --port 5960 --strictPort` (my own dev server,
  not the shared one), Chromium with `PYREFLY_BROWSER=gpu` args (native GPU
  confirmed — see below), driven through `window.__pyrefly` (`gotoChapter`
  with and without `skipCutscenes`), reading `window.__pyrefly.audioDebug()`
  at each screen transition.

## Results

### Decode and file-level QA — PASS

`node tools/audio/qa.mjs` (the project's own decode-and-measure tool) run
against the full catalogue:

| cue | dur | LUFS | dBTP | clip | seam | flux | tilt |
|---|---|---|---|---|---|---|---|
| boss-evrae | 83.0s | -15.97 | -1.35 | 0 | ok | 0.8x | -9.5 |
| scene-fahrenheit | 76.8s | -16.16 | -1.19 | 0 | ok | 0.3x | -8.7 |

Both within spec (`docs/audio/PIPELINE.md`: -16 LUFS ±2, under -1 dBTP), no
clipped samples, seam gate "ok", spectral tilt in family with the rest of the
catalogue (e.g. boss-seymour -9.1, boss-dread -10.9).

Independent `ffmpeg ebur128` cross-check agrees: scene-fahrenheit I=-16.0
LUFS / true peak -1.2 dBFS; boss-evrae I=-15.9 LUFS / true peak -1.4 dBFS.
Matches the reported figures exactly.

All 7 delivered files (2 shipped cues, evrae-near, evrae-far, the range
cross-fade demo, and both modern-renderer candidates) decoded cleanly with
ffmpeg — no decode errors, all report a peak level and finish without
truncation.

### Loop seam — PASS, and the boss-evrae characterization is accurate

`tools/audio/seam-probe.mjs`:

- `scene-fahrenheit`: verdict "rounding" — a real, clean loop join, same
  family as most of the catalogue (battle-ffx, boss-dread, boss-vegnagun, …).
- `boss-evrae`: verdict "tail absent, wrap is a real edit" — **the same
  verdict the shipped `boss-seymour` gets**, confirming the report's claim.
  This is a real edit, not a decode glitch, and boss-seymour already ships
  with this characteristic, so it is not a new class of defect.

### Manifest — PASS

`public/audio/manifest.json` now lists 23 music cues (up from the prior
count). Both new entries are present with `loopStart`/`loopEnd`/`duration`/
`lufs`/`truePeakDb`/`score` fields matching the reported measurements exactly
(scene-fahrenheit: loop 9.230771→73.846145, -16.17 LUFS/-1.33 dBTP; boss-evrae:
loop 6.666667→80, -15.97 LUFS/-1.4 dBTP).

### Wiring — PASS

Confirmed by reading source, not by re-describing the report:

- `src/audio/tracks/index.ts` imports and registers both `sceneFahrenheitTrack`
  and `bossEvraeTrack`, in `MUSIC_KEYS`, `COMPOSED`, and the descriptive-info
  map.
- `src/data/chapter-evrae-airship.ts`: `music: { scene: 'scene-fahrenheit',
  battle: 'boss-evrae' }`.
- `src/data/ffx/enemies/evrae.ts`: `musicCues: [..., { at: 'start', track:
  'boss-evrae', fadeMs: 800 }]`.
- `src/data/chapter-meta-evrae.ts`: `musicKeys: ['scene-fahrenheit',
  'boss-evrae', 'victory-ffx']`.
- `src/story/scripts/evrae-airship.ts`: `music('scene-fahrenheit', 1400)` at
  the top of the pre-battle scene, `music('boss-evrae', 900)` before the
  battle beat, and a deliberate `music(null, 900)` immediately after victory
  — this is a scripted silence, not a missing cue: the script's own comments
  read "Beat 9 — Bevelle opens up. The victory is revoked. ... The victory
  lasts a minute," so Bevelle's guns are meant to cut the music, and a new
  cue there would be new content needing Bailey's yes (already flagged by the
  music agent as `notDone`, correctly).

### Retail-melody check (rule 8) — PASS

Read `src/audio/tracks/themes.ts`, `scene-fahrenheit.ts`, and `boss-evrae.ts`
in full. `themes.ts` states explicitly: "ORIGINAL MATERIAL. Every cell, line
and progression below was written for this repo. Nothing here is
transcribed, quoted or paraphrased from Final Fantasy, Clair Obscur or any
other copyrighted work." Both cues build their melodic material from
`FAREWELL_RISE`/`FAREWELL_FALL`, invented themes already used elsewhere in the
score (e.g. `scene-farplane`, `ending-ffx2`), voiced and re-metered for this
brief. No note data resembling a specific retail FFX melody (To Zanarkand,
the FFX theme, the Hymn of the Fayth's real tune, etc.) appears; "HYMN" here
is this project's own invented motif, per `themes.ts`'s own framing. Nothing
found that needs Bailey's review on copyright grounds.

### In-game check — PASS, real GPU, real cue transitions, no silent fallback

Ran on my own dev server (`npx vite --port 5960 --strictPort`, killed after),
not the shared dist/. Chromium reported:

```
ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)
```

— a real GPU context, not SwiftShader.

Driven via `window.__pyrefly.gotoChapter('evrae-airship', ...)` with
`window.__pyrefly.audioDebug()` polled at each transition:

| stage | `audioDebug().music.current` |
|---|---|
| pre-battle cutscene (`skipCutscenes: false`) | `scene-fahrenheit`, fading in to gain 1 |
| cutscene → battle transition | crossfades to `boss-evrae` (scene-fahrenheit fading out) |
| battle, steady state | `boss-evrae`, gain 1 |
| battle resolved (`outcome: 'victory'`, 87 turns) | `null` — the scripted silence at beat 9, see Wiring above |

Both cues played from the pre-rendered manifest path (manifest was loaded,
`prerendered.manifest: true`, 23 cues) — no fallback to the synthesised
oscillator path was observed for either key. No page errors were seen in the
console during the run.

Pre-existing, not from this change (matches the music agent's disclosure):
the debug flow passes through `chapter-select`'s own music briefly before the
chapter's own cues take over — the same behaviour other chapters show. Not a
regression introduced here.

### Not verified (out of scope for this QA pass)

- NEAR/FAR range switching: confirmed not wired into the engine (no gain/stem
  hook exists yet), matching the report. Not tested live because there is
  nothing live to test.
- The audition page (`docs/audio/audition.html`) was read for structure
  (both in-game cues, NEAR/FAR, modern variants, score boxes present) but its
  actual audio playback was not exercised — I cannot hear it and Bailey's
  verdict is what matters there.
- Actual listening quality (whether the music "sounds right") is entirely
  Bailey's call.

## Verdict

Both cues are decode-clean, in spec for loudness/true peak, seam-gated ok
(boss-evrae's "real edit" wrap matches the already-shipped boss-seymour
pattern, not a new problem), correctly wired end to end (index, chapter data,
enemy cues, chapter meta, story script), free of any detected retail melody
quote, and verified live in a real GPU browser to play the right cue at the
right moment with no silent fallback. Nothing here blocks Bailey's listening
pass.
