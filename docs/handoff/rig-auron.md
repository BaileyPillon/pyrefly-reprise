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


## Pass 2 (branch `rig-auron2`, 2026-10-18; format v2; Game case: FFX only)

Bailey, 2026-10-18: "We need this done for all characters and bosses. It's a priority" and, in advance, "I will go with all your recommendations". The driver judged pass 1 not good enough to switch on (the poses stiff and too alike, cast no orb, item no flask, a flat grey blade bar, the far leg floaty, a stray scabbard bar in the KO) and asked for one bounded pass 2 on format v2 ([rig-v2-and-kit.md](rig-v2-and-kit.md)). Game case: **FFX only** (Auron is an FFX figure; the kit changes below are additive plumbing that changes nothing for a subject that does not use them). **The rig stays OFF**: nothing is installed into any art mirror, nothing is merged to main, no review was run. `D:/pyrefly-art-rigs/auron` (pass 1) is untouched; the new rig is `D:/pyrefly-art-rigs/auron-v2` (config `tools/rig/subjects/auron-v2.json`, art id `auron`).

**The recipe: the body, head and coat come from the idle; each pose brings its OWN painted limb and prop, cut from that pose's painting.** `auron_variants.py` cuts a variant from a pose painting by a mask (polygons, capsules, colour tests: the cut's own predicate language) and places it where the pose model registers that painting, so it lies in the bind frame exactly where the painted limb lies in the registered painting (the three paintings that face left are turned, as the gate reads them). No SAM, no generative model: the painting's own pixels, resampled once. Variants are rigid on `root`; the body is fitted around them.
- **Two hidden parts, `armX` (the limb) and `swordX` (the prop), carry the variants** (their own base look is a 4 x 4 transparent PNG, so the budget counts only the variants). Not variants of `armR` and `sword`: the first try made them variants of `armR`, and the gate's hole watch then kept the idle's shoulder, elbow and wrist joints under watch in poses where the idle arm was no longer drawn (hole-key 76 to 256 px at `upperarm`, `forearm`, `hand`, `sword`, in every blend). A joint none of whose rest-shown parts is shown is not watched; that is what a part of its own buys.
- **What each key does** (`fit.keys.<pose>`: `image`, `hide`, `layers`): every key with a variant hides the idle's `glove` and `saya` (and `sword`, where a variant carries the blade). `attack` and `ready` bring the whole arm (sleeve, glove, hilt, blade as painted): the idle's `armR` stays in the key, **hung straight down behind the coat** (`upperarm` fixed at 90 degrees, `layers: {armR: 0.5}`), where the painting hides it, which keeps its joints covered. `cast`, `item` and `follow` bring the forearm, hand and prop; the idle's sleeve is fitted to reach the cut end (the pose expects `elbowPt` / `wristPt` at the painted cuff), its `hand` segment held straight and the `forearm` scale capped (a child inherits its parent's scale). `hurt`, `victory` and `critical` bring the sword with its hand (and the saya in `victory`, the planted blade in `critical`); the idle's arm stays fitted. `sleep` and `ko` have no variant (below).
- **Marks.** Each variant's own landmarks (`fistCast`, `swordHiltCast`, `swordTipCast`, ...) sit on `root` at the registered position of a painting point; the pose's `expect` names them (the painting's own 1x points, the same ones pass 1 marked where they still apply). They check that the registration and the key agree; they are not a tuning handle.

| variant | pose | what it brings | PNG px | verts |
|---|---|---|---|---|
| `armX:cast` | cast | the arm with the orb: black forearm, glove, the orb with its two diamonds and spikes | 331 x 326 | 132 |
| `swordX:cast` | cast | the left hand and the drawn katana at the hip, hilt and blade | 532 x 265 | 126 |
| `armX:item` | item | the arm and the flask: glove, flask and its red liquid, the cuff | 156 x 232 | 58 |
| `swordX:item` | item | the sheathed katana at the hip: hilt, tassel, saya | 220 x 309 | 86 |
| `armX:attack` | attack | the raised sword arm: the sleeve that billows over his head, the glove, the hilt and its tassel, the whole blade | 576 x 1066 | 258 |
| `armX:follow` | follow | the low sword arm: forearm, glove, the guard, the curved blade (cut above the soles, see the feet) | 460 x 575 | 153 |
| `armX:ready` | ready | the raised arm and the sword over his head: sleeve, glove, red-wrapped hilt, the crescent blade | 671 x 368 | 196 |
| `swordX:hurt` | hurt | the hand, the hilt with its tassel, the drawn blade held low | 749 x 322 | 167 |
| `swordX:critical` | critical | the katana planted point down: hilt, guard, saya | 67 x 455 | 79 |
| `swordX:victory` | victory | the hand on the hilt and the long blue saya | 476 x 459 | 102 |

Variants are 1.0 to 1.15 PNG px per idle-1x px (the idle's own parts are 2.0): 857 KB of PNG for ten variants against a 9 MB budget that the rest of the rig already spends 8.0 MB of. Palette distance: the gate prints 0.5 for every variant (its base look is the empty placeholder, so the number says nothing); the same measure against the idle part each stands in for (`armR` for `armX`, `sword` for `swordX`) is 0.69 to 0.83 (`D:/Tools/pyrefly-scratch/2026-10-18/rig-auron2/palette.json`): different pixels of a different costume by construction (black gloves, an orb, steel against a red sleeve), so read it as "these are not the idle's colours", which is the point.

**The grey blade.** The `blade` part (the flat grey-blue fill of the hidden length of the katana) is gone: its cut rules, skin and PNG (314 KB). Where a variant brings a blade, that blade is the painted one; where a key still shows the idle's sword (`sleep`, `ko`) it is the idle's own sword part, a hilt and the visible 360 px of blade.
**The far leg.** `legL`'s hidden length (under the near leg) is now a darkened copy of the NEAR leg's own trouser pixels (they lie under it at rest) instead of the boot's flat navy; a scrap of the coat's red at its top is the trouser's black. Classical, no new colour. Not done: hiding `legL` where a painting hides it (cast and hurt show one leg): the hole watch and the overlap were not re-measured for it.
**The KO.** The key hides the scabbard (`hide: [saya]`): the thin vertical bar is gone. The footprint: the key's stance reads -0.211 idle heights from the idle's against -0.223 for the painted KO on the same registration (pass 1: -0.184): 0.012 apart. The painted KO is a cropped close-up, so the rig's whole lying figure is longer than the painting and still lies mostly behind Tidus in the sheet; the gate registers the painting by its own table and the game draws it by another, and the landmarks hold the key to the first (a head 0.03 from the painted head), so moving it toward where the game draws the painting would fail the gate's marks.
**The tail** still shrinks as a pose starts (0.3 to 0.7 of its length in every key): not changed.

## Pass 2: the gate, verbatim (`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/auron-v2 --art D:/pyrefly-art-r50 --require-coverage`)

```
rig-gate: auron: OK; 11 of 11 key(s) pass; rest overlap 0.994; 230 poses scanned for holes at 18 joints; 15 parts, 21 bones, 5175 vertices, 8.16 Mpx, 8.86 MB; 17.3 s
  ok   idle       idle     iou 0.994  stature 0.999  feet 0.000, -0.001  head 1.000
  ok   attack     standing iou 0.648  stature 0.911 (head to soles)  feet -0.012, -0.003  head 0.896  landmarks 0.013  AUTHORED  (painting turned)
  ok   cast       standing iou 0.546  stature 0.940  feet 0.011, 0.001  head 0.930  landmarks 0.046  AUTHORED
  ok   critical   low      iou 0.620  stature 0.895  feet -0.009, 0.012  head 0.930  landmarks 0.030  AUTHORED
  ok   follow     standing iou 0.519  stature 0.901  feet 0.013, 0.016  head 1.094  landmarks 0.027  AUTHORED
  ok   hurt       standing iou 0.581  stature 0.906  feet 0.013, 0.007  head 0.930  landmarks 0.029  AUTHORED
  ok   item       standing iou 0.494  stature 0.919  feet -0.010, -0.003  head 0.930  landmarks 0.038  AUTHORED  (painting turned)
  ok   ko         ko       iou 0.299  stature 0.411  feet -0.211, -0.025  head 0.900  landmarks 0.030  AUTHORED
  ok   ready      standing iou 0.735  stature 0.910  feet -0.011, 0.012  head 0.900  landmarks 0.019  AUTHORED
  ok   sleep      low      iou 0.418  stature 0.887  feet 0.003, -0.014  head 0.961  landmarks 0.029  AUTHORED
  ok   victory    standing iou 0.457  stature 0.975  feet 0.015, -0.010  head 1.120  landmarks 0.050  AUTHORED  (painting turned)
  format v2 variants (palette distance from the base part, 0 same to 1 nothing in common): armX:cast 0.5, armX:item 0.5, armX:attack 0.5, armX:follow 0.5, armX:ready 0.5, swordX:cast 0.5, swordX:item 0.5, swordX:victory 0.5, swordX:hurt 0.5, swordX:critical 0.5
rig-gate: wrote gate.status ok into D:\pyrefly-art-rigs\auron-v2
rig-gate: PASS
```

`hidden-share` (a key may hide 0.6 of the idle's rest alpha area): 0.096 in every key that hides the glove, sword, scabbard and the arm's pieces, 0.053 in `ko` (the scabbard alone), none in `idle` and `sleep`. `--verify` on a copy named `auron` (the folder must carry its subject's name to ship): "verified: stamp ok (11 key(s), full coverage), 1x tier proved (48 file(s))" (`gate-verify.txt`); the 1x tier is 4.08 Mpx, 2.66 MB. `node tools/pose-gate.mjs --check --rigs D:/pyrefly-art-rigs`: 1,106 paintings, 37 rigged, 0 fail.

## Pass 2: the harness, rig on and off (the whole Sinspawn Gui fight, door word `mushroom`)

Not run in this lane yet. `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` (the r55 deep review) existed from 19:22 and the recorder refuses to start while it does; the recorder was left polling (`--wait`) and the two commands are written down in `.../rig-auron2/run-final.sh`: `node tools/rig/lane/record.mjs --subject auron --out <dir> --modes fight --off --wait --alias auron=auron-v2` (the whole Sinspawn Gui fight at an exact 60 Hz on a virtual clock, seed 1, rig on and, with `--off`, the painting set). Then `lane.py jerks --tracks <dir>/fight/tracks.json --jerks <dir>/fight/jerks.json` classes every tracker jerk.

## Pass 2: the 11 tracker jerks of pass 1 were not the rig's

`lane.py jerks` (new: `tools/rig/lane/lane_jerks.py`) classes each jerk the tracker flags from what the records already carry (the camera's view matrix, the actor's root, the head's world position). Pass 1's 25 head jerks: **23 camera, 1 placement, 1 motion, 0 rig** (`jerks-pass1.json`). Every one of the 11 "rig-only" jerks has the camera's view matrix stepping by 0.9 to 1.4 in that frame and the head's WORLD step at 0.000 to 0.07 (in `idle` the head does not move at all); the two exceptions are frame 22 (the engine puts the actor on the field: its root jumps 0.35) and frame 12100 (a lunge easing out: world steps 0.38, 0.28, 0.21, 0.15). So there was no coat tail drawing in and no blend artefact in the tracker's numbers: a camera step moves every figure on the screen by 25 to 40 px, and the painted run had its own at other frames because the two fights are not the same fight. The tail shrinking at the start of a pose is real, but it is a visible pop, not a tracker jerk (not measured here).

## Pass 2: what changed in the kit (additive; nothing here changes a subject that does not use it)

- `tools/rig/lane/lane-render.mjs`: a key drawn in COLOUR by the gate's own maths (the key's part state, so variants show and hidden parts do not, and the key's `layers`), because the gate draws alpha only and the real game refuses a rig whose gate is not `ok`: a lane fixing a hole could not see its keys. `--skip part,part` finds which part a stray shape belongs to.
- `lane.py jerks` (above) and its test; `record.mjs --off` now also records the painting set for the `fight` mode (the harness's two runs in one command); the registry entry `auron`.
- `rig_fit.py`: `fit.foot_landmarks` (default unchanged). The planted-feet term read the max over every landmark named `feet`, `foot*`, `toe*`, and the root's `feet` never moves, so a key that FLOATED could not be seen (the first follow and critical fits floated 0.09 to 0.1 idle heights and the gate caught it); naming `["toe"]` makes the term see both ways. `rig_export.py`: a key's `layers` from `fit.keys.<pose>.layers`.
- Tests: `tests/unit/tools/rig-subject-auron-v2.test.ts` (6), `test_lane.py` 20 OK (the jerk classes), `test_rig_pipeline.py` 12 OK, `test_rig_v2.py` 10 OK, the 28 rig vitest files 293 passed, `npx tsc --noEmit` clean.

## Pass 2: sheets, files, effort

Sheets for Bailey (the same three as pass 1 plus the KO alone, and a before/after of pass 1, pass 2 and the painting for cast, item, attack and ko): `D:/Tools/pyrefly-scratch/2026-10-18/rig-auron2/for-bailey/auron-rig-1-ko.png`, `-2-attack-hurt-return.png`, `-3-ready-lowhp-asleep.png`, `-4-cast-item-victory.png`, `-5-before-after.png`; the clips behind them in `.../rig-auron2/clips/*.mp4`, the recordings in `.../rig-auron2/rec/`. Colour renders of every key straight from the rig, no game: `.../rig-auron2/render/final-keys/`. Final keys, gate output, specs and the helper scripts: `.../rig-auron2/` (`keys-final.json`, `gate-final.txt`, `specs.json`, `tools/`).

Fits: 28 jobs in 9 batches under ONE folder, `D:/pyrefly-art-rigs-work/auron-v2/lane/a1` to `a9` (3 to 6 minutes each at below-normal priority, under one fit slot), not the 156 scattered folders of pass 1; two were wasted and reverted (a sleep variant whose painted hilt and glove floated off a body that does not stand where the painting's does, and the sleeve cap above). The work folder `D:/pyrefly-art-rigs-work/auron-v2` holds the cut, the build, `fit/keys.json` and the batches.

## Pass 2: what still looks wrong (plainly)

- **It is still the idle's body in every pose.** The coat gathers in a red mass at the shoulders when the spine bends; the poses are better (an orb, a flask, a raised sword over the head, the blade low, a planted sword) and the limbs are real painted limbs, but the torso, head and coat are the idle's, so `cast` and `item` read as Auron in his red coat holding an orb and a flask, not as the painted robe.
- **A small red wedge floats beside the hip in `item` and `follow`** (a smaller one in `cast`): the idle sleeve's lower flap, torn where the arm is bent and scaled (the sleeve scales 1.7 and the forearm inherits it). Hiding the sleeve's hand zone, a wider skin ramp and a forearm scale cap shrank it; none removed it, and capping the whole sleeve at 1.4 (a9, reverted) left a gap between the sleeve and the flask. Cutting the flap off the `armR` part and re-fitting the arm poses is the fix.
- **The attack blade is thin** (the painted blade narrows to a few pixels in the middle and the 1x tier halves it again) and lies on the other side of the figure from the painting because the painting is turned for the rig; the red hood above the head is the painted sleeve and reads as a hat. The budget has 140 KB of PNG left, so the attack variant could not be made sharper.
- **Variants swap in at half of the move** (the format's rule, no fade yet): the orb, the flask and the blade appear at once in the middle of the blend. The blends were looked at for `cast` only: no hole, no tear.
- **`sleep` and `ko` have no variant.** `sleep` is pass 1's key with the idle's sword (a stub now that the grey blade is gone) and the idle's scabbard; `ko` has the idle's sword in the hand. A first sleep variant floated off the body and was reverted.
- **Thin margins**: `cast` worst landmark 0.046 and `victory` 0.050 against the 0.06 bar (`attack` head 0.896 and `ready` head 0.900 against 0.85 now have room); the marks are by eye. Texels 8.16 of 9.0 Mpx and PNG 8.86 of 9.0 MB: one more variant needs a smaller one, or the base parts re-encoded.
- The far leg is still a stand-in (darker, not a leg); `follow` and `ready` have both legs bent and the figure reads as hopping.
