# r47-rikku-colour: Rikku's FFX-2 dressphere paintings brought down to Yuna's colour level (FFX-2 only)

Branch `r47-rc`, worktree `D:/pyrefly-r47`, art mirror `D:/pyrefly-art-r47`. Written 2026-10-14 by a Sonnet sub-agent of the release driver. **Not deployed, no review run.**
Game case: **FFX-2 only** (rule 14): these are Rikku's FFX-2 dressphere paintings. Her FFX painting `characters/rikku`, the experimental chapter's own copies `characters/exp-leblanc-rikku-*`,
and the Dark Knight and Warrior dresspheres (already below Yuna's colour level) are **not changed**.

What was asked. Bailey, 2026-10-14, verbatim: "go with A, show me the before and after" (option A for Rikku's oversaturated dressphere paintings), and then, delegating the pick between the
colour-corrected sheets: "i will go with your recommendations as it comes out please." The driver looked at the refined sheets and picked **AT TARGET per dressphere** (the dial of the colour round's
`table.md`, section 2), **with one change: her hair, and the yellow fills, must stay golden blonde, not pale cream.** Everything else exactly as AT TARGET: the accent relief for eyes and beads, the glare
cap, the skin within her FFX painting's range, outlines, alpha, dark pixels and whites untouched, no gamut escapes.

![Before and after, every dressphere idle, Yuna's beside them, and the faces at full size](../screenshots/r47-rikku-colour/rikku-final-before-after.jpg)

## 1. What was corrected

443 PNG files: every pose of the eight dresspheres the dial changes, at 1x, `@2x`, `@3x` and `@4x` (122 base masters and 321 tiers). Each file is its old self run through one per-pixel function at its own size:
nothing is resampled, the sidecars (`.json`) did not change, and every pose and tier of a dressphere gets the same dial, so a costume stays consistent across its poses and sizes.

| dressphere | poses | files | dial `s` (AT TARGET) | Yuna's painting it is put on |
|---|---|---|---|---|
| Alchemist | 16 | 64 | 0.740 | her Thief (nearest: she has no Alchemist) |
| Berserker | 12 | 48 | 0.895 | her Warrior (nearest: she has no Berserker) |
| Black Mage | 16 | 64 | 1.000 (the limiter alone) | her Black Mage |
| Gunner | 17 | 68 | 0.600 (the strongest the dial may use) | her Gunner |
| Lady Luck | 15 | 15 (1x only: Lady Luck has no tiers) | 0.600 | her Lady Luck |
| Songstress | 15 | 60 | 0.745 | her Songstress |
| Thief | 16 | 64 | 0.897 | her Thief |
| White Mage | 15 | 60 | 0.600 | her White Mage |
| **total** | | **443** | | |
| Dark Knight, Warrior | | not rewritten | unchanged: already below Yuna on both means | |

`s` is the per-dressphere dial of the colour round (`s` was found per dressphere as the value that puts the idle's mean chroma and mean saturation on Yuna's and its 90th-percentile chroma inside the
Yuna and Paine range, never below 0.60). The LESS and MORE dials of that table (about 10 percent above and below AT TARGET's chroma) are not used by the final function.

## 2. The function

Source: [r47-rikku-colour/](r47-rikku-colour/) (`rikku_final.py` is the function and an installer; `rikku_colour.py` the colour maths; `rikku_colour2.py` the round-2 limiter). Run with `python -I`:
`python -I docs/handoff/r47-rikku-colour/rikku_final.py --src D:/pyrefly-art-r44 --dst <a new art mirror> [--dress songstress ...]`. It writes each file beside the destination and renames it over, so a destination
that is a hard link of the source gets a new file and the shared inode is never written. The copy writes the 75 files of Lady Luck and the Songstress **byte for byte** as installed (PIL 12.3.0, `compress_level` 6).

Per pixel, in OKLab / OKLCH (hue is never changed), on pixels that are not fully transparent:

1. **Limiter.** `C' = C / sqrt(1 + (C / 0.35)^2)`: the more chroma, the bigger the cut. It is blended in by a lightness weight `w(L) = smoothstep((L - 0.30) / 0.12)`, so **nothing below OKLab L 0.30 changes**
   (outlines, deep shadows, dark fabric: the old bytes are copied back), then scaled by the dial: `C2 = C + w (C' - C)`, then `C2 = C2 (1 - w (1 - s))`.
2. **Bright-band easing.** In the very bright band (L 0.78 to 0.92) `w` is eased by up to 55 percent; the glare control below does more of the work there.
3. **Accent relief.** Small isolated colour accents (eyes, beads, gems) get 40 percent of the reduction that big flat areas get. The weight is the share of loud pixels (chroma above 0.14) in a window of 0.9 percent
   of the image height, so it is the same at every tier.
4. **Skin floor.** Orange hues (30 to 80 degrees, L 0.45 to 0.92) are never pushed below `min(own chroma, 0.100)`, the 5th percentile of the skin of her FFX painting.
5. **Glare control.** Bright (L 0.55 to 0.82), high-chroma (0.04 to 0.10) pixels are pulled down in lightness by up to `g = min(0.06, 0.32 (1 - s))`; near-whites and near-greys are never touched. Eased 70 percent for yellow-green hues.
6. **Gamut mapping** by chroma at constant lightness and hue. **0 of 530,785,446 changed pixels needed it** (none was outside sRGB before the final rounding).
7. **The hair rule** (section 3).

Alpha is never touched; the colour under alpha 0 is never touched; the 34 `@3x` files that carry a `pHYs` chunk keep it.

## 3. The hair rule, and the one fix

The rule, as the driver gave it: on the yellow hue band the correction is capped at the LESS level of the same dressphere, so yellows keep about 10 percent more chroma than AT TARGET gives them.
The band is a hue weight (OKLCH hue in degrees): it **rises from 68 to 80, is full to 120, falls from 120 to 130**. It sits above the face skin (hue 59 to 66) and the body skin (hue 35 to 40) and below the greens
(shorts, eyes: 125 and up), so every pixel below hue 68 (the skin, the orange clothes, the orange strands of the hair) keeps AT TARGET byte for byte
(measured on the Songstress: 0 of 126,235 coloured pixels of hue 30 to 68 differ from AT TARGET).

**First pass (cap at each dressphere's own LESS dial).** Looked at in native 1x crops of every head: the Berserker, Thief and Black Mage (whose LESS dial is already the limiter alone) kept a golden hair,
but **the Gunner, Lady Luck and White Mage hair still came out a pale cream or sand**: their LESS dials (0.72 to 0.75) still take 14 to 17 percent of a golden's chroma and leave the 0.06 glare pull in.
A golden hair pixel (246,218,74) came out (233,213,116) at AT TARGET and still (235,213,106) on the first pass on those three, the pale cream the rule is there to prevent.

**The one fix.** The cap level is the level the three dresspheres that reach it already have, **the limiter alone (`s` 1.0, no glare pull), for every dressphere**: her hair is the same golden in all of them.
The same pixel now comes out (245,218,85); a pale gold (242,207,74) comes out (240,207,86); a pale lemon (252,252,170) stays (252,252,172).

Chroma kept on the hair and yellow pixels (hue 82 to 118, L above 0.7, chroma above 0.06; percent of the old chroma, idle 1x):

| | Alchemist | Berserker | Black Mage | Gunner | Lady Luck | Songstress | Thief | White Mage |
|---|---|---|---|---|---|---|---|---|
| AT TARGET (round 2) | 84 | 90 | 94 | 77 | 78 | 86 | 93 | 81 |
| first pass (own LESS dial) | 89 | 94 | 94 | 83 | 84 | 90 | 97 | 86 |
| **final** (installed) | **95** | **94** | **94** | **95** | **95** | **96** | **97** | **96** |

Honest limits, for the reviewer. (a) The **orange strands** of the hair (hue 50 to 68: the lower and back hair of the Songstress, Alchemist, Gunner, Berserker and White Mage) are below the band and keep AT TARGET:
they go from hot orange to a tan or peach (an orange strand (232,139,40) becomes (199,136,81)), so the hair reads golden on top and sandy underneath. Widening the band into them would also reach the face skin and the
orange clothes (the same hues), which is why it was not done. (b) **Lady Luck's yellow dress is a yellow fill** and keeps its yellow, so her mean saturation (0.559) ends further above Yuna's (0.439) than AT TARGET's
(0.501). (c) In the Alchemist's skirt flames (an orange-to-yellow gradient) the calmed orange meets the kept yellow through a tan-khaki middle: smooth, no step, but a middle that is duller than either end.

## 4. Before and after (idle 1x of each, measured on the installed files with the survey's measures on the 256 px thumbnail)

Mean OKLCH chroma and mean HSV saturation of the opaque pixels, before to after, with Yuna's value for the same (or nearest) dressphere; 90th-percentile chroma with the Yuna and Paine range of that dressphere.

| dressphere | mean chroma before to after (Yuna) | mean saturation before to after (Yuna) | p90 chroma before to after (range) | eye chroma kept | hair chroma kept |
|---|---|---|---|---|---|
| Alchemist | 0.143 to 0.107 (0.097) | 0.746 to 0.563 (0.544) | 0.214 to 0.161 (0.163 to 0.218) | 82% | 95% |
| Berserker | 0.129 to 0.108 (0.110) | 0.796 to 0.667 (0.639) | 0.206 to 0.173 (0.102 to 0.194) | 82% | 94% |
| Black Mage | 0.116 to 0.107 (0.109) | 0.678 to 0.616 (0.606) | 0.202 to 0.182 (0.147 to 0.184) | 95% | 94% |
| Gunner | 0.123 to 0.085 (0.068) | 0.681 to 0.494 (0.438) | 0.230 to 0.135 (0.123 to 0.155) | 71% | 95% |
| Lady Luck | 0.124 to 0.099 (0.086) | 0.708 to 0.559 (0.439) | 0.202 to 0.182 (0.140 to 0.165) | 78% | 95% |
| Songstress | 0.150 to 0.112 (0.107) | 0.743 to 0.574 (0.579) | 0.231 to 0.155 (0.099 to 0.184) | 86% | 96% |
| Thief | 0.117 to 0.104 (0.097) | 0.657 to 0.584 (0.544) | 0.182 to 0.152 (0.163 to 0.218) | n/a | 97% |
| White Mage | 0.114 to 0.079 (0.061) | 0.614 to 0.452 (0.286) | 0.213 to 0.123 (0.162 to 0.174) | 81% | 96% |
| Dark Knight (unchanged) | 0.069 (0.117) | 0.550 (0.691) | | | |
| Warrior (unchanged) | 0.079 (0.110) | 0.557 (0.639) | | | |

The hair rule moved the means a little off AT TARGET's (Songstress 0.110 and 0.564 became 0.112 and 0.574; Lady Luck 0.090 and 0.501 became 0.099 and 0.559; the rest by 0.001 to 0.003 in chroma);
the dials were **not** re-solved. The Gunner, Lady Luck and White Mage stay above Yuna's chroma on purpose (dial limit 0.60: matching her pale pink and white dresses would dull Rikku's eyes and blues; the dial
never goes below 0.60 because the Gunner's eyes and blues go dull and bright yellows go sepia). "Eye chroma kept" is the chroma of the green and turquoise pixels of the head band after over before; the Thief has too few.

**Skin** (Songstress thighs and midriff, the same 29,544 pixels before and after, against the skin of her FFX painting, chroma 0.100 to 0.129): median chroma 0.175 to 0.117, **83 percent inside the FFX range**
(1 percent before), median hue 37 degrees unchanged; the pixels below the range were already below it before (the floor leaves them alone). Her face (paler peach, 0.083) is unchanged by the function (0.0828 after).
**Whites** (near-neutral, lightness above 0.97): mean channel value 251.1 to 253.2 before and the same to 0.03 after; near-greys move by at most 0.0018 of OKLab lightness (8-bit rounding).

## 5. Integrity

Every one of the 443 files is checked three times: in the installer (before the rename), by `verify_pixels.py` (old and new decoded from disk), and by hash.

| check | result |
|---|---|
| alpha plane identical | 443 of 443 |
| RGB under alpha 0 identical | 443 of 443 |
| nothing changed below OKLab lightness 0.30 | 443 of 443 (lowest changed pixel: L 0.3000) |
| same size, RGBA 8 bit; the written file decodes to exactly the result | 443 of 443 |
| pixels outside sRGB before the final clip | 0 of 530,785,446 changed (of 736,147,396 opaque) |
| hue shift of changed coloured pixels (1x files) | mean 0.20 degrees, worst 99th percentile 1.04 degrees (8-bit rounding) |
| sidecars next to them | still the shared inode (not written) |
| size | 1,212,527,689 bytes to 1,138,743,715 |

## 6. Where everything is

- **The mirror.** `D:/pyrefly-art-r47`: hard links of every file of `D:/pyrefly-art-r44` (5,316 files, 12,435,796,080 bytes), then the 443 corrected files written beside the link and renamed over it.
  **Proved by hash:** every file of `D:/pyrefly-art-r44` still has its original sha256, size, inode and mtime (0 of 5,316 changed, against a hash taken before anything was written); in `r47` exactly the 443 intended files
  differ (new inodes, one link each) and the other 4,873 are the same inode and sha256 as `r44`'s; no temporary file is left; the release tree `D:/pyrefly-r39-int/public/art` is unchanged (5,316 files, inode, size and
  mtime as inventoried by the r44-art lane). `public/art` of this worktree is now a junction to `D:/pyrefly-art-r47` (it pointed at `r44`).
- **The backup.** `D:/Tools/pyrefly-art-backup/replaced/2026-10-14-rikku-colour`: the 443 old PNGs as real copies (new inodes), `MANIFEST.json` (path, sha256, bytes) and `README.md`; every copy was re-hashed
  against the hash of its source (443 ok, 0 bad), and again from the manifest.
- **The private art repo** (`D:/Tools/pyrefly-art-repo`, PRIVATE, pushed): `74c3b2f` archive of the 122 old 1x masters (`archive/2026-10-14-rikku-colour-before`, `--verify` passes), `37a598c` the 122 new 1x masters in
  `current/` with `CURRENT-MANIFEST.json`, `6e00776` its README. The old tiers are only in the backup folder above; the new tiers only in `D:/pyrefly-art-r47` (no Release snapshot of them yet).
- **The record.** [rikku-colour-install-2026-10-14.json](../target/rikku-colour-install-2026-10-14.json): every file's old and new sha256 and size, the dial, the numbers and the checks.
- **Sheet.** `docs/screenshots/r47-rikku-colour/rikku-final-before-after.jpg` (the picture above).

## 7. The records this commit changes

| file | change |
|---|---|
| `docs/target/approved-hashes.json` | the **118** pins of replaced files (116 base masters and the `idle@2x` of the Alchemist and Thief) moved to the new hashes, the old record inside `supersedes` with where its bytes are; 826 other pins untouched; the other 325 replaced files carry no pin. `verify-approved` (`ROOT=D:/pyrefly-r47`): **916 ok, 0 mismatched, 0 missing** (868 approved, 48 judge-locked) |
| `docs/target/pose-measure.json` | only the **122 `sha` lines** (`tools/posescale/measure.py measure <8 subjects> --write`, then `table`, which writes nothing new); every measured number is the same, as the alpha did not change. `node tools/pose-scale-check.mjs`: PASS (it listed 94 stale records before) |
| `tests/fixtures/exp-leblanc/ch6-art.json` | **95 hash lines** (Chapter VI draws six of the changed dresspheres; regenerated with `tools/exp-art.mjs`'s `snapshot` against the new mirror). The hidden Leblanc chapter's namespace stays frozen as it was (its own copies, untouched); `ch6-art-pre-repair.json` needs no entry |
| `docs/target/rikku-colour-install-2026-10-14.json`, this note, `r47-rikku-colour/`, the sheet, `CHANGELOG.md` | new records |

Checks: `tsc` clean; the 189 files of the r44-art lane's lists (art, pose, manifest, chapter, engine, fx and continuity tests) plus `entrance-plan-framing` and `exp-art-sync`: **191 files, 3,194 tests passed, 2 skipped**
(the `art-url-base` scan of a build, which needs a `dist/`); `exp-leblanc.test.ts` 33 of 33. **The whole suite once, after the art changed** (`vitest run`, 8 workers, 17 minutes): 1,227 files and 19,187 tests, 19,106 passed, 73 skipped and 1 todo; **7 tests in three files timed out at
their 15 s limit while the machine was busy** (the advisor-floor and advisor-note walks and the repo scan of live-url-follows-host), and all 63 tests of those three files pass run alone (85 s); nothing else failed.
After the run the mirrors were checked again (0 of 5,316 files of `r44` changed, exactly the 443 differ in `r47`, the release tree unchanged), `verify-approved` still reads 916 ok, and no tracked file was touched by the tests. No build was made (`npm run build` and `tools/gen/manifest.mjs` were not run: a colour-only change leaves the manifest as it is);
no browser, server or GPU was used (`tools/posescale/measure.py` needs scipy, so it ran under ComfyUI's embedded Python as a plain interpreter: numpy, scipy and PIL only; ComfyUI itself was not started or called).

The experimental chapter's own Rikku paintings (`exp-leblanc-rikku-*`) were **measured and not changed**: they are the FFX-2 paintings as release 39.3 shipped them, so they carry the old colours
(idle 1x, mean chroma and saturation: Alchemist 0.142 and 0.74, Black Mage 0.115 and 0.67, Gunner 0.123 and 0.68, Songstress 0.150 and 0.74, Thief 0.114 and 0.58, Warrior 0.079 and 0.56, White Mage 0.114 and 0.61;
the Thief's is already a little quieter than the FFX-2 one). If the hidden chapter should follow, it is the same function over its own folders, a decision for the driver.

## 8. How to revert

1. Point the junction back: remove only the junction (`cmd /c rmdir D:\pyrefly-r47\public\art`, never `/s`), then `New-Item -ItemType Junction -Path D:\pyrefly-r47\public\art -Target D:\pyrefly-art-r44`.
   `D:/pyrefly-art-r44` and the release tree still hold every old file; the backup folder holds exact copies of the 443.
2. Restore the records: `git revert` this commit puts back the 118 pins, the 122 `sha` lines and the 95 fixture hashes (each superseded pin also carries the old record). Then `ROOT=D:/pyrefly-r47 node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`
   must read 916 ok, and `node tools/pose-scale-check.mjs` PASS.

## 9. What waits

- **The Rikku renders of art run 8 were held for this decision.** None of them is in this install (nothing here came from run 8); the function and dials above are the colour level they would meet.
- Not done here, on purpose: the decisions and actions ledgers and `NOW.md` (the driver records them), a build, a review, a deploy, putting these files into the release tree.
- For the review of this candidate: the hair (section 3, limit a), Lady Luck's yellow dress and dusky tan skin (the strongest dial, 0.60), the Gunner's eyes (71 percent of their chroma kept, the lowest) and the Alchemist's flames.
