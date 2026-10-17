# Pose continuity: the permanent fix (branch `pose-gate`, 2026-10-16 to 17)

Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please." (and, on Lulu's hurt, "lulu looks tiny when hurt - this problem again? ugh").
Branch `pose-gate`, from `origin/r50-release` 6b638df95 (the r50.1 tree, art r50). **Not merged, not deployed, no review run.** Paper preflight and findings:
`D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/` (`plan.md`, `angle1-art.md`, `angle2-runtime.md`, `angle3-process.md`); the plan's copy in the repo is `docs/plans/pose-continuity-review.md`.
Contracts: `docs/CONTRACT-CHANGES.md`, the four entries of 2026-10-16 and 2026-10-17. Game case: **plumbing for both games; the Lady Luck repair FFX-2 only; the Dark Aeons FFX only.**

## Why it kept coming back

Nobody owned the contract "one figure, one size, one pair of feet in every painting". Generation checked the cutout, install was 17 scratch scripts that registered nothing, deploy checked bytes,
the one pose check saw only subjects already measured, CHK-026 read the engine's own table and so passed by construction, and the engine corrected each pose with one scalar, which matches one
length (the head after D-420, the height after r50.1). On r50: 205 of 622 game poses broke a band, 105 had no row, five Lady Luck rows planted the figure at the knees (drawn at 0.43 to 0.49), the
Dark Aeons had no stance (239 swaps over the feet line, FOC501-01), and the owner override cleared 24 of 25 deploys.

## What was built (the approved scope: W0, W1, W2, W4 and the PoseBlend bug fix; W3 and W5 are options only; W6 is untouched)

| Part | What | Where |
|---|---|---|
| One model | One reading of a painting the way the game draws it (class, stature, real head, KO length, overlap, feet, mass, head-box position), shared by the gate, the census and the critic; the bands in one file | `tools/posescale/pose-{model,geometry,pixels,kinds,bands,rows,hires}.mjs` |
| The row | Every registered painting's row carries `status` (`ok`, `held`, `waived`, `blocked`), `class`, `stature`, `headReal`, `lengthRatio`, `iou`, `sha`; written by the install from the pixels (`measure.py table`, last step `pose-stamp.mjs`); `waived` only from the ledger | `src/data/art/poseRegistration*.ts` |
| The gate | `node tools/pose-gate.mjs --check`: a shipped character painting needs a fresh `ok`/`held` row (sha matches, stored numbers equal a recompute from the pixels) or a waiver | `tools/pose-gate{,-lib,-ledger}.mjs` |
| The installer | `tools/art-install.mjs` is the install path: refuses hard-linked folders, copies, registers, gates; `hires-install` and `gui-art-install` end in the same gate | `tools/art-install{,-lib}.mjs` |
| The deploy | The gate runs before the build on `public/art` and after it on the built art list (which also proves each master is still the file the gate read); `--owner-override` and `--skip-tests` do not reach it | `tools/deploy-pages.mjs` |
| The ledger | `docs/target/pose-waivers.json`: one row per (subject, pose, painting sha); the 254 legacy rows were written once; a new waiver needs Bailey's quoted words AND the decision that records them (`source`) | `tools/pose-gate-ledger.mjs` |
| The runtime | A painting the install never vouched for (`blocked`, or no row) is treated as missing: the pose falls down its chain to the idle, logs `[pose-trust] subject/pose` once, `window.__pyrefly.poseTrust()` lists it | `src/engine/PoseTrust.ts`, `PaintedActor.ts`, `PaintedArt.ts`, `KoFallback.ts` |
| PoseBlend | A request in mid-blend re-points the weaker plane only once it is under 0.05 (it used to drop a painting still showing 0.15 to 0.35) | `src/engine/PoseBlend.ts` |
| The critic | CHK-026 gains a HEIGHT and a FEET reading from the pixels (the head stays, labelled `control`; a hold shows its real head cost); CHK-027 splits jerks at a swap (gated) from mid-move dashes (reported); the camera is projected per tracked point; the pose census is a static check on every candidate; the planner maps the pose files to CHK-026/027 | `critic/runner/lib/continuity-*.mjs`, `critic/policy.json`, `tools/critic-plan.mjs` |
| The records | The four Dark Aeons (FFX only) and 36 painted subjects that had no record (both games) are registered; the five Lady Luck rows stand on their soles (FFX-2 only, the `feetRow` guard in `measure.py`) | `tools/posescale/`, `docs/target/pose-measure.json` |

## The numbers

**Census** (`node tools/pose-gate.mjs --report`, all 1,106 paintings of the r50 art). Before: 908 character paintings without a pass: 142 `unregistered`, 766 with no status; no ledger.
After: **654 pass, 254 waived (all legacy), 198 exempt (100 dressphere and 76 hidden-chapter `twirl-*` paintings, 22 FF7 stills), 0 fail.** By row status: 646 `ok`, 8 `held`, 254 `waived`.
The gate takes about a minute (41 s measured, hi-DPI masters included).

**In play** (a second verifier played r50.1 live and this branch by real keys on the real GPU, 14 fights and a 21-chapter pose gallery of 1,143 poses; `D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/verify-game/verify-game.md`):

| | live r50.1 | this branch |
|---|---|---|
| Dark Aeons (Chapter XXVII): swaps on unregistered paintings / over 6 px of feet / double images of 0.40 or more | 296 / 263 (worst 30.8 px) / 22 | 0 / 0 (worst 6.0 px) / 0 |
| Sinspawn Gui: swaps on unregistered paintings / over 6 px of feet | 195 / 6 | 0 / 0 |
| Djose (FFX-2): swaps over 6 px of feet | 24, all Paine's Lady Luck hurt, worst 93.3 px (soles 85.8 px under the floor line) | 0, worst 2.3 px (soles 0.4 px) |
| Bahamut (FFX-2) | | no change |
| Gallery: poses that differ | | newly registered subjects, the five Lady Luck rows (feet gap 27 to 38 percent of the figure's height down to 0 to 3), four hurt/defend rows of 2.1 percent or less |
| `poseTrust()` | | empty at the end of every fight and every gallery chapter, 0 `[pose-trust]` console lines; all 908 shipped non-exempt character paintings have a row with a status |

The five Lady Luck rows now draw at 0.85, 0.99, 1.13, 1.13 and 0.72 of their idle's height (the record's own numbers, not 0.43 to 0.49).

## How it was checked (the tip of the branch)

`npx tsc --noEmit` clean. `node tools/orphans.mjs`: 28 older modules, none new. `node tools/pose-gate.mjs --check` PASS on the r50 art (1,106 paintings, 654 pass, 254 waived, 198 exempt, 0 fail, 41 s).
The full unit suite (`node node_modules/vitest/vitest.mjs run`, 700 s): **1,322 files, 1,305 passed, 16 skipped, 1 failed; 20,843 tests, 20,760 passed, 81 skipped, 1 todo, 1 failed.** The one failure,
`advisor-floor` "holds across 27. Mirror Aeons", is the 15 s default timeout under the suite's load (the same file timed out for the earlier verifier); alone it passes, 23 of 23. The gate's own tests:
`tests/unit/tools/pose-gate{,-cli,-art,-wiring,-repair,-repair-ship}.test.ts`, `art-install.test.ts`, `pose-stamp.test.ts`, `tests/unit/engine/pose-model.test.ts`, `pose-trust.test.ts`, `pose-blend*.test.ts`,
`tests/unit/critic-continuity-*.test.ts`. The verifier's installer attacks were run again through the real `tools/art-install.mjs` in a scratch root: a transparent `--replace` fails `empty`, an opaque black slab fails `slab`,
a new subject with no `subjects.json` entry stops before it measures (scratch `D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/repair/`). No browser was driven for the repair; the first verifier's browser runs cover the runtime.

## What is waived, and why

254 `legacy` rows over 84 subjects: every pose of the r50.1 art that is out of its band (by flag, rows can carry several: 170 stature-low, 56 stature-high, 22 feet, 8 feet-sunk by a weapon's point or a tail marked by eye, 1 head box; six carry none, unregistered by design:
Evrae's far paintings and the Sin fins' far-range paintings, which the overrides skip). Reason `legacy: drawn as live r50.1; awaiting the ruler pick (W3)`, words `driver, under Bailey's 2026-10-16 permanent-fix request`.
197 are FFX-2 (the dresspheres were never held), 57 FFX. They draw as they did. The ratchet: legacy rows may **only be removed** (the seal that lists them is pinned in `tools/pose-gate-ledger.mjs`, and `--base <ref>`
compares with the ledger that is live); a re-installed painting has a new sha and loses its waiver; a new waiver needs his quoted words, checked against the decision that records them.

## The two verifications, and what they changed

A first verifier tried to ship bad paintings past the gate, a second played the game. Closed in the repair commit (each is a case in `tests/unit/tools/pose-gate-repair*.test.ts`):
a transparent painting, an opaque slab, a 14 px bar and a small figure holding a full-height pole all read `ok` (new flags `empty`, `mass-*`, `no-stance`, `no-overlap`, `props-only`, `slab`);
a `@2x` master left behind by a replaced painting (the gate reads `@2x` to `@4x`; `--replace` moves them aside); a wide pose (`wide-pose`); a head box moved onto the legs or a typed hold ratio (`head-off`, `no-head`, `held-head`);
an invented sentence in Bailey's name (the quotation is checked against `decisions.json`); a legacy row added with its seal entry, and a base ref that git could not read (the seal is pinned in code, an unreadable base fails);
a junctioned subject folder; any pose called `twirl...` on any subject (now the five keys on the dresspheres); a master changed between the gate and the build; an installer that registered a subject with no face box and called it done;
and the critic failing a painting the gate passes at a band's edge (X2 Ixion's hurt: model 1.103, screen 1.107).

## What waits for Bailey (rule 10, rule 9)

1. **The ruler per pose class (W3).** The painting's head and body proportions differ from the idle's, so no single size is right for both; the 254 legacy waivers wait on this pick. Seven pictures at real resolution plus phone crops,
   the numbers and a recommendation (the geometric mean of the head and height scales, lifted to the stature floor): `D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/options/notes.md`, `options/ruler/*.png`.
   It includes FFX-2 Lady Luck hurt (0.85) and attack (0.72), repaired for the soles but still out of band, and whether a raised sword or staff counts toward height.
2. **Swap smoothing (W5).** Four one-page options (today, aligned dissolve, held-frame cut, the frame clock at 1/20 or 1/40) with captures of today: `options/notes.md`, `options/swap/`. Nothing built. CHK-027 still fails in every chapter on both builds
   (jerks of 40 px or more, 0.4 to 2.2 a minute on live, 0.7 to 2.1 here: the same within run-to-run spread).
3. **The KO band.** A KO's length (0.70 to 1.30 of the idle's height) is report-only until he rules; Lulu's is 0.42. 21 KOs read outside it.
4. **The 55 poses no scale can fix** (a head and a body that cannot both be in band): repaint, or a waiver in his words.
5. **Gating mid-move dashes.** CHK-027 ships split (decision 6: jerks at a swap gated, dashes reported, `critic/policy.json` `jerks.dashesFail: false`, `teleportPx: 300`); he has not ruled on it separately. `true` gives the old gating back.
6. **The rig (W6)** and Yuna's held-out Defend painting (a separate content decision).
7. **A decision row for the request itself.** His 2026-10-16 sentence is not in `docs/target/decisions.json` yet; add it, and the next waiver can cite it (`"source": "D-nnn"`).

## What to look at in a browser (nobody has)

The 36 subjects that had no record change what a player sees, as registering them must: the stance slide, the head lock and `upright: true` on 53 rows that the aspect test used to lay on the floor. Measured, not looked at:
Sinspawn Gui's hurt draws 0.15 of the idle's height shorter, Overdrive Sin's hurt 0.115 taller, X2 Ixion, X-2 Valefor and Vegnagun's tail move by 3 to 6 percent. Sheets: `verify-game/frames/wide-creatures`, `frames/sinspawn-gui`.
Dropping that means removing the 53 `standing` overrides in `tools/posescale/overrides.json` and regenerating. Paragon was never seen (Trema's Lv 99 party ends the fight while the poses are cycled). Also: Dark Yojimbo's cast to idle still slides 27 px sideways (live 29), which no gate reads (the feet reading gates the ground line only).

## Known and carried

- The PoseBlend hold delays a held request by up to one blend: attack to follow lands 29 frames after the blow, live 27 (Sinspawn Gui, Tidus and Auron). It shows in CHK-027 as a single-frame head step of 28 to 29 px at Tidus's attack-to-follow swap
  (under the 40 px line; the head's path is the same to 1 or 2 px).
- Files over 400 lines that were already over and grew: `PaintedActor.ts` (+37), `PaintedArt.ts` (+19), `tools/deploy-pages.mjs` (+13), `tools/exp-install.mjs` (+16), `tools/posescale/measure.py` (+46),
  `tests/unit/engine/pose-blend-stepped.test.ts` (+17), `exp-leblanc*.test.ts`; and the generated `src/data/art/poseRegistrationFoes.ts` (270 to 482 lines because 36 subjects were registered; a split touches eight consumers).
- With the Dark Aeons registered the harness tracks their feet instead of their mass, so three Dark Aeon swap jerks of 46 to 63 px appear in CHK-027 (live read none over 40: about 28 to 31 on the mass point). A change of reading, not of movement; the figure's own move is 28 px on both builds.
- `tools/exp-install.mjs` restamps the hidden chapter's tables on the command line; that path was not run.
- The FF7 exemption is a name prefix (`ff7-*`), by design; `twirl*` in the runtime's trust check is still any key (the gate is stricter).

## How to use it

```
node tools/pose-gate.mjs --check [--base <git ref>]       # every painting of public/art; exit 1 and one line per failure
node tools/pose-gate.mjs --report [--out F]               # the census as JSON
node tools/art-install.mjs --target <art folder> --subject <id> --from <set> [--dry]     # the only install path (docs/ART-PIPELINE.md section 5)
node tools/posescale/measure.py table                      # the tables, then the stamp
```
Merge hot spots: `src/engine/PoseBlend.ts`, `PaintedActor.ts`, `PaintedArt.ts`, `tools/deploy-pages.mjs`, `tools/posescale/measure.py`, `AGENTS.md` (rule 16), `docs/CONTRACT-CHANGES.md`, `docs/ART-PIPELINE.md`, `critic/policy.json`. If the ledger is ever
re-bootstrapped, re-pin `LEGACY_SEAL_DIGEST` in `tools/pose-gate-ledger.mjs`.
