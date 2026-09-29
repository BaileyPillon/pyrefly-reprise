# Songstress for Rikku and Paine (2026-09-29)

**Game case: FFX-2 only** (rule 14). Dresspheres are an FFX-2 mechanic; the Songstress is worn in
Chapters VI and XIII (and anywhere else a girl's grid lists it). PR-0228, D-275, D-281.

**Whose pick.** Bailey, 2026-09-28 ~22:45 EDT, chose "Your pick (Recommended)" for the driver's
question "Rikku's and Paine's Songstress paintings ...: may I go with my pick tonight?" (D-281). So
the picks below are the **driver's picks, delegated by Bailey**, not Bailey's own approval. The other
options stay saved so Bailey can swap.

**Before:** a spherechange to Songstress showed a grey placeholder mannequin for Rikku and Paine
(`public/art/characters` had `yuna-songstress` only).

## Sources (rule 6, rule 8)

Costume words come only from written sources, now in `research/visual-bible.md` section 1.24:
FF Wiki *Songstress* revid 3972937 (the costume sentences and the victory poses) and *Final Fantasy
X-2 victory poses* revid 3955034, read as wikitext through the MediaWiki API. Hair, eyes and skin come
from each girl's shipped FFX-2 idle sidecar (`rikku-thief/idle.json`, `paine-warrior/idle.json`).
No retail image was used as input, reference or IP-Adapter: the only image inputs are our own shipped
idles' head crops (options) and the picked idle's square and head crop (poses).

## The options: [options.html](options.html)

Self-contained, 1.2 MB. Each option: the pilot at battle size in Chapter VI (1600x900, the other two
girls in their shipped paintings), the pilot as a cut-out, and every pilot rendered for it.

| Option | Two lines |
|---|---|
| **Rikku A, Showtime stance (recommended)** | Leaning forward, hand on hip, green microphone low: her Thief idle's stance in the written costume. Our estimate: the orange shade and headband width; the boots carry little purple feather trim. |
| Rikku B, Singing | Microphone at her mouth, arm flung out; the back ruffles and thigh ribbon read best. A singing idle sings all fight, and a blue ribbon streamer is not in the text. |
| Rikku C, Dance finish | Knee up, hand to her chest: the end of her written victory dance. Unsteady as a standing loop; the hair ribbons fly wide. |
| **Paine A, Cool stance (recommended)** | Three-quarter, microphone low at her side like her Warrior sword, hand in pocket: the rock half of the design note. Painted facing left; the engine mirrors it. |
| Paine B, Singing | Eyes shut, microphone at her mouth, hand on hip: the Top 40 half. The jacket grows a long coat tail the text does not describe. |
| Paine C, Arm raised | The microphone high above her head: her written victory pose. As a standing loop it reads as a victory already won, so her victory painting takes this pose instead. |

**Recommended, one per girl.** Rikku A: it keeps the stance of her shipped idle (she still reads as
Rikku across the field), it holds still the way a standing loop must, and every written costume item
is in it. Paine A: her Warrior idle's language (weapon low at her side, weight on one leg), the
calmest loop of the three, and every written item. B and C feed the cast and victory paintings.

## Production (the picks, `picks.json`)

Method: the art5 method (`docs/concepts/art5/README.md`): Animagine XL 4.0 Opt, the art5 `flask`
OpenPose skeletons (the set Yuna's Songstress poses came from) at 0.65 to 0.85, IP-Adapter Plus 0.5
ease-in 0.2 to 0.8 K+V on the picked idle square-padded plus its head crop, body-only pose tags
(`poses.json`), the cutout guard on every frame, black frames stop the queue. Victory has no skeleton
(Yuna's is both arms up; the text gives each girl her own). Every render was looked at
(`look` sheets in the scratch folder); pilots first (item and cast, 2 each), then the batch.

| Slot | Rikku | Paine |
|---|---|---|
| idle | option A cand-4 | option A cand-2 (facing left, mirrored by the engine) |
| cast (Dance, Sing) | cand-2, scale 1.15 | cand-14, 1.1 (second try) |
| item | cand-4, 1.15 | cand-11, 1.05 (second try) |
| attack (Mug, Berserk only) | cand-5, 1.15 | **empty**: try a gave her a bob, try b flame-spike hair and a lunge away from the enemy (rule 15, stopped) |
| hurt | cand-3, 1.25 (weak) | **empty**: both tries paint loose baggy trousers (the text: long tight white pants) (rule 15, stopped) |
| ko | cand-7, 1.1 (second try: try a pillowed her cheek on her arm) | cand-13, 1.0 (second try) |
| victory | cand-6, 1.05 (hand at her chest) | cand-14, 1.05 (microphone over her head) |
| dance (no engine slot reads it yet) | cand-5, 1.0 | cand-11, 1.0 |

Paine's second try (cand 11 and up) added `(spiked hair:1.2), (hair slicked back:1.1)`; her first
try painted a bob. Rikku's cand 3 and up negate wings and tails (the "purple feathers" grew into a
feather tail in the pilot). Empty slots fall back to the standing painting (D-179), never a
mannequin.

**Scales.** Head match against each girl's new idle, read by eye with the idle and the pose on one
baseline at 1.0 / 1.15 / 1.3 ([scale-check-rikku.jpg](scale-check-rikku.jpg),
[scale-check-paine.jpg](scale-check-paine.jpg)), checked against the feet-to-eye-line ratio from
`measure.py`. The poses were painted on skeletons at 0.8 of an idle, so their bodies stay about 0.85
to 0.9 of the idle's height at head match; that is the same trade the D-179 and D-194 installs made.

## Files

- Candidates, each with a `.prov.json`: `D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress/`
  (`options/<option>/`, `poses/<id>/<slot>/`, `refs/`, `queue.log`).
- Tools: `gpu.mjs` (the ComfyUI runner: fewer than 3 prompts in /queue in total), `render-options.mjs`,
  `render-poses.mjs`, `capture-options.mjs`, `make-options.py`, `measure.py`, `install.mjs`
  (`stage`, then `apply` once the public/art gate is open; new folders only, never overwrites),
  `proof.mjs` (real keys; adapted from the 2026-09-25 poses verifier).
