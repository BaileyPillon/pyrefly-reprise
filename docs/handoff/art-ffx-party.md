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
