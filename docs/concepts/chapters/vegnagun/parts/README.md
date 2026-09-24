# Vegnagun parts: options for the placeholder Bulwarks, Redoubts and Nodes

**Game case: FFX-2 only** (Chapter 5, Vegnagun). This fixes round-09/10 **PR-0095**: the Bulwark, Redoubt and Node are drawn as hooded cones. It also covers **PR-0015**, the green tail tip.
**State:** options only. Nothing under `src/`, `public/art` or `docs/target/` was changed. Bailey picks per row (AGENTS.md rule 9).

- `options.jpg` is the sheet. It has one row per part and four columns: Now, A, B and C.
- `assets.jpg` shows the part cut-outs on their own.
- `<part>-now|a|b|c.jpg` are the full 1600x900 frames.

## What the research says each part is

From `research/ffx2-vegnagun-shuyin.md`:

| Part | Quote | Where |
|---|---|---|
| Bulwark (R/L) | Scan: "Vegnagun's foreleg. Attacks and casts support magic; built to retaliate against anyone who strikes the core." | §3.3 |
| Bulwark | "damage all characters in a 5 meter radius around it" (SinirothX, verbatim); "Draw the 5 m radius as a ground decal" | §3.3, §4.3 |
| Redoubt (R/L) | "two pairs of tusks — the tusks are the Redoubts you fight." | §10.1 |
| Redoubt | "Red — glowing eyes and sensor pods clustered along the head and the Redoubt housings." | §10.1 |
| Node A/B/C | "Nodes hang far overhead" | §2 |
| Node A/B/C | "the Nodes are physically distant. Only long-range attacks can touch them." Anchors are at y +9 / +10.5 m | §3.2, §4.3 |
| Node | Colour cycle RED → GREEN → YELLOW (the colour state machine) | §3.2 |
| Palette | Body, leg and tail: "cold steel grey to off-white"; head "gunmetal to blue-black" | §10.1 |

## How the parts are wired today (read only)

- The sprite keys are `vegnagun-bulwark` (`src/data/ffx2/enemies/vegnagun-body.ts:31`), `vegnagun-redoubt` (`vegnagun-head.ts:48`) and `vegnagun-node` (`vegnagun-leg.ts:32`).
- None of these keys has a folder under `public/art/characters/`, so `PaintedActor` draws its placeholder figure.
- The parts stand on `ENEMY_SLOTS` 1 to 3 in `src/scenes/farplane.ts:132`. That is a ground row beside the owner. The research puts the Nodes overhead (§4.3), so the Nodes are also placed wrong, not only unpainted.

## The "approved painting"

- The only Vegnagun entry in `docs/target/approved-hashes.json` is the chapter-5 pause plate, `pause/ch5-ffx2-vegnagun-shuyin`. It shows Yuna as Songstress, not the machine.
- The machine exists only as the shipped art3 part paintings (`vegnagun-tail|leg|body|head/idle.png`). Their handoff, `docs/handoff/art3-x2-bosses.md`, calls them "approved idles". They have no board tile or hash, so **these options derive from the shipped paintings, which Bailey has not confirmed**.

## The options

- **A: from the paintings' own pixels.** No GPU.
  - **Bulwark:** the body painting's two forelegs, cut out with a polygon mask and the cut edges shaded as joints.
  - **Redoubt:** the head painting's tusk.
  - **Node:** the leg painting's red orb. A spike that crossed its left half was repainted from its own mirrored right half. Green and yellow are hue shifts.
  - **Tail tip:** the green blade recoloured to steel from its own luminance.
- **B: new paintings conditioned on the approved ones.** `tools/gen/comfy.mjs boss --img2img <cut A> --nonBiped`.
  - Denoise was 0.55 for the Bulwark and Redoubt and 0.72 for the Node's bezel.
  - Matted with a border flood-fill, limited by the A mask.
  - I looked at a pilot Redoubt render before the batch.
- **C: no separate figure.**
  - **Node:** this C is research-backed ("far overhead"). The HUD bars and the intent card already carry the Nodes. The mock adds an arrow and name at the top edge.
  - **Bulwark and Redoubt:** off-screen is **not** supported. The Bulwark counter is positional, and the Redoubts are real targets. **C\*** is shown instead: rings on the parent painting's own forelegs or tusk. The Left Redoubt ring is a guess, because the painting shows one tusk.

## How it was made

**Captures.** `.vegparts3-capture-tmp.mjs` (scratch) ran a local `vite --port 5592`, then:

1. Chromium with the GPU on, at 1600x900.
2. `gotoChapter('ffx2-vegnagun-shuyin', {auto:'intended', seed:1, speed:'fast'})`.
3. Auto-play paused on each link.
4. The screenshot was taken with the placeholders hidden, plus the actors' projected head, chest and feet.

**Compositing.** Parts are drawn under the real HUD using hand-measured HUD boxes. `hud:off` also reframes the camera, so a HUD-on/off difference could not be used. The parts get a light violet grade and a contact shadow.

**GPU use.** About 2 GPU minutes of the 45-minute cap: 8 images at 9 to 27 s each. Before each prompt, the queue had been empty for 3 minutes. Two things failed:

- `IPAdapterAdvanced` failed with `HostBuffer.read_file_slice failed` while **C: had 0 bytes free**, so B uses img2img without `--ref`.
- `rembg` failed on the Node render.

## Questions for Bailey

1. Pick A, B or C per part. Mixing is fine: for example, Node C with Bulwark A.
2. Should the shipped Vegnagun part paintings (tail, leg, body, head) be treated as the approved reference? Right now nothing pins them.
3. If you pick A or B for the Nodes, should they move overhead as §4.3 says, or stay on the ground row?
