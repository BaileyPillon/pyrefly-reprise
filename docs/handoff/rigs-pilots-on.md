# rigs-pilots-on: Tidus (Chapter I) and Rikku's Dark Knight (Chapter IV) draw as rigs with no address word

Branch `rigs-pilots-on`: `origin/r75-release` (`4310f6b63`, release 75's ledgers tip) with `origin/rigs-v3` (`f2dd94f79`) merged, then this lane's commit, 2026-11-06. **Nothing deployed, nothing installed in any art mirror.** The default flip needs the rig FILES in the release art mirror ("Installing", below): without them a build plays whatever `rigs/tidus` and `rigs/rikku-dark-knight` hold, which are the 2026-10-22 pilots.

Authority: Bailey, 2026-11-06, on the rigs v3 comparison clips of Tidus and of Rikku's Dark Knight: "so what are the benefits of the rigs? Those do look really good". The driver had offered to turn both pilots on (Tidus in Chapter I, Rikku in Chapter IV) and to make clips of the rest of the cast for Bailey to judge; this lane is the first half (the driver's call under that, Bailey's to overturn). His standing rule stays: a rig goes on only after he has judged it in motion; the two he has judged are the two that go on, and the clips for the others are not part of this branch.

**Game case (AGENTS.md rule 14):** Tidus FFX only (Chapter I, `seymour-flux`); Rikku's Dark Knight FFX-2 only (Chapter IV, `ffx2-bahamut`). The switch and the loader are shared plumbing (both games) and are not asked about any other figure.

## The short version

1. `PartyRigsSwitch.PARTY_RIGS_DEFAULT` is `'on'` (one line to flip back). With no address word Tidus draws as a rig in Chapter I and Rikku's Dark Knight in Chapter IV; `?partyrigs=off` gives the painting set back, as it was; `?partyrigs=v2` (the dev-only side-by-side) is unchanged; a word the switch does not know reads the default; `?pack=demo` neither turns it on nor off.
2. Every other chapter and every other figure is unchanged, **proved** by `tests/unit/rig/rigs-pilots-on.test.ts`: for all 33 chapters the game has (19 listed, 1 unlisted, 13 experimental) and none, against every one of 143 art ids (the pose registrations' plus the rigged bosses: 4,862 pairs with a chapter), `partyRigAllowed` answers the same under the new default as under `?partyrigs=off`, except exactly `seymour-flux/tidus` and `ffx2-bahamut/rikku-dark-knight`; and through the real `buildFigure` and `RigActor` the pilots are rigs only there, one read of `rigs/<subject>/rig.json`, and no read at all under `off`.
3. Measured with the v3 rig data served locally, real keys, 1600x900, the GPU: both chapters play to a victory with the pilots on; the pilots show **0 ghost frames** where the painting set ghosts (Tidus 46 frames, Rikku 74); every number the harness gates on for the pilots' own swaps is inside its band except two named below (Tidus's hurt stature, Rikku's cast stature).
4. **One regression a gate will see: Chapter IV's CHK-026 goes PASS to FAIL** (7 swaps of Rikku's cast key at stature 0.881 to 0.883 against a band floor of 0.885). Chapter I's CHK-026 already FAILs on the painting set (Auron's heads); Tidus's hurt key adds 5 height flags to it.
5. The art mirror install is a list, not a command to run blind: `INSTALL.md` of the lane's scratch folder (summarised in "Installing").

## What a player gets, and what it costs (measured; Bailey's question)

| | Painting set (`?partyrigs=off`, today) | Rig (new default) |
|---|---|---|
| a key change (ready, attack, follow, cast, item, hurt) | a cross-fade or a cut between two paintings: see-through frames while both show | one set of pieces folding from one drawing into the next: **0 see-through frames** (Tidus Chapter I 46 frames / 873 ms, 122 ms a minute; Rikku Chapter IV 74 frames / 1,446 ms, 238 ms a minute; the rig 0 and 0) |
| the figure's size and feet across a change | the table's registration holds it (head and feet pass) | the rig's own bones: head 0.2 to 0.3 percent, feet 0 px over the idle's in both fights |
| knock-out and revive | the painting set's own fall | the same run (tip, slide, cut, puff, landing) plays on the rig's pieces (`rigs-v3`; not reached in these two fights, covered by the clips and the unit tests) |
| lighting | the HD-2D look's normals | the same: both pilots draw `lit` (their normal pieces load while the rigs' share of the budget has room) |
| bytes in a build | the two painting sets | the rig folders replace the 2026-10-22 pilots' and are about 3 MB larger on disk (13.98 and 12.93 MB against 12.34 and 11.59) |
| texture memory | the paintings | budgeted by `RigTier` from the files' own sizes: **Tidus 38.6 MB, Rikku's Dark Knight 32.7 MB** (1x maps, rim masks and normal pieces); on a phone the pair of rigs a battle holds peaks at 96.0 MB in Chapter I (110 MB is the rigs' share of the 220 MB class budget) and 75.5 MB in Chapter IV |

## The measures

This branch's tree, `public/art` the r64 mirror (every one of the 163 character files of the two figures is byte-identical in r64 and the live r76), rig folders served by the lane's route: the live mirror's rigs with `tidus` and `rikku-dark-knight` replaced by the v3 files (exactly what the new mirror holds). `critic/runner/lib/continuity.mjs` (CHK-026 and CHK-027 frame by frame), the route's real keys from the title to the board, headless Playwright on the GPU, 1600x900, seed 1, goal win, under the RIG-RECORD queue lock. Rig = no address word; painting = `?partyrigs=off`; same tree, seed and script. Predictions were written first (`predictions.md` of the scratch folder).

### Chapter I, Tidus (FFX)

| | Rig (default) | Painting (`?partyrigs=off`) |
|---|---|---|
| fight to a result (real keys) | victory, 53 turns | victory, 53 turns |
| battle length (probe) | 407.6 s | 428.0 s (the machine was busier: frame p99 51.9 ms and 3.5 percent long frames against 36.6 and 1.3) |
| Tidus swaps counted (rig swaps) | 8 (8) | 16 (0) |
| Tidus see-through frames / ms | 0 / 0 | 46 / 873 (122 ms a minute) |
| Tidus height flags (CHK-026 stature) | **5**, all `idle>hurt` / `hurt>idle`, stature 0.853 to 0.865 | 0 (min 0.944) |
| Tidus head / feet over tolerance | 0 / 0 (worst head 0.2 percent) | 0 / 0 |
| Tidus swap jerks of 40 px or more (gated / planned smear) | 0 / 1 (55 px) | 0 / 4 (worst 162 px) |
| Tidus mid-move dashes of 40 px or more (reported) | 1 | 0 |
| Tidus snaps | 0 | 0 |
| Tidus blend frames, median (max) | 7 (10) | 7 (7); 4 hard cuts |
| chapter CHK-026 / CHK-027 | FAIL / FAIL | FAIL / FAIL |

Both FAILs are in the painting run too and are not the rig's: CHK-026 is Auron's attack>follow and follow>idle heads (0.93 and 1.09 of his idle) and the stature of two victory swaps; CHK-027 is one Kimahri mid-move teleport (331 px with the rig, 333 px without) in release 75's tree. With the rig, Yuna's `idle>victory` at the end of the fight counts (the camera cut that excuses it in the painting run fell on another frame): it reads an absurd 103,727 px of feet in BOTH runs (84,759 px without the rig, excused there only by the cut): a harness reading of Yuna's victory swap, not a rig finding.

### Chapter IV, Rikku's Dark Knight (FFX-2)

| | Rig (default) | Painting (`?partyrigs=off`) |
|---|---|---|
| fight to a result (real keys) | victory, 60 turns | victory, 60 turns |
| battle length (probe) | 387.0 s | 363.9 s |
| Rikku swaps counted (rig swaps) | 59 (59) | 58 (0) |
| Rikku see-through frames / ms | 0 / 0 | 74 / 1,446 (238 ms a minute) |
| Rikku height flags | **7**, all `idle>cast` / `cast>idle`, stature 0.881 to 0.883 | 0 (min 0.900) |
| Rikku head / feet over tolerance | 0 / 0 (worst head 0.3 percent) | 0 / 0 |
| Rikku swap jerks of 40 px or more (gated / planned smear) | 0 / 4 (worst 65 px) | 1 / 29 (worst 95 px) |
| Rikku mid-move dashes of 40 px or more (reported, not gated) | **40** (30 head, 10 feet; each is `commonMode` and at a swap, 40 to 138 px in one frame: the whole figure moving as it changes key, the leap or lunge of her attack as far as the harness's record shows; not looked at in motion in this lane) | 0 |
| Rikku snaps | 0 | 0 |
| Rikku blend frames, median (max) | 3 (7), the fold cap | 0 (7); 35 hard cuts |
| chapter CHK-026 / CHK-027 | **FAIL** / PASS | PASS / PASS |

The Dark Knight draws only after Rikku's dress change (the route's scripted change); before it she is the Warrior (a painting set, and no rig exists for it).

### The device classes

`phone-check.mjs` of the scratch folder: a mobile-emulated page (390x844, dpr 3, touch, the phone battle layout; the art class reads `phone`, 220 MB of figure textures, rigs may hold 110), the chapter played to a result by the debug API at the skip speed, with `__pyrefly.rigs()` read at the stage and polled through the fight for the peak.

| | rigs on the stage | peak rig texture MB (share 110 phone, 1,300 high) | console | result |
|---|---|---|---|---|
| phone, Chapter I, default | Seymour Flux's body 41.0 + Tidus 38.6 (1x maps, lit); Valefor 16.4 joins later | **96.0** | `[rig] tidus on (gate ok, 9 parts, 13 bones, 14 keys, 1x maps, lit)` | victory, 78 turns, 0 console errors, 0 failed requests |
| phone, Chapter I, `?partyrigs=off` | Seymour Flux 41.0 (+ Valefor 16.4) | 57.4 | no tidus line | victory, 78 turns, 0 errors |
| phone, Chapter IV, default | Bahamut 42.8 + Rikku's Dark Knight 32.7 (1x, lit) | **75.5** | `[rig] rikku-dark-knight on (gate ok, 8 parts, 13 bones, 11 keys, 1x maps, lit)` | victory, 85 turns, 0 errors |
| phone, Chapter IV, `?partyrigs=off` | Bahamut 42.8 | 42.8 | no Rikku line | victory, 85 turns, 0 errors |
| desktop 1600x900, Chapter I and IV, default | the same pairs at 1x | 96.0 and 75.5 | the same lines | victory, 0 errors, 0 failed requests |

Every other rig's decision (Seymour Flux, Valefor, Ifrit, Bahamut) is the same in the `on` and `off` runs on the phone class: no pilot pushes another rig to the painting set or takes its `lit` away. Offline, `planRigTextures` on the real files (`tests/unit/rig/rigs-pilots-on-budget.test.ts` pins it from the gate stamps in the fixtures): both pilots plan ON at 1x and at the 2x map on every class beside their chapter's boss rig. The GL texture count at the stage rises by 38 (Chapter I: 93 to 131) and by 93 (Chapter IV: 113 to 206) on the phone: the parts' variant textures.

`docs/BUDGETS.md` K3 ("the rigs reach phones": four rigged party members at about 23 MB each against a 220 MB class) is answered for the two pilots: they hold 38.6 and 32.7 MB with their normal pieces, 19.6 and 17.1 MB without, and never push a battle past the rigs' 110 MB share.

**The headroom on a phone in Chapter I is 14 MB** (96.0 of 110 at the moment Valefor is out); a rig added to that battle would lose its `lit` normals first and then fall to the painting set, which `RigTier` handles (reason on record).

### Predictions against what came

HIT: every Chapter I and IV row of `predictions.md` for the pilots' own swaps (ghost 0, flags only on hurt / cast, head and feet 0, gated jerks 0, snaps 0, blend medians 7 and 3, dashes 1 and 40, rig swaps 8 and 59, the fights' results, Chapter IV's verdicts, the phone and desktop rig decisions, 0 console errors). MISS, two: (a) the Chapter I painting run's length (7.13 minutes against 6.0 to 6.9: the machine was busier, p99 52 ms; it is 5 percent above the rig's); (b) Chapter I's CHK-027, which I predicted PASS for both and which FAILs in both on Kimahri's 331 to 333 px teleport (release 75's tree, not the pilots).

## Tests and the suite

- `npx tsc --noEmit` clean; `node tools/orphans.mjs`: 24 orphans, the same 24 as the rigs-v3 baseline (no new module is unreached: `RigHold`, `RigFold`, `RigKoHost`, `livingRig` are all imported).
- Full suite (`npx vitest run --maxWorkers=3`, 1,982 files, 50 minutes under a loaded machine): 1,948 files passed, 31 skipped, **3 files with 4 failing tests, all explained**: (1) `advisor-floor.test.ts` "holds across 27. Mirror Aeons": the 15 s timeout while three workers and other lanes' browsers shared the CPU (it took 16.7 s); it passes alone. (2) `booth-b4-last-rows.test.ts`: asks for `docs/screenshots/booth-b4-last-plate-grade.png`, which is tracked on `origin/r75-release` but absent from this sparse worktree (the file is skip-worktree here); it fails the same way on the release line's own tip in this tree and passes in a full checkout. (3) `engine/demo-motion-int.test.ts` (2 tests): they pinned the switchboard's party rigs row as not new, which the default now makes new; **fixed in this commit** (the board lists it as new, the master key still never flips it), both pass.
- Touched or new test files, run together: `rigs-pilots-on.test.ts` (14), `rigs-pilots-on-budget.test.ts` (11), `real-motion.test.ts`, `rigs-v2-switch.test.ts`, `demo-motion-int.test.ts`, and the rig and tools directories (75 files, 931 tests) all pass.

## What regressed (for the deploy gate and the next batch)

1. **Chapter IV CHK-026: PASS to FAIL.** Seven swaps of Rikku's cast key read 0.881 to 0.883 of her idle's stature against the band's floor (the rigs-v3 handoff's open question 3: a rig-cut or a waiver-row question, not an engine one). The painting set passes. The fix is in the rig data (cast key's head/arm variant), or a pose waiver for the rig on that key by the driver's call; this branch does neither.
2. **Chapter I: Tidus's hurt key stands 0.853 to 0.865** (5 swaps), the same question. Chapter I's CHK-026 already FAILs on the painting set, so no verdict flips.
3. **Rikku's mid-move dashes, 40 against 0** (reported, not gated: the rig leaps continuously where the painting set cuts behind a planned smear; look at the leap in motion before calling it a defect).
4. **Phone memory headroom** in Chapter I: 96.0 of 110 MB at the peak (57.4 without the pilots), +38 and +93 GL textures.
5. **Build size** about +3 MB on disk before WebP derivation.

Nothing else moved: both chapters play to victory, 0 console errors, 0 failed requests, every non-pilot rig decision identical, every other chapter and figure identical by test.

## Installing (the driver's; nothing was installed)

Full list with hashes and the dry-run output: `INSTALL.md` in the lane's scratch folder (`rigs/` of 2026-11-06). In short:

- **Files:** the two rig folders WHOLE, as made by `stage.mjs` there: Tidus 516 files (13,977,589 bytes, `rig.json` sha256 `2019f7a5...`), Rikku's Dark Knight 386 files (12,933,935 bytes, `33a44880...`). They are the lane's canonical `tidus-v2` and `rikku-dark-knight-v2` folders (byte-identical to what the 2026-10-30 clips and these measures were run from), **renamed to the subject names**: the ship tools refuse a rig whose folder is not its `name`.
- **Into:** `rigs/tidus/` and `rigs/rikku-dark-knight/` of a NEW mirror built from the live one (r76), replacing r76's 2026-10-22 pilots (`24aba326...`, `38e3da48...`): `node tools/art-mirror-add-rigs.mjs --from <r76> --rigs <the staged folder> --to <next free mirror> --subjects tidus,rikku-dark-knight`. The dry run passes (6,307 files linked, 902 rig files copied, `manifest.json` rebuilt with both rigs and their `[1,2]` tiers). Then the release tree's `public/art` points at the new mirror; r76 stays as the rollback.
- Nothing is added under a `-v2` name (a `-v2` folder never ships), and no painting, pose table or other rig changes: the two rigs' costume is the idle painting that is in r64 and r76 today.
- After the deploy, with no address word, the console must say `[rig] tidus on (gate ok, 9 parts, 13 bones, 14 keys, 1x maps, lit)` in Chapter I and `[rig] rikku-dark-knight on (gate ok, 8 parts, 13 bones, 11 keys, 1x maps, lit)` in Chapter IV.

**If the build must not carry them:** flip `PARTY_RIGS_DEFAULT` to `'off'` (the tests that pin the default say so), or build from r76 unchanged.

## Open questions (the driver's; none blocks the branch)

1. Chapter IV's CHK-026: recut the cast key (rig data), waive the rig's cast and hurt keys in `docs/target/pose-waivers.json`, or ship with the verdict disclosed as a major (it is a stature 0.2 to 0.5 percent under a floor, not a visible defect in the clips)?
2. Does Bailey want to see Rikku's leap in motion before the pilots go live (the dashes)? The clips of 2026-10-30 show it; no new clip was made here.
3. The rest of the cast (the driver's second half of the offer): not started.

## CHANGELOG lines (for the release that carries this branch; none is in `CHANGELOG.md`)

- **FFX only, Chapter I: Tidus is drawn as a rig by default.** One painting cut into pieces that fold from one drawing to the next instead of cross-fading: no see-through frames on his key changes (the painting set had 46 in a fight), the same head and feet, the same lighting. `?partyrigs=off` gives the paintings back.
- **FFX-2 only, Chapter IV: Rikku's Dark Knight is drawn as a rig by default, with the same gains** (74 see-through frames in a fight on the painting set, none on the rig). `?partyrigs=off` gives the paintings back.
- **Both games, shared plumbing, no change for any other figure or chapter:** the pilots' switch defaults on; its tests pin every other chapter and figure to what it was.

## Files

`src/engine/motion/PartyRigsSwitch.ts` (`PARTY_RIGS_DEFAULT`, `partyRigsModeFromSearch`), `src/engine/rig/RigStage.ts` (a comment), the three merge conflicts resolved keeping both sides (`critic/runner/lib/continuity-analyze.mjs`, `src/engine/fx/mix/living.ts`, `docs/CONTRACT-CHANGES.md`) and two files trimmed back under 400 lines by joining a comment and some type imports (`living.ts` 399, `RigFigure.ts` 396); tests `tests/unit/rig/rigs-pilots-on.test.ts` (new, 14), `rigs-pilots-on-budget.test.ts` (new, 11), `tests/unit/engine/real-motion.test.ts`, `tests/unit/rig/rigs-v2-switch.test.ts` and `tests/unit/engine/demo-motion-int.test.ts` (the default pinned); docs `docs/DEV.md` (the row), `docs/CONTRACT-CHANGES.md`, this file; `docs/screenshots/rigs-pilots-on/` (the four real-key stills: Chapter I mid-fight and Chapter IV dress-change menu, rig and painting).
