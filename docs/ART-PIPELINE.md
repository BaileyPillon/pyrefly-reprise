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
| IP-Adapter node | `...\ComfyUI\custom_nodes\ComfyUI_IPAdapter_plus` | cubiq, GPL-3.0. This is what `--ref` runs on |
| IP-Adapter weights | `...\ComfyUI\models\ipadapter\ip-adapter-plus_sdxl_vit-h.safetensors` | h94/IP-Adapter, Apache-2.0 |
| CLIP-Vision | `...\ComfyUI\models\clip_vision\CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` | h94's `models/image_encoder/model.safetensors`, **renamed** |
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

### Installing the reference-consistency stack (one-off, already done)

```bash
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus \
  D:/Tools/ComfyUI/ComfyUI/custom_nodes/ComfyUI_IPAdapter_plus

curl -L -o D:/Tools/ComfyUI/ComfyUI/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors \
  https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors

curl -L -o D:/Tools/ComfyUI/ComfyUI/models/ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors \
  https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/ip-adapter-plus_sdxl_vit-h.safetensors
```

**The clip_vision filename is not cosmetic.** The file on the Hub is called
`model.safetensors`; ComfyUI lists `models/clip_vision/` by filename, and both
this doc and `comfy.mjs` name it
`CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` — which is what those weights
actually are. Save it under another name and the workflow fails validation with
an unhelpful enum error naming every file in the folder except the one you
wanted.

Custom nodes are only scanned at boot, so restart ComfyUI and check it took:

```bash
curl -s http://127.0.0.1:8188/object_info | grep -o '"IPAdapterAdvanced"'
```

Nothing back means the node did not load — read ComfyUI's console, it prints
the import traceback there and nowhere else.

---

## 2. The style prompt contract

**This is the part that matters.** A cast only looks like a cast if every
character is rendered through the same style and quality blocks. Those blocks
live in exactly one place — the exported constants at the top of
`tools/gen/comfy.mjs`:

```js
export const STYLE_TAGS   = 'official art, cel shading, soft shading, vibrant colors, rim lighting, colorful, detailed';
export const QUALITY_TAGS = 'masterpiece, high score, great score, absurdres';
export const CHARACTER_COMPOSITION = 'full body, standing, feet visible, simple background, white background';
export const FACING_PHRASES = { right: '(from side:1.3), three-quarter view, body facing right, (looking at viewer:1.2)', /* ... */ };
```

**The composition block lost its camera phrase in v3** (2026-09-17): the leading
`straight-on` moved into `FACING_PHRASES`, and `compositionFor()` puts a facing
phrase back on the front of whichever framing block you asked for. §2a is the
whole story. The framing blocks are otherwise unchanged.

**The composition block moved in v2** (2026-09-15). The proof-of-concept round
closed with the observation that about one variant in three was framed usably
and that the misses were nearly always *camera* — bird's-eye, or a hard dutch
tilt — rather than costume. `straight-on, feet visible` is that experiment,
adopted. `standing on ground` lost its "on ground" because the phrase kept
summoning a textured floor plane into what is supposed to be a flat white
cyclorama. Style and quality tags did **not** change.

Everything rendered before this change is in the old framing.
`tools/gen/cast.json` is the work order for the re-render.

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
4. Sprites carry a second negative block on top, `SPRITE_NEGATIVE`
   (`paint splatter, ink splash, colorful background, abstract background`).
   `motion lines` and `action pose` in a pose prompt reliably spray a coloured
   swirl around the figure on this checkpoint — the same failure that got
   `painterly` struck from the style block. It is not just ugly: rembg keeps
   every opaque swirl, so the crop box comes back as the whole 832×1216 frame
   and `baselineY` lands on a ribbon of paint instead of a boot. Backdrops
   deliberately do *not* inherit it — `chapter-select` is supposed to be an
   abstract coloured field.

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

## 2a. Facing contract (v3)

**Every sprite that stands on a battlefield faces its enemy.** v2 rendered the
whole roster `straight-on`, which looked fine on a contact sheet and wrong the
moment two of them were put in a scene: the party and the boss face each other
across the field, and both of them were staring down the camera instead.

The party stands on the **left** and fights rightward; enemies stand on the
**right** and fight leftward. So:

| Subject | `--facing` | What the art shows |
| --- | --- | --- |
| Party, dresspheres, allies | `right` | body angled ~45° toward the RIGHT edge |
| Bosses, enemies, aeons | `left` | body angled ~45° toward the LEFT edge |
| Portraits | `none` | v2 `straight-on`; a HUD head-shot meets the player's eye |

A frontal face turned toward the viewer is wanted — the head has to stay
readable, because the blind judge has to name the character unaided. A flat 90°
profile is a **reject**, not a near-miss: it loses the face, and a flat cutout
in profile reads as cardboard on the battlefield.

`--facing` is a preset default (`character` → right, `boss` → left,
`--composition portrait` → none), so a cast row that says nothing still gets the
right one. `tools/gen/cast.json` states it explicitly on all 70 battlefield
subjects anyway.

```bash
node tools/gen/comfy.mjs character --name tidus --facing right ...
node tools/gen/comfy.mjs boss      --name yunalesca-1 --facing left ...
```

### The phrasing, and why each piece is in it

```js
FACING_PHRASES.right = '(from side:1.3), three-quarter view, body facing right, (looking at viewer:1.2)';
FACING_NEGATIVE      = 'facing viewer, front view, straight-on, symmetrical, from behind, facing away';
```

- `(from side:1.3)` — the only token that actually turns the body. **The
  emphasis weight is the whole trick.** Twenty-one unweighted renders across
  seven phrasings came back frontal, because a named character's prior *is*
  their straight-on official art and a bare camera tag does not outvote it.
- `three-quarter view` — does nothing alone, but stops the weighted `from side`
  flattening into a profile.
- `(looking at viewer:1.2)` — not optional. Without it the body keeps rotating
  past profile into a back view.
- `body facing right` / `left` — **decorative, and not to be trusted.** Two runs
  differing in that one word produced the same images pair by pair. SDXL's text
  encoder has no reliable left/right grounding.
- The negatives are half the recipe; the generator appends them automatically
  whenever `--facing` is not `none`. They are deliberately **not** applied to
  `--composition prone` — banning `facing viewer` on a figure already drawn
  `from side, eyes closed` rolls it face-down into the floor.

The full A/B table — fourteen phrasings, three fixed seeds, plus the boss mirror
check on Yunalesca — is `docs/handoff/art3-contract.md`.

### Direction is fixed in post, not in the prompt

The checkpoint has a bias and the bias is **frame-left**. That is already what
enemies want, so `--facing left` mostly lands first time; `--facing right` mostly
does not, and is mirrored afterwards:

```bash
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/flip.py \
    public/art/characters/tidus/idle.png --set-facing right
```

`flip.py` mirrors the PNG and fixes the sidecar: `cropBox` is mirrored inside the
source canvas, `flipped: true` records that the seed no longer reproduces the
file, and `width`/`height`/`baselineY` are untouched — a horizontal mirror moves
no row, and `baselineY` is a row. **Pass `--set-facing`**: the `facing` the
generator writes is what was *requested*, and this script exists precisely
because the render often ignores the request.

**Do not mirror a chiral subject — reroll instead.** Auron's coat is off his
**left** shoulder with that sleeve hanging empty; Kimahri's broken horn is one
specific horn; legible text and asymmetric insignia become nonsense mirrored.

### `--ref` does not carry facing

`--ref` buys identity, not direction. Six referenced `tidus attack` renders
against a facing-**right** idle, at `--refStart` 0.0 / 0.25 / 0.35, all came back
facing frame-left. Facing is decided in the first steps of the denoise, which is
exactly the window `--refStart 0.25` keeps the adapter out of — and moving the
adapter into that window buys a duplicated sword, not a direction. Keep the
defaults (`0.65 / 0.25 / 0.85`), and judge and mirror a referenced state exactly
as you would an idle. Mirror an idle *before* referencing it, so the reference,
the sidecar and the intent all agree.

### KO poses keep their orientation

A downed figure lies with its head toward the enemy it lost to — head-right for
the party, head-left for enemies — so the body reads as having fallen *into* the
fight. `--composition prone` swaps in a different phrase table for that
(`head to the right, feet to the left`), because `body facing right` on a lying
figure summons someone flat on their back and `looking at viewer` fights the
`eyes closed` already in the prone block.

### Judging order changed

**Facing is judged first, before costume.** A good render pointing the wrong way
is one `flip.py` from being right; no other defect in §6 is.


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
`--height`, `--size`, `--sampler`, `--scheduler`, `--composition`, `--facing`,
`--facingPhrase`, `--negAdd`, `--ref`, `--refWeight`, `--refStart`, `--refEnd`,
`--refWeightType`, `--refScaling`, `--img2img`, `--denoise`.

`--size WxH` is shorthand for `--width`/`--height`, and rejects anything that
is not a multiple of 8 — SDXL's VAE strides by 8, and other values round
silently and shift the framing.

`--composition` now takes `full | portrait | prone | boss`, and `--facing` takes
`right | left | none` (§2a). `--facingPhrase "..."` overrides the phrase table
for an A/B on a fixed seed; nothing in the cast manifest uses it.

### Reference consistency — `--ref`

The proof-of-concept generated every pose independently, and it showed: each
render drifted toward a slightly different Tidus. `--ref` pins the identity to
an image you have already approved.

```bash
node tools/gen/comfy.mjs character --name tidus \
  --tags "1boy, tidus, final fantasy x, safe, solo, blonde hair, ..." \
  --pose cast --poseTags "raising hand, arm up, casting spell, magic, glowing magic circle" \
  --ref public/art/characters/tidus/idle.png \
  --out public/art/characters/tidus/cast.png --batch 3
```

The reference is copied into ComfyUI's `input/` folder (LoadImage takes a
filename, not a path) and **flattened onto white** on the way — our sprites are
cutouts, LoadImage hands CLIP-Vision the RGB channels and routes alpha to a
MASK output nobody connected, and the RGB under a transparent pixel is rembg's
dark fringe. Un-flattened, the adapter sees a character in a black void and the
black leaks into the render.

**Generate `idle` first, pick a keeper, then point every other state at it.**
That is what the `refState` field in `cast.json` records.

#### The settings, and why they are what they are

| Flag | Default | What it does |
| --- | --- | --- |
| `--refWeight` | `0.65` | How hard the reference pulls |
| `--refStart` | `0.25` | When it switches **on**, as a fraction of the denoise |
| `--refEnd` | `0.85` | When it switches **off** |
| `--refWeightType` | `linear` | IP-Adapter weight curve |
| `--refScaling` | `K+V` | How the embeds are applied |

`--refStart`, not `--refWeight`, is the flag that makes this usable, and it is
not the one you reach for first. Tuned on Tidus, fixed seed, the `attack`
prompt against his approved `idle`:

- **weight 0.65, start 0.0** — the pose prompt was ignored. The render came
  back in the idle's planted stance with the legs cropped, and the whole image
  turned glossy: chrome highlights, rainbow gradients on the blade, cel shading
  gone.
- **weight 0.45, start 0.0** — the same failure, slightly quieter. Weight was
  not the variable.
- **start 0.0, end 0.4** — cutting the adapter off early changed nothing about
  the pose. Composition is decided in the *first* steps; by the time you switch
  it off, the damage is done.
- **start 0.25** — the prompt lays the figure out unassisted, the adapter
  switches on once a pose exists, and it lands the face, hair and costume on
  top of it. This is the fix.

Two different mechanisms, needing two different flags:

1. **Pose capture** happens at the *start* of the denoise. Cure with
   `--refStart`.
2. **Material bleed** happens at the *end*. The adapter carries the
   reference's local surfaces and not just its identity — Tidus's idle handed
   every later pose its iridescent blade and red-and-blue shoulder plate as an
   all-over gloss. Cure with `--refEnd`; the default 0.85 hands the last steps
   back to the checkpoint and the style tags.

And the caveat that is easy to miss: **`--ref` propagates the reference's
mistakes too.** The approved Tidus idle wears an armoured forearm that is not
canon, and every `--ref` render inherits it. That is the deal — consistency is
consistency — so be fussier about an `idle` than about any other frame in the
set, because the whole character is downstream of it.

For a *variant* of an existing subject (Shuyin from Tidus, the X-2 Bahamut from
the FFX one) drop to about `0.45` and let the tags do the recolouring. At 0.65
the reference's palette arrives with the face.

### img2img — `--img2img`

The blunter fallback, for a form so far from anything the checkpoint knows that
no prompt reaches it:

```bash
node tools/gen/comfy.mjs boss --name seymour-flux-body \
  --tags "..." --img2img sketch.png --denoise 0.55 \
  --out public/art/characters/seymour-flux-body/idle.png
```

It starts from the pixels of the given image instead of from noise and redraws
them at `--denoise` — 0.55 keeps the silhouette and repaints everything else;
lower keeps more, higher keeps less. The init image is scaled to the target
bucket first, because `VAEEncode` will not resize for you. `--ref` and
`--img2img` compose: a rough pose sketch for the layout, an approved idle for
the identity.

### Bosses

```bash
node tools/gen/comfy.mjs boss --name mortiorchis \
  --tags "no humans, floating skull, skeletal machine, insect, mandibles, ..." \
  --negAdd "1girl, 1boy, human, face, person" \
  --out public/art/characters/mortiorchis/idle.png --batch 3
```

Same style contract, same cutout, same sidecar as `character`. It differs only
in its defaults: **1216×832** landscape and `--composition boss`
(`straight-on, full body, centered, imposing, …`). Bosses are rarely bipeds
standing politely on a floor, so `standing, feet visible` is wrong for them and
actively fights forms like Yu Yevon or Vegnagun.

Pick the canvas per subject — `cast.json` carries one in `sizeHint`:

| Shape | `--size` | Examples |
| --- | --- | --- |
| Wider than tall | `1216x832` (default) | Mortiorchis, Ixion, Valefor, Vegnagun's tail |
| Square-ish | `1024x1024` | Ifrit, Bahamut, Braska's Final Aeon, Yu Yevon |
| Tall | `832x1216` | Anima, Shiva, Yunalesca 1, Vegnagun's leg |

`--negAdd` matters more here than anywhere else, because boss names collide
with plain English once CLIP has them: `pagoda` renders an entire Japanese
temple in a landscape unless you ban buildings, and `core` and `flux` drift the
same way.

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
# the proof-of-concept sheet -> docs/screenshots/04-art-poc-sheet.png
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/sheet.py build \
  --spec tools/gen/sheet-poc.json --root .

# one image, downscaled, for sending on its own
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/sheet.py thumb \
  --in public/art/backdrops/gagazet.png --out docs/screenshots/concept-gagazet.png --width 1600
```

The sheet builder bottom-aligns character cells on a shared ground line using
each sprite's `baselineY`, so the sheet doubles as a check that the whole cast
stands on the same floor. `tools/gen/sheet-poc.json` is the committed spec —
add rows to it as the cast grows rather than building sheets by hand.

---

## 4. The cast manifest

`tools/gen/cast.json` is the work order for the whole roster: 72 subjects — the
FFX party, the FFX and X-2 bosses, the aeons, the X-2 dresspheres, four
backdrops and twenty portraits — each with its identity tags, its states, its
framing and its canvas.

Nothing reads it at runtime. It exists so that a generation session is "work
the list" rather than "reinvent Auron's coat from memory", and so that two
people rendering two different characters produce two characters that belong in
the same game.

```jsonc
{
  "id": "auron",
  "kind": "party",
  "cmd": "character",          // which comfy.mjs preset
  "composition": "full",
  "sizeHint": "832x1216",
  "refState": "idle",          // generate this first, --ref the rest at it
  "tags": "1boy, auron (ff10), final fantasy x, safe, solo, ...",
  "states": {
    "idle": { "poseTags": "standing, arm in sleeve, katana held low, ..." },
    "ko":   { "poseTags": "...", "composition": "prone", "sizeHint": "1216x832",
              "ref": "auron/idle" }
  },
  "notes": "The coat worn off the left shoulder with the arm inside the sleeve is the silhouette..."
}
```

Style and quality tags are deliberately **not** in this file. They live in
`comfy.mjs` and the generator appends them, so a cast row physically cannot
drift from the house style. `tags` is identity; `poseTags` is action.

The `notes` field is the reason the file is worth keeping in the repo. It is
where "the belt skirt is a stack of individual leather belts, not a pleated
skirt" and "write `animal ears (costume)`, or the model commits to a
kemonomimi girl" get written down the first time somebody loses an hour to
them.

A few conventions inside it:

- **KO states** carry `"composition": "prone"` and `"sizeHint": "1216x832"`.
  A body lying down wastes two thirds of the portrait bucket.
- **Boss forms are separate subjects** (`yunalesca-1/-2/-3`), each `--ref`'d at
  the one before it, so a transformation reads as the same character.
- **Seymour Flux is split in two** — `seymour-flux-body` and `mortiorchis` —
  and composited by the engine. See §7.

---

## 5. File conventions

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
  cropped PNG. The renderer plants a sprite by aligning `baselineY` to the
  ground plane, *not* the bottom of the image, which is why the 16 px crop
  margin doesn't make everyone float.

  > **Caveat — `baselineY` is the lowest *pixel*, not the lowest *foot*.**
  > For a pose where something hangs below the feet — a downward-pointing
  > sword, a trailing sash, a cape — the lowest pixel is that prop, so aligning
  > it to the ground plants the blade tip on the floor and floats the
  > character. Two ways to deal with it, in order of preference:
  >
  > 1. **Prefer variants whose feet are the lowest content** when judging a
  >    batch. Usually one of three is.
  > 2. **Hand-correct the sidecar.** `baselineY` is a plain number in a JSON
  >    file; measuring the feet in an image editor and writing that value in is
  >    a thirty-second fix, and nothing regenerates it unless you re-run the
  >    pose.
  >
  > When you do correct one by hand, keep the machine's value alongside it so
  > the edit is obvious and re-runnable:
  >
  > ```json
  > {
  >   "baselineY": 1081,
  >   "baselineYAuto": 1156,
  >   "baselineNote": "Blade points past the feet; 1081 is the boot soles."
  > }
  > ```
  >
  > `public/art/characters/tidus/idle.json` is the worked example — the
  > Brotherhood hangs 75 px below his boots.
  >
  > The `ko` pose is deliberately exempt — a downed character has no feet
  > baseline, and the whole silhouette should sit on the floor.

  A quick way to spot the problem across a whole character: the real body mass
  ends where the widest opaque rows stop. If the lowest opaque pixel sits far
  below that, something is dangling.
- `*.raw.png` files are the pre-cutout renders. They are debugging aids; they
  are not shipped and should stay out of `public/` in a final build.

---

## 6. Judging a batch

The failure modes worth rejecting on, in order:

0. **Wrong facing.** Judged first since v3, and judged in two parts: is the body
   turned at all (a frontal render is a reject), and is it turned the right way.
   A good render pointing the wrong way is not a reject — mirror it with
   `flip.py` (§2a), unless the subject is chiral. An overshoot into a flat
   profile or a back view *is* a reject: the blind judge has to see the face.
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

### Black frames

There is a sixth failure mode that is not a judgement call, because it is not
the model's fault: **the GPU drops into a NaN state and every render comes back
as pure zero**. ComfyUI does not treat this as an error — the sampler runs,
`/history` says success, `SaveImage` writes a normal-looking PNG — so the only
signal is one line in the ComfyUI console:

```
nodes.py:1699: RuntimeWarning: invalid value encountered in cast
```

That is a NaN float tensor being cast to uint8, which gives 0 everywhere. At a
180px thumbnail a black frame is genuinely hard to tell from a dark painting,
which is how two of them reached `public/art/` on 2026-09-18.

**You no longer have to catch these by eye.** `comfy.mjs` decodes every finished
render before it writes it anywhere:

- The check is **maximum RGB sample == 0**, and nothing looser. It is not a mean
  or a percentile, deliberately: `backdrops/` holds legitimately near-black
  night scenes, and any threshold that rejects "dark" would throw those away. A
  real painting always has one non-zero sample; a NaN cast never does. Alpha is
  ignored, so an opaque cutout over dead RGB still trips it.
- A black frame is **never written** — not to `--out`, not to the `.raw.png`,
  not to a candidate slot — and is appended to
  `D:\Tools\comfy-logs\black-frames.log` with the timestamp, prompt id,
  SaveImage prefix and where the file went.
- **ComfyUI's own copy is moved out of the way.** `SaveImage` writes the PNG
  into `D:\Tools\ComfyUI\output\pyrefly\` before this client ever sees the
  bytes, and that is the first folder `art-watch` scans and the folder people
  grab "the latest render" from, so a rejected frame left sitting there gets
  promoted anyway. It is moved (Node `fs`, rename with a copy+unlink fallback
  across volumes) to `D:\Tools\comfy-logs\black-quarantine\` as
  `<stamp>__<subfolder>__<filename>.png`. Quarantined, never deleted — a black
  PNG is evidence about the GPU, and these files are what the two decoders were
  cross-checked against.
- **The check has a fallback, so a bad path cannot switch it off.** The embedded
  python is the authority; when it is missing (wrong `COMFY_ROOT`, moved
  bundle), the pure-JS decoder in `black-frame.mjs` answers instead and the run
  says so once. Only when *both* fail is a render written unverified, and then
  stderr carries a per-render `UNVERIFIED RENDER` line plus a loud once-per-run
  banner. Unverified still means *not black* — the guard fails open on its own
  bugs rather than stopping the fleet — but it is no longer silent.
- The pipeline then **restarts ComfyUI once** (stop the `main.py` python,
  `schtasks /Run /TN PyreflyComfyUI`, wait for `/system_stats`) and resubmits
  the same prompt one time. Restarts are throttled to one per 10 minutes via
  `D:\Tools\comfy-logs\last-black-restart.txt`, because ComfyUI is shared with
  the rest of the art fleet.
- If it comes back black again, or the throttle blocks the restart, the run
  **exits non-zero** and tells the operator the GPU needs attention. It does not
  loop: a GPU that NaNs twice is hardware, not a blip.

The decisions are pure functions in `tools/gen/black-frame.mjs` and are unit
tested in `tests/unit/art-black-frame.test.ts`.

`tools/art-watch.mjs` flags the same thing in the gallery — a red border and a
`BLACK` badge on any tile whose image is all-zero, plus a count in the header —
so a black frame that lands from some other path (a hand-run workflow in the web
UI) is still obvious. It checks **every** tile on the page (80), not a slice of
them: a cold load costs ~0.2s of decode (1.9s on the first read after a reboot,
when the files come off disk too) and every load after that is ~0.15s. A tile
the decoder could not read (16-bit, interlaced, caught mid-write) or did not get
to wears a muted dashed border and a `?` or `…` badge, because the page is only
useful if **no badge means "decoded, has colour"** rather than "nobody looked".
The gallery uses the small pure-JS PNG decoder in
`black-frame.mjs` rather than shelling out to python, because it re-scans every
20 seconds; `comfy.mjs` uses PIL + numpy in the embedded python, because it is
the actual gate and a battle-tested decoder is worth the 1.2s. Both feed the
same `isBlackFrame`, and they were cross-checked against the 15 quarantined
black renders and the healthy roster before shipping.

Operational history, including what the driver was doing at the time, is in
`docs/handoff/art-ops.md`.

---

## 7. What's in the repo now

The proof-of-concept round produced everything below; the v2 pass regenerated
part of it. Sheets: `docs/screenshots/04-art-poc-sheet.png` (v1) and
`docs/screenshots/05-art-v2-tidus-sheet.png` (v2). The three backdrops also
exist as standalone `docs/screenshots/concept-<name>.png` at 1600 px wide.

| Asset | Notes |
| --- | --- |
| `characters/tidus/{idle,attack,hurt,victory}.png` | v1 framing. `idle` is the reference the rest of him is pinned to. |
| `characters/tidus/cast.png` | **v2**, `--ref idle.png`. Replaced the v1 render, which had the Brotherhood floating detached in mid-air behind him. |
| `characters/tidus/ko.png` | **v2**, `--composition prone --size 1216x832`. The v1 `ko` was the crouch the prone block exists to prevent — a curled figure at a 30° tilt that read as falling, not downed. |
| `characters/yuna/idle.png` | Heterochromia and summoner staff both landed. Skirt renders shorter than canon. |
| `characters/seymour-flux/idle.png` | **Not the true Flux form** — see below. |
| `portraits/{tidus,yuna}.png` | `--composition portrait`. |
| `backdrops/{gagazet,zanarkand-dome,farplane}.png` | 2688×1536. |

### What the v2 validation actually showed

Tidus's `attack` was regenerated with `--ref` and the v1 render was **kept** —
the v2 candidates were more consistent with the idle but less accurate to the
character, because they faithfully inherited the idle's non-canon armoured
forearm and gained red leggings with it. `cast` and `ko` were replaced. One
state in three is a fair expectation for a re-render pass, not a disappointment:
`--ref` buys consistency, and consistency is only worth having once the
reference itself is right.

So, in order, before the roster re-render:

1. **Re-shoot Tidus's `idle`** against the v2 composition block and judge it
   harder than anything else. Every other state inherits whatever it gets wrong.
2. Then work `cast.json` top to bottom: `refState` first, `--batch 3`, pick,
   then the remaining states with `--ref`.

### Still open

- **Seymour Flux never appeared as one image.** Across three variants the model
  produced robed Seymour with a dark aura — striking, usable as a boss, but not
  the multi-armed monstrosity. Animagine knows `seymour guado`; it does not
  know `seymour flux` as a distinct form. `cast.json` splits him into
  `seymour-flux-body` (the pale torso rising from the bone frame, `--ref`'d at
  the existing approved render so the face matches) and `mortiorchis` (the
  mount), for the engine to composite. If that still misses, `--img2img` off a
  rough sketch is the next lever — this is exactly the case it was added for.
- **Hanging props still need a hand-corrected `baselineY`.** `--ref` does not
  help here; if anything it makes it more likely, since a reference holding a
  sword encourages later poses to hold it the same way. See §5.

## 8. Licensing

- **Animagine XL 4.0 Opt** — CreativeML Open RAIL++-M. Permits commercial and
  non-commercial use with use-based restrictions; the restrictions must travel
  with any redistribution of the model. We redistribute generated images, not
  the weights.
- **RealESRGAN_x4plus** — BSD-3-Clause.
- **ComfyUI** — GPL-3.0.
- **ComfyUI_IPAdapter_plus** (cubiq) — GPL-3.0. A ComfyUI custom node; it runs
  beside ComfyUI under the same licence and is not redistributed by us.
- **IP-Adapter weights and the CLIP-ViT-H-14 image encoder** (h94/IP-Adapter) —
  Apache-2.0. The encoder is LAION's CLIP-ViT-H-14-laion2B-s32B-b79K, MIT.

All of these are installed under `D:\Tools\`, outside the repository. Nothing
in `public/art/` is a model weight; the repo holds generated images only.

This project is an unofficial fan tribute. Final Fantasy characters and settings
are property of Square Enix; generated likenesses inherit that and are not
cleared for commercial use.
