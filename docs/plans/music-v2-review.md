# music-v2: paper preflight (rule 15)

`node tools/critic-plan.mjs --paths public/audio/manifest.json,...` classes this change **DEEP** (the manifest is
the asset loader's shared system): focused review before the deploy, deep review on the live build after it.
The renders were made earlier the same day by two scratch tracks (`D:/Tools/pyrefly-scratch/audio-v2/ffx` and
`ffx2`); this preflight covers the install into the game, written before anything under `public/` changed.

**Decision.** Bailey, 2026-09-30 ~14:25 EDT: "I'll go with all your recommendations" (music: route S for every
FFX cue, route N2 for every FFX-2 cue). **Game case (rule 14):** the 16 FFX cues are FFX only (route S); the 7
FFX-2 cues are FFX-2 only (route N2, or its route S render where the written pick rule found no N2 take);
`title`, `pause`, `chapter-select` are "both" in THEMES.md and stay as they are. No FF7 music cue exists.

## What can go wrong, and the check for each

| Risk | Check |
|---|---|
| A file whose length differs from the manifest: the loader clamps loop points and the wrap lands in the wrong place | install asserts the decode equals `duration` to 4 decimals (as `music-o1-ship.py --install`); the browser decode is compared again |
| A seam that clicks or jumps: new renders have sharper attacks (2-17 ms against 7-31 ms), so a hit on the loop's downbeat is a real step | measure in the browser's own decode: the run-on against the loop head, what the wrap adds against the file's own continuation (click and level), not the raw step |
| Loudness or true peak off target after the encode | `qa.mjs --strict` on the whole set: 0 findings |
| Over the 85 MB budget | qa total; FFX +1.22 MB and FFX-2 +1.46 MB against 80.93 MB before: about 83.6 MB. The SFX track changes the sprite separately: its size must be added before both ship together |
| A cue that falls back to the synth in the game | headless production build: every chapter's scene, battle and results cue plays from the file (AudioManager `source: prerendered`) |
| A test pinning the old bytes | `audio-music-o1.test.ts` pins the O1 record: it keeps the 3 unchanged cues and defers the 23 to a new record and test |
| Losing the old files | copies in `F:/pyrefly-parked/2026-09-30/audio-v2/music-v1` (MOVED.txt) and git history; nothing deleted |
| Licences | every library and IR in `docs/audio/CREDITS.md` with licence and credit line; two new required attributions (DRSKit, Arvedi, both CC-BY 4.0) |
| Screening lower than today | two cues (battle-ffx, boss-vegnagun) screen lower on the automated ear; shipped anyway per the decision, disclosed, and each is a one-file revert |
