# Cavern of the Stolen Fayth backdrop: production (2026-09-24), CANDIDATE

**Game case: FFX only.** This is the backdrop for Lady Ginnem's Yojimbo (Chapter IX, B1). No FFX-2 chapter uses it. **It is a candidate.** It is self-judged, not in `approved-hashes.json`, and not wired to any scene: `src/scenes` belongs to the other workflow.

- **Pick:** chamber option A "cold" (O-4). Bailey, 2026-09-24: "All your recommendations".
- **File:** `public/art/backdrops/cavern-stolen-fayth.png`, with its sidecar `.json` beside it. A copy of the sidecar is `chamber.sidecar.json`.
- **Size:** 2688x1536, opaque. This is the size and format of every chapter backdrop: one painted plate. The scene builds the floor and depth layers in 3D (Macalania precedent).
- **sha256:** `cfdfe552d083bb05828a9d9fae8ea5400ae3cb2e106845b60418b8cda81b93a3`
- **Sheet:** `chamber.jpg`
- **Under the HUD:** `chamber-hud-1600.jpg` and `chamber-hud-390.jpg`

## Method r3: derive from the picked pixels

The picked render (`backdrop-a3`, seed 901103) was already 2688x1536. Two repairs were made, and 1.42 % of the pixels changed.

1. **Teleport pad added.** Research §6.1: "a large open cave room with a **teleport pad in the middle** (dormant until after the battle)" `[verified: 2 sources]`. None of the options showed a pad.
   - I blocked it in by hand from the floor's own colour and grain (`scripts/chamber/prefill.py`).
   - Then one masked latent inpaint ran on a 1024x512 crop: denoise 0.36, seed 930201, Animagine XL 4.0 Opt (`scripts/chamber/pad-inpaint.json`). It was pasted back through the feathered mask only.
   - A first batch at denoise 0.5 (930101-104) invented two discs, a machine and a square. It was dropped.
   - The pad sits in the daylit floor patch. In plate pixels its centre is (1540, 1394), with radii 225 x 44 and a 12 px rim. It is dormant and unlit. The glow after the battle should be a scene effect at that centre, not paint.
   - It is our design: the sources place the pad but do not describe it.
2. **Floating rock removed.** A diamond-shaped rock hung in mid-air at x 338-402, y 430-560. It was replaced by a harmonic fill from the surrounding wall plus the wall's own grain. No GPU was used.

**For the scene wiring:** the painted floor fills roughly the bottom 20 % of the plate (the far edge is near y 1240), and the daylit patch covers x 1260-1780, y 1340-1440.

## HUD composites (flat PIL, not an engine render)

- **Party:** the engine's own party layer, taken from Chapter I at 1600x900 and at 390x844 (difference matte; post passes off for that layer only).
- **Yojimbo:** the installed `yojimbo-cavern` idle at 2.55 world units (INSTALLED.md estimate).
- **HUD:** the live HUD layer on top. It is Chapter I's HUD, so it names Chapter I's enemies.
- **Plate placement:** the whole plate is shown, with no stand-in floor. The real framing belongs to the scene.
- **Daigoro** was left out.

## Found, not fixed

At 390x844 the HUD is the desktop layout scaled down, which makes it very small. This is not a backdrop issue.
