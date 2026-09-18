# Art handoff — group `bosses-a` (contract v3)

**Round:** v3 facing re-render, 2026-09-18.
**Subjects:** `seymour-flux-body`, `mortiorchis`, `yunalesca-1`, `yunalesca-2`,
`yunalesca-3` — five states each (`idle, attack, cast, hurt, ko`) — plus the
HUD portraits `seymour` and `yunalesca`.
**Read with:** `docs/ART-PIPELINE.md` §2a/§3/§5, `docs/handoff/art3-contract.md`,
`research/visual-bible.md` §1.8 (Seymour Flux + Mortiorchis) and §1.9
(Yunalesca's three forms), `tools/gen/cast.json`.

Everything in this group was **v2 `straight-on`** before this round, and the
subject directories also held a large drift of un-promoted experiment files from
the interrupted v2/v3 sessions (`attackR.*`, `attackV.*`, `idleW.*`, `idleX.*`,
`expA/B/C`, …). Every file listed below was replaced; **nothing frontal survives
for these five subjects**, and the five directories now hold the ten promoted
files and nothing else.

---

## 1. Method

1. `idle` first, 3–4 variants at `--facing left` (the `boss` preset default),
   judged on a contact sheet; the keeper mirrored with
   `tools/gen/flip.py --set-facing left` when it came back frame-right.
2. Every other state `--ref`'d at the promoted `idle.png` at the house defaults
   (`--refWeight 0.65 --refStart 0.25 --refEnd 0.85`), 2 variants each.
3. Portraits with `--composition portrait`, `--ref` at the matching idle.
4. `tools/gen/qc.py` on every promoted cutout, **plus a magenta-composite
   contact sheet** (`docs/screenshots/art/_ba-cutout-check.png`), which is what
   actually found this round's main defect — see §2.3.
5. Per-subject contact sheet to `docs/screenshots/art/<id>.png`.

**Identity tags were rewritten against the visual bible, not inherited from the
cast manifest** (§2.1).

---

## 2. Findings

### 2.1 `cast.json` is wrong about Yunalesca, on exactly the two things a blind judge scores

The manifest gives her `blonde hair, white dress, gold trim`. The bible (§1.9,
sourced to the wiki's appearance section) gives **silver hair**, **yellow eyes**,
a **blue-and-black bra** with a yellow chain, a **black thong**, **green sashes**,
**gold bracelets**, **blue armbands**, an **ornate blue headdress** whose plumes
zigzag into an 'M', and **bare feet**. The contract's own boss-mirror note
already flagged the drift — "across all six variants her costume drifted to a
full-length gown … the blind judge will feel that" — and `blonde hair, white
dress` in the tags is *why*: the prompt was asking for the gown.

Rewriting the identity block to the bible and adding
`--negAdd "long dress, gown, covered shoulders, robe, cape, blonde hair, white
dress, skirt"` fixed it in one batch: 4 of 4 first-round idles came back with
silver hair, yellow eyes, the headdress, the blue top and the green sash. The
long blue drape that survives on all of them is the belt drapery, not a gown,
and it is canon-adjacent enough to keep.

**Action for whoever owns the manifest:** `cast.json` rows `yunalesca-1/-2/-3`
should take the tag strings recorded in §4 below. They are not fixed here — this
group does not own that file.

### 2.2 Seymour Flux needed four idle rounds, and every failure was a word in the tags

The cast row's canon note is right and is worth re-reading before touching him.
What the four rounds cost:

| Round | What went in | What came out |
| --- | --- | --- |
| 1 | cast.json tags as written (`topless male, bare chest`, `dark aura`, `horror (theme)`) | 4/4 grew literal **horns**, all four kept a full-bleed dark background, no seated read, no robe |
| 2 | `two long thick locks of hair falling down his back`, `horns, antlers, helmet` in `--negAdd`, aura and horror dropped | horns gone, robes arrived, still standing, backgrounds still retained |
| 3 | `sitting cross-legged in midair`, `legs hidden under billowing robes` | seated at last, but one variant sat on a rendered stool and two grew floating spears |
| 4 | + `weapon, sword, spear, boots, shoes, chair, stool` in `--negAdd` | **keeper**: seated cross-legged, dark blue robe with red trim, green sash, open chest with the leonine tattoo, two long blue locks behind the head |

Three things are worth keeping:

- **The word "horn" cannot appear in his tags, even as "horn-like".** The bible
  spells this out and it is still true with the negative in place: round 1 used
  "two long horn-like locks of hair" *and* banned horns, and got horns anyway.
  Write them as `two long thick locks of hair falling down his back`.
- **`dark aura` and `horror (theme)` are what kept the backgrounds.** Both are in
  the cast row. They paint a full-frame dark field that `isnet-anime` mattes as
  subject, and dropping them was worth more than any negative.
- **He does not need the bone cradle in his own sprite.** The engine composites
  him onto Mortiorchis (§7 of the pipeline doc), so "rider only" is correct and
  the cradle in his tags was competing with the mount for the same pixels.

### 2.3 The defect `qc.py` cannot see: a flat white backdrop inside the cutout

On dynamic poses this checkpoint often paints the "white background" from the
style block as an actual **shape** — a spotlight oval behind a cast animation, a
panel behind a lunge — rather than leaving the field empty. rembg keeps it,
because it is subject-coloured and subject-adjacent. The sprite then looks
perfect everywhere it is viewed on white, `qc.py` reports `ok` (no halo, no
opaque corners), and the slab only appears when the sprite is composited over a
backdrop in the game.

It was caught by compositing every promoted file on magenta
(`docs/screenshots/art/_ba-cutout-check.png`) — **this check should be part of
judging, not an afterthought**; nine of twenty-five promoted files were carrying
one.

Fix: `tools/gen/unbackdrop.py` (new, §3). Run at `--cut 232 --spread 10
--enclosed`, it cleared 2.5k–45k pixels per file and left silver hair intact
(hair fails the "flat and unsaturated" test because it carries a blue-violet
shadow ramp and line work). What remains white in the final set is genuine:
Seymour's two glowing magic circles in `cast`, and hair mass.

Two related notes:

- **`BG-RETAINED` and `FRAME-FULL` are false positives for these subjects.**
  Yunalesca's forms 2 and 3 are mostly hair and tendrils, which legitimately
  reach all four corners; `yunalesca-2/attack` reports `BG-RETAINED,FRAME-FULL`
  and is clean on magenta. Trust the composite, not the flag.
- A **painted cast shadow** is the other half of this: the first Mortiorchis
  keeper had a grey ground smear that `despeckle.py` could not drop because it
  touched the claws. `shadow, cast shadow, ground, floor, reflection` in
  `--negAdd` fixed it on the reroll, and the reroll also produced a better
  subject (§2.5). Ban the shadow in the prompt rather than repairing it after.

### 2.4 Facing: the frame-left bias held, and `--ref` still does not carry facing

Consistent with the contract. Of 27 promoted files, **8 needed mirroring** and
every one of them was a subject whose prior is a *person*: all five Seymour
states, and the form 1 and form 2 Yunalesca idles. **Mortiorchis needed no
mirror in any state** — the machine has no official art pulling it anywhere, so
`--facing left` simply worked, which matches the contract's "expect obscure
subjects to turn easily and headline characters to need the weight".

The `--ref` finding reproduced exactly: Seymour's four referenced states all
came back frame-**right** off a frame-**left** idle, and were mirrored
individually. Judge facing per state; never assume the reference carried it.

### 2.5 Mortiorchis is the one subject where the bible's design note paid for itself

There is no published description of this thing, so §1.8's declared `[estimate]`
— a wide ribbed bone-and-brass reliquary, hollow centre, two curved scythe arms,
a hanging censer, a gold rosette floating above — is the only specification that
exists. Feeding those elements in as tags produced, on the second batch, a
keeper with **all of them visible**: brass cage with green sockets, gold
sunburst rosette above it, a censer hanging at the left, scythe arms sweeping
out. It is the most on-spec sprite in the group and it took eight renders.

### 2.6 Yunalesca form 3 is a compromise, and the next person should know why

The bible wants a colossal downward-facing gorgon head filling the frame with
the woman tiny at its crown. Three approaches failed:

- `--ref` at form 1 plus gorgon tags: the adapter holds the human silhouette and
  the model wraps a **dragon** around it (4/4).
- No `--ref`, `no humans`, gorgon head only: the subject stops being a
  character at all — orange blobs and a skull, 4/4 unusable.
- Dropping `1girl` is what breaks it; the tag is doing more work than the
  gorgon description.

What shipped is the middle: `1girl` plus *"her lower body merging into an
enormous mass of pale snake-like tendrils, a huge gorgon face below her"*,
`--ref` at form 1 at 0.45. The result is an enormous serpentine mass with
Yunalesca small, recognisable and reclining in it. **This is deliberately the
judge-safe choice**: a pure gorgon head is unnameable as Yunalesca, and the
blind judge has to name the subject. The progression across the three forms
still reads small-and-elegant → suspended-and-wrong → enormous-and-monstrous.

### 2.7 Smaller things

- **The KO prone block needs its own reroll budget.** `yunalesca-1/ko` took
  three rounds: the first stood her up, the second produced **two subjects** (a
  disembodied bust beside the body — the classic §6.2 reject), and only the
  third, with `--composition prone` plus `2girls, multiple girls, disembodied
  head, shadow, ground, sand` in `--negAdd`, gave one clean figure lying
  head-left with a pyrefly drifting off her. Enemy prone is head-**left**
  (`PRONE_FACING_PHRASES.left`); one keeper was mirrored to get there.
- **Two baselines were hand-corrected** per §5 of the pipeline doc:
  `mortiorchis/attack` (803 → 738, a scythe tip hung below the cage) and
  `yunalesca-1/cast` (1210 → 1116, the drape hangs past her feet). Both keep
  `baselineYAuto` and a `baselineNote`.
- **Portraits follow `party-b`'s resolution of the same conflict** (their §2.5):
  `--composition portrait` as written, so `--facing` stays `none` and the
  portrait pipeline is untouched, with `three quarter view` added as an ordinary
  pose tag. Neither keeper needed mirroring — both already present a
  three-quarter head with the eyes on the player. `BG-RETAINED,FRAME-FULL` on
  both is normal for the preset: a portrait is a full-bleed bust, not a cutout.
- **Another agent was rendering aeon portraits on the same GPU** for most of this
  round. ComfyUI's queue serialises correctly and nothing came back black (the
  contract's 2026-09-17 incident did not recur), but per-image time went from
  ~10 s to ~25–65 s. Check `/queue` before reading anything into a timing.

---

## 3. New tools

Both live in `tools/gen/`, both run in the embedded python, both rewrite the
sidecar the way `flip.py` does and record that the seed no longer reproduces the
file. **Run either one *before* `flip.py`**, so the crop maths still agrees with
the source canvas about left and right.

| Tool | What it does | When to reach for it |
| --- | --- | --- |
| `unbackdrop.py` | Flood-fills inward from the frame edge over near-white, unsaturated pixels and clears them; `--enclosed` also drops white blobs the fill cannot reach when they are large *and* solid enough to be a painted panel rather than hair | The §2.3 defect. Default `--cut 244`; **232 was the useful value this round** |
| `despeckle.py` | Clears disconnected alpha islands below a fraction of the largest, re-crops, refuses if it would remove more than a quarter of the subject | A stray cast shadow or scrap of background that is *not attached* to the subject. It did not help this round — both smears were connected — but it is the right first thing to try, because it cannot damage the figure |

---

## 4. Tag strings that produced the keepers

Style, quality and composition blocks come from `comfy.mjs` and are not repeated
here. All five subjects: `boss` preset, `--facing left`.

**`seymour-flux-body`** (`--size 832x1216`, `--ref public/art/characters/seymour-flux/idle.png --refWeight 0.4 --refStart 0.35` for the idle)

```
1boy, seymour guado, final fantasy x, safe, solo, pale skin, light blue hair,
very long hair, two long thick locks of hair falling down his back, hair over
one eye, purple eyes, veins on face, ornate dark blue robe, red trim, green
sash, open robe, exposed chest, chest tattoo, wide sleeves, sitting cross-legged
in midair, floating, legs hidden under billowing robes, tattered robe hem
--emphasis "(sitting cross-legged:1.3), (veins on face:1.25), (green sash:1.2)"
--negAdd  "horns, antlers, helmet, crown, weapon, sword, spear, boots, shoes,
           legs, feet, chair, stool, throne, standing, dark background,
           black background, 1girl, monochrome"
```

**`mortiorchis`** (`--size 1216x832`, no `--ref` on the idle)

```
no humans, floating skeletal machine, insect, wide ribbed bone cage, ribcage,
mandibles, two long curved scythe arms, chitin, brass and bone, dark metal,
hollow center, glowing green core, hanging censer, golden rosette glyph,
hovering in the air, ominous, monster, machinery
--emphasis "(wide ribbed bone cage:1.2), (curved scythe arms:1.15), (white background:1.3)"
--negAdd  "1girl, 1boy, human, face, person, robe, rider, character, building,
           temple, shadow, cast shadow, ground, floor, reflection"
```

**`yunalesca-1`** (`--size 832x1216`, no `--ref` on the idle — it is the anchor for 2 and 3)

```
1girl, yunalesca, final fantasy x, safe, solo, silver hair, very long hair, hair
spread out, yellow eyes, pale skin, blue headdress, ornate headdress, blue and
black bikini top, gold chain, gold jewelry, gold bracelet, blue armband, green
sash, black thong, barefoot, revealing clothes, navel, elegant
--emphasis "(silver hair:1.25), (ornate headdress:1.2), (revealing outfit:1.15)"
--negAdd  "long dress, gown, covered shoulders, robe, cape, armor, blonde hair,
           white dress, skirt, wings"
```

**`yunalesca-2`** (`--size 1024x1024`, `--ref yunalesca-1/idle.png` at the default 0.65)

```
1girl, yunalesca, final fantasy x, safe, solo, monster girl, silver hair, very
long hair, tentacle hair, hair becoming tendrils, yellow eyes, pale skin, blue
headdress, blue and black bikini top, green sash, gold jewelry, gold bracelet,
blue armband, revealing clothes, lifted into the air by a mass of tendrils, feet
dangling, menacing
--emphasis "(lifted by a mass of tendrils:1.25), (silver hair:1.2)"
--negAdd  "long dress, gown, blonde hair, standing on ground, armor, wings"
```

**`yunalesca-3`** (`--size 1216x832`, `--ref yunalesca-1/idle.png --refWeight 0.45`)

```
1girl, yunalesca, final fantasy x, safe, solo, giant monster girl, small pale
woman with silver hair and a blue headdress reclining at the top, her lower body
merging into an enormous mass of pale snake-like tendrils, a huge gorgon face
with hollow glowing sockets below her, yellow eyes, huge, looming, from below
--emphasis "(enormous mass of snake tendrils:1.3), (huge gorgon face below her:1.25), (white background:1.2)"
--negAdd  "dragon, wyvern, scales, single serpent, gown, armor, dark background,
           black background, standing"
```

Pose tags, per state, shared by all five subjects except where noted:

| State | `--poseTags` |
| --- | --- |
| `idle` | `looming, menacing, looking at viewer` (Yunalesca 1: `standing, one hand raised in an inviting gesture, weight on one hip, long hair splaying outward in tendrils, looking at viewer, serene cruel smile`) |
| `attack` | `attacking, lunging forward, dynamic pose, striking` (Yunalesca 1: `lunging forward, thrusting one clawed hand forward, dynamic action pose, hair whipping forward, snarling`) |
| `cast` | `summoning energy, glowing magic circle, dark energy swirling, arms raised` |
| `hurt` | `recoiling, staggering backward, damaged, pained` |
| `ko` | `collapsing, dissolving into pyreflies, defeated, broken, slumped` (Yunalesca 1: `--composition prone`, `collapsed on her side, limp, eyes closed, defeated, dissolving into pyreflies, hair spread out`) |

---

## 5. What shipped

`facing` below is what the image **actually shows**, written through
`flip.py --set-facing`. Every file carries `unbackdropped` in its sidecar except
the two portraits.

| Subject | State | Seed | Size | `baselineY` | Mirrored |
| --- | --- | --- | --- | --- | --- |
| `seymour-flux-body` | idle | 554280369 | 832×1216 | 1216 | yes |
| | attack | 128245143 | 831×1216 | 1216 | yes |
| | cast | 934549770 | 832×1216 | 1216 | yes |
| | hurt | 1252457104 | 832×1216 | 1216 | yes |
| | ko | 1551576029 | 832×1216 | 1216 | yes |
| `mortiorchis` | idle | 458843120 | 1216×832 | 832 | — |
| | attack | 891745763 | 1211×803 | **738** (hand) | — |
| | cast | 631239957 | 1216×830 | 816 | — |
| | hurt | 773950600 | 1216×832 | 823 | — |
| | ko | 1203116673 | 1195×832 | 826 | — |
| `yunalesca-1` | idle | 943353714 | 742×1155 | 1139 | yes |
| | attack | 56940206 | 832×1216 | 1216 | — |
| | cast | 1721538663 | 830×1213 | **1116** (hand) | — |
| | hurt | 1921900288 | 796×1203 | 1187 | — |
| | ko | 828456650 | 1216×832 | 832 | — |
| `yunalesca-2` | idle | 550967083 | 966×1024 | 1024 | yes |
| | attack | 1946912841 | 1024×1024 | 1024 | — |
| | cast | 1663891147 | 901×1024 | 1019 | — |
| | hurt | 36764811 | 1024×1024 | 1024 | — |
| | ko | 1988157745 | 1024×1017 | 1001 | — |
| `yunalesca-3` | idle | 922108123 | 1209×832 | 832 | — |
| | attack | 222578324 | 1216×825 | 825 | — |
| | cast | 1059401096 | 1193×831 | 820 | — |
| | hurt | 1718155228 | 1157×832 | 832 | — |
| | ko | 1579400963 | 1216×832 | 832 | — |
| `portraits/yunalesca` | — | 456346070 | 832×1216 | — | — |
| `portraits/seymour` | — | 1951237529 | 832×1216 | — | — |

Per-subject contact sheets:

- `docs/screenshots/art/seymour-flux-body.png` (states + the `seymour` portrait)
- `docs/screenshots/art/mortiorchis.png`
- `docs/screenshots/art/yunalesca-1.png` (states + the `yunalesca` portrait)
- `docs/screenshots/art/yunalesca-2.png`
- `docs/screenshots/art/yunalesca-3.png`

Judging sheets kept as the record of the rejects: `_ba-cand.png`,
`_ba-cand2.png` … `_ba-cand5.png`, `_ba-sey.png`, `_ba-mor.png`, `_ba-y1b.png`,
`_ba-por.png`, the per-subject `_ba-<id>-picks.png`, and the magenta cutout
check `_ba-cutout-check.png`.

---

## 6. Left open

- **`cast.json` still carries the wrong Yunalesca costume and the horn/aura
  wording for Seymour.** Anything re-rendered from the manifest as written will
  reproduce this round's first-batch failures. The strings in §4 are the fix.
- **`yunalesca-1/attack` is the weakest cutout in the group** — a white hair
  mass with one straight edge survives at its left. It is a hair mass, not a
  backdrop panel, so `unbackdrop.py` correctly leaves it; if it reads badly in
  the scene, reroll the state rather than lowering `--cut`.
- **Form 3 is not the bible's gorgon composition** (§2.6). If a future round
  wants the bible's staging literally, the lever left untried is `--img2img` off
  a rough sketch of the head-and-sunburst layout, which is exactly the case that
  flag was added for.
- **Seymour's `ko` reads as a seated pose, not a defeat.** The prone block is
  wrong for him (he is fused to the mount at the waist and never lies down), so
  the state needs an art decision — dissolve-into-pyreflies as a shader effect
  on a seated sprite is probably the answer, not a new render.

---

# Fix pass — round 4 (2026-09-18)

**Why:** a blind judge scored the group and flagged 21 states across all five
subjects and both portraits. This section records only what changed; §1–§6
above still describe how the group was built.

**Scope taken:** every flagged state, plus the two idles the judge failed on
facing (`mortiorchis`, `yunalesca-1`), plus every state downstream of an idle
that was replaced.

**Not taken:** `yunalesca-1/attack`, `cast`, `hurt`, `ko`. The judge passed all
four, and they are costume-identical to the replacement idle (same tag string,
same headdress, same blue-and-green drape). Re-rolling four passing states to
chase a reference whose *costume* did not change is a worse bet than keeping
them. Row 3 of `docs/screenshots/art/_ba4-check.png` is the five of them on
magenta; `docs/screenshots/art/yunalesca-1.png` is the rebuilt subject sheet.

---

## F1. What the judge was right about, mechanically

### F1.1 A radially symmetric machine has no "side", and the facing phrase cannot give it one

`mortiorchis/idle` scored 8 on canon and failed on facing: *"straight-on,
near-bilaterally-symmetric; head dome faces camera, scythe arms spread evenly
both ways"*. `(from side:1.3)` had been applied — it is the `boss` default — and
it did nothing, because the subject has no front. The fix is not a camera word,
it is an **asymmetry word in the identity tags**:

```
... two long curved scythe arms, one scythe arm swept forward and one trailing back ...
--emphasis "(from side:1.4), (asymmetrical:1.3), ..."
--poseTags "... three-quarter view, turned off axis, asymmetrical silhouette"
```

6 of 6 came back turned and asymmetric on the first batch with that wording.
This is the mirror image of the contract's finding for *named* subjects: there
the prior is the problem, here the *shape* is.

### F1.2 `--ref` at 0.6–0.72 is past the cliff for a busy subject, and the failure mode is not "drift"

Two independent attempts landed on the same wall:

| Run | Weight / start | Result |
| --- | --- | --- |
| `mortiorchis/idleG` (ref at its own approved idle) | 0.6 / 0.35 | **5 of 5 unusable.** Not drift — a tangle of copper-and-teal ribbon with white blobs, no head, no hierarchy. The adapter carried the reference's *material* (brass sheen, green glass) and none of its structure |
| `seymour-flux-body/attackF,hurtF,koF` | 0.72 / 0.30 | swirl soup: hair and robe smeared into abstract ribbon, faces half-dissolved, 10 of 14 unusable |

Dropping back to **0.6 / 0.30** fixed Seymour and **0.7 / 0.30 worked fine for
Mortiorchis' states** once the *idle itself* was generated with no reference at
all. So the rule is not a single number:

- **An idle is generated ref-free.** Pointing an adapter at the thing you are
  trying to replace re-imports the defect you are replacing.
- **A state's ceiling depends on how busy its reference is.** Mortiorchis'
  idle is one object on white and takes 0.7; Seymour's idle is a
  multi-coloured patterned robe and does not. The pipeline doc's "above ~0.85
  the adapter reproduces the pose" is the *other* wall; this one is lower and
  shows up as loss of structure, not loss of pose.

### F1.3 A face-expression emphasis above ~1.4 can destroy the cutout, not just the face

`seymour-flux-body/hurtG` ran `--emphasis "(pained expression:1.45),
(teeth clenched:1.25)"`. Four of six came back as **fragments** — `qc.py`
reports `129x138 op 6.3%`, `168x308 op 5.1%` — because the render washed out to
near-white and `isnet-anime` mattes near-white as background. Re-running the
same intent at **1.3**, and carrying the pain in *body language*
(`head thrown back, mouth open in a cry, torso arched backward`) rather than in
a weighted adjective, gave 4 usable frames out of 5.

Rule of thumb for this checkpoint: weight the *subject* hard (`(from side:1.4)`,
`(no legs:1.3)`) and the *expression* gently.

### F1.4 The two Yunalesca monster forms were failing on vocabulary, not on weight

- **Form 2** kept rendering "the same human girl in a shorter outfit" because
  the prompt asked to be *"lifted into the air by a mass of tendrils"* — which
  the model reads as a girl with tendrils *near* her. Saying instead
  **"upper body of a pale woman rising from a huge writhing clump of dark
  purple tentacles, no legs, her hips dissolving into thick violet tendrils"**,
  with `legs, thighs, bare legs, human legs, feet` in `--negAdd`, produced the
  canon silhouette on the first batch. Banning the legs also disposed of the
  judge's *"hip-to-thigh anatomy is mushy"* — there is no hip-to-thigh join left
  to render.
- **Form 3** was failing on `gorgon`. Round 2 of this fix pass asked for a
  *"colossal downward-facing gorgon skull face"* and got six salmon-pink scaly
  shell-blobs with pixel artefacts — the token pulls toward coral and fish on
  this checkpoint, which is also where the previous round's cream blob came
  from. **`medusa` is the token that works.** It is a Danbooru concept the model
  knows cold, and it brings the exact canon reading for free: a woman with a
  mass of snake-locks. With `orange, salmon, red, coral, seashell, fish, scales`
  in `--negAdd` to hold the palette at bone-and-violet, the batch came back as
  a snake-lock sunburst with a small silver-haired woman at its crown — the
  bible's §1.9 form-3 composition, which the previous round had written off as
  unreachable.

### F1.5 The portraits: the facing contract and the HUD convention can both be satisfied

The judge failed both portraits on facing while noting frontal is conventional
for a HUD bust. Rather than pick a side, this pass rendered them with an
explicit **`--facing left` and a softened phrase**:

```
--facingPhrase "(from side:1.15), three-quarter view, head turned toward the viewer, (looking at viewer:1.3)"
```

`(from side:1.3)` — the battlefield weight — overshoots a close-up into a flat
profile, which fails the blind judge harder than frontal does. At **1.15** with
`looking at viewer` raised to **1.3**, the head turns ~30° and the eyes stay on
the player. `--composition portrait` is untouched; this is a per-call override,
not a contract change.

Seymour's portrait also needed the *masculinity* correction the judge asked for
(`bishounen, elegant young man, male focus` plus
`feminine, androgynous, lipstick, makeup` in `--negAdd`). The first attempt
over-corrected into a grizzled warrior with stubble, so `beard, stubble, facial
hair, old man, wrinkles` went into the negative too.


---

## F2. The tag strings that produced this round's keepers

These **supersede §4** for the three subjects whose identity block changed
(`mortiorchis`, `yunalesca-2`, `yunalesca-3`). `seymour-flux-body` and
`yunalesca-1` keep their §4 identity strings unchanged — only their pose tags
and emphasis moved.

**`mortiorchis`** (`boss`, `--facing left`, `--size 1216x832`, **no `--ref` on the idle**)

```
no humans, floating skeletal machine, insect, wide ribbed bone cage, ribcage,
lantern skull with many small glowing green eyes, mandibles, two long curved
scythe arms, one scythe arm swept forward and one trailing back, chitin, brass
and bone, dark brown metal, bone white, hollow center, glowing green core,
brass censer hanging on a chain below it, golden sunburst rosette halo floating
above it, hovering in the air, seen from an angle, ominous, monster, machinery
--emphasis "(from side:1.4), (asymmetrical:1.3), (golden sunburst halo above it:1.3), (white background:1.3)"
--negAdd  "1girl, 1boy, human, face, person, robe, rider, character, building,
           temple, shadow, cast shadow, ground, floor, reflection, teal, cyan,
           turquoise, copper, single large eye, cyclops, worm, centipede,
           snake, dragon, cropped, out of frame"
```

The four state renders keep that identity block, drop
`one scythe arm swept forward and one trailing back` (the state's own pose tags
decide the arms) and run `--ref public/art/characters/mortiorchis/idle.png
--refWeight 0.7 --refStart 0.3`.

`teal, cyan, turquoise, copper` in the negative is what holds the palette. The
judge's *"palette shifted to teal/copper"* was the checkpoint's default reading
of "brass machine"; naming the wrong colours explicitly is cheaper than naming
the right ones.

**`yunalesca-2`** (`boss`, `--facing left`, **`--size 832x1216`**, `--ref yunalesca-1/idle.png --refWeight 0.5 --refStart 0.3`)

```
1girl, yunalesca, final fantasy x, safe, solo, monster girl, upper body of a
pale woman rising from a huge writhing clump of dark purple tentacles, no legs,
her hips dissolving into thick violet tendrils, tentacles, root mass, silver
hair, very long hair, yellow eyes, pale skin, blue headdress, ornate headdress,
blue and black bikini top, gold chain, gold bracelet, blue armband, green sash,
revealing clothes, demonic, menacing, monster
--emphasis "(rising from a clump of dark purple tentacles:1.45), (no legs:1.3), (yellow eyes:1.2), (white background:1.3)"
--negAdd  "long dress, gown, blonde hair, standing on ground, legs, thighs,
           bare legs, human legs, feet, sandals, shoes, skirt, armor, wings,
           scenery, floor, cropped, out of frame, white dress"
```

> **Canvas change.** `cast.json` gives form 2 `1024x1024`; this round rendered
> her at **832x1216**. Form 2 is a figure on top of a vertical column of
> tendrils, and the square bucket was cropping the column — the judge's
> *"cropped hard on all four canvas edges"*. A portrait bucket gives the
> composition somewhere to put the mass. The manifest should follow.

**`yunalesca-3`** (`boss`, `--facing left`, `--size 1216x832`, `--ref yunalesca-1/idle.png --refWeight 0.4 --refStart 0.35` for the idle; the states `--ref` their own idle at 0.6 / 0.3)

```
1girl, yunalesca, final fantasy x, safe, solo, medusa, gorgon, monster girl,
giant monster, small pale woman with silver hair and an ornate blue headdress
at the top, yellow eyes, blue and black bikini top, her lower body a colossal
mass of pale bone-white snakes, dozens of snake heads radiating outward like a
sunburst, a huge gorgon face with hollow glowing yellow sockets below her,
snake hair, bone white and desaturated violet, looming over the viewer,
monstrous
--emphasis "(dozens of snakes radiating outward:1.4), (medusa:1.3), (bone white and violet:1.25), (white background:1.3)"
--negAdd  "orange, salmon, red, coral, seashell, fish, scales, dragon, wyvern,
           single serpent, gown, armor, dark background, black background,
           standing on ground, cropped, out of frame, close-up, pixelated"
```

Pose tags this round, where they differ from §4:

| Subject | State | `--poseTags` |
| --- | --- | --- |
| `seymour-flux-body` | attack | `attacking, right arm thrust straight forward, open clawed hand at the end of a straight outstretched arm, left arm flung back, glowing violet magic gathered in his open palm, head lowered, snarling at the target` |
| | hurt | `recoiling from a hit, torso arched backward, head thrown back, mouth open in a cry of pain, one arm flung up and back, the other arm braced across his chest, robes whipping forward` |
| | ko | `defeated, unconscious, head hanging forward with chin on his chest, eyes closed, both arms hanging limp, shoulders collapsed, body sagging, dissolving into pyreflies, motes of light` |
| `mortiorchis` | idle | `looming, menacing, three-quarter view, turned off axis, asymmetrical silhouette` |
| | attack | `attacking, both curved scythe arms swept forward and crossing in a wide X, lunging toward the target on the left, blades leading` |
| | cast | `summoning, the hollow core blazing with green light, a glowing green magic circle beneath it, chains flaring outward, scythe arms raised` |
| | hurt | `damaged, knocked backward, cracked bone plating, broken ribs, sparks, one scythe arm flung aside, green light flickering` |
| | ko | `destroyed, broken apart, sagging and collapsing downward, skull hanging down, scythe arms drooping limp, green light gone out and dark, cracked, dissolving into pyreflies` |
| `yunalesca-1` | idle | `standing, body turned to the side, weight on one hip, one hand raised in an inviting gesture, head turned toward the viewer, long hair splaying outward in tendrils, serene cruel smile` |
| `yunalesca-3` | attack | `attacking, the snake heads lunging forward with jaws open, the gorgon face snarling, she thrusts one clawed hand forward, the entire creature visible` |
| | ko | `defeated, the snake heads limp and drooping down, the gorgon face slack with dark empty sockets, she slumps forward with her head hanging and her eyes closed, dissolving into pyreflies, the entire creature visible` |

Two phrases carried every KO and hurt in this round and are worth reusing:
`head hanging forward with chin on his chest, eyes closed, both arms hanging
limp` for a defeat, and `head thrown back, mouth open in a cry of pain` for a
recoil. Both describe a *body*, which this checkpoint renders reliably; the
adjectives the previous round used (`collapsing`, `pained`) do not survive the
`--ref`.

---

## F3. What shipped

`Run` is the `pose` field in the sidecar, i.e. which batch the keeper came from.
Every sprite carries `unbackdropped`; `mirrored` means `flip.py --set-facing
left` was applied and the seed no longer reproduces the file. Three
`seymour-flux-body` rows and four `yunalesca-1` rows are **unchanged from the
previous round** and are listed for completeness.

| Subject | State | Run | Seed | Size | `baselineY` | Post |
| --- | --- | --- | --- | --- | --- | --- |
| `seymour-flux-body` | idle | `idleV3d` | 554280369 | 832x1216 | 1216 | mirrored, unbackdropped |
|  | attack | `attackG` | 130166931 | 832x1206 | 1190 | unbackdropped |
|  | cast | `castV3` | 934549770 | 832x1216 | 1216 | mirrored, unbackdropped |
|  | hurt | `hurtH` | 1291092537 | 785x1171 | 1158 | unbackdropped |
|  | ko | `koG` | 793431716 | 728x1134 | 1118 | unbackdropped |
| `mortiorchis` | idle | `idleH` | 1919065792 | 1201x829 | 821 | unbackdropped |
|  | attack | `attackG` | 1667010135 | 1204x805 | 789 | unbackdropped |
|  | cast | `castG` | 1600889274 | 1208x832 | 820 | unbackdropped |
|  | hurt | `hurtG` | 442084169 | 1207x832 | 818 | unbackdropped |
|  | ko | `koG` | 1117019459 | 1163x794 | 778 | unbackdropped |
| `yunalesca-1` | idle | `idleG` | 1035166165 | 823x1184 | 1168 | unbackdropped |
|  | attack | `attackV3b` | 56940206 | 832x1216 | 1216 | unbackdropped |
|  | cast | `castV3` | 1721538663 | 830x1213 | 1116 | unbackdropped |
|  | hurt | `hurtV3` | 1921900288 | 796x1203 | 1187 | unbackdropped |
|  | ko | `koV3c` | 828456650 | 1216x832 | 832 | unbackdropped |
| `yunalesca-2` | idle | `idleG` | 378193467 | 832x1216 | 1216 | unbackdropped |
|  | attack | `attackG` | 2101663118 | 832x1216 | 1216 | unbackdropped |
|  | cast | `castG` | 693770895 | 832x1216 | 1216 | unbackdropped |
|  | hurt | `hurtG` | 299220536 | 832x1216 | 1216 | unbackdropped |
|  | ko | `koG` | 659061344 | 832x1216 | 1216 | unbackdropped |
| `yunalesca-3` | idle | `idleG` | 203863717 | 1216x832 | 832 | unbackdropped |
|  | attack | `attackG` | 1575909599 | 1145x799 | 783 | unbackdropped |
|  | cast | `castG` | 791973500 | 1148x814 | 806 | unbackdropped |
|  | hurt | `hurtG` | 687140752 | 1216x832 | 828 | unbackdropped |
|  | ko | `koG` | 241343207 | 1184x812 | 812 | unbackdropped |
| `portraits/seymour` | portrait | `portraitG` | 1976025016 | 832x1216 | - | - |
| `portraits/yunalesca` | portrait | `portraitF` | 6650155 | 832x1216 | - | - |

No baseline needed a hand correction this round. Every subject in this group
either floats (Seymour is cross-legged in midair, Mortiorchis hovers) or has no
feet at all (Yunalesca 2 ends in a tendril mass, Yunalesca 3 in a snake mass),
so the lowest opaque pixel *is* the bottom of the subject and the §5 caveat does
not bite. `yunalesca-1/cast` keeps the previous round hand-corrected `1116`.

`qc.py` reports `BG-RETAINED` and/or `FRAME-FULL` on all five `yunalesca-2`
files and on `yunalesca-3/idle`. Per §2.3 those are the known false positives
for these two subjects — they are tendrils and snake mass reaching the frame
edge. The magenta composite is clean.

---

## F4. Judging sheets kept from this round

| Sheet | What it shows |
| --- | --- |
| `docs/screenshots/art/_ba4-before.png` | the flagged files as the judge saw them |
| `_ba4-cand1.png` | round 1: mortiorchis + yunalesca-1 idles, no `--ref` |
| `_ba4-cand2.png` | round 2: the same two idles **with** `--ref`, plus the first Seymour portraits — this is the sheet that shows the 0.6 `--ref` failure on Mortiorchis |
| `_ba4-zoom1.png` | yunalesca-1 idle and Seymour portrait finalists at size |
| `_ba4-mor.png`, `_ba4-zoom2.png` | mortiorchis idle round 3 and its finalists |
| `_ba4-sey.png`, `_ba4-sey2.png` | Seymour state rounds 1 and 2 |
| `_ba4-y2.png`, `_ba4-y3.png` | the yunalesca-2 and -3 idle rounds that were rejected |
| `_ba4-zoom3.png` | the yunalesca-3 `medusa` finalists |
| `_ba4-port.png` | both portraits, checked for which way the head points |
| `_ba4-check.png` | **the magenta composite of all 27 promoted files** — the §2.3 check, run again |

Sheet specs are `tools/gen/sheet-art3-fix4-*.json`.

---

## F5. Left open after this round

- **`cast.json` is now wrong in a third way.** §6 already flagged the Yunalesca
  costume and the Seymour horn/aura wording. Add to that: `yunalesca-2` should
  be `832x1216`, not `1024x1024`, and all three of the identity strings in §F2
  should replace the manifest's. This group still does not own that file.
- **`mortiorchis/cast` keeps a pale oval inside the cage.** `unbackdrop.py`
  leaves it (it is enclosed and shaded, so it fails the "flat and unsaturated"
  test) and it is being kept deliberately: the bible's *Total Annihilation*
  tell is the inner void brightening from `#0B0A12` to `#E9FFF4`, which is
  exactly what it reads as. If a judge calls it a smear, reroll the state
  rather than lowering `--cut` — `--cut 215` was tried and does not touch it.
- **`yunalesca-1`'s four passing states still carry white masses** in `attack`
  and `cast` (§6 flagged `attack` last round). They were left alone because the
  judge passed them; if they are ever re-rolled, do the idle's tag string from
  §4 with this round's `--emphasis "(from side:1.45), ...)"` so they match the
  replacement idle's angle.
- **Seymour's KO is now a defeat pose but still not a *prone* one.** §6's note
  stands — he is fused to the mount at the waist. What shipped is the doubled
  -over slump the prone block cannot produce; if the engine ever wants him to
  fall, that is an animation decision, not a render.
- **The portrait facing override is a per-call escape hatch, not a contract
  change.** `docs/handoff/art3-contract.md` §1 still says portraits are
  `facing: none`. Two groups have now worked around it in two different ways
  (party-b added `three quarter view` as a pose tag; this round used
  `--facingPhrase` at a lower weight). Whoever owns the contract should pick
  one and write it down.

---

# Fix pass — round 5 (2026-09-18)

Sixteen states came back flagged: all three referenced `seymour-flux-body`
states, all four `mortiorchis` states, **all five** `yunalesca-2` states
(including its idle), two `yunalesca-3` states, and both portraits. Scores ran
3–6. Every one was regenerated, judged by reading the candidates on magenta,
and replaced.

`seymour-flux-body/idle`, `mortiorchis/idle` and `yunalesca-3/idle` passed and
were left alone — they are still the `--ref` anchors. `yunalesca-2/idle` did
**not** pass, so it was redone first and all four of its states re-referenced
at the replacement.

---

## G1. What the judge was right about, mechanically

### G1.1 `--ref` carries a reference's *ambiguity*, not just its mistakes

The pipeline doc warns that `--ref` propagates the reference's mistakes. This
round found the sharper version: it propagates what the reference is
**unclear** about, and amplifies it.

`seymour-flux-body/idle` passed the judge, but it is a slender figure in a
layered robe with very long pale hair and no strong masculine cue. Nothing in
it is *wrong*. Referenced at 0.6, all three states read to the judge as *"a
slender, feminine anime sorceress"* — the adapter carried the silhouette and
the palette and let the checkpoint resolve the sex, and the checkpoint's prior
for "long pale hair, ornate robe, delicate features" is female.

The fix is not a `--ref` setting. It is to state in the *prompt* what the
reference leaves open:

```
--emphasis "(1boy:1.4), (mature male face:1.35), (pronounced dark veins on his face:1.3), ..."
--negAdd  "1girl, female, woman, breasts, cleavage, lipstick, makeup, long eyelashes,
           feminine, androgynous, girl, ..."
```

5 of 5 came back unmistakably male on the first batch, at the **same** 0.6/0.3
that produced the failures. Nothing about the adapter changed.

**Rule for the next round:** before referencing an idle, ask what a stranger
could *not* tell from it. Whatever that is, put it in `--emphasis` on every
state, because the adapter will not.

### G1.2 A state's silhouette has to be in the identity tags, not left to `--ref`

`mortiorchis` failed in the mirror-image way. Its idle is unambiguous — one
bone machine on white — and F1.2 established that its states take `--ref` at
0.7 happily. They still came back as *"a spiny mass"*, *"an unidentifiable
bone-and-wood mass"*, *"a scatter of disconnected bone shards"*.

The cause was the *pose* tags. `damaged, cracked, broken ribs, sparks` and
`broken apart, collapsing` are instructions to **destroy the structure**, and
at 0.7 the adapter reproduces surface and palette but will not rebuild an
anatomy the prompt is actively dismantling.

Two changes fixed all four states on the first batch:

1. **Describe the body in `--tags`, every state.** The idle's identity string
   said `floating skeletal machine ... wide ribbed bone cage`. It now says
   `a long arched bone spine body carried on four thin bone legs ... a lantern
   skull head at the front`. The quadruped the judge said had "gone" was never
   named in the first place.
2. **Say it survives.** `--emphasis "(the entire creature in one piece:1.3)"`
   plus `scattered debris, shattered fragments, exploded, disassembled` in
   `--negAdd`. A damage state should read as *a creature that has been hit*,
   not as *debris*.

### G1.3 The action has to go in `--emphasis`, or `--ref` eats it

`yunalesca-2`'s four states at `--refWeight 0.5 --refStart 0.3` came back with
the identity fixed and the *pose* ignored — the judge's *"she is drifting, not
striking"* reproduced exactly. `--refStart 0.25` is documented as the setting
that lets the pose prompt lay the figure out first, and for a **calm** idle it
is. For a busy idle it is not enough on its own.

What worked was moving the action into the unescaped channel and giving the
prompt more of the denoise:

```
--refWeight 0.45 --refStart 0.4
--emphasis "(lunging forward:1.4), (one arm thrust straight forward:1.35),
            (tentacles lashing forward like spears:1.3), ..."
```

This is the same lesson as `comfy.mjs`'s `--emphasis` docstring, applied to
*verbs* rather than to identity tokens: a pose written only in `--poseTags` is
paren-escaped and unweighted, and loses to a reference. The KO went from five
"languid sits" to five genuine collapses on the same move.

Cost: at `--refStart 0.4` the reference no longer enforces `no legs`, and 3 of
5 `yunalesca-2/attack` candidates grew human legs. Judge for it.

### G1.4 `unbackdrop.py` needed a second, harder setting

Round 4 used `--cut 232 --spread 10 --enclosed` and called the set clean. The
judge still found opaque background in **nine** of the sixteen flagged states,
including *"a large solid white slab fills the centre"* on `yunalesca-2/ko`.

The defaults miss two things. Round 4's `--cut 232` only clears pixels at
channel values >= 232, and the checkpoint's "white" cyclorama is often a very
pale *warm* grey; and `--enclosed-min-fraction 0.012` ignores any enclosed blob
smaller than 1.2% of the image, which is most of the white slivers trapped
between tentacles and snake coils.

The setting that cleared them without eating silver hair:

```
--cut 222 --spread 16 --enclosed --enclosed-min-fraction 0.0015 --enclosed-min-solidity 0.35
```

On `yunalesca-2/ko` that removed 37,903 px where the round-4 setting removed
3,425. Silver hair survives because the "unsaturated" test is on channel
*spread*, and raising `--spread` from 10 to 16 still excludes hair's blue-violet
shadow ramp. **Check the result on magenta afterwards** — this is a heuristic,
and at `--cut 222` it is a keener one.

Every file this round is `ok` under `qc.py` except two known false positives
(§G4).

### G1.5 `plain empty white background` in `--tags` destroys the cutout

One Seymour portrait batch aborted after variant 1: the raw render was written,
no cutout appeared, and the remaining four variants never ran.

Cause is F1.3's failure mode reached by a different road. Putting
`plain empty white background behind him` in the **identity** tags (rather than
leaving the framing block to say `white background`) washed the whole render
toward white, `isnet-anime` mattes near-white as background, `rembg.py` exited
with *"nothing left after background removal"*, and the generator's batch loop
has no per-variant try/catch so the whole run died.

Removing the phrase fixed it. `--emphasis "(plain white background:1.4)"` is
safe; the same words in `--tags` are not, because `--tags` describes the
*subject*.

> **Worth fixing in the tool:** `runSprite`'s batch loop should catch a failed
> variant, log it and continue, rather than losing the rest of the batch. Not
> changed here — this group does not own `comfy.mjs`.

### G1.6 Pinning the full-creature scale on Yunalesca form 3 re-summoned the cream blob

The judge's `yunalesca-3/cast` complaint included a costume inconsistent with
the idle. Fixing that (bare-midriff bikini top, `gown`/`long dress` banned) also
pulled the composition in to a bust — a medusa woman with snake-locks rather
than the bible's §1.9 "small woman at the crown of a colossal snake mass".

A second batch (`castJ5.*`, seed 803001) tried to pin the scale with
`(wide shot of the entire creature:1.45)` and
`(the woman is tiny at the top of the frame:1.35)`, `close-up, portrait, bust,
upper body, face focus` banned. **All five came back as the cream-blob failure
F1.4 documents** — tan and cream wave-forms with a speck of a figure, no
readable anatomy. Discarded.

So F1.4's finding needs a boundary added: **`medusa` buys the canon reading
only at figure scale.** Ask the same checkpoint for the creature at landscape
scale and the snake mass loses its line work and reverts to the blob. The
shipped `cast` is the bust-scale variant, which is legible, faces frame-left,
wears the canon top and cuts out clean — four of the judge's four complaints —
at the cost of matching the idle's scale. §2.6's "form 3 is a compromise"
still stands.

---

## G2. The tag strings that produced this round's keepers

Style, quality and composition blocks come from `comfy.mjs`. All battlefield
subjects: `boss` preset, `--facing left`.

**`seymour-flux-body`** — states only; the idle is unchanged.
`--size 832x1216`, `--ref public/art/characters/seymour-flux-body/idle.png --refWeight 0.6 --refStart 0.3`

```
1boy, seymour guado, final fantasy x, safe, solo, male focus, adult man,
masculine face, pale blue-grey skin, light blue hair, very long hair, two long
thick locks of hair falling down his back, hair over one eye, purple eyes,
pronounced dark veins on his face, ornate dark blue robe, red trim, green sash,
open robe, exposed chest, chest tattoo, wide sleeves, floating in midair,
no legs, lower body fused into a bone frame, tattered robe hem
--negAdd "1girl, female, woman, breasts, cleavage, lipstick, makeup, long
          eyelashes, feminine, androgynous, girl, horns, antlers, helmet, legs,
          thighs, feet, standing, shoes, scenery, floor, shadow, cast shadow,
          reflection, cropped, out of frame, bare midriff, topless"
```

Per-state `--emphasis` is the block in §G1.1 plus one action token:
`(one open hand with five spread fingers:1.3)` for attack — the judge's
*"ambiguous claw/sleeve with no resolvable hand"* — `(head thrown back:1.3)`
for hurt, `(head hanging forward:1.3)` for ko.

**`mortiorchis`** — `--size 1216x832`, `--ref .../mortiorchis/idle.png --refWeight 0.7 --refStart 0.3`

```
no humans, floating skeletal machine, a long arched bone spine body carried on
four thin bone legs, wide ribbed bone cage, ribcage, a lantern skull head at
the front with many small glowing green eyes, mandibles, one long curved scythe
blade arm glowing green, chitin, brass and bone, dark brown metal, bone white,
hollow center, glowing green core, brass censer hanging on a chain below it,
golden sunburst rosette halo floating above the skull, hovering in the air,
seen from an angle, ominous, monster, machinery
--emphasis "(from side:1.4), (asymmetrical:1.3), (long arched bone body on four
            thin legs:1.35), (the entire creature in one piece:1.3),
            (white background:1.35)"
--negAdd   F2's string + "scattered debris, shattered fragments, exploded, disassembled"
```

**`yunalesca-2`** — `--size 832x1216`. Idle: `--ref .../yunalesca-1/idle.png --refWeight 0.5 --refStart 0.3`. States: `--ref` the **new** idle, `0.5/0.3` for cast and hurt, `0.45/0.4` for attack and ko (§G1.3).

```
1girl, yunalesca, final fantasy x, safe, solo, monster girl, upper body of a
pale woman rising from a huge writhing clump of dark violet tentacles, no legs,
her hips dissolving into thick matte violet tendrils, tendrils like coarse
matted hair, root mass, silver hair, very long hair, yellow eyes, pale skin,
blue headband headdress with two long silver plumes zigzagging into an M shape,
blue beads, yellow tassels, blue and black bikini top, gold chain, gold
bracelet, blue armband, green sash, revealing clothes, demonic, menacing, monster
--emphasis "(rising from a clump of dark violet tentacles:1.45), (no legs:1.3),
            (yellow eyes:1.2), (matte hair-like tendrils:1.25), (white background:1.35)"
--negAdd   F2's string + "glossy, shiny, latex, wet, rubber, ribbon, crown,
           tiara, feather fan, flower, shadow, cast shadow, reflection"
```

Two wording changes did the work the judge asked for. *"Tentacles are glossy
purple ribbons rather than canon's dark, hair-like mass"* → `tendrils like
coarse matted hair`, `matte`, with `glossy, shiny, latex, wet, rubber, ribbon`
banned. *"The crest is a small red/blue crown unlike canon"* and the recurring
*"huge blue feather crown"* → the canon headdress spelled out from
`research/visual-bible.md` §1.9, with `crown, tiara, feather fan` banned.

**`yunalesca-3`** — cast and ko only. `--size 1216x832`, `--ref .../yunalesca-3/idle.png --refWeight 0.6 --refStart 0.3`

```
1girl, yunalesca, final fantasy x, safe, solo, medusa, gorgon, monster girl,
giant monster, small pale woman with silver hair and an ornate blue headdress
at the top, yellow eyes, blue and black bikini top, bare midriff, her lower
body a colossal mass of pale bone-white snakes, dozens of snake heads radiating
outward like a sunburst, a huge gorgon face with hollow glowing yellow sockets
below her, snake hair, bone white and desaturated violet, looming over the
viewer, monstrous
--emphasis "(dozens of snakes radiating outward:1.4), (medusa:1.3), (bone white
            and violet:1.25), (from side:1.4), (bare midriff bikini top:1.25),
            (white background:1.35)"
--negAdd   F2's string + "circle, disc, halo, background plate, sun, moon,
           shadow, cast shadow, reflection, symmetrical, frontal, crossed arms"
```

`circle, disc, halo, background plate` is what removed the judge's *"large
opaque tan disc baked in behind the figure"*. Naming the unwanted **shape** in
the negative is cheaper than trying to describe an empty background.

**Portraits** — `character` preset, `--composition portrait`, `--facing left`,
`--size 832x1216`, no `--ref`, and F1.5's softened phrase pushed one notch
because the judge called the round-4 turn *"marginal"*:

```
--facingPhrase "(from side:1.25), three-quarter view, head turned toward the viewer, (looking at viewer:1.3)"
```

1.25 turns the head ~40 degrees and keeps both eyes on the player. 1.3 (the
battlefield weight) still flattens a close-up into profile; 1.15 was too little.

`portrait-seymour`:

```
1boy, seymour guado, final fantasy x, safe, solo, male focus, adult man,
pale blue-grey skin, light blue hair, hair lacquered and swept up into a tall
wide fan-shaped crest, two long horn-like locks of hair falling down his back,
purple eyes, pronounced dark veins branching across his face, ornate layered
guado robe, dark blue robe with red trimmings, tall high collar lined with red,
green sash, calm unsettling smile
--emphasis "(1boy:1.4), (tall wide fan-shaped hair crest:1.4), (pronounced dark
            veins on his face:1.3), (plain white background:1.4)"
--negAdd   "1girl, female, feminine, lipstick, makeup, beard, stubble, horns,
            antlers, helmet, mask, crown, armor, hood, scenery, cropped, out of
            frame, circle, ring, arc, halo, decorative frame, ornament, folding
            fan, feathers, wings, stained glass, banner, curtain"
```

The crest is written as **hair** and `horns, antlers, helmet, mask` are banned,
per `cast.json`'s canon note. `(tall wide fan-shaped hair crest:1.4)` is what
finally produced it; at 1.3 it read as ordinary long hair. The ornament bans
were added after two otherwise-excellent candidates came back with an opaque
gold arc and a folding fan behind the head — `despeckle.py` could not drop
either, both being connected to the hair.

`portrait-yunalesca`:

```
1girl, yunalesca, final fantasy x, safe, solo, long silver hair, very long hair,
pale porcelain skin, yellow eyes, no visible pupils, a blue beaded headband with
four ribbons finished with blue beads and yellow tassels, two long silver plumes
on the headdress that zigzag into an M shape, blue bead necklace, gold bracelets,
blue armbands, bare shoulders, blue and black top, serene cruel smile, elegant
--emphasis "(blue beaded headband with tassels:1.35), (two silver plumes
            zigzagging into an M shape:1.3), (yellow eyes:1.25), (silver
            hair:1.2), (white background:1.3)"
--negAdd   "blonde hair, feather fan, petal crown, large crown, tiara, oversized
            headdress, earrings, gown, long dress, white dress, armor, hood,
            cropped, out of frame, scenery, floating jewelry, detached accessories"
```

`floating jewelry, detached accessories` answers the judge's *"bead strand at
the bottom floats unattached"*. She was **re-rendered facing left rather than
mirrored**, because the headdress ribbon arrangement and the single-shoulder
drape are asymmetric and a mirror would have been a chirality bet.

Pose tags, where they differ from §F2:

| Subject | State | `--poseTags` |
| --- | --- | --- |
| `seymour-flux-body` | attack | `attacking, his right arm thrust straight forward toward the target on the left, the open clawed hand clearly visible at the end of the straight outstretched arm with five separate fingers spread, violet energy gathered in the open palm, left arm flung back, head lowered, snarling, wide sleeves whipping back` |
| `mortiorchis` | attack | `attacking, the whole creature lunging forward to the left, its long bone body held low and level, the curved scythe blade arm swept forward ahead of the skull with the blade leading, green core blazing bright` |
| | hurt | `recoiling from a hit, the whole creature jerked backward and tilted off balance, cracked bone plating, sparks, the scythe blade arm flung out to one side, green light flickering, the body still in one piece` |
| | ko | `destroyed and defeated, the whole creature collapsed down flat onto the ground, its four legs buckled and splayed out, the skull sunk low and resting on the ground, the scythe blade arm fallen flat beside it, the green core gone out and dark, cracked, dissolving into pyreflies` |
| `yunalesca-2` | attack | `attacking, lunging bodily forward toward the target on the left, one arm thrust straight out in front of her with the clawed hand open and fingers spread, the other arm flung back behind her, the tentacles lashing forward like thrown spears, mouth open snarling, hair streaming backward` |
| | ko | `defeated and dying, her upper body collapsed forward and hanging straight down limply over the tentacle mass, head hanging down, eyes closed, both arms dangling loose toward the ground, shoulders slumped, the tentacles splayed out flat and limp along the ground, dissolving into pyreflies, motes of light` |

`the whole creature` / `her upper body` as the grammatical subject of a damage
pose is doing real work — it keeps the sentence about a body rather than about
an event.

---

## G3. New tool

`tools/gen/magenta.py`. Composites cutouts onto magenta in a labelled row with
each file's opaque-pixel percentage:

```
python_embeded\python.exe -s tools/gen/magenta.py \
    "public/art/characters/mortiorchis/*.png" \
    --out docs/screenshots/art/_check.png --height 420
```

§2.3 identified the magenta composite as the check that catches a retained
backdrop, and F4 kept one as a deliverable, but both rounds built it by hand.
It is now a tool, because **it was the deciding judgement in every pick this
round** — several candidates that looked perfect on the checkerboard sheet were
carrying a white slab, and two picks changed after seeing them on magenta. It
only reads PNGs and writes the output image; it never touches a sprite or a
sidecar.

Suggested order for the next round: generate → `unbackdrop.py` → `magenta.py` →
**read the magenta sheet** → pick → `qc.py` → promote.

---

## G4. What shipped

Sixteen files replaced. All `ok` under `qc.py` except the two noted.

| Subject | States replaced | Seeds |
| --- | --- | --- |
| `seymour-flux-body` | attack, hurt, ko | 781003, 782003, 783003 |
| `mortiorchis` | attack, cast, hurt, ko | 791003, 792001, 793004, 794002 |
| `yunalesca-2` | **idle**, attack, cast, hurt, ko | 770003, 775001, 772003, 773002, 776004 |
| `yunalesca-3` | cast, ko | 801004, 802002 |
| portraits | seymour, yunalesca | 813001, 812001 |

Every sidecar carries a `fixRound` field saying what the judge flagged and what
changed, so the next reader does not have to diff against this document.

**Facing:** every replaced state is frame-left as generated. **Nothing needed
`flip.py` this round** — which is the contract's prediction holding for a third
time (§2.4): the checkpoint's bias is frame-left, enemies want frame-left, and
`--facing left` simply lands. Both portraits were rendered leftward rather than
mirrored (§G2).

**Two `qc.py` flags are known false positives and were left:**

- `yunalesca-3/idle` — `BG-RETAINED,FRAME-FULL`. Untouched this round (the
  judge passed it); the snake mass legitimately reaches all four corners. Clean
  on magenta. Same call as round 4.
- `seymour-flux-body/hurt` — `DANGLE-83px`. The §5 dangling-prop caveat is
  about something hanging below the **feet**; Seymour has no feet, floats, and
  is composited onto Mortiorchis. The lowest opaque pixel is the bottom of the
  subject, so `baselineY` is right as generated. The reasoning is written into
  `hurt.json` as `baselineNote`.

Both portraits report `BG-RETAINED,FRAME-FULL`, as does **every** portrait
already in `public/art/portraits/` (tidus 76.4%, auron 89.8%, lulu 88.4%,
jecht 88.2%). A head-and-shoulders bust fills its frame. Mine are 76.7% and
84.4%, inside the existing range.

Contact sheets rebuilt: `docs/screenshots/art/{seymour-flux-body,mortiorchis,
yunalesca-2,yunalesca-3}.png` from the existing `tools/gen/sheet-art3-*.json`
specs, plus `_ba5-portraits.png` from a new `sheet-art3-ba-portraits.json`.

---

## G5. Judging sheets kept from this round

| Sheet | What it shows |
| --- | --- |
| `_ba5-y2idle.png`, `_ba5-y2idle-mag.png`, `_ba5-y2idle-zoom.png` | the `yunalesca-2` idle round — checkerboard, magenta, and the two finalists at size. The magenta sheet is why candidate 3 beat candidate 1 |
| `_ba5-y2-attack.png`, `-cast.png`, `-hurt.png`, `-ko.png` | the first state batch, at `0.5/0.3` — the sheets that show the pose being eaten (§G1.3) |
| `_ba5-y2-attackG5.png`, `_ba5-y2-koG5.png` | the re-roll at `0.45/0.4` with the action weighted |
| `_ba5-y2-ko-zoom.png`, `_ba5-y2-ko-hard.png` | the same three KO finalists before and after the harder `unbackdrop.py` — the clearest illustration of §G1.4 |
| `_ba5-y2-final.png` | all five promoted `yunalesca-2` files on magenta |
| `_ba5-refs.png` | the three idles that passed, as the states had to match them |
| `_ba5-sey-attackH5.png`, `-hurtH5.png`, `-koH5.png`, `_ba5-sey-hurt-zoom.png`, `_ba5-sey-zoom.png`, `_ba5-sey-ko-clean.png` | the Seymour state rounds |
| `_ba5-mor-attackH5.png`, `-castH5.png`, `-hurtH5.png`, `-koH5.png`, `_ba5-mor-zoom.png` | the Mortiorchis rounds; the zoom puts the four finalists beside the idle, which is how the silhouette match was judged |
| `_ba5-y3-castH5.png`, `_ba5-y3-koH5.png`, `_ba5-y3-final.png`, `_ba5-y3-zoom.png` | the Yunalesca-3 rounds, including the discarded `castJ5` cream-blob batch in `_ba5-y3-final.png` |
| `_ba5-portrait-seymourH5.png`, `_ba5-sey-port-zoom.png`, `_ba5-sey-port-desp.png`, `_ba5-sey-port2.png` | the Seymour portrait rounds, the two ornament failures, and the `despeckle.py` attempt that could not drop them |
| `_ba5-portrait-yunalescaH5.png`, `_ba5-port-zoom.png` | the Yunalesca portrait round and both finalist pairs at size |
| `_ba5-check-a.png`, `_ba5-check-b.png` | **the magenta composite of all sixteen replaced files** — the §2.3 check |

Sheet specs added: `tools/gen/sheet-art3-fix5-y2idle.json`,
`tools/gen/sheet-art3-ba-portraits.json`. The rest were built directly with
`magenta.py`, which takes paths rather than a spec.

---

## G6. Left open after this round

- **`cast.json` is now wrong in a fourth way, and nobody owns it.** §6 flagged
  the Yunalesca costume and the Seymour horn/aura wording; F5 added the
  `yunalesca-2` canvas and the three identity strings. Add: the manifest still
  says Yunalesca has **`blonde hair`** in all three forms and in her portrait
  row. `research/visual-bible.md` §1.9 says **silver**, verified, and every
  keeper this round and last was rendered with `silver hair` and `blonde hair`
  in the negative. Four rounds have now worked around this file rather than
  fixing it.
- **The judge and the bible disagree about Seymour's face, and it was decided
  in the bible's favour.** The judge asked for *"blue-grey skin and the
  orange-red facial markings"* and called the violet eyes wrong, wanting pale
  blue. `research/visual-bible.md` §1.8 records **purple eyes** as verified
  (`#7E5FC4`) and the face marks as **veins** (`#6E4E78`), citing the FF Wiki
  appearance section. The portrait and all three states shipped with purple
  eyes and pronounced dark veins. If the judge is working from a different
  source, the bible should be corrected and this group re-run; if not, the
  judging brief should cite the bible. **This is the one open item that could
  fail the same states again.**
- **`comfy.mjs` loses a whole batch when one variant's cutout fails** (§G1.5).
  A try/catch around the per-variant body of `runSprite` would have saved a
  four-render round trip. This group does not own that file.
- **`yunalesca-2/attack` and `/hurt` are the weakest of the sixteen.** Both are
  consistent with the idle, clean, canon and frame-left, but the attack reads
  as a forward lean rather than a strike and the hurt as a flinch rather than a
  recoil. §G1.3's `--refStart 0.4` bought most of the difference; getting the
  rest probably means dropping `--ref` entirely for those two and relying on
  the identity tags, which is a bigger experiment than a fix pass should run.
- **`yunalesca-3` still has no full-creature state.** §G1.6 explains why the
  attempt failed. If the bible's §1.9 composition matters to the encounter, it
  needs `--img2img` off a rough layout sketch — the lever ART-PIPELINE §3 was
  added for and that nobody in this group has yet pulled.
- **The portrait facing override is now three rounds old and still not in the
  contract.** F5 flagged this; this round used the same `--facingPhrase`
  escape hatch again, at a third weight (1.25). `docs/handoff/art3-contract.md`
  §1 still says portraits are `facing: none`. Whoever owns the contract should
  write down 1.25 and delete the argument.
