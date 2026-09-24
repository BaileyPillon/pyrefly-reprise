# Independent check: Chapter VI goons install, Chapter VII cue, the records (2026-09-24)

Bailey, 2026-09-24 ~00:30 EDT: "All your recommendations". This checks the three
commits that followed it: `e2ed1e7d` (goons, FFX-2 only), `ac0c61f8` (Macalania
battle cue, FFX only) and `ba2e6d48` (records). All three are on local `main` and
not pushed (`main` is 37 commits ahead of `origin/main`). Check scripts and output
are in `D:/Tools/pyrefly-scratch/ch7check/` (`verify.mjs`, `verify.json`,
`goons-frame.png`, `ch7-battle.png`, `seam.mjs`).

## 1. Goons install (FFX-2 only): PASS

| Check | Result |
|---|---|
| Pixels 1:1 against the picked options | PASS. The installed `idle.png` files are byte-identical to picks.json option C (`dr-C.72324.png` f01f1e05…, `fem-C.73323.png` 151b35dc…). No repair. |
| Sidecar facing | PASS. Both are `right` with `facingObserved: true`, which matches the pixels: Dr. Goon's head turns to screen-right and Fem-Goon is in profile facing screen-right. The manifest has `states: ['idle']` and `facing: 'right'` for both. |
| In battle (GPU: RTX 5070 Ti, D3D11; vite on 5886, stopped) | PASS. `ffx2-leblanc` stages yuna, rikku, paine, ormi-entrance, dr-goon and fem-goon. Neither goon is a placeholder, and both are mirrored to face the party on the left. There were 0 `/art/` 404s and 0 page errors. |
| Scale beside Ormi | PASS. The goons' `worldHeight` is 1.162 against Ormi's 1.66, a ratio of 0.70. Corrected for depth (px × depth), the ratio is 0.72 for Dr. Goon and 0.71 for Fem-Goon. |
| Approved hashes | PASS. The set `chapter:leblanc-goons:2026-09-24` carries the words "All your recommendations" and both sha256s. `verify-approved.mjs`: 126 ok, 0 mismatched, 0 missing. The backup copies have the same hashes. |

Two things to note:
- Dr. Goon stands at x≈648, which is near Paine (x≈554) on the party side. This is in the formation code, which another agent owns.
- `targets.json` (the goon tile, `delivery: not-scheduled`, "still shows the placeholder") and D-047 ("install still owed") are now out of date.

## 2. Macalania cue `boss-seymour-macalania` (FFX only): PASS as a candidate

| Check | Result |
|---|---|
| Decode | PASS. The MP3 decodes without errors: 44.1 kHz stereo, 124.9 s, 1,901,430 bytes, the same size as the manifest. |
| Loudness / true peak (ffmpeg ebur128) | PASS. Integrated loudness is −15.8 LUFS over the whole file (the manifest lists −15.99). True peak is −1.8 dBTP. |
| Loop seam | PASS. The loop runs from 7.619 s (bar 5) to 121.905 s (bar 64 at 126 bpm). The jump across the seam is 0.008, which is below the median step between adjacent samples (0.011). The audio after the loop end matches the audio after the loop start (correlation 1.000). The level goes from −34.7 dB before the seam to −23.1 dB after it, a held note followed by the downbeat. |
| Manifest | PASS. The entry has the file, loop points, duration, bytes, LUFS, true peak and score hash. |
| Wiring | PASS. In the Chapter VII battle, `audioDebug` shows `playing: boss-seymour-macalania` at gain 1 with source `prerendered`, and the network log shows `200 /audio/music/boss-seymour-macalania.mp3`. |
| No retail melody | PASS (read). All the pitch material is the in-house `SEYMOUR` and `SEYMOUR_MIRROR` from `themes.ts`, which is imported and not retyped. The rest is chord arpeggios over the project's own progressions and a plain chromatic descent (`SLITHER_*`). |
| Tests | PASS. 3 files, 54 tests. |

Still owed: `src/story/scripts/seymour-anima-macalania.ts:189` still calls
`music('boss-seymour', 1000)` under the reveal, and that file belongs to another agent. The cue stays a
candidate until Bailey listens to it (hard rule 13).

## 3. Records (`ba2e6d48`): PASS

`decisions.json` and `targets.json` parse. D-045, D-046, D-047 and D-048 each record the
words "All your recommendations", the right game (ffx/ffx/ffx2/ffx) and the right
options: A; Guardians Yield and Seymour 'body' with Anima's recall unchanged; Dr. Goon C
and Fem-Goon C; mood A. `OWNER-VERDICT.md` records the mood pick without a score and
states that no one judged it by ear.
