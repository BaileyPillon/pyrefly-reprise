# Motion rig status (perspectives round, 2026-09-27)

Both stages are done. All clips are 30 fps H.264 from the real engine, captured
deterministically. Details, camera keyframes and provenance are in `motion.json`; the scripts are in `../mock-scripts/motion-*.txt`.

| Clip | Size | Length | Provenance | Status |
|---|---|---|---|---|
| `M0-ffx-ch1.mp4` + `M0-ffx-ch1-strip.jpg` | 1600x900 | 11.6 s, 4.55 MB | REAL ENGINE / existing art | done (stage 1) |
| `M1-ffx-ch1.mp4` + `M1-ffx-ch1-strip.jpg` | 1600x900 | 11.6 s, 6.59 MB | REAL ENGINE / existing art | done (stage 1) |
| `M0-ffx2-ch4.mp4` + `M0-ffx2-ch4-strip.jpg` | 1600x900 | 11.6 s, 4.78 MB | REAL ENGINE / existing art | done (stage 2, re-filmed) |
| `M1-ffx2-ch4.mp4` + `M1-ffx2-ch4-strip.jpg` | 1600x900 | 11.6 s, 6.7 MB | REAL ENGINE / existing art | done (stage 2, re-filmed) |
| `M1-ffx-ch1-phone.mp4` + `M1-ffx-ch1-phone-strip.jpg` | 390x844 | 11.6 s, 1.8 MB | REAL ENGINE / existing art | done (stage 1) |
| `M0-ffx-ch1-phone.mp4` + `M0-ffx-ch1-phone-strip.jpg` | 390x844 | 11.6 s, 1.44 MB | REAL ENGINE / existing art | done (stage 1) |
| `M4-ffx-ch1.mp4` + `M4-ffx-ch1-strip.jpg` | 1600x900 | 10.93 s, 6.74 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M4-ffx2-ch4.mp4` + `M4-ffx2-ch4-strip.jpg` | 1600x900 | 9.6 s, 6.82 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M2-ffx-ch1-cut.mp4` + `M2-ffx-ch1-cut-strip.jpg` | 1600x900 | 11.6 s, 5.12 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M2-ffx-ch1-whip.mp4` + `M2-ffx-ch1-whip-strip.jpg` | 1600x900 | 11.6 s, 6.51 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M2-ffx2-ch4-cut.mp4` + `M2-ffx2-ch4-cut-strip.jpg` | 1600x900 | 11.6 s, 5.18 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M2-ffx2-ch4-whip.mp4` + `M2-ffx2-ch4-whip-strip.jpg` | 1600x900 | 11.6 s, 6.62 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M3-ffx-ch1.mp4` + `M3-ffx-ch1-strip.jpg` | 1600x900 | 12.0 s, 6.41 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M3-ffx2-ch4.mp4` + `M3-ffx2-ch4-strip.jpg` | 1600x900 | 6.9 s, 4.45 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M5-ffx2-ch4.mp4` + `M5-ffx2-ch4-strip.jpg` | 1600x900 | 10.2 s, 5.49 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |
| `M6-ffx-ch1.mp4` + `M6-ffx-ch1-strip.jpg` | 1600x900 | 11.6 s, 5.03 MB | REAL ENGINE + NEW ART (candidate) | done (stage 2) |

**Stage 2 done** (2026-09-27): M2 cut + whip (both chapters), M3 (both), M4 complete (both, replacing the stage-1 M4),
M5 In the Round (Chapter IV), M6 Cinematic Shoulder (Chapter I); M0 and M1 Chapter IV re-filmed on the live Wait clock.
Every FFX-2 clip runs the shipped Wait clock (`motion.json` ffx2Clock says what changes under Active).
Build defect found while filming: the enemy banner stays up over the victory (`motion.json` observedDefects, `evidence/`).
