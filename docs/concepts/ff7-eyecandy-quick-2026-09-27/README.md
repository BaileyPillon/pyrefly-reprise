# FF7 eye candy, quick mockups (2026-09-27)

FF7 only (Guard Scorpion, chapter FF7). Asked for by Bailey at about 11:55 EDT: "give me some quick
mockups with maximum eye candy", after "the character models look terrible and the menus are
nowhere near crisp enough ... it needs to be higher fidelity than the original" and "cant you just
have the characters and enemy switch sides? not mirrored just literally switch sides".

These are **options, not a build**. Nothing in `src/` changed. The party stands on the **left**
facing right, and Guard Scorpion stands on the **right** facing left, looming over them. Every
light, particle, beam and glow is procedural (numpy and Pillow for the scene, CSS and SVG for the
HUD). No retail image, effect, font or screenshot was used as input. No painting jobs ran.

| File | What it shows |
|---|---|
| `1-mako-storm-idle-1600.jpg` | **Mako storm**, Cloud's turn with the glove on "Attack". Volumetric shafts and bloom from the mako core, shadowed by each figure. Drifting mako motes and foreground bokeh. A wet floor that reflects the core and the fighters' feet in rippled puddles. Rim light from the core on every figure, and shadows tinted to the room (teal, not black). Contact shadows and long cast shadows. Soft depth of field on the far machinery, and heat shimmer on the core column. The A+ HUD drawn sharp at 1600 x 900 with a glass sheen, a soft blue outer glow, a glow on the active row, a glowing glove and a glowing ready marker. |
| `2-tail-laser-1600.jpg` | **Tail Laser**. The raised tail's lens fires a white-hot beam with cyan and magenta glow through Cloud and into Barret. Faint afterimages show the sweep up from the floor, and a molten scorch line with droplets glows on the floor. Heat haze runs along the beam. There are sparks and hit bursts on both, a lens flare with a star and ghosts at the lens, a brief screen flash, and a hot tint on both figures. The damage digits glow and carry a dotted bounce arc. The top window reads "Tail Laser". |
| `3-braver-1600.jpg` | **Braver**. The stage is darkened with a heavy vignette, and Barret and the machine are dimmed. Cloud is mid-leap with cyan afterimages, and a glowing sword arc comes down onto the machine. Speed lines converge on the hit. The impact has a flash, three shockwave rings that bend the image around them, debris and sparks. Cloud's LIMIT gauge is blazing (glow and flames). The top window reads "Braver". |
| `4-tail-laser-phone-390.jpg` | My favourite, Tail Laser, at 390 x 844 CSS px, saved at 2x (780 x 1688) like the A+ phone frames. It uses the A+ phone HUD. The figures are restaged for portrait: the boss is up and to the right, the party down and to the left, and the beam goes through Cloud's chest so his face stays readable. |

## What is placeholder (also labelled on each frame)

- **Cloud and Barret** are **unapproved pilots** from the high-fidelity art job that is running now
  (`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi/house/cloud/p1` and
  `house/barret/p1`). They were painted facing right (`"mirrored": false` in their sidecars), and
  **nothing was flipped**. I cut them out with `tools/gen/rembg.py` (isnet-anime).
  - The Cloud pilot also painted a second sword hilt behind his head. I erased that hilt in the
    cut-out. His pauldron is on the far (left) shoulder, as canon puts it for a figure facing right.
  - Barret's gun is on his **right** (near) arm, but the pilot still shows a **fist** at the end of
    the gun arm. That is not canon, and the frames say so.
- **The Braver leap** is the standing Cloud pilot rotated 22 degrees and lifted into the air. A real
  leap pose needs to be painted.
- **Guard Scorpion** is the installed art (round 2 cleanup, `public/art/characters/ff7-guard-scorpion*`),
  **mirrored**.
  - Left-facing round 1 renders do exist (`candidates/2026-09-27-ff7/guard-scorpion/idle-a/b/c`,
    sidecar `"facing": "left"`). But they are the superseded thin design, and they have no laser
    lens on the tail, which Tail Laser needs. So I mirrored the current design instead.
  - The machine is bilaterally symmetric: twin rifles, one centred eye and a centred tail. Round 2
    flipped its own layout sketch for the same reason (`../ff7-art-2026-09-27/round2/README.md`).
    The only mark on the side, the "II" decal, reads the same mirrored, so nothing canon changes.
  - If Bailey would rather not use a mirror, the high-fidelity job has a left-facing Guard
    Scorpion sketch (`_work/sk/gs-l.png`) waiting to be painted.
- **Backdrop**: the accepted reactor core pick `reactor-core/core.1`, unchanged, only scaled and
  cropped.
- **The numbers** are the A+ mock's placeholders: HP 279 / 205 / 150 / 77, and Tail Laser damage
  74 and 73, which sit inside the derived range in `research/ff7-guard-scorpion.md` §9. Braver's
  damage is not shown, because it is not sourced.
- **HUD**: the A+ layout and its PR7 Line glyphs, reused unchanged from
  `../ff7-hud-2026-09-27/a-plus/src/`. The only additions are the extras listed above. Braver shows
  the Limit gauge still full at the moment of release, which is a presentation choice.

## What it would take to make it real in the game

The HUD extras are cheap: they are CSS on the existing Ink & Gold / FF7 HUD port, namely the sheen,
the outer glow, the row glow, the blazing gauge, the digit glow and the bounce arc. The scene
extras map onto the Three.js presenter like this:

- **Bloom and god rays**: a bloom pass plus a radial-blur light-shaft pass, occluded by the sprites'
  alpha. The phone needs a lower quality tier.
- **Wet floor**: flip the billboards into a planar reflection under the floor line, rippled by a
  noise texture.
- **Heat shimmer and haze**: a screen-space distortion pass driven by a scrolling noise texture.
- **Motes**: instanced GPU points.
- **Rim light and tinted shadows**: a sprite shader that finds the alpha edge facing a light
  direction and tints the shaded side. Contact and cast shadows are projected sprite quads.
- **Depth of field**: pre-blurred backdrop layers. This is cheaper than true depth of field and
  looks the same here.
- **Tail Laser**: an additive beam mesh with a scrolling shader, spark particles, a scorch decal, a
  lens flare, and a flash made by pushing the exposure in post.
- **Braver**: a ribbon mesh for the arc, a speed-line overlay, ring meshes with the same distortion
  pass, and debris particles.

Before any of this is built:

1. Approved right-facing paintings of Cloud and Barret. Barret's gun arm needs fixing, and Braver
   needs a painted leap pose.
2. A decision on the mirrored Guard Scorpion, or a left-facing painting.
3. A reduced-flash setting. The Tail Laser flash and the Braver impact are photosensitivity risks.
4. A frame-time budget on the phone.

As with every screen, Bailey picks or mixes these options first (hard rule 9). Nothing gets built
until then.

## Reproduce

1. Cut out the two pilots:
   `D:/Tools/ComfyUI/python_embeded/python.exe -s tools/gen/rembg.py --in <p1.full.png> --out <work>/cloud.png --margin 8`,
   and the same for Barret into `<work>/barret.png`.
2. Build the scene layers: `python src/frames.py <work> f1 f2 f3 p2`. This writes
   `scene-<id>.png` and `scene-<id>.json`.
3. Add the HUD: `PYREFLY_BROWSER=gpu node src/render.mjs <work> f1 f2 f3 p2`. This is one headless
   Chromium run with no server, and it writes `frame-<id>.png`.
4. Export JPEG at quality 92.
