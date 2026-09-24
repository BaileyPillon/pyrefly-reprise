# Seymour Natus hero cast: CANDIDATE (FFX only)

Chapter X is FFX only (the Highbridge fight), so this painting is **FFX only**.
Decision: Bailey, 2026-09-24 ~19:20 EDT, "I'll go with all your recommendations" (one hero cast
painting for Natus, as D-034 / D-045). Sheet: [cast.jpg](cast.jpg). Scripts: [cast-scripts/](cast-scripts/).

- **What it shows.** Every Natus spell (Multi-ra, Flare, Break, Banish; `research/ffx-seymour-natus-highbridge.md`)
  plays the cast pose: both blade-wings (crescent, hilt, hand, tail) turn 18 degrees outward about the
  grip, so the wings open wider. The flare is our derived pose; the sources say what he casts, not how
  the model moves.
- **Method r3** (`docs/plans/art-method-r3/METHOD-CHECK.md` step 2): idle-pixel transplant from the locked
  idle (`idle.png`, sha256 c53d22c1...), then a masked seam repaint at each wrist only (Animagine XL 4.0 Opt
  img2img + IP-Adapter plus on the idle, denoise 0.4; left seed 924700, right seed 924721 of 3). The idle's
  white matte pocket in the right hand was Telea pre-filled and repainted; the white-ground fringe was peeled.
  GPU: about 1.7 minutes.
- **Gates.** MAD 0 outside the moved pieces and the seam masks; idle pixels 97.9 % (69.4 % unchanged,
  28.5 % moved), painted 2.1 %, invented colour 0 %, opaque area 0.9997 x the idle, no soft alpha.
- **Framing.** Same pixel scale and baseline (1148) as the idle; the canvas is widened sideways only
  (796 x 1165, idle x0 at x 73). `facing: front` (never mirrored), as the idle. The ring layer stays the
  idle's (not wired in `src` yet; the frames composite it as `idle.json` `layers` says).
- **Installed** as `public/art/characters/seymour-natus/cast.png` + `cast.json` (status CANDIDATE, sha256
  975fd8fd...), manifest regenerated (`seymour-natus` states: cast, idle); backup in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-natus-cast/`. Self-judged at 1:1 and in a real
  1600 x 900 frame (Chapter X, the Highbridge plate by request interception); not independently judged,
  not approved.
- **Open.** At battle size the change reads as "the wings open", a modest silhouette change; if Bailey
  wants a stronger read, the next step is a larger turn (the seams grow) or a raised arm (a new repaint).
