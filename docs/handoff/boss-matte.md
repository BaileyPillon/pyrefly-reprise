# Boss matte (conference demo, lane "boss-matte", 2026-10-23)

**Branch `boss-matte`, from `origin/pro-look` (673d76b94). Game case: Bahamut (Chapter IV) is FFX-2 only, Seymour Flux (Chapter I) is FFX only; the shared code (`BossClean.ts`, the two stage hooks, the card modifier) is "both", and only plays for those two figures. One switch, default OFF.**
Bailey, 2026-10-23 about 10:15 (item 193 of the morning's board): "Yes, re-cut both" (the boss edges, rank-2 mockup option A "Clean cut-out"; the originals are kept). His standing rule of 2026-10-22: "I kind of want to take the ffx/ffx-2 that I know and love and put an expedition 33 kind of spin on it"; the bar is Expedition 33 and Hades. The gap is G20 of `D:/Tools/pyrefly-scratch/2026-10-22/pro-board/gaps/GAPS.md`; the target is `.../pro-board/mock/rank-2/` (option A).

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

Files, per boss, and how many (`work/final-table.md` lists the old and new sha256 of every one):

FILE_COUNTS

### Method (`work/recut.py`, `work/parts.py`, `work/install-mirror.mjs`; numpy and PIL only, repeatable)

1. **Masters** (the six 2x pose masters of each boss, `recut.py`): binary mask at alpha 0.5; loose pieces and the grey/lilac strips beside Bahamut's right wing erased (per-pose polygons in `work/hints-<subject>.json`: inside a polygon only the light, low-saturation pixels go, so the black spars stay); interior holes under 12,000 px filled (Bahamut's pin and torso holes, the gaps between wing and body), the texture of armour holes cloned from the painting itself (offset search on the hole's ring of known pixels, low frequencies from the surroundings); narrow channels sealed (closing r 5, r 3 for Seymour so his hair tips stay); wing-membrane bays closed (closing r 46, only on membrane-coloured pixels, grown at most 60 px); outline smoothed (sigma 1, 2.6 on the membrane); eroded 2 px; a 1.6 px anti-aliased edge; translucent interior alpha kept (Bahamut's far wing), the old rim of a closed hole made opaque.
2. **Colour**: the pale matte colour is removed from the colour too, not only the alpha: the outer 5 px band and everything under alpha 0 take colour pulled (push-pull) from the painting 5 px or more inside the ORIGINAL outline (and not from beside a filled hole), so no white is left for a texture filter to bleed. This is the finding of the mockup lane, measured: the 2x idle master's colour under alpha 0 averages (94, 84, 99) and its outer 6 px band is 40 luminance brighter than the painting 10 px in.
3. **Rig parts** (`parts.py`): Bahamut and Seymour are rigs (`rigs/ffx2-bahamut`, `rigs/seymour-flux-body`), so the pieces on screen are the rig's parts, not the paintings. The base parts are exact crops of the idle master, so they are rebuilt from the cleaned idle master (new alpha = cleaned alpha times the part's old share of the master's alpha; the pixels the clean-up added go to the nearest part whose mesh covers them). The pose variants (attack, cast, hurt, telegraph, ko) are not plain crops of the pose masters (the rig tool registers each to a bone), so they are cleaned in their own pixel space with the same `recut`, islands kept, no erosion (their cut edges run through the figure), colour changed only where it is the pale halo. Strips beside Bahamut's right wing in its five variants are erased by per-image polygons (`work/hints-parts-ffx2-bahamut.json`). Every new alpha is clipped to the part's mesh (the meshes are unchanged: 98 percent of what the idle clean-up added lies inside them).
4. **1x twins and 1x paintings** are derived by the repo's own tier rule (`tools/rig/rig-tiers.mjs`: `writeTiers`, `verifyTiers` PASS), never authored.
5. **Not touched**: rim masks (`*.rim.png`), normal maps (`*.normal.png`), the `splash` painting, the `ko.1/.2/.3` frames, the 3x and 4x paintings (a rig subject never draws them), every sidecar, `rig.json`, the manifest.

### Code

| piece | what it does | files |
|---|---|---|
| no rim on the boss | the rim (`rimStrength`), the ground bounce (`bounceStrength`) and the HD-2D look's relight rim (`relightRimAmt`, one cell shared by every figure) are zero while the boss's own parts draw (`onBeforeRender` / `onAfterRender` on each part's mesh) and are put back after; the party keeps its rim; nothing is left changed | `engine/look/pro/BossClean.ts` |
| shadow and turn ring under the footprint | after the actor's own update, the contact shadow and the turn ring are centred and sized from where the painting's bottom band lies in the content box (`BOSS_FEET`: Bahamut cx 0.38, hw 0.251 of its width = under the tail coil; Seymour cx 0.443, hw 0.227 = under the hem and the boot) instead of at the actor's origin | `engine/look/pro/BossClean.ts`, one line in `BattlePresenterStage.add` (attach), one in `update` (tick) |
| the bold pass's rim, off on the boss | the pro arena's bold pass (`LookBoldShader`, step 5) draws its own screen-space rim along every figure's lit edge, in the room's key colour; zeroing the figure's rim cells leaves it (a thin pale line along the lit edges). The shader now takes the re-cut boss's padded screen box (`LookBold.boxes`) and every other figure's box: no rim inside a boss box unless another figure's box also holds the pixel (a party member in front keeps hers). Counts 0 with the switch off | `engine/look/pro/BossRimOff.ts`, 6 lines in `LookBold.ts` (400 lines), 15 in `LookBoldShader.ts` |
| boss card halo | a re-cut boss's card cut-out takes a tight ink edge and a floor shadow in place of the 22 px gold glow (`.bstart__art--clean`) | `ui/common/BattleStartBanner.ts`, `battle-start-banner.css` |
| console | `__pyrefly.bossClean(...)` | `debug/proApi.ts` |

Reflection: the engine's floor reflection (`fx/b/FloorReflection.ts`, a mirrored camera) draws the boss with the rest of the room, so it follows the clean figure; nothing is refitted. The mockup's synthetic reflection is not built.

EVIDENCE_SECTION

## Sourced vs [ours]

Nothing here is game data. Every number is [ours]: the erosion, closing radii, hole threshold and band widths (tuned against the two bosses' masters), the footprint fractions (`BOSS_FEET`, measured from the clean idle masters: the lowest 300 px band of Bahamut's 2048 px master, the lowest 160 px of Seymour's 2422 px master, 5th to 95th percentile), the card's filter.

## For the driver (install)

1. The art goes in at install time: for each file in `work/final-table.md`, version the original in the private art repo (`BaileyPillon/pyrefly-art`), then replace it with the file of the same name from the test mirror `D:/pyrefly-art-boss`.
2. The pose-scale record pins the sha256 of every pose painting: `tests/unit/engine/pose-scale-art.test.ts` names the twelve (`ffx2-bahamut/*`, `seymour-flux-body/*`: "the painting changed since it was measured") until `measure` is run again on them. The registration numbers are unlikely to move (same size, same anchor, the silhouette moves by about 2 px), but the record is the art lane's.
3. The rig gate stamps its content (`gate.digest`) and the costume's sha: `node tools/rig-gate.mjs --rig <folder>` must be run on both rigs again before a deploy (`--verify` is what the deploy runs).

NOT_DONE
