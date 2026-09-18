# Art round 3 — group "party-a" (Tidus, Yuna, Auron, Wakka)

**Contract:** v3 facing (`docs/handoff/art3-contract.md`, `docs/ART-PIPELINE.md` §2a).
**Scope:** four FFX party members, states `idle attack cast item hurt ko victory`
(+ `summon` for Yuna), plus the four HUD portraits.
**Stack:** ComfyUI 0.35.0 @ 127.0.0.1:8188, Animagine XL 4.0 Opt, IP-Adapter
plus / CLIP-ViT-H. Defaults: 28 steps, CFG 6, euler_ancestral, 832×1216
(1216×832 for `ko`).
**Status:** complete. 29 states + 4 portraits, all v3. Contact sheets in
`docs/screenshots/art/{tidus,yuna,auron,wakka}.png`.

Every state below was judged **facing first** (frontal = reject, flat profile =
reject, good-but-backwards = mirror with `flip.py`), then costume, then extra
subjects, cropped limbs and the cutout.

---

## 1. Identity tags used, and why they differ from `cast.json`

`cast.json` is v3's work order, but three of its four rows carry costume tags
that `research/visual-bible.md` §1 contradicts. The blind judge scores canon, so
the bible won; the deltas are below and should be folded back into `cast.json`
by whoever owns that file (this group is not allowed to write it).

| Subject | `cast.json` says | Bible §1 says | What was rendered |
| --- | --- | --- | --- |
| Tidus | `yellow hooded vest, hood, black shorts` | white hood; **blue pauldron over the left arm**; dungarees with **one short and one long trouser leg** | added `white hood, blue pauldron, shoulder armor, black overalls, uneven legwear` |
| Tidus | `brotherhood (sword), blue sword` | a **longsword ending in a hook**, water-blue blade | added `longsword, glowing blue blade` — the task's "long hooked blade, not a dagger" |
| Yuna | `white kimono top, blue skirt, purple obi` | **purple pleated hakama**, **yellow** obi, white sash over a **black camisole**, pink-and-white detached sleeves | `purple hakama, pleated skirt, yellow obi, white sash, black camisole, pink and white sleeves` |
| Wakka | `open jacket, blue jacket, yellow overalls` | **yellow vest cut away at the stomach** (bare midriff), **blue** baggy trousers | `yellow vest, midriff, navel, blue pants, baggy pants` |
| Auron | (as written) | left arm inside the haori, that sleeve hanging **empty** | added `haori, empty sleeve, gauntlet, shoulder pad`; pose tags say it too |

Style and quality tags were never passed through `--tags` — the generator
appends them (§2 of the pipeline doc).

The four approved idles are the anchors; every other state is `--ref`'d at them
at the house default (`0.65 / 0.25 / 0.85`). Exact identity tag strings are
recoverable from any sidecar's `prompt` field.

---

## 2. Facing, per subject — what the seeds actually gave

The contract predicts a frame-**left** bias and it held: of the 16 round-A idle
variants, **zero** came back convincingly angled to the frame-right. Party art
therefore reaches `facing: right` through `flip.py`, except Auron.

Confirmed again this round: **`--ref` does not carry facing.** Referenced states
off an already-mirrored (frame-right) idle still came back in a mix of
directions, exactly as §4 of the contract predicts. Every state was judged for
direction on its own and the frame-right variant picked; only `yuna/ko` needed
a post-hoc mirror.

### The Auron problem, and what it cost

Auron is on the contract's chirality list — his coat is off his **left**
shoulder, so a mirror moves the empty sleeve to the wrong side and puts the
katana in his left hand. `flip.py` is therefore banned for him and **the seed is
the only lever on his facing**. Round A (4 variants, seeds from the name hash)
was a clean sweep of rejects:

| Variant | Verdict |
| --- | --- |
| `idle.1` | frame-left, **both arms out of the sleeves** |
| `idle.2` | frame-left, **two katanas** (one sheathed, one held), both arms out |
| `idle.3` | near-frontal, both arms out, coat rendered as a full monk robe |
| `idle.4` | see §3 |

So round B rewrote the pose prompt to state the empty sleeve three ways
("only one arm out of the coat / left arm tucked inside the coat / empty left
sleeve hanging loose and flat"), added `--negAdd` for the duplicate katana and
the second bare arm, and ran **8 fresh seeds from `--seed 771001`** (a re-run
without `--seed` reproduces the name-hash seeds exactly and would have returned
the same four rejects). `idle-b.3` (seed 771003) is the keeper: frame-right off
the seed, no mirror, one arm out, empty left sleeve hanging flat.

Because Auron cannot be mirrored, **every one of his states was generated at
`--batch 4` rather than 3**, and the empty-sleeve pose language and the round-B
`--negAdd` block were repeated on each one. That is the standing cost of a
chiral subject: ~33% more renders and a reroll instead of a one-second flip.

---

## 3. Log — every state, what was picked and why

Seeds below are the seed of the **chosen** variant. `pickedFrom` in each sidecar
records the variant filename; `round: art3-party-a` marks everything this round
promoted.

### Tidus — `public/art/characters/tidus/`

| State | Seed | Picked | Notes |
| --- | --- | --- | --- |
| `idle` | 458204069 | (round A, mirrored) | Anchor. Boots are the lowest content, so `baselineY` 1116 needs no hand-correction. |
| `attack` | 1580140869 | (round A, mirrored) | Kept from the earlier v3 pass. |
| `cast` | 2002385881 | `cast.2` | Magic circle under the feet, Brotherhood in the left hand, right hand raised. `.3` was cropped at the knees; `.1` grew a second blade. |
| `item` | 880101 | `item-b.1` | **Reroll.** Round A never rendered a visible potion in 3 variants — all three read as "standing holding a sword". Round B named the prop explicitly ("small glass potion bottle, blue potion vial") and landed it first try. |
| `hurt` | 880201 | `hurt-b.1` | **Reroll.** Round A read as standing calm and `.2` grew a **third sword**. Round B ("recoiling from a blow, head thrown back, grimacing") reads as a stagger. |
| `victory` | 119901573 | `victory.1` | Sword raised, looking up. Blade points up, so the boots stay the lowest content. |
| `ko` | 265415409 | `ko.2` | Head-**right** off the seed, no mirror needed. `.1` lay head-left; `.3` was cropped to a bust. |

### Yuna — `public/art/characters/yuna/`

| State | Seed | Picked | Notes |
| --- | --- | --- | --- |
| `idle` | 1391125895 | (round A, mirrored) | Anchor. Heterochromia and the staff both land. |
| `attack` | 114166292 | (round A) | Kept from the earlier v3 pass. |
| `cast` | 1722756174 | (round A) | Kept from the earlier v3 pass. |
| `item` | 952568801 | `item.2` | Free hand extended forward in an offering gesture. No literal potion renders for her either, but the gesture reads. |
| `hurt` | 1959980114 | `hurt.1` | Round A kept over the round-B reroll: `hurt.2` read as hurt but carried the **paint-swirl artifact** (§4), and all four round-B variants came back as static standing poses. `.1`'s raised hand at least reads as a flinch. |
| `victory` | 2007886274 | `victory.2` | Staff raised, heterochromia unmistakable. |
| `summon` | 1177599153 | `summon.2` | Staff overhead, full glyph circle at the feet and the disc behind her. The best image in the whole group. |
| `ko` | 1592555139 | `ko.3` → **flipped** | All three variants lay **head-left**; the contract puts a downed party member head-**right**. Mirrored with `flip.py --set-facing right`. Yuna carries nothing chiral, so the mirror is safe. |

### Auron — `public/art/characters/auron/`

| State | Seed | Picked | Notes |
| --- | --- | --- | --- |
| `idle` | 771003 | (round B, **not** mirrored) | Anchor. One arm out, empty left sleeve. |
| `attack` | 1475087446 | `attack.2` | Overhead swing, coat flaring, one arm out. `.1` was buried in a paint swirl, `.3` faced frame-left (unmirrorable), `.4` was cropped at the knees. |
| `cast` | 880401 | `cast-b.1` | **Reroll.** All four round-A casts put **both arms out of the coat** — the one defect that is an automatic reject for him. Root cause: "raising hand, arm up" asks for a free hand he does not have. Round B put the magic on the blade instead ("katana raised in his right hand, glowing magic circle around the blade") and banned `two hands, both hands visible, second hand, open palm`. |
| `item` | 2091034459 | `item.1` | The only Auron variant in the group holding a clearly-readable flask, and it keeps the single-arm silhouette. |
| `hurt` | 880501 | `hurt-b.1` | **Reroll.** Round A read as standing. Round B leans him back with the katana lowered. `.2`/`.3` both grew a tan swirl blob. |
| `victory` | 1331870046 | `victory.1` | **Canon deviation, deliberate:** `cast.json` asks for "arms raised, cheering, smiling" for every party member. That is impossible with one arm inside the coat and out of character besides, so this group used "katana resting on his shoulder, head turned, slight smirk, victorious". Recommend folding this into `cast.json`. |
| `ko` | 800924893 | `ko.4` | Head-**right** off the seed. Preferred over `ko.2` (also head-right) because `.2` came back as an uncropped 1216×832 frame, i.e. rembg had kept background. |

### Wakka — `public/art/characters/wakka/`

| State | Seed | Picked | Notes |
| --- | --- | --- | --- |
| `idle` | 1955268328 | (round A, mirrored) | Anchor. Pompadour, headband, bare midriff, blitzball. |
| `attack` | 673816224 | (round A) | Kept from the earlier v3 pass. |
| `cast` | 1361612695 | `cast.2` | Fire orb in the raised hand, blitzball floating, glyph circle at the feet. `.1` faced frame-left; `.3`'s glow was a huge opaque blob rembg kept. |
| `item` | 539050445 | `item.2` | Arm extended, object in hand, face readable. |
| `hurt` | 1968298039 | `hurt.2` | Head thrown back, genuine stagger. `.1` carried a rainbow arc artifact. |
| `victory` | 1128808182 | `victory.3` | Grinning salute. The blitzball is absent (`cast.json` asks for "ball under arm"), accepted because the pompadour + headband + vest already name him and this was the strongest face in the batch. |
| `ko` | 1069457708 | `ko.2` | Head-**right** off the seed, ball still in frame. |

### Portraits — `public/art/portraits/`

| Subject | Seed | Picked |
| --- | --- | --- |
| `tidus` | 1012264601 | `tidus.2` |
| `yuna` | 2082598153 | `yuna.1` — the over-the-shoulder turn, heterochromia dead centre |
| `auron` | 542475738 | `auron.3` |
| `wakka` | 131124184 | `wakka.3` |

**Facing on portraits — a conflict this round had to resolve.** The brief for
this group asked for "three-quarter face, party looking right"; the adopted
contract (`art3-contract.md` §1, `ART-PIPELINE.md` §2a and `cast.json` all
agree) puts portraits at `facing: none`, straight-on, because "a HUD head-shot
meets the player's eye". These were rendered as:

```
--composition portrait --facing none --facingPhrase "three-quarter view, head
turned slightly to the right, face toward the viewer, looking at viewer"
```

Two deliberate choices in that:

1. **`--facing none`, so the `FACING_NEGATIVE` block is NOT appended.** That
   block bans `facing viewer, front view, straight-on` — which is exactly what a
   HUD portrait wants, and applying it to a head-shot fights the framing.
   `--facingPhrase` supplies the three-quarter on its own.
2. **The weighted `(from side:1.3)` is deliberately not used here.** §2a records
   that it overshoots into a flat profile often enough to matter; on a close-up
   that loses the face the blind judge has to name. A mild unweighted phrase is
   enough at portrait framing because there is no full-body pose competing with it.

Each portrait is `--ref`'d at its own approved idle at `--refWeight 0.5` (not
0.65) so the face matches the sprite without the idle's body lighting flooding
a close-up.

If the roster owner wants portraits strictly straight-on per the contract,
re-run the four with `--facing none` and no `--facingPhrase`; nothing else about
them changes.

---

## 4. Failure modes seen this round

- **The paint swirl is still the most common single defect.** It hit
  `auron/attack.1`, `yuna/hurt.2`, `wakka/hurt.1`, `auron/hurt.2` and
  `auron/hurt.3` — a coloured ribbon or blob around the figure that rembg keeps
  as opaque content. Adding `aura, energy ribbon, colored swirl, glowing ribbon,
  motion blur, speed lines` to `--negAdd` on the rerolls suppressed it but did
  not eliminate it (`tidus/hurt-b.2` still grew one). It clusters on `hurt`
  prompts, which makes sense — "recoiling from a blow" invites impact effects.
  Worth considering for `SPRITE_NEGATIVE` in `comfy.mjs`.
- **Duplicate weapons** on Tidus (`hurt.2`, three swords) and Auron (round-A
  idles). The existing `--negAdd` block handles Auron's; Tidus has none.
- **Uncropped frames.** `auron/ko.2`, `auron/attack.{1,3,4}`, `auron/item.2`,
  `wakka/item.1`, `wakka/ko.1`, `yuna/attack.3` all came back at exactly the
  full canvas, meaning rembg found no background to remove. A cheap automated
  screen: a sidecar whose `width`×`height` equals the canvas is suspect.
- **No black renders this round**, despite another agent generating on the same
  GPU throughout (Kimahri, group party-b). The contract's warning still stands,
  but concurrency did not corrupt anything here — every raw was >500 KB.

## 5. Verification actually run

- **Cutout check** on all 29 finals: fraction of transparent pixels (43–72% for
  standing poses, 32–52% for prone), fully-opaque border lines, and a bright-rim
  halo ratio. Everything passed. `yuna/summon` flags 22% "halo" — inspected on a
  magenta field and it is the **intended** glowing summon circle, not leftover
  white background; the body edge is clean.
- **Baseline check.** Three states initially flagged as hanging-prop candidates
  (`tidus/attack`, `yuna/cast`, `auron/victory`). All three were inspected by
  cropping the bottom 190 px with `baselineY` drawn on: **the line sits exactly
  on the boot soles in every case.** The flag was a false positive of the
  heuristic — it compared against the *widest* row, which for these is a flaring
  coat or skirt well above the feet. **No hand-corrected `baselineY` was needed
  anywhere in this group**, and none was written.
- **No frontal art left.** Every final sidecar carries either the v3
  `(from side:1.3)` facing phrase or `composition: prone`; no `straight-on`
  remains for these four subjects. All numbered variants and `*.raw.png` were
  deleted, leaving exactly 58 files (29 states × png+json) plus 8 portrait files.

---

# Fix pass — 2026-09-18 (round `art3-party-a-fix`)

The blind judge returned four states at score 6, all with `facingOk: false`:
`yuna/hurt`, `auron/cast`, `auron` (HUD portrait) and `wakka/hurt`. All three
idles passed, so the anchors were left alone and only the four states were
re-run, each `--ref`'d at its own approved idle at the house defaults
(`0.65 / 0.25 / 0.85`; the portrait at `0.5` as before).

**Fresh seed bases were passed explicitly** (`--seed 9901xx` etc.) and the runs
were staged under throwaway pose names (`hurt-c`, `cast-c`, `cast-d`,
`portrait-c`) so a re-run could not reproduce the rejected name-hash seeds and
so the old finals stayed in place until a keeper existed.

## 1. What was picked

| State | Round | Variants | Keeper | Seed | Flipped? |
| --- | --- | --- | --- | --- | --- |
| `yuna/hurt` | `hurt-c` | 5 | `hurt-c.1` | 990101 | no — frame-right off the seed |
| `auron/cast` | `cast-c` (5) then `cast-d` (8) | 13 | `cast-d.3` | 990213 | no — mirroring is banned for him |
| `wakka/hurt` | `hurt-c` | 5 | `hurt-c.2` | 990402 | no — frame-right off the seed |
| `portraits/auron` | `portrait-c` | 5 | `auron-c.3` | 990303 | no |

Sidecars carry `round: "art3-party-a-fix"` and the `pickedFrom` variant name.
All numbered variants and `*.raw.png` for these four were deleted; the three
contact sheets were rebuilt from the committed specs
(`docs/screenshots/art/{yuna,auron,wakka}.png`).

## 2. Per-state — the judge's complaint and what fixed it

### `yuna/hurt` — "frontal, calm standing beat, obi and sash drift"

The rejected render was the round-A `hurt.1`, kept last round only because the
round-B rerolls were *worse*. It was a standing figure with one hand raised.

Fix was mostly in the pose prompt: the old tags (`flinching, recoiling,
staggering backwards, pained expression, off balance`) are adjectives, and this
checkpoint renders adjectives as facial expression on an otherwise neutral body.
Replaced with body mechanics —

```
recoiling from a heavy blow, staggering backwards, upper body twisted back,
head thrown back, eyes shut, grimacing in pain, mouth open, free hand clutching
her chest, staff swung down low in the other hand, knees buckling, off balance
```

plus `--negAdd "standing straight, calm expression, smiling, serene, gentle
smile, neutral pose, relaxed pose, symmetrical stance, ... blue obi, pink obi,
red obi, gown, dress"`. The obi colour bans are the costume half of the fix:
the identity tags were taken **verbatim from the approved idle's sidecar
prompt** rather than retyped, so `white sash, yellow obi, purple hakama,
pink and white sleeves, black camisole, black boots` are now character-for-
character identical between idle and hurt.

`hurt-c.1` is a genuine stagger — body angled ~50 degrees to frame-right, front
leg planted, torso leaning back away from the blow, head turned back to camera
with one eye readable, staff swung down and behind. `hurt-c.4` was the runner-up
(cleaner heterochromia, both eyes visible) but its legs are straight and
together, which reads as looking upward rather than being hit. Anti-recoil
language beats a better face here, because "not a hit reaction" was the actual
complaint. 2 of the 5 still came back as calm standing beats and `.5` grew the
paint swirl, so the defect is suppressed rather than cured.

### `auron/cast` — "frontal, face buried in the collar, static vertical sword"

Three separate problems, and the negative prompt is where two of them were
fixed. Added to the existing round-B block:

```
face hidden, face obscured, collar covering face, chin tucked, head down,
looking down, vertical sword, sword in front of face, blade covering the face,
sword centered, standing still, idle pose
```

and the pose prompt now says where the blade goes (`katana raised diagonally to
the upper right in his right hand`) and where the face goes (`head turned toward
the viewer, chin up, face clear of the collar, sunglasses visible`).

**This state cost 13 renders, and the reason is chirality.** Auron cannot be
mirrored (the haori is off his left shoulder; ART-PIPELINE section 2a), so
frame-right has to come out of the seed. The first batch of 5 (`cast-c`) was a
clean sweep on direction — 5/5 frame-left — even though `cast-c.1` was
otherwise the best-lit render of the day. A second batch of 8 fresh seeds
produced exactly one usable frame-right variant, `cast-d.3`. That is 1 in 13,
consistent with the ~1 in 8 the round-B idle search cost, and it is the standing
price of a chiral subject under the frame-left bias.

`cast-d.3`: body turned ~45 degrees frame-right, forward hand raised with a
glowing magic sigil, katana held low in the gloved hand on a long diagonal, head
turned to camera with the sunglasses and stubble clearly readable and the collar
well clear of the jaw. A thin swirl arc appears over his left shoulder — it is
*connected* to the figure (checked: the cutout has one 357k-px component plus a
68-px speck), so it does not inflate the crop box the way a detached blob does,
and `qc.py` passes it clean.

### `portraits/auron` — "silver hair, frontal, no scar"

All three were fixable, and the direction fix turned out to also be the scar
fix.

- **Hair.** `black hair, short hair, grey streak` was not enough against a
  close-up's tendency to blow out highlights. Now `black hair, short black hair,
  grey streaks in black hair, slicked back hair, gold hair ribbon` with
  `--negAdd "white hair, silver hair, grey hair, blonde hair, platinum blonde,
  glowing hair"`. All 5 variants came back dark navy-black.
- **Facing.** The contract puts portraits at `facing: none`, and the judge still
  wants the head angled toward the right — those are compatible as long as the
  head stays turned *to the player*, so the run kept `--facing none` (no
  `FACING_NEGATIVE` from the generator) and supplied
  `--facingPhrase "(from side:1.15), three-quarter view, head turned to the
  right, face toward the viewer, looking at viewer"`, with
  `front view, straight-on, symmetrical` added by hand through `--negAdd`.
  **1.15, not 1.3** — section 2a's warning that the weighted `from side`
  overshoots into profile is worse on a close-up, where a profile costs the face
  outright. Last round's unweighted phrase is why the portrait came back
  frontal; a small weight was enough.
- **The scar, and why it follows the facing.** A head turned toward frame-right
  presents the character's **right** cheek to camera (nose east, camera south,
  so the right side of the face rotates into view). Auron's scar and his
  permanently shut eye are both on his **right**, so the two requirements point
  the same way: the frame-right variants are the only ones that can show the
  scar at all. `auron-c.3` has the scar as a diagonal over the closed right eye
  above the lens. `auron-c.4`, the strongest face in the batch, turns frame-left
  and therefore shows the wrong cheek — rejected on that alone.

`auron-c.3` flags `BG-RETAINED,FRAME-FULL` in `qc.py`, which is **not** a
regression: `portraits/tidus` and `portraits/wakka` flag identically and
`portraits/yuna` flags `BG-RETAINED`. A head-shot fills its frame by
construction; the HUD crops it.

### `wakka/hurt` — "frontal, relaxed pose, bare-chested"

Same adjectives-vs-mechanics problem as Yuna, plus a costume ban. Pose prompt
now reads `recoiling from a heavy blow, staggering backwards, torso twisted
back, head thrown back, eyes shut, grimacing in pain, teeth clenched, one arm
flung out for balance, blitzball slipping from his hand, knees buckling, off
balance`, with `--negAdd "standing straight, relaxed stance, calm expression,
smiling, neutral pose, topless, bare chest, shirtless, no vest, ... extra ball,
two balls"`.

`hurt-c.2` is the keeper: angled frame-right off the seed, torso arched back,
one arm flung out behind for balance, teeth clenched, and the yellow vest
present and matching the idle. The bare midriff stays — that is canon (the
Aurochs vest is cut away at the stomach, visual bible section 1.4), and the
judge's "bare-chested" note was about the *rejected* render losing the vest, not
about the midriff.

`hurt-c.3` was rejected for holding **two blitzballs**, which is what the
`extra ball` negative exists for and evidently does not always win; `.1` doubled
him over so far the face was lost, which is a reject under section 6.0 for the
same reason a back view is.

## 3. Findings worth carrying forward

1. **"Flinching, recoiling, pained expression" does not produce a hit reaction
   on this checkpoint.** It produces a neutral body with a pained face. Three of
   the four judge complaints were "reads as a calm standing beat", and all three
   were on states using that phrase, which is the wording `cast.json` ships for
   every party member's `hurt`. **Recommend `cast.json`'s `hurt` poseTags be
   rewritten in body mechanics** — twisted torso, head thrown back, arm flung
   out, knees buckling — for the whole roster, not just this group. That one row
   is likely responsible for most of the roster's `hurt` rejects.
2. **The anti-frontal and anti-calm negatives are cheap and they work.** Adding
   `standing straight, calm expression, neutral pose, relaxed pose` to
   `--negAdd` moved the hit rate on a usable recoil from roughly 1 in 4 to
   roughly 3 in 5. Worth considering as a `hurt`-state default.
3. **A chiral subject costs about 10x on a facing reroll.** 13 renders for one
   frame-right Auron cast against one batch of 5 for each mirrorable subject.
   Budget for it; do not assume a batch of 3 will do.
4. **Portrait facing and portrait chirality are the same decision.** Anything
   canon-asymmetric on a face — Auron's scar and shut right eye, and by
   extension Kimahri's broken horn — is only visible from one side, so the
   portrait's head-turn direction is forced by the feature, not free. Flag for
   whoever owns the other portraits.
5. **The paint swirl survived the negatives again** (`yuna/hurt-c.5`;
   `auron/cast-c.2` grew a full opaque ring around the figure). Section 4's
   recommendation to fold `aura, energy ribbon, colored swirl, glowing ribbon,
   motion blur, speed lines` into `SPRITE_NEGATIVE` in `comfy.mjs` stands and is
   now backed by two rounds.

## 4. Verification run on the four replacements

`qc.py` on all four: `yuna/hurt` 802x1216 op 47.1% dangle 3, `auron/cast`
776x1109 op 41.5% dangle 11, `wakka/hurt` 739x1156 op 37.2% dangle 4 — all
clean, no retained background, no halo. `portraits/auron` flags as its three
siblings do (above). Dangle figures are single-digit to low-double-digit pixels,
i.e. no hanging prop, so **no hand-corrected `baselineY` was needed** and none
was written. Nothing outside `public/art/**`, `tools/gen/**`,
`docs/ART-PIPELINE.md`, `docs/handoff/art3-*.md` and `docs/screenshots/art/**`
was touched.
