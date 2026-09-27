# Direction B, the whole score (2026-09-27)

**Game case (hard rule 14): BOTH.** One pipeline renders every FFX cue, every FFX-2 cue and
the three shared menu cues; only the words given to the model differ, per cue and per game
(`tools/audio/modern/b-score-cues.mjs`). **Candidates only**: `public/audio/music/`,
`public/audio/manifest.json` and `src/audio/**` are untouched; the build never ships
`public/audio/candidates/**` (`tools/dist-filter.mjs`).

**Why.** Bailey, 2026-09-27 ~00:50 EDT, about the 26 September direction pack: "7 is the only
one that sounds good." Track 7 was Direction B, the ACE-Step restyle
(`public/audio/candidates/C-round1-battle-ffx-B-x12.ogg`, cut from sketch B's
`B-battle-ffx-101`). Earlier, ~00:40: "the game muisic still sounds like snes music..."
**No agent can hear (hard rule 13).** Everything below is measurement; Bailey judges by ear
from listening pack v2 and `docs/audio/audition.html` (section "Direction B, the whole score").
Whether AI-restyled audio may ship was asked and is still unanswered.

## Method

1. **The clip's pipeline, unchanged.** `tools/audio/ace-step.mjs` `buildGraph` through ComfyUI
   0.35.0 core nodes: `ace_step_v1_3.5b.safetensors`, `TextEncodeAceStepAudio` (lyrics
   `[inst]`, lyrics strength 1.0), `ConditioningZeroOut` negative, `ModelSamplingSD3` shift 5,
   `LatentApplyOperationCFG` with Reinhard tonemap 1.0, `KSampler` euler / simple, 50 steps,
   cfg 5, **denoise 0.40** on `VAEEncodeAudio(LoadAudio(<the shipped render>))`. Proof it is
   the same pipeline: `battle-ffx` seed 101 re-rendered today measures structure fidelity
   0.629 against sketch B's 0.628, and the rule below picked seed 101 again.
2. **Input = today's render of each cue** (`public/audio/music/<cue>.mp3`). `node
   tools/audio/qa.mjs` on the shipped set: 0 findings, no STALE RENDER, so each MP3 is the
   current score through the current renderer.
3. **Words.** `battle-ffx` and `boss-ffx2-aeon` keep sketch B's tags verbatim (the clip Bailey
   picked). Every other cue gets the same style core ("cinematic orchestral film score, live
   symphony orchestra, large concert hall, modern fantasy RPG soundtrack, expressive live
   performance, instrumental, no vocals"; FFX-2 cues get "with modern hybrid pop production")
   plus the instruments its score actually has (the channel list in
   `src/audio/tracks/<cue>.ts`), its mood from THEMES.md's cue map, and its key, bpm and meter.
   No instrument the cue does not have was named.
4. **Takes and the pick rule** (`tools/audio/modern/render-b-score.mjs`, written before any
   full-score take was measured): seeds 101, 202, 303 at 0.40; among takes whose
   autocorrelation tempo (octave-folded) is within 3 % of the source's, the highest
   `structureFidelity` (ace-measure.py: mean of onset F, 4-bar window correlation and chroma
   gain; the metric sketch B ranked by; 0.85 is its ceiling, the VAE round trip alone). If none,
   the same seeds at 0.35; if still none, the best 0.35 take, FLAGGED.
5. **Two amendments, made after pass 1 and before anyone listened**, both written in the code:
   - *Tempo reference.* The source's own tempo estimate misses its written bpm on slow or
     unpulsed cues (`boss-yojimbo` reads 88.25 for 132; `boss-dread` 130.5 for 90;
     `scene-farplane` 181.75 for 92), so pass 1 rejected takes that sat exactly on the written
     tempo (Yojimbo seed 101 read 133.25). A take now also keeps the tempo when it is within 3 %
     of the written bpm. Pass 1 had flagged 8 cues; after this, 1.
   - *Low fidelity.* A pick under 0.35 gets three more seeds (404, 505, 606) at the same
     strength. This changed `boss-dread` (0.318 -> 0.322), `boss-seymour` (0.299 -> 0.341) and
     `scene-farplane` (0.169 -> 0.271); `boss-jecht` and `scene-gagazet` kept their picks.
6. **Timing.** The pick is shifted by the median lag of its correlated 4-bar windows, but only
   with at least 3 correlated windows and a lag within 60 ms (sketch B measured a constant 10 to
   30 ms). A median from one or two weak windows is ambiguity, not an offset: pass 1 had shifted
   `boss-seymour` by 230 ms (one eighth at 132 bpm) from 2 of 13 windows; that is now 0.
7. **Loop and stinger.** Each file keeps the shipped layout: intro, loop body, 3 s run-on. The
   last beat before `loopEnd` (60/bpm s, clamped to 0.3 to 1.0 s) crossfades, equal power, into
   the take's own audio just before `loopStart`, and the run-on is rebuilt from the loop head,
   so the wrap lands on continuous audio. Everything before `loopStart` (the victory fanfares,
   every intro) is the take itself. Loop points are the shipped manifest's, unchanged.
8. **Level and format.** Gain to -16 LUFS integrated, the project limiter
   (`tools/audio/master.mjs` `limit`) at -1.4 dBFS, no second bus compressor; MP3 via libmp3lame
   `-q:a 5`, 44.1 kHz stereo, exactly as `tools/audio/render.mjs` encodes; re-limited 0.3 dB
   lower if the decoded MP3 overshoots -1 dBTP.

No download was needed (`docs/audio/downloads-2026-09-27.md`: ACE-Step 1.5 exists and was
checked; not taken, because it would be a different sound from the one Bailey picked).
GPU: ComfyUI was shared with the FF7 paintings; each job waited until at most 2 jobs were
ahead (`ACE_MAX_AHEAD=2`), ComfyUI was never restarted, no out-of-memory error occurred.
111 takes in all (the cache in `D:/Tools/pyrefly-scratch/direction-b-0927-work/raw/`); pass 1
took about 45 minutes of wall time behind the painting queue.

## The cues (25), as delivered

`public/audio/candidates/direction-b-2026-09-27/<cue>.mp3` plus its own `manifest.json`
(same loop points, durations and score fingerprints as the shipped manifest). Take =
strength / seed. Tempo = the take's measured tempo / the written bpm. Lag = shift applied (ms).
Flux = QA's spectral flux across the loop join against the first entry into the loop.

| Cue | Game | Where it plays | Length | Loop | Take | Structure kept | Tempo | Lag | LUFS / dBTP | LRA | Flux | QA |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `battle-ffx` | FFX | ordinary-fight cue (THEMES row 4) | 1:19.8 | 0:06.4 to 1:16.8 | 0.40 / 101 | 0.629 | 150 / 150 | -10 | -16.02 / -1.21 | 6.0 | 0.2x | pass |
| `boss-dread` | FFX | demo cutscene (CutsceneScreen.ts); no chapter row | 1:28.3 | 0:10.7 to 1:25.3 | 0.40 / 404 (pass 1: 0.35 / 202) | 0.322 | 90.88 / 90 | 0 | -16.00 / -1.24 | 6.4 | 0.3x | pass |
| `boss-evrae` | FFX | battle: VIII Evrae | 1:23.0 | 0:06.7 to 1:20.0 | 0.40 / 202 | 0.518 | 144.5 / 144 | -20 | -15.99 / -1.29 | 9.0 | 1.0x | pass |
| `boss-ffx2-aeon` | FFX-2 | battle: IV, VI (stand-in), XI, XIII (Trema phase) | 1:57.0 | 0:12.0 to 1:54.0 | 0.40 / 303 | 0.513 | 160 / 160 | -20 | -16.00 / -1.42 | 3.9 | 1.0x | pass |
| `boss-jecht` | FFX | battle: III (Jecht) | 1:50.1 | 0:06.7 to 1:47.1 | 0.40 / 101 | 0.339 | 148 / 144 | -40 | -15.98 / -1.23 | 5.3 | 0.3x | pass |
| `boss-seymour` | FFX | battle: I Seymour Flux, XII (stand-in) | 1:41.7 | 0:07.3 to 1:38.7 | 0.40 / 404 (pass 1: 0.40 / 202) | 0.341 | 130.5 / 132 | -20 | -16.00 / -1.30 | 7.2 | 0.5x | pass |
| `boss-seymour-macalania` | FFX | battle: VII, X (stand-in) | 2:04.9 | 0:07.6 to 2:01.9 | 0.40 / 202 | 0.573 | 125 / 126 | -30 | -16.01 / -1.20 | 7.5 | 0.6x | pass |
| `boss-shuyin` | FFX-2 | battle: V Shuyin, XV (stand-in) | 1:45.8 | 0:12.6 to 1:42.8 | 0.40 / 303 | 0.351 | 154 / 154 | 0 | -16.01 / -1.24 | 7.9 | 0.2x | pass |
| `boss-vegnagun` | FFX-2 | battle: V Vegnagun | 1:34.4 | 0:11.4 to 1:31.4 | 0.40 / 202 | 0.456 | 166.75 / 168 | -20 | -16.00 / -1.62 | 3.8 | 0.8x | pass |
| `boss-yojimbo` | FFX | battle: IX, XIV (stand-in) | 1:30.3 | 0:14.5 to 1:27.3 | 0.40 / 101 (pass 1: 0.35 / 101) | 0.386 | 133.25 / 132 | 0 | -16.00 / -1.26 | 5.9 | 0.3x | pass |
| `boss-yu-yevon` | FFX | battle: III (Yu Yevon) | 3:38.6 | 0:06.0 to 3:35.6 | 0.40 / 303 (pass 1: 0.35 / 202) | 0.507 | 40.5 / 40 | 0 | -16.00 / -1.34 | 8.8 | 0.3x | pass |
| `boss-yunalesca` | FFX | battle: II Yunalesca | 1:43.9 | 0:10.9 to 1:40.9 | 0.40 / 202 | 0.394 | 176.5 / 132 (6/8; matches the source's own reading) | -30 | -16.01 / -1.10 | 8.0 | 0.3x | pass |
| `chapter-select` | both | chapter select | 1:17.8 | 0:04.3 to 1:14.8 | 0.40 / 303 | 0.413 | 84.5 / 84 | -10 | -16.08 / -1.14 | 8.6 | 0.0x | pass |
| `ending-ffx` | FFX | FFX ending (story script) | 2:05.7 | 0:33.6 to 2:02.7 | 0.35 / 101 | 0.492 | 56.62 / 58 | -30 | -16.03 / -1.08 | 12.1 | 0.9x | pass |
| `ending-ffx2` | FFX-2 | FFX-2 ending (story script) | 1:59.3 | 0:12.1 to 1:56.3 | 0.40 / 303 | 0.386 | 84.5 / 84 | 10 | -16.00 / -1.22 | 9.2 | 0.2x | pass |
| `pause` | both | pause menu | 0:50.0 | 0:05.2 to 0:47.0 | 0.40 / 101 (pass 1: 0.35 / 303) | 0.515 | 46.12 / 46 | 0 (seen 160, 1 window) | -16.00 / -1.50 | 8.0 | 0.2x | pass |
| `scene-bevelle-underground` | FFX-2 | scene: IV, VI, XIII, XV | 1:48.6 | 0:19.2 to 1:45.6 | 0.40 / 303 | 0.538 | 100 / 100 | -10 | -16.00 / -1.31 | 7.8 | 1.0x | pass |
| `scene-dreams-end` | FFX | scene: III, XII (stand-in) | 1:44.1 | 0:12.6 to 1:41.1 | 0.40 / 202 | 0.388 | 76 / 76 | 0 | -16.00 / -1.24 | 17.2 | 0.2x | pass |
| `scene-fahrenheit` | FFX | scene: VIII (Fahrenheit deck) | 1:16.8 | 0:09.2 to 1:13.8 | 0.35 / 303 | 0.456 | 81 / 104 | -10 | -16.00 / -1.20 | 16.4 | 0.6x | pass, **FLAGGED** |
| `scene-farplane` | FFX-2 | scene: V, XI | 1:47.3 | 0:20.9 to 1:44.3 | 0.40 / 404 (pass 1: 0.35 / 101) | 0.271 | 92.25 / 92 | 0 | -15.99 / -1.74 | 3.5 | 0.5x | pass |
| `scene-gagazet` | FFX | scene: I, VII, IX, X, XIV | 1:46.3 | 0:40.0 to 1:43.3 | 0.40 / 202 | 0.314 | 72.25 / 72 | -30 | -16.14 / -1.10 | 10.6 | 0.1x | pass |
| `scene-zanarkand-dome` | FFX | scene: II | 2:09.2 | 0:10.0 to 2:06.2 | 0.40 / 202 | 0.422 | 34.88 / 48 (tempo map; matches the source's reading) | 0 (seen -30, 2 windows) | -16.11 / -1.35 | 16.9 | 0.4x | pass |
| `title` | both | title screen, demo scene | 1:37.8 | 0:08.3 to 1:34.8 | 0.40 / 202 | 0.424 | 54.5 / 58 (tempo map) | 0 | -16.02 / -1.28 | 13.6 | 0.9x | pass |
| `victory-ffx` | FFX | results after an FFX win; one-shot fanfare before the loop | 1:15.1 | 0:08.1 to 1:12.1 | 0.40 / 202 (pass 1: 0.35 / 202) | 0.534 | 120 / 120 | 10 | -16.05 / -1.22 | 10.1 | 0.3x | pass |
| `victory-ffx2` | FFX-2 | results after an FFX-2 win; brass fanfare before the groove | 1:10.5 | 0:07.5 to 1:07.5 | 0.40 / 202 | 0.639 | 127.75 / 128 | 0 | -16.01 / -1.21 | 3.8 | 0.1x | pass |

Every "where it plays" is from THEMES.md's chapter cue map and the callers in `src/`; the full
wording per cue is in `docs/audio/direction-b-2026-09-27.json`.

**The Macalania scene sketches** (FFX only, `docs/audio/sketches/2026-09-24/`), restyled the
same way for the pack, in `public/audio/candidates/direction-b-sketches-2026-09-27/`: A 0.35 /
303 (fidelity 0.418), B 0.40 / 303 (0.425), C 0.35 / 202 (0.468); none flagged. They are
sketches, not looped cues: no loop repair.

## Audio QA

`PYREFLY_QA_AUDIO_DIR=public/audio/candidates/direction-b-2026-09-27 node tools/audio/qa.mjs
--strict --json=docs/audio/direction-b-2026-09-27-qa.json`: **exit 0, 0 cues with findings**
(duration and bytes agree with the candidate manifest, -16 +/- 2 LUFS, true peak under -1 dBTP,
0 clipped samples, loop seam step and seam flux ok, spectral tilt gate ok, no leading silence
over 0.5 s, fingerprints current). 39.5 MB for the 25 files (the shipped set is 37.8 MB of
music). `qa.mjs` gained one thing for this: the `PYREFLY_QA_AUDIO_DIR` override, so a candidate
set is audited by the same gates as the shipped one.

## What the model changed (measured, not heard)

- **Structure kept** ranges 0.271 (`scene-farplane`) to 0.639 (`victory-ffx2`); Bailey's clip
  was 0.629. The rhythmic, pulsed cues keep the most (battle-ffx, victory-ffx2,
  boss-seymour-macalania, scene-bevelle-underground). The sparse, slow or rubato ones keep the
  least, because the model re-articulates held notes and fills silence: every measure in
  ace-measure.py is onset- or chroma-based, and a pad or a choir chord gives it little to hold.
- **Of the four Bailey criticised:** title 0.424, boss-seymour 0.341 (the lowest of the four:
  2 of 13 four-bar windows correlated in its first pick), boss-shuyin 0.351, boss-yojimbo 0.386.
  These are the places a restyle may have moved notes or entries; only an ear can say whether
  it matters.
- **Dynamics.** Loudness range rose on most cues (title 13.6 LU, the two quiet scenes 16.4 to
  17.2 LU, endings 9 to 12 LU); the FFX-2 hybrid cues stayed compact (3.5 to 3.9 LU).
- **Timing.** Where it could be measured the offset against today is 0 to 40 ms and was
  corrected; tempo held within 3 % on every pick but `scene-fahrenheit`.

## What failed or is flagged

- **`scene-fahrenheit` FLAGGED**: no take at 0.40 or 0.35 held the tempo (best reads 81 bpm
  against the written 104 and the source's own reading). It was rendered and passes QA; it may
  drift against the fight's scene timing. A lower strength (0.30) or more seeds is the next try.
- **Low structure** (below 0.35 even after extra seeds): `scene-farplane` 0.271,
  `scene-gagazet` 0.314, `boss-dread` 0.322, `boss-jecht` 0.339, `boss-seymour` 0.341.
- No cue failed to render, no out-of-memory, no QA finding.

## Listening pack v2

`D:/Tools/pyrefly-scratch/audio-pack-v2-0927/` (outside the repo; `pack.md` has the order and
the three questions). Built by `tools/audio/modern/pack-b.mjs` from the lossless masters, each
window levelled to -16 LUFS (iterated after fades and limiting; Zanarkand's window reached
-16.3 with about 2 dB of limiting), 1 s fades, MP3 192 kbps. 10 clips, 7:45 in all; tracks 1
to 4 use the same windows as tracks 1 to 4 of the 26 September pack.

## Files

| Path | What |
|---|---|
| `tools/audio/modern/render-b-score.mjs` | the renderer (takes, pick rule, loop repair, master, candidate manifest, report) |
| `tools/audio/modern/b-score-cues.mjs` | the words, key, bpm, meter and where-it-plays per cue; the Macalania sketches |
| `tools/audio/modern/pack-b.mjs` | listening pack v2 |
| `tools/audio/modern/audition-b-score.mjs` | writes the audition section between the `direction-b` markers |
| `tools/audio/qa.mjs` | `PYREFLY_QA_AUDIO_DIR` override |
| `public/audio/candidates/direction-b-2026-09-27/` | 25 MP3 + `manifest.json` (38 MB) |
| `public/audio/candidates/direction-b-sketches-2026-09-27/` | 3 Macalania sketches in B (2.9 MB) |
| `docs/audio/direction-b-2026-09-27.json` | every take's measurements, the picks, the finish numbers |
| `docs/audio/direction-b-2026-09-27-qa.json` | the QA report |
| `docs/screenshots/audio/direction-b-audition*.png` | the audition section at 1000 px and 375 px |

Re-run: `node tools/audio/modern/render-b-score.mjs --macalania` (cached takes are reused;
`--no-gpu` re-picks and re-finishes from the cache only), then the QA line above,
`node tools/audio/modern/pack-b.mjs`, `node tools/audio/modern/audition-b-score.mjs`.

## Not done

- Nothing is routed into the game, by the brief. Shipping B means copying the 25 files over
  `public/audio/music/` and updating the manifest's bytes and loudness: a separate,
  Bailey-approved step (and his answer on whether AI-restyled audio may ship).
- The audition page was checked in a browser (a throwaway static server on :5793, stopped
  afterwards): every player in the section (4 of today's cues, the 25 B cues, the 3 sketches)
  loads and decodes, the cues at their manifest lengths, the "Collect my answers" button fills the box on a real
  click, no horizontal scroll at 1000 px or 375 px.
