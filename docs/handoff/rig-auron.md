# The Auron rig (branch `rig`, 2026-10-18)

Bailey, 2026-10-18: "I like lulus new rigging, great job. We need this done for all characters and bosses. It's a priority"; then "Yes that's fine. I'll go with all of your recommendations". Auron is next after Kimahri and Lulu. His costume pick, delegated to the driver: **Auron's IDLE painting** (the red coat with the white and blue lining, the high blue and gold collar, the black trousers, the katana held up in his right hand), the same rule as for Kimahri and Lulu.
Game case: **FFX only** (Auron is an FFX figure, `characters/auron/*`; he has **no `defend` and no `od-fury` painting**, so no front-view part was built). Nothing here is shared plumbing: no pipeline, gate or engine file changed, only a subject config, a hook module and a test. Pipeline and gate: [rig-pipeline.md](rig-pipeline.md); the worked examples: [rig-kimahri.md](rig-kimahri.md) and [rig-lulu.md](rig-lulu.md) (pass 2 is the method copied here); engine: [rig-engine.md](rig-engine.md); release: [rig-ship.md](rig-ship.md).

**State: the rig is on disk, gated `ok` with full coverage (`--require-coverage`), `--verify` passes, it stays OFF: nothing is installed into any art mirror, nothing is merged to main or deployed, no review was run.** `D:/pyrefly-art-rigs/auron`: 14 parts, 21 bones, 11 keys (the idle and the ten painted poses), 3,958 vertices, 6.48 Mpx, 8.30 MB of PNG, the `1x/` tier proved (28 files, 3.24 Mpx, 2.38 MB). Work files: `D:/pyrefly-art-rigs-work/auron` (cut, build, `fit/keys.json`, targets). Nothing was written into `public/art`, `D:/pyrefly-art-r50` or the release tree.

## Where Auron fights (the chapters this rig changes)

On the field from the first turn (`activeSlots`): **Yunalesca** (`yunalesca`, chapter 2: Tidus, Yuna, Auron), **Braska's Final Aeon** (`braskas-final-aeon`, chapter 3: Tidus, Yuna, Auron), **Seymour Omnis** (`seymour-omnis`, Garden of Pain: Tidus, Yuna, Auron), the two Sin chapters (`sin-fins-core` and `sin-face`, built from `sinFahrenheitBuild`: Tidus, Yuna, Auron) and the hidden **Sinspawn Gui** (`sinspawn-gui`, door word `mushroom`: Tidus, Auron, Lulu).
On the bench (`reserve`, he can be switched in): Seymour Flux (`seymour-flux`, chapter 1), Seymour and Anima (`seymour-anima-macalania`), Seymour Natus (`seymour-natus`, Highbridge), Evrae (`evrae-airship`), Mirror Aeons (`mirror-aeons`) and the Yojimbo cavern (`yojimbo-cavern`). Sources: `src/data/ffx/builds/*.ts` (`activeSlots`, `reserve`). The clips and the harness are the Sinspawn Gui chapter (the one that fields him from the first turn and is already scripted for the harness).

## The costume, the parts, the bones

One painting, `characters/auron/idle@2x.png` (1598 x 2408, sha in `rig.json`), cut into **14 parts** back to front: `tail`, `saya`, `coat`, `blade`, `legL`, `legR`, `torso`, `sleeveL`, `armR`, `sword`, `glove`, `shoulders`, `head`, `tassels`. **No SAM and no generative model**: polygons, capsules and colour tests over the painting's own alpha (`tools/rig/subjects/auron.json` `cut`), classical fills only (`skirt` underlaps, `extend`); the rest composite overlaps the painting by 0.994 (the gate asks 0.95).
- **The coat gets the skirt treatment** (`tools/rig/subjects/auron_hooks.py`, copied from Lulu's pass 2): the lower coat hangs from the hips, never from the hem. A coat vertex blends the `pelvis` (alone above row 620) and `coatL` / `coatR` (alone below row 800, a smoothstep between; left and right split by x at the hips); the trailing red left panel is its own part, the `tail`, skinned the same way and hung from `coatL`, so it can swing or shrink and open no wedge. `coatL` and `coatR` are **children of the pelvis** with their joints at the hips (450, 620): hung from the root, the joint stayed behind when a key lowered or bent the hips and the gate found a hole there (216 px in the sleeping key). The tail's range is 0.3 to 0.7 of its length in every key, so it never trails like a train (the idle's tail reaches about 0.39 of his height left of the feet).
- **The sword is a prop with its own bone** (`sword`, a child of the root with its joint at the grip, like Lulu's doll): a key can offset it (up to 0.9 of the image), turn it 180 degrees either way and scale it 0.4 to 1.6, so it goes to whichever hand, hip or ground the painting has it. `sword` is the handle and the visible blade; `blade` is the **hidden length of the blade** (a classical fill: the blade's own silver and blue extended along its axis under the torso and the empty sleeve, where the painting hides it; it is invisible at rest and shows as a plain grey-blue bar when a key swings the sword away); `saya` is the scabbard on its own bone on the pelvis; the `glove` is drawn over the handle on the `hand` bone. Landmarks: `swordHilt` (the pommel) and `swordTip`.
- **The skeleton:** `root`, `pelvis`, `spine`, `chest`, `head`, `coatL`, `coatR`, `tail`, `upperarm` / `forearm` / `hand` (his sword arm), `sword`, `upperarmF` / `forearmF` (the empty left sleeve: a sleeve with no hand), `saya`, and two legs `thighR` / `shinR` / `footR` and `thighL` / `shinL` / `footL`. The far leg is only a boot in the painting: `legL` is that boot plus a classical extension of its colours up under the near leg.
- **One hand.** The idle shows one gloved hand (on the sword). Where a painting shows two (the orb of `cast`, the flask of `item`) the rig has one glove, put on the hand the key can reach, and the other hand is the handless sleeve.

## The marks (`tools/rig/subjects/auron.json` `landmarks`, in the paintings' own 1x pixels, by eye, +-15 to 25 px = 0.013 to 0.02 of the idle's height)

Per pose: `headCenter` (the face at eye level), `fist` (the glove), `swordHilt` (the pommel end), `swordTip`; no feet (they are under the coat in several poses; the planted-feet check reads `feet`). Where the pommel is hidden under the hand the mark is placed at the distance the rig's own handle gives. Three paintings face LEFT (the head and the hilt-to-tip direction run opposite to the idle's) and say `turn: true`: `attack`, `item`, `victory`. The sidecars say `"facing": "right"` for all of them (the same fault as Kimahri's ready and Lulu's attack): fixing them is a `public/art` change, not touched. `cast`'s `fist` is the orb hand (the front arm); the sword is put by its own bone at the other hand's place.
The registered head boxes of the pose model are not the face for several of his paintings (`ready`: the raised hand), so the face is marked; the model's placement is what the gate reads the marks through.

## The per-key table (the gate's own reading: `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/auron --art D:/pyrefly-art-r50 --require-coverage`)

| pose | source | overlap | worst landmark | stature | feet dx / dy | real head | holes |
|---|---|---|---|---|---|---|---|
| idle | the costume at rest | 0.994 | - | 0.999 | 0.000 / -0.001 | 1.000 | 0 |
| attack | **AUTHORED**, painting turned | 0.615 | 0.029 | 0.905 | -0.008 / -0.001 | 0.850 | 0 |
| cast | **AUTHORED** | 0.505 | 0.043 | 0.945 | 0.003 / 0.001 | 0.930 | 0 |
| critical | **AUTHORED** | 0.648 | 0.030 | 0.868 | -0.011 / -0.004 | 0.930 | 0 |
| follow | **AUTHORED** | 0.468 | 0.040 | 0.901 | 0.011 / -0.006 | 1.110 | 0 |
| hurt | **AUTHORED** | 0.586 | 0.030 | 0.906 | 0.015 / 0.020 | 0.930 | 0 |
| item | **AUTHORED**, painting turned | 0.492 | 0.043 | 0.926 | -0.012 / 0.007 | 0.930 | 0 |
| ko | **AUTHORED** (lies down, `planted: false`, root scale 0.78 to 0.8) | 0.340 | 0.030 | 0.528 | -0.184 / -0.001 | 0.898 | 0 |
| ready | **AUTHORED** | 0.675 | 0.020 | 0.913 | -0.009 / 0.020 | 0.851 | 0 |
| sleep | **AUTHORED** | 0.427 | 0.029 | 0.887 | 0.003 / -0.014 | 0.961 | 0 |
| victory | **AUTHORED**, painting turned | 0.484 | 0.057 | 0.980 | 0.015 / -0.010 | 1.120 | 0 |

Gate: OK, 11 of 11 keys, full coverage (every painted pose has a key, `exempt` empty), **176 poses scanned for holes at 18 joints (every key and 25/50/75 percent between every two): none**. The verbatim runs are `D:/Tools/pyrefly-scratch/2026-10-18/rig-auron/gate-stamp-run.txt` and `gate-verify.txt` (verify: "stamp ok (11 key(s), full coverage), 1x tier proved (28 file(s))"), the machine-readable report `gate-report.json` (same folder). `node tools/pose-gate.mjs --check --rigs D:/pyrefly-art-rigs`: 1,106 paintings, 37 rigged (13 Kimahri, 13 Lulu, 11 Auron's: the census counts an authored key as rigged), 0 fail.

## Why all ten are authored (the overlap waived, the landmarks and every other band not)

No key reaches the 0.75 overlap (0.34 to 0.68). The paintings are not one costume: the attack painting wraps an orange hood round his head, the item and sleep paintings draw long robes with white and blue trim, the follow painting a short armoured coat, the KO a cropped close-up; the cast and item paintings each show two hands, an orb and a flask. The rig wears the idle's costume in every pose, which is the point of the program, so the overlap is capped by the costume, exactly as for Kimahri's six and Lulu's eight. Each authored key is the idle's body posed to where the painting has the head, the sword hand and both ends of the sword (every landmark within 0.06 of the idle's height, the worst 0.057), the feet planted within 0.02 and the stature and head inside the pose class's bands. A clip of each beside its painting is in `clips/authored/` (below). Facing: attack, item and victory are read turned.
**KO**: the painted KO is a cropped close-up (0.465 of the idle's length, a life-size head). The key lies the whole figure down (`root_rot` 70 to 95 degrees, `planted: false`), root scale 0.78 to 0.8, head scale 1.15 (the head inherits the root's scale and the spine's, which is held at 1; the gate refuses a head under 0.85 of the idle's), the legs held nearly straight (folded legs opened holes at the thigh in the blends from the idle): a small full-length figure, not the painted close-up.

## Clips and sheets (real game, headless Chromium on the real GPU, 1600 x 900, an exact 60 Hz on a virtual clock; the Sinspawn Gui chapter, only Auron a rig)

`D:/Tools/pyrefly-scratch/2026-10-18/rig-auron/clips/authored/<pose>.mp4`: the ten poses, the rig left and the painting the game uses today right, the same real-game frame, the gate's numbers in the caption (idle easing into the pose, 130 frames). `play/auron-moment.mjs --mode=poses` (adapted from Lulu's `lulu-moment.mjs`), `play/authored_clips.py`, `record.sh` (warm-up and one retry), `build_sheets.py`.
Sheets for Bailey (the same three sheets as Lulu's, in the same order, the rows for poses he does not have dropped, plus a fourth for the three poses on none of them): `for-bailey/auron-rig-1-ko.png` (the KO alone: no defend or Overdrive painting), `-2-attack-hurt-return.png`, `-3-ready-lowhp-asleep.png`, `-4-cast-item-victory.png`.
The console held only the six expected 404s (`rig.json` of Tidus, Lulu and the four Sinspawn Gui parts: figures with no rig).

## The continuity harness, rig on and off (`harness-summary.txt`; the whole Sinspawn Gui fight, 362 s, 22,638 frames, seed 1, `autoBattle('intended')`; only Auron is a rig)

| | rig on | rig off (painting set) |
|---|---|---|
| pose swaps recorded (all figures) | 612 | 791 (179 of them Auron's) |
| CHK-026 / CHK-027 | PASS / FAIL (14 jerks at a swap, worst 59.1 px) | PASS / FAIL (28 jerks, worst 206.3 px) |
| Auron's head, one-frame step (tracker) | 84.7 px | 85.1 px |
| Auron's head, feet, pelvis jerks (tracker) | 25 (head 25, feet 28, pelvis 17 alone) | 15 (head 15, feet 1, pelvis 2) |

Read it plainly: **the probe's improvement is partly vacuous** (it reads painted-plane pixels, so with the rig on it judges nothing of Auron; Tidus, Lulu and Gui's parts are painted either way), and **the tracker is worse with the rig on, not better** (Lulu's was 8 against 25). The 25 head jerks are 13 in `attack`, 11 in `idle` and 1 in `ready`; 14 of them fall within three frames of a painted-run jerk, so they are mostly the engine's lunge and the camera, which both runs have; 11 are the rig run's own and were not diagnosed. The feet jerks are the tracker's different definition (the rig's `feet` landmark follows a lunge, a painted actor's anchor does not), as in the Kimahri and Lulu notes. The two runs did not play identical fights (Auron is in `victory` for 6,456 frames in the painted run, 221 in the rig run), so the pose counts are not a like-for-like comparison.

## What still looks wrong (plainly)

- **It reads as Auron, not as the painting.** In the sheets the rig stands in the idle's red coat and dark trousers in every pose; cast shows no orb, item no flask (one glove only), attack no orange hood. The overlaps are 0.34 to 0.68 and every key is authored.
- **The sword's hidden blade is a flat grey-blue bar** where a key swings the sword away from the body (hurt, cast, ready, the KO); it is a fill, not painted steel.
- **The far leg is a stand-in** (one painted boot plus a navy extension): a flat dark wedge shows in some bent poses; in `critical` and `ready` the hips are lowered to reach the painted head and the legs bend and look floaty.
- **The KO** is a small figure with a thin vertical bar standing up from it (the saya), lies behind Tidus in the sheet and is not the painted close-up.
- **Thin margins**: `attack` head 0.850 and `ready` head 0.851 against the 0.85 floor, `hurt` and `ready` feet 0.020 against the 0.02 band, `victory` fist 0.057 against 0.06. The marks are by eye (+-15 to 25 px), so the real margin against someone else's marks is thin.
- **The tail shrinks the moment a pose starts** (0.3 to 0.7 of its length in every key; the idle keeps it whole): the blend from the idle shows the coat's tail drawing in. By design (never a train) but visible.
- The tracker's head jerks (above), the idle-to-pose blends and the `saya`'s lag were not examined in a clip beyond the poses.

## What cost the runs (lessons for the next figure; the pipeline did not change)

About **128 pose fits in 20 rounds** (10 in parallel, about 4 to 6 minutes a round on this machine's CPU), about twice the bound the brief set (about 60): the structure of the coat and the legs had to change four times. The causes, each one a general fact about the gate:
1. **The feet are read off the silhouette, not off the foot bones**: the gate's stance is the middle of the 3rd to 97th percentile of the silhouette's columns in a band 4 percent of its height above the lowest "opened" row. Any part that reaches the bottom band (a coat tail's tip, a lining flap, an underlap copy of a boot) moves it. Keep every non-leg part's lowest point clear of that band in every key (the tail's range is capped at 0.7 for this).
2. **An underlap copy skins like its host part**: the coat gained a copy of the near boot under the leg (`skirt` op) and that copy, skinned to the coat, hung as a second boot below the soles when a key moved the coat. The coat's underlap of the legs is now limited to above row 1000 (zone `coat_legs`).
3. **A joint that is a child of the root stays where it was when the pelvis moves**: hang the coat bones from the pelvis.
4. **The fitter's stance term saturates** (Lulu's note): start a pose from the previous good key (`fit.keys.<pose>.init`) and weight `feet_x_w` and `dfoot_w` high.
5. **The idle's raised arm is foreshortened** (it points at the camera, 200 px long): an in-plane hand (`hurt`) needs the arm scaled up to 1.7.
6. Spine or chest scales lower the head but the head inherits them (the gate's head floor is 0.85): crouch with the legs and the pelvis offset instead; the head scale goes up to 1.2.

## Tests run

Vitest `tests/unit/tools/rig-subject-auron.test.ts` 11 passed (the config's parts, skin, bones, marks, the turned and authored lists, no front parts, the coat hung from the pelvis, the sword prop, the KO's head band); with the rest of the rig files (`tests/unit/tools/rig-*.test.ts` and `tests/unit/rig/*`, this one included): 20 files, 225 tests passed. Python `tools/rig/test_rig_pipeline.py` 12 OK. `npx tsc --noEmit` clean. `node tools/pose-gate.mjs --check --rigs D:/pyrefly-art-rigs`: 0 fail.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe` then `$PY -I tools/rig/rig.py cut --subject auron` and `build --subject auron` (about 30 s and 15 s; no SAM), `fit-keys --subject auron --poses a,b --seed n` (4 to 6 minutes a pose, one thread; `fit.keys.<pose>` in `tools/rig/subjects/auron.json` carries each pose's limits, scales, `init`, weights), `export --subject auron --no-gate`, `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/auron --art D:/pyrefly-art-r50 --require-coverage` (stamps it), `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/auron`, then `node tools/rig-gate.mjs --rig ... --verify --art ...` (what the deploy runs). `fit-keys` writes one `fit/keys.json` per work folder: run side-by-side batches with `RIG_WORK=<dir>` per pose (copy `build/` and `targets/` in first) and merge the winners; the final keys are `D:/pyrefly-art-rigs-work/auron/fit/keys.json` (also `keys-final.json` in the scratch folder, with `fitbatch.sh`, `merge.py`, `gaterun.sh`, `sweep.sh`, `showkey.py` and `markdiag.py`).

## Still open

- Install and ship: `art-install --rig auron` (or `art-mirror-add-rigs.mjs` onto a new mirror), then the focused review ([rig-ship.md](rig-ship.md)); the ten authored keys want the driver's eye on the sheets first, the KO above all.
- The orb of `cast` and the flask of `item` (two hands, a prop in the second), the hidden blade's fill, the far leg's fill, and the idle-to-pose tail pop are the visible faults; none was attempted.
- The 11 rig-only head jerks in the harness are undiagnosed.
- The other chapters' figures are cut the same way, one subject config each; Auron's config is the example for a figure with a long coat, a detachable prop sword on its own bone, two legs, and no front-view painting.
