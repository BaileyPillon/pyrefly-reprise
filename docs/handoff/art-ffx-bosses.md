# Art handoff — group `ffx-bosses`

The FFX endgame boss run: Seymour Flux (split body + mount), Yunalesca's three
forms, Braska's Final Aeon's two forms with its Yu Pagodas, Yu Yevon, and human
Jecht. Everything was rendered through `tools/gen/comfy.mjs` on Animagine XL 4.0
Opt against the shared style contract — `STYLE_TAGS`, `QUALITY_TAGS` and the
composition blocks in `comfy.mjs` were **not** touched — cut out with
`isnet-anime`, and judged per `docs/ART-PIPELINE.md` §6.

## How this group was chained

1. **`jecht` first.** He is human, so he anchors the whole group: `cast.json`
   makes his `idle` the `--ref` for `braskas-final-aeon-1`, which in turn is the
   `--ref` for `braskas-final-aeon-2`. His idle was rendered `--batch 4` with no
   reference and judged hardest.
2. **`yunalesca-1/idle`** is the palette and face anchor for forms 2 and 3.
   Form 2 takes it at the default `--refWeight 0.65` (she is still recognisably
   the same woman); form 3 at `0.45`, because at 0.65 the human silhouette
   fights the gorgon body — `cast.json`'s own note, confirmed in the rolls.
3. **`seymour-flux-body`** is `--ref`'d at the already-approved
   `public/art/characters/seymour-flux/idle.png` so the face and hair match the
   concept the proof-of-concept round kept.
4. **Every other state** is `--ref`'d at its own subject's approved `idle` at
   `--refStart 0.25`, `--batch 3`.

## Calibration: `--refEnd 0.70`, not the 0.85 default

`docs/ART-PIPELINE.md` §3 predicts "material bleed" at the end of the denoise
and offers `--refEnd` as the cure. On this group it was not a subtlety — it was
the difference between usable and not. Jecht's first `--ref` pass at the default
`--refEnd 0.85` came back with every state in a glossy, oversaturated,
rainbow-on-the-blade finish that no longer matched its own idle: consistent in
*identity* and inconsistent in *material*, which is the failure the flag exists
for.

A/B on a fixed seed (473552066), Jecht `victory`, reference = his approved idle:

| Setting | Result |
| --- | --- |
| `--refEnd 0.85` (default) | Neon skin, iridescent blade, chrome-blue shorts, rim light blown out |
| `--refEnd 0.70` + anti-gloss `--negAdd` | Natural skin ramp, flat blade, grey shorts, identity and costume unchanged |

**Every `--ref` render in this group therefore uses `--refEnd 0.70`** plus this
shared `--negAdd` fragment:

```
glossy, oversaturated, neon, chromatic aberration, lens flare, metallic sheen, rainbow gradient
```

This is a per-invocation flag and a per-shot negative — the shared style and
quality blocks are untouched, so nothing here obliges a roster re-render.

## Deviations from `tools/gen/cast.json`

`cast.json`'s identity tags for this group predate a close read of
`research/visual-bible.md` §1.8–§1.12 and contradict it in several places. The
bible won, per the task's quality bar.

| Subject | `cast.json` said | Rendered instead (bible §) |
| --- | --- | --- |
| `yunalesca-1/-2/-3` | "blonde hair, white dress, gold trim" | **silver hair**, **blue-and-black bikini top**, **black thong**, **green Yevon sashes**, gold bracelets, blue armbands, barefoot — she is nearly nude, not gowned (§1.9) |
| `braskas-final-aeon-1` | "grey skin, spiky hair, red and black" | **brown scales**, **white hair tufts**, enlarged **red headband**, **white** Abes tattoo, normal right arm + **oversized left claw**, black sword with **red dolphin markings** (§1.10) |
| `jecht` | "short hair, open vest, black vest" | **long unruly black hair**, **no shirt**, **red eyes**, **orange-and-red sash over the right leg only**, **pauldron and gauntlet on the left arm only**, barefoot (§1.11) |
| `yu-yevon` | "insect, spider, translucent" | **floating tick/parasite**, **curling hooks**, and a flat **gold Yevon glyph disc where the face should be** (§1.12) |
| `yu-pagoda` | "stone pillar, pagoda, guardian statue" | **three tapering tiers**, stone-and-gold with **ringed tiers and hanging bells**, floating (§1.10) |
| `mortiorchis` | "floating skull, insect, mandibles" | **wide brass-and-bone ribcage reliquary** with a **hollow green-lit centre** and **two curved scythe arms** (§1.8) |

`cast.json` is a work order, not a config file, and nothing reads it at runtime,
so it was left unmodified — these corrections live in the commands logged below.

---

## Run 2 (2026-09-16) — resumed after the first run was cut off

The first run left numbered variants and no promoted `<state>.png` for several
subjects. This run judged what was there, re-rolled what failed, and finished
the group. Settings unchanged from Run 1 except where noted: `--refStart 0.25`,
`--refEnd 0.70`, and the shared anti-gloss `--negAdd` fragment
`glossy, oversaturated, neon, chromatic aberration, lens flare, metallic sheen, rainbow gradient`.
`STYLE_TAGS` / `QUALITY_TAGS` / the composition blocks were **not** touched.

One addition to the shared per-shot negative this run, `NOBG`:

```
magic circle, mandala, halo, stained glass, ornate background, glowing background,
sunburst, motion lines, speed lines, aura, fog, mist, smoke
```

Reason: `cast.json`'s stock `cast` pose tags say "glowing magic circle", and on
this checkpoint that paints an opaque disc behind the figure which `isnet-anime`
keeps — the exact failure §6.4 of the pipeline doc describes. The `cast` pose
was reworded to "raising both arms, summoning dark energy, energy gathering in
the hands" for every subject in this group.

### `seymour-flux-body` — idle, attack, cast, hurt, ko

Run 1's four `idle` variants were all rejected: 86–98 % of every frame came back
opaque because the prompt carried `dark aura` and the IP-Adapter reference
(`seymour-flux/idle.png`) is itself a winged figure on an opaque painted
backplate. The reference propagated its backplate, not just its face — the
caveat at the end of §3 of the pipeline doc, in its most expensive form.

Two levers fixed it, and the second is the one that mattered:

| Attempt | `--refWeight` | `--refEnd` | Result |
| --- | --- | --- | --- |
| Run 1 | 0.65 | 0.85 | 86–98 % opaque, no bone frame, robed winged demon |
| Run 2a | 0.55 | 0.70 | 84–85 % opaque — still the reference's backplate |
| Run 2b | **0.35** | **0.60** | **38–47 % opaque, clean cutout, identity intact** |

`dark aura` was also dropped from `--tags` and this went into `--negAdd`:
`cape, cloak, huge collar, wings, feathers, banner, dark background, black background`.

- **idle** — variant 1 of 3 at seed 1759074900, `--ref seymour-flux/idle.png
  --refWeight 0.35 --refEnd 0.60`. Pale slender torso, light blue hair with the
  two horn-like locks and the forward bang, purple eyes, bare chest with the
  leonine tattoo, dark blue robe with red trim, bright green sash, arms flung
  wide, robe tapering into a ragged fringe — which is what composites into
  Mortiorchis's cradle. 818×1203, baselineY 1187.
- **attack** variant 2, **cast** variant 2, **hurt** variant 1, **ko** variant 1
  — all `--ref` at his own approved idle, `--refWeight 0.65`, batch 2. Identity
  holds across all five: same hair, same green sash, same red-trimmed robe.

### `mortiorchis` — idle kept, attack, cast, hurt, ko

- **idle** — Run 1's render was kept unmodified (seed 343237022). Wide
  brass-and-bone ribcage, hollow green-lit centre, two curved scythe arms,
  41 % opaque and a clean matte. It is the §1.8 design directive almost line for
  line.
- **cast** variant 2, **ko** variant 2 — kept as cut by `isnet-anime`.
- **hurt** variant 1 — `isnet-anime` left 59 % of the frame opaque (white
  cyclorama retained beside the scythe). Re-cut with
  `tools/gen/whitekey.py --raw hurt.1.raw.png`, which took it to 34 %. This is
  the second subject that has needed the luminance key; the tool's docstring
  says "inanimate prop", and a brass machine on white is the same case.
- **attack** — **re-rolled.** Variant 1 came back with a painted decorative
  border around the whole frame (whitekey keys it in as content, isnet keeps it
  as background); variant 2 was a close-up with the machine cropped at every
  edge. See the re-roll note below.

---

## Run 3 (2026-09-17) — resumed again; finished the group

Run 2 was cut off mid-sentence (the Mortiorchis `attack` re-roll note has no
follow-up). This run verified what Run 2 had promoted, judged every leftover
numbered variant, promoted the keepers, deleted the variants and the `*.raw.png`
files, and generated what was still missing.

Settings carried over unchanged from Run 2: `--refStart 0.25`, `--refEnd 0.70`,
and the shared per-shot negatives (anti-gloss + `NOBG`). `STYLE_TAGS`,
`QUALITY_TAGS` and the composition blocks in `tools/gen/comfy.mjs` were **not**
touched.

Judging method this run: variants were composited into contact sheets with
`tools/gen/sheet.py` (rows rendered on the transparency checkerboard so a
retained background shows up as a solid block) and read as single images, with
`tools/gen/qc.py` run first to filter the mechanical failures
(`BG-RETAINED`, `FRAME-FULL`, `HALO`, `DANGLE-*`) before anything was looked at.

### `seymour-flux-body` — verified, unchanged

All five states were already promoted by Run 2 and all five pass. Identity holds
across the set: pale slender torso, light blue hair with the two horn-like
locks, dark robe with red trim, the bright green sash in every frame. Cutouts
clean (25–59 % opaque, 0 % semi-transparent, no retained backplate). The face
and hair do match `public/art/characters/seymour-flux/idle.png`, which is what
the split was for. **Nothing regenerated.**

### `mortiorchis` — verified, unchanged

All five states present and consistent: wide brass-and-bone ribcage, hollow
green-lit centre, two curved scythe arms in every frame. `cast` carries a
62 px dangle (a scythe tip below the body); Mortiorchis is a floating mount, so
`baselineY` is not used to plant it and the dangle is harmless. **Nothing
regenerated.**

### `yunalesca-1` — cast and ko promoted

- **cast** = `castC.1` (of 4 candidates). Standing, both hands raised with energy
  gathering, silver hair, blue-and-black bra, green Yevon sashes, gold
  bracelets, barefoot. 762×1199, 42.9 % opaque, dangle 12 px — the only cast
  candidate whose feet are the lowest content. `castC.2` and `castC.3` both
  trailed a sash 100+ px below the soles; `castB.1` gained a dark leg drape that
  is not in §1.9.
- **ko** = `koC.2` (of 3). Lying flat on her side, hair fanned out, dangle 0 —
  the flattest, most clearly *downed* read of the three. `koC.1` still reads as
  a posed recline; `koC.3` curls the legs up and reads as a crouch.

### `yunalesca-2` — attack, cast, hurt and ko promoted

Form 2 is the same woman with the tendril mass, and all four picks keep the
form-1 palette (silver hair, blue-and-black bra, green sash, gold bracelets).

- **attack** = `attack.1` — arms spread, symmetric tendril corona, dangle 0.
  `attack.2` is a lunge that throws the silhouette off-centre and dangles 42 px.
- **cast** = `cast.1` — dangle 12 px vs `cast.2`'s 119 px.
- **hurt** = `hurt.1` — head back, recoiling, dangle 0. `hurt.2` dangles 228 px
  and shrinks the figure to a third of the frame.
- **ko** = `koD.1` (of 8 candidates across four batches). This was the hard one:
  form 2 is *suspended by tendrils* and never stood up, so every "collapsing"
  roll came back with her still upright. `koD.1` is the only one that reads
  defeated — eyes closed, head bowed, knees together, arms limp, the tendril
  mass sagging and pooling downward instead of spreading.

All numbered variants and `*.raw.png` files for both subjects deleted.

### `yu-yevon` — attack, cast, hurt, ko promoted

The approved `idle` (Run 1) is the §1.12 design almost exactly: dark segmented
sac, forward-curling hooks, and a flat gold Yevon glyph disc where the face
should be. The selection rule for the other four states was therefore **"is the
gold disc still there"**, because that is the whole silhouette.

- **attack** = `attackB.2`, **re-cut with `tools/gen/whitekey.py`** off its raw
  render. `isnet-anime` kept a large white cloud beside the body; the luminance
  key took it from 47 % to 25.7 % opaque and preserved the disc.
  `attackB.1` was rejected outright — it lost the gold disc, which means it is
  not Yu Yevon any more.
- **cast** = `castB.2` — disc centred in the body, hooks curling forward,
  27.1 % opaque. `castB.1` came back 68.6 % opaque with white cloud masses.
- **hurt** = `hurtB.1` — 34 % opaque, 0 % semi, disc intact.
- **ko** = `koB.1` — dissolving, with detached gold motes drifting off to the
  left, dangle 0.

`cast` (274 px) and `hurt` (75 px) both trip the dangle check. **Deliberately
left alone**: `cast.json`'s own note says Yu Yevon floats and never touches the
ground, so nothing plants him by `baselineY`.

### `yu-pagoda` — idle chosen from 18 candidates

Seven batches had been rolled across two runs and most of them failed the same
two ways: `pagoda` renders a *row of several* pillars (the multi-subject failure,
despite the negative), or it renders an entire temple. Of the singles:

- **idle** = `idleG.4`. One floating object: three tapering tiers, each ringed,
  gold with hanging finials, no ground, no building. It is the §1.10 directive
  in everything but the stone tones — it renders all-gold rather than
  stone-and-gold — and it is the only candidate a player would read as a single
  floating pagoda finial rather than as architecture.
- Rejected: `idle.1`, `idle.3`, `idleF.1`, `idleF.3` (multiple pillars per
  frame); `idleD.1` (a pile of rocks); `idleG.1`, `idleD.2` (retained white
  disc); `idleE.3` (reads as a sceptre, 305 px wide).

174 px dangle, left uncorrected for the same reason as Yu Yevon: it hovers.

### `yunalesca-3` — idle finally landed, on the eighth batch

Form 3 is the hardest subject in the group and Runs 1–2 spent seven batches on
it (`idle`, `idleB`…`idleE`, 14 variants) without a keeper. The failure was
always the same and it is worth writing down, because it is a *composition*
failure and not a costume one:

> §1.9 asks for two subjects at wildly different scales in one frame — a
> colossal gorgon face filling the lower two thirds, and a **tiny** reclining
> Yunalesca on the crown of hair above it. Describing that in prose
> ("a very small silver-haired woman reclining on a mat of hair at the very
> top") gets the checkpoint to render **one or the other**: batches D and E's
> `no humans` framing produced a superb gorgon skull with no woman anywhere,
> and batches A/B/C's `1girl` framing produced a woman with decorative tendrils
> and no gorgon.

**What fixed it was tag vocabulary, not weights.** Animagine is trained on
Danbooru captions, and Danbooru has tags for exactly this relationship:

```
1girl, solo, size difference, sitting on a giant monster head, giant monster, ...
```

`size difference` + `sitting on a giant monster head` composes the two-scale
picture in one shot, where three sentences of description could not. No `--ref`
was used on this roll — every earlier reference-pinned attempt dragged the
silhouette back toward the human form-1 body, which is the same fight
`cast.json`'s own note predicted.

- **idle** = `idleF.1` of 3, seed 599726111, 1216×832, 58.1 % opaque, dangle 0.
  Colossal horned skull filling the lower frame, snake-locks radiating outward
  in a sunburst, and Yunalesca seated small at the crown — black bra, green
  sash, gold bracelets, barefoot, hair falling past the skull's brow. This is
  §1.9's "dark sunflower of snakes" read.
- **Known drift:** her hair renders lavender-tinted here rather than the silver
  of forms 1 and 2, and the gorgon mass is bone/tan rather than the bible's
  bone-violet. Judged acceptable: the composition is the thing that had been
  failing, the four other states are `--ref`'d at *this* idle so the set is
  internally consistent, and the progression still reads
  small-and-elegant → suspended-and-wrong → enormous-and-monstrous.

**States** (all `--ref public/art/characters/yunalesca-3/idle.png`,
`--refWeight 0.65 --refStart 0.25 --refEnd 0.70`, batch 2):

| State | Variant | Note |
| --- | --- | --- |
| attack | `attack.2` | Skull roaring, mouth lit orange, snake heads lunging, woman still seated on the crown. `attack.1` kept a white ground plate under the frame. |
| cast | `cast.1` | Pale gorgon mass with the arms of snakes spread. |
| hurt | `hurt.1` | 59 % opaque and the cleanest matte of the eight; the skull screaming, snake locks thrown back. |
| ko | `ko.1` | The mass collapsing, locks limp, woman slumped. `ko.2` kept a literal rectangular white backdrop card. |

**On the `FRAME-FULL` / `BG-RETAINED` flags for this subject:** `cast` and `ko`
trip both. They were kept anyway, and the reason is in the bible: §1.9 gives
form 3 the largest boss cell in the FFX set (224×192) and says "the frame is now
dominated by a huge downward-facing gorgon face". The opaque pixels at the
frame edge here *are* the creature, not a retained cyclorama — re-cutting all
four through `tools/gen/whitekey.py` moved the numbers by 1–2 points and changed
nothing about where the alpha edge falls, which is the check that settles it.

### `braskas-final-aeon-1` — idle re-rendered; the Jecht reference was the bug

Run 1 and Run 2 both produced a **bright red-and-orange demon** with no sword,
no claw asymmetry and no brown anywhere. Against §1.10 (brown scales, white hair
tufts, red headband, a normal right arm holding a huge **black** sword, an
oversized **left claw**) that is not Braska's Final Aeon, so the promoted `idle`
and all four of its states were rejected and re-rendered.

**The cause was `cast.json`'s own instruction.** It says to `--ref` this subject
at `public/art/characters/jecht/idle.png` at ~0.45 so the face reads as his.
But Jecht's approved idle is *dominated* by his red headband and his
orange-and-red sash, and IP-Adapter carries palette along with identity — §3 of
the pipeline doc calls this material bleed. The red the last two runs could not
get rid of was Jecht's sash, arriving with his face.

So this idle was rendered **with no reference at all**, prompt-only, batch 4,
and with the palette banned explicitly in `--negAdd`:

```
red skin, orange skin, red body, fire, flames, burning, demon wings,
feathered wings, power armor, two claws, dual wielding, normal proportions, human
```

- **idle** = `idleC.1` of 4, 992×1024, 63.6 % opaque, dangle 2 px. Hulking and
  hunched, **brown** scaled hide, horns, a white hair tuft under a **red
  headband**, red markings across the chest, digitigrade legs under a spike
  crest — and the asymmetry the design lives on: a normal-proportioned right
  arm holding a huge **black greatsword point-down**, an oversized dark **claw**
  on the left. A fan names it on sight, which the red demon did not manage.
- Drift from §1.10 worth knowing about: the chest markings render **red**, not
  the white Zanarkand Abes tattoo, and the blade carries no red dolphin curls.
  Both are 1-px details the checkpoint will not hold at this size.
- `jecht/idle.png` is **not** used as a reference anywhere in this subject any
  more. If a future pass wants his face back, crop the reference to his head
  first so the sash cannot ride along.

**States** (all `--ref braskas-final-aeon-1/idle.png`, `--refWeight 0.65
--refStart 0.25 --refEnd 0.70`, batch 2): `attack.1`, `cast.1`, `hurt.1`,
`ko.1`. All four keep the brown hide, the white hair tuft under the red
headband, the black sword and the oversized claw. The `--ref` pass does pull
the palette back toward red-on-black — the checkpoint's own bias for this kind
of monster, now that Jecht's sash is out of the picture — so the states read
about one stop hotter than their idle. Judged acceptable; re-rolling the whole
set to chase it would risk losing the sword again.

`hurt.2` was rejected outright: it rendered a second, human-sized figure
standing in front of the monster (the multi-subject failure, §6.2).

### `braskas-final-aeon-2` — idle re-rendered off the new form 1

The old form-2 idle was the same red demon as form 1's, so it went with it.
The re-roll is `--ref braskas-final-aeon-1/idle.png` at the default 0.65 (which
is what `cast.json` asks for — pinning form 2 to form 1 is right, it was only
pinning form 1 to *Jecht* that was wrong), with the form-2 tags adding
`armor plating, bone plate, six wing shaped spikes fanned behind the back`.

- **idle** = `idleB.1` of 3. Same creature as form 1 — brown torso, white hair
  tufts, red headband, black sword over the right shoulder, claw on the left —
  with a fan of spike-blades erupting behind the shoulders that widens the
  silhouette by about 40 %, which is §1.10's whole brief for the second form.
  `idleB.3` retained a white disc; `idleB.2` lost the bulk.
- **States**: `attack.1`, `cast.2`, `hurt.1`, `ko.1`, all `--ref` at this idle.
  `cast.1` and `hurt.2` were both rejected on the cutout (79 % / 73 % opaque
  with the background retained).

### `yu-pagoda` — attack and ko finally landed via `--img2img`, not `--ref`

Two more reference-pinned batches failed the same way the first seven had:
`--ref` on a lone ornate object makes this checkpoint render **a collection of
that object**. At `--refWeight 0.65` it produced a field of a dozen pagodas; at
0.40 it produced a single *different* finial that did not match the idle.

**The fix was `--img2img` off the approved idle.** For a prop whose states differ
only in lighting and damage, redrawing the approved pixels is strictly better
than asking for the silhouette a ninth time — and it is 25 s a variant instead
of 320 s, because there is no IP-Adapter in the graph.

| State | How | Denoise | Result |
| --- | --- | --- | --- |
| `attack` | `--img2img idle.png` | 0.42 | Same three-tier silhouette, core lit, runes bright |
| `ko` (first try) | `--img2img idle.png` | 0.58 | Same silhouette but barely dimmer — not a KO |
| `ko` (kept) | `--img2img idle.png` + `broken, cracked stone, chipped, dark and unlit, dull metal` in `--tags`, `bright glow, glowing` in `--negAdd` | **0.72** | Visible cracks up the column, gold gone matte, unlit |

0.58 was not enough to damage it: at that strength the model reproduces the
input's *materials*, and "cracked" is a material change. 0.72 plus banning the
glow in the negative is what broke it.

`yu-pagoda` ships **three** states (`idle`, `attack`, `ko`), which is what
`cast.json` specifies for it — it is an inanimate support that heals and dies,
it has nothing to cast and no hurt reaction. All three carry a 130–175 px
dangle and a `baselineNote` saying so: it hovers, nothing plants it.

---

## Where the group stands

All nine subjects in `ffx-bosses` now have a promoted state set, no numbered
variants and no `*.raw.png` left anywhere. Per-subject contact sheets are in
`docs/screenshots/art/<id>.png`.

| Subject | States | Sheet |
| --- | --- | --- |
| `seymour-flux-body` | idle, attack, cast, hurt, ko | `docs/screenshots/art/seymour-flux-body.png` |
| `mortiorchis` | idle, attack, cast, hurt, ko | `docs/screenshots/art/mortiorchis.png` |
| `yunalesca-1` | idle, attack, cast, hurt, ko | `docs/screenshots/art/yunalesca-1.png` |
| `yunalesca-2` | idle, attack, cast, hurt, ko | `docs/screenshots/art/yunalesca-2.png` |
| `yunalesca-3` | idle, attack, cast, hurt, ko | `docs/screenshots/art/yunalesca-3.png` |
| `braskas-final-aeon-1` | idle, attack, cast, hurt, ko | `docs/screenshots/art/braskas-final-aeon-1.png` |
| `braskas-final-aeon-2` | idle, attack, cast, hurt, ko | `docs/screenshots/art/braskas-final-aeon-2.png` |
| `yu-pagoda` | idle, attack, ko | `docs/screenshots/art/yu-pagoda.png` |
| `yu-yevon` | idle, attack, cast, hurt, ko | `docs/screenshots/art/yu-yevon.png` |
| `jecht` | complete from Run 1 — not touched | `docs/screenshots/art/jecht.png` |

**Portraits verified**, all three, unchanged: `portraits/seymour.png` (light blue
hair, purple eyes, dark blue robe with red trim and the green sash),
`portraits/yunalesca.png` (silver hair, yellow eyes, blue headband with the
plumes and tassels, blue-and-black top), `portraits/jecht.png` (dark skin, black
hair, red headband, red eyes, the left pauldron). All three read
`BG-RETAINED, FRAME-FULL` in `qc.py` and should — portraits are framed
head-and-shoulders paintings, not cutouts, and the check is written for sprites.

### Known drift, for whoever picks this up next

1. **`yunalesca-3`'s hair is lavender**, not the silver of forms 1 and 2, and
   its gorgon mass is bone/tan rather than bone-violet. The composition was the
   thing that had failed eight times and it is right now; the palette is the
   next thing to fix, ideally with `--img2img` off the kept idle at ~0.35 with
   `silver hair` forced, which will recolour without touching the layout.
2. **Braska's Final Aeon runs hot.** Form 1's idle is properly brown; its four
   states and all of form 2 sit redder. Same `--img2img` recolour trick would
   work.
3. **Neither BFA form carries the white Zanarkand Abes tattoo or the red dolphin
   markings on the blade.** Both are 1 px details at this render size.
4. **`yu-pagoda` renders all-gold**, not the bible's stone-and-gold.
5. **Do not reintroduce `--ref public/art/characters/jecht/idle.png`** on
   `braskas-final-aeon-1` without cropping the reference to his head first. His
   orange-and-red sash is what made two runs of this boss come back scarlet.
