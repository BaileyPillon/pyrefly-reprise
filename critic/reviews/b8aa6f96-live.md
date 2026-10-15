```text
Build / artifact / target version: main b8aa6f96 / bundle DA6NOD0r / artifactHash 916e84ca631eab30430f94b6d5424b2f03756a5402f978a282ff2f31d3320d8a (deployed 2026-10-14T10:08:44Z from D:/pyrefly-r47 under the owner override, replacing ca9fd0b4); a live check has no approved target version
Review: live
Deployment: PASS (the exact artifact is what the site serves and every flow the change names ran on it: no defect, no finding)
Changed area: NOT APPLICABLE (a live review does not assess it; the deep review that preceded this deploy, critic/rounds/round-26.json, read changedArea UNVERIFIED with ship SHIP, and the build went out under the owner override)
Ship: N/A (a live review does not gate ship)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: none. Nothing on live differs from the artifact and nothing the change names misbehaves. Two things a reader could mistake for defects, both by design and both explained under 2.6 and 2.7: the FFX card prints its SECOND hint in the short form (so "no White or Black Magic." shows only when Silence is the first hint), and FFX Chapter I plays no scene cue at its first spoken line (its script opens with music(null)).
Coverage: tested = artifact identity (5221 of 5222 files byte-identical, content types, live manifest, the page as a browser receives it, the 4 removed files 404 at both addresses; all 1291 text files downloaded from live and run through the project's gate for local paths, claude.ai links and sidecar keys: 0 hits, with a made-up control the gate refuses; /__ffx-local/ 404); the art JSON sidecars (all 1261 carry only the ten game fields; 30 picked at random and fetched fresh equal the master's ten); the ACCESSIBILITY tab in FFX Chapter I (keys) and FFX-2 Chapter IV (mouse): five rows, REDUCE FLASHES on, undo, on, COLOUR VISION red-green, blue-yellow, back, TEXT SIZE 115 and back, a real hit flash read off and on in both games, the profile saved, reload (settings, progress and the pause of the new session); COLOUR VISION as pixels on the phone Party Prep gate pips (off and on, 390x844 touch) and on the FFX ally target bracket; Rikku's changed paintings as the FFX-2 Chapter VI page loaded them, against both masters, one decoded by the page's own canvas, plus the unchanged Chapter V controls and the 8 dresspheres' idle files; the FFX Silence card in Chapters I and II (debug-assisted status); LV43-2 on 5 runs; Escape, H, P pause tests; console and 404 sweep: 0 and 0. reused = none. not tested = see section 4 (the stage's canvas flashes, the other colour groups, the phone pause by touch, the command rules as played, the full upgrade matrix, audio by ear).
Next required review and why: the focused and deep obligations in critic/pending/b8aa6f96.json stay open (a live review settles neither; the deep one carries the debt of 56 earlier builds and went out under the owner override); the owner's ear for audio (CHK-B1) is not part of this build's change and stays as it was
Elapsed review time / repeated work avoided: about 60 minutes, 31 of them the byte comparison (10.3 GB, 16-way), which ran while I wrote and shook down the smoke; the smoke that is reported ran after it finished (7.4 minutes, none of my own traffic running beside it; other sessions on this machine are not visible to me); five shakedown runs and three probes made while the two shared the link are counted nowhere; the previous live check's wrapper and the shape of its smoke were reused (re-pointed, rebuilt around this change), none of its results
```

Browser: headless Chromium driven by Playwright from node, **PYREFLY_BROWSER=gpu** (the five reported first-menu captures read mean luminance 76.7 to 115.9, so no black canvas and no fallback), a fresh browser and a fresh context per part (storage empty: `storageAtStart` 0 on every chapter run, an empty HTTP cache), a cache-busting query on every page URL. 1600x900 with real key presses and real mouse clicks; 390x844 with `hasTouch`, `isMobile`, device scale 2 and an Android phone user agent, real taps. Every capture asserts the screen (and `awaitingMenu` for a battle) first (CHK-016). The one phone part that needed a saved setting (COLOUR VISION on) was handed the profile the FFX run had saved, as a Playwright storage state copied from that run (the settings arrived by a reload of the saved blob, not by a debug call). Debug-assisted steps, named where they occur: the FFX Silence status (2.6) and the page-side logger that records each hit flash when its class lands (2.2).

## 1. Exact artifact (CHK-017): PASS

Run in D:/pyrefly-r47: `verifyLive()` from `tools/artifact-manifest.mjs` with `--full` semantics (the marker's planned review is deep) against `critic/artifacts/b8aa6f96.json`, through the 16-way prefetch wrapper `critic/reviews/b8aa6f96-live-verify.mjs` (the previous check's wrapper, re-pointed). Every file except the host-read `_headers` was fetched with a `?v=<time>` query; its sha256 and content type were compared with the manifest, in order, with the bodies dropped once hashed (nothing large on disk).

| | |
|---|---|
| Files in the artifact / compared | 5222 / 5221 (all but `_headers`) |
| Mismatched / missing / wrong content type / errors | 0 / 0 / 0 / 0 |
| Live `artifact-manifest.json` | match (hash 916e84ca...) |
| `index.html` as a browser receives it | identical once Cloudflare's Web Analytics beacon (366 bytes and the line feed) is removed |
| Hashed file caching | `assets/exp-fayth-table-CUPJDSuj.js`: public, max-age=31536000, immutable |
| Fetched / time | 10279 MB in 1864 s (31 minutes; the link was shared with five shakedown runs and three probes); finished 2026-10-14T11:05:20Z; result `critic/artifacts/b8aa6f96-verify-live.json` |
| Against the previous build ca9fd0b4 | 4 files added (`index-DA6NOD0r.js`, `index-D6xsaimI.css`, `worker-CCGsjJeK.js`, `exp-fayth-table-CUPJDSuj.js`), 1706 changed (1262 art JSON sidecars, 443 art images, `index.html`), 4 removed (the old bundle, stylesheet, worker and fayth table): the 4 removed files answer 404 at both addresses (`echoesofspira.com` and `echoes-of-spira.baileypillon.workers.dev`), and both addresses serve `index-DA6NOD0r.js` and `index-D6xsaimI.css` |
| Manifest decode notes | the two notes of the manifest (`art/portrait-parts/paine/1x/eyeR-catch.png` and `2x`: "decodes to a single flat colour") are the same two the previous build's manifest carries: not a difference between this build and live |

The 443 changed art images are exactly Rikku's: `art/characters/rikku-<dressphere>/` for the eight dresspheres (Alchemist 64, Berserker 48, Black Mage 64, Gunner 68, Lady Luck 15, Songstress 60, Thief 64, White Mage 60), 410 PNG and 33 WebP; no other image changed.

## 2. Real-input smoke (CHK-016): PASS

`critic/reviews/b8aa6f96-live-smoke.mjs` (7 browser parts, 96 assertions, 0 failed, 7.4 minutes, 2026-10-14T11:17Z to 11:25Z) and `critic/reviews/b8aa6f96-live-static.mjs` (no browser, 17 assertions, 0 failed). Console errors 0, HTTP 404s 0, audio requests 103 (all 200, 28 distinct files, every one a file of the artifact, none of the three retired files), image or audio URLs answered as HTML 0.

### 2.1 The ACCESSIBILITY tab (both games): positive path, undo path, cancel path

| | FFX Chapter I (Seymour Flux), keys | FFX-2 Chapter IV (Bahamut), mouse |
|---|---|---|
| Reached by | the real key E from the first member's tab: Tidus, Yuna, Kimahri, Chapter, Guide, Options, Accessibility (6 presses; tabs after it: Controls, Music) | one real click on the tab (strip: Yuna, Rikku, Paine, Chapter, Guide, Options, Accessibility, Controls, Music) |
| Rows read | TEXT SIZE 100%, REDUCE MOTION OFF, REDUCE FLASHES OFF, LOW EFFECTS OFF, COLOUR VISION OFF, in that order, on a fresh profile (no `data-reduce-flashes`, no `data-colour-vision`, no `--cvd-*` variable on `<html>`, saved `reduceFlashes` false, `colourVision` off) | the same five rows, the same values |
| REDUCE FLASHES | Enter: ON (`data-reduce-flashes` on `<html>`, save true); Enter again: OFF (attribute gone, save false: the undo path); Enter: ON | a click each: ON, OFF, ON, the same readings |
| COLOUR VISION | ArrowRight: RED-GREEN (`data-colour-vision="red-green"`, ally `#56b4e9`, self `#f4f1e8`, gates `#d55e00` `#009e73` `#0072b2` `#f0e442`, save red-green); ArrowRight: BLUE-YELLOW (gate green `#00a6a6`, gate blue `#7a4fd0`, MP `#b48cf0`); ArrowLeft: back to RED-GREEN | a click: RED-GREEN, a click: BLUE-YELLOW, two clicks (wrap round through OFF): RED-GREEN |
| TEXT SIZE (the row moved into this tab) | ArrowRight: 115% (`data-text-size="115"`, save 1.15); ArrowLeft: 100% | not repeated |
| Leaving | Escape twice: back on the battle screen, both settings still on | the same |

Shots: `access-ffx-access-tab.jpg` (all OFF), `access-ffx-access-tab-on.jpg` (REDUCE FLASHES ON, COLOUR VISION RED-GREEN), `access-ffx-access-tab-after-reload.jpg`, `access-ffx2-access-tab.jpg` and `access-ffx2-access-tab-on.jpg`.

### 2.2 A real hit flash, read with the setting off and on (both games)

A page-side logger (installed before the one navigation) records, for every `.ffx-stat--hurt` (FFX party card) and `.ffx2-hit-flash` (FFX-2 girl's card) the moment the class lands, what the browser computes for it. The hits are real ones: plain Enter presses (Attack, default target) until an enemy hit a member.

| | animation with REDUCE FLASHES off | animation with REDUCE FLASHES on (and COLOUR VISION red-green) |
|---|---|---|
| FFX, `.ffx-stat--hurt`, Chapter I | `ffx-hurt-flash`, 0.3s, ease (the first hit came after 12.5 s of play, 8 key presses) | `ffx-hurt-soft`, 0.6s, ease-out (the first hit after the pause came after 3.4 s of play, 2 key presses) |
| FFX-2, `.ffx2-hit-flash`, Chapter IV | `ffx2-hit-flash`, 0.2s, ease-out | `ffx2-hit-soft`, 0.5s, ease-out |

These are the stylesheet's own two names and times (`comfort-flashes.css`: one 0.3 s flash of +60 % brightness becomes one 0.6 s fade of +21 %; one 0.2 s flash of +80 % becomes one 0.5 s fade of +28 %). Read as computed on a real hit, with the control (off) taken first in the same battle.

### 2.3 A colour group, read as pixels (both games)

- **Gate pips on the phone Party Prep (FFX-2 only), 390x844, touch.** Chapter IV, Dresspheres tab opened by a real tap, the Garment Grid section (Yuna, "Protection Halo") opened by a real tap, four gate pips.
  - COLOUR VISION off (fresh profile, the control): red `rgb(201, 58, 66)`, green `rgb(117, 145, 58)`, blue `rgb(58, 120, 190)`, yellow `rgb(227, 185, 74)`; 12 px diamonds (layout size), no letter (`::after` content `none`).
  - COLOUR VISION red-green (the saved profile of the FFX run, read back on a new context: `data-colour-vision="red-green"`, REDUCE FLASHES on): red `rgb(213, 94, 0)`, green `rgb(0, 158, 115)`, blue `rgb(0, 114, 178)`, yellow `rgb(240, 228, 66)` (the Okabe-Ito four); 16 px tiles; `::after` content `"R"`, `"G"`, `"B"`, `"Y"`. No side scroll. Shots `phone-gates-off-dresspheres.jpg`, `phone-gates-on-dresspheres.jpg`.
- **The target bracket on the FFX battle (both games draw it).** Chapter I, Items, Phoenix Down (it aims at a fallen member, so the bracket is on an ally): `.ffx-target--ally` reads `--ffx-mark` `#56b4e9` and its corner `::after` (the second cue, a plus) is 7 px; the enemy brackets keep their gold `#f2c21e`, the user's own bracket reads paper `#f4f1e8`; Escape backs out to the command menu (the cancel path). Shot `access-ffx-ally-bracket.jpg`.

### 2.4 Rikku's corrected dresspheres (FFX-2 only)

The FFX-2 Chapter VI page (Rikku in Thief) requested 14 of her changed Thief files and the Gunner's `twirl-mid`; each was saved as the browser received it and measured by `b8aa6f96-rikku-measure.py` (the colour round's own statistic: mean HSV saturation of the opaque pixels on the 256 px thumbnail) against the corrected master in `D:/pyrefly-art-r47` and the old one in `D:/pyrefly-art-r44`.

| served file (as the page loaded it) | old master r44 | served = corrected master r47 | pixel-identical to r47 | differs from r44 |
|---|---|---|---|---|
| thief idle / ready / attack (WebP) / cast / item / hurt / ko / victory / defend (WebP) / sleep / critical / follow / twirl-start / twirl-going | 0.657 / 0.651 / 0.682 / 0.619 / 0.582 / 0.625 / 0.659 / 0.498 / 0.738 / 0.628 / 0.771 / 0.595 / 0.610 / 0.652 | 0.584 / 0.559 / 0.589 / 0.546 / 0.519 / 0.553 / 0.563 / 0.462 / 0.619 / 0.544 / 0.651 / 0.514 / 0.517 / 0.559 | 14 of 14 (every RGBA pixel) | 14 of 14 |
| gunner twirl-mid | 0.658 | 0.494 | yes | yes |

The page's own decode (fetch, `createImageBitmap`, canvas `getImageData`, in the running page) of `rikku-thief/idle.png` reads mean saturation 0.600109 on the full-size picture; PIL on the saved served file reads 0.600115 (within 0.003 by the check; the browser and PIL agree). The FFX-2 Chapter V page (Rikku in Dark Knight, not rewritten) loaded 13 unchanged files plus the changed Gunner `twirl-mid`: the 13 equal BOTH masters (the control), `twirl-mid` equals r47 and differs from r44 (0.658 to 0.494).

The static part fetched the idle paintings of the ten Rikku folders from live (1x for all, 2x for the eight changed ones): each served file's sha256 equals the manifest's; the 15 changed ones equal the corrected master pixel for pixel and differ from the old one (124,512 to 994,145 visible pixels each) and their mean saturation is lower: Songstress 0.743 to 0.574, Alchemist 0.746 to 0.563, Thief 0.657 to 0.584, Berserker 0.796 to 0.667, Black Mage 0.678 to 0.616, Gunner 0.681 to 0.494, Lady Luck 0.708 to 0.559, White Mage 0.614 to 0.452 (the numbers of the handoff's table, `docs/handoff/r47-rikku-colour.md`); Dark Knight, Warrior and her FFX painting equal both masters.

### 2.5 The art JSON sidecars and the text of the site (both games)

- All 1264 art JSON files of the artifact: 1261 painting sidecars and the three that are not (`art/manifest.json`, `art/portrait-parts/manifest.json`, `art/derived.json`; the project's own `isSidecarJson`). Every one of the 1261, read from the live copies (hash-checked), is a JSON object whose top-level keys are among the ten the game reads (`width`, `height`, `baselineY`, `scale`, `anchorY`, `facing`, `seed`, `prompt`, `focal`, `headTop`; the project's `SIDECAR_FIELDS` equals that list); key counts: width 1198, height 1198, baselineY 1186, facing 1181, seed 1089, prompt 1027, scale 717, anchorY 185, headTop 68, focal 35; 3 sidecars are `{}` (nothing of the ten in the master).
- 30 sidecars picked at random (`crypto.randomInt`, no repeats) and fetched fresh from live with a cache-busting query: 30 of 30 answered 200 `application/json`, are objects, hold no key outside the ten, hold exactly the master's ten fields with the master's values (compared with `D:/pyrefly-art-r47`), carry no claude.ai link; the masters of all 30 hold keys the live files lack (the control: the cut is real). The 30 paths are in `live-b8aa6f96/static.json` (`sidecars.random`).
- All 1291 text files the artifact lists (js, json, css, html: 8.2 MB) downloaded from live: 1291 of 1291 sha256 equal the manifest. The project's gate `node tools/dist-local-paths.mjs --dir <the download> --json` (a drive or profile path, a link to claude.ai, a sidecar key outside the list) scanned 1291 files: exit 0, 0 hits. Positive control: the same gate over a made-up folder (a drive path, a key outside the list, a claude.ai link) exits 1 with 4 hits of the kinds `drive`, `sidecar-key`, `link`. `/__ffx-local/` and `/__ffx-local/manifest.json` answer 404 at both addresses. The previous live check's polish note on this subject (FOC46-06: sidecars still carried provenance prose, private page links and the owner's first name) is no longer observed on live: no sidecar of the 1261 holds a key outside the ten, and the gate finds no claude.ai link in any of the 1291 text files (the 30 fetched fresh carry none either).

### 2.6 The FFX Silence card (FFX only; the command rules' visible half)

The live bundle carries the new card words and not the old: `assets/index-DA6NOD0r.js` holds "no White or Black Magic." and no "White or Black Magic and no Summon"; the FFX-2 card ("no White Magic, Black Magic or Arcana") is still its own.

On the running pages, with BATTLE HELP on and a decision open, a Silence status was put on a living member **through the debug API's battle state (debug-assisted: no early FFX enemy casts Silence on the party)**, and the HUD's card was read: `GUIDE SILENCE Tidus is silenced: no White or Black Magic. Echo Screen, Esuna or a Remedy cures it.` in Chapter I and in Chapter II, no mention of Summon; the status was removed afterwards (the card went back to what it was). Shots `access-ffx-silence-card.jpg`, `ffx-ch02-fast-silence-card.jpg`. By design the card prints the first hint in full and the second short (`statusHintCard.hintCardHtml`; order Zombie, Sleep, Silence, Curse), so the new words show when Silence is first: in Chapter I a member (Yuna) was already a Zombie by the first menu, and with both hints the card read the Zombie rule in full and "Tidus is silenced: Echo Screen cures it." short (an earlier, uncounted run of mine read exactly that); for the counted read that Zombie was set aside on the party (debug-assisted) and restored. Chapter II needed no set-aside.

### 2.7 Chapters from the title to the first battle menu, real keys, every audio request recorded; LV43-2

| Run | Game and chapter | First line | First menu | Audio |
|---|---|---|---|---|
| access-ffx | FFX I, Seymour Flux | at 4.0 s, Kimahri; no cue playing (by design) | 12.3 s after the battle screen; `boss-seymour` (the first formation's start cue) | 11 requests, all 200 audio/mpeg or json |
| access-ffx2 | FFX-2 IV, Bahamut | at 3.9 s, Rikku; `scene-bevelle-underground` playing, gain 0.13 | 11.3 s; `boss-bahamut` | 11, all 200 |
| rikku-ch06 | FFX-2 VI, the Chateau | at 3.9 s, Rikku; `scene-chateau-leblanc` playing, gain 0.15 | 9.8 s; `boss-leblanc` | 10, all 200 |
| rikku-ch05 | FFX-2 V, Vegnagun and Shuyin | at 6.0 s, Nooj; `scene-farplane` playing, gain 1 | 10.7 s; `boss-vegnagun` | 12, all 200 |
| ffx-ch02-fast | FFX II, Yunalesca | at 3.1 s, Braska; `scene-zanarkand-dome` playing, gain 1 | 8.4 s; `boss-challenge` | 11, all 200 |

In each run the prerendered mp3 of the playing cue was requested and answered 200 `audio/mpeg` (not the procedural fallback), the per-game sound packs fetched were that game's own (`parity-ffx-*` in FFX, `parity-ffx2-*` in FFX-2) and none of the other game's, and no retired file was asked for.

**LV43-2, the scene cue at the first spoken line, counted on these 5 runs:** playing in 4 of 5: FFX II 1 of 1, FFX-2 IV 1 of 1, V 1 of 1, VI 1 of 1; FFX Chapter I 0 of 1, whose opening script begins with `music(null)` (`src/story/scripts/seymour-flux.ts` line 69; the scene bed `scene-gagazet` enters later, line 105), so no scene cue is meant to play there (the previous live check read Chapter I the same way: 0 of 2). On the saturated link of my uncounted shakedowns the cue was sometimes not yet loaded at the first line (the mp3 had not arrived); with an idle link it was playing every time it should.

### 2.8 Pause, hide, resume

FFX Chapter I and FFX-2 Chapter IV: Escape opens the pause, H hides the panels (page text 938 to 583 characters in FFX, 1841 to 1444 in FFX-2) and H restores them (back to 938 and 1841), Escape resumes (back on `battle`), P pauses, P resumes: all passed.

## 3. Reload (CHK-024, light): PASS

FFX Chapter I, fresh profile: both new settings changed (REDUCE FLASHES on, COLOUR VISION red-green) and progress made in the session (7 coach tips seen, the chapter's record); the page reloaded. Before any input the page read both settings back from the save: `data-reduce-flashes` and `data-colour-vision="red-green"` on `<html>` with the `--cvd-*` variables, the saved settings object equal key for key to the one before the reload (`reduceFlashes` true, `colourVision` red-green, `reduceMotion` false, `lowEffects` false, `textSize` 1), and the coach tips and chapter records the same. In the new session, from the title to the first menu again, the pause screen's ACCESSIBILITY tab read REDUCE FLASHES ON and COLOUR VISION RED-GREEN. The saved profile was also read back on a separate context (the phone run: attributes and variables set before any input). The full upgrade matrix is NOT part of this pass (section 4).

## 4. Not tested

- The **stage's canvas flashes** under REDUCE FLASHES (the screen wash, the flash on a fighter, the bloom at a blow, the cutscene cover that hides a swap) and the **other HUD sources** of the stylesheet (the group-target bracket pulse, the big-attack warning plate, the Overdrive timing flash, FFX-2's ready-gauge shimmer, the chain-20 veil): only the party card's and the girl's card's hit flash were read, on a real hit each.
- The **other COLOUR VISION groups**: the Berserk and Curse figure tint with the initial over the head (FFX), the MP numeral (both), the Spherechange wheel and flourish gates (FFX-2); BLUE-YELLOW was read as the `--cvd-*` variables the HUD and stylesheet read, not as pixels on a bracket, pip or numeral.
- **TEXT SIZE** at 130 % and the 115 % pause as a picture; REDUCE MOTION and LOW EFFECTS (listed, valued, not toggled); the tab **by touch on a phone** (the phone runs took the saved profile; `pause-phone.css` was read as a stylesheet, not as a pause screen on a 390x844 touch page).
- The **FFX command rules as played**: a Silenced Yuna's Summon row no longer greyed, a Silenced member's Scan greyed with "Silenced", "Out of reach", Doublecast's per-cast checks, the MP and cost gate. They need a party with Yuna's summons, a silenced member or a long fight; the evidence for them is the deep review's per-seed comparison with live (`critic/rounds/round-26.json`: FFX-2 per-seed identical, the paired FFX bench identical seed by seed). Only the card's words were read on live.
- **Rikku on the stage in the other dresspheres**: Chapter VI shows her in Thief and Chapter V in Dark Knight (both read); Alchemist, Berserker, Black Mage, Gunner, Lady Luck, Songstress and White Mage (reachable by a Spherechange in a longer fight) were read as served files (idle, 1x and 2x; the Gunner also as `twirl-mid` on the page) against the masters, not as paintings on the stage; the 3x and 4x tiers and the other 400 or so changed files were compared byte for byte by the exact-artifact part (their sha256 equals the manifest's) and not measured.
- The **hidden Fayth chapter** (no Fayth run in this pass; the previous live check's FOC46-04 note, a missing backdrop plate, was therefore not re-observed), a **chapter win by real input** and the **results screens** (no results run: nothing in this build's change touches them).
- The **full upgrade matrix** (CHK-024 full): a save written by the previous build migrating forward, truncated storage, the reset flow. The deep review proved the save-data side before the deploy (an old live save loads with both new fields off, a reload keeps them, two tabs merge per key); here only the light reload above ran on live.
- **Audio by ear** (nobody here can hear: a cue name and a non-zero gain are not sound), WebKit or Safari, a real phone, a real controller, other sizes.

## 5. Reproduction

All in `D:/pyrefly-r47`, scratch in `D:/Tools/pyrefly-scratch/2026-10-14/live-b8aa6f96/` (screenshots under `shots/`, the smoke's json `live-smoke.json`, the static part's `static.json`, the Rikku measures `rikku-*-measure.json`, the progress file `critic/reviews/PROGRESS-live-b8aa6f96.md`).

```
node critic/reviews/b8aa6f96-live-verify.mjs                      # the byte comparison, writes critic/artifacts/b8aa6f96-verify-live.json
node critic/reviews/b8aa6f96-live-static.mjs                      # pages, text download and the path gate, sidecars, Rikku idle files (python -I b8aa6f96-rikku-measure.py)
PYREFLY_BROWSER=gpu node critic/reviews/b8aa6f96-live-smoke.mjs   # the browser parts; ONLY=access-ffx,phone-gates-on picks parts
```

Honest notes on the method: the Silence status and its Zombie set-aside are debug-assisted (2.6); the phone run with COLOUR VISION on was given the profile the FFX run saved (a storage state copy); the hit flashes are read by a page-side logger, not by eye; the first attempts at the Silence read and the ally bracket in my uncounted shakedowns missed because of my own script (a status put on a member who was already knocked out; the user's own bracket read as the ally one), both corrected before the counted run. A PAUSE file of the overnight art runner that I did not make was already in place (since 04:28 local) and was left exactly as it was; I made and renamed none.
