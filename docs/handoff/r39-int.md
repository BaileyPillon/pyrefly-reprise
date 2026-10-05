# r39-int: release 39 integration (2026-10-04)

Branch `r39-int` (worktree `D:/pyrefly-r39-int`, pushed to `origin/r39-int`, never `main`), a Sonnet sub-agent of the driver session. Nothing here is deployed
and nothing is merged into `main`: the driver validates, pushes `main` and deploys. Bailey, 2026-10-04, verbatim: "I need another pass on visuals and maxing
out eye candy ... The critic needs to be involved as well and I need updated scores. I need super high resolution now. DO NOT hold back." and "Get this release
on the cloudflare site." The driver's list of what may merge is `D:/Tools/pyrefly-scratch/2026-10-04/r39-int/READY.txt`; every line of it is in the table below.
Game case: **both games, shared plumbing and delivery tooling**; the per-item cases of each merged lane are unchanged and named in the table.

The earlier integrator pass on this branch (the merge with release 38, the art install, the build gates, the fidelity repair) is the last sections of
[r39-hires-engine.md](r39-hires-engine.md); this note starts where it ended (`d7ac0ccf`).

## Merges (in the order of READY.txt; every one `git merge --no-ff <sha>`, never a rebase)

| # | Ref and sha | Merge commit | Game case | Conflicts |
|---|---|---|---|---|
| 1 | origin/main 6763fc24 (release 38 on echoesofspira.com, the Cloudflare tooling, D-418 and D-419, A-0406 to A-0408, the Camera Lab plan) | dd351279 | both (hosting, records) | none |
| 2 | r39-hires-engine d6810315 | none: "Already up to date" | both | r39-int was cut from d6810315 and d7ac0ccf is its repair, so the branch already contains it |
| 3 | origin/r39-art ea732eb5 (six held backdrop masters re-made and un-held, the two D-315 2x masters, Evrae's ten masters) | 2f3e24b8 | Gagazet, Garden of Pain, Via Purifico, Evrae FFX only; Road to the Farplane FFX-2 only | none |
| 4 | origin/r381-guide a41d1e5e (the strategy guide, check PASS) | cd53704d | FFX chapters follow the FFX guide, FFX-2 chapters the FFX-2 guide | none |
| 5 | origin/r381-ui-floor 23bf2c83 (14 px floor, run-time Overdrive clamp) | 84ff24cd | the clamp FFX only, the floor both | none |
| 6 | origin/r381-lady-luck c0be1147 | b39ed8d5 | FFX-2 only | none |
| 7 | origin/r39-uifix 620fe283 (interface fixes, FFX Defend on Triangle, the Shift fix) | 6f866df8 | Defend FFX only, the advisor ladder both | none |
| 8 | origin/r39-judg 9eba945a (round 21 judgment calls J, K, L, M) | 7cdd2b65 | J Swordplay tiers FFX only; K TEXT SIZE in the FFX-2 HUD and both pauses; L a look brings its parts, M the first-run quote: both | **2 files** (below) |
| 9 | origin/r39-looks 944cfb4a (F plus sharpness default, Chapter III option 1) | 1d548bf3 | F both; Chapter III FFX only | none |
| 10 | origin/r39-natus 72f76b3b (Chapter X pinned colossus master, option N) | 0e2a27f4 | FFX only | **4 files** (below) |
| 11 | origin/r39-visfix 285be5b1 (PR-0334 twirl start, PR-0314 dressphere shot, PR-0364 run-in truck, PR-0344 Bevelle conduits; PR-0367 Evrae cut) | 99fc3d51 | FFX-2 except PR-0367 (FFX) | **1 file** (below) |
| 12 | origin/r39-posescale 03821f57 (pose registration: per-pose scale, stance and upright tables; Tidus, Yuna, Auron heads and every hero's feet) | 7c9e88a3 | both | none (but see "Found on the way": one record re-measured) |

Lines 8 to 12 appeared in READY.txt after the first batch. Also done from READY.txt: `FIX guide-text R39C-01` (1d228944) and `ART edge-E` (the art section).

## Conflicts and how each was resolved (both sides' intent kept)

Resolution scripts are in `D:/Tools/pyrefly-scratch/2026-10-04/r39-int/` (`resolve-judg.mjs`, `resolve-judg-2.mjs`, `resolve-natus.mjs`, `extract-framing-types.mjs`); each
refuses any shape other than the one it was written for.

### r39-judg (merge 7cdd2b65)

- `src/ui/common/EnemyIntent.ts`, one hunk: r39-uifix added the `padToggle` option, r39-judg widened `density` to `'full' | 'brief' | (() => 'full' | 'brief')`. Both fields kept.
- `src/ui/common/StrategyGuide.ts`, three hunks: r381-guide had **rewritten the guide as a scrolling sheet** and removed the old rung, whole-block cut and MORE machinery
  (`refit`, `measureUnit`, `glyphBottom`); r39-judg's call K (TEXT SIZE in FFX-2, PR-0270) had edited that machinery and `layout()`. The sheet keeps its own `layout()`: its
  room is the stage room divided by the scale the column is drawn at (`drawnScale`; FFX at any TEXT SIZE, FFX-2 at 100 percent). FFX-2 at 115 and 130 percent takes judg's
  `railRoom`, the measured step down (`--sgd-shift`) and the give-way (`sgd--squeezed`) through `grownBy`, kept **verbatim** because `tests/unit/text-size-ffx2-hud.test.ts`
  pins two of its source lines. The old machinery stays gone (hunk 3 takes the sheet's `scrollToStart`). **One judg edit has no home now:** hiding the encounter's title line
  when even the last density rung overflowed at 130 percent ("NEXT / YUNA with its move cut off", Chapter IV). A sheet that scrolls cuts nothing, so there is nothing to attach it to; if a
  review finds the guide's title line costing room at 130 percent, that is where to look. `text-size-wide.css` of both sides merged cleanly and already expects `--sgd-shift` and `sgd--squeezed`.
  Checked: tsc clean, the 11 test files for the guide, TEXT SIZE and the intent slab pass (227 tests).

### r39-natus (merge 0e2a27f4), four files in `src/engine/fx/mix/`

r39-looks (merge 1d548bf3, already in) and r39-natus had each moved the colossus separation out of `framing.ts` (it was at 398 lines) into a new `separate.ts`, and each added optional
fields to the staging table and the framing report.

- `separate.ts` (add/add): natus's `separate(...)` kept whole. It is looks' `separateMaster` plus the table's pinned mode and the boss lead, and with `pinned = null` and `lead = null` it runs the
  same search step for step (checked by reading the two loops side by side), so `separateMaster` and its delegating private method are gone and `decide()` calls `separate()` directly.
- `framing.ts`: natus's imports (`colossusPin`, no `MasterClass`), looks' `calmSpec` field beside natus's `pinned`, `textSize` and `windowWatch`; looks' `menuCalm.arm`, `standFor(..., false)`
  and `anticipateView` lines came through unconflicted. The merged file was 405 lines, so the type-only `Try` and `Decision` moved unchanged to `framingTypes.ts` (new; framing.ts is 386).
- `framingReport.ts`: looks' `follow?: true` on the stand report plus natus's `pin`, `bossPx`, `planMs`.
- `stageTable.ts`: `Row` keeps `calm` (looks) and `colossus` (natus); `standFor` returns both and keeps looks' `follow` slots; `readStand` returns `follow` in its report and `colossus` beside it.
  The table now has **three rows** (Chapter II, Chapter III behind `CHAPTER_III_STAGED`, Chapter X), so `tests/unit/fx-mix-menu-calm.test.ts`, which pinned the row list to two chapters, names `seymour-natus` too.
  Checked: tsc clean; the 51 fx-mix, stand-reach and engine test files pass (670 tests).

### r39-visfix (merge 99fc3d51)

- `src/engine/Backdrop.ts`, one hunk: r39-hires-engine replaced the fixed 1536 px cap on a masked parallax layer (`LAYER_MAX_WIDTH`) by the device's `ArtBudget.bandPx` and rewrote `maskBand`'s comment;
  r39-visfix (PR-0344, the Bevelle conduits' side feather, FFX-2 only) added `sideFeatherStops` right after that constant. The constant stays gone (nothing else read it), `sideFeatherStops` is added where
  `maskBand` already calls it, and the hires comment documents `maskBand` as before. Checked: tsc clean; the 72 test files that touch the visfix lane, the backdrop, parallax layers or Bevelle pass (1,091 tests).

## Found on the way (not in the brief; each fixed so the suite is green)

1. **Lady Luck's paintings need measured head rows** (`89d4b423`, FFX-2 only). Installing her art made `ui-portrait-face-crop.test.ts` fail: "painted dresspheres with no measured head row: yuna-lady-luck, rikku-lady-luck,
   paine-lady-luck" (the test reads every owned dressphere of Chapters IV and V; r381-lady-luck installed no art, so it passed there, and its handoff does not mention the table). Three rows added to
   `src/ui/common/face-crops.json`, each read off the installed `idle.png` with the repo's own probe (`tools/portraits/measure-face-crops.mjs probe`, a 10 px grid labelled in file pixels at 6x; each iris to about a pixel; the heads are
   rolled, so `ipd` is the diagonal): Yuna 443x1164 (fx 0.4393, fy 0.1219, ipd 0.1158), Rikku 337x1174 (0.5905, 0.168, 0.1546), Paine 495x1216 (0.557, 0.1442, 0.1077). The 132 tests of the file pass, and the acceptance sheet
   (`measure-face-crops.mjs accept`) shows each new tile's eyes on the house line. Worth a glance by the critic's eye on the three party-plate faces.
2. **Tidus's pose records re-measured** (`9b01add8`, FFX only). After the posescale merge `pose-scale-art.test.ts` failed on nine of Tidus's twelve poses: "the painting changed since it was measured (sha256 differs)". The cause is D-380 (the trapped white inside his hair
   spikes, cleaned on this branch only, 0996801a): alpha-only, so the bytes changed and the head and stance did not. Re-ran the lane's own `measure.py measure tidus --write` (embedded interpreter, numpy, no GPU) with the reviewed
   scales as they were: only nine sha lines in `docs/target/pose-measure.json` move; `measure.py table` leaves the three `poseRegistration*.ts` files as they were; `node tools/pose-scale-check.mjs` PASS. If the posescale lane
   later re-measures other figures on the shared tree, its records for Tidus there carry the old hashes until D-380 ships.

## FIX guide-text R39C-01 (FFX only; 1d228944)

The Seymour Flux guide told the player "Shell or Defend" against Total Annihilation, a Magic attack; `research/ffx-combat-core.md` says Defend halves physical damage only (an engine run: 3,855
plain, 3,855 with Defend, 1,925 with Shell). `src/data/guides/seymour-flux.ts` (both WATCH lines) and `src/data/guides/docs/seymour-flux.ts` (the reading view; the brief called it
`docs/seymour-flux.ts`) now say Shell is the answer and Defend will not help, with the citation markers unchanged. No existing test pinned the old strings (the WATCH test matches `/Shell|Defend/`);
`tests/unit/guide-seymour-defend-magic.test.ts` (new) pins the data fact (Total Annihilation is magic) and the three strings.

## Tooling (release 39 must-dos from the Cloudflare switch; both games, shared plumbing)

1. **The live byte check allows Cloudflare's one beacon (95e8a1c8; CHK-017, D-418, critic finding LV-1).** `verifyLive` (`tools/artifact-manifest.mjs`, used by `verify-live` and by the deploy's own comparison) now
   fetches every HTML page a second time with a browser `Accept` (`BROWSER_ACCEPT`). A generic `Accept` must equal the artifact's file exactly (as before); the browser's page must equal it once exactly one beacon element
   and the one line feed Cloudflare writes after it are cut out (`withoutCloudflareBeacon`). The element is matched precisely: `<script>` with `src` = `https://static.cloudflareinsights.com/beacon.min.js` (optional `/v<hex>`),
   a `data-cf-beacon` attribute and no attribute outside `type src integrity crossorigin defer async nonce data-cf-beacon`; a second beacon, another host, an extra byte or any other difference is a FAIL. The report names what was removed
   (`browserPages`). **Run read-only against the live release 38** (sample 0: the page, the bundles): PASS, "identical to the artifact once Cloudflare's Web Analytics beacon is removed (366 bytes and the line feed after it)";
   the exact bytes were measured first (3,939 served against 3,572; the 366-byte element plus one LF is the whole difference). Removing the element alone does not restore the page; the LF is part of what Cloudflare adds. 11 new tests
   (`tests/unit/verify-live-beacon.test.ts`, a fake host that injects as Cloudflare does); CHK-017's text in `critic/CHECKS.md` says it.
2. **Art URLs carry `%40` (5c58894b; LV-2).** `shippedArtUrl` (`src/engine/ArtShipped.ts`), the one place a master's name becomes the URL the browser is handed, writes `%40` for every `@` in the path of an art URL (with a build
   list or without one, query and hash untouched, idempotent). `logicalArtUrl` reads either form back to the master's own name; `sidecarUrlOf` and `tryLoadMeta` ask for `idle%402x.json`; `scaleOfUrl` reads the scale through
   `logicalArtUrl`. **Vite's static middleware (dev and `vite preview`) decodes with `decodeURI`, which leaves `%40` alone, so an encoded master was answered 200 with index.html** (measured on a dev server before the fix:
   `text/html`, 5,240 bytes). `tools/vite-art-at.mjs` (new, a serve-only plugin ahead of Vite's middleware, in `vite.config.ts`) writes `@` back in the path of an `/art/` request; GitHub Pages and Cloudflare decode the path themselves.
   `tools/art-play-audit.mjs` now decodes a request's path before it looks a file up and fails any art request that carries a raw `@`. Tests updated where they pinned tier URLs (`art-shipped`, `r39-art-tiers`, `r35-art-keys`: the
   expected URL is the wire form) and new ones for the wire form and the plugin (`vite-art-at.test.ts`). **Proof on a dev server** (real keys, headless GPU Chromium, 2560x1440, Chapter I and IV; harness `turns-final.mjs`):
   0 raw-@ art requests in either chapter, 46 and 14 master files asked as `%40`, every art response 200 (246 and 227), none 3xx, 0 console errors; the only non-2xx check that fails is the two `net::ERR_ABORTED` warm-up
   fetches the live build also makes. The production-build proof is in the gates below.
3. **`_headers` is allowed, vetted, and not served (44dc6dca).** `checkHeadersFile` (`tools/deploy-host.mjs`) accepts exactly one rule: the pattern `/assets/*` with `Cache-Control: public, max-age=31536000, immutable`, each once (comments and
   blank lines are free; any other pattern or header, a placeholder, a `! Name` detach line, a repeat or an empty file is refused). `prepareCloudflareUpload` reads the file through `deps.readFileSync`, lists it in the artifact like any
   other file, does not count it as an uploaded file, and still refuses `_redirects` and `.assetsignore`. The live byte check never downloads a host-read file (`HOST_READ_FILES` in `artifact-manifest.mjs`; `selectForVerification`
   skips it), and reports `assetCacheControl` (what the first hashed bundle was served with; informational) so the first live check shows whether the rule is applied. **No `public/_headers` is added: here is the proposed file for the driver
   to review** (`tests/unit/deploy-headers.test.ts` holds these exact bytes and proves the gate passes them):

   ```
   # Vite names every file it emits under assets/ with a content hash (index-<hash>.js, .css, the workers), so a bundle never
   # changes under its name and can be cached for a year. index.html, which names the bundle, and everything without a hash in
   # its URL (art, fonts, depth maps) keep the default: max-age=0, must-revalidate with an ETag.
   /assets/*
     Cache-Control: public, max-age=31536000, immutable
   ```

   Why only that: the shipped files under `assets/` in release 38 are `index-<hash>.js`, `index-<hash>.css` and two `worker-<hash>.js`, all hashed by Vite's default naming; **art URLs carry no content hash** (`artUrl` appends no `?v=`; `_headers` cannot match a
   query string anyway), and neither do the fonts or the depth maps, so art stays on Cloudflare's default (`public, max-age=0, must-revalidate` with an ETag, so a return visit revalidates each file with a 304). To cache art for
   a year its URL would need a hash from the artifact manifest in its name: a code change, not done. To ship the rule: save the block above as `public/_headers`, build, deploy; the gate vets it, the manifest lists it, the live check skips it.
   8 new tests; the existing gate tests are unchanged and pass.
4. **D-402 (d348af03).** `tools/deploy-pages.mjs` no longer holds a personal address: the legacy gh-pages commit identity is read from the repository root (`git config --get user.name` and `user.email`; a fresh repo in `dist-release` inherits
   no configuration), which D-402 made his GitHub noreply address (checked: the last commits carry it); a repository with none configured gets the name "Echoes of Spira deploy" and an empty address, which git accepts ("<>", checked in a scratch
   repo). `git grep` for the old address finds nothing left in the tree. Older commits keep what they have: history is not rewritten.
5. **`CoachMark.ts` 415 to 377 lines (64e23636).** The three type-only declarations (`CoachMarkOutcome`, `CoachMarkOptions`, `CoachGuide`) moved to `src/ui/coach/coachTypes.ts` and are re-exported from `CoachMark.ts`, so no importer changed;
   the 21 coach test files (161 tests) pass.

## Art installed on this tree (`public/art` is gitignored; a production build needs it)

| What | Result |
|---|---|
| P1 approved art: `approved/2026-10-04-r39-art/install.mjs --repo=D:/pyrefly-r39-int` (dry run, then `--apply`) | the two 2x masters (Rikku Dark Knight, x2-Anima) and their sidecars installed (the old masters backed up first); the manifest regenerated; the set `bailey:2026-10-01-art` already locked the hashes |
| `hires-install.mjs --lib D:/Tools/pyrefly-art-backup/hires-r39-art --only backdrops/,characters/evrae/` (dry run, then `--apply`) | 20 to install (15 hard links, 5 `@3x` derived, 146.7 MB), 1 already installed; the manifest lists `gagazet`, `garden-of-pain`, `road-to-the-farplane` (and `-links`), `via-purifico` and `title` at 2x, and Evrae's `attack`, `breath-charge`, `hurt`, `idle`, `idle-near`, `ko` at 2x, 3x and 4x (`idle-far` at 2x) |
| Lady Luck (FFX-2 only), following `r381-lady-luck.md`: 45 paintings and 45 sidecars from `D:/Tools/pyrefly-art-backup/candidates/2026-10-03-day/lady-luck/install-ready/` (`install-lady-luck.mjs` in the scratch folder: every source checked against the package's manifest sha256, copied as NEW files, nothing replaced) | all of set E (D-373, D-388: the 800 MB line no longer binds on Cloudflare, so nothing is parked); manifest 104 subjects and 696 poses; the 45 paintings are locked in `docs/target/approved-hashes.json` as the set `bailey:2026-10-03-lady-luck` (commit 52670888; Bailey's D-363 words are the set's `words`) |
| `verify-approved` (`ROOT=D:/pyrefly-r39-int`) after each install | 762 ok, then 807 ok after Lady Luck (759 approved + 48 judge-locked), **0 mismatched, 0 missing** |

| `ART edge-E` (both games), step 1: `hires-install.mjs --lib D:/Tools/pyrefly-art-backup/hires-E --replace-from D:/Tools/pyrefly-art-backup/hires-alpha-fixed --park D:/Tools/pyrefly-scratch/2026-10-04/r39-int/park-preE --only characters/` (dry run, then `--apply`; log `D:/Tools/pyrefly-scratch/2026-10-04/r39-int/logs-edgeE-apply1.txt`) | dry run and apply agree: **1,779 to install (1,187 replaced + 592 `@3x` derived, about 6,893 MB as written), 24 skipped** (9 "already installed, not the old library's file, so kept", 15 "status skipped"); the park folder holds only `parked.json` (nothing needed copying: the replaced names are hard links whose data stays in the library); D: free space was 45 GB before and after |
| step 2: the same with `--replace-from D:/Tools/pyrefly-art-backup/hires-r39-art` (Evrae's re-made masters; park `park-preE-evrae`) | **14 to install (9 replaced + 5 `@3x` derived, 63.5 MB), 1,202 skipped** (1,187 already installed, 15 status skipped) |
| step 3: `node tools/gen/manifest.mjs` and `verify-approved` | manifest unchanged (104 subjects, 696 poses, 29 backdrops); `verify-approved`: **807 ok (759 approved + 48 judge-locked), 0 mismatched, 0 missing**, so no approved 1x painting was touched; spot checks: the installed Tidus 4x, Evrae 4x and Bahamut 2x are byte-identical to `hires-E`, x2-Anima's 2x stays the approved D-315 master |

## Gates, build and the headless smoke

(filled in at the end)
