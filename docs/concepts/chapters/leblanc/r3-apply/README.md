# Chapter 6 art r3: Option A applied, Ormi's heart candidate (FFX-2 only)

Bailey, 2026-09-23 about 13:25 EDT: "All recommendations on the three art decisions."
Sheets: `docs/concepts/chapters/art-r3-decisions/`, method `docs/plans/art-method-r3/METHOD-CHECK.md` §4.
Game case: **FFX-2 only** (Chapter VI, Leblanc Syndicate); nothing here touches an FFX subject
or a party member.

## 1. Ormi's Syndicate heart (Decision 3; research/ffx2-leblanc-syndicate.md §10.1)
Candidate only, **not installed** (the judge decides): `D:/Tools/pyrefly-lora/ormi/r3/idle.heart.png`
(+ `idle.heart.json`, `idle.heart.transplant.json`, masks `r1heart.npy` / `target_mask.npy`).
Sheet: `ormi-heart.jpg` (idle before | after | r1 cast.960106 at 1:1, shield centre at 2x).

- Source: the heart of r1 `cast.960106` (sha256 f0a88fc5...), hand/colour mask (red fill +
  gold outline + 1 px ink), `ormi-heart-mask.py`.
- Warp: affine on a 2x Lanczos canvas, heart axis re-aimed to the idle's boss axis, across-axis
  foreshortening x0.50 (r1 shield about 60 degrees off face-on, idle about 73), set over the idle's
  gold boss inside its dark ring (`ormi-heart-transplant.py 0.50 61 400 578 3`).
- Light: L only, x0.807 (idle red rim / r1 heart red medians) times the idle's own low-pass light
  (sigma 10, clipped 0.85 to 1.15); hue kept.
- Seam: 1 px feather; join not visible at 2x, so **no GPU repaint (0 GPU minutes, ComfyUI not used)**.
- Numbers: 7,170 pixels changed, all inside the heart + 2 px band; MAD outside = **0.0**; alpha
  identical; idle sha256 f7fcdfc3... unchanged on disk.

## 2. Option A installed (Decision 1)
- Ormi cast = r1 `cast.960106` restored with its sidecar (the r2 cast it replaced is backed up).
- Logos keeps the installed r2 cast; Leblanc's cast.png was not touched (driver installs it).
- `attack`, `hurt`, `ko` (png + json) of leblanc, logos, ormi moved to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch6-optionA/<subject>/` (byte-verified).
- Fallback proven in code before the move: `tools/gen/manifest.mjs` lists only present states;
  `resolvePoseMap` (`src/engine/BattlePresenterArt.ts`) walks `POSE_FALLBACKS`
  (attack -> ready -> idle, hurt -> idle, ko -> hurt -> idle) and `loadSubject`
  (`src/engine/PaintedArt.ts`) never requests a state the manifest lacks. Manifest now:
  leblanc / logos / ormi = `['cast', 'idle']`.

## 3. In-game check (1600x900, real GPU, own vite on 5460, stopped by PID)
`docs/screenshots/ch6-optionA/` (`ingame.json`, six captures, `contact.jpg`). Renderer: ANGLE
NVIDIA GeForce RTX 5070 Ti D3D11. `gotoChapter('ffx2-leblanc', auto 'intended')`, seed 6: victory
in 234 s. Every trio `cast` showed `<subject>/cast.png` (31 times), every `hurt` showed
`<subject>/idle.png` (54 times), `ko` resolved to idle (6) before the dissolve; no `attack` pose
was ever requested. 170 `/art/` responses, **0 errors / 404s**, **0 console errors** (one
three.js shadow-map warning). Decision 2 ("Yields") is not built here.
