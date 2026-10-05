# hires-alpha-fix: the repair of the hi-res masters' alpha and rims (release 39, 2026-10-04)

Game case: both games, shared pipeline (every figure and boss master of the library; each asset keeps its own `game` field). Python 3 with numpy and Pillow, no other dependency.
The method, the numbers and the install are in [docs/handoff/r39-hires-engine.md](../../../docs/handoff/r39-hires-engine.md) ("Fidelity repair") and in the repaired library's `reports/README-alpha-fix.md`.

| script | what it does |
|---|---|
| `alphafix.py` | the repair itself (`repair`, `reduce_half`) and the measurements (`metrics`: rim bias and MAD, alpha IoU, SSIM, edge specks, tiny alpha islands) |
| `batch.py` | rebuilds every master of `D:/Tools/pyrefly-art-backup/hires/` into `D:/Tools/pyrefly-art-backup/hires-alpha-fixed/` (resumable; the library is read only; unchanged outputs are hard links) |
| `finalize_manifest.py` | writes the new library's `manifest.json` and checks it file by file |
| `summarize.py`, `sheets.py` | the aggregate numbers and the contact sheets of the worst rims (before, after, approved; 4x zoom over black, white and the chapter plate) |
| `microdetail.py` | crops of compact features a master has that the painting does not (rivets, beads, strands); nothing is changed |
| `backdrop_sheets.py` | the 1:1 sheets of the backdrop masters against their paintings (how the six held backdrops were found) |
| `measure_installed.py` | the installed tiers against the approved paintings (the 3x is derived at install) |
| `webp_agree.mjs` | lossless WebP against PNG in Chromium and WebKit with the project's own `comparePair` (the decoder-agreement proof, D-376) |

Run: `python batch.py --workers 4` (about 40 minutes on the owner's machine), `python finalize_manifest.py`, then install with
`node tools/hires-install.mjs --lib D:/Tools/pyrefly-art-backup/hires-alpha-fixed --replace-from D:/Tools/pyrefly-art-backup/hires --park <dir> --only characters/,backdrops/ --apply` and `node tools/gen/manifest.mjs`.
`R39_FIXED_OUT=<dir>` writes somewhere else (for a trial).
