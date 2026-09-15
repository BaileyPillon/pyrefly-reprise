# Art pipeline

How the painted 2.5D art for Pyrefly Reprise gets made: a local ComfyUI running
an anime-tuned SDXL checkpoint, driven by `tools/gen/comfy.mjs`, cut out with
rembg, and dropped into `public/art/` under fixed conventions the engine reads.

Nothing here touches the network at runtime. Generation is an offline authoring
step; the game only ever loads the finished PNGs that land in `public/art/`.

---

## 1. The local stack

| Piece | Where | Notes |
| --- | --- | --- |
| ComfyUI (portable) | `D:\Tools\ComfyUI\` | v0.35.0, bundled CUDA torch |
| Embedded python | `D:\Tools\ComfyUI\python_embeded\python.exe` | **use this, never the system python** |
| Checkpoint | `...\ComfyUI\models\checkpoints\animagine-xl-4.0-opt.safetensors` | Animagine XL 4.0 Opt, CreativeML Open RAIL++-M |
| Upscaler | `...\ComfyUI\models\upscale_models\RealESRGAN_x4plus.pth` | BSD-3-Clause |
| Cutout | `rembg` in the embedded python | `isnet-anime` weights cached in `D:\Tools\ComfyUI\rembg-models` |
| Output scratch | `D:\Tools\ComfyUI\output\` | raw renders; the repo only keeps the chosen ones |

The machine's system Python 3.14 is **not** used by any of this. Every python
invocation in the pipeline goes through `python_embeded\python.exe -s`.

### Start ComfyUI

```cmd
D:\Tools\ComfyUI\start-comfy.cmd
```

It binds `127.0.0.1:8188` only. Wait for it to answer:

```bash
curl -s http://127.0.0.1:8188/system_stats
```

To run it detached (so it outlives a terminal or an agent session):

```powershell
Start-Process -FilePath "D:\Tools\ComfyUI\start-comfy.cmd" `
  -WorkingDirectory "D:\Tools\ComfyUI" -WindowStyle Hidden
```

### Stop ComfyUI

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*ComfyUI\main.py*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

The web UI at <http://127.0.0.1:8188/> is useful for eyeballing a prompt by
hand, but everything reproducible goes through the CLI below.

---

## 2. The style prompt contract

**This is the part that matters.** A cast only looks like a cast if every
character is rendered through the same style and quality blocks. Those blocks
live in exactly one place — the exported constants at the top of
`tools/gen/comfy.mjs`:

```js
export const STYLE_TAGS   = 'official art, cel shading, soft shading, vibrant colors, rim lighting, colorful, detailed';
export const QUALITY_TAGS = 'masterpiece, high score, great score, absurdres';
export const CHARACTER_COMPOSITION = 'full body, standing on ground, simple background, white background';
```

Two tags were tried on a fixed seed and deliberately **rejected** — don't add
them back without re-testing:

| Tag | Why it's out |
| --- | --- |
| `clean lineart` | Pulls toward flat inked manga: big dead black fills, desaturated skin and clothing. Wrong for painted 2.5D. |
| `painterly` | Renders the figure beautifully, but sprays paint-splatter around it. rembg keeps the splatter as opaque content, so the cutout gains confetti and `baselineY` lands under a blob instead of the feet. |

Rules:

1. **Never** pass style or quality tags through `--tags`. `--tags` is identity
   only (who this is); `--poseTags` is action only (what they're doing). The
   generator appends composition, style and quality itself.
2. If the style has to change, change it in `comfy.mjs` and **re-render the
   whole cast**. A roster half in the old style and half in the new one is
   worse than either style.
3. The negative prompt is likewise shared (`BASE_NEGATIVE`), and includes the
   multi-subject bans (`multiple views, 2girls, 2boys`, …) that otherwise turn
   a sprite sheet into a group photo.

### Tag ordering (Animagine XL 4.0)

The checkpoint was trained with tag-ordered captions. The model card's template:

```
1girl/1boy/1other, character name, series, rating, everything else, quality tags
```

So `--tags` should start with the subject count and read like a Danbooru post:

```
1boy, tidus, final fantasy x, safe, solo, blonde hair, spiky hair, blue eyes, ...
```

Two things people get wrong here:

- **Score tags, not aesthetic tags.** Animagine 4 responds to
  `masterpiece, high score, great score, absurdres`. The v3.1-era
  `very aesthetic, best quality` block is inert on this checkpoint — it was
  retrained from SDXL base with a different quality vocabulary.
- **Escape parentheses.** `brotherhood (sword)` and `yuna (ff10)` are literal
  Danbooru tags, but bare parens are *emphasis syntax* to CLIP. The generator
  escapes them for you (`escapeTags`), so write them naturally; just don't
  double-escape.

Recommended sampler settings come from the same card and are the CLI defaults:
**28 steps, CFG 6 (card says 4–7), Euler Ancestral**.

---

## 3. Generating

### Characters

```bash
node tools/gen/comfy.mjs character \
  --name tidus \
  --tags "1boy, tidus, final fantasy x, safe, solo, blonde hair, spiky hair, blue eyes, yellow hooded vest, black shorts, holding sword" \
  --pose idle \
  --poseTags "fighting stance, sword resting on shoulder, looking at viewer, confident smile" \
  --out public/art/characters/tidus/idle.png \
  --batch 3
```

What happens:

1. txt2img at **832×1216** (the card's 2:3 portrait bucket), seed derived from
   `sha256("<name>:<pose>")` so a re-run reproduces the same character.
2. The raw render is saved beside the target as `idle.raw.png`.
3. `tools/gen/rembg.py` removes the background with `isnet-anime`, crops to the
   alpha content with a 16 px margin, and reports the crop box.
4. A sidecar `idle.json` records `{width, height, baselineY, seed, prompt, …}`.

`--batch 3` writes `idle.1.png`, `idle.2.png`, `idle.3.png` (plus sidecars) with
consecutive seeds. Review them, then copy the winner to `idle.png` and delete
the rest. **Judge on costume accuracy first** — the model knows the characters,
but it drifts on outfit details more than on faces.

Flags: `--seed`, `--steps`, `--cfg`, `--batch`, `--margin`, `--width`,
`--height`, `--sampler`, `--scheduler`, `--composition`.

### Portraits

Portraits use the *same* preset and therefore the same style and quality
blocks — only the framing block swaps, via `--composition portrait`:

```bash
node tools/gen/comfy.mjs character --name tidus --composition portrait \
  --tags "1boy, tidus, final fantasy x, safe, solo, blonde hair, ..." \
  --pose portrait --out public/art/portraits/tidus.png --batch 3
```

Do not try to get a portrait by writing `close-up` into `--poseTags` while the
default `full body, standing on ground` framing is still applied — the two
fight each other and you get a mid-shot with cropped feet.

### Backdrops

```bash
node tools/gen/comfy.mjs backdrop \
  --name gagazet \
  --tags "snowy mountain pass at night, jagged cliffs, blizzard haze, cold blue moonlight, final fantasy x mt gagazet" \
  --out public/art/backdrops/gagazet.png
```

txt2img at **1344×768**, then RealESRGAN ×4 → `ImageScaleBy 0.5` for a net 2×,
landing at **2688×1536**. The backdrop preset forces `no humans, scenery` and
bans people in the negative, because a stray adventurer in the backplate ruins
the parallax illusion the moment a real sprite walks in front of them.

### Contact sheets

```bash
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/sheet.py build --spec <spec>.json
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/sheet.py thumb --in a.png --out b.png --width 1600
```

The sheet builder bottom-aligns character cells on a shared ground line using
each sprite's `baselineY`, so the sheet doubles as a check that the whole cast
stands on the same floor.

---

## 4. File conventions

The engine resolves art by convention — no manifest to keep in sync.

```
public/art/
  characters/<id>/<pose>.png     transparent cutout, variable size
  characters/<id>/<pose>.json    sidecar: width, height, baselineY, seed, prompt
  backdrops/<scene>.png          2688x1536 opaque
  backdrops/<scene>.json         sidecar: seed, prompt
  portraits/<id>.png             head-and-shoulders, for dialogue/menus
```

- `<id>` is lowercase kebab: `tidus`, `yuna`, `seymour-flux`.
- `<pose>` is one of `idle`, `attack`, `cast`, `hurt`, `ko`, `victory`.
- **`baselineY` is the contract.** It is the bottom row of opaque pixels in the
  cropped PNG — the character's feet. The renderer plants a sprite by aligning
  `baselineY` to the ground plane, *not* the bottom of the image, which is why
  the 16 px crop margin doesn't make everyone float.
- `*.raw.png` files are the pre-cutout renders. They are debugging aids; they
  are not shipped and should stay out of `public/` in a final build.

---

## 5. Judging a batch

The failure modes worth rejecting on, in order:

1. **Wrong costume.** The most common drift. Tidus loses the asymmetric black
   pattern on the yellow vest, or gains a symmetric pair of shorts legs.
2. **Extra subjects.** Two characters, or a mirrored "multiple views" sheet,
   despite the negative. Reroll the seed.
3. **Cropped limbs.** `full body` plus the 2:3 bucket usually holds, but a
   raised-sword pose can clip at the top. Reroll or drop the arms in the pose
   tags.
4. **Bad cutout.** Check the `.png`, not the `.raw.png` — thin weapons and hair
   spikes are where `isnet-anime` gives up. If the blade is eaten, re-run the
   cutout with a lower `--alpha-threshold`.
5. **Flat backdrop.** No depth cue, no light direction. Add an explicit light
   source and a foreground occluder to the scene tags.

---

## 6. Licensing

- **Animagine XL 4.0 Opt** — CreativeML Open RAIL++-M. Permits commercial and
  non-commercial use with use-based restrictions; the restrictions must travel
  with any redistribution of the model. We redistribute generated images, not
  the weights.
- **RealESRGAN_x4plus** — BSD-3-Clause.
- **ComfyUI** — GPL-3.0.

This project is an unofficial fan tribute. Final Fantasy characters and settings
are property of Square Enix; generated likenesses inherit that and are not
cleared for commercial use.
