# Handoff — pause-screen hero art

Seventeen cinematic close-ups for the "Until Dawn"-style pause screen: five
chapter backplates (one per encounter, carrying that fight's emotional beat) and
twelve Party / Character Info portraits. All rendered through the existing house
style contract with the new `hero` preset in `tools/gen/comfy.mjs`.

Contact sheet: `docs/screenshots/concept/pause-heroes.png`
Chapter plates at 1600 wide: `docs/screenshots/concept/pause-ch<1-5>.png`

---

## 1. What these are, and what they are not

They are **full painted plates**, 1344x768 landscape, background included. They
are not cutouts and they never go through rembg. That is the one structural
difference from every other image in `public/art/`, and it is why `runHero` is a
separate code path rather than `runSprite` with another composition block:

- no alpha, so no `cropBox`, no `baselineY`, no crop margin;
- the painted backdrop is half the shot — the pause overlay composites the whole
  landscape frame and lays its own UI chrome over it;
- the sidecar therefore carries `{subject, mood, seed, prompt, ...}` instead of
  the geometry fields a battlefield sprite needs.

Nothing about the style or quality blocks changed. `STYLE_TAGS` and
`QUALITY_TAGS` are appended by the generator exactly as they are for the
roster, which is why the sheet reads as one art department next to the existing
cast.

## 2. The preset

`node tools/gen/comfy.mjs hero --name <id> --tags "..." --poseTags "..." --out public/art/pause/<id>.png`

Three pieces are specific to it:

**`HERO_COMPOSITION`** — `close-up, face focus, portrait, upper body,
expressive, detailed eyes, cinematic lighting, dramatic lighting, depth of
field, blurry background, dramatic`. Note what is absent: `simple background,
white background` (the plate keeps its scene) and `looking at viewer` (half
these shots look away, and the ones that do say so in `--poseTags`).

**`HERO_FACING_PHRASES.none` is EMPTY**, not `straight-on`. This matters. The
v3 facing contract puts `straight-on` on anything with `--facing none`, which is
right for a HUD portrait and wrong here: it argues with the `three-quarter view`
in the pose tags, and on this checkpoint `straight-on` wins that argument. Every
hero plate would come back a passport photo. Camera angle for a hero shot is
direction, stated per shot, not contract.

**`HERO_NEGATIVE`** bans `full body, wide shot, from afar, feet, legs` on top of
the shared block, and deliberately does **not** inherit `SPRITE_NEGATIVE`'s
`colorful background, abstract background` — those exist because rembg would
keep the mess, and nothing here is cut out.

### `--ref` at 0.5, not the default 0.65

Every plate is pinned to that character's approved `idle` so the face is the
same person the player just had in their party. But 0.65 carries the idle's
**lighting** across with the identity, and a hero plate's whole point is new
lighting — cold blue on Gagazet, red-black at Dream's End, teal machina glow.
0.5 keeps the face and costume and lets the scene tags own the light. The
`--refStart 0.25` default is unchanged and still load-bearing: an adapter
running from step 0 reproduces the idle's *pose*, which on a close-up prompt
means a full-length figure.

## 3. What shipped

### Chapter heroes

| File | Subject | Beat | Ref |
| --- | --- | --- | --- |
| `pause/ch1-seymour-flux.png` | Tidus | anguished anger, wet eyes, gritted teeth; Gagazet blizzard, cold blue rim | `tidus/idle` |
| `pause/ch2-yunalesca.png` | Yuna | chin up, single tear, resolute; violet Dome light, staff edge crossing frame | `yuna/idle` |
| `pause/ch3-braskas-final-aeon.png` | Tidus | crying and smiling at once; red-black sky, embers | `tidus/idle` |
| `pause/ch4-bahamut.png` | Yuna (Gunner) | eyes downcast, sorrow and guilt; teal machina glow | `yuna-gunner/idle` |
| `pause/ch5-shuyin.png` | Yuna (Songstress) | eyes closed mid-song, serene grief; Farplane pastel, petals | `yuna-songstress/idle` |

**`chapter-meta.ts` uses two different names for the last two.** Its `heroArt`
fields read `pause/ch4-ffx2-bahamut` and `pause/ch5-ffx2-vegnagun-shuyin`.
Both spellings exist on disk as identical files with identical sidecars, so the
data module resolves today and the shorter names stay available. Pick one
spelling when the pause screen is built and delete the other pair; do not let
them drift.

### Party / Character Info

`tidus` (cocky grin) · `yuna` (gentle smile, sad eyes) · `auron` (stern, slight
smirk) · `wakka` (big laugh) · `lulu` (cool sidelong glance) · `kimahri` (fierce
roar) · `rikku` (wink, tongue out) · `jecht` (rough laugh) · `yuna-ffx2`
(Gunner, playful) · `rikku-ffx2` (Thief, peace sign, wink) · `paine` (deadpan
stare) · `seymour` (serene menace).

Backgrounds are that character's home scene held at bokeh depth: Besaid sea for
Tidus and Yuna, sunlit beach for Wakka, candle-warm dark for Lulu, Gagazet snow
for Kimahri, Bikanel sand for the two Rikkus, airship sky for Yuna X-2, cold
grey for Paine, sickly dark for Seymour.

`paine` refs `paine-warrior/idle`, `rikku-ffx2` refs `rikku-thief/idle`, and
`seymour` refs `seymour-flux/idle` — which per `ART-PIPELINE.md` §7 is not
actually the Flux form but robed Seymour with an aura, and is therefore exactly
the right anchor for a "serene menace" close-up.

## 4. Judging notes — what this round actually taught

Fifty-six renders, then nine more. Roughly one variant in three was usable,
which matches the roster rate.

**The recurring failure is not costume, it is the eye.** On an extreme close-up
this checkpoint decorates pupils: a literal heart in Ch.4 variant 4 and in
Rikku X-2 variant 2, a rainbow sparkle burst in Ch.5 variant 3, a star in Rikku
X-2 variant 3. It never does this at sprite scale because the eye is twelve
pixels wide. **Check pupils first on a hero plate**, the way you check facing
first on a sprite — a heart pupil is a reject no matter how good the rest is,
and it is invisible on a contact sheet at cell size.

Second most common: **blush blowout**. Ch.4 variant 3 and Yuna X-2 variant 2
came back with hard pink circles on the cheeks that turn guilt into
embarrassment. It tracks with how tight the crop is; the wider variants in each
batch were clean.

**Three subjects needed a second pass**, all for canon detail the first batch
dropped, and all three were fixed by weighting the canon token rather than by
rerolling blind:

- **Auron** had no scar in any of three. `(scar across eye:1.3)` plus
  `vertical scar on face, scarred face` landed it on the second batch (seed
  880001). Unweighted `scar across eye` sits in the identity tags already and
  does nothing at close range.
- **Kimahri** came back with *two* long horns in one variant and flat 90°
  profiles in the other two. `(single short broken horn stub:1.3)` in the tags,
  `(three-quarter view:1.2)` in the pose, and `two horns, long horn, pair of
  horns, intact horn, antlers, profile, from side` in `--negAdd` fixed both at
  once (seed 990001). The cast note is right that the stub is the silhouette,
  and at close-up scale a wrong horn is unmissable.
- **Jecht** drew red or blank white eyes twice. `brown eyes` in the tags and
  `red eyes, glowing eyes, blank eyes, white eyes` in `--negAdd` (seed 770001).
  The aeon form glows; human Jecht does not.

**Chirality still applies and there is no flip escape here.** These plates are
never mirrored — Auron's coat, Kimahri's horn and every asymmetric costume mark
would invert, and unlike a sprite there is no direction requirement that would
tempt you to. `flip.py` has no business in this folder.

## 5. Still open

- **Ch.2's violet reads blue.** The Zanarkand Dome light came out closer to
  cobalt than to the violet the brief asked for. Usable, and the chosen variant
  is the strongest face of the four, but if the pause screen's Ink & Gold chrome
  sits cool it may want a rerender with `purple` weighted.
- **Ch.5 trades identity for atmosphere.** The variant with the fullest Farplane
  flower field had the least readable Yuna; the one that shipped reads as her
  clearly and shows the Songstress outfit, with a thinner petal field. If the
  pause panel crops tight to the face, revisit.
- **Songstress costume follows `cast.json`, not the corrected canon.** The
  `lenne` note in `cast.json` records that the verified Songstress outfit is a
  blue top with white ruffles, not a pink dress, but `yuna-songstress`'s own
  tags still say pink dress and the shipped `idle` was rendered from them. Ch.5
  matches the shipped sprite deliberately — consistency with the cast beats
  accuracy against a sprite nobody will see beside it. Fix both together or
  neither.
- **Thumbnails are lanczos-upscaled.** `sheet.py thumb` only ever downscales, so
  the 1600 px chapter plates were resized from the 1344 px native render with
  PIL lanczos (1.19x). If a crisper deliverable is wanted, run them through the
  RealESRGAN path the backdrops use instead.
- **No `jecht` chapter plate.** Ch.3's beat is Tidus receiving the farewell, so
  Jecht appears only in the Character Info row. If the pause screen wants a
  two-hander for that chapter it needs a new shot, not a crop of this one.

---

# Fix pass — 2026-09-18 (round 3)

The blind judge scored the round-2 sheet and ten of the seventeen plates. Ten
were regenerated and replaced; the duplicate ch4/ch5 pair was resolved; the
contact sheet and the five chapter thumbs were rebuilt. Sheet spec:
`tools/gen/sheet-pause.json` (captions rewritten). New sheet:
`docs/screenshots/concept/pause-heroes.png`.

## 6. The bug that caused half the round-2 defects

**`--tags` and `--poseTags` are escaped, so an emphasis weight written into
them is inert.** `escapeTags` exists so that `yuna (ff10)` survives CLIP, and it
escapes *every* paren — including the ones you meant as weight syntax. Round 2's
two hardest canon misses were both this:

```jsonc
// public/art/pause/auron.json, round 2, as it reached the sampler:
"prompt": "... \\(scar across eye:1.3\\) ..."      // a literal string, weight 1.0
// public/art/pause/kimahri.json, round 2:
"prompt": "... \\(single short broken horn stub:1.3\\) ..."
```

Both notes in §4 above — "weighting the canon token rather than rerolling
blind" — are therefore wrong about *why* those second batches worked. They were
rerolls with a longer tag list; the weights never fired. Auron shipped with no
scar and Kimahri with an intact horn because the one lever that was supposed to
fix them was never connected.

**`--emphasis` is the flag that is not escaped.** Every weighted clause goes
there and nowhere else. That is the whole fix, and it is why this round landed
Auron's scar and Kimahri's horn on the first attempt at each.

## 7. Two ways to overload the conditioning

**Six weighted clauses collapse the image.** Auron's first fix batch carried six
`--emphasis` clauses, one at 1.5, on top of a 28-term negative. All six variants
came back as unresolved colour mush — not a bad Auron, no Auron: the denoise
never resolved a figure. Cut to three clauses, none above 1.35, with a shorter
negative, and eight usable variants came back. Treat **three clauses at 1.4 or
under** as the ceiling for this preset.

**Naming a body part at weight makes it the subject.** Wakka's judged defect was
facial anatomy, so the fix batch asked for `(natural nose with a bridge:1.25)`.
All six came back with a bright orange clown nose. The emphasis worked exactly
as told — it made the nose the thing the image is about. Fix anatomy by banning
the failure in `--negAdd` (`asymmetrical eyes, oversized jaw, huge forehead`)
and by fixing the camera (`from below, low angle` out), never by weighting the
feature.

## 8. Heterochromia has a side, and round 2 had it backwards

Canon: Yuna's **right** eye is blue, her **left** is green — so a viewer sees
blue on the **left** of the frame. Round 2's fix prompt asked for
`(blue left eye:1.4), (green right eye:1.4)`, which is the mirror of that, and
all five variants obeyed it precisely. The defect the judge found was authored,
not sampled.

Two things worth keeping:

- **The model reads left/right as the character's own**, consistently. Five for
  five on the inverted prompt, and the corrected `(blue right eye:1.45),
  (green left eye:1.45)` lands blue on frame-left when it lands at all.
- **It lands about a third of the time**, and weight does not move that much:
  3/6 on the FFX Yuna batch at 1.45, 1/8 on a ch4 batch at 1.40, 1/8 on another
  at 1.45. **Judge the eye sides on every variant and pick** — this is a
  selection problem, not a prompting one. It is also invisible at contact-sheet
  cell size; check it on the sheet at full resolution or on a thumb.

## 9. What was replaced, and with what

| File | From | Seed | What the redo fixed |
| --- | --- | --- | --- |
| `pause/yuna.png` | r2 v6 | 20260306 | Eye sides corrected; braid with beaded tie and yellow obi back; no hands in frame |
| `pause/auron.png` | r3 v3 | 20260413 | Black hair slicked into a low ponytail (was a spiky crest); vertical scar over the left eye; stubble; Gagazet dusk instead of anonymous bokeh |
| `pause/wakka.png` | r3 v3 | 20260423 | Eyes level and matched, nose has a bridge, jaw in proportion; Besaid beach; no blitzball-turned-camera |
| `pause/lulu.png` | r2 v1 | 20260331 | Uniformly black beaded braids (the pink swathe is gone); crimson eyes; eyes open and composed; Macalania blue instead of warm bokeh |
| `pause/kimahri.png` | r3 v1 | 20260431 | Humanoid Ronso on human shoulders (was a quadruped lion's head); one short snapped horn stub; mouth closed, stoic |
| `pause/jecht.png` | r2 v4 | 20260354 | No white streaks; the red chest tattoo is large and legible; hands out of frame; Dream Zanarkand night |
| `pause/rikku-ffx2.png` | r2 v1 | 20260361 | Hands out of frame entirely — the peace sign was the defect, so it was cut, not redrawn; whole head in frame; skin no longer clipped |
| `pause/paine.png` | r2 v5 | 20260375 | Angular, older, guarded face; greatsword in frame; cold Bevelle grey-blue |
| `pause/ch4-ffx2-bahamut.png` | r4 v4 | 20260464 | Eye sides corrected; **Bahamut is in the plate**; teal Bevelle Underground; the sorrow-and-guilt beat reads |
| `pause/ch5-ffx2-vegnagun-shuyin.png` | r2 v2 | 20260392 | Brown hair (was a red-orange gradient); both eyes open with correct heterochromia; the microphone and its malformed hand are gone; Vegnagun's engine is behind her |

`kimahri` is the one subject that needed `--refWeight 0.4`; `auron` wanted 0.55.
Everything else stayed at the preset 0.5.

## 10. The duplicate pair is gone

`ch4-bahamut.png` and `ch5-shuyin.png` were byte-identical copies of the
`ch4-ffx2-bahamut` / `ch5-ffx2-vegnagun-shuyin` plates. **The short-named pair
was deleted.** `chapter-meta.ts` resolves ch4 and ch5 through the `ffx2`
spellings and nothing in `src/` references the short ones, so the delete is
inert today, and the folder now holds seventeen distinct images.

It leaves a naming inconsistency that is a **code** change, not an art one:
ch1–ch3 are `pause/ch<N>-<boss>` while ch4–ch5 are `pause/ch<N>-ffx2-<boss>`.
Unify `chapter-meta.ts` on one shape and rename the two files in the same
commit.

## 11. Getting an aeon into a close-up

The judge's "no Bahamut" is a fight with the preset, not a prompting mistake.
`HERO_COMPOSITION` says `close-up, face focus, upper body` and `HERO_NEGATIVE`
bans `wide shot, from afar` — between them there is no room for a whole aeon.
Two rounds asking for "a colossal dragon looming behind her" produced feathered
wings on Yuna's own back, then a wall of repeated machina helms.

What worked was changing the shot rather than the weight: **a dragon *head* at
her shoulder**, named in `--tags` as scenery and weighted once. Eight for eight
carried a legible dragon. The same move is the one to reach for whenever a boss
has to share a hero plate.

Ch.5 keeps Vegnagun by the same logic — the engine's pipes flank her. **Shuyin
himself is still not in the Ch.5 plate.** A second human in frame argues with
the `solo` tag and the multi-subject negatives, and no attempt was made this
round; it needs its own experiment.

## 12. Still open, after this round

- **The global grade is better but not uniform.** Adding `neon, bloom, lens
  flare, overexposed, oversaturated, clipped highlights, god rays` to
  `--negAdd` gave the ten redone plates real location identity — Macalania blue,
  Bevelle grey, Gagazet snow, Zanarkand night all read as different rooms. The
  seven plates that were **not** regenerated (`tidus`, `rikku`, `seymour`,
  `yuna-ffx2`, `ch1`, `ch2`, `ch3`) still carry the round-2 hot filmic look, so
  the sheet is no longer one grade. Either that negative block belongs in
  `HERO_NEGATIVE` and the whole set gets re-shot, or it stays a per-plate choice
  and the difference stays. It should not stay half-applied.
- **Ch.5 is a mid-shot, not a close-up.** The variant that fixed every named
  defect frames her from the waist. A round aimed at tightening it
  (`(her face fills the frame:1.3)`) came back in hot coral with ornaments
  across the face and, in one variant, two heads — worse on every axis. The
  mid-shot shipped. If the pause panel crops tight to the face, this needs
  another attempt from a different angle than weighting the crop.
- **Ch.4's Yuna reads auburn**, and her braid is not visible. The plate was
  chosen for the aeon, the eye sides and the beat; the hair was the trade.
- **Auron's coat is still coral-red, not oxblood.** `(deep oxblood crimson
  coat:1.35)` was one of the six clauses in the batch that collapsed, and it was
  cut when the emphasis was trimmed to three. It is the obvious candidate for a
  fourth slot if the ceiling in §7 turns out to be four.
- **`sheet.py thumb` will not upscale.** The five `pause-ch<N>.png` chapter
  thumbs are now 1344 px native rather than the lanczos-faked 1600 px §5
  described. Native is the better artefact; if 1600 is actually wanted, run the
  RealESRGAN path the backdrops use.
- **Candidate folders are not kept.** `public/art/` is gitignored but is copied
  wholesale into a vite build, and the four fix-pass candidate folders came to
  173 MB. They were deleted after promotion, per the §3 convention. Every
  shipped plate's sidecar carries its seed and full prompt, so any of them can
  be reproduced; the per-subject judging sheets are in
  `docs/screenshots/art/_f2-*.png`, `_f3-*.png` and `_f4-*.png`.

---

# Fix pass — 2026-09-18 (round 4)

Three plates were re-rolled against fresh briefs: `wakka`, `ch4-bahamut`,
`ch5-shuyin`. Everything else in `public/art/pause/` is untouched. Seven
batches, 41 renders, three keepers. The sheet spec for this round was **not**
committed — it lives outside the repo, because this pass was scoped to
`public/art/pause/**`, `docs/handoff/hero-art.md` and
`docs/screenshots/concept/**`. `tools/gen/sheet-pause.json` still describes
round 3 and now disagrees with the shipped sheet; whoever owns `tools/` should
fold the round-4 captions back into it.

## 13. What shipped this round

| File | Batch | Seed | What the redo fixed |
| --- | --- | --- | --- |
| `pause/wakka.png` | D v2 | 20260642 | **Whole head in frame** with headroom above the hair; blue headband complete and unclipped; plain blue irises with round black pupils; eyes level and matched; ear and jaw in proportion; sea-at-sunset bokeh |
| `pause/ch4-bahamut.png` | A v3 | 20260523 | Gunner dressphere reads — white hood **up**, blue pleated half-skirt, a pistol grip at her hip; eyes downcast, brow drawn, mouth closed; a single dragon head at her left; teal rim light |
| `pause/ch5-shuyin.png` | G v2 | 20260802 | Songstress outfit matches the shipped sprite (white halter, blue scarf collar, teal feather earrings, orange obi); eyes closed, microphone in hand; Farplane pastel flower field with drifting petals; no mandala, no guns, no machina |

New sheet: `docs/screenshots/concept/pause-heroes.png` (2490x2260, tiles 595 px
wide). Refreshed: `docs/screenshots/concept/pause-ch4.png`, `pause-ch5.png`.

## 14. `--facingPhrase` is the framing lever, and it is the only one that worked

Every Wakka batch cropped the top of his skull, which was the headline defect in
the brief. Four things were tried before one worked:

1. **Emphasis at 1.35** — `(the whole head and hair inside the frame with
   headroom above it:1.35)`. Five for five still cropped.
2. **Emphasis at 1.4 plus `--refStart 0.15`** — collapsed into colour mush (§7).
3. **A single emphasis clause and a short negative** — better faces, still
   cropped five for five.
4. **`--facingPhrase "(medium shot:1.35), (the whole head in frame with
   headroom above the hair:1.3)"`** — two of five landed with real headroom.

**`--facingPhrase` is not escaped and it lands at the FRONT of the framing
block**, immediately before `close-up, face focus, upper body`. That position is
why it wins: it is the only channel that can argue with `HERO_COMPOSITION` on
equal terms. `--emphasis` sits behind the pose tags and loses.

`HERO_FACING_PHRASES.none` being empty (§2) is what makes the slot free on a
hero plate. §2 frames that emptiness as "camera angle is direction, stated per
shot" — it is also, in practice, **a reserved slot for framing overrides**, and
that is the more useful way to think about it. Reach for `--facingPhrase` first
whenever the defect is *where the frame sits*, and for `--emphasis` only when
the defect is *what is in it*.

## 15. The collapse ceiling is lower than §7 says

§7 puts the ceiling at "three clauses at 1.4 or under". Two batches this round
sat inside that rule and collapsed anyway:

- **wakka batch B** — 3 clauses (top one 1.4), ~45-term `--negAdd`,
  `--refStart 0.15`. All five unresolved mush.
- **ch4 batch C** — 3 clauses (two at 1.4), ~26-term `--negAdd`, default
  `--refStart`. All five unresolved mush.

Meanwhile **ch4 batch A** — 3 clauses at 1.35 / 1.35 / 1.25 with a 30-term
`--negAdd` — resolved cleanly and produced the keeper. The variable is not the
clause count. It is **the top weight together with the negative length**:

> Keep the highest emphasis weight at **1.35 or below** when `--negAdd` runs
> past about twenty terms. A single 1.4 clause is fine on a short negative; two
> 1.4 clauses on a long one is a dead batch.

`--refStart 0.15` made it worse and bought nothing — it does not pull the camera
back, it just puts the adapter into the window where composition is decided.
Leave it at the 0.25 default on hero plates.

## 16. "Flame shaped" is a literal instruction

Wakka's hair is canonically a flame-shaped crest, so batch E asked for
`(one single tall flame shaped orange pompadour:1.3)`. **All five variants came
back with actual fire** — burning hair, flames across the beach, one with a
fireball beside his ear.

This is §7's clown-nose lesson in a second costume: the checkpoint does not read
"flame shaped" as a silhouette description, it reads `flame` as an object and
paints one. `(one tall smooth orange pompadour:1.25)` in batch F got the
silhouette with no fire. **Describe a shape with shape words** — tall, smooth,
swept up, rolled — and keep metaphors out of a weighted clause.

Same family of failure, twice more this round: `farplane flower field` at 1.3
produced a chevron / herringbone texture rather than flowers until the phrase
was rewritten as `a soft out of focus field of pale pink and white flowers`;
and Wakka's `blitzball` keeps resolving as a camera lens — the round-3 note
about "no blitzball-turned-camera" is still live, and it appeared in three
batches this round.

## 17. Ch.4 kept the aeon by keeping round A's recipe

Rounds C, E and F all tried to improve ch4 and all lost the dragon: E dropped it
entirely, F produced **two** symmetric dragon heads flanking her — the "wall of
repeated machina helms" failure §11 describes, arriving through a different
door. §11's move (a dragon *head* at her shoulder, named as scenery, weighted
once) is correct, and the round A prompt is the version of it that works. It was
not improved on; it was re-picked.

**Known trade on the shipped ch4 plate:** her eye sides are inverted — green on
frame-left, blue on frame-right, the mirror of the §8 canon. It was the best
variant on every axis the brief named (dressphere, hood, half-skirt, pistol
grip, downcast sorrow, teal light, a single dragon), and the brief did not name
the eyes. Per §8 this is a selection problem: if the eye sides matter more than
the aeon, re-roll the same prompt and pick on eyes instead.

## 18. Ch.5 needed the microphone and the flower field in the same variant

The brief reversed two round-3 negatives: round 3 banned `microphone` and
`eyes closed`, round 4 requires both. Removing them was easy; getting the mic
*and* a legible Farplane flower field *and* an uncropped head into one variant
took three batches.

- **Round A** — field and mic, but a chevron-textured background and a mid-shot.
- **Round C** — clean close-ups with the mic, but the field vanished into a pale
  gradient and the hair drifted blonde and red.
- **Round F** — the field came back beautifully; the best-framed variant had
  **no microphone**.
- **Round G** — round F's tags plus `(eyes closed singing into a handheld
  microphone:1.35)` and `microphone stand` in the negative. v2 has all three.

`microphone stand` is worth keeping in the negative: without it the model
reliably draws a studio stand and puts both hands on it, which is where the
malformed-hand risk lives. One hand on a handheld mic, with the wrist near the
bottom edge, was the clean configuration.

## 19. The duplicate ch4 / ch5 pair is back

§10 recorded that `ch4-bahamut.png` and `ch5-shuyin.png` were deleted as
byte-identical duplicates of the `ffx2` spellings, leaving seventeen distinct
files. **This round's brief asked for the short names as the primary output and
the `ffx2` names as copies, so both pairs exist again and the folder holds
nineteen files.**

That was done deliberately. `chapter-meta.ts` resolves ch4 and ch5 through the
`ffx2` spellings, so writing only the short names would have left the pause
screen pointing at round-3 art. Writing both keeps the game correct today.

It also re-opens exactly the drift §10 closed. The fix is still a **code**
change, not an art one, and it is still the same one: pick one spelling in
`chapter-meta.ts`, rename the file to match, delete the other pair, in a single
commit. Until then, anyone re-rolling ch4 or ch5 **must write both names** or
the two will silently diverge.

## 20. Still open, after this round

- **Wakka's plate has invented ornament.** The chosen variant carries an amber
  gem pendant hanging from the headband between his brows, and two pale
  tear-shaped marks on his cheeks. None of it is canon. It survived because the
  brief's hard criteria — uncropped skull, plain pupils, correct jaw and ear —
  are all met, and nothing else in seven batches met them together.
  `forehead jewel, gem on forehead, facial markings` were in the negative for
  batches E–G and did not remove it.
- **Wakka's hair reads as a swept tuft, not a pompadour crest.** Batch F got a
  proper crest twice, but both of those variants cropped his chin and traded the
  laugh for a smirk. Crest and laugh have not landed in the same variant yet.
- **Ch.4's eye sides are inverted** (§17).
- **Ch.5 is still a mid-shot**, and her mouth is closed rather than open in
  song — it reads as a held breath between phrases rather than mid-phrase.
  §12's warning about weighting the crop still applies; `--facingPhrase` is the
  lever to try, tightened rather than widened.
- **The global grade is still not uniform** (§12). This round's three plates
  carry the same `neon, bloom, lens flare, overexposed, oversaturated, clipped
  highlights, god rays` negative block as the round-3 ten, so thirteen of the
  nineteen files now share a grade and six (`tidus`, `rikku`, `seymour`,
  `yuna-ffx2`, `ch1`, `ch2`, `ch3`) still carry the round-2 hot filmic look.
  The gap is narrowing by attrition rather than by decision. It still belongs
  in `HERO_NEGATIVE` or nowhere.
- **`tools/gen/sheet-pause.json` is stale.** It still holds the round-3
  captions, including "Auron — REDONE / ponytail, scar over left eye" for a
  plate in which Auron wears sunglasses and no scar is visible, and
  "Ch.5 … VEGNAGUN IN PLATE" for a plate that is now a flower field. The
  shipped sheet was built from an out-of-repo spec with corrected captions.
- **Candidate folders are deleted**, per the §3 convention — the seven round-4
  batches came to 114 MB. Every shipped plate's sidecar carries its seed and
  full prompt, so any keeper reproduces; the rejects do not.

---

# Fix pass 2 — 2026-09-18 (round 5)

The blind judge scored sixteen entries (fourteen distinct plates plus the two
`ffx2` aliases). **All fourteen were regenerated and replaced.** Six passes,
about 150 renders. Sheet and the five chapter thumbs rebuilt. The sheet spec
lives outside the repo again (`tools/` is outside this pass's write scope, as in
round 4) — `tools/gen/sheet-pause.json` is now two rounds stale.

## 21. The heterochromia side is NOT promptable, and §8 is wrong about why

§8 claims `(blue right eye:1.45), (green left eye:1.45)` lands blue on
frame-left about a third of the time, and calls the side "a selection problem".
Three phrasings were tested this round on the same subject, same preset:

| Emphasis | Variants | Blue on viewer's left |
| --- | --- | --- |
| `(blue right eye and green left eye:1.35)` — one combined clause | 6 | **0** |
| `(blue right eye:1.4), (green left eye:1.4)` — §8's exact form | 8 | **0** |
| `(green right eye:1.4), (blue left eye:1.4)` — the mirror of it | 4 | **0** |

**Eighteen for eighteen came back green on the viewer's left**, including four
renders that asked for the literal opposite of what the other fourteen asked
for. The words do not move the feature at all. It is not a selection problem and
it is not a weight problem: on this checkpoint the side is a **fixed prior** for
Yuna, and the prompt channel is inert.

Two consequences:

- **Do not spend another batch on it.** §8's "judge the eye sides on every
  variant and pick" is only actionable where the batch actually varies. It
  varied in exactly one subject this round (`ch4`, where the head is tilted
  hardest), and nowhere else.
- **The only levers left are post-hoc.** A horizontal mirror would fix the side
  and wreck everything else (ART-PIPELINE §2a — these plates are chiral and
  `flip.py` "has no business in this folder"), so the real option is an inpaint,
  which no one has set up.

### What shipped, and the canon question someone else has to settle

All five Yuna plates now read **green on the viewer's left, blue on the viewer's
right**, and they are internally consistent for the first time. That was the
judge's own requirement ("whichever is fixed, the set must be made consistent")
and it is the orientation the checkpoint will actually produce.

**It is also the orientation §8 says is wrong.** The two authorities disagree
head-on and this pass did not have standing to settle it:

- **§8 / the round-3 note:** Yuna's right eye is blue, so blue belongs on
  frame-left. The round-3 `yuna.png` and `ch2` shipped that way.
- **The round-5 judge:** "canon is blue left eye / green right eye, so the
  viewer's left eye should be green and the viewer's right blue."

The judge's reading and the checkpoint's prior agree with each other. §8
disagrees with both. **Whoever owns canon should rule on this once and write it
down**, because if §8 is right the fix is an inpainting pass over five plates,
not a re-roll — §21 shows a re-roll cannot get there.

## 22. "Describe a shape with shape words" now has four victims, not two

§16 established that the checkpoint reads a metaphor in a weighted clause as an
object: `flame shaped` painted actual fire. Two more this round, both total
batch losses:

- **`crown`** — `(… sculpted upward into a tall crown away from his head:1.35)`
  for Seymour's hair. Eight variants, a literal **gold crown** on his head in
  the resolved ones and colour mush in the rest. Rewritten as
  `pale blue hair swept upward and outward into two tall stiff points`, it
  landed the silhouette first try.
- **`muzzle`** — `(a broad furry muzzle with whiskers:1.25)` for Kimahri. All
  eight came back wearing a **muzzle cage**: a strapped grille over the snout.
  `muzzle` was also in the identity tags, so the cage appeared in every variant
  of two consecutive batches. `broad furry snout` fixed it completely.

The pattern is now specific enough to state as a rule: **a weighted clause is
read literally, and any word that names a real object will summon that object,
even when the sentence is obviously using it anatomically.** Before weighting a
clause, check every noun in it for a second meaning — `crown`, `muzzle`,
`flame`, `bridle`, `cap`. `snout`, `points`, `stub`, `swept up` are safe because
they name nothing else.

## 23. A monster can share a hero plate; a humanoid cannot

§11 established the move — a boss *head* at the shoulder, named in `--tags` as
scenery, weighted once — and this round tested how far it generalises. It is
entirely about whether the boss is humanoid:

| Plate | Boss asked for | Result |
| --- | --- | --- |
| `ch3` | grey beast, bone mane, fused sword-arm | **landed 4/6** — a maned horned beast at his shoulder |
| `ch4` | black armoured western dragon | **landed 6/8** |
| `ch5` | colossal machina | **landed 5/8** once weighted at 1.2 |
| `ch1` | "a huge pale masked monster … clawed arms" | **0/6 — fused onto Tidus's face as a mask** |
| `ch2` | Yunalesca, an unsent woman | never attempted directly |

`ch1` failed because the request was humanoid — `masked monster` with `arms`
reads as a person, collides with `solo` and the `2boys` ban in `BASE_NEGATIVE`,
and the checkpoint resolves the collision by putting the mask on the subject's
own face. Re-asked as **`a huge pale bone skull with curved horns`** — a thing,
not a figure — it landed cleanly and reads as Seymour Flux's mount.

`ch2` took the same lesson pre-emptively: Yunalesca is a woman, `2girls` is in
`BASE_NEGATIVE`, and that negative cannot be removed from inside this pass's
write scope. She is in the plate as **`a tall pale stone statue of a woman in a
white pearl strand headdress`** — a statue is not a girl — and it works. If a
real second figure is ever wanted, that is a `comfy.mjs` change (a per-shot way
to drop the multi-subject bans), not a prompting one.

## 24. The collapse ceiling, restated again — it is the top weight

§15 lowered §7's ceiling to "1.35 or below when `--negAdd` runs past twenty
terms". Three batches obeyed that and collapsed anyway (`kimahri`, `paine`,
`seymour`, all at 1.35/1.3/1.25 with 30-40 term negatives). Every one of them
resolved on the retry after the same two changes: **negative cut to 15-22 terms
and the top weight dropped to 1.25-1.3.**

Working figure for this preset, replacing §15's: **two clauses, top weight 1.25,
negative under about twenty terms.** Three clauses at 1.3 is survivable on a
short negative (`auron`, `ch1`); it is not survivable on a long one. The
collapse is silent and total — it never produces a bad plate, it produces no
plate — so it is cheap to detect and expensive to ignore.

## 25. What was replaced, and with what

| File | Batch | Seed | What the redo fixed |
| --- | --- | --- | --- |
| `pause/yuna.png` | eyes v6 | 20261406 | Short chestnut bob (was blonde, long, windswept); both irises in one matching style (they were two different eyes); staff and hands out of frame so the obi and kimono sleeve read; Besaid sea at sunset |
| `pause/auron.png` | b v7 | 20261107 | Small round black lenses (were white-rimmed aviators); black hair in a low bun (were beaded sidelocks); brown eye (was violet); the striped throat sash is gone; weathered older face; cold Gagazet dusk |
| `pause/wakka.png` | v4 | 20260924 | One tall swept-back pompadour (was two tufts); no forehead gem, cheek stripes or ear pendants; asymmetric three-quarter framing off the dead-centre axis; lower teeth and tongue in the laugh; horizon dropped off the eyeline |
| `pause/kimahri.png` | c v5 | 20261305 | An actual Ronso — broad furry snout, flat feline nose, whiskers, fur, no elf ears (was a blue-tinted human face); one horn, not two; blue fur and a white mane throughout (no blonde section) |
| `pause/rikku-ffx2.png` | v4 | 20260944 | The FFX-2 **Thief** dressphere — orange top, red sash, large belt (it was wearing FFX Rikku's scarf and bandana, and duplicated `rikku.png`); no forehead bandana; goggles whole and inside the frame; clean round pupil; neck follows the head tilt |
| `pause/yuna-ffx2.png` | eyes v3 | 20261453 | Each iris one solid colour (one eye held **both** green and blue); short brown hair with a tail (was a uniform blonde bob); pink hood and red sash tails; collarbone and deltoid modelled; closed-lip smile instead of the teeth-bar decal |
| `pause/paine.png` | b v2 | 20261122 | The invented spiked red pauldron and the unidentifiable gold machine are both gone; plain black leather bustier with a silver studded collar; the sword reads as a blade with a hilt, not a glowing bar; uncluttered frame |
| `pause/seymour.png` | b v3 | 20261133 | Guado anatomy at last — long pointed ears, pale grey-green skin, veined temples, lower-lid markings; hair swept up off the head instead of loose to the waist; **round pupils** (were glowing cyan spirals, a §4 hard reject); modelled cheeks and nose |
| `pause/jecht.png` | v6 | 20260986 | Jet black hair (was crimson throughout); one asymmetric crimson chest emblem instead of two symmetric blobs; studded black harness instead of plain grey straps; beard drawn as hair, not a grey rectangle; neck in proportion |
| `pause/ch1-seymour-flux.png` | b v5 | 20261145 | **The named boss is in the plate** — a horned bone skull creature at his shoulder; no longer just a second `tidus.png`; mouth closed so there is no fused-teeth decal; thin translucent tear instead of white gel |
| `pause/ch2-yunalesca.png` | eyes v3 | 20261503 | Summoner costume fully visible — obi, long kimono sleeve, floral hakama (all of it was cropped out); a pale pearl-headdress figure of Yunalesca behind her; staff off the face; no blush |
| `pause/ch3-braskas-final-aeon.png` | v5 | 20261015 | **The Final Aeon is in the plate** — bone mane, horns, crimson-marked arm; three-quarter view fixes the frontal far-eye drawn into a near-profile head; jaw has a mandible angle; translucent tear |
| `pause/ch4-bahamut.png` + `ch4-ffx2-bahamut.png` | eyes v5 | 20261525 | Bahamut is a **black armoured western dragon with a crested skull** (was a pale green eastern serpent); it connects to a body; her arm has an elbow and a forearm taper; the stub pistol is gone; eye sides now match the other four Yuna plates |
| `pause/ch5-shuyin.png` + `ch5-ffx2-vegnagun-shuyin.png` | c v3 | 20261203 | **Vegnagun is in the plate** as a dark armoured machina head; eyes open so the heterochromia reads; short brown hair (was long auburn); the microphone and its malformed two-finger hand are gone; no stamped repeating flowers |

`auron` ran at `--refWeight 0.45` (0.55 carried the reference's blue ribbon onto
his cheek), `kimahri` at 0.55 (0.4 was why it kept coming back human — §9 had it
backwards for this failure), `seymour` at 0.4 so the prompt could own the hair.
Everything else stayed at the preset 0.5.

## 26. The two judged complaints that were NOT acted on

Both are cases where the judge's finding is, on the evidence, wrong. Recording
them so the next pass does not "fix" them into real defects:

- **"Heterochromia is MIRRORED" on `yuna`, `ch2` and `yuna-ffx2`.** Verified
  against the files: before this round those three had **blue on the viewer's
  left**, which is what §8 calls canon. The judge marked that as backwards and
  simultaneously marked `ch4` — the one plate that had green on the left — as
  "CORRECT here". The judge is at least self-consistent about which side it
  wants; it is §8 it contradicts. See §21: the set is now consistent on the
  judge's side because that is the only side the checkpoint will draw, not
  because the canon question was settled.
- **"The FFX-2 variant of this encounter has no art of its own"** on
  `ch4-ffx2-bahamut` and `ch5-ffx2-vegnagun-shuyin`. There is no separate FFX
  ch.4 or ch.5 encounter. `chapter-meta.ts` declares exactly five chapters and
  resolves the last two through the `ffx2` spellings; the short names are
  unreferenced aliases kept in lockstep per §19. Byte-identical is the intended
  state, not a defect. The naming inconsistency §10 and §19 describe is still a
  **code** change and still unowned.

## 27. Still open, after this round

- **Auron's scar still does not land.** Four rounds, every phrasing tried,
  including a dedicated 1.3 clause this round. The shipped plate has the closed
  left eye but no legible scar. It is the longest-running unfixed note in this
  file and probably wants an inpaint rather than a fifth re-roll.
- **Kimahri's horn is one horn, not a broken stub.** The count is finally
  unambiguous, but the checkpoint keeps finishing the horn as an ornament — a
  cap, a band, a gold fitting — exactly as §9 described in round 3. "Snapped
  off" has never once rendered as a fracture.
- **Wakka's headband has a woven pattern and two small gold bars.** Far less
  than the round-4 gem and cheek stripes, but still not canon. Same negatives,
  same partial result; §20's observation that these bans do not bite still
  stands.
- **Seymour keeps the orange filigree.** It is much reduced and now reads as
  Guado veining rather than tribal tattoos, but `orange tattoo, flame tattoo,
  facial markings` in the negative did not remove it outright.
- **Ch.4 lost the sorrow-and-guilt beat.** The variant that had the correct eye
  sides *and* a legible armoured Bahamut is a soft smile. Mood was traded for
  the two things the judge named. The one variant with the best dragon and the
  strongest composition (`ch4-bahamut-eyes v2`) has the eye sides inverted
  against the rest of the set — it is the fallback if the §21 canon ruling goes
  the other way.
- **The global grade is now uniform**, for the first time since §12 raised it.
  Fourteen of the nineteen files were re-shot this round with the same negative
  block; the only survivors of earlier rounds are `tidus`, `lulu` and `rikku`,
  and `tidus` and `rikku` are the last two carrying the round-2 hot filmic look.
- **Candidate folders are deleted**, per the §3 convention — the six passes came
  to roughly 200 MB, and they were written outside the repo this round (to the
  session scratchpad) rather than into `public/art/`, which avoids the
  gitignored-but-copied-into-the-vite-build problem §12 noted. Every shipped
  plate's sidecar carries its seed and full prompt.

---

# Fix pass 3 — 2026-09-18 (round 6)

The blind judge scored eleven entries (ten distinct plates plus the
`ch5-ffx2-vegnagun-shuyin` alias) between 3 and 6. **All ten distinct plates
were regenerated and replaced**, and the ch5 alias was rewritten in lockstep.
Five batches, 86 renders, ten keepers. Sheet and the five chapter thumbs
rebuilt. The sheet spec lives outside the repo again (`tools/` is outside this
pass's write scope, as in rounds 4 and 5) — `tools/gen/sheet-pause.json` is now
three rounds stale.

## 28. What was replaced, and with what

| File | Batch | Seed | What the redo fixed |
| --- | --- | --- | --- |
| `pause/yuna.png` | A v1 | 20261601 | Dark chestnut hair (was dirty-blonde); the unresolved blue-and-gold swoop at lower left is gone; the halter collar and yellow obi close the bottom of the frame instead of a bare chest; Besaid beach with palms and sea instead of a pink/blue gradient wash |
| `pause/wakka.png` | C v6 | 20261716 | One swept-up orange crest (was a giant ribbed shell); both irises drawn, matched and level; face and jaw in proportion; the laugh resolves into upper teeth, lower teeth and a tongue; clean sky with no posterized staircase banding |
| `pause/rikku.png` | A v1 | 20261621 | Whole head with headroom (the shipped plate was a blank plane of forehead); both eyes read — one winking, one wide and clear of the bangs; features centred instead of crushed into the lower-right quadrant; goggles seated flat on the head |
| `pause/rikku-ffx2.png` | A v4 | 20261634 | Head-and-shoulders framing — no cleavage in frame at all, and the head is large enough to match the rest of the set; braids fall to the sides instead of tangling across the chest; Bikanel dunes with rusted machina read as a location |
| `pause/paine.png` | A v6 | 20261646 | **The flat white triangle nose is gone** — the nose is modelled; very short spiked silver hair (was long and loose); cold grey-blue light instead of heavy pink/blue rim; hands and arms out of frame; plain collar |
| `pause/jecht.png` | A v6 | 20261656 | Grin resolves into clean even teeth (was mangled dentition); **the crimson emblem is back on the sternum**, not on a shoulder plate; warm lamplit Zanarkand street instead of a neon cyberpunk city; the scratchy dark chest artifacts are gone |
| `pause/seymour.png` | A v6 | 20261666 | **Likeness**: pale fair skin, no pointed ears, no red facial vein tracery (see §31); pale blue hair swept up and back into one tall shape instead of a feathered fan; off-axis three-quarter so the face is no longer mirror-symmetric; Bevelle pillars behind him instead of an orange bokeh field |
| `pause/ch1-seymour-flux.png` | B v5 | 20261675 | **The emotional brief lands** — anguished, brows down, teeth bared, with two thin wet tear tracks; the horned bone skull is large and fully inside the frame at his shoulder (was cropped at the far edge); real driving snow and a dark storm sky instead of a calm blue gradient |
| `pause/ch2-yunalesca.png` | B v2 | 20261682 | Tight head-and-shoulders close-up matching the rest of the set (was near-full-body); crisp rather than soft and under-rendered; **the single tear is present**; the Yunalesca figure behind her has a readable headdress instead of a grey smear; halter and shoulders read |
| `pause/ch5-shuyin.png` + `ch5-ffx2-vegnagun-shuyin.png` | B v7 | 20261697 | **The boss is machina, not a dragon** — ribbed metal rods and a lens housing, no longer interchangeable with Ch.4's Bahamut; dark navy depths across the top instead of a pale pastel wash; lips parted, brows drawn, reading as dread rather than blank; halter, blue scarf collar and obi all legible |

Everything ran at the preset `--refWeight 0.5` except `seymour`, which stayed at
0.4 so the prompt could own the hair and skin.

## 29. `--facingPhrase` is directional, and §14 only told half the story

§14 established `--facingPhrase` as *the* framing lever and said to reach for it
"whenever the defect is where the frame sits". That is right when the frame is
cutting content off, and it worked three times this round on exactly that
failure — `rikku` (a blank plane of forehead), `rikku-ffx2` (a small head and a
chest-level crop) and `wakka` (batch A framed every variant too tight).

**It backfires when the frame is already correct.** Jecht's batch A framing was
fine; the defects were hair, teeth, tattoo placement and palette. Batch D added
`(medium shot:1.3), (his whole head in frame with headroom above the hair:1.25)`
anyway, and the model filled the new headroom with invented objects: a straw hat
in two variants, a pair of bull horns in three. Batch E dropped the flag,
changed nothing else, and the hats and horns vanished.

> Widening the frame is a request for more content, and the checkpoint will
> invent something to put there. Use `--facingPhrase` when content is being cut
> off; do not use it to "improve" a frame that already holds the subject.

## 30. The location tag decides the palette, and `city lights at night` means neon

The judge's Jecht complaint was a neon cyberpunk background clashing with the
set. Three phrasings, six variants each:

| Location tag | Result |
| --- | --- |
| `dream zanarkand city lights at night` (shipped r5, and batch E) | Neon cyberpunk skyline, 6/6 — the exact judged defect |
| `dream zanarkand at night, warm lamplit street` (batch A) | Paper lanterns and warm orange, no neon — kept |
| `deep blue night, cool moonlight`, no city named (batch D) | Cool palette landed, but with nothing to anchor the location the model reached for hats and horns instead |

`city lights at night` is not a neutral way to say "night" on this checkpoint —
it carries the whole neon-skyline prior with it. The lesson generalises: **a
location tag is a palette instruction, and the palette arrives whether or not
you asked for it.** Naming a specific lit object (`lamplit street`) gives the
model something concrete and stops it reaching for the genre.

## 31. The judge reversed §25 on Seymour, and this round followed the judge

§25 recorded Seymour's round-5 fix as "Guado anatomy at last — long pointed
ears, pale grey-green skin, veined temples, lower-lid markings". **The round-6
judge called all three of those a likeness failure**: "teal skin, pointed elf
ears and red facial vein tracery are not Seymour, who is pale-skinned."

The judge is right on canon — Seymour is pale-skinned and his ears are not
elongated; the Guado traits that round 5 chased belong to Tromell and the Guado
crowd, not to their half-human maester. The plate was rebuilt with `pale fair
skin` weighted and `green skin, teal skin, pointed ears, elf ears, red veins,
vein tracery` in the negative, and the likeness resolved immediately.

**§25's Seymour line is therefore wrong and should not be followed.** Recording
it rather than editing it, because the same trap is one round away from catching
the next pass: "more Guado" reads like a canon fix and is not one.

## 32. Heterochromia varied this round, which is what §21 predicts

§21 proved the *prompt channel* is inert for Yuna's eye sides — eighteen for
eighteen came back green on the viewer's left regardless of what was asked. It
did **not** claim the sampler never varies, and this round it did: the `ch2`
batch split 3/3 and the `ch5` batches split roughly 50/50, while `yuna` came
back green-left in all six.

So §21's "do not spend another batch on it" stands — no emphasis clause was
spent on eye sides this round — but §8's "judge the eye sides on every variant
and pick" is live again wherever a batch varies. Four `ch2` and `ch5` candidates
that were strong on every other axis were rejected purely on inverted eye sides.
**All nineteen plates remain green on the viewer's left, blue on the viewer's
right.** The canon question §21 raised is still unsettled and still needs
someone who owns canon to rule on it.

## 33. The two judged complaints that were NOT acted on

Both are repeats of §26, and both are still correct to decline:

- **"Shuyin himself appears nowhere in the directory despite being the chapter
  antagonist."** Shuyin is a humanoid, and §23 is explicit that a second human
  figure collides with `solo` and the `2boys` ban in `BASE_NEGATIVE` — the
  checkpoint resolves that collision by fusing the second figure onto the
  subject. The statue trick that carried Yunalesca into `ch2` works because a
  statue is not a person; there is no equivalent dodge for Shuyin, who has to
  read as a living man. **This needs a `comfy.mjs` change** (a per-shot way to
  drop the multi-subject bans), not another prompt, and `tools/` is outside this
  pass's write scope.
- **"Byte-identical duplicate of `ch5-ffx2-vegnagun-shuyin.png`."** Intended, per
  §19 and §26. `chapter-meta.ts` resolves ch5 through the `ffx2` spelling, so
  both names were written this round from the same keeper. The naming
  inconsistency is still a **code** change and still unowned.

## 34. Still open, after this round

- **Jecht's hair is still long and shaggy**, which was the judge's first
  complaint and the one thing three batches (18 renders) never landed. Batch A
  got the teeth, the sternum emblem and a non-neon background; batch E got
  shorter hair only by losing the emblem and the background. `jecht` in
  `cast.json` and the `idle` it references both carry the long silhouette, so
  `--ref` is arguing for it at 0.5 — the next attempt should try `--refWeight
  0.4` before another prompt rewrite.
- **Jecht's plate still runs hot.** Lanterns are not neon, but the warm orange
  is the odd one out in a set that is otherwise cool. Same fix as the hair: it
  is one re-roll, not a prompting problem.
- **Wakka's headband still carries invented ornament** — now three small metal
  discs. `forehead ornament, gem, medallion, badge, metal disc, brooch` were all
  in the negative and did not bite. That is four consecutive rounds (§20, §27,
  here) of the same ban failing on the same subject. It is not a wording problem
  any more; it probably wants an inpaint.
- **Ch.5 is dark across the top and warm at the lower edges**, not dark
  throughout. Weighting the darkness harder (batch D at 1.25) made the machina
  ornate and the hair pink instead. The half-dark version shipped.
- **Ch.1's mouth is bared teeth, not a wide open shout.** The brief asked for a
  shout; what landed reads as anguish through gritted teeth. It is a clear
  improvement on the shipped closed-mouth version and was not worth a further
  batch, but it is not literally what was asked.
- **Auron's scar** (§27) and **Kimahri's broken horn** (§27) are untouched —
  neither was flagged this round, and neither is fixed. Both remain inpaint
  candidates.
- **Candidate folders are deleted**, per the §3 convention. The five batches were
  written to the session scratchpad rather than into `public/art/`, per §27.
  Every shipped plate's sidecar carries its seed and full prompt.
