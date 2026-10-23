# Boss matte (conference demo, lane "boss-matte", 2026-10-23)

**Branch `boss-matte`, from `origin/pro-look` (673d76b94). Game case: Bahamut (Chapter IV) is FFX-2 only, Seymour Flux (Chapter I) is FFX only; the shared code (`BossClean.ts`, the two stage hooks, the card modifier) is "both", and only plays for those two figures. One switch, default OFF.**
Bailey, 2026-10-23 about 10:15 (item 193 of the morning's board): "Yes, re-cut both" (the boss edges, rank-2 mockup option A "Clean cut-out"; the originals are kept). His standing rule of 2026-10-22: "I kind of want to take the ffx/ffx-2 that I know and love and put an expedition 33 kind of spin on it"; the bar is Expedition 33 and Hades. The gap is G20 of `D:/Tools/pyrefly-scratch/2026-10-22/pro-board/gaps/GAPS.md`; the target is `.../pro-board/mock/rank-2/` (option A).

## How to run it (the driver)

1. Code: branch `boss-matte` on `origin` (`git log` says the sha; it contains pro-look 673d76b94 and nothing else of the other lanes). Game case: Bahamut FFX-2 only, Seymour Flux FFX only.
2. Art: point the tree's `public/art` at `D:/pyrefly-art-boss` (a junction, `cmd /c mklink /J`; it is `D:/pyrefly-art-motion` plus the 158 replaced files) for the test build; at the real install, see "For the driver" below.
3. Play: `?demo=1&pack=demo` (the pack turns `?boss=clean` on); `?boss=today` is the A/B.

## The switch

| | |
|---|---|
| Address | `?boss=clean`, or the shared `?pack=demo` (turns it on with the rest of the pack). `?boss=today` wins over the pack (the A/B). |
| Where it plays | Chapter I and Chapter IV only (`engine/motion/DemoGate.ts`), and only for the two bosses (`BOSS_CLEAN_ARTS`: `seymour-flux-body`, `ffx2-bahamut`). The party, every other chapter and the default (no key) are pro-look / playtest-1022. |
| Console | `__pyrefly.bossClean()` reads it, `.bossClean('clean' \| 'today' \| null)` sets it live, `.bossCleanOn()` says whether it plays now. |
| Art | The re-cut art is NOT in the repo (`public/art` is gitignored). It is a test mirror, `D:/pyrefly-art-boss` (a hard-link copy of `D:/pyrefly-art-motion` in which only the replaced files are new files). With the old art and the switch on, the boss draws with no rim light and the shadow fitted (the code half stands alone); with the new art and the switch off, the new art draws with today's rim. |

## What changed

### Art (candidates; originals untouched)

Candidates: `D:/Tools/pyrefly-scratch/2026-10-23/boss-matte/cand/` (`characters/<subject>/<pose>@2x.png` the cleaned 2x masters, `rigs/<subject>/*.png` the rig's colour textures, `sheets/` the 1:1 BEFORE | AFTER sheets per pose). Installed only in the test mirror. Same pixel dimensions and names as the originals, so nothing moves.

Files, per boss, and how many ([boss-matte-files.md](boss-matte-files.md) lists the old and new sha256 of every one):

| | Bahamut (`ffx2-bahamut`, FFX-2) | Seymour Flux (`seymour-flux-body`, FFX) |
|---|---|---|
| 2x masters (`characters/<subject>/<pose>@2x.png`, six poses) | 6 | 6 |
| 1x paintings (`<pose>.png`; the boss card draws `idle.png`) | 6 | 6 |
| rig colour textures (5 and 6 parts, each with five pose pieces) | 30 | 36 |
| the same, 1x twins (`rigs/<subject>/1x/`) | 30 | 36 |
| `rig.json` (costume sha, the keys' fit overlaps, the gate stamp re-run) | 1 | 1 |

158 files in all. The full list with the old and new sha256 of every one is [boss-matte-files.md](boss-matte-files.md).

### Method (`work/recut.py`, `work/parts.py`, `work/install-mirror.mjs`; numpy and PIL only, repeatable)

1. **Masters** (the six 2x pose masters of each boss, `recut.py`): binary mask at alpha 0.5; loose pieces and the grey/lilac strips beside Bahamut's right wing erased (per-pose polygons in `work/hints-<subject>.json`: inside a polygon only the light, low-saturation pixels go, so the black spars stay); interior holes under 12,000 px filled (Bahamut's pin and torso holes, the gaps between wing and body; in a pose PIECE the limit is per part, body 12,000, head 4,000, wings 3,000, tail 600, because the inside of a tail's loop is a real gap), the texture of armour holes cloned from the painting itself (offset search on the hole's ring of known pixels, low frequencies from the surroundings); narrow channels sealed (closing r 5, r 3 for Seymour so his hair tips stay); wing-membrane bays closed (closing r 46, only on membrane-coloured pixels, grown at most 60 px); outline smoothed (sigma 1, 2.6 on the membrane); eroded 2 px; a 1.6 px anti-aliased edge; translucent interior alpha kept (Bahamut's far wing), the old rim of a closed hole made opaque.
2. **Colour**: the pale matte colour is removed from the colour too, not only the alpha: the outer 5 px band and everything under alpha 0 take colour pulled (push-pull) from the painting 5 px or more inside the ORIGINAL outline (and not from beside a filled hole), so no white is left for a texture filter to bleed. This is the finding of the mockup lane, measured: the 2x idle master's colour under alpha 0 averages (94, 84, 99) and its outer 6 px band is 40 luminance brighter than the painting 10 px in.
3. **Rig parts** (`parts.py`): Bahamut and Seymour are rigs (`rigs/ffx2-bahamut`, `rigs/seymour-flux-body`), so the pieces on screen are the rig's parts, not the paintings. The base parts are exact crops of the idle master, so they are rebuilt from the cleaned idle master (new alpha = cleaned alpha times the part's old share of the master's alpha; the pixels the clean-up added go to the nearest part whose mesh covers them). The pose variants (attack, cast, hurt, telegraph, ko) are not plain crops of the pose masters (the rig tool registers each to a bone), so they are cleaned in their own pixel space with the same `recut`, islands kept, no erosion (their cut edges run through the figure), colour changed only where it is the pale halo. Strips beside Bahamut's right wing in its five variants are erased by per-image polygons (`work/hints-parts-ffx2-bahamut.json`). Every new alpha is clipped to the part's mesh (the meshes are unchanged: 98 percent of what the idle clean-up added lies inside them).
4. **1x twins and 1x paintings** are derived by the repo's own tier rule (`tools/rig/rig-tiers.mjs`: `writeTiers`, `verifyTiers` PASS), never authored.
5. **`rig.json`** changes only in its stamp: the costume's two sha256 (the re-cut idle painting), the keys' recorded fit overlaps (`fit.iou`: the gate now reads attack 0.949, cast 0.948, hurt 0.957, telegraph 0.941 and ko 0.934 for Bahamut against 0.983, 0.993, 0.993, 0.978 and 0.982 recorded; Seymour's all within 0.02; every key is above the gate's bar of 0.75 and the rest pose above 0.95) and the gate's own stamp, by `node tools/rig-gate.mjs` on a private copy (`work/gate-try.mjs`). Nothing in its meshes, weights, keys or motion.
6. **Not touched**: rim masks (`*.rim.png`), normal maps (`*.normal.png`), the `splash` painting, the `ko.1/.2/.3` frames, the 3x and 4x paintings (a rig subject never draws them), every sidecar, the manifest.

### Code

| piece | what it does | files |
|---|---|---|
| no rim on the boss | the rim (`rimStrength`), the ground bounce (`bounceStrength`) and the HD-2D look's relight rim (`relightRimAmt`, one cell shared by every figure) are zero while the boss's own parts draw (`onBeforeRender` / `onAfterRender` on each part's mesh) and are put back after; the party keeps its rim; nothing is left changed | `engine/look/pro/BossClean.ts` |
| shadow and turn ring under the footprint | after the actor's own update, the contact shadow and the turn ring are centred and sized from where the painting's bottom band lies in the content box (`BOSS_FEET`: Bahamut cx 0.38, hw 0.251 of its width = under the tail coil; Seymour cx 0.443, hw 0.227 = under the hem and the boot) instead of at the actor's origin | `engine/look/pro/BossClean.ts`, one line in `BattlePresenterStage.add` (attach), one in `update` (tick) |
| the pro look's two screen-space rims, off on the boss | the pro arena's two passes each draw a rim of their own in screen space (`LookMainShader` LOOK_CINE, `LookBoldShader` step 5): a bright ring along every figure's lit edge, in the room's key colour, over the figure mask. Zeroing the figure's rim cells leaves both (found by toggling each: `work/rimhunt/`, both gains at 0 clears the line). A rigged boss is one tracked mesh PER PART to the bold pass, so `BossRimOff.ts` takes the UNION of a boss's parts' padded screen boxes (`LookBold.boxes`) and every other figure's box; the shaders skip the rim at a pixel inside a boss box and inside no other figure's box (a party member standing in front keeps hers). Counts 0 with the switch off | `engine/look/pro/BossRimOff.ts`, 6 lines in `LookBold.ts` (400 lines), `LookRig.ts` (1 line), 15 lines each in `LookBoldShader.ts` and `LookMainShader.ts` |
| the bold pass's contact ellipse and reflection, one per boss | the same pass draws a contact shadow and a reflection for every tracked mesh, each standing on the columns of its own lowest rows: for a rig that is five or six ellipses, some under hair or a wing. `bossFigure` gives a re-cut boss's FIRST part one ellipse under the whole footprint (`BOSS_FEET`, from the content box) and its other parts strength 0 | `BossRimOff.ts#bossFigure`, 3 changed lines in `LookBold.figures` |
| boss card halo | a re-cut boss's card cut-out takes a tight ink edge and a floor shadow in place of the 22 px gold glow (`.bstart__art--clean`) | `ui/common/BattleStartBanner.ts`, `battle-start-banner.css` |
| console | `__pyrefly.bossClean(...)` | `debug/proApi.ts` |

Reflection: the engine's floor reflection (`fx/b/FloorReflection.ts`, a mirrored camera) draws the boss with the rest of the room, so it follows the clean figure; nothing is refitted. The mockup's synthetic reflection is not built.

## Evidence

Real-input headless Chromium on the real GPU, 2560 x 1440, `?demo=1&pack=demo&coach=off`, the simulated pad from the title through the picker, Vite on :5373 started and stopped by PID, RIG-RECORD held per job, **0 console errors in every run** (`evidence/*-console.json`). Frames in `D:/Tools/pyrefly-scratch/2026-10-23/boss-matte/evidence/`: `today-*` = the same code with `?boss=today` and the ORIGINAL art for the two bosses (served from `D:/pyrefly-art-motion` by a request route, so it is today's pro-look build), `final-*` = this branch with the re-cut art:

| moment | files |
|---|---|
| Chapter I boss card, late in the opening camera move, first menu, a pose crossfade (idle to attack, frames 3, 6, 10 and 16 at an exact 120 Hz) | `{today,final}-ch1-card.png`, `-late.png`, `-menu.png`, `-xfade-NN.png` |
| Chapter IV boss card, Yuna's first command, a Bahamut pose crossfade (no doubled rim), Mega Flare: the countdown 5 to 1, the banner, the flood (every 30 frames of an exact-120 Hz run) | `{today,final}-ch4-card.png`, `-menu.png`, `-xfade-NN.png`, `-mf-NNNN.jpg` |
| the rim hunt: Chapter I's late frame with each rim and effect switched off in turn (the finding that the pro look has two screen-space rims) | `work/rimhunt/`, `work/an/rimhunt-sheet.jpg` |

Repo copies (before | after): `docs/screenshots/boss-matte/` (`seymour-late-`, `bahamut-menu-`, the two cards, `bahamut-crossfade-built.jpg`). Phone cards for Bailey: `D:/Tools/pyrefly-scratch/2026-10-23/boss-matte/phone/` (`bahamut.jpg`, `seymour.jpg`, `cards.jpg`; 1080 px wide, under 600 KB each; rows TODAY | MOCKUP A | BUILT; the cards TODAY | BUILT, the mockup did not draw them). 1:1 before | after sheets per pose master: `cand/sheets/`.

What the frames show (each is the same moment with and without the re-cut): the cyan rim and the pale 3 to 4 px band are gone from both bosses (the rim hunt: the pale line is the pro look's two screen-space rims plus the figure's own; all are off on the boss now, still on the party); Bahamut's torso and pin holes are closed, its loose grey and lilac shards beside the right wing are gone, its wing edges are smooth scallops with no torn bites; Seymour's hair tips stay sharp; the bold pass's contact ellipse and the engine's shadow sit under Seymour's hem and boot and under Bahamut's tail coil; in the crossfade there is no ghost rim (four frames each); the two cards lose the 22 px gold glow, the strips and the holes. The party keeps its cyan rim (the art lane's cast grammar, C1).

**Frame cost** (RTX 5070 Ti, headless GPU, 2560 x 1440, 120 back-to-back renders with a GPU sync, `?boss=clean` against `?boss=today` flipped live in one session; the first pair with the card quiet, the second shared with other lanes' jobs, so read the differences): Chapter I render 6.50 / 6.48 ms against 6.50 / 6.53 (shared: 7.31 / 7.31 against 7.39 / 7.22); Chapter IV 8.51 / 8.50 against 8.56 / 8.54 (shared: 9.28 / 10.29 against 9.83 / 9.25). The stage's per-frame update, 300 calls: 0.07 to 0.16 ms against 0.04 to 0.08 ms (the shadow fit, the every-frame part scan and the posed box are well under 1 percent of a 120 Hz frame). **Unchanged within the noise.**

**Checks.** `tsc --noEmit` clean; `tests/unit/engine/boss-clean.test.ts` (18 tests: the switch, the two art ids, the rim cells zero only while a boss part draws and back after, the shadow fit, the card check, the rim-off boxes, the posed box, the one-ellipse rule) pass; the touched families pass (`look-*`, `pro-look-*`, `engine/`, `rig/`, `ui-*`, `demo`: 3,487 tests; the two UI files that time out under load, `ui-ffx2-atbmode` and `ui-pause-stack`, pass alone); `node tools/orphans.mjs` lists the same 24 old orphans, none of the new files; `node tools/rig-gate.mjs --rig <both> --art D:/pyrefly-art-boss --verify` PASS (the stamp is ok for exactly this content, the 1x tier is proved); `node tools/rig-tiers.mjs verify` PASS. The red tests are the art pins: `pose-install-0926`, `pose-install-0930`, `pose-stature-hold`, `held-defend-ffx`, `held-defend-ffx2` (not this lane's: Paine, Yuna, Rikku and others) and `pose-scale-art`, which now also names the twelve re-cut paintings (see "For the driver"). With the switch off (`?boss=today`, the `today-*` frames) the build draws as pro-look does: the rim, the old shadow, the gold card glow.


## Sourced vs [ours]

Nothing here is game data. Every number is [ours]: the erosion, closing radii, hole threshold and band widths (tuned against the two bosses' masters), the footprint fractions (`BOSS_FEET`, measured from the clean idle masters: the lowest 300 px band of Bahamut's 2048 px master, the lowest 160 px of Seymour's 2422 px master, 5th to 95th percentile), the card's filter.

## For the driver (install)

1. The art goes in at install time: for each file in `work/final-table.md`, version the original in the private art repo (`BaileyPillon/pyrefly-art`), then replace it with the file of the same name from the test mirror `D:/pyrefly-art-boss`.
2. The pose-scale record pins the sha256 of every pose painting: `tests/unit/engine/pose-scale-art.test.ts` names the twelve (`ffx2-bahamut/*`, `seymour-flux-body/*`: "the painting changed since it was measured") until `measure` is run again on them. The registration numbers are unlikely to move (same size, same anchor, the silhouette moves by about 2 px), but the record is the art lane's.
3. The rig gate stamps its content (`gate.digest`) and the costume's sha: `node tools/rig-gate.mjs --rig <folder>` must be run on both rigs again before a deploy (`--verify` is what the deploy runs).

## Not done (disclosed)

- **The ink line.** The mockup's "one thin dark ink line instead of the glow" is NOT in the art. I built it (the outer 3 px of the master darkened toward the painting's own shadow colour, `recut.py --ink=0.55`) and judged the clean edge against it at the game's scale (about 0.47 of the 2x master at 1440p, `work/an/ink-compare.jpg`): the ink line reads slightly crisper on the wing membranes, the clean edge is already free of any pale line. The ink cannot be applied to the pose pieces without the rig tool's own registration (their cut edges run through the figure and would draw a dark seam), and an idle with an ink line crossfading to poses without one would pop. So the build ships the clean edge everywhere; the engine's own ink (the pro look's outline) is untouched.
- **The pose pieces keep their underlap.** Only Bahamut's right-wing pieces (five poses) have the grey strips erased (per-image polygons); the other pieces still carry small dark fragments of their neighbours (the partition's underlap), covered by the neighbour part. The pieces are not plain crops of the pose masters (the rig tool registers each to a bone), so the master-level clean-up could not be mapped onto them; they were cleaned in their own pixel space (same `recut`, islands kept, no erosion).
- **The Mega Flare banner's `splash` painting, the `ko.1/.2/.3` frames and the 3x and 4x paintings are not re-cut.** The splash is its own cut-in painting with a soft glow and a hard rectangular notch at the left; it is drawn for about a second. A rig subject never draws the 3x and 4x masters.
- **The reflection is the engine's own** (a mirrored camera draws the boss with the room), not the mockup's synthetic one; it follows the clean figure. The bold pass's reflection and contact ellipse stand on `BOSS_FEET`.
- **The pose-scale records** (`docs/target/pose-measure.json`, the registration rows) pin the sha256 of the twelve re-cut paintings: `pose-scale-art.test.ts` names them until `measure` is run again (ComfyUI's python; this machine's has no scipy). The art lane's tool; the silhouette moved by about 2 px.
- **Re-run after any further change to the art:** `node tools/rig-gate.mjs --rig <folder> --art <art dir>` (the gate stamp is for exactly the content it judged). The candidate `rig.json` files already carry the stamp for the files in the mirror.
- 2560 x 1440 only; 21:9 and 16:10 were not drawn for. The shadow fit reads the content box, so it holds at any size; the rim boxes are screen boxes, so they do too.

