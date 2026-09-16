# Art handoff — group `backdrops-and-portraits`

Date: 2026-09-15. Pipeline: `docs/ART-PIPELINE.md` v2 (Animagine XL 4.0 Opt,
shared `STYLE_TAGS` / `QUALITY_TAGS` / composition blocks, unmodified).
Canon authority: `research/visual-bible.md` §1 (characters), §2 (locations),
§5 (title / chapter select). Work order: `tools/gen/cast.json`.

Every seed below is the one recorded in the shipped sidecar, so any of these is
reproducible with `--seed <n>` and the tags quoted in the sidecar's `prompt`.

---

## 1. Backdrops

All seven plates are 2688×1536, `backdrop` preset (1344×768 → RealESRGAN ×4 →
`ImageScaleBy 0.5`), no people, no text. `--batch 3` each, winner promoted to
`<name>.png`, the other two deleted. Concept copies at 1600 px wide live in
`docs/screenshots/concept-<name>.png`.

| Scene | Seed | Variant | Why this one | Bible ref |
|---|---:|---|---|---|
| `dreams-end` | 1714200512 | 2 of 3 | Concentric tiers of ruined seating rise dead-centre with a burning emblem-disc hanging directly above them, and a flat reflective arena floor fills the lower third — that is §2.3's "circular arena floor / ghost seating / colossal burning Abes emblem" and money shot 2 in one frame. Variant 1 was a burning skyline with no arena; variant 3 was a black sphere over an empty plain. | §2.3 |
| `bevelle-underground` | 1370196706 | 3 of 3 | Symmetric machina cathedral: catwalks at several heights, orange emergency practicals, a machina rosette centred as a boss-framing target, and a wide empty plate floor in the lower third. Variants 1 and 2 both rendered daylight windows, which contradicts "underground, no sky". | §2.4 |
| `title` | 771001 | 1 of 3 (second round) | Reproduces §5.2's layer stack almost literally — dark blue-to-violet sky over the upper half, a narrow warm horizon glow band, still reflective water in the lower ~40%, and a huge clean negative-space field for the logo lockup. | §5.2 |
| `chapter-select` | 552201 | 2 of 3 (second round) | Evenly scattered pyre-green orbs on near-black with a quiet dark centre and no readable subject — §5.3's requirement that the plate carry "low local contrast and no readable subject" because five sphere cards and a detail rail sit on top of it. | §5.3 |
| `zanarkand-dome` | 1865557194 | 3 of 3 | **Regenerated** — see §1.1. | §2.2 |
| `gagazet` | 284923191 | — | **Kept** — see §1.1. | §2.1 |
| `farplane` | 1158534573 | — | **Kept** — see §1.1. | §2.5 |

### 1.1 Re-judging the three existing plates

- **`gagazet` — kept.** Cold high-altitude blue gradient, snow shelves on
  blue-grey rock, foreground rock occluders at both frame edges and a valley
  floor across the lower third. Palette sits on §2.1's ramps (`#1E2C52`
  sky top, `#7A8FBE` horizon, `#C6D4E6`–`#FFFFFF` snow). It misses the
  summoner memorial stones and renders a moon rather than §2.1's low warm sun
  band (`#E8C489`), but the cast row asked for "at night, cold blue moonlight"
  and the plate is internally consistent. Not "clearly off".
- **`farplane` — kept.** Pink-violet layered sky, impossible flower field
  carpeting the rock, foreground flower occluders, fogged distant landmasses.
  Matches §2.5's ramps closely (`#3E2A6E` zenith, `#7A5AB8` mid, `#F7B6D9`
  horizon glow, flower fields A/B). Missing the upward light-falls at the
  island rim, which are a particle-system job in the engine, not a plate job.
- **`zanarkand-dome` — REGENERATED.** The old plate was an *exterior* twilight
  colonnade standing in water under a pink-violet sky, with a glowing golden
  dome sitting on the waterline off to the left. §2.2 specifies the opposite
  on every axis: a dark *interior* great hall (`#0E0C18` ambient), a
  processional stone floor, converging pillar rows, and a single cold light
  shaft from a ruptured oculus. It also had no flat playfield — the party would
  have stood on open water — and its palette read as the Farplane. That is a
  scene-gating defect, not a taste call, so it was re-rendered. The new plate
  is §2.2 money shot 1 ("symmetric processional"): near-one-point perspective,
  pillar rows both sides, oculus dead centre dropping a cold shaft onto the
  floor, cracked pale stone across the lower third, pillars monumentally
  too large for people.

### 1.2 Prompt deviations from `cast.json` (backdrops)

`cast.json`'s backdrop rows are short; each was used as the spine and enriched
with the matching §2/§5 set-piece and lighting language. Two substantive
departures, both resolved in the bible's favour:

- **`title`** — the cast row says "sea wall at sunset". §5.1 carries an explicit
  *correction to the brief* on this point (the FFX logo subject is a sending on
  water at Kilika, not the Luca sea wall) and §5.2 specifies a dark night
  ocean with a burning horizon. The plate is built to §5.2. The first three
  variants generated from the "sunset" wording were all fiery full-frame
  skies that would have fought the logo lockup; the second round dropped the
  sunset language entirely and added `--negAdd "sunset, fiery sky, sun"`.
- **`chapter-select`** — the first round came back blue/magenta with one
  dominant sphere. Re-rolled with green weighted up and `large sphere, planet,
  moon, bright center, pink, magenta` in `--negAdd`, which produced the
  `--pyre-green` field §5.3 asks for.

---

## 2. Portraits

`character` preset, `--composition portrait`, 832×1216, `--batch 3`, rembg
`isnet-anime` cutout, winner promoted to `public/art/portraits/<id>.png`.
Pose block for every subject: the cast row's expression plus
`three quarter view, facing right, looking at viewer, expressive eyes`.

| Subject | Seed | Variant | Notes on the choice |
|---|---:|---|---|
| `auron` | 990404 | 1 of 3 (third round) | Opaque black lens band, red haori with a crossed kimono collar, black hair with grey streaks, stubble, stern. §1.21's must-read pair (black lens band + red collar) both land. |
| `wakka` | 131124182 | 1 of 3 | Solid orange coif wedge over a plain blue headband, tan skin, **brown** eyes, yellow vest, wide grin, shell necklace. The §1.4 squint read (orange fin / yellow triangle / blue band) is intact. |
| `lulu` | 880204 | 3 of 3 (second round) | Dark grey fur trim, red irises, purple lipstick and eyeshadow, black hair in a bun under four ornamented pins with bead-tipped braids. §1.21's must-reads (gold pins above the hairline + purple lips) both land. |
| `kimahri` | 880303 | 1 of 3 (second round) | Blue fur, white mane and beard, yellow slit-pupil eyes, pierced ears, leather straps — and a **single short forehead horn stub**, which §1.6 calls the single most important detail. |
| `rikku` | 954631128 | 2 of 3 | High fan ponytail with braids and an orange feather, green irises with the **swirl pupils drawn**, tan skin, orange tank, goggles at the throat. |
| `jecht` | 1698200342 | 1 of 3 | Dark skin, unruly black hair under a red headband, red eyes, stubble, bare chest, and **exactly one** metal pauldron, on his left arm as §1.11 specifies. Variants 2 and 3 gave him two. |
| `seymour` | 990505 | 1 of 3 (second round) | Light blue hair with a heavy forward bang, purple eyes, pallid skin, dark blue robe with red scrollwork trim and a green sash, calm unsettling smile. |
| `yunalesca` | 1357147669 | 1 of 3 | Silver hair, yellow pupil-less eyes, blue headband, two upright plumes, gold jewellery, serene. The only variant without a non-canon gold tiara. |
| `shuyin` | 724447738 | 3 of 3 | Generated with `--ref public/art/portraits/tidus.png --refWeight 0.45` per the cast row, so he is recognisably Tidus's face run colder and angrier. Green jacket front with yellow panel, blue eyes, hostile glare. |
| `lenne` | 474061417 | 1 of 3 | Long straight brown hair, brown eyes, violet lipstick, blue top with an asymmetric white ruffle, long blue beaded drop earrings, wistful. |
| `bahamut-fayth` | 673482800 | 3 of 3 | Small-featured young boy under a purple hood, glowing amber eyes, knowing smile. Variant 2 was rejected for spawning a sword and a gold headpiece. |

### 2.1 Canon corrections applied to the cast tags

Where `cast.json` and `research/visual-bible.md` §1 disagreed, the bible won.
Each of these is a tag change, not a style change:

| Subject | `cast.json` said | Shipped as | Bible |
|---|---|---|---|
| `wakka` | `blue eyes` | `brown eyes` | §1.4 "tan skin, brown eyes" |
| `rikku` | `yellow scarf`, `goggles on head` | dropped scarf; `goggles around neck` | §1.7 "goggles around her neck"; the scarf is the X-2 Thief look |
| `seymour` | `pointed ears` | dropped | §1.8 "his **ears are rounded**, unlike Guado elf ears" |
| `yunalesca` | `blonde hair` | `silver hair, white hair` | §1.9 "long **silver** hair" |
| `lenne` | `pink dress` | `blue top, white ruffles` | §1.20 "a **blue** top with white ruffles" |
| `shuyin` | `black and blue clothes` | `dark green jacket, yellow jacket` | §1.19 "jacket with a yellow back and pale dark-green front" |
| `auron` | `round eyewear` | `black sunglasses, opaque black lenses` | §1.3 "black sunglasses"; §1.21 "black lens band across the eyes" |

### 2.2 Re-rolls, and what caused them

Four subjects needed a second or third batch. All four failures were **tag
attractors**, not seed luck, so the fix was a prompt change rather than a
reroll at the same tags:

1. **`auron` (two re-rolls).** `high collar, popped collar, brown shoulder pad,
   red coat` pulled hard toward a European dress uniform — white shawl collars,
   gold braid, medallions, in all three variants. Replacing them with
   `red haori, japanese clothes, red kimono jacket` plus
   `--negAdd "military uniform, epaulettes, gold braid, medals, naval uniform,
   ornate collar"` fixed the garment. That round then produced **orange-tinted
   round lenses** from `tinted eyewear`; a third round with
   `black sunglasses, opaque black lenses` and
   `--negAdd "orange lens, yellow lens, colored lens, transparent lens,
   aviator sunglasses"` landed the black lens band.
2. **`lulu`.** `fur trim` alone renders **white** fur on this checkpoint; §1.5's
   ramp is a dark grey (`#3A3644`/`#6A6474`/`#9C96A6`). Fixed with
   `dark grey fur trim, black fur collar` and `--negAdd "white fur, cream fur"`.
3. **`kimahri`.** `broken horn, single horn` next to `pauldrons` summoned an
   ornamental **gold horned helmet** in all three variants, destroying the
   detail §1.6 says must survive. Fixed by dropping `pauldrons`, writing the
   horn out longhand (`single short bone horn on forehead, broken horn stub,
   asymmetrical horns`) and banning headgear:
   `--negAdd "helmet, crown, tiara, circlet, headgear, gold horns, ornate
   horns, symmetrical horns, antlers"`.
4. **`seymour`.** `facial markings` — intended to fetch §1.8's pronounced veins
   — rendered red **war paint** stripes across the eye. `veins on face, veiny
   pale skin` plus `--negAdd "face paint, war paint, red markings on face,
   facial tattoo, red stripes"` gave the correct pallid veined skin.

Worth adding to `cast.json`'s `notes` fields if anyone touches those rows.

### 2.3 Cutout and sidecar verification

Every shipped PNG was read back on a transparency checkerboard (individually
during judging, then all eleven together). No halos, no dark rembg fringe, no
leftover rectangular background. The hard cases — Kimahri's mane, Rikku's
ponytail spikes, Jecht's and Shuyin's hair spikes, Yunalesca's plumes — all
separated cleanly, so no `--alpha-threshold` pass was needed.

**`baselineY` is meaningless for these files and should not be used.** Every
portrait sidecar reports `baselineY: 1216`, i.e. the full canvas height,
because a head-and-shoulders bust runs off the bottom edge by design. The
contract in §5 of the pipeline doc is about planting *standing sprites* on a
ground plane; portraits are composited into UI frames (§1.21, §5.4) and never
touch the ground plane. No hand-correction is warranted.

### 2.4 Two things the next pass should know

- **No portrait is `--ref`'d at its own full-body idle.** Every portrait row in
  `cast.json` carries `"ref": "<id>/idle"`, but none of those idles exists yet —
  `public/art/characters/` currently holds only `tidus`, `yuna` and
  `seymour-flux`, and the party/boss idles belong to other groups. These
  eleven were therefore generated from tags alone (the sole exception is
  `shuyin`, which the cast row points at `portraits/tidus.png`, and that file
  does exist). **When the full-body idles land, the menu face and the battle
  sprite are not guaranteed to be the same person.** Re-running each portrait
  with `--ref public/art/characters/<id>/idle.png` at the default weight is the
  cheap fix, and it should be scheduled rather than assumed.
- **Facing direction is 9 for 11.** `auron`, `wakka`, `rikku`, `jecht`,
  `seymour`, `yunalesca`, `shuyin`, `lenne` and `bahamut-fayth` face right as
  asked. `lulu` and `kimahri` face left — in both cases the left-facing variant
  was the only one that got the canon right (Lulu's dark fur and pin crown;
  Kimahri's single horn stub), and canon accuracy was ranked above framing.
  Do **not** fix these by horizontally flipping the PNG: several subjects in
  this set carry canon asymmetries that a flip would invert (Jecht's left-arm
  pauldron, Auron's right-side scar, Lenne's left-side ruffle cascade).

### 2.5 Housekeeping note for other sessions

While clearing my own `*.raw.png` debris out of `public/art/portraits/` I used
a glob that also removed `valefor.{1,2,3}.raw.png`, which belong to the aeon
portrait group. Their `.png` and `.json` variants are untouched and the raw
files are pre-cutout debugging aids only (pipeline §5: "not shipped"), but if
that group wants them back the variants must be re-run. Apologies — noted here
rather than quietly.

---

## 3. Files produced

```
public/art/backdrops/dreams-end.{png,json}            new
public/art/backdrops/bevelle-underground.{png,json}   new
public/art/backdrops/title.{png,json}                 new
public/art/backdrops/chapter-select.{png,json}        new
public/art/backdrops/zanarkand-dome.{png,json}        replaced
public/art/portraits/{auron,wakka,lulu,kimahri,rikku}.{png,json}          new
public/art/portraits/{jecht,seymour,yunalesca,shuyin,lenne}.{png,json}    new
public/art/portraits/bahamut-fayth.{png,json}                            new

docs/screenshots/concept-dreams-end.png               new, 1600 wide
docs/screenshots/concept-bevelle-underground.png      new, 1600 wide
docs/screenshots/concept-title.png                    new, 1600 wide
docs/screenshots/concept-chapter-select.png           new, 1600 wide
docs/screenshots/concept-zanarkand-dome.png           refreshed, 1600 wide

docs/screenshots/art/<id>.png                         18 contact sheets
```

Untouched: `gagazet.png`, `farplane.png` and their concept copies;
`portraits/{tidus,yuna}.png`; everything under `public/art/characters/`.
