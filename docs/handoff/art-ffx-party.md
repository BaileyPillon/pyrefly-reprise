# Art handoff — group `ffx-party`

Date: 2026-09-15/16. Pipeline: `docs/ART-PIPELINE.md` v2 (Animagine XL 4.0 Opt,
shared `STYLE_TAGS` / `QUALITY_TAGS` / composition blocks — **not** touched).
Canon authority: `research/visual-bible.md` §1.1–§1.7. Work order:
`tools/gen/cast.json`.

Subjects: `tidus` (pre-existing, verified only), `yuna`, `auron`, `kimahri`,
`wakka`, `lulu`, `rikku`. States per subject: `idle, attack, cast, item, hurt,
ko, victory`, plus `summon` (Yuna), `jump` (Kimahri), `steal` (Rikku).
`ko` renders with `--composition prone --size 1216x832`.

Every non-idle state is pinned to its own subject's approved `idle.png` with
`--ref … --refWeight 0.65 --refStart 0.25 --refEnd 0.85`.

Contact sheets: `docs/screenshots/art/<id>.png`.

---

## 1. Portraits (done first — integration needs them first)

`public/art/portraits/<id>.png`, `--composition portrait`.

| Portrait | Verdict | Why |
|---|---|---|
| `tidus` | **kept** | Spiky blonde, blue eyes, yellow hooded vest, chain necklace. Instant read. |
| `yuna` | **kept** | Heterochromia correct-handed (green on her right, blue on her left), white chest sash, blue-beaded earring, brunette bob. |
| `auron` | **kept** | Black sunglasses, stubble, black hair with grey streaks, facial scar, red collar. Instant read. |
| `wakka` | **kept** | Orange coif swept back off a blue headband, tan skin, yellow vest, beaded necklace. Instant read. |
| `lulu` | **kept** | Black cornrow-and-bun hair with ornamented pins, fur trim, purple makeup, bead necklaces. Iris renders violet rather than the canon red (§1.5) — the only miss in the set, and not enough to fail identity. |
| `rikku` | **kept** | Blonde with braid and beads, green eyes, orange top, goggles at the throat. Instant read. |
| `kimahri` | **finished — kept `kimahri.png`, deleted variants 1–4** | See below. |

### 1.1 Kimahri portrait — choosing between the five

`kimahri.png` (seed 880303) versus the four numbered variants left by the
previous run. **All four numbered variants rendered a metal muzzle cage over
the snout** — a hard non-canon prop that `isnet-anime` keeps, and variant 4
added a matched pair of large golden horns on top of it. The un-suffixed
`kimahri.png` has none of that: blue fur, white mane and beard, a yellow slit
eye, a pierced ear with gold rings, leather chest straps, and **one short horn
on the forehead**, which is the Ronso silhouette §1.6 is built around.

Kept `kimahri.png` as-is; deleted `kimahri.{1,2,3,4}.{png,json,raw.png}`.
`muzzle, muzzle cage, face mask, gag` went into his `--negAdd` for every
subsequent sprite render, because the attractor is clearly strong on this
checkpoint.

---

## 2. Idles

### 2.1 Kept without regeneration

`tidus`, `yuna`, `wakka` and `rikku` already had an approved `idle.png` in the
v2 framing. All four were re-read against §1.1/§1.2/§1.4/§1.7 and kept:

- **tidus** — the approved style reference for the whole project. Untouched.
- **yuna** — heterochromia, the khakkhara staff with its gold ring head, white
  chest sash over a black camisole, yellow obi, floral hakama, black boots.
  Hakama reads blue-violet rather than §1.2's flat purple; internally
  consistent, so kept.
- **wakka** — orange coif, blue headband, yellow vest, **bare midriff band**
  (his fastest identifier per §1.4), blue-and-yellow baggy trousers, sandals,
  blitzball in hand. Best idle in the group.
- **rikku** — fan ponytail with braids and feather charms, goggles at the
  throat, orange tank, green flared shorts, the two long blue back-ribbons,
  mismatched arms. Top renders slightly red-shifted from §1.7's orange; kept.

### 2.2 Generated

| Subject | Seed | Variant | Rounds | Why this one |
|---|---:|---|---|---|
| `auron` | 9312044 | `idleD.1` of 4 | 4 rounds, 15 candidates | Below. |
| `lulu` | 7720101 | `idleB.1` of 4 | 2 rounds, 8 candidates | Below. |
| `kimahri` | 5500901 | `idleB.1` of 4 | 3 rounds, 12 candidates | Below. |

**Auron took four rounds.** §1.3's silhouette is "red trapezoid / one square
shoulder / **one limp sleeve**", and `cast.json` says outright: if both arms
are in the sleeves, reject. Round 1 (`1boy, … red coat, one shoulder bare, left
arm inside sleeve`) produced three full bell-sleeved kimono robes with both
arms in — two of them otherwise good, one with a correct sake jug on the hip.
Round 2 added `coat on shoulders, empty sleeve, bare left shoulder` and banned
`wide sleeves, kimono sleeves`: the asymmetric coat arrived, but so did a bare
sleeveless arm and a white cross emblem on the chest. Round 3 pinned the render
to the approved **portrait** with `--ref` — and is the clearest demonstration of
the palette-bleed caveat in §3 of the pipeline doc I have seen: the portrait's
warm key light dragged the red haori to **salmon-pink** on all four variants.
Rejected wholesale. Round 4 dropped the ref, kept round 2's phrasing, restored
`black shirt, long sleeves, high grey collar` and added `pink coat, salmon,
bare arms, cross emblem` to the negatives. `idleD.1` is the keeper: red haori
worn open off one shoulder over the black high-collared shirt, brown belts,
gold-ringed shoulder pad, sunglasses, stubble, black hair with a grey streak,
and the canon idle stance — **katana lying across the right shoulder**. The jug
reads as a gourd ornament hanging off the sword rather than sitting on his hip;
that is the one §1.3 detail still missing.

**Lulu took two rounds.** Round 1's four all rendered a *gown* — §1.5 and
`cast.json` both say the lower front is "a collection of interlaced belts", and
a plain skirt is a reject. Two also lost the moogle to a brown teddy bear, and
one sprayed large background flowers across the frame (which `isnet-anime`
keeps, so the cutout would have come back as the whole canvas). Round 2 spelled
the garment out — `belt skirt, skirt made of many leather belts, buckles` —
banned `pleated skirt, ruffled skirt, plain gown, flowers, teddy bear`, and
described the doll as `moogle plush, white plush doll, pom pom antenna`.
`idleB.1` lands the belt-stack skirt with visible buckles, the fur-trimmed
décolletage, the four hairpins and bead-tipped braids, purple lips, and a white
moogle with red cheeks and a pom held at shoulder height.

**Kimahri took three rounds.** Round 1 gave him a matched pair of horns in all
four (and two suits of ornate gold armour). Round 2 over-corrected: banning the
bare word `horns` suppressed the horn entirely and left him with ears.
`idleB.1` from that round is nonetheless the winner — a **single short horn**
survived on the forehead, over blue fur, a white mane and beard, yellow eyes,
pierced ears, a skull-emblem buckle, a red waist belt, blue sash, tail, and the
spear held upright at his side. Round 3 pinned to the portrait with `--ref` and
failed the same way Auron's did: the palette washed to pale orange and white.
The horn reads as intact rather than §1.6's chipped stump — the one canon miss,
and consistent with the shipped portrait, which is what matters more for
identity.

**The `--ref`-against-a-portrait experiment is a documented dead end now.**
Two subjects, eight variants, zero keepers, and the same failure both times: a
close-up portrait's lighting is a much larger fraction of its pixels than a
full-body sprite's, so IP-Adapter carries the light, not just the face. Pin
sprites to sprites.

---

## 3. States

(Filled in per subject below as each one lands.)

---

## 3. States

**Resume pass, 2026-09-16.** The previous run was cut off mid-`states`. This
pass re-read everything it left behind, kept what passed, and re-rendered the
rest. Findings first, because they changed the prompts for every subject below.

### 3.0 Verification of what the cut-off run left

**Portraits — all seven re-read and kept.** `tidus`, `yuna`, `auron`,
`kimahri`, `wakka`, `lulu`, `rikku` all read instantly at portrait scale;
`kimahri.png` is the un-suffixed keeper the previous run chose and the numbered
variants are already gone. The two known misses stand and are not worth another
round: Lulu's iris renders violet rather than §1.5's red, and Kimahri's single
horn renders intact and orange rather than §1.6's chipped stump. Both are
consistent with the shipped sprites, which matters more than either detail.

**Tidus — all 7 files present and consistent.** `idle, attack, cast, item,
hurt, ko, victory`. Same blonde spiky hair, same asymmetric yellow/blue vest,
same Brotherhood blade in every frame, clean cutouts. Skipped as instructed.

**Idles — all six kept.** No idle was regenerated; every state below is pinned
to the idle the previous run approved.

### 3.1 Three failure modes killed almost every non-idle variant

Of the 21 numbered variants the cut-off run left behind, **two survived**. The
rejections were not random — they fell into three buckets, and all three are
now negative-prompted:

| Failure | Where it showed | Fix |
|---|---|---|
| **Duplicate / floating weapons** | Yuna grew a second khakkhara in `hurt.1`, `hurtB.1` and `attack`; Wakka grew two extra blitzballs in `cast.2`; Auron got a second blade floating overhead. | `extra weapon, duplicate weapon, two weapons, floating weapon, detached weapon` |
| **Ornamental frames rembg keeps** | Yuna's `hurt.2` and `victory.1` came back inside enormous gold mandala frames; Kimahri's `cast.1` inside a white-and-pink paint swirl. `isnet-anime` keeps every opaque pixel of these, so the cutout is the whole 832×1216 canvas and `baselineY` lands on scrollwork instead of a boot. | `ornate frame, gold frame, halo, mandala, background decoration, decorative border, circular frame, throne, banner` |
| **Effect wings** | Rikku's `attack` and `item.1` both sprouted large orange flame/feather wings from the claws. | `wings, feathered wings, energy wings, flame wings, smoke, mist` — and `fire, flames, aura, sparks, energy trail` on every **non**-cast state. `cast` and `summon` keep the glow allowance or the magic circle never appears. |

The third bucket is the same family as the `painterly` and `motion lines`
findings already in `docs/ART-PIPELINE.md` §2: on this checkpoint, anything that
invites a decorative flourish gets one, and rembg cannot tell a flourish from a
character.

**Identity tags and per-subject negatives were lifted verbatim from each
subject's approved `idle.json`** rather than retyped, so a state physically
cannot drift from the costume the idle was approved on. The two new negative
blocks above are appended to that, never substituted for it. Style and quality
tags untouched.

### 3.2 Per-subject

#### auron — complete (7 states)

Sheet: `docs/screenshots/art/auron.png`.

| State | Variant | Notes |
|---|---|---|
| `idle` | kept (seed 9312044, `idleD.1`) | Unchanged from the previous run. |
| `attack` | kept | Overhead swing, blade clear of the body, sunglasses and haori intact. |
| `cast` | 3 → `.1` | Both of the cut-off run's candidates were rejected: `cast.1` had lost the sunglasses and swapped the haori for tan armour, `cast.2` put his hair in a topknot. Re-rolled with `topknot, hair bun, white forelock` added to the negatives. New `.1` keeps the sunglasses, the haori worn open off one shoulder and the black pants, and puts a magic circle on the floor. The raised arm never arrived — he channels with the blade lowered, which is closer to Banishing Blade anyway. |
| `item` | 3 → `.3` | The only one of the three holding a legible **blue glass potion bottle** in a raised hand while standing straight-on with both boots visible. `.1` cropped the black shirt into a bare midriff. |
| `hurt` | 3 → `.2` | The weakest state in the set and the reason is §1.3: Auron is written as a man who does not flinch, and the checkpoint agrees — `.1` and `.3` both came back as stances, not recoils. `.2` at least catches him mid-stagger with the coat trailing behind the stride. |
| `victory` | 3 → `.2` | Standing tall, blade lowered, coat settled, head up. No flourish, which is the canon note. |
| `ko` | 3 → `.2` (`--composition prone`, 1216×832) | Largest and clearest of the three: on his side, sunglasses still on, katana lying alongside, red haori spread. |

Both arms read as free in the action states. That is correct rather than a
drift — §1.3 says he frees the left arm only when fighting — but it does mean
the "one limp sleeve" silhouette only holds in `idle`, `item` and `victory`.

---

## 4. Second resume pass, 2026-09-16 (group closed)

The run logged in §3 stopped after Auron. Everything it produced for the other
five subjects was on disk but unjudged and unlogged: `wakka` and `rikku` had a
complete promoted set, `yuna`, `kimahri` and `lulu` were left holding numbered
variants for `hurt` (and `item`, for Yuna and Kimahri). This pass judged all of
them, re-rolled what failed, promoted the keepers and deleted every numbered
variant and `*.raw.png` in the group. **All seven subjects are now complete.**

### 4.1 What the leftover variants showed

Of the 15 numbered variants waiting to be judged, **one** was promotable
(`kimahri/item.3`). The rejections repeat §3.1's three buckets, plus two new
ones:

| Failure | Where |
|---|---|
| Duplicate / detached weapon | `yuna/item.1` and `item.3` (second khakkhara head at the hip), `yuna/hurt.3` (staff floating free of both hands), `kimahri/hurt.2` (loose blade on the ground) |
| Moogles as separate characters | `lulu/hurt.1` and `hurt.2` came back with a *crowd* of moogles floating around her; `hurt.2` had one kneeling on the floor like a second party member. Banning `two moogles` was not enough — `moogle standing on the ground` was the phrase that fixed it |
| Palette and bulk drift at `--refWeight 0.5` | All three `kimahri/hurt` variants and two of the three `kimahri/item`. The cut-off run had dropped the reference weight to 0.5; at that setting the checkpoint re-bulked him, swapped the blue-and-red palette for orange-and-tan and re-grew a matched pair of horns. **Back to 0.65 for every re-roll below, and that alone fixed the identity drift.** |
| Over-specified recoil prompts | New. §3's `hurt` prompt stacked eight clauses (`head thrown back, mouth open crying out in pain, knees buckling…`). On this checkpoint that many pose clauses cancel out — every variant came back as a *stance*. A four-clause version (`leaning back, stumbling backwards, wincing, one eye closed`) plus one clause for what each hand is doing produced a readable flinch on the first try for Yuna and Kimahri. |

### 4.2 A note on `hurt` across the whole group

Even with the shorter prompt, Animagine resists a genuine recoil: `auron`,
`wakka` and `lulu` all ended up with `hurt` frames that read as a braced or
guarded stance rather than a stagger. That is now consistent across the group
rather than a one-subject miss, so it looks deliberate in the sheets. If a
later pass wants real recoils, `--img2img` off a rough pose sketch is the lever
that has not been tried — prompt-only has now failed across three rounds and
four subjects.

### 4.3 Despeckling

Yuna's `hurtE.1` came out of `rembg` with three detached alpha islands — the
staff's tassel and cord, drawn floating clear of the shaft (910 px, 322 px and
7 px against a six-figure pixel count for the figure). `isnet-anime` keeps
them, so they would have shipped as specks hanging in mid-air beside her.

They were removed with a one-off connected-component filter (drop every island
under 2% of the largest), after which the sprite was re-cropped with the same
16 px margin `rembg.py` uses and the sidecar's `width`, `height`, `baselineY`
and `cropBox` were recomputed. Every sprite promoted in this pass records the
result under a `despeckle` key and its origin under `sourceVariant`; where
`islandsDropped` is 0 the file is byte-for-byte the cutout `rembg` produced.
This is a post-cutout cleanup, not a pipeline change — `tools/gen/` was not
touched.

### 4.4 Per-subject

#### yuna — complete (8 states)

Sheet: `docs/screenshots/art/yuna.png`.

| State | Variant | Notes |
|---|---|---|
| `idle`, `attack`, `cast`, `ko`, `victory`, `summon` | kept | Unchanged from the previous run. |
| `hurt` | round E, `.1` of 3 (despeckled, 3 islands) | One eye screwed shut, teeth bared, free hand clutching her chest, staff hugged diagonally across the body. The **full-length** hakama is why this beat `hurtE.2`, which was a cleaner cutout and a more dynamic twist but wore the skirt at mid-calf — the drift `cast.json` warns about. |
| `item` | round F, `.3` of 3 | Took two rounds. Round E kept the staff in the identity tags and every variant grew a second one; **round F dropped `holding staff, summoner staff, khakkhara` from `--tags` and put `staff, second staff, rod, pole` in the negatives**, which is the only thing that stopped it. She now holds a single blue potion bottle in one hand with the other open in an offering gesture, no staff at all — correct for an item frame, and the cleanest Yuna render in the set. |

#### kimahri — complete (8 states)

Sheet: `docs/screenshots/art/kimahri.png`.

| State | Variant | Notes |
|---|---|---|
| `idle`, `attack`, `cast`, `ko`, `victory` | kept | Unchanged. |
| `hurt` | round E, `.1` of 3 | Arm drawn hard across the chest, spear dropped low in the other hand, single forehead horn, blue-and-red palette intact. The three variants at `--refWeight 0.5` were all rejected for the drift described in §4.1. |
| `item` | `item.3` of the previous run's 3 | The one promotable leftover in the group: a blue potion held out in his right hand, spear in his left, skull buckle, white mane and beard, one horn. The polearm renders double-bladed rather than the idle's single red spearhead — the only drift, and the silhouette still reads. |
| `jump` | round B, `.3` of 3 | **Re-rolled.** The previous run's `jump.png` was airborne and well composed but gave him a **matched pair of dark horns** — precisely the failure `cast.json` calls load-bearing, and it broke identity against every other frame. Adding `black horns, curved horns` to the horn ban and going back to `--refWeight 0.65` produced `jumpB.3`: genuinely mid-air, legs tucked, tail streaming, a single dark horn, one continuous double-bladed polearm. |

`jump` carries a **hand-corrected `baselineY` of 1560** against an auto value of
1195, per the §5 caveat in the pipeline doc and the `notes` on the `jump` state
in `cast.json`. He has no ground contact, so the auto value — his lowest paw —
would have planted him on the floor mid-leap. 1560 is a virtual row about
365 px below the sprite, floating him roughly a third of his height. It is a
judgement call and the number is worth re-tuning once the engine draws him.

#### lulu — complete (7 states)

Sheet: `docs/screenshots/art/lulu.png`.

| State | Variant | Notes |
|---|---|---|
| `idle`, `attack`, `cast`, `item`, `ko`, `victory` | kept | Unchanged. |
| `hurt` | round F, `.3` of 3 | Took three rounds and is the weakest pose in the group. Round E finally produced one clean, moogle-free candidate (`hurtE.1`, arms crossed over the chest — the best *flinch* anywhere in the set) but Lulu without the moogle is Lulu without her weapon, so it was rejected on the §1.5 bar. Round F put the doll back with `one white moogle plush gripped in her lowered hand at hip height` and banned `moogle standing on the ground`. `hurtF.3` holds a single moogle by her side, and lands the belt-stack skirt with visible buckles, the fur-trimmed off-shoulder corset, the bead necklaces, purple lips and — for the first time in any Lulu render — the **canon red iris**, which the shipped portrait renders violet. The cost is the pose: it reads as a braced stand rather than a stagger. See §4.2. |

#### wakka — complete (7 states), verified only

Sheet: `docs/screenshots/art/wakka.png`. The cut-off run had already promoted a
full set and it holds up: orange pompadour over the blue headband, bare midriff
band, yellow vest, blue-and-yellow trousers, sandals, and the blitzball present
in every frame including `ko`. No regeneration.

#### rikku — complete (8 states), verified only

Sheet: `docs/screenshots/art/rikku.png`. Also already promoted and kept: fan
ponytail with braids and charms, goggles at the throat, orange top, green
shorts, the two long blue back-ribbons, and the claw on the hand in `attack`,
`steal` and `victory`. The `wings` failure §3.1 describes is gone from the
promoted frames. No regeneration.

#### tidus — verified, skipped

All 7 files present, consistent, clean cutouts. Untouched, as instructed.

#### auron — complete (7 states)

Unchanged from §3.2; the sheet was rebuilt. Worth recording one thing the sheet
makes obvious that §3.2 does not: **`cast` and `victory` lose the sunglasses**,
replacing them with the scarred closed eye. It is arguably more canon than the
glasses, and the red haori plus grey high collar plus katana still names him
instantly, so it was left.

### 4.5 Contact sheets — a collision worth knowing about

`docs/screenshots/art/<id>.png` is **shared with the backdrops-and-portraits
group**, which used the same path for single-image portrait thumbnails. This
pass wrote seven- and eight-cell battle-state sheets over
`{tidus,auron,wakka,rikku,yuna,kimahri,lulu}.png`, each of which now carries the
portrait as its own first row, so nothing is lost — but the two groups are
writing into one namespace and the next one to run wins. If both kinds of sheet
are wanted long-term they need different prefixes.

The judging sheets are kept as `_v-pick-*.png` in the same folder for
provenance.

### 4.6 Final state

| Subject | States | Sheet |
|---|---|---|
| `tidus` | idle attack cast item hurt ko victory | `docs/screenshots/art/tidus.png` |
| `yuna` | + summon (8) | `docs/screenshots/art/yuna.png` |
| `auron` | 7 | `docs/screenshots/art/auron.png` |
| `kimahri` | + jump (8) | `docs/screenshots/art/kimahri.png` |
| `wakka` | 7 | `docs/screenshots/art/wakka.png` |
| `lulu` | 7 | `docs/screenshots/art/lulu.png` |
| `rikku` | + steal (8) | `docs/screenshots/art/rikku.png` |

54 sprites, 54 sidecars, 7 portraits. No numbered variants and no `*.raw.png`
remain under `public/art/characters/` for this group. Every sidecar's
`baselineY` sits 16 px above the image bottom (the `rembg` margin) except the
prone `ko` frames, which are exempt by convention, a handful of frames whose
content runs to the canvas edge, and Kimahri's `jump`, which is hand-corrected
as described above.

---

## 5. Fix pass (2026-09-16) — judge-flagged states below 7

An independent judge scored 15 states in this group below 7 and asked for them
to be regenerated. Their complaints clustered into three root causes:

1. **Costume drift away from the idle** (Tidus wearing four different outfits
   across five frames; Auron gaining gold pauldrons and a fur collar; Wakka
   losing the yellow vest; Lulu in a cream gown).
2. **The pose not reading** (`hurt` frames that are second idles, `attack`
   frames where the sword is held passively).
3. **Frame-edge crops on the prone `ko` frames**, which leave a cutout that
   cannot sit on a ground line.

### 5.1 What actually fixed it — and the round that did not

**Round G** attacked (1) by pushing `--refWeight` from 0.65 to **0.8** with
`--refStart 0.2`. That is the wrong lever and the pipeline doc says so: above
roughly 0.8 the IP-Adapter starts reproducing the reference's *pose*, and
`--poseTags` stops mattering. Costume fidelity did improve — and every single
`item` and `hurt` candidate came back as a standing idle holding a sword. Four
`hurt` variants, zero flinches.

**Round H** put the weight back down and moved the costume enforcement into the
prompt, where it does not fight the pose:

- **Identity detail moved into `--tags`**, not `--poseTags`. The cast-manifest
  rows describe the characters loosely (`yellow hooded vest`, `black shorts`);
  the round-H tag strings spell out what the *approved idle* is actually
  wearing — `blue and red armored pauldron on left shoulder`,
  `single red legging on right leg`, `white high collar, grey sash, black
  hakama`, `white skull emblem on chest`. This is still identity-only, so the
  style contract is untouched.
- **Every drift the judge named became a negative.** `orange undershirt`,
  `puffed sleeves`, `cowl`, `shuriken`, `gold pauldron`, `fur collar`,
  `western sword`, `crossguard`, `single lens`, `red crest`, `curved glaive`,
  `chibi`, `stocky`, `pale skin`, `striped headband`, `gold orb`,
  `cream dress`, `oversized plush` — per subject, via `--negAdd`.
- **Weight split by how far the pose is from the idle.** `attack` and `cast`
  stay near the idle's standing silhouette and hold at `--refWeight 0.7
  --refStart 0.28`. `item`, `hurt` and `ko` are the poses the adapter was
  flattening, and they run at `--refWeight 0.55 --refStart 0.35`.
- **`cast` was re-conceived for the three characters who do not cast.** The
  judge's note that "Auron does not cast in FFX; the magic circle plus a limp
  downward sword is off-concept" is right, and the same is true of Tidus and
  Wakka. Those three now charge their own weapon — sword raised with blue
  energy, odachi overhead with a red aura, blitzball held up crackling — and
  keep the house magic circle only where it belongs (Kimahri, and Lulu/Yuna
  who were not flagged).
- **`ko` gained `wide shot of the whole body` and
  `entire figure well inside the frame`**, plus `close-up, cropped legs, out of
  frame` in the negative. That is what stopped the frame-edge crop.

### 5.2 tidus — 5 states replaced

| State | Variant | Notes |
|---|---|---|
| `attack` | round G, `attackG.1` of 2 (`--refWeight 0.8`, seed 771001) | The one frame round G's high weight earned. A foreshortened lunge straight at the camera with the Brotherhood sweeping down across the body; the swing reads, which is the judge's third complaint. Costume is now the idle's exactly: yellow-and-white hooded vest, blue-and-red left pauldron, black shorts, red legging, black boots, and the idle's blue crystalline blade rather than the round-1 red/blue hilt. Hair is short and spiky again. `baselineY` 1172 is the image bottom and is correct here — his back boot is the lowest content — but the sole does touch the canvas edge. |
| `cast` | round H, `castH.2` of 3 | The judge asked for "a sword-glow or cheer pose" instead of Tidus casting, and this is it: Brotherhood held down-forward blazing white-blue, free hand raised in a fist, chin up. No magic circle, no invented second prop — the floating shuriken that got the round-1 frame rejected is gone. Costume matches the idle including the pauldron and the single red legging. |
| `item` | round H, `itemH.3` of 3 | A green potion, clearly a bottle and clearly held out at arm's length — the round-1 frame had him grabbing at nothing. Sword in the other hand, fully inside the frame this time. Both hands are clean (the round-1 mitten hand is gone). |
| `hurt` | round H, `hurtH.2` of 3 | Crouched and twisted away from the blow, knees bent, head turned down and away, sword flung up off-line, weight clearly lost. Not a flinching *face* — that stayed out of reach across seven candidates — but unmistakably off balance, which the round-1 frame (an upright idle in a purple hooded cowl) was not. Palette is back to yellow/blue/black. |
| `ko` | round H, `koH.2` of 3 | Face down, fully limp, both arms sprawled forward, both legs straight out, the sword fallen on the ground beside his open hand — and the **whole body inside the frame**, which is the fix the judge asked for. Costume matches the idle rather than the old attack frame. |


---

## 6. Second fix pass (2026-09-17) — judge round 2

A second independent judge scored 43 states in this group below 7. Two of the
flagged frames were **idles** (`tidus/idle` 6, `auron/idle` 6), so per the brief
those anchors were re-shot first and every state downstream of them re-rendered
against the new reference.

### 6.1 Read the judge's list against the files before regenerating

Worth recording because it cost an hour to discover: **the judge scored a
snapshot older than the files on disk.** Five of the seven Tidus complaints
describe frames that §5.2 had already replaced — the "floating shuriken" in
`cast`, the "purple/blue hooded cape" in `hurt`, the bare chest in `attack`.
Those props are not in the round-H files the judge was nominally scoring.

The lesson is not that the judge was wrong; it is that a score list is a
**pointer to a state, not a description of it**. Every flagged frame was re-read
here before anything was regenerated, and the decision was made on the file, not
on the complaint. That turned 43 flagged states into 26 that genuinely needed
work plus 2 anchors, and saved roughly fifty renders.

One complaint was also wrong on canon: the judge called Tidus's "blue rounded
pauldron and red/black armoured right sleeve" non-canon. They are canon — that
pauldron and armoured right arm are part of his design. `cast.json`'s Tidus row
does not mention them, which is how they came to look like drift. They are now
spelled out in the tag string instead.

### 6.2 What the drift actually was, per subject

Every subject had one dominant failure mode, and naming it was most of the fix:

| Subject | The drift | The lever |
|---|---|---|
| `tidus` | idle lacked the canon asymmetric trouser legs, so the whole set was downstream of a wrong anchor | re-shot the idle |
| `yuna` | the floor-length hakama shortened to knee length in every non-idle frame, plus an invented pink scarf/wing drape | `long blue hakama, floor length skirt, ankle length skirt` in tags; `short skirt, knee length skirt, bare legs, cape, shawl, floating scarf, angel wings, pink scarf` in negatives |
| `auron` | both arms in the sleeves, no sake jug, an under-scaled katana | `red haori coat worn off one shoulder, bare shoulder, empty sleeve hanging`, `gourd hanging on a red cord`, `oversized katana, nodachi, long straight single edged blade` |
| `kimahri` | gold pauldrons, an orange flame spear and a huge white mane arriving from nowhere | banned `gold pauldrons, ornate armor, flaming weapon, glowing weapon, huge mane, two horns` |
| `wakka` | the blitzball becoming a featureless glowing orb | banned `glowing orb, gold orb, featureless ball, juggling, multiple balls` |
| `lulu` | the belt-stack skirt becoming a short ruffled skirt with bare legs, and the black dress lifting to grey/cream | `floor length black dress, belt skirt, stacked leather belts, buckles`; banned `short skirt, ruffled skirt, bare legs, white/cream/grey/brown/pale dress` |
| `rikku` | claw blades sprouting from the wrist instead of the knuckle housing | `metal claw gauntlet, three blades over the knuckles`; banned `gold cuff, bracelet, wrist blades, blades from the wrist` |

### 6.3 Three mechanical findings that generalise

**1. A weapon in `--tags` will beat a potion in `--poseTags`.** Every Tidus
`item` candidate came back holding the Brotherhood and no bottle, exactly as
Yuna's `item` kept growing a second staff in §4.4. The fix is the same one that
worked there: a separate identity string for the `item` state with the weapon
removed and `sword, blade, katana, weapon, holding sword` in the negatives. The
costume still carries the character; the hands are then free to hold the thing
the state is named after.

**2. `hurt` needs a much lower `--refWeight` than §5.1 used.** Round H put
`hurt` at 0.55/0.35 and still got second idles. At **0.4–0.45 with
`--refStart 0.40–0.42`** the poses finally break, and the costume still holds
because the tag strings now spell the outfit out rather than leaning on the
adapter for it. Pose language matters as much as weight: "flinching, recoiling,
staggering" produces a polite lean, while "knocked backwards by a heavy blow,
knees buckling, head snapped back, mouth open in a cry of pain, badly off
balance" produces an actual hit.

**3. `lying on ground` summons a literal floor, and rembg keeps it.** The prone
composition block reliably rendered a wooden platform, a sand patch or a rock
shelf under the body. Because it is opaque, the cutout keeps it and the crop box
runs to the canvas edge — the same failure mode as the paint splatter in §2. The
cure is to say where the body is instead of what it is lying on:
`wide shot of the whole body isolated on plain white` in `--poseTags`, plus a
`NOFLOOR` negative block (`floor, ground plane, wooden floor, wooden platform,
sand, dirt, grass, tiles, rug, carpet, stone, rocks, tree, scenery, background,
shadow on the ground, cast shadow`).

### 6.4 Throughput, and the mistake that cost the most wall time

The GPU was shared with the desktop session all night (roughly 11 GB of 16 GB
held by other applications), so a single 832×1216 render took **90–170 s**
instead of the usual ~30 s, and the CPU `rembg` pass added minutes on top.

The obvious response — run many `comfy.mjs` processes at once so the cutouts
overlap the sampling — **backfires past about three**. Seven concurrent lanes
put 14 prompts in one queue, and `waitForResult` in `tools/gen/comfy.mjs` gives
up at a hard-coded **900 s**, so lanes started dying mid-batch with
`Timed out waiting for prompt`. Three producers is roughly the sweet spot on
this machine: enough to keep the GPU fed while the cutouts run, few enough that
nothing waits out the timeout.

### 6.5 A second process is writing into this group

**`public/art/characters/rikku/` is not exclusively ours right now.** Between
00:48 and 01:25 four files appeared at `rikku/koJ.1-4.png` whose sidecar prompts
are not from this session (they read `petite, teenage girl, orange feather hair
ornament, thigh pouch, brown boots` and pose as `collapsed face up and limp`);
`rikku/hurtJ.*` followed later. This pass had independently picked the same `J`
variant suffix and would have overwritten them.

All Rikku candidates from this pass were therefore moved to a **`K` suffix**, no
`rikku/*J.*` file was deleted, and a note went to the peer session. Anyone
working this folder should check `ls -la` and the sidecar `prompt` field before
promoting or cleaning up.

### 6.6 Per-subject results

#### auron — 7 states, all 7 replaced

The whole set was downstream of a weak idle, so the idle was re-shot twice.

| State | Variant | Notes |
|---|---|---|
| `idle` | round K, `.3` of 4 | The fix. Round J had gained the **sake gourd** and a properly oversized nodachi but still buttoned the coat over both arms; round K added `red haori coat worn off one shoulder, bare shoulder, empty sleeve hanging, right arm in the sleeve` to the tags and `both arms in sleeves, symmetrical sleeves, buttoned coat` to the negatives, and the canon drape finally landed. Black sunglasses, grey high collar, gourd on a red cord, long katana across the shoulder, grey trousers, brown shoes. `cropBox` stops 21 px short of the canvas, so the blade is not clipped. |
| `attack` | round M, `.1` of 4, **no `--ref`** | See §6.7 — this frame is why that section exists. A real downward diagonal cut with both hands on the hilt, coat flaring wide, front knee bent. |
| `cast` | round M, `.1` of 3, no `--ref` | Auron does not cast (§5.1), so this is the katana raised overhead with a **thin red energy edge on the blade**. Round L's version wreathed him in a full-frame flame halo — opaque, so rembg kept it and the crop ran to the canvas edge. `thin red energy outline clinging to the blade edge` plus banning `flames, fire, large aura, glowing background, full screen effect` is what kept the effect on the sword. |
| `item` | round L, `.2` of 3 | A blue potion bottle held at chest height, clearly readable, single katana at his side. The judge's "potion is tiny against the figure" is fixed by putting the bottle at chest height rather than at arm's length. |
| `hurt` | round L, `.1` of 3 | The weakest frame in the set and worth flagging. It is a braced twist with the coat flaring and the sword arm dropped, not a real recoil — Auron's coat mass resists a stagger silhouette. It does fix all three of the judge's specific notes: the right arm reads clear of the coat, the sword is held rather than detached behind him, and it is no longer a saunter. |
| `ko` | round L, `.3` of 3 | **Face up**, face clearly visible, sunglasses still on, arms sprawled, coat spread flat, katana fallen beside him, clean white ground. Replaces the "face-down red fabric heap" the judge could not identify. |
| `victory` | round L, `.2` of 3 | Katana resting back on the shoulder, free hand near the gourd, chin up, faint smirk — and the **sunglasses are on**, which was the judge's identity-breaking complaint. No breastplate, no gold shoulder orbs. |

#### yuna — 8 states, 5 replaced

`idle`, `item` and `victory` were not flagged and were kept; they already carry
the full-length hakama the other frames were losing.

| State | Variant | Notes |
|---|---|---|
| `attack` | round K, `.2` of 3 (`--refWeight 0.5 --refStart 0.38`) | Staff held across the body in both hands, floor-length hakama intact, single correctly-scaled gold ring head, no pink drape. Honest caveat: it reads closer to a guard than a strike. Three rounds at three weights never produced a clean downward swing that also kept the long skirt — every candidate that swung hard also hitched the hem to the knee. The skirt was judged the more load-bearing of the two. |
| `cast` | round J, `.1` of 3 | Staff held up in both hands, light on the ring head, eyes half closed, long hakama, **no ground circle** — the bright ring at the cutout base that the judge flagged is gone. |
| `hurt` | round K, `.2` of 3 (`--refWeight 0.45 --refStart 0.40`) | Arm raised across the face, head turned down and away, visible strain, staff held clear in one lowered hand so it no longer crosses the forearm ambiguously. The first three candidates at 0.55 were all second idles. |
| `ko` | round K, `.1` of 3 | The `NOFLOOR` fix (§6.3). Round J put her on a wooden platform, a sand patch and a rock shelf respectively; round K is face down and limp on clean white with the hakama spread. |
| `summon` | round J, `.1` of 3 | Staff raised high overhead in one hand, other arm outstretched, looking up — fixes "staff is held low and half-cropped". Long skirt intact. |

#### tidus — 7 states, all 7 replaced

| State | Variant | Notes |
|---|---|---|
| `idle` | round J, `.2` of 4 | **The new anchor.** First Tidus render in the project to land the canon **asymmetric legwear** — one black trouser leg long to the ankle, the other cropped at the knee — together with the yellow hooded vest over black overalls with the chest bib and suspender straps. Blue right pauldron and red/black armoured right upper arm are canon and now explicit in the tags rather than accidental. Feet are the lowest content, so `baselineY` 1061 needs no hand correction (the old idle did — see §5 of the pipeline doc). |
| `attack` | round J, `.1` of 3 | Shouting, blade swept down across the body, front foot planted. Costume matches the new idle exactly. |
| `cast` | round J, `.2` of 3 | Sword raised overhead blazing blue-white, no magic circle, no invented second prop — keeps the §5.1 decision that Tidus charges his weapon rather than casting. |
| `item` | round K, `.2` of 3 | Took the weapon-out-of-tags fix (§6.3). A single bottle held up at chest height, clearly lit and readable, no sword anywhere in frame. |
| `hurt` | round K, `.2` of 3 (`--refWeight 0.45`) | Body twisted hard, one leg swung off the ground, head down, sword arm thrown off line. Reads as knocked off his feet. Not a pained *face* — that has now eluded three separate rounds across two passes — but unmistakably off balance. |
| `ko` | round K, `.1` of 3 | Face down, limp, both arms sprawled forward, sword fallen beside his open hand, whole body inside the frame on clean white. |
| `victory` | round K, `.3` of 3 | Sword raised, smiling, head up. Fixes both of the judge's notes: the weapon is the idle's blue blade rather than a dark ornate greatsword, and the legs are the overalls rather than grey skirt panels. |

#### lulu — 7 states, 6 replaced

`idle` was not flagged and anchors the set.

| State | Variant | Notes |
|---|---|---|
| `attack` | round K, `.2` of 3 | The judge's headline complaint — "short ruffled skirt with bare legs, silhouette no longer matches the idle at all" — is gone: full belt-stack skirt with visible buckles, fur trim, single moogle held out. Three rounds never produced a hard *throw*; this is a turned-shoulder swing. Round K.1 did throw, but sprayed an orange slash streak across the frame that rembg would have kept. |
| `cast` | round J, `.2` of 3 | Arm raised high, moogle aloft, long black dress, **no ground circle**. The moogle's wings here are canon, not drift. |
| `item` | round J, `.1` of 3 | A blue bottle held up and clearly primary, moogle resting at her hem rather than competing for the read. |
| `hurt` | round K, `.3` of 3 (`--refWeight 0.40`) | The best damage read anywhere in this group. Crouched low, both arms thrown up, mouth open in a cry, moogle still in the raised hand — and the dress is black, fixing the pale grey/white hem that broke her colour identity. |
| `ko` | round K, `.1` of 3 | Face down and limp with the skirt spread flat and the moogle fallen beside her. Replaces a frame that read reclining. |
| `victory` | round K, `.2` of 3 | Arm raised, moogle lifted, dress properly black. Crucially it is *not* the idle pose, which was the judge's complaint about the old frame. |

#### kimahri — 8 states, 7 replaced

`idle` was not flagged and anchors the set.

| State | Variant | Notes |
|---|---|---|
| `attack` | round **L**, `.1` of 3 (`--refWeight 0.40 --refStart 0.45`) | Took three rounds. J and K both produced a Ronso standing politely holding a spear; the thrust only appeared once the weight dropped to 0.4 **and** the pose was re-written as a profile charge (`side view, running spear charge, the spear held level and horizontal at hip height`). Steel spearhead, not the orange flame weapon the judge rejected. |
| `cast` | round J, `.2` of 3 | Spear planted, free hand raised, **magic circle in the air above his palm** rather than a ring on the floor. `glowing blue magic circle in the air` plus banning `magic circle on the floor, ground circle` is what moved it off the ground. |
| `item` | round J, `.1` of 3 | A single potion held out, spear upright in the other paw, no dagger. Mane is short again and the gold pauldrons are gone. |
| `hurt` | round K, `.3` of 3 (`--refWeight 0.40`) | One paw clutched to the chest, spear held back, head turned. Honest caveat: the legs are still planted, so it is a hit *gesture* rather than a stagger. It does clear all three of the judge's notes — the mane and horn match the idle, the spear is held rather than floating detached, and it is no longer the arms-crossed flex that duplicated `victory`. |
| `ko` | round K, `.2` of 3 | Prone with the **face visible in profile** rather than buried in the mane, spear fallen beside him, clean white ground. |
| `victory` | round K, `.3` of 3 | One fist raised high, spear planted upright in the other paw. No crossed arms, no invented skull dressing, no red banner at the feet. |
| `jump` | round K, `.2` of 3 | **Genuinely airborne** — both feet clear and tucked, tail streaming, a single spear drawn back. Fixes "static, no compression" and "a second weapon appears alongside the spear". Carries a **hand-corrected `baselineY` of 1555** against an auto 1190, per the `jump` convention in `cast.json`: he has no ground contact, so the auto value (his lowest paw) would plant him mid-leap. `baselineYAuto` and `baselineNote` are kept in the sidecar. |

#### wakka — 7 states, 3 replaced

`idle`, `attack` and `item` were not flagged. **`victory` was flagged but kept** —
see §6.8.

| State | Variant | Notes |
|---|---|---|
| `cast` | round J, `.1` of 3 | The blitzball is a recognisable blue-and-white ball again rather than the featureless glowing gold orb, and the bright gold ring at the cutout base is gone. The blue energy arc around his raised hand is deliberate: it is the only candidate in six that reads as casting at all, and it matches how Tidus and Auron charge their own weapons (§5.1). Cost: 58.7% opaque and an 825 px-wide crop, the widest sprite in the group. |
| `hurt` | round M, `.3` of 3 | Grimacing, ball in one hand, other arm flung out, vest and headband correct. **This is a stance, not a stagger** — see §6.8. It does fix three of the judge's four notes: the ball is present, the headband is the right weight, and it is no longer a bicep flex. |
| `ko` | round K, `.1` of 3 | Prone on his side, **face clearly visible**, blitzball dropped on the ground beside his head rather than stuck to his hand, pompadour and headband and yellow vest all legible. |

#### rikku — 8 states, 4 replaced

| State | Variant | Notes |
|---|---|---|
| `attack` | round K, `.1` of 3 | Fixes both structural complaints: the claw blades sit in a **knuckle housing** rather than sprouting from the inside of the wrist, and the front foot is planted on the ground so the pose no longer floats. |
| `cast` | round K, `.1` of 3 | The claw is present and clearly readable — the old frame had no claw at all, losing a key identifier — with one hand raised into a magic burst. |
| `hurt` | round M, `.2` of 3 | Both arms visible and crossed at the chest, single correct claw. **A stance, not a stagger** (§6.8). Fixes "left arm is hidden entirely behind the torso" and "claw becomes an oversized gold cuff". |
| `ko` | round L, `.3` of 3 | Took the `NOFLOOR` block plus a ban on `wings, feathers, energy wings, light streaks, debris, machina, machinery, ruins` — round K produced feather-streak halos and a machina backdrop, both opaque. Now face down with one arm flung out, claw still on the hand, clean white ground, and it no longer reads as sleeping. |

### 6.7 The finding worth keeping: when to drop `--ref` entirely

Auron's `attack` would not leave the idle's planted stance at `--refWeight`
0.7, 0.5 **or** 0.38. What fixed it was removing `--ref` from the call.

The reason is worth writing down, because §3 of the pipeline doc frames `--ref`
as a pure win. It is not free: the adapter carries the reference's *posture*
along with its identity, and `--refStart` only delays that, it does not remove
it. For a pose far from the idle — a full lunge, an overhead cut — the pull can
be stronger than anything `--poseTags` can say.

**Dropping `--ref` is only safe once the tag string can carry the costume
alone.** That is exactly what this pass produced: after §6.2 the Auron identity
string spells out the coat drape, the collar, the belt, the gourd and the blade,
so an unreferenced render still comes back as Auron. Early in a subject's life,
when the tags are the loose `cast.json` version, dropping `--ref` just produces
a different character.

So the order is: **fix the tags first, then decide whether the adapter is still
earning its place.** For `attack` and `cast` on a subject with a fully specified
costume, it often is not.

### 6.8 What this pass could not fix

Two honest failures, both worth knowing before someone spends another night on
them.

**`hurt` does not work for Wakka or Rikku.** Four rounds each — `--refWeight`
0.55, 0.4, no `--ref` at all, and a crouch-specific rewrite — produced sixteen
candidates between them and **every single one is a standing pose**. The
promoted frames are the best costume-accurate stances, not recoils.

The likely cause is the shared composition block itself:
`CHARACTER_COMPOSITION` contains the literal word **`standing`**, and for a
subject the checkpoint has no strong "being hit" prior for, that one token beats
several clauses of pose language. It is not a `--refWeight` problem, which is
why lowering it kept not helping.

Two things *did* work elsewhere and are the leads to follow: Lulu's and Tidus's
`hurt` both landed by asking for a **crouch** rather than a stagger (a pose the
model renders readily, and which reads as damaged), and Kimahri's landed as a
clutching gesture. If this is picked up again, the option worth testing is a
fifth `--composition` preset — a `hurt` framing that replaces `standing` with
`crouching, off balance` — rather than more prompt tuning. That is a change to
the shared contract in `comfy.mjs`, so it needs the roster-wide decision §2 of
the pipeline doc describes, and was out of scope here.

**`wakka/victory` was flagged but not regenerated.** The judge's complaint was a
"direct colour-identity break — vest has turned black-and-white where the idle
is yellow". The file on disk has a **yellow** vest, a thumbs-up and the
blitzball, and is one of the better frames in the group. This is the §6.1
stale-snapshot problem again. It was re-read, judged a keeper, and left alone.

### 6.9 Final state

| Subject | States | Replaced | Sheet |
|---|---|---|---|
| `tidus` | 7 | 7 (idle re-anchored) | `docs/screenshots/art/tidus.png` |
| `yuna` | 8 | 5 | `docs/screenshots/art/yuna.png` |
| `auron` | 7 | 7 (idle re-anchored) | `docs/screenshots/art/auron.png` |
| `kimahri` | 8 | 7 | `docs/screenshots/art/kimahri.png` |
| `wakka` | 7 | 3 | `docs/screenshots/art/wakka.png` |
| `lulu` | 7 | 6 | `docs/screenshots/art/lulu.png` |
| `rikku` | 8 | 4 | `docs/screenshots/art/rikku.png` |

**39 of 52 sprites replaced.** `tools/gen/qc.py` reports `ok` on all 52 — no
halos, no retained backgrounds, no semi-transparent fringe — with two expected
`DANGLE` warnings: `kimahri/jump` (hand-corrected, §6.6) and `rikku/ko` (a prone
frame, exempt by the `ko` convention in the pipeline doc §5).

No numbered variants and no `*.raw.png` remain under `public/art/characters/`
for this group **except** `rikku/{koJ,hurtJ}.*`, which belong to another session
(§6.5) and were deliberately left in place.

`tools/gen/cast.json` was **not** edited — it is shared and other groups are
working from it — but the tag and negative strings in §6.2 are strictly better
than the rows it carries for these seven subjects, and folding them in is the
obvious next change for whoever owns that file.

---

## 7. Third fix pass (2026-09-17) — judge round 3

A third independent judge scored **23 states** in this group below 7. No idle
was flagged, so every idle was kept and every regeneration was pinned to it.
All 23 flagged states were regenerated and all 23 were replaced.

Rounds run: **N** (all 23 states, `--batch 3`), **P** (the 12 states N could not
land, `--batch 3`), **Q** (the 3 states P could not land, `--batch 4`).
89 candidates in about 30 minutes of GPU time — the machine was idle this time,
so a single 832x1216 render took 13–45 s instead of §6.4's 90–170 s.

### 7.1 The judge's list was current this time — but it was still re-read first

§6.1 taught that a score list is a pointer, not a description. That check was
run again: `tidus/{cast,hurt,victory}`, `kimahri/{idle,cast}`, every idle in the
group and a sample of the rest were opened before anything was queued. This time
the complaints matched the files on disk exactly — the ghosted second blade in
`tidus/cast`, the two katanas in `tidus/victory`, the two-horned oni in
`kimahri/cast`. The check cost five minutes and is still worth doing.

One judgement in the list was inverted against the idle and was **not**
followed: the judge said Lulu's `attack` skirt was wrong because `cast` and
`victory` show "a narrow armoured mermaid gown". The **idle** wears the wide
floor-length belt-stack skirt, so `attack` was right and `cast` was the drifted
one. This pass moved `cast` toward the idle rather than `attack` away from it.

### 7.2 Four findings, in order of how much they were worth

**1. `magic circle` in the NEGATIVE suppresses magic circles. This was the
single biggest cause of the judge's complaints.** Round N inherited a negative
block containing `magic circle on the floor, ground circle, magic circle on the
ground` — phrasing meant to keep the effect off the floor. CLIP does not read
"on the floor"; it reads the tokens, and `magic circle` in the negative deletes
the spell. Every `cast` frame in round N came back as a figure standing with a
weapon and no effect, which is verbatim the judge's "no casting gesture and no
spell VFX" on six different states.

The cure is to ban the floor effect with words that do not contain the phrase:

```
glowing floor, rune on the floor, standing on a glyph, light pillar,
large aura, full screen effect, glowing background, colored background,
halo, mandala, energy explosion, two circles, three circles
```

and to say it plainly in the positive, in Danbooru register rather than English
prose: `casting spell, magic, magic circle, a glowing blue magic circle hovering
in the air in front of his raised open palm, light particles, arm up, open palm,
fingers spread`. Round P landed a readable spell on the first batch for Tidus,
Kimahri and Lulu after three rounds of failure.

**2. `--composition boss` is the missing `hurt`/`jump` framing.** §6.8 blamed
the literal word `standing` inside `CHARACTER_COMPOSITION` for every `hurt`
frame that came back as a second idle, and proposed a fifth composition preset —
a change to the shared contract, out of scope. It turns out one already exists:
`BOSS_COMPOSITION` is `straight-on, full body, centered, imposing, simple
background, white background` — the same house framing **without** `standing,
feet visible`. Passing `--composition boss --size 832x1216` to a character
render is inside the contract and needs no roster-wide decision.

It is what finally produced `kimahri/jump` genuinely airborne (three of three
candidates left the ground, against zero of three at `full`) and `wakka/hurt`
doubled over. Use it for `jump` and for any `hurt` that will not break.

**3. Weapon duplication needs `afterimage` in the negative, not just
`two swords`.** Nine of the 23 complaints were duplicate or ghosted weapons, and
`tidus/cast` in particular had "a ghosted second blade fanning out in
translucent pink/cyan" — which is not a second object the model drew, it is a
motion-blur artefact. The block that killed it:

```
two weapons, dual wielding, second weapon, extra weapon, duplicate weapon,
two swords, two staves, two spears, two katana, holding two weapons,
floating weapon, detached weapon, weapon floating in the air, afterimage,
double exposure, ghost image, transparent duplicate, motion blur, mirrored copy,
weapon on the back
```

`afterimage, double exposure, ghost image, transparent duplicate, motion blur`
are the new half and are the half that matters. It is now on **every** state in
the group, not only the ones that had drifted, and duplicates dropped from about
40% of candidates to roughly one in eight.

**4. §6.3's "a weapon in `--tags` beats a potion in `--poseTags`" is absolute,
not a tendency.** `kimahri/item` and `auron/item` were re-run in round N with the
spear and the katana still in the identity string and a potion in the pose
string: **six candidates, zero bottles.** Round P removed the weapon from
`--tags` and added `spear, polearm, lance, staff, pole, weapon, holding a spear`
to the negatives; both landed a readable bottle immediately. Always split a
separate identity string for `item`.

### 7.3 What did not work

- **Auron's coat will not render crimson.** Salmon/coral across 13 candidates in
  three rounds, at `--refWeight` 0.5, 0.55, 0.65 and 0.72, with no `--ref` at
  all, with `dark crimson / scarlet / blood red` spelled out, with `salmon,
  coral, peach, orange, pastel colors, washed out colors` banned, and with the
  approved idle's own verbatim tag string (round Q) — which is the one string
  that has ever produced a true red on this checkpoint. It did not reproduce.
  The likely cause is the shared `STYLE_TAGS` (`vibrant colors, rim lighting`)
  lifting a saturated red, which is a contract-level issue and out of scope.
  The promoted frames are the reddest available.
- **`yuna/summon` multiplies the staff whenever it is raised.** Seven candidates
  across rounds N, P and Q: raised in one hand a second staff appears; raised in
  both hands a second staff appears; planted with the spell overhead (round Q)
  and the whole frame fills with opaque ribbon masses. The promoted frame holds
  a single correctly-attached staff and loses the summoning VFX.
- **Lulu's moogle either fuses into the skirt or stands on the floor as a second
  character.** Round N's `item` put a moogle on the ground in all three
  candidates; round P did the same in two of three despite `moogle standing on
  the ground, moogle on the floor, moogle at her feet, cat, kitten, pet, chibi
  creature, second character` in the negative. The promoted `item` has no moogle
  at all, which is the least-bad of the three failure modes.
- **A pained *face*** remains out of reach for most of the cast. The crouch
  ("doubled over, torso hunched forward, one knee dropped, head bowed") is what
  carries the damage read; the expression follows about one time in four.

### 7.4 Settings that worked, by state

| State | `--refWeight` / `--refStart` | Composition |
|---|---|---|
| `attack` | 0.5–0.65 / 0.32–0.38 | `full` |
| `cast` | 0.5–0.6 / 0.32–0.35 | `full` |
| `item` | 0.5–0.6 / 0.32 | `full`, weapon out of `--tags` |
| `hurt` | 0.42–0.5 / 0.36–0.42 | `full`, or `boss` when it will not break |
| `ko` | 0.5 / 0.35 | `prone`, 1216x832, `NOFLOOR` block |
| `victory` | 0.45–0.65 / 0.30–0.36 | `full` |
| `jump` | 0.5 / 0.36 | **`boss`**, 832x1216 |

Kimahri is the one subject that wants a **high** weight everywhere (0.6–0.65).
§4.1 found the same thing and it held again: at 0.4–0.5 the checkpoint re-grows
a second horn and a helmet within one or two candidates. Seven of his eight
states were flagged for exactly that, and putting the weight back up plus
`helmet, horned helmet, crown, circlet, headdress, plume, two horns, pair of
horns, oni, demon` in the negative fixed it. He is the same Ronso in all eight
cells now, which is what the judge was really asking for.

### 7.5 Per-subject results

#### tidus — 3 flagged, 3 replaced

| State | Round / variant | Notes |
|---|---|---|
| `cast` | P, `.1` of 3 (w 0.5 / st 0.34) | The §7.2-1 fix. Left arm raised, palm open, a **blue magic circle hovering above the palm**, the single blue sword held low in the other hand. Ghosted second blade, floating spear tip and both-hands-gloved all gone. |
| `hurt` | N, `.1` of 3 (w 0.42 / st 0.42) | Crouched and hunched with the free hand at his chest, mouth open, sword planted and gripped. Replaces a frame that read as a jump-kick with an impossible hip joint and a third weapon design. |
| `victory` | P, `.1` of 3 (w 0.45 / st 0.36) | Fist punched straight up, eyes closed, wide grin, **one** blue sword held down at his side. The pauldron is back to the idle's scale. |

#### yuna — 4 flagged, 4 replaced

| State | Round / variant | Notes |
|---|---|---|
| `attack` | N, `.2` of 3 (w 0.5 / st 0.38) | Both hands gripping the staff, driving forward low with the shoulders turned, mouth open. Heterochromia clearly readable, floor-length hakama, laced boots (not the flat sandals the judge flagged), staff head matching the idle's gold flower disc. |
| `cast` | P, `.3` of 3 (w 0.5 / st 0.34) | Staff gripped and raised in one hand, free hand open, blue spell curling around her, **both eyes open** — the wink that hid the heterochromia is gone, and so is the second staff. |
| `hurt` | N, `.2` of 3 (w 0.42 / st 0.42) | Head bowed, hand pressed hard to her chest, mouth open, staff held in a closed fist. The best Yuna damage read in the project; replaces a frame where the staff hovered unheld and she appeared to be shielding her eyes from glare. |
| `summon` | P, `.1` of 3 (w 0.5 / st 0.32) | **Honest partial.** Fixes the disqualifiers — one staff, properly gripped, arm correctly proportioned — but see §7.3: no summoning VFX survived. |

#### auron — 3 flagged, 3 replaced

| State | Round / variant | Notes |
|---|---|---|
| `cast` | N, `.3` of 3 (w 0.55 / st 0.32) | **One** katana, held two-handed on a diagonal across the body in a wide braced stance, sunglasses on, focused. Replaces the two-katana frame with the red-and-white banded garment. Coat is red at the shoulders fading coral (§7.3). |
| `item` | P, `.3` of 3 (w 0.6 / st 0.32, weapon out of `--tags`) | A large blue potion held up and unmistakable, gourd on its cord at the hip, **no weapon anywhere in frame** — which is what removed the floating katana and the second pale blade the judge flagged. |
| `hurt` | N, `.2` of 3 (w 0.4 / st 0.42) | Down on one knee, grimacing, coat collapsed forward, single katana gripped. A real damage read rather than the wide-stance swagger, and the three floating blades are gone. |

#### kimahri — 7 flagged, 7 replaced

All seven were flagged for the same thing: he was a different creature in every
cell. See §7.4 on the weight.

| State | Round / variant | Notes |
|---|---|---|
| `attack` | N, `.3` of 3 (w 0.65) | Single forehead horn, white mane, black top with the skull emblem, red sash, the idle's spear. **Identity was chosen over motion here** — this is a planted guard, not the charge round L once landed, because every charging candidate came back as a different animal. |
| `cast` | P, `.1` of 3 (w 0.6) | Spear upright and gripped in one paw, a **glowing blue spell held in the other**. Single horn, on-model. |
| `item` | P, `.3` of 3 (w 0.6, weapon out of `--tags`) | Blue bottle held at chest height in both paws, single horn, red laced greaves. Two spears and the bared-fang muzzle are gone. |
| `hurt` | N, `.2` of 3 (w 0.5 / st 0.40) | Down on one knee, both paws on the planted spear, head low. Costume identical to the idle. |
| `ko` | N, `.1` of 3 (`prone`, 1216x832) | Prone with the **head up in profile and the single horn clearly visible**, spear fallen alongside, tail and legs separable. |
| `victory` | N, `.2` of 3 (w 0.65) | Single spear raised in both paws, roaring. No flaming sword, no plumed headdress. |
| `jump` | P, `.2` of 3 (**`--composition boss`**) | **Genuinely airborne** — body clear of the ground, legs bent under him, mane and tail streaming, one spear drawn back. Carries a hand-corrected `baselineY` of **1520** against an auto **1138** (`baselineYAuto` and `baselineNote` are in the sidecar), per the §5 caveat in the pipeline doc: he has no ground contact, so the auto value would plant him mid-leap. |

#### wakka — 1 flagged, 1 replaced

| State | Round / variant | Notes |
|---|---|---|
| `hurt` | P, `.2` of 3 (**`--composition boss`**, w 0.5 / st 0.36) | The best damage read in the group. Bent double, teeth gritted, **both arms attached** and pulled in tight with the blitzball clutched to his belly. Fixes the grin-and-throw read, the detached forearm and the stray blue blades. The trousers render pale grey-blue rather than the idle's blue-and-yellow — a different miss from the judge's "solid yellow", and the lesser of the two. |

#### lulu — 3 flagged, 3 replaced

| State | Round / variant | Notes |
|---|---|---|
| `attack` | P, `.2` of 3 (w 0.5 / st 0.38) | **The one real trade in this pass.** It is the only frame out of eleven candidates that reads as a strike — body turned, both arms drawing the moogle back past her shoulder, front foot planted. The cost is the lower half: belt-plate panels over armoured legs rather than the idle's floor-length belt-stack skirt. The judge's leading, capitalised complaint was "zero attack motion", so motion won. If a later pass disagrees, round Q's recipe (`--refWeight 0.62`, thrust instead of swing) held the skirt perfectly and produced no motion at all — the two have not been had together in three rounds. |
| `cast` | N, `.1` of 3 (w 0.5 / st 0.35) | **A fireball in her open palm** — real, contained VFX. Plain white moogle (no dragonfly wings, no beret), fur collar, bead necklaces, red iris, and the idle's belt-stack skirt back instead of the plated mermaid gown. |
| `item` | P, `.1` of 3 (w 0.5 / st 0.35) | Blue potion held up and clearly primary, **left hand open and fully visible**, belt-stack skirt with its buckles, no glowing skirt panel. The moogle is absent rather than fused into the fabric (§7.3). |

#### rikku — 2 flagged, 2 replaced

| State | Round / variant | Notes |
|---|---|---|
| `cast` | N, `.3` of 3 (w 0.5 / st 0.35) | Asymmetric — one arm up with a **yellow-green sigil above the open palm**, the other low. The claw is a proper gauntlet on the casting hand rather than blades floating beside her arm, and the short shorts are back. |
| `hurt` | N, `.1` of 3 (w 0.42 / st 0.42) | Bent forward over her own arm, face turned down, claw gauntlet attached to the hand. Replaces the arms-behind-the-head stretch, the two free-floating claws, the cargo capris and the white midriff cloth — all four complaints. |

### 7.6 Final state

| Subject | States | Flagged | Replaced | Sheet |
|---|---|---|---|---|
| `tidus` | 7 | 3 | 3 | `docs/screenshots/art/tidus.png` |
| `yuna` | 8 | 4 | 4 | `docs/screenshots/art/yuna.png` |
| `auron` | 7 | 3 | 3 | `docs/screenshots/art/auron.png` |
| `kimahri` | 8 | 7 | 7 | `docs/screenshots/art/kimahri.png` |
| `wakka` | 7 | 1 | 1 | `docs/screenshots/art/wakka.png` |
| `lulu` | 7 | 3 | 3 | `docs/screenshots/art/lulu.png` |
| `rikku` | 8 | 2 | 2 | `docs/screenshots/art/rikku.png` |

**23 of 23 flagged sprites replaced.** All seven contact sheets rebuilt, each
carrying its portrait as the first row and marking the regenerated cells.

`tools/gen/qc.py` reports `ok` on all 52 sprites — no halos, no retained
backgrounds, no semi-transparent fringe — with one expected `DANGLE` warning on
`rikku/ko`, a prone frame exempt by the `ko` convention in the pipeline doc §5.
Kimahri's `jump` no longer trips it because its `baselineY` is hand-corrected.

Every numbered variant and every `*.raw.png` from rounds N, P and Q was deleted.
`rikku/{koJ,hurtJ}.*` were **again** left in place — they belong to the peer
session described in §6.5 and their sidecar prompts are still not ours.

`tools/gen/cast.json` and `tools/gen/comfy.mjs` were **not** edited. The three
changes worth folding into the manifest by whoever owns it are the negative
blocks in §7.2-1 and §7.2-3, and the `--composition boss` note in §7.2-2 for the
`jump` and `hurt` rows.

---

## 8. Fourth fix pass (2026-09-17) — judge round 2, re-issued

A fix list arrived scoring **42 states** below 7, with `tidus/idle` and
`auron/idle` at 6. It is **the same list §6 already worked** — same subjects,
same scores, same wording (Tidus's "floating shuriken", Auron's missing sake
jug, Rikku's "claw blades sprout from the inside of the wrist", Wakka's
"featureless glowing gold orb", Lulu's "short ruffled skirt with bare legs").
The files on disk are two fix passes newer than the snapshot it describes.

So §6.1's rule was applied before anything was queued: **every flagged frame was
re-read against the file on disk.** That is the main finding of this pass, and
it is now three-for-three — §6.1, §7.1 and §8 have each paid for themselves.

### 8.1 What the re-read showed

**33 of the 42 complaints describe frames that no longer exist.** Examples, all
verified by opening the PNG:

| Complaint | The file on disk |
|---|---|
| `tidus/idle` "canon yellow-and-black one-sleeve overall is gone" | `idleJ` (§6.6) wears the black-and-yellow overalls with the chest bib **and** the canon asymmetric legwear. The tag string in the sidecar spells both out. |
| `tidus/hurt` "purple/blue hooded cape … REGENERATE" | A crouched, hunched recoil in the idle's costume. No cape anywhere in the set. |
| `auron/idle` "no sake jug, katana is a slim standard blade" | `idleK` carries the gourd on a red cord and an oversized nodachi across the shoulder. |
| `rikku/attack` "claw blades sprout from the inside of the wrist" | Proper knuckle housing on a gauntlet, front foot planted, clean fingers. |
| `wakka/victory` "vest has turned black-and-white" | Yellow vest, thumbs-up, blitzball. (§6.8 already recorded this one.) |
| `kimahri/*` "gold pauldrons, orange flame spear, two horns" | One orange horn and a steel spear in all eight cells. |
| `yuna/cast` "gold disc floats detached with no visible staff shaft" | Staff gripped in the raised hand, shaft clearly attached, no ground circle. |

**Nine of the complaints are still true, and re-reading at full resolution found
four more the judge did not mention.** The four are the interesting half:

- **`auron/victory` carries two katanas** — one shouldered, one sheathed in the
  left hand — and wears the coat as a cape over both shoulders. No judge round
  has ever flagged it. Found by opening the file.
- **`lulu/ko` reads as a contented nap**: eyes open, smiling, head on her arm,
  moogle tucked under her hand.
- **`kimahri/item` holds a gem-topped rod**, not a potion; the state is not
  readable.
- **`auron/cast`, `auron/item` and `auron/hurt` drift the lower body** from the
  idle's dark grey trousers to a pale hakama-style skirt. `item` was judged a
  keeper anyway (the bottle and the gourd both read); the other two were not.

### 8.2 Rounds run

**R** (13 states, `--batch 3`), **S** (7 states), **T** (2 states). 61
candidates, six replacements.

### 8.3 The GPU was shared with six other sessions, and it cost most of the round

`Get-CimInstance Win32_Process` showed **six `comfy.mjs` producers belonging to
other groups** (`yunalesca-1`, `yunalesca-3`, `seymour-flux-body`,
`mortiorchis`, `braskas-final-aeon-2`, `yu-yevon`) sharing the single ComfyUI
queue. §6.4 blamed three-lanes-plus on this session's own concurrency; that was
only half of it. **The queue is global, so "three producers is the sweet spot"
means three producers _on the machine_, not three per session.** With nine or
ten in flight a single render waited 15–25 minutes and `waitForResult`'s
hard-coded 900 s deadline fired: **seven prompts timed out**, and a timeout
aborts the rest of that state's batch, so several states came back with one
usable variant instead of three.

**A timed-out prompt still finishes server-side.** `comfy.mjs` gives up on the
client, but ComfyUI has already written the PNG and `/history/<id>` still holds
it. All seven were recovered with a ~30-line helper that refetches the image by
prompt id, runs `tools/gen/rembg.py` over it and writes the sidecar from the
submitted graph. That salvage produced `auron/hurtR.2`, `auron/koR.1`,
`kimahri/hurtR.3`, `kimahri/itemR.2`, `lulu/attackR.2`, `lulu/victoryR.1` and
`yuna/summonR.2` — **and `lulu/victoryR.1` is one of the six frames promoted in
this pass.** If a lane dies with `Timed out waiting for prompt <id>`, do not
re-roll it; go and fetch it.

`tools/gen/comfy.mjs` was **not** edited — it is shared — but a
`COMFY_WAIT_TIMEOUT` env override on that 900 s constant is the obvious change
for whoever owns it.

One render was also lost to a different shared-tree hazard: `kimahri/castR.1`
failed with `FileNotFoundError: …castR.1.raw.png` because another session's
cleanup removed the `*.raw.png` between the fetch and the `rembg` call.

### 8.4 Per-subject results

#### auron — 4 genuinely weak, 3 replaced

| State | Round / variant | Notes |
|---|---|---|
| `hurt` | R, `.1` of 3 (w 0.42 / st 0.40, `--composition boss`) | **The best Auron damage frame in the project.** Doubled over, one hand braced on the knee, teeth bared, sunglasses on, coat off one shoulder with the empty sleeve hanging, dark grey trousers and brown boots, a **single** katana held point-down. Replaces a frame that had a second blue-wrapped shaft behind the shoulder, two sake gourds lying detached on the ground and a baked ground shadow. |
| `ko` | S, `.3` of 3 (w 0.5 / st 0.35, `prone`, 1216x832) | Face clearly visible with the sunglasses still on, gloved hand limp, coat spread, legs separable, one katana lying flat beside him, clean white ground. Replaces the frame where a red pole and the katana crossed through the torso. Round R is why `ribbon curtain, hanging cloth, streamers, banners, falling cloth, paper strips` is now in his KO negatives: `koR.1` came back as a **full-frame curtain of red and blue ribbons** with Auron an inch tall in the corner. |
| `victory` | S, `.3` of 3 (w 0.5 / st 0.32) | **One** weapon, the coat worn off one shoulder, the gourd on its cord, sunglasses, chin up. Fixes the undetected two-katana defect in §8.1. Honest caveats: the coat renders coral rather than crimson (§7.3, still unfixed) and the sword is slung diagonally behind the back rather than resting on the shoulder. |
| `cast` | **not replaced** — 7 candidates over R, S and T | See §8.5. |

#### kimahri — 4 genuinely weak, 1 replaced

| State | Round / variant | Notes |
|---|---|---|
| `hurt` | R, `.1` of 3 (w 0.6 / st 0.42, `--composition boss`) | Down on one knee with the spear planted and firmly gripped. The point of the swap is identity: the frame it replaces had a **black** horn where every other cell has the short orange one, and an ornate double-ended spearhead where the idle has a plain red shaft. Three of the judge's four notes clear. **Known defect:** the spearhead runs off the top-left canvas corner, so `tools/gen/qc.py` reports `BG-RETAINED` on the one opaque corner pixel. A round-S retry at `--composition full` produced a duplicate spear instead, so this stands. |
| `attack`, `item`, `cast` | **not replaced** | See §8.5. |

#### lulu — 3 genuinely weak, 1 replaced

| State | Round / variant | Notes |
|---|---|---|
| `victory` | R, `.1` of 3 (w 0.5 / st 0.32) — **salvaged from a timed-out prompt** | The moogle held up in the raised hand with a readable face (dot eyes, red cheeks, red pom), a real smile, floor-length black belt skirt, red iris. Fixes the judge's load-bearing complaint that the old frame was "nearly identical to the idle, so it does not signal victory" — the old one stood with both arms down in a narrow fishtail gown. The dress still reads closer to charcoal than true black. |
| `attack`, `ko` | **not replaced** | See §8.5. |

#### wakka — 1 genuinely weak, 1 replaced

| State | Round / variant | Notes |
|---|---|---|
| `cast` | R, `.2` of 3 (w 0.55 / st 0.34) | The old frame wrapped him in a **frame-filling opaque white-and-blue water ring** that rembg kept whole — 58.7% opaque, crop box on all four canvas edges — with the ball held low in the wrong hand and the trousers gone orange. The new one has the blue-and-white blitzball raised in one hand, mouth open shouting, the idle's blue-and-yellow trousers, sandals and dolphin necklace, and a clean 702x1197 cutout. Cost: no spell VFX at all, which is the §5.1 "Wakka charges his own weapon" compromise taken one step further. |

#### tidus, yuna, rikku — 0 replaced

All 16 of their flagged states were re-read and kept. Tidus's seven are the
round J/K set and are the most internally consistent subject in the group:
yellow hooded vest, black-and-yellow overalls with the chest bib, blue right
pauldron, red-and-black armoured right arm, asymmetric legwear and the turquoise
Brotherhood in every cell that holds a weapon. Rikku's four complaints are all
stale. Yuna's `summon` is discussed below.

### 8.5 What this pass could not fix

Seven states were regenerated and **kept as they were**, because every candidate
was worse than the file on disk. Recording the recipes so the next pass does not
re-run them.

- **`auron/cast` — 7 candidates.** Round R (`--ref` at 0.55) produced three
  frames with the katana lowered. Rounds S and T dropped `--ref` entirely per
  §6.7, and that **produced a true crimson haori for the first time in the
  project** — §7.3 called that unfixable across 13 candidates, and the answer is
  that the IP-Adapter was carrying the reference's washed red all along. But
  without the adapter the coat is worn as a **cape over both shoulders**, and
  `cast.json` is explicit: *if both arms are in the sleeves, reject.* The file on
  disk keeps the one-shoulder drape and drifts the lower body to a pale hakama
  skirt instead. The drape won. **The lever nobody has tried: keep `--ref` off
  for the colour and put the drape in via `--img2img` from the approved idle.**
- **`kimahri/attack` — 6 candidates over R and S**, at weight 0.6/0.48 and start
  0.40/0.46, under `--composition boss`. Every one is a Ronso standing holding a
  spear. §7.5's round-L charge has not been reproduced since. Worse, `boss`
  framing on Kimahri twice produced a **bust-shot crop with the legs cut off** —
  so §7.2-2's "use `boss` for anything that will not break" does not generalise
  to him.
- **`kimahri/item` — 9 candidates over R, S and T.** At `--refWeight` 0.6 the
  adapter copies the idle's gripping paws and both hands come back empty. With
  no `--ref` the bottle appears but the Ronso does not: long curved horns, a
  short blue mane, gold pauldrons, and an **amber liquor bottle** rather than a
  potion. At 0.5 (`itemT.2`) the bottle is finally readable — and the gold
  pauldrons and the long horn come with it, which is verbatim what the judge
  rejected the current frame for. There is no setting between "no item" and "not
  Kimahri". Next lever: `--img2img` from the current frame with the rod painted
  over as a blue bottle.
- **`lulu/attack` — 5 candidates.** At `--refWeight` 0.55 the skirt turns into a
  split gown over bare legs; at 0.62 she stops attacking. One candidate returned
  a **full-frame rainbow field** that rembg kept whole; another grew two giant
  moogle heads in the top corners. The file on disk keeps the strike and loses
  the skirt, which is the trade §7.5 already made deliberately.
- **`lulu/ko` — 3 candidates.** All three still read as reclining and posing,
  and two sat her in a coloured puddle. `sleeping peacefully, napping, resting,
  head on her arm, hand under cheek, propped up on one elbow, reclining,
  seductive` in the negative did not move it. A prone female figure on this
  checkpoint has a very strong "lying down prettily" prior.
- **`yuna/summon` — 2 candidates.** The §7.3 curse holds in both directions:
  raise the staff and its head crops off the canvas (`summonR.2`); put the spell
  above the free palm and **the staff disappears entirely** (`summonR.1`).
  `summonR.1` is otherwise the best Yuna frame produced here — a real glowing
  magic circle over an open palm, floor-length hakama, clean hands, no invented
  cape — but a summoner's summon without her khakkhara is not promotable, and it
  cut to 603x725, two thirds the height of her other cells, which would render
  her visibly smaller in-engine.
- **`kimahri/cast` — 0 usable candidates.** Its one round-R render was lost to
  the `*.raw.png` race in §8.3. The file on disk keeps a faint ground shadow
  baked into the cutout; unchanged.

### 8.6 Final state

| Subject | States | Genuinely weak | Replaced | Sheet |
|---|---|---|---|---|
| `tidus` | 7 | 0 | 0 | `docs/screenshots/art/tidus.png` (unchanged) |
| `yuna` | 8 | 1 | 0 | `docs/screenshots/art/yuna.png` (unchanged) |
| `auron` | 7 | 4 | 3 | `docs/screenshots/art/auron.png` **rebuilt** |
| `kimahri` | 8 | 4 | 1 | `docs/screenshots/art/kimahri.png` **rebuilt** |
| `wakka` | 7 | 1 | 1 | `docs/screenshots/art/wakka.png` **rebuilt** |
| `lulu` | 7 | 3 | 1 | `docs/screenshots/art/lulu.png` **rebuilt** |
| `rikku` | 8 | 0 | 0 | `docs/screenshots/art/rikku.png` (unchanged) |

`tools/gen/qc.py` reports `ok` on 51 of the group's 52 sprites. The exceptions
are `kimahri/hurt` (`BG-RETAINED`, the clipped spearhead above) and `rikku/ko`
(`DANGLE-90px`, a prone frame, exempt by the `ko` convention in
`docs/ART-PIPELINE.md` §5).

Every round R/S/T numbered variant and every `*.raw.png` under this group's
folders was deleted. `rikku/{koJ,hurtJ}.*` were **again** left in place — §6.5,
they are still another session's. `mortiorchis/`, `yunalesca-1/` and
`yunalesca-3/` raw files seen during cleanup were left alone for the same
reason.

Judging sheets for this pass are `docs/screenshots/art/_v-pick-{R,S,T}-*.png`.
`tools/gen/cast.json` and `tools/gen/comfy.mjs` were not edited.

### 8.7 Appendix — the timeout salvage helper

Kept here rather than in `tools/gen/` because that folder is shared and this is
a recovery aid, not part of the pipeline. Run it from the repo root with the
prompt id `comfy.mjs` printed when it gave up, and the path the variant should
have had. Every other session hitting `Timed out waiting for prompt` on a busy
GPU can use it as-is.

```js
// salvage.mjs — recover a render whose prompt completed after comfy.mjs gave up.
// node salvage.mjs <promptId> public/art/characters/<id>/<state>.<n>.png
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const [, , promptId, outPath] = process.argv;
const BASE = 'http://127.0.0.1:8188';

const hist = await (await fetch(`${BASE}/history/${promptId}`)).json();
const entry = hist[promptId];
if (!entry) { console.error('no history for', promptId); process.exit(2); }

const imgs = [];
for (const node of Object.values(entry.outputs || {}))
  for (const i of node.images || []) imgs.push(i);
if (!imgs.length) { console.error('no images for', promptId); process.exit(3); }

const q = new URLSearchParams({
  filename: imgs[0].filename,
  subfolder: imgs[0].subfolder || '',
  type: imgs[0].type || 'output',
});
const buf = Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());

const raw = outPath.replace(/\.png$/i, '.raw.png');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(raw, buf);

const r = spawnSync(
  'D:/Tools/ComfyUI/python_embeded/python.exe',
  ['-s', 'tools/gen/rembg.py', '--in', raw, '--out', outPath, '--margin', '16'],
  { encoding: 'utf8' },
);
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');

// The submitted graph is in the history entry, so the sidecar is reconstructable.
const g = entry.prompt?.[2] || {};
const meta = JSON.parse(r.stdout || '{}');
const k = g['3']?.inputs || {};
writeFileSync(outPath.replace(/\.png$/i, '.json'), JSON.stringify({
  ...meta,
  seed: k.seed, steps: k.steps, cfg: k.cfg,
  sampler: k.sampler_name, scheduler: k.scheduler,
  prompt: g['6']?.inputs?.text,
  negative: g['7']?.inputs?.text,
  model: 'animagine-xl-4.0-opt.safetensors',
  salvagedFrom: promptId,
  generatedAt: new Date().toISOString(),
}, null, 2));
console.log('salvaged', outPath);
```

Two things to know about it. The node ids (`3` sampler, `6` positive,
`7` negative) are the ones `baseTxt2Img` in `tools/gen/comfy.mjs` builds, so the
sidecar reconstruction breaks if that graph is renumbered. And ComfyUI keeps
history in memory only — restart it and the finished renders are gone, so
salvage before you restart anything.

## 9. Fifth fix pass (2026-09-17) — judge round 3 list, and the coral-coat cause

A three-item list arrived: `auron/ko` 5, `auron/victory` 5, `kimahri/hurt` 6.
This pass was **resumed from a run that was cut off mid-flight** — it left
`auron/{koV,victoryV}.1-4` on disk with no log entry and nothing promoted. Those
eight were re-read and judged alongside the new rounds rather than discarded.

### 9.1 The re-read, again (§6.1, now four-for-four)

| Judge's complaint | The file on disk |
|---|---|
| `ko` "figure jammed into the bottom-left corner, ~60% of the cell empty" | **Stale.** The body spans the full 1216 px width. |
| `ko` "sword reads as a hilt and wrap with no visible blade" | **Stale.** A full silver blade is drawn. |
| `ko` "body scale much smaller than every other cell" | **Stale.** |
| `ko` "legs and right boot clipped by the right edge" | **True.** The crop box runs to x=1216, the canvas edge. |
| `victory` two katanas / disembodied pale blade / two gourds / coat as a detached cape / purple-tinted hair / pale boots / static idle stance | **All six true.** Verified at full resolution. |
| `hurt` two tails / no hand on the spear / bulkier than the idle / loincloth differs | **All four true.** |
| `hurt` "both horns full-length; canon Kimahri's horn is a snapped stump" | **True of canon, and true of the idle too** — see §9.5. |

### 9.2 The finding: the coral coat was never a prompt problem

§7.3 recorded "Auron's coat renders coral rather than crimson" as unfixed after
three passes of negative-prompt work (`orange coat, salmon coat, coral, peach,
vermilion, light red` have all been in `--negAdd` since §7). None of it moved.

**The coral is the idle's, and IP-Adapter was carrying it into every state.**
`public/art/characters/auron/idle.png` is coral, and §3 of the pipeline doc
already says the adapter transports local surfaces and not just identity
("material bleed"). A colour cast is exactly that, and `--refEnd 0.85` does not
clear it because the coat is the largest surface in the frame — the last four
steps repaint texture, not hue.

Round W dropped `--ref` entirely, per §6.7, and **the first variant came back in
true deep crimson** with dark grey trousers and a black frog-clasped vest. Round
Z, also unreferenced, did the same for `ko`. Twelve referenced candidates across
rounds V, X and Y were coral without exception; seven unreferenced candidates
across W and Z were crimson without exception. That is not a seed effect.

So §6.7's rule extends: **drop `--ref` when the reference is wrong about
something, not only when it is fighting the pose.** The whole point of an anchor
is that everything downstream inherits it — including its mistakes, which is the
caveat §3 of the pipeline doc already warns about, now with a worked example.

### 9.3 Rounds run

| Round | Subject / state | Settings | Variants |
|---|---|---|---|
| V | `auron/{ko,victory}` | ref 0.58-0.62 / st 0.30 | 8 (inherited from the cut-off run) |
| X | `auron/{victory,ko}`, `kimahri/hurt` | ref 0.52-0.62 / st 0.32-0.40 | 12 |
| Y | `auron/victory`, `kimahri/hurt` | ref 0.55 / st 0.38-0.45 | 8 |
| Z | `auron/ko`, `kimahri/hurt` | **no `--ref`**, `--composition boss` for ko | 8 |
| W | `auron/victory`, `kimahri/hurt` | **no `--ref`**, `--composition full` | 7 |

43 candidates, two replacements.

### 9.4 Per-subject results

#### auron — `victory` replaced, `ko` kept

| State | Round / variant | Notes |
|---|---|---|
| `victory` | **W, `.1` of 4, seed 1868029568, no `--ref`** | Deep crimson haori worn off one shoulder with the bare shoulder and the empty sleeve both reading, black high-collared vest with white frog clasps, yellow belt, dark grey trousers, dark boots, black gloves, sunglasses, grey-streaked black hair, smirk, and **one** katana with the gloved fingers visibly closed on the grip, swept down and out to the side. Clears all six judge complaints. **Cost:** no gourd — a blue tassel hangs where the gourd should be. `victoryV.3` was the runner-up and the only candidate in 20 that kept the gourd, but it is coral with pale trousers. |
| `ko` | **not replaced** — 12 candidates over V, X and Z | See §9.6. |

#### kimahri — `hurt` replaced

| State | Round / variant | Notes |
|---|---|---|
| `hurt` | **W, `.3` of 3, seed 1947763365, no `--ref`** | Down on one knee, head low, scowling, **one** tail, and one blue paw closed hard around the red spear shaft with the whole spear inside the frame. Black sleeveless top with the white skull emblem, red waist sash, blue hakama — the idle's costume, which is the point: the frame it replaces had a gold belt ring and a different sash. Fixes four of the judge's five notes. Also fixes the `BG-RETAINED` that §8.4 shipped knowingly, so **`tools/gen/qc.py` now reports `ok` on all 15 sprites across both subjects.** **Cost:** the spearhead is red-and-white rather than the idle's plain silver leaf, and the spear runs flush to the top and bottom of the canvas (still `ok` — no opaque corner). `hurtY.1` was the runner-up: cleaner framing and a silver leaf head, but the chest emblem drifted to a gold knot and the greaves went silver, which is two costume drifts against W.3's one. |

### 9.5 The Kimahri horn is a real canon error, and it is not this pass's to fix

`research/visual-bible.md` §1.6 is explicit: Kimahri's horn is **broken**, a
stump, and §1.21's icon crop is built around it. Every cell in the sheet —
including the `idle` that anchors them — has a full, intact, pointed orange
horn. The judge is right.

It was left alone deliberately. The `idle` did not score below 7, and the fix is
not one frame: it is a new `idle`, then all eight states re-cut against it,
because the horn is the silhouette. **That is its own pass and it should be
scheduled as one.** Fixing `hurt` alone would have made `hurt` the only cell in
the set with the canon horn, which is worse than a consistent error.

### 9.6 What this pass could not fix

**`auron/ko` — 12 candidates, none promotable.** The state has a very strong
attractor on this checkpoint and every lever made something else worse:

- **Referenced (V, X):** `koX.1` and `.2` came back with a grey cloud mass and
  an opaque background; `koX.3` produced **six floating swords**; `koX.4` a
  propped-up recline with a cord trailing off like a fishing line; `koV.2` a
  frame-filling fur blob. Adding `many swords, a forest of swords, swords stuck
  in the ground` to the negatives did not stop it — the swords arrived anyway.
- **Unreferenced (Z):** the colours came out right for the first time, but
  `koZ.3` **added three other people standing over him** (legs and hands only,
  straight through the multi-subject negatives), `koZ.4` filled the frame with
  **disembodied gloved hands**, and `koZ.1` — clean, crimson, whole body inside
  the frame, one katana lying separately on the ground, every judge complaint
  resolved — has him **propped on one elbow with his eyes open, looking at the
  viewer**. Zoomed in on the face it is unmistakably conscious. A KO frame that
  reads as a character portrait is not a KO frame, so it was not promoted.

The file on disk stays. Its true defect is the one the judge named last: the
boots run to the right canvas edge. Everything else on that list describes a
frame that has not existed since §8.

**The sheet is now two reds.** `victory` is canon crimson; the other six Auron
cells are the idle's coral. This is the §9.2 finding arriving as a cost. The
honest fix is to **re-shoot `auron/idle` unreferenced until it is crimson, then
cascade all six remaining states off it** — which is exactly the order §7 of the
pipeline doc prescribes and exactly what nobody has done, because the idle keeps
not being the thing that scores below 7. Recommend scheduling it explicitly.

### 9.7 Final state

| Subject | States | Replaced | qc | Sheet |
|---|---|---|---|---|
| `auron` | 7 | 1 (`victory`) | 7/7 `ok` | `docs/screenshots/art/auron.png` **rebuilt** |
| `kimahri` | 8 | 1 (`hurt`) | 8/8 `ok` | `docs/screenshots/art/kimahri.png` **rebuilt** |

Judging sheets: `docs/screenshots/art/_v-pick-W-auron-victoryW.png` and
`docs/screenshots/art/_v-pick-W-kimahri-hurtW.png`.

Every round V/W/X/Y/Z numbered variant and every `*.raw.png` under
`public/art/characters/{auron,kimahri}/` was deleted; both folders now hold only
`<state>.png` and `<state>.json`. `tools/gen/cast.json` and
`tools/gen/comfy.mjs` were **not** edited — the tag and negative changes above
live in the sidecars, and `cast.json` should be updated by whoever owns the
crimson-idle re-render, since that is when the identity string changes for good.
