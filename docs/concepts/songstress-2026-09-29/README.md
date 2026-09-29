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

## Install: NOT DONE (the public/art gate never opened)

`public/art` is shared by every worktree through junctions and release 29 was being built from it,
so nothing may be written there until `D:/Tools/pyrefly-scratch/overnight-0929/rel29-deployed.done`
exists. It was checked every 5 minutes from 02:25 to 05:26 EDT on 2026-09-29 and never appeared.
The 14 files are staged (byte-identical PNGs + finished sidecars) in
`D:/Tools/pyrefly-scratch/overnight-0929/songstress/install-stage/characters/`, and a rehearsal
with those files served as an override over a production build (nothing in public/art) already
showed every slot in Chapters XIII and VI with no mannequin and no 404 of ours (below).

**Exact steps, once the gate file exists** (from `D:/pyrefly-aeon-hp`, branch `songstress-0929`):

1. `(Get-PSDrive D).Free` above 3 GB; `Test-Path D:/Tools/pyrefly-scratch/overnight-0929/rel29-deployed.done` is True.
2. `node docs/concepts/songstress-2026-09-29/install.mjs apply`: refuses if the gate is closed or
   any target exists; copies the 14 PNGs and 14 sidecars into NEW folders
   `public/art/characters/rikku-songstress/` and `paine-songstress/`, and backs every file up to
   `D:/Tools/pyrefly-art-backup/approved/2026-09-29-songstress/installed/` (+ `replaced/NOTE.txt`,
   `hashes.json`). Never overwrites, never deletes.
3. `node tools/gen/manifest.mjs` (the `art:manifest` script; writes `public/art/manifest.json`).
4. `node docs/concepts/songstress-2026-09-29/install.mjs lock`: adds the set
   `driver:2026-09-29-songstress (D-281, delegated by Bailey)` to `docs/target/approved-hashes.json`
   (words "Your pick (Recommended)", the file's own one-space format and line endings).
5. `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` with `ROOT=D:/pyrefly-aeon-hp`: 0 mismatched, 0 missing.
6. Copy `docs/concepts/songstress-2026-09-29/pose-install-songstress-0929.test.ts`
   to `tests/unit/engine/` (it pins the lock, the slots and the sidecars; it is parked here because
   it fails until step 4), then `npx tsc --noEmit` and
   `npx vitest run tests/unit/engine/pose-install-songstress-0929.test.ts tests/unit/engine/dressphere-pose-fallbacks.test.ts tests/unit/engine/pose-install-0926.test.ts tests/unit/art-manifest-loader.test.ts`.
7. Proof on a production build by real keys: `npx vite build --outDir D:/Tools/pyrefly-scratch/overnight-0929/songstress/dist --emptyOutDir`;
   serve it with `node D:/Tools/pyrefly-scratch/overnight-0929/songstress/serve.mjs 8407 D:/Tools/pyrefly-scratch/overnight-0929/songstress/dist`
   (no override folder); then, each at 1600 900 and at 390 844, with `PYREFLY_BROWSER=gpu HEAL=1 HEAL_AT=0.9`:
   `PLAN=xiii-main ... proof.mjs http://127.0.0.1:8407/pyrefly-reprise/ ffx2-trema <W> <H>`,
   `PLAN=xiii-rikku-ko`, `PLAN=xiii-paine-ko` (both ffx2-trema), and `PLAN=vi-main` on ffx2-leblanc.
   Frames land in `docs/screenshots/songstress-0929/` (`git add --sparse`). Stop the server by PID.
8. Update D-281's `delivery` to `implemented` in `docs/target/decisions.json`, commit only those
   paths on `songstress-0929` ("FFX-2 only"), and never push (the driver pushes).

## Rehearsal (override server, nothing in public/art)

`proof.mjs` against the staged files served over the options build, 1600x900, real keys from the
title: **XIII** (`xiii-main`): both girls spherechanged to Songstress by the Change menu; Paine's
Item (Mega-Potion) and Rikku's Dance (cast) and Item showed their own paintings at the sidecar
scale; Rikku's attack and both victories were STAGED (`actor.setPose`, labelled: Songstress has no
Attack command, and Paragon's scripted Big Bang wipes the party at about two minutes, before any
victory). Paine's Dance landed in an earlier run (ratio 1.1 = sidecar). **VI** (`vi-main`,
EARLY_VICTORY, enemy HP set to 1, labelled): Paine by the Change menu, Rikku re-dressed with
`stage.setArt` (labelled: her Bum Rush grid has no Songstress node in VI), and the real victory
moment showed both girls' victory paintings. The only 404s were `yuna-dark-knight/hurt.png` and
`ko.png`, which predate this work. Frames: `D:/Tools/pyrefly-scratch/overnight-0929/songstress/pre-proof*/`.

## Files

- Candidates, each with a `.prov.json`: `D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress/`
  (`options/<option>/`, `poses/<id>/<slot>/`, `refs/`, `queue.log`).
- Tools: `gpu.mjs` (the ComfyUI runner: fewer than 3 prompts in /queue in total), `render-options.mjs`,
  `render-poses.mjs`, `capture-options.mjs`, `make-options.py`, `measure.py`, `install.mjs`
  (`stage`, then `apply` once the public/art gate is open; new folders only, never overwrites),
  `proof.mjs` (real keys; adapted from the 2026-09-25 poses verifier).
