# r74-lulu: Lulu's rig head was a real 5 to 15 percent change between poses; the engine now holds it at the idle's size (PR-0534, 2026-11-02)

**Game case (rule 14): FFX only.** Lulu is an FFX figure; the one rig the change reaches is `lulu` (`RIG_HEAD_HOLD` lists no other). It is **not** "both": FFX-2 has no Lulu, and the rigs FFX-2 shares or owns (Valefor in Besaid, FFX-2's Bahamut in Chapter IV) compile to the very same channels with the lock on and off (`tests/unit/rig/rig-head-hold.test.ts`, last test). **Chapters I (Seymour Flux, body rig) and IV (FFX-2 Bahamut) are unchanged by construction**, not by a lucky run: their rigs are not in the table, and no Lulu swap was recorded in either in round 33b.

Branch `r74-lulu` on `origin/r73-int` `d5049f686`. Lane of the r74 batch (brief: PR-0534, "find whether Lulu's rig head is mis-registered or the harness reads it wrongly; fix the cause, never a painting; prove the recorded head swaps fall under the 3 percent tolerance offline").

## 1. The cause (neither of the two the brief offered)

**The harness reads the rig head exactly. The rig draws the head at different sizes in different keys.** Run on round 33b's recorded data (`critic/rounds/round-33/continuity/<chapter>/continuity/continuity.json`, read only; harness `5e1bbdec47c9`):

- Lulu's rig swaps: 568 recorded in six chapters, **508 counted, 397 over 3 percent** (Mirror Aeons 164, Sin core 113, Sin face 46, Braska 42, Evrae 19, Yojimbo 13: the round's 397 of 415, to the unit). Worst 19.7 percent, smallest failure 3.1.
- The five other shipped rigs on the same run: Bahamut 0.7 percent worst, Seymour's body 0.5, Ifrit, Valefor, Pterya and the possessed ones 0.0, **0 head failures**. Only Lulu drifts. Painted figures' 18 other head failures are Braska/Flux (PR-0584, not this lane).
- The harness's number (the skinned area of the `head` part, square-rooted) is **the engine's own**: posing the installed `rig.json` through `RigSkeleton` reproduces the recorded ratio to four places for every pair seen often (cast to idle 0.9119, ready to cast 1.1543, idle to ready 0.9500, idle to ko 0.8800, ko to critical 1.1958 ...; 488 of the 506 mesh-read counted swaps equal the key-to-key ratio to 0.0006; the other 18 (six small pairs) were read before the figure had settled out of an earlier move).
- Why the head moves: the head part is skinned to one shell bone, `headS`, which hangs under `head`, `chest` and **`spine`**. The fitter scales her spine (limit 0.95 to 1.1, to reach each painting's stature; `tools/rig/subjects/lulu.json` `fit.scales`), and the head part inherits it. The head bone's own scale is 1 in every key, as the fit config says; nothing in the pipeline looks at the *inherited* one.

| key | head part over the idle's, as drawn | with the lock |
|---|---|---|
| attack | 1.0123 | 1.0000 |
| cast, item | 1.0966, 1.0968 | 1.0000 |
| critical | 1.0523 | 1.0000 |
| hurt | 1.0076 | 1.0000 |
| victory, ready | 0.9502, 0.9500 | 1.0000 |
| follow, sleep | 0.9860, 0.9696 | 1.0000 |
| ko | 0.8800 (root 0.8 times head bone 1.1) | 1.0000 |
| defend, od-fury | 0.8000 (the side head tucked behind a front-view upper body; the harness reads these as a variant, not by the mesh) | 0.8000, left as the file has it |

- Why the gate never saw it: the rig gate's band for a real head is 0.85 to 1.15, CHK-026's is 3 percent between two keys, and the gate reads the head *bone's* scale, which is the spine's inherited scale only where a person looks (it printed `head 1.097` for cast all along). `critic/CHECKS.md` and `continuity-rig.mjs` both said "the rig's gate keeps the head at 1.0000": **false**, corrected in CHECKS.md (the comment in `continuity-rig.mjs` is left: editing a runner file changes the harness identity `5e1bbdec47c9` mid-release; one comment line, for the next time the file is touched).
- Is it visible? Honestly: a little. Ready to cast grows the head 15 percent in about 120 ms while an arm and a staff move; the strips (rounds 31 to 33b) showed no jump and the check's 3 percent is Bailey's own standard for it (D-420). The painted game would show this pose at 0.974 of the idle's head (`docs/target/pose-measure.json`, Lulu cast `ruled.headRatio`); the rig showed 1.097.

## 2. Why the fix is in the engine and not in the rig file

The right layer is the rig data (the head shell bone gets the inverse of the spine's scale in each key). I built it, gated it and it is **not installable today**: Lulu's rig is refused by the full rig gate *as it stands, before any change of mine*, for four reasons that have nothing to do with the head:

| refusal (same on the installed rig and on the held candidate) | installed | held |
|---|---|---|
| `lulu/attack key-iou` overlap with the painting under 0.75 | 0.742 | 0.740 |
| `lulu/defend key-fit-stale` (claims 0.615, the gate reads) | 0.669 | 0.669 |
| `lulu/od-fury key-fit-stale` (claims 0.695) | 0.622 | 0.622 |
| `lulu/sleep key-landmark` head 0.068 of the idle's height from the painting's, limit 0.06 | 0.068 | 0.068 |

(`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu --art D:/pyrefly-art-r50 --check`, and against `D:/pyrefly-art-r64`: identical.) The rig was stamped `ok` on 2026-10-18; the pose table moved after it (the W3 sizing rule re-scaled the paintings the keys are held against); the deploy only runs `--verify` (the stamp's digest and coverage), so the stale stamp ships, but **any new content needs a new stamp and `planRigInstall` runs the full gate**. So a refit or re-install of Lulu is blocked until those four are cleared (claims: `--fit-claims`; attack: authored or refit; sleep: refit the head; none is this lane's call). The candidate (a copy of the rig with the shell bone's inverse scale in 10 keys) otherwise passes: 247 poses scanned for holes at 9 joints, none; overlap changes at most 0.006 except the KO's 0.010 (cast 0.754 to 0.756 and critical rise: the painting's head is smaller than the rig's was), no new refusal. That is evidence the same transform has no hole and costs no overlap; the candidate itself stays in scratch.

So the lock is applied **where the keys are compiled** (`src/engine/rig/RigHeadHold.ts`, called from `compileKeys` in `RigKeys.ts`): for a rig named in `RIG_HEAD_HOLD` (`lulu: 'head'`), each key's channels get the shell bone's scale set to the inverse of the scale it inherits, so the head part is drawn at 1.0000. It leaves alone the idle, a key that hides the part (v2), a key that already scales the shell itself (the two front-view keys) and a part not rigid on one bone. It is the rig counterpart of the painted head lock (D-420), keyed by rig name, and it composes with a later refit: a file that carries the counter-scale in its own keys is skipped as `explicit`. It needs no art install and no new stamp (the digest is the file's, unchanged). Blends: head within 1.46 percent of the idle's at the worst point of any move between two keys (item to ko, half way), so even a swap read with both ends mid-move is under 3 percent (2.96).

## 3. Proof, offline

| what | before | with the lock |
|---|---|---|
| Round 33b's recorded Lulu rig swaps, key pairs through the engine's skeleton (`rig-head-hold.test.ts`) | 403 of 506 mesh-read swaps over 3 percent (recorded: 397 of 508 counted); worst 19.75 | **0 over; worst 0.00000** |
| The real `RigActor` + probe + `analyzeRun`, every key of the shipped `rig.json` out and back (`critic-continuity-rig-real.test.ts`, new case) | 14 of 20 mesh-read swaps fail CHK-026 head; worst 13.64 (ko to idle) | **0 of 20; worst 0.0000**; failHeight 0 both ways; defend and od-fury still read as variants (0.959 and 1.029, unchanged) |
| Negative control | the new case fails with the table emptied: `idle > attack: expected 1.0123 to be less than 1.01` | |
| Other rigs (Ifrit, Valefor, Pterya, FFX-2 Bahamut, Seymour's body, Tidus, Rikku) | | compile to identical channels on and off |
| `tests/unit/rig/rig-v1-unchanged.test.ts` (the GPU-geometry golden) | | Lulu's entry re-pinned: 10 of her 13 hashes moved (all but idle, defend, od-fury), Kimahri's untouched |

`npx tsc --noEmit` clean. Suites: see section 7.

## 4. What changed

| file | change |
|---|---|
| `src/engine/rig/RigHeadHold.ts` (new, 80 lines) | `RIG_HEAD_HOLD`, `shellBoneOf`, `holdPartSize` |
| `src/engine/rig/RigKeys.ts` | `compileKeys(data, hold = true)` calls it for a listed rig |
| `tests/unit/rig/rig-head-hold.test.ts` (new, 9 tests), `tests/fixtures/rig/lulu-recorded-head-swaps.json` (new: the 508 counted recorded swaps as 29 pairs) | the rule, the recorded replay, the other rigs |
| `tests/unit/critic-continuity-rig-real.test.ts` | the new real-engine case; the Lulu block no longer needs Kimahri's rig on disk (`describe.skipIf` on Lulu alone, the Kimahri case `it.skipIf` its own), so the existing Lulu variant case runs here too |
| `tests/unit/rig/rig-v1-unchanged.test.ts`, `tests/fixtures/rig/v1-geometry-golden.json` | Lulu's entry re-pinned on purpose (comment in the test) |
| `critic/CHECKS.md` | the false "gate keeps the head at 1.0000" sentence corrected |

No painting, no art mirror, no `rig.json`, no runner file and no policy was written. `critic/runner/lib/*` is untouched: `node tools/continuity-id.mjs` still prints `5e1bbdec47c9`. No shared contract (`docs/CONTRACTS.md`) is touched. Ledgers (`DECISIONS.md`, `ACTIONS.md`) are the driver's to extend.

## 5. Job specs (no browser was run; rule 15), with predictions

- **J-1 (continuity harness, GPU, headless Playwright from node, one browser at a time; the lane's build; chapters `mirror-aeons`, `sin-fins-core`, `sin-face`, `evrae-airship`, `yojimbo-cavern`, `braskas-final-aeon`, seed 1, 1600x900, `PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir> --chapters=<ids>`).** Prediction: Lulu's counted head failures **397 to 0** (Mirror Aeons 164, Sin core 113, Sin face 46, Braska 42, Evrae 19, Yojimbo 13, each to 0); `size.maxHeadJumpPctRig` from 19.7 to under 1.5; Evrae, Yojimbo, Sin core, Sin face and Mirror Aeons leave CHK-026 FAIL **if they have no other reason** (round 33b says they have none; a swap read mid-move can still show 1 to 3 percent, never 3); Braska stays FAIL on PR-0584. Falsified if any Lulu rig swap reads over 3 percent: then a key or a view (a v2 file, the `?motion=demo` ghost) draws the head by a path the lock does not reach. CHK-027, height and feet of her rig: predicted unchanged to the pixel (the lock moves only the head part and the braid that hangs from it).
- **J-2 (control, same run, Chapters I and IV: `seymour-flux`, `ffx2-bahamut`).** Prediction: every rig and painted head, feet, height and jerk number equal to round 33b's within the run's noise (the rigs are deterministic from their files, so the rig head ratios are identical: 0.5 percent and 0.7 percent worst). A change there would mean the table leaked.
- **J-3 (Bailey, a motion clip; rigs are judged in motion).** Lulu in Mirror Aeons (or Sinspawn Gui): ready, cast, back to idle, a hit, the KO, with the lock and without, 1600x900, 60 fps, same seed. Prediction of what is seen: at cast the head is 8.8 percent smaller than before (the staff arm and the spine stretch are unchanged), at ready and victory 5 percent larger, at the KO 13.6 percent larger on the 0.8-scale body (the painted KO is a life-size head on a cropped body; this is closer to it), the braid follows the head: 9 percent shorter at cast and item, 5 percent longer at ready and victory. Falsified if the head looks pinned or the neck shows a gap at cast: then the hole test missed a joint disc at that pose (the candidate's did not: 247 poses, none).

## 6. Open questions (the driver decides; nothing here was asked of Bailey)

1. **Land the lock?** It is a visible change to a rig Bailey has seen (Lulu's head stops pulsing; the KO head is bigger). The alternative is the data route (section 2), blocked until the four gate refusals are cleared. Recommendation: land it, show J-3 to Bailey with the release.
2. **Clear the four gate refusals** (a separate rig lane): refresh the `fit` claims of defend and od-fury (`tools/rig/subjects/lulu-v2-from-v1.mjs --fit-claims` does the same for v2), decide attack (`authored` or refit, 0.742 against 0.75), refit sleep's head (0.068 against 0.06). Without it no Lulu content change can be installed.
3. **Stale stamps ship.** The deploy verifies a rig's stamp digest, not the full gate, so a rig whose registration moved after its stamp keeps shipping `ok`. Should the deploy (or `pose-gate --check --rigs`) re-run the full gate? It would refuse Lulu today.
4. **Gate band against the check.** The gate's real-head band (0.85 to 1.15) is wider than CHK-026's 3 percent between keys; a gate rule "the head part's drawn size is within 3 percent of the idle's in every key" would have refused Lulu in October. It would also refuse any rig like hers; Kimahri's rig (not on this disk's `public/art/rigs`; R59 recorded up to 16 percent on its meshes) is the other candidate. Not added: it changes the deploy gate (`tools/posescale/pose-bands.mjs`, shared).
5. **Kimahri.** Not in `RIG_HEAD_HOLD`: its rig is not installed here and no round-33 chapter drew it. If it is installed, run `rig-head-hold`-style numbers first (the test file's `headSize` reads any rig) and add it to the table with its own recorded swaps.

## 7. Suites

`npx tsc --noEmit` clean. The rig engine, continuity harness and rig tool suites (`tests/unit/rig`, `tests/unit/critic-continuity*`, `tests/unit/tools/rig-subject-lulu`, `rig-lulu-v2`, `rig-gate`, `rig-ship`): **54 files, 749 passed, 1 skipped (Kimahri's real-rig case: its rig is not on this disk), 0 failed**, after the one failure the change caused on purpose (the v1 geometry golden, re-pinned for Lulu only, section 3). `node tools/orphans.mjs`: `RigHeadHold` is imported (not an orphan); the two listed are older. The 47 other test files that import the rig engine, read `critic/CHECKS.md` or scan the handoff folder (plus the local-path guard and `critic-instruments-wiring`): **47 passed, 587 tests passed, 1 skipped, 0 failed**. So **101 files, 1,336 tests passed, 2 skipped, 0 failed** on the affected set. **The whole suite was NOT completed in this lane**: two attempts (`vitest run --maxWorkers=3`, with the focused review of release 73 loading the machine) hit their own limits at 28 and 56 minutes with no failure printed and no summary (exit 124); the driver's integration run is the full-suite gate for the merge. Run it as `npx vitest run --maxWorkers=3 --testTimeout=60000 --hookTimeout=60000` with a JSON reporter (`--reporter=json --outputFile=<file>`) so a timeout leaves something.

## 8. CHANGELOG lines (game tags; for the release that takes this branch)

- **FFX:** Lulu's head stays the same size from pose to pose: it grew by up to a tenth when she cast and shrank by a tenth when she was knocked out, because her upper body stretches to match each pose and her head stretched with it. Her body keeps its stretch; only the head (and her braid, which hangs from it) holds still.
- **FFX-2:** nothing changes (no Lulu; Valefor's and Bahamut's rigs compile to the same poses as before).

Scratch (not committed): `D:/Tools/pyrefly-scratch/2026-11-02/r74-lulu/` (`lulu-swaps.mjs`/`.json` the 568 recorded swaps, `head-probe.mjs`, `make-fixture.mjs`, `lulu-held-a/` the gated candidate rig and `gate-a.log`/`gate-a.json`/`gate-orig*.json` the gate runs, `replay-free.json`/`replay-held.json` the real-engine replays, `rig-head-hold.mjs.keep` the data-route tool that was written and not committed).
