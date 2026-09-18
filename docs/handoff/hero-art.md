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
