# Art request from the stills rig (stage 1 → stage 2, 2026-09-27)

Written by the stills rig after stage 1. Candidates for the options round only (AGENTS.md rule 9):
nothing here goes into `public/art`. Deliver as `D:/pyrefly-mock-persp/public/mock-art/<subject>/<view>.png`
with a sidecar, and list each in `READY.json` as before. Frames that show the need:
`frames/ffx-ch1/P06-diorama.jpg`, `frames/ffx2-ch4/P06-diorama.jpg` (and the alternates in `frames/alt/`).

## 1. Diorama floor plates (P6, and the P9 tabletop floor): NEEDED

**Finding.** Today's ground does not hold up from above. From 21-40° of elevation both floors read as an
empty tiled field: Gagazet's `ground` is a 44-unit hue-matched plane with a 4x4 tiled texture and a radial
fade; Bevelle's `machina-deck` is a dark 46-unit plate grid that goes near-black unless the scene lights
are tripled. Figures are about 160 px tall on a mostly empty frame, and the painted backdrop is barely
in view. The option cannot be judged fairly without a floor painted to be seen from above.

| Subject | View | What | Size |
|---|---|---|---|
| `floor-gagazet` | `top` | Gagazet battle floor, painted **straight down (orthographic)**: moonlit snowfield with wind-carved drifts, cracked blue ice sheets, a few dark rock outcrops at the edges, faint footprint trails, scattered pyrefly glints. Palette from `public/art/backdrops/gagazet.png` (moon-blue key, fog `#426b9e`) | 4096 x 4096 |
| `floor-bevelle` | `top` | Bevelle Underground machina deck, straight down: riveted steel plates with worn edges, glowing cyan conduit seams, the torn floor hole with cyan light (it sits at world x 2.4, z -7.8, ellipse about 7.6 x 4.9 units), a Yevon inlay, oil sheen and warm lamp spill. Palette from `bevelle-underground.png` (dark steel, orange lamps, cyan) | 4096 x 4096 |

- **Mapping the rig will use.** The plate covers a 44 x 44 world-unit square centred on (0, -2) for Gagazet
  and 46 x 46 centred on (0, -5) for Bevelle, so 1 world unit is about 93 px (Gagazet) or 89 px (Bevelle).
  The arena where the figures stand is the middle third (x -4 to 5, z -8 to 3); keep that area readable and
  calm (no hard detail under the feet), put the interest around it.
- **Edges.** A soft painted falloff to the fog colour over the outer 10 % so the plate never shows a border
  (the backdrop plate carries the horizon).
- **No figures, no shadows of figures, no text.** The engine draws the contact shadows.
- Optional, if time allows: a matching **edge band** (the arena's rim seen from 30° above: cliff lips for
  Gagazet, a gantry rail for Bevelle), 4096 x 1024, alpha cut-out, to frame the diorama.

## 2. Still missing for the other stage-2 frames (already in the shot spec)

Delivered and read by the rig: the six `rear34` party paintings and the two `rear34-hi` (Tidus,
Yuna White Mage) in `READY.json`. Still needed:

- **P4 Reverse Angle, the far side of each arena** (replaces today's TAGGED stand-in, which is the
  front plate mirrored and blurred): `plate-gagazet-reverse` and `plate-bevelle-reverse`, 2688 x 1536 like
  today's plates, painted from about 0.9 party-heights above the floor looking level toward where the
  party stands, horizon at about 45 % from the top (the stand-in sits the plate's centre at world y 2.5-4.5
  and 56 units from the lens, 82 x 47 units wide at k 1.0).
- **P4 boss rear views, optional:** `seymour-flux-body/rear34` and `ffx2-bahamut/rear34`. The rig already
  shows the boss as a dark rim-lit silhouette, so a rear view mostly changes the rim shape; low priority.
- **P13 Proscenium, the painted arch:** one 1920 x 1080 frame overlay with alpha, Ink & Gold: a gold
  proscenium arch with an ornament at the top centre, heavy curtains at both sides and a swag at the top,
  an apron strip at the bottom with footlight glows, a transparent stage opening of about x 200-1720,
  y 118-1010 (the stand-in's opening, `frames/*/P13-proscenium.jpg`). The HUD sits on top of it, so the
  lower corners can be dark.
