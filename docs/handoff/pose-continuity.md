# Pose continuity: the permanent fix (branch `pose-gate`, 2026-10-16 to 17)

Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please." (and, on Lulu's hurt, "lulu looks tiny when hurt - this problem again? ugh").
Branch `pose-gate`, from `origin/r50-release` 6b638df95 (the r50.1 tree, art r50). **Status: merged into r52-rc (with release 51, the RE follow-ups and Chapter 28; branch `r52-rc`); not deployed yet; no review run.** Paper preflight and findings:
`D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/` (`plan.md`, `angle1-art.md`, `angle2-runtime.md`, `angle3-process.md`); the plan's copy in the repo is `docs/plans/pose-continuity-review.md`.
Contracts: `docs/CONTRACT-CHANGES.md`, the four entries of 2026-10-16 and 2026-10-17. Game case: **plumbing for both games; the Lady Luck repair FFX-2 only; the Dark Aeons FFX only.**

## Why it kept coming back

Nobody owned the contract "one figure, one size, one pair of feet in every painting". Generation checked the cutout, install was 17 scratch scripts that registered nothing, deploy checked bytes,
the one pose check saw only subjects already measured, CHK-026 read the engine's own table and so passed by construction, and the engine corrected each pose with one scalar, which matches one
length (the head after D-420, the height after r50.1). On r50: 205 of 622 game poses broke a band, 105 had no row, five Lady Luck rows planted the figure at the knees (drawn at 0.43 to 0.49), the
Dark Aeons had no stance (239 swaps over the feet line, FOC501-01), and the owner override cleared 24 of 25 deploys.

> **Update, 2026-10-17 (branch `pose-ruler`, from `117b704b0`): W3 is built.** The release driver picked the ruler (item 89e, from `options/notes.md` Part A, under Bailey's standing "I'll go with all of your recommendations"):
> see "The W3 sizing rule" below. 175 of the 254 legacy waivers are gone (139 registered figures, 36 hidden-chapter paintings); W5 (swap smoothing), the KO band and W6 are untouched.

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

## The W3 sizing rule (branch `pose-ruler`, 2026-10-17; both games, the size changes land mostly on FFX-2's dresspheres)

**The rule** (`tools/posescale/pose-rule.mjs` `ruleSize`; the pixels in `pose-ruler.mjs`): a standing pose is drawn at `sqrt(headScale x heightScale)`, where the head scale makes its head the idle's (the reviewed reading) and the
height scale makes its stature 1.0. Where that falls under the stature floor (0.90; 0.75 for critical, sleep, kneel) the stature is lifted to it and the head cost recorded as a hold (`held`, as r50.1 did); likewise a mean over 1.10 is held
to the ceiling (r50.1's holds had a ceiling too); a lift whose head would pass the hold range (0.80 to 1.45) is **refused**: no single size is in band, so the pose is drawn at the mean under its legacy waiver and goes on the repaint
list. `victory` and `defend` (a raised sword or staff) are measured head to soles (`bodyStature`), for the height scale and for the band, in the gate and in the critic. It is computed at install, by `measure.py table` (which now runs
`pose-ruler.mjs` between the rows and the tables and writes `ruled` / `held` into `docs/target/pose-measure.json`); nothing is decided at run time. A ruled pose registers a virtual head box, so the head lock stands down and the
rule's size stands; the real head is `ruled.headRatio`. Contract entry: `docs/CONTRACT-CHANGES.md`, 2026-10-17.

**Numbers** (r50 art, all 1,106 paintings). `node tools/pose-gate.mjs --check`: before **654 pass, 254 waived, 198 exempt, 0 fail**; after **829 pass, 79 waived, 198 exempt, 0 fail** (`--base 117b704b0`). 175 legacy waivers removed (139 registered figures came
into band, and 36 of the hidden chapter once its table followed the new base rows, `node tools/exp-install.mjs table`; six more waivers cover paintings that were never out of band, registered by their waiver alone, and keep their rows), none added; the seal's digest is re-pinned (`63472f803a1af17e152010ecc7124667`). Row status: 646 ok / 8 held / 254 waived became **746 ok / 83 held / 79 waived**.
361 poses are ruled (292 need no lift, 58 are lifted to the floor, 7 held to the ceiling, 4 refused); the one pose model reads every one of them within 0.0031 of the rule's own prediction (stature and head). 354 of 908 judged
paintings are drawn more than 2 percent differently (FFX 58, FFX-2 296, 71 of them the hidden chapter's copies of base rows; 272 larger, 82 smaller), no previously passing pose came out of band. The list, per game, with before and after: `D:/Tools/pyrefly-scratch/2026-10-17/pose-ruler/census-moved.md`.

**The seven option poses** (the notes' MEAN column, by the rule; stature box / body / real head): Lulu hurt 0.90 / 0.88 / 1.35 (held, r50.1 drew 0.91 / 0.87 / 1.36); Lulu critical 0.75 / 0.69 / 1.37 (held, same as r50.1);
Paine Songstress hurt 0.77 / 0.67 / 1.30 (refused: drawn at the mean, 0.59 became 0.77, still waived, repaint); Paine Lady Luck hurt 0.92 / 0.77 / 1.08 (in band, no hold); Tidus victory box 1.39, **body 1.10** / head 0.87 (held at the
ceiling: the notes' box mean read body 1.00 and head 0.79, which was out of the hold range; with the height scale read head to soles it is in band); Auron attack 0.90 / 0.81 / 1.28 (held, same as r50.1); Yuna defend (the held-out painting,
not in the art folder, not installed) would draw at scale 1.309, body 1.10, head 0.85 (held, in band).

**The nine r50.1 holds** (FFX): six come out within 0.012 of the stature r50.1 drew (Lulu hurt 0.907 to 0.901, Lulu critical 0.754 to 0.751, Auron attack 0.903 to 0.900, Auron hurt 0.900 to 0.901, Yuna hurt 0.900 to 0.901, Rikku attack 0.890
to 0.901). **Three do not, on purpose**: where the mean sits inside the band no lift is needed, and the hold had been the head ruler's clamp: Auron's low-HP pose 0.75 to 0.78 (head x1.23 to x1.28, a hold either way), Wakka's cast 1.10 to 1.06
(held to ok), Yuna's attack 0.90 to 0.94 (held to ok). The brief asked for all nine within 0.01; no rule that is a mean can do that for these three.

**Where the build departs from the brief, and why** (each is one constant or one line):
1. **Props out is `victory` and `defend` only, not strikes** (`PROPS_OUT_POSES` in `pose-kinds.mjs`). Reading `attack` head to soles too moves Auron's attack from 0.90 to 1.00 of the idle's box (head x1.28 to x1.43), Yuna's from 0.94 to 1.04 and
   Rikku's from 0.90 to 0.92, against the instruction that the FFX holds come out unchanged (and about a dozen attacks with a raised weapon, mostly FFX-2, would grow 10 to 25 percent more). Add `'attack'` to the set to flip it, then run `measure.py table`.
2. **A mean over 1.10 is held to the ceiling** as well as a mean under the floor lifted (the brief names the floor). Tidus victory needs it (head to soles the mean is body 1.12); 7 poses use it.
3. **A mean that is in the stature band but leaves 0.85 to 1.15 for the head is a recorded hold too** (Auron critical, the low class, head x1.28): holds are the head cost on record, whether or not the stature was lifted.
4. **The r50.1 `stature` holds, the D-298 gate and the r392 camera allowances are removed** (`overrides.json` loses 14 keys; `measure.py` loses the two blocks): the rule is their general case, and a ruled pose's head lock is a few thousandths
   (a virtual box), so the allowances have nothing to do. A side effect worth knowing: `head-lock-actor.test.ts` had to relax "the camera asks for more than a percent of her": Yuna's victory, now drawn 20 percent larger (body 0.75 to 0.90 of the idle's), has its head
   nearer the idle's, and the lock asks for 0.3 percent.
5. **Not covered by the rule itself**: the hidden chapter (not in the records: `src/data/art/poseRegistrationExp.ts` copies the base figure's rows, so it follows the rule once `node tools/exp-install.mjs table` is run, which was done here and then restamped with `pose-stamp.mjs`;
   the regenerated table also carries rows for base poses the hidden chapter has no painting of, which nothing reads; 36 of its waivers came off and 31 paintings stay out of band), foes with no face box (28 rows: nothing to size by), KOs. They stay waived and are on the repaint list with the reason.

**What is still out of band after the rule** (73 paintings, all on the ledger; `D:/Tools/pyrefly-scratch/2026-10-17/pose-ruler/repaint-list.md`): 4 with no single size (Paine Songstress hurt, Rikku's follow, Rikku Berserker and Rikku Gunner ready: repaint,
or the waiver stays), 10 whose size is in band but whose stance or head box is not, 28 with no face box, 31 hidden-chapter paintings. 83 poses carry a recorded hold, the head cost on record (mostly a head bigger than the idle's, the biggest x1.41, Paine Black Mage defend); a repaint removes that cost.

**To regenerate**: `measure.py table` (the rule, then the tables, then the stamp); `node tools/pose-gate.mjs --prune-legacy` after a repaint puts more paintings in band (then pin the printed digest and run `pose-stamp.mjs`);
`node tools/posescale/pose-ruler.mjs --check` recomputes every ruled record from the paintings (about 100 s).

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

1. **The ruler per pose class (W3): picked and built (2026-10-17, see above).** The painting's head and body proportions differ from the idle's, so no single size is right for both; the 254 legacy waivers waited on this pick, 139 are gone. Seven pictures at real resolution plus phone crops,
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
