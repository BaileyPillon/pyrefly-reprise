# r47-rc: the ACCESSIBILITY tab on top of the r46 candidate, and FOC46-06 (the shipped sidecars carry only what the game reads)

Branch `r47-rc`, from `origin/r46-rc` ca9fd0b4, worktree `D:/pyrefly-r47`. Written 2026-10-14 by a Sonnet sub-agent of the release driver. **Not deployed, no review run:
the deep review of this candidate comes first** (it changes save data: `Settings` gains two fields). Game case: **both** for the tab, REDUCE FLASHES, the sidecar
projection and the gate; per piece below for COLOUR VISION and the flash sources (rule 14).

What the driver asked, 2026-10-13 to 14: "yes deploy it, ill go with all your recommendations" (OPT-B, NO-KEYS, decision 61d; the tab ships as built, after the critic's deep
review because it changes save data) and "the public site carries no personal or PC details" (FOC46-06, the driver's call: shipped sidecars carry only the fields the game reads).

| Commit | What |
|---|---|
| `16c8de46` | `git merge --no-ff origin/r44-access` (29bc04a8, cut from 7b2582e7, 86 commits before r46-rc): the ACCESSIBILITY tab, REDUCE FLASHES over 22 sources, COLOUR VISION over four groups. 80 files of the lane, 2 textual conflicts |
| `9c87bd87` | COLOUR VISION reaches the PREP-A phone pages' Garment Grid gates (FFX-2 only): a gate site the lane never saw |
| `701e4cb9` | FOC46-06: sidecars shipped as exactly the fields the game reads, and the gate's two new checks |
| (this note, CHANGELOG, three frames under `docs/screenshots/r47-rc/`) | records |

Read the lane's own note first: [r44-access](r44-access.md) (what the tab is, the 22 flash sources and the four colour groups, the save fields). This note covers what the merge needed, what the lane never saw, and the privacy fix.

## 1. The merge

Two textual conflicts, both "keep both sides" (no judgement on behaviour needed):

| File | r46-rc side | lane side | Resolution |
|---|---|---|---|
| `src/app/screens/BattleScreen.ts`, the `PaintedStage` options | `planOwed: framingPlanOwed` (CHAPTER FRAMING's plan, FOC44A-05) | `reduceFlashes: readReduceFlashes` (PR-0032) | both lines, in that order |
| `src/ui/ffx2/party-prep/panels.ts`, imports | `prepPhoneFold`, `phoneViews` (PREP-A, phone prep) | `gateLetter` (the letter COLOUR VISION prints on a gate pip) | all three imports |

Four more files changed on both sides and merged without a conflict (`BattleMoments.ts`, `BattlePresenterBeats.ts`, `BattlePresenterPorts.ts`, `BattlePresenterStage.ts`): the r46 side added the
shot-director seam and E-PYRE's entrances, the lane added `reducedFlashes`/`softFlash`/`reduceFlashes`. Nothing the lane changed in the pause tabs, the options rows, the comfort settings,
`SaveData.ts`, `saveComfort.ts`, the stylesheets or the audio build was also changed on the r46 side (the file lists intersect in those six files only). `tsc` clean on the merge (tsc 7.0.2, 3,089 files).

## 2. What the lane never saw (r46's features against REDUCE FLASHES and COLOUR VISION)

The lane was cut from r43-rc. Scan of the r46 side (`7b2582e7..ca9fd0b4`, 144 changed files under `src/`) for flashes, pulses, animations and colour pairs:

| Newer feature | A flash or a pair? | Covered? |
|---|---|---|
| **E-PYRE gather** (bosses and aeons arrive as pyreflies; `engine/entrance/StageEntrances.ts`) | one closing flash on the figure (`LAND_FLASH`, warm gold, 260 ms, peak 0.8); the motes are drifting points, no strobe | **Yes, by the lane's wiring, no new code.** E-PYRE already asks `host.reduceFlashes()` (`BattlePresenterStage` -> `opts.reduceFlashes`, the option the lane's `BattleScreen` now fills) and leaves the flash out entirely (stricter than the rule's 35 %). Pinned by `tests/unit/engine/entrance-stage.test.ts` ("REDUCE FLASHES leaves out"). REDUCE MOTION gives the plain fade, LOW EFFECTS drops the motes (unchanged ids and keys) |
| **PREP-A phone pages** (`ui/ffx2/party-prep/phoneViews.ts`, `prep-phone-*.css`) | the Garment Grid's four gates as 12 px diamonds in the same four colours the lane's `gates` group collapses (green against yellow under protanopia): a red/green pair the lane's rules define | **Covered here** (`9c87bd87`): each pip carries `data-gate` (R, G, B, Y), and under `html[data-colour-vision]` takes `--cvd-gate-r|g|b|y` and becomes a 16 px tile printing its letter; OFF changes nothing. Real browser, 390x844 touch: red-green gives `rgb(213, 94, 0)`, `rgb(0, 158, 115)`, `rgb(0, 114, 178)`, `rgb(240, 228, 66)` with letters; the attribute removed gives today's colours, 12 px, no letter |
| PREP-A stat deltas (green up, red down) | a green/red pair, but each carries a triangle and the number, the desktop Stats tab printed them in the same colours before the lane, and they are not one of the four groups | **Not touched. For the reviewer** |
| Audio lanes (new takes, fanfares, results tunes) | sound only; the one UI change is the jukebox list hiding retired tracks | n/a |
| **Hidden Fayth chapter** (`engine/ffxcam`, `engine/ffx3d`, `scenes/exp-fayth-*`, the shot-director seam) | camera paths only: no flash, no fade to white, no colour pair; the 1.5 s fade of Evrae in a range shift is a fade. The real-model skin needs the owner's local files and is dev-only | n/a for both. **For the reviewer:** these files read no comfort setting, so REDUCE MOTION's effect on the director's camera moves is whatever `BattleMoments` does for the beats it keeps (not changed by this lane) |
| Chapter-board thumbnails, Overdrive mode rows, first-run guide fixes, Yunalesca and Chapter II data | no flash, no colour pair, no animation | n/a |

`BattleScreen.ts` still passes `reduceFlashes: readReduceFlashes` into the stage (checked after the merge), so the five rules that existed unset before the lane and E-PYRE's gate are all live now.

## 3. FOC46-06: the sidecars

**The finding (the review of r46-rc 0b0571d1):** the shipped sidecars still carried provenance prose that is no path: the owner's first name (969 files) and links to private claude.ai pages (620).
**The driver's call:** shipped sidecars carry only the fields the game reads.

**The list, re-checked from the code** (`tools/art-sidecar-fields.mjs`, `SIDECAR_FIELDS`; the previous agent's ten, none added). Every `.json()` read in `src/` is one of seven; no `FileLoader`, `import.meta.glob`, import of `public/art`,
`Object.keys` or spread over a parsed sidecar (a guard test now pins the loader's `raw` access to named fields):

| Reader | File | Fields |
|---|---|---|
| `PaintedArt.tryLoadMeta` (every pose and backdrop; `fx/mix/twirl.ts` through it) | `<painting>.json` | `width`, `height`, `baselineY`, `scale`, `anchorY`, `facing`, `seed`, `prompt` |
| `ui/ffx/portraits.ts` | `characters/<id>/idle.json` | `width`, `height` |
| `ui/common/portrait.ts` | `portraits/<id>.json` | `focal` (`fx`, `fy`, `ipd`) |
| `ui/common/chapterPanel.ts` | a pause plate's sidecar | `focal` (`x`, `y`) |
| `ui/common/restPoses.ts` | a rest pose's sidecar | `headTop` |
| `engine/ArtManifest.ts`, `app/screens/pause/livingParts.ts` | `art/manifest.json`, `art/portrait-parts/manifest.json` | not sidecars; shipped as they are (no path in either) |

Survey of the master folder: 1,263 art JSON = **1,261 sidecars (a painting beside each) + the 2 manifests**; 309 distinct keys across them, 299 outside the list; `focal` holds only `x`, `y` (35 files), `headTop` a pair (68), no integer beyond 2^53
among the kept keys; 3 backdrop stand-in sidecars have none of the ten and ship as `{}`.
**`seed` and `prompt` are copied into `PoseMeta` by `tryLoadMeta` and no code reads them from there** (searched in `src/`, `tools/`, `tests/` and `critic/`: no `meta.prompt` or `meta.seed`; the only other uses of a `PoseMeta` are named fields and two spreads that copy it). They stay because the loader reads them.
Dropping them is a three-place change if the driver wants the prompt text off the site: `SIDECAR_FIELDS`, the two lines in `tryLoadMeta`, and the `READERS` table and its `used` list in `tests/unit/art-sidecar-redact.test.ts`.

**What "prompt" holds** (reported, not edited): 1,027 sidecars carry one (774 distinct, 141 to 3,815 characters): about 960 are Stable Diffusion / ComfyUI prompts (weights such as `(broken horn:1.6)`, escaped brackets) and 67 are image-model prompts for the experimental Leblanc
chapter ("Edit the supplied image... Input images: Image 1 is the approved...", constraints such as "original invented art, no retail Square Enix assets"). **None names the owner or any real person that a search for the owner's names, handles and capitalised words could find (the capitalised words are game characters and places), and none holds a link of any kind, an e-mail address, a drive letter or a profile path.** One
(`art/portraits/seymour-natus.json`) names a repository-relative file, `docs/concepts/chapters/natus/recipes.json`; the characters of the game (Yuna, Rikku, Paine, Ormi, Dr. Goon...) and "Square Enix" appear as text.

**The projection** (`projectSidecarText`, one function for the build, `art-derive verify`, the gate and the tests): a TEXT projection, not parse-and-stringify (a ComfyUI seed can be 20 digits). Kept keys in the master's order; each value the master's own tokens (numbers as spelt, escapes, `null`);
white space dropped only between the tokens of an object or array value; one key per line, two spaces, LF, final newline; `{}` when nothing is kept; idempotent; a text that is not a JSON object is a build error naming the file; a duplicate key keeps the value `JSON.parse` would give it. The path replacement of r46-fix
(`redactJsonText`) stays for any non-sidecar art JSON (the two manifests). A kept field that holds a local path or a claude.ai link fails the build (it is never rewritten, and no value is ever printed).

**The gate** (`node tools/dist-local-paths.mjs --dir <build>`, run by the deploy right after the art audits): as before (drive and profile paths), plus `link` (claude.ai in any shipped text file; none is legitimate), `sidecar-key` (a top-level key outside the list in an `art/**/*.json`
sidecar; the key is printed only when it is a plain identifier) and `sidecar-shape` (a sidecar that is not an object). `art-derive verify` compares every shipped art JSON with `shippedArtJsonText(master)` and also proves the split against the master folder (a sidecar has a painting beside it, a non-sidecar has none), so a new JSON file
under `art/` that is not a sidecar fails the deploy's art gate instead of silently losing its keys: add it to `NON_SIDECAR_ART_JSON`.

**Result on the production build** (`BASE_PATH=/`, vite from PowerShell, output `M:/pyrefly-builds/r47/dist`, 358 s): 1,261 sidecars written, 7,884 keys kept, 23,935 left out, **4.37 MB -> 1.11 MB** (3.25 MB less); the two manifests byte for byte; 3 sidecars are `{}`.
Gate: **0 hits in 1,291 text files**; negative control: 40 real master sidecars copied into a build-shaped folder give 999 hits of all three kinds (`sidecar-key` 846, `drive` 129, `link` 24).

**One more place the owner's first name is shipped, not in a sidecar (for the driver's decision, not changed):** `src/ui/common/face-crops.json` has a `note` per portrait crop, and Vite bundles the whole file, so **11 notes in `assets/index-*.js`** read like "FFX Chapter VII Seymour, Bailey's pick 2026-09-24 (option A, 'All your recommendations')" or "speaker portrait picked by Bailey 2026-09-21". The same provenance prose as the sidecars' `status`.
The only other hits in the 1,291 text files: the old GitHub Pages host name in the "we've moved" note (`baileypillon.github.io`, the legacy address, on purpose) and a font designer's e-mail address in `fonts/rajdhani/OFL.txt`. A fix would drop `note` in the production bundle (a transform on that JSON import, or move the notes to a file nothing imports); it touches shared source data, so it was not done.

## 4. Proof

| What | Result |
|---|---|
| `npx tsc --noEmit` (7.0.2) | clean, after the merge, the coverage commit and FOC46-06 |
| Targeted vitest (access, flash, comfort, pause, save, art-, colour, prep-phone, entrance, settings, apply, dist-, deploy-, critic-, fx-) | 151 files, 2,511 passed, 3 skipped, 0 failed |
| **Full suite, once** (`--maxWorkers=2 --testTimeout=60000`, JSON in the scratch folder) | **1,224 files, 19,144 tests: 19,070 passed, 0 failed, 73 skipped, 1 todo; 0 failing files** (r46-fix's run: 1,215 files, 18,896 tests) |
| `node tools/orphans.mjs` | 36 modules nothing imports, all older and none of this lane's or this fix's (`src/audio/voices/presets`, `src/battle/ffx2/kernel`, `src/sprites`, ...) |
| `node tools/audio/qa.mjs` | 0 cues with findings, 0 sfx findings, 68.87 MB of the 105 MB budget |
| `tools/dist-local-paths.mjs --dir` the build | PASS, 0 hits in 1,291 text files |
| `tools/art-derive.mjs verify --dir` | **PASS**: 3,778 masters (479 WebP, 3,299 PNG, 3,397 pixel-compared), 36 strip thumbnails, art JSON 1,263 checked: 1,261 sidecars each only the fields the game reads, 2 other as they are, 0 problems (239 s) |
| `tools/art-derive.mjs audit --dir` | **PASS**: 1,283 text files read, 0 dangling names; 13 provenance mentions in JSON, not judged (270 before) |
| `tools/art-browser-load.mjs --dir` | **PASS**: 3,863 of 3,863 images load and decode at the master's size in Chromium 153 and WebKit 26.6; living portrait plates 20 of 20 (226 s) |
| The walk: headless Chromium (`PYREFLY_BROWSER=gpu`), `vite preview` on 5501 over the M: build, real keys | **PASS**, see below |
| The lane's two e2e specs (never run by the lane): `accessibility-a2.spec.ts`, `pause.spec.ts` | 7 passed, **3 failed**, all in `accessibility-a2.spec.ts`: the "130 % text size, nothing clipped" layout checks (1600x900, 2000x1012, 390x844). The clipped elements are `ffx-cmd-more--down` ("▼") and `ffx-sensor__chip` ("THUNDER") of the FFX HUD; the files that define them (`CommandMenu*.ts`, `SensorPanel.ts`, `ffx-hud.css`, the phone HUD css, `hud-floor.css`) were changed by **neither** the lane nor the r46 side, and the lane's edit of that spec only moved TEXT SIZE to the new tab, so these are not caused by this merge. Not measured on r46-rc itself (no second build, one tree). For the reviewer |

**The walk** (`D:/Tools/pyrefly-scratch/2026-10-14/walk-r47.mjs`, result `walk/walk-result.json`, frames `walk/*.jpg`; three frames under `docs/screenshots/r47-rc/`):
- *Part A, a fresh desktop profile (1600x900):* title (both rows off: no `data-reduce-flashes`, no `data-colour-vision`); Enter to the board (18 tiles); Enter to FFX Chapter I's party prep (6 tabs, each clicked); back, the arrow keys to Chapter IV, Enter to FFX-2's prep (5 tabs, gate pips R, G, B, Y);
  both chapters to their first command menu; Escape; the tab strip reads `member:tidus, member:yuna, member:kimahri, chapter, guide, options, accessibility, controls, music` (ACCESSIBILITY right after OPTIONS); the rows read `textSize=100%, reduceMotion=OFF, reduceFlashes=OFF, lowEffects=OFF, colourVision=OFF`;
  REDUCE FLASHES on by Enter (row ON, `data-reduce-flashes` set, save `reduceFlashes: true`); COLOUR VISION by Right (RED-GREEN, `data-colour-vision="red-green"`, `--cvd-target-ally: #56b4e9`, save `red-green`); **a reload keeps both** (page and save); FFX-2 reads them back as ON and RED-GREEN, Right gives BLUE-YELLOW (`--cvd-gate-g: #00a6a6`), both back to OFF by Left, Left and Enter (attributes gone, save `false` and `off`).
- *Part B, the release-37.1 save export* (written by the live build of 2026-10-04, neither field): loads, both rows OFF, TEXT SIZE 115 % as saved, **all 29 old settings unchanged** after the load.
- *Part C, a 390x844 touch phone with a save that has COLOUR VISION red-green and REDUCE FLASHES on:* the stacked FFX-2 prep page (DRESSPHERES, the Garment Grid section): the four gates as above; with the attribute removed, today's colours, 12 px, no letter.
- *Art JSON:* **120 distinct files requested, every one answered 200**, fetched again: **0 keys outside the list, every body equal to the build's file**. Console errors 0, page errors 0 in the three parts; the only failed requests are `net::ERR_ABORTED` images cancelled by a screen change (pause plates, board plates, backdrops), none of them JSON.

## 5. What the deep review must look at

**1. SAVE DATA (why a deep review is owed).** Two additive `Settings` fields, absent from every stored blob: `reduceFlashes: boolean` (false) and `colourVision: 'off' | 'red-green' | 'blue-yellow'` ('off'); `src/app/saveAccess.ts` holds the type, the stepping and `migrateAccess` (anything else becomes the default; called from `migrateComfort`);
`SaveData.ts` grew by 6 lines; **no `SAVE_VERSION` bump**, no one-time rule. Things to try, with what this note already shows:
- *An old save loads:* `tests/unit/access-save.test.ts` (the release-37.1 export, the r43-rc schema, every older export, garbage in both fields) and the browser, Part B above. Try the **live** build's own save in this build, flip both rows, and carry it back to the live build: the settings spread keeps keys a build does not know, so a rollback loses nothing (unit-tested; try it on the real live page).
- *Two tabs merge:* both fields are scalars, so `saveMerge.ts` merges them per key; two open tabs both ways are in `access-save.test.ts`. Try it with two real tabs on the candidate.
- *The fields default off:* a fresh profile has no attribute and no variable (Part A), and `access-off-is-today.test.ts` pins that OFF changes no rule, no pixel and no timing across the build.
- Storage blocked, a reset, a reload applied on `<html>` at construction (`applyComfort`), `migrateAccess` on garbage (`'RED-GREEN'`, `1`, `null`, an object).

**2. REDUCE FLASHES against the 22 sources** (the lane's table) and above all **every cover in play**: the Save Sphere card in Chapter XI (opaque dim ivory, sphere pulse stopped, same 520 / 1700 / 620 ms) and Sinspawn Gui's plate swap and scene seam, with the setting on; and E-PYRE's gather with the setting on (no closing flash).
**3. COLOUR VISION in play**, not only in unit tests: the target brackets and the pool in both games, a Berserk or Curse tint in FFX, the MP numeral in BLUE-YELLOW, the Spherechange wheel and flourish in FFX-2, the Garment Grid in party prep on a desktop and on a phone (this note's addition).
**4. The privacy fix on the LIVE artifact** after the deploy: `art/**/*.json` on the site hold only the ten keys (`node tools/dist-local-paths.mjs` and `art-derive verify` on the candidate say so; the live check is a fetch of a few, plus the artifact manifest), no `claude.ai` anywhere, and the decision on the 11 `face-crops.json` notes (section 3).
**5. Open, not caused by this branch:** the three 130 % TEXT SIZE e2e failures (section 4), the PREP-A stat deltas' colour pair, the Fayth camera's reading of REDUCE MOTION, and the lane's own "not done" list ([r44-access](r44-access.md): the first-launch comfort card, key remapping, FF7's own effect layer, scene lighting flicker, a flash measurement of a twelve-hit Attack Reels).

## 6. Where things are

- Build: `M:/pyrefly-builds/r47/dist` (one dist, built off D: on the coordinator's word that D: was full; cross-drive output worked). Not deleted, not moved. Serve it with `BASE_PATH=/ node node_modules/vite/bin/vite.js preview --outDir M:/pyrefly-builds/r47/dist --port 5501`.
- Scratch: `D:/Tools/pyrefly-scratch/2026-10-14/` (`r47-suite.json`, `walk-r47.mjs`, `walk/`, `survey-*.mjs` and their JSON, `build-r47.log`, `negative-control.mjs`, `scan-names.mjs`).
- Servers: the two preview servers this lane started (PIDs 53192 and 63384, port 5501) were stopped by PID. A `PAUSE` file for the overnight art runner already existed when the walk began; it was not created by this lane and was left alone.
- Nothing under `public/art` was written. No file was deleted. `D:/pyrefly-art-r44` is read only through the junction.
- Records not touched: NOW.md, DECISIONS.md, ACTIONS.md and the critic obligations are the driver's record pass (the lane's note says the same).
