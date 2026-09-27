# The seven installed boss poses (D-229, D-230, 2026-09-26)

**Game case:** Yojimbo is **FFX only** (Chapter IX, subject `yojimbo-cavern`). Trema (Chapter XIII),
Logos, Leblanc, Ormi and the Leblanc Syndicate male goon (Chapter VI) are **FFX-2 only**.

**Bailey, 2026-09-26, verbatim:** "i'll go with all your recommendations, i love it." He was answering
the sheets in `../` (the maker's picks). A pick approves only the pose as shown.

## What was installed

| Subject / slot | Candidate (`D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/`) | Decision | Scale | Stature at that scale |
|---|---|---|---|---|
| `yojimbo-cavern/attack` | `yojimbo/attack-h/cand-45.png` (the hat-and-katana composite's cut-out) | D-229 | 1.053 | 0.78 (a lunge) |
| `yojimbo-cavern/hurt` | `yojimbo/hurt/cand-35.png` (the hat-and-sheath composite's cut-out) | D-229 | 1.25 | 0.97 |
| `trema/hurt` | `trema/hurt/cand-7.png` | D-230 | 0.93 | 0.94 |
| `logos/hurt` | `logos/hurt/cand-2.png` | D-230 | 1.00 | 0.78 |
| `leblanc/hurt` | `leblanc/hurt/cand-10.png` | D-230 | 1.00 | 0.73 (bent lean-back) |
| `ormi/hurt` | `ormi/hurt/cand-7.png`, **mirrored at install** | D-230 | 1.00 | 1.00 |
| `ffx2-dr-goon/hurt` | `ffx2-dr-goon/hurt/cand-4.png` | D-230 | 1.50 | 1.02 |

- Each PNG is the candidate byte for byte, except Ormi's. His render faces screen-left and his idle
  faces right, so he is mirrored. There is no repaint, and his sidecar says `flippedAtInstall`.
- Each sidecar has the shape of the D-194 and D-199 installs:
  - size and `baselineY` from the cut-out;
  - the head-matched `scale` and its `scaleNote`;
  - the generation record (seed, prompts, ControlNet, IP-Adapter, and the composite pieces for
    Yojimbo);
  - `status`, `judge`, `candidateOf`, `sha256`, `installedFrom` and `decision`.
- **Nothing was replaced:** every slot was empty. `public/art/manifest.json` was regenerated.
- **Backups:** `D:/Tools/pyrefly-art-backup/approved/2026-09-26-boss-poses/`. `installed/` holds the
  files; `replaced/` holds only a note that nothing was replaced.
- **Lock:** set `bailey:2026-09-26-boss-poses` in `docs/target/approved-hashes.json`.
  `verify-approved.mjs` gives 262 ok, 0 mismatched, 0 missing.
- **Test:** `tests/unit/engine/pose-install-bosses-0926.test.ts`.
- **Record:** `install-record.json`. Scripts: `install.py`, `heads.py` (gridded head crops) and
  `check.py` (the check sheet).

## The scales

The rule is **pose pixels × scale = idle pixels at the head**. This is the head-match method of the
D-194 install (`../../art5/installed-0926/README.md`). Stature is the pose's baseline height × scale
over the idle's. The gate is 0.75 to 1.30 upright and at least 0.60 in a lunge or bend.

### Yojimbo

The hat and mask are the idle's own pixels, composited at a known factor (`cand-N.json`
`composite.pieces`, hat): 0.95 on the attack and 0.80 on the hurt. So the scale is exact: 1/0.95 and
1/0.80.

### The FFX-2 five

Read on 3x gridded crops against the installed idle:

- **Trema:** ear height 0.87, eye to ear 0.98; installed at the mean, 0.93.
- **Logos:** his face is tipped back, so the helmet dome decides (143 px either way); 1.00.
- **Leblanc:** iris spacing gives 1.07. Eye to mouth gives 0.65, but she is seen from below with an
  open grin, so the tilt rules that reading out. The check beside the idle head matches at 1.00.
- **Ormi:** the bald head is about the same size, top to chin and across; 1.00.
- **The goon:** hair top to chin gives 1.50 and hair width 1.59; installed at 1.50. His stature, 1.02,
  agrees.

The pick sheets drew the FFX-2 five at 1.00. At 1.00 the goon stood 0.68 of his idle. At the measured
1.50 he stands as tall as the idle, with a head the same size. That is the one visible change from the
sheet Bailey saw.

**Confidence:** Yojimbo is exact. The FFX-2 five are good to about 8 to 10 percent, because each was
read from a single render with its head turned or tipped.

`scale-check.jpg` shows each pose at its installed scale beside the idle, on a shared ground line.

## Not done here (owed)

There is no real-key capture in battle yet. The unit test proves the pose map, the hashes, the manifest
and the scales the loader keeps. A production-build capture of the seven in their moments belongs to
the release's focused review. Yojimbo's attack is drawn only because of the iter2 attack-pose mapping
(D-231, merged in the same batch).
