# music-v2: route S for FFX, route N2 for FFX-2 (2026-09-30)

**Decision.** Bailey, 2026-09-30 ~14:25 EDT: "I'll go with all your recommendations", answering the driver's
recommendation: route S (our scores played by free sampled orchestra in a measured hall, no AI) for every FFX
cue, route N2 (ACE-Step 1.5 at denoise ~0.30 over the route S render, band wording) for every FFX-2 cue.
**Nobody has heard any of it (rule 13).** Every statement here is a measurement; Bailey can veto any cue by ear
and it goes back to the old file (git, or the parked copy).

**Game case (rule 14).** From `public/audio/manifest.json` and the THEMES.md ship table:
- **FFX only, route S**: the 16 FFX cues (`battle-ffx`, `boss-dread`, `boss-evrae`, `boss-jecht`, `boss-seymour`,
  `boss-seymour-macalania`, `boss-yojimbo`, `boss-yu-yevon`, `boss-yunalesca`, `ending-ffx`, `scene-dreams-end`,
  `scene-fahrenheit`, `scene-gagazet`, `scene-macalania-temple`, `scene-zanarkand-dome`, `victory-ffx`).
- **FFX-2 only, route N2**: the 7 FFX-2 cues. Five ship N2 (`boss-ffx2-aeon`, `boss-shuyin`, `ending-ffx2`,
  `scene-bevelle-underground`, `victory-ffx2`); `boss-vegnagun` and `scene-farplane` ship their route S band
  render, because no N2 take reached structure fidelity 0.80 under the written pick rule (at 0.30, 0.25, 0.20).
- **Unchanged**: `title`, `chapter-select`, `pause` (THEMES.md says "both"). The manifest has no FF7 music cue.

Branch `music-v2` (from `main` 770823bc), worktree `D:/pyrefly-r29-audio`. Not pushed, not deployed, not merged;
no NOW.md edit (the driver owns those).

## What changed

- `public/audio/music/<cue>.mp3`: the 23 cues above, LAME V0, from
  `D:/Tools/pyrefly-scratch/audio-v2/ffx/candidate/music` (route S) and `.../ffx2/final/music` (N2 / S).
  How they were made (renderers, every iteration, pick rules, ear screens): the READMEs of those two folders.
- `public/audio/manifest.json`: only `bytes`, `lufs`, `truePeakDb` of those 23 moved (ffmpeg ebur128 on the
  V0, one decimal, as `music-o1-ship.py --install` writes them). Loop points, durations and score fingerprints
  are unchanged; each file decodes to the manifest's duration (asserted at install, 4 decimals) and, in the
  browser, to exactly the master's sample count (23 of 23).
- Install script: `D:/Tools/pyrefly-scratch/audio-v2/install_music_v2.py` (the `music-o1-ship.py --install`
  logic for these sources). Record builder: `.../audio-v2/build_record.py`.
- New `docs/audio/music-v2-2026-09-30.json`: per cue the game, route, source, loop, before/after bytes and
  SHA-256, qa.mjs figures, quality-measure figures (stereo, LRA, attack rise, top edge, cliff), the ear's
  paired PQ; totals and gates.
- New `tools/audio/music-v2-browser-proof.mjs` and its output `docs/audio/music-v2-2026-09-30-browser.json`
  (below).
- New `tests/unit/audio-music-v2.test.ts` (pins the files by SHA-256, the game/route split against THEMES.md,
  unchanged loop points, qa and stereo gates, the budget, and the browser proof).
  `tests/unit/audio-music-o1.test.ts` now pins only the three cues music v2 did not replace, and the total from
  the v2 record.
- Docs: `docs/audio/THEMES.md` ("How each cue ships" rewritten in place for music v2, the D-283/D-292 history
  condensed into one paragraph, the ship table's route and stereo columns re-measured; same line count),
  `docs/audio/CREDITS.md` (a music v2 section with every library, IR and tool, licence and credit; the game
  credits gain two required lines, DRSKit and the Arvedi IRs, CC-BY 4.0), `docs/audio/audition.html` (the top
  note replaced: the new score, before/after players for `battle-ffx`, `scene-gagazet`, `boss-ffx2-aeon`,
  `boss-vegnagun`; the "before" clips are the first 45 s of the old MP3s cut without re-encoding, in
  `docs/audio/candidates/music-v2/`; same line count), `docs/plans/music-v2-review.md` (paper preflight).
- Superseded files: copies of the 23 old MP3s and the old manifest in
  `F:/pyrefly-parked/2026-09-30/audio-v2/music-v1/` (MOVED.txt, sha256 list); also
  `git show 770823bc:public/audio/music/<cue>.mp3`. Nothing deleted.

## Measured

- `node tools/audio/qa.mjs --strict`: **0 findings**, exit 0. LUFS -16.00 to -16.21, true peak -1.08 to
  -3.06 dBTP, seam ok on all 26.
- **Size: 83.60 MB of the 85 MB budget** (80.93 before; music 78.22 to 80.89 MB, +2.68 MB). The budget was
  not raised. The new SFX set (another track) changes the sprite (2.71 MB today): its growth must fit in the
  1.40 MB left, or the two together need a decision.
- Stereo: all 23 inside the THEMES gate (L/R 0.643-0.795, side/mid -6.3 to -9.2 dB, mono-sum loss -0.5 to -0.9).
- Automated ear, paired PQ against the old file of the same cue (a screen, not a verdict): higher on 20 of 23,
  level on `victory-ffx` (-0.01), **lower on `battle-ffx` (7.95 to 7.61) and `boss-vegnagun` (7.11 to 6.93)**.
- N2 files carry a steep step at about 21.1 kHz (`cliff` 38 dB on `boss-ffx2-aeon`, `victory-ffx2`): it is the
  model's 48 kHz output band edge, above 20 kHz; the O1 test's "no encoder wall" check is on the O1 record only.

## Proof on a headless production build (`npm run build`, vite preview :8853, stopped by PID)

`PYREFLY_BROWSER=gpu PYREFLY_PROOF_OLD=F:/pyrefly-parked/2026-09-30/audio-v2/music-v1 node tools/audio/music-v2-browser-proof.mjs`

- All 26 cues: HTTP 200; decoded by the page's AudioContext to the manifest length within its 4-decimal
  rounding (|diff| <= 2 samples; equal to the master's sample count on all 23 new cues).
- Loop seam, on the browser's decode (the old files measured the same way, served from the parked copies):
  - run-on against the loop head (what the source node plays after the wrap vs what the file continues with):
    -29.6 to -84.5 dB (old files: -29.7 to -72.7);
  - what the wrap adds in the first 5 ms against the music's own local steps (p99 within 50 ms): 0.00 to 0.55
    (under 1 = no click; old: 0.04 to 0.51);
  - level jump the wrap adds over 50 ms: at most 0.08 dB (gate 1 dB).
  - The raw step across the wrap exceeds the local p99 on 10 cues, but equals the file's own step there within
    5 %: the loop head starts on a hit (sharper attacks), not a discontinuity.
- Real flow, real key on the title: title cue and the board (chapter select) from their files; then all 18
  chapters of the THEMES chapter cue map through the flow (pre-battle scene, every battle link, results),
  FFX and FFX-2: the scene cue and every battle cue played from the prerendered file in all 18; the results
  cue in 16 (Chapter IV's results are silent by design, as the map says). **Chapters XIII (Trema) and XVII
  (Sin: the Fins and the Core) never reached a victory**: the intended auto-strategy at skip speed lost or fled
  every seed tried (1-16, a second run on the same build, `supplement` in the proof JSON), so their results
  cue could not play; it is the same `victory-ffx2` / `victory-ffx` file that played at results in 14 other
  chapters, and `themes-audit.mjs` checks the wiring (0 departures). A battle-balance or strategy matter, not
  audio; worth a look by whoever owns those chapters. 0 console errors, 0 page errors, 0 failed requests
  (both runs). The chapters took 20 s to 3.5 min each (retries on defeat).

## Not done / open

- `battle-ffx` and `boss-vegnagun` screen lower than the files they replace; shipped because the decision
  covers every cue, and each is a one-file revert (`git show 770823bc:public/audio/music/<cue>.mp3` plus its
  three manifest fields). Bailey's ear decides.
- `boss-vegnagun` and `scene-farplane` are route S, not N2 (pick rule). N2 takes exist for both
  (`D:/Tools/pyrefly-scratch/audio-v2/ffx2/takes`); Farplane's unqualified takes screened higher than its S.
- Licences outside CC0/PD/MIT/Apache/BSD/CC-BY that shaped the renders (none of their files ship): Sonatina
  (CC Sampling Plus 1.0, shipping since the first score), Voxengo IR (royalty-free licence), jRhodes3d (music
  made with it CC0), Surge XT (GPL-3 synth, output ours).
- THEMES.md chapter cue map: row XVI's line on main runs into the "## Owed cues..." heading (pre-existing; the
  audit still passes). Not touched here.
- Deploy: `critic-plan` classes the manifest change DEEP: focused review before the deploy, deep review on the
  live build after it. Release 34 comes first; this is the audio release after it (with the SFX set if both
  fit the budget).
