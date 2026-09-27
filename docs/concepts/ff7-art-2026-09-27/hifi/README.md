# FF7 art, high-fidelity round: three directions, party on the LEFT, Guard Scorpion on the RIGHT (2026-09-27)

**Options only. Nothing is installed in `public/art/` and nothing is wired.** The picks and the
recommendation are **an agent's look**; Bailey picks. Game case: **FF7 only** (the hidden Guard
Scorpion fight at the No. 1 Reactor core). Nothing in FFX or FFX-2 changed.

Why this round exists: Bailey, 2026-09-27, on a screenshot of the live fight (release 23): "wow the
character models look terrible and the menus are nowhere near crisp enough. i need tons of eye candy
it needs to be higher fidelity than the original in this regard", then "cant you just have the
characters and enemy switch sides? not mirrored just literally switch sides", then "i'll go with all
of your recommendations" to the plan that included this options round, shown as full battle frames
before anything is painted in bulk.

Staging after that call: the party stands on the **left** facing screen-**right**, Guard Scorpion on
the **right** facing screen-**left**. A figure facing screen-right in three-quarter view shows its
RIGHT side, so Barret's gun-arm (his right arm) is the **near** arm and Cloud's single pauldron (his
left shoulder) is on the **far** side. **Nothing is mirrored** (every sidecar says `mirrored: false`).

## Look at these first

| Direction | Desktop 1600 x 900 | Phone 390 x 844 (rendered at 2x) |
|---|---|---|
| 1. House painted style, done properly | `01-frame-house-1600.jpg` | `01-frame-house-390.jpg` |
| 2. Painterly semi-real key art | `02-frame-keyart-1600.jpg` | `02-frame-keyart-390.jpg` |
| 3. High-detail anime feature film (agent's choice) | `03-frame-film-1600.jpg` | `03-frame-film-390.jpg` |

`04-picks-cutouts.jpg` shows the nine picked cut-outs on the dark reactor grey, so any halo would show.
`05` to `08` show **every** render of the round (Cloud, Barret, Guard Scorpion, backdrops), with the
picks and the reason each reject failed.

Each frame is: the direction's own reactor-core backdrop, the party on the left, Guard Scorpion on the
right and larger, the eye candy composed in code on our own art (`scripts/compose.py`: the core's glow
and two-radius bloom, a green mako rim light on each fighter's core-facing edge, a soft green spill,
contact shadows, drifting mako motes, low haze, a vignette and a filmic shoulder so nothing clips),
and the **A+ HUD target** drawn crisp over it by the A+ code itself (`docs/concepts/ff7-hud-2026-09-27/a-plus/src`,
our own PR7 glyph set and glove; frame 1 of the A+ set, Cloud's turn with the cursor on Attack).
HP numbers are the A+ placeholders.

## Recommendation (an agent's look)

**Direction 3, the anime feature film look.** It is the one that most clearly reads as "higher
fidelity than the original" at game scale. The line work is crisp at 300 px tall, which matches the
crisp HUD. The lighting is strong: glossy steel, the green rim on the blade and gun, and the lit
backdrop. It is also the most faithful set. Barret has the hi-top fade and a grafted six-barrel
gun-arm on the near arm, with a fist on the far hand. Cloud has one pauldron on the far shoulder
and the white band on the near wrist. Guard Scorpion keeps the round 2 identity: a red riveted
shell, six legs, twin rifles under the head, one sensor eye, the disc on its back, and a raised
segmented tail with a cyan emitter lens.

Runner-up: **direction 2 (key art)**, if Bailey wants richer materials rather than crisper lines.
Its Cloud is the best single figure of the round. But its Guard Scorpion reads as a real scorpion,
with pincers and about eight legs, and its Barret's hair became a spiky mohawk. Both would need a
repair round.

Direction 1 (house) lands between the two. It is cleaner than the live art, but flatter than the
film look. Its Barret, Guard Scorpion and backdrop were derived from the film renders (see below),
so it adds the least that is new.

## Picks per direction

All paths are under `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi/`. Every raw frame has
`<name>.base.png` (the base render), `<name>.full.png` (after the 2x-class detail pass: RealESRGAN x4 then
a low-denoise re-render at 1.5 to 1.75x the base) and `<name>.prov.json` (engine, seed, denoise, prompt,
source image). Every cut-out has a `.json` sidecar with both cut-out reports.

**Cut-out check: all nine picks PASS both checks**: the pipeline guard and the strict one-component
check (`../round2/scripts/cleanup/final-cut.mjs`: rembg, defringe, then both checks), with 1 component
each. On the dark grey there is no pale halo. Where a pick was post-processed, `scripts/recheck.mjs`
re-ran both checks on the final file.

### 1. House (animagine-xl-4.0-opt, the FFX paintings' checkpoint)

| Subject | Cut-out | From | Notes |
|---|---|---|---|
| Cloud | `house/cloud/cut-p1.png` | `p1` (seed 710001, sketch img2img) with the extra hilt painted out (`scripts/house-cloud-fix.py`) | Single pauldron on the far shoulder. **Faults:** the near-wrist band is dark (canon: white); the far forearm armlet reads as a metal gauntlet; the blade has a teal panel near the hilt |
| Barret | `house/barret/cut-p3.png` | img2img 0.55 of our film Barret `film/barret/p1` (seed 711011) | Hi-top fade, grafted gun-arm on the near arm, fist on the far hand. **Faults:** a belt with a buckle instead of metal waist bands, a fleecy tuft at the far armhole, and some baked green rim on his back edge |
| Guard Scorpion | `house/gs/cut-p4.decast.png` | img2img 0.58 of our film GS `film/gs/p1` (seed 712012), then the baked green cast removed (`scripts/decast.py`) | Six legs, twin rifles, eye, disc, raised tail with lens. **Faults:** the rear shell is more orange than red, the tail joints are olive-grey, and a dark floor-shadow patch is kept under the body |
| Backdrop | `house/core/p3.full.png` | img2img 0.55 of our film backdrop (seed 713011) | Raised camera, so the floor is visible above the HUD band. House p1/p2 and round 1's `core.1` all have a low camera, which left the fighters floating once FF7's HUD band covers the bottom 29 % |

### 2. Key art (Z-Image Turbo, painterly semi-real)

| Subject | Cut-out | From | Notes |
|---|---|---|---|
| Cloud | `keyart/cloud/cut-p4.final.png` | img2img 0.70 of our house Cloud `house/cloud/p1.fix.png` (seed 720012) | The most convincing figure of the round: rich knit, leather and steel, single pauldron on the far shoulder. Two rembg bites in the grey blade were closed (`scripts/close-notch.py`, `scripts/fill-holes.py`). **Faults:** both wrists have dark bands, with no white SOLDIER band |
| Barret | `keyart/barret/cut-p3.png` | img2img 0.62 of our film Barret (seed 721011) | Grafted gun-arm on the near arm, fist, dog tags, a worn leather vest. **Fault:** the hi-top fade became a spiky mohawk (in all three key-art Barrets) |
| Guard Scorpion | `keyart/gs/cut-p1.clean.png` | the sketch, img2img 0.75 (seed 722001), then a 48 px floor speck dropped (`scripts/drop-specks.py`) | Weathered red paint, sensor eye, twin barrels, raised tail with lens. **Fault:** pincers and about eight thin legs, so it reads as a real scorpion rather than FF7's security mech |
| Backdrop | `keyart/core/p2.full.png` | the core sketch (seed 723002) | A domed chamber, the core column in rings, a round platform. Low contrast, and a few glyph-like squiggles in the column |

### 3. Anime feature film (FLUX.2 Klein 9B, edit mode)

| Subject | Cut-out | From | Notes |
|---|---|---|---|
| Cloud | `film/cloud/cut-p4.png` | Klein edit mode on our house Cloud `house/cloud/p1.full.png` as the reference (seed 730012) | Single pauldron on the far shoulder, the white band on the near wrist, a strong green rim. **Fault:** a metal cuff on the far wrist. Runner-up: `cut-p3.filled.png` (seed 730011; it has a white band on both wrists) |
| Barret | `film/barret/cut-p1.png` | the sketch as the reference (seed 731001) | The most canon Barret: tall hi-top fade, beard, cheek scars, grafted gun-arm on the near arm, and metal bands on the far forearm. **Faults:** a belt with a buckle, and a green rim on his back edge as well as the front |
| Guard Scorpion | `film/gs/cut-p1.decast.png` | the sketch as the reference (seed 732001), then decast | Closest to the round 2 identity (see the recommendation). **Fault:** a dark floor-shadow patch is kept under the body. It reads as a contact shadow in the frame |
| Backdrop | `film/core/p2.full.png` | the core sketch (seed 733002) | Glowing ringed column, steam, a lit grate floor. Vivid; on the phone frame the column fills the top half with glow |

## Method

- **Inputs are our own images only**: the code-drawn layout sketches (`scripts/party-right-sketch.py`,
  `scripts/core-sketch.py`, drawn facing the new way, not mirrored), and later our own renders from this
  round used as img2img or edit references. There was no retail image, no IP-Adapter and no trace. The
  prompts are written from canon text (`scripts/prompts.py`).
- **Pilot 2, LOOK, keep the best.** Each direction and subject got 2 pilots from the sketch. Where both
  failed a canon point, a third try used the method that had worked for another direction:
  - Film Cloud: the sketch gave two pauldrons or a toy look, so Klein edit mode ran on the house Cloud.
  - Key-art Cloud and Barret: two pauldrons, a haze, or a gun held in a hand, so Z-Image img2img ran on
    the house Cloud and the film Barret.
  - House Barret: no gun-arm, or a loose gun, so animagine ran on the film Barret.
  - House Guard Scorpion: no rifles, a stray beam, or blades, so animagine ran on the film Guard Scorpion.
  - House backdrop: a low camera, so animagine ran on the film backdrop.
  
  The runners are `scripts/run-*.sh`. **35 renders in total, all looked at.**
- **Detail pass**: every render is `base` then RealESRGAN x4, resized to 1.5 to 1.75x, then a
  low-denoise re-render at that size. The cut-outs are about 1100 x 2200 px, well above game scale.
- **Compose and HUD**: `scripts/compose.py` (per-direction layout overrides in `layout/*.json`), then
  `scripts/render-frames.mjs`, which ran one headless Chromium over `scripts/frame.html`. There was
  no dev server.
- **GPU rules**: ComfyUI was shared. A job was submitted only while fewer than 3 prompts were pending
  (`gen.py`'s queue wait). ComfyUI was never restarted, and there were no black frames.
- **Nothing was downloaded.** The local checkpoints reached all three directions, so there is no
  `downloads.md`.

## Open for Bailey

1. Pick a direction, or mix: for example, the film figures on the key-art backdrop.
2. After the pick, a short repair round on that direction's listed faults, done with the round 2
   masked-inpaint method. Examples: the white SOLDIER band, the belt versus the metal waist bands, and
   the key-art hair and pincers.
3. Then the other poses (hurt, attack, the tail-raised Guard Scorpion) in the picked direction. This
   round made the idle only.
