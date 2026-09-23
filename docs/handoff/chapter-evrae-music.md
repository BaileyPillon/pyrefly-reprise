# Handoff: Chapter VIII (Evrae) — the music

**Date:** 2026-09-23. **Game case (hard rule 14): FFX only.** Evrae on the deck of the
Fahrenheit is an FFX encounter; the airship range mechanic "has no X-2 counterpart"
(research/ffx-evrae-airship.md §0.4). Both cues are Aeolian (the raised sixth is FFX-2's,
THEMES.md), use no dominant, and touch no FFX-2 data. Tests pin it
(`tests/unit/audio-evrae.test.ts`).

**Status: composed, rendered, wired, measured. Awaiting Bailey's ear** (hard rule 13: no
agent can hear). Both cues are CANDIDATES; they replace Chapter 1's stopgap pair because a
chapter-specific candidate is closer to the brief than a borrowed Seymour cue, not because
anyone has approved them. Bailey listens at `docs/audio/audition.html`, section
**"Chapter VIII, Evrae (new)"** (top of the page).

## What was built

| Cue | Title | Key / tempo | File |
|---|---|---|---|
| `scene-fahrenheit` | "Within the Hour" | D minor, 104 bpm, 32 bars, loop 16 → 128 | `src/audio/tracks/scene-fahrenheit.ts` |
| `boss-evrae` | "Open Sky, Closed Gate" | A minor, 144 bpm, 48 bars, loop 16 → 192 | `src/audio/tracks/boss-evrae.ts` |
| shared | the ship figure, voicings, performance helpers, the NEAR/FAR range mix | — | `src/audio/tracks/fahrenheit.ts` |

Written to research §12.6's brief (machina not menace, driving eighths, open fifths and air,
a two-bar figure with rests, phase 2 = subdivision not tempo, no choir / fanfare / anything
sacred) and the preflight's `scene-fahrenheit` slot (wind, engines, urgency without
combat). Themes (THEMES.md cue map rows 22-23): `FAREWELL_RISE` (imported, never retyped)
is the head of the battle's ship figure — the goodbye's first four notes as a pursuit — and
opens the scene cue at double length with `FAREWELL_FALL`; the scene's peak closes on the
`AMEN`. Harmony checked note by note against each half-bar's chord; the appoggiatura rule,
the off-beat accent rule and "no constant velocity" are pinned by tests and by
`tools/audio/themes-audit.mjs` (both cues `ok`).

**Wiring** (src/data and src/story only): `src/data/chapter-evrae-airship.ts` `music`,
`src/data/ffx/enemies/evrae.ts` `musicCues` (start), `src/data/chapter-meta-evrae.ts`
`musicKeys`, and the two `music()` steps in `src/story/scripts/evrae-airship.ts`. Registered
in `src/audio/tracks/index.ts` (`MUSIC_KEYS` 18 → 20, `COMPOSED`, `TRACK_NOTES`); contract
note in `docs/CONTRACT-CHANGES.md`.

## The range idea (NEAR / FAR): built for audition, NOT in the game

`rangeVariant(track, 'near' | 'far')` re-balances the same notes (percussion forward and dry
at NEAR; the kit nearly gone, the drive halved, the tune further into the hall with an echo,
the drone forward at FAR); `rangeSendScale` moves the hall sends. `node
tools/audio/render-range.mjs` renders both and a 75 s demo cross-faded at 0:14 / 0:26 /
0:50 / 1:02 with a 1.2 s linear fade → `public/audio/candidates/evrae-{near,far,range-crossfade}.mp3`,
report `docs/audio/evrae-range-report.json`. The game plays the balanced cue. Switching live
needs a presenter/audio hook on the range flip (two time-aligned buffers, gain cross-fade),
which is in `src/engine/**` / `src/audio/AudioManager.ts` and was out of this agent's paths;
it also needs Bailey's "worth building" from the audition first. The phase-2 subdivision
change is written into section C of the cue (sixteenths under the same 144), not triggered
by Evrae's Haste — the same hook would be needed for that.

## Measurements (ffmpeg ebur128 on the shipped MP3s; `tools/audio/qa.mjs`)

| File | LUFS | True peak | LRA | Loop seam |
|---|---|---|---|---|
| `public/audio/music/scene-fahrenheit.mp3` (1:16.8, 1.13 MB) | -16.0 | -1.2 dBTP | 12.4 LU | ok (step 0.075 / allowed 0.122) |
| `public/audio/music/boss-evrae.mp3` (1:23.0, 1.29 MB) | -15.9 | -1.4 dBTP | 8.4 LU | ok (step 0.134 / allowed 0.236) |
| `candidates/evrae-near.mp3` | -16.0 | -1.4 | — | ok |
| `candidates/evrae-far.mp3` | -16.0 | -1.5 | — | ok |
| `candidates/evrae-range-crossfade.mp3` | -16.1 | -1.3 | 10.2 | (demo, not a loop) |
| `candidates/modern-scene-fahrenheit.mp3` | -16.1 | -1.3 | 10.4 | ok |
| `candidates/modern-boss-evrae.mp3` | -15.9 | -1.4 | 10.9 | ok |

All shipped gates pass (loudness, true peak, seam, spectral tilt). `seam-probe.mjs` reads
boss-evrae as "tail absent, wrap is a real edit" with its best block at offset 0: the same
verdict the shipped `boss-seymour` gets — the loop opens on a crash and a downbeat, a real
transient, and the QA seam gate (wrap no harder than the entry) passes.

## Modern sound (CPU)

`node tools/audio/modern/render-evrae.mjs` — sketch A's renderer (sfizz + VSCO 2 CE / VCSL,
the performance model, the wide master) with the **Voxengo "Musikvereinsaal" IR** (direct
spike removed, energy-matched to the shipped hall; licence note in `docs/audio/CREDITS.md`).
Piano, electric bass, taiko and the clang stay on the shipped voices (added to
`tools/audio/modern/seating-map.mjs` as `band`). Report `docs/audio/evrae-modern-report.json`.
No ACE-Step, nothing on ComfyUI.

## Checks run

`npx tsc --noEmit` clean; vitest: `audio-evrae`, `audio-registry`, `audio-blurbs`,
`audio-story-cues`, `audio-cue-reachability`, `audio-shipped-files`, `audio-ffx-bosses`,
`chapter-meta-evrae`, `chapters/evrae-script` and the rest of `tests/unit/audio*.test.ts`.
Audition page in a real browser (`tools/zz-evrae-audition.tmp.mjs`): all seven new files
decode, the score button fills its box on a real click, no horizontal scroll at 1000 / 375 px
(`docs/screenshots/audio/evrae-audition-{desktop,phone}.png`). In-game cue order, real flow
through `window.__pyrefly.gotoChapter('evrae-airship')` on a private production build (the dev
server could not boot under 100 % CPU; `tools/zz-evrae-music.tmp.mjs`, GPU: RTX 5070 Ti, D3D11):
8/8 — the manifest lists 23 cues; `scene-fahrenheit` plays under the pre-battle cutscene and
`boss-evrae` in the battle, both from the pre-rendered MP3s (HTTP 200); the stopgap pair never
plays; `victory-ffx` on the results; no page errors.

**Pre-existing, not from this change:** at every battle start the debug flow passes through
chapter select and `title` (Chapter 1 also `chapter-select`) plays for 2-5 s before the boss
cue loads — measured identically on Chapter 1 (`seymour-flux`). The cutscene's own
`music('boss-*')` step fires, but its fetch/decode lands after the screen change. Worth a look
by the flow / audio owners (src/app/**, src/audio/AudioManager.ts).

## Open for Bailey

1. The two cues, by ear: scores on the audition page.
2. NEAR/FAR: worth a presenter hook? (the cross-fade demo is the question).
3. Today's sound or the modern sound (with the real hall IR) for these two.
4. Beat 9 (Bevelle's guns after the win) is still silent after the results; research §12.6
   reads the music as escalating there. A third cue or a reprise is new content: needs a yes.
