# Rig format v2 and the lane kit (branch `rig-v2`, from `origin/rig` 59c766ec0, 2026-10-18)

Bailey, 2026-10-18: "We need this done for all characters and bosses. It's a priority." The driver adopted the rig plan (`D:/Tools/pyrefly-scratch/2026-10-18/rig-plan/plan.md`, decision 123); its first step is a reusable
**lane kit** and an **additive format v2**, so every later rig is cheaper. **Game case: both games, shared plumbing** (a figure is FFX or FFX-2 by its art id; nothing here knows the difference). The one subject it
touches by name is Lulu (FFX only), in a NEW rig folder. Paper preflight (AGENTS rule 15): [docs/plans/rig-v2-review.md](../plans/rig-v2-review.md). Contract entry: [CONTRACT-CHANGES](../CONTRACT-CHANGES.md) 2026-10-18 "The rig, format v2".

**State: built, tested, on branch `rig-v2` (pushed). Not merged into `rig`, not deployed, no review run.** The rig stack on `rig` is unmerged and unreviewed; v2 rides in the one focused and one deep review the rig release owes anyway.
Nothing was written into `public/art`, `D:/pyrefly-art-r50`, the existing `D:/pyrefly-art-rigs/{kimahri,lulu}`, the release tree or `M:/pyrefly-r395-port`; Auron's lane (`M:/pyrefly-rig`, branch `rig`) was not touched.

## 1. Format v2 as built

```ts
// src/data/art/rigTypes.ts (additive; RIG_VERSION = 2, RIG_VERSIONS = [1, 2], RigFile.version: 1 | 2)
interface RigPart        { /* v1 */ hidden?: boolean; variants?: Record<string, RigPartVariant> }
interface RigPartVariant { png: string; rim?: string; rimEverywhere?: boolean;               // another image of the SAME part
                           box?; verts?; uvs?; triangles?; bone?; bones?; weights? }          //   with none of these: the part's mesh and skin; with any: its own (rigid on the part's bone if it names no skin)
interface RigKeyPart     { show?: boolean; image?: string }                                    // naming a part shows it unless show is false; image = a variant's name
interface RigKey         { /* v1 */ parts?: Record<string, RigKeyPart> }                       // the idle names none
```

- **State = a pure function of the key and the file** (no inheritance): a part the key does not name is in its default (shown, own image; hidden if `hidden`). It flips at **progress 0.5 of the move into the key**, where `layers` flips.
  `RigPartState.ts` (runtime) and `tools/rig/rig-pose.mjs#keyState/stateAt` (gate) are the same function; `tests/unit/rig/rig-v2-agree.test.ts` feeds both the same vectors for every key and every pair of keys at 25 steps from 0 to 1, either side of 0.5.
- **Runtime.** `RigMesh.ts` (new: the mesh reader, shared by a part and a variant), `RigPartState.ts` (new), `RigData` (`version`, `hidden`, `variants`; v2 fields in a v1 file refused; a hidden part no key shows refused as dead data), `RigFigure` (a LOOK a part: image, mesh, textures; `setPartState`; `skin()` skips hidden parts, so a hidden part costs nothing per frame; a variant with the part's mesh shares its geometry), `RigActor.compose` (`partStateAt(from, to, progress)`; a mid-move retarget keeps what is on the parts until the new move is half way), `RigTier.tierPartsOf` (every variant's textures budgeted, key `<part>:<variant>`; v2.0 loads them all eagerly).
- **Gate.** The raster, the hole scan, the silhouettes and the stamp read each key in its state. A joint is watched in a pose only if a part that is **shown at rest** and meets there is shown in that pose (see the preflight's "as built": the paper's looser wording made 14 false `hole-blend`s on Lulu); a blend uses the state the move is in, and at exactly 50 percent both directions are scanned when two keys differ in state. New rules (`rig-variants.mjs`): `hidden-share` (a key may hide at most 0.6 of the idle's rest alpha area), `part-never-shown`, `variant-unused`, `variant-missing`; the budget counts every variant's texels, bytes and (own mesh) vertices; `gate.textures` lists `<part>:<variant>`; the digest binds the variant PNGs; the 1x tier, the folder listing, `art-install`, the mirror and `tools/gen/manifest.mjs#rigTiers` know variants. **A report, not a refusal:** each variant's palette distance from its part (`result.variants`, printed by `rig-gate`, in the key table).
- **Pipeline.** `rig_v2.py`; config `build.hidden`, `build.variants`, `fit.keys.<pose>.show|hide|image`, `keys_extra.<pose>.parts`; the fitter (`rig_skin.RigModel.set_state`) draws a pose in its state while it scores; the exporter writes `version: 2` exactly when a v2 field is used. `from_painting` is built as its pure core only (`soft_cut`, `placement`); the cut itself is still `lulu_hooks.py#_front_part` (the first subject that needs it writes the glue). `fadeMs` and lazy variant loading are not built (the paper's v2.1).

### Proof that every v1 rig is valid and draws as before

1. `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/{kimahri,lulu} --verify --art D:/pyrefly-art-r50`: **PASS** for both (stamp ok, 13 keys, full coverage, 1x tier proved), after the change.
2. The FULL gate (`--check`, nothing written) on both: every key's overlap, stature, head, landmark error and feet, the 247 poses scanned at 27 (Kimahri) and 9 (Lulu) joints, the size and the digest are **identical** to the reports of the lanes that stamped them (`rig-kimahri/gate-report.json`, `rig-lulu-pass2/gate-report.json`): no diff.
3. **Exact, no GPU:** `tests/unit/rig/rig-v1-unchanged.test.ts` poses a fresh `RigActor` on each of the 26 keys of the two real rigs, runs 360 frames, and hashes everything the rig hands the GPU (every part mesh's skinned positions as float bits, depth, visibility, in draw order). The golden (`tests/fixtures/rig/v1-geometry-golden.json`) was written by the SAME test run on the engine before v2 (a detached worktree of 59c766ec0); the new engine matches all 26.
4. **Headless, real GPU, the real game** (`D:/Tools/pyrefly-scratch/2026-10-18/rig-v2/rec/`, the kit's own recorder and `lane.py framediff`; 1600 x 900, the virtual 60 Hz clock, seed 1, rig on, idle held still): the old engine (59c766ec0) and the new, the same poses, 130 frames a pose, mean absolute channel difference inside the figure's rectangle; a second run of the OLD engine against itself is the floor (the scene has ambient grain that moves from run to run):

   | frames 100 to 129 (the pose settled) | old vs new | old vs old (floor) |
   |---|---|---|
   | Lulu defend | 1.749 | 1.755 |
   | Lulu ko | 1.340 | 1.338 |
   | Lulu attack, od-fury (no second old run) | 3.428, 1.729 | - |
   | Kimahri attack / hurt / ko | 4.259 / 3.393 / 3.088 | 4.419 / 3.998 / 2.899 |

   Over all 130 frames (the moves included, where the page's frame callbacks land a frame earlier or later from run to run) the numbers are 1.7 to 4.6 against floors of 1.6 to 4.4 (`framediff-*-still.txt`); `framediff` says SAME WITHIN THE RUN-TO-RUN FLOOR for both. A browser run is not frame-exact against itself, which is why the exact proof is item 3. (The hash `rig-signature.json` the recorder writes per frame reads IDENTICAL only on a run with no timing slip; it is kept as a tool, not as a verdict.)

## 2. Lulu's front views as v2: `D:/pyrefly-art-rigs/lulu-v2` (a NEW folder; `lulu` v1 is untouched, release 55 ships it)

`node tools/rig/subjects/lulu-v2-from-v1.mjs --from D:/pyrefly-art-rigs/lulu --to D:/pyrefly-art-rigs/lulu-v2 [--fit-claims <gate json>]`, then `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --art D:/pyrefly-art-r50`, `node tools/rig-tiers.mjs write --rig ...`.
The two speck parts `fdef` and `fod` (a mesh a sixteenth the size on a chain of two bones each, scaled 16 times and layered by the key) become **one hidden part `front`** (defend's image; Overdrive's is its variant `od-fury`, with a mesh and a box of its own), both rigid on `root`
and carrying the REAL vertices, computed from the v1 rig itself (the new part, skinned through each key, lands where the speck chain put the old one to 0.1 px: `rig-lulu-v2.test.ts`). The keys `defend` and `od-fury` show `front` and **hide** the side head, collar, hanging arm, braid and doll
instead of shrinking and layering them; the four chain bones, the shell scales, the swings and the `layers` are gone (21 bones against 25, 10 parts against 11). The back arm on her hip stays, behind the front part, as in v1: hiding it too opened a 23 px hole at its joint 75 percent of the way into od-fury, which the gate caught.

- **Gate: OK, 13 of 13 keys, full coverage, 270 poses scanned for holes at 9 joints (247 in v1: the extra are the 50 percent scans in both directions), no hole.** defend overlap **0.617** (v1 0.615), od-fury **0.699** (0.695); every other key is v1's byte for byte (same overlaps). The two front keys hide 0.275 of the idle's rest figure each (the cap is 0.6). The variant's palette distance from `front` is 0.372 (a different costume's pixels: said, not refused). `--verify` PASSES on a copy named `lulu` (the folder must be named for its subject to ship).
- **The real engine draws it:** the recorder served it as `lulu` (`--alias lulu=lulu-v2`): `[rig] lulu on (gate ok, 10 parts, 21 bones, 13 keys, 1x maps)`, the only console errors the 404s of figures that have no rig.
- **Before/after sheet** (the kit's `lane.py sheets`, Lulu's pass-2 labels and layout; old rig | new rig | the painting the game draws, in the real game): `D:/Tools/pyrefly-scratch/2026-10-18/rig-v2/for-bailey/lulu-rig-4-before-after.png`, with `lulu-rig-1-defend-overdrive-ko.png` and `lulu-rig-2-attack-hurt-return.png`; the clips behind them `clips-v2/*.mp4` (v2) and `clips-v1/*.mp4` (v1), 60 fps. Defend, Overdrive, KO and attack read the same in both rigs (same pixels in the same places: that was the point); what changes is the file: no hack, no hidden-by-shrinking, a hole test that no longer watches joints under a hidden part.
- Not decided here: the mixed-costume policy (plan section 6, item 1). The variant is Lulu's defend and od-fury upper body over the idle's skirt, as v1 already was.

## 3. The lane kit: `tools/rig/lane/` (README.md has every command and one end-to-end example)

```
node tools/rig/lane/record.mjs --subject <id> --out <dir> --modes poses,cast,hurtko,fight [--poses a,b] [--off] [--still] [--alias <id>=<folder>] [--repo <tree>]   the recorder (below)
lane.py new <name> --preset humanoid-side|creature-quadruped|creature-winged     scaffold tools/rig/subjects/<name>.json from the paintings (a run through cut and build was checked on Tidus)
lane.py fit --subject S [--poses all|a,b] [--seeds 3] [--procs 8] [--tag T]      the sweep: a batch a pose and seed, parallel, below-normal priority, under one of TWO fit slots (D:/Tools/pyrefly-scratch/RIG-FIT-SLOTS)
lane.py select --subject S --tag T [--write]                                     candidate i of every pose -> one rig -> the gate; the best a pose (clean, highest overlap); claims rewritten to the gate's readings; merge; the table
lane.py eval --subject S --keys K.json [--full]                                  export a keys file and gate it (the old evalrig/gaterun)
lane.py keytable | clips | sheets | report                                       the per-key table, the clips (rig beside painting), the sheets for Bailey (+ before/after), the handoff skeleton
lane.py twin <name> --of <rigged config> [--subject ID] [--run]                  a silhouette twin: the config and keys carried over (claims dropped), cut + build + export; the gate re-measures
lane.py framediff --a DIR --b DIR [--floor DIR] [--from FRAME]                   compare two recordings (the proof above)
```

The recorder (`record.mjs`) replaces `record.sh`, `lulu-moment.mjs`, `fight-virtual-lulu.mjs`, `trk-lulu.mjs`, `hurtko-real.mjs`, `strike-frames.mjs`, `poses-clip.mjs` and `warm.mjs`: refuses while `REVIEW-BROWSER` exists (`--wait` polls), waits on `GPU-QUIET`, one `RIG-RECORD` lock (a dead pid's is taken over), a free port, a scratch Vite config removed on exit, Vite warmed with one long page load,
each mode retried once, **Vite stopped by PID** on a normal end, an error and a signal (checked after the 16 recordings of this lane: no Vite process, port, scratch config or lock left behind). The subject registry is `lane-subjects.json` (Kimahri and Lulu; `lane.py new` prints the entry to add; the door word and chapter id come from the chapter registry).
The tracker (`track.mjs`: head, feet, pelvis, hand, tip through the live camera, the critic's CHK-027 detector over them) is the standing harness for rigs, because the CHK-026/027 probe reads painted-plane pixels and passes vacuously for a rig. `cast` needs the subject's `castKeys`; `fight` attaches the critic's continuity probe when the tree has it (written, not run in this lane: its 6 minutes of virtual time belong to a subject lane).
**The kit reproduces Lulu's gate result from her config and keys** (the plan's bar): `lane.py eval --subject lulu --keys D:/pyrefly-art-rigs-work/lulu/fit/keys.json --full` exports the 13 keys through the real pipeline (hooks and all) with her `build/` and gates them: OK, 13 of 13, the same table as pass 2 (attack 0.755, cast 0.755, item 0.783, victory 0.769, defend 0.615, od-fury 0.695, ko 0.256 ...), 247 poses, no hole (`lulu-eval/table.txt`).
**Not built:** the harness mode was not exercised end to end here (`cast`, `hurtko`, `fight` are ported line for line from Lulu's scripts; `poses` ran 16 times, on two trees and three rigs). `lane.py fit` and `twin --run` ran only as their pure parts and `--dry` (the unit tests use a fake gate): the first subject lane runs them for real. Keep `--procs` at 8 or below (the slot is 8 processes).

## 4. Tests and checks

| | result |
|---|---|
| `npx tsc --noEmit` | clean |
| rig vitest files (`tests/unit/rig`, `tests/unit/tools/rig-*`) | **26 files, 276 tests, all pass** (199 across 18 files on `rig` before; 77 new) |
| the new files | `rig-v2-data` (18), `rig-v2-agree` (4), `rig-v2-actor` (8), `rig-v1-unchanged` (2), `rig-v2-gate` (13), `rig-lulu-v2` (5), `rig-lane` (12) |
| Python | `tools/rig/test_rig_pipeline.py` 12 OK, `tools/rig/test_rig_v2.py` 10 OK, `tools/rig/lane/test_lane.py` 19 OK |
| full unit suite (`npx vitest run`, TEMP on D:/Tools/pyrefly-scratch/tmp-rig-v2) | 1,382 files, 21,918 tests, run while the recorder was using the GPU: **14 files (33 tests) failed, all but one of them by the 15 to 300 second timeouts of the heavy advisor, census and chapter suites under that load**; the 14 re-run alone: 12 pass; `ui-ffx2-atbmode` passes alone (10 s of its 15 s); **`entrance-census` fails 3 tests (seymour-anima-macalania, sinspawn-gui, ffx2-angra-mainyu: "is not whole on its first frame") and fails the same 3 on `origin/rig` 59c766ec0**, so it is not this change's. Everything else is green. |
| `node tools/orphans.mjs` | 26 orphaned, the same 26 as on `origin/rig` (the two new modules are reachable) |
| `node tools/critic-plan.mjs --paths <changed files>` | **DEEP** ("src/data/art/rigTypes.ts: unclassified product path is a shared system", "tools/gen/manifest.mjs: asset loader and manifests is a shared system"; focused before deploy, live verification and the deep review after; obligations live + focused + deep; checks CHK-008 012 013 016-022 026 027) |

One assertion changed on purpose: `rig-data.test.ts` now refuses version 3, not 2. `rig-fixture.ts` says `version: 1` (it imported the constant).

## 5. Estimated saving per subject (estimates, from the plan's cost model; none is a measurement of a lane I did not see)

- **Kit:** 0.3 to 0.45M tokens and 3 to 4 hours per humanoid (the recording and sheets were 15 to 20 percent of Lulu's cost; 103 fit batches and 14 rounds of hand-merging become `fit` + `select`; 3,912 lines of copied scratch become a 6-line registry entry). A silhouette twin: 0.05 to 0.1M becomes 0.03 to 0.06M and under half an hour. Measured here: the recorder ran 16 times unchanged for two subjects and two trees; a scaffolded config cuts and builds first time.
- **Format v2:** 0.2 to 0.3M tokens and 2 to 3 hours per subject with a front view or a costume swap (about 30 of the 146). Measured here: converting Lulu's speck design took one converter (about 150 lines) and two 25-second gate runs, no refit; pass 2's speck design and its three refused attempts were about 40 percent of that pass.
- Kit and v2 together are the plan's 63M to about 35M, plus the one-off 2.0M these two cost; re-fit the table to Auron's real cost when it ends.

## 6. Files

New: `src/engine/rig/RigMesh.ts`, `RigPartState.ts`; `tools/rig/rig-variants.mjs` (+ `.d.mts` for it, `rig-format`, `rig-pose`, `rig-holes`), `tools/rig/rig_v2.py`, `tools/rig/test_rig_v2.py`, `tools/rig/lane/*` (the kit), `tools/rig/subjects/lulu-v2-from-v1.mjs` (+ `.d.mts`), `docs/plans/rig-v2-review.md`, this file, the tests above and `tests/fixtures/rig/v1-geometry-golden.json`.
Changed: `src/data/art/rigTypes.ts`, `src/engine/rig/{RigActor,RigData,RigFigure,RigSkeleton,RigTier}.ts`, `tools/rig/{rig-format,rig-gate-lib,rig-holes,rig-install,rig-pose,rig-raster,rig-tiers}.mjs`, `tools/gen/manifest.mjs`, `tools/rig-gate.mjs` (one print line), `tools/rig/rig_{build,export,fit,skin}.py`, `docs/CONTRACT-CHANGES.md`, `docs/handoff/rig-{engine,pipeline,lulu}.md`.
Scratch (not committed): `D:/Tools/pyrefly-scratch/2026-10-18/rig-v2/` (recordings, reports, clips, sheets, the old-engine worktree is `D:/pyrefly-rig-v2-old`, read only).
